"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementStatus = exports.TelemetryEventType = exports.AchievementRewardType = exports.AchievementCategory = void 0;
// Re-export AchievementCategory so Phase 7 engine/importers can consume from this barrel
var politics_1 = require("./politics");
Object.defineProperty(exports, "AchievementCategory", { enumerable: true, get: function () { return politics_1.AchievementCategory; } });
// ===================== ENUMS =====================
/** Reward application semantics for unlocked achievements */
var AchievementRewardType;
(function (AchievementRewardType) {
    AchievementRewardType["INFLUENCE"] = "INFLUENCE";
    AchievementRewardType["FUNDRAISING_EFFICIENCY"] = "FUNDRAISING_EFFICIENCY";
    AchievementRewardType["REPUTATION_RESTORE"] = "REPUTATION_RESTORE";
    AchievementRewardType["TITLE_UNLOCK"] = "TITLE_UNLOCK";
    AchievementRewardType["BADGE_UNLOCK"] = "BADGE_UNLOCK"; // Unlock a visible badge artifact
})(AchievementRewardType || (exports.AchievementRewardType = AchievementRewardType = {}));
/**
 * Telemetry event taxonomy for Phase 7. Each variant should map to a Zod
 * schema (see `src/lib/schemas/politicsPhase7Telemetry.ts`).
 */
var TelemetryEventType;
(function (TelemetryEventType) {
    TelemetryEventType["CAMPAIGN_PHASE_CHANGE"] = "CAMPAIGN_PHASE_CHANGE";
    TelemetryEventType["DEBATE_RESULT"] = "DEBATE_RESULT";
    TelemetryEventType["ENDORSEMENT"] = "ENDORSEMENT";
    TelemetryEventType["BILL_VOTE"] = "BILL_VOTE";
    TelemetryEventType["POLICY_ENACTED"] = "POLICY_ENACTED";
    TelemetryEventType["LOBBY_ATTEMPT"] = "LOBBY_ATTEMPT";
    TelemetryEventType["MOMENTUM_SHIFT"] = "MOMENTUM_SHIFT";
    TelemetryEventType["POLL_INTERVAL"] = "POLL_INTERVAL";
    TelemetryEventType["SYSTEM_BALANCE_APPLIED"] = "SYSTEM_BALANCE_APPLIED";
})(TelemetryEventType || (exports.TelemetryEventType = TelemetryEventType = {}));
/** Achievement lifecycle status (derived, not stored on definition) */
var AchievementStatus;
(function (AchievementStatus) {
    AchievementStatus["LOCKED"] = "LOCKED";
    AchievementStatus["UNLOCKED"] = "UNLOCKED";
    AchievementStatus["CLAIMED"] = "CLAIMED";
})(AchievementStatus || (exports.AchievementStatus = AchievementStatus = {}));
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
//# sourceMappingURL=politicsPhase7.js.map