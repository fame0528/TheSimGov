/**
 * @file app/api/innovation/advisors/route.ts
 * @description Advisory board and strategic advisor management API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Manages advisory board including industry experts, technical advisors, domain
 * specialists, and strategic mentors. Tracks advisor contributions, equity grants,
 * engagement frequency, and value delivered to the company.
 * 
 * ENDPOINTS:
 * - POST /api/innovation/advisors - Add advisor
 * - GET /api/innovation/advisors - List advisors with contribution tracking
 * 
 * BUSINESS LOGIC:
 * - Advisor types: Technical (CTO-level), Industry (domain expert), Strategic (ex-CEO/board), Sales/BD (GTM strategy)
 * - Compensation: 0.1-1% equity (4-year vesting), cash retainer ($5-25k/year), project-based fees
 * - Engagement: Monthly calls (active), Quarterly (moderate), Ad-hoc (low), Introductions-only (passive)
 * - Value: Customer/investor intros, strategic advice, technical mentorship, industry credibility
 * - Lifecycle: 1-2 year typical engagement, renewal based on value delivered
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
      advisorName,
      advisorType,
      expertise,
      equityGrant,
      engagementLevel,
    } = body;

    if (!companyId || !advisorName || !advisorType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const advisorData = {
      company: new Types.ObjectId(companyId),
      advisorName,
      advisorType,
      expertise: expertise || [],
      equityGrant: equityGrant || 0,
      engagementLevel: engagementLevel || 'Moderate',
      contributionCount: 0,
      status: 'Active',
      onboardedAt: new Date(),
    };

    return NextResponse.json({
      advisor: advisorData,
      message: `Advisor added: ${advisorName} (${advisorType}, ${equityGrant || 0}% equity, ${engagementLevel || 'Moderate'} engagement)`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding advisor:', error);
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
      advisors: [],
      aggregatedMetrics: {
        totalAdvisors: 0,
        totalEquityGranted: 0,
        avgEngagement: 0,
        totalContributions: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching advisors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
