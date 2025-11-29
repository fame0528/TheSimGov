/**
 * @file src/lib/utils/manufacturing/cogsCalculator.ts
 * @description Cost of Goods Sold (COGS) calculation utility
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Calculates manufacturing costs including direct materials, direct labor,
 * and manufacturing overhead. Supports activity-based costing (ABC) and
 * traditional volume-based costing methods.
 * 
 * FORMULAS:
 * - COGS = Beginning Inventory + Purchases - Ending Inventory
 * - Manufacturing Cost = Direct Materials + Direct Labor + Manufacturing Overhead
 * - Cost Per Unit = Total Manufacturing Cost / Units Produced
 * - Gross Margin = (Revenue - COGS) / Revenue × 100%
 */

import type { COGSInputs, COGSResult } from '@/types/manufacturing';

/**
 * Calculate Cost of Goods Sold
 * 
 * @param inputs - COGS calculation inputs
 * @returns COGS result with breakdown
 * 
 * @example
 * const result = calculateCOGS({
 *   directMaterials: 50000,
 *   directLabor: 30000,
 *   manufacturingOverhead: 20000,
 *   beginningInventory: 15000,
 *   endingInventory: 12000
 * });
 * // result.cogs = 103000
 */
export function calculateCOGS(inputs: COGSInputs, unitsProduced = 1000, revenuePerUnit = 150): COGSResult {
  const { directMaterials, directLabor, manufacturingOverhead, beginningInventory, endingInventory } = inputs;

  // Calculate total manufacturing cost
  const totalManufacturingCost = directMaterials + directLabor + manufacturingOverhead;

  // COGS = Beginning Inventory + Total Manufacturing Cost - Ending Inventory
  const cogs = beginningInventory + totalManufacturingCost - endingInventory;

  // Cost per unit
  const costPerUnit = unitsProduced > 0 ? cogs / unitsProduced : 0;

  // Gross margin
  const revenue = unitsProduced * revenuePerUnit;
  const grossMargin = revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0;

  // Breakdown percentages
  const total = directMaterials + directLabor + manufacturingOverhead;
  const breakdown = {
    materials: total > 0 ? (directMaterials / total) * 100 : 0,
    labor: total > 0 ? (directLabor / total) * 100 : 0,
    overhead: total > 0 ? (manufacturingOverhead / total) * 100 : 0,
  };

  return {
    cogs: Math.round(cogs * 100) / 100,
    costPerUnit: Math.round(costPerUnit * 100) / 100,
    grossMargin: Math.round(grossMargin * 100) / 100,
    breakdown: {
      materials: Math.round(breakdown.materials * 100) / 100,
      labor: Math.round(breakdown.labor * 100) / 100,
      overhead: Math.round(breakdown.overhead * 100) / 100,
    },
  };
}

/**
 * Activity-based costing inputs
 */
export interface ActivityCostPool {
  activity: string;
  totalCost: number;
  costDriver: string;
  totalDriverUnits: number;
}

export interface ProductActivityUsage {
  product: string;
  unitsProduced: number;
  directMaterials: number;
  directLabor: number;
  activityUsage: Record<string, number>; // Activity name -> driver units used
}

export interface ABCResult {
  products: Array<{
    product: string;
    directMaterials: number;
    directLabor: number;
    overheadAllocated: number;
    totalCost: number;
    costPerUnit: number;
    activityBreakdown: Array<{ activity: string; cost: number }>;
  }>;
  totalOverhead: number;
  allocationAccuracy: string;
}

/**
 * Activity-based costing calculation
 * 
 * @param costPools - Activity cost pools with drivers
 * @param products - Products with their activity usage
 * @returns ABC cost allocation results
 */
export function calculateABC(
  costPools: ActivityCostPool[],
  products: ProductActivityUsage[]
): ABCResult {
  // Calculate cost rates per driver unit for each activity
  const costRates = new Map<string, number>();
  for (const pool of costPools) {
    const rate = pool.totalDriverUnits > 0 ? pool.totalCost / pool.totalDriverUnits : 0;
    costRates.set(pool.activity, rate);
  }

  // Allocate costs to products
  const productResults = products.map(product => {
    const activityBreakdown: Array<{ activity: string; cost: number }> = [];
    let overheadAllocated = 0;

    for (const pool of costPools) {
      const usage = product.activityUsage[pool.activity] || 0;
      const rate = costRates.get(pool.activity) || 0;
      const cost = usage * rate;
      overheadAllocated += cost;
      activityBreakdown.push({ activity: pool.activity, cost: Math.round(cost * 100) / 100 });
    }

    const totalCost = product.directMaterials + product.directLabor + overheadAllocated;
    const costPerUnit = product.unitsProduced > 0 ? totalCost / product.unitsProduced : 0;

    return {
      product: product.product,
      directMaterials: product.directMaterials,
      directLabor: product.directLabor,
      overheadAllocated: Math.round(overheadAllocated * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      costPerUnit: Math.round(costPerUnit * 100) / 100,
      activityBreakdown,
    };
  });

  const totalOverhead = costPools.reduce((sum, pool) => sum + pool.totalCost, 0);
  const allocatedOverhead = productResults.reduce((sum, p) => sum + p.overheadAllocated, 0);
  const allocationAccuracy = `${Math.round((allocatedOverhead / totalOverhead) * 100)}% allocated`;

  return {
    products: productResults,
    totalOverhead,
    allocationAccuracy,
  };
}

/**
 * Standard cost variance analysis
 */
export interface StandardCosts {
  materialPriceStandard: number;    // $/unit material
  materialQuantityStandard: number; // Units material/product
  laborRateStandard: number;        // $/hour
  laborEfficiencyStandard: number;  // Hours/product
  overheadRate: number;             // $/labor hour
}

export interface ActualCosts {
  materialPriceActual: number;
  materialQuantityActual: number;
  laborRateActual: number;
  laborHoursActual: number;
  overheadActual: number;
  unitsProduced: number;
}

export interface VarianceAnalysis {
  materialPriceVariance: number;
  materialQuantityVariance: number;
  totalMaterialVariance: number;
  laborRateVariance: number;
  laborEfficiencyVariance: number;
  totalLaborVariance: number;
  overheadVariance: number;
  totalVariance: number;
  favorableOverall: boolean;
  summary: string;
}

/**
 * Calculate standard cost variances
 */
export function calculateVariances(
  standards: StandardCosts,
  actuals: ActualCosts
): VarianceAnalysis {
  const { materialPriceStandard, materialQuantityStandard, laborRateStandard, laborEfficiencyStandard, overheadRate } = standards;
  const { materialPriceActual, materialQuantityActual, laborRateActual, laborHoursActual, overheadActual, unitsProduced } = actuals;

  // Material variances
  const materialPriceVariance = (materialPriceStandard - materialPriceActual) * materialQuantityActual;
  const standardQuantity = materialQuantityStandard * unitsProduced;
  const materialQuantityVariance = (standardQuantity - materialQuantityActual) * materialPriceStandard;
  const totalMaterialVariance = materialPriceVariance + materialQuantityVariance;

  // Labor variances
  const laborRateVariance = (laborRateStandard - laborRateActual) * laborHoursActual;
  const standardHours = laborEfficiencyStandard * unitsProduced;
  const laborEfficiencyVariance = (standardHours - laborHoursActual) * laborRateStandard;
  const totalLaborVariance = laborRateVariance + laborEfficiencyVariance;

  // Overhead variance
  const standardOverhead = standardHours * overheadRate;
  const overheadVariance = standardOverhead - overheadActual;

  // Total variance
  const totalVariance = totalMaterialVariance + totalLaborVariance + overheadVariance;
  const favorableOverall = totalVariance >= 0;

  // Summary
  const parts: string[] = [];
  if (Math.abs(totalMaterialVariance) > 0) {
    parts.push(`Materials: ${totalMaterialVariance >= 0 ? 'F' : 'U'} $${Math.abs(totalMaterialVariance).toFixed(0)}`);
  }
  if (Math.abs(totalLaborVariance) > 0) {
    parts.push(`Labor: ${totalLaborVariance >= 0 ? 'F' : 'U'} $${Math.abs(totalLaborVariance).toFixed(0)}`);
  }
  if (Math.abs(overheadVariance) > 0) {
    parts.push(`Overhead: ${overheadVariance >= 0 ? 'F' : 'U'} $${Math.abs(overheadVariance).toFixed(0)}`);
  }

  return {
    materialPriceVariance: Math.round(materialPriceVariance * 100) / 100,
    materialQuantityVariance: Math.round(materialQuantityVariance * 100) / 100,
    totalMaterialVariance: Math.round(totalMaterialVariance * 100) / 100,
    laborRateVariance: Math.round(laborRateVariance * 100) / 100,
    laborEfficiencyVariance: Math.round(laborEfficiencyVariance * 100) / 100,
    totalLaborVariance: Math.round(totalLaborVariance * 100) / 100,
    overheadVariance: Math.round(overheadVariance * 100) / 100,
    totalVariance: Math.round(totalVariance * 100) / 100,
    favorableOverall,
    summary: parts.join(', ') || 'No significant variances',
  };
}

/**
 * Break-even analysis
 */
export interface BreakEvenInputs {
  fixedCosts: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
}

export interface BreakEvenResult {
  breakEvenUnits: number;
  breakEvenRevenue: number;
  contributionMargin: number;
  contributionMarginRatio: number;
  marginOfSafety: (currentUnits: number) => number;
}

/**
 * Calculate break-even point
 */
export function calculateBreakEven(inputs: BreakEvenInputs): BreakEvenResult {
  const { fixedCosts, variableCostPerUnit, sellingPricePerUnit } = inputs;

  // Contribution margin = Selling Price - Variable Cost
  const contributionMargin = sellingPricePerUnit - variableCostPerUnit;

  // Break-even in units = Fixed Costs / Contribution Margin
  const breakEvenUnits = contributionMargin > 0 ? fixedCosts / contributionMargin : 0;

  // Break-even in revenue
  const breakEvenRevenue = breakEvenUnits * sellingPricePerUnit;

  // Contribution margin ratio
  const contributionMarginRatio = sellingPricePerUnit > 0
    ? (contributionMargin / sellingPricePerUnit) * 100
    : 0;

  // Margin of safety function
  const marginOfSafety = (currentUnits: number): number => {
    if (currentUnits <= 0) return 0;
    return ((currentUnits - breakEvenUnits) / currentUnits) * 100;
  };

  return {
    breakEvenUnits: Math.round(breakEvenUnits),
    breakEvenRevenue: Math.round(breakEvenRevenue * 100) / 100,
    contributionMargin: Math.round(contributionMargin * 100) / 100,
    contributionMarginRatio: Math.round(contributionMarginRatio * 100) / 100,
    marginOfSafety,
  };
}

/**
 * Target profit analysis
 */
export function calculateTargetProfitUnits(
  fixedCosts: number,
  variableCostPerUnit: number,
  sellingPricePerUnit: number,
  targetProfit: number
): number {
  const contributionMargin = sellingPricePerUnit - variableCostPerUnit;
  if (contributionMargin <= 0) return 0;
  return Math.ceil((fixedCosts + targetProfit) / contributionMargin);
}

/**
 * Cost reduction opportunities analysis
 */
export interface CostReductionOpportunity {
  category: 'materials' | 'labor' | 'overhead';
  opportunity: string;
  potentialSavings: number;
  implementation: string;
  difficulty: 'easy' | 'moderate' | 'difficult';
}

export function identifyCostReductions(cogsResult: COGSResult): CostReductionOpportunity[] {
  const opportunities: CostReductionOpportunity[] = [];

  // Material opportunities (if >50% of cost)
  if (cogsResult.breakdown.materials > 50) {
    opportunities.push({
      category: 'materials',
      opportunity: 'Supplier consolidation and volume negotiation',
      potentialSavings: cogsResult.cogs * 0.03, // 3% of COGS
      implementation: 'Negotiate contracts with top 3 suppliers',
      difficulty: 'moderate',
    });
  }

  // Labor opportunities (if >30% of cost)
  if (cogsResult.breakdown.labor > 30) {
    opportunities.push({
      category: 'labor',
      opportunity: 'Automation of repetitive tasks',
      potentialSavings: cogsResult.cogs * 0.02, // 2% of COGS
      implementation: 'Implement robotic process automation',
      difficulty: 'difficult',
    });
  }

  // Overhead opportunities (if >25% of cost)
  if (cogsResult.breakdown.overhead > 25) {
    opportunities.push({
      category: 'overhead',
      opportunity: 'Energy efficiency improvements',
      potentialSavings: cogsResult.cogs * 0.01, // 1% of COGS
      implementation: 'LED lighting and HVAC optimization',
      difficulty: 'easy',
    });
  }

  // Low margin opportunity
  if (cogsResult.grossMargin < 30) {
    opportunities.push({
      category: 'overhead',
      opportunity: 'Lean manufacturing implementation',
      potentialSavings: cogsResult.cogs * 0.05, // 5% of COGS
      implementation: 'Reduce waste, improve flow, eliminate non-value activities',
      difficulty: 'moderate',
    });
  }

  return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
}

export default {
  calculateCOGS,
  calculateABC,
  calculateVariances,
  calculateBreakEven,
  calculateTargetProfitUnits,
  identifyCostReductions,
};
