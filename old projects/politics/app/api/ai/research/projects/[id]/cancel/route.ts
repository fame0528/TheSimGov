/**
 * @fileoverview AI Research Project Cancellation API
 * @module app/api/ai/research/projects/[id]/cancel
 * 
 * OVERVIEW:
 * API endpoint for cancelling active research projects. Uses model method to handle
 * budget recovery and status transitions.
 * 
 * BUSINESS LOGIC:
 * - Only Active projects can be cancelled
 * - Partial budget recovery based on progress (unused budget returned)
 * - Researchers are unassigned upon cancellation
 * - Breakthroughs achieved remain accessible
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import AIResearchProject from '@/lib/db/models/AIResearchProject';

/**
 * POST /api/ai/research/projects/[id]/cancel
 * 
 * Cancel research project
 * 
 * @returns 200: Project cancelled
 * @returns 400: Cannot cancel (already completed/cancelled)
 * @returns 401: Unauthorized
 * @returns 403: Forbidden
 * @returns 404: Project not found
 */
export async function POST(
  _request: NextRequest,
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

    // Find project and verify ownership
    const project = await AIResearchProject.findById(projectId).populate<{ company: any }>('company');

    if (!project) {
      return NextResponse.json(
        { error: 'Research project not found', projectId },
        { status: 404 }
      );
    }

    if (project.company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this research project' },
        { status: 403 }
      );
    }

    if (project.status !== 'InProgress') {
      return NextResponse.json(
        { error: `Cannot cancel project - Status is ${project.status}` },
        { status: 400 }
      );
    }

    // Calculate budget recovery (unspent budget)
    const budgetRecovered = project.budgetAllocated - project.budgetSpent;

    // Cancel using model method
    project.cancel('User requested cancellation');
    await project.save();

    return NextResponse.json({
      project,
      budgetRecovered,
      progressAchieved: project.progress,
      message: `Project cancelled. $${budgetRecovered.toLocaleString()} budget recovered.`,
    });
  } catch (error: any) {
    console.error('Error cancelling research project:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
