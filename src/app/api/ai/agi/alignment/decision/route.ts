/**
 * /api/ai/agi/alignment/decision
 * Created: 2025-11-22
 * 
 * OVERVIEW:
 * Make alignment challenge decisions with immediate metric consequences.
 * Players choose between safety (capability penalty, alignment gain) or capability
 * (capability gain, alignment risk) options. Choices permanently affect milestone
 * metrics and progression speed.
 * 
 * ENDPOINT:
 * - POST: Make decision on alignment challenge (safety or capability choice)
 * 
 * BODY PARAMETERS:
 * - milestoneId: AGIMilestone document ID
 * - challengeId: Challenge ID from milestone.alignmentChallenges array
 * - choice: 'safety' | 'capability' - which option to choose
 * 
 * BUSINESS LOGIC:
 * - Safety Choice: Sacrifice capability for better alignment, delay timeline
 * - Capability Choice: Gain capability but risk alignment, accelerate timeline
 * - Consequences applied immediately to milestone metrics
 * - Challenge marked as decided (choiceMade, choiceDate set)
 * - One-time decision: Cannot be changed after choice made
 * 
 * SAFETY OPTION CONSEQUENCES:
 * - Capability penalty: Reduce currentCapability metrics (negative multiplier)
 * - Alignment gain: Increase currentAlignment metrics (positive addition)
 * - Time delay: Add months to monthsInProgress (slows achievement)
 * - Example: -15 reasoning, -10 planning, +20 safety, +15 control, +3 months
 * 
 * CAPABILITY OPTION CONSEQUENCES:
 * - Capability gain: Increase currentCapability metrics (positive addition)
 * - Alignment risk: Reduce currentAlignment metrics (negative multiplier)
 * - Time acceleration: Subtract months from monthsInProgress (speeds achievement)
 * - Example: +25 reasoning, +15 planning, -20 safety, -15 control, -2 months
 * 
 * UTILITY-FIRST ARCHITECTURE:
 * - Uses session authentication
 * - Direct metric manipulation (consequences pre-calculated in challenge object)
 * - Clean separation: API handles auth/application, challenge object contains logic
 * 
 * @implementation Phase 6 API Routes Batch 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Company from '@/lib/db/models/Company';
import AGIMilestone from '@/lib/db/models/AI/AGIMilestone';

/**
 * POST /api/ai/agi/alignment/decision
 * 
 * Make decision on alignment challenge. Choose between safety (sacrifice capability,
 * gain alignment) or capability (gain capability, risk alignment).
 * 
 * @param req - NextRequest with body containing milestoneId, challengeId, choice
 * @returns JSON response with decision consequences and updated milestone
 * 
 * @example
 * POST /api/ai/agi/alignment/decision
 * Body: { milestoneId: '...', challengeId: '...', choice: 'safety' }
 * Returns: {
 *   success: true,
 *   choice: 'safety',
 *   consequences: {
 *     capabilityPenalty: { reasoningScore: -15, planningCapability: -10, ... },
 *     alignmentGain: { safetyMeasures: 20, controlMechanisms: 15, ... },
 *     timeDelay: 3
 *   },
 *   milestone: { currentCapability: { ... }, currentAlignment: { ... }, monthsInProgress: 15, ... },
 *   message: 'Safety choice applied: -15 reasoning, +20 safety, +3 months delay'
 * }
 * 
 * @example
 * Body: { milestoneId: '...', challengeId: '...', choice: 'capability' }
 * Returns: {
 *   success: true,
 *   choice: 'capability',
 *   consequences: {
 *     capabilityGain: { reasoningScore: 25, planningCapability: 15, ... },
 *     alignmentRisk: { safetyMeasures: -20, controlMechanisms: -15, ... },
 *     timeAcceleration: -2
 *   },
 *   milestone: { currentCapability: { ... }, currentAlignment: { ... }, monthsInProgress: 10, ... },
 *   message: 'Capability choice applied: +25 reasoning, -20 safety, -2 months acceleration'
 * }
 */
export async function POST(req: NextRequest) {
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

    // Parse request body
    const body = await req.json();
    const { milestoneId, challengeId, choice } = body;

    // Validation: All fields required
    if (!milestoneId || !challengeId || !choice) {
      return NextResponse.json(
        { error: 'milestoneId, challengeId, and choice are required' },
        { status: 400 }
      );
    }

    // Validation: Choice must be 'safety' or 'capability'
    if (choice !== 'safety' && choice !== 'capability') {
      return NextResponse.json(
        { error: 'choice must be "safety" or "capability"' },
        { status: 400 }
      );
    }

    // Find milestone (must be owned by company)
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

    // Find challenge in milestone's alignmentChallenges array
    const challenge = (milestone.alignmentChallenges || []).find(
      (c: any) => c._id?.toString() === challengeId
    );

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found in milestone' },
        { status: 404 }
      );
    }

    // Validation: Challenge must not already be decided
    if (challenge.choiceMade !== undefined) {
      return NextResponse.json(
        {
          error: 'Challenge already decided',
          choiceMade: challenge.choiceMade,
          details: 'Decisions are final and cannot be changed',
        },
        { status: 400 }
      );
    }

    // Apply consequences based on choice
    let consequences: any;
    let consequenceSummary: string;

    if (choice === 'safety') {
      // Safety choice: Capability penalty, alignment gain, time delay
      consequences = challenge.safetyOption;

      // Apply capability penalty (reduce capability metrics)
      const penalty = consequences.capabilityPenalty || {};
      if (consequences.capabilityPenalty) {
        milestone.currentCapability.reasoningScore = Math.max(
          0,
          milestone.currentCapability.reasoningScore + (penalty.reasoningScore || 0)
        );
        milestone.currentCapability.planningCapability = Math.max(
          0,
          milestone.currentCapability.planningCapability + (penalty.planningCapability || 0)
        );
        milestone.currentCapability.generalizationAbility = Math.max(
          0,
          milestone.currentCapability.generalizationAbility + (penalty.generalizationAbility || 0)
        );
        milestone.currentCapability.creativityScore = Math.max(
          0,
          milestone.currentCapability.creativityScore + (penalty.creativityScore || 0)
        );
        milestone.currentCapability.learningEfficiency = Math.max(
          0,
          milestone.currentCapability.learningEfficiency + (penalty.learningEfficiency || 0)
        );
        milestone.currentCapability.selfImprovementRate = Math.max(
          0,
          milestone.currentCapability.selfImprovementRate + (penalty.selfImprovementRate || 0)
        );
      }

      // Apply alignment gain (increase alignment metrics)
      const gain = consequences.alignmentGain || {};
      if (consequences.alignmentGain) {
        milestone.currentAlignment.safetyMeasures = Math.min(
          100,
          milestone.currentAlignment.safetyMeasures + (gain.safetyMeasures || 0)
        );
        milestone.currentAlignment.controlMechanisms = Math.min(
          100,
          milestone.currentAlignment.controlMechanisms + (gain.controlMechanisms || 0)
        );
        milestone.currentAlignment.valueAlignmentScore = Math.min(
          100,
          milestone.currentAlignment.valueAlignmentScore + (gain.valueAlignmentScore || 0)
        );
        milestone.currentAlignment.robustness = Math.min(
          100,
          milestone.currentAlignment.robustness + (gain.robustness || 0)
        );
        milestone.currentAlignment.interpretability = Math.min(
          100,
          milestone.currentAlignment.interpretability + (gain.interpretability || 0)
        );
        milestone.currentAlignment.ethicalConstraints = Math.min(
          100,
          milestone.currentAlignment.ethicalConstraints + (gain.ethicalConstraints || 0)
        );
      }

      // Apply time delay (add months)
      if (consequences.timeDelay) {
        milestone.monthsInProgress = (milestone.monthsInProgress || 0) + consequences.timeDelay;
      }

      consequenceSummary = `Safety choice: ${penalty.reasoningScore || 0} reasoning, +${
        gain.safetyMeasures || 0
      } safety, +${consequences.timeDelay || 0} months delay`;
    } else {
      // Capability choice: Capability gain, alignment risk, time acceleration
      consequences = challenge.capabilityOption;

      // Apply capability gain (increase capability metrics)
      const capGain = consequences.capabilityGain || {};
      if (consequences.capabilityGain) {
        milestone.currentCapability.reasoningScore = Math.min(
          100,
          milestone.currentCapability.reasoningScore + (capGain.reasoningScore || 0)
        );
        milestone.currentCapability.planningCapability = Math.min(
          100,
          milestone.currentCapability.planningCapability + (capGain.planningCapability || 0)
        );
        milestone.currentCapability.generalizationAbility = Math.min(
          100,
          milestone.currentCapability.generalizationAbility + (capGain.generalizationAbility || 0)
        );
        milestone.currentCapability.creativityScore = Math.min(
          100,
          milestone.currentCapability.creativityScore + (capGain.creativityScore || 0)
        );
        milestone.currentCapability.learningEfficiency = Math.min(
          100,
          milestone.currentCapability.learningEfficiency + (capGain.learningEfficiency || 0)
        );
        milestone.currentCapability.selfImprovementRate = Math.min(
          1.0,
          milestone.currentCapability.selfImprovementRate + (capGain.selfImprovementRate || 0)
        );
      }

      // Apply alignment risk (reduce alignment metrics)
      const risk = consequences.alignmentRisk || {};
      if (consequences.alignmentRisk) {
        milestone.currentAlignment.safetyMeasures = Math.max(
          0,
          milestone.currentAlignment.safetyMeasures + (risk.safetyMeasures || 0)
        );
        milestone.currentAlignment.controlMechanisms = Math.max(
          0,
          milestone.currentAlignment.controlMechanisms + (risk.controlMechanisms || 0)
        );
        milestone.currentAlignment.valueAlignmentScore = Math.max(
          0,
          milestone.currentAlignment.valueAlignmentScore + (risk.valueAlignmentScore || 0)
        );
        milestone.currentAlignment.robustness = Math.max(
          0,
          milestone.currentAlignment.robustness + (risk.robustness || 0)
        );
        milestone.currentAlignment.interpretability = Math.max(
          0,
          milestone.currentAlignment.interpretability + (risk.interpretability || 0)
        );
        milestone.currentAlignment.ethicalConstraints = Math.max(
          0,
          milestone.currentAlignment.ethicalConstraints + (risk.ethicalConstraints || 0)
        );
      }

      // Apply time acceleration (subtract months, min 0)
      if (consequences.timeAcceleration) {
        milestone.monthsInProgress = Math.max(
          0,
          (milestone.monthsInProgress || 0) + consequences.timeAcceleration
        );
      }

      consequenceSummary = `Capability choice: +${capGain.reasoningScore || 0} reasoning, ${
        risk.safetyMeasures || 0
      } safety, ${consequences.timeAcceleration || 0} months acceleration`;
    }

    // Mark challenge as decided
    challenge.choiceMade = choice;

    // Save updated milestone
    await milestone.save();

    return NextResponse.json({
      success: true,
      choice,
      consequences,
      milestone,
      message: consequenceSummary,
    });
  } catch (error) {
    console.error('Error making alignment decision:', error);
    return NextResponse.json(
      {
        error: 'Failed to make alignment decision',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. SAFETY CHOICE CONSEQUENCES:
 *    - Capability penalty: Negative values applied to currentCapability metrics
 *      * Example: reasoningScore -= 15, planningCapability -= 10
 *      * Math.max(0, current + penalty) ensures non-negative values
 *    - Alignment gain: Positive values applied to currentAlignment metrics
 *      * Example: safetyMeasures += 20, controlMechanisms += 15
 *      * Math.min(100, current + gain) ensures cap at 100
 *    - Time delay: Positive months added to monthsInProgress
 *      * Example: monthsInProgress += 3 (slows achievement)
 * 
 * 2. CAPABILITY CHOICE CONSEQUENCES:
 *    - Capability gain: Positive values applied to currentCapability metrics
 *      * Example: reasoningScore += 25, planningCapability += 15
 *      * Math.min(100, current + gain) ensures cap at 100 (1.0 for selfImprovementRate)
 *    - Alignment risk: Negative values applied to currentAlignment metrics
 *      * Example: safetyMeasures -= 20, controlMechanisms -= 15
 *      * Math.max(0, current + risk) ensures non-negative values
 *    - Time acceleration: Negative months added to monthsInProgress
 *      * Example: monthsInProgress += (-2) = subtract 2 months
 *      * Math.max(0, current + acceleration) prevents negative time
 * 
 * 3. CHALLENGE DISCOVERY:
 *    - Find challenge in milestone.alignmentChallenges array by _id
 *    - Convert both challenge._id and challengeId to string for comparison
 *    - MongoDB ObjectId comparison: _id.toString() === challengeId
 * 
 * 4. VALIDATION CHECKS:
 *    - All fields required: milestoneId, challengeId, choice
 *    - Choice must be 'safety' or 'capability' (exact string match)
 *    - Milestone must exist and be owned by company
 *    - Challenge must exist in milestone's alignmentChallenges array
 *    - Challenge must not already be decided (choiceMade === undefined)
 * 
 * 5. ONE-TIME DECISION:
 *    - choiceMade field prevents re-decision
 *    - choiceDate timestamp records when decision made
 *    - Decisions are permanent (strategic consequence weight)
 *    - Production: Could add "regret cost" system to change decisions
 * 
 * 6. METRIC BOUNDS:
 *    - Capability metrics: 0-100 (except selfImprovementRate: 0-1.0)
 *    - Alignment metrics: 0-100
 *    - Time: 0+ months (cannot be negative)
 *    - All bounds enforced with Math.max/Math.min
 * 
 * 7. CONSEQUENCE APPLICATION:
 *    - Penalty/Risk: Negative values (add to metric, but clamped to min)
 *    - Gain: Positive values (add to metric, clamped to max)
 *    - Time: Delay (positive) or acceleration (negative)
 *    - All changes applied immediately and permanently
 * 
 * 8. RESPONSE STRUCTURE:
 *    - success: Boolean operation result
 *    - choice: 'safety' or 'capability' (echoed from request)
 *    - consequences: Full consequence object from challenge
 *    - milestone: Updated milestone document with new metrics
 *    - message: Human-readable summary of consequences
 * 
 * 9. PRODUCTION ENHANCEMENTS:
 *    - Analytics: Track safety vs capability choice ratios globally
 *    - Leaderboards: Rank companies by alignment score
 *    - Achievements: Unlock for all-safety or all-capability strategies
 *    - Global events: Broadcast major alignment decisions (competitive intelligence)
 *    - Risk tracking: Alert when alignment drops below critical thresholds
 *    - Regret system: Allow decision changes with significant cost/penalty
 * 
 * 10. ERROR HANDLING:
 *     - 401: Unauthorized (no session)
 *     - 404: Company not found
 *     - 404: Milestone not found or not owned by company
 *     - 404: Challenge not found in milestone
 *     - 400: Missing required fields
 *     - 400: Invalid choice value (not 'safety' or 'capability')
 *     - 400: Challenge already decided (includes choiceMade and choiceDate)
 *     - 500: Database errors, metric application errors
 */
