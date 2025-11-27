/**
 * @file app/api/ecommerce/fulfillment-centers/[id]/route.ts
 * @description Individual fulfillment center operations (details, updates)
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles individual FC operations: retrieve details with performance metrics, update capacity/automation,
 * toggle active status. Provides real-time performance analytics (on-time delivery, picking accuracy,
 * processing time), inventory summary (units stored, capacity utilization), 30-day throughput trends,
 * and optimization recommendations (upgrade automation, expand capacity).
 * 
 * ENDPOINTS:
 * - GET /api/ecommerce/fulfillment-centers/:id - FC details with analytics
 * - PATCH /api/ecommerce/fulfillment-centers/:id - Update capacity, automation, or active status
 * 
 * BUSINESS LOGIC:
 * - Performance targets: On-time delivery > 95%, picking accuracy > 99%, processing time < 24h
 * - Capacity upgrades: Cost $100/sqft additional capacity
 * - Automation upgrades: Low → Medium ($1M), Medium → High ($1M), cumulative costs
 * - Efficiency gains: Low 1.0x, Medium 1.5x, High 2.5x base capacity multiplier
 * - Active status: Inactive FCs don't receive new orders but retain existing inventory
 * - Recommendations: Auto-generated based on utilization (> 80% = expand), performance (< 95% on-time = automate)
 * 
 * IMPLEMENTATION NOTES:
 * - Throughput trend: Last 30 days of package volume (detect seasonality, growth)
 * - Inventory summary: Top 5 product categories stored (for visibility)
 * - Cost delta: Calculates upgrade cost and efficiency gain for transparency
 * - Validation: Min capacity 100/day, max 50,000/day, automation 0-100%
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import FulfillmentCenter from '@/lib/db/models/FulfillmentCenter';
import Company from '@/lib/db/models/Company';
import Product from '@/lib/db/models/Product';
import { FulfillmentCenterUpdateSchema } from '@/lib/validations/ecommerce';
import { Types } from 'mongoose';

/**
 * GET /api/ecommerce/fulfillment-centers/:id
 * 
 * Retrieve FC details with performance metrics, inventory summary, and recommendations
 * 
 * Response:
 * {
 *   fc: IFulfillmentCenter;
 *   performanceMetrics: {
 *     onTimeDelivery: number;         // % (target > 95%)
 *     accuracyRate: number;           // % (target > 99%)
 *     avgProcessingTime: number;      // Hours (target < 24h)
 *     throughputLast30d: number;      // Packages shipped (30 days)
 *     utilizationPercent: number;     // usedCapacity / totalCapacity %
 *   };
 *   inventorySummary: {
 *     unitsStored: number;            // Total units in FC
 *     capacityUsedPercent: number;    // Utilization %
 *     topCategories: { category: string; units: number }[]; // Top 5
 *   };
 *   recommendations: string[];        // Optimization suggestions
 * }
 * 
 * Business Logic:
 * 1. Verify FC exists and user owns marketplace
 * 2. Calculate performance metrics (on-time %, accuracy %, processing time)
 * 3. Aggregate inventory summary (units stored, top categories)
 * 4. Generate recommendations:
 *    - Utilization > 80%: "Expand capacity (+5,000 sqft recommended)"
 *    - On-time < 95%: "Upgrade automation to improve delivery performance"
 *    - Accuracy < 99%: "Consider robotics investment for higher accuracy"
 *    - Automation < 50%: "Automate to Medium level for 50% efficiency gain"
 * 5. Return comprehensive analytics
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

    // Fetch FC with marketplace population
    const fc = await FulfillmentCenter.findById(params.id).populate({
      path: 'marketplace',
      populate: { path: 'company' },
    });

    if (!fc) {
      return NextResponse.json({ error: 'Fulfillment center not found' }, { status: 404 });
    }

    // Verify user owns marketplace
    const marketplace = fc.marketplace as any;
    const company = await Company.findById(marketplace.company);

    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this FC' }, { status: 403 });
    }

    // Calculate performance metrics
    const utilizationPercent = fc.totalCapacity > 0 ? (fc.usedCapacity / fc.totalCapacity) * 100 : 0;

    const performanceMetrics = {
      onTimeDelivery: fc.onTimeShipmentRate,
      accuracyRate: fc.pickingAccuracy,
      avgProcessingTime: fc.averageProcessingTime,
      throughputLast30d: fc.throughputPerHour * 8 * 30, // Estimate: 8h/day × 30 days
      utilizationPercent: Math.round(utilizationPercent * 100) / 100,
    };

    // Aggregate inventory summary (top categories)
    // Note: In production, this would query actual Product inventory linked to this FC
    // For now, we'll provide a placeholder structure
    const inventoryQuery = await Product.aggregate([
      {
        $match: {
          marketplace: new Types.ObjectId(marketplace._id.toString()),
          // In production: fulfillmentCenter: fc._id (requires Product schema update)
        },
      },
      {
        $group: {
          _id: '$category',
          units: { $sum: '$inventory' },
        },
      },
      {
        $sort: { units: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    const topCategories = inventoryQuery.map(item => ({
      category: item._id,
      units: item.units,
    }));

    const totalUnits = inventoryQuery.reduce((sum, item) => sum + item.units, 0);

    const inventorySummary = {
      unitsStored: totalUnits,
      capacityUsedPercent: Math.round(utilizationPercent * 100) / 100,
      topCategories,
    };

    // Generate recommendations
    const recommendations: string[] = [];

    if (utilizationPercent > 80) {
      recommendations.push(`Utilization at ${utilizationPercent.toFixed(1)}%. Consider expanding capacity by 5,000 sqft ($500k investment).`);
    }

    if (fc.onTimeShipmentRate < 95) {
      recommendations.push(`On-time delivery at ${fc.onTimeShipmentRate}% (target > 95%). Upgrade automation to improve performance.`);
    }

    if (fc.pickingAccuracy < 99) {
      recommendations.push(`Picking accuracy at ${fc.pickingAccuracy}% (target > 99%). Consider robotics investment for higher accuracy.`);
    }

    if (fc.automationLevel < 34) {
      recommendations.push('Automation level is Low. Upgrade to Medium automation for 50% efficiency gain ($1M investment).');
    } else if (fc.automationLevel < 67) {
      recommendations.push('Automation level is Medium. Upgrade to High automation for 150% total efficiency gain ($2M total investment).');
    }

    if (fc.averageProcessingTime > 24) {
      recommendations.push(`Processing time is ${fc.averageProcessingTime}h (target < 24h). Increase throughput or reduce bottlenecks.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('FC is operating optimally. Continue monitoring performance metrics.');
    }

    return NextResponse.json({
      fc,
      performanceMetrics,
      inventorySummary,
      recommendations,
    });
  } catch (error) {
    console.error('Error fetching fulfillment center details:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ecommerce/fulfillment-centers/:id
 * 
 * Update FC capacity, automation level, or active status
 * 
 * Request Body:
 * {
 *   totalCapacity?: number;       // New capacity (sqft)
 *   automationLevel?: number;     // New automation level (0-100)
 *   active?: boolean;             // Enable/disable FC
 * }
 * 
 * Response:
 * {
 *   fc: IFulfillmentCenter;
 *   costDelta: number;            // Upgrade cost (negative = downgrade refund)
 *   efficiencyGain: number;       // % efficiency increase
 *   message: string;
 * }
 * 
 * Business Logic:
 * 1. Validate FC exists and user owns marketplace
 * 2. Calculate upgrade costs:
 *    - Capacity: $100/sqft additional capacity
 *    - Automation: Low → Medium $1M, Medium → High $1M (cumulative)
 * 3. Validate company has sufficient cash for upgrades
 * 4. Deduct upgrade cost from company cash
 * 5. Update FC document
 * 6. Calculate efficiency gain (automation multiplier change)
 * 7. Return updated FC with cost breakdown
 * 
 * Validation:
 * - Capacity: Min 10,000 sqft, max 10,000,000 sqft
 * - Automation: 0-100 (0-33 = Low, 34-66 = Medium, 67-100 = High)
 * - Active: true/false (inactive FCs don't receive new orders)
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
    const validation = FulfillmentCenterUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const updates = validation.data;
    await dbConnect();

    // Fetch FC with marketplace population
    const fc = await FulfillmentCenter.findById(params.id).populate({
      path: 'marketplace',
      populate: { path: 'company' },
    });

    if (!fc) {
      return NextResponse.json({ error: 'Fulfillment center not found' }, { status: 404 });
    }

    // Verify user owns marketplace
    const marketplace = fc.marketplace as any;
    const company = await Company.findById(marketplace.company);

    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this FC' }, { status: 403 });
    }

    let costDelta = 0;
    let efficiencyGain = 0;

    // Calculate capacity upgrade cost
    if (updates.totalCapacity !== undefined && updates.totalCapacity !== fc.totalCapacity) {
      const capacityDelta = updates.totalCapacity - fc.totalCapacity;
      const costPerSqft = 100; // $100/sqft
      costDelta += capacityDelta * costPerSqft;
    }

    // Calculate automation upgrade cost
    if (updates.automationLevel !== undefined && updates.automationLevel !== fc.automationLevel) {
      const oldLevel = fc.automationLevel;
      const newLevel = updates.automationLevel;

      // Determine old automation tier
      let oldTier: 'Low' | 'Medium' | 'High';
      if (oldLevel >= 67) oldTier = 'High';
      else if (oldLevel >= 34) oldTier = 'Medium';
      else oldTier = 'Low';

      // Determine new automation tier
      let newTier: 'Low' | 'Medium' | 'High';
      if (newLevel >= 67) newTier = 'High';
      else if (newLevel >= 34) newTier = 'Medium';
      else newTier = 'Low';

      // Calculate upgrade cost
      if (oldTier === 'Low' && newTier === 'Medium') {
        costDelta += 1000000; // $1M
        efficiencyGain = 50; // 50% gain
      } else if (oldTier === 'Low' && newTier === 'High') {
        costDelta += 2000000; // $2M total
        efficiencyGain = 150; // 150% gain
      } else if (oldTier === 'Medium' && newTier === 'High') {
        costDelta += 1000000; // $1M additional
        efficiencyGain = 66; // 66% gain (from 1.5x to 2.5x)
      } else if (oldTier === 'Medium' && newTier === 'Low') {
        costDelta -= 500000; // Partial refund (downgrade)
        efficiencyGain = -33; // 33% loss
      } else if (oldTier === 'High' && newTier === 'Medium') {
        costDelta -= 500000; // Partial refund
        efficiencyGain = -40; // 40% loss
      } else if (oldTier === 'High' && newTier === 'Low') {
        costDelta -= 1000000; // Larger refund
        efficiencyGain = -60; // 60% loss
      }
    }

    // Validate company has sufficient cash for upgrades
    if (costDelta > 0 && company.cash < costDelta) {
      return NextResponse.json(
        {
          error: 'Insufficient funds',
          required: costDelta,
          available: company.cash,
          shortfall: costDelta - company.cash,
        },
        { status: 402 }
      );
    }

    // Deduct/add cost delta
    company.cash -= costDelta;
    await company.save();

    // Update FC document
    Object.assign(fc, updates);
    await fc.save();

    return NextResponse.json({
      fc,
      costDelta,
      efficiencyGain,
      message:
        costDelta > 0
          ? `FC upgraded successfully. Investment: $${costDelta.toLocaleString()}.`
          : costDelta < 0
          ? `FC downgraded. Refund: $${Math.abs(costDelta).toLocaleString()}.`
          : 'FC updated successfully (no cost change).',
    });
  } catch (error) {
    console.error('Error updating fulfillment center:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
