/**
 * State Seed Data - Part 1 (Alabama through Georgia)
 * 
 * Real-world data gathered November 2025 for Business & Politics MMO
 * Sources: Wikipedia (GDP, Crime), Ballotpedia (Political Control)
 * 
 * Created: 2025-11-13
 */

export interface StateSeedData {
  name: string;
  abbreviation: string;
  gdpMillions: number; // 2024 GDP in millions USD
  gdpPerCapita: number; // 2024 GDP per capita USD
  population: number; // Derived from GDP / GDP per capita
  violentCrimeRate: number; // Per 100k population (2024)
  // All positions start unfilled - to be filled by players
  senateSeatCount: number; // Always 2 (positions start vacant)
  houseSeatCount: number; // Number of House seats for this state
}

export const statesPart1: StateSeedData[] = [
  {
    name: 'Alabama',
    abbreviation: 'AL',
    gdpMillions: 296_918,
    gdpPerCapita: 58_723,
    population: Math.round(296_918_000_000 / 58_723), // ~5,055,000
    violentCrimeRate: 456.3,
    senateSeatCount: 2,
    houseSeatCount: 7,
  },
  {
    name: 'Alaska',
    abbreviation: 'AK',
    gdpMillions: 65_212,
    gdpPerCapita: 88_036,
    population: Math.round(65_212_000_000 / 88_036), // ~740,000
    violentCrimeRate: 724.1,
    senateSeatCount: 2,
    houseSeatCount: 1,
  },
  {
    name: 'Arizona',
    abbreviation: 'AZ',
    gdpMillions: 509_161,
    gdpPerCapita: 68_329,
    population: Math.round(509_161_000_000 / 68_329), // ~7,451,000
    violentCrimeRate: 410.6,
    senateSeatCount: 2,
    houseSeatCount: 9,
  },
  {
    name: 'Arkansas',
    abbreviation: 'AR',
    gdpMillions: 171_807,
    gdpPerCapita: 56_229,
    population: Math.round(171_807_000_000 / 56_229), // ~3,056,000
    violentCrimeRate: 622.5,
    senateSeatCount: 2,
    houseSeatCount: 4,
  },
  {
    name: 'California',
    abbreviation: 'CA',
    gdpMillions: 4_103_124,
    gdpPerCapita: 104_671,
    population: Math.round(4_103_124_000_000 / 104_671), // ~39,185,000
    violentCrimeRate: 442.5,
    senateSeatCount: 2,
    houseSeatCount: 52,
  },
  {
    name: 'Colorado',
    abbreviation: 'CO',
    gdpMillions: 516_377,
    gdpPerCapita: 87_404,
    population: Math.round(516_377_000_000 / 87_404), // ~5,908,000
    violentCrimeRate: 422.0,
    senateSeatCount: 2,
    houseSeatCount: 8,
  },
  {
    name: 'Connecticut',
    abbreviation: 'CT',
    gdpMillions: 348_827,
    gdpPerCapita: 96_248,
    population: Math.round(348_827_000_000 / 96_248), // ~3,624,000
    violentCrimeRate: 136.0,
    senateSeatCount: 2,
    houseSeatCount: 5,
  },
  {
    name: 'Delaware',
    abbreviation: 'DE',
    gdpMillions: 87_177,
    gdpPerCapita: 85_574,
    population: Math.round(87_177_000_000 / 85_574), // ~1,019,000
    violentCrimeRate: 420.7,
    senateSeatCount: 2,
    houseSeatCount: 1,
  },
  {
    name: 'Florida',
    abbreviation: 'FL',
    gdpMillions: 1_706_425,
    gdpPerCapita: 75_717,
    population: Math.round(1_706_425_000_000 / 75_717), // ~22,534,000
    violentCrimeRate: 325.4,
    senateSeatCount: 2,
    houseSeatCount: 28,
  },
  {
    name: 'Georgia',
    abbreviation: 'GA',
    gdpMillions: 840_602,
    gdpPerCapita: 75_277,
    population: Math.round(840_602_000_000 / 75_277), // ~11,168,000
    violentCrimeRate: 341.9,
    senateSeatCount: 2,
    houseSeatCount: 14,
  },
];
