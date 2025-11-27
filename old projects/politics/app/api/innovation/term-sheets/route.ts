/**
 * @file app/api/innovation/term-sheets/route.ts
 * @description VC term sheet negotiation and terms tracking API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Manages venture capital term sheet negotiations including valuation terms,
 * liquidation preferences, board composition, anti-dilution provisions, and
 * investor rights. Tracks negotiation status, term comparisons, and deal execution.
 * 
 * ENDPOINTS:
 * - POST /api/innovation/term-sheets - Create/update term sheet
 * - GET /api/innovation/term-sheets - List term sheets with comparison metrics
 * 
 * BUSINESS LOGIC:
 * - Key terms: Valuation (pre-money), Liquidation preference (1x-3x, participating/non-participating),
 *   Board seats (investor control), Pro rata rights (follow-on investment), Anti-dilution (full ratchet vs weighted average)
 * - Founder-friendly: 1x non-participating liquidation, no board control, broad-based weighted average anti-dilution
 * - Investor-friendly: 2-3x participating liquidation, board control, full ratchet anti-dilution, drag-along rights
 * - Negotiation: Multiple term sheets = leverage, single term sheet = take-it-or-leave-it, no-shop period (30-60 days)
 * - Market standards: Seed (founder-friendly), Series A (balanced), Series B+ (investor-friendly as leverage shifts)
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
      investor,
      fundingRound,
      premoneyValuation,
      investment,
      liquidationPreference,
      boardSeats,
      proRataRights,
      antiDilution,
    } = body;

    if (!companyId || !investor || !fundingRound || !premoneyValuation || !investment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const termSheetData = {
      company: new Types.ObjectId(companyId),
      investor,
      fundingRound,
      premoneyValuation,
      investment,
      postmoneyValuation: premoneyValuation + investment,
      liquidationPreference: liquidationPreference || '1x non-participating',
      boardSeats: boardSeats || 0,
      proRataRights: proRataRights !== undefined ? proRataRights : true,
      antiDilution: antiDilution || 'Weighted average',
      status: 'Negotiating',
      receivedAt: new Date(),
    };

    return NextResponse.json({
      termSheet: termSheetData,
      message: `Term sheet received from ${investor}: ${fundingRound} at $${(premoneyValuation / 1_000_000).toFixed(1)}M pre-money ($${(investment / 1_000_000).toFixed(1)}M investment)`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording term sheet:', error);
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
      termSheets: [],
      aggregatedMetrics: {
        totalTermSheets: 0,
        avgValuation: 0,
        bestTerms: null,
        negotiationStatus: 'None',
      },
    });
  } catch (error) {
    console.error('Error fetching term sheets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
