/**
 * @fileoverview Transmission Line Calculation Utilities
 * @module lib/energy/transmission
 * 
 * OVERVIEW:
 * Shared calculation utilities for transmission line maintenance, upgrades,
 * and loss reduction. Implements capacity expansion modeling, voltage class
 * upgrades, conductor replacement analysis, and power loss calculations.
 * 
 * CALCULATIONS:
 * - Capacity changes: Circuit additions and conductor upgrades
 * - Loss reduction: Maintenance-based efficiency improvements
 * - Upgrade feasibility: Technical and economic analysis
 * - Payback period: Capital investment vs operational savings
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1 - Batch 2 DRY Utilities
 */

/**
 * Voltage class upgrade parameters
 */
export interface VoltageUpgradeParams {
  currentVoltageKV: number;
  targetVoltageKV: number;
  currentCapacityMW: number;
  lengthKm: number;
  costPerKm: number;
}

/**
 * Calculate voltage class upgrade effects
 * 
 * @param params - Upgrade parameters
 * @returns Capacity increase and cost analysis
 * 
 * @example
 * const upgrade = calculateVoltageUpgrade({
 *   currentVoltageKV: 138,
 *   targetVoltageKV: 345,
 *   currentCapacityMW: 400,
 *   lengthKm: 50,
 *   costPerKm: 2000000
 * });
 */
export function calculateVoltageUpgrade(params: VoltageUpgradeParams): {
  newCapacityMW: number;
  capacityIncreaseMW: number;
  capacityIncreasePercentage: number;
  totalCostUSD: number;
  costPerMWAdded: number;
} {
  const { currentVoltageKV, targetVoltageKV, currentCapacityMW, lengthKm, costPerKm } = params;
  
  // Capacity scales roughly with voltage ratio squared (simplified)
  const voltageRatio = targetVoltageKV / currentVoltageKV;
  const capacityMultiplier = Math.pow(voltageRatio, 1.8); // Empirical factor
  
  const newCapacity = currentCapacityMW * capacityMultiplier;
  const capacityIncrease = newCapacity - currentCapacityMW;
  const capacityIncreasePercentage = (capacityIncrease / currentCapacityMW) * 100;
  
  const totalCost = lengthKm * costPerKm;
  const costPerMWAdded = capacityIncrease > 0 ? totalCost / capacityIncrease : 0;
  
  return {
    newCapacityMW: Math.round(newCapacity * 100) / 100,
    capacityIncreaseMW: Math.round(capacityIncrease * 100) / 100,
    capacityIncreasePercentage: Math.round(capacityIncreasePercentage * 10) / 10,
    totalCostUSD: Math.round(totalCost),
    costPerMWAdded: Math.round(costPerMWAdded)
  };
}

/**
 * Conductor upgrade parameters
 */
export interface ConductorUpgradeParams {
  currentConductorType: string;
  targetConductorType: string;
  currentCapacityMW: number;
  currentLossFactor: number; // Fraction (e.g., 0.05 = 5%)
  lengthKm: number;
  costPerKm: number;
}

/**
 * Conductor capacity and loss improvement mapping
 */
const CONDUCTOR_IMPROVEMENTS: Record<string, { capacityMultiplier: number; lossReduction: number }> = {
  'ACSR-to-ACCC': { capacityMultiplier: 1.5, lossReduction: 0.25 }, // 50% capacity, 25% loss reduction
  'ACSR-to-HTLS': { capacityMultiplier: 1.7, lossReduction: 0.30 },
  'Copper-to-ACCC': { capacityMultiplier: 1.3, lossReduction: 0.20 },
  'Aluminum-to-HTLS': { capacityMultiplier: 1.6, lossReduction: 0.28 }
};

/**
 * Calculate conductor upgrade effects
 * 
 * @param params - Conductor upgrade parameters
 * @returns Capacity and loss improvements with cost
 */
export function calculateConductorUpgrade(params: ConductorUpgradeParams): {
  newCapacityMW: number;
  capacityIncreaseMW: number;
  newLossFactor: number;
  lossReductionPct: number;
  totalCostUSD: number;
  annualLossSavingsMWh: number;
} {
  const {
    currentConductorType,
    targetConductorType,
    currentCapacityMW,
    currentLossFactor,
    lengthKm,
    costPerKm
  } = params;
  
  const upgradeKey = `${currentConductorType}-to-${targetConductorType}`;
  const improvements = CONDUCTOR_IMPROVEMENTS[upgradeKey] || {
    capacityMultiplier: 1.2,
    lossReduction: 0.15
  };
  
  const newCapacity = currentCapacityMW * improvements.capacityMultiplier;
  const capacityIncrease = newCapacity - currentCapacityMW;
  
  const lossReductionAmount = currentLossFactor * improvements.lossReduction;
  const newLossFactor = currentLossFactor - lossReductionAmount;
  const lossReductionPct = (lossReductionAmount / currentLossFactor) * 100;
  
  // Annual loss savings (assuming 70% utilization, 8760 hours/year)
  const avgLoadMW = currentCapacityMW * 0.7;
  const annualTransmittedMWh = avgLoadMW * 8760;
  const annualLossSavings = annualTransmittedMWh * lossReductionAmount;
  
  const totalCost = lengthKm * costPerKm;
  
  return {
    newCapacityMW: Math.round(newCapacity * 100) / 100,
    capacityIncreaseMW: Math.round(capacityIncrease * 100) / 100,
    newLossFactor: Math.round(newLossFactor * 10000) / 10000,
    lossReductionPct: Math.round(lossReductionPct * 10) / 10,
    totalCostUSD: Math.round(totalCost),
    annualLossSavingsMWh: Math.round(annualLossSavings)
  };
}

/**
 * Circuit addition parameters
 */
export interface CircuitAdditionParams {
  currentCircuits: number;
  additionalCircuits: number;
  capacityPerCircuitMW: number;
  costPerCircuitPerKm: number;
  lengthKm: number;
}

/**
 * Calculate circuit addition effects
 * 
 * @param params - Circuit addition parameters
 * @returns Capacity increase and cost
 */
export function calculateCircuitAddition(params: CircuitAdditionParams): {
  newTotalCircuits: number;
  newCapacityMW: number;
  capacityIncreaseMW: number;
  totalCostUSD: number;
  redundancyFactor: number;
} {
  const {
    currentCircuits,
    additionalCircuits,
    capacityPerCircuitMW,
    costPerCircuitPerKm,
    lengthKm
  } = params;
  
  const newTotalCircuits = currentCircuits + additionalCircuits;
  const newCapacity = newTotalCircuits * capacityPerCircuitMW;
  const currentCapacity = currentCircuits * capacityPerCircuitMW;
  const capacityIncrease = newCapacity - currentCapacity;
  
  // Redundancy factor (N-1 capability)
  const redundancyFactor = (newTotalCircuits - 1) / newTotalCircuits;
  
  const totalCost = additionalCircuits * costPerCircuitPerKm * lengthKm;
  
  return {
    newTotalCircuits,
    newCapacityMW: Math.round(newCapacity * 100) / 100,
    capacityIncreaseMW: Math.round(capacityIncrease * 100) / 100,
    totalCostUSD: Math.round(totalCost),
    redundancyFactor: Math.round(redundancyFactor * 1000) / 1000
  };
}

/**
 * Calculate maintenance-based loss reduction
 * 
 * @param currentLossFactor - Current loss factor (0-1)
 * @param maintenanceType - Type of maintenance performed
 * @returns Updated loss factor
 */
export function calculateLossReduction(
  currentLossFactor: number,
  maintenanceType: 'inspection' | 'loss-reduction' | 'upgrade-voltage' | 'upgrade-conductor'
): {
  newLossFactor: number;
  lossReductionPct: number;
} {
  // Loss reduction based on maintenance type
  const reductionMap = {
    'inspection': 0.02,
    'loss-reduction': 0.10,
    'upgrade-voltage': 0.15,
    'upgrade-conductor': 0.25
  };
  
  const reductionFraction = reductionMap[maintenanceType];
  const lossReductionAmount = currentLossFactor * reductionFraction;
  const newLossFactor = Math.max(currentLossFactor - lossReductionAmount, 0.001);
  const lossReductionPct = (lossReductionAmount / currentLossFactor) * 100;
  
  return {
    newLossFactor: Math.round(newLossFactor * 10000) / 10000,
    lossReductionPct: Math.round(lossReductionPct * 10) / 10
  };
}

/**
 * Calculate payback period for transmission upgrade
 * 
 * @param capitalCost - Total upgrade cost
 * @param annualLossSavingsMWh - Annual energy loss reduction
 * @param electricityPrice - Price per MWh
 * @param annualMaintenanceSavings - Annual O&M cost reduction
 * @returns Payback period in years
 */
export function calculateUpgradePayback(
  capitalCost: number,
  annualLossSavingsMWh: number,
  electricityPrice: number,
  annualMaintenanceSavings: number = 0
): {
  annualLossSavingsUSD: number;
  totalAnnualSavingsUSD: number;
  paybackYears: number;
  paybackDays: number;
} {
  const annualLossSavingsUSD = annualLossSavingsMWh * electricityPrice;
  const totalAnnualSavings = annualLossSavingsUSD + annualMaintenanceSavings;
  
  const paybackYears = totalAnnualSavings > 0
    ? capitalCost / totalAnnualSavings
    : Infinity;
  
  const paybackDays = paybackYears * 365;
  
  return {
    annualLossSavingsUSD: Math.round(annualLossSavingsUSD),
    totalAnnualSavingsUSD: Math.round(totalAnnualSavings),
    paybackYears: Math.round(paybackYears * 100) / 100,
    paybackDays: Math.round(paybackDays)
  };
}
