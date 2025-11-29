/**
 * @fileoverview Energy Storage Model
 * @module lib/db/models/energy/EnergyStorage
 * 
 * OVERVIEW:
 * Energy storage facilities for grid-scale batteries, pumped hydro,
 * and compressed air energy storage (CAES).
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/** Storage technology types */
export type StorageType = 'LithiumIon' | 'FlowBattery' | 'PumpedHydro' | 'CompressedAir' | 'Flywheel';

/** Storage operational status */
export type StorageStatus = 'Construction' | 'Operational' | 'Charging' | 'Discharging' | 'Maintenance' | 'Offline';

/** Energy storage document interface */
export interface IEnergyStorage extends Document {
  company: Types.ObjectId;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  storageType: StorageType;
  status: StorageStatus;
  
  // Capacity
  totalCapacity: number; // MWh
  currentCharge: number; // MWh
  maxDischargeRate: number; // MW
  maxChargeRate: number; // MW
  
  // Efficiency
  roundTripEfficiency: number; // percentage
  selfDischargeRate: number; // % per day
  cycleCount: number;
  maxCycles: number;
  degradation: number; // % capacity loss
  
  // Economics
  chargingCost: number; // $/MWh
  dischargingRevenue: number; // $/MWh
  operatingCost: number; // $/MWh
  
  // Operations
  lastMaintenance?: Date;
  commissionDate: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const EnergyStorageSchema = new Schema<IEnergyStorage>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Storage name is required'],
      trim: true,
      maxlength: 100,
    },
    location: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
      region: { type: String, required: true, trim: true },
    },
    storageType: {
      type: String,
      required: true,
      enum: ['LithiumIon', 'FlowBattery', 'PumpedHydro', 'CompressedAir', 'Flywheel'],
      default: 'LithiumIon',
      index: true,
    },
    status: {
      type: String,
      default: 'Operational',
      enum: ['Construction', 'Operational', 'Charging', 'Discharging', 'Maintenance', 'Offline'],
      index: true,
    },
    totalCapacity: {
      type: Number,
      required: true,
      min: 0,
      default: 100, // 100 MWh
    },
    currentCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDischargeRate: {
      type: Number,
      default: 25, // 25 MW
      min: 0,
    },
    maxChargeRate: {
      type: Number,
      default: 25, // 25 MW
      min: 0,
    },
    roundTripEfficiency: {
      type: Number,
      default: 85, // 85%
      min: 0,
      max: 100,
    },
    selfDischargeRate: {
      type: Number,
      default: 0.1, // 0.1% per day
      min: 0,
      max: 100,
    },
    cycleCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxCycles: {
      type: Number,
      default: 5000,
      min: 0,
    },
    degradation: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    chargingCost: {
      type: Number,
      default: 30, // $/MWh
      min: 0,
    },
    dischargingRevenue: {
      type: Number,
      default: 80, // $/MWh
      min: 0,
    },
    operatingCost: {
      type: Number,
      default: 5, // $/MWh
      min: 0,
    },
    lastMaintenance: { type: Date },
    commissionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'energy_storage',
  }
);

// Virtual: State of charge (%)
EnergyStorageSchema.virtual('stateOfCharge').get(function() {
  const effectiveCapacity = this.totalCapacity * (1 - this.degradation / 100);
  return Math.round((this.currentCharge / effectiveCapacity) * 100);
});

// Virtual: Remaining cycle life
EnergyStorageSchema.virtual('remainingCycles').get(function() {
  return Math.max(0, this.maxCycles - this.cycleCount);
});

// Method: Charge the storage
EnergyStorageSchema.methods.charge = function(mwh: number): number {
  const effectiveCapacity = this.totalCapacity * (1 - this.degradation / 100);
  const maxCharge = effectiveCapacity - this.currentCharge;
  const actualCharge = Math.min(mwh * (this.roundTripEfficiency / 100), maxCharge);
  this.currentCharge += actualCharge;
  return actualCharge;
};

// Method: Discharge the storage
EnergyStorageSchema.methods.discharge = function(mwh: number): number {
  const actualDischarge = Math.min(mwh, this.currentCharge);
  this.currentCharge -= actualDischarge;
  this.cycleCount += actualDischarge / this.totalCapacity; // Partial cycle count
  return actualDischarge;
};

// Compound indexes
EnergyStorageSchema.index({ company: 1, status: 1 });
EnergyStorageSchema.index({ company: 1, storageType: 1 });

const EnergyStorage: Model<IEnergyStorage> = mongoose.models.EnergyStorage || mongoose.model<IEnergyStorage>('EnergyStorage', EnergyStorageSchema);

export default EnergyStorage;
