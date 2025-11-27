/**
 * @file src/lib/utils/manufacturing/capacityPlanner.ts
 * @description Manufacturing capacity planning and bottleneck analysis utilities
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Utilities for capacity planning, utilization analysis, bottleneck identification,
 * and load balancing. Helps determine whether production capacity can meet demand
 * and identifies constraints limiting throughput.
 * 
 * Capacity Planning Concepts:
 * - Design Capacity: Maximum theoretical output under ideal conditions
 * - Effective Capacity: Maximum realistic output accounting for maintenance, breaks
 * - Actual Output: Real production achieved
 * - Capacity Utilization: (Actual Output / Effective Capacity) × 100
 * - Efficiency: (Actual Output / Design Capacity) × 100
 * 
 * Bottleneck Analysis:
 * - Bottleneck: Resource with capacity < demand (limits total throughput)
 * - Constraint: Any factor limiting system performance
 * - Theory of Constraints (TOC): Focus on bottleneck to maximize throughput
 * 
 * USAGE:
 * ```typescript
 * import { calculateCapacityUtilization, identifyBottleneck } from '@/lib/utils/manufacturing/capacityPlanner';
 * 
 * const utilization = calculateCapacityUtilization(800, 1000, 1200);
 * console.log(utilization); // 80% utilization
 * 
 * const bottleneck = identifyBottleneck(resources);
 * console.log(bottleneck.name); // 'Machining Station 3'
 * ```
 */

/**
 * Calculate Capacity Utilization
 * 
 * Capacity Utilization = (Actual Output / Effective Capacity) × 100
 * 
 * @param actualOutput - Actual units produced
 * @param effectiveCapacity - Realistic maximum capacity
 * @param designCapacity - Theoretical maximum capacity (optional)
 * @returns Capacity utilization percentage (0-100+)
 * 
 * @example
 * ```typescript
 * const utilization = calculateCapacityUtilization(800, 1000, 1200);
 * console.log(utilization); // 80%
 * ```
 */
export function calculateCapacityUtilization(
  actualOutput: number,
  effectiveCapacity: number,
  designCapacity?: number
): number {
  if (effectiveCapacity <= 0) return 0;
  // designCapacity is optional and not used in this calculation; reference to satisfy strict checks
  void designCapacity;

  const utilization = (actualOutput / effectiveCapacity) * 100;

  return Number(utilization.toFixed(1));
}

/**
 * Calculate Efficiency
 * 
 * Efficiency = (Actual Output / Design Capacity) × 100
 * 
 * @param actualOutput - Actual units produced
 * @param designCapacity - Theoretical maximum capacity
 * @returns Efficiency percentage (0-100)
 */
export function calculateEfficiency(
  actualOutput: number,
  designCapacity: number
): number {
  if (designCapacity <= 0) return 0;

  const efficiency = (actualOutput / designCapacity) * 100;

  return Math.max(0, Math.min(100, Number(efficiency.toFixed(1))));
}

/**
 * Calculate Available Capacity
 * 
 * Available Capacity = Design Capacity - Planned Downtime - Unplanned Downtime
 * 
 * @param designCapacity - Theoretical maximum capacity (hours or units)
 * @param plannedDowntime - Scheduled maintenance, breaks (hours)
 * @param unplannedDowntime - Equipment failures, unscheduled stops (hours)
 * @returns Available capacity
 */
export function calculateAvailableCapacity(
  designCapacity: number,
  plannedDowntime: number,
  unplannedDowntime: number
): number {
  const availableCapacity = designCapacity - plannedDowntime - unplannedDowntime;

  return Math.max(0, Number(availableCapacity.toFixed(2)));
}

/**
 * Resource Capacity Definition
 */
export interface ResourceCapacity {
  resourceId: string;
  resourceName: string;
  designCapacity: number; // Units per period or hours
  effectiveCapacity: number; // Realistic capacity
  actualOutput: number; // Current production
  requiredCapacity: number; // Demand from schedule
  unitOfMeasure: string; // 'units/hour', 'hours', 'units'
}

/**
 * Capacity Analysis Result
 */
export interface CapacityAnalysis {
  resourceId: string;
  resourceName: string;
  designCapacity: number;
  effectiveCapacity: number;
  actualOutput: number;
  requiredCapacity: number;
  availableCapacity: number;
  utilization: number; // % (actual / effective)
  loadPercentage: number; // % (required / effective)
  capacityCushion: number; // Effective - Required
  isBottleneck: boolean; // Required > Effective
  isOverloaded: boolean; // Load > 100%
  unitOfMeasure: string;
}

/**
 * Analyze Resource Capacity
 * 
 * @param resource - Resource capacity data
 * @returns Capacity analysis
 * 
 * @example
 * ```typescript
 * const analysis = analyzeResourceCapacity({
 *   resourceId: 'RES-001',
 *   resourceName: 'Machining Station 3',
 *   designCapacity: 1200,
 *   effectiveCapacity: 1000,
 *   actualOutput: 800,
 *   requiredCapacity: 1100,
 *   unitOfMeasure: 'units/day'
 * });
 * console.log(analysis.isBottleneck); // true (1100 > 1000)
 * console.log(analysis.utilization); // 80%
 * console.log(analysis.loadPercentage); // 110%
 * ```
 */
export function analyzeResourceCapacity(
  resource: ResourceCapacity
): CapacityAnalysis {
  const utilization = calculateCapacityUtilization(
    resource.actualOutput,
    resource.effectiveCapacity
  );

  const loadPercentage =
    resource.effectiveCapacity > 0
      ? (resource.requiredCapacity / resource.effectiveCapacity) * 100
      : 0;

  const availableCapacity = resource.effectiveCapacity - resource.requiredCapacity;
  const capacityCushion = availableCapacity;

  const isBottleneck = resource.requiredCapacity > resource.effectiveCapacity;
  const isOverloaded = loadPercentage > 100;

  return {
    resourceId: resource.resourceId,
    resourceName: resource.resourceName,
    designCapacity: resource.designCapacity,
    effectiveCapacity: resource.effectiveCapacity,
    actualOutput: resource.actualOutput,
    requiredCapacity: resource.requiredCapacity,
    availableCapacity: Number(availableCapacity.toFixed(2)),
    utilization: Number(utilization.toFixed(1)),
    loadPercentage: Number(loadPercentage.toFixed(1)),
    capacityCushion: Number(capacityCushion.toFixed(2)),
    isBottleneck,
    isOverloaded,
    unitOfMeasure: resource.unitOfMeasure,
  };
}

/**
 * Identify Bottleneck Resource
 * 
 * Bottleneck = Resource with highest load percentage (required > capacity)
 * 
 * @param resources - Array of resource capacities
 * @returns Bottleneck resource (or null if no bottleneck)
 * 
 * @example
 * ```typescript
 * const bottleneck = identifyBottleneck(resources);
 * if (bottleneck) {
 *   console.log(`Bottleneck: ${bottleneck.resourceName} (${bottleneck.loadPercentage}% load)`);
 * }
 * ```
 */
export function identifyBottleneck(
  resources: ResourceCapacity[]
): CapacityAnalysis | null {
  if (resources.length === 0) return null;

  // Analyze all resources
  const analyses = resources.map((r) => analyzeResourceCapacity(r));

  // Find resource with highest load percentage
  const bottleneck = analyses.reduce((max, current) =>
    current.loadPercentage > max.loadPercentage ? current : max
  );

  // Only return if actually overloaded
  return bottleneck.isBottleneck ? bottleneck : null;
}

/**
 * Identify All Bottlenecks
 * 
 * @param resources - Array of resource capacities
 * @returns All bottleneck resources (load > 100%)
 */
export function identifyAllBottlenecks(
  resources: ResourceCapacity[]
): CapacityAnalysis[] {
  const analyses = resources.map((r) => analyzeResourceCapacity(r));

  return analyses.filter((a) => a.isBottleneck).sort((a, b) => b.loadPercentage - a.loadPercentage);
}

/**
 * Calculate Takt Time
 * 
 * Takt Time = Available Production Time / Customer Demand
 * 
 * Takt time is the rate at which products must be completed to meet customer demand.
 * 
 * @param availableProductionTime - Available time (minutes, hours)
 * @param customerDemand - Customer demand (units)
 * @returns Takt time (time per unit)
 * 
 * @example
 * ```typescript
 * const takt = calculateTaktTime(480, 240);
 * console.log(takt); // 2 minutes per unit
 * ```
 */
export function calculateTaktTime(
  availableProductionTime: number,
  customerDemand: number
): number {
  if (customerDemand <= 0) return 0;

  const taktTime = availableProductionTime / customerDemand;

  return Number(taktTime.toFixed(2));
}

/**
 * Calculate Cycle Time
 * 
 * Cycle Time = Total Production Time / Units Produced
 * 
 * Cycle time is the actual time to produce one unit.
 * 
 * @param totalProductionTime - Total production time
 * @param unitsProduced - Units produced
 * @returns Cycle time (time per unit)
 */
export function calculateCycleTime(
  totalProductionTime: number,
  unitsProduced: number
): number {
  if (unitsProduced <= 0) return 0;

  const cycleTime = totalProductionTime / unitsProduced;

  return Number(cycleTime.toFixed(2));
}

/**
 * Calculate Throughput
 * 
 * Throughput = Units Produced / Time Period
 * 
 * @param unitsProduced - Units produced
 * @param timePeriod - Time period (hours, days)
 * @returns Throughput (units per period)
 */
export function calculateThroughput(unitsProduced: number, timePeriod: number): number {
  if (timePeriod <= 0) return 0;

  const throughput = unitsProduced / timePeriod;

  return Number(throughput.toFixed(2));
}

/**
 * Load Balancing Recommendation
 */
export interface LoadBalancingRecommendation {
  fromResourceId: string;
  fromResourceName: string;
  toResourceId: string;
  toResourceName: string;
  unitsToShift: number;
  fromLoadBefore: number;
  fromLoadAfter: number;
  toLoadBefore: number;
  toLoadAfter: number;
  improvementPercentage: number;
}

/**
 * Generate Load Balancing Recommendations
 * 
 * Redistributes load from overloaded resources to underutilized resources.
 * 
 * @param resources - Array of resource capacities
 * @returns Load balancing recommendations
 */
export function generateLoadBalancingRecommendations(
  resources: ResourceCapacity[]
): LoadBalancingRecommendation[] {
  const recommendations: LoadBalancingRecommendation[] = [];

  const analyses = resources.map((r) => analyzeResourceCapacity(r));

  // Find overloaded resources (load > 100%)
  const overloaded = analyses.filter((a) => a.isOverloaded);

  // Find underutilized resources (load < 80%)
  const underutilized = analyses.filter((a) => a.loadPercentage < 80 && !a.isOverloaded);

  // Match overloaded with underutilized
  for (const over of overloaded) {
    for (const under of underutilized) {
      // Calculate how much can be shifted
      const excessLoad = over.requiredCapacity - over.effectiveCapacity;
      const availableCapacity = under.effectiveCapacity - under.requiredCapacity;
      const unitsToShift = Math.min(excessLoad, availableCapacity);

      if (unitsToShift > 0) {
        const fromLoadBefore = over.loadPercentage;
        const fromLoadAfter =
          ((over.requiredCapacity - unitsToShift) / over.effectiveCapacity) * 100;

        const toLoadBefore = under.loadPercentage;
        const toLoadAfter =
          ((under.requiredCapacity + unitsToShift) / under.effectiveCapacity) * 100;

        const improvementPercentage = fromLoadBefore - fromLoadAfter;

        recommendations.push({
          fromResourceId: over.resourceId,
          fromResourceName: over.resourceName,
          toResourceId: under.resourceId,
          toResourceName: under.resourceName,
          unitsToShift: Number(unitsToShift.toFixed(0)),
          fromLoadBefore: Number(fromLoadBefore.toFixed(1)),
          fromLoadAfter: Number(fromLoadAfter.toFixed(1)),
          toLoadBefore: Number(toLoadBefore.toFixed(1)),
          toLoadAfter: Number(toLoadAfter.toFixed(1)),
          improvementPercentage: Number(improvementPercentage.toFixed(1)),
        });
      }
    }
  }

  return recommendations.sort((a, b) => b.improvementPercentage - a.improvementPercentage);
}

/**
 * Capacity Expansion Analysis
 */
export interface CapacityExpansionOption {
  optionName: string;
  additionalCapacity: number;
  investmentCost: number;
  implementationTime: number; // days
  costPerUnit: number; // Investment cost / Additional capacity
}

/**
 * Evaluate Capacity Expansion Options
 * 
 * @param currentCapacity - Current effective capacity
 * @param requiredCapacity - Required capacity to meet demand
 * @param expansionOptions - Expansion options to consider
 * @returns Recommended expansion option
 */
export function evaluateCapacityExpansion(
  currentCapacity: number,
  requiredCapacity: number,
  expansionOptions: Omit<CapacityExpansionOption, 'costPerUnit'>[]
): CapacityExpansionOption[] {
  const capacityGap = requiredCapacity - currentCapacity;

  if (capacityGap <= 0) {
    return []; // No expansion needed
  }

  // Calculate cost per unit for each option
  const options: CapacityExpansionOption[] = expansionOptions.map((opt) => ({
    ...opt,
    costPerUnit:
      opt.additionalCapacity > 0 ? opt.investmentCost / opt.additionalCapacity : 0,
  }));

  // Filter options that meet capacity gap
  const viable = options.filter((opt) => opt.additionalCapacity >= capacityGap);

  // Sort by cost per unit (ascending)
  return viable.sort((a, b) => a.costPerUnit - b.costPerUnit);
}

/**
 * Finite vs Infinite Capacity Planning
 */
export type CapacityPlanningMode = 'Finite' | 'Infinite';

/**
 * Validate Schedule Against Capacity (Finite Capacity Planning)
 * 
 * @param resources - Resource capacities
 * @param scheduledLoad - Scheduled load per resource
 * @returns Validation result with violations
 */
export interface CapacityViolation {
  resourceId: string;
  resourceName: string;
  capacity: number;
  scheduledLoad: number;
  overload: number;
}

export function validateScheduleCapacity(
  resources: ResourceCapacity[],
  mode: CapacityPlanningMode = 'Finite'
): CapacityViolation[] {
  if (mode === 'Infinite') {
    return []; // Infinite capacity assumes no violations
  }

  const violations: CapacityViolation[] = [];

  for (const resource of resources) {
    if (resource.requiredCapacity > resource.effectiveCapacity) {
      violations.push({
        resourceId: resource.resourceId,
        resourceName: resource.resourceName,
        capacity: resource.effectiveCapacity,
        scheduledLoad: resource.requiredCapacity,
        overload: resource.requiredCapacity - resource.effectiveCapacity,
      });
    }
  }

  return violations.sort((a, b) => b.overload - a.overload);
}

/**
 * IMPLEMENTATION NOTES:
 * - Capacity planning: Determine whether capacity meets demand
 * - Design capacity: Theoretical maximum (ideal conditions)
 * - Effective capacity: Realistic maximum (accounting for downtime, breaks)
 * - Actual output: Real production achieved
 * - Capacity utilization: (Actual / Effective) × 100
 * - Efficiency: (Actual / Design) × 100
 * - Bottleneck: Resource limiting total throughput (demand > capacity)
 * - Theory of Constraints (TOC): Focus on bottleneck to maximize throughput
 * - Drum-Buffer-Rope (DBR): Schedule production based on bottleneck
 * - Takt time: Rate at which products must be completed (demand-driven)
 * - Cycle time: Actual time to produce one unit
 * - Throughput: Units produced per time period
 * - Load balancing: Redistribute work to even out utilization
 * - Finite capacity planning: Schedule within capacity limits (realistic)
 * - Infinite capacity planning: Assume unlimited capacity (shows gaps)
 * - Capacity cushion: Extra capacity to handle variability
 * - Capacity gap: Shortfall between current and required capacity
 * - Capacity expansion: Add resources to meet demand
 * - Make vs Buy: Outsource if internal capacity insufficient
 * - Flexible capacity: Cross-trained workers, multi-purpose equipment
 * - Seasonal capacity: Adjust capacity for seasonal demand peaks
 */
