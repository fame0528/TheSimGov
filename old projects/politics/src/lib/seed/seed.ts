/**
 * Master Seed Data Index - Complete US Government Structure
 * 
 * Comprehensive seed data for Business & Politics Simulation MMO
 * All positions start VACANT - filled only by player elections
 * 
 * Structure:
 * - 51 jurisdictions (50 states + DC) with economic/demographic data
 * - 100 US Senate seats (2 per state, staggered elections)
 * - 436 US House seats (435 voting + 1 non-voting DC delegate)
 * - 50 state governments (governor + bicameral/unicameral legislatures)
 * 
 * Data Sources:
 * - Economic: Wikipedia (2024/2025 GDP, population)
 * - Crime: FBI UCR via Wikipedia (2024 violent crime rates)
 * - Federal Structure: 119th US Congress (2025-2027)
 * - State Structure: National Conference of State Legislatures (2025)
 * 
 * Created: 2025-11-13
 */

// ===== STATE DATA =====
export type { StateSeedData } from './states-part1';
export { 
  allStates, 
  statesByAbbreviation, 
  statesByName, 
  stateSummary 
} from './index';

// ===== FEDERAL SENATE =====
export type { SenateSeatConfig } from './senate-seats';
export {
  allSenateSeats,
  senateSeatSummary,
  seatsByState as senateSeatsByState,
  seatsByClass as senateSeatsByClass,
  getSeatsForState as getSenateSeatsForState,
  getSeatsByClass as getSenateSeatsByClass,
} from './senate';

// ===== FEDERAL HOUSE =====
export type { HouseSeatConfig } from './house-seats';
export {
  allHouseSeats,
  houseSeatsSummary,
  seatsByState as houseSeatsByState,
  atLargeStates,
  largestDelegations,
  getHouseSeatsForState,
  getHouseSeatCount,
} from './house';

// ===== STATE GOVERNMENTS =====
export type { StateGovernmentConfig } from './state-government';
export {
  stateGovernments,
  stateGovernmentSummary,
  stateGovernmentFacts,
  getStateGovernment,
} from './state-government';

// ===== COMBINED SUMMARY =====
import { stateSummary } from './index';
import { senateSeatSummary } from './senate-seats';
import { houseSeatsSummary } from './house-seats';
import { stateGovernmentSummary } from './state-government';

/**
 * Complete summary of all seed data
 * Useful for validation and quick reference
 */
export const completeSeedDataSummary = {
  states: {
    total: stateSummary.totalStates,
    totalPopulation: stateSummary.totalPopulation,
    totalGDP: stateSummary.totalGDP,
  },
  federal: {
    senate: {
      total: senateSeatSummary.totalSeats,
      class1: senateSeatSummary.class1Seats,
      class2: senateSeatSummary.class2Seats,
      class3: senateSeatSummary.class3Seats,
    },
    house: {
      total: houseSeatsSummary.total,
      voting: houseSeatsSummary.voting,
      nonVoting: houseSeatsSummary.nonVoting,
      atLarge: houseSeatsSummary.atLarge,
    },
  },
  stateGovernments: {
    governors: stateGovernmentSummary.totalGovernors,
    stateSenators: stateGovernmentSummary.totalStateSenators,
    stateReps: stateGovernmentSummary.totalStateReps,
    bicameral: stateGovernmentSummary.bicameral,
    unicameral: stateGovernmentSummary.unicameral,
  },
  totalElectedPositions: 
    senateSeatSummary.totalSeats + 
    houseSeatsSummary.voting + 
    stateGovernmentSummary.totalGovernors + 
    stateGovernmentSummary.totalStateSenators + 
    stateGovernmentSummary.totalStateReps,
};

/**
 * Validation helper - ensures all data is consistent
 */
export function validateSeedData(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate state counts
  if (stateSummary.totalStates !== 51) {
    errors.push(`Expected 51 jurisdictions, got ${stateSummary.totalStates}`);
  }

  // Validate Senate seats
  if (senateSeatSummary.totalSeats !== 100) {
    errors.push(`Expected 100 Senate seats, got ${senateSeatSummary.totalSeats}`);
  }

  // Validate House seats
  if (houseSeatsSummary.voting !== 435) {
    errors.push(`Expected 435 voting House seats, got ${houseSeatsSummary.voting}`);
  }

  if (houseSeatsSummary.nonVoting !== 1) {
    warnings.push(`Expected 1 non-voting delegate, got ${houseSeatsSummary.nonVoting}`);
  }

  // Validate state governments
  if (stateGovernmentSummary.total !== 50) {
    errors.push(`Expected 50 state governments, got ${stateGovernmentSummary.total}`);
  }

  if (stateGovernmentSummary.unicameral !== 1) {
    warnings.push(`Expected 1 unicameral legislature (NE), got ${stateGovernmentSummary.unicameral}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
