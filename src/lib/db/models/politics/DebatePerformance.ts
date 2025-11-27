/**
 * @fileoverview Debate Performance Mongoose Model
 * @module lib/db/models/politics/DebatePerformance
 * 
 * OVERVIEW:
 * Persistence layer for debate scoring records. Tracks rhetorical, policy, and charisma
 * performance with weighted total scores. Supports multi-stage debates and penalty
 * applications (scandal/fatigue).
 * 
 * SCHEMA DESIGN:
 * - Indexed on debateId for fast debate-specific queries
 * - Indexed on playerId for player performance history
 * - Compound index on debateId + playerId for unique performance lookups
 * - Deterministic seed for reproducible performance calculations
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { DebatePerformance as IDebatePerformance } from '@/lib/types/politics';

// ===================== INTERFACE EXTENSION =====================

export interface IDebatePerformanceDocument extends Omit<IDebatePerformance, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ===================== SCHEMA DEFINITION =====================

const DebatePerformanceSchema = new Schema<IDebatePerformanceDocument>(
  {
    debateId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    playerId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    performanceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    rhetoricalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    policyScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    charismaScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    penalties: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.every((penalty) => typeof penalty === 'string' && penalty.length > 0);
        },
        message: 'All penalties must be non-empty strings',
      },
    },
    pollShiftImmediatePercent: {
      type: Number,
      required: true,
    },
    pollShiftPersistingPercent: {
      type: Number,
      required: true,
    },
    reputationAfterDebate: {
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
    createdEpoch: {
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
    collection: 'debate_performances',
  }
);

// ===================== INDEXES =====================

// Compound index for unique debate performance lookup
DebatePerformanceSchema.index({ debateId: 1, playerId: 1 }, { unique: true });

// Index for player performance history
DebatePerformanceSchema.index({ playerId: 1, createdEpoch: -1 });

// ===================== VIRTUALS =====================

DebatePerformanceSchema.virtual('id').get(function (this: IDebatePerformanceDocument) {
  return this._id.toHexString();
});

DebatePerformanceSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

// ===================== INSTANCE METHODS =====================

/**
 * Check if performance had penalties applied
 */
DebatePerformanceSchema.methods.hasPenalties = function (
  this: IDebatePerformanceDocument
): boolean {
  return this.penalties.length > 0;
};

/**
 * Get penalty count
 */
DebatePerformanceSchema.methods.getPenaltyCount = function (
  this: IDebatePerformanceDocument
): number {
  return this.penalties.length;
};

/**
 * Calculate performance tier (S/A/B/C/F)
 */
DebatePerformanceSchema.methods.getPerformanceTier = function (
  this: IDebatePerformanceDocument
): 'S' | 'A' | 'B' | 'C' | 'F' {
  const score = this.performanceScore;
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'F';
};

// ===================== STATIC METHODS =====================

/**
 * Get performance for specific debate
 */
DebatePerformanceSchema.statics.getDebatePerformance = async function (
  this: Model<IDebatePerformanceDocument>,
  debateId: string,
  playerId: string
): Promise<IDebatePerformanceDocument | null> {
  return this.findOne({ debateId, playerId }).exec();
};

/**
 * Get player's debate history
 */
DebatePerformanceSchema.statics.getPlayerHistory = async function (
  this: Model<IDebatePerformanceDocument>,
  playerId: string,
  limit: number = 10
): Promise<IDebatePerformanceDocument[]> {
  return this.find({ playerId })
    .sort({ createdEpoch: -1 })
    .limit(limit)
    .exec();
};

/**
 * Calculate player's average debate score
 */
DebatePerformanceSchema.statics.getAverageScore = async function (
  this: Model<IDebatePerformanceDocument>,
  playerId: string
): Promise<number> {
  const performances = await this.find({ playerId }).exec();
  if (performances.length === 0) return 0;

  const sum = performances.reduce((acc, perf) => acc + perf.performanceScore, 0);
  return sum / performances.length;
};

// ===================== MODEL EXPORT =====================

const DebatePerformance =
  (mongoose.models.DebatePerformance as Model<IDebatePerformanceDocument>) ||
  mongoose.model<IDebatePerformanceDocument>('DebatePerformance', DebatePerformanceSchema);

export default DebatePerformance;
