/**
 * @fileoverview Power Plant Domain Calculation Utilities
 * @module lib/energy/power
 * 
 * OVERVIEW:
 * Shared calculation utilities for power plant dispatch and maintenance
 * operations. Implements ramp rate feasibility, fuel consumption modeling,
 * emissions calculations, and revenue optimization for thermal/nuclear plants.
 * 
 * CALCULATIONS:
 * - Ramp feasibility: Validates achievable load changes within time constraints
 * - Dispatch schedule: Hourly output planning with ramp constraints
 * - Fuel & emissions: Heat rate-based consumption and CO2 output
 * - Net revenue: Gross generation revenue minus fuel and emission costs
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1 - Batch 2 DRY Utilities
 */

/**
 * Plant ramp rate parameters
 */
export interface RampParams {
  currentOutputMW: number;
  targetOutputMW: number;
  maxRampRateMWperMin: number;
  timeWindowMinutes: number;
}

/**
 * Validate ramp feasibility
 * 
 * @param params - Ramp rate parameters
 * @returns Feasibility result with achievable output and time required
 * 
 * @example
 * const check = validateRampFeasibility({
 *   currentOutputMW: 400,
 *   targetOutputMW: 600,
 *   maxRampRateMWperMin: 5,
 *   timeWindowMinutes: 30
 * });
 */
export function validateRampFeasibility(params: RampParams): {
  feasible: boolean;
  achievableOutputMW: number;
  timeRequiredMinutes: number;
  warnings: string[];
} {
  const { currentOutputMW, targetOutputMW, maxRampRateMWperMin, timeWindowMinutes } = params;
  const warnings: string[] = [];
  
  const deltaOutput = targetOutputMW - currentOutputMW;
  const absDelta = Math.abs(deltaOutput);
  const direction = deltaOutput > 0 ? 'ramp-up' : 'ramp-down';
  
  // Time required to reach target
  const timeRequired = absDelta / maxRampRateMWperMin;
  
  // Maximum achievable output in time window
  const maxDelta = maxRampRateMWperMin * timeWindowMinutes;
  const achievableOutput = deltaOutput > 0
    ? Math.min(currentOutputMW + maxDelta, targetOutputMW)
    : Math.max(currentOutputMW - maxDelta, targetOutputMW);
  
  const feasible = timeRequired <= timeWindowMinutes;
  
  if (!feasible) {
    warnings.push(
      `${direction} not achievable in ${timeWindowMinutes} min. ` +
      `Requires ${Math.ceil(timeRequired)} min. ` +
      `Achievable output: ${Math.round(achievableOutput)} MW`
    );
  }
  
  return {
    feasible,
    achievableOutputMW: Math.round(achievableOutput * 100) / 100,
    timeRequiredMinutes: Math.round(timeRequired * 10) / 10,
    warnings
  };
}

/**
 * Dispatch schedule segment
 */
export interface DispatchSegment {
  hour: number;
  outputMW: number;
  rampTimeMins?: number;
}

/**
 * Build hourly dispatch schedule with ramp constraints
 * 
 * @param startOutputMW - Starting output level
 * @param targetOutputMW - Target output level
 * @param timeWindowHours - Total dispatch window
 * @param maxRampRateMWperMin - Maximum ramp rate
 * @param strategy - Dispatch strategy ('fast', 'balanced', 'fuel-optimal')
 * @returns Hourly dispatch schedule
 */
export function buildDispatchSchedule(
  startOutputMW: number,
  targetOutputMW: number,
  timeWindowHours: number,
  maxRampRateMWperMin: number,
  strategy: 'fast' | 'balanced' | 'fuel-optimal' = 'balanced'
): DispatchSegment[] {
  const schedule: DispatchSegment[] = [];
  const totalDelta = targetOutputMW - startOutputMW;
  
  // Calculate ramp time required
  const rampTimeHours = Math.abs(totalDelta) / (maxRampRateMWperMin * 60);
  const rampHours = Math.min(Math.ceil(rampTimeHours), timeWindowHours);
  
  // Strategy-based ramp distribution
  let rampSteps = rampHours;
  if (strategy === 'fast') {
    rampSteps = Math.max(1, Math.floor(rampTimeHours));
  } else if (strategy === 'fuel-optimal') {
    rampSteps = Math.min(timeWindowHours, Math.ceil(rampTimeHours * 1.5));
  }
  
  const deltaPerStep = totalDelta / rampSteps;
  
  // Build hourly schedule
  for (let hour = 0; hour < timeWindowHours; hour++) {
    let outputMW: number;
    
    if (hour < rampSteps) {
      // Ramping phase
      outputMW = startOutputMW + (deltaPerStep * (hour + 1));
    } else {
      // Steady state at target
      outputMW = targetOutputMW;
    }
    
    schedule.push({
      hour: hour + 1,
      outputMW: Math.round(outputMW * 100) / 100,
      ...(hour < rampSteps && { rampTimeMins: 60 })
    });
  }
  
  return schedule;
}

/**
 * Fuel and emissions calculation parameters
 */
export interface FuelEmissionsParams {
  outputMWh: number;
  heatRateMMBtuPerMWh: number; // Heat rate (efficiency inverse)
  fuelPricePerMMBtu: number;
  emissionFactorTonsPerMMBtu: number; // CO2 emissions
  emissionCreditPrice: number; // $/ton CO2
}

/**
 * Calculate fuel consumption and emissions
 * 
 * @param params - Fuel and emissions parameters
 * @returns Fuel cost and emissions cost breakdown
 * 
 * @example
 * const costs = calculateFuelAndEmissions({
 *   outputMWh: 5000,
 *   heatRateMMBtuPerMWh: 10.5,
 *   fuelPricePerMMBtu: 4.50,
 *   emissionFactorTonsPerMMBtu: 0.053,
 *   emissionCreditPrice: 35
 * });
 */
export function calculateFuelAndEmissions(params: FuelEmissionsParams): {
  fuelUsedMMBtu: number;
  fuelCostUSD: number;
  emissionsTonsCO2: number;
  emissionsCostUSD: number;
  totalCostUSD: number;
} {
  const {
    outputMWh,
    heatRateMMBtuPerMWh,
    fuelPricePerMMBtu,
    emissionFactorTonsPerMMBtu,
    emissionCreditPrice
  } = params;
  
  const fuelUsed = outputMWh * heatRateMMBtuPerMWh;
  const fuelCost = fuelUsed * fuelPricePerMMBtu;
  
  const emissions = fuelUsed * emissionFactorTonsPerMMBtu;
  const emissionsCost = emissions * emissionCreditPrice;
  
  const totalCost = fuelCost + emissionsCost;
  
  return {
    fuelUsedMMBtu: Math.round(fuelUsed * 100) / 100,
    fuelCostUSD: Math.round(fuelCost * 100) / 100,
    emissionsTonsCO2: Math.round(emissions * 100) / 100,
    emissionsCostUSD: Math.round(emissionsCost * 100) / 100,
    totalCostUSD: Math.round(totalCost * 100) / 100
  };
}

/**
 * Calculate net revenue from dispatch
 * 
 * @param outputMWh - Total energy output
 * @param electricityPrice - Price per MWh
 * @param fuelCost - Total fuel cost
 * @param emissionsCost - Total emissions cost
 * @param operatingCost - Variable O&M cost per MWh
 * @returns Revenue breakdown
 */
export function calculateNetRevenue(
  outputMWh: number,
  electricityPrice: number,
  fuelCost: number,
  emissionsCost: number,
  operatingCost: number = 0
): {
  grossRevenue: number;
  fuelCost: number;
  emissionsCost: number;
  operatingCost: number;
  netRevenue: number;
} {
  const grossRevenue = outputMWh * electricityPrice;
  const totalOperatingCost = outputMWh * operatingCost;
  const netRevenue = grossRevenue - fuelCost - emissionsCost - totalOperatingCost;
  
  return {
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    fuelCost: Math.round(fuelCost * 100) / 100,
    emissionsCost: Math.round(emissionsCost * 100) / 100,
    operatingCost: Math.round(totalOperatingCost * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100
  };
}

/**
 * Calculate efficiency restoration from maintenance
 * 
 * @param currentEfficiencyPct - Current efficiency percentage
 * @param designEfficiencyPct - Design efficiency at commissioning
 * @param maintenanceType - Type of maintenance performed
 * @returns Updated efficiency and delta
 */
export function calculateEfficiencyRestoration(
  currentEfficiencyPct: number,
  designEfficiencyPct: number,
  maintenanceType: 'inspection' | 'overhaul' | 'calibration' | 'cleaning'
): {
  newEfficiencyPct: number;
  efficiencyDeltaPct: number;
} {
  // Restoration percentages based on maintenance type
  const restorationMap = {
    'inspection': 2,
    'calibration': 5,
    'cleaning': 8,
    'overhaul': 15
  };
  
  const restorationPct = restorationMap[maintenanceType];
  const gap = designEfficiencyPct - currentEfficiencyPct;
  const restoration = gap * (restorationPct / 100);
  
  const newEfficiency = Math.min(currentEfficiencyPct + restoration, designEfficiencyPct);
  const delta = newEfficiency - currentEfficiencyPct;
  
  return {
    newEfficiencyPct: Math.round(newEfficiency * 100) / 100,
    efficiencyDeltaPct: Math.round(delta * 100) / 100
  };
}
