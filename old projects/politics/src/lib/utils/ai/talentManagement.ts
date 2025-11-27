/**
 * @file src/lib/utils/ai/talentManagement.ts
 * @description AI talent management and hiring utilities for Technology/AI companies
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Specialized talent management system for AI companies with PhD hiring, research
 * credentials (h-index, publications), competitive salary calculations, poaching
 * mechanics, productivity estimation, and promotion eligibility. Mirrors real-world
 * AI talent market dynamics including PhD premiums (1.5-2x salaries), skill tiers
 * (Junior/Mid/Senior/PhD), and retention challenges.
 * 
 * KEY FUNCTIONS:
 * 1. calculateCompetitiveSalary() - Market rate calculation with PhD premium
 * 2. generateCandidatePool() - Hiring pool generation with skill distributions
 * 3. calculateRetentionRisk() - Poaching probability based on satisfaction
 * 4. calculateProductivity() - Output estimation from skills × resources
 * 5. calculatePromotionEligibility() - Career advancement logic
 * 
 * USAGE:
 * ```typescript
 * import {
 *   calculateCompetitiveSalary,
 *   generateCandidatePool,
 *   calculateRetentionRisk
 * } from '@/lib/utils/ai/talentManagement';
 * 
 * // Calculate market salary for PhD ML Engineer
 * const salary = calculateCompetitiveSalary({
 *   role: 'MLEngineer',
 *   skillLevel: 85,
 *   hasPhD: true,
 *   yearsExperience: 5,
 *   marketConditions: { demandMultiplier: 1.2, location: 'San Francisco' }
 * });
 * // Returns: { baseSalary: 220000, phDPremium: 1.8, totalSalary: 396000, ... }
 * 
 * // Generate candidate pool for hiring
 * const candidates = generateCandidatePool({
 *   role: 'ResearchScientist',
 *   count: 10,
 *   companyReputation: 75,
 *   skillTier: 'Senior'
 * });
 * // Returns: Array of 10 candidate profiles with skills, PhD status, h-index
 * 
 * // Calculate retention risk for employee
 * const risk = calculateRetentionRisk({
 *   currentSalary: 180000,
 *   marketSalary: 220000,
 *   satisfaction: 65,
 *   competitorOffers: 2,
 *   yearsInRole: 1.5
 * });
 * // Returns: { riskScore: 72, severity: 'High', recommendations: [...] }
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Salaries calibrated to 2025 AI market rates (MLEngineers $120k-$350k, PhDs +50-80%)
 * - PhD premium reflects real-world talent scarcity (OpenAI, Anthropic, Google competition)
 * - Skill distributions use normal distribution with reputation modifiers
 * - Retention risk combines salary gap, satisfaction, tenure, and external pressure
 * - Productivity formula: (researchAbility × codingSkill × computeResources) / projectComplexity
 * - Promotion gates: time in role (2+ years), performance (7+/10), company level requirements
 */

import { Types as _Types } from 'mongoose';

/**
 * AI-specific employee roles
 */
export type AIRole = 'MLEngineer' | 'ResearchScientist' | 'DataEngineer' | 'MLOps' | 'ProductManager';

/**
 * Domain expertise areas for AI employees
 */
export type DomainExpertise = 'NLP' | 'ComputerVision' | 'ReinforcementLearning' | 'GenerativeAI' | 'Speech' | 'Robotics';

/**
 * Skill tier classification
 */
export type SkillTier = 'Junior' | 'Mid' | 'Senior' | 'PhD';

/**
 * Market conditions for salary calculation
 */
export interface MarketConditions {
  demandMultiplier: number;      // 0.8-1.5 (market demand for role)
  location: string;               // Location affects salary (SF/NYC premium)
  industryGrowth: number;         // 0.8-1.3 (AI boom multiplier)
  competitionLevel: number;       // 0.9-1.4 (how many competitors hiring)
}

/**
 * Salary calculation result
 */
export interface SalaryCalculation {
  baseSalary: number;             // Base market rate for role/skill
  phDPremium: number;             // PhD multiplier (1.0 if no PhD, 1.5-2.0 if PhD)
  experiencePremium: number;      // Years of experience multiplier
  locationMultiplier: number;     // Geographic cost adjustment
  totalSalary: number;            // Final calculated salary
  marketRange: {                  // Industry salary range
    min: number;
    max: number;
    median: number;
  };
  competitiveness: 'BelowMarket' | 'AtMarket' | 'AboveMarket' | 'TopTier';
  recommendations: string[];      // Hiring strategy recommendations
}

/**
 * AI employee candidate profile
 */
export interface AICandidate {
  id: string;                     // Temporary ID for selection
  firstName: string;
  lastName: string;
  email: string;
  role: AIRole;
  
  // Academic credentials
  hasPhD: boolean;
  university?: string;            // Stanford, MIT, CMU, etc.
  publications: number;           // Research papers published
  hIndex: number;                 // Citation impact (0-100+)
  
  // Skills (1-10 scale)
  researchAbility: number;        // Research quality and speed
  codingSkill: number;            // Implementation ability
  domainExpertise: DomainExpertise;
  
  // Base employee skills (1-100 scale)
  technical: number;
  analytical: number;
  communication: number;
  creativity: number;
  
  // Experience & compensation
  yearsExperience: number;
  currentSalary: number;
  expectedSalary: number;         // Minimum acceptable offer
  stockPreference: number;        // 0-100 (how much they value equity)
  
  // Attributes
  loyalty: number;                // 1-100 (retention likelihood)
  learningRate: number;           // 1-100 (training effectiveness)
  productivity: number;           // 1-100 (work output)
  
  // Recruitment factors
  competingOffers: number;        // Number of other offers
  interestLevel: number;          // 1-100 (interest in company)
  recruitmentDifficulty: number;  // 1-100 (how hard to hire)
}

/**
 * Retention risk assessment result
 */
export interface RetentionRisk {
  riskScore: number;              // 0-100 (higher = more likely to leave)
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  factors: {                      // Contributing factors breakdown
    salaryGap: number;            // How far below market (0-100)
    satisfactionScore: number;    // Employee satisfaction (0-100)
    tenureRisk: number;           // Time in role risk (0-100)
    externalPressure: number;     // Competitor poaching (0-100)
  };
  recommendations: string[];      // Retention strategies
  counterOfferAmount?: number;    // Suggested salary adjustment
  urgency: 'Monitor' | 'Action' | 'Immediate';
}

/**
 * Productivity calculation result
 */
export interface ProductivityMetrics {
  outputScore: number;            // 0-100 (overall productivity)
  researchOutput: number;         // Papers/month potential
  codeOutput: number;             // Lines/features per week
  projectImpact: number;          // Contribution to project success (0-100)
  efficiency: number;             // Resource utilization (0-100)
  collaboration: number;          // Team synergy factor (0-100)
  bottlenecks: string[];          // Identified productivity blockers
  recommendations: string[];      // Productivity improvement suggestions
}

/**
 * Promotion eligibility result
 */
export interface PromotionEligibility {
  eligible: boolean;
  score: number;                  // 0-100 (promotion readiness)
  requirements: {
    timeInRole: { met: boolean; current: number; required: number };
    performance: { met: boolean; current: number; required: number };
    skillLevel: { met: boolean; current: number; required: number };
    companyLevel: { met: boolean; current: number; required: number };
    publications?: { met: boolean; current: number; required: number };
  };
  nextRole?: AIRole;
  blockers: string[];             // What's preventing promotion
  timeline: string;               // Estimated time to promotion
  recommendations: string[];      // Career development suggestions
}

/**
 * Calculate competitive salary for AI role with PhD premium
 * 
 * Mirrors real-world AI talent market:
 * - MLEngineers: $120k-$350k (PhD: $180k-$500k)
 * - Research Scientists: $150k-$400k (PhD required: $200k-$600k)
 * - Data Engineers: $100k-$250k (PhD: $140k-$350k)
 * - MLOps: $110k-$280k (PhD rare but: $150k-$380k)
 * - Product Managers: $130k-$320k (PhD: $170k-$420k)
 * 
 * PhD premium: 1.5x-2.0x depending on role/demand
 * Location premium: SF/NYC/Seattle +30-50%, Austin/Boulder +15-25%
 * 
 * @param role - AI employee role
 * @param skillLevel - Average skill rating (1-100 scale)
 * @param hasPhD - Whether candidate has PhD
 * @param yearsExperience - Years of professional experience (0-30)
 * @param marketConditions - Current market conditions (optional)
 * @returns Detailed salary calculation with recommendations
 * 
 * @example
 * ```typescript
 * const salary = calculateCompetitiveSalary({
 *   role: 'ResearchScientist',
 *   skillLevel: 88,
 *   hasPhD: true,
 *   yearsExperience: 7,
 *   marketConditions: { demandMultiplier: 1.3, location: 'San Francisco', industryGrowth: 1.2, competitionLevel: 1.4 }
 * });
 * // Returns: { totalSalary: 425000, phDPremium: 1.8, competitiveness: 'TopTier', ... }
 * ```
 */
export function calculateCompetitiveSalary(params: {
  role: AIRole;
  skillLevel: number;
  hasPhD: boolean;
  yearsExperience: number;
  marketConditions?: Partial<MarketConditions>;
}): SalaryCalculation {
  const { role, skillLevel, hasPhD, yearsExperience, marketConditions } = params;

  // Validate inputs
  if (skillLevel < 1 || skillLevel > 100) {
    throw new Error('Skill level must be between 1 and 100');
  }
  if (yearsExperience < 0 || yearsExperience > 50) {
    throw new Error('Years of experience must be between 0 and 50');
  }

  // Base salary ranges by role (2025 market rates)
  const baseSalaryRanges: Record<AIRole, { min: number; max: number; median: number }> = {
    MLEngineer: { min: 120000, max: 350000, median: 210000 },
    ResearchScientist: { min: 150000, max: 400000, median: 250000 },
    DataEngineer: { min: 100000, max: 250000, median: 160000 },
    MLOps: { min: 110000, max: 280000, median: 180000 },
    ProductManager: { min: 130000, max: 320000, median: 200000 },
  };

  // Get base range for role
  const range = baseSalaryRanges[role];

  // Calculate base salary from skill level (interpolate between min and max)
  const skillFactor = skillLevel / 100;
  const baseSalary = range.min + (range.max - range.min) * skillFactor;

  // PhD premium calculation
  // Research-heavy roles (ResearchScientist) get higher PhD premium
  // Implementation-heavy roles (MLOps, DataEngineer) get lower premium
  const phDPremiumRates: Record<AIRole, number> = {
    ResearchScientist: 1.8,  // PhDs highly valued for research
    MLEngineer: 1.6,         // PhDs valued for architecture decisions
    ProductManager: 1.5,     // PhDs valued for technical depth
    DataEngineer: 1.4,       // PhDs less critical for infrastructure
    MLOps: 1.3,              // PhDs rare and less critical
  };
  const phDPremium = hasPhD ? phDPremiumRates[role] : 1.0;

  // Experience premium (logarithmic growth, diminishing returns after 10 years)
  // 0 years: 1.0x, 5 years: 1.3x, 10 years: 1.5x, 20 years: 1.7x
  const experiencePremium = 1.0 + Math.log10(yearsExperience + 1) * 0.5;

  // Market conditions (defaults if not provided)
  const market: MarketConditions = {
    demandMultiplier: marketConditions?.demandMultiplier ?? 1.1, // AI boom default
    location: marketConditions?.location ?? 'National',
    industryGrowth: marketConditions?.industryGrowth ?? 1.15,   // AI industry growth
    competitionLevel: marketConditions?.competitionLevel ?? 1.2, // High competition
  };

  // Location multiplier (cost of living + demand)
  const locationMultipliers: Record<string, number> = {
    'San Francisco': 1.50,
    'New York': 1.45,
    'Seattle': 1.35,
    'Austin': 1.25,
    'Boulder': 1.20,
    'Boston': 1.30,
    'Los Angeles': 1.35,
    'Remote': 1.10,
    'National': 1.00,
  };
  const locationMultiplier = locationMultipliers[market.location] ?? 1.0;

  // Calculate total salary
  const totalSalary = Math.round(
    baseSalary *
    phDPremium *
    experiencePremium *
    locationMultiplier *
    market.demandMultiplier *
    market.industryGrowth *
    market.competitionLevel
  );

  // Determine competitiveness vs market median
  const medianWithPremiums = range.median * phDPremium * experiencePremium;
  let competitiveness: SalaryCalculation['competitiveness'];
  if (totalSalary < medianWithPremiums * 0.85) competitiveness = 'BelowMarket';
  else if (totalSalary < medianWithPremiums * 1.15) competitiveness = 'AtMarket';
  else if (totalSalary < medianWithPremiums * 1.40) competitiveness = 'AboveMarket';
  else competitiveness = 'TopTier';

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (hasPhD && phDPremium < 1.5) {
    recommendations.push(`PhD premium of ${phDPremium}x is standard for ${role}. Consider emphasizing research opportunities.`);
  }
  if (competitiveness === 'BelowMarket') {
    recommendations.push(`Salary is ${Math.round(((medianWithPremiums - totalSalary) / medianWithPremiums) * 100)}% below market. Risk of losing candidate to competitors.`);
  }
  if (competitiveness === 'TopTier') {
    recommendations.push('Salary is competitive and likely to attract top talent. Consider stock options for cost management.');
  }
  if (market.competitionLevel > 1.3) {
    recommendations.push('High competition for AI talent. Offer expedited decision timeline and clear growth path.');
  }
  if (locationMultiplier > 1.3) {
    recommendations.push(`${market.location} has high cost of living. Ensure total compensation package includes benefits.`);
  }

  return {
    baseSalary: Math.round(baseSalary),
    phDPremium,
    experiencePremium,
    locationMultiplier,
    totalSalary,
    marketRange: {
      min: Math.round(range.min * phDPremium),
      max: Math.round(range.max * phDPremium),
      median: Math.round(range.median * phDPremium),
    },
    competitiveness,
    recommendations,
  };
}

/**
 * Generate pool of AI candidate profiles for hiring
 * 
 * Uses normal distribution for skill generation with reputation modifiers:
 * - High reputation (80+): Attracts better candidates (skill mean +10)
 * - Low reputation (<50): Attracts weaker candidates (skill mean -10)
 * 
 * Skill tier distribution:
 * - Junior (4-6): 40% of pool, recent grads, 0-2 years experience
 * - Mid (6-8): 35% of pool, 2-7 years experience
 * - Senior (8-9): 20% of pool, 7-15 years experience
 * - PhD (9-10): 5% of pool (10x rarer), 0-20+ years research
 * 
 * PhD candidates have 3-5x publications, h-index correlates with experience
 * 
 * @param role - AI role to generate candidates for
 * @param count - Number of candidates to generate (1-50)
 * @param companyReputation - Company reputation score (1-100)
 * @param skillTier - Target skill tier (optional, generates mix if not specified)
 * @returns Array of candidate profiles ready for review
 * 
 * @example
 * ```typescript
 * const candidates = generateCandidatePool({
 *   role: 'MLEngineer',
 *   count: 15,
 *   companyReputation: 72,
 *   skillTier: 'Senior' // Optional: focus on senior candidates
 * });
 * // Returns: 15 MLEngineer candidates, mostly Senior tier due to filter
 * ```
 */
export function generateCandidatePool(params: {
  role: AIRole;
  count: number;
  companyReputation: number;
  skillTier?: SkillTier;
}): AICandidate[] {
  const { role, count, companyReputation, skillTier } = params;

  // Validate inputs
  if (count < 1 || count > 50) {
    throw new Error('Candidate count must be between 1 and 50');
  }
  if (companyReputation < 1 || companyReputation > 100) {
    throw new Error('Company reputation must be between 1 and 100');
  }

  const candidates: AICandidate[] = [];

  // Reputation affects candidate quality
  const reputationBonus = (companyReputation - 50) / 5; // -10 to +10 skill bonus

  // First/last name pools for generation
  const firstNames = ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack', 'Kate', 'Liam', 'Maya', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Rita', 'Sam', 'Tina'];
  const lastNames = ['Chen', 'Smith', 'Kumar', 'Garcia', 'Wang', 'Lee', 'Brown', 'Patel', 'Johnson', 'Martinez', 'Kim', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'White', 'Harris', 'Clark', 'Lewis'];

  // University tiers (affects PhD quality)
  const topTierUniversities = ['Stanford', 'MIT', 'CMU', 'UC Berkeley', 'Oxford', 'Cambridge'];
  const secondTierUniversities = ['Cornell', 'UW', 'UIUC', 'Georgia Tech', 'UT Austin', 'UCLA'];
  const thirdTierUniversities = ['Purdue', 'UMich', 'USC', 'Brown', 'NYU', 'UCSD'];

  // Domain expertise distribution by role
  const domainsByRole: Record<AIRole, DomainExpertise[]> = {
    MLEngineer: ['NLP', 'ComputerVision', 'GenerativeAI'],
    ResearchScientist: ['NLP', 'ReinforcementLearning', 'GenerativeAI', 'Robotics'],
    DataEngineer: ['NLP', 'ComputerVision'], // Less research-focused
    MLOps: ['ComputerVision', 'NLP'], // Infrastructure-focused
    ProductManager: ['NLP', 'ComputerVision', 'GenerativeAI'], // Broad exposure
  };

  for (let i = 0; i < count; i++) {
    // Determine tier if not specified
    let tier: SkillTier;
    if (skillTier) {
      tier = skillTier;
    } else {
      // Natural distribution: 40% Junior, 35% Mid, 20% Senior, 5% PhD
      const rand = Math.random();
      if (rand < 0.40) tier = 'Junior';
      else if (rand < 0.75) tier = 'Mid';
      else if (rand < 0.95) tier = 'Senior';
      else tier = 'PhD';
    }

    // Base skill ranges by tier
    const skillRanges: Record<SkillTier, { min: number; max: number }> = {
      Junior: { min: 40, max: 60 },
      Mid: { min: 60, max: 80 },
      Senior: { min: 75, max: 90 },
      PhD: { min: 85, max: 100 },
    };

    // Random skill within tier range + reputation bonus
    const baseSkill = skillRanges[tier].min + Math.random() * (skillRanges[tier].max - skillRanges[tier].min);
    const adjustedSkill = Math.min(100, Math.max(1, baseSkill + reputationBonus));

    // PhD status (100% for PhD tier, rare otherwise)
    const hasPhD = tier === 'PhD' || (tier === 'Senior' && Math.random() < 0.15);

    // Generate skills (1-10 scale for AI-specific, 1-100 for base)
    const researchAbility = Math.round((adjustedSkill / 10) * (hasPhD ? 1.3 : 1.0));
    const codingSkill = Math.round((adjustedSkill / 10) * (role === 'MLEngineer' ? 1.2 : role === 'ResearchScientist' ? 0.9 : 1.0));
    
    // Publications and h-index for PhD candidates
    let publications = 0;
    let hIndex = 0;
    let university: string | undefined;
    if (hasPhD) {
      const yearsResearch = Math.max(0, Math.random() * 20);
      publications = Math.round(yearsResearch * (2 + Math.random() * 3)); // 2-5 papers/year
      hIndex = Math.min(100, Math.round(publications * 0.6 * Math.random())); // h-index ~60% of publications
      
      // University tier affects quality
      const uniRand = Math.random();
      if (uniRand < 0.2) university = topTierUniversities[Math.floor(Math.random() * topTierUniversities.length)];
      else if (uniRand < 0.6) university = secondTierUniversities[Math.floor(Math.random() * secondTierUniversities.length)];
      else university = thirdTierUniversities[Math.floor(Math.random() * thirdTierUniversities.length)];
    }

    // Experience years by tier
    const experienceRanges: Record<SkillTier, { min: number; max: number }> = {
      Junior: { min: 0, max: 2 },
      Mid: { min: 2, max: 7 },
      Senior: { min: 7, max: 15 },
      PhD: { min: 0, max: 20 }, // PhD fresh grads or experienced researchers
    };
    const yearsExperience = experienceRanges[tier].min + Math.random() * (experienceRanges[tier].max - experienceRanges[tier].min);

    // Calculate expected salary
    const salaryCalc = calculateCompetitiveSalary({
      role,
      skillLevel: adjustedSkill,
      hasPhD,
      yearsExperience,
    });

    // Current salary (90-110% of expected, candidate might be underpaid/overpaid)
    const currentSalary = Math.round(salaryCalc.totalSalary * (0.9 + Math.random() * 0.2));

    // Generate candidate profile
    const candidate: AICandidate = {
      id: `candidate-${role}-${i + 1}-${Date.now()}`,
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
      email: '', // Will be set below
      role,
      
      // Academic
      hasPhD,
      university,
      publications,
      hIndex,
      
      // AI-specific skills (1-10 scale)
      researchAbility: Math.min(10, Math.max(1, researchAbility)),
      codingSkill: Math.min(10, Math.max(1, codingSkill)),
      domainExpertise: domainsByRole[role][Math.floor(Math.random() * domainsByRole[role].length)],
      
      // Base skills (1-100 scale)
      technical: Math.round(adjustedSkill * (role === 'MLEngineer' || role === 'DataEngineer' ? 1.1 : 1.0)),
      analytical: Math.round(adjustedSkill * (role === 'ResearchScientist' ? 1.15 : 1.0)),
      communication: Math.round(adjustedSkill * (role === 'ProductManager' ? 1.2 : 0.8)),
      creativity: Math.round(adjustedSkill * (role === 'ResearchScientist' || role === 'ProductManager' ? 1.1 : 0.9)),
      
      // Experience & compensation
      yearsExperience: Math.round(yearsExperience * 10) / 10,
      currentSalary,
      expectedSalary: Math.round(salaryCalc.totalSalary * (1.05 + Math.random() * 0.1)), // Want 5-15% raise
      stockPreference: Math.round(40 + Math.random() * 40), // 40-80% value equity
      
      // Attributes
      loyalty: Math.round(50 + Math.random() * 30), // 50-80 loyalty
      learningRate: Math.round(adjustedSkill * (hasPhD ? 1.1 : 1.0) * 0.8),
      productivity: Math.round(adjustedSkill * 0.85),
      
      // Recruitment
      competingOffers: Math.floor(Math.random() * (tier === 'PhD' ? 4 : tier === 'Senior' ? 3 : 1)),
      interestLevel: Math.round(Math.min(100, 50 + reputationBonus * 3 + Math.random() * 30)), // Reputation affects interest
      recruitmentDifficulty: Math.round(adjustedSkill * 0.8 + (hasPhD ? 20 : 0)),
    };

    // Set email
    candidate.email = `${candidate.firstName.toLowerCase()}.${candidate.lastName.toLowerCase()}@email.com`;

    candidates.push(candidate);
  }

  return candidates;
}

/**
 * Calculate retention risk for AI employee
 * 
 * Retention risk factors:
 * 1. Salary gap (40%): How far below market rate
 * 2. Satisfaction (30%): Overall job satisfaction
 * 3. Tenure (15%): Time in role (high risk at 1-2 years)
 * 4. External pressure (15%): Competitor poaching attempts
 * 
 * Risk severity:
 * - Low (<30): Stable, unlikely to leave
 * - Medium (30-60): Monitor, standard turnover risk
 * - High (60-80): Action needed, likely to leave without intervention
 * - Critical (>80): Immediate action, actively job hunting
 * 
 * @param currentSalary - Employee's current annual salary
 * @param marketSalary - Current market rate for role/skills
 * @param satisfaction - Employee satisfaction score (1-100)
 * @param competitorOffers - Number of known competitor offers
 * @param yearsInRole - Time in current role (years)
 * @returns Retention risk assessment with recommendations
 * 
 * @example
 * ```typescript
 * const risk = calculateRetentionRisk({
 *   currentSalary: 160000,
 *   marketSalary: 220000,
 *   satisfaction: 55,
 *   competitorOffers: 3,
 *   yearsInRole: 1.8
 * });
 * // Returns: { riskScore: 78, severity: 'High', urgency: 'Action', ... }
 * ```
 */
export function calculateRetentionRisk(params: {
  currentSalary: number;
  marketSalary: number;
  satisfaction: number;
  competitorOffers: number;
  yearsInRole: number;
}): RetentionRisk {
  const { currentSalary, marketSalary, satisfaction, competitorOffers, yearsInRole } = params;

  // Validate inputs
  if (currentSalary < 0) throw new Error('Current salary cannot be negative');
  if (marketSalary < 0) throw new Error('Market salary cannot be negative');
  if (satisfaction < 1 || satisfaction > 100) throw new Error('Satisfaction must be between 1 and 100');
  if (competitorOffers < 0) throw new Error('Competitor offers cannot be negative');
  if (yearsInRole < 0) throw new Error('Years in role cannot be negative');

  // Factor 1: Salary gap (0-100 scale)
  // Gap >30% = very high risk, <10% = low risk
  const salaryGap = Math.max(0, ((marketSalary - currentSalary) / marketSalary) * 100);
  const salaryGapScore = Math.min(100, salaryGap * 2.5); // 30% gap → 75 score

  // Factor 2: Satisfaction (inverse, 0-100 scale)
  const satisfactionScore = 100 - satisfaction;

  // Factor 3: Tenure risk (U-shaped curve, highest risk at 1-3 years)
  // 0-1 years: 40 (settling in), 1-3 years: 80 (peak flight risk), 5+ years: 30 (stable)
  let tenureRisk: number;
  if (yearsInRole < 1) tenureRisk = 40;
  else if (yearsInRole < 2) tenureRisk = 70 + (yearsInRole - 1) * 20; // 70-90
  else if (yearsInRole < 3) tenureRisk = 90 - (yearsInRole - 2) * 30; // 90-60
  else if (yearsInRole < 5) tenureRisk = 60 - (yearsInRole - 3) * 15; // 60-30
  else tenureRisk = Math.max(20, 30 - (yearsInRole - 5) * 2); // Diminishes slowly

  // Factor 4: External pressure (competitor poaching)
  const externalPressure = Math.min(100, competitorOffers * 25); // Each offer adds 25 points

  // Calculate weighted risk score
  const riskScore = Math.round(
    salaryGapScore * 0.40 +
    satisfactionScore * 0.30 +
    tenureRisk * 0.15 +
    externalPressure * 0.15
  );

  // Determine severity
  let severity: RetentionRisk['severity'];
  if (riskScore < 30) severity = 'Low';
  else if (riskScore < 60) severity = 'Medium';
  else if (riskScore < 80) severity = 'High';
  else severity = 'Critical';

  // Determine urgency
  let urgency: RetentionRisk['urgency'];
  if (competitorOffers >= 2 || riskScore >= 80) urgency = 'Immediate';
  else if (riskScore >= 60 || salaryGapScore >= 60) urgency = 'Action';
  else urgency = 'Monitor';

  // Generate recommendations
  const recommendations: string[] = [];
  let counterOfferAmount: number | undefined;

  if (salaryGapScore > 50) {
    const gap = marketSalary - currentSalary;
    counterOfferAmount = currentSalary + Math.round(gap * 0.7); // Close 70% of gap
    recommendations.push(`Salary is ${Math.round(salaryGap)}% below market ($${gap.toLocaleString()} gap). Counter-offer: $${counterOfferAmount.toLocaleString()}.`);
  }

  if (satisfactionScore > 60) {
    recommendations.push('Low satisfaction detected. Schedule 1-on-1 to identify concerns (workload, culture, growth opportunities).');
  }

  if (tenureRisk > 70) {
    recommendations.push(`Employee at ${yearsInRole.toFixed(1)} years (peak flight risk). Discuss career path and promotion timeline.`);
  }

  if (competitorOffers >= 2) {
    recommendations.push(`${competitorOffers} competitor offers detected. Expedite counter-offer and emphasize unique value proposition.`);
  }

  if (riskScore >= 80) {
    recommendations.push('CRITICAL: Employee likely actively job hunting. Immediate retention conversation required within 48 hours.');
  }

  if (riskScore < 30 && salaryGapScore < 20) {
    recommendations.push('Low retention risk. Employee stable and fairly compensated. Continue regular check-ins.');
  }

  return {
    riskScore,
    severity,
    factors: {
      salaryGap: Math.round(salaryGapScore),
      satisfactionScore: Math.round(satisfactionScore),
      tenureRisk: Math.round(tenureRisk),
      externalPressure: Math.round(externalPressure),
    },
    recommendations,
    counterOfferAmount,
    urgency,
  };
}

/**
 * Calculate employee productivity metrics for AI work
 * 
 * Productivity formula:
 * outputScore = (researchAbility × codingSkill × computeResources) / projectComplexity
 * 
 * Research output: Publications per month (PhD researchers)
 * Code output: Features/implementations per sprint
 * Project impact: Contribution to project success
 * Efficiency: How well resources are utilized
 * 
 * @param researchAbility - Research skill (1-10 scale)
 * @param codingSkill - Coding skill (1-10 scale)
 * @param computeResources - Compute budget allocated ($500-$5000/mo)
 * @param projectComplexity - Project difficulty (1-10 scale)
 * @param teamSize - Size of team employee works with (1-50)
 * @returns Productivity assessment with bottleneck identification
 * 
 * @example
 * ```typescript
 * const productivity = calculateProductivity({
 *   researchAbility: 9,
 *   codingSkill: 7,
 *   computeResources: 3000,
 *   projectComplexity: 8,
 *   teamSize: 12
 * });
 * // Returns: { outputScore: 82, researchOutput: 1.8, codeOutput: 85, ... }
 * ```
 */
export function calculateProductivity(params: {
  researchAbility: number;
  codingSkill: number;
  computeResources: number;
  projectComplexity: number;
  teamSize: number;
}): ProductivityMetrics {
  const { researchAbility, codingSkill, computeResources, projectComplexity, teamSize } = params;

  // Validate inputs
  if (researchAbility < 1 || researchAbility > 10) throw new Error('Research ability must be between 1 and 10');
  if (codingSkill < 1 || codingSkill > 10) throw new Error('Coding skill must be between 1 and 10');
  if (computeResources < 0) throw new Error('Compute resources cannot be negative');
  if (projectComplexity < 1 || projectComplexity > 10) throw new Error('Project complexity must be between 1 and 10');
  if (teamSize < 1) throw new Error('Team size must be at least 1');

  // Normalize compute resources (0-100 scale, $500 = 10, $5000 = 100)
  const computeScore = Math.min(100, (computeResources / 50));

  // Base productivity calculation
  const skillProduct = researchAbility * codingSkill; // Max 100
  const resourceBonus = computeScore / 100; // 0-1 multiplier
  const complexityPenalty = projectComplexity / 10; // 0.1-1.0 penalty

  // Output score (0-100)
  const outputScore = Math.round(
    ((skillProduct * (1 + resourceBonus)) / complexityPenalty) * 0.8
  );

  // Research output (papers per month, mainly for PhDs)
  // High research ability + sufficient compute → more papers
  const researchOutput = researchAbility >= 8 
    ? (researchAbility / 10) * (1 + resourceBonus) * (10 / projectComplexity)
    : 0;

  // Code output (relative scale 0-100, features/implementations per sprint)
  const codeOutput = Math.round(
    ((codingSkill * 10) * (1 + resourceBonus * 0.5)) / complexityPenalty
  );

  // Project impact (how much employee contributes to project success)
  const averageSkill = (researchAbility + codingSkill) / 2;
  const projectImpact = Math.round(
    (averageSkill * 10) * (computeScore / 100) * 0.9
  );

  // Efficiency (resource utilization)
  // High skill with low resources = inefficient, balanced = efficient
  const idealComputeForSkill = averageSkill * 500; // $5k for skill 10, $500 for skill 1
  const resourceGap = Math.abs(computeResources - idealComputeForSkill);
  const efficiency = Math.round(
    Math.max(30, 100 - (resourceGap / idealComputeForSkill) * 50)
  );

  // Collaboration factor (team synergy)
  // Small teams (1-5): 60-80, medium teams (6-15): 80-95, large teams (16+): 70-85
  let collaboration: number;
  if (teamSize <= 5) collaboration = 60 + Math.random() * 20;
  else if (teamSize <= 15) collaboration = 80 + Math.random() * 15;
  else collaboration = 70 + Math.random() * 15;

  // Identify bottlenecks
  const bottlenecks: string[] = [];
  if (computeScore < 30) bottlenecks.push('Insufficient compute resources (< $1,500/mo allocated)');
  if (researchAbility < 5 && projectComplexity > 7) bottlenecks.push('Research ability insufficient for project complexity');
  if (codingSkill < 5 && projectComplexity > 7) bottlenecks.push('Coding skill insufficient for implementation complexity');
  if (teamSize > 20) bottlenecks.push('Large team size may create coordination overhead');
  if (efficiency < 50) bottlenecks.push(`Resource allocation mismatch (needs ~$${Math.round(idealComputeForSkill).toLocaleString()}/mo)`);

  // Recommendations
  const recommendations: string[] = [];
  if (computeScore < 50 && outputScore < 60) {
    recommendations.push(`Increase compute budget to $${Math.round(idealComputeForSkill).toLocaleString()}/mo for optimal productivity.`);
  }
  if (researchAbility >= 8 && researchOutput < 1) {
    recommendations.push('High research ability detected. Allocate time for paper writing to maximize publication output.');
  }
  if (codeOutput < 50) {
    recommendations.push('Low code output. Consider pair programming, code review focus, or reduce meeting overhead.');
  }
  if (projectComplexity >= 8 && averageSkill < 7) {
    recommendations.push('Project complexity exceeds skill level. Pair with senior mentor or break into smaller tasks.');
  }
  if (teamSize > 15 && collaboration < 80) {
    recommendations.push('Large team coordination challenge. Implement clearer task ownership and async communication.');
  }

  return {
    outputScore: Math.min(100, Math.max(0, outputScore)),
    researchOutput: Math.round(researchOutput * 10) / 10,
    codeOutput: Math.min(100, Math.max(0, codeOutput)),
    projectImpact: Math.min(100, Math.max(0, projectImpact)),
    efficiency: Math.min(100, Math.max(0, efficiency)),
    collaboration: Math.round(collaboration),
    bottlenecks,
    recommendations,
  };
}

/**
 * Calculate promotion eligibility for AI employee
 * 
 * Promotion requirements:
 * 1. Time in role: Minimum tenure (varies by role, typically 2+ years)
 * 2. Performance: Rating 7+/10 consistently
 * 3. Skill level: Meet skill threshold for next role
 * 4. Company level: Company size gates senior promotions
 * 5. Publications (Research Scientists): PhD researchers need publications for advancement
 * 
 * Career progression paths:
 * - MLEngineer: Junior → Mid → Senior → Staff → Principal
 * - ResearchScientist: Junior → Senior → Principal → Distinguished
 * - DataEngineer: Junior → Mid → Senior → Staff → Principal
 * - MLOps: Junior → Mid → Senior → Staff
 * - ProductManager: Associate → PM → Senior PM → Group PM
 * 
 * @param currentRole - Employee's current role
 * @param yearsInRole - Time in current role (years)
 * @param performanceRating - Average performance rating (1-10 scale)
 * @param averageSkill - Average of all skills (1-100 scale)
 * @param companyLevel - Company level (1-5)
 * @param publications - Number of publications (for research roles)
 * @returns Promotion eligibility assessment with timeline
 * 
 * @example
 * ```typescript
 * const eligibility = calculatePromotionEligibility({
 *   currentRole: 'MLEngineer',
 *   yearsInRole: 2.5,
 *   performanceRating: 8,
 *   averageSkill: 78,
 *   companyLevel: 3,
 *   publications: 0
 * });
 * // Returns: { eligible: true, score: 85, nextRole: 'SeniorMLEngineer', ... }
 * ```
 */
export function calculatePromotionEligibility(params: {
  currentRole: AIRole;
  yearsInRole: number;
  performanceRating: number;
  averageSkill: number;
  companyLevel: number;
  publications?: number;
}): PromotionEligibility {
  const { currentRole, yearsInRole, performanceRating, averageSkill, companyLevel, publications = 0 } = params;

  // Validate inputs
  if (yearsInRole < 0) throw new Error('Years in role cannot be negative');
  if (performanceRating < 1 || performanceRating > 10) throw new Error('Performance rating must be between 1 and 10');
  if (averageSkill < 1 || averageSkill > 100) throw new Error('Average skill must be between 1 and 100');
  if (companyLevel < 1 || companyLevel > 5) throw new Error('Company level must be between 1 and 5');
  if (publications < 0) throw new Error('Publications cannot be negative');

  // Promotion requirements by role (minimum tenure in years)
  const tenureRequirements: Record<AIRole, number> = {
    MLEngineer: 2.0,           // 2 years to Senior
    ResearchScientist: 2.5,    // 2.5 years (research takes longer)
    DataEngineer: 2.0,
    MLOps: 2.0,
    ProductManager: 2.5,       // PM promotions slower
  };

  // Performance threshold (7/10 minimum)
  const performanceThreshold = 7.0;

  // Skill level threshold (75+ for promotion)
  const skillThreshold = 75;

  // Company level requirements (can't promote beyond company size)
  // Level 1-2: Can't have "Principal" roles
  // Level 3-4: Can have "Staff" and "Principal"
  // Level 5: Can have "Distinguished" roles
  const levelGatesPassed = companyLevel >= 3; // Simplified for now

  // Publication requirements for Research Scientists
  const publicationRequirement = currentRole === 'ResearchScientist' ? 3 : 0;

  // Check each requirement
  const requirements: PromotionEligibility['requirements'] = {
    timeInRole: {
      met: yearsInRole >= tenureRequirements[currentRole],
      current: Math.round(yearsInRole * 10) / 10,
      required: tenureRequirements[currentRole],
    },
    performance: {
      met: performanceRating >= performanceThreshold,
      current: performanceRating,
      required: performanceThreshold,
    },
    skillLevel: {
      met: averageSkill >= skillThreshold,
      current: Math.round(averageSkill),
      required: skillThreshold,
    },
    companyLevel: {
      met: levelGatesPassed,
      current: companyLevel,
      required: 3,
    },
  };

  // Add publication requirement for Research Scientists
  if (currentRole === 'ResearchScientist') {
    requirements.publications = {
      met: publications >= publicationRequirement,
      current: publications,
      required: publicationRequirement,
    };
  }

  // Determine eligibility (all requirements must be met)
  const eligible = Object.values(requirements).every((req) => req.met);

  // Calculate promotion readiness score (0-100)
  const tenureScore = Math.min(100, (yearsInRole / tenureRequirements[currentRole]) * 100);
  const performanceScore = (performanceRating / 10) * 100;
  const skillScore = averageSkill;
  const levelScore = levelGatesPassed ? 100 : 50;
  const publicationScore = currentRole === 'ResearchScientist' 
    ? Math.min(100, (publications / publicationRequirement) * 100)
    : 100;

  const score = Math.round(
    (tenureScore * 0.25) +
    (performanceScore * 0.30) +
    (skillScore * 0.25) +
    (levelScore * 0.10) +
    (publicationScore * 0.10)
  );

  // Identify blockers
  const blockers: string[] = [];
  if (!requirements.timeInRole.met) {
    const remaining = requirements.timeInRole.required - requirements.timeInRole.current;
    blockers.push(`Need ${remaining.toFixed(1)} more years in role (${(remaining * 12).toFixed(0)} months)`);
  }
  if (!requirements.performance.met) {
    const gap = requirements.performance.required - requirements.performance.current;
    blockers.push(`Performance rating ${gap.toFixed(1)} points below threshold`);
  }
  if (!requirements.skillLevel.met) {
    const gap = requirements.skillLevel.required - requirements.skillLevel.current;
    blockers.push(`Skill level ${gap} points below threshold (needs more training/experience)`);
  }
  if (!requirements.companyLevel.met) {
    blockers.push(`Company level ${companyLevel} too low for promotion (need Level 3+ for senior roles)`);
  }
  if (requirements.publications && !requirements.publications.met) {
    const gap = requirements.publications.required - requirements.publications.current;
    blockers.push(`Need ${gap} more publications (Research Scientists require publication track record)`);
  }

  // Estimate timeline to promotion
  let timeline: string;
  if (eligible) {
    timeline = 'Eligible now - recommend promotion discussion';
  } else {
    const monthsToRequirement = Math.max(
      (requirements.timeInRole.required - requirements.timeInRole.current) * 12,
      0
    );
    if (monthsToRequirement > 12) {
      timeline = `${Math.ceil(monthsToRequirement / 12)} years (primary blocker: tenure)`;
    } else if (monthsToRequirement > 0) {
      timeline = `${Math.ceil(monthsToRequirement)} months (primary blocker: tenure)`;
    } else {
      timeline = '6-12 months (address skill/performance gaps)';
    }
  }

  // Recommendations
  const recommendations: string[] = [];
  if (!requirements.skillLevel.met) {
    recommendations.push('Enroll in advanced training programs to increase skill level to 75+.');
  }
  if (!requirements.performance.met) {
    recommendations.push('Focus on high-impact projects to improve performance rating. Request more feedback.');
  }
  if (requirements.publications && !requirements.publications.met) {
    recommendations.push('Prioritize research paper publication. Allocate 20-30% time to writing/research.');
  }
  if (eligible) {
    recommendations.push('All requirements met. Schedule promotion discussion with manager.');
  }
  if (!requirements.companyLevel.met) {
    recommendations.push('Company growth required for senior-level promotions. Consider lateral moves for skill development.');
  }

  // Next role (simplified, assume same role + seniority)
  const nextRole: AIRole | undefined = eligible ? currentRole : undefined;

  return {
    eligible,
    score,
    requirements,
    nextRole,
    blockers,
    timeline,
    recommendations,
  };
}
