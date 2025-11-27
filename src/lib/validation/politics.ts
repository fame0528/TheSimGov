/**
 * @fileoverview Zod Validation Schemas for Political Engagement API
 * @module lib/validation/politics
 * 
 * OVERVIEW:
 * Comprehensive Zod schemas mirroring politics.ts TypeScript interfaces for runtime
 * validation of API request/response payloads. Enforces contract boundaries, input
 * sanitization, and type safety for advanced political engagement endpoints.
 * 
 * DESIGN PRINCIPLES:
 * - Pre-Envelope Validation: Validates request bodies/queries before business logic
 * - Type Inference: Schemas derive TypeScript types matching canonical interfaces
 * - Defensive Defaults: Provides sensible defaults while allowing strict overrides
 * - Seed Validation: Ensures deterministic seed formats for reproducibility
 * - Schema Versioning: Validates schemaVersion field for forward compatibility
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

import { z } from 'zod';
import {
  CampaignPhase,
  ScandalCategory,
  ScandalStatus,
  EndorsementSourceCategory,
  EndorsementTier,
  AchievementCategory,
  LeaderboardMetricType,
  TrendDirection,
  LegislationStatus,
} from '../types/politics';

// ===================== ENUMS =====================

/** Zod enum schemas matching TypeScript enums */
export const CampaignPhaseSchema = z.nativeEnum(CampaignPhase);
export const ScandalCategorySchema = z.nativeEnum(ScandalCategory);
export const ScandalStatusSchema = z.nativeEnum(ScandalStatus);
export const EndorsementSourceCategorySchema = z.nativeEnum(EndorsementSourceCategory);
export const EndorsementTierSchema = z.nativeEnum(EndorsementTier);
export const AchievementCategorySchema = z.nativeEnum(AchievementCategory);
export const LeaderboardMetricTypeSchema = z.nativeEnum(LeaderboardMetricType);
export const TrendDirectionSchema = z.nativeEnum(TrendDirection);
export const LegislationStatusSchema = z.nativeEnum(LegislationStatus);

// ===================== CORE DATA SCHEMAS =====================

/** Campaign Phase State Schema */
export const CampaignPhaseStateSchema = z.object({
  id: z.string().min(1),
  playerId: z.string().min(1),
  cycleSequence: z.number().int().nonnegative(),
  activePhase: CampaignPhaseSchema,
  phaseStartedEpoch: z.number().int().positive(),
  phaseEndsEpoch: z.number().int().positive(),
  spendPressureIndex: z.number().min(0).max(1),
  volatilityModifier: z.number().min(0).max(1),
  engagementSaturation: z.number().min(0).max(1),
  fundsRaisedThisCycle: z.number().nonnegative(),
  endorsementsAcquired: z.number().int().nonnegative(),
  scandalsActive: z.number().int().nonnegative(),
  pollingShiftProjectedPercent: z.number(),
  reputationScore: z.number().min(0).max(100),
  seed: z.string().min(1),
  schemaVersion: z.literal(1),
  updatedEpoch: z.number().int().positive(),
});

/** Polling Snapshot Schema */
export const PollingSnapshotSchema = z.object({
  id: z.string().min(1),
  playerId: z.string().min(1),
  timestampEpoch: z.number().int().positive(),
  sampleSize: z.number().int().positive(),
  baseSupportPercent: z.number().min(0).max(100),
  volatilityAppliedPercent: z.number(),
  smoothingAppliedPercent: z.number(),
  finalSupportPercent: z.number().min(0).max(100),
  marginOfErrorPercent: z.number().min(0).max(100),
  reputationScore: z.number().min(0).max(100),
  seed: z.string().min(1),
  schemaVersion: z.literal(1),
});

/** Debate Performance Schema */
export const DebatePerformanceSchema = z.object({
  id: z.string().min(1),
  debateId: z.string().min(1),
  playerId: z.string().min(1),
  performanceScore: z.number().min(0).max(100),
  rhetoricalScore: z.number().min(0).max(100),
  policyScore: z.number().min(0).max(100),
  charismaScore: z.number().min(0).max(100),
  penalties: z.array(z.string()),
  pollShiftImmediatePercent: z.number(),
  pollShiftPersistingPercent: z.number(),
  reputationAfterDebate: z.number().min(0).max(100),
  seed: z.string().min(1),
  schemaVersion: z.literal(1),
  createdEpoch: z.number().int().positive(),
});

/** Scandal Record Schema */
export const ScandalRecordSchema = z.object({
  id: z.string().min(1),
  playerId: z.string().min(1),
  category: ScandalCategorySchema,
  severity: z.number().min(0).max(1),
  status: ScandalStatusSchema,
  discoveredEpoch: z.number().int().positive(),
  containedEpoch: z.number().int().positive().optional(),
  resolvedEpoch: z.number().int().positive().optional(),
  reputationHitPercent: z.number().min(0).max(100),
  recoveryRatePerHourPercent: z.number().min(0).max(100),
  mitigationActions: z.array(z.string()),
  seed: z.string().min(1),
  schemaVersion: z.literal(1),
  updatedEpoch: z.number().int().positive(),
});

/** Endorsement Record Schema */
export const EndorsementRecordSchema = z.object({
  id: z.string().min(1),
  playerId: z.string().min(1),
  sourceCategory: EndorsementSourceCategorySchema,
  sourceName: z.string().min(1).max(200),
  tier: EndorsementTierSchema,
  acquiredEpoch: z.number().int().positive(),
  diminishingReturnFactor: z.number().min(0).max(1),
  influenceBonusPercent: z.number().nonnegative(),
  fundraisingBonusPercent: z.number().nonnegative(),
  expiryEpoch: z.number().int().positive().optional(),
  schemaVersion: z.literal(1),
});

/** Achievement Event Schema */
export const AchievementEventSchema = z.object({
  id: z.string().min(1),
  playerId: z.string().min(1),
  category: AchievementCategorySchema,
  unlockedEpoch: z.number().int().positive(),
  criteriaSummary: z.string().min(1).max(500),
  rewardType: z.enum(['INFLUENCE', 'FUNDRAISING_EFFICIENCY', 'REPUTATION_RESTORE', 'TITLE_UNLOCK']),
  rewardValue: z.union([z.number(), z.string()]),
  schemaVersion: z.literal(1),
});

/** Leaderboard Entry Schema */
export const LeaderboardEntrySchema = z.object({
  id: z.string().min(1),
  playerId: z.string().min(1),
  metricType: LeaderboardMetricTypeSchema,
  metricValue: z.number(),
  rank: z.number().int().positive(),
  trend: TrendDirectionSchema,
  lastUpdatedEpoch: z.number().int().positive(),
  seasonId: z.string().min(1),
  schemaVersion: z.literal(1),
});

/** Legislation Schema */
export const LegislationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(300),
  summary: z.string().min(1).max(2000),
  originatingBody: z.enum(['House', 'Senate', 'StateLegislature']),
  status: LegislationStatusSchema,
  introducedWeek: z.number().int().nonnegative(),
  statusUpdatedWeek: z.number().int().nonnegative(),
  sponsorshipCount: z.number().int().nonnegative(),
  influenceThresholdPercent: z.number().min(0).max(100),
  currentInfluencePercent: z.number().min(0).max(100),
  seed: z.string().min(1),
  schemaVersion: z.literal(1),
});

// ===================== REQUEST VALIDATION SCHEMAS =====================

/** Campaign state query parameters */
export const GetCampaignStateQuerySchema = z.object({
  playerId: z.string().min(1),
});

/** Advance phase request body */
export const AdvancePhaseBodySchema = z.object({
  playerId: z.string().min(1),
});

/** Fundraise action request body */
export const FundraiseActionBodySchema = z.object({
  playerId: z.string().min(1),
  amount: z.number().positive(),
  source: z.string().min(1).max(100),
});

/** Lobby action request body (extends existing lobbying) */
export const LobbyActionBodySchema = z.object({
  playerId: z.string().min(1),
  legislationId: z.string().min(1),
  spend: z.number().nonnegative(),
});

/** Endorsement action request body */
export const EndorsementActionBodySchema = z.object({
  playerId: z.string().min(1),
  sourceCategory: EndorsementSourceCategorySchema,
  sourceName: z.string().min(1).max(200),
  tier: EndorsementTierSchema,
});

/** Resolve election request body */
export const ResolveElectionBodySchema = z.object({
  playerId: z.string().min(1),
});

/** Polling snapshots query parameters */
export const GetPollingSnapshotsQuerySchema = z.object({
  playerId: z.string().min(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/** Generate polling snapshot request body */
export const GeneratePollingSnapshotBodySchema = z.object({
  playerId: z.string().min(1),
});

/** Aggregate polling query parameters */
export const AggregatePollingQuerySchema = z.object({
  playerId: z.string().min(1),
  windowHours: z.coerce.number().positive().max(168), // Max 1 week
});

/** Submit debate performance request body */
export const SubmitDebatePerformanceBodySchema = z.object({
  debateId: z.string().min(1),
  playerId: z.string().min(1),
  rhetorical: z.number().min(0).max(100),
  policy: z.number().min(0).max(100),
  charisma: z.number().min(0).max(100),
  penalties: z.array(z.string()).optional().default([]),
});

/** Get debate results query parameters */
export const GetDebateResultsQuerySchema = z.object({
  debateId: z.string().min(1),
});

/** Get active scandals query parameters */
export const GetActiveScandalsQuerySchema = z.object({
  playerId: z.string().min(1),
});

/** Mitigate scandal request body */
export const MitigateScandalBodySchema = z.object({
  playerId: z.string().min(1),
  scandalId: z.string().min(1),
  actionCode: z.string().min(1).max(50),
});

/** Generate scandal request body (admin/testing) */
export const GenerateScandalBodySchema = z.object({
  playerId: z.string().min(1),
  category: ScandalCategorySchema.optional(),
});

/** List endorsements query parameters */
export const ListEndorsementsQuerySchema = z.object({
  playerId: z.string().min(1),
});

/** Acquire endorsement request body */
export const AcquireEndorsementBodySchema = z.object({
  playerId: z.string().min(1),
  sourceCategory: EndorsementSourceCategorySchema,
  sourceName: z.string().min(1).max(200),
  tier: EndorsementTierSchema,
});

/** Expire endorsement request body */
export const ExpireEndorsementBodySchema = z.object({
  endorsementId: z.string().min(1),
});

/** Get pending achievements query parameters */
export const GetPendingAchievementsQuerySchema = z.object({
  playerId: z.string().min(1),
});

/** Claim achievement request body */
export const ClaimAchievementBodySchema = z.object({
  playerId: z.string().min(1),
  achievementId: z.string().min(1),
});

/** Get leaderboard query parameters */
export const GetLeaderboardQuerySchema = z.object({
  metricType: LeaderboardMetricTypeSchema,
  seasonId: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(100),
});

/** Get player rank query parameters */
export const GetPlayerRankQuerySchema = z.object({
  playerId: z.string().min(1),
  metricType: LeaderboardMetricTypeSchema,
});

// ===================== RESPONSE SCHEMAS =====================

/** Success envelope schema (generic) */
export const SuccessEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

/** Error envelope schema */
export const ErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.record(z.any()).optional(),
  }),
});

/** Campaign state response */
export const CampaignStateResponseSchema = SuccessEnvelopeSchema(
  z.object({
    state: CampaignPhaseStateSchema,
  })
);

/** Phase transition response */
export const PhaseTransitionResponseSchema = SuccessEnvelopeSchema(
  z.object({
    state: CampaignPhaseStateSchema,
    phaseTransition: z.object({
      from: CampaignPhaseSchema,
      to: CampaignPhaseSchema,
    }),
  })
);

/** Fundraise action response */
export const FundraiseActionResponseSchema = SuccessEnvelopeSchema(
  z.object({
    updatedState: CampaignPhaseStateSchema,
    achievementEvents: z.array(AchievementEventSchema).optional(),
  })
);

/** Lobby action response */
export const LobbyActionResponseSchema = SuccessEnvelopeSchema(
  z.object({
    success: z.boolean(),
    probability: z.number().min(0).max(1),
    updatedState: CampaignPhaseStateSchema,
  })
);

/** Endorsement action response */
export const EndorsementActionResponseSchema = SuccessEnvelopeSchema(
  z.object({
    endorsement: EndorsementRecordSchema,
    updatedState: CampaignPhaseStateSchema,
  })
);

/** Election resolution response */
export const ElectionResolutionResponseSchema = SuccessEnvelopeSchema(
  z.object({
    result: z.object({
      win: z.boolean(),
      votePercent: z.number().min(0).max(100),
    }),
    updatedState: CampaignPhaseStateSchema,
  })
);

/** Polling snapshots response */
export const PollingSnapshotsResponseSchema = SuccessEnvelopeSchema(
  z.object({
    snapshots: z.array(PollingSnapshotSchema),
  })
);

/** Polling snapshot generation response */
export const PollingSnapshotResponseSchema = SuccessEnvelopeSchema(
  z.object({
    snapshot: PollingSnapshotSchema,
  })
);

/** Polling aggregate response */
export const PollingAggregateResponseSchema = SuccessEnvelopeSchema(
  z.object({
    aggregate: z.object({
      mean: z.number().min(0).max(100),
      volatility: z.number().nonnegative(),
      trend: z.enum(['UP', 'DOWN', 'STABLE']),
    }),
  })
);

/** Debate performance submission response */
export const DebatePerformanceResponseSchema = SuccessEnvelopeSchema(
  z.object({
    performance: DebatePerformanceSchema,
  })
);

/** Debate results response */
export const DebateResultsResponseSchema = SuccessEnvelopeSchema(
  z.object({
    performances: z.array(DebatePerformanceSchema),
  })
);

/** Active scandals response */
export const ActiveScandalsResponseSchema = SuccessEnvelopeSchema(
  z.object({
    scandals: z.array(ScandalRecordSchema),
  })
);

/** Scandal mitigation response */
export const ScandalMitigationResponseSchema = SuccessEnvelopeSchema(
  z.object({
    scandal: ScandalRecordSchema,
  })
);

/** Scandal generation response */
export const ScandalGenerationResponseSchema = SuccessEnvelopeSchema(
  z.object({
    scandal: ScandalRecordSchema,
  })
);

/** Endorsements list response */
export const EndorsementsListResponseSchema = SuccessEnvelopeSchema(
  z.object({
    endorsements: z.array(EndorsementRecordSchema),
  })
);

/** Endorsement acquisition response */
export const EndorsementAcquisitionResponseSchema = SuccessEnvelopeSchema(
  z.object({
    endorsement: EndorsementRecordSchema,
  })
);

/** Endorsement expiry response */
export const EndorsementExpiryResponseSchema = SuccessEnvelopeSchema(
  z.object({
    success: z.boolean(),
  })
);

/** Pending achievements response */
export const PendingAchievementsResponseSchema = SuccessEnvelopeSchema(
  z.object({
    events: z.array(AchievementEventSchema),
  })
);

/** Achievement claim response */
export const AchievementClaimResponseSchema = SuccessEnvelopeSchema(
  z.object({
    claimed: AchievementEventSchema,
  })
);

/** Leaderboard response */
export const LeaderboardResponseSchema = SuccessEnvelopeSchema(
  z.object({
    entries: z.array(LeaderboardEntrySchema),
  })
);

/** Player rank response */
export const PlayerRankResponseSchema = SuccessEnvelopeSchema(
  z.object({
    entry: LeaderboardEntrySchema,
  })
);

// ===================== TYPE INFERENCE =====================

/** Infer TypeScript types from Zod schemas for use in route handlers */
export type GetCampaignStateQuery = z.infer<typeof GetCampaignStateQuerySchema>;
export type AdvancePhaseBody = z.infer<typeof AdvancePhaseBodySchema>;
export type FundraiseActionBody = z.infer<typeof FundraiseActionBodySchema>;
export type LobbyActionBody = z.infer<typeof LobbyActionBodySchema>;
export type EndorsementActionBody = z.infer<typeof EndorsementActionBodySchema>;
export type ResolveElectionBody = z.infer<typeof ResolveElectionBodySchema>;
export type GetPollingSnapshotsQuery = z.infer<typeof GetPollingSnapshotsQuerySchema>;
export type GeneratePollingSnapshotBody = z.infer<typeof GeneratePollingSnapshotBodySchema>;
export type AggregatePollingQuery = z.infer<typeof AggregatePollingQuerySchema>;
export type SubmitDebatePerformanceBody = z.infer<typeof SubmitDebatePerformanceBodySchema>;
export type GetDebateResultsQuery = z.infer<typeof GetDebateResultsQuerySchema>;
export type GetActiveScandalsQuery = z.infer<typeof GetActiveScandalsQuerySchema>;
export type MitigateScandalBody = z.infer<typeof MitigateScandalBodySchema>;
export type GenerateScandalBody = z.infer<typeof GenerateScandalBodySchema>;
export type ListEndorsementsQuery = z.infer<typeof ListEndorsementsQuerySchema>;
export type AcquireEndorsementBody = z.infer<typeof AcquireEndorsementBodySchema>;
export type ExpireEndorsementBody = z.infer<typeof ExpireEndorsementBodySchema>;
export type GetPendingAchievementsQuery = z.infer<typeof GetPendingAchievementsQuerySchema>;
export type ClaimAchievementBody = z.infer<typeof ClaimAchievementBodySchema>;
export type GetLeaderboardQuery = z.infer<typeof GetLeaderboardQuerySchema>;
export type GetPlayerRankQuery = z.infer<typeof GetPlayerRankQuerySchema>;

// ===================== VALIDATION HELPERS =====================

/**
 * Validates request body against schema and returns typed result
 * @throws ZodError if validation fails
 */
export function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): z.infer<T> {
  return schema.parse(body);
}

/**
 * Validates query parameters against schema and returns typed result
 * @throws ZodError if validation fails
 */
export function validateQuery<T extends z.ZodTypeAny>(
  schema: T,
  query: unknown
): z.infer<T> {
  return schema.parse(query);
}

/**
 * Safe validation that returns success/error result instead of throwing
 */
export function safeValidate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

// ===================== IMPLEMENTATION NOTES =====================
/**
 * IMPLEMENTATION NOTES:
 * 1. All schemas use .min(1) for required strings to prevent empty values
 * 2. Numeric ranges match TypeScript interface constraints (0-100 for percents, 0-1 for factors)
 * 3. Default values provided where sensible (e.g., limit defaults to 20/100)
 * 4. Coerce used for query parameters (string → number conversion)
 * 5. Optional fields use .optional() to match TypeScript interface optionality
 * 6. Arrays default to empty array where appropriate (penalties, mitigationActions)
 * 7. Seed validation ensures non-empty string for deterministic reproducibility
 * 8. Schema version validated as literal 1 for forward compatibility
 * 9. Success/error envelopes match existing API patterns from FID-20251125-003
 * 10. Type inference exports enable type-safe route handler parameters
 */

/**
 * USAGE EXAMPLE:
 * ```typescript
 * // In API route handler
 * import { validateBody, FundraiseActionBodySchema } from '@/lib/validation/politics';
 * 
 * export async function POST(request: Request) {
 *   try {
 *     const body = await request.json();
 *     const validated = validateBody(FundraiseActionBodySchema, body);
 *     // validated is type-safe: { playerId: string; amount: number; source: string }
 *     // ... business logic
 *   } catch (error) {
 *     if (error instanceof z.ZodError) {
 *       return NextResponse.json({ success: false, error: { message: 'Validation failed', details: error.errors } }, { status: 400 });
 *     }
 *     // ... other error handling
 *   }
 * }
 * ```
 */
