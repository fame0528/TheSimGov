"use strict";
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
// ===================== SCHEMA DEFINITION =====================
const DebatePerformanceSchema = new mongoose_1.Schema({
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
            validator: function (v) {
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
}, {
    timestamps: true,
    collection: 'debate_performances',
});
// ===================== INDEXES =====================
// Compound index for unique debate performance lookup
DebatePerformanceSchema.index({ debateId: 1, playerId: 1 }, { unique: true });
// Index for player performance history
DebatePerformanceSchema.index({ playerId: 1, createdEpoch: -1 });
// ===================== VIRTUALS =====================
DebatePerformanceSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
DebatePerformanceSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
// ===================== INSTANCE METHODS =====================
/**
 * Check if performance had penalties applied
 */
DebatePerformanceSchema.methods.hasPenalties = function () {
    return this.penalties.length > 0;
};
/**
 * Get penalty count
 */
DebatePerformanceSchema.methods.getPenaltyCount = function () {
    return this.penalties.length;
};
/**
 * Calculate performance tier (S/A/B/C/F)
 */
DebatePerformanceSchema.methods.getPerformanceTier = function () {
    const score = this.performanceScore;
    if (score >= 90)
        return 'S';
    if (score >= 80)
        return 'A';
    if (score >= 70)
        return 'B';
    if (score >= 60)
        return 'C';
    return 'F';
};
// ===================== STATIC METHODS =====================
/**
 * Get performance for specific debate
 */
DebatePerformanceSchema.statics.getDebatePerformance = async function (debateId, playerId) {
    return this.findOne({ debateId, playerId }).exec();
};
/**
 * Get player's debate history
 */
DebatePerformanceSchema.statics.getPlayerHistory = async function (playerId, limit = 10) {
    return this.find({ playerId })
        .sort({ createdEpoch: -1 })
        .limit(limit)
        .exec();
};
/**
 * Calculate player's average debate score
 */
DebatePerformanceSchema.statics.getAverageScore = async function (playerId) {
    const performances = await this.find({ playerId }).exec();
    if (performances.length === 0)
        return 0;
    const sum = performances.reduce((acc, perf) => acc + perf.performanceScore, 0);
    return sum / performances.length;
};
// ===================== MODEL EXPORT =====================
const DebatePerformance = mongoose_1.default.models.DebatePerformance ||
    mongoose_1.default.model('DebatePerformance', DebatePerformanceSchema);
exports.default = DebatePerformance;
//# sourceMappingURL=DebatePerformance.js.map