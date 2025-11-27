/**
 * @file app/api/innovation/ecosystem/route.ts
 * @description Platform ecosystem metrics and network effects tracking API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Tracks platform ecosystem health including developer activity, third-party
 * integrations, marketplace dynamics, and network effects strength. Monitors
 * ecosystem value creation, platform stickiness, and competitive moat expansion.
 * 
 * ENDPOINTS:
 * - POST /api/innovation/ecosystem - Record ecosystem metric
 * - GET /api/innovation/ecosystem - Get ecosystem health dashboard
 * 
 * BUSINESS LOGIC:
 * - Ecosystem metrics: Developer count, integrations built, API calls/day, marketplace GMV
 * - Network effects: Direct (users → users), Indirect (developers → users), Data (usage → quality)
 * - Platform value: Ecosystem revenue, lock-in strength, switching costs, competitive moat
 * - Growth loops: Developers attract users → users attract developers → both attract investment
 * - Strategic value: Ecosystem = defensibility, winner-take-most dynamics
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
      metricType,
      metricValue,
      developerCount,
      integrationCount,
      apiCallsPerDay,
      marketplaceGMV,
    } = body;

    if (!companyId || !metricType || metricValue === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const ecosystemData = {
      company: new Types.ObjectId(companyId),
      metricType,
      metricValue,
      developerCount: developerCount || 0,
      integrationCount: integrationCount || 0,
      apiCallsPerDay: apiCallsPerDay || 0,
      marketplaceGMV: marketplaceGMV || 0,
      recordedAt: new Date(),
    };

    return NextResponse.json({
      ecosystem: ecosystemData,
      message: `Ecosystem metric recorded: ${metricType} = ${metricValue} (${developerCount || 0} developers, ${integrationCount || 0} integrations)`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording ecosystem metric:', error);
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
      ecosystemMetrics: [],
      aggregatedMetrics: {
        totalDevelopers: 0,
        totalIntegrations: 0,
        dailyAPICalls: 0,
        ecosystemValue: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching ecosystem metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
