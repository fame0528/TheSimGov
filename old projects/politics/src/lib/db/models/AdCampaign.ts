/**
 * @file src/lib/db/models/AdCampaign.ts
 * @description AdCampaign Mongoose schema for marketplace advertising campaigns
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * AdCampaign model representing Amazon-style sponsored product advertising with CPC (Cost Per Click)
 * and CPM (Cost Per Mille) bidding, quality score algorithms, ACOS (Advertising Cost of Sale) tracking,
 * and ad auction mechanics. High-margin revenue stream (80%+) with real-time bidding and performance
 * optimization capabilities.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - marketplace: Reference to Marketplace document
 * - seller: Reference to Seller document (advertiser)
 * - name: Campaign name
 * - type: Ad type (SponsoredProduct, Display, Video)
 * - status: Active, Paused, Completed
 * - startDate: Campaign start date
 * - endDate: Campaign end date (null = ongoing)
 * 
 * Targeting:
 * - targetedProducts: Product IDs to advertise
 * - targetedKeywords: Search keywords to bid on
 * - targetedCategories: Product categories to target
 * - audienceType: Broad, Targeted, Retargeting
 * 
 * Bidding:
 * - biddingModel: CPC (per click), CPM (per 1000 impressions)
 * - bidAmount: Bid amount per click/impression
 * - dailyBudget: Maximum spend per day
 * - totalBudget: Maximum total campaign spend
 * 
 * Performance Metrics:
 * - impressions: Total ad views
 * - clicks: Total ad clicks
 * - conversions: Total purchases from ads
 * - clickThroughRate: CTR percentage (clicks / impressions)
 * - conversionRate: CVR percentage (conversions / clicks)
 * 
 * Financial Metrics:
 * - totalSpend: Total amount spent on ads
 * - totalRevenue: Revenue generated from ad conversions
 * - acos: Advertising Cost of Sale (spend / revenue %)
 * - roas: Return on Ad Spend (revenue / spend ratio)
 * 
 * Quality Score:
 * - qualityScore: 1-10 scale (affects ad rank and CPC)
 * - relevanceScore: Keyword/product relevance (0-100)
 * - landingPageScore: Product page quality (0-100)
 * 
 * USAGE:
 * ```typescript
 * import AdCampaign from '@/lib/db/models/AdCampaign';
 * 
 * // Create campaign
 * const campaign = await AdCampaign.create({
 *   marketplace: marketplaceId,
 *   seller: sellerId,
 *   name: "Holiday Electronics Promo",
 *   type: "SponsoredProduct",
 *   biddingModel: "CPC",
 *   bidAmount: 1.50, // $1.50 per click
 *   dailyBudget: 100
 * });
 * 
 * // Record impression and click
 * await campaign.updateOne({
 *   $inc: {
 *     impressions: 100,
 *     clicks: 3, // 3% CTR
 *     totalSpend: 4.50 // 3 clicks * $1.50
 *   }
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Ad types: SponsoredProduct (search results), Display (banner ads), Video (streaming ads)
 * - Bidding: CPC $0.50-$3.00 (avg $1.50), CPM $5-$20 (avg $10)
 * - Profit margins: 80%+ (low infrastructure costs, high ad pricing)
 * - ACOS healthy: < 20%, concerning: 20-40%, unprofitable: > 40%
 * - ROAS healthy: > 5x, good: 3-5x, poor: < 3x
 * - Quality Score: Affects ad rank (higher score = better position at lower CPC)
 * - Quality factors: Keyword relevance (40%), Landing page (30%), CTR history (30%)
 * - Ad rank formula: Bid Amount * Quality Score
 * - CTR benchmarks: 0.5-1.5% typical, 2%+ excellent, < 0.3% poor
 * - Conversion rate: 2-5% typical for e-commerce
 * - Daily budget pacing: Evenly distribute throughout day (avoid blowing budget early)
 * - Retargeting: Show ads to users who viewed products but didn't purchase (30% higher CVR)
 * - Negative keywords: Exclude irrelevant searches to improve ACOS
 * - Dayparting: Adjust bids by time of day (higher during peak shopping hours)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Ad campaign types
 */
export type AdType = 'SponsoredProduct' | 'Display' | 'Video';

/**
 * Campaign status types
 */
export type CampaignStatus = 'Active' | 'Paused' | 'Completed';

/**
 * Audience targeting types
 */
export type AudienceType = 'Broad' | 'Targeted' | 'Retargeting';

/**
 * Bidding model types
 */
export type BiddingModel = 'CPC' | 'CPM';

/**
 * AdCampaign document interface
 * 
 * @interface IAdCampaign
 * @extends {Document}
 */
export interface IAdCampaign extends Document {
  // Core
  marketplace: Types.ObjectId;
  seller: Types.ObjectId;
  name: string;
  type: AdType;
  status: CampaignStatus;
  startDate: Date;
  endDate?: Date;

  // Targeting
  targetedProducts: Types.ObjectId[];
  targetedKeywords: string[];
  targetedCategories: string[];
  audienceType: AudienceType;

  // Bidding
  biddingModel: BiddingModel;
  bidAmount: number;
  dailyBudget: number;
  totalBudget: number;

  // Performance Metrics
  impressions: number;
  clicks: number;
  conversions: number;
  clickThroughRate: number;
  conversionRate: number;

  // Financial Metrics
  totalSpend: number;
  totalRevenue: number;
  acos: number;
  roas: number;

  // Quality Score
  qualityScore: number;
  relevanceScore: number;
  landingPageScore: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  adRank: number;
  effectiveCPC: number;
  profitability: string;
  budgetRemaining: number;
  avgCostPerConversion: number;
}

/**
 * AdCampaign schema definition
 */
const AdCampaignSchema = new Schema<IAdCampaign>(
  {
    // Core
    marketplace: {
      type: Schema.Types.ObjectId,
      ref: 'Marketplace',
      required: [true, 'Marketplace reference is required'],
      index: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
      required: [true, 'Seller reference is required'],
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
        values: ['SponsoredProduct', 'Display', 'Video'],
        message: '{VALUE} is not a valid ad type',
      },
      default: 'SponsoredProduct',
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Active', 'Paused', 'Completed'],
        message: '{VALUE} is not a valid campaign status',
      },
      default: 'Active',
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
    targetedProducts: {
      type: [Schema.Types.ObjectId],
      ref: 'Product',
      default: [],
      validate: {
        validator: (v: Types.ObjectId[]) => v.length > 0,
        message: 'Must target at least 1 product',
      },
    },
    targetedKeywords: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 100,
        message: 'Cannot target more than 100 keywords',
      },
    },
    targetedCategories: {
      type: [String],
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
        values: ['CPC', 'CPM'],
        message: '{VALUE} is not a valid bidding model',
      },
      default: 'CPC',
    },
    bidAmount: {
      type: Number,
      required: [true, 'Bid amount is required'],
      min: [0.10, 'Bid amount must be at least $0.10'],
      max: [50, 'Bid amount cannot exceed $50'],
    },
    dailyBudget: {
      type: Number,
      required: [true, 'Daily budget is required'],
      min: [10, 'Daily budget must be at least $10'],
      max: [10000, 'Daily budget cannot exceed $10,000'],
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
    landingPageScore: {
      type: Number,
      required: true,
      default: 75, // 75/100 default
      min: [0, 'Landing page score cannot be negative'],
      max: [100, 'Landing page score cannot exceed 100'],
    },
  },
  {
    timestamps: true,
    collection: 'adcampaigns',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
AdCampaignSchema.index({ marketplace: 1, status: 1 }); // Active campaigns
AdCampaignSchema.index({ seller: 1, status: 1 }); // Seller's campaigns
AdCampaignSchema.index({ acos: 1 }); // ACOS tracking
AdCampaignSchema.index({ type: 1, status: 1 }); // Campaign type queries

/**
 * Virtual field: adRank
 * 
 * @description
 * Ad rank for auction positioning (Bid Amount * Quality Score)
 * Higher rank = better ad position
 * 
 * @returns {number} Ad rank score
 */
AdCampaignSchema.virtual('adRank').get(function (this: IAdCampaign): number {
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
AdCampaignSchema.virtual('effectiveCPC').get(function (this: IAdCampaign): number {
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
AdCampaignSchema.virtual('profitability').get(function (this: IAdCampaign): string {
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
AdCampaignSchema.virtual('budgetRemaining').get(function (this: IAdCampaign): number {
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
AdCampaignSchema.virtual('avgCostPerConversion').get(function (this: IAdCampaign): number {
  if (this.conversions === 0) return 0;
  return this.totalSpend / this.conversions;
});

/**
 * Pre-save hook: Calculate CTR, CVR, ACOS, ROAS, quality score
 */
AdCampaignSchema.pre<IAdCampaign>('save', function (next) {
  // Calculate CTR (clicks / impressions * 100)
  if (this.impressions > 0) {
    this.clickThroughRate = (this.clicks / this.impressions) * 100;
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

  // Calculate quality score (composite of relevance, landing page, and CTR)
  const relevanceWeight = 0.4;
  const landingPageWeight = 0.3;
  const ctrWeight = 0.3;
  const ctrScore = Math.min(100, this.clickThroughRate * 50); // CTR * 50 to scale to 0-100

  const compositeScore =
    this.relevanceScore * relevanceWeight + this.landingPageScore * landingPageWeight + ctrScore * ctrWeight;

  // Scale to 1-10
  this.qualityScore = Math.max(1, Math.min(10, Math.round(compositeScore / 10)));

  next();
});

/**
 * AdCampaign model
 * 
 * @example
 * ```typescript
 * import AdCampaign from '@/lib/db/models/AdCampaign';
 * 
 * // Create campaign
 * const campaign = await AdCampaign.create({
 *   marketplace: marketplaceId,
 *   seller: sellerId,
 *   name: "Summer Sale Campaign",
 *   type: "SponsoredProduct",
 *   biddingModel: "CPC",
 *   bidAmount: 1.50,
 *   dailyBudget: 200,
 *   totalBudget: 5000,
 *   targetedProducts: [productId1, productId2],
 *   targetedKeywords: ["wireless headphones", "bluetooth earbuds"],
 *   audienceType: "Targeted"
 * });
 * 
 * // Record ad performance
 * await campaign.updateOne({
 *   $inc: {
 *     impressions: 1000,
 *     clicks: 15, // 1.5% CTR
 *     conversions: 3, // 20% CVR (3/15)
 *     totalSpend: 22.50, // 15 clicks * $1.50
 *     totalRevenue: 450 // 3 conversions * $150 avg order value
 *   }
 * });
 * 
 * // Check profitability
 * console.log(campaign.acos); // 5% ACOS ($22.50 / $450)
 * console.log(campaign.roas); // 20x ROAS ($450 / $22.50)
 * console.log(campaign.profitability); // "Excellent"
 * console.log(campaign.adRank); // e.g., 7.5 (bid $1.50 * quality 5)
 * ```
 */
const AdCampaign: Model<IAdCampaign> =
  mongoose.models.AdCampaign || mongoose.model<IAdCampaign>('AdCampaign', AdCampaignSchema);

export default AdCampaign;
