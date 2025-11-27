/**
 * @file src/lib/db/models/MarketingCampaign.ts
 * @description MarketingCampaign Mongoose schema for company marketing initiatives
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * MarketingCampaign model representing marketing initiatives run by company marketing departments.
 * Supports 6 campaign types (Brand Awareness, Lead Generation, Product Launch, Customer Retention,
 * Market Expansion, Social Media) with dynamic budget allocation, reach tracking, and ROI calculation.
 * Campaigns progress through lifecycle stages (Planning → Active → Completed) with performance metrics
 * driving reputation, market share, and customer acquisition.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
 * - department: Reference to Marketing Department (required, indexed)
 * - name: Campaign name (e.g., "Summer 2025 Product Launch")
 * - campaignType: Type of campaign (6 types)
 * - status: Campaign lifecycle state (Planning, Active, Paused, Completed, Cancelled)
 * - budget: Total campaign budget ($1,000-$5,000,000)
 * - spent: Amount spent so far
 * - startDate: Campaign start date
 * - endDate: Campaign end date
 * - duration: Campaign length in days
 * 
 * Targeting:
 * - targetAudience: Demographic description ("Ages 25-45, Urban, Tech-savvy")
 * - targetMarket: Geographic market (Local, Regional, National, International)
 * - targetDemographic: Age/gender/income targeting
 * - targetIndustry: Industry vertical targeting
 * 
 * Channels:
 * - channels: Array of marketing channels (Social, Search, Display, Email, TV, Radio, Print, Outdoor)
 * - channelBudgets: Budget allocation per channel (Map<channel, amount>)
 * - primaryChannel: Main channel for campaign
 * 
 * Performance:
 * - reach: Total people reached
 * - impressions: Total ad impressions
 * - clicks: Total clicks/interactions
 * - conversions: Total conversions/sales
 * - leads: Total leads generated
 * - customers: New customers acquired
 * - revenue: Revenue attributed to campaign
 * - roi: Return on investment percentage
 * - ctr: Click-through rate percentage
 * - conversionRate: Conversion rate percentage
 * - costPerClick: Average cost per click (CPC)
 * - costPerAcquisition: Customer acquisition cost (CAC)
 * - engagementRate: Engagement percentage
 * 
 * Impact:
 * - brandLift: Brand awareness increase (0-100 points)
 * - reputationImpact: Company reputation change (-10 to +20 points)
 * - marketShareGain: Market share increase (0-5%)
 * - customerRetention: Retention rate impact (0-15%)
 * - lifetimeValue: Customer LTV increase
 * 
 * Content:
 * - creative: Description of ad creative/messaging
 * - callToAction: Primary CTA ("Buy Now", "Learn More", "Sign Up")
 * - landingPage: URL of campaign landing page
 * - trackingPixel: Analytics tracking code
 * 
 * Timeline:
 * - plannedAt: Date campaign was planned
 * - launchedAt: Date campaign went live
 * - completedAt: Date campaign ended
 * - pausedAt: Date campaign was paused (if applicable)
 * 
 * Team:
 * - manager: Employee managing campaign (Marketing Dept head or specialist)
 * - teamSize: Number of employees working on campaign
 * 
 * USAGE:
 * ```typescript
 * import MarketingCampaign from '@/lib/db/models/MarketingCampaign';
 * 
 * // Create campaign
 * const campaign = await MarketingCampaign.create({
 *   company: companyId,
 *   department: marketingDeptId,
 *   name: "Q4 2025 Holiday Promotion",
 *   campaignType: 'ProductLaunch',
 *   status: 'Planning',
 *   budget: 150000,
 *   spent: 0,
 *   startDate: new Date('2025-11-01'),
 *   endDate: new Date('2025-12-31'),
 *   duration: 61,
 *   channels: ['Social', 'Search', 'Email'],
 *   targetMarket: 'National',
 *   targetAudience: 'Ages 30-55, Holiday Shoppers'
 * });
 * 
 * // Launch campaign
 * await campaign.updateOne({
 *   status: 'Active',
 *   launchedAt: new Date()
 * });
 * 
 * // Update performance metrics
 * await campaign.updateOne({
 *   $inc: {
 *     reach: 25000,
 *     impressions: 150000,
 *     clicks: 4500,
 *     conversions: 180,
 *     spent: 12000
 *   }
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - ROI calculated as: ((revenue - spent) / spent) * 100
 * - CTR calculated as: (clicks / impressions) * 100
 * - Conversion rate: (conversions / clicks) * 100
 * - CAC calculated as: spent / customers
 * - Campaign types determine base success probability and expected ROI ranges
 * - Brand Awareness: High reach, low conversions, reputation+, long-term value
 * - Lead Generation: Medium reach, high leads, direct ROI, short-term sales
 * - Product Launch: High spend, high risk, can gain major market share
 * - Customer Retention: Low CAC (existing customers), high LTV, steady ROI
 * - Market Expansion: Geographic/demographic growth, medium ROI, long-term
 * - Social Media: Viral potential, low cost, engagement-focused, brand building
 * - Budget allocation across channels: Social (20-40%), Search (15-30%), TV (10-25%), etc.
 * - Campaign success tied to: Marketing dept efficiency, brand reputation, budget adequacy
 * - Pausing campaign saves remaining budget but loses momentum (engagement drops 20%)
 * - Cancelled campaigns lose 50% of spent budget (non-refundable ad buys)
 * - Performance data updates daily during active campaign
 * - Completed campaigns contribute to historical ROI average for future planning
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Campaign types
 */
export type CampaignType =
  | 'BrandAwareness'       // Build brand recognition
  | 'LeadGeneration'       // Generate sales leads
  | 'ProductLaunch'        // Launch new product
  | 'CustomerRetention'    // Retain existing customers
  | 'MarketExpansion'      // Enter new markets
  | 'SocialMedia';         // Social media focused

/**
 * Campaign status
 */
export type CampaignStatus =
  | 'Planning'             // Being planned
  | 'Active'               // Currently running
  | 'Paused'               // Temporarily paused
  | 'Completed'            // Successfully completed
  | 'Cancelled';           // Cancelled before completion

/**
 * Marketing channels
 */
export type MarketingChannel =
  | 'Social'               // Social media
  | 'Search'               // Search engine marketing
  | 'Display'              // Display ads
  | 'Email'                // Email marketing
  | 'TV'                   // Television ads
  | 'Radio'                // Radio ads
  | 'Print'                // Print media
  | 'Outdoor';             // Billboards/outdoor

/**
 * Target markets
 */
export type TargetMarket =
  | 'Local'                // City/metro area
  | 'Regional'             // Multi-state region
  | 'National'             // Entire country
  | 'International';       // Global markets

/**
 * MarketingCampaign document interface
 * 
 * @interface IMarketingCampaign
 * @extends {Document}
 */
export interface IMarketingCampaign extends Document {
  // Core
  company: Types.ObjectId;
  department: Types.ObjectId;
  name: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  budget: number;
  spent: number;
  startDate: Date;
  endDate: Date;
  duration: number;

  // Targeting
  targetAudience: string;
  targetMarket: TargetMarket;
  targetDemographic?: string;
  targetIndustry?: string;

  // Channels
  channels: MarketingChannel[];
  channelBudgets: Map<MarketingChannel, number>;
  primaryChannel: MarketingChannel;

  // Performance
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  leads: number;
  customers: number;
  revenue: number;
  roi: number;
  ctr: number;
  conversionRate: number;
  costPerClick: number;
  costPerAcquisition: number;
  engagementRate: number;

  // Impact
  brandLift: number;
  reputationImpact: number;
  marketShareGain: number;
  customerRetention: number;
  lifetimeValue: number;

  // Content
  creative?: string;
  callToAction: string;
  landingPage?: string;
  trackingPixel?: string;

  // Timeline
  plannedAt: Date;
  launchedAt?: Date;
  completedAt?: Date;
  pausedAt?: Date;

  // Team
  manager?: Types.ObjectId;
  teamSize: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  daysRemaining: number;
  percentComplete: number;
  isActive: boolean;
  budgetRemaining: number;
  performanceScore: number;
}

/**
 * MarketingCampaign schema definition
 */
const MarketingCampaignSchema = new Schema<IMarketingCampaign>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      minlength: [3, 'Campaign name must be at least 3 characters'],
      maxlength: [100, 'Campaign name cannot exceed 100 characters'],
    },
    campaignType: {
      type: String,
      required: [true, 'Campaign type is required'],
      enum: {
        values: ['BrandAwareness', 'LeadGeneration', 'ProductLaunch', 'CustomerRetention', 'MarketExpansion', 'SocialMedia'],
        message: '{VALUE} is not a valid campaign type',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Planning', 'Active', 'Paused', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid campaign status',
      },
      default: 'Planning',
      index: true,
    },
    budget: {
      type: Number,
      required: [true, 'Campaign budget is required'],
      min: [1000, 'Minimum campaign budget is $1,000'],
      max: [5000000, 'Maximum campaign budget is $5,000,000'],
    },
    spent: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Spent amount cannot be negative'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
    },
    duration: {
      type: Number,
      required: [true, 'Campaign duration is required'],
      min: [1, 'Campaign must be at least 1 day'],
      max: [365, 'Campaign cannot exceed 365 days'],
    },

    // Targeting
    targetAudience: {
      type: String,
      required: [true, 'Target audience is required'],
      trim: true,
      maxlength: [200, 'Target audience description cannot exceed 200 characters'],
    },
    targetMarket: {
      type: String,
      required: [true, 'Target market is required'],
      enum: {
        values: ['Local', 'Regional', 'National', 'International'],
        message: '{VALUE} is not a valid target market',
      },
      default: 'Local',
    },
    targetDemographic: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'Target demographic cannot exceed 200 characters'],
    },
    targetIndustry: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, 'Target industry cannot exceed 100 characters'],
    },

    // Channels
    channels: {
      type: [String],
      required: [true, 'At least one marketing channel is required'],
      validate: {
        validator: function (arr: string[]) {
          return arr.length > 0 && arr.length <= 5;
        },
        message: 'Must have 1-5 marketing channels',
      },
      enum: {
        values: ['Social', 'Search', 'Display', 'Email', 'TV', 'Radio', 'Print', 'Outdoor'],
        message: '{VALUE} is not a valid marketing channel',
      },
    },
    channelBudgets: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    primaryChannel: {
      type: String,
      required: [true, 'Primary channel is required'],
      enum: {
        values: ['Social', 'Search', 'Display', 'Email', 'TV', 'Radio', 'Print', 'Outdoor'],
        message: '{VALUE} is not a valid marketing channel',
      },
    },

    // Performance
    reach: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Reach cannot be negative'],
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
    leads: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Leads cannot be negative'],
    },
    customers: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Customers cannot be negative'],
    },
    revenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Revenue cannot be negative'],
    },
    roi: {
      type: Number,
      required: true,
      default: 0,
      min: [-100, 'ROI cannot be below -100%'],
      max: [1000, 'ROI cannot exceed 1000%'],
    },
    ctr: {
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
    costPerClick: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Cost per click cannot be negative'],
    },
    costPerAcquisition: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Cost per acquisition cannot be negative'],
    },
    engagementRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Engagement rate cannot be negative'],
      max: [100, 'Engagement rate cannot exceed 100%'],
    },

    // Impact
    brandLift: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Brand lift cannot be negative'],
      max: [100, 'Brand lift cannot exceed 100 points'],
    },
    reputationImpact: {
      type: Number,
      required: true,
      default: 0,
      min: [-10, 'Reputation impact cannot be below -10'],
      max: [20, 'Reputation impact cannot exceed +20'],
    },
    marketShareGain: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Market share gain cannot be negative'],
      max: [5, 'Market share gain cannot exceed 5%'],
    },
    customerRetention: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Customer retention cannot be negative'],
      max: [15, 'Customer retention impact cannot exceed 15%'],
    },
    lifetimeValue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Lifetime value cannot be negative'],
    },

    // Content
    creative: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Creative description cannot exceed 1000 characters'],
    },
    callToAction: {
      type: String,
      required: [true, 'Call to action is required'],
      trim: true,
      maxlength: [100, 'Call to action cannot exceed 100 characters'],
    },
    landingPage: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Landing page URL cannot exceed 500 characters'],
    },
    trackingPixel: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Tracking pixel code cannot exceed 500 characters'],
    },

    // Timeline
    plannedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },
    launchedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    pausedAt: {
      type: Date,
      default: null,
    },

    // Team
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },
    teamSize: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Team size must be at least 1'],
      max: [20, 'Team size cannot exceed 20'],
    },
  },
  {
    timestamps: true,
    collection: 'marketingcampaigns',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
MarketingCampaignSchema.index({ company: 1, status: 1 }); // Active campaigns per company
MarketingCampaignSchema.index({ department: 1, status: 1 }); // Campaigns per department
MarketingCampaignSchema.index({ company: 1, campaignType: 1 }); // Campaigns by type
MarketingCampaignSchema.index({ startDate: 1, endDate: 1 }); // Campaigns by date range

/**
 * Virtual field: daysRemaining
 */
MarketingCampaignSchema.virtual('daysRemaining').get(function (this: IMarketingCampaign): number {
  if (this.status === 'Completed' || this.status === 'Cancelled') return 0;
  const daysDiff = Math.floor((this.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysDiff);
});

/**
 * Virtual field: percentComplete
 */
MarketingCampaignSchema.virtual('percentComplete').get(function (this: IMarketingCampaign): number {
  const elapsed = Date.now() - this.startDate.getTime();
  const total = this.endDate.getTime() - this.startDate.getTime();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
});

/**
 * Virtual field: isActive
 */
MarketingCampaignSchema.virtual('isActive').get(function (this: IMarketingCampaign): boolean {
  return this.status === 'Active';
});

/**
 * Virtual field: budgetRemaining
 */
MarketingCampaignSchema.virtual('budgetRemaining').get(function (this: IMarketingCampaign): number {
  return Math.max(0, this.budget - this.spent);
});

/**
 * Virtual field: performanceScore
 * Score 0-100 based on ROI, conversion rate, and engagement
 */
MarketingCampaignSchema.virtual('performanceScore').get(function (this: IMarketingCampaign): number {
  const roiScore = Math.min(40, Math.max(0, this.roi / 2)); // ROI up to 80% = 40 points
  const conversionScore = Math.min(30, this.conversionRate * 6); // Conversion up to 5% = 30 points
  const engagementScore = Math.min(30, this.engagementRate * 3); // Engagement up to 10% = 30 points
  return Math.round(roiScore + conversionScore + engagementScore);
});

/**
 * Pre-save hook: Calculate performance metrics
 */
MarketingCampaignSchema.pre<IMarketingCampaign>('save', function (next) {
  // Calculate ROI
  if (this.spent > 0) {
    this.roi = ((this.revenue - this.spent) / this.spent) * 100;
  }

  // Calculate CTR
  if (this.impressions > 0) {
    this.ctr = (this.clicks / this.impressions) * 100;
  }

  // Calculate conversion rate
  if (this.clicks > 0) {
    this.conversionRate = (this.conversions / this.clicks) * 100;
  }

  // Calculate CPC
  if (this.clicks > 0) {
    this.costPerClick = this.spent / this.clicks;
  }

  // Calculate CAC
  if (this.customers > 0) {
    this.costPerAcquisition = this.spent / this.customers;
  }

  // Calculate engagement rate
  if (this.reach > 0) {
    this.engagementRate = ((this.clicks + this.conversions) / this.reach) * 100;
  }

  // Validate dates
  if (this.endDate <= this.startDate) {
    throw new Error('End date must be after start date');
  }

  // Calculate duration
  const durationMs = this.endDate.getTime() - this.startDate.getTime();
  this.duration = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

  next();
});

/**
 * MarketingCampaign model
 * 
 * @example
 * ```typescript
 * import MarketingCampaign from '@/lib/db/models/MarketingCampaign';
 * 
 * // Create campaign
 * const campaign = await MarketingCampaign.create({
 *   company: companyId,
 *   department: marketingDeptId,
 *   name: "Spring 2025 Brand Campaign",
 *   campaignType: 'BrandAwareness',
 *   budget: 200000,
 *   startDate: new Date('2025-03-01'),
 *   endDate: new Date('2025-05-31'),
 *   channels: ['Social', 'TV', 'Outdoor'],
 *   primaryChannel: 'TV',
 *   targetAudience: 'Ages 18-34, Urban Millennials',
 *   targetMarket: 'National',
 *   callToAction: 'Learn More at Website.com'
 * });
 * 
 * // Find active campaigns
 * const activeCampaigns = await MarketingCampaign.find({
 *   company: companyId,
 *   status: 'Active'
 * }).populate('department manager');
 * 
 * // Update performance
 * await campaign.updateOne({
 *   $inc: {
 *     impressions: 500000,
 *     reach: 350000,
 *     clicks: 15000,
 *     conversions: 450,
 *     customers: 180,
 *     revenue: 72000,
 *     spent: 50000
 *   }
 * });
 * ```
 */
const MarketingCampaign: Model<IMarketingCampaign> =
  mongoose.models.MarketingCampaign ||
  mongoose.model<IMarketingCampaign>('MarketingCampaign', MarketingCampaignSchema);

export default MarketingCampaign;
