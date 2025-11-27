# Telemetry & Aggregation Specification (Phase 7)
**Date:** 2025-11-27  
**Status:** SKELETON (Planning)  
**Owner:** FID-20251125-001C (Phase 7 segment)  
**ECHO Compliance:** Complete planning before implementation; dual-loading pending.

---
## 1. Overview
Telemetry system captures deterministic game events (politics domain) to power achievement evaluation, player dashboards, fairness audits, and longitudinal analytics. All events structured, validated, persisted with retention & rollup strategy. No PII beyond necessary player identifiers.

### Goals
- Uniform event taxonomy (no ad hoc logging).
- Low-latency ingestion (<10ms typical).
- Efficient aggregation (daily/weekly rollups).
- Supports progression, fairness checks, future anti-abuse heuristics.

### Non-Goals
- Real-time streaming UI (Phase 7 provides basic viewer; advanced streaming later).
- Cross-industry telemetry beyond initial politics set (future expansion).

---
## 2. Event Taxonomy (Initial Set)
| Code | Name | Purpose | Cardinality | Notes |
|------|------|---------|-------------|-------|
| CAMPAIGN_PHASE_CHANGE | Campaign Phase Transition | Track campaign progression cycles | Moderate | Includes phaseFrom, phaseTo, timestamp |
| DEBATE_RESULT | Debate Scoring | Debate outcome metrics | Low | persuasionScore, participantIds |
| ENDORSEMENT | Endorsement Action | Strategic alliance formation | Low | fromCompanyId, toCompanyId, boost, credibilityImpact |
| BILL_VOTE | Legislative Vote Cast | Vote tracking & lobby payments | High bursts | billId, stance, seatWeight, lobbyPaymentsCount |
| POLICY_ENACTED | Policy Effect Applied | System change tracking | Low | policyId, effectTypes[], scope |
| LOBBY_ATTEMPT | Lobbying Action Attempt | Probability success metrics | High | difficultyTier, success, spend, breakdown |
| MOMENTUM_SHIFT | Momentum State Change | Fairness & trend analysis | Moderate | stateCode?, momentumFrom, momentumTo |
| POLL_INTERVAL | Polling Interval Snapshot | Trend & probability modeling | High | pollId, leadingCandidate, margin, moe |
| SYSTEM_BALANCE_APPLIED | Dynamic Balance Adjustment | Fairness scaler transparency | Moderate | pollId, underdogBuff, frontrunnerPenalty, capCompressed |

(Additional events may be appended post schema sign-off.)

---
## 3. Event Payload Structure (Planned Zod Schemas)
Strategy: Discriminated union keyed by `type`.
- Base fields: { type: TelemetryEventType, userId?, companyId?, createdAt, metaVersion }
- Each subtype extends base with domain-specific fields.

Example Outline:
```ts
const TelemetryEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('CAMPAIGN_PHASE_CHANGE'), campaignId: z.string(), phaseFrom: z.string(), phaseTo: z.string() }),
  z.object({ type: z.literal('DEBATE_RESULT'), debateId: z.string(), persuasionScore: z.number(), participants: z.array(z.string()) }),
  // ... etc
]);
```
Validation Goals:
- Strict typing (reject unknown fields).
- Meta versioning for forward-compatible migrations.

---
## 4. Persistence Models (Planned)
- TelemetryEvent (TTL index: expires raw after 14d)
  - Indexes: (type, createdAt), (companyId, type, createdAt), (userId, type, createdAt)
- TelemetryAggregate
  - Granularity: DAILY, WEEKLY
  - Metrics: count, distinctUsers, successRate?, avgValue?, stdDev?, min, max
  - Composite hash: { periodStart + type + companyId? + userId? }

Retention Policy:
- Raw Events: 14 days
- Daily Aggregates: 180 days
- Weekly Aggregates: 365 days (optional for historical dashboards)

---
## 5. Aggregation Pipeline
Process (Daily):
1. Query raw events for period.
2. Group by (type + scope).
3. Compute metrics (count, distinct sets, min/max, avg, variance).
4. Upsert TelemetryAggregate.

Weekly: roll up precomputed daily aggregates → reduces raw reads.

Performance Tips:
- Use projection to minimize document size in aggregation.
- Avoid scanning older partitions (Mongo TTL ensures pruning).

---
## 6. Event Ingestion Flow
1. API or internal service triggers logEvent(data).
2. Validate payload with discriminated union.
3. Normalize (add createdAt, metaVersion, derived fields if needed).
4. Insert into collection (ordered write). Retry on transient errors.
5. Emit internal bus event for achievement evaluation.

Idempotency: Optional eventId field; if supplied and duplicate detected → skip insert.

---
## 7. APIs (Planned)
| Endpoint | Method | Purpose | Auth | Filters | Pagination | Status |
|----------|--------|---------|------|---------|-----------|--------|
| /api/politics/telemetry/events | GET | Raw event stream (filtered) | Auth | type, companyId, userId, from, to | page/pageSize | PLANNED |
| /api/politics/telemetry/stats  | GET | Aggregated metrics snapshot | Auth | type, scope(company|user), period(from,to) | none | PLANNED |
| /api/politics/achievements     | GET | Achievement definitions + progress | Auth | category?, ids? | none | PLANNED |
| /api/politics/achievements/progress | GET | Focused progress | Auth | achievementId(s) | none | PLANNED |
| /api/politics/achievements/redeem | POST | Redeem optional manual rewards | Auth | achievementId | n/a | PLANNED |

Response Envelope Standard:
```json
{ "ok": true, "data": { /* domain */ }, "meta": { /* paging or period */ } }
```
Errors follow unified formatter.

---
## 8. Indices & Query Patterns
High-volume: BILL_VOTE, POLL_INTERVAL, LOBBY_ATTEMPT.
Compound Index Strategy:
- (type, createdAt) for chronological scans.
- (companyId, type, createdAt) for organization-level dashboards.
- (userId, type, createdAt) for player progress queries.
Aggregation pre-filters rely on these indices for date-ranged scans.

---
## 9. Fairness & Anti-Abuse
- Reject out-of-order timestamps (future > now + tolerance).
- Rate-limit high-volume event sources per user (e.g. LOBBY_ATTEMPT bursts).
- Validate seatWeight & billId existence on BILL_VOTE.
- Momentum shifts require legitimate margin change proof (cross-reference existing polling snapshot).

---
## 10. Privacy & Compliance
- Store only required identifiers (userId/companyId).
- No sensitive personal attributes added to telemetry payloads.
- TTL ensures automatic purging of stale raw data.

---
## 11. Acceptance Criteria (Initial)
- All planned endpoints have contract matrix entries before implementation.
- TelemetryEvent discriminated union passes strict validation (100% typed coverage in tests).
- Aggregation job completes daily under target duration (< 2s for expected early volume).
- Achievement evaluation pipeline < 15ms per event average.
- Zero duplicate raw events inserted when eventId provided.

---
## 12. Open Questions
- Do we need real-time WebSocket feed in MVP? (Deferred).
- Should weekly aggregates include percentile breakdowns? (Future refinement.)
- EventId mandatory or optional? (Probably optional; server can generate if absent.)

---
## 13. Roadmap Post-MVP
- WebSocket event stream with client-side filtering.
- Cross-domain telemetry (media, energy) unification.
- Advanced anomaly detection (suspicious rate spikes).

---
## 14. ECHO Compliance Footnotes
- Will execute dual-loading protocol before coding server + UI.
- Types & schemas precede endpoint handlers and components.
- DRY: aggregation metrics structure reused for both daily & weekly.

---
## 15. Next Steps
1. Finalize TelemetryEventType enum & Zod union.
2. Draft contract matrix file with structured table (reuse existing matrix formatting).
3. Implement Mongoose schemas (TelemetryEvent, TelemetryAggregate) with TTL & unique constraints.
4. Build logging utility + evaluation trigger.

---
**Footer:** Skeleton only; implementation details to follow in subsequent tasks.
