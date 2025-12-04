/**
 * @fileoverview Finance Loans API Route
 * @module app/api/departments/finance/loans/route
 * 
 * OVERVIEW:
 * POST endpoint to apply for a business loan.
 * Uses credit scoring and approval logic from finance utilities.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Department from '@/lib/db/models/Department';
import Company from '@/lib/db/models/Company';
import { connectDB } from '@/lib/db';
import { LoanApplicationSchema } from '@/lib/validations/department';
import { evaluateLoanApplication, calculateLoanPayment, calculateCreditScore } from '@/lib/utils/departments/finance';
import type { Loan, LoanApplicationInput } from '@/lib/types/department';

/**
 * POST /api/departments/finance/loans
 * 
 * Applies for a business loan with automatic approval/denial based on financials.
 * Uses credit scoring algorithm and approval criteria from finance utilities.
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * 
 * BODY: LoanApplicationSchema
 * ```ts
 * {
 *   companyId: string;
 *   loanType: 'working-capital' | 'expansion' | 'equipment' | 'bridge';
 *   amount: number; // 1,000 - 10,000,000
 *   termMonths: number; // 6 - 360
 * }
 * ```
 * 
 * APPROVAL CRITERIA:
 * - Credit score >= 600
 * - Debt-to-equity < 3.0
 * - Monthly revenue >= 5x monthly payment
 * - Cash reserves >= 3x monthly payment
 * 
 * RESPONSE:
 * - 200: Loan approved (added to department)
 * - 400: Invalid input or loan denied
 * - 401: Unauthorized (no session)
 * - 404: Finance department not found
 * - 500: Server error
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/departments/finance/loans', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     companyId: '507f1f77bcf86cd799439011',
 *     loanType: 'expansion',
 *     amount: 500000,
 *     termMonths: 60,
 *   }),
 * });
 * const result = await response.json();
 * // Returns: { approved: true, loan: {...}, message: 'Loan approved at 8.5% APR' }
 * ```
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'No company associated with this user' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = LoanApplicationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid loan application',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const application = validationResult.data;

    // Verify company ownership
    if (application.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Cannot apply for loan for another company' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    // Retrieve company and finance department
    const [company, finance] = await Promise.all([
      Company.findById(companyId),
      Department.findOne({ companyId, type: 'finance' }),
    ]);

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    if (!finance) {
      return NextResponse.json(
        { error: 'Finance department not found' },
        { status: 404 }
      );
    }

    // Calculate credit score
    const creditScore = calculateCreditScore({
      debtToEquity: company.debtToEquity || 0,
      profitMargin: finance.kpis.roi || 0,
      cashReserves: finance.cashReserves || 0,
      monthlyRevenue: company.monthlyRevenue || 0,
      paymentHistory: 0.95, // 95% on-time payment rate (placeholder)
    });

    // Update credit score in department
    finance.creditScore = creditScore;

    // Calculate monthly payment
    const monthlyPayment = calculateLoanPayment(
      application.amount,
      creditScore, // Uses credit score to determine interest rate
      application.termMonths
    );

    // Check approval criteria
    const approval = evaluateLoanApplication(
      application,
      creditScore,
      company.debtToEquity || 0,
      finance.cashReserves || 0
    );

    if (!approval.approved) {
      return NextResponse.json(
        {
          approved: false,
          message: approval.reason,
          creditScore,
        },
        { status: 400 }
      );
    }

    // Create loan entity
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + application.termMonths);

    const loan: Loan = {
      id: `loan_${Date.now()}`,
      companyId: application.companyId,
      loanType: application.loanType,
      amount: application.amount,
      interestRate: approval.interestRate || 0,
      termMonths: application.termMonths,
      monthlyPayment,
      remainingBalance: application.amount,
      status: 'active',
      startDate: now,
      endDate,
    };

    // Add loan to finance department
    finance.loans = finance.loans || [];
    // Push loan - companyId as string matches runtime behavior
    finance.loans.push(loan as unknown as typeof finance.loans[number]);
    
    // Update cash reserves (loan amount added)
    finance.cashReserves = (finance.cashReserves || 0) + application.amount;

    await finance.save();

    return NextResponse.json(
      {
        approved: true,
        loan,
        message: `Loan approved at ${approval.interestRate}% APR`,
        creditScore,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/departments/finance/loans] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process loan application' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Utility Functions**: Uses approveLoan(), calculateLoanPayment(), calculateCreditScore()
 * 2. **Automatic Approval**: No manual review - algorithm-based decision
 * 3. **Credit Scoring**: FICO-like scoring (300-850) determines interest rate
 * 4. **Cash Injection**: Approved loan amount added to cash reserves immediately
 * 5. **Validation**: Zod schema validates all inputs
 * 
 * LOAN APPROVAL ALGORITHM:
 * - Step 1: Calculate credit score (payment history, debt ratio, age, stability, margins)
 * - Step 2: Determine monthly payment based on amount, rate, term
 * - Step 3: Check approval criteria (score, debt ratio, revenue coverage, reserves)
 * - Step 4: If approved, calculate interest rate from credit score (5-15% range)
 * - Step 5: Create loan entity and add to department
 * 
 * SECURITY:
 * - Authentication required (NextAuth session)
 * - Company ownership verified (cannot apply for other companies)
 * - Input validation via Zod schemas
 * 
 * PREVENTS:
 * - Unauthorized loan applications
 * - Cross-company loan fraud
 * - Invalid loan parameters
 * - Loans to financially unstable companies (approval criteria)
 */
