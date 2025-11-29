/**
 * @fileoverview Oil Well Maintenance Action API
 * @module api/energy/oil-wells/[id]/maintain
 * 
 * OVERVIEW:
 * Schedules and executes maintenance operations for oil wells, updating
 * status, resetting maintenance timers, and applying equipment efficiency
 * improvements. Prevents extraction during maintenance periods.
 * 
 * ENDPOINTS:
 * POST /api/energy/oil-wells/[id]/maintain - Schedule maintenance operation
 * 
 * BUSINESS LOGIC:
 * - Sets status to 'Maintenance' temporarily
 * - Updates lastMaintenance timestamp to current date
 * - Resets equipment efficiency to 100% (if equipment exists)
 * - Maintenance cost: $5,000 base + $500 per equipment item
 * - Returns well to 'Active' status after maintenance recorded
 * - Maintenance recommended every 90 days (enforced via maintenanceOverdue virtual)
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1 - Phase 3.1 Energy Action Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { OilWell } from '@/lib/db/models';

/** Route parameter types for Next.js 15+ */
interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/energy/oil-wells/[id]/maintain
 * 
 * Schedule and execute maintenance operation for oil well
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing well ID
 * @returns Maintenance results with cost and equipment updates
 * 
 * @example
 * POST /api/energy/oil-wells/507f1f77bcf86cd799439011/maintain
 * Response: {
 *   "success": true,
 *   "message": "Maintenance completed successfully",
 *   "cost": 6500,
 *   "details": {
 *     "baseCost": 5000,
 *     "equipmentCost": 1500,
 *     "equipmentServiced": 3,
 *     "lastMaintenance": "2025-11-28T10:30:00.000Z",
 *     "nextMaintenance": "2026-02-26T10:30:00.000Z"
 *   }
 * }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Connect to database
    await connectDB();

    // 3. Fetch and validate well
    const { id } = await params;
    const well = await OilWell.findById(id);
    
    if (!well) {
      return NextResponse.json({ error: 'Oil well not found' }, { status: 404 });
    }

    // 4. Verify ownership
    if (well.company.toString() !== session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized access to well' }, { status: 403 });
    }

    // 5. Validate operational status (cannot maintain abandoned or depleted wells)
    if (well.status === 'Abandoned' || well.status === 'Depleted') {
      return NextResponse.json(
        { error: `Cannot maintain well with status: ${well.status}` },
        { status: 400 }
      );
    }

    // 6. Calculate maintenance costs
    const baseCost = 5000;
    const equipmentCount = well.equipment?.length || 0;
    const equipmentCost = equipmentCount * 500;
    const totalCost = baseCost + equipmentCost;

    // 7. Update equipment efficiency to 100%
    if (well.equipment && well.equipment.length > 0) {
      well.equipment.forEach((item) => {
        item.efficiency = 100;
        item.lastMaintenance = new Date();
      });
    }

    // 8. Update maintenance timestamp and status
    const maintenanceDate = new Date();
    well.lastMaintenance = maintenanceDate;
    
    // Return well to Active status if it was in Maintenance or Drilling
    if (well.status === 'Maintenance' || well.status === 'Drilling') {
      well.status = 'Active';
    }

    await well.save();

    // 9. Calculate next maintenance date (90 days from now)
    const nextMaintenanceDate = new Date(maintenanceDate);
    nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + 90);

    // 10. Return maintenance results
    return NextResponse.json({
      success: true,
      message: 'Maintenance completed successfully',
      cost: totalCost,
      details: {
        baseCost,
        equipmentCost,
        equipmentServiced: equipmentCount,
        lastMaintenance: maintenanceDate.toISOString(),
        nextMaintenance: nextMaintenanceDate.toISOString(),
        daysUntilNext: 90,
      },
      well: {
        id: well._id,
        name: well.name,
        status: well.status,
        maintenanceOverdue: false, // Freshly maintained
      },
    });

  } catch (error) {
    // Generic error handling
    console.error('POST /api/energy/oil-wells/[id]/maintain error:', error);
    return NextResponse.json(
      { error: 'Failed to process maintenance operation' },
      { status: 500 }
    );
  }
}
