/**
 * @fileoverview Extended lobbying probability calculator (Phase 9 - FID-20251125-001C)
 * @module lib/utils/politics/lobbyingBase
 *
 * Implements deterministic probability formula extending legacy getLobbyingSuccessProbability
 * with state composite, election proximity multiplier, refined spending term, influence plateau,
 * reputation term (linear or logistic), soft easing, micro jitter, prior success bonus,
 * and economic condition modifier.
 * 
 * Phase 9 Additions:
 * - Prior success bonus with diminishing returns
 * - Economic condition modifier (-5% to +5%)
 * - Logistic reputation curve option (replaces linear)
 * 
 * Spec documented in LOBBYING_PROBABILITY_SPEC_FID-20251125-001A_20251125.md
 */
import type { LobbyingProbabilityInputs, LobbyingProbabilityResult, LobbyingProbabilityBreakdown } from '@/lib/types/politicsInfluence';
import { normalizedHash } from '@/lib/utils/deterministicHash';
import {
  LOBBY_SPEND_SCALE,
  LOBBY_SPENDING_WEIGHT,
  LOBBY_INFLUENCE_SCALE,
  LOBBY_INFLUENCE_WEIGHT,
  LOBBY_REPUTATION_WEIGHT,
  LOBBY_PROXIMITY_WEIGHT,
  LOBBY_PROXIMITY_DECAY_HALF_LIFE,
  LOBBY_STATE_COMPOSITE_FACTOR,
  LOBBY_SOFT_MAX,
  LOBBY_SOFT_EASING_FACTOR,
  LOBBY_JITTER_RANGE_ABS,
  LOBBY_JITTER_SPEND_THRESHOLD,
  LOBBY_DIFFICULTY_BASE,
  LOBBY_MIN_PROBABILITY,
  LOBBY_MAX_PROBABILITY,
  // Phase 9 constants
  LOBBY_PRIOR_SUCCESS_BASE,
  LOBBY_PRIOR_SUCCESS_DECAY,
  LOBBY_PRIOR_SUCCESS_CAP,
  LOBBY_ECONOMIC_MODIFIER_MIN,
  LOBBY_ECONOMIC_MODIFIER_MAX,
  LOBBY_REPUTATION_MIDPOINT,
  LOBBY_REPUTATION_STEEPNESS
} from './influenceConstants';

function clamp(v: number, min: number, max: number): number { return v < min ? min : v > max ? max : v; }

/** Natural log10 safe wrapper. */
function log10Safe(n: number): number { return n <= 0 ? 0 : Math.log10(n); }

/** Compute election proximity multiplier using exponential decay. */
function computeProximityMultiplier(weeksUntilElection: number): number {
  const w = Math.max(0, weeksUntilElection);
  const normalized = Math.exp(-w / LOBBY_PROXIMITY_DECAY_HALF_LIFE); // exp decay
  return 1 + LOBBY_PROXIMITY_WEIGHT * normalized;
}

/** Micro jitter derivation (±LOBBY_JITTER_RANGE_ABS) if spend above threshold. */
function deriveJitter(seed: string | undefined, donationAmount: number): number {
  if (!seed || donationAmount < LOBBY_JITTER_SPEND_THRESHOLD) return 0;
  const normalized = normalizedHash(seed + '|lobby|' + donationAmount);
  return normalized * LOBBY_JITTER_RANGE_ABS; // already centered [-1,1] * range
}

/**
 * Compute prior success bonus with diminishing returns.
 * Formula: sum of LOBBY_PRIOR_SUCCESS_BASE * LOBBY_PRIOR_SUCCESS_DECAY^i for i=0..n-1
 * Capped at LOBBY_PRIOR_SUCCESS_CAP.
 */
function computePriorSuccessBonus(priorSuccessCount: number): number {
  if (priorSuccessCount <= 0) return 0;
  let bonus = 0;
  for (let i = 0; i < priorSuccessCount; i++) {
    bonus += LOBBY_PRIOR_SUCCESS_BASE * Math.pow(LOBBY_PRIOR_SUCCESS_DECAY, i);
  }
  return Math.min(bonus, LOBBY_PRIOR_SUCCESS_CAP);
}

/**
 * Compute economic condition modifier.
 * economicCondition ranges from -1 (recession) to +1 (boom), 0 = neutral.
 * Returns value in range [LOBBY_ECONOMIC_MODIFIER_MIN, LOBBY_ECONOMIC_MODIFIER_MAX].
 */
function computeEconomicModifier(economicCondition: number): number {
  const clamped = clamp(economicCondition, -1, 1);
  if (clamped >= 0) {
    return clamped * LOBBY_ECONOMIC_MODIFIER_MAX;
  } else {
    return clamped * Math.abs(LOBBY_ECONOMIC_MODIFIER_MIN);
  }
}

/**
 * Compute logistic reputation term (S-curve).
 * Provides smoother transition than linear with natural caps.
 * Formula: weight * (1 / (1 + exp(-steepness * (rep - midpoint))))
 */
function computeLogisticReputationTerm(reputation: number): number {
  const rep = clamp(reputation, 0, 100);
  const logistic = 1 / (1 + Math.exp(-LOBBY_REPUTATION_STEEPNESS * (rep - LOBBY_REPUTATION_MIDPOINT)));
  return logistic * LOBBY_REPUTATION_WEIGHT;
}

/**
 * Compute linear reputation term (legacy behavior).
 */
function computeLinearReputationTerm(reputation: number): number {
  return (clamp(reputation, 0, 100) / 100) * LOBBY_REPUTATION_WEIGHT;
}

/** Main probability calculator returning breakdown. */
export function computeLobbyingProbability(inputs: LobbyingProbabilityInputs): LobbyingProbabilityResult {
  const {
    officeLevel,
    donationAmount,
    playerInfluenceScore,
    reputation,
    compositeInfluenceWeight,
    weeksUntilElection,
    seed,
    // Phase 9 extended inputs
    priorSuccessCount = 0,
    economicCondition = 0,
    useLogisticReputation = true
  } = inputs;

  // Difficulty base (fallback to 0.30 local if unknown)
  const base = LOBBY_DIFFICULTY_BASE[officeLevel] ?? LOBBY_DIFFICULTY_BASE.LOCAL;

  // Spending term: log10(1 + amount / scale) * spendingWeight
  const spendTerm = log10Safe(1 + donationAmount / LOBBY_SPEND_SCALE) * LOBBY_SPENDING_WEIGHT;

  // Influence plateau 0..1
  const influencePlateau = clamp(playerInfluenceScore / LOBBY_INFLUENCE_SCALE, 0, 1);
  const influenceWeightApplied = influencePlateau * LOBBY_INFLUENCE_WEIGHT;

  // State composite contribution multiplier (1 .. 1+factor)
  const stateCompositeWeight = clamp(compositeInfluenceWeight, 0, 1);
  const stateCompositeContribution = 1 + stateCompositeWeight * LOBBY_STATE_COMPOSITE_FACTOR;

  // Election proximity multiplier
  const proximityMultiplier = computeProximityMultiplier(weeksUntilElection);

  // Reputation term - Phase 9: use logistic or linear based on flag
  const reputationCurveType: 'linear' | 'logistic' = useLogisticReputation ? 'logistic' : 'linear';
  const reputationTerm = useLogisticReputation
    ? computeLogisticReputationTerm(reputation)
    : computeLinearReputationTerm(reputation);

  // Phase 9: Prior success bonus (diminishing returns)
  const priorSuccessBonus = computePriorSuccessBonus(priorSuccessCount);

  // Phase 9: Economic condition modifier
  const economicModifier = computeEconomicModifier(economicCondition);

  // Raw probability architecture (base multiplicative core then additive terms)
  const core = base
    * (1 + spendTerm)
    * (1 + influenceWeightApplied)
    * stateCompositeContribution
    * proximityMultiplier;

  const jitter = deriveJitter(seed, donationAmount);
  
  // Combine all additive terms: reputation + prior success + economic + jitter
  let rawUnclamped = core + reputationTerm + priorSuccessBonus + economicModifier + jitter;

  // Soft easing before clamp
  let softened = rawUnclamped;
  if (softened > LOBBY_SOFT_MAX) {
    softened = LOBBY_SOFT_MAX + (softened - LOBBY_SOFT_MAX) * LOBBY_SOFT_EASING_FACTOR;
  }

  const final = clamp(softened, LOBBY_MIN_PROBABILITY, LOBBY_MAX_PROBABILITY);

  const breakdown: LobbyingProbabilityBreakdown = {
    base,
    spendTerm,
    influencePlateau,
    influenceWeightApplied,
    stateCompositeWeight,
    stateCompositeContribution,
    proximityMultiplier,
    reputationTerm,
    jitter,
    rawUnclamped,
    softened,
    final,
    seed,
    // Phase 9 extended breakdown
    priorSuccessBonus,
    economicModifier,
    reputationCurveType
  };

  return {
    probability: final,
    breakdown
  };
}

// IMPLEMENTATION NOTES:
// - Returns probability as decimal 0..1 range (base values defined accordingly).
//   Presentation layer can multiply by 100 for percentage display.
// - Legacy getLobbyingSuccessProbability used integer percent; this extended version
//   works in decimal space for finer calibration. Migration adapter can convert if needed.
// - Deterministic jitter integrates donationAmount to differentiate attempts with same seed.
// - Phase 9 additions:
//   * priorSuccessBonus: Rewards consistent lobbying engagement with diminishing returns.
//   * economicModifier: Ties lobbying to game economy state for emergent gameplay.
//   * Logistic reputation: S-curve provides more intuitive progression than linear.
// - All new factors are additive after the multiplicative core, maintaining formula structure.
// - Backward compatible: Phase 9 inputs have sensible defaults (0, 0, true).
