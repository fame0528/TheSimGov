/**
 * @file app/api/ecommerce/cloud/customers/route.ts
 * @description Cloud customer onboarding endpoint
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles onboarding of new cloud service customers (companies subscribing to cloud infrastructure).
 * Allocates initial resources based on customer tier (Startup/Enterprise/Government), validates
 * capacity availability, enforces quota limits (no customer > 50% capacity), and updates cloud
 * service aggregate metrics (customerCount, allocatedCapacity, monthlyRevenue).
 * 
 * ENDPOINTS:
 * - POST /api/ecommerce/cloud/customers - Onboard new customer
 * 
 * BUSINESS LOGIC:
 * - Tier-based allocations: Startup (10 vCPU, 1 TB, 100 GB), Enterprise (100, 10, 1000), Government (500, 50, 5000)
 * - Pricing: Compute $50/vCPU, Storage $100/TB, Bandwidth $50/TB (from CloudService.pricePerUnit)
 * - Monthly bills: Startup ~$550, Enterprise ~$6,050, Government ~$30,250
 * - Volume discounts: 10% off > $1k/month, 20% off > $10k/month
 * - Quota enforcement: No single customer > 50% of cloud service total capacity
 * - Capacity validation: Reject if insufficient capacity available
 * - Auto-scaling: Enabled by default (80% threshold triggers scale-up recommendations)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import CloudService from '@/lib/db/models/CloudService';
import CloudCustomer from '@/src/lib/db/models/CloudCustomer';
import Company from '@/lib/db/models/Company';
import { CloudCustomerCreateSchema } from '@/lib/validations/ecommerce';

/**
 * POST /api/ecommerce/cloud/customers
 * 
 * Onboard new cloud service customer
 * 
 * Request Body:
 * {
 *   cloudService: string;                    // CloudService ID
 *   customer: string;                        // Company ID (customer)
 *   tier: 'Startup' | 'Enterprise' | 'Government';
 *   allocatedVCpu?: number;                  // Optional custom allocation
 *   allocatedStorage?: number;               // Optional custom allocation
 *   allocatedBandwidth?: number;             // Optional custom allocation
 *   autoScalingEnabled?: boolean;            // Default true
 *   scaleUpThreshold?: number;               // Default 80%
 * }
 * 
 * Response:
 * {
 *   cloudCustomer: ICloudCustomer;
 *   allocation: { vCpu, storage, bandwidth };
 *   monthlyBill: { baseBill, discount, finalBill };
 *   cloudMetrics: { totalCustomers, utilizationRate, availableCapacity, monthlyRevenue };
 *   recommendations: string[];
 * }
 * 
 * Business Logic:
 * 1. Verify cloud service exists and user owns marketplace
 * 2. Verify customer company exists
 * 3. Check if customer already onboarded (prevent duplicates)
 * 4. Get default allocations by tier (or use custom allocations)
 * 5. Validate capacity available (totalAllocatedCapacity < availableCapacity)
 * 6. Enforce quota (customer allocation ≤ 50% of total capacity)
 * 7. Create CloudCustomer document
 * 8. Update CloudService aggregate metrics (customerCount, allocatedCapacity, monthlyRevenue)
 * 9. Calculate monthly bill with volume discounts
 * 10. Return customer with recommendations
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const validation = CloudCustomerCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    await dbConnect();

    // Verify cloud service exists and user owns marketplace
    const cloudService = await CloudService.findById(data.cloudService).populate({
      path: 'marketplace',
      populate: { path: 'company' },
    });

    if (!cloudService) {
      return NextResponse.json({ error: 'Cloud service not found' }, { status: 404 });
    }

    const marketplace = cloudService.marketplace as any;
    const company = await Company.findById(marketplace.company);

    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this cloud service' }, { status: 403 });
    }

    // Verify customer company exists
    const customerCompany = await Company.findById(data.customer);
    if (!customerCompany) {
      return NextResponse.json({ error: 'Customer company not found' }, { status: 404 });
    }

    // Check if customer already onboarded
    const existingCustomer = await CloudCustomer.findOne({
      cloudService: data.cloudService,
      customer: data.customer,
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer already onboarded to this cloud service' },
        { status: 409 }
      );
    }

    // Get default allocations by tier (or use custom allocations)
    const defaultAllocation = (CloudCustomer as any).getDefaultAllocation(data.tier);
    
    const allocatedVCpu = data.allocatedVCpu ?? defaultAllocation.vCpu;
    const allocatedStorage = data.allocatedStorage ?? defaultAllocation.storage;
    const allocatedBandwidth = data.allocatedBandwidth ?? defaultAllocation.bandwidth;

    // Calculate total allocated capacity (normalized units)
    const totalAllocatedCapacity = allocatedVCpu + allocatedStorage * 1000 + allocatedBandwidth;

    // Validate capacity available
    if (totalAllocatedCapacity > cloudService.availableCapacity) {
      return NextResponse.json(
        {
          error: 'Insufficient capacity',
          required: totalAllocatedCapacity,
          available: cloudService.availableCapacity,
          recommendation: `Expand cloud service capacity by ${totalAllocatedCapacity - cloudService.availableCapacity} units`,
        },
        { status: 400 }
      );
    }

    // Enforce quota: No single customer > 50% of total capacity
    const maxAllowedCapacity = cloudService.totalCapacity * 0.5;
    if (totalAllocatedCapacity > maxAllowedCapacity) {
      return NextResponse.json(
        {
          error: 'Customer quota exceeded',
          requested: totalAllocatedCapacity,
          maxAllowed: maxAllowedCapacity,
          reason: 'Single customer cannot monopolize > 50% of total capacity',
        },
        { status: 400 }
      );
    }

    // Calculate monthly bill
    let baseBill = 0;
    
    if (cloudService.type === 'Compute') {
      baseBill = allocatedVCpu * cloudService.pricePerUnit;
    } else if (cloudService.type === 'Storage') {
      baseBill = allocatedStorage * cloudService.pricePerUnit;
    } else if (cloudService.type === 'Bandwidth') {
      baseBill = allocatedBandwidth * (cloudService.pricePerUnit / 1000); // GB pricing
    }

    // Apply volume discounts
    let discount = 0;
    if (baseBill > 10000) {
      discount = 0.2; // 20% off > $10k/month
    } else if (baseBill > 1000) {
      discount = 0.1; // 10% off > $1k/month
    }

    const finalBill = Math.round(baseBill * (1 - discount) * 100) / 100;

    // Create CloudCustomer document
    const cloudCustomer = await CloudCustomer.create({
      cloudService: data.cloudService,
      customer: data.customer,
      tier: data.tier,
      onboardedAt: new Date(),
      active: true,
      allocatedVCpu,
      allocatedStorage,
      allocatedBandwidth,
      usedVCpu: 0,
      usedStorage: 0,
      usedBandwidth: 0,
      peakVCpu: 0,
      peakStorage: 0,
      monthlyBill: finalBill,
      totalBilled: 0,
      lastBillingDate: new Date(),
      paymentStatus: 'Current',
      autoScalingEnabled: data.autoScalingEnabled ?? true,
      scaleUpThreshold: data.scaleUpThreshold ?? 80,
    });

    // Update CloudService aggregate metrics
    cloudService.allocatedCapacity += totalAllocatedCapacity;
    cloudService.customerCount += 1;
    cloudService.monthlyRevenue += finalBill;
    await cloudService.save();

    // Populate customer company for response
    await cloudCustomer.populate('customer');

    // Generate recommendations
    const recommendations: string[] = [];

    if (cloudService.utilizationRate > 80) {
      recommendations.push(
        `High utilization at ${cloudService.utilizationRate.toFixed(1)}%. Consider expanding capacity to accommodate more customers.`
      );
    }

    if (cloudService.customerCount === 1) {
      recommendations.push('First customer onboarded! Offer promotional pricing to attract more customers.');
    }

    if (finalBill < 1000) {
      recommendations.push('Customer is on a low-tier plan. Consider upsell opportunities as usage grows.');
    }

    if (cloudService.capacityBuffer < 20) {
      recommendations.push(
        `Capacity buffer at ${cloudService.capacityBuffer.toFixed(1)}%. Add spare capacity for demand spikes.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Customer onboarded successfully. Monitor usage and billing monthly.');
    }

    return NextResponse.json(
      {
        cloudCustomer,
        allocation: {
          vCpu: allocatedVCpu,
          storage: allocatedStorage,
          bandwidth: allocatedBandwidth,
        },
        monthlyBill: {
          baseBill: Math.round(baseBill * 100) / 100,
          discount: discount * 100,
          finalBill,
        },
        cloudMetrics: {
          totalCustomers: cloudService.customerCount,
          utilizationRate: Math.round(cloudService.utilizationRate * 100) / 100,
          availableCapacity: cloudService.availableCapacity,
          monthlyRevenue: cloudService.monthlyRevenue,
        },
        recommendations,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error onboarding cloud customer:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
