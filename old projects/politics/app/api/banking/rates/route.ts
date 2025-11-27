/**
 * @file app/api/banking/rates/route.ts
 * @description Return interest rates for loan types based on score, amount, term
 * @created 2025-11-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInterestRate } from '@/lib/utils/finance/creditScore';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const loanType = (sp.get('loanType') as any) || 'Term';
    const amount = Number(sp.get('amount') ?? 100000);
    const termMonths = Number(sp.get('termMonths') ?? 60);
    const score = Number(sp.get('score') ?? 700);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    if (!Number.isFinite(termMonths) || termMonths < 1) {
      return NextResponse.json({ error: 'Invalid termMonths' }, { status: 400 });
    }
    if (!Number.isFinite(score) || score < 300 || score > 850) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
    }

    const rate = getInterestRate(score, loanType, amount, termMonths);
    return NextResponse.json(rate);
  } catch (error) {
    console.error('GET /api/banking/rates error:', error);
    return NextResponse.json({ error: 'Failed to get rates' }, { status: 500 });
  }
}
