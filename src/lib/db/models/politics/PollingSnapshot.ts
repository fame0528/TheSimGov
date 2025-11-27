/**
 * @fileoverview Polling Snapshot Mongoose Model
 * @module lib/db/models/politics/PollingSnapshot
 * 
 * OVERVIEW:
 * Persistence layer for smoothed polling data points. Tracks player support over time
 * with volatility dampening and offline fairness adjustments. Enables trend analysis
 * and historical polling visualization.
 * 
 * SCHEMA DESIGN:
 * - Indexed on playerId for fast player-specific queries
 * - Indexed on timestampEpoch for chronological sorting
 * - Compound index on playerId + timestampEpoch for time-series queries
 * - Deterministic seed for reproducible polling generation
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { PollingSnapshot as IPollingSnapshot } from '@/lib/types/politics';

// ===================== INTERFACE EXTENSION =====================

export interface IPollingSnapshotDocument extends Omit<IPollingSnapshot, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ===================== SCHEMA DEFINITION =====================

const PollingSnapshotSchema = new Schema<IPollingSnapshotDocument>(
  {
    playerId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    timestampEpoch: {
      type: Number,
      required: true,
      index: true,
      min: 0,
    },
    sampleSize: {
      type: Number,
      required: true,
      min: 100,
      max: 10000,
    },
    baseSupportPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    volatilityAppliedPercent: {
      type: Number,
      required: true,
    },
    smoothingAppliedPercent: {
      type: Number,
      required: true,
    },
    finalSupportPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    marginOfErrorPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    reputationScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    seed: {
      type: String,
      required: true,
      trim: true,
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
    collection: 'polling_snapshots',
  }
);

// ===================== INDEXES =====================

// Compound index for efficient time-series queries
PollingSnapshotSchema.index({ playerId: 1, timestampEpoch: -1 });

// Index for global polling analysis (admin/analytics)
PollingSnapshotSchema.index({ timestampEpoch: -1 });

// ===================== VIRTUALS =====================

PollingSnapshotSchema.virtual('id').get(function (this: IPollingSnapshotDocument) {
  return this._id.toHexString();
});

PollingSnapshotSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

// ===================== STATIC METHODS =====================

/**
 * Get recent polling snapshots for player
 */
PollingSnapshotSchema.statics.getRecentSnapshots = async function (
  this: Model<IPollingSnapshotDocument>,
  playerId: string,
  limit: number = 20
): Promise<IPollingSnapshotDocument[]> {
  return this.find({ playerId })
    .sort({ timestampEpoch: -1 })
    .limit(limit)
    .exec();
};

/**
 * Get snapshots within time window
 */
PollingSnapshotSchema.statics.getSnapshotsInWindow = async function (
  this: Model<IPollingSnapshotDocument>,
  playerId: string,
  startEpoch: number,
  endEpoch: number
): Promise<IPollingSnapshotDocument[]> {
  return this.find({
    playerId,
    timestampEpoch: { $gte: startEpoch, $lte: endEpoch },
  })
    .sort({ timestampEpoch: 1 })
    .exec();
};

/**
 * Calculate average support over window
 */
PollingSnapshotSchema.statics.calculateAverageSupport = async function (
  this: Model<IPollingSnapshotDocument>,
  playerId: string,
  windowHours: number
): Promise<number> {
  const windowSeconds = windowHours * 3600;
  const startEpoch = Date.now() / 1000 - windowSeconds;

  const snapshots = await this.find({
    playerId,
    timestampEpoch: { $gte: startEpoch },
  }).exec();

  if (snapshots.length === 0) return 0;

  const sum = snapshots.reduce((acc, snap) => acc + snap.finalSupportPercent, 0);
  return sum / snapshots.length;
};

// ===================== MODEL EXPORT =====================

const PollingSnapshot =
  (mongoose.models.PollingSnapshot as Model<IPollingSnapshotDocument>) ||
  mongoose.model<IPollingSnapshotDocument>('PollingSnapshot', PollingSnapshotSchema);

export default PollingSnapshot;
