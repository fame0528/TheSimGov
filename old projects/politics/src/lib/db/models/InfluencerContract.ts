/**
 * @file src/lib/db/models/InfluencerContract.ts
 * @description Influencer marketing contract model for Media companies
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * InfluencerContract model representing deals between Media companies and influencers for
 * sponsored content, brand ambassadorship, or affiliate marketing. Tracks influencer metrics
 * (followers, engagement rate), deal terms (compensation, deliverables, duration), performance
 * tracking (content delivered, engagement achieved), and ROI calculations. Enables Media
 * companies to leverage influencer audiences for brand awareness and revenue generation.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Media company hiring influencer
 * - influencer: Reference to Influencer profile (could be User or NPC)
 * - dealType: Type of deal (Sponsored, Ambassador, Affiliate, PerformanceBased)
 * - status: Deal status (Pending, Active, Completed, Cancelled)
 * - startDate: Contract start date
 * - endDate: Contract end date
 * - autoRenew: Auto-renewal on expiration
 * 
 * Compensation:
 * - compensation: Total deal value ($)
 * - paymentStructure: Payment type (Flat, PerPost, PerformanceBased, Hybrid)
 * - basePayment: Guaranteed base payment
 * - bonusThresholds: Performance bonus triggers
 * - paymentSchedule: Payment timing (Upfront, Monthly, OnDelivery, OnCompletion)
 * - paidToDate: Amount paid so far
 * 
 * Deliverables:
 * - requiredContent: Number of content pieces required
 * - contentTypes: Required content types (Article, Video, SocialPost, etc.)
 * - deliveredContent: Array of delivered MediaContent IDs
 * - deliveryDeadlines: Deadline per deliverable
 * - exclusivityClause: Prevents competing brand deals
 * 
 * Influencer Metrics (at signing):
 * - influencerFollowers: Follower count when deal signed
 * - influencerEngagementRate: Engagement rate at signing (%)
 * - influencerNiche: Content niche (Tech, Fashion, Gaming, etc.)
 * - influencerReach: Estimated reach per post
 * - influencerDemographics: Audience demographics snapshot
 * 
 * Performance Tracking:
 * - totalImpressions: Cumulative impressions from delivered content
 * - totalEngagement: Cumulative engagement (likes + shares + comments)
 * - totalConversions: Conversions tracked (clicks, signups, sales)
 * - conversionRate: % of viewers who converted
 * - actualROI: Actual return on investment (%)
 * - projectedROI: Expected ROI at signing (%)
 * 
 * Terms & Conditions:
 * - exclusivityPeriod: Months competitor ban applies
 * - contentApprovalRequired: Company approves before posting
 * - usageRights: Content usage rights (Limited, Perpetual, Exclusive)
 * - terminationClause: Early termination conditions
 * - penaltyForNonDelivery: Penalty if deliverables not met
 * 
 * USAGE:
 * ```typescript
 * import InfluencerContract from '@/lib/db/models/InfluencerContract';
 * 
 * // Create influencer deal
 * const deal = await InfluencerContract.create({
 *   company: companyId,
 *   influencer: influencerId,
 *   dealType: 'Sponsored',
 *   compensation: 50000,
 *   requiredContent: 10,
 *   influencerFollowers: 500000,
 *   influencerEngagementRate: 3.5
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Compensation calculation: Base + (Performance bonuses if thresholds met)
 * - ROI formula: ((Revenue generated - Compensation) / Compensation) × 100
 * - Engagement rate benchmark: 2-3% good, 4-6% excellent, >8% influencer tier
 * - Pricing formula: (Followers × Engagement rate × Content count × $0.01-$0.10)
 * - Exclusivity premium: +20-50% compensation for competitor ban
 * - Performance-based: Pay per conversion (CPA model), typically 10-30% of sale
 * - Ambassador deals: Long-term (6-12 months), recurring content, brand loyalty
 * - Affiliate deals: Commission-based (5-20% per sale), no upfront cost
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Deal type enum
 */
export type DealType = 'Sponsored' | 'Ambassador' | 'Affiliate' | 'PerformanceBased';

/**
 * Contract status enum
 */
export type ContractStatus = 'Pending' | 'Active' | 'Completed' | 'Cancelled';

/**
 * Payment structure enum
 */
export type PaymentStructure = 'Flat' | 'PerPost' | 'PerformanceBased' | 'Hybrid';

/**
 * Payment schedule enum
 */
export type PaymentSchedule = 'Upfront' | 'Monthly' | 'OnDelivery' | 'OnCompletion';

/**
 * Usage rights enum
 */
export type UsageRights = 'Limited' | 'Perpetual' | 'Exclusive';

/**
 * Content niche enum
 */
export type ContentNiche =
  | 'Tech'
  | 'Fashion'
  | 'Gaming'
  | 'Beauty'
  | 'Fitness'
  | 'Food'
  | 'Travel'
  | 'Finance'
  | 'Education'
  | 'Entertainment';

/**
 * Bonus threshold interface
 */
interface BonusThreshold {
  metric: 'impressions' | 'engagement' | 'conversions';
  threshold: number;
  bonus: number;
}

/**
 * InfluencerContract document interface
 */
export interface IInfluencerContract extends Document {
  // Core
  company: Types.ObjectId;
  influencer: Types.ObjectId;
  dealType: DealType;
  status: ContractStatus;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;

  // Compensation
  compensation: number;
  paymentStructure: PaymentStructure;
  basePayment: number;
  bonusThresholds: BonusThreshold[];
  paymentSchedule: PaymentSchedule;
  paidToDate: number;

  // Deliverables
  requiredContent: number;
  contentTypes: string[];
  deliveredContent: Types.ObjectId[];
  deliveryDeadlines: Date[];
  exclusivityClause: boolean;

  // Influencer Metrics (at signing)
  influencerFollowers: number;
  influencerEngagementRate: number;
  influencerNiche: ContentNiche;
  influencerReach: number;
  influencerDemographics: any;

  // Performance Tracking
  totalImpressions: number;
  totalEngagement: number;
  totalConversions: number;
  conversionRate: number;
  actualROI: number;
  projectedROI: number;

  // Terms & Conditions
  exclusivityPeriod: number;
  contentApprovalRequired: boolean;
  usageRights: UsageRights;
  terminationClause: string;
  penaltyForNonDelivery: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  isActive: boolean;
  deliveryProgress: number;
  averageEngagementRate: number;
  costPerImpression: number;
  costPerEngagement: number;
}

/**
 * InfluencerContract schema definition
 */
const InfluencerContractSchema = new Schema<IInfluencerContract>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    influencer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Influencer reference is required'],
      index: true,
    },
    dealType: {
      type: String,
      required: true,
      enum: {
        values: ['Sponsored', 'Ambassador', 'Affiliate', 'PerformanceBased'],
        message: '{VALUE} is not a valid deal type',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Pending', 'Active', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid contract status',
      },
      default: 'Pending',
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    autoRenew: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Compensation
    compensation: {
      type: Number,
      required: [true, 'Compensation amount is required'],
      min: [0, 'Compensation cannot be negative'],
    },
    paymentStructure: {
      type: String,
      required: true,
      enum: {
        values: ['Flat', 'PerPost', 'PerformanceBased', 'Hybrid'],
        message: '{VALUE} is not a valid payment structure',
      },
      default: 'Flat',
    },
    basePayment: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Base payment cannot be negative'],
    },
    bonusThresholds: [
      {
        metric: {
          type: String,
          enum: ['impressions', 'engagement', 'conversions'],
          required: true,
        },
        threshold: {
          type: Number,
          required: true,
          min: 0,
        },
        bonus: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    paymentSchedule: {
      type: String,
      required: true,
      enum: {
        values: ['Upfront', 'Monthly', 'OnDelivery', 'OnCompletion'],
        message: '{VALUE} is not a valid payment schedule',
      },
      default: 'OnCompletion',
    },
    paidToDate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },

    // Deliverables
    requiredContent: {
      type: Number,
      required: [true, 'Required content count is required'],
      min: [1, 'At least 1 content piece required'],
    },
    contentTypes: {
      type: [String],
      required: true,
      default: [],
    },
    deliveredContent: [
      {
        type: Schema.Types.ObjectId,
        ref: 'MediaContent',
      },
    ],
    deliveryDeadlines: [
      {
        type: Date,
      },
    ],
    exclusivityClause: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Influencer Metrics (at signing)
    influencerFollowers: {
      type: Number,
      required: [true, 'Influencer follower count is required'],
      min: [0, 'Followers cannot be negative'],
      index: true,
    },
    influencerEngagementRate: {
      type: Number,
      required: [true, 'Influencer engagement rate is required'],
      min: [0, 'Engagement rate cannot be negative'],
      max: [100, 'Engagement rate cannot exceed 100%'],
    },
    influencerNiche: {
      type: String,
      required: true,
      enum: {
        values: [
          'Tech',
          'Fashion',
          'Gaming',
          'Beauty',
          'Fitness',
          'Food',
          'Travel',
          'Finance',
          'Education',
          'Entertainment',
        ],
        message: '{VALUE} is not a valid content niche',
      },
    },
    influencerReach: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Reach cannot be negative'],
    },
    influencerDemographics: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // Performance Tracking
    totalImpressions: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Impressions cannot be negative'],
    },
    totalEngagement: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Engagement cannot be negative'],
    },
    totalConversions: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Conversions cannot be negative'],
    },
    conversionRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Conversion rate cannot be negative'],
      max: [100, 'Conversion rate cannot exceed 100%'],
    },
    actualROI: {
      type: Number,
      required: true,
      default: 0,
    },
    projectedROI: {
      type: Number,
      required: true,
      default: 0,
    },

    // Terms & Conditions
    exclusivityPeriod: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Exclusivity period cannot be negative'],
    },
    contentApprovalRequired: {
      type: Boolean,
      required: true,
      default: true,
    },
    usageRights: {
      type: String,
      required: true,
      enum: {
        values: ['Limited', 'Perpetual', 'Exclusive'],
        message: '{VALUE} is not a valid usage rights type',
      },
      default: 'Limited',
    },
    terminationClause: {
      type: String,
      trim: true,
      maxlength: [1000, 'Termination clause cannot exceed 1000 characters'],
    },
    penaltyForNonDelivery: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Penalty cannot be negative'],
    },
  },
  {
    timestamps: true,
    collection: 'influencercontracts',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
InfluencerContractSchema.index({ company: 1, status: 1 }); // Active contracts by company
InfluencerContractSchema.index({ influencer: 1, status: 1 }); // Influencer's active deals
InfluencerContractSchema.index({ dealType: 1, status: 1 }); // Deal type filtering
InfluencerContractSchema.index({ startDate: 1, endDate: 1 }); // Time-based queries

/**
 * Virtual field: isActive
 * 
 * @description
 * Check if contract is currently active (status Active + within date range)
 * 
 * @returns {boolean} Is contract active
 */
InfluencerContractSchema.virtual('isActive').get(function (this: IInfluencerContract): boolean {
  if (this.status !== 'Active') return false;
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
});

/**
 * Virtual field: deliveryProgress
 * 
 * @description
 * Percentage of required content delivered
 * 
 * @returns {number} Delivery progress (0-100)
 */
InfluencerContractSchema.virtual('deliveryProgress').get(function (
  this: IInfluencerContract
): number {
  if (this.requiredContent === 0) return 0;
  return Math.min((this.deliveredContent.length / this.requiredContent) * 100, 100);
});

/**
 * Virtual field: averageEngagementRate
 * 
 * @description
 * Average engagement rate across delivered content
 * 
 * @returns {number} Avg engagement rate (%)
 */
InfluencerContractSchema.virtual('averageEngagementRate').get(function (
  this: IInfluencerContract
): number {
  if (this.totalImpressions === 0) return 0;
  return Math.round((this.totalEngagement / this.totalImpressions) * 10000) / 100;
});

/**
 * Virtual field: costPerImpression
 * 
 * @description
 * Cost per thousand impressions (CPM)
 * 
 * @returns {number} CPM ($)
 */
InfluencerContractSchema.virtual('costPerImpression').get(function (
  this: IInfluencerContract
): number {
  if (this.totalImpressions === 0) return 0;
  return Math.round((this.compensation / (this.totalImpressions / 1000)) * 100) / 100;
});

/**
 * Virtual field: costPerEngagement
 * 
 * @description
 * Cost per engagement action
 * 
 * @returns {number} CPE ($)
 */
InfluencerContractSchema.virtual('costPerEngagement').get(function (
  this: IInfluencerContract
): number {
  if (this.totalEngagement === 0) return 0;
  return Math.round((this.compensation / this.totalEngagement) * 100) / 100;
});

/**
 * Pre-save hook: Calculate derived metrics
 */
InfluencerContractSchema.pre<IInfluencerContract>('save', function (next) {
  // Calculate influencer reach (followers × engagement rate)
  this.influencerReach = Math.round(this.influencerFollowers * (this.influencerEngagementRate / 100));

  // Calculate conversion rate
  if (this.totalImpressions > 0) {
    this.conversionRate = Math.round((this.totalConversions / this.totalImpressions) * 10000) / 100;
  }

  // Auto-activate if status is Pending and within date range
  const now = new Date();
  if (this.status === 'Pending' && now >= this.startDate && now <= this.endDate) {
    this.status = 'Active';
  }

  // Auto-complete if all content delivered and past end date
  if (
    this.status === 'Active' &&
    this.deliveredContent.length >= this.requiredContent &&
    now > this.endDate
  ) {
    this.status = 'Completed';
  }

  next();
});

/**
 * InfluencerContract model
 * 
 * @example
 * ```typescript
 * import InfluencerContract from '@/lib/db/models/InfluencerContract';
 * 
 * // Create sponsored content deal
 * const deal = await InfluencerContract.create({
 *   company: companyId,
 *   influencer: influencerId,
 *   dealType: 'Sponsored',
 *   compensation: 50000,
 *   paymentStructure: 'Flat',
 *   basePayment: 50000,
 *   requiredContent: 10,
 *   contentTypes: ['Video', 'SocialPost'],
 *   influencerFollowers: 500000,
 *   influencerEngagementRate: 3.5,
 *   influencerNiche: 'Tech',
 *   startDate: new Date(),
 *   endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
 *   exclusivityClause: true,
 *   exclusivityPeriod: 6
 * });
 * 
 * // Track performance
 * await deal.updateOne({
 *   $inc: {
 *     totalImpressions: 100000,
 *     totalEngagement: 3500,
 *     totalConversions: 250
 *   },
 *   $push: {
 *     deliveredContent: contentId
 *   }
 * });
 * 
 * // Check progress
 * console.log(deal.deliveryProgress); // % delivered
 * console.log(deal.averageEngagementRate); // Engagement %
 * console.log(deal.costPerImpression); // CPM
 * ```
 */
const InfluencerContract: Model<IInfluencerContract> =
  mongoose.models.InfluencerContract ||
  mongoose.model<IInfluencerContract>('InfluencerContract', InfluencerContractSchema);

export default InfluencerContract;
