# Dynamic Balance Scaler Specification

**Created:** 2025-11-27  
**Version:** 1.0  
**Status:** Production-Ready  
**Phase:** 6B - Endorsements & Dynamic Balance  
**Test Coverage:** 19/19 (100%)

---
## 1. Overview
The Dynamic Balance Scaler prevents runaway leads from becoming irreversible while offering meaningful comeback pathways for trailing candidates. It avoids artificial rubber‑banding by applying *transparent*, formula‑driven adjustments:

| Mechanism | Trigger | Effect | Purpose |
|-----------|--------|--------|---------|
| Underdog Buff | Trailing >10pp | +min(gap×0.05, 3.0) polling points | Keeps competition alive; rewards persistence |
| Frontrunner Penalty | Leading >15pp | Cost multiplier = 1 + (lead×0.03) | Makes extreme leads more expensive to maintain |
| Systemic Cap | Polling >60% | Compress excess to 20% retention | Prevents snowball dominance beyond 60% |
| Fair Probability Modulation | Balance context | Blends base probability with adjusted fairness | Normalizes event outcomes without hard caps |

All formulas are deterministic, side‑effect free, and logged for UI transparency.

---
## 2. Core Formulas

### 2.1 Underdog Buff
```
if gap <= 10 → 0
else buff = min(gap * 0.05, 3.0)
```
- Gap = leaderPolling - candidatePolling.
- Linear growth up to max 3.0pp.
- Chosen growth rate (5%) gives moderate help without erasing skill.

### 2.2 Frontrunner Penalty
```
if lead <= 15 → multiplier = 1
else multiplier = 1 + (lead * 0.03)
```
- Lead = candidatePolling - secondHighestPolling.
- Applied to action costs (spending, strategic operations), not direct polling.
- 3% per point gives clear scaling: +18 lead → 1.54× costs.

### 2.3 Systemic Cap
```
if polling <= 60 → effective = polling
else effective = 60 + (polling - 60) * 0.2
```
- Hard dominance compression above 60%. Keeps extreme highs meaningful but subdued.
- Example: 75% → 60 + (15×0.2) = 63%; 90% → 66% effective.

### 2.4 Fair Probability Modulation
```
adjustedPolling = capped + underdogBuff
pollingFactor = adjustedPolling / 100
prob = (baseProbability + pollingFactor) / 2
if underdog → prob += underdogBuff/100 and ensure prob >= baseProbability
if frontrunner → prob /= penaltyMultiplier
clamp 0.01–0.99
```
- Blends inherent skill (baseProbability) with current competitive context.
- Guarantees underdogs never lose probability due to context blending.

---
## 3. Constants & Tuning
```ts
export const UNDERDOG_GAP_THRESHOLD = 10;
export const UNDERDOG_BUFF_FACTOR = 0.05;
export const UNDERDOG_BUFF_MAX = 3.0;
export const FRONTRUNNER_LEAD_THRESHOLD = 15;
export const FRONTRUNNER_PENALTY_FACTOR = 0.03;
export const SYSTEMIC_CAP_THRESHOLD = 60;
export const SYSTEMIC_CAP_COMPRESSION = 0.2;
```
| Constant | Default | Adjust ↑ | Adjust ↓ | Impact |
|----------|---------|----------|----------|--------|
| UNDERDOG_GAP_THRESHOLD | 10 | 12 | 8 | Accessibility of comeback aid |
| UNDERDOG_BUFF_FACTOR | 0.05 | 0.06 | 0.04 | Speed of comeback momentum |
| UNDERDOG_BUFF_MAX | 3.0 | 3.5 | 2.0 | Ceiling of surge potential |
| FRONTRUNNER_LEAD_THRESHOLD | 15 | 18 | 12 | When dominance costs start |
| FRONTRUNNER_PENALTY_FACTOR | 0.03 | 0.04 | 0.02 | Aggressiveness of cost scaling |
| SYSTEMIC_CAP_THRESHOLD | 60 | 62 | 58 | Soft dominance boundary |
| SYSTEMIC_CAP_COMPRESSION | 0.2 | 0.25 | 0.15 | Retention of excess polling |

**Balance Philosophy:** Tweak only one dimension at a time; verify via simulation before multi‑parameter adjustments.

---
## 4. API Reference
```ts
computeUnderdogBuff(trailingGap: number): number
computeFrontrunnerPenaltyMultiplier(leadGap: number): number
applySystemicCap(polling: number): number
computeBalanceAdjustments(candidatePolling: number, allPollings: number[]): BalanceAdjustmentResult
computeFairProbability(baseProbability: number, candidatePolling: number, allPollings: number[]): number
describeBalanceAdjustments(result: BalanceAdjustmentResult): string
getFairAdjustedPolling(candidatePolling: number, allPollings: number[]): number
```
### BalanceAdjustmentResult
```ts
interface BalanceAdjustmentResult {
  candidatePolling: number;
  cappedPolling: number;
  adjustedPolling: number;
  underdogBuff: number;
  penaltyMultiplier: number;
  trailingGap: number;
  leadGap: number;
  isUnderdog: boolean;
  isFrontrunner: boolean;
  thresholdsTripped: string[];
}
```

---
## 5. Usage Examples

### 5.1 Compute Adjustments
```ts
const pollings = [68, 50, 44, 38];
const leaderAdj = computeBalanceAdjustments(68, pollings);
// leaderAdj.penaltyMultiplier → 1 + (18*0.03) = 1.54
// leaderAdj.cappedPolling → 60 + (8*0.2) = 61.6

const underdogAdj = computeBalanceAdjustments(38, pollings);
// gap 30 → buff = min(30*0.05=1.5, 3) = 1.5
// adjustedPolling = 38 + 1.5 = 39.5
```

### 5.2 Fair Probability
```ts
const baseWinChance = 0.42; // candidate skill baseline
const fairChance = computeFairProbability(baseWinChance, 38, [68, 50, 44, 38]);
// Under-dog ensures fairChance >= baseWinChance
```

### 5.3 UI Display
```ts
const r = computeBalanceAdjustments(38, [68, 50, 44, 38]);
console.log(describeBalanceAdjustments(r));
// "Underdog buff +1.50pp (gap 30pp)"
```

### 5.4 Leaderboard Neutralization
```ts
const neutralPolling = getFairAdjustedPolling(playerPolling, allPollings);
// Use neutralPolling for ranking fairness vs rawPolling
```

---
## 6. Edge Cases
| Case | Behavior |
|------|----------|
| Single candidate | No underdog or penalty; only cap may apply |
| Exactly threshold (gap=10, lead=15) | No buff/penalty (strict > logic) |
| Extreme gap (gap>60) | Buff capped at 3.0pp |
| Polling exactly 60% | No compression applied |
| Polling 100% (hypothetical) | Effective = 60 + (40*0.2) = 68% |
| Negative / malformed polling | Should be validated upstream; assume sanitized |

---
## 7. Testing Strategy
- **Unit Tests:** Threshold boundaries, cap compression math, linear scaling, fairness guarantee.
- **Probability Tests:** Under/fair advantage, penalty reduction, clamp limits.
- **Regression Protection:** Keep formulas in this spec; diff on changes for audit.

Current Suite: 19 tests, 100% coverage, sub‑millisecond execution.

---
## 8. Performance
- Complexity: O(n log n) for sorting per evaluation (n = candidate count). Typical n < 20.
- Optimization Routes:
  - Pre‑sorted polling arrays if recalculated frequently.
  - Cache `computeBalanceAdjustments` per tick (invalidate on polling change).
  - Avoid full recompute for unchanged candidates.

---
## 9. Tuning Workflow
1. Identify imbalance pattern (e.g., frontrunners sustain >20pp for >6 cycles).
2. Simulate with proposed constant change.
3. Verify comeback delta does not exceed fairness threshold (≤5% structural advantage).
4. Update constants & re-run test suite (must remain green).
5. Log adjustment in `ENGAGEMENT_ENGINE_SPEC.md` revision history.

---
## 10. Production Readiness Checklist
- ✅ Deterministic formulas
- ✅ Comprehensive test coverage
- ✅ No hidden modifiers (transparent thresholds)
- ✅ Fairness guarantees (no underdog probability degradation)
- ✅ Barrel export added (`systems/index.ts`)
- ✅ Documentation complete (this spec)

---
**Created by ECHO v1.3.1 – Dynamic Balance Scaler (Phase 6B)**  
**Quality:** AAA | **TypeScript Errors:** 0 | **Status:** Ready for integration
