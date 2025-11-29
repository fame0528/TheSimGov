/**
 * @fileoverview Wind Turbine Model for Energy Industry
 * @module lib/db/models/energy/WindTurbine
 * 
 * OVERVIEW:
 * Wind turbine model for wind power generation with wind speed power curves,
 * capacity factor calculations, and blade maintenance tracking.
 * 
 * BUSINESS LOGIC:
 * - Power output ∝ windSpeed³ (cubic relationship)
 * - Cut-in: 3-4 m/s, Rated: 12-15 m/s, Cut-out: 25 m/s
 * - Revenue: production × electricityRate - operatingCost
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/** Wind turbine types */
export type TurbineType = 'Onshore' | 'Offshore' | 'Small-Scale';

/** Turbine operational status */
export type TurbineStatus = 'Construction' | 'Operational' | 'Maintenance' | 'Storm Shutdown' | 'Degraded' | 'Decommissioned';

/** Geographic location */
export interface TurbineLocation {
  latitude: number;
  longitude: number;
  region: string;
}

/** Blade condition tracking */
export interface BladeCondition {
  bladeNumber: number;
  integrityPercent: number;
  iceAccumulation: number;
  lastInspection: Date;
}

/** Drivetrain condition */
export interface DrivetrainCondition {
  gearboxEfficiency: number;
  generatorEfficiency: number;
  lastMaintenance: Date;
  operatingHours: number;
}

/** Wind turbine document interface */
export interface IWindTurbine extends Document {
  company: Types.ObjectId;
  name: string;
  location: TurbineLocation;
  turbineType: TurbineType;
  status: TurbineStatus;
  
  // Technical specs
  ratedCapacity: number;
  bladeLength: number;
  hubHeight: number;
  cutInSpeed: number;
  ratedWindSpeed: number;
  cutOutSpeed: number;
  
  // Production tracking
  currentOutput: number;
  dailyProduction: number;
  cumulativeProduction: number;
  
  // Condition monitoring
  bladeConditions: BladeCondition[];
  drivetrain: DrivetrainCondition;
  lastMaintenance?: Date;
  commissionDate: Date;
  
  // Economic data
  electricityRate: number;
  operatingCost: number;
  
  createdAt: Date;
  updatedAt: Date;
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
      maxlength: 100,
    },
    location: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
      region: { type: String, required: true, trim: true },
    },
    turbineType: {
      type: String,
      required: true,
      enum: ['Onshore', 'Offshore', 'Small-Scale'],
      default: 'Onshore',
      index: true,
    },
    status: {
      type: String,
      default: 'Construction',
      enum: ['Construction', 'Operational', 'Maintenance', 'Storm Shutdown', 'Degraded', 'Decommissioned'],
      index: true,
    },
    ratedCapacity: {
      type: Number,
      required: true,
      min: 0,
      default: 3000, // 3 MW
    },
    bladeLength: {
      type: Number,
      required: true,
      min: 0,
      default: 50, // meters
    },
    hubHeight: {
      type: Number,
      required: true,
      min: 0,
      default: 80, // meters
    },
    cutInSpeed: {
      type: Number,
      default: 3, // m/s
      min: 0,
    },
    ratedWindSpeed: {
      type: Number,
      default: 12, // m/s
      min: 0,
    },
    cutOutSpeed: {
      type: Number,
      default: 25, // m/s
      min: 0,
    },
    currentOutput: {
      type: Number,
      default: 0,
      min: 0,
    },
    dailyProduction: {
      type: Number,
      default: 0,
      min: 0,
    },
    cumulativeProduction: {
      type: Number,
      default: 0,
      min: 0,
    },
    bladeConditions: [{
      bladeNumber: { type: Number, min: 1, max: 3 },
      integrityPercent: { type: Number, min: 0, max: 100, default: 100 },
      iceAccumulation: { type: Number, min: 0, max: 100, default: 0 },
      lastInspection: { type: Date },
    }],
    drivetrain: {
      gearboxEfficiency: { type: Number, min: 0, max: 100, default: 97 },
      generatorEfficiency: { type: Number, min: 0, max: 100, default: 96 },
      lastMaintenance: { type: Date },
      operatingHours: { type: Number, min: 0, default: 0 },
    },
    lastMaintenance: { type: Date },
    commissionDate: {
      type: Date,
      default: Date.now,
    },
    electricityRate: {
      type: Number,
      required: true,
      min: 0,
      default: 0.10,
    },
    operatingCost: {
      type: Number,
      default: 50, // $/kW/year
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'wind_turbines',
  }
);

// Virtual: Years operating
WindTurbineSchema.virtual('yearsOperating').get(function() {
  return (Date.now() - this.commissionDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
});

// Virtual: Average blade integrity
WindTurbineSchema.virtual('avgBladeIntegrity').get(function() {
  if (!this.bladeConditions || this.bladeConditions.length === 0) return 100;
  const sum = this.bladeConditions.reduce((acc, b) => acc + b.integrityPercent, 0);
  return sum / this.bladeConditions.length;
});

// Method: Calculate output based on wind speed (cubic relationship)
WindTurbineSchema.methods.calculateDailyOutput = function(
  windSpeed: number,
  temperature: number,
  gustFactor: number = 0
): number {
  // Power curve logic
  if (windSpeed < this.cutInSpeed) return 0;
  if (windSpeed > this.cutOutSpeed) return 0; // Safety shutdown
  
  let outputFactor: number;
  
  if (windSpeed <= this.ratedWindSpeed) {
    // Cubic increase region
    outputFactor = Math.pow(windSpeed / this.ratedWindSpeed, 3);
  } else {
    // Constant power region (controlled pitch)
    outputFactor = 1.0;
  }
  
  // Apply efficiency factors
  const gearboxEff = (this.drivetrain?.gearboxEfficiency || 97) / 100;
  const genEff = (this.drivetrain?.generatorEfficiency || 96) / 100;
  const bladeEff = (this.avgBladeIntegrity || 100) / 100;
  
  // Air density correction (decreases with temperature)
  const airDensityFactor = 1 - (temperature - 15) * 0.003;
  
  // Gust penalty (high variability reduces efficiency)
  const gustPenalty = 1 - gustFactor * 0.15;
  
  const output = this.ratedCapacity * 
    outputFactor * 
    gearboxEff * 
    genEff * 
    bladeEff * 
    Math.max(0.8, airDensityFactor) * 
    Math.max(0.7, gustPenalty) *
    24; // Hours in a day for kWh
  
  return Math.max(0, Math.round(output * 100) / 100);
};

// Compound indexes
WindTurbineSchema.index({ company: 1, status: 1 });
WindTurbineSchema.index({ company: 1, turbineType: 1 });

const WindTurbine: Model<IWindTurbine> = mongoose.models.WindTurbine || mongoose.model<IWindTurbine>('WindTurbine', WindTurbineSchema);

export default WindTurbine;
