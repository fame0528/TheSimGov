/**
 * @file src/lib/utils/manufacturing/inventoryManager.ts
 * @description Inventory management utility with EOQ and safety stock calculations
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Implements inventory management models including EOQ, ROP, safety stock,
 * and inventory turnover analysis. Supports JIT, MRP, and traditional inventory strategies.
 * 
 * KEY FORMULAS:
 * - EOQ = √(2DS/H) where D=annual demand, S=order cost, H=holding cost
 * - ROP = (Daily Demand × Lead Time) + Safety Stock
 * - Safety Stock = Z × σd × √LT where Z=service level factor
 * - Inventory Turnover = COGS / Average Inventory
 * - Days of Inventory = 365 / Inventory Turnover
 */

import type { InventoryInputs, InventoryResult } from '@/types/manufacturing';

/**
 * Service level Z-values
 */
const SERVICE_LEVEL_Z: Record<number, number> = {
  90: 1.28,
  95: 1.65,
  97: 1.88,
  98: 2.05,
  99: 2.33,
  99.5: 2.58,
  99.9: 3.09,
};

/**
 * Calculate EOQ-based inventory parameters
 * 
 * @param inputs - Inventory calculation inputs
 * @returns EOQ, ROP, safety stock, and costs
 * 
 * @example
 * const result = calculateInventory({
 *   annualDemand: 10000,
 *   orderCost: 50,
 *   holdingCostPerUnit: 2,
 *   leadTimeDays: 7,
 *   safetyStockDays: 3
 * });
 */
export function calculateInventory(inputs: InventoryInputs): InventoryResult {
  const { annualDemand, orderCost, holdingCostPerUnit, leadTimeDays, safetyStockDays } = inputs;

  // EOQ = √(2DS/H)
  const eoq = holdingCostPerUnit > 0
    ? Math.sqrt((2 * annualDemand * orderCost) / holdingCostPerUnit)
    : 0;

  // Daily demand
  const dailyDemand = annualDemand / 365;

  // Safety stock (simple days-based)
  const safetyStock = dailyDemand * safetyStockDays;

  // Reorder point = (Daily Demand × Lead Time) + Safety Stock
  const reorderPoint = (dailyDemand * leadTimeDays) + safetyStock;

  // Average inventory = EOQ/2 + Safety Stock
  const averageInventory = (eoq / 2) + safetyStock;

  // Annual ordering cost = (Annual Demand / EOQ) × Order Cost
  const annualOrderingCost = eoq > 0 ? (annualDemand / eoq) * orderCost : 0;

  // Annual holding cost = Average Inventory × Holding Cost
  const annualHoldingCost = averageInventory * holdingCostPerUnit;

  // Total inventory cost
  const totalInventoryCost = annualOrderingCost + annualHoldingCost;

  return {
    eoq: Math.round(eoq),
    reorderPoint: Math.round(reorderPoint),
    safetyStock: Math.round(safetyStock),
    averageInventory: Math.round(averageInventory),
    annualOrderingCost: Math.round(annualOrderingCost * 100) / 100,
    annualHoldingCost: Math.round(annualHoldingCost * 100) / 100,
    totalInventoryCost: Math.round(totalInventoryCost * 100) / 100,
  };
}

/**
 * Calculate safety stock based on service level
 */
export interface SafetyStockInputs {
  averageDailyDemand: number;
  demandStandardDeviation: number;
  leadTimeDays: number;
  leadTimeVariance: number;
  serviceLevel: number; // 90, 95, 99, etc.
}

export interface SafetyStockResult {
  safetyStock: number;
  serviceLevelZ: number;
  demandDuringLeadTime: number;
  reorderPoint: number;
}

export function calculateSafetyStock(inputs: SafetyStockInputs): SafetyStockResult {
  const { averageDailyDemand, demandStandardDeviation, leadTimeDays, leadTimeVariance, serviceLevel } = inputs;

  // Get Z-value for service level
  const serviceLevelZ = SERVICE_LEVEL_Z[serviceLevel] || 1.65;

  // Combined standard deviation considering both demand and lead time variability
  // σ_combined = √(LT × σd² + d² × σLT²)
  const combinedStdDev = Math.sqrt(
    (leadTimeDays * Math.pow(demandStandardDeviation, 2)) +
    (Math.pow(averageDailyDemand, 2) * leadTimeVariance)
  );

  // Safety stock = Z × σ_combined
  const safetyStock = serviceLevelZ * combinedStdDev;

  // Demand during lead time
  const demandDuringLeadTime = averageDailyDemand * leadTimeDays;

  // Reorder point
  const reorderPoint = demandDuringLeadTime + safetyStock;

  return {
    safetyStock: Math.round(safetyStock),
    serviceLevelZ,
    demandDuringLeadTime: Math.round(demandDuringLeadTime),
    reorderPoint: Math.round(reorderPoint),
  };
}

/**
 * Inventory turnover analysis
 */
export interface TurnoverAnalysis {
  turnoverRatio: number;
  daysOfInventory: number;
  classification: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  recommendation: string;
}

export function analyzeInventoryTurnover(
  cogs: number,
  averageInventory: number,
  industryBenchmark = 6
): TurnoverAnalysis {
  const turnoverRatio = averageInventory > 0 ? cogs / averageInventory : 0;
  const daysOfInventory = turnoverRatio > 0 ? 365 / turnoverRatio : 0;

  let classification: TurnoverAnalysis['classification'];
  let recommendation: string;

  if (turnoverRatio >= industryBenchmark * 1.5) {
    classification = 'excellent';
    recommendation = 'Excellent inventory management. Monitor for stockouts.';
  } else if (turnoverRatio >= industryBenchmark) {
    classification = 'good';
    recommendation = 'Good turnover. Look for incremental improvements.';
  } else if (turnoverRatio >= industryBenchmark * 0.7) {
    classification = 'average';
    recommendation = 'Turnover below benchmark. Review slow-moving items.';
  } else if (turnoverRatio >= industryBenchmark * 0.5) {
    classification = 'poor';
    recommendation = 'Excess inventory. Implement reduction initiatives.';
  } else {
    classification = 'critical';
    recommendation = 'Critical levels. Immediate inventory review required.';
  }

  return {
    turnoverRatio: Math.round(turnoverRatio * 100) / 100,
    daysOfInventory: Math.round(daysOfInventory),
    classification,
    recommendation,
  };
}

/**
 * ABC inventory classification
 */
export interface InventoryItem {
  sku: string;
  annualValue: number;
  unitCost: number;
  annualQuantity: number;
}

export interface ABCClassification {
  class: 'A' | 'B' | 'C';
  items: InventoryItem[];
  percentOfItems: number;
  percentOfValue: number;
  controlPolicy: string;
}

export function classifyABC(items: InventoryItem[]): ABCClassification[] {
  // Sort by annual value descending
  const sortedItems = [...items].sort((a, b) => b.annualValue - a.annualValue);

  const totalValue = sortedItems.reduce((sum, item) => sum + item.annualValue, 0);
  const totalItems = sortedItems.length;

  const classes: ABCClassification[] = [];
  let cumulativeValue = 0;
  let currentClass: 'A' | 'B' | 'C' = 'A';
  let classItems: InventoryItem[] = [];
  let classStartIndex = 0;

  for (let i = 0; i < sortedItems.length; i++) {
    cumulativeValue += sortedItems[i].annualValue;
    const valuePercent = (cumulativeValue / totalValue) * 100;

    classItems.push(sortedItems[i]);

    // Class boundaries: A = top 80% value, B = next 15%, C = remaining 5%
    if ((currentClass === 'A' && valuePercent >= 80) ||
        (currentClass === 'B' && valuePercent >= 95) ||
        i === sortedItems.length - 1) {
      
      const percentOfItems = (classItems.length / totalItems) * 100;
      const classValue = classItems.reduce((sum, item) => sum + item.annualValue, 0);
      const percentOfValue = (classValue / totalValue) * 100;

      const controlPolicies: Record<string, string> = {
        A: 'Tight control, frequent review, accurate records, safety stock optimization',
        B: 'Moderate control, periodic review, standard reorder policies',
        C: 'Minimal control, bulk ordering, simple tracking systems',
      };

      classes.push({
        class: currentClass,
        items: classItems,
        percentOfItems: Math.round(percentOfItems * 100) / 100,
        percentOfValue: Math.round(percentOfValue * 100) / 100,
        controlPolicy: controlPolicies[currentClass],
      });

      // Move to next class
      if (currentClass === 'A') currentClass = 'B';
      else if (currentClass === 'B') currentClass = 'C';
      classItems = [];
      classStartIndex = i + 1;
    }
  }

  return classes;
}

/**
 * Inventory holding cost calculation
 */
export interface HoldingCostComponents {
  capitalCost: number;      // Cost of money tied up
  storageCost: number;      // Warehouse space
  insuranceCost: number;    // Insurance premiums
  obsolescenceCost: number; // Risk of obsolescence
  damageCost: number;       // Handling damage
  taxCost: number;          // Inventory taxes
}

export function calculateHoldingCost(
  inventoryValue: number,
  components: Partial<HoldingCostComponents>
): { totalCost: number; costPercentage: number; breakdown: HoldingCostComponents } {
  // Default rates as percentages of inventory value
  const defaults: HoldingCostComponents = {
    capitalCost: inventoryValue * 0.10,      // 10%
    storageCost: inventoryValue * 0.05,      // 5%
    insuranceCost: inventoryValue * 0.02,    // 2%
    obsolescenceCost: inventoryValue * 0.05, // 5%
    damageCost: inventoryValue * 0.02,       // 2%
    taxCost: inventoryValue * 0.01,          // 1%
  };

  const breakdown: HoldingCostComponents = {
    capitalCost: components.capitalCost ?? defaults.capitalCost,
    storageCost: components.storageCost ?? defaults.storageCost,
    insuranceCost: components.insuranceCost ?? defaults.insuranceCost,
    obsolescenceCost: components.obsolescenceCost ?? defaults.obsolescenceCost,
    damageCost: components.damageCost ?? defaults.damageCost,
    taxCost: components.taxCost ?? defaults.taxCost,
  };

  const totalCost = Object.values(breakdown).reduce((sum, cost) => sum + cost, 0);
  const costPercentage = inventoryValue > 0 ? (totalCost / inventoryValue) * 100 : 0;

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    costPercentage: Math.round(costPercentage * 100) / 100,
    breakdown: {
      capitalCost: Math.round(breakdown.capitalCost * 100) / 100,
      storageCost: Math.round(breakdown.storageCost * 100) / 100,
      insuranceCost: Math.round(breakdown.insuranceCost * 100) / 100,
      obsolescenceCost: Math.round(breakdown.obsolescenceCost * 100) / 100,
      damageCost: Math.round(breakdown.damageCost * 100) / 100,
      taxCost: Math.round(breakdown.taxCost * 100) / 100,
    },
  };
}

/**
 * Periodic vs continuous review comparison
 */
export interface ReviewSystemComparison {
  continuous: {
    reorderPoint: number;
    orderQuantity: number;
    averageInventory: number;
    annualCost: number;
  };
  periodic: {
    reviewInterval: number;
    orderUpToLevel: number;
    averageInventory: number;
    annualCost: number;
  };
  recommendation: string;
}

export function compareReviewSystems(
  annualDemand: number,
  orderCost: number,
  holdingCost: number,
  leadTime: number,
  reviewCost: number
): ReviewSystemComparison {
  const dailyDemand = annualDemand / 365;

  // Continuous review (EOQ model)
  const eoq = Math.sqrt((2 * annualDemand * orderCost) / holdingCost);
  const rop = dailyDemand * leadTime;
  const avgInvContinuous = eoq / 2;
  const ordersPerYear = annualDemand / eoq;
  const costContinuous = (ordersPerYear * orderCost) + (avgInvContinuous * holdingCost);

  // Periodic review
  const reviewInterval = Math.sqrt((2 * orderCost) / (annualDemand * holdingCost)) * 365;
  const orderUpTo = dailyDemand * (reviewInterval + leadTime);
  const avgInvPeriodic = (dailyDemand * reviewInterval) / 2;
  const reviewsPerYear = 365 / reviewInterval;
  const costPeriodic = (reviewsPerYear * (orderCost + reviewCost)) + (avgInvPeriodic * holdingCost);

  const recommendation = costContinuous < costPeriodic
    ? 'Continuous review is more cost-effective for this demand pattern'
    : 'Periodic review is more cost-effective; consider review interval optimization';

  return {
    continuous: {
      reorderPoint: Math.round(rop),
      orderQuantity: Math.round(eoq),
      averageInventory: Math.round(avgInvContinuous),
      annualCost: Math.round(costContinuous * 100) / 100,
    },
    periodic: {
      reviewInterval: Math.round(reviewInterval),
      orderUpToLevel: Math.round(orderUpTo),
      averageInventory: Math.round(avgInvPeriodic),
      annualCost: Math.round(costPeriodic * 100) / 100,
    },
    recommendation,
  };
}

/**
 * Slow-moving and obsolete inventory identification
 */
export interface SlowMovingItem {
  sku: string;
  lastSaleDate: string;
  daysWithoutSale: number;
  currentStock: number;
  stockValue: number;
  recommendation: 'monitor' | 'markdown' | 'liquidate' | 'write-off';
}

export function identifySlowMovers(
  items: Array<{ sku: string; lastSaleDate: Date; currentStock: number; unitCost: number }>,
  slowThresholdDays = 90,
  obsoleteThresholdDays = 365
): SlowMovingItem[] {
  const now = new Date();
  
  return items
    .map(item => {
      const daysWithoutSale = Math.floor(
        (now.getTime() - item.lastSaleDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let recommendation: SlowMovingItem['recommendation'];
      if (daysWithoutSale > obsoleteThresholdDays) {
        recommendation = 'write-off';
      } else if (daysWithoutSale > obsoleteThresholdDays * 0.75) {
        recommendation = 'liquidate';
      } else if (daysWithoutSale > slowThresholdDays) {
        recommendation = 'markdown';
      } else {
        recommendation = 'monitor';
      }

      return {
        sku: item.sku,
        lastSaleDate: item.lastSaleDate.toISOString().split('T')[0],
        daysWithoutSale,
        currentStock: item.currentStock,
        stockValue: Math.round(item.currentStock * item.unitCost * 100) / 100,
        recommendation,
      };
    })
    .filter(item => item.daysWithoutSale >= slowThresholdDays)
    .sort((a, b) => b.stockValue - a.stockValue);
}

export default {
  calculateInventory,
  calculateSafetyStock,
  analyzeInventoryTurnover,
  classifyABC,
  calculateHoldingCost,
  compareReviewSystems,
  identifySlowMovers,
};
