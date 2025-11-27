/**
 * OVERVIEW
 * Offline protection primitives to prevent negative drift for absent players.
 * Pure clamp/autopilot functions composable by higher-level systems.
 */

import type { GameWeekIndex, AutopilotStrategy } from '../types/politicsTypes';

export interface OfflineClampConfig {
  maxNegativeDriftPerWeek: number; // absolute value, e.g., 5 points/week max loss
  gracePeriodWeeks: number; // weeks before clamps activate
}

export interface AutopilotConfig {
  strategy: AutopilotStrategy;
  resourceEfficiencyMultiplier: number; // e.g., 0.7 for defensive, 1.0 for balanced, 1.2 for growth
  scandalProbabilityReduction: number; // e.g., 0.5 for defensive (halves scandal chance)
}

/**
 * Clamp a delta to prevent excessive negative drift during offline periods.
 * @param originalDelta - calculated delta (signed)
 * @param weeksOffline - number of weeks player was offline
 * @param config - clamp configuration
 * @returns clamped delta
 */
export function clampOfflineDrift(
  originalDelta: number,
  weeksOffline: number,
  config: OfflineClampConfig
): number {
  // No clamp within grace period
  if (weeksOffline <= config.gracePeriodWeeks) {
    return originalDelta;
  }
  
  const weeksSubjectToClamp = weeksOffline - config.gracePeriodWeeks;
  const maxAllowedLoss = -config.maxNegativeDriftPerWeek * weeksSubjectToClamp;
  
  // Clamp negative deltas only
  if (originalDelta < maxAllowedLoss) {
    return maxAllowedLoss;
  }
  
  return originalDelta;
}

/**
 * Get autopilot configuration for a strategy.
 */
export function getAutopilotConfig(strategy: AutopilotStrategy): AutopilotConfig {
  switch (strategy) {
    case 'defensive':
      return {
        strategy,
        resourceEfficiencyMultiplier: 0.7,
        scandalProbabilityReduction: 0.5,
      };
    case 'balanced':
      return {
        strategy,
        resourceEfficiencyMultiplier: 1.0,
        scandalProbabilityReduction: 0.8,
      };
    case 'growth':
      return {
        strategy,
        resourceEfficiencyMultiplier: 1.2,
        scandalProbabilityReduction: 1.0, // no reduction
      };
  }
}

/**
 * Compute catch-up buff multiplier for players returning after long offline periods.
 * Provides temporary advantage to help re-engage.
 * @param weeksOffline - total weeks offline
 * @param maxBuff - maximum multiplier (e.g., 1.5 = +50%)
 * @param halfLifeWeeks - weeks to reach half of max buff
 * @returns multiplier [1.0, maxBuff]
 */
export function computeCatchUpBuff(
  weeksOffline: number,
  maxBuff = 1.5,
  halfLifeWeeks = 52
): number {
  if (weeksOffline <= 0) return 1.0;
  
  // Logarithmic approach to maxBuff: buff = 1 + (maxBuff - 1) * (1 - e^(-weeks / halfLife))
  const decay = Math.exp(-weeksOffline / halfLifeWeeks);
  const buff = 1 + (maxBuff - 1) * (1 - decay);
  
  return Math.min(buff, maxBuff);
}

/**
 * Capture offline snapshot data for restoration on login.
 */
export interface OfflineSnapshotData {
  playerId: string;
  capturedAtWeek: GameWeekIndex;
  influence: number;
  approvalRating?: number;
  autopilotStrategy: AutopilotStrategy;
}

/**
 * Compute delta adjustments to apply on login after offline period.
 * @param snapshot - captured state when went offline
 * @param currentWeek - current game week on login
 * @param computedDelta - delta calculated by normal systems (before protection)
 * @param clampConfig - offline clamp rules
 * @returns adjusted delta with clamps and catch-up buff
 */
export function computeOfflineAdjustment(
  snapshot: OfflineSnapshotData,
  currentWeek: GameWeekIndex,
  computedDelta: number,
  clampConfig: OfflineClampConfig
): { adjustedDelta: number; catchUpBuff: number } {
  const weeksOffline = Math.max(0, currentWeek - snapshot.capturedAtWeek);
  
  // Apply clamp to prevent excessive loss
  const clampedDelta = clampOfflineDrift(computedDelta, weeksOffline, clampConfig);
  
  // Compute catch-up buff (applied multiplicatively to positive gains elsewhere)
  const catchUpBuff = computeCatchUpBuff(weeksOffline);
  
  return {
    adjustedDelta: clampedDelta,
    catchUpBuff,
  };
}

/**
 * Notes
 * - Clamps prevent punishment for offline time beyond grace period
 * - Catch-up buffs incentivize returning players without unfair advantage
 * - Autopilot strategies reduce resource efficiency and scandal risk during offline
 * - All pure functions; no side effects or persistence logic
 */
