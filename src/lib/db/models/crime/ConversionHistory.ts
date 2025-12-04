/**
 * @fileoverview ConversionHistory Model - Audit trail for facility → business conversions
 * @module models/crime/ConversionHistory
 *
 * OVERVIEW:
 * Records conversions from illegal facilities to legitimate businesses with pre/post snapshots
 * and computed revenue metrics, enabling analytics and compliance auditing.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { SubstanceName } from '@/lib/types/crime';

export interface IConversionHistory extends Document {
  facilityId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  substance: SubstanceName;
  effectiveDate: Date; // conversion date
  taxRate: number;
  preLegalRevenue: number;  // sum of illegalValue across inventory
  postLegalRevenue: number; // sum of legalValue across inventory
  actorId: string;          // user id who initiated conversion
  notes?: string;
  preSnapshot?: Record<string, unknown>;
  postSnapshot?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversionHistorySchema = new Schema<IConversionHistory>({
  facilityId: { type: Schema.Types.ObjectId, ref: 'ProductionFacility', required: true, index: true },
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  substance: {
    type: String,
    required: true,
    enum: ['Cannabis', 'Cocaine', 'Heroin', 'Methamphetamine', 'MDMA', 'LSD', 'Psilocybin', 'Fentanyl', 'Oxycodone'],
  },
  effectiveDate: { type: Date, required: true, default: Date.now },
  taxRate: { type: Number, required: true, min: 0, max: 100, default: 0 },
  preLegalRevenue: { type: Number, required: true, min: 0, default: 0 },
  postLegalRevenue: { type: Number, required: true, min: 0, default: 0 },
  actorId: { type: String, required: true, index: true },
  notes: { type: String },
  preSnapshot: { type: Schema.Types.Mixed },
  postSnapshot: { type: Schema.Types.Mixed },
}, { timestamps: true });

// Secondary indexes
ConversionHistorySchema.index({ substance: 1, effectiveDate: -1 });
ConversionHistorySchema.index({ createdAt: -1 });

export const ConversionHistory: Model<IConversionHistory> =
  mongoose.models.ConversionHistory || mongoose.model<IConversionHistory>('ConversionHistory', ConversionHistorySchema);

export default ConversionHistory;
