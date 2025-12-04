/**
 * @fileoverview Solar Farm Maintenance Action API
 * @module api/energy/solar-farms/[id]/maintain
 * 
 * OVERVIEW:
 * Performs maintenance operations for solar farms including panel cleaning,
 * inverter servicing, and battery conditioning. Improves system efficiency
 * and extends equipment lifespan.
 * 
 * ENDPOINTS:
 * POST /api/energy/solar-farms/[id]/maintain - Execute maintenance operation
 * 
 * BUSINESS LOGIC:
 * - Panel cleaning restores 5-10% efficiency loss from dust/dirt
 * - Inverter servicing maintains 96%+ efficiency rating
 * - Battery conditioning prevents degradation progression
 * - Maintenance cost: $2,500 base + $1 per panel + $5,000 per battery
 * - Maintenance recommended every 60 days for optimal performance
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1 - Phase 3.1 Energy Action Endpoints
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db';
import { SolarFarm } from '@/lib/db/models';

/** Route parameter types for Next.js 15+ */
interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/energy/solar-farms/[id]/maintain
 * 
 * Execute maintenance operation for solar farm
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing farm ID
 * @returns Maintenance results with cost and efficiency improvements
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    // 2. Connect to database
    await connectDB();

    // 3. Fetch and validate farm
    const { id } = await params;
    const farm = await SolarFarm.findById(id);
    
    if (!farm) {
      return createErrorResponse('Solar farm not found', ErrorCode.NOT_FOUND, 404);
    }

    // 4. Verify ownership
    if (farm.company.toString() !== session.user.companyId) {
      return createErrorResponse('Unauthorized access to farm', ErrorCode.FORBIDDEN, 403);
    }

    // 5. Validate operational status
    if (farm.status === 'Decommissioned') {
      return createErrorResponse('Cannot maintain decommissioned farm', ErrorCode.BAD_REQUEST, 400);
    }

    // 6. Calculate maintenance costs
    const baseCost = 2500;
    const panelCleaningCost = farm.panelCount * 1; // $1 per panel
    const batteryCost = farm.batteryStorage ? 5000 : 0;
    const totalCost = baseCost + panelCleaningCost + batteryCost;

    // 7. Record efficiency improvements
    const previousSystemEfficiency = farm.systemEfficiency;
    const previousInverterEfficiency = farm.inverterEfficiency;
    
    // Panel cleaning restores 5-10% efficiency (capped at design limit)
    const systemEfficiencyBoost = Math.min(5, 95 - farm.systemEfficiency);
    farm.systemEfficiency = Math.min(95, farm.systemEfficiency + systemEfficiencyBoost);
    
    // Inverter servicing maintains 96%+ efficiency
    farm.inverterEfficiency = Math.min(98, Math.max(96, farm.inverterEfficiency + 2));

    // 8. Update battery if present
    let batteryImprovement = null;
    if (farm.batteryStorage) {
      const previousDegradation = farm.batteryStorage.degradation;
      
      // Battery conditioning slows degradation
      farm.batteryStorage.degradation = Math.max(0, farm.batteryStorage.degradation - 1);
      farm.batteryStorage.efficiency = Math.min(95, farm.batteryStorage.efficiency + 2);
      farm.batteryStorage.lastMaintenance = new Date();
      
      batteryImprovement = {
        degradationReduction: previousDegradation - farm.batteryStorage.degradation,
        newEfficiency: farm.batteryStorage.efficiency,
      };
    }

    // 9. Update maintenance timestamp and status
    const maintenanceDate = new Date();
    farm.lastMaintenance = maintenanceDate;
    
    // Return farm to Operational if in Maintenance
    if (farm.status === 'Maintenance') {
      farm.status = 'Operational';
    }

    await farm.save();

    // 10. Calculate next maintenance date (60 days from now)
    const nextMaintenanceDate = new Date(maintenanceDate);
    nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + 60);

    // 11. Return maintenance results
    return createSuccessResponse({
      success: true,
      message: 'Maintenance completed successfully',
      cost: totalCost,
      improvements: {
        systemEfficiency: {
          previous: Math.round(previousSystemEfficiency * 10) / 10,
          current: Math.round(farm.systemEfficiency * 10) / 10,
          improvement: Math.round(systemEfficiencyBoost * 10) / 10,
        },
        inverterEfficiency: {
          previous: Math.round(previousInverterEfficiency * 10) / 10,
          current: Math.round(farm.inverterEfficiency * 10) / 10,
        },
        battery: batteryImprovement,
      },
      details: {
        baseCost,
        panelCleaningCost,
        batteryCost,
        panelsServiced: farm.panelCount,
        lastMaintenance: maintenanceDate.toISOString(),
        nextMaintenance: nextMaintenanceDate.toISOString(),
        daysUntilNext: 60,
      },
      farm: {
        id: farm._id,
        name: farm.name,
        status: farm.status,
        systemEfficiency: farm.systemEfficiency,
        inverterEfficiency: farm.inverterEfficiency,
      },
    });

  } catch (error) {
    // Generic error handling
    console.error('POST /api/energy/solar-farms/[id]/maintain error:', error);
    return createErrorResponse('Failed to process maintenance operation', ErrorCode.INTERNAL_ERROR, 500);
  }
}
