/**
 * @file src/lib/utils/manufacturing/oeeCalculation.ts
 * @description OEE (Overall Equipment Effectiveness) calculation utility
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Calculates OEE metrics for manufacturing equipment and production lines.
 * OEE = Availability × Performance × Quality
 * 
 * World-class OEE targets:
 * - Availability: 90%+
 * - Performance: 95%+
 * - Quality: 99%+
 * - Overall OEE: 85%+
 * 
 * FORMULAS:
 * - Availability = Operating Time / Planned Production Time
 * - Performance = (Ideal Cycle Time × Total Pieces) / Operating Time
 * - Quality = Good Pieces / Total Pieces
 * - OEE = Availability × Performance × Quality
 */

import type { OEEInputs, OEEResult } from '@/types/manufacturing';

/**
 * OEE classification thresholds
 */
const OEE_THRESHOLDS = {
  WORLD_CLASS: 85,
  GOOD: 70,
  AVERAGE: 50,
} as const;

/**
 * Calculate OEE from inputs
 * 
 * @param inputs - OEE calculation inputs
 * @returns OEE result with all components
 * 
 * @example
 * const result = calculateOEE({
 *   plannedProductionTime: 480,  // 8 hours in minutes
 *   operatingTime: 420,          // Actual run time
 *   idealCycleTime: 30,          // Seconds per piece
 *   totalPieces: 800,
 *   goodPieces: 780
 * });
 * // result.oee = 76.56%
 */
export function calculateOEE(inputs: OEEInputs): OEEResult {
  const { plannedProductionTime, operatingTime, idealCycleTime, totalPieces, goodPieces } = inputs;

  // Validate inputs
  if (plannedProductionTime <= 0 || operatingTime <= 0) {
    return {
      availability: 0,
      performance: 0,
      quality: 0,
      oee: 0,
      classification: 'Needs Improvement',
    };
  }

  // Calculate Availability (as percentage)
  const availability = Math.min(100, (operatingTime / plannedProductionTime) * 100);

  // Calculate Performance (as percentage)
  // Convert idealCycleTime from seconds to minutes for consistency
  const idealCycleTimeMinutes = idealCycleTime / 60;
  const theoreticalOutput = operatingTime / idealCycleTimeMinutes;
  const performance = theoreticalOutput > 0
    ? Math.min(100, (totalPieces / theoreticalOutput) * 100)
    : 0;

  // Calculate Quality (as percentage)
  const quality = totalPieces > 0
    ? Math.min(100, (goodPieces / totalPieces) * 100)
    : 0;

  // Calculate OEE (multiply percentages and divide by 10000 to get percentage)
  const oee = (availability * performance * quality) / 10000;

  // Classify OEE
  const classification = classifyOEE(oee);

  return {
    availability: Math.round(availability * 100) / 100,
    performance: Math.round(performance * 100) / 100,
    quality: Math.round(quality * 100) / 100,
    oee: Math.round(oee * 100) / 100,
    classification,
  };
}

/**
 * Classify OEE score
 */
function classifyOEE(oee: number): OEEResult['classification'] {
  if (oee >= OEE_THRESHOLDS.WORLD_CLASS) return 'World Class';
  if (oee >= OEE_THRESHOLDS.GOOD) return 'Good';
  if (oee >= OEE_THRESHOLDS.AVERAGE) return 'Average';
  return 'Needs Improvement';
}

/**
 * Calculate availability from downtime
 * 
 * @param plannedTime - Planned production time in minutes
 * @param plannedDowntime - Scheduled downtime in minutes
 * @param unplannedDowntime - Unscheduled downtime in minutes
 * @returns Availability percentage
 */
export function calculateAvailability(
  plannedTime: number,
  plannedDowntime: number,
  unplannedDowntime: number
): number {
  const scheduledTime = plannedTime - plannedDowntime;
  const operatingTime = scheduledTime - unplannedDowntime;
  
  if (scheduledTime <= 0) return 0;
  return Math.min(100, (operatingTime / scheduledTime) * 100);
}

/**
 * Calculate TEEP (Total Effective Equipment Performance)
 * TEEP extends OEE to include all calendar time
 * 
 * @param oee - OEE percentage
 * @param plannedProductionTime - Scheduled production time in minutes
 * @param calendarTime - Total calendar time in minutes (24 × 60 × days)
 * @returns TEEP percentage
 */
export function calculateTEEP(
  oee: number,
  plannedProductionTime: number,
  calendarTime: number
): number {
  if (calendarTime <= 0) return 0;
  const loading = plannedProductionTime / calendarTime;
  return (oee / 100) * loading * 100;
}

/**
 * Calculate Six Big Losses from OEE components
 * 
 * The six big losses that reduce OEE:
 * 1. Equipment Failure (Availability)
 * 2. Setup/Adjustment (Availability)
 * 3. Idling/Minor Stops (Performance)
 * 4. Reduced Speed (Performance)
 * 5. Process Defects (Quality)
 * 6. Reduced Yield (Quality)
 */
export interface SixBigLosses {
  equipmentFailure: number;
  setupAdjustment: number;
  idlingMinorStops: number;
  reducedSpeed: number;
  processDefects: number;
  reducedYield: number;
  totalLoss: number;
}

/**
 * Estimate six big losses from OEE data
 * 
 * @param target - Target OEE (typically 85-90%)
 * @param actual - Actual OEE result
 * @returns Estimated losses breakdown
 */
export function estimateSixBigLosses(target: number, actual: OEEResult): SixBigLosses {
  const availabilityLoss = 100 - actual.availability;
  const performanceLoss = 100 - actual.performance;
  const qualityLoss = 100 - actual.quality;

  // Approximate distribution of losses within each category
  return {
    equipmentFailure: availabilityLoss * 0.6,
    setupAdjustment: availabilityLoss * 0.4,
    idlingMinorStops: performanceLoss * 0.4,
    reducedSpeed: performanceLoss * 0.6,
    processDefects: qualityLoss * 0.7,
    reducedYield: qualityLoss * 0.3,
    totalLoss: target - actual.oee,
  };
}

/**
 * Calculate OEE trend from historical data
 * 
 * @param history - Array of OEE values over time
 * @returns Trend analysis
 */
export interface OEETrend {
  average: number;
  min: number;
  max: number;
  trend: 'improving' | 'stable' | 'declining';
  trendPercentage: number;
}

export function calculateOEETrend(history: number[]): OEETrend {
  if (history.length === 0) {
    return {
      average: 0,
      min: 0,
      max: 0,
      trend: 'stable',
      trendPercentage: 0,
    };
  }

  const average = history.reduce((a, b) => a + b, 0) / history.length;
  const min = Math.min(...history);
  const max = Math.max(...history);

  // Calculate trend from first half vs second half
  const midpoint = Math.floor(history.length / 2);
  const firstHalf = history.slice(0, midpoint);
  const secondHalf = history.slice(midpoint);

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);

  const trendPercentage = firstAvg !== 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

  let trend: OEETrend['trend'];
  if (trendPercentage > 2) trend = 'improving';
  else if (trendPercentage < -2) trend = 'declining';
  else trend = 'stable';

  return {
    average: Math.round(average * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    trend,
    trendPercentage: Math.round(trendPercentage * 100) / 100,
  };
}

/**
 * Generate OEE improvement recommendations
 * 
 * @param result - Current OEE result
 * @returns Array of prioritized recommendations
 */
export interface OEERecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'availability' | 'performance' | 'quality';
  recommendation: string;
  potentialImprovement: number;
}

export function getOEERecommendations(result: OEEResult): OEERecommendation[] {
  const recommendations: OEERecommendation[] = [];

  // Availability recommendations
  if (result.availability < 90) {
    recommendations.push({
      priority: result.availability < 80 ? 'high' : 'medium',
      category: 'availability',
      recommendation: 'Implement preventive maintenance program to reduce unplanned downtime',
      potentialImprovement: 90 - result.availability,
    });
  }

  // Performance recommendations
  if (result.performance < 95) {
    recommendations.push({
      priority: result.performance < 85 ? 'high' : 'medium',
      category: 'performance',
      recommendation: 'Analyze and reduce minor stoppages and speed losses',
      potentialImprovement: 95 - result.performance,
    });
  }

  // Quality recommendations
  if (result.quality < 99) {
    recommendations.push({
      priority: result.quality < 95 ? 'high' : 'low',
      category: 'quality',
      recommendation: 'Implement statistical process control to reduce defects',
      potentialImprovement: 99 - result.quality,
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

export default {
  calculateOEE,
  calculateAvailability,
  calculateTEEP,
  estimateSixBigLosses,
  calculateOEETrend,
  getOEERecommendations,
};
