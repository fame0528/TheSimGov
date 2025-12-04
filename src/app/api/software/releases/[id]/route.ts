/**
 * @fileoverview Software Release API - GET/PATCH/DELETE by ID
 * @module api/software/releases/[id]
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { SoftwareRelease } from '@/lib/db/models';
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

    const release = await SoftwareRelease.findById(id)
      .populate('features')
      .populate('bugFixes')
      .lean();
      
    if (!release) {
      return createErrorResponse('Release not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ release });
  } catch (error) {
    console.error('GET /api/software/releases/[id] error:', error);
    return createErrorResponse('Failed to fetch release', ErrorCode.INTERNAL_ERROR, 500);
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
    
    const release = await SoftwareRelease.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!release) {
      return createErrorResponse('Release not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: 'Release updated', release });
  } catch (error) {
    console.error('PATCH /api/software/releases/[id] error:', error);
    return createErrorResponse('Failed to update release', ErrorCode.INTERNAL_ERROR, 500);
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

    const release = await SoftwareRelease.findByIdAndDelete(id);
    if (!release) {
      return createErrorResponse('Release not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: 'Release deleted' });
  } catch (error) {
    console.error('DELETE /api/software/releases/[id] error:', error);
    return createErrorResponse('Failed to delete release', ErrorCode.INTERNAL_ERROR, 500);
  }
}
