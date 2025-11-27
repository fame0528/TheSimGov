/**
 * Background Generator Utility
 * 
 * Generates compelling character background narratives for political simulation roleplay.
 * Uses narrative templates with @faker-js/faker for dynamic content generation.
 * 
 * @module backgroundGenerator
 * @created 2025-11-26
 */

import { faker } from '@faker-js/faker';
import { Chance } from 'chance';
import type { Gender, Ethnicity } from '@/lib/types/portraits';

// Initialize chance instance for template selection
const chance = new Chance();

/**
 * Character background narrative templates
 * 
 * Templates use placeholders for dynamic substitution:
 * - {city}: Random US city
 * - {job}: Random profession
 * - {industry}: Business sector
 * - {achievement}: Notable accomplishment
 * - {cause}: Political/social cause
 * - {pronoun_subject}: he/she/they
 * - {pronoun_object}: him/her/them
 * - {pronoun_possessive}: his/her/their
 * 
 * Each template: 200-400 characters (fits within 500 char limit with margin)
 */
const BACKGROUND_TEMPLATES: string[] = [
  // Business Background Templates
  "Born in {city}, {pronoun_subject} built a career as a {job} in the {industry} industry. Known for {achievement}, {pronoun_subject} brings practical experience to the political arena. {pronoun_possessive} platform focuses on economic growth and job creation.",
  
  "After graduating from a state university, {pronoun_subject} worked as a {job} in {city}. {pronoun_possessive} expertise in {industry} shaped {pronoun_possessive} views on regulation and innovation. Committed to balancing business interests with public welfare.",
  
  "Started as a {job} in {city}, eventually founding a successful {industry} company. {pronoun_possessive} entrepreneurial background informs {pronoun_possessive} approach to policy. Advocates for reducing red tape while protecting workers.",
  
  // Public Service Templates
  "Raised in {city}, {pronoun_subject} entered public service as a {job}. Years of community work taught {pronoun_object} the importance of {cause}. {pronoun_possessive} campaign focuses on practical solutions over partisan politics.",
  
  "Former {job} from {city} with a passion for {cause}. {pronoun_possessive} career in the {industry} sector revealed systemic challenges requiring political reform. Runs on a platform of transparency and accountability.",
  
  "A lifelong resident of {city}, {pronoun_subject} worked as a {job} before seeking office. Motivated by {cause}, {pronoun_subject} believes government should work for everyone, not special interests.",
  
  // Education/Professional Templates
  "Educated in {industry}, {pronoun_subject} spent years as a {job} in {city}. {pronoun_possessive} professional background provides unique insights into {cause}. Committed to evidence-based policymaking.",
  
  "After a successful career as a {job}, {pronoun_subject} decided to serve {pronoun_possessive} community in {city}. {pronoun_possessive} focus: making {industry} more accessible and equitable for all citizens.",
  
  "Former {job} from {city} with deep expertise in {industry}. {pronoun_possessive} hands-on experience navigating bureaucracy drives {pronoun_possessive} reform agenda. Champions efficiency and common-sense solutions.",
  
  // Outsider/Fresh Perspective Templates
  "Political outsider from {city}, {pronoun_subject} brings fresh perspectives from {pronoun_possessive} work as a {job}. Tired of partisan gridlock, {pronoun_subject} offers practical approaches to {cause}.",
  
  "{pronoun_possessive} background as a {job} in the {industry} sector sets {pronoun_object} apart from career politicians. Born in {city}, {pronoun_subject} understands working families' struggles. Advocates for real change.",
  
  "Never held elected office, but years as a {job} in {city} taught {pronoun_object} how to solve problems. {pronoun_possessive} campaign focuses on {cause} and delivering results, not rhetoric.",
  
  // Grassroots/Community Templates
  "Community organizer from {city}, {pronoun_subject} worked as a {job} while advocating for {cause}. {pronoun_possessive} grassroots approach prioritizes listening to constituents over special interests.",
  
  "Built a reputation in {city} as a {job} committed to {cause}. {pronoun_possessive} experience in {industry} revealed the need for systemic reform. Campaigns on a platform of equity and opportunity.",
  
  "Started in {city} as a {job}, organizing around {cause}. {pronoun_possessive} ground-up approach to politics focuses on empowering communities. Rejects big money influence in favor of people power.",
  
  // Reformer/Change Agent Templates
  "Former {job} turned reformer from {city}. Witnessed failures in the {industry} sector firsthand, fueling {pronoun_possessive} commitment to {cause}. Champions accountability and structural reform.",
  
  "{pronoun_subject} spent years as a {job} before realizing the system needed fundamental change. Based in {city}, {pronoun_possessive} platform tackles {cause} with bold, innovative solutions.",
  
  "Career {job} from {city} who saw the need for political reform. {pronoun_possessive} experience in {industry} exposed inefficiencies requiring leadership. Runs on transparency and results.",
  
  // Bipartisan/Unity Templates
  "A pragmatist from {city}, {pronoun_subject} worked as a {job} with people across the political spectrum. {pronoun_possessive} focus on {cause} transcends party lines. Believes in finding common ground.",
  
  "Former {job} known for bridging divides in {city}. {pronoun_possessive} bipartisan approach to {industry} issues earned respect from all sides. Campaigns on unity and practical solutions.",
  
  "Independent-minded {job} from {city} who rejects partisan extremes. {pronoun_possessive} work on {cause} demonstrates commitment to problem-solving over politics. Seeks consensus, not conflict.",
];

/**
 * Generates random character background narrative
 * 
 * Selects random template and fills with contextually appropriate content.
 * Gender parameter ensures proper pronoun usage.
 * Ethnicity parameter can influence cultural context (future enhancement).
 * 
 * @param gender - Character gender for pronoun matching
 * @param ethnicity - Optional ethnicity for cultural context
 * @returns Generated background narrative (200-400 characters)
 * 
 * @example
 * ```typescript
 * generateBackground('Male')
 * // "Born in Boston, he built a career as a consultant in the technology industry.
 * //  Known for innovative solutions, he brings practical experience to the political arena.
 * //  His platform focuses on economic growth and job creation."
 * 
 * generateBackground('Female', 'Hispanic')
 * // "Former teacher from Miami with a passion for education reform. Her career in the
 * //  public sector revealed systemic challenges requiring political reform. Runs on a
 * //  platform of transparency and accountability."
 * ```
 */
export function generateBackground(
  gender: Gender,
  ethnicity?: Ethnicity
): string {
  // Select random template using chance for better distribution
  const template = chance.pickone(BACKGROUND_TEMPLATES);
  
  // Generate pronouns based on gender
  const pronouns = getPronouns(gender);
  
  // Generate dynamic content
  const city = faker.location.city();
  const job = getRandomJob();
  const industry = getRandomIndustry();
  const achievement = getRandomAchievement();
  const cause = getRandomCause();
  
  // Replace all placeholders
  let background = template
    .replace(/{city}/g, city)
    .replace(/{job}/g, job)
    .replace(/{industry}/g, industry)
    .replace(/{achievement}/g, achievement)
    .replace(/{cause}/g, cause)
    .replace(/{pronoun_subject}/g, pronouns.subject)
    .replace(/{pronoun_object}/g, pronouns.object)
    .replace(/{pronoun_possessive}/g, pronouns.possessive);
  
  return background;
}

/**
 * Gets appropriate pronouns for gender
 * 
 * @param gender - Character gender
 * @returns Pronoun set (subject/object/possessive)
 * @private
 */
function getPronouns(gender: Gender): {
  subject: string;
  object: string;
  possessive: string;
} {
  if (gender === 'Male') {
    return {
      subject: 'he',
      object: 'him',
      possessive: 'his',
    };
  } else {
    return {
      subject: 'she',
      object: 'her',
      possessive: 'her',
    };
  }
}

/**
 * Gets random profession appropriate for political candidates
 * 
 * Focuses on careers commonly seen in politics: law, business, education,
 * military, public service, healthcare, etc.
 * 
 * @returns Random profession
 * @private
 */
function getRandomJob(): string {
  const jobs = [
    // Legal/Government
    'lawyer', 'attorney', 'prosecutor', 'public defender', 'judge',
    'city council member', 'mayor', 'state representative',
    
    // Business
    'business owner', 'entrepreneur', 'consultant', 'executive',
    'manager', 'small business owner', 'CEO', 'corporate leader',
    
    // Education
    'teacher', 'professor', 'school administrator', 'educator',
    'principal', 'superintendent', 'academic',
    
    // Healthcare
    'doctor', 'physician', 'nurse', 'healthcare administrator',
    'surgeon', 'medical professional', 'healthcare provider',
    
    // Military/Law Enforcement
    'veteran', 'military officer', 'police officer', 'sheriff',
    'firefighter', 'first responder', 'service member',
    
    // Public Service
    'community organizer', 'nonprofit director', 'social worker',
    'civil servant', 'public servant', 'advocate', 'activist',
    
    // Professional
    'engineer', 'scientist', 'researcher', 'journalist',
    'financial advisor', 'accountant', 'real estate agent',
  ];
  
  return chance.pickone(jobs);
}

/**
 * Gets random industry sector
 * 
 * @returns Random industry
 * @private
 */
function getRandomIndustry(): string {
  const industries = [
    'technology', 'healthcare', 'education', 'manufacturing',
    'finance', 'real estate', 'energy', 'agriculture',
    'transportation', 'retail', 'hospitality', 'construction',
    'media', 'telecommunications', 'public', 'nonprofit',
    'legal', 'consulting', 'insurance', 'defense',
  ];
  
  return chance.pickone(industries);
}

/**
 * Gets random professional achievement
 * 
 * @returns Random achievement phrase
 * @private
 */
function getRandomAchievement(): string {
  const achievements = [
    'innovative solutions',
    'collaborative leadership',
    'community engagement',
    'fiscal responsibility',
    'strategic thinking',
    'ethical practices',
    'effective communication',
    'problem-solving skills',
    'proven results',
    'dedication to service',
    'transparency',
    'accountability',
    'integrity',
    'bipartisan cooperation',
    'grassroots organizing',
  ];
  
  return chance.pickone(achievements);
}

/**
 * Gets random political cause/issue
 * 
 * @returns Random cause phrase
 * @private
 */
function getRandomCause(): string {
  const causes = [
    'education reform',
    'healthcare access',
    'economic development',
    'environmental protection',
    'criminal justice reform',
    'affordable housing',
    'workers\' rights',
    'small business support',
    'infrastructure investment',
    'tax fairness',
    'public safety',
    'transparency in government',
    'reducing inequality',
    'improving schools',
    'job creation',
    'fiscal responsibility',
    'protecting civil liberties',
    'campaign finance reform',
    'veterans\' services',
    'senior care',
  ];
  
  return chance.pickone(causes);
}

/**
 * Generates multiple background options for user selection
 * 
 * Creates 3-5 different backgrounds so user can pick their favorite.
 * 
 * @param gender - Character gender
 * @param ethnicity - Optional ethnicity
 * @param count - Number of options (default: 3)
 * @returns Array of background narratives
 * 
 * @example
 * ```typescript
 * generateBackgroundOptions('Female', 'Asian', 3)
 * // [background1, background2, background3]
 * ```
 */
export function generateBackgroundOptions(
  gender: Gender,
  ethnicity?: Ethnicity,
  count: number = 3
): string[] {
  const backgrounds: string[] = [];
  
  for (let i = 0; i < count; i++) {
    backgrounds.push(generateBackground(gender, ethnicity));
  }
  
  return backgrounds;
}

/**
 * Validates background length
 * 
 * @param background - Background text to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * validateBackgroundLength("Short text")
 * // { isValid: true, length: 10, remaining: 490 }
 * 
 * validateBackgroundLength("Very long text...".repeat(100))
 * // { isValid: false, length: 550, remaining: -50 }
 * ```
 */
export function validateBackgroundLength(background: string): {
  isValid: boolean;
  length: number;
  remaining: number;
  error?: string;
} {
  const length = background.length;
  const maxLength = 500;
  const remaining = maxLength - length;
  
  if (length > maxLength) {
    return {
      isValid: false,
      length,
      remaining,
      error: `Background exceeds maximum length by ${Math.abs(remaining)} characters`,
    };
  }
  
  return {
    isValid: true,
    length,
    remaining,
  };
}

/**
 * IMPLEMENTATION NOTES
 * 
 * Template Design:
 * - 18 narrative templates covering common political backgrounds
 * - Templates: Business, Public Service, Education, Outsider, Grassroots, Reformer, Bipartisan
 * - Length: 200-400 characters (fits within 500 char limit with margin)
 * - Dynamic placeholders: city, job, industry, achievement, cause, pronouns
 * 
 * Integration:
 * - @faker-js/faker: Cities, random data generation
 * - chance: Better random template selection distribution
 * - Type-safe: Uses Gender and Ethnicity types from portraits.ts
 * 
 * Design Decisions:
 * 1. Gender-aware pronouns (he/she, him/her, his/her)
 * 2. Politically neutral templates (avoid partisan language)
 * 3. Realistic professions common in politics
 * 4. Diverse causes representing various policy areas
 * 5. US-focused geography (faker.location.city() gives US cities)
 * 
 * Usage Patterns:
 * - Registration page: Single button generates full background
 * - Multiple options: Generate 3-5 for user selection
 * - Edit mode: User can regenerate or manually edit
 * - Validation: Check length before submission
 * 
 * Performance:
 * - O(1) generation (template substitution)
 * - < 1ms per background (instant for UI)
 * - No network calls (all data local)
 * 
 * Future Enhancements:
 * - Ethnicity-aware cultural context (e.g., Hispanic candidates from border states)
 * - Historical context (mention specific events/eras)
 * - Political party integration (templates with party-specific language)
 * - Regional variations (Southern vs Northeastern vs Western backgrounds)
 * - ML-based coherence checking (ensure generated text makes sense)
 * - User customization (allow template editing/creation)
 */
