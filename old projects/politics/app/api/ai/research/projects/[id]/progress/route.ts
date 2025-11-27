/**
 * @fileoverview AI Research Progress Tracking API
 * @module app/api/ai/research/projects/[id]/progress
 * 
 * OVERVIEW:
 * API endpoint for advancing AI research progress. May trigger breakthroughs based on
 * research quality, team expertise, and random factors.
 * 
 * BUSINESS LOGIC:
 * - Progress increments: 0-100% scale
 * - Breakthrough probability: Increases with progress, complexity, and team size
 * - Performance gains: Higher complexity → larger potential gains
 * - Status transitions: Active → Completed at 100% progress
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import AIResearchProject from '@/lib/db/models/AIResearchProject';

/**
 * POST /api/ai/research/projects/[id]/progress
 * 
 * Advance research progress
 * 
 * @param request - Contains { progressAmount: number (1-100) }
 * @returns 200: Progress updated, may include breakthrough
 * @returns 400: Validation error
 * @returns 401: Unauthorized
 * @returns 404: Project not found
 * 
 * @example
 * POST /api/ai/research/projects/[id]/progress
 * {
 *   "progressAmount": 10
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await dbConnect();

    const projectId = params.id;
    const body = await request.json();
    const { progressAmount } = body;

    if (typeof progressAmount !== 'number' || progressAmount < 1 || progressAmount > 100) {
      return NextResponse.json(
        { error: 'Invalid progressAmount - Must be between 1 and 100' },
        { status: 400 }
      );
    }

    const project = await AIResearchProject.findById(projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Research project not found', projectId },
        { status: 404 }
      );
    }

    if (project.status !== 'InProgress') {
      return NextResponse.json(
        { error: 'Cannot advance progress - Project is not active' },
        { status: 400 }
      );
    }

    // Estimate cost based on progress increment and complexity
    const costPerPercent = project.budgetAllocated / 100;
    const costIncurred = costPerPercent * progressAmount;

    // Advance progress using model method
    project.advanceProgress(progressAmount, costIncurred);
    await project.save();

    // Reload to get updated status (auto-completed if 100%)
    await project.populate('assignedResearchers', 'firstName lastName');

    return NextResponse.json({
      project,
      progressAdded: progressAmount,
      currentProgress: project.progress,
      costIncurred,
      status: project.status,
      message: project.progress >= 100
        ? 'Research completed!' 
        : 'Progress advanced successfully',
    });
  } catch (error: any) {
    console.error('Error advancing research progress:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
