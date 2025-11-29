/**
 * @fileoverview Wind Turbine Domain Calculation Utilities
 * @module lib/energy/wind
 * 
 * OVERVIEW:
 * Shared calculation utilities for wind turbine operations including
 * power curve modeling, curtailment logic, maintenance cost estimation,
 * and blade integrity restoration. Implements physics-based wind energy
 * calculations with degradation factors.
 * 
 * CALCULATIONS:
 * - Power curve: Cubic relationship with cut-in/rated/cut-out thresholds
 * - Air density correction: Temperature and altitude adjustments
 * - Curtailment: Gust-based mechanical load safety limits
 * - Revenue: Price-based with degradation and efficiency factors
 * - Maintenance: Cost estimation with payback period analysis
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1 - Batch 2 DRY Utilities
 */

/**
 * Standard air density at sea level (kg/m³)
 */
const STANDARD_AIR_DENSITY = 1.225;

/**
 * Air density adjustment parameters
 */
interface DensityParams {
  temperature?: number; // Celsius
  altitude?: number; // Meters above sea level
}

/**
 * Power curve parameters from turbine specifications
 */
export interface PowerCurveParams {
  cutInSpeed: number; // m/s
  ratedSpeed: number; // m/s
  cutOutSpeed: number; // m/s
  ratedPowerMW: number;
}

/**
 * Calculate air density correction factor
 * 
 * @param params - Temperature and altitude parameters
 * @returns Density ratio relative to standard conditions
 * 
 * @example
 * const correction = calculateDensityCorrection({ temperature: 25, altitude: 500 });
 * const effectiveWindSpeed = windSpeed * Math.pow(correction, 1/3);
 */
export function calculateDensityCorrection(params: DensityParams): number {
  const { temperature = 15, altitude = 0 } = params;
  
  // Temperature correction (simplified ideal gas law)
  const tempKelvin = temperature + 273.15;
  const tempCorrection = 288.15 / tempKelvin;
  
  // Altitude correction (barometric formula)
  const altitudeCorrection = Math.exp(-altitude / 8500);
  
  return tempCorrection * altitudeCorrection;
}

/**
 * Calculate power output using cubic power curve
 * 
 * @param windSpeed - Effective wind speed (m/s)
 * @param params - Turbine power curve parameters
 * @param bladeIntegrity - Blade integrity factor (0-1, default 1)
 * @returns Power output in MW
 * 
 * @example
 * const output = calculatePowerCurve(12, {
 *   cutInSpeed: 3,
 *   ratedSpeed: 12,
 *   cutOutSpeed: 25,
 *   ratedPowerMW: 2.5
 * }, 0.95);
 */
export function calculatePowerCurve(
  windSpeed: number,
  params: PowerCurveParams,
  bladeIntegrity: number = 1
): number {
  const { cutInSpeed, ratedSpeed, cutOutSpeed, ratedPowerMW } = params;
  
  // Below cut-in: No generation
  if (windSpeed < cutInSpeed) {
    return 0;
  }
  
  // Above cut-out: Safety shutdown
  if (windSpeed >= cutOutSpeed) {
    return 0;
  }
  
  // At or above rated speed: Full power (with degradation)
  if (windSpeed >= ratedSpeed) {
    return ratedPowerMW * bladeIntegrity;
  }
  
  // Between cut-in and rated: Cubic power curve
  // P = Prated × ((v - vcut-in) / (vrated - vcut-in))³
  const speedRatio = (windSpeed - cutInSpeed) / (ratedSpeed - cutInSpeed);
  const cubicOutput = ratedPowerMW * Math.pow(speedRatio, 3);
  
  return cubicOutput * bladeIntegrity;
}

/**
 * Curtailment decision parameters
 */
export interface CurtailmentParams {
  windSpeed: number;
  gustFactor: number;
  cutOutSpeed: number;
  safetyThreshold: number; // Fraction of cut-out speed
  overrideAllowed: boolean;
}

/**
 * Determine if curtailment or shutdown required
 * 
 * @param params - Curtailment decision parameters
 * @returns Curtailment decision with applied factor and warnings
 * 
 * @example
 * const decision = evaluateCurtailment({
 *   windSpeed: 20,
 *   gustFactor: 1.3,
 *   cutOutSpeed: 25,
 *   safetyThreshold: 0.9,
 *   overrideAllowed: false
 * });
 */
export function evaluateCurtailment(params: CurtailmentParams): {
  shouldCurtail: boolean;
  shouldShutdown: boolean;
  curtailmentFactor: number;
  warnings: string[];
} {
  const { windSpeed, gustFactor, cutOutSpeed, safetyThreshold, overrideAllowed } = params;
  const warnings: string[] = [];
  
  const effectiveSpeed = windSpeed * gustFactor;
  
  // Storm shutdown if gusts exceed cut-out
  if (effectiveSpeed >= cutOutSpeed) {
    warnings.push('Storm shutdown triggered due to extreme gusts');
    return {
      shouldCurtail: false,
      shouldShutdown: true,
      curtailmentFactor: 0,
      warnings
    };
  }
  
  // Curtailment if approaching safety threshold
  const safetyLimit = cutOutSpeed * safetyThreshold;
  if (effectiveSpeed >= safetyLimit && !overrideAllowed) {
    const curtailmentFactor = safetyLimit / effectiveSpeed;
    warnings.push(`Curtailment applied: ${Math.round((1 - curtailmentFactor) * 100)}% reduction due to high gusts`);
    return {
      shouldCurtail: true,
      shouldShutdown: false,
      curtailmentFactor,
      warnings
    };
  }
  
  // Normal operation
  return {
    shouldCurtail: false,
    shouldShutdown: false,
    curtailmentFactor: 1,
    warnings
  };
}

/**
 * Calculate operational revenue
 * 
 * @param outputMW - Power output in MW
 * @param operatingHours - Hours of operation
 * @param electricityPrice - Price per MWh
 * @param operatingCost - Operating cost per MWh
 * @returns Revenue breakdown
 * 
 * @example
 * const revenue = calculateRevenue(2.3, 1, 85, 15);
 */
export function calculateRevenue(
  outputMW: number,
  operatingHours: number,
  electricityPrice: number,
  operatingCost: number = 0
): {
  energyMWh: number;
  grossRevenue: number;
  operatingCost: number;
  netRevenue: number;
} {
  const energyMWh = outputMW * operatingHours;
  const grossRevenue = energyMWh * electricityPrice;
  const totalOperatingCost = energyMWh * operatingCost;
  const netRevenue = grossRevenue - totalOperatingCost;
  
  return {
    energyMWh: Math.round(energyMWh * 100) / 100,
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    operatingCost: Math.round(totalOperatingCost * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100
  };
}

/**
 * Maintenance task types
 */
export type MaintenanceTaskType = 
  | 'blade-inspection'
  | 'lubrication'
  | 'pitch-system'
  | 'generator'
  | 'gearbox'
  | 'electrical'
  | 'tower-inspection';

/**
 * Maintenance cost estimation
 * 
 * @param tasks - Array of maintenance task types
 * @param downtimeHours - Hours of downtime
 * @param technicianCount - Number of technicians
 * @param laborRate - Labor rate per technician per hour
 * @param partsCost - Cost of replacement parts
 * @returns Total maintenance cost breakdown
 */
export function estimateMaintenanceCost(
  tasks: MaintenanceTaskType[],
  downtimeHours: number,
  technicianCount: number = 2,
  laborRate: number = 75,
  partsCost: number = 0
): {
  laborCost: number;
  partsCost: number;
  totalCost: number;
} {
  const laborCost = downtimeHours * technicianCount * laborRate;
  const totalCost = laborCost + partsCost;
  
  return {
    laborCost: Math.round(laborCost * 100) / 100,
    partsCost: Math.round(partsCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100
  };
}

/**
 * Calculate blade integrity restoration from maintenance
 * 
 * @param currentIntegrity - Current blade integrity array (0-100 per blade)
 * @param tasks - Maintenance tasks performed
 * @param historicalMax - Historical maximum integrity values
 * @returns Updated integrity values
 * 
 * @example
 * const newIntegrity = applyBladeIntegrityRestoration(
 *   [85, 82, 87],
 *   ['blade-inspection', 'lubrication'],
 *   [95, 96, 94]
 * );
 */
export function applyBladeIntegrityRestoration(
  currentIntegrity: number[],
  tasks: MaintenanceTaskType[],
  historicalMax: number[]
): number[] {
  // Blade-specific tasks restore integrity
  const hasBladeInspection = tasks.includes('blade-inspection');
  const hasLubrication = tasks.includes('lubrication');
  
  if (!hasBladeInspection && !hasLubrication) {
    return currentIntegrity;
  }
  
  // Restoration percentage based on tasks
  let restorationPct = 0;
  if (hasBladeInspection) restorationPct += 15;
  if (hasLubrication) restorationPct += 5;
  
  return currentIntegrity.map((integrity, index) => {
    const maxPossible = historicalMax[index] || 100;
    const restored = integrity + (maxPossible - integrity) * (restorationPct / 100);
    return Math.min(Math.round(restored * 10) / 10, maxPossible);
  });
}

/**
 * Calculate maintenance payback period
 * 
 * @param maintenanceCost - Total maintenance cost
 * @param efficiencyGainPct - Efficiency improvement percentage
 * @param avgOutputMW - Average power output
 * @param electricityPrice - Price per MWh
 * @param operatingHoursPerYear - Annual operating hours
 * @returns Payback period in days
 */
export function calculatePaybackPeriod(
  maintenanceCost: number,
  efficiencyGainPct: number,
  avgOutputMW: number,
  electricityPrice: number,
  operatingHoursPerYear: number = 3000
): number {
  if (efficiencyGainPct <= 0) {
    return Infinity;
  }
  
  // Annual additional revenue from efficiency gain
  const additionalAnnualMWh = avgOutputMW * operatingHoursPerYear * (efficiencyGainPct / 100);
  const additionalAnnualRevenue = additionalAnnualMWh * electricityPrice;
  
  if (additionalAnnualRevenue <= 0) {
    return Infinity;
  }
  
  // Payback in years, then convert to days
  const paybackYears = maintenanceCost / additionalAnnualRevenue;
  const paybackDays = paybackYears * 365;
  
  return Math.round(paybackDays * 10) / 10;
}
