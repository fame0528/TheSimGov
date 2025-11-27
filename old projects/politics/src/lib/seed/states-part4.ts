/**
 * State Seed Data - Part 4 (New York through South Dakota)
 * 
 * Real-world data gathered November 2025 for Business & Politics MMO
 * All positions start vacant - to be filled by players
 * 
 * Created: 2025-11-13
 */

import { StateSeedData } from './states-part1';

export const statesPart4: StateSeedData[] = [
  {
    name: 'New York',
    abbreviation: 'NY',
    gdpMillions: 2_297_028,
    gdpPerCapita: 116_870,
    population: Math.round(2_297_028_000_000 / 116_870), // ~19,653,000
    violentCrimeRate: 363.8,
    senateSeatCount: 2,
    houseSeatCount: 26,
  },
  {
    name: 'North Carolina',
    abbreviation: 'NC',
    gdpMillions: 760_839,
    gdpPerCapita: 70_574,
    population: Math.round(760_839_000_000 / 70_574), // ~10,781,000
    violentCrimeRate: 372.5,
    senateSeatCount: 2,
    houseSeatCount: 14,
  },
  {
    name: 'North Dakota',
    abbreviation: 'ND',
    gdpMillions: 71_149,
    gdpPerCapita: 91_213,
    population: Math.round(71_149_000_000 / 91_213), // ~780,000
    violentCrimeRate: 269.4,
    senateSeatCount: 2,
    houseSeatCount: 1,
  },
  {
    name: 'Ohio',
    abbreviation: 'OH',
    gdpMillions: 845_101,
    gdpPerCapita: 71_726,
    population: Math.round(845_101_000_000 / 71_726), // ~11,780,000
    violentCrimeRate: 293.2,
    senateSeatCount: 2,
    houseSeatCount: 15,
  },
  {
    name: 'Oklahoma',
    abbreviation: 'OK',
    gdpMillions: 254_916,
    gdpPerCapita: 62_766,
    population: Math.round(254_916_000_000 / 62_766), // ~4,062,000
    violentCrimeRate: 430.4,
    senateSeatCount: 2,
    houseSeatCount: 5,
  },
  {
    name: 'Oregon',
    abbreviation: 'OR',
    gdpMillions: 308_863,
    gdpPerCapita: 72_555,
    population: Math.round(308_863_000_000 / 72_555), // ~4,257,000
    violentCrimeRate: 291.9,
    senateSeatCount: 2,
    houseSeatCount: 6,
  },
  {
    name: 'Pennsylvania',
    abbreviation: 'PA',
    gdpMillions: 963_589,
    gdpPerCapita: 74_293,
    population: Math.round(963_589_000_000 / 74_293), // ~12,973,000
    violentCrimeRate: 306.5,
    senateSeatCount: 2,
    houseSeatCount: 17,
  },
  {
    name: 'Rhode Island',
    abbreviation: 'RI',
    gdpMillions: 73_642,
    gdpPerCapita: 66_636,
    population: Math.round(73_642_000_000 / 66_636), // ~1,105,000
    violentCrimeRate: 230.9,
    senateSeatCount: 2,
    houseSeatCount: 2,
  },
  {
    name: 'South Carolina',
    abbreviation: 'SC',
    gdpMillions: 305_815,
    gdpPerCapita: 57_151,
    population: Math.round(305_815_000_000 / 57_151), // ~5,352,000
    violentCrimeRate: 530.5,
    senateSeatCount: 2,
    houseSeatCount: 7,
  },
  {
    name: 'South Dakota',
    abbreviation: 'SD',
    gdpMillions: 68_148,
    gdpPerCapita: 74_065,
    population: Math.round(68_148_000_000 / 74_065), // ~920,000
    violentCrimeRate: 418.9,
    senateSeatCount: 2,
    houseSeatCount: 1,
  },
];
