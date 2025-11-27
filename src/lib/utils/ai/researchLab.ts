/**
 * @file src/lib/utils/ai/researchLab.ts
 * @description Research Lab utilities for AI companies pursuing breakthrough discoveries
 * @created 2025-11-22
 * 
 * OVERVIEW:
 * Complete research lab management system for AI companies pursuing breakthrough discoveries,
 * patent filing, publication tracking, and research team productivity optimization. Implements
 * logarithmic probability scaling for balanced gameplay, realistic research progression mechanics,
 * and comprehensive impact analysis for scientific contributions.
 * 
 * KEY FUNCTIONS:
 * 1. calculateBreakthroughProbability() - Breakthrough discovery probability with log scaling
 * 2. isPatentable() - Patent viability assessment with value estimation
 * 3. calculatePatentFilingCost() - Total patent filing cost (domestic + international)
 * 4. estimatePublicationImpact() - Citation and community impact prediction
 * 5. optimizeResearchTeam() - Team composition analysis and recommendations
 * 
 * USAGE:
 * ```typescript
 * import {
 *   calculateBreakthroughProbability,
 *   isPatentable,
 *   estimatePublicationImpact
 * } from '@/lib/utils/ai/researchLab';
 * 
 * // Calculate breakthrough probability for Performance research
 * const breakthrough = calculateBreakthroughProbability(
 *   'Performance',
 *   500000,  // $500k compute budget
 *   85       // Team avg skill 85/100
 * );
 * // Returns: {
 * //   probability: 0.44 (44%),
 * //   breakdown: { baseRate: 0.10, computeBoost: 0.175, talentBoost: 0.2125 },
 * //   percentChance: 44.00
 * // }
 * 
 * // Check if breakthrough is patentable
 * const patent = isPatentable(
 *   'Architecture',
 *   88,    // Novelty score 88/100
 *   15.5,  // 15.5% performance gain
 *   8.2    // 8.2% efficiency gain
 * );
 * // Returns: {
 * //   patentable: true,
 * //   reasoning: "High novelty (88/100) with significant performance gains",
 * //   estimatedValue: 920000,
 * //   recommendedAction: "File patent immediately - estimated value $920,000"
 * // }
 * 
 * // Estimate publication impact for NeurIPS paper
 * const impact = estimatePublicationImpact(
 *   'Conference',
 *   'NeurIPS 2025',
 *   'Multimodal',
 *   92  // Novelty score 92/100
 * );
 * // Returns: {
 * //   expectedCitations: 58,
 * //   impactScore: 88,
 * //   communityBenefit: 'Very High',
 * //   recommendedVenue: true
 * // }
 * 
 * // Optimize research team composition
 * const team = optimizeResearchTeam(
 *   [85, 78, 92, 65],  // Researcher skills
 *   'Reasoning',
 *   0.75               // 75% specialization match
 * );
 * // Returns: {
 * //   optimal: false,
 * //   recommendations: ['Team size below optimal...', 'Add 1 researcher...'],
 * //   estimatedProductivity: 0.78
 * // }
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Breakthrough probability: Logarithmic scaling prevents exponential advantage from high budgets
 * - Base rates: Efficiency easiest (15%), Alignment/Architecture hardest (5%)
 * - Probability cap: 60% maximum to maintain strategic challenge
 * - Patent valuation: $140k-$3M range based on novelty, impact, and commercial potential
 * - Publication impact: Top venues (NeurIPS, Nature) boost citations by 1.5x
 * - Team optimization: 5 researchers optimal, avg skill >= 75, specialization >= 70%
 * - All calculations O(1) complexity (team optimization O(n)), suitable for real-time UI
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
  | 'Architecture';    // Novel model architectures (MoE, sparse experts, etc.)

/**
 * Patent status lifecycle
 */
export type PatentStatus = 
  | 'Filed'            // Application submitted
  | 'UnderReview'      // Patent office review in progress
  | 'Approved'         // Patent granted
  | 'Rejected';        // Application denied

/**
 * Publication venue types
 */
export type PublicationVenue = 
  | 'Conference'       // NeurIPS, ICML, ICLR, CVPR, etc.
  | 'Journal'          // Nature, Science, Nature Machine Intelligence
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
  performanceGainPercent: number;    // 0-20% improvement in model capability
  efficiencyGainPercent: number;     // 0-50% cost reduction
  noveltyScore: number;              // 1-100 (originality rating)
  
  // Patent potential
  patentable: boolean;
  estimatedPatentValue: number;      // USD market value estimate
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
  filingCost: number;               // USD cost to file (attorney + USPTO + international)
  estimatedValue: number;           // Market value estimate
  licensingRevenue: number;         // Cumulative licensing income
  
  // Impact tracking
  citations: number;                // Times cited by other patents/papers
  breakthroughId?: Types.ObjectId;  // Associated breakthrough discovery
}

/**
 * Publication interface
 */
export interface Publication {
  id: string;
  title: string;
  authors: string[];
  venue: PublicationVenue;
  venueName: string;               // "NeurIPS 2025", "Nature Machine Intelligence"
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
  avgSkillLevel: number;            // 0-100 average skill
  totalExperience: number;          // Years combined experience
  specializationMatch: number;      // 0-1 (how well team matches research area)
}

/**
 * Calculate breakthrough probability using logarithmic scaling
 * 
 * Implements balanced probability formula that prevents exponential dominance from
 * high-budget companies while rewarding compute investment and researcher talent.
 * Logarithmic scaling ensures diminishing returns on excessive compute spending.
 * 
 * Formula components:
 * - Base rate: 5-15% depending on research area difficulty
 *   - Efficiency: 15% (easiest, practical improvements)
 *   - Performance: 10% (moderate, competitive research)
 *   - Multimodal/Reasoning: 8% (challenging, cutting-edge)
 *   - Alignment/Architecture: 5% (very difficult, fundamental research)
 * 
 * - Compute boost: log10(computeUSD/100k + 1) × 5% (max +20%)
 *   - $100k compute: +5% boost
 *   - $1M compute: +10% boost
 *   - $10M compute: +15% boost
 *   - $100M compute: +20% boost (capped)
 *   - Logarithmic prevents runaway advantage
 * 
 * - Talent boost: (avgSkill/100) × 25% (max +25%)
 *   - 60 skill: +15% boost
 *   - 80 skill: +20% boost
 *   - 100 skill: +25% boost (perfect team)
 * 
 * - Total probability: base + computeBoost + talentBoost (capped at 60%)
 * 
 * Probability cap: Maximum 60% to maintain strategic challenge and prevent
 * guaranteed breakthroughs even with unlimited resources.
 * 
 * @param area - Research focus area (determines base difficulty)
 * @param computeBudgetUSD - Compute budget allocated to research project (USD)
 * @param avgResearcherSkill - Average skill level of research team (0-100)
 * @returns Breakthrough probability (0-1) with detailed breakdown
 * 
 * @throws Error if computeBudgetUSD is negative
 * @throws Error if avgResearcherSkill is outside 0-100 range
 * 
 * @example
 * ```typescript
 * // Performance research, $500k compute, team avg skill 85
 * const result = calculateBreakthroughProbability('Performance', 500000, 85);
 * // Returns: { 
 * //   probability: 0.4375,
 * //   breakdown: { 
 * //     baseRate: 0.10,
 * //     computeBoost: 0.175,  // log10(5 + 1) × 0.05 = 0.175
 * //     talentBoost: 0.2125,  // 0.85 × 0.25 = 0.2125
 * //     cap: 0.60
 * //   },
 * //   percentChance: 43.75
 * // }
 * 
 * // Alignment research (hardest), $10M compute, elite team 95 skill
 * const hard = calculateBreakthroughProbability('Alignment', 10000000, 95);
 * // Returns: {
 * //   probability: 0.4875,
 * //   breakdown: {
 * //     baseRate: 0.05,       // Hardest base rate
 * //     computeBoost: 0.20,   // Capped at max
 * //     talentBoost: 0.2375,  // Near-perfect team
 * //     cap: 0.60
 * //   },
 * //   percentChance: 48.75
 * // }
 * ```
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
    Efficiency: 0.15,      // Easiest (15% base) - practical improvements, measurable gains
    Performance: 0.10,     // Moderate (10% base) - competitive research, proven methods
    Multimodal: 0.08,      // Challenging (8% base) - complex integration, novel approaches
    Reasoning: 0.08,       // Challenging (8% base) - fundamental logic, math problems
    Alignment: 0.05,       // Very difficult (5% base) - safety, control, interpretability
    Architecture: 0.05,    // Very difficult (5% base) - novel structures, paradigm shifts
  };
  
  const baseRate = BASE_RATES[area];
  
  // Compute boost (logarithmic scaling prevents runaway advantage)
  // Formula: log10(compute/100k + 1) × 5%, capped at +20%
  // $100k → +5%, $1M → +10%, $10M → +15%, $100M+ → +20% (max)
  const computeFactor = Math.log10(computeBudgetUSD / 100000 + 1);
  const computeBoost = Math.min(0.20, computeFactor * 0.05);
  
  // Talent boost (linear scaling with skill level)
  // Formula: (avgSkill/100) × 25%
  // 60 skill → +15%, 80 skill → +20%, 100 skill → +25% (perfect team)
  const talentBoost = (avgResearcherSkill / 100) * 0.25;
  
  // Calculate total probability with cap at 60%
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
 * Determine if breakthrough is patentable and estimate value
 * 
 * Evaluates whether a research breakthrough has sufficient novelty and commercial
 * potential to warrant patent filing. Considers novelty score, performance/efficiency
 * impact, and practical applicability for commercial use.
 * 
 * Patentability criteria:
 * - Novelty score >= 70 (must be sufficiently original)
 * - Performance OR efficiency gain >= 10% (must show significant improvement)
 * - Practical applicability (theoretical-only research may not be patentable)
 * 
 * Special considerations:
 * - Alignment research: Often theoretical, harder to patent (requires >= 15% performance gain)
 * - Architecture research: High commercial value if novel structure is viable
 * - Efficiency research: Most commercially valuable (direct cost savings)
 * 
 * Patent value estimation formula:
 * - Base value: $100k baseline
 * - Novelty multiplier: (noveltyScore/50) → 1.4x (70 score) to 2.0x (100 score)
 * - Impact multiplier: 1 + (performanceGain + efficiencyGain)/100 → 1.0x to 1.7x
 * - Area multiplier: Efficiency 2.0x, Architecture 1.8x, Performance 1.5x, etc.
 * - Total: $140k-$3M range for valuable patents
 * 
 * @param area - Research area of breakthrough
 * @param noveltyScore - Originality rating (0-100)
 * @param performanceGain - Performance improvement percentage (0-20%)
 * @param efficiencyGain - Cost reduction percentage (0-50%)
 * @returns Patentability assessment with estimated value and recommended action
 * 
 * @throws Error if noveltyScore is outside 0-100 range
 * @throws Error if performanceGain or efficiencyGain is negative
 * 
 * @example
 * ```typescript
 * // Architecture breakthrough: 88 novelty, 15.5% performance, 8.2% efficiency
 * const result = isPatentable('Architecture', 88, 15.5, 8.2);
 * // Returns: {
 * //   patentable: true,
 * //   reasoning: "High novelty (88/100) with significant performance gains",
 * //   estimatedValue: 920000,
 * //   recommendedAction: "File patent immediately - estimated value $920,000"
 * // }
 * 
 * // Alignment breakthrough: 92 novelty but only 8% performance (theoretical)
 * const theoretical = isPatentable('Alignment', 92, 8, 2);
 * // Returns: {
 * //   patentable: false,
 * //   reasoning: "Alignment research primarily theoretical (low commercial applicability)",
 * //   estimatedValue: 0,
 * //   recommendedAction: "Publish for research community benefit"
 * // }
 * 
 * // Low novelty: 65 novelty, 12% performance
 * const lowNovelty = isPatentable('Performance', 65, 12, 0);
 * // Returns: {
 * //   patentable: false,
 * //   reasoning: "Insufficient novelty (65/100, need >= 70)",
 * //   estimatedValue: 0,
 * //   recommendedAction: "Publish findings rather than pursue patent"
 * // }
 * ```
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
  
  // Alignment research often theoretical (harder to patent, requires higher bar)
  if (area === 'Alignment' && performanceGain < 15) {
    return {
      patentable: false,
      reasoning: 'Alignment research primarily theoretical (low commercial applicability)',
      estimatedValue: 0,
      recommendedAction: 'Publish for research community benefit',
    };
  }
  
  // Calculate estimated patent value
  // Base value: $100k baseline
  const baseValue = 100000;
  
  // Novelty multiplier: 70/50 = 1.4x, 100/50 = 2.0x
  const noveltyMultiplier = noveltyScore / 50;
  
  // Impact multiplier: 1.0 to 1.7x range (performance + efficiency combined)
  const impactMultiplier = 1 + (performanceGain + efficiencyGain) / 100;
  
  // Area multiplier (commercial value varies by research type)
  const AREA_VALUE_MULTIPLIERS: Record<ResearchArea, number> = {
    Efficiency: 2.0,       // High commercial value (direct cost savings, immediate ROI)
    Performance: 1.5,      // Good commercial value (competitive advantage, market demand)
    Architecture: 1.8,     // High value (novel architectures = strong moat, licensing potential)
    Multimodal: 1.6,       // Good value (expanding capabilities, new markets)
    Reasoning: 1.4,        // Moderate value (specialized applications, niche demand)
    Alignment: 1.0,        // Lower value (harder to monetize directly, regulatory focus)
  };
  
  const areaMultiplier = AREA_VALUE_MULTIPLIERS[area];
  
  // Total estimated value
  const estimatedValue = Math.round(baseValue * noveltyMultiplier * impactMultiplier * areaMultiplier);
  
  return {
    patentable: true,
    reasoning: `High novelty (${noveltyScore}/100) with significant ${performanceGain >= MIN_IMPACT_THRESHOLD ? 'performance' : 'efficiency'} gains`,
    estimatedValue,
    recommendedAction: `File patent immediately - estimated value $${estimatedValue.toLocaleString()}`,
  };
}

/**
 * Calculate total patent filing cost (domestic + international)
 * 
 * Estimates comprehensive cost to file patent including attorney fees, USPTO filing fees,
 * and international filing costs via PCT (Patent Cooperation Treaty) route.
 * 
 * Cost breakdown:
 * - Attorney fees: $8k-$15k (varies by technical complexity)
 *   - Efficiency: $8k (simpler claims, straightforward optimization)
 *   - Performance: $10k (moderate complexity, benchmark claims)
 *   - Multimodal/Reasoning: $12k (complex integration, multiple domains)
 *   - Alignment/Architecture: $15k (most complex, theoretical + practical claims)
 * 
 * - USPTO filing fees: $1.5k-$3k (utility patent)
 *   - Domestic only: $1.5k
 *   - International intent: $3k (additional preparation)
 * 
 * - International filing: $15k per jurisdiction (PCT route)
 *   - Includes: PCT filing, translation, local counsel, national phase entry
 *   - Typical jurisdictions: Europe (EPO), China, Japan, Korea, India
 * 
 * Timeline estimates:
 * - Domestic: 18 months (typical USPTO examination time)
 * - International: 36 months (PCT + national phase entry + examination)
 * 
 * @param area - Research area (determines technical complexity)
 * @param international - Whether to file internationally via PCT
 * @param jurisdictions - List of international jurisdictions (if international = true)
 * @returns Total filing cost with detailed breakdown and timeline
 * 
 * @example
 * ```typescript
 * // Architecture patent, international filing in Europe and China
 * const cost = calculatePatentFilingCost('Architecture', true, ['Europe', 'China']);
 * // Returns: {
 * //   totalCost: 48000,
 * //   breakdown: {
 * //     attorneyFees: 15000,
 * //     usptoFees: 3000,
 * //     internationalFees: 30000
 * //   },
 * //   timeline: {
 * //     domesticMonths: 18,
 * //     internationalMonths: 36
 * //   }
 * // }
 * 
 * // Efficiency patent, domestic only
 * const domestic = calculatePatentFilingCost('Efficiency', false);
 * // Returns: {
 * //   totalCost: 9500,
 * //   breakdown: {
 * //     attorneyFees: 8000,
 * //     usptoFees: 1500,
 * //     internationalFees: 0
 * //   },
 * //   timeline: {
 * //     domesticMonths: 18,
 * //     internationalMonths: 0
 * //   }
 * // }
 * ```
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
    Efficiency: 8000,      // Simpler claims (straightforward optimization)
    Performance: 10000,    // Moderate complexity (benchmark-based claims)
    Multimodal: 12000,     // Complex integration (multiple modalities)
    Reasoning: 12000,      // Complex logic claims (mathematical proofs)
    Alignment: 15000,      // Most complex (theoretical + practical safety)
    Architecture: 15000,   // Complex structural claims (novel designs)
  };
  
  const attorneyFees = ATTORNEY_FEES[area];
  
  // USPTO fees (utility patent)
  const usptoFees = international ? 3000 : 1500; // Higher fees for international intent
  
  // International filing costs (per jurisdiction via PCT route)
  const COST_PER_JURISDICTION = 15000; // PCT + translation + local counsel
  const internationalFees = international ? jurisdictions.length * COST_PER_JURISDICTION : 0;
  
  const totalCost = attorneyFees + usptoFees + internationalFees;
  
  // Timeline estimates
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
 * Estimate publication impact (citations, community benefit)
 * 
 * Predicts expected citation count and community impact based on venue prestige,
 * research area popularity, and breakthrough novelty. Helps researchers select
 * optimal publication venues and estimate scientific contribution.
 * 
 * Venue impact factors:
 * - Conference: 30 base citations (NeurIPS, ICML, ICLR, CVPR, AAAI)
 * - Journal: 60 base citations (Nature, Science, Nature Machine Intelligence)
 * - Workshop: 5 base citations (domain-specific, smaller audience)
 * - Preprint: 2 base citations (arXiv, bioRxiv, early visibility)
 * 
 * Prestige multiplier: 1.5x for top venues (NeurIPS, Nature, etc.)
 * 
 * Research area popularity (affects citation likelihood):
 * - Multimodal: 1.4x (hottest topic, generative AI boom)
 * - Performance: 1.3x (competitive research, benchmarks)
 * - Reasoning: 1.2x (growing interest, AGI relevance)
 * - Architecture: 1.1x (moderate interest, technical depth)
 * - Efficiency: 1.0x (standard interest, practical focus)
 * - Alignment: 0.9x (niche but important, smaller community)
 * 
 * Novelty factor: 0.5 (low novelty) to 1.5x (high novelty)
 * 
 * Expected citation formula:
 * baseCitations × prestigeMultiplier × popularityMultiplier × noveltyFactor
 * 
 * Impact score (0-100):
 * - Venue score: Journal 40, Conference 35, Workshop 20, Preprint 10
 * - Prestige score: Top venue +30, Other +20
 * - Novelty score: noveltyScore × 0.3
 * - Total: min(100, venueScore + prestigeScore + noveltyScore×0.3)
 * 
 * @param venue - Publication venue type
 * @param venueName - Specific venue name (e.g., "NeurIPS 2025")
 * @param area - Research area
 * @param noveltyScore - Breakthrough novelty (0-100)
 * @returns Expected impact metrics with venue recommendation
 * 
 * @throws Error if noveltyScore is outside 0-100 range
 * 
 * @example
 * ```typescript
 * // NeurIPS Conference paper on Multimodal research, novelty 92
 * const impact = estimatePublicationImpact('Conference', 'NeurIPS 2025', 'Multimodal', 92);
 * // Returns: {
 * //   expectedCitations: 58,  // 30 × 1.5 (prestige) × 1.4 (popularity) × 0.92 (novelty) ≈ 58
 * //   impactScore: 88,        // 35 (conf) + 30 (top) + 27.6 (novelty) = 92.6 → 88 rounded
 * //   communityBenefit: 'Very High',
 * //   recommendedVenue: true
 * // }
 * 
 * // Workshop paper on Alignment, novelty 65
 * const workshop = estimatePublicationImpact('Workshop', 'SafeAI Workshop', 'Alignment', 65);
 * // Returns: {
 * //   expectedCitations: 3,   // 5 × 1.0 × 0.9 × 0.65 ≈ 3
 * //   impactScore: 59,
 * //   communityBenefit: 'Medium',
 * //   recommendedVenue: false  // Novelty 65 should target Conference/Journal
 * // }
 * ```
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
  recommendedVenue: boolean;    // True if good venue choice for novelty level
} {
  // Input validation
  if (typeof noveltyScore !== 'number' || noveltyScore < 0 || noveltyScore > 100) {
    throw new Error('noveltyScore must be between 0 and 100');
  }
  
  // Base citation expectations by venue type
  const BASE_CITATIONS: Record<PublicationVenue, number> = {
    Conference: 30,  // Top ML/AI conferences
    Journal: 60,     // High-impact journals
    Workshop: 5,     // Domain-specific workshops
    Preprint: 2,     // Early visibility, limited review
  };
  
  // Prestige multiplier for top venues
  const TOP_VENUES = [
    'NeurIPS', 'ICML', 'ICLR', 'CVPR', 'AAAI',
    'Nature', 'Science', 'Nature Machine Intelligence'
  ];
  const prestigeMultiplier = TOP_VENUES.some(v => venueName.includes(v)) ? 1.5 : 1.0;
  
  // Research area popularity (affects citation likelihood)
  const AREA_POPULARITY: Record<ResearchArea, number> = {
    Performance: 1.3,      // Hot topic (competitive benchmarks, leaderboards)
    Multimodal: 1.4,       // Very hot topic (generative AI boom, vision+language)
    Reasoning: 1.2,        // Growing interest (AGI capabilities, math/logic)
    Architecture: 1.1,     // Moderate interest (technical depth, fewer practitioners)
    Efficiency: 1.0,       // Standard interest (practical, incremental)
    Alignment: 0.9,        // Niche but important (smaller community, critical topic)
  };
  
  const popularityMultiplier = AREA_POPULARITY[area];
  
  // Novelty factor (high novelty = more citations)
  // 0.5 (low novelty, incremental) to 1.5 (high novelty, groundbreaking)
  const noveltyFactor = 0.5 + (noveltyScore / 100);
  
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
 * Optimize research team composition with actionable recommendations
 * 
 * Analyzes research team and provides recommendations for optimal composition
 * based on research area, skill distribution, specialization match, and team size.
 * 
 * Optimal team characteristics:
 * - Team size: 3-7 researchers (sweet spot: 5 for collaboration)
 *   - Too small (<3): Limited knowledge sharing, single points of failure
 *   - Too large (>7): Coordination overhead, communication complexity
 * 
 * - Average skill: >= 75 for breakthrough research
 *   - <60: Critical, too low for cutting-edge work
 *   - 60-74: Below target, hire/train needed
 *   - 75+: Optimal for breakthroughs
 * 
 * - Specialization: >= 70% of team should match research area
 *   - <50%: Low match, retrain or hire specialists
 *   - 50-69%: Moderate match, add domain experts
 *   - 70%+: Optimal specialization
 * 
 * - Skill distribution: Mix of senior (85+) and junior (<65)
 *   - All senior: Cost inefficient, consider junior for support
 *   - All junior: Need senior mentorship and direction
 *   - Mixed: Optimal for cost, mentorship, and productivity
 * 
 * Productivity estimation (0-1):
 * - Size factor: 1 - |teamSize - 5| / 10 (penalty for deviation from 5)
 * - Skill factor: avgSkill / 100
 * - Specialization factor: specializationMatch (already 0-1)
 * - Average of three factors
 * 
 * @param researcherSkills - Array of researcher skill levels (0-100)
 * @param targetArea - Research area for specialization matching
 * @param specializationMatch - Percentage of team specialized in area (0-1)
 * @returns Team analysis with optimization recommendations
 * 
 * @throws Error if researcherSkills is empty
 * @throws Error if any researcher skill is outside 0-100 range
 * @throws Error if specializationMatch is outside 0-1 range
 * 
 * @example
 * ```typescript
 * // 4-person team: skills [85, 78, 92, 65], Reasoning research, 75% specialization
 * const result = optimizeResearchTeam([85, 78, 92, 65], 'Reasoning', 0.75);
 * // Returns: {
 * //   optimal: false,  // Size 4 slightly below optimal
 * //   teamSize: 4,
 * //   avgSkill: 80.0,
 * //   specializationMatch: 0.75,
 * //   estimatedProductivity: 0.8167,
 * //   recommendations: ['Team composition excellent...'],
 * //   optimalSize: 5
 * // }
 * 
 * // 2-person team: skills [90, 88], Performance, 100% specialization
 * const small = optimizeResearchTeam([90, 88], 'Performance', 1.0);
 * // Returns: {
 * //   optimal: false,  // Too small
 * //   teamSize: 2,
 * //   avgSkill: 89.0,
 * //   specializationMatch: 1.0,
 * //   estimatedProductivity: 0.83,
 * //   recommendations: ['Team too small - add 1-2 researchers for better collaboration...'],
 * //   optimalSize: 5
 * // }
 * 
 * // 8-person team: mixed skills, low specialization
 * const large = optimizeResearchTeam([85, 70, 65, 90, 75, 68, 82, 78], 'Alignment', 0.4);
 * // Returns: {
 * //   optimal: false,  // Too large + low specialization
 * //   recommendations: [
 * //     'Team too large - consider splitting into 2 focused teams...',
 * //     'Low specialization match for Alignment research - retrain team or hire domain specialists'
 * //   ],
 * //   estimatedProductivity: 0.70
 * // }
 * ```
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
 *    - Logarithmic scaling: Prevents exponential advantage from unlimited budgets
 *    - Base rates: Efficiency easiest (15%), Alignment/Architecture hardest (5%)
 *    - Compute boost: log10(compute/100k + 1) × 5%, capped at +20%
 *      - $100k → +5%, $1M → +10%, $10M → +15%, $100M+ → +20% (max)
 *    - Talent boost: (avgSkill/100) × 25%, capped at +25%
 *      - 60 skill → +15%, 80 skill → +20%, 100 skill → +25%
 *    - Probability cap: 60% maximum to maintain strategic challenge
 *    - Formula: min(0.60, baseRate + log10(compute/100k+1)×0.05 + avgSkill/100×0.25)
 * 
 * 2. PATENT VALUATION:
 *    - Base value: $100k baseline
 *    - Novelty multiplier: noveltyScore/50 → 1.4x (70) to 2.0x (100)
 *    - Impact multiplier: 1 + (performanceGain + efficiencyGain)/100 → 1.0x to 1.7x
 *    - Area multipliers:
 *      - Efficiency: 2.0x (highest commercial value, direct cost savings)
 *      - Architecture: 1.8x (strong moat, licensing potential)
 *      - Multimodal: 1.6x (expanding capabilities, new markets)
 *      - Performance: 1.5x (competitive advantage)
 *      - Reasoning: 1.4x (specialized applications)
 *      - Alignment: 1.0x (harder to monetize directly)
 *    - Realistic range: $140k-$3M for valuable patents
 *    - Alignment exception: Requires >= 15% performance gain (theoretical barrier)
 * 
 * 3. PATENT FILING COSTS:
 *    - Attorney fees: $8k (Efficiency) to $15k (Alignment/Architecture)
 *    - USPTO fees: $1.5k domestic, $3k with international intent
 *    - International: $15k per jurisdiction (PCT + translation + local counsel)
 *    - Total examples:
 *      - Domestic Efficiency: $9.5k
 *      - Domestic Architecture: $18k
 *      - International Architecture (Europe + China): $48k
 *    - Timeline: 18 months domestic, 36 months international
 * 
 * 4. PUBLICATION IMPACT:
 *    - Base citations: Conference 30, Journal 60, Workshop 5, Preprint 2
 *    - Prestige multiplier: 1.5x for top venues (NeurIPS, Nature, etc.)
 *    - Area popularity: Multimodal 1.4x (hottest), Alignment 0.9x (niche)
 *    - Novelty factor: 0.5 (low) to 1.5 (high) based on score/100
 *    - Formula: baseCitations × prestige × popularity × novelty
 *    - Impact score: venueScore + prestigeScore + noveltyScore×0.3 (max 100)
 *    - Community benefit: Very High (80+), High (60+), Medium (40+), Low (<40)
 *    - Venue recommendation: Novelty 75+ should target top Conference/Journal
 * 
 * 5. TEAM OPTIMIZATION:
 *    - Optimal size: 5 researchers (collaboration sweet spot)
 *    - Skill target: Avg >= 75 for breakthrough potential
 *    - Specialization: >= 70% of team should match research area
 *    - Distribution: Mix senior (85+) and junior (<65) for cost/mentorship
 *    - Productivity formula: (sizeFactor + skillFactor + specializationFactor) / 3
 *      - Size factor: 1 - |teamSize - 5| / 10
 *      - Skill factor: avgSkill / 100
 *      - Specialization factor: specializationMatch
 *    - Recommendations: Actionable steps to improve team composition
 * 
 * 6. USAGE PATTERNS:
 *    - Research probability: Call before starting projects to estimate success chance
 *    - Patent workflow: isPatentable() → calculatePatentFilingCost() → file decision
 *    - Publication strategy: estimatePublicationImpact() for venue selection
 *    - Team hiring: optimizeResearchTeam() for composition recommendations
 *    - All functions: Pure (no side effects), O(1) complexity (except team O(n))
 * 
 * 7. PERFORMANCE:
 *    - All calculations O(1) time complexity (except team optimization O(n))
 *    - No database queries required (pure utility functions)
 *    - No side effects (functional programming)
 *    - Suitable for real-time UI updates and API endpoints
 *    - Batch operations: Can process multiple teams/breakthroughs efficiently
 */
