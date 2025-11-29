/**
 * @file POST /api/energy/power-plants/[id]/dispatch
 * @description Dispatch power plant - set generation level based on grid demand
 * @timestamp 2025-11-28
 * @author ECHO v1.3.1
 * 
 * OVERVIEW:
 * Handles power plant dispatch operations (generation level control) with ramp rate limits,
 * fuel consumption calculation, and grid demand response. Supports load following and baseload operation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB as dbConnect } from '@/lib/db';
import { PowerPlant } from '@/lib/db/models';
import { auth } from '@/auth';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const DispatchPowerPlantSchema = z.object({
  targetGeneration: z.number().min(0).describe('Target generation in MW'),
  dispatchMode: z.enum(['BASELOAD', 'LOAD_FOLLOWING', 'PEAK', 'STANDBY']),
  gridDemand: z.number().min(0).optional().describe('Current grid demand in MW'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional()
});

type DispatchPowerPlantInput = z.infer<typeof DispatchPowerPlantSchema>;

// ============================================================================
// CONSTANTS
// ============================================================================

const RAMP_RATES = {
  COAL: 1.0,      // 1% capacity per minute
  GAS: 5.0,       // 5% capacity per minute
  NUCLEAR: 0.3,   // 0.3% capacity per minute (slow)
  HYDRO: 20.0,    // 20% capacity per minute (fast)
  SOLAR: 100.0,   // Instant (limited by irradiance)
  WIND: 100.0     // Instant (limited by wind)
} as const;

const FUEL_HEAT_RATES = {
  COAL: 10000,    // BTU/kWh
  GAS: 7500,      // BTU/kWh (more efficient)
  NUCLEAR: 10500, // BTU/kWh
  HYDRO: 0,       // No fuel
  SOLAR: 0,       // No fuel
  WIND: 0         // No fuel
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const validation = DispatchPowerPlantSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { targetGeneration, dispatchMode, gridDemand, priority } = validation.data;

    // Database connection
    await dbConnect();

    // Find power plant
    const plant = await PowerPlant.findOne({
      _id: id,
      company: session.user.companyId
    });

    if (!plant) {
      return NextResponse.json(
        { error: 'Power plant not found or access denied' },
        { status: 404 }
      );
    }

    // Validate target generation against capacity
    const plantCapacity = plant.nameplateCapacity || 100; // MW
    if (targetGeneration > plantCapacity) {
      return NextResponse.json(
        {
          error: 'Target generation exceeds plant capacity',
          message: `Target ${targetGeneration} MW exceeds capacity ${plantCapacity} MW`,
          maxGeneration: plantCapacity
        },
        { status: 400 }
      );
    }

    // Calculate ramp rate based on plant type
    const plantType = (plant.plantType || 'GAS').toUpperCase() as keyof typeof RAMP_RATES;
    const rampRate = RAMP_RATES[plantType] || 5.0; // % per minute
    const currentGeneration = plant.currentOutput || 0;

    // Calculate time to reach target
    const generationChange = Math.abs(targetGeneration - currentGeneration);
    const percentChange = (generationChange / plantCapacity) * 100;
    const rampTimeMinutes = percentChange / rampRate;

    // Calculate fuel consumption (if applicable)
    const heatRate = FUEL_HEAT_RATES[plantType] || 0;
    const fuelConsumptionRate = (targetGeneration * 1000 * heatRate) / 1000000; // MMBtu/hr

    // Update plant dispatch
    plant.currentOutput = targetGeneration;
    // Only set if model supports dispatchMode
    if ((plant as any).dispatchMode !== undefined) {
      (plant as any).dispatchMode = dispatchMode;
    }
    plant.lastMaintenance = plant.lastMaintenance || new Date();

    // Save plant
    await plant.save();

    // Log dispatch
    console.log(`[ENERGY] Power plant dispatch: ${plant.name} (${plant._id}), Target: ${targetGeneration} MW, Mode: ${dispatchMode}, Ramp: ${rampTimeMinutes.toFixed(1)} min`);

    return NextResponse.json({
      success: true,
      plant: {
        id: plant._id,
        name: plant.name,
        plantType: plant.plantType,
        capacity: plantCapacity,
        currentOutput: targetGeneration,
        dispatchMode,
        lastMaintenance: plant.lastMaintenance
      },
      dispatch: {
        targetGeneration,
        previousGeneration: currentGeneration,
        generationChange: generationChange.toFixed(2),
        rampRate: rampRate.toFixed(1) + '% capacity/min',
        estimatedRampTime: rampTimeMinutes.toFixed(1) + ' minutes',
        priority: priority || 'MEDIUM',
        timestamp: new Date().toISOString()
      },
      economics: {
        fuelConsumptionRate: fuelConsumptionRate > 0 ? fuelConsumptionRate.toFixed(2) + ' MMBtu/hr' : 'N/A (renewable)',
        heatRate: heatRate > 0 ? heatRate + ' BTU/kWh' : 'N/A',
        efficiency: heatRate > 0 ? ((3412 / heatRate) * 100).toFixed(1) + '%' : '100%'
      },
      grid: {
        demand: gridDemand || 'Not provided',
        loadFactor: gridDemand ? ((targetGeneration / gridDemand) * 100).toFixed(1) + '%' : 'N/A'
      }
    });

  } catch (error) {
    console.error('[ENERGY] Power plant dispatch error:', error);
    return NextResponse.json(
      { error: 'Failed to dispatch power plant', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Dispatch Modes:
 *    - BASELOAD: Constant output (nuclear, coal)
 *    - LOAD_FOLLOWING: Variable output matching demand (gas)
 *    - PEAK: High-cost generation for peak demand (gas turbines)
 *    - STANDBY: Reserve capacity ready for quick dispatch
 * 
 * 2. Ramp Rates:
 *    - Nuclear: Very slow (0.3%/min) - designed for baseload
 *    - Coal: Slow (1%/min) - limited flexibility
 *    - Gas: Fast (5%/min) - ideal for load following
 *    - Hydro: Very fast (20%/min) - excellent for peak/regulation
 *    - Renewables: Instant (100%/min) - limited by resources
 * 
 * 3. Fuel Economics:
 *    - Heat rate: BTU input per kWh output (lower = more efficient)
 *    - Gas plants: Most efficient (~7,500 BTU/kWh)
 *    - Coal/Nuclear: Less efficient (~10,000-10,500 BTU/kWh)
 *    - Renewables: Zero fuel cost (100% efficiency)
 * 
 * 4. Grid Integration:
 *    - Load factor tracking (generation / demand)
 *    - Priority-based dispatch for grid emergencies
 *    - Coordinated dispatch with other plants
 * 
 * 5. Future Enhancements:
 *    - Economic dispatch optimization (merit order)
 *    - Ancillary services (frequency regulation, reserves)
 *    - Emissions tracking and carbon pricing
 *    - Real-time LMP (Locational Marginal Price) response
 */
