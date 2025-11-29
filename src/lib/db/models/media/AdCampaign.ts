/**
 * @file src/lib/db/models/media/AdCampaign.ts
 * @description AdCampaign Mongoose schema for media advertising campaigns
 * @created 2025-11-24
 *
 * OVERVIEW:
 * AdCampaign model representing media advertising campaigns with CPC (Cost Per Click),
 * CPM (Cost Per Mille) bidding, engagement tracking, and performance optimization.
 * Supports sponsored content, influencer partnerships, and platform advertising
 * with real-time metrics and ROI analysis.
 *
 * SCHEMA FIELDS:
 * Core:
 * - platform: Reference to Platform document
 * - advertiser: Reference to Advertiser/Company document
 * - name: Campaign name
 * - type: Ad type (SponsoredContent, Display, Influencer, Video)
 * - status: Active, Paused, Completed
 * - startDate: Campaign start date
 * - endDate: Campaign end date (null = ongoing)
 *
 * Targeting:
 * - targetedContent: MediaContent IDs to promote
 * - targetedInfluencers: Influencer IDs for partnerships
 * - targetedAudience: Audience demographics to target
 * - audienceType: Broad, Targeted, Retargeting
 *
 * Bidding:
 * - biddingModel: CPC (per click), CPM (per 1000 impressions), CPE (per engagement)
 * - bidAmount: Bid amount per click/impression/engagement
 * - dailyBudget: Maximum spend per day
 * - totalBudget: Maximum total campaign spend
 *
 * Performance Metrics:
 * - impressions: Total ad views
 * - clicks: Total ad clicks
 * - engagements: Total interactions (likes, shares, comments)
 * - conversions: Total desired actions (signups, purchases, downloads)
 * - clickThroughRate: CTR percentage (clicks / impressions)
 * - engagementRate: ER percentage (engagements / impressions)
 * - conversionRate: CVR percentage (conversions / clicks)
 *
 * Financial Metrics:
 * - totalSpend: Total amount spent on ads
 * - totalRevenue: Revenue generated from campaign
 * - acos: Advertising Cost of Sale (spend / revenue %)
 * - roas: Return on Ad Spend (revenue / spend ratio)
 *
 * Quality Score:
 * - qualityScore: 1-10 scale (affects ad rank and CPC)
 * - relevanceScore: Content/audience relevance (0-100)
 * - engagementScore: Historical engagement performance (0-100)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// Centralized Media domain types import (DRY + utility-first)
// Import CampaignStatus as VALUE for Object.values() usage in enum
import {
  CampaignStatus,
  type AdCampaign as AdCampaignDomain,
  type AdCampaignType,
  type AudienceType,
  type BiddingModel,
  type CampaignGoals,
  type CampaignMetrics
} from '../../../types/media';

// Extract domain shape excluding Mongoose-specific fields AND nested objects (schema uses flattened structure)
type AdCampaignBase = Omit<AdCampaignDomain, '_id' | 'platform' | 'advertiser' | 'targetedContent' | 'targetedInfluencers' | 'targetedAudience' | 'goals' | 'metrics' | 'createdAt' | 'updatedAt'>;

// Compose Mongoose document with domain base + ObjectId overrides + flattened schema fields
interface AdCampaignDocument extends Document, AdCampaignBase {
  _id: mongoose.Types.ObjectId;
  platform: mongoose.Types.ObjectId;
  advertiser: mongoose.Types.ObjectId;
  targetedContent: mongoose.Types.ObjectId[];
  targetedInfluencers: mongoose.Types.ObjectId[];
  targetedAudience: mongoose.Types.ObjectId[];
  
  // Performance Metrics (flattened from domain.metrics)
  impressions: number;
  clicks: number;
  engagements: number;
  conversions: number;
  clickThroughRate: number;
  engagementRate: number;
  conversionRate: number;
  
  // Financial Metrics (flattened from domain.metrics)
  totalSpend: number;
  totalRevenue: number;
  acos: number;
  roas: number;
  
  // Optional API compatibility fields (for routes expecting domain structure)
  metrics?: CampaignMetrics;
  goals?: CampaignGoals;
  performanceHistory?: Array<{
    date: Date;
    impressions: number;
    clicks: number;
    engagements: number;
    spend: number;
  }>;
  
  // Virtual fields
  adRank?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// Backward-compatible export aliases
export type IMediaAdCampaign = AdCampaignDocument;
export type MediaAdType = AdCampaignType;
export type MediaBiddingModel = BiddingModel;

/**
 * Media AdCampaign schema definition
 */
const MediaAdCampaignSchema = new Schema<IMediaAdCampaign>(
  {
    // Core
    platform: {
      type: Schema.Types.ObjectId,
      ref: 'Platform',
      required: [true, 'Platform reference is required'],
      index: true,
    },
    advertiser: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Advertiser reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      minlength: [3, 'Campaign name must be at least 3 characters'],
      maxlength: [100, 'Campaign name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ['Display', 'Video', 'Search', 'Social', 'Influencer', 'Sponsored'] satisfies AdCampaignType[],
        message: '{VALUE} is not a valid ad type',
      },
      default: 'Sponsored' satisfies AdCampaignType,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: Object.values(CampaignStatus),
        message: '{VALUE} is not a valid campaign status',
      },
      default: CampaignStatus.ACTIVE,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },

    // Targeting
    targetedContent: {
      type: [Schema.Types.ObjectId],
      ref: 'MediaContent',
      default: [],
    },
    targetedInfluencers: {
      type: [Schema.Types.ObjectId],
      ref: 'Influencer',
      default: [],
    },
    targetedAudience: {
      type: [Schema.Types.ObjectId],
      ref: 'Audience',
      default: [],
    },
    audienceType: {
      type: String,
      required: true,
      enum: {
        values: ['Broad', 'Targeted', 'Retargeting'],
        message: '{VALUE} is not a valid audience type',
      },
      default: 'Broad',
    },

    // Bidding
    biddingModel: {
      type: String,
      required: true,
      enum: {
        values: ['CPC', 'CPM', 'CPE'],
        message: '{VALUE} is not a valid bidding model',
      },
      default: 'CPC',
    },
    bidAmount: {
      type: Number,
      required: [true, 'Bid amount is required'],
      min: [0.10, 'Bid amount must be at least $0.10'],
      max: [100, 'Bid amount cannot exceed $100'],
    },
    dailyBudget: {
      type: Number,
      required: [true, 'Daily budget is required'],
      min: [25, 'Daily budget must be at least $25'],
      max: [50000, 'Daily budget cannot exceed $50,000'],
    },
    totalBudget: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total budget cannot be negative'],
    },

    // Performance Metrics
    impressions: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Impressions cannot be negative'],
    },
    clicks: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Clicks cannot be negative'],
    },
    engagements: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Engagements cannot be negative'],
    },
    conversions: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Conversions cannot be negative'],
    },
    clickThroughRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'CTR cannot be negative'],
      max: [100, 'CTR cannot exceed 100%'],
    },
    engagementRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Engagement rate cannot be negative'],
      max: [100, 'Engagement rate cannot exceed 100%'],
    },
    conversionRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Conversion rate cannot be negative'],
      max: [100, 'Conversion rate cannot exceed 100%'],
    },

    // Financial Metrics
    totalSpend: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total spend cannot be negative'],
    },
    totalRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total revenue cannot be negative'],
    },
    acos: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'ACOS cannot be negative'],
    },
    roas: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'ROAS cannot be negative'],
    },

    // Quality Score
    qualityScore: {
      type: Number,
      required: true,
      default: 5, // 5/10 default
      min: [1, 'Quality score must be at least 1'],
      max: [10, 'Quality score cannot exceed 10'],
    },
    relevanceScore: {
      type: Number,
      required: true,
      default: 70, // 70/100 default
      min: [0, 'Relevance score cannot be negative'],
      max: [100, 'Relevance score cannot exceed 100'],
    },
    engagementScore: {
      type: Number,
      required: true,
      default: 75, // 75/100 default
      min: [0, 'Engagement score cannot be negative'],
      max: [100, 'Engagement score cannot exceed 100'],
    },
  },
  {
    timestamps: true,
    collection: 'media_adcampaigns',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 * Note: platform (line 130), advertiser (line 138), type (line 151), status (line 158) have field-level index: true
 * Compound indexes below duplicate field-level indexes and are removed to eliminate warnings
 */
MediaAdCampaignSchema.index({ acos: 1 }); // ACOS tracking
MediaAdCampaignSchema.index({ biddingModel: 1 }); // Bidding model queries

/**
 * Virtual field: adRank
 *
 * @description
 * Ad rank for auction positioning (Bid Amount * Quality Score)
 * Higher rank = better ad position
 *
 * @returns {number} Ad rank score
 */
MediaAdCampaignSchema.virtual('adRank').get(function (this: IMediaAdCampaign): number {
  return this.bidAmount * this.qualityScore;
});

/**
 * Virtual field: effectiveCPC
 *
 * @description
 * Actual CPC paid (may be lower than bid due to quality score)
 * Formula: (Next competitor Ad Rank / Your Quality Score) + $0.01
 * Simplified: bidAmount * (5 / qualityScore) for estimation
 *
 * @returns {number} Effective CPC ($)
 */
MediaAdCampaignSchema.virtual('effectiveCPC').get(function (this: IMediaAdCampaign): number {
  if (this.qualityScore === 0) return this.bidAmount;
  // Higher quality score = lower actual CPC
  return Math.max(0.10, this.bidAmount * (5 / this.qualityScore));
});

/**
 * Virtual field: profitability
 *
 * @description
 * Campaign profitability rating based on ACOS
 *
 * @returns {string} Profitability rating (Excellent, Good, Fair, Poor, Unprofitable)
 */
MediaAdCampaignSchema.virtual('profitability').get(function (this: IMediaAdCampaign): string {
  if (this.acos < 15) return 'Excellent'; // < 15% ACOS
  if (this.acos < 25) return 'Good'; // 15-25% ACOS
  if (this.acos < 35) return 'Fair'; // 25-35% ACOS
  if (this.acos < 50) return 'Poor'; // 35-50% ACOS
  return 'Unprofitable'; // > 50% ACOS
});

/**
 * Virtual field: budgetRemaining
 *
 * @description
 * Remaining budget for campaign
 *
 * @returns {number} Budget remaining ($)
 */
MediaAdCampaignSchema.virtual('budgetRemaining').get(function (this: IMediaAdCampaign): number {
  if (this.totalBudget === 0) return Infinity; // No budget cap
  return Math.max(0, this.totalBudget - this.totalSpend);
});

/**
 * Virtual field: avgCostPerConversion
 *
 * @description
 * Average cost to acquire one customer through ads
 *
 * @returns {number} Cost per conversion ($)
 */
MediaAdCampaignSchema.virtual('avgCostPerConversion').get(function (this: IMediaAdCampaign): number {
  if (this.conversions === 0) return 0;
  return this.totalSpend / this.conversions;
});

/**
 * Virtual field: engagementEfficiency
 *
 * @description
 * Engagement efficiency score (engagements per dollar spent)
 *
 * @returns {number} Engagements per dollar
 */
MediaAdCampaignSchema.virtual('engagementEfficiency').get(function (this: IMediaAdCampaign): number {
  if (this.totalSpend === 0) return 0;
  return this.engagements / this.totalSpend;
});

/**
 * Pre-save hook: Calculate CTR, ER, CVR, ACOS, ROAS, quality score
 */
MediaAdCampaignSchema.pre<IMediaAdCampaign>('save', function (next) {
  // Calculate CTR (clicks / impressions * 100)
  if (this.impressions > 0) {
    this.clickThroughRate = (this.clicks / this.impressions) * 100;
  }

  // Calculate ER (engagements / impressions * 100)
  if (this.impressions > 0) {
    this.engagementRate = (this.engagements / this.impressions) * 100;
  }

  // Calculate CVR (conversions / clicks * 100)
  if (this.clicks > 0) {
    this.conversionRate = (this.conversions / this.clicks) * 100;
  }

  // Calculate ACOS (spend / revenue * 100)
  if (this.totalRevenue > 0) {
    this.acos = (this.totalSpend / this.totalRevenue) * 100;
  }

  // Calculate ROAS (revenue / spend)
  if (this.totalSpend > 0) {
    this.roas = this.totalRevenue / this.totalSpend;
  }

  // Calculate quality score (composite of relevance, engagement, and CTR)
  const relevanceWeight = 0.4;
  const engagementWeight = 0.3;
  const ctrWeight = 0.3;
  const ctrScore = Math.min(100, this.clickThroughRate * 50); // CTR * 50 to scale to 0-100

  const compositeScore =
    this.relevanceScore * relevanceWeight +
    this.engagementScore * engagementWeight +
    ctrScore * ctrWeight;

  // Scale to 1-10
  this.qualityScore = Math.max(1, Math.min(10, Math.round(compositeScore / 10)));

  next();
});

/**
 * Media AdCampaign model
 *
 * @example
 * ```typescript
 * import AdCampaign from '@/lib/db/models/media/AdCampaign';
 *
 * // Create media campaign
 * const campaign = await AdCampaign.create({
 *   platform: platformId,
 *   advertiser: companyId,
 *   name: "Summer Music Festival Promo",
 *   type: "Influencer",
 *   biddingModel: "CPE",
 *   bidAmount: 2.50, // $2.50 per engagement
 *   dailyBudget: 500,
 *   totalBudget: 15000,
 *   targetedContent: [contentId1, contentId2],
 *   targetedInfluencers: [influencerId1],
 *   targetedAudience: [audienceId1],
 *   audienceType: "Targeted"
 * });
 *
 * // Record ad performance
 * await campaign.updateOne({
 *   $inc: {
 *     impressions: 50000,
 *     clicks: 750, // 1.5% CTR
 *     engagements: 2500, // 5% ER
 *     conversions: 45, // 6% CVR (45/750)
 *     totalSpend: 6250, // 2500 engagements * $2.50
 *     totalRevenue: 22500 // 45 conversions * $500 avg value
 *   }
 * });
 *
 * // Check profitability
 * console.log(campaign.acos); // 27.8% ACOS ($6,250 / $22,500)
 * console.log(campaign.roas); // 3.6x ROAS ($22,500 / $6,250)
 * console.log(campaign.profitability); // "Fair"
 * console.log(campaign.adRank); // e.g., 12.5 (bid $2.50 * quality 5)
 * console.log(campaign.engagementEfficiency); // 0.4 engagements per dollar
 * ```
 */
const AdCampaign: Model<IMediaAdCampaign> =
  mongoose.models.AdCampaign || mongoose.model<IMediaAdCampaign>('AdCampaign', MediaAdCampaignSchema);

export default AdCampaign;