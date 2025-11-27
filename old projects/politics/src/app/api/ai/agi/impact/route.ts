/**
 * /api/ai/agi/impact
 * GET: Calculate industry disruption impact from AGI milestones
 * 
 * @implementation FID-20251115-AI-P5.1 Phase 5.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import connectDB from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import AGIMilestone from '@/lib/db/models/AGIMilestone';
import { predictIndustryDisruption } from '@/lib/utils/ai/agiDevelopment';
import type { MilestoneType, IAGIMilestone } from '@/lib/db/models/AGIMilestone';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/ai/agi/impact
 * 
 * Query Parameters:
 * - milestoneType: Specific milestone to analyze (optional, uses latest if not specified)
 * 
 * @returns Industry disruption prediction for milestone
 */
export async function GET(req: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const milestoneType = searchParams.get('milestoneType') as MilestoneType | null;

    let milestone: (IAGIMilestone & { _id: unknown }) | null;

    if (milestoneType) {
      // Get specific milestone
      milestone = await AGIMilestone.findOne({
        company: company._id,
        milestoneType,
      });

      if (!milestone) {
        return NextResponse.json(
          { error: `Milestone "${milestoneType}" not found` },
          { status: 404 }
        );
      }
    } else {
      // Get latest achieved milestone
      milestone = await AGIMilestone.findOne({
        company: company._id,
        status: 'Achieved',
      }).sort({ achievedAt: -1 });

      if (!milestone) {
        return NextResponse.json(
          {
            success: true,
            message: 'No achieved milestones yet - achieve milestones to see impact predictions',
          },
          { status: 200 }
        );
      }
    }

    // Calculate average alignment
    const alignMetrics = Object.values(milestone.currentAlignment) as number[];
    const avgAlignment =
      alignMetrics.reduce((sum: number, val: number) => sum + val, 0) / alignMetrics.length;

    // Check if first mover (for now, assume first to achieve = first mover)
    // NOTE: In production, check if any other company has achieved this milestone
    const otherCompanies = await Company.find({ _id: { $ne: company._id } }).limit(5);
    let firstMover = true;

    for (const otherCompany of otherCompanies) {
      const otherMilestone = await AGIMilestone.findOne({
        company: otherCompany._id,
        milestoneType: milestone.milestoneType,
        status: 'Achieved',
      });

      if (
        otherMilestone &&
        otherMilestone.achievedAt &&
        milestone.achievedAt &&
        otherMilestone.achievedAt < milestone.achievedAt
      ) {
        firstMover = false;
        break;
      }
    }

    // Predict industry disruption
    const disruptionPrediction = predictIndustryDisruption(
      milestone.milestoneType,
      avgAlignment,
      firstMover
    );

    // Get all achieved milestones for cumulative impact
    const achievedMilestones = await AGIMilestone.find({
      company: company._id,
      status: 'Achieved',
    });

    const cumulativeImpact = {
      totalEconomicValue: achievedMilestones.reduce(
        (sum, m) => sum + (m.impactConsequences?.economicValueCreated || 0),
        0
      ),
      totalDisruption: achievedMilestones.reduce(
        (sum, m) => sum + (m.impactConsequences?.industryDisruptionLevel || 0),
        0
      ),
      milestonesAchieved: achievedMilestones.length,
    };

    return NextResponse.json({
      success: true,
      milestone: {
        type: milestone.milestoneType,
        achievedAt: milestone.achievedAt,
        alignment: Math.round(avgAlignment * 100) / 100,
        firstMover,
      },
      disruption: disruptionPrediction,
      cumulativeImpact,
    });
  } catch (error) {
    logger.error('Error calculating industry impact', {
      error: error instanceof Error ? error.message : 'Unknown error',
      operation: 'GET /api/ai/agi/impact',
      component: 'AGI Impact API'
    });
    return NextResponse.json(
      { error: 'Failed to calculate impact', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
