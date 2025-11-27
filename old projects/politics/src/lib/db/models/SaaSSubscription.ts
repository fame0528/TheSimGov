/**
 * @file src/lib/db/models/SaaSSubscription.ts
 * @description SaaS subscription model for Technology/Software companies
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * SaaSSubscription model representing software-as-a-service subscription offerings
 * from Technology/Software companies. Tracks subscriber lifecycle (acquisition, retention,
 * churn), feature access, API usage limits, customer lifetime value (LTV), and profitability.
 * High-margin recurring revenue (85-90%) similar to E-Commerce subscriptions but with
 * software-specific benefits (features, API calls, storage, support tiers).
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (Technology/Software industry)
 * - name: Subscription plan name (e.g., "Basic Plan", "Pro Plan", "Enterprise")
 * - tier: Subscription tier (Basic, Plus, Premium)
 * - active: Plan availability status
 * - launchedAt: Plan launch date
 * 
 * Pricing:
 * - monthlyPrice: Monthly subscription fee
 * - annualPrice: Annual subscription fee (typically 2 months free)
 * - trialDays: Free trial period days
 * 
 * Software Benefits:
 * - includedFeatures: Array of feature names included in tier
 * - apiCallsLimit: Monthly API call quota (0 = unlimited)
 * - storageLimit: GB storage per subscriber
 * - supportTier: Support level (Basic, Priority, Enterprise)
 * - maxUsers: Maximum user seats per subscription
 * - customBranding: Whether allows custom branding
 * 
 * Subscriber Metrics:
 * - totalSubscribers: Lifetime subscribers
 * - activeSubscribers: Current active subscribers
 * - monthlyNewSubscribers: New subscriptions this month
 * - monthlyChurnedSubscribers: Canceled subscriptions this month
 * - churnRate: Monthly churn percentage (5-15% typical)
 * 
 * Usage Metrics:
 * - avgApiCallsPerSubscriber: Average API calls/month
 * - avgStorageUsed: Average storage GB used/month
 * - avgActiveUsers: Average seats used per subscription
 * - featureUtilization: % subscribers actively using premium features (0-100)
 * 
 * Financial Metrics:
 * - totalRevenue: Lifetime subscription revenue
 * - monthlyRecurringRevenue: MRR (active subscribers × monthly price)
 * - annualRecurringRevenue: ARR (MRR × 12)
 * - customerLifetimeValue: Average LTV per subscriber
 * - operatingCost: Monthly infrastructure cost (servers, support)
 * - profitMargin: (Revenue - Cost) / Revenue percentage
 * 
 * USAGE:
 * ```typescript
 * import SaaSSubscription from '@/lib/db/models/SaaSSubscription';
 * 
 * // Create subscription plan
 * const proPlan = await SaaSSubscription.create({
 *   company: companyId,
 *   name: "Pro Plan",
 *   tier: "Plus",
 *   monthlyPrice: 49,
 *   annualPrice: 490, // 2 months free
 *   includedFeatures: ["Advanced Analytics", "API Access", "Custom Reports"],
 *   apiCallsLimit: 100000,
 *   storageLimit: 100
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Pricing: Basic $19/mo ($190/yr), Plus $49/mo ($490/yr), Premium $99/mo ($990/yr)
 * - Profit margins: 85-90% (low infrastructure costs, high perceived value)
 * - Churn rate healthy: 3-5%, concerning: 8-12%, critical: > 15%
 * - Trial conversions: 60-75% convert to paid after free trial
 * - LTV calculation: (Avg monthly revenue × avg lifetime months) - acquisition cost
 * - Avg lifetime: 24-36 months (higher with annual plans)
 * - Infrastructure costs: Servers $0.50/subscriber/mo, Support $2/subscriber/mo
 * - Acquisition cost: $30-50 per subscriber (ads, content marketing)
 * - Breakeven: 2-3 months of subscriptions to recover acquisition cost
 * - Retention tactics: Annual plans (lower churn), feature gating, integration lock-in
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

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
  trialConversionRate: number;
  paybackPeriod: number;
}

/**
 * SaaSSubscription schema definition
 */
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
      default: 14, // 14-day free trial
      min: [0, 'Trial days cannot be negative'],
      max: [90, 'Trial days cannot exceed 90'],
    },

    // Software Benefits
    includedFeatures: {
      type: [String],
      required: true,
      default: [],
    },
    apiCallsLimit: {
      type: Number,
      required: true,
      default: 10000, // 10k API calls/month
      min: [0, 'API calls limit cannot be negative'],
    },
    storageLimit: {
      type: Number,
      required: true,
      default: 10, // 10 GB storage
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
      default: 1, // 1 user for basic plans
      min: [1, 'Max users must be at least 1'],
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
      default: 5.0, // 5% monthly churn (healthy for SaaS)
      min: [0, 'Churn rate cannot be negative'],
      max: [100, 'Churn rate cannot exceed 100%'],
    },

    // Usage Metrics
    avgApiCallsPerSubscriber: {
      type: Number,
      required: true,
      default: 5000, // 5k API calls/subscriber/month avg
      min: [0, 'Avg API calls cannot be negative'],
    },
    avgStorageUsed: {
      type: Number,
      required: true,
      default: 5, // 5 GB avg usage
      min: [0, 'Avg storage used cannot be negative'],
    },
    avgActiveUsers: {
      type: Number,
      required: true,
      default: 1, // 1 active user avg
      min: [0, 'Avg active users cannot be negative'],
    },
    featureUtilization: {
      type: Number,
      required: true,
      default: 65, // 65% actively use premium features
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
      default: 1470, // $1,470 avg LTV (30 months × $49/mo)
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
      default: 88, // 88% profit margin (typical SaaS)
      min: [-100, 'Profit margin cannot be below -100%'],
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

/**
 * Indexes for query optimization
 */
SaaSSubscriptionSchema.index({ company: 1, tier: 1, active: 1 }); // Subscriptions by tier
SaaSSubscriptionSchema.index({ monthlyRecurringRevenue: -1 }); // Top MRR plans
SaaSSubscriptionSchema.index({ churnRate: 1 }); // Churn tracking

/**
 * Virtual field: netMRR
 * 
 * @description
 * Net Monthly Recurring Revenue after operating costs
 * 
 * @returns {number} Net MRR ($)
 */
SaaSSubscriptionSchema.virtual('netMRR').get(function (this: ISaaSSubscription): number {
  return this.monthlyRecurringRevenue - this.operatingCost;
});

/**
 * Virtual field: avgSubscriptionLifetime
 * 
 * @description
 * Average subscriber lifetime in months based on churn rate
 * Formula: 1 / (churn rate / 100)
 * 
 * @returns {number} Avg lifetime (months)
 */
SaaSSubscriptionSchema.virtual('avgSubscriptionLifetime').get(function (this: ISaaSSubscription): number {
  if (this.churnRate === 0) return Infinity;
  return Math.floor(1 / (this.churnRate / 100));
});

/**
 * Virtual field: trialConversionRate
 * 
 * @description
 * Estimates trial-to-paid conversion rate
 * Assume 70% of new subscribers came from trials
 * 
 * @returns {number} Conversion rate percentage
 */
SaaSSubscriptionSchema.virtual('trialConversionRate').get(function (this: ISaaSSubscription): number {
  if (this.monthlyNewSubscribers === 0) return 0;
  return 70; // Default 70% trial conversion
});

/**
 * Virtual field: paybackPeriod
 * 
 * @description
 * Months to recover acquisition cost (assume $40 CAC for SaaS)
 * 
 * @returns {number} Payback period (months)
 */
SaaSSubscriptionSchema.virtual('paybackPeriod').get(function (this: ISaaSSubscription): number {
  const acquisitionCost = 40; // $40 avg CAC
  const monthlyProfit = this.monthlyPrice * (this.profitMargin / 100);
  
  if (monthlyProfit === 0) return Infinity;
  return Math.ceil(acquisitionCost / monthlyProfit);
});

/**
 * Pre-save hook: Calculate MRR, ARR, churn rate, profit margin
 */
SaaSSubscriptionSchema.pre<ISaaSSubscription>('save', function (next) {
  // Calculate MRR (active subscribers × monthly price)
  this.monthlyRecurringRevenue = this.activeSubscribers * this.monthlyPrice;

  // Calculate ARR (MRR × 12)
  this.annualRecurringRevenue = this.monthlyRecurringRevenue * 12;

  // Calculate churn rate (churned / active × 100)
  if (this.activeSubscribers > 0) {
    this.churnRate = (this.monthlyChurnedSubscribers / this.activeSubscribers) * 100;
  }

  // Calculate profit margin
  if (this.monthlyRecurringRevenue > 0) {
    this.profitMargin = ((this.monthlyRecurringRevenue - this.operatingCost) / this.monthlyRecurringRevenue) * 100;
  }

  // Calculate LTV (avg lifetime × monthly price - acquisition cost)
  const avgLifetime = this.churnRate > 0 ? 1 / (this.churnRate / 100) : 30;
  const acquisitionCost = 40; // $40 avg CAC
  this.customerLifetimeValue = avgLifetime * this.monthlyPrice - acquisitionCost;

  next();
});

/**
 * SaaSSubscription model
 * 
 * @example
 * ```typescript
 * import SaaSSubscription from '@/lib/db/models/SaaSSubscription';
 * 
 * // Create subscription plan
 * const proPlan = await SaaSSubscription.create({
 *   company: companyId,
 *   name: "Pro Plan",
 *   tier: "Plus",
 *   monthlyPrice: 49,
 *   annualPrice: 490, // Save 2 months
 *   trialDays: 14,
 *   includedFeatures: ["Advanced Analytics", "API Access", "Custom Reports"],
 *   apiCallsLimit: 100000,
 *   storageLimit: 100,
 *   supportTier: "Priority",
 *   maxUsers: 5
 * });
 * 
 * // New subscriber
 * await proPlan.updateOne({
 *   $inc: {
 *     totalSubscribers: 1,
 *     activeSubscribers: 1,
 *     monthlyNewSubscribers: 1
 *   }
 * });
 * 
 * // Check metrics
 * console.log(proPlan.monthlyRecurringRevenue); // MRR
 * console.log(proPlan.churnRate); // Monthly churn %
 * console.log(proPlan.customerLifetimeValue); // Avg LTV
 * console.log(proPlan.paybackPeriod); // Months to breakeven
 * ```
 */
const SaaSSubscription: Model<ISaaSSubscription> =
  mongoose.models.SaaSSubscription || mongoose.model<ISaaSSubscription>('SaaSSubscription', SaaSSubscriptionSchema);

export default SaaSSubscription;
