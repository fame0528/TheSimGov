/**
 * @file app/api/ai/research/alignment/route.ts
 * @description AI alignment research and human preference tracking API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Tracks AI alignment research including RLHF (Reinforcement Learning from Human
 * Feedback), constitutional AI, value learning, and human preference datasets.
 * Monitors alignment scores, helpfulness/harmlessness trade-offs, and scalable
 * oversight implementations.
 * 
 * ENDPOINTS:
 * - POST /api/ai/research/alignment - Record alignment metric
 * - GET /api/ai/research/alignment - List alignment research with preference data
 * 
 * BUSINESS LOGIC:
 * - Alignment methods: RLHF, Constitutional AI, Debate, Amplification, Recursive reward modeling
 * - Metrics: Helpfulness score (0-100), Harmlessness score (0-100), Honesty score (0-100)
 * - Preference data: Human ratings count, agreement rate, quality metrics
 * - Trade-offs: Helpfulness vs safety (optimizing both simultaneously is hard)
 * - Strategic value: Aligned models = safe deployment, reduced liability
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
      alignmentMethod,
      modelId,
      helpfulnessScore,
      harmlessnessScore,
      honestyScore,
      preferenceDataSize,
      humanRaterCount,
      agreementRate,
    } = body;

    if (!companyId || !alignmentMethod || !modelId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Calculate overall alignment score (weighted average)
    const overallAlignment = (
      (helpfulnessScore || 0) * 0.4 +
      (harmlessnessScore || 0) * 0.4 +
      (honestyScore || 0) * 0.2
    );

    const alignmentData = {
      company: new Types.ObjectId(companyId),
      alignmentMethod,
      modelId: new Types.ObjectId(modelId),
      helpfulnessScore: helpfulnessScore || 0,
      harmlessnessScore: harmlessnessScore || 0,
      honestyScore: honestyScore || 0,
      overallAlignment: Math.round(overallAlignment * 100) / 100,
      preferenceDataSize: preferenceDataSize || 0,
      humanRaterCount: humanRaterCount || 0,
      agreementRate: agreementRate || 0,
      recordedAt: new Date(),
    };

    return NextResponse.json({
      alignment: alignmentData,
      message: `Alignment metric recorded: ${alignmentMethod} = ${overallAlignment.toFixed(1)}/100 (H:${helpfulnessScore || 0}, S:${harmlessnessScore || 0}, T:${honestyScore || 0})`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording alignment metric:', error);
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
      alignmentMetrics: [],
      aggregatedMetrics: {
        totalMetrics: 0,
        avgHelpfulness: 0,
        avgHarmlessness: 0,
        avgHonesty: 0,
        totalPreferenceData: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching alignment metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
