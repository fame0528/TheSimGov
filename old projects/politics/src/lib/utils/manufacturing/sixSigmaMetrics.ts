/**
 * @file src/lib/utils/manufacturing/sixSigmaMetrics.ts
 * @description Six Sigma quality metrics calculation utilities
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Utilities for calculating Six Sigma quality metrics including DPMO (Defects Per
 * Million Opportunities), Sigma levels, Cp/Cpk (process capability), and control
 * chart limits. Six Sigma is a data-driven methodology for eliminating defects.
 * 
 * Six Sigma Levels (1.5σ shift assumed):
 * - 6σ: 3.4 DPMO (99.99966% good)
 * - 5σ: 233 DPMO (99.977% good)
 * - 4σ: 6,210 DPMO (99.379% good)
 * - 3σ: 66,807 DPMO (93.32% good)
 * - 2σ: 308,537 DPMO (69.15% good)
 * - 1σ: 690,000 DPMO (31% good)
 * 
 * USAGE:
 * ```typescript
 * import { calculateDPMO, calculateSigmaLevel, calculateCpk } from '@/lib/utils/manufacturing/sixSigmaMetrics';
 * 
 * const dpmo = calculateDPMO(23, 10000, 5);
 * console.log(dpmo); // 460 DPMO
 * 
 * const sigmaLevel = calculateSigmaLevel(dpmo);
 * console.log(sigmaLevel); // 4.82
 * ```
 */

/**
 * Calculate DPMO (Defects Per Million Opportunities)
 * 
 * DPMO = (Defects Found / Total Opportunities) × 1,000,000
 * Total Opportunities = Units Inspected × Opportunities per Unit
 * 
 * @param defectsFound - Number of defects found
 * @param unitsInspected - Number of units inspected
 * @param opportunitiesPerUnit - Defect opportunities per unit
 * @returns DPMO (Defects Per Million Opportunities)
 * 
 * @example
 * ```typescript
 * const dpmo = calculateDPMO(23, 10000, 5);
 * console.log(dpmo); // 460 DPMO
 * ```
 */
export function calculateDPMO(
  defectsFound: number,
  unitsInspected: number,
  opportunitiesPerUnit: number
): number {
  if (unitsInspected <= 0 || opportunitiesPerUnit <= 0) return 0;

  const totalOpportunities = unitsInspected * opportunitiesPerUnit;
  const dpmo = (defectsFound / totalOpportunities) * 1000000;

  return Math.max(0, Number(dpmo.toFixed(0)));
}

/**
 * Calculate PPM (Parts Per Million defective)
 * 
 * PPM = (Defective Units / Total Units) × 1,000,000
 * 
 * @param defectiveUnits - Number of defective units
 * @param totalUnits - Total units produced
 * @returns PPM (Parts Per Million defective)
 * 
 * @example
 * ```typescript
 * const ppm = calculatePPM(23, 10000);
 * console.log(ppm); // 2,300 PPM
 * ```
 */
export function calculatePPM(defectiveUnits: number, totalUnits: number): number {
  if (totalUnits <= 0) return 0;

  const ppm = (defectiveUnits / totalUnits) * 1000000;

  return Math.max(0, Number(ppm.toFixed(0)));
}

/**
 * Calculate Sigma Level from DPMO
 * 
 * Uses lookup table with 1.5σ shift (industry standard).
 * 
 * @param dpmo - Defects Per Million Opportunities
 * @returns Sigma level (1-6)
 * 
 * @example
 * ```typescript
 * const sigmaLevel = calculateSigmaLevel(6210);
 * console.log(sigmaLevel); // 4.0
 * ```
 */
export function calculateSigmaLevel(dpmo: number): number {
  // Sigma level lookup table (with 1.5σ shift)
  const sigmaTable: { [key: number]: number } = {
    690000: 1.0,
    500000: 1.5,
    308537: 2.0,
    159000: 2.5,
    66807: 3.0,
    22750: 3.5,
    6210: 4.0,
    1350: 4.5,
    233: 5.0,
    32: 5.5,
    3.4: 6.0,
  };

  // Find closest DPMO in lookup table
  if (dpmo >= 690000) return 1.0;
  if (dpmo <= 3.4) return 6.0;

  // Linear interpolation between lookup points
  const dpmoKeys = Object.keys(sigmaTable)
    .map(Number)
    .sort((a, b) => b - a);

  for (let i = 0; i < dpmoKeys.length - 1; i++) {
    const upperDPMO = dpmoKeys[i];
    const lowerDPMO = dpmoKeys[i + 1];

    if (dpmo <= upperDPMO && dpmo >= lowerDPMO) {
      const upperSigma = sigmaTable[upperDPMO];
      const lowerSigma = sigmaTable[lowerDPMO];

      // Linear interpolation
      const ratio = (upperDPMO - dpmo) / (upperDPMO - lowerDPMO);
      const sigma = upperSigma + ratio * (lowerSigma - upperSigma);

      return Number(sigma.toFixed(2));
    }
  }

  return 3.0; // Default fallback
}

/**
 * Calculate First Pass Yield (FPY)
 * 
 * FPY = (Good Units / Total Units) × 100
 * 
 * @param goodUnits - Units passing first time (no rework)
 * @param totalUnits - Total units produced
 * @returns First Pass Yield percentage (0-100)
 */
export function calculateFirstPassYield(goodUnits: number, totalUnits: number): number {
  if (totalUnits <= 0) return 100;

  const fpy = (goodUnits / totalUnits) * 100;

  return Math.max(0, Math.min(100, Number(fpy.toFixed(2))));
}

/**
 * Calculate Cp (Process Capability)
 * 
 * Cp = (USL - LSL) / (6 × σ)
 * 
 * Cp measures whether process spread fits within specification limits.
 * Cp >= 1.33: Process capable
 * Cp < 1.0: Process not capable
 * 
 * @param upperSpecLimit - Upper specification limit
 * @param lowerSpecLimit - Lower specification limit
 * @param standardDeviation - Process standard deviation
 * @returns Cp (Process Capability)
 * 
 * @example
 * ```typescript
 * const cp = calculateCp(110, 90, 3);
 * console.log(cp); // 1.11
 * ```
 */
export function calculateCp(
  upperSpecLimit: number,
  lowerSpecLimit: number,
  standardDeviation: number
): number {
  if (standardDeviation <= 0) return 0;

  const specWidth = upperSpecLimit - lowerSpecLimit;
  const processSpread = 6 * standardDeviation;
  const cp = specWidth / processSpread;

  return Number(cp.toFixed(2));
}

/**
 * Calculate Cpk (Process Capability Index with centering)
 * 
 * Cpk = min[(USL - μ) / (3 × σ), (μ - LSL) / (3 × σ)]
 * 
 * Cpk accounts for process centering (mean offset from target).
 * Cpk >= 1.67: Excellent (6σ capable)
 * Cpk >= 1.33: Good (4σ capable)
 * Cpk >= 1.0: Acceptable (3σ capable)
 * Cpk < 1.0: Poor (process not capable)
 * 
 * @param upperSpecLimit - Upper specification limit
 * @param lowerSpecLimit - Lower specification limit
 * @param mean - Process mean
 * @param standardDeviation - Process standard deviation
 * @returns Cpk (Process Capability Index)
 * 
 * @example
 * ```typescript
 * const cpk = calculateCpk(110, 90, 95, 3);
 * console.log(cpk); // 1.11
 * ```
 */
export function calculateCpk(
  upperSpecLimit: number,
  lowerSpecLimit: number,
  mean: number,
  standardDeviation: number
): number {
  if (standardDeviation <= 0) return 0;

  const cpkUpper = (upperSpecLimit - mean) / (3 * standardDeviation);
  const cpkLower = (mean - lowerSpecLimit) / (3 * standardDeviation);
  const cpk = Math.min(cpkUpper, cpkLower);

  return Number(cpk.toFixed(2));
}

/**
 * Interpret Cpk value
 * 
 * @param cpk - Cpk value
 * @returns Interpretation string
 */
export function interpretCpk(cpk: number): string {
  if (cpk >= 1.67) return 'Excellent (6σ capable)';
  if (cpk >= 1.33) return 'Good (4σ capable)';
  if (cpk >= 1.0) return 'Acceptable (3σ capable)';
  return 'Poor (not capable)';
}

/**
 * Calculate control chart limits (UCL/LCL)
 * 
 * UCL = μ + 3σ
 * LCL = μ - 3σ
 * 
 * Control limits contain 99.73% of data (3σ coverage).
 * 
 * @param mean - Process mean
 * @param standardDeviation - Process standard deviation
 * @returns Upper and lower control limits
 */
export interface ControlLimits {
  upperControlLimit: number;
  lowerControlLimit: number;
  mean: number;
  standardDeviation: number;
}

export function calculateControlLimits(
  mean: number,
  standardDeviation: number
): ControlLimits {
  const ucl = mean + 3 * standardDeviation;
  const lcl = mean - 3 * standardDeviation;

  return {
    upperControlLimit: Number(ucl.toFixed(2)),
    lowerControlLimit: Number(lcl.toFixed(2)),
    mean: Number(mean.toFixed(2)),
    standardDeviation: Number(standardDeviation.toFixed(2)),
  };
}

/**
 * Cost of Quality (COQ) calculations
 * 
 * COQ = Prevention + Appraisal + Internal Failure + External Failure
 * 
 * World-class COQ: < 10% of revenue
 * Average COQ: 15-25% of revenue
 */
export interface CostOfQuality {
  preventionCost: number;
  appraisalCost: number;
  internalFailureCost: number;
  externalFailureCost: number;
  totalCOQ: number;
  coqPercentRevenue: number;
  coqPerUnit: number;
}

export function calculateCostOfQuality(
  preventionCost: number,
  appraisalCost: number,
  internalFailureCost: number,
  externalFailureCost: number,
  revenue: number,
  unitsProduced: number
): CostOfQuality {
  const totalCOQ =
    preventionCost + appraisalCost + internalFailureCost + externalFailureCost;

  const coqPercentRevenue = revenue > 0 ? (totalCOQ / revenue) * 100 : 0;
  const coqPerUnit = unitsProduced > 0 ? totalCOQ / unitsProduced : 0;

  return {
    preventionCost,
    appraisalCost,
    internalFailureCost,
    externalFailureCost,
    totalCOQ: Number(totalCOQ.toFixed(2)),
    coqPercentRevenue: Number(coqPercentRevenue.toFixed(2)),
    coqPerUnit: Number(coqPerUnit.toFixed(2)),
  };
}

/**
 * Interpret Cost of Quality
 * 
 * @param coqPercentRevenue - COQ as percentage of revenue
 * @returns Interpretation string
 */
export function interpretCOQ(coqPercentRevenue: number): string {
  if (coqPercentRevenue < 10) return 'World-Class';
  if (coqPercentRevenue < 15) return 'Good';
  if (coqPercentRevenue < 25) return 'Average';
  return 'Poor';
}

/**
 * Complete Six Sigma analysis
 */
export interface SixSigmaInput {
  defectsFound: number;
  unitsInspected: number;
  opportunitiesPerUnit: number;
  defectiveUnits: number;
  totalUnitsProduced: number;
  upperSpecLimit: number;
  lowerSpecLimit: number;
  mean: number;
  standardDeviation: number;
  preventionCost: number;
  appraisalCost: number;
  internalFailureCost: number;
  externalFailureCost: number;
  revenue: number;
}

export interface SixSigmaResult {
  dpmo: number;
  ppm: number;
  sigmaLevel: number;
  firstPassYield: number;
  cp: number;
  cpk: number;
  cpkInterpretation: string;
  controlLimits: ControlLimits;
  costOfQuality: CostOfQuality;
  coqInterpretation: string;
  qualityHealth: string;
}

export function performSixSigmaAnalysis(input: SixSigmaInput): SixSigmaResult {
  // Calculate DPMO and Sigma level
  const dpmo = calculateDPMO(
    input.defectsFound,
    input.unitsInspected,
    input.opportunitiesPerUnit
  );
  const sigmaLevel = calculateSigmaLevel(dpmo);

  // Calculate PPM
  const ppm = calculatePPM(input.defectiveUnits, input.totalUnitsProduced);

  // Calculate First Pass Yield
  const goodUnits = input.totalUnitsProduced - input.defectiveUnits;
  const firstPassYield = calculateFirstPassYield(goodUnits, input.totalUnitsProduced);

  // Calculate Cp and Cpk
  const cp = calculateCp(
    input.upperSpecLimit,
    input.lowerSpecLimit,
    input.standardDeviation
  );
  const cpk = calculateCpk(
    input.upperSpecLimit,
    input.lowerSpecLimit,
    input.mean,
    input.standardDeviation
  );
  const cpkInterpretation = interpretCpk(cpk);

  // Calculate control limits
  const controlLimits = calculateControlLimits(input.mean, input.standardDeviation);

  // Calculate Cost of Quality
  const costOfQuality = calculateCostOfQuality(
    input.preventionCost,
    input.appraisalCost,
    input.internalFailureCost,
    input.externalFailureCost,
    input.revenue,
    input.totalUnitsProduced
  );
  const coqInterpretation = interpretCOQ(costOfQuality.coqPercentRevenue);

  // Overall quality health
  let qualityHealth = 'Poor';
  if (sigmaLevel >= 5 && cpk >= 1.67 && costOfQuality.coqPercentRevenue < 10) {
    qualityHealth = 'Excellent';
  } else if (sigmaLevel >= 4 && cpk >= 1.33 && costOfQuality.coqPercentRevenue < 15) {
    qualityHealth = 'Good';
  } else if (sigmaLevel >= 3 && cpk >= 1.0 && costOfQuality.coqPercentRevenue < 25) {
    qualityHealth = 'Fair';
  }

  return {
    dpmo,
    ppm,
    sigmaLevel,
    firstPassYield,
    cp,
    cpk,
    cpkInterpretation,
    controlLimits,
    costOfQuality,
    coqInterpretation,
    qualityHealth,
  };
}

/**
 * Pareto Analysis (80/20 rule)
 * 
 * Identifies vital few defects (20% of causes = 80% of problems).
 */
export interface ParetoDefect {
  category: string;
  count: number;
  percentage: number;
  cumulativePercentage: number;
}

export function performParetoAnalysis(
  defectCounts: { category: string; count: number }[]
): ParetoDefect[] {
  // Sort by count (descending)
  const sorted = defectCounts.sort((a, b) => b.count - a.count);

  // Calculate total
  const total = sorted.reduce((sum, d) => sum + d.count, 0);

  // Calculate percentages and cumulative
  let cumulative = 0;
  return sorted.map((defect) => {
    const percentage = total > 0 ? (defect.count / total) * 100 : 0;
    cumulative += percentage;

    return {
      category: defect.category,
      count: defect.count,
      percentage: Number(percentage.toFixed(1)),
      cumulativePercentage: Number(cumulative.toFixed(1)),
    };
  });
}

/**
 * IMPLEMENTATION NOTES:
 * - Six Sigma: Data-driven methodology for eliminating defects
 * - DPMO: Defects per million opportunities (normalized defect rate)
 * - Sigma level: Statistical measure of process capability
 * - 1.5σ shift: Industry standard assumption for long-term process drift
 * - Cp: Process capability (spread vs spec width)
 * - Cpk: Process capability with centering (accounts for mean offset)
 * - Cpk >= 1.67: 6σ capable (3.4 DPMO)
 * - Cpk >= 1.33: 4σ capable (6,210 DPMO)
 * - Control charts: SPC (Statistical Process Control) tool
 * - UCL/LCL: 3σ limits (99.73% containment)
 * - Cost of Quality: Prevention, Appraisal, Internal Failure, External Failure
 * - World-class COQ: < 10% of revenue
 * - Pareto principle: 80% of problems from 20% of causes
 * - Root cause analysis: 5 Whys, Fishbone diagram
 * - DMAIC: Define, Measure, Analyze, Improve, Control (Six Sigma methodology)
 */
