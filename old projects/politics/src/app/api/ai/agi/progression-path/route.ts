/**
 * /api/ai/agi/progression-path
 * GET: Calculate optimal AGI milestone progression path
 * 
 * @implementation FID-20251115-AI-P5.1 Phase 5.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import connectDB from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import AGIMilestone from '@/lib/db/models/AGIMilestone';
import { calculateMilestoneProgressionPath } from '@/lib/utils/ai/agiDevelopment';
import type { AlignmentStance } from '@/lib/db/models/AGIMilestone';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/ai/agi/progression-path
 * 
 * Query Parameters:
 * - stance: Alignment stance (SafetyFirst/Balanced/CapabilityFirst) - defaults to Balanced
 * 
 * @returns Optimal progression path with timeline, costs, and risks
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
    const stance = (searchParams.get('stance') as AlignmentStance) || 'Balanced';

    // Get achieved milestones to calculate current capability/alignment
    const achievedMilestones = await AGIMilestone.find({
      company: company._id,
      status: 'Achieved',
    });

    // Calculate aggregate capability and alignment from achieved milestones
    let currentCapability = {
      reasoningScore: 30,
      planningCapability: 30,
      selfImprovementRate: 0.1,
      generalizationAbility: 30,
      creativityScore: 30,
      learningEfficiency: 0.3,
    };

    let currentAlignment = {
      safetyMeasures: 40,
      valueAlignmentScore: 40,
      controlMechanisms: 40,
      interpretability: 40,
      robustness: 40,
      ethicalConstraints: 40,
    };

    // Aggregate gains from achieved milestones
    for (const milestone of achievedMilestones) {
      // Capability boosts
      currentCapability.reasoningScore = Math.min(
        100,
        currentCapability.reasoningScore + (milestone.currentCapability.reasoningScore - 30)
      );
      currentCapability.planningCapability = Math.min(
        100,
        currentCapability.planningCapability + (milestone.currentCapability.planningCapability - 30)
      );
      currentCapability.selfImprovementRate = Math.min(
        1,
        currentCapability.selfImprovementRate + (milestone.currentCapability.selfImprovementRate - 0.1)
      );
      currentCapability.generalizationAbility = Math.min(
        100,
        currentCapability.generalizationAbility +
          (milestone.currentCapability.generalizationAbility - 30)
      );
      currentCapability.creativityScore = Math.min(
        100,
        currentCapability.creativityScore + (milestone.currentCapability.creativityScore - 30)
      );
      currentCapability.learningEfficiency = Math.min(
        1,
        currentCapability.learningEfficiency + (milestone.currentCapability.learningEfficiency - 0.3)
      );

      // Alignment adjustments
      currentAlignment.safetyMeasures = Math.min(
        100,
        currentAlignment.safetyMeasures + (milestone.currentAlignment.safetyMeasures - 40)
      );
      currentAlignment.valueAlignmentScore = Math.min(
        100,
        currentAlignment.valueAlignmentScore +
          (milestone.currentAlignment.valueAlignmentScore - 40)
      );
      currentAlignment.controlMechanisms = Math.min(
        100,
        currentAlignment.controlMechanisms + (milestone.currentAlignment.controlMechanisms - 40)
      );
      currentAlignment.interpretability = Math.min(
        100,
        currentAlignment.interpretability + (milestone.currentAlignment.interpretability - 40)
      );
      currentAlignment.robustness = Math.min(
        100,
        currentAlignment.robustness + (milestone.currentAlignment.robustness - 40)
      );
      currentAlignment.ethicalConstraints = Math.min(
        100,
        currentAlignment.ethicalConstraints + (milestone.currentAlignment.ethicalConstraints - 40)
      );
    }

    // Available research points (NOTE: In production, use company.researchPoints)
    const availableResearchPoints = 50000;

    // Calculate optimal progression path
    const progressionPath = calculateMilestoneProgressionPath(
      currentCapability,
      currentAlignment,
      stance,
      availableResearchPoints
    );

    return NextResponse.json({
      success: true,
      progressionPath,
      currentState: {
        capability: currentCapability,
        alignment: currentAlignment,
        achievedMilestones: achievedMilestones.map((m) => m.milestoneType),
        availableResearchPoints,
      },
    });
  } catch (error) {
    logger.error('Error calculating progression path', {
      error: error instanceof Error ? error.message : 'Unknown error',
      operation: 'GET /api/ai/agi/progression-path',
      component: 'AGI Progression Path API'
    });
    return NextResponse.json(
      { error: 'Failed to calculate progression path', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
