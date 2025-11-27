/**
 * @file src/lib/db/models/MediaContent.ts
 * @description Media content model for Media industry companies
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * MediaContent model representing content pieces (articles, videos, podcasts, livestreams,
 * social posts) created by Media industry companies. Tracks content lifecycle from draft
 * to published to trending, quality scoring (1-100), virality mechanics (share rate, algorithm
 * boost), engagement metrics (views, shares, comments, watch time), and revenue generation
 * (ad CPM, sponsorships). Content drives audience growth and monetization.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (Media industry)
 * - type: Content type (Article, Video, Podcast, Livestream, SocialPost)
 * - title: Content title/headline
 * - description: Brief description/excerpt
 * - content: Full content body (text, video URL, audio URL)
 * - status: Lifecycle status (Draft, Published, Trending, Archived)
 * - publishedAt: Publication timestamp
 * - archivedAt: Archive timestamp
 * 
 * Quality Metrics:
 * - qualityScore: Overall content quality (1-100)
 * - writingQuality: Writing/production quality (1-100)
 * - researchDepth: Research thoroughness (1-100)
 * - engagementPotential: Predicted engagement (1-100)
 * - factCheckScore: Fact-checking accuracy (1-100)
 * - credibilityImpact: Impact on creator credibility (-10 to +10)
 * 
 * Engagement Metrics:
 * - views: Total views/listens
 * - uniqueViewers: Unique audience count
 * - shares: Share count
 * - comments: Comment count
 * - likes: Like count
 * - watchTime: Total watch/listen time (seconds)
 * - avgWatchTime: Average watch/listen time (seconds)
 * - completionRate: % who watched/listened to end
 * 
 * Virality Mechanics:
 * - viralCoefficient: Avg shares per view
 * - shareRate: % of viewers who shared
 * - trendingScore: Algorithm visibility boost (0-100)
 * - peakViews: Highest views in 24h
 * - isPeaking: Currently trending
 * - algorithmBoost: Platform algorithm multiplier (1-10)
 * 
 * Monetization:
 * - revenueGenerated: Total revenue earned
 * - adRevenue: Ad CPM revenue
 * - sponsorshipRevenue: Brand deal revenue
 * - subscriptionRevenue: Premium content revenue
 * - cpmRate: CPM rate based on demographics
 * - productionCost: Content creation cost
 * 
 * Demographics:
 * - targetAgeGroup: Primary age demographic
 * - targetIncome: Primary income demographic
 * - politicalLeaning: Political alignment (Left, Center, Right)
 * - geographicFocus: Geographic target (Local, National, Global)
 * 
 * Political Integration:
 * - isPropaganda: Paid political messaging
 * - politicalCampaign: Reference to campaign if propaganda
 * - controversialScore: Controversy level (0-100)
 * - cancelRisk: Risk of backlash/cancellation (0-100)
 * 
 * USAGE:
 * ```typescript
 * import MediaContent from '@/lib/db/models/MediaContent';
 * 
 * // Create article
 * const article = await MediaContent.create({
 *   company: companyId,
 *   type: 'Article',
 *   title: "Breaking: Tech Giant Announces Layoffs",
 *   content: "...",
 *   qualityScore: 85,
 *   targetAgeGroup: "25-34"
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Quality score formula: (writing × 0.4 + research × 0.3 + engagement × 0.3)
 * - Viral coefficient = shares / views (industry avg: 0.02-0.05)
 * - Trending threshold: viralCoefficient > 0.05 && views > 10,000
 * - CPM rates: $2-$5 (basic), $10-$20 (premium), $30-$50 (high-value)
 * - Algorithm boost: Based on engagement rate, shareRate, completionRate
 * - Cancel risk: Controversial content can damage creator reputation
 * - Political propaganda: 10x CPM but damages credibility if exposed
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Content type enum
 */
export type ContentType = 'Article' | 'Video' | 'Podcast' | 'Livestream' | 'SocialPost';

/**
 * Content status enum
 */
export type ContentStatus = 'Draft' | 'Published' | 'Trending' | 'Archived';

/**
 * Political leaning enum
 */
export type PoliticalLeaning = 'Left' | 'Center' | 'Right' | 'Nonpartisan';

/**
 * Geographic focus enum
 */
export type GeographicFocus = 'Local' | 'Regional' | 'National' | 'Global';

/**
 * MediaContent document interface
 */
export interface IMediaContent extends Document {
  // Core
  company: Types.ObjectId;
  type: ContentType;
  title: string;
  description?: string;
  content: string;
  status: ContentStatus;
  publishedAt?: Date;
  archivedAt?: Date;

  // Quality Metrics
  qualityScore: number;
  writingQuality: number;
  researchDepth: number;
  engagementPotential: number;
  factCheckScore: number;
  credibilityImpact: number;

  // Engagement Metrics
  views: number;
  uniqueViewers: number;
  shares: number;
  comments: number;
  likes: number;
  watchTime: number;
  avgWatchTime: number;
  completionRate: number;

  // Virality Mechanics
  viralCoefficient: number;
  shareRate: number;
  trendingScore: number;
  peakViews: number;
  isPeaking: boolean;
  algorithmBoost: number;

  // Monetization
  revenueGenerated: number;
  adRevenue: number;
  sponsorshipRevenue: number;
  subscriptionRevenue: number;
  cpmRate: number;
  productionCost: number;

  // Demographics
  targetAgeGroup?: string;
  targetIncome?: string;
  politicalLeaning: PoliticalLeaning;
  geographicFocus: GeographicFocus;

  // Political Integration
  isPropaganda: boolean;
  politicalCampaign?: Types.ObjectId;
  controversialScore: number;
  cancelRisk: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  engagementRate: number;
  revenuePerView: number;
  roi: number;
  isViral: boolean;
}

/**
 * MediaContent schema definition
 */
const MediaContentSchema = new Schema<IMediaContent>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ['Article', 'Video', 'Podcast', 'Livestream', 'SocialPost'],
        message: '{VALUE} is not a valid content type',
      },
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Content title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content body is required'],
      trim: true,
      maxlength: [100000, 'Content cannot exceed 100,000 characters'],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Draft', 'Published', 'Trending', 'Archived'],
        message: '{VALUE} is not a valid content status',
      },
      default: 'Draft',
      index: true,
    },
    publishedAt: {
      type: Date,
      index: true,
    },
    archivedAt: {
      type: Date,
    },

    // Quality Metrics
    qualityScore: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Quality score must be at least 1'],
      max: [100, 'Quality score cannot exceed 100'],
    },
    writingQuality: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Writing quality must be at least 1'],
      max: [100, 'Writing quality cannot exceed 100'],
    },
    researchDepth: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Research depth must be at least 1'],
      max: [100, 'Research depth cannot exceed 100'],
    },
    engagementPotential: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Engagement potential must be at least 1'],
      max: [100, 'Engagement potential cannot exceed 100'],
    },
    factCheckScore: {
      type: Number,
      required: true,
      default: 100,
      min: [0, 'Fact check score cannot be negative'],
      max: [100, 'Fact check score cannot exceed 100'],
    },
    credibilityImpact: {
      type: Number,
      required: true,
      default: 0,
      min: [-10, 'Credibility impact cannot be below -10'],
      max: [10, 'Credibility impact cannot exceed 10'],
    },

    // Engagement Metrics
    views: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Views cannot be negative'],
      index: true,
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
    avgWatchTime: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Avg watch time cannot be negative'],
    },
    completionRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Completion rate cannot be negative'],
      max: [100, 'Completion rate cannot exceed 100'],
    },

    // Virality Mechanics
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
      max: [100, 'Share rate cannot exceed 100'],
    },
    trendingScore: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Trending score cannot be negative'],
      max: [100, 'Trending score cannot exceed 100'],
      index: true,
    },
    peakViews: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Peak views cannot be negative'],
    },
    isPeaking: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    algorithmBoost: {
      type: Number,
      required: true,
      default: 1.0,
      min: [1, 'Algorithm boost must be at least 1'],
      max: [10, 'Algorithm boost cannot exceed 10'],
    },

    // Monetization
    revenueGenerated: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Revenue generated cannot be negative'],
    },
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
    cpmRate: {
      type: Number,
      required: true,
      default: 5.0, // $5 CPM default
      min: [0, 'CPM rate cannot be negative'],
    },
    productionCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Production cost cannot be negative'],
    },

    // Demographics
    targetAgeGroup: {
      type: String,
      trim: true,
      maxlength: [50, 'Target age group cannot exceed 50 characters'],
    },
    targetIncome: {
      type: String,
      trim: true,
      maxlength: [50, 'Target income cannot exceed 50 characters'],
    },
    politicalLeaning: {
      type: String,
      required: true,
      enum: {
        values: ['Left', 'Center', 'Right', 'Nonpartisan'],
        message: '{VALUE} is not a valid political leaning',
      },
      default: 'Nonpartisan',
    },
    geographicFocus: {
      type: String,
      required: true,
      enum: {
        values: ['Local', 'Regional', 'National', 'Global'],
        message: '{VALUE} is not a valid geographic focus',
      },
      default: 'Local',
    },

    // Political Integration
    isPropaganda: {
      type: Boolean,
      required: true,
      default: false,
    },
    politicalCampaign: {
      type: Schema.Types.ObjectId,
      ref: 'PropagandaCampaign',
    },
    controversialScore: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Controversial score cannot be negative'],
      max: [100, 'Controversial score cannot exceed 100'],
    },
    cancelRisk: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Cancel risk cannot be negative'],
      max: [100, 'Cancel risk cannot exceed 100'],
    },
  },
  {
    timestamps: true,
    collection: 'mediacontents',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
MediaContentSchema.index({ company: 1, status: 1, publishedAt: -1 }); // Content by status
MediaContentSchema.index({ type: 1, trendingScore: -1 }); // Trending content by type
MediaContentSchema.index({ views: -1 }); // Most viewed
MediaContentSchema.index({ isPropaganda: 1, politicalLeaning: 1 }); // Political content

/**
 * Virtual field: engagementRate
 * 
 * @description
 * Overall engagement rate (likes + shares + comments) / views
 * 
 * @returns {number} Engagement rate percentage
 */
MediaContentSchema.virtual('engagementRate').get(function (this: IMediaContent): number {
  if (this.views === 0) return 0;
  const totalEngagement = this.likes + this.shares + this.comments;
  return Math.round((totalEngagement / this.views) * 10000) / 100;
});

/**
 * Virtual field: revenuePerView
 * 
 * @description
 * Average revenue generated per view
 * 
 * @returns {number} Revenue per view ($)
 */
MediaContentSchema.virtual('revenuePerView').get(function (this: IMediaContent): number {
  if (this.views === 0) return 0;
  return Math.round((this.revenueGenerated / this.views) * 100) / 100;
});

/**
 * Virtual field: roi
 * 
 * @description
 * Return on investment (revenue - cost) / cost percentage
 * 
 * @returns {number} ROI percentage
 */
MediaContentSchema.virtual('roi').get(function (this: IMediaContent): number {
  if (this.productionCost === 0) return 0;
  const profit = this.revenueGenerated - this.productionCost;
  return Math.round((profit / this.productionCost) * 100);
});

/**
 * Virtual field: isViral
 * 
 * @description
 * Determines if content is viral (viralCoefficient > 0.05 && views > 10,000)
 * 
 * @returns {boolean} Is viral
 */
MediaContentSchema.virtual('isViral').get(function (this: IMediaContent): boolean {
  return this.viralCoefficient > 0.05 && this.views > 10000;
});

/**
 * Pre-save hook: Calculate derived metrics
 */
MediaContentSchema.pre<IMediaContent>('save', function (next) {
  // Calculate quality score (weighted average)
  this.qualityScore = Math.round(
    this.writingQuality * 0.4 + this.researchDepth * 0.3 + this.engagementPotential * 0.3
  );

  // Calculate viral coefficient (shares / views)
  if (this.views > 0) {
    this.viralCoefficient = Math.round((this.shares / this.views) * 10000) / 10000;
  }

  // Calculate share rate (% of viewers who shared)
  if (this.views > 0) {
    this.shareRate = Math.round((this.shares / this.views) * 10000) / 100;
  }

  // Calculate avg watch time
  if (this.views > 0) {
    this.avgWatchTime = Math.round(this.watchTime / this.views);
  }

  // Calculate trending score (engagement + virality + algorithm boost)
  const engagementScore = Math.min(this.engagementRate, 10) * 5; // 0-50 points
  const viralityScore = Math.min(this.viralCoefficient * 1000, 30); // 0-30 points
  const algorithmScore = (this.algorithmBoost - 1) * 2.5; // 0-20 points (boost 1-10)
  this.trendingScore = Math.min(engagementScore + viralityScore + algorithmScore, 100);

  // Auto-set isPeaking if trending score > 70
  this.isPeaking = this.trendingScore > 70;

  // Calculate total revenue
  this.revenueGenerated = this.adRevenue + this.sponsorshipRevenue + this.subscriptionRevenue;

  // Set published timestamp if transitioning to Published
  if (this.status === 'Published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Set archived timestamp if transitioning to Archived
  if (this.status === 'Archived' && !this.archivedAt) {
    this.archivedAt = new Date();
  }

  next();
});

/**
 * MediaContent model
 * 
 * @example
 * ```typescript
 * import MediaContent from '@/lib/db/models/MediaContent';
 * 
 * // Create article
 * const article = await MediaContent.create({
 *   company: companyId,
 *   type: 'Article',
 *   title: "10 AI Trends Shaping 2025",
 *   description: "Analysis of emerging AI technologies",
 *   content: "...",
 *   writingQuality: 85,
 *   researchDepth: 90,
 *   engagementPotential: 75,
 *   targetAgeGroup: "25-34",
 *   geographicFocus: "National"
 * });
 * 
 * // Publish content
 * await article.updateOne({ status: 'Published' });
 * 
 * // Track engagement
 * await article.updateOne({
 *   $inc: {
 *     views: 1000,
 *     uniqueViewers: 850,
 *     shares: 45,
 *     likes: 120
 *   }
 * });
 * 
 * // Calculate revenue
 * const viewsInThousands = article.views / 1000;
 * const adRev = viewsInThousands * article.cpmRate;
 * await article.updateOne({ adRevenue: adRev });
 * 
 * console.log(article.isViral); // Check if viral
 * console.log(article.engagementRate); // Engagement %
 * console.log(article.roi); // ROI %
 * ```
 */
const MediaContent: Model<IMediaContent> =
  mongoose.models.MediaContent || mongoose.model<IMediaContent>('MediaContent', MediaContentSchema);

export default MediaContent;
