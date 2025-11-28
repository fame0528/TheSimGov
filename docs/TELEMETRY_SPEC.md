# Telemetry & Aggregation Specification (Phase 7)
**Date:** 2025-11-28  
**Status:** COMPLETE  
**Owner:** FID-20251125-001C (Phase 7 segment)  
**ECHO Compliance:** ✅ Complete with dual-loading, types-first implementation, full test coverage  
**Tests:** 436/436 passing (full suite validation)

---
## 1. Overview
Telemetry system captures deterministic game events (politics domain) to power achievement evaluation, player dashboards, fairness audits, and longitudinal analytics. All events structured, validated via Zod discriminated unions, with versioned schemas for forward compatibility.

### Implementation Files
| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/types/politicsPhase7.ts` | Type contracts (enums, interfaces) | 251 |
| `src/lib/schemas/politicsPhase7Telemetry.ts` | Zod validation schemas | 252 |
| `src/lib/utils/politics/achievements.ts` | Achievement engine | ~200 |

### Goals ✅ ACHIEVED
- ✅ Uniform event taxonomy via `TelemetryEventType` enum (9 event types)
- ✅ Strict validation via Zod discriminated unions
- ✅ Schema versioning (`schemaVersion: 1`) for migrations
- ✅ Achievement system integration via event triggers

### Non-Goals (Deferred)
- Real-time streaming UI (Phase 7 provides audit trail; WebSocket streaming future)
- Cross-industry telemetry (politics-only for MVP; expansion in Phase 2+)

---
## 2. Event Taxonomy (Implemented)

### TelemetryEventType Enum
```typescript
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
```

### Event Details Matrix
| Code | Name | Purpose | Payload Fields | Cardinality |
|------|------|---------|----------------|-------------|
| `CAMPAIGN_PHASE_CHANGE` | Campaign Phase Transition | Track FSM state progression | `fromPhase`, `toPhase`, `cycleSequence` | Moderate |
| `DEBATE_RESULT` | Debate Scoring | Debate outcome metrics | `debateId`, `performanceScore`, `pollShiftImmediatePercent` | Low |
| `ENDORSEMENT` | Endorsement Action | Strategic alliance tracking | `endorsementId`, `tier`, `influenceBonusPercent` | Low |
| `BILL_VOTE` | Legislative Vote Cast | Vote tracking | `legislationId`, `vote` (FOR/AGAINST/ABSTAIN), `outcome` | High bursts |
| `POLICY_ENACTED` | Policy Effect Applied | System change tracking | `policyCode`, `impactPercent` | Low |
| `LOBBY_ATTEMPT` | Lobbying Action Attempt | Probability success metrics | `legislationId`, `success`, `influenceAppliedPercent` | High |
| `MOMENTUM_SHIFT` | Momentum State Change | Fairness & trend analysis | `previousMomentumIndex`, `newMomentumIndex`, `delta` | Moderate |
| `POLL_INTERVAL` | Polling Interval Snapshot | Trend & probability modeling | `finalSupportPercent`, `volatilityAppliedPercent`, `reputationScore` | High |
| `SYSTEM_BALANCE_APPLIED` | Dynamic Balance Adjustment | Fairness transparency | `underdogBuffAppliedPercent?`, `frontrunnerPenaltyAppliedPercent?`, `fairnessFloorPercent` | Moderate |

---
## 3. Event Payload Structure (Implemented)

### Base Event Interface
```typescript
export interface TelemetryEventBase {
  id: string;                 // Event ID (unique)
  playerId: string;           // Subject player (never AI)
  createdEpoch: number;       // Unix epoch seconds
  type: TelemetryEventType;   // Discriminator
  schemaVersion: 1;           // Literal version for migrations
}
```

### Discriminated Union (Full Implementation)
```typescript
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
```

### Zod Validation Schema
```typescript
// Discriminated union for runtime validation
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
```

### Enqueue Schemas (Input Validation)
Separate enqueue schemas strip auto-generated fields (`id`, `createdEpoch`, `schemaVersion`) for external API input validation.

---
## 4. Achievements System (Implemented)

### Achievement Enums
```typescript
export enum AchievementRewardType {
  INFLUENCE = 'INFLUENCE',
  FUNDRAISING_EFFICIENCY = 'FUNDRAISING_EFFICIENCY',
  REPUTATION_RESTORE = 'REPUTATION_RESTORE',
  TITLE_UNLOCK = 'TITLE_UNLOCK',
  BADGE_UNLOCK = 'BADGE_UNLOCK'
}

export enum AchievementStatus {
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
  CLAIMED = 'CLAIMED'
}
```

### Achievement Definition Interface
```typescript
export interface AchievementDefinition {
  id: string;                              // Stable identifier (e.g. ACH_FIRST_CAMPAIGN)
  category: AchievementCategory;           // Reuse political subsystem categories
  title: string;                           // Display title
  description: string;                     // Player-facing description
  criteria: AchievementCriteriaExpression; // Structured rule
  reward: AchievementReward;               // Reward payload
  repeatable: boolean;                     // Can be earned more than once?
  maxRepeats?: number;                     // Optional cap for repeatables
  schemaVersion: 1;                        // Literal version
}
```

### Criteria Expression DSL
```typescript
export interface AchievementCriteriaExpression {
  metric: string;        // Metric key (e.g. cyclesCompleted, electionsWon)
  comparison: '>=' | '>' | '<=' | '<' | '==' | '!=';
  value: number;         // Threshold value
  window?: 'CURRENT_CYCLE' | 'LIFETIME';
}
```

### Progress Tracking
```typescript
export interface AchievementProgressSnapshot {
  playerId: string;
  total: number;              // Total definitions
  unlocked: number;           // Count unlocked
  claimed: number;            // Count claimed
  pendingIds: string[];       // Still locked
  entries: AchievementProgressEntry[];
  schemaVersion: 1;
}
```

---
## 5. Persistence & Retention (Planned)

### Retention Policy
| Data Type | TTL | Purpose |
|-----------|-----|---------|
| Raw Events | 14 days | Immediate analysis, debugging |
| Daily Aggregates | 180 days | Trend analysis, player dashboards |
| Weekly Aggregates | 365 days | Historical reporting, fairness audits |

### Index Strategy
```javascript
// Recommended compound indexes for query patterns
{ type: 1, createdEpoch: 1 }              // Chronological event scans
{ playerId: 1, type: 1, createdEpoch: 1 } // Player-specific queries
{ achievementId: 1, status: 1 }           // Achievement unlock lookups
```

---
## 6. Event Ingestion Flow (Design)

```
1. API/Engine triggers logEvent(payload)
          ↓
2. Validate with TelemetryEventSchema (Zod discriminated union)
          ↓
3. Normalize: add id, createdEpoch, schemaVersion
          ↓
4. Persist to TelemetryEvent collection
          ↓
5. Emit internal event for achievement evaluation
          ↓
6. Achievement engine checks criteria against player progress
```

### Idempotency
- Optional `eventId` field; if provided and duplicate detected → skip insert
- Server generates UUID if no eventId supplied

---
## 7. APIs (Status)
| Endpoint | Method | Purpose | Auth | Status |
|----------|--------|---------|------|--------|
| `/api/politics/telemetry/events` | GET | Raw event stream | Auth | PLANNED |
| `/api/politics/telemetry/stats` | GET | Aggregated metrics | Auth | PLANNED |
| `/api/politics/achievements` | GET | Achievement definitions | Auth | PLANNED |
| `/api/politics/achievements/progress` | GET | Player progress | Auth | PLANNED |
| `/api/politics/achievements/redeem` | POST | Claim rewards | Auth | PLANNED |

**Note:** API endpoints deferred to UI integration phase. Types and schemas complete.

---
## 8. Query Patterns & Performance

### High-Volume Events
- `BILL_VOTE` - burst during legislative sessions
- `POLL_INTERVAL` - periodic snapshots
- `LOBBY_ATTEMPT` - player-driven actions

### Index Recommendations
```javascript
// Primary compound indexes
db.telemetryEvents.createIndex({ type: 1, createdEpoch: 1 })
db.telemetryEvents.createIndex({ playerId: 1, type: 1, createdEpoch: 1 })

// Achievement indexes
db.achievementUnlocks.createIndex({ playerId: 1, status: 1 })
db.achievementUnlocks.createIndex({ achievementId: 1, unlockedEpoch: 1 })
```

---
## 9. Fairness & Audit Integration (Phase 9)

### Offline Audit Events
Phase 9 extended telemetry with audit instrumentation:

```typescript
export interface OfflineAuditEvent {
  eventType: 'FAIRNESS_FLOOR_APPLIED' | 'DIVERGENCE_DETECTED' | 'PROBABILITY_CAPPED' | 'RETROACTIVE_ADJUSTMENT';
  playerId: string;
  companyId?: string;
  timestamp: number;
  details: {
    floorApplied?: number;
    divergencePercent?: number;
    originalProbability?: number;
    adjustedProbability?: number;
    reason: string;
  };
  schemaVersion: 1;
}
```

### Divergence Analysis
```typescript
export interface DivergenceAnalysis {
  totalChecks: number;
  divergentChecks: number;
  divergenceRate: number;  // 0-1 percentage
  averageDivergencePercent: number;
  maxDivergencePercent: number;
  recommendations: string[];
}
```

### Audit Functions
- `generateFloorAuditEvent()` - Creates audit trail for fairness floor applications
- `analyzeDivergence()` - Computes divergence statistics from audit events
- `batchAuditEvents()` - Efficiently batch audit events (configurable batch size)

---
## 10. Privacy & Compliance

- Store only required identifiers (playerId)
- No sensitive personal attributes in telemetry payloads
- TTL ensures automatic purging of stale raw data
- Schema versioning enables GDPR-compliant data evolution

---
## 11. Test Coverage

### Validation Tests
- ✅ TelemetryEventSchema discriminated union validates all 9 event types
- ✅ AchievementDefinitionSchema validates criteria expressions
- ✅ AchievementUnlockSchema validates lifecycle states
- ✅ Enqueue schemas validate external input (stripped fields)

### Phase 9 Audit Tests (18 tests)
- ✅ `generateFloorAuditEvent()` creates valid audit events
- ✅ `analyzeDivergence()` computes correct statistics
- ✅ `batchAuditEvents()` handles batching correctly
- ✅ Edge cases: empty arrays, single events, threshold boundaries

---
## 12. Implementation Status

| Component | Status | Location |
|-----------|--------|----------|
| TelemetryEventType enum | ✅ COMPLETE | `src/lib/types/politicsPhase7.ts` |
| Event interfaces (9 types) | ✅ COMPLETE | `src/lib/types/politicsPhase7.ts` |
| Zod validation schemas | ✅ COMPLETE | `src/lib/schemas/politicsPhase7Telemetry.ts` |
| Achievement types | ✅ COMPLETE | `src/lib/types/politicsPhase7.ts` |
| Achievement schemas | ✅ COMPLETE | `src/lib/schemas/politicsPhase7Telemetry.ts` |
| Audit instrumentation | ✅ COMPLETE | `src/lib/utils/politics/offlineProtection.ts` |
| API endpoints | 🔴 PLANNED | Deferred to UI phase |
| Aggregation pipeline | 🔴 PLANNED | Deferred to analytics phase |

---
## 13. Future Enhancements

- WebSocket event stream with client-side filtering
- Cross-domain telemetry (media, energy) unification
- Advanced anomaly detection (suspicious rate spikes)
- Real-time achievement unlock notifications
- Leaderboard integration via aggregated metrics

---
## 14. ECHO Compliance

- ✅ Types-first implementation (politicsPhase7.ts before schemas)
- ✅ Zod validation for all event types
- ✅ DRY: Shared base interfaces, reused AchievementCategory
- ✅ Schema versioning for forward compatibility
- ✅ Complete test coverage for validation layer

---
## 15. References

- Types: `src/lib/types/politicsPhase7.ts`
- Schemas: `src/lib/schemas/politicsPhase7Telemetry.ts`
- Achievements: `src/lib/utils/politics/achievements.ts`
- Offline Audit: `src/lib/utils/politics/offlineProtection.ts`
- Tests: `tests/politics/phase7Telemetry.test.ts`, `tests/politics/offlineAuditPhase9.test.ts`

---
**Footer:** Phase 7 Telemetry & Achievements - COMPLETE  
**Last Updated:** 2025-11-28  
**Test Status:** 436/436 passing
