"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
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
const mongoose_1 = __importStar(require("mongoose"));
const TelemetryEventSchema = new mongoose_1.Schema({
    playerId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
    collection: 'telemetry_events'
});
// TTL index (14 days retention). Use createdAt managed by timestamps option.
TelemetryEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 14 * 24 * 60 * 60, name: 'ttl_14d_createdAt' });
// Filtered stream queries (player + type + time window)
TelemetryEventSchema.index({ playerId: 1, type: 1, createdEpoch: -1 }, { name: 'player_type_epoch_desc' });
// Time range queries independent of player
TelemetryEventSchema.index({ type: 1, createdEpoch: -1 }, { name: 'type_epoch_desc' });
const TelemetryEvent = mongoose_1.default.models.TelemetryEvent || mongoose_1.default.model('TelemetryEvent', TelemetryEventSchema);
exports.default = TelemetryEvent;
/**
 * IMPLEMENTATION NOTES:
 * 1. createdEpoch retained alongside timestamps.createdAt (Date) for fast numeric comparisons.
 * 2. TTL index ensures automatic pruning without manual cron cleanup.
 * 3. Sparse optional fields prevent schema bloat; each document only carries relevant attributes.
 * 4. Future evolution could migrate variant-specific subdocuments or discriminators (schemaVersion bump).
 */ 
//# sourceMappingURL=TelemetryEvent.js.map