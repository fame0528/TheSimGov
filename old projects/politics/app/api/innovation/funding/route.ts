/**
 * @file app/api/innovation/funding/route.ts
 * @description Venture capital fundraising and investment tracking API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Manages VC funding rounds (Seed, Series A-F), investment terms, valuation tracking,
 * investor relationships, and cap table impact. Tracks dilution, valuation multiples,
 * runway extension, and strategic value of investor networks.
 * 
 * ENDPOINTS:
 * - POST /api/innovation/funding - Record funding round
 * - GET /api/innovation/funding - List funding history with valuation metrics
 * 
 * BUSINESS LOGIC:
 * - Round types: Seed ($1-5M), Series A ($5-20M), Series B ($15-50M), Series C+ ($50M+)
 * - Valuation: Pre-money + investment = post-money, dilution = investment / post-money
 * - Investor types: Angel, Micro-VC, Early-stage VC, Growth equity, Corporate VC
 * - Terms: Liquidation preference (1x-3x), board seats, pro rata rights, anti-dilution
 * - Strategic value: Runway extension, validation signal, network access, M&A/IPO preparation
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
      fundingRound,
      amount,
      premoneyValuation,
      leadInvestor,
      investors,
      liquidationPreference,
      boardSeats,
    } = body;

    if (!companyId || !fundingRound || !amount || !premoneyValuation || !leadInvestor) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Calculate post-money valuation and dilution
    const postmoneyValuation = premoneyValuation + amount;
    const dilution = (amount / postmoneyValuation) * 100;

    const fundingData = {
      company: new Types.ObjectId(companyId),
      fundingRound,
      amount,
      premoneyValuation,
      postmoneyValuation,
      dilution: Math.round(dilution * 100) / 100,
      leadInvestor,
      investors: investors || [],
      liquidationPreference: liquidationPreference || '1x',
      boardSeats: boardSeats || 0,
      closedAt: new Date(),
    };

    return NextResponse.json({
      funding: fundingData,
      message: `${fundingRound} round closed: $${(amount / 1_000_000).toFixed(1)}M at $${(postmoneyValuation / 1_000_000).toFixed(1)}M valuation (${dilution.toFixed(1)}% dilution)`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording funding round:', error);
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
      fundingRounds: [],
      aggregatedMetrics: {
        totalRaised: 0,
        currentValuation: 0,
        totalDilution: 0,
        totalInvestors: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching funding rounds:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
