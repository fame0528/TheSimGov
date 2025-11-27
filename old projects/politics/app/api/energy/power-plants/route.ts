/**
 * @fileoverview Power Plants API Routes - List and Create Power Plants
 * 
 * GET /api/energy/power-plants - List power plants with filtering
 * POST /api/energy/power-plants - Create new power plant
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import PowerPlant from '@/lib/db/models/PowerPlant';
import Company from '@/lib/db/models/Company';
import { PlantType } from '@/lib/db/models/PowerPlant';

/**
 * GET /api/energy/power-plants
 * List power plants with optional filtering
 * 
 * Query Parameters:
 * - company: Filter by company ID
 * - plantType: Filter by plant type (Coal, NaturalGas, Nuclear, Hydro)
 * - status: Filter by operational status
 * - state: Filter by state location
 * 
 * @returns Array of power plants
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');
    const plantType = searchParams.get('plantType');
    const status = searchParams.get('status');
    const state = searchParams.get('state');

    // Build filter
    const filter: Record<string, unknown> = {};
    
    if (companyId) {
      filter.company = companyId;
    }
    
    if (plantType) {
      filter.plantType = plantType;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (state) {
      filter['location.state'] = state;
    }

    // Fetch power plants
    const plants = await PowerPlant.find(filter)
      .populate('company', 'name industry')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ plants }, { status: 200 });
  } catch (error) {
    console.error('Error fetching power plants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch power plants' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/energy/power-plants
 * Create new power plant
 * 
 * Request Body:
 * - company: Company ID (owner)
 * - name: Plant name
 * - plantType: Plant type (Coal, NaturalGas, Nuclear, Hydro)
 * - location: { city, state, coordinates? }
 * - nameplateCapacity: Maximum capacity (MW)
 * 
 * @returns Created power plant with construction cost
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { company: companyId, name, plantType, location, nameplateCapacity } = body;

    // Validate required fields
    if (!companyId || !name || !plantType || !location || !nameplateCapacity) {
      return NextResponse.json(
        { error: 'Missing required fields: company, name, plantType, location, nameplateCapacity' },
        { status: 400 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to create plants for this company' },
        { status: 403 }
      );
    }

    // Calculate plant specifications based on type
    const plantSpecs = getPlantSpecifications(plantType as PlantType, nameplateCapacity);

    // Create power plant
    const plant = new PowerPlant({
      company: companyId,
      name,
      plantType,
      location,
      nameplateCapacity,
      currentOutput: 0,
      targetCapacityFactor: plantSpecs.targetCapacityFactor,
      actualCapacityFactor: 0,
      baseEfficiency: plantSpecs.baseEfficiency,
      currentEfficiency: plantSpecs.baseEfficiency,
      degradationRate: plantSpecs.degradationRate,
      yearsInOperation: 0,
      fuelType: plantSpecs.fuelType,
      fuelCostPerMWh: plantSpecs.fuelCostPerMWh,
      fuelConsumptionRate: plantSpecs.fuelConsumptionRate,
      co2EmissionsRate: plantSpecs.co2EmissionsRate,
      totalCO2Emitted: 0,
      startupTimehours: plantSpecs.startupTimeHours,
      shutdownTimeHours: plantSpecs.shutdownTimeHours,
      rampRatePercentPerMin: plantSpecs.rampRatePercentPerMin,
      minimumLoadPercent: plantSpecs.minimumLoadPercent,
      constructionCost: plantSpecs.constructionCost,
      startupCost: plantSpecs.startupCost,
      shutdownCost: plantSpecs.shutdownCost,
      fixedOMCostPerYear: plantSpecs.fixedOMCostPerYear,
      variableOMCostPerMWh: plantSpecs.variableOMCostPerMWh,
      status: 'Offline',
      totalStartups: 0,
      hoursOnline: 0,
      totalMWhGenerated: 0,
      maintenanceSchedule: [],
      maintenanceHistory: [],
      priorityDispatch: plantType === 'Nuclear' || plantType === 'Hydro',
      blackStartCapable: plantType === 'Hydro',
      commissionedDate: new Date(),
    });

    await plant.save();

    return NextResponse.json(
      {
        plant,
        constructionCost: plantSpecs.constructionCost,
        message: `${plantType} power plant created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating power plant:', error);
    return NextResponse.json(
      { error: 'Failed to create power plant' },
      { status: 500 }
    );
  }
}

/**
 * Calculate plant specifications based on type and capacity
 */
function getPlantSpecifications(plantType: PlantType, nameplateCapacity: number) {
  const baseSpecs = {
    Coal: {
      targetCapacityFactor: 0.70,
      baseEfficiency: 35,
      degradationRate: 1.0,
      fuelType: 'Coal',
      fuelCostPerMWh: 1.2,
      fuelConsumptionRate: 10.0,
      co2EmissionsRate: 2.2,
      startupTimeHours: 8,
      shutdownTimeHours: 4,
      rampRatePercentPerMin: 2,
      minimumLoadPercent: 40,
      constructionCostPerMW: 3500000,
      startupCostPerMW: 5000,
      shutdownCostPerMW: 2000,
      fixedOMPerMW: 45000,
      variableOMPerMWh: 4.5,
    },
    NaturalGas: {
      targetCapacityFactor: 0.60,
      baseEfficiency: 50,
      degradationRate: 0.75,
      fuelType: 'Natural Gas',
      fuelCostPerMWh: 3.2,
      fuelConsumptionRate: 7.0,
      co2EmissionsRate: 1.0,
      startupTimeHours: 2,
      shutdownTimeHours: 1,
      rampRatePercentPerMin: 7.5,
      minimumLoadPercent: 30,
      constructionCostPerMW: 1200000,
      startupCostPerMW: 3000,
      shutdownCostPerMW: 1000,
      fixedOMPerMW: 15000,
      variableOMPerMWh: 3.5,
    },
    Nuclear: {
      targetCapacityFactor: 0.90,
      baseEfficiency: 33,
      degradationRate: 0.5,
      fuelType: 'Uranium',
      fuelCostPerMWh: 0.6,
      fuelConsumptionRate: 0.1,
      co2EmissionsRate: 0,
      startupTimeHours: 48,
      shutdownTimeHours: 24,
      rampRatePercentPerMin: 1,
      minimumLoadPercent: 50,
      constructionCostPerMW: 7000000,
      startupCostPerMW: 15000,
      shutdownCostPerMW: 10000,
      fixedOMPerMW: 100000,
      variableOMPerMWh: 2.0,
    },
    Hydro: {
      targetCapacityFactor: 0.50,
      baseEfficiency: 90,
      degradationRate: 0.25,
      fuelType: 'None',
      fuelCostPerMWh: 0,
      fuelConsumptionRate: 0,
      co2EmissionsRate: 0,
      startupTimeHours: 0.25,
      shutdownTimeHours: 0.1,
      rampRatePercentPerMin: 75,
      minimumLoadPercent: 10,
      constructionCostPerMW: 2500000,
      startupCostPerMW: 500,
      shutdownCostPerMW: 200,
      fixedOMPerMW: 30000,
      variableOMPerMWh: 1.0,
    },
  };

  const specs = baseSpecs[plantType];

  return {
    targetCapacityFactor: specs.targetCapacityFactor,
    baseEfficiency: specs.baseEfficiency,
    degradationRate: specs.degradationRate,
    fuelType: specs.fuelType,
    fuelCostPerMWh: specs.fuelCostPerMWh,
    fuelConsumptionRate: specs.fuelConsumptionRate,
    co2EmissionsRate: specs.co2EmissionsRate,
    startupTimeHours: specs.startupTimeHours,
    shutdownTimeHours: specs.shutdownTimeHours,
    rampRatePercentPerMin: specs.rampRatePercentPerMin,
    minimumLoadPercent: specs.minimumLoadPercent,
    constructionCost: nameplateCapacity * specs.constructionCostPerMW,
    startupCost: nameplateCapacity * specs.startupCostPerMW,
    shutdownCost: nameplateCapacity * specs.shutdownCostPerMW,
    fixedOMCostPerYear: nameplateCapacity * specs.fixedOMPerMW,
    variableOMCostPerMWh: specs.variableOMPerMWh,
  };
}
