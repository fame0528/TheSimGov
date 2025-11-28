"use strict";
/**
 * @fileoverview Endorsement Record Mongoose Model
 * @module lib/db/models/politics/EndorsementRecord
 *
 * OVERVIEW:
 * Persistence layer for political endorsement acquisitions. Tracks endorsement
 * sources, tiers, bonuses with diminishing returns curve. Supports expiration
 * and endorsement portfolio management.
 *
 * SCHEMA DESIGN:
 * - Indexed on playerId for fast player-specific queries
 * - Indexed on sourceCategory for category-based filtering
 * - Compound index on playerId + sourceCategory for portfolio queries
 * - Index on expiresEpoch for expiration cleanup
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
const EndorsementRecordSchema = new mongoose_1.Schema({
    playerId: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    sourceCategory: {
        type: String,
        enum: Object.values(politics_1.EndorsementSourceCategory),
        required: true,
        index: true,
    },
    sourceName: {
        type: String,
        required: true,
        trim: true,
    },
    tier: {
        type: String,
        enum: Object.values(politics_1.EndorsementTier),
        required: true,
    },
    acquiredEpoch: {
        type: Number,
        required: true,
        min: 0,
    },
    diminishingReturnFactor: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
    },
    influenceBonusPercent: {
        type: Number,
        required: true,
        min: 0,
    },
    fundraisingBonusPercent: {
        type: Number,
        required: true,
        min: 0,
    },
    expiryEpoch: {
        type: Number,
        required: false,
        min: 0,
        index: true,
    },
    schemaVersion: {
        type: Number,
        required: true,
        default: 1,
        immutable: true,
    },
}, {
    timestamps: true,
    collection: 'endorsement_records',
});
// ===================== INDEXES =====================
// Compound index for category-specific portfolio queries
EndorsementRecordSchema.index({ playerId: 1, sourceCategory: 1 });
// Index for active endorsement filtering
EndorsementRecordSchema.index({ playerId: 1, expiryEpoch: 1 });
// ===================== VIRTUALS =====================
EndorsementRecordSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
EndorsementRecordSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
// ===================== INSTANCE METHODS =====================
/**
 * Check if endorsement is expired
 */
EndorsementRecordSchema.methods.isExpired = function () {
    if (!this.expiryEpoch)
        return false;
    return Date.now() / 1000 >= this.expiryEpoch;
};
/**
 * Check if endorsement is active (not expired)
 */
EndorsementRecordSchema.methods.isActive = function () {
    if (!this.expiryEpoch)
        return true;
    return Date.now() / 1000 < this.expiryEpoch;
};
/**
 * Calculate time remaining until expiration (seconds)
 */
EndorsementRecordSchema.methods.getTimeRemaining = function () {
    if (!this.expiryEpoch)
        return Infinity;
    const remaining = this.expiryEpoch - Date.now() / 1000;
    return Math.max(0, remaining);
};
// ===================== STATIC METHODS =====================
/**
 * Get active endorsements for player
 */
EndorsementRecordSchema.statics.getActiveEndorsements = async function (playerId) {
    const now = Date.now() / 1000;
    return this.find({
        playerId,
        $or: [{ expiryEpoch: { $gt: now } }, { expiryEpoch: { $exists: false } }],
    })
        .sort({ acquiredEpoch: -1 })
        .exec();
};
/**
 * Get endorsements by category
 */
EndorsementRecordSchema.statics.getEndorsementsByCategory = async function (playerId, category) {
    return this.find({ playerId, sourceCategory: category })
        .sort({ acquiredEpoch: -1 })
        .exec();
};
/**
 * Calculate total influence bonus from active endorsements
 */
EndorsementRecordSchema.statics.getTotalInfluenceBonus = async function (playerId) {
    const now = Date.now() / 1000;
    const activeEndorsements = await this.find({
        playerId,
        $or: [{ expiryEpoch: { $gt: now } }, { expiryEpoch: { $exists: false } }],
    }).exec();
    return activeEndorsements.reduce((total, endorsement) => total + endorsement.influenceBonusPercent, 0);
};
/**
 * Calculate total fundraising bonus from active endorsements
 */
EndorsementRecordSchema.statics.getTotalFundraisingBonus = async function (playerId) {
    const now = Date.now() / 1000;
    const activeEndorsements = await this.find({
        playerId,
        $or: [{ expiryEpoch: { $gt: now } }, { expiryEpoch: { $exists: false } }],
    }).exec();
    return activeEndorsements.reduce((total, endorsement) => total + endorsement.fundraisingBonusPercent, 0);
};
/**
 * Count endorsements by category
 */
EndorsementRecordSchema.statics.countByCategory = async function (playerId, category) {
    const now = Date.now() / 1000;
    return this.countDocuments({
        playerId,
        sourceCategory: category,
        $or: [{ expiryEpoch: { $gt: now } }, { expiryEpoch: { $exists: false } }],
    }).exec();
};
/**
 * Expire old endorsements
 */
EndorsementRecordSchema.statics.expireOldEndorsements = async function () {
    const now = Date.now() / 1000;
    const result = await this.deleteMany({
        expiryEpoch: { $lte: now },
    }).exec();
    return result.deletedCount;
};
// ===================== MODEL EXPORT =====================
const EndorsementRecord = mongoose_1.default.models.EndorsementRecord ||
    mongoose_1.default.model('EndorsementRecord', EndorsementRecordSchema);
exports.default = EndorsementRecord;
//# sourceMappingURL=EndorsementRecord.js.map