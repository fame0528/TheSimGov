# Political Influence Legacy Parity Checklist

**FID:** FID-20251125-001A  
**Date:** 2025-11-25  
**Scope:** Baseline legacy constants & formulas extracted from `src/lib/utils/politicalinfluence.ts` to drive Phase 4 (Influence & Lobbying baseline) specification and acceptance criteria.

---
## 1. Capability Map (POLITICAL_INFLUENCE)
Legacy level-based political capability grid (all retained):
| Level | canDonate | maxDonation | canLobby | lobbyingPowerPoints | tradePolicy | taxPolicy | govContractAccess | canRunForOffice |
|-------|-----------|-------------|----------|--------------------|------------|-----------|------------------|-----------------|
| 1     | false     | 0           | false    | 0                  | false      | false     | true             | false           |
| 2     | true      | 5,000       | false    | 0                  | false      | false     | true             | false           |
| 3     | true      | 50,000      | true     | 10                 | false      | false     | true             | true            |
| 4     | true      | 500,000     | true     | 50                 | true       | true      | true             | true            |
| 5     | true      | 10,000,000  | true     | 200                | true       | true      | true             | true            |

Acceptance Parity: Level thresholds, donation caps, lobbying points, policy influence flags, office eligibility preserved exactly.

---
## 2. Donation Influence Formula
```
if amount < 100 → 0 influence
baseInfluence = log10(amount / 100) * 10
levelMultiplier = {1:1.0,2:1.2,3:1.5,4:2.0,5:3.0}
legacyDonationInfluence = floor(baseInfluence * levelMultiplier)
```
Retention: Logarithmic scaling & level multipliers unchanged.  
Extension Targets (Phase 4): Incorporate `compositeInfluenceWeight` (state metrics) + election proximity factor BEFORE clamp; introduce fairness floor.

---
## 3. Lobbying Success Probability Factors
Legacy components inside `getLobbyingSuccessProbability`:
| Component | Formula / Mapping | Notes |
|-----------|-------------------|-------|
| baseProbability | by LegislationType: Tax:50, Subsidy:60, Regulation:45, Trade:40, Labor:55, Environment:35 | Difficulty baseline |
| levelBonus | (level - 3) * 5 | Only benefits > L3 |
| spendingBonus | log10(influencePointsCost + 1) * 10 | Diminishing returns |
| influenceBonus | floor(totalInfluence / 50) | Long-term accumulation |
| reputationBonus | max(0, reputation - 50) * 0.5 | Reputation threshold 50 |
| clamp | min(95, max(5, sum)) | Enforced 5–95 bounds |
| rounding | round(totalProbability) | Integer percent |

Parity Acceptance: All legacy factor formulas & ranges preserved.  
Extension Targets: Add state composite contribution + election proximity multiplier + deterministic seed micro-variance (bounded ±1%) while preserving final 5–95 clamp.

---
## 4. Total Influence Aggregation
```
donationInfluence = legacyDonationInfluence(totalDonations, level)
lobbyingInfluence = successfulLobbies * 25
baseLevelInfluence = lobbyingPowerPoints(level)
legacyTotalInfluence = donationInfluence + lobbyingInfluence + baseLevelInfluence
```
Parity Acceptance: Keep 25 per successful lobby and base level points table.  
Extension Targets: Introduce state composite scaling & recent-cycle activity modifier (e.g., weighted by weeks since last election) for future advanced phases (deferred beyond baseline).

---
## 5. Action Eligibility Derivation
Actions derived from capability booleans:
```
[ 'donate', 'lobby', 'trade-policy', 'tax-policy', 'run-for-office' ]
```
Parity Acceptance: Retain mapping logic exactly.

---
## 6. Gaps Identified (To Be Added in Baseline Spec)
| Gap | Planned Addition (Baseline) | Status |
|-----|-----------------------------|--------|
| State metrics usage | Integrate `compositeInfluenceWeight` into donation influence result | Pending Spec |
| Election proximity | Multiplier based on weeks until next relevant office election | Pending Spec |
| Determinism seed | Seed parameter for optional micro-jitter & reproducibility | Pending Spec |
| Breakdown transparency | Structured component breakdown return type for influence & probability | Pending Spec |
| Offline fairness clamp | Post-aggregation minimum floor per level to prevent stagnation while offline | Pending Spec |
| Reputation normalization | Shift from raw (reputation - 50)*0.5 to bounded sigmoid or tier scaling (evaluation) | Pending Spec |
| Advanced modifiers | Polling momentum, endorsement boosts, scandal penalties | Deferred (001B) |

---
## 7. Baseline Influence Function Acceptance Criteria (Draft)
A. Accepts `BaseInfluenceInputs` (donationAmount, companyLevel, compositeInfluenceWeight, weeksToElection, reputation, seed).
B. Returns `InfluenceResult` ({ total, components: { donationLog, levelMultiplier, stateComposite, electionProximity, reputationFactor, fairnessClamp }, seed }).
C. Deterministic for identical input sets (including seed).  
D. Applies order: donationLog → levelMultiplier → + stateComposite scaled → + electionProximity factor → + reputationFactor → apply diminishing returns curve (log or soft cap) → fairnessClamp.  
E. No negative values; final result integer ≥ 0.  
F. Unit tests cover min donation (<100), large donation, high composite weight, near-election (weeksToElection ≤ 2), far-election (≥ 52), boundary reputation (49,50,90), seed reproducibility.

---
## 8. Baseline Lobbying Probability Acceptance Criteria (Draft)
A. Wrapper uses legacy components unchanged (difficulty, levelBonus, spendingBonus, influenceBonus, reputationBonus).  
B. Adds: stateCompositeContribution = floor(compositeInfluenceWeight * 10).  
C. Adds: electionProximityBonus = clamp( (maxWeeksWindow - weeksToElection) / maxWeeksWindow * 5, 0, 5 ).  
D. Optional seed micro-variance: ±1% applied before final clamp (reproducible via seed).  
E. Returns `LobbyingProbabilityBreakdown` with all component values pre-clamp & final probability.  
F. Preserves final 5–95 clamp exactly.  
G. Tests for each legislation type, min/max spending, high totalInfluence, high reputation, near vs far election, seed stability.

---
## 9. Test Coverage Targets
| Area | Target Cases |
|------|--------------|
| Donation Influence | <100, 100, 10k, 100k, 1M; levels 1–5; composite weight extremes (min/max) |
| Lobbying Probability | Each legislation type; spending {0,5,25,100}; reputation {40,50,90}; influence totals {0,49,50,500}; election weeks {1,4,26,52}; seed reproducibility |
| Clamp Logic | Probability lower bound (constructed minimal inputs) & upper bound (max stacked bonuses) |
| Determinism | Same input+seed yields identical result; different seed changes only jitter component |

---
## 10. DRY & Utility Reuse Plan
- Reuse `calculateInfluencePoints` for donation log portion (without reimplementing formula).  
- Reuse upcoming scheduling helpers (`nextElectionWeekForOffice`, `describeNextElection`) for `weeksToElection`.  
- Reuse `stateDerivedMetrics` for composite weight (no duplication).  
- Extract small pure helpers (`computeElectionProximityFactor`, `applyFairnessClamp`) if needed—single source of truth.

---
## 11. Next Steps
1. Finalize spec wording (Tasks 2 & 3).  
2. Introduce new types (Task 4).  
3. Implement baseline functions (Tasks 5 & 6) with breakdown returns.  
4. Add test suite (Task 7).  
5. Document formulas in `POLITICS_SCALING.md` and link from FID file.  

---
*Prepared under ECHO v1.3.0 + GUARDIAN Protocol. Legacy parity checklist informs baseline spec before implementation to ensure zero drift and deterministic reproducibility.*
