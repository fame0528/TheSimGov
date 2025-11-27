/**
 * /api/ai/agi/progression-path
 * Created: 2025-11-22
 * 
 * OVERVIEW:
 * Strategic progression path calculator for AGI milestone research.
 * Analyzes current company state (achieved milestones, capability, alignment)
 * and recommends optimal milestone ordering based on alignment stance.
 * 
 * ENDPOINT:
 * - GET: Calculate optimal progression path with timeline, costs, and risks
 * 
 * QUERY PARAMETERS:
 * - stance: Alignment stance (SafetyFirst/Balanced/CapabilityFirst, defaults to Balanced)
 * 
 * BUSINESS LOGIC:
 * - Aggregates capability/alignment gains from achieved milestones
 * - Calculates current company state (starting metrics + milestone gains)
 * - Delegates to calculateMilestoneProgressionPath utility for path recommendation
 * - Returns ordered milestone list with costs, timeline, and risk assessment
 * 
 * STRATEGIC PATHS:
 * - SafetyFirst: Alignment-first ordering (48mo, 75k RP, 85 align, 5% risk, $800M)
 * - Balanced: Alternating capability/alignment (36mo, 68k RP, 70 align, 15% risk, $1.2B)
 * - CapabilityFirst: AGI rush (24mo, 60k RP, 40 align, 35% risk, $1.8B, requires align >= 60)
 * 
 * UTILITY-FIRST ARCHITECTURE:
 * - Imports calculateMilestoneProgressionPath utility (zero logic duplication)
 * - Uses AGIMilestone model for data retrieval
 * - Uses session authentication
 * - Clean separation: API handles auth/data, utility handles calculation
 * 
 * @implementation Phase 5 API Routes Batch 1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Company from '@/lib/db/models/Company';
import AGIMilestone from '@/lib/db/models/AI/AGIMilestone';
import { calculateMilestoneProgressionPath } from '@/lib/utils/ai';
import { AlignmentStance } from '@/lib/types/models/ai/agi';

/**
 * GET /api/ai/agi/progression-path
 * 
 * Calculate optimal AGI milestone progression path based on company's current state
 * and strategic alignment stance. Recommends milestone ordering with timeline and costs.
 * 
 * @param req - NextRequest with optional query parameter (stance)
 * @returns JSON response with progression path and current state
 * 
 * @example
 * GET /api/ai/agi/progression-path?stance=SafetyFirst
 * Returns: {
 *   success: true,
 *   progressionPath: {
 *     recommendedOrder: ['Value Alignment', 'Interpretability', ...],
 *     totalEstimatedMonths: 48,
 *     totalResearchPoints: 75000,
 *     estimatedFinalAlignment: 85,
 *     overallRiskLevel: 'Low'
 *   },
 *   currentState: { capability: {...}, alignment: {...}, achievedMilestones: [...] }
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const stance = (searchParams.get('stance') as AlignmentStance) || AlignmentStance.BALANCED;

    // Validate stance
    if (!Object.values(AlignmentStance).includes(stance)) {
      return NextResponse.json(
        { error: `Invalid alignment stance: ${stance}` },
        { status: 400 }
      );
    }

    // Get achieved milestones to calculate current capability/alignment
    const achievedMilestones = await AGIMilestone.find({
      company: company._id,
      status: 'Achieved',
    });

    // Initialize base metrics (company starting point before any milestones)
    let currentCapability = {
      reasoningScore: 30,
      planningCapability: 30,
      selfImprovementRate: 0.1,
      generalizationAbility: 30,
      creativityScore: 30,
      learningEfficiency: 30,
    };

    let currentAlignment = {
      safetyMeasures: 40,
      valueAlignmentScore: 40,
      controlMechanisms: 40,
      interpretability: 40,
      robustness: 40,
      ethicalConstraints: 40,
    };

    // Aggregate capability/alignment gains from achieved milestones
    // Each milestone provides metric boosts based on its type
    for (const milestone of achievedMilestones) {
      // Capability boosts (additive gains capped at 100)
      currentCapability.reasoningScore = Math.min(
        100,
        currentCapability.reasoningScore + Math.max(0, milestone.currentCapability.reasoningScore - 0)
      );
      currentCapability.planningCapability = Math.min(
        100,
        currentCapability.planningCapability + Math.max(0, milestone.currentCapability.planningCapability - 0)
      );
      currentCapability.selfImprovementRate = Math.min(
        1,
        currentCapability.selfImprovementRate + Math.max(0, milestone.currentCapability.selfImprovementRate - 0)
      );
      currentCapability.generalizationAbility = Math.min(
        100,
        currentCapability.generalizationAbility +
          Math.max(0, milestone.currentCapability.generalizationAbility - 0)
      );
      currentCapability.creativityScore = Math.min(
        100,
        currentCapability.creativityScore + Math.max(0, milestone.currentCapability.creativityScore - 0)
      );
      currentCapability.learningEfficiency = Math.min(
        100,
        currentCapability.learningEfficiency + Math.max(0, milestone.currentCapability.learningEfficiency - 0)
      );

      // Alignment adjustments (can increase or decrease based on milestone type)
      currentAlignment.safetyMeasures = Math.max(
        0,
        Math.min(100, currentAlignment.safetyMeasures + (milestone.currentAlignment.safetyMeasures - 50))
      );
      currentAlignment.valueAlignmentScore = Math.max(
        0,
        Math.min(
          100,
          currentAlignment.valueAlignmentScore + (milestone.currentAlignment.valueAlignmentScore - 50)
        )
      );
      currentAlignment.controlMechanisms = Math.max(
        0,
        Math.min(100, currentAlignment.controlMechanisms + (milestone.currentAlignment.controlMechanisms - 50))
      );
      currentAlignment.interpretability = Math.max(
        0,
        Math.min(100, currentAlignment.interpretability + (milestone.currentAlignment.interpretability - 50))
      );
      currentAlignment.robustness = Math.max(
        0,
        Math.min(100, currentAlignment.robustness + (milestone.currentAlignment.robustness - 50))
      );
      currentAlignment.ethicalConstraints = Math.max(
        0,
        Math.min(
          100,
          currentAlignment.ethicalConstraints + (milestone.currentAlignment.ethicalConstraints - 50)
        )
      );
    }

    // Available research points (NOTE: In production, use company.researchPoints)
    // For MVP, assume generous research budget
    const availableResearchPoints = 50000;

    // Calculate optimal progression path using utility function
    // This delegates all calculation logic to the utility (DRY principle)
    const progressionPath = calculateMilestoneProgressionPath({
      currentCapability: Object.values(currentCapability).reduce((sum, val) => sum + val, 0) / 6,
      currentAlignment: Object.values(currentAlignment).reduce((sum, val) => sum + val, 0) / 6,
      stance,
      availableRP: availableResearchPoints
    });

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
    console.error('Error calculating progression path:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate progression path',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. CAPABILITY/ALIGNMENT AGGREGATION:
 *    - Base metrics: 30 capability, 40 alignment (starting company state)
 *    - Milestone gains: Additive with caps (0-100 for most, 0-1 for rates)
 *    - Capability: Always increases from milestone achievements
 *    - Alignment: Can increase (alignment milestones) or decrease (capability milestones)
 *    - Example: Advanced Reasoning adds +25 reasoning, -5 safety
 * 
 * 2. UTILITY DELEGATION:
 *    - API handles: Auth, data retrieval, state aggregation
 *    - Utility handles: Path calculation, cost estimation, risk assessment
 *    - Zero duplication: All calculation logic in utility function
 *    - Clean separation of concerns
 * 
 * 3. PROGRESSION PATH OUTPUT:
 *    - Recommended milestone order (array of MilestoneType)
 *    - Total timeline (months)
 *    - Total research points required
 *    - Total compute budget
 *    - Estimated final capability/alignment scores
 *    - Overall risk level
 *    - Critical decision points
 * 
 * 4. STRATEGIC STANCES:
 *    - SafetyFirst: Prioritizes alignment milestones early
 *      * Timeline: 48 months (slower, safer)
 *      * Alignment: 85 (high safety margins)
 *      * Risk: 5% (minimal catastrophic risk)
 *    - Balanced: Alternates capability and alignment
 *      * Timeline: 36 months (moderate pace)
 *      * Alignment: 70 (acceptable balance)
 *      * Risk: 15% (manageable risk)
 *    - CapabilityFirst: Rushes to AGI milestones
 *      * Timeline: 24 months (fastest to AGI)
 *      * Alignment: 40 (minimum safe threshold)
 *      * Risk: 35% (high risk, requires align >= 60 to enable)
 * 
 * 5. AVAILABLE RESEARCH POINTS:
 *    - Currently hardcoded to 50k RP (generous for MVP)
 *    - Production: Read from company.researchPoints
 *    - Path calculator adjusts recommendations based on budget
 *    - Insufficient RP: Suggests incremental milestones
 * 
 * 6. CURRENT STATE REPORTING:
 *    - Returns company's current capability/alignment metrics
 *    - Lists achieved milestones for context
 *    - Shows available research budget
 *    - Useful for UI display and strategy planning
 * 
 * 7. ERROR HANDLING:
 *    - 401: Unauthorized (no session)
 *    - 404: Company not found
 *    - 400: Invalid alignment stance
 *    - 500: Database or calculation errors
 */
