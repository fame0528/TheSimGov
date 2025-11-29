/**
 * @file src/lib/utils/manufacturing/sixSigmaMetrics.ts
 * @description Six Sigma quality metrics calculation utility
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Calculates Six Sigma quality metrics including DPMO, sigma level, process capability,
 * and Cpk. Supports statistical process control (SPC) analysis.
 * 
 * SIGMA LEVELS:
 * - 1σ: 690,000 DPMO (30.9% yield)
 * - 2σ: 308,000 DPMO (69.1% yield)
 * - 3σ: 66,800 DPMO (93.3% yield)
 * - 4σ: 6,210 DPMO (99.4% yield)
 * - 5σ: 230 DPMO (99.98% yield)
 * - 6σ: 3.4 DPMO (99.9997% yield)
 * 
 * KEY FORMULAS:
 * - DPMO = (Defects / Opportunities) × 1,000,000
 * - Yield = 1 - (DPMO / 1,000,000)
 * - Cp = (USL - LSL) / (6 × σ)
 * - Cpk = min((USL - μ) / (3σ), (μ - LSL) / (3σ))
 */

import type { SixSigmaMetrics } from '@/types/manufacturing';

/**
 * Sigma level lookup table (DPMO to Sigma)
 */
const SIGMA_TABLE = [
  { dpmo: 690000, sigma: 1.0 },
  { dpmo: 500000, sigma: 1.5 },
  { dpmo: 308000, sigma: 2.0 },
  { dpmo: 158655, sigma: 2.5 },
  { dpmo: 66800, sigma: 3.0 },
  { dpmo: 22750, sigma: 3.5 },
  { dpmo: 6210, sigma: 4.0 },
  { dpmo: 1350, sigma: 4.5 },
  { dpmo: 230, sigma: 5.0 },
  { dpmo: 32, sigma: 5.5 },
  { dpmo: 3.4, sigma: 6.0 },
];

/**
 * Calculate Six Sigma metrics from defect data
 * 
 * @param defects - Number of defects
 * @param units - Number of units inspected
 * @param opportunities - Defect opportunities per unit
 * @returns Six Sigma metrics
 * 
 * @example
 * const metrics = calculateSixSigma(50, 10000, 5);
 * // 50 defects in 10,000 units with 5 opportunities each
 * // DPMO = 1000, Sigma ≈ 4.6
 */
export function calculateSixSigma(
  defects: number,
  units: number,
  opportunities: number
): SixSigmaMetrics {
  // Calculate DPMO
  const totalOpportunities = units * opportunities;
  const dpmo = totalOpportunities > 0 ? (defects / totalOpportunities) * 1000000 : 0;

  // Calculate sigma level
  const sigmaLevel = dpmoToSigma(dpmo);

  // Calculate yield
  const yieldRate = (1 - dpmo / 1000000) * 100;

  // Process capability (assuming Cp = Cpk for centered process)
  const cpk = sigmaLevel / 3;

  return {
    defectsPerMillion: Math.round(dpmo * 100) / 100,
    sigmaLevel: Math.round(sigmaLevel * 100) / 100,
    processCapability: Math.round(cpk * 100) / 100,
    cpk: Math.round(cpk * 100) / 100,
    yield: Math.round(yieldRate * 1000) / 1000,
  };
}

/**
 * Convert DPMO to sigma level
 */
function dpmoToSigma(dpmo: number): number {
  if (dpmo <= 0) return 6.0;
  if (dpmo >= 690000) return 1.0;

  // Find bracketing values and interpolate
  for (let i = 0; i < SIGMA_TABLE.length - 1; i++) {
    if (dpmo <= SIGMA_TABLE[i].dpmo && dpmo > SIGMA_TABLE[i + 1].dpmo) {
      const ratio = (Math.log(SIGMA_TABLE[i].dpmo) - Math.log(dpmo)) /
        (Math.log(SIGMA_TABLE[i].dpmo) - Math.log(SIGMA_TABLE[i + 1].dpmo));
      return SIGMA_TABLE[i].sigma + ratio * (SIGMA_TABLE[i + 1].sigma - SIGMA_TABLE[i].sigma);
    }
  }

  return 6.0;
}

/**
 * Convert sigma level to DPMO
 */
export function sigmaToDpmo(sigma: number): number {
  if (sigma >= 6.0) return 3.4;
  if (sigma <= 1.0) return 690000;

  // Find bracketing values and interpolate
  for (let i = 0; i < SIGMA_TABLE.length - 1; i++) {
    if (sigma >= SIGMA_TABLE[i].sigma && sigma < SIGMA_TABLE[i + 1].sigma) {
      const ratio = (sigma - SIGMA_TABLE[i].sigma) /
        (SIGMA_TABLE[i + 1].sigma - SIGMA_TABLE[i].sigma);
      const logDpmo = Math.log(SIGMA_TABLE[i].dpmo) -
        ratio * (Math.log(SIGMA_TABLE[i].dpmo) - Math.log(SIGMA_TABLE[i + 1].dpmo));
      return Math.exp(logDpmo);
    }
  }

  return 3.4;
}

/**
 * Process capability analysis
 */
export interface ProcessCapabilityInputs {
  measurements: number[];
  upperSpecLimit: number;
  lowerSpecLimit: number;
  targetValue?: number;
}

export interface ProcessCapabilityResult {
  mean: number;
  standardDeviation: number;
  cp: number;
  cpk: number;
  cpm: number;
  capability: 'incapable' | 'marginally capable' | 'capable' | 'highly capable';
  withinSpec: number; // Percentage within specification
  recommendations: string[];
}

/**
 * Calculate process capability indices
 */
export function calculateProcessCapability(inputs: ProcessCapabilityInputs): ProcessCapabilityResult {
  const { measurements, upperSpecLimit, lowerSpecLimit, targetValue } = inputs;

  if (measurements.length < 2) {
    return {
      mean: 0,
      standardDeviation: 0,
      cp: 0,
      cpk: 0,
      cpm: 0,
      capability: 'incapable',
      withinSpec: 0,
      recommendations: ['Insufficient data for analysis'],
    };
  }

  // Calculate mean
  const mean = measurements.reduce((a, b) => a + b, 0) / measurements.length;

  // Calculate standard deviation
  const squaredDiffs = measurements.map(m => Math.pow(m - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (measurements.length - 1);
  const standardDeviation = Math.sqrt(variance);

  // Calculate Cp (potential capability)
  const specRange = upperSpecLimit - lowerSpecLimit;
  const cp = standardDeviation > 0 ? specRange / (6 * standardDeviation) : 0;

  // Calculate Cpk (actual capability considering centering)
  const cpupper = (upperSpecLimit - mean) / (3 * standardDeviation);
  const cplower = (mean - lowerSpecLimit) / (3 * standardDeviation);
  const cpk = Math.min(cpupper, cplower);

  // Calculate Cpm (Taguchi capability considering target)
  const target = targetValue ?? (upperSpecLimit + lowerSpecLimit) / 2;
  const squaredDeviationsFromTarget = measurements.map(m => Math.pow(m - target, 2));
  const tau = Math.sqrt(squaredDeviationsFromTarget.reduce((a, b) => a + b, 0) / measurements.length);
  const cpm = tau > 0 ? specRange / (6 * tau) : 0;

  // Calculate percentage within spec
  const withinCount = measurements.filter(m => m >= lowerSpecLimit && m <= upperSpecLimit).length;
  const withinSpec = (withinCount / measurements.length) * 100;

  // Determine capability level
  let capability: ProcessCapabilityResult['capability'];
  if (cpk < 1.0) capability = 'incapable';
  else if (cpk < 1.33) capability = 'marginally capable';
  else if (cpk < 1.67) capability = 'capable';
  else capability = 'highly capable';

  // Generate recommendations
  const recommendations: string[] = [];
  if (cpk < 1.33) {
    if (Math.abs(cpupper - cplower) > 0.5) {
      recommendations.push('Process is off-center. Adjust process mean toward target.');
    }
    if (cp < 1.33) {
      recommendations.push('Process has excessive variation. Investigate and reduce sources of variation.');
    }
  }
  if (withinSpec < 99.73) {
    recommendations.push(`${(100 - withinSpec).toFixed(2)}% of output is out of specification. Implement containment.`);
  }
  if (recommendations.length === 0) {
    recommendations.push('Process is performing well. Maintain current controls.');
  }

  return {
    mean: Math.round(mean * 1000) / 1000,
    standardDeviation: Math.round(standardDeviation * 1000) / 1000,
    cp: Math.round(cp * 100) / 100,
    cpk: Math.round(cpk * 100) / 100,
    cpm: Math.round(cpm * 100) / 100,
    capability,
    withinSpec: Math.round(withinSpec * 100) / 100,
    recommendations,
  };
}

/**
 * Control chart limits calculation
 */
export interface ControlLimits {
  centerLine: number;
  upperControlLimit: number;
  lowerControlLimit: number;
  upperWarningLimit: number;
  lowerWarningLimit: number;
}

/**
 * Calculate X-bar chart control limits
 */
export function calculateXBarLimits(
  subgroupMeans: number[],
  subgroupSize: number
): ControlLimits {
  const grandMean = subgroupMeans.reduce((a, b) => a + b, 0) / subgroupMeans.length;

  // Calculate average range
  const ranges: number[] = [];
  for (let i = 1; i < subgroupMeans.length; i++) {
    ranges.push(Math.abs(subgroupMeans[i] - subgroupMeans[i - 1]));
  }
  const avgRange = ranges.length > 0 ? ranges.reduce((a, b) => a + b, 0) / ranges.length : 0;

  // A2 factors for different subgroup sizes
  const A2: Record<number, number> = { 2: 1.88, 3: 1.023, 4: 0.729, 5: 0.577, 6: 0.483, 7: 0.419, 8: 0.373, 9: 0.337, 10: 0.308 };
  const a2Factor = A2[subgroupSize] || 0.577;

  const ucl = grandMean + a2Factor * avgRange;
  const lcl = grandMean - a2Factor * avgRange;
  const uwl = grandMean + (2/3) * a2Factor * avgRange;
  const lwl = grandMean - (2/3) * a2Factor * avgRange;

  return {
    centerLine: Math.round(grandMean * 1000) / 1000,
    upperControlLimit: Math.round(ucl * 1000) / 1000,
    lowerControlLimit: Math.round(lcl * 1000) / 1000,
    upperWarningLimit: Math.round(uwl * 1000) / 1000,
    lowerWarningLimit: Math.round(lwl * 1000) / 1000,
  };
}

/**
 * Detect control chart rule violations (Western Electric rules)
 */
export interface RuleViolation {
  rule: string;
  points: number[];
  description: string;
}

export function detectRuleViolations(
  data: number[],
  limits: ControlLimits
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const { centerLine, upperControlLimit, lowerControlLimit } = limits;

  // Rule 1: Point beyond 3 sigma
  for (let i = 0; i < data.length; i++) {
    if (data[i] > upperControlLimit || data[i] < lowerControlLimit) {
      violations.push({
        rule: 'Rule 1',
        points: [i],
        description: `Point ${i + 1} beyond control limits`,
      });
    }
  }

  // Rule 2: 9 points in a row on same side of center
  for (let i = 0; i <= data.length - 9; i++) {
    const segment = data.slice(i, i + 9);
    const allAbove = segment.every(p => p > centerLine);
    const allBelow = segment.every(p => p < centerLine);
    if (allAbove || allBelow) {
      violations.push({
        rule: 'Rule 2',
        points: Array.from({ length: 9 }, (_, j) => i + j),
        description: `9 consecutive points ${allAbove ? 'above' : 'below'} center line`,
      });
      break;
    }
  }

  // Rule 3: 6 points in a row steadily increasing or decreasing
  for (let i = 0; i <= data.length - 6; i++) {
    const segment = data.slice(i, i + 6);
    let increasing = true;
    let decreasing = true;
    for (let j = 1; j < 6; j++) {
      if (segment[j] <= segment[j - 1]) increasing = false;
      if (segment[j] >= segment[j - 1]) decreasing = false;
    }
    if (increasing || decreasing) {
      violations.push({
        rule: 'Rule 3',
        points: Array.from({ length: 6 }, (_, j) => i + j),
        description: `6 consecutive points ${increasing ? 'increasing' : 'decreasing'}`,
      });
      break;
    }
  }

  return violations;
}

/**
 * DMAIC project tracking
 */
export interface DMAICPhase {
  phase: 'Define' | 'Measure' | 'Analyze' | 'Improve' | 'Control';
  status: 'not-started' | 'in-progress' | 'complete';
  startDate?: string;
  endDate?: string;
  deliverables: Array<{ name: string; complete: boolean }>;
}

export interface DMAICProject {
  name: string;
  problemStatement: string;
  goal: string;
  currentSigma: number;
  targetSigma: number;
  estimatedSavings: number;
  phases: DMAICPhase[];
  overallProgress: number;
}

/**
 * Calculate DMAIC project progress
 */
export function calculateDMAICProgress(project: DMAICProject): number {
  const phaseWeights = { Define: 0.1, Measure: 0.2, Analyze: 0.25, Improve: 0.3, Control: 0.15 };
  let progress = 0;

  for (const phase of project.phases) {
    const weight = phaseWeights[phase.phase];
    if (phase.status === 'complete') {
      progress += weight * 100;
    } else if (phase.status === 'in-progress') {
      const deliverableProgress = phase.deliverables.filter(d => d.complete).length / phase.deliverables.length;
      progress += weight * deliverableProgress * 100;
    }
  }

  return Math.round(progress);
}

export default {
  calculateSixSigma,
  sigmaToDpmo,
  calculateProcessCapability,
  calculateXBarLimits,
  detectRuleViolations,
  calculateDMAICProgress,
};
