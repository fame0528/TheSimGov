# Baseline Political Influence & Lobbying Specification

**FID:** FID-20251125-001A  
**Date:** 2025-11-25  
**Phase:** 4 (Baseline Influence & Lobbying Formulas)  
**Status:** Draft (To be finalized before implementation)

## 1. Objectives
Establish deterministic, extensible baseline functions for political influence scoring and lobbying success probability that:  
- Reuse all legacy logic without duplication.  
- Integrate new state-derived composite metric (`compositeInfluenceWeight`).  
- Introduce election proximity and reputation normalization factors.  
- Provide transparent component breakdown objects.  
- Enforce offline fairness through level-based minimum clamps.  
- Support deterministic micro-variance via seed (optional).  
- Maintain legacy probability clamp (5%–95%).

## 2. Scope (Included vs Deferred)
Included: Donation influence extension, total influence baseline, lobbying probability wrapper with added factors, breakdown types, deterministic seed, fairness clamp logic.  
Deferred (to 001B): Polling momentum, endorsements, scandals, advanced multi-session decay curves, dynamic difficulty scaling.

## 3. Core Inputs & Types (Draft)
```ts
interface BaseInfluenceInputs {
  donationAmount: number;          // Raw latest donation amount
  totalDonations: number;          // Aggregate historical donations (for legacy total influence context)
  companyLevel: CompanyLevel;      // 1..5
  compositeInfluenceWeight: number;// Derived state metric (0..1)
  weeksToElection: number;         // Weeks until next election for target office
  reputation: number;              // 0..100
  successfulLobbies: number;       // Count of successful lobbying actions
  seed?: string | number;          // Deterministic seed (optional)
  previousSnapshotInfluence?: number;// Influence from last offline snapshot (for fairness floor)
}

interface InfluenceComponentBreakdown {
  donationLog: number;            // Legacy log10 scaled donation influence before multiplier
  levelMultiplierFactor: number;  // Applied level multiplier (>1 for levels 2+)
  stateComposite: number;         // Scaled contribution from compositeInfluenceWeight
  electionProximity: number;      // Additive bonus based on weeksToElection
  reputationFactor: number;       // Additive or multiplicative reputation component
  diminishingReturnsApplied: number; // Value after soft cap / non-linear compression
  fairnessClampApplied: number;   // Final post-clamp value (may raise low totals)
  seedJitter?: number;            // Optional ± micro variance (deterministic)
}

interface InfluenceResult {
  total: number;                  // Final integer influence score
  components: InfluenceComponentBreakdown;
  seed?: string | number;
}

interface LobbyingProbabilityBreakdown {
  baseDifficulty: number;         // From legislation type mapping
  levelBonus: number;             // (level - 3)*5 (>=0)
  spendingBonus: number;          // log10(pointsSpent + 1)*10
  influenceBonus: number;         // floor(totalInfluence/50)
  reputationBonus: number;        // max(0, reputation-50)*0.5
  stateCompositeContribution: number; // floor(compositeInfluenceWeight * 10)
  electionProximityBonus: number; // 0..5 scaled by weeksToElection
  seedJitter?: number;            // ±1 max
  unclampedTotal: number;         // Sum before 5–95 clamp
  finalProbability: number;       // 5..95 integer
}
```

## 4. Baseline Influence Formula
### 4.1 Legacy Donation Segment
```
baseDonationLog = log10(max(donationAmount, 100)/100) * 10
levelMultiplier = {1:1.0,2:1.2,3:1.5,4:2.0,5:3.0}[companyLevel]
donationInfluence = floor(baseDonationLog * levelMultiplier)
```
### 4.2 State Composite Contribution
```
// compositeInfluenceWeight ∈ [0,1]
STATE_SCALE = 40   // Tunable constant (empirical; target comparable magnitude to mid-level donation)
stateComposite = compositeInfluenceWeight * STATE_SCALE
```
Rationale: Ensures geographic/economic footprint materially influences baseline without overshadowing donation log scaling.

### 4.3 Election Proximity Factor
```
// weeksToElection ≥ 0, window = 52 (one year of campaign runway)
proximityRatio = clamp((window - weeksToElection)/window, 0, 1)
ELECTION_MAX_BONUS = 20
// Emphasize late-cycle intensity with quadratic weighting
proximityWeighted = proximityRatio^2
electionProximity = proximityWeighted * ELECTION_MAX_BONUS
```
### 4.4 Reputation Factor (Normalization)
```
// Reputation r ∈ [0,100]; neutral point 50
if r <= 50 -> reputationFactor = 0
else reputationFactor = (r - 50)/50 * 10  // max +10 at r=100
```
Future upgrade (001B): Replace linear post-threshold scaling with logistic curve for smoother transitions.

### 4.5 Aggregate Pre-Compression
```
preCompressed = donationInfluence + stateComposite + electionProximity + reputationFactor
```
### 4.6 Diminishing Returns Soft Cap
Use a rational function giving strong early growth, flattening at high values:
```
// SOFT_CAP_TARGET defines asymptote region; choose 400 for early-phase ceiling
SOFT_CAP_TARGET = 400
compressed = preCompressed * (SOFT_CAP_TARGET / (SOFT_CAP_TARGET + preCompressed))
```
This keeps compressed < SOFT_CAP_TARGET while preserving monotonicity.

### 4.7 Fairness Clamp (Offline Protection)
```
levelMinimums = {1:0,2:25,3:60,4:150,5:300}
retentionFloor = previousSnapshotInfluence ? previousSnapshotInfluence * 0.9 : 0
rawPost = compressed
fairnessFloor = max(levelMinimums[companyLevel], retentionFloor)
finalInfluence = max(fairnessFloor, rawPost)
```
Ensures offline periods do not drop below 90% of prior snapshot or below strategic minimum baseline for player level.

### 4.8 Optional Deterministic Seed Jitter
```
if seed provided:
  jitterSource = hash(seed + 'influence') % 2001  // 0..2000
  normalized = (jitterSource - 1000)/1000         // -1..1
  MICRO_JITTER_MAX = 0.5
  seedJitter = normalized * MICRO_JITTER_MAX
  finalInfluenceWithJitter = finalInfluence + seedJitter
else seedJitter = undefined
```
Jitter is informational only (can round final output after addition). Does not violate fairness floor (apply jitter after clamp but round ensuring floor).

### 4.9 Output
```
return InfluenceResult {
  total: round(finalInfluenceWithJitter or finalInfluence),
  components: {
    donationLog: baseDonationLog,
    levelMultiplierFactor: levelMultiplier,
    stateComposite,
    electionProximity,
    reputationFactor,
    diminishingReturnsApplied: compressed,
    fairnessClampApplied: fairnessFloor,
    seedJitter
  },
  seed
}
```

## 5. Lobbying Success Probability Extension
### 5.1 Legacy Base (Unchanged)
Reuse existing components from `getLobbyingSuccessProbability` WITHOUT reimplementation of shared formulas.

### 5.2 Added Components
```
stateCompositeContribution = floor(compositeInfluenceWeight * 10)
// Election proximity bonus capped at 5
proximityRatio = clamp((window - weeksToElection)/window, 0, 1)
electionProximityBonus = round(proximityRatio * 5)
```
### 5.3 Optional Seed Jitter
```
if seed:
  jitterSource = hash(seed + 'lobby') % 201  // 0..200
  seedJitter = (jitterSource - 100)/100      // -1..1
else seedJitter = undefined
```
Applied pre-clamp; negligible effect, keeps predictability with seed.

### 5.4 Aggregation & Clamp
```
unclampedTotal = baseDifficulty + levelBonus + spendingBonus + influenceBonus + reputationBonus + stateCompositeContribution + electionProximityBonus + (seedJitter || 0)
finalProbability = clamp(round(unclampedTotal), 5, 95)
```

### 5.5 Output
Return `LobbyingProbabilityBreakdown` with detailed component listing for analytics & UI transparency.

## 6. Determinism & Hash Strategy
Use stable non-cryptographic hash (e.g., FNV-1a or simple 32-bit additive) over UTF-8 seed string to derive jitterSource. Avoid crypto overhead. Jitter kept minimal to preserve fairness.

## 7. Validation & Edge Cases
| Case | Expected Behavior |
|------|-------------------|
| donationAmount < 100 | donationInfluence = 0 (still can gain from other factors) |
| weeksToElection > window (e.g., >52) | proximityRatio floored at 0 → no bonus |
| compositeInfluenceWeight = 0 | Removes geographic leverage; score relies on donations + other factors |
| reputation < 50 | No positive reputationFactor contribution |
| previousSnapshotInfluence extremely high | fairness floor may be high; but compressed soft cap limits growth; floor never lowers total |
| seed omitted | No jitter applied; purely deterministic from inputs |

## 8. DRY & Reuse Notes
- Use existing `calculateInfluencePoints` ONLY for donation segment (extract donationLog portion without re-deriving multiplier mapping).
- Import `stateDerivedMetrics` composite weight—do not recalc shares.
- Import scheduling helper for weeksToElection retrieval (precomputed by time utilities).
- Provide small helper functions (`computeElectionProximity`, `applySoftCap`, `computeFairnessFloor`, `deriveSeedJitter`) each defined once.

## 9. Testing Plan (Summary)
- Influence: Parameterized tests across donation tiers, levels, election proximity corners (0, 13, 26, 39, 52 weeks), composite weight extremes, reputation boundaries, fairness floor scenarios.
- Probability: Each legislation type + spending tiers + proximity extremes + reputation & influence scaling + seed determinism.
- Snapshot parity: Ensure fairness floor retains ≥90% previous snapshot after recomputation.
- Monotonicity: Increasing donation or composite weight should not decrease final influence (post-compression monotonic).

## 10. Implementation Order
1. Types & breakdown interfaces (Todo 4).  
2. Helpers (pure functions).  
3. Influence baseline function.  
4. Lobbying probability wrapper.  
5. Test suite.  
6. Documentation linking (POLITICS_SCALING.md).  

## 11. Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Over-scaling composite weight | Dominates donation influence | Tune STATE_SCALE via test benchmarks (target median stateComposite ≈ mid-level donation of ~$10k at L3) |
| Election bonus too strong | Distorts off-cycle play | Quadratic weighting limits early-cycle effect |
| Reputation linearity simplistic | Lacks diminishing returns | Plan logistic upgrade in 001B |
| Fairness floor inflation | Reduces competitive differentiation | Keep retention at 90%; cap levelMinimums to balanced values |
| Hash collisions jitter | Repeated jitter patterns | Use 32-bit hash; small variance minimized impact |

## 12. Finalization Criteria
Spec considered final when:  
- All constants reviewed and tuned (STATE_SCALE, ELECTION_MAX_BONUS, SOFT_CAP_TARGET, levelMinimums).  
- Acceptance criteria aligned with parity checklist items.  
- No duplication of legacy formulas.  
- Determinism validated via test harness.  
- Documentation cross-linked (checklist ↔ spec ↔ scaling doc).  

---
*Draft prepared under ECHO v1.3.0 + GUARDIAN Protocol. Pending review before implementation.*
