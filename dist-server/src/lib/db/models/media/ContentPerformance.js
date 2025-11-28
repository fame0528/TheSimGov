"use strict";
/**
 * @file src/lib/db/models/media/ContentPerformance.ts
 * @description Content performance tracking model for Media companies
 * @created 2025-11-24
 *
 * OVERVIEW:
 * ContentPerformance model tracking individual content piece analytics and revenue
 * generation. Stores snapshot metrics for historical analysis, trend identification,
 * and performance comparison. Enables content creators to identify top performers,
 * viral patterns, and optimize future content strategy based on data-driven insights.
 *
 * SCHEMA FIELDS:
 * Core:
 * - content: Reference to MediaContent document
 * - company: Reference to Company document (for querying)
 * - snapshotDate: Date of metrics snapshot (daily/weekly)
 * - period: Snapshot period (Daily, Weekly, Monthly, AllTime)
 *
 * Performance Metrics (snapshot):
 * - views: Total views in period
 * - uniqueViewers: Unique viewers in period
 * - shares: Share count in period
 * - comments: Comment count in period
 * - likes: Like count in period
 * - watchTime: Total watch time in period (seconds)
 *
 * Revenue Metrics (snapshot):
 * - adRevenue: Ad revenue in period
 * - sponsorshipRevenue: Sponsorship revenue in period
 * - subscriptionRevenue: Premium content revenue in period
 * - totalRevenue: Total revenue in period
 * - cpmRate: CPM rate for period
 *
 * Engagement Analysis:
 * - engagementRate: (likes + shares + comments) / views %
 * - viralCoefficient: shares / views
 * - shareRate: % who shared
 * - completionRate: % who watched to end
 * - avgWatchTime: Avg watch time in period
 *
 * Trend Analysis:
 * - viewsGrowth: % change vs previous period
 * - revenueGrowth: % change vs previous period
 * - engagementGrowth: % change vs previous period
 * - rankVsOtherContent: Performance ranking
 *
 * Audience Insights:
 * - topAgeGroup: Primary age demographic in period
 * - topIncomeGroup: Primary income demographic in period
 * - topGeography: Primary geographic region
 * - trafficSources: Array of traffic source breakdowns
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
 * ContentPerformance schema definition
 */
const ContentPerformanceSchema = new mongoose_1.Schema({
    // Core
    content: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'MediaContent',
        required: [true, 'Content reference is required'],
        index: true,
    },
    company: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company reference is required'],
    },
    snapshotDate: {
        type: Date,
        required: true,
        default: Date.now,
        index: true,
    },
    period: {
        type: String,
        required: true,
        enum: {
            values: ['Daily', 'Weekly', 'Monthly', 'AllTime'],
            message: '{VALUE} is not a valid snapshot period',
        },
        default: 'Daily',
        index: true,
    },
    // Performance Metrics
    views: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Views cannot be negative'],
    },
    uniqueViewers: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Unique viewers cannot be negative'],
    },
    shares: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Shares cannot be negative'],
    },
    comments: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Comments cannot be negative'],
    },
    likes: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Likes cannot be negative'],
    },
    watchTime: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Watch time cannot be negative'],
    },
    // Revenue Metrics
    adRevenue: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Ad revenue cannot be negative'],
    },
    sponsorshipRevenue: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Sponsorship revenue cannot be negative'],
    },
    subscriptionRevenue: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Subscription revenue cannot be negative'],
    },
    totalRevenue: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Total revenue cannot be negative'],
    },
    cpmRate: {
        type: Number,
        required: true,
        default: 5.0,
        min: [0, 'CPM rate cannot be negative'],
    },
    // Engagement Analysis
    engagementRate: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Engagement rate cannot be negative'],
        max: [100, 'Engagement rate cannot exceed 100%'],
    },
    viralCoefficient: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Viral coefficient cannot be negative'],
    },
    shareRate: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Share rate cannot be negative'],
        max: [100, 'Share rate cannot exceed 100%'],
    },
    completionRate: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Completion rate cannot be negative'],
        max: [100, 'Completion rate cannot exceed 100%'],
    },
    avgWatchTime: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Avg watch time cannot be negative'],
    },
    // Trend Analysis
    viewsGrowth: {
        type: Number,
        required: true,
        default: 0,
        min: [-100, 'Views growth cannot be below -100%'],
    },
    revenueGrowth: {
        type: Number,
        required: true,
        default: 0,
        min: [-100, 'Revenue growth cannot be below -100%'],
    },
    engagementGrowth: {
        type: Number,
        required: true,
        default: 0,
        min: [-100, 'Engagement growth cannot be below -100%'],
    },
    rankVsOtherContent: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Rank cannot be negative'],
    },
    // Audience Insights
    topAgeGroup: {
        type: String,
        trim: true,
    },
    topIncomeGroup: {
        type: String,
        trim: true,
    },
    topGeography: {
        type: String,
        trim: true,
    },
    trafficSources: [
        {
            source: {
                type: String,
                required: true,
                trim: true,
            },
            percentage: {
                type: Number,
                required: true,
                min: 0,
                max: 100,
            },
            views: {
                type: Number,
                required: true,
                min: 0,
            },
        },
    ],
}, {
    timestamps: true,
    collection: 'media_contentperformances',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
/**
 * Indexes for query optimization
 */
ContentPerformanceSchema.index({ content: 1, period: 1, snapshotDate: -1 }); // Performance history
ContentPerformanceSchema.index({ company: 1, period: 1, snapshotDate: -1 }); // Company analytics
ContentPerformanceSchema.index({ totalRevenue: -1 }); // Top revenue content
/**
 * Virtual field: revenuePerView
 *
 * @description
 * Revenue generated per view
 *
 * @returns {number} Revenue per view ($)
 */
ContentPerformanceSchema.virtual('revenuePerView').get(function () {
    if (this.views === 0)
        return 0;
    return Math.round((this.totalRevenue / this.views) * 10000) / 10000;
});
/**
 * Virtual field: revenuePerThousandViews
 *
 * @description
 * Revenue per 1,000 views (CPM equivalent)
 *
 * @returns {number} Revenue per 1k views ($)
 */
ContentPerformanceSchema.virtual('revenuePerThousandViews').get(function () {
    if (this.views === 0)
        return 0;
    return Math.round((this.totalRevenue / this.views) * 1000 * 100) / 100;
});
/**
 * Pre-save hook: Calculate derived metrics
 */
ContentPerformanceSchema.pre('save', function (next) {
    // Calculate total revenue
    this.totalRevenue = this.adRevenue + this.sponsorshipRevenue + this.subscriptionRevenue;
    // Calculate engagement rate
    if (this.views > 0) {
        const totalEngagement = this.likes + this.shares + this.comments;
        this.engagementRate = Math.round((totalEngagement / this.views) * 10000) / 100;
    }
    // Calculate viral coefficient
    if (this.views > 0) {
        this.viralCoefficient = Math.round((this.shares / this.views) * 10000) / 10000;
    }
    // Calculate share rate
    if (this.views > 0) {
        this.shareRate = Math.round((this.shares / this.views) * 10000) / 100;
    }
    // Calculate avg watch time
    if (this.views > 0) {
        this.avgWatchTime = Math.round(this.watchTime / this.views);
    }
    next();
});
/**
 * ContentPerformance model
 *
 * @example
 * ```typescript
 * import ContentPerformance from '@/lib/db/models/media/ContentPerformance';
 *
 * // Create daily snapshot
 * const snapshot = await ContentPerformance.create({
 *   content: contentId,
 *   company: companyId,
 *   period: 'Daily',
 *   snapshotDate: new Date(),
 *   views: 2500,
 *   uniqueViewers: 2100,
 *   shares: 75,
 *   likes: 180,
 *   comments: 42,
 *   watchTime: 360000, // 100 hours total
 *   adRevenue: 125,
 *   cpmRate: 5.0
 * });
 *
 * // Query content performance history
 * const history = await ContentPerformance.find({
 *   content: contentId,
 *   period: 'Daily'
 * })
 *   .sort({ snapshotDate: -1 })
 *   .limit(30); // Last 30 days
 *
 * // Get top performing content
 * const topContent = await ContentPerformance.find({
 *   company: companyId,
 *   period: 'Monthly'
 * })
 *   .sort({ totalRevenue: -1 })
 *   .limit(10);
 *
 * console.log(snapshot.revenuePerView); // Revenue efficiency
 * console.log(snapshot.engagementRate); // Engagement %
 * console.log(snapshot.viralCoefficient); // Virality
 * ```
 */
const ContentPerformance = mongoose_1.default.models.ContentPerformance ||
    mongoose_1.default.model('ContentPerformance', ContentPerformanceSchema);
exports.default = ContentPerformance;
//# sourceMappingURL=ContentPerformance.js.map