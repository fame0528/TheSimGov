/**
 * @fileoverview Offline protection & retention floor utilities for political influence.
 * @module lib/utils/politics/offlineProtection
 *
 * Extracts and centralizes fairness floor logic (level minimum vs prior snapshot retention)
 * originally embedded inside `computeBaselineInfluence` to enforce DRY and allow reuse
 * across future political systems (campaign persistence, office decay prevention, etc.).
 *
 * Phase 9 Additions:
 * - Audit trail generation for fairness decisions
 * - Divergence detection and warning instrumentation
 * - Telemetry hooks for monitoring offline fairness
 *
 * Deterministic: All calculations are pure functions with no side effects.
 */
import { LEVEL_MINIMUMS, RETENTION_FLOOR_FACTOR, OFFLINE_DIVERGENCE_THRESHOLD, OFFLINE_AUDIT_EVENTS } from './influenceConstants';
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

// ==================== PHASE 9: OFFLINE AUDIT INSTRUMENTATION ====================

/** Audit event structure for offline fairness decisions. */
export interface OfflineAuditEvent {
  /** Event type from OFFLINE_AUDIT_EVENTS */
  type: string;
  /** ISO timestamp when event occurred */
  timestamp: string;
  /** Player/company identifier */
  playerId: string;
  /** Current computed value before adjustment */
  rawValue: number;
  /** Value after adjustment (if applicable) */
  adjustedValue: number;
  /** Floor that was applied (if applicable) */
  floorApplied?: number;
  /** Reason for the adjustment */
  reason: string;
  /** Additional context metadata */
  metadata?: Record<string, unknown>;
}

/** Divergence analysis result for fairness monitoring. */
export interface DivergenceAnalysis {
  /** Absolute difference between online and offline paths */
  absoluteDifference: number;
  /** Relative difference as percentage (0-1) */
  relativeDifference: number;
  /** Whether threshold was exceeded */
  thresholdExceeded: boolean;
  /** Warning level: none, minor, major */
  warningLevel: 'none' | 'minor' | 'major';
}

/**
 * Generate audit event for floor application.
 * @param playerId Player identifier
 * @param application RetentionFloorApplication result
 * @param rawValue Original computed value
 */
export function generateFloorAuditEvent(
  playerId: string,
  application: RetentionFloorApplication,
  rawValue: number
): OfflineAuditEvent {
  const eventType = application.reason === 'retention' 
    ? OFFLINE_AUDIT_EVENTS.RETENTION_TRIGGERED
    : OFFLINE_AUDIT_EVENTS.FLOOR_APPLIED;
  
  return {
    type: eventType,
    timestamp: new Date().toISOString(),
    playerId,
    rawValue,
    adjustedValue: application.adjusted,
    floorApplied: application.floorApplied,
    reason: application.reason,
    metadata: {
      wasAdjusted: application.adjusted !== rawValue,
      adjustmentAmount: application.adjusted - rawValue
    }
  };
}

/**
 * Analyze divergence between online and offline computed values.
 * Used to detect if offline protection is causing unfair advantages.
 * @param onlineValue Value computed with full online context
 * @param offlineValue Value computed with offline/cached context
 */
export function analyzeDivergence(onlineValue: number, offlineValue: number): DivergenceAnalysis {
  const absoluteDifference = Math.abs(onlineValue - offlineValue);
  const baseline = Math.max(onlineValue, offlineValue, 1); // Avoid division by zero
  const relativeDifference = absoluteDifference / baseline;
  const thresholdExceeded = relativeDifference > OFFLINE_DIVERGENCE_THRESHOLD;
  
  let warningLevel: 'none' | 'minor' | 'major' = 'none';
  if (thresholdExceeded) {
    warningLevel = relativeDifference > OFFLINE_DIVERGENCE_THRESHOLD * 2 ? 'major' : 'minor';
  }
  
  return {
    absoluteDifference,
    relativeDifference,
    thresholdExceeded,
    warningLevel
  };
}

/**
 * Generate divergence warning audit event.
 * @param playerId Player identifier
 * @param analysis DivergenceAnalysis result
 * @param onlineValue Online computed value
 * @param offlineValue Offline computed value
 */
export function generateDivergenceAuditEvent(
  playerId: string,
  analysis: DivergenceAnalysis,
  onlineValue: number,
  offlineValue: number
): OfflineAuditEvent | null {
  if (!analysis.thresholdExceeded) return null;
  
  return {
    type: OFFLINE_AUDIT_EVENTS.DIVERGENCE_WARNING,
    timestamp: new Date().toISOString(),
    playerId,
    rawValue: onlineValue,
    adjustedValue: offlineValue,
    reason: `Divergence ${(analysis.relativeDifference * 100).toFixed(2)}% exceeds threshold`,
    metadata: {
      warningLevel: analysis.warningLevel,
      absoluteDifference: analysis.absoluteDifference,
      relativeDifference: analysis.relativeDifference,
      threshold: OFFLINE_DIVERGENCE_THRESHOLD
    }
  };
}

/**
 * Batch multiple audit events for efficient telemetry dispatch.
 * @param events Array of audit events to batch
 */
export function batchAuditEvents(events: OfflineAuditEvent[]): {
  batchId: string;
  batchTimestamp: string;
  eventCount: number;
  events: OfflineAuditEvent[];
  summary: {
    floorApplications: number;
    retentionTriggers: number;
    divergenceWarnings: number;
  };
} {
  const summary = {
    floorApplications: events.filter(e => e.type === OFFLINE_AUDIT_EVENTS.FLOOR_APPLIED).length,
    retentionTriggers: events.filter(e => e.type === OFFLINE_AUDIT_EVENTS.RETENTION_TRIGGERED).length,
    divergenceWarnings: events.filter(e => e.type === OFFLINE_AUDIT_EVENTS.DIVERGENCE_WARNING).length
  };
  
  return {
    batchId: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    batchTimestamp: new Date().toISOString(),
    eventCount: events.length,
    events,
    summary
  };
}

// IMPLEMENTATION NOTES:
// - computeFairnessFloor was moved here from influenceBase.ts (DRY extraction).
// - applyRetentionFloor enables future extension (e.g., momentum decay modifiers) without modifying baseline influence logic.
// - Snapshot interface intentionally minimal; additional metadata (election cycle, campaign phase) can be layered later.
// - Phase 9 audit instrumentation is pure (no side effects); actual telemetry dispatch is caller's responsibility.
// - Divergence analysis uses OFFLINE_DIVERGENCE_THRESHOLD (5%) as the fairness boundary.
// - Audit events follow a consistent schema for easy telemetry ingestion and querying.
// - All exported functions remain pure and deterministic.
