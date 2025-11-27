/**
 * Ad Spend Effectiveness Cycle - Campaign Advertising System
 * 
 * @fileoverview Implements 8.5-minute real cadence for campaign advertising with
 * diminishing returns model, polling impact calculations, media market targeting,
 * budget allocation optimization, and ROI tracking.
 * 
 * @module politics/engines/adSpendCycle
 * @version 1.0.0
 * @created 2025-11-25
 */

import { realToGameHours, GAME_TIME } from '@/lib/utils/politics/timeScaling';

/**
 * Ad Media Type Classification
 * 
 * Different advertising channels with varying reach and cost-effectiveness.
 */
export enum AdMediaType {
  TELEVISION = 'TELEVISION',       // Broadcast TV (high reach, expensive)
  CABLE = 'CABLE',                 // Cable TV (targeted, moderate cost)
  RADIO = 'RADIO',                 // Radio ads (local, cheap)
  DIGITAL = 'DIGITAL',             // Online ads (highly targeted, scalable)
  PRINT = 'PRINT',                 // Newspapers/magazines (declining, cheap)
  OUTDOOR = 'OUTDOOR',             // Billboards (local visibility, moderate)
  DIRECT_MAIL = 'DIRECT_MAIL',     // Mailers (personalized, expensive)
}

/**
 * Ad Cycle Configuration
 * 
 * 8.5 minutes real interval = ~1.5 game days at 168x acceleration
 * Provides frequent ad buy opportunities without overwhelming players.
 */
export const AD_CYCLE_INTERVAL_MINUTES = 8.5;
export const AD_CYCLE_INTERVAL_MS = AD_CYCLE_INTERVAL_MINUTES * 60 * 1000;

/**
 * Base Cost per Thousand Impressions (CPM) by Media Type
 * 
 * Costs in dollars per 1,000 ad impressions.
 * Varies by media type and market size.
 */
export const BASE_CPM: Record<AdMediaType, number> = {
  [AdMediaType.TELEVISION]: 35,      // $35 CPM (expensive, broad reach)
  [AdMediaType.CABLE]: 18,           // $18 CPM (moderate, targeted)
  [AdMediaType.RADIO]: 8,            // $8 CPM (cheap, local)
  [AdMediaType.DIGITAL]: 12,         // $12 CPM (scalable, targeted)
  [AdMediaType.PRINT]: 15,           // $15 CPM (declining medium)
  [AdMediaType.OUTDOOR]: 10,         // $10 CPM (visibility, local)
  [AdMediaType.DIRECT_MAIL]: 500,    // $500 CPM (personalized, expensive)
};

/**
 * Base Effectiveness Score by Media Type
 * 
 * How effective each media type is at persuading voters (0-1 scale).
 * Higher scores = better persuasion per impression.
 */
export const BASE_EFFECTIVENESS: Record<AdMediaType, number> = {
  [AdMediaType.TELEVISION]: 0.75,    // High impact, trusted medium
  [AdMediaType.CABLE]: 0.65,         // Good targeting, moderate impact
  [AdMediaType.RADIO]: 0.45,         // Lower engagement
  [AdMediaType.DIGITAL]: 0.60,       // Good targeting, varies by quality
  [AdMediaType.PRINT]: 0.40,         // Declining readership
  [AdMediaType.OUTDOOR]: 0.35,       // Passive exposure
  [AdMediaType.DIRECT_MAIL]: 0.70,   // Personalized, high attention
};

/**
 * Diminishing Returns Constants
 * 
 * Logarithmic scaling to prevent runaway advertising dominance.
 * More spending = less marginal return per dollar.
 */
export const DIMINISHING_RETURNS = {
  SCALE_FACTOR: 0.15,                // How quickly returns diminish
  MIN_EFFECTIVENESS: 0.1,            // Floor (10% of base effectiveness)
  SATURATION_THRESHOLD: 1000000,     // $1M - heavy saturation point
};

/**
 * Ad Buy Configuration
 * 
 * Represents a single advertising purchase.
 */
export interface AdBuy {
  adBuyId: string;
  campaignId: string;
  timestamp: number;                 // When ad was purchased (ms)
  gameWeek: number;                  // Game week of purchase
  
  // Ad details
  mediaType: AdMediaType;
  geography: string;                 // 'NATIONAL' or state code
  budget: number;                    // Dollars spent
  
  // Calculated metrics
  impressions: number;               // Est. number of people reached
  cpm: number;                       // Cost per thousand impressions
  effectiveness: number;             // Persuasion effectiveness (0-1)
  pollingImpact: number;             // Expected polling boost (percentage points)
  
  // Market context
  marketSize: number;                // Target market population
  competitorSpend: number;           // Competitor ad spend in same cycle
}

/**
 * Ad Campaign Summary
 * 
 * Aggregated advertising performance for a campaign.
 */
export interface AdCampaignSummary {
  campaignId: string;
  totalSpent: number;                // Total dollars spent
  totalImpressions: number;          // Total impressions delivered
  averageCPM: number;                // Average cost per thousand
  averageEffectiveness: number;      // Average persuasion score
  estimatedPollingGain: number;      // Est. total polling boost (%)
  
  // Breakdown by media type
  spendByMedia: Partial<Record<AdMediaType, number>>;
  impressionsByMedia: Partial<Record<AdMediaType, number>>;
  
  // ROI metrics
  costPerPoint: number;              // Dollars per polling percentage point
  efficiency: number;                // Overall efficiency score (0-1)
}

/**
 * Calculate Cost Per Thousand Impressions (CPM)
 * 
 * Adjusts base CPM based on market size and competition.
 * Larger markets and higher competition = higher CPM.
 * 
 * @param mediaType - Type of advertising media
 * @param marketSize - Target market population
 * @param competitiveness - Market competition level (0-1)
 * @returns CPM in dollars
 * 
 * @example
 * ```typescript
 * const cpm = calculateCPM(AdMediaType.TELEVISION, 10000000, 0.8);
 * // cpm = ~42 (base 35 * market multiplier * competition multiplier)
 * ```
 */
export function calculateCPM(
  mediaType: AdMediaType,
  marketSize: number,
  competitiveness: number = 0.5
): number {
  const baseCPM = BASE_CPM[mediaType];
  
  // Market size multiplier (larger markets = higher CPM)
  // Log scale to prevent extreme values
  const marketMultiplier = 1 + Math.log10(marketSize / 1000000) * 0.1;
  
  // Competition multiplier (more competitive = higher CPM)
  const competitionMultiplier = 1 + competitiveness * 0.3;
  
  return baseCPM * Math.max(0.5, marketMultiplier) * competitionMultiplier;
}

/**
 * Calculate number of impressions from budget
 * 
 * Determines how many people will see the ad based on spending and CPM.
 * 
 * Formula: impressions = (budget / CPM) * 1000
 * 
 * @param budget - Dollars to spend on ads
 * @param cpm - Cost per thousand impressions
 * @returns Number of impressions (ad views)
 * 
 * @example
 * ```typescript
 * const impressions = calculateImpressions(10000, 35);
 * // impressions = ~285,714 (10000 / 35 * 1000)
 * ```
 */
export function calculateImpressions(budget: number, cpm: number): number {
  if (cpm <= 0) return 0;
  return (budget / cpm) * 1000;
}

/**
 * Calculate advertising effectiveness with diminishing returns
 * 
 * Applies logarithmic scaling to prevent advertising dominance.
 * More total spending = less marginal effectiveness per dollar.
 * 
 * Formula: effectiveness = baseEffectiveness * (1 - scaleFactor * log10(totalSpend / threshold))
 * 
 * @param mediaType - Type of advertising media
 * @param totalPreviousSpend - Total dollars spent before this ad
 * @returns Effectiveness score (0-1)
 * 
 * @example
 * ```typescript
 * // First $100K ad buy - high effectiveness
 * const eff1 = calculateEffectiveness(AdMediaType.TELEVISION, 0);
 * // eff1 = 0.75 (base effectiveness)
 * 
 * // After $500K spent - reduced effectiveness
 * const eff2 = calculateEffectiveness(AdMediaType.TELEVISION, 500000);
 * // eff2 = ~0.52 (diminishing returns applied)
 * ```
 */
export function calculateEffectiveness(
  mediaType: AdMediaType,
  totalPreviousSpend: number
): number {
  const baseEffectiveness = BASE_EFFECTIVENESS[mediaType];
  
  if (totalPreviousSpend <= 0) {
    return baseEffectiveness;
  }
  
  // Logarithmic diminishing returns
  // Use log(1 + spend) to ensure monotonic decreasing effectiveness
  const spendFactor = 1 + (totalPreviousSpend / DIMINISHING_RETURNS.SATURATION_THRESHOLD);
  const diminishingFactor = 1 / Math.pow(spendFactor, DIMINISHING_RETURNS.SCALE_FACTOR);
  
  // Apply floor to prevent effectiveness from going too low
  const effectiveness = baseEffectiveness * Math.max(
    DIMINISHING_RETURNS.MIN_EFFECTIVENESS,
    diminishingFactor
  );
  
  return Math.max(0, Math.min(1, effectiveness));
}

/**
 * Calculate polling impact from ad buy
 * 
 * Estimates how much an ad buy will boost polling numbers.
 * Based on impressions, effectiveness, and market penetration.
 * 
 * Formula: impact = (impressions / marketSize) * effectiveness * 100
 * 
 * @param impressions - Number of ad impressions
 * @param effectiveness - Ad effectiveness score (0-1)
 * @param marketSize - Target market population
 * @returns Estimated polling boost in percentage points (0-100)
 * 
 * @example
 * ```typescript
 * const impact = calculatePollingImpact(500000, 0.75, 10000000);
 * // impact = 3.75% (500000/10000000 * 0.75 * 100)
 * ```
 */
export function calculatePollingImpact(
  impressions: number,
  effectiveness: number,
  marketSize: number
): number {
  if (marketSize <= 0) return 0;
  
  // Penetration rate: what % of market saw the ad
  const penetration = impressions / marketSize;
  
  // Polling impact: penetration * effectiveness * 100
  // Capped at 10% max per ad buy (prevent single-ad dominance)
  const impact = Math.min(10, penetration * effectiveness * 100);
  
  return impact;
}

/**
 * Execute ad buy
 * 
 * Processes a campaign advertising purchase, calculating all metrics
 * including impressions, effectiveness, and polling impact.
 * 
 * @param campaignId - Campaign making the purchase
 * @param mediaType - Type of advertising
 * @param geography - Geographic scope
 * @param budget - Dollars to spend
 * @param marketSize - Target market population
 * @param totalPreviousSpend - Previous total ad spending
 * @param competitorSpend - Competitor spending in same cycle
 * @param timestamp - Purchase timestamp (defaults to now)
 * @returns Complete ad buy record
 * 
 * @example
 * ```typescript
 * const adBuy = executeAdBuy(
 *   'camp-001',
 *   AdMediaType.TELEVISION,
 *   'PA',
 *   50000,
 *   13000000,
 *   200000,
 *   30000,
 *   Date.now()
 * );
 * // adBuy.pollingImpact = estimated boost from this ad
 * ```
 */
export function executeAdBuy(
  campaignId: string,
  mediaType: AdMediaType,
  geography: string,
  budget: number,
  marketSize: number,
  totalPreviousSpend: number = 0,
  competitorSpend: number = 0,
  timestamp: number = Date.now()
): AdBuy {
  // Calculate CPM based on market
  const competitiveness = Math.min(1, competitorSpend / Math.max(1, budget));
  const cpm = calculateCPM(mediaType, marketSize, competitiveness);
  
  // Calculate impressions from budget
  const impressions = calculateImpressions(budget, cpm);
  
  // Calculate effectiveness with diminishing returns
  const effectiveness = calculateEffectiveness(mediaType, totalPreviousSpend);
  
  // Calculate polling impact
  const pollingImpact = calculatePollingImpact(impressions, effectiveness, marketSize);
  
  // Calculate game week
  const gameHours = realToGameHours(timestamp);
  const gameWeek = Math.floor(gameHours / GAME_TIME.WEEK);
  
  return {
    adBuyId: `ad-${timestamp}-${campaignId}`,
    campaignId,
    timestamp,
    gameWeek,
    mediaType,
    geography,
    budget,
    impressions: Math.round(impressions),
    cpm: Number(cpm.toFixed(2)),
    effectiveness: Number(effectiveness.toFixed(3)),
    pollingImpact: Number(pollingImpact.toFixed(2)),
    marketSize,
    competitorSpend,
  };
}

/**
 * Aggregate campaign ad performance
 * 
 * Summarizes all advertising for a campaign with totals and breakdowns.
 * 
 * @param campaignId - Campaign to summarize
 * @param adBuys - All ad buys for this campaign
 * @returns Aggregated performance summary
 * 
 * @example
 * ```typescript
 * const summary = aggregateAdPerformance('camp-001', allAdBuys);
 * // summary.totalSpent = total dollars
 * // summary.costPerPoint = efficiency metric
 * ```
 */
export function aggregateAdPerformance(
  campaignId: string,
  adBuys: AdBuy[]
): AdCampaignSummary {
  const campaignAds = adBuys.filter((ad) => ad.campaignId === campaignId);
  
  if (campaignAds.length === 0) {
    return {
      campaignId,
      totalSpent: 0,
      totalImpressions: 0,
      averageCPM: 0,
      averageEffectiveness: 0,
      estimatedPollingGain: 0,
      spendByMedia: {},
      impressionsByMedia: {},
      costPerPoint: 0,
      efficiency: 0,
    };
  }
  
  // Calculate totals
  const totalSpent = campaignAds.reduce((sum, ad) => sum + ad.budget, 0);
  const totalImpressions = campaignAds.reduce((sum, ad) => sum + ad.impressions, 0);
  const estimatedPollingGain = campaignAds.reduce((sum, ad) => sum + ad.pollingImpact, 0);
  
  // Calculate averages
  const averageCPM = totalSpent > 0 ? (totalSpent / totalImpressions) * 1000 : 0;
  const averageEffectiveness =
    campaignAds.reduce((sum, ad) => sum + ad.effectiveness, 0) / campaignAds.length;
  
  // Breakdown by media type
  const spendByMedia: Partial<Record<AdMediaType, number>> = {};
  const impressionsByMedia: Partial<Record<AdMediaType, number>> = {};
  
  campaignAds.forEach((ad) => {
    spendByMedia[ad.mediaType] = (spendByMedia[ad.mediaType] || 0) + ad.budget;
    impressionsByMedia[ad.mediaType] =
      (impressionsByMedia[ad.mediaType] || 0) + ad.impressions;
  });
  
  // ROI metrics
  const costPerPoint = estimatedPollingGain > 0 ? totalSpent / estimatedPollingGain : 0;
  
  // Efficiency score (0-1): lower cost per point = higher efficiency
  // Normalize by assuming $50K per point is average (0.5 efficiency)
  const efficiency = Math.max(0, Math.min(1, 50000 / Math.max(1, costPerPoint)));
  
  return {
    campaignId,
    totalSpent: Number(totalSpent.toFixed(2)),
    totalImpressions: Math.round(totalImpressions),
    averageCPM: Number(averageCPM.toFixed(2)),
    averageEffectiveness: Number(averageEffectiveness.toFixed(3)),
    estimatedPollingGain: Number(estimatedPollingGain.toFixed(2)),
    spendByMedia,
    impressionsByMedia,
    costPerPoint: Number(costPerPoint.toFixed(2)),
    efficiency: Number(efficiency.toFixed(3)),
  };
}

/**
 * Optimize ad budget allocation
 * 
 * Recommends optimal media mix for given budget and goals.
 * Balances cost-effectiveness with reach and persuasion.
 * 
 * @param totalBudget - Total dollars to allocate
 * @param marketSize - Target market population
 * @param previousSpendByMedia - Previous spending by media type
 * @returns Recommended allocation by media type
 * 
 * @example
 * ```typescript
 * const allocation = optimizeBudgetAllocation(100000, 5000000, {});
 * // allocation[AdMediaType.DIGITAL] = 30000 (30% to digital)
 * // allocation[AdMediaType.TELEVISION] = 50000 (50% to TV)
 * ```
 */
export function optimizeBudgetAllocation(
  totalBudget: number,
  marketSize: number,
  previousSpendByMedia: Partial<Record<AdMediaType, number>> = {}
): Record<AdMediaType, number> {
  // Calculate effectiveness per dollar for each media type
  const efficiencyScores = Object.values(AdMediaType).map((mediaType) => {
    const previousSpend = previousSpendByMedia[mediaType] || 0;
    const effectiveness = calculateEffectiveness(mediaType, previousSpend);
    const cpm = calculateCPM(mediaType, marketSize, 0.5);
    const impressionsPerDollar = 1000 / cpm;
    const efficiencyScore = effectiveness * impressionsPerDollar;
    
    return { mediaType, efficiencyScore, previousSpend };
  });
  
  // Sort by efficiency (highest first)
  efficiencyScores.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
  
  // Allocate budget proportionally to efficiency scores
  const totalEfficiency = efficiencyScores.reduce((sum, e) => sum + e.efficiencyScore, 0);
  
  const allocation: Record<AdMediaType, number> = {} as Record<AdMediaType, number>;
  
  efficiencyScores.forEach(({ mediaType, efficiencyScore }) => {
    const proportion = efficiencyScore / totalEfficiency;
    allocation[mediaType] = totalBudget * proportion;
  });
  
  return allocation;
}

/**
 * Get next ad cycle time
 * 
 * Calculates when next ad cycle begins (8.5 minute intervals).
 * 
 * @param lastCycleTime - Timestamp of last ad cycle (ms)
 * @returns Timestamp when next cycle starts (ms)
 * 
 * @example
 * ```typescript
 * const nextCycle = getNextAdCycleTime(Date.now());
 * // nextCycle = Date.now() + (8.5 * 60 * 1000)
 * ```
 */
export function getNextAdCycleTime(lastCycleTime: number): number {
  return lastCycleTime + AD_CYCLE_INTERVAL_MS;
}

/**
 * Check if new ad cycle is due
 * 
 * Determines if enough time has passed for next ad buy opportunity.
 * 
 * @param lastCycleTime - Timestamp of last ad cycle (ms)
 * @param currentTime - Current timestamp (ms)
 * @returns True if new ad cycle should start
 * 
 * @example
 * ```typescript
 * if (isAdCycleDue(lastCycle, Date.now())) {
 *   // Allow new ad buys
 * }
 * ```
 */
export function isAdCycleDue(
  lastCycleTime: number,
  currentTime: number = Date.now()
): boolean {
  return currentTime >= getNextAdCycleTime(lastCycleTime);
}

/**
 * Implementation Notes:
 * 
 * 1. **8.5-Minute Cycle**: Provides ~1.5 game days between ad opportunities at 168x.
 *    Frequent enough for strategy, not overwhelming for players.
 * 
 * 2. **Diminishing Returns**: Logarithmic scaling prevents ad spend dominance.
 *    First $100K very effective, but $1M+ heavily diminished (min 10% effectiveness).
 * 
 * 3. **Media Type Balance**: Each media has different CPM and effectiveness.
 *    Digital cheap but moderate impact, TV expensive but high impact, etc.
 * 
 * 4. **Market Scaling**: Larger markets have higher CPM (competitive pressure).
 *    Small state ads cheaper than national ads.
 * 
 * 5. **Polling Impact**: Based on market penetration × effectiveness.
 *    Capped at 10% max per ad buy to prevent single-buy dominance.
 * 
 * 6. **Budget Optimization**: Algorithm allocates budget to most efficient media types
 *    considering previous spending and diminishing returns.
 * 
 * 7. **Deterministic Calculation**: All functions pure and deterministic.
 *    Given same inputs, produces identical results. Critical for fairness.
 */
