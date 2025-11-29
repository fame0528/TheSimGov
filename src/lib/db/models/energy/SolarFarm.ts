/**
 * @fileoverview Solar Farm Model for Energy Industry
 * @module lib/db/models/energy/SolarFarm
 * 
 * OVERVIEW:
 * Solar farm model representing PV or CSP facilities with weather-based
 * output calculations, panel efficiency degradation, and seasonal variation.
 * 
 * BUSINESS LOGIC:
 * - Output: capacity × sunHours × efficiency × (1 - degradation) × weatherFactor
 * - Weather impact: clouds reduce output 30-90%
 * - Degradation: 0.5% per year typical
 * - Revenue: production × electricityRate + excess × feedInTariff
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/** Solar panel technology types */
export type PanelType = 'Monocrystalline' | 'Polycrystalline' | 'Thin-Film' | 'Bifacial';

/** Solar farm operational status */
export type SolarStatus = 'Construction' | 'Operational' | 'Maintenance' | 'Degraded' | 'Decommissioned';

/** Geographic location */
export interface SolarLocation {
  latitude: number;
  longitude: number;
  region: string;
}

/** Battery storage system */
export interface BatteryStorage {
  capacity: number;
  efficiency: number;
  currentCharge: number;
  degradation: number;
  lastMaintenance: Date;
}

/** Grid connection details */
export interface GridConnection {
  utilityCompany: string;
  connectionCapacity: number;
  feedInTariff: number;
  netMeteringEnabled: boolean;
}

/** Solar farm document interface */
export interface ISolarFarm extends Document {
  company: Types.ObjectId;
  name: string;
  location: SolarLocation;
  status: SolarStatus;
  
  // Installation details
  installedCapacity: number;
  panelType: PanelType;
  panelCount: number;
  systemEfficiency: number;
  inverterEfficiency: number;
  
  // Production tracking
  currentOutput: number;
  dailyProduction: number;
  cumulativeProduction: number;
  
  // Degradation & maintenance
  panelDegradation: number;
  lastMaintenance?: Date;
  commissionDate: Date;
  
  // Economic data
  electricityRate: number;
  operatingCost: number;
  
  // Optional features
  batteryStorage?: BatteryStorage;
  gridConnection?: GridConnection;
  
  createdAt: Date;
  updatedAt: Date;
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
      required: [true, 'Farm name is required'],
      trim: true,
      maxlength: 100,
    },
    location: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
      region: { type: String, required: true, trim: true },
    },
    status: {
      type: String,
      default: 'Construction',
      enum: ['Construction', 'Operational', 'Maintenance', 'Degraded', 'Decommissioned'],
      index: true,
    },
    installedCapacity: {
      type: Number,
      required: true,
      min: 0,
      default: 10000, // 10 MW default
    },
    panelType: {
      type: String,
      required: true,
      enum: ['Monocrystalline', 'Polycrystalline', 'Thin-Film', 'Bifacial'],
      default: 'Monocrystalline',
    },
    panelCount: {
      type: Number,
      required: true,
      min: 0,
      default: 25000,
    },
    systemEfficiency: {
      type: Number,
      default: 85,
      min: 0,
      max: 100,
    },
    inverterEfficiency: {
      type: Number,
      default: 96,
      min: 0,
      max: 100,
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
    panelDegradation: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
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
      default: 0.12, // $/kWh
    },
    operatingCost: {
      type: Number,
      default: 15, // $/kW/year
      min: 0,
    },
    batteryStorage: {
      capacity: { type: Number, min: 0 },
      efficiency: { type: Number, min: 0, max: 100, default: 90 },
      currentCharge: { type: Number, min: 0, default: 0 },
      degradation: { type: Number, min: 0, max: 100, default: 0 },
      lastMaintenance: { type: Date },
    },
    gridConnection: {
      utilityCompany: { type: String, trim: true },
      connectionCapacity: { type: Number, min: 0 },
      feedInTariff: { type: Number, min: 0, default: 0.05 },
      netMeteringEnabled: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    collection: 'solar_farms',
  }
);

// Virtual: Years operating
SolarFarmSchema.virtual('yearsOperating').get(function() {
  return (Date.now() - this.commissionDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
});

// Virtual: Effective capacity (accounting for degradation)
SolarFarmSchema.virtual('effectiveCapacity').get(function() {
  return this.installedCapacity * (1 - this.panelDegradation / 100);
});

// Method: Calculate daily output with weather factors
SolarFarmSchema.methods.calculateDailyOutput = function(
  temperature: number,
  cloudCover: number,
  peakSunHours: number
): number {
  const tempCoefficient = temperature > 25 ? 1 - (temperature - 25) * 0.004 : 1;
  const weatherFactor = 1 - (cloudCover / 100) * 0.8;
  const degradationFactor = 1 - this.panelDegradation / 100;
  
  const output = this.installedCapacity * 
    peakSunHours * 
    (this.systemEfficiency / 100) * 
    (this.inverterEfficiency / 100) * 
    tempCoefficient * 
    weatherFactor * 
    degradationFactor;
  
  return Math.max(0, Math.round(output * 100) / 100);
};

// Compound indexes
SolarFarmSchema.index({ company: 1, status: 1 });

const SolarFarm: Model<ISolarFarm> = mongoose.models.SolarFarm || mongoose.model<ISolarFarm>('SolarFarm', SolarFarmSchema);

export default SolarFarm;
