/**
 * /api/ai/agi/milestones
 * GET: Retrieve all AGI milestones for company
 * POST: Create new AGI milestone
 * 
 * @implementation FID-20251115-AI-P5.1 Phase 5.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import connectDB from '@/lib/db/mongodb';
import AGIMilestone from '@/lib/db/models/AGIMilestone';
import Company from '@/lib/db/models/Company';
import type { MilestoneType, AlignmentStance } from '@/lib/db/models/AGIMilestone';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/ai/agi/milestones
 * 
 * Query Parameters:
 * - status: Filter by status (Locked/Available/InProgress/Achieved/Failed)
 * - milestoneType: Filter by specific milestone type
 * 
 * @returns Array of AGI milestones for authenticated user's company
 */
export async function GET(req: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get user's company
    const company = await Company.findOne({ userId: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const milestoneType = searchParams.get('milestoneType');

    // Build query
    const query: Record<string, unknown> = { company: company._id };
    if (status) {
      query.status = status;
    }
    if (milestoneType) {
      query.milestoneType = milestoneType;
    }

    // Fetch milestones
    const milestones = await AGIMilestone.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: milestones.length,
      milestones,
    });
  } catch (error) {
    logger.error('Error fetching AGI milestones', {
      error: error instanceof Error ? error.message : 'Unknown error',
      operation: 'GET /api/ai/agi/milestones',
      component: 'AGI Milestones API'
    });
    return NextResponse.json(
      { error: 'Failed to fetch milestones', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/agi/milestones
 * 
 * Body:
 * - milestoneType: Type of milestone to create
 * - alignmentStance: Strategic stance (SafetyFirst/Balanced/CapabilityFirst)
 * - researchPointsInvested: Initial RP investment (optional)
 * 
 * @returns Created AGI milestone
 */
export async function POST(req: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get user's company
    const company = await Company.findOne({ userId: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const {
      milestoneType,
      alignmentStance = 'Balanced',
      researchPointsInvested = 0,
    }: {
      milestoneType: MilestoneType;
      alignmentStance?: AlignmentStance;
      researchPointsInvested?: number;
    } = body;

    // Validation
    if (!milestoneType) {
      return NextResponse.json(
        { error: 'milestoneType is required' },
        { status: 400 }
      );
    }

    // Check if milestone already exists for this company
    const existingMilestone = await AGIMilestone.findOne({
      company: company._id,
      milestoneType,
    });

    if (existingMilestone) {
      return NextResponse.json(
        { error: 'Milestone already exists for this company' },
        { status: 409 }
      );
    }

    // Get company's current capability and alignment metrics
    // NOTE: These would come from company's AI models/research in production
    const currentCapability = {
      reasoningScore: 50,
      planningCapability: 50,
      selfImprovementRate: 0.1,
      generalizationAbility: 50,
      creativityScore: 50,
      learningEfficiency: 0.5,
    };

    const currentAlignment = {
      safetyMeasures: 50,
      valueAlignmentScore: 50,
      controlMechanisms: 50,
      interpretability: 50,
      robustness: 50,
      ethicalConstraints: 50,
    };

    // Define research requirements by milestone type
    const researchRequirements: Record<
      MilestoneType,
      {
        researchPointsCost: number;
        prerequisiteMilestones: MilestoneType[];
        minimumCapabilityLevel: number;
        minimumAlignmentLevel: number;
        estimatedTimeMonths: number;
        computeBudgetRequired: number;
      }
    > = {
      'Advanced Reasoning': {
        researchPointsCost: 3000,
        prerequisiteMilestones: [],
        minimumCapabilityLevel: 30,
        minimumAlignmentLevel: 30,
        estimatedTimeMonths: 6,
        computeBudgetRequired: 500000,
      },
      'Strategic Planning': {
        researchPointsCost: 3500,
        prerequisiteMilestones: ['Advanced Reasoning'],
        minimumCapabilityLevel: 40,
        minimumAlignmentLevel: 35,
        estimatedTimeMonths: 6,
        computeBudgetRequired: 600000,
      },
      'Transfer Learning': {
        researchPointsCost: 4500,
        prerequisiteMilestones: ['Advanced Reasoning', 'Strategic Planning'],
        minimumCapabilityLevel: 45,
        minimumAlignmentLevel: 40,
        estimatedTimeMonths: 8,
        computeBudgetRequired: 800000,
      },
      'Creative Problem Solving': {
        researchPointsCost: 4000,
        prerequisiteMilestones: ['Advanced Reasoning'],
        minimumCapabilityLevel: 40,
        minimumAlignmentLevel: 35,
        estimatedTimeMonths: 7,
        computeBudgetRequired: 700000,
      },
      'Meta-Learning': {
        researchPointsCost: 5000,
        prerequisiteMilestones: ['Transfer Learning'],
        minimumCapabilityLevel: 50,
        minimumAlignmentLevel: 45,
        estimatedTimeMonths: 9,
        computeBudgetRequired: 1000000,
      },
      'Natural Language Understanding': {
        researchPointsCost: 5500,
        prerequisiteMilestones: ['Transfer Learning', 'Creative Problem Solving'],
        minimumCapabilityLevel: 55,
        minimumAlignmentLevel: 50,
        estimatedTimeMonths: 10,
        computeBudgetRequired: 1200000,
      },
      'Multi-Agent Coordination': {
        researchPointsCost: 5000,
        prerequisiteMilestones: ['Strategic Planning', 'Transfer Learning'],
        minimumCapabilityLevel: 50,
        minimumAlignmentLevel: 55,
        estimatedTimeMonths: 9,
        computeBudgetRequired: 1100000,
      },
      'Self-Improvement': {
        researchPointsCost: 7000,
        prerequisiteMilestones: ['Meta-Learning', 'Transfer Learning'],
        minimumCapabilityLevel: 60,
        minimumAlignmentLevel: 60,
        estimatedTimeMonths: 12,
        computeBudgetRequired: 2000000,
      },
      'General Intelligence': {
        researchPointsCost: 10000,
        prerequisiteMilestones: [
          'Self-Improvement',
          'Natural Language Understanding',
          'Multi-Agent Coordination',
        ],
        minimumCapabilityLevel: 70,
        minimumAlignmentLevel: 70,
        estimatedTimeMonths: 18,
        computeBudgetRequired: 5000000,
      },
      'Superintelligence': {
        researchPointsCost: 20000,
        prerequisiteMilestones: ['General Intelligence'],
        minimumCapabilityLevel: 85,
        minimumAlignmentLevel: 80,
        estimatedTimeMonths: 24,
        computeBudgetRequired: 10000000,
      },
      'Value Alignment': {
        researchPointsCost: 4000,
        prerequisiteMilestones: ['Advanced Reasoning'],
        minimumCapabilityLevel: 35,
        minimumAlignmentLevel: 40,
        estimatedTimeMonths: 8,
        computeBudgetRequired: 600000,
      },
      'Interpretability': {
        researchPointsCost: 4500,
        prerequisiteMilestones: ['Advanced Reasoning', 'Value Alignment'],
        minimumCapabilityLevel: 40,
        minimumAlignmentLevel: 50,
        estimatedTimeMonths: 9,
        computeBudgetRequired: 800000,
      },
    };

    const requirements = researchRequirements[milestoneType];

    // Create milestone
    const milestone = new AGIMilestone({
      company: company._id,
      milestoneType,
      status: 'Available', // TODO: Calculate based on prerequisites
      attemptCount: 0,
      currentCapability,
      currentAlignment,
      researchRequirements: requirements,
      researchPointsInvested,
      computeBudgetSpent: 0,
      monthsInProgress: 0,
      alignmentStance,
      alignmentChallenges: [],
      impactConsequences: {
        industryDisruptionLevel: 0,
        regulatoryAttention: 0,
        publicPerceptionChange: 0,
        competitiveAdvantage: 0,
        catastrophicRiskProbability: 0,
        economicValueCreated: 0,
      },
    });

    await milestone.save();

    return NextResponse.json({
      success: true,
      milestone,
      message: `AGI milestone "${milestoneType}" created successfully`,
    });
  } catch (error) {
    logger.error('Error creating AGI milestone', {
      error: error instanceof Error ? error.message : 'Unknown error',
      operation: 'POST /api/ai/agi/milestones',
      component: 'AGI Milestones API'
    });
    return NextResponse.json(
      { error: 'Failed to create milestone', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
