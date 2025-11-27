/**
 * @file src/lib/db/models/ProductionLine.ts
 * @description ProductionLine Mongoose schema for individual production lines within facilities
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * ProductionLine model representing individual production lines within manufacturing facilities.
 * Tracks line-specific performance, current production status, equipment health, cycle times,
 * and real-time production metrics. Supports flexible product assignment and changeover tracking.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
 * - facility: Reference to ManufacturingFacility (required, indexed)
 * - name: Line identifier (e.g., "Line A1", "Assembly Line 3")
 * - lineNumber: Numeric identifier within facility (1-100)
 * - lineType: Production type (Assembly, Machining, Packaging, Testing, Painting)
 * - status: Current state (Idle, Running, Changeover, Maintenance, Breakdown, Offline)
 * - active: Whether line is operational
 * 
 * Product & Batch:
 * - currentProduct: Product being manufactured (name/SKU)
 * - currentBatchId: Current batch/lot identifier
 * - batchSize: Target batch quantity
 * - batchProgress: Units completed in current batch
 * - batchStartTime: When current batch started
 * - batchEstimatedCompletion: Expected completion time
 * 
 * Performance:
 * - ratedSpeed: Designed production rate (units/hour)
 * - actualSpeed: Current production rate (units/hour)
 * - speedEfficiency: Actual / Rated speed (%)
 * - cycleTime: Time per unit (seconds)
 * - targetCycleTime: Design cycle time (seconds)
 * - throughput: Units produced today
 * - throughputTarget: Daily production target
 * 
 * OEE Components:
 * - availability: Uptime percentage (0-100)
 * - performance: Speed efficiency (0-100)
 * - quality: First-pass yield (0-100)
 * - oee: Overall Equipment Effectiveness (0-100)
 * - plannedDowntime: Scheduled maintenance (minutes/day)
 * - unplannedDowntime: Breakdowns/issues (minutes/day)
 * - lastDowntimeReason: Most recent downtime cause
 * 
 * Quality:
 * - unitsProduced: Total units produced (lifetime)
 * - unitsAccepted: Units passing quality (lifetime)
 * - unitsRejected: Units failing quality (lifetime)
 * - firstPassYield: Acceptance rate without rework (%)
 * - scrapCount: Units scrapped today
 * - reworkCount: Units requiring rework today
 * - defectTypes: Array of recent defect categories
 * 
 * Equipment:
 * - equipmentAge: Years since installation
 * - lastMaintenanceDate: Most recent PM date
 * - nextMaintenanceDate: Scheduled next PM date
 * - maintenanceHours: Total maintenance hours (lifetime)
 * - breakdownCount: Number of breakdowns (YTD)
 * - mtbf: Mean Time Between Failures (hours)
 * - mttr: Mean Time To Repair (hours)
 * - equipmentHealth: Overall health score (0-100)
 * - sensors: Array of IoT sensor data
 * 
 * Changeover:
 * - changeoverInProgress: Currently switching products
 * - lastChangeoverStart: When changeover began
 * - lastChangeoverDuration: How long changeover took (minutes)
 * - averageChangeoverTime: Historical average (minutes)
 * - targetChangeoverTime: Goal for SMED (minutes)
 * - changeoverCount: Number of changeovers (YTD)
 * 
 * Staffing:
 * - operatorsRequired: Operators needed to run line
 * - currentOperators: Operators currently assigned
 * - operatorSkillRequired: Minimum skill level (0-100)
 * - leadOperator: Employee reference (optional)
 * - shift: Current shift (1, 2, 3)
 * 
 * Resources:
 * - powerConsumption: kWh consumed today
 * - energyPerUnit: kWh per unit produced
 * - materialsConsumed: Material usage today
 * - wasteGenerated: Waste produced today (kg)
 * - toolingCost: Tooling/consumables cost today
 * 
 * USAGE:
 * ```typescript
 * import ProductionLine from '@/lib/db/models/ProductionLine';
 * 
 * // Create production line
 * const line = await ProductionLine.create({
 *   company: companyId,
 *   facility: facilityId,
 *   name: "Assembly Line A1",
 *   lineNumber: 1,
 *   lineType: 'Assembly',
 *   ratedSpeed: 100,
 *   actualSpeed: 85,
 *   operatorsRequired: 4,
 *   status: 'Running'
 * });
 * 
 * // Start batch production
 * await line.updateOne({
 *   status: 'Running',
 *   currentProduct: 'Model-X-500',
 *   currentBatchId: 'BATCH-2025-001',
 *   batchSize: 1000,
 *   batchProgress: 0,
 *   batchStartTime: new Date()
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - OEE calculation: (Availability × Performance × Quality) / 10000
 * - Target OEE: 85% world-class (90% availability × 95% performance × 99% quality)
 * - Availability = (Planned Production Time - Downtime) / Planned Production Time
 * - Performance = (Actual Speed / Rated Speed) × 100
 * - Quality = (Units Accepted / Units Produced) × 100
 * - MTBF (Mean Time Between Failures): Operating hours / Breakdown count
 * - MTTR (Mean Time To Repair): Total repair time / Breakdown count
 * - Changeover optimization (SMED): Target < 10 minutes for world-class
 * - First-pass yield: Units accepted without rework / Total units
 * - Speed efficiency: Actual speed / Rated speed (target 95%+)
 * - Cycle time: 3600 seconds / Rated speed (units/hour)
 * - Line status transitions: Idle → Running → (Changeover/Maintenance/Breakdown) → Running → Idle
 * - Batch tracking: Discrete manufacturing (unit count), Process manufacturing (batch weight/volume)
 * - Equipment health scoring: 100 - (age penalty + breakdown penalty + maintenance backlog penalty)
 * - Sensor data: Temperature, vibration, pressure, flow rate, power draw (real-time monitoring)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Line types
 */
export type LineType =
  | 'Assembly'      // Assembly operations
  | 'Machining'     // CNC, milling, turning
  | 'Packaging'     // Product packaging
  | 'Testing'       // Quality testing/inspection
  | 'Painting';     // Coating/finishing

/**
 * Line status
 */
export type LineStatus =
  | 'Idle'          // Not producing, waiting for work
  | 'Running'       // Active production
  | 'Changeover'    // Switching between products
  | 'Maintenance'   // Preventive/scheduled maintenance
  | 'Breakdown'     // Unplanned downtime, equipment failure
  | 'Offline';      // Permanently offline

/**
 * Sensor data interface
 */
export interface SensorData {
  name: string;           // Sensor identifier
  type: string;           // Temperature, Vibration, Pressure, etc.
  value: number;          // Current reading
  unit: string;           // °F, RPM, PSI, etc.
  timestamp: Date;        // Reading timestamp
  alertThreshold: number; // Alert level
  criticalThreshold: number; // Critical level
}

/**
 * ProductionLine document interface
 * 
 * @interface IProductionLine
 * @extends {Document}
 */
export interface IProductionLine extends Document {
  // Core
  company: Types.ObjectId;
  facility: Types.ObjectId;
  name: string;
  lineNumber: number;
  lineType: LineType;
  status: LineStatus;
  active: boolean;

  // Product & Batch
  currentProduct?: string;
  currentBatchId?: string;
  batchSize: number;
  batchProgress: number;
  batchStartTime?: Date;
  batchEstimatedCompletion?: Date;

  // Performance
  ratedSpeed: number;
  actualSpeed: number;
  speedEfficiency: number;
  cycleTime: number;
  targetCycleTime: number;
  throughput: number;
  throughputTarget: number;

  // OEE Components
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  plannedDowntime: number;
  unplannedDowntime: number;
  lastDowntimeReason?: string;

  // Quality
  unitsProduced: number;
  unitsAccepted: number;
  unitsRejected: number;
  firstPassYield: number;
  scrapCount: number;
  reworkCount: number;
  defectTypes: string[];

  // Equipment
  equipmentAge: number;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate: Date;
  maintenanceHours: number;
  breakdownCount: number;
  mtbf: number;
  mttr: number;
  equipmentHealth: number;
  sensors: SensorData[];

  // Changeover
  changeoverInProgress: boolean;
  lastChangeoverStart?: Date;
  lastChangeoverDuration: number;
  averageChangeoverTime: number;
  targetChangeoverTime: number;
  changeoverCount: number;

  // Staffing
  operatorsRequired: number;
  currentOperators: number;
  operatorSkillRequired: number;
  leadOperator?: Types.ObjectId;
  shift: number;

  // Resources
  powerConsumption: number;
  energyPerUnit: number;
  materialsConsumed: number;
  wasteGenerated: number;
  toolingCost: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  isRunning: boolean;
  batchCompletion: number;
  speedUtilization: string;
  qualityStatus: string;
  downtimeTotal: number;
  staffingAdequacy: string;
}

/**
 * ProductionLine schema definition
 */
const ProductionLineSchema = new Schema<IProductionLine>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    facility: {
      type: Schema.Types.ObjectId,
      ref: 'ManufacturingFacility',
      required: [true, 'Facility reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Line name is required'],
      trim: true,
      minlength: [2, 'Line name must be at least 2 characters'],
      maxlength: [50, 'Line name cannot exceed 50 characters'],
    },
    lineNumber: {
      type: Number,
      required: [true, 'Line number is required'],
      min: [1, 'Line number must be at least 1'],
      max: [100, 'Line number cannot exceed 100'],
    },
    lineType: {
      type: String,
      required: [true, 'Line type is required'],
      enum: {
        values: ['Assembly', 'Machining', 'Packaging', 'Testing', 'Painting'],
        message: '{VALUE} is not a valid line type',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Idle', 'Running', 'Changeover', 'Maintenance', 'Breakdown', 'Offline'],
        message: '{VALUE} is not a valid line status',
      },
      default: 'Idle',
      index: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },

    // Product & Batch
    currentProduct: {
      type: String,
      default: null,
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    currentBatchId: {
      type: String,
      default: null,
      trim: true,
      maxlength: [50, 'Batch ID cannot exceed 50 characters'],
    },
    batchSize: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Batch size cannot be negative'],
    },
    batchProgress: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Batch progress cannot be negative'],
    },
    batchStartTime: {
      type: Date,
      default: null,
    },
    batchEstimatedCompletion: {
      type: Date,
      default: null,
    },

    // Performance
    ratedSpeed: {
      type: Number,
      required: [true, 'Rated speed is required'],
      min: [1, 'Rated speed must be at least 1 unit/hour'],
      max: [100000, 'Rated speed cannot exceed 100,000 units/hour'],
    },
    actualSpeed: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Actual speed cannot be negative'],
    },
    speedEfficiency: {
      type: Number,
      required: true,
      default: 80,
      min: [0, 'Speed efficiency cannot be negative'],
      max: [100, 'Speed efficiency cannot exceed 100%'],
    },
    cycleTime: {
      type: Number,
      required: true,
      default: 60, // 60 seconds per unit
      min: [0.1, 'Cycle time must be at least 0.1 seconds'],
    },
    targetCycleTime: {
      type: Number,
      required: true,
      default: 60,
      min: [0.1, 'Target cycle time must be at least 0.1 seconds'],
    },
    throughput: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Throughput cannot be negative'],
    },
    throughputTarget: {
      type: Number,
      required: true,
      default: 1000,
      min: [1, 'Throughput target must be at least 1'],
    },

    // OEE Components
    availability: {
      type: Number,
      required: true,
      default: 85,
      min: [0, 'Availability cannot be negative'],
      max: [100, 'Availability cannot exceed 100%'],
    },
    performance: {
      type: Number,
      required: true,
      default: 80,
      min: [0, 'Performance cannot be negative'],
      max: [100, 'Performance cannot exceed 100%'],
    },
    quality: {
      type: Number,
      required: true,
      default: 95,
      min: [0, 'Quality cannot be negative'],
      max: [100, 'Quality cannot exceed 100%'],
    },
    oee: {
      type: Number,
      required: true,
      default: 64.6, // 85 * 80 * 95 / 10000
      min: [0, 'OEE cannot be negative'],
      max: [100, 'OEE cannot exceed 100%'],
    },
    plannedDowntime: {
      type: Number,
      required: true,
      default: 60, // 60 minutes/day
      min: [0, 'Planned downtime cannot be negative'],
    },
    unplannedDowntime: {
      type: Number,
      required: true,
      default: 30, // 30 minutes/day
      min: [0, 'Unplanned downtime cannot be negative'],
    },
    lastDowntimeReason: {
      type: String,
      default: null,
      trim: true,
      maxlength: [200, 'Downtime reason cannot exceed 200 characters'],
    },

    // Quality
    unitsProduced: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Units produced cannot be negative'],
    },
    unitsAccepted: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Units accepted cannot be negative'],
    },
    unitsRejected: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Units rejected cannot be negative'],
    },
    firstPassYield: {
      type: Number,
      required: true,
      default: 95,
      min: [0, 'First-pass yield cannot be negative'],
      max: [100, 'First-pass yield cannot exceed 100%'],
    },
    scrapCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Scrap count cannot be negative'],
    },
    reworkCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Rework count cannot be negative'],
    },
    defectTypes: {
      type: [String],
      default: [],
    },

    // Equipment
    equipmentAge: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Equipment age cannot be negative'],
      max: [50, 'Equipment age cannot exceed 50 years'],
    },
    lastMaintenanceDate: {
      type: Date,
      default: null,
    },
    nextMaintenanceDate: {
      type: Date,
      required: true,
      default: () => {
        const date = new Date();
        date.setMonth(date.getMonth() + 3); // 3 months default
        return date;
      },
    },
    maintenanceHours: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Maintenance hours cannot be negative'],
    },
    breakdownCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Breakdown count cannot be negative'],
    },
    mtbf: {
      type: Number,
      required: true,
      default: 500, // 500 hours MTBF
      min: [1, 'MTBF must be at least 1 hour'],
    },
    mttr: {
      type: Number,
      required: true,
      default: 2, // 2 hours MTTR
      min: [0.1, 'MTTR must be at least 0.1 hours'],
    },
    equipmentHealth: {
      type: Number,
      required: true,
      default: 85,
      min: [0, 'Equipment health cannot be negative'],
      max: [100, 'Equipment health cannot exceed 100'],
    },
    sensors: {
      type: [
        {
          name: { type: String, required: true },
          type: { type: String, required: true },
          value: { type: Number, required: true },
          unit: { type: String, required: true },
          timestamp: { type: Date, required: true, default: Date.now },
          alertThreshold: { type: Number, required: true },
          criticalThreshold: { type: Number, required: true },
        },
      ],
      default: [],
    },

    // Changeover
    changeoverInProgress: {
      type: Boolean,
      required: true,
      default: false,
    },
    lastChangeoverStart: {
      type: Date,
      default: null,
    },
    lastChangeoverDuration: {
      type: Number,
      required: true,
      default: 30, // 30 minutes
      min: [0, 'Changeover duration cannot be negative'],
    },
    averageChangeoverTime: {
      type: Number,
      required: true,
      default: 30,
      min: [0, 'Average changeover time cannot be negative'],
    },
    targetChangeoverTime: {
      type: Number,
      required: true,
      default: 10, // 10 minutes SMED target
      min: [1, 'Target changeover time must be at least 1 minute'],
    },
    changeoverCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Changeover count cannot be negative'],
    },

    // Staffing
    operatorsRequired: {
      type: Number,
      required: [true, 'Operators required is required'],
      min: [0, 'Operators required cannot be negative'],
      max: [50, 'Operators required cannot exceed 50'],
    },
    currentOperators: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Current operators cannot be negative'],
    },
    operatorSkillRequired: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Operator skill required cannot be negative'],
      max: [100, 'Operator skill required cannot exceed 100'],
    },
    leadOperator: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    shift: {
      type: Number,
      required: true,
      default: 1,
      enum: {
        values: [1, 2, 3],
        message: 'Shift must be 1, 2, or 3',
      },
    },

    // Resources
    powerConsumption: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Power consumption cannot be negative'],
    },
    energyPerUnit: {
      type: Number,
      required: true,
      default: 0.5, // 0.5 kWh per unit
      min: [0, 'Energy per unit cannot be negative'],
    },
    materialsConsumed: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Materials consumed cannot be negative'],
    },
    wasteGenerated: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Waste generated cannot be negative'],
    },
    toolingCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Tooling cost cannot be negative'],
    },
  },
  {
    timestamps: true,
    collection: 'productionlines',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
ProductionLineSchema.index({ company: 1, facility: 1 }); // Lines per facility
ProductionLineSchema.index({ facility: 1, status: 1 }); // Active lines
ProductionLineSchema.index({ company: 1, status: 1 }); // Company production status
ProductionLineSchema.index({ oee: -1 }); // Top performing lines

/**
 * Virtual field: isRunning
 */
ProductionLineSchema.virtual('isRunning').get(function (this: IProductionLine): boolean {
  return this.status === 'Running';
});

/**
 * Virtual field: batchCompletion
 */
ProductionLineSchema.virtual('batchCompletion').get(function (this: IProductionLine): number {
  if (this.batchSize === 0) return 0;
  return Math.min(100, (this.batchProgress / this.batchSize) * 100);
});

/**
 * Virtual field: speedUtilization
 */
ProductionLineSchema.virtual('speedUtilization').get(function (this: IProductionLine): string {
  if (this.speedEfficiency < 70) return 'Low';
  if (this.speedEfficiency < 85) return 'Fair';
  if (this.speedEfficiency < 95) return 'Good';
  return 'Excellent';
});

/**
 * Virtual field: qualityStatus
 */
ProductionLineSchema.virtual('qualityStatus').get(function (this: IProductionLine): string {
  if (this.quality < 85) return 'Critical';
  if (this.quality < 95) return 'Needs Improvement';
  if (this.quality < 99) return 'Good';
  return 'Excellent';
});

/**
 * Virtual field: downtimeTotal
 */
ProductionLineSchema.virtual('downtimeTotal').get(function (this: IProductionLine): number {
  return this.plannedDowntime + this.unplannedDowntime;
});

/**
 * Virtual field: staffingAdequacy
 */
ProductionLineSchema.virtual('staffingAdequacy').get(function (this: IProductionLine): string {
  if (this.currentOperators < this.operatorsRequired) return 'Understaffed';
  if (this.currentOperators === this.operatorsRequired) return 'Adequate';
  return 'Overstaffed';
});

/**
 * Pre-save hook: Calculate OEE and metrics
 */
ProductionLineSchema.pre<IProductionLine>('save', function (next) {
  // Calculate OEE
  this.oee = (this.availability * this.performance * this.quality) / 10000;

  // Calculate speed efficiency
  if (this.ratedSpeed > 0) {
    this.speedEfficiency = Math.min(100, (this.actualSpeed / this.ratedSpeed) * 100);
  }

  // Calculate first-pass yield
  if (this.unitsProduced > 0) {
    this.firstPassYield = (this.unitsAccepted / this.unitsProduced) * 100;
  }

  // Calculate cycle time from rated speed
  if (this.ratedSpeed > 0) {
    this.cycleTime = 3600 / this.ratedSpeed; // seconds per unit
  }

  next();
});

/**
 * ProductionLine model
 * 
 * @example
 * ```typescript
 * import ProductionLine from '@/lib/db/models/ProductionLine';
 * 
 * // Create production line
 * const line = await ProductionLine.create({
 *   company: companyId,
 *   facility: facilityId,
 *   name: "Machining Line M2",
 *   lineNumber: 2,
 *   lineType: 'Machining',
 *   ratedSpeed: 50,
 *   actualSpeed: 45,
 *   operatorsRequired: 2,
 *   status: 'Running'
 * });
 * 
 * // Find running lines
 * const activeLines = await ProductionLine.find({
 *   facility: facilityId,
 *   status: 'Running',
 *   active: true
 * }).populate('leadOperator');
 * ```
 */
const ProductionLine: Model<IProductionLine> =
  mongoose.models.ProductionLine ||
  mongoose.model<IProductionLine>('ProductionLine', ProductionLineSchema);

export default ProductionLine;
