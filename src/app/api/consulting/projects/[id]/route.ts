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

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
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
      return createErrorResponse('Invalid project ID', 'VALIDATION_ERROR', 400);
    }

    // Authenticate
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
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
      return createErrorResponse('Consulting project not found', 'NOT_FOUND', 404);
    }

    return createSuccessResponse({ data: project });

  } catch (error) {
    console.error('[API] GET /api/consulting/projects/[id] error:', error);
    return createErrorResponse(
      'Failed to fetch consulting project',
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : 'Unknown error'
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
      return createErrorResponse('Invalid project ID', 'VALIDATION_ERROR', 400);
    }

    // Authenticate
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }
    const companyId = session.user.companyId;

    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = updateConsultingProjectSchema.safeParse(body);
    if (!validatedData.success) {
      return createErrorResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validatedData.error.flatten().fieldErrors
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
      return createErrorResponse('Consulting project not found', 'NOT_FOUND', 404);
    }

    // Update project
    const updatedProject = await ConsultingProject.findByIdAndUpdate(
      id,
      { $set: validatedData.data },
      { new: true, runValidators: true }
    ).lean();

    return createSuccessResponse({
      data: updatedProject,
      message: 'Consulting project updated successfully',
    });

  } catch (error) {
    console.error('[API] PATCH /api/consulting/projects/[id] error:', error);
    return createErrorResponse(
      'Failed to update consulting project',
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : 'Unknown error'
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
      return createErrorResponse('Invalid project ID', 'VALIDATION_ERROR', 400);
    }

    // Authenticate
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
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
      return createErrorResponse('Consulting project not found', 'NOT_FOUND', 404);
    }

    // Check if project can be deleted (not active with significant work)
    if (project.status === 'Active' && project.hoursWorked > 0) {
      return createErrorResponse(
        'Cannot delete active project with logged hours. Cancel or complete the project first.',
        'VALIDATION_ERROR',
        400
      );
    }

    // Delete project
    await ConsultingProject.findByIdAndDelete(id);

    return createSuccessResponse({
      message: 'Consulting project deleted successfully',
    });

  } catch (error) {
    console.error('[API] DELETE /api/consulting/projects/[id] error:', error);
    return createErrorResponse(
      'Failed to delete consulting project',
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
