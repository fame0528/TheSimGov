"use strict";
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
const PollingSnapshotSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
    collection: 'polling_snapshots',
});
// ===================== INDEXES =====================
// Compound index for efficient time-series queries
PollingSnapshotSchema.index({ playerId: 1, timestampEpoch: -1 });
// Index for global polling analysis (admin/analytics)
PollingSnapshotSchema.index({ timestampEpoch: -1 });
// ===================== VIRTUALS =====================
PollingSnapshotSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
PollingSnapshotSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
// ===================== STATIC METHODS =====================
/**
 * Get recent polling snapshots for player
 */
PollingSnapshotSchema.statics.getRecentSnapshots = async function (playerId, limit = 20) {
    return this.find({ playerId })
        .sort({ timestampEpoch: -1 })
        .limit(limit)
        .exec();
};
/**
 * Get snapshots within time window
 */
PollingSnapshotSchema.statics.getSnapshotsInWindow = async function (playerId, startEpoch, endEpoch) {
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
PollingSnapshotSchema.statics.calculateAverageSupport = async function (playerId, windowHours) {
    const windowSeconds = windowHours * 3600;
    const startEpoch = Date.now() / 1000 - windowSeconds;
    const snapshots = await this.find({
        playerId,
        timestampEpoch: { $gte: startEpoch },
    }).exec();
    if (snapshots.length === 0)
        return 0;
    const sum = snapshots.reduce((acc, snap) => acc + snap.finalSupportPercent, 0);
    return sum / snapshots.length;
};
// ===================== MODEL EXPORT =====================
const PollingSnapshot = mongoose_1.default.models.PollingSnapshot ||
    mongoose_1.default.model('PollingSnapshot', PollingSnapshotSchema);
exports.default = PollingSnapshot;
//# sourceMappingURL=PollingSnapshot.js.map