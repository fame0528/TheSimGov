/**
 * @fileoverview Territory Model - MMO Territory Control
 * @module models/crime/Territory
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 * 
 * OVERVIEW:
 * Territory system for gang control and passive income generation. Territories represent
 * city blocks/districts that can be claimed, contested, and defended. Income scales with
 * population, demographics, and control duration.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
const { ObjectId } = Types;

export type TerritoryStatus = 'Unclaimed' | 'Claimed' | 'Contested' | 'Lockdown';

export interface IDemographics {
  population: number;
  medianIncome: number; // Annual household income
  crimeRate: number; // 0-100 (higher = more crime-friendly)
  lawEnforcementPresence: number; // 0-100 (higher = more police)
}

export interface ITerritory extends Document {
  territoryId: string; // Unique identifier (e.g., "NYC-MANHATTAN-001")
  name: string; // Display name (e.g., "Lower East Side Block 42")
  location: {
    state: string;
    city: string;
    district: string;
    coordinates?: { lat: number; lng: number };
  };
  controlledBy: mongoose.Types.ObjectId | null; // ref Gang (null if unclaimed)
  contestedBy: mongoose.Types.ObjectId[]; // refs Gang (challengers)
  status: TerritoryStatus;
  income: number; // Daily passive income ($)
  demographics: IDemographics;
  heatLevel: number; // Local enforcement attention (0-100)
  claimedAt?: Date;
  lastContestedAt?: Date;
  influencePoints: number; // Cost to claim/contest
  createdAt: Date;
  updatedAt: Date;
  // Methods
  calculateIncome(): number;
  isClaimable(): boolean;
  isContestable(challengerGangId: string): boolean;
}

const DemographicsSchema = new Schema<IDemographics>({
  population: { type: Number, required: true, min: 100 },
  medianIncome: { type: Number, required: true, min: 0 },
  crimeRate: { type: Number, required: true, min: 0, max: 100 },
  lawEnforcementPresence: { type: Number, required: true, min: 0, max: 100 }
}, { _id: false });

const TerritorySchema = new Schema<ITerritory>({
  territoryId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  location: {
    state: { type: String, required: true, index: true },
    city: { type: String, required: true, index: true },
    district: { type: String, required: true },
    coordinates: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 }
    }
  },
  controlledBy: {
    type: Schema.Types.ObjectId,
    ref: 'Gang',
    default: null,
    index: true
  },
  contestedBy: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Gang' }],
    default: []
  },
  status: {
    type: String,
    enum: ['Unclaimed', 'Claimed', 'Contested', 'Lockdown'],
    required: true,
    default: 'Unclaimed',
    index: true
  },
  income: {
    type: Number,
    required: true,
    min: 0,
    default: 100 // Base daily income
  },
  demographics: {
    type: DemographicsSchema,
    required: true
  },
  heatLevel: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 20
  },
  claimedAt: {
    type: Date
  },
  lastContestedAt: {
    type: Date
  },
  influencePoints: {
    type: Number,
    required: true,
    min: 100,
    default: 1000 // Cost to claim
  }
}, { timestamps: true });

// Compound indexes for common queries
TerritorySchema.index({ 'location.state': 1, 'location.city': 1, status: 1 });
TerritorySchema.index({ controlledBy: 1, status: 1 });
TerritorySchema.index({ status: 1, income: -1 }); // High-value territories

// Method: Calculate actual income based on demographics and heat
TerritorySchema.methods.calculateIncome = function(): number {
  const baseIncome = this.income;
  const crimeMultiplier = 1 + (this.demographics.crimeRate / 100); // Up to 2x
  const incomeMultiplier = 1 + (this.demographics.medianIncome / 100000); // Scales with wealth
  const heatPenalty = 1 - (this.heatLevel / 200); // Max 50% reduction
  
  return Math.floor(baseIncome * crimeMultiplier * incomeMultiplier * heatPenalty);
};

// Method: Check if territory is claimable
TerritorySchema.methods.isClaimable = function(): boolean {
  return this.status === 'Unclaimed' || this.status === 'Contested';
};

// Method: Check if territory is contestable
TerritorySchema.methods.isContestable = function(challengerGangId: string): boolean {
  if (this.status === 'Lockdown') return false;
  if (this.status === 'Unclaimed') return false;
  if (!this.controlledBy) return false;
  
  // Can't contest your own territory
  if (this.controlledBy.toString() === challengerGangId) return false;
  
  // Can't be contested if already contested by same gang
  const alreadyContesting = this.contestedBy.some(
    (id: mongoose.Types.ObjectId) => id.toString() === challengerGangId
  );
  
  return !alreadyContesting;
};

export const Territory: Model<ITerritory> = mongoose.models.Territory || mongoose.model<ITerritory>('Territory', TerritorySchema);

export default Territory;
