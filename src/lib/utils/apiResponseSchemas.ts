/**
 * @file src/lib/utils/apiResponseSchemas.ts
 * @description Zod validation schemas for API response payloads
 * @created 2025-11-25
 *
 * OVERVIEW:
 * Output validation schemas ensuring type-safe response serialization.
 * Validates responses before sending to catch serialization bugs at runtime.
 * Complements input validation with comprehensive contract enforcement.
 *
 * EXPORTS:
 * - StateMetricsResponseSchema: Validates state-derived metrics responses
 * - LeaderboardResponseSchema: Validates leaderboard aggregation responses
 * - ElectionProjectionResponseSchema: Validates election projection responses
 * - EndorsementsResponseSchema: Validates paginated endorsements responses
 * - SnapshotsResponseSchema: Validates paginated snapshots responses
 * - validateResponse: Type-safe validation helper with error details
 *
 * IMPLEMENTATION NOTES:
 * - DRY principle: Reuses domain types from src/lib/types/politics
 * - Type-safe: Zod schemas infer TypeScript types matching domain interfaces
 * - Production-ready: Validation errors include detailed path/message info
 * - Optional: Can be enabled/disabled via environment flag for performance
 */

import { z } from 'zod';

// ===================== DOMAIN SCHEMAS =====================

/**
 * State-derived metrics single entry
 * Matches DerivedMetrics interface from stateDerivedMetrics utility
 */
const StateMetricsSchema = z.object({
  stateCode: z.string().length(2),
  populationShare: z.number().min(0).max(1),
  gdpShare: z.number().min(0).max(1),
  seatShare: z.number().min(0).max(1),
  crimePercentile: z.number().min(0).max(1),
  compositeInfluenceWeight: z.number().min(0).max(1),
});

/**
 * Leaderboard entry
 * Matches output from leaderboard aggregation
 */
const LeaderboardEntrySchema = z.object({
  companyId: z.string().min(1),
  companyName: z.string().min(1),
  totalInfluence: z.number().nonnegative(),
});

/**
 * Election projection result
 * Matches output from describeNextElection utility
 */
const ElectionProjectionSchema = z.object({
  input: z.object({
    kind: z.string(),
    fromWeek: z.number().int().nonnegative(),
    senateClass: z.number().int().min(1).max(3).optional(),
    termYears: z.number().int().refine((v) => v === 2 || v === 4 || v === 6),
  }),
  result: z.object({
    nextWeek: z.number().int().nonnegative(),
    realHoursUntil: z.number().nonnegative(),
    cyclesFromNow: z.number().nonnegative(),
  }),
});

/**
 * Endorsement stub
 * Matches EndorsementStub from politics types
 */
const EndorsementStubSchema = z.object({
  id: z.string().min(1),
  fromEntityId: z.string().min(1),
  toCandidateId: z.string().min(1),
  week: z.number().int().nonnegative(),
});

/**
 * Influence snapshot
 * Matches InfluenceSnapshot from offlineProtection utility
 */
const InfluenceSnapshotSchema = z.object({
  total: z.number().nonnegative(),
  level: z.number().int().nonnegative(),
  capturedAt: z.string().datetime(),
});

/**
 * Snapshot row (companyId + snapshot)
 * Matches SnapshotRow from snapshots endpoint
 */
const SnapshotRowSchema = z.object({
  companyId: z.string().min(1),
  snapshot: InfluenceSnapshotSchema,
});

/**
 * Pagination metadata
 * Common pagination fields across endpoints
 */
const PaginationMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(50),
  total: z.number().int().nonnegative(),
});

// ===================== RESPONSE SCHEMAS =====================

/**
 * GET /api/politics/states response
 * Returns all states or single state by code
 */
export const StateMetricsResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    data: z.object({
      states: z.array(StateMetricsSchema),
    }),
    meta: z.record(z.unknown()).optional(),
  }),
  z.object({
    success: z.literal(true),
    data: z.object({
      state: StateMetricsSchema,
    }),
    meta: z.record(z.unknown()).optional(),
  }),
]);

/**
 * GET /api/politics/leaderboard response
 * Returns top companies by total influence
 */
export const LeaderboardResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    leaderboard: z.array(LeaderboardEntrySchema),
  }),
  meta: z.record(z.unknown()).optional(),
});

/**
 * GET /api/politics/elections/next response
 * Returns next election projection with input echo
 */
export const ElectionProjectionResponseSchema = z.object({
  success: z.literal(true),
  data: ElectionProjectionSchema,
  meta: z.record(z.unknown()).optional(),
});

/**
 * GET /api/politics/elections/resolve response
 * Returns election resolution result with summary
 */
const ElectionResolutionSummarySchema = z.object({
  adjustedMargins: z.record(z.string(), z.number()),
  stateWinProbability: z.record(z.string(), z.record(z.string(), z.number().min(0).max(1))),
  nationalPopularLeader: z.string().nullable(),
  evLead: z.object({
    leader: z.string().nullable(),
    difference: z.number().nonnegative(),
  }),
});

const ElectionResolutionResultSchema = z.object({
  winner: z.string().nullable(),
  electoralCollege: z.record(z.string(), z.number().int().nonnegative()),
  popularVoteEstimate: z.record(z.string(), z.number().nonnegative()),
  senateVotes: z.record(z.string(), z.number().int().nonnegative()),
  houseVotes: z.record(z.string(), z.number().int().nonnegative()),
  ties: z.array(z.string()),
  recounts: z.array(z.string()),
  lowTurnoutStates: z.array(z.string()),
  summary: ElectionResolutionSummarySchema.optional(),
});

export const ElectionResolutionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    input: z.object({
      candidateAId: z.string(),
      candidateBId: z.string(),
      mode: z.enum(['demo', 'custom']).default('demo'),
      statesCount: z.number().int().positive(),
    }),
    result: ElectionResolutionResultSchema,
  }),
  meta: z.record(z.unknown()).optional(),
});

/**
 * GET /api/politics/endorsements response
 * Returns paginated endorsements with metadata
 */
export const EndorsementsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(50),
    total: z.number().int().nonnegative(),
    endorsements: z.array(EndorsementStubSchema),
  }),
  meta: PaginationMetaSchema.optional(),
});

/**
 * GET /api/politics/snapshots response
 * Returns paginated snapshots with metadata
 */
export const SnapshotsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(50),
    total: z.number().int().nonnegative(),
    snapshots: z.array(SnapshotRowSchema),
  }),
  meta: PaginationMetaSchema.optional(),
});

// ===================== VALIDATION HELPER =====================

/**
 * Type-safe response validation helper
 *
 * @example
 * ```typescript
 * const validated = validateResponse(
 *   StateMetricsResponseSchema,
 *   response,
 *   'states'
 * );
 * if (!validated.success) {
 *   console.error('Validation failed:', validated.errors);
 * }
 * return validated.data; // Type-safe response
 * ```
 *
 * @param schema - Zod schema to validate against
 * @param data - Response data to validate
 * @param endpointName - Endpoint name for error logging
 * @returns Validation result with typed data or errors
 */
export function validateResponse<T>(
  schema: z.ZodType<T>,
  data: unknown,
  endpointName: string
): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(data);

  if (!result.success) {
    console.error(
      `Response validation failed for ${endpointName}:`,
      result.error.issues
    );
    return { success: false, errors: result.error.issues };
  }

  return { success: true, data: result.data };
}

/**
 * Environment-aware validation wrapper
 * Skips validation in production for performance (if VALIDATE_RESPONSES=false)
 *
 * @example
 * ```typescript
 * const response = createSuccessResponse({ states: derived });
 * return maybeValidateResponse(StateMetricsResponseSchema, response, 'states');
 * ```
 */
export function maybeValidateResponse<T>(
  schema: z.ZodType<T>,
  data: unknown,
  endpointName: string
): T {
  const shouldValidate =
    process.env.NODE_ENV !== 'production' ||
    process.env.VALIDATE_RESPONSES === 'true';

  if (!shouldValidate) {
    return data as T;
  }

  const result = validateResponse(schema, data, endpointName);
  if (!result.success) {
    // Log validation errors but don't block response in development
    console.warn(
      `⚠️ Response validation issues for ${endpointName}:`,
      result.errors
    );
  }

  return data as T;
}

/**
 * IMPLEMENTATION NOTES:
 * - Schemas match exact output shapes from endpoints and utilities
 * - Validation errors include detailed path/message for debugging
 * - Optional validation via environment flag prevents production overhead
 * - Type inference ensures schema changes propagate to TypeScript types
 * - Complements input Zod validation for complete contract enforcement
 */
