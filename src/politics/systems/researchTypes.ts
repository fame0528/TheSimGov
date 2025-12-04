/**
 * Opposition Research Types & Categories
 * 
 * OVERVIEW:
 * Defines research categories, effectiveness tiers, and discovery outcomes
 * for player-driven opposition research system. Replaces RNG scandal engine
 * with skill-based competitive mechanics.
 * 
 * Created: 2024-11-26
 * Part of: Opposition Research System (FID-20251125-001C Phase 5)
 */

/**
 * Research categories available for opposition investigation
 */
export enum ResearchType {
  /** Past employment, education, associations - easiest to find */
  BACKGROUND = 'BACKGROUND',
  /** Tax returns, business dealings, debt - moderate difficulty */
  FINANCIAL = 'FINANCIAL',
  /** Voting record, policy positions, flip-flops - moderate difficulty */
  POLICY = 'POLICY',
  /** Legislative votes, attendance, committee work - harder to interpret */
  VOTING_RECORD = 'VOTING_RECORD',
  /** Past statements, interviews, social media - hardest to find damaging content */
  STATEMENTS = 'STATEMENTS',
}

/**
 * Discovery outcome tiers based on research success
 */
export enum DiscoveryTier {
  /** No useful information found - wasted investment */
  NOTHING = 'NOTHING',
  /** Minor inconsistency or optics issue - small polling impact */
  MINOR = 'MINOR',
  /** Clear ethical lapse or contradiction - moderate impact */
  MODERATE = 'MODERATE',
  /** Major scandal or criminal activity - severe impact */
  MAJOR = 'MAJOR',
}

/**
 * Research quality score (0-100) determining ad effectiveness
 */
export interface ResearchQuality {
  /** Overall quality score (0-100) */
  score: number;
  /** Discovery tier achieved */
  tier: DiscoveryTier;
  /** Specific findings (for UI display) */
  findings: string[];
  /** Credibility rating (affects backfire risk) */
  credibility: number; // 0-100
}

/**
 * Complete research record
 */
export interface OppositionResearch {
  id: string;
  playerId: string;
  targetId: string;
  researchType: ResearchType;
  amountSpent: number;
  startedAt: Date;
  completesAt: Date;
  status: 'IN_PROGRESS' | 'COMPLETE' | 'FAILED';
  discoveryResult?: ResearchQuality;
  usedInAds: boolean; // Track if research has been weaponized
}

/**
 * Base discovery rates for each research type (before modifiers)
 */
export const BASE_DISCOVERY_RATES: Record<ResearchType, {
  nothing: number;
  minor: number;
  moderate: number;
  major: number;
}> = {
  [ResearchType.BACKGROUND]: {
    nothing: 0.30,  // 30% chance nothing found
    minor: 0.45,    // 45% minor findings
    moderate: 0.20, // 20% moderate findings
    major: 0.05,    // 5% major scandal
  },
  [ResearchType.FINANCIAL]: {
    nothing: 0.40,
    minor: 0.35,
    moderate: 0.20,
    major: 0.05,
  },
  [ResearchType.POLICY]: {
    nothing: 0.35,
    minor: 0.40,
    moderate: 0.20,
    major: 0.05,
  },
  [ResearchType.VOTING_RECORD]: {
    nothing: 0.45,
    minor: 0.35,
    moderate: 0.15,
    major: 0.05,
  },
  [ResearchType.STATEMENTS]: {
    nothing: 0.50,
    minor: 0.30,
    moderate: 0.15,
    major: 0.05,
  },
};

/**
 * Quality scores for each discovery tier
 */
export const TIER_QUALITY_SCORES: Record<DiscoveryTier, { min: number; max: number }> = {
  [DiscoveryTier.NOTHING]: { min: 0, max: 0 },
  [DiscoveryTier.MINOR]: { min: 20, max: 40 },
  [DiscoveryTier.MODERATE]: { min: 45, max: 70 },
  [DiscoveryTier.MAJOR]: { min: 75, max: 100 },
};

/**
 * Time required for each research type (in game hours at 1:1 scale)
 */
export const RESEARCH_TIME_HOURS: Record<ResearchType, number> = {
  [ResearchType.BACKGROUND]: 48,        // 2 game days
  [ResearchType.FINANCIAL]: 96,         // 4 game days
  [ResearchType.POLICY]: 72,            // 3 game days
  [ResearchType.VOTING_RECORD]: 120,    // 5 game days
  [ResearchType.STATEMENTS]: 168,       // 7 game days
};

/**
 * Get human-readable description for research type
 */
export function getResearchTypeName(type: ResearchType): string {
  const names: Record<ResearchType, string> = {
    [ResearchType.BACKGROUND]: 'Background Investigation',
    [ResearchType.FINANCIAL]: 'Financial Records',
    [ResearchType.POLICY]: 'Policy Analysis',
    [ResearchType.VOTING_RECORD]: 'Voting Record Review',
    [ResearchType.STATEMENTS]: 'Statement Archive',
  };
  return names[type];
}

/**
 * Get description of what research type investigates
 */
export function getResearchTypeDescription(type: ResearchType): string {
  const descriptions: Record<ResearchType, string> = {
    [ResearchType.BACKGROUND]: 'Investigate employment history, education, and personal associations',
    [ResearchType.FINANCIAL]: 'Examine tax returns, business dealings, and financial disclosures',
    [ResearchType.POLICY]: 'Analyze past policy positions and identify flip-flops or contradictions',
    [ResearchType.VOTING_RECORD]: 'Review legislative votes, attendance, and committee participation',
    [ResearchType.STATEMENTS]: 'Search past interviews, speeches, and social media for damaging quotes',
  };
  return descriptions[type];
}

/**
 * Get discovery tier name for UI display
 */
export function getDiscoveryTierName(tier: DiscoveryTier): string {
  const names: Record<DiscoveryTier, string> = {
    [DiscoveryTier.NOTHING]: 'No Findings',
    [DiscoveryTier.MINOR]: 'Minor Issue',
    [DiscoveryTier.MODERATE]: 'Moderate Scandal',
    [DiscoveryTier.MAJOR]: 'Major Scandal',
  };
  return names[tier];
}

/**
 * Get color code for discovery tier
 */
export function getDiscoveryTierColor(tier: DiscoveryTier): 'default' | 'warning' | 'danger' | 'secondary' {
  const colors: Record<DiscoveryTier, 'default' | 'warning' | 'danger' | 'secondary'> = {
    [DiscoveryTier.NOTHING]: 'default',
    [DiscoveryTier.MINOR]: 'warning',
    [DiscoveryTier.MODERATE]: 'warning',
    [DiscoveryTier.MAJOR]: 'danger',
  };
  return colors[tier];
}

/**
 * Generate random quality score within tier range
 */
export function generateQualityScore(tier: DiscoveryTier): number {
  if (tier === DiscoveryTier.NOTHING) return 0;
  
  const range = TIER_QUALITY_SCORES[tier];
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

/**
 * Generate credibility rating (higher for legitimate findings)
 */
export function generateCredibility(tier: DiscoveryTier, researchSpend: number): number {
  // Base credibility by tier
  const baseCredibility: Record<DiscoveryTier, number> = {
    [DiscoveryTier.NOTHING]: 0,
    [DiscoveryTier.MINOR]: 60,
    [DiscoveryTier.MODERATE]: 75,
    [DiscoveryTier.MAJOR]: 85,
  };
  
  // Higher spending = more thorough research = higher credibility
  const spendBonus = Math.min(15, Math.floor(researchSpend / 10000));
  
  return Math.min(100, baseCredibility[tier] + spendBonus + Math.floor(Math.random() * 10));
}

/**
 * Generate findings text based on research type and tier
 */
export function generateFindings(type: ResearchType, tier: DiscoveryTier): string[] {
  if (tier === DiscoveryTier.NOTHING) {
    return ['No actionable information discovered'];
  }
  
  // Sample findings by type and tier (in production, would pull from database)
  const findingsTemplates: Record<ResearchType, Record<DiscoveryTier, string[]>> = {
    [ResearchType.BACKGROUND]: {
      [DiscoveryTier.NOTHING]: [],
      [DiscoveryTier.MINOR]: [
        'Unclear employment gap in early career',
        'Association with controversial figure from college',
      ],
      [DiscoveryTier.MODERATE]: [
        'Past business partner convicted of fraud',
        'Membership in organization with extreme views',
      ],
      [DiscoveryTier.MAJOR]: [
        'Falsified credentials on resume',
        'Close ties to organized crime figure',
      ],
    },
    [ResearchType.FINANCIAL]: {
      [DiscoveryTier.NOTHING]: [],
      [DiscoveryTier.MINOR]: [
        'Late tax payments in previous years',
        'Minor business dispute settlement',
      ],
      [DiscoveryTier.MODERATE]: [
        'Offshore accounts in tax haven',
        'Loan from foreign government entity',
      ],
      [DiscoveryTier.MAJOR]: [
        'Tax evasion investigation',
        'Undisclosed conflict of interest',
      ],
    },
    [ResearchType.POLICY]: {
      [DiscoveryTier.NOTHING]: [],
      [DiscoveryTier.MINOR]: [
        'Shifted position on minor issue',
        'Voted against campaign promise once',
      ],
      [DiscoveryTier.MODERATE]: [
        'Complete reversal on major policy',
        'Contradictory statements on key issue',
      ],
      [DiscoveryTier.MAJOR]: [
        'Secret lobbying for opposing position',
        'Lied about policy record',
      ],
    },
    [ResearchType.VOTING_RECORD]: {
      [DiscoveryTier.NOTHING]: [],
      [DiscoveryTier.MINOR]: [
        'Poor committee attendance',
        'Missed several important votes',
      ],
      [DiscoveryTier.MODERATE]: [
        'Voted against constituent interests',
        'Pattern of voting with special interests',
      ],
      [DiscoveryTier.MAJOR]: [
        'Vote trading scandal',
        'Voted on bill benefiting personal business',
      ],
    },
    [ResearchType.STATEMENTS]: {
      [DiscoveryTier.NOTHING]: [],
      [DiscoveryTier.MINOR]: [
        'Awkward statement taken out of context',
        'Minor gaffe in old interview',
      ],
      [DiscoveryTier.MODERATE]: [
        'Offensive comment from years ago',
        'Contradictory statements on values',
      ],
      [DiscoveryTier.MAJOR]: [
        'Racist/sexist remarks on recording',
        'Admitted to illegal activity in interview',
      ],
    },
  };
  
  const templates = findingsTemplates[type][tier];
  // Randomly select 1-2 findings
  const count = tier === DiscoveryTier.MINOR ? 1 : Math.random() > 0.5 ? 2 : 1;
  const shuffled = [...templates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
