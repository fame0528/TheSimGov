/**
 * @file app/api/ecommerce/cloud/customers/[id]/billing/route.ts
 * @description Cloud customer billing information endpoint
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Provides detailed monthly billing breakdown for cloud customers, including base charges,
 * volume discounts, usage statistics, cost optimization suggestions, and payment status.
 * Helps customers understand their cloud infrastructure costs and identifies opportunities
 * to reduce expenses through allocation optimization or usage pattern changes.
 * 
 * ENDPOINTS:
 * - GET /api/ecommerce/cloud/customers/:id/billing - Monthly billing details
 * 
 * BUSINESS LOGIC:
 * - Base bill: Allocated resources × pricePerUnit (per cloud service type)
 * - Volume discounts: 10% off > $1k/month, 20% off > $10k/month
 * - Usage tracking: Current vs. allocated resources (utilization %)
 * - Cost optimization: Recommendations to reduce overprovisioning
 * - Payment status: Current, Overdue, or Suspended
 * - Billing history: Total billed lifetime, last billing date
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import CloudCustomer from '@/src/lib/db/models/CloudCustomer';
import Company from '@/lib/db/models/Company';

/**
 * GET /api/ecommerce/cloud/customers/:id/billing
 * 
 * Retrieve customer billing details with cost breakdown and optimization suggestions
 * 
 * Response:
 * {
 *   customer: ICloudCustomer;
 *   currentMonthBill: {
 *     baseBill: number;             // Before discounts
 *     discount: number;             // % discount applied
 *     finalBill: number;            // After discounts
 *   };
 *   usageBreakdown: {
 *     vCpu: { allocated, used, utilization% };
 *     storage: { allocated, used, utilization% };
 *     bandwidth: { allocated, used, utilization% };
 *   };
 *   billingHistory: {
 *     totalBilled: number;          // Lifetime
 *     lastBillingDate: Date;
 *     paymentStatus: string;
 *   };
 *   optimizationSuggestions: string[];
 * }
 * 
 * Business Logic:
 * 1. Verify customer exists and user owns cloud service marketplace
 * 2. Calculate current month bill (base + volume discount)
 * 3. Compile usage breakdown (allocated vs. used for each resource type)
 * 4. Include billing history (total billed, payment status)
 * 5. Generate cost optimization suggestions:
 *    - Reduce overprovisioned resources (< 20% utilization)
 *    - Enable CDN for bandwidth savings
 *    - Archive old data to cheaper storage tiers
 *    - Upgrade to annual plan for additional discounts
 *    - Scale down during off-peak hours
 * 6. Return comprehensive billing report
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch cloud customer with populated cloud service
    const cloudCustomer = await CloudCustomer.findById(params.id).populate({
      path: 'cloudService',
      populate: {
        path: 'marketplace',
        populate: { path: 'company' },
      },
    }).populate('customer');

    if (!cloudCustomer) {
      return NextResponse.json({ error: 'Cloud customer not found' }, { status: 404 });
    }

    const cloudService = cloudCustomer.cloudService as any;
    const marketplace = cloudService.marketplace as any;
    const company = await Company.findById(marketplace.company);

    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this cloud service' }, { status: 403 });
    }

    // Calculate current month bill
    let baseBill = 0;
    
    if (cloudService.type === 'Compute') {
      baseBill = cloudCustomer.allocatedVCpu * cloudService.pricePerUnit;
    } else if (cloudService.type === 'Storage') {
      baseBill = cloudCustomer.allocatedStorage * cloudService.pricePerUnit;
    } else if (cloudService.type === 'Bandwidth') {
      baseBill = cloudCustomer.allocatedBandwidth * (cloudService.pricePerUnit / 1000); // GB pricing
    }

    // Apply volume discounts
    let discount = 0;
    if (baseBill > 10000) {
      discount = 0.2; // 20% off > $10k/month
    } else if (baseBill > 1000) {
      discount = 0.1; // 10% off > $1k/month
    }

    const finalBill = Math.round(baseBill * (1 - discount) * 100) / 100;

    const currentMonthBill = {
      baseBill: Math.round(baseBill * 100) / 100,
      discount: discount * 100, // Convert to percentage
      finalBill,
    };

    // Compile usage breakdown
    const vCpuUtil = cloudCustomer.allocatedVCpu > 0 
      ? Math.round((cloudCustomer.usedVCpu / cloudCustomer.allocatedVCpu) * 100 * 100) / 100 
      : 0;
    const storageUtil = cloudCustomer.allocatedStorage > 0 
      ? Math.round((cloudCustomer.usedStorage / cloudCustomer.allocatedStorage) * 100 * 100) / 100 
      : 0;
    const bandwidthUtil = cloudCustomer.allocatedBandwidth > 0 
      ? Math.round((cloudCustomer.usedBandwidth / cloudCustomer.allocatedBandwidth) * 100 * 100) / 100 
      : 0;

    const usageBreakdown = {
      vCpu: {
        allocated: cloudCustomer.allocatedVCpu,
        used: cloudCustomer.usedVCpu,
        utilization: vCpuUtil,
        unitCost: cloudService.type === 'Compute' ? cloudService.pricePerUnit : 0,
      },
      storage: {
        allocated: cloudCustomer.allocatedStorage,
        used: cloudCustomer.usedStorage,
        utilization: storageUtil,
        unitCost: cloudService.type === 'Storage' ? cloudService.pricePerUnit : 0,
      },
      bandwidth: {
        allocated: cloudCustomer.allocatedBandwidth,
        used: cloudCustomer.usedBandwidth,
        utilization: bandwidthUtil,
        unitCost: cloudService.type === 'Bandwidth' ? cloudService.pricePerUnit / 1000 : 0,
      },
    };

    // Billing history
    const billingHistory = {
      totalBilled: cloudCustomer.totalBilled,
      lastBillingDate: cloudCustomer.lastBillingDate,
      paymentStatus: cloudCustomer.paymentStatus,
    };

    // Generate cost optimization suggestions
    const optimizationSuggestions: string[] = [];

    const overallUtil = (vCpuUtil + storageUtil + bandwidthUtil) / 3;

    if (overallUtil < 30) {
      const wastage = Math.round((baseBill * (1 - overallUtil / 100)) * 100) / 100;
      optimizationSuggestions.push(
        `Low utilization at ${overallUtil.toFixed(1)}%. Reduce allocation to save ~$${wastage}/month.`
      );
    }

    if (vCpuUtil < 20 && cloudCustomer.allocatedVCpu > 10) {
      optimizationSuggestions.push(
        `vCPU underutilized (${vCpuUtil.toFixed(1)}%). Consider reducing from ${cloudCustomer.allocatedVCpu} to ${Math.ceil(cloudCustomer.allocatedVCpu * 0.5)} vCPUs.`
      );
    }

    if (storageUtil < 20 && cloudCustomer.allocatedStorage > 1) {
      optimizationSuggestions.push(
        `Storage underutilized (${storageUtil.toFixed(1)}%). Archive old data or reduce allocation from ${cloudCustomer.allocatedStorage} TB to ${Math.ceil(cloudCustomer.allocatedStorage * 0.5)} TB.`
      );
    }

    if (bandwidthUtil > 80 && cloudService.type === 'Bandwidth') {
      optimizationSuggestions.push(
        'High bandwidth usage. Enable CDN or content caching to reduce transfer costs.'
      );
    }

    if (baseBill > 900 && baseBill < 1100 && discount === 0) {
      optimizationSuggestions.push(
        'Close to $1k/month threshold. Slight increase unlocks 10% volume discount.'
      );
    }

    if (baseBill > 9000 && baseBill < 11000 && discount === 0.1) {
      optimizationSuggestions.push(
        'Close to $10k/month threshold. Slight increase unlocks 20% volume discount (save ~$1k/month).'
      );
    }

    if (cloudCustomer.tier === 'Startup' && finalBill > 2000) {
      optimizationSuggestions.push(
        'Startup tier with high usage. Upgrade to Enterprise tier for better pricing and support.'
      );
    }

    if (cloudCustomer.paymentStatus === 'Overdue') {
      optimizationSuggestions.push(
        'Payment overdue. Update payment method to avoid service suspension.'
      );
    }

    if (optimizationSuggestions.length === 0) {
      optimizationSuggestions.push('Billing is optimized. Continue monitoring usage patterns for future savings.');
    }

    return NextResponse.json({
      customer: cloudCustomer,
      currentMonthBill,
      usageBreakdown,
      billingHistory,
      optimizationSuggestions,
    });
  } catch (error) {
    console.error('Error fetching cloud customer billing:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
