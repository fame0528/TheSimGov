/**
 * @fileoverview Zod validation schemas for Time Engine API
 * @module lib/time/validation
 *
 * OVERVIEW:
 * Centralized runtime validation for time control endpoints. Ensures strict payload
 * contracts for admin operations (set time, fast-forward). Prevents malformed input
 * and supports ECHO AAA quality standards.
 *
 * @created 2025-11-20
 */

import { z } from 'zod';

/** Set game time payload */
export const setTimeSchema = z.object({
  time: z.string().refine(v => !isNaN(Date.parse(v)), 'Invalid ISO date string'),
});

/** Fast-forward payload */
export const fastForwardSchema = z.object({
  hours: z.number().int().positive().max(24 * 365), // cap 1 game year per call
});

export type SetTimeInput = z.infer<typeof setTimeSchema>;
export type FastForwardInput = z.infer<typeof fastForwardSchema>;

/**
 * IMPLEMENTATION NOTES:
 * - Validation centralized to avoid duplication across route handlers
 * - Strict caps on hours to prevent runaway progression
 * - Date parsing refined to ensure valid ISO string
 */