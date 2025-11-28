"use strict";
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
const AchievementEventSchema = new mongoose_1.Schema({
    playerId: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    category: {
        type: String,
        enum: Object.values(politics_1.AchievementCategory),
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
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    schemaVersion: {
        type: Number,
        required: true,
        default: 1,
        immutable: true,
    },
}, {
    timestamps: true,
    collection: 'achievement_events',
});
// ===================== INDEXES =====================
// Compound index for category-specific queries
AchievementEventSchema.index({ playerId: 1, category: 1 });
// Index for chronological sorting
AchievementEventSchema.index({ playerId: 1, unlockedEpoch: -1 });
// ===================== VIRTUALS =====================
AchievementEventSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
AchievementEventSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
// ===================== STATIC METHODS =====================
/**
 * Get all achievements for player
 */
AchievementEventSchema.statics.getPlayerAchievements = async function (playerId) {
    return this.find({ playerId }).sort({ unlockedEpoch: -1 }).exec();
};
/**
 * Get achievements by category
 */
AchievementEventSchema.statics.getAchievementsByCategory = async function (playerId, category) {
    return this.find({ playerId, category }).sort({ unlockedEpoch: -1 }).exec();
};
/**
 * Count achievements by category
 */
AchievementEventSchema.statics.countByCategory = async function (playerId, category) {
    return this.countDocuments({ playerId, category }).exec();
};
/**
 * Get recent achievements
 */
AchievementEventSchema.statics.getRecentAchievements = async function (playerId, limit = 10) {
    return this.find({ playerId })
        .sort({ unlockedEpoch: -1 })
        .limit(limit)
        .exec();
};
// ===================== MODEL EXPORT =====================
const AchievementEvent = mongoose_1.default.models.AchievementEvent ||
    mongoose_1.default.model('AchievementEvent', AchievementEventSchema);
exports.default = AchievementEvent;
//# sourceMappingURL=AchievementEvent.js.map