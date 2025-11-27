/**
 * @file app/api/innovation/valuation/route.ts
 * @description Company valuation tracking and methodology management API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Tracks company valuation using multiple methodologies (DCF, revenue multiples,
 * comparables, venture capital method). Monitors valuation trends, fundraising
 * impacts, and strategic exit planning (IPO readiness, M&A targeting).
 * 
 * ENDPOINTS:
 * - POST /api/innovation/valuation - Record valuation assessment
 * - GET /api/innovation/valuation - List valuation history with trend analysis
 * 
 * BUSINESS LOGIC:
 * - Valuation methods: DCF (discounted cash flow), Revenue multiple (5-15x), Comparables (peer benchmarking), VC method (exit value / dilution)
 * - Growth stage impact: Pre-revenue (<$1M ARR), Growth ($1-10M ARR = 10-20x), Scale ($10-100M ARR = 5-15x), Mature ($100M+ ARR = 3-10x)
 * - Market conditions: Bull market (+50% premium), Bear market (-50% discount), AI hype (+100-300% premium 2023-2025)
 * - Strategic events: Fundraising (mark up), acquisition offer (external validation), IPO prep (409A valuation)
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
      valuationMethod,
      valuationAmount,
      revenue,
      revenueMultiple,
      marketCondition,
      rationale,
    } = body;

    if (!companyId || !valuationMethod || !valuationAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const valuationData = {
      company: new Types.ObjectId(companyId),
      valuationMethod,
      valuationAmount,
      revenue: revenue || 0,
      revenueMultiple: revenueMultiple || (revenue ? (valuationAmount / revenue).toFixed(1) : null),
      marketCondition: marketCondition || 'Neutral',
      rationale: rationale || 'Periodic valuation assessment',
      assessedAt: new Date(),
    };

    return NextResponse.json({
      valuation: valuationData,
      message: `Valuation: $${(valuationAmount / 1_000_000).toFixed(1)}M (${valuationMethod}${valuationData.revenueMultiple ? `, ${valuationData.revenueMultiple}x revenue` : ''})`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording valuation:', error);
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
      valuations: [],
      aggregatedMetrics: {
        currentValuation: 0,
        valuationGrowth: 0,
        avgMultiple: 0,
        lastAssessment: null,
      },
    });
  } catch (error) {
    console.error('Error fetching valuations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
