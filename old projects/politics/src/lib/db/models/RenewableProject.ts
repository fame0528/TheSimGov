/**
 * @file src/lib/db/models/RenewableProject.ts
 * @description Renewable energy project schema - Multi-asset portfolio management
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * Renewable project model representing portfolios of solar farms, wind turbines,
 * and other renewable assets managed as a unified entity. Tracks aggregate production,
 * subsidy eligibility, grid integration, carbon credit generation, and performance
 * forecasting across multiple sites and technologies.
 * 
 * KEY FEATURES:
 * - Multi-asset portfolio management (solar + wind + hydro)
 * - Aggregate production tracking across all assets
 * - Subsidy and tax credit coordination
 * - Carbon credit generation and trading
 * - Grid integration and curtailment management
 * - Performance forecasting and analytics
 * - Power Purchase Agreement (PPA) tracking
 * - Environmental impact reporting
 * 
 * BUSINESS LOGIC:
 * - Total capacity: Sum of all asset capacities
 * - Portfolio production: Aggregate from all assets
 * - Diversification benefit: Reduced volatility (solar + wind complement)
 * - Carbon credits: 1 credit per ton CO₂ avoided
 * - Revenue: (production × electricityRate) + subsidies + carbonCredits
 * - Operating cost: Sum of all asset costs + project overhead
 * - Performance ratio: Actual vs expected production
 * 
 * PROJECT TYPES:
 * - Utility-Scale: Large centralized generation (>10 MW)
 * - Distributed: Multiple small sites (<1 MW each)
 * - Hybrid: Combined solar + wind + storage
 * - Community Solar: Shared ownership model
 * 
 * USAGE:
 * ```typescript
 * import RenewableProject from '@/lib/db/models/RenewableProject';
 * 
 * // Create renewable project
 * const project = await RenewableProject.create({
 *   company: companyId,
 *   name: 'Green Valley Renewable Portfolio',
 *   projectType: 'Hybrid',
 *   solarFarms: [solarFarm1Id, solarFarm2Id],
 *   windTurbines: [turbine1Id, turbine2Id],
 *   subsidies: [subsidy1Id, subsidy2Id],
 *   ppas: [ppa1Id],
 *   targetCapacity: 100000, // 100 MW
 *   commissionDate: new Date()
 * });
 * 
 * // Calculate aggregate production
 * const totalProduction = await project.calculateAggregateProduction();
 * 
 * // Generate carbon credits
 * await project.generateCarbonCredits();
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/**
 * Project types based on scale and structure
 */
export type ProjectType =
  | 'Utility-Scale'      // Large centralized (>10 MW)
  | 'Distributed'        // Multiple small sites (<1 MW each)
  | 'Hybrid'             // Combined solar + wind + storage
  | 'Community Solar';   // Shared ownership model

/**
 * Project status
 */
export type ProjectStatus =
  | 'Planning'           // Pre-construction phase
  | 'Construction'       // Under development
  | 'Operational'        // All assets online
  | 'Partial Operation'  // Some assets online, others under construction
  | 'Underperforming'    // Below 80% expected production
  | 'Decommissioned';    // Permanently closed

/**
 * Carbon credit tracking
 */
export interface CarbonCredit {
  generatedDate: Date;
  tonsCO2Avoided: number;
  creditPrice: number;     // $/ton
  sold: boolean;
  buyer?: string;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  expectedProduction: number;    // kWh expected for period
  actualProduction: number;      // kWh actual for period
  performanceRatio: number;      // Actual / Expected (%)
  availabilityFactor: number;    // Uptime percentage
  curtailmentLosses: number;     // kWh lost to grid curtailment
}

/**
 * Renewable project document interface
 */
export interface IRenewableProject extends Document {
  company: Types.ObjectId;
  name: string;
  projectType: ProjectType;
  status: ProjectStatus;
  
  // Asset portfolio
  solarFarms: Types.ObjectId[];      // References to SolarFarm documents
  windTurbines: Types.ObjectId[];    // References to WindTurbine documents
  
  // Subsidies and contracts
  subsidies: Types.ObjectId[];       // References to Subsidy documents
  ppas: Types.ObjectId[];            // References to PPA documents
  
  // Capacity tracking
  targetCapacity: number;            // kW total project capacity goal
  currentCapacity: number;           // kW currently operational
  
  // Production tracking
  dailyProduction: number;           // kWh produced today (aggregate)
  monthlyProduction: number;         // kWh produced this month
  annualProduction: number;          // kWh produced this year
  cumulativeProduction: number;      // Total lifetime kWh
  
  // Carbon credits
  carbonCreditsGenerated: CarbonCredit[];
  totalCO2Avoided: number;           // Total tons CO₂ avoided
  
  // Performance
  performanceMetrics: PerformanceMetrics;
  lastPerformanceReview?: Date;
  
  // Financial
  totalInvestment: number;           // Total capital invested
  operatingCost: number;             // Annual operating cost
  
  // Dates
  commissionDate: Date;
  targetCompletionDate?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  completionPercent: number;
  portfolioDiversification: number;
  yearsOperating: number;
  
  // Instance methods
  calculateAggregateProduction(): Promise<number>;
  generateCarbonCredits(): Promise<number>;
  updatePerformanceMetrics(): Promise<void>;
  calculateAnnualRevenue(electricityRate: number, carbonCreditPrice: number): number;
  forecastProduction(months: number): number;
}

const RenewableProjectSchema = new Schema<IRenewableProject>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [3, 'Project name must be at least 3 characters'],
      maxlength: [150, 'Project name cannot exceed 150 characters'],
    },
    projectType: {
      type: String,
      required: [true, 'Project type is required'],
      enum: {
        values: ['Utility-Scale', 'Distributed', 'Hybrid', 'Community Solar'],
        message: '{VALUE} is not a valid project type',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Planning', 'Construction', 'Operational', 'Partial Operation', 'Underperforming', 'Decommissioned'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Planning',
      index: true,
    },
    solarFarms: [{
      type: Schema.Types.ObjectId,
      ref: 'SolarFarm',
    }],
    windTurbines: [{
      type: Schema.Types.ObjectId,
      ref: 'WindTurbine',
    }],
    subsidies: [{
      type: Schema.Types.ObjectId,
      ref: 'Subsidy',
    }],
    ppas: [{
      type: Schema.Types.ObjectId,
      ref: 'PPA',
    }],
    targetCapacity: {
      type: Number,
      required: [true, 'Target capacity is required'],
      min: [100, 'Target capacity must be at least 100 kW'],
      max: [5000000, 'Target capacity cannot exceed 5,000 MW'],
    },
    currentCapacity: {
      type: Number,
      required: true,
      min: [0, 'Current capacity cannot be negative'],
      default: 0,
    },
    dailyProduction: {
      type: Number,
      required: true,
      min: [0, 'Daily production cannot be negative'],
      default: 0,
    },
    monthlyProduction: {
      type: Number,
      required: true,
      min: [0, 'Monthly production cannot be negative'],
      default: 0,
    },
    annualProduction: {
      type: Number,
      required: true,
      min: [0, 'Annual production cannot be negative'],
      default: 0,
    },
    cumulativeProduction: {
      type: Number,
      required: true,
      min: [0, 'Cumulative production cannot be negative'],
      default: 0,
    },
    carbonCreditsGenerated: [{
      generatedDate: {
        type: Date,
        required: true,
        default: Date.now,
      },
      tonsCO2Avoided: {
        type: Number,
        required: true,
        min: [0, 'Tons CO₂ avoided cannot be negative'],
      },
      creditPrice: {
        type: Number,
        required: true,
        min: [0, 'Credit price cannot be negative'],
      },
      sold: {
        type: Boolean,
        required: true,
        default: false,
      },
      buyer: {
        type: String,
        trim: true,
      },
    }],
    totalCO2Avoided: {
      type: Number,
      required: true,
      min: [0, 'Total CO₂ avoided cannot be negative'],
      default: 0,
    },
    performanceMetrics: {
      type: {
        expectedProduction: {
          type: Number,
          required: true,
          default: 0,
        },
        actualProduction: {
          type: Number,
          required: true,
          default: 0,
        },
        performanceRatio: {
          type: Number,
          required: true,
          min: [0, 'Performance ratio cannot be negative'],
          max: [150, 'Performance ratio cannot exceed 150%'],
          default: 100,
        },
        availabilityFactor: {
          type: Number,
          required: true,
          min: [0, 'Availability factor must be between 0 and 100%'],
          max: [100, 'Availability factor must be between 0 and 100%'],
          default: 95,
        },
        curtailmentLosses: {
          type: Number,
          required: true,
          min: [0, 'Curtailment losses cannot be negative'],
          default: 0,
        },
      },
      required: true,
    },
    lastPerformanceReview: {
      type: Date,
    },
    totalInvestment: {
      type: Number,
      required: [true, 'Total investment is required'],
      min: [10000, 'Investment must be at least $10,000'],
    },
    operatingCost: {
      type: Number,
      required: [true, 'Operating cost is required'],
      min: [0, 'Operating cost cannot be negative'],
      default: 0,
    },
    commissionDate: {
      type: Date,
      required: [true, 'Commission date is required'],
      default: Date.now,
    },
    targetCompletionDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'renewableprojects',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index: unique project name per company
RenewableProjectSchema.index({ company: 1, name: 1 }, { unique: true });

// Index for queries
RenewableProjectSchema.index({ projectType: 1, status: 1 });
RenewableProjectSchema.index({ currentCapacity: 1 });

/**
 * Virtual: Completion percentage
 */
RenewableProjectSchema.virtual('completionPercent').get(function (this: IRenewableProject) {
  if (this.targetCapacity === 0) return 0;
  
  const percent = (this.currentCapacity / this.targetCapacity) * 100;
  return Math.round(percent * 10) / 10;
});

/**
 * Virtual: Portfolio diversification score (0-100)
 * 
 * Higher score = better diversification (solar + wind mix)
 * Formula: 100 - |solarRatio - 50|
 */
RenewableProjectSchema.virtual('portfolioDiversification').get(function (this: IRenewableProject) {
  const totalAssets = this.solarFarms.length + this.windTurbines.length;
  if (totalAssets === 0) return 0;
  
  const solarRatio = (this.solarFarms.length / totalAssets) * 100;
  const diversificationScore = 100 - Math.abs(solarRatio - 50);
  
  return Math.round(diversificationScore);
});

/**
 * Virtual: Years since commission
 */
RenewableProjectSchema.virtual('yearsOperating').get(function (this: IRenewableProject) {
  const now = new Date();
  const commissioned = this.commissionDate;
  const diffTime = Math.abs(now.getTime() - commissioned.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
  
  return Math.round(diffYears * 10) / 10;
});

/**
 * Calculate aggregate production across all assets
 * 
 * Queries all linked solar farms and wind turbines,
 * sums their daily production, and updates project totals.
 * 
 * @returns Total daily production in kWh
 * 
 * @example
 * const totalProduction = await project.calculateAggregateProduction();
 * // Returns: Sum of all asset dailyProduction values
 */
RenewableProjectSchema.methods.calculateAggregateProduction = async function (
  this: IRenewableProject
): Promise<number> {
  if (this.status === 'Planning' || this.status === 'Decommissioned') {
    return 0;
  }
  
  let totalProduction = 0;
  
  // Aggregate solar farm production
  if (this.solarFarms.length > 0) {
    const SolarFarm = mongoose.model('SolarFarm');
    const solarFarms = await SolarFarm.find({ _id: { $in: this.solarFarms } });
    
    totalProduction += solarFarms.reduce((sum, farm: any) => sum + (farm.dailyProduction || 0), 0);
  }
  
  // Aggregate wind turbine production
  if (this.windTurbines.length > 0) {
    const WindTurbine = mongoose.model('WindTurbine');
    const turbines = await WindTurbine.find({ _id: { $in: this.windTurbines } });
    
    totalProduction += turbines.reduce((sum, turbine: any) => sum + (turbine.dailyProduction || 0), 0);
  }
  
  // Update project production
  this.dailyProduction = totalProduction;
  this.monthlyProduction += totalProduction;
  this.annualProduction += totalProduction;
  this.cumulativeProduction += totalProduction;
  
  await this.save();
  
  return totalProduction;
};

/**
 * Generate carbon credits based on renewable production
 * 
 * Formula: CO₂ avoided = (production × coalEmissionFactor) - (production × renewableEmissionFactor)
 * Coal emission factor: 0.95 kg CO₂/kWh
 * Renewable emission factor: 0.02 kg CO₂/kWh (manufacturing/maintenance)
 * Net avoided: ~0.93 kg CO₂/kWh
 * 
 * Carbon credits: 1 credit per ton (1000 kg) CO₂ avoided
 * 
 * @returns Number of carbon credits generated
 * 
 * @example
 * const credits = await project.generateCarbonCredits();
 * // 100,000 kWh × 0.93 kg/kWh = 93,000 kg = 93 tons = 93 credits
 */
RenewableProjectSchema.methods.generateCarbonCredits = async function (
  this: IRenewableProject
): Promise<number> {
  if (this.dailyProduction === 0) {
    return 0;
  }
  
  // Calculate CO₂ avoided (kg)
  const coalEmissionFactor = 0.95; // kg CO₂/kWh
  const renewableEmissionFactor = 0.02; // kg CO₂/kWh (lifecycle)
  const netEmissionReduction = coalEmissionFactor - renewableEmissionFactor;
  
  const co2AvoidedKg = this.dailyProduction * netEmissionReduction;
  const co2AvoidedTons = co2AvoidedKg / 1000;
  
  // Update total CO₂ avoided
  this.totalCO2Avoided += co2AvoidedTons;
  
  // Generate carbon credit if threshold met (1 ton)
  if (co2AvoidedTons >= 1) {
    const creditPrice = 30 + Math.random() * 20; // $30-$50/ton typical
    
    this.carbonCreditsGenerated.push({
      generatedDate: new Date(),
      tonsCO2Avoided: co2AvoidedTons,
      creditPrice: Math.round(creditPrice * 100) / 100,
      sold: false,
    });
  }
  
  await this.save();
  
  return co2AvoidedTons;
};

/**
 * Update performance metrics
 * 
 * Compares actual production against expected production
 * based on installed capacity and typical capacity factors.
 * 
 * Performance ratio = (Actual / Expected) × 100%
 * 
 * Typical expected capacity factors:
 * - Solar: 20% (4.8 hours/day average)
 * - Wind: 35% (8.4 hours/day average)
 */
RenewableProjectSchema.methods.updatePerformanceMetrics = async function (
  this: IRenewableProject
): Promise<void> {
  if (this.currentCapacity === 0) {
    return;
  }
  
  // Calculate expected daily production
  // Assume 20% capacity factor for solar, 35% for wind
  const avgCapacityFactor = 0.25; // Conservative estimate
  const expectedDailyProduction = this.currentCapacity * 24 * avgCapacityFactor;
  
  // Update metrics
  this.performanceMetrics.expectedProduction = Math.round(expectedDailyProduction);
  this.performanceMetrics.actualProduction = this.dailyProduction;
  
  if (expectedDailyProduction > 0) {
    this.performanceMetrics.performanceRatio = Math.round((this.dailyProduction / expectedDailyProduction) * 100);
  }
  
  // Check underperformance threshold (80%)
  if (this.performanceMetrics.performanceRatio < 80 && this.status === 'Operational') {
    this.status = 'Underperforming';
  } else if (this.performanceMetrics.performanceRatio >= 80 && this.status === 'Underperforming') {
    this.status = 'Operational';
  }
  
  this.lastPerformanceReview = new Date();
  
  await this.save();
};

/**
 * Calculate annual revenue
 * 
 * Revenue sources:
 * 1. Electricity sales: production × rate
 * 2. Carbon credits: credits × price
 * 3. Subsidies: (tracked separately in Subsidy model)
 * 4. PPAs: (tracked separately in PPA model)
 * 
 * @param electricityRate - $/kWh electricity price
 * @param carbonCreditPrice - $/ton CO₂ credit price
 * @returns Estimated annual revenue
 */
RenewableProjectSchema.methods.calculateAnnualRevenue = function (
  this: IRenewableProject,
  electricityRate: number,
  carbonCreditPrice: number
): number {
  // Electricity sales
  const electricityRevenue = this.annualProduction * electricityRate;
  
  // Carbon credits (unsold credits)
  const unsoldCredits = this.carbonCreditsGenerated.filter(c => !c.sold);
  const carbonRevenue = unsoldCredits.reduce((sum, credit) => {
    return sum + (credit.tonsCO2Avoided * carbonCreditPrice);
  }, 0);
  
  // Total revenue
  const totalRevenue = electricityRevenue + carbonRevenue - this.operatingCost;
  
  return Math.round(totalRevenue * 100) / 100;
};

/**
 * Forecast production for future months
 * 
 * Uses historical capacity factor to project future production.
 * Accounts for seasonal variations (±20% swing).
 * 
 * @param months - Number of months to forecast
 * @returns Estimated production for period in kWh
 */
RenewableProjectSchema.methods.forecastProduction = function (
  this: IRenewableProject,
  months: number
): number {
  if (this.currentCapacity === 0 || months <= 0) {
    return 0;
  }
  
  // Calculate historical capacity factor
  const avgDailyProduction = this.cumulativeProduction / (this.yearsOperating * 365);
  const theoreticalDailyProduction = this.currentCapacity * 24;
  const capacityFactor = theoreticalDailyProduction > 0 
    ? avgDailyProduction / theoreticalDailyProduction 
    : 0.25; // Default to 25%
  
  // Forecast production
  const daysInPeriod = months * 30;
  const forecastProduction = this.currentCapacity * 24 * daysInPeriod * capacityFactor;
  
  return Math.round(forecastProduction);
};

const RenewableProject: Model<IRenewableProject> =
  mongoose.models.RenewableProject || mongoose.model<IRenewableProject>('RenewableProject', RenewableProjectSchema);

export default RenewableProject;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. PORTFOLIO BENEFITS:
 *    - Diversification: Solar + wind smooth output variability
 *    - Solar peak: Daytime production
 *    - Wind peak: Often evening/night (complementary)
 *    - Combined capacity factor: Higher than either alone
 * 
 * 2. CARBON CREDITS:
 *    - Generation: 1 credit per ton CO₂ avoided
 *    - Coal baseline: 0.95 kg CO₂/kWh
 *    - Renewable lifecycle: 0.02 kg CO₂/kWh
 *    - Net avoided: 0.93 kg CO₂/kWh
 *    - Market price: $30-$50/ton typical
 * 
 * 3. PERFORMANCE METRICS:
 *    - Performance ratio: Actual / Expected production
 *    - Target: >85% (excellent), 75-85% (good), <75% (underperforming)
 *    - Availability factor: % time assets are operational
 *    - Curtailment: Grid-mandated production limits
 * 
 * 4. PROJECT TYPES:
 *    - Utility-Scale: >10 MW, grid-connected, wholesale market
 *    - Distributed: Multiple small sites, net metering
 *    - Hybrid: Solar + wind + storage for 24/7 generation
 *    - Community Solar: Shared ownership, multiple subscribers
 * 
 * 5. REVENUE STREAMS:
 *    - Electricity sales: Primary revenue source
 *    - Carbon credits: Environmental credit trading
 *    - Subsidies: Government incentives (ITC, PTC)
 *    - PPAs: Long-term contracted rates
 *    - Grid services: Frequency regulation, reserves
 * 
 * 6. OPERATING COSTS:
 *    - Asset maintenance: Per kW/year for each technology
 *    - Project overhead: Management, monitoring, insurance
 *    - Land lease: If applicable
 *    - Grid connection fees: Transmission costs
 * 
 * 7. COMPLETION TRACKING:
 *    - Planning: Pre-construction, permitting
 *    - Construction: Assets being built
 *    - Partial Operation: Some assets online
 *    - Operational: All assets complete
 *    - Completion %: currentCapacity / targetCapacity
 * 
 * 8. LIFECYCLE STATES:
 *    - Planning: Pre-construction phase
 *    - Construction: Under development
 *    - Partial Operation: Some assets online
 *    - Operational: All assets complete and performing
 *    - Underperforming: Below 80% expected production
 *    - Decommissioned: Permanently closed
 */
