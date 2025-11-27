/**
 * @fileoverview US House of Representatives Index and Utilities
 * @module lib/seed/house
 * 
 * OVERVIEW:
 * Lookup functions and utilities for US House seat data
 * Enables efficient queries by state, delegation size, or at-large status
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import { allHouseSeats, houseSeatsSummary } from './house-seats';
import type { HouseSeatConfig } from './house-seats';
import type { StateAbbreviation } from '@/lib/types/state';

/**
 * House seats organized by state abbreviation
 * Map for O(1) lookup performance
 */
export const seatsByState: Record<StateAbbreviation, HouseSeatConfig[]> = {} as Record<StateAbbreviation, HouseSeatConfig[]>;

// Build state lookup map
for (const seat of allHouseSeats) {
  if (!seatsByState[seat.state]) {
    seatsByState[seat.state] = [];
  }
  seatsByState[seat.state].push(seat);
}

/**
 * States with at-large (single statewide) districts
 * 7 total: AK, DE, ND, SD, VT, WY, DC
 */
export const atLargeStates: readonly StateAbbreviation[] = [
  'AK', 'DE', 'ND', 'SD', 'VT', 'WY', 'DC'
] as const;

/**
 * Top 10 largest House delegations
 * Useful for understanding state political power
 */
export const largestDelegations = [
  { state: 'CA' as const, seats: 52 },
  { state: 'TX' as const, seats: 38 },
  { state: 'FL' as const, seats: 28 },
  { state: 'NY' as const, seats: 26 },
  { state: 'PA' as const, seats: 17 },
  { state: 'IL' as const, seats: 17 },
  { state: 'OH' as const, seats: 15 },
  { state: 'GA' as const, seats: 14 },
  { state: 'NC' as const, seats: 14 },
  { state: 'MI' as const, seats: 13 },
] as const;

/**
 * Get House seats for a specific state
 * 
 * @param stateAbbreviation - Two-letter state code
 * @returns Array of seats (1-52 depending on state, includes non-voting for DC)
 * 
 * @example
 * ```ts
 * const caSeats = getHouseSeatsForState('CA');
 * console.log(caSeats.length); // 52 (largest delegation)
 * 
 * const dcSeats = getHouseSeatsForState('DC');
 * console.log(dcSeats[0].isVoting); // false (non-voting delegate)
 * ```
 */
export function getHouseSeatsForState(stateAbbreviation: StateAbbreviation): HouseSeatConfig[] {
  return seatsByState[stateAbbreviation] || [];
}

/**
 * Get number of voting House seats for a state
 * 
 * @param stateAbbreviation - Two-letter state code
 * @returns Number of voting seats (0 for DC delegate is non-voting)
 * 
 * @example
 * ```ts
 * const caVotingSeats = getHouseSeatCount('CA');
 * console.log(caVotingSeats); // 52
 * 
 * const dcVotingSeats = getHouseSeatCount('DC');
 * console.log(dcVotingSeats); // 0 (delegate doesn't vote)
 * ```
 */
export function getHouseSeatCount(stateAbbreviation: StateAbbreviation): number {
  const seats = seatsByState[stateAbbreviation] || [];
  return seats.filter(s => s.isVoting).length;
}

// Re-export for convenience
export { allHouseSeats, houseSeatsSummary };
export type { HouseSeatConfig };
