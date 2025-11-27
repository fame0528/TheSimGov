/**
 * @fileoverview AI Research Project Detail API
 * @module app/api/ai/research/projects/[id]
 * 
 * OVERVIEW:
 * API endpoints for retrieving and updating individual AI research projects.
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import AIResearchProject from '@/lib/db/models/AIResearchProject';

/**
 * GET /api/ai/research/projects/[id]
 * 
 * Get single research project details
 * 
 * @returns 200: Project details
 * @returns 401: Unauthorized
 * @returns 404: Project not found
 */
export async function GET(
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

    const project = await AIResearchProject.findById(projectId)
      .populate('company', 'name industry')
      .populate('assignedResearchers', 'firstName lastName skills')
      .lean();

    if (!project) {
      return NextResponse.json(
        { error: 'Research project not found', projectId },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error('Error fetching research project:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai/research/projects/[id]
 * 
 * Update research project
 * 
 * @param request - Contains { status?, budgetAllocated?, assignedResearchers[]? }
 * @returns 200: Project updated
 * @returns 400: Validation error
 * @returns 401: Unauthorized
 * @returns 403: Forbidden
 * @returns 404: Project not found
 */
export async function PATCH(
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

    // Update allowed fields
    const { status, budgetAllocated, assignedResearchers } = body;

    if (status) project.status = status;
    if (budgetAllocated !== undefined) {
      if (budgetAllocated < 100000) {
        return NextResponse.json(
          { error: 'Budget must be at least $100,000' },
          { status: 400 }
        );
      }
      project.budgetAllocated = budgetAllocated;
    }
    if (assignedResearchers) project.assignedResearchers = assignedResearchers;

    await project.save();

    return NextResponse.json({
      project,
      message: 'Research project updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating research project:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: Object.values(error.errors).map((e: any) => e.message),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
