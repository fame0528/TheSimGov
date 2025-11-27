/**
 * Negative Advertising Engine
 * 
 * OVERVIEW:
 * Implements attack ad effectiveness, backfire risk, ethics penalties,
 * and counter-ad mechanics for opposition research system. Ensures
 * competitive balance through strategic risk/reward trade-offs.
 * 
 * Created: 2024-11-26
 * Part of: Opposition Research System (FID-20251125-001C Phase 5)
 */

import {
  DiscoveryTier,
  ResearchQuality,
  OppositionResearch,
} from './researchTypes';

/**
 * Negative ad record
 */
export interface NegativeAd {
  id: string;
  playerId: string;
  targetId: string;
  researchId: string | null; // null for non-research based ads
  researchBased: boolean;
  amountSpent: number;
  launchedAt: Date;
  campaignPhase: 'ANNOUNCEMENT' | 'FUNDRAISING' | 'ACTIVE' | 'RESOLUTION';
  effectiveness: number; // 0-100
  backfireOccurred: boolean;
  ethicsPenaltyApplied: number; // 0-100
  voterFatigueImpact: number; // 0-1
  countered: boolean;
  counterEffectiveness: number; // 0-100 (if opponent spent to counter)
}

/**
 * Ad spending tiers for negative campaigns
 */
export const NEGATIVE_AD_SPENDING_TIERS = [
  25000,   // $25k - minimal negative ad
  50000,   // $50k - standard attack ad
  100000,  // $100k - major negative campaign
  250000,  // $250k - saturation bombing
] as const;

export type NegativeAdSpendingTier = typeof NEGATIVE_AD_SPENDING_TIERS[number];

/**
 * Spending tier multipliers for ad effectiveness
 */
const AD_SPENDING_MULTIPLIERS: Record<number, number> = {
  25000: 0.7,   // Minimal - reduced effectiveness
  50000: 1.0,   // Standard - baseline
  100000: 1.3,  // Major - strong boost
  250000: 1.5,  // Saturation - maximum (diminishing returns)
};

/**
 * Campaign phase timing bonuses
 */
const PHASE_TIMING_MULTIPLIERS: Record<string, number> = {
  ANNOUNCEMENT: 0.5,   // Early attacks less effective (voters don't care yet)
  FUNDRAISING: 0.8,    // Moderate effectiveness
  ACTIVE: 1.2,         // Peak effectiveness (voters paying attention)
  RESOLUTION: 0.9,     // Late attacks lose impact (minds made up)
};

/**
 * Get ad spending tier from amount
 */
export function getAdSpendingTier(amount: number): number {
  if (amount >= 250000) return 250000;
  if (amount >= 100000) return 100000;
  if (amount >= 50000) return 50000;
  return 25000;
}

/**
 * Calculate base ad effectiveness from research quality
 */
export function calculateResearchEffectiveness(
  researchQuality: ResearchQuality | null
): number {
  if (!researchQuality) {
    // Non-research based attack (generic negative ad)
    return 30; // Low baseline effectiveness without dirt
  }
  
  // Research-based ads scale with quality score
  return researchQuality.score;
}

/**
 * Calculate ad spending multiplier
 */
export function calculateAdSpendingMultiplier(amount: number): number {
  const tier = getAdSpendingTier(amount);
  return AD_SPENDING_MULTIPLIERS[tier];
}

/**
 * Calculate timing bonus based on campaign phase
 */
export function calculateTimingBonus(
  campaignPhase: 'ANNOUNCEMENT' | 'FUNDRAISING' | 'ACTIVE' | 'RESOLUTION'
): number {
  return PHASE_TIMING_MULTIPLIERS[campaignPhase];
}

/**
 * Calculate ethics penalty (reduces future endorsements, voter trust)
 * 
 * Formula: penalty = (100 - credibility) / 4 + repeatAttackPenalty
 */
export function calculateEthicsPenalty(
  researchCredibility: number,
  previousNegativeAdCount: number,
  adIsExtreme: boolean
): number {
  // Base penalty from low credibility (0-25)
  const credibilityPenalty = (100 - researchCredibility) / 4;
  
  // Penalty for repeated negative campaigning (5 per ad, max 40)
  const repeatPenalty = Math.min(40, previousNegativeAdCount * 5);
  
  // Extreme attack bonus penalty (false claims, personal attacks)
  const extremePenalty = adIsExtreme ? 20 : 0;
  
  return Math.min(100, credibilityPenalty + repeatPenalty + extremePenalty);
}

/**
 * Calculate voter fatigue from repeated attacks
 * 
 * Context: Voters tune out if you constantly attack opponent
 */
export function calculateVoterFatigue(
  previousNegativeAdCount: number,
  daysSinceLastAd: number
): number {
  // Recent attacks increase fatigue
  const recentAttacks = previousNegativeAdCount;
  
  // Fatigue decays over time (refresh after 7+ days)
  const timeDecay = Math.min(1, daysSinceLastAd / 7);
  
  // Fatigue formula: 10% per recent ad, reduced by time decay
  const baseFatigue = Math.min(0.6, recentAttacks * 0.1);
  const adjustedFatigue = baseFatigue * (1 - timeDecay);
  
  return adjustedFatigue;
}

/**
 * Calculate backfire probability
 * 
 * Context: Low credibility or extreme attacks can backfire,
 * hurting the attacker more than the target
 */
export function calculateBackfireProbability(
  researchCredibility: number,
  ethicsPenalty: number,
  adIsExtreme: boolean
): number {
  // Base backfire from low credibility
  const credibilityRisk = (100 - researchCredibility) / 400; // 0-25%
  
  // Ethics penalty increases backfire risk
  const ethicsRisk = ethicsPenalty / 400; // 0-25%
  
  // Extreme attacks very risky
  const extremeRisk = adIsExtreme ? 0.15 : 0;
  
  return Math.min(0.5, credibilityRisk + ethicsRisk + extremeRisk);
}

/**
 * Roll for backfire occurrence
 */
export function rollBackfire(backfireProbability: number): boolean {
  return Math.random() < backfireProbability;
}

/**
 * Calculate final ad effectiveness
 * 
 * Formula:
 * effectiveness = researchQuality × adSpendingMultiplier × timingBonus
 *                 × (1 - ethicsPenalty/100) × (1 - voterFatigue)
 */
export function calculateNegativeAdEffectiveness(
  researchQuality: ResearchQuality | null,
  adSpend: number,
  campaignPhase: 'ANNOUNCEMENT' | 'FUNDRAISING' | 'ACTIVE' | 'RESOLUTION',
  ethicsPenalty: number,
  voterFatigue: number
): number {
  const baseEffectiveness = calculateResearchEffectiveness(researchQuality);
  const spendMultiplier = calculateAdSpendingMultiplier(adSpend);
  const timingMultiplier = calculateTimingBonus(campaignPhase);
  const ethicsMultiplier = 1 - (ethicsPenalty / 100);
  const fatigueMultiplier = 1 - voterFatigue;
  
  const finalEffectiveness = 
    baseEffectiveness 
    * spendMultiplier 
    * timingMultiplier 
    * ethicsMultiplier 
    * fatigueMultiplier;
  
  return Math.min(100, Math.max(0, finalEffectiveness));
}

/**
 * Calculate polling impact from negative ad
 * 
 * Context: Effectiveness translates to polling shift
 * High effectiveness = large polling swing against opponent
 */
export function calculatePollingImpact(
  adEffectiveness: number,
  backfireOccurred: boolean
): {
  targetPollingShift: number; // Impact on opponent (negative = they lose support)
  attackerPollingShift: number; // Impact on attacker (negative = they lose support)
} {
  if (backfireOccurred) {
    // Backfire: attacker loses support instead of opponent
    return {
      targetPollingShift: adEffectiveness * 0.2 / 100, // Opponent gains a little
      attackerPollingShift: -(adEffectiveness * 0.8 / 100), // Attacker loses big
    };
  }
  
  // Normal: opponent loses support proportional to effectiveness
  // Cap at 10% polling shift (from planning document)
  const targetShift = Math.min(0.10, adEffectiveness / 100);
  
  // Attacker also loses a small amount from going negative (ethics cost)
  const attackerShift = -(targetShift * 0.1); // Lose 10% of what opponent loses
  
  return {
    targetPollingShift: -targetShift,
    attackerPollingShift: attackerShift,
  };
}

/**
 * Calculate counter-ad effectiveness
 * 
 * Context: Opponent can spend money to reduce negative ad impact
 */
export function calculateCounterAdEffectiveness(
  counterAdSpend: number,
  originalAdEffectiveness: number
): {
  reductionPercentage: number;
  reducedEffectiveness: number;
} {
  // Counter-ad effectiveness scales with spending (diminishing returns)
  const counterPower = Math.pow(counterAdSpend / 50000, 0.6); // $50k baseline
  
  // Reduce original ad effectiveness by counter power
  const reductionPercentage = Math.min(0.8, counterPower * 0.5); // Max 80% reduction
  const reducedEffectiveness = originalAdEffectiveness * (1 - reductionPercentage);
  
  return {
    reductionPercentage,
    reducedEffectiveness,
  };
}

/**
 * Count previous negative ads in time window
 */
export function countRecentNegativeAds(
  allAds: NegativeAd[],
  playerId: string,
  daysPast: number = 7
): number {
  const cutoff = new Date(Date.now() - daysPast * 24 * 60 * 60 * 1000);
  return allAds.filter(
    ad => ad.playerId === playerId && ad.launchedAt >= cutoff
  ).length;
}

/**
 * Calculate days since last negative ad
 */
export function calculateDaysSinceLastAd(
  allAds: NegativeAd[],
  playerId: string
): number {
  const playerAds = allAds
    .filter(ad => ad.playerId === playerId)
    .sort((a, b) => b.launchedAt.getTime() - a.launchedAt.getTime());
  
  if (playerAds.length === 0) return 999; // Never run negative ad
  
  const lastAd = playerAds[0];
  const daysSince = (Date.now() - lastAd.launchedAt.getTime()) / (24 * 60 * 60 * 1000);
  
  return daysSince;
}

/**
 * Get recommended ad spending based on research quality
 */
export function getRecommendedAdSpending(
  researchQuality: ResearchQuality | null,
  playerBudget: number
): {
  recommended: NegativeAdSpendingTier;
  reasoning: string;
} {
  if (!researchQuality) {
    return {
      recommended: 25000,
      reasoning: 'Generic negative ad (no research) - minimal spend recommended',
    };
  }
  
  // Major scandals deserve major ad spend
  if (researchQuality.tier === DiscoveryTier.MAJOR && playerBudget >= 250000) {
    return {
      recommended: 250000,
      reasoning: 'Major scandal discovered - saturate media for maximum impact',
    };
  }
  
  // Moderate findings need significant spend
  if (researchQuality.tier === DiscoveryTier.MODERATE && playerBudget >= 100000) {
    return {
      recommended: 100000,
      reasoning: 'Moderate scandal - major ad campaign recommended',
    };
  }
  
  // Minor findings need standard spend
  if (researchQuality.tier === DiscoveryTier.MINOR && playerBudget >= 50000) {
    return {
      recommended: 50000,
      reasoning: 'Minor issue - standard ad buy sufficient',
    };
  }
  
  // Budget-constrained
  return {
    recommended: 25000,
    reasoning: 'Limited budget - minimal negative ad campaign',
  };
}

/**
 * Format ad effectiveness as percentage for UI
 */
export function formatEffectiveness(effectiveness: number): string {
  return `${effectiveness.toFixed(1)}%`;
}

/**
 * Get effectiveness tier name
 */
export function getEffectivenessTierName(effectiveness: number): string {
  if (effectiveness >= 80) return 'Devastating';
  if (effectiveness >= 60) return 'Highly Effective';
  if (effectiveness >= 40) return 'Moderately Effective';
  if (effectiveness >= 20) return 'Somewhat Effective';
  return 'Minimally Effective';
}

/**
 * Get effectiveness color code
 */
export function getEffectivenessColor(effectiveness: number): string {
  if (effectiveness >= 80) return 'red';
  if (effectiveness >= 60) return 'orange';
  if (effectiveness >= 40) return 'yellow';
  if (effectiveness >= 20) return 'blue';
  return 'gray';
}

/**
 * Validate negative ad parameters
 */
export function validateNegativeAd(
  researchId: string | null,
  adSpend: number,
  playerBudget: number,
  campaignPhase: string
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check phase restriction
  if (campaignPhase === 'ANNOUNCEMENT') {
    errors.push('Negative ads not allowed during announcement phase');
  }
  
  // Check budget
  if (adSpend > playerBudget) {
    errors.push(`Insufficient budget ($${(adSpend / 1000).toFixed(0)}k required, $${(playerBudget / 1000).toFixed(0)}k available)`);
  }
  
  // Check spending tier
  if (adSpend < 25000) {
    errors.push('Minimum negative ad spend is $25,000');
  }
  
  if (adSpend > 250000) {
    errors.push('Maximum negative ad spend is $250,000');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate comprehensive ad analysis for UI
 */
export function generateAdAnalysis(
  researchQuality: ResearchQuality | null,
  adSpend: number,
  campaignPhase: 'ANNOUNCEMENT' | 'FUNDRAISING' | 'ACTIVE' | 'RESOLUTION',
  previousNegativeAdCount: number,
  daysSinceLastAd: number
): {
  effectiveness: number;
  backfireProbability: number;
  ethicsPenalty: number;
  voterFatigue: number;
  projectedImpact: string;
  risks: string[];
  recommendation: string;
} {
  const credibility = researchQuality?.credibility ?? 50;
  const ethicsPenalty = calculateEthicsPenalty(credibility, previousNegativeAdCount, false);
  const voterFatigue = calculateVoterFatigue(previousNegativeAdCount, daysSinceLastAd);
  const effectiveness = calculateNegativeAdEffectiveness(
    researchQuality,
    adSpend,
    campaignPhase,
    ethicsPenalty,
    voterFatigue
  );
  const backfireProbability = calculateBackfireProbability(credibility, ethicsPenalty, false);
  const impact = calculatePollingImpact(effectiveness, false);
  
  const risks: string[] = [];
  if (backfireProbability > 0.3) {
    risks.push(`High backfire risk (${(backfireProbability * 100).toFixed(0)}%)`);
  }
  if (ethicsPenalty > 40) {
    risks.push(`Severe ethics penalty (${ethicsPenalty.toFixed(0)}% damage to reputation)`);
  }
  if (voterFatigue > 0.3) {
    risks.push(`High voter fatigue (${(voterFatigue * 100).toFixed(0)}% effectiveness loss)`);
  }
  
  const projectedImpact = `${(impact.targetPollingShift * -100).toFixed(1)}% opponent polling drop`;
  
  let recommendation = '';
  if (effectiveness >= 60 && backfireProbability < 0.2) {
    recommendation = 'Strong opportunity - launch ad';
  } else if (effectiveness < 30 || backfireProbability > 0.4) {
    recommendation = 'High risk - reconsider strategy';
  } else {
    recommendation = 'Moderate risk/reward - proceed with caution';
  }
  
  return {
    effectiveness,
    backfireProbability,
    ethicsPenalty,
    voterFatigue,
    projectedImpact,
    risks,
    recommendation,
  };
}
