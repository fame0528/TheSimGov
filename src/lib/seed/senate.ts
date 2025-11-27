/**
 * @fileoverview US Senate Index and Utilities
 * @module lib/seed/senate
 * 
 * OVERVIEW:
 * Lookup functions and utilities for US Senate seat data
 * Enables efficient queries by state, election class, or seat number
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import { allSenateSeats, senateSeatSummary } from './senate-seats';
import type { SenateSeatConfig } from './senate-seats';
import type { StateAbbreviation } from '@/lib/types/state';

/**
 * Senate seats organized by state abbreviation
 * Map for O(1) lookup performance
 */
export const seatsByState: Record<StateAbbreviation, SenateSeatConfig[]> = {} as Record<StateAbbreviation, SenateSeatConfig[]>;

// Build state lookup map
for (const seat of allSenateSeats) {
  if (!seatsByState[seat.state]) {
    seatsByState[seat.state] = [];
  }
  seatsByState[seat.state].push(seat);
}

/**
 * Senate seats organized by election class
 * Useful for scheduling elections
 */
export const seatsByClass = {
  class1: allSenateSeats.filter(s => s.class === 1),
  class2: allSenateSeats.filter(s => s.class === 2),
  class3: allSenateSeats.filter(s => s.class === 3),
} as const;

/**
 * Get Senate seats for a specific state
 * 
 * @param stateAbbreviation - Two-letter state code
 * @returns Array of 2 seats (or empty for DC)
 * 
 * @example
 * ```ts
 * const caSeats = getSeatsForState('CA');
 * console.log(caSeats.length); // 2
 * console.log(caSeats[0].class); // 1
 * console.log(caSeats[1].class); // 3
 * ```
 */
export function getSeatsForState(stateAbbreviation: StateAbbreviation): SenateSeatConfig[] {
  return seatsByState[stateAbbreviation] || [];
}

/**
 * Get all Senate seats in a specific election class
 * 
 * @param classNumber - Election class (1, 2, or 3)
 * @returns Array of ~33-34 seats in that class
 * 
 * @example
 * ```ts
 * const class1Seats = getSeatsByClass(1);
 * console.log(class1Seats.length); // ~33
 * // These seats all have elections in same cycle
 * ```
 */
export function getSeatsByClass(classNumber: 1 | 2 | 3): readonly SenateSeatConfig[] {
  switch (classNumber) {
    case 1:
      return seatsByClass.class1;
    case 2:
      return seatsByClass.class2;
    case 3:
      return seatsByClass.class3;
  }
}

// Re-export for convenience
export { allSenateSeats, senateSeatSummary };
export type { SenateSeatConfig };
