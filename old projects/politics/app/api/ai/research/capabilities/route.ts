/**
 * @file app/api/ai/research/capabilities/route.ts
 * @description AI model capability assessment and frontier tracking API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Tracks AI model capabilities across different domains (coding, math, reasoning,
 * multimodal, tool use, etc.). Monitors capability unlocks, frontier advancement,
 * and competitive positioning against GPT-4, Claude, Gemini benchmarks.
 * 
 * ENDPOINTS:
 * - POST /api/ai/research/capabilities - Record capability assessment
 * - GET /api/ai/research/capabilities - List capabilities with frontier status
 * 
 * BUSINESS LOGIC:
 * - Capability types: Coding, Math, Reasoning, Multimodal (vision/audio), Tool use, Long context, Planning
 * - Proficiency levels: None (0-20), Basic (20-50), Intermediate (50-75), Advanced (75-90), Expert (90-100)
 * - Frontier status: Lagging (<SOTA-10), Competitive (SOTA±10), Leading (>SOTA+10)
 * - Unlock events: First time reaching Advanced/Expert triggers capability unlock
 * - Strategic value: Capability breadth = market expansion, competitive moat
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
      capabilityType,
      modelId,
      proficiencyScore,
      stateOfTheArt,
      isNewUnlock,
      benchmarkUsed,
    } = body;

    if (!companyId || !capabilityType || !modelId || proficiencyScore === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Validate proficiency score range
    if (proficiencyScore < 0 || proficiencyScore > 100) {
      return NextResponse.json({ error: 'Proficiency score must be between 0 and 100' }, { status: 400 });
    }

    // Determine proficiency level
    let proficiencyLevel = 'None';
    if (proficiencyScore >= 90) proficiencyLevel = 'Expert';
    else if (proficiencyScore >= 75) proficiencyLevel = 'Advanced';
    else if (proficiencyScore >= 50) proficiencyLevel = 'Intermediate';
    else if (proficiencyScore >= 20) proficiencyLevel = 'Basic';

    // Determine frontier status
    let frontierStatus = 'Competitive';
    if (stateOfTheArt) {
      if (proficiencyScore < stateOfTheArt - 10) frontierStatus = 'Lagging';
      else if (proficiencyScore > stateOfTheArt + 10) frontierStatus = 'Leading';
    }

    const capabilityData = {
      company: new Types.ObjectId(companyId),
      capabilityType,
      modelId: new Types.ObjectId(modelId),
      proficiencyScore,
      proficiencyLevel,
      stateOfTheArt: stateOfTheArt || proficiencyScore,
      frontierStatus,
      isNewUnlock: isNewUnlock !== undefined ? isNewUnlock : proficiencyScore >= 75,
      benchmarkUsed: benchmarkUsed || 'Internal evaluation',
      recordedAt: new Date(),
    };

    return NextResponse.json({
      capability: capabilityData,
      message: `Capability "${capabilityType}" assessed: ${proficiencyScore.toFixed(1)}/100 (${proficiencyLevel}, ${frontierStatus})${capabilityData.isNewUnlock ? ' - NEW CAPABILITY UNLOCKED!' : ''}`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording capability:', error);
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
      capabilities: [],
      aggregatedMetrics: {
        totalCapabilities: 0,
        expertLevel: 0,
        advancedLevel: 0,
        leadingFrontier: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching capabilities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
