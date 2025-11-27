/**
 * @fileoverview Political Engagement Phase 2 Data Contracts
 * @module lib/types/politics
 * 
 * OVERVIEW:
 * Canonical TypeScript interfaces and enums for advanced player-only political systems.
 * Covers campaign phase machine state, polling snapshots, debate performance results,
 * scandal tracking, endorsement stacking with diminishing returns, achievement events,
 * and leaderboard entries using dynamic difficulty indices (SPI, VM, ES) instead of AI opponents.
 * 
 * DESIGN PRINCIPLES:
 * - Player-Only: Absolutely no AI player representations; all IDs refer to real players.
 * - Deterministic Fairness: All probabilistic outputs include a `seed` for reproducibility.
 * - Versioned Contracts: `schemaVersion` ensures forward-compatible evolution.
 * - Utility-First & DRY: Reuses existing domain patterns (timestamps, id fields) without duplication.
 * - Dynamic Difficulty: Uses environmental indices (SPI, VM, ES) rather than hidden AI scaling.
 * - Offline Protection: Values designed for clamp logic (handled externally) to ensure fairness.
 * 
 * @created 2025-11-25
 * @author ECHO v1.3.0
 */

// ===================== ENUMERATIONS =====================

/** Campaign lifecycle discrete phases (26h accelerated cycle) */
export enum CampaignPhase {
  FUNDRAISING = 'FUNDRAISING',      // Players allocate resources, seek endorsements
  LOBBYING = 'LOBBYING',            // Legislation influence attempts
  PUBLIC_RELATIONS = 'PUBLIC_RELATIONS', // Reputation repair, scandal mitigation
  DEBATE_PREP = 'DEBATE_PREP',      // Preparation window before debate event
  DEBATE = 'DEBATE',                // Live debate performance evaluation
  POST_DEBATE = 'POST_DEBATE',      // Poll stabilization & impact absorption
  ELECTION = 'ELECTION'             // Vote tally mechanics
}

/** Categories of scandals impacting reputation */
export enum ScandalCategory {
  FINANCIAL = 'FINANCIAL',
  ETHICS = 'ETHICS',
  COMPLIANCE = 'COMPLIANCE',
  SECURITY = 'SECURITY',
  OPERATIONS = 'OPERATIONS'
}

/** Scandal lifecycle status */
export enum ScandalStatus {
  DISCOVERED = 'DISCOVERED',        // Identified but not yet mitigated
  INVESTIGATING = 'INVESTIGATING',  // Active mitigation actions
  CONTAINED = 'CONTAINED',          // Impact growth halted
  RESOLVED = 'RESOLVED'             // Recovery phase only
}

/** Endorsement source category */
export enum EndorsementSourceCategory {
  INDUSTRY_ASSOCIATION = 'INDUSTRY_ASSOCIATION',
  REGIONAL_BUSINESS_GROUP = 'REGIONAL_BUSINESS_GROUP',
  INFLUENTIAL_FOUNDER = 'INFLUENTIAL_FOUNDER',
  MEDIA_OUTLET = 'MEDIA_OUTLET',
  POLICY_THINK_TANK = 'POLICY_THINK_TANK'
}

/** Endorsement tier for diminishing returns calculation */
export enum EndorsementTier {
  MINOR = 'MINOR',
  STANDARD = 'STANDARD',
  MAJOR = 'MAJOR',
  FLAGSHIP = 'FLAGSHIP'
}

/** Achievement category (political subsystem specific) */
export enum AchievementCategory {
  FUNDRAISING = 'FUNDRAISING',
  LOBBYING = 'LOBBYING',
  REPUTATION = 'REPUTATION',
  DEBATE = 'DEBATE',
  LEGISLATION = 'LEGISLATION',
  ENDORSEMENTS = 'ENDORSEMENTS'
}

/** Leaderboard metric types (player competitive surfaces) */
export enum LeaderboardMetricType {
  INFLUENCE = 'INFLUENCE',          // Total political influence accumulated
  FUNDRAISING = 'FUNDRAISING',      // Cycle fundraising total
  REPUTATION = 'REPUTATION',        // Current reputation score
  DEBATE_SCORE = 'DEBATE_SCORE',    // Last debate performance score
  LEGISLATION_PASSED = 'LEGISLATION_PASSED', // Count of successful lobbying outcomes
  ENDORSEMENT_POWER = 'ENDORSEMENT_POWER'    // Aggregate adjusted endorsement value
}

/** Direction of trend for leaderboard entry */
export enum TrendDirection {
  UP = 'UP',
  DOWN = 'DOWN',
  STABLE = 'STABLE'
}

// ===================== INTERFACES =====================

/**
 * Campaign Phase Machine State
 * Represents a single player's current campaign cycle progress.
 * Uses environmental indices instead of AI opposition for difficulty scaling.
 */
export interface CampaignPhaseState {
  id: string;                      // Unique state record ID
  playerId: string;                // Player identifier (never AI)
  cycleSequence: number;           // Incrementing cycle counter
  activePhase: CampaignPhase;      // Current phase
  phaseStartedEpoch: number;       // Unix epoch when current phase began
  phaseEndsEpoch: number;          // Unix epoch when current phase ends
  // Dynamic difficulty indices (environment-driven)
  spendPressureIndex: number;      // SPI (0-1 normalized)
  volatilityModifier: number;      // VM (0-1 normalized)
  engagementSaturation: number;    // ES (0-1 normalized)
  // Aggregated cycle metrics
  fundsRaisedThisCycle: number;    // Total fundraising volume
  endorsementsAcquired: number;    // Count of endorsements gained this cycle
  scandalsActive: number;          // Active scandal count (unresolved)
  pollingShiftProjectedPercent: number; // Projected net polling movement end-of-cycle
  reputationScore: number;         // Current reputation (0-100)
  // Deterministic fairness
  seed: string;                    // Seed for any probabilistic resolution logged externally
  schemaVersion: 1;                // Contract version
  updatedEpoch: number;            // Last update timestamp
}

/**
 * Polling Snapshot
 * Represents a smoothed polling data point for a player after applying volatility & smoothing.
 */
export interface PollingSnapshot {
  id: string;
  playerId: string;
  timestampEpoch: number;          // Capture time
  sampleSize: number;              // Synthetic sample size for variance modeling
  baseSupportPercent: number;      // Raw pre-modifier support
  volatilityAppliedPercent: number;// Adjustment from volatility modifier (can be negative)
  smoothingAppliedPercent: number; // Adjustment from smoothing algorithm
  finalSupportPercent: number;     // Result after all transformations
  marginOfErrorPercent: number;    // Derived from sampleSize & volatility
  reputationScore: number;         // Inline reference to current reputation
  seed: string;                    // Deterministic polling generation seed
  schemaVersion: 1;
}

/**
 * Debate Performance Result
 * Captures a player's performance breakdown and resulting polling impact.
 */
export interface DebatePerformance {
  id: string;
  debateId: string;                // Debate event identifier
  playerId: string;
  performanceScore: number;        // Composite (0-100)
  rhetoricalScore: number;         // Sub-score (0-100)
  policyScore: number;             // Sub-score (0-100)
  charismaScore: number;           // Sub-score (0-100)
  penalties: string[];             // Penalty descriptors applied (each reduces score)
  pollShiftImmediatePercent: number; // Immediate support delta post-debate
  pollShiftPersistingPercent: number; // Persisting support delta after stabilization phase
  reputationAfterDebate: number;   // Reputation snapshot consolidated after debate
  seed: string;                    // Deterministic performance roll seed
  schemaVersion: 1;
  createdEpoch: number;
}

/**
 * Scandal Record
 * Tracks lifecycle and impact of a scandal affecting reputation/recovery.
 */
export interface ScandalRecord {
  id: string;
  playerId: string;
  category: ScandalCategory;
  severity: number;                // 0-1 continuous severity scale
  status: ScandalStatus;
  discoveredEpoch: number;
  containedEpoch?: number;         // When status moved to CONTAINED
  resolvedEpoch?: number;          // When status moved to RESOLVED
  reputationHitPercent: number;    // Total percent reputation reduction applied
  recoveryRatePerHourPercent: number; // Passive recovery rate post-resolution
  mitigationActions: string[];     // Action identifiers taken for reduction
  seed: string;                    // Deterministic scandal generation seed
  schemaVersion: 1;
  updatedEpoch: number;
}

/**
 * Endorsement Record
 * Represents a single endorsement source with diminishing return factor applied.
 */
export interface EndorsementRecord {
  id: string;
  playerId: string;
  sourceCategory: EndorsementSourceCategory;
  sourceName: string;              // Display name (association, founder, outlet)
  tier: EndorsementTier;           // Tier for base bonus scaling
  acquiredEpoch: number;
  diminishingReturnFactor: number; // 0-1 multiplier applied after stacking curve
  influenceBonusPercent: number;   // Contribution to influence mechanics
  fundraisingBonusPercent: number; // Contribution to fundraising efficiency
  expiryEpoch?: number;            // Optional expiration (undefined = permanent)
  schemaVersion: 1;
}

/**
 * Achievement Event (political subsystem)
 * Enqueued when player meets criteria, later processed by achievement handler.
 */
export interface AchievementEvent {
  id: string;
  playerId: string;
  category: AchievementCategory;
  unlockedEpoch: number;
  criteriaSummary: string;         // Human-readable explanation
  rewardType: 'INFLUENCE' | 'FUNDRAISING_EFFICIENCY' | 'REPUTATION_RESTORE' | 'TITLE_UNLOCK';
  rewardValue: number | string;    // Numeric boost or title code
  schemaVersion: 1;
}

/**
 * Leaderboard Entry
 * Snapshot entry for a given metric at a point in time.
 */
export interface LeaderboardEntry {
  id: string;
  playerId: string;
  metricType: LeaderboardMetricType;
  metricValue: number;             // Raw value for ranking
  rank: number;                    // Computed rank position
  trend: TrendDirection;           // Direction of movement since prior snapshot
  lastUpdatedEpoch: number;
  seasonId: string;                // Seasonal partition for competitive reset logic
  schemaVersion: 1;
}

// ===================== JSON EXAMPLES =====================
/** Example: CampaignPhaseState JSON
{
  "id": "cps-123",
  "playerId": "player-42",
  "cycleSequence": 7,
  "activePhase": "FUNDRAISING",
  "phaseStartedEpoch": 1732543200,
  "phaseEndsEpoch": 1732552800,
  "spendPressureIndex": 0.63,
  "volatilityModifier": 0.27,
  "engagementSaturation": 0.51,
  "fundsRaisedThisCycle": 125000,
  "endorsementsAcquired": 3,
  "scandalsActive": 1,
  "pollingShiftProjectedPercent": 2.4,
  "reputationScore": 78,
  "seed": "campaign-cycle-7-player-42",
  "schemaVersion": 1,
  "updatedEpoch": 1732543300
}
*/

/** Example: PollingSnapshot JSON
{
  "id": "poll-987",
  "playerId": "player-42",
  "timestampEpoch": 1732543500,
  "sampleSize": 1800,
  "baseSupportPercent": 22.4,
  "volatilityAppliedPercent": -0.8,
  "smoothingAppliedPercent": 0.3,
  "finalSupportPercent": 21.9,
  "marginOfErrorPercent": 2.7,
  "reputationScore": 78,
  "seed": "polling-player-42-1732543500",
  "schemaVersion": 1
}
*/

/** Example: DebatePerformance JSON
{
  "id": "debperf-55",
  "debateId": "deb-12",
  "playerId": "player-42",
  "performanceScore": 86,
  "rhetoricalScore": 88,
  "policyScore": 81,
  "charismaScore": 90,
  "penalties": ["TIME_OVERRUN"],
  "pollShiftImmediatePercent": 1.4,
  "pollShiftPersistingPercent": 0.9,
  "reputationAfterDebate": 80,
  "seed": "debate-deb-12-player-42",
  "schemaVersion": 1,
  "createdEpoch": 1732544000
}
*/

/** Example: ScandalRecord JSON
{
  "id": "sc-314",
  "playerId": "player-42",
  "category": "FINANCIAL",
  "severity": 0.42,
  "status": "INVESTIGATING",
  "discoveredEpoch": 1732544100,
  "reputationHitPercent": 6.5,
  "recoveryRatePerHourPercent": 0.4,
  "mitigationActions": ["AUDIT_INITIATED"],
  "seed": "scandal-player-42-1732544100",
  "schemaVersion": 1,
  "updatedEpoch": 1732544200
}
*/

/** Example: EndorsementRecord JSON
{
  "id": "endorse-77",
  "playerId": "player-42",
  "sourceCategory": "INDUSTRY_ASSOCIATION",
  "sourceName": "Tech Growth Alliance",
  "tier": "MAJOR",
  "acquiredEpoch": 1732544300,
  "diminishingReturnFactor": 0.72,
  "influenceBonusPercent": 4.5,
  "fundraisingBonusPercent": 3.0,
  "schemaVersion": 1
}
*/

/** Example: AchievementEvent JSON
{
  "id": "ach-900",
  "playerId": "player-42",
  "category": "FUNDRAISING",
  "unlockedEpoch": 1732544400,
  "criteriaSummary": "Raised > $100k in single cycle",
  "rewardType": "INFLUENCE",
  "rewardValue": 250,
  "schemaVersion": 1
}
*/

/** Example: LeaderboardEntry JSON
{
  "id": "lb-15",
  "playerId": "player-42",
  "metricType": "INFLUENCE",
  "metricValue": 12450,
  "rank": 3,
  "trend": "UP",
  "lastUpdatedEpoch": 1732544500,
  "seasonId": "S1-2025",
  "schemaVersion": 1
}
*/

// ===================== IMPLEMENTATION NOTES =====================
/**
 * IMPLEMENTATION NOTES:
 * 1. All interfaces include `schemaVersion` literal for migration visibility.
 * 2. No AI player abstractions; competitive dynamics are purely player/environment-driven.
 * 3. Seeds enable deterministic replay/testing of probabilistic resolution logic.
 * 4. Percent fields use real percentages (not 0-1) except severity (0-1 for continuous scaling).
 * 5. Recovery & diminishing return factors kept small to support external clamp safety.
 * 6. Separation of concerns: pure data contracts (no methods) for serialization boundaries.
 * 7. Ready for validation layer (e.g., Zod) by mapping these interfaces directly.
 */

/**
 * FUTURE EVOLUTION:
 * - schemaVersion 2 may introduce separate objects for polling volatility decomposition.
 * - Add explicit link to legislation outcomes for CampaignPhaseState.
 * - Introduce endorsement decay model with time-based attenuation.
 */

// ===================== FOUNDATION TYPES (RE-EXPORTS & EXTENSIONS) =====================
/**
 * Re-exports selected foundational political domain primitives defined in
 * `src/politics/types/politicsTypes.ts` to avoid duplication while providing
 * a single canonical barrel for political systems. Aliases applied where
 * naming collisions would otherwise occur (e.g. CampaignPhase enum vs interface).
 */
// Runtime enums (value exports)
export { PoliticalOfficeLevel, PoliticalOfficeKind } from '../../politics/types/politicsTypes';
// Type-only re-exports (isolatedModules safe)
export type {
  PoliticalOffice,
  Campaign as CampaignOverview,
  ElectionCycle,
  InfluenceRecord,
  LobbyingAction,
  LegislationSkeleton,
  EndorsementStub,
  CrisisEventStub,
  AutopilotProfile,
  OfflineSnapshot,
  AutopilotStrategy
} from '../../politics/types/politicsTypes';

import type { OfflineSnapshot } from '../../politics/types/politicsTypes';

/** Legislative status lifecycle for baseline tracking */
export enum LegislationStatus {
  DRAFT = 'DRAFT',
  COMMITTEE = 'COMMITTEE',
  FLOOR = 'FLOOR',
  VOTE_PENDING = 'VOTE_PENDING',
  PASSED = 'PASSED',
  FAILED = 'FAILED'
}

/**
 * Legislation record (baseline). Extended form of LegislationSkeleton with
 * lifecycle state and scheduling metadata. Advanced lobbying modifiers deferred
 * to later phases. Percent values expressed in whole percentages.
 */
export interface Legislation {
  id: string;
  title: string;
  summary: string;
  originatingBody: 'House' | 'Senate' | 'StateLegislature';
  status: LegislationStatus;
  introducedWeek: number;          // GameWeekIndex numeric week
  statusUpdatedWeek: number;       // Last week status changed
  sponsorshipCount: number;        // Count of sponsors (players/orgs) backing
  influenceThresholdPercent: number; // Percent influence required to advance
  currentInfluencePercent: number;   // Current accumulated influence percent
  seed: string;                    // Deterministic seed for advancement/resolution rolls
  schemaVersion: 1;
}

/**
 * Extended endorsement placeholder bridging EndorsementStub and EndorsementRecord
 * without adding advanced decay logic (deferred). Provides minimal join fields for
 * early aggregation routines.
 */
export interface Endorsement {
  id: string;
  playerId: string;                // Candidate player
  fromEntityId: string;            // Organization/person source
  acquiredEpoch: number;           // Acquisition timestamp
  tier?: EndorsementTier;          // Optional mapping to advanced record tier
  basePowerPercent: number;        // Raw power before diminishing returns
  seed: string;                    // Deterministic acquisition seed
  schemaVersion: 1;
}

/**
 * Crisis event placeholder (baseline). Advanced resolution & cascading impact
 * mechanics deferred. Severity is categorical externally; internal systems may
 * map to continuous scale later.
 */
export interface CrisisEvent {
  id: string;
  severity: 'minor' | 'medium' | 'major' | 'annual';
  affectedStateCode?: string;
  triggeredEpoch: number;          // Real-world epoch when event logged
  gameWeek: number;                // Corresponding GameWeekIndex at trigger
  influenceImpactPercent?: number; // Optional immediate influence hit
  reputationImpactPercent?: number;// Optional reputation hit
  seed: string;                    // Deterministic generation seed
  schemaVersion: 1;
}

/**
 * Offline snapshot extension ensuring clamp boundaries can be validated against
 * baseline influence & reputation values at capture time.
 */
export interface OfflineSnapshotExtended extends OfflineSnapshot {
  capturedEpoch: number;           // Real-world epoch mirror of capturedAtMs
  influenceAtCapture: number;      // Composite influence prior to offline processing
  reputationAtCapture: number;     // Reputation prior to offline processing
  schemaVersion: 1;
}

// ===================== END FOUNDATION TYPES =====================
