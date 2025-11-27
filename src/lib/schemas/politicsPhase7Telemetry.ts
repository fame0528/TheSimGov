/**
 * @fileoverview Zod Schemas for Phase 7 Telemetry & Achievement Payloads
 * @module lib/schemas/politicsPhase7Telemetry
 *
 * OVERVIEW:
 * Runtime validation layer for Achievements & Telemetry data contracts defined in
 * `src/lib/types/politicsPhase7.ts`. Provides discriminated unions for telemetry
 * events and structured validation for achievement definitions & unlocks.
 *
 * @created 2025-11-27
 */

import { z } from 'zod';
import {
  AchievementRewardType,
  TelemetryEventType,
  AchievementStatus,
  AchievementCategory,
  AchievementReward,
  AchievementDefinition,
  TelemetryEvent
} from '@/lib/types';

// ===================== ACHIEVEMENTS =====================

export const AchievementRewardSchema = z.object({
  type: z.nativeEnum(AchievementRewardType),
  value: z.union([z.number(), z.string()])
}) satisfies z.ZodType<AchievementReward>;

export const AchievementCriteriaExpressionSchema = z.object({
  metric: z.string().min(1),
  comparison: z.enum(['>=', '>', '<=', '<', '==', '!=']),
  value: z.number(),
  window: z.enum(['CURRENT_CYCLE', 'LIFETIME']).optional()
});

export const AchievementDefinitionSchema = z.object({
  id: z.string().min(1),
  category: z.nativeEnum(AchievementCategory),
  title: z.string().min(1),
  description: z.string().min(1),
  criteria: AchievementCriteriaExpressionSchema,
  reward: AchievementRewardSchema,
  repeatable: z.boolean(),
  maxRepeats: z.number().int().positive().optional(),
  schemaVersion: z.literal(1)
}) satisfies z.ZodType<AchievementDefinition>;

export const AchievementUnlockSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  achievementId: z.string(),
  unlockedEpoch: z.number(),
  status: z.nativeEnum(AchievementStatus),
  rewardApplied: z.boolean(),
  schemaVersion: z.literal(1)
});

// ===================== TELEMETRY EVENTS =====================

const TelemetryEventBaseSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  createdEpoch: z.number(),
  schemaVersion: z.literal(1)
});

const CampaignPhaseChangeSchema = TelemetryEventBaseSchema.extend({
  type: z.literal(TelemetryEventType.CAMPAIGN_PHASE_CHANGE),
  fromPhase: z.string(),
  toPhase: z.string(),
  cycleSequence: z.number().int().nonnegative()
});

const DebateResultSchema = TelemetryEventBaseSchema.extend({
  type: z.literal(TelemetryEventType.DEBATE_RESULT),
  debateId: z.string(),
  performanceScore: z.number(),
  pollShiftImmediatePercent: z.number()
});

const EndorsementSchema = TelemetryEventBaseSchema.extend({
  type: z.literal(TelemetryEventType.ENDORSEMENT),
  endorsementId: z.string(),
  tier: z.string(),
  influenceBonusPercent: z.number()
});

const BillVoteSchema = TelemetryEventBaseSchema.extend({
  type: z.literal(TelemetryEventType.BILL_VOTE),
  legislationId: z.string(),
  vote: z.enum(['FOR', 'AGAINST', 'ABSTAIN']),
  outcome: z.enum(['PASSED', 'FAILED'])
});

const PolicyEnactedSchema = TelemetryEventBaseSchema.extend({
  type: z.literal(TelemetryEventType.POLICY_ENACTED),
  policyCode: z.string(),
  impactPercent: z.number()
});

const LobbyAttemptSchema = TelemetryEventBaseSchema.extend({
  type: z.literal(TelemetryEventType.LOBBY_ATTEMPT),
  legislationId: z.string(),
  success: z.boolean(),
  influenceAppliedPercent: z.number()
});

const MomentumShiftSchema = TelemetryEventBaseSchema.extend({
  type: z.literal(TelemetryEventType.MOMENTUM_SHIFT),
  previousMomentumIndex: z.number().min(0).max(1),
  newMomentumIndex: z.number().min(0).max(1),
  delta: z.number()
});

const PollIntervalSchema = TelemetryEventBaseSchema.extend({
  type: z.literal(TelemetryEventType.POLL_INTERVAL),
  finalSupportPercent: z.number(),
  volatilityAppliedPercent: z.number(),
  reputationScore: z.number()
});

const SystemBalanceAppliedSchema = TelemetryEventBaseSchema.extend({
  type: z.literal(TelemetryEventType.SYSTEM_BALANCE_APPLIED),
  underdogBuffAppliedPercent: z.number().optional(),
  frontrunnerPenaltyAppliedPercent: z.number().optional(),
  fairnessFloorPercent: z.number()
});

export const TelemetryEventSchema = z.discriminatedUnion('type', [
  CampaignPhaseChangeSchema,
  DebateResultSchema,
  EndorsementSchema,
  BillVoteSchema,
  PolicyEnactedSchema,
  LobbyAttemptSchema,
  MomentumShiftSchema,
  PollIntervalSchema,
  SystemBalanceAppliedSchema
]) satisfies z.ZodType<TelemetryEvent>;

export type TelemetryEventInput = z.input<typeof TelemetryEventSchema>;
export type TelemetryEventOutput = z.output<typeof TelemetryEventSchema>;

// ===================== AGGREGATES =====================
export const TelemetryAggregateSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  granularity: z.enum(['DAILY', 'WEEKLY']),
  periodStartEpoch: z.number(),
  periodEndEpoch: z.number(),
  eventCounts: z.record(z.nativeEnum(TelemetryEventType), z.number().int().nonnegative()),
  influenceNetPercent: z.number(),
  reputationNetPercent: z.number(),
  momentumAvgIndex: z.number().min(0).max(1).optional(),
  schemaVersion: z.literal(1)
});

// ===================== HELPERS =====================

/** Validate raw telemetry event; throws ZodError on failure */
export function validateTelemetryEvent(input: unknown): TelemetryEventOutput {
  return TelemetryEventSchema.parse(input);
}

/** Safe parse variant returning success boolean */
export function safeParseTelemetryEvent(input: unknown) {
  return TelemetryEventSchema.safeParse(input);
}
