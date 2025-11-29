/**
 * @fileoverview Energy Storage Calculation Utilities
 * @module lib/energy/storage
 * 
 * OVERVIEW:
 * Shared calculation utilities for energy storage charging, discharging,
 * and cycle degradation. Implements state-of-charge management, efficiency
 * losses, tariff-aware scheduling, and battery lifecycle modeling.
 * 
 * CALCULATIONS:
 * - Charge planning: Tariff-aware optimal charging schedules
 * - Discharge planning: Peak shaving and revenue optimization
 * - Cycle degradation: Lifetime tracking and capacity fade
 * - State of charge: Efficiency-adjusted energy accounting
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1 - Batch 2 DRY Utilities
 */

/**
 * Charge operation parameters
 */
export interface ChargeParams {
  currentSoCPct: number;
  capacityMWh: number;
  chargeAmountMWh: number;
  maxChargeRateMW: number;
  chargeEfficiency: number; // 0-1
  electricityPrice: number;
  minReservePct?: number;
}

/**
 * Calculate charge operation effects
 * 
 * @param params - Charge operation parameters
 * @returns Charge results with efficiency losses and cost
 * 
 * @example
 * const charge = calculateCharge({
 *   currentSoCPct: 45,
 *   capacityMWh: 100,
 *   chargeAmountMWh: 30,
 *   maxChargeRateMW: 25,
 *   chargeEfficiency: 0.92,
 *   electricityPrice: 45
 * });
 */
export function calculateCharge(params: ChargeParams): {
  feasible: boolean;
  actualChargedMWh: number;
  inputEnergyMWh: number;
  efficiencyLossMWh: number;
  newSoCPct: number;
  costUSD: number;
  chargeTimeHours: number;
  warnings: string[];
} {
  const {
    currentSoCPct,
    capacityMWh,
    chargeAmountMWh,
    maxChargeRateMW,
    chargeEfficiency,
    electricityPrice,
    minReservePct = 0
  } = params;
  
  const warnings: string[] = [];
  
  const currentEnergyMWh = (currentSoCPct / 100) * capacityMWh;
  const maxEnergyMWh = capacityMWh;
  const availableSpace = maxEnergyMWh - currentEnergyMWh;
  
  // Limit charge by available space
  let actualCharge = Math.min(chargeAmountMWh, availableSpace);
  
  // Input energy required accounting for efficiency loss
  const inputEnergy = actualCharge / chargeEfficiency;
  
  // Check charge rate limit (assume 1 hour operation for simplicity)
  const chargeTimeHours = inputEnergy / maxChargeRateMW;
  if (chargeTimeHours > 1) {
    // Rate-limited, reduce actual charge
    const maxInput = maxChargeRateMW * 1; // 1 hour
    actualCharge = maxInput * chargeEfficiency;
    warnings.push(`Charge rate limited to ${maxChargeRateMW} MW. Full charge requires ${Math.ceil(chargeTimeHours)} hours.`);
  }
  
  const actualInputEnergy = actualCharge / chargeEfficiency;
  const efficiencyLoss = actualInputEnergy - actualCharge;
  
  const newEnergyMWh = currentEnergyMWh + actualCharge;
  const newSoC = (newEnergyMWh / capacityMWh) * 100;
  
  const cost = actualInputEnergy * electricityPrice;
  
  const feasible = actualCharge > 0 && newSoC <= 100;
  
  if (!feasible) {
    warnings.push('Charge operation not feasible - battery at or near full capacity');
  }
  
  if (newSoC > 95) {
    warnings.push('Battery near full capacity - consider reducing charge amount');
  }
  
  return {
    feasible,
    actualChargedMWh: Math.round(actualCharge * 100) / 100,
    inputEnergyMWh: Math.round(actualInputEnergy * 100) / 100,
    efficiencyLossMWh: Math.round(efficiencyLoss * 100) / 100,
    newSoCPct: Math.round(newSoC * 10) / 10,
    costUSD: Math.round(cost * 100) / 100,
    chargeTimeHours: Math.round(chargeTimeHours * 100) / 100,
    warnings
  };
}

/**
 * Discharge operation parameters
 */
export interface DischargeParams {
  currentSoCPct: number;
  capacityMWh: number;
  dischargeAmountMWh: number;
  maxDischargeRateMW: number;
  dischargeEfficiency: number; // 0-1
  electricityPrice: number;
  minReservePct?: number;
}

/**
 * Calculate discharge operation effects
 * 
 * @param params - Discharge operation parameters
 * @returns Discharge results with efficiency losses and revenue
 */
export function calculateDischarge(params: DischargeParams): {
  feasible: boolean;
  actualDischargedMWh: number;
  deliveredEnergyMWh: number;
  efficiencyLossMWh: number;
  newSoCPct: number;
  revenueUSD: number;
  dischargeTimeHours: number;
  warnings: string[];
} {
  const {
    currentSoCPct,
    capacityMWh,
    dischargeAmountMWh,
    maxDischargeRateMW,
    dischargeEfficiency,
    electricityPrice,
    minReservePct = 10
  } = params;
  
  const warnings: string[] = [];
  
  const currentEnergyMWh = (currentSoCPct / 100) * capacityMWh;
  const minReserveEnergy = (minReservePct / 100) * capacityMWh;
  const availableEnergy = currentEnergyMWh - minReserveEnergy;
  
  // Limit discharge by available energy above reserve
  let actualDischarge = Math.min(dischargeAmountMWh, availableEnergy);
  
  if (actualDischarge <= 0) {
    warnings.push(`Cannot discharge - at or below minimum reserve (${minReservePct}%)`);
    return {
      feasible: false,
      actualDischargedMWh: 0,
      deliveredEnergyMWh: 0,
      efficiencyLossMWh: 0,
      newSoCPct: currentSoCPct,
      revenueUSD: 0,
      dischargeTimeHours: 0,
      warnings
    };
  }
  
  // Delivered energy accounting for efficiency loss
  const deliveredEnergy = actualDischarge * dischargeEfficiency;
  
  // Check discharge rate limit
  const dischargeTimeHours = actualDischarge / maxDischargeRateMW;
  if (dischargeTimeHours > 1) {
    // Rate-limited
    actualDischarge = maxDischargeRateMW * 1; // 1 hour
    warnings.push(`Discharge rate limited to ${maxDischargeRateMW} MW. Full discharge requires ${Math.ceil(dischargeTimeHours)} hours.`);
  }
  
  const actualDeliveredEnergy = actualDischarge * dischargeEfficiency;
  const efficiencyLoss = actualDischarge - actualDeliveredEnergy;
  
  const newEnergyMWh = currentEnergyMWh - actualDischarge;
  const newSoC = (newEnergyMWh / capacityMWh) * 100;
  
  const revenue = actualDeliveredEnergy * electricityPrice;
  
  if (newSoC < minReservePct + 5) {
    warnings.push('Battery approaching minimum reserve - consider reducing discharge');
  }
  
  return {
    feasible: true,
    actualDischargedMWh: Math.round(actualDischarge * 100) / 100,
    deliveredEnergyMWh: Math.round(actualDeliveredEnergy * 100) / 100,
    efficiencyLossMWh: Math.round(efficiencyLoss * 100) / 100,
    newSoCPct: Math.round(newSoC * 10) / 10,
    revenueUSD: Math.round(revenue * 100) / 100,
    dischargeTimeHours: Math.round(dischargeTimeHours * 100) / 100,
    warnings
  };
}

/**
 * Cycle degradation parameters
 */
export interface CycleDegradationParams {
  currentCycles: number;
  ratedCycles: number;
  depthOfDischarge: number; // 0-100%
  currentCapacityMWh: number;
  ratedCapacityMWh: number;
}

/**
 * Calculate cycle degradation impact
 * 
 * @param params - Cycle degradation parameters
 * @returns Degradation analysis and remaining life
 * 
 * @example
 * const degradation = calculateCycleDegradation({
 *   currentCycles: 2500,
 *   ratedCycles: 5000,
 *   depthOfDischarge: 80,
 *   currentCapacityMWh: 95,
 *   ratedCapacityMWh: 100
 * });
 */
export function calculateCycleDegradation(params: CycleDegradationParams): {
  cycleIncrement: number;
  effectiveCycles: number;
  remainingCycles: number;
  capacityFadePct: number;
  endOfLifeReached: boolean;
  warnings: string[];
} {
  const {
    currentCycles,
    ratedCycles,
    depthOfDischarge,
    currentCapacityMWh,
    ratedCapacityMWh
  } = params;
  
  const warnings: string[] = [];
  
  // Depth-of-discharge cycle weighting (deeper discharge = more wear)
  // 100% DoD = 1.0 cycle, 50% DoD = 0.5 cycle, etc.
  const dodFactor = depthOfDischarge / 100;
  const cycleIncrement = dodFactor;
  
  // Effective cycles accounting for DoD
  const effectiveCycles = currentCycles + cycleIncrement;
  const remainingCycles = Math.max(ratedCycles - effectiveCycles, 0);
  
  // Capacity fade calculation
  const capacityFade = ((ratedCapacityMWh - currentCapacityMWh) / ratedCapacityMWh) * 100;
  
  // End-of-life typically at 80% capacity or rated cycles exceeded
  const endOfLife = capacityFade >= 20 || effectiveCycles >= ratedCycles;
  
  if (endOfLife) {
    warnings.push('Battery has reached end-of-life (20% capacity fade or cycle limit)');
  } else if (capacityFade >= 15) {
    warnings.push('Battery approaching end-of-life - consider replacement planning');
  }
  
  if (remainingCycles < ratedCycles * 0.1) {
    warnings.push(`Only ${Math.round(remainingCycles)} cycles remaining (< 10% of rated life)`);
  }
  
  return {
    cycleIncrement: Math.round(cycleIncrement * 100) / 100,
    effectiveCycles: Math.round(effectiveCycles * 10) / 10,
    remainingCycles: Math.round(remainingCycles),
    capacityFadePct: Math.round(capacityFade * 10) / 10,
    endOfLifeReached: endOfLife,
    warnings
  };
}

/**
 * Calculate state of charge update
 * 
 * @param currentSoCPct - Current state of charge percentage
 * @param capacityMWh - Total battery capacity
 * @param energyDeltaMWh - Energy change (positive = charge, negative = discharge)
 * @returns Updated state of charge
 */
export function updateStateOfCharge(
  currentSoCPct: number,
  capacityMWh: number,
  energyDeltaMWh: number
): {
  newSoCPct: number;
  newEnergyMWh: number;
} {
  const currentEnergyMWh = (currentSoCPct / 100) * capacityMWh;
  const newEnergy = Math.max(0, Math.min(currentEnergyMWh + energyDeltaMWh, capacityMWh));
  const newSoC = (newEnergy / capacityMWh) * 100;
  
  return {
    newSoCPct: Math.round(newSoC * 10) / 10,
    newEnergyMWh: Math.round(newEnergy * 100) / 100
  };
}
