/**
 * @file src/lib/game/tick/mediaProcessor.ts
 * @description Media/Advertising tick processor for game tick engine
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Processes time-based media industry events each game tick:
 * - Ad revenue calculation from audience sizes
 * - Content performance and decay
 * - Audience growth and churn
 * - Sponsorship deal processing
 * - Viral content mechanics
 *
 * GAMEPLAY IMPACT:
 * Media revenue scales with audience:
 * - CPM rates determine ad revenue per 1000 views
 * - Content decays over time (old content earns less)
 * - Viral content can spike revenue temporarily
 * - Sponsorships provide guaranteed income
 *
 * @author ECHO v1.4.0
 */

import {
  ITickProcessor,
  GameTime,
  TickProcessorResult,
  TickProcessorOptions,
  TickError,
} from '@/lib/types/gameTick';
import MediaContent, { IMediaContent } from '@/lib/db/models/media/MediaContent';
import Audience, { IAudience } from '@/lib/db/models/media/Audience';
import SponsorshipDeal from '@/lib/db/models/media/SponsorshipDeal';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Summary of media tick processing
 */
export interface MediaTickSummary {
  [key: string]: unknown;
  
  // Content
  contentProcessed: number;
  publishedContent: number;
  trendingContent: number;
  archivedContent: number;
  
  // Audience
  audiencesProcessed: number;
  totalFollowers: number;
  newFollowers: number;
  churnedFollowers: number;
  avgEngagementRate: number;
  
  // Revenue
  adRevenue: number;
  sponsorshipRevenue: number;
  totalRevenue: number;
  avgCPM: number;
  
  // Metrics
  totalViews: number;
  totalShares: number;
  viralContentCount: number;
}

/**
 * Content processing result
 */
interface ContentProcessResult {
  processed: number;
  published: number;
  trending: number;
  archived: number;
  adRevenue: number;
  totalViews: number;
  totalShares: number;
  viralCount: number;
  errors: TickError[];
}

/**
 * Audience processing result
 */
interface AudienceProcessResult {
  processed: number;
  totalFollowers: number;
  newFollowers: number;
  churned: number;
  avgEngagement: number;
  errors: TickError[];
}

/**
 * Sponsorship processing result
 */
interface SponsorshipProcessResult {
  processed: number;
  revenue: number;
  errors: TickError[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PROCESSOR_NAME = 'media';
const PROCESSOR_PRIORITY = 60; // Run after tech

// CPM rates by content type
const CPM_RATES = {
  Article: 8,      // $8 CPM
  Video: 15,       // $15 CPM
  Podcast: 25,     // $25 CPM (niche audiences)
  Livestream: 12,  // $12 CPM
  SocialPost: 5,   // $5 CPM
};

// Content decay rate (views decrease per month)
const CONTENT_DECAY_RATE = 0.20; // 20% decay per month

// Viral threshold (engagement rate %)
const VIRAL_THRESHOLD = 10; // 10% engagement = viral

// Audience growth/churn rates
const BASE_AUDIENCE_GROWTH = 0.03; // 3% base monthly growth
const BASE_AUDIENCE_CHURN = 0.02;  // 2% base monthly churn

// ============================================================================
// MEDIA PROCESSOR
// ============================================================================

/**
 * Media tick processor
 * Handles all time-based media/advertising operations
 */
export class MediaProcessor implements ITickProcessor {
  name = PROCESSOR_NAME;
  priority = PROCESSOR_PRIORITY;
  enabled = true;
  
  /**
   * Validate processor is ready
   */
  async validate(): Promise<true | string> {
    try {
      await MediaContent.findOne().limit(1);
      await Audience.findOne().limit(1);
      return true;
    } catch (error) {
      return `Database connection error: ${error instanceof Error ? error.message : 'Unknown'}`;
    }
  }
  
  /**
   * Process one tick for media
   */
  async process(
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<TickProcessorResult> {
    const startTime = Date.now();
    const errors: TickError[] = [];
    
    try {
      // Build filter based on options
      const filter: Record<string, unknown> = {};
      if (options?.companyId) {
        filter['company'] = options.companyId;
      }
      
      // Process content (ad revenue, decay)
      const contentResults = await this.processContent(filter, gameTime, options?.dryRun);
      errors.push(...contentResults.errors);
      
      // Process audiences (growth, churn)
      const audienceResults = await this.processAudiences(filter, gameTime, options?.dryRun);
      errors.push(...audienceResults.errors);
      
      // Process sponsorships
      const sponsorshipResults = await this.processSponsorships(filter, gameTime, options?.dryRun);
      errors.push(...sponsorshipResults.errors);
      
      // Build summary
      const summary = this.buildSummary(contentResults, audienceResults, sponsorshipResults);
      
      return {
        processor: PROCESSOR_NAME,
        success: errors.filter(e => !e.recoverable).length === 0,
        itemsProcessed: contentResults.processed + audienceResults.processed + sponsorshipResults.processed,
        durationMs: Date.now() - startTime,
        summary,
        errors,
      };
    } catch (error) {
      return {
        processor: PROCESSOR_NAME,
        success: false,
        itemsProcessed: 0,
        durationMs: Date.now() - startTime,
        summary: {} as MediaTickSummary,
        errors: [{
          entityId: 'media-processor',
          entityType: 'System',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: false,
        }],
      };
    }
  }
  
  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================
  
  /**
   * Process media content
   */
  private async processContent(
    filter: Record<string, unknown>,
    gameTime: GameTime,
    dryRun?: boolean
  ): Promise<ContentProcessResult> {
    const errors: TickError[] = [];
    let processed = 0;
    let published = 0;
    let trending = 0;
    let archived = 0;
    let adRevenue = 0;
    let totalViews = 0;
    let totalShares = 0;
    let viralCount = 0;
    
    // Get published and trending content
    const content = await MediaContent.find({
      ...filter,
      status: { $in: ['Published', 'Trending'] },
    });
    
    for (const item of content) {
      try {
        const views = item.engagementMetrics?.views || 0;
        const shares = item.engagementMetrics?.shares || 0;
        const contentType = item.type || 'Article';
        
        // Calculate engagement rate
        const engagementRate = views > 0 
          ? ((shares + (item.engagementMetrics?.comments || 0) + (item.engagementMetrics?.likes || 0)) / views) * 100
          : 0;
        
        // Check if viral
        const isViral = engagementRate >= VIRAL_THRESHOLD;
        if (isViral) {
          viralCount++;
          // Viral boost: increase views
          const viralBoost = 1.5 + Math.random();
          if (!dryRun && item.engagementMetrics) {
            item.engagementMetrics.views = Math.floor(views * viralBoost);
          }
        }
        
        // Calculate ad revenue based on CPM
        const cpm = CPM_RATES[contentType as keyof typeof CPM_RATES] || 8;
        const monthlyViews = views * 0.1; // 10% of total views happen this month
        const revenue = (monthlyViews / 1000) * cpm;
        
        adRevenue += revenue;
        totalViews += views;
        totalShares += shares;
        
        // Apply content decay
        if (!dryRun && item.engagementMetrics) {
          // Decay views (older content gets less traffic)
          const newViews = Math.floor(views * (1 - CONTENT_DECAY_RATE));
          item.engagementMetrics.views = newViews;
          
          // Update monetization data
          if (item.monetizationData) {
            item.monetizationData.adRevenue = (item.monetizationData.adRevenue || 0) + revenue;
            item.monetizationData.totalRevenue = (item.monetizationData.totalRevenue || 0) + revenue;
          }
          
          // Check if content should be archived (very low views)
          if (newViews < 100 && item.status === 'Published') {
            item.status = 'Archived';
            archived++;
          }
          
          // Check if content is trending
          if (isViral && item.status === 'Published') {
            item.status = 'Trending';
            if (item.viralityMetrics) {
              item.viralityMetrics.trendingScore = Math.min(100, (item.viralityMetrics.trendingScore || 0) + 20);
            }
          } else if (!isViral && item.status === 'Trending') {
            item.status = 'Published';
          }
          
          await item.save();
        }
        
        if (item.status === 'Published') published++;
        if (item.status === 'Trending') trending++;
        processed++;
      } catch (error) {
        errors.push({
          entityId: item._id.toString(),
          entityType: 'MediaContent',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
        });
      }
    }
    
    return {
      processed,
      published,
      trending,
      archived,
      adRevenue,
      totalViews,
      totalShares,
      viralCount,
      errors,
    };
  }
  
  /**
   * Process audience growth and churn
   */
  private async processAudiences(
    filter: Record<string, unknown>,
    gameTime: GameTime,
    dryRun?: boolean
  ): Promise<AudienceProcessResult> {
    const errors: TickError[] = [];
    let processed = 0;
    let totalFollowers = 0;
    let newFollowers = 0;
    let churned = 0;
    let totalEngagement = 0;
    
    // Get audiences
    const audiences = await Audience.find(filter);
    
    for (const audience of audiences) {
      try {
        const followers = audience.totalFollowers || 0;
        const healthScore = audience.audienceHealth?.healthScore || 50;
        
        // Growth rate affected by health score
        const growthMultiplier = healthScore / 50; // 0.5-2x based on health
        const monthlyGrowth = Math.floor(followers * BASE_AUDIENCE_GROWTH * growthMultiplier * (0.8 + Math.random() * 0.4));
        
        // Churn rate inversely affected by health
        const churnMultiplier = 1 - (healthScore / 200); // 0.5-1x
        const monthlyChurn = Math.floor(followers * BASE_AUDIENCE_CHURN * churnMultiplier * (0.8 + Math.random() * 0.4));
        
        const engagement = audience.engagementMetrics?.avgInteractionRate || 0;
        
        totalFollowers += followers;
        newFollowers += monthlyGrowth;
        churned += monthlyChurn;
        totalEngagement += engagement;
        processed++;
        
        if (!dryRun) {
          // Update audience metrics
          audience.totalFollowers = Math.max(0, followers + monthlyGrowth - monthlyChurn);
          audience.activeFollowers = Math.floor(audience.totalFollowers * 0.3); // 30% active
          audience.monthlyGrowth = monthlyGrowth;
          audience.monthlyChurn = monthlyChurn;
          audience.growthRate = followers > 0 ? (monthlyGrowth / followers) * 100 : 0;
          audience.churnRate = followers > 0 ? (monthlyChurn / followers) * 100 : 0;
          
          await audience.save();
        }
      } catch (error) {
        errors.push({
          entityId: audience._id.toString(),
          entityType: 'Audience',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
        });
      }
    }
    
    const avgEngagement = processed > 0 ? totalEngagement / processed : 0;
    
    return {
      processed,
      totalFollowers,
      newFollowers,
      churned,
      avgEngagement,
      errors,
    };
  }
  
  /**
   * Process sponsorship deals
   */
  private async processSponsorships(
    filter: Record<string, unknown>,
    gameTime: GameTime,
    dryRun?: boolean
  ): Promise<SponsorshipProcessResult> {
    const errors: TickError[] = [];
    let processed = 0;
    let revenue = 0;
    
    try {
      // Get active sponsorship deals
      const deals = await SponsorshipDeal.find({
        ...filter,
        status: 'Active',
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      });
      
      for (const deal of deals) {
        try {
          // Monthly payment from sponsorship
          const monthlyPayment = (deal.dealValue || 0) / Math.max(1, deal.duration || 1);
          revenue += monthlyPayment;
          processed++;
          
          if (!dryRun) {
            // Update deal metrics
            deal.totalPaid = (deal.totalPaid || 0) + monthlyPayment;
            await deal.save();
          }
        } catch (error) {
          errors.push({
            entityId: deal._id.toString(),
            entityType: 'SponsorshipDeal',
            message: error instanceof Error ? error.message : 'Unknown error',
            recoverable: true,
          });
        }
      }
    } catch (error) {
      // SponsorshipDeal model might not exist yet
      // This is a soft failure
    }
    
    return {
      processed,
      revenue,
      errors,
    };
  }
  
  /**
   * Build tick summary
   */
  private buildSummary(
    contentResults: ContentProcessResult,
    audienceResults: AudienceProcessResult,
    sponsorshipResults: SponsorshipProcessResult
  ): MediaTickSummary {
    const totalRevenue = contentResults.adRevenue + sponsorshipResults.revenue;
    const avgCPM = contentResults.totalViews > 0
      ? (contentResults.adRevenue / (contentResults.totalViews / 1000))
      : 0;
    
    return {
      // Content
      contentProcessed: contentResults.processed,
      publishedContent: contentResults.published,
      trendingContent: contentResults.trending,
      archivedContent: contentResults.archived,
      
      // Audience
      audiencesProcessed: audienceResults.processed,
      totalFollowers: audienceResults.totalFollowers,
      newFollowers: audienceResults.newFollowers,
      churnedFollowers: audienceResults.churned,
      avgEngagementRate: audienceResults.avgEngagement,
      
      // Revenue
      adRevenue: contentResults.adRevenue,
      sponsorshipRevenue: sponsorshipResults.revenue,
      totalRevenue,
      avgCPM,
      
      // Metrics
      totalViews: contentResults.totalViews,
      totalShares: contentResults.totalShares,
      viralContentCount: contentResults.viralCount,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Singleton instance
 */
export const mediaProcessor = new MediaProcessor();

export default mediaProcessor;
