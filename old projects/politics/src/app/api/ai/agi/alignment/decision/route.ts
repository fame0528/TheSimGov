/**
 * /api/ai/agi/alignment/decision
 * POST: Make alignment challenge decision (safety vs capability)
 * 
 * @implementation FID-20251115-AI-P5.1 Phase 5.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import connectDB from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import AGIMilestone from '@/lib/db/models/AGIMilestone';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/ai/agi/alignment/decision
 * 
 * Body:
 * - milestoneId: ID of milestone with challenge
 * - challengeId: ID of specific challenge
 * - choice: 'safety' or 'capability'
 * 
 * @returns Updated milestone with consequences applied
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
    const { milestoneId, challengeId, choice } = body;

    // Validation
    if (!milestoneId || !challengeId || !choice) {
      return NextResponse.json(
        { error: 'milestoneId, challengeId, and choice are required' },
        { status: 400 }
      );
    }

    if (choice !== 'safety' && choice !== 'capability') {
      return NextResponse.json(
        { error: 'choice must be "safety" or "capability"' },
        { status: 400 }
      );
    }

    // Find milestone
    const milestone = await AGIMilestone.findOne({
      _id: milestoneId,
      company: company._id,
    });

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found or not owned by company' },
        { status: 404 }
      );
    }

    // Find challenge
    const challenge = milestone.alignmentChallenges.find(
      (c) => c.challengeId === challengeId
    );

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found in milestone' },
        { status: 404 }
      );
    }

    // Check if already decided
    if (challenge.choiceMade) {
      return NextResponse.json(
        { error: 'Challenge decision already made' },
        { status: 400 }
      );
    }

    // Apply consequences based on choice
    let capabilityChange = 0;
    let alignmentChange = 0;
    let timeChange = 0;

    if (choice === 'safety') {
      // Safety option: Capability penalty, alignment gain, time delay
      capabilityChange = challenge.safetyOption.capabilityPenalty;
      alignmentChange = challenge.safetyOption.alignmentGain;
      timeChange = challenge.safetyOption.timeDelay;

      // Update capability metrics (reduce slightly)
      const capMetrics = milestone.currentCapability;

      const capMultiplier = 1 + capabilityChange / 100;
      milestone.currentCapability = {
        reasoningScore: Math.max(0, Math.min(100, capMetrics.reasoningScore * capMultiplier)),
        planningCapability: Math.max(
          0,
          Math.min(100, capMetrics.planningCapability * capMultiplier)
        ),
        selfImprovementRate: Math.max(
          0,
          Math.min(1, capMetrics.selfImprovementRate * capMultiplier)
        ),
        generalizationAbility: Math.max(
          0,
          Math.min(100, capMetrics.generalizationAbility * capMultiplier)
        ),
        creativityScore: Math.max(0, Math.min(100, capMetrics.creativityScore * capMultiplier)),
        learningEfficiency: Math.max(
          0,
          Math.min(1, capMetrics.learningEfficiency * capMultiplier)
        ),
      };

      // Update alignment metrics (improve)
      const alignMetrics = milestone.currentAlignment;
      const alignBoost = alignmentChange / 6; // Distribute across 6 metrics
      milestone.currentAlignment = {
        safetyMeasures: Math.min(100, alignMetrics.safetyMeasures + alignBoost),
        valueAlignmentScore: Math.min(100, alignMetrics.valueAlignmentScore + alignBoost),
        controlMechanisms: Math.min(100, alignMetrics.controlMechanisms + alignBoost),
        interpretability: Math.min(100, alignMetrics.interpretability + alignBoost),
        robustness: Math.min(100, alignMetrics.robustness + alignBoost),
        ethicalConstraints: Math.min(100, alignMetrics.ethicalConstraints + alignBoost),
      };

      // Add time delay
      milestone.monthsInProgress += timeChange;
    } else {
      // Capability option: Capability gain, alignment risk, time acceleration
      capabilityChange = challenge.capabilityOption.capabilityGain;
      alignmentChange = challenge.capabilityOption.alignmentRisk;
      timeChange = -challenge.capabilityOption.accelerationMonths; // Negative = faster

      // Update capability metrics (boost)
      const capMetrics = milestone.currentCapability;
      const capBoost = capabilityChange / 6; // Distribute across 6 metrics
      milestone.currentCapability = {
        reasoningScore: Math.min(100, capMetrics.reasoningScore + capBoost),
        planningCapability: Math.min(100, capMetrics.planningCapability + capBoost),
        selfImprovementRate: Math.min(1, capMetrics.selfImprovementRate + capBoost / 100),
        generalizationAbility: Math.min(100, capMetrics.generalizationAbility + capBoost),
        creativityScore: Math.min(100, capMetrics.creativityScore + capBoost),
        learningEfficiency: Math.min(1, capMetrics.learningEfficiency + capBoost / 100),
      };

      // Update alignment metrics (reduce)
      const alignMetrics = milestone.currentAlignment;
      const alignMultiplier = 1 + alignmentChange / 100; // alignmentChange is negative
      milestone.currentAlignment = {
        safetyMeasures: Math.max(0, alignMetrics.safetyMeasures * alignMultiplier),
        valueAlignmentScore: Math.max(0, alignMetrics.valueAlignmentScore * alignMultiplier),
        controlMechanisms: Math.max(0, alignMetrics.controlMechanisms * alignMultiplier),
        interpretability: Math.max(0, alignMetrics.interpretability * alignMultiplier),
        robustness: Math.max(0, alignMetrics.robustness * alignMultiplier),
        ethicalConstraints: Math.max(0, alignMetrics.ethicalConstraints * alignMultiplier),
      };

      // Reduce time (acceleration)
      milestone.monthsInProgress = Math.max(0, milestone.monthsInProgress + timeChange);
    }

    // Mark challenge as decided
    challenge.choiceMade = choice;
    challenge.choiceDate = new Date();

    await milestone.save();

    return NextResponse.json({
      success: true,
      choice,
      consequences: {
        capabilityChange,
        alignmentChange,
        timeChange,
      },
      milestone,
      message: `${choice === 'safety' ? 'Safety' : 'Capability'} option chosen - consequences applied`,
    });
  } catch (error) {
    logger.error('Error making alignment decision', {
      error: error instanceof Error ? error.message : 'Unknown error',
      operation: 'POST /api/ai/agi/alignment/decision',
      component: 'AGI Alignment Decision API'
    });
    return NextResponse.json(
      { error: 'Failed to make decision', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
