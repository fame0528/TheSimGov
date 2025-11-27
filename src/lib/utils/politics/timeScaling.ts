/**
 * @fileoverview Political Time Scaling Utilities
 * 
 * OVERVIEW:
 * Provides deterministic time conversion utilities for 168x accelerated political simulation.
 * Converts between real-world time and game time for elections, campaigns, voting windows,
 * and legislative cycles. All political timing calculations MUST use these utilities to
 * ensure consistency across the entire system.
 * 
 * TIME ACCELERATION MODEL:
 * - Real time multiplier: 168x (1 real hour = 1 game week = 168 game hours)
 * - 1 game day = 8.571 real minutes (514.3 seconds)
 * - 1 game week = 1 real hour (60 minutes)
 * - 1 game month = ~4.35 real hours
 * - 1 game year = ~2.18 real days (52.14 hours)
 * 
 * CRITICAL ELECTION TIMINGS:
 * - Campaign cycle: 26 game hours = ~9.29 real minutes
 * - Voting window: 24 game hours (1 game day) = ~8.57 real minutes
 * - Polling interval: 25 real minutes = ~70 game hours (2.92 game days)
 * - Senate term: 6 game years = ~14.9 real days
 * - House term: 2 game years = ~4.96 real days
 * - Presidential term: 4 game years = ~9.93 real days
 * 
 * @created 2025-11-25
 * @version 1.0.0
 */

/**
 * Time acceleration multiplier: 168x
 * 1 real hour = 1 game week = 168 game hours
 */
export const TIME_MULTIPLIER = 168;

/**
 * Milliseconds in 1 real hour (base unit for conversions)
 */
const MS_PER_REAL_HOUR = 60 * 60 * 1000;

/**
 * Milliseconds in 1 game hour (at 168x acceleration)
 */
const MS_PER_GAME_HOUR = MS_PER_REAL_HOUR / TIME_MULTIPLIER;

/**
 * Game time duration constants (in game hours)
 */
export const GAME_TIME = {
  HOUR: 1,
  DAY: 24,
  WEEK: 168,
  MONTH: 730, // ~30.42 days
  YEAR: 8760, // 365 days
} as const;

/**
 * Real time duration constants (in milliseconds)
 */
export const REAL_TIME = {
  MINUTE: 60 * 1000,
  HOUR: MS_PER_REAL_HOUR,
  DAY: 24 * MS_PER_REAL_HOUR,
} as const;

/**
 * Political cycle constants (in game hours)
 */
export const POLITICAL_CYCLES = {
  CAMPAIGN_DURATION: 26, // 26 game hours
  VOTING_WINDOW: 24, // 24 game hours (1 game day)
  POLLING_INTERVAL: 70, // ~70 game hours (2.92 game days)
  SENATE_TERM: 6 * GAME_TIME.YEAR, // 6 game years
  HOUSE_TERM: 2 * GAME_TIME.YEAR, // 2 game years
  PRESIDENTIAL_TERM: 4 * GAME_TIME.YEAR, // 4 game years
  DEBATE_DURATION: 2, // 2 game hours
  SCANDAL_DURATION: 168, // 1 game week
} as const;

/**
 * Convert real-world milliseconds to game hours
 * 
 * @param realMs - Real-world time in milliseconds
 * @returns Game time in hours (fractional)
 * 
 * @example
 * // 1 real hour = 168 game hours
 * realToGameHours(3600000) // 168
 * 
 * // 30 real minutes = 84 game hours
 * realToGameHours(1800000) // 84
 */
export function realToGameHours(realMs: number): number {
  return (realMs / MS_PER_REAL_HOUR) * TIME_MULTIPLIER;
}

/**
 * Convert game hours to real-world milliseconds
 * 
 * @param gameHours - Game time in hours
 * @returns Real-world time in milliseconds
 * 
 * @example
 * // 168 game hours = 1 real hour
 * gameToRealMs(168) // 3600000
 * 
 * // 24 game hours = ~8.57 real minutes
 * gameToRealMs(24) // 514285.71...
 */
export function gameToRealMs(gameHours: number): number {
  return (gameHours / TIME_MULTIPLIER) * MS_PER_REAL_HOUR;
}

/**
 * Convert real-world Date to game time hours since epoch
 * 
 * @param realDate - Real-world Date object
 * @returns Game hours since Unix epoch
 * 
 * @example
 * const now = new Date();
 * const gameHours = realDateToGameHours(now);
 */
export function realDateToGameHours(realDate: Date): number {
  return realToGameHours(realDate.getTime());
}

/**
 * Convert game hours since epoch to real-world Date
 * 
 * @param gameHours - Game hours since Unix epoch
 * @returns Real-world Date object
 * 
 * @example
 * const gameHours = 1000000;
 * const realDate = gameHoursToRealDate(gameHours);
 */
export function gameHoursToRealDate(gameHours: number): Date {
  return new Date(gameToRealMs(gameHours));
}

/**
 * Calculate campaign cycle duration in real time
 * 
 * @returns Campaign duration in milliseconds (real time)
 * 
 * @example
 * // 26 game hours = ~9.29 real minutes
 * getCampaignDurationMs() // 557142.857...
 */
export function getCampaignDurationMs(): number {
  return gameToRealMs(POLITICAL_CYCLES.CAMPAIGN_DURATION);
}

/**
 * Calculate voting window duration in real time
 * 
 * @returns Voting window in milliseconds (real time)
 * 
 * @example
 * // 24 game hours = ~8.57 real minutes
 * getVotingWindowMs() // 514285.71...
 */
export function getVotingWindowMs(): number {
  return gameToRealMs(POLITICAL_CYCLES.VOTING_WINDOW);
}

/**
 * Calculate polling interval in real time
 * 
 * @returns Polling interval in milliseconds (real time)
 * 
 * @example
 * // 70 game hours = ~25 real minutes
 * getPollingIntervalMs() // 1500000
 */
export function getPollingIntervalMs(): number {
  return gameToRealMs(POLITICAL_CYCLES.POLLING_INTERVAL);
}

/**
 * Calculate Senate term duration in real time
 * 
 * @returns Senate term in milliseconds (real time)
 * 
 * @example
 * // 6 game years = ~14.9 real days
 * getSenateTermMs() // 1287428571.428...
 */
export function getSenateTermMs(): number {
  return gameToRealMs(POLITICAL_CYCLES.SENATE_TERM);
}

/**
 * Calculate House term duration in real time
 * 
 * @returns House term in milliseconds (real time)
 * 
 * @example
 * // 2 game years = ~4.96 real days
 * getHouseTermMs() // 429142857.142...
 */
export function getHouseTermMs(): number {
  return gameToRealMs(POLITICAL_CYCLES.HOUSE_TERM);
}

/**
 * Calculate Presidential term duration in real time
 * 
 * @returns Presidential term in milliseconds (real time)
 * 
 * @example
 * // 4 game years = ~9.93 real days
 * getPresidentialTermMs() // 858285714.285...
 */
export function getPresidentialTermMs(): number {
  return gameToRealMs(POLITICAL_CYCLES.PRESIDENTIAL_TERM);
}

/**
 * Calculate when next election occurs for given office
 * 
 * @param currentGameHours - Current time in game hours
 * @param officeType - Type of political office ('senate' | 'house' | 'president')
 * @param senateClass - Senate class (1, 2, or 3) - only for Senate elections
 * @returns Game hours until next election
 * 
 * @example
 * const current = realDateToGameHours(new Date());
 * const nextSenate = getNextElectionGameHours(current, 'senate', 1);
 * const nextHouse = getNextElectionGameHours(current, 'house');
 */
export function getNextElectionGameHours(
  currentGameHours: number,
  officeType: 'senate' | 'house' | 'president',
  senateClass?: 1 | 2 | 3
): number {
  let termLength: number;

  switch (officeType) {
    case 'senate':
      termLength = POLITICAL_CYCLES.SENATE_TERM;
      break;
    case 'house':
      termLength = POLITICAL_CYCLES.HOUSE_TERM;
      break;
    case 'president':
      termLength = POLITICAL_CYCLES.PRESIDENTIAL_TERM;
      break;
  }

  // Calculate next election cycle
  const cyclesSinceEpoch = Math.floor(currentGameHours / termLength);
  let nextElection = (cyclesSinceEpoch + 1) * termLength;

  // For Senate, adjust based on class rotation
  if (officeType === 'senate' && senateClass) {
    // Senate classes are staggered by 2 years each
    const classOffset = (senateClass - 1) * (2 * GAME_TIME.YEAR);
    nextElection += classOffset;

    // Ensure we get the NEXT election for this class
    while (nextElection <= currentGameHours) {
      nextElection += termLength;
    }
  }

  return nextElection;
}

/**
 * Calculate game hours remaining until deadline
 * 
 * @param deadlineDate - Deadline as real-world Date
 * @param currentDate - Current time as real-world Date (defaults to now)
 * @returns Game hours remaining (0 if deadline passed)
 * 
 * @example
 * const deadline = new Date('2025-12-01T00:00:00Z');
 * const remaining = getGameHoursUntilDeadline(deadline);
 */
export function getGameHoursUntilDeadline(
  deadlineDate: Date,
  currentDate: Date = new Date()
): number {
  const remainingMs = deadlineDate.getTime() - currentDate.getTime();
  if (remainingMs <= 0) return 0;
  return realToGameHours(remainingMs);
}

/**
 * Calculate real-world Date for game hours from now
 * 
 * @param gameHoursFromNow - Game hours to add to current time
 * @param fromDate - Starting date (defaults to now)
 * @returns Future real-world Date
 * 
 * @example
 * // Get real-world time when 24-hour voting window ends
 * const votingEnds = getFutureDateFromGameHours(24);
 */
export function getFutureDateFromGameHours(
  gameHoursFromNow: number,
  fromDate: Date = new Date()
): Date {
  const realMs = gameToRealMs(gameHoursFromNow);
  return new Date(fromDate.getTime() + realMs);
}

/**
 * Check if currently within voting window for given deadline
 * 
 * @param votingDeadline - Voting deadline as real-world Date
 * @param currentDate - Current time (defaults to now)
 * @returns True if voting window is open
 * 
 * @example
 * const deadline = new Date('2025-12-01T12:00:00Z');
 * const canVote = isVotingWindowOpen(deadline);
 */
export function isVotingWindowOpen(
  votingDeadline: Date,
  currentDate: Date = new Date()
): boolean {
  return currentDate < votingDeadline;
}

/**
 * Format game hours as human-readable duration
 * 
 * @param gameHours - Game time in hours
 * @returns Formatted string (e.g., "2 years, 3 months", "5 days, 12 hours")
 * 
 * @example
 * formatGameDuration(8760) // "1 year"
 * formatGameDuration(200) // "8 days, 8 hours"
 */
export function formatGameDuration(gameHours: number): string {
  const years = Math.floor(gameHours / GAME_TIME.YEAR);
  const remainingAfterYears = gameHours % GAME_TIME.YEAR;
  const months = Math.floor(remainingAfterYears / GAME_TIME.MONTH);
  const remainingAfterMonths = remainingAfterYears % GAME_TIME.MONTH;
  const days = Math.floor(remainingAfterMonths / GAME_TIME.DAY);
  const hours = Math.floor(remainingAfterMonths % GAME_TIME.DAY);

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0 && years === 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);

  return parts.length > 0 ? parts.join(', ') : '0 hours';
}

/**
 * Format real-world milliseconds as human-readable duration
 * 
 * @param realMs - Real time in milliseconds
 * @returns Formatted string (e.g., "5 minutes", "2 hours, 30 minutes")
 * 
 * @example
 * formatRealDuration(300000) // "5 minutes"
 * formatRealDuration(9000000) // "2 hours, 30 minutes"
 */
export function formatRealDuration(realMs: number): string {
  const days = Math.floor(realMs / REAL_TIME.DAY);
  const remainingAfterDays = realMs % REAL_TIME.DAY;
  const hours = Math.floor(remainingAfterDays / REAL_TIME.HOUR);
  const remainingAfterHours = remainingAfterDays % REAL_TIME.HOUR;
  const minutes = Math.floor(remainingAfterHours / REAL_TIME.MINUTE);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

  return parts.length > 0 ? parts.join(', ') : '0 minutes';
}

// ============================================================================
// IMPLEMENTATION NOTES
// ============================================================================
// 
// 1. TIME CONSISTENCY:
//    All political timing calculations MUST use these utilities. Do NOT
//    hardcode time calculations elsewhere - this creates formula drift.
// 
// 2. PRECISION:
//    Game hours are stored as floating-point numbers to preserve precision
//    across long time periods. Millisecond precision is maintained through
//    conversions.
// 
// 3. SENATE CLASS ROTATION:
//    Senate elections are staggered across 3 classes (1/3 of seats every 2 years).
//    Class 1 elected in years 0, 6, 12...
//    Class 2 elected in years 2, 8, 14...
//    Class 3 elected in years 4, 10, 16...
// 
// 4. OFFLINE PROTECTION:
//    Campaign and voting windows are designed to accommodate offline players.
//    9-minute campaigns ensure players can participate without being online 24/7.
//    Polling at 25-minute intervals balances responsiveness with fairness.
// 
// 5. FORMULA LOCK:
//    These formulas are LOCKED after Phase 2 documentation. Any changes require
//    explicit change control and regression testing to prevent breaking existing
//    political mechanics.
// 
// ============================================================================
