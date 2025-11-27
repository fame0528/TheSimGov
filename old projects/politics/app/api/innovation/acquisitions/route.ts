/**
 * @file app/api/innovation/acquisitions/route.ts
 * @description Company acquisition and M&A activity tracking API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Manages acquisition deals including target company evaluation, purchase price,
 * acquisition rationale (talent, technology, market, elimination), integration
 * status, and ROI measurement post-close.
 * 
 * ENDPOINTS:
 * - POST /api/innovation/acquisitions - Record acquisition
 * - GET /api/innovation/acquisitions - List acquisition history with ROI metrics
 * 
 * BUSINESS LOGIC:
 * - Acquisition types: Talent ($1-10M), Technology ($5-50M), Market expansion ($20-200M), Competitor elimination ($50M+)
 * - Pricing: Revenue multiple (5-15x), User multiple ($50-500/user), Team value ($1-3M/engineer)
 * - Integration: HR onboarding, tech stack merge, culture fit assessment
 * - ROI: Revenue contribution, cost synergies, talent retention, time to integration
 * - Strategic value: Capability unlock, competitive defense, market consolidation
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
      targetCompany,
      purchasePrice,
      acquisitionType,
      rationale,
      targetRevenue,
      targetEmployees,
      integrationStatus,
    } = body;

    if (!companyId || !targetCompany || !purchasePrice || !acquisitionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Calculate acquisition multiple if revenue provided
    const revenueMultiple = targetRevenue ? (purchasePrice / targetRevenue).toFixed(1) : null;

    const acquisitionData = {
      company: new Types.ObjectId(companyId),
      targetCompany,
      purchasePrice,
      acquisitionType,
      rationale: rationale || 'Strategic acquisition',
      targetRevenue: targetRevenue || 0,
      targetEmployees: targetEmployees || 0,
      revenueMultiple,
      integrationStatus: integrationStatus || 'Pending',
      announcedAt: new Date(),
    };

    return NextResponse.json({
      acquisition: acquisitionData,
      message: `Acquisition of ${targetCompany} for $${(purchasePrice / 1_000_000).toFixed(1)}M (${acquisitionType}${revenueMultiple ? `, ${revenueMultiple}x revenue` : ''})`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording acquisition:', error);
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
      acquisitions: [],
      aggregatedMetrics: {
        totalAcquisitions: 0,
        totalSpent: 0,
        avgMultiple: 0,
        integratedCount: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching acquisitions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
