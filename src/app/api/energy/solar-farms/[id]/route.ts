/**
 * @fileoverview Solar Farm Operations API - Get/Update/Delete
 * @module api/energy/solar-farms/[id]
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db';
import { SolarFarm } from '@/lib/db/models';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/energy/solar-farms/[id]
 * Get single solar farm details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const { id } = await params;
    await connectDB();

    const farm = await SolarFarm.findById(id).lean();
    if (!farm) {
      return createErrorResponse('Solar farm not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ farm });
  } catch (error) {
    console.error('GET /api/energy/solar-farms/[id] error:', error);
    return createErrorResponse('Failed to fetch solar farm', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * PATCH /api/energy/solar-farms/[id]
 * Update solar farm
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const { id } = await params;
    await connectDB();

    const body = await request.json();
    
    const farm = await SolarFarm.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!farm) {
      return createErrorResponse('Solar farm not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: 'Solar farm updated', farm });
  } catch (error) {
    console.error('PATCH /api/energy/solar-farms/[id] error:', error);
    return createErrorResponse('Failed to update solar farm', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * DELETE /api/energy/solar-farms/[id]
 * Delete solar farm
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const { id } = await params;
    await connectDB();

    const farm = await SolarFarm.findByIdAndDelete(id);
    if (!farm) {
      return createErrorResponse('Solar farm not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: 'Solar farm deleted' });
  } catch (error) {
    console.error('DELETE /api/energy/solar-farms/[id] error:', error);
    return createErrorResponse('Failed to delete solar farm', ErrorCode.INTERNAL_ERROR, 500);
  }
}
