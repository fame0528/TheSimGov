/**
 * @file app/api/departments/finance/loans/route.ts
 * @description API routes for loan management (Finance department)
 * @created 2025-11-13
 * 
 * ENDPOINTS:
 * - GET  /api/departments/finance/loans?companyId=xxx - Get all loans for company
 * - POST /api/departments/finance/loans               - Apply for new loan
 * 
 * REQUEST/RESPONSE CONTRACTS:
 * 
 * GET /api/departments/finance/loans?companyId=xxx
 * Response: { loans: ILoan[], activeLoans: number, totalDebt: number }
 * 
 * POST /api/departments/finance/loans
 * Request: {
 *   companyId, loanType, principal, interestRate, termMonths,
 *   collateralType?, collateralValue?, lender?, lenderType?
 * }
 * Response: { loan: ILoan, approval: LoanApprovalResult, message: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Loan from '@/lib/db/models/Loan';
import Department from '@/lib/db/models/Department';
import Company from '@/lib/db/models/Company';
import {
  calculateCreditScore,
  getLoanApprovalProbability,
  getInterestRate,
  calculateMonthlyPayment,
} from '@/lib/utils/finance/creditScore';

/**
 * GET /api/departments/finance/loans
 * Get loans for a company
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build query
    const query: any = { company: companyId };
    if (status) {
      query.status = status;
    }

    const loans = await Loan.find(query).sort({ createdAt: -1 });

    // Calculate totals
    const activeLoans = loans.filter((l) => l.status === 'Active').length;
    const totalDebt = loans
      .filter((l) => l.status === 'Active')
      .reduce((sum, l) => sum + l.balance, 0);

    return NextResponse.json({
      loans,
      activeLoans,
      totalDebt,
    });
  } catch (error: any) {
    console.error('GET /api/departments/finance/loans error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch loans' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/departments/finance/loans
 * Apply for a new loan
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      companyId,
      loanType,
      principal,
      termMonths,
      collateralType = 'None',
      collateralValue = 0,
      lender = 'First National Bank',
      lenderType = 'Bank',
    } = body;

    // Validate required fields
    if (!companyId || !loanType || !principal || !termMonths) {
      return NextResponse.json(
        { error: 'Company ID, loan type, principal, and term are required' },
        { status: 400 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get finance department for credit data
    const financeDept = await Department.findOne({
      company: companyId,
      type: 'finance',
    });

    if (!financeDept) {
      return NextResponse.json(
        { error: 'Finance department not found - create department first' },
        { status: 404 }
      );
    }

    // Get existing loans for payment history
    const existingLoans = await Loan.find({ company: companyId });
    const onTimePayments = existingLoans.reduce(
      (sum, loan) => sum + loan.paymentsMade,
      0
    );
    const latePayments = existingLoans.reduce(
      (sum, loan) => sum + loan.paymentsMissed,
      0
    );
    const defaults = existingLoans.filter((l) => l.status === 'Defaulted').length;

    // Calculate credit score
    const creditScoreResult = calculateCreditScore({
      paymentHistory: {
        onTimePayments,
        latePayments,
        defaults,
      },
      debtToEquity: financeDept.debtToEquity || 0,
      creditAge: Math.max(
        1,
        Math.floor(
          (Date.now() - (company as any).createdAt?.getTime?.() || Date.now()) / (1000 * 60 * 60 * 24 * 30)
        )
      ),
      activeLoans: existingLoans.filter((l) => l.status === 'Active').length,
      totalDebt: financeDept.totalDebt || 0,
      monthlyRevenue: company.cash / 12, // Rough estimate
      cashReserves: company.cash,
    });

    // Update company credit score
    await Department.findByIdAndUpdate(financeDept._id, {
      creditScore: creditScoreResult.score,
    });

    // Get interest rate
    const interestRateResult = getInterestRate(
      creditScoreResult.score,
      loanType,
      principal,
      termMonths
    );

    // Calculate monthly payment
    const monthlyPayment = calculateMonthlyPayment(
      principal,
      interestRateResult.adjustedRate,
      termMonths
    );

    // Check loan approval
    const approvalResult = getLoanApprovalProbability(
      creditScoreResult.score,
      loanType,
      principal,
      company.cash / 12
    );

    // Create loan application
    const loan = await Loan.create({
      company: companyId,
      loanType,
      principal,
      balance: principal,
      interestRate: interestRateResult.adjustedRate,
      termMonths,
      monthlyPayment,
      nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      originationDate: new Date(),
      maturityDate: new Date(
        Date.now() + termMonths * 30 * 24 * 60 * 60 * 1000
      ),
      status: approvalResult.approved ? 'Active' : 'Pending',
      approved: approvalResult.approved,
      approvedAt: approvalResult.approved ? new Date() : null,
      collateralType,
      collateralValue,
      lender,
      lenderType,
      nextPaymentAmount: monthlyPayment,
    });

    // If approved, add funds to company cash
    if (approvalResult.approved) {
      await Company.findByIdAndUpdate(companyId, {
        $inc: { cash: principal },
      });

      // Update finance department
      await Department.findByIdAndUpdate(financeDept._id, {
        $inc: {
          totalDebt: principal,
          activeLoans: 1,
          cashReserves: principal,
        },
      });
    }

    return NextResponse.json(
      {
        loan,
        approval: approvalResult,
        creditScore: creditScoreResult,
        interestRate: interestRateResult,
        message: approvalResult.approved
          ? 'Loan approved and funded'
          : 'Loan application pending approval',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/departments/finance/loans error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create loan' },
      { status: 500 }
    );
  }
}
