/**
 * @file app/api/banking/loans/route.ts
 * @description List loans for a company with pagination
 * @created 2025-11-15
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { auth } from '@/lib/auth/config';
import Loan from '@/lib/db/models/Loan';
import Company from '@/lib/db/models/Company';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    await dbConnect();

    const sp = request.nextUrl.searchParams;
    const companyId = sp.get('companyId');
    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const company = await Company.findById(companyId).lean();
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    if (String(company.owner) !== String(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized company access' }, { status: 401 });
    }

    const status = sp.get('status');
    const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '10', 10)));
    const skip = Math.max(0, parseInt(sp.get('skip') || '0', 10));
    const sortBy = sp.get('sortBy') || 'nextPaymentDate';
    const sortOrder = sp.get('sortOrder') === 'asc' ? 1 : -1;

    const filter: Record<string, unknown> = { company: companyId };
    if (status) filter.status = status;

    const [loans, total] = await Promise.all([
      Loan.find(filter).sort({ [sortBy]: sortOrder }).limit(limit).skip(skip).lean().exec(),
      Loan.countDocuments(filter),
    ]);

    return NextResponse.json({ loans, total, limit, skip });
  } catch (error) {
    console.error('GET /api/banking/loans error:', error);
    return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 });
  }
}
