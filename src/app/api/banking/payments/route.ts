/**
 * @fileoverview Loan Payments API Route
 * @description Handles loan payment processing and payment history
 * @version 1.0.0
 * @created 2025-11-23
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Loan, Company, Bank } from '@/lib/db';
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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = paymentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { loanId, amount, paymentMethod } = validationResult.data;

    // Connect to database
    await connectDB();

    // Find the loan and verify ownership
    const loan = await Loan.findById(loanId).populate('bankId');
    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }

    // Verify company ownership
    const company = await Company.findOne({
      _id: loan.companyId,
      userId: session.user.id
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found or access denied' },
        { status: 404 }
      );
    }

    // Check if loan is active
    if (loan.status !== 'Active') {
      return NextResponse.json(
        { error: `Cannot make payment on ${loan.status.toLowerCase()} loan` },
        { status: 400 }
      );
    }

    // Check if payment amount is reasonable
    if (amount > loan.remainingBalance) {
      return NextResponse.json(
        {
          error: 'Payment amount exceeds remaining balance',
          remainingBalance: loan.remainingBalance
        },
        { status: 400 }
      );
    }

    // Check if company has enough cash
    if (company.cash < amount) {
      return NextResponse.json(
        {
          error: 'Insufficient funds',
          availableCash: company.cash,
          requiredAmount: amount
        },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}