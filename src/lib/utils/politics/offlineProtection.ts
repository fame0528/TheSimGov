/**
 * @fileoverview Offline protection & retention floor utilities for political influence.
 * @module lib/utils/politics/offlineProtection
 *
 * Extracts and centralizes fairness floor logic (level minimum vs prior snapshot retention)
 * originally embedded inside `computeBaselineInfluence` to enforce DRY and allow reuse
 * across future political systems (campaign persistence, office decay prevention, etc.).
 *
 * Deterministic: All calculations are pure functions with no side effects.
 */
import { LEVEL_MINIMUMS, RETENTION_FLOOR_FACTOR } from './influenceConstants';
import type { InfluenceResult } from '@/lib/types/politicsInfluence';

/** Snapshot of a previously computed influence result for retention purposes. */
export interface InfluenceSnapshot {
  /** Rounded total influence at time of capture. */
  total: number;
  /** Company level at snapshot time (used if replayed across level changes). */
  level: number;
  /** ISO timestamp when snapshot was taken. */
  capturedAt: string;
}

/**
 * Create a snapshot from an existing InfluenceResult.
 * @param result Influence computation output.
 * @param level Current company level.
 */
export function createInfluenceSnapshot(result: InfluenceResult, level: number): InfluenceSnapshot {
  return {
    total: result.total,
    level,
    capturedAt: new Date().toISOString()
  };
}

/**
 * Compute fairness floor given a company level and optional previous snapshot influence.
 * Returns the max of level minimum and retained previous influence (previous * RETENTION_FLOOR_FACTOR).
 * @param level Company level (1-5).
 * @param previousSnapshotInfluence Optional prior stored influence total.
 */
export function computeFairnessFloor(level: number, previousSnapshotInfluence?: number): number {
  const levelFloor = LEVEL_MINIMUMS[level] ?? 0;
  const retentionFloor = previousSnapshotInfluence ? previousSnapshotInfluence * RETENTION_FLOOR_FACTOR : 0;
  return Math.max(levelFloor, retentionFloor);
}

/** Result of applying a retention floor to a newly computed influence value. */
export interface RetentionFloorApplication {
  /** Final adjusted influence after enforcing floor (not rounded). */
  adjusted: number;
  /** The floor value that was applied (level minimum vs retention). */
  floorApplied: number;
  /** Reason floor chosen: level minimum, retention, or none. */
  reason: 'level-minimum' | 'retention' | 'none';
}

/**
 * Apply retention fairness floor to a freshly computed influence value.
 * @param currentRaw Newly computed (pre-floor) influence.
 * @param snapshot Optional prior snapshot.
 * @param level Current company level.
 */
export function applyRetentionFloor(currentRaw: number, snapshot: InfluenceSnapshot | undefined, level: number): RetentionFloorApplication {
  const previous = snapshot?.total;
  const floor = computeFairnessFloor(level, previous);
  const adjusted = currentRaw < floor ? floor : currentRaw;
  let reason: 'level-minimum' | 'retention' | 'none' = 'none';
  if (floor > 0) {
    const levelFloor = LEVEL_MINIMUMS[level] ?? 0;
    reason = floor === levelFloor && (!previous || floor >= (previous * RETENTION_FLOOR_FACTOR)) ? 'level-minimum' : 'retention';
  }
  return { adjusted, floorApplied: floor, reason };
}

// IMPLEMENTATION NOTES:
// - computeFairnessFloor was moved here from influenceBase.ts (DRY extraction).
// - applyRetentionFloor enables future extension (e.g., momentum decay modifiers) without modifying baseline influence logic.
// - Snapshot interface intentionally minimal; additional metadata (election cycle, campaign phase) can be layered later.
// - All exported functions remain pure and deterministic.
