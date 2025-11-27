/**
 * @file app/api/cloud/servers/route.ts
 * @description Cloud server infrastructure management API endpoints
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles cloud infrastructure service launch and retrieval for Technology/Software companies.
 * Implements cloud services (Compute, Storage, Bandwidth, Database, AI) with resource
 * allocation, usage metering, pricing tiers, and customer subscriptions. High-margin business
 * model (70-75% profit margin) with recurring revenue and auto-scaling capabilities.
 * 
 * ENDPOINTS:
 * - POST /api/cloud/servers - Launch new cloud service with financial validation
 * - GET /api/cloud/servers - List cloud services with utilization metrics
 * 
 * BUSINESS LOGIC:
 * - Launch cost: $1.5M ($1M infrastructure + $500k setup)
 * - Service types: Compute (vCPU), Storage (TB), Bandwidth (TB), Database (instance), AI (API calls)
 * - Pricing: Compute $50/vCPU, Storage $100/TB, Bandwidth $50/TB, Database $200/instance, AI $0.001/call
 * - Target margin: 72% (infrastructure costs, competitive market)
 * - Auto-scaling: Customer demand triggers automatic resource allocation
 * - Utilization target: 70-80% (maximize revenue without capacity issues)
 * - Overprovisioning: Maintain 20-30% spare capacity for spikes
 * 
 * IMPLEMENTATION NOTES:
 * - 85% code reuse from E-Commerce cloud infrastructure API
 * - Adjusted launch cost from $2M → $1.5M for cloud servers
 * - Replaced marketplace → company references
 * - Added serverLocation, redundancyLevel, uptimeTarget fields
 * - Kept capacity management, auto-scaling, revenue tracking intact
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import CloudServer from '@/lib/db/models/CloudServer';
import Company from '@/lib/db/models/Company';
import { Types } from 'mongoose';

/**
 * POST /api/cloud/servers
 * 
 * Launch new cloud infrastructure service with financial validation
 * 
 * Request Body:
 * {
 *   company: string;                 // Company ID (Technology/Software)
 *   name: string;                     // Service name (e.g., "Elastic Compute Cloud")
 *   type: 'Compute' | 'Storage' | 'Bandwidth' | 'Database' | 'AI';
 *   totalCapacity: number;            // Total resource capacity (units vary by type)
 *   pricePerUnit?: number;            // Price per unit per month
 *   pricingModel?: 'Fixed' | 'PayAsYouGo' | 'Tiered';
 *   operatingCost?: number;           // Monthly infrastructure cost
 *   serverLocation?: string;          // Data center location
 *   redundancyLevel?: 'Single' | 'Multi-zone' | 'Multi-region';
 *   uptimeTarget?: number;            // SLA uptime percentage
 *   backupSchedule?: 'Daily' | 'Hourly' | 'Real-time';
 * }
 * 
 * Response:
 * {
 *   cloud: ICloudServer;
 *   launchCost: number;               // $1.5M startup investment
 *   pricingStructure: {
 *     pricePerUnit: number;
 *     pricingModel: string;
 *     overageRate: number;
 *     targetMargin: number;           // 72% target
 *   };
 *   capacityMetrics: {
 *     totalCapacity: number;
 *     availableCapacity: number;
 *     utilizationTarget: string;
 *     capacityBuffer: string;
 *   };
 *   message: string;
 * }
 * 
 * Business Logic:
 * 1. Validate company exists and user owns it
 * 2. Verify company is Technology/Software industry
 * 3. Calculate cloud service launch cost: $1,500,000
 *    - $1M infrastructure (servers, networking, cooling)
 *    - $500k setup (data centers, facilities)
 * 4. Validate company has sufficient cash
 * 5. Deduct launch cost from company cash
 * 6. Create cloud service document with default settings
 * 7. Set default pricing based on service type
 * 8. Calculate target operating cost for 72% margin
 * 9. Return cloud service with financial breakdown
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
    const {
      company: companyId,
      name,
      type,
      totalCapacity,
      pricePerUnit,
      pricingModel,
      operatingCost,
      serverLocation,
      redundancyLevel,
      uptimeTarget,
      backupSchedule,
    } = body;

    // Validate required fields
    if (!companyId || !name || !type || !totalCapacity) {
      return NextResponse.json(
        { error: 'Missing required fields: company, name, type, totalCapacity' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify company exists and user owns it
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this company' }, { status: 403 });
    }

    // Verify company is Technology/Software industry
    if (company.industry !== 'Technology' || company.subcategory !== 'Software') {
      return NextResponse.json(
        {
          error: 'Invalid company type - Must be Technology/Software industry',
          industry: company.industry,
          subcategory: company.subcategory,
        },
        { status: 400 }
      );
    }

    // Calculate cloud service launch cost ($1.5M for cloud servers)
    const infrastructureCost = 1000000; // $1M servers/networking
    const setupCost = 500000; // $500k data centers/facilities
    const totalLaunchCost = infrastructureCost + setupCost; // $1.5M total

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

    // Set default pricing based on service type
    let finalPricePerUnit = pricePerUnit;
    const defaultPricing: Record<string, number> = {
      Compute: 50, // $50/vCPU/month
      Storage: 100, // $100/TB/month
      Bandwidth: 50, // $50/TB transfer
      Database: 200, // $200/instance/month
      AI: 0.001, // $0.001/API call
    };

    if (!finalPricePerUnit || finalPricePerUnit < (defaultPricing[type] || 1)) {
      finalPricePerUnit = defaultPricing[type] || 1;
    }

    // Calculate target operating cost for 72% margin
    // Revenue = capacity × pricePerUnit (when fully utilized)
    // Target operating cost = Revenue × 0.28 (28% of revenue)
    const maxMonthlyRevenue = totalCapacity * finalPricePerUnit;
    const targetOperatingCost = operatingCost || Math.round(maxMonthlyRevenue * 0.28);

    // Deduct launch cost from company cash
    company.cash -= totalLaunchCost;
    await company.save();

    // Create cloud service document
    const cloud = await CloudServer.create({
      company: new Types.ObjectId(companyId),
      name,
      type,
      active: true,
      launchedAt: new Date(),
      serverLocation: serverLocation || 'US-East',
      redundancyLevel: redundancyLevel || 'Multi-zone',
      uptimeTarget: uptimeTarget !== undefined ? uptimeTarget : 99.9,
      backupSchedule: backupSchedule || 'Daily',
      totalCapacity,
      allocatedCapacity: 0,
      customerCount: 0,
      autoScaling: true,
      pricePerUnit: finalPricePerUnit,
      pricingModel: pricingModel || 'PayAsYouGo',
      minimumCommitment: 0,
      overageRate: finalPricePerUnit * 1.5, // 1.5× for overage
      totalUsage: 0,
      monthlyUsage: 0,
      peakUsage: 0,
      utilizationRate: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      operatingCost: targetOperatingCost,
      profitMargin: 72, // Target 72% margin
    });

    return NextResponse.json({
      cloud,
      launchCost: totalLaunchCost,
      pricingStructure: {
        pricePerUnit: cloud.pricePerUnit,
        pricingModel: cloud.pricingModel,
        overageRate: cloud.overageRate,
        targetMargin: 72,
      },
      capacityMetrics: {
        totalCapacity: cloud.totalCapacity,
        availableCapacity: cloud.totalCapacity,
        utilizationTarget: '70-80%',
        capacityBuffer: '20-30%',
      },
      message: `Cloud service launched successfully. Type: ${type}, Capacity: ${totalCapacity} units, Price: $${finalPricePerUnit}/unit/month`,
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
 * GET /api/cloud/servers
 * 
 * List cloud services with utilization metrics
 * 
 * Query Parameters:
 * - company: string (required) - Company ID to filter services
 * - type?: CloudServiceType - Filter by service type
 * 
 * Response:
 * {
 *   servers: ICloudServer[];
 *   company: {
 *     name: string;
 *     level: number;
 *   };
 *   aggregatedMetrics: {
 *     totalCapacity: number;
 *     allocatedCapacity: number;
 *     avgUtilization: number;
 *     totalRevenue: number;
 *     monthlyRevenue: number;
 *   };
 *   typeBreakdown: Array<{
 *     type: string;
 *     capacity: number;
 *     utilization: number;
 *     revenue: number;
 *   }>;
 *   recommendations: string[];
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');
    const typeFilter = searchParams.get('type');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Verify company exists and user owns it
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this company' }, { status: 403 });
    }

    // Build query filter
    const filter: any = { company: companyId, active: true };
    if (typeFilter) filter.type = typeFilter;

    // Fetch cloud services
    const servers = await CloudServer.find(filter).sort({ type: 1, monthlyRevenue: -1 });

    // Calculate aggregated metrics
    const aggregatedMetrics = {
      totalCapacity: servers.reduce((sum, s) => sum + s.totalCapacity, 0),
      allocatedCapacity: servers.reduce((sum, s) => sum + s.allocatedCapacity, 0),
      avgUtilization: 0,
      totalRevenue: servers.reduce((sum, s) => sum + s.totalRevenue, 0),
      monthlyRevenue: servers.reduce((sum, s) => sum + s.monthlyRevenue, 0),
    };

    // Calculate weighted average utilization
    if (aggregatedMetrics.totalCapacity > 0) {
      aggregatedMetrics.avgUtilization =
        Math.round((aggregatedMetrics.allocatedCapacity / aggregatedMetrics.totalCapacity) * 100 * 100) / 100;
    }

    // Generate type breakdown
    const typeBreakdown = servers.reduce((acc: any[], server) => {
      const existing = acc.find((item) => item.type === server.type);
      if (existing) {
        existing.capacity += server.totalCapacity;
        existing.allocated += server.allocatedCapacity;
        existing.revenue += server.monthlyRevenue;
      } else {
        acc.push({
          type: server.type,
          capacity: server.totalCapacity,
          allocated: server.allocatedCapacity,
          revenue: server.monthlyRevenue,
        });
      }
      return acc;
    }, []);

    // Calculate utilization for each type
    typeBreakdown.forEach((item) => {
      item.utilization = item.capacity > 0 ? Math.round((item.allocated / item.capacity) * 100 * 100) / 100 : 0;
    });

    // Generate recommendations
    const recommendations: string[] = [];

    if (servers.length === 0) {
      recommendations.push('No cloud services launched yet. Launch Compute, Storage, or Database services to start.');
    } else if (aggregatedMetrics.avgUtilization > 80) {
      recommendations.push(
        `High utilization at ${aggregatedMetrics.avgUtilization.toFixed(1)}%. Consider expanding capacity to avoid bottlenecks.`
      );
    } else if (aggregatedMetrics.avgUtilization < 50 && servers.some((s) => s.customerCount > 0)) {
      recommendations.push(
        `Low utilization at ${aggregatedMetrics.avgUtilization.toFixed(1)}%. Reduce operating costs or increase marketing.`
      );
    }

    // Service-specific recommendations
    const lowMarginServices = servers.filter((s) => s.profitMargin < 60);
    if (lowMarginServices.length > 0) {
      recommendations.push(
        `${lowMarginServices.length} service(s) below 60% margin. Review pricing or reduce infrastructure costs.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Cloud services operating optimally. Monitor metrics and customer satisfaction.');
    }

    return NextResponse.json({
      servers,
      company: {
        name: company.name,
        level: company.level,
      },
      aggregatedMetrics,
      typeBreakdown,
      recommendations,
    });
  } catch (error) {
    console.error('Error fetching cloud servers:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
