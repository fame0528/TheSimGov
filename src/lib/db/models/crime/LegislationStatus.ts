/**
 * @fileoverview LegislationStatus Model - Federal/State Substance Legalization Tracking
 * @module models/crime/LegislationStatus
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 * 
 * OVERVIEW:
 * Tracks federal and state-level legalization status for substances. Supports transition
 * from illegal → decriminalized → medical → recreational. Integrates with Politics domain
 * for bill passage events. Enables automatic facility conversion when substances legalized.
 * 
 * FEATURES:
 * - Multi-jurisdiction tracking (federal + 50 states)
 * - Status progression with effective dates
 * - Penalty structures per jurisdiction
 * - Tax rates for legal sales
 * - Regulatory requirements
 * - Methods: isLegal(), canConvert(), isPenalized()
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { SubstanceName, LegalStatus } from '@/lib/types/crime';

export type Jurisdiction = 'Federal' | 'State';

export interface PenaltyStructure {
  possession: string; // e.g., "Misdemeanor, up to 1 year"
  distribution: string; // e.g., "Felony, 5-20 years"
  manufacturing: string; // e.g., "Felony, 10-40 years"
  fineMin: number; // Minimum fine in dollars
  fineMax: number; // Maximum fine in dollars
}

export interface ILegislationStatus extends Document {
  substance: SubstanceName;
  jurisdiction: Jurisdiction;
  jurisdictionId: string; // "USA" for Federal, state code for State (e.g., "CA", "TX")
  status: LegalStatus;
  effectiveDate: Date;
  sunsetDate?: Date; // Optional expiration date for temporary legalization
  penalties: PenaltyStructure;
  taxRate: number; // Percentage tax on legal sales (0 if illegal)
  regulations: string[]; // Array of regulatory requirements
  relatedBillId?: mongoose.Types.ObjectId; // Reference to Politics Bill if passed via legislation
  createdAt: Date;
  updatedAt: Date;
  // Methods
  isLegal(): boolean;
  canConvert(): boolean;
  isPenalized(activityType: 'possession' | 'distribution' | 'manufacturing'): boolean;
}

const PenaltyStructureSchema = new Schema<PenaltyStructure>({
  possession: { type: String, required: true },
  distribution: { type: String, required: true },
  manufacturing: { type: String, required: true },
  fineMin: { type: Number, required: true, min: 0 },
  fineMax: { type: Number, required: true, min: 0 }
}, { _id: false });

const LegislationStatusSchema = new Schema<ILegislationStatus>({
  substance: {
    type: String,
    required: true,
    enum: ['Cannabis', 'Cocaine', 'Heroin', 'Methamphetamine', 'MDMA', 'LSD', 'Psilocybin', 'Fentanyl', 'Oxycodone']
  },
  jurisdiction: {
    type: String,
    required: true,
    enum: ['Federal', 'State']
  },
  jurisdictionId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Illegal', 'Decriminalized', 'Medical', 'Recreational'],
    default: 'Illegal'
  },
  effectiveDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  sunsetDate: {
    type: Date
  },
  penalties: {
    type: PenaltyStructureSchema,
    required: true
  },
  taxRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  regulations: {
    type: [String],
    default: []
  },
  relatedBillId: {
    type: Schema.Types.ObjectId,
    ref: 'Bill'
  }
}, { timestamps: true });

// Indexes
LegislationStatusSchema.index({ substance: 1, jurisdiction: 1, jurisdictionId: 1 }, { unique: true });
LegislationStatusSchema.index({ status: 1, effectiveDate: -1 });

// Methods
LegislationStatusSchema.methods.isLegal = function(): boolean {
  const now = new Date();
  const isEffective = this.effectiveDate <= now;
  const notExpired = !this.sunsetDate || this.sunsetDate > now;
  const legalStatuses: LegalStatus[] = ['Medical', 'Recreational'];
  
  return isEffective && notExpired && legalStatuses.includes(this.status);
};

LegislationStatusSchema.methods.canConvert = function(): boolean {
  // Facility can convert to legitimate business if substance is legal (Medical or Recreational)
  return this.isLegal();
};

LegislationStatusSchema.methods.isPenalized = function(activityType: 'possession' | 'distribution' | 'manufacturing'): boolean {
  // Returns true if activity type has penalties (not fully legal for that activity)
  if (this.status === 'Illegal') return true;
  if (this.status === 'Decriminalized' && activityType !== 'possession') return true;
  if (this.status === 'Medical' && activityType === 'distribution') return false; // Licensed distribution allowed
  if (this.status === 'Recreational') return false; // All activities legal (with regulation)
  
  return true;
};

export const LegislationStatus: Model<ILegislationStatus> = 
  mongoose.models.LegislationStatus || 
  mongoose.model<ILegislationStatus>('LegislationStatus', LegislationStatusSchema);

export default LegislationStatus;
