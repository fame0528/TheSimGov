/**
 * @file src/lib/utils/coreLoopCalculators.ts
 * @description Utility functions for Core Loop tick progression, time calculations, and summary aggregation
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Provides pure functions and helpers for:
 * - Advancing core loop ticks (monthly, weekly, daily)
 * - Calculating next tick time
 * - Aggregating tick results and summaries
 * - Error handling and formatting
 *
 * USAGE:
 * ```typescript
 * import {
 *   advanceCoreLoopTick,
 *   getNextTickTime,
 *   aggregateTickSummary,
 *   formatCoreLoopError,
 * } from '@/lib/utils/coreLoopCalculators';
 *
 * // Advance tick
 * const result = advanceCoreLoopTick(state);
 *
 * // Calculate next tick time
 * const nextTime = getNextTickTime(state);
 *
 * // Aggregate summary
 * const summary = aggregateTickSummary([result1, result2]);
 *
 * // Format error
 * const errorMsg = formatCoreLoopError(error);
 * ```
 *
 * @author ECHO v1.3.3
 */

import { CoreLoopState, CoreLoopFrequency, CoreLoopResult } from '@/lib/types/coreLoop';
import { CoreLoopStatus } from '@/lib/types/coreLoop';

// ============================================================================
// ADVANCE TICK
// ============================================================================

/**
 * Advance the core loop tick for a player
 * @param state - Current core loop state
 * @returns Updated core loop state and result
 */
export function advanceCoreLoopTick(state: CoreLoopState): { newState: CoreLoopState; result: CoreLoopResult } {
  const now = new Date();
  const nextTick = state.currentTick + 1;
  const startedAt = now;
  // Simulate tick duration
  const durationMs = Math.floor(Math.random() * 100) + 50;
  const completedAt = new Date(now.getTime() + durationMs);

  const newState: CoreLoopState = {
    ...state,
    currentTick: nextTick,
    lastTickAt: completedAt,
    nextTickAt: getNextTickTime({ ...state, currentTick: nextTick }),
    ticksProcessed: state.ticksProcessed + 1,
    status: CoreLoopStatus.RUNNING,
    error: undefined,
  };

  const result: CoreLoopResult = {
    tickId: `tick-${nextTick}-${state.userId}`,
    userId: state.userId,
    frequency: state.frequency,
    startedAt,
    completedAt,
    durationMs,
    success: true,
    summary: {
      tick: nextTick,
      processedAt: completedAt,
    },
  };

  return { newState, result };
}

// ============================================================================
// NEXT TICK TIME CALCULATION
// ============================================================================

/**
 * Calculate the next tick time based on frequency
 * @param state - Core loop state
 * @returns Date of next tick
 */
export function getNextTickTime(state: CoreLoopState): Date | null {
  if (!state.lastTickAt) return new Date();
  const base = state.lastTickAt.getTime();
  switch (state.frequency) {
    case CoreLoopFrequency.MONTHLY:
      return new Date(base + 30 * 24 * 60 * 60 * 1000);
    case CoreLoopFrequency.WEEKLY:
      return new Date(base + 7 * 24 * 60 * 60 * 1000);
    case CoreLoopFrequency.DAILY:
      return new Date(base + 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

// ============================================================================
// SUMMARY AGGREGATION
// ============================================================================

/**
 * Aggregate multiple tick results into a summary
 * @param results - Array of CoreLoopResult
 * @returns Aggregated summary object
 */
export function aggregateTickSummary(results: CoreLoopResult[]): Record<string, unknown> {
  const totalTicks = results.length;
  const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);
  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;

  return {
    totalTicks,
    totalDuration,
    avgDuration: totalTicks ? Math.round(totalDuration / totalTicks) : 0,
    successCount,
    errorCount,
    lastTickId: results.length ? results[results.length - 1].tickId : null,
  };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Format core loop error for display/logging
 * @param error - Error object or string
 * @returns Formatted error message
 */
export function formatCoreLoopError(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    // @ts-ignore
    return String(error.message);
  }
  return 'Unknown error';
}

// ============================================================================
// FUTURE EXTENSIONS
// ============================================================================
/**
 * TODO: Add more advanced calculations (progression, rewards, event triggers)
 * TODO: Integrate with tick processors and industry systems
 */
