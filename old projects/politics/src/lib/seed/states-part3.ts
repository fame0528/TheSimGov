/**
 * State Seed Data - Part 3 (Michigan through New Mexico)
 * 
 * Real-world data gathered November 2025 for Business & Politics MMO
 * All positions start vacant - to be filled by players
 * 
 * Created: 2025-11-13
 */

import { StateSeedData } from './states-part1';

export const statesPart3: StateSeedData[] = [
  {
    name: 'Michigan',
    abbreviation: 'MI',
    gdpMillions: 659_152,
    gdpPerCapita: 65_726,
    population: Math.round(659_152_000_000 / 65_726), // ~10,028,000
    violentCrimeRate: 461.1,
    senateSeatCount: 2,
    houseSeatCount: 13,
  },
  {
    name: 'Minnesota',
    abbreviation: 'MN',
    gdpMillions: 475_803,
    gdpPerCapita: 83_035,
    population: Math.round(475_803_000_000 / 83_035), // ~5,730,000
    violentCrimeRate: 277.5,
    senateSeatCount: 2,
    houseSeatCount: 8,
  },
  {
    name: 'Mississippi',
    abbreviation: 'MS',
    gdpMillions: 154_126,
    gdpPerCapita: 53_061,
    population: Math.round(154_126_000_000 / 53_061), // ~2,905,000
    violentCrimeRate: 259.2,
    senateSeatCount: 2,
    houseSeatCount: 4,
  },
  {
    name: 'Missouri',
    abbreviation: 'MO',
    gdpMillions: 420_938,
    gdpPerCapita: 68_149,
    population: Math.round(420_938_000_000 / 68_149), // ~6,177,000
    violentCrimeRate: 495.1,
    senateSeatCount: 2,
    houseSeatCount: 8,
  },
  {
    name: 'Montana',
    abbreviation: 'MT',
    gdpMillions: 72_267,
    gdpPerCapita: 63_608,
    population: Math.round(72_267_000_000 / 63_608), // ~1,136,000
    violentCrimeRate: 469.8,
    senateSeatCount: 2,
    houseSeatCount: 2,
  },
  {
    name: 'Nebraska',
    abbreviation: 'NE',
    gdpMillions: 161_944,
    gdpPerCapita: 81_748,
    population: Math.round(161_944_000_000 / 81_748), // ~1,981,000
    violentCrimeRate: 282.7,
    senateSeatCount: 2,
    houseSeatCount: 3,
  },
  {
    name: 'Nevada',
    abbreviation: 'NV',
    gdpMillions: 229_045,
    gdpPerCapita: 72_123,
    population: Math.round(229_045_000_000 / 72_123), // ~3,176,000
    violentCrimeRate: 454.9,
    senateSeatCount: 2,
    houseSeatCount: 4,
  },
  {
    name: 'New Hampshire',
    abbreviation: 'NH',
    gdpMillions: 108_970,
    gdpPerCapita: 78_368,
    population: Math.round(108_970_000_000 / 78_368), // ~1,390,000
    violentCrimeRate: 110.1,
    senateSeatCount: 2,
    houseSeatCount: 2,
  },
  {
    name: 'New Jersey',
    abbreviation: 'NJ',
    gdpMillions: 795_349,
    gdpPerCapita: 85_541,
    population: Math.round(795_349_000_000 / 85_541), // ~9,297,000
    violentCrimeRate: 195.7,
    senateSeatCount: 2,
    houseSeatCount: 12,
  },
  {
    name: 'New Mexico',
    abbreviation: 'NM',
    gdpMillions: 127_356,
    gdpPerCapita: 60_096,
    population: Math.round(127_356_000_000 / 60_096), // ~2,119,000
    violentCrimeRate: 717.1,
    senateSeatCount: 2,
    houseSeatCount: 3,
  },
];
