/**
 * @file src/lib/utils/manufacturing/inventoryManager.ts
 * @description Inventory management and valuation utilities
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Utilities for inventory management including valuation methods (FIFO, LIFO,
 * Weighted Average), reorder point calculation, EOQ, ABC classification, and
 * inventory turnover analysis. Supports multiple costing methods for financial
 * and operational inventory optimization.
 * 
 * Inventory Valuation Methods:
 * - FIFO: First-In-First-Out (oldest inventory used first)
 * - LIFO: Last-In-First-Out (newest inventory used first)
 * - Weighted Average: Average cost of all units
 * - Specific Identification: Track individual unit costs
 * 
 * USAGE:
 * ```typescript
 * import { calculateFIFOCost, calculateReorderPoint } from '@/lib/utils/manufacturing/inventoryManager';
 * 
 * const cost = calculateFIFOCost(100, purchases);
 * const rop = calculateReorderPoint(50, 7, 25);
 * console.log(cost, rop);
 * ```
 */

/**
 * Inventory purchase/receipt record
 */
export interface InventoryPurchase {
  date: Date;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

/**
 * FIFO Cost Calculation Result
 */
export interface FIFOCostResult {
  totalCost: number;
  averageCost: number;
  remainingPurchases: InventoryPurchase[];
}

/**
 * Calculate FIFO (First-In-First-Out) cost
 * 
 * FIFO assumes oldest inventory is sold first.
 * Used in rising price environments (matches physical flow).
 * 
 * @param quantityIssued - Quantity being issued/sold
 * @param purchases - Available purchases (sorted oldest first)
 * @returns FIFO cost calculation result
 * 
 * @example
 * ```typescript
 * const purchases = [
 *   { date: new Date('2025-01-01'), quantity: 100, unitCost: 10, totalCost: 1000 },
 *   { date: new Date('2025-02-01'), quantity: 100, unitCost: 12, totalCost: 1200 },
 * ];
 * const result = calculateFIFOCost(150, purchases);
 * console.log(result.totalCost); // 1,600 (100@$10 + 50@$12)
 * console.log(result.averageCost); // 10.67
 * ```
 */
export function calculateFIFOCost(
  quantityIssued: number,
  purchases: InventoryPurchase[]
): FIFOCostResult {
  let remainingQuantity = quantityIssued;
  let totalCost = 0;
  const remainingPurchases: InventoryPurchase[] = [];

  // Sort purchases by date (oldest first)
  const sortedPurchases = [...purchases].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  for (const purchase of sortedPurchases) {
    if (remainingQuantity <= 0) {
      // No more quantity needed, keep remaining purchase
      remainingPurchases.push(purchase);
      continue;
    }

    if (purchase.quantity <= remainingQuantity) {
      // Use entire purchase
      totalCost += purchase.totalCost;
      remainingQuantity -= purchase.quantity;
    } else {
      // Partial purchase
      const quantityUsed = remainingQuantity;
      const costUsed = (quantityUsed / purchase.quantity) * purchase.totalCost;
      totalCost += costUsed;

      // Keep remaining portion
      const remainingPortion: InventoryPurchase = {
        date: purchase.date,
        quantity: purchase.quantity - quantityUsed,
        unitCost: purchase.unitCost,
        totalCost: purchase.totalCost - costUsed,
      };
      remainingPurchases.push(remainingPortion);
      remainingQuantity = 0;
    }
  }

  const averageCost = quantityIssued > 0 ? totalCost / quantityIssued : 0;

  return {
    totalCost: Number(totalCost.toFixed(2)),
    averageCost: Number(averageCost.toFixed(2)),
    remainingPurchases,
  };
}

/**
 * Calculate LIFO (Last-In-First-Out) cost
 * 
 * LIFO assumes newest inventory is sold first.
 * Used for tax benefits in rising price environments (higher COGS, lower taxes).
 * 
 * @param quantityIssued - Quantity being issued/sold
 * @param purchases - Available purchases (sorted newest first)
 * @returns LIFO cost calculation result
 * 
 * @example
 * ```typescript
 * const purchases = [
 *   { date: new Date('2025-01-01'), quantity: 100, unitCost: 10, totalCost: 1000 },
 *   { date: new Date('2025-02-01'), quantity: 100, unitCost: 12, totalCost: 1200 },
 * ];
 * const result = calculateLIFOCost(150, purchases);
 * console.log(result.totalCost); // 1,700 (100@$12 + 50@$10)
 * console.log(result.averageCost); // 11.33
 * ```
 */
export function calculateLIFOCost(
  quantityIssued: number,
  purchases: InventoryPurchase[]
): FIFOCostResult {
  let remainingQuantity = quantityIssued;
  let totalCost = 0;
  const remainingPurchases: InventoryPurchase[] = [];

  // Sort purchases by date (newest first)
  const sortedPurchases = [...purchases].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  for (const purchase of sortedPurchases) {
    if (remainingQuantity <= 0) {
      // No more quantity needed, keep remaining purchase
      remainingPurchases.push(purchase);
      continue;
    }

    if (purchase.quantity <= remainingQuantity) {
      // Use entire purchase
      totalCost += purchase.totalCost;
      remainingQuantity -= purchase.quantity;
    } else {
      // Partial purchase
      const quantityUsed = remainingQuantity;
      const costUsed = (quantityUsed / purchase.quantity) * purchase.totalCost;
      totalCost += costUsed;

      // Keep remaining portion
      const remainingPortion: InventoryPurchase = {
        date: purchase.date,
        quantity: purchase.quantity - quantityUsed,
        unitCost: purchase.unitCost,
        totalCost: purchase.totalCost - costUsed,
      };
      remainingPurchases.push(remainingPortion);
      remainingQuantity = 0;
    }
  }

  const averageCost = quantityIssued > 0 ? totalCost / quantityIssued : 0;

  return {
    totalCost: Number(totalCost.toFixed(2)),
    averageCost: Number(averageCost.toFixed(2)),
    remainingPurchases,
  };
}

/**
 * Calculate Weighted Average Cost
 * 
 * Weighted Average = Total Cost of Inventory / Total Units
 * 
 * @param purchases - All available purchases
 * @returns Weighted average unit cost
 * 
 * @example
 * ```typescript
 * const purchases = [
 *   { date: new Date('2025-01-01'), quantity: 100, unitCost: 10, totalCost: 1000 },
 *   { date: new Date('2025-02-01'), quantity: 100, unitCost: 12, totalCost: 1200 },
 * ];
 * const avgCost = calculateWeightedAverageCost(purchases);
 * console.log(avgCost); // 11.00 (2,200 / 200)
 * ```
 */
export function calculateWeightedAverageCost(purchases: InventoryPurchase[]): number {
  const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0);
  const totalCost = purchases.reduce((sum, p) => sum + p.totalCost, 0);

  const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;

  return Number(averageCost.toFixed(2));
}

/**
 * Calculate Reorder Point (ROP)
 * 
 * ROP = (Daily Demand × Lead Time) + Safety Stock
 * 
 * Reorder point is the inventory level that triggers a new order.
 * 
 * @param dailyDemand - Average daily demand (units/day)
 * @param leadTimeDays - Lead time in days
 * @param safetyStock - Safety stock (buffer inventory)
 * @returns Reorder point (units)
 * 
 * @example
 * ```typescript
 * const rop = calculateReorderPoint(50, 7, 25);
 * console.log(rop); // 375 units (50×7 + 25)
 * ```
 */
export function calculateReorderPoint(
  dailyDemand: number,
  leadTimeDays: number,
  safetyStock: number
): number {
  const rop = dailyDemand * leadTimeDays + safetyStock;

  return Math.max(0, Number(rop.toFixed(0)));
}

/**
 * Calculate Safety Stock
 * 
 * Safety Stock = Z-score × σ_demand × √(Lead Time)
 * Where:
 * - Z-score: Service level (1.65 for 95%, 2.33 for 99%)
 * - σ_demand: Standard deviation of demand
 * 
 * @param zScore - Service level z-score (1.65 for 95%, 2.33 for 99%)
 * @param demandStdDev - Standard deviation of daily demand
 * @param leadTimeDays - Lead time in days
 * @returns Safety stock (units)
 * 
 * @example
 * ```typescript
 * const safetyStock = calculateSafetyStock(1.65, 10, 7);
 * console.log(safetyStock); // 44 units (1.65 × 10 × √7)
 * ```
 */
export function calculateSafetyStock(
  zScore: number,
  demandStdDev: number,
  leadTimeDays: number
): number {
  const safetyStock = zScore * demandStdDev * Math.sqrt(leadTimeDays);

  return Math.max(0, Math.ceil(safetyStock));
}

/**
 * ABC Classification (Pareto 80/20 rule)
 * 
 * - Class A: 70-80% of value, 10-20% of items (tight control, frequent review)
 * - Class B: 15-25% of value, 20-30% of items (moderate control)
 * - Class C: 5-10% of value, 50-70% of items (simple control, periodic review)
 */
export type ABCClass = 'A' | 'B' | 'C';

export interface ABCItem {
  sku: string;
  annualUsageValue: number;
  class?: ABCClass;
  cumulativePercentage?: number;
}

/**
 * Perform ABC Classification
 * 
 * @param items - Items with annual usage value
 * @returns Items with ABC classification
 * 
 * @example
 * ```typescript
 * const items = [
 *   { sku: 'ITEM-001', annualUsageValue: 50000 },
 *   { sku: 'ITEM-002', annualUsageValue: 30000 },
 *   { sku: 'ITEM-003', annualUsageValue: 5000 },
 * ];
 * const classified = classifyABC(items);
 * console.log(classified[0].class); // 'A'
 * ```
 */
export function classifyABC(items: ABCItem[]): ABCItem[] {
  // Sort by annual usage value (descending)
  const sorted = [...items].sort((a, b) => b.annualUsageValue - a.annualUsageValue);

  // Calculate total value
  const totalValue = sorted.reduce((sum, item) => sum + item.annualUsageValue, 0);

  // Calculate cumulative percentage and assign class
  let cumulative = 0;
  return sorted.map((item) => {
    cumulative += item.annualUsageValue;
    const cumulativePercentage = (cumulative / totalValue) * 100;

    let itemClass: ABCClass = 'C';
    if (cumulativePercentage <= 80) {
      itemClass = 'A';
    } else if (cumulativePercentage <= 95) {
      itemClass = 'B';
    }

    return {
      ...item,
      class: itemClass,
      cumulativePercentage: Number(cumulativePercentage.toFixed(1)),
    };
  });
}

/**
 * Calculate Inventory Turnover Ratio
 * 
 * Inventory Turnover = COGS / Average Inventory Value
 * 
 * Higher turnover = better inventory management (less capital tied up).
 * Industry benchmarks:
 * - Retail: 8-12 turns/year
 * - Manufacturing: 6-8 turns/year
 * - Food/beverage: 12-20 turns/year
 * 
 * @param cogs - Cost of Goods Sold (annual)
 * @param averageInventoryValue - Average inventory value
 * @returns Inventory turnover ratio
 * 
 * @example
 * ```typescript
 * const turnover = calculateInventoryTurnover(1200000, 150000);
 * console.log(turnover); // 8.0 turns/year
 * ```
 */
export function calculateInventoryTurnover(
  cogs: number,
  averageInventoryValue: number
): number {
  if (averageInventoryValue <= 0) return 0;

  const turnover = cogs / averageInventoryValue;

  return Number(turnover.toFixed(2));
}

/**
 * Calculate Days on Hand (DOH)
 * 
 * DOH = 365 / Inventory Turnover
 * 
 * Days on hand is the average number of days inventory is held.
 * 
 * @param inventoryTurnover - Inventory turnover ratio
 * @returns Days on hand
 * 
 * @example
 * ```typescript
 * const doh = calculateDaysOnHand(8);
 * console.log(doh); // 45.6 days
 * ```
 */
export function calculateDaysOnHand(inventoryTurnover: number): number {
  if (inventoryTurnover <= 0) return 0;

  const doh = 365 / inventoryTurnover;

  return Number(doh.toFixed(1));
}

/**
 * Calculate Days Sales in Inventory (DSI)
 * 
 * DSI = (Average Inventory / COGS) × 365
 * 
 * Same as Days on Hand, different formula.
 * 
 * @param averageInventoryValue - Average inventory value
 * @param cogs - Cost of Goods Sold (annual)
 * @returns Days sales in inventory
 */
export function calculateDaysSalesInInventory(
  averageInventoryValue: number,
  cogs: number
): number {
  if (cogs <= 0) return 0;

  const dsi = (averageInventoryValue / cogs) * 365;

  return Number(dsi.toFixed(1));
}

/**
 * Obsolescence Detection
 */
export interface ObsolescenceAnalysis {
  sku: string;
  lastMovementDate: Date;
  daysSinceMovement: number;
  quantityOnHand: number;
  inventoryValue: number;
  isSlowMoving: boolean;
  isObsolete: boolean;
  recommendedAction: string;
}

/**
 * Detect Obsolete/Slow-Moving Inventory
 * 
 * @param sku - Item SKU
 * @param lastMovementDate - Last sale/usage date
 * @param quantityOnHand - Current quantity
 * @param inventoryValue - Current value
 * @param slowMovingThresholdDays - Days threshold for slow-moving (default: 180)
 * @param obsoleteThresholdDays - Days threshold for obsolete (default: 365)
 * @returns Obsolescence analysis
 */
export function detectObsolescence(
  sku: string,
  lastMovementDate: Date,
  quantityOnHand: number,
  inventoryValue: number,
  slowMovingThresholdDays: number = 180,
  obsoleteThresholdDays: number = 365
): ObsolescenceAnalysis {
  const now = new Date();
  const daysSinceMovement = Math.floor(
    (now.getTime() - lastMovementDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const isSlowMoving = daysSinceMovement >= slowMovingThresholdDays;
  const isObsolete = daysSinceMovement >= obsoleteThresholdDays;

  let recommendedAction = 'Continue monitoring';
  if (isObsolete) {
    recommendedAction = 'Write-off or dispose, prevent future purchases';
  } else if (isSlowMoving) {
    recommendedAction = 'Reduce order quantities, consider discount/promotion';
  }

  return {
    sku,
    lastMovementDate,
    daysSinceMovement,
    quantityOnHand,
    inventoryValue,
    isSlowMoving,
    isObsolete,
    recommendedAction,
  };
}

/**
 * Cycle Count Scheduling
 */
export type CycleCountFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

export interface CycleCountSchedule {
  sku: string;
  abcClass: ABCClass;
  frequency: CycleCountFrequency;
  nextCountDate: Date;
  priorityScore: number;
}

/**
 * Generate Cycle Count Schedule based on ABC classification
 * 
 * - Class A: Weekly counts (52/year)
 * - Class B: Monthly counts (12/year)
 * - Class C: Quarterly counts (4/year)
 * 
 * @param sku - Item SKU
 * @param abcClass - ABC classification
 * @param lastCountDate - Last count date
 * @returns Cycle count schedule
 */
export function generateCycleCountSchedule(
  sku: string,
  abcClass: ABCClass,
  lastCountDate: Date
): CycleCountSchedule {
  let frequency: CycleCountFrequency;
  let daysUntilNextCount: number;
  let priorityScore: number;

  switch (abcClass) {
    case 'A':
      frequency = 'WEEKLY';
      daysUntilNextCount = 7;
      priorityScore = 10;
      break;
    case 'B':
      frequency = 'MONTHLY';
      daysUntilNextCount = 30;
      priorityScore = 5;
      break;
    case 'C':
      frequency = 'QUARTERLY';
      daysUntilNextCount = 90;
      priorityScore = 1;
      break;
  }

  const nextCountDate = new Date(lastCountDate);
  nextCountDate.setDate(nextCountDate.getDate() + daysUntilNextCount);

  return {
    sku,
    abcClass,
    frequency,
    nextCountDate,
    priorityScore,
  };
}

/**
 * IMPLEMENTATION NOTES:
 * - FIFO: First-In-First-Out (oldest inventory used first)
 * - LIFO: Last-In-First-Out (newest inventory used first)
 * - Weighted Average: Average cost of all units (smooth cost fluctuations)
 * - Specific Identification: Track individual unit costs (high-value items)
 * - Reorder Point: Inventory level triggering new order
 * - Safety Stock: Buffer inventory for demand/lead time variability
 * - EOQ: Economic Order Quantity (already in mrpPlanner.ts)
 * - ABC Classification: Pareto 80/20 rule (A: 80% value, 20% items)
 * - Inventory Turnover: COGS / Average Inventory (higher = better)
 * - Days on Hand: 365 / Turnover (lower = faster inventory movement)
 * - Slow-moving: 180+ days without movement
 * - Obsolete: 365+ days without movement
 * - Cycle counting: Perpetual inventory verification (Class A weekly, B monthly, C quarterly)
 * - JIT: Just-In-Time (minimize inventory, order when needed)
 * - Consignment: Supplier owns inventory until used
 * - Kanban: Visual signal for replenishment (pull system)
 * - Min-Max: Order when below min to max level
 */
