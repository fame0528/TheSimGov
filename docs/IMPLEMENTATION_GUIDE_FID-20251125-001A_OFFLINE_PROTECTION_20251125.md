# OFFLINE PROTECTION & RETENTION FLOOR GUIDE (FID-20251125-001A)

**Date:** 2025-11-25  
**Scope:** Political Core Framework – Offline fairness, retention, post-absence recovery primitives  
**Related Specs:** INFLUENCE_BASELINE_SPEC_FID-20251125-001A_20251125.md, LOBBYING_PROBABILITY_SPEC_FID-20251125-001A_20251125.md  

---
## 1. Purpose & Principles
Offline protection ensures players who are absent do not suffer disproportionate influence losses while still maintaining competitive integrity. The design adheres to:
- Determinism: Pure functions – identical inputs yield identical outputs.
- Fairness Floor: Guarantees a minimum influence based on current level or retained prior performance.
- Controlled Decay: Clamp logic prevents runaway negative drift beyond configurable bounds after a grace period.
- Re-Engagement Support: Catch‑up buff offers proportional, capped assistance to returning players without granting unfair spikes.
- DRY Architecture: Shared retention logic extracted to `src/lib/utils/politics/offlineProtection.ts` for reuse across future campaign/office systems.

---
## 2. Modules & Responsibilities
| Module | Path | Responsibility |
|--------|------|---------------|
| Offline Clamp / Autopilot | `src/politics/utils/offlineProtection.ts` | Prevent excessive negative drift; autopilot strategy & catch‑up multiplier. |
| Retention Floor Utilities | `src/lib/utils/politics/offlineProtection.ts` | Compute fairness/retention floor; apply floor; snapshot creation. |
| Baseline Influence | `src/lib/utils/politics/influenceBase.ts` | Composite influence calculation; invokes fairness floor clamp. |
| Constants | `src/lib/utils/politics/influenceConstants.ts` | Tunable floors, factors (e.g. `RETENTION_FLOOR_FACTOR`, `LEVEL_MINIMUMS`). |
| Testing | `tests/politics/offlineProtection.test.ts` | Validates clamp logic, retention floor behavior, snapshot capture & baseline integration parity. |

---
## 3. Retention Floor Model
```
fairnessFloor(level, previousSnapshot?) = max(levelMinimum[level], previousSnapshot * RETENTION_FLOOR_FACTOR)
```
- `levelMinimum[level]`: Baseline guarantee per progression stage.
- `RETENTION_FLOOR_FACTOR`: Preserves up to X% (currently 0.9) of prior snapshot influence.
- Previous snapshot optional; if absent, fallback is pure level minimum.
- Applied AFTER soft cap compression but BEFORE jitter; jitter cannot undercut floor.

### Application Flow
1. Compute compressed influence (after donation + state + proximity + reputation + soft cap).
2. Derive floor via `computeFairnessFloor(level, previousSnapshotInfluence)`.
3. Clamp: `final = max(compressed, floor)`.
4. Apply deterministic jitter (if enabled) while preserving floor guarantee.

### Reasons
| Scenario | Raw < Level Min | Raw < Retention Floor | Raw >= Floors | Result | Reason |
|----------|-----------------|-----------------------|---------------|--------|--------|
| New Player | Yes | N/A | No | Level Min | level-minimum |
| Returning, Performance Drop | Maybe | Yes | No | Retention Floor | retention |
| Strong Performance | No | No | Yes | Raw | none |

---
## 4. Offline Clamp & Catch-Up Buff
### Negative Drift Clamp
```
clampOfflineDrift(delta, weeksOffline, { maxNegativeDriftPerWeek, gracePeriodWeeks })
```
- Within grace period: no clamp.
- Beyond grace: maximum allowed cumulative negative drift = `-maxNegativeDriftPerWeek * (weeksOffline - gracePeriodWeeks)`.
- Only clamps negative deltas; positive or small negatives pass through.

### Catch-Up Buff
```
computeCatchUpBuff(weeksOffline, maxBuff = 1.5, halfLifeWeeks = 52)
Buff = 1 + (maxBuff - 1) * (1 - e^(-weeksOffline / halfLifeWeeks))
```
- Asymptotic approach prevents sudden large spikes.
- Encourages timely return without destabilizing fairness.

### Autopilot Strategy (During Absence)
| Strategy | Resource Efficiency | Scandal Reduction |
|----------|---------------------|-------------------|
| defensive | 0.7 | 0.5 |
| balanced  | 1.0 | 0.8 |
| growth    | 1.2 | 1.0 |

Autopilot metadata influences other systems (allocation models, scandal probability calculators) in future phases.

---
## 5. Integration with Baseline Influence
In `computeBaselineInfluence`:
- After constructing pre-compressed sum and applying soft cap, it calls `computeFairnessFloor`.
- Jitter added post clamp (seed-derived FNV hash) cannot reduce total below the floor.
- This ensures deterministic monotonic fairness across session boundaries.

---
## 6. Deterministic Snapshot
`createInfluenceSnapshot(result, level)` captures:
- Rounded total (`result.total`).
- Current level.
- ISO timestamp.
Snapshots allow future retention comparisons (campaign cycles, office tenure) and potential momentum decay enhancements.

---
## 7. Testing Summary
Added tests in `tests/politics/offlineProtection.test.ts`:
- Clamp logic: grace vs post-grace negative drift.
- Autopilot configs: strategy-specific multipliers.
- Catch-up buff: monotonic increase, cap enforcement, asymptotic convergence.
- Retention floor parity: verifies selection logic (level minimum vs retained previous * factor).
- Retention application: below-floor replacement, above-floor pass-through, snapshot absence fallback.
- Snapshot creation: structural correctness.
- Baseline parity: final influence never below computed fairness floor.

All suites passing: 33/33 tests (politics offline, influence, lobbying).

---
## 8. Extensibility Roadmap (Deferred to FID-20251125-001B)
| Feature | Planned Enhancement |
|---------|---------------------|
| Momentum Decay | Gradual reduction of retained floor over long inactivity windows. |
| Election Cycle Recovery | Dynamic buff scaling based on cycle proximity. |
| Office Tenure Adjustment | Floor bonus for elected positions tied to public mandate. |
| Multi-Snapshot Trend | Weighted retention using recent performance trajectory. |
| Adaptive Floor Factor | Variable RETENTION_FLOOR_FACTOR based on volatility metrics. |

---
## 9. DRY & Compliance Notes
- Single source of truth for fairness floor prevents divergence across influence & future campaign systems.
- All functions pure and side-effect free; ready for memoization or deterministic caching.
- Retention logic isolated for easier auditing and balancing.
- Documentation naming conforms to ECHO guide; FID alignment maintained.

---
## 10. Constants Reference
| Constant | Current Value | Purpose |
|----------|---------------|---------|
| RETENTION_FLOOR_FACTOR | 0.9 | Preserve 90% of prior snapshot. |
| LEVEL_MINIMUMS | Map(level→base floor) | Baseline progression guarantee. |
| maxNegativeDriftPerWeek | (configurable) | Bounded offline losses post grace. |
| gracePeriodWeeks | (configurable) | Delay before loss clamp activation. |
| maxBuff (catch-up) | 1.5 | Upper bound on re-engagement multiplier. |
| halfLifeWeeks | 52 | Time to reach ~50% of max buff. |

---
## 11. Acceptance Criteria (Met)
- Deterministic floor selection logic implemented & tested.
- Clamp + catch-up model isolated and verifiable.
- Baseline influence integration preserves fairness guarantees.
- No duplication of fairness logic (DRY extraction complete).
- Comprehensive unit test coverage for all offline/retention primitives.
- Documentation created detailing formulas, responsibilities, and roadmap.

---
## 12. Verification Checklist
| Item | Status |
|------|--------|
| Fairness floor formula deterministic | ✅ |
| Snapshot creation pure & minimal | ✅ |
| Baseline influence respects floor | ✅ |
| Jitter cannot undercut floor | ✅ |
| Clamp applies only post-grace & to negatives | ✅ |
| Catch-up buff capped & asymptotic | ✅ |
| Autopilot configs correct | ✅ |
| Tests passing (offline + baseline + lobbying) | ✅ |
| Docs generated per naming convention | ✅ |

---
## 13. Next Steps
Proceed to FID-20251125-001B (Advanced Political Engagement) leveraging stable offline & retention foundation; integrate momentum decay metrics and campaigning phase modifiers.

---
*Generated 2025-11-25 – ECHO v1.3.0 compliant. No side effects; ready for extension.*
