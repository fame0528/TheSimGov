/**
 * @file app/api/banking/credit-score/route.ts
 * @description Compute credit score for a company
 * @created 2025-11-15
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { auth } from '@/lib/auth/config';
import Company from '@/lib/db/models/Company';
import Loan from '@/lib/db/models/Loan';
import { calculateCreditScore } from '@/lib/utils/finance/creditScore';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    await dbConnect();

    const sp = request.nextUrl.searchParams;
    const companyId = sp.get('companyId');
    if (!companyId) return NextResponse.json({ error: 'companyId is required' }, { status: 400 });

    const company = await Company.findById(companyId).lean();
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    if (String(company.owner) !== String(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized company access' }, { status: 401 });
    }

    const loans = await Loan.find({ company: company._id }).lean();
    const totalDebt = loans.reduce((sum, l) => sum + (l.balance ?? 0), 0);
    const equity = Math.max(1, company.cash);
    const debtToEquity = totalDebt / equity;
    const onTime = loans.reduce((s, l) => s + (l.paymentsMade ?? 0), 0);
    const late = loans.reduce((s, l) => s + (l.paymentsMissed ?? 0), 0);

    const score = calculateCreditScore({
      paymentHistory: { onTimePayments: onTime, latePayments: late, defaults: 0 },
      debtToEquity,
      creditAge: 12,
      activeLoans: loans.filter(l => l.status === 'Active').length,
      totalDebt,
      monthlyRevenue: 0,
      cashReserves: company.cash,
      recentInquiries: 0,
    });

    return NextResponse.json(score);
  } catch (error) {
    console.error('GET /api/banking/credit-score error:', error);
    return NextResponse.json({ error: 'Failed to compute credit score' }, { status: 500 });
  }
}
