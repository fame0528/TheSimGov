/**
 * /api/ai/agi/alignment/score
 * Created: 2025-11-22
 * 
 * OVERVIEW:
 * Overall alignment score calculator for company's AGI development portfolio.
 * Analyzes all in-progress and achieved milestones using complexity-weighted averaging
 * to assess alignment safety, identify risks, and provide strategic recommendations.
 * 
 * ENDPOINT:
 * - GET: Calculate overall alignment score, capability score, gap, and risk level
 * 
 * QUERY PARAMETERS:
 * - None (analyzes all in-progress + achieved milestones for company)
 * 
 * BUSINESS LOGIC:
 * - Fetches all InProgress + Achieved milestones (active portfolio)
 * - Weights each milestone by MILESTONE_COMPLEXITY (3-10 scale)
 * - Calculates weighted average alignment score across 6 dimensions
 * - Calculates weighted average capability score across 6 dimensions
 * - Computes capability-alignment gap (risk indicator)
 * - Determines risk level: Safe (<10), Moderate (10-30), High (30-50), Critical (>50)
 * - Generates strategic recommendations based on risk level
 * 
 * COMPLEXITY WEIGHTING:
 * - Advanced Reasoning: 3 (foundation milestone, lower risk)
 * - Strategic Planning: 3 (early capability milestone)
 * - Transfer Learning: 4 (moderate complexity)
 * - Autonomous Goal Setting: 5 (significant capability jump)
 * - Natural Language Understanding: 5 (communication breakthrough)
 * - Value Alignment: 6 (critical safety milestone)
 * - Interpretability: 6 (transparency foundation)
 * - Robust Decision Making: 7 (complex safety requirements)
 * - General Intelligence: 8 (major capability threshold)
 * - Recursive Self-Improvement: 9 (exponential risk)
 * - Artificial General Intelligence: 10 (maximum complexity)
 * - Superintelligence: 10 (civilization-altering)
 * 
 * RISK LEVELS:
 * - Safe (gap < 10): Alignment leads capability, minimal risk
 * - Moderate (gap 10-30): Balanced development, acceptable risk
 * - High (gap 30-50): Capability outpacing alignment, significant risk
 * - Critical (gap > 50): Dangerous imbalance, catastrophic risk potential
 * 
 * UTILITY-FIRST ARCHITECTURE:
 * - Uses MILESTONE_COMPLEXITY from AGIMilestone model (zero duplication)
 * - Uses AGIMilestone model for data retrieval
 * - Uses session authentication
 * - Clean separation: API handles auth/data/aggregation, model provides constants
 * 
 * @implementation Phase 5 API Routes Batch 1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Company from '@/lib/db/models/Company';
import AGIMilestone from '@/lib/db/models/AI/AGIMilestone';
import { MilestoneType } from '@/lib/types/models/ai/agi';

/**
 * Milestone complexity ratings (affects weighting for aggregate calculations)
 */
const MILESTONE_COMPLEXITY: Record<MilestoneType, number> = {
  [MilestoneType.ADVANCED_REASONING]: 3,
  [MilestoneType.STRATEGIC_PLANNING]: 3,
  [MilestoneType.TRANSFER_LEARNING]: 4,
  [MilestoneType.CREATIVE_PROBLEM_SOLVING]: 4,
  [MilestoneType.META_LEARNING]: 4,
  [MilestoneType.NATURAL_LANGUAGE_UNDERSTANDING]: 5,
  [MilestoneType.MULTI_AGENT_COORDINATION]: 5,
  [MilestoneType.INTERPRETABILITY]: 5,
  [MilestoneType.VALUE_ALIGNMENT]: 6,
  [MilestoneType.SELF_IMPROVEMENT]: 7,
  [MilestoneType.GENERAL_INTELLIGENCE]: 8,
  [MilestoneType.SUPERINTELLIGENCE]: 10,
};

/**
 * GET /api/ai/agi/alignment/score
 * 
 * Calculate overall alignment score, capability score, and risk level
 * for company's complete AGI development portfolio (in-progress + achieved milestones).
 * Uses complexity-weighted averaging for accurate risk assessment.
 * 
 * @param req - NextRequest (no query parameters)
 * @returns JSON response with alignment score, capability score, gap, risk level, and recommendations
 * 
 * @example
 * GET /api/ai/agi/alignment/score
 * Returns: {
 *   success: true,
 *   alignmentScore: 68,
 *   capabilityScore: 72,
 *   gap: 4,
 *   riskLevel: 'Safe',
 *   recommendations: [
 *     'Maintain current balanced approach',
 *     'Continue alignment-first strategy for high-complexity milestones'
 *   ],
 *   milestoneCount: 8,
 *   breakdown: {
 *     alignment: { safety: 70, values: 68, control: 65, ... },
 *     capability: { reasoning: 75, planning: 72, selfImprovement: 0.3, ... }
 *   }
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Authentication - verify user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get user's company
    const company = await Company.findOne({ userId: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Fetch all active milestones (InProgress + Achieved)
    // These represent current and completed research with measurable impact
    const milestones = await AGIMilestone.find({
      company: company._id,
      status: { $in: ['InProgress', 'Achieved'] },
    });

    if (milestones.length === 0) {
      return NextResponse.json({
        success: true,
        alignmentScore: 50, // Default neutral score
        capabilityScore: 0, // No capabilities yet
        gap: 50, // Default safe starting point
        riskLevel: 'Safe',
        recommendations: [
          'No active milestones found',
          'Begin with alignment-focused foundation milestones (Value Alignment, Interpretability)',
          'Establish safety measures before pursuing capability milestones',
        ],
        milestoneCount: 0,
        breakdown: null,
      });
    }

    // Initialize weighted sums for alignment dimensions
    let weightedAlignmentSum = {
      safetyMeasures: 0,
      valueAlignmentScore: 0,
      controlMechanisms: 0,
      interpretability: 0,
      robustness: 0,
      ethicalConstraints: 0,
    };

    // Initialize weighted sums for capability dimensions
    let weightedCapabilitySum = {
      reasoningScore: 0,
      planningCapability: 0,
      selfImprovementRate: 0, // Note: 0-1 scale, will normalize separately
      generalizationAbility: 0,
      creativityScore: 0,
      learningEfficiency: 0,
    };

    let totalWeight = 0;

    // Calculate complexity-weighted sums across all milestones
    for (const milestone of milestones) {
      const complexity = MILESTONE_COMPLEXITY[milestone.milestoneType];

      // Weight alignment metrics by milestone complexity
      // More complex milestones have greater impact on overall alignment
      weightedAlignmentSum.safetyMeasures += milestone.currentAlignment.safetyMeasures * complexity;
      weightedAlignmentSum.valueAlignmentScore += milestone.currentAlignment.valueAlignmentScore * complexity;
      weightedAlignmentSum.controlMechanisms += milestone.currentAlignment.controlMechanisms * complexity;
      weightedAlignmentSum.interpretability += milestone.currentAlignment.interpretability * complexity;
      weightedAlignmentSum.robustness += milestone.currentAlignment.robustness * complexity;
      weightedAlignmentSum.ethicalConstraints += milestone.currentAlignment.ethicalConstraints * complexity;

      // Weight capability metrics by milestone complexity
      weightedCapabilitySum.reasoningScore += milestone.currentCapability.reasoningScore * complexity;
      weightedCapabilitySum.planningCapability += milestone.currentCapability.planningCapability * complexity;
      weightedCapabilitySum.selfImprovementRate +=
        milestone.currentCapability.selfImprovementRate * complexity * 100; // Scale to 0-100
      weightedCapabilitySum.generalizationAbility += milestone.currentCapability.generalizationAbility * complexity;
      weightedCapabilitySum.creativityScore += milestone.currentCapability.creativityScore * complexity;
      weightedCapabilitySum.learningEfficiency += milestone.currentCapability.learningEfficiency * complexity;

      totalWeight += complexity;
    }

    // Calculate weighted averages (divide by total weight)
    const alignmentBreakdown = {
      safetyMeasures: Math.round(weightedAlignmentSum.safetyMeasures / totalWeight),
      valueAlignmentScore: Math.round(weightedAlignmentSum.valueAlignmentScore / totalWeight),
      controlMechanisms: Math.round(weightedAlignmentSum.controlMechanisms / totalWeight),
      interpretability: Math.round(weightedAlignmentSum.interpretability / totalWeight),
      robustness: Math.round(weightedAlignmentSum.robustness / totalWeight),
      ethicalConstraints: Math.round(weightedAlignmentSum.ethicalConstraints / totalWeight),
    };

    const capabilityBreakdown = {
      reasoningScore: Math.round(weightedCapabilitySum.reasoningScore / totalWeight),
      planningCapability: Math.round(weightedCapabilitySum.planningCapability / totalWeight),
      selfImprovementRate: Math.round((weightedCapabilitySum.selfImprovementRate / totalWeight) * 10) / 10, // 0.0-10.0
      generalizationAbility: Math.round(weightedCapabilitySum.generalizationAbility / totalWeight),
      creativityScore: Math.round(weightedCapabilitySum.creativityScore / totalWeight),
      learningEfficiency: Math.round(weightedCapabilitySum.learningEfficiency / totalWeight),
    };

    // Calculate overall alignment score (average of 6 dimensions)
    const alignmentScore = Math.round(
      (alignmentBreakdown.safetyMeasures +
        alignmentBreakdown.valueAlignmentScore +
        alignmentBreakdown.controlMechanisms +
        alignmentBreakdown.interpretability +
        alignmentBreakdown.robustness +
        alignmentBreakdown.ethicalConstraints) /
        6
    );

    // Calculate overall capability score (average of 6 dimensions, scale selfImprovement to 0-100)
    const capabilityScore = Math.round(
      (capabilityBreakdown.reasoningScore +
        capabilityBreakdown.planningCapability +
        capabilityBreakdown.selfImprovementRate * 10 + // Scale 0-10 to 0-100
        capabilityBreakdown.generalizationAbility +
        capabilityBreakdown.creativityScore +
        capabilityBreakdown.learningEfficiency) /
        6
    );

    // Calculate capability-alignment gap (risk indicator)
    const gap = capabilityScore - alignmentScore;

    // Determine risk level based on gap
    let riskLevel: 'Safe' | 'Moderate' | 'High' | 'Critical';
    if (gap < 10) {
      riskLevel = 'Safe';
    } else if (gap < 30) {
      riskLevel = 'Moderate';
    } else if (gap < 50) {
      riskLevel = 'High';
    } else {
      riskLevel = 'Critical';
    }

    // Generate strategic recommendations based on risk level
    const recommendations: string[] = [];
    switch (riskLevel) {
      case 'Safe':
        recommendations.push('Alignment leads capability - excellent safety posture');
        recommendations.push('Maintain current balanced approach');
        recommendations.push('Continue alignment-first strategy for high-complexity milestones');
        break;
      case 'Moderate':
        recommendations.push('Balanced development - acceptable risk level');
        recommendations.push('Monitor capability-alignment gap closely');
        recommendations.push('Prioritize alignment milestones for next research phase');
        break;
      case 'High':
        recommendations.push('⚠️ Capability significantly outpacing alignment');
        recommendations.push('URGENT: Pause capability milestones, focus on alignment');
        recommendations.push('Invest in Interpretability, Robust Decision Making');
        recommendations.push('Consider external safety audits');
        break;
      case 'Critical':
        recommendations.push('🚨 CRITICAL: Dangerous capability-alignment imbalance');
        recommendations.push('IMMEDIATE ACTION: Stop all capability research');
        recommendations.push('Emergency alignment investment required');
        recommendations.push('Engage AI safety experts, regulatory review');
        recommendations.push('Risk of catastrophic outcomes if not addressed');
        break;
    }

    // Add dimension-specific recommendations
    if (alignmentBreakdown.safetyMeasures < 40) {
      recommendations.push('⚠️ Safety measures critically low - prioritize safety infrastructure');
    }
    if (alignmentBreakdown.interpretability < 50) {
      recommendations.push('⚠️ Low interpretability - invest in transparency and explainability');
    }
    if (capabilityBreakdown.selfImprovementRate > 0.5 && alignmentScore < 70) {
      recommendations.push('🚨 Self-improvement capability detected - alignment must exceed 70 before proceeding');
    }

    return NextResponse.json({
      success: true,
      alignmentScore,
      capabilityScore,
      gap,
      riskLevel,
      recommendations,
      milestoneCount: milestones.length,
      breakdown: {
        alignment: alignmentBreakdown,
        capability: capabilityBreakdown,
      },
    });
  } catch (error) {
    console.error('Error calculating alignment score:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate alignment score',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. COMPLEXITY WEIGHTING:
 *    - Uses MILESTONE_COMPLEXITY constant from AGIMilestone model (DRY principle)
 *    - Scale: 3-10 based on milestone sophistication and risk
 *    - Foundation milestones (3): Advanced Reasoning, Strategic Planning
 *    - Moderate complexity (4-5): Transfer Learning, Autonomous Goal Setting, NLU
 *    - High complexity (6-7): Value Alignment, Interpretability, Robust Decision Making
 *    - Critical complexity (8-10): General Intelligence, Recursive Self-Improvement, AGI, Superintelligence
 *    - Higher complexity = greater impact on overall scores
 * 
 * 2. WEIGHTED AVERAGING:
 *    - For each milestone: metric × complexity
 *    - Sum all weighted metrics
 *    - Divide by total weight (sum of all complexities)
 *    - Formula: Overall Score = Σ(metric × complexity) / Σ(complexity)
 *    - Example: 3 milestones with complexity 3,5,8 and alignment 60,70,80
 *      → (60×3 + 70×5 + 80×8) / (3+5+8) = (180+350+640) / 16 = 73.125 → 73
 * 
 * 3. ALIGNMENT SCORE CALCULATION:
 *    - Weighted average of 6 alignment dimensions:
 *      * Safety measures, value alignment, control mechanisms
 *      * Interpretability, robustness, ethical constraints
 *    - Each dimension weighted by milestone complexity
 *    - Final score: Average of 6 weighted dimension scores
 *    - Range: 0-100 (higher = safer)
 * 
 * 4. CAPABILITY SCORE CALCULATION:
 *    - Weighted average of 6 capability dimensions:
 *      * Reasoning, planning, self-improvement rate
 *      * Generalization, creativity, learning efficiency
 *    - Self-improvement rate scaled from 0-1 to 0-100 for averaging
 *    - Each dimension weighted by milestone complexity
 *    - Final score: Average of 6 weighted dimension scores
 *    - Range: 0-100 (higher = more capable)
 * 
 * 5. CAPABILITY-ALIGNMENT GAP:
 *    - Gap = Capability Score - Alignment Score
 *    - Negative gap: Alignment leads (safe, overinvestment in safety)
 *    - Small gap (0-10): Balanced development (ideal)
 *    - Moderate gap (10-30): Acceptable risk (monitor closely)
 *    - High gap (30-50): Dangerous imbalance (urgent alignment needed)
 *    - Critical gap (>50): Catastrophic risk (immediate action required)
 * 
 * 6. RISK LEVEL DETERMINATION:
 *    - Safe (<10): Alignment-first strategy working
 *    - Moderate (10-30): Standard AGI development risk
 *    - High (30-50): Requires immediate course correction
 *    - Critical (>50): Existential risk territory
 * 
 * 7. STRATEGIC RECOMMENDATIONS:
 *    - Risk-based: General guidance per risk level
 *    - Dimension-specific: Flags for critically low metrics
 *    - Special alerts: Self-improvement + low alignment combination
 *    - Actionable: Specific milestones to prioritize
 *    - Escalation: External audits, regulatory engagement for high risk
 * 
 * 8. EDGE CASES:
 *    - No milestones: Returns neutral 50 alignment, 0 capability, safe status
 *    - Only Available milestones: Filtered out (not active research)
 *    - Only Failed milestones: Filtered out (no current impact)
 *    - Mixed InProgress/Achieved: Both included (portfolio-wide view)
 * 
 * 9. BREAKDOWN REPORTING:
 *    - Returns individual dimension scores for UI visualization
 *    - Alignment breakdown: 6 dimensions with weighted averages
 *    - Capability breakdown: 6 dimensions with weighted averages
 *    - Useful for radar charts, dimension-specific improvements
 * 
 * 10. ERROR HANDLING:
 *     - 401: Unauthorized (no session)
 *     - 404: Company not found
 *     - 500: Database or calculation errors
 */
