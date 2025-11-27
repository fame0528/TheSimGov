# Debate & Election Resolution Specification (Phase 4)

**Version:** 1.0.0  
**Created:** November 25, 2025  
**Status:** PLANNED

## Overview
Phase 4 introduces two core systems:
- Debate Engine: performance scoring, persuasion caps (±5%), modifiers for preparation, fatigue, scandals.
- Election Resolution: vote aggregation, weighted delegation (Senate 1/player, House delegation-based), electoral college tally.

## Debate Engine
- Inputs: candidate stats (charisma, knowledge, composure), preparation level, recent events.
- Outputs: performance score (0-100), persuasion delta (±5% cap), momentum impact.
- Determinism: seeded by candidateId + debateId for reproducibility.

## Election Resolution
- Inputs: per-state polling margins, turnout factors, delegation weights.
- Outputs: popular vote totals, seat counts (Senate/House), electoral college tally, winner.
- Determinism: pure functions over provided snapshots; no random.

## Acceptance Criteria
- Persuasion never exceeds ±5% per debate.
- Electoral tally matches deterministic state outcomes.
- House vote uses delegation weights; Senate uses 1 vote per player.
- Comprehensive tests cover edge cases (ties, recount thresholds).
