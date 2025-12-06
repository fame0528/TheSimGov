/**
 * @file /api/banking/player/bank-loans/[id]/payment/route.ts
 * @description API endpoint for processing loan payments
 *
 * OVERVIEW:
 * This route handles payment processing for loans issued by the player's bank.
 * NPCs make payments automatically based on game simulation, but this endpoint
 * allows manual triggering for testing or admin purposes.
 *
 * Endpoints:
 * - POST: Process a loan payment (simulate NPC payment)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { connectDB, BankLoan, BankSettings } from '@/lib/db';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/utils/apiResponse';
import { getBaseDefaultRate } from '@/lib/game/banking/defaultCalculator';

// ============================================================================
// Validation Schemas
// ============================================================================

const processPaymentSchema = z.object({
  // Optional: specify payment details, otherwise use scheduled amount
  amount: z.number().min(0.01).optional(),
  isPartial: z.boolean().default(false),
  // For simulation: force outcomes
  forceDefault: z.boolean().default(false),
  forceLate: z.boolean().default(false),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine if payment is on time based on random chance and borrower profile
 */
function determinePaymentTiming(
  creditScore: number,
  paymentHistory: { onTime: boolean }[],
  forceLate: boolean
): { onTime: boolean; daysLate: number } {
  if (forceLate) {
    return { onTime: false, daysLate: Math.floor(Math.random() * 15) + 1 };
  }

  // Higher credit score = more likely to pay on time
  const onTimeProbability = 0.5 + (creditScore - 300) / 1100; // 50% at 300, 100% at 850

  // Payment history affects probability
  const recentPayments = paymentHistory.slice(-6);
  const recentOnTimeRate = recentPayments.length > 0
    ? recentPayments.filter(p => p.onTime).length / recentPayments.length
    : 0.8;

  const adjustedProbability = onTimeProbability * 0.7 + recentOnTimeRate * 0.3;

  const isOnTime = Math.random() < adjustedProbability;

  if (isOnTime) {
    return { onTime: true, daysLate: 0 };
  }

  // Late payments: 1-30 days late
  const daysLate = Math.floor(Math.random() * 30) + 1;
  return { onTime: false, daysLate };
}

/**
 * Determine if borrower defaults on this payment
 */
function determineDefault(
  creditScore: number,
  paymentHistory: { onTime: boolean }[],
  missedPayments: number,
  forceDefault: boolean
): boolean {
  if (forceDefault) return true;

  // Base default probability from credit score
  const baseDefaultProb = getBaseDefaultRate(creditScore);

  // Increase probability with more missed/late payments
  const latePayments = paymentHistory.filter(p => !p.onTime).length;
  const latePaymentFactor = 1 + (latePayments * 0.1); // 10% increase per late payment

  // Missed payments dramatically increase default risk
  const missedPaymentFactor = 1 + (missedPayments * 0.5); // 50% increase per missed

  const finalDefaultProb = Math.min(
    0.95,
    baseDefaultProb * latePaymentFactor * missedPaymentFactor
  );

  return Math.random() < finalDefaultProb;
}

// ============================================================================
// POST Handler - Process payment
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = processPaymentSchema.safeParse(body);

    if (!validationResult.success) {
      return createErrorResponse(
        `Invalid payment data: ${validationResult.error.message}`,
        'VALIDATION_ERROR',
        400
      );
    }

    const { amount, isPartial, forceDefault, forceLate } = validationResult.data;

    // Get the loan
    const loan = await BankLoan.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!loan) {
      return createErrorResponse('Loan not found', 'NOT_FOUND', 404);
    }

    // Check loan status
    if (loan.status !== 'ACTIVE') {
      return createErrorResponse(
        `Cannot process payment for loan with status "${loan.status}". Loan must be ACTIVE.`,
        'INVALID_STATE',
        400
      );
    }

    // Calculate payment amounts
    const paymentNumber = (loan.payments?.length || 0) + 1;
    const scheduledPayment = loan.monthlyPayment;
    const actualPayment = amount || scheduledPayment;

    // Check for default
    const missedPayments = loan.missedPayments || 0;
    const shouldDefault = determineDefault(
      loan.borrowerCreditScore,
      loan.payments || [],
      missedPayments,
      forceDefault
    );

    if (shouldDefault) {
      // Process default
      loan.status = 'DEFAULTED';
      loan.defaultDate = new Date();
      await loan.save();

      // Update bank settings with default info
      await BankSettings.findOneAndUpdate(
        { userId: session.user.id },
        { $inc: { totalDefaults: 1, totalDefaultAmount: loan.remainingBalance } }
      );

      return createSuccessResponse({
        status: 'DEFAULTED',
        message: `Borrower ${loan.borrowerName} has defaulted on the loan.`,
        loan: {
          _id: loan._id,
          borrowerName: loan.borrowerName,
          principal: loan.principal,
          remainingBalance: loan.remainingBalance,
          paymentsReceived: loan.payments?.length || 0,
          totalPaid: loan.payments?.reduce(
            (sum: number, p: { principal: number; interest: number }) => 
              sum + p.principal + p.interest,
            0
          ) || 0,
        },
        nextSteps: [
          'You can attempt to collect the debt (future feature)',
          'Write off the loan as a loss using DELETE endpoint',
          'This will affect your bank\'s performance metrics',
        ],
      });
    }

    // Determine payment timing
    const { onTime, daysLate } = determinePaymentTiming(
      loan.borrowerCreditScore,
      loan.payments || [],
      forceLate
    );

    // Calculate interest and principal portions
    const remainingBalance = loan.remainingBalance || loan.principal;
    const interestPortion = remainingBalance * (loan.interestRate / 12);
    const principalPortion = Math.min(
      actualPayment - interestPortion,
      remainingBalance
    );

    // Handle partial payments
    let paymentStatus: 'FULL' | 'PARTIAL' | 'OVERPAYMENT' = 'FULL';
    if (isPartial || actualPayment < scheduledPayment * 0.95) {
      paymentStatus = 'PARTIAL';
    } else if (actualPayment > scheduledPayment * 1.05) {
      paymentStatus = 'OVERPAYMENT';
    }

    // Create payment record
    const payment = {
      paymentNumber,
      date: new Date(),
      amount: actualPayment,
      principal: principalPortion,
      interest: interestPortion,
      onTime,
      daysLate,
      status: paymentStatus,
    };

    // Update loan
    if (!loan.payments) loan.payments = [];
    loan.payments.push(payment);
    loan.remainingBalance = Math.max(0, remainingBalance - principalPortion);
    loan.totalInterestEarned = (loan.totalInterestEarned || 0) + interestPortion;

    // Check if loan is paid off
    if (loan.remainingBalance <= 0.01) { // Allow for floating point errors
      loan.status = 'PAID_OFF';
      loan.paidOffDate = new Date();
    }

    // Update late payment tracking
    if (!onTime) {
      loan.latePayments = (loan.latePayments || 0) + 1;
    }

    await loan.save();

    // Calculate late fee (if applicable)
    const lateFee = !onTime ? actualPayment * 0.05 : 0; // 5% late fee

    return createSuccessResponse({
      status: loan.status === 'PAID_OFF' ? 'LOAN_PAID_OFF' : 'PAYMENT_RECEIVED',
      payment: {
        ...payment,
        lateFee,
        scheduledAmount: scheduledPayment,
        balanceAfterPayment: loan.remainingBalance,
      },
      loan: {
        _id: loan._id,
        borrowerName: loan.borrowerName,
        status: loan.status,
        remainingBalance: loan.remainingBalance,
        totalPayments: loan.payments.length,
        totalInterestEarned: loan.totalInterestEarned,
        paymentsRemaining: loan.termMonths - loan.payments.length,
      },
      message: loan.status === 'PAID_OFF'
        ? `🎉 Loan fully paid off! Total interest earned: $${loan.totalInterestEarned.toFixed(2)}`
        : `Payment ${paymentNumber} received${!onTime ? ` (${daysLate} days late)` : ''}. Remaining balance: $${loan.remainingBalance.toFixed(2)}`,
    });
  } catch (error) {
    console.error('[Bank Loan Payment API] POST error:', error);
    return createErrorResponse('Failed to process payment', 'INTERNAL_ERROR', 500);
  }
}
