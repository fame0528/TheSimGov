/**
 * @fileoverview Gas Field Model for Energy Industry
 * @module lib/db/models/energy/GasField
 * 
 * OVERVIEW:
 * Natural gas field model with pressure dynamics, quality grading,
 * production forecasting, and processing requirements.
 * 
 * QUALITY GRADES:
 * - Pipeline: Ready for distribution (+15-20% premium)
 * - Plant: Requires processing (baseline)
 * - Sour: High H2S content (-20-25% penalty)
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/** Gas quality grades */
export type GasQuality = 'Pipeline' | 'Plant' | 'Sour';

/** Field operational status */
export type FieldStatus = 'Exploration' | 'Development' | 'Production' | 'Declining' | 'Depleted' | 'Abandoned';

/** Geographic location */
export interface FieldLocation {
  latitude: number;
  longitude: number;
  region: string;
  depth: number; // feet
}

/** Gas field document interface */
export interface IGasField extends Document {
  company: Types.ObjectId;
  name: string;
  location: FieldLocation;
  status: FieldStatus;
  quality: GasQuality;
  
  // Reserve & production
  reserveEstimate: number; // MCF (thousand cubic feet)
  currentProduction: number; // MCF/day
  peakProduction: number;
  depletionRate: number;
  
  // Pressure tracking
  reservoirPressure: number; // PSI
  initialPressure: number;
  pressureDeclineRate: number; // % per month
  
  // Processing
  processingCost: number; // $/MCF
  h2sContent: number; // ppm
  co2Content: number; // percentage
  
  // Operations
  wellCount: number;
  lastMaintenance?: Date;
  commissionDate: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const GasFieldSchema = new Schema<IGasField>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Field name is required'],
      trim: true,
      maxlength: 100,
    },
    location: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
      region: { type: String, required: true, trim: true },
      depth: { type: Number, required: true, min: 0, default: 8000 },
    },
    status: {
      type: String,
      default: 'Exploration',
      enum: ['Exploration', 'Development', 'Production', 'Declining', 'Depleted', 'Abandoned'],
      index: true,
    },
    quality: {
      type: String,
      required: true,
      enum: ['Pipeline', 'Plant', 'Sour'],
      default: 'Plant',
      index: true,
    },
    reserveEstimate: {
      type: Number,
      required: true,
      min: 0,
      default: 500000, // 500 MMCF
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
      default: 2000, // MCF/day
    },
    depletionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 8,
    },
    reservoirPressure: {
      type: Number,
      required: true,
      min: 0,
      default: 3500, // PSI
    },
    initialPressure: {
      type: Number,
      required: true,
      min: 0,
      default: 4000,
    },
    pressureDeclineRate: {
      type: Number,
      default: 2, // % per month
      min: 0,
      max: 100,
    },
    processingCost: {
      type: Number,
      default: 0.50, // $/MCF
      min: 0,
    },
    h2sContent: {
      type: Number,
      default: 0, // ppm
      min: 0,
    },
    co2Content: {
      type: Number,
      default: 2, // percentage
      min: 0,
      max: 100,
    },
    wellCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    lastMaintenance: { type: Date },
    commissionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'gas_fields',
  }
);

// Virtual: Pressure ratio (current/initial)
GasFieldSchema.virtual('pressureRatio').get(function() {
  return this.reservoirPressure / this.initialPressure;
});

// Virtual: Quality price modifier
GasFieldSchema.virtual('qualityModifier').get(function() {
  switch (this.quality) {
    case 'Pipeline': return 1.17; // +17% premium
    case 'Plant': return 1.0;
    case 'Sour': return 0.78; // -22% penalty
    default: return 1.0;
  }
});

// Method: Calculate production based on pressure
GasFieldSchema.methods.calculateProduction = function(): number {
  const pressureRatio = this.reservoirPressure / this.initialPressure;
  const production = this.peakProduction * Math.pow(pressureRatio, 1.5);
  return Math.max(0, Math.round(production * 100) / 100);
};

// Compound indexes
GasFieldSchema.index({ company: 1, status: 1 });
GasFieldSchema.index({ company: 1, quality: 1 });

const GasField: Model<IGasField> = mongoose.models.GasField || mongoose.model<IGasField>('GasField', GasFieldSchema);

export default GasField;
