/**
 * @fileoverview Complete State Data with Economic Perks
 * @module lib/data/states
 * 
 * OVERVIEW:
 * All 51 US jurisdictions (50 states + DC) with complete data:
 * - Legacy: GDP, population, crime, political representation
 * - New: Tax burden, unemployment, income tax status, sales tax
 * - Calculated: Profit bonuses, hiring multipliers, wage multipliers, industry specializations
 * 
 * Data sources:
 * - Economic: Wikipedia (2024 GDP, population)
 * - Crime: FBI UCR via Wikipedia (2024)
 * - Tax/Unemployment: Wikipedia (2023-2024)
 * - Representation: 119th US Congress (2025-2027)
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import type { StatePerkData } from '@/lib/types/state';

/**
 * All 51 US jurisdictions with complete economic and political data
 * Sorted alphabetically by state name
 * 
 * BALANCE PHILOSOPHY:
 * - No objectively "best" state - all have strategic tradeoffs
 * - Tax perks counterbalanced by other factors
 * - Labor market creates quality vs quantity choices
 * - GDP drives wages (high GDP = high cost, low GDP = affordable)
 * - Industry specializations create niches without universal dominance
 */
export const STATES: readonly StatePerkData[] = [
  // Alabama
  {
    name: 'Alabama',
    abbreviation: 'AL',
    gdpMillions: 296_918,
    gdpPerCapita: 58_723,
    population: Math.round(296_918_000_000 / 58_723),
    violentCrimeRate: 456.3,
    senateSeatCount: 2,
    houseSeatCount: 7,
    taxBurden: 3427,
    unemploymentRate: 2.9,
    hasStateIncomeTax: true,
    salesTaxRate: 4.0,
    profitMarginBonus: 10, // Low tax
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85, // Low GDP per capita
    industryBonuses: {
      manufacturing: 20,
      aerospace: 15,
    },
  },
  
  // Alaska
  {
    name: 'Alaska',
    abbreviation: 'AK',
    gdpMillions: 65_212,
    gdpPerCapita: 88_036,
    population: Math.round(65_212_000_000 / 88_036),
    violentCrimeRate: 724.1,
    senateSeatCount: 2,
    houseSeatCount: 1,
    taxBurden: 1438,
    unemploymentRate: 4.6,
    hasStateIncomeTax: false, // No income tax!
    salesTaxRate: 0, // No sales tax!
    profitMarginBonus: 15, // No income tax
    hiringDifficultyMultiplier: 0.5, // Slack market
    wageMultiplier: 1.0,
    industryBonuses: {
      energy: 25,
      tourism: 20,
    },
  },
  
  // Arizona
  {
    name: 'Arizona',
    abbreviation: 'AZ',
    gdpMillions: 509_161,
    gdpPerCapita: 68_329,
    population: Math.round(509_161_000_000 / 68_329),
    violentCrimeRate: 410.6,
    senateSeatCount: 2,
    houseSeatCount: 9,
    taxBurden: 3645,
    unemploymentRate: 4.0,
    hasStateIncomeTax: true,
    salesTaxRate: 5.6,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      tech: 15,
      tourism: 20,
      healthcare: 15,
    },
  },
  
  // Arkansas
  {
    name: 'Arkansas',
    abbreviation: 'AR',
    gdpMillions: 171_807,
    gdpPerCapita: 56_229,
    population: Math.round(171_807_000_000 / 56_229),
    violentCrimeRate: 622.5,
    senateSeatCount: 2,
    houseSeatCount: 4,
    taxBurden: 3649,
    unemploymentRate: 3.4,
    hasStateIncomeTax: true,
    salesTaxRate: 6.5,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      agriculture: 25,
      retail: 20,
    },
  },
  
  // California
  {
    name: 'California',
    abbreviation: 'CA',
    gdpMillions: 4_103_124,
    gdpPerCapita: 104_671,
    population: Math.round(4_103_124_000_000 / 104_671),
    violentCrimeRate: 442.5,
    senateSeatCount: 2,
    houseSeatCount: 52,
    taxBurden: 7202,
    unemploymentRate: 4.8,
    hasStateIncomeTax: true,
    salesTaxRate: 7.25,
    profitMarginBonus: -10, // High tax penalty
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 1.15, // High cost
    industryBonuses: {
      tech: 30,
      entertainment: 25,
      agriculture: 15,
    },
  },
  
  // Colorado
  {
    name: 'Colorado',
    abbreviation: 'CO',
    gdpMillions: 516_377,
    gdpPerCapita: 87_404,
    population: Math.round(516_377_000_000 / 87_404),
    violentCrimeRate: 422.0,
    senateSeatCount: 2,
    houseSeatCount: 8,
    taxBurden: 4772,
    unemploymentRate: 3.5,
    hasStateIncomeTax: true,
    salesTaxRate: 2.9,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 1.0,
    industryBonuses: {
      tech: 20,
      tourism: 25,
      energy: 15,
    },
  },
  
  // Connecticut
  {
    name: 'Connecticut',
    abbreviation: 'CT',
    gdpMillions: 348_827,
    gdpPerCapita: 96_248,
    population: Math.round(348_827_000_000 / 96_248),
    violentCrimeRate: 136.0,
    senateSeatCount: 2,
    houseSeatCount: 5,
    taxBurden: 6989,
    unemploymentRate: 4.1,
    hasStateIncomeTax: true,
    salesTaxRate: 6.35,
    profitMarginBonus: -10, // High tax
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 1.15,
    industryBonuses: {
      finance: 25,
      biotech: 20,
    },
  },
  
  // Delaware
  {
    name: 'Delaware',
    abbreviation: 'DE',
    gdpMillions: 87_177,
    gdpPerCapita: 85_574,
    population: Math.round(87_177_000_000 / 85_574),
    violentCrimeRate: 420.7,
    senateSeatCount: 2,
    houseSeatCount: 1,
    taxBurden: 4644,
    unemploymentRate: 4.4,
    hasStateIncomeTax: true,
    salesTaxRate: 0, // No sales tax
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 1.0,
    industryBonuses: {
      finance: 30, // Corporate haven
      retail: 20,
    },
  },
  
  // Florida
  {
    name: 'Florida',
    abbreviation: 'FL',
    gdpMillions: 1_706_425,
    gdpPerCapita: 75_717,
    population: Math.round(1_706_425_000_000 / 75_717),
    violentCrimeRate: 325.4,
    senateSeatCount: 2,
    houseSeatCount: 28,
    taxBurden: 3146,
    unemploymentRate: 3.0,
    hasStateIncomeTax: false, // No income tax
    salesTaxRate: 6.0,
    profitMarginBonus: 15, // No income tax
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      tourism: 25,
      retail: 20,
      healthcare: 15,
    },
  },
  
  // Georgia
  {
    name: 'Georgia',
    abbreviation: 'GA',
    gdpMillions: 840_602,
    gdpPerCapita: 75_277,
    population: Math.round(840_602_000_000 / 75_277),
    violentCrimeRate: 341.9,
    senateSeatCount: 2,
    houseSeatCount: 14,
    taxBurden: 4157,
    unemploymentRate: 3.5,
    hasStateIncomeTax: true,
    salesTaxRate: 4.0,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      logistics: 25,
      tech: 20,
      entertainment: 20,
    },
  },
  
  // Hawaii
  {
    name: 'Hawaii',
    abbreviation: 'HI',
    gdpMillions: 105_547,
    gdpPerCapita: 72_559,
    population: Math.round(105_547_000_000 / 72_559),
    violentCrimeRate: 254.2,
    senateSeatCount: 2,
    houseSeatCount: 2,
    taxBurden: 6455,
    unemploymentRate: 3.2,
    hasStateIncomeTax: true,
    salesTaxRate: 4.0,
    profitMarginBonus: -10, // High tax
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 1.0,
    industryBonuses: {
      tourism: 30,
      agriculture: 15,
    },
  },
  
  // Idaho
  {
    name: 'Idaho',
    abbreviation: 'ID',
    gdpMillions: 112_622,
    gdpPerCapita: 58_108,
    population: Math.round(112_622_000_000 / 58_108),
    violentCrimeRate: 230.4,
    senateSeatCount: 2,
    houseSeatCount: 2,
    taxBurden: 3736,
    unemploymentRate: 3.0,
    hasStateIncomeTax: true,
    salesTaxRate: 6.0,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      agriculture: 25,
      tech: 15,
    },
  },
  
  // Illinois
  {
    name: 'Illinois',
    abbreviation: 'IL',
    gdpMillions: 1_077_179,
    gdpPerCapita: 85_658,
    population: Math.round(1_077_179_000_000 / 85_658),
    violentCrimeRate: 425.9,
    senateSeatCount: 2,
    houseSeatCount: 17,
    taxBurden: 5411,
    unemploymentRate: 4.6,
    hasStateIncomeTax: true,
    salesTaxRate: 6.25,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 0.5, // Slack market
    wageMultiplier: 1.0,
    industryBonuses: {
      logistics: 25,
      finance: 20,
      manufacturing: 15,
    },
  },
  
  // Indiana
  {
    name: 'Indiana',
    abbreviation: 'IN',
    gdpMillions: 482_560,
    gdpPerCapita: 70_301,
    population: Math.round(482_560_000_000 / 70_301),
    violentCrimeRate: 357.7,
    senateSeatCount: 2,
    houseSeatCount: 9,
    taxBurden: 4219,
    unemploymentRate: 3.4,
    hasStateIncomeTax: true,
    salesTaxRate: 7.0,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      manufacturing: 25,
      logistics: 20,
    },
  },
  
  // Iowa
  {
    name: 'Iowa',
    abbreviation: 'IA',
    gdpMillions: 238_707,
    gdpPerCapita: 74_477,
    population: Math.round(238_707_000_000 / 74_477),
    violentCrimeRate: 266.6,
    senateSeatCount: 2,
    houseSeatCount: 4,
    taxBurden: 4398,
    unemploymentRate: 2.9,
    hasStateIncomeTax: true,
    salesTaxRate: 6.0,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      agriculture: 30,
      manufacturing: 15,
    },
  },
  
  // Kansas
  {
    name: 'Kansas',
    abbreviation: 'KS',
    gdpMillions: 218_178,
    gdpPerCapita: 74_253,
    population: Math.round(218_178_000_000 / 74_253),
    violentCrimeRate: 380.4,
    senateSeatCount: 2,
    houseSeatCount: 4,
    taxBurden: 4490,
    unemploymentRate: 2.8,
    hasStateIncomeTax: true,
    salesTaxRate: 6.5,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      agriculture: 25,
      aerospace: 20,
    },
  },
  
  // Kentucky
  {
    name: 'Kentucky',
    abbreviation: 'KY',
    gdpMillions: 271_916,
    gdpPerCapita: 60_101,
    population: Math.round(271_916_000_000 / 60_101),
    violentCrimeRate: 280.6,
    senateSeatCount: 2,
    houseSeatCount: 6,
    taxBurden: 4185,
    unemploymentRate: 4.3,
    hasStateIncomeTax: true,
    salesTaxRate: 6.0,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      manufacturing: 25,
      agriculture: 20,
    },
  },
  
  // Louisiana
  {
    name: 'Louisiana',
    abbreviation: 'LA',
    gdpMillions: 294_831,
    gdpPerCapita: 64_281,
    population: Math.round(294_831_000_000 / 64_281),
    violentCrimeRate: 556.8,
    senateSeatCount: 2,
    houseSeatCount: 6,
    taxBurden: 3978,
    unemploymentRate: 3.9,
    hasStateIncomeTax: true,
    salesTaxRate: 4.45,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      energy: 30,
      logistics: 20,
    },
  },
  
  // Maine
  {
    name: 'Maine',
    abbreviation: 'ME',
    gdpMillions: 89_105,
    gdpPerCapita: 64_526,
    population: Math.round(89_105_000_000 / 64_526),
    violentCrimeRate: 100.1,
    senateSeatCount: 2,
    houseSeatCount: 2,
    taxBurden: 5566,
    unemploymentRate: 3.3,
    hasStateIncomeTax: true,
    salesTaxRate: 5.5,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      tourism: 25,
      agriculture: 20,
    },
  },
  
  // Maryland
  {
    name: 'Maryland',
    abbreviation: 'MD',
    gdpMillions: 502_175,
    gdpPerCapita: 81_084,
    population: Math.round(502_175_000_000 / 81_084),
    violentCrimeRate: 413.3,
    senateSeatCount: 2,
    houseSeatCount: 8,
    taxBurden: 5331,
    unemploymentRate: 1.9, // Tightest market!
    hasStateIncomeTax: true,
    salesTaxRate: 6.0,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.5, // Very tight
    wageMultiplier: 1.0,
    industryBonuses: {
      biotech: 25,
      tech: 20,
      finance: 15,
    },
  },
  
  // Massachusetts
  {
    name: 'Massachusetts',
    abbreviation: 'MA',
    gdpMillions: 732_024,
    gdpPerCapita: 104_408,
    population: Math.round(732_024_000_000 / 104_408),
    violentCrimeRate: 303.8,
    senateSeatCount: 2,
    houseSeatCount: 9,
    taxBurden: 6058,
    unemploymentRate: 3.7,
    hasStateIncomeTax: true,
    salesTaxRate: 6.25,
    profitMarginBonus: -10, // High tax
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 1.15,
    industryBonuses: {
      biotech: 30,
      tech: 25,
      finance: 20,
    },
  },
  
  // Michigan
  {
    name: 'Michigan',
    abbreviation: 'MI',
    gdpMillions: 659_152,
    gdpPerCapita: 65_726,
    population: Math.round(659_152_000_000 / 65_726),
    violentCrimeRate: 461.1,
    senateSeatCount: 2,
    houseSeatCount: 13,
    taxBurden: 4398,
    unemploymentRate: 4.0,
    hasStateIncomeTax: true,
    salesTaxRate: 6.0,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      manufacturing: 30,
      tech: 15,
    },
  },
  
  // Minnesota
  {
    name: 'Minnesota',
    abbreviation: 'MN',
    gdpMillions: 475_803,
    gdpPerCapita: 83_035,
    population: Math.round(475_803_000_000 / 83_035),
    violentCrimeRate: 277.5,
    senateSeatCount: 2,
    houseSeatCount: 8,
    taxBurden: 5655,
    unemploymentRate: 2.6,
    hasStateIncomeTax: true,
    salesTaxRate: 6.875,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 1.0,
    industryBonuses: {
      healthcare: 25,
      tech: 20,
      agriculture: 15,
    },
  },
  
  // Mississippi
  {
    name: 'Mississippi',
    abbreviation: 'MS',
    gdpMillions: 154_126,
    gdpPerCapita: 53_061,
    population: Math.round(154_126_000_000 / 53_061),
    violentCrimeRate: 259.2,
    senateSeatCount: 2,
    houseSeatCount: 4,
    taxBurden: 3599,
    unemploymentRate: 3.7,
    hasStateIncomeTax: true,
    salesTaxRate: 7.0,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      agriculture: 30,
      manufacturing: 15,
    },
  },
  
  // Missouri
  {
    name: 'Missouri',
    abbreviation: 'MO',
    gdpMillions: 420_938,
    gdpPerCapita: 68_149,
    population: Math.round(420_938_000_000 / 68_149),
    violentCrimeRate: 495.1,
    senateSeatCount: 2,
    houseSeatCount: 8,
    taxBurden: 3829,
    unemploymentRate: 3.0,
    hasStateIncomeTax: true,
    salesTaxRate: 4.225,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      logistics: 25,
      agriculture: 20,
      manufacturing: 15,
    },
  },
  
  // Montana
  {
    name: 'Montana',
    abbreviation: 'MT',
    gdpMillions: 72_267,
    gdpPerCapita: 63_608,
    population: Math.round(72_267_000_000 / 63_608),
    violentCrimeRate: 469.8,
    senateSeatCount: 2,
    houseSeatCount: 2,
    taxBurden: 4470,
    unemploymentRate: 2.7,
    hasStateIncomeTax: true,
    salesTaxRate: 0, // No sales tax
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      agriculture: 25,
      tourism: 20,
      energy: 15,
    },
  },
  
  // Nebraska
  {
    name: 'Nebraska',
    abbreviation: 'NE',
    gdpMillions: 161_944,
    gdpPerCapita: 81_748,
    population: Math.round(161_944_000_000 / 81_748),
    violentCrimeRate: 282.7,
    senateSeatCount: 2,
    houseSeatCount: 3,
    taxBurden: 4648,
    unemploymentRate: 2.4, // Tight market
    hasStateIncomeTax: true,
    salesTaxRate: 5.5,
    profitMarginBonus: 10, // Low tax
    hiringDifficultyMultiplier: 1.5, // Tight
    wageMultiplier: 1.0,
    industryBonuses: {
      agriculture: 30,
      logistics: 20,
    },
  },
  
  // Nevada
  {
    name: 'Nevada',
    abbreviation: 'NV',
    gdpMillions: 229_045,
    gdpPerCapita: 72_123,
    population: Math.round(229_045_000_000 / 72_123),
    violentCrimeRate: 454.9,
    senateSeatCount: 2,
    houseSeatCount: 4,
    taxBurden: 3333,
    unemploymentRate: 5.4, // Slackest market
    hasStateIncomeTax: false, // No income tax
    salesTaxRate: 6.85,
    profitMarginBonus: 15, // No income tax
    hiringDifficultyMultiplier: 0.5, // Very slack
    wageMultiplier: 0.85,
    industryBonuses: {
      tourism: 30,
      entertainment: 25,
      retail: 15,
    },
  },
  
  // New Hampshire
  {
    name: 'New Hampshire',
    abbreviation: 'NH',
    gdpMillions: 108_970,
    gdpPerCapita: 78_368,
    population: Math.round(108_970_000_000 / 78_368),
    violentCrimeRate: 110.1,
    senateSeatCount: 2,
    houseSeatCount: 2,
    taxBurden: 3306,
    unemploymentRate: 2.5, // Tight
    hasStateIncomeTax: false, // No income tax
    salesTaxRate: 0, // No sales tax
    profitMarginBonus: 15, // No income tax
    hiringDifficultyMultiplier: 1.5, // Tight
    wageMultiplier: 1.0,
    industryBonuses: {
      tech: 20,
      tourism: 20,
      manufacturing: 15,
    },
  },
  
  // New Jersey
  {
    name: 'New Jersey',
    abbreviation: 'NJ',
    gdpMillions: 795_349,
    gdpPerCapita: 85_541,
    population: Math.round(795_349_000_000 / 85_541),
    violentCrimeRate: 195.7,
    senateSeatCount: 2,
    houseSeatCount: 12,
    taxBurden: 6327,
    unemploymentRate: 4.4,
    hasStateIncomeTax: true,
    salesTaxRate: 6.625,
    profitMarginBonus: -10, // High tax
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 1.0,
    industryBonuses: {
      biotech: 25,
      finance: 20,
      logistics: 20,
    },
  },
  
  // New Mexico
  {
    name: 'New Mexico',
    abbreviation: 'NM',
    gdpMillions: 127_356,
    gdpPerCapita: 60_096,
    population: Math.round(127_356_000_000 / 60_096),
    violentCrimeRate: 717.1,
    senateSeatCount: 2,
    houseSeatCount: 3,
    taxBurden: 4052,
    unemploymentRate: 4.3,
    hasStateIncomeTax: true,
    salesTaxRate: 5.125,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      energy: 25,
      tourism: 20,
      aerospace: 15,
    },
  },
  
  // New York
  {
    name: 'New York',
    abbreviation: 'NY',
    gdpMillions: 2_297_028,
    gdpPerCapita: 116_870,
    population: Math.round(2_297_028_000_000 / 116_870),
    violentCrimeRate: 363.8,
    senateSeatCount: 2,
    houseSeatCount: 26,
    taxBurden: 7826, // Highest tax burden!
    unemploymentRate: 4.3,
    hasStateIncomeTax: true,
    salesTaxRate: 4.0,
    profitMarginBonus: -10, // High tax
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 1.15, // Very high cost
    industryBonuses: {
      finance: 30,
      tech: 20,
      entertainment: 20,
    },
  },
  
  // North Carolina
  {
    name: 'North Carolina',
    abbreviation: 'NC',
    gdpMillions: 760_839,
    gdpPerCapita: 70_574,
    population: Math.round(760_839_000_000 / 70_574),
    violentCrimeRate: 372.5,
    senateSeatCount: 2,
    houseSeatCount: 14,
    taxBurden: 4171,
    unemploymentRate: 3.6,
    hasStateIncomeTax: true,
    salesTaxRate: 4.75,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      tech: 25,
      biotech: 20,
      manufacturing: 15,
    },
  },
  
  // North Dakota
  {
    name: 'North Dakota',
    abbreviation: 'ND',
    gdpMillions: 71_149,
    gdpPerCapita: 91_213,
    population: Math.round(71_149_000_000 / 91_213),
    violentCrimeRate: 269.4,
    senateSeatCount: 2,
    houseSeatCount: 1,
    taxBurden: 4316,
    unemploymentRate: 2.1, // Very tight
    hasStateIncomeTax: true,
    salesTaxRate: 5.0,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.5, // Very tight
    wageMultiplier: 1.0,
    industryBonuses: {
      energy: 30,
      agriculture: 25,
    },
  },
  
  // Ohio
  {
    name: 'Ohio',
    abbreviation: 'OH',
    gdpMillions: 845_101,
    gdpPerCapita: 71_726,
    population: Math.round(845_101_000_000 / 71_726),
    violentCrimeRate: 293.2,
    senateSeatCount: 2,
    houseSeatCount: 15,
    taxBurden: 4371,
    unemploymentRate: 4.0,
    hasStateIncomeTax: true,
    salesTaxRate: 5.75,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      manufacturing: 25,
      logistics: 20,
      healthcare: 15,
    },
  },
  
  // Oklahoma
  {
    name: 'Oklahoma',
    abbreviation: 'OK',
    gdpMillions: 254_916,
    gdpPerCapita: 62_766,
    population: Math.round(254_916_000_000 / 62_766),
    violentCrimeRate: 430.4,
    senateSeatCount: 2,
    houseSeatCount: 5,
    taxBurden: 3878,
    unemploymentRate: 3.3,
    hasStateIncomeTax: true,
    salesTaxRate: 4.5,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      energy: 30,
      agriculture: 20,
    },
  },
  
  // Oregon
  {
    name: 'Oregon',
    abbreviation: 'OR',
    gdpMillions: 308_863,
    gdpPerCapita: 72_555,
    population: Math.round(308_863_000_000 / 72_555),
    violentCrimeRate: 291.9,
    senateSeatCount: 2,
    houseSeatCount: 6,
    taxBurden: 4323,
    unemploymentRate: 4.1,
    hasStateIncomeTax: true,
    salesTaxRate: 0, // No sales tax
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      tech: 25,
      agriculture: 20,
      manufacturing: 15,
    },
  },
  
  // Pennsylvania
  {
    name: 'Pennsylvania',
    abbreviation: 'PA',
    gdpMillions: 963_589,
    gdpPerCapita: 74_293,
    population: Math.round(963_589_000_000 / 74_293),
    violentCrimeRate: 306.5,
    senateSeatCount: 2,
    houseSeatCount: 17,
    taxBurden: 4958,
    unemploymentRate: 3.8,
    hasStateIncomeTax: true,
    salesTaxRate: 6.0,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      manufacturing: 25,
      healthcare: 20,
      energy: 15,
    },
  },
  
  // Rhode Island
  {
    name: 'Rhode Island',
    abbreviation: 'RI',
    gdpMillions: 73_642,
    gdpPerCapita: 66_636,
    population: Math.round(73_642_000_000 / 66_636),
    violentCrimeRate: 230.9,
    senateSeatCount: 2,
    houseSeatCount: 2,
    taxBurden: 5146,
    unemploymentRate: 3.7,
    hasStateIncomeTax: true,
    salesTaxRate: 7.0,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      biotech: 20,
      tourism: 20,
    },
  },
  
  // South Carolina
  {
    name: 'South Carolina',
    abbreviation: 'SC',
    gdpMillions: 305_815,
    gdpPerCapita: 57_151,
    population: Math.round(305_815_000_000 / 57_151),
    violentCrimeRate: 530.5,
    senateSeatCount: 2,
    houseSeatCount: 7,
    taxBurden: 3595,
    unemploymentRate: 3.4,
    hasStateIncomeTax: true,
    salesTaxRate: 6.0,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      manufacturing: 25,
      tourism: 20,
    },
  },
  
  // South Dakota
  {
    name: 'South Dakota',
    abbreviation: 'SD',
    gdpMillions: 68_148,
    gdpPerCapita: 74_065,
    population: Math.round(68_148_000_000 / 74_065),
    violentCrimeRate: 418.9,
    senateSeatCount: 2,
    houseSeatCount: 1,
    taxBurden: 3076,
    unemploymentRate: 1.9, // Tightest market (tied with MD)
    hasStateIncomeTax: false, // No income tax
    salesTaxRate: 4.5,
    profitMarginBonus: 15, // No income tax
    hiringDifficultyMultiplier: 1.5, // Very tight
    wageMultiplier: 0.85,
    industryBonuses: {
      agriculture: 30,
      tourism: 20,
    },
  },
  
  // Tennessee
  {
    name: 'Tennessee',
    abbreviation: 'TN',
    gdpMillions: 476_893,
    gdpPerCapita: 67_372,
    population: Math.round(476_893_000_000 / 67_372),
    violentCrimeRate: 661.9,
    senateSeatCount: 2,
    houseSeatCount: 9,
    taxBurden: 2976,
    unemploymentRate: 3.4,
    hasStateIncomeTax: false, // No income tax
    salesTaxRate: 7.0,
    profitMarginBonus: 15, // No income tax
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      healthcare: 25,
      logistics: 20,
      manufacturing: 15,
    },
  },
  
  // Texas
  {
    name: 'Texas',
    abbreviation: 'TX',
    gdpMillions: 2_709_393,
    gdpPerCapita: 88_617,
    population: Math.round(2_709_393_000_000 / 88_617),
    violentCrimeRate: 446.5,
    senateSeatCount: 2,
    houseSeatCount: 38,
    taxBurden: 4399,
    unemploymentRate: 4.0,
    hasStateIncomeTax: false, // No income tax
    salesTaxRate: 6.25,
    profitMarginBonus: 15, // No income tax
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 1.0,
    industryBonuses: {
      energy: 30,
      tech: 20,
      manufacturing: 15,
    },
  },
  
  // Utah
  {
    name: 'Utah',
    abbreviation: 'UT',
    gdpMillions: 255_967,
    gdpPerCapita: 75_100,
    population: Math.round(255_967_000_000 / 75_100),
    violentCrimeRate: 242.8,
    senateSeatCount: 2,
    houseSeatCount: 4,
    taxBurden: 4384,
    unemploymentRate: 2.4, // Tight
    hasStateIncomeTax: true,
    salesTaxRate: 6.1,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.5, // Tight
    wageMultiplier: 0.85,
    industryBonuses: {
      tech: 25,
      tourism: 20,
    },
  },
  
  // Vermont
  {
    name: 'Vermont',
    abbreviation: 'VT',
    gdpMillions: 45_717,
    gdpPerCapita: 71_094,
    population: Math.round(45_717_000_000 / 71_094),
    violentCrimeRate: 173.4,
    senateSeatCount: 2,
    houseSeatCount: 1,
    taxBurden: 5473,
    unemploymentRate: 2.3, // Tight
    hasStateIncomeTax: true,
    salesTaxRate: 6.0,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.5, // Tight
    wageMultiplier: 0.85,
    industryBonuses: {
      tourism: 25,
      agriculture: 20,
    },
  },
  
  // Virginia
  {
    name: 'Virginia',
    abbreviation: 'VA',
    gdpMillions: 709_933,
    gdpPerCapita: 81_493,
    population: Math.round(709_933_000_000 / 81_493),
    violentCrimeRate: 200.4,
    senateSeatCount: 2,
    houseSeatCount: 11,
    taxBurden: 4964,
    unemploymentRate: 2.9,
    hasStateIncomeTax: true,
    salesTaxRate: 5.3,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 1.0,
    industryBonuses: {
      tech: 25,
      finance: 20,
      logistics: 15,
    },
  },
  
  // Washington
  {
    name: 'Washington',
    abbreviation: 'WA',
    gdpMillions: 816_994,
    gdpPerCapita: 103_250,
    population: Math.round(816_994_000_000 / 103_250),
    violentCrimeRate: 293.7,
    senateSeatCount: 2,
    houseSeatCount: 10,
    taxBurden: 4657,
    unemploymentRate: 4.6,
    hasStateIncomeTax: false, // No income tax
    salesTaxRate: 6.5,
    profitMarginBonus: 15, // No income tax
    hiringDifficultyMultiplier: 0.5, // Slack
    wageMultiplier: 1.15, // High cost
    industryBonuses: {
      tech: 30,
      aerospace: 25,
      agriculture: 15,
    },
  },
  
  // West Virginia
  {
    name: 'West Virginia',
    abbreviation: 'WV',
    gdpMillions: 97_005,
    gdpPerCapita: 55_049,
    population: Math.round(97_005_000_000 / 55_049),
    violentCrimeRate: 302.5,
    senateSeatCount: 2,
    houseSeatCount: 2,
    taxBurden: 4171,
    unemploymentRate: 4.3,
    hasStateIncomeTax: true,
    salesTaxRate: 6.0,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      energy: 25,
      manufacturing: 20,
    },
  },
  
  // Wisconsin
  {
    name: 'Wisconsin',
    abbreviation: 'WI',
    gdpMillions: 429_810,
    gdpPerCapita: 72_683,
    population: Math.round(429_810_000_000 / 72_683),
    violentCrimeRate: 295.3,
    senateSeatCount: 2,
    houseSeatCount: 8,
    taxBurden: 5009,
    unemploymentRate: 2.9,
    hasStateIncomeTax: true,
    salesTaxRate: 5.0,
    profitMarginBonus: 0,
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 0.85,
    industryBonuses: {
      manufacturing: 30,
      agriculture: 20,
    },
  },
  
  // Wyoming
  {
    name: 'Wyoming',
    abbreviation: 'WY',
    gdpMillions: 49_653,
    gdpPerCapita: 85_004,
    population: Math.round(49_653_000_000 / 85_004),
    violentCrimeRate: 242.6,
    senateSeatCount: 2,
    houseSeatCount: 1,
    taxBurden: 3438,
    unemploymentRate: 3.3,
    hasStateIncomeTax: false, // No income tax
    salesTaxRate: 4.0,
    profitMarginBonus: 15, // No income tax
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 1.0,
    industryBonuses: {
      energy: 30,
      tourism: 25,
    },
  },
  
  // District of Columbia
  {
    name: 'District of Columbia',
    abbreviation: 'DC',
    gdpMillions: 181_185,
    gdpPerCapita: 263_220, // Highest GDP per capita (federal jobs)
    population: Math.round(181_185_000_000 / 263_220),
    violentCrimeRate: 1005.5, // Highest crime rate
    senateSeatCount: 0, // No voting senators
    houseSeatCount: 1, // 1 non-voting delegate
    taxBurden: 7536,
    unemploymentRate: 5.0,
    hasStateIncomeTax: true,
    salesTaxRate: 6.0,
    profitMarginBonus: -10, // High tax
    hiringDifficultyMultiplier: 1.0,
    wageMultiplier: 1.15, // Very high cost
    industryBonuses: {
      tech: 20,
      finance: 20,
      logistics: 15,
    },
  },
] as const;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Data Source**: Legacy project + Wikipedia (2023-2024)
 * 2. **Storage**: TypeScript const for zero DB overhead, complete type safety
 * 3. **Balance**: No universally "best" state - all strategic tradeoffs
 * 4. **Performance**: Readonly array prevents mutation, enables compiler optimizations
 * 5. **Usage**: Import STATES, filter/map for UI, use helpers for lookups
 * 
 * PREVENTS:
 * - Database queries for static reference data
 * - Runtime type errors (compile-time safety)
 * - Data inconsistencies (single source of truth)
 */
