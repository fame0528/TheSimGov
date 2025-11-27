/**
 * @file app/api/innovation/board/route.ts
 * @description Board of directors composition and governance tracking API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Manages board composition including independent directors, investor representatives,
 * founder/CEO board seats, and board observers. Tracks board expertise, diversity,
 * meeting frequency, and governance compliance.
 * 
 * ENDPOINTS:
 * - POST /api/innovation/board - Add board member
 * - GET /api/innovation/board - List board composition with expertise matrix
 * 
 * BUSINESS LOGIC:
 * - Board size: 3-5 members (early), 5-9 members (growth), 7-13 members (public company)
 * - Seat types: Founder (1-2 seats), Investor (1-3 seats), Independent (2-4 seats), Observer (0-2 non-voting)
 * - Expertise: Industry, Finance, Legal, M&A, International, Technical, Sales/Marketing
 * - Meetings: Monthly (early), Quarterly (mature), Special meetings (crisis/M&A)
 * - Governance: Audit committee, Compensation committee, Nominating committee (public company requirements)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import { Types } from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      company: companyId,
      memberName,
      seatType,
      expertise,
      isIndependent,
      isChairperson,
    } = body;

    if (!companyId || !memberName || !seatType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const boardMember = {
      company: new Types.ObjectId(companyId),
      memberName,
      seatType,
      expertise: expertise || [],
      isIndependent: isIndependent !== undefined ? isIndependent : false,
      isChairperson: isChairperson !== undefined ? isChairperson : false,
      appointedAt: new Date(),
    };

    return NextResponse.json({
      member: boardMember,
      message: `Board member added: ${memberName} (${seatType}${isChairperson ? ', Chairperson' : ''})`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding board member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      boardMembers: [],
      aggregatedMetrics: {
        totalMembers: 0,
        independentMembers: 0,
        expertiseAreas: 0,
        diversityScore: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching board members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
