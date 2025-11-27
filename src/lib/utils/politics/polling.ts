/**
 * @fileoverview Polling Snapshot Utilities
 * @module lib/utils/politics/polling
 * 
 * OVERVIEW:
 * Utilities for generating smoothed polling data with volatility dampening and offline fairness.
 * Implements 25-minute polling cycles with deterministic seed-based generation for reproducibility.
 * 
 * FEATURES:
 * - Volatility dampening (prevents wild swings)
 * - Smoothing algorithm (exponential moving average)
 * - Margin of error calculation (sample size based)
 * - Trend analysis and aggregation
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

import { PollingSnapshot, CampaignPhaseState } from '@/lib/types/politics';
import PollingSnapshotModel from '@/lib/db/models/politics/PollingSnapshot';
import { fnv1a32 } from '@/lib/utils/deterministicHash';
import { getPollingIntervalMs } from './timeScaling';

// ===================== CONSTANTS =====================

/**
 * Polling cycle interval derived from timeScaling (25 minutes by default).
 * Kept in seconds to align with existing epoch-second timestamps.
 */
export const POLLING_INTERVAL_SECONDS = Math.floor(getPollingIntervalMs() / 1000);

/** Sample size range for variance modeling */
const SAMPLE_SIZE_RANGE = { min: 800, max: 3000 };

/** Volatility dampening parameters */
const VOLATILITY_DAMPENING = {
  maxShiftPercent: 5, // Max single-poll shift
  smoothingFactor: 0.3, // EMA smoothing weight
};

/** Margin of error parameters (inversely proportional to sample size) */
const MOE_BASELINE = 3.5; // Baseline MoE at min sample size
const MOE_SCALING = 0.001; // MoE reduction per additional sample

// ===================== GENERATION =====================

/**
 * Generate new polling snapshot for player
 * Uses deterministic seed for reproducible results
 */
export async function generatePollingSnapshot(
  playerId: string,
  campaignState: CampaignPhaseState
): Promise<PollingSnapshot> {
  const now = Date.now() / 1000;
  const seed = `polling-${playerId}-${Math.floor(now / POLLING_INTERVAL_SECONDS)}`;
  
  // Deterministic sample size
  const sampleHash = fnv1a32(`${seed}-sample`);
  const sampleSize =
    SAMPLE_SIZE_RANGE.min +
    (sampleHash % (SAMPLE_SIZE_RANGE.max - SAMPLE_SIZE_RANGE.min));

  // Base support from reputation and recent activity
  const baseSupportPercent = calculateBaseSupport(campaignState);

  // Get previous snapshot for smoothing
  const previousSnapshots = await PollingSnapshotModel.find({ playerId })
    .sort({ timestampEpoch: -1 })
    .limit(1)
    .lean();
  const previousSupport = previousSnapshots[0]?.finalSupportPercent ?? baseSupportPercent;
  const previousTimestamp = previousSnapshots[0]?.timestampEpoch as number | undefined;
  const offlineSeconds = previousTimestamp ? Math.max(0, now - previousTimestamp) : 0;

  // Volatility adjustment (dampened by offline-aware multiplier)
  const volatilityAppliedPercent =
    calculateVolatilityDampening(seed, campaignState.volatilityModifier) *
    getOfflineDampeningMultiplier(offlineSeconds);

  // Apply exponential moving average smoothing
  const smoothingAppliedPercent = calculateSmoothingAdjustment(
    baseSupportPercent + volatilityAppliedPercent,
    previousSupport,
    getAdaptiveSmoothingFactor(offlineSeconds)
  );

  const finalSupportPercent = Math.max(
    0,
    Math.min(100, baseSupportPercent + volatilityAppliedPercent + smoothingAppliedPercent)
  );

  // Calculate margin of error
  const marginOfErrorPercent = calculateMarginOfError(sampleSize);

  const snapshot = await PollingSnapshotModel.create({
    playerId,
    timestampEpoch: now,
    sampleSize,
    baseSupportPercent,
    volatilityAppliedPercent,
    smoothingAppliedPercent,
    finalSupportPercent,
    marginOfErrorPercent,
    reputationScore: campaignState.reputationScore,
    seed,
    schemaVersion: 1,
  });

  return snapshot.toJSON() as PollingSnapshot;
}

// ===================== CALCULATIONS =====================

/**
 * Calculate base support from campaign state
 */
function calculateBaseSupport(state: CampaignPhaseState): number {
  // Reputation is primary driver (0-100)
  const reputationFactor = state.reputationScore;

  // Endorsements provide bonus (diminishing returns)
  const endorsementBonus = Math.min(15, state.endorsementsAcquired * 3);

  // Scandals apply penalty
  const scandalPenalty = state.scandalsActive * 2;

  // Fundraising momentum (capped at 10% bonus)
  const fundraisingBonus = Math.min(10, (state.fundsRaisedThisCycle / 100000) * 5);

  const baseSupport =
    (reputationFactor * 0.6) + // 60% from reputation
    endorsementBonus +
    fundraisingBonus -
    scandalPenalty;

  return Math.max(0, Math.min(100, baseSupport));
}

/**
 * Calculate volatility dampening adjustment
 * Returns percent change to apply (can be negative)
 */
export function calculateVolatilityDampening(seed: string, volatilityModifier: number): number {
  const hash = fnv1a32(`${seed}-volatility`);
  
  // Random shift in range [-maxShift, +maxShift]
  const rawShift = ((hash % 1000) / 1000) * 2 - 1; // -1 to +1
  const maxShift = VOLATILITY_DAMPENING.maxShiftPercent * volatilityModifier;
  
  return rawShift * maxShift;
}

/**
 * Calculate smoothing adjustment (exponential moving average)
 */
function calculateSmoothingAdjustment(
  currentValue: number,
  previousValue: number,
  alpha: number = VOLATILITY_DAMPENING.smoothingFactor
): number {
  const smoothedValue = alpha * currentValue + (1 - alpha) * previousValue;
  return smoothedValue - currentValue;
}

/**
 * Calculate margin of error based on sample size
 */
function calculateMarginOfError(sampleSize: number): number {
  const baseMoE = MOE_BASELINE;
  const sizeReduction = (sampleSize - SAMPLE_SIZE_RANGE.min) * MOE_SCALING;
  return Math.max(1, baseMoE - sizeReduction);
}

// ===================== TREND ANALYSIS =====================

/**
 * Aggregate polling trend over time window
 */
export async function aggregatePollingTrend(
  playerId: string,
  windowHours: number = 24
): Promise<{
  currentSupport: number;
  averageSupport: number;
  trendDirection: 'UP' | 'DOWN' | 'STABLE';
  volatility: number;
}> {
  const windowSeconds = windowHours * 3600;
  const startEpoch = Date.now() / 1000 - windowSeconds;
  const endEpoch = Date.now() / 1000;

  const snapshots = await PollingSnapshotModel.find({
    playerId,
    timestampEpoch: { $gte: startEpoch, $lte: endEpoch },
  })
    .sort({ timestampEpoch: 1 })
    .lean();

  if (snapshots.length === 0) {
    return {
      currentSupport: 0,
      averageSupport: 0,
      trendDirection: 'STABLE',
      volatility: 0,
    };
  }

  const currentSupport = snapshots[snapshots.length - 1].finalSupportPercent;
  const averageSupport =
    snapshots.reduce((sum: number, s: any) => sum + s.finalSupportPercent, 0) / snapshots.length;

  // Calculate trend
  const firstHalf = snapshots.slice(0, Math.floor(snapshots.length / 2));
  const secondHalf = snapshots.slice(Math.floor(snapshots.length / 2));

  const firstAvg = firstHalf.reduce((sum: number, s: any) => sum + s.finalSupportPercent, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum: number, s: any) => sum + s.finalSupportPercent, 0) / secondHalf.length;

  const trendDelta = secondAvg - firstAvg;
  const trendDirection: 'UP' | 'DOWN' | 'STABLE' =
    Math.abs(trendDelta) < 1 ? 'STABLE' : trendDelta > 0 ? 'UP' : 'DOWN';

  // Calculate volatility (standard deviation)
  const variance =
    snapshots.reduce((sum: number, s: any) => sum + Math.pow(s.finalSupportPercent - averageSupport, 2), 0) /
    snapshots.length;
  const volatility = Math.sqrt(variance);

  return {
    currentSupport,
    averageSupport,
    trendDirection,
    volatility,
  };
}

/**
 * Smooth polling data using exponential moving average
 * Applied retroactively for visualization/analysis
 */
export function smoothPollingData(
  snapshots: PollingSnapshot[],
  smoothingFactor: number = 0.3
): number[] {
  if (snapshots.length === 0) return [];

  const smoothed: number[] = [];
  let previousValue = snapshots[0].finalSupportPercent;

  for (const snapshot of snapshots) {
    const smoothedValue =
      smoothingFactor * snapshot.finalSupportPercent + (1 - smoothingFactor) * previousValue;
    smoothed.push(smoothedValue);
    previousValue = smoothedValue;
  }

  return smoothed;
}

/**
 * Calculate polling momentum (rate of change)
 */
export function calculatePollingMomentum(snapshots: PollingSnapshot[]): number {
  if (snapshots.length < 2) return 0;

  const recent = snapshots.slice(-5); // Last 5 polls
  if (recent.length < 2) return 0;

  const totalChange =
    recent[recent.length - 1].finalSupportPercent - recent[0].finalSupportPercent;
  const timeSpan =
    recent[recent.length - 1].timestampEpoch - recent[0].timestampEpoch;

  // Momentum as percent change per hour
  return (totalChange / timeSpan) * 3600;
}

// ===================== OFFLINE / STATE WEIGHTING HELPERS =====================

/**
 * Compute volatility dampening multiplier based on time since last snapshot.
 * Tiers:
 * - ≤ 1 interval: 1.0 (no dampening)
 * - > 6 hours: 0.75
 * - > 24 hours: 0.50
 * - > 72 hours: 0.25
 */
export function getOfflineDampeningMultiplier(offlineSeconds: number): number {
  const h = offlineSeconds / 3600;
  if (h > 72) return 0.25;
  if (h > 24) return 0.5;
  if (h > 6) return 0.75;
  return 1.0;
}

/**
 * Adapt smoothing based on offline duration to stabilize re-entry.
 * Longer offline → higher smoothing (closer to previous), reducing sudden jumps.
 */
export function getAdaptiveSmoothingFactor(offlineSeconds: number): number {
  const h = offlineSeconds / 3600;
  if (h > 72) return 0.6;
  if (h > 24) return 0.5;
  if (h > 6) return 0.4;
  return 0.3;
}

/**
 * Compute state-weighted support using a state's compositeInfluenceWeight [0..1].
 * Keeps adjustments within a modest band to avoid destabilizing global support.
 */
export function computeStateWeightedSupport(
  finalSupportPercent: number,
  compositeInfluenceWeight: number
): number {
  const clamped = Math.max(0, Math.min(1, compositeInfluenceWeight));
  // Scale within ±15% band around 100% baseline influence
  const multiplier = 0.85 + 0.30 * clamped; // [0.85, 1.15]
  const weighted = finalSupportPercent * multiplier;
  return Math.max(0, Math.min(100, weighted));
}
