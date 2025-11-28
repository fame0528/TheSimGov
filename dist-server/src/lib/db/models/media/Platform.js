"use strict";
/**
 * @file src/lib/db/models/media/Platform.ts
 * @description Distribution platform model for Media companies
 * @created 2025-11-24
 *
 * OVERVIEW:
 * Platform model representing distribution channels for Media companies (YouTube,
 * TikTok, Blog, Podcast platforms, etc.). Tracks platform-specific performance,
 * algorithm preferences, monetization settings, and cross-platform strategy. Enables
 * multi-channel distribution with optimized content formatting per platform.
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
// Platform config schema
const PlatformConfigSchema = new mongoose_1.Schema({
    platformUrl: { type: String },
    apiConnected: { type: Boolean, default: false },
    autoPublish: { type: Boolean, default: false },
    contentTypes: [{
            type: String,
            enum: ['Article', 'Video', 'Podcast', 'Livestream', 'SocialPost']
        }],
    customSettings: { type: mongoose_1.Schema.Types.Mixed, default: {} }
}, { _id: false });
// Platform metrics schema
const PlatformMetricsSchema = new mongoose_1.Schema({
    totalFollowers: { type: Number, min: 0, default: 0 },
    monthlyReach: { type: Number, min: 0, default: 0 },
    engagementRate: { type: Number, min: 0, max: 100, default: 0 },
    avgCPM: { type: Number, min: 0, default: 0 },
    totalRevenue: { type: Number, min: 0, default: 0 },
    monthlyRevenue: { type: Number, min: 0, default: 0 }
}, { _id: false });
// Algorithm optimization schema
const AlgorithmOptimizationSchema = new mongoose_1.Schema({
    algorithmScore: { type: Number, min: 0, max: 100, default: 50 },
    preferredContentLength: { type: Number, min: 0, default: 300 }, // seconds
    preferredPostingTimes: [{ type: String }],
    hashtagStrategy: [{ type: String }],
    trendingTopics: [{ type: String }],
    contentFormatPreferences: { type: mongoose_1.Schema.Types.Mixed, default: {} }
}, { _id: false });
// Content distribution schema
const ContentDistributionSchema = new mongoose_1.Schema({
    publishedContent: { type: Number, min: 0, default: 0 },
    scheduledContent: { type: Number, min: 0, default: 0 },
    contentPerformanceAvg: { type: Number, min: 0, max: 100, default: 0 },
    bestPerformingContent: [{ type: String }]
}, { _id: false });
// Platform monetization schema
const PlatformMonetizationSchema = new mongoose_1.Schema({
    monetizationEnabled: { type: Boolean, default: false },
    monetizationTier: {
        type: String,
        enum: ['None', 'Partner', 'Premium', 'Elite'],
        default: 'None'
    },
    revenueShare: { type: Number, min: 0, max: 100, default: 0 },
    adFormats: [{ type: String }],
    sponsorshipOpportunities: { type: Number, min: 0, default: 0 },
    brandDeals: { type: Number, min: 0, default: 0 }
}, { _id: false });
// Main Platform schema
const PlatformSchema = new mongoose_1.Schema({
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
    // Core platform info
    platformType: {
        type: String,
        enum: ['YouTube', 'TikTok', 'Blog', 'Podcast', 'Twitter', 'Instagram', 'Facebook', 'LinkedIn'],
        required: true
    },
    platformName: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    // Configuration and metrics
    config: { type: PlatformConfigSchema, default: () => ({}) },
    metrics: { type: PlatformMetricsSchema, default: () => ({}) },
    algorithmOptimization: { type: AlgorithmOptimizationSchema, default: () => ({}) },
    contentDistribution: { type: ContentDistributionSchema, default: () => ({}) },
    monetization: { type: PlatformMonetizationSchema, default: () => ({}) },
    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastSyncedAt: { type: Date }
});
// Indexes for performance
PlatformSchema.index({ company: 1 });
PlatformSchema.index({ ownedBy: 1 });
PlatformSchema.index({ platformType: 1 });
PlatformSchema.index({ isActive: 1 });
PlatformSchema.index({ 'metrics.totalFollowers': -1 });
PlatformSchema.index({ 'monetization.monetizationEnabled': 1 });
// Pre-save middleware to update timestamps
PlatformSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Export the model
const Platform = mongoose_1.default.models.Platform || mongoose_1.default.model('Platform', PlatformSchema);
exports.default = Platform;
//# sourceMappingURL=Platform.js.map