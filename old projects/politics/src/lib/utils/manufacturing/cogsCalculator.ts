/**
 * @file src/lib/utils/manufacturing/cogsCalculator.ts
 * @description Cost of Goods Sold (COGS) and manufacturing cost calculation utilities
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Utilities for calculating Cost of Goods Sold (COGS), manufacturing costs, and
 * cost variance analysis. Supports direct materials, direct labor, and manufacturing
 * overhead allocation with multiple costing methods (Standard, Actual, Activity-Based).
 * 
 * COGS Formula:
 * COGS = Direct Materials + Direct Labor + Manufacturing Overhead
 * 
 * Costing Methods:
 * - Standard Costing: Predetermined costs for planning and variance analysis
 * - Actual Costing: Real costs incurred (used for financial reporting)
 * - Activity-Based Costing (ABC): Overhead allocated by activity drivers
 * 
 * Overhead Allocation Methods:
 * - Machine Hours: Overhead allocated based on machine hours
 * - Labor Hours: Overhead allocated based on direct labor hours
 * - Units Produced: Overhead allocated equally per unit
 * - Activity-Based: Overhead allocated by specific activities
 * 
 * USAGE:
 * ```typescript
 * import { calculateCOGS, calculateOverhead } from '@/lib/utils/manufacturing/cogsCalculator';
 * 
 * const cogs = calculateCOGS(5000, 3000, 2000);
 * console.log(cogs); // $10,000 total COGS
 * 
 * const overhead = calculateOverhead(50000, 1000, 500, 'MachineHours');
 * console.log(overhead); // $25,000 overhead
 * ```
 */

/**
 * Calculate Total COGS (Cost of Goods Sold)
 * 
 * COGS = Direct Materials + Direct Labor + Manufacturing Overhead
 * 
 * @param directMaterials - Total direct materials cost
 * @param directLabor - Total direct labor cost
 * @param manufacturingOverhead - Total manufacturing overhead
 * @returns Total COGS
 * 
 * @example
 * ```typescript
 * const cogs = calculateCOGS(5000, 3000, 2000);
 * console.log(cogs); // 10,000
 * ```
 */
export function calculateCOGS(
  directMaterials: number,
  directLabor: number,
  manufacturingOverhead: number
): number {
  const totalCOGS = directMaterials + directLabor + manufacturingOverhead;

  return Number(totalCOGS.toFixed(2));
}

/**
 * Calculate Per-Unit Cost
 * 
 * Per-Unit Cost = Total COGS / Units Produced
 * 
 * @param totalCOGS - Total COGS
 * @param unitsProduced - Number of units produced
 * @returns Per-unit cost
 */
export function calculatePerUnitCost(totalCOGS: number, unitsProduced: number): number {
  if (unitsProduced <= 0) return 0;

  const perUnitCost = totalCOGS / unitsProduced;

  return Number(perUnitCost.toFixed(2));
}

/**
 * Material Cost Calculation
 */
export interface MaterialItem {
  sku: string;
  description: string;
  quantityUsed: number;
  unitCost: number;
}

/**
 * Calculate Direct Materials Cost
 * 
 * Direct Materials = Σ(Quantity Used × Unit Cost)
 * 
 * @param materials - Materials used
 * @returns Total direct materials cost
 * 
 * @example
 * ```typescript
 * const materials = [
 *   { sku: 'MAT-001', description: 'Steel', quantityUsed: 100, unitCost: 20 },
 *   { sku: 'MAT-002', description: 'Paint', quantityUsed: 50, unitCost: 10 }
 * ];
 * const materialCost = calculateDirectMaterialsCost(materials);
 * console.log(materialCost); // 2,500 (100×20 + 50×10)
 * ```
 */
export function calculateDirectMaterialsCost(materials: MaterialItem[]): number {
  const totalCost = materials.reduce(
    (sum, material) => sum + material.quantityUsed * material.unitCost,
    0
  );

  return Number(totalCost.toFixed(2));
}

/**
 * Labor Cost Calculation
 */
export interface LaborHour {
  employee: string;
  hoursWorked: number;
  laborRate: number;
}

/**
 * Calculate Direct Labor Cost
 * 
 * Direct Labor = Σ(Hours Worked × Labor Rate)
 * 
 * @param laborHours - Labor hours worked
 * @returns Total direct labor cost
 * 
 * @example
 * ```typescript
 * const labor = [
 *   { employee: 'EMP-001', hoursWorked: 40, laborRate: 25 },
 *   { employee: 'EMP-002', hoursWorked: 35, laborRate: 30 }
 * ];
 * const laborCost = calculateDirectLaborCost(labor);
 * console.log(laborCost); // 2,050 (40×25 + 35×30)
 * ```
 */
export function calculateDirectLaborCost(laborHours: LaborHour[]): number {
  const totalCost = laborHours.reduce(
    (sum, labor) => sum + labor.hoursWorked * labor.laborRate,
    0
  );

  return Number(totalCost.toFixed(2));
}

/**
 * Manufacturing Overhead Allocation Method
 */
export type OverheadAllocationMethod =
  | 'MachineHours'
  | 'LaborHours'
  | 'UnitsProduced'
  | 'DirectLaborCost'
  | 'ActivityBased';

/**
 * Calculate Manufacturing Overhead
 * 
 * @param totalOverheadCost - Total overhead cost pool
 * @param totalAllocationBase - Total allocation base (machine hours, labor hours, etc.)
 * @param actualUsage - Actual usage for this product/job
 * @param method - Allocation method
 * @returns Allocated overhead
 * 
 * @example
 * ```typescript
 * // Machine Hours method
 * const overhead = calculateOverhead(50000, 1000, 500, 'MachineHours');
 * console.log(overhead); // 25,000 (50,000 / 1,000 × 500)
 * ```
 */
export function calculateOverhead(
  totalOverheadCost: number,
  totalAllocationBase: number,
  actualUsage: number,
  method: OverheadAllocationMethod
): number {
  if (totalAllocationBase <= 0) return 0;
  // method accepted for API parity; calculation here is base-agnostic
  void method;

  const overheadRate = totalOverheadCost / totalAllocationBase;
  const allocatedOverhead = overheadRate * actualUsage;

  return Number(allocatedOverhead.toFixed(2));
}

/**
 * Calculate Overhead Rate
 * 
 * Overhead Rate = Total Overhead / Total Allocation Base
 * 
 * @param totalOverheadCost - Total overhead cost
 * @param totalAllocationBase - Total allocation base
 * @returns Overhead rate
 */
export function calculateOverheadRate(
  totalOverheadCost: number,
  totalAllocationBase: number
): number {
  if (totalAllocationBase <= 0) return 0;

  const rate = totalOverheadCost / totalAllocationBase;

  return Number(rate.toFixed(2));
}

/**
 * Activity-Based Costing (ABC)
 */
export interface Activity {
  activityName: string;
  activityCostPool: number;
  activityDriver: string;
  totalDriverQuantity: number;
  actualDriverUsage: number;
}

/**
 * Calculate Activity-Based Overhead
 * 
 * Activity Rate = Activity Cost Pool / Total Driver Quantity
 * Allocated Cost = Activity Rate × Actual Driver Usage
 * 
 * @param activities - Activities with cost pools and drivers
 * @returns Total allocated overhead
 * 
 * @example
 * ```typescript
 * const activities = [
 *   {
 *     activityName: 'Machine Setup',
 *     activityCostPool: 10000,
 *     activityDriver: 'Number of Setups',
 *     totalDriverQuantity: 100,
 *     actualDriverUsage: 10
 *   },
 *   {
 *     activityName: 'Quality Inspection',
 *     activityCostPool: 8000,
 *     activityDriver: 'Inspection Hours',
 *     totalDriverQuantity: 400,
 *     actualDriverUsage: 50
 *   }
 * ];
 * const overhead = calculateActivityBasedOverhead(activities);
 * console.log(overhead); // 2,000 (1,000 + 1,000)
 * ```
 */
export function calculateActivityBasedOverhead(activities: Activity[]): number {
  const totalOverhead = activities.reduce((sum, activity) => {
    if (activity.totalDriverQuantity <= 0) return sum;

    const activityRate = activity.activityCostPool / activity.totalDriverQuantity;
    const allocatedCost = activityRate * activity.actualDriverUsage;

    return sum + allocatedCost;
  }, 0);

  return Number(totalOverhead.toFixed(2));
}

/**
 * Cost Variance Analysis
 */
export interface CostVariance {
  standardCost: number;
  actualCost: number;
  variance: number;
  variancePercentage: number;
  isFavorable: boolean;
}

/**
 * Calculate Cost Variance
 * 
 * Variance = Actual Cost - Standard Cost
 * Favorable: Actual < Standard (cost savings)
 * Unfavorable: Actual > Standard (cost overrun)
 * 
 * @param standardCost - Standard/planned cost
 * @param actualCost - Actual cost incurred
 * @returns Cost variance
 * 
 * @example
 * ```typescript
 * const variance = calculateCostVariance(10000, 9500);
 * console.log(variance.variance); // -500 (favorable)
 * console.log(variance.isFavorable); // true
 * ```
 */
export function calculateCostVariance(
  standardCost: number,
  actualCost: number
): CostVariance {
  const variance = actualCost - standardCost;
  const variancePercentage =
    standardCost !== 0 ? (variance / standardCost) * 100 : 0;
  const isFavorable = variance < 0; // Actual < Standard

  return {
    standardCost,
    actualCost,
    variance: Number(variance.toFixed(2)),
    variancePercentage: Number(variancePercentage.toFixed(1)),
    isFavorable,
  };
}

/**
 * Material Variance Analysis (Price + Quantity)
 */
export interface MaterialVariance {
  priceVariance: CostVariance;
  quantityVariance: CostVariance;
  totalVariance: CostVariance;
}

/**
 * Calculate Material Variance (Price and Quantity)
 * 
 * Price Variance = (Actual Price - Standard Price) × Actual Quantity
 * Quantity Variance = (Actual Quantity - Standard Quantity) × Standard Price
 * 
 * @param standardPrice - Standard unit price
 * @param actualPrice - Actual unit price
 * @param standardQuantity - Standard quantity allowed
 * @param actualQuantity - Actual quantity used
 * @returns Material variance breakdown
 */
export function calculateMaterialVariance(
  standardPrice: number,
  actualPrice: number,
  standardQuantity: number,
  actualQuantity: number
): MaterialVariance {
  const standardPriceCost = standardPrice * actualQuantity;
  const actualPriceCost = actualPrice * actualQuantity;

  const standardQuantityCost = standardQuantity * standardPrice;
  const actualQuantityCost = actualQuantity * standardPrice;

  // Total Variance
  const totalStandardCost = standardPrice * standardQuantity;
  const totalActualCost = actualPrice * actualQuantity;

  return {
    priceVariance: calculateCostVariance(standardPriceCost, actualPriceCost),
    quantityVariance: calculateCostVariance(standardQuantityCost, actualQuantityCost),
    totalVariance: calculateCostVariance(totalStandardCost, totalActualCost),
  };
}

/**
 * Labor Variance Analysis (Rate + Efficiency)
 */
export interface LaborVariance {
  rateVariance: CostVariance;
  efficiencyVariance: CostVariance;
  totalVariance: CostVariance;
}

/**
 * Calculate Labor Variance (Rate and Efficiency)
 * 
 * Rate Variance = (Actual Rate - Standard Rate) × Actual Hours
 * Efficiency Variance = (Actual Hours - Standard Hours) × Standard Rate
 * 
 * @param standardRate - Standard hourly rate
 * @param actualRate - Actual hourly rate
 * @param standardHours - Standard hours allowed
 * @param actualHours - Actual hours worked
 * @returns Labor variance breakdown
 */
export function calculateLaborVariance(
  standardRate: number,
  actualRate: number,
  standardHours: number,
  actualHours: number
): LaborVariance {
  const standardRateCost = standardRate * actualHours;
  const actualRateCost = actualRate * actualHours;

  const standardEfficiencyCost = standardHours * standardRate;
  const actualEfficiencyCost = actualHours * standardRate;

  // Total Variance
  const totalStandardCost = standardRate * standardHours;
  const totalActualCost = actualRate * actualHours;

  return {
    rateVariance: calculateCostVariance(standardRateCost, actualRateCost),
    efficiencyVariance: calculateCostVariance(
      standardEfficiencyCost,
      actualEfficiencyCost
    ),
    totalVariance: calculateCostVariance(totalStandardCost, totalActualCost),
  };
}

/**
 * Complete COGS Calculation with Variance
 */
export interface COGSBreakdown {
  directMaterials: number;
  directLabor: number;
  manufacturingOverhead: number;
  totalCOGS: number;
  perUnitCost: number;
  variance?: {
    materials: MaterialVariance;
    labor: LaborVariance;
    overhead: CostVariance;
    total: CostVariance;
  };
}

/**
 * Calculate Complete COGS Breakdown
 * 
 * @param materials - Material items used
 * @param laborHours - Labor hours worked
 * @param overheadCost - Manufacturing overhead
 * @param unitsProduced - Units produced
 * @param standardCosts - Optional standard costs for variance analysis
 * @returns Complete COGS breakdown
 */
export function calculateCOGSBreakdown(
  materials: MaterialItem[],
  laborHours: LaborHour[],
  overheadCost: number,
  unitsProduced: number,
  standardCosts?: {
    materials: {
      standardPrice: number;
      standardQuantity: number;
      actualPrice: number;
      actualQuantity: number;
    };
    labor: {
      standardRate: number;
      standardHours: number;
      actualRate: number;
      actualHours: number;
    };
    overhead: {
      standardOverhead: number;
    };
  }
): COGSBreakdown {
  // Calculate actual costs
  const directMaterials = calculateDirectMaterialsCost(materials);
  const directLabor = calculateDirectLaborCost(laborHours);
  const manufacturingOverhead = overheadCost;

  const totalCOGS = calculateCOGS(directMaterials, directLabor, manufacturingOverhead);
  const perUnitCost = calculatePerUnitCost(totalCOGS, unitsProduced);

  // Calculate variances if standard costs provided
  let variance;
  if (standardCosts) {
    const materialVariance = calculateMaterialVariance(
      standardCosts.materials.standardPrice,
      standardCosts.materials.actualPrice,
      standardCosts.materials.standardQuantity,
      standardCosts.materials.actualQuantity
    );

    const laborVariance = calculateLaborVariance(
      standardCosts.labor.standardRate,
      standardCosts.labor.actualRate,
      standardCosts.labor.standardHours,
      standardCosts.labor.actualHours
    );

    const overheadVariance = calculateCostVariance(
      standardCosts.overhead.standardOverhead,
      manufacturingOverhead
    );

    const totalStandardCost =
      standardCosts.materials.standardPrice * standardCosts.materials.standardQuantity +
      standardCosts.labor.standardRate * standardCosts.labor.standardHours +
      standardCosts.overhead.standardOverhead;

    const totalVariance = calculateCostVariance(totalStandardCost, totalCOGS);

    variance = {
      materials: materialVariance,
      labor: laborVariance,
      overhead: overheadVariance,
      total: totalVariance,
    };
  }

  return {
    directMaterials: Number(directMaterials.toFixed(2)),
    directLabor: Number(directLabor.toFixed(2)),
    manufacturingOverhead: Number(manufacturingOverhead.toFixed(2)),
    totalCOGS: Number(totalCOGS.toFixed(2)),
    perUnitCost: Number(perUnitCost.toFixed(2)),
    variance,
  };
}

/**
 * IMPLEMENTATION NOTES:
 * - COGS: Cost of Goods Sold (manufacturing costs)
 * - Direct materials: Raw materials directly traceable to product
 * - Direct labor: Labor hours directly traceable to product
 * - Manufacturing overhead: Indirect costs (utilities, depreciation, supervision)
 * - Standard costing: Predetermined costs for planning and variance analysis
 * - Actual costing: Real costs incurred (used for financial reporting)
 * - Activity-Based Costing (ABC): Overhead allocated by specific activities
 * - Overhead allocation bases: Machine hours, labor hours, units produced
 * - Cost variance: Actual vs Standard (favorable = cost savings, unfavorable = overrun)
 * - Material variance: Price variance + Quantity variance
 * - Labor variance: Rate variance + Efficiency variance
 * - Absorption costing: Allocate fixed overhead to units produced (GAAP)
 * - Variable costing: Only variable costs to units (managerial accounting)
 * - Prime cost: Direct materials + Direct labor
 * - Conversion cost: Direct labor + Manufacturing overhead
 * - Work-in-Process (WIP): Partially completed units
 * - Finished Goods: Completed units ready for sale
 * - Cost of Goods Manufactured (COGM): Manufacturing cost of completed units
 * - COGM = Beginning WIP + Total Manufacturing Costs - Ending WIP
 * - COGS = Beginning FG + COGM - Ending FG
 */
