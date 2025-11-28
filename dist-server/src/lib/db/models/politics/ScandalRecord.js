"use strict";
/**
 * @fileoverview Scandal Record Mongoose Model
 * @module lib/db/models/politics/ScandalRecord
 *
 * OVERVIEW:
 * Persistence layer for political scandal crisis events. Tracks scandal lifecycle
 * from generation through mitigation/expiration. Supports reputation impact
 * calculations and crisis management workflows.
 *
 * SCHEMA DESIGN:
 * - Indexed on playerId for fast player-specific queries
 * - Indexed on status for active scandal filtering
 * - Compound index on playerId + status for active scandal lookups
 * - TTL index on expiresEpoch for automatic document expiration (optional)
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
const ScandalRecordSchema = new mongoose_1.Schema({
    playerId: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    category: {
        type: String,
        enum: Object.values(politics_1.ScandalCategory),
        required: true,
    },
    severity: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
    },
    status: {
        type: String,
        enum: Object.values(politics_1.ScandalStatus),
        required: true,
        default: politics_1.ScandalStatus.DISCOVERED,
        index: true,
    },
    discoveredEpoch: {
        type: Number,
        required: true,
        min: 0,
    },
    containedEpoch: {
        type: Number,
        required: false,
        min: 0,
    },
    resolvedEpoch: {
        type: Number,
        required: false,
        min: 0,
    },
    reputationHitPercent: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    recoveryRatePerHourPercent: {
        type: Number,
        required: true,
        min: 0,
    },
    mitigationActions: {
        type: [String],
        default: [],
    },
    seed: {
        type: String,
        required: true,
        trim: true,
    },
    updatedEpoch: {
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
    collection: 'scandal_records',
});
// ===================== INDEXES =====================
// Compound index for active scandal queries
ScandalRecordSchema.index({ playerId: 1, status: 1 });
// Index for chronological queries
ScandalRecordSchema.index({ playerId: 1, discoveredEpoch: -1 });
// ===================== VIRTUALS =====================
ScandalRecordSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
ScandalRecordSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
// ===================== INSTANCE METHODS =====================
/**
 * Check if scandal is resolved
 */
ScandalRecordSchema.methods.isResolved = function () {
    return this.status === politics_1.ScandalStatus.RESOLVED;
};
/**
 * Check if scandal is contained
 */
ScandalRecordSchema.methods.isContained = function () {
    return this.status === politics_1.ScandalStatus.CONTAINED || this.status === politics_1.ScandalStatus.RESOLVED;
};
/**
 * Get current reputation penalty
 */
ScandalRecordSchema.methods.getCurrentPenalty = function () {
    return this.reputationHitPercent;
};
/**
 * Add mitigation action
 */
ScandalRecordSchema.methods.addMitigationAction = async function (actionId) {
    if (!this.mitigationActions.includes(actionId)) {
        this.mitigationActions.push(actionId);
    }
    this.updatedEpoch = Date.now() / 1000;
    return this.save();
};
// ===================== STATIC METHODS =====================
/**
 * Get unresolved scandals for player
 */
ScandalRecordSchema.statics.getActiveScandals = async function (playerId) {
    return this.find({
        playerId,
        status: { $ne: politics_1.ScandalStatus.RESOLVED }
    })
        .sort({ discoveredEpoch: -1 })
        .exec();
};
/**
 * Get scandals by category
 */
ScandalRecordSchema.statics.getScandalsByCategory = async function (playerId, category) {
    return this.find({ playerId, category }).sort({ discoveredEpoch: -1 }).exec();
};
/**
 * Calculate total active reputation penalty
 */
ScandalRecordSchema.statics.getTotalPenalty = async function (playerId) {
    const activeScandals = await this.find({
        playerId,
        status: { $ne: politics_1.ScandalStatus.RESOLVED }
    }).exec();
    return activeScandals.reduce((total, scandal) => {
        return total + scandal.reputationHitPercent;
    }, 0);
};
/**
 * Get scandals by status
 */
ScandalRecordSchema.statics.getScandalsByStatus = async function (playerId, status) {
    return this.find({ playerId, status })
        .sort({ discoveredEpoch: -1 })
        .exec();
};
// ===================== MODEL EXPORT =====================
const ScandalRecord = mongoose_1.default.models.ScandalRecord ||
    mongoose_1.default.model('ScandalRecord', ScandalRecordSchema);
exports.default = ScandalRecord;
//# sourceMappingURL=ScandalRecord.js.map