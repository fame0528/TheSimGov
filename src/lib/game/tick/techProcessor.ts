/**
 * @file src/lib/game/tick/techProcessor.ts
 * @description Technology/SaaS tick processor for game tick engine
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Processes time-based technology/SaaS events each game tick:
 * - Subscription billing (monthly recurring revenue)
 * - Subscription churn (cancellations)
 * - New subscriber acquisition (simulated)
 * - API usage tracking and overage billing
 * - Product license revenue
 *
 * GAMEPLAY IMPACT:
 * Tech is the highest-margin industry (~85%):
 * - SaaS subscriptions = predictable recurring revenue
 * - Churn is the enemy (track and minimize)
 * - API usage = usage-based revenue
 * - Software licenses = one-time revenue
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
import SaaSSubscription, { ISaaSSubscription } from '@/lib/db/models/software/SaaSSubscription';
import SoftwareProduct, { ISoftwareProduct } from '@/lib/db/models/software/SoftwareProduct';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Summary of tech tick processing
 */
export interface TechTickSummary {
  [key: string]: unknown;
  
  // Subscriptions
  subscriptionsProcessed: number;
  activeSubscribers: number;
  newSubscribers: number;
  churnedSubscribers: number;
  churnRate: number;
  
  // Revenue
  subscriptionRevenue: number;
  apiUsageRevenue: number;
  licenseRevenue: number;
  totalRevenue: number;
  
  // Metrics
  mrr: number;  // Monthly Recurring Revenue
  arr: number;  // Annual Recurring Revenue
  avgRevenuePerSubscriber: number;
  
  // Products
  productsProcessed: number;
  productsActive: number;
}

/**
 * Subscription processing result
 */
interface SubscriptionProcessResult {
  processed: number;
  totalSubscribers: number;
  newSubscribers: number;
  churned: number;
  revenue: number;
  apiRevenue: number;
  mrr: number;
  errors: TickError[];
}

/**
 * Product processing result
 */
interface ProductProcessResult {
  processed: number;
  active: number;
  licenseRevenue: number;
  subscriptionRevenue: number;
  errors: TickError[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PROCESSOR_NAME = 'tech';
const PROCESSOR_PRIORITY = 55; // Run after retail

// Churn rates by tier
const CHURN_RATES = {
  Basic: 0.08,    // 8% monthly churn
  Plus: 0.05,     // 5% monthly churn
  Premium: 0.02,  // 2% monthly churn
};

// Growth rates by tier (new subscribers per month as % of current)
const GROWTH_RATES = {
  Basic: 0.10,    // 10% growth
  Plus: 0.08,     // 8% growth
  Premium: 0.05,  // 5% growth
};

// API overage pricing
const API_OVERAGE_PER_1000 = 0.50; // $0.50 per 1000 calls over limit

// Product margins
const SAAS_MARGIN = 0.85; // 85% margin on SaaS
const LICENSE_MARGIN = 0.90; // 90% margin on perpetual licenses

// ============================================================================
// TECH PROCESSOR
// ============================================================================

/**
 * Technology tick processor
 * Handles all time-based tech/SaaS operations
 */
export class TechProcessor implements ITickProcessor {
  name = PROCESSOR_NAME;
  priority = PROCESSOR_PRIORITY;
  enabled = true;
  
  /**
   * Validate processor is ready
   */
  async validate(): Promise<true | string> {
    try {
      await SaaSSubscription.findOne().limit(1);
      await SoftwareProduct.findOne().limit(1);
      return true;
    } catch (error) {
      return `Database connection error: ${error instanceof Error ? error.message : 'Unknown'}`;
    }
  }
  
  /**
   * Process one tick for tech
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
      
      // Process subscriptions (MRR)
      const subscriptionResults = await this.processSubscriptions(filter, gameTime, options?.dryRun);
      errors.push(...subscriptionResults.errors);
      
      // Process software products
      const productResults = await this.processProducts(filter, gameTime, options?.dryRun);
      errors.push(...productResults.errors);
      
      // Build summary
      const summary = this.buildSummary(subscriptionResults, productResults);
      
      return {
        processor: PROCESSOR_NAME,
        success: errors.filter(e => !e.recoverable).length === 0,
        itemsProcessed: subscriptionResults.processed + productResults.processed,
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
        summary: {} as TechTickSummary,
        errors: [{
          entityId: 'tech-processor',
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
   * Process SaaS subscriptions
   */
  private async processSubscriptions(
    filter: Record<string, unknown>,
    gameTime: GameTime,
    dryRun?: boolean
  ): Promise<SubscriptionProcessResult> {
    const errors: TickError[] = [];
    let processed = 0;
    let totalSubscribers = 0;
    let newSubscribers = 0;
    let churned = 0;
    let revenue = 0;
    let apiRevenue = 0;
    let mrr = 0;
    
    // Get active subscriptions
    const subscriptions = await SaaSSubscription.find({
      ...filter,
      active: true,
    });
    
    for (const sub of subscriptions) {
      try {
        const currentSubscribers = sub.activeSubscribers || 0;
        
        // Calculate churn
        const churnRate = CHURN_RATES[sub.tier] || 0.05;
        const monthlyChurn = Math.floor(currentSubscribers * churnRate * (0.8 + Math.random() * 0.4));
        
        // Calculate new subscribers
        const growthRate = GROWTH_RATES[sub.tier] || 0.05;
        const monthlyNew = Math.floor(currentSubscribers * growthRate * (0.7 + Math.random() * 0.6));
        
        // Calculate subscription revenue
        const subRevenue = currentSubscribers * (sub.monthlyPrice || 0);
        
        // Calculate API overage revenue
        const avgCalls = sub.avgApiCallsPerSubscriber || 0;
        const callsLimit = sub.apiCallsLimit || 10000;
        let overageRevenue = 0;
        if (avgCalls > callsLimit) {
          const overageCalls = (avgCalls - callsLimit) * currentSubscribers;
          overageRevenue = (overageCalls / 1000) * API_OVERAGE_PER_1000;
        }
        
        // Update metrics
        totalSubscribers += currentSubscribers;
        newSubscribers += monthlyNew;
        churned += monthlyChurn;
        revenue += subRevenue;
        apiRevenue += overageRevenue;
        mrr += subRevenue;
        processed++;
        
        if (!dryRun) {
          // Update subscription metrics
          sub.activeSubscribers = Math.max(0, currentSubscribers + monthlyNew - monthlyChurn);
          sub.totalSubscribers = (sub.totalSubscribers || 0) + monthlyNew;
          sub.monthlyNewSubscribers = monthlyNew;
          sub.monthlyChurnedSubscribers = monthlyChurn;
          sub.churnRate = currentSubscribers > 0 
            ? (monthlyChurn / currentSubscribers) * 100 
            : 0;
          
          // Update financial metrics
          sub.monthlyRecurringRevenue = sub.activeSubscribers * sub.monthlyPrice;
          sub.annualRecurringRevenue = sub.monthlyRecurringRevenue * 12;
          sub.totalRevenue = (sub.totalRevenue || 0) + subRevenue + overageRevenue;
          
          // Calculate LTV based on churn
          const avgLifetimeMonths = churnRate > 0 ? 1 / churnRate : 24;
          sub.customerLifetimeValue = sub.monthlyPrice * avgLifetimeMonths;
          
          await sub.save();
        }
      } catch (error) {
        errors.push({
          entityId: sub._id.toString(),
          entityType: 'SaaSSubscription',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
        });
      }
    }
    
    return {
      processed,
      totalSubscribers,
      newSubscribers,
      churned,
      revenue,
      apiRevenue,
      mrr,
      errors,
    };
  }
  
  /**
   * Process software products
   */
  private async processProducts(
    filter: Record<string, unknown>,
    gameTime: GameTime,
    dryRun?: boolean
  ): Promise<ProductProcessResult> {
    const errors: TickError[] = [];
    let processed = 0;
    let active = 0;
    let licenseRevenue = 0;
    let subscriptionRevenue = 0;
    
    // Get active software products
    const products = await SoftwareProduct.find({
      ...filter,
      status: { $in: ['Active', 'Beta'] },
    });
    
    for (const product of products) {
      try {
        // Count active products
        if (product.status === 'Active') {
          active++;
        }
        
        // Calculate monthly subscription revenue from active subscriptions
        const monthlySubRevenue = (product.activeSubscriptions || 0) * (product.pricing?.monthly || 0);
        subscriptionRevenue += monthlySubRevenue;
        
        // Simulate some license sales (1-3 per month for active products)
        if (product.status === 'Active' && !dryRun) {
          const licenseSales = Math.floor(Math.random() * 3) + 1;
          const licenseSalesRevenue = licenseSales * (product.pricing?.perpetual || 0);
          licenseRevenue += licenseSalesRevenue;
          
          // Update product metrics
          product.licenseSales = (product.licenseSales || 0) + licenseSales;
          product.totalRevenue = (product.totalRevenue || 0) + licenseSalesRevenue + monthlySubRevenue;
          
          await product.save();
        }
        
        processed++;
      } catch (error) {
        errors.push({
          entityId: product._id.toString(),
          entityType: 'SoftwareProduct',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
        });
      }
    }
    
    return {
      processed,
      active,
      licenseRevenue,
      subscriptionRevenue,
      errors,
    };
  }
  
  /**
   * Build tick summary
   */
  private buildSummary(
    subResults: SubscriptionProcessResult,
    productResults: ProductProcessResult
  ): TechTickSummary {
    const totalRevenue = subResults.revenue + subResults.apiRevenue 
      + productResults.licenseRevenue + productResults.subscriptionRevenue;
    
    const avgRevenuePerSub = subResults.totalSubscribers > 0
      ? subResults.revenue / subResults.totalSubscribers
      : 0;
    
    const netChurn = subResults.totalSubscribers > 0
      ? (subResults.churned / subResults.totalSubscribers) * 100
      : 0;
    
    return {
      // Subscriptions
      subscriptionsProcessed: subResults.processed,
      activeSubscribers: subResults.totalSubscribers,
      newSubscribers: subResults.newSubscribers,
      churnedSubscribers: subResults.churned,
      churnRate: netChurn,
      
      // Revenue
      subscriptionRevenue: subResults.revenue + productResults.subscriptionRevenue,
      apiUsageRevenue: subResults.apiRevenue,
      licenseRevenue: productResults.licenseRevenue,
      totalRevenue,
      
      // Metrics
      mrr: subResults.mrr,
      arr: subResults.mrr * 12,
      avgRevenuePerSubscriber: avgRevenuePerSub,
      
      // Products
      productsProcessed: productResults.processed,
      productsActive: productResults.active,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Singleton instance
 */
export const techProcessor = new TechProcessor();

export default techProcessor;
