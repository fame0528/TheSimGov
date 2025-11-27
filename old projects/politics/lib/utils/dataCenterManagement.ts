/**
 * dataCenterManagement.ts
 * Created: 2025-11-15
 * 
 * OVERVIEW:
 * Utility functions for data center power/cooling optimization, cost calculations,
 * and Tier certification validation. Provides industry-standard formulas for PUE,
 * power cost estimation, cooling efficiency, and construction budget planning.
 * 
 * KEY FUNCTIONS:
 * - calculatePUE: Power Usage Effectiveness calculation
 * - optimizeCooling: Cooling system recommendations based on configuration
 * - validateTierCertification: Uptime Institute Tier compliance checking
 * - calculatePowerCost: Monthly electricity cost estimation
 * - estimateBuildCost: Construction budget estimation by tier and size
 * - calculateRackCapacity: Rack power and cooling requirements
 * - estimateROI: Return on investment for DC construction
 * 
 * USAGE:
 * Used by DataCenter model methods, API routes, and UI components for
 * real-time calculations, design validation, and financial planning.
 */

import type { CoolingSystem, TierCertification } from '@/lib/db/models/DataCenter';

/**
 * Power Usage Effectiveness (PUE) calculation
 * 
 * Industry-standard metric for DC energy efficiency.
 * PUE = Total Facility Power / IT Equipment Power
 * 
 * Perfect efficiency = 1.0 (all power goes to IT equipment)
 * Typical range: 1.2-2.0 (20-100% overhead for cooling/lighting/etc)
 * 
 * @param totalFacilityPower - Total DC power consumption (kW)
 * @param itEquipmentPower - Power consumed by servers/network/storage (kW)
 * @returns PUE value (dimensionless ratio)
 * 
 * @example
 * // DC using 1,800 kW total, 1,000 kW for IT equipment
 * calculatePUE(1800, 1000) // Returns 1.8
 * // Interpretation: For every 1 kW of compute, 0.8 kW goes to overhead
 */
export function calculatePUE(
  totalFacilityPower: number,
  itEquipmentPower: number
): number {
  if (itEquipmentPower <= 0) {
    throw new Error('IT equipment power must be greater than 0');
  }
  
  if (totalFacilityPower < itEquipmentPower) {
    throw new Error('Total facility power cannot be less than IT equipment power');
  }
  
  const pue = totalFacilityPower / itEquipmentPower;
  
  // Round to 2 decimal places
  return Math.round(pue * 100) / 100;
}

/**
 * Rack configuration interface for cooling optimization
 */
export interface RackConfig {
  rackCount: number;
  powerPerRackKW: number;      // Average power draw per rack
  ambientTempC: number;         // Ambient temperature (Celsius)
  currentCoolingSystem: CoolingSystem;
}

/**
 * Cooling optimization recommendation
 */
export interface CoolingRecommendation {
  currentPUE: number;
  recommendedSystem: CoolingSystem;
  estimatedPUE: number;
  potentialSavingsPercent: number;
  upgradeCost: number;
  paybackMonths: number;
  reason: string;
}

/**
 * Optimize cooling system selection
 * 
 * Analyzes rack configuration and environmental conditions to recommend
 * optimal cooling system. Considers power density, ambient temperature,
 * and cost-effectiveness.
 * 
 * Decision factors:
 * - Low density (<5 kW/rack): Air cooling sufficient
 * - Medium density (5-15 kW/rack): Liquid cooling beneficial
 * - High density (>15 kW/rack): Immersion cooling optimal
 * - Hot climates: Liquid/immersion preferred over air
 * 
 * @param config - Rack configuration and environmental parameters
 * @returns Cooling recommendation with cost-benefit analysis
 * 
 * @example
 * // 100 racks @ 12 kW each, 25°C ambient, currently using air
 * optimizeCooling({
 *   rackCount: 100,
 *   powerPerRackKW: 12,
 *   ambientTempC: 25,
 *   currentCoolingSystem: 'Air'
 * })
 * // Returns: { recommendedSystem: 'Liquid', estimatedPUE: 1.35, ... }
 */
export function optimizeCooling(config: RackConfig): CoolingRecommendation {
  const { rackCount, powerPerRackKW, ambientTempC, currentCoolingSystem } = config;
  
  // Calculate total IT power
  const totalITPowerKW = rackCount * powerPerRackKW;
  
  // Calculate current PUE based on cooling system and conditions
  const currentPUEMap: Record<CoolingSystem, number> = {
    Air: ambientTempC > 25 ? 2.0 : 1.8,        // Hot climates penalize air cooling
    Liquid: 1.4,
    Immersion: 1.15,
  };
  const currentPUE = currentPUEMap[currentCoolingSystem];
  
  // Determine recommended system based on power density
  let recommendedSystem: CoolingSystem;
  let estimatedPUE: number;
  let reason: string;
  
  if (powerPerRackKW > 15) {
    // High density: Immersion cooling
    recommendedSystem = 'Immersion';
    estimatedPUE = 1.15;
    reason = 'High power density (>15 kW/rack) benefits most from immersion cooling';
  } else if (powerPerRackKW > 5 || ambientTempC > 25) {
    // Medium density or hot climate: Liquid cooling
    recommendedSystem = 'Liquid';
    estimatedPUE = 1.4;
    reason = ambientTempC > 25
      ? 'Hot ambient temperature (>25°C) requires liquid cooling efficiency'
      : 'Medium power density (5-15 kW/rack) best served by liquid cooling';
  } else {
    // Low density: Air cooling sufficient
    recommendedSystem = 'Air';
    estimatedPUE = ambientTempC > 25 ? 2.0 : 1.8;
    reason = 'Low power density (<5 kW/rack) makes air cooling cost-effective';
  }
  
  // If already using recommended system, keep current PUE
  if (recommendedSystem === currentCoolingSystem) {
    estimatedPUE = currentPUE;
  }
  
  // Calculate potential savings
  const currentAnnualPowerKWh = totalITPowerKW * currentPUE * 8760; // Hours per year
  const optimizedAnnualPowerKWh = totalITPowerKW * estimatedPUE * 8760;
  const savingsKWh = currentAnnualPowerKWh - optimizedAnnualPowerKWh;
  const potentialSavingsPercent = ((currentPUE - estimatedPUE) / currentPUE) * 100;
  
  // Estimate upgrade cost (if changing systems)
  let upgradeCost = 0;
  if (recommendedSystem !== currentCoolingSystem) {
    const upgradeCostPerKW: Record<CoolingSystem, number> = {
      Air: 500,        // CRAC units
      Liquid: 2000,    // Manifolds, CDUs, plumbing
      Immersion: 5000, // Tanks, pumps, dielectric fluid
    };
    upgradeCost = totalITPowerKW * upgradeCostPerKW[recommendedSystem];
  }
  
  // Calculate payback period (assuming $0.10/kWh power cost)
  const annualSavings = savingsKWh * 0.10;
  const paybackMonths = upgradeCost > 0 && annualSavings > 0
    ? Math.round((upgradeCost / annualSavings) * 12)
    : 0;
  
  return {
    currentPUE: Math.round(currentPUE * 100) / 100,
    recommendedSystem,
    estimatedPUE: Math.round(estimatedPUE * 100) / 100,
    potentialSavingsPercent: Math.round(potentialSavingsPercent * 10) / 10,
    upgradeCost: Math.round(upgradeCost),
    paybackMonths,
    reason,
  };
}

/**
 * Power redundancy configuration
 */
export interface PowerRedundancy {
  generators: number;
  ups: boolean;
  fuelReserveHours: number;
  dualUtilityFeeds: boolean;
}

/**
 * Tier certification validation result
 */
export interface TierValidationResult {
  compliant: boolean;
  tier: TierCertification;
  issues: string[];
  recommendations: string[];
  estimatedUptime: number;
}

/**
 * Validate Uptime Institute Tier certification compliance
 * 
 * Checks if power redundancy configuration meets requirements for specified tier.
 * Provides detailed compliance report with actionable recommendations.
 * 
 * Tier requirements (Uptime Institute standards):
 * - Tier I: 99.671% uptime, single path, no redundancy (28.8h downtime/year)
 * - Tier II: 99.741% uptime, redundant components (22h downtime/year)
 * - Tier III: 99.982% uptime, concurrent maintainability (1.6h downtime/year)
 * - Tier IV: 99.995% uptime, fault tolerance (26min downtime/year)
 * 
 * @param targetTier - Desired tier certification (1-4)
 * @param redundancy - Current power redundancy configuration
 * @returns Validation result with compliance details
 * 
 * @example
 * // Check if Tier 3 requirements met
 * validateTierCertification(3, {
 *   generators: 2,
 *   ups: true,
 *   fuelReserveHours: 48,
 *   dualUtilityFeeds: true
 * })
 * // Returns: { compliant: true, tier: 3, issues: [], ... }
 */
export function validateTierCertification(
  targetTier: TierCertification,
  redundancy: PowerRedundancy
): TierValidationResult {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Tier requirements
  const tierRequirements: Record<TierCertification, {
    generators: number;
    ups: boolean;
    dualFeeds: boolean;
    fuelHours: number;
    uptime: number;
  }> = {
    1: { generators: 0, ups: false, dualFeeds: false, fuelHours: 0, uptime: 99.671 },
    2: { generators: 1, ups: true, dualFeeds: false, fuelHours: 12, uptime: 99.741 },
    3: { generators: 2, ups: true, dualFeeds: true, fuelHours: 48, uptime: 99.982 },
    4: { generators: 3, ups: true, dualFeeds: true, fuelHours: 96, uptime: 99.995 },
  };
  
  const req = tierRequirements[targetTier];
  
  // Validate generator count
  if (redundancy.generators < req.generators) {
    issues.push(
      `Tier ${targetTier} requires ${req.generators} generator(s) ` +
      `(currently have ${redundancy.generators})`
    );
    recommendations.push(
      `Install ${req.generators - redundancy.generators} additional generator(s)`
    );
  }
  
  // Validate UPS
  if (req.ups && !redundancy.ups) {
    issues.push(`Tier ${targetTier} requires UPS (uninterruptible power supply)`);
    recommendations.push('Install UPS system for power conditioning and bridge capacity');
  }
  
  // Validate dual utility feeds
  if (req.dualFeeds && !redundancy.dualUtilityFeeds) {
    issues.push(`Tier ${targetTier} requires dual utility feeds`);
    recommendations.push('Establish second utility connection from independent substation');
  }
  
  // Validate fuel reserve
  if (redundancy.fuelReserveHours < req.fuelHours) {
    issues.push(
      `Tier ${targetTier} requires ${req.fuelHours} hours fuel reserve ` +
      `(currently ${redundancy.fuelReserveHours} hours)`
    );
    recommendations.push(
      `Increase fuel storage capacity by ${req.fuelHours - redundancy.fuelReserveHours} hours`
    );
  }
  
  // Estimate achievable uptime based on current config
  let estimatedUptime = tierRequirements[1].uptime; // Start with Tier 1 baseline
  if (redundancy.generators >= 1 && redundancy.ups) estimatedUptime = tierRequirements[2].uptime;
  if (redundancy.generators >= 2 && redundancy.dualUtilityFeeds) estimatedUptime = tierRequirements[3].uptime;
  if (redundancy.generators >= 3 && redundancy.fuelReserveHours >= 96) estimatedUptime = tierRequirements[4].uptime;
  
  return {
    compliant: issues.length === 0,
    tier: targetTier,
    issues,
    recommendations,
    estimatedUptime: Math.round(estimatedUptime * 1000) / 1000, // 3 decimals
  };
}

/**
 * Calculate monthly power cost
 * 
 * Estimates electricity bill based on power capacity, utilization, and regional rates.
 * Includes PUE overhead to account for cooling and facility power.
 * 
 * Formula: PowerMW × 1000 kW/MW × 730 hours/month × utilization% × PUE × $/kWh
 * 
 * @param powerCapacityMW - Total DC power capacity (megawatts)
 * @param utilizationPercent - Power utilization percentage (0-100)
 * @param pue - Power Usage Effectiveness ratio
 * @param pricePerKWh - Regional electricity rate ($/kWh)
 * @returns Monthly power cost in USD
 * 
 * @example
 * // 50 MW capacity, 80% utilization, PUE 1.4, $0.08/kWh rate
 * calculatePowerCost(50, 80, 1.4, 0.08)
 * // Returns: 50 × 1000 × 730 × 0.8 × 1.4 × 0.08 = $3,270,400/month
 */
export function calculatePowerCost(
  powerCapacityMW: number,
  utilizationPercent: number,
  pue: number,
  pricePerKWh: number
): number {
  if (powerCapacityMW <= 0) throw new Error('Power capacity must be greater than 0');
  if (utilizationPercent < 0 || utilizationPercent > 100) {
    throw new Error('Utilization must be between 0 and 100');
  }
  if (pue < 1.0) throw new Error('PUE cannot be less than 1.0');
  if (pricePerKWh < 0) throw new Error('Price per kWh cannot be negative');
  
  // Convert MW to kW
  const powerKW = powerCapacityMW * 1000;
  
  // Apply utilization percentage
  const actualPowerKW = powerKW * (utilizationPercent / 100);
  
  // Average hours per month (365.25 days / 12 months × 24 hours)
  const hoursPerMonth = 730;
  
  // Total cost = actual power × hours × PUE × rate
  const monthlyCost = actualPowerKW * hoursPerMonth * pue * pricePerKWh;
  
  return Math.round(monthlyCost * 100) / 100; // Round to cents
}

/**
 * Estimate data center construction cost
 * 
 * Calculates total build cost based on power capacity, tier requirements,
 * and cooling system selection. Includes all CAPEX: shell, mechanical,
 * electrical, cooling, racks, and IT equipment.
 * 
 * Cost factors:
 * - Base shell: $1,000-1,500 per kW
 * - Tier upgrades: +15-40% for redundancy
 * - Cooling: Air (+$0), Liquid (+$1,000/kW), Immersion (+$3,000/kW)
 * - Geography: Urban (+20%), Suburban (+0%), Rural (-10%)
 * 
 * @param powerCapacityMW - Planned power capacity (megawatts)
 * @param targetTier - Uptime Institute tier certification (1-4)
 * @param coolingSystem - Selected cooling technology
 * @param propertyType - Location type affecting costs
 * @returns Estimated construction cost in USD
 * 
 * @example
 * // 10 MW, Tier 3, Liquid cooling, Suburban location
 * estimateBuildCost(10, 3, 'Liquid', 'Suburban')
 * // Returns: ~$22,500,000 (10,000 kW × $1,250 base × 1.3 tier × 1.08 liquid)
 */
export function estimateBuildCost(
  powerCapacityMW: number,
  targetTier: TierCertification,
  coolingSystem: CoolingSystem,
  propertyType: 'Urban' | 'Suburban' | 'Rural' | 'SpecialZone' = 'Suburban'
): number {
  if (powerCapacityMW <= 0) throw new Error('Power capacity must be greater than 0');
  
  // Convert to kW for cost calculation
  const powerKW = powerCapacityMW * 1000;
  
  // Base cost per kW (shell + basic electrical + mechanical)
  const basePerKW = 1250; // $1,250/kW baseline
  
  // Tier multipliers (redundancy costs)
  const tierMultipliers: Record<TierCertification, number> = {
    1: 1.0,   // No redundancy
    2: 1.15,  // +15% for component redundancy
    3: 1.30,  // +30% for concurrent maintainability
    4: 1.50,  // +50% for fault tolerance
  };
  
  // Cooling system cost adders (per kW)
  const coolingAdders: Record<CoolingSystem, number> = {
    Air: 0,      // Baseline (CRAC units included in base cost)
    Liquid: 1000, // +$1,000/kW for liquid cooling infrastructure
    Immersion: 3000, // +$3,000/kW for immersion tanks and dielectric fluid
  };
  
  // Property type multipliers
  const propertyMultipliers = {
    Urban: 1.2,       // +20% for urban buildout costs
    Suburban: 1.0,    // Baseline
    Rural: 0.9,       // -10% for rural (cheaper labor/materials)
    SpecialZone: 0.95, // -5% (tax incentives offset some costs)
  };
  
  // Calculate total cost
  const baseCost = powerKW * basePerKW;
  const tierCost = baseCost * tierMultipliers[targetTier];
  const coolingCost = powerKW * coolingAdders[coolingSystem];
  const subtotal = tierCost + coolingCost;
  const total = subtotal * propertyMultipliers[propertyType];
  
  return Math.round(total);
}

/**
 * Calculate rack power and cooling requirements
 * 
 * Determines power capacity and cooling needed for given rack configuration.
 * Used for capacity planning and infrastructure sizing.
 * 
 * @param rackCount - Number of server racks
 * @param powerPerRackKW - Average power per rack (kW)
 * @param pue - Power Usage Effectiveness
 * @returns Power and cooling requirements
 * 
 * @example
 * // 500 racks at 8 kW each, PUE 1.4
 * calculateRackCapacity(500, 8, 1.4)
 * // Returns: { itPowerKW: 4000, totalPowerKW: 5600, coolingKW: 1600 }
 */
export function calculateRackCapacity(
  rackCount: number,
  powerPerRackKW: number,
  pue: number
): { itPowerKW: number; totalPowerKW: number; coolingKW: number } {
  if (rackCount <= 0) throw new Error('Rack count must be greater than 0');
  if (powerPerRackKW <= 0) throw new Error('Power per rack must be greater than 0');
  if (pue < 1.0) throw new Error('PUE cannot be less than 1.0');
  
  const itPowerKW = rackCount * powerPerRackKW;
  const totalPowerKW = itPowerKW * pue;
  const coolingKW = totalPowerKW - itPowerKW;
  
  return {
    itPowerKW: Math.round(itPowerKW),
    totalPowerKW: Math.round(totalPowerKW),
    coolingKW: Math.round(coolingKW),
  };
}

/**
 * Estimate return on investment for DC construction
 * 
 * Calculates ROI metrics based on construction cost, operating expenses,
 * and expected revenue from compute sales.
 * 
 * @param constructionCost - Total CAPEX for DC build
 * @param monthlyRevenue - Expected monthly revenue from compute sales
 * @param monthlyOperatingCost - Monthly OPEX (power, labor, maintenance)
 * @returns ROI metrics
 * 
 * @example
 * // $20M build cost, $1.5M/mo revenue, $800K/mo OPEX
 * estimateROI(20_000_000, 1_500_000, 800_000)
 * // Returns: { monthlyProfit: 700000, annualROI: 42%, paybackMonths: 28.6 }
 */
export function estimateROI(
  constructionCost: number,
  monthlyRevenue: number,
  monthlyOperatingCost: number
): { 
  monthlyProfit: number;
  annualROI: number;
  paybackMonths: number;
} {
  if (constructionCost <= 0) throw new Error('Construction cost must be greater than 0');
  if (monthlyRevenue < 0) throw new Error('Monthly revenue cannot be negative');
  if (monthlyOperatingCost < 0) throw new Error('Monthly operating cost cannot be negative');
  
  const monthlyProfit = monthlyRevenue - monthlyOperatingCost;
  const annualProfit = monthlyProfit * 12;
  const annualROI = (annualProfit / constructionCost) * 100;
  const paybackMonths = monthlyProfit > 0 ? constructionCost / monthlyProfit : Infinity;
  
  return {
    monthlyProfit: Math.round(monthlyProfit),
    annualROI: Math.round(annualROI * 10) / 10, // 1 decimal
    paybackMonths: Math.round(paybackMonths * 10) / 10,
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. PUE CALCULATION:
 *    - Industry standard efficiency metric
 *    - Perfect efficiency = 1.0 (theoretical, never achieved)
 *    - Google/Meta DCs: ~1.1-1.2 (best in class)
 *    - Average enterprise DC: ~1.6-1.8
 *    - Poor efficiency: >2.0 (legacy facilities)
 * 
 * 2. COOLING OPTIMIZATION:
 *    - Power density is key factor (kW per rack)
 *    - Air cooling: Cost-effective for <5 kW/rack
 *    - Liquid cooling: Best for 5-15 kW/rack (GPU workloads)
 *    - Immersion: Optimal for >15 kW/rack (dense AI clusters)
 *    - Ambient temperature affects air cooling efficiency significantly
 * 
 * 3. TIER CERTIFICATIONS:
 *    - Based on Uptime Institute standards
 *    - Higher tiers = more uptime, more redundancy, more cost
 *    - Tier 4 rarely needed (99.995% = 26 min downtime/year)
 *    - Most enterprises satisfied with Tier 3 (99.982% = 1.6h/year)
 * 
 * 4. POWER COSTS:
 *    - Typically 60-70% of DC operating expenses
 *    - Regional variation: $0.04/kWh (Texas) to $0.25/kWh (California)
 *    - PUE multiplier effect: PUE 2.0 doubles effective electricity cost
 *    - Utilization matters: Low utilization wastes CAPEX, high utilization constrains growth
 * 
 * 5. BUILD COSTS:
 *    - Rule of thumb: $1,000-1,500 per kW of capacity
 *    - Tier upgrades add 15-50% for redundancy
 *    - Cooling tech adds $0-3,000/kW depending on system
 *    - Location affects costs (urban expensive, rural cheap but buildout costs)
 * 
 * 6. ROI CONSIDERATIONS:
 *    - Typical payback: 18-36 months for well-utilized facilities
 *    - Revenue depends on compute pricing and utilization
 *    - OPEX dominated by power costs (60-70%), labor (15-20%), maintenance (10-15%)
 *    - Asset depreciation: 7-10 years for building, 3-5 years for IT equipment
 * 
 * 7. RACK CAPACITY:
 *    - Traditional servers: 3-6 kW/rack
 *    - GPU servers: 10-20 kW/rack
 *    - Dense AI workloads: 30-50 kW/rack (immersion cooling)
 *    - Network switches: 1-3 kW/rack
 */
