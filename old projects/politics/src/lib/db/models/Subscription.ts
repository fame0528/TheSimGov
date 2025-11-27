/**
 * @file src/lib/db/models/Subscription.ts
 * @description Subscription Mongoose schema for Prime-style membership programs
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Subscription model representing Amazon Prime-style membership programs offering benefits
 * like free shipping, exclusive deals, content streaming, and cloud storage. Tracks subscriber
 * lifecycle (acquisition, retention, churn), benefit usage, customer lifetime value (LTV),
 * and profitability. High-margin recurring revenue (90%+) with strong retention mechanics.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - marketplace: Reference to Marketplace document
 * - name: Program name (e.g., "Prime", "Prime Plus", "Business Prime")
 * - tier: Subscription tier (Basic, Plus, Premium)
 * - active: Program availability status
 * - launchedAt: Program launch date
 * 
 * Pricing:
 * - monthlyPrice: Monthly subscription fee
 * - annualPrice: Annual subscription fee (typically 2 months free)
 * - trialDays: Free trial period days
 * 
 * Benefits:
 * - freeShipping: Whether includes free shipping
 * - exclusiveDeals: Access to member-only deals
 * - contentStreaming: Streaming video/music access
 * - cloudStorage: Cloud storage GB included
 * - earlyAccess: Early access to new products
 * 
 * Subscriber Metrics:
 * - totalSubscribers: Lifetime subscribers
 * - activeSubscribers: Current active subscribers
 * - monthlyNewSubscribers: New subscriptions this month
 * - monthlyChurnedSubscribers: Canceled subscriptions this month
 * - churnRate: Monthly churn percentage (5-15% typical)
 * 
 * Usage Metrics:
 * - avgShipmentsPerSubscriber: Average orders/month using free shipping
 * - avgDealsPurchased: Average exclusive deals used/month
 * - avgStreamingHours: Average content hours watched/month
 * - benefitUtilization: % subscribers actively using benefits (0-100)
 * 
 * Financial Metrics:
 * - totalRevenue: Lifetime subscription revenue
 * - monthlyRecurringRevenue: MRR (active subscribers * monthly price)
 * - annualRecurringRevenue: ARR (MRR * 12)
 * - customerLifetimeValue: Average LTV per subscriber
 * - operatingCost: Monthly benefit fulfillment cost
 * - profitMargin: (Revenue - Cost) / Revenue percentage
 * 
 * USAGE:
 * ```typescript
 * import Subscription from '@/lib/db/models/Subscription';
 * 
 * // Create subscription program
 * const prime = await Subscription.create({
 *   marketplace: marketplaceId,
 *   name: "Prime Membership",
 *   tier: "Plus",
 *   monthlyPrice: 15,
 *   annualPrice: 150, // 2 months free
 *   freeShipping: true,
 *   exclusiveDeals: true
 * });
 * 
 * // New subscriber
 * await prime.updateOne({
 *   $inc: {
 *     totalSubscribers: 1,
 *     activeSubscribers: 1,
 *     monthlyNewSubscribers: 1
 *   }
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Pricing: Basic $10/mo ($100/yr), Plus $15/mo ($150/yr), Premium $25/mo ($250/yr)
 * - Profit margins: 90%+ (low fulfillment costs, pure subscription revenue)
 * - Churn rate healthy: 5-8%, concerning: 10-15%, critical: > 15%
 * - Trial conversions: 60-75% convert to paid after free trial
 * - LTV calculation: (Avg monthly revenue * avg lifetime months) - acquisition cost
 * - Avg lifetime: 24-36 months (higher with annual plans)
 * - Benefit costs: Free shipping $5/order, Streaming $1/subscriber/mo, Storage $0.50/mo
 * - Acquisition cost: $20-40 per subscriber (ads, promotions)
 * - Breakeven: 2-3 months of subscriptions to recover acquisition cost
 * - Retention tactics: Annual plans (lower churn), exclusive benefits, sunk cost effect
 * - Cross-sell: Prime subscribers spend 2-3x more than non-members
 * - Flywheel: More subscribers → more shipping volume → better shipping rates → more value
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Subscription tier types
 */
export type SubscriptionTier = 'Basic' | 'Plus' | 'Premium';

/**
 * Subscription document interface
 * 
 * @interface ISubscription
 * @extends {Document}
 */
export interface ISubscription extends Document {
  // Core
  marketplace: Types.ObjectId;
  name: string;
  tier: SubscriptionTier;
  active: boolean;
  launchedAt: Date;

  // Pricing
  monthlyPrice: number;
  annualPrice: number;
  trialDays: number;

  // Benefits
  freeShipping: boolean;
  exclusiveDeals: boolean;
  contentStreaming: boolean;
  cloudStorage: number;
  earlyAccess: boolean;

  // Subscriber Metrics
  totalSubscribers: number;
  activeSubscribers: number;
  monthlyNewSubscribers: number;
  monthlyChurnedSubscribers: number;
  churnRate: number;

  // Usage Metrics
  avgShipmentsPerSubscriber: number;
  avgDealsPurchased: number;
  avgStreamingHours: number;
  benefitUtilization: number;

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
 * Subscription schema definition
 */
const SubscriptionSchema = new Schema<ISubscription>(
  {
    // Core
    marketplace: {
      type: Schema.Types.ObjectId,
      ref: 'Marketplace',
      required: [true, 'Marketplace reference is required'],
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
      max: [100, 'Monthly price cannot exceed $100'],
    },
    annualPrice: {
      type: Number,
      required: [true, 'Annual price is required'],
      min: [10, 'Annual price must be at least $10'],
      max: [1000, 'Annual price cannot exceed $1,000'],
    },
    trialDays: {
      type: Number,
      required: true,
      default: 30, // 30-day free trial
      min: [0, 'Trial days cannot be negative'],
      max: [90, 'Trial days cannot exceed 90'],
    },

    // Benefits
    freeShipping: {
      type: Boolean,
      required: true,
      default: true,
    },
    exclusiveDeals: {
      type: Boolean,
      required: true,
      default: true,
    },
    contentStreaming: {
      type: Boolean,
      required: true,
      default: false,
    },
    cloudStorage: {
      type: Number,
      required: true,
      default: 0, // GB of cloud storage
      min: [0, 'Cloud storage cannot be negative'],
    },
    earlyAccess: {
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
      default: 7.0, // 7% monthly churn (healthy)
      min: [0, 'Churn rate cannot be negative'],
      max: [100, 'Churn rate cannot exceed 100%'],
    },

    // Usage Metrics
    avgShipmentsPerSubscriber: {
      type: Number,
      required: true,
      default: 4, // 4 orders/month avg
      min: [0, 'Avg shipments cannot be negative'],
    },
    avgDealsPurchased: {
      type: Number,
      required: true,
      default: 2, // 2 exclusive deals/month
      min: [0, 'Avg deals purchased cannot be negative'],
    },
    avgStreamingHours: {
      type: Number,
      required: true,
      default: 10, // 10 hours/month streaming
      min: [0, 'Avg streaming hours cannot be negative'],
    },
    benefitUtilization: {
      type: Number,
      required: true,
      default: 70, // 70% actively use benefits
      min: [0, 'Benefit utilization cannot be negative'],
      max: [100, 'Benefit utilization cannot exceed 100%'],
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
      default: 360, // $360 avg LTV (24 months * $15/mo)
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
      default: 90, // 90% profit margin
      min: [-100, 'Profit margin cannot be below -100%'],
      max: [100, 'Profit margin cannot exceed 100%'],
    },
  },
  {
    timestamps: true,
    collection: 'subscriptions',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
SubscriptionSchema.index({ marketplace: 1, tier: 1, active: 1 }); // Subscriptions by tier
SubscriptionSchema.index({ monthlyRecurringRevenue: -1 }); // Top MRR programs
SubscriptionSchema.index({ churnRate: 1 }); // Churn tracking

/**
 * Virtual field: netMRR
 * 
 * @description
 * Net Monthly Recurring Revenue after operating costs
 * 
 * @returns {number} Net MRR ($)
 */
SubscriptionSchema.virtual('netMRR').get(function (this: ISubscription): number {
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
SubscriptionSchema.virtual('avgSubscriptionLifetime').get(function (this: ISubscription): number {
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
SubscriptionSchema.virtual('trialConversionRate').get(function (this: ISubscription): number {
  // Simplified: Assume conversion if active subscribers growing
  if (this.monthlyNewSubscribers === 0) return 0;
  return 70; // Default 70% trial conversion
});

/**
 * Virtual field: paybackPeriod
 * 
 * @description
 * Months to recover acquisition cost (assume $30 CAC)
 * 
 * @returns {number} Payback period (months)
 */
SubscriptionSchema.virtual('paybackPeriod').get(function (this: ISubscription): number {
  const acquisitionCost = 30; // $30 avg CAC
  const monthlyProfit = this.monthlyPrice * (this.profitMargin / 100);
  
  if (monthlyProfit === 0) return Infinity;
  return Math.ceil(acquisitionCost / monthlyProfit);
});

/**
 * Pre-save hook: Calculate MRR, ARR, churn rate, profit margin
 */
SubscriptionSchema.pre<ISubscription>('save', function (next) {
  // Calculate MRR (active subscribers * monthly price)
  this.monthlyRecurringRevenue = this.activeSubscribers * this.monthlyPrice;

  // Calculate ARR (MRR * 12)
  this.annualRecurringRevenue = this.monthlyRecurringRevenue * 12;

  // Calculate churn rate (churned / active * 100)
  if (this.activeSubscribers > 0) {
    this.churnRate = (this.monthlyChurnedSubscribers / this.activeSubscribers) * 100;
  }

  // Calculate profit margin
  if (this.monthlyRecurringRevenue > 0) {
    this.profitMargin = ((this.monthlyRecurringRevenue - this.operatingCost) / this.monthlyRecurringRevenue) * 100;
  }

  // Calculate LTV (avg lifetime * monthly price - acquisition cost)
  const avgLifetime = this.churnRate > 0 ? 1 / (this.churnRate / 100) : 24;
  const acquisitionCost = 30; // $30 avg CAC
  this.customerLifetimeValue = avgLifetime * this.monthlyPrice - acquisitionCost;

  next();
});

/**
 * Subscription model
 * 
 * @example
 * ```typescript
 * import Subscription from '@/lib/db/models/Subscription';
 * 
 * // Create subscription program
 * const prime = await Subscription.create({
 *   marketplace: marketplaceId,
 *   name: "Prime Plus Membership",
 *   tier: "Plus",
 *   monthlyPrice: 15,
 *   annualPrice: 150, // Save 2 months
 *   trialDays: 30,
 *   freeShipping: true,
 *   exclusiveDeals: true,
 *   contentStreaming: true,
 *   cloudStorage: 100 // 100GB storage
 * });
 * 
 * // New subscriber
 * await prime.updateOne({
 *   $inc: {
 *     totalSubscribers: 1,
 *     activeSubscribers: 1,
 *     monthlyNewSubscribers: 1
 *   }
 * });
 * 
 * // Subscriber churns
 * await prime.updateOne({
 *   $inc: {
 *     activeSubscribers: -1,
 *     monthlyChurnedSubscribers: 1
 *   }
 * });
 * 
 * // Check metrics
 * console.log(prime.monthlyRecurringRevenue); // MRR
 * console.log(prime.churnRate); // Monthly churn %
 * console.log(prime.customerLifetimeValue); // Avg LTV
 * console.log(prime.paybackPeriod); // Months to breakeven
 * ```
 */
const Subscription: Model<ISubscription> =
  mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;
