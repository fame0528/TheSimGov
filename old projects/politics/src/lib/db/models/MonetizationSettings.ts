/**
 * @file src/lib/db/models/MonetizationSettings.ts
 * @description Monetization configuration model for Media companies
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * MonetizationSettings model representing revenue optimization configuration for Media companies.
 * Defines CPM (Cost Per Mille) rate multipliers by demographic segments, subscription tier structures,
 * affiliate commission percentages, platform revenue sharing terms, and monetization strategy preferences.
 * Enables Media companies to maximize revenue by targeting high-value demographics, offering premium
 * subscription tiers, earning affiliate commissions, and negotiating platform partnerships.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company (Media company)
 * - isActive: Whether monetization settings are active
 * - defaultCPM: Base CPM rate for ads ($)
 * - strategy: Monetization focus (AdRevenue, Subscriptions, Affiliates, Hybrid)
 * 
 * CPM Rate Multipliers (by demographic):
 * - cpmByAge: Object with age group keys and CPM multipliers
 *   - "18-24": number (e.g., 1.2 = 20% higher CPM)
 *   - "25-34": number (e.g., 1.5 = 50% higher CPM for prime demographic)
 *   - "35-44": number
 *   - "45-54": number
 *   - "55-64": number
 *   - "65+": number
 * - cpmByIncome: Object with income bracket keys and CPM multipliers
 *   - "<$25K": number
 *   - "$25K-$50K": number
 *   - "$50K-$100K": number
 *   - "$100K-$200K": number
 *   - "$200K+": number (e.g., 2.0 = double CPM for high-income viewers)
 * - cpmByLocation: Object with location keys and CPM multipliers
 *   - "North America": number
 *   - "Europe": number
 *   - "Asia": number
 *   - "Other": number
 * - cpmByDevice: Object with device type keys and multipliers
 *   - "Desktop": number
 *   - "Mobile": number
 *   - "Tablet": number
 * 
 * Subscription Tiers:
 * - subscriptionTiers: Array of subscription tier definitions
 *   - name: string (e.g., "Basic", "Premium", "VIP")
 *   - monthlyPrice: number ($)
 *   - annualPrice: number ($)
 *   - features: string[] (feature list)
 *   - limits: object (content access limits)
 *   - adFree: boolean (no ads for this tier)
 * 
 * Affiliate Settings:
 * - affiliateEnabled: Whether affiliate revenue is enabled
 * - affiliateCommissionRate: Default commission percentage (%)
 * - affiliateCategories: Object with category keys and commission rates
 *   - "Tech": number (%)
 *   - "Fashion": number (%)
 *   - "Home": number (%)
 *   - etc.
 * 
 * Platform Revenue Sharing:
 * - platformRevShares: Object with platform name keys and revenue share %
 *   - "YouTube": number (e.g., 45 = YouTube keeps 45%, creator gets 55%)
 *   - "TikTok": number
 *   - "Twitch": number
 *   - "Substack": number
 * 
 * Revenue Optimization:
 * - minCPM: Minimum CPM floor ($)
 * - maxCPM: Maximum CPM ceiling ($)
 * - targetDemographics: Array of high-value demographic segments to prioritize
 * - excludedAdvertisers: Array of blocked advertiser categories
 * - preferredAdvertisers: Array of preferred advertiser categories (higher CPM)
 * 
 * Analytics & Performance:
 * - totalSubscribers: Current subscriber count
 * - totalMRR: Total Monthly Recurring Revenue ($)
 * - totalARR: Total Annual Recurring Revenue ($)
 * - avgRevenuePerUser: ARPU ($)
 * - churnRate: Monthly subscriber churn (%)
 * 
 * USAGE:
 * ```typescript
 * import MonetizationSettings from '@/lib/db/models/MonetizationSettings';
 * 
 * // Create monetization config
 * const settings = await MonetizationSettings.create({
 *   company: mediaCompanyId,
 *   defaultCPM: 5.00,
 *   strategy: 'Hybrid',
 *   cpmByAge: {
 *     "25-34": 1.5, // 50% higher CPM for 25-34 demographic
 *     "35-44": 1.3
 *   },
 *   subscriptionTiers: [
 *     {
 *       name: "Premium",
 *       monthlyPrice: 9.99,
 *       annualPrice: 99.99,
 *       features: ["Ad-free", "Exclusive content"],
 *       adFree: true
 *     }
 *   ]
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - CPM multipliers combine (age × income × location × device)
 * - Effective CPM = defaultCPM × ageMultiplier × incomeMultiplier × locationMultiplier × deviceMultiplier
 * - High-value demographic example: 25-34, $100K+, North America, Desktop = 5× base CPM
 * - Subscription MRR = Sum of all monthly subscription revenue
 * - Subscription ARR = MRR × 12 + Annual subscriptions
 * - ARPU = Total revenue / Total users (subscribers + ad-supported)
 * - Churn rate = (Cancelled subscribers / Total subscribers) × 100
 * - Hybrid strategy: Balance ad revenue with subscription growth (diversified income)
 * - AdRevenue strategy: Maximize CPM by targeting high-value demographics
 * - Subscriptions strategy: Focus on subscriber acquisition and retention (lower churn)
 * - Affiliates strategy: Promote high-commission products to audience
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Monetization strategy enum
 */
export type MonetizationStrategy = 'AdRevenue' | 'Subscriptions' | 'Affiliates' | 'Hybrid';

/**
 * CPM rate multiplier interface
 */
export interface CPMMultipliers {
  [key: string]: number;
}

/**
 * Subscription tier interface
 */
export interface SubscriptionTier {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  limits: {
    maxContentAccess?: number;
    maxDownloads?: number;
    maxConcurrentStreams?: number;
  };
  adFree: boolean;
}

/**
 * Affiliate category commission interface
 */
export interface AffiliateCategoryCommissions {
  [category: string]: number;
}

/**
 * Platform revenue share interface
 */
export interface PlatformRevShares {
  [platform: string]: number;
}

/**
 * MonetizationSettings document interface
 */
export interface IMonetizationSettings extends Document {
  // Core
  company: Types.ObjectId;
  isActive: boolean;
  defaultCPM: number;
  strategy: MonetizationStrategy;

  // CPM Rate Multipliers
  cpmByAge: CPMMultipliers;
  cpmByIncome: CPMMultipliers;
  cpmByLocation: CPMMultipliers;
  cpmByDevice: CPMMultipliers;

  // Subscription Tiers
  subscriptionTiers: SubscriptionTier[];

  // Affiliate Settings
  affiliateEnabled: boolean;
  affiliateCommissionRate: number;
  affiliateCategories: AffiliateCategoryCommissions;

  // Platform Revenue Sharing
  platformRevShares: PlatformRevShares;

  // Revenue Optimization
  minCPM: number;
  maxCPM: number;
  targetDemographics: string[];
  excludedAdvertisers: string[];
  preferredAdvertisers: string[];

  // Analytics & Performance
  totalSubscribers: number;
  totalMRR: number;
  totalARR: number;
  avgRevenuePerUser: number;
  churnRate: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  effectiveCPMRange: { min: number; max: number };
  subscriptionRevenue: number;
  isProfitable: boolean;
}

/**
 * MonetizationSettings schema definition
 */
const MonetizationSettingsSchema = new Schema<IMonetizationSettings>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      unique: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    defaultCPM: {
      type: Number,
      required: [true, 'Default CPM is required'],
      min: [0.10, 'Default CPM must be at least $0.10'],
      max: [100, 'Default CPM cannot exceed $100'],
      default: 5.0,
    },
    strategy: {
      type: String,
      required: true,
      enum: {
        values: ['AdRevenue', 'Subscriptions', 'Affiliates', 'Hybrid'],
        message: '{VALUE} is not a valid monetization strategy',
      },
      default: 'Hybrid',
    },

    // CPM Rate Multipliers
    cpmByAge: {
      type: Map,
      of: Number,
      default: () => ({
        '18-24': 1.0,
        '25-34': 1.5,
        '35-44': 1.3,
        '45-54': 1.1,
        '55-64': 0.9,
        '65+': 0.8,
      }),
    },
    cpmByIncome: {
      type: Map,
      of: Number,
      default: () => ({
        '<$25K': 0.6,
        '$25K-$50K': 0.8,
        '$50K-$100K': 1.2,
        '$100K-$200K': 1.8,
        '$200K+': 2.5,
      }),
    },
    cpmByLocation: {
      type: Map,
      of: Number,
      default: () => ({
        'North America': 1.5,
        Europe: 1.3,
        Asia: 1.0,
        Other: 0.7,
      }),
    },
    cpmByDevice: {
      type: Map,
      of: Number,
      default: () => ({
        Desktop: 1.2,
        Mobile: 1.0,
        Tablet: 1.1,
      }),
    },

    // Subscription Tiers
    subscriptionTiers: {
      type: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },
          monthlyPrice: {
            type: Number,
            required: true,
            min: [0, 'Monthly price cannot be negative'],
          },
          annualPrice: {
            type: Number,
            required: true,
            min: [0, 'Annual price cannot be negative'],
          },
          features: {
            type: [String],
            default: [],
          },
          limits: {
            maxContentAccess: Number,
            maxDownloads: Number,
            maxConcurrentStreams: Number,
          },
          adFree: {
            type: Boolean,
            required: true,
            default: false,
          },
        },
      ],
      default: [],
    },

    // Affiliate Settings
    affiliateEnabled: {
      type: Boolean,
      required: true,
      default: false,
    },
    affiliateCommissionRate: {
      type: Number,
      required: true,
      default: 5.0,
      min: [0, 'Commission rate cannot be negative'],
      max: [50, 'Commission rate cannot exceed 50%'],
    },
    affiliateCategories: {
      type: Map,
      of: Number,
      default: () => ({
        Tech: 8.0,
        Fashion: 10.0,
        Home: 6.0,
        Beauty: 12.0,
        Fitness: 7.0,
      }),
    },

    // Platform Revenue Sharing
    platformRevShares: {
      type: Map,
      of: Number,
      default: () => ({
        YouTube: 45.0,
        TikTok: 50.0,
        Twitch: 50.0,
        Substack: 10.0,
        Patreon: 12.0,
      }),
    },

    // Revenue Optimization
    minCPM: {
      type: Number,
      required: true,
      default: 1.0,
      min: [0, 'Min CPM cannot be negative'],
    },
    maxCPM: {
      type: Number,
      required: true,
      default: 50.0,
      min: [0, 'Max CPM cannot be negative'],
    },
    targetDemographics: {
      type: [String],
      default: ['25-34', '$100K+', 'North America'],
    },
    excludedAdvertisers: {
      type: [String],
      default: [],
    },
    preferredAdvertisers: {
      type: [String],
      default: [],
    },

    // Analytics & Performance
    totalSubscribers: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Subscribers cannot be negative'],
    },
    totalMRR: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'MRR cannot be negative'],
    },
    totalARR: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'ARR cannot be negative'],
    },
    avgRevenuePerUser: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'ARPU cannot be negative'],
    },
    churnRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Churn rate cannot be negative'],
      max: [100, 'Churn rate cannot exceed 100%'],
    },
  },
  {
    timestamps: true,
    collection: 'monetizationsettings',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
MonetizationSettingsSchema.index({ company: 1 }); // Unique company settings
MonetizationSettingsSchema.index({ isActive: 1 }); // Active monetization configs

/**
 * Virtual field: effectiveCPMRange
 * COMMENTED OUT due to TypeScript Map.values() type resolution issues
 * Calculate this in the API response instead
 */
/*
MonetizationSettingsSchema.virtual('effectiveCPMRange').get(function (this: IMonetizationSettings): {
  min: number;
  max: number;
} {
  const ageValues = [...this.cpmByAge.values()] as number[];
  const incomeValues = [...this.cpmByIncome.values()] as number[];
  const locationValues = [...this.cpmByLocation.values()] as number[];
  const deviceValues = [...this.cpmByDevice.values()] as number[];

  const minAge = ageValues.length > 0 ? ageValues.reduce((a, b) => a < b ? a : b) : 1;
  const minIncome = incomeValues.length > 0 ? incomeValues.reduce((a, b) => a < b ? a : b) : 1;
  const minLocation = locationValues.length > 0 ? locationValues.reduce((a, b) => a < b ? a : b) : 1;
  const minDevice = deviceValues.length > 0 ? deviceValues.reduce((a, b) => a < b ? a : b) : 1;
  const minEffective = this.defaultCPM * minAge * minIncome * minLocation * minDevice;

  const maxAge = ageValues.length > 0 ? ageValues.reduce((a, b) => a > b ? a : b) : 1;
  const maxIncome = incomeValues.length > 0 ? incomeValues.reduce((a, b) => a > b ? a : b) : 1;
  const maxLocation = locationValues.length > 0 ? locationValues.reduce((a, b) => a > b ? a : b) : 1;
  const maxDevice = deviceValues.length > 0 ? deviceValues.reduce((a, b) => a > b ? a : b) : 1;
  const maxEffective = this.defaultCPM * maxAge * maxIncome * maxLocation * maxDevice;

  return {
    min: Math.max(this.minCPM, Math.round(minEffective * 100) / 100),
    max: Math.min(this.maxCPM, Math.round(maxEffective * 100) / 100),
  };
});
*/

/**
 * Virtual field: subscriptionRevenue
 */
MonetizationSettingsSchema.virtual('subscriptionRevenue').get(function (this: IMonetizationSettings): number {
  return this.totalMRR + this.totalARR / 12;
});

/**
 * Virtual field: isProfitable
 */
MonetizationSettingsSchema.virtual('isProfitable').get(function (this: IMonetizationSettings): boolean {
  // Consider profitable if churn < 5% and ARPU > $5
  return this.churnRate < 5 && this.avgRevenuePerUser > 5;
});

/**
 * Pre-save hook: Calculate ARR from MRR
 */
MonetizationSettingsSchema.pre<IMonetizationSettings>('save', function (next) {
  // Calculate ARR from MRR if not explicitly set
  if (this.totalMRR > 0 && this.totalARR === 0) {
    this.totalARR = this.totalMRR * 12;
  }

  // Ensure min/max CPM boundaries are logical
  if (this.minCPM > this.maxCPM) {
    const temp = this.minCPM;
    this.minCPM = this.maxCPM;
    this.maxCPM = temp;
  }

  next();
});

/**
 * MonetizationSettings model
 */
const MonetizationSettings: Model<IMonetizationSettings> =
  mongoose.models.MonetizationSettings ||
  mongoose.model<IMonetizationSettings>('MonetizationSettings', MonetizationSettingsSchema);

export default MonetizationSettings;
