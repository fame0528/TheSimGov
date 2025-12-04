/**
 * @fileoverview Power Plant Operations API - Get/Update/Delete
 * @module api/energy/power-plants/[id]
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { PowerPlant } from '@/lib/db/models';
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

    const plant = await PowerPlant.findById(id).lean();
    if (!plant) {
      return createErrorResponse('Power plant not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ plant });
  } catch (error) {
    console.error('GET /api/energy/power-plants/[id] error:', error);
    return createErrorResponse('Failed to fetch power plant', ErrorCode.INTERNAL_ERROR, 500);
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
    
    const plant = await PowerPlant.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!plant) {
      return createErrorResponse('Power plant not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: 'Power plant updated', plant });
  } catch (error) {
    console.error('PATCH /api/energy/power-plants/[id] error:', error);
    return createErrorResponse('Failed to update power plant', ErrorCode.INTERNAL_ERROR, 500);
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

    const plant = await PowerPlant.findByIdAndDelete(id);
    if (!plant) {
      return createErrorResponse('Power plant not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: 'Power plant deleted' });
  } catch (error) {
    console.error('DELETE /api/energy/power-plants/[id] error:', error);
    return createErrorResponse('Failed to delete power plant', ErrorCode.INTERNAL_ERROR, 500);
  }
}
