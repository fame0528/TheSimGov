/**
 * @fileoverview State Perk System Type Definitions
 * @module lib/types/state
 * 
 * OVERVIEW:
 * Complete type definitions for state economic perk system.
 * StatePerkData interface includes legacy data (GDP, crime, population)
 * plus new economic metrics (tax burden, unemployment, sales tax) and
 * calculated gameplay perks (profit bonuses, hiring modifiers, industry bonuses).
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

/**
 * State abbreviation union type for strict type safety
 * All 50 states + DC (51 total)
 */
export type StateAbbreviation =
  | 'AL' | 'AK' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'FL' | 'GA'
  | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME' | 'MD'
  | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH' | 'NJ'
  | 'NM' | 'NY' | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI' | 'SC'
  | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY'
  | 'DC';

/**
 * Industry types that can receive state-specific bonuses
 */
export type IndustrySpecialization =
  | 'tech'
  | 'finance'
  | 'manufacturing'
  | 'energy'
  | 'retail'
  | 'healthcare'
  | 'agriculture'
  | 'tourism'
  | 'logistics'
  | 'biotech'
  | 'aerospace'
  | 'entertainment';

/**
 * Industry bonus map - percentages for specialized industries per state
 * Example: { tech: 30 } means +30% revenue for tech companies in this state
 */
export type IndustryBonuses = Partial<Record<IndustrySpecialization, number>>;

/**
 * Complete state data including legacy info and new economic perks
 * 
 * BALANCE PHILOSOPHY:
 * - No objectively "best" state - all have strategic tradeoffs
 * - Tax perks vs infrastructure/education bonuses
 * - Labor market tradeoffs (quality vs availability)
 * - Economic strength tradeoffs (high GDP = high costs)
 * - Industry specializations create niches
 * 
 * @example
 * ```typescript
 * const california: StatePerkData = {
 *   name: 'California',
 *   abbreviation: 'CA',
 *   // ... legacy fields ...
 *   taxBurden: 7202, // Per capita (high)
 *   unemploymentRate: 4.8, // Moderate
 *   hasStateIncomeTax: true,
 *   salesTaxRate: 7.25,
 *   profitMarginBonus: -10, // High tax penalty
 *   hiringDifficultyMultiplier: 1.0, // Moderate
 *   wageMultiplier: 1.15, // High wages (expensive)
 *   industryBonuses: { tech: 30, entertainment: 25 }
 * };
 * ```
 */
export interface StatePerkData {
  // ===== LEGACY DATA (from old project) =====
  
  /** Full state name (e.g., "California") */
  name: string;
  
  /** 2-character state abbreviation (e.g., "CA") */
  abbreviation: StateAbbreviation;
  
  /** 2024 GDP in millions USD (e.g., 4_103_124 for CA) */
  gdpMillions: number;
  
  /** 2024 GDP per capita in USD (e.g., 104_671 for CA) */
  gdpPerCapita: number;
  
  /** State population (derived from GDP / GDP per capita) */
  population: number;
  
  /** Violent crime rate per 100k population (2024) */
  violentCrimeRate: number;
  
  /** Number of Senate seats (always 2, except DC = 0) */
  senateSeatCount: number;
  
  /** Number of House seats for this state */
  houseSeatCount: number;
  
  // ===== NEW ECONOMIC DATA (Wikipedia research 2023-2024) =====
  
  /**
   * Tax burden per capita in USD (2024)
   * Source: Wikipedia tax burden data
   * 
   * Examples:
   * - New York: $7,826 (highest)
   * - Alaska: $1,438 (lowest)
   * 
   * GAMEPLAY IMPACT:
   * - Low tax (<$3,500): +10% profit margin
   * - Moderate ($3,500-$6,000): 0% modifier
   * - High (>$6,000): -10% profit margin, but +education/infrastructure bonuses
   */
  taxBurden: number;
  
  /**
   * Unemployment rate as percentage (June 2023)
   * Source: Wikipedia unemployment statistics
   * 
   * Examples:
   * - South Dakota: 1.9% (lowest - tight labor market)
   * - Nevada: 5.4% (highest - slack labor market)
   * 
   * GAMEPLAY IMPACT:
   * - Tight (<2.5%): Higher quality workers, slower hiring
   * - Moderate (2.5-4.5%): Balanced
   * - Slack (>4.5%): Faster hiring, lower productivity
   */
  unemploymentRate: number;
  
  /**
   * Whether state has income tax
   * 
   * 9 states with NO income tax:
   * AK, FL, NV, NH, SD, TN, TX, WA, WY
   * 
   * GAMEPLAY IMPACT:
   * - No income tax: +15% profit margin (major advantage)
   * - Has income tax: Use taxBurden for profit calculation
   */
  hasStateIncomeTax: boolean;
  
  /**
   * State sales tax rate as percentage
   * 
   * Examples:
   * - 5 states with 0% sales tax: AK, DE, MT, NH, OR
   * - California: 7.25% (base rate, local can go higher)
   * - Louisiana: 4.45%
   * 
   * GAMEPLAY IMPACT:
   * - No sales tax (0%): +10% retail revenue
   * - Low (<5%): +5% retail revenue
   * - Moderate (5-8%): 0% modifier
   * - High (>8%): -10% retail revenue
   */
  salesTaxRate: number;
  
  // ===== CALCULATED PERKS (for gameplay balance) =====
  
  /**
   * Profit margin bonus/penalty as percentage
   * 
   * Calculated from tax environment:
   * - No state income tax: +15%
   * - Low tax burden (<$3,500): +10%
   * - Moderate tax ($3,500-$6,000): 0%
   * - High tax (>$6,000): -10%
   * 
   * Range: -10 to +15
   * 
   * BALANCE: High-tax states get education/infrastructure bonuses elsewhere
   */
  profitMarginBonus: number;
  
  /**
   * Hiring difficulty multiplier
   * 
   * Calculated from unemployment rate:
   * - Very tight (<2.5%): 1.5 (50% slower hiring, but +quality)
   * - Moderate (2.5-4.5%): 1.0 (baseline)
   * - Slack (>4.5%): 0.5 (50% faster hiring, but -quality)
   * 
   * Range: 0.5 to 1.5
   * 
   * BALANCE: Tight markets = quality, slack markets = quantity
   */
  hiringDifficultyMultiplier: number;
  
  /**
   * Wage multiplier based on cost of living (approximated by GDP per capita)
   * 
   * Calculated from GDP per capita:
   * - High GDP (>$90k): 1.15 (15% higher wages - expensive)
   * - Moderate GDP ($70k-$90k): 1.0 (baseline)
   * - Low GDP (<$70k): 0.85 (15% lower wages - affordable)
   * 
   * Range: 0.85 to 1.15
   * 
   * BALANCE: High-wage states = expensive, low-wage states = affordable
   */
  wageMultiplier: number;
  
  /**
   * Industry-specific bonuses as percentages
   * 
   * State specializations create strategic niches:
   * - California: { tech: 30, entertainment: 25 }
   * - Texas: { energy: 30, manufacturing: 20 }
   * - New York: { finance: 30, tech: 15 }
   * - Florida: { tourism: 25, retail: 15 }
   * - Illinois: { logistics: 25, manufacturing: 15 }
   * - Washington: { tech: 30, aerospace: 25 }
   * - Massachusetts: { biotech: 25, tech: 20 }
   * 
   * BALANCE: Specialization bonuses create "best state for X" scenarios
   * without any state being universally best
   */
  industryBonuses: IndustryBonuses;
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Data Source**: Legacy project + Wikipedia (Nov 2023-2024 data)
 * 2. **Balance**: No universally "best" state - all have tradeoffs
 * 3. **Strategy**: Permanent state choice at registration creates commitment
 * 4. **Education**: Real economic data teaches players state differences
 * 5. **Performance**: Stored as TypeScript constants (not DB) for zero latency
 * 
 * PREVENTS:
 * - Pay-to-win scenarios (all states accessible)
 * - Min-maxing (no optimal state for all playstyles)
 * - Analysis paralysis (clear tradeoffs per state)
 */
