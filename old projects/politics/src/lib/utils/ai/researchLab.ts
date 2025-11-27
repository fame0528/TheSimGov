/**
 * researchLab.ts
 * Created: 2025-11-15
 * 
 * OVERVIEW:
 * Complete Research Lab utilities for AI companies pursuing breakthrough discoveries,
 * patent filing, publication tracking, and research team productivity optimization.
 * Implements logarithmic probability scaling for balanced gameplay and realistic
 * research progression mechanics.
 * 
 * KEY FEATURES:
 * - Breakthrough probability calculation with logarithmic scaling
 * - Patent filing and portfolio management
 * - Publication tracking and citation metrics
 * - Research team composition optimization
 * - Funding efficiency analysis
 * 
 * BUSINESS LOGIC:
 * - Base breakthrough probability: 5-15% depending on research type
 * - Compute investment boosts probability up to +20% (log scaling)
 * - Researcher talent boosts probability up to +25% (avg skill mapping)
 * - Maximum breakthrough chance capped at 60% to maintain challenge
 * - Patent value increases with citations and time since filing
 * 
 * @implementation FID-20251115-AI-PHASES-4-5 Phase 4.1
 */

import type { Types } from 'mongoose';

/**
 * Research focus areas for breakthrough targeting
 */
export type ResearchArea = 
  | 'Performance'      // Model accuracy/capability improvements
  | 'Efficiency'       // Training cost reduction, speed optimization
  | 'Alignment'        // Safety, interpretability, control
  | 'Multimodal'       // Vision, audio, cross-modal capabilities
  | 'Reasoning'        // Logic, math, complex problem solving
  | 'Architecture';    // Novel model architectures (MoE, etc.)

/**
 * Patent status lifecycle
 */
export type PatentStatus = 
  | 'Filed'            // Application submitted
  | 'UnderReview'      // Patent office review
  | 'Approved'         // Patent granted
  | 'Rejected';        // Application denied

/**
 * Publication venue types
 */
export type PublicationVenue = 
  | 'Conference'       // NeurIPS, ICML, ICLR, etc.
  | 'Journal'          // Nature, Science, specialized journals
  | 'Workshop'         // Domain-specific workshops
  | 'Preprint';        // arXiv, bioRxiv

/**
 * Breakthrough discovery interface
 */
export interface Breakthrough {
  name: string;
  area: ResearchArea;
  discoveredAt: Date;
  researchProjectId: Types.ObjectId;
  companyId: Types.ObjectId;
  
  // Impact metrics
  performanceGainPercent: number;    // 0-20% improvement
  efficiencyGainPercent: number;     // 0-50% cost reduction
  noveltyScore: number;              // 1-100 (originality rating)
  
  // Patent potential
  patentable: boolean;
  estimatedPatentValue: number;      // USD estimate
}

/**
 * Patent interface
 */
export interface Patent {
  id: string;
  title: string;
  area: ResearchArea;
  filedAt: Date;
  approvedAt?: Date;
  status: PatentStatus;
  
  // Financial metrics
  filingCost: number;               // USD cost to file
  estimatedValue: number;           // Market value estimate
  licensingRevenue: number;         // Cumulative licensing income
  
  // Impact tracking
  citations: number;                // Times cited by others
  breakthroughId?: Types.ObjectId;  // Associated breakthrough
}

/**
 * Publication interface
 */
export interface Publication {
  id: string;
  title: string;
  authors: string[];
  venue: PublicationVenue;
  venueName: string;               // "NeurIPS 2025", etc.
  publishedAt: Date;
  
  // Impact metrics
  citations: number;
  downloads: number;
  
  // Research tracking
  breakthroughId?: Types.ObjectId;
  patentIds: string[];
}

/**
 * Research team composition
 */
export interface ResearchTeam {
  researchers: Types.ObjectId[];   // Employee IDs
  avgSkillLevel: number;            // 0-100 average
  totalExperience: number;          // Years combined
  specializationMatch: number;      // 0-1 (how well team matches research area)
}

/**
 * Calculate breakthrough probability
 * 
 * @description Determines likelihood of research breakthrough using logarithmic
 * scaling to prevent exponential dominance from high-budget companies. Balances
 * compute investment, researcher talent, and research area difficulty.
 * 
 * Formula Components:
 * - Base Rate: 5-15% depending on research area difficulty
 * - Compute Boost: log10(computeUSD/100k + 1) × 5% (max +20%)
 * - Talent Boost: (avgSkill/100) × 25% (max +25%)
 * - Capped at 60% maximum to maintain strategic challenge
 * 
 * @example
 * // Performance research, $500k compute, team avg skill 85
 * calculateBreakthroughProbability('Performance', 500000, 85)
 * // Returns: { 
 * //   probability: 0.44 (44%), 
 * //   breakdown: { base: 0.10, compute: 0.175, talent: 0.2125 }
 * // }
 * 
 * @param area - Research focus area
 * @param computeBudgetUSD - Compute budget allocated ($)
 * @param avgResearcherSkill - Average skill level of research team (0-100)
 * @returns Breakthrough probability (0-1) with breakdown
 */
export function calculateBreakthroughProbability(
  area: ResearchArea,
  computeBudgetUSD: number,
  avgResearcherSkill: number
): {
  probability: number;
  breakdown: {
    baseRate: number;
    computeBoost: number;
    talentBoost: number;
    cap: number;
  };
  percentChance: number;
} {
  // Input validation
  if (typeof computeBudgetUSD !== 'number' || computeBudgetUSD < 0) {
    throw new Error('computeBudgetUSD must be a non-negative number');
  }
  
  if (typeof avgResearcherSkill !== 'number' || avgResearcherSkill < 0 || avgResearcherSkill > 100) {
    throw new Error('avgResearcherSkill must be between 0 and 100');
  }
  
  // Base breakthrough rates by research area (difficulty-adjusted)
  const BASE_RATES: Record<ResearchArea, number> = {
    Efficiency: 0.15,      // Easiest (15% base)
    Performance: 0.10,     // Moderate (10% base)
    Multimodal: 0.08,      // Challenging (8% base)
    Reasoning: 0.08,       // Challenging (8% base)
    Alignment: 0.05,       // Very difficult (5% base)
    Architecture: 0.05,    // Very difficult (5% base)
  };
  
  const baseRate = BASE_RATES[area];
  
  // Compute boost (logarithmic scaling prevents runaway advantage)
  // log10(compute/100k + 1) × 5% cap at +20%
  const computeFactor = Math.log10(computeBudgetUSD / 100000 + 1);
  const computeBoost = Math.min(0.20, computeFactor * 0.05);
  
  // Talent boost (linear scaling with skill level)
  // avgSkill/100 × 25% max boost
  const talentBoost = (avgResearcherSkill / 100) * 0.25;
  
  // Calculate total probability (cap at 60%)
  const PROBABILITY_CAP = 0.60;
  const rawProbability = baseRate + computeBoost + talentBoost;
  const probability = Math.min(PROBABILITY_CAP, rawProbability);
  
  return {
    probability: Math.round(probability * 10000) / 10000, // 4 decimal places
    breakdown: {
      baseRate: Math.round(baseRate * 10000) / 10000,
      computeBoost: Math.round(computeBoost * 10000) / 10000,
      talentBoost: Math.round(talentBoost * 10000) / 10000,
      cap: PROBABILITY_CAP,
    },
    percentChance: Math.round(probability * 10000) / 100, // Display as XX.XX%
  };
}

/**
 * Determine if breakthrough is patentable
 * 
 * @description Evaluates whether a research breakthrough has sufficient novelty
 * and commercial potential to warrant patent filing. Considers novelty score,
 * performance impact, and practical applicability.
 * 
 * Patentability criteria:
 * - Novelty score >= 70 (must be original)
 * - Performance OR efficiency gain >= 10% (must be significant)
 * - Not purely theoretical (alignment research often not patentable)
 * 
 * @example
 * isPatentable('Performance', 85, 15.5, 8.2)
 * // Returns: { 
 * //   patentable: true,
 * //   reasoning: 'High novelty and significant performance gains',
 * //   estimatedValue: 850000
 * // }
 * 
 * @param area - Research area of breakthrough
 * @param noveltyScore - Originality rating (0-100)
 * @param performanceGain - Performance improvement percentage
 * @param efficiencyGain - Cost reduction percentage
 * @returns Patentability assessment with value estimate
 */
export function isPatentable(
  area: ResearchArea,
  noveltyScore: number,
  performanceGain: number,
  efficiencyGain: number
): {
  patentable: boolean;
  reasoning: string;
  estimatedValue: number; // USD estimate if patentable
  recommendedAction: string;
} {
  // Input validation
  if (typeof noveltyScore !== 'number' || noveltyScore < 0 || noveltyScore > 100) {
    throw new Error('noveltyScore must be between 0 and 100');
  }
  
  if (typeof performanceGain !== 'number' || performanceGain < 0) {
    throw new Error('performanceGain must be non-negative');
  }
  
  if (typeof efficiencyGain !== 'number' || efficiencyGain < 0) {
    throw new Error('efficiencyGain must be non-negative');
  }
  
  // Patentability thresholds
  const NOVELTY_THRESHOLD = 70;
  const MIN_IMPACT_THRESHOLD = 10; // Either performance OR efficiency >= 10%
  
  // Check novelty requirement
  if (noveltyScore < NOVELTY_THRESHOLD) {
    return {
      patentable: false,
      reasoning: `Insufficient novelty (${noveltyScore}/100, need >= ${NOVELTY_THRESHOLD})`,
      estimatedValue: 0,
      recommendedAction: 'Publish findings rather than pursue patent',
    };
  }
  
  // Check impact requirement
  const hasSignificantImpact = performanceGain >= MIN_IMPACT_THRESHOLD || efficiencyGain >= MIN_IMPACT_THRESHOLD;
  
  if (!hasSignificantImpact) {
    return {
      patentable: false,
      reasoning: 'Insufficient performance/efficiency gains (need >= 10% improvement)',
      estimatedValue: 0,
      recommendedAction: 'Continue research to achieve larger gains before filing',
    };
  }
  
  // Alignment research often theoretical (harder to patent)
  if (area === 'Alignment' && performanceGain < 15) {
    return {
      patentable: false,
      reasoning: 'Alignment research primarily theoretical (low commercial applicability)',
      estimatedValue: 0,
      recommendedAction: 'Publish for research community benefit',
    };
  }
  
  // Calculate estimated patent value
  // Base value scales with novelty and impact
  const baseValue = 100000; // $100k baseline
  const noveltyMultiplier = noveltyScore / 50; // 70/50 = 1.4x, 100/50 = 2.0x
  const impactMultiplier = 1 + (performanceGain + efficiencyGain) / 100; // 1.0 to 1.7x range
  
  // Area multiplier (some areas more commercially valuable)
  const AREA_VALUE_MULTIPLIERS: Record<ResearchArea, number> = {
    Efficiency: 2.0,       // High commercial value (cost savings)
    Performance: 1.5,      // Good commercial value (competitive advantage)
    Architecture: 1.8,     // High value (novel architectures = moat)
    Multimodal: 1.6,       // Good value (expanding capabilities)
    Reasoning: 1.4,        // Moderate value (niche applications)
    Alignment: 1.0,        // Lower value (harder to monetize directly)
  };
  
  const areaMultiplier = AREA_VALUE_MULTIPLIERS[area];
  
  const estimatedValue = Math.round(baseValue * noveltyMultiplier * impactMultiplier * areaMultiplier);
  
  return {
    patentable: true,
    reasoning: `High novelty (${noveltyScore}/100) with significant ${performanceGain >= MIN_IMPACT_THRESHOLD ? 'performance' : 'efficiency'} gains`,
    estimatedValue,
    recommendedAction: `File patent immediately - estimated value $${estimatedValue.toLocaleString()}`,
  };
}

/**
 * Calculate patent filing cost
 * 
 * @description Estimates total cost to file patent including attorney fees,
 * patent office fees, and international filing costs if applicable.
 * 
 * Cost breakdown:
 * - Attorney fees: $8k-$15k (complexity-based)
 * - USPTO filing fees: $1.5k-$3k
 * - International filing: +$15k per jurisdiction (PCT route)
 * 
 * @example
 * calculatePatentFilingCost('Architecture', true, ['Europe', 'China'])
 * // Returns: { 
 * //   total: 48000,
 * //   breakdown: { attorney: 15000, uspto: 3000, international: 30000 }
 * // }
 * 
 * @param area - Research area (affects complexity)
 * @param international - Whether to file internationally
 * @param jurisdictions - List of international jurisdictions (if applicable)
 * @returns Total filing cost breakdown
 */
export function calculatePatentFilingCost(
  area: ResearchArea,
  international: boolean = false,
  jurisdictions: string[] = []
): {
  totalCost: number;
  breakdown: {
    attorneyFees: number;
    usptoFees: number;
    internationalFees: number;
  };
  timeline: {
    domesticMonths: number;
    internationalMonths: number;
  };
} {
  // Attorney fees vary by complexity
  const ATTORNEY_FEES: Record<ResearchArea, number> = {
    Efficiency: 8000,      // Simpler claims
    Performance: 10000,    // Moderate complexity
    Multimodal: 12000,     // Complex integration
    Reasoning: 12000,      // Complex logic claims
    Alignment: 15000,      // Most complex (theoretical + practical)
    Architecture: 15000,   // Complex structural claims
  };
  
  const attorneyFees = ATTORNEY_FEES[area];
  
  // USPTO fees (utility patent)
  const usptoFees = international ? 3000 : 1500; // Higher fees for international intent
  
  // International filing costs (per jurisdiction)
  const COST_PER_JURISDICTION = 15000; // PCT + translation + local counsel
  const internationalFees = international ? jurisdictions.length * COST_PER_JURISDICTION : 0;
  
  const totalCost = attorneyFees + usptoFees + internationalFees;
  
  // Timelines
  const domesticMonths = 18; // Typical USPTO examination time
  const internationalMonths = international ? 36 : 0; // PCT + national phase
  
  return {
    totalCost,
    breakdown: {
      attorneyFees,
      usptoFees,
      internationalFees,
    },
    timeline: {
      domesticMonths,
      internationalMonths,
    },
  };
}

/**
 * Estimate publication impact
 * 
 * @description Predicts citation count and community impact based on venue
 * prestige, novelty score, and research area popularity.
 * 
 * Venue impact factors:
 * - Top Conference (NeurIPS, ICML): 10-50 citations expected
 * - Journal (Nature, Science): 20-100 citations expected
 * - Workshop: 1-10 citations expected
 * - Preprint: 0-5 citations expected
 * 
 * @example
 * estimatePublicationImpact('Conference', 'NeurIPS', 'Performance', 88)
 * // Returns: { 
 * //   expectedCitations: 42,
 * //   impactScore: 85,
 * //   communityBenefit: 'High'
 * // }
 * 
 * @param venue - Publication venue type
 * @param venueName - Specific venue name
 * @param area - Research area
 * @param noveltyScore - Breakthrough novelty (0-100)
 * @returns Expected impact metrics
 */
export function estimatePublicationImpact(
  venue: PublicationVenue,
  venueName: string,
  area: ResearchArea,
  noveltyScore: number
): {
  expectedCitations: number;
  impactScore: number;          // 0-100 overall impact
  communityBenefit: 'Low' | 'Medium' | 'High' | 'Very High';
  recommendedVenue: boolean;    // True if good venue choice
} {
  // Input validation
  if (typeof noveltyScore !== 'number' || noveltyScore < 0 || noveltyScore > 100) {
    throw new Error('noveltyScore must be between 0 and 100');
  }
  
  // Base citation expectations by venue type
  const BASE_CITATIONS: Record<PublicationVenue, number> = {
    Conference: 30,
    Journal: 60,
    Workshop: 5,
    Preprint: 2,
  };
  
  // Prestige multiplier for top venues
  const TOP_VENUES = [
    'NeurIPS', 'ICML', 'ICLR', 'CVPR', 'AAAI',
    'Nature', 'Science', 'Nature Machine Intelligence'
  ];
  const prestigeMultiplier = TOP_VENUES.some(v => venueName.includes(v)) ? 1.5 : 1.0;
  
  // Research area popularity (affects citation likelihood)
  const AREA_POPULARITY: Record<ResearchArea, number> = {
    Performance: 1.3,      // Hot topic
    Multimodal: 1.4,       // Very hot topic
    Reasoning: 1.2,        // Growing interest
    Architecture: 1.1,     // Moderate interest
    Efficiency: 1.0,       // Standard interest
    Alignment: 0.9,        // Niche but important
  };
  
  const popularityMultiplier = AREA_POPULARITY[area];
  
  // Novelty factor (high novelty = more citations)
  const noveltyFactor = 0.5 + (noveltyScore / 100); // 0.5 to 1.5 range
  
  // Calculate expected citations
  const baseCitations = BASE_CITATIONS[venue];
  const expectedCitations = Math.round(
    baseCitations * prestigeMultiplier * popularityMultiplier * noveltyFactor
  );
  
  // Impact score (0-100)
  const venueScore = venue === 'Journal' ? 40 : venue === 'Conference' ? 35 : venue === 'Workshop' ? 20 : 10;
  const prestigeScore = prestigeMultiplier === 1.5 ? 30 : 20;
  const impactScore = Math.min(100, venueScore + prestigeScore + (noveltyScore * 0.3));
  
  // Community benefit assessment
  let communityBenefit: 'Low' | 'Medium' | 'High' | 'Very High';
  if (impactScore >= 80) {
    communityBenefit = 'Very High';
  } else if (impactScore >= 60) {
    communityBenefit = 'High';
  } else if (impactScore >= 40) {
    communityBenefit = 'Medium';
  } else {
    communityBenefit = 'Low';
  }
  
  // Recommended venue check (high novelty should target top venues)
  const recommendedVenue = noveltyScore >= 75 
    ? (venue === 'Conference' || venue === 'Journal') && prestigeMultiplier === 1.5
    : true; // Lower novelty = any venue acceptable
  
  return {
    expectedCitations,
    impactScore: Math.round(impactScore),
    communityBenefit,
    recommendedVenue,
  };
}

/**
 * Optimize research team composition
 * 
 * @description Analyzes research team and provides recommendations for optimal
 * composition based on research area, skill distribution, and specialization.
 * 
 * Optimal team characteristics:
 * - 3-7 researchers (sweet spot for collaboration)
 * - Avg skill >= 75 for breakthrough research
 * - Specialization match >= 0.7 (70% of team skilled in area)
 * - Mix of senior and junior researchers
 * 
 * @example
 * optimizeResearchTeam([85, 78, 92, 65], 'Performance', 0.75)
 * // Returns: {
 * //   optimal: true,
 * //   avgSkill: 80,
 * //   recommendations: ['Team composition excellent...'],
 * //   estimatedProductivity: 0.88
 * // }
 * 
 * @param researcherSkills - Array of researcher skill levels (0-100)
 * @param targetArea - Research area for specialization matching
 * @param specializationMatch - % of team specialized in area (0-1)
 * @returns Team analysis with optimization recommendations
 */
export function optimizeResearchTeam(
  researcherSkills: number[],
  targetArea: ResearchArea,
  specializationMatch: number
): {
  optimal: boolean;
  teamSize: number;
  avgSkill: number;
  specializationMatch: number;
  estimatedProductivity: number; // 0-1 (higher = better)
  recommendations: string[];
  optimalSize: number; // Recommended team size
} {
  // Input validation
  if (!Array.isArray(researcherSkills) || researcherSkills.length === 0) {
    throw new Error('researcherSkills must be a non-empty array');
  }
  
  if (researcherSkills.some(skill => typeof skill !== 'number' || skill < 0 || skill > 100)) {
    throw new Error('All researcher skills must be between 0 and 100');
  }
  
  if (typeof specializationMatch !== 'number' || specializationMatch < 0 || specializationMatch > 1) {
    throw new Error('specializationMatch must be between 0 and 1');
  }
  
  const teamSize = researcherSkills.length;
  const avgSkill = researcherSkills.reduce((sum, skill) => sum + skill, 0) / teamSize;
  
  // Calculate productivity estimate (0-1)
  const OPTIMAL_TEAM_SIZE = 5; // Sweet spot for collaboration
  const sizeFactor = 1 - Math.abs(teamSize - OPTIMAL_TEAM_SIZE) / 10; // Penalty for deviation
  const skillFactor = avgSkill / 100; // 0-1 based on avg skill
  const specializationFactor = specializationMatch; // Already 0-1
  
  const estimatedProductivity = (sizeFactor + skillFactor + specializationFactor) / 3;
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  // Team size checks
  if (teamSize < 3) {
    recommendations.push('Team too small - add 1-2 researchers for better collaboration and knowledge sharing');
  } else if (teamSize > 7) {
    recommendations.push('Team too large - consider splitting into 2 focused teams to reduce coordination overhead');
  }
  
  // Skill level checks
  if (avgSkill < 60) {
    recommendations.push('CRITICAL: Team skill level too low for breakthrough research - hire senior researchers or provide training');
  } else if (avgSkill < 75) {
    recommendations.push('Team skill below target - consider adding 1-2 senior researchers (skill >= 85)');
  }
  
  // Specialization checks
  if (specializationMatch < 0.5) {
    recommendations.push(`Low specialization match for ${targetArea} research - retrain team or hire domain specialists`);
  } else if (specializationMatch < 0.7) {
    recommendations.push('Moderate specialization - add 1-2 researchers with strong domain expertise');
  }
  
  // Skill distribution (check for all senior or all junior)
  const seniorCount = researcherSkills.filter(s => s >= 85).length;
  const juniorCount = researcherSkills.filter(s => s < 65).length;
  
  if (seniorCount === teamSize && teamSize > 3) {
    recommendations.push('All senior team - consider adding junior researchers for cost efficiency');
  } else if (juniorCount === teamSize) {
    recommendations.push('All junior team - add at least 1 senior researcher for mentorship and direction');
  }
  
  // Success message if optimal
  if (recommendations.length === 0) {
    recommendations.push('Team composition optimal - excellent balance of size, skill, and specialization');
  }
  
  const optimal = teamSize >= 3 && teamSize <= 7 && avgSkill >= 75 && specializationMatch >= 0.7;
  
  return {
    optimal,
    teamSize,
    avgSkill: Math.round(avgSkill * 100) / 100,
    specializationMatch: Math.round(specializationMatch * 100) / 100,
    estimatedProductivity: Math.round(estimatedProductivity * 10000) / 10000,
    recommendations,
    optimalSize: OPTIMAL_TEAM_SIZE,
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. BREAKTHROUGH PROBABILITY FORMULA:
 *    - Logarithmic scaling prevents exponential advantage from high budgets
 *    - Base rates vary by difficulty (Alignment hardest at 5%, Efficiency easiest at 15%)
 *    - Compute boost caps at +20% to maintain balance
 *    - Talent boost caps at +25% based on team skill
 *    - Overall probability capped at 60% to keep strategic challenge
 * 
 * 2. PATENT VALUATION:
 *    - Novelty multiplier: 70/50 = 1.4x, 100/50 = 2.0x
 *    - Impact multiplier: Performance + efficiency gains scaled
 *    - Area multiplier: Efficiency (2.0x) most valuable, Alignment (1.0x) least
 *    - Realistic estimates: $140k-$3M range for valuable patents
 * 
 * 3. PUBLICATION IMPACT:
 *    - Top venues (NeurIPS, Nature) boost citations by 1.5x
 *    - Research area popularity affects attention (Multimodal hottest at 1.4x)
 *    - Novelty factor: High novelty (90+) can double citation expectations
 *    - Community benefit: Very High (80+) for transformative work
 * 
 * 4. TEAM OPTIMIZATION:
 *    - Optimal size: 5 researchers (collaboration sweet spot)
 *    - Skill target: Avg >= 75 for breakthrough potential
 *    - Specialization: >= 70% of team should match research area
 *    - Mix: Balance senior (85+) and junior (<65) for cost/mentorship
 * 
 * 5. USAGE PATTERNS:
 *    - API routes: Use calculateBreakthroughProbability() for probability checks
 *    - Patent filing: isPatentable() + calculatePatentFilingCost() workflow
 *    - Publication: estimatePublicationImpact() for venue selection
 *    - Team management: optimizeResearchTeam() for hiring recommendations
 * 
 * 6. PERFORMANCE:
 *    - All calculations O(1) time complexity (except team optimization O(n))
 *    - No database queries required
 *    - Pure functions (no side effects)
 *    - Suitable for real-time UI updates
 */
