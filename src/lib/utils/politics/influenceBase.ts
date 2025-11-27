/**
 * @fileoverview Baseline political influence computation (Phase 4 - FID-20251125-001A)
 * @module lib/utils/politics/influenceBase
 *
 * Implements deterministic composite influence formula defined in
 * INFLUENCE_BASELINE_SPEC_FID-20251125-001A_20251125.md.
 * Reuses legacy donation scaling via calculateInfluencePoints and centralizes
 * constants in influenceConstants.ts.
 *
 * PURE & DETERMINISTIC: No side effects, all outputs reproducible from inputs.
 *
 * COMPONENTS:
 *  - Donation log segment (legacy reuse)
 *  - Level multiplier (legacy parity)
 *  - State composite contribution
 *  - Election proximity quadratic bonus
 *  - Reputation additive factor (>50 only)
 *  - Diminishing returns soft cap (rational compression)
 *  - Fairness floor clamp (level minimum vs 90% prior snapshot)
 *  - Optional deterministic micro jitter (±MICRO_JITTER_MAX)
 */
import { calculateInfluencePoints } from '@/lib/utils/politicalinfluence';
import { normalizedHash } from '@/lib/utils/deterministicHash';
import type { BaseInfluenceInputs, InfluenceResult, InfluenceComponentBreakdown } from '@/lib/types/politicsInfluence';
import {
  DONATION_LOG_BASE_MIN,
  LEVEL_MULTIPLIER_MAP,
  STATE_SCALE,
  ELECTION_MAX_BONUS,
  SOFT_CAP_TARGET,
  MICRO_JITTER_MAX
} from './influenceConstants';
import { computeFairnessFloor } from './offlineProtection';

// ---------------- Internal Helpers ----------------

/** Clamp value between min and max. */
function clamp(v: number, min: number, max: number): number { return v < min ? min : v > max ? max : v; }

/** Quadratic election proximity weighting. weeksToElection >= 0. */
function computeElectionProximity(weeksToElection: number, window: number = 52): number {
  const ratio = clamp((window - weeksToElection) / window, 0, 1);
  const weighted = ratio * ratio; // quadratic emphasis late cycle
  return weighted * ELECTION_MAX_BONUS;
}

/** Reputation factor (linear, only positive above 50). */
function computeReputationFactor(reputation: number): number {
  if (reputation <= 50) return 0;
  return ((reputation - 50) / 50) * 10; // max +10 at 100
}

/** Rational diminishing returns compression. */
function applySoftCap(value: number): number {
  // compressed = value * (SOFT_CAP_TARGET / (SOFT_CAP_TARGET + value))
  return value * (SOFT_CAP_TARGET / (SOFT_CAP_TARGET + value));
}

// Fairness floor logic extracted to offlineProtection.ts for DRY reuse.

/** Deterministic micro jitter derived from FNV-1a 32-bit hash over seed scope. */
function deriveSeedJitter(seed: string | number | undefined): number | undefined {
  if (seed === undefined) return undefined;
  const normalized = normalizedHash(String(seed) + '|influence');
  return normalized * MICRO_JITTER_MAX;
}

/** Extract base donation log (without legacy multiplier) for breakdown transparency. */
function computeDonationLogRaw(amount: number): number {
  if (amount < DONATION_LOG_BASE_MIN) return 0;
  return Math.log10(amount / DONATION_LOG_BASE_MIN) * 10; // matches legacy pre-multiplier scaling
}

// ---------------- Main Function ----------------

export function computeBaselineInfluence(inputs: BaseInfluenceInputs): InfluenceResult {
  const {
    donationAmount,
    totalDonations,
    companyLevel,
    compositeInfluenceWeight,
    weeksToElection,
    reputation,
    successfulLobbies,
    seed,
    previousSnapshotInfluence
  } = inputs;

  // Legacy donation influence using total donations for historical continuity (not just latest donation)
  const donationInfluence = calculateInfluencePoints(donationAmount, companyLevel);
  const baseDonationLog = computeDonationLogRaw(donationAmount);
  const levelMultiplier = LEVEL_MULTIPLIER_MAP[companyLevel] ?? 1.0;

  // State composite contribution
  const stateComposite = compositeInfluenceWeight * STATE_SCALE;

  // Election proximity
  const electionProximity = computeElectionProximity(weeksToElection);

  // Reputation additive factor
  const reputationFactor = computeReputationFactor(reputation);

  // Pre-compression aggregate (replace donationInfluence with baseDonationLog * levelMultiplier for transparency parity)
  const donationSegment = Math.floor(baseDonationLog * levelMultiplier);
  const preCompressed = donationSegment + stateComposite + electionProximity + reputationFactor;

  // Apply soft cap compression
  const compressed = applySoftCap(preCompressed);

  // Fairness floor
  const fairnessFloor = computeFairnessFloor(companyLevel, previousSnapshotInfluence);
  let finalInfluence = Math.max(fairnessFloor, compressed);

  // Optional deterministic jitter applied post clamp but cannot break floor
  const seedJitter = deriveSeedJitter(seed);
  if (seedJitter !== undefined) {
    const jittered = finalInfluence + seedJitter;
    // Ensure floor maintained after jitter
    finalInfluence = jittered < fairnessFloor ? fairnessFloor : jittered;
  }

  const breakdown: InfluenceComponentBreakdown = {
    donationLog: baseDonationLog,
    levelMultiplierFactor: levelMultiplier,
    stateComposite,
    electionProximity,
    reputationFactor,
    diminishingReturnsApplied: compressed,
    fairnessClampApplied: fairnessFloor,
    seedJitter
  };

  return {
    total: Math.round(finalInfluence),
    components: breakdown,
    seed
  };
}

// IMPLEMENTATION NOTES:
// - successfulLobbies & totalDonations presently unused directly; retained for future additive terms (momentum / historical scaling) per spec extensibility.
// - Donation segment intentionally mirrors legacy scaling for clarity; donationInfluence (with floor) is computed but not double-counted.
// - Any future logistic reputation transformation will replace computeReputationFactor.
// - Soft cap formula preserves monotonic growth while bounding asymptote below SOFT_CAP_TARGET.
// - DeriveSeedJitter uses simple FNV-1a; migration to shared deterministicHash utility planned.
// - Function returns integer-rounded total; UI may present both raw & rounded if desired.
