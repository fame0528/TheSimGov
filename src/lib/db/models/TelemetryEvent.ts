/**
 * @file src/lib/db/models/TelemetryEvent.ts
 * @description Raw telemetry event storage (Phase 7) with TTL expiry
 * @created 2025-11-27
 *
 * OVERVIEW:
 * Minimal raw event documents capturing discrete player-related political actions.
 * Lean shape to reduce write amplification; heavy analytics derived in aggregates.
 * TTL expiry automatically prunes events after retention window (default 14 days).
 *
 * INDEX STRATEGY:
 * - TTL index on createdAt (14d) → automatic pruning
 * - Compound index (playerId, type, createdEpoch) for filtered streams
 * - No field-level index duplication; single definition points only.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type TelemetryEventTypeDB =
  | 'CAMPAIGN_PHASE_CHANGE'
  | 'DEBATE_RESULT'
  | 'ENDORSEMENT'
  | 'BILL_VOTE'
  | 'POLICY_ENACTED'
  | 'LOBBY_ATTEMPT'
  | 'MOMENTUM_SHIFT'
  | 'POLL_INTERVAL'
  | 'SYSTEM_BALANCE_APPLIED';

// Variant payload union kept flexible; each event stores only relevant fields.
export interface ITelemetryEvent extends Document {
  playerId: Types.ObjectId;           // Subject player
  type: TelemetryEventTypeDB;         // Discriminator
  createdEpoch: number;               // Unix seconds (duplicate of createdAt for fast numeric range queries)
  schemaVersion: 1;                   // Literal version
  // Variant-specific optional fields (sparse storage)
  fromPhase?: string;
  toPhase?: string;
  cycleSequence?: number;
  debateId?: string;
  performanceScore?: number;
  pollShiftImmediatePercent?: number;
  endorsementId?: string;
  tier?: string;
  influenceBonusPercent?: number;
  legislationId?: string;
  vote?: 'FOR' | 'AGAINST' | 'ABSTAIN';
  outcome?: 'PASSED' | 'FAILED';
  policyCode?: string;
  impactPercent?: number;
  success?: boolean;
  influenceAppliedPercent?: number;
  previousMomentumIndex?: number;
  newMomentumIndex?: number;
  delta?: number;
  finalSupportPercent?: number;
  volatilityAppliedPercent?: number;
  reputationScore?: number;
  underdogBuffAppliedPercent?: number;
  frontrunnerPenaltyAppliedPercent?: number;
  fairnessFloorPercent?: number;
  createdAt: Date;                    // For TTL expiry
  updatedAt: Date;
}

const TelemetryEventSchema = new Schema<ITelemetryEvent>(
  {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'playerId is required']
    },
    type: {
      type: String,
      required: [true, 'type is required'],
      enum: {
        values: [
          'CAMPAIGN_PHASE_CHANGE',
          'DEBATE_RESULT',
          'ENDORSEMENT',
          'BILL_VOTE',
          'POLICY_ENACTED',
          'LOBBY_ATTEMPT',
          'MOMENTUM_SHIFT',
          'POLL_INTERVAL',
          'SYSTEM_BALANCE_APPLIED'
        ],
        message: '{VALUE} is not a valid telemetry event type'
      }
    },
    createdEpoch: {
      type: Number,
      required: [true, 'createdEpoch is required'],
      min: [0, 'createdEpoch cannot be negative']
    },
    schemaVersion: {
      type: Number,
      required: true,
      default: 1
    },
    // Variant optional fields (sparse)
    fromPhase: String,
    toPhase: String,
    cycleSequence: Number,
    debateId: String,
    performanceScore: Number,
    pollShiftImmediatePercent: Number,
    endorsementId: String,
    tier: String,
    influenceBonusPercent: Number,
    legislationId: String,
    vote: { type: String, enum: ['FOR', 'AGAINST', 'ABSTAIN'] },
    outcome: { type: String, enum: ['PASSED', 'FAILED'] },
    policyCode: String,
    impactPercent: Number,
    success: Boolean,
    influenceAppliedPercent: Number,
    previousMomentumIndex: Number,
    newMomentumIndex: Number,
    delta: Number,
    finalSupportPercent: Number,
    volatilityAppliedPercent: Number,
    reputationScore: Number,
    underdogBuffAppliedPercent: Number,
    frontrunnerPenaltyAppliedPercent: Number,
    fairnessFloorPercent: Number
  },
  {
    timestamps: true,
    collection: 'telemetry_events'
  }
);

// TTL index (14 days retention). Use createdAt managed by timestamps option.
TelemetryEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 14 * 24 * 60 * 60, name: 'ttl_14d_createdAt' });

// Filtered stream queries (player + type + time window)
TelemetryEventSchema.index({ playerId: 1, type: 1, createdEpoch: -1 }, { name: 'player_type_epoch_desc' });

// Time range queries independent of player
TelemetryEventSchema.index({ type: 1, createdEpoch: -1 }, { name: 'type_epoch_desc' });

const TelemetryEvent: Model<ITelemetryEvent> =
  mongoose.models.TelemetryEvent || mongoose.model<ITelemetryEvent>('TelemetryEvent', TelemetryEventSchema);

export default TelemetryEvent;

/**
 * IMPLEMENTATION NOTES:
 * 1. createdEpoch retained alongside timestamps.createdAt (Date) for fast numeric comparisons.
 * 2. TTL index ensures automatic pruning without manual cron cleanup.
 * 3. Sparse optional fields prevent schema bloat; each document only carries relevant attributes.
 * 4. Future evolution could migrate variant-specific subdocuments or discriminators (schemaVersion bump).
 */