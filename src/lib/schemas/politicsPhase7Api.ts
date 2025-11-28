/**
 * @fileoverview Zod validation schemas for Phase 7 Politics API query/body parameters
 * @module lib/schemas/politicsPhase7Api
 * @created 2025-11-27
 */

import { z } from 'zod';
import { TelemetryEventType } from '@/lib/types/politicsPhase7';

export const achievementsQuerySchema = z.object({
  playerId: z.string().optional(),
  refresh: z.string().transform(v => v === 'true').optional(),
});

export const redeemBodySchema = z.object({
  achievementId: z.string().min(1),
  repeatIndex: z.number().int().nonnegative().optional(),
});

export const telemetryEventsQuerySchema = z.object({
  playerId: z.string().optional(),
  types: z.string().optional(), // CSV of event types
  sinceEpoch: z.string().regex(/^\d+$/).transform(v => parseInt(v, 10)).optional(),
  limit: z.string().regex(/^\d+$/).transform(v => parseInt(v, 10)).optional(),
  offset: z.string().regex(/^\d+$/).transform(v => parseInt(v, 10)).optional(),
});

export const telemetryStatsQuerySchema = z.object({
  playerId: z.string().optional(),
  range: z.enum(['recent','custom']).optional(),
  startEpoch: z.string().regex(/^\d+$/).transform(v => parseInt(v, 10)).optional(),
  endEpoch: z.string().regex(/^\d+$/).transform(v => parseInt(v, 10)).optional(),
  recompute: z.string().transform(v => v === 'true').optional(),
});

/** Helper to parse and validate event types list */
export function parseEventTypes(csv?: string): TelemetryEventType[] | undefined {
  if (!csv) return undefined;
  const parts = csv.split(',').map(s => s.trim()).filter(Boolean);
  const valid = new Set(Object.values(TelemetryEventType));
  const filtered: TelemetryEventType[] = [];
  for (const p of parts) {
    if (valid.has(p as TelemetryEventType)) filtered.push(p as TelemetryEventType);
  }
  return filtered.length ? filtered : undefined;
}
