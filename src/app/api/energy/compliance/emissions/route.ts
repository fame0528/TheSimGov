/**
 * @file GET /api/energy/compliance/emissions
 * @description GHG emissions tracking and reporting - carbon footprint analysis
 * @timestamp 2025-11-28
 * @author ECHO v1.3.1
 * 
 * OVERVIEW:
 * Tracks greenhouse gas emissions from all energy operations including direct
 * combustion, electricity generation, and upstream fuel production. Provides
 * Scope 1/2/3 categorization and regulatory compliance reporting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB as dbConnect } from '@/lib/db';
import { OilWell, GasField, PowerPlant } from '@/lib/db/models';
import { auth } from '@/auth';

// ============================================================================
// CONSTANTS - EMISSION FACTORS (kg CO2e per unit)
// ============================================================================

const EMISSION_FACTORS = {
  // Direct combustion (Scope 1)
  naturalGas: 53.06,        // kg CO2e per MMBtu (EPA 2024)
  coal: 95.26,              // kg CO2e per MMBtu (EPA 2024)
  oilBurning: 74.14,        // kg CO2e per MMBtu (EPA 2024)
  
  // Upstream production (Scope 3)
  oilProduction: 15.3,      // kg CO2e per barrel (OPGEE 2024)
  gasProduction: 8.1,       // kg CO2e per Mcf (OPGEE 2024)
  
  // Grid electricity (Scope 2)
  gridElectricity: 0.417,   // kg CO2e per kWh (US avg, EPA eGRID 2023)
  
  // Avoided emissions (negative)
  solar: -0.021,            // kg CO2e per kWh (lifecycle, NREL 2024)
  wind: -0.011,             // kg CO2e per kWh (lifecycle, NREL 2024)
  
  // Grid displacement
  gridDisplaced: -0.5       // kg CO2e per kWh renewable (EPA avg)
};

// Compliance thresholds (annual tons CO2e)
const COMPLIANCE_THRESHOLDS = {
  reporting: 25000,         // EPA mandatory reporting threshold
  cap: 100000,              // Example cap-and-trade threshold
  intense: 50000            // Intensity threshold for large emitters
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const EmissionsQuerySchema = z.object({
  year: z.string().optional().describe('Reporting year (default current)'),
  scope: z.enum(['all', 'scope1', 'scope2', 'scope3']).optional().default('all')
});

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryData = {
      year: searchParams.get('year') || new Date().getFullYear().toString(),
      scope: searchParams.get('scope') || 'all'
    };

    const validation = EmissionsQuerySchema.safeParse(queryData);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { year, scope } = validation.data;

    // Database connection
    await dbConnect();

    const filter = { company: session.user.companyId };

    // Query all emitting assets
    const [oilWells, gasFields, powerPlants] = await Promise.all([
      OilWell.find(filter).lean(),
      GasField.find(filter).lean(),
      PowerPlant.find(filter).lean()
    ]);

    // SCOPE 1: Direct emissions from owned/controlled sources
    let scope1Emissions = 0;

    // Oil well operations (venting, flaring, fugitive)
    const oilVenting = oilWells.reduce((sum, well) => sum + (((well as any).dailyProduction ?? 0) * EMISSION_FACTORS.oilProduction), 0);
    scope1Emissions += oilVenting;

    // Gas field operations (venting, flaring, compressor fuel)
    const gasVenting = gasFields.reduce((sum, field) => sum + (((field as any).dailyProduction ?? 0) * EMISSION_FACTORS.gasProduction), 0);
    scope1Emissions += gasVenting;

    // Power plant combustion
    const plantsByFuel = powerPlants.reduce((acc: any, plant) => {
      const fuel = (plant as any).plantType || 'NATURAL_GAS';
      if (!acc[fuel]) acc[fuel] = { count: 0, generation: 0 };
      acc[fuel].count++;
      acc[fuel].generation += ((plant as any).currentOutput ?? 0);
      return acc;
    }, {});

    let coalEmissions = 0;
    let gasEmissions = 0;
    let oilEmissions = 0;

    if (plantsByFuel.COAL) {
      // Coal: ~10,000 BTU/kWh heat rate, 95.26 kg CO2e/MMBtu
      coalEmissions = (plantsByFuel.COAL.generation * 10000 / 1000000) * EMISSION_FACTORS.coal;
      scope1Emissions += coalEmissions;
    }

    if (plantsByFuel.NATURAL_GAS) {
      // Natural gas: ~7,000 BTU/kWh heat rate, 53.06 kg CO2e/MMBtu
      gasEmissions = (plantsByFuel.NATURAL_GAS.generation * 7000 / 1000000) * EMISSION_FACTORS.naturalGas;
      scope1Emissions += gasEmissions;
    }

    if (plantsByFuel.OIL) {
      // Oil: ~10,500 BTU/kWh heat rate, 74.14 kg CO2e/MMBtu
      oilEmissions = (plantsByFuel.OIL.generation * 10500 / 1000000) * EMISSION_FACTORS.oilBurning;
      scope1Emissions += oilEmissions;
    }

    // SCOPE 2: Indirect emissions from purchased electricity
    // (For this simulation, assume minimal purchased electricity)
    const scope2Emissions = 0; // Would calculate from electricity bills

    // SCOPE 3: Other indirect emissions
    // Upstream fuel production already counted in Scope 1 for owned operations
    const scope3Emissions = 0; // Would include employee commute, purchased goods, etc.

    // Total emissions
    const totalEmissions = scope1Emissions + scope2Emissions + scope3Emissions;
    const totalEmissionsTons = totalEmissions / 1000; // Convert kg to metric tons

    // Compliance status
    const requiresReporting = totalEmissionsTons >= COMPLIANCE_THRESHOLDS.reporting;
    const exceedsCap = totalEmissionsTons >= COMPLIANCE_THRESHOLDS.cap;
    const isIntenseEmitter = totalEmissionsTons >= COMPLIANCE_THRESHOLDS.intense;

    // Emission breakdown
    const emissionBreakdown = {
      oilOperations: {
        emissions: (oilVenting / 1000).toFixed(2) + ' tons CO2e',
        percent: totalEmissions > 0 ? ((oilVenting / totalEmissions) * 100).toFixed(2) + '%' : '0%',
        source: 'Oil well venting, flaring, fugitive'
      },
      gasOperations: {
        emissions: (gasVenting / 1000).toFixed(2) + ' tons CO2e',
        percent: totalEmissions > 0 ? ((gasVenting / totalEmissions) * 100).toFixed(2) + '%' : '0%',
        source: 'Gas field venting, compressor fuel'
      },
      coalCombustion: {
        emissions: (coalEmissions / 1000).toFixed(2) + ' tons CO2e',
        percent: totalEmissions > 0 ? ((coalEmissions / totalEmissions) * 100).toFixed(2) + '%' : '0%',
        source: 'Coal power plant combustion'
      },
      gasCombustion: {
        emissions: (gasEmissions / 1000).toFixed(2) + ' tons CO2e',
        percent: totalEmissions > 0 ? ((gasEmissions / totalEmissions) * 100).toFixed(2) + '%' : '0%',
        source: 'Natural gas power plant combustion'
      },
      oilCombustion: {
        emissions: (oilEmissions / 1000).toFixed(2) + ' tons CO2e',
        percent: totalEmissions > 0 ? ((oilEmissions / totalEmissions) * 100).toFixed(2) + '%' : '0%',
        source: 'Oil power plant combustion'
      }
    };

    return NextResponse.json({
      success: true,
      reportingYear: year,
      scope,
      summary: {
        totalEmissions: totalEmissionsTons.toLocaleString() + ' tons CO2e',
        scope1: (scope1Emissions / 1000).toLocaleString() + ' tons CO2e (' + ((scope1Emissions / totalEmissions) * 100).toFixed(1) + '%)',
        scope2: (scope2Emissions / 1000).toLocaleString() + ' tons CO2e (' + ((scope2Emissions / totalEmissions) * 100).toFixed(1) + '%)',
        scope3: (scope3Emissions / 1000).toLocaleString() + ' tons CO2e (' + ((scope3Emissions / totalEmissions) * 100).toFixed(1) + '%)'
      },
      breakdown: emissionBreakdown,
      compliance: {
        requiresReporting: {
          status: requiresReporting,
          threshold: COMPLIANCE_THRESHOLDS.reporting.toLocaleString() + ' tons CO2e/year',
          description: 'EPA Mandatory GHG Reporting (40 CFR Part 98)'
        },
        exceedsCap: {
          status: exceedsCap,
          threshold: COMPLIANCE_THRESHOLDS.cap.toLocaleString() + ' tons CO2e/year',
          description: 'Example cap-and-trade threshold'
        },
        intensiveEmitter: {
          status: isIntenseEmitter,
          threshold: COMPLIANCE_THRESHOLDS.intense.toLocaleString() + ' tons CO2e/year',
          description: 'Large emitter designation'
        }
      },
      emissionFactors: {
        naturalGas: EMISSION_FACTORS.naturalGas + ' kg CO2e/MMBtu',
        coal: EMISSION_FACTORS.coal + ' kg CO2e/MMBtu',
        oilBurning: EMISSION_FACTORS.oilBurning + ' kg CO2e/MMBtu',
        oilProduction: EMISSION_FACTORS.oilProduction + ' kg CO2e/barrel',
        gasProduction: EMISSION_FACTORS.gasProduction + ' kg CO2e/Mcf',
        source: 'EPA 2024, OPGEE 2024, NREL 2024'
      }
    });

  } catch (error) {
    console.error('[ENERGY] Emissions tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve emissions data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. GHG Protocol Scopes:
 *    - Scope 1: Direct emissions from owned/controlled sources (combustion, venting, flaring)
 *    - Scope 2: Indirect emissions from purchased electricity and heat
 *    - Scope 3: Other indirect emissions (upstream, downstream, employee travel)
 * 
 * 2. Emission Calculation Methods:
 *    - Power plants: Generation (MWh) × Heat rate (BTU/kWh) × Emission factor (kg CO2e/MMBtu)
 *    - Oil/gas operations: Production (barrels/Mcf) × Upstream emission factor
 *    - Typical heat rates: Coal 10,000 BTU/kWh, Gas 7,000 BTU/kWh, Oil 10,500 BTU/kWh
 * 
 * 3. Regulatory Compliance:
 *    - EPA GHGRP: Mandatory reporting ≥25,000 tons CO2e/year (40 CFR Part 98)
 *    - State cap-and-trade programs: Vary by jurisdiction
 *    - Carbon pricing: Can apply per ton CO2e
 * 
 * 4. Emission Factors (Industry Standard):
 *    - Natural gas: 53.06 kg CO2e/MMBtu (EPA 2024)
 *    - Coal: 95.26 kg CO2e/MMBtu (EPA 2024, bituminous)
 *    - Oil: 74.14 kg CO2e/MMBtu (EPA 2024)
 *    - Upstream oil: 15.3 kg CO2e/barrel (OPGEE 2024, US average)
 *    - Upstream gas: 8.1 kg CO2e/Mcf (OPGEE 2024)
 * 
 * 5. Future Enhancements:
 *    - Carbon offset tracking (renewable credits, forestry)
 *    - Emission reduction targets and progress
 *    - Carbon pricing impact calculations
 *    - Avoided emissions from renewable generation
 *    - Methane leak detection and quantification
 */
