/**
 * @file src/lib/utils/manufacturing/oeeCalculation.ts
 * @description OEE (Overall Equipment Effectiveness) calculation utilities
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Utilities for calculating OEE (Overall Equipment Effectiveness), the gold standard
 * metric for manufacturing productivity. OEE = Availability × Performance × Quality.
 * 
 * World-class OEE benchmark: 85%+
 * - Availability: 90%+ (minimizing downtime)
 * - Performance: 95%+ (running at rated speed)
 * - Quality: 99%+ (first-pass yield)
 * 
 * CALCULATIONS:
 * - Availability = (Operating Time / Planned Production Time) × 100
 * - Performance = (Actual Output / Theoretical Output) × 100
 * - Quality = (Good Units / Total Units) × 100
 * - OEE = (Availability × Performance × Quality) / 10000
 * 
 * USAGE:
 * ```typescript
 * import { calculateOEE, calculateAvailability, interpretOEE } from '@/lib/utils/manufacturing/oeeCalculation';
 * 
 * const oee = calculateOEE({
 *   plannedProductionTime: 480, // 8 hours in minutes
 *   plannedDowntime: 30,         // Planned maintenance
 *   unplannedDowntime: 45,       // Breakdowns
 *   totalUnitsProduced: 950,
 *   defectiveUnits: 20,
 *   ratedSpeed: 100,             // Units per hour
 *   actualSpeed: 92
 * });
 * 
 * console.log(oee);
 * // {
 * //   availability: 88.9,
 * //   performance: 92.0,
 * //   quality: 97.9,
 * //   oee: 80.1,
 * //   interpretation: 'Good',
 * //   worldClassGap: 4.9
 * // }
 * ```
 */

/**
 * OEE calculation input parameters
 */
export interface OEEInput {
  /** Planned production time (minutes) */
  plannedProductionTime: number;
  /** Planned downtime (maintenance, breaks, changeovers) - minutes */
  plannedDowntime: number;
  /** Unplanned downtime (breakdowns, material shortages) - minutes */
  unplannedDowntime: number;
  /** Total units produced */
  totalUnitsProduced: number;
  /** Defective units (rejected + scrap + rework) */
  defectiveUnits: number;
  /** Rated speed (units per hour) */
  ratedSpeed: number;
  /** Actual average speed (units per hour) */
  actualSpeed: number;
}

/**
 * OEE calculation result
 */
export interface OEEResult {
  /** Availability percentage (0-100) */
  availability: number;
  /** Performance percentage (0-100) */
  performance: number;
  /** Quality percentage (0-100) */
  quality: number;
  /** OEE percentage (0-100) */
  oee: number;
  /** Operating time (minutes) */
  operatingTime: number;
  /** Theoretical output (units) */
  theoreticalOutput: number;
  /** Good units produced */
  goodUnits: number;
  /** Interpretation (Poor, Fair, Good, Excellent, World-Class) */
  interpretation: string;
  /** Gap to world-class (85%) */
  worldClassGap: number;
}

/**
 * Calculate Availability
 * 
 * Availability = (Operating Time / Planned Production Time) × 100
 * Operating Time = Planned Production Time - Planned Downtime - Unplanned Downtime
 * 
 * @param plannedProductionTime - Total planned production time (minutes)
 * @param plannedDowntime - Planned downtime (minutes)
 * @param unplannedDowntime - Unplanned downtime (minutes)
 * @returns Availability percentage (0-100)
 * 
 * @example
 * ```typescript
 * const availability = calculateAvailability(480, 30, 45);
 * console.log(availability); // 84.4
 * ```
 */
export function calculateAvailability(
  plannedProductionTime: number,
  plannedDowntime: number,
  unplannedDowntime: number
): number {
  if (plannedProductionTime <= 0) return 0;

  const operatingTime = plannedProductionTime - plannedDowntime - unplannedDowntime;
  const availability = (operatingTime / plannedProductionTime) * 100;

  return Math.max(0, Math.min(100, availability));
}

/**
 * Calculate Performance
 * 
 * Performance = (Actual Speed / Rated Speed) × 100
 * OR
 * Performance = (Actual Output / Theoretical Output) × 100
 * 
 * @param actualSpeed - Actual average speed (units per hour)
 * @param ratedSpeed - Rated speed (units per hour)
 * @returns Performance percentage (0-100)
 * 
 * @example
 * ```typescript
 * const performance = calculatePerformance(92, 100);
 * console.log(performance); // 92.0
 * ```
 */
export function calculatePerformance(actualSpeed: number, ratedSpeed: number): number {
  if (ratedSpeed <= 0) return 0;

  const performance = (actualSpeed / ratedSpeed) * 100;

  return Math.max(0, Math.min(100, performance));
}

/**
 * Calculate Performance from output quantities
 * 
 * @param actualOutput - Actual units produced
 * @param theoreticalOutput - Theoretical maximum units
 * @returns Performance percentage (0-100)
 */
export function calculatePerformanceFromOutput(
  actualOutput: number,
  theoreticalOutput: number
): number {
  if (theoreticalOutput <= 0) return 0;

  const performance = (actualOutput / theoreticalOutput) * 100;

  return Math.max(0, Math.min(100, performance));
}

/**
 * Calculate Quality
 * 
 * Quality = (Good Units / Total Units) × 100
 * Good Units = Total Units - Defective Units
 * 
 * @param totalUnits - Total units produced
 * @param defectiveUnits - Defective units (rejected + scrap + rework)
 * @returns Quality percentage (0-100)
 * 
 * @example
 * ```typescript
 * const quality = calculateQuality(1000, 23);
 * console.log(quality); // 97.7
 * ```
 */
export function calculateQuality(totalUnits: number, defectiveUnits: number): number {
  if (totalUnits <= 0) return 100;

  const goodUnits = totalUnits - defectiveUnits;
  const quality = (goodUnits / totalUnits) * 100;

  return Math.max(0, Math.min(100, quality));
}

/**
 * Calculate complete OEE
 * 
 * OEE = (Availability × Performance × Quality) / 10000
 * 
 * @param input - OEE calculation input parameters
 * @returns Complete OEE result with all components
 * 
 * @example
 * ```typescript
 * const result = calculateOEE({
 *   plannedProductionTime: 480,
 *   plannedDowntime: 30,
 *   unplannedDowntime: 45,
 *   totalUnitsProduced: 950,
 *   defectiveUnits: 20,
 *   ratedSpeed: 100,
 *   actualSpeed: 92
 * });
 * ```
 */
export function calculateOEE(input: OEEInput): OEEResult {
  // Calculate operating time
  const operatingTime =
    input.plannedProductionTime - input.plannedDowntime - input.unplannedDowntime;

  // Calculate availability
  const availability = calculateAvailability(
    input.plannedProductionTime,
    input.plannedDowntime,
    input.unplannedDowntime
  );

  // Calculate theoretical output
  const operatingHours = operatingTime / 60;
  const theoreticalOutput = operatingHours * input.ratedSpeed;

  // Calculate performance
  const performance = calculatePerformance(input.actualSpeed, input.ratedSpeed);

  // Calculate quality
  const quality = calculateQuality(input.totalUnitsProduced, input.defectiveUnits);

  // Calculate good units
  const goodUnits = input.totalUnitsProduced - input.defectiveUnits;

  // Calculate OEE
  const oee = (availability * performance * quality) / 10000;

  // Interpret OEE
  const interpretation = interpretOEE(oee);

  // Calculate gap to world-class (85%)
  const worldClassGap = Math.max(0, 85 - oee);

  return {
    availability: Number(availability.toFixed(1)),
    performance: Number(performance.toFixed(1)),
    quality: Number(quality.toFixed(1)),
    oee: Number(oee.toFixed(1)),
    operatingTime: Number(operatingTime.toFixed(0)),
    theoreticalOutput: Number(theoreticalOutput.toFixed(0)),
    goodUnits: Number(goodUnits.toFixed(0)),
    interpretation,
    worldClassGap: Number(worldClassGap.toFixed(1)),
  };
}

/**
 * Interpret OEE score
 * 
 * Industry benchmarks:
 * - World-Class: 85%+
 * - Excellent: 75-84%
 * - Good: 65-74%
 * - Fair: 50-64%
 * - Poor: <50%
 * 
 * @param oee - OEE percentage (0-100)
 * @returns Interpretation string
 */
export function interpretOEE(oee: number): string {
  if (oee >= 85) return 'World-Class';
  if (oee >= 75) return 'Excellent';
  if (oee >= 65) return 'Good';
  if (oee >= 50) return 'Fair';
  return 'Poor';
}

/**
 * Identify OEE improvement opportunities
 * 
 * Determines which component (Availability, Performance, Quality) has
 * the most room for improvement.
 * 
 * @param availability - Availability percentage
 * @param performance - Performance percentage
 * @param quality - Quality percentage
 * @returns Prioritized improvement opportunities
 */
export interface ImprovementOpportunity {
  component: 'Availability' | 'Performance' | 'Quality';
  currentValue: number;
  target: number;
  gap: number;
  priority: 'High' | 'Medium' | 'Low';
  recommendations: string[];
}

export function identifyImprovementOpportunities(
  availability: number,
  performance: number,
  quality: number
): ImprovementOpportunity[] {
  const opportunities: ImprovementOpportunity[] = [];

  // Availability opportunities (target: 90%)
  if (availability < 90) {
    opportunities.push({
      component: 'Availability',
      currentValue: availability,
      target: 90,
      gap: 90 - availability,
      priority: availability < 80 ? 'High' : availability < 85 ? 'Medium' : 'Low',
      recommendations: [
        'Implement preventive maintenance schedule',
        'Reduce changeover times (SMED)',
        'Improve material handling logistics',
        'Address equipment reliability issues',
        'Train operators on quick problem resolution',
      ],
    });
  }

  // Performance opportunities (target: 95%)
  if (performance < 95) {
    opportunities.push({
      component: 'Performance',
      currentValue: performance,
      target: 95,
      gap: 95 - performance,
      priority: performance < 85 ? 'High' : performance < 90 ? 'Medium' : 'Low',
      recommendations: [
        'Eliminate minor stoppages and slowdowns',
        'Optimize machine settings and parameters',
        'Improve operator training and standardization',
        'Address equipment wear and degradation',
        'Implement real-time monitoring systems',
      ],
    });
  }

  // Quality opportunities (target: 99%)
  if (quality < 99) {
    opportunities.push({
      component: 'Quality',
      currentValue: quality,
      target: 99,
      gap: 99 - quality,
      priority: quality < 95 ? 'High' : quality < 97 ? 'Medium' : 'Low',
      recommendations: [
        'Implement statistical process control (SPC)',
        'Improve quality inspection processes',
        'Address root causes of defects (5 Whys, Fishbone)',
        'Enhance operator training on quality standards',
        'Upgrade tooling and equipment precision',
      ],
    });
  }

  // Sort by gap (largest improvement opportunity first)
  return opportunities.sort((a, b) => b.gap - a.gap);
}

/**
 * Calculate OEE from production line data
 * 
 * Convenience function for calculating OEE directly from production line
 * performance metrics.
 * 
 * @param productionLineData - Production line performance data
 * @returns OEE result
 */
export interface ProductionLineData {
  shiftsPerDay: number;
  hoursPerShift: number;
  daysPerWeek: number;
  plannedDowntimeMinutes: number;
  unplannedDowntimeMinutes: number;
  unitsProduced: number;
  unitsAccepted: number;
  unitsRejected: number;
  ratedSpeed: number;
  actualSpeed: number;
}

export function calculateOEEFromProductionLine(
  data: ProductionLineData
): OEEResult {
  // Calculate planned production time (minutes)
  const plannedProductionTime = data.hoursPerShift * 60;

  // Calculate defective units
  const defectiveUnits = data.unitsRejected;

  return calculateOEE({
    plannedProductionTime,
    plannedDowntime: data.plannedDowntimeMinutes,
    unplannedDowntime: data.unplannedDowntimeMinutes,
    totalUnitsProduced: data.unitsProduced,
    defectiveUnits,
    ratedSpeed: data.ratedSpeed,
    actualSpeed: data.actualSpeed,
  });
}

/**
 * Calculate Six Big Losses
 * 
 * The Six Big Losses framework categorizes production losses:
 * 1. Equipment Failure (Availability)
 * 2. Setup and Adjustments (Availability)
 * 3. Idling and Minor Stops (Performance)
 * 4. Reduced Speed (Performance)
 * 5. Process Defects (Quality)
 * 6. Reduced Yield (Quality)
 * 
 * @param lossesData - Six Big Losses data
 * @returns Categorized losses with percentages
 */
export interface SixBigLossesData {
  equipmentFailureMinutes: number;
  setupMinutes: number;
  idlingMinutes: number;
  reducedSpeedMinutes: number;
  processDefectUnits: number;
  reducedYieldUnits: number;
  plannedProductionTime: number;
  totalUnitsProduced: number;
}

export interface SixBigLossesResult {
  availabilityLosses: {
    equipmentFailure: { minutes: number; percentage: number };
    setup: { minutes: number; percentage: number };
    total: { minutes: number; percentage: number };
  };
  performanceLosses: {
    idling: { minutes: number; percentage: number };
    reducedSpeed: { minutes: number; percentage: number };
    total: { minutes: number; percentage: number };
  };
  qualityLosses: {
    processDefects: { units: number; percentage: number };
    reducedYield: { units: number; percentage: number };
    total: { units: number; percentage: number };
  };
}

export function calculateSixBigLosses(data: SixBigLossesData): SixBigLossesResult {
  const totalAvailabilityLoss = data.equipmentFailureMinutes + data.setupMinutes;
  const totalPerformanceLoss = data.idlingMinutes + data.reducedSpeedMinutes;
  const totalQualityLoss = data.processDefectUnits + data.reducedYieldUnits;

  return {
    availabilityLosses: {
      equipmentFailure: {
        minutes: data.equipmentFailureMinutes,
        percentage: (data.equipmentFailureMinutes / data.plannedProductionTime) * 100,
      },
      setup: {
        minutes: data.setupMinutes,
        percentage: (data.setupMinutes / data.plannedProductionTime) * 100,
      },
      total: {
        minutes: totalAvailabilityLoss,
        percentage: (totalAvailabilityLoss / data.plannedProductionTime) * 100,
      },
    },
    performanceLosses: {
      idling: {
        minutes: data.idlingMinutes,
        percentage: (data.idlingMinutes / data.plannedProductionTime) * 100,
      },
      reducedSpeed: {
        minutes: data.reducedSpeedMinutes,
        percentage: (data.reducedSpeedMinutes / data.plannedProductionTime) * 100,
      },
      total: {
        minutes: totalPerformanceLoss,
        percentage: (totalPerformanceLoss / data.plannedProductionTime) * 100,
      },
    },
    qualityLosses: {
      processDefects: {
        units: data.processDefectUnits,
        percentage: (data.processDefectUnits / data.totalUnitsProduced) * 100,
      },
      reducedYield: {
        units: data.reducedYieldUnits,
        percentage: (data.reducedYieldUnits / data.totalUnitsProduced) * 100,
      },
      total: {
        units: totalQualityLoss,
        percentage: (totalQualityLoss / data.totalUnitsProduced) * 100,
      },
    },
  };
}

/**
 * IMPLEMENTATION NOTES:
 * - OEE is the gold standard KPI for manufacturing productivity
 * - World-class OEE: 85%+ (automotive/electronics achieve 90%+)
 * - Average manufacturing OEE: 60% (significant room for improvement)
 * - OEE < 50%: Critical, immediate action required
 * - Focus on lowest component first (biggest improvement opportunity)
 * - Availability: Equipment reliability, maintenance, changeovers
 * - Performance: Speed losses, minor stops, process efficiency
 * - Quality: Defects, scrap, rework, first-pass yield
 * - Six Big Losses: Framework for categorizing production losses
 * - TPM (Total Productive Maintenance): Strategy for improving OEE
 * - Real-time OEE monitoring: Digital dashboards, IoT sensors
 * - Benchmark against industry: Automotive 85%, Food 60%, Pharma 50%
 */
