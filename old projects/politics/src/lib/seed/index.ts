/**
 * State Seed Data - Complete Index
 * 
 * Combines all 50 US states + DC with real-world 2024/2025 data
 * 
 * Data Sources:
 * - GDP & GDP per capita: Wikipedia (2024 data)
 * - Crime rates: Wikipedia (2024 violent crime rates per 100k)
 * - Political control: Ballotpedia (November 2025)
 * - Federal representation: Wikipedia & House.gov (119th Congress)
 * 
 * Created: 2025-11-13
 */

export type { StateSeedData } from './states-part1';
export { statesPart1 } from './states-part1';
export { statesPart2 } from './states-part2';
export { statesPart3 } from './states-part3';
export { statesPart4 } from './states-part4';
export { statesPart5 } from './states-part5';

import { statesPart1 } from './states-part1';
import { statesPart2 } from './states-part2';
import { statesPart3 } from './states-part3';
import { statesPart4 } from './states-part4';
import { statesPart5 } from './states-part5';

/**
 * All 50 US states + District of Columbia
 * Total: 51 jurisdictions with complete economic, demographic, crime, and political data
 */
export const allStates = [
  ...statesPart1,
  ...statesPart2,
  ...statesPart3,
  ...statesPart4,
  ...statesPart5,
];

/**
 * Quick lookup by state abbreviation
 */
export const statesByAbbreviation = allStates.reduce(
  (acc, state) => {
    acc[state.abbreviation] = state;
    return acc;
  },
  {} as Record<string, typeof allStates[0]>
);

/**
 * Quick lookup by state name
 */
export const statesByName = allStates.reduce(
  (acc, state) => {
    acc[state.name] = state;
    return acc;
  },
  {} as Record<string, typeof allStates[0]>
);

/**
 * Summary statistics for validation
 */
export const stateSummary = {
  totalStates: allStates.length,
  totalPopulation: allStates.reduce((sum, s) => sum + s.population, 0),
  totalGDP: allStates.reduce((sum, s) => sum + s.gdpMillions, 0),
  totalHouseSeats: allStates.reduce((sum, s) => sum + s.houseSeatCount, 0),
  totalSenateSeatCount: allStates.reduce((sum, s) => sum + s.senateSeatCount, 0),
};
