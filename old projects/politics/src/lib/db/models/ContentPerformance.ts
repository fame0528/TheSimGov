/**
 * @file src/lib/db/models/ContentPerformance.ts
 * @description Content performance tracking model for Media companies
 * @created 2025-11-17
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
 * 
 * USAGE:
 * ```typescript
 * import ContentPerformance from '@/lib/db/models/ContentPerformance';
 * 
 * // Daily snapshot
 * const dailyPerformance = await ContentPerformance.create({
 *   content: contentId,
 *   company: companyId,
 *   period: 'Daily',
 *   views: 1500,
 *   shares: 45,
 *   adRevenue: 75
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Snapshots created daily at midnight UTC (automated job)
 * - Weekly/monthly snapshots aggregate daily data
 * - AllTime snapshots update on significant milestones
 * - Used for analytics dashboards, trend charts, top content ranking
 * - Enables A/B testing content strategies
 * - Historical data for ML prediction models
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Snapshot period enum
 */
export type SnapshotPeriod = 'Daily' | 'Weekly' | 'Monthly' | 'AllTime';

/**
 * Traffic source interface
 */
interface TrafficSource {
  source: string; // 'Organic', 'Social', 'Direct', 'Referral'
  percentage: number;
  views: number;
}

/**
 * ContentPerformance document interface
 */
export interface IContentPerformance extends Document {
  // Core
  content: Types.ObjectId;
  company: Types.ObjectId;
  snapshotDate: Date;
  period: SnapshotPeriod;

  // Performance Metrics
  views: number;
  uniqueViewers: number;
  shares: number;
  comments: number;
  likes: number;
  watchTime: number;

  // Revenue Metrics
  adRevenue: number;
  sponsorshipRevenue: number;
  subscriptionRevenue: number;
  totalRevenue: number;
  cpmRate: number;

  // Engagement Analysis
  engagementRate: number;
  viralCoefficient: number;
  shareRate: number;
  completionRate: number;
  avgWatchTime: number;

  // Trend Analysis
  viewsGrowth: number;
  revenueGrowth: number;
  engagementGrowth: number;
  rankVsOtherContent: number;

  // Audience Insights
  topAgeGroup?: string;
  topIncomeGroup?: string;
  topGeography?: string;
  trafficSources: TrafficSource[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  revenuePerView: number;
  revenuePerThousandViews: number;
}

/**
 * ContentPerformance schema definition
 */
const ContentPerformanceSchema = new Schema<IContentPerformance>(
  {
    // Core
    content: {
      type: Schema.Types.ObjectId,
      ref: 'MediaContent',
      required: [true, 'Content reference is required'],
      index: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
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
  },
  {
    timestamps: true,
    collection: 'contentperformances',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

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
ContentPerformanceSchema.virtual('revenuePerView').get(function (this: IContentPerformance): number {
  if (this.views === 0) return 0;
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
ContentPerformanceSchema.virtual('revenuePerThousandViews').get(
  function (this: IContentPerformance): number {
    if (this.views === 0) return 0;
    return Math.round((this.totalRevenue / this.views) * 1000 * 100) / 100;
  }
);

/**
 * Pre-save hook: Calculate derived metrics
 */
ContentPerformanceSchema.pre<IContentPerformance>('save', function (next) {
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
 * import ContentPerformance from '@/lib/db/models/ContentPerformance';
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
const ContentPerformance: Model<IContentPerformance> =
  mongoose.models.ContentPerformance ||
  mongoose.model<IContentPerformance>('ContentPerformance', ContentPerformanceSchema);

export default ContentPerformance;
