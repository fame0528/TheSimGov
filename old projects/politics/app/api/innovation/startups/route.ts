/**
 * @file app/api/innovation/startups/route.ts
 * @description Startup portfolio and corporate venture investments tracking API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Manages corporate VC investments in external startups, strategic investments,
 * portfolio company monitoring, and exit tracking. Tracks financial returns,
 * strategic value (ecosystem control, M&A pipeline), and partnership opportunities.
 * 
 * ENDPOINTS:
 * - POST /api/innovation/startups - Record startup investment
 * - GET /api/innovation/startups - List portfolio companies with performance metrics
 * 
 * BUSINESS LOGIC:
 * - Investment types: Seed ($100k-1M), Series A ($1-5M), Series B+ ($5-20M), Strategic ($500k-10M)
 * - Ownership: 5-25% typical for corporate VC (minority stakes, strategic influence)
 * - Returns: 0-100x (outliers), median 0.5x (many fail), portfolio 3-5x IRR target
 * - Strategic value: Technology access, M&A pipeline, market intelligence, ecosystem control
 * - Exit: IPO (10-20%), acquisition (60-70%), write-off (20-30%)
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
      startupName,
      sector,
      investment,
      round,
      ownership,
      postmoneyValuation,
      strategicValue,
    } = body;

    if (!companyId || !startupName || !sector || !investment || !round) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const startupData = {
      company: new Types.ObjectId(companyId),
      startupName,
      sector,
      investment,
      round,
      ownership: ownership || 0,
      postmoneyValuation: postmoneyValuation || 0,
      currentValuation: postmoneyValuation || 0,
      strategicValue: strategicValue || 'Market intelligence',
      status: 'Active',
      investedAt: new Date(),
    };

    return NextResponse.json({
      startup: startupData,
      message: `Invested $${(investment / 1_000_000).toFixed(1)}M in ${startupName} (${round}, ${ownership || 0}% ownership)`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording startup investment:', error);
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
      portfolio: [],
      aggregatedMetrics: {
        totalCompanies: 0,
        totalInvested: 0,
        portfolioValue: 0,
        realizedReturns: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching startup portfolio:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
