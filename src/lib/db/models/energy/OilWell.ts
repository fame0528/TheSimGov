/**
 * @fileoverview Oil Well Model for Energy Industry
 * @module lib/db/models/energy/OilWell
 * 
 * OVERVIEW:
 * Oil well model representing drilling sites with extraction mechanics,
 * depletion calculations, maintenance scheduling, and production optimization.
 * Supports conventional, unconventional, offshore, and shale extraction.
 * 
 * BUSINESS LOGIC:
 * - Production follows logarithmic decline curve
 * - Depletion rate: 2-15% per year depending on well type
 * - Maintenance required every 90 days
 * - Revenue = (production × oilPrice) - (production × extractionCost)
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/** Oil well operational types */
export type WellType = 'Conventional' | 'Unconventional' | 'Offshore' | 'Shale';

/** Well operational status */
export type WellStatus = 'Drilling' | 'Active' | 'Depleted' | 'Maintenance' | 'Abandoned';

/** Geographic location data */
export interface WellLocation {
  latitude: number;
  longitude: number;
  region: string;
}

/** Equipment tracking */
export interface WellEquipment {
  type: 'Pump' | 'Pipe' | 'Storage' | 'Compressor' | 'Separator';
  name: string;
  efficiency: number;
  lastMaintenance: Date;
  cost: number;
}

/** Oil well document interface */
export interface IOilWell extends Document {
  company: Types.ObjectId;
  name: string;
  location: WellLocation;
  wellType: WellType;
  status: WellStatus;
  
  // Reserve & production
  reserveEstimate: number;
  currentProduction: number;
  peakProduction: number;
  depletionRate: number;
  extractionCost: number;
  
  // Operations
  lastMaintenance?: Date;
  commissionDate: Date;
  depth: number;
  equipment: WellEquipment[];
  
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  daysActive: number;
  maintenanceOverdue: boolean;
  
  // Methods
  calculateProduction(): number;
  calculateDailyRevenue(oilPrice: number): number;
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
      maxlength: 100,
    },
    location: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
      region: { type: String, required: true, trim: true },
    },
    wellType: {
      type: String,
      required: true,
      enum: ['Conventional', 'Unconventional', 'Offshore', 'Shale'],
      index: true,
    },
    status: {
      type: String,
      default: 'Drilling',
      enum: ['Drilling', 'Active', 'Depleted', 'Maintenance', 'Abandoned'],
      index: true,
    },
    reserveEstimate: {
      type: Number,
      required: true,
      min: 0,
      default: 100000,
    },
    currentProduction: {
      type: Number,
      default: 0,
      min: 0,
    },
    peakProduction: {
      type: Number,
      required: true,
      min: 0,
      default: 500,
    },
    depletionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 5,
    },
    extractionCost: {
      type: Number,
      required: true,
      min: 0,
      default: 25,
    },
    lastMaintenance: { type: Date },
    commissionDate: {
      type: Date,
      default: Date.now,
    },
    depth: {
      type: Number,
      required: true,
      min: 0,
      default: 5000,
    },
    equipment: [{
      type: { type: String, enum: ['Pump', 'Pipe', 'Storage', 'Compressor', 'Separator'] },
      name: { type: String, trim: true },
      efficiency: { type: Number, min: 0, max: 100, default: 100 },
      lastMaintenance: { type: Date },
      cost: { type: Number, min: 0 },
    }],
  },
  {
    timestamps: true,
    collection: 'oil_wells',
  }
);

// Virtual: Days active since commission
OilWellSchema.virtual('daysActive').get(function() {
  return Math.floor((Date.now() - this.commissionDate.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual: Check maintenance overdue (90 days)
OilWellSchema.virtual('maintenanceOverdue').get(function() {
  if (!this.lastMaintenance) return true;
  const daysSinceMaintenance = Math.floor((Date.now() - this.lastMaintenance.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceMaintenance > 90;
});

// Method: Calculate current production based on depletion
OilWellSchema.methods.calculateProduction = function(): number {
  const daysActive = this.daysActive || 0;
  const yearsActive = daysActive / 365;
  const production = this.peakProduction * Math.pow(1 - this.depletionRate / 100, yearsActive);
  return Math.max(0, Math.round(production * 100) / 100);
};

// Method: Calculate daily revenue
OilWellSchema.methods.calculateDailyRevenue = function(oilPrice: number): number {
  const production = this.calculateProduction();
  const revenue = production * oilPrice;
  const cost = production * this.extractionCost;
  return Math.round((revenue - cost) * 100) / 100;
};

// Compound index for efficient queries
OilWellSchema.index({ company: 1, status: 1 });
OilWellSchema.index({ company: 1, wellType: 1 });

const OilWell: Model<IOilWell> = mongoose.models.OilWell || mongoose.model<IOilWell>('OilWell', OilWellSchema);

export default OilWell;
