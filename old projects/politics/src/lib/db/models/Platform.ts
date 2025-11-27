/**
 * @file src/lib/db/models/Platform.ts
 * @description Distribution platform model for Media companies
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Platform model representing distribution channels for Media companies (YouTube,
 * TikTok, Blog, Podcast platforms, etc.). Tracks platform-specific performance,
 * algorithm preferences, monetization settings, and cross-platform strategy. Enables
 * multi-channel distribution with optimized content formatting per platform.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document
 * - platformType: Type of platform (YouTube, TikTok, Blog, Podcast, Twitter, Instagram)
 * - platformName: Custom name (e.g., "TechTalk YouTube Channel")
 * - isActive: Platform actively used
 * 
 * Platform Configuration:
 * - platformUrl: URL to platform presence
 * - apiConnected: API integration status
 * - autoPublish: Auto-publish new content to this platform
 * - contentTypes: Supported content types (Article, Video, etc.)
 * 
 * Performance Metrics:
 * - totalFollowers: Total followers on platform
 * - monthlyReach: Monthly unique reach
 * - engagementRate: Platform engagement %
 * - avgCPM: Average CPM on this platform
 * - totalRevenue: All-time revenue from platform
 * - monthlyRevenue: Revenue this month
 * 
 * Algorithm Optimization:
 * - algorithmScore: Platform algorithm favorability (0-100)
 * - preferredContentLength: Optimal content length for algorithm
 * - preferredPostingTime: Best posting times
 * - hashtagStrategy: Hashtag recommendations
 * - trendingTopics: Current trending topics on platform
 * 
 * Content Distribution:
 * - publishedContent: Count of published content pieces
 * - scheduledContent: Count of scheduled content
 * - contentPerformanceAvg: Avg performance of content on platform
 * 
 * Monetization:
 * - monetizationEnabled: Monetization active
 * - monetizationTier: Partnership tier (Partner, Premium, Elite)
 * - revenueShare: Platform revenue share %
 * - adFormats: Supported ad formats
 * 
 * USAGE:
 * ```typescript
 * import Platform from '@/lib/db/models/Platform';
 * 
 * // Create YouTube platform
 * const youtube = await Platform.create({
 *   company: companyId,
 *   platformType: 'YouTube',
 *   platformName: 'TechTalk Channel',
 *   totalFollowers: 50000,
 *   autoPublish: true,
 *   contentTypes: ['Video', 'Livestream']
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Each company can have multiple platforms (1 per type max)
 * - API integrations enable automated posting
 * - Algorithm scores updated daily based on performance
 * - Used for multi-platform distribution strategy
 * - Cross-platform analytics aggregation
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Platform type enum
 */
export type PlatformType = 'YouTube' | 'TikTok' | 'Blog' | 'Podcast' | 'Twitter' | 'Instagram';

/**
 * Content type enum (supported on platform)
 */
export type ContentType = 'Article' | 'Video' | 'Podcast' | 'Livestream' | 'SocialPost';

/**
 * Monetization tier enum
 */
export type MonetizationTier = 'None' | 'Partner' | 'Premium' | 'Elite';

/**
 * Ad format interface
 */
interface AdFormat {
  format: string; // 'PreRoll', 'MidRoll', 'Banner', 'Sponsored'
  enabled: boolean;
  cpm: number;
}

/**
 * Platform document interface
 */
export interface IPlatform extends Document {
  // Core
  company: Types.ObjectId;
  platformType: PlatformType;
  platformName: string;
  isActive: boolean;

  // Platform Configuration
  platformUrl?: string;
  apiConnected: boolean;
  autoPublish: boolean;
  contentTypes: ContentType[];

  // Performance Metrics
  totalFollowers: number;
  monthlyReach: number;
  engagementRate: number;
  avgCPM: number;
  totalRevenue: number;
  monthlyRevenue: number;

  // Algorithm Optimization
  algorithmScore: number;
  preferredContentLength?: number;
  preferredPostingTime?: string;
  hashtagStrategy?: string;
  trendingTopics: string[];

  // Content Distribution
  publishedContent: number;
  scheduledContent: number;
  contentPerformanceAvg: number;

  // Monetization
  monetizationEnabled: boolean;
  monetizationTier: MonetizationTier;
  revenueShare: number;
  adFormats: AdFormat[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  followerGrowthRate: number;
  revenuePerFollower: number;
}

/**
 * Platform schema definition
 */
const PlatformSchema = new Schema<IPlatform>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    platformType: {
      type: String,
      required: true,
      enum: {
        values: ['YouTube', 'TikTok', 'Blog', 'Podcast', 'Twitter', 'Instagram'],
        message: '{VALUE} is not a valid platform type',
      },
    },
    platformName: {
      type: String,
      required: [true, 'Platform name is required'],
      trim: true,
      maxlength: [100, 'Platform name cannot exceed 100 characters'],
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },

    // Platform Configuration
    platformUrl: {
      type: String,
      trim: true,
    },
    apiConnected: {
      type: Boolean,
      required: true,
      default: false,
    },
    autoPublish: {
      type: Boolean,
      required: true,
      default: false,
    },
    contentTypes: [
      {
        type: String,
        enum: ['Article', 'Video', 'Podcast', 'Livestream', 'SocialPost'],
      },
    ],

    // Performance Metrics
    totalFollowers: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total followers cannot be negative'],
    },
    monthlyReach: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly reach cannot be negative'],
    },
    engagementRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Engagement rate cannot be negative'],
      max: [100, 'Engagement rate cannot exceed 100%'],
    },
    avgCPM: {
      type: Number,
      required: true,
      default: 5.0,
      min: [0, 'CPM cannot be negative'],
    },
    totalRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total revenue cannot be negative'],
    },
    monthlyRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly revenue cannot be negative'],
    },

    // Algorithm Optimization
    algorithmScore: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Algorithm score cannot be below 0'],
      max: [100, 'Algorithm score cannot exceed 100'],
    },
    preferredContentLength: {
      type: Number,
      min: [0, 'Content length cannot be negative'],
    },
    preferredPostingTime: {
      type: String,
      trim: true,
    },
    hashtagStrategy: {
      type: String,
      trim: true,
    },
    trendingTopics: [
      {
        type: String,
        trim: true,
      },
    ],

    // Content Distribution
    publishedContent: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Published content cannot be negative'],
    },
    scheduledContent: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Scheduled content cannot be negative'],
    },
    contentPerformanceAvg: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Content performance avg cannot be negative'],
      max: [100, 'Content performance avg cannot exceed 100'],
    },

    // Monetization
    monetizationEnabled: {
      type: Boolean,
      required: true,
      default: false,
    },
    monetizationTier: {
      type: String,
      required: true,
      enum: {
        values: ['None', 'Partner', 'Premium', 'Elite'],
        message: '{VALUE} is not a valid monetization tier',
      },
      default: 'None',
    },
    revenueShare: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Revenue share cannot be below 0%'],
      max: [100, 'Revenue share cannot exceed 100%'],
    },
    adFormats: [
      {
        format: {
          type: String,
          required: true,
          trim: true,
        },
        enabled: {
          type: Boolean,
          required: true,
          default: true,
        },
        cpm: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: 'platforms',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
PlatformSchema.index({ company: 1, platformType: 1 }, { unique: true }); // One platform per type per company
PlatformSchema.index({ isActive: 1 }); // Active platforms filter

/**
 * Virtual field: followerGrowthRate
 * 
 * @description
 * Estimated monthly follower growth rate based on engagement
 * Simple approximation: high engagement = higher growth
 * 
 * @returns {number} Growth rate %
 */
PlatformSchema.virtual('followerGrowthRate').get(function (this: IPlatform): number {
  if (this.totalFollowers === 0) return 0;
  // Engagement drives growth (simplified model)
  const baseGrowth = this.engagementRate * 0.5; // 10% engagement = 5% growth
  return Math.round(baseGrowth * 100) / 100;
});

/**
 * Virtual field: revenuePerFollower
 * 
 * @description
 * Average revenue generated per follower per month
 * 
 * @returns {number} Revenue per follower ($)
 */
PlatformSchema.virtual('revenuePerFollower').get(function (this: IPlatform): number {
  if (this.totalFollowers === 0) return 0;
  return Math.round((this.monthlyRevenue / this.totalFollowers) * 10000) / 10000;
});

/**
 * Platform model
 * 
 * @example
 * ```typescript
 * import Platform from '@/lib/db/models/Platform';
 * 
 * // Create YouTube platform
 * const youtube = await Platform.create({
 *   company: companyId,
 *   platformType: 'YouTube',
 *   platformName: 'TechTalk Channel',
 *   platformUrl: 'https://youtube.com/c/techtalk',
 *   contentTypes: ['Video', 'Livestream'],
 *   totalFollowers: 50000,
 *   monthlyReach: 200000,
 *   engagementRate: 8.5,
 *   avgCPM: 12.0,
 *   monetizationEnabled: true,
 *   monetizationTier: 'Partner',
 *   adFormats: [
 *     { format: 'PreRoll', enabled: true, cpm: 15 },
 *     { format: 'MidRoll', enabled: true, cpm: 18 }
 *   ]
 * });
 * 
 * // Query all platforms for company
 * const platforms = await Platform.find({ company: companyId, isActive: true });
 * 
 * // Get top performing platform
 * const topPlatform = await Platform.findOne({ company: companyId })
 *   .sort({ monthlyRevenue: -1 });
 * 
 * console.log(youtube.followerGrowthRate); // Growth %
 * console.log(youtube.revenuePerFollower); // Revenue efficiency
 * ```
 */
const Platform: Model<IPlatform> =
  mongoose.models.Platform || mongoose.model<IPlatform>('Platform', PlatformSchema);

export default Platform;
