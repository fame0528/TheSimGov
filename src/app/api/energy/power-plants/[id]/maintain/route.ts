/**
 * @file POST /api/energy/power-plants/[id]/maintain
 * @description Perform maintenance on power plant - scheduled outages, component replacement
 * @timestamp 2025-11-28
 * @author ECHO v1.3.1
 * 
 * OVERVIEW:
 * Handles power plant maintenance operations including planned outages, forced outages,
 * component replacement, and condition monitoring. Tracks outage duration and economics.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB as dbConnect } from '@/lib/db';
import { PowerPlant } from '@/lib/db/models';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const MaintainPowerPlantSchema = z.object({
  maintenanceType: z.enum(['PLANNED_OUTAGE', 'FORCED_OUTAGE', 'REFUELING', 'TURBINE_OVERHAUL', 'BOILER_INSPECTION']),
  durationHours: z.number().min(1).max(8760).describe('Maintenance duration in hours'),
  cost: z.number().min(0).optional().describe('Maintenance cost override'),
  notes: z.string().optional().describe('Maintenance notes')
});

type MaintainPowerPlantInput = z.infer<typeof MaintainPowerPlantSchema>;

// ============================================================================
// CONSTANTS
// ============================================================================

const MAINTENANCE_COSTS = {
  PLANNED_OUTAGE: 500000,      // $500K for planned maintenance
  FORCED_OUTAGE: 2000000,      // $2M for emergency repairs (higher cost)
  REFUELING: 50000000,         // $50M for nuclear refueling (18-24 months)
  TURBINE_OVERHAUL: 10000000,  // $10M for turbine overhaul
  BOILER_INSPECTION: 1000000   // $1M for boiler inspection
} as const;

const TYPICAL_DURATIONS = {
  PLANNED_OUTAGE: 720,       // 30 days
  FORCED_OUTAGE: 168,        // 7 days
  REFUELING: 1440,           // 60 days (nuclear)
  TURBINE_OVERHAUL: 2160,    // 90 days
  BOILER_INSPECTION: 168     // 7 days
} as const;

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // Authentication
    const session = await auth();
    if (!session?.user?.companyId) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    // Parse request body
    const body = await req.json();
    const validation = MaintainPowerPlantSchema.safeParse(body);
    
    if (!validation.success) {
      return createErrorResponse('Invalid input', ErrorCode.BAD_REQUEST, 400);
    }

    const { maintenanceType, durationHours, cost: costOverride, notes } = validation.data;

    // Database connection
    await dbConnect();

    // Find power plant
    const plant = await PowerPlant.findOne({
      _id: id,
      company: session.user.companyId
    });

    if (!plant) {
      return createErrorResponse('Power plant not found or access denied', ErrorCode.NOT_FOUND, 404);
    }

    // Calculate maintenance cost
    const baseCost = MAINTENANCE_COSTS[maintenanceType];
    const finalCost = costOverride || baseCost;

    // Calculate opportunity cost (lost revenue from not generating)
    const plantCapacity = plant.nameplateCapacity || 100; // MW
    const avgPrice = 50; // $/MWh (wholesale power price)
    const opportunityCost = plantCapacity * durationHours * avgPrice;
    const totalCost = finalCost + opportunityCost;

    // Update plant status
    const wasOperating = false; // model does not expose operating flag
    // Shutdown simulation: set currentOutput to 0 and update lastMaintenance
    plant.currentOutput = 0;
    plant.lastMaintenance = new Date();

    // Calculate outage end time
    const outageStart = new Date();
    const outageEnd = new Date(outageStart.getTime() + durationHours * 60 * 60 * 1000);

    // Add maintenance record
    const maintenanceRecord = {
      date: outageStart,
      type: maintenanceType,
      cost: finalCost,
      durationHours,
      outageStart,
      outageEnd,
      notes: notes || `${maintenanceType} maintenance scheduled`,
      wasOperating
    };

    // Save plant
    await plant.save();

    // Log maintenance
    console.log(`[ENERGY] Power plant maintenance: ${plant.name} (${plant._id}), Type: ${maintenanceType}, Duration: ${durationHours}h, Total Cost: $${totalCost.toLocaleString()}`);

    return createSuccessResponse({
      success: true,
      plant: {
        id: plant._id,
        name: plant.name,
        plantType: plant.plantType,
        capacity: plantCapacity,
        currentOutput: 0,
        lastMaintenanceDate: plant.lastMaintenance
      },
      maintenance: {
        type: maintenanceType,
        durationHours,
        durationDays: (durationHours / 24).toFixed(1),
        outageStart: outageStart.toISOString(),
        outageEnd: outageEnd.toISOString(),
        timestamp: outageStart.toISOString(),
        notes: maintenanceRecord.notes
      },
      economics: {
        maintenanceCost: finalCost,
        opportunityCost,
        totalCost,
        costPerHour: (finalCost / durationHours).toFixed(2),
        lostGeneration: (plantCapacity * durationHours).toFixed(0) + ' MWh',
        lostRevenue: opportunityCost.toFixed(0)
      },
      schedule: {
        currentTime: outageStart.toISOString(),
        expectedCompletion: outageEnd.toISOString(),
        hoursRemaining: durationHours,
        daysRemaining: (durationHours / 24).toFixed(1)
      }
    });

  } catch (error) {
    console.error('[ENERGY] Power plant maintenance error:', error);
    return createErrorResponse('Failed to maintain power plant', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Maintenance Types:
 *    - PLANNED_OUTAGE: Scheduled annual/semi-annual maintenance
 *    - FORCED_OUTAGE: Unplanned failures requiring immediate repair
 *    - REFUELING: Nuclear plant refueling (18-24 month cycle)
 *    - TURBINE_OVERHAUL: Major turbine component replacement
 *    - BOILER_INSPECTION: Regulatory-required boiler inspections
 * 
 * 2. Outage Economics:
 *    - Direct maintenance costs (labor, parts, contractors)
 *    - Opportunity cost (lost revenue from not generating)
 *    - Total cost = Direct + Opportunity (critical for planning)
 *    - Shorter outages preferred (minimize opportunity cost)
 * 
 * 3. Outage Duration:
 *    - Planned: 30 days typical (optimize maintenance window)
 *    - Forced: 7 days typical (emergency repairs priority)
 *    - Refueling: 60 days (nuclear complexity)
 *    - Turbine: 90 days (major overhaul)
 * 
 * 4. Outage Scheduling:
 *    - Start and end times tracked
 *    - Remaining hours/days calculated
 *    - Grid operator notification required
 *    - Coordinate with other plants to maintain reliability
 * 
 * 5. Future Enhancements:
 *    - Predictive maintenance (AI-driven failure prediction)
 *    - Component-level maintenance tracking
 *    - Contractor and labor cost breakdown
 *    - Outage planning optimization (minimize grid impact)
 */
