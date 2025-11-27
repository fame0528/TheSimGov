/**
 * Opposition Research Cost Structures
 * 
 * OVERVIEW:
 * Defines spending tiers, opportunity costs, and resource allocation
 * for opposition research system. Ensures competitive balance through
 * meaningful trade-offs and strategic decision-making.
 * 
 * Created: 2024-11-26
 * Part of: Opposition Research System (FID-20251125-001C Phase 5)
 */

import { ResearchType, RESEARCH_TIME_HOURS } from './researchTypes';

/**
 * Available spending tiers for research
 */
export const RESEARCH_SPENDING_TIERS = [
  10000,   // $10k - minimum viable research
  25000,   // $25k - standard investigation
  50000,   // $50k - thorough research
  100000,  // $100k - maximum effort
] as const;

export type ResearchSpendingTier = typeof RESEARCH_SPENDING_TIERS[number];

/**
 * Get tier information for UI display
 */
export function getSpendingTierInfo(amount: number): {
  tier: ResearchSpendingTier;
  name: string;
  description: string;
  multiplier: number;
} {
  if (amount >= 100000) {
    return {
      tier: 100000,
      name: 'Maximum Effort',
      description: 'Comprehensive investigation with top investigators',
      multiplier: 1.7,
    };
  }
  if (amount >= 50000) {
    return {
      tier: 50000,
      name: 'Thorough Research',
      description: 'Deep dive with experienced professionals',
      multiplier: 1.5,
    };
  }
  if (amount >= 25000) {
    return {
      tier: 25000,
      name: 'Standard Investigation',
      description: 'Professional research team with moderate resources',
      multiplier: 1.3,
    };
  }
  return {
    tier: 10000,
    name: 'Basic Research',
    description: 'Minimum viable investigation',
    multiplier: 1.0,
  };
}

/**
 * Calculate opportunity cost of research vs traditional advertising
 * 
 * Context: Research costs money AND time, while traditional ads
 * provide immediate guaranteed polling impact. Research is gambling
 * for potentially higher payoff.
 */
export function calculateOpportunityCost(
  researchSpend: number,
  researchType: ResearchType
): {
  traditionalAdImpact: number; // What you'd get from traditional ads
  timeInvestment: number;      // Hours spent on research
  breakEvenQuality: number;    // Research quality needed to beat traditional ads
} {
  // Traditional ad effectiveness (from adSpendEffectiveness.ts)
  // Approximate formula: impact ≈ spend^0.6 / 10000
  const traditionalAdImpact = Math.pow(researchSpend, 0.6) / 10000;
  
  // Time investment in game hours
  const timeInvestment = RESEARCH_TIME_HOURS[researchType];
  
  // Research quality needed to match traditional ad impact
  // (Higher spend requires higher quality findings to justify)
  const breakEvenQuality = Math.min(100, traditionalAdImpact * 20);
  
  return {
    traditionalAdImpact,
    timeInvestment,
    breakEvenQuality,
  };
}

/**
 * Calculate maximum concurrent research operations
 * (Prevents spam, forces strategic choices)
 */
export function getMaxConcurrentResearch(playerCampaignBudget: number): number {
  // Scale with budget: 1 research per $500k in budget
  // Min: 1, Max: 5
  const calculated = Math.floor(playerCampaignBudget / 500000);
  return Math.max(1, Math.min(5, calculated));
}

/**
 * Check if player can afford research
 */
export function canAffordResearch(
  playerBudget: number,
  researchCost: number
): {
  canAfford: boolean;
  shortfall: number;
  percentOfBudget: number;
} {
  const canAfford = playerBudget >= researchCost;
  const shortfall = Math.max(0, researchCost - playerBudget);
  const percentOfBudget = (researchCost / playerBudget) * 100;
  
  return {
    canAfford,
    shortfall,
    percentOfBudget,
  };
}

/**
 * Calculate recommended spending based on campaign phase
 */
export function getRecommendedSpending(
  campaignPhase: 'ANNOUNCEMENT' | 'FUNDRAISING' | 'ACTIVE' | 'RESOLUTION',
  playerBudget: number
): {
  recommended: ResearchSpendingTier;
  reasoning: string;
} {
  // Research not allowed during ANNOUNCEMENT (no mudslinging yet)
  if (campaignPhase === 'ANNOUNCEMENT') {
    return {
      recommended: 10000,
      reasoning: 'Research not available during announcement phase',
    };
  }
  
  // During FUNDRAISING: Conservative spending (save for active phase)
  if (campaignPhase === 'FUNDRAISING') {
    return {
      recommended: 10000,
      reasoning: 'Conservative spending during fundraising - save resources for active phase',
    };
  }
  
  // During ACTIVE: Aggressive spending (critical phase)
  if (campaignPhase === 'ACTIVE') {
    if (playerBudget >= 500000) {
      return {
        recommended: 100000,
        reasoning: 'Active phase with strong budget - maximum effort recommended',
      };
    }
    if (playerBudget >= 200000) {
      return {
        recommended: 50000,
        reasoning: 'Active phase with moderate budget - thorough research recommended',
      };
    }
    return {
      recommended: 25000,
      reasoning: 'Active phase with limited budget - standard investigation affordable',
    };
  }
  
  // During RESOLUTION: Emergency spending only
  return {
    recommended: 25000,
    reasoning: 'Resolution phase - last chance for game-changing findings',
  };
}

/**
 * Calculate total investment required (research + ad deployment)
 * 
 * Note: Finding dirt is only half the battle - you need to spend
 * additional money to turn research into attack ads
 */
export function calculateTotalInvestment(
  researchCost: number,
  plannedAdSpend: number
): {
  totalCost: number;
  researchPortion: number;
  adPortion: number;
  percentageBreakdown: string;
} {
  const totalCost = researchCost + plannedAdSpend;
  const researchPortion = (researchCost / totalCost) * 100;
  const adPortion = (plannedAdSpend / totalCost) * 100;
  
  return {
    totalCost,
    researchPortion,
    adPortion,
    percentageBreakdown: `${researchPortion.toFixed(0)}% research, ${adPortion.toFixed(0)}% ads`,
  };
}

/**
 * Estimate time to completion with time scaling factor
 */
export function estimateCompletionTime(
  researchType: ResearchType,
  timeScalingFactor: number = 168 // 168x from campaign engine
): {
  realTimeMinutes: number;
  gameTimeHours: number;
  completesAt: Date;
} {
  const gameTimeHours = RESEARCH_TIME_HOURS[researchType];
  const realTimeMinutes = (gameTimeHours * 60) / timeScalingFactor;
  const completesAt = new Date(Date.now() + realTimeMinutes * 60 * 1000);
  
  return {
    realTimeMinutes,
    gameTimeHours,
    completesAt,
  };
}

/**
 * Calculate diminishing returns for multiple research attempts
 */
export function calculateDiminishingReturns(
  researchCount: number
): {
  efficiencyPenalty: number;
  effectiveSpending: number; // What $100k feels like after penalty
  warningMessage: string | null;
} {
  // Each research attempt reduces efficiency by 15%, capped at 60%
  const efficiencyPenalty = Math.min(0.60, researchCount * 0.15);
  const efficiencyMultiplier = 1 - efficiencyPenalty;
  const effectiveSpending = 100000 * efficiencyMultiplier;
  
  let warningMessage: string | null = null;
  if (researchCount >= 4) {
    warningMessage = 'Severe diminishing returns - most dirt already found';
  } else if (researchCount >= 2) {
    warningMessage = 'Moderate diminishing returns on additional research';
  }
  
  return {
    efficiencyPenalty,
    effectiveSpending,
    warningMessage,
  };
}

/**
 * Format currency for UI display
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}k`;
  }
  return `$${amount}`;
}

/**
 * Get color coding for spending tier
 */
export function getSpendingTierColor(amount: number): string {
  if (amount >= 100000) return 'red';    // Maximum effort
  if (amount >= 50000) return 'orange';  // Thorough
  if (amount >= 25000) return 'yellow';  // Standard
  return 'green';                        // Basic
}

/**
 * Validate research spending amount
 */
export function validateResearchSpending(amount: number): {
  isValid: boolean;
  error: string | null;
} {
  if (amount < 10000) {
    return {
      isValid: false,
      error: 'Minimum research investment is $10,000',
    };
  }
  
  if (amount > 100000) {
    return {
      isValid: false,
      error: 'Maximum research investment is $100,000',
    };
  }
  
  if (!RESEARCH_SPENDING_TIERS.includes(amount as ResearchSpendingTier)) {
    return {
      isValid: false,
      error: `Invalid amount. Choose from: ${RESEARCH_SPENDING_TIERS.map(formatCurrency).join(', ')}`,
    };
  }
  
  return {
    isValid: true,
    error: null,
  };
}
