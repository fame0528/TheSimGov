/**
 * @file src/lib/utils/manufacturing/mrpPlanner.ts
 * @description Material Requirements Planning (MRP) utility
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Implements MRP logic including BOM explosion, gross-to-net calculation,
 * lot sizing, and order release planning. Supports multi-level BOM structures.
 * 
 * MRP LOGIC:
 * 1. Start with Master Production Schedule (MPS)
 * 2. Explode BOM to determine component requirements
 * 3. Calculate gross requirements by time period
 * 4. Net requirements = Gross - On Hand - Scheduled Receipts
 * 5. Apply lot sizing rules
 * 6. Offset by lead time to determine order release
 * 
 * KEY CONCEPTS:
 * - BOM: Bill of Materials (parent-child relationships)
 * - Gross Requirements: Total need for each period
 * - Net Requirements: Need after subtracting inventory
 * - Planned Order Release: When to place order considering lead time
 * - Lot Sizing: How much to order (LFL, EOQ, POQ, etc.)
 */

import type { MRPInputs, MRPResult } from '@/types/manufacturing';

/**
 * Lot sizing methods
 */
export type LotSizingMethod = 'LFL' | 'EOQ' | 'POQ' | 'FOQ';

/**
 * BOM item structure
 */
export interface BOMItem {
  parent: string;
  component: string;
  quantity: number;    // Quantity per parent
  leadTime: number;    // Lead time in periods
  scrapFactor: number; // 1.0 = no scrap, 1.05 = 5% scrap
  level: number;       // BOM level (0 = finished good)
}

/**
 * MRP record for a single item
 */
export interface MRPRecord {
  item: string;
  periods: Array<{
    period: number;
    grossRequirements: number;
    scheduledReceipts: number;
    projectedOnHand: number;
    netRequirements: number;
    plannedOrderReceipts: number;
    plannedOrderReleases: number;
  }>;
  orderDates: Array<{ period: number; quantity: number }>;
}

/**
 * Run MRP calculation
 * 
 * @param inputs - MPS, BOM, inventory, scheduled receipts
 * @returns Planned orders and shortages
 */
export function runMRP(inputs: MRPInputs): MRPResult {
  const { masterSchedule, billOfMaterials, currentInventory, scheduledReceipts } = inputs;

  const plannedOrders: MRPResult['plannedOrders'] = [];
  const shortages: MRPResult['shortages'] = [];

  // Get unique components
  const components = [...new Set(billOfMaterials.map(b => b.component))];

  for (const component of components) {
    const bomEntry = billOfMaterials.find(b => b.component === component);
    if (!bomEntry) continue;

    const { quantity: qtyPer, leadTime } = bomEntry;
    const onHand = currentInventory[component] || 0;
    const receipts = scheduledReceipts[component] || [];

    // Calculate gross requirements from MPS
    const periods = masterSchedule.map(ms => ({
      period: ms.period,
      grossRequirements: ms.demand * qtyPer,
      scheduledReceipts: receipts.find(r => r.period === ms.period)?.quantity || 0,
    }));

    // Run MRP logic for this component
    let projectedOnHand = onHand;
    
    for (const period of periods) {
      // Add scheduled receipts
      projectedOnHand += period.scheduledReceipts;

      // Calculate net requirements
      const netReq = Math.max(0, period.grossRequirements - projectedOnHand);

      if (netReq > 0) {
        // Plan order release (offset by lead time)
        const releaseperiod = period.period - leadTime;

        if (releaseperiod < 1) {
          // Shortage - cannot meet demand in time
          shortages.push({
            component,
            period: period.period,
            shortageQuantity: netReq,
          });
        } else {
          plannedOrders.push({
            component,
            period: releaseperiod,
            quantity: netReq,
            dueDate: `Period ${period.period}`,
          });
        }

        // Update projected on hand
        projectedOnHand = 0;
      } else {
        projectedOnHand -= period.grossRequirements;
      }
    }
  }

  // Sort by period
  plannedOrders.sort((a, b) => a.period - b.period);
  shortages.sort((a, b) => a.period - b.period);

  return { plannedOrders, shortages };
}

/**
 * Full MRP calculation with detailed records
 */
export interface FullMRPInputs {
  masterSchedule: Array<{ period: number; item: string; quantity: number }>;
  bom: BOMItem[];
  inventory: Record<string, number>;
  scheduledReceipts: Record<string, Array<{ period: number; quantity: number }>>;
  lotSizing: Record<string, { method: LotSizingMethod; parameter?: number }>;
  horizonPeriods: number;
}

export interface FullMRPResult {
  records: MRPRecord[];
  actionMessages: Array<{
    type: 'release' | 'expedite' | 'delay' | 'cancel';
    item: string;
    message: string;
    period: number;
  }>;
}

export function runFullMRP(inputs: FullMRPInputs): FullMRPResult {
  const { masterSchedule, bom, inventory, scheduledReceipts, lotSizing, horizonPeriods } = inputs;

  const records: MRPRecord[] = [];
  const actionMessages: FullMRPResult['actionMessages'] = [];

  // Get all items in BOM order (level by level)
  const itemsByLevel = new Map<number, string[]>();
  const itemLevels = new Map<string, number>();

  // Assign levels based on BOM
  for (const bomItem of bom) {
    const currentLevel = itemLevels.get(bomItem.component) || 0;
    itemLevels.set(bomItem.component, Math.max(currentLevel, bomItem.level));
  }

  // Add finished goods (level 0)
  const finishedGoods = [...new Set(masterSchedule.map(ms => ms.item))];
  for (const fg of finishedGoods) {
    if (!itemLevels.has(fg)) {
      itemLevels.set(fg, 0);
    }
  }

  // Group by level
  for (const [item, level] of itemLevels) {
    if (!itemsByLevel.has(level)) {
      itemsByLevel.set(level, []);
    }
    itemsByLevel.get(level)!.push(item);
  }

  // Process items level by level (low to high)
  const levels = [...itemsByLevel.keys()].sort((a, b) => a - b);

  // Track gross requirements propagated from parents
  const grossRequirements = new Map<string, number[]>();

  // Initialize with MPS for finished goods
  for (const ms of masterSchedule) {
    if (!grossRequirements.has(ms.item)) {
      grossRequirements.set(ms.item, new Array(horizonPeriods + 1).fill(0));
    }
    grossRequirements.get(ms.item)![ms.period] = ms.quantity;
  }

  for (const level of levels) {
    const items = itemsByLevel.get(level) || [];

    for (const item of items) {
      const record = processMRPItem(
        item,
        grossRequirements.get(item) || new Array(horizonPeriods + 1).fill(0),
        inventory[item] || 0,
        scheduledReceipts[item] || [],
        lotSizing[item] || { method: 'LFL' },
        bom.find(b => b.component === item)?.leadTime || 1,
        horizonPeriods
      );

      records.push(record);

      // Propagate requirements to children
      const childBom = bom.filter(b => b.parent === item);
      for (const child of childBom) {
        if (!grossRequirements.has(child.component)) {
          grossRequirements.set(child.component, new Array(horizonPeriods + 1).fill(0));
        }
        const childReqs = grossRequirements.get(child.component)!;
        
        for (const order of record.orderDates) {
          const quantity = order.quantity * child.quantity * child.scrapFactor;
          childReqs[order.period] = (childReqs[order.period] || 0) + quantity;
        }
      }

      // Generate action messages
      for (const order of record.orderDates) {
        if (order.period <= 0) {
          actionMessages.push({
            type: 'expedite',
            item,
            message: `Order ${order.quantity} units immediately (past due)`,
            period: order.period,
          });
        } else if (order.period === 1) {
          actionMessages.push({
            type: 'release',
            item,
            message: `Release order for ${order.quantity} units this period`,
            period: 1,
          });
        }
      }
    }
  }

  return { records, actionMessages };
}

/**
 * Process single item for MRP
 */
function processMRPItem(
  item: string,
  grossReqs: number[],
  onHand: number,
  scheduledReceipts: Array<{ period: number; quantity: number }>,
  lotSizing: { method: LotSizingMethod; parameter?: number },
  leadTime: number,
  horizonPeriods: number
): MRPRecord {
  const periods: MRPRecord['periods'] = [];
  const orderDates: MRPRecord['orderDates'] = [];

  let projectedOnHand = onHand;

  for (let period = 1; period <= horizonPeriods; period++) {
    const grossRequirements = grossReqs[period] || 0;
    const scheduled = scheduledReceipts.find(r => r.period === period)?.quantity || 0;

    // Calculate projected available
    const available = projectedOnHand + scheduled;
    const netRequirements = Math.max(0, grossRequirements - available);

    // Apply lot sizing
    let plannedOrderReceipts = 0;
    if (netRequirements > 0) {
      plannedOrderReceipts = applyLotSizing(netRequirements, lotSizing);
    }

    // Calculate planned order release (offset by lead time)
    const releasePeriod = period - leadTime;
    let plannedOrderReleases = 0;
    
    if (plannedOrderReceipts > 0) {
      plannedOrderReleases = plannedOrderReceipts;
      orderDates.push({ period: releasePeriod, quantity: plannedOrderReceipts });
    }

    // Update projected on hand
    projectedOnHand = available + plannedOrderReceipts - grossRequirements;

    periods.push({
      period,
      grossRequirements,
      scheduledReceipts: scheduled,
      projectedOnHand: Math.max(0, projectedOnHand),
      netRequirements,
      plannedOrderReceipts,
      plannedOrderReleases,
    });
  }

  return { item, periods, orderDates };
}

/**
 * Apply lot sizing rule
 */
function applyLotSizing(
  netReq: number,
  lotSizing: { method: LotSizingMethod; parameter?: number }
): number {
  switch (lotSizing.method) {
    case 'LFL': // Lot-for-lot
      return netReq;
    
    case 'FOQ': // Fixed order quantity
      const foq = lotSizing.parameter || netReq;
      return Math.ceil(netReq / foq) * foq;
    
    case 'EOQ': // Economic order quantity
      const eoq = lotSizing.parameter || netReq;
      return Math.max(eoq, netReq);
    
    case 'POQ': // Period order quantity
      // POQ would need multiple periods of demand - simplified here
      return netReq;
    
    default:
      return netReq;
  }
}

/**
 * BOM explosion (single level)
 */
export function explodeBOM(
  parentRequirement: number,
  bom: BOMItem[],
  parent: string
): Array<{ component: string; quantity: number; leadTime: number }> {
  return bom
    .filter(b => b.parent === parent)
    .map(b => ({
      component: b.component,
      quantity: parentRequirement * b.quantity * b.scrapFactor,
      leadTime: b.leadTime,
    }));
}

/**
 * Multi-level BOM explosion
 */
export function explodeBOMMultiLevel(
  requirement: number,
  bom: BOMItem[],
  startItem: string,
  maxLevel = 10
): Array<{ component: string; level: number; quantity: number; leadTime: number }> {
  const result: Array<{ component: string; level: number; quantity: number; leadTime: number }> = [];
  
  function explode(parent: string, qty: number, level: number) {
    if (level > maxLevel) return;
    
    const children = bom.filter(b => b.parent === parent);
    for (const child of children) {
      const childQty = qty * child.quantity * child.scrapFactor;
      result.push({
        component: child.component,
        level,
        quantity: childQty,
        leadTime: child.leadTime,
      });
      explode(child.component, childQty, level + 1);
    }
  }

  explode(startItem, requirement, 1);
  return result;
}

/**
 * Calculate cumulative lead time
 */
export function calculateCumulativeLeadTime(
  bom: BOMItem[],
  startItem: string
): { totalLeadTime: number; criticalPath: string[] } {
  const visited = new Set<string>();
  let maxPath: string[] = [];
  let maxLeadTime = 0;

  function findCriticalPath(item: string, currentPath: string[], currentLeadTime: number) {
    if (visited.has(item)) return;
    
    const children = bom.filter(b => b.parent === item);
    
    if (children.length === 0) {
      if (currentLeadTime > maxLeadTime) {
        maxLeadTime = currentLeadTime;
        maxPath = [...currentPath];
      }
      return;
    }

    for (const child of children) {
      findCriticalPath(
        child.component,
        [...currentPath, child.component],
        currentLeadTime + child.leadTime
      );
    }
  }

  const rootLead = bom.find(b => b.component === startItem)?.leadTime || 0;
  findCriticalPath(startItem, [startItem], rootLead);

  return { totalLeadTime: maxLeadTime, criticalPath: maxPath };
}

/**
 * Capacity requirements planning (CRP) integration
 */
export interface WorkCenter {
  id: string;
  name: string;
  hoursPerPeriod: number;
}

export interface RoutingStep {
  item: string;
  workCenter: string;
  setupTime: number;    // Hours
  runTimePerUnit: number; // Hours
  sequence: number;
}

export interface CRPResult {
  workCenterLoading: Array<{
    workCenter: string;
    periods: Array<{
      period: number;
      requiredHours: number;
      availableHours: number;
      utilization: number;
      overloaded: boolean;
    }>;
  }>;
  overloadedPeriods: Array<{ workCenter: string; period: number; overloadHours: number }>;
}

export function calculateCRP(
  plannedOrders: MRPResult['plannedOrders'],
  routings: RoutingStep[],
  workCenters: WorkCenter[],
  horizonPeriods: number
): CRPResult {
  const workCenterLoading: CRPResult['workCenterLoading'] = [];
  const overloadedPeriods: CRPResult['overloadedPeriods'] = [];

  for (const wc of workCenters) {
    const periods: CRPResult['workCenterLoading'][0]['periods'] = [];
    
    for (let period = 1; period <= horizonPeriods; period++) {
      // Find orders in this period for this work center
      const ordersInPeriod = plannedOrders.filter(o => o.period === period);
      let requiredHours = 0;

      for (const order of ordersInPeriod) {
        const routing = routings.find(r => r.item === order.component && r.workCenter === wc.id);
        if (routing) {
          requiredHours += routing.setupTime + (routing.runTimePerUnit * order.quantity);
        }
      }

      const availableHours = wc.hoursPerPeriod;
      const utilization = availableHours > 0 ? (requiredHours / availableHours) * 100 : 0;
      const overloaded = requiredHours > availableHours;

      if (overloaded) {
        overloadedPeriods.push({
          workCenter: wc.id,
          period,
          overloadHours: requiredHours - availableHours,
        });
      }

      periods.push({
        period,
        requiredHours: Math.round(requiredHours * 100) / 100,
        availableHours,
        utilization: Math.round(utilization * 100) / 100,
        overloaded,
      });
    }

    workCenterLoading.push({ workCenter: wc.id, periods });
  }

  return { workCenterLoading, overloadedPeriods };
}

export default {
  runMRP,
  runFullMRP,
  explodeBOM,
  explodeBOMMultiLevel,
  calculateCumulativeLeadTime,
  calculateCRP,
};
