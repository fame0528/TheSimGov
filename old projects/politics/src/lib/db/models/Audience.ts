/**
 * @file src/lib/db/models/Audience.ts
 * @description Audience demographics and engagement model for Media companies
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Audience model representing the follower base and viewership demographics for Media
 * industry companies. Tracks audience size, growth rate, demographics breakdown (age,
 * income, location, political alignment), engagement metrics (avg watch time, interaction
 * rate), retention/churn mechanics, and audience health scoring. Critical for monetization
 * as ad CPM rates and sponsorship deals directly correlate with audience quality.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (Media industry)
 * - totalFollowers: Cumulative follower count
 * - activeFollowers: Currently engaged followers
 * - monthlyGrowth: New followers this month
 * - monthlyChurn: Lost followers this month
 * - growthRate: % monthly growth
 * - churnRate: % monthly churn
 * 
 * Demographics (% breakdowns):
 * - ageGroups: { 13-17, 18-24, 25-34, 35-44, 45-54, 55-64, 65+ }
 * - incomeGroups: { <25k, 25-50k, 50-75k, 75-100k, 100-150k, >150k }
 * - geographicBreakdown: { Local, Regional, National, International }
 * - politicalAlignment: { Left, Center, Right, Nonpartisan }
 * - genderBreakdown: { Male, Female, Other }
 * 
 * Engagement Metrics:
 * - avgViewsPerFollower: Monthly avg views per follower
 * - avgWatchTime: Avg watch/listen time (seconds)
 * - avgInteractionRate: % followers who interact (like/share/comment)
 * - avgSharesPerFollower: Avg shares per follower
 * - avgCommentsPerFollower: Avg comments per follower
 * - repeatVisitorRate: % returning viewers
 * - loyalFollowerPercent: % super engaged (>10 interactions/mo)
 * 
 * Retention Metrics:
 * - retentionRate: % staying after 30 days
 * - churnReasons: Array of churn reason counts
 * - avgFollowerLifetime: Avg months before churn
 * - lifetimeValuePerFollower: Avg LTV per follower
 * 
 * Audience Health:
 * - healthScore: Overall audience quality (0-100)
 * - engagementHealth: Engagement quality (0-100)
 * - growthHealth: Growth sustainability (0-100)
 * - demographicHealth: Advertiser-friendly demographics (0-100)
 * - brandSafetyScore: Brand safety for advertisers (0-100)
 * 
 * USAGE:
 * ```typescript
 * import Audience from '@/lib/db/models/Audience';
 * 
 * // Track audience demographics
 * const audience = await Audience.findOne({ company: companyId });
 * await audience.updateOne({
 *   $inc: { totalFollowers: 1000, activeFollowers: 850 },
 *   $set: {
 *     ageGroups: { '25-34': 35, '18-24': 25, '35-44': 20, ... },
 *     incomeGroups: { '75-100k': 30, '50-75k': 25, ... }
 *   }
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Health score: (engagement × 0.4 + growth × 0.3 + demographics × 0.3)
 * - Churn rate healthy: <5%, concerning: 8-12%, critical: >15%
 * - Growth rate sustainable: 5-10%/mo, excellent: >15%/mo
 * - High-value demographics: 25-54 age, $50k+ income (higher CPM)
 * - Brand safety: Low controversy, high fact-check scores, family-friendly
 * - LTV calculation: (avg lifetime months × monthly views × CPM) / 1000
 * - Loyal followers: 10+ interactions/month (worth 5x avg CPM)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Age group demographics interface
 */
interface AgeGroups {
  '13-17': number;
  '18-24': number;
  '25-34': number;
  '35-44': number;
  '45-54': number;
  '55-64': number;
  '65+': number;
}

/**
 * Income group demographics interface
 */
interface IncomeGroups {
  '<25k': number;
  '25-50k': number;
  '50-75k': number;
  '75-100k': number;
  '100-150k': number;
  '>150k': number;
}

/**
 * Geographic breakdown interface
 */
interface GeographicBreakdown {
  Local: number;
  Regional: number;
  National: number;
  International: number;
}

/**
 * Political alignment interface
 */
interface PoliticalAlignment {
  Left: number;
  Center: number;
  Right: number;
  Nonpartisan: number;
}

/**
 * Gender breakdown interface
 */
interface GenderBreakdown {
  Male: number;
  Female: number;
  Other: number;
}

/**
 * Audience document interface
 */
export interface IAudience extends Document {
  // Core
  company: Types.ObjectId;
  totalFollowers: number;
  activeFollowers: number;
  monthlyGrowth: number;
  monthlyChurn: number;
  growthRate: number;
  churnRate: number;

  // Demographics (% breakdowns)
  ageGroups: AgeGroups;
  incomeGroups: IncomeGroups;
  geographicBreakdown: GeographicBreakdown;
  politicalAlignment: PoliticalAlignment;
  genderBreakdown: GenderBreakdown;

  // Engagement Metrics
  avgViewsPerFollower: number;
  avgWatchTime: number;
  avgInteractionRate: number;
  avgSharesPerFollower: number;
  avgCommentsPerFollower: number;
  repeatVisitorRate: number;
  loyalFollowerPercent: number;

  // Retention Metrics
  retentionRate: number;
  churnReasons: string[];
  avgFollowerLifetime: number;
  lifetimeValuePerFollower: number;

  // Audience Health
  healthScore: number;
  engagementHealth: number;
  growthHealth: number;
  demographicHealth: number;
  brandSafetyScore: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  netGrowth: number;
  monthlyGrowthPercent: number;
  highValueFollowerPercent: number;
  advertiserAppealScore: number;
}

/**
 * Audience schema definition
 */
const AudienceSchema = new Schema<IAudience>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      unique: true, // One audience per company
      index: true,
    },
    totalFollowers: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total followers cannot be negative'],
      index: true,
    },
    activeFollowers: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Active followers cannot be negative'],
    },
    monthlyGrowth: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly growth cannot be negative'],
    },
    monthlyChurn: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly churn cannot be negative'],
    },
    growthRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Growth rate cannot be negative'],
    },
    churnRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Churn rate cannot be negative'],
      max: [100, 'Churn rate cannot exceed 100%'],
    },

    // Demographics (% breakdowns)
    ageGroups: {
      '13-17': { type: Number, default: 0, min: 0, max: 100 },
      '18-24': { type: Number, default: 0, min: 0, max: 100 },
      '25-34': { type: Number, default: 0, min: 0, max: 100 },
      '35-44': { type: Number, default: 0, min: 0, max: 100 },
      '45-54': { type: Number, default: 0, min: 0, max: 100 },
      '55-64': { type: Number, default: 0, min: 0, max: 100 },
      '65+': { type: Number, default: 0, min: 0, max: 100 },
    },
    incomeGroups: {
      '<25k': { type: Number, default: 0, min: 0, max: 100 },
      '25-50k': { type: Number, default: 0, min: 0, max: 100 },
      '50-75k': { type: Number, default: 0, min: 0, max: 100 },
      '75-100k': { type: Number, default: 0, min: 0, max: 100 },
      '100-150k': { type: Number, default: 0, min: 0, max: 100 },
      '>150k': { type: Number, default: 0, min: 0, max: 100 },
    },
    geographicBreakdown: {
      Local: { type: Number, default: 0, min: 0, max: 100 },
      Regional: { type: Number, default: 0, min: 0, max: 100 },
      National: { type: Number, default: 0, min: 0, max: 100 },
      International: { type: Number, default: 0, min: 0, max: 100 },
    },
    politicalAlignment: {
      Left: { type: Number, default: 0, min: 0, max: 100 },
      Center: { type: Number, default: 0, min: 0, max: 100 },
      Right: { type: Number, default: 0, min: 0, max: 100 },
      Nonpartisan: { type: Number, default: 0, min: 0, max: 100 },
    },
    genderBreakdown: {
      Male: { type: Number, default: 0, min: 0, max: 100 },
      Female: { type: Number, default: 0, min: 0, max: 100 },
      Other: { type: Number, default: 0, min: 0, max: 100 },
    },

    // Engagement Metrics
    avgViewsPerFollower: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Avg views per follower cannot be negative'],
    },
    avgWatchTime: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Avg watch time cannot be negative'],
    },
    avgInteractionRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Avg interaction rate cannot be negative'],
      max: [100, 'Avg interaction rate cannot exceed 100%'],
    },
    avgSharesPerFollower: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Avg shares per follower cannot be negative'],
    },
    avgCommentsPerFollower: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Avg comments per follower cannot be negative'],
    },
    repeatVisitorRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Repeat visitor rate cannot be negative'],
      max: [100, 'Repeat visitor rate cannot exceed 100%'],
    },
    loyalFollowerPercent: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Loyal follower percent cannot be negative'],
      max: [100, 'Loyal follower percent cannot exceed 100%'],
    },

    // Retention Metrics
    retentionRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Retention rate cannot be negative'],
      max: [100, 'Retention rate cannot exceed 100%'],
    },
    churnReasons: {
      type: [String],
      default: [],
    },
    avgFollowerLifetime: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Avg follower lifetime cannot be negative'],
    },
    lifetimeValuePerFollower: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Lifetime value per follower cannot be negative'],
    },

    // Audience Health
    healthScore: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Health score cannot be negative'],
      max: [100, 'Health score cannot exceed 100'],
      index: true,
    },
    engagementHealth: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Engagement health cannot be negative'],
      max: [100, 'Engagement health cannot exceed 100'],
    },
    growthHealth: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Growth health cannot be negative'],
      max: [100, 'Growth health cannot exceed 100'],
    },
    demographicHealth: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Demographic health cannot be negative'],
      max: [100, 'Demographic health cannot exceed 100'],
    },
    brandSafetyScore: {
      type: Number,
      required: true,
      default: 80, // Default safe
      min: [0, 'Brand safety score cannot be negative'],
      max: [100, 'Brand safety score cannot exceed 100'],
    },
  },
  {
    timestamps: true,
    collection: 'audiences',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
AudienceSchema.index({ healthScore: -1 }); // Audience health ranking
AudienceSchema.index({ totalFollowers: -1 }); // Largest audiences

/**
 * Virtual field: netGrowth
 * 
 * @description
 * Net follower growth (growth - churn)
 * 
 * @returns {number} Net growth count
 */
AudienceSchema.virtual('netGrowth').get(function (this: IAudience): number {
  return this.monthlyGrowth - this.monthlyChurn;
});

/**
 * Virtual field: monthlyGrowthPercent
 * 
 * @description
 * Monthly growth percentage
 * 
 * @returns {number} Growth percentage
 */
AudienceSchema.virtual('monthlyGrowthPercent').get(function (this: IAudience): number {
  if (this.activeFollowers === 0) return 0;
  return Math.round((this.monthlyGrowth / this.activeFollowers) * 10000) / 100;
});

/**
 * Virtual field: highValueFollowerPercent
 * 
 * @description
 * % of followers in high-value demographics (25-54 age, $50k+ income)
 * 
 * @returns {number} High-value follower percentage
 */
AudienceSchema.virtual('highValueFollowerPercent').get(function (this: IAudience): number {
  const highValueAge =
    (this.ageGroups['25-34'] || 0) + (this.ageGroups['35-44'] || 0) + (this.ageGroups['45-54'] || 0);

  const highValueIncome =
    (this.incomeGroups['50-75k'] || 0) +
    (this.incomeGroups['75-100k'] || 0) +
    (this.incomeGroups['100-150k'] || 0) +
    (this.incomeGroups['>150k'] || 0);

  // Average of high-value age and income
  return Math.round(((highValueAge + highValueIncome) / 2) * 100) / 100;
});

/**
 * Virtual field: advertiserAppealScore
 * 
 * @description
 * Overall advertiser appeal (demographics + brand safety + engagement)
 * 
 * @returns {number} Advertiser appeal score (0-100)
 */
AudienceSchema.virtual('advertiserAppealScore').get(function (this: IAudience): number {
  const demographicScore = this.demographicHealth;
  const safetyScore = this.brandSafetyScore;
  const engagementScore = this.engagementHealth;

  return Math.round(demographicScore * 0.4 + safetyScore * 0.3 + engagementScore * 0.3);
});

/**
 * Pre-save hook: Calculate derived metrics
 */
AudienceSchema.pre<IAudience>('save', function (next) {
  // Calculate growth rate
  if (this.activeFollowers > 0) {
    this.growthRate = Math.round((this.monthlyGrowth / this.activeFollowers) * 10000) / 100;
  }

  // Calculate churn rate
  if (this.totalFollowers > 0) {
    this.churnRate = Math.round((this.monthlyChurn / this.totalFollowers) * 10000) / 100;
  }

  // Calculate engagement health (0-100)
  // Based on: interaction rate (40%), repeat visitors (30%), loyal followers (30%)
  const interactionScore = Math.min(this.avgInteractionRate * 5, 40); // 8% = 40 points
  const repeatScore = this.repeatVisitorRate * 0.3; // 0-30 points
  const loyalScore = this.loyalFollowerPercent * 0.3; // 0-30 points
  this.engagementHealth = Math.min(interactionScore + repeatScore + loyalScore, 100);

  // Calculate growth health (0-100)
  // Based on: growth rate (60%), churn rate (40% inverse)
  const growthScore = Math.min(this.growthRate * 6, 60); // 10% = 60 points
  const churnPenalty = this.churnRate * 4; // 10% churn = -40 points
  this.growthHealth = Math.max(0, Math.min(growthScore + (40 - churnPenalty), 100));

  // Calculate demographic health (0-100)
  // High-value demographics: 25-54 age (60%), $50k+ income (40%)
  const highValueAge =
    (this.ageGroups['25-34'] || 0) + (this.ageGroups['35-44'] || 0) + (this.ageGroups['45-54'] || 0);

  const highValueIncome =
    (this.incomeGroups['50-75k'] || 0) +
    (this.incomeGroups['75-100k'] || 0) +
    (this.incomeGroups['100-150k'] || 0) +
    (this.incomeGroups['>150k'] || 0);

  this.demographicHealth = Math.round(highValueAge * 0.6 + highValueIncome * 0.4);

  // Calculate overall health score
  this.healthScore = Math.round(
    this.engagementHealth * 0.4 + this.growthHealth * 0.3 + this.demographicHealth * 0.3
  );

  // Calculate avg follower lifetime (inverse of churn rate)
  if (this.churnRate > 0) {
    this.avgFollowerLifetime = Math.floor(100 / this.churnRate);
  } else {
    this.avgFollowerLifetime = 36; // Default 36 months
  }

  // Calculate lifetime value per follower
  // LTV = (avg lifetime months × monthly views × CPM) / 1000
  const avgCPM = 5; // $5 default CPM
  const monthlyViews = this.avgViewsPerFollower;
  this.lifetimeValuePerFollower = Math.round(
    (this.avgFollowerLifetime * monthlyViews * avgCPM) / 1000
  );

  next();
});

/**
 * Audience model
 * 
 * @example
 * ```typescript
 * import Audience from '@/lib/db/models/Audience';
 * 
 * // Create audience for media company
 * const audience = await Audience.create({
 *   company: companyId,
 *   totalFollowers: 10000,
 *   activeFollowers: 8500,
 *   ageGroups: {
 *     '25-34': 35,
 *     '18-24': 25,
 *     '35-44': 20,
 *     '45-54': 10,
 *     '55-64': 5,
 *     '65+': 3,
 *     '13-17': 2
 *   },
 *   incomeGroups: {
 *     '50-75k': 30,
 *     '75-100k': 25,
 *     '25-50k': 20,
 *     '100-150k': 15,
 *     '>150k': 7,
 *     '<25k': 3
 *   }
 * });
 * 
 * // Track growth
 * await audience.updateOne({
 *   $inc: {
 *     totalFollowers: 500,
 *     activeFollowers: 425,
 *     monthlyGrowth: 500
 *   }
 * });
 * 
 * // Check health metrics
 * console.log(audience.healthScore); // Overall health
 * console.log(audience.highValueFollowerPercent); // Premium demo %
 * console.log(audience.advertiserAppealScore); // Advertiser value
 * console.log(audience.lifetimeValuePerFollower); // LTV per follower
 * ```
 */
const Audience: Model<IAudience> =
  mongoose.models.Audience || mongoose.model<IAudience>('Audience', AudienceSchema);

export default Audience;
