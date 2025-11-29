/**
 * @fileoverview Grid Node Balancing Calculation Utilities
 * @module lib/energy/grid
 * 
 * OVERVIEW:
 * Shared calculation utilities for grid node balancing, load management,
 * voltage regulation, and blackout risk assessment. Implements supply-demand
 * reconciliation algorithms and stability analysis.
 * 
 * CALCULATIONS:
 * - Balance delta: Supply vs demand mismatch quantification
 * - Load shedding: Priority-based demand reduction planning
 * - Voltage regulation: Target voltage adjustment calculations
 * - Blackout risk: N-1 contingency and stability metrics
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1 - Batch 2 DRY Utilities
 */

/**
 * Balancing action types
 */
export type BalancingAction = 
  | 'shed-load'
  | 'dispatch-generation'
  | 'charge-storage'
  | 'discharge-storage'
  | 'curtail-generation'
  | 'regulate-voltage'
  | 'regulate-frequency';

/**
 * Balancing action record
 */
export interface BalancingActionRecord {
  type: BalancingAction;
  target: string;
  amountMW?: number;
  parameter?: string;
  value?: number;
}

/**
 * Calculate supply-demand balance delta
 * 
 * @param currentSupplyMW - Current total supply
 * @param currentDemandMW - Current total demand
 * @returns Balance analysis with recommended actions
 * 
 * @example
 * const balance = calculateBalanceDelta(4500, 5200);
 * // Returns deficit of 700 MW requiring action
 */
export function calculateBalanceDelta(
  currentSupplyMW: number,
  currentDemandMW: number
): {
  deltaMW: number;
  percentageDelta: number;
  status: 'surplus' | 'balanced' | 'deficit';
  severity: 'low' | 'medium' | 'high' | 'critical';
} {
  const deltaMW = currentSupplyMW - currentDemandMW;
  const percentageDelta = (deltaMW / currentDemandMW) * 100;
  
  const status = 
    deltaMW > currentDemandMW * 0.02 ? 'surplus' :
    deltaMW < -currentDemandMW * 0.02 ? 'deficit' :
    'balanced';
  
  const absPct = Math.abs(percentageDelta);
  const severity = 
    absPct > 15 ? 'critical' :
    absPct > 8 ? 'high' :
    absPct > 3 ? 'medium' :
    'low';
  
  return {
    deltaMW: Math.round(deltaMW * 100) / 100,
    percentageDelta: Math.round(percentageDelta * 100) / 100,
    status,
    severity
  };
}

/**
 * Load shedding plan parameters
 */
export interface LoadSheddingParams {
  deficitMW: number;
  maxShedMW: number;
  sectorPriorities?: Record<string, number>; // Lower number = higher priority to keep
  sectorLoads?: Record<string, number>; // Current load per sector
}

/**
 * Generate load shedding plan
 * 
 * @param params - Load shedding parameters
 * @returns Prioritized shedding plan
 * 
 * @example
 * const plan = generateLoadSheddingPlan({
 *   deficitMW: 500,
 *   maxShedMW: 600,
 *   sectorPriorities: { 'critical': 1, 'commercial': 2, 'industrial': 3 },
 *   sectorLoads: { 'critical': 200, 'commercial': 800, 'industrial': 1500 }
 * });
 */
export function generateLoadSheddingPlan(params: LoadSheddingParams): {
  totalShedMW: number;
  shedActions: Array<{ sector: string; amountMW: number }>;
  unmetDeficitMW: number;
  warnings: string[];
} {
  const { deficitMW, maxShedMW, sectorPriorities = {}, sectorLoads = {} } = params;
  const warnings: string[] = [];
  const shedActions: Array<{ sector: string; amountMW: number }> = [];
  
  // Sort sectors by priority (higher priority number = shed first)
  const sectors = Object.entries(sectorPriorities)
    .sort(([, a], [, b]) => b - a)
    .map(([sector]) => sector);
  
  let remainingDeficit = Math.min(deficitMW, maxShedMW);
  
  // Shed load from lowest priority sectors first
  for (const sector of sectors) {
    if (remainingDeficit <= 0) break;
    
    const sectorLoad = sectorLoads[sector] || 0;
    const shedAmount = Math.min(sectorLoad, remainingDeficit);
    
    if (shedAmount > 0) {
      shedActions.push({
        sector,
        amountMW: Math.round(shedAmount * 100) / 100
      });
      remainingDeficit -= shedAmount;
    }
  }
  
  const totalShed = shedActions.reduce((sum, action) => sum + action.amountMW, 0);
  const unmetDeficit = deficitMW - totalShed;
  
  if (unmetDeficit > 0) {
    warnings.push(`Unable to shed full deficit. ${Math.round(unmetDeficit)} MW shortfall remains.`);
  }
  
  if (deficitMW > maxShedMW) {
    warnings.push(`Deficit exceeds maximum safe shedding limit by ${Math.round(deficitMW - maxShedMW)} MW.`);
  }
  
  return {
    totalShedMW: Math.round(totalShed * 100) / 100,
    shedActions,
    unmetDeficitMW: Math.round(unmetDeficit * 100) / 100,
    warnings
  };
}

/**
 * Voltage regulation parameters
 */
export interface VoltageRegulationParams {
  currentVoltageKV: number;
  targetVoltageKV: number;
  nominalVoltageKV: number;
  maxAdjustmentPct: number; // Maximum % adjustment allowed
}

/**
 * Calculate voltage regulation adjustment
 * 
 * @param params - Voltage regulation parameters
 * @returns Regulation adjustment and feasibility
 */
export function calculateVoltageRegulation(params: VoltageRegulationParams): {
  feasible: boolean;
  adjustmentKV: number;
  adjustmentPct: number;
  newVoltageKV: number;
  warnings: string[];
} {
  const { currentVoltageKV, targetVoltageKV, nominalVoltageKV, maxAdjustmentPct } = params;
  const warnings: string[] = [];
  
  const requiredAdjustment = targetVoltageKV - currentVoltageKV;
  const requiredPct = (requiredAdjustment / nominalVoltageKV) * 100;
  
  const maxAdjustmentKV = nominalVoltageKV * (maxAdjustmentPct / 100);
  const feasible = Math.abs(requiredAdjustment) <= maxAdjustmentKV;
  
  const actualAdjustment = feasible
    ? requiredAdjustment
    : Math.sign(requiredAdjustment) * maxAdjustmentKV;
  
  const newVoltage = currentVoltageKV + actualAdjustment;
  const actualPct = (actualAdjustment / nominalVoltageKV) * 100;
  
  if (!feasible) {
    warnings.push(
      `Voltage adjustment limited to ±${maxAdjustmentPct}%. ` +
      `Requested ${Math.abs(Math.round(requiredPct * 10) / 10)}% exceeds limit.`
    );
  }
  
  return {
    feasible,
    adjustmentKV: Math.round(actualAdjustment * 100) / 100,
    adjustmentPct: Math.round(actualPct * 100) / 100,
    newVoltageKV: Math.round(newVoltage * 100) / 100,
    warnings
  };
}

/**
 * Blackout risk assessment parameters
 */
export interface BlackoutRiskParams {
  supplyDemandDeltaPct: number;
  reserveMarginPct: number;
  transmissionUtilizationPct: number;
  voltageDeviationPct: number;
  frequencyDeviationHz: number;
}

/**
 * Calculate blackout risk score
 * 
 * @param params - Risk assessment parameters
 * @returns Risk score (0-1) and severity level
 * 
 * @example
 * const risk = calculateBlackoutRisk({
 *   supplyDemandDeltaPct: -8,
 *   reserveMarginPct: 5,
 *   transmissionUtilizationPct: 92,
 *   voltageDeviationPct: 6,
 *   frequencyDeviationHz: 0.3
 * });
 */
export function calculateBlackoutRisk(params: BlackoutRiskParams): {
  riskScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
} {
  const {
    supplyDemandDeltaPct,
    reserveMarginPct,
    transmissionUtilizationPct,
    voltageDeviationPct,
    frequencyDeviationHz
  } = params;
  
  const riskFactors: string[] = [];
  let riskScore = 0;
  
  // Supply deficit risk (highest weight)
  if (supplyDemandDeltaPct < 0) {
    const deficitRisk = Math.min(Math.abs(supplyDemandDeltaPct) / 20, 1) * 0.4;
    riskScore += deficitRisk;
    if (supplyDemandDeltaPct < -5) {
      riskFactors.push('Significant supply deficit');
    }
  }
  
  // Reserve margin risk
  if (reserveMarginPct < 15) {
    const reserveRisk = (1 - reserveMarginPct / 15) * 0.25;
    riskScore += reserveRisk;
    if (reserveMarginPct < 8) {
      riskFactors.push('Critically low reserve margin');
    }
  }
  
  // Transmission congestion risk
  if (transmissionUtilizationPct > 85) {
    const congestionRisk = ((transmissionUtilizationPct - 85) / 15) * 0.2;
    riskScore += congestionRisk;
    if (transmissionUtilizationPct > 95) {
      riskFactors.push('Severe transmission congestion');
    }
  }
  
  // Voltage instability risk
  if (Math.abs(voltageDeviationPct) > 5) {
    const voltageRisk = (Math.abs(voltageDeviationPct) - 5) / 10 * 0.1;
    riskScore += voltageRisk;
    if (Math.abs(voltageDeviationPct) > 10) {
      riskFactors.push('Dangerous voltage deviation');
    }
  }
  
  // Frequency instability risk
  if (Math.abs(frequencyDeviationHz) > 0.2) {
    const freqRisk = (Math.abs(frequencyDeviationHz) - 0.2) / 0.3 * 0.05;
    riskScore += freqRisk;
    if (Math.abs(frequencyDeviationHz) > 0.5) {
      riskFactors.push('Critical frequency deviation');
    }
  }
  
  riskScore = Math.min(riskScore, 1);
  
  const severity = 
    riskScore > 0.7 ? 'critical' :
    riskScore > 0.5 ? 'high' :
    riskScore > 0.3 ? 'medium' :
    'low';
  
  return {
    riskScore: Math.round(riskScore * 1000) / 1000,
    severity,
    riskFactors
  };
}
