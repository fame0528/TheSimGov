# TIME_SYSTEM (168× Accelerated Model)

## Overview
- 1 real hour = 1 game week
- 1 game year = 52 weeks = 52 real hours
- Deterministic and centralized: all conversions live in `src/politics/utils/timeScaling.ts`

## Key Constants
- `REAL_MS_PER_HOUR = 3_600_000`
- `GAME_WEEKS_PER_REAL_HOUR = 1`
- `GAME_WEEKS_PER_YEAR = 52`

## Conversions
- Real ms → Game weeks: `weeks = ms / REAL_MS_PER_HOUR`
- Game weeks → Real ms: `ms = weeks * REAL_MS_PER_HOUR`
- Real minutes → Game weeks: `minutes * 60_000 / REAL_MS_PER_HOUR`
- Real hours → Game weeks: `hours * 1`

## Scheduling Helpers
- Current game week (from epoch): `getCurrentGameWeek(nowMs, epochMs)`
- Add weeks: `addGameWeeks(week, add)`
- Next interval week: `nextIntervalWeek(fromWeek, intervalWeeks, offset)`

## Election Cadence (Weeks)
- House: `nextHouseElectionWeek(from)` → every `104` weeks
- President: `nextPresidentialElectionWeek(from)` → every `208` weeks
- Governor: `nextGovernorElectionWeek(from, 2|4)` → `104` or `208` weeks
- Senate: `nextSenateElectionWeek(from, class)` → cycle `312` weeks with offsets:
  - Class I: offset `0`
  - Class II: offset `104`
  - Class III: offset `208`

## Campaign Phases (26h Real = 26 Weeks Game)
`computeCampaignPhases(startWeek)`
- Splits 26 weeks into 4 phases of ~6–7 weeks each: Early, Mid, Late, Final
- Returns integral boundaries to fully cover the window

## Rationale
- Centralizing time math enforces DRY and prevents desyncs
- Pure functions enable deterministic testing and reproducibility
- Epoch parameterization allows consistent unit tests without wall-clock dependence

## Usage Example
```ts
import { getCurrentGameWeek, nextHouseElectionWeek } from '@/src/politics/utils/timeScaling';

const now = Date.now();
const gameWeek = getCurrentGameWeek(now, 0);
const nextHouse = nextHouseElectionWeek(gameWeek);
```
