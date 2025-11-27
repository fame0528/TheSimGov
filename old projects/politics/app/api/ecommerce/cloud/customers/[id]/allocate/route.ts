/**
 * @file app/api/ecommerce/cloud/customers/[id]/allocate/route.ts
 * @description Cloud customer resource allocation endpoint
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles dynamic resource allocation updates for cloud customers (scale up/down vCPU, storage, bandwidth).
 * Validates capacity constraints, enforces quotas (50% max per customer), calculates billing deltas,
 * updates both CloudCustomer and CloudService aggregate metrics, and provides auto-scaling recommendations
 * when utilization exceeds thresholds.
 * 
 * ENDPOINTS:
 * - PATCH /api/ecommerce/cloud/customers/:id/allocate - Update resource allocation
 * 
 * BUSINESS LOGIC:
 * - Delta-based updates: Add/subtract resources (vCpuDelta, storageDelta, bandwidthDelta)
 * - Capacity validation: Ensure cloud service has available capacity for increases
 * - Quota enforcement: Customer total allocation ≤ 50% of cloud service capacity
 * - Billing delta: Calculate monthly bill change based on delta × pricePerUnit
 * - Volume discounts: Recalculate with new monthly bill (10% > $1k, 20% > $10k)
 * - Auto-scaling recommendations: Suggest upgrades when utilization > 80%
 * - Overprovisioning warnings: Flag underutilization < 20%
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import CloudCustomer from '@/src/lib/db/models/CloudCustomer';
import Company from '@/lib/db/models/Company';
import { CloudResourceAllocationSchema } from '@/lib/validations/ecommerce';

/**
 * PATCH /api/ecommerce/cloud/customers/:id/allocate
 * 
 * Update customer resource allocation (scale up/down)
 * 
 * Request Body:
 * {
 *   vCpuDelta?: number;         // Change in vCPU allocation (positive = add, negative = remove)
 *   storageDelta?: number;      // Change in storage TB (positive/negative)
 *   bandwidthDelta?: number;    // Change in bandwidth GB/month (positive/negative)
 * }
 * 
 * Response:
 * {
 *   cloudCustomer: ICloudCustomer;
 *   allocationChange: { vCpu, storage, bandwidth };
 *   billingChange: { previousBill, newBill, delta, discount };
 *   utilizationMetrics: { vCpu%, storage%, bandwidth%, overall% };
 *   recommendations: string[];
 * }
 * 
 * Business Logic:
 * 1. Verify customer exists and user owns cloud service marketplace
 * 2. Validate delta values (at least one non-zero delta required)
 * 3. Calculate new allocations (current + delta)
 * 4. Validate new allocations (no negatives, within quota)
 * 5. For increases: Check cloud service has available capacity
 * 6. For quota: Ensure new total allocation ≤ 50% of cloud capacity
 * 7. Update CloudCustomer allocations
 * 8. Update CloudService aggregate metrics (allocatedCapacity, monthlyRevenue)
 * 9. Recalculate monthly bill with volume discounts
 * 10. Generate recommendations (auto-scale, reduce overprovisioning, optimize)
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

    // Parse and validate request
    const body = await request.json();
    const validation = CloudResourceAllocationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const deltas = validation.data;
    await dbConnect();

    // Fetch cloud customer with cloud service population
    const cloudCustomer = await CloudCustomer.findById(params.id).populate({
      path: 'cloudService',
      populate: {
        path: 'marketplace',
        populate: { path: 'company' },
      },
    });

    if (!cloudCustomer) {
      return NextResponse.json({ error: 'Cloud customer not found' }, { status: 404 });
    }

    const cloudService = cloudCustomer.cloudService as any;
    const marketplace = cloudService.marketplace as any;
    const company = await Company.findById(marketplace.company);

    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this cloud service' }, { status: 403 });
    }

    // Validate at least one delta provided
    if (!deltas.vCpuDelta && !deltas.storageDelta && !deltas.bandwidthDelta) {
      return NextResponse.json({ error: 'At least one resource delta is required' }, { status: 400 });
    }

    // Calculate new allocations
    const newVCpu = cloudCustomer.allocatedVCpu + (deltas.vCpuDelta || 0);
    const newStorage = cloudCustomer.allocatedStorage + (deltas.storageDelta || 0);
    const newBandwidth = cloudCustomer.allocatedBandwidth + (deltas.bandwidthDelta || 0);

    // Validate no negative allocations
    if (newVCpu < 0 || newStorage < 0 || newBandwidth < 0) {
      return NextResponse.json(
        { error: 'Resource allocation cannot be negative', newAllocations: { newVCpu, newStorage, newBandwidth } },
        { status: 400 }
      );
    }

    // Calculate old and new total allocated capacity
    const oldTotalCapacity = cloudCustomer.allocatedVCpu + cloudCustomer.allocatedStorage * 1000 + cloudCustomer.allocatedBandwidth;
    const newTotalCapacity = newVCpu + newStorage * 1000 + newBandwidth;
    const capacityDelta = newTotalCapacity - oldTotalCapacity;

    // For increases: Validate cloud service has available capacity
    if (capacityDelta > 0 && capacityDelta > cloudService.availableCapacity) {
      return NextResponse.json(
        {
          error: 'Insufficient capacity',
          required: capacityDelta,
          available: cloudService.availableCapacity,
          recommendation: `Expand cloud service capacity by ${capacityDelta - cloudService.availableCapacity} units`,
        },
        { status: 400 }
      );
    }

    // Enforce quota: Customer total allocation ≤ 50% of cloud capacity
    const maxAllowedCapacity = cloudService.totalCapacity * 0.5;
    if (newTotalCapacity > maxAllowedCapacity) {
      return NextResponse.json(
        {
          error: 'Customer quota exceeded',
          requested: newTotalCapacity,
          maxAllowed: maxAllowedCapacity,
          reason: 'Single customer cannot monopolize > 50% of total capacity',
        },
        { status: 400 }
      );
    }

    // Store previous bill for delta calculation
    const previousBill = cloudCustomer.monthlyBill;

    // Update CloudCustomer allocations
    cloudCustomer.allocatedVCpu = newVCpu;
    cloudCustomer.allocatedStorage = newStorage;
    cloudCustomer.allocatedBandwidth = newBandwidth;

    // Recalculate monthly bill manually
    let baseBill = 0;
    if (cloudService.type === 'Compute') {
      baseBill = newVCpu * cloudService.pricePerUnit;
    } else if (cloudService.type === 'Storage') {
      baseBill = newStorage * cloudService.pricePerUnit;
    } else if (cloudService.type === 'Bandwidth') {
      baseBill = newBandwidth * (cloudService.pricePerUnit / 1000);
    }

    let discount = 0;
    if (baseBill > 10000) {
      discount = 0.2;
    } else if (baseBill > 1000) {
      discount = 0.1;
    }

    const finalBill = Math.round(baseBill * (1 - discount) * 100) / 100;
    const billResult = { baseBill, discount, finalBill };

    cloudCustomer.monthlyBill = finalBill;
    await cloudCustomer.save();

    // Update CloudService aggregate metrics
    cloudService.allocatedCapacity += capacityDelta;
    cloudService.monthlyRevenue += (billResult.finalBill - previousBill);
    await cloudService.save();

    // Calculate utilization metrics manually
    const vCpuUtil = newVCpu > 0 ? Math.round((cloudCustomer.usedVCpu / newVCpu) * 100 * 100) / 100 : 0;
    const storageUtil = newStorage > 0 ? Math.round((cloudCustomer.usedStorage / newStorage) * 100 * 100) / 100 : 0;
    const bandwidthUtil = newBandwidth > 0 ? Math.round((cloudCustomer.usedBandwidth / newBandwidth) * 100 * 100) / 100 : 0;
    const overallUtil = Math.round(((vCpuUtil + storageUtil + bandwidthUtil) / 3) * 100) / 100;

    const utilizationMetrics = {
      vCpuUtilization: vCpuUtil,
      storageUtilization: storageUtil,
      bandwidthUtilization: bandwidthUtil,
      overallUtilization: overallUtil,
    };

    // Generate recommendations
    const recommendations: string[] = [];

    const needsAutoScaling = cloudCustomer.autoScalingEnabled && overallUtil >= cloudCustomer.scaleUpThreshold;

    if (needsAutoScaling) {
      recommendations.push(
        `Utilization at ${overallUtil.toFixed(1)}% (threshold: ${cloudCustomer.scaleUpThreshold}%). Consider increasing allocation.`
      );
    }

    if (overallUtil < 20) {
      recommendations.push(
        `Low utilization at ${overallUtil.toFixed(1)}%. Consider reducing allocation to save costs.`
      );
    }

    if (vCpuUtil > 90) {
      recommendations.push(`vCPU utilization at ${vCpuUtil.toFixed(1)}%. Immediate vCPU increase recommended.`);
    }

    if (storageUtil > 90) {
      recommendations.push(`Storage utilization at ${storageUtil.toFixed(1)}%. Immediate storage increase recommended.`);
    }

    if (bandwidthUtil > 90) {
      recommendations.push(`Bandwidth utilization at ${bandwidthUtil.toFixed(1)}%. Immediate bandwidth increase recommended.`);
    }

    if (billResult.discount > 0 && previousBill <= 1000 && billResult.finalBill > 1000) {
      recommendations.push(`Volume discount unlocked: ${billResult.discount * 100}% off (monthly bill > $1k).`);
    }

    if (capacityDelta < 0) {
      recommendations.push(`Resources reduced successfully. Monthly bill decreased by $${Math.abs(billResult.finalBill - previousBill).toFixed(2)}.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Resource allocation updated successfully. Monitor usage trends for optimization opportunities.');
    }

    return NextResponse.json({
      cloudCustomer,
      allocationChange: {
        vCpu: deltas.vCpuDelta || 0,
        storage: deltas.storageDelta || 0,
        bandwidth: deltas.bandwidthDelta || 0,
      },
      billingChange: {
        previousBill: Math.round(previousBill * 100) / 100,
        newBill: billResult.finalBill,
        delta: Math.round((billResult.finalBill - previousBill) * 100) / 100,
        discount: billResult.discount * 100,
      },
      utilizationMetrics,
      recommendations,
    });
  } catch (error) {
    console.error('Error updating cloud customer allocation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
