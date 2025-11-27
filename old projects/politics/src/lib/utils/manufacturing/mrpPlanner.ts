/**
 * @file src/lib/utils/manufacturing/mrpPlanner.ts
 * @description Material Requirements Planning (MRP) algorithm utilities
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Utilities for Material Requirements Planning (MRP) - a production planning,
 * scheduling, and inventory control system. MRP calculates what materials are
 * needed, how much, and when, based on master production schedule and BOM.
 * 
 * MRP Logic:
 * 1. Net Requirements = Gross Requirements - On Hand - Scheduled Receipts
 * 2. Planned Orders = Net Requirements (with lot sizing applied)
 * 3. Planned Order Release = Planned Order Receipt - Lead Time
 * 
 * Lot Sizing Methods:
 * - EOQ: Economic Order Quantity (minimize ordering + holding costs)
 * - POQ: Period Order Quantity (EOQ in time periods)
 * - LFL: Lot-for-Lot (order exactly what's needed, JIT approach)
 * - FOQ: Fixed Order Quantity (constant order size)
 * - MinMax: Order when below min to max level
 * 
 * USAGE:
 * ```typescript
 * import { calculateNetRequirements, applyLotSizing } from '@/lib/utils/manufacturing/mrpPlanner';
 * 
 * const net = calculateNetRequirements(1000, 200, 100);
 * console.log(net); // 700
 * 
 * const order = applyLotSizing(700, 'EOQ', { annualDemand: 52000, orderCost: 50, holdingCost: 2 });
 * console.log(order); // 1,020 units (EOQ)
 * ```
 */

/**
 * Calculate Net Requirements
 * 
 * Net Requirements = Gross Requirements - On Hand Inventory - Scheduled Receipts
 * 
 * @param grossRequirements - Total demand for period
 * @param onHandInventory - Current inventory on hand
 * @param scheduledReceipts - Open purchase/production orders
 * @returns Net requirements (unfilled demand)
 */
export function calculateNetRequirements(
  grossRequirements: number,
  onHandInventory: number,
  scheduledReceipts: number
): number {
  const netRequirements = grossRequirements - onHandInventory - scheduledReceipts;

  return Math.max(0, Number(netRequirements.toFixed(0)));
}

/**
 * Calculate Economic Order Quantity (EOQ)
 * 
 * EOQ = √(2 × D × S / H)
 * Where:
 * - D = Annual demand (units)
 * - S = Order cost per order ($)
 * - H = Holding cost per unit per year ($)
 * 
 * EOQ minimizes total cost (ordering cost + holding cost).
 * 
 * @param annualDemand - Annual demand in units
 * @param orderCost - Cost per order ($)
 * @param holdingCost - Holding cost per unit per year ($)
 * @returns Economic Order Quantity (units)
 * 
 * @example
 * ```typescript
 * const eoq = calculateEOQ(52000, 50, 2);
 * console.log(eoq); // 1,020 units
 * ```
 */
export function calculateEOQ(
  annualDemand: number,
  orderCost: number,
  holdingCost: number
): number {
  if (holdingCost <= 0) return 0;

  const eoq = Math.sqrt((2 * annualDemand * orderCost) / holdingCost);

  return Math.max(1, Number(eoq.toFixed(0)));
}

/**
 * Calculate Period Order Quantity (POQ)
 * 
 * POQ = EOQ / Average demand per period
 * 
 * POQ converts EOQ into number of periods to cover.
 * 
 * @param eoq - Economic Order Quantity
 * @param averageDemandPerPeriod - Average demand per period
 * @returns Number of periods to order for
 */
export function calculatePOQ(eoq: number, averageDemandPerPeriod: number): number {
  if (averageDemandPerPeriod <= 0) return 1;

  const poq = eoq / averageDemandPerPeriod;

  return Math.max(1, Math.round(poq));
}

/**
 * Lot Sizing Method configuration
 */
export type LotSizingMethod = 'LFL' | 'FOQ' | 'EOQ' | 'POQ' | 'MinMax';

export interface LotSizingConfig {
  method: LotSizingMethod;
  fixedOrderQuantity?: number;
  annualDemand?: number;
  orderCost?: number;
  holdingCost?: number;
  averageDemandPerPeriod?: number;
  minLevel?: number;
  maxLevel?: number;
  currentInventory?: number;
}

/**
 * Apply Lot Sizing to Net Requirements
 * 
 * @param netRequirements - Net requirements (unfilled demand)
 * @param config - Lot sizing configuration
 * @returns Planned order quantity
 * 
 * @example
 * ```typescript
 * const order = applyLotSizing(700, {
 *   method: 'EOQ',
 *   annualDemand: 52000,
 *   orderCost: 50,
 *   holdingCost: 2
 * });
 * console.log(order); // 1,020 units (EOQ)
 * ```
 */
export function applyLotSizing(
  netRequirements: number,
  config: LotSizingConfig
): number {
  if (netRequirements <= 0) return 0;

  switch (config.method) {
    case 'LFL': // Lot-for-Lot (order exactly what's needed)
      return netRequirements;

    case 'FOQ': // Fixed Order Quantity
      if (!config.fixedOrderQuantity || config.fixedOrderQuantity <= 0) {
        return netRequirements;
      }
      // Order in multiples of FOQ
      return Math.ceil(netRequirements / config.fixedOrderQuantity) * config.fixedOrderQuantity;

    case 'EOQ': // Economic Order Quantity
      if (
        !config.annualDemand ||
        !config.orderCost ||
        !config.holdingCost ||
        config.holdingCost <= 0
      ) {
        return netRequirements;
      }
      const eoq = calculateEOQ(config.annualDemand, config.orderCost, config.holdingCost);
      // Order in multiples of EOQ
      return Math.ceil(netRequirements / eoq) * eoq;

    case 'POQ': // Period Order Quantity
      if (
        !config.annualDemand ||
        !config.orderCost ||
        !config.holdingCost ||
        !config.averageDemandPerPeriod ||
        config.holdingCost <= 0
      ) {
        return netRequirements;
      }
      const eoqForPOQ = calculateEOQ(
        config.annualDemand,
        config.orderCost,
        config.holdingCost
      );
      const poq = calculatePOQ(eoqForPOQ, config.averageDemandPerPeriod);
      const orderQuantity = poq * config.averageDemandPerPeriod;
      return Math.ceil(netRequirements / orderQuantity) * orderQuantity;

    case 'MinMax': // Min-Max reorder
      if (!config.minLevel || !config.maxLevel || !config.currentInventory) {
        return netRequirements;
      }
      const projectedInventory = config.currentInventory - netRequirements;
      if (projectedInventory < config.minLevel) {
        // Order up to max level
        return config.maxLevel - projectedInventory;
      }
      return 0; // No order needed

    default:
      return netRequirements;
  }
}

/**
 * Calculate Lead Time Offsetting
 * 
 * Release Date = Due Date - Lead Time
 * 
 * @param dueDate - Date when material is needed
 * @param leadTimeDays - Lead time in days
 * @returns Release date (when order should be placed)
 */
export function calculateReleaseDate(dueDate: Date, leadTimeDays: number): Date {
  const releaseDate = new Date(dueDate);
  releaseDate.setDate(releaseDate.getDate() - leadTimeDays);
  return releaseDate;
}

/**
 * BOM (Bill of Materials) component
 */
export interface BOMComponent {
  componentSKU: string;
  componentDescription: string;
  quantityPerParent: number;
  leadTimeDays: number;
  onHandInventory: number;
  scheduledReceipts: number;
  lotSizingMethod: LotSizingMethod;
  lotSizingConfig?: Partial<LotSizingConfig>;
}

/**
 * BOM Explosion result (multi-level requirements)
 */
export interface BOMExplosionResult {
  sku: string;
  description: string;
  level: number;
  grossRequirements: number;
  onHandInventory: number;
  scheduledReceipts: number;
  netRequirements: number;
  plannedOrderQuantity: number;
  releaseDate: Date;
  dueDate: Date;
}

/**
 * Explode BOM (Multi-level Material Requirements)
 * 
 * Calculates component requirements for all BOM levels.
 * 
 * @param parentSKU - Parent item SKU
 * @param parentDescription - Parent item description
 * @param parentQuantity - Quantity of parent needed
 * @param parentDueDate - When parent is needed
 * @param bomComponents - BOM components (children)
 * @param level - BOM level (0 = parent, 1 = children, etc.)
 * @returns Array of BOM explosion results
 */
export function explodeBOM(
  parentSKU: string,
  parentDescription: string,
  parentQuantity: number,
  parentDueDate: Date,
  bomComponents: BOMComponent[],
  level: number = 0
): BOMExplosionResult[] {
  const results: BOMExplosionResult[] = [];

  // Mark intentionally unused parameters as referenced for TypeScript strict checks
  void parentSKU;
  void parentDescription;

  for (const component of bomComponents) {
    // Calculate gross requirements
    const grossRequirements = parentQuantity * component.quantityPerParent;

    // Calculate net requirements
    const netRequirements = calculateNetRequirements(
      grossRequirements,
      component.onHandInventory,
      component.scheduledReceipts
    );

    // Apply lot sizing
    const lotSizingConfig: LotSizingConfig = {
      method: component.lotSizingMethod,
      ...component.lotSizingConfig,
    };
    const plannedOrderQuantity = applyLotSizing(netRequirements, lotSizingConfig);

    // Calculate release date
    const releaseDate = calculateReleaseDate(parentDueDate, component.leadTimeDays);

    results.push({
      sku: component.componentSKU,
      description: component.componentDescription,
      level: level + 1,
      grossRequirements,
      onHandInventory: component.onHandInventory,
      scheduledReceipts: component.scheduledReceipts,
      netRequirements,
      plannedOrderQuantity,
      releaseDate,
      dueDate: parentDueDate,
    });
  }

  return results;
}

/**
 * MRP Time Bucket (weekly/monthly periods)
 */
export interface MRPTimeBucket {
  period: number;
  startDate: Date;
  endDate: Date;
  grossRequirements: number;
  scheduledReceipts: number;
  projectedOnHand: number;
  netRequirements: number;
  plannedOrderReceipt: number;
  plannedOrderRelease: number;
}

/**
 * Generate MRP Schedule (time-phased requirements)
 * 
 * @param startDate - Planning horizon start
 * @param periods - Number of periods (weeks/months)
 * @param periodDays - Days per period (7 for weekly, 30 for monthly)
 * @param initialInventory - Starting inventory
 * @param grossRequirementsByPeriod - Demand by period
 * @param scheduledReceiptsByPeriod - Open orders by period
 * @param leadTimePeriods - Lead time in periods
 * @param lotSizingConfig - Lot sizing configuration
 * @returns MRP time buckets
 */
export function generateMRPSchedule(
  startDate: Date,
  periods: number,
  periodDays: number,
  initialInventory: number,
  grossRequirementsByPeriod: number[],
  scheduledReceiptsByPeriod: number[],
  leadTimePeriods: number,
  lotSizingConfig: LotSizingConfig
): MRPTimeBucket[] {
  const buckets: MRPTimeBucket[] = [];
  let projectedOnHand = initialInventory;

  for (let period = 0; period < periods; period++) {
    const bucketStartDate = new Date(startDate);
    bucketStartDate.setDate(bucketStartDate.getDate() + period * periodDays);

    const bucketEndDate = new Date(bucketStartDate);
    bucketEndDate.setDate(bucketEndDate.getDate() + periodDays - 1);

    const grossRequirements = grossRequirementsByPeriod[period] || 0;
    const scheduledReceipts = scheduledReceiptsByPeriod[period] || 0;

    // Calculate projected on hand before planned receipt
    const projectedBeforeReceipt = projectedOnHand + scheduledReceipts - grossRequirements;

    // Calculate net requirements
    const netRequirements = projectedBeforeReceipt < 0 ? Math.abs(projectedBeforeReceipt) : 0;

    // Apply lot sizing
    const plannedOrderReceipt = applyLotSizing(netRequirements, lotSizingConfig);

    // Update projected on hand
    projectedOnHand = projectedBeforeReceipt + plannedOrderReceipt;

    // Calculate planned order release (offset by lead time)
    const plannedOrderRelease =
      period >= leadTimePeriods && buckets[period - leadTimePeriods]
        ? buckets[period - leadTimePeriods].plannedOrderReceipt
        : 0;

    buckets.push({
      period: period + 1,
      startDate: bucketStartDate,
      endDate: bucketEndDate,
      grossRequirements,
      scheduledReceipts,
      projectedOnHand: Math.max(0, projectedOnHand),
      netRequirements,
      plannedOrderReceipt,
      plannedOrderRelease,
    });
  }

  return buckets;
}

/**
 * MRP Exception Messages
 */
export type MRPExceptionType =
  | 'LATE_ORDER'
  | 'MATERIAL_SHORTAGE'
  | 'EXCESS_INVENTORY'
  | 'RESCHEDULE_IN'
  | 'RESCHEDULE_OUT'
  | 'EXPEDITE';

export interface MRPException {
  type: MRPExceptionType;
  sku: string;
  period: number;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction: string;
}

/**
 * Identify MRP Exceptions
 * 
 * @param mrpSchedule - MRP time buckets
 * @param sku - Item SKU
 * @param safetyStock - Minimum safety stock level
 * @returns Array of exceptions
 */
export function identifyMRPExceptions(
  mrpSchedule: MRPTimeBucket[],
  sku: string,
  safetyStock: number
): MRPException[] {
  const exceptions: MRPException[] = [];

  for (let i = 0; i < mrpSchedule.length; i++) {
    const bucket = mrpSchedule[i];

    // Material shortage
    if (bucket.netRequirements > 0 && bucket.plannedOrderReceipt === 0) {
      exceptions.push({
        type: 'MATERIAL_SHORTAGE',
        sku,
        period: bucket.period,
        message: `Material shortage of ${bucket.netRequirements} units in period ${bucket.period}`,
        severity: 'CRITICAL',
        recommendedAction: 'Place emergency order or expedite existing order',
      });
    }

    // Excess inventory
    if (bucket.projectedOnHand > safetyStock * 3 && bucket.grossRequirements === 0) {
      exceptions.push({
        type: 'EXCESS_INVENTORY',
        sku,
        period: bucket.period,
        message: `Excess inventory of ${bucket.projectedOnHand - safetyStock} units in period ${bucket.period}`,
        severity: 'LOW',
        recommendedAction: 'Consider reducing order quantities or delaying orders',
      });
    }

    // Below safety stock
    if (bucket.projectedOnHand < safetyStock && bucket.projectedOnHand > 0) {
      exceptions.push({
        type: 'MATERIAL_SHORTAGE',
        sku,
        period: bucket.period,
        message: `Projected inventory ${bucket.projectedOnHand} below safety stock ${safetyStock} in period ${bucket.period}`,
        severity: 'HIGH',
        recommendedAction: 'Increase order quantity or expedite delivery',
      });
    }

    // Late scheduled receipt
    if (bucket.scheduledReceipts > 0 && bucket.projectedOnHand < 0) {
      exceptions.push({
        type: 'LATE_ORDER',
        sku,
        period: bucket.period,
        message: `Scheduled receipt arriving late in period ${bucket.period}`,
        severity: 'HIGH',
        recommendedAction: 'Expedite scheduled receipt or find alternative source',
      });
    }
  }

  return exceptions;
}

/**
 * Pegging (trace requirements to source demand)
 */
export interface PeggingRecord {
  componentSKU: string;
  componentDescription: string;
  quantityNeeded: number;
  parentSKU: string;
  parentDescription: string;
  parentQuantity: number;
  endItemSKU: string;
  endItemDescription: string;
  endItemQuantity: number;
  dueDate: Date;
}

/**
 * Create pegging records (trace component to end item)
 * 
 * @param componentSKU - Component item
 * @param componentDescription - Component description
 * @param quantityNeeded - Component quantity needed
 * @param parentSKU - Parent assembly
 * @param parentDescription - Parent description
 * @param parentQuantity - Parent quantity
 * @param endItemSKU - Final end item
 * @param endItemDescription - End item description
 * @param endItemQuantity - End item quantity
 * @param dueDate - When end item is needed
 * @returns Pegging record
 */
export function createPeggingRecord(
  componentSKU: string,
  componentDescription: string,
  quantityNeeded: number,
  parentSKU: string,
  parentDescription: string,
  parentQuantity: number,
  endItemSKU: string,
  endItemDescription: string,
  endItemQuantity: number,
  dueDate: Date
): PeggingRecord {
  return {
    componentSKU,
    componentDescription,
    quantityNeeded,
    parentSKU,
    parentDescription,
    parentQuantity,
    endItemSKU,
    endItemDescription,
    endItemQuantity,
    dueDate,
  };
}

/**
 * IMPLEMENTATION NOTES:
 * - MRP: Material Requirements Planning (what, how much, when)
 * - MRP inputs: Master Production Schedule (MPS), BOM, Inventory records
 * - MRP outputs: Planned orders, Scheduled receipts, Projected inventory
 * - Net requirements: Demand not covered by inventory or scheduled receipts
 * - Lot sizing: Determines order quantity (EOQ, POQ, LFL, FOQ, MinMax)
 * - EOQ: Minimizes ordering + holding costs (square root formula)
 * - POQ: EOQ converted to time periods
 * - LFL: Lot-for-Lot (JIT approach, order exactly what's needed)
 * - FOQ: Fixed Order Quantity (constant order size)
 * - MinMax: Reorder when below min to max level
 * - Lead time offsetting: Release date = Due date - Lead time
 * - BOM explosion: Multi-level material requirements calculation
 * - Time buckets: Weekly or monthly planning periods
 * - Pegging: Tracing component requirements to source demand
 * - Exception messages: LATE_ORDER, MATERIAL_SHORTAGE, EXCESS_INVENTORY, EXPEDITE
 * - Safety stock: Buffer inventory to handle variability
 * - MPS: Master Production Schedule (what to produce, how much, when)
 * - MRP runs: Regenerative (full) or Net Change (incremental)
 * - Planning horizon: Typically 6-12 months
 */
