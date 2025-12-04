/**
 * @fileoverview Feature API - GET/PATCH/DELETE by ID
 * @module api/software/features/[id]
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { Feature } from '@/lib/db/models';
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

    const feature = await Feature.findById(id)
      .populate('assignedTo', 'name avatar')
      .lean();
      
    if (!feature) {
      return createErrorResponse('Feature not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ feature });
  } catch (error) {
    console.error('GET /api/software/features/[id] error:', error);
    return createErrorResponse('Failed to fetch feature', ErrorCode.INTERNAL_ERROR, 500);
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
    
    // If status is Done, record completion
    if (body.status === 'Done') {
      body.completedAt = new Date();
      body.completionPercentage = 100;
    }
    
    const feature = await Feature.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!feature) {
      return createErrorResponse('Feature not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: 'Feature updated', feature });
  } catch (error) {
    console.error('PATCH /api/software/features/[id] error:', error);
    return createErrorResponse('Failed to update feature', ErrorCode.INTERNAL_ERROR, 500);
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

    const feature = await Feature.findByIdAndDelete(id);
    if (!feature) {
      return createErrorResponse('Feature not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: 'Feature deleted' });
  } catch (error) {
    console.error('DELETE /api/software/features/[id] error:', error);
    return createErrorResponse('Failed to delete feature', ErrorCode.INTERNAL_ERROR, 500);
  }
}
