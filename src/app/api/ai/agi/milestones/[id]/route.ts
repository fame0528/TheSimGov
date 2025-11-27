/**
 * /api/ai/agi/milestones/[id]
 * Created: 2025-11-22
 * 
 * OVERVIEW:
 * Update AGI milestone progress by investing additional research points,
 * compute budget, and updating capability/alignment metrics during active research.
 * Enables incremental progress tracking for long-running milestone achievements.
 * 
 * ENDPOINT:
 * - PATCH: Update milestone progress (research points, compute, metrics, time)
 * 
 * PATH PARAMETERS:
 * - id: AGIMilestone document ID
 * 
 * BODY PARAMETERS:
 * - researchPointsInvested: Additional RP to invest (additive)
 * - computeBudgetSpent: Additional compute budget spent (additive)
 * - monthsInProgress: Update months in progress (absolute value)
 * - currentCapability: Updated capability metrics (replaces existing)
 * - currentAlignment: Updated alignment metrics (replaces existing)
 * 
 * BUSINESS LOGIC:
 * - Incremental investment: Research points and compute accumulate over time
 * - Status transitions: Available → InProgress on first investment
 * - Metrics updates: Companies can adjust capability/alignment during research
 * - Time tracking: monthsInProgress reflects realistic research timelines
 * 
 * USE CASES:
 * - Periodic research updates as companies invest quarterly budgets
 * - Metric adjustments from alignment challenge decisions
 * - Time tracking for milestone completion estimates
 * - Progress monitoring for strategic planning
 * 
 * UTILITY-FIRST ARCHITECTURE:
 * - Uses AGIMilestone model for data persistence
 * - Uses session authentication
 * - Clean separation: API handles data updates, model enforces validation
 * 
 * @implementation Phase 6 API Routes Batch 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Company from '@/lib/db/models/Company';
import AGIMilestone from '@/lib/db/models/AI/AGIMilestone';
import { MilestoneStatus } from '@/lib/types/models/ai/agi';

/**
 * PATCH /api/ai/agi/milestones/[id]
 * 
 * Update milestone progress with incremental research investment and metric changes.
 * All numeric fields are ADDITIVE except currentCapability/currentAlignment which REPLACE.
 * 
 * @param req - NextRequest with body containing update fields
 * @param params - Route params with milestone ID
 * @returns JSON response with updated milestone
 * 
 * @example
 * PATCH /api/ai/agi/milestones/[id]
 * Body: { researchPointsInvested: 5000, computeBudgetSpent: 1000000 }
 * Returns: {
 *   success: true,
 *   milestone: { ..., researchPointsInvested: 8000, computeBudgetSpent: 1500000, ... },
 *   message: 'Milestone updated successfully'
 * }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const {
      researchPointsInvested,
      computeBudgetSpent,
      monthsInProgress,
      currentCapability,
      currentAlignment,
    } = body;

    // Find milestone (must be owned by company)
    const { id } = await params;
    const milestone = await AGIMilestone.findOne({
      _id: id,
      company: company._id,
    });

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found or not owned by company' },
        { status: 404 }
      );
    }

    // Validate milestone can be updated (not already achieved)
    if (milestone.status === 'Achieved') {
      return NextResponse.json(
        {
          error: 'Cannot update achieved milestone',
          details: 'Milestone already completed - create new milestone for continued research',
        },
        { status: 400 }
      );
    }

    // Update research investment (additive)
    if (researchPointsInvested !== undefined) {
      if (typeof researchPointsInvested !== 'number' || researchPointsInvested < 0) {
        return NextResponse.json(
          { error: 'researchPointsInvested must be a non-negative number' },
          { status: 400 }
        );
      }
      milestone.researchPointsInvested += researchPointsInvested;
    }

    // Update compute budget (additive)
    if (computeBudgetSpent !== undefined) {
      if (typeof computeBudgetSpent !== 'number' || computeBudgetSpent < 0) {
        return NextResponse.json(
          { error: 'computeBudgetSpent must be a non-negative number' },
          { status: 400 }
        );
      }
      milestone.computeBudgetSpent += computeBudgetSpent;
    }

    // Update months in progress (absolute value, not additive)
    if (monthsInProgress !== undefined) {
      if (typeof monthsInProgress !== 'number' || monthsInProgress < 0) {
        return NextResponse.json(
          { error: 'monthsInProgress must be a non-negative number' },
          { status: 400 }
        );
      }
      milestone.monthsInProgress = monthsInProgress;
    }

    // Update capability metrics (merge with existing, allows partial updates)
    if (currentCapability) {
      milestone.currentCapability = {
        ...milestone.currentCapability,
        ...currentCapability,
      };
    }

    // Update alignment metrics (merge with existing, allows partial updates)
    if (currentAlignment) {
      milestone.currentAlignment = {
        ...milestone.currentAlignment,
        ...currentAlignment,
      };
    }

    // Transition status if first investment made
    if (
      milestone.status === MilestoneStatus.AVAILABLE &&
      (researchPointsInvested || computeBudgetSpent)
    ) {
      milestone.status = MilestoneStatus.IN_PROGRESS;
    }

    // Save updated milestone
    await milestone.save();

    return NextResponse.json({
      success: true,
      milestone,
      message: 'Milestone updated successfully',
    });
  } catch (error) {
    console.error('Error updating AGI milestone:', error);
    return NextResponse.json(
      {
        error: 'Failed to update milestone',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. ADDITIVE VS REPLACEMENT UPDATES:
 *    - researchPointsInvested: ADDITIVE (accumulates over time)
 *    - computeBudgetSpent: ADDITIVE (tracks total spend)
 *    - monthsInProgress: REPLACEMENT (absolute time value)
 *    - currentCapability: MERGE (partial updates allowed, replaces specified fields)
 *    - currentAlignment: MERGE (partial updates allowed, replaces specified fields)
 * 
 * 2. STATUS TRANSITIONS:
 *    - Available → InProgress: Triggered on first research/compute investment
 *    - InProgress → InProgress: Normal state during research
 *    - Achieved milestones: Cannot be updated (immutable)
 *    - Failed milestones: Can be updated (allows retry after failure)
 * 
 * 3. USE CASE PATTERNS:
 *    - Quarterly budget allocation:
 *      PATCH { researchPointsInvested: 5000, computeBudgetSpent: 2000000 }
 *    - Alignment challenge consequence:
 *      PATCH { currentAlignment: { safetyMeasures: 65, ... } }
 *    - Time progression:
 *      PATCH { monthsInProgress: 12 }
 * 
 * 4. VALIDATION:
 *    - Ownership check: Milestone must belong to requesting company
 *    - Type validation: All numeric fields must be numbers
 *    - Range validation: Model schema enforces 0-100 (metrics), 0-1 (rates)
 *    - State validation: Cannot update achieved milestones
 * 
 * 5. INVESTMENT TRACKING:
 *    - Research points: Track cumulative RP invested across all updates
 *    - Compute budget: Track cumulative USD spent on compute
 *    - Used for achievement probability calculation
 *    - Production: Would deduct from Company.researchPoints and Company.cash
 * 
 * 6. METRICS UPDATES:
 *    - Allow partial capability updates: { reasoningScore: 75 } (other metrics unchanged)
 *    - Allow partial alignment updates: { safetyMeasures: 80 } (other metrics unchanged)
 *    - Merge behavior: Spread existing metrics, overlay new values
 *    - Model validation ensures 0-100 ranges enforced
 * 
 * 7. TIME TRACKING:
 *    - monthsInProgress tracks research timeline
 *    - Used for realistic progress estimation
 *    - UI can display: "12 months invested / 18 months estimated"
 *    - Alignment challenges can modify time (delays or accelerations)
 * 
 * 8. PRODUCTION ENHANCEMENTS:
 *    - Deduct researchPointsInvested from Company.researchPoints
 *    - Deduct computeBudgetSpent from Company.cash
 *    - Validate company has sufficient resources before update
 *    - Emit events for research progress tracking
 *    - Log investment history for analytics
 * 
 * 9. ERROR HANDLING:
 *    - 401: Unauthorized (no session)
 *    - 404: Company not found
 *    - 404: Milestone not found or not owned by company
 *    - 400: Cannot update achieved milestone
 *    - 400: Invalid field types (non-numeric, negative values)
 *    - 500: Database or validation errors
 */
