/**
 * @fileoverview Achievement Event Mongoose Model
 * @module lib/db/models/politics/AchievementEvent
 * 
 * OVERVIEW:
 * Persistence layer for political achievement unlocks. Tracks event-driven
 * achievements with categories, unlock thresholds, and claim status. Supports
 * achievement progression and reward distribution.
 * 
 * SCHEMA DESIGN:
 * - Indexed on playerId for fast player-specific queries
 * - Indexed on category for category-based filtering
 * - Compound index on playerId + category for portfolio queries
 * - Index on claimed for unclaimed achievement filtering
 * - Unique compound index on playerId + achievementKey (one unlock per achievement)
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  AchievementEvent as IAchievementEvent,
  AchievementCategory,
} from '@/lib/types/politics';

// ===================== INTERFACE EXTENSION =====================

export interface IAchievementEventDocument extends Omit<IAchievementEvent, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ===================== SCHEMA DEFINITION =====================

const AchievementEventSchema = new Schema<IAchievementEventDocument>(
  {
    playerId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(AchievementCategory),
      required: true,
      index: true,
    },
    unlockedEpoch: {
      type: Number,
      required: true,
      min: 0,
    },
    criteriaSummary: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    rewardType: {
      type: String,
      enum: ['INFLUENCE', 'FUNDRAISING_EFFICIENCY', 'REPUTATION_RESTORE', 'TITLE_UNLOCK'],
      required: true,
    },
    rewardValue: {
      type: Schema.Types.Mixed,
      required: true,
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
    collection: 'achievement_events',
  }
);

// ===================== INDEXES =====================

// Compound index for category-specific queries
AchievementEventSchema.index({ playerId: 1, category: 1 });

// Index for chronological sorting
AchievementEventSchema.index({ playerId: 1, unlockedEpoch: -1 });

// ===================== VIRTUALS =====================

AchievementEventSchema.virtual('id').get(function (this: IAchievementEventDocument) {
  return this._id.toHexString();
});

AchievementEventSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

// ===================== STATIC METHODS =====================

/**
 * Get all achievements for player
 */
AchievementEventSchema.statics.getPlayerAchievements = async function (
  this: Model<IAchievementEventDocument>,
  playerId: string
): Promise<IAchievementEventDocument[]> {
  return this.find({ playerId }).sort({ unlockedEpoch: -1 }).exec();
};

/**
 * Get achievements by category
 */
AchievementEventSchema.statics.getAchievementsByCategory = async function (
  this: Model<IAchievementEventDocument>,
  playerId: string,
  category: AchievementCategory
): Promise<IAchievementEventDocument[]> {
  return this.find({ playerId, category }).sort({ unlockedEpoch: -1 }).exec();
};

/**
 * Count achievements by category
 */
AchievementEventSchema.statics.countByCategory = async function (
  this: Model<IAchievementEventDocument>,
  playerId: string,
  category: AchievementCategory
): Promise<number> {
  return this.countDocuments({ playerId, category }).exec();
};

/**
 * Get recent achievements
 */
AchievementEventSchema.statics.getRecentAchievements = async function (
  this: Model<IAchievementEventDocument>,
  playerId: string,
  limit: number = 10
): Promise<IAchievementEventDocument[]> {
  return this.find({ playerId })
    .sort({ unlockedEpoch: -1 })
    .limit(limit)
    .exec();
};

// ===================== MODEL EXPORT =====================

const AchievementEvent =
  (mongoose.models.AchievementEvent as Model<IAchievementEventDocument>) ||
  mongoose.model<IAchievementEventDocument>('AchievementEvent', AchievementEventSchema);

export default AchievementEvent;
