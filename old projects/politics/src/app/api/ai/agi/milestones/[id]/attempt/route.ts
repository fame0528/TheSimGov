/**
 * /api/ai/agi/milestones/[id]/attempt
 * POST: Attempt to achieve AGI milestone
 * 
 * @implementation FID-20251115-AI-P5.1 Phase 5.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import connectDB from '@/lib/db/mongodb';
import AGIMilestone from '@/lib/db/models/AGIMilestone';
import Company from '@/lib/db/models/Company';

/**
 * POST /api/ai/agi/milestones/[id]/attempt
 * 
 * Body:
 * - researchPoints: RP to spend on this attempt
 * - computeBudget: Compute budget (USD) to allocate
 * 
 * @returns Achievement attempt result (success/failure with details)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { researchPoints, computeBudget } = body;

    // Validation
    if (
      typeof researchPoints !== 'number' ||
      typeof computeBudget !== 'number' ||
      researchPoints <= 0 ||
      computeBudget <= 0
    ) {
      return NextResponse.json(
        { error: 'researchPoints and computeBudget must be positive numbers' },
        { status: 400 }
      );
    }

    // Find milestone
    const milestone = await AGIMilestone.findOne({
      _id: params.id,
      company: company._id,
    });

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found or not owned by company' },
        { status: 404 }
      );
    }

    // Check if milestone can be attempted
    if (milestone.status === 'Achieved') {
      return NextResponse.json(
        { error: 'Milestone already achieved' },
        { status: 400 }
      );
    }

    if (milestone.status === 'Locked') {
      return NextResponse.json(
        { error: 'Milestone is locked - prerequisites not met' },
        { status: 400 }
      );
    }

    // Check prerequisites using instance method
    const prerequisiteCheck = milestone.checkPrerequisites();
    if (!prerequisiteCheck.canAttempt) {
      return NextResponse.json(
        {
          error: 'Prerequisites not met',
          missingPrerequisites: prerequisiteCheck.missingPrerequisites,
          requirementsMet: prerequisiteCheck.requirementsMet,
        },
        { status: 400 }
      );
    }

    // Verify company has sufficient research points
    // NOTE: In production, this would check company.researchPoints
    // For now, we assume company has sufficient resources

    // Attempt achievement using instance method
    const result = await milestone.attemptAchievement(researchPoints, computeBudget);

    // Save updated milestone
    await milestone.save();

    return NextResponse.json({
      success: true,
      result,
      milestone,
      message: result.success
        ? `Milestone "${milestone.milestoneType}" achieved!`
        : `Attempt failed. Probability was ${(result.probability * 100).toFixed(1)}%`,
    });
  } catch (error) {
    console.error('Error attempting AGI milestone:', error);
    return NextResponse.json(
      { error: 'Failed to attempt milestone', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
