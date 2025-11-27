/**
 * @fileoverview State Data Utility Functions
 * @module lib/utils/stateHelpers
 * 
 * OVERVIEW:
 * Helper functions for looking up state data by various criteria.
 * Provides type-safe access to state information with efficient lookups.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import { STATES } from '@/lib/data/states';
import type { StatePerkData, StateAbbreviation } from '@/lib/types/state';

// Re-export StateAbbreviation for convenience
export type { StateAbbreviation } from '@/lib/types/state';

/**
 * All valid state abbreviations (50 states + DC)
 * Used for validation in forms and API endpoints
 * 
 * @example
 * ```ts
 * if (STATE_ABBREVIATIONS.includes(userInput)) {
 *   // Valid state
 * }
 * ```
 */
export const STATE_ABBREVIATIONS: readonly StateAbbreviation[] = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC',
] as const;

/**
 * Lookup map for O(1) state retrieval by abbreviation
 * Built once at module load time for performance
 */
const STATE_BY_ABBR_MAP = new Map<StateAbbreviation, StatePerkData>(
  STATES.map(state => [state.abbreviation, state])
);

/**
 * Lookup map for O(1) state retrieval by name
 * Built once at module load time for performance
 */
const STATE_BY_NAME_MAP = new Map<string, StatePerkData>(
  STATES.map(state => [state.name.toLowerCase(), state])
);

/**
 * Get state data by abbreviation
 * 
 * @param abbreviation - Two-letter state code (e.g., 'CA', 'NY', 'TX')
 * @returns State data or undefined if not found
 * 
 * @example
 * ```ts
 * const california = getStateByAbbr('CA');
 * if (california) {
 *   console.log(california.name); // 'California'
 *   console.log(california.profitMarginBonus); // -10
 * }
 * ```
 */
export function getStateByAbbr(abbreviation: string): StatePerkData | undefined {
  return STATE_BY_ABBR_MAP.get(abbreviation.toUpperCase() as StateAbbreviation);
}

/**
 * Get state data by name (case-insensitive)
 * 
 * @param name - Full state name (e.g., 'California', 'New York', 'Texas')
 * @returns State data or undefined if not found
 * 
 * @example
 * ```ts
 * const texas = getStateByName('Texas');
 * if (texas) {
 *   console.log(texas.abbreviation); // 'TX'
 *   console.log(texas.hasStateIncomeTax); // false
 * }
 * 
 * // Case-insensitive
 * const newYork = getStateByName('new york');
 * console.log(newYork?.abbreviation); // 'NY'
 * ```
 */
export function getStateByName(name: string): StatePerkData | undefined {
  return STATE_BY_NAME_MAP.get(name.toLowerCase());
}

/**
 * Get all states as an array
 * Returns a readonly reference to prevent mutations
 * 
 * @returns Readonly array of all 51 jurisdictions
 * 
 * @example
 * ```ts
 * const allStates = getAllStates();
 * console.log(allStates.length); // 51
 * 
 * // Filter for states with no income tax
 * const noIncomeTaxStates = allStates.filter(s => !s.hasStateIncomeTax);
 * console.log(noIncomeTaxStates.length); // 9
 * ```
 */
export function getAllStates(): readonly StatePerkData[] {
  return STATES;
}

/**
 * Get states sorted alphabetically by name
 * Useful for dropdown/select components
 * 
 * @returns Sorted array of states
 * 
 * @example
 * ```ts
 * const sortedStates = getStatesSortedByName();
 * // Already sorted in STATES const, but this is explicit
 * ```
 */
export function getStatesSortedByName(): StatePerkData[] {
  return [...STATES].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Validate if a string is a valid state abbreviation
 * Type guard for StateAbbreviation
 * 
 * @param value - String to validate
 * @returns True if valid state abbreviation
 * 
 * @example
 * ```ts
 * if (isValidStateAbbr(userInput)) {
 *   // userInput is StateAbbreviation
 *   const state = getStateByAbbr(userInput);
 * }
 * ```
 */
export function isValidStateAbbr(value: string): value is StateAbbreviation {
  return STATE_ABBREVIATIONS.includes(value.toUpperCase() as StateAbbreviation);
}

/**
 * Get states by specific criteria
 * Provides common filters for gameplay/UI
 * 
 * @example
 * ```ts
 * // Get all states with no income tax
 * const noIncomeTax = getStatesBy({ hasStateIncomeTax: false });
 * 
 * // Get all states with tight labor markets (< 2.5% unemployment)
 * const tightMarkets = getStatesBy({ 
 *   unemploymentRate: { max: 2.5 } 
 * });
 * 
 * // Get high-GDP states (> $90k per capita)
 * const highGDP = getStatesBy({
 *   gdpPerCapita: { min: 90000 }
 * });
 * ```
 */
export function getStatesBy(criteria: {
  hasStateIncomeTax?: boolean;
  unemploymentRate?: { min?: number; max?: number };
  gdpPerCapita?: { min?: number; max?: number };
  profitMarginBonus?: { min?: number; max?: number };
}): StatePerkData[] {
  return STATES.filter(state => {
    if (criteria.hasStateIncomeTax !== undefined) {
      if (state.hasStateIncomeTax !== criteria.hasStateIncomeTax) return false;
    }
    
    if (criteria.unemploymentRate) {
      if (criteria.unemploymentRate.min !== undefined) {
        if (state.unemploymentRate < criteria.unemploymentRate.min) return false;
      }
      if (criteria.unemploymentRate.max !== undefined) {
        if (state.unemploymentRate > criteria.unemploymentRate.max) return false;
      }
    }
    
    if (criteria.gdpPerCapita) {
      if (criteria.gdpPerCapita.min !== undefined) {
        if (state.gdpPerCapita < criteria.gdpPerCapita.min) return false;
      }
      if (criteria.gdpPerCapita.max !== undefined) {
        if (state.gdpPerCapita > criteria.gdpPerCapita.max) return false;
      }
    }
    
    if (criteria.profitMarginBonus) {
      if (criteria.profitMarginBonus.min !== undefined) {
        if (state.profitMarginBonus < criteria.profitMarginBonus.min) return false;
      }
      if (criteria.profitMarginBonus.max !== undefined) {
        if (state.profitMarginBonus > criteria.profitMarginBonus.max) return false;
      }
    }
    
    return true;
  });
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Performance**: Map lookups for O(1) retrieval vs O(n) array search
 * 2. **Type Safety**: All functions return strongly-typed StatePerkData
 * 3. **Immutability**: Readonly arrays prevent accidental mutations
 * 4. **Validation**: isValidStateAbbr acts as type guard for TypeScript
 * 5. **Filtering**: getStatesBy provides common gameplay queries
 * 
 * PREVENTS:
 * - Slow linear searches through state data
 * - Type errors from invalid state codes
 * - Mutations of source data
 */
