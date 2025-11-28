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
const mongoose_1 = __importStar(require("mongoose"));
const AchievementUnlockSchema = new mongoose_1.Schema({
    playerId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
    collection: 'achievement_unlocks'
});
// Compound unique index: prevents duplicate unlock records for same repeat occurrence.
AchievementUnlockSchema.index({ playerId: 1, achievementId: 1, repeatIndex: 1 }, { unique: true, name: 'uniq_player_achievement_repeat' });
// Secondary index for progress snapshot queries (non-unique to allow repeats differentiation via repeatIndex)
AchievementUnlockSchema.index({ playerId: 1, achievementId: 1 });
const AchievementUnlock = mongoose_1.default.models.AchievementUnlock || mongoose_1.default.model('AchievementUnlock', AchievementUnlockSchema);
exports.default = AchievementUnlock;
/**
 * IMPLEMENTATION NOTES:
 * 1. repeatIndex omitted for non-repeatable achievements (undefined). For repeatables the
 *    engine assigns 0 for first unlock, 1 for second, etc.
 * 2. rewardApplied ensures reward granting side effects are not duplicated by retries.
 * 3. schemaVersion literal protects forward evolution (adding metadata, new status states, etc.).
 */ 
//# sourceMappingURL=AchievementUnlock.js.map