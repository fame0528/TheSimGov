"use strict";
/**
 * @file src/lib/db/models/media/MonetizationSettings.ts
 * @description Monetization configuration model for Media companies
 * @created 2025-11-24
 *
 * OVERVIEW:
 * MonetizationSettings model representing revenue optimization configuration for Media companies.
 * Defines CPM (Cost Per Mille) rate multipliers by demographic segments, subscription tier structures,
 * affiliate commission percentages, platform revenue sharing terms, and monetization strategy preferences.
 * Enables Media companies to maximize revenue by targeting high-value demographics, offering premium
 * subscription tiers, earning affiliate commissions, and negotiating platform partnerships.
 *
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company (Media company)
 * - isActive: Whether monetization settings are active
 * - defaultCPM: Base CPM rate for ads ($)
 * - strategy: Monetization focus (AdRevenue, Subscriptions, Affiliates, Hybrid)
 *
 * CPM Rate Multipliers (by demographic):
 * - cpmByAge: Object with age group keys and CPM multipliers
 *   - "18-24": number (e.g., 1.2 = 20% higher CPM)
 *   - "25-34": number (e.g., 1.5 = 50% higher CPM for prime demographic)
 *   - "35-44": number
 *   - "45-54": number
 *   - "55-64": number
 *   - "65+": number
 * - cpmByIncome: Object with income bracket keys and CPM multipliers
 *   - "<$25K": number
 *   - "$25K-$50K": number
 *   - "$50K-$100K": number
 *   - "$100K-$200K": number
 *   - "$200K+": number (e.g., 2.0 = double CPM for high-income viewers)
 * - cpmByLocation: Object with location keys and CPM multipliers
 *   - "North America": number
 *   - "Europe": number
 *   - "Asia": number
 *   - "Other": number
 * - cpmByDevice: Object with device type keys and multipliers
 *   - "Desktop": number
 *   - "Mobile": number
 *   - "Tablet": number
 *
 * Subscription Tiers:
 * - subscriptionTiers: Array of subscription tier definitions
 *   - name: string (e.g., "Basic", "Premium", "VIP")
 *   - monthlyPrice: number ($)
 *   - annualPrice: number ($)
 *   - features: string[] (feature list)
 *   - limits: object (content access limits)
 *   - adFree: boolean (no ads for this tier)
 *
 * Affiliate Settings:
 * - affiliateEnabled: Whether affiliate revenue is enabled
 * - affiliateCommissionRate: Default commission percentage (%)
 * - affiliateCategories: Object with category keys and commission rates
 *   - "Tech": number (%)
 *   - "Fashion": number (%)
 *   - "Home": number (%)
 *   - etc.
 *
 * Platform Revenue Sharing:
 * - platformRevShares: Object with platform name keys and revenue share %
 *   - "YouTube": number (e.g., 45 = YouTube keeps 45%, creator gets 55%)
 *   - "TikTok": number
 *   - "Twitch": number
 *   - "Substack": number
 *
 * Revenue Optimization:
 * - minCPM: Minimum CPM floor ($)
 * - maxCPM: Maximum CPM ceiling ($)
 * - targetDemographics: Array of high-value demographic segments to prioritize
 * - excludedAdvertisers: Array of blocked advertiser categories
 * - preferredAdvertisers: Array of preferred advertiser categories (higher CPM)
 *
 * Analytics & Performance:
 * - totalSubscribers: Current subscriber count
 * - totalMRR: Total Monthly Recurring Revenue ($)
 * - totalARR: Total Annual Recurring Revenue ($)
 * - avgRevenuePerUser: ARPU ($)
 * - churnRate: Monthly subscriber churn (%)
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
 * MonetizationSettings schema definition
 */
const MonetizationSettingsSchema = new mongoose_1.Schema({
    // Core
    company: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company reference is required'],
        unique: true, // unique constraint automatically creates index - no need for index: true or schema-level index
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true,
    },
    defaultCPM: {
        type: Number,
        required: [true, 'Default CPM is required'],
        min: [0.10, 'Default CPM must be at least $0.10'],
        max: [100, 'Default CPM cannot exceed $100'],
        default: 5.0,
    },
    strategy: {
        type: String,
        required: true,
        enum: {
            values: ['AdRevenue', 'Subscriptions', 'Affiliates', 'Hybrid'],
            message: '{VALUE} is not a valid monetization strategy',
        },
        default: 'Hybrid',
    },
    // CPM Rate Multipliers
    cpmByAge: {
        type: Map,
        of: Number,
        default: () => ({
            '18-24': 1.0,
            '25-34': 1.5,
            '35-44': 1.3,
            '45-54': 1.1,
            '55-64': 0.9,
            '65+': 0.8,
        }),
    },
    cpmByIncome: {
        type: Map,
        of: Number,
        default: () => ({
            '<$25K': 0.6,
            '$25K-$50K': 0.8,
            '$50K-$100K': 1.2,
            '$100K-$200K': 1.8,
            '$200K+': 2.5,
        }),
    },
    cpmByLocation: {
        type: Map,
        of: Number,
        default: () => ({
            'North America': 1.5,
            Europe: 1.3,
            Asia: 1.0,
            Other: 0.7,
        }),
    },
    cpmByDevice: {
        type: Map,
        of: Number,
        default: () => ({
            Desktop: 1.2,
            Mobile: 1.0,
            Tablet: 1.1,
        }),
    },
    // Subscription Tiers
    subscriptionTiers: {
        type: [
            {
                name: {
                    type: String,
                    required: true,
                    trim: true,
                },
                monthlyPrice: {
                    type: Number,
                    required: true,
                    min: [0, 'Monthly price cannot be negative'],
                },
                annualPrice: {
                    type: Number,
                    required: true,
                    min: [0, 'Annual price cannot be negative'],
                },
                features: {
                    type: [String],
                    default: [],
                },
                limits: {
                    maxContentAccess: Number,
                    maxDownloads: Number,
                    maxConcurrentStreams: Number,
                },
                adFree: {
                    type: Boolean,
                    required: true,
                    default: false,
                },
            },
        ],
        default: [],
    },
    // Affiliate Settings
    affiliateEnabled: {
        type: Boolean,
        required: true,
        default: false,
    },
    affiliateCommissionRate: {
        type: Number,
        required: true,
        default: 5.0,
        min: [0, 'Commission rate cannot be negative'],
        max: [50, 'Commission rate cannot exceed 50%'],
    },
    affiliateCategories: {
        type: Map,
        of: Number,
        default: () => ({
            Tech: 8.0,
            Fashion: 10.0,
            Home: 6.0,
            Beauty: 12.0,
            Fitness: 7.0,
        }),
    },
    // Platform Revenue Sharing
    platformRevShares: {
        type: Map,
        of: Number,
        default: () => ({
            YouTube: 45.0,
            TikTok: 50.0,
            Twitch: 50.0,
            Substack: 10.0,
            Patreon: 12.0,
        }),
    },
    // Revenue Optimization
    minCPM: {
        type: Number,
        required: true,
        default: 1.0,
        min: [0, 'Min CPM cannot be negative'],
    },
    maxCPM: {
        type: Number,
        required: true,
        default: 50.0,
        min: [0, 'Max CPM cannot be negative'],
    },
    targetDemographics: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'Audience',
        default: [],
    },
    excludedAdvertisers: {
        type: [String],
        default: [],
    },
    preferredAdvertisers: {
        type: [String],
        default: [],
    },
    // Analytics & Performance
    totalSubscribers: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Subscribers cannot be negative'],
    },
    totalMRR: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'MRR cannot be negative'],
    },
    totalARR: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'ARR cannot be negative'],
    },
    avgRevenuePerUser: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'ARPU cannot be negative'],
    },
    churnRate: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Churn rate cannot be negative'],
        max: [100, 'Churn rate cannot exceed 100%'],
    },
}, {
    timestamps: true,
    collection: 'media_monetizationsettings',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
/**
 * Indexes for query optimization
 */
// MonetizationSettingsSchema.index({ company: 1 }); // REMOVED - unique: true on company field already creates index
MonetizationSettingsSchema.index({ isActive: 1 }); // Active monetization configs
/**
 * Virtual field: subscriptionRevenue
 */
MonetizationSettingsSchema.virtual('subscriptionRevenue').get(function () {
    return this.totalMRR + this.totalARR / 12;
});
/**
 * Virtual field: isProfitable
 */
MonetizationSettingsSchema.virtual('isProfitable').get(function () {
    // Consider profitable if churn < 5% and ARPU > $5
    return this.churnRate < 5 && this.avgRevenuePerUser > 5;
});
/**
 * Pre-save hook: Calculate ARR from MRR
 */
MonetizationSettingsSchema.pre('save', function (next) {
    // Calculate ARR from MRR if not explicitly set
    if (this.totalMRR > 0 && this.totalARR === 0) {
        this.totalARR = this.totalMRR * 12;
    }
    // Ensure min/max CPM boundaries are logical
    if (this.minCPM > this.maxCPM) {
        const temp = this.minCPM;
        this.minCPM = this.maxCPM;
        this.maxCPM = temp;
    }
    next();
});
/**
 * MonetizationSettings model
 *
 * @example
 * ```typescript
 * import MonetizationSettings from '@/lib/db/models/media/MonetizationSettings';
 *
 * // Create monetization config for media company
 * const settings = await MonetizationSettings.create({
 *   company: mediaCompanyId,
 *   defaultCPM: 5.00,
 *   strategy: 'Hybrid',
 *   cpmByAge: {
 *     "25-34": 1.5, // 50% higher CPM for 25-34 demographic
 *     "35-44": 1.3
 *   },
 *   subscriptionTiers: [
 *     {
 *       name: "Premium",
 *       monthlyPrice: 9.99,
 *       annualPrice: 99.99,
 *       features: ["Ad-free", "Exclusive content"],
 *       adFree: true
 *     }
 *   ]
 * });
 * ```
 */
const MonetizationSettings = mongoose_1.default.models.MonetizationSettings ||
    mongoose_1.default.model('MonetizationSettings', MonetizationSettingsSchema);
exports.default = MonetizationSettings;
//# sourceMappingURL=MonetizationSettings.js.map