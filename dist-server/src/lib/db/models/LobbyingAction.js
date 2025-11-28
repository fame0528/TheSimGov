"use strict";
/**
 * @file lib/db/models/LobbyingAction.ts
 * @description Legislative lobbying action tracking schema
 * @created 2025-11-24
 *
 * OVERVIEW:
 * Tracks lobbying efforts by companies to influence legislation.
 * Level 4+ companies can lobby for favorable laws and regulations.
 * Success depends on company level, influence points, and lobbying power.
 *
 * USAGE:
 * ```typescript
 * import LobbyingAction from '@/lib/db/models/LobbyingAction';
 *
 * // Record lobbying action
 * const lobby = await LobbyingAction.create({
 *   company: companyId,
 *   targetLegislation: 'Clean Energy Tax Credits',
 *   legislationType: 'Tax',
 *   influencePointsCost: 25,
 *   successProbability: 65,
 *   status: 'Pending'
 * });
 *
 * // Get company lobbying history
 * const actions = await LobbyingAction.find({ company: companyId })
 *   .sort({ initiatedAt: -1 });
 * ```
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
/**
 * Lobbying action schema
 */
const LobbyingActionSchema = new mongoose_1.Schema({
    company: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company is required'],
        // index: true removed - already indexed via compound index { company: 1, initiatedAt: -1 }
    },
    targetLegislation: {
        type: String,
        required: [true, 'Target legislation is required'],
        trim: true,
        minlength: [5, 'Legislation name must be at least 5 characters'],
        maxlength: [200, 'Legislation name cannot exceed 200 characters'],
    },
    legislationType: {
        type: String,
        required: [true, 'Legislation type is required'],
        enum: {
            values: ['Tax', 'Regulation', 'Subsidy', 'Trade', 'Labor', 'Environment'],
            message: '{VALUE} is not a valid legislation type',
        },
    },
    influencePointsCost: {
        type: Number,
        required: [true, 'Influence points cost is required'],
        min: [1, 'Minimum influence points cost is 1'],
    },
    successProbability: {
        type: Number,
        required: [true, 'Success probability is required'],
        min: [0, 'Success probability cannot be below 0'],
        max: [100, 'Success probability cannot exceed 100'],
    },
    status: {
        type: String,
        required: true,
        default: 'Pending',
        enum: {
            values: ['Pending', 'Successful', 'Failed'],
            message: '{VALUE} is not a valid status',
        },
        index: true,
    },
    outcome: {
        effectType: {
            type: String,
            // e.g., 'taxReduction', 'subsidyGrant', 'regulationRemoval'
        },
        effectValue: {
            type: Number,
            // e.g., -5 (tax reduction), +100000 (subsidy amount)
        },
        duration: {
            type: Number,
            // Duration in months
            min: [1, 'Minimum duration is 1 month'],
        },
    },
    initiatedAt: {
        type: Date,
        required: true,
        default: Date.now,
        index: true,
    },
    resolvedAt: {
        type: Date,
        // Set when status changes to Successful/Failed
    },
}, {
    timestamps: true,
    collection: 'lobbying_actions',
});
// Compound indexes for efficient queries
LobbyingActionSchema.index({ company: 1, initiatedAt: -1 });
LobbyingActionSchema.index({ status: 1, resolvedAt: -1 });
const LobbyingAction = mongoose_1.default.models.LobbyingAction ||
    mongoose_1.default.model('LobbyingAction', LobbyingActionSchema);
exports.default = LobbyingAction;
//# sourceMappingURL=LobbyingAction.js.map