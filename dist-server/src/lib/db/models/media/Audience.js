"use strict";
/**
 * @file src/lib/db/models/media/Audience.ts
 * @description Audience demographics and engagement model for Media companies
 * @created 2025-11-24
 *
 * OVERVIEW:
 * Audience model representing the follower base and viewership demographics for Media
 * industry companies. Tracks audience size, growth rate, demographics breakdown (age,
 * income, location, political alignment), engagement metrics (avg watch time, interaction
 * rate), retention/churn mechanics, and audience health scoring. Critical for monetization
 * as ad CPM rates and sponsorship deals directly correlate with audience quality.
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
// Age groups schema
const AgeGroupsSchema = new mongoose_1.Schema({
    '13-17': { type: Number, min: 0, max: 100, default: 0 },
    '18-24': { type: Number, min: 0, max: 100, default: 0 },
    '25-34': { type: Number, min: 0, max: 100, default: 0 },
    '35-44': { type: Number, min: 0, max: 100, default: 0 },
    '45-54': { type: Number, min: 0, max: 100, default: 0 },
    '55-64': { type: Number, min: 0, max: 100, default: 0 },
    '65+': { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });
// Income groups schema
const IncomeGroupsSchema = new mongoose_1.Schema({
    '<25k': { type: Number, min: 0, max: 100, default: 0 },
    '25-50k': { type: Number, min: 0, max: 100, default: 0 },
    '50-75k': { type: Number, min: 0, max: 100, default: 0 },
    '75-100k': { type: Number, min: 0, max: 100, default: 0 },
    '100-150k': { type: Number, min: 0, max: 100, default: 0 },
    '>150k': { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });
// Geographic breakdown schema
const GeographicBreakdownSchema = new mongoose_1.Schema({
    Local: { type: Number, min: 0, max: 100, default: 0 },
    Regional: { type: Number, min: 0, max: 100, default: 0 },
    National: { type: Number, min: 0, max: 100, default: 0 },
    International: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });
// Political alignment schema
const PoliticalAlignmentSchema = new mongoose_1.Schema({
    Left: { type: Number, min: 0, max: 100, default: 0 },
    Center: { type: Number, min: 0, max: 100, default: 0 },
    Right: { type: Number, min: 0, max: 100, default: 0 },
    Nonpartisan: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });
// Gender breakdown schema
const GenderBreakdownSchema = new mongoose_1.Schema({
    Male: { type: Number, min: 0, max: 100, default: 0 },
    Female: { type: Number, min: 0, max: 100, default: 0 },
    Other: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });
// Engagement metrics schema
const EngagementMetricsSchema = new mongoose_1.Schema({
    avgViewsPerFollower: { type: Number, min: 0, default: 0 },
    avgWatchTime: { type: Number, min: 0, default: 0 }, // seconds
    avgInteractionRate: { type: Number, min: 0, max: 100, default: 0 },
    avgSharesPerFollower: { type: Number, min: 0, default: 0 },
    avgCommentsPerFollower: { type: Number, min: 0, default: 0 },
    repeatVisitorRate: { type: Number, min: 0, max: 100, default: 0 },
    loyalFollowerPercent: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });
// Retention metrics schema
const RetentionMetricsSchema = new mongoose_1.Schema({
    retentionRate: { type: Number, min: 0, max: 100, default: 0 },
    churnReasons: [{ type: String }],
    avgFollowerLifetime: { type: Number, min: 0, default: 0 }, // months
    lifetimeValuePerFollower: { type: Number, min: 0, default: 0 } // dollars
}, { _id: false });
// Audience health schema
const AudienceHealthSchema = new mongoose_1.Schema({
    healthScore: { type: Number, min: 0, max: 100, default: 0 },
    engagementHealth: { type: Number, min: 0, max: 100, default: 0 },
    growthHealth: { type: Number, min: 0, max: 100, default: 0 },
    demographicHealth: { type: Number, min: 0, max: 100, default: 0 },
    brandSafetyScore: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });
// Main Audience schema
const AudienceSchema = new mongoose_1.Schema({
    company: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    ownedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Core metrics
    totalFollowers: { type: Number, min: 0, default: 0 },
    activeFollowers: { type: Number, min: 0, default: 0 },
    monthlyGrowth: { type: Number, min: 0, default: 0 },
    monthlyChurn: { type: Number, min: 0, default: 0 },
    growthRate: { type: Number, min: 0, max: 100, default: 0 },
    churnRate: { type: Number, min: 0, max: 100, default: 0 },
    // Demographics
    ageGroups: { type: AgeGroupsSchema, default: () => ({}) },
    incomeGroups: { type: IncomeGroupsSchema, default: () => ({}) },
    geographicBreakdown: { type: GeographicBreakdownSchema, default: () => ({}) },
    politicalAlignment: { type: PoliticalAlignmentSchema, default: () => ({}) },
    genderBreakdown: { type: GenderBreakdownSchema, default: () => ({}) },
    // Engagement and retention
    engagementMetrics: { type: EngagementMetricsSchema, default: () => ({}) },
    retentionMetrics: { type: RetentionMetricsSchema, default: () => ({}) },
    // Health scoring
    audienceHealth: { type: AudienceHealthSchema, default: () => ({}) },
    // Metadata
    lastUpdated: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
// Indexes for performance
AudienceSchema.index({ company: 1 });
AudienceSchema.index({ ownedBy: 1 });
AudienceSchema.index({ 'audienceHealth.healthScore': -1 });
// Pre-save middleware to update timestamps
AudienceSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    this.lastUpdated = new Date();
    next();
});
// Export the model
const Audience = mongoose_1.default.models.Audience || mongoose_1.default.model('Audience', AudienceSchema);
exports.default = Audience;
//# sourceMappingURL=Audience.js.map