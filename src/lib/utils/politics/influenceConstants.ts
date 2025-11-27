/**
 * @fileoverview Tunable constants for baseline political influence & lobbying probability.
 * @module lib/utils/politics/influenceConstants
 *
 * SOURCE: Derived from specifications
 * - INFLUENCE_BASELINE_SPEC_FID-20251125-001A_20251125.md
 * - LOBBYING_PROBABILITY_SPEC_FID-20251125-001A_20251125.md
 *
 * These constants are centralized to allow calibration without logic changes.
 * All adjustments MUST maintain determinism and documented ranges.
 *
 * @created 2025-11-25
 */

// ---------------- Influence Formula Constants ----------------

/** Minimum donation amount considered for log scaling (spec: baseDonationLog uses max(donationAmount, 100)). */
export const DONATION_LOG_BASE_MIN = 100;

/** Level multiplier mapping (spec legacy parity). */
export const LEVEL_MULTIPLIER_MAP: Record<number, number> = {
  1: 1.0,
  2: 1.2,
  3: 1.5,
  4: 2.0,
  5: 3.0
};

/** State composite scale (STATE_SCALE) – target comparable magnitude to mid-level donation segment. */
export const STATE_SCALE = 40; // Tunable range: 30–50

/** Maximum quadratic election proximity bonus (ELECTION_MAX_BONUS). */
export const ELECTION_MAX_BONUS = 20; // Tunable range: 15–25

/** Soft cap asymptote target (SOFT_CAP_TARGET) for influence compression. */
export const SOFT_CAP_TARGET = 400; // Tunable range: 350–450

/** Level-based minimum influence floors ensuring strategic baseline & offline fairness. */
export const LEVEL_MINIMUMS: Record<number, number> = {
  1: 0,
  2: 25,
  3: 60,
  4: 150,
  5: 300
};

/** Retention multiplier for previous snapshot fairness floor (90% retention). */
export const RETENTION_FLOOR_FACTOR = 0.9;

/** Maximum absolute deterministic micro jitter applied to influence (MICRO_JITTER_MAX). */
export const MICRO_JITTER_MAX = 0.5; // ±0.5 influence points

// ---------------- Lobbying Probability Constants ----------------

/** Spending log normalization scale (spendScale). */
export const LOBBY_SPEND_SCALE = 1000; // Range: 500–2000

/** Spending weight multiplier (spendingWeight). */
export const LOBBY_SPENDING_WEIGHT = 0.40; // Range: 0.25–0.55

/** Influence plateau scale (influenceScale). */
export const LOBBY_INFLUENCE_SCALE = 250; // Range: 150–400

/** Influence leverage weight (influenceWeight). */
export const LOBBY_INFLUENCE_WEIGHT = 0.30; // Range: 0.20–0.45

/** Reputation linear weight (reputationWeight). */
export const LOBBY_REPUTATION_WEIGHT = 0.20; // Range: 0.10–0.30

/** Election proximity weight (proximityWeight). */
export const LOBBY_PROXIMITY_WEIGHT = 0.35; // Range: 0.20–0.45

/** Election proximity decay half-life in weeks (decayHalfLife). */
export const LOBBY_PROXIMITY_DECAY_HALF_LIFE = 12; // Range: 8–16

/** State composite contribution factor (stateCompositeFactor). */
export const LOBBY_STATE_COMPOSITE_FACTOR = 0.25; // Range: 0.15–0.35

/** Soft easing start threshold (softMax) for probability raw pre-clamp. */
export const LOBBY_SOFT_MAX = 0.90; // Range: 0.85–0.92

/** Soft easing factor applied beyond softMax (softEasingFactor). */
export const LOBBY_SOFT_EASING_FACTOR = 0.35; // Range: 0.25–0.50

/** Absolute jitter range (±) in probability points (jitterRangeAbs). */
export const LOBBY_JITTER_RANGE_ABS = 0.015; // Range: 0.010–0.020

/** Spend threshold above which jitter is applied (jitterSpendThreshold). */
export const LOBBY_JITTER_SPEND_THRESHOLD = 250; // Range: 100–500

/** Difficulty base probability mapping by office level. */
export const LOBBY_DIFFICULTY_BASE: Record<string, number> = {
  LOCAL: 0.30,
  STATE: 0.25,
  FEDERAL: 0.20,
  NATIONAL: 0.15
};

/** Final probability absolute clamp boundaries. */
export const LOBBY_MIN_PROBABILITY = 0.05;
export const LOBBY_MAX_PROBABILITY = 0.95;

// ---------------- Utility Helpers (Hash Placeholder Notes) ----------------
// A stable non-cryptographic hash (e.g. murmurhash3 32-bit) will be implemented in a future utility
// file (deterministicHash.ts). Jitter derivation must use only deterministic arithmetic.

// IMPLEMENTATION NOTES:
// - Adjusting constants requires recalibration tests; update associated documentation & parity checklist.
// - All probability-related constants keep raw computations within reasonable bounds before clamp.
// - Influence constants tuned for early-phase progression without runaway growth.
