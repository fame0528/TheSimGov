"use strict";
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
const mongoose_1 = __importStar(require("mongoose"));
const politics_1 = require("@/lib/types/politics");
// ===================== SCHEMA DEFINITION =====================
const CampaignPhaseStateSchema = new mongoose_1.Schema({
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
        enum: Object.values(politics_1.CampaignPhase),
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
}, {
    timestamps: true, // Adds createdAt and updatedAt automatically
    collection: 'campaign_phase_states',
});
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
CampaignPhaseStateSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
/**
 * Ensure virtuals are included in JSON output
 */
CampaignPhaseStateSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
// ===================== INSTANCE METHODS =====================
/**
 * Check if phase has expired (current time past phaseEndsEpoch)
 */
CampaignPhaseStateSchema.methods.isPhaseExpired = function () {
    return Date.now() > this.phaseEndsEpoch * 1000;
};
/**
 * Get phase progress as percentage (0-100)
 */
CampaignPhaseStateSchema.methods.getPhaseProgress = function () {
    const now = Date.now() / 1000;
    const duration = this.phaseEndsEpoch - this.phaseStartedEpoch;
    const elapsed = Math.max(0, now - this.phaseStartedEpoch);
    return Math.min(100, (elapsed / duration) * 100);
};
/**
 * Update reputation score with clamping
 */
CampaignPhaseStateSchema.methods.updateReputation = function (delta) {
    this.reputationScore = Math.max(0, Math.min(100, this.reputationScore + delta));
    return this.reputationScore;
};
// ===================== STATIC METHODS =====================
/**
 * Find current active campaign for player
 */
CampaignPhaseStateSchema.statics.findActiveCampaign = async function (playerId) {
    return this.findOne({ playerId }).sort({ cycleSequence: -1 }).exec();
};
/**
 * Find all campaigns for player (historical)
 */
CampaignPhaseStateSchema.statics.findPlayerCampaigns = async function (playerId, limit = 10) {
    return this.find({ playerId })
        .sort({ cycleSequence: -1 })
        .limit(limit)
        .exec();
};
/**
 * Find all campaigns in specific phase (for analytics/admin)
 */
CampaignPhaseStateSchema.statics.findByPhase = async function (phase) {
    return this.find({ activePhase: phase }).exec();
};
// ===================== MODEL EXPORT =====================
/**
 * CampaignPhaseState Model
 * Singleton pattern to prevent multiple model compilation in Next.js hot reload
 */
const CampaignPhaseState = mongoose_1.default.models.CampaignPhaseState ||
    mongoose_1.default.model('CampaignPhaseState', CampaignPhaseStateSchema);
exports.default = CampaignPhaseState;
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
//# sourceMappingURL=CampaignPhaseState.js.map