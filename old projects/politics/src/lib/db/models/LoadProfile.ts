/**
 * @fileoverview LoadProfile Model - Electricity Demand Forecasting & Patterns
 * 
 * OVERVIEW:
 * Manages electricity demand profiles for regions, tracking hourly/daily/seasonal load curves,
 * peak load identification, load forecasting algorithms, and demand response programs. Enables
 * realistic electricity demand gameplay with time-of-day variations, seasonal patterns, and
 * demand-side management incentives.
 * 
 * KEY FEATURES:
 * - Hourly load curves (24 hours × 365 days)
 * - Daily patterns (weekday vs weekend, business vs residential)
 * - Seasonal variations (summer cooling, winter heating)
 * - Peak load tracking (daily, monthly, annual peaks)
 * - Load forecasting (1-day, 7-day, seasonal forecasts)
 * - Demand response programs (peak shaving, load shifting)
 * - Weather correlation (temperature-driven load)
 * - Special event modeling (holidays, extreme weather)
 * 
 * LOAD PATTERNS:
 * - Residential: Morning peak (7-9 AM), Evening peak (6-9 PM)
 * - Commercial: Business hours plateau (9 AM - 5 PM)
 * - Industrial: Constant base load with shift variations
 * - Summer peak: 2-6 PM (air conditioning)
 * - Winter peak: 6-9 AM, 5-8 PM (heating)
 * 
 * DEMAND RESPONSE PROGRAMS:
 * - Time-of-Use pricing: Higher rates during peak hours
 * - Critical Peak Pricing: Emergency high rates during grid stress
 * - Direct Load Control: Utility controls customer equipment (AC, water heaters)
 * - Interruptible Load: Large customers voluntarily curtail during emergencies
 * 
 * @created 2025-11-18
 * @updated 2025-11-18
 */

import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// ================== TYPES & ENUMS ==================

/**
 * Load profile types
 */
export type ProfileType =
  | 'Residential'  // Household electricity consumption
  | 'Commercial'   // Office buildings, retail, services
  | 'Industrial'   // Manufacturing, heavy industry
  | 'Mixed';       // Combined residential/commercial/industrial

/**
 * Season definitions
 */
export type Season =
  | 'Winter'  // Dec-Feb
  | 'Spring'  // Mar-May
  | 'Summer'  // Jun-Aug
  | 'Fall';   // Sep-Nov

/**
 * Day type
 */
export type DayType =
  | 'Weekday'   // Monday-Friday
  | 'Weekend'   // Saturday-Sunday
  | 'Holiday';  // Recognized holidays

/**
 * Demand response program types
 */
export type DRProgramType =
  | 'TimeOfUse'         // Variable pricing by time
  | 'CriticalPeak'      // Emergency peak pricing
  | 'DirectControl'     // Utility-controlled equipment
  | 'Interruptible';    // Voluntary curtailment

/**
 * Hourly load data point
 */
export interface IHourlyLoad {
  hour: number;           // 0-23
  loadMW: number;         // Load in MW
  temperature?: number;   // Temperature (°F) if weather-correlated
  forecast?: number;      // Forecasted load (MW)
}

/**
 * Demand response event
 */
export interface IDREvent {
  programType: DRProgramType;
  startTime: Date;
  endTime: Date;
  targetReductionMW: number;
  actualReductionMW?: number;
  participationRate: number;    // % of enrolled customers participating
  incentiveRate: number;        // $/MWh incentive
}

// ================== INTERFACE ==================

/**
 * LoadProfile document interface
 */
export interface ILoadProfile extends Document {
  // Core Identification
  _id: Types.ObjectId;
  region: string;             // Region name (e.g., "New York City")
  state: string;
  profileType: ProfileType;
  
  // Load Characteristics
  baseLoadMW: number;         // Minimum constant load
  peakLoadMW: number;         // Maximum observed load
  averageLoadMW: number;      // Average load
  currentLoadMW: number;      // Current real-time load
  loadFactor: number;         // Average / Peak (efficiency metric)
  
  // Temporal Patterns
  currentSeason: Season;
  currentDayType: DayType;
  hourlyProfile: IHourlyLoad[]; // 24-hour load curve
  
  // Peak Tracking
  dailyPeakMW: number;
  dailyPeakHour: number;      // Hour of daily peak (0-23)
  monthlyPeakMW: number;
  annualPeakMW: number;
  annualPeakDate?: Date;
  
  // Load Growth
  annualGrowthRate: number;   // % annual load growth
  populationServed: number;   // Number of customers/people
  perCapitaLoadKW: number;    // kW per person
  
  // Weather Correlation
  temperatureSensitive: boolean;
  heatingDegreeDays: number;  // Annual HDD
  coolingDegreeDays: number;  // Annual CDD
  weatherLoadImpact: number;  // % load variation due to weather
  
  // Forecasting
  oneDayForecastMW: number;   // Tomorrow's expected peak
  sevenDayForecastMW: number; // Next week's expected peak
  forecastAccuracy: number;   // % accuracy of past forecasts
  
  // Demand Response
  drProgramsActive: boolean;
  drEnrolledMW: number;       // Capacity enrolled in DR programs
  drEventsYTD: number;        // Number of DR events this year
  drEventHistory: IDREvent[];
  totalDRSavingsMWh: number;  // Cumulative DR savings
  
  // Costs
  averageRetailRate: number;  // $/MWh average retail electricity rate
  peakDemandCharge: number;   // $/kW-month demand charge
  
  // Methods
  updateCurrentLoad(loadMW: number, hour: number): Promise<ILoadProfile>;
  forecastLoad(hoursAhead: number, temperature?: number): number;
  calculateSeasonalPeak(season: Season): number;
  triggerDREvent(programType: DRProgramType, durationHours: number, targetReductionMW: number): Promise<ILoadProfile>;
  completeDREvent(eventId: number, actualReductionMW: number): Promise<ILoadProfile>;
  getLoadDuration(): { hours: number[]; loadMW: number[] }; // Load duration curve
  isPeakHour(hour: number): boolean;
  calculateLoadFactor(): number;
  getTypicalDayCurve(dayType: DayType, season: Season): IHourlyLoad[];
  getLoadMetrics(): {
    peak: number;
    average: number;
    loadFactor: number;
    drCapacity: number;
    forecast: number;
  };
}

// ================== SCHEMA ==================

const HourlyLoadSchema = new Schema<IHourlyLoad>(
  {
    hour: {
      type: Number,
      required: true,
      min: 0,
      max: 23,
    },
    loadMW: {
      type: Number,
      required: true,
      min: 0,
    },
    temperature: {
      type: Number,
      default: undefined,
    },
    forecast: {
      type: Number,
      default: undefined,
    },
  },
  { _id: false }
);

const DREventSchema = new Schema<IDREvent>(
  {
    programType: {
      type: String,
      enum: ['TimeOfUse', 'CriticalPeak', 'DirectControl', 'Interruptible'],
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    targetReductionMW: {
      type: Number,
      required: true,
      min: 0,
    },
    actualReductionMW: {
      type: Number,
      default: undefined,
      min: 0,
    },
    participationRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    incentiveRate: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const LoadProfileSchema = new Schema<ILoadProfile>(
  {
    region: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      index: true,
    },
    profileType: {
      type: String,
      enum: ['Residential', 'Commercial', 'Industrial', 'Mixed'],
      required: true,
      index: true,
    },
    
    // Load Characteristics
    baseLoadMW: {
      type: Number,
      required: true,
      min: 0,
    },
    peakLoadMW: {
      type: Number,
      required: true,
      min: 0,
    },
    averageLoadMW: {
      type: Number,
      required: true,
      min: 0,
    },
    currentLoadMW: {
      type: Number,
      default: 0,
      min: 0,
    },
    loadFactor: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    
    // Temporal Patterns
    currentSeason: {
      type: String,
      enum: ['Winter', 'Spring', 'Summer', 'Fall'],
      default: 'Summer',
    },
    currentDayType: {
      type: String,
      enum: ['Weekday', 'Weekend', 'Holiday'],
      default: 'Weekday',
    },
    hourlyProfile: {
      type: [HourlyLoadSchema],
      default: [],
    },
    
    // Peak Tracking
    dailyPeakMW: {
      type: Number,
      default: 0,
      min: 0,
    },
    dailyPeakHour: {
      type: Number,
      default: 14, // 2 PM default
      min: 0,
      max: 23,
    },
    monthlyPeakMW: {
      type: Number,
      default: 0,
      min: 0,
    },
    annualPeakMW: {
      type: Number,
      default: 0,
      min: 0,
    },
    annualPeakDate: {
      type: Date,
      default: undefined,
    },
    
    // Load Growth
    annualGrowthRate: {
      type: Number,
      default: 1.5, // 1.5% per year
      min: -10,
      max: 20,
    },
    populationServed: {
      type: Number,
      required: true,
      min: 1,
    },
    perCapitaLoadKW: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Weather Correlation
    temperatureSensitive: {
      type: Boolean,
      default: true,
    },
    heatingDegreeDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    coolingDegreeDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    weatherLoadImpact: {
      type: Number,
      default: 15, // 15% load variation
      min: 0,
      max: 100,
    },
    
    // Forecasting
    oneDayForecastMW: {
      type: Number,
      default: 0,
      min: 0,
    },
    sevenDayForecastMW: {
      type: Number,
      default: 0,
      min: 0,
    },
    forecastAccuracy: {
      type: Number,
      default: 95, // 95% accuracy
      min: 0,
      max: 100,
    },
    
    // Demand Response
    drProgramsActive: {
      type: Boolean,
      default: false,
    },
    drEnrolledMW: {
      type: Number,
      default: 0,
      min: 0,
    },
    drEventsYTD: {
      type: Number,
      default: 0,
      min: 0,
    },
    drEventHistory: {
      type: [DREventSchema],
      default: [],
    },
    totalDRSavingsMWh: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Costs
    averageRetailRate: {
      type: Number,
      default: 100, // $100/MWh
      min: 0,
    },
    peakDemandCharge: {
      type: Number,
      default: 15, // $15/kW-month
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'loadprofiles',
  }
);

// ================== INDEXES ==================

LoadProfileSchema.index({ region: 1, state: 1 });
LoadProfileSchema.index({ profileType: 1, peakLoadMW: -1 });
LoadProfileSchema.index({ state: 1, currentSeason: 1 });

// ================== HELPER FUNCTIONS ==================

/**
 * Get typical load curve shape for profile type
 */
function getTypicalCurve(profileType: ProfileType, season: Season): number[] {
  // Returns 24-hour curve as percentages of peak (0-100%)
  const curves = {
    Residential: {
      Summer: [40, 35, 35, 35, 40, 50, 65, 75, 70, 65, 65, 70, 75, 85, 95, 100, 95, 90, 90, 85, 75, 65, 55, 45],
      Winter: [60, 55, 55, 60, 70, 85, 95, 100, 90, 75, 70, 70, 75, 80, 85, 90, 95, 100, 95, 90, 85, 80, 75, 65],
      Spring: [45, 40, 40, 40, 45, 55, 70, 80, 75, 70, 70, 75, 80, 85, 90, 95, 90, 90, 85, 80, 75, 65, 55, 50],
      Fall: [45, 40, 40, 40, 45, 55, 70, 80, 75, 70, 70, 75, 80, 85, 90, 95, 90, 90, 85, 80, 75, 65, 55, 50],
    },
    Commercial: {
      Summer: [30, 25, 25, 25, 30, 40, 60, 80, 90, 95, 100, 100, 95, 95, 90, 85, 75, 60, 45, 40, 35, 30, 30, 30],
      Winter: [35, 30, 30, 30, 35, 45, 65, 85, 95, 100, 100, 95, 90, 85, 80, 75, 65, 50, 40, 35, 35, 35, 35, 35],
      Spring: [30, 25, 25, 25, 30, 40, 60, 80, 90, 95, 100, 100, 95, 90, 85, 80, 70, 55, 40, 35, 30, 30, 30, 30],
      Fall: [30, 25, 25, 25, 30, 40, 60, 80, 90, 95, 100, 100, 95, 90, 85, 80, 70, 55, 40, 35, 30, 30, 30, 30],
    },
    Industrial: {
      Summer: [85, 85, 85, 85, 85, 90, 95, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 95, 90, 90, 85, 85, 85, 85],
      Winter: [85, 85, 85, 85, 85, 90, 95, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 95, 90, 90, 85, 85, 85, 85],
      Spring: [85, 85, 85, 85, 85, 90, 95, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 95, 90, 90, 85, 85, 85, 85],
      Fall: [85, 85, 85, 85, 85, 90, 95, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 95, 90, 90, 85, 85, 85, 85],
    },
    Mixed: {
      Summer: [50, 45, 45, 45, 50, 60, 75, 85, 90, 90, 95, 95, 95, 95, 95, 100, 95, 85, 75, 70, 65, 55, 50, 50],
      Winter: [55, 50, 50, 50, 55, 65, 80, 90, 95, 95, 95, 95, 95, 95, 95, 100, 95, 85, 75, 70, 65, 60, 55, 55],
      Spring: [50, 45, 45, 45, 50, 60, 75, 85, 90, 90, 95, 95, 95, 95, 90, 90, 85, 75, 65, 60, 55, 50, 50, 50],
      Fall: [50, 45, 45, 45, 50, 60, 75, 85, 90, 90, 95, 95, 95, 95, 90, 90, 85, 75, 65, 60, 55, 50, 50, 50],
    },
  };
  
  return curves[profileType][season];
}

// ================== INSTANCE METHODS ==================

/**
 * Update current load and hourly profile
 * 
 * @param loadMW - Current load (MW)
 * @param hour - Current hour (0-23)
 * @returns Updated load profile
 * 
 * @example
 * await profile.updateCurrentLoad(850, 14); // 850 MW at 2 PM
 */
LoadProfileSchema.methods.updateCurrentLoad = async function(
  this: ILoadProfile,
  loadMW: number,
  hour: number
): Promise<ILoadProfile> {
  this.currentLoadMW = loadMW;
  
  // Update hourly profile
  const hourIndex = this.hourlyProfile.findIndex(h => h.hour === hour);
  if (hourIndex >= 0) {
    this.hourlyProfile[hourIndex].loadMW = loadMW;
  } else {
    this.hourlyProfile.push({ hour, loadMW });
  }
  
  // Update daily peak if new high
  if (loadMW > this.dailyPeakMW) {
    this.dailyPeakMW = loadMW;
    this.dailyPeakHour = hour;
  }
  
  // Update annual peak if new all-time high
  if (loadMW > this.annualPeakMW) {
    this.annualPeakMW = loadMW;
    this.annualPeakDate = new Date();
  }
  
  return this.save();
};

/**
 * Forecast load for hours ahead
 * 
 * @param hoursAhead - Hours to forecast (1-168)
 * @param temperature - Expected temperature (°F)
 * @returns Forecasted load (MW)
 * 
 * @example
 * const forecast = profile.forecastLoad(24, 95); // Tomorrow at 95°F
 */
LoadProfileSchema.methods.forecastLoad = function(
  this: ILoadProfile,
  hoursAhead: number,
  temperature?: number
): number {
  // Simple forecast: use typical curve + weather adjustment
  const targetHour = (new Date().getHours() + hoursAhead) % 24;
  const curve = getTypicalCurve(this.profileType, this.currentSeason);
  const baseLoad = this.peakLoadMW * (curve[targetHour] / 100);
  
  // Apply weather adjustment if temperature provided
  if (temperature && this.temperatureSensitive) {
    // Assume 1% load increase per degree above 75°F (cooling) or below 55°F (heating)
    let weatherAdjustment = 0;
    if (temperature > 75) {
      weatherAdjustment = (temperature - 75) * 0.01;
    } else if (temperature < 55) {
      weatherAdjustment = (55 - temperature) * 0.01;
    }
    
    const adjustedLoad = baseLoad * (1 + weatherAdjustment);
    return Math.min(this.peakLoadMW * 1.2, adjustedLoad); // Cap at 120% of peak
  }
  
  return baseLoad;
};

/**
 * Calculate expected seasonal peak load
 * 
 * @param season - Season to analyze
 * @returns Expected peak load (MW)
 * 
 * @example
 * const summerPeak = profile.calculateSeasonalPeak('Summer');
 */
LoadProfileSchema.methods.calculateSeasonalPeak = function(
  this: ILoadProfile,
  season: Season
): number {
  // Apply seasonal multipliers
  const seasonalMultipliers = {
    Summer: 1.0,    // Summer typically highest due to AC
    Winter: 0.95,   // Winter second highest (heating)
    Spring: 0.75,   // Spring moderate
    Fall: 0.80,     // Fall moderate-high
  };
  
  return this.peakLoadMW * seasonalMultipliers[season];
};

/**
 * Trigger demand response event
 * 
 * @param programType - DR program type
 * @param durationHours - Event duration
 * @param targetReductionMW - Target load reduction
 * @returns Updated load profile
 * 
 * @example
 * await profile.triggerDREvent('CriticalPeak', 4, 100);
 */
LoadProfileSchema.methods.triggerDREvent = async function(
  this: ILoadProfile,
  programType: DRProgramType,
  durationHours: number,
  targetReductionMW: number
): Promise<ILoadProfile> {
  if (!this.drProgramsActive) {
    throw new Error('No demand response programs active');
  }
  
  if (targetReductionMW > this.drEnrolledMW) {
    throw new Error(`Target reduction ${targetReductionMW} MW exceeds enrolled capacity ${this.drEnrolledMW} MW`);
  }
  
  // Create DR event
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
  
  // Estimate participation rate based on program type
  const participationRates = {
    TimeOfUse: 80,         // High participation (always on)
    CriticalPeak: 60,      // Moderate (emergency pricing)
    DirectControl: 90,     // Very high (automatic)
    Interruptible: 50,     // Lower (voluntary)
  };
  
  // Estimate incentive rate
  const incentiveRates = {
    TimeOfUse: 50,         // $50/MWh
    CriticalPeak: 200,     // $200/MWh (high emergency rate)
    DirectControl: 100,    // $100/MWh
    Interruptible: 150,    // $150/MWh
  };
  
  const drEvent: IDREvent = {
    programType,
    startTime,
    endTime,
    targetReductionMW,
    participationRate: participationRates[programType],
    incentiveRate: incentiveRates[programType],
  };
  
  this.drEventHistory.push(drEvent);
  this.drEventsYTD += 1;
  
  return this.save();
};

/**
 * Complete DR event with actual results
 * 
 * @param eventId - Index of event in history
 * @param actualReductionMW - Actual load reduction achieved
 * @returns Updated load profile
 * 
 * @example
 * await profile.completeDREvent(0, 85); // 85 MW reduction achieved
 */
LoadProfileSchema.methods.completeDREvent = async function(
  this: ILoadProfile,
  eventId: number,
  actualReductionMW: number
): Promise<ILoadProfile> {
  if (eventId >= this.drEventHistory.length) {
    throw new Error('Invalid DR event ID');
  }
  
  const event = this.drEventHistory[eventId];
  event.actualReductionMW = actualReductionMW;
  
  // Calculate energy savings (MWh)
  const durationHours = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60);
  const savingsMWh = actualReductionMW * durationHours;
  this.totalDRSavingsMWh += savingsMWh;
  
  return this.save();
};

/**
 * Get load duration curve
 * 
 * @returns Array of hours and corresponding loads sorted by load
 * 
 * @example
 * const ldc = profile.getLoadDuration();
 */
LoadProfileSchema.methods.getLoadDuration = function(this: ILoadProfile) {
  // Sort hourly loads from highest to lowest
  const sortedLoads = [...this.hourlyProfile]
    .sort((a, b) => b.loadMW - a.loadMW);
  
  return {
    hours: sortedLoads.map((_, i) => i),
    loadMW: sortedLoads.map(h => h.loadMW),
  };
};

/**
 * Check if hour is peak hour
 * 
 * @param hour - Hour to check (0-23)
 * @returns True if peak hour
 * 
 * @example
 * if (profile.isPeakHour(15)) { console.log('Peak pricing active'); }
 */
LoadProfileSchema.methods.isPeakHour = function(
  this: ILoadProfile,
  hour: number
): boolean {
  // Peak hours typically 12 PM - 8 PM (12-20)
  return hour >= 12 && hour <= 20;
};

/**
 * Calculate load factor
 * 
 * @returns Load factor (0-1)
 * 
 * @example
 * const loadFactor = profile.calculateLoadFactor(); // 0.75 = 75%
 */
LoadProfileSchema.methods.calculateLoadFactor = function(this: ILoadProfile): number {
  if (this.peakLoadMW === 0) return 0;
  return this.averageLoadMW / this.peakLoadMW;
};

/**
 * Get typical day curve for day type and season
 * 
 * @param dayType - Day type
 * @param season - Season
 * @returns 24-hour load curve
 * 
 * @example
 * const curve = profile.getTypicalDayCurve('Weekday', 'Summer');
 */
LoadProfileSchema.methods.getTypicalDayCurve = function(
  this: ILoadProfile,
  dayType: DayType,
  season: Season
): IHourlyLoad[] {
  const curve = getTypicalCurve(this.profileType, season);
  
  // Apply day type multiplier (weekends typically 85% of weekday load)
  const dayMultiplier = dayType === 'Weekend' ? 0.85 : (dayType === 'Holiday' ? 0.70 : 1.0);
  
  return curve.map((percent, hour) => ({
    hour,
    loadMW: this.peakLoadMW * (percent / 100) * dayMultiplier,
  }));
};

/**
 * Get comprehensive load metrics
 * 
 * @returns Load performance metrics
 * 
 * @example
 * const metrics = profile.getLoadMetrics();
 */
LoadProfileSchema.methods.getLoadMetrics = function(this: ILoadProfile) {
  return {
    peak: this.peakLoadMW,
    average: this.averageLoadMW,
    loadFactor: this.loadFactor,
    drCapacity: this.drEnrolledMW,
    forecast: this.oneDayForecastMW,
  };
};

// ================== PRE-SAVE HOOKS ==================

/**
 * Pre-save hook: Calculate load factor and per-capita load
 */
LoadProfileSchema.pre('save', function(this: ILoadProfile, next) {
  // Calculate load factor
  this.loadFactor = this.calculateLoadFactor();
  
  // Calculate per-capita load (convert MW to kW)
  this.perCapitaLoadKW = (this.averageLoadMW * 1000) / this.populationServed;
  
  // Generate 1-day forecast if not set
  if (this.oneDayForecastMW === 0) {
    this.oneDayForecastMW = this.forecastLoad(24);
  }
  
  // Generate 7-day forecast if not set
  if (this.sevenDayForecastMW === 0) {
    this.sevenDayForecastMW = this.forecastLoad(168);
  }
  
  next();
});

// ================== MODEL ==================

export const LoadProfile: Model<ILoadProfile> = 
  mongoose.models.LoadProfile || 
  mongoose.model<ILoadProfile>('LoadProfile', LoadProfileSchema);

export default LoadProfile;
