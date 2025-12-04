/**
 * @fileoverview Loan Payments API Route
 * @description Handles loan payment processing and payment history
 * @version 1.0.0
 * @created 2025-11-23
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Loan, Company, Bank } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { z } from 'zod';

// Validation schema for payment request
const paymentSchema = z.object({
  loanId: z.string().min(1, 'Loan ID is required'),
  amount: z.number().positive('Payment amount must be positive'),
  paymentMethod: z.enum(['AutoPay', 'Manual', 'Early']).default('Manual')
});

/**
 * POST /api/banking/payments
 * Process a payment on a loan
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = paymentSchema.safeParse(body);

    if (!validationResult.success) {
      return createErrorResponse('Validation failed', 'VALIDATION_ERROR', 400, validationResult.error.issues);
    }

    const { loanId, amount, paymentMethod } = validationResult.data;

    // Connect to database
    await connectDB();

    // Find the loan and verify ownership
    const loan = await Loan.findById(loanId).populate('bankId');
    if (!loan) {
      return createErrorResponse('Loan not found', 'NOT_FOUND', 404);
    }

    // Verify company ownership
    const company = await Company.findOne({
      _id: loan.companyId,
      userId: session.user.id
    });

    if (!company) {
      return createErrorResponse('Company not found or access denied', 'NOT_FOUND', 404);
    }

    // Check if loan is active
    if (loan.status !== 'Active') {
      return createErrorResponse(`Cannot make payment on ${loan.status.toLowerCase()} loan`, 'INVALID_LOAN_STATUS', 400);
    }

    // Check if payment amount is reasonable
    if (amount > loan.remainingBalance) {
      return createErrorResponse('Payment amount exceeds remaining balance', 'PAYMENT_EXCEEDS_BALANCE', 400, {
        remainingBalance: loan.remainingBalance
      });
    }

    // Check if company has enough cash
    if (company.cash < amount) {
      return createErrorResponse('Insufficient funds', 'INSUFFICIENT_FUNDS', 400, {
        availableCash: company.cash,
        requiredAmount: amount
      });
    }

    // Process the payment
    const paymentRecord = {
      amount,
      date: new Date(),
      method: paymentMethod,
      principalPaid: Math.min(amount, loan.remainingBalance),
      interestPaid: 0, // Simplified - in real implementation would calculate interest portion
      remainingBalanceAfterPayment: Math.max(0, loan.remainingBalance - amount)
    };

    // Update loan
    loan.payments.push(paymentRecord);
    loan.remainingBalance = paymentRecord.remainingBalanceAfterPayment;

    // Check if loan is paid off
    if (loan.remainingBalance === 0) {
      loan.status = 'PaidOff';
      loan.paidOffDate = new Date();
    }

    // Update next payment due date (30 days from now)
    loan.nextPaymentDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await loan.save();

    // Update company cash and debt
    company.cash -= amount;
    company.totalDebt = Math.max(0, (company.totalDebt || 0) - paymentRecord.principalPaid);
    await company.save();

    // Update bank capital (loans paid back increase bank capital)
    if (loan.bankId) {
      const bank = await Bank.findById(loan.bankId);
      if (bank) {
        bank.availableCapital += paymentRecord.principalPaid;
        await bank.save();
      }
    }

    return createSuccessResponse({
      payment: {
        id: loan.payments[loan.payments.length - 1]._id,
        loanId: loan._id,
        amount,
        date: paymentRecord.date,
        method: paymentMethod,
        principalPaid: paymentRecord.principalPaid,
        remainingBalance: loan.remainingBalance,
        loanStatus: loan.status
      },
      message: loan.status === 'PaidOff' ? 'Loan paid off completely!' : 'Payment processed successfully'
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}