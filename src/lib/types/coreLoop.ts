/**
 * @file src/lib/types/coreLoop.ts
 * @description Type definitions for the Core Loop System (v2.2)
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Defines all types, enums, and DTOs for the core gameplay loop:
 * - Tick progression (monthly, weekly, daily)
 * - Player actions and state
 * - UI state for dashboard and cards
 * - API requests/responses for advancing the loop
 *
 * ARCHITECTURE:
 * CoreLoop is the heart of the simulation, driving all time-based mechanics.
 * Each tick triggers updates across all systems (empire, industries, events).
 *
 * IMPLEMENTATION NOTES:
 * - Enums for tick frequency, action types, status
 * - Interfaces for state, results, API DTOs
 * - JSDoc for all public types
 * - Usage examples included
 *
 * @author ECHO v1.3.3
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Frequency of core loop ticks
 */
export enum CoreLoopFrequency {
  MONTHLY = 'MONTHLY',
  WEEKLY = 'WEEKLY',
  DAILY = 'DAILY',
}

/**
 * Core loop action types
 */
export enum CoreLoopActionType {
  ADVANCE_TICK = 'ADVANCE_TICK',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  RESET = 'RESET',
  MANUAL_EVENT = 'MANUAL_EVENT',
}

/**
 * Status of the core loop
 */
export enum CoreLoopStatus {
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Core loop state for a player
 */
export interface CoreLoopState {
  userId: string;
  currentTick: number;
  frequency: CoreLoopFrequency;
  status: CoreLoopStatus;
  lastTickAt: Date | null;
  nextTickAt: Date | null;
  ticksProcessed: number;
  error?: string;
}

/**
 * Result of advancing the core loop
 */
export interface CoreLoopResult {
  tickId: string;
  userId: string;
  frequency: CoreLoopFrequency;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  success: boolean;
  summary: Record<string, unknown>;
  error?: string;
}

/**
 * Core loop action request (API)
 */
export interface CoreLoopActionRequest {
  userId: string;
  action: CoreLoopActionType;
  params?: Record<string, unknown>;
}

/**
 * Core loop action response (API)
 */
export interface CoreLoopActionResponse {
  success: boolean;
  message: string;
  result?: CoreLoopResult;
  error?: string;
}

/**
 * UI state for core loop dashboard
 */
export interface CoreLoopUIState {
  loading: boolean;
  error?: string;
  state?: CoreLoopState;
  lastResult?: CoreLoopResult;
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================
/**
 * Example: Advance the core loop for a player
 *
 * import { CoreLoopActionType, CoreLoopActionRequest } from '@/lib/types/coreLoop';
 *
 * const req: CoreLoopActionRequest = {
 *   userId: 'player123',
 *   action: CoreLoopActionType.ADVANCE_TICK,
 * };
 */

export default {
  CoreLoopFrequency,
  CoreLoopActionType,
  CoreLoopStatus,
};
