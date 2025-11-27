/**
 * @fileoverview Date & Time Utilities
 * @module lib/utils/date
 * 
 * OVERVIEW:
 * Game time conversion utilities (168x real-time multiplier).
 * 1 real hour = 1 game week (168 hours).
 * Uses dayjs for date manipulation.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

const dayjs = require('dayjs');
const duration = require('dayjs/plugin/duration');
const relativeTime = require('dayjs/plugin/relativeTime');

dayjs.extend(duration);
dayjs.extend(relativeTime);

/**
 * Game time multiplier (1 real hour = 168 game hours = 1 game week)
 */
export const GAME_TIME_MULTIPLIER = 168;

/**
 * Convert real milliseconds to game milliseconds
 * 
 * @example
 * ```typescript
 * realToGameTime(3600000) // 604800000 (1 real hour = 1 game week)
 * ```
 */
export function realToGameTime(realMs: number): number {
  return realMs * GAME_TIME_MULTIPLIER;
}

/**
 * Convert game milliseconds to real milliseconds
 * 
 * @example
 * ```typescript
 * gameToRealTime(604800000) // 3600000 (1 game week = 1 real hour)
 * ```
 */
export function gameToRealTime(gameMs: number): number {
  return gameMs / GAME_TIME_MULTIPLIER;
}

/**
 * Calculate game time elapsed since start date
 * 
 * @example
 * ```typescript
 * const start = new Date('2025-01-01');
 * const now = new Date('2025-01-01T01:00:00'); // 1 hour later
 * getGameTimeElapsed(start, now) // Returns Date 1 week after start
 * ```
 */
export function getGameTimeElapsed(startDate: Date, currentDate: Date = new Date()): Date {
  const realElapsed = currentDate.getTime() - startDate.getTime();
  const gameElapsed = realToGameTime(realElapsed);
  return new Date(startDate.getTime() + gameElapsed);
}

/**
 * Format game time duration (e.g., "2 weeks", "3 days")
 * 
 * @example
 * ```typescript
 * formatGameDuration(604800000) // "1 week"
 * formatGameDuration(172800000) // "2 days"
 * ```
 */
export function formatGameDuration(gameMs: number): string {
  return dayjs.duration(gameMs).humanize();
}

/**
 * Format date with custom format
 * 
 * @example
 * ```typescript
 * formatDate(new Date(), 'YYYY-MM-DD') // "2025-11-20"
 * formatDate(new Date(), 'MMM DD, YYYY') // "Nov 20, 2025"
 * ```
 */
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format);
}

/**
 * Get relative time (e.g., "2 hours ago")
 * 
 * @example
 * ```typescript
 * const past = new Date(Date.now() - 3600000);
 * getRelativeTime(past) // "an hour ago"
 * ```
 */
export function getRelativeTime(date: Date): string {
  return dayjs(date).fromNow();
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Game Time**: 168x multiplier (1 real hour = 1 game week)
 * 2. **Bidirectional**: Convert real ↔ game time
 * 3. **Formatting**: Human-readable durations and dates
 * 4. **Relative Time**: "X time ago" for events
 * 5. **dayjs Integration**: Lightweight date library
 * 
 * PREVENTS:
 * - 34 duplicate time conversion functions (legacy build)
 * - Inconsistent game time calculations
 * - Manual date formatting across components
 */
