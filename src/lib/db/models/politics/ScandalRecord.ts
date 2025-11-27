/**
 * @fileoverview Scandal Record Mongoose Model
 * @module lib/db/models/politics/ScandalRecord
 * 
 * OVERVIEW:
 * Persistence layer for political scandal crisis events. Tracks scandal lifecycle
 * from generation through mitigation/expiration. Supports reputation impact
 * calculations and crisis management workflows.
 * 
 * SCHEMA DESIGN:
 * - Indexed on playerId for fast player-specific queries
 * - Indexed on status for active scandal filtering
 * - Compound index on playerId + status for active scandal lookups
 * - TTL index on expiresEpoch for automatic document expiration (optional)
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  ScandalRecord as IScandalRecord,
  ScandalCategory,
  ScandalStatus,
} from '@/lib/types/politics';

// ===================== INTERFACE EXTENSION =====================

export interface IScandalRecordDocument extends Omit<IScandalRecord, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ===================== SCHEMA DEFINITION =====================

const ScandalRecordSchema = new Schema<IScandalRecordDocument>(
  {
    playerId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(ScandalCategory),
      required: true,
    },
    severity: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    status: {
      type: String,
      enum: Object.values(ScandalStatus),
      required: true,
      default: ScandalStatus.DISCOVERED,
      index: true,
    },
    discoveredEpoch: {
      type: Number,
      required: true,
      min: 0,
    },
    containedEpoch: {
      type: Number,
      required: false,
      min: 0,
    },
    resolvedEpoch: {
      type: Number,
      required: false,
      min: 0,
    },
    reputationHitPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    recoveryRatePerHourPercent: {
      type: Number,
      required: true,
      min: 0,
    },
    mitigationActions: {
      type: [String],
      default: [],
    },
    seed: {
      type: String,
      required: true,
      trim: true,
    },
    updatedEpoch: {
      type: Number,
      required: true,
      min: 0,
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
    collection: 'scandal_records',
  }
);

// ===================== INDEXES =====================

// Compound index for active scandal queries
ScandalRecordSchema.index({ playerId: 1, status: 1 });

// Index for chronological queries
ScandalRecordSchema.index({ playerId: 1, discoveredEpoch: -1 });

// ===================== VIRTUALS =====================

ScandalRecordSchema.virtual('id').get(function (this: IScandalRecordDocument) {
  return this._id.toHexString();
});

ScandalRecordSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

// ===================== INSTANCE METHODS =====================

/**
 * Check if scandal is resolved
 */
ScandalRecordSchema.methods.isResolved = function (this: IScandalRecordDocument): boolean {
  return this.status === ScandalStatus.RESOLVED;
};

/**
 * Check if scandal is contained
 */
ScandalRecordSchema.methods.isContained = function (this: IScandalRecordDocument): boolean {
  return this.status === ScandalStatus.CONTAINED || this.status === ScandalStatus.RESOLVED;
};

/**
 * Get current reputation penalty
 */
ScandalRecordSchema.methods.getCurrentPenalty = function (
  this: IScandalRecordDocument
): number {
  return this.reputationHitPercent;
};

/**
 * Add mitigation action
 */
ScandalRecordSchema.methods.addMitigationAction = async function (
  this: IScandalRecordDocument,
  actionId: string
): Promise<IScandalRecordDocument> {
  if (!this.mitigationActions.includes(actionId)) {
    this.mitigationActions.push(actionId);
  }
  this.updatedEpoch = Date.now() / 1000;
  return this.save();
};

// ===================== STATIC METHODS =====================

/**
 * Get unresolved scandals for player
 */
ScandalRecordSchema.statics.getActiveScandals = async function (
  this: Model<IScandalRecordDocument>,
  playerId: string
): Promise<IScandalRecordDocument[]> {
  return this.find({ 
    playerId, 
    status: { $ne: ScandalStatus.RESOLVED } 
  })
    .sort({ discoveredEpoch: -1 })
    .exec();
};

/**
 * Get scandals by category
 */
ScandalRecordSchema.statics.getScandalsByCategory = async function (
  this: Model<IScandalRecordDocument>,
  playerId: string,
  category: ScandalCategory
): Promise<IScandalRecordDocument[]> {
  return this.find({ playerId, category }).sort({ discoveredEpoch: -1 }).exec();
};

/**
 * Calculate total active reputation penalty
 */
ScandalRecordSchema.statics.getTotalPenalty = async function (
  this: Model<IScandalRecordDocument>,
  playerId: string
): Promise<number> {
  const activeScandals = await this.find({ 
    playerId, 
    status: { $ne: ScandalStatus.RESOLVED } 
  }).exec();

  return activeScandals.reduce((total, scandal) => {
    return total + scandal.reputationHitPercent;
  }, 0);
};

/**
 * Get scandals by status
 */
ScandalRecordSchema.statics.getScandalsByStatus = async function (
  this: Model<IScandalRecordDocument>,
  playerId: string,
  status: ScandalStatus
): Promise<IScandalRecordDocument[]> {
  return this.find({ playerId, status })
    .sort({ discoveredEpoch: -1 })
    .exec();
};

// ===================== MODEL EXPORT =====================

const ScandalRecord =
  (mongoose.models.ScandalRecord as Model<IScandalRecordDocument>) ||
  mongoose.model<IScandalRecordDocument>('ScandalRecord', ScandalRecordSchema);

export default ScandalRecord;
