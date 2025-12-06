/**
 * @file src/lib/game/tick/energyProcessor.ts
 * @description Energy tick processor for power generation and billing
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Processes energy industry events each game tick:
 * - Calculate power generation from all facilities (oil wells, solar, wind, etc.)
 * - Fulfill Power Purchase Agreements (PPAs) first
 * - Sell excess power on spot market
 * - Deduct fuel and maintenance costs
 * - Apply equipment depreciation
 *
 * FACILITY TYPES:
 * - OilWell: Extracts crude oil, depletes over time
 * - GasField: Extracts natural gas
 * - SolarFarm: Weather-dependent generation
 * - WindTurbine: Wind-dependent generation
 * - PowerPlant: Converts fuel to electricity
 * - EnergyStorage: Batteries for grid stabilization
 *
 * @author ECHO v1.4.0
 */

import {
  ITickProcessor,
  GameTime,
  TickProcessorResult,
  TickProcessorOptions,
  TickError,
} from '@/lib/types/gameTick';
import {
  OilWell,
  SolarFarm,
  WindTurbine,
  GasField,
  PowerPlant,
  PPA,
  CommodityPrice,
} from '@/lib/db/models/energy';
import Company from '@/lib/db/models/Company';

// ============================================================================
// ENERGY TICK SUMMARY TYPE
// ============================================================================

export interface EnergyTickSummary {
  [key: string]: unknown;
  
  // Facilities processed
  oilWellsProcessed: number;
  solarFarmsProcessed: number;
  windTurbinesProcessed: number;
  gasFieldsProcessed: number;
  powerPlantsProcessed: number;
  
  // Production totals
  totalOilProduced: number;      // Barrels
  totalGasProduced: number;      // MCF
  totalElectricityGenerated: number; // kWh
  
  // Revenue
  commoditySalesRevenue: number;
  ppaSalesRevenue: number;
  spotMarketRevenue: number;
  totalRevenue: number;
  
  // Expenses
  fuelCosts: number;
  maintenanceCosts: number;
  operatingCosts: number;
  totalExpenses: number;
  
  // Net
  netProfit: number;
}

// ============================================================================
// ENERGY TICK PROCESSOR
// ============================================================================

/**
 * Energy tick processor implementation
 */
export const energyProcessor: ITickProcessor = {
  name: 'energy',
  priority: 15, // After empire (5) and banking (10)
  enabled: true,

  /**
   * Process energy tick
   */
  async process(
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<TickProcessorResult> {
    const startTime = Date.now();
    const errors: TickError[] = [];
    let itemsProcessed = 0;

    // Summary counters
    const summary: EnergyTickSummary = {
      oilWellsProcessed: 0,
      solarFarmsProcessed: 0,
      windTurbinesProcessed: 0,
      gasFieldsProcessed: 0,
      powerPlantsProcessed: 0,
      totalOilProduced: 0,
      totalGasProduced: 0,
      totalElectricityGenerated: 0,
      commoditySalesRevenue: 0,
      ppaSalesRevenue: 0,
      spotMarketRevenue: 0,
      totalRevenue: 0,
      fuelCosts: 0,
      maintenanceCosts: 0,
      operatingCosts: 0,
      totalExpenses: 0,
      netProfit: 0,
    };

    try {
      // Get current commodity prices
      const prices = await getCurrentPrices();

      // Build company filter if specific player/company
      const companyFilter = await buildCompanyFilter(options);

      // 1. PROCESS OIL WELLS
      const oilWellResult = await processOilWells(companyFilter, prices, options?.dryRun);
      summary.oilWellsProcessed = oilWellResult.count;
      summary.totalOilProduced = oilWellResult.production;
      summary.commoditySalesRevenue += oilWellResult.revenue;
      summary.operatingCosts += oilWellResult.costs;
      errors.push(...oilWellResult.errors);
      itemsProcessed += oilWellResult.count;

      // 2. PROCESS GAS FIELDS
      const gasFieldResult = await processGasFields(companyFilter, prices, options?.dryRun);
      summary.gasFieldsProcessed = gasFieldResult.count;
      summary.totalGasProduced = gasFieldResult.production;
      summary.commoditySalesRevenue += gasFieldResult.revenue;
      summary.operatingCosts += gasFieldResult.costs;
      errors.push(...gasFieldResult.errors);
      itemsProcessed += gasFieldResult.count;

      // 3. PROCESS SOLAR FARMS
      const solarResult = await processSolarFarms(companyFilter, gameTime, options?.dryRun);
      summary.solarFarmsProcessed = solarResult.count;
      summary.totalElectricityGenerated += solarResult.production;
      summary.spotMarketRevenue += solarResult.revenue;
      summary.maintenanceCosts += solarResult.costs;
      errors.push(...solarResult.errors);
      itemsProcessed += solarResult.count;

      // 4. PROCESS WIND TURBINES
      const windResult = await processWindTurbines(companyFilter, gameTime, options?.dryRun);
      summary.windTurbinesProcessed = windResult.count;
      summary.totalElectricityGenerated += windResult.production;
      summary.spotMarketRevenue += windResult.revenue;
      summary.maintenanceCosts += windResult.costs;
      errors.push(...windResult.errors);
      itemsProcessed += windResult.count;

      // 5. PROCESS POWER PLANTS
      const plantResult = await processPowerPlants(companyFilter, prices, options?.dryRun);
      summary.powerPlantsProcessed = plantResult.count;
      summary.totalElectricityGenerated += plantResult.production;
      summary.fuelCosts += plantResult.fuelCosts;
      summary.spotMarketRevenue += plantResult.revenue;
      summary.maintenanceCosts += plantResult.maintenanceCosts;
      errors.push(...plantResult.errors);
      itemsProcessed += plantResult.count;

      // 6. PROCESS PPA CONTRACTS
      const ppaResult = await processPPAs(companyFilter, summary.totalElectricityGenerated, options?.dryRun);
      summary.ppaSalesRevenue = ppaResult.revenue;
      // PPA revenue replaces spot market for contracted amount
      summary.spotMarketRevenue = Math.max(0, summary.spotMarketRevenue - ppaResult.powerAllocated * getSpotPrice());
      errors.push(...ppaResult.errors);

      // Calculate totals
      summary.totalRevenue = summary.commoditySalesRevenue + summary.ppaSalesRevenue + summary.spotMarketRevenue;
      summary.totalExpenses = summary.fuelCosts + summary.maintenanceCosts + summary.operatingCosts;
      summary.netProfit = summary.totalRevenue - summary.totalExpenses;

      return {
        processor: 'energy',
        success: errors.length === 0 || errors.every(e => e.recoverable),
        itemsProcessed,
        errors,
        summary,
        durationMs: Date.now() - startTime,
      };

    } catch (error) {
      return {
        processor: 'energy',
        success: false,
        itemsProcessed,
        errors: [{
          entityId: 'system',
          entityType: 'EnergyProcessor',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: false,
        }],
        summary,
        durationMs: Date.now() - startTime,
      };
    }
  },

  /**
   * Validate processor is ready
   */
  async validate(): Promise<true | string> {
    try {
      // Check if energy models are available
      await OilWell.findOne().limit(1);
      return true;
    } catch (error) {
      return `Energy processor validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface FacilityProcessResult {
  count: number;
  production: number;
  revenue: number;
  costs: number;
  fuelCosts?: number;
  maintenanceCosts?: number;
  errors: TickError[];
}

/**
 * Get current commodity prices
 */
async function getCurrentPrices(): Promise<{ oil: number; gas: number; electricity: number }> {
  try {
    const oilPrice = await CommodityPrice.findOne({ commodityType: 'Crude Oil' }).sort({ updatedAt: -1 });
    const gasPrice = await CommodityPrice.findOne({ commodityType: 'Natural Gas' }).sort({ updatedAt: -1 });
    
    return {
      oil: oilPrice?.currentPrice ?? 75, // Default $75/barrel
      gas: gasPrice?.currentPrice ?? 3.5, // Default $3.50/MCF
      electricity: 0.12, // Default $0.12/kWh
    };
  } catch {
    return { oil: 75, gas: 3.5, electricity: 0.12 };
  }
}

/**
 * Get current spot electricity price
 */
function getSpotPrice(): number {
  return 0.12; // $0.12/kWh default
}

/**
 * Build company filter based on options
 */
async function buildCompanyFilter(
  options?: TickProcessorOptions
): Promise<{ company?: { $in: string[] } }> {
  if (options?.companyId) {
    return { company: { $in: [options.companyId] } };
  }
  
  if (options?.playerId) {
    const companies = await Company.find({ owner: options.playerId }).select('_id');
    const companyIds = companies.map(c => c._id.toString());
    return { company: { $in: companyIds } };
  }
  
  return {};
}

/**
 * Process oil wells
 */
async function processOilWells(
  filter: Record<string, unknown>,
  prices: { oil: number },
  dryRun?: boolean
): Promise<FacilityProcessResult> {
  const errors: TickError[] = [];
  let totalProduction = 0;
  let totalRevenue = 0;
  let totalCosts = 0;

  const wells = await OilWell.find({ ...filter, status: 'Active' });

  for (const well of wells) {
    try {
      // Calculate monthly production (30 days)
      const dailyProduction = well.calculateProduction();
      const monthlyProduction = dailyProduction * 30;
      
      // Calculate revenue and costs
      const revenue = monthlyProduction * prices.oil;
      const costs = monthlyProduction * well.extractionCost;
      
      totalProduction += monthlyProduction;
      totalRevenue += revenue;
      totalCosts += costs;

      if (!dryRun) {
        // Update reserve and production stats
        well.reserveEstimate = Math.max(0, well.reserveEstimate - monthlyProduction);
        well.currentProduction = dailyProduction;
        
        // Check for depletion
        if (well.reserveEstimate <= 0) {
          well.status = 'Depleted';
        }
        
        // Check for maintenance needed
        if (well.maintenanceOverdue) {
          well.currentProduction *= 0.8; // 20% efficiency loss
        }
        
        await well.save();
      }
    } catch (error) {
      errors.push({
        entityId: well._id.toString(),
        entityType: 'OilWell',
        message: error instanceof Error ? error.message : 'Unknown error',
        recoverable: true,
      });
    }
  }

  return {
    count: wells.length,
    production: totalProduction,
    revenue: totalRevenue,
    costs: totalCosts,
    errors,
  };
}

/**
 * Process gas fields
 */
async function processGasFields(
  filter: Record<string, unknown>,
  prices: { gas: number },
  dryRun?: boolean
): Promise<FacilityProcessResult> {
  const errors: TickError[] = [];
  let totalProduction = 0;
  let totalRevenue = 0;
  let totalCosts = 0;

  const fields = await GasField.find({ ...filter, status: 'Production' });

  for (const field of fields) {
    try {
      // Calculate monthly production
      const dailyProduction = field.currentProduction || 0;
      const monthlyProduction = dailyProduction * 30;
      
      // Calculate revenue and costs
      const revenue = monthlyProduction * prices.gas;
      const costs = monthlyProduction * (field.processingCost || 1);
      
      totalProduction += monthlyProduction;
      totalRevenue += revenue;
      totalCosts += costs;

      if (!dryRun) {
        // Update reserves
        field.reserveEstimate = Math.max(0, (field.reserveEstimate || 0) - monthlyProduction);
        
        // Check for depletion
        if (field.reserveEstimate <= 0) {
          field.status = 'Depleted';
        }
        
        await field.save();
      }
    } catch (error) {
      errors.push({
        entityId: field._id.toString(),
        entityType: 'GasField',
        message: error instanceof Error ? error.message : 'Unknown error',
        recoverable: true,
      });
    }
  }

  return {
    count: fields.length,
    production: totalProduction,
    revenue: totalRevenue,
    costs: totalCosts,
    errors,
  };
}

/**
 * Process solar farms
 */
async function processSolarFarms(
  filter: Record<string, unknown>,
  gameTime: GameTime,
  dryRun?: boolean
): Promise<FacilityProcessResult> {
  const errors: TickError[] = [];
  let totalProduction = 0;
  let totalRevenue = 0;
  let totalCosts = 0;

  const farms = await SolarFarm.find({ ...filter, status: 'Operational' });

  for (const farm of farms) {
    try {
      // Calculate monthly generation
      // Base: capacity × hours × efficiency × weather factor
      const sunHours = getSunHoursForMonth(gameTime.month, farm.location?.latitude ?? 35);
      const degradationFactor = 1 - (farm.panelDegradation || 0) / 100;
      const weatherFactor = getWeatherFactor(gameTime.month);
      
      const dailyProduction = 
        (farm.installedCapacity || 0) * 
        sunHours * 
        ((farm.systemEfficiency || 85) / 100) *
        degradationFactor *
        weatherFactor;
      
      const monthlyProduction = dailyProduction * 30;
      
      // Revenue at spot rate
      const revenue = monthlyProduction * 0.12; // $0.12/kWh
      const costs = (farm.operatingCost || 0);
      
      totalProduction += monthlyProduction;
      totalRevenue += revenue;
      totalCosts += costs;

      if (!dryRun) {
        farm.currentOutput = dailyProduction / 24; // Average kW
        farm.dailyProduction = dailyProduction;
        farm.cumulativeProduction = (farm.cumulativeProduction || 0) + monthlyProduction;
        
        // Apply monthly degradation
        farm.panelDegradation = (farm.panelDegradation || 0) + 0.5 / 12; // 0.5% per year
        
        await farm.save();
      }
    } catch (error) {
      errors.push({
        entityId: farm._id.toString(),
        entityType: 'SolarFarm',
        message: error instanceof Error ? error.message : 'Unknown error',
        recoverable: true,
      });
    }
  }

  return {
    count: farms.length,
    production: totalProduction,
    revenue: totalRevenue,
    costs: totalCosts,
    errors,
  };
}

/**
 * Process wind turbines
 */
async function processWindTurbines(
  filter: Record<string, unknown>,
  gameTime: GameTime,
  dryRun?: boolean
): Promise<FacilityProcessResult> {
  const errors: TickError[] = [];
  let totalProduction = 0;
  let totalRevenue = 0;
  let totalCosts = 0;

  const turbines = await WindTurbine.find({ ...filter, status: 'Operational' });

  for (const turbine of turbines) {
    try {
      // Calculate monthly generation
      // Wind is more consistent but still varies by season
      const windFactor = getWindFactor(gameTime.month);
      const capacity = turbine.ratedCapacity || 0;
      // Wind turbines have ~25-45% capacity factor based on conditions
      // Calculate from drivetrain efficiency + blade conditions
      const avgBladeCondition = turbine.bladeConditions?.reduce((sum, b) => sum + b.integrityPercent, 0) / (turbine.bladeConditions?.length || 1) || 100;
      const drivetrainEff = turbine.drivetrain?.gearboxEfficiency || 95;
      const capacityFactor = (avgBladeCondition / 100) * (drivetrainEff / 100) * 0.35; // Base 35% CF
      
      const dailyProduction = capacity * 24 * capacityFactor * windFactor;
      const monthlyProduction = dailyProduction * 30;
      
      const revenue = monthlyProduction * 0.10; // $0.10/kWh (wind is cheaper)
      const costs = (turbine.operatingCost || 0) * 30; // Monthly operating cost
      
      totalProduction += monthlyProduction;
      totalRevenue += revenue;
      totalCosts += costs;

      if (!dryRun) {
        turbine.currentOutput = capacity * capacityFactor * windFactor;
        turbine.cumulativeProduction = (turbine.cumulativeProduction || 0) + monthlyProduction;
        turbine.dailyProduction = dailyProduction;
        
        await turbine.save();
      }
    } catch (error) {
      errors.push({
        entityId: turbine._id.toString(),
        entityType: 'WindTurbine',
        message: error instanceof Error ? error.message : 'Unknown error',
        recoverable: true,
      });
    }
  }

  return {
    count: turbines.length,
    production: totalProduction,
    revenue: totalRevenue,
    costs: totalCosts,
    errors,
  };
}

/**
 * Process power plants
 */
async function processPowerPlants(
  filter: Record<string, unknown>,
  prices: { gas: number },
  dryRun?: boolean
): Promise<FacilityProcessResult & { fuelCosts: number; maintenanceCosts: number }> {
  const errors: TickError[] = [];
  let totalProduction = 0;
  let totalRevenue = 0;
  let totalFuelCosts = 0;
  let totalMaintenanceCosts = 0;

  const plants = await PowerPlant.find({ ...filter, status: 'Operational' });

  for (const plant of plants) {
    try {
      // Calculate monthly generation
      const capacity = plant.nameplateCapacity || 0;
      const utilizationRate = (plant.capacityFactor || 70) / 100;
      
      const dailyProduction = capacity * 24 * utilizationRate;
      const monthlyProduction = dailyProduction * 30;
      
      // Fuel costs depend on plant type
      const fuelCost = calculateFuelCost(plant.plantType, monthlyProduction, prices.gas);
      const maintenanceCost = (plant.operatingCost || 25) * monthlyProduction; // $/MWh
      
      const revenue = monthlyProduction * 0.08; // $0.08/kWh (base load is cheaper)
      
      totalProduction += monthlyProduction;
      totalRevenue += revenue;
      totalFuelCosts += fuelCost;
      totalMaintenanceCosts += maintenanceCost;

      if (!dryRun) {
        plant.currentOutput = capacity * utilizationRate;
        
        await plant.save();
      }
    } catch (error) {
      errors.push({
        entityId: plant._id.toString(),
        entityType: 'PowerPlant',
        message: error instanceof Error ? error.message : 'Unknown error',
        recoverable: true,
      });
    }
  }

  return {
    count: plants.length,
    production: totalProduction,
    revenue: totalRevenue,
    costs: totalFuelCosts + totalMaintenanceCosts,
    fuelCosts: totalFuelCosts,
    maintenanceCosts: totalMaintenanceCosts,
    errors,
  };
}

/**
 * Process PPA contracts
 */
async function processPPAs(
  filter: Record<string, unknown>,
  availablePower: number,
  dryRun?: boolean
): Promise<{ revenue: number; powerAllocated: number; errors: TickError[] }> {
  const errors: TickError[] = [];
  let totalRevenue = 0;
  let totalPowerAllocated = 0;

  // Get active PPAs for companies in filter
  const ppas = await PPA.find({ 
    active: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  });

  let remainingPower = availablePower;

  for (const ppa of ppas) {
    try {
      // Monthly contracted amount (contractedAnnualMWh / 12)
      const monthlyContracted = (ppa.contractedAnnualMWh || 0) / 12;
      const contractedKWh = monthlyContracted * 1000; // Convert MWh to kWh
      const deliverableAmount = Math.min(contractedKWh, remainingPower);
      
      // Calculate revenue at contracted rate
      const revenue = (deliverableAmount / 1000) * (ppa.basePricePerMWh || 50); // Convert kWh to MWh
      
      totalRevenue += revenue;
      totalPowerAllocated += deliverableAmount;
      remainingPower -= deliverableAmount;

      if (!dryRun && deliverableAmount < contractedKWh) {
        // Shortfall - may trigger penalties
        // For now, just log
        errors.push({
          entityId: ppa._id.toString(),
          entityType: 'PPA',
          message: `Shortfall: delivered ${deliverableAmount}/${contractedKWh} kWh`,
          recoverable: true,
        });
      }
    } catch (error) {
      errors.push({
        entityId: ppa._id.toString(),
        entityType: 'PPA',
        message: error instanceof Error ? error.message : 'Unknown error',
        recoverable: true,
      });
    }
  }

  return {
    revenue: totalRevenue,
    powerAllocated: totalPowerAllocated,
    errors,
  };
}

/**
 * Get sun hours for a given month and latitude
 */
function getSunHoursForMonth(month: number, latitude: number): number {
  // Simplified calculation - summer has more sun
  const baseSunHours = 5; // Average
  const seasonalVariation = Math.cos((month - 6) * Math.PI / 6) * 2; // +/- 2 hours
  const latitudeEffect = (90 - Math.abs(latitude)) / 90 * 2; // Lower latitude = more sun
  
  return Math.max(2, baseSunHours + seasonalVariation + latitudeEffect);
}

/**
 * Get weather factor (cloud cover impact)
 */
function getWeatherFactor(month: number): number {
  // Random-ish based on month
  const baseFactors = [0.7, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 0.95, 0.85, 0.75, 0.7, 0.65];
  return baseFactors[month - 1] ?? 0.8;
}

/**
 * Get wind factor for month
 */
function getWindFactor(month: number): number {
  // Wind is often stronger in winter/spring
  const baseFactors = [1.1, 1.15, 1.2, 1.15, 1.0, 0.85, 0.8, 0.8, 0.85, 0.95, 1.05, 1.1];
  return baseFactors[month - 1] ?? 1.0;
}

/**
 * Calculate fuel cost based on plant type
 */
function calculateFuelCost(plantType: string, production: number, gasPrice: number): number {
  // Heat rate (BTU per kWh) varies by plant type
  const heatRates: Record<string, number> = {
    'Gas Combined Cycle': 6500,
    'Gas Peaker': 9000,
    'Coal': 10000,
    'Nuclear': 10500, // Actually no fuel cost, but we model it
  };
  
  const heatRate = heatRates[plantType] || 8000;
  
  // Convert to fuel units (MCF for gas, tons for coal, etc.)
  // 1 MCF = ~1,000,000 BTU
  const fuelUnitsNeeded = (production * heatRate) / 1000000;
  
  if (plantType.includes('Gas')) {
    return fuelUnitsNeeded * gasPrice;
  } else if (plantType === 'Coal') {
    return fuelUnitsNeeded * 60; // ~$60/ton coal
  } else if (plantType === 'Nuclear') {
    return fuelUnitsNeeded * 0.5; // Very low fuel cost
  }
  
  return fuelUnitsNeeded * gasPrice;
}

export default energyProcessor;
