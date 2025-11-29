/**
 * @fileoverview Transmission Line Model for Energy Grid
 * @module lib/db/models/energy/TransmissionLine
 * 
 * OVERVIEW:
 * High-voltage transmission line model for power grid infrastructure.
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/** Line voltage levels */
export type VoltageLevel = '115kV' | '230kV' | '345kV' | '500kV' | '765kV' | 'HVDC';

/** Line status */
export type LineStatus = 'Operational' | 'Maintenance' | 'Overloaded' | 'Outage' | 'Construction';

/** Transmission line document interface */
export interface ITransmissionLine extends Document {
  company: Types.ObjectId;
  name: string;
  
  // Route
  startPoint: {
    latitude: number;
    longitude: number;
    substation: string;
  };
  endPoint: {
    latitude: number;
    longitude: number;
    substation: string;
  };
  lengthMiles: number;
  
  // Technical
  voltageLevel: VoltageLevel;
  status: LineStatus;
  capacity: number; // MW
  currentLoad: number; // MW
  losses: number; // % per 100 miles
  
  // Economics
  maintenanceCost: number; // $/mile/year
  congestionCharges: number; // $/MWh
  
  // Operations
  lastInspection?: Date;
  commissionDate: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const TransmissionLineSchema = new Schema<ITransmissionLine>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    startPoint: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      substation: { type: String, required: true },
    },
    endPoint: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      substation: { type: String, required: true },
    },
    lengthMiles: {
      type: Number,
      required: true,
      min: 0,
    },
    voltageLevel: {
      type: String,
      required: true,
      enum: ['115kV', '230kV', '345kV', '500kV', '765kV', 'HVDC'],
      default: '345kV',
    },
    status: {
      type: String,
      default: 'Operational',
      enum: ['Operational', 'Maintenance', 'Overloaded', 'Outage', 'Construction'],
      index: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 0,
      default: 1000, // MW
    },
    currentLoad: {
      type: Number,
      default: 0,
      min: 0,
    },
    losses: {
      type: Number,
      default: 0.5, // % per 100 miles
      min: 0,
      max: 10,
    },
    maintenanceCost: {
      type: Number,
      default: 5000, // $/mile/year
      min: 0,
    },
    congestionCharges: {
      type: Number,
      default: 5, // $/MWh
      min: 0,
    },
    lastInspection: { type: Date },
    commissionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'transmission_lines',
  }
);

// Virtual: Utilization percentage
TransmissionLineSchema.virtual('utilization').get(function() {
  return Math.round((this.currentLoad / this.capacity) * 100);
});

// Virtual: Total losses for this line
TransmissionLineSchema.virtual('totalLosses').get(function() {
  return (this.losses / 100) * (this.lengthMiles / 100) * this.currentLoad;
});

// Compound indexes
TransmissionLineSchema.index({ company: 1, status: 1 });

const TransmissionLine: Model<ITransmissionLine> = mongoose.models.TransmissionLine || mongoose.model<ITransmissionLine>('TransmissionLine', TransmissionLineSchema);

export default TransmissionLine;
