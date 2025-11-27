# IMPLEMENTATION_GUIDE_FID-20251125-001A_POLITICS_INFLUENCE_20251125

**Feature ID:** FID-20251125-001A  
**Date:** 2025-11-25  
**Status:** Active (Framework + Influence + Lobbying Base Complete, Tests Added)  
**Scope Covered:** Baseline deterministic influence formula, extended lobbying probability, tunable constants, type contracts, deterministic jitter, fairness protections, test suite.

---
## 1. Overview
This guide documents the deterministic Political Influence & Lobbying Probability foundation implemented for Phase 4. It replaces legacy ad‑hoc calculations with transparent, tunable, reproducible pure functions. All logic is centralized for calibration without code rewrites and fully covered by Jest tests.

Core Goals:
- Deterministic evaluation (same seed ⇒ identical output).
- Fair, monotonic progression with bounded growth (soft cap + floors).
- Extensible component breakdown for UI tooltips and analytics.
- Explicit lobbying probability architecture with state composite, proximity, spending efficiency, influence plateau and reputation term.
- Zero duplication (shared constants + hash utility).

---
## 2. Files & Responsibilities
| File | Responsibility |
|------|---------------|
| `src/lib/utils/politics/influenceConstants.ts` | Central tunable parameters (influence & lobbying). |
| `src/lib/utils/deterministicHash.ts` | FNV-1a 32-bit hashing & normalized range [-1,1]. |
| `src/lib/types/politicsInfluence.ts` | Type contracts for inputs/results/breakdowns. |
| `src/lib/utils/politics/influenceBase.ts` | `computeBaselineInfluence` pure composite influence. |
| `src/lib/utils/politics/lobbyingBase.ts` | `computeLobbyingProbability` extended probability. |
| `tests/politics/influenceBase.test.ts` | Influence determinism, scaling, soft cap, floor, jitter. |
| `tests/politics/lobbyingBase.test.ts` | Probability clamps, soft easing, proximity, jitter threshold. |

---
## 3. Influence Formula (computeBaselineInfluence)
Input Interface: `BaseInfluenceInputs`  
Output Interface: `InfluenceResult` with `components: InfluenceComponentBreakdown`.

Components (before rounding):
1. Donation Segment: `donationLogRaw = log10(donationAmount / DONATION_LOG_BASE_MIN) * 10` (0 below min). Multiplied by level multiplier; floored for parity.
2. Level Multiplier: `LEVEL_MULTIPLIER_MAP[level]` (1.0 → 3.0).
3. State Composite: `compositeInfluenceWeight * STATE_SCALE` (linear contribution; weight 0–1 sourced from derived metrics).
4. Election Proximity Bonus: Quadratic emphasis late cycle:
   - `ratio = clamp((window - weeksToElection)/window, 0,1)` with default window 52.
   - `electionProximity = (ratio^2) * ELECTION_MAX_BONUS`.
5. Reputation Factor: Only >50 applies: `((reputation - 50) / 50) * 10` (0–10).
6. Pre-Compression Aggregate: donationSegment + stateComposite + electionProximity + reputationFactor.
7. Soft Cap Compression: `compressed = value * (SOFT_CAP_TARGET / (SOFT_CAP_TARGET + value))` (rational diminishing returns, smooth asymptote < SOFT_CAP_TARGET).
8. Fairness Floor: `max(LEVEL_MINIMUMS[level], previousSnapshotInfluence * RETENTION_FLOOR_FACTOR)`; if snapshot absent uses level minimum.
9. Deterministic Micro Jitter: If seed provided, `normalizedHash(seed + '|influence') * MICRO_JITTER_MAX`. Applied after floor; never breaks fairness floor.

Final: `total = round(max(fairnessFloor, compressed [+ jitter]))`.

---
## 4. Lobbying Probability (computeLobbyingProbability)
Input Interface: `LobbyingProbabilityInputs`  
Output Interface: `LobbyingProbabilityResult` with detailed `LobbyingProbabilityBreakdown`.

Steps:
1. Difficulty Base: `base = LOBBY_DIFFICULTY_BASE[officeLevel]` fallback LOCAL.
2. Spending Term: `spendTerm = log10(1 + donationAmount / LOBBY_SPEND_SCALE) * LOBBY_SPENDING_WEIGHT`.
3. Influence Plateau: `influencePlateau = clamp(playerInfluenceScore / LOBBY_INFLUENCE_SCALE, 0,1)` then `influenceWeightApplied = influencePlateau * LOBBY_INFLUENCE_WEIGHT`.
4. State Composite Contribution: multiplier `1 + (clamp(compositeInfluenceWeight,0,1) * LOBBY_STATE_COMPOSITE_FACTOR)`.
5. Election Proximity Multiplier: exponential decay `normalized = exp(-weeksUntilElection / LOBBY_PROXIMITY_DECAY_HALF_LIFE)` then `1 + normalized * LOBBY_PROXIMITY_WEIGHT`.
6. Core Multiplicative Stack: `core = base * (1 + spendTerm) * (1 + influenceWeightApplied) * stateCompositeContribution * proximityMultiplier`.
7. Reputation Term: `reputationTerm = (clamp(reputation,0,100)/100) * LOBBY_REPUTATION_WEIGHT` (additive).
8. Jitter: If donationAmount ≥ threshold and seed present: `jitter = normalizedHash(seed + '|lobby|' + donationAmount) * LOBBY_JITTER_RANGE_ABS`; else 0.
9. Raw Unclamped: `rawUnclamped = core + reputationTerm + jitter`.
10. Soft Easing: If `rawUnclamped > LOBBY_SOFT_MAX` → `softened = LOBBY_SOFT_MAX + (rawUnclamped - LOBBY_SOFT_MAX) * LOBBY_SOFT_EASING_FACTOR` else unchanged.
11. Final Clamp: `final = clamp(softened, LOBBY_MIN_PROBABILITY, LOBBY_MAX_PROBABILITY)` (range 0.05–0.95).

Return probability as decimal (UI multiplies by 100 for display).

---
## 5. Determinism & Jitter
Hash Utility: FNV-1a 32-bit -> normalized [-1,1].  
Influence jitter seed scope: `seed + '|influence'`.  
Lobbying jitter seed scope: `seed + '|lobby|' + donationAmount` (separates attempts of different sizes).  
Guarantees reproducibility across sessions and machines.

---
## 6. Fairness & Progression Safeguards
| Mechanism | Purpose | Implementation |
|-----------|---------|----------------|
| Level Minimum | Ensures baseline strategic floor | `LEVEL_MINIMUMS` map |
| Snapshot Retention | Protects offline player value | `previous * RETENTION_FLOOR_FACTOR` |
| Soft Cap | Prevents runaway growth | Rational compression formula |
| Probability Clamp | Keeps lobbying in meaningful band | `LOBBY_MIN/MAX_PROBABILITY` |
| Soft Easing | Smooths probability saturation | `LOBBY_SOFT_MAX` + easing factor |
| Jitter Floors | Influence floor preserved | Post-floor check after jitter |

---
## 7. Constants Summary (Selected)
Influence: `STATE_SCALE=40`, `ELECTION_MAX_BONUS=20`, `SOFT_CAP_TARGET=400`, `MICRO_JITTER_MAX=0.5`.
Lobbying: `SPEND_SCALE=1000`, `SPENDING_WEIGHT=0.40`, `INFLUENCE_SCALE=250`, `INFLUENCE_WEIGHT=0.30`, `REPUTATION_WEIGHT=0.20`, `PROXIMITY_WEIGHT=0.35`, `DECAY_HALF_LIFE=12`, `STATE_COMPOSITE_FACTOR=0.25`, `SOFT_MAX=0.90`, `SOFT_EASING_FACTOR=0.35`, `JITTER_RANGE_ABS=0.015`, `JITTER_SPEND_THRESHOLD=250`, difficulty bases (LOCAL 0.30–NATIONAL 0.15), clamp 0.05–0.95.

Calibration Rule: Adjust a constant ⇒ re-run test suite & update spec doc + parity checklist; ensure deterministic bounds unchanged.

---
## 8. Test Coverage Summary
Influence Tests:
- Seed determinism & distinctness.
- Monotonic donation scaling free of floor bias.
- Soft cap reduction vs preCompressed aggregate.
- Fairness floor precedence (snapshot retention). 
- Jitter bounds and floor preservation.
- Election proximity impact (near vs far).
- State composite contribution positive delta.

Lobbying Tests:
- Determinism on seed; jitter threshold logic.
- Min & max clamp enforcement.
- Soft easing effect when exceeding soft max.
- Proximity multiplier (near > far) with probability increase.
- Jitter absent below spend threshold, present above.

All tests passing (13/13) – baseline reliability established.

---
## 9. Extensibility Roadmap
Planned Enhancements (deferred):
- Momentum bonus from `successfulLobbies` (log-scaling with diminishing returns).
- Historical donation aggregate weighting (totalDonations normalization). 
- Logistic reputation curve (replace linear >50 scaling). 
- Crisis / Event modifiers (temporary multipliers documented via breakdown additions).
- Regional / demographic sub-weights feeding composite influence weight.

Interface Stability: Existing breakdown keys preserved; new components appended (never renamed) to maintain consumer compatibility.

---
## 10. Usage Examples
Influence:
```ts
const influence = computeBaselineInfluence({
  donationAmount: 12500,
  totalDonations: 90000,
  companyLevel: 4,
  compositeInfluenceWeight: 0.62,
  weeksToElection: 8,
  reputation: 73,
  successfulLobbies: 12,
  seed: 'PLAYER_42',
  previousSnapshotInfluence: 310
});
console.log(influence.total, influence.components);
```
Lobbying Probability:
```ts
const prob = computeLobbyingProbability({
  officeLevel: 'STATE',
  donationAmount: 32000,
  playerInfluenceScore: influence.total,
  reputation: 73,
  compositeInfluenceWeight: 0.62,
  weeksUntilElection: 8,
  seed: 'PLAYER_42'
});
console.log(prob.probability, prob.breakdown);
```

---
## 11. DRY & Determinism Notes
- All numeric tunables isolated in `influenceConstants.ts`.
- Hash utility single source of truth (no duplicate hash logic). 
- Breakdown surfaces internal calculation components for UI, balancing tools, audit logging.
- No random sources; jitter deterministic from seed only.

---
## 12. Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Over-tuning constants | Unintended progression shifts | Keep changes small; re-run tests & document. |
| Missing future factors | Refactor churn later | Extensible breakdown pattern, reserved inputs retained. |
| Fairness floor inflation | Slows early growth | Monitor distribution; adjust `RETENTION_FLOOR_FACTOR` if needed. |
| Lobbying saturation | Converges near clamp | Soft easing ensures smooth approach; adjust weights not clamps first. |

---
## 13. Parity Verification
Legacy parity confirmed for:
- Donation log scaling pattern (log10 scale *10 with level multiplier). 
- Lobbying difficulty bases (LOCAL→NATIONAL mapping). 
- Probability 5–95% clamp retained. 
Added deterministic jitter, soft easing, proximity exponential form and state composite multiplier (documented as sanctioned extensions).

---
## 14. Maintenance Checklist
1. Update constants → bump spec docs, run tests.  
2. Add new component term → extend breakdown interface (append-only).  
3. Add momentum/reputation logistic → implement separate helper, keep deterministic hashing unchanged.  
4. Re-run test suite after every formula change.  
5. Document changes in parity checklist + implementation guide revision.

---
## 15. Compliance Statement
All code adheres to ECHO v1.3.0: complete file comprehension, deterministic pure utilities, DRY enforcement, centralized constants, comprehensive tests, proper documentation location (`/docs`). No duplication, no placeholders, no unbounded growth.

---
## 16. Footer
Generated 2025-11-25 by ECHO v1.3.0 (GUARDIAN).  
If extended factors are added, create a new dated revision of this guide preserving historical context.
