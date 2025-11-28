"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATES = void 0;
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
exports.STATES = [
    // Alabama
    {
        name: 'Alabama',
        abbreviation: 'AL',
        gdpMillions: 296918,
        gdpPerCapita: 58723,
        population: Math.round(296918000000 / 58723),
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
        gdpMillions: 65212,
        gdpPerCapita: 88036,
        population: Math.round(65212000000 / 88036),
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
        gdpMillions: 509161,
        gdpPerCapita: 68329,
        population: Math.round(509161000000 / 68329),
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
        gdpMillions: 171807,
        gdpPerCapita: 56229,
        population: Math.round(171807000000 / 56229),
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
        gdpMillions: 4103124,
        gdpPerCapita: 104671,
        population: Math.round(4103124000000 / 104671),
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
        gdpMillions: 516377,
        gdpPerCapita: 87404,
        population: Math.round(516377000000 / 87404),
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
        gdpMillions: 348827,
        gdpPerCapita: 96248,
        population: Math.round(348827000000 / 96248),
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
        gdpMillions: 87177,
        gdpPerCapita: 85574,
        population: Math.round(87177000000 / 85574),
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
        gdpMillions: 1706425,
        gdpPerCapita: 75717,
        population: Math.round(1706425000000 / 75717),
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
        gdpMillions: 840602,
        gdpPerCapita: 75277,
        population: Math.round(840602000000 / 75277),
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
        gdpMillions: 105547,
        gdpPerCapita: 72559,
        population: Math.round(105547000000 / 72559),
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
        gdpMillions: 112622,
        gdpPerCapita: 58108,
        population: Math.round(112622000000 / 58108),
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
        gdpMillions: 1077179,
        gdpPerCapita: 85658,
        population: Math.round(1077179000000 / 85658),
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
        gdpMillions: 482560,
        gdpPerCapita: 70301,
        population: Math.round(482560000000 / 70301),
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
        gdpMillions: 238707,
        gdpPerCapita: 74477,
        population: Math.round(238707000000 / 74477),
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
        gdpMillions: 218178,
        gdpPerCapita: 74253,
        population: Math.round(218178000000 / 74253),
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
        gdpMillions: 271916,
        gdpPerCapita: 60101,
        population: Math.round(271916000000 / 60101),
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
        gdpMillions: 294831,
        gdpPerCapita: 64281,
        population: Math.round(294831000000 / 64281),
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
        gdpMillions: 89105,
        gdpPerCapita: 64526,
        population: Math.round(89105000000 / 64526),
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
        gdpMillions: 502175,
        gdpPerCapita: 81084,
        population: Math.round(502175000000 / 81084),
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
        gdpMillions: 732024,
        gdpPerCapita: 104408,
        population: Math.round(732024000000 / 104408),
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
        gdpMillions: 659152,
        gdpPerCapita: 65726,
        population: Math.round(659152000000 / 65726),
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
        gdpMillions: 475803,
        gdpPerCapita: 83035,
        population: Math.round(475803000000 / 83035),
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
        gdpMillions: 154126,
        gdpPerCapita: 53061,
        population: Math.round(154126000000 / 53061),
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
        gdpMillions: 420938,
        gdpPerCapita: 68149,
        population: Math.round(420938000000 / 68149),
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
        gdpMillions: 72267,
        gdpPerCapita: 63608,
        population: Math.round(72267000000 / 63608),
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
        gdpMillions: 161944,
        gdpPerCapita: 81748,
        population: Math.round(161944000000 / 81748),
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
        gdpMillions: 229045,
        gdpPerCapita: 72123,
        population: Math.round(229045000000 / 72123),
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
        gdpMillions: 108970,
        gdpPerCapita: 78368,
        population: Math.round(108970000000 / 78368),
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
        gdpMillions: 795349,
        gdpPerCapita: 85541,
        population: Math.round(795349000000 / 85541),
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
        gdpMillions: 127356,
        gdpPerCapita: 60096,
        population: Math.round(127356000000 / 60096),
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
        gdpMillions: 2297028,
        gdpPerCapita: 116870,
        population: Math.round(2297028000000 / 116870),
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
        gdpMillions: 760839,
        gdpPerCapita: 70574,
        population: Math.round(760839000000 / 70574),
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
        gdpMillions: 71149,
        gdpPerCapita: 91213,
        population: Math.round(71149000000 / 91213),
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
        gdpMillions: 845101,
        gdpPerCapita: 71726,
        population: Math.round(845101000000 / 71726),
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
        gdpMillions: 254916,
        gdpPerCapita: 62766,
        population: Math.round(254916000000 / 62766),
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
        gdpMillions: 308863,
        gdpPerCapita: 72555,
        population: Math.round(308863000000 / 72555),
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
        gdpMillions: 963589,
        gdpPerCapita: 74293,
        population: Math.round(963589000000 / 74293),
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
        gdpMillions: 73642,
        gdpPerCapita: 66636,
        population: Math.round(73642000000 / 66636),
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
        gdpMillions: 305815,
        gdpPerCapita: 57151,
        population: Math.round(305815000000 / 57151),
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
        gdpMillions: 68148,
        gdpPerCapita: 74065,
        population: Math.round(68148000000 / 74065),
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
        gdpMillions: 476893,
        gdpPerCapita: 67372,
        population: Math.round(476893000000 / 67372),
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
        gdpMillions: 2709393,
        gdpPerCapita: 88617,
        population: Math.round(2709393000000 / 88617),
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
        gdpMillions: 255967,
        gdpPerCapita: 75100,
        population: Math.round(255967000000 / 75100),
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
        gdpMillions: 45717,
        gdpPerCapita: 71094,
        population: Math.round(45717000000 / 71094),
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
        gdpMillions: 709933,
        gdpPerCapita: 81493,
        population: Math.round(709933000000 / 81493),
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
        gdpMillions: 816994,
        gdpPerCapita: 103250,
        population: Math.round(816994000000 / 103250),
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
        gdpMillions: 97005,
        gdpPerCapita: 55049,
        population: Math.round(97005000000 / 55049),
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
        gdpMillions: 429810,
        gdpPerCapita: 72683,
        population: Math.round(429810000000 / 72683),
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
        gdpMillions: 49653,
        gdpPerCapita: 85004,
        population: Math.round(49653000000 / 85004),
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
        gdpMillions: 181185,
        gdpPerCapita: 263220, // Highest GDP per capita (federal jobs)
        population: Math.round(181185000000 / 263220),
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
];
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
//# sourceMappingURL=states.js.map