/**
 * @file src/lib/db/models/SEOCampaign.ts
 * @description SEOCampaign Mongoose schema for search/advertising campaign management
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * SEOCampaign model for e-commerce marketing campaign management with keyword bidding,
 * performance tracking, and ROI analytics. Supports both SEO (organic search optimization)
 * and PPC (pay-per-click advertising) campaigns with impression/click/conversion tracking.
 * Integrates with ProductListing for targeted product promotion and Transaction for
 * ad spend financial tracking.
 * 
 * SCHEMA FIELDS:
 * - name: Campaign name (required, 3-100 chars)
 * - company: Reference to Company document (required, indexed)
 * - type: Campaign type (SEO, PPC, Both)
 * - targetProducts: Array of ProductListing references (optional)
 * - keywords: Target keywords array with bids (required)
 * - budget: Total campaign budget in dollars (required, min $10)
 * - dailyBudget: Daily spending limit (optional, defaults to budget/30)
 * - spent: Amount spent so far (default 0)
 * - costPerClick: Average CPC in dollars (required, default $0.50)
 * - impressions: Total ad impressions (default 0)
 * - clicks: Total ad clicks (default 0)
 * - conversions: Total sales from campaign (default 0)
 * - revenue: Total revenue generated (default 0)
 * - status: Campaign state (Draft, Active, Paused, Completed, Cancelled)
 * - startDate: Campaign start date (required)
 * - endDate: Campaign end date (optional)
 * - seoMetrics: SEO performance metrics (rankings, backlinks, etc.)
 * - ppcMetrics: PPC performance metrics (quality score, bid position)
 * - createdAt: Campaign creation timestamp
 * - updatedAt: Last update timestamp
 * 
 * VIRTUAL FIELDS:
 * - ctr: Click-through rate (clicks / impressions * 100)
 * - conversionRate: Conversion rate (conversions / clicks * 100)
 * - roi: Return on investment ((revenue - spent) / spent * 100)
 * - avgOrderValue: Average order value (revenue / conversions)
 * - isActive: Boolean indicating if status === 'Active'
 * - budgetRemaining: Remaining budget (budget - spent)
 * - daysRunning: Days since campaign start
 * 
 * USAGE:
 * ```typescript
 * import SEOCampaign from '@/lib/db/models/SEOCampaign';
 * 
 * // Create PPC campaign
 * const campaign = await SEOCampaign.create({
 *   name: 'Premium Laptop Bags - Black Friday Sale',
 *   company: companyId,
 *   type: 'PPC',
 *   targetProducts: [productId1, productId2],
 *   keywords: [
 *     { keyword: 'laptop bag', bid: 1.25, priority: 'High' },
 *     { keyword: 'business bag', bid: 0.85, priority: 'Medium' },
 *     { keyword: 'leather laptop case', bid: 1.50, priority: 'High' }
 *   ],
 *   budget: 500,
 *   dailyBudget: 50,
 *   costPerClick: 0.75,
 *   startDate: new Date('2025-11-20'),
 *   endDate: new Date('2025-11-30')
 * });
 * 
 * // Record campaign activity
 * await campaign.updateOne({
 *   $inc: {
 *     impressions: 1000,
 *     clicks: 45,
 *     conversions: 3,
 *     spent: 33.75, // 45 clicks * $0.75 CPC
 *     revenue: 269.97 // 3 sales * $89.99
 *   }
 * });
 * 
 * // Check performance
 * console.log(`CTR: ${campaign.ctr}%`);
 * console.log(`ROI: ${campaign.roi}%`);
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Keywords array enables multi-keyword targeting with individual bids
 * - Type field supports pure SEO, pure PPC, or hybrid campaigns
 * - Status workflow: Draft → Active → Paused/Completed/Cancelled
 * - Virtual ROI calculation tracks campaign profitability
 * - Daily budget prevents overspending via pre-save validation
 * - Company reference indexed for campaign dashboard queries
 * - Status and type indexed for filtering active campaigns
 * - Target products optional (campaign-wide vs product-specific)
 * - SEO metrics track organic performance (rankings, backlinks)
 * - PPC metrics track paid performance (quality score, position)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Campaign types
 */
export type CampaignType = 'SEO' | 'PPC' | 'Both';

/**
 * Campaign status states
 */
export type CampaignStatus = 'Draft' | 'Active' | 'Paused' | 'Completed' | 'Cancelled';

/**
 * Keyword priority levels
 */
export type KeywordPriority = 'High' | 'Medium' | 'Low';

/**
 * Keyword bid interface
 */
export interface KeywordBid {
  keyword: string; // Target keyword phrase
  bid: number; // Bid amount per click ($)
  priority: KeywordPriority; // Keyword importance
  impressions?: number; // Impressions for this keyword
  clicks?: number; // Clicks for this keyword
}

/**
 * SEO metrics interface
 */
export interface SEOMetrics {
  averageRanking?: number; // Avg search position (1-100)
  backlinks?: number; // Number of backlinks acquired
  organicTraffic?: number; // Organic visits from search
  domainAuthority?: number; // Domain authority score (0-100)
}

/**
 * PPC metrics interface
 */
export interface PPCMetrics {
  qualityScore?: number; // Ad quality score (1-10)
  averagePosition?: number; // Avg ad position (1-10)
  adImpressions?: number; // Paid ad impressions
  adClicks?: number; // Paid ad clicks
}

/**
 * SEOCampaign document interface
 */
export interface ISEOCampaign extends Document {
  name: string;
  company: Types.ObjectId;
  type: CampaignType;
  targetProducts: Types.ObjectId[];
  keywords: KeywordBid[];
  budget: number;
  dailyBudget: number;
  spent: number;
  costPerClick: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  status: CampaignStatus;
  startDate: Date;
  endDate?: Date;
  seoMetrics?: SEOMetrics;
  ppcMetrics?: PPCMetrics;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  ctr: number;
  conversionRate: number;
  roi: number;
  avgOrderValue: number;
  isActive: boolean;
  budgetRemaining: number;
  daysRunning: number;
}

/**
 * SEOCampaign schema definition
 */
const SEOCampaignSchema = new Schema<ISEOCampaign>(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      minlength: [3, 'Campaign name must be at least 3 characters'],
      maxlength: [100, 'Campaign name cannot exceed 100 characters'],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Campaign type is required'],
      enum: {
        values: ['SEO', 'PPC', 'Both'],
        message: '{VALUE} is not a valid campaign type',
      },
      index: true,
    },
    targetProducts: {
      type: [Schema.Types.ObjectId],
      ref: 'ProductListing',
      default: [],
    },
    keywords: {
      type: [
        {
          keyword: {
            type: String,
            required: true,
            trim: true,
          },
          bid: {
            type: Number,
            required: true,
            min: [0.01, 'Keyword bid must be at least $0.01'],
          },
          priority: {
            type: String,
            required: true,
            enum: ['High', 'Medium', 'Low'],
            default: 'Medium',
          },
          impressions: {
            type: Number,
            default: 0,
            min: [0, 'Impressions cannot be negative'],
          },
          clicks: {
            type: Number,
            default: 0,
            min: [0, 'Clicks cannot be negative'],
          },
        },
      ],
      required: true,
      validate: {
        validator: (arr: KeywordBid[]) => arr.length > 0,
        message: 'Campaign must have at least one keyword',
      },
    },
    budget: {
      type: Number,
      required: [true, 'Campaign budget is required'],
      min: [10, 'Campaign budget must be at least $10'],
    },
    dailyBudget: {
      type: Number,
      min: [1, 'Daily budget must be at least $1'],
    },
    spent: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Spent amount cannot be negative'],
    },
    costPerClick: {
      type: Number,
      required: true,
      default: 0.5,
      min: [0.01, 'Cost per click must be at least $0.01'],
    },
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
    revenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Revenue cannot be negative'],
    },
    status: {
      type: String,
      required: true,
      default: 'Draft',
      enum: {
        values: ['Draft', 'Active', 'Paused', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid campaign status',
      },
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Campaign start date is required'],
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (this: ISEOCampaign, value: Date) {
          return !value || value > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    seoMetrics: {
      averageRanking: {
        type: Number,
        min: [1, 'Average ranking must be at least 1'],
        max: [100, 'Average ranking cannot exceed 100'],
      },
      backlinks: {
        type: Number,
        min: [0, 'Backlinks cannot be negative'],
      },
      organicTraffic: {
        type: Number,
        min: [0, 'Organic traffic cannot be negative'],
      },
      domainAuthority: {
        type: Number,
        min: [0, 'Domain authority cannot be below 0'],
        max: [100, 'Domain authority cannot exceed 100'],
      },
    },
    ppcMetrics: {
      qualityScore: {
        type: Number,
        min: [1, 'Quality score must be at least 1'],
        max: [10, 'Quality score cannot exceed 10'],
      },
      averagePosition: {
        type: Number,
        min: [1, 'Average position must be at least 1'],
        max: [10, 'Average position cannot exceed 10'],
      },
      adImpressions: {
        type: Number,
        min: [0, 'Ad impressions cannot be negative'],
      },
      adClicks: {
        type: Number,
        min: [0, 'Ad clicks cannot be negative'],
      },
    },
  },
  {
    timestamps: true,
    collection: 'seoCampaigns',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Compound indexes for efficient queries
 */
SEOCampaignSchema.index({ company: 1, status: 1 }); // Filter by status
SEOCampaignSchema.index({ company: 1, type: 1 }); // Filter by type
SEOCampaignSchema.index({ company: 1, startDate: -1 }); // Recent campaigns
SEOCampaignSchema.index({ roi: -1 }); // Best performing campaigns (virtual index computed)

/**
 * Virtual: ctr (Click-Through Rate)
 * Calculates clicks / impressions * 100
 */
SEOCampaignSchema.virtual('ctr').get(function (this: ISEOCampaign): number {
  if (this.impressions === 0) return 0;
  return (this.clicks / this.impressions) * 100;
});

/**
 * Virtual: conversionRate
 * Calculates conversions / clicks * 100
 */
SEOCampaignSchema.virtual('conversionRate').get(function (this: ISEOCampaign): number {
  if (this.clicks === 0) return 0;
  return (this.conversions / this.clicks) * 100;
});

/**
 * Virtual: roi (Return on Investment)
 * Calculates (revenue - spent) / spent * 100
 */
SEOCampaignSchema.virtual('roi').get(function (this: ISEOCampaign): number {
  if (this.spent === 0) return 0;
  return ((this.revenue - this.spent) / this.spent) * 100;
});

/**
 * Virtual: avgOrderValue
 * Calculates revenue / conversions
 */
SEOCampaignSchema.virtual('avgOrderValue').get(function (this: ISEOCampaign): number {
  if (this.conversions === 0) return 0;
  return this.revenue / this.conversions;
});

/**
 * Virtual: isActive
 * Indicates if campaign is currently active
 */
SEOCampaignSchema.virtual('isActive').get(function (this: ISEOCampaign): boolean {
  return this.status === 'Active';
});

/**
 * Virtual: budgetRemaining
 * Calculates remaining budget
 */
SEOCampaignSchema.virtual('budgetRemaining').get(function (this: ISEOCampaign): number {
  return Math.max(0, this.budget - this.spent);
});

/**
 * Virtual: daysRunning
 * Calculates days since campaign start
 */
SEOCampaignSchema.virtual('daysRunning').get(function (this: ISEOCampaign): number {
  const now = new Date();
  const start = this.startDate;
  const diffMs = now.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
});

/**
 * Pre-save hook: Set default daily budget
 */
SEOCampaignSchema.pre('save', function (next) {
  if (!this.dailyBudget) {
    this.dailyBudget = Math.ceil(this.budget / 30); // Default to 30-day campaign
  }
  next();
});

/**
 * Pre-save hook: Validate budget constraints
 */
SEOCampaignSchema.pre('save', function (next) {
  if (this.spent > this.budget) {
    next(new Error('Spent amount cannot exceed budget'));
    return;
  }
  if (this.dailyBudget && this.dailyBudget > this.budget) {
    next(new Error('Daily budget cannot exceed total budget'));
    return;
  }
  next();
});

/**
 * Pre-save hook: Auto-complete campaign when budget exhausted
 */
SEOCampaignSchema.pre('save', function (next) {
  if (this.spent >= this.budget && this.status === 'Active') {
    this.status = 'Completed';
  }
  next();
});

/**
 * SEOCampaign model
 */
const SEOCampaign: Model<ISEOCampaign> =
  mongoose.models.SEOCampaign ||
  mongoose.model<ISEOCampaign>('SEOCampaign', SEOCampaignSchema);

export default SEOCampaign;
