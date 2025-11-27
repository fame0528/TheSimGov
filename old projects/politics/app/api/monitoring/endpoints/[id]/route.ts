/**
 * @file app/api/monitoring/endpoints/[id]/route.ts
 * @description API endpoint update and deletion
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles API endpoint metric updates and deletion with customer impact tracking.
 * 
 * ENDPOINTS:
 * - PATCH /api/monitoring/endpoints/[id] - Update endpoint configuration/metrics
 * - DELETE /api/monitoring/endpoints/[id] - Delete endpoint
 * 
 * IMPLEMENTATION NOTES:
 * - 40% code reuse from database update pattern
 * - New metrics update logic (calls, error rate, uptime)
 * - New health status change detection
 * - 50% code reuse for soft-delete pattern
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import APIEndpoint from '@/lib/db/models/APIEndpoint';
import Company from '@/lib/db/models/Company';

/**
 * PATCH /api/monitoring/endpoints/[id]
 * 
 * Update endpoint configuration or metrics
 * 
 * Request Body:
 * {
 *   active?: boolean;
 *   rateLimitPerMinute?: number;
 *   pricePerCall?: number;
 *   dailyCalls?: number;
 *   errorRate?: number;
 *   uptime?: number;
 * }
 * 
 * Response:
 * {
 *   endpoint: IAPIEndpoint;
 *   updated: object;
 *   healthChange?: { from: boolean; to: boolean };
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { active, rateLimitPerMinute, pricePerCall, dailyCalls, errorRate, uptime } = body;

    await dbConnect();

    // Find endpoint
    const endpoint = await APIEndpoint.findById(id);
    if (!endpoint) {
      return NextResponse.json({ error: 'API endpoint not found' }, { status: 404 });
    }

    // Verify ownership
    const company = await Company.findById(endpoint.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this endpoint' }, { status: 403 });
    }

    // Track changes
    const updated: any = {};
    const wasHealthy = endpoint.isHealthy;

    // Update fields
    if (active !== undefined) {
      endpoint.active = active;
      updated.active = active;
    }

    if (rateLimitPerMinute !== undefined) {
      endpoint.rateLimitPerMinute = rateLimitPerMinute;
      updated.rateLimit = { perMinute: rateLimitPerMinute };
    }

    if (pricePerCall !== undefined) {
      endpoint.pricePerCall = pricePerCall;
      updated.pricing = { pricePerCall };
    }

    if (dailyCalls !== undefined) {
      endpoint.dailyCalls = dailyCalls;
      endpoint.monthlyCalls += dailyCalls;
      endpoint.totalCalls += dailyCalls;
      updated.metrics = { dailyCalls };
    }

    if (errorRate !== undefined) {
      endpoint.errorRate = errorRate;
      if (!updated.metrics) updated.metrics = {};
      updated.metrics.errorRate = errorRate;
    }

    if (uptime !== undefined) {
      endpoint.uptime = uptime;
      if (!updated.metrics) updated.metrics = {};
      updated.metrics.uptime = uptime;
    }

    await endpoint.save();

    // Check health status change
    const isNowHealthy = endpoint.isHealthy;
    let healthChange;
    if (wasHealthy !== isNowHealthy) {
      healthChange = { from: wasHealthy, to: isNowHealthy };
    }

    return NextResponse.json({
      endpoint,
      updated,
      healthChange,
      message: 'API endpoint updated successfully',
    });
  } catch (error) {
    console.error('Error updating API endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/monitoring/endpoints/[id]
 * 
 * Delete API endpoint
 * 
 * Response:
 * {
 *   message: string;
 *   impactedCustomers?: number;
 * }
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    // Find endpoint
    const endpoint = await APIEndpoint.findById(id);
    if (!endpoint) {
      return NextResponse.json({ error: 'API endpoint not found' }, { status: 404 });
    }

    // Verify ownership
    const company = await Company.findById(endpoint.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this endpoint' }, { status: 403 });
    }

    // Cannot delete if has active customers
    if (endpoint.uniqueCustomers > 0 && endpoint.monthlyCalls > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete endpoint with active customers',
          uniqueCustomers: endpoint.uniqueCustomers,
          monthlyCalls: endpoint.monthlyCalls,
        },
        { status: 409 }
      );
    }

    const impactedCustomers = endpoint.uniqueCustomers;

    // Soft delete (mark inactive)
    endpoint.active = false;
    await endpoint.save();

    return NextResponse.json({
      message: 'API endpoint deleted successfully',
      impactedCustomers,
    });
  } catch (error) {
    console.error('Error deleting API endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
