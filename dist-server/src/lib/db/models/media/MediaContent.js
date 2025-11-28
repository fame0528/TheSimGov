"use strict";
/**
 * @file src/lib/db/models/media/MediaContent.ts
 * @description Media content model for Media industry companies
 * @created 2025-11-24
 *
 * OVERVIEW:
 * MediaContent model representing content pieces (articles, videos, podcasts, livestreams,
 * social posts) created by Media industry companies. Tracks content lifecycle from draft
 * to published to trending, quality scoring (1-100), virality mechanics (share rate, algorithm
 * boost), engagement metrics (views, shares, comments, watch time), and revenue generation
 * (ad CPM, sponsorships). Content drives audience growth and monetization.
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
// Quality metrics schema
const QualityMetricsSchema = new mongoose_1.Schema({
    qualityScore: { type: Number, min: 1, max: 100, default: 50 },
    writingQuality: { type: Number, min: 1, max: 100, default: 50 },
    researchDepth: { type: Number, min: 1, max: 100, default: 50 },
    engagementPotential: { type: Number, min: 1, max: 100, default: 50 },
    factCheckScore: { type: Number, min: 1, max: 100, default: 50 },
    credibilityImpact: { type: Number, min: -10, max: 10, default: 0 }
}, { _id: false });
// Engagement metrics schema
const EngagementMetricsSchema = new mongoose_1.Schema({
    views: { type: Number, min: 0, default: 0 },
    uniqueViewers: { type: Number, min: 0, default: 0 },
    shares: { type: Number, min: 0, default: 0 },
    comments: { type: Number, min: 0, default: 0 },
    likes: { type: Number, min: 0, default: 0 },
    watchTime: { type: Number, min: 0, default: 0 },
    avgWatchTime: { type: Number, min: 0, default: 0 },
    completionRate: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });
// Virality metrics schema
const ViralityMetricsSchema = new mongoose_1.Schema({
    viralCoefficient: { type: Number, min: 0, default: 0 },
    shareRate: { type: Number, min: 0, max: 100, default: 0 },
    trendingScore: { type: Number, min: 0, max: 100, default: 0 },
    peakViews: { type: Number, min: 0, default: 0 },
    isPeaking: { type: Boolean, default: false },
    algorithmBoost: { type: Number, min: 1, max: 10, default: 1 }
}, { _id: false });
// Monetization data schema
const MonetizationDataSchema = new mongoose_1.Schema({
    adRevenue: { type: Number, min: 0, default: 0 },
    cpmRate: { type: Number, min: 0, default: 0 },
    sponsorshipRevenue: { type: Number, min: 0, default: 0 },
    totalRevenue: { type: Number, min: 0, default: 0 },
    roi: { type: Number, min: 0, default: 0 }
}, { _id: false });
// Content metadata schema
const ContentMetadataSchema = new mongoose_1.Schema({
    tags: [{ type: String }],
    categories: [{ type: String }],
    targetAudience: [{ type: String }],
    contentWarnings: [{ type: String }],
    language: { type: String, default: 'en' },
    region: { type: String, default: 'US' }
}, { _id: false });
// Main MediaContent schema
const MediaContentSchema = new mongoose_1.Schema({
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
    // Core content
    type: {
        type: String,
        enum: ['Article', 'Video', 'Podcast', 'Livestream', 'SocialPost'],
        required: true
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    content: { type: String, required: true },
    status: {
        type: String,
        enum: ['Draft', 'Published', 'Trending', 'Archived'],
        default: 'Draft'
    },
    // Timestamps
    publishedAt: { type: Date },
    archivedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    // Quality and metrics
    qualityMetrics: { type: QualityMetricsSchema, default: () => ({}) },
    engagementMetrics: { type: EngagementMetricsSchema, default: () => ({}) },
    viralityMetrics: { type: ViralityMetricsSchema, default: () => ({}) },
    monetizationData: { type: MonetizationDataSchema, default: () => ({}) },
    metadata: { type: ContentMetadataSchema, default: () => ({}) },
    // Additional fields
    thumbnailUrl: { type: String },
    duration: { type: Number, min: 0 }, // seconds
    fileSize: { type: Number, min: 0 }, // bytes
    isSponsored: { type: Boolean, default: false },
    sponsorName: { type: String }
});
// Indexes for performance
MediaContentSchema.index({ company: 1 });
MediaContentSchema.index({ ownedBy: 1 });
MediaContentSchema.index({ status: 1 });
MediaContentSchema.index({ type: 1 });
MediaContentSchema.index({ 'engagementMetrics.views': -1 });
MediaContentSchema.index({ 'viralityMetrics.trendingScore': -1 });
MediaContentSchema.index({ publishedAt: -1 });
// Pre-save middleware to update timestamps
MediaContentSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    // Set publishedAt when status changes to Published
    if (this.isModified('status') && this.status === 'Published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    // Set archivedAt when status changes to Archived
    if (this.isModified('status') && this.status === 'Archived' && !this.archivedAt) {
        this.archivedAt = new Date();
    }
    next();
});
// Export the model
const MediaContent = mongoose_1.default.models.MediaContent || mongoose_1.default.model('MediaContent', MediaContentSchema);
exports.default = MediaContent;
//# sourceMappingURL=MediaContent.js.map