/**
 * @file src/lib/db/models/OilWell.ts
 * @description Oil well schema for Energy Industry - Oil & Gas extraction operations
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * Oil well model representing individual drilling sites with extraction mechanics,
 * depletion calculations, maintenance scheduling, and production optimization.
 * Supports conventional, unconventional, offshore, and shale oil extraction methods
 * with realistic production decline curves and operational costs.
 * 
 * KEY FEATURES:
 * - Extraction rate formulas with depletion modeling
 * - Multiple well types (Conventional, Unconventional, Offshore, Shale)
 * - Maintenance scheduling with production impact
 * - Equipment degradation tracking
 * - Weather impact on offshore platforms
 * - Commodity price integration
 * - Daily revenue/cost calculations
 * 
 * BUSINESS LOGIC:
 * - Production follows logarithmic decline curve
 * - Depletion rate: 2-15% per year depending on well type
 * - Maintenance required every 90 days (quarterly)
 * - Equipment efficiency degrades 0.5% per month without maintenance
 * - Offshore wells affected by weather (storms reduce production 40-80%)
 * - Revenue = (currentProduction × oilPrice) - (currentProduction × extractionCost)
 * - Well becomes depleted when reserves < 1000 barrels
 * 
 * EXTRACTION MECHANICS:
 * - Peak production typically at commission date
 * - Production declines based on well type and depletion rate
 * - Formula: currentProduction = peakProduction × (1 - depletionRate)^(daysActive/365)
 * - Maintenance can restore 5-15% of lost production capacity
 * - Deep wells (>10,000 ft) have higher extraction costs but larger reserves
 * 
 * USAGE:
 * ```typescript
 * import OilWell from '@/lib/db/models/OilWell';
 * 
 * // Create oil well
 * const well = await OilWell.create({
 *   company: companyId,
 *   name: 'West Texas Site Alpha-1',
 *   location: {
 *     latitude: 31.9686,
 *     longitude: -102.0779,
 *     region: 'Permian Basin'
 *   },
 *   wellType: 'Shale',
 *   reserveEstimate: 500000,
 *   peakProduction: 1200,
 *   depletionRate: 8.5,
 *   extractionCost: 35,
 *   depth: 12500
 * });
 * 
 * // Calculate daily production
 * const production = await well.calculateProduction();
 * 
 * // Perform maintenance
 * await well.performMaintenance();
 * 
 * // Calculate daily revenue
 * const revenue = await well.calculateDailyRevenue(75.50); // $75.50/barrel
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/**
 * Oil well types with different characteristics
 */
export type WellType = 
  | 'Conventional'      // Traditional vertical wells (low depletion, moderate cost)
  | 'Unconventional'    // Hydraulic fracturing (higher depletion, high initial output)
  | 'Offshore'          // Ocean platforms (highest cost, weather dependent)
  | 'Shale';            // Horizontal drilling (very high depletion, high cost)

/**
 * Well operational status
 */
export type WellStatus = 
  | 'Drilling'          // Under construction, no production
  | 'Active'            // Producing oil
  | 'Depleted'          // Reserves exhausted (<1000 barrels)
  | 'Maintenance'       // Temporarily offline for repairs
  | 'Abandoned';        // Permanently closed

/**
 * Geographic location data
 */
export interface WellLocation {
  latitude: number;      // Geographic latitude (-90 to 90)
  longitude: number;     // Geographic longitude (-180 to 180)
  region: string;        // Basin/field name (e.g., "Permian Basin", "North Sea")
}

/**
 * Equipment tracking
 */
export interface Equipment {
  type: 'Pump' | 'Pipe' | 'Storage' | 'Compressor' | 'Separator';
  name: string;
  efficiency: number;    // Current efficiency (0-100%)
  lastMaintenance: Date;
  cost: number;          // Replacement/maintenance cost
}

/**
 * Oil well document interface
 */
export interface IOilWell extends Document {
  company: Types.ObjectId;
  name: string;
  location: WellLocation;
  wellType: WellType;
  status: WellStatus;
  
  // Reserve & production metrics
  reserveEstimate: number;       // Estimated barrels remaining
  currentProduction: number;     // Barrels per day current rate
  peakProduction: number;        // Barrels per day maximum capacity
  depletionRate: number;         // Percentage per year (2-15%)
  extractionCost: number;        // Cost per barrel to extract
  
  // Operational tracking
  lastMaintenance?: Date;
  commissionDate: Date;          // Date well started production
  depth: number;                 // Well depth in feet
  equipment: Equipment[];        // Installed equipment
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  daysActive: number;
  remainingLifeYears: number;
  dailyRevenue: number;
  maintenanceOverdue: boolean;
  
  // Instance methods
  calculateProduction(): Promise<number>;
  performMaintenance(): Promise<void>;
  estimateReserves(): number;
  calculateDailyRevenue(oilPrice: number): number;
  applyWeatherImpact(severityPercent: number): number;
  updateEquipmentEfficiency(): void;
}

const OilWellSchema = new Schema<IOilWell>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Well name is required'],
      trim: true,
      minlength: [3, 'Well name must be at least 3 characters'],
      maxlength: [100, 'Well name cannot exceed 100 characters'],
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
    wellType: {
      type: String,
      required: [true, 'Well type is required'],
      enum: {
        values: ['Conventional', 'Unconventional', 'Offshore', 'Shale'],
        message: '{VALUE} is not a valid well type',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Drilling', 'Active', 'Depleted', 'Maintenance', 'Abandoned'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Drilling',
      index: true,
    },
    reserveEstimate: {
      type: Number,
      required: [true, 'Reserve estimate is required'],
      min: [0, 'Reserve estimate cannot be negative'],
    },
    currentProduction: {
      type: Number,
      required: [true, 'Current production is required'],
      min: [0, 'Current production cannot be negative'],
      default: 0,
    },
    peakProduction: {
      type: Number,
      required: [true, 'Peak production is required'],
      min: [100, 'Peak production must be at least 100 barrels/day'],
      max: [50000, 'Peak production cannot exceed 50,000 barrels/day'],
    },
    depletionRate: {
      type: Number,
      required: [true, 'Depletion rate is required'],
      min: [2, 'Depletion rate must be at least 2% per year'],
      max: [15, 'Depletion rate cannot exceed 15% per year'],
    },
    extractionCost: {
      type: Number,
      required: [true, 'Extraction cost is required'],
      min: [10, 'Extraction cost must be at least $10/barrel'],
      max: [100, 'Extraction cost cannot exceed $100/barrel'],
    },
    lastMaintenance: {
      type: Date,
    },
    commissionDate: {
      type: Date,
      required: [true, 'Commission date is required'],
      default: Date.now,
    },
    depth: {
      type: Number,
      required: [true, 'Well depth is required'],
      min: [1000, 'Well depth must be at least 1,000 feet'],
      max: [30000, 'Well depth cannot exceed 30,000 feet'],
    },
    equipment: [
      {
        type: {
          type: String,
          required: true,
          enum: ['Pump', 'Pipe', 'Storage', 'Compressor', 'Separator'],
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        efficiency: {
          type: Number,
          required: true,
          min: [0, 'Efficiency must be between 0 and 100'],
          max: [100, 'Efficiency must be between 0 and 100'],
          default: 100,
        },
        lastMaintenance: {
          type: Date,
          required: true,
          default: Date.now,
        },
        cost: {
          type: Number,
          required: true,
          min: [0, 'Equipment cost cannot be negative'],
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: 'oilwells',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index: unique well name per company
OilWellSchema.index({ company: 1, name: 1 }, { unique: true });

// Index for geographic queries
OilWellSchema.index({ 'location.region': 1, wellType: 1 });
OilWellSchema.index({ status: 1, company: 1 });

/**
 * Virtual: Days since commission (well age in days)
 */
OilWellSchema.virtual('daysActive').get(function (this: IOilWell) {
  const now = new Date();
  const commissioned = this.commissionDate;
  const diffTime = Math.abs(now.getTime() - commissioned.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

/**
 * Virtual: Estimated remaining life in years
 * 
 * Formula: (reserveEstimate / currentProduction) / 365
 * Returns 0 if production is 0 or well is depleted
 */
OilWellSchema.virtual('remainingLifeYears').get(function (this: IOilWell) {
  if (this.currentProduction === 0 || this.status === 'Depleted') return 0;
  
  const daysRemaining = this.reserveEstimate / this.currentProduction;
  const yearsRemaining = daysRemaining / 365;
  
  return Math.max(0, Math.round(yearsRemaining * 10) / 10); // Round to 1 decimal
});

/**
 * Virtual: Check if maintenance is overdue (>90 days)
 */
OilWellSchema.virtual('maintenanceOverdue').get(function (this: IOilWell) {
  if (!this.lastMaintenance) return true; // Never maintained = overdue
  
  const now = new Date();
  const daysSinceMaintenance = (now.getTime() - this.lastMaintenance.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysSinceMaintenance > 90;
});

/**
 * Calculate current daily production with depletion
 * 
 * Formula: peakProduction × (1 - depletionRate/100)^(daysActive/365)
 * 
 * Applies logarithmic decline curve to model realistic production degradation.
 * Also factors in equipment efficiency (average of all equipment).
 * 
 * @returns Current barrels per day production
 * 
 * @example
 * // Well with 1000 bbl/day peak, 8% depletion, 365 days active
 * const production = await well.calculateProduction();
 * // Returns: 1000 × (1 - 0.08)^1 × avgEquipmentEff = ~920 bbl/day
 */
OilWellSchema.methods.calculateProduction = async function (
  this: IOilWell
): Promise<number> {
  if (this.status === 'Drilling' || this.status === 'Abandoned') {
    return 0;
  }
  
  if (this.status === 'Depleted') {
    return 0;
  }
  
  // Calculate years active
  const yearsActive = this.daysActive / 365;
  
  // Apply depletion formula: peak × (1 - rate)^years
  const depletionFactor = Math.pow(1 - this.depletionRate / 100, yearsActive);
  let production = this.peakProduction * depletionFactor;
  
  // Factor in equipment efficiency
  if (this.equipment.length > 0) {
    const avgEfficiency = this.equipment.reduce((sum, eq) => sum + eq.efficiency, 0) / this.equipment.length;
    production = production * (avgEfficiency / 100);
  }
  
  // Update current production
  this.currentProduction = Math.round(production);
  
  // Check if well is depleted
  if (this.reserveEstimate < 1000) {
    this.status = 'Depleted';
    this.currentProduction = 0;
  }
  
  await this.save();
  
  return this.currentProduction;
};

/**
 * Perform maintenance on oil well
 * 
 * - Restores equipment efficiency to 100%
 * - Increases production by 5-15% (random recovery)
 * - Updates lastMaintenance timestamp
 * - Changes status from Maintenance back to Active
 * 
 * @throws Error if well is Abandoned or Depleted
 * 
 * @example
 * await well.performMaintenance();
 * // Equipment efficiency → 100%
 * // Production boost: +8% (random 5-15%)
 * // lastMaintenance → now
 */
OilWellSchema.methods.performMaintenance = async function (
  this: IOilWell
): Promise<void> {
  if (this.status === 'Abandoned') {
    throw new Error('Cannot maintain abandoned well');
  }
  
  if (this.status === 'Depleted') {
    throw new Error('Cannot maintain depleted well');
  }
  
  // Restore all equipment to 100% efficiency
  this.equipment.forEach((eq) => {
    eq.efficiency = 100;
    eq.lastMaintenance = new Date();
  });
  
  // Production boost from maintenance (5-15% recovery)
  const boostFactor = 1 + (Math.random() * 0.10 + 0.05); // 1.05 to 1.15
  this.currentProduction = Math.round(this.currentProduction * boostFactor);
  
  // Cap at peak production
  this.currentProduction = Math.min(this.currentProduction, this.peakProduction);
  
  // Update maintenance timestamp
  this.lastMaintenance = new Date();
  
  // Change status back to Active if in Maintenance mode
  if (this.status === 'Maintenance') {
    this.status = 'Active';
  }
  
  await this.save();
};

/**
 * Estimate reserves based on geological data
 * 
 * Uses well depth and type to estimate remaining reserves.
 * Deep wells and offshore platforms have larger reserve estimates.
 * 
 * Formula:
 * - Conventional: depth × 40 barrels/foot
 * - Unconventional: depth × 50 barrels/foot
 * - Offshore: depth × 60 barrels/foot
 * - Shale: depth × 45 barrels/foot
 * 
 * @returns Estimated barrels remaining
 */
OilWellSchema.methods.estimateReserves = function (this: IOilWell): number {
  const multipliers = {
    Conventional: 40,
    Unconventional: 50,
    Offshore: 60,
    Shale: 45,
  };
  
  const multiplier = multipliers[this.wellType];
  const estimate = this.depth * multiplier;
  
  // Update reserve estimate
  this.reserveEstimate = estimate;
  
  return estimate;
};

/**
 * Calculate daily revenue from oil production
 * 
 * Formula: (currentProduction × oilPrice) - (currentProduction × extractionCost)
 * 
 * @param oilPrice - Current oil price per barrel (e.g., $75.50)
 * @returns Daily revenue in dollars
 * 
 * @example
 * const revenue = well.calculateDailyRevenue(75.50);
 * // 1000 bbl/day × $75.50 = $75,500 revenue
 * // 1000 bbl/day × $35 = $35,000 cost
 * // Net: $40,500/day
 */
OilWellSchema.methods.calculateDailyRevenue = function (
  this: IOilWell,
  oilPrice: number
): number {
  if (this.status !== 'Active' || this.currentProduction === 0) {
    return 0;
  }
  
  const revenue = this.currentProduction * oilPrice;
  const cost = this.currentProduction * this.extractionCost;
  const netRevenue = revenue - cost;
  
  return Math.round(netRevenue * 100) / 100; // Round to cents
};

/**
 * Apply weather impact to offshore platforms
 * 
 * Reduces production by severity percentage for offshore wells.
 * No effect on non-offshore wells.
 * 
 * @param severityPercent - Storm severity (0-100, e.g., 60 for 60% reduction)
 * @returns Reduced production amount
 * 
 * @example
 * // Hurricane hits offshore platform
 * const reducedProduction = well.applyWeatherImpact(70);
 * // Normal: 1000 bbl/day
 * // Storm: 300 bbl/day (70% reduction)
 */
OilWellSchema.methods.applyWeatherImpact = function (
  this: IOilWell,
  severityPercent: number
): number {
  if (this.wellType !== 'Offshore') {
    return this.currentProduction; // No weather impact on land-based wells
  }
  
  const reductionFactor = severityPercent / 100;
  const reducedProduction = this.currentProduction * (1 - reductionFactor);
  
  return Math.round(reducedProduction);
};

/**
 * Update equipment efficiency based on time since last maintenance
 * 
 * Equipment degrades 0.5% per month without maintenance.
 * Minimum efficiency: 50% (cannot go lower).
 */
OilWellSchema.methods.updateEquipmentEfficiency = function (this: IOilWell): void {
  const now = new Date();
  
  this.equipment.forEach((eq) => {
    const monthsSinceMaintenance = (now.getTime() - eq.lastMaintenance.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const degradation = monthsSinceMaintenance * 0.5; // 0.5% per month
    
    eq.efficiency = Math.max(50, 100 - degradation); // Minimum 50% efficiency
  });
};

/**
 * Pre-save hook: Auto-update equipment efficiency
 */
OilWellSchema.pre('save', function (next) {
  this.updateEquipmentEfficiency();
  next();
});

/**
 * Pre-save hook: Auto-deplete reserves based on production
 */
OilWellSchema.pre('save', async function (next) {
  if (this.isModified('currentProduction') && this.status === 'Active') {
    // Subtract daily production from reserves
    this.reserveEstimate = Math.max(0, this.reserveEstimate - this.currentProduction);
    
    // Check depletion threshold
    if (this.reserveEstimate < 1000) {
      this.status = 'Depleted';
      this.currentProduction = 0;
    }
  }
  
  next();
});

const OilWell: Model<IOilWell> =
  mongoose.models.OilWell || mongoose.model<IOilWell>('OilWell', OilWellSchema);

export default OilWell;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. EXTRACTION MECHANICS:
 *    - Production follows logarithmic decline curve (realistic modeling)
 *    - Formula: peak × (1 - depletionRate)^yearsActive
 *    - Equipment efficiency multiplier applied
 *    - Deep wells (>10,000 ft) justify higher reserves
 * 
 * 2. DEPLETION RATES BY WELL TYPE:
 *    - Conventional: 2-4% per year (slowest decline)
 *    - Unconventional: 6-10% per year (moderate decline)
 *    - Offshore: 4-8% per year (moderate, weather dependent)
 *    - Shale: 10-15% per year (fastest decline, high initial output)
 * 
 * 3. MAINTENANCE SYSTEM:
 *    - Required every 90 days (quarterly schedule)
 *    - Restores equipment to 100% efficiency
 *    - Provides 5-15% production boost (random recovery)
 *    - Overdue maintenance triggers warnings
 * 
 * 4. EQUIPMENT DEGRADATION:
 *    - 0.5% efficiency loss per month without maintenance
 *    - Minimum efficiency: 50% (cannot drop below)
 *    - Affects production calculations
 *    - Types: Pump, Pipe, Storage, Compressor, Separator
 * 
 * 5. WEATHER IMPACT:
 *    - Only affects offshore platforms
 *    - Storm severity: 40-80% production reduction
 *    - Land-based wells unaffected
 *    - Event-driven (triggered by game mechanics)
 * 
 * 6. REVENUE CALCULATION:
 *    - Revenue = (production × oilPrice) - (production × extractionCost)
 *    - Oil price varies by global market (OPEC events)
 *    - Extraction cost: $10-$100/barrel depending on well type
 *    - Deep offshore wells: $60-$100/barrel
 *    - Conventional wells: $10-$30/barrel
 * 
 * 7. RESERVE ESTIMATION:
 *    - Based on well depth and type
 *    - Offshore wells have highest reserves (60 bbl/ft)
 *    - Conventional wells lowest (40 bbl/ft)
 *    - Depleted threshold: <1000 barrels remaining
 * 
 * 8. LIFECYCLE STATES:
 *    - Drilling: Under construction, no production
 *    - Active: Normal operation, producing oil
 *    - Maintenance: Temporarily offline for repairs
 *    - Depleted: Reserves exhausted (<1000 barrels)
 *    - Abandoned: Permanently closed
 */
