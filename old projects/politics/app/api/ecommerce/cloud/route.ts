/**
 * @file app/api/ecommerce/cloud/route.ts
 * @description Cloud service management API endpoints (launch, details)
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles cloud infrastructure service launch and retrieval for E-Commerce marketplace platforms.
 * Implements AWS-style cloud services (Compute, Storage, Bandwidth, Database, AI) with resource
 * allocation, usage metering, pricing tiers, and customer subscriptions. High-margin business
 * model (70%+ profit margin) with recurring revenue and auto-scaling capabilities.
 * 
 * ENDPOINTS:
 * - POST /api/ecommerce/cloud - Launch new cloud service with financial validation
 * - GET /api/ecommerce/cloud/:id - Cloud service details with utilization metrics
 * 
 * BUSINESS LOGIC:
 * - Launch cost: $2M ($1M infrastructure + $1M data centers)
 * - Service types: Compute (vCPU), Storage (TB), Bandwidth (GB), Database (instances), AI (API calls)
 * - Pricing: Compute $50/vCPU, Storage $100/TB, Bandwidth $50/TB, Database $200/instance, AI $0.001/call
 * - Target margin: 70% (low infrastructure costs, high prices)
 * - Auto-scaling: Customer demand triggers automatic resource allocation
 * - Utilization target: 70-80% (maximize revenue without capacity issues)
 * - Overprovisioning: Maintain 20-30% spare capacity for demand spikes
 * 
 * IMPLEMENTATION NOTES:
 * - Multiple cloud services per marketplace (e.g., separate Compute, Storage services)
 * - Resource capacity: vCPU (units), Storage (TB), Bandwidth (GB/month), Database (instances), AI (calls/month)
 * - Operating costs: Infrastructure maintenance (typically 30% of revenue for 70% margin)
 * - Volume discounts: 10% off > $1k/month, 20% off > $10k/month (applied at customer billing)
 * - Real-time utilization tracking: (allocated/capacity) × 100
 * - Revenue breakdown: By service type (compute, storage, bandwidth contributions)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import CloudService from '@/lib/db/models/CloudService';
import Marketplace from '@/lib/db/models/Marketplace';
import Company from '@/lib/db/models/Company';
import { CloudServiceCreateSchema } from '@/lib/validations/ecommerce';
import { Types } from 'mongoose';

/**
 * POST /api/ecommerce/cloud
 * 
 * Launch new cloud service with financial validation
 * 
 * Request Body:
 * {
 *   marketplace: string;          // Marketplace ID
 *   name: string;                  // Service name (e.g., "Elastic Compute Cloud")
 *   type: 'Compute' | 'Storage' | 'Bandwidth' | 'Database' | 'AI';
 *   totalCapacity: number;         // Total resource capacity (units vary by type)
 *   pricePerUnit: number;          // Price per unit per month
 *   pricingModel: 'Fixed' | 'PayAsYouGo' | 'Tiered';
 *   operatingCost: number;         // Monthly infrastructure cost
 * }
 * 
 * Response:
 * {
 *   cloud: ICloudService;
 *   launchCost: number;            // $2M startup investment
 *   pricingStructure: {
 *     pricePerUnit: number;
 *     pricingModel: string;
 *     targetMargin: number;        // 70% target
 *   };
 * }
 * 
 * Business Logic:
 * 1. Validate marketplace exists and user owns it
 * 2. Calculate cloud service launch cost: $2,000,000
 *    - $1M infrastructure (servers, networking, cooling)
 *    - $1M data centers (facilities, power, redundancy)
 * 3. Validate company has sufficient cash
 * 4. Deduct launch cost from company cash
 * 5. Create cloud service document with default settings
 * 6. Set default pricing based on service type if not provided:
 *    - Compute: $50/vCPU/month
 *    - Storage: $100/TB/month ($0.10/GB)
 *    - Bandwidth: $50/TB transfer ($0.05/GB)
 *    - Database: $200/instance/month
 *    - AI: $0.001/API call
 * 7. Calculate target operating cost for 70% margin
 * 8. Return cloud service with financial breakdown
 * 
 * Error Cases:
 * - 401: Not authenticated
 * - 400: Invalid request data
 * - 404: Marketplace not found
 * - 403: User doesn't own marketplace
 * - 402: Insufficient funds for cloud launch
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
    const validation = CloudServiceCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    await dbConnect();

    // Verify marketplace exists and user owns it
    const marketplace = await Marketplace.findById(data.marketplace).populate('company');
    if (!marketplace) {
      return NextResponse.json({ error: 'Marketplace not found' }, { status: 404 });
    }

    const company = await Company.findById(marketplace.company);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this company' }, { status: 403 });
    }

    // Calculate cloud service launch cost
    const infrastructureCost = 1000000; // $1M servers/networking
    const dataCenterCost = 1000000; // $1M facilities
    const totalLaunchCost = infrastructureCost + dataCenterCost; // $2M total

    // Validate company has sufficient cash
    if (company.cash < totalLaunchCost) {
      return NextResponse.json(
        {
          error: 'Insufficient funds',
          required: totalLaunchCost,
          available: company.cash,
          shortfall: totalLaunchCost - company.cash,
        },
        { status: 402 }
      );
    }

    // Deduct launch cost
    company.cash -= totalLaunchCost;

    // Set default pricing based on service type if not provided or too low
    let pricePerUnit = data.pricePerUnit;
    const defaultPricing: Record<string, number> = {
      Compute: 50, // $50/vCPU/month
      Storage: 100, // $100/TB/month
      Bandwidth: 50, // $50/TB transfer
      Database: 200, // $200/instance/month
      AI: 0.001, // $0.001/API call
    };

    if (!pricePerUnit || pricePerUnit < (defaultPricing[data.type] || 1)) {
      pricePerUnit = defaultPricing[data.type] || 1;
    }

    // Calculate target operating cost for 70% margin
    // Revenue = capacity × pricePerUnit (when fully utilized)
    // Target operating cost = Revenue × 0.3 (30% of revenue)
    const maxMonthlyRevenue = data.totalCapacity * pricePerUnit;
    const targetOperatingCost = data.operatingCost || Math.round(maxMonthlyRevenue * 0.3);

    // Create cloud service document
    const cloud = await CloudService.create({
      marketplace: new Types.ObjectId(data.marketplace),
      name: data.name,
      type: data.type,
      active: true,
      launchedAt: new Date(),
      totalCapacity: data.totalCapacity,
      allocatedCapacity: 0,
      customerCount: 0,
      autoScaling: data.autoScaling !== undefined ? data.autoScaling : true,
      pricePerUnit,
      pricingModel: data.pricingModel,
      minimumCommitment: data.minimumCommitment || 0,
      overageRate: data.overageRate || pricePerUnit * 1.5, // 1.5x for overage
      totalUsage: 0,
      monthlyUsage: 0,
      peakUsage: 0,
      utilizationRate: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      operatingCost: targetOperatingCost,
      profitMargin: 70, // Target 70% margin
    });

    // Save company (cash deduction)
    await company.save();

    return NextResponse.json({
      cloud,
      launchCost: totalLaunchCost,
      pricingStructure: {
        pricePerUnit: cloud.pricePerUnit,
        pricingModel: cloud.pricingModel,
        overageRate: cloud.overageRate,
        targetMargin: 70,
      },
      capacityMetrics: {
        totalCapacity: cloud.totalCapacity,
        availableCapacity: cloud.totalCapacity, // All available initially
        utilizationTarget: '70-80%',
        capacityBuffer: '20-30%',
      },
      message: `Cloud service launched successfully. Type: ${data.type}, Capacity: ${data.totalCapacity} units, Price: $${pricePerUnit}/unit/month`,
    });
  } catch (error) {
    console.error('Error launching cloud service:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ecommerce/cloud/:id
 * 
 * Retrieve cloud service details with utilization metrics and revenue breakdown
 * 
 * URL Parameters:
 * - id: Cloud service ID
 * 
 * Response:
 * {
 *   cloud: ICloudService;
 *   utilizationMetrics: {
 *     utilizationRate: number;       // % (allocated/capacity)
 *     availableCapacity: number;     // Unallocated units
 *     capacityBuffer: number;        // % spare capacity
 *     peakUsage: number;             // Peak concurrent usage
 *   };
 *   revenueMetrics: {
 *     monthlyRevenue: number;
 *     monthlyProfit: number;         // Revenue - operating cost
 *     profitMargin: number;          // %
 *     revenuePerCustomer: number;    // ARPU
 *   };
 *   recommendations: string[];       // Optimization suggestions
 * }
 * 
 * Business Logic:
 * 1. Verify cloud service exists and user owns marketplace
 * 2. Calculate real-time utilization metrics
 * 3. Compute revenue and profitability
 * 4. Generate optimization recommendations:
 *    - Utilization > 80%: "Expand capacity to avoid bottlenecks"
 *    - Utilization < 50%: "Reduce operating costs or increase marketing"
 *    - Margin < 60%: "Review pricing strategy or reduce infrastructure costs"
 *    - Auto-scaling disabled + high utilization: "Enable auto-scaling for better customer experience"
 * 5. Return comprehensive analytics
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cloudId = searchParams.get('id');

    if (!cloudId) {
      return NextResponse.json({ error: 'Cloud service ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Fetch cloud service with marketplace population
    const cloud = await CloudService.findById(cloudId).populate({
      path: 'marketplace',
      populate: { path: 'company' },
    });

    if (!cloud) {
      return NextResponse.json({ error: 'Cloud service not found' }, { status: 404 });
    }

    // Verify user owns marketplace
    const marketplace = cloud.marketplace as any;
    const company = await Company.findById(marketplace.company);

    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this cloud service' }, { status: 403 });
    }

    // Calculate utilization metrics (using virtual fields)
    const utilizationMetrics = {
      utilizationRate: Math.round(cloud.utilizationRate * 100) / 100,
      availableCapacity: cloud.availableCapacity,
      capacityBuffer: Math.round(cloud.capacityBuffer * 100) / 100,
      peakUsage: cloud.peakUsage,
      totalCapacity: cloud.totalCapacity,
      allocatedCapacity: cloud.allocatedCapacity,
    };

    // Calculate revenue metrics (using virtual fields)
    const revenueMetrics = {
      monthlyRevenue: cloud.monthlyRevenue,
      monthlyProfit: cloud.monthlyProfit,
      profitMargin: Math.round(cloud.profitMargin * 100) / 100,
      revenuePerCustomer: Math.round(cloud.revenuePerCustomer * 100) / 100,
      totalRevenue: cloud.totalRevenue,
      operatingCost: cloud.operatingCost,
    };

    // Generate recommendations
    const recommendations: string[] = [];

    if (cloud.utilizationRate > 80) {
      recommendations.push(
        `High utilization at ${cloud.utilizationRate.toFixed(1)}%. Consider expanding capacity by ${Math.round(cloud.totalCapacity * 0.25)} units to avoid bottlenecks.`
      );
    }

    if (cloud.utilizationRate < 50 && cloud.customerCount > 0) {
      recommendations.push(
        `Low utilization at ${cloud.utilizationRate.toFixed(1)}%. Reduce operating costs or increase marketing to attract more customers.`
      );
    }

    if (cloud.profitMargin < 60) {
      recommendations.push(
        `Profit margin at ${cloud.profitMargin.toFixed(1)}% (target: 70%). Review pricing strategy or reduce infrastructure costs.`
      );
    }

    if (!cloud.autoScaling && cloud.utilizationRate > 70) {
      recommendations.push(
        'Auto-scaling is disabled with high utilization. Enable auto-scaling for better customer experience and automatic capacity management.'
      );
    }

    if (cloud.capacityBuffer < 15 && cloud.customerCount > 5) {
      recommendations.push(
        `Capacity buffer at ${cloud.capacityBuffer.toFixed(1)}% (target: 20-30%). Add spare capacity for demand spikes.`
      );
    }

    if (cloud.customerCount === 0) {
      recommendations.push(
        'No customers yet. Offer promotional pricing or free tier to attract initial users and build adoption.'
      );
    }

    if (cloud.customerCount > 0 && cloud.revenuePerCustomer < 100) {
      recommendations.push(
        `Low ARPU at $${cloud.revenuePerCustomer.toFixed(2)}/customer. Upsell to higher usage tiers or add premium features.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Cloud service is operating optimally. Continue monitoring metrics and customer satisfaction.');
    }

    return NextResponse.json({
      cloud,
      utilizationMetrics,
      revenueMetrics,
      recommendations,
    });
  } catch (error) {
    console.error('Error fetching cloud service details:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
