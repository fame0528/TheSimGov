# Phase 7 Preliminary Backend–Frontend Contract Matrix
**Date:** 2025-11-27  
**Status:** PLANNED (Pre-Dual-Loading)  
**Scope:** Achievements & Telemetry MVP  
**Note:** All endpoints/components marked PLANNED; implementation blocked until dual-loading verification & full schema finalization.

---
## 1. Endpoints Overview
| Endpoint | Method | Purpose | Request Params / Body | Response (Envelope Data) | Auth | Status | Notes |
|----------|--------|---------|-----------------------|---------------------------|------|--------|-------|
| /api/politics/achievements | GET | List achievement definitions + progress snapshot | query: category?, ids? | { achievements: AchievementView[] } | Required | PLANNED | Uses progress precompute; includes percent & reward summary |
| /api/politics/achievements/progress | GET | Focused progress for selected achievements | query: ids (CSV) | { progress: AchievementProgressView[] } | Required | PLANNED | For dynamic UI refresh |
| /api/politics/achievements/redeem | POST | Optional manual reward redemption | body: { achievementId } | { redeemed: boolean, rewardEffect?: AppliedReward } | Required | PLANNED | Only for non-auto rewards (maybe removed if all auto) |
| /api/politics/telemetry/events | GET | Filtered raw telemetry events | query: type?, companyId?, userId?, from, to, page, pageSize | { events: TelemetryEventDTO[], page, pageSize, total? } | Required | PLANNED | Pagination caps enforced (e.g. pageSize ≤ 100) |
| /api/politics/telemetry/stats | GET | Aggregated telemetry metrics | query: type?, scope=user|company, from, to, granularity=daily|weekly | { stats: TelemetryAggregateDTO[] } | Required | PLANNED | Derived metrics: successRate, volatility |

Envelope Standard:
```json
{ "ok": true, "data": { ... }, "meta": { ... } }
```
Error Standard:
```json
{ "ok": false, "error": { "code": string, "message": string } }
```

---
## 2. Planned UI Components
| Component | Purpose | Backend Dependencies | Data Needed | Status | Notes |
|-----------|---------|----------------------|-------------|--------|-------|
| AchievementsPanel | Display list, progress bars, filters | achievements GET, progress GET | AchievementView[], progress percentages | PLANNED | Reuse existing panel styling conventions |
| AchievementToast | Ephemeral unlock notification | achievements GET (definition), internal event bus | { title, rewardSummary } | PLANNED | Triggered on unlock event |
| TelemetryDashboard | Charts & stats (daily/weekly) | telemetry/stats GET | Aggregates + computed deltas | PLANNED | Client transforms for charts (no heavy calc server-side) |
| EventStreamViewer | Paginated event list with filters | telemetry/events GET | TelemetryEventDTO[] | PLANNED | Consider virtualization for large lists |

---
## 3. Data Contracts (Draft)
### AchievementView
```ts
{
  id: string;
  category: string; // enum AchievementCategory
  name: string;
  description: string;
  reward: { type: RewardType; value?: number; durationSeconds?: number; titleId?: string };
  progress?: { percent: number; current: number; target: number };
  unlocked: boolean;
  unlockedAt?: string;
}
```
### AchievementProgressView
```ts
{
  achievementId: string;
  percent: number;
  current: number;
  target: number;
  nextIncrementHint?: string;
}
```
### TelemetryEventDTO (union placeholder)
```ts
{
  id: string;
  type: TelemetryEventType; // enum
  createdAt: string;
  companyId?: string;
  userId?: string;
  payload: Record<string, unknown>; // narrowed after Zod union finalization
}
```
### TelemetryAggregateDTO
```ts
{
  type: TelemetryEventType;
  scope: "USER" | "COMPANY";
  scopeId?: string; // userId or companyId
  periodStart: string;
  granularity: "DAILY" | "WEEKLY";
  count: number;
  distinctUsers?: number;
  successRate?: number; // for events with success boolean
  avgValue?: number; // optional numeric field average
  minValue?: number;
  maxValue?: number;
  volatility?: number; // stdDev / mean
}
```
### AppliedReward
```ts
{
  achievementId: string;
  appliedAt: string;
  effects: { influenceMultiplier?: number; reputationRestored?: number; efficiencyMultiplier?: number; titleGranted?: string };
  expiresAt?: string;
}
```

---
## 4. Validation & Zod Mapping (To Be Finalized)
- Each endpoint response will reference concrete Zod schemas (no generic Record types post-implementation).
- TelemetryEventDTO.payload replaced by discriminated union typed object.
- AchievementView.reward will narrow value fields based on RewardType (conditional refinement).

---
## 5. Status & Coverage Summary
- Endpoints Planned: 5/5 (0 implemented) → 0% backend coverage.
- Components Planned: 4/4 (0 implemented) → 0% frontend coverage.
- Data Structures Drafted: AchievementView, TelemetryEventDTO, TelemetryAggregateDTO, AppliedReward.
- Blocking Tasks: Final enums & Zod schemas; model indexes; dual-loading actual file set once types stubbed.

Go/No-Go: NO (insufficient contract verification). Proceed only after Types & Schemas + dual-loading execution.

---
## 6. Next Contract Steps
1. Finalize enums & discriminated unions.
2. Add Zod schema file mapping each DTO.
3. Re-run matrix with "Status" column updated to PLANNED/IMPLEMENTED as coding progresses.
4. Add error codes catalog (e.g., ACHIEVEMENT_NOT_FOUND, DUPLICATE_REDEEM, TELEMETRY_RANGE_INVALID).

---
## 7. ECHO Compliance Footnotes
- Matrix created before implementation (planning requirement ✅).
- Will execute dual-loading protocol for achievements & telemetry directories once initial model/type files exist.
- DRY preserved: single DTO definitions reused across endpoints & UI.

---
**Footer:** Preliminary matrix only; all shapes subject to refinement after schemas finalized.
