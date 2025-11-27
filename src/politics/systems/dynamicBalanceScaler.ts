/**
 * Dynamic Balance Scaler
 *
 * @fileoverview Balancing helpers that prevent runaway frontrunner leads while
 * still rewarding strategic play. Implements three transparent mechanisms:
 * 1. Underdog Buff: Trailing candidates (>10pp behind leader) gain polling help.
 * 2. Frontrunner Penalty: Leading candidates (>15pp ahead) pay increased costs.
 * 3. Systemic Cap: Soft compression of extreme polling above 60% popularity.
 *
 * All functions are pure, deterministic and side-effect free. Designed for
 * AAA balance transparency: every threshold and formula is explainable.
 *
 * Time model recap (from timeScaling utilities): 1 real hour = 1 game week.
 *
 * Formulas:
 * - Underdog Buff: if gap > 10 then buff = min(gap * 0.05, 3.0) polling points
 * - Frontrunner Penalty Multiplier: if lead > 15 then 1 + (lead * 0.03) else 1
 * - Systemic Cap: if polling > 60 then 60 + (polling - 60) * 0.2 else polling
 *
 * Probability Modulation (utility): When generating fairness-adjusted chances
 * (e.g., event successes) we treat adjusted polling as basis.
 *
 * Example:
 *  - Candidate A at 68% polling vs next at 50% → lead = 18
 *    * Penalty Multiplier: 1 + (18 * 0.03) = 1.54× cost scaling
 *    * Systemic Cap: 60 + (8 * 0.2) = 61.6 effective
 *  - Candidate B at 38% vs leader 55% → gap = 17
 *    * Underdog Buff: min(17 * 0.05, 3) = 0.85pp boost
 *    * Effective Polling: 38 + 0.85 = 38.85
 */

export interface BalanceAdjustmentResult {
  candidatePolling: number;          // Original polling
  cappedPolling: number;             // After systemic cap compression
  adjustedPolling: number;           // After buffs/penalties applied
  underdogBuff: number;              // Polling points added if underdog
  penaltyMultiplier: number;         // Cost multiplier if frontrunner
  trailingGap: number;               // Leader - candidate (if lagging else 0)
  leadGap: number;                   // Candidate - second place (if leading else 0)
  isUnderdog: boolean;               // True if gap > underdog threshold
  isFrontrunner: boolean;            // True if lead > frontrunner threshold
  thresholdsTripped: string[];       // List of threshold identifiers activated
}

// Tunable constants (documented for live balance tweaking)
export const UNDERDOG_GAP_THRESHOLD = 10;       // pp behind leader required to trigger buff
export const UNDERDOG_BUFF_FACTOR = 0.05;       // 5% of gap converted to polling points
export const UNDERDOG_BUFF_MAX = 3.0;           // Absolute buff cap (pp)
export const FRONTRUNNER_LEAD_THRESHOLD = 15;   // pp lead required to trigger penalty
export const FRONTRUNNER_PENALTY_FACTOR = 0.03; // 3% lead converted to cost scaling
export const SYSTEMIC_CAP_THRESHOLD = 60;       // Popularity beyond which compression begins
export const SYSTEMIC_CAP_COMPRESSION = 0.2;    // 20% of excess is retained

/** Compute underdog buff given trailing gap. */
export function computeUnderdogBuff(trailingGap: number): number {
  if (trailingGap <= UNDERDOG_GAP_THRESHOLD) return 0;
  return Math.min(trailingGap * UNDERDOG_BUFF_FACTOR, UNDERDOG_BUFF_MAX);
}

/** Compute frontrunner penalty multiplier given lead gap. */
export function computeFrontrunnerPenaltyMultiplier(leadGap: number): number {
  if (leadGap <= FRONTRUNNER_LEAD_THRESHOLD) return 1;
  return 1 + leadGap * FRONTRUNNER_PENALTY_FACTOR;
}

/** Apply systemic cap compression to high polling values (>60%). */
export function applySystemicCap(polling: number): number {
  if (polling <= SYSTEMIC_CAP_THRESHOLD) return polling;
  const excess = polling - SYSTEMIC_CAP_THRESHOLD;
  return SYSTEMIC_CAP_THRESHOLD + excess * SYSTEMIC_CAP_COMPRESSION;
}

/**
 * Compute balance adjustments for a candidate given all current pollings.
 * @param candidatePolling Polling % of candidate under evaluation.
 * @param allPollings Array of all candidate pollings (must include candidatePolling).
 */
export function computeBalanceAdjustments(candidatePolling: number, allPollings: number[]): BalanceAdjustmentResult {
  if (!allPollings.includes(candidatePolling)) {
    // Enforce explicit inclusion for deterministic evaluation
    allPollings = [...allPollings, candidatePolling];
  }
  const sorted = [...allPollings].sort((a, b) => b - a);
  const leader = sorted[0];
  const second = sorted.length > 1 ? sorted[1] : candidatePolling;

  const isFrontrunner = candidatePolling === leader && leader - second > FRONTRUNNER_LEAD_THRESHOLD;
  const leadGap = isFrontrunner ? leader - second : 0;

  const isUnderdog = candidatePolling !== leader && leader - candidatePolling > UNDERDOG_GAP_THRESHOLD;
  const trailingGap = isUnderdog ? leader - candidatePolling : 0;

  // Base systemic cap
  const capped = applySystemicCap(candidatePolling);

  // Underdog buff applied post-cap (so capped values still benefit)
  const underdogBuff = computeUnderdogBuff(trailingGap);

  // Frontrunner penalty multiplier affects costs (not direct polling reduction)
  const penaltyMultiplier = computeFrontrunnerPenaltyMultiplier(leadGap);

  // Adjusted polling increases for underdogs only
  const adjustedPolling = capped + underdogBuff;

  const thresholdsTripped: string[] = [];
  if (isUnderdog) thresholdsTripped.push('UNDERDOG_BUFF');
  if (isFrontrunner) thresholdsTripped.push('FRONTRUNNER_PENALTY');
  if (candidatePolling > SYSTEMIC_CAP_THRESHOLD) thresholdsTripped.push('SYSTEMIC_CAP');

  return {
    candidatePolling,
    cappedPolling: capped,
    adjustedPolling,
    underdogBuff,
    penaltyMultiplier,
    trailingGap,
    leadGap,
    isUnderdog,
    isFrontrunner,
    thresholdsTripped,
  };
}

/**
 * Adjust a base probability (0–1) by fairness mechanisms, using adjusted polling
 * and penalty multiplier. Underdog buffs slightly amplify success probability
 * while frontrunner penalty slightly dampens it via cost scaling conversion.
 *
 * Strategy:
 * 1. Normalize polling to 0–1 scale by dividing by 100 (after adjustments).
 * 2. Apply underdog advantage: + (underdogBuff / 100).
 * 3. Apply frontrunner penalty: divide by penaltyMultiplier if > 1.
 * 4. Clamp final probability between 0.01 and 0.99 for fairness.
 */
export function computeFairProbability(baseProbability: number, candidatePolling: number, allPollings: number[]): number {
  const adj = computeBalanceAdjustments(candidatePolling, allPollings);
  let prob = baseProbability;

  // Incorporate adjusted polling as soft influence weight (averaged)
  const pollingFactor = adj.adjustedPolling / 100;
  prob = (prob + pollingFactor) / 2; // Blend base probability with polling influence

  // Underdog advantage
  if (adj.isUnderdog && adj.underdogBuff > 0) {
    prob += adj.underdogBuff / 100;
    // Fairness guarantee: underdog scenario should not reduce original baseProbability
    if (prob < baseProbability) {
      prob = baseProbability + adj.underdogBuff / 100; // ensure net positive or equal increase
    }
  }

  // Frontrunner penalty
  if (adj.isFrontrunner && adj.penaltyMultiplier > 1) {
    prob = prob / adj.penaltyMultiplier;
  }

  // Clamp
  if (prob < 0.01) prob = 0.01;
  if (prob > 0.99) prob = 0.99;
  return parseFloat(prob.toFixed(4));
}

/** Explain thresholds triggered for UI transparency. */
export function describeBalanceAdjustments(result: BalanceAdjustmentResult): string {
  const parts: string[] = [];
  if (result.isUnderdog) parts.push(`Underdog buff +${result.underdogBuff.toFixed(2)}pp (gap ${result.trailingGap}pp)`);
  if (result.isFrontrunner) parts.push(`Frontrunner penalty ${result.penaltyMultiplier.toFixed(2)}x (lead ${result.leadGap}pp)`);
  if (result.candidatePolling > SYSTEMIC_CAP_THRESHOLD) parts.push(`Systemic cap applied (from ${result.candidatePolling.toFixed(2)}% to ${result.cappedPolling.toFixed(2)}%)`);
  return parts.length ? parts.join(' | ') : 'No balance adjustments';
}

/** Quick helper: get fairness-adjusted polling used for leaderboard neutrality. */
export function getFairAdjustedPolling(candidatePolling: number, allPollings: number[]): number {
  return computeBalanceAdjustments(candidatePolling, allPollings).adjustedPolling;
}
