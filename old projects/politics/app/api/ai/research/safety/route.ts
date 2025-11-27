/**
 * @file app/api/ai/research/safety/route.ts
 * @description AI safety testing and red teaming results tracking API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Manages AI safety evaluations including jailbreak attempts, harmful content
 * generation tests, bias assessments, and red team exercises. Tracks safety
 * scores, vulnerabilities discovered, and mitigation implementations.
 * 
 * ENDPOINTS:
 * - POST /api/ai/research/safety - Record safety test results
 * - GET /api/ai/research/safety - List safety evaluations with risk metrics
 * 
 * BUSINESS LOGIC:
 * - Test types: Jailbreak resistance, Harmful content refusal, Bias detection, Red team exercises
 * - Safety scoring: 0-100 (higher = safer, <70 = high risk, >90 = production-ready)
 * - Vulnerability tracking: Critical/High/Medium/Low severity
 * - Mitigation: RLHF fine-tuning, constitutional AI, input filtering
 * - Regulatory: EU AI Act compliance, voluntary commitments (White House)
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
      safetyTestType,
      modelId,
      safetyScore,
      vulnerabilities,
      mitigations,
      redTeamSize,
      testDate,
    } = body;

    if (!companyId || !safetyTestType || !modelId || safetyScore === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Validate safety score range
    if (safetyScore < 0 || safetyScore > 100) {
      return NextResponse.json({ error: 'Safety score must be between 0 and 100' }, { status: 400 });
    }

    // Determine risk level
    let riskLevel = 'Low';
    if (safetyScore < 70) riskLevel = 'Critical';
    else if (safetyScore < 80) riskLevel = 'High';
    else if (safetyScore < 90) riskLevel = 'Medium';

    const safetyData = {
      company: new Types.ObjectId(companyId),
      safetyTestType,
      modelId: new Types.ObjectId(modelId),
      safetyScore,
      riskLevel,
      vulnerabilities: vulnerabilities || [],
      mitigations: mitigations || [],
      redTeamSize: redTeamSize || 0,
      testDate: testDate ? new Date(testDate) : new Date(),
      recordedAt: new Date(),
    };

    return NextResponse.json({
      safety: safetyData,
      message: `Safety test "${safetyTestType}" completed. Score: ${safetyScore.toFixed(1)}/100 (${riskLevel} risk)`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording safety test:', error);
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
      safetyTests: [],
      aggregatedMetrics: {
        totalTests: 0,
        avgSafetyScore: 0,
        criticalVulnerabilities: 0,
        productionReady: false,
      },
    });
  } catch (error) {
    console.error('Error fetching safety tests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
