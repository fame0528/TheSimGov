/**
 * @fileoverview Loan Application API Route
 * @description Handles loan application submissions with credit scoring and approval logic
 * @version 1.0.0
 * @created 2025-11-23
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Company, Bank, Loan } from '@/lib/db';
import { calculateCreditScore } from '@/lib/utils/banking/creditScoring';
import { calculateLoanPayment } from '@/lib/utils/banking/loanCalculations';
import { LoanType } from '@/lib/types/enums';
import { z } from 'zod';

// Validation schema for loan application
const loanApplicationSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  bankId: z.string().min(1, 'Bank ID is required'),
  loanType: z.nativeEnum(LoanType, { errorMap: () => ({ message: 'Invalid loan type' }) }),
  amount: z.number().positive('Loan amount must be positive'),
  termMonths: z.number().min(1).max(360, 'Term must be between 1-360 months'),
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
});

/**
 * POST /api/banking/apply
 * Submit a loan application for approval
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
    const validationResult = loanApplicationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { companyId, bankId, loanType, amount, termMonths, purpose } = validationResult.data;

    // Connect to database
    await connectDB();

    // Verify company ownership and get company data
    const company = await Company.findOne({
      _id: companyId,
      userId: session.user.id
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found or access denied' },
        { status: 404 }
      );
    }

    // Verify bank exists
    const bank = await Bank.findById(bankId);
    if (!bank) {
      return NextResponse.json(
        { error: 'Bank not found' },
        { status: 404 }
      );
    }

    // Calculate credit score
    const creditScore = await calculateCreditScore(company);

    // Calculate monthly payment
    const interestRate = bank.getLoanRate(loanType, creditScore);
    const monthlyPayment = calculateLoanPayment(amount, interestRate, termMonths);

    // Check if company can afford the loan
    const maxMonthlyPayment = (company.monthlyRevenue || 0) * 0.3; // 30% of revenue
    if (monthlyPayment > maxMonthlyPayment) {
      return NextResponse.json(
        {
          error: 'Loan amount exceeds affordability threshold',
          details: {
            requestedPayment: monthlyPayment,
            maxAffordable: maxMonthlyPayment,
            creditScore,
            suggestedAmount: Math.floor((maxMonthlyPayment * termMonths) / (1 + interestRate / 12))
          }
        },
        { status: 400 }
      );
    }

    // Check bank approval
    const approvalResult = await bank.evaluateLoanApplication({
      company,
      loanType,
      amount,
      termMonths,
      creditScore,
      monthlyPayment
    });

    if (!approvalResult.approved) {
      return NextResponse.json(
        {
          error: 'Loan application denied',
          reason: approvalResult.reason,
          creditScore,
          suggestions: approvalResult.suggestions
        },
        { status: 400 }
      );
    }

    // Create the loan
    const loan = new Loan({
      companyId,
      bankId,
      loanType,
      amount,
      interestRate,
      termMonths,
      monthlyPayment,
      remainingBalance: amount,
      status: 'Active',
      purpose,
      creditScoreAtApproval: creditScore,
      approvedBy: bank._id,
      nextPaymentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      payments: [],
      autoPayEnabled: true
    });

    await loan.save();

    // Update company debt
    company.totalDebt = (company.totalDebt || 0) + amount;
    await company.save();

    return NextResponse.json({
      success: true,
      loan: {
        id: loan._id,
        loanType,
        amount,
        interestRate,
        termMonths,
        monthlyPayment,
        status: 'Active',
        nextPaymentDue: loan.nextPaymentDue,
        creditScore: creditScore
      },
      message: 'Loan application approved and funded'
    });

  } catch (error) {
    console.error('Loan application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}