/**
 * @file src/lib/types/media.ts
 * @description Consolidated TypeScript types and interfaces for Media domain
 * @created 2025-11-25
 * @updated 2025-11-25
 * @version 1.0.0
 * @fid FID-20251124-001
 *
 * OVERVIEW:
 * Comprehensive type definitions for the complete Media domain including platforms,
 * content, audience profiles, advertising campaigns, influencer deals, sponsorships,
 * and monetization. Follows ECHO v1.3.0 AAA quality standards with strict type safety,
 * DRY compliance, and utility-first architecture alignment.
 *
 * FEATURES:
 * - 8 core domain entities (Platform, MediaContent, PerformanceSnapshot, etc.)
 * - Complete TypeScript interfaces with strict null safety
 * - Discriminated union types for status/type fields
 * - Utility function I/O types for analytics
 * - Error response and pagination types
 * - Zero `any` types (strict type safety)
 *
 * ARCHITECTURE:
 * - Composition over duplication (shared base types)
 * - Readonly where appropriate (immutability)
 * - Generic types for reusable patterns
 * - Mongoose schema compatibility
 */

import mongoose from 'mongoose';

// ============================================================================
// PLATFORM TYPES
// ============================================================================

/**
 * Media distribution platform types
 * Supported social media and content platforms
 */
export type PlatformType = 
  | 'YouTube' 
  | 'Instagram' 
  | 'TikTok' 
  | 'Twitter' 
  | 'Facebook' 
  | 'LinkedIn' 
  | 'Podcast' 
  | 'Blog';

/**
 * Media platform enum for component usage
 * Provides enum values for platform selection in UI components
 */
export enum MediaPlatform {
  INSTAGRAM = 'Instagram',
  YOUTUBE = 'YouTube',
  TIKTOK = 'TikTok',
  TWITTER = 'Twitter',
  FACEBOOK = 'Facebook',
  LINKEDIN = 'LinkedIn',
  PODCAST = 'Podcast',
  BLOG = 'Blog'
}

/**
 * Monetization tier levels
 * Progressive revenue-sharing tiers based on platform engagement
 */
export type MonetizationTier = 
  | 'None'      // Not monetized
  | 'Partner'   // Basic monetization (e.g., YouTube Partner)
  | 'Premium'   // Enhanced monetization with priority support
  | 'Elite';    // Top-tier monetization with maximum revenue share

/**
 * Platform configuration settings
 * Controls API integration, publishing, and content strategy
 */
export interface PlatformConfig {
  /** Public-facing platform URL */
  platformUrl?: string;
  
  /** Whether platform API is connected for analytics */
  apiConnected: boolean;
  
  /** Automatically publish approved content */
  autoPublish: boolean;
  
  /** Content types supported by this platform instance */
  contentTypes: string[];
  
  /** Platform-specific custom settings */
  customSettings: Record<string, unknown>;
}

/**
 * Platform performance metrics
 * Core KPIs for platform success tracking
 */
export interface PlatformMetrics {
  /** Total follower/subscriber count */
  totalFollowers: number;
  
  /** Monthly unique reach (impressions) */
  monthlyReach: number;
  
  /** Average engagement rate (percentage 0-100) */
  engagementRate: number;
  
  /** Average cost per mille (CPM) for ads */
  avgCPM: number;
  
  /** Cumulative revenue from platform */
  totalRevenue: number;
  
  /** Revenue generated this month */
  monthlyRevenue: number;
  
  /** Total impressions (optional) */
  totalImpressions?: number;
}

/**
 * Algorithm optimization settings
 * Platform-specific algorithm preferences and trending insights
 */
export interface AlgorithmOptimization {
  /** Overall algorithm favorability score (0-100) */
  algorithmScore: number;
  
  /** Optimal content length in seconds */
  preferredContentLength: number;
  
  /** Best times to post (e.g., ["09:00", "15:00", "19:00"]) */
  preferredPostingTimes: string[];
  
  /** Recommended hashtag strategy */
  hashtagStrategy: string[];
  
  /** Currently trending topics on platform */
  trendingTopics: string[];
  
  /** Format preferences (e.g., { "shortVideo": 0.8, "carousel": 0.6 }) */
  contentFormatPreferences: Record<string, number>;
}

/**
 * Content distribution metrics
 * Tracks published and scheduled content performance
 */
export interface ContentDistribution {
  /** Number of published content pieces */
  publishedContent: number;
  
  /** Number of scheduled content pieces */
  scheduledContent: number;
  
  /** Average content performance score (0-100) */
  contentPerformanceAvg: number;
  
  /** IDs of best-performing content */
  bestPerformingContent: string[];
}

/**
 * Platform monetization configuration
 * Revenue generation settings and capabilities
 */
export interface PlatformMonetization {
  /** Whether monetization is enabled */
  monetizationEnabled: boolean;
  
  /** Current monetization tier */
  monetizationTier: MonetizationTier;
  
  /** Platform's revenue share percentage */
  revenueShare: number;
  
  /** Supported ad formats */
  adFormats: string[];
  
  /** Number of available sponsorship opportunities */
  sponsorshipOpportunities: number;
  
  /** Number of active brand deals */
  brandDeals: number;
  
  /** Monetization efficiency score (optional) */
  efficiency?: number;
}

/**
 * Media distribution platform entity
 * Represents a single platform connection (e.g., company's YouTube channel)
 */
export interface Platform {
  _id: string;
  
  /** Company that owns this platform */
  company: string;
  
  /** User ID of platform owner */
  ownedBy: string;
  
  /** Type of platform (YouTube, Instagram, etc.) */
  platformType: PlatformType;
  
  /** Custom name for this platform instance */
  platformName: string;
  
  /** Whether platform is currently active */
  isActive: boolean;
  
  /** Platform configuration settings */
  config: PlatformConfig;
  
  /** Performance metrics */
  metrics: PlatformMetrics;
  
  /** Algorithm optimization settings */
  algorithmOptimization: AlgorithmOptimization;
  
  /** Content distribution metrics */
  contentDistribution: ContentDistribution;
  
  /** Monetization configuration */
  monetization: PlatformMonetization;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
}

// ============================================================================
// CONTENT TYPES
// ============================================================================

/**
 * Content format types
 * Different content formats supported across platforms
 */
export type ContentType = 
  | 'video'       // Video content (YouTube, TikTok)
  | 'image'       // Image post (Instagram)
  | 'article'     // Written article (Blog, LinkedIn)
  | 'podcast'     // Audio podcast
  | 'livestream'  // Live streaming content
  | 'story'       // Story format (Instagram, Facebook)
  | 'reel'        // Short-form vertical video (Instagram Reels)
  | 'short';      // YouTube Shorts, TikTok-style

/**
 * Content publication status
 * Lifecycle states for content pieces
 */
export type ContentStatus = 
  | 'Draft'       // Content being created
  | 'Scheduled'   // Scheduled for future publication
  | 'Published'   // Currently published
  | 'Archived'    // Archived but preserved
  | 'Deleted';    // Soft-deleted

/**
 * Engagement metrics for content
 * Core engagement KPIs tracked per content piece
 */
export interface EngagementMetrics {
  /** Total view count */
  views: number;
  
  /** Unique viewer count */
  uniqueViewers: number;
  
  /** Like/upvote count */
  likes: number;
  
  /** Share count */
  shares: number;
  
  /** Comment count */
  comments: number;
  
  /** Save/bookmark count */
  saves: number;
  
  /** Total watch time in seconds */
  watchTime: number;
  
  /** Sum of all interactions */
  totalInteractions: number;
  
  /** Percentage of content viewed to completion */
  completionRate: number;
  
  /** Percentage of viewers who rewatched (optional) */
  rewatchRate?: number;
}

/**
 * Content quality metrics
 * Subjective quality assessments (0-10 scale)
 */
export interface QualityMetrics {
  /** Production quality score (editing, audio, visuals) */
  productionQuality: number;
  
  /** Content quality score (value, accuracy, entertainment) */
  contentQuality: number;
  
  /** Relevance score (topicality, trending alignment) */
  relevanceScore: number;
}

/**
 * Content monetization data
 * Revenue generation metrics per content piece
 */
export interface ContentMonetization {
  /** Estimated revenue based on projections */
  estimatedRevenue: number;
  
  /** Actual revenue earned */
  actualRevenue: number;
  
  /** Cost per mille (thousand impressions) */
  cpm: number;
  
  /** Revenue per mille (thousand impressions) */
  rpm: number;
}

/**
 * Point-in-time performance snapshot
 * Captures performance metrics at specific timestamp
 */
export interface PerformanceSnapshot {
  /** Snapshot timestamp */
  timestamp: Date;
  
  /** View count at this time */
  views: number;
  
  /** Like count at this time */
  likes: number;
  
  /** Share count at this time */
  shares: number;
  
  /** Comment count at this time */
  comments: number;
  
  /** Watch time at this time */
  watchTime: number;
  
  /** Engagement rate at this time */
  engagementRate: number;
  
  /** Viral coefficient at this time */
  viralCoefficient: number;
  
  /** Revenue at this time */
  revenue: number;
  
  /** Overall performance score (0-100) */
  performanceScore: number;
}

/**
 * A/B test variant
 * Test variant for content optimization experiments
 */
export interface ABTestVariant {
  /** Unique variant identifier */
  variantId: string;
  
  /** Variant name/label */
  name: string;
  
  /** Variant thumbnail (optional) */
  thumbnail?: string;
  
  /** Variant title (optional) */
  title?: string;
  
  /** Variant description (optional) */
  description?: string;
  
  /** Impression count */
  impressions: number;
  
  /** Click count */
  clicks: number;
  
  /** Conversion count */
  conversions: number;
  
  /** Click-through rate */
  ctr: number;
  
  /** Conversion rate */
  conversionRate: number;
  
  /** Whether this variant won the test */
  winner?: boolean;
}

/**
 * Media content entity
 * Content piece distributed across platforms
 */
export interface MediaContent {
  _id: string;
  
  /** Company that owns this content */
  ownedBy: string;
  
  /** Content title */
  title: string;
  
  /** Content format type */
  type: ContentType;
  
  /** Content description */
  description: string;
  
  /** Platform IDs where content is published */
  platforms: string[];
  
  /** Target audience segment IDs */
  targetAudience: string[];
  
  /** Current status */
  status: ContentStatus;
  
  /** Scheduled publication date (optional) */
  scheduledDate?: Date;
  
  /** Actual publication date (optional) */
  publishedDate?: Date;
  
  /** Content duration in seconds */
  duration: number;
  
  /** Content tags */
  tags: string[];
  
  /** Thumbnail URL */
  thumbnail: string;
  
  /** Production cost */
  productionCost: number;
  
  /** Target engagement goal */
  targetEngagement: number;
  
  /** Content strategy metadata */
  contentStrategy: Record<string, unknown>;
  
  /** Engagement metrics */
  engagementMetrics: EngagementMetrics;
  
  /** Quality metrics (optional) */
  qualityMetrics?: QualityMetrics;
  
  /** Total reach (impressions) */
  reach: number;
  
  /** Monetization data */
  monetization: ContentMonetization;
  
  /** Historical performance snapshots */
  performanceHistory: PerformanceSnapshot[];
  
  /** A/B test variants */
  abTestVariants: ABTestVariant[];
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
}

// ============================================================================
// AUDIENCE TYPES
// ============================================================================

/**
 * Growth data point
 * Historical follower growth snapshot
 */
export interface GrowthDataPoint {
  /** Snapshot date */
  date: Date;
  
  /** Audience size at this date */
  size: number;
  
  /** New followers gained */
  newFollowers: number;
  
  /** Followers lost */
  lostFollowers: number;
  
  /** Growth rate percentage */
  growthRate: number;
}

/**
 * Engagement data point
 * Historical engagement snapshot
 */
export interface EngagementDataPoint {
  /** Snapshot date */
  date: Date;
  
  /** Total interactions */
  interactions: number;
  
  /** Engagement rate percentage */
  engagementRate: number;
  
  /** Active users */
  activeUsers: number;
}

/**
 * Audience demographic breakdown
 * Optional demographic percentages by category
 */
export interface AudienceDemographics {
  /** Age group percentages (e.g., { "18-24": 0.35, "25-34": 0.45 }) */
  age?: Record<string, number>;
  
  /** Gender percentages */
  gender?: Record<string, number>;
  
  /** Income bracket percentages */
  income?: Record<string, number>;
  
  /** Education level percentages */
  education?: Record<string, number>;
  
  /** Location percentages */
  location?: Record<string, number>;
}

/**
 * Geographic location breakdown
 * Optional location percentages at different granularities
 */
export interface AudienceLocation {
  /** Country percentages */
  countries?: Record<string, number>;
  
  /** Region/state percentages */
  regions?: Record<string, number>;
  
  /** City percentages */
  cities?: Record<string, number>;
}

/**
 * Audience engagement metrics
 * Optional engagement behavior metrics
 */
export interface AudienceEngagementMetrics {
  /** Average interaction rate percentage */
  avgInteractionRate: number;
  
  /** Average session duration in seconds */
  avgSessionDuration: number;
  
  /** Average content pieces consumed per session */
  avgContentConsumption: number;
}

/**
 * Audience retention metrics
 * Optional retention and churn tracking
 */
export interface AudienceRetentionMetrics {
  /** Retention rate percentage */
  retentionRate: number;
  
  /** Churn rate percentage */
  churnRate: number;
  
  /** Lifetime value per follower */
  lifetimeValuePerFollower: number;
  
  /** Average follower lifetime in days */
  avgFollowerLifetime: number;
}

/**
 * Audience profile entity
 * Audience segment with demographics and engagement
 */
export interface AudienceProfile {
  _id: string;
  
  /** Company that owns this audience */
  ownedBy: string;
  
  /** Platform this audience belongs to */
  platform: string;
  
  /** Audience segment name/identifier */
  segment: string;
  
  /** Current audience size */
  size: number;
  
  /** Previous period size (optional) */
  previousSize?: number;
  
  /** Demographic breakdown */
  demographics: AudienceDemographics;
  
  /** Audience interests */
  interests: string[];
  
  /** Audience behaviors */
  behaviors: string[];
  
  /** Device types used */
  deviceTypes: string[];
  
  /** Geographic location breakdown */
  location: AudienceLocation;
  
  /** Cost to acquire each follower */
  acquisitionCost: number;
  
  /** Lifetime value per follower */
  lifetimeValue: number;
  
  /** Engagement metrics (optional) */
  engagementMetrics?: AudienceEngagementMetrics;
  
  /** Retention metrics (optional) */
  retentionMetrics?: AudienceRetentionMetrics;
  
  /** Historical growth data */
  growthHistory: GrowthDataPoint[];
  
  /** Historical engagement data */
  engagementHistory: EngagementDataPoint[];
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
}

// ============================================================================
// MONETIZATION TYPES
// ============================================================================

/**
 * Monetization strategy types
 * Different revenue generation approaches
 */
export type MonetizationStrategy = 
  | 'AdRevenue'      // Advertising-based revenue
  | 'Subscription'   // Subscription-based revenue
  | 'Affiliate'      // Affiliate marketing revenue
  | 'Hybrid';        // Combination of multiple strategies

/**
 * Subscription tier
 * Subscription pricing and benefits package
 */
export interface SubscriptionTier {
  /** Tier name */
  name: string;
  
  /** Price per billing period */
  price: number;
  
  /** Billing frequency */
  billingPeriod: 'monthly' | 'quarterly' | 'annual';
  
  /** Benefits included in tier */
  benefits: string[];
  
  /** Number of active subscribers */
  subscriberCount: number;
  
  /** Churn rate for this tier */
  churnRate: number;
}

/**
 * Monetization configuration entity
 * Revenue optimization settings and strategy
 */
export interface MonetizationConfig {
  _id: string;
  
  /** Company this config belongs to */
  company: string;
  
  /** Whether monetization is active */
  isActive: boolean;
  
  /** Primary monetization strategy */
  strategy: MonetizationStrategy;
  
  /** Default CPM rate */
  defaultCPM: number;
  
  /** CPM multipliers by age group (optional) */
  cpmByAge?: Record<string, number>;
  
  /** CPM multipliers by income bracket (optional) */
  cpmByIncome?: Record<string, number>;
  
  /** CPM multipliers by location (optional) */
  cpmByLocation?: Record<string, number>;
  
  /** CPM multipliers by device type (optional) */
  cpmByDevice?: Record<string, number>;
  
  /** Available subscription tiers */
  subscriptionTiers: SubscriptionTier[];
  
  /** Whether affiliate marketing is enabled */
  affiliateEnabled: boolean;
  
  /** Default affiliate commission rate percentage */
  affiliateCommissionRate: number;
  
  /** Commission rates by category */
  affiliateCategories: Record<string, number>;
  
  /** Revenue share percentages by platform */
  platformRevShares: Record<string, number>;
  
  /** Minimum CPM floor */
  minCPM: number;
  
  /** Maximum CPM ceiling */
  maxCPM: number;
  
  /** Target demographic IDs */
  targetDemographics: string[];
  
  /** Excluded advertiser IDs */
  excludedAdvertisers: string[];
  
  /** Preferred advertiser IDs */
  preferredAdvertisers: string[];
  
  /** Total subscriber count */
  totalSubscribers: number;
  
  /** Monthly recurring revenue */
  totalMRR: number;
  
  /** Annual recurring revenue */
  totalARR: number;
  
  /** Average revenue per user */
  avgRevenuePerUser: number;
  
  /** Overall churn rate percentage */
  churnRate: number;
  
  /** Subscription-specific revenue (optional) */
  subscriptionRevenue?: number;
  
  /** Whether currently profitable (optional) */
  isProfitable?: boolean;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;

  // UI-friendly fields used by MonetizationSettings
  revenueStreams?: RevenueStream[];
  pricingTiers?: PricingTier[];
  paymentMethods?: PaymentMethod[];
  payoutSettings?: {
    schedule: PayoutSchedule;
    method: string;
    minimumThreshold: number;
    processingFee: number;
  };
  taxSettings?: {
    collectTaxes: boolean;
    taxRate: number;
    taxId?: string;
  };
}

// Types used by MonetizationSettings UI
export interface RevenueStream {
  id: string;
  type: string;
  enabled: boolean;
  commission: number;
  minimumPayout: number;
  payoutSchedule: 'weekly' | 'biweekly' | 'monthly';
  settings: Record<string, unknown>;
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: { campaigns: number; influencers: number };
  popular?: boolean;
}

export interface PaymentMethod {
  id: string;
  type: string;
  enabled: boolean;
  settings: Record<string, unknown>;
}

export type PayoutSchedule = 'weekly' | 'biweekly' | 'monthly';

export interface RevenueAnalytics {
  month: string;
  revenue: number;
  transactions: number;
  avgOrder: number;
}

// ============================================================================
// ADVERTISING TYPES
// ============================================================================

/**
 * Ad campaign types
 * Different advertising campaign formats
 */
export type AdCampaignType = 
  | 'Display'     // Display banner ads
  | 'Video'       // Video ads
  | 'Search'      // Search engine ads
  | 'Social'      // Social media ads
  | 'Influencer'  // Influencer marketing
  | 'Sponsored';  // Sponsored content

/**
 * Campaign status
 * Lifecycle states for ad campaigns
 */
export enum CampaignStatus {
  ACTIVE = 'Active',
  PAUSED = 'Paused',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

/**
 * Audience targeting types
 * Different targeting strategies
 */
export type AudienceType = 
  | 'Broad'         // Wide audience targeting
  | 'Targeted'      // Specific demographic targeting
  | 'Lookalike'     // Similar to existing audience
  | 'Retargeting';  // Previous visitors/customers

/**
 * Bidding models
 * Different ad bidding/pricing models
 */
export type BiddingModel = 
  | 'CPC'  // Cost per click
  | 'CPM'  // Cost per mille (thousand impressions)
  | 'CPE'  // Cost per engagement
  | 'CPA'; // Cost per acquisition

/**
 * Ad campaign goals
 * Optional campaign performance targets
 */
export interface CampaignGoals {
  /** Target impression count (optional) */
  impressions?: number;
  
  /** Target click count (optional) */
  clicks?: number;
  
  /** Target conversion count (optional) */
  conversions?: number;
  
  /** Target return on ad spend percentage (optional) */
  targetROAS?: number;
}

/**
 * Ad campaign performance metrics
 * Real-time campaign performance tracking
 */
export interface CampaignMetrics {
  /** Total impressions delivered */
  impressions: number;
  
  /** Total clicks received */
  clicks: number;
  
  /** Total conversions achieved */
  conversions: number;
  
  /** Total engagements (optional) */
  engagements?: number;
  
  /** Total spend */
  spend: number;
  
  /** Total revenue generated */
  revenue: number;
}

/**
 * Ad campaign entity
 * Advertising campaign with performance tracking
 */
export interface AdCampaign {
  _id: string;
  
  /** Primary platform where campaign runs (legacy) */
  platform?: string;
  
  /** Platforms where campaign runs (UI-facing) */
  platforms?: string[];
  
  /** Advertiser company ID */
  advertiser: string;
  
  /** Campaign name */
  name: string;

  /** Campaign description (UI-facing) */
  description?: string;
  
  /** Campaign type */
  type: AdCampaignType;
  
  /** Current status */
  status: CampaignStatus;
  
  /** Campaign start date */
  startDate: Date;
  
  /** Campaign end date (optional) */
  endDate?: Date;
  
  /** Targeted content IDs */
  targetedContent: string[];
  
  /** Targeted influencer IDs */
  targetedInfluencers: string[];
  
  /** Targeted audience IDs */
  targetedAudience: string[];

  /** Targeted audience demographics (UI-facing) */
  targetAudience?: TargetAudience;
  
  /** Audience targeting type */
  audienceType: AudienceType;
  
  /** Bidding model */
  biddingModel: BiddingModel;
  
  /** Bid amount per unit */
  bidAmount: number;
  
  /** Daily budget cap */
  dailyBudget: number;
  
  /** Total campaign budget */
  totalBudget: number;
  
  /** Campaign objective (short) */
  objective?: string;

  /** Campaign goals */
  goals: CampaignGoals;
  
  /** Performance metrics */
  metrics: CampaignMetrics;

  /** Campaign budget details */
  budget?: CampaignBudget;

  /** Campaign performance (optional) */
  performance?: CampaignPerformance;
  
  /** Quality score (1-10) */
  qualityScore: number;
  
  /** Relevance score (0-100) */
  relevanceScore: number;
  
  /** Engagement score (0-100) */
  engagementScore: number;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
}

// ============================================================================
// INFLUENCER DEAL TYPES
// ============================================================================

/**
 * Influencer deal types
 * Different influencer partnership structures
 */
export type DealType = 
  | 'Sponsored'         // One-time sponsored content
  | 'Ambassador'        // Long-term brand ambassador
  | 'Affiliate'         // Affiliate marketing deal
  | 'PerformanceBased'; // Performance-based compensation

/**
 * Influencer deal status
 * Lifecycle states for deals
 */
export enum DealStatus {
  PENDING = 'Pending',
  NEGOTIATING = 'Negotiating',
  DRAFT = 'Draft',
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  BREACHED = 'Breached'
}

/**
 * Payment structures
 * Different compensation models
 */
export type PaymentStructure = 
  | 'Flat'             // Flat fee
  | 'PerPost'          // Payment per post
  | 'PerformanceBased' // Based on performance metrics
  | 'Tiered'           // Tiered based on milestones
  | 'Hybrid';          // Combination of models

/**
 * Payment schedules
 * When payments are made
 */
export type PaymentSchedule = 
  | 'Upfront'        // Full payment upfront
  | 'OnCompletion'   // Payment upon completion
  | 'Monthly'        // Monthly installments
  | 'PerDeliverable'; // Per content piece delivered

/**
 * Usage rights
 * Content usage rights granted
 */
export type UsageRights = 
  | 'Limited'      // Limited time/scope
  | 'Perpetual'    // Unlimited time
  | 'Exclusive'    // Exclusive to brand
  | 'NonExclusive'; // Non-exclusive

/**
 * Performance-based bonus threshold
 * Milestone that triggers bonus payment
 */
export interface BonusThreshold {
  /** Metric that determines bonus (impressions, engagement, etc.) */
  metric: 'impressions' | 'engagement' | 'conversions' | 'revenue';
  
  /** Threshold value to achieve */
  threshold: number;
  
  /** Bonus amount to be paid */
  bonusAmount: number;
  
  /** Whether threshold was achieved */
  achieved: boolean;
}

/**
 * Influencer deal entity
 * Influencer marketing contract
 */
export interface InfluencerDeal {
  _id: string;
  
  /** Company purchasing influencer services */
  company: string;
  
  /** Influencer user ID or external ID */
  influencer: string;
  
  /** Type of deal */
  dealType: DealType;
  
  /** Current status */
  status: DealStatus;
  
  /** Total compensation amount */
  compensation: number;
  
  /** Payment structure model */
  paymentStructure: PaymentStructure;
  
  /** Base payment amount */
  basePayment: number;
  
  /** Performance bonus thresholds */
  bonusThresholds: BonusThreshold[];
  
  /** Payment schedule */
  paymentSchedule: PaymentSchedule;
  
  /** Amount paid to date */
  paidToDate: number;
  
  /** Number of required content pieces */
  requiredContent: number;
  
  /** Supported content types */
  contentTypes: string[];
  
  /** IDs of delivered content */
  deliveredContent: string[];
  
  /** Content delivery deadlines */
  deliveryDeadlines: Date[];
  
  /** Whether exclusivity clause exists */
  exclusivityClause: boolean;
  
  /** Exclusivity period in days (optional) */
  exclusivityPeriod?: number;
  
  /** Whether content requires approval */
  contentApprovalRequired: boolean;
  
  /** Usage rights granted */
  usageRights: UsageRights;
  
  /** Termination clause text */
  terminationClause: string;
  
  /** Penalty for non-delivery */
  penaltyForNonDelivery: number;
  
  /** Influencer's follower count */
  influencerFollowers: number;
  
  /** Influencer's engagement rate */
  influencerEngagementRate: number;
  
  /** Influencer's niche/category */
  influencerNiche: string;
  
  /** Influencer's reach */
  influencerReach: number;
  
  /** Influencer demographics metadata */
  influencerDemographics: Record<string, unknown>;
  
  /** Total impressions delivered */
  totalImpressions: number;
  
  /** Total engagement achieved */
  totalEngagement: number;
  
  /** Total conversions achieved */
  totalConversions: number;
  
  /** Conversion rate percentage */
  conversionRate: number;
  
  /** Actual ROI achieved */
  actualROI: number;
  
  /** Projected ROI */
  projectedROI: number;
  
  /** Delivery progress percentage (optional) */
  deliveryProgress?: number;
  
  /** Average engagement rate (optional) */
  averageEngagementRate?: number;
  
  /** Cost per impression (optional) */
  costPerImpression?: number;
  
  /** Cost per engagement (optional) */
  costPerEngagement?: number;
  
  /** Deal start date */
  startDate: Date;
  
  /** Deal end date */
  endDate: Date;
  
  /** Whether deal auto-renews */
  autoRenew: boolean;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Influencer profile used by the UI (directory)
 */
export interface InfluencerProfile {
  _id: string;
  userId?: string;
  companyId?: string;
  name: string;
  bio?: string;
  niche: string[];
  platforms: Array<{
    platform: MediaPlatform;
    handle: string;
    followers: number;
    engagement: number;
    verified?: boolean;
    connected?: boolean;
    lastSync?: Date;
  }>;
  rates: Record<string, number>;
  portfolio?: string[];
  rating?: number;
  reviewsCount?: number;
  dealsCompleted?: number;
  totalEarnings?: number;
  availability?: string;
  location?: string;
  languages?: string[];
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Aliases for UI convenience to match existing component imports
export type SponsorshipDeal = SponsorshipContract;
// Rename alias to avoid collision with the MonetizationSettings React component export
export type MonetizationSettingsType = MonetizationConfig;

// ============================================================================
// SPONSORSHIP TYPES
// ============================================================================

/**
 * Sponsorship deal structures
 * Different sponsorship payment models
 */
export type DealStructure = 
  | 'Flat'             // Flat fee
  | 'Tiered'           // Tiered based on performance
  | 'PerformanceBased' // Purely performance-based
  | 'RevenueShare'     // Revenue sharing model
  | 'Hybrid';          // Combination of models

/**
 * Sponsorship contract entity
 * Brand sponsorship deal
 */
export interface SponsorshipContract {
  _id: string;
  
  /** Sponsor company ID */
  sponsor: string;
  
  /** Recipient media company ID */
  recipient: string;
  
  /** Total deal value */
  dealValue: number;
  /**
   * UI-friendly alias for `dealValue` used by frontend components.
   * This field is optional and kept for compatibility; backend canonical field remains `dealValue`.
   */
  budget?: number;
  /** Optional human-friendly title & description */
  title?: string;
  description?: string;
  /** Targeted platforms for the sponsorship */
  platforms?: string[];
  /** UI-friendly deliverables list */
  deliverables?: Array<{
    type: 'Article' | 'Video' | 'Podcast' | 'Livestream' | 'SocialPost';
    platform?: string;
    dueDate?: Date;
    completed?: boolean;
    metrics?: {
      reach?: number;
      engagement?: number;
      clicks?: number;
    };
  }>;
  /** UI alias for revenueSharePercent */
  commission?: number;
  /** Additional performance metrics that frontend uses */
  totalClicks?: number;
  totalConversions?: number;
  influencerRating?: number;
  
  /** Deal structure model */
  dealStructure: DealStructure;
  
  /** Deal duration in months */
  duration: number;
  
  /** Current status */
  status: DealStatus;
  
  /** Contract start date */
  startDate: Date;
  
  /** Contract end date */
  endDate: Date;
  
  /** Upfront payment amount */
  upfrontPayment: number;
  
  /** Monthly payment amount */
  monthlyPayment: number;
  
  /** Revenue share percentage */
  revenueSharePercent: number;
  
  /** Performance bonus thresholds */
  performanceBonuses: BonusThreshold[];
  
  /** Total amount paid to date */
  totalPaid: number;
  
  /** Remaining payment count */
  remainingPayments: number;
  
  /** Required brand mentions */
  requiredMentions: number;
  
  /** Content requirements */
  contentRequirements: string[];
  
  /** IDs of delivered content */
  deliveredContent: string[];
  
  /** Whether approval is required */
  approvalRequired: boolean;
  
  /** Brand guidelines URL/text */
  brandGuidelines: string;
  
  /** Whether exclusivity clause exists */
  exclusivityClause: boolean;
  
  /** Competitor categories excluded */
  competitorCategories: string[];
  
  /** Exclusivity duration in months */
  exclusivityDuration: number;
  
  /** Penalty for exclusivity violation */
  penaltyForViolation: number;
  
  /** Total impressions delivered */
  totalImpressions: number;
  
  /** Total engagement achieved */
  totalEngagement: number;
  
  /** Brand mention count */
  brandMentions: number;
  
  /** Brand sentiment score (-100 to 100) */
  brandSentiment: number;
  
  /** Brand lift percentage */
  brandLift: number;
  
  /** Estimated reach */
  estimatedReach: number;
  
  /** Actual reach achieved */
  actualReach: number;
  
  /** Milestones achieved count */
  milestonesAchieved: number;
  
  /** Total milestone count */
  totalMilestones: number;
  
  /** Overdue deliverable count */
  overdueDeliverables: number;
  
  /** Completion rate percentage */
  completionRate: number;
  
  /** Fulfillment progress percentage (optional) */
  fulfillmentProgress?: number;
  
  /** Average bonus achievement percentage (optional) */
  averageBonusAchieved?: number;
  
  /** Total bonuses earned (optional) */
  totalEarnedBonuses?: number;
  
  /** Contract terms text */
  contractTerms: string;
  
  /** Termination clause text */
  terminationClause: string;
  
  /** Dispute resolution text */
  disputeResolution: string;
  
  /** Intellectual property clause */
  intellectualProperty: string;
  
  /** Usage rights text */
  usageRights: string;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;

  /** Optional runtime-friendly payment status for UI (e.g., 'pending', 'paid') */
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'processing' | 'refunded' | 'held' | 'released';

  /**
   * UI friendly performance object. Alias for convenience to match existing components
   * that expect a `performance` object rather than separate fields.
   */
  performance?: CampaignPerformance;
}

// ============================================================================
// UTILITY FUNCTION I/O TYPES
// ============================================================================

/**
 * Content metrics for engagement calculations
 * Input type for engagement utility functions
 */
export interface ContentMetrics {
  /** View count */
  views: number;
  
  /** Like count */
  likes: number;
  
  /** Share count */
  shares: number;
  
  /** Comment count */
  comments: number;
  
  /** Watch time in seconds */
  watchTime: number;
  
  /** Unique viewer count (optional) */
  uniqueViewers?: number;
  
  /** Completion rate percentage (optional) */
  completionRate?: number;
  
  /** Rewatch rate percentage (optional) */
  rewatchRate?: number;
  
  /** Save/bookmark count (optional) */
  saves?: number;
}

/**
 * Audience retention metrics
 * Input type for retention calculations
 */
export interface RetentionMetrics {
  /** Number of retained followers */
  retainedFollowers: number;
  
  /** Starting follower count */
  startingFollowers: number;
  
  /** Number of lost followers */
  lostFollowers: number;
  
  /** Number of new followers */
  newFollowers: number;
}

/**
 * Growth projection parameters
 * Input type for growth forecasting
 */
export interface GrowthProjection {
  /** Current follower count */
  currentFollowers: number;
  
  /** Growth rate percentage */
  growthRate: number;
  
  /** Projection period in months */
  projectionMonths: number;
  
  /** Confidence interval (optional, default 0.95) */
  confidenceInterval?: number;
}

/**
 * Monetization potential calculation inputs
 * Input type for monetization utilities
 */
export interface MonetizationInputs {
  /** View count */
  views: number;
  
  /** Unique viewer count */
  uniqueViewers: number;
  
  /** Share count */
  shares: number;
  
  /** Comment count */
  comments: number;
  
  /** Like count */
  likes: number;
  
  /** Watch time in seconds */
  watchTime: number;
  
  /** Completion rate percentage */
  completionRate: number;
  
  /** Cost per mille */
  cpm: number;
  
  /** Platform multiplier */
  platformMultiplier: number;
}

/**
 * ROI calculation inputs
 * Generic ROI calculation parameters
 */
export interface ROIInputs {
  /** Revenue generated */
  revenue: number;
  
  /** Cost incurred */
  cost: number;
  
  /** Ad spend (optional) */
  spend?: number;
}

/**
 * Virality calculation inputs
 * Input type for virality utilities
 */
export interface ViralityInputs {
  /** Share count */
  shares: number;
  
  /** View count */
  views: number;
  
  /** Unique share count (optional) */
  uniqueShares?: number;
  
  /** Viral loop cycle count (optional) */
  viralLoopCycles?: number;
}

/**
 * Cohort data for retention analysis
 * Input type for cohort retention utilities
 */
export interface CohortData {
  /** Cohort acquisition date */
  acquisitionDate: string;
  
  /** Initial cohort size */
  initialSize: number;
  
  /** Retained counts at intervals */
  retained: number[];
  
  /** Revenue at intervals (optional) */
  revenue?: number[];
}

/**
 * Cohort performance metrics
 * Output type for cohort analysis
 */
export interface CohortPerformance {
  /** Cohort identifier */
  cohort: string;
  
  /** Retention rate percentage */
  retentionRate: number;
  
  /** Churn rate percentage */
  churnRate: number;
  
  /** Lifetime value */
  ltv: number;
}

/**
 * Churn data point
 * Input type for churn forecasting
 */
export interface ChurnDataPoint {
  /** Month identifier (YYYY-MM) */
  month: string;
  
  /** Churn rate percentage */
  churnRate: number;
  
  /** Subscriber count */
  subscribers: number;
  
  /** Revenue (optional) */
  revenue?: number;
}

/**
 * Revenue data point
 * Input type for monetization risk analysis
 */
export interface RevenueDataPoint {
  /** Date identifier */
  date: string;
  
  /** Total revenue */
  totalRevenue: number;
  
  /** Revenue by stream */
  revenueByStream: Record<string, number>;
}

/**
 * Attribution touchpoint
 * Multi-touch attribution data point
 */
export interface AttributionTouchpoint {
  /** Touchpoint source */
  source: string;
  
  /** Interaction timestamp */
  timestamp: Date;
  
  /** Conversion value */
  conversionValue: number;
}

// ============================================================================
// ERROR & RESPONSE TYPES
// ============================================================================

/**
 * Standardized error response
 * API error response format
 */
export interface ErrorResponse {
  /** Error message */
  error: string;
  
  /** Error code (optional) */
  code?: string;
  
  /** Additional error details (optional) */
  details?: Record<string, unknown>;
}

/**
 * Validation error details
 * Field-level validation error
 */
export interface ValidationError {
  /** Field name */
  field: string;
  
  /** Error message */
  message: string;
  
  /** Invalid value (optional) */
  value?: unknown;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/**
 * Pagination metadata
 * Standard pagination info for API responses
 */
export interface PaginationMeta {
  /** Total item count */
  total: number;
  
  /** Items per page */
  limit: number;
  
  /** Offset from start */
  offset: number;
  
  /** Whether more items exist */
  hasMore: boolean;
}

/**
 * Paginated response wrapper
 * Generic paginated API response
 */
export interface PaginatedResponse<T> {
  /** Page data items */
  data: T[];
  
  /** Pagination metadata */
  pagination: PaginationMeta;
}

/**
 * Common query parameters
 * Standard API query params for filtering/sorting
 */
export interface QueryParams {
  /** Items per page (optional) */
  limit?: number;
  
  /** Offset from start (optional) */
  offset?: number;
  
  /** Sort field (optional) */
  sortBy?: string;
  
  /** Sort direction (optional) */
  sortOrder?: 'asc' | 'desc';
  
  /** Additional filter params */
  [key: string]: unknown;
}

// ============================================================================
// MISSING COMPONENT INTERFACES (Added for AdCampaignBuilder compatibility)
// ============================================================================

/**
 * Target audience demographics for ad campaigns
 * Defines the audience segment to target with advertising
 */
export interface TargetAudience {
  /** Age range [min, max] */
  ageRange: [number, number];
  
  /** Gender targeting */
  gender: string[];
  
  /** Interest categories */
  interests: string[];
  
  /** Geographic locations */
  locations: string[];
  
  /** Language preferences */
  languages: string[];
  
  /** Follower count range [min, max] */
  followerCount?: [number, number];
}

/**
 * Creative asset for ad campaigns
 * Represents media content used in advertising
 */
export interface CreativeAsset {
  /** Asset ID */
  id: string;
  
  /** Asset type */
  type: 'image' | 'video' | 'carousel' | 'story';
  
  /** Asset URL */
  url: string;
  
  /** Asset title */
  title: string;
  
  /** Asset description */
  description?: string;
  
  /** Asset dimensions */
  dimensions?: {
    width: number;
    height: number;
  };
  
  /** File size in bytes */
  fileSize?: number;
  
  /** Upload timestamp */
  uploadedAt: Date;
}

/**
 * Campaign budget allocation
 * Defines spending limits and distribution
 */
export interface CampaignBudget {
  /** Total campaign budget */
  total: number;
  
  /** Daily spending limit */
  daily: number;
  
  /** Platform-specific budget breakdown */
  platformBreakdown: Record<string, number>;
  
  /** Currency code */
  currency: string;
  
  /** Auto-optimization enabled */
  autoOptimize: boolean;
}

/**
 * Campaign performance metrics
 * Real-time performance tracking
 */
export interface CampaignPerformance {
  /** Total impressions */
  impressions: number;
  
  /** Total clicks */
  clicks: number;
  
  /** Click-through rate */
  ctr: number;
  
  /** Cost per click */
  cpc: number;
  
  /** Total conversions */
  conversions: number;
  
  /** Conversion rate */
  conversionRate: number;
  
  /** Return on ad spend */
  roas: number;
  
  /** Total spend */
  spend: number;
  
  /** Campaign reach */
  reach: number;
  /** Alias used by various UI components for reach */
  totalReach?: number;
  /** Total engagement count or percentage depending on context */
  totalEngagement?: number;
  /** Total clicks count */
  totalClicks?: number;
  /** Return on ad spend (may be expressed as ratio or percent depending on context) */
  roi?: number;
  /** Brand satisfaction / rating (optional) */
  brandSatisfaction?: number;
  /** Influencer rating (optional) */
  influencerRating?: number;
  
  /** Engagement rate */
  engagementRate: number;
}

/**
 * DealPerformance alias for UI convenience
 */
export type DealPerformance = CampaignPerformance;

/**
 * Payment status enumeration for transactions
 */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'processing' | 'refunded' | 'held' | 'released';

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Re-export all types for convenient imports
 * 
 * Usage:
 * import type { Platform, MediaContent, AudienceProfile } from '@/lib/types/media';
 */

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. TYPE SAFETY:
 *    - All optional fields marked with `?`
 *    - Discriminated unions for status/type fields
 *    - No `any` types (use `unknown` or `Record<string, unknown>`)
 *    - Readonly where appropriate for immutability
 * 
 * 2. DRY COMPLIANCE:
 *    - Shared base types extracted (metrics, demographics, etc.)
 *    - Composition over duplication
 *    - Type aliases for repeated patterns
 *    - Generic types for reusable patterns (PaginatedResponse<T>)
 * 
 * 3. MONGOOSE INTEGRATION:
 *    - Interfaces represent logical domain model
 *    - Mongoose schemas implement these interfaces
 *    - Use toObject() return type annotations for API responses
 *    - Type guards for runtime validation
 * 
 * 4. NEXT STEPS:
 *    - Update Mongoose models to implement interfaces
 *    - Create Zod schemas for runtime validation
 *    - Update API routes to use typed responses
 *    - Generate OpenAPI/Swagger documentation
 * 
 * @version 1.0.0
 * @compliant ECHO v1.3.0 (AAA Quality, GUARDIAN Protocol, Utility-First)
 */
