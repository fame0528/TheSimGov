/**
 * @fileoverview Extended lobbying probability calculator (Phase 4 - FID-20251125-001A)
 * @module lib/utils/politics/lobbyingBase
 *
 * Implements deterministic probability formula extending legacy getLobbyingSuccessProbability
 * with state composite, election proximity multiplier, refined spending term, influence plateau,
 * linear reputation term, soft easing and micro jitter (spec documented in
 * LOBBYING_PROBABILITY_SPEC_FID-20251125-001A_20251125.md).
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
  LOBBY_MAX_PROBABILITY
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

/** Main probability calculator returning breakdown. */
export function computeLobbyingProbability(inputs: LobbyingProbabilityInputs): LobbyingProbabilityResult {
  const {
    officeLevel,
    donationAmount,
    playerInfluenceScore,
    reputation,
    compositeInfluenceWeight,
    weeksUntilElection,
    seed
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

  // Reputation linear term added post multiplicative stack
  const reputationTerm = (clamp(reputation, 0, 100) / 100) * LOBBY_REPUTATION_WEIGHT;

  // Raw probability architecture (base multiplicative core then additive reputation and jitter)
  const core = base
    * (1 + spendTerm)
    * (1 + influenceWeightApplied)
    * stateCompositeContribution
    * proximityMultiplier;

  const jitter = deriveJitter(seed, donationAmount);
  let rawUnclamped = core + reputationTerm + jitter; // reputation additive per spec

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
    seed
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
// - Future logistic reputation term will replace linear mapping without altering interface.
