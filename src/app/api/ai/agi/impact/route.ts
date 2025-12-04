/**
 * /api/ai/agi/impact
 * Created: 2025-11-22
 * 
 * OVERVIEW:
 * Industry disruption and economic impact prediction for AGI milestone achievements.
 * Analyzes how a company's AGI milestones affect global markets, competitive landscape,
 * and economic conditions based on capability level, alignment level, and first-mover advantage.
 * 
 * ENDPOINT:
 * - GET: Predict industry disruption for specific or latest milestone
 * 
 * QUERY PARAMETERS:
 * - milestoneType: Specific milestone to analyze (optional, defaults to latest achieved)
 * 
 * BUSINESS LOGIC:
 * - Finds target milestone (specified or latest achieved)
 * - Calculates average alignment from milestone metrics
 * - Detects first-mover advantage (first company to achieve this milestone)
 * - Delegates to predictIndustryDisruption utility for impact calculation
 * - Calculates cumulative impact from all achieved milestones
 * - Returns disruption predictions and economic consequences
 * 
 * DISRUPTION FACTORS:
 * - Capability level: Higher capabilities = greater disruption
 * - Alignment level: Lower alignment = higher risk/volatility
 * - First-mover advantage: +50% market impact for pioneers
 * - Milestone type: AGI/Superintelligence have exponential impact
 * 
 * IMPACT DIMENSIONS:
 * - Economic: Job displacement, productivity gains, market valuation
 * - Competitive: Market share shifts, competitor responses, barriers to entry
 * - Social: Public perception, regulatory response, workforce adaptation
 * - Strategic: Monopoly risk, global power shifts, technological dependencies
 * 
 * UTILITY-FIRST ARCHITECTURE:
 * - Imports predictIndustryDisruption utility (zero logic duplication)
 * - Uses AGIMilestone model for data retrieval
 * - Uses session authentication
 * - Clean separation: API handles auth/data, utility handles calculation
 * 
 * @implementation Phase 5 API Routes Batch 1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import Company from '@/lib/db/models/Company';
import AGIMilestone from '@/lib/db/models/AI/AGIMilestone';
import { predictIndustryDisruption } from '@/lib/utils/ai';
import { MilestoneType } from '@/lib/types/models/ai/agi';

/**
 * GET /api/ai/agi/impact
 * 
 * Predict industry disruption and economic impact of AGI milestone achievements.
 * Analyzes specific milestone or latest achieved milestone for market consequences.
 * 
 * @param req - NextRequest with optional query parameter (milestoneType)
 * @returns JSON response with disruption prediction and cumulative impact
 * 
 * @example
 * GET /api/ai/agi/impact?milestoneType=AdvancedReasoning
 * Returns: {
 *   success: true,
 *   milestone: { milestoneType: 'AdvancedReasoning', status: 'Achieved', ... },
 *   disruption: {
 *     impactLevel: 'High',
 *     economicImpact: { jobDisplacement: 12, productivityGain: 25, marketValuation: 50 },
 *     competitiveImpact: { marketShare: 35, barriers: 'High' },
 *     socialImpact: { publicPerception: 'Mixed', regulatoryPressure: 'Moderate' },
 *     timeline: { shortTerm: '...', longTerm: '...' }
 *   },
 *   cumulativeImpact: { totalDisruption: 85, monopolyRisk: 'Moderate', ... }
 * }
 * 
 * @example
 * GET /api/ai/agi/impact
 * Returns disruption for latest achieved milestone
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const milestoneTypeParam = searchParams.get('milestoneType') as MilestoneType | null;

    // Find target milestone (specified type or latest achieved)
    let milestone;
    if (milestoneTypeParam) {
      // Validate milestone type
      if (!Object.values(MilestoneType).includes(milestoneTypeParam)) {
        return createErrorResponse(`Invalid milestone type: ${milestoneTypeParam}`, ErrorCode.VALIDATION_ERROR, 400);
      }

      // Find specific milestone for this company
      milestone = await AGIMilestone.findOne({
        company: company._id,
        milestoneType: milestoneTypeParam,
        status: 'Achieved',
      });

      if (!milestone) {
        return createErrorResponse(
          `Milestone ${milestoneTypeParam} not achieved by company`,
          ErrorCode.NOT_FOUND,
          404,
          { details: 'Only achieved milestones can be analyzed for impact' }
        );
      }
    } else {
      // No milestone specified, find latest achieved
      milestone = await AGIMilestone.findOne({
        company: company._id,
        status: 'Achieved',
      }).sort({ achievedAt: -1 }); // Sort by most recent achievement

      if (!milestone) {
        return createErrorResponse(
          'No achieved milestones found',
          ErrorCode.NOT_FOUND,
          404,
          { details: 'Company must achieve at least one milestone to analyze impact' }
        );
      }
    }

    // Calculate average alignment from milestone metrics
    // Average of all 6 alignment dimensions
    const alignmentMetrics = milestone.currentAlignment;
    const avgAlignment =
      (alignmentMetrics.safetyMeasures +
        alignmentMetrics.valueAlignmentScore +
        alignmentMetrics.controlMechanisms +
        alignmentMetrics.interpretability +
        alignmentMetrics.robustness +
        alignmentMetrics.ethicalConstraints) /
      6;

    // Detect first-mover advantage
    // Check if any other company achieved this milestone before this company
    const earlierAchievements = await AGIMilestone.countDocuments({
      milestoneType: milestone.milestoneType,
      status: 'Achieved',
      achievedAt: { $lt: milestone.achievedAt },
      company: { $ne: company._id }, // Exclude this company
    });

    const isFirstMover = earlierAchievements === 0;

    // Calculate industry disruption using utility function
    // This delegates all calculation logic to the utility (DRY principle)
    const disruption = predictIndustryDisruption({
      milestoneType: milestone.milestoneType,
      alignmentLevel: avgAlignment,
      isFirstMover,
      competitorCount: 5
    });

    // Calculate cumulative impact from all achieved milestones
    const allAchievedMilestones = await AGIMilestone.find({
      company: company._id,
      status: 'Achieved',
    });

    // Aggregate cumulative disruption scores
    let totalDisruption = 0;
    let maxSingleDisruption = 0;
    const milestoneImpacts = [];

    for (const m of allAchievedMilestones) {
      // Calculate alignment for this milestone
      const mAlign =
        (m.currentAlignment.safetyMeasures +
          m.currentAlignment.valueAlignmentScore +
          m.currentAlignment.controlMechanisms +
          m.currentAlignment.interpretability +
          m.currentAlignment.robustness +
          m.currentAlignment.ethicalConstraints) /
        6;

      // Check first-mover status for this milestone
      const mEarlier = await AGIMilestone.countDocuments({
        milestoneType: m.milestoneType,
        status: 'Achieved',
        achievedAt: { $lt: m.achievedAt },
        company: { $ne: company._id },
      });
      const mFirstMover = mEarlier === 0;

      // Predict disruption for this milestone
      const mDisruption = predictIndustryDisruption({
        milestoneType: m.milestoneType,
        alignmentLevel: mAlign,
        isFirstMover: mFirstMover,
        competitorCount: 5
      });

      // Track impacts
      milestoneImpacts.push({
        type: m.milestoneType,
        impactLevel: mDisruption.disruptionLevel,
        economicScore: mDisruption.marketShareShift,
      });

      // Aggregate disruption scores
      // Economic impact as proxy for total disruption (0-100 scale)
      const disruptionScore = mDisruption.disruptionScore;

      totalDisruption += disruptionScore;
      maxSingleDisruption = Math.max(maxSingleDisruption, disruptionScore);
    }

    // Calculate cumulative impact metrics
    const cumulativeImpact = {
      totalDisruption: Math.round(totalDisruption),
      averageDisruption: Math.round(totalDisruption / allAchievedMilestones.length),
      maxSingleDisruption: Math.round(maxSingleDisruption),
      milestoneCount: allAchievedMilestones.length,
      monopolyRisk: maxSingleDisruption > 80 ? 'High' : maxSingleDisruption > 50 ? 'Moderate' : 'Low',
      milestoneImpacts,
    };

    return createSuccessResponse({
      milestone: {
        milestoneType: milestone.milestoneType,
        status: milestone.status,
        achievedAt: milestone.achievedAt,
        avgAlignment: Math.round(avgAlignment),
        isFirstMover,
      },
      disruption,
      cumulativeImpact,
    });
  } catch (error) {
    console.error('Error predicting industry impact:', error);
    return createErrorResponse(
      'Failed to predict industry impact',
      ErrorCode.INTERNAL_ERROR,
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. MILESTONE SELECTION:
 *    - Query param provided: Find specific milestone by type + company + Achieved status
 *    - No query param: Find latest achieved milestone (sort by achievedAt desc)
 *    - Error if milestone not achieved: Only achieved milestones have real impact
 *    - Error if no achievements: Company needs at least 1 milestone
 * 
 * 2. AVERAGE ALIGNMENT CALCULATION:
 *    - Aggregates 6 alignment dimensions: safety, values, control, interpretability, robustness, ethics
 *    - Simple average: (sum of 6 metrics) / 6
 *    - Range: 0-100 (used as alignment parameter for utility)
 *    - Higher alignment = lower risk in disruption predictions
 * 
 * 3. FIRST-MOVER DETECTION:
 *    - Query other companies for same milestone type
 *    - Filter: status: Achieved, achievedAt < this company's achievement date
 *    - Count = 0: This company is first-mover (+50% market impact)
 *    - Count > 0: Follower (standard impact calculations)
 *    - Critical for competitive advantage modeling
 * 
 * 4. UTILITY DELEGATION:
 *    - API handles: Auth, data retrieval, first-mover detection, cumulative aggregation
 *    - Utility handles: Impact calculation, economic modeling, competitive analysis
 *    - Zero duplication: All impact prediction logic in utility function
 *    - Clean separation of concerns
 * 
 * 5. CUMULATIVE IMPACT AGGREGATION:
 *    - Fetches ALL achieved milestones for company
 *    - For each: Calculate alignment, detect first-mover, predict disruption
 *    - Aggregates: Total disruption, average per milestone, max single impact
 *    - Monopoly risk: Based on max single disruption (>80 High, >50 Moderate, else Low)
 *    - Returns milestone-level breakdown for UI visualization
 * 
 * 6. DISRUPTION OUTPUT:
 *    - Impact level: Low/Moderate/High/Extreme (overall assessment)
 *    - Economic impact: Job displacement (%), productivity gain (%), market valuation ($B)
 *    - Competitive impact: Market share shift (%), barriers to entry (High/Medium/Low)
 *    - Social impact: Public perception, regulatory pressure, workforce adaptation
 *    - Timeline: Short-term (1-2yr), medium-term (3-5yr), long-term (5-10yr) predictions
 * 
 * 7. FIRST-MOVER ADVANTAGE:
 *    - Economic: +50% market valuation, +25% market share
 *    - Competitive: Higher barriers to entry, network effects
 *    - Strategic: Standard-setting power, talent attraction, investment priority
 *    - Example: First to Superintelligence = near-monopoly scenario
 * 
 * 8. ERROR HANDLING:
 *    - 401: Unauthorized (no session)
 *    - 404: Company not found
 *    - 400: Invalid milestone type parameter
 *    - 404: Milestone not achieved (can't predict impact for unrealized milestones)
 *    - 404: No achieved milestones (company needs at least 1)
 *    - 500: Database or calculation errors
 */
