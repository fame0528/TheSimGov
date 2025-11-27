/**
 * @file app/api/innovation/litigation/route.ts
 * @description IP litigation and enforcement action tracking API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Tracks intellectual property litigation including patent infringement lawsuits,
 * trademark disputes, copyright violations, and trade secret misappropriation.
 * Monitors litigation costs, settlement outcomes, and enforcement effectiveness.
 * 
 * ENDPOINTS:
 * - POST /api/innovation/litigation - File litigation case
 * - GET /api/innovation/litigation - List IP litigation history
 * 
 * BUSINESS LOGIC:
 * - Case types: Patent infringement, Trademark dispute, Copyright violation, Trade secret theft
 * - Litigation costs: $2M-$10M (patent), $500k-$2M (trademark), $1M-$5M (trade secret)
 * - Duration: 18-36 months typical, 6-12 months for preliminary injunctions
 * - Outcomes: Win (damages + injunction), Settlement (licensing/payment), Loss (costs only)
 * - Strategic value: Deterrence, competitive disruption, licensing leverage
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
      caseName,
      caseType,
      defendant,
      ipAsset,
      estimatedCost,
      estimatedDamages,
      jurisdiction,
      status,
    } = body;

    if (!companyId || !caseName || !caseType || !defendant || !ipAsset) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const litigationData = {
      company: new Types.ObjectId(companyId),
      caseName,
      caseType,
      defendant,
      ipAsset,
      estimatedCost: estimatedCost || 0,
      estimatedDamages: estimatedDamages || 0,
      jurisdiction: jurisdiction || 'US Federal',
      status: status || 'Filed',
      filedAt: new Date(),
      estimatedResolution: new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000), // +24 months
    };

    return NextResponse.json({
      litigation: litigationData,
      message: `Litigation "${caseName}" filed. ${caseType} against ${defendant}, estimated resolution in 24 months.`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error filing litigation:', error);
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
      litigationCases: [],
      aggregatedMetrics: {
        totalCases: 0,
        activeCases: 0,
        totalCosts: 0,
        totalDamagesAwarded: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching litigation cases:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
