/**
 * Federal Government Seed Data - US House of Representatives Index
 * 
 * House seat structure for player-driven elections
 * All 436 seats (435 voting + 1 non-voting DC delegate) start vacant
 * 
 * Structure:
 * - Apportioned by state population (2020 Census)
 * - All seats elected every 2 years
 * - 7 at-large districts (AK, DE, ND, SD, VT, WY, DC)
 * 
 * Created: 2025-11-13
 */

export type { HouseSeatConfig } from './house-seats';
export { 
  allHouseSeats, 
  houseSeatsSummary,
  getHouseSeatsForState,
  getHouseSeatCount
} from './house-seats';

import { allHouseSeats } from './house-seats';

/**
 * House seats by state lookup
 */
export const seatsByState = allHouseSeats.reduce(
  (acc, seat) => {
    if (!acc[seat.state]) {
      acc[seat.state] = [];
    }
    acc[seat.state].push(seat);
    return acc;
  },
  {} as Record<string, typeof allHouseSeats>
);

/**
 * States with at-large (single, statewide) districts
 */
export const atLargeStates = ['AK', 'DE', 'ND', 'SD', 'VT', 'WY'];

/**
 * Top 10 states by House seat count
 */
export const largestDelegations = [
  { state: 'CA', seats: 52 },
  { state: 'TX', seats: 38 },
  { state: 'FL', seats: 28 },
  { state: 'NY', seats: 26 },
  { state: 'PA', seats: 17 },
  { state: 'IL', seats: 17 },
  { state: 'OH', seats: 15 },
  { state: 'GA', seats: 14 },
  { state: 'NC', seats: 14 },
  { state: 'MI', seats: 13 },
];
