/**
 * @file src/lib/db/models/QualityMetric.ts
 * @description QualityMetric Mongoose schema for Six Sigma quality control
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * QualityMetric model for tracking Six Sigma quality control metrics.
 * Manages defect tracking (PPM, DPMO), sigma levels, control charts (SPC),
 * cost of quality (COQ) breakdown, root cause analysis, and corrective actions.
 * Supports ISO 9001 compliance and continuous improvement initiatives.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
 * - metricId: Unique metric identifier (e.g., "QM-2024-001")
 * - facility: Reference to ManufacturingFacility (optional)
 * - productionLine: Reference to ProductionLine (optional)
 * - product: Product/SKU being measured
 * - measurementDate: Date metric recorded
 * - measurementPeriod: Period (Daily, Weekly, Monthly, Quarterly, Annual)
 * 
 * Defect Metrics:
 * - unitsProduced: Total units produced
 * - unitsInspected: Units inspected (sample or 100%)
 * - defectsFound: Total defects found
 * - defectiveUnits: Units with defects
 * - opportunities: Defect opportunities per unit
 * - totalOpportunities: Total opportunities (units × opportunities)
 * - defectRate: Defects per million opportunities (DPMO)
 * - ppm: Parts per million defective
 * - firstPassYield: Percentage passing first time (%)
 * - scrapCount: Units scrapped
 * - reworkCount: Units requiring rework
 * 
 * Six Sigma Metrics:
 * - sigmaLevel: Current sigma level (1-6)
 * - dpmo: Defects per million opportunities
 * - processCapability: Cp (process capability index)
 * - processCapabilityIndex: Cpk (process capability with centering)
 * - targetSigmaLevel: Target sigma level goal
 * - sigmaImprovement: Sigma level change vs previous period
 * 
 * Control Chart Data (SPC):
 * - mean: Process mean (average)
 * - standardDeviation: Process std deviation
 * - upperControlLimit: UCL (mean + 3σ)
 * - lowerControlLimit: LCL (mean - 3σ)
 * - upperSpecLimit: USL (specification upper limit)
 * - lowerSpecLimit: LSL (specification lower limit)
 * - outOfControlPoints: Count of points outside control limits
 * - processInControl: Whether process is in statistical control
 * 
 * Defect Categories:
 * - defectTypes: Array of DefectType
 *   - category: Defect category name
 *   - count: Defect count
 *   - severity: Severity (Critical, Major, Minor)
 *   - percentage: Percentage of total defects
 * 
 * Cost of Quality (COQ):
 * - preventionCost: Prevention activities cost
 * - appraisalCost: Inspection/testing cost
 * - internalFailureCost: Scrap/rework cost (before shipment)
 * - externalFailureCost: Warranty/returns cost (after shipment)
 * - totalCOQ: Total cost of quality
 * - coqPercentRevenue: COQ as % of revenue
 * - coqPerUnit: COQ per unit produced
 * 
 * Root Cause Analysis:
 * - rootCauses: Array of RootCause
 *   - cause: Root cause description
 *   - category: Category (Man, Machine, Material, Method, Measurement, Environment)
 *   - frequency: Occurrence frequency
 *   - impact: Impact severity (1-10)
 * - paretoAnalysis: Pareto chart data (80/20 rule)
 * - fishboneCompleted: Whether fishbone diagram completed
 * 
 * Corrective Actions:
 * - correctiveActions: Array of CorrectiveAction
 *   - actionId: Unique action ID
 *   - description: Action description
 *   - assignedTo: Employee assigned (reference)
 *   - dueDate: Target completion date
 *   - status: Status (Open, InProgress, Completed, Cancelled)
 *   - completedDate: Actual completion date
 *   - effectiveness: Effectiveness rating (1-10)
 * 
 * Trend Analysis:
 * - trend: Trend direction (Improving, Stable, Degrading)
 * - trendPercentage: Trend change percentage
 * - movingAverage: 3-period moving average
 * - comparedToPrevious: Change vs previous period (%)
 * - comparedToBaseline: Change vs baseline (%)
 * 
 * ISO Compliance:
 * - isoCompliant: Whether meets ISO 9001 requirements
 * - auditTrailComplete: Whether audit trail documented
 * - nonConformances: Count of non-conformances
 * - correctiveActionsRequired: Count of CARs needed
 * 
 * USAGE:
 * ```typescript
 * import QualityMetric from '@/lib/db/models/QualityMetric';
 * 
 * // Record quality metric
 * const metric = await QualityMetric.create({
 *   company: companyId,
 *   metricId: "QM-2024-001",
 *   facility: facilityId,
 *   product: "Widget-A",
 *   unitsProduced: 10000,
 *   unitsInspected: 1000,
 *   defectsFound: 23,
 *   opportunities: 5,
 *   measurementPeriod: 'Daily'
 * });
 * 
 * // Find metrics below 4-sigma
 * const lowPerformers = await QualityMetric.find({
 *   company: companyId,
 *   sigmaLevel: { $lt: 4 }
 * }).sort({ sigmaLevel: 1 });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Six Sigma levels:
 *   - 6σ: 3.4 DPMO (world-class, 99.99966% good)
 *   - 5σ: 233 DPMO (excellent, 99.977% good)
 *   - 4σ: 6,210 DPMO (good, 99.379% good)
 *   - 3σ: 66,807 DPMO (average, 93.32% good)
 *   - 2σ: 308,537 DPMO (poor, 69.15% good)
 *   - 1σ: 690,000 DPMO (very poor, 31% good)
 * - DPMO formula: (Defects / Total Opportunities) × 1,000,000
 * - PPM = (Defective Units / Units Produced) × 1,000,000
 * - First Pass Yield = (Units Accepted / Units Produced) × 100
 * - Cp = (USL - LSL) / (6 × σ) - Process spread vs spec width
 * - Cpk = min[(USL - μ)/(3σ), (μ - LSL)/(3σ)] - Process capability with centering
 * - Control limits: UCL/LCL = μ ± 3σ (99.73% containment)
 * - Cost of Quality: 5-25% of revenue (world-class: <10%)
 * - Pareto principle: 80% of defects from 20% of causes
 * - 5 Whys: Root cause analysis technique (ask why 5 times)
 * - Fishbone (Ishikawa): 6M categories (Man, Machine, Material, Method, Measurement, Environment)
 * - ISO 9001: Quality management system standard
 * - Target sigma: 4σ+ acceptable, 5σ+ excellent, 6σ world-class
 * - Industry averages: Manufacturing 3-4σ, Healthcare 5-6σ, Aviation 6σ+
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Measurement period
 */
export type MeasurementPeriod =
  | 'Daily'
  | 'Weekly'
  | 'Monthly'
  | 'Quarterly'
  | 'Annual';

/**
 * Defect severity
 */
export type DefectSeverity =
  | 'Critical'
  | 'Major'
  | 'Minor';

/**
 * Trend direction
 */
export type TrendDirection =
  | 'Improving'
  | 'Stable'
  | 'Degrading';

/**
 * Corrective action status
 */
export type CorrectiveActionStatus =
  | 'Open'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled';

/**
 * Root cause category (6M)
 */
export type RootCauseCategory =
  | 'Man'           // People/operators
  | 'Machine'       // Equipment
  | 'Material'      // Raw materials
  | 'Method'        // Process/procedures
  | 'Measurement'   // Inspection/testing
  | 'Environment';  // Conditions

/**
 * Defect type interface
 */
export interface IDefectType {
  category: string;
  count: number;
  severity: DefectSeverity;
  percentage: number;
}

/**
 * Root cause interface
 */
export interface IRootCause {
  cause: string;
  category: RootCauseCategory;
  frequency: number;
  impact: number;
}

/**
 * Corrective action interface
 */
export interface ICorrectiveAction {
  actionId: string;
  description: string;
  assignedTo?: Types.ObjectId;
  dueDate: Date;
  status: CorrectiveActionStatus;
  completedDate?: Date;
  effectiveness?: number;
}

/**
 * QualityMetric document interface
 * 
 * @interface IQualityMetric
 * @extends {Document}
 */
export interface IQualityMetric extends Document {
  // Core
  company: Types.ObjectId;
  metricId: string;
  facility?: Types.ObjectId;
  productionLine?: Types.ObjectId;
  product: string;
  measurementDate: Date;
  measurementPeriod: MeasurementPeriod;

  // Defect Metrics
  unitsProduced: number;
  unitsInspected: number;
  defectsFound: number;
  defectiveUnits: number;
  opportunities: number;
  totalOpportunities: number;
  defectRate: number;
  ppm: number;
  firstPassYield: number;
  scrapCount: number;
  reworkCount: number;

  // Six Sigma Metrics
  sigmaLevel: number;
  dpmo: number;
  processCapability: number;
  processCapabilityIndex: number;
  targetSigmaLevel: number;
  sigmaImprovement: number;

  // Control Chart Data (SPC)
  mean: number;
  standardDeviation: number;
  upperControlLimit: number;
  lowerControlLimit: number;
  upperSpecLimit: number;
  lowerSpecLimit: number;
  outOfControlPoints: number;
  processInControl: boolean;

  // Defect Categories
  defectTypes: IDefectType[];

  // Cost of Quality (COQ)
  preventionCost: number;
  appraisalCost: number;
  internalFailureCost: number;
  externalFailureCost: number;
  totalCOQ: number;
  coqPercentRevenue: number;
  coqPerUnit: number;

  // Root Cause Analysis
  rootCauses: IRootCause[];
  paretoAnalysis: string;
  fishboneCompleted: boolean;

  // Corrective Actions
  correctiveActions: ICorrectiveAction[];

  // Trend Analysis
  trend: TrendDirection;
  trendPercentage: number;
  movingAverage: number;
  comparedToPrevious: number;
  comparedToBaseline: number;

  // ISO Compliance
  isoCompliant: boolean;
  auditTrailComplete: boolean;
  nonConformances: number;
  correctiveActionsRequired: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  qualityHealth: string;
  needsImprovement: boolean;
  cpkStatus: string;
  yieldHealth: string;
}

/**
 * DefectType schema
 */
const DefectTypeSchema = new Schema<IDefectType>(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    count: {
      type: Number,
      required: true,
      min: [0, 'Count cannot be negative'],
    },
    severity: {
      type: String,
      required: true,
      enum: {
        values: ['Critical', 'Major', 'Minor'],
        message: '{VALUE} is not a valid severity',
      },
    },
    percentage: {
      type: Number,
      required: true,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
    },
  },
  { _id: false }
);

/**
 * RootCause schema
 */
const RootCauseSchema = new Schema<IRootCause>(
  {
    cause: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: {
        values: ['Man', 'Machine', 'Material', 'Method', 'Measurement', 'Environment'],
        message: '{VALUE} is not a valid root cause category',
      },
    },
    frequency: {
      type: Number,
      required: true,
      min: [0, 'Frequency cannot be negative'],
    },
    impact: {
      type: Number,
      required: true,
      min: [1, 'Impact must be at least 1'],
      max: [10, 'Impact cannot exceed 10'],
    },
  },
  { _id: false }
);

/**
 * CorrectiveAction schema
 */
const CorrectiveActionSchema = new Schema<ICorrectiveAction>(
  {
    actionId: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Open', 'InProgress', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Open',
    },
    completedDate: {
      type: Date,
      default: null,
    },
    effectiveness: {
      type: Number,
      min: [1, 'Effectiveness must be at least 1'],
      max: [10, 'Effectiveness cannot exceed 10'],
      default: null,
    },
  },
  { _id: false }
);

/**
 * QualityMetric schema definition
 */
const QualityMetricSchema = new Schema<IQualityMetric>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    metricId: {
      type: String,
      required: [true, 'Metric ID is required'],
      trim: true,
      uppercase: true,
      minlength: [3, 'Metric ID must be at least 3 characters'],
      maxlength: [50, 'Metric ID cannot exceed 50 characters'],
      index: true,
    },
    facility: {
      type: Schema.Types.ObjectId,
      ref: 'ManufacturingFacility',
      default: null,
      index: true,
    },
    productionLine: {
      type: Schema.Types.ObjectId,
      ref: 'ProductionLine',
      default: null,
      index: true,
    },
    product: {
      type: String,
      required: [true, 'Product is required'],
      trim: true,
      maxlength: [200, 'Product cannot exceed 200 characters'],
      index: true,
    },
    measurementDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    measurementPeriod: {
      type: String,
      required: true,
      enum: {
        values: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'],
        message: '{VALUE} is not a valid measurement period',
      },
      default: 'Daily',
    },

    // Defect Metrics
    unitsProduced: {
      type: Number,
      required: [true, 'Units produced is required'],
      min: [1, 'Units produced must be at least 1'],
    },
    unitsInspected: {
      type: Number,
      required: [true, 'Units inspected is required'],
      min: [1, 'Units inspected must be at least 1'],
    },
    defectsFound: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Defects found cannot be negative'],
    },
    defectiveUnits: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Defective units cannot be negative'],
    },
    opportunities: {
      type: Number,
      required: [true, 'Opportunities per unit is required'],
      min: [1, 'Opportunities must be at least 1'],
    },
    totalOpportunities: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total opportunities cannot be negative'],
    },
    defectRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Defect rate cannot be negative'],
    },
    ppm: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'PPM cannot be negative'],
    },
    firstPassYield: {
      type: Number,
      required: true,
      default: 100,
      min: [0, 'First pass yield cannot be negative'],
      max: [100, 'First pass yield cannot exceed 100%'],
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

    // Six Sigma Metrics
    sigmaLevel: {
      type: Number,
      required: true,
      default: 3,
      min: [1, 'Sigma level must be at least 1'],
      max: [6, 'Sigma level cannot exceed 6'],
    },
    dpmo: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'DPMO cannot be negative'],
    },
    processCapability: {
      type: Number,
      required: true,
      default: 1,
      min: [0, 'Process capability cannot be negative'],
    },
    processCapabilityIndex: {
      type: Number,
      required: true,
      default: 1,
      min: [0, 'Process capability index cannot be negative'],
    },
    targetSigmaLevel: {
      type: Number,
      required: true,
      default: 4,
      min: [1, 'Target sigma level must be at least 1'],
      max: [6, 'Target sigma level cannot exceed 6'],
    },
    sigmaImprovement: {
      type: Number,
      required: true,
      default: 0,
    },

    // Control Chart Data (SPC)
    mean: {
      type: Number,
      required: true,
      default: 0,
    },
    standardDeviation: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Standard deviation cannot be negative'],
    },
    upperControlLimit: {
      type: Number,
      required: true,
      default: 0,
    },
    lowerControlLimit: {
      type: Number,
      required: true,
      default: 0,
    },
    upperSpecLimit: {
      type: Number,
      required: true,
      default: 0,
    },
    lowerSpecLimit: {
      type: Number,
      required: true,
      default: 0,
    },
    outOfControlPoints: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Out of control points cannot be negative'],
    },
    processInControl: {
      type: Boolean,
      required: true,
      default: true,
    },

    // Defect Categories
    defectTypes: {
      type: [DefectTypeSchema],
      default: [],
    },

    // Cost of Quality (COQ)
    preventionCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Prevention cost cannot be negative'],
    },
    appraisalCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Appraisal cost cannot be negative'],
    },
    internalFailureCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Internal failure cost cannot be negative'],
    },
    externalFailureCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'External failure cost cannot be negative'],
    },
    totalCOQ: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total COQ cannot be negative'],
    },
    coqPercentRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'COQ percent revenue cannot be negative'],
    },
    coqPerUnit: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'COQ per unit cannot be negative'],
    },

    // Root Cause Analysis
    rootCauses: {
      type: [RootCauseSchema],
      default: [],
    },
    paretoAnalysis: {
      type: String,
      trim: true,
      maxlength: [2000, 'Pareto analysis cannot exceed 2000 characters'],
      default: '',
    },
    fishboneCompleted: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Corrective Actions
    correctiveActions: {
      type: [CorrectiveActionSchema],
      default: [],
    },

    // Trend Analysis
    trend: {
      type: String,
      required: true,
      enum: {
        values: ['Improving', 'Stable', 'Degrading'],
        message: '{VALUE} is not a valid trend',
      },
      default: 'Stable',
    },
    trendPercentage: {
      type: Number,
      required: true,
      default: 0,
    },
    movingAverage: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Moving average cannot be negative'],
    },
    comparedToPrevious: {
      type: Number,
      required: true,
      default: 0,
    },
    comparedToBaseline: {
      type: Number,
      required: true,
      default: 0,
    },

    // ISO Compliance
    isoCompliant: {
      type: Boolean,
      required: true,
      default: true,
    },
    auditTrailComplete: {
      type: Boolean,
      required: true,
      default: false,
    },
    nonConformances: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Non-conformances cannot be negative'],
    },
    correctiveActionsRequired: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Corrective actions required cannot be negative'],
    },
  },
  {
    timestamps: true,
    collection: 'quality_metrics',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
QualityMetricSchema.index({ company: 1, metricId: 1 }, { unique: true });
QualityMetricSchema.index({ company: 1, measurementDate: -1 });
QualityMetricSchema.index({ facility: 1, measurementDate: -1 });
QualityMetricSchema.index({ sigmaLevel: 1 });

/**
 * Virtual field: qualityHealth
 */
QualityMetricSchema.virtual('qualityHealth').get(function (this: IQualityMetric): string {
  if (this.sigmaLevel >= 5) return 'Excellent';
  if (this.sigmaLevel >= 4) return 'Good';
  if (this.sigmaLevel >= 3) return 'Fair';
  return 'Poor';
});

/**
 * Virtual field: needsImprovement
 */
QualityMetricSchema.virtual('needsImprovement').get(function (this: IQualityMetric): boolean {
  return this.sigmaLevel < this.targetSigmaLevel;
});

/**
 * Virtual field: cpkStatus
 */
QualityMetricSchema.virtual('cpkStatus').get(function (this: IQualityMetric): string {
  if (this.processCapabilityIndex >= 1.67) return 'Excellent';
  if (this.processCapabilityIndex >= 1.33) return 'Good';
  if (this.processCapabilityIndex >= 1.0) return 'Acceptable';
  return 'Poor';
});

/**
 * Virtual field: yieldHealth
 */
QualityMetricSchema.virtual('yieldHealth').get(function (this: IQualityMetric): string {
  if (this.firstPassYield >= 99) return 'Excellent';
  if (this.firstPassYield >= 95) return 'Good';
  if (this.firstPassYield >= 90) return 'Fair';
  return 'Poor';
});

/**
 * Pre-save hook: Calculate Six Sigma metrics
 */
QualityMetricSchema.pre<IQualityMetric>('save', function (next) {
  // Calculate total opportunities
  this.totalOpportunities = this.unitsInspected * this.opportunities;

  // Calculate DPMO
  if (this.totalOpportunities > 0) {
    this.dpmo = (this.defectsFound / this.totalOpportunities) * 1000000;
    this.defectRate = this.dpmo;
  }

  // Calculate PPM
  if (this.unitsProduced > 0) {
    this.ppm = (this.defectiveUnits / this.unitsProduced) * 1000000;
  }

  // Calculate First Pass Yield
  const goodUnits = this.unitsProduced - this.defectiveUnits;
  if (this.unitsProduced > 0) {
    this.firstPassYield = (goodUnits / this.unitsProduced) * 100;
  }

  // Calculate Sigma Level from DPMO
  if (this.dpmo <= 3.4) {
    this.sigmaLevel = 6;
  } else if (this.dpmo <= 233) {
    this.sigmaLevel = 5;
  } else if (this.dpmo <= 6210) {
    this.sigmaLevel = 4;
  } else if (this.dpmo <= 66807) {
    this.sigmaLevel = 3;
  } else if (this.dpmo <= 308537) {
    this.sigmaLevel = 2;
  } else {
    this.sigmaLevel = 1;
  }

  // Calculate control limits
  this.upperControlLimit = this.mean + 3 * this.standardDeviation;
  this.lowerControlLimit = this.mean - 3 * this.standardDeviation;

  // Calculate Cp (process capability)
  if (this.standardDeviation > 0) {
    this.processCapability = (this.upperSpecLimit - this.lowerSpecLimit) / (6 * this.standardDeviation);
  }

  // Calculate Cpk (process capability index with centering)
  if (this.standardDeviation > 0) {
    const cpkUpper = (this.upperSpecLimit - this.mean) / (3 * this.standardDeviation);
    const cpkLower = (this.mean - this.lowerSpecLimit) / (3 * this.standardDeviation);
    this.processCapabilityIndex = Math.min(cpkUpper, cpkLower);
  }

  // Check process control
  this.processInControl = this.outOfControlPoints === 0;

  // Calculate total COQ
  this.totalCOQ =
    this.preventionCost +
    this.appraisalCost +
    this.internalFailureCost +
    this.externalFailureCost;

  // Calculate COQ per unit
  if (this.unitsProduced > 0) {
    this.coqPerUnit = this.totalCOQ / this.unitsProduced;
  }

  // Calculate defect type percentages
  if (this.defectTypes.length > 0) {
    const totalDefects = this.defectTypes.reduce((sum, dt) => sum + dt.count, 0);
    if (totalDefects > 0) {
      this.defectTypes.forEach((dt) => {
        dt.percentage = (dt.count / totalDefects) * 100;
      });
    }
  }

  next();
});

/**
 * QualityMetric model
 * 
 * @example
 * ```typescript
 * import QualityMetric from '@/lib/db/models/QualityMetric';
 * 
 * // Record quality metric
 * const metric = await QualityMetric.create({
 *   company: companyId,
 *   metricId: "QM-2024-001",
 *   product: "Widget-A",
 *   unitsProduced: 10000,
 *   unitsInspected: 1000,
 *   defectsFound: 6,
 *   defectiveUnits: 5,
 *   opportunities: 5,
 *   measurementPeriod: 'Daily'
 * });
 * ```
 */
const QualityMetric: Model<IQualityMetric> =
  mongoose.models.QualityMetric ||
  mongoose.model<IQualityMetric>('QualityMetric', QualityMetricSchema);

export default QualityMetric;
