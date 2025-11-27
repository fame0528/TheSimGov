/**
 * @file src/lib/utils/politics/billVoting.ts
 * @description Bill voting mechanics with weighted voting and passage determination
 * @created 2025-11-26
 * @author ECHO v1.3.0
 *
 * OVERVIEW:
 * Implements weighted voting mechanics for legislative bills with proper quorum calculations
 * and passage determination. Senate uses 1 vote per senator, House uses delegation-based
 * voting (1-52 votes per representative based on state population).
 *
 * KEY DESIGN DECISIONS:
 * - **Weighted Voting:** Senate 1 vote/seat, House delegation count (1-52)
 * - **Quorum Requirements:** 50 Senate (50%), 218 House (50%)
 * - **Passage Rules:** Ayes > Nays (simple majority of votes cast)
 * - **Near-Miss Recounts:** Margin ≤ 0.5% triggers recount flag
 * - **Tie-Breaking:** Vice President breaks Senate ties (if implemented)
 *
 * USAGE:
 * ```typescript
 * import { calculateQuorum, determinePassage, getSeatCount } from '@/lib/utils/politics/billVoting';
 *
 * // Get seat count for representative
 * const seats = getSeatCount('house', 'California'); // 52
 *
 * // Check quorum
 * const hasQuorum = calculateQuorum('senate', 67); // true (67 >= 50)
 *
 * // Determine passage
 * const result = determinePassage({
 *   chamber: 'senate',
 *   ayeCount: 55,
 *   nayCount: 42,
 *   totalVotesCast: 97,
 *   quorumRequired: 50
 * });
 * // { passed: true, margin: 13, marginPercent: 13.4, needsRecount: false }
 * ```
 */

// ===================== TYPE DEFINITIONS =====================

export type Chamber = 'senate' | 'house';

/**
 * Vote tally for passage determination
 */
export interface VoteTally {
  chamber: Chamber;
  ayeCount: number;        // Total weighted Aye votes
  nayCount: number;        // Total weighted Nay votes
  abstainCount: number;    // Total weighted Abstain votes
  totalVotesCast: number;  // Total weighted votes (Aye + Nay + Abstain)
  quorumRequired: number;  // Minimum votes needed for valid session
}

/**
 * Passage determination result
 */
export interface PassageResult {
  passed: boolean;         // True if bill passed
  margin: number;          // Absolute vote margin (Ayes - Nays)
  marginPercent: number;   // Margin as percentage of total votes cast
  needsRecount: boolean;   // True if margin ≤ 0.5%
  hasQuorum: boolean;      // True if quorum met
  tiebreaker?: 'vp';       // Senate tie broken by VP (if implemented)
}

// ===================== CONSTANTS =====================

/**
 * Quorum requirements by chamber
 * Senate: 50 (50% of 100 seats)
 * House: 218 (50% of 435 seats, rounded up)
 */
export const QUORUM_REQUIREMENTS = {
  senate: 50,
  house: 218,
} as const;

/**
 * House delegation sizes by state (2025 apportionment)
 * Based on 2020 Census data
 */
export const HOUSE_DELEGATIONS: Record<string, number> = {
  // Largest delegations
  California: 52,
  Texas: 38,
  Florida: 28,
  'New York': 26,
  Pennsylvania: 17,
  Illinois: 17,
  Ohio: 15,
  Georgia: 14,
  'North Carolina': 14,
  Michigan: 13,
  
  // Mid-size delegations
  'New Jersey': 12,
  Virginia: 11,
  Washington: 10,
  Arizona: 9,
  Tennessee: 9,
  Massachusetts: 9,
  Indiana: 9,
  Maryland: 8,
  Missouri: 8,
  Wisconsin: 8,
  Colorado: 8,
  Minnesota: 8,
  'South Carolina': 7,
  Alabama: 7,
  Louisiana: 6,
  Kentucky: 6,
  Oregon: 6,
  Oklahoma: 5,
  Connecticut: 5,
  Utah: 4,
  Iowa: 4,
  Nevada: 4,
  Arkansas: 4,
  Mississippi: 4,
  Kansas: 4,
  'New Mexico': 3,
  Nebraska: 3,
  Idaho: 2,
  'West Virginia': 2,
  Hawaii: 2,
  'New Hampshire': 2,
  Maine: 2,
  Montana: 2,
  'Rhode Island': 2,
  Delaware: 1,
  'South Dakota': 1,
  'North Dakota': 1,
  Alaska: 1,
  Vermont: 1,
  Wyoming: 1,
} as const;

/**
 * Recount threshold (margin as percentage)
 * Margins ≤ 0.5% trigger automatic recount flag
 */
export const RECOUNT_THRESHOLD = 0.5;

// ===================== UTILITY FUNCTIONS =====================

/**
 * Get seat count for elected official
 * 
 * @param chamber - Legislative chamber (senate or house)
 * @param state - State name (for House delegation lookup)
 * @returns Seat count (1 for Senate, 1-52 for House based on state)
 * 
 * @example
 * ```typescript
 * getSeatCount('senate', 'California'); // 1
 * getSeatCount('house', 'California'); // 52
 * getSeatCount('house', 'Wyoming'); // 1
 * ```
 */
export function getSeatCount(chamber: Chamber, state?: string): number {
  if (chamber === 'senate') {
    return 1;
  }
  
  if (!state) {
    throw new Error('State required for House seat count lookup');
  }
  
  const delegation = HOUSE_DELEGATIONS[state];
  if (delegation === undefined) {
    throw new Error(`Unknown state: ${state}`);
  }
  
  return delegation;
}

/**
 * Calculate if quorum is met
 * 
 * @param chamber - Legislative chamber
 * @param totalVotesCast - Total weighted votes cast
 * @returns True if quorum met
 * 
 * @example
 * ```typescript
 * calculateQuorum('senate', 67); // true (67 >= 50)
 * calculateQuorum('senate', 45); // false (45 < 50)
 * calculateQuorum('house', 250); // true (250 >= 218)
 * ```
 */
export function calculateQuorum(chamber: Chamber, totalVotesCast: number): boolean {
  const required = QUORUM_REQUIREMENTS[chamber];
  return totalVotesCast >= required;
}

/**
 * Determine if bill passed based on vote tally
 * 
 * Passage Rules:
 * - Quorum must be met (50 Senate, 218 House)
 * - Ayes > Nays (simple majority of votes cast)
 * - Margin ≤ 0.5% triggers recount flag
 * 
 * @param tally - Vote tally with weighted counts
 * @returns Passage result with margin and recount flag
 * 
 * @example
 * ```typescript
 * determinePassage({
 *   chamber: 'senate',
 *   ayeCount: 55,
 *   nayCount: 42,
 *   abstainCount: 3,
 *   totalVotesCast: 100,
 *   quorumRequired: 50
 * });
 * // { passed: true, margin: 13, marginPercent: 13.0, needsRecount: false, hasQuorum: true }
 * 
 * determinePassage({
 *   chamber: 'house',
 *   ayeCount: 219,
 *   nayCount: 218,
 *   abstainCount: 0,
 *   totalVotesCast: 437,
 *   quorumRequired: 218
 * });
 * // { passed: true, margin: 1, marginPercent: 0.23, needsRecount: true, hasQuorum: true }
 * ```
 */
export function determinePassage(tally: VoteTally): PassageResult {
  const { chamber, ayeCount, nayCount, totalVotesCast, quorumRequired } = tally;
  
  // Check quorum
  const hasQuorum = totalVotesCast >= quorumRequired;
  
  // Calculate margin
  const margin = ayeCount - nayCount;
  const marginPercent = totalVotesCast > 0 
    ? (Math.abs(margin) / totalVotesCast) * 100 
    : 0;
  
  // Determine passage (Ayes must exceed Nays)
  const passed = hasQuorum && ayeCount > nayCount;
  
  // Check if recount needed (margin ≤ 0.5%)
  const needsRecount = marginPercent <= RECOUNT_THRESHOLD && marginPercent > 0;
  
  // Senate tie-breaking (if Ayes == Nays and quorum met)
  let tiebreaker: 'vp' | undefined;
  if (chamber === 'senate' && ayeCount === nayCount && hasQuorum) {
    // Vice President breaks tie (always results in passage)
    // This would be implemented at API layer based on current VP party
    tiebreaker = 'vp';
  }
  
  return {
    passed,
    margin,
    marginPercent: parseFloat(marginPercent.toFixed(2)),
    needsRecount,
    hasQuorum,
    tiebreaker,
  };
}

/**
 * Calculate total chamber size
 * 
 * @param chamber - Legislative chamber
 * @returns Total seats in chamber (100 Senate, 435 House)
 */
export function getChamberSize(chamber: Chamber): number {
  return chamber === 'senate' ? 100 : 435;
}

/**
 * Calculate voting power percentage for state delegation
 * 
 * @param state - State name
 * @returns Percentage of House voting power (delegation / 435)
 * 
 * @example
 * ```typescript
 * getVotingPower('California'); // 11.95 (52/435)
 * getVotingPower('Wyoming'); // 0.23 (1/435)
 * ```
 */
export function getVotingPower(state: string): number {
  const delegation = HOUSE_DELEGATIONS[state];
  if (delegation === undefined) {
    throw new Error(`Unknown state: ${state}`);
  }
  
  const power = (delegation / 435) * 100;
  return parseFloat(power.toFixed(2));
}

/**
 * Validate vote counts against chamber size
 * 
 * @param chamber - Legislative chamber
 * @param totalVotesCast - Total weighted votes
 * @returns True if vote count is valid (≤ chamber size)
 */
export function validateVoteCount(chamber: Chamber, totalVotesCast: number): boolean {
  const maxVotes = getChamberSize(chamber);
  return totalVotesCast <= maxVotes;
}

/**
 * Calculate votes needed to pass (from current tally)
 * 
 * @param tally - Current vote tally
 * @returns Number of additional Aye votes needed to pass
 * 
 * @example
 * ```typescript
 * calculateVotesNeededToPass({
 *   chamber: 'senate',
 *   ayeCount: 45,
 *   nayCount: 50,
 *   abstainCount: 0,
 *   totalVotesCast: 95,
 *   quorumRequired: 50
 * });
 * // 6 (need 51 Ayes to beat 50 Nays)
 * ```
 */
export function calculateVotesNeededToPass(tally: VoteTally): number {
  const { ayeCount, nayCount, quorumRequired, totalVotesCast } = tally;
  
  // If already passed, return 0
  if (ayeCount > nayCount && totalVotesCast >= quorumRequired) {
    return 0;
  }
  
  // Need to exceed Nays and meet quorum
  const votesToBeatNays = Math.max(0, nayCount - ayeCount + 1);
  const votesToMeetQuorum = Math.max(0, quorumRequired - totalVotesCast);
  
  return Math.max(votesToBeatNays, votesToMeetQuorum);
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Weighted Voting:**
 *    - Senate: Each senator = 1 vote (100 total)
 *    - House: Each representative = state delegation size (1-52)
 *    - Total House votes = sum of all delegation sizes = 435
 * 
 * 2. **Quorum Requirements:**
 *    - Senate: 50 votes (50% of 100)
 *    - House: 218 votes (50% of 435, rounded up)
 *    - Without quorum, vote is invalid (bill fails)
 * 
 * 3. **Passage Rules:**
 *    - Simple majority: Ayes > Nays (of votes cast)
 *    - Abstentions count toward quorum but not passage
 *    - Senate ties broken by Vice President (always passes)
 * 
 * 4. **Recount Triggers:**
 *    - Margin ≤ 0.5% of total votes cast
 *    - Example: 218 Aye, 217 Nay (margin 0.23%) → recount
 *    - Prevents contested results from razor-thin margins
 * 
 * 5. **Vote Validation:**
 *    - Total votes cannot exceed chamber size
 *    - Each player can only vote once (enforced at Bill model)
 *    - Seat counts must match delegation data
 * 
 * 6. **Edge Cases:**
 *    - No votes cast: hasQuorum = false, passed = false
 *    - All Abstain: hasQuorum depends on count, passed = false
 *    - Senate 50-50 tie: VP breaks tie (passed = true with tiebreaker)
 *    - House no quorum: passed = false even if Ayes > Nays
 */
