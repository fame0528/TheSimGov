/**
 * @file app/api/ecommerce/fulfillment-centers/route.ts
 * @description Fulfillment center management API endpoints (create, list)
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles fulfillment center (FC) creation and listing for E-Commerce marketplace platforms.
 * FCs are warehouses that store inventory, process orders, and ship packages. Creating an FC
 * in a new state triggers sales tax nexus (company must collect sales tax in that state).
 * Supports automation levels (Low/Medium/High) that affect efficiency and operating costs.
 * 
 * ENDPOINTS:
 * - POST /api/ecommerce/fulfillment-centers - Create new FC with financial validation
 * - GET /api/ecommerce/fulfillment-centers - List all FCs with filters and network metrics
 * 
 * BUSINESS LOGIC:
 * - FC creation costs: $500k base + automation investment (Medium $1M, High $2M additional)
 * - Tax nexus: Creating FC in new state adds sales tax obligation (5-10% of GMV in that state)
 * - Capacity: Min 100 packages/day (small FC), typical 5,000/day, max 50,000/day (mega FC)
 * - Automation efficiency: Low 1.0x, Medium 1.5x, High 2.5x base capacity multiplier
 * - Operating costs: $0.50/package processed (automation reduces unit cost)
 * - Location strategy: Near population centers minimizes shipping time/cost
 * 
 * IMPLEMENTATION NOTES:
 * - Financial validation: Company must have sufficient cash for FC creation cost
 * - Tax nexus tracking: Deduplicates states to avoid double-taxing
 * - Network metrics: Aggregates capacity, utilization, efficiency across all FCs
 * - Pagination: 50 FCs/page (most companies have 3-10 FCs, large platforms 20-30)
 * - Filters: State (tax planning), automation level (performance), utilization range (bottlenecks)
 * - Performance targets: On-time delivery > 95%, accuracy > 99%, processing time < 24h
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import FulfillmentCenter from '@/lib/db/models/FulfillmentCenter';
import Marketplace from '@/lib/db/models/Marketplace';
import Company from '@/lib/db/models/Company';
import { FulfillmentCenterCreateSchema } from '@/lib/validations/ecommerce';
import { Types } from 'mongoose';

/**
 * POST /api/ecommerce/fulfillment-centers
 * 
 * Create new fulfillment center with financial validation and tax nexus registration
 * 
 * Request Body:
 * {
 *   marketplace: string;          // Marketplace ID
 *   name: string;                  // FC name (e.g., "Seattle FC-1")
 *   location: string;              // City, State, Country (e.g., "Seattle, WA, USA")
 *   type: 'Regional' | 'Metro' | 'Sortation';
 *   totalCapacity: number;         // Max square feet for inventory
 *   automationLevel: number;       // 0-100 (0=Low, 50=Medium, 100=High automation)
 *   robotCount: number;            // Number of robots deployed
 *   throughputPerHour: number;     // Packages/hour processing capacity
 * }
 * 
 * Response:
 * {
 *   fc: IFulfillmentCenter;
 *   taxNexusAdded: boolean;        // true if new state (triggers sales tax collection)
 *   automationCost: number;        // Total investment cost
 *   operatingCostPerMonth: number; // Monthly fixed cost
 * }
 * 
 * Business Logic:
 * 1. Validate marketplace exists and user owns it
 * 2. Calculate FC creation cost:
 *    - Base cost: $500,000 (land, building, basic equipment)
 *    - Automation costs: $0 (Low 0-33%), $1M (Medium 34-66%), $2M (High 67-100%)
 * 3. Validate company has sufficient cash
 * 4. Deduct creation cost from company cash
 * 5. Check if state is new (tax nexus registration)
 * 6. Create FC document with calculated metrics
 * 7. Return FC with cost breakdown
 * 
 * Error Cases:
 * - 401: Not authenticated
 * - 400: Invalid request data
 * - 404: Marketplace not found
 * - 403: User doesn't own marketplace
 * - 402: Insufficient funds for FC creation
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
    const validation = FulfillmentCenterCreateSchema.safeParse(body);
    
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

    // Calculate FC creation cost
    const baseCost = 500000; // $500k base (land, building, basic equipment)
    let automationCost = 0;
    
    // Automation investment: Low (0-33%): $0, Medium (34-66%): $1M, High (67-100%): $2M
    if (data.automationLevel >= 67) {
      automationCost = 2000000; // High automation: $2M
    } else if (data.automationLevel >= 34) {
      automationCost = 1000000; // Medium automation: $1M
    }
    // Low automation (0-33%): $0 additional

    const totalCost = baseCost + automationCost;

    // Validate company has sufficient cash
    if (company.cash < totalCost) {
      return NextResponse.json(
        {
          error: 'Insufficient funds',
          required: totalCost,
          available: company.cash,
          shortfall: totalCost - company.cash,
        },
        { status: 402 }
      );
    }

    // Deduct creation cost
    company.cash -= totalCost;

    // Extract state from location (e.g., "Seattle, WA, USA" → "WA")
    const locationParts = data.location.split(',').map(s => s.trim());
    const state = locationParts.length >= 2 ? locationParts[1] : '';

    // Check if state is new (tax nexus registration)
    const existingFCsInState = await FulfillmentCenter.countDocuments({
      marketplace: data.marketplace,
      location: { $regex: new RegExp(state, 'i') },
    });

    const taxNexusAdded = existingFCsInState === 0 && state.length > 0;

    // Calculate operating cost based on capacity and automation
    // Base: $0.50/package processed, automation reduces unit cost
    // Monthly estimate: throughputPerHour × 8h/day × 30 days × $0.50 × (1 - automation%)
    const automationEfficiency = data.automationLevel / 100;
    const monthlyPackages = data.throughputPerHour * 8 * 30; // Assumes 8h shifts, 30 days
    const costPerPackage = 0.50 * (1 - automationEfficiency * 0.5); // Max 50% cost reduction
    const operatingCostPerMonth = monthlyPackages * costPerPackage;

    // Create FC document
    const fc = await FulfillmentCenter.create({
      marketplace: new Types.ObjectId(data.marketplace),
      name: data.name,
      location: data.location,
      type: data.type,
      active: true,
      totalCapacity: data.totalCapacity,
      usedCapacity: 0,
      automationLevel: data.automationLevel,
      robotCount: data.robotCount,
      throughputPerHour: data.throughputPerHour,
      pickingAccuracy: data.pickingAccuracy || 99.5,
      averageProcessingTime: data.averageProcessingTime || 12,
      onTimeShipmentRate: data.onTimeShipmentRate || 96,
      damageRate: data.damageRate || 0.3,
      operatingCost: Math.round(operatingCostPerMonth),
    });

    // Save company (cash deduction)
    await company.save();

    return NextResponse.json({
      fc,
      taxNexusAdded,
      automationCost: totalCost,
      operatingCostPerMonth: Math.round(operatingCostPerMonth),
      message: taxNexusAdded
        ? `FC created. Sales tax collection now required in ${state}.`
        : 'FC created successfully.',
    });
  } catch (error) {
    console.error('Error creating fulfillment center:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ecommerce/fulfillment-centers
 * 
 * List all fulfillment centers with filters and network metrics
 * 
 * Query Parameters:
 * - marketplace: string (filter by marketplace ID)
 * - page: number (default 1)
 * - limit: number (default 50, max 100)
 * - state: string (filter by state for tax planning)
 * - type: 'Regional' | 'Metro' | 'Sortation' (filter by FC type)
 * - automationMin: number (min automation level 0-100)
 * - automationMax: number (max automation level 0-100)
 * - utilizationMin: number (min utilization % 0-100)
 * - utilizationMax: number (max utilization % 0-100)
 * 
 * Response:
 * {
 *   fcs: IFulfillmentCenter[];
 *   total: number;
 *   page: number;
 *   limit: number;
 *   totalPages: number;
 *   networkMetrics: {
 *     totalCapacity: number;          // Total sqft across all FCs
 *     networkUtilization: number;     // Avg utilization %
 *     averageAutomation: number;      // Avg automation level
 *     totalThroughput: number;        // Total packages/hour
 *     averageOnTimeRate: number;      // Avg on-time delivery %
 *     averageAccuracy: number;        // Avg picking accuracy %
 *     uniqueStates: number;           // Tax nexus count
 *   }
 * }
 * 
 * Business Logic:
 * 1. Validate marketplace exists and user owns it
 * 2. Build filter query (state, type, automation range, utilization range)
 * 3. Calculate pagination (skip, limit)
 * 4. Aggregate network metrics:
 *    - Total capacity: Sum of all FC capacities
 *    - Network utilization: Weighted average (usedCapacity / totalCapacity)
 *    - Average automation: Mean automation level
 *    - Total throughput: Sum of all FC throughputs
 *    - Performance metrics: Averages (on-time %, accuracy %)
 *    - Unique states: Count distinct states (tax nexus)
 * 5. Return paginated results with aggregated metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const marketplaceId = searchParams.get('marketplace');
    
    if (!marketplaceId) {
      return NextResponse.json({ error: 'Marketplace ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Verify marketplace exists and user owns it
    const marketplace = await Marketplace.findById(marketplaceId).populate('company');
    if (!marketplace) {
      return NextResponse.json({ error: 'Marketplace not found' }, { status: 404 });
    }

    const company = await Company.findById(marketplace.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this marketplace' }, { status: 403 });
    }

    // Build filter query
    const filter: any = { marketplace: new Types.ObjectId(marketplaceId) };

    const state = searchParams.get('state');
    if (state) {
      filter.location = { $regex: new RegExp(state, 'i') };
    }

    const type = searchParams.get('type');
    if (type && ['Regional', 'Metro', 'Sortation'].includes(type)) {
      filter.type = type;
    }

    const automationMin = searchParams.get('automationMin');
    const automationMax = searchParams.get('automationMax');
    if (automationMin !== null || automationMax !== null) {
      filter.automationLevel = {};
      if (automationMin) filter.automationLevel.$gte = Number(automationMin);
      if (automationMax) filter.automationLevel.$lte = Number(automationMax);
    }

    // Utilization filter (calculated as usedCapacity / totalCapacity)
    const utilizationMin = searchParams.get('utilizationMin');
    const utilizationMax = searchParams.get('utilizationMax');

    // Pagination
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50));
    const skip = (page - 1) * limit;

    // Execute queries
    let query = FulfillmentCenter.find(filter);

    // Apply utilization filter manually (requires calculation)
    if (utilizationMin !== null || utilizationMax !== null) {
      const allFCs = await FulfillmentCenter.find(filter);
      const filteredFCs = allFCs.filter(fc => {
        const utilization = fc.totalCapacity > 0 ? (fc.usedCapacity / fc.totalCapacity) * 100 : 0;
        if (utilizationMin && utilization < Number(utilizationMin)) return false;
        if (utilizationMax && utilization > Number(utilizationMax)) return false;
        return true;
      });

      const filteredIds = filteredFCs.map(fc => fc._id);
      query = FulfillmentCenter.find({ _id: { $in: filteredIds } });
    }

    const [fcs, total] = await Promise.all([
      query.skip(skip).limit(limit).sort({ createdAt: -1 }),
      FulfillmentCenter.countDocuments(filter),
    ]);

    // Calculate network metrics
    const allFCs = await FulfillmentCenter.find({ marketplace: new Types.ObjectId(marketplaceId) });

    const networkMetrics = {
      totalCapacity: allFCs.reduce((sum, fc) => sum + fc.totalCapacity, 0),
      networkUtilization:
        allFCs.length > 0
          ? (allFCs.reduce((sum, fc) => sum + (fc.usedCapacity / fc.totalCapacity) * 100, 0) / allFCs.length)
          : 0,
      averageAutomation:
        allFCs.length > 0
          ? allFCs.reduce((sum, fc) => sum + fc.automationLevel, 0) / allFCs.length
          : 0,
      totalThroughput: allFCs.reduce((sum, fc) => sum + fc.throughputPerHour, 0),
      averageOnTimeRate:
        allFCs.length > 0
          ? allFCs.reduce((sum, fc) => sum + fc.onTimeShipmentRate, 0) / allFCs.length
          : 0,
      averageAccuracy:
        allFCs.length > 0
          ? allFCs.reduce((sum, fc) => sum + fc.pickingAccuracy, 0) / allFCs.length
          : 0,
      uniqueStates: new Set(
        allFCs.map(fc => {
          const parts = fc.location.split(',').map(s => s.trim());
          return parts.length >= 2 ? parts[1] : '';
        }).filter(s => s.length > 0)
      ).size,
    };

    return NextResponse.json({
      fcs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      networkMetrics: {
        ...networkMetrics,
        networkUtilization: Math.round(networkMetrics.networkUtilization * 100) / 100,
        averageAutomation: Math.round(networkMetrics.averageAutomation * 100) / 100,
        averageOnTimeRate: Math.round(networkMetrics.averageOnTimeRate * 100) / 100,
        averageAccuracy: Math.round(networkMetrics.averageAccuracy * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Error fetching fulfillment centers:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
