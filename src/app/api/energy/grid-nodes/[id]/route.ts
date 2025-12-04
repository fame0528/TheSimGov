/**
 * @fileoverview Grid Node Individual API - GET/PATCH/DELETE endpoints
 * @module api/energy/grid-nodes/[id]
 * 
 * ENDPOINTS:
 * GET    /api/energy/grid-nodes/[id] - Get single grid node details
 * PATCH  /api/energy/grid-nodes/[id] - Update grid node configuration
 * DELETE /api/energy/grid-nodes/[id] - Delete grid node
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { GridNode } from '@/lib/db/models';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

/**
 * GET /api/energy/grid-nodes/[id]
 * Fetch single grid node with full details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();
    const { id } = await context.params;

    const node = await GridNode.findById(id)
      .populate('company', 'name')
      .lean();

    if (!node) {
      return createErrorResponse('Grid node not found', ErrorCode.NOT_FOUND, 404);
    }

    // Calculate derived metrics
    const loadFactor = node.capacityMW > 0 
      ? (node.currentDemand / node.capacityMW) * 100 
      : 0;
    const generationUtilization = node.capacityMW > 0 
      ? (node.currentGeneration / node.capacityMW) * 100 
      : 0;

    return createSuccessResponse({
      node,
      metrics: {
        loadFactor: Math.round(loadFactor * 100) / 100,
        generationUtilization: Math.round(generationUtilization * 100) / 100,
        frequencyDeviation: Math.abs(node.frequency - 60),
        voltageDeviation: Math.abs(node.currentVoltageKV - node.nominalVoltageKV),
      },
    });
  } catch (error) {
    console.error('GET /api/energy/grid-nodes/[id] error:', error);
    return createErrorResponse('Failed to fetch grid node', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * PATCH /api/energy/grid-nodes/[id]
 * Update grid node configuration
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();
    const { id } = await context.params;
    const body = await request.json();

    const allowedUpdates = [
      'name',
      'location',
      'capacityMW',
      'nominalVoltageKV',
      'status',
      'nodeType',
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedUpdates) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return createErrorResponse('No valid updates provided', ErrorCode.BAD_REQUEST, 400);
    }

    const node = await GridNode.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!node) {
      return createErrorResponse('Grid node not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({
      message: 'Grid node updated',
      node,
    });
  } catch (error) {
    console.error('PATCH /api/energy/grid-nodes/[id] error:', error);
    return createErrorResponse('Failed to update grid node', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * DELETE /api/energy/grid-nodes/[id]
 * Delete grid node (only if not connected)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();
    const { id } = await context.params;

    const node = await GridNode.findById(id);

    if (!node) {
      return createErrorResponse('Grid node not found', ErrorCode.NOT_FOUND, 404);
    }

    // Prevent deletion if node has active connections
    if (node.connectedLines && node.connectedLines.length > 0) {
      return createErrorResponse('Cannot delete node with active transmission line connections', ErrorCode.BAD_REQUEST, 400);
    }

    await GridNode.findByIdAndDelete(id);

    return createSuccessResponse({
      message: 'Grid node deleted',
      id,
    });
  } catch (error) {
    console.error('DELETE /api/energy/grid-nodes/[id] error:', error);
    return createErrorResponse('Failed to delete grid node', ErrorCode.INTERNAL_ERROR, 500);
  }
}
