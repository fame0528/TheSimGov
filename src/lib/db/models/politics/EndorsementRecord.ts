/**
 * @fileoverview Endorsement Record Mongoose Model
 * @module lib/db/models/politics/EndorsementRecord
 * 
 * OVERVIEW:
 * Persistence layer for political endorsement acquisitions. Tracks endorsement
 * sources, tiers, bonuses with diminishing returns curve. Supports expiration
 * and endorsement portfolio management.
 * 
 * SCHEMA DESIGN:
 * - Indexed on playerId for fast player-specific queries
 * - Indexed on sourceCategory for category-based filtering
 * - Compound index on playerId + sourceCategory for portfolio queries
 * - Index on expiresEpoch for expiration cleanup
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  EndorsementRecord as IEndorsementRecord,
  EndorsementSourceCategory,
  EndorsementTier,
} from '@/lib/types/politics';

// ===================== INTERFACE EXTENSION =====================

export interface IEndorsementRecordDocument extends Omit<IEndorsementRecord, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ===================== SCHEMA DEFINITION =====================

const EndorsementRecordSchema = new Schema<IEndorsementRecordDocument>(
  {
    playerId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    sourceCategory: {
      type: String,
      enum: Object.values(EndorsementSourceCategory),
      required: true,
      index: true,
    },
    sourceName: {
      type: String,
      required: true,
      trim: true,
    },
    tier: {
      type: String,
      enum: Object.values(EndorsementTier),
      required: true,
    },
    acquiredEpoch: {
      type: Number,
      required: true,
      min: 0,
    },
    diminishingReturnFactor: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    influenceBonusPercent: {
      type: Number,
      required: true,
      min: 0,
    },
    fundraisingBonusPercent: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryEpoch: {
      type: Number,
      required: false,
      min: 0,
      index: true,
    },
    schemaVersion: {
      type: Number,
      required: true,
      default: 1,
      immutable: true,
    },
  },
  {
    timestamps: true,
    collection: 'endorsement_records',
  }
);

// ===================== INDEXES =====================

// Compound index for category-specific portfolio queries
EndorsementRecordSchema.index({ playerId: 1, sourceCategory: 1 });

// Index for active endorsement filtering
EndorsementRecordSchema.index({ playerId: 1, expiryEpoch: 1 });

// ===================== VIRTUALS =====================

EndorsementRecordSchema.virtual('id').get(function (this: IEndorsementRecordDocument) {
  return this._id.toHexString();
});

EndorsementRecordSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

// ===================== INSTANCE METHODS =====================

/**
 * Check if endorsement is expired
 */
EndorsementRecordSchema.methods.isExpired = function (
  this: IEndorsementRecordDocument
): boolean {
  if (!this.expiryEpoch) return false;
  return Date.now() / 1000 >= this.expiryEpoch;
};

/**
 * Check if endorsement is active (not expired)
 */
EndorsementRecordSchema.methods.isActive = function (this: IEndorsementRecordDocument): boolean {
  if (!this.expiryEpoch) return true;
  return Date.now() / 1000 < this.expiryEpoch;
};

/**
 * Calculate time remaining until expiration (seconds)
 */
EndorsementRecordSchema.methods.getTimeRemaining = function (
  this: IEndorsementRecordDocument
): number {
  if (!this.expiryEpoch) return Infinity;
  const remaining = this.expiryEpoch - Date.now() / 1000;
  return Math.max(0, remaining);
};

// ===================== STATIC METHODS =====================

/**
 * Get active endorsements for player
 */
EndorsementRecordSchema.statics.getActiveEndorsements = async function (
  this: Model<IEndorsementRecordDocument>,
  playerId: string
): Promise<IEndorsementRecordDocument[]> {
  const now = Date.now() / 1000;
  return this.find({
    playerId,
    $or: [{ expiryEpoch: { $gt: now } }, { expiryEpoch: { $exists: false } }],
  })
    .sort({ acquiredEpoch: -1 })
    .exec();
};

/**
 * Get endorsements by category
 */
EndorsementRecordSchema.statics.getEndorsementsByCategory = async function (
  this: Model<IEndorsementRecordDocument>,
  playerId: string,
  category: EndorsementSourceCategory
): Promise<IEndorsementRecordDocument[]> {
  return this.find({ playerId, sourceCategory: category })
    .sort({ acquiredEpoch: -1 })
    .exec();
};

/**
 * Calculate total influence bonus from active endorsements
 */
EndorsementRecordSchema.statics.getTotalInfluenceBonus = async function (
  this: Model<IEndorsementRecordDocument>,
  playerId: string
): Promise<number> {
  const now = Date.now() / 1000;
  const activeEndorsements = await this.find({
    playerId,
    $or: [{ expiryEpoch: { $gt: now } }, { expiryEpoch: { $exists: false } }],
  }).exec();
  return activeEndorsements.reduce((total: number, endorsement: IEndorsementRecordDocument) => 
    total + endorsement.influenceBonusPercent, 0);
};

/**
 * Calculate total fundraising bonus from active endorsements
 */
EndorsementRecordSchema.statics.getTotalFundraisingBonus = async function (
  this: Model<IEndorsementRecordDocument>,
  playerId: string
): Promise<number> {
  const now = Date.now() / 1000;
  const activeEndorsements = await this.find({
    playerId,
    $or: [{ expiryEpoch: { $gt: now } }, { expiryEpoch: { $exists: false } }],
  }).exec();
  return activeEndorsements.reduce((total: number, endorsement: IEndorsementRecordDocument) => 
    total + endorsement.fundraisingBonusPercent, 0);
};

/**
 * Count endorsements by category
 */
EndorsementRecordSchema.statics.countByCategory = async function (
  this: Model<IEndorsementRecordDocument>,
  playerId: string,
  category: EndorsementSourceCategory
): Promise<number> {
  const now = Date.now() / 1000;
  return this.countDocuments({
    playerId,
    sourceCategory: category,
    $or: [{ expiryEpoch: { $gt: now } }, { expiryEpoch: { $exists: false } }],
  }).exec();
};

/**
 * Expire old endorsements
 */
EndorsementRecordSchema.statics.expireOldEndorsements = async function (
  this: Model<IEndorsementRecordDocument>
): Promise<number> {
  const now = Date.now() / 1000;
  const result = await this.deleteMany({
    expiryEpoch: { $lte: now },
  }).exec();

  return result.deletedCount;
};

// ===================== MODEL EXPORT =====================

const EndorsementRecord =
  (mongoose.models.EndorsementRecord as Model<IEndorsementRecordDocument>) ||
  mongoose.model<IEndorsementRecordDocument>('EndorsementRecord', EndorsementRecordSchema);

export default EndorsementRecord;
