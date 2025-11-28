"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegislationStatus = exports.PoliticalOfficeKind = exports.PoliticalOfficeLevel = exports.TrendDirection = exports.LeaderboardMetricType = exports.AchievementCategory = exports.EndorsementTier = exports.EndorsementSourceCategory = exports.ScandalStatus = exports.ScandalCategory = exports.CampaignPhase = void 0;
// ===================== ENUMERATIONS =====================
/** Campaign lifecycle discrete phases (26h accelerated cycle) */
var CampaignPhase;
(function (CampaignPhase) {
    CampaignPhase["FUNDRAISING"] = "FUNDRAISING";
    CampaignPhase["LOBBYING"] = "LOBBYING";
    CampaignPhase["PUBLIC_RELATIONS"] = "PUBLIC_RELATIONS";
    CampaignPhase["DEBATE_PREP"] = "DEBATE_PREP";
    CampaignPhase["DEBATE"] = "DEBATE";
    CampaignPhase["POST_DEBATE"] = "POST_DEBATE";
    CampaignPhase["ELECTION"] = "ELECTION"; // Vote tally mechanics
})(CampaignPhase || (exports.CampaignPhase = CampaignPhase = {}));
/** Categories of scandals impacting reputation */
var ScandalCategory;
(function (ScandalCategory) {
    ScandalCategory["FINANCIAL"] = "FINANCIAL";
    ScandalCategory["ETHICS"] = "ETHICS";
    ScandalCategory["COMPLIANCE"] = "COMPLIANCE";
    ScandalCategory["SECURITY"] = "SECURITY";
    ScandalCategory["OPERATIONS"] = "OPERATIONS";
})(ScandalCategory || (exports.ScandalCategory = ScandalCategory = {}));
/** Scandal lifecycle status */
var ScandalStatus;
(function (ScandalStatus) {
    ScandalStatus["DISCOVERED"] = "DISCOVERED";
    ScandalStatus["INVESTIGATING"] = "INVESTIGATING";
    ScandalStatus["CONTAINED"] = "CONTAINED";
    ScandalStatus["RESOLVED"] = "RESOLVED"; // Recovery phase only
})(ScandalStatus || (exports.ScandalStatus = ScandalStatus = {}));
/** Endorsement source category */
var EndorsementSourceCategory;
(function (EndorsementSourceCategory) {
    EndorsementSourceCategory["INDUSTRY_ASSOCIATION"] = "INDUSTRY_ASSOCIATION";
    EndorsementSourceCategory["REGIONAL_BUSINESS_GROUP"] = "REGIONAL_BUSINESS_GROUP";
    EndorsementSourceCategory["INFLUENTIAL_FOUNDER"] = "INFLUENTIAL_FOUNDER";
    EndorsementSourceCategory["MEDIA_OUTLET"] = "MEDIA_OUTLET";
    EndorsementSourceCategory["POLICY_THINK_TANK"] = "POLICY_THINK_TANK";
})(EndorsementSourceCategory || (exports.EndorsementSourceCategory = EndorsementSourceCategory = {}));
/** Endorsement tier for diminishing returns calculation */
var EndorsementTier;
(function (EndorsementTier) {
    EndorsementTier["MINOR"] = "MINOR";
    EndorsementTier["STANDARD"] = "STANDARD";
    EndorsementTier["MAJOR"] = "MAJOR";
    EndorsementTier["FLAGSHIP"] = "FLAGSHIP";
})(EndorsementTier || (exports.EndorsementTier = EndorsementTier = {}));
/** Achievement category (political subsystem specific) */
var AchievementCategory;
(function (AchievementCategory) {
    AchievementCategory["FUNDRAISING"] = "FUNDRAISING";
    AchievementCategory["LOBBYING"] = "LOBBYING";
    AchievementCategory["REPUTATION"] = "REPUTATION";
    AchievementCategory["DEBATE"] = "DEBATE";
    AchievementCategory["LEGISLATION"] = "LEGISLATION";
    AchievementCategory["ENDORSEMENTS"] = "ENDORSEMENTS";
})(AchievementCategory || (exports.AchievementCategory = AchievementCategory = {}));
/** Leaderboard metric types (player competitive surfaces) */
var LeaderboardMetricType;
(function (LeaderboardMetricType) {
    LeaderboardMetricType["INFLUENCE"] = "INFLUENCE";
    LeaderboardMetricType["FUNDRAISING"] = "FUNDRAISING";
    LeaderboardMetricType["REPUTATION"] = "REPUTATION";
    LeaderboardMetricType["DEBATE_SCORE"] = "DEBATE_SCORE";
    LeaderboardMetricType["LEGISLATION_PASSED"] = "LEGISLATION_PASSED";
    LeaderboardMetricType["ENDORSEMENT_POWER"] = "ENDORSEMENT_POWER"; // Aggregate adjusted endorsement value
})(LeaderboardMetricType || (exports.LeaderboardMetricType = LeaderboardMetricType = {}));
/** Direction of trend for leaderboard entry */
var TrendDirection;
(function (TrendDirection) {
    TrendDirection["UP"] = "UP";
    TrendDirection["DOWN"] = "DOWN";
    TrendDirection["STABLE"] = "STABLE";
})(TrendDirection || (exports.TrendDirection = TrendDirection = {}));
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
var politicsTypes_1 = require("../../politics/types/politicsTypes");
Object.defineProperty(exports, "PoliticalOfficeLevel", { enumerable: true, get: function () { return politicsTypes_1.PoliticalOfficeLevel; } });
Object.defineProperty(exports, "PoliticalOfficeKind", { enumerable: true, get: function () { return politicsTypes_1.PoliticalOfficeKind; } });
/** Legislative status lifecycle for baseline tracking */
var LegislationStatus;
(function (LegislationStatus) {
    LegislationStatus["DRAFT"] = "DRAFT";
    LegislationStatus["COMMITTEE"] = "COMMITTEE";
    LegislationStatus["FLOOR"] = "FLOOR";
    LegislationStatus["VOTE_PENDING"] = "VOTE_PENDING";
    LegislationStatus["PASSED"] = "PASSED";
    LegislationStatus["FAILED"] = "FAILED";
})(LegislationStatus || (exports.LegislationStatus = LegislationStatus = {}));
// ===================== END FOUNDATION TYPES =====================
//# sourceMappingURL=politics.js.map