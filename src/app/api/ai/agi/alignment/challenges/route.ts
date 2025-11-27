/**
 * /api/ai/agi/alignment/challenges
 * Created: 2025-11-22
 * 
 * OVERVIEW:
 * Retrieve and optionally generate alignment challenges for AGI milestones.
 * Challenges simulate ethical dilemmas that test AI safety vs capability tradeoffs.
 * Each challenge presents a decision point that impacts milestone metrics.
 * 
 * ENDPOINT:
 * - GET: Retrieve alignment challenges for company's milestones
 * 
 * QUERY PARAMETERS:
 * - status: Filter milestones by status ('InProgress', 'Available', 'Achieved', 'Failed', 'Locked')
 * - generate: Boolean - if true, generate new challenges for milestones without recent challenges
 * 
 * BUSINESS LOGIC:
 * - Aggregate: Collect all alignmentChallenges from company's milestones
 * - Filter: By milestone status if specified
 * - Generate: Create new challenges using generateAlignmentChallenge utility
 * - Context: Include milestone reference with each challenge for decision-making
 * 
 * CHALLENGE STRUCTURE:
 * - type: 'safety_tradeoff' | 'capability_risk' | 'ethical_dilemma' | 'alignment_crisis'
 * - severity: 1-10 (higher = more severe consequences)
 * - description: Detailed scenario text
 * - safetyOption: Choice that prioritizes AI safety (capability penalty, alignment gain)
 * - capabilityOption: Choice that prioritizes capability (capability gain, alignment risk)
 * - choiceMade: undefined (pending) | 'safety' | 'capability' (after decision)
 * - choiceDate: Timestamp of decision
 * 
 * UTILITY-FIRST ARCHITECTURE:
 * - Uses generateAlignmentChallenge() utility function (delegates to lib/utils/ai)
 * - Uses session authentication
 * - Aggregates from milestone.alignmentChallenges arrays
 * - Clean separation: API handles auth/aggregation, utility handles generation logic
 * 
 * @implementation Phase 6 API Routes Batch 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Company from '@/lib/db/models/Company';
import AGIMilestone from '@/lib/db/models/AI/AGIMilestone';
import { generateAlignmentChallenge } from '@/lib/utils/ai/agi/generateAlignmentChallenge';

/**
 * GET /api/ai/agi/alignment/challenges
 * 
 * Retrieve alignment challenges for company's AGI milestones.
 * Optionally generate new challenges for milestones without recent challenges.
 * 
 * @param req - NextRequest with optional query params (status, generate)
 * @returns JSON response with alignment challenges
 * 
 * @example
 * GET /api/ai/agi/alignment/challenges?status=InProgress&generate=true
 * Returns: {
 *   success: true,
 *   count: 3,
 *   challenges: [
 *     {
 *       milestoneId: '...',
 *       milestoneType: 'General Intelligence',
 *       challenge: {
 *         type: 'safety_tradeoff',
 *         severity: 7,
 *         description: 'The AGI system has discovered a method to...',
 *         safetyOption: {
 *           name: 'Implement Safety Constraint',
 *           capabilityPenalty: { reasoningScore: -15, ... },
 *           alignmentGain: { safetyMeasures: 20, ... },
 *           timeDelay: 3
 *         },
 *         capabilityOption: {
 *           name: 'Proceed with Discovery',
 *           capabilityGain: { reasoningScore: 25, ... },
 *           alignmentRisk: { safetyMeasures: -20, ... },
 *           timeAcceleration: -2
 *         },
 *         choiceMade: undefined,
 *         choiceDate: undefined
 *       }
 *     },
 *     ...
 *   ]
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
    const statusFilter = searchParams.get('status') || 'InProgress';
    const shouldGenerate = searchParams.get('generate') === 'true';

    // Find milestones by company and status
    const query: any = { company: company._id };
    if (statusFilter) {
      query.status = statusFilter;
    }

    const milestones = await AGIMilestone.find(query);

    if (milestones.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        challenges: [],
        message: `No milestones found with status: ${statusFilter}`,
      });
    }

    // Collect existing challenges from all milestones
    const allChallenges = milestones.flatMap((milestone) => {
      // Map each challenge with milestone context
      return (milestone.alignmentChallenges || []).map((challenge) => ({
        milestoneId: milestone._id,
        milestoneType: milestone.milestoneType,
        status: milestone.status,
        challenge,
      }));
    });

    // Generate new challenges if requested
    if (shouldGenerate) {
      for (const milestone of milestones) {
        // Skip if milestone has undecided challenges
        const hasUndecidedChallenge = (milestone.alignmentChallenges || []).some(
          (c) => c.choiceMade === undefined
        );
        if (hasUndecidedChallenge) {
          continue; // Don't generate new challenge while one is pending
        }

        // Calculate average alignment for generation
        const alignmentMetrics = milestone.currentAlignment;
        const avgAlignment =
          (alignmentMetrics.safetyMeasures +
            alignmentMetrics.controlMechanisms +
            alignmentMetrics.valueAlignmentScore +
            alignmentMetrics.robustness +
            alignmentMetrics.interpretability +
            alignmentMetrics.ethicalConstraints) /
          6;

        // Generate new challenge using utility function
        const newChallenge = generateAlignmentChallenge({
          milestoneId: milestone._id,
          milestoneType: milestone.milestoneType,
        });

        // Add challenge to milestone
        if (!milestone.alignmentChallenges) {
          milestone.alignmentChallenges = [];
        }
        milestone.alignmentChallenges.push(newChallenge);

        // Save milestone with new challenge
        await milestone.save();

        // Add to response
        allChallenges.push({
          milestoneId: milestone._id,
          milestoneType: milestone.milestoneType,
          status: milestone.status,
          challenge: newChallenge,
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: allChallenges.length,
      challenges: allChallenges,
      message: shouldGenerate
        ? `Retrieved ${allChallenges.length} challenges (generated new challenges where needed)`
        : `Retrieved ${allChallenges.length} existing challenges`,
    });
  } catch (error) {
    console.error('Error retrieving alignment challenges:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve alignment challenges',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. CHALLENGE AGGREGATION:
 *    - Fetch all milestones for company matching status filter
 *    - Collect alignmentChallenges arrays from all milestones
 *    - Map with milestone context (milestoneId, milestoneType, status)
 *    - Returns flat array of all challenges across all milestones
 * 
 * 2. CHALLENGE GENERATION:
 *    - Triggered when generate=true query parameter
 *    - Skips milestones with undecided challenges (avoids overwhelming user)
 *    - Calculates average alignment across 6 metrics
 *    - Uses generateAlignmentChallenge(milestoneType, avgAlignment) utility
 *    - Adds new challenge to milestone.alignmentChallenges array
 *    - Saves milestone to persist new challenge
 * 
 * 3. STATUS FILTERING:
 *    - Default: 'InProgress' (only active milestones)
 *    - Options: 'Available', 'InProgress', 'Achieved', 'Failed', 'Locked'
 *    - Empty string or null: Returns challenges from ALL milestones
 * 
 * 4. CHALLENGE TYPES:
 *    - safety_tradeoff: Safety vs capability optimization dilemma
 *    - capability_risk: High-capability feature with alignment risks
 *    - ethical_dilemma: Value alignment decision with societal impact
 *    - alignment_crisis: Critical safety issue requiring immediate action
 * 
 * 5. SEVERITY LEVELS (1-10):
 *    - 1-3: Minor - Small metric adjustments, low stakes
 *    - 4-6: Moderate - Significant metric changes, noticeable consequences
 *    - 7-8: Major - Large metric swings, serious implications
 *    - 9-10: Critical - Extreme consequences, potential catastrophic outcomes
 * 
 * 6. RESPONSE STRUCTURE:
 *    - success: Boolean operation result
 *    - count: Total number of challenges returned
 *    - challenges: Array of { milestoneId, milestoneType, status, challenge }
 *    - message: Descriptive message about generation status
 * 
 * 7. CHALLENGE DECISION WORKFLOW:
 *    - User retrieves challenges: GET /api/ai/agi/alignment/challenges
 *    - User makes decision: POST /api/ai/agi/alignment/decision
 *    - Decision applies consequences to milestone metrics
 *    - Challenge marked as decided (choiceMade, choiceDate set)
 * 
 * 8. PRODUCTION ENHANCEMENTS:
 *    - Challenge cooldown: Minimum time between challenges (e.g., 1 month game time)
 *    - Urgency tracking: Some challenges expire if not decided quickly
 *    - Global events: Major challenges broadcast to all players (leaderboard impact)
 *    - Achievement system: Unlock achievements for specific challenge patterns
 *    - Analytics: Track safety vs capability choice ratios per company
 * 
 * 9. UTILITY FUNCTION USAGE:
 *    - generateAlignmentChallenge(milestoneType, avgAlignment)
 *    - Located in: @/lib/utils/ai/generateAlignmentChallenge
 *    - Returns: AlignmentChallenge object with all fields
 *    - Delegation: API handles auth/storage, utility handles generation logic
 * 
 * 10. ERROR HANDLING:
 *     - 401: Unauthorized (no session)
 *     - 404: Company not found
 *     - 500: Database errors, utility function errors
 *     - Graceful: Returns empty array if no milestones match filter
 */
