/**
 * @fileoverview Bug API - GET/PATCH/DELETE by ID
 * @module api/software/bugs/[id]
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { Bug } from '@/lib/db/models';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const { id } = await params;
    await connectDB();

    const bug = await Bug.findById(id)
      .populate('assignedTo', 'name avatar')
      .populate('resolvedBy', 'name avatar')
      .lean();
      
    if (!bug) {
      return createErrorResponse('Bug not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ bug });
  } catch (error) {
    console.error('GET /api/software/bugs/[id] error:', error);
    return createErrorResponse('Failed to fetch bug', ErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const { id } = await params;
    await connectDB();

    const body = await request.json();
    
    // If status is being set to Closed or Fixed, record resolution time
    if (body.status === 'Fixed' || body.status === 'Closed' || body.status === 'Verified') {
      body.fixedDate = new Date();
      // Check if SLA was violated
      const bug = await Bug.findById(id);
      if (bug?.slaDueDate && new Date() > new Date(bug.slaDueDate)) {
        body.slaViolated = true;
      }
    }
    
    const bug = await Bug.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!bug) {
      return createErrorResponse('Bug not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: 'Bug updated', bug });
  } catch (error) {
    console.error('PATCH /api/software/bugs/[id] error:', error);
    return createErrorResponse('Failed to update bug', ErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const { id } = await params;
    await connectDB();

    const bug = await Bug.findByIdAndDelete(id);
    if (!bug) {
      return createErrorResponse('Bug not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: 'Bug deleted' });
  } catch (error) {
    console.error('DELETE /api/software/bugs/[id] error:', error);
    return createErrorResponse('Failed to delete bug', ErrorCode.INTERNAL_ERROR, 500);
  }
}
