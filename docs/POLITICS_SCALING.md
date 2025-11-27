# POLITICS_SCALING – Baseline Formulas (Phase 1 Foundation)

This document captures deterministic, human-only scaling foundations used by Phase 1 utilities. Advanced modifiers (endorsements, crises, ads, debates) will compose on top in Phase 2 without redefining baselines.

## Principles
- Human-only multiplayer: no AI/NPC opponents
- Deterministic, pure functions; no hidden randomness in baselines
- Centralized utilities (types, time, derived metrics) to enforce DRY
- Fairness overlays for offline players handled separately (offlineProtection)

## Time Model (Summary)
See `docs/TIME_SYSTEM.md` – all scheduling expressed as `GameWeekIndex` integers.

## Derived Metrics (Planned in Phase 1)
- `populationShare` — state population / national population
- `gdpShare` — state GDP / national GDP
- `seatShare` — (House seats + Senate seats weight) / total seats
- `crimePercentile` — normalized against historical distribution
- `compositeInfluenceWeight` — weighted blend of the above with caps

Normalization rules (guidelines for implementation):
- Clamp any share to [0, 1]
- Use epsilon to avoid division by zero when totals are small
- Normalize percentiles with monotonic mapping; no negative outputs
- Blend weights sum to 1 (e.g., 0.35 pop, 0.35 gdp, 0.20 seats, 0.10 crime)

## Influence & Lobbying Baselines (To be implemented in Phase 1)
- Influence: monotonic function of `compositeInfluenceWeight` with small diminishing returns
- Lobbying: capped logistic on spend, modulated by `compositeInfluenceWeight`
- Output ranges must be bounded (e.g., probabilities in [0.05, 0.95])

## Senate Classes & Cycles
- Classes I/II/III staggered over 6-year (312-week) cycle at offsets 0/104/208
- See helpers in `timeScaling.ts` for next cycle computations

## Testing Requirements
- Unit tests cover edge cases: zero totals, extreme values, and clamping
- Deterministic expected outputs for canonical inputs

## Documentation Guarantees
- No redefinition of baselines in Phase 2 – engagement features call into Phase 1 utilities
- Any change to weights or caps requires update to this document and unit tests
