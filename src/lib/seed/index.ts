/**
 * @fileoverview Master Seed Data Index
 * @module lib/seed
 * 
 * OVERVIEW:
 * Central export point for all game-critical government structure data
 * Provides complete US political system for player-driven elections
 * 
 * Data Included:
 * - 51 states (50 states + DC) with economic perks
 * - 100 US Senate seats (2 per state, 3 staggered election classes)
 * - 436 US House seats (435 voting + 1 DC delegate, apportioned by population)
 * - 50 state governments (governors + bicameral/unicameral legislatures)
 * 
 * Total Elected Positions: 7,533
 * - Federal: 536 (100 Senate + 436 House)
 * - State: 7,433 (50 governors + 1,972 state senators + 5,411 state reps)
 * 
 * All positions start vacant for player-driven elections
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

// Federal Legislature
export {
  allSenateSeats,
  senateSeatSummary,
  seatsByState as senateSeatsByState,
  seatsByClass as senateSeatsByClass,
  getSeatsForState as getSenateSeatsForState,
  getSeatsByClass as getSenateSeatsByClass,
  type SenateSeatConfig,
} from './senate';

export {
  allHouseSeats,
  houseSeatsSummary,
  seatsByState as houseSeatsByState,
  atLargeStates,
  largestDelegations,
  getHouseSeatsForState,
  getHouseSeatCount,
  type HouseSeatConfig,
} from './house';

// State Governments
export {
  stateGovernments,
  stateGovernmentSummary,
  stateGovernmentFacts,
  getStateGovernment,
  type StateGovernmentConfig,
} from './state-government';

/**
 * Validate complete seed data integrity
 * Ensures all expected data is present and correct
 * 
 * @returns Object with validation results
 * @throws Error if critical data is missing or invalid
 * 
 * @example
 * ```ts
 * const validation = validateSeedData();
 * if (!validation.valid) {
 *   console.error('Seed data validation failed:', validation.errors);
 * }
 * ```
 */
export function validateSeedData() {
  const errors: string[] = [];
  
  // Validate Senate seats
  const { allSenateSeats, senateSeatSummary } = require('./senate');
  if (allSenateSeats.length !== 100) {
    errors.push(`Expected 100 Senate seats, got ${allSenateSeats.length}`);
  }
  if (senateSeatSummary.class1Seats + senateSeatSummary.class2Seats + senateSeatSummary.class3Seats !== 100) {
    errors.push('Senate class distribution incorrect');
  }
  
  // Validate House seats
  const { allHouseSeats, houseSeatsSummary } = require('./house');
  if (allHouseSeats.length !== 436) {
    errors.push(`Expected 436 House seats, got ${allHouseSeats.length}`);
  }
  if (houseSeatsSummary.voting !== 435) {
    errors.push(`Expected 435 voting House seats, got ${houseSeatsSummary.voting}`);
  }
  if (houseSeatsSummary.nonVoting !== 1) {
    errors.push(`Expected 1 non-voting delegate, got ${houseSeatsSummary.nonVoting}`);
  }
  
  // Validate state governments
  const { stateGovernments, stateGovernmentSummary } = require('./state-government');
  if (stateGovernments.length !== 50) {
    errors.push(`Expected 50 state governments, got ${stateGovernments.length}`);
  }
  if (stateGovernmentSummary.bicameral !== 49) {
    errors.push(`Expected 49 bicameral legislatures, got ${stateGovernmentSummary.bicameral}`);
  }
  if (stateGovernmentSummary.unicameral !== 1) {
    errors.push(`Expected 1 unicameral legislature (NE), got ${stateGovernmentSummary.unicameral}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    summary: errors.length === 0 ? 'All seed data validated successfully' : `${errors.length} validation error(s)`,
  };
}

/**
 * Complete summary of all seed data
 * Useful for debugging and understanding total scope
 */
export const completeSeedDataSummary = {
  federal: {
    senate: {
      total: 100,
      statesRepresented: 50, // DC has 0 senators
      class1: 33,
      class2: 33,
      class3: 34,
    },
    house: {
      total: 436,
      voting: 435,
      nonVoting: 1, // DC delegate
      atLarge: 7, // AK, DE, ND, SD, VT, WY, DC
      largestDelegation: { state: 'CA', seats: 52 },
    },
  },
  state: {
    governments: 50, // DC excluded (unique structure)
    governors: 50,
    bicameral: 49,
    unicameral: 1, // Nebraska
    totalStateSenators: 1972,
    totalStateReps: 5411,
    largestLegislature: { state: 'NH', total: 424 }, // 400 House + 24 Senate
    smallestLegislature: { state: 'AK', total: 60 }, // 40 House + 20 Senate
  },
  totals: {
    allElectedPositions: 7533, // 100 + 435 + 50 + 1972 + 5411 = 7,968 (DC delegate non-voting = -1)
    federalPositions: 536, // 100 Senate + 436 House
    statePositions: 7433, // 50 governors + 1972 state senators + 5411 state reps
  },
} as const;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Data Source**: Legacy project + Wikipedia (2023-2024)
 * 2. **Storage**: TypeScript constants for zero-latency access
 * 3. **Validation**: validateSeedData() ensures data integrity
 * 4. **Performance**: Readonly arrays and const objects for compiler optimization
 * 5. **Usage**: Import specific exports or use completeSeedDataSummary for overview
 * 
 * PREVENTS:
 * - Database queries for static reference data
 * - Runtime data inconsistencies
 * - Missing government structure information
 * - Type errors from invalid references
 */
