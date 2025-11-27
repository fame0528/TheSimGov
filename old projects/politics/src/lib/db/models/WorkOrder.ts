/**
 * @file src/lib/db/models/WorkOrder.ts
 * @description WorkOrder Mongoose schema for production order tracking
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * WorkOrder model for tracking production orders from release to completion.
 * Manages work-in-progress (WIP), material consumption, labor hours, quality
 * inspection, batch/lot traceability, and production variance tracking.
 * Integrates with ProductionSchedule, ProductionLine, Inventory, and Employee models.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
 * - workOrderNumber: Unique work order identifier (e.g., "WO-2024-001")
 * - productionSchedule: Reference to ProductionSchedule
 * - facility: Reference to ManufacturingFacility
 * - productionLine: Reference to ProductionLine
 * - status: Order status (Released, InProgress, OnHold, Completed, Cancelled)
 * - priority: Order priority (Low, Medium, High, Urgent)
 * 
 * Product & Quantity:
 * - product: Product/SKU to produce
 * - productDescription: Product description
 * - orderQuantity: Quantity ordered
 * - completedQuantity: Quantity completed
 * - acceptedQuantity: Quantity accepted (passed QC)
 * - rejectedQuantity: Quantity rejected
 * - scrapQuantity: Quantity scrapped
 * - reworkQuantity: Quantity requiring rework
 * - wipQuantity: Work-in-progress quantity
 * - uom: Unit of measure
 * 
 * Dates & Timeline:
 * - releaseDate: Date order released to production
 * - scheduledStartDate: Scheduled start date
 * - scheduledEndDate: Scheduled completion date
 * - actualStartDate: Actual production start
 * - actualEndDate: Actual production end
 * - dueDate: Required completion date
 * - completionDate: Actual completion date
 * 
 * Production Assignment:
 * - assignedSupervisor: Supervisor employee reference
 * - assignedOperators: Array of operator employee references
 * - shift: Shift number (1, 2, 3)
 * - workCenter: Work center/department name
 * 
 * Material Consumption:
 * - materials: Array of MaterialConsumption
 *   - sku: Material SKU (reference to Inventory)
 *   - description: Material description
 *   - plannedQuantity: Planned consumption quantity
 *   - actualQuantity: Actual consumed quantity
 *   - variance: Difference (actual - planned)
 *   - unitCost: Cost per unit
 *   - totalCost: Extended cost
 *   - batchNumber: Batch/lot number used
 *   - issuedDate: Date material issued
 * 
 * Labor Tracking:
 * - laborHours: Array of LaborHour
 *   - employee: Employee reference
 *   - hoursWorked: Hours spent on work order
 *   - laborRate: Hourly labor rate
 *   - totalLaborCost: Extended labor cost
 *   - date: Date of work
 *   - shift: Shift number
 * - totalLaborHours: Sum of all labor hours
 * - totalLaborCost: Sum of all labor costs
 * 
 * Cost Tracking:
 * - materialCostPlanned: Planned material cost
 * - materialCostActual: Actual material cost
 * - laborCostPlanned: Planned labor cost
 * - laborCostActual: Actual labor cost
 * - overheadCostPlanned: Planned overhead cost
 * - overheadCostActual: Actual overhead cost
 * - totalCostPlanned: Total planned cost
 * - totalCostActual: Total actual cost
 * - costVariance: Difference (actual - planned)
 * - costVariancePercentage: Variance as percentage
 * 
 * Quality Control:
 * - qualityCheckRequired: Whether QC inspection required
 * - qualityCheckCompleted: Whether inspection completed
 * - qualityCheckDate: Date of inspection
 * - qualityInspector: Inspector employee reference
 * - defectsFound: Count of defects found
 * - defectTypes: Array of defect categories
 * - firstPassYield: Percentage passing first time
 * - dispositionNotes: Quality disposition notes
 * 
 * Batch/Lot Traceability:
 * - batchNumber: Production batch number
 * - lotNumber: Production lot number
 * - serialNumberStart: Starting serial number
 * - serialNumberEnd: Ending serial number
 * - traceabilityComplete: Whether traceability documented
 * - genealogyRecorded: Whether component genealogy recorded
 * 
 * Performance Metrics:
 * - cycleTime: Actual cycle time (hours)
 * - setupTime: Setup/changeover time (hours)
 * - runTime: Actual production run time (hours)
 * - downtimeTotal: Total downtime (hours)
 * - downtimeReasons: Array of downtime causes
 * - efficiency: Production efficiency percentage
 * - utilizationRate: Equipment utilization percentage
 * 
 * Progress Tracking:
 * - completionPercentage: Percentage complete (0-100)
 * - remainingQuantity: Quantity remaining to produce
 * - estimatedCompletionDate: Projected completion date
 * - daysAheadBehind: Days ahead/behind schedule
 * - onSchedule: Whether on schedule
 * 
 * Issues & Notes:
 * - issuesEncountered: Production issues count
 * - issueDescriptions: Array of issue descriptions
 * - productionNotes: General production notes
 * - specialInstructions: Special handling instructions
 * 
 * USAGE:
 * ```typescript
 * import WorkOrder from '@/lib/db/models/WorkOrder';
 * 
 * // Create work order
 * const workOrder = await WorkOrder.create({
 *   company: companyId,
 *   workOrderNumber: "WO-2024-001",
 *   productionSchedule: scheduleId,
 *   facility: facilityId,
 *   productionLine: lineId,
 *   product: "Widget-A",
 *   orderQuantity: 1000,
 *   dueDate: new Date(Date.now() + 7*24*60*60*1000),
 *   assignedSupervisor: supervisorId
 * });
 * 
 * // Find active work orders
 * const activeOrders = await WorkOrder.find({
 *   company: companyId,
 *   status: { $in: ['Released', 'InProgress'] }
 * }).sort({ priority: -1, dueDate: 1 });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Work order lifecycle: Released → InProgress → Completed
 * - Released: Order issued to production floor, ready to start
 * - InProgress: Active production, WIP exists
 * - OnHold: Temporarily stopped (material shortage, equipment down, etc.)
 * - Completed: Production finished, quality approved
 * - Cancelled: Order cancelled before completion
 * - WIP (Work-in-Progress): Units started but not yet completed
 * - First Pass Yield = (Accepted / Completed) × 100
 * - Efficiency = (Standard Hours / Actual Hours) × 100
 * - Utilization = (Run Time / Total Time) × 100
 * - Cycle time: Time from start to completion per unit
 * - Setup time: Changeover time before production run
 * - Run time: Actual production time (excluding downtime)
 * - Downtime: Unplanned stops (breakdowns, material shortages, etc.)
 * - Material variance: Common causes (scrap, rework, process inefficiency)
 * - Labor variance: Common causes (learning curve, efficiency, overtime)
 * - Batch/lot traceability: Required for regulated industries (medical, aerospace, food)
 * - Genealogy: Component-level traceability (which parts used in which assemblies)
 * - Serial number tracking: Unit-level traceability for high-value items
 * - Quality disposition: Accept, Reject, Rework, Use-As-Is (UAI)
 * - Cost variance: Actual vs standard/planned (material + labor + overhead)
 * - Standard costing: Predetermined costs vs actual (variance analysis)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Work order status
 */
export type WorkOrderStatus =
  | 'Released'
  | 'InProgress'
  | 'OnHold'
  | 'Completed'
  | 'Cancelled';

/**
 * Priority level
 */
export type WorkOrderPriority =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Urgent';

/**
 * Material consumption interface
 */
export interface IMaterialConsumption {
  sku: string;
  description: string;
  plannedQuantity: number;
  actualQuantity: number;
  variance: number;
  unitCost: number;
  totalCost: number;
  batchNumber?: string;
  issuedDate?: Date;
}

/**
 * Labor hour interface
 */
export interface ILaborHour {
  employee: Types.ObjectId;
  hoursWorked: number;
  laborRate: number;
  totalLaborCost: number;
  date: Date;
  shift: number;
}

/**
 * WorkOrder document interface
 * 
 * @interface IWorkOrder
 * @extends {Document}
 */
export interface IWorkOrder extends Document {
  // Core
  company: Types.ObjectId;
  workOrderNumber: string;
  productionSchedule?: Types.ObjectId;
  facility: Types.ObjectId;
  productionLine?: Types.ObjectId;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;

  // Product & Quantity
  product: string;
  productDescription: string;
  orderQuantity: number;
  completedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  scrapQuantity: number;
  reworkQuantity: number;
  wipQuantity: number;
  uom: string;

  // Dates & Timeline
  releaseDate: Date;
  scheduledStartDate: Date;
  scheduledEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  dueDate: Date;
  completionDate?: Date;

  // Production Assignment
  assignedSupervisor?: Types.ObjectId;
  assignedOperators: Types.ObjectId[];
  shift: number;
  workCenter: string;

  // Material Consumption
  materials: IMaterialConsumption[];

  // Labor Tracking
  laborHours: ILaborHour[];
  totalLaborHours: number;
  totalLaborCost: number;

  // Cost Tracking
  materialCostPlanned: number;
  materialCostActual: number;
  laborCostPlanned: number;
  laborCostActual: number;
  overheadCostPlanned: number;
  overheadCostActual: number;
  totalCostPlanned: number;
  totalCostActual: number;
  costVariance: number;
  costVariancePercentage: number;

  // Quality Control
  qualityCheckRequired: boolean;
  qualityCheckCompleted: boolean;
  qualityCheckDate?: Date;
  qualityInspector?: Types.ObjectId;
  defectsFound: number;
  defectTypes: string[];
  firstPassYield: number;
  dispositionNotes?: string;

  // Batch/Lot Traceability
  batchNumber?: string;
  lotNumber?: string;
  serialNumberStart?: string;
  serialNumberEnd?: string;
  traceabilityComplete: boolean;
  genealogyRecorded: boolean;

  // Performance Metrics
  cycleTime: number;
  setupTime: number;
  runTime: number;
  downtimeTotal: number;
  downtimeReasons: string[];
  efficiency: number;
  utilizationRate: number;

  // Progress Tracking
  completionPercentage: number;
  remainingQuantity: number;
  estimatedCompletionDate?: Date;
  daysAheadBehind: number;
  onSchedule: boolean;

  // Issues & Notes
  issuesEncountered: number;
  issueDescriptions: string[];
  productionNotes?: string;
  specialInstructions?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  isActive: boolean;
  isOverdue: boolean;
  daysRemaining: number;
  materialVariance: number;
  laborVariance: number;
  statusHealth: string;
}

/**
 * MaterialConsumption schema
 */
const MaterialConsumptionSchema = new Schema<IMaterialConsumption>(
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
    plannedQuantity: {
      type: Number,
      required: true,
      min: [0, 'Planned quantity cannot be negative'],
    },
    actualQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Actual quantity cannot be negative'],
    },
    variance: {
      type: Number,
      required: true,
      default: 0,
    },
    unitCost: {
      type: Number,
      required: true,
      min: [0, 'Unit cost cannot be negative'],
    },
    totalCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total cost cannot be negative'],
    },
    batchNumber: {
      type: String,
      trim: true,
      default: null,
    },
    issuedDate: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

/**
 * LaborHour schema
 */
const LaborHourSchema = new Schema<ILaborHour>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    hoursWorked: {
      type: Number,
      required: true,
      min: [0, 'Hours worked cannot be negative'],
      max: [24, 'Hours worked cannot exceed 24'],
    },
    laborRate: {
      type: Number,
      required: true,
      min: [0, 'Labor rate cannot be negative'],
    },
    totalLaborCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total labor cost cannot be negative'],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    shift: {
      type: Number,
      required: true,
      min: [1, 'Shift must be at least 1'],
      max: [3, 'Shift cannot exceed 3'],
    },
  },
  { _id: false }
);

/**
 * WorkOrder schema definition
 */
const WorkOrderSchema = new Schema<IWorkOrder>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    workOrderNumber: {
      type: String,
      required: [true, 'Work order number is required'],
      trim: true,
      uppercase: true,
      minlength: [3, 'Work order number must be at least 3 characters'],
      maxlength: [50, 'Work order number cannot exceed 50 characters'],
      index: true,
    },
    productionSchedule: {
      type: Schema.Types.ObjectId,
      ref: 'ProductionSchedule',
      default: null,
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
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Released', 'InProgress', 'OnHold', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Released',
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
    orderQuantity: {
      type: Number,
      required: [true, 'Order quantity is required'],
      min: [1, 'Order quantity must be at least 1'],
    },
    completedQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Completed quantity cannot be negative'],
    },
    acceptedQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Accepted quantity cannot be negative'],
    },
    rejectedQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Rejected quantity cannot be negative'],
    },
    scrapQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Scrap quantity cannot be negative'],
    },
    reworkQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Rework quantity cannot be negative'],
    },
    wipQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'WIP quantity cannot be negative'],
    },
    uom: {
      type: String,
      required: true,
      trim: true,
      maxlength: [20, 'UOM cannot exceed 20 characters'],
      default: 'units',
    },

    // Dates & Timeline
    releaseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    scheduledStartDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    scheduledEndDate: {
      type: Date,
      required: true,
      default: function (this: IWorkOrder) {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      },
    },
    actualStartDate: {
      type: Date,
      default: null,
    },
    actualEndDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      required: true,
      default: function (this: IWorkOrder) {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      },
      index: true,
    },
    completionDate: {
      type: Date,
      default: null,
    },

    // Production Assignment
    assignedSupervisor: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    assignedOperators: {
      type: [Schema.Types.ObjectId],
      ref: 'Employee',
      default: [],
    },
    shift: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Shift must be at least 1'],
      max: [3, 'Shift cannot exceed 3'],
    },
    workCenter: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Work center cannot exceed 100 characters'],
      default: 'Production',
    },

    // Material Consumption
    materials: {
      type: [MaterialConsumptionSchema],
      default: [],
    },

    // Labor Tracking
    laborHours: {
      type: [LaborHourSchema],
      default: [],
    },
    totalLaborHours: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total labor hours cannot be negative'],
    },
    totalLaborCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total labor cost cannot be negative'],
    },

    // Cost Tracking
    materialCostPlanned: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Material cost planned cannot be negative'],
    },
    materialCostActual: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Material cost actual cannot be negative'],
    },
    laborCostPlanned: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Labor cost planned cannot be negative'],
    },
    laborCostActual: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Labor cost actual cannot be negative'],
    },
    overheadCostPlanned: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Overhead cost planned cannot be negative'],
    },
    overheadCostActual: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Overhead cost actual cannot be negative'],
    },
    totalCostPlanned: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total cost planned cannot be negative'],
    },
    totalCostActual: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total cost actual cannot be negative'],
    },
    costVariance: {
      type: Number,
      required: true,
      default: 0,
    },
    costVariancePercentage: {
      type: Number,
      required: true,
      default: 0,
    },

    // Quality Control
    qualityCheckRequired: {
      type: Boolean,
      required: true,
      default: true,
    },
    qualityCheckCompleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    qualityCheckDate: {
      type: Date,
      default: null,
    },
    qualityInspector: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    defectsFound: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Defects found cannot be negative'],
    },
    defectTypes: {
      type: [String],
      default: [],
    },
    firstPassYield: {
      type: Number,
      required: true,
      default: 100,
      min: [0, 'First pass yield cannot be negative'],
      max: [100, 'First pass yield cannot exceed 100'],
    },
    dispositionNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Disposition notes cannot exceed 1000 characters'],
      default: null,
    },

    // Batch/Lot Traceability
    batchNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Batch number cannot exceed 50 characters'],
      default: null,
      index: true,
    },
    lotNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Lot number cannot exceed 50 characters'],
      default: null,
      index: true,
    },
    serialNumberStart: {
      type: String,
      trim: true,
      maxlength: [50, 'Serial number start cannot exceed 50 characters'],
      default: null,
    },
    serialNumberEnd: {
      type: String,
      trim: true,
      maxlength: [50, 'Serial number end cannot exceed 50 characters'],
      default: null,
    },
    traceabilityComplete: {
      type: Boolean,
      required: true,
      default: false,
    },
    genealogyRecorded: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Performance Metrics
    cycleTime: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Cycle time cannot be negative'],
    },
    setupTime: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Setup time cannot be negative'],
    },
    runTime: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Run time cannot be negative'],
    },
    downtimeTotal: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Downtime total cannot be negative'],
    },
    downtimeReasons: {
      type: [String],
      default: [],
    },
    efficiency: {
      type: Number,
      required: true,
      default: 100,
      min: [0, 'Efficiency cannot be negative'],
      max: [200, 'Efficiency cannot exceed 200'],
    },
    utilizationRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Utilization rate cannot be negative'],
      max: [100, 'Utilization rate cannot exceed 100'],
    },

    // Progress Tracking
    completionPercentage: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Completion percentage cannot be negative'],
      max: [100, 'Completion percentage cannot exceed 100'],
    },
    remainingQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Remaining quantity cannot be negative'],
    },
    estimatedCompletionDate: {
      type: Date,
      default: null,
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

    // Issues & Notes
    issuesEncountered: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Issues encountered cannot be negative'],
    },
    issueDescriptions: {
      type: [String],
      default: [],
    },
    productionNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Production notes cannot exceed 2000 characters'],
      default: null,
    },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: [2000, 'Special instructions cannot exceed 2000 characters'],
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'work_orders',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
WorkOrderSchema.index({ company: 1, workOrderNumber: 1 }, { unique: true });
WorkOrderSchema.index({ company: 1, status: 1 });
WorkOrderSchema.index({ facility: 1, status: 1 });
WorkOrderSchema.index({ productionLine: 1, status: 1 });

/**
 * Virtual field: isActive
 */
WorkOrderSchema.virtual('isActive').get(function (this: IWorkOrder): boolean {
  return this.status === 'InProgress' || this.status === 'Released';
});

/**
 * Virtual field: isOverdue
 */
WorkOrderSchema.virtual('isOverdue').get(function (this: IWorkOrder): boolean {
  if (this.status === 'Completed' || this.status === 'Cancelled') {
    return false;
  }
  return new Date() > this.dueDate;
});

/**
 * Virtual field: daysRemaining
 */
WorkOrderSchema.virtual('daysRemaining').get(function (this: IWorkOrder): number {
  const now = new Date();
  const diff = this.dueDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

/**
 * Virtual field: materialVariance
 */
WorkOrderSchema.virtual('materialVariance').get(function (this: IWorkOrder): number {
  return this.materialCostActual - this.materialCostPlanned;
});

/**
 * Virtual field: laborVariance
 */
WorkOrderSchema.virtual('laborVariance').get(function (this: IWorkOrder): number {
  return this.laborCostActual - this.laborCostPlanned;
});

/**
 * Virtual field: statusHealth
 */
WorkOrderSchema.virtual('statusHealth').get(function (this: IWorkOrder): string {
  if (this.status === 'Completed') return 'Completed';
  if (this.status === 'Cancelled') return 'Cancelled';
  if (this.status === 'OnHold') return 'On Hold';
  if (this.isOverdue) return 'Overdue';
  if (!this.onSchedule) return 'Behind Schedule';
  return 'On Track';
});

/**
 * Pre-save hook: Calculate costs, progress, and performance metrics
 */
WorkOrderSchema.pre<IWorkOrder>('save', function (next) {
  // Calculate material costs
  this.materialCostActual = this.materials.reduce((sum, m) => {
    m.totalCost = m.actualQuantity * m.unitCost;
    m.variance = m.actualQuantity - m.plannedQuantity;
    return sum + m.totalCost;
  }, 0);

  // Calculate labor costs
  this.totalLaborHours = this.laborHours.reduce((sum, lh) => sum + lh.hoursWorked, 0);
  this.totalLaborCost = this.laborHours.reduce((sum, lh) => {
    lh.totalLaborCost = lh.hoursWorked * lh.laborRate;
    return sum + lh.totalLaborCost;
  }, 0);
  this.laborCostActual = this.totalLaborCost;

  // Calculate total planned cost
  this.totalCostPlanned = this.materialCostPlanned + this.laborCostPlanned + this.overheadCostPlanned;

  // Calculate total actual cost
  this.totalCostActual = this.materialCostActual + this.laborCostActual + this.overheadCostActual;

  // Calculate cost variance
  this.costVariance = this.totalCostActual - this.totalCostPlanned;
  if (this.totalCostPlanned > 0) {
    this.costVariancePercentage = (this.costVariance / this.totalCostPlanned) * 100;
  }

  // Calculate WIP quantity
  this.wipQuantity = this.orderQuantity - this.completedQuantity;

  // Calculate remaining quantity
  this.remainingQuantity = this.orderQuantity - this.acceptedQuantity;

  // Calculate completion percentage
  if (this.orderQuantity > 0) {
    this.completionPercentage = (this.completedQuantity / this.orderQuantity) * 100;
  }

  // Calculate first pass yield
  if (this.completedQuantity > 0) {
    this.firstPassYield = (this.acceptedQuantity / this.completedQuantity) * 100;
  }

  // Calculate utilization rate
  const totalTime = this.setupTime + this.runTime + this.downtimeTotal;
  if (totalTime > 0) {
    this.utilizationRate = (this.runTime / totalTime) * 100;
  }

  // Calculate efficiency
  if (this.totalLaborHours > 0 && this.laborCostPlanned > 0) {
    const standardHours = this.laborCostPlanned / (this.totalLaborCost / this.totalLaborHours || 1);
    this.efficiency = (standardHours / this.totalLaborHours) * 100;
  }

  // Calculate days ahead/behind
  if (this.actualEndDate) {
    const diff = this.actualEndDate.getTime() - this.dueDate.getTime();
    this.daysAheadBehind = Math.ceil(diff / (1000 * 60 * 60 * 24));
    this.onSchedule = Math.abs(this.daysAheadBehind) <= 1;
  } else if (this.status === 'InProgress' && this.actualStartDate) {
    const now = new Date();
    const scheduledDuration = this.scheduledEndDate.getTime() - this.scheduledStartDate.getTime();
    const elapsedTime = now.getTime() - this.actualStartDate.getTime();
    const expectedProgress = (elapsedTime / scheduledDuration) * 100;
    this.onSchedule = this.completionPercentage >= expectedProgress - 10;
  }

  next();
});

/**
 * WorkOrder model
 * 
 * @example
 * ```typescript
 * import WorkOrder from '@/lib/db/models/WorkOrder';
 * 
 * // Create work order
 * const workOrder = await WorkOrder.create({
 *   company: companyId,
 *   workOrderNumber: "WO-2024-001",
 *   facility: facilityId,
 *   product: "Widget-A",
 *   orderQuantity: 1000,
 *   dueDate: new Date(Date.now() + 7*24*60*60*1000)
 * });
 * ```
 */
const WorkOrder: Model<IWorkOrder> =
  mongoose.models.WorkOrder ||
  mongoose.model<IWorkOrder>('WorkOrder', WorkOrderSchema);

export default WorkOrder;
