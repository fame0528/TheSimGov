/**
 * @file src/app/api/consulting/projects/[id]/route.ts
 * @description API routes for individual consulting project operations
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Handles individual consulting project operations including fetching details,
 * updating project data, and deleting projects.
 * 
 * ENDPOINTS:
 * GET /api/consulting/projects/[id] - Get project details
 * PATCH /api/consulting/projects/[id] - Update project
 * DELETE /api/consulting/projects/[id] - Delete project
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import ConsultingProject from '@/lib/db/models/consulting/ConsultingProject';
import { updateConsultingProjectSchema } from '@/lib/validations/consulting';
import mongoose from 'mongoose';

// ============================================================================
// GET - Fetch Single Project
// ============================================================================

/**
 * GET /api/consulting/projects/[id]
 * Get detailed consulting project information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Authenticate
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const companyId = session.user.companyId;

    // Connect to database
    await connectDB();

    // Find project
    const project = await ConsultingProject.findOne({
      _id: id,
      company: companyId,
    }).lean();

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Consulting project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: project,
    });

  } catch (error) {
    console.error('[API] GET /api/consulting/projects/[id] error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch consulting project',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Project
// ============================================================================

/**
 * PATCH /api/consulting/projects/[id]
 * Update consulting project data
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Authenticate
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const companyId = session.user.companyId;

    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = updateConsultingProjectSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validatedData.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find and verify ownership
    const existingProject = await ConsultingProject.findOne({
      _id: id,
      company: companyId,
    });

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Consulting project not found' },
        { status: 404 }
      );
    }

    // Update project
    const updatedProject = await ConsultingProject.findByIdAndUpdate(
      id,
      { $set: validatedData.data },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json({
      success: true,
      data: updatedProject,
      message: 'Consulting project updated successfully',
    });

  } catch (error) {
    console.error('[API] PATCH /api/consulting/projects/[id] error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update consulting project',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Remove Project
// ============================================================================

/**
 * DELETE /api/consulting/projects/[id]
 * Delete a consulting project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Authenticate
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const companyId = session.user.companyId;

    // Connect to database
    await connectDB();

    // Find and verify ownership
    const project = await ConsultingProject.findOne({
      _id: id,
      company: companyId,
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Consulting project not found' },
        { status: 404 }
      );
    }

    // Check if project can be deleted (not active with significant work)
    if (project.status === 'Active' && project.hoursWorked > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete active project with logged hours. Cancel or complete the project first.',
        },
        { status: 400 }
      );
    }

    // Delete project
    await ConsultingProject.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Consulting project deleted successfully',
    });

  } catch (error) {
    console.error('[API] DELETE /api/consulting/projects/[id] error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete consulting project',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
