/**
 * @file src/lib/db/models/AchievementUnlock.ts
 * @description Persistent audit trail of achievement unlocks (idempotent rewards)
 * @created 2025-11-27
 *
 * OVERVIEW:
 * Stores each achievement unlock (including repeat occurrences when repeatable).
 * Enforces idempotent reward application via `rewardApplied` boolean. Compound
 * unique index (playerId + achievementId + repeatIndex) prevents duplicate rows
 * for same repeat cycle. Uses schemaVersion literal for forward migrations.
 *
 * INDEX STRATEGY (GUARDIAN Checkpoint #17 Compliant):
 * - Single compound unique index only; no field-level duplicate index definitions.
 * - Additional non-unique index on (playerId, achievementId) for progress queries.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type AchievementUnlockStatus = 'LOCKED' | 'UNLOCKED' | 'CLAIMED';

export interface IAchievementUnlock extends Document {
  playerId: Types.ObjectId;
  achievementId: string;           // Matches AchievementDefinition.id
  unlockedEpoch: number;           // Unix epoch seconds
  status: AchievementUnlockStatus; // LOCKED → UNLOCKED → CLAIMED
  rewardApplied: boolean;          // Idempotent reward guard
  repeatIndex?: number;            // 0 for first unlock; increments if repeatable
  schemaVersion: 1;                // Literal version
  createdAt: Date;
  updatedAt: Date;
}

const AchievementUnlockSchema = new Schema<IAchievementUnlock>(
  {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'playerId is required']
    },
    achievementId: {
      type: String,
      required: [true, 'achievementId is required'],
      trim: true
    },
    unlockedEpoch: {
      type: Number,
      required: [true, 'unlockedEpoch is required'],
      min: [0, 'unlockedEpoch cannot be negative']
    },
    status: {
      type: String,
      required: [true, 'status is required'],
      enum: {
        values: ['LOCKED', 'UNLOCKED', 'CLAIMED'],
        message: '{VALUE} is not a valid achievement unlock status'
      }
    },
    rewardApplied: {
      type: Boolean,
      required: [true, 'rewardApplied flag required'],
      default: false
    },
    repeatIndex: {
      type: Number,
      min: [0, 'repeatIndex must be >= 0']
    },
    schemaVersion: {
      type: Number,
      required: true,
      default: 1
    }
  },
  {
    timestamps: true,
    collection: 'achievement_unlocks'
  }
);

// Compound unique index: prevents duplicate unlock records for same repeat occurrence.
AchievementUnlockSchema.index(
  { playerId: 1, achievementId: 1, repeatIndex: 1 },
  { unique: true, name: 'uniq_player_achievement_repeat' }
);

// Secondary index for progress snapshot queries (non-unique to allow repeats differentiation via repeatIndex)
AchievementUnlockSchema.index({ playerId: 1, achievementId: 1 });

const AchievementUnlock: Model<IAchievementUnlock> =
  mongoose.models.AchievementUnlock || mongoose.model<IAchievementUnlock>('AchievementUnlock', AchievementUnlockSchema);

export default AchievementUnlock;

/**
 * IMPLEMENTATION NOTES:
 * 1. repeatIndex omitted for non-repeatable achievements (undefined). For repeatables the
 *    engine assigns 0 for first unlock, 1 for second, etc.
 * 2. rewardApplied ensures reward granting side effects are not duplicated by retries.
 * 3. schemaVersion literal protects forward evolution (adding metadata, new status states, etc.).
 */