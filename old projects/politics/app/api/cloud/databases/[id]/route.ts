/**
 * @file app/api/cloud/databases/[id]/route.ts
 * @description Database instance update and deletion endpoints
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles database instance resource updates (vCPU, storage, auto-scaling) and deletion
 * with prorated refund calculation.
 * 
 * ENDPOINTS:
 * - PATCH /api/cloud/databases/[id] - Update database instance resources
 * - DELETE /api/cloud/databases/[id] - Delete database instance
 * 
 * IMPLEMENTATION NOTES:
 * - 50% code reuse from E-Commerce cloud update pattern
 * - New auto-scaling toggle logic
 * - New billing recalculation after resource changes
 * - 60% code reuse for soft-delete pattern
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import DatabaseInstance from '@/lib/db/models/DatabaseInstance';
import CloudServer from '@/lib/db/models/CloudServer';
import Company from '@/lib/db/models/Company';

/**
 * PATCH /api/cloud/databases/[id]
 * 
 * Update database instance resources
 * 
 * Request Body:
 * {
 *   allocatedVCpu?: number;
 *   allocatedStorage?: number;
 *   autoScalingEnabled?: boolean;
 *   scaleUpThreshold?: number;
 *   paymentStatus?: 'Current' | 'Overdue' | 'Suspended';
 * }
 * 
 * Response:
 * {
 *   database: IDatabaseInstance;
 *   updated: {
 *     vCpu?: number;
 *     storage?: number;
 *     autoScaling?: boolean;
 *   };
 *   newBilling: {
 *     monthlyBill: number;
 *     change: number;
 *   };
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { allocatedVCpu, allocatedStorage, autoScalingEnabled, scaleUpThreshold, paymentStatus } = body;

    await dbConnect();

    // Find database instance
    const database = await DatabaseInstance.findById(id).populate('cloudServer');
    if (!database) {
      return NextResponse.json({ error: 'Database instance not found' }, { status: 404 });
    }

    // Verify ownership
    const cloudServer = await CloudServer.findById(database.cloudServer);
    if (!cloudServer) {
      return NextResponse.json({ error: 'Cloud server not found' }, { status: 404 });
    }

    const company = await Company.findById(cloudServer.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this database instance' }, { status: 403 });
    }

    // Track changes
    const updated: any = {};
    const oldBill = database.monthlyBill;

    // Update fields
    if (allocatedVCpu !== undefined) {
      database.allocatedVCpu = allocatedVCpu;
      updated.vCpu = allocatedVCpu;
    }

    if (allocatedStorage !== undefined) {
      database.allocatedStorage = allocatedStorage;
      updated.storage = allocatedStorage;
    }

    if (autoScalingEnabled !== undefined) {
      database.autoScalingEnabled = autoScalingEnabled;
      updated.autoScaling = autoScalingEnabled;
    }

    if (scaleUpThreshold !== undefined) {
      database.scaleUpThreshold = scaleUpThreshold;
    }

    if (paymentStatus !== undefined) {
      database.paymentStatus = paymentStatus;
    }

    // Recalculate billing if resources changed
    if (allocatedVCpu !== undefined || allocatedStorage !== undefined) {
      const billingResult = await database.calculateMonthlyBill();
      database.monthlyBill = billingResult.finalBill;
    }

    await database.save();

    const billChange = database.monthlyBill - oldBill;

    return NextResponse.json({
      database,
      updated,
      newBilling: {
        monthlyBill: database.monthlyBill,
        change: billChange,
      },
      message: 'Database instance updated successfully',
    });
  } catch (error) {
    console.error('Error updating database instance:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cloud/databases/[id]
 * 
 * Delete database instance with prorated refund
 * 
 * Response:
 * {
 *   message: string;
 *   refund?: number;
 * }
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await dbConnect();

    // Find database instance
    const database = await DatabaseInstance.findById(id);
    if (!database) {
      return NextResponse.json({ error: 'Database instance not found' }, { status: 404 });
    }

    // Verify ownership
    const cloudServer = await CloudServer.findById(database.cloudServer);
    if (!cloudServer) {
      return NextResponse.json({ error: 'Cloud server not found' }, { status: 404 });
    }

    const company = await Company.findById(cloudServer.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this database instance' }, { status: 403 });
    }

    // Cannot delete if has active usage
    if (database.usedVCpu > 0 || database.usedStorage > 0 || database.currentConnections > 0) {
      return NextResponse.json(
        { error: 'Cannot delete active database instance', usedVCpu: database.usedVCpu, usedStorage: database.usedStorage },
        { status: 409 }
      );
    }

    // Calculate prorated refund (days remaining in month)
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - now.getDate();
    const proratedRefund = (database.monthlyBill / daysInMonth) * daysRemaining;

    // Update cloud server allocation
    await cloudServer.updateOne({
      $inc: {
        allocatedCapacity: -1,
        customerCount: -1,
      },
    });

    // Soft delete (mark inactive)
    database.active = false;
    await database.save();

    return NextResponse.json({
      message: 'Database instance deleted successfully',
      refund: Math.round(proratedRefund * 100) / 100,
    });
  } catch (error) {
    console.error('Error deleting database instance:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
