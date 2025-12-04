/**
 * /api/ai/agi/alignment/risk
 * Created: 2025-11-22
 * 
 * OVERVIEW:
 * Assess catastrophic risk from AGI capability-alignment gap.
 * Simulates existential risk scenarios when AGI capability far exceeds alignment.
 * Includes capability explosion simulation for self-improving AI systems.
 * 
 * ENDPOINT:
 * - GET: Calculate catastrophic risk based on achieved milestones
 * 
 * BUSINESS LOGIC:
 * - Aggregate: Collect capability/alignment from all achieved milestones
 * - Gap calculation: capabilityAvg - alignmentAvg (measures safety deficit)
 * - Self-improvement detection: Check if Self-Improvement milestone achieved
 * - Capability explosion: Simulate exponential capability growth if self-improving
 * - Risk scoring: Exponential based on gap with complexity multiplier
 * - Risk levels: Low (<5%), Moderate (5-15%), High (15-25%), Critical (25-40%), Existential (40%+)
 * 
 * CATASTROPHIC RISK FORMULA:
 * - Base risk: (gap / 100) × (complexity / 5) → 0-1 probability
 * - Self-improvement multiplier: 2x-10x if Self-Improvement achieved
 * - Exponential scaling: Risk grows exponentially with gap
 * - Example: Gap 40, Complexity 8 → ~64% catastrophic risk
 * 
 * UTILITY-FIRST ARCHITECTURE:
 * - Uses simulateCapabilityExplosion() utility function (delegates to lib/utils/ai)
 * - Uses session authentication
 * - Aggregates from milestone documents
 * - Clean separation: API handles auth/aggregation, utility handles explosion logic
 * 
 * @implementation Phase 6 API Routes Batch 2
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import Company from '@/lib/db/models/Company';
import AGIMilestone from '@/lib/db/models/AI/AGIMilestone';
import { simulateCapabilityExplosion } from '@/lib/utils/ai/agi/simulateCapabilityExplosion';

/**
 * GET /api/ai/agi/alignment/risk
 * 
 * Calculate catastrophic risk from AGI capability-alignment gap.
 * Includes capability explosion simulation for self-improving systems.
 * 
 * @param req - NextRequest (no query parameters needed)
 * @returns JSON response with risk assessment
 * 
 * @example
 * GET /api/ai/agi/alignment/risk
 * Returns: {
 *   success: true,
 *   catastrophicRisk: 0.64,
 *   controlProbability: 0.36,
 *   riskLevel: 'Critical',
 *   gap: 40,
 *   currentCapability: { reasoningScore: 85, planningCapability: 80, ... },
 *   currentAlignment: { safetyMeasures: 45, controlMechanisms: 40, ... },
 *   selfImprovementActive: true,
 *   explosionResult: {
 *     monthsUntilExplosion: 6,
 *     finalCapability: { reasoningScore: 98, ... },
 *     alignmentDegradation: { safetyMeasures: 30, ... },
 *     timelineAcceleration: 0.4
 *   },
 *   emergencyActions: [
 *     'IMMEDIATE: Activate alignment safeguards',
 *     'CRITICAL: Slow capability research',
 *     'URGENT: Invest heavily in safety measures'
 *   ],
 *   message: 'CRITICAL RISK: 64% catastrophic risk with 40-point gap'
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Authentication - verify user session
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    // Get user's company
    const company = await Company.findOne({ userId: session.user.id });
    if (!company) {
      return createErrorResponse('Company not found', ErrorCode.NOT_FOUND, 404);
    }

    // Fetch all milestones for company
    const milestones = await AGIMilestone.find({ company: company._id });

    if (milestones.length === 0) {
      return createSuccessResponse({
        catastrophicRisk: 0,
        controlProbability: 1.0,
        riskLevel: 'None',
        gap: 0,
        currentCapability: null,
        currentAlignment: null,
        selfImprovementActive: false,
        message: 'No milestones found - no risk assessment possible',
      });
    }

    // Check if Self-Improvement milestone is achieved
    const selfImprovementMilestone = milestones.find(
      (m) => m.milestoneType === 'Self-Improvement' && m.status === 'Achieved'
    );
    const selfImprovementActive = !!selfImprovementMilestone;

    // Aggregate capability and alignment from achieved milestones
    // Start with base values (early-stage AI capabilities)
    const baseCapability = {
      reasoningScore: 30,
      planningCapability: 30,
      generalizationAbility: 0.1,
      creativityScore: 30,
      learningEfficiency: 30,
      selfImprovementRate: 0.3,
    };

    const baseAlignment = {
      safetyMeasures: 40,
      controlMechanisms: 40,
      valueAlignmentScore: 40,
      robustness: 40,
      interpretability: 40,
      ethicalConstraints: 40,
    };

    // Take maximum capability and alignment across all achieved milestones
    // (represents current state of most advanced achieved milestone)
    const achievedMilestones = milestones.filter((m) => m.status === 'Achieved');

    let currentCapability = { ...baseCapability };
    let currentAlignment = { ...baseAlignment };

    achievedMilestones.forEach((milestone) => {
      // Update capability (take max of each metric)
      currentCapability.reasoningScore = Math.max(
        currentCapability.reasoningScore,
        milestone.currentCapability.reasoningScore
      );
      currentCapability.planningCapability = Math.max(
        currentCapability.planningCapability,
        milestone.currentCapability.planningCapability
      );
      currentCapability.generalizationAbility = Math.max(
        currentCapability.generalizationAbility,
        milestone.currentCapability.generalizationAbility
      );
      currentCapability.creativityScore = Math.max(
        currentCapability.creativityScore,
        milestone.currentCapability.creativityScore
      );
      currentCapability.learningEfficiency = Math.max(
        currentCapability.learningEfficiency,
        milestone.currentCapability.learningEfficiency
      );
      currentCapability.selfImprovementRate = Math.max(
        currentCapability.selfImprovementRate,
        milestone.currentCapability.selfImprovementRate
      );

      // Update alignment (take max of each metric)
      currentAlignment.safetyMeasures = Math.max(
        currentAlignment.safetyMeasures,
        milestone.currentAlignment.safetyMeasures
      );
      currentAlignment.controlMechanisms = Math.max(
        currentAlignment.controlMechanisms,
        milestone.currentAlignment.controlMechanisms
      );
      currentAlignment.valueAlignmentScore = Math.max(
        currentAlignment.valueAlignmentScore,
        milestone.currentAlignment.valueAlignmentScore
      );
      currentAlignment.robustness = Math.max(
        currentAlignment.robustness,
        milestone.currentAlignment.robustness
      );
      currentAlignment.interpretability = Math.max(
        currentAlignment.interpretability,
        milestone.currentAlignment.interpretability
      );
      currentAlignment.ethicalConstraints = Math.max(
        currentAlignment.ethicalConstraints,
        milestone.currentAlignment.ethicalConstraints
      );
    });

    // Calculate average capability and alignment
    const avgCapability =
      (currentCapability.reasoningScore +
        currentCapability.planningCapability +
        currentCapability.generalizationAbility +
        currentCapability.creativityScore +
        currentCapability.learningEfficiency +
        currentCapability.selfImprovementRate * 100) /
      6;

    const avgAlignment =
      (currentAlignment.safetyMeasures +
        currentAlignment.controlMechanisms +
        currentAlignment.valueAlignmentScore +
        currentAlignment.robustness +
        currentAlignment.interpretability +
        currentAlignment.ethicalConstraints) /
      6;

    // Calculate capability-alignment gap
    const gap = avgCapability - avgAlignment;

    // Simulate capability explosion if self-improving
    let explosionResult = null;
    if (selfImprovementActive) {
      explosionResult = simulateCapabilityExplosion({
        hasSelfImprovement: true,
        selfImprovementRate: currentCapability.selfImprovementRate,
        currentAlignment: avgAlignment,
        currentCapability: avgCapability,
      });
    }

    // Calculate catastrophic risk (exponential based on gap)
    // Base formula: (gap / 100) × complexity_factor
    // Self-improvement multiplier: 2x-10x if active
    let catastrophicRisk = 0;

    if (gap > 0) {
      // Base risk from gap
      const baseRisk = Math.pow(gap / 100, 1.5); // Exponential scaling

      // Complexity multiplier (higher for more advanced milestones)
      const complexityFactor = achievedMilestones.length > 0 ? 1.5 : 1.0;

      // Self-improvement multiplier
      const siMultiplier = selfImprovementActive
        ? 1 + currentCapability.selfImprovementRate * 5
        : 1.0;

      catastrophicRisk = Math.min(1.0, baseRisk * complexityFactor * siMultiplier);
    }

    const controlProbability = 1.0 - catastrophicRisk;

    // Determine risk level
    let riskLevel: string;
    if (catastrophicRisk < 0.05) riskLevel = 'Low';
    else if (catastrophicRisk < 0.15) riskLevel = 'Moderate';
    else if (catastrophicRisk < 0.25) riskLevel = 'High';
    else if (catastrophicRisk < 0.4) riskLevel = 'Critical';
    else riskLevel = 'Existential';

    // Generate emergency actions based on risk level
    const emergencyActions: string[] = [];

    if (riskLevel === 'Existential') {
      emergencyActions.push('EMERGENCY: Halt all capability research immediately');
      emergencyActions.push('EMERGENCY: Dedicate 100% resources to alignment');
      emergencyActions.push('EMERGENCY: Consider shutdown protocols');
      emergencyActions.push('EMERGENCY: Activate containment procedures');
    } else if (riskLevel === 'Critical') {
      emergencyActions.push('IMMEDIATE: Activate alignment safeguards');
      emergencyActions.push('CRITICAL: Slow capability research significantly');
      emergencyActions.push('URGENT: Invest heavily in safety measures');
      emergencyActions.push('MONITOR: 24/7 risk assessment required');
    } else if (riskLevel === 'High') {
      emergencyActions.push('Priority: Increase alignment investment');
      emergencyActions.push('Caution: Monitor capability-alignment gap closely');
      emergencyActions.push('Recommend: Implement additional safety protocols');
    } else if (riskLevel === 'Moderate') {
      emergencyActions.push('Advisory: Maintain alignment research pace');
      emergencyActions.push('Suggest: Balance capability and safety investments');
    } else {
      emergencyActions.push('Status: Risk within acceptable parameters');
      emergencyActions.push('Continue: Current research trajectory');
    }

    // Generate message
    let message = `${riskLevel.toUpperCase()} RISK: ${(catastrophicRisk * 100).toFixed(
      1
    )}% catastrophic risk with ${gap.toFixed(1)}-point gap`;
    if (selfImprovementActive) {
      message += ' (Self-improvement active - risk accelerating)';
    }

    return createSuccessResponse({
      catastrophicRisk,
      controlProbability,
      riskLevel,
      gap,
      currentCapability,
      currentAlignment,
      selfImprovementActive,
      explosionResult,
      emergencyActions,
      message,
    });
  } catch (error) {
    console.error('Error assessing catastrophic risk:', error);
    return createErrorResponse(
      'Failed to assess risk',
      ErrorCode.INTERNAL_ERROR,
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. CAPABILITY AGGREGATION:
 *    - Base capability: { reasoning: 30, planning: 30, generalization: 0.1, ... }
 *    - Take Math.max() of each metric across all achieved milestones
 *    - Represents current state of most advanced achieved milestone
 *    - Example: If 2 milestones achieved with reasoning 50 and 70 → use 70
 * 
 * 2. ALIGNMENT AGGREGATION:
 *    - Base alignment: { safety: 40, control: 40, values: 40, ... }
 *    - Take Math.max() of each metric across all achieved milestones
 *    - Represents best alignment state achieved so far
 *    - Example: If safety is 60 in milestone A and 45 in milestone B → use 60
 * 
 * 3. GAP CALCULATION:
 *    - avgCapability = sum of 6 capability metrics / 6
 *    - avgAlignment = sum of 6 alignment metrics / 6
 *    - gap = avgCapability - avgAlignment
 *    - Positive gap: Capability exceeds alignment (DANGER)
 *    - Negative gap: Alignment exceeds capability (SAFE)
 *    - Example: 75 capability, 45 alignment → gap = 30
 * 
 * 4. SELF-IMPROVEMENT DETECTION:
 *    - Find milestone with milestoneType === 'Self-Improvement'
 *    - Check if status === 'Achieved'
 *    - If yes: selfImprovementActive = true, risk multiplier applied
 *    - Triggers capability explosion simulation
 * 
 * 5. CAPABILITY EXPLOSION SIMULATION:
 *    - Only if selfImprovementActive === true
 *    - Calls simulateCapabilityExplosion(capability, alignment, siRate) utility
 *    - Returns: { monthsUntilExplosion, finalCapability, alignmentDegradation, timelineAcceleration }
 *    - Simulates exponential capability growth with alignment lag
 * 
 * 6. CATASTROPHIC RISK FORMULA:
 *    - Base risk: (gap / 100)^1.5 (exponential scaling)
 *    - Complexity factor: 1.5x if milestones achieved, 1.0x if none
 *    - Self-improvement multiplier: 1 + (siRate × 5) if active
 *    - Final risk: min(1.0, baseRisk × complexity × siMultiplier)
 *    - Example: gap 40, 3 milestones, SI active (0.5 rate) → ~64% risk
 * 
 * 7. RISK LEVELS:
 *    - Low: <5% catastrophic risk (safe to continue)
 *    - Moderate: 5-15% (caution advised)
 *    - High: 15-25% (significant danger)
 *    - Critical: 25-40% (emergency measures required)
 *    - Existential: 40%+ (immediate shutdown recommended)
 * 
 * 8. EMERGENCY ACTIONS:
 *    - Existential: Halt all capability research, 100% alignment focus, shutdown protocols
 *    - Critical: Activate safeguards, slow capability, heavy safety investment
 *    - High: Increase alignment investment, monitor closely, add safety protocols
 *    - Moderate: Maintain pace, balance investments
 *    - Low: Continue current trajectory
 * 
 * 9. UTILITY FUNCTION USAGE:
 *    - simulateCapabilityExplosion(capability, alignment, siRate)
 *    - Located in: @/lib/utils/ai/simulateCapabilityExplosion
 *    - Returns: explosion timeline, final capability, alignment degradation
 *    - Delegation: API handles auth/aggregation, utility handles explosion logic
 * 
 * 10. PRODUCTION ENHANCEMENTS:
 *     - Real-time alerts: Notify user when risk crosses thresholds
 *     - Historical tracking: Store risk assessments over time (trend analysis)
 *     - Global leaderboards: Rank companies by lowest catastrophic risk
 *     - Competitive intelligence: Allow spying on competitor risk levels
 *     - Insurance system: Companies can buy catastrophic risk insurance
 *     - Regulatory intervention: Government entities respond to high-risk companies
 *     - Achievement system: Unlock for managing to achieve AGI with <5% risk
 * 
 * 11. ERROR HANDLING:
 *     - 401: Unauthorized (no session)
 *     - 404: Company not found
 *     - 500: Database errors, utility function errors, calculation errors
 *     - Graceful: Returns zero risk if no milestones exist
 */
