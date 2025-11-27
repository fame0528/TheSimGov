/**
 * Federal Government Seed Data - US Senate Index
 * 
 * Senate seat structure for player-driven elections
 * Based on 119th United States Congress structure (2025-2027)
 * 
 * All 100 Senate seats start vacant - to be filled through player elections
 * 
 * Structure:
 * - 50 states × 2 senators = 100 total seats
 * - 3 election classes (staggered 6-year terms)
 * - Class 1: ~33 seats (next election 2025/2031)
 * - Class 2: ~33 seats (next election 2027)
 * - Class 3: ~34 seats (next election 2029)
 * 
 * Created: 2025-11-13
 */

export type { SenateSeatConfig } from './senate-seats';
export { allSenateSeats, senateSeatSummary } from './senate-seats';

import { allSenateSeats } from './senate-seats';

/**
 * Senate seats by state lookup
 * Returns array of 2 seats per state (except DC which has 0)
 */
export const seatsByState = allSenateSeats.reduce(
  (acc, seat) => {
    if (!acc[seat.state]) {
      acc[seat.state] = [];
    }
    acc[seat.state].push(seat);
    return acc;
  },
  {} as Record<string, typeof allSenateSeats>
);

/**
 * Senate seats by election class
 * Used for determining which seats are up for election
 */
export const seatsByClass = {
  class1: allSenateSeats.filter(s => s.class === 1), // Next election: 2031
  class2: allSenateSeats.filter(s => s.class === 2), // Next election: 2027
  class3: allSenateSeats.filter(s => s.class === 3), // Next election: 2029
};

/**
 * Get seats for a specific state
 */
export function getSeatsForState(stateAbbreviation: string) {
  return seatsByState[stateAbbreviation] || [];
}

/**
 * Get seats up for election in a specific class
 */
export function getSeatsByClass(classNumber: 1 | 2 | 3) {
  return seatsByClass[`class${classNumber}`];
}
