/**
 * @fileoverview Debate Performance Utilities
 * @module lib/utils/politics/debate
 * 
 * OVERVIEW:
 * Utilities for calculating debate performance scores, applying penalties, and scheduling
 * debate events. Supports multi-dimensional scoring (rhetorical, policy, charisma) with
 * weighted composite scores and penalty systems.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

import { DebatePerformance, CampaignPhaseState } from '@/lib/types/politics';
import DebatePerformanceModel from '@/lib/db/models/politics/DebatePerformance';
import { fnv1a32 } from '@/lib/utils/deterministicHash';

// ===================== CONSTANTS =====================

/** Score component weights (must sum to 1.0) */
const SCORE_WEIGHTS = {
  rhetorical: 0.35,
  policy: 0.40,
  charisma: 0.25,
};

/** Penalty types and their score impact */
export const DEBATE_PENALTIES = {
  TIME_OVERRUN: 5,
  FACTUAL_ERROR: 8,
  POOR_PREPARATION: 10,
  SCANDAL_IMPACT: 12,
  FATIGUE: 6,
} as const;

/** Polling shift parameters */
const POLL_SHIFT_PARAMS = {
  baseMultiplier: 0.15, // Base shift per 10 points of score
  immediateDecay: 0.6, // Immediate shift decay to persisting
  minShift: -5, // Max negative shift
  maxShift: 10, // Max positive shift
};

// ===================== PERFORMANCE CALCULATION =====================

/**
 * Calculate debate performance scores
 * Uses deterministic seed for fair, reproducible results
 */
export async function calculateDebatePerformance(
  debateId: string,
  playerId: string,
  campaignState: CampaignPhaseState,
  inputs: {
    rhetoricalPrep: number; // 0-100 investment
    policyPrep: number; // 0-100 investment
    charismaPrep: number; // 0-100 investment
  }
): Promise<DebatePerformance> {
  const now = Date.now() / 1000;
  const seed = `debate-${debateId}-${playerId}`;

  // Calculate base scores with deterministic variance
  const rhetoricalScore = calculateComponentScore(
    inputs.rhetoricalPrep,
    campaignState.reputationScore,
    `${seed}-rhetoric`
  );

  const policyScore = calculateComponentScore(
    inputs.policyPrep,
    campaignState.reputationScore,
    `${seed}-policy`
  );

  const charismaScore = calculateComponentScore(
    inputs.charismaPrep,
    campaignState.reputationScore,
    `${seed}-charisma`
  );

  // Calculate weighted composite score
  let performanceScore =
    rhetoricalScore * SCORE_WEIGHTS.rhetorical +
    policyScore * SCORE_WEIGHTS.policy +
    charismaScore * SCORE_WEIGHTS.charisma;

  // Apply penalties
  const penalties = determinePenalties(campaignState);
  const totalPenalty = penalties.reduce((sum, p) => sum + DEBATE_PENALTIES[p as keyof typeof DEBATE_PENALTIES], 0);
  performanceScore = Math.max(0, performanceScore - totalPenalty);

  // Calculate polling shifts
  const pollShiftImmediatePercent = calculatePollShift(performanceScore, true);
  const pollShiftPersistingPercent = calculatePollShift(performanceScore, false);

  // Update reputation based on performance
  const reputationAfterDebate = Math.min(
    100,
    Math.max(0, campaignState.reputationScore + performanceScore / 10 - totalPenalty / 2)
  );

  const performance = await DebatePerformanceModel.create({
    debateId,
    playerId,
    performanceScore,
    rhetoricalScore,
    policyScore,
    charismaScore,
    penalties,
    pollShiftImmediatePercent,
    pollShiftPersistingPercent,
    reputationAfterDebate,
    seed,
    schemaVersion: 1,
    createdEpoch: now,
  });

  return performance.toJSON() as DebatePerformance;
}

/**
 * Calculate individual component score with variance
 */
function calculateComponentScore(
  prepInvestment: number,
  reputationScore: number,
  seed: string
): number {
  // Base score from preparation (0-100)
  const baseScore = prepInvestment;

  // Reputation bonus (up to +10)
  const reputationBonus = (reputationScore / 100) * 10;

  // Deterministic variance (±5)
  const hash = fnv1a32(seed);
  const variance = ((hash % 1000) / 1000) * 10 - 5; // -5 to +5

  const finalScore = baseScore + reputationBonus + variance;
  return Math.max(0, Math.min(100, finalScore));
}

/**
 * Determine penalties based on campaign state
 */
function determinePenalties(state: CampaignPhaseState): string[] {
  const penalties: string[] = [];

  // Scandal penalty
  if (state.scandalsActive > 0) {
    penalties.push('SCANDAL_IMPACT');
  }

  // Poor reputation penalty
  if (state.reputationScore < 40) {
    penalties.push('POOR_PREPARATION');
  }

  // Phase timing penalty (if rushed through debate prep)
  // This would be checked by comparing phase start time vs debate submission
  // For now, simplified

  return penalties;
}

/**
 * Calculate polling shift from performance score
 */
function calculatePollShift(performanceScore: number, immediate: boolean): number {
  // Shift based on deviation from neutral (50)
  const deviation = performanceScore - 50;
  const baseShift = (deviation / 10) * POLL_SHIFT_PARAMS.baseMultiplier;

  const shift = immediate
    ? baseShift
    : baseShift * POLL_SHIFT_PARAMS.immediateDecay;

  return Math.max(
    POLL_SHIFT_PARAMS.minShift,
    Math.min(POLL_SHIFT_PARAMS.maxShift, shift)
  );
}

// ===================== PENALTY APPLICATION =====================

/**
 * Apply debate penalties to performance
 */
export function applyDebatePenalties(
  baseScore: number,
  penalties: string[]
): number {
  const totalPenalty = penalties.reduce(
    (sum, p) => sum + (DEBATE_PENALTIES[p as keyof typeof DEBATE_PENALTIES] ?? 0),
    0
  );
  return Math.max(0, baseScore - totalPenalty);
}

/**
 * Get penalty description
 */
export function getPenaltyDescription(penalty: string): string {
  const descriptions: Record<string, string> = {
    TIME_OVERRUN: 'Exceeded time limits (-5 points)',
    FACTUAL_ERROR: 'Made factual errors (-8 points)',
    POOR_PREPARATION: 'Insufficient preparation (-10 points)',
    SCANDAL_IMPACT: 'Active scandal affected credibility (-12 points)',
    FATIGUE: 'Campaign fatigue visible (-6 points)',
  };

  return descriptions[penalty] ?? 'Unknown penalty';
}

// ===================== DEBATE SCHEDULING =====================

/**
 * Schedule debates for campaign cycle
 * Debates occur during DEBATE phase
 */
export function scheduleDebates(
  campaignState: CampaignPhaseState
): { debateId: string; scheduledEpoch: number }[] {
  if (campaignState.activePhase !== 'DEBATE_PREP') {
    return [];
  }

  const seed = `${campaignState.seed}-debate-schedule`;
  const hash = fnv1a32(seed);

  // Debates scheduled for DEBATE phase (4 hours)
  const debatePhaseStart = campaignState.phaseEndsEpoch + 0; // Next phase starts
  const debatePhaseEnd = debatePhaseStart + 4 * 3600;

  // Single debate mid-phase
  const debateTime = debatePhaseStart + 2 * 3600;

  return [
    {
      debateId: `debate-${campaignState.playerId}-${campaignState.cycleSequence}-${hash % 10000}`,
      scheduledEpoch: debateTime,
    },
  ];
}

/**
 * Check if player can submit debate performance
 */
export function canSubmitDebatePerformance(
  campaignState: CampaignPhaseState,
  debateId: string
): boolean {
  // Must be in DEBATE phase
  if (campaignState.activePhase !== 'DEBATE') {
    return false;
  }

  // Check if debate window is open
  const now = Date.now() / 1000;
  return now >= campaignState.phaseStartedEpoch && now <= campaignState.phaseEndsEpoch;
}

/**
 * Get debate performance tier label
 */
export function getPerformanceTier(score: number): 'S' | 'A' | 'B' | 'C' | 'F' {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'F';
}

/**
 * Calculate average debate score for player
 */
export async function getPlayerDebateAverage(playerId: string): Promise<number> {
  const debates = await DebatePerformanceModel.find({ playerId }).lean();
  if (debates.length === 0) return 0;
  const total = debates.reduce((sum: number, d: any) => sum + d.performanceScore, 0);
  return total / debates.length;
}
