/**
 * @file src/lib/game/tick/manufacturingProcessor.ts
 * @description Manufacturing tick processor for production runs and inventory
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Processes manufacturing industry events each game tick:
 * - Run production cycles on active production lines
 * - Consume raw materials from inventory
 * - Calculate OEE (Overall Equipment Effectiveness)
 * - Apply equipment wear and maintenance
 * - Fulfill pending orders
 *
 * KEY CONCEPTS:
 * - OEE = Availability × Performance × Quality
 * - Production = Capacity × OEE × Operating Hours
 * - Costs = Labor + Materials + Energy + Maintenance
 *
 * @author ECHO v1.4.0
 */

import {
  ITickProcessor,
  GameTime,
  TickProcessorResult,
  TickProcessorOptions,
  TickError,
} from '@/lib/types/gameTick';
import ManufacturingFacility from '@/lib/db/models/manufacturing/ManufacturingFacility';
import ProductionLine from '@/lib/db/models/manufacturing/ProductionLine';
import Supplier from '@/lib/db/models/manufacturing/Supplier';
import Company from '@/lib/db/models/Company';

// ============================================================================
// MANUFACTURING TICK SUMMARY TYPE
// ============================================================================

export interface ManufacturingTickSummary {
  [key: string]: unknown;
  
  // Facilities & lines processed
  facilitiesProcessed: number;
  productionLinesProcessed: number;
  suppliersProcessed: number;
  
  // Production totals
  unitsProduced: number;
  batchesCompleted: number;
  defectsDetected: number;
  scrapGenerated: number;
  
  // OEE metrics
  averageOEE: number;
  averageAvailability: number;
  averagePerformance: number;
  averageQuality: number;
  
  // Financial
  productionRevenue: number;
  laborCosts: number;
  materialCosts: number;
  energyCosts: number;
  maintenanceCosts: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  
  // Issues
  breakdownsOccurred: number;
  maintenanceDue: number;
}

// ============================================================================
// MANUFACTURING TICK PROCESSOR
// ============================================================================

/**
 * Manufacturing tick processor implementation
 */
export const manufacturingProcessor: ITickProcessor = {
  name: 'manufacturing',
  priority: 20, // After energy (15)
  enabled: true,

  /**
   * Process manufacturing tick
   */
  async process(
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<TickProcessorResult> {
    const startTime = Date.now();
    const errors: TickError[] = [];
    let itemsProcessed = 0;

    // Summary counters
    const summary: ManufacturingTickSummary = {
      facilitiesProcessed: 0,
      productionLinesProcessed: 0,
      suppliersProcessed: 0,
      unitsProduced: 0,
      batchesCompleted: 0,
      defectsDetected: 0,
      scrapGenerated: 0,
      averageOEE: 0,
      averageAvailability: 0,
      averagePerformance: 0,
      averageQuality: 0,
      productionRevenue: 0,
      laborCosts: 0,
      materialCosts: 0,
      energyCosts: 0,
      maintenanceCosts: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      breakdownsOccurred: 0,
      maintenanceDue: 0,
    };

    // OEE accumulators for averaging
    let totalOEE = 0;
    let totalAvailability = 0;
    let totalPerformance = 0;
    let totalQuality = 0;
    let oeeCount = 0;

    try {
      // Build company filter
      const companyFilter = await buildCompanyFilter(options);

      // 1. PROCESS MANUFACTURING FACILITIES
      const facilities = await ManufacturingFacility.find({
        ...companyFilter,
        active: true,
      });

      for (const facility of facilities) {
        try {
          const result = await processFacility(facility, gameTime, options?.dryRun);
          
          summary.facilitiesProcessed++;
          summary.unitsProduced += result.unitsProduced;
          summary.laborCosts += result.laborCosts;
          summary.energyCosts += result.energyCosts;
          summary.maintenanceCosts += result.maintenanceCosts;
          
          if (result.maintenanceDue) summary.maintenanceDue++;
          
          // Accumulate OEE
          totalOEE += result.oee;
          totalAvailability += result.availability;
          totalPerformance += result.performance;
          totalQuality += result.quality;
          oeeCount++;
          
          errors.push(...result.errors);
          itemsProcessed++;
        } catch (error) {
          errors.push({
            entityId: facility._id.toString(),
            entityType: 'ManufacturingFacility',
            message: error instanceof Error ? error.message : 'Unknown error',
            recoverable: true,
          });
        }
      }

      // 2. PROCESS PRODUCTION LINES
      const lines = await ProductionLine.find({
        ...companyFilter,
        active: true,
        status: { $in: ['Running', 'Idle'] },
      });

      for (const line of lines) {
        try {
          const result = await processProductionLine(line, gameTime, options?.dryRun);
          
          summary.productionLinesProcessed++;
          summary.unitsProduced += result.unitsProduced;
          summary.batchesCompleted += result.batchCompleted ? 1 : 0;
          summary.defectsDetected += result.defects;
          summary.scrapGenerated += result.scrap;
          summary.productionRevenue += result.revenue;
          summary.materialCosts += result.materialCost;
          
          if (result.breakdown) summary.breakdownsOccurred++;
          
          errors.push(...result.errors);
          itemsProcessed++;
        } catch (error) {
          errors.push({
            entityId: line._id.toString(),
            entityType: 'ProductionLine',
            message: error instanceof Error ? error.message : 'Unknown error',
            recoverable: true,
          });
        }
      }

      // 3. PROCESS SUPPLIER RELATIONSHIPS
      const suppliers = await Supplier.find({
        ...companyFilter,
        active: true,
      });

      for (const supplier of suppliers) {
        try {
          const result = await processSupplier(supplier, gameTime, options?.dryRun);
          
          summary.suppliersProcessed++;
          summary.materialCosts += result.orderCost;
          
          errors.push(...result.errors);
          itemsProcessed++;
        } catch (error) {
          errors.push({
            entityId: supplier._id.toString(),
            entityType: 'Supplier',
            message: error instanceof Error ? error.message : 'Unknown error',
            recoverable: true,
          });
        }
      }

      // Calculate averages
      if (oeeCount > 0) {
        summary.averageOEE = Math.round(totalOEE / oeeCount);
        summary.averageAvailability = Math.round(totalAvailability / oeeCount);
        summary.averagePerformance = Math.round(totalPerformance / oeeCount);
        summary.averageQuality = Math.round(totalQuality / oeeCount);
      }

      // Calculate totals
      summary.totalRevenue = summary.productionRevenue;
      summary.totalExpenses = summary.laborCosts + summary.materialCosts + 
        summary.energyCosts + summary.maintenanceCosts;
      summary.netProfit = summary.totalRevenue - summary.totalExpenses;

      return {
        processor: 'manufacturing',
        success: errors.length === 0 || errors.every(e => e.recoverable),
        itemsProcessed,
        errors,
        summary,
        durationMs: Date.now() - startTime,
      };

    } catch (error) {
      return {
        processor: 'manufacturing',
        success: false,
        itemsProcessed,
        errors: [{
          entityId: 'system',
          entityType: 'ManufacturingProcessor',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: false,
        }],
        summary,
        durationMs: Date.now() - startTime,
      };
    }
  },

  /**
   * Validate processor is ready
   */
  async validate(): Promise<true | string> {
    try {
      await ManufacturingFacility.findOne().limit(1);
      return true;
    } catch (error) {
      return `Manufacturing processor validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface FacilityProcessResult {
  unitsProduced: number;
  laborCosts: number;
  energyCosts: number;
  maintenanceCosts: number;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  maintenanceDue: boolean;
  errors: TickError[];
}

interface LineProcessResult {
  unitsProduced: number;
  batchCompleted: boolean;
  defects: number;
  scrap: number;
  revenue: number;
  materialCost: number;
  breakdown: boolean;
  errors: TickError[];
}

interface SupplierProcessResult {
  orderCost: number;
  deliveriesReceived: number;
  errors: TickError[];
}

/**
 * Build company filter based on options
 */
async function buildCompanyFilter(
  options?: TickProcessorOptions
): Promise<{ company?: { $in: string[] } }> {
  if (options?.companyId) {
    return { company: { $in: [options.companyId] } };
  }
  
  if (options?.playerId) {
    const companies = await Company.find({ owner: options.playerId }).select('_id');
    const companyIds = companies.map(c => c._id.toString());
    return { company: { $in: companyIds } };
  }
  
  return {};
}

/**
 * Process a manufacturing facility
 */
async function processFacility(
  facility: InstanceType<typeof ManufacturingFacility>,
  gameTime: GameTime,
  dryRun?: boolean
): Promise<FacilityProcessResult> {
  const errors: TickError[] = [];
  
  // Calculate monthly operating hours
  const hoursPerShift = facility.hoursPerShift || 8;
  const shiftsPerDay = facility.shiftsPerDay || 1;
  const daysPerWeek = facility.daysPerWeek || 5;
  const monthlyHours = hoursPerShift * shiftsPerDay * (daysPerWeek / 7) * 30;
  
  // Get OEE components
  const availability = facility.availability || 85;
  const performance = facility.performance || 90;
  const quality = facility.quality || 95;
  const oee = (availability * performance * quality) / 10000;
  
  // Calculate production
  const theoreticalCapacity = facility.theoreticalCapacity || 100;
  const monthlyProduction = Math.round(theoreticalCapacity * monthlyHours * (oee / 100));
  
  // Calculate costs
  const laborCost = calculateLaborCost(facility);
  const energyCost = calculateEnergyCost(facility, monthlyHours);
  const maintenanceCost = calculateMaintenanceCost(facility);
  
  // Check for maintenance due
  const maintenanceDue = facility.maintenanceBacklog > facility.monthlyOperatingCost * 0.2;
  
  if (!dryRun) {
    // Update facility stats
    facility.actualCapacity = monthlyProduction / monthlyHours;
    facility.utilizationRate = (facility.actualCapacity / theoreticalCapacity) * 100;
    facility.oeeScore = oee;
    
    // Random chance of issues
    const random = Math.random();
    if (random < 0.05) {
      // 5% chance of unplanned downtime
      facility.unplannedDowntime = (facility.unplannedDowntime || 0) + Math.round(Math.random() * 8);
    }
    
    await facility.save();
  }
  
  return {
    unitsProduced: monthlyProduction,
    laborCosts: laborCost,
    energyCosts: energyCost,
    maintenanceCosts: maintenanceCost,
    oee: Math.round(oee),
    availability,
    performance,
    quality,
    maintenanceDue,
    errors,
  };
}

/**
 * Process a production line
 */
async function processProductionLine(
  line: InstanceType<typeof ProductionLine>,
  gameTime: GameTime,
  dryRun?: boolean
): Promise<LineProcessResult> {
  const errors: TickError[] = [];
  
  // Skip if not running
  if (line.status !== 'Running') {
    return {
      unitsProduced: 0,
      batchCompleted: false,
      defects: 0,
      scrap: 0,
      revenue: 0,
      materialCost: 0,
      breakdown: false,
      errors,
    };
  }
  
  // Calculate monthly production
  const ratedSpeed = line.ratedSpeed || 10; // units/hour
  const speedEfficiency = (line.speedEfficiency || 90) / 100;
  const availability = (line.availability || 85) / 100;
  const quality = (line.quality || 95) / 100;
  
  // Assume 8 hours/day, 22 days/month
  const operatingHours = 8 * 22;
  const unitsProduced = Math.round(ratedSpeed * speedEfficiency * availability * operatingHours);
  
  // Quality losses
  const defects = Math.round(unitsProduced * (1 - quality));
  const scrap = Math.round(defects * 0.3); // 30% of defects become scrap
  const goodUnits = unitsProduced - defects;
  
  // Revenue (assume $50/unit average)
  const unitPrice = 50;
  const revenue = goodUnits * unitPrice;
  
  // Material cost (assume 40% of revenue)
  const materialCost = revenue * 0.4;
  
  // Check batch completion
  const batchProgress = (line.batchProgress || 0) + goodUnits;
  const batchSize = line.batchSize || 1000;
  const batchCompleted = batchProgress >= batchSize;
  
  // Random breakdown chance
  const breakdown = Math.random() < 0.02; // 2% monthly chance
  
  if (!dryRun) {
    line.actualSpeed = ratedSpeed * speedEfficiency;
    line.throughput = (line.throughput || 0) + unitsProduced;
    line.batchProgress = batchCompleted ? 0 : batchProgress;
    
    if (batchCompleted) {
      line.batchStartTime = new Date();
      line.currentBatchId = `BATCH-${Date.now()}`;
    }
    
    if (breakdown) {
      line.status = 'Breakdown';
      line.lastDowntimeReason = 'Random equipment failure';
      line.unplannedDowntime = (line.unplannedDowntime || 0) + Math.round(Math.random() * 4 + 1);
    }
    
    // Update OEE
    line.oee = Math.round(availability * speedEfficiency * quality * 100);
    
    await line.save();
  }
  
  return {
    unitsProduced: goodUnits,
    batchCompleted,
    defects,
    scrap,
    revenue,
    materialCost,
    breakdown,
    errors,
  };
}

/**
 * Process supplier relationship
 */
async function processSupplier(
  supplier: InstanceType<typeof Supplier>,
  gameTime: GameTime,
  dryRun?: boolean
): Promise<SupplierProcessResult> {
  const errors: TickError[] = [];
  
  // Calculate monthly order value based on annual spend
  const monthlyOrderValue = (supplier.annualSpend || 0) / 12;
  
  // Delivery tracking
  const onTimeDelivery = (supplier.onTimeDeliveryRate || 90) / 100;
  const deliveriesExpected = Math.round(30 / (supplier.leadTime || 7));
  const deliveriesOnTime = Math.round(deliveriesExpected * onTimeDelivery);
  
  if (!dryRun) {
    // Update supplier performance
    supplier.totalOrders = (supplier.totalOrders || 0) + deliveriesExpected;
    supplier.onTimeOrderCount = (supplier.onTimeOrderCount || 0) + deliveriesOnTime;
    supplier.lateOrderCount = (supplier.lateOrderCount || 0) + (deliveriesExpected - deliveriesOnTime);
    supplier.lastOrderDate = new Date();
    
    // Recalculate on-time delivery rate
    if (supplier.totalOrders > 0) {
      supplier.onTimeDeliveryRate = Math.round((supplier.onTimeOrderCount / supplier.totalOrders) * 100);
    }
    
    await supplier.save();
  }
  
  return {
    orderCost: monthlyOrderValue,
    deliveriesReceived: deliveriesOnTime,
    errors,
  };
}

/**
 * Calculate monthly labor cost
 */
function calculateLaborCost(facility: InstanceType<typeof ManufacturingFacility>): number {
  const totalEmployees = facility.totalEmployees || 50;
  const directLabor = facility.directLaborCount || Math.round(totalEmployees * 0.7);
  const indirectLabor = facility.indirectLaborCount || totalEmployees - directLabor;
  
  // Average wages
  const directWage = 25; // $25/hour
  const indirectWage = 35; // $35/hour
  
  const hoursPerMonth = 160; // 40 hours/week × 4 weeks
  
  return (directLabor * directWage + indirectLabor * indirectWage) * hoursPerMonth;
}

/**
 * Calculate monthly energy cost
 */
function calculateEnergyCost(
  facility: InstanceType<typeof ManufacturingFacility>,
  operatingHours: number
): number {
  const powerConsumption = facility.powerConsumption || 10000; // kWh/month
  const electricityRate = 0.12; // $0.12/kWh
  
  return powerConsumption * electricityRate;
}

/**
 * Calculate monthly maintenance cost
 */
function calculateMaintenanceCost(facility: InstanceType<typeof ManufacturingFacility>): number {
  const capitalInvested = facility.capitalInvested || 1000000;
  
  // Maintenance typically 2-4% of capital per year
  const annualMaintenance = capitalInvested * 0.03;
  
  return annualMaintenance / 12;
}

export default manufacturingProcessor;
