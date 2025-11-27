/**
 * @file src/lib/utils/media/mediaConstants.ts
 * @description Media domain constants for cross-platform normalization and calculations
 * @created 2025-11-25
 * @updated 2025-11-25
 * @version 1.0.0
 * @fid FID-20251124-001
 *
 * OVERVIEW:
 * Centralized constants for media domain utilities including platform-specific scale ranges,
 * threshold values, default parameters, and tunable coefficients. Ensures consistency across
 * all media analytics and calculation functions.
 *
 * FEATURES:
 * - Platform-specific scale ranges for normalization
 * - Engagement rate benchmarks by platform
 * - Monetization thresholds and multipliers
 * - Virality coefficients and decay rates
 * - Retention and churn benchmarks
 * - Algorithm optimization parameters
 *
 * USAGE:
 * import { PLATFORM_SCALE_RANGES, ENGAGEMENT_BENCHMARKS } from '@/lib/utils/media/mediaConstants';
 *
 * const normalizedFollowers = normalize(
 *   rawFollowers,
 *   PLATFORM_SCALE_RANGES.YouTube.followers
 * );
 */

import type { PlatformType } from '@/lib/types/media';

// ============================================================================
// PLATFORM SCALE RANGES
// ============================================================================

/**
 * Platform-specific scale ranges for metric normalization
 * 
 * Different platforms operate at different scales:
 * - YouTube: Millions of subscribers, lower engagement
 * - Instagram: Hundreds of thousands, medium engagement
 * - TikTok: Tens of millions possible, very high engagement
 * 
 * Ranges define [min, max] for logarithmic or linear scaling to 0-100
 */
export const PLATFORM_SCALE_RANGES: Record<
  PlatformType,
  {
    followers: [number, number];
    engagement: [number, number]; // Percentage ranges
    revenue: [number, number];   // Monthly revenue ranges
    reach: [number, number];     // Monthly reach ranges
    cpm: [number, number];       // CPM ranges in dollars
  }
> = {
  YouTube: {
    followers: [1000, 10_000_000],     // 1K to 10M subscribers
    engagement: [0.5, 15],              // 0.5% to 15% engagement
    revenue: [100, 500_000],            // $100 to $500K monthly
    reach: [10_000, 50_000_000],        // 10K to 50M monthly reach
    cpm: [0.5, 25],                     // $0.50 to $25 CPM
  },
  
  Instagram: {
    followers: [500, 5_000_000],        // 500 to 5M followers
    engagement: [1, 25],                // 1% to 25% engagement
    revenue: [50, 300_000],             // $50 to $300K monthly
    reach: [5_000, 30_000_000],         // 5K to 30M monthly reach
    cpm: [1, 20],                       // $1 to $20 CPM
  },
  
  TikTok: {
    followers: [1000, 50_000_000],      // 1K to 50M followers
    engagement: [3, 50],                // 3% to 50% engagement (very high)
    revenue: [25, 400_000],             // $25 to $400K monthly
    reach: [10_000, 100_000_000],       // 10K to 100M monthly reach
    cpm: [0.25, 15],                    // $0.25 to $15 CPM
  },
  
  Twitter: {
    followers: [100, 10_000_000],       // 100 to 10M followers
    engagement: [0.5, 10],              // 0.5% to 10% engagement
    revenue: [50, 200_000],             // $50 to $200K monthly
    reach: [5_000, 50_000_000],         // 5K to 50M monthly reach
    cpm: [2, 30],                       // $2 to $30 CPM
  },
  
  Facebook: {
    followers: [500, 10_000_000],       // 500 to 10M followers
    engagement: [0.5, 12],              // 0.5% to 12% engagement
    revenue: [100, 250_000],            // $100 to $250K monthly
    reach: [10_000, 40_000_000],        // 10K to 40M monthly reach
    cpm: [1, 20],                       // $1 to $20 CPM
  },
  
  LinkedIn: {
    followers: [100, 2_000_000],        // 100 to 2M followers
    engagement: [2, 20],                // 2% to 20% engagement (B2B higher)
    revenue: [200, 500_000],            // $200 to $500K monthly (B2B premium)
    reach: [5_000, 15_000_000],         // 5K to 15M monthly reach
    cpm: [5, 50],                       // $5 to $50 CPM (B2B premium)
  },
  
  Podcast: {
    followers: [100, 1_000_000],        // 100 to 1M subscribers
    engagement: [5, 40],                // 5% to 40% engagement (dedicated)
    revenue: [50, 200_000],             // $50 to $200K monthly
    reach: [1_000, 5_000_000],          // 1K to 5M monthly downloads
    cpm: [10, 80],                      // $10 to $80 CPM (audio premium)
  },
  
  Blog: {
    followers: [50, 500_000],           // 50 to 500K email subscribers
    engagement: [2, 30],                // 2% to 30% engagement (email opens)
    revenue: [25, 150_000],             // $25 to $150K monthly
    reach: [1_000, 2_000_000],          // 1K to 2M monthly visitors
    cpm: [3, 40],                       // $3 to $40 CPM
  },
};

// ============================================================================
// ENGAGEMENT BENCHMARKS
// ============================================================================

/**
 * Engagement rate benchmarks by platform
 * 
 * Used to classify engagement as poor/average/good/excellent
 * Based on industry standards and platform-specific norms
 */
export const ENGAGEMENT_BENCHMARKS: Record<
  PlatformType,
  {
    poor: number;      // Below this = poor engagement
    average: number;   // Typical engagement rate
    good: number;      // Above average engagement
    excellent: number; // Top-tier engagement
  }
> = {
  YouTube: { poor: 1, average: 3, good: 6, excellent: 10 },
  Instagram: { poor: 2, average: 5, good: 10, excellent: 18 },
  TikTok: { poor: 5, average: 12, good: 20, excellent: 35 },
  Twitter: { poor: 0.5, average: 2, good: 5, excellent: 8 },
  Facebook: { poor: 1, average: 3, good: 6, excellent: 10 },
  LinkedIn: { poor: 2, average: 5, good: 10, excellent: 15 },
  Podcast: { poor: 8, average: 15, good: 25, excellent: 35 },
  Blog: { poor: 3, average: 8, good: 15, excellent: 25 },
};

// ============================================================================
// MONETIZATION THRESHOLDS
// ============================================================================

/**
 * Minimum thresholds for monetization eligibility
 * Platform-specific requirements before monetization can be enabled
 */
export const MONETIZATION_THRESHOLDS: Record<
  PlatformType,
  {
    minFollowers: number;
    minMonthlyViews: number;
    minEngagementRate: number;
    minContentCount: number;
  }
> = {
  YouTube: {
    minFollowers: 1000,
    minMonthlyViews: 4000,
    minEngagementRate: 1,
    minContentCount: 10,
  },
  
  Instagram: {
    minFollowers: 1000,
    minMonthlyViews: 10_000,
    minEngagementRate: 2,
    minContentCount: 20,
  },
  
  TikTok: {
    minFollowers: 10_000,
    minMonthlyViews: 100_000,
    minEngagementRate: 5,
    minContentCount: 50,
  },
  
  Twitter: {
    minFollowers: 500,
    minMonthlyViews: 5_000,
    minEngagementRate: 1,
    minContentCount: 50,
  },
  
  Facebook: {
    minFollowers: 10_000,
    minMonthlyViews: 50_000,
    minEngagementRate: 1.5,
    minContentCount: 25,
  },
  
  LinkedIn: {
    minFollowers: 500,
    minMonthlyViews: 5_000,
    minEngagementRate: 2,
    minContentCount: 15,
  },
  
  Podcast: {
    minFollowers: 1000,
    minMonthlyViews: 5_000,
    minEngagementRate: 5,
    minContentCount: 10,
  },
  
  Blog: {
    minFollowers: 500,
    minMonthlyViews: 10_000,
    minEngagementRate: 3,
    minContentCount: 20,
  },
};

/**
 * Revenue multipliers by platform
 * Adjusts base CPM calculations for platform-specific monetization potential
 */
export const REVENUE_MULTIPLIERS: Record<PlatformType, number> = {
  YouTube: 1.0,      // Baseline
  Instagram: 0.8,    // Slightly lower
  TikTok: 0.6,       // Lower CPMs
  Twitter: 0.9,      // Competitive
  Facebook: 0.85,    // Good but declining
  LinkedIn: 1.5,     // B2B premium
  Podcast: 1.3,      // Audio premium
  Blog: 1.1,         // Written content premium
};

// ============================================================================
// VIRALITY COEFFICIENTS
// ============================================================================

/**
 * Virality calculation coefficients
 * Used in viral loop and K-factor calculations
 */
export const VIRALITY_COEFFICIENTS = {
  /** Minimum shares/views ratio for viral content */
  MIN_VIRAL_RATIO: 0.01,
  
  /** Excellent shares/views ratio (top 10%) */
  EXCELLENT_VIRAL_RATIO: 0.05,
  
  /** Viral loop cycle multiplier (geometric growth) */
  VIRAL_LOOP_MULTIPLIER: 1.5,
  
  /** Maximum viral loops before saturation */
  MAX_VIRAL_LOOPS: 5,
  
  /** Decay rate per viral loop cycle (exponential decay) */
  VIRAL_DECAY_RATE: 0.3,
  
  /** Minimum K-factor for sustained viral growth */
  MIN_SUSTAINED_KFACTOR: 1.0,
  
  /** Platform-specific viral multipliers */
  PLATFORM_VIRAL_MULTIPLIERS: {
    YouTube: 1.0,
    Instagram: 1.2,
    TikTok: 2.0,      // TikTok's algorithm favors virality
    Twitter: 1.5,
    Facebook: 0.8,    // Reduced organic reach
    LinkedIn: 0.6,
    Podcast: 0.4,     // Lower shareability
    Blog: 0.5,
  } as Record<PlatformType, number>,
};

// ============================================================================
// CONTENT AGING & DECAY
// ============================================================================

/**
 * Content decay rate parameters
 * Models engagement decline over time (half-life calculations)
 */
export const CONTENT_DECAY_RATES = {
  /** Exponential decay rates by content type (daily %) */
  EXPONENTIAL_RATES: {
    video: 0.05,       // 5% daily decay
    image: 0.08,       // 8% daily decay (faster)
    article: 0.03,     // 3% daily decay (slower)
    podcast: 0.04,     // 4% daily decay
    livestream: 0.15,  // 15% daily decay (very fast)
    story: 0.5,        // 50% daily decay (24hr format)
    reel: 0.12,        // 12% daily decay (fast)
    short: 0.12,       // 12% daily decay (fast)
  },
  
  /** Linear decay rates by content type (daily absolute decrease) */
  LINEAR_RATES: {
    video: 0.02,       // 2% daily
    image: 0.04,       // 4% daily
    article: 0.01,     // 1% daily
    podcast: 0.015,    // 1.5% daily
    livestream: 0.10,  // 10% daily
    story: 0.8,        // 80% daily (24hr)
    reel: 0.06,        // 6% daily
    short: 0.06,       // 6% daily
  },
  
  /** Minimum engagement floor (% of initial) */
  ENGAGEMENT_FLOOR: 0.1, // Never drops below 10% of initial
  
  /** Revitalization potential factors */
  REVITALIZATION_FACTORS: {
    evergreen: 0.9,    // Evergreen content retains 90% revitalization potential
    trending: 0.3,     // Trending content loses potential fast
    educational: 0.8,  // Educational retains well
    entertainment: 0.5, // Entertainment medium retention
    news: 0.1,         // News loses potential very fast
  },
};

// ============================================================================
// RETENTION & CHURN
// ============================================================================

/**
 * Retention and churn benchmarks
 * Industry-standard retention targets and risk thresholds
 */
export const RETENTION_BENCHMARKS = {
  /** Good retention rates by time window */
  GOOD_RETENTION: {
    day7: 0.80,    // 80% retained after 7 days
    day30: 0.60,   // 60% retained after 30 days
    day90: 0.40,   // 40% retained after 90 days
    day365: 0.25,  // 25% retained after 1 year
  },
  
  /** Acceptable churn rates (monthly %) */
  ACCEPTABLE_CHURN: {
    subscription: 0.05,  // 5% monthly churn
    free: 0.10,          // 10% monthly churn
    hybrid: 0.07,        // 7% monthly churn
  },
  
  /** Critical churn thresholds (action required) */
  CRITICAL_CHURN: {
    subscription: 0.10,  // 10% monthly = critical
    free: 0.20,          // 20% monthly = critical
    hybrid: 0.15,        // 15% monthly = critical
  },
};

/**
 * Cohort retention parameters
 * Used in cohort retention analysis calculations
 */
export const COHORT_PARAMETERS = {
  /** Standard cohort time windows (days) */
  TIME_WINDOWS: [7, 30, 90, 365],
  
  /** Minimum cohort size for statistical significance */
  MIN_COHORT_SIZE: 100,
  
  /** Confidence level for LTV projections */
  DEFAULT_CONFIDENCE: 0.95,
  
  /** Decay rate for future revenue discounting */
  LTV_DISCOUNT_RATE: 0.1, // 10% annual discount
};

// ============================================================================
// ALGORITHM OPTIMIZATION
// ============================================================================

/**
 * Algorithm adaptation scoring weights
 * Weights for different algorithm alignment factors
 */
export const ALGORITHM_WEIGHTS = {
  /** Length alignment importance */
  LENGTH_WEIGHT: 0.25,
  
  /** Timing alignment importance */
  TIMING_WEIGHT: 0.20,
  
  /** Format alignment importance */
  FORMAT_WEIGHT: 0.25,
  
  /** Topic alignment importance */
  TOPIC_WEIGHT: 0.30,
  
  /** Length tolerance (% deviation acceptable) */
  LENGTH_TOLERANCE: 0.15, // 15% deviation
  
  /** Timing tolerance (minutes from optimal) */
  TIMING_TOLERANCE: 60, // 60 minutes
};

/**
 * Platform algorithm preferences
 * Platform-specific algorithm optimization insights
 */
export const ALGORITHM_PREFERENCES = {
  YouTube: {
    preferredLength: 600,        // 10 minutes (sweet spot)
    preferredTimes: ['06:00', '14:00', '19:00'],
    preferredFormats: ['long-form', 'tutorial', 'vlog'],
  },
  
  Instagram: {
    preferredLength: 60,         // 60 seconds
    preferredTimes: ['11:00', '15:00', '21:00'],
    preferredFormats: ['reel', 'carousel', 'story'],
  },
  
  TikTok: {
    preferredLength: 30,         // 30 seconds
    preferredTimes: ['07:00', '12:00', '18:00', '22:00'],
    preferredFormats: ['short', 'dance', 'comedy'],
  },
  
  Twitter: {
    preferredLength: 120,        // 2 minutes (video)
    preferredTimes: ['08:00', '12:00', '17:00'],
    preferredFormats: ['thread', 'poll', 'quote'],
  },
  
  Facebook: {
    preferredLength: 180,        // 3 minutes
    preferredTimes: ['09:00', '13:00', '20:00'],
    preferredFormats: ['video', 'link', 'photo'],
  },
  
  LinkedIn: {
    preferredLength: 300,        // 5 minutes
    preferredTimes: ['08:00', '12:00', '17:00'],
    preferredFormats: ['article', 'carousel', 'poll'],
  },
  
  Podcast: {
    preferredLength: 2400,       // 40 minutes
    preferredTimes: ['06:00', '12:00', '18:00'],
    preferredFormats: ['interview', 'solo', 'panel'],
  },
  
  Blog: {
    preferredLength: 1200,       // 20 minutes read time
    preferredTimes: ['09:00', '14:00'],
    preferredFormats: ['how-to', 'listicle', 'deep-dive'],
  },
};

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

/**
 * Monetization risk thresholds
 * Used in risk scoring and diversification analysis
 */
export const RISK_THRESHOLDS = {
  /** Revenue volatility (coefficient of variation %) */
  LOW_VOLATILITY: 0.15,      // <15% = low risk
  MEDIUM_VOLATILITY: 0.30,   // 15-30% = medium risk
  HIGH_VOLATILITY: 0.30,     // >30% = high risk
  
  /** Diversification (HHI score) */
  WELL_DIVERSIFIED: 0.25,    // HHI <0.25 = well diversified
  MODERATELY_DIVERSIFIED: 0.50, // HHI 0.25-0.50 = moderate
  CONCENTRATED: 0.50,        // HHI >0.50 = concentrated
  
  /** Concentration risk (% from single source) */
  LOW_CONCENTRATION: 0.40,   // <40% = low risk
  MEDIUM_CONCENTRATION: 0.60, // 40-60% = medium risk
  HIGH_CONCENTRATION: 0.60,  // >60% = high risk
  
  /** Sustainability score thresholds */
  SUSTAINABLE: 70,           // ≥70 = sustainable
  AT_RISK: 50,               // 50-70 = at risk
  UNSUSTAINABLE: 50,         // <50 = unsustainable
};

// ============================================================================
// FORECASTING PARAMETERS
// ============================================================================

/**
 * Churn forecasting parameters
 * Used in time-series forecasting algorithms
 */
export const FORECASTING_PARAMETERS = {
  /** Exponential smoothing alpha (trend component) */
  ALPHA: 0.3,
  
  /** Beta parameter (seasonal component) */
  BETA: 0.1,
  
  /** Gamma parameter (dampening) */
  GAMMA: 0.05,
  
  /** Minimum historical data points required */
  MIN_HISTORY: 6, // 6 months minimum
  
  /** Maximum forecast horizon (months) */
  MAX_FORECAST: 12,
  
  /** Default confidence intervals */
  CONFIDENCE_INTERVALS: [0.80, 0.90, 0.95],
};

// ============================================================================
// INFLUENCER ROI
// ============================================================================

/**
 * Influencer ROI calculation parameters
 * Used in multi-touch attribution and ROI analysis
 */
export const INFLUENCER_ROI_PARAMETERS = {
  /** Attribution model time decay rates (days) */
  TIME_DECAY_HALF_LIFE: 7, // 7 days for 50% decay
  
  /** Linear attribution equal weight */
  LINEAR_ATTRIBUTION_WEIGHT: 1.0,
  
  /** First-touch attribution boost */
  FIRST_TOUCH_BOOST: 1.5,
  
  /** Last-touch attribution boost */
  LAST_TOUCH_BOOST: 1.3,
  
  /** Default LTV multiplier for ROI */
  DEFAULT_LTV_MULTIPLIER: 3.0, // 3x first purchase value
  
  /** Average customer lifetime (days) */
  AVG_CUSTOMER_LIFETIME: 730, // 2 years
  
  /** Good ROI threshold (%) */
  GOOD_ROI: 200, // 200% = 2x return
  
  /** Excellent ROI threshold (%) */
  EXCELLENT_ROI: 500, // 500% = 5x return
};

// ============================================================================
// DEFAULT PARAMETERS
// ============================================================================

/**
 * Default parameters for utility functions
 * Used when optional parameters not provided
 */
export const DEFAULT_PARAMETERS = {
  /** Default seed for deterministic calculations */
  DEFAULT_SEED: 0,
  
  /** Default window size for volatility calculations */
  DEFAULT_WINDOW_SIZE: 30,
  
  /** Default confidence level for forecasts */
  DEFAULT_CONFIDENCE: 0.95,
  
  /** Default projection months */
  DEFAULT_PROJECTION_MONTHS: 6,
  
  /** Default cohort time window (days) */
  DEFAULT_COHORT_WINDOW: 30,
  
  /** Default decay model */
  DEFAULT_DECAY_MODEL: 'exponential' as const,
  
  /** Default attribution model */
  DEFAULT_ATTRIBUTION_MODEL: 'linear' as const,
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Export all constants for centralized access
 * 
 * Usage:
 * import {
 *   PLATFORM_SCALE_RANGES,
 *   ENGAGEMENT_BENCHMARKS,
 *   MONETIZATION_THRESHOLDS
 * } from '@/lib/utils/media/mediaConstants';
 */

export default {
  PLATFORM_SCALE_RANGES,
  ENGAGEMENT_BENCHMARKS,
  MONETIZATION_THRESHOLDS,
  REVENUE_MULTIPLIERS,
  VIRALITY_COEFFICIENTS,
  CONTENT_DECAY_RATES,
  RETENTION_BENCHMARKS,
  COHORT_PARAMETERS,
  ALGORITHM_WEIGHTS,
  ALGORITHM_PREFERENCES,
  RISK_THRESHOLDS,
  FORECASTING_PARAMETERS,
  INFLUENCER_ROI_PARAMETERS,
  DEFAULT_PARAMETERS,
};

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. PLATFORM SCALES:
 *    - Ranges based on real-world platform data
 *    - Logarithmic scaling for large-number metrics (followers, views)
 *    - Linear scaling for percentage metrics (engagement)
 * 
 * 2. BENCHMARKS:
 *    - Industry-standard engagement rates
 *    - Platform-specific norms and expectations
 *    - Updated quarterly based on industry trends
 * 
 * 3. THRESHOLDS:
 *    - Minimum requirements for features/monetization
 *    - Risk classification boundaries
 *    - Quality gates for content/campaigns
 * 
 * 4. TUNABILITY:
 *    - All coefficients can be adjusted without code changes
 *    - Centralized location enables easy experimentation
 *    - Values derived from industry research and best practices
 * 
 * 5. DETERMINISM:
 *    - Constants enable deterministic calculations
 *    - Seed parameters ensure reproducible results
 *    - No random variance unless explicitly seeded
 * 
 * @version 1.0.0
 * @compliant ECHO v1.3.0 (AAA Quality, DRY Compliance, Utility-First)
 */
