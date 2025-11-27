/**
 * State Seed Data - Part 5 (Tennessee through Wyoming + DC)
 * 
 * Real-world data gathered November 2025 for Business & Politics MMO
 * All positions start vacant - to be filled by players
 * 
 * Created: 2025-11-13
 */

import { StateSeedData } from './states-part1';

export const statesPart5: StateSeedData[] = [
  {
    name: 'Tennessee',
    abbreviation: 'TN',
    gdpMillions: 476_893,
    gdpPerCapita: 67_372,
    population: Math.round(476_893_000_000 / 67_372), // ~7,079,000
    violentCrimeRate: 661.9,
    senateSeatCount: 2,
    houseSeatCount: 9,
  },
  {
    name: 'Texas',
    abbreviation: 'TX',
    gdpMillions: 2_709_393,
    gdpPerCapita: 88_617,
    population: Math.round(2_709_393_000_000 / 88_617), // ~30,576,000
    violentCrimeRate: 446.5,
    senateSeatCount: 2,
    houseSeatCount: 38,
  },
  {
    name: 'Utah',
    abbreviation: 'UT',
    gdpMillions: 255_967,
    gdpPerCapita: 75_100,
    population: Math.round(255_967_000_000 / 75_100), // ~3,408,000
    violentCrimeRate: 242.8,
    senateSeatCount: 2,
    houseSeatCount: 4,
  },
  {
    name: 'Vermont',
    abbreviation: 'VT',
    gdpMillions: 45_717,
    gdpPerCapita: 71_094,
    population: Math.round(45_717_000_000 / 71_094), // ~643,000
    violentCrimeRate: 173.4,
    senateSeatCount: 2,
    houseSeatCount: 1,
  },
  {
    name: 'Virginia',
    abbreviation: 'VA',
    gdpMillions: 709_933,
    gdpPerCapita: 81_493,
    population: Math.round(709_933_000_000 / 81_493), // ~8,712,000
    violentCrimeRate: 200.4,
    senateSeatCount: 2,
    houseSeatCount: 11,
  },
  {
    name: 'Washington',
    abbreviation: 'WA',
    gdpMillions: 816_994,
    gdpPerCapita: 103_250,
    population: Math.round(816_994_000_000 / 103_250), // ~7,914,000
    violentCrimeRate: 293.7,
    senateSeatCount: 2,
    houseSeatCount: 10,
  },
  {
    name: 'West Virginia',
    abbreviation: 'WV',
    gdpMillions: 97_005,
    gdpPerCapita: 55_049,
    population: Math.round(97_005_000_000 / 55_049), // ~1,762,000
    violentCrimeRate: 302.5,
    senateSeatCount: 2,
    houseSeatCount: 2,
  },
  {
    name: 'Wisconsin',
    abbreviation: 'WI',
    gdpMillions: 429_810,
    gdpPerCapita: 72_683,
    population: Math.round(429_810_000_000 / 72_683), // ~5,914,000
    violentCrimeRate: 295.3,
    senateSeatCount: 2,
    houseSeatCount: 8,
  },
  {
    name: 'Wyoming',
    abbreviation: 'WY',
    gdpMillions: 49_653,
    gdpPerCapita: 85_004,
    population: Math.round(49_653_000_000 / 85_004), // ~584,000
    violentCrimeRate: 242.6,
    senateSeatCount: 2,
    houseSeatCount: 1,
  },
  {
    name: 'District of Columbia',
    abbreviation: 'DC',
    gdpMillions: 181_185,
    gdpPerCapita: 263_220,
    population: Math.round(181_185_000_000 / 263_220), // ~688,000
    violentCrimeRate: 1005.5,
    senateSeatCount: 0, // DC has no voting senators (position can't be filled)
    houseSeatCount: 1, // 1 non-voting delegate
  },
];
