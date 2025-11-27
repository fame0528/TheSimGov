/**
 * @file src/lib/db/models/SolarFarm.ts
 * @description Solar farm schema for Energy Industry - Renewable solar power generation
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * Solar farm model representing photovoltaic (PV) or concentrated solar power (CSP)
 * facilities with weather-based output calculations, panel efficiency degradation,
 * seasonal variation modeling, and maintenance scheduling. Supports both utility-scale
 * and distributed generation with grid integration and energy storage capabilities.
 * 
 * KEY FEATURES:
 * - Weather-based output calculations (irradiance, cloud cover, temperature)
 * - Panel efficiency degradation (0.5% per year typical)
 * - Seasonal variation modeling (summer peak, winter low)
 * - Multiple panel types (Monocrystalline, Polycrystalline, Thin-Film, Bifacial)
 * - Energy storage integration (battery systems)
 * - Grid connection management
 * - Inverter efficiency tracking
 * - Subsidy and tax credit tracking
 * 
 * BUSINESS LOGIC:
 * - Base output: installedCapacity × peakSunHours × systemEfficiency
 * - Weather impact: cloudCover reduces output by 30-90%
 * - Temperature coefficient: -0.4% per °C above 25°C
 * - Panel degradation: 0.5% per year (20-year lifespan typical)
 * - Revenue: (production × electricityRate) + (excessProduction × feedInTariff)
 * - Operating cost: $10-$30 per kW per year
 * - Maintenance required: Bi-annual panel cleaning, inverter checks
 * 
 * WEATHER IMPACT:
 * - Clear sky (0-20% cloud): 100% output
 * - Partly cloudy (20-50%): 70% output
 * - Mostly cloudy (50-80%): 40% output
 * - Overcast (80-100%): 10-20% output
 * - Night: 0% output
 * - Snow cover: 0% output until cleared
 * 
 * PANEL TYPES:
 * - Monocrystalline: 18-22% efficiency, premium cost, best in low-light
 * - Polycrystalline: 15-17% efficiency, standard cost, good value
 * - Thin-Film: 10-13% efficiency, low cost, performs well in heat
 * - Bifacial: 20-24% efficiency, premium cost, captures reflected light
 * 
 * USAGE:
 * ```typescript
 * import SolarFarm from '@/lib/db/models/SolarFarm';
 * 
 * // Create solar farm
 * const farm = await SolarFarm.create({
 *   company: companyId,
 *   name: 'Desert Sun Solar Park',
 *   location: {
 *     latitude: 33.4484,
 *     longitude: -112.0740,
 *     region: 'Phoenix, AZ'
 *   },
 *   installedCapacity: 50000, // 50 MW
 *   panelType: 'Monocrystalline',
 *   panelCount: 150000,
 *   commissionDate: new Date(),
 *   electricityRate: 0.12
 * });
 * 
 * // Calculate daily output with weather
 * const output = await farm.calculateDailyOutput(75, 20, 6.5); // temp, cloud%, sunHours
 * 
 * // Perform maintenance
 * await farm.performMaintenance();
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/**
 * Solar panel technology types
 */
export type PanelType =
  | 'Monocrystalline'    // Highest efficiency (18-22%), premium cost
  | 'Polycrystalline'    // Standard efficiency (15-17%), good value
  | 'Thin-Film'          // Lower efficiency (10-13%), performs well in heat
  | 'Bifacial';          // Highest efficiency (20-24%), captures both sides

/**
 * Solar farm operational status
 */
export type SolarStatus =
  | 'Construction'       // Under development
  | 'Operational'        // Actively generating power
  | 'Maintenance'        // Temporary shutdown for repairs
  | 'Degraded'           // Operating below 70% capacity due to age/damage
  | 'Decommissioned';    // Permanently closed

/**
 * Geographic location
 */
export interface SolarLocation {
  latitude: number;      // Geographic latitude (-90 to 90)
  longitude: number;     // Geographic longitude (-180 to 180)
  region: string;        // Area name (e.g., "Phoenix, AZ", "Mojave Desert")
}

/**
 * Energy storage system
 */
export interface BatteryStorage {
  capacity: number;      // kWh storage capacity
  efficiency: number;    // Charge/discharge efficiency (0-100%)
  currentCharge: number; // Current stored energy (kWh)
  degradation: number;   // Battery degradation percentage
  lastMaintenance: Date;
}

/**
 * Grid connection details
 */
export interface GridConnection {
  utilityCompany: string;
  connectionCapacity: number; // MW maximum export capacity
  feedInTariff: number;       // $/kWh for excess production
  netMeteringEnabled: boolean;
}

/**
 * Solar farm document interface
 */
export interface ISolarFarm extends Document {
  company: Types.ObjectId;
  name: string;
  location: SolarLocation;
  status: SolarStatus;
  
  // Installation details
  installedCapacity: number;     // kW (kilowatts)
  panelType: PanelType;
  panelCount: number;
  systemEfficiency: number;      // Overall system efficiency (0-100%)
  inverterEfficiency: number;    // DC to AC conversion efficiency (0-100%)
  
  // Production tracking
  currentOutput: number;         // kW current generation
  dailyProduction: number;       // kWh produced today
  cumulativeProduction: number;  // Total lifetime kWh
  
  // Degradation & maintenance
  panelDegradation: number;      // Percentage efficiency loss
  lastMaintenance?: Date;
  commissionDate: Date;
  
  // Economic data
  electricityRate: number;       // $/kWh selling price
  operatingCost: number;         // $/kW/year maintenance cost
  
  // Optional features
  batteryStorage?: BatteryStorage;
  gridConnection?: GridConnection;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  yearsOperating: number;
  effectiveCapacity: number;
  capacityFactor: number;
  maintenanceOverdue: boolean;
  
  // Instance methods
  calculateDailyOutput(temperature: number, cloudCover: number, peakSunHours: number): Promise<number>;
  performMaintenance(): Promise<void>;
  updatePanelDegradation(): void;
  calculateDailyRevenue(electricityPrice?: number): number;
  estimateAnnualProduction(): number;
}

const SolarFarmSchema = new Schema<ISolarFarm>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Solar farm name is required'],
      trim: true,
      minlength: [3, 'Farm name must be at least 3 characters'],
      maxlength: [100, 'Farm name cannot exceed 100 characters'],
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
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Construction', 'Operational', 'Maintenance', 'Degraded', 'Decommissioned'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Construction',
      index: true,
    },
    installedCapacity: {
      type: Number,
      required: [true, 'Installed capacity is required'],
      min: [100, 'Capacity must be at least 100 kW'],
      max: [1000000, 'Capacity cannot exceed 1,000 MW (1,000,000 kW)'],
    },
    panelType: {
      type: String,
      required: [true, 'Panel type is required'],
      enum: {
        values: ['Monocrystalline', 'Polycrystalline', 'Thin-Film', 'Bifacial'],
        message: '{VALUE} is not a valid panel type',
      },
      index: true,
    },
    panelCount: {
      type: Number,
      required: [true, 'Panel count is required'],
      min: [100, 'Must have at least 100 panels'],
    },
    systemEfficiency: {
      type: Number,
      required: [true, 'System efficiency is required'],
      min: [10, 'System efficiency must be at least 10%'],
      max: [25, 'System efficiency cannot exceed 25%'],
      default: 18,
    },
    inverterEfficiency: {
      type: Number,
      required: [true, 'Inverter efficiency is required'],
      min: [85, 'Inverter efficiency must be at least 85%'],
      max: [99, 'Inverter efficiency cannot exceed 99%'],
      default: 96,
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
    panelDegradation: {
      type: Number,
      required: true,
      min: [0, 'Degradation cannot be negative'],
      max: [50, 'Degradation cannot exceed 50%'],
      default: 0,
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
      max: [0.50, 'Rate cannot exceed $0.50/kWh'],
    },
    operatingCost: {
      type: Number,
      required: [true, 'Operating cost is required'],
      min: [10, 'Operating cost must be at least $10/kW/year'],
      max: [50, 'Operating cost cannot exceed $50/kW/year'],
      default: 20,
    },
    batteryStorage: {
      type: {
        capacity: {
          type: Number,
          required: true,
          min: [100, 'Battery capacity must be at least 100 kWh'],
        },
        efficiency: {
          type: Number,
          required: true,
          min: [80, 'Battery efficiency must be at least 80%'],
          max: [95, 'Battery efficiency cannot exceed 95%'],
          default: 90,
        },
        currentCharge: {
          type: Number,
          required: true,
          min: [0, 'Current charge cannot be negative'],
          default: 0,
        },
        degradation: {
          type: Number,
          required: true,
          min: [0, 'Degradation cannot be negative'],
          max: [30, 'Degradation cannot exceed 30%'],
          default: 0,
        },
        lastMaintenance: {
          type: Date,
          required: true,
          default: Date.now,
        },
      },
    },
    gridConnection: {
      type: {
        utilityCompany: {
          type: String,
          required: true,
          trim: true,
        },
        connectionCapacity: {
          type: Number,
          required: true,
          min: [0.1, 'Connection capacity must be at least 0.1 MW'],
        },
        feedInTariff: {
          type: Number,
          required: true,
          min: [0, 'Feed-in tariff cannot be negative'],
          max: [0.30, 'Feed-in tariff cannot exceed $0.30/kWh'],
        },
        netMeteringEnabled: {
          type: Boolean,
          required: true,
          default: true,
        },
      },
    },
  },
  {
    timestamps: true,
    collection: 'solarfarms',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index: unique farm name per company
SolarFarmSchema.index({ company: 1, name: 1 }, { unique: true });

// Index for geographic queries
SolarFarmSchema.index({ 'location.region': 1, status: 1 });
SolarFarmSchema.index({ panelType: 1, installedCapacity: 1 });

/**
 * Virtual: Years since commission
 */
SolarFarmSchema.virtual('yearsOperating').get(function (this: ISolarFarm) {
  const now = new Date();
  const commissioned = this.commissionDate;
  const diffTime = Math.abs(now.getTime() - commissioned.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
  
  return Math.round(diffYears * 10) / 10; // Round to 1 decimal
});

/**
 * Virtual: Effective capacity after degradation
 */
SolarFarmSchema.virtual('effectiveCapacity').get(function (this: ISolarFarm) {
  const degradationFactor = 1 - (this.panelDegradation / 100);
  return Math.round(this.installedCapacity * degradationFactor);
});

/**
 * Virtual: Capacity factor (actual vs theoretical production)
 * 
 * Typical values: 15-25% (solar operates ~6 hours/day average)
 */
SolarFarmSchema.virtual('capacityFactor').get(function (this: ISolarFarm) {
  if (this.yearsOperating === 0) return 0;
  
  const theoreticalAnnualProduction = this.installedCapacity * 365 * 24; // kWh if always on
  const actualAnnualProduction = this.cumulativeProduction / this.yearsOperating;
  
  const factor = (actualAnnualProduction / theoreticalAnnualProduction) * 100;
  return Math.round(factor * 10) / 10; // Round to 1 decimal
});

/**
 * Virtual: Check if maintenance is overdue (>180 days)
 */
SolarFarmSchema.virtual('maintenanceOverdue').get(function (this: ISolarFarm) {
  if (!this.lastMaintenance) return true; // Never maintained = overdue
  
  const now = new Date();
  const daysSinceMaintenance = (now.getTime() - this.lastMaintenance.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysSinceMaintenance > 180; // Bi-annual maintenance
});

/**
 * Calculate daily output based on weather conditions
 * 
 * Formula: installedCapacity × peakSunHours × systemEfficiency × weatherFactor × inverterEff × (1 - degradation)
 * 
 * Weather factors:
 * - Clear (0-20% cloud): 100% output
 * - Partly cloudy (20-50%): 70% output
 * - Mostly cloudy (50-80%): 40% output
 * - Overcast (80-100%): 15% output
 * 
 * Temperature impact: -0.4% per °C above 25°C
 * 
 * @param temperature - Ambient temperature in °F
 * @param cloudCover - Cloud cover percentage (0-100)
 * @param peakSunHours - Peak sun hours for the day (0-12)
 * @returns Daily energy production in kWh
 * 
 * @example
 * // 85°F, 30% cloud, 7 peak sun hours
 * const output = await farm.calculateDailyOutput(85, 30, 7);
 * // Returns: capacity × 7 × efficiency × 0.70 × inverterEff × tempFactor
 */
SolarFarmSchema.methods.calculateDailyOutput = async function (
  this: ISolarFarm,
  temperature: number,
  cloudCover: number,
  peakSunHours: number
): Promise<number> {
  if (this.status === 'Construction' || this.status === 'Decommissioned') {
    return 0;
  }
  
  if (peakSunHours <= 0) {
    return 0; // Night time or no sun
  }
  
  // Weather impact on output
  let weatherFactor = 1.0;
  if (cloudCover < 20) {
    weatherFactor = 1.0; // Clear
  } else if (cloudCover < 50) {
    weatherFactor = 0.7; // Partly cloudy
  } else if (cloudCover < 80) {
    weatherFactor = 0.4; // Mostly cloudy
  } else {
    weatherFactor = 0.15; // Overcast
  }
  
  // Temperature coefficient: -0.4% per °C above 25°C (77°F)
  const tempCelsius = (temperature - 32) * 5/9;
  const tempDelta = tempCelsius - 25;
  const tempFactor = tempDelta > 0 ? 1 - (tempDelta * 0.004) : 1.0;
  
  // Degradation factor
  const degradationFactor = 1 - (this.panelDegradation / 100);
  
  // Calculate output: capacity × sun hours × efficiency × weather × temp × inverter × degradation
  const baseOutput = this.installedCapacity * peakSunHours;
  const systemFactor = (this.systemEfficiency / 100) * (this.inverterEfficiency / 100);
  
  let output = baseOutput * systemFactor * weatherFactor * tempFactor * degradationFactor;
  
  // Update current output and daily production
  this.currentOutput = Math.round(output / peakSunHours); // kW current
  this.dailyProduction = Math.round(output); // kWh for the day
  this.cumulativeProduction += this.dailyProduction;
  
  // Check degradation status
  if (this.panelDegradation > 30 && this.status === 'Operational') {
    this.status = 'Degraded';
  }
  
  await this.save();
  
  return this.dailyProduction;
};

/**
 * Perform maintenance on solar farm
 * 
 * - Cleans panels (restores 2-5% lost efficiency)
 * - Checks inverters and electrical systems
 * - Updates lastMaintenance timestamp
 * - Resets status from Maintenance to Operational
 * 
 * @throws Error if farm is Decommissioned
 * 
 * @example
 * await farm.performMaintenance();
 * // Panel cleaning → +3% efficiency recovery
 * // Inverter check → optimize efficiency
 * // lastMaintenance → now
 */
SolarFarmSchema.methods.performMaintenance = async function (
  this: ISolarFarm
): Promise<void> {
  if (this.status === 'Decommissioned') {
    throw new Error('Cannot maintain decommissioned farm');
  }
  
  // Panel cleaning restores 2-5% lost efficiency
  const efficiencyRecovery = Math.random() * 3 + 2; // 2-5%
  this.panelDegradation = Math.max(0, this.panelDegradation - efficiencyRecovery);
  
  // Inverter efficiency check (restore to optimal)
  this.inverterEfficiency = Math.min(98, this.inverterEfficiency + 1);
  
  // Update maintenance timestamp
  this.lastMaintenance = new Date();
  
  // Change status back to Operational if in Maintenance mode
  if (this.status === 'Maintenance') {
    this.status = 'Operational';
  }
  
  // Check if still degraded after maintenance
  if (this.status === 'Degraded' && this.panelDegradation <= 20) {
    this.status = 'Operational';
  }
  
  await this.save();
};

/**
 * Update panel degradation based on time
 * 
 * Panels degrade 0.5% per year on average.
 * Accelerated degradation in extreme climates (hot/humid).
 */
SolarFarmSchema.methods.updatePanelDegradation = function (this: ISolarFarm): void {
  const yearsActive = this.yearsOperating;
  const annualDegradation = 0.5; // 0.5% per year typical
  
  this.panelDegradation = Math.min(50, yearsActive * annualDegradation);
};

/**
 * Calculate daily revenue from electricity production
 * 
 * Formula: (dailyProduction × electricityRate) + (excessProduction × feedInTariff)
 * 
 * If battery storage exists, excess goes to battery first, then grid.
 * If grid connection exists, feed-in tariff applied to excess.
 * 
 * @param electricityPrice - Optional override price (uses default rate if not provided)
 * @returns Daily revenue in dollars
 * 
 * @example
 * const revenue = farm.calculateDailyRevenue(0.15);
 * // 100,000 kWh × $0.15 = $15,000/day
 */
SolarFarmSchema.methods.calculateDailyRevenue = function (
  this: ISolarFarm,
  electricityPrice?: number
): number {
  if (this.status !== 'Operational' && this.status !== 'Degraded') {
    return 0;
  }
  
  const rate = electricityPrice || this.electricityRate;
  let revenue = this.dailyProduction * rate;
  
  // If grid connection with feed-in tariff, add bonus for excess
  if (this.gridConnection && this.gridConnection.feedInTariff > 0) {
    // Assume 30% goes to grid as excess during peak production
    const excessProduction = this.dailyProduction * 0.3;
    revenue += excessProduction * this.gridConnection.feedInTariff;
  }
  
  // Subtract daily operating cost
  const dailyOperatingCost = (this.operatingCost * this.installedCapacity) / 365;
  revenue -= dailyOperatingCost;
  
  return Math.round(revenue * 100) / 100; // Round to cents
};

/**
 * Estimate annual production
 * 
 * Uses capacity factor or calculates from typical sun hours (5-6 hours average).
 * 
 * @returns Estimated annual production in kWh
 */
SolarFarmSchema.methods.estimateAnnualProduction = function (this: ISolarFarm): number {
  const avgPeakSunHours = 5.5; // Average across seasons
  const avgWeatherFactor = 0.8; // Account for clouds, rain
  const systemFactor = (this.systemEfficiency / 100) * (this.inverterEfficiency / 100);
  const degradationFactor = 1 - (this.panelDegradation / 100);
  
  const annualProduction = this.installedCapacity * avgPeakSunHours * 365 * systemFactor * avgWeatherFactor * degradationFactor;
  
  return Math.round(annualProduction);
};

/**
 * Pre-save hook: Auto-update panel degradation
 */
SolarFarmSchema.pre('save', function (next) {
  if (this.isModified('commissionDate') || this.isNew) {
    this.updatePanelDegradation();
  }
  next();
});

const SolarFarm: Model<ISolarFarm> =
  mongoose.models.SolarFarm || mongoose.model<ISolarFarm>('SolarFarm', SolarFarmSchema);

export default SolarFarm;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. WEATHER-BASED OUTPUT:
 *    - Clear sky (0-20% cloud): 100% output
 *    - Partly cloudy (20-50%): 70% output
 *    - Mostly cloudy (50-80%): 40% output
 *    - Overcast (80-100%): 15% output
 *    - Peak sun hours: 0-12 (location dependent)
 * 
 * 2. TEMPERATURE COEFFICIENT:
 *    - Reference temperature: 25°C (77°F)
 *    - Efficiency loss: -0.4% per °C above reference
 *    - Example: 35°C → -4% efficiency
 *    - Higher temperatures reduce panel efficiency
 * 
 * 3. PANEL DEGRADATION:
 *    - Annual rate: 0.5% per year typical
 *    - 20-year lifespan: ~10% total degradation
 *    - Accelerated in extreme climates
 *    - Maintenance can recover 2-5% lost efficiency
 * 
 * 4. PANEL TYPES:
 *    - Monocrystalline: 18-22% efficiency, premium cost
 *    - Polycrystalline: 15-17% efficiency, standard cost
 *    - Thin-Film: 10-13% efficiency, performs well in heat
 *    - Bifacial: 20-24% efficiency, captures both sides
 * 
 * 5. CAPACITY FACTOR:
 *    - Typical range: 15-25%
 *    - Solar operates ~6 hours/day average
 *    - Best locations: 20-25% (Arizona, Nevada)
 *    - Poor locations: 12-18% (cloudy regions)
 * 
 * 6. ENERGY STORAGE:
 *    - Battery capacity: 100-10,000 kWh typical
 *    - Round-trip efficiency: 85-95%
 *    - Battery degradation: ~1-2% per year
 *    - Stores excess for night/peak demand
 * 
 * 7. GRID CONNECTION:
 *    - Feed-in tariff: $0.05-$0.30/kWh for excess
 *    - Net metering: Credit for excess production
 *    - Connection capacity: Limits export rate
 *    - Utility company contracts
 * 
 * 8. OPERATING COSTS:
 *    - $10-$30/kW/year typical
 *    - Includes: Panel cleaning, inverter maintenance
 *    - Bi-annual maintenance recommended
 *    - Insurance, property taxes, monitoring
 * 
 * 9. REVENUE STREAMS:
 *    - Electricity sales: Primary revenue
 *    - Feed-in tariff: Bonus for excess production
 *    - Green certificates: Environmental credits
 *    - Grid services: Frequency regulation, reserves
 * 
 * 10. LIFECYCLE STATES:
 *     - Construction: Under development, no production
 *     - Operational: Normal operation, >70% capacity
 *     - Maintenance: Temporary shutdown for repairs
 *     - Degraded: Operating below 70% capacity
 *     - Decommissioned: Permanently closed
 */
