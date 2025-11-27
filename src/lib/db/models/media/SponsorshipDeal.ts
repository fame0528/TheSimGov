/**
 * @file src/lib/db/models/media/SponsorshipDeal.ts
 * @description Brand sponsorship deal model for Media companies
 * @created 2025-11-24
 *
 * OVERVIEW:
 * SponsorshipDeal model representing brand partnership agreements between sponsor companies
 * and Media content creators. Tracks deal structure (flat fee, revenue share, performance-based),
 * content deliverables with fulfillment tracking, exclusivity terms, performance metrics
 * (impressions, engagement, brand lift), and payment milestones. Enables Media companies
 * to monetize through brand partnerships while sponsors gain audience access and brand awareness.
 *
 * SCHEMA FIELDS:
 * Core:
 * - sponsor: Reference to Company providing sponsorship (any industry)
 * - recipient: Reference to Media Company receiving sponsorship
 * - dealValue: Total sponsorship value ($)
 * - dealStructure: Payment model (FlatFee, RevenueShare, PerformanceBased, Hybrid)
 * - duration: Deal duration (months)
 * - status: Deal status (Pending, Active, Completed, Cancelled, Disputed)
 * - startDate: Deal start date
 * - endDate: Deal end date
 *
 * Financial Terms:
 * - upfrontPayment: Initial payment amount
 * - monthlyPayment: Recurring monthly payment
 * - revenueSharePercent: % of content revenue shared with sponsor
 * - performanceBonuses: Array of bonus triggers
 * - totalPaid: Amount paid to date
 * - remainingPayments: Outstanding payment amount
 *
 * Content Requirements:
 * - requiredMentions: Minimum brand mentions required
 * - contentRequirements: Array of deliverable specs
 * - deliveredContent: Array of fulfilled content IDs
 * - approvalRequired: Sponsor must approve before publishing
 * - brandGuidelines: Brand messaging/style requirements
 *
 * Exclusivity Terms:
 * - exclusivityClause: Prevents competing brand deals
 * - competitorCategories: Industries/brands blocked during exclusivity
 * - exclusivityDuration: Months exclusivity applies (may extend past deal end)
 * - penaltyForViolation: Financial penalty if exclusivity violated
 *
 * Performance Metrics:
 * - totalImpressions: Cumulative impressions from sponsored content
 * - totalEngagement: Cumulative engagement (likes + shares + comments)
 * - brandMentions: Count of brand mentions delivered
 * - brandSentiment: Sentiment score (-100 to +100)
 * - brandLift: Brand awareness increase (%)
 * - estimatedReach: Projected audience reach
 * - actualReach: Actual unique viewers reached
 *
 * Fulfillment Tracking:
 * - milestonesAchieved: Number of milestones completed
 * - totalMilestones: Total number of milestones
 * - nextDeadline: Next deliverable deadline
 * - overdueDeliverables: Count of missed deadlines
 * - completionRate: % of deliverables fulfilled on time
 *
 * Legal & Terms:
 * - contractTerms: Legal terms and conditions
 * - terminationClause: Early termination conditions
 * - disputeResolution: Dispute resolution process
 * - intellectualProperty: IP ownership rights
 * - usageRights: Content usage rights for sponsor
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// Centralized Media domain types import (DRY + utility-first)
import type {
  SponsorshipContract as SponsorshipDomain,
  DealStructure,
  DealStatus,
  BonusThreshold
} from '../../../types/media';

// Extract domain shape excluding Mongoose-specific fields AND fields with schema-specific types
type SponsorshipBase = Omit<SponsorshipDomain, '_id' | 'sponsor' | 'recipient' | 'deliveredContent' | 'performanceBonuses' | 'contentRequirements' | 'createdAt' | 'updatedAt'>;

// Compose Mongoose document with domain base + ObjectId overrides + schema-specific fields
interface SponsorshipDealDocument extends Document, SponsorshipBase {
  _id: mongoose.Types.ObjectId;
  sponsor: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  deliveredContent: mongoose.Types.ObjectId[];
  
  // Schema-specific fields (not in domain)
  performanceBonuses: PerformanceBonus[];
  contentRequirements: ContentRequirement[];
  totalMilestones: number;
  milestonesAchieved: number;
  remainingPayments: number;
  completionRate: number;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Optional fields for API compatibility
  actualROI?: number;
  nextDeadline?: Date;
}

// Backward-compatible export alias
export type ISponsorshipDeal = SponsorshipDealDocument;

/**
 * Content requirement interface (local extension)
 */
interface ContentRequirement {
  type: 'Article' | 'Video' | 'Podcast' | 'Livestream' | 'SocialPost';
  quantity: number; // Changed from string to number for schema compatibility
  deadline: Date;
  specifications: string;
}

/**
 * Performance bonus interface (local extension - overrides BonusThreshold field name)
 */
interface PerformanceBonus {
  metric: 'impressions' | 'engagement' | 'brandLift' | 'conversions';
  threshold: number;
  bonus: number; // Schema uses 'bonus' instead of 'bonusAmount'
  achieved: boolean;
}

/**
 * SponsorshipDeal schema interface (extends centralized + adds Mongoose fields)
 */
interface ISponsorshipDealSchema extends Document {
  // Core
  sponsor: Types.ObjectId;
  recipient: Types.ObjectId;
  dealValue: number;
  dealStructure: DealStructure;
  duration: number;
  status: DealStatus;
  startDate: Date;
  endDate: Date;

  // Financial Terms
  upfrontPayment: number;
  monthlyPayment: number;
  revenueSharePercent: number;
  performanceBonuses: PerformanceBonus[];
  totalPaid: number;
  remainingPayments: number;

  // Content Requirements
  requiredMentions: number;
  contentRequirements: ContentRequirement[];
  deliveredContent: Types.ObjectId[];
  approvalRequired: boolean;
  brandGuidelines: string;

  // Exclusivity Terms
  exclusivityClause: boolean;
  competitorCategories: string[];
  exclusivityDuration: number;
  penaltyForViolation: number;

  // Performance Metrics
  totalImpressions: number;
  totalEngagement: number;
  brandMentions: number;
  brandSentiment: number;
  brandLift: number;
  estimatedReach: number;
  actualReach: number;

  // Fulfillment Tracking
  milestonesAchieved: number;
  totalMilestones: number;
  nextDeadline?: Date;
  overdueDeliverables: number;
  completionRate: number;

  // Legal & Terms
  contractTerms: string;
  terminationClause: string;
  disputeResolution: string;
  intellectualProperty: string;
  usageRights: string;

  // Additional properties for API compatibility
  actualROI?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  isActive: boolean;
  fulfillmentProgress: number;
  averageBonusAchieved: number;
  totalEarnedBonuses: number;
}

/**
 * SponsorshipDeal schema definition
 */
const SponsorshipDealSchema = new Schema<ISponsorshipDeal>(
  {
    // Core
    sponsor: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Sponsor company reference is required'],
      index: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Recipient company reference is required'],
      index: true,
    },
    dealValue: {
      type: Number,
      required: [true, 'Deal value is required'],
      min: [0, 'Deal value cannot be negative'],
    },
    dealStructure: {
      type: String,
      required: true,
      enum: {
        values: ['FlatFee', 'RevenueShare', 'PerformanceBased', 'Hybrid'],
        message: '{VALUE} is not a valid deal structure',
      },
      default: 'FlatFee',
    } as any,
    duration: {
      type: Number,
      required: [true, 'Deal duration is required'],
      min: [1, 'Duration must be at least 1 month'],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Pending', 'Active', 'Completed', 'Cancelled', 'Disputed'],
        message: '{VALUE} is not a valid deal status',
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

    // Financial Terms
    upfrontPayment: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Upfront payment cannot be negative'],
    },
    monthlyPayment: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly payment cannot be negative'],
    },
    revenueSharePercent: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Revenue share cannot be negative'],
      max: [100, 'Revenue share cannot exceed 100%'],
    },
    performanceBonuses: [
      {
        metric: {
          type: String,
          enum: ['impressions', 'engagement', 'brandLift', 'conversions'],
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
        achieved: {
          type: Boolean,
          default: false,
        },
      },
    ],
    totalPaid: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total paid cannot be negative'],
    },
    remainingPayments: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Remaining payments cannot be negative'],
    },

    // Content Requirements
    requiredMentions: {
      type: Number,
      required: [true, 'Required mentions count is required'],
      min: [0, 'Required mentions cannot be negative'],
    },
    contentRequirements: [
      {
        type: {
          type: String,
          enum: ['Article', 'Video', 'Podcast', 'Livestream', 'SocialPost'],
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        deadline: {
          type: Date,
          required: true,
        },
        specifications: {
          type: String,
          maxlength: 1000,
        },
      },
    ],
    deliveredContent: [
      {
        type: Schema.Types.ObjectId,
        ref: 'MediaContent',
      },
    ],
    approvalRequired: {
      type: Boolean,
      required: true,
      default: true,
    },
    brandGuidelines: {
      type: String,
      trim: true,
      maxlength: [2000, 'Brand guidelines cannot exceed 2000 characters'],
    },

    // Exclusivity Terms
    exclusivityClause: {
      type: Boolean,
      required: true,
      default: false,
    },
    competitorCategories: {
      type: [String],
      default: [],
    },
    exclusivityDuration: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Exclusivity duration cannot be negative'],
    },
    penaltyForViolation: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Penalty cannot be negative'],
    },

    // Performance Metrics
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
    brandMentions: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Brand mentions cannot be negative'],
    },
    brandSentiment: {
      type: Number,
      required: true,
      default: 0,
      min: [-100, 'Sentiment cannot be below -100'],
      max: [100, 'Sentiment cannot exceed 100'],
    },
    brandLift: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Brand lift cannot be negative'],
    },
    estimatedReach: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Estimated reach cannot be negative'],
    },
    actualReach: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Actual reach cannot be negative'],
    },

    // Fulfillment Tracking
    milestonesAchieved: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Milestones achieved cannot be negative'],
    },
    totalMilestones: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total milestones cannot be negative'],
    },
    nextDeadline: {
      type: Date,
    },
    overdueDeliverables: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Overdue deliverables cannot be negative'],
    },
    completionRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Completion rate cannot be negative'],
      max: [100, 'Completion rate cannot exceed 100%'],
    },

    // Legal & Terms
    contractTerms: {
      type: String,
      trim: true,
      maxlength: [5000, 'Contract terms cannot exceed 5000 characters'],
    },
    terminationClause: {
      type: String,
      trim: true,
      maxlength: [1000, 'Termination clause cannot exceed 1000 characters'],
    },
    disputeResolution: {
      type: String,
      trim: true,
      maxlength: [1000, 'Dispute resolution cannot exceed 1000 characters'],
    },
    intellectualProperty: {
      type: String,
      trim: true,
      maxlength: [1000, 'IP terms cannot exceed 1000 characters'],
    },
    usageRights: {
      type: String,
      trim: true,
      maxlength: [1000, 'Usage rights cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'media_sponsorshipdeals',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
SponsorshipDealSchema.index({ sponsor: 1, status: 1 }); // Sponsor's active deals
SponsorshipDealSchema.index({ recipient: 1, status: 1 }); // Recipient's deals
SponsorshipDealSchema.index({ startDate: 1, endDate: 1 }); // Time-based queries
SponsorshipDealSchema.index({ dealValue: -1 }); // Deal size sorting

/**
 * Virtual field: isActive
 *
 * @description
 * Check if deal is currently active
 *
 * @returns {boolean} Is deal active
 */
SponsorshipDealSchema.virtual('isActive').get(function (this: ISponsorshipDeal): boolean {
  if (this.status !== 'Active') return false;
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
});

/**
 * Virtual field: fulfillmentProgress
 *
 * @description
 * Percentage of milestones achieved
 *
 * @returns {number} Fulfillment progress (0-100)
 */
SponsorshipDealSchema.virtual('fulfillmentProgress').get(function (
  this: ISponsorshipDeal
): number {
  if (this.totalMilestones === 0) return 0;
  return Math.min((this.milestonesAchieved / this.totalMilestones) * 100, 100);
});

/**
 * Virtual field: averageBonusAchieved
 *
 * @description
 * Percentage of performance bonuses achieved
 *
 * @returns {number} Bonus achievement rate (%)
 */
SponsorshipDealSchema.virtual('averageBonusAchieved').get(function (
  this: ISponsorshipDeal
): number {
  if (this.performanceBonuses.length === 0) return 0;
  const achieved = this.performanceBonuses.filter((b) => b.achieved).length;
  return Math.round((achieved / this.performanceBonuses.length) * 100);
});

/**
 * Virtual field: totalEarnedBonuses
 *
 * @description
 * Total bonus amount earned so far
 *
 * @returns {number} Total bonuses ($)
 */
SponsorshipDealSchema.virtual('totalEarnedBonuses').get(function (
  this: ISponsorshipDeal
): number {
  return this.performanceBonuses.filter((b) => b.achieved).reduce((sum, b) => sum + b.bonus, 0);
});

/**
 * Pre-save hook: Calculate derived metrics
 */
SponsorshipDealSchema.pre<ISponsorshipDeal>('save', function (next) {
  // Calculate remaining payments
  this.remainingPayments = this.dealValue - this.totalPaid;

  // Calculate total milestones from content requirements
  this.totalMilestones = this.contentRequirements.reduce((sum, req) => sum + req.quantity, 0);

  // Calculate completion rate
  if (this.totalMilestones > 0) {
    this.completionRate = Math.round((this.milestonesAchieved / this.totalMilestones) * 100);
  }

  // Find next deadline
  const upcomingDeadlines = this.contentRequirements
    .map((req) => req.deadline)
    .filter((deadline) => deadline > new Date())
    .sort((a, b) => a.getTime() - b.getTime());

  this.nextDeadline = upcomingDeadlines.length > 0 ? upcomingDeadlines[0] : undefined;

  // Auto-activate if status is Pending and within date range
  const now = new Date();
  if (this.status === 'Pending' && now >= this.startDate && now <= this.endDate) {
    this.status = 'Active';
  }

  // Auto-complete if all milestones achieved and past end date
  if (
    this.status === 'Active' &&
    this.milestonesAchieved >= this.totalMilestones &&
    now > this.endDate
  ) {
    this.status = 'Completed';
  }

  next();
});

/**
 * SponsorshipDeal model
 *
 * @example
 * ```typescript
 * import SponsorshipDeal from '@/lib/db/models/media/SponsorshipDeal';
 *
 * // Create hybrid sponsorship deal
 * const deal = await SponsorshipDeal.create({
 *   sponsor: sponsorCompanyId,
 *   recipient: mediaCompanyId,
 *   dealValue: 200000,
 *   dealStructure: 'Hybrid',
 *   upfrontPayment: 100000,
 *   monthlyPayment: 15000,
 *   revenueSharePercent: 10,
 *   duration: 6,
 *   requiredMentions: 30,
 *   contentRequirements: [
 *     { type: 'Video', quantity: 10, deadline: new Date('2025-12-31'), specifications: '10min+' },
 *     { type: 'Article', quantity: 20, deadline: new Date('2025-12-31'), specifications: '1000+ words' }
 *   ],
 *   performanceBonuses: [
 *     { metric: 'impressions', threshold: 1000000, bonus: 20000, achieved: false },
 *     { metric: 'brandLift', threshold: 15, bonus: 30000, achieved: false }
 *   ],
 *   exclusivityClause: true,
 *   competitorCategories: ['Tech', 'Electronics'],
 *   exclusivityDuration: 12,
 *   startDate: new Date(),
 *   endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months
 * });
 *
 * // Track fulfillment
 * await deal.updateOne({
 *   $inc: {
 *     milestonesAchieved: 1,
 *     brandMentions: 1,
 *     totalImpressions: 50000,
 *     totalEngagement: 2500
 *   },
 *   $push: {
 *     deliveredContent: contentId
 *   }
 * });
 *
 * // Check progress
 * console.log(deal.fulfillmentProgress); // % complete
 * console.log(deal.totalEarnedBonuses); // Bonuses earned
 * console.log(deal.completionRate); // On-time delivery %
 * ```
 */
const SponsorshipDeal: Model<ISponsorshipDeal> =
  mongoose.models.SponsorshipDeal ||
  mongoose.model<ISponsorshipDeal>('SponsorshipDeal', SponsorshipDealSchema);

export default SponsorshipDeal;