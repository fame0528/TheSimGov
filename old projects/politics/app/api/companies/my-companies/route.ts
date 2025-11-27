/**
 * @file app/api/companies/my-companies/route.ts
 * @description Get current user's companies
 * @created 2025-11-17
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';

/**
 * GET /api/companies/my-companies
 * Fetch all companies owned by the authenticated user
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const companies = await Company.find({ owner: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, companies });
  } catch (error: any) {
    console.error('Error fetching user companies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}
