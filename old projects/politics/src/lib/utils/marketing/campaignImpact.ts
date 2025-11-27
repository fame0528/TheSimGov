/**
 * @file src/lib/utils/marketing/campaignImpact.ts
 * @description Marketing campaign impact calculator and ROI analyzer
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Campaign performance calculator for marketing department operations. Calculates ROI,
 * customer acquisition cost (CAC), lifetime value (LTV), brand lift, and market share impact.
 * Simulates campaign progression with daily metrics updates and final outcome determination.
 * 
 * USAGE:
 * ```typescript
 * import { calculateCampaignROI, simulateCampaignProgress, optimizeBudgetAllocation } from '@/lib/utils/marketing/campaignImpact';
 * 
 * // Calculate campaign ROI
 * const roi = calculateCampaignROI({
 *   budget: 150000,
 *   spent: 120000,
 *   revenue: 480000,
 *   customers: 240,
 *   impressions: 2500000,
 *   clicks: 75000,
 *   conversions: 1200
 * });
 * // Returns: { roi: 300, cac: 500, ctr: 3.0, conversionRate: 1.6, ... }
 * 
 * // Simulate campaign day-by-day
 * const progress = simulateCampaignProgress({
 *   campaignType: 'ProductLaunch',
 *   budget: 200000,
 *   duration: 60,
 *   targetMarket: 'National',
 *   channels: ['Social', 'Search', 'TV']
 * });
 * 
 * // Optimize budget across channels
 * const allocation = optimizeBudgetAllocation({
 *   totalBudget: 300000,
 *   channels: ['Social', 'Search', 'Email', 'Display'],
 *   campaignType: 'LeadGeneration',
 *   targetAudience: 'B2B'
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - ROI formula: ((revenue - spent) / spent) * 100
 * - CAC formula: spent / customers acquired
 * - LTV estimated based on industry benchmarks and customer retention
 * - CTR (Click-Through Rate): (clicks / impressions) * 100
 * - Conversion Rate: (conversions / clicks) * 100
 * - Campaign types have different base performance:
 *   - Brand Awareness: High reach (2-5M impressions), low conversion (0.5-1%), long-term brand lift
 *   - Lead Generation: Medium reach (500K-2M), high conversion (2-5%), direct ROI
 *   - Product Launch: High spend, variable ROI (50-500%), market share impact
 *   - Customer Retention: Low CAC (existing customers), high LTV multiplier (1.5-3x)
 *   - Market Expansion: Geographic growth, medium ROI (80-200%), reputation boost
 *   - Social Media: Viral potential, low cost, engagement-focused (5-15% engagement)
 * - Channel effectiveness varies by audience:
 *   - Social Media: Best for B2C, younger demographics, visual products
 *   - Search (SEM): Best for high-intent buyers, B2B services
 *   - Email: Best for retention, existing customers, high ROI (300-400%)
 *   - TV: Best for mass market, brand building, older demographics
 *   - Display: Best for retargeting, brand awareness, visual appeal
 * - Budget allocation optimization:
 *   - High-performing channels get 40-60% of budget
 *   - Diversification: Minimum 3 channels recommended
 *   - Test budget: Reserve 10-15% for experimentation
 * - Performance simulation factors:
 *   - Day-by-day ramp-up (weeks 1-2: 50% effectiveness, weeks 3-4: 80%, week 5+: 100%)
 *   - Fatigue factor after 60 days (effectiveness drops 10-20% monthly)
 *   - Seasonality adjustments (Q3 summer +20%, Q1 winter -10%)
 *   - Competition factor (saturated markets reduce effectiveness 15-30%)
 */

import type { CampaignType, MarketingChannel, TargetMarket } from '@/lib/db/models/MarketingCampaign';

/**
 * Campaign metrics input
 */
export interface CampaignMetrics {
  budget: number;
  spent: number;
  revenue: number;
  customers: number;
  impressions: number;
  clicks: number;
  conversions: number;
  leads?: number;
}

/**
 * Campaign ROI result
 */
export interface CampaignROIResult {
  roi: number;                    // Return on investment %
  cac: number;                    // Customer acquisition cost
  ctr: number;                    // Click-through rate %
  conversionRate: number;         // Conversion rate %
  costPerClick: number;           // Cost per click
  costPerImpression: number;      // Cost per 1000 impressions (CPM)
  revenuePerCustomer: number;     // Average revenue per customer
  profitMargin: number;           // Profit margin %
  performanceScore: number;       // Overall score 0-100
}

/**
 * Campaign simulation input
 */
export interface CampaignSimulationInput {
  campaignType: CampaignType;
  budget: number;
  duration: number;               // Days
  targetMarket: TargetMarket;
  channels: MarketingChannel[];
  brandReputation?: number;       // 0-100
  marketingEfficiency?: number;   // 0-100
}

/**
 * Daily campaign metrics
 */
export interface DailyCampaignMetrics {
  day: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  customers: number;
  revenue: number;
  cumulativeSpent: number;
  cumulativeRevenue: number;
  dailyROI: number;
}

/**
 * Campaign simulation result
 */
export interface CampaignSimulationResult {
  dailyMetrics: DailyCampaignMetrics[];
  finalMetrics: CampaignROIResult;
  brandLift: number;              // Brand awareness increase 0-100
  marketShareGain: number;        // Market share increase %
  reputationImpact: number;       // Reputation change -10 to +20
}

/**
 * Budget allocation input
 */
export interface BudgetAllocationInput {
  totalBudget: number;
  channels: MarketingChannel[];
  campaignType: CampaignType;
  targetAudience: 'B2B' | 'B2C' | 'Mixed';
}

/**
 * Channel allocation
 */
export interface ChannelAllocation {
  channel: MarketingChannel;
  budget: number;
  percentage: number;
  expectedROI: number;
  expectedReach: number;
}

/**
 * Budget allocation result
 */
export interface BudgetAllocationResult {
  allocations: ChannelAllocation[];
  totalExpectedROI: number;
  totalExpectedReach: number;
}

/**
 * Channel effectiveness by campaign type and audience
 */
const CHANNEL_EFFECTIVENESS: Record<
  MarketingChannel,
  { b2b: number; b2c: number; baseReach: number; baseCTR: number; baseCPC: number }
> = {
  Social: { b2b: 0.7, b2c: 1.2, baseReach: 100000, baseCTR: 2.5, baseCPC: 0.8 },
  Search: { b2b: 1.3, b2c: 1.0, baseReach: 50000, baseCTR: 4.0, baseCPC: 2.5 },
  Display: { b2b: 0.6, b2c: 0.9, baseReach: 200000, baseCTR: 0.8, baseCPC: 0.5 },
  Email: { b2b: 1.1, b2c: 1.0, baseReach: 20000, baseCTR: 15.0, baseCPC: 0.1 },
  TV: { b2b: 0.5, b2c: 1.5, baseReach: 500000, baseCTR: 0.3, baseCPC: 10.0 },
  Radio: { b2b: 0.4, b2c: 1.1, baseReach: 150000, baseCTR: 0.5, baseCPC: 5.0 },
  Print: { b2b: 0.8, b2c: 0.7, baseReach: 75000, baseCTR: 0.4, baseCPC: 8.0 },
  Outdoor: { b2b: 0.3, b2c: 1.0, baseReach: 300000, baseCTR: 0.2, baseCPC: 12.0 },
};

/**
 * Campaign type base metrics
 */
const CAMPAIGN_TYPE_METRICS: Record<
  CampaignType,
  { baseROI: number; baseConversionRate: number; brandLiftFactor: number }
> = {
  BrandAwareness: { baseROI: 50, baseConversionRate: 0.8, brandLiftFactor: 2.5 },
  LeadGeneration: { baseROI: 180, baseConversionRate: 3.5, brandLiftFactor: 0.5 },
  ProductLaunch: { baseROI: 250, baseConversionRate: 2.0, brandLiftFactor: 1.5 },
  CustomerRetention: { baseROI: 320, baseConversionRate: 8.0, brandLiftFactor: 0.3 },
  MarketExpansion: { baseROI: 140, baseConversionRate: 1.8, brandLiftFactor: 1.8 },
  SocialMedia: { baseROI: 200, baseConversionRate: 2.5, brandLiftFactor: 2.0 },
};

/**
 * Calculate campaign ROI and performance metrics
 * 
 * @param metrics - Campaign performance metrics
 * @returns ROI analysis with key performance indicators
 * 
 * @example
 * ```typescript
 * const roi = calculateCampaignROI({
 *   budget: 100000,
 *   spent: 85000,
 *   revenue: 340000,
 *   customers: 170,
 *   impressions: 1500000,
 *   clicks: 45000,
 *   conversions: 850
 * });
 * ```
 */
export function calculateCampaignROI(metrics: CampaignMetrics): CampaignROIResult {
  const {
    budget: _budget,
    spent,
    revenue,
    customers,
    impressions,
    clicks,
    conversions,
  } = metrics;

  // ROI
  const roi = spent > 0 ? ((revenue - spent) / spent) * 100 : 0;

  // CAC
  const cac = customers > 0 ? spent / customers : 0;

  // CTR
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

  // Conversion rate
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

  // Cost per click
  const costPerClick = clicks > 0 ? spent / clicks : 0;

  // CPM (cost per 1000 impressions)
  const costPerImpression = impressions > 0 ? (spent / impressions) * 1000 : 0;

  // Revenue per customer
  const revenuePerCustomer = customers > 0 ? revenue / customers : 0;

  // Profit margin
  const profitMargin = revenue > 0 ? ((revenue - spent) / revenue) * 100 : 0;

  // Performance score (0-100)
  let performanceScore = 0;
  performanceScore += Math.min(40, (roi / 200) * 40); // ROI up to 200% = 40 points
  performanceScore += Math.min(30, conversionRate * 6); // Conversion up to 5% = 30 points
  performanceScore += Math.min(20, ctr * 4); // CTR up to 5% = 20 points
  performanceScore += Math.min(10, (profitMargin / 100) * 10); // Profit margin 100% = 10 points

  return {
    roi: Math.round(roi * 100) / 100,
    cac: Math.round(cac * 100) / 100,
    ctr: Math.round(ctr * 100) / 100,
    conversionRate: Math.round(conversionRate * 100) / 100,
    costPerClick: Math.round(costPerClick * 100) / 100,
    costPerImpression: Math.round(costPerImpression * 100) / 100,
    revenuePerCustomer: Math.round(revenuePerCustomer * 100) / 100,
    profitMargin: Math.round(profitMargin * 100) / 100,
    performanceScore: Math.round(performanceScore),
  };
}

/**
 * Simulate campaign performance day-by-day
 * 
 * @param input - Campaign simulation parameters
 * @returns Daily metrics and final performance
 * 
 * @example
 * ```typescript
 * const simulation = simulateCampaignProgress({
 *   campaignType: 'BrandAwareness',
 *   budget: 250000,
 *   duration: 90,
 *   targetMarket: 'National',
 *   channels: ['Social', 'TV', 'Outdoor'],
 *   brandReputation: 70,
 *   marketingEfficiency: 75
 * });
 * ```
 */
export function simulateCampaignProgress(
  input: CampaignSimulationInput
): CampaignSimulationResult {
  const {
    campaignType,
    budget,
    duration,
    targetMarket,
    channels,
    brandReputation = 50,
    marketingEfficiency = 50,
  } = input;

  const typeMetrics = CAMPAIGN_TYPE_METRICS[campaignType];
  const dailyBudget = budget / duration;

  const dailyMetrics: DailyCampaignMetrics[] = [];
  let cumulativeSpent = 0;
  let cumulativeRevenue = 0;

  // Calculate average channel effectiveness
  const avgChannelMultiplier =
    channels.reduce((sum, ch) => {
      const effectiveness = CHANNEL_EFFECTIVENESS[ch];
      return sum + (effectiveness.b2c + effectiveness.b2b) / 2;
    }, 0) / channels.length;

  // Base daily reach (impressions)
  let baseDailyReach = 10000;
  if (targetMarket === 'National') baseDailyReach *= 5;
  else if (targetMarket === 'Regional') baseDailyReach *= 2;
  else if (targetMarket === 'International') baseDailyReach *= 8;

  baseDailyReach *= channels.length * 0.8; // More channels = more reach

  for (let day = 0; day < duration; day++) {
    // Ramp-up factor (campaigns take time to gain momentum)
    let rampUpFactor = 1.0;
    if (day < 7) rampUpFactor = 0.5; // Week 1: 50%
    else if (day < 14) rampUpFactor = 0.7; // Week 2: 70%
    else if (day < 21) rampUpFactor = 0.9; // Week 3: 90%

    // Fatigue factor (campaigns lose effectiveness over time)
    const fatigueFactorApplied = day > 60 ? 0.9 - ((day - 60) / 100) : 1.0;

    // Efficiency factor (marketing dept efficiency)
    const efficiencyFactor = 0.5 + (marketingEfficiency / 100) * 0.5; // 0.5-1.0x

    // Reputation factor (brand reputation helps campaigns)
    const reputationFactor = 0.7 + (brandReputation / 100) * 0.6; // 0.7-1.3x

    // Daily spend
    const dailySpent = dailyBudget * rampUpFactor;
    cumulativeSpent += dailySpent;

    // Daily impressions
    const dailyImpressions = Math.round(
      baseDailyReach * rampUpFactor * efficiencyFactor * reputationFactor * fatigueFactorApplied
    );

    // Base CTR from campaign type and channels
    const baseCTR =
      channels.reduce((sum, ch) => sum + CHANNEL_EFFECTIVENESS[ch].baseCTR, 0) /
      channels.length;
    const adjustedCTR = (baseCTR / 100) * avgChannelMultiplier * efficiencyFactor;

    // Daily clicks
    const dailyClicks = Math.round(dailyImpressions * adjustedCTR);

    // Daily conversions
    const baseConversionRate = typeMetrics.baseConversionRate / 100;
    const adjustedConversionRate =
      baseConversionRate * reputationFactor * efficiencyFactor;
    const dailyConversions = Math.round(dailyClicks * adjustedConversionRate);

    // Daily customers (conversion to customer ratio varies by type)
    const customerConversionRate = campaignType === 'LeadGeneration' ? 0.4 : 0.7;
    const dailyCustomers = Math.round(dailyConversions * customerConversionRate);

    // Daily revenue (based on average order value)
    const avgOrderValue = 500 + (brandReputation - 50) * 10; // $500 base, +reputation
    const dailyRevenue = dailyCustomers * avgOrderValue;
    cumulativeRevenue += dailyRevenue;

    // Daily ROI
    const dailyROI =
      dailySpent > 0 ? ((dailyRevenue - dailySpent) / dailySpent) * 100 : 0;

    dailyMetrics.push({
      day,
      spent: Math.round(dailySpent),
      impressions: dailyImpressions,
      clicks: dailyClicks,
      conversions: dailyConversions,
      customers: dailyCustomers,
      revenue: Math.round(dailyRevenue),
      cumulativeSpent: Math.round(cumulativeSpent),
      cumulativeRevenue: Math.round(cumulativeRevenue),
      dailyROI: Math.round(dailyROI * 100) / 100,
    });
  }

  // Calculate totals
  const totalImpressions = dailyMetrics.reduce((sum, d) => sum + d.impressions, 0);
  const totalClicks = dailyMetrics.reduce((sum, d) => sum + d.clicks, 0);
  const totalConversions = dailyMetrics.reduce((sum, d) => sum + d.conversions, 0);
  const totalCustomers = dailyMetrics.reduce((sum, d) => sum + d.customers, 0);

  const finalMetrics = calculateCampaignROI({
    budget,
    spent: cumulativeSpent,
    revenue: cumulativeRevenue,
    customers: totalCustomers,
    impressions: totalImpressions,
    clicks: totalClicks,
    conversions: totalConversions,
  });

  // Brand lift (0-100 points)
  const brandLift = Math.min(
    100,
    (totalImpressions / 1000000) * typeMetrics.brandLiftFactor * (marketingEfficiency / 100) * 10
  );

  // Market share gain (0-5%)
  const marketShareGain = Math.min(
    5,
    (finalMetrics.roi / 100) * 0.5 * (campaignType === 'ProductLaunch' ? 2 : 1)
  );

  // Reputation impact (-10 to +20)
  let reputationImpact = 0;
  if (finalMetrics.roi > 150) reputationImpact = 15;
  else if (finalMetrics.roi > 100) reputationImpact = 10;
  else if (finalMetrics.roi > 50) reputationImpact = 5;
  else if (finalMetrics.roi < 0) reputationImpact = -5;
  else if (finalMetrics.roi < -50) reputationImpact = -10;

  return {
    dailyMetrics,
    finalMetrics,
    brandLift: Math.round(brandLift * 100) / 100,
    marketShareGain: Math.round(marketShareGain * 100) / 100,
    reputationImpact,
  };
}

/**
 * Optimize budget allocation across marketing channels
 * 
 * @param input - Budget allocation parameters
 * @returns Optimized channel budget allocation
 * 
 * @example
 * ```typescript
 * const allocation = optimizeBudgetAllocation({
 *   totalBudget: 500000,
 *   channels: ['Social', 'Search', 'Email', 'TV'],
 *   campaignType: 'ProductLaunch',
 *   targetAudience: 'B2C'
 * });
 * ```
 */
export function optimizeBudgetAllocation(
  input: BudgetAllocationInput
): BudgetAllocationResult {
  const { totalBudget, channels, campaignType, targetAudience } = input;

  // Calculate channel scores
  const channelScores: { channel: MarketingChannel; score: number }[] = channels.map(
    (channel) => {
      const effectiveness = CHANNEL_EFFECTIVENESS[channel];
      const audienceMultiplier =
        targetAudience === 'B2B'
          ? effectiveness.b2b
          : targetAudience === 'B2C'
          ? effectiveness.b2c
          : (effectiveness.b2b + effectiveness.b2c) / 2;

      // Campaign type affinity
      let campaignAffinity = 1.0;
      if (campaignType === 'BrandAwareness' && ['TV', 'Outdoor', 'Social'].includes(channel)) {
        campaignAffinity = 1.3;
      } else if (campaignType === 'LeadGeneration' && ['Search', 'Email'].includes(channel)) {
        campaignAffinity = 1.4;
      } else if (campaignType === 'SocialMedia' && channel === 'Social') {
        campaignAffinity = 1.5;
      }

      const score = audienceMultiplier * campaignAffinity * effectiveness.baseCTR;
      return { channel, score };
    }
  );

  // Sort by score
  channelScores.sort((a, b) => b.score - a.score);

  // Allocate budget (top channel gets 40%, second 30%, rest split remaining)
  const allocations: ChannelAllocation[] = [];
  const totalScore = channelScores.reduce((sum, cs) => sum + cs.score, 0);

  let totalExpectedROI = 0;
  let totalExpectedReach = 0;

  channelScores.forEach(({ channel, score }, _index) => {
    // Weight allocation by score
    const percentage = (score / totalScore) * 100;
    const budget = Math.round((totalBudget * percentage) / 100);

    const effectiveness = CHANNEL_EFFECTIVENESS[channel];
    const typeMetrics = CAMPAIGN_TYPE_METRICS[campaignType];

    // Expected ROI (base + channel modifier)
    const expectedROI =
      typeMetrics.baseROI *
      (targetAudience === 'B2B' ? effectiveness.b2b : effectiveness.b2c);

    // Expected reach
    const expectedReach = (budget / effectiveness.baseCPC) * effectiveness.baseReach * 0.01;

    allocations.push({
      channel,
      budget,
      percentage: Math.round(percentage * 100) / 100,
      expectedROI: Math.round(expectedROI),
      expectedReach: Math.round(expectedReach),
    });

    totalExpectedROI += (budget / totalBudget) * expectedROI;
    totalExpectedReach += expectedReach;
  });

  return {
    allocations,
    totalExpectedROI: Math.round(totalExpectedROI),
    totalExpectedReach: Math.round(totalExpectedReach),
  };
}
