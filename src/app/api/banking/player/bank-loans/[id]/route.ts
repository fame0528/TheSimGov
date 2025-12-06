/**
 * @file /api/banking/player/bank-loans/[id]/route.ts
 * @description API endpoints for managing individual bank loans
 *
 * OVERVIEW:
 * This route handles operations on specific loans issued by the player's bank:
 * - GET: Get detailed loan information
 * - DELETE: Write off a defaulted loan
 *
 * Endpoints:
 * - GET /api/banking/player/bank-loans/[id]: Get loan details
 * - DELETE /api/banking/player/bank-loans/[id]: Write off defaulted loan
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB, BankLoan } from '@/lib/db';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/utils/apiResponse';
import { generateAmortizationSchedule } from '@/lib/game/banking/interestCalculator';

// ============================================================================
// GET Handler - Get loan details
// ============================================================================

export async function GET(
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

    const loan = await BankLoan.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!loan) {
      return createErrorResponse('Loan not found', 'NOT_FOUND', 404);
    }

    // Generate amortization schedule
    const amortizationSchedule = generateAmortizationSchedule(
      loan.principal,
      loan.interestRate,
      loan.termMonths
    );
    
    // Get total interest from the last payment in the schedule
    const totalExpectedInterest = amortizationSchedule.length > 0 
      ? amortizationSchedule[amortizationSchedule.length - 1].totalInterest 
      : 0;

    // Calculate payment progress
    const totalPayments = loan.payments?.length || 0;
    const onTimePayments = loan.payments?.filter(
      (p: { onTime: boolean }) => p.onTime
    ).length || 0;
    const latePayments = totalPayments - onTimePayments;

    // Calculate remaining balance
    const totalPaid = loan.payments?.reduce(
      (sum: number, p: { principal: number; interest: number }) => 
        sum + p.principal + p.interest,
      0
    ) || 0;
    const remainingBalance = loan.principal + totalExpectedInterest - totalPaid;

    // Get next payment info
    const nextPaymentNumber = totalPayments + 1;
    const nextPayment = nextPaymentNumber <= loan.termMonths
      ? amortizationSchedule[nextPaymentNumber - 1]
      : null;

    return createSuccessResponse({
      loan: {
        _id: loan._id,
        borrowerName: loan.borrowerName,
        borrowerCreditScore: loan.borrowerCreditScore,
        principal: loan.principal,
        interestRate: loan.interestRate,
        termMonths: loan.termMonths,
        monthlyPayment: loan.monthlyPayment,
        status: loan.status,
        purpose: loan.purpose,
        riskTier: loan.riskTier,
        createdAt: loan.createdAt,
        startDate: loan.startDate,
        endDate: loan.endDate,
      },
      payments: {
        history: loan.payments || [],
        totalPayments,
        onTimePayments,
        latePayments,
        latePaymentPercentage: totalPayments > 0 
          ? (latePayments / totalPayments) * 100 
          : 0,
      },
      financials: {
        totalPaid,
        remainingBalance: Math.max(0, remainingBalance),
        totalInterestEarned: loan.totalInterestEarned || 0,
        expectedTotalInterest: totalExpectedInterest,
        interestProgress: totalExpectedInterest > 0
          ? ((loan.totalInterestEarned || 0) / totalExpectedInterest) * 100
          : 0,
      },
      nextPayment: nextPayment
        ? {
            paymentNumber: nextPaymentNumber,
            dueDate: new Date(
              new Date(loan.startDate).setMonth(
                new Date(loan.startDate).getMonth() + nextPaymentNumber
              )
            ),
            amount: nextPayment.payment,
            principalPortion: nextPayment.principal,
            interestPortion: nextPayment.interest,
          }
        : null,
      amortizationSchedule: amortizationSchedule.slice(0, 12), // First 12 months only
    });
  } catch (error) {
    console.error('[Bank Loan Detail API] GET error:', error);
    return createErrorResponse('Failed to fetch loan details', 'INTERNAL_ERROR', 500);
  }
}

// ============================================================================
// DELETE Handler - Write off defaulted loan
// ============================================================================

export async function DELETE(
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

    const loan = await BankLoan.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!loan) {
      return createErrorResponse('Loan not found', 'NOT_FOUND', 404);
    }

    // Only allow write-off of defaulted loans
    if (loan.status !== 'DEFAULTED') {
      return createErrorResponse(
        `Cannot write off loan with status "${loan.status}". Only DEFAULTED loans can be written off.`,
        'INVALID_STATE',
        400
      );
    }

    // Calculate loss
    const totalPaid = loan.payments?.reduce(
      (sum: number, p: { principal: number; interest: number }) => 
        sum + p.principal + p.interest,
      0
    ) || 0;
    const lossAmount = loan.principal - totalPaid;

    // Update loan status
    loan.status = 'WRITTEN_OFF';
    loan.writeOffDate = new Date();
    loan.writeOffAmount = lossAmount;
    await loan.save();

    return createSuccessResponse({
      message: `Loan written off. Loss: $${lossAmount.toLocaleString()}`,
      loan: {
        _id: loan._id,
        borrowerName: loan.borrowerName,
        principal: loan.principal,
        totalPaid,
        lossAmount,
        status: loan.status,
        writeOffDate: loan.writeOffDate,
      },
    });
  } catch (error) {
    console.error('[Bank Loan Detail API] DELETE error:', error);
    return createErrorResponse('Failed to write off loan', 'INTERNAL_ERROR', 500);
  }
}
