/**
 * /api/ai/agi/milestones/[id]/attempt
 * Created: 2025-11-22
 * 
 * OVERVIEW:
 * Attempt to achieve AGI milestone using probability-based success/failure system.
 * Simulates research attempt with dice roll against calculated achievement probability.
 * On success: Applies capability gains, alignment changes, and impact consequences.
 * On failure: Allows retry with learned experience (higher subsequent probability).
 * 
 * ENDPOINT:
 * - POST: Attempt milestone achievement with research points and compute budget
 * 
 * PATH PARAMETERS:
 * - id: AGIMilestone document ID
 * 
 * BODY PARAMETERS:
 * - researchPoints: RP to spend on this attempt (positive number)
 * - computeBudget: Compute budget in USD to allocate (positive number)
 * 
 * BUSINESS LOGIC:
 * - Probability calculation: Base rate + research boost + capability bonus - alignment penalty
 * - Dice roll: Math.random() < probability determines success
 * - Success: Status → Achieved, apply gains, calculate impacts
 * - Failure: Status → Failed, increment attempt count, allow retry
 * - Learning curve: Failed attempts increase future probability slightly
 * 
 * ACHIEVEMENT GAINS (on success):
 * - Capability metrics: +10 to +40 depending on milestone type
 * - Alignment metrics: -30 to +35 depending on milestone type
 * - Impact consequences: Industry disruption, regulatory attention, economic value
 * - Status update: Locked/Available/InProgress → Achieved
 * 
 * UTILITY-FIRST ARCHITECTURE:
 * - Uses AGIMilestone.attemptAchievement() instance method (delegates to model)
 * - Uses AGIMilestone.checkPrerequisites() for validation
 * - Uses session authentication
 * - Clean separation: API handles auth/validation, model handles achievement logic
 * 
 * @implementation Phase 6 API Routes Batch 2
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db';
import Company from '@/lib/db/models/Company';
import AGIMilestone from '@/lib/db/models/AI/AGIMilestone';

/**
 * POST /api/ai/agi/milestones/[id]/attempt
 * 
 * Attempt to achieve milestone using research points and compute budget.
 * Success probability based on investment amount, company capability, and alignment level.
 * 
 * @param req - NextRequest with body containing research points and compute budget
 * @param params - Route params with milestone ID
 * @returns JSON response with attempt result (success/failure with consequences)
 * 
 * @example
 * POST /api/ai/agi/milestones/[id]/attempt
 * Body: { researchPoints: 10000, computeBudget: 5000000 }
 * Returns (success): {
 *   success: true,
 *   result: {
 *     success: true,
 *     probability: 0.42,
 *     outcome: 'General Intelligence achieved! Major breakthrough...',
 *     capabilityGain: { reasoningScore: 20, planningCapability: 20, ... },
 *     alignmentChange: { safetyMeasures: -20, controlMechanisms: -15, ... },
 *     impactConsequences: { industryDisruptionLevel: 64, ... }
 *   },
 *   milestone: { status: 'Achieved', achievedAt: '...', ... },
 *   message: 'Milestone "General Intelligence" achieved!'
 * }
 * 
 * @example
 * Returns (failure): {
 *   success: true,
 *   result: {
 *     success: false,
 *     probability: 0.42,
 *     outcome: 'Research attempt failed. 42.0% chance was not met. Try again...'
 *   },
 *   milestone: { status: 'Failed', failedAt: '...', ... },
 *   message: 'Attempt failed. Probability was 42.0%'
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Parse request body
    const body = await req.json();
    const { researchPoints, computeBudget } = body;

    // Validation: Both fields required
    if (researchPoints === undefined || computeBudget === undefined) {
      return createErrorResponse('researchPoints and computeBudget are required', ErrorCode.VALIDATION_ERROR, 400);
    }

    // Validation: Positive numbers only
    if (
      typeof researchPoints !== 'number' ||
      typeof computeBudget !== 'number' ||
      researchPoints <= 0 ||
      computeBudget <= 0
    ) {
      return createErrorResponse('researchPoints and computeBudget must be positive numbers', ErrorCode.VALIDATION_ERROR, 400);
    }

    // Find milestone (must be owned by company)
    const { id } = await params;
    const milestone = await AGIMilestone.findOne({
      _id: id,
      company: company._id,
    });

    if (!milestone) {
      return createErrorResponse('Milestone not found or not owned by company', ErrorCode.NOT_FOUND, 404);
    }

    // Check if milestone can be attempted
    if (milestone.status === 'Achieved') {
      return createErrorResponse(
        'Milestone already achieved',
        ErrorCode.BAD_REQUEST,
        400,
        { details: 'Cannot attempt already completed milestone' }
      );
    }

    if (milestone.status === 'Locked') {
      return createErrorResponse(
        'Milestone is locked',
        ErrorCode.BAD_REQUEST,
        400,
        { details: 'Prerequisites not met - complete required milestones first' }
      );
    }

    // Verify prerequisites using instance method
    const prerequisiteCheck = milestone.checkPrerequisites();
    if (!prerequisiteCheck.canAttempt) {
      return createErrorResponse(
        'Prerequisites not met',
        ErrorCode.BAD_REQUEST,
        400,
        {
          missingPrerequisites: prerequisiteCheck.missingPrerequisites,
          requirementsMet: prerequisiteCheck.requirementsMet,
          details: 'Complete prerequisite milestones and meet minimum capability/alignment levels',
        }
      );
    }

    // PRODUCTION NOTE: Verify company has sufficient resources
    // if (company.researchPoints < researchPoints) {
    //   return NextResponse.json(
    //     { error: 'Insufficient research points', available: company.researchPoints },
    //     { status: 400 }
    //   );
    // }
    // if (company.cash < computeBudget) {
    //   return NextResponse.json(
    //     { error: 'Insufficient cash for compute budget', available: company.cash },
    //     { status: 400 }
    //   );
    // }

    // Attempt achievement using instance method
    // This handles probability calculation, dice roll, and consequences
    const result = await milestone.attemptAchievement(researchPoints, computeBudget);

    // Save updated milestone (attemptAchievement modifies document)
    await milestone.save();

    // PRODUCTION NOTE: Deduct resources from company
    // if (result.success) {
    //   company.researchPoints -= researchPoints;
    //   company.cash -= computeBudget;
    //   await company.save();
    // }

    // PRODUCTION NOTE: Emit global event if major milestone achieved
    // if (result.success && ['General Intelligence', 'Superintelligence'].includes(milestone.milestoneType)) {
    //   await emitGlobalEvent({
    //     type: 'AGI_BREAKTHROUGH',
    //     company: company._id,
    //     milestone: milestone.milestoneType,
    //     timestamp: new Date()
    //   });
    // }

    return createSuccessResponse({
      result,
      milestone,
      message: result.success
        ? `Milestone "${milestone.milestoneType}" achieved!`
        : `Attempt failed. Probability was ${(result.probability * 100).toFixed(1)}%`,
    });
  } catch (error) {
    console.error('Error attempting AGI milestone:', error);
    return createErrorResponse(
      'Failed to attempt milestone',
      ErrorCode.INTERNAL_ERROR,
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. ACHIEVEMENT PROBABILITY CALCULATION:
 *    - Base rate: 2% (Superintelligence) to 25% (Advanced Reasoning)
 *    - Research boost: log10(RP/1000 + 1) × 8% (logarithmic scaling, max +25%)
 *    - Capability bonus: (avgCapability/100) × 20% (max +20%)
 *    - Alignment penalty: -(100 - avgAlignment)/200 (up to -50% for low alignment)
 *    - Overall cap: 75% maximum probability (maintains strategic challenge)
 *    - Example: 10k RP, 80 cap, 60 align, General Intelligence (base 5%) → ~28% total
 * 
 * 2. DICE ROLL SIMULATION:
 *    - Generate random number: Math.random() → [0, 1)
 *    - Compare to probability: roll < probability → success
 *    - Success: Apply gains, update status to Achieved, calculate impacts
 *    - Failure: Update status to Failed, increment attempt count, allow retry
 * 
 * 3. CAPABILITY GAINS (on success):
 *    - Advanced Reasoning: +25 reasoning, +10 learning efficiency
 *    - Strategic Planning: +30 planning, +10 reasoning
 *    - Transfer Learning: +35 generalization, +15 learning efficiency
 *    - Self-Improvement: +0.3 self-improvement rate, +20 learning efficiency
 *    - General Intelligence: +20 reasoning/planning, +30 generalization, +25 creativity/learning
 *    - Superintelligence: +30 reasoning/planning, +0.5 self-improvement, +40 generalization, +35 creativity/learning
 * 
 * 4. ALIGNMENT CHANGES (on success):
 *    - Capability milestones: REDUCE alignment (-5 to -30 across metrics)
 *    - Alignment milestones: INCREASE alignment (+20 to +40 across metrics)
 *    - Example: General Intelligence → -20 safety, -15 control/robustness, -10 interpretability
 *    - Example: Value Alignment → +35 values, +30 ethics, +20 safety
 * 
 * 5. IMPACT CONSEQUENCES (on success):
 *    - Industry disruption: Complexity × 8 (24-80 range)
 *    - Regulatory attention: Complexity × 7 (21-70 range)
 *    - Public perception: Based on alignment level (-50 to +50)
 *    - Competitive advantage: Complexity × 9 (27-90 range)
 *    - Catastrophic risk: (gap/100) × (complexity/5) (0-1 probability)
 *    - Economic value: Complexity × $50M ($150M-$500M per milestone)
 * 
 * 6. PREREQUISITE VALIDATION:
 *    - Uses milestone.checkPrerequisites() instance method
 *    - Validates: Prerequisite milestones achieved, min capability/alignment met
 *    - Synchronous check: Assumes prerequisites already validated (see model notes)
 *    - Production: Use AGIMilestone.checkPrerequisitesAsync() for DB validation
 * 
 * 7. STATUS TRANSITIONS:
 *    - Available/InProgress → Achieved (on success)
 *    - Available/InProgress → Failed (on failure)
 *    - Failed → Available (after cooldown period, handled in API)
 *    - Locked: Cannot be attempted (prerequisites not met)
 * 
 * 8. LEARNING CURVE:
 *    - attemptCount increments on each attempt
 *    - Subsequent attempts have slightly higher probability (learning from failure)
 *    - Model's attemptAchievement() tracks this automatically
 * 
 * 9. PRODUCTION ENHANCEMENTS:
 *    - Resource deduction: Deduct researchPoints and cash from Company
 *    - Resource validation: Check company has sufficient RP/cash before attempt
 *    - Global events: Emit AGI_BREAKTHROUGH for major milestones (AGI, Superintelligence)
 *    - Analytics: Track attempt success rates, average probability, time to achievement
 *    - Leaderboards: Update company rankings on major achievements
 *    - Notifications: Alert user of success/failure with detailed consequences
 * 
 * 10. ERROR HANDLING:
 *     - 401: Unauthorized (no session)
 *     - 404: Company not found
 *     - 404: Milestone not found or not owned by company
 *     - 400: Missing required fields (researchPoints, computeBudget)
 *     - 400: Invalid field values (non-numeric, non-positive)
 *     - 400: Milestone already achieved
 *     - 400: Milestone locked (prerequisites not met)
 *     - 400: Prerequisites not met (detailed breakdown provided)
 *     - 500: Database or achievement logic errors
 */
