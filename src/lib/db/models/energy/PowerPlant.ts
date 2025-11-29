/**
 * @fileoverview Power Plant Model for Energy Industry
 * @module lib/db/models/energy/PowerPlant
 * 
 * OVERVIEW:
 * Power plant model for traditional electricity generation including
 * coal, natural gas, nuclear, and hydroelectric facilities.
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/** Power plant types */
export type PlantType = 'Coal' | 'NaturalGas' | 'Nuclear' | 'Hydroelectric' | 'Geothermal';

/** Plant operational status */
export type PlantStatus = 'Construction' | 'Operational' | 'Maintenance' | 'Offline' | 'Decommissioning';

/** Fuel efficiency tracking */
export interface FuelEfficiency {
  heatRate: number; // BTU/kWh
  fuelCost: number; // $/unit
  fuelType: string;
  consumption: number; // units/day
}

/** Emissions data */
export interface Emissions {
  co2: number; // tons/year
  nox: number; // tons/year
  sox: number; // tons/year
  particulateMatter: number; // tons/year
}

/** Power plant document interface */
export interface IPowerPlant extends Document {
  company: Types.ObjectId;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  plantType: PlantType;
  status: PlantStatus;
  
  // Capacity
  nameplateCapacity: number; // MW
  currentOutput: number; // MW
  capacityFactor: number; // percentage
  
  // Fuel & efficiency
  fuelEfficiency: FuelEfficiency;
  
  // Emissions
  emissions: Emissions;
  carbonCreditsOwned: number;
  
  // Operations
  startupCost: number;
  operatingCost: number; // $/MWh
  lastMaintenance?: Date;
  commissionDate: Date;
  
  // Grid
  gridConnectionCapacity: number; // MW
  transmissionLosses: number; // percentage
  
  createdAt: Date;
  updatedAt: Date;
}

const PowerPlantSchema = new Schema<IPowerPlant>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Plant name is required'],
      trim: true,
      maxlength: 100,
    },
    location: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
      region: { type: String, required: true, trim: true },
    },
    plantType: {
      type: String,
      required: true,
      enum: ['Coal', 'NaturalGas', 'Nuclear', 'Hydroelectric', 'Geothermal'],
      index: true,
    },
    status: {
      type: String,
      default: 'Construction',
      enum: ['Construction', 'Operational', 'Maintenance', 'Offline', 'Decommissioning'],
      index: true,
    },
    nameplateCapacity: {
      type: Number,
      required: true,
      min: 0,
      default: 500, // 500 MW
    },
    currentOutput: {
      type: Number,
      default: 0,
      min: 0,
    },
    capacityFactor: {
      type: Number,
      default: 85,
      min: 0,
      max: 100,
    },
    fuelEfficiency: {
      heatRate: { type: Number, min: 0, default: 10000 },
      fuelCost: { type: Number, min: 0, default: 3 },
      fuelType: { type: String, default: 'Natural Gas' },
      consumption: { type: Number, min: 0, default: 1000 },
    },
    emissions: {
      co2: { type: Number, min: 0, default: 0 },
      nox: { type: Number, min: 0, default: 0 },
      sox: { type: Number, min: 0, default: 0 },
      particulateMatter: { type: Number, min: 0, default: 0 },
    },
    carbonCreditsOwned: {
      type: Number,
      default: 0,
      min: 0,
    },
    startupCost: {
      type: Number,
      default: 50000, // $50k startup
      min: 0,
    },
    operatingCost: {
      type: Number,
      default: 25, // $/MWh
      min: 0,
    },
    lastMaintenance: { type: Date },
    commissionDate: {
      type: Date,
      default: Date.now,
    },
    gridConnectionCapacity: {
      type: Number,
      default: 600, // MW
      min: 0,
    },
    transmissionLosses: {
      type: Number,
      default: 5, // 5%
      min: 0,
      max: 50,
    },
  },
  {
    timestamps: true,
    collection: 'power_plants',
  }
);

// Virtual: Effective output (after transmission losses)
PowerPlantSchema.virtual('effectiveOutput').get(function() {
  return this.currentOutput * (1 - this.transmissionLosses / 100);
});

// Method: Calculate daily revenue
PowerPlantSchema.methods.calculateDailyRevenue = function(electricityPrice: number): number {
  const dailyMWh = this.currentOutput * 24;
  const revenue = dailyMWh * electricityPrice;
  const fuelCost = this.fuelEfficiency.consumption * this.fuelEfficiency.fuelCost;
  const opCost = dailyMWh * this.operatingCost / 1000;
  return Math.round((revenue - fuelCost - opCost) * 100) / 100;
};

// Compound indexes
PowerPlantSchema.index({ company: 1, status: 1 });
PowerPlantSchema.index({ company: 1, plantType: 1 });

const PowerPlant: Model<IPowerPlant> = mongoose.models.PowerPlant || mongoose.model<IPowerPlant>('PowerPlant', PowerPlantSchema);

export default PowerPlant;
