/**
 * @file src/lib/utils/manufacturing/capacityPlanner.ts
 * @description Manufacturing capacity planning utility
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Calculates capacity requirements, identifies gaps, and generates expansion recommendations.
 * Supports rough-cut capacity planning (RCCP) and resource capacity planning (RCP).
 * 
 * KEY CONCEPTS:
 * - Capacity = Output/Time (units/period)
 * - Utilization = Actual/Capacity × 100%
 * - Efficiency = Standard Hours/Actual Hours × 100%
 * - Bottleneck = Constraint limiting overall throughput
 */

import type { CapacityPlanningInputs, CapacityPlanningResult } from '@/types/manufacturing';

/**
 * Calculate capacity planning results
 * 
 * @param inputs - Demand forecast, current capacity, targets
 * @returns Capacity gaps and expansion recommendations
 * 
 * @example
 * const result = planCapacity({
 *   demandForecast: [1000, 1100, 1200, 1300],
 *   currentCapacity: 1000,
 *   utilizationTarget: 85,
 *   leadTimeForExpansion: 2
 * });
 */
export function planCapacity(inputs: CapacityPlanningInputs): CapacityPlanningResult {
  const { demandForecast, currentCapacity, utilizationTarget, leadTimeForExpansion } = inputs;

  // Calculate effective capacity at target utilization
  const effectiveCapacity = currentCapacity * (utilizationTarget / 100);

  // Calculate capacity gap for each period
  const capacityGap = demandForecast.map(demand => demand - effectiveCapacity);

  // Determine if expansion is needed
  const maxGap = Math.max(...capacityGap);
  const expansionNeeded = maxGap > 0;

  // Calculate recommended expansion
  let recommendedExpansion = 0;
  let implementationPeriod = 0;

  if (expansionNeeded) {
    // Find first period with gap
    const firstGapPeriod = capacityGap.findIndex(gap => gap > 0);
    implementationPeriod = Math.max(0, firstGapPeriod - leadTimeForExpansion);

    // Calculate expansion to cover future needs with buffer
    const futureMaxGap = Math.max(...capacityGap.slice(implementationPeriod));
    recommendedExpansion = Math.ceil(futureMaxGap * 1.2); // 20% buffer
  }

  return {
    capacityGap,
    expansionNeeded,
    recommendedExpansion,
    implementationPeriod,
  };
}

/**
 * Capacity utilization calculation
 */
export interface CapacityUtilization {
  utilization: number;
  efficiency: number;
  effectiveCapacity: number;
  availableCapacity: number;
  status: 'underutilized' | 'optimal' | 'strained' | 'overloaded';
}

export function calculateUtilization(
  actualOutput: number,
  ratedCapacity: number,
  standardHours: number,
  actualHours: number
): CapacityUtilization {
  const utilization = ratedCapacity > 0 ? (actualOutput / ratedCapacity) * 100 : 0;
  const efficiency = actualHours > 0 ? (standardHours / actualHours) * 100 : 0;
  const effectiveCapacity = ratedCapacity * (efficiency / 100);
  const availableCapacity = ratedCapacity - actualOutput;

  let status: CapacityUtilization['status'];
  if (utilization < 60) status = 'underutilized';
  else if (utilization <= 85) status = 'optimal';
  else if (utilization <= 100) status = 'strained';
  else status = 'overloaded';

  return {
    utilization: Math.round(utilization * 100) / 100,
    efficiency: Math.round(efficiency * 100) / 100,
    effectiveCapacity: Math.round(effectiveCapacity),
    availableCapacity: Math.round(availableCapacity),
    status,
  };
}

/**
 * Bottleneck analysis
 */
export interface Resource {
  id: string;
  name: string;
  capacity: number;
  demand: number;
}

export interface BottleneckResult {
  bottleneck: Resource | null;
  utilizationByResource: Array<{ resource: Resource; utilization: number }>;
  recommendations: string[];
}

export function identifyBottleneck(resources: Resource[]): BottleneckResult {
  if (resources.length === 0) {
    return { bottleneck: null, utilizationByResource: [], recommendations: [] };
  }

  // Calculate utilization for each resource
  const utilizationByResource = resources.map(resource => ({
    resource,
    utilization: resource.capacity > 0 ? (resource.demand / resource.capacity) * 100 : 0,
  }));

  // Sort by utilization descending
  utilizationByResource.sort((a, b) => b.utilization - a.utilization);

  // Bottleneck is highest utilized resource
  const bottleneck = utilizationByResource[0].utilization >= 80
    ? utilizationByResource[0].resource
    : null;

  // Generate recommendations
  const recommendations: string[] = [];
  for (const item of utilizationByResource) {
    if (item.utilization > 100) {
      recommendations.push(`${item.resource.name}: Overloaded by ${Math.round(item.utilization - 100)}%. Add capacity immediately.`);
    } else if (item.utilization > 90) {
      recommendations.push(`${item.resource.name}: Near capacity (${Math.round(item.utilization)}%). Plan for expansion.`);
    } else if (item.utilization < 50) {
      recommendations.push(`${item.resource.name}: Underutilized (${Math.round(item.utilization)}%). Consider consolidation.`);
    }
  }

  return { bottleneck, utilizationByResource, recommendations };
}

/**
 * Rough-cut capacity planning (RCCP)
 */
export interface MasterScheduleItem {
  period: number;
  product: string;
  quantity: number;
}

export interface ResourceProfile {
  resource: string;
  hoursPerUnit: Record<string, number>; // Product -> hours
  availableHours: number;
}

export interface RCCPResult {
  periods: Array<{
    period: number;
    resourceLoading: Array<{
      resource: string;
      requiredHours: number;
      availableHours: number;
      utilization: number;
      overload: boolean;
    }>;
  }>;
  feasible: boolean;
  overloadedPeriods: number[];
}

export function runRCCP(
  masterSchedule: MasterScheduleItem[],
  resourceProfiles: ResourceProfile[]
): RCCPResult {
  // Group schedule by period
  const periodMap = new Map<number, MasterScheduleItem[]>();
  for (const item of masterSchedule) {
    if (!periodMap.has(item.period)) {
      periodMap.set(item.period, []);
    }
    periodMap.get(item.period)!.push(item);
  }

  const periods: RCCPResult['periods'] = [];
  const overloadedPeriods: number[] = [];
  let feasible = true;

  // Analyze each period
  for (const [period, items] of periodMap) {
    const resourceLoading = resourceProfiles.map(profile => {
      let requiredHours = 0;
      for (const item of items) {
        const hoursPerUnit = profile.hoursPerUnit[item.product] || 0;
        requiredHours += hoursPerUnit * item.quantity;
      }

      const utilization = profile.availableHours > 0
        ? (requiredHours / profile.availableHours) * 100
        : 0;
      const overload = utilization > 100;

      if (overload) {
        feasible = false;
        if (!overloadedPeriods.includes(period)) {
          overloadedPeriods.push(period);
        }
      }

      return {
        resource: profile.resource,
        requiredHours: Math.round(requiredHours * 100) / 100,
        availableHours: profile.availableHours,
        utilization: Math.round(utilization * 100) / 100,
        overload,
      };
    });

    periods.push({ period, resourceLoading });
  }

  return { periods, feasible, overloadedPeriods };
}

/**
 * Capacity expansion options analysis
 */
export interface ExpansionOption {
  type: 'overtime' | 'shift' | 'equipment' | 'facility';
  description: string;
  capacityGain: number;
  cost: number;
  leadTime: number; // Periods
  ongoing: boolean;
}

export interface ExpansionAnalysis {
  requiredCapacity: number;
  options: Array<ExpansionOption & { roi: number; paybackPeriods: number }>;
  recommendation: string;
}

export function analyzeExpansionOptions(
  capacityGap: number,
  revenuePerUnit: number,
  options: ExpansionOption[]
): ExpansionAnalysis {
  const analyzedOptions = options
    .filter(option => option.capacityGain >= capacityGap * 0.5) // At least 50% coverage
    .map(option => {
      const additionalRevenue = Math.min(capacityGap, option.capacityGain) * revenuePerUnit;
      const roi = option.cost > 0 ? ((additionalRevenue - option.cost) / option.cost) * 100 : 0;
      const paybackPeriods = additionalRevenue > 0 ? Math.ceil(option.cost / additionalRevenue) : 999;

      return { ...option, roi: Math.round(roi * 100) / 100, paybackPeriods };
    })
    .sort((a, b) => b.roi - a.roi);

  // Generate recommendation
  let recommendation = 'No viable expansion options identified.';
  if (analyzedOptions.length > 0) {
    const best = analyzedOptions[0];
    if (best.leadTime === 0) {
      recommendation = `Immediate: ${best.description} (ROI: ${best.roi}%, Payback: ${best.paybackPeriods} periods)`;
    } else {
      recommendation = `Plan: ${best.description} with ${best.leadTime} period lead time (ROI: ${best.roi}%)`;
    }
  }

  return {
    requiredCapacity: capacityGap,
    options: analyzedOptions,
    recommendation,
  };
}

/**
 * Shift scheduling optimization
 */
export interface ShiftConfig {
  shiftsPerDay: number;
  hoursPerShift: number;
  daysPerWeek: number;
  efficiency: number; // 0-100%
}

export interface ShiftOptimization {
  currentWeeklyCapacity: number;
  targetWeeklyCapacity: number;
  optimizedConfig: ShiftConfig;
  capacityGain: number;
  laborCostIncrease: number;
}

export function optimizeShifts(
  demandPerWeek: number,
  currentConfig: ShiftConfig,
  unitsPerHour: number,
  laborCostPerHour: number
): ShiftOptimization {
  const currentWeeklyCapacity = calculateShiftCapacity(currentConfig, unitsPerHour);
  const targetWeeklyCapacity = demandPerWeek;

  // Try different configurations
  const configs: ShiftConfig[] = [
    { ...currentConfig },
    { ...currentConfig, shiftsPerDay: Math.min(3, currentConfig.shiftsPerDay + 1) },
    { ...currentConfig, hoursPerShift: Math.min(12, currentConfig.hoursPerShift + 2) },
    { ...currentConfig, daysPerWeek: Math.min(7, currentConfig.daysPerWeek + 1) },
    { ...currentConfig, shiftsPerDay: 3, daysPerWeek: 7 }, // Maximum
  ];

  // Find minimum config that meets demand
  let optimizedConfig = currentConfig;
  for (const config of configs) {
    const capacity = calculateShiftCapacity(config, unitsPerHour);
    if (capacity >= targetWeeklyCapacity) {
      optimizedConfig = config;
      break;
    }
  }

  const optimizedCapacity = calculateShiftCapacity(optimizedConfig, unitsPerHour);
  const currentHours = currentConfig.shiftsPerDay * currentConfig.hoursPerShift * currentConfig.daysPerWeek;
  const newHours = optimizedConfig.shiftsPerDay * optimizedConfig.hoursPerShift * optimizedConfig.daysPerWeek;
  const laborCostIncrease = (newHours - currentHours) * laborCostPerHour;

  return {
    currentWeeklyCapacity: Math.round(currentWeeklyCapacity),
    targetWeeklyCapacity,
    optimizedConfig,
    capacityGain: Math.round(optimizedCapacity - currentWeeklyCapacity),
    laborCostIncrease: Math.round(laborCostIncrease * 100) / 100,
  };
}

function calculateShiftCapacity(config: ShiftConfig, unitsPerHour: number): number {
  const totalHours = config.shiftsPerDay * config.hoursPerShift * config.daysPerWeek;
  return totalHours * unitsPerHour * (config.efficiency / 100);
}

export default {
  planCapacity,
  calculateUtilization,
  identifyBottleneck,
  runRCCP,
  analyzeExpansionOptions,
  optimizeShifts,
};
