/**
 * @fileoverview SEOCampaign Mongoose Schema - Marketing Campaign Management
 * @module lib/db/models/ecommerce/SEOCampaign
 * 
 * OVERVIEW:
 * Marketing campaign model for e-commerce with keyword bidding, performance
 * tracking, and ROI analytics. Supports both SEO (organic) and PPC (paid)
 * campaigns with impression/click/conversion tracking.
 * 
 * FEATURES:
 * - SEO and PPC campaign types
 * - Keyword targeting with individual bids
 * - Budget management (total and daily)
 * - Performance metrics (CTR, conversion rate, ROI)
 * - Campaign lifecycle management
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Campaign type options
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
  keyword: string;
  bid: number;
  priority: KeywordPriority;
  impressions?: number;
  clicks?: number;
}

/**
 * SEO metrics interface
 */
export interface SEOMetrics {
  averageRanking?: number;
  backlinks?: number;
  organicTraffic?: number;
  domainAuthority?: number;
}

/**
 * PPC metrics interface
 */
export interface PPCMetrics {
  qualityScore?: number;
  averagePosition?: number;
  adImpressions?: number;
  adClicks?: number;
}

/**
 * SEOCampaign document interface
 */
export interface ISEOCampaign extends Document {
  _id: Types.ObjectId;
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
  
  // Virtuals
  ctr: number;
  conversionRate: number;
  roi: number;
  avgOrderValue: number;
  isActive: boolean;
  budgetRemaining: number;
  daysRunning: number;
}

// ============================================================================
// Schema Definition
// ============================================================================

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
          keyword: { type: String, required: true, trim: true },
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
          impressions: { type: Number, default: 0, min: 0 },
          clicks: { type: Number, default: 0, min: 0 },
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
      averageRanking: { type: Number, min: 1, max: 100 },
      backlinks: { type: Number, min: 0 },
      organicTraffic: { type: Number, min: 0 },
      domainAuthority: { type: Number, min: 0, max: 100 },
    },
    ppcMetrics: {
      qualityScore: { type: Number, min: 1, max: 10 },
      averagePosition: { type: Number, min: 1, max: 10 },
      adImpressions: { type: Number, min: 0 },
      adClicks: { type: Number, min: 0 },
    },
  },
  {
    timestamps: true,
    collection: 'seoCampaigns',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// Indexes
// ============================================================================

SEOCampaignSchema.index({ company: 1, status: 1 });
SEOCampaignSchema.index({ company: 1, type: 1 });
SEOCampaignSchema.index({ company: 1, startDate: -1 });

// ============================================================================
// Virtual Fields
// ============================================================================

SEOCampaignSchema.virtual('ctr').get(function (this: ISEOCampaign): number {
  if (this.impressions === 0) return 0;
  return (this.clicks / this.impressions) * 100;
});

SEOCampaignSchema.virtual('conversionRate').get(function (this: ISEOCampaign): number {
  if (this.clicks === 0) return 0;
  return (this.conversions / this.clicks) * 100;
});

SEOCampaignSchema.virtual('roi').get(function (this: ISEOCampaign): number {
  if (this.spent === 0) return 0;
  return ((this.revenue - this.spent) / this.spent) * 100;
});

SEOCampaignSchema.virtual('avgOrderValue').get(function (this: ISEOCampaign): number {
  if (this.conversions === 0) return 0;
  return this.revenue / this.conversions;
});

SEOCampaignSchema.virtual('isActive').get(function (this: ISEOCampaign): boolean {
  return this.status === 'Active';
});

SEOCampaignSchema.virtual('budgetRemaining').get(function (this: ISEOCampaign): number {
  return Math.max(0, this.budget - this.spent);
});

SEOCampaignSchema.virtual('daysRunning').get(function (this: ISEOCampaign): number {
  const now = new Date();
  const start = this.startDate;
  const diffMs = now.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
});

// ============================================================================
// Pre-save Hooks
// ============================================================================

/**
 * Set default daily budget
 */
SEOCampaignSchema.pre('save', function (next) {
  if (!this.dailyBudget) {
    this.dailyBudget = Math.ceil(this.budget / 30);
  }
  next();
});

/**
 * Auto-complete campaign when budget exhausted
 */
SEOCampaignSchema.pre('save', function (next) {
  if (this.spent >= this.budget && this.status === 'Active') {
    this.status = 'Completed';
  }
  next();
});

// ============================================================================
// Model Export
// ============================================================================

const SEOCampaign: Model<ISEOCampaign> =
  mongoose.models.SEOCampaign ||
  mongoose.model<ISEOCampaign>('SEOCampaign', SEOCampaignSchema);

export default SEOCampaign;
