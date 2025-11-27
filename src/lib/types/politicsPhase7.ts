/**
 * @fileoverview Phase 7 Achievements & Telemetry Data Contracts
 * @module lib/types/politicsPhase7
 *
 * OVERVIEW:
 * Canonical enums and interfaces for the Achievements & Telemetry systems.
 * Establishes a single source of truth for: achievement definitions, unlocks,
 * progress tracking, reward types, telemetry event taxonomy, and aggregation
 * records. All interfaces are pure data contracts (no methods) and versioned
 * with a literal `schemaVersion` for forward-compatible evolution.
 *
 * DESIGN PRINCIPLES:
 * - Deterministic: Every telemetry event includes epoch + stable identifiers.
 * - Minimal Write Amplification: Telemetry raw events kept lean; heavy
 *   derivations happen in scheduled aggregation (daily/weekly).
 * - Fairness & Auditability: Unlock paths are explicit, reward application
 *   semantics encoded in `AchievementRewardType` and never implicit.
 * - Extensibility: Discriminated unions allow additive event variants without
 *   breaking existing consumers (schemaVersion gate + new `type` strings).
 * - DRY: Reuses existing `AchievementCategory` from `politics.ts` rather than
 *   redefining category concepts.
 *
 * @created 2025-11-27
 */

import { AchievementCategory } from './politics';

// ===================== ENUMS =====================

/** Reward application semantics for unlocked achievements */
export enum AchievementRewardType {
  INFLUENCE = 'INFLUENCE',                // Flat influence points
  FUNDRAISING_EFFICIENCY = 'FUNDRAISING_EFFICIENCY', // Multiplicative efficiency factor
  REPUTATION_RESTORE = 'REPUTATION_RESTORE',         // Restore reputation points
  TITLE_UNLOCK = 'TITLE_UNLOCK',          // Unlock a cosmetic / prestige title
  BADGE_UNLOCK = 'BADGE_UNLOCK'           // Unlock a visible badge artifact
}

/**
 * Telemetry event taxonomy for Phase 7. Each variant should map to a Zod
 * schema (see `src/lib/schemas/politicsPhase7Telemetry.ts`).
 */
export enum TelemetryEventType {
  CAMPAIGN_PHASE_CHANGE = 'CAMPAIGN_PHASE_CHANGE',
  DEBATE_RESULT = 'DEBATE_RESULT',
  ENDORSEMENT = 'ENDORSEMENT',
  BILL_VOTE = 'BILL_VOTE',
  POLICY_ENACTED = 'POLICY_ENACTED',
  LOBBY_ATTEMPT = 'LOBBY_ATTEMPT',
  MOMENTUM_SHIFT = 'MOMENTUM_SHIFT',
  POLL_INTERVAL = 'POLL_INTERVAL',
  SYSTEM_BALANCE_APPLIED = 'SYSTEM_BALANCE_APPLIED'
}

/** Achievement lifecycle status (derived, not stored on definition) */
export enum AchievementStatus {
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
  CLAIMED = 'CLAIMED'
}

// ===================== ACHIEVEMENTS =====================

/**
 * Declarative achievement definition. `criteria` is an opaque descriptor to be
 * interpreted by the achievement engine (e.g. DSL fragment, structured rule).
 */
export interface AchievementDefinition {
  id: string;                              // Stable identifier (e.g. ACH_FIRST_CAMPAIGN)
  category: AchievementCategory;           // Reuse political subsystem categories
  title: string;                           // Display title
  description: string;                     // Player-facing description
  criteria: AchievementCriteriaExpression; // Opaque criteria specification
  reward: AchievementReward;               // Reward payload
  repeatable: boolean;                     // Can be earned more than once?
  maxRepeats?: number;                     // Optional cap for repeatables
  schemaVersion: 1;                        // Literal version
}

/**
 * Criteria expression: minimal structured rule. Additional operators can be
 * added in future versions (schemaVersion bump) without breaking consumers.
 */
export interface AchievementCriteriaExpression {
  metric: string;        // Metric key (e.g. cyclesCompleted, electionsWon)
  comparison: '>=' | '>' | '<=' | '<' | '==' | '!='; // Comparison operator
  value: number;         // Threshold value (numeric comparisons only Phase 7)
  window?: 'CURRENT_CYCLE' | 'LIFETIME'; // Optional temporal scope
}

/** Reward descriptor with precise semantics */
export interface AchievementReward {
  type: AchievementRewardType;
  value: number | string; // Numeric (points / factor / restore) or code (title, badge)
  // For efficiency rewards, numeric value interpreted as multiplicative factor (e.g. 0.10 = +10%)
}

/** Achievement unlock event (persistent audit trail) */
export interface AchievementUnlock {
  id: string;                 // DB document/object ID
  playerId: string;           // Player who unlocked
  achievementId: string;      // Reference to AchievementDefinition.id
  unlockedEpoch: number;      // Unix epoch seconds
  status: AchievementStatus;  // LOCKED → UNLOCKED → CLAIMED progression
  rewardApplied: boolean;     // Guard for idempotent reward application
  schemaVersion: 1;
}

/** Progress snapshot for client consumption */
export interface AchievementProgressSnapshot {
  playerId: string;
  total: number;              // Total definitions considered
  unlocked: number;           // Count unlocked (UNLOCKED or CLAIMED)
  claimed: number;            // Count claimed
  pendingIds: string[];       // Definition IDs still locked
  entries: AchievementProgressEntry[]; // Detailed row entries
  schemaVersion: 1;
}

/** Row entry in progress snapshot */
export interface AchievementProgressEntry {
  achievementId: string;
  status: AchievementStatus;
  title: string;
  description: string;
  category: AchievementCategory;
  reward: AchievementReward;
  repeatCount?: number;       // Times achieved if repeatable
  nextThresholdValue?: number;// For repeatables, next threshold preview
}

// ===================== TELEMETRY RAW EVENTS =====================

/** Base shape shared by all telemetry events */
export interface TelemetryEventBase {
  id: string;                 // Event ID
  playerId: string;           // Subject player (never AI)
  createdEpoch: number;       // Unix epoch seconds
  type: TelemetryEventType;   // Discriminator
  schemaVersion: 1;           // Literal version
}

export interface TelemetryCampaignPhaseChangeEvent extends TelemetryEventBase {
  type: TelemetryEventType.CAMPAIGN_PHASE_CHANGE;
  fromPhase: string;
  toPhase: string;
  cycleSequence: number;
}

export interface TelemetryDebateResultEvent extends TelemetryEventBase {
  type: TelemetryEventType.DEBATE_RESULT;
  debateId: string;
  performanceScore: number;
  pollShiftImmediatePercent: number;
}

export interface TelemetryEndorsementEvent extends TelemetryEventBase {
  type: TelemetryEventType.ENDORSEMENT;
  endorsementId: string;
  tier: string;
  influenceBonusPercent: number;
}

export interface TelemetryBillVoteEvent extends TelemetryEventBase {
  type: TelemetryEventType.BILL_VOTE;
  legislationId: string;
  vote: 'FOR' | 'AGAINST' | 'ABSTAIN';
  outcome: 'PASSED' | 'FAILED';
}

export interface TelemetryPolicyEnactedEvent extends TelemetryEventBase {
  type: TelemetryEventType.POLICY_ENACTED;
  policyCode: string;
  impactPercent: number; // Net projected impact percent
}

export interface TelemetryLobbyAttemptEvent extends TelemetryEventBase {
  type: TelemetryEventType.LOBBY_ATTEMPT;
  legislationId: string;
  success: boolean;
  influenceAppliedPercent: number;
}

export interface TelemetryMomentumShiftEvent extends TelemetryEventBase {
  type: TelemetryEventType.MOMENTUM_SHIFT;
  previousMomentumIndex: number; // 0-1 normalized
  newMomentumIndex: number;      // 0-1 normalized
  delta: number;                 // Signed difference
}

export interface TelemetryPollIntervalEvent extends TelemetryEventBase {
  type: TelemetryEventType.POLL_INTERVAL;
  finalSupportPercent: number;
  volatilityAppliedPercent: number;
  reputationScore: number;
}

export interface TelemetrySystemBalanceAppliedEvent extends TelemetryEventBase {
  type: TelemetryEventType.SYSTEM_BALANCE_APPLIED;
  underdogBuffAppliedPercent?: number;   // Optional if triggered
  frontrunnerPenaltyAppliedPercent?: number; // Optional if triggered
  fairnessFloorPercent: number;          // Minimum enforced probability floor
}

/** Discriminated union of all telemetry events */
export type TelemetryEvent =
  | TelemetryCampaignPhaseChangeEvent
  | TelemetryDebateResultEvent
  | TelemetryEndorsementEvent
  | TelemetryBillVoteEvent
  | TelemetryPolicyEnactedEvent
  | TelemetryLobbyAttemptEvent
  | TelemetryMomentumShiftEvent
  | TelemetryPollIntervalEvent
  | TelemetrySystemBalanceAppliedEvent;

// ===================== TELEMETRY AGGREGATES =====================

/** Aggregated metrics (daily/weekly rollups) */
export interface TelemetryAggregate {
  id: string;
  playerId: string;
  granularity: 'DAILY' | 'WEEKLY'; // Partition type
  periodStartEpoch: number;        // Inclusive epoch
  periodEndEpoch: number;          // Exclusive epoch
  eventCounts: Record<TelemetryEventType, number>; // Count per event type
  influenceNetPercent: number;     // Summed net influence impact
  reputationNetPercent: number;    // Summed net reputation impact
  momentumAvgIndex?: number;       // Average momentum index if applicable
  schemaVersion: 1;
}

// ===================== IMPLEMENTATION NOTES =====================
/**
 * IMPLEMENTATION NOTES:
 * 1. All percent fields expressed in whole percents (e.g. 2.4) except momentum indexes (0-1).
 * 2. Raw telemetry kept minimal; expansion occurs in aggregation process.
 * 3. Achievement criteria limited to single metric comparator for Phase 7 scope; future
 *    evolution may introduce logical composition (AND/OR groups) with schemaVersion 2.
 * 4. Reward application must be idempotent; guard with `rewardApplied` field.
 * 5. Aggregates computed by scheduler scanning raw events; do not denormalize excessive data.
 */

/** FUTURE EVOLUTION:
 * - schemaVersion 2 may add multi-metric criteria arrays and rate-limited repeatables.
 * - Telemetry events may include correlation IDs for multi-event transactional flows.
 * - Aggregates may store rolling momentum volatility range for analytics.
 */
