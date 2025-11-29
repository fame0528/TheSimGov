/**
 * @file src/lib/db/models/manufacturing/ManufacturingFacility.ts
 * @description ManufacturingFacility Mongoose schema for production facilities
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * ManufacturingFacility model representing production sites with capacity planning,
 * automation levels, OEE (Overall Equipment Effectiveness) tracking, and multi-shift
 * operations. Supports 3 manufacturing types (Discrete, Process, Assembly) with
 * type-specific mechanics and resource requirements.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
 * - name: Facility name/location (e.g., "Detroit Assembly Plant")
 * - location: Geographic location (city, state, country)
 * - facilityType: Manufacturing type (Discrete, Process, Assembly)
 * - size: Facility size in sq ft (10,000-5,000,000)
 * - established: Date facility opened
 * - active: Operational status
 * 
 * Capacity & Production:
 * - theoreticalCapacity: Maximum daily output (units/day)
 * - actualCapacity: Current achievable output (units/day)
 * - utilizationRate: Actual / Theoretical capacity (%)
 * - productionLines: Count of active production lines
 * - shiftsPerDay: Operating shifts (1-3)
 * - hoursPerShift: Hours per shift (6-12)
 * - daysPerWeek: Operating days (5-7)
 * 
 * Automation:
 * - automationLevel: Manual, SemiAuto, FullyAuto, LightsOut
 * - automationScore: Automation percentage (0-100)
 * - roboticsCount: Number of industrial robots
 * - aiIntegration: AI/ML integration level (0-100)
 * - iotSensors: IoT sensor count for monitoring
 * - digitalTwinEnabled: Virtual facility model active
 * 
 * OEE (Overall Equipment Effectiveness):
 * - availability: Uptime percentage (0-100)
 * - performance: Speed efficiency (0-100)
 * - quality: First-pass yield (0-100)
 * - oeeScore: Availability × Performance × Quality (0-100)
 * - targetOEE: OEE goal (typically 85)
 * - plannedDowntime: Scheduled maintenance hours/month
 * - unplannedDowntime: Unscheduled downtime hours/month
 * 
 * Quality & Safety:
 * - qualityRating: Overall quality score (0-100)
 * - defectRate: PPM (parts per million) defects
 * - scrapRate: Percentage of production scrapped (0-100)
 * - reworkRate: Percentage requiring rework (0-100)
 * - safetyRating: Safety compliance score (0-100)
 * - accidentsYTD: Accidents year-to-date
 * - lastSafetyAudit: Most recent safety inspection
 * - isoCompliance: ISO certifications (ISO9001, ISO14001, etc.)
 * 
 * Resources:
 * - powerConsumption: kWh per month
 * - waterUsage: Gallons per month
 * - wastewaterGenerated: Gallons per month
 * - emissions: CO2 tons per month
 * - sustainabilityScore: Environmental rating (0-100)
 * - energyEfficiency: Energy per unit produced
 * 
 * Financials:
 * - capitalInvested: Total capital invested in facility
 * - monthlyOperatingCost: Fixed operating costs (utilities, maintenance)
 * - depreciation: Annual depreciation expense
 * - insuranceCost: Annual insurance premium
 * - propertyTax: Annual property tax
 * - maintenanceBacklog: Deferred maintenance cost
 * 
 * Workforce:
 * - totalEmployees: Total headcount
 * - directLaborCount: Production workers
 * - indirectLaborCount: Support staff (maintenance, QA, etc.)
 * - skillLevel: Average worker skill (0-100)
 * - trainingHoursYTD: Total training hours this year
 * 
 * IMPLEMENTATION NOTES:
 * - OEE calculated as: (Availability × Performance × Quality) / 10000 to get percentage
 * - World-class OEE target: 85% (Availability 90% × Performance 95% × Quality 99.9% = 85.4%)
 * - Automation levels affect: efficiency (+40% FullyAuto), labor cost (-60%), defect rate (-30%)
 * - Discrete manufacturing: Unit-based (cars, electronics), batch tracking
 * - Process manufacturing: Continuous flow (chemicals, food), batch recipes
 * - Assembly manufacturing: Component-based (furniture, appliances), BOM tracking
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Facility types - determines production methodology
 */
export const FacilityType = {
  DISCRETE: 'Discrete',      // Unit-based production (automotive, electronics, machinery)
  PROCESS: 'Process',        // Continuous/batch production (chemicals, food, pharma)
  ASSEMBLY: 'Assembly',      // Component assembly (furniture, appliances, consumer goods)
} as const;

export type FacilityTypeValue = typeof FacilityType[keyof typeof FacilityType];

/**
 * Automation levels - determines efficiency and labor requirements
 */
export const AutomationLevel = {
  MANUAL: 'Manual',          // Manual labor, minimal automation (1x efficiency)
  SEMI_AUTO: 'SemiAuto',     // Partial automation (1.5x efficiency)
  FULLY_AUTO: 'FullyAuto',   // Fully automated lines (2.5x efficiency)
  LIGHTS_OUT: 'LightsOut',   // Unmanned operation, AI-driven (4x efficiency)
} as const;

export type AutomationLevelValue = typeof AutomationLevel[keyof typeof AutomationLevel];

/**
 * ISO compliance certifications
 */
export const ISOCompliance = {
  ISO9001: 'ISO9001',     // Quality management
  ISO14001: 'ISO14001',   // Environmental management
  ISO45001: 'ISO45001',   // Occupational health and safety
  ISO50001: 'ISO50001',   // Energy management
} as const;

export type ISOComplianceValue = typeof ISOCompliance[keyof typeof ISOCompliance];

/**
 * ManufacturingFacility document interface
 */
export interface IManufacturingFacility extends Document {
  // Core
  company: Types.ObjectId;
  name: string;
  location: string;
  facilityType: FacilityTypeValue;
  size: number;
  established: Date;
  active: boolean;

  // Capacity & Production
  theoreticalCapacity: number;
  actualCapacity: number;
  utilizationRate: number;
  productionLines: number;
  shiftsPerDay: number;
  hoursPerShift: number;
  daysPerWeek: number;

  // Automation
  automationLevel: AutomationLevelValue;
  automationScore: number;
  roboticsCount: number;
  aiIntegration: number;
  iotSensors: number;
  digitalTwinEnabled: boolean;

  // OEE
  availability: number;
  performance: number;
  quality: number;
  oeeScore: number;
  targetOEE: number;
  plannedDowntime: number;
  unplannedDowntime: number;

  // Quality & Safety
  qualityRating: number;
  defectRate: number;
  scrapRate: number;
  reworkRate: number;
  safetyRating: number;
  accidentsYTD: number;
  lastSafetyAudit?: Date;
  isoCompliance: ISOComplianceValue[];

  // Resources
  powerConsumption: number;
  waterUsage: number;
  wastewaterGenerated: number;
  emissions: number;
  sustainabilityScore: number;
  energyEfficiency: number;

  // Financials
  capitalInvested: number;
  monthlyOperatingCost: number;
  depreciation: number;
  insuranceCost: number;
  propertyTax: number;
  maintenanceBacklog: number;

  // Workforce
  totalEmployees: number;
  directLaborCount: number;
  indirectLaborCount: number;
  skillLevel: number;
  trainingHoursYTD: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  weeklyCapacity: number;
  monthlyCapacity: number;
  annualCapacity: number;
  totalOperatingHours: number;
  capacityUtilizationHealth: string;
  oeeHealth: string;
  automationEfficiency: number;
}

/**
 * ManufacturingFacility schema definition
 */
const ManufacturingFacilitySchema = new Schema<IManufacturingFacility>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true,
      minlength: [3, 'Facility name must be at least 3 characters'],
      maxlength: [100, 'Facility name cannot exceed 100 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [150, 'Location cannot exceed 150 characters'],
    },
    facilityType: {
      type: String,
      required: [true, 'Facility type is required'],
      enum: {
        values: Object.values(FacilityType),
        message: '{VALUE} is not a valid facility type',
      },
      index: true,
    },
    size: {
      type: Number,
      required: [true, 'Facility size is required'],
      min: [10000, 'Minimum facility size is 10,000 sq ft'],
      max: [5000000, 'Maximum facility size is 5,000,000 sq ft'],
    },
    established: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },

    // Capacity & Production
    theoreticalCapacity: {
      type: Number,
      required: [true, 'Theoretical capacity is required'],
      min: [100, 'Theoretical capacity must be at least 100 units/day'],
      max: [1000000, 'Theoretical capacity cannot exceed 1,000,000 units/day'],
    },
    actualCapacity: {
      type: Number,
      required: [true, 'Actual capacity is required'],
      min: [0, 'Actual capacity cannot be negative'],
    },
    utilizationRate: {
      type: Number,
      required: true,
      default: 70,
      min: [0, 'Utilization rate cannot be negative'],
      max: [100, 'Utilization rate cannot exceed 100%'],
    },
    productionLines: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Must have at least 1 production line'],
      max: [100, 'Cannot exceed 100 production lines'],
    },
    shiftsPerDay: {
      type: Number,
      required: true,
      default: 2,
      enum: {
        values: [1, 2, 3],
        message: 'Shifts per day must be 1, 2, or 3',
      },
    },
    hoursPerShift: {
      type: Number,
      required: true,
      default: 8,
      min: [6, 'Minimum 6 hours per shift'],
      max: [12, 'Maximum 12 hours per shift'],
    },
    daysPerWeek: {
      type: Number,
      required: true,
      default: 6,
      min: [5, 'Minimum 5 days per week'],
      max: [7, 'Maximum 7 days per week'],
    },

    // Automation
    automationLevel: {
      type: String,
      required: true,
      enum: {
        values: Object.values(AutomationLevel),
        message: '{VALUE} is not a valid automation level',
      },
      default: AutomationLevel.MANUAL,
      index: true,
    },
    automationScore: {
      type: Number,
      required: true,
      default: 20,
      min: [0, 'Automation score cannot be negative'],
      max: [100, 'Automation score cannot exceed 100'],
    },
    roboticsCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Robotics count cannot be negative'],
    },
    aiIntegration: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'AI integration cannot be negative'],
      max: [100, 'AI integration cannot exceed 100'],
    },
    iotSensors: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'IoT sensors count cannot be negative'],
    },
    digitalTwinEnabled: {
      type: Boolean,
      required: true,
      default: false,
    },

    // OEE
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
    oeeScore: {
      type: Number,
      required: true,
      default: 64.6, // 85 * 80 * 95 / 10000
      min: [0, 'OEE score cannot be negative'],
      max: [100, 'OEE score cannot exceed 100%'],
    },
    targetOEE: {
      type: Number,
      required: true,
      default: 85,
      min: [50, 'Target OEE must be at least 50%'],
      max: [95, 'Target OEE cannot exceed 95%'],
    },
    plannedDowntime: {
      type: Number,
      required: true,
      default: 40, // 40 hours/month (5% of 800 hours)
      min: [0, 'Planned downtime cannot be negative'],
    },
    unplannedDowntime: {
      type: Number,
      required: true,
      default: 20, // 20 hours/month (2.5% target)
      min: [0, 'Unplanned downtime cannot be negative'],
    },

    // Quality & Safety
    qualityRating: {
      type: Number,
      required: true,
      default: 80,
      min: [0, 'Quality rating cannot be negative'],
      max: [100, 'Quality rating cannot exceed 100'],
    },
    defectRate: {
      type: Number,
      required: true,
      default: 500, // 500 PPM (0.05%)
      min: [0, 'Defect rate cannot be negative'],
      max: [100000, 'Defect rate cannot exceed 100,000 PPM (10%)'],
    },
    scrapRate: {
      type: Number,
      required: true,
      default: 2, // 2% scrap
      min: [0, 'Scrap rate cannot be negative'],
      max: [20, 'Scrap rate cannot exceed 20%'],
    },
    reworkRate: {
      type: Number,
      required: true,
      default: 5, // 5% rework
      min: [0, 'Rework rate cannot be negative'],
      max: [30, 'Rework rate cannot exceed 30%'],
    },
    safetyRating: {
      type: Number,
      required: true,
      default: 85,
      min: [0, 'Safety rating cannot be negative'],
      max: [100, 'Safety rating cannot exceed 100'],
    },
    accidentsYTD: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Accidents YTD cannot be negative'],
    },
    lastSafetyAudit: {
      type: Date,
      default: null,
    },
    isoCompliance: {
      type: [String],
      enum: Object.values(ISOCompliance),
      default: [],
    },

    // Resources
    powerConsumption: {
      type: Number,
      required: true,
      default: 100000, // 100,000 kWh/month
      min: [0, 'Power consumption cannot be negative'],
    },
    waterUsage: {
      type: Number,
      required: true,
      default: 50000, // 50,000 gallons/month
      min: [0, 'Water usage cannot be negative'],
    },
    wastewaterGenerated: {
      type: Number,
      required: true,
      default: 40000, // 40,000 gallons/month
      min: [0, 'Wastewater generated cannot be negative'],
    },
    emissions: {
      type: Number,
      required: true,
      default: 50, // 50 tons CO2/month
      min: [0, 'Emissions cannot be negative'],
    },
    sustainabilityScore: {
      type: Number,
      required: true,
      default: 60,
      min: [0, 'Sustainability score cannot be negative'],
      max: [100, 'Sustainability score cannot exceed 100'],
    },
    energyEfficiency: {
      type: Number,
      required: true,
      default: 1.5, // 1.5 kWh per unit
      min: [0.1, 'Energy efficiency cannot be below 0.1'],
      max: [100, 'Energy efficiency cannot exceed 100'],
    },

    // Financials
    capitalInvested: {
      type: Number,
      required: [true, 'Capital invested is required'],
      min: [100000, 'Minimum capital investment is $100,000'],
      max: [1000000000, 'Maximum capital investment is $1,000,000,000'],
    },
    monthlyOperatingCost: {
      type: Number,
      required: true,
      default: 50000,
      min: [1000, 'Monthly operating cost must be at least $1,000'],
    },
    depreciation: {
      type: Number,
      required: true,
      default: 100000, // Annual depreciation
      min: [0, 'Depreciation cannot be negative'],
    },
    insuranceCost: {
      type: Number,
      required: true,
      default: 25000, // Annual insurance
      min: [0, 'Insurance cost cannot be negative'],
    },
    propertyTax: {
      type: Number,
      required: true,
      default: 15000, // Annual property tax
      min: [0, 'Property tax cannot be negative'],
    },
    maintenanceBacklog: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Maintenance backlog cannot be negative'],
    },

    // Workforce
    totalEmployees: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Must have at least 1 employee'],
      max: [10000, 'Cannot exceed 10,000 employees'],
    },
    directLaborCount: {
      type: Number,
      required: true,
      default: 40,
      min: [1, 'Must have at least 1 direct labor'],
    },
    indirectLaborCount: {
      type: Number,
      required: true,
      default: 10,
      min: [0, 'Indirect labor count cannot be negative'],
    },
    skillLevel: {
      type: Number,
      required: true,
      default: 60,
      min: [0, 'Skill level cannot be negative'],
      max: [100, 'Skill level cannot exceed 100'],
    },
    trainingHoursYTD: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Training hours cannot be negative'],
    },
  },
  {
    timestamps: true,
    collection: 'manufacturingfacilities',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 * NOTE: Using compound indexes only - no duplicate field-level indexes (ECHO v1.3.1 Mongoose Index fix)
 */
ManufacturingFacilitySchema.index({ company: 1, active: 1 }); // Active facilities
ManufacturingFacilitySchema.index({ company: 1, facilityType: 1 }); // Type filter
ManufacturingFacilitySchema.index({ oeeScore: -1 }); // Top performing facilities

/**
 * Virtual field: weeklyCapacity
 */
ManufacturingFacilitySchema.virtual('weeklyCapacity').get(function (this: IManufacturingFacility): number {
  return this.actualCapacity * this.daysPerWeek;
});

/**
 * Virtual field: monthlyCapacity
 */
ManufacturingFacilitySchema.virtual('monthlyCapacity').get(function (this: IManufacturingFacility): number {
  return Math.floor((this.actualCapacity * this.daysPerWeek * 52) / 12);
});

/**
 * Virtual field: annualCapacity
 */
ManufacturingFacilitySchema.virtual('annualCapacity').get(function (this: IManufacturingFacility): number {
  return this.actualCapacity * this.daysPerWeek * 52;
});

/**
 * Virtual field: totalOperatingHours
 */
ManufacturingFacilitySchema.virtual('totalOperatingHours').get(function (this: IManufacturingFacility): number {
  return this.shiftsPerDay * this.hoursPerShift * this.daysPerWeek * 52; // Annual hours
});

/**
 * Virtual field: capacityUtilizationHealth
 */
ManufacturingFacilitySchema.virtual('capacityUtilizationHealth').get(function (this: IManufacturingFacility): string {
  if (this.utilizationRate < 50) return 'Critical';
  if (this.utilizationRate < 70) return 'Low';
  if (this.utilizationRate < 85) return 'Normal';
  if (this.utilizationRate < 95) return 'Good';
  return 'Excellent';
});

/**
 * Virtual field: oeeHealth
 */
ManufacturingFacilitySchema.virtual('oeeHealth').get(function (this: IManufacturingFacility): string {
  if (this.oeeScore < 40) return 'Critical';
  if (this.oeeScore < 60) return 'Poor';
  if (this.oeeScore < 75) return 'Fair';
  if (this.oeeScore < 85) return 'Good';
  return 'World-Class';
});

/**
 * Virtual field: automationEfficiency
 */
ManufacturingFacilitySchema.virtual('automationEfficiency').get(function (this: IManufacturingFacility): number {
  const automationMultipliers: Record<AutomationLevelValue, number> = {
    [AutomationLevel.MANUAL]: 1.0,
    [AutomationLevel.SEMI_AUTO]: 1.5,
    [AutomationLevel.FULLY_AUTO]: 2.5,
    [AutomationLevel.LIGHTS_OUT]: 4.0,
  };
  return automationMultipliers[this.automationLevel];
});

/**
 * Pre-save hook: Calculate OEE and utilization
 */
ManufacturingFacilitySchema.pre<IManufacturingFacility>('save', function (next) {
  // Calculate OEE score
  this.oeeScore = (this.availability * this.performance * this.quality) / 10000;

  // Calculate utilization rate
  if (this.theoreticalCapacity > 0) {
    this.utilizationRate = Math.min(100, (this.actualCapacity / this.theoreticalCapacity) * 100);
  }

  // Update indirect labor count (must be <= total - direct)
  if (this.indirectLaborCount + this.directLaborCount > this.totalEmployees) {
    this.indirectLaborCount = this.totalEmployees - this.directLaborCount;
  }

  next();
});

/**
 * ManufacturingFacility model
 */
const ManufacturingFacility: Model<IManufacturingFacility> =
  mongoose.models.ManufacturingFacility ||
  mongoose.model<IManufacturingFacility>('ManufacturingFacility', ManufacturingFacilitySchema);

export default ManufacturingFacility;
