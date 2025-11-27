/**
 * /api/ai/agi/alignment/challenges
 * GET: Retrieve active alignment challenges for company
 * 
 * @implementation FID-20251115-AI-P5.1 Phase 5.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import connectDB from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import AGIMilestone from '@/lib/db/models/AGIMilestone';
import { generateAlignmentChallenge } from '@/lib/utils/ai/agiDevelopment';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/ai/agi/alignment/challenges
 * 
 * Query Parameters:
 * - status: Filter by milestone status (InProgress recommended)
 * - generate: Whether to generate new challenges for in-progress milestones (true/false)
 * 
 * @returns Active alignment challenges across all milestones
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
    const status = searchParams.get('status') || 'InProgress';
    const shouldGenerate = searchParams.get('generate') === 'true';

    // Find milestones
    const milestones = await AGIMilestone.find({
      company: company._id,
      status,
    });

    // Collect all existing challenges
    const allChallenges: { [key: string]: unknown }[] = [];

    for (const milestone of milestones) {
      // Add existing challenges
      if (milestone.alignmentChallenges && milestone.alignmentChallenges.length > 0) {
        allChallenges.push(
          ...milestone.alignmentChallenges.map((challenge) => ({
            ...challenge,
            milestoneId: milestone._id,
            milestoneType: milestone.milestoneType,
          }))
        );
      }

      // Generate new challenge if requested
      if (shouldGenerate) {
        // Calculate average alignment
        const alignMetrics = Object.values(milestone.currentAlignment);
        const avgAlignment =
          alignMetrics.reduce((sum, val) => sum + val, 0) / alignMetrics.length;

        // Generate challenge
        const newChallenge = generateAlignmentChallenge(
          milestone.milestoneType,
          avgAlignment
        );

        // Add to milestone
        milestone.alignmentChallenges.push(newChallenge);
        await milestone.save();

        allChallenges.push({
          ...newChallenge,
          milestoneId: milestone._id,
          milestoneType: milestone.milestoneType,
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: allChallenges.length,
      challenges: allChallenges,
    });
  } catch (error) {
    logger.error('Error fetching alignment challenges', {
      error: error instanceof Error ? error.message : 'Unknown error',
      operation: 'GET /api/ai/agi/alignment/challenges',
      component: 'AGI Alignment Challenges API'
    });
    return NextResponse.json(
      { error: 'Failed to fetch challenges', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
