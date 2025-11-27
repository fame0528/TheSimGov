/**
 * @file src/lib/db/models/WindTurbine.ts
 * @description Wind turbine schema for Energy Industry - Wind power generation
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * Wind turbine model representing individual turbines or wind farm units with
 * wind speed power curves, capacity factor calculations, weather impact modeling,
 * and blade maintenance tracking. Supports both onshore and offshore installations
 * with realistic power generation based on wind conditions.
 * 
 * KEY FEATURES:
 * - Wind speed power curve (cubic relationship)
 * - Capacity factor tracking (15-50% typical)
 * - Weather impact (storms, icing, extreme wind)
 * - Blade condition monitoring and degradation
 * - Multiple turbine types (Onshore, Offshore, Small-Scale)
 * - Gearbox and generator efficiency tracking
 * - Yaw and pitch control optimization
 * - Hub height impact on wind capture
 * 
 * BUSINESS LOGIC:
 * - Power output ∝ windSpeed³ (cubic relationship)
 * - Cut-in wind speed: 3-4 m/s (starts generating)
 * - Rated wind speed: 12-15 m/s (maximum power)
 * - Cut-out wind speed: 25 m/s (safety shutdown)
 * - Revenue: production × electricityRate - operatingCost
 * - Operating cost: $40-$80 per kW per year
 * - Maintenance: Annual gearbox check, blade inspection
 * 
 * POWER CURVE:
 * - Below 3 m/s: 0% output (cut-in threshold)
 * - 3-12 m/s: Cubic increase (power ∝ speed³)
 * - 12-15 m/s: 100% rated power (flat curve)
 * - 15-25 m/s: 100% rated power (controlled)
 * - Above 25 m/s: 0% output (cut-out for safety)
 * 
 * WEATHER IMPACT:
 * - Icing: Reduces output 20-40% (cold climates)
 * - Extreme gusts: Temporary shutdown for safety
 * - Storm damage: Blade/gearbox repair required
 * - Temperature: Affects air density and power
 * 
 * USAGE:
 * ```typescript
 * import WindTurbine from '@/lib/db/models/WindTurbine';
 * 
 * // Create wind turbine
 * const turbine = await WindTurbine.create({
 *   company: companyId,
 *   name: 'Offshore Wind Unit 12',
 *   location: {
 *     latitude: 40.7128,
 *     longitude: -74.0060,
 *     region: 'Atlantic Coast, NJ'
 *   },
 *   turbineType: 'Offshore',
 *   ratedCapacity: 5000, // 5 MW
 *   bladeLength: 75,
 *   hubHeight: 120,
 *   commissionDate: new Date(),
 *   electricityRate: 0.10
 * });
 * 
 * // Calculate output based on wind speed
 * const output = await turbine.calculateDailyOutput(12, 25, 0); // windSpeed, temp, gustFactor
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/**
 * Wind turbine types
 */
export type TurbineType =
  | 'Onshore'           // Land-based, lower cost, easier maintenance
  | 'Offshore'          // Ocean-based, higher wind speeds, higher cost
  | 'Small-Scale';      // Distributed generation, <100 kW

/**
 * Turbine operational status
 */
export type TurbineStatus =
  | 'Construction'      // Under installation
  | 'Operational'       // Actively generating power
  | 'Maintenance'       // Temporary shutdown for repairs
  | 'Storm Shutdown'    // Emergency shutdown due to weather
  | 'Degraded'          // Operating below 60% capacity
  | 'Decommissioned';   // Permanently closed

/**
 * Geographic location
 */
export interface TurbineLocation {
  latitude: number;
  longitude: number;
  region: string;       // Area name (e.g., "Texas Panhandle", "North Sea")
}

/**
 * Blade condition tracking
 */
export interface BladeCondition {
  bladeNumber: number;  // 1, 2, or 3 (standard three-blade design)
  integrityPercent: number; // 0-100% structural integrity
  iceAccumulation: number;  // 0-100% ice coverage
  lastInspection: Date;
}

/**
 * Gearbox and generator tracking
 */
export interface DrivetrainCondition {
  gearboxEfficiency: number;    // 0-100%
  generatorEfficiency: number;  // 0-100%
  lastMaintenance: Date;
  operatingHours: number;
}

/**
 * Wind turbine document interface
 */
export interface IWindTurbine extends Document {
  company: Types.ObjectId;
  name: string;
  location: TurbineLocation;
  turbineType: TurbineType;
  status: TurbineStatus;
  
  // Technical specifications
  ratedCapacity: number;         // kW rated power output
  bladeLength: number;           // Meters (rotor radius)
  hubHeight: number;             // Meters above ground/sea
  cutInSpeed: number;            // m/s minimum wind speed
  ratedWindSpeed: number;        // m/s for maximum power
  cutOutSpeed: number;           // m/s maximum safe wind speed
  
  // Production tracking
  currentOutput: number;         // kW current generation
  dailyProduction: number;       // kWh produced today
  cumulativeProduction: number;  // Total lifetime kWh
  
  // Condition monitoring
  bladeConditions: BladeCondition[];
  drivetrain: DrivetrainCondition;
  lastMaintenance?: Date;
  commissionDate: Date;
  
  // Economic data
  electricityRate: number;       // $/kWh selling price
  operatingCost: number;         // $/kW/year maintenance cost
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  yearsOperating: number;
  capacityFactor: number;
  avgBladeIntegrity: number;
  maintenanceOverdue: boolean;
  
  // Instance methods
  calculateDailyOutput(windSpeed: number, temperature: number, gustFactor: number): Promise<number>;
  performMaintenance(): Promise<void>;
  updateBladeCondition(): void;
  calculateDailyRevenue(electricityPrice?: number): number;
  estimateAnnualProduction(avgWindSpeed: number): number;
}

const WindTurbineSchema = new Schema<IWindTurbine>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Turbine name is required'],
      trim: true,
      minlength: [3, 'Turbine name must be at least 3 characters'],
      maxlength: [100, 'Turbine name cannot exceed 100 characters'],
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
    turbineType: {
      type: String,
      required: [true, 'Turbine type is required'],
      enum: {
        values: ['Onshore', 'Offshore', 'Small-Scale'],
        message: '{VALUE} is not a valid turbine type',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Construction', 'Operational', 'Maintenance', 'Storm Shutdown', 'Degraded', 'Decommissioned'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Construction',
      index: true,
    },
    ratedCapacity: {
      type: Number,
      required: [true, 'Rated capacity is required'],
      min: [10, 'Capacity must be at least 10 kW'],
      max: [15000, 'Capacity cannot exceed 15 MW (15,000 kW)'],
    },
    bladeLength: {
      type: Number,
      required: [true, 'Blade length is required'],
      min: [5, 'Blade length must be at least 5 meters'],
      max: [120, 'Blade length cannot exceed 120 meters'],
    },
    hubHeight: {
      type: Number,
      required: [true, 'Hub height is required'],
      min: [10, 'Hub height must be at least 10 meters'],
      max: [250, 'Hub height cannot exceed 250 meters'],
    },
    cutInSpeed: {
      type: Number,
      required: [true, 'Cut-in speed is required'],
      min: [2, 'Cut-in speed must be at least 2 m/s'],
      max: [5, 'Cut-in speed cannot exceed 5 m/s'],
      default: 3,
    },
    ratedWindSpeed: {
      type: Number,
      required: [true, 'Rated wind speed is required'],
      min: [10, 'Rated speed must be at least 10 m/s'],
      max: [18, 'Rated speed cannot exceed 18 m/s'],
      default: 12,
    },
    cutOutSpeed: {
      type: Number,
      required: [true, 'Cut-out speed is required'],
      min: [20, 'Cut-out speed must be at least 20 m/s'],
      max: [30, 'Cut-out speed cannot exceed 30 m/s'],
      default: 25,
    },
    currentOutput: {
      type: Number,
      required: true,
      min: [0, 'Current output cannot be negative'],
      default: 0,
    },
    dailyProduction: {
      type: Number,
      required: true,
      min: [0, 'Daily production cannot be negative'],
      default: 0,
    },
    cumulativeProduction: {
      type: Number,
      required: true,
      min: [0, 'Cumulative production cannot be negative'],
      default: 0,
    },
    bladeConditions: [
      {
        bladeNumber: {
          type: Number,
          required: true,
          min: [1, 'Blade number must be 1, 2, or 3'],
          max: [3, 'Blade number must be 1, 2, or 3'],
        },
        integrityPercent: {
          type: Number,
          required: true,
          min: [0, 'Integrity must be between 0 and 100%'],
          max: [100, 'Integrity must be between 0 and 100%'],
          default: 100,
        },
        iceAccumulation: {
          type: Number,
          required: true,
          min: [0, 'Ice accumulation cannot be negative'],
          max: [100, 'Ice accumulation cannot exceed 100%'],
          default: 0,
        },
        lastInspection: {
          type: Date,
          required: true,
          default: Date.now,
        },
      },
    ],
    drivetrain: {
      type: {
        gearboxEfficiency: {
          type: Number,
          required: true,
          min: [70, 'Gearbox efficiency must be at least 70%'],
          max: [98, 'Gearbox efficiency cannot exceed 98%'],
          default: 95,
        },
        generatorEfficiency: {
          type: Number,
          required: true,
          min: [85, 'Generator efficiency must be at least 85%'],
          max: [98, 'Generator efficiency cannot exceed 98%'],
          default: 96,
        },
        lastMaintenance: {
          type: Date,
          required: true,
          default: Date.now,
        },
        operatingHours: {
          type: Number,
          required: true,
          min: [0, 'Operating hours cannot be negative'],
          default: 0,
        },
      },
      required: true,
    },
    lastMaintenance: {
      type: Date,
    },
    commissionDate: {
      type: Date,
      required: [true, 'Commission date is required'],
      default: Date.now,
    },
    electricityRate: {
      type: Number,
      required: [true, 'Electricity rate is required'],
      min: [0.05, 'Rate must be at least $0.05/kWh'],
      max: [0.30, 'Rate cannot exceed $0.30/kWh'],
    },
    operatingCost: {
      type: Number,
      required: [true, 'Operating cost is required'],
      min: [30, 'Operating cost must be at least $30/kW/year'],
      max: [100, 'Operating cost cannot exceed $100/kW/year'],
      default: 50,
    },
  },
  {
    timestamps: true,
    collection: 'windturbines',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index: unique turbine name per company
WindTurbineSchema.index({ company: 1, name: 1 }, { unique: true });

// Index for geographic queries
WindTurbineSchema.index({ 'location.region': 1, turbineType: 1 });
WindTurbineSchema.index({ status: 1, ratedCapacity: 1 });

/**
 * Virtual: Years since commission
 */
WindTurbineSchema.virtual('yearsOperating').get(function (this: IWindTurbine) {
  const now = new Date();
  const commissioned = this.commissionDate;
  const diffTime = Math.abs(now.getTime() - commissioned.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
  
  return Math.round(diffYears * 10) / 10;
});

/**
 * Virtual: Capacity factor (actual vs theoretical production)
 * 
 * Typical values:
 * - Onshore: 25-35%
 * - Offshore: 35-50% (higher, more consistent wind)
 * - Small-Scale: 15-25%
 */
WindTurbineSchema.virtual('capacityFactor').get(function (this: IWindTurbine) {
  if (this.yearsOperating === 0) return 0;
  
  const theoreticalAnnualProduction = this.ratedCapacity * 365 * 24;
  const actualAnnualProduction = this.cumulativeProduction / this.yearsOperating;
  
  const factor = (actualAnnualProduction / theoreticalAnnualProduction) * 100;
  return Math.round(factor * 10) / 10;
});

/**
 * Virtual: Average blade integrity across all blades
 */
WindTurbineSchema.virtual('avgBladeIntegrity').get(function (this: IWindTurbine) {
  if (this.bladeConditions.length === 0) return 100;
  
  const totalIntegrity = this.bladeConditions.reduce((sum, blade) => sum + blade.integrityPercent, 0);
  return Math.round(totalIntegrity / this.bladeConditions.length);
});

/**
 * Virtual: Check if maintenance is overdue (>365 days)
 */
WindTurbineSchema.virtual('maintenanceOverdue').get(function (this: IWindTurbine) {
  if (!this.lastMaintenance) return true;
  
  const now = new Date();
  const daysSinceMaintenance = (now.getTime() - this.lastMaintenance.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysSinceMaintenance > 365; // Annual maintenance
});

/**
 * Calculate daily output based on wind speed
 * 
 * Power curve formula:
 * - Below cutInSpeed: 0% output
 * - Between cutIn and rated: Power ∝ (windSpeed - cutIn)³
 * - Between rated and cutOut: 100% output
 * - Above cutOut: 0% output (safety shutdown)
 * 
 * Temperature affects air density: ρ = ρ₀ × (T₀ / T)
 * Gust factor reduces output: high gusts trigger safety limits
 * 
 * @param windSpeed - Wind speed in m/s
 * @param temperature - Ambient temperature in °F
 * @param gustFactor - Gust intensity 0-100 (>70 triggers shutdown)
 * @returns Daily energy production in kWh
 */
WindTurbineSchema.methods.calculateDailyOutput = async function (
  this: IWindTurbine,
  windSpeed: number,
  temperature: number,
  gustFactor: number
): Promise<number> {
  if (this.status === 'Construction' || this.status === 'Decommissioned') {
    return 0;
  }
  
  // Check cut-out speed (safety shutdown)
  if (windSpeed >= this.cutOutSpeed || gustFactor > 70) {
    this.status = 'Storm Shutdown';
    this.currentOutput = 0;
    this.dailyProduction = 0;
    await this.save();
    return 0;
  }
  
  // Check cut-in speed (minimum to start)
  if (windSpeed < this.cutInSpeed) {
    this.currentOutput = 0;
    this.dailyProduction = 0;
    await this.save();
    return 0;
  }
  
  let powerFactor = 0;
  
  // Power curve calculation
  if (windSpeed < this.ratedWindSpeed) {
    // Cubic relationship between cut-in and rated speed
    const speedRange = this.ratedWindSpeed - this.cutInSpeed;
    const speedDelta = windSpeed - this.cutInSpeed;
    powerFactor = Math.pow(speedDelta / speedRange, 3);
  } else {
    // Rated power (100%)
    powerFactor = 1.0;
  }
  
  // Temperature impact on air density
  const tempCelsius = (temperature - 32) * 5/9;
  const airDensityFactor = 288 / (tempCelsius + 273); // Simplified air density
  const densityAdjustment = Math.min(1.1, Math.max(0.9, airDensityFactor)); // Cap at ±10%
  
  // Blade integrity impact
  const bladeIntegrityFactor = this.avgBladeIntegrity / 100;
  
  // Ice accumulation impact
  const avgIce = this.bladeConditions.reduce((sum, b) => sum + b.iceAccumulation, 0) / this.bladeConditions.length;
  const iceFactor = 1 - (avgIce / 100) * 0.4; // Up to 40% reduction with full ice
  
  // Drivetrain efficiency
  const drivetrainFactor = (this.drivetrain.gearboxEfficiency / 100) * (this.drivetrain.generatorEfficiency / 100);
  
  // Calculate output
  let output = this.ratedCapacity * powerFactor * densityAdjustment * bladeIntegrityFactor * iceFactor * drivetrainFactor;
  
  // Daily production (kWh) - assume 24 hours at current wind speed
  this.currentOutput = Math.round(output);
  this.dailyProduction = Math.round(output * 24);
  this.cumulativeProduction += this.dailyProduction;
  
  // Update operating hours
  this.drivetrain.operatingHours += 24;
  
  // Check degradation status
  if (this.avgBladeIntegrity < 60 && this.status === 'Operational') {
    this.status = 'Degraded';
  }
  
  // Restore from storm shutdown if wind is safe
  if (this.status === 'Storm Shutdown' && windSpeed < this.cutOutSpeed - 5 && gustFactor < 50) {
    this.status = 'Operational';
  }
  
  await this.save();
  
  return this.dailyProduction;
};

/**
 * Perform maintenance on wind turbine
 * 
 * - Inspects and repairs blades (restores 10-20% integrity)
 * - Services gearbox and generator (restores efficiency)
 * - Clears ice accumulation
 * - Updates lastMaintenance timestamp
 * 
 * @throws Error if turbine is Decommissioned
 */
WindTurbineSchema.methods.performMaintenance = async function (
  this: IWindTurbine
): Promise<void> {
  if (this.status === 'Decommissioned') {
    throw new Error('Cannot maintain decommissioned turbine');
  }
  
  // Blade inspection and repair
  this.bladeConditions.forEach((blade) => {
    // Restore 10-20% integrity
    const integrityRecovery = Math.random() * 10 + 10;
    blade.integrityPercent = Math.min(100, blade.integrityPercent + integrityRecovery);
    
    // Clear ice accumulation
    blade.iceAccumulation = 0;
    
    // Update inspection date
    blade.lastInspection = new Date();
  });
  
  // Gearbox and generator service
  this.drivetrain.gearboxEfficiency = Math.min(97, this.drivetrain.gearboxEfficiency + 2);
  this.drivetrain.generatorEfficiency = Math.min(97, this.drivetrain.generatorEfficiency + 1);
  this.drivetrain.lastMaintenance = new Date();
  
  // Update maintenance timestamp
  this.lastMaintenance = new Date();
  
  // Change status back to Operational if in Maintenance mode
  if (this.status === 'Maintenance') {
    this.status = 'Operational';
  }
  
  // Check if still degraded after maintenance
  if (this.status === 'Degraded' && this.avgBladeIntegrity >= 70) {
    this.status = 'Operational';
  }
  
  await this.save();
};

/**
 * Update blade condition based on operating hours
 * 
 * Blades degrade with use and weather exposure.
 * Typical degradation: 1-2% per 1000 operating hours.
 */
WindTurbineSchema.methods.updateBladeCondition = function (this: IWindTurbine): void {
  const hoursPerThousand = this.drivetrain.operatingHours / 1000;
  const degradationRate = 1.5; // 1.5% per 1000 hours
  
  this.bladeConditions.forEach((blade) => {
    blade.integrityPercent = Math.max(50, 100 - (hoursPerThousand * degradationRate));
  });
};

/**
 * Calculate daily revenue from electricity production
 * 
 * Formula: (dailyProduction × electricityRate) - dailyOperatingCost
 * 
 * @param electricityPrice - Optional override price
 * @returns Daily revenue in dollars
 */
WindTurbineSchema.methods.calculateDailyRevenue = function (
  this: IWindTurbine,
  electricityPrice?: number
): number {
  if (this.status !== 'Operational' && this.status !== 'Degraded') {
    return 0;
  }
  
  const rate = electricityPrice || this.electricityRate;
  const revenue = this.dailyProduction * rate;
  
  // Subtract daily operating cost
  const dailyOperatingCost = (this.operatingCost * this.ratedCapacity) / 365;
  
  return Math.round((revenue - dailyOperatingCost) * 100) / 100;
};

/**
 * Estimate annual production based on average wind speed
 * 
 * @param avgWindSpeed - Average annual wind speed in m/s
 * @returns Estimated annual production in kWh
 */
WindTurbineSchema.methods.estimateAnnualProduction = function (
  this: IWindTurbine,
  avgWindSpeed: number
): number {
  // Calculate average power factor from wind speed
  let avgPowerFactor = 0;
  
  if (avgWindSpeed < this.cutInSpeed) {
    avgPowerFactor = 0;
  } else if (avgWindSpeed < this.ratedWindSpeed) {
    const speedRange = this.ratedWindSpeed - this.cutInSpeed;
    const speedDelta = avgWindSpeed - this.cutInSpeed;
    avgPowerFactor = Math.pow(speedDelta / speedRange, 3);
  } else {
    avgPowerFactor = 0.8; // Account for cut-out events
  }
  
  const avgOutput = this.ratedCapacity * avgPowerFactor;
  const annualProduction = avgOutput * 24 * 365;
  
  return Math.round(annualProduction);
};

/**
 * Pre-save hook: Auto-update blade condition
 */
WindTurbineSchema.pre('save', function (next) {
  if (this.isModified('drivetrain.operatingHours')) {
    this.updateBladeCondition();
  }
  next();
});

const WindTurbine: Model<IWindTurbine> =
  mongoose.models.WindTurbine || mongoose.model<IWindTurbine>('WindTurbine', WindTurbineSchema);

export default WindTurbine;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. POWER CURVE:
 *    - Cut-in: 3-4 m/s (turbine starts rotating)
 *    - Rated: 12-15 m/s (maximum power output)
 *    - Cut-out: 25 m/s (safety shutdown)
 *    - Power ∝ windSpeed³ (cubic relationship)
 * 
 * 2. CAPACITY FACTORS:
 *    - Onshore: 25-35% typical
 *    - Offshore: 35-50% (higher, more consistent wind)
 *    - Small-Scale: 15-25% (lower hub heights)
 *    - Best locations: >40% (consistent strong winds)
 * 
 * 3. BLADE DEGRADATION:
 *    - Rate: 1-2% per 1000 operating hours
 *    - Causes: Erosion, fatigue, lightning strikes
 *    - Maintenance restores 10-20% integrity
 *    - Critical threshold: <60% (degraded status)
 * 
 * 4. WEATHER IMPACTS:
 *    - Icing: -20 to -40% output (cold climates)
 *    - Extreme gusts: Safety shutdown (>70 gust factor)
 *    - Temperature: Affects air density (±10% impact)
 *    - Storm damage: Blade/gearbox repair required
 * 
 * 5. TURBINE TYPES:
 *    - Onshore: 2-5 MW typical, lower cost
 *    - Offshore: 8-15 MW typical, higher capacity
 *    - Small-Scale: 10-100 kW, distributed generation
 * 
 * 6. OPERATING COSTS:
 *    - Onshore: $30-$50/kW/year
 *    - Offshore: $60-$100/kW/year (higher maintenance)
 *    - Small-Scale: $40-$80/kW/year
 * 
 * 7. MAINTENANCE SCHEDULE:
 *    - Annual: Blade inspection, gearbox service
 *    - Bi-annual: Generator inspection
 *    - Every 5 years: Major overhaul
 *    - Emergency: Storm damage, blade failure
 * 
 * 8. LIFECYCLE STATES:
 *    - Construction: Under installation
 *    - Operational: Normal operation, >60% capacity
 *    - Maintenance: Scheduled repairs
 *    - Storm Shutdown: Emergency shutdown (high winds)
 *    - Degraded: <60% blade integrity
 *    - Decommissioned: Permanently closed
 */
