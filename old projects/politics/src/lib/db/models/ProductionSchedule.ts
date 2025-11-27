/**
 * @file src/lib/db/models/ProductionSchedule.ts
 * @description ProductionSchedule Mongoose schema for MPS/MRP production planning
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * ProductionSchedule model for Master Production Schedule (MPS) and Material Requirements
 * Planning (MRP) management. Tracks planned production quantities, resource requirements,
 * capacity planning, lead time offsetting, lot sizing, and planned vs actual variance.
 * Integrates with ManufacturingFacility, ProductionLine, and Inventory models.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
 * - scheduleId: Unique schedule identifier (e.g., "SCH-2024-001")
 * - facility: Reference to ManufacturingFacility
 * - productionLine: Reference to ProductionLine (optional)
 * - scheduleType: Type (MPS, MRP, DailySchedule, WeeklyPlan)
 * - status: Schedule status (Draft, Published, Active, Completed, Cancelled)
 * - priority: Schedule priority (Low, Medium, High, Urgent)
 * 
 * Planning Period:
 * - planningHorizon: Horizon (Weekly, Monthly, Quarterly, Annual)
 * - startDate: Schedule start date
 * - endDate: Schedule end date
 * - periodWeeks: Number of weeks in period
 * 
 * Product & Quantity:
 * - product: Product/SKU to produce
 * - productDescription: Product description
 * - plannedQuantity: Quantity planned for production
 * - actualQuantity: Quantity actually produced
 * - varianceQuantity: Difference (actual - planned)
 * - variancePercentage: Variance as percentage
 * - uom: Unit of measure
 * 
 * Demand Management:
 * - demandSource: Demand source (Forecast, CustomerOrder, SafetyStock, Replenishment)
 * - forecastedDemand: Forecasted demand quantity
 * - customerOrders: Actual customer order quantity
 * - safetyStockTarget: Safety stock target quantity
 * - totalDemand: Total demand (forecast + orders + safety)
 * 
 * MRP Calculations:
 * - grossRequirements: Gross requirements from demand
 * - scheduledReceipts: Incoming scheduled receipts
 * - projectedOnHand: Projected inventory on hand
 * - netRequirements: Net requirements (gross - on hand - receipts)
 * - plannedOrderReleases: Planned order quantities
 * - plannedOrderReceipts: Planned order receipt dates
 * 
 * Lead Time Management:
 * - leadTimeDays: Manufacturing lead time (days)
 * - procurementLeadTime: Material procurement lead time
 * - safetyLeadTime: Safety/buffer lead time
 * - totalLeadTime: Total lead time (mfg + procurement + safety)
 * - releaseDate: Order release date (offsetted by lead time)
 * - dueDate: Required completion date
 * 
 * Lot Sizing:
 * - lotSizingMethod: Method (EOQ, POQ, LFL, FOQ, MinMax)
 * - lotSize: Calculated lot size
 * - minimumLotSize: Minimum production quantity
 * - maximumLotSize: Maximum production quantity
 * - lotSizeMultiple: Lot size multiple (must be divisible)
 * 
 * Capacity Planning:
 * - requiredCapacity: Required production capacity (units/hr)
 * - availableCapacity: Available facility capacity
 * - capacityUtilization: Capacity usage percentage
 * - bottleneckIdentified: Whether bottleneck exists
 * - bottleneckResource: Bottleneck resource name
 * - overCapacity: Whether over capacity
 * 
 * Resource Requirements:
 * - laborHoursRequired: Total labor hours needed
 * - machineHoursRequired: Machine/equipment hours needed
 * - materialCost: Material cost estimate
 * - laborCost: Labor cost estimate
 * - overheadCost: Overhead cost estimate
 * - totalCost: Total production cost estimate
 * 
 * Material Requirements:
 * - materials: Array of MaterialRequirement
 *   - sku: Material SKU
 *   - description: Material description
 *   - quantityPerUnit: Quantity needed per product unit
 *   - totalRequired: Total quantity required
 *   - onHand: Current inventory on hand
 *   - shortfall: Shortfall quantity (if any)
 *   - procurementNeeded: Whether procurement required
 * 
 * Execution Tracking:
 * - actualStartDate: Actual production start
 * - actualEndDate: Actual production end
 * - completionPercentage: Percentage complete
 * - daysAheadBehind: Days ahead/behind schedule
 * - onSchedule: Whether on schedule
 * - issuesEncountered: Production issues count
 * - downtimeHours: Unplanned downtime hours
 * 
 * Dependencies:
 * - predecessorSchedules: Array of predecessor schedule IDs
 * - successorSchedules: Array of successor schedule IDs
 * - criticalPath: Whether on critical path
 * - slack: Schedule slack/float (days)
 * 
 * USAGE:
 * ```typescript
 * import ProductionSchedule from '@/lib/db/models/ProductionSchedule';
 * 
 * // Create MPS entry
 * const schedule = await ProductionSchedule.create({
 *   company: companyId,
 *   scheduleId: "SCH-2024-001",
 *   facility: facilityId,
 *   scheduleType: 'MPS',
 *   product: "Widget-A",
 *   plannedQuantity: 10000,
 *   startDate: new Date('2024-02-01'),
 *   endDate: new Date('2024-02-28'),
 *   leadTimeDays: 14,
 *   lotSizingMethod: 'EOQ'
 * });
 * 
 * // Find bottlenecks
 * const bottlenecks = await ProductionSchedule.find({
 *   company: companyId,
 *   bottleneckIdentified: true,
 *   status: 'Active'
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - MPS (Master Production Schedule): What to produce, when, how much
 * - MRP (Material Requirements Planning): What materials needed, when to order
 * - Lead time offsetting: Order release date = Due date - Lead time
 * - Lot sizing methods:
 *   - EOQ (Economic Order Quantity): Minimize ordering + holding costs
 *   - POQ (Period Order Quantity): EOQ converted to time periods
 *   - LFL (Lot-for-Lot): Order exactly what's needed (JIT)
 *   - FOQ (Fixed Order Quantity): Fixed lot size
 *   - MinMax: Order when below min, order to max level
 * - Net requirements = Gross requirements - On hand - Scheduled receipts
 * - Capacity planning: Available capacity ≥ Required capacity (else bottleneck)
 * - Critical path: Longest sequence of dependent activities
 * - Slack/Float: Time activity can be delayed without delaying project
 * - Safety stock: Buffer inventory for demand/supply variability
 * - Safety lead time: Extra time buffer for lead time variability
 * - BOM (Bill of Materials): Required materials per unit
 * - Planning horizon: Time frame for planning (typically 3-12 months)
 * - Rolling horizon: Plan updated periodically (weekly/monthly)
 * - Frozen zone: Near-term period not changed (stability)
 * - Demand time fence: Point beyond which changes allowed
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Schedule type
 */
export type ScheduleType =
  | 'MPS'            // Master Production Schedule
  | 'MRP'            // Material Requirements Planning
  | 'DailySchedule'  // Daily production schedule
  | 'WeeklyPlan';    // Weekly production plan

/**
 * Schedule status
 */
export type ScheduleStatus =
  | 'Draft'
  | 'Published'
  | 'Active'
  | 'Completed'
  | 'Cancelled';

/**
 * Priority level
 */
export type PriorityLevel =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Urgent';

/**
 * Planning horizon
 */
export type PlanningHorizon =
  | 'Weekly'
  | 'Monthly'
  | 'Quarterly'
  | 'Annual';

/**
 * Demand source
 */
export type DemandSource =
  | 'Forecast'
  | 'CustomerOrder'
  | 'SafetyStock'
  | 'Replenishment';

/**
 * Lot sizing method
 */
export type LotSizingMethod =
  | 'EOQ'      // Economic Order Quantity
  | 'POQ'      // Period Order Quantity
  | 'LFL'      // Lot-for-Lot
  | 'FOQ'      // Fixed Order Quantity
  | 'MinMax';  // Min-Max ordering

/**
 * Material requirement interface
 */
export interface IMaterialRequirement {
  sku: string;
  description: string;
  quantityPerUnit: number;
  totalRequired: number;
  onHand: number;
  shortfall: number;
  procurementNeeded: boolean;
}

/**
 * ProductionSchedule document interface
 * 
 * @interface IProductionSchedule
 * @extends {Document}
 */
export interface IProductionSchedule extends Document {
  // Core
  company: Types.ObjectId;
  scheduleId: string;
  facility: Types.ObjectId;
  productionLine?: Types.ObjectId;
  scheduleType: ScheduleType;
  status: ScheduleStatus;
  priority: PriorityLevel;

  // Planning Period
  planningHorizon: PlanningHorizon;
  startDate: Date;
  endDate: Date;
  periodWeeks: number;

  // Product & Quantity
  product: string;
  productDescription: string;
  plannedQuantity: number;
  actualQuantity: number;
  varianceQuantity: number;
  variancePercentage: number;
  uom: string;

  // Demand Management
  demandSource: DemandSource;
  forecastedDemand: number;
  customerOrders: number;
  safetyStockTarget: number;
  totalDemand: number;

  // MRP Calculations
  grossRequirements: number;
  scheduledReceipts: number;
  projectedOnHand: number;
  netRequirements: number;
  plannedOrderReleases: number;
  plannedOrderReceipts: Date[];

  // Lead Time Management
  leadTimeDays: number;
  procurementLeadTime: number;
  safetyLeadTime: number;
  totalLeadTime: number;
  releaseDate: Date;
  dueDate: Date;

  // Lot Sizing
  lotSizingMethod: LotSizingMethod;
  lotSize: number;
  minimumLotSize: number;
  maximumLotSize: number;
  lotSizeMultiple: number;

  // Capacity Planning
  requiredCapacity: number;
  availableCapacity: number;
  capacityUtilization: number;
  bottleneckIdentified: boolean;
  bottleneckResource?: string;
  overCapacity: boolean;

  // Resource Requirements
  laborHoursRequired: number;
  machineHoursRequired: number;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;

  // Material Requirements
  materials: IMaterialRequirement[];

  // Execution Tracking
  actualStartDate?: Date;
  actualEndDate?: Date;
  completionPercentage: number;
  daysAheadBehind: number;
  onSchedule: boolean;
  issuesEncountered: number;
  downtimeHours: number;

  // Dependencies
  predecessorSchedules: string[];
  successorSchedules: string[];
  criticalPath: boolean;
  slack: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  isActive: boolean;
  isOverdue: boolean;
  daysRemaining: number;
  scheduleHealth: string;
  materialShortages: boolean;
}

/**
 * MaterialRequirement schema
 */
const MaterialRequirementSchema = new Schema<IMaterialRequirement>(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    quantityPerUnit: {
      type: Number,
      required: true,
      min: [0, 'Quantity per unit cannot be negative'],
    },
    totalRequired: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total required cannot be negative'],
    },
    onHand: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'On hand cannot be negative'],
    },
    shortfall: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Shortfall cannot be negative'],
    },
    procurementNeeded: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { _id: false }
);

/**
 * ProductionSchedule schema definition
 */
const ProductionScheduleSchema = new Schema<IProductionSchedule>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    scheduleId: {
      type: String,
      required: [true, 'Schedule ID is required'],
      trim: true,
      uppercase: true,
      minlength: [3, 'Schedule ID must be at least 3 characters'],
      maxlength: [50, 'Schedule ID cannot exceed 50 characters'],
      index: true,
    },
    facility: {
      type: Schema.Types.ObjectId,
      ref: 'ManufacturingFacility',
      required: [true, 'Facility reference is required'],
      index: true,
    },
    productionLine: {
      type: Schema.Types.ObjectId,
      ref: 'ProductionLine',
      default: null,
      index: true,
    },
    scheduleType: {
      type: String,
      required: true,
      enum: {
        values: ['MPS', 'MRP', 'DailySchedule', 'WeeklyPlan'],
        message: '{VALUE} is not a valid schedule type',
      },
      default: 'MPS',
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Draft', 'Published', 'Active', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Draft',
      index: true,
    },
    priority: {
      type: String,
      required: true,
      enum: {
        values: ['Low', 'Medium', 'High', 'Urgent'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'Medium',
      index: true,
    },

    // Planning Period
    planningHorizon: {
      type: String,
      required: true,
      enum: {
        values: ['Weekly', 'Monthly', 'Quarterly', 'Annual'],
        message: '{VALUE} is not a valid planning horizon',
      },
      default: 'Monthly',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
    },
    periodWeeks: {
      type: Number,
      required: true,
      default: 4,
      min: [1, 'Period weeks must be at least 1'],
      max: [52, 'Period weeks cannot exceed 52'],
    },

    // Product & Quantity
    product: {
      type: String,
      required: [true, 'Product is required'],
      trim: true,
      maxlength: [200, 'Product cannot exceed 200 characters'],
      index: true,
    },
    productDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Product description cannot exceed 500 characters'],
      default: '',
    },
    plannedQuantity: {
      type: Number,
      required: [true, 'Planned quantity is required'],
      min: [1, 'Planned quantity must be at least 1'],
    },
    actualQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Actual quantity cannot be negative'],
    },
    varianceQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    variancePercentage: {
      type: Number,
      required: true,
      default: 0,
    },
    uom: {
      type: String,
      required: true,
      trim: true,
      maxlength: [20, 'UOM cannot exceed 20 characters'],
      default: 'units',
    },

    // Demand Management
    demandSource: {
      type: String,
      required: true,
      enum: {
        values: ['Forecast', 'CustomerOrder', 'SafetyStock', 'Replenishment'],
        message: '{VALUE} is not a valid demand source',
      },
      default: 'Forecast',
    },
    forecastedDemand: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Forecasted demand cannot be negative'],
    },
    customerOrders: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Customer orders cannot be negative'],
    },
    safetyStockTarget: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Safety stock target cannot be negative'],
    },
    totalDemand: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total demand cannot be negative'],
    },

    // MRP Calculations
    grossRequirements: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Gross requirements cannot be negative'],
    },
    scheduledReceipts: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Scheduled receipts cannot be negative'],
    },
    projectedOnHand: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Projected on hand cannot be negative'],
    },
    netRequirements: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Net requirements cannot be negative'],
    },
    plannedOrderReleases: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Planned order releases cannot be negative'],
    },
    plannedOrderReceipts: {
      type: [Date],
      default: [],
    },

    // Lead Time Management
    leadTimeDays: {
      type: Number,
      required: true,
      default: 14,
      min: [1, 'Lead time days must be at least 1'],
      max: [365, 'Lead time days cannot exceed 365'],
    },
    procurementLeadTime: {
      type: Number,
      required: true,
      default: 7,
      min: [0, 'Procurement lead time cannot be negative'],
    },
    safetyLeadTime: {
      type: Number,
      required: true,
      default: 2,
      min: [0, 'Safety lead time cannot be negative'],
    },
    totalLeadTime: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total lead time cannot be negative'],
    },
    releaseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
      default: function (this: IProductionSchedule) {
        return this.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      },
    },

    // Lot Sizing
    lotSizingMethod: {
      type: String,
      required: true,
      enum: {
        values: ['EOQ', 'POQ', 'LFL', 'FOQ', 'MinMax'],
        message: '{VALUE} is not a valid lot sizing method',
      },
      default: 'LFL',
    },
    lotSize: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Lot size cannot be negative'],
    },
    minimumLotSize: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Minimum lot size must be at least 1'],
    },
    maximumLotSize: {
      type: Number,
      required: true,
      default: 100000,
      min: [1, 'Maximum lot size must be at least 1'],
    },
    lotSizeMultiple: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Lot size multiple must be at least 1'],
    },

    // Capacity Planning
    requiredCapacity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Required capacity cannot be negative'],
    },
    availableCapacity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Available capacity cannot be negative'],
    },
    capacityUtilization: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Capacity utilization cannot be negative'],
      max: [200, 'Capacity utilization cannot exceed 200%'],
    },
    bottleneckIdentified: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    bottleneckResource: {
      type: String,
      trim: true,
      maxlength: [200, 'Bottleneck resource cannot exceed 200 characters'],
      default: null,
    },
    overCapacity: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Resource Requirements
    laborHoursRequired: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Labor hours required cannot be negative'],
    },
    machineHoursRequired: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Machine hours required cannot be negative'],
    },
    materialCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Material cost cannot be negative'],
    },
    laborCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Labor cost cannot be negative'],
    },
    overheadCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Overhead cost cannot be negative'],
    },
    totalCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total cost cannot be negative'],
    },

    // Material Requirements
    materials: {
      type: [MaterialRequirementSchema],
      default: [],
    },

    // Execution Tracking
    actualStartDate: {
      type: Date,
      default: null,
    },
    actualEndDate: {
      type: Date,
      default: null,
    },
    completionPercentage: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Completion percentage cannot be negative'],
      max: [100, 'Completion percentage cannot exceed 100'],
    },
    daysAheadBehind: {
      type: Number,
      required: true,
      default: 0,
    },
    onSchedule: {
      type: Boolean,
      required: true,
      default: true,
    },
    issuesEncountered: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Issues encountered cannot be negative'],
    },
    downtimeHours: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Downtime hours cannot be negative'],
    },

    // Dependencies
    predecessorSchedules: {
      type: [String],
      default: [],
    },
    successorSchedules: {
      type: [String],
      default: [],
    },
    criticalPath: {
      type: Boolean,
      required: true,
      default: false,
    },
    slack: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Slack cannot be negative'],
    },
  },
  {
    timestamps: true,
    collection: 'production_schedules',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
ProductionScheduleSchema.index({ company: 1, scheduleId: 1 }, { unique: true });
ProductionScheduleSchema.index({ company: 1, status: 1 });
ProductionScheduleSchema.index({ facility: 1, startDate: 1 });
ProductionScheduleSchema.index({ startDate: 1, endDate: 1 });

/**
 * Virtual field: isActive
 */
ProductionScheduleSchema.virtual('isActive').get(function (this: IProductionSchedule): boolean {
  return this.status === 'Active';
});

/**
 * Virtual field: isOverdue
 */
ProductionScheduleSchema.virtual('isOverdue').get(function (this: IProductionSchedule): boolean {
  if (this.status === 'Completed' || this.status === 'Cancelled') {
    return false;
  }
  return new Date() > this.dueDate;
});

/**
 * Virtual field: daysRemaining
 */
ProductionScheduleSchema.virtual('daysRemaining').get(function (this: IProductionSchedule): number {
  const now = new Date();
  const diff = this.dueDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

/**
 * Virtual field: scheduleHealth
 */
ProductionScheduleSchema.virtual('scheduleHealth').get(function (this: IProductionSchedule): string {
  if (this.status === 'Completed') return 'Completed';
  if (this.isOverdue) return 'Overdue';
  if (this.bottleneckIdentified) return 'At Risk';
  if (this.completionPercentage >= 75) return 'On Track';
  return 'Planning';
});

/**
 * Virtual field: materialShortages
 */
ProductionScheduleSchema.virtual('materialShortages').get(function (this: IProductionSchedule): boolean {
  return this.materials.some((m) => m.shortfall > 0);
});

/**
 * Pre-save hook: Calculate MRP and capacity metrics
 */
ProductionScheduleSchema.pre<IProductionSchedule>('save', function (next) {
  // Calculate total demand
  this.totalDemand = this.forecastedDemand + this.customerOrders + this.safetyStockTarget;

  // Calculate net requirements
  this.netRequirements = Math.max(
    0,
    this.grossRequirements - this.projectedOnHand - this.scheduledReceipts
  );

  // Set planned order releases to net requirements
  if (this.netRequirements > 0) {
    this.plannedOrderReleases = this.netRequirements;
  }

  // Calculate total lead time
  this.totalLeadTime = this.leadTimeDays + this.procurementLeadTime + this.safetyLeadTime;

  // Calculate release date (due date - lead time)
  const releaseDateCalc = new Date(this.dueDate);
  releaseDateCalc.setDate(releaseDateCalc.getDate() - this.totalLeadTime);
  this.releaseDate = releaseDateCalc;

  // Calculate period weeks
  const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
  this.periodWeeks = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000));

  // Calculate variance
  this.varianceQuantity = this.actualQuantity - this.plannedQuantity;
  if (this.plannedQuantity > 0) {
    this.variancePercentage = (this.varianceQuantity / this.plannedQuantity) * 100;
  }

  // Calculate capacity utilization
  if (this.availableCapacity > 0) {
    this.capacityUtilization = (this.requiredCapacity / this.availableCapacity) * 100;
  }

  // Identify bottleneck
  this.bottleneckIdentified = this.capacityUtilization > 100;
  this.overCapacity = this.capacityUtilization > 100;

  // Calculate total cost
  this.totalCost = this.materialCost + this.laborCost + this.overheadCost;

  // Calculate material shortfalls
  this.materials.forEach((material) => {
    material.totalRequired = material.quantityPerUnit * this.plannedQuantity;
    material.shortfall = Math.max(0, material.totalRequired - material.onHand);
    material.procurementNeeded = material.shortfall > 0;
  });

  // Calculate completion percentage
  if (this.plannedQuantity > 0) {
    this.completionPercentage = (this.actualQuantity / this.plannedQuantity) * 100;
  }

  // Calculate days ahead/behind
  if (this.actualEndDate) {
    const diff = this.actualEndDate.getTime() - this.dueDate.getTime();
    this.daysAheadBehind = Math.ceil(diff / (1000 * 60 * 60 * 24));
    this.onSchedule = Math.abs(this.daysAheadBehind) <= 2;
  } else if (this.status === 'Active') {
    const now = new Date();
    const expectedProgress = ((now.getTime() - this.startDate.getTime()) / (this.dueDate.getTime() - this.startDate.getTime())) * 100;
    this.onSchedule = this.completionPercentage >= expectedProgress - 10;
  }

  next();
});

/**
 * ProductionSchedule model
 * 
 * @example
 * ```typescript
 * import ProductionSchedule from '@/lib/db/models/ProductionSchedule';
 * 
 * // Create MPS entry
 * const schedule = await ProductionSchedule.create({
 *   company: companyId,
 *   scheduleId: "SCH-2024-001",
 *   facility: facilityId,
 *   product: "Widget-A",
 *   plannedQuantity: 10000,
 *   startDate: new Date('2024-02-01'),
 *   endDate: new Date('2024-02-28')
 * });
 * ```
 */
const ProductionSchedule: Model<IProductionSchedule> =
  mongoose.models.ProductionSchedule ||
  mongoose.model<IProductionSchedule>('ProductionSchedule', ProductionScheduleSchema);

export default ProductionSchedule;
