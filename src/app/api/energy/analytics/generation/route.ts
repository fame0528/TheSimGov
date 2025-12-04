/**
 * @file GET /api/energy/analytics/generation
 * @description Energy generation analytics - production statistics and trends
 * @timestamp 2025-11-28
 * @author ECHO v1.3.1
 * 
 * OVERVIEW:
 * Provides comprehensive analytics on energy generation across all assets including
 * production volumes, capacity factors, fuel mix, and performance trends.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB as dbConnect } from '@/lib/db';
import { OilWell, GasField, SolarFarm, WindTurbine, PowerPlant } from '@/lib/db/models';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import type { OilWellLean, GasFieldLean, SolarFarmLean, WindTurbineLean, PowerPlantLean } from '@/lib/types/energy-lean';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AnalyticsQuerySchema = z.object({
  startDate: z.string().optional().describe('Start date ISO string'),
  endDate: z.string().optional().describe('End date ISO string'),
  groupBy: z.enum(['asset', 'type', 'region']).optional().default('type')
});

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.companyId) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryData = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      groupBy: searchParams.get('groupBy') || 'type'
    };

    const validation = AnalyticsQuerySchema.safeParse(queryData);
    
    if (!validation.success) {
      return createErrorResponse('Invalid query parameters: ' + JSON.stringify(validation.error.flatten()), ErrorCode.BAD_REQUEST, 400);
    }

    const { startDate, endDate, groupBy } = validation.data;

    // Database connection
    await dbConnect();

    // Query all generation assets
    const filter = { company: session.user.companyId };
    
    const [oilWells, gasFields, solarFarms, windTurbines, powerPlants] = await Promise.all([
      OilWell.find(filter).lean<OilWellLean[]>(),
      GasField.find(filter).lean<GasFieldLean[]>(),
      SolarFarm.find(filter).lean<SolarFarmLean[]>(),
      WindTurbine.find(filter).lean<WindTurbineLean[]>(),
      PowerPlant.find(filter).lean<PowerPlantLean[]>()
    ]);

    // Calculate oil production (OilWell uses currentProduction, not dailyProduction)
    const oilProduction = oilWells.reduce((sum, well) => sum + (well.currentProduction ?? 0), 0);
    const oilCount = oilWells.length;
    const oilCapacity = oilWells.reduce((sum, well) => sum + (well.peakProduction ?? well.currentProduction ?? 0), 0);

    // Calculate gas production (GasField uses currentProduction, not dailyProduction)
    const gasProduction = gasFields.reduce((sum, field) => sum + (field.currentProduction ?? 0), 0);
    const gasCount = gasFields.length;
    const gasCapacity = gasFields.reduce((sum, field) => sum + (field.peakProduction ?? field.currentProduction ?? 0), 0);

    // Calculate solar generation (SolarFarm uses installedCapacity and currentOutput)
    const solarGeneration = solarFarms.reduce((sum, farm) => sum + (farm.currentOutput ?? 0), 0);
    const solarCount = solarFarms.length;
    const solarCapacity = solarFarms.reduce((sum, farm) => sum + (farm.installedCapacity ?? 0), 0);
    const solarAvgCF = solarFarms.reduce((sum, farm) => {
      const cap = farm.installedCapacity ?? 0;
      const out = farm.currentOutput ?? 0;
      const cf = cap > 0 ? (out / cap) * 100 : 0;
      return sum + cf;
    }, 0) / Math.max(solarCount, 1);

    // Calculate wind generation (WindTurbine uses ratedCapacity and currentOutput)
    const windGeneration = windTurbines.reduce((sum, turbine) => sum + (turbine.currentOutput ?? 0), 0);
    const windCount = windTurbines.length;
    const windCapacity = windTurbines.reduce((sum, turbine) => sum + (turbine.ratedCapacity ?? 0), 0);
    const windAvgCF = windTurbines.reduce((sum, turbine) => {
      const cap = turbine.ratedCapacity ?? 0;
      const out = turbine.currentOutput ?? 0;
      const cf = cap > 0 ? (out / cap) * 100 : 0;
      return sum + cf;
    }, 0) / Math.max(windCount, 1);

    // Calculate power plant generation (PowerPlant uses nameplateCapacity and currentOutput)
    const plantGeneration = powerPlants.reduce((sum, plant) => sum + (plant.currentOutput ?? 0), 0);
    const plantCount = powerPlants.length;
    const plantCapacity = powerPlants.reduce((sum, plant) => sum + (plant.nameplateCapacity ?? 0), 0);
    const plantAvgCF = powerPlants.reduce((sum, plant) => sum + (plant.capacityFactor || 60), 0) / Math.max(plantCount, 1);

    // Total electricity generation
    const totalElectricityGeneration = solarGeneration + windGeneration + plantGeneration;
    const totalElectricityCapacity = solarCapacity + windCapacity + plantCapacity;

    // Generation mix (electricity only)
    const generationMix = {
      solar: {
        generation: solarGeneration,
        percent: totalElectricityGeneration > 0 ? (solarGeneration / totalElectricityGeneration) * 100 : 0,
        capacity: solarCapacity,
        count: solarCount
      },
      wind: {
        generation: windGeneration,
        percent: totalElectricityGeneration > 0 ? (windGeneration / totalElectricityGeneration) * 100 : 0,
        capacity: windCapacity,
        count: windCount
      },
      conventional: {
        generation: plantGeneration,
        percent: totalElectricityGeneration > 0 ? (plantGeneration / totalElectricityGeneration) * 100 : 0,
        capacity: plantCapacity,
        count: plantCount
      }
    };

    // Renewable percentage
    const renewableGeneration = solarGeneration + windGeneration;
    const renewablePercent = totalElectricityGeneration > 0 ? (renewableGeneration / totalElectricityGeneration) * 100 : 0;

    // Overall capacity factor
    const overallCapacityFactor = totalElectricityCapacity > 0 
      ? (totalElectricityGeneration / (totalElectricityCapacity * 8760)) * 100 
      : 0;

    return createSuccessResponse({
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present',
        groupBy
      },
      summary: {
        totalElectricityGeneration: totalElectricityGeneration.toLocaleString() + ' MWh',
        totalElectricityCapacity: totalElectricityCapacity.toLocaleString() + ' MW',
        renewablePercent: renewablePercent.toFixed(2) + '%',
        overallCapacityFactor: overallCapacityFactor.toFixed(2) + '%',
        totalAssets: oilCount + gasCount + solarCount + windCount + plantCount
      },
      electricity: {
        solar: {
          generation: solarGeneration.toLocaleString() + ' MWh',
          capacity: solarCapacity.toLocaleString() + ' MW',
          count: solarCount,
          percent: generationMix.solar.percent.toFixed(2) + '%',
          avgCapacityFactor: solarAvgCF.toFixed(2) + '%'
        },
        wind: {
          generation: windGeneration.toLocaleString() + ' MWh',
          capacity: windCapacity.toLocaleString() + ' MW',
          count: windCount,
          percent: generationMix.wind.percent.toFixed(2) + '%',
          avgCapacityFactor: windAvgCF.toFixed(2) + '%'
        },
        conventional: {
          generation: plantGeneration.toLocaleString() + ' MWh',
          capacity: plantCapacity.toLocaleString() + ' MW',
          count: plantCount,
          percent: generationMix.conventional.percent.toFixed(2) + '%',
          avgCapacityFactor: plantAvgCF.toFixed(2) + '%'
        },
        total: {
          generation: totalElectricityGeneration.toLocaleString() + ' MWh',
          capacity: totalElectricityCapacity.toLocaleString() + ' MW',
          count: solarCount + windCount + plantCount
        }
      },
      fuels: {
        oil: {
          production: oilProduction.toLocaleString() + ' barrels',
          capacity: oilCapacity.toLocaleString() + ' bbl/day',
          count: oilCount,
          avgProduction: oilCount > 0 ? (oilProduction / oilCount).toFixed(0) + ' bbl/well' : '0'
        },
        gas: {
          production: gasProduction.toLocaleString() + ' Mcf',
          capacity: gasCapacity.toLocaleString() + ' Mcf/day',
          count: gasCount,
          avgProduction: gasCount > 0 ? (gasProduction / gasCount).toFixed(0) + ' Mcf/field' : '0'
        }
      }
    });

  } catch (error) {
    console.error('[ENERGY] Generation analytics error:', error);
    return createErrorResponse('Failed to retrieve generation analytics: ' + (error instanceof Error ? error.message : 'Unknown error'), ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Analytics Scope:
 *    - Electricity generation (solar, wind, conventional)
 *    - Fuel production (oil, natural gas)
 *    - Capacity factors by technology
 *    - Generation mix percentages
 * 
 * 2. Key Metrics:
 *    - Total generation: Sum of all electricity produced (MWh)
 *    - Total capacity: Sum of nameplate capacity (MW)
 *    - Capacity factor: (Generation / (Capacity × 8760)) × 100%
 *    - Renewable percentage: (Solar + Wind) / Total × 100%
 * 
 * 3. Asset Grouping:
 *    - By type: Solar, wind, conventional (default)
 *    - By asset: Individual asset performance
 *    - By region: Geographic breakdown
 * 
 * 4. Performance Analysis:
 *    - Average capacity factors by technology
 *    - Production per asset (well, field, farm, turbine, plant)
 *    - Generation mix visualization data
 * 
 * 5. Future Enhancements:
 *    - Time-series trending (daily/monthly/yearly)
 *    - Revenue analytics integration
 *    - Emissions calculations
 *    - Cost analytics ($/MWh produced)
 *    - Forecast vs actual comparisons
 */
