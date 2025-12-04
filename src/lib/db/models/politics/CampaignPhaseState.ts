/**
 * @fileoverview Campaign Phase State Mongoose Model
 * @module lib/db/models/politics/CampaignPhaseState
 * 
 * OVERVIEW:
 * Persistence layer for player campaign phase machine state. Tracks discrete phase progression
 * through fundraising, lobbying, PR, debate prep, debate, post-debate, and election phases.
 * Uses environmental difficulty indices (SPI, VM, ES) instead of AI opponents for dynamic scaling.
 * 
 * SCHEMA DESIGN:
 * - Indexed on playerId for fast player-specific queries
 * - Indexed on cycleSequence for historical analysis
 * - Compound index on playerId + cycleSequence for efficient lookups
 * - Timestamps for audit trails (createdAt, updatedAt)
 * - Deterministic seed logging for reproducibility
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { CampaignPhase, CampaignPhaseState as ICampaignPhaseState } from '@/lib/types/politics';

// ===================== INTERFACE EXTENSION =====================

/**
 * Mongoose document interface extending CampaignPhaseState
 * Adds Mongoose-specific fields (timestamps, virtual IDs)
 */
export interface ICampaignPhaseStateDocument extends Omit<ICampaignPhaseState, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ===================== SCHEMA DEFINITION =====================

const CampaignPhaseStateSchema = new Schema<ICampaignPhaseStateDocument>(
  {
    playerId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    cycleSequence: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    activePhase: {
      type: String,
      required: true,
      enum: Object.values(CampaignPhase),
    },
    phaseStartedEpoch: {
      type: Number,
      required: true,
      min: 0,
    },
    phaseEndsEpoch: {
      type: Number,
      required: true,
      min: 0,
    },
    // Dynamic difficulty indices (environment-driven)
    spendPressureIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    volatilityModifier: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    engagementSaturation: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    // Aggregated cycle metrics
    fundsRaisedThisCycle: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    endorsementsAcquired: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    scandalsActive: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    pollingShiftProjectedPercent: {
      type: Number,
      required: true,
      default: 0,
    },
    reputationScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50,
    },
    // Deterministic fairness
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
    updatedEpoch: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    collection: 'campaign_phase_states',
  }
);

// ===================== INDEXES =====================

// Compound index for efficient player + cycle queries
CampaignPhaseStateSchema.index({ playerId: 1, cycleSequence: -1 });

// Index for active phase queries (analytics)
CampaignPhaseStateSchema.index({ activePhase: 1 });

// Index for time-based queries (phase expiry checks)
CampaignPhaseStateSchema.index({ phaseEndsEpoch: 1 });

// ===================== VIRTUALS =====================

/**
 * Virtual 'id' getter for API consistency
 * Maps MongoDB _id to id field expected by frontend
 */
CampaignPhaseStateSchema.virtual('id').get(function (this: ICampaignPhaseStateDocument) {
  return this._id.toHexString();
});

/**
 * Ensure virtuals are included in JSON output
 */
CampaignPhaseStateSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj._id;
    delete obj.__v;
    return ret;
  },
});

// ===================== INSTANCE METHODS =====================

/**
 * Check if phase has expired (current time past phaseEndsEpoch)
 */
CampaignPhaseStateSchema.methods.isPhaseExpired = function (this: ICampaignPhaseStateDocument): boolean {
  return Date.now() > this.phaseEndsEpoch * 1000;
};

/**
 * Get phase progress as percentage (0-100)
 */
CampaignPhaseStateSchema.methods.getPhaseProgress = function (this: ICampaignPhaseStateDocument): number {
  const now = Date.now() / 1000;
  const duration = this.phaseEndsEpoch - this.phaseStartedEpoch;
  const elapsed = Math.max(0, now - this.phaseStartedEpoch);
  return Math.min(100, (elapsed / duration) * 100);
};

/**
 * Update reputation score with clamping
 */
CampaignPhaseStateSchema.methods.updateReputation = function (
  this: ICampaignPhaseStateDocument,
  delta: number
): number {
  this.reputationScore = Math.max(0, Math.min(100, this.reputationScore + delta));
  return this.reputationScore;
};

// ===================== STATIC METHODS =====================

/**
 * Find current active campaign for player
 */
CampaignPhaseStateSchema.statics.findActiveCampaign = async function (
  this: Model<ICampaignPhaseStateDocument>,
  playerId: string
): Promise<ICampaignPhaseStateDocument | null> {
  return this.findOne({ playerId }).sort({ cycleSequence: -1 }).exec();
};

/**
 * Find all campaigns for player (historical)
 */
CampaignPhaseStateSchema.statics.findPlayerCampaigns = async function (
  this: Model<ICampaignPhaseStateDocument>,
  playerId: string,
  limit: number = 10
): Promise<ICampaignPhaseStateDocument[]> {
  return this.find({ playerId })
    .sort({ cycleSequence: -1 })
    .limit(limit)
    .exec();
};

/**
 * Find all campaigns in specific phase (for analytics/admin)
 */
CampaignPhaseStateSchema.statics.findByPhase = async function (
  this: Model<ICampaignPhaseStateDocument>,
  phase: CampaignPhase
): Promise<ICampaignPhaseStateDocument[]> {
  return this.find({ activePhase: phase }).exec();
};

// ===================== MODEL EXPORT =====================

/**
 * CampaignPhaseState Model
 * Singleton pattern to prevent multiple model compilation in Next.js hot reload
 */
const CampaignPhaseState =
  (mongoose.models.CampaignPhaseState as Model<ICampaignPhaseStateDocument>) ||
  mongoose.model<ICampaignPhaseStateDocument>('CampaignPhaseState', CampaignPhaseStateSchema);

export default CampaignPhaseState;

// ===================== IMPLEMENTATION NOTES =====================
/**
 * IMPLEMENTATION NOTES:
 * 1. Uses singleton pattern to avoid Mongoose model recompilation errors in Next.js dev mode
 * 2. Compound index on playerId + cycleSequence optimizes player campaign history queries
 * 3. Virtual 'id' getter ensures API contract consistency (MongoDB _id → id)
 * 4. Instance methods provide common operations (isPhaseExpired, getPhaseProgress)
 * 5. Static methods enable efficient queries (findActiveCampaign, findPlayerCampaigns)
 * 6. Schema version immutable to support future migrations
 * 7. Timestamps automatically track creation and update times
 * 8. Reputation score clamped to 0-100 range via updateReputation method
 * 9. Deterministic seed persisted for audit/replay scenarios
 * 10. All numeric fields have min/max constraints for data integrity
 */

/**
 * USAGE EXAMPLE:
 * ```typescript
 * import CampaignPhaseState from '@/lib/db/models/politics/CampaignPhaseState';
 * 
 * // Create new campaign
 * const campaign = await CampaignPhaseState.create({
 *   playerId: 'player-123',
 *   cycleSequence: 1,
 *   activePhase: CampaignPhase.FUNDRAISING,
 *   phaseStartedEpoch: Date.now() / 1000,
 *   phaseEndsEpoch: Date.now() / 1000 + 3600,
 *   spendPressureIndex: 0.5,
 *   volatilityModifier: 0.3,
 *   engagementSaturation: 0.4,
 *   fundsRaisedThisCycle: 0,
 *   endorsementsAcquired: 0,
 *   scandalsActive: 0,
 *   pollingShiftProjectedPercent: 0,
 *   reputationScore: 50,
 *   seed: 'campaign-cycle-1-player-123',
 *   updatedEpoch: Date.now() / 1000,
 * });
 * 
 * // Find active campaign
 * const active = await CampaignPhaseState.findActiveCampaign('player-123');
 * 
 * // Check if phase expired
 * if (active && active.isPhaseExpired()) {
 *   // Advance to next phase
 * }
 * ```
 */
