/**
 * OVERVIEW
 * Baseline lobbying success probability using spend amount and composite influence weight.
 * Pure, deterministic logistic curve capped to [0.05, 0.95] to avoid certainty.
 */

import type { DerivedMetrics } from './stateDerivedMetrics';

/**
 * Compute lobbying success probability.
 * Uses capped logistic function: P = min(max(logistic(spend * weight), 0.05), 0.95)
 * @param spendAmount - amount spent in lobbying action (smallest currency unit)
 * @param compositeWeight - [0, 1] from stateDerivedMetrics
 * @param spendScale - scaling factor for spend (default 10000 to normalize typical values)
 * @returns probability [0.05, 0.95]
 */
export function computeLobbyingProbability(
  spendAmount: number,
  compositeWeight: number,
  spendScale = 10000
): number {
  const w = Math.max(0, Math.min(1, compositeWeight));
  const s = Math.max(0, spendAmount);
  
  // Special case: zero spend always returns minimum probability
  if (s === 0) return 0.05;
  
  // Normalized input: x = (spend * weight) / spendScale
  const x = (s * w) / spendScale;
  
  // Logistic: L(x) = 1 / (1 + e^(-x))
  const logistic = 1 / (1 + Math.exp(-x));
  
  // Clamp to [0.05, 0.95] to prevent guaranteed success/failure
  const clamped = Math.max(0.05, Math.min(0.95, logistic));
  
  return clamped;
}

/**
 * Get lobbying probability for a state given derived metrics and spend.
 */
export function getStateLobbyingProbability(
  derived: DerivedMetrics | null,
  spendAmount: number,
  spendScale = 10000
): number {
  if (!derived) return 0.05; // minimum probability if no metrics
  return computeLobbyingProbability(spendAmount, derived.compositeInfluenceWeight, spendScale);
}

/**
 * Compute diminishing returns factor for repeated lobbying within a time window.
 * Each action reduces effectiveness multiplicatively.
 * @param actionCount - number of prior actions in window
 * @param decayRate - decay factor per action (default 0.85)
 * @returns multiplier [0, 1]
 */
export function computeDiminishingReturns(actionCount: number, decayRate = 0.85): number {
  return Math.pow(decayRate, Math.max(0, actionCount));
}

/**
 * Notes
 * - Baseline probability capped to avoid exploitation
 * - Advanced modifiers (endorsements, crises) apply multiplicatively in Phase 2
 * - Diminishing returns factor intended for repeated actions within short windows
 */
