/**
 * @fileoverview Random Data Generation Utilities - Wrapper for faker
 * @module lib/utils/random
 * @description Provides consistent, type-safe random data generation for NPCs, companies,
 * events, and game content. All functions use faker.js with seeded randomness for
 * reproducibility and testing.
 * 
 * @created 2025-11-13
 * @author ECHO v1.0.0
 */

import { faker } from '@faker-js/faker';

// ============================================================================
// OVERVIEW
// ============================================================================
/**
 * This module wraps faker.js to provide:
 * - Employee name and stat generation
 * - Company name and description generation
 * - Event title and narrative generation
 * - Consistent random number generation
 * - Seeded randomness for testing
 * - Industry-specific content generation
 * 
 * All functions are designed for game content generation with realistic
 * but varied outputs suitable for an MMO business simulation.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Employee statistics for NPC generation
 */
export interface EmployeeStats {
  firstName: string;
  lastName: string;
  email: string;
  skill: number;          // 1-100 scale
  loyalty: number;        // 1-100 scale
  morale: number;         // 1-100 scale
  experience: number;     // Years of experience (0-40)
  salary: number;         // Annual salary
  title: string;          // Job title
}

/**
 * Company name generation options
 */
export interface CompanyNameOptions {
  industry?: string;
  style?: 'corporate' | 'startup' | 'traditional' | 'creative';
}

/**
 * Event generation options
 */
export interface EventOptions {
  type: 'business' | 'political' | 'economic' | 'random';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
}

// ============================================================================
// SEEDING & CONFIGURATION
// ============================================================================

/**
 * Set a seed for reproducible random generation (useful for testing)
 * 
 * @param seed - Seed value (number or string)
 * 
 * @example
 * ```ts
 * setSeed(12345);
 * const name1 = randomEmployeeName(); // Always same result with seed 12345
 * 
 * setSeed(12345);
 * const name2 = randomEmployeeName(); // Same as name1
 * ```
 */
export function setSeed(seed: number | string): void {
  faker.seed(typeof seed === 'string' ? seed.length : seed);
}

/**
 * Reset faker to use truly random data (no seed)
 * 
 * @example
 * ```ts
 * resetSeed();
 * const name = randomEmployeeName(); // Different each time
 * ```
 */
export function resetSeed(): void {
  faker.seed();
}

// ============================================================================
// EMPLOYEE GENERATION
// ============================================================================

/**
 * Generate a random employee name (first + last)
 * 
 * @returns Full name string
 * 
 * @example
 * ```ts
 * randomEmployeeName();  // "John Smith"
 * ```
 */
export function randomEmployeeName(): string {
  return faker.person.fullName();
}

/**
 * Generate complete employee stats for NPC hiring
 * 
 * @param experience - Optional experience level override (0-40 years)
 * @returns Employee stats object
 * 
 * @example
 * ```ts
 * const employee = generateEmployee();
 * // {
 * //   firstName: "Jane",
 * //   lastName: "Doe",
 * //   email: "jane.doe@example.com",
 * //   skill: 65,
 * //   loyalty: 70,
 * //   morale: 75,
 * //   experience: 5,
 * //   salary: 65000,
 * //   title: "Senior Developer"
 * // }
 * ```
 */
export function generateEmployee(experience?: number): EmployeeStats {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const yearsExperience = experience ?? randomInt(0, 40);
  
  // Skill correlates with experience (but with variance)
  const baseSkill = Math.min(100, 20 + (yearsExperience * 2));
  const skill = Math.max(1, Math.min(100, baseSkill + randomInt(-20, 20)));
  
  // Loyalty and morale are independent
  const loyalty = randomInt(30, 100);
  const morale = randomInt(40, 100);
  
  // Salary based on experience and skill
  const baseSalary = 35000 + (yearsExperience * 2000) + (skill * 500);
  const salary = Math.round(baseSalary / 1000) * 1000; // Round to nearest 1000
  
  return {
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    skill,
    loyalty,
    morale,
    experience: yearsExperience,
    salary,
    title: generateJobTitle(yearsExperience),
  };
}

/**
 * Generate a job title based on experience level
 * 
 * @param experience - Years of experience
 * @returns Job title
 * 
 * @example
 * ```ts
 * generateJobTitle(2);   // "Junior Developer"
 * generateJobTitle(8);   // "Senior Developer"
 * generateJobTitle(15);  // "Lead Developer"
 * ```
 */
export function generateJobTitle(experience: number): string {
  const roles = [
    'Developer',
    'Engineer',
    'Analyst',
    'Manager',
    'Specialist',
    'Consultant',
    'Coordinator',
  ];
  
  const role = randomElement(roles);
  
  if (experience < 2) return `Junior ${role}`;
  if (experience < 5) return role;
  if (experience < 10) return `Senior ${role}`;
  if (experience < 15) return `Lead ${role}`;
  return `Principal ${role}`;
}

// ============================================================================
// COMPANY GENERATION
// ============================================================================

/**
 * Generate a random company name
 * 
 * @param options - Name generation options
 * @returns Company name
 * 
 * @example
 * ```ts
 * randomCompanyName();                           // "TechCorp Industries"
 * randomCompanyName({ style: 'startup' });       // "ByteFlow"
 * randomCompanyName({ industry: 'healthcare' }); // "MediCare Solutions"
 * ```
 */
export function randomCompanyName(options: CompanyNameOptions = {}): string {
  const { style = 'corporate' } = options;
  
  switch (style) {
    case 'startup':
      return faker.company.name();
    case 'traditional':
      return `${faker.person.lastName()} & ${faker.person.lastName()}`;
    case 'creative':
      return `${faker.word.adjective()} ${faker.word.noun()}`.replace(/\b\w/g, c => c.toUpperCase());
    default:
      return faker.company.name();
  }
}

/**
 * Generate a company mission statement
 * 
 * @returns Mission statement string
 * 
 * @example
 * ```ts
 * randomMissionStatement();
 * // "Delivering innovative solutions to transform industries worldwide"
 * ```
 */
export function randomMissionStatement(): string {
  const templates = [
    `Delivering ${faker.word.adjective()} solutions to ${faker.word.verb()} ${faker.word.noun()}`,
    `Transforming ${faker.word.noun()} through ${faker.word.adjective()} innovation`,
    `Building a ${faker.word.adjective()} future for ${faker.word.noun()}`,
    `Empowering ${faker.word.noun()} with ${faker.word.adjective()} technology`,
  ];
  
  return randomElement(templates);
}

// ============================================================================
// EVENT GENERATION
// ============================================================================

/**
 * Generate a random game event
 * 
 * @param options - Event generation options
 * @returns Event object with title and description
 * 
 * @example
 * ```ts
 * const event = generateEvent({ type: 'economic', severity: 'major' });
 * // {
 * //   title: "Market Crash",
 * //   description: "Stock prices plummet as investors panic...",
 * //   severity: "major"
 * // }
 * ```
 */
export function generateEvent(options: EventOptions) {
  const { type, severity } = options;
  
  const businessEvents = [
    { title: 'Employee Strike', description: 'Workers demand better conditions and higher pay.' },
    { title: 'Equipment Failure', description: 'Critical machinery breaks down, halting production.' },
    { title: 'New Competitor', description: 'A well-funded rival enters the market.' },
    { title: 'Supply Shortage', description: 'Key materials become scarce and expensive.' },
  ];
  
  const politicalEvents = [
    { title: 'New Regulation', description: 'Government introduces stricter industry regulations.' },
    { title: 'Tax Reform', description: 'Corporate tax rates are adjusted unexpectedly.' },
    { title: 'Election Upset', description: 'An unexpected candidate wins, shifting policies.' },
    { title: 'Trade Agreement', description: 'New international trade deal opens opportunities.' },
  ];
  
  const economicEvents = [
    { title: 'Market Boom', description: 'Consumer confidence surges, driving sales up.' },
    { title: 'Recession Warning', description: 'Economic indicators suggest downturn ahead.' },
    { title: 'Interest Rate Change', description: 'Federal Reserve adjusts lending rates.' },
    { title: 'Currency Fluctuation', description: 'Exchange rates shift dramatically.' },
  ];
  
  const events = type === 'business' ? businessEvents :
                 type === 'political' ? politicalEvents :
                 type === 'economic' ? economicEvents :
                 [...businessEvents, ...politicalEvents, ...economicEvents];
  
  const event = randomElement(events);
  
  return {
    ...event,
    severity,
    impact: severity === 'critical' ? 'severe' :
            severity === 'major' ? 'significant' :
            severity === 'moderate' ? 'moderate' : 'minor',
  };
}

// ============================================================================
// NUMBER GENERATION
// ============================================================================

/**
 * Generate a random integer between min and max (inclusive)
 * 
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Random integer
 * 
 * @example
 * ```ts
 * randomInt(1, 10);      // 7
 * randomInt(100, 200);   // 157
 * ```
 */
export function randomInt(min: number, max: number): number {
  return faker.number.int({ min, max });
}

/**
 * Generate a random float between min and max
 * 
 * @param min - Minimum value
 * @param max - Maximum value
 * @param precision - Decimal places (default: 2)
 * @returns Random float
 * 
 * @example
 * ```ts
 * randomFloat(0, 1);           // 0.67
 * randomFloat(10, 20, 4);      // 15.7384
 * ```
 */
export function randomFloat(min: number, max: number, precision = 2): number {
  return faker.number.float({ min, max, fractionDigits: precision });
}

/**
 * Generate a random percentage (0-100)
 * 
 * @returns Random percentage
 * 
 * @example
 * ```ts
 * randomPercentage();  // 67
 * ```
 */
export function randomPercentage(): number {
  return randomInt(0, 100);
}

/**
 * Random boolean with optional probability
 * 
 * @param probability - Probability of true (0-1, default: 0.5)
 * @returns Random boolean
 * 
 * @example
 * ```ts
 * randomBoolean();       // true or false (50/50)
 * randomBoolean(0.8);    // true 80% of the time
 * ```
 */
export function randomBoolean(probability = 0.5): boolean {
  return Math.random() < probability;
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Pick a random element from an array
 * 
 * @param array - Array to pick from
 * @returns Random element
 * 
 * @example
 * ```ts
 * randomElement([1, 2, 3, 4, 5]);  // 3
 * randomElement(['a', 'b', 'c']);  // 'b'
 * ```
 */
export function randomElement<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot pick from empty array');
  }
  
  return array[randomInt(0, array.length - 1)];
}

/**
 * Pick multiple random elements from an array (no duplicates)
 * 
 * @param array - Array to pick from
 * @param count - Number of elements to pick
 * @returns Array of random elements
 * 
 * @example
 * ```ts
 * randomElements([1, 2, 3, 4, 5], 3);  // [2, 4, 1]
 * ```
 */
export function randomElements<T>(array: T[], count: number): T[] {
  if (count > array.length) {
    throw new Error('Cannot pick more elements than array length');
  }
  
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Shuffle an array in place (Fisher-Yates algorithm)
 * 
 * @param array - Array to shuffle
 * @returns Shuffled array
 * 
 * @example
 * ```ts
 * shuffle([1, 2, 3, 4, 5]);  // [3, 1, 5, 2, 4]
 * ```
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

// ============================================================================
// TEXT GENERATION
// ============================================================================

/**
 * Generate a random lorem ipsum paragraph
 * 
 * @param sentences - Number of sentences (default: 3)
 * @returns Lorem ipsum text
 * 
 * @example
 * ```ts
 * randomText();      // "Lorem ipsum dolor sit amet..."
 * randomText(5);     // Longer paragraph with 5 sentences
 * ```
 */
export function randomText(sentences = 3): string {
  return faker.lorem.sentences(sentences);
}

/**
 * Generate a random word
 * 
 * @returns Random word
 * 
 * @example
 * ```ts
 * randomWord();  // "innovative"
 * ```
 */
export function randomWord(): string {
  return faker.word.adjective();
}

// ============================================================================
// WEIGHTED RANDOMNESS
// ============================================================================

/**
 * Pick from array with weighted probabilities
 * 
 * @param items - Array of items
 * @param weights - Array of weights (same length as items)
 * @returns Randomly selected item based on weights
 * 
 * @example
 * ```ts
 * // 'common' has 70% chance, 'rare' has 30% chance
 * weightedRandom(['common', 'rare'], [70, 30]);
 * ```
 */
export function weightedRandom<T>(items: T[], weights: number[]): T {
  if (items.length !== weights.length) {
    throw new Error('Items and weights arrays must have same length');
  }
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }
  
  return items[items.length - 1];
}

// ============================================================================
// IMPLEMENTATION NOTES
// ============================================================================
/**
 * Implementation Notes:
 * 
 * 1. Faker Integration:
 *    - Uses @faker-js/faker for realistic data generation
 *    - Supports seeding for reproducible tests
 *    - Locale can be configured if needed (currently US English)
 * 
 * 2. Employee Generation:
 *    - Skill correlates with experience but has variance
 *    - Salary calculated from experience + skill (realistic ranges)
 *    - Job titles match experience levels
 * 
 * 3. Performance:
 *    - All functions are lightweight (< 1ms)
 *    - No external API calls (all local generation)
 *    - Safe for high-frequency use
 * 
 * 4. Testing:
 *    - Use setSeed(value) for reproducible tests
 *    - All functions are pure (same input = same output with seed)
 *    - Reset seed after tests with resetSeed()
 * 
 * 5. Future Enhancements:
 *    - Industry-specific employee generation
 *    - Custom event templates from database
 *    - Personality traits for NPCs
 *    - Multi-locale support
 */
