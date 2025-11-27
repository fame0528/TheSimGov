/**
 * /api/ai/agi/milestones/[id]
 * PATCH: Update AGI milestone progress
 * 
 * @implementation FID-20251115-AI-P5.1 Phase 5.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import connectDB from '@/lib/db/mongodb';
import AGIMilestone from '@/lib/db/models/AGIMilestone';
import Company from '@/lib/db/models/Company';

/**
 * PATCH /api/ai/agi/milestones/[id]
 * 
 * Body:
 * - researchPointsInvested: Additional RP to invest
 * - computeBudgetSpent: Additional compute budget spent
 * - monthsInProgress: Update months in progress
 * - currentCapability: Updated capability metrics
 * - currentAlignment: Updated alignment metrics
 * 
 * @returns Updated AGI milestone
 */
export async function PATCH(
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
    const {
      researchPointsInvested,
      computeBudgetSpent,
      monthsInProgress,
      currentCapability,
      currentAlignment,
    } = body;

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

    // Update fields
    if (researchPointsInvested !== undefined) {
      milestone.researchPointsInvested += researchPointsInvested;
    }

    if (computeBudgetSpent !== undefined) {
      milestone.computeBudgetSpent += computeBudgetSpent;
    }

    if (monthsInProgress !== undefined) {
      milestone.monthsInProgress = monthsInProgress;
    }

    if (currentCapability) {
      milestone.currentCapability = {
        ...milestone.currentCapability,
        ...currentCapability,
      };
    }

    if (currentAlignment) {
      milestone.currentAlignment = {
        ...milestone.currentAlignment,
        ...currentAlignment,
      };
    }

    // Update status if not already in progress
    if (milestone.status === 'Available' && (researchPointsInvested || computeBudgetSpent)) {
      milestone.status = 'InProgress';
    }

    await milestone.save();

    return NextResponse.json({
      success: true,
      milestone,
      message: 'Milestone updated successfully',
    });
  } catch (error) {
    console.error('Error updating AGI milestone:', error);
    return NextResponse.json(
      { error: 'Failed to update milestone', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
