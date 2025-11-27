/**
 * @file app/api/ai/companies/route.ts
 * @description AI Companies list endpoint (Technology industry)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const companies = await Company.find({ owner: session.user.id, industry: 'Technology' })
      .sort({ foundedAt: -1 })
      .lean();

    return NextResponse.json({ companies });
  } catch (e) {
    console.error('GET /api/ai/companies error:', e);
    return NextResponse.json({ error: 'Failed to fetch AI companies' }, { status: 500 });
  }
}
