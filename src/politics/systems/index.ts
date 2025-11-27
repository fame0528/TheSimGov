/**
 * Politics Systems - Barrel Exports
 * 
 * @fileoverview Clean exports for political systems including momentum tracking
 * and opposition research mechanics.
 */

// Momentum Tracking System
export {
  MomentumDirection,
  SwingStateCategory,
  MOMENTUM_THRESHOLDS,
  SWING_STATE_THRESHOLDS,
  VOLATILITY_THRESHOLDS,
  calculateMomentumDirection,
  calculateSwingStateCategory,
  calculateVolatility,
  calculateCandidateMomentum,
  analyzeSwingState,
  calculateCampaignMomentumSummary,
  type CandidateMomentum,
  type SwingStateAnalysis,
  type CampaignMomentumSummary,
} from './momentumTracking';

// Opposition Research - Types & Categories
export {
  ResearchType,
  DiscoveryTier,
  type ResearchQuality,
  type OppositionResearch,
  BASE_DISCOVERY_RATES,
  TIER_QUALITY_SCORES,
  RESEARCH_TIME_HOURS,
  getResearchTypeName,
  getResearchTypeDescription,
  getDiscoveryTierName,
  getDiscoveryTierColor,
  generateQualityScore,
  generateCredibility,
  generateFindings,
} from './researchTypes';

// Opposition Research - Probability Calculations
export {
  SPENDING_MULTIPLIERS,
  getSpendingTier,
  calculateSpendingMultiplier,
  calculateRepeatPenalty,
  calculateSkeletonProximity,
  calculateDiscoveryProbabilities,
  rollDiscoveryOutcome,
  countPreviousResearch,
  calculateResearchEV,
  calculateOptimalSpending,
  getProbabilityOfSuccess,
  formatProbability,
  explainProbabilityFactors,
} from './researchProbability';

// Opposition Research - Cost Structures
export {
  RESEARCH_SPENDING_TIERS,
  type ResearchSpendingTier,
  getSpendingTierInfo,
  calculateOpportunityCost,
  getMaxConcurrentResearch,
  canAffordResearch,
  getRecommendedSpending,
  calculateTotalInvestment,
  estimateCompletionTime,
  calculateDiminishingReturns,
  formatCurrency,
  getSpendingTierColor,
  validateResearchSpending,
} from './researchCosts';

// Negative Advertising Engine
export {
  type NegativeAd,
  NEGATIVE_AD_SPENDING_TIERS,
  type NegativeAdSpendingTier,
  getAdSpendingTier,
  calculateResearchEffectiveness,
  calculateAdSpendingMultiplier,
  calculateTimingBonus,
  calculateEthicsPenalty,
  calculateVoterFatigue,
  calculateBackfireProbability,
  rollBackfire,
  calculateNegativeAdEffectiveness,
  calculatePollingImpact,
  calculateCounterAdEffectiveness,
  countRecentNegativeAds,
  calculateDaysSinceLastAd,
  getRecommendedAdSpending,
  formatEffectiveness,
  getEffectivenessTierName,
  getEffectivenessColor,
  validateNegativeAd,
  generateAdAnalysis,
} from './negativeAds';

