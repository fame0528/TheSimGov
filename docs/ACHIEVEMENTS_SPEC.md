# Achievements System Specification (Phase 7)
**Date:** 2025-11-27  
**Status:** SKELETON (Planning)  
**Owner:** FID-20251125-001C (Phase 7 segment)  
**ECHO Compliance:** Utility-first (types → models → utilities → APIs → UI), GUARDIAN active

---
## 1. Overview
Provide a player progression layer rewarding sustained political engagement, strategic performance, and fair-play behaviors (no RNG exploitation). Achievements unlock influence/reputation restorative rewards, efficiency modifiers, cosmetic titles. All unlock logic deterministic and event-driven (telemetry). No hidden probability.

### Primary Goals
- Encourage breadth (multiple campaign cycles, diverse action types).
- Reinforce fairness (no advantage from passive idling; requires telemetry-confirmed actions).
- Maintain transparency (UI shows criteria & progress percentages).
- Zero retroactive ambiguity (all telemetry since feature activation evaluates consistently).

### Non-Goals
- RNG-based surprise rewards.
- Pay-to-progress mechanics.
- Hidden criteria or opaque adjustment formulas.

---
## 2. Scope & Boundaries
IN: Achievement definitions, unlock evaluation, progress tracking, reward application, API & basic UI surfaces.
OUT (Deferred): Seasonal/competitive tiers, syndicate/shared achievements, cross-industry composite achievements.

---
## 3. Taxonomy
### Categories (initial set)
- CAMPAIGN: milestones tied to campaign participation & outcomes.
- DEBATE: performance thresholds (scores, streaks, persuasion caps).
- ENDORSEMENTS: count + strategic reciprocity usage.
- LEGISLATION: bill sponsorships passed, lobby payment impact metrics.
- LOBBYING: success streaks, high-difficulty probability wins.
- POLICY: enacted effects variety (distinct effect types, scopes).
- MOMENTUM: maintaining surging or reversing collapsing trends.
- FAIR_PLAY: zero scandals, compliance behaviors, timely participation.

### Reward Types
- INFLUENCE_BONUS (flat or % multiplier for next N actions)
- REPUTATION_RESTORE (restore X% reputation lost in last Y hours)
- EFFICIENCY_MULTIPLIER (reduce lobbying or donation decay cost for duration)
- TITLE_UNLOCK (cosmetic label displayed in panels)
- VISUAL_BADGE (UI-only marker; possible future expansion)

---
## 4. Data Structures (Planned)
(Exact TypeScript interfaces defined in Types & Schemas task.)
- AchievementDefinition: { id, category, tier?, name, description, criteria: CriteriaExpression, reward: RewardDefinition }
- CriteriaExpression: declarative structure referencing telemetry counters (e.g. { event: 'BILL_PASSED', count: { gte: 10 } })
- AchievementUnlock: { userId, achievementId, unlockedAt, progressSnapshot, rewardApplied }
- AchievementProgress: { current, target, percent, lastEvaluated }
- Stored Telemetry Links: progress computed incrementally from aggregate snapshots.

---
## 5. Unlock Logic & Evaluation
Trigger Sources:
- Real-time evaluation on incoming telemetry events (low-cost predicate subsets).
- Periodic scheduler (e.g. every 5 real minutes) for aggregate-dependent criteria (weekly counts, streak validation).

Deterministic Algorithm Outline:
1. Ingest TelemetryEvent.
2. Update in-memory counters (company+user scope) or schedule aggregate recompute.
3. For each candidate achievement not yet unlocked: evaluate criteria tree.
4. If criteria satisfied: persist AchievementUnlock, apply reward atomically, enqueue toast.

Fairness Guards:
- No multi-counting: same event ID cannot increment multiple mutually exclusive criteria without explicit design.
- Race-safety: use Mongo unique compound index (userId + achievementId) to prevent duplicate unlock writes.

---
## 6. Reward Semantics
- Influence bonus: apply multiplier once or store ephemeral buff with expiry timestamp.
- Reputation restore: cap at pre-loss baseline; cannot exceed max reputation.
- Efficiency multiplier: track scope (lobbying/donations) + duration (game hours converted to real time).
- Titles / Badges: stored in profile; retrieval endpoint returns available + active selection.

Atomic Application Pattern:
- Use Mongo transaction or ordered writes: insert unlock → apply reward effect → emit event.

---
## 7. Progress Tracking
Each achievement exposes:
- Criteria Summary: textual breakdown
- Progress Percent: deterministic `min(current/target,1)`
- Next Milestone Hint: e.g. "Next at 25 successful high-difficulty lobbying attempts"
Caching Strategy: Precompute progress for most-active achievements; lazy compute on others.

---
## 8. APIs (Planned)
- GET /api/politics/achievements: list definitions + player progress.
- GET /api/politics/achievements/progress: focused progress snapshot (filter by category/id).
- POST /api/politics/achievements/redeem (OPTIONAL if some rewards claimable manually).
Response Envelope Standard: { ok: true, data: { achievements: AchievementView[] }, meta? }
Error Envelope: { ok: false, error: { code, message } }

---
## 9. Acceptance Criteria (Initial)
- 100% deterministic unlock evaluation; zero duplicate unlock writes.
- All reward applications idempotent & documented.
- Progress percent accurate within 1 event granularity.
- No blocking queries on hot path (event ingestion ≤ 10ms target average).
- Complete Zod validation on all API request/response payloads.
- UI shows at least 1 panel (AchievementsPanel) + 1 toast component.

---
## 10. Performance & Scaling Considerations
- Telemetry events expected high volume; achievements only evaluate targeted subset.
- Aggregation jobs time-sliced (avoid long blocking operations).
- Indexes: TelemetryEvent(userId, eventType, createdAt), AchievementUnlock(userId, achievementId unique), Aggregates(periodStart, userId, category).

---
## 11. Security & Fairness
- Prevent manual replay: event ingestion requires server authoritative context (no client forging raw achievements).
- Anti-exploit: streak achievements verify temporal spacing & distinct entity interactions where relevant.
- Transparency: criteria documentation shipped in this spec and UI details panel.

---
## 12. Open Questions
- Should influence bonuses stack or refresh? (Default: refresh higher tier, replace lower.)
- Manual redemption necessary? (If reward effect immediate, POST redeem can be deferred.)
- Title rarity classification needed in MVP? (Deferred.)

---
## 13. Roadmap (Beyond MVP)
- Seasonal achievement resets.
- Cross-domain meta achievements (politics + media synergy).
- Player-to-player comparison / brag boards.

---
## 14. ECHO Compliance Footnotes
- Utility-first: definitions & types before UI.
- DRY: criteria expression reused across evaluation & progress endpoints.
- Dual-loading: contract matrix required before implementing listed APIs & components.

---
## 15. Next Steps
1. Finalize Telemetry event taxonomy.
2. Define TypeScript enums & Zod schemas.
3. Draft contract matrix for endpoints & components.
4. Implement models with unique indexes.

---
**Footer:** Skeleton only. No runtime code here. To be iteratively expanded after Types & Schemas task.
