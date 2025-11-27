/**
 * infrastructure.ts
 * Created: 2025-11-23
 *
 * OVERVIEW:
 * Data center infrastructure optimization utilities for power efficiency,
 * cooling management, and PUE (Power Usage Effectiveness) tracking.
 * Provides actionable recommendations to reduce operational costs and
 * improve sustainability metrics.
 *
 * KEY FEATURES:
 * - Real-time PUE calculation and trend analysis
 * - Cooling system upgrade ROI analysis
 * - Power load optimization recommendations
 * - Downtime impact calculation and prevention strategies
 * - Tier certification compliance checking
 *
 * BUSINESS LOGIC:
 * - PUE target by cooling: Air 1.8, Liquid 1.4, Immersion 1.15
 * - Cooling upgrade ROI: CAPEX vs. OPEX savings payback calculation
 * - Power costs scale linearly with utilization × PUE
 * - Downtime costs: SLA penalties + revenue loss
 * - Tier upgrades: Redundancy CAPEX vs. premium SLA revenue
 *
 * ECONOMIC GAMEPLAY:
 * - Lower PUE = reduced power bills (40-50% savings possible)
 * - Cooling upgrades: $500k-$5M CAPEX, 18-36 month payback
 * - Tier upgrades: Enable premium contracts at 2-4x pricing
 * - Utilization optimization: Maximize revenue per MW capacity
 * - Preventive maintenance: Avoid costly downtime SLA breaches
 */

import type { IDataCenter, CoolingSystem, TierCertification } from '../../db/models/DataCenter';

/**
 * PUE trend analysis result
 */
export interface PUETrend {
  currentPUE: number;
  targetPUE: number;
  trendDirection: 'Improving' | 'Worsening' | 'Stable';
  percentageFromTarget: number; // How far from target (positive = over target)
  projectedAnnualPowerCost: number;
  potentialSavings: number; // USD saved if hitting target PUE
}

/**
 * Cooling upgrade recommendation
 */
export interface CoolingUpgradeRecommendation {
  currentSystem: CoolingSystem;
  recommendedSystem: CoolingSystem;
  currentPUE: number;
  projectedPUE: number;
  estimatedUpgradeCost: number; // CAPEX for cooling system upgrade
  annualPowerSavings: number;
  paybackMonths: number;
  roi: number; // Return on investment percentage
  worthUpgrading: boolean;
  reasoning: string;
}

/**
 * Power optimization recommendation
 */
export interface PowerOptimization {
  currentUtilization: number; // Percentage (0-100)
  optimalUtilization: number; // Percentage (0-100)
  recommendation: 'Underutilized' | 'Optimal' | 'Overutilized' | 'Critical';
  action: string;
  impactEstimate: string;
  revenueOpportunity?: number; // USD potential revenue from optimization
}

/**
 * Downtime impact analysis
 */
export interface DowntimeImpact {
  downtimeHours: number;
  uptimeBreachPercentage: number; // How much below target uptime
  slaRefundDue: number; // USD refunds owed to customers
  revenueLost: number; // USD revenue lost during downtime
  reputationImpact: number; // Reputation points lost (0-10 scale)
  totalCost: number; // Total financial impact
  preventionRecommendations: string[];
}

/**
 * Tier upgrade analysis
 */
export interface TierUpgradeAnalysis {
  currentTier: TierCertification;
  recommendedTier: TierCertification;
  complianceIssues: string[];
  estimatedUpgradeCost: number; // CAPEX for redundancy, generators, etc.
  premiumRevenueIncrease: number; // Annual revenue increase from premium SLAs
  paybackMonths: number;
  worthUpgrading: boolean;
  reasoning: string;
}

/**
 * Analyze PUE trends and provide optimization insights
 * 
 * Compares current PUE to target based on cooling system.
 * Calculates potential savings from reaching optimal efficiency.
 * 
 * Formula:
 * - Target PUE from cooling system type (Air: 1.8, Liquid: 1.4, Immersion: 1.15)
 * - Current deviation = (currentPUE - targetPUE) / targetPUE × 100
 * - Annual power cost = powerMW × 8760h × PUE × $/kWh
 * - Potential savings = (currentCost - targetCost)
 * 
 * @param dataCenter - Data center to analyze
 * @param powerCostPerKWh - Regional electricity rate (USD per kWh)
 * @returns PUE trend analysis with savings potential
 * 
 * @example
 * // Data center with Air cooling, PUE 2.1, target 1.8, using 50 MW
 * analyzePUETrend(dataCenter, 0.08)
 * // Returns: {
 * //   currentPUE: 2.1,
 * //   targetPUE: 1.8,
 * //   trendDirection: 'Worsening',
 * //   percentageFromTarget: 16.7%,
 * //   projectedAnnualPowerCost: $7.36M,
 * //   potentialSavings: $1.05M/year (if hitting target)
 * // }
 */
export function analyzePUETrend(
  dataCenter: IDataCenter,
  powerCostPerKWh: number
): PUETrend {
  const currentPUE = dataCenter.pue;
  const targetPUE = dataCenter.targetPUE;
  
  // Calculate trend direction
  let trendDirection: 'Improving' | 'Worsening' | 'Stable';
  const deviation = currentPUE - targetPUE;
  
  if (Math.abs(deviation) < 0.05) {
    trendDirection = 'Stable';
  } else if (deviation < 0) {
    trendDirection = 'Improving'; // Below target = better than expected
  } else {
    trendDirection = 'Worsening'; // Above target = needs improvement
  }
  
  // Calculate percentage from target
  const percentageFromTarget = (deviation / targetPUE) * 100;
  
  // Calculate annual power costs
  const hoursPerYear = 8760; // 365 days × 24 hours
  const powerKW = dataCenter.powerUtilizationMW * 1000;
  
  const currentAnnualCost = powerKW * hoursPerYear * currentPUE * powerCostPerKWh;
  const targetAnnualCost = powerKW * hoursPerYear * targetPUE * powerCostPerKWh;
  
  const potentialSavings = currentAnnualCost - targetAnnualCost;
  
  return {
    currentPUE,
    targetPUE,
    trendDirection,
    percentageFromTarget: Math.round(percentageFromTarget * 10) / 10,
    projectedAnnualPowerCost: Math.round(currentAnnualCost),
    potentialSavings: Math.max(0, Math.round(potentialSavings)),
  };
}

/**
 * Evaluate cooling system upgrade opportunities
 * 
 * Analyzes ROI of upgrading cooling infrastructure to reduce PUE.
 * Compares CAPEX investment to OPEX savings from improved efficiency.
 * 
 * Upgrade costs (industry estimates):
 * - Air → Liquid: $500/kW cooling capacity
 * - Air → Immersion: $1,200/kW cooling capacity
 * - Liquid → Immersion: $700/kW cooling capacity
 * 
 * @param dataCenter - Data center to analyze
 * @param powerCostPerKWh - Regional electricity rate
 * @returns Cooling upgrade recommendation with ROI analysis
 * 
 * @example
 * // Air cooling (PUE 1.9), 5 MW capacity, $0.08/kWh
 * recommendCoolingUpgrade(dataCenter, 0.08)
 * // Returns: {
 * //   currentSystem: 'Air',
 * //   recommendedSystem: 'Liquid',
 * //   currentPUE: 1.9,
 * //   projectedPUE: 1.4,
 * //   estimatedUpgradeCost: $2.5M,
 * //   annualPowerSavings: $1.75M/year,
 * //   paybackMonths: 17 months,
 * //   roi: 70%,
 * //   worthUpgrading: true
 * // }
 */
export function recommendCoolingUpgrade(
  dataCenter: IDataCenter,
  powerCostPerKWh: number
): CoolingUpgradeRecommendation {
  const currentSystem = dataCenter.coolingSystem;
  const currentPUE = dataCenter.pue;
  
  // Target PUEs by cooling system
  const targetPUEs: Record<CoolingSystem, number> = {
    Air: 1.8,
    Liquid: 1.4,
    Immersion: 1.15,
  };
  
  // Upgrade costs (USD per kW of cooling capacity)
  const upgradeCosts: Record<string, number> = {
    'Air-Liquid': 500,
    'Air-Immersion': 1200,
    'Liquid-Immersion': 700,
  };
  
  // Determine best upgrade path
  let recommendedSystem: CoolingSystem;
  let upgradeCostPerKW: number;
  
  if (currentSystem === 'Air') {
    // Recommend Liquid (best ROI, proven technology)
    recommendedSystem = 'Liquid';
    upgradeCostPerKW = upgradeCosts['Air-Liquid'];
  } else if (currentSystem === 'Liquid') {
    // Recommend Immersion (cutting-edge efficiency)
    recommendedSystem = 'Immersion';
    upgradeCostPerKW = upgradeCosts['Liquid-Immersion'];
  } else {
    // Already on Immersion (best possible)
    return {
      currentSystem,
      recommendedSystem: currentSystem,
      currentPUE,
      projectedPUE: currentPUE,
      estimatedUpgradeCost: 0,
      annualPowerSavings: 0,
      paybackMonths: 0,
      roi: 0,
      worthUpgrading: false,
      reasoning: 'Already using most efficient cooling system (Immersion). No upgrade available.',
    };
  }
  
  const projectedPUE = targetPUEs[recommendedSystem];
  
  // Calculate upgrade cost
  const coolingCapacityKW = dataCenter.coolingCapacityKW;
  const estimatedUpgradeCost = coolingCapacityKW * upgradeCostPerKW;
  
  // Calculate annual power savings
  const hoursPerYear = 8760;
  const powerKW = dataCenter.powerUtilizationMW * 1000;
  
  const currentAnnualCost = powerKW * hoursPerYear * currentPUE * powerCostPerKWh;
  const projectedAnnualCost = powerKW * hoursPerYear * projectedPUE * powerCostPerKWh;
  const annualPowerSavings = currentAnnualCost - projectedAnnualCost;
  
  // Calculate payback period
  const paybackMonths = annualPowerSavings > 0
    ? Math.round((estimatedUpgradeCost / annualPowerSavings) * 12)
    : 999;
  
  // Calculate ROI (5-year horizon)
  const fiveYearSavings = annualPowerSavings * 5;
  const roi = ((fiveYearSavings - estimatedUpgradeCost) / estimatedUpgradeCost) * 100;
  
  // Recommend if payback < 36 months and ROI > 50%
  const worthUpgrading = paybackMonths < 36 && roi > 50;
  
  // Generate reasoning
  let reasoning = '';
  if (worthUpgrading) {
    reasoning = `Strong ROI: ${Math.round(roi)}% return over 5 years with ${paybackMonths}-month payback. ` +
      `Upgrading from ${currentSystem} to ${recommendedSystem} will reduce PUE from ${currentPUE.toFixed(2)} to ${projectedPUE.toFixed(2)}, ` +
      `saving $${Math.round(annualPowerSavings).toLocaleString()}/year on power costs.`;
  } else if (paybackMonths > 36) {
    reasoning = `Payback period too long (${paybackMonths} months). Consider when power costs increase or utilization grows.`;
  } else {
    reasoning = `Modest ROI (${Math.round(roi)}%). Upgrade may be worthwhile for sustainability goals or future capacity growth.`;
  }
  
  return {
    currentSystem,
    recommendedSystem,
    currentPUE,
    projectedPUE,
    estimatedUpgradeCost: Math.round(estimatedUpgradeCost),
    annualPowerSavings: Math.round(annualPowerSavings),
    paybackMonths,
    roi: Math.round(roi),
    worthUpgrading,
    reasoning,
  };
}

/**
 * Optimize power utilization for maximum revenue
 * 
 * Analyzes current power utilization and recommends actions:
 * - Underutilized: Sell excess capacity, reduce idle costs
 * - Optimal: Maintain current operations
 * - Overutilized: Risk of power constraints, recommend capacity expansion
 * - Critical: Immediate action needed to prevent outages
 * 
 * Optimal utilization: 70-85% (headroom for peaks, minimal waste)
 * 
 * @param dataCenter - Data center to analyze
 * @param powerCostPerKWh - Regional electricity rate
 * @returns Power optimization recommendation with revenue opportunity
 * 
 * @example
 * // 100 MW capacity, 50 MW utilized (50% utilization)
 * optimizePowerUsage(dataCenter, 0.08)
 * // Returns: {
 * //   currentUtilization: 50%,
 * //   optimalUtilization: 75%,
 * //   recommendation: 'Underutilized',
 * //   action: 'Sell 25 MW excess capacity via compute marketplace',
 * //   impactEstimate: 'Generate $17.5M/year revenue from idle capacity',
 * //   revenueOpportunity: $17,500,000
 * // }
 */
export function optimizePowerUsage(
  dataCenter: IDataCenter,
  _powerCostPerKWh: number
): PowerOptimization {
  const currentUtilizationMW = dataCenter.powerUtilizationMW;
  const capacityMW = dataCenter.powerCapacityMW;
  
  const currentUtilization = (currentUtilizationMW / capacityMW) * 100;
  const optimalUtilization = 75; // Target 75% utilization
  
  let recommendation: 'Underutilized' | 'Optimal' | 'Overutilized' | 'Critical';
  let action: string;
  let impactEstimate: string;
  let revenueOpportunity: number | undefined;
  
  if (currentUtilization < 50) {
    recommendation = 'Underutilized';
    
    // Calculate excess capacity
    const excessMW = (optimalUtilization / 100 * capacityMW) - currentUtilizationMW;
    
    // Estimate revenue from selling excess capacity
    // Assume $0.10/kWh compute pricing (higher than power cost)
    const computePricePerKWh = 0.10;
    const hoursPerYear = 8760;
    revenueOpportunity = excessMW * 1000 * hoursPerYear * computePricePerKWh;
    
    action = `Sell ${Math.round(excessMW)} MW excess capacity via compute marketplace or colocation contracts.`;
    impactEstimate = `Generate $${(revenueOpportunity / 1e6).toFixed(1)}M/year revenue from idle capacity.`;
    
  } else if (currentUtilization >= 50 && currentUtilization <= 85) {
    recommendation = 'Optimal';
    
    action = 'Maintain current operations. Utilization within optimal range.';
    impactEstimate = 'No immediate action needed. Monitor for growth opportunities.';
    
  } else if (currentUtilization > 85 && currentUtilization <= 95) {
    recommendation = 'Overutilized';
    
    // Calculate needed capacity expansion
    const targetCapacityMW = currentUtilizationMW / (optimalUtilization / 100);
    const expansionNeededMW = targetCapacityMW - capacityMW;
    
    // Estimate expansion cost ($2M per MW for power infrastructure)
    const expansionCost = expansionNeededMW * 2_000_000;
    
    action = `Expand power capacity by ${Math.round(expansionNeededMW)} MW to avoid constraints.`;
    impactEstimate = `Estimated expansion cost: $${(expansionCost / 1e6).toFixed(1)}M. ` +
      `Prevents revenue loss from turning away contracts.`;
    
  } else {
    recommendation = 'Critical';
    
    action = 'URGENT: Power capacity critically constrained. Immediate expansion or load shedding required.';
    impactEstimate = 'High risk of outages and SLA breaches. Prioritize capacity expansion or reduce workloads.';
  }
  
  return {
    currentUtilization: Math.round(currentUtilization * 10) / 10,
    optimalUtilization,
    recommendation,
    action,
    impactEstimate,
    revenueOpportunity: revenueOpportunity ? Math.round(revenueOpportunity) : undefined,
  };
}

/**
 * Calculate downtime impact on revenue and reputation
 * 
 * Estimates total cost of datacenter downtime including:
 * - SLA refunds to customers
 * - Revenue lost during outage
 * - Reputation damage
 * - Preventive measures to avoid future downtime
 * 
 * SLA refund formula (Tier-based):
 * - Tier 1: 10% refund per 1% uptime breach
 * - Tier 2: 20% refund per 1% uptime breach
 * - Tier 3: 50% refund per 1% uptime breach
 * - Tier 4: 100% refund per 1% uptime breach
 * 
 * @param dataCenter - Data center experiencing downtime
 * @param downtimeHours - Hours of downtime to analyze
 * @param monthlyRevenue - Monthly revenue from datacenter operations
 * @returns Downtime impact analysis with prevention recommendations
 * 
 * @example
 * // Tier 3 datacenter, 99.982% uptime target, 2-hour outage, $5M/month revenue
 * calculateDowntimeImpact(dataCenter, 2, 5000000)
 * // Returns: {
 * //   downtimeHours: 2,
 * //   uptimeBreachPercentage: 0.027%, (2 hours / 730 hours)
 * //   slaRefundDue: $67,500 (0.027% × 50x multiplier × $5M),
 * //   revenueLost: $13,700 (2/730 × $5M),
 * //   reputationImpact: 3 points,
 * //   totalCost: $81,200,
 * //   preventionRecommendations: [...]
 * // }
 */
export function calculateDowntimeImpact(
  dataCenter: IDataCenter,
  downtimeHours: number,
  monthlyRevenue: number
): DowntimeImpact {
  const hoursPerMonth = 730; // Average hours per month
  
  // Calculate uptime breach percentage
  const uptimeBreachPercentage = (downtimeHours / hoursPerMonth) * 100;
  
  // SLA refund multipliers by tier
  const slaMultipliers: Record<TierCertification, number> = {
    1: 0.10, // 10% refund per 1% breach
    2: 0.20, // 20% refund per 1% breach
    3: 0.50, // 50% refund per 1% breach
    4: 1.00, // 100% refund per 1% breach (full refund at 99% uptime)
  };
  
  const multiplier = slaMultipliers[dataCenter.tierCertification];
  
  // Calculate SLA refund
  const refundPercentage = Math.min(100, uptimeBreachPercentage * multiplier * 100);
  const slaRefundDue = (monthlyRevenue * refundPercentage) / 100;
  
  // Calculate revenue lost during downtime
  const hourlyRevenue = monthlyRevenue / hoursPerMonth;
  const revenueLost = hourlyRevenue * downtimeHours;
  
  // Reputation impact (0-10 scale)
  // Minor outages: 1-2 points, major outages: 5-8 points, catastrophic: 10 points
  let reputationImpact = 0;
  if (downtimeHours < 1) {
    reputationImpact = 1;
  } else if (downtimeHours < 4) {
    reputationImpact = 3;
  } else if (downtimeHours < 24) {
    reputationImpact = 6;
  } else {
    reputationImpact = 10;
  }
  
  // Total cost
  const totalCost = slaRefundDue + revenueLost;
  
  // Prevention recommendations
  const preventionRecommendations: string[] = [];
  
  // Tier-specific recommendations
  if (dataCenter.tierCertification < 3) {
    preventionRecommendations.push(
      `Upgrade to Tier 3+ certification for concurrent maintainability and reduced downtime risk.`
    );
  }
  
  // Redundancy recommendations
  if (dataCenter.powerRedundancy.generators < 2) {
    preventionRecommendations.push(
      `Add backup generators (currently ${dataCenter.powerRedundancy.generators}, recommend 2+ for redundancy).`
    );
  }
  
  if (!dataCenter.powerRedundancy.ups) {
    preventionRecommendations.push(
      `Install UPS (Uninterruptible Power Supply) for seamless failover during power transitions.`
    );
  }
  
  if (!dataCenter.powerRedundancy.dualUtilityFeeds) {
    preventionRecommendations.push(
      `Implement dual utility feeds from separate substations to eliminate single points of failure.`
    );
  }
  
  // Fuel reserve recommendations
  if (dataCenter.powerRedundancy.fuelReserveHours < 48) {
    preventionRecommendations.push(
      `Increase fuel reserves to 48+ hours (currently ${dataCenter.powerRedundancy.fuelReserveHours} hours).`
    );
  }
  
  // Monitoring recommendations
  preventionRecommendations.push(
    `Implement 24/7 monitoring with automated failover and alerting systems.`
  );
  
  preventionRecommendations.push(
    `Schedule regular maintenance during low-traffic windows to prevent emergency outages.`
  );
  
  return {
    downtimeHours,
    uptimeBreachPercentage: Math.round(uptimeBreachPercentage * 1000) / 1000,
    slaRefundDue: Math.round(slaRefundDue),
    revenueLost: Math.round(revenueLost),
    reputationImpact,
    totalCost: Math.round(totalCost),
    preventionRecommendations,
  };
}

/**
 * Analyze tier upgrade opportunities
 * 
 * Evaluates ROI of upgrading Tier certification to enable premium SLA contracts.
 * Compares redundancy investment (CAPEX) to revenue increase from higher-tier pricing.
 * 
 * Tier upgrade costs (industry estimates):
 * - Tier 1 → 2: $500k (1 generator + UPS)
 * - Tier 2 → 3: $2M (dual feeds, concurrency, 48h fuel)
 * - Tier 3 → 4: $5M (full fault tolerance, N+1 everything)
 * 
 * Revenue premiums:
 * - Tier 2: 1.5x pricing vs Tier 1
 * - Tier 3: 2.5x pricing vs Tier 1
 * - Tier 4: 4.0x pricing vs Tier 1
 * 
 * @param dataCenter - Data center to analyze
 * @param currentMonthlyRevenue - Current monthly revenue
 * @returns Tier upgrade analysis with ROI calculation
 * 
 * @example
 * // Tier 2 datacenter, $3M/month revenue, wants Tier 3
 * analyzeTierUpgrade(dataCenter, 3000000)
 * // Returns: {
 * //   currentTier: 2,
 * //   recommendedTier: 3,
 * //   complianceIssues: ['Need dual utility feeds', 'Need 48h fuel reserve'],
 * //   estimatedUpgradeCost: $2M,
 * //   premiumRevenueIncrease: $18M/year (1.5x → 2.5x pricing),
 * //   paybackMonths: 13 months,
 * //   worthUpgrading: true
 * // }
 */
export function analyzeTierUpgrade(
  dataCenter: IDataCenter,
  currentMonthlyRevenue: number
): TierUpgradeAnalysis {
  const currentTier = dataCenter.tierCertification;
  
  // Check current tier compliance
  const complianceCheck = dataCenter.checkTierRequirements();
  
  // If not meeting current tier, recommend fixes before upgrading
  if (!complianceCheck.meets) {
    return {
      currentTier,
      recommendedTier: currentTier,
      complianceIssues: complianceCheck.issues,
      estimatedUpgradeCost: 0,
      premiumRevenueIncrease: 0,
      paybackMonths: 0,
      worthUpgrading: false,
      reasoning: `Must fix current Tier ${currentTier} compliance issues before upgrading: ${complianceCheck.issues.join(', ')}`,
    };
  }
  
  // Already at max tier
  if (currentTier >= 4) {
    return {
      currentTier,
      recommendedTier: currentTier,
      complianceIssues: [],
      estimatedUpgradeCost: 0,
      premiumRevenueIncrease: 0,
      paybackMonths: 0,
      worthUpgrading: false,
      reasoning: 'Already at maximum Tier 4 certification. No upgrade available.',
    };
  }
  
  // Recommend next tier
  const recommendedTier = (currentTier + 1) as TierCertification;
  
  // Upgrade costs by tier transition
  const upgradeCosts: Record<string, number> = {
    '1-2': 500_000,   // Generator + UPS
    '2-3': 2_000_000, // Dual feeds, concurrency, fuel
    '3-4': 5_000_000, // Full fault tolerance
  };
  
  const upgradeKey = `${currentTier}-${recommendedTier}`;
  const estimatedUpgradeCost = upgradeCosts[upgradeKey] || 0;
  
  // Revenue premium multipliers
  const tierMultipliers: Record<TierCertification, number> = {
    1: 1.0,
    2: 1.5,
    3: 2.5,
    4: 4.0,
  };
  
  const currentMultiplier = tierMultipliers[currentTier];
  const newMultiplier = tierMultipliers[recommendedTier];
  
  // Calculate revenue increase
  const baseRevenue = currentMonthlyRevenue / currentMultiplier; // Normalize to Tier 1 baseline
  const newMonthlyRevenue = baseRevenue * newMultiplier;
  const monthlyIncrease = newMonthlyRevenue - currentMonthlyRevenue;
  const annualIncrease = monthlyIncrease * 12;
  
  // Calculate payback
  const paybackMonths = estimatedUpgradeCost > 0
    ? Math.round((estimatedUpgradeCost / monthlyIncrease))
    : 0;
  
  // Recommend if payback < 24 months
  const worthUpgrading = paybackMonths < 24 && paybackMonths > 0;
  
  // Generate reasoning
  let reasoning = '';
  if (worthUpgrading) {
    reasoning = `Strong ROI: Upgrade to Tier ${recommendedTier} pays back in ${paybackMonths} months. ` +
      `Premium SLA pricing (${currentMultiplier.toFixed(1)}x → ${newMultiplier.toFixed(1)}x) generates ` +
      `$${(annualIncrease / 1e6).toFixed(1)}M additional annual revenue.`;
  } else if (paybackMonths > 24) {
    reasoning = `Payback period too long (${paybackMonths} months). ` +
      `Consider when revenue grows or enterprise contracts require higher tier certification.`;
  } else {
    reasoning = `Tier ${recommendedTier} upgrade recommended for competitive positioning and SLA capabilities.`;
  }
  
  return {
    currentTier,
    recommendedTier,
    complianceIssues: [],
    estimatedUpgradeCost,
    premiumRevenueIncrease: Math.round(annualIncrease),
    paybackMonths,
    worthUpgrading,
    reasoning,
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. PUE OPTIMIZATION:
 *    - Target PUE: Air 1.8, Liquid 1.4, Immersion 1.15
 *    - Current vs target comparison highlights efficiency gaps
 *    - Potential savings = annual power cost difference
 *    - Every 0.1 PUE reduction = ~5-10% power bill savings
 * 
 * 2. COOLING UPGRADES:
 *    - Air → Liquid: $500/kW, 1.8 → 1.4 PUE (~22% savings)
 *    - Air → Immersion: $1,200/kW, 1.8 → 1.15 PUE (~36% savings)
 *    - Liquid → Immersion: $700/kW, 1.4 → 1.15 PUE (~18% savings)
 *    - Payback typically 18-36 months at $0.08/kWh power cost
 * 
 * 3. POWER UTILIZATION:
 *    - Optimal: 70-85% (headroom for peaks, minimal idle waste)
 *    - Underutilized <50%: Sell excess via compute marketplace
 *    - Overutilized >85%: Risk of constraints, recommend expansion
 *    - Critical >95%: Immediate capacity expansion needed
 * 
 * 4. DOWNTIME COSTS:
 *    - SLA refunds scale by tier (Tier 4 = 100x penalty vs Tier 1)
 *    - Revenue lost = hourly revenue × downtime hours
 *    - Reputation damage compounds future revenue loss
 *    - Prevention costs << downtime costs (invest in redundancy)
 * 
 * 5. TIER UPGRADES:
 *    - Tier 1→2: $500k, 1.5x pricing (payback ~12 months)
 *    - Tier 2→3: $2M, 2.5x pricing (payback ~18 months)
 *    - Tier 3→4: $5M, 4.0x pricing (payback ~24 months)
 *    - Enterprise contracts often require Tier 3+ certification
 * 
 * 6. ROI THRESHOLDS:
 *    - Cooling upgrades: Recommend if payback <36 months, ROI >50%
 *    - Tier upgrades: Recommend if payback <24 months
 *    - Power expansion: Recommend when utilization >85% (prevent constraint)
 * 
 * 7. GAMEPLAY MECHANICS:
 *    - Players balance CAPEX (upgrades) vs OPEX (ongoing costs)
 *    - Efficiency investments pay off over time (compounding savings)
 *    - Tier upgrades unlock premium contracts (higher revenue tier)
 *    - Downtime prevention critical for reputation (repeat business)
 * 
 * 8. USAGE PATTERNS:
 *    - Call analyzePUETrend() monthly for trend monitoring
 *    - Call recommendCoolingUpgrade() when PUE >10% above target
 *    - Call optimizePowerUsage() quarterly for capacity planning
 *    - Call calculateDowntimeImpact() after outages for lessons learned
 *    - Call analyzeTierUpgrade() when pursuing enterprise contracts
 */
