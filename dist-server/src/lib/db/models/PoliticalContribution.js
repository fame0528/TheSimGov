"use strict";
/**
 * @file lib/db/models/PoliticalContribution.ts
 * @description Political campaign contribution tracking schema
 * @created 2025-11-24
 *
 * OVERVIEW:
 * Tracks campaign donations from companies to political candidates.
 * Level 3+ companies can donate to campaigns to gain political influence.
 * Donations affect government contract access and lobbying power.
 *
 * USAGE:
 * ```typescript
 * import PoliticalContribution from '@/lib/db/models/PoliticalContribution';
 *
 * // Record donation
 * const donation = await PoliticalContribution.create({
 *   company: companyId,
 *   candidateName: 'Senator Jane Smith',
 *   officeType: 'Senate',
 *   amount: 25000,
 *   influencePoints: 50
 * });
 *
 * // Get company donations
 * const donations = await PoliticalContribution.find({ company: companyId })
 *   .sort({ donatedAt: -1 });
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
 * Political contribution schema
 */
const PoliticalContributionSchema = new mongoose_1.Schema({
    company: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company is required'],
        // index: true removed - already indexed via compound index { company: 1, donatedAt: -1 }
    },
    candidateName: {
        type: String,
        required: [true, 'Candidate name is required'],
        trim: true,
        minlength: [3, 'Candidate name must be at least 3 characters'],
        maxlength: [100, 'Candidate name cannot exceed 100 characters'],
    },
    officeType: {
        type: String,
        required: [true, 'Office type is required'],
        enum: {
            values: ['President', 'Senate', 'House', 'Governor', 'Mayor'],
            message: '{VALUE} is not a valid office type',
        },
    },
    amount: {
        type: Number,
        required: [true, 'Donation amount is required'],
        min: [100, 'Minimum donation is $100'],
    },
    influencePoints: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Influence points cannot be negative'],
    },
    donatedAt: {
        type: Date,
        required: true,
        default: Date.now,
        index: true,
    },
    electionYear: {
        type: Number,
        required: [true, 'Election year is required'],
        min: [2025, 'Election year must be 2025 or later'],
    },
}, {
    timestamps: true,
    collection: 'political_contributions',
});
// Compound indexes for efficient queries
PoliticalContributionSchema.index({ company: 1, donatedAt: -1 });
PoliticalContributionSchema.index({ candidateName: 1, electionYear: 1 });
const PoliticalContribution = mongoose_1.default.models.PoliticalContribution ||
    mongoose_1.default.model('PoliticalContribution', PoliticalContributionSchema);
exports.default = PoliticalContribution;
//# sourceMappingURL=PoliticalContribution.js.map