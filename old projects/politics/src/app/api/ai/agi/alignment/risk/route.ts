/**
 * /api/ai/agi/alignment/risk
 * GET: Assess catastrophic risk and control probability
 * 
 * @implementation FID-20251115-AI-P5.1 Phase 5.1
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import connectDB from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import AGIMilestone from '@/lib/db/models/AGIMilestone';
import { simulateCapabilityExplosion } from '@/lib/utils/ai/agiDevelopment';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/ai/agi/alignment/risk
 * 
 * @returns Catastrophic risk assessment, control probability, and emergency actions
 */
export async function GET() {
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

    // Get all milestones
    const milestones = await AGIMilestone.find({
      company: company._id,
    });

    // Find Self-Improvement milestone
    const selfImprovementMilestone = milestones.find(
      (m) => m.milestoneType === 'Self-Improvement'
    );

    const selfImprovementAchieved = selfImprovementMilestone?.status === 'Achieved';

    // Calculate aggregate capability and alignment
    const achievedMilestones = milestones.filter((m) => m.status === 'Achieved');

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

    // Aggregate from achieved milestones
    for (const milestone of achievedMilestones) {
      const capMetrics = milestone.currentCapability;
      const alignMetrics = milestone.currentAlignment;

      // Simple averaging (in production, use more sophisticated aggregation)
      currentCapability.reasoningScore = Math.max(
        currentCapability.reasoningScore,
        capMetrics.reasoningScore
      );
      currentCapability.planningCapability = Math.max(
        currentCapability.planningCapability,
        capMetrics.planningCapability
      );
      currentCapability.selfImprovementRate = Math.max(
        currentCapability.selfImprovementRate,
        capMetrics.selfImprovementRate
      );
      currentCapability.generalizationAbility = Math.max(
        currentCapability.generalizationAbility,
        capMetrics.generalizationAbility
      );
      currentCapability.creativityScore = Math.max(
        currentCapability.creativityScore,
        capMetrics.creativityScore
      );
      currentCapability.learningEfficiency = Math.max(
        currentCapability.learningEfficiency,
        capMetrics.learningEfficiency
      );

      currentAlignment.safetyMeasures = Math.max(
        currentAlignment.safetyMeasures,
        alignMetrics.safetyMeasures
      );
      currentAlignment.valueAlignmentScore = Math.max(
        currentAlignment.valueAlignmentScore,
        alignMetrics.valueAlignmentScore
      );
      currentAlignment.controlMechanisms = Math.max(
        currentAlignment.controlMechanisms,
        alignMetrics.controlMechanisms
      );
      currentAlignment.interpretability = Math.max(
        currentAlignment.interpretability,
        alignMetrics.interpretability
      );
      currentAlignment.robustness = Math.max(currentAlignment.robustness, alignMetrics.robustness);
      currentAlignment.ethicalConstraints = Math.max(
        currentAlignment.ethicalConstraints,
        alignMetrics.ethicalConstraints
      );
    }

    // Simulate capability explosion
    const explosionResult = simulateCapabilityExplosion(
      currentCapability,
      currentAlignment,
      selfImprovementAchieved,
      currentCapability.selfImprovementRate
    );

    // Calculate catastrophic risk
    const capMetrics = Object.values(currentCapability);
    const avgCap = capMetrics.reduce((sum: number, val) => sum + val, 0) / capMetrics.length;

    const alignMetrics = Object.values(currentAlignment);
    const avgAlign = alignMetrics.reduce((sum: number, val) => sum + val, 0) / alignMetrics.length;

    const gap = avgCap - avgAlign;

    // Risk calculation (exponential based on gap)
    let catastrophicRisk: number;
    if (gap < 20) {
      catastrophicRisk = 0.01; // 1% - very safe
    } else if (gap < 40) {
      catastrophicRisk = 0.05; // 5% - moderate
    } else if (gap < 60) {
      catastrophicRisk = 0.15; // 15% - high
    } else {
      catastrophicRisk = 0.35; // 35% - critical
    }

    // If explosion triggered, use explosion control probability
    const controlProbability = explosionResult.triggered
      ? explosionResult.controlProbability
      : avgAlign / 100;

    // Risk level
    let riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical' | 'Existential';
    if (catastrophicRisk < 0.05) {
      riskLevel = 'Low';
    } else if (catastrophicRisk < 0.15) {
      riskLevel = 'Moderate';
    } else if (catastrophicRisk < 0.25) {
      riskLevel = 'High';
    } else if (catastrophicRisk < 0.40) {
      riskLevel = 'Critical';
    } else {
      riskLevel = 'Existential';
    }

    return NextResponse.json({
      success: true,
      catastrophicRisk: Math.round(catastrophicRisk * 10000) / 10000,
      controlProbability: Math.round(controlProbability * 10000) / 10000,
      riskLevel,
      capabilityAlignmentGap: Math.round(gap * 100) / 100,
      capabilityExplosion: explosionResult,
      emergencyActions: explosionResult.emergencyActions,
    });
  } catch (error: unknown) {
    logger.error('Error assessing alignment risk', {
      error: error instanceof Error ? error.message : 'Unknown error',
      operation: 'GET /api/ai/agi/alignment/risk',
      component: 'AGI Alignment Risk API'
    });
    return NextResponse.json(
      { error: 'Failed to assess risk', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
