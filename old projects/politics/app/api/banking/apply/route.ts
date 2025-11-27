/**
 * @file app/api/banking/apply/route.ts
 * @description Apply for a loan (NPC banking foundation)
 * @created 2025-11-15
 *
 * POST /api/banking/apply
 * Body: {
 *   companyId: string,
 *   loanType: 'Term'|'Equipment'|'LineOfCredit'|'SBA'|'Bridge',
 *   amount: number,
 *   termMonths?: number,
 *   collateral?: { type: 'None'|'Equipment'|'RealEstate'|'Inventory'|'AR', value?: number }
 * }
 *
 * Response 201 (Approved): { loan, message: 'Approved', rate, monthlyPayment }
 * Response 200 (Denied/Pending): { decision: 'Denied'|'Pending', score, probability, conditions }
 * Errors: 400 invalid, 401 unauthorized, 404 company not found, 500 server
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/mongodb';
import { auth } from '@/lib/auth/config';
import Company from '@/lib/db/models/Company';
import Loan, { type LoanType, type CollateralType } from '@/lib/db/models/Loan';
import Transaction from '@/lib/db/models/Transaction';
import { calculateCreditScore, getInterestRate, getLoanApprovalProbability } from '@/lib/utils/finance/creditScore';
import { computeMonthlyPayment, getFirstPaymentDate, clamp } from '@/lib/utils/finance/loanCalculations';

type ApplyBody = {
  companyId?: string;
  loanType?: LoanType | 'Term' | 'Equipment' | 'LineOfCredit' | 'SBA' | 'Bridge';
  amount?: number;
  termMonths?: number;
  collateral?: { type?: CollateralType; value?: number };
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    await dbConnect();

    const body = (await request.json()) as ApplyBody;
    const { companyId, loanType, amount, termMonths, collateral } = body;

    if (!companyId || !loanType || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Normalize loanType casing to match model where necessary
    const lt = (loanType as LoanType);

    // Fetch company and ensure ownership
    const company = await Company.findById(companyId).lean();
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    if (String(company.owner) !== String(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized company access' }, { status: 401 });
    }

    // Derive basic credit inputs from existing loans and company balance sheet
    const loans = await Loan.find({ company: company._id }).lean();
    const totalDebt = loans.reduce((sum, l) => sum + (l.balance ?? 0), 0);
    const equity = Math.max(1, company.cash); // fallback minimal equity
    const debtToEquity = totalDebt / equity;
    const onTime = loans.reduce((s, l) => s + (l.paymentsMade ?? 0), 0);
    const late = loans.reduce((s, l) => s + (l.paymentsMissed ?? 0), 0);

    const credit = calculateCreditScore({
      paymentHistory: { onTimePayments: onTime, latePayments: late, defaults: 0 },
      debtToEquity,
      creditAge: 12, // Default 12 months if unknown for Phase 1A
      activeLoans: loans.filter(l => l.status === 'Active').length,
      totalDebt,
      monthlyRevenue: 0, // Unknown in Phase 1A; can enhance later
      cashReserves: company.cash,
      recentInquiries: 1,
    });

    // Decide approval
    const approval = getLoanApprovalProbability(credit.score, lt, amount);

    if (!approval.approved) {
      return NextResponse.json(
        {
          decision: 'Denied',
          score: credit.score,
          rating: credit.rating,
          probability: approval.probability,
          conditions: approval.conditions,
        },
        { status: 200 }
      );
    }

    // Compute terms
    const baseTerm = lt === 'Bridge' ? 12 : lt === 'SBA' ? 120 : lt === 'Equipment' ? 48 : lt === 'LineOfCredit' ? 12 : 60;
    const tm = clamp(Number(termMonths ?? baseTerm), 3, 360);
    const rateInfo = getInterestRate(credit.score, lt, amount, tm);

    // Prepare loan fields by type
    const now = new Date();
    const firstPaymentDate = getFirstPaymentDate(now);

    let principal = amount;
    let balance = amount;
    let monthlyPayment = 0;

    if (lt === 'LineOfCredit') {
      // LOC: principal is credit limit; balance starts at 0; interest-only until draw
      balance = 0;
      monthlyPayment = 0;
    } else {
      monthlyPayment = computeMonthlyPayment(principal, rateInfo.adjustedRate, tm);
    }

    const mongoSession = await mongoose.startSession();
    let createdLoan: any;

    await mongoSession.withTransaction(async () => {
      // Create loan document
      const [loan] = await Loan.create([
        {
          company: company._id,
          loanType: lt,
          principal,
          balance,
          interestRate: rateInfo.adjustedRate,
          termMonths: tm,
          monthlyPayment,
          nextPaymentDate: firstPaymentDate,
          originationDate: now,
          maturityDate: new Date(new Date(now).setMonth(now.getMonth() + tm)),
          status: 'Active',
          approved: true,
          approvedAt: now,
          firstPaymentDate,
          collateralType: (collateral?.type ?? 'None') as CollateralType,
          collateralValue: collateral?.value ?? 0,
          lateFeePenalty: 50,
          lateFeeThresholdDays: 10,
          earlyPaymentAllowed: true,
          earlyPaymentPenalty: 0,
          autoPayEnabled: false,
          creditScoreImpact: 0,
          onTimePaymentStreak: 0,
          delinquencyStatus: 0,
          lender: 'First National Bank',
          lenderType: 'Bank',
          loanOfficer: 'Automated Underwriting',
          loanNumber: '', // pre-save hook fills
        },
      ], { session: mongoSession });

      createdLoan = loan;

      // Disburse for non-LOC loans: increase company cash and log transaction
      if (lt !== 'LineOfCredit') {
        await Transaction.create([
          {
            type: 'loan',
            amount: principal,
            description: `Loan disbursement: ${lt}`,
            company: company._id,
            metadata: { interestRate: rateInfo.adjustedRate, termMonths: tm },
          },
        ], { session: mongoSession });

        await Company.updateOne(
          { _id: company._id },
          { $inc: { cash: principal } },
          { session: mongoSession }
        );
      }
    });

    await mongoSession.endSession();

    return NextResponse.json(
      {
        loan: { ...createdLoan.toObject?.({ virtuals: true }) },
        message: 'Approved',
        rate: rateInfo.adjustedRate,
        monthlyPayment,
        score: credit.score,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/banking/apply error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 });
    }
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'Duplicate data' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to apply for loan' }, { status: 500 });
  }
}
