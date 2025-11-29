/**
 * @fileoverview SaaS Subscription Model
 * @module lib/db/models/software/SaaSSubscription
 * 
 * OVERVIEW:
 * SaaSSubscription model representing software-as-a-service subscription offerings.
 * Tracks subscriber lifecycle (acquisition, retention, churn), feature access, 
 * API usage limits, customer lifetime value (LTV), and profitability.
 * 
 * KEY FEATURES:
 * - Multi-tier pricing (Basic, Plus, Premium)
 * - Monthly/Annual billing with trial periods
 * - MRR, ARR, LTV tracking
 * - Churn rate monitoring
 * - Feature and API quota management
 * 
 * BUSINESS LOGIC:
 * - Pricing: Basic $19/mo, Plus $49/mo, Premium $99/mo
 * - Profit margins: 85-90% (low infrastructure costs)
 * - Churn rate healthy: 3-5%, concerning: 8-12%, critical: > 15%
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Subscription tier types
 */
export type SubscriptionTier = 'Basic' | 'Plus' | 'Premium';

/**
 * Support tier types
 */
export type SupportTier = 'Basic' | 'Priority' | 'Enterprise';

/**
 * SaaSSubscription document interface
 */
export interface ISaaSSubscription extends Document {
  // Core
  company: Types.ObjectId;
  name: string;
  tier: SubscriptionTier;
  active: boolean;
  launchedAt: Date;

  // Pricing
  monthlyPrice: number;
  annualPrice: number;
  trialDays: number;

  // Software Benefits
  includedFeatures: string[];
  apiCallsLimit: number;
  storageLimit: number;
  supportTier: SupportTier;
  maxUsers: number;
  customBranding: boolean;

  // Subscriber Metrics
  totalSubscribers: number;
  activeSubscribers: number;
  monthlyNewSubscribers: number;
  monthlyChurnedSubscribers: number;
  churnRate: number;

  // Usage Metrics
  avgApiCallsPerSubscriber: number;
  avgStorageUsed: number;
  avgActiveUsers: number;
  featureUtilization: number;

  // Financial Metrics
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  customerLifetimeValue: number;
  operatingCost: number;
  profitMargin: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  netMRR: number;
  avgSubscriptionLifetime: number;
}

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

const SaaSSubscriptionSchema = new Schema<ISaaSSubscription>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Subscription name is required'],
      trim: true,
      minlength: [3, 'Subscription name must be at least 3 characters'],
      maxlength: [100, 'Subscription name cannot exceed 100 characters'],
    },
    tier: {
      type: String,
      required: true,
      enum: {
        values: ['Basic', 'Plus', 'Premium'],
        message: '{VALUE} is not a valid subscription tier',
      },
      default: 'Plus',
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    launchedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },

    // Pricing
    monthlyPrice: {
      type: Number,
      required: [true, 'Monthly price is required'],
      min: [1, 'Monthly price must be at least $1'],
      max: [10000, 'Monthly price cannot exceed $10,000'],
    },
    annualPrice: {
      type: Number,
      required: [true, 'Annual price is required'],
      min: [10, 'Annual price must be at least $10'],
      max: [100000, 'Annual price cannot exceed $100,000'],
    },
    trialDays: {
      type: Number,
      required: true,
      default: 14,
      min: [0, 'Trial days cannot be negative'],
      max: [90, 'Trial days cannot exceed 90'],
    },

    // Software Benefits
    includedFeatures: [{
      type: String,
      trim: true,
    }],
    apiCallsLimit: {
      type: Number,
      required: true,
      default: 10000,
      min: [0, 'API calls limit cannot be negative'],
    },
    storageLimit: {
      type: Number,
      required: true,
      default: 10,
      min: [0, 'Storage limit cannot be negative'],
    },
    supportTier: {
      type: String,
      required: true,
      enum: {
        values: ['Basic', 'Priority', 'Enterprise'],
        message: '{VALUE} is not a valid support tier',
      },
      default: 'Basic',
    },
    maxUsers: {
      type: Number,
      required: true,
      default: 5,
      min: [1, 'Max users must be at least 1'],
      max: [10000, 'Max users cannot exceed 10,000'],
    },
    customBranding: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Subscriber Metrics
    totalSubscribers: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total subscribers cannot be negative'],
    },
    activeSubscribers: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Active subscribers cannot be negative'],
    },
    monthlyNewSubscribers: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly new subscribers cannot be negative'],
    },
    monthlyChurnedSubscribers: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly churned subscribers cannot be negative'],
    },
    churnRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Churn rate cannot be negative'],
      max: [100, 'Churn rate cannot exceed 100%'],
    },

    // Usage Metrics
    avgApiCallsPerSubscriber: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Average API calls cannot be negative'],
    },
    avgStorageUsed: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Average storage used cannot be negative'],
    },
    avgActiveUsers: {
      type: Number,
      required: true,
      default: 1,
      min: [0, 'Average active users cannot be negative'],
    },
    featureUtilization: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Feature utilization cannot be negative'],
      max: [100, 'Feature utilization cannot exceed 100%'],
    },

    // Financial Metrics
    totalRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total revenue cannot be negative'],
    },
    monthlyRecurringRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'MRR cannot be negative'],
    },
    annualRecurringRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'ARR cannot be negative'],
    },
    customerLifetimeValue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'LTV cannot be negative'],
    },
    operatingCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Operating cost cannot be negative'],
    },
    profitMargin: {
      type: Number,
      required: true,
      default: 85,
      min: [0, 'Profit margin cannot be negative'],
      max: [100, 'Profit margin cannot exceed 100%'],
    },
  },
  {
    timestamps: true,
    collection: 'saassubscriptions',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// INDEXES
// ============================================================================

SaaSSubscriptionSchema.index({ company: 1, name: 1 }, { unique: true });
SaaSSubscriptionSchema.index({ tier: 1, active: 1 });
SaaSSubscriptionSchema.index({ churnRate: 1 });

// ============================================================================
// VIRTUALS
// ============================================================================

SaaSSubscriptionSchema.virtual('netMRR').get(function (this: ISaaSSubscription) {
  const churned = this.monthlyChurnedSubscribers * this.monthlyPrice;
  const newSubs = this.monthlyNewSubscribers * this.monthlyPrice;
  return newSubs - churned;
});

SaaSSubscriptionSchema.virtual('avgSubscriptionLifetime').get(function (this: ISaaSSubscription) {
  if (this.churnRate === 0) return 36; // Default 3 years
  return Math.round(100 / this.churnRate);
});

// ============================================================================
// PRE-SAVE HOOKS
// ============================================================================

SaaSSubscriptionSchema.pre('save', function (next) {
  // Calculate MRR from active subscribers
  this.monthlyRecurringRevenue = this.activeSubscribers * this.monthlyPrice;
  this.annualRecurringRevenue = this.monthlyRecurringRevenue * 12;
  
  // Calculate churn rate
  if (this.activeSubscribers > 0) {
    this.churnRate = (this.monthlyChurnedSubscribers / this.activeSubscribers) * 100;
  }
  
  // Calculate LTV
  const avgLifetimeMonths = this.churnRate > 0 ? 100 / this.churnRate : 36;
  this.customerLifetimeValue = this.monthlyPrice * avgLifetimeMonths;
  
  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const SaaSSubscription: Model<ISaaSSubscription> =
  mongoose.models.SaaSSubscription || mongoose.model<ISaaSSubscription>('SaaSSubscription', SaaSSubscriptionSchema);

export { SaaSSubscription };
export default SaaSSubscription;
