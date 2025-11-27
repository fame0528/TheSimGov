# Lobbying Probability Baseline Specification (FID-20251125-001A)

**Date:** 2025-11-25  
**Status:** Draft (Phase 4 – Todo 3 In-Progress)  
**Related Docs:** PARITY_CHECKLIST_POLITICAL_INFLUENCE_FID-20251125-001A_20251125.md, INFLUENCE_BASELINE_SPEC_FID-20251125-001A_20251125.md  
**Scope:** Define deterministic, decomposable lobbying success probability formula extending legacy factors while preserving parity clamps (5%–95%) and enabling future additive mechanics (reputation curve, crisis modifiers, legislative momentum) without refactor.

---
## 1. Objectives
1. Preserve legacy feel: difficulty base + spending log scaling + influence leverage + reputation bonus.
2. Add new parity-driven components: state composite weight and election proximity multiplier.
3. Ensure deterministic outputs given identical inputs + seed (micro-jitter optional, bounded, seed-derived).
4. Provide transparent breakdown for UI/debugging and tests (each component before clamps).
5. Maintain fairness: probability never <5% or >95% after all modifiers, with soft approach via easing rather than hard cutoff until final clamp.

---
## 2. Inputs (BaseInfluenceInputs subset)
| Field | Type | Description |
|-------|------|-------------|
| `stateMetrics` | DerivedMetrics | Precomputed shares (population, gdp, seat, crimePercentile, compositeInfluenceWeight). |
| `donationAmount` | number | Raw current lobbying spend (currency units). |
| `totalCampaignSpendToDate` | number | Cumulative spend for diminishing returns synergy (optional future). |
| `officeLevel` | OfficeLevelEnum | Maps to difficulty baseline (Local/State/Federal/National). |
| `playerInfluenceScore` | number | Output from baseline influence composite (pre-cap). |
| `reputation` | number (0–100) | Linear reputation; logistic curve deferred to 001B; normalized 0–1 internally. |
| `weeksUntilElection` | number | Weeks until relevant election (>=0). |
| `seed` | string | Deterministic seed for micro-jitter; hashed to numeric. |

---
## 3. Legacy Components (Parity Preservation)
| Component | Legacy Behavior | Notes |
|-----------|-----------------|-------|
| Difficulty Base | Fixed baseline by level (e.g., Local 0.30, State 0.25, Federal 0.20, National 0.15) | Interpreted as base success probability prior to other scaling. |
| Spending Log Term | `log10(1 + donationAmount)` scaled * spendingMultiplier | Diminishing returns – large spend increases gradually. |
| Influence Factor | `min(1, playerInfluenceScore / influenceScale)` | Provides plateau; scale constant chosen empirically (e.g., 250). |
| Reputation Bonus | `(reputation / 100) * reputationWeight` | Linear for 001A (logistic later). |
| Clamp | Final hard min/max: [0.05, 0.95] | Applied after all modifiers. |

---
## 4. New Components (001A Extensions)
| Component | Definition | Rationale |
|-----------|------------|-----------|
| State Composite Weight | `stateMetrics.compositeInfluenceWeight` (0–1 normalized) | Reflects strategic complexity & leverage potential. |
| Election Proximity Multiplier | `proximityMultiplier = 1 + proximityWeight * f(weeksUntilElection)` | Heightens urgency near elections without spike exploitation. |
| Deterministic Micro-Jitter | `jitter = hash(seed + officeLevel + weeksUntilElection) % jitterRange` adjusted to centered zero | Introduces subtle variation while keeping reproducible results. |

### 4.1 Election Proximity Function f(w)
We desire monotonic decay as weeks increase: high urgency near election, taper far out.
Proposed: `f(w) = exp(-w / decayHalfLife)` where `decayHalfLife` ~ campaignLength/4 (e.g., 12 if 48-week year model). Normalized: `normalizedProximity = exp(-w / 12)`.
Multiplier: `proximityMultiplier = 1 + proximityWeight * normalizedProximity`.
Constants draft: `proximityWeight = 0.35` (max +35% when w=0).

### 4.2 Spending Log Scaling Refinement
Legacy: `log10(1 + donationAmount)`.
We introduce a gentle normalization: `spendTerm = log10(1 + donationAmount / spendScale)` with `spendScale = 1000` ensures small spends matter, large adjust slowly.
Optional synergy (deferred): incorporate cumulative spend: `effectiveSpend = donationAmount + alpha * totalCampaignSpendToDate` (alpha ~0.05). Not implemented in 001A; placeholder documented.

### 4.3 Influence Plateau
`influencePlateau = min(1, playerInfluenceScore / influenceScale)`; `influenceScale = 250` (tunable). Provides natural saturation.

### 4.4 Reputation Linear Term
`reputationLinear = (reputation / 100)`; weight: `reputationWeight = 0.20` (max +20%). Logistic transform planned Phase 001B.

### 4.5 State Composite Contribution
Direct multiplicative blend to avoid over-dominance:
`stateCompositeContribution = 1 + stateCompositeWeight * stateCompositeFactor`
Where `stateCompositeFactor = 0.25` (cap +25%). Ensures states with strong composite weight slightly amplify probability.

### 4.6 Deterministic Micro-Jitter
Goal: subtle variance ±1.5 percentage points raw before clamp.
Process:
1. Hash: `h = murmurHash(seed + '|' + officeLevel + '|' + weeksUntilElection)`.
2. Normalize: `r = (h % 1000) / 1000` ∈ [0,1).
3. Center: `centered = (r - 0.5)` ∈ [-0.5, 0.5].
4. Scale: `jitterRaw = centered * 0.03` (±0.015 absolute probability points).
Apply only if `donationAmount > jitterSpendThreshold` (e.g., 250) to prevent noise on trivial attempts.

---
## 5. Composite Formula (Unclamped)
```
base = difficultyBase[officeLevel]
spendTerm = log10(1 + donationAmount / spendScale) * spendingWeight
influencePlateau = min(1, playerInfluenceScore / influenceScale)
reputationTerm = reputationLinear * reputationWeight
proximityMultiplier = 1 + proximityWeight * exp(-weeksUntilElection / decayHalfLife)
stateCompositeContribution = 1 + stateMetrics.compositeInfluenceWeight * stateCompositeFactor
raw = base
    * (1 + spendTerm)
    * (1 + influencePlateau * influenceWeight)
    * stateCompositeContribution
    * proximityMultiplier
    + reputationTerm
    + jitterRaw (conditional)
```
Then apply soft easing cap before final clamp:
```
softMax = 0.90
if raw > softMax:
   raw = softMax + (raw - softMax) * softEasingFactor   # softEasingFactor ~0.35
```
Final clamp:
`probability = clamp(raw, 0.05, 0.95)`.

### Constant Draft (Tunable Table)
| Name | Draft Value | Range | Notes |
|------|-------------|-------|-------|
| `spendScale` | 1000 | 500–2000 | Economic scaling reference. |
| `spendingWeight` | 0.40 | 0.25–0.55 | Controls donation impact. |
| `influenceScale` | 250 | 150–400 | Balance speed to plateau. |
| `influenceWeight` | 0.30 | 0.20–0.45 | Influence leverage strength. |
| `reputationWeight` | 0.20 | 0.10–0.30 | Reputation early-phase impact. |
| `proximityWeight` | 0.35 | 0.20–0.45 | Max election urgency bump. |
| `decayHalfLife` | 12 | 8–16 | Weeks until urgency halves. |
| `stateCompositeFactor` | 0.25 | 0.15–0.35 | Regional leverage cap. |
| `softMax` | 0.90 | 0.85–0.92 | Pre-clamp easing start. |
| `softEasingFactor` | 0.35 | 0.25–0.50 | Slope reduction scale. |
| `jitterRangeAbs` | 0.015 | 0.010–0.020 | Max absolute jitter. |
| `jitterSpendThreshold` | 250 | 100–500 | Suppress jitter for trivial attempts. |

---
## 6. Breakdown Interface (LobbyingProbabilityBreakdown)
```ts
interface LobbyingProbabilityBreakdown {
  base: number; // difficulty base
  spendTerm: number; // additive relative scaling before multiplication
  influencePlateau: number; // 0..1
  influenceWeightApplied: number; // influencePlateau * influenceWeight
  stateCompositeWeight: number; // compositeInfluenceWeight raw
  stateCompositeContribution: number; // 1 + stateCompositeWeight * factor
  proximityMultiplier: number; // 1 + proximityWeight * exp(-w / halfLife)
  reputationTerm: number; // reputationLinear * reputationWeight
  jitter: number; // jitterRaw applied or 0
  rawUnclamped: number; // before soft easing & clamp
  softened: number; // after softMax easing (if triggered)
  final: number; // clamp applied
}
```

---
## 7. Determinism Guarantees
- All functions pure & side-effect free.
- Hash algorithm stable (choose murmurhash3 32-bit implementation).
- No floating nondeterminism: restrict to Math.log10, Math.exp (well-defined). Tests compare fixed seeds & inputs for equality.

---
## 8. Edge Cases & Clamps
| Scenario | Expected Behavior |
|----------|-------------------|
| Donation = 0 | spendTerm ≈ 0; probability relies on base + other modifiers. |
| Extremely large donation (>> spendScale) | Log scaling prevents runaway; raw approaches plateau/easing. |
| InfluenceScore very high (> influenceScale * 1.5) | Plateau at 1; weight limits multiplier. |
| Reputation = 0 | reputationTerm = 0. |
| WeeksUntilElection large (>> decayHalfLife*4) | proximityMultiplier ≈ 1 (no effect). |
| CompositeInfluenceWeight = 0 | stateCompositeContribution = 1. |
| CompositeInfluenceWeight = 1 | Contribution = 1 + factor (max). |
| Raw < 0.05 before clamp | Final raised to 0.05 floor. |
| Raw > 0.95 before clamp | Final reduced to 0.95 ceiling. |
| Jitter threshold not met | jitter = 0 (determinism still intact). |

---
## 9. Test Plan (Phase 7 Reference)
| Test | Inputs | Assertion |
|------|--------|-----------|
| Base Only | Minimal donation, low influence, far election | final within 5–15%. |
| Plateau Influence | High score pushes influencePlateau to 1 | final respects softMax easing. |
| Near Election Urgency | weeksUntilElection = 0 | proximityMultiplier ~ 1+proximityWeight. |
| Far Election Neutral | weeksUntilElection = 52 | proximityMultiplier ≈ 1 ±0.01. |
| State Composite Max | compositeInfluenceWeight = 1 | contribution = 1+factor. |
| Reputation Extremes | reputation 0 vs 100 | delta ≈ reputationWeight. |
| Donation Scaling | donation 0, 1k, 10k | monotonic increasing with diminishing increments. |
| Clamp Lower Bound | config manipulating negative raw | final == 0.05. |
| Clamp Upper Bound | forced large terms | final == 0.95. |
| Jitter Determinism | same seed repeated | identical final & jitter. |
| Jitter Variation | different seeds | jitter differs, bounded ±jitterRangeAbs. |

---
## 10. Future Extensibility (Phase 001B / Subsequent FIDs)
| Planned Extension | Hook Point |
|-------------------|-----------|
| Logistic Reputation Curve | Replace reputationTerm linear mapping. |
| Crisis Event Modifiers | Multiply raw before soft easing. |
| Legislative Momentum | Additional multiplier after influenceWeight. |
| Dynamic Difficulty | Adjust difficultyBase by market saturation metrics. |
| Cumulative Spend Synergy | Replace spendTerm with blended effectiveSpend. |

---
## 11. Acceptance Criteria (Lobbying Probability Spec)
- Deterministic pure function with full breakdown output implemented.
- Matches legacy difficulty + spending feel within ±5 percentage points median across calibration set.
- New components (stateComposite, proximity) demonstrably impact probability in controlled ranges (unit tests).
- Final probability always within 5–95% after clamp; soft easing triggers only when raw > softMax.
- Jitter deterministic & bounded; absent below spend threshold.
- 100% TypeScript strict pass; no any assertions.
- Full JSDoc + formula section linking parity checklist references.

---
## 12. Implementation Notes
File target: `src/politics/influence/lobbyingBase.ts` (to be added). Will import constants from `src/politics/influence/constants.ts` (planned extraction file) to centralize tunables. Breakdown interface will live in `src/politics/influence/types.ts` with other influence-related types (alongside InfluenceResult etc.).

---
## 13. DRY & Utility-First Compliance
- Reuses existing donation log pattern (normalized variant) rather than duplicating legacy formula.
- Separates constants for future balancing without code change churn.
- Hash utility shared for other deterministic micro-jitter features (seed-based fairness). Potential location: `src/lib/utils/deterministicHash.ts`.

---
## 14. Open Calibration Items
| Item | Current | Target | Resolution Strategy |
|------|---------|--------|---------------------|
| spendingWeight | 0.40 | TBD after empirical runs | Run synthetic scenario matrix, tune for mid-range elasticity. |
| influenceScale | 250 | Confirm plateau feel | Adjust until mid-tier players (score ~160) at ~0.6 plateau. |
| proximityWeight | 0.35 | Ensure urgency but not dominance | Validate election-eve uplift < +35%. |
| softMax | 0.90 | Avoid hard ceiling perception | Player feedback & distribution analysis. |

---
**Footer:** Part of FID-20251125-001A Phase 4. Prepared under ECHO v1.3.0 governance with GUARDIAN compliance; deterministic, DRY, parity aligned.
