/**
 * @fileoverview Solar Farm Generate Action API
 * @module api/energy/solar-farms/[id]/generate
 * 
 * OVERVIEW:
 * Records generation output for solar farms based on weather conditions,
 * sun hours, and system efficiency. Calculates revenue from electricity
 * production and feed-in tariffs for grid-connected systems.
 * 
 * ENDPOINTS:
 * POST /api/energy/solar-farms/[id]/generate - Record generation output
 * 
 * BUSINESS LOGIC:
 * - Output = capacity × sunHours × efficiency × (1 - degradation) × weatherFactor
 * - Weather factors: Clear (1.0), Partly Cloudy (0.7), Cloudy (0.3), Rainy (0.1)
 * - Sun hours: 0-12 based on season and latitude
 * - Revenue = production × electricityRate + excess × feedInTariff (if grid-connected)
 * - Battery storage absorbs excess production if available
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1 - Phase 3.1 Energy Action Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { SolarFarm } from '@/lib/db/models';
import { z } from 'zod';

/** Route parameter types for Next.js 15+ */
interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Request body validation schema */
const GenerateRequestSchema = z.object({
  sunHours: z.number().min(0).max(12).default(6), // Hours of sunlight
  weatherCondition: z.enum(['clear', 'partly-cloudy', 'cloudy', 'rainy']).default('clear'),
  season: z.enum(['spring', 'summer', 'fall', 'winter']).optional(),
});

/** Weather impact multipliers */
const WEATHER_FACTORS = {
  'clear': 1.0,
  'partly-cloudy': 0.7,
  'cloudy': 0.3,
  'rainy': 0.1,
};

/**
 * POST /api/energy/solar-farms/[id]/generate
 * 
 * Record generation output for solar farm
 * 
 * @param request - Next.js request object with generation parameters
 * @param params - Route parameters containing farm ID
 * @returns Generation results with production amount and revenue
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const { sunHours, weatherCondition, season } = GenerateRequestSchema.parse(body);

    // 3. Connect to database
    await connectDB();

    // 4. Fetch and validate farm
    const { id } = await params;
    const farm = await SolarFarm.findById(id);
    
    if (!farm) {
      return NextResponse.json({ error: 'Solar farm not found' }, { status: 404 });
    }

    // 5. Verify ownership
    if (farm.company.toString() !== session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized access to farm' }, { status: 403 });
    }

    // 6. Validate operational status
    if (farm.status !== 'Operational') {
      return NextResponse.json(
        { error: `Cannot generate from farm with status: ${farm.status}` },
        { status: 400 }
      );
    }

    // 7. Calculate production output
    const weatherFactor = WEATHER_FACTORS[weatherCondition];
    const systemEfficiency = farm.systemEfficiency / 100;
    const inverterEfficiency = farm.inverterEfficiency / 100;
    const degradationFactor = 1 - (farm.panelDegradation / 100);
    
    // kWh = capacity (kW) × hours × efficiencies × degradation × weather
    const rawOutput = farm.installedCapacity * sunHours * systemEfficiency * inverterEfficiency * degradationFactor * weatherFactor;
    const production = Math.round(rawOutput * 100) / 100; // kWh

    // 8. Calculate battery storage if available
    let batteryCharged = 0;
    let excessProduction = production;
    
    if (farm.batteryStorage) {
      const batteryCapacity = farm.batteryStorage.capacity;
      const currentCharge = farm.batteryStorage.currentCharge;
      const availableSpace = batteryCapacity - currentCharge;
      
      // Charge battery with excess production
      batteryCharged = Math.min(excessProduction, availableSpace);
      farm.batteryStorage.currentCharge += batteryCharged;
      excessProduction -= batteryCharged;
    }

    // 9. Calculate revenue
    const baseRevenue = production * farm.electricityRate;
    let feedInRevenue = 0;
    
    if (farm.gridConnection?.netMeteringEnabled && excessProduction > 0) {
      feedInRevenue = excessProduction * farm.gridConnection.feedInTariff;
    }
    
    const totalRevenue = baseRevenue + feedInRevenue;
    const operatingCost = production * farm.operatingCost;
    const netRevenue = totalRevenue - operatingCost;

    // 10. Update farm production stats
    farm.currentOutput = production;
    farm.dailyProduction = production;
    farm.cumulativeProduction += production;
    await farm.save();

    // 11. Return generation results
    return NextResponse.json({
      success: true,
      production: Math.round(production * 100) / 100,
      revenue: Math.round(netRevenue * 100) / 100,
      details: {
        sunHours,
        weatherCondition,
        weatherFactor,
        systemEfficiency: Math.round(systemEfficiency * 100),
        degradation: farm.panelDegradation,
        batteryCharged: Math.round(batteryCharged * 100) / 100,
        excessProduction: Math.round(excessProduction * 100) / 100,
        baseRevenue: Math.round(baseRevenue * 100) / 100,
        feedInRevenue: Math.round(feedInRevenue * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        operatingCost: Math.round(operatingCost * 100) / 100,
        netRevenue: Math.round(netRevenue * 100) / 100,
      },
      farm: {
        id: farm._id,
        name: farm.name,
        status: farm.status,
        installedCapacity: farm.installedCapacity,
        currentOutput: farm.currentOutput,
        cumulativeProduction: farm.cumulativeProduction,
      },
    });

  } catch (error) {
    // Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    // Generic error handling
    console.error('POST /api/energy/solar-farms/[id]/generate error:', error);
    return NextResponse.json(
      { error: 'Failed to process generation operation' },
      { status: 500 }
    );
  }
}
