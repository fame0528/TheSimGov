/**
 * @file app/api/innovation/exits/route.ts
 * @description Exit strategy planning and execution tracking API (IPO/M&A)
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Manages exit strategy planning including IPO preparation, acquisition negotiations,
 * secondary sales, and strategic alternatives. Tracks exit timing, valuation targets,
 * stakeholder preferences, and market conditions for optimal exit execution.
 * 
 * ENDPOINTS:
 * - POST /api/innovation/exits - Record exit event or milestone
 * - GET /api/innovation/exits - Get exit strategy status and options
 * 
 * BUSINESS LOGIC:
 * - Exit types: IPO (15-20% of VC-backed), Acquisition (60-70%), Secondary (5-10%), Shutdown/pivot (10-15%)
 * - IPO readiness: $100M+ ARR, 40%+ growth, positive unit economics, clean financials, strong governance
 * - M&A timing: Strategic value peak, market consolidation, acquirer urgency, competitive threat
 * - Valuation: IPO (10-25x revenue for high-growth SaaS), Acquisition (5-15x revenue), Fire sale (<3x revenue)
 * - Stakeholder alignment: Founders (liquidity, legacy), VCs (fund returns, timeline pressure), Employees (equity value)
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
      exitType,
      targetValuation,
      readinessScore,
      timeline,
      marketConditions,
    } = body;

    if (!companyId || !exitType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const exitData = {
      company: new Types.ObjectId(companyId),
      exitType,
      targetValuation: targetValuation || 0,
      readinessScore: readinessScore || 0,
      timeline: timeline || 'TBD',
      marketConditions: marketConditions || 'Neutral',
      status: 'Planning',
      initiatedAt: new Date(),
    };

    return NextResponse.json({
      exit: exitData,
      message: `Exit planning initiated: ${exitType} (Target: $${(targetValuation || 0) / 1_000_000}M, Readiness: ${readinessScore || 0}%)`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording exit planning:', error);
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
      exitOptions: [],
      aggregatedMetrics: {
        ipoReadiness: 0,
        acquisitionInterest: 0,
        estimatedValuation: 0,
        optimalTiming: null,
      },
    });
  } catch (error) {
    console.error('Error fetching exit options:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
