/**
 * Opposition Research Probability Calculations
 * 
 * OVERVIEW:
 * Implements discovery chance formulas for opposition research system.
 * Calculates probability of finding damaging information based on spending,
 * research type, and previous attempts. Ensures competitive balance through
 * diminishing returns and strategic resource allocation.
 * 
 * Created: 2024-11-26
 * Part of: Opposition Research System (FID-20251125-001C Phase 5)
 */

import {
  ResearchType,
  DiscoveryTier,
  BASE_DISCOVERY_RATES,
  OppositionResearch,
} from './researchTypes';

/**
 * Spending tier multipliers for discovery probability
 */
export const SPENDING_MULTIPLIERS: Record<number, number> = {
  10000: 1.0,   // $10k - baseline
  25000: 1.3,   // $25k - 30% better odds
  50000: 1.5,   // $50k - 50% better odds
  100000: 1.7,  // $100k - 70% better odds (diminishing returns)
};

/**
 * Get spending tier from amount
 */
export function getSpendingTier(amount: number): number {
  if (amount >= 100000) return 100000;
  if (amount >= 50000) return 50000;
  if (amount >= 25000) return 25000;
  return 10000;
}

/**
 * Calculate spending multiplier for discovery probability
 */
export function calculateSpendingMultiplier(amount: number): number {
  const tier = getSpendingTier(amount);
  return SPENDING_MULTIPLIERS[tier];
}

/**
 * Calculate penalty for repeated research attempts on same target
 * (diminishing returns - harder to find new dirt after initial investigation)
 */
export function calculateRepeatPenalty(previousAttempts: number): number {
  if (previousAttempts === 0) return 0;
  
  // Each previous attempt reduces odds by 15%, capped at 60% reduction
  const penalty = Math.min(0.60, previousAttempts * 0.15);
  return penalty;
}

/**
 * Calculate skeleton proximity factor
 * (Some targets have more skeletons in their closet than others)
 * 
 * @param targetId - Opponent player ID
 * @returns Multiplier between 0.7 and 1.3 (would pull from opponent data in production)
 */
export function calculateSkeletonProximity(targetId: string): number {
  // In production, this would analyze opponent's:
  // - Years in public office (more years = more potential dirt)
  // - Campaign ethics score (lower ethics = more likely to have scandals)
  // - Industry background (certain industries have more controversy)
  
  // For now, return baseline (1.0) or implement random variance
  // to avoid creating unfair advantages between players
  return 1.0;
}

/**
 * Calculate adjusted discovery probabilities based on all factors
 * 
 * Formula:
 * adjustedProb = baseProb × spendingMultiplier × skeletonProximity × (1 - repeatPenalty)
 */
export function calculateDiscoveryProbabilities(
  researchType: ResearchType,
  amountSpent: number,
  targetId: string,
  previousResearchCount: number
): Record<DiscoveryTier, number> {
  const baseRates = BASE_DISCOVERY_RATES[researchType];
  const spendMultiplier = calculateSpendingMultiplier(amountSpent);
  const skeletonFactor = calculateSkeletonProximity(targetId);
  const repeatPenalty = calculateRepeatPenalty(previousResearchCount);
  
  // Calculate overall multiplier (combines spending and skeleton proximity)
  const boostMultiplier = spendMultiplier * skeletonFactor;
  
  // Apply repeat penalty
  const finalMultiplier = boostMultiplier * (1 - repeatPenalty);
  
  // Adjust probabilities (boost higher tiers more than lower tiers)
  const adjustedNothing = baseRates.nothing / finalMultiplier;
  const adjustedMinor = baseRates.minor * Math.pow(finalMultiplier, 0.5); // Square root for gentler scaling
  const adjustedModerate = baseRates.moderate * finalMultiplier;
  const adjustedMajor = baseRates.major * Math.pow(finalMultiplier, 1.2); // Exponential for rare events
  
  // Normalize to ensure probabilities sum to 1.0
  const total = adjustedNothing + adjustedMinor + adjustedModerate + adjustedMajor;
  
  return {
    [DiscoveryTier.NOTHING]: adjustedNothing / total,
    [DiscoveryTier.MINOR]: adjustedMinor / total,
    [DiscoveryTier.MODERATE]: adjustedModerate / total,
    [DiscoveryTier.MAJOR]: adjustedMajor / total,
  };
}

/**
 * Roll for discovery outcome based on calculated probabilities
 */
export function rollDiscoveryOutcome(
  probabilities: Record<DiscoveryTier, number>
): DiscoveryTier {
  const roll = Math.random();
  let cumulative = 0;
  
  // Check each tier in order (nothing → minor → moderate → major)
  for (const tier of [
    DiscoveryTier.NOTHING,
    DiscoveryTier.MINOR,
    DiscoveryTier.MODERATE,
    DiscoveryTier.MAJOR,
  ]) {
    cumulative += probabilities[tier];
    if (roll <= cumulative) {
      return tier;
    }
  }
  
  // Fallback (should never reach here if probabilities sum to 1.0)
  return DiscoveryTier.NOTHING;
}

/**
 * Count previous research attempts on target
 */
export function countPreviousResearch(
  allResearch: OppositionResearch[],
  playerId: string,
  targetId: string,
  researchType: ResearchType
): number {
  return allResearch.filter(
    r => r.playerId === playerId 
      && r.targetId === targetId 
      && r.researchType === researchType
      && r.status === 'COMPLETE'
  ).length;
}

/**
 * Calculate expected value (EV) of research investment
 * (Helps players make informed decisions about spending)
 * 
 * EV = Σ(probability × outcomeValue)
 */
export function calculateResearchEV(
  probabilities: Record<DiscoveryTier, number>,
  amountSpent: number
): number {
  // Assign outcome values (in terms of polling impact % × $1000)
  const outcomeValues: Record<DiscoveryTier, number> = {
    [DiscoveryTier.NOTHING]: 0,
    [DiscoveryTier.MINOR]: 20000,    // ~2% polling shift worth ~$20k
    [DiscoveryTier.MODERATE]: 50000, // ~5% polling shift worth ~$50k
    [DiscoveryTier.MAJOR]: 100000,   // ~10% polling shift worth ~$100k
  };
  
  let ev = 0;
  for (const tier of Object.values(DiscoveryTier)) {
    ev += probabilities[tier] * outcomeValues[tier];
  }
  
  // Subtract cost to get net EV
  return ev - amountSpent;
}

/**
 * Calculate optimal spending amount for research type
 * (Returns tier that maximizes expected value)
 */
export function calculateOptimalSpending(
  researchType: ResearchType,
  targetId: string,
  previousResearchCount: number
): number {
  const tiers = [10000, 25000, 50000, 100000];
  let bestTier = 10000;
  let bestEV = -Infinity;
  
  for (const tier of tiers) {
    const probabilities = calculateDiscoveryProbabilities(
      researchType,
      tier,
      targetId,
      previousResearchCount
    );
    const ev = calculateResearchEV(probabilities, tier);
    
    if (ev > bestEV) {
      bestEV = ev;
      bestTier = tier;
    }
  }
  
  return bestTier;
}

/**
 * Get probability of finding at least some dirt (minor or better)
 */
export function getProbabilityOfSuccess(
  probabilities: Record<DiscoveryTier, number>
): number {
  return 1 - probabilities[DiscoveryTier.NOTHING];
}

/**
 * Format probability as percentage for UI display
 */
export function formatProbability(probability: number): string {
  return `${(probability * 100).toFixed(1)}%`;
}

/**
 * Get human-readable explanation of probability factors
 */
export function explainProbabilityFactors(
  researchType: ResearchType,
  amountSpent: number,
  previousResearchCount: number
): string[] {
  const explanations: string[] = [];
  
  // Spending tier
  const tier = getSpendingTier(amountSpent);
  const multiplier = calculateSpendingMultiplier(amountSpent);
  if (multiplier > 1.0) {
    explanations.push(
      `$${(tier / 1000).toFixed(0)}k investment: +${((multiplier - 1) * 100).toFixed(0)}% better odds`
    );
  }
  
  // Repeat penalty
  if (previousResearchCount > 0) {
    const penalty = calculateRepeatPenalty(previousResearchCount);
    explanations.push(
      `${previousResearchCount} previous attempt${previousResearchCount > 1 ? 's' : ''}: -${(penalty * 100).toFixed(0)}% penalty`
    );
  }
  
  // Research difficulty
  const baseRates = BASE_DISCOVERY_RATES[researchType];
  const nothingRate = baseRates.nothing;
  if (nothingRate >= 0.45) {
    explanations.push('High difficulty research type');
  } else if (nothingRate <= 0.35) {
    explanations.push('Easier research category');
  }
  
  return explanations;
}
