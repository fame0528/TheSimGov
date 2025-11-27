/**
 * @file src/lib/db/models/GasField.ts
 * @description Gas field schema for Energy Industry - Natural gas extraction operations
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * Gas field model representing natural gas extraction sites with pressure management,
 * depletion tracking, processing facilities, and pipeline connections. Supports
 * conventional gas fields, tight gas formations, coalbed methane, and shale gas
 * with reservoir pressure dynamics and gas quality grading.
 * 
 * KEY FEATURES:
 * - Reservoir pressure management (critical for production rates)
 * - Gas quality grading (affects pricing: premium vs standard vs sour gas)
 * - Processing facility integration (removes impurities)
 * - Pipeline capacity constraints
 * - Pressure decline modeling (impacts extraction rates)
 * - Associated gas vs non-associated gas tracking
 * - Gas compression requirements
 * 
 * BUSINESS LOGIC:
 * - Production rate proportional to reservoir pressure
 * - Formula: production = maxProduction × (currentPressure / initialPressure)^0.5
 * - Pressure declines with extraction volume
 * - Depletion rate: 3-12% per year depending on field type
 * - Gas quality affects pricing: Premium (+15%), Standard (base), Sour (-25%)
 * - Processing costs: $0.50-$2.00 per MCF (thousand cubic feet)
 * - Revenue = (production × gasPrice × qualityMultiplier) - processingCosts
 * 
 * GAS QUALITY GRADES:
 * - Premium: Low impurities, pipeline-ready, minimal processing
 * - Standard: Normal quality, standard processing required
 * - Sour: High sulfur content (H2S), expensive processing, lower price
 * 
 * PRESSURE DYNAMICS:
 * - Initial pressure: 2000-8000 PSI depending on field depth
 * - Critical pressure threshold: 500 PSI (below this, artificial lift required)
 * - Pressure decline rate: 50-200 PSI per year
 * - Reinjection can maintain pressure (costs $500k-$2M annually)
 * 
 * USAGE:
 * ```typescript
 * import GasField from '@/lib/db/models/GasField';
 * 
 * // Create gas field
 * const field = await GasField.create({
 *   company: companyId,
 *   name: 'Barnett Shale Unit 5',
 *   location: {
 *     latitude: 32.7767,
 *     longitude: -97.0929,
 *     region: 'Barnett Shale'
 *   },
 *   fieldType: 'Shale Gas',
 *   gasQuality: 'Premium',
 *   reserveEstimate: 50000000, // 50 BCF
 *   initialPressure: 4500,
 *   currentPressure: 4200,
 *   maxProduction: 15000, // MCF/day
 *   processingCost: 1.20
 * });
 * 
 * // Calculate daily production based on pressure
 * const production = await field.calculateProduction();
 * 
 * // Calculate revenue
 * const revenue = await field.calculateDailyRevenue(6.50); // $6.50/MCF
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/**
 * Natural gas field types
 */
export type FieldType = 
  | 'Conventional'      // Traditional gas reservoirs (moderate depletion)
  | 'Tight Gas'         // Low-permeability formations (slow depletion)
  | 'Coalbed Methane'   // Gas from coal seams (steady production)
  | 'Shale Gas';        // Hydraulic fracturing required (fast depletion)

/**
 * Gas quality grades (affects pricing)
 */
export type GasQuality = 
  | 'Premium'           // Low impurities, pipeline-ready (+15% price)
  | 'Standard'          // Normal quality, standard processing (base price)
  | 'Sour';             // High H2S content, expensive processing (-25% price)

/**
 * Field operational status
 */
export type FieldStatus = 
  | 'Exploration'       // Under geological survey
  | 'Development'       // Wells being drilled
  | 'Production'        // Actively producing gas
  | 'Declining'         // Below 50% initial pressure
  | 'Shut-In'           // Temporarily closed (low prices)
  | 'Depleted';         // Reserves exhausted

/**
 * Geographic location data
 */
export interface FieldLocation {
  latitude: number;      // Geographic latitude (-90 to 90)
  longitude: number;     // Geographic longitude (-180 to 180)
  region: string;        // Basin/formation name
}

/**
 * Processing facility data
 */
export interface ProcessingFacility {
  name: string;
  capacity: number;      // MCF/day processing capacity
  efficiency: number;    // Impurity removal rate (0-100%)
  operatingCost: number; // Cost per MCF processed
  lastMaintenance: Date;
}

/**
 * Pipeline connection
 */
export interface Pipeline {
  name: string;
  capacity: number;      // MCF/day transport capacity
  distance: number;      // Miles to market
  transportCost: number; // Cost per MCF per mile
}

/**
 * Gas field document interface
 */
export interface IGasField extends Document {
  company: Types.ObjectId;
  name: string;
  location: FieldLocation;
  fieldType: FieldType;
  gasQuality: GasQuality;
  status: FieldStatus;
  
  // Reserve & pressure metrics
  reserveEstimate: number;       // MCF (thousand cubic feet) remaining
  initialPressure: number;       // PSI at discovery
  currentPressure: number;       // Current reservoir pressure (PSI)
  maxProduction: number;         // MCF/day at full pressure
  currentProduction: number;     // Current MCF/day output
  depletionRate: number;         // Percentage per year (3-12%)
  
  // Processing & transport
  processingCost: number;        // Cost per MCF to process
  processingFacility?: ProcessingFacility;
  pipeline?: Pipeline;
  
  // Operational tracking
  lastMaintenance?: Date;
  discoveryDate: Date;
  productionStartDate?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  yearsInProduction: number;
  remainingLifeYears: number;
  pressureDeclineRate: number;
  requiresArtificialLift: boolean;
  
  // Instance methods
  calculateProduction(): Promise<number>;
  updatePressure(): void;
  calculateDailyRevenue(gasPrice: number): number;
  estimateReserves(): number;
  canMaintainPressure(): boolean;
}

const GasFieldSchema = new Schema<IGasField>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Field name is required'],
      trim: true,
      minlength: [3, 'Field name must be at least 3 characters'],
      maxlength: [100, 'Field name cannot exceed 100 characters'],
    },
    location: {
      type: {
        latitude: {
          type: Number,
          required: [true, 'Latitude is required'],
          min: [-90, 'Latitude must be between -90 and 90'],
          max: [90, 'Latitude must be between -90 and 90'],
        },
        longitude: {
          type: Number,
          required: [true, 'Longitude is required'],
          min: [-180, 'Longitude must be between -180 and 180'],
          max: [180, 'Longitude must be between -180 and 180'],
        },
        region: {
          type: String,
          required: [true, 'Region is required'],
          trim: true,
          maxlength: [100, 'Region name cannot exceed 100 characters'],
        },
      },
      required: true,
    },
    fieldType: {
      type: String,
      required: [true, 'Field type is required'],
      enum: {
        values: ['Conventional', 'Tight Gas', 'Coalbed Methane', 'Shale Gas'],
        message: '{VALUE} is not a valid field type',
      },
      index: true,
    },
    gasQuality: {
      type: String,
      required: [true, 'Gas quality is required'],
      enum: {
        values: ['Premium', 'Standard', 'Sour'],
        message: '{VALUE} is not a valid gas quality',
      },
      default: 'Standard',
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Exploration', 'Development', 'Production', 'Declining', 'Shut-In', 'Depleted'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Exploration',
      index: true,
    },
    reserveEstimate: {
      type: Number,
      required: [true, 'Reserve estimate is required'],
      min: [0, 'Reserve estimate cannot be negative'],
    },
    initialPressure: {
      type: Number,
      required: [true, 'Initial pressure is required'],
      min: [2000, 'Initial pressure must be at least 2000 PSI'],
      max: [8000, 'Initial pressure cannot exceed 8000 PSI'],
    },
    currentPressure: {
      type: Number,
      required: [true, 'Current pressure is required'],
      min: [0, 'Current pressure cannot be negative'],
    },
    maxProduction: {
      type: Number,
      required: [true, 'Max production is required'],
      min: [1000, 'Max production must be at least 1000 MCF/day'],
      max: [100000, 'Max production cannot exceed 100,000 MCF/day'],
    },
    currentProduction: {
      type: Number,
      required: [true, 'Current production is required'],
      min: [0, 'Current production cannot be negative'],
      default: 0,
    },
    depletionRate: {
      type: Number,
      required: [true, 'Depletion rate is required'],
      min: [3, 'Depletion rate must be at least 3% per year'],
      max: [12, 'Depletion rate cannot exceed 12% per year'],
    },
    processingCost: {
      type: Number,
      required: [true, 'Processing cost is required'],
      min: [0.50, 'Processing cost must be at least $0.50/MCF'],
      max: [2.00, 'Processing cost cannot exceed $2.00/MCF'],
    },
    processingFacility: {
      type: {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        capacity: {
          type: Number,
          required: true,
          min: [1000, 'Facility capacity must be at least 1000 MCF/day'],
        },
        efficiency: {
          type: Number,
          required: true,
          min: [50, 'Efficiency must be at least 50%'],
          max: [100, 'Efficiency cannot exceed 100%'],
          default: 95,
        },
        operatingCost: {
          type: Number,
          required: true,
          min: [0, 'Operating cost cannot be negative'],
        },
        lastMaintenance: {
          type: Date,
          required: true,
          default: Date.now,
        },
      },
    },
    pipeline: {
      type: {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        capacity: {
          type: Number,
          required: true,
          min: [1000, 'Pipeline capacity must be at least 1000 MCF/day'],
        },
        distance: {
          type: Number,
          required: true,
          min: [1, 'Distance must be at least 1 mile'],
          max: [1000, 'Distance cannot exceed 1000 miles'],
        },
        transportCost: {
          type: Number,
          required: true,
          min: [0.01, 'Transport cost must be at least $0.01/MCF/mile'],
          max: [0.50, 'Transport cost cannot exceed $0.50/MCF/mile'],
        },
      },
    },
    lastMaintenance: {
      type: Date,
    },
    discoveryDate: {
      type: Date,
      required: [true, 'Discovery date is required'],
      default: Date.now,
    },
    productionStartDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'gasfields',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index: unique field name per company
GasFieldSchema.index({ company: 1, name: 1 }, { unique: true });

// Index for geographic queries
GasFieldSchema.index({ 'location.region': 1, fieldType: 1 });
GasFieldSchema.index({ status: 1, gasQuality: 1 });

/**
 * Virtual: Years in production
 */
GasFieldSchema.virtual('yearsInProduction').get(function (this: IGasField) {
  if (!this.productionStartDate) return 0;
  
  const now = new Date();
  const started = this.productionStartDate;
  const diffTime = Math.abs(now.getTime() - started.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
  
  return Math.round(diffYears * 10) / 10; // Round to 1 decimal
});

/**
 * Virtual: Estimated remaining life in years
 */
GasFieldSchema.virtual('remainingLifeYears').get(function (this: IGasField) {
  if (this.currentProduction === 0 || this.status === 'Depleted') return 0;
  
  const daysRemaining = this.reserveEstimate / this.currentProduction;
  const yearsRemaining = daysRemaining / 365;
  
  return Math.max(0, Math.round(yearsRemaining * 10) / 10);
});

/**
 * Virtual: Pressure decline rate (PSI per year)
 */
GasFieldSchema.virtual('pressureDeclineRate').get(function (this: IGasField) {
  if (!this.productionStartDate) return 0;
  
  const yearsProducing = this.yearsInProduction;
  if (yearsProducing === 0) return 0;
  
  const pressureLoss = this.initialPressure - this.currentPressure;
  const declineRate = pressureLoss / yearsProducing;
  
  return Math.round(declineRate);
});

/**
 * Virtual: Check if artificial lift is required (pressure < 500 PSI)
 */
GasFieldSchema.virtual('requiresArtificialLift').get(function (this: IGasField) {
  return this.currentPressure < 500;
});

/**
 * Calculate current daily production based on reservoir pressure
 * 
 * Formula: maxProduction × (currentPressure / initialPressure)^0.5
 * 
 * Production rate is proportional to square root of pressure ratio.
 * This models real-world gas field behavior where production declines
 * as reservoir pressure drops.
 * 
 * @returns Current MCF/day production
 * 
 * @example
 * // Field: 10,000 MCF/day max, 3000 PSI current, 5000 PSI initial
 * const production = await field.calculateProduction();
 * // Returns: 10,000 × sqrt(3000/5000) = 7,746 MCF/day
 */
GasFieldSchema.methods.calculateProduction = async function (
  this: IGasField
): Promise<number> {
  if (this.status === 'Exploration' || this.status === 'Depleted' || this.status === 'Shut-In') {
    this.currentProduction = 0;
    await this.save();
    return 0;
  }
  
  if (this.currentPressure <= 0) {
    this.status = 'Depleted';
    this.currentProduction = 0;
    await this.save();
    return 0;
  }
  
  // Calculate pressure ratio
  const pressureRatio = this.currentPressure / this.initialPressure;
  
  // Production proportional to sqrt of pressure ratio
  const productionFactor = Math.sqrt(pressureRatio);
  let production = this.maxProduction * productionFactor;
  
  // Factor in processing facility efficiency if exists
  if (this.processingFacility) {
    production = production * (this.processingFacility.efficiency / 100);
  }
  
  // Cap by pipeline capacity if exists
  if (this.pipeline && production > this.pipeline.capacity) {
    production = this.pipeline.capacity;
  }
  
  this.currentProduction = Math.round(production);
  
  // Update pressure based on production
  this.updatePressure();
  
  // Check if field is declining (< 50% initial pressure)
  if (this.currentPressure < this.initialPressure * 0.5 && this.status === 'Production') {
    this.status = 'Declining';
  }
  
  await this.save();
  
  return this.currentProduction;
};

/**
 * Update reservoir pressure based on cumulative extraction
 * 
 * Pressure declines proportionally to gas extracted from reservoir.
 * Typical decline: 50-200 PSI per year depending on field type.
 * 
 * Formula: pressure -= (production / reserveEstimate) × initialPressure
 */
GasFieldSchema.methods.updatePressure = function (this: IGasField): void {
  if (this.reserveEstimate === 0) {
    this.currentPressure = 0;
    return;
  }
  
  // Calculate pressure drop from today's production
  const extractionFraction = this.currentProduction / this.reserveEstimate;
  const pressureDrop = extractionFraction * this.initialPressure;
  
  this.currentPressure = Math.max(0, this.currentPressure - pressureDrop);
  
  // Subtract production from reserves
  this.reserveEstimate = Math.max(0, this.reserveEstimate - this.currentProduction);
  
  // Check depletion
  if (this.reserveEstimate < 100000) { // Less than 100 MMCF
    this.status = 'Depleted';
    this.currentProduction = 0;
    this.currentPressure = 0;
  }
};

/**
 * Calculate daily revenue from gas production
 * 
 * Formula: (production × gasPrice × qualityMultiplier) - processingCosts - transportCosts
 * 
 * Quality multipliers:
 * - Premium: 1.15 (+15%)
 * - Standard: 1.00 (base)
 * - Sour: 0.75 (-25%)
 * 
 * @param gasPrice - Current natural gas price per MCF (e.g., $6.50)
 * @returns Daily revenue in dollars
 * 
 * @example
 * const revenue = field.calculateDailyRevenue(6.50);
 * // 10,000 MCF/day × $6.50 × 1.15 (Premium) = $74,750 revenue
 * // Processing: 10,000 × $1.20 = $12,000
 * // Transport: 10,000 × 50 miles × $0.10 = $50,000
 * // Net: $74,750 - $12,000 - $50,000 = $12,750/day
 */
GasFieldSchema.methods.calculateDailyRevenue = function (
  this: IGasField,
  gasPrice: number
): number {
  if (this.status !== 'Production' && this.status !== 'Declining') {
    return 0;
  }
  
  if (this.currentProduction === 0) {
    return 0;
  }
  
  // Quality multipliers
  const qualityMultipliers = {
    Premium: 1.15,
    Standard: 1.00,
    Sour: 0.75,
  };
  
  const qualityMultiplier = qualityMultipliers[this.gasQuality];
  
  // Calculate revenue
  const grossRevenue = this.currentProduction * gasPrice * qualityMultiplier;
  
  // Processing costs
  const processingCosts = this.currentProduction * this.processingCost;
  
  // Transport costs (if pipeline exists)
  let transportCosts = 0;
  if (this.pipeline) {
    transportCosts = this.currentProduction * this.pipeline.distance * this.pipeline.transportCost;
  }
  
  const netRevenue = grossRevenue - processingCosts - transportCosts;
  
  return Math.round(netRevenue * 100) / 100; // Round to cents
};

/**
 * Estimate reserves based on geological data
 * 
 * Uses field type and initial pressure to estimate total recoverable gas.
 * 
 * Formula:
 * - Conventional: initialPressure × 25,000 MCF/PSI
 * - Tight Gas: initialPressure × 30,000 MCF/PSI
 * - Coalbed Methane: initialPressure × 20,000 MCF/PSI
 * - Shale Gas: initialPressure × 35,000 MCF/PSI
 * 
 * @returns Estimated MCF remaining
 */
GasFieldSchema.methods.estimateReserves = function (this: IGasField): number {
  const multipliers = {
    Conventional: 25000,
    'Tight Gas': 30000,
    'Coalbed Methane': 20000,
    'Shale Gas': 35000,
  };
  
  const multiplier = multipliers[this.fieldType];
  const estimate = this.initialPressure * multiplier;
  
  this.reserveEstimate = estimate;
  
  return estimate;
};

/**
 * Check if pressure maintenance is economically viable
 * 
 * Pressure maintenance (gas reinjection or water flooding) costs $500k-$2M annually.
 * Only viable if remaining reserves justify the investment.
 * 
 * @returns True if pressure maintenance recommended
 */
GasFieldSchema.methods.canMaintainPressure = function (this: IGasField): boolean {
  // Minimum reserve threshold: 10 BCF (10 million MCF)
  const minReserves = 10000000;
  
  // Minimum current pressure: 1000 PSI
  const minPressure = 1000;
  
  return this.reserveEstimate > minReserves && this.currentPressure > minPressure;
};

const GasField: Model<IGasField> =
  mongoose.models.GasField || mongoose.model<IGasField>('GasField', GasFieldSchema);

export default GasField;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. PRESSURE DYNAMICS:
 *    - Production rate ∝ sqrt(currentPressure / initialPressure)
 *    - Typical initial pressure: 2000-8000 PSI
 *    - Critical threshold: 500 PSI (artificial lift required)
 *    - Decline rate: 50-200 PSI per year
 * 
 * 2. GAS QUALITY PRICING:
 *    - Premium: +15% price (low impurities, pipeline-ready)
 *    - Standard: Base price (normal processing)
 *    - Sour: -25% price (high H2S content, expensive processing)
 * 
 * 3. DEPLETION RATES BY FIELD TYPE:
 *    - Conventional: 3-5% per year (slowest decline)
 *    - Tight Gas: 4-6% per year (moderate decline)
 *    - Coalbed Methane: 3-4% per year (very steady)
 *    - Shale Gas: 8-12% per year (fastest decline)
 * 
 * 4. PROCESSING COSTS:
 *    - Premium gas: $0.50-$0.80/MCF (minimal processing)
 *    - Standard gas: $0.80-$1.20/MCF (standard processing)
 *    - Sour gas: $1.50-$2.00/MCF (sulfur removal required)
 * 
 * 5. TRANSPORT COSTS:
 *    - Pipeline capacity: 1000-100,000 MCF/day
 *    - Distance: 1-1000 miles to market
 *    - Cost: $0.01-$0.50/MCF/mile
 *    - Total transport can be 30-50% of revenue
 * 
 * 6. PRESSURE MAINTENANCE:
 *    - Gas reinjection: $500k-$1M annually
 *    - Water flooding: $1M-$2M annually
 *    - Only viable for fields >10 BCF reserves
 *    - Can extend field life by 10-20 years
 * 
 * 7. RESERVE ESTIMATES:
 *    - Conventional: 50-200 BCF typical
 *    - Tight Gas: 30-150 BCF typical
 *    - Coalbed Methane: 20-100 BCF typical
 *    - Shale Gas: 100-500 BCF typical (largest reserves)
 * 
 * 8. LIFECYCLE STATES:
 *    - Exploration: Geological surveys, no production
 *    - Development: Wells being drilled, facilities built
 *    - Production: Normal operation, >50% initial pressure
 *    - Declining: Below 50% pressure, reduced output
 *    - Shut-In: Temporarily closed (low gas prices)
 *    - Depleted: Reserves exhausted (<100 MMCF)
 */
