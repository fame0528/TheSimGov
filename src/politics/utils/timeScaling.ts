/**
 * OVERVIEW
 * 168× accelerated time model helpers.
 * - 1 real hour = 1 game week
 * - 1 game year = 52 weeks = 52 real hours
 * All helpers are pure and side-effect free.
 */

import type { GameWeekIndex, RealMilliseconds, SenateClass, PoliticalOffice } from '../types/politicsTypes';
import { PoliticalOfficeKind } from '../types/politicsTypes';

export const ACCELERATION_X = 168; // informational: real hours per game week mapping
export const REAL_MS_PER_MINUTE = 60_000;
export const REAL_MS_PER_HOUR = 3_600_000; // 60 * 60 * 1000
export const GAME_WEEKS_PER_REAL_HOUR = 1; // per model definition
export const GAME_WEEKS_PER_YEAR = 52;

/**
 * Convert real milliseconds to game weeks (floating), based on 1h → 1 week.
 */
export function realMsToGameWeeks(ms: RealMilliseconds): number {
  return ms / REAL_MS_PER_HOUR * GAME_WEEKS_PER_REAL_HOUR;
}

/**
 * Convert game weeks (floating) to real milliseconds.
 */
export function gameWeeksToRealMs(weeks: number): RealMilliseconds {
  return (weeks / GAME_WEEKS_PER_REAL_HOUR) * REAL_MS_PER_HOUR;
}

/**
 * Current game week index from a real-time clock and an epoch.
 * Defaults: now = Date.now(), epochMs = 0 for deterministic tests.
 */
export function getCurrentGameWeek(nowMs: RealMilliseconds = Date.now(), epochMs: RealMilliseconds = 0): GameWeekIndex {
  const delta = nowMs - epochMs;
  return Math.floor(realMsToGameWeeks(delta));
}

/** Add integer game weeks to an index. */
export function addGameWeeks(week: GameWeekIndex, add: number): GameWeekIndex {
  return week + Math.trunc(add);
}

/** The next multiple of `intervalWeeks` strictly greater than `fromWeek`. */
export function nextIntervalWeek(fromWeek: GameWeekIndex, intervalWeeks: number, offset = 0): GameWeekIndex {
  const relative = fromWeek - offset;
  const nextK = Math.floor(relative / intervalWeeks) + 1;
  return offset + nextK * intervalWeeks;
}

// Election helpers

/** House: 2-year cycle → 104 weeks. */
export function nextHouseElectionWeek(fromWeek: GameWeekIndex): GameWeekIndex {
  return nextIntervalWeek(fromWeek, 2 * GAME_WEEKS_PER_YEAR, 0);
}

/** President: 4-year cycle → 208 weeks. */
export function nextPresidentialElectionWeek(fromWeek: GameWeekIndex): GameWeekIndex {
  return nextIntervalWeek(fromWeek, 4 * GAME_WEEKS_PER_YEAR, 0);
}

/** Governor: configurable term length in years (2 or 4). */
export function nextGovernorElectionWeek(fromWeek: GameWeekIndex, termYears: 2 | 4): GameWeekIndex {
  return nextIntervalWeek(fromWeek, termYears * GAME_WEEKS_PER_YEAR, 0);
}

/**
 * Senate classes: 6-year cycle → 312 weeks total with 3 classes staggered by ~2 years.
 * We model classes as offsets on a 312-week modulus: Class I = +0, Class II = +104, Class III = +208.
 */
export function nextSenateElectionWeek(fromWeek: GameWeekIndex, senateClass: SenateClass): GameWeekIndex {
  const cycle = 6 * GAME_WEEKS_PER_YEAR; // 312
  const offset = senateClass === 1 ? 0 : senateClass === 2 ? 2 * GAME_WEEKS_PER_YEAR : 4 * GAME_WEEKS_PER_YEAR;
  return nextIntervalWeek(fromWeek, cycle, offset);
}

/**
 * Utility helpers for minutes/hours conversions in real time (informational convenience).
 */
export function realMinutesToGameWeeks(minutes: number): number {
  return realMsToGameWeeks(minutes * REAL_MS_PER_MINUTE);
}

export function realHoursToGameWeeks(hours: number): number {
  return realMsToGameWeeks(hours * REAL_MS_PER_HOUR);
}

/** Convert game years to weeks. */
export function gameYearsToWeeks(years: number): number {
  return years * GAME_WEEKS_PER_YEAR;
}

/** Convert weeks to whole game years (floored) and remainder weeks. */
export function splitWeeksToYearsWeeks(totalWeeks: number): { years: number; weeks: number } {
  const years = Math.floor(totalWeeks / GAME_WEEKS_PER_YEAR);
  const weeks = totalWeeks - years * GAME_WEEKS_PER_YEAR;
  return { years, weeks };
}

/**
 * Derive campaign phase boundaries for a 26h (26-week) cycle split into 4×6.5h (~6–7 week) phases.
 * Returns integral week boundaries using floor/ceil to ensure coverage.
 */
export function computeCampaignPhases(startWeek: GameWeekIndex): { early: [GameWeekIndex, GameWeekIndex]; mid: [GameWeekIndex, GameWeekIndex]; late: [GameWeekIndex, GameWeekIndex]; final: [GameWeekIndex, GameWeekIndex] } {
  const total = 26; // weeks
  const slice = total / 4; // 6.5
  const w0 = startWeek;
  const w1 = Math.round(w0 + slice);
  const w2 = Math.round(w0 + slice * 2);
  const w3 = Math.round(w0 + slice * 3);
  const w4 = w0 + total;
  return {
    early: [w0, w1],
    mid: [w1, w2],
    late: [w2, w3],
    final: [w3, w4],
  };
}

/**
 * Notes
 * - Keep all time math centralized here to satisfy ECHO DRY & contract rules.
 * - Epoch remains configurable per caller to allow deterministic tests.
 */

// ===================== AGGREGATED SCHEDULING HELPERS =====================

/**
 * Compute the next election week for a given political office, delegating to
 * specific cycle helpers. Supports House, Senate (requires senateClass),
 * Governor (termYears), President. For offices without explicit cycles
 * (Legislature, Mayor), falls back to termYears if provided or defaults to 2 years.
 */
export function nextElectionWeekForOffice(fromWeek: GameWeekIndex, office: PoliticalOffice): GameWeekIndex {
  switch (office.kind) {
    case PoliticalOfficeKind.House:
      return nextHouseElectionWeek(fromWeek);
    case PoliticalOfficeKind.Senate: {
      if (!office.senateClass) throw new Error('Senate office requires senateClass to compute next election week');
      return nextSenateElectionWeek(fromWeek, office.senateClass);
    }
    case PoliticalOfficeKind.Governor:
      return nextGovernorElectionWeek(fromWeek, office.termYears === 4 ? 4 : 2);
    case PoliticalOfficeKind.President:
      return nextPresidentialElectionWeek(fromWeek);
    case PoliticalOfficeKind.Legislature:
    case PoliticalOfficeKind.Mayor:
      // Use provided termYears or default 2.
      return nextGovernorElectionWeek(fromWeek, office.termYears === 4 ? 4 : 2);
    default:
      throw new Error(`Unsupported office kind: ${office.kind}`);
  }
}

/**
 * Produce a sequence of upcoming Senate election weeks for a given class.
 * `cycles` controls how many future elections to list (default 3).
 */
export function senateClassCycle(fromWeek: GameWeekIndex, senateClass: SenateClass, cycles = 3): GameWeekIndex[] {
  const weeks: GameWeekIndex[] = [];
  let cursor = fromWeek;
  for (let i = 0; i < cycles; i++) {
    const next = nextSenateElectionWeek(cursor, senateClass);
    weeks.push(next);
    cursor = next; // advance to just before next cycle computation
  }
  return weeks;
}

/**
 * Convert a future election week into real-hour projection using core scaling.
 */
export function electionWeekToRealHours(week: GameWeekIndex): number {
  return week; // 1 week per real hour per acceleration model
}

/**
 * High-level descriptor combining next election week and real-hour projection.
 */
export function describeNextElection(fromWeek: GameWeekIndex, office: PoliticalOffice) {
  const nextWeek = nextElectionWeekForOffice(fromWeek, office);
  return {
    nextWeek,
    realHoursUntil: nextWeek - fromWeek,
    cyclesFromNow: nextWeek - fromWeek,
  };
}

// ===================== END AGGREGATED SCHEDULING HELPERS =====================
