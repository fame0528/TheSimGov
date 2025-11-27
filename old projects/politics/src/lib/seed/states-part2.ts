/**
 * State Seed Data - Part 2 (Hawaii through Massachusetts)
 * 
 * Real-world data gathered November 2025 for Business & Politics MMO
 * Sources: Wikipedia (GDP, Crime), Ballotpedia (Political Control)
 * 
 * Created: 2025-11-13
 */

import { StateSeedData } from './states-part1';

export const statesPart2: StateSeedData[] = [
  {
    name: 'Hawaii',
    abbreviation: 'HI',
    gdpMillions: 105_547,
    gdpPerCapita: 72_559,
    population: Math.round(105_547_000_000 / 72_559), // ~1,454,000
    violentCrimeRate: 254.2,
    senateSeatCount: 2,
    houseSeatCount: 2,
  },
  {
    name: 'Idaho',
    abbreviation: 'ID',
    gdpMillions: 112_622,
    gdpPerCapita: 58_108,
    population: Math.round(112_622_000_000 / 58_108), // ~1,938,000
    violentCrimeRate: 230.4,
    senateSeatCount: 2,
    houseSeatCount: 2,
  },
  {
    name: 'Illinois',
    abbreviation: 'IL',
    gdpMillions: 1_077_179,
    gdpPerCapita: 85_658,
    population: Math.round(1_077_179_000_000 / 85_658), // ~12,576,000
    violentCrimeRate: 425.9,
    senateSeatCount: 2,
    houseSeatCount: 17,
  },
  {
    name: 'Indiana',
    abbreviation: 'IN',
    gdpMillions: 482_560,
    gdpPerCapita: 70_301,
    population: Math.round(482_560_000_000 / 70_301), // ~6,864,000
    violentCrimeRate: 357.7,
    senateSeatCount: 2,
    houseSeatCount: 9,
  },
  {
    name: 'Iowa',
    abbreviation: 'IA',
    gdpMillions: 238_707,
    gdpPerCapita: 74_477,
    population: Math.round(238_707_000_000 / 74_477), // ~3,204,000
    violentCrimeRate: 266.6,
    senateSeatCount: 2,
    houseSeatCount: 4,
  },
  {
    name: 'Kansas',
    abbreviation: 'KS',
    gdpMillions: 218_178,
    gdpPerCapita: 74_253,
    population: Math.round(218_178_000_000 / 74_253), // ~2,938,000
    violentCrimeRate: 380.4,
    senateSeatCount: 2,
    houseSeatCount: 4,
  },
  {
    name: 'Kentucky',
    abbreviation: 'KY',
    gdpMillions: 271_916,
    gdpPerCapita: 60_101,
    population: Math.round(271_916_000_000 / 60_101), // ~4,524,000
    violentCrimeRate: 280.6,
    senateSeatCount: 2,
    houseSeatCount: 6,
  },
  {
    name: 'Louisiana',
    abbreviation: 'LA',
    gdpMillions: 294_831,
    gdpPerCapita: 64_281,
    population: Math.round(294_831_000_000 / 64_281), // ~4,587,000
    violentCrimeRate: 556.8,
    senateSeatCount: 2,
    houseSeatCount: 6,
  },
  {
    name: 'Maine',
    abbreviation: 'ME',
    gdpMillions: 89_105,
    gdpPerCapita: 64_526,
    population: Math.round(89_105_000_000 / 64_526), // ~1,381,000
    violentCrimeRate: 100.1,
    senateSeatCount: 2,
    houseSeatCount: 2,
  },
  {
    name: 'Maryland',
    abbreviation: 'MD',
    gdpMillions: 502_175,
    gdpPerCapita: 81_084,
    population: Math.round(502_175_000_000 / 81_084), // ~6,194,000
    violentCrimeRate: 413.3,
    senateSeatCount: 2,
    houseSeatCount: 8,
  },
  {
    name: 'Massachusetts',
    abbreviation: 'MA',
    gdpMillions: 732_024,
    gdpPerCapita: 104_408,
    population: Math.round(732_024_000_000 / 104_408), // ~7,012,000
    violentCrimeRate: 303.8,
    senateSeatCount: 2,
    houseSeatCount: 9,
  },
];
