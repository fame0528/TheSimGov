/**
 * @file src/lib/utils/politics/formatters.ts
 * @description Formatting functions for politics domain
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Provides pure formatting functions for displaying political data in user-friendly formats.
 * Handles dates, currency, percentages, status labels, and other display transformations.
 */

import type {
  ElectionStatus,
  CampaignStatus,
  BillStatus,
  PoliticalParty,
  ElectionType,
  BillCategory,
  DonorType,
  DistrictType,
  OutreachMethod,
  VoteType,
} from '@/types/politics';

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format election date with context
 * 
 * @param date - Election date
 * @returns Formatted date string with relative context
 * 
 * @example
 * ```ts
 * formatElectionDate(new Date('2025-11-04')); // "Nov 4, 2025 (in 5 days)"
 * ```
 */
export function formatElectionDate(date: string | Date): string {
  try {
    const electionDate = new Date(date);
    const today = new Date();
    const diffTime = electionDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const formatted = electionDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (diffDays === 0) {
      return `${formatted} (Today)`;
    } else if (diffDays === 1) {
      return `${formatted} (Tomorrow)`;
    } else if (diffDays > 0 && diffDays <= 30) {
      return `${formatted} (in ${diffDays} days)`;
    } else if (diffDays < 0 && diffDays >= -30) {
      return `${formatted} (${Math.abs(diffDays)} days ago)`;
    }

    return formatted;
  } catch (error) {
    console.error('[formatElectionDate] Error:', error);
    return 'Invalid date';
  }
}

/**
 * Format campaign date range
 * 
 * @param startDate - Campaign start date
 * @param endDate - Campaign end date (optional)
 * @returns Formatted date range string
 */
export function formatCampaignDateRange(
  startDate: string | Date,
  endDate?: string | Date | null
): string {
  try {
    const start = new Date(startDate);
    const startFormatted = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (!endDate) {
      return `${startFormatted} - Ongoing`;
    }

    const end = new Date(endDate);
    const endFormatted = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return `${startFormatted} - ${endFormatted}`;
  } catch (error) {
    console.error('[formatCampaignDateRange] Error:', error);
    return 'Invalid date range';
  }
}

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

/**
 * Format vote count with thousands separators
 * 
 * @param votes - Number of votes
 * @returns Formatted vote count string
 * 
 * @example
 * ```ts
 * formatVoteCount(1234567); // "1,234,567 votes"
 * ```
 */
export function formatVoteCount(votes: number): string {
  try {
    if (votes === 1) {
      return '1 vote';
    }
    return `${votes.toLocaleString('en-US')} votes`;
  } catch (error) {
    console.error('[formatVoteCount] Error:', error);
    return '0 votes';
  }
}

/**
 * Format donor amount as currency
 * 
 * @param amount - Dollar amount
 * @param includeCents - Whether to include cents
 * @returns Formatted currency string
 * 
 * @example
 * ```ts
 * formatDonorAmount(1500); // "$1,500"
 * formatDonorAmount(1500.50, true); // "$1,500.50"
 * ```
 */
export function formatDonorAmount(amount: number, includeCents: boolean = false): string {
  try {
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: includeCents ? 2 : 0,
      maximumFractionDigits: includeCents ? 2 : 0,
    };
    return amount.toLocaleString('en-US', options);
  } catch (error) {
    console.error('[formatDonorAmount] Error:', error);
    return '$0';
  }
}

/**
 * Format campaign funds with compact notation for large amounts
 * 
 * @param amount - Dollar amount
 * @returns Formatted currency string (compact for large amounts)
 * 
 * @example
 * ```ts
 * formatCampaignFunds(1500000); // "$1.5M"
 * formatCampaignFunds(5000); // "$5,000"
 * ```
 */
export function formatCampaignFunds(amount: number): string {
  try {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return formatDonorAmount(amount, false);
  } catch (error) {
    console.error('[formatCampaignFunds] Error:', error);
    return '$0';
  }
}

/**
 * Format percentage with optional decimal places
 * 
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 * 
 * @example
 * ```ts
 * formatPercentage(65.5, 1); // "65.5%"
 * formatPercentage(65.5, 0); // "66%"
 * ```
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  try {
    return `${value.toFixed(decimals)}%`;
  } catch (error) {
    console.error('[formatPercentage] Error:', error);
    return '0%';
  }
}

/**
 * Format population with compact notation
 * 
 * @param population - Population count
 * @returns Formatted population string
 * 
 * @example
 * ```ts
 * formatPopulation(1500000); // "1.5M"
 * formatPopulation(75000); // "75K"
 * ```
 */
export function formatPopulation(population: number): string {
  try {
    if (population >= 1000000) {
      return `${(population / 1000000).toFixed(1)}M`;
    } else if (population >= 1000) {
      return `${(population / 1000).toFixed(0)}K`;
    }
    return population.toLocaleString('en-US');
  } catch (error) {
    console.error('[formatPopulation] Error:', error);
    return '0';
  }
}

// ============================================================================
// STATUS FORMATTING
// ============================================================================

/**
 * Format election status with proper casing and color hint
 * 
 * @param status - Election status
 * @returns Object with formatted label and color
 * 
 * @example
 * ```ts
 * formatElectionStatus('Active'); // { label: 'Active', color: 'success' }
 * ```
 */
export function formatElectionStatus(status: ElectionStatus): {
  label: string;
  color: 'default' | 'primary' | 'success' | 'warning' | 'danger';
} {
  const statusMap: Record<ElectionStatus, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'danger' }> = {
    'Scheduled': { label: 'Scheduled', color: 'primary' },
    'Registration Open': { label: 'Registration Open', color: 'warning' },
    'Active': { label: 'Active', color: 'success' },
    'Completed': { label: 'Completed', color: 'default' },
    'Certified': { label: 'Certified', color: 'success' },
    'Cancelled': { label: 'Cancelled', color: 'danger' },
  };

  return statusMap[status] || { label: status, color: 'default' };
}

/**
 * Format campaign status with proper casing and color hint
 * 
 * @param status - Campaign status
 * @returns Object with formatted label and color
 */
export function formatCampaignStatus(status: CampaignStatus): {
  label: string;
  color: 'default' | 'primary' | 'success' | 'warning' | 'danger';
} {
  const statusMap: Record<CampaignStatus, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'danger' }> = {
    'Exploratory': { label: 'Exploratory', color: 'default' },
    'Announced': { label: 'Announced', color: 'primary' },
    'Active': { label: 'Active', color: 'success' },
    'Suspended': { label: 'Suspended', color: 'warning' },
    'Withdrawn': { label: 'Withdrawn', color: 'danger' },
    'Completed': { label: 'Completed', color: 'default' },
  };

  return statusMap[status] || { label: status, color: 'default' };
}

/**
 * Format bill status with proper casing and color hint
 * 
 * @param status - Bill status
 * @returns Object with formatted label and color
 */
export function formatBillStatus(status: BillStatus): {
  label: string;
  color: 'default' | 'primary' | 'success' | 'warning' | 'danger';
} {
  const statusMap: Record<BillStatus, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'danger' }> = {
    'Drafted': { label: 'Drafted', color: 'default' },
    'Introduced': { label: 'Introduced', color: 'primary' },
    'In Committee': { label: 'In Committee', color: 'primary' },
    'Floor Debate': { label: 'Floor Debate', color: 'warning' },
    'Passed House': { label: 'Passed House', color: 'success' },
    'Passed Senate': { label: 'Passed Senate', color: 'success' },
    'Sent to Executive': { label: 'Sent to Executive', color: 'primary' },
    'Signed': { label: 'Signed', color: 'success' },
    'Vetoed': { label: 'Vetoed', color: 'danger' },
    'Failed': { label: 'Failed', color: 'danger' },
  };

  return statusMap[status] || { label: status, color: 'default' };
}

// ============================================================================
// LABEL FORMATTING
// ============================================================================

/**
 * Format political party with full name and abbreviation
 * 
 * @param party - Political party
 * @returns Formatted party label
 * 
 * @example
 * ```ts
 * formatPoliticalParty('Democratic'); // "Democratic (D)"
 * ```
 */
export function formatPoliticalParty(party: PoliticalParty): string {
  const partyAbbrev: Record<PoliticalParty, string> = {
    'Democratic': 'D',
    'Republican': 'R',
    'Independent': 'I',
    'Libertarian': 'L',
    'Green': 'G',
    'Other': 'O',
  };

  return `${party} (${partyAbbrev[party] || '?'})`;
}

/**
 * Format election type with full description
 * 
 * @param type - Election type
 * @returns Formatted election type label
 */
export function formatElectionType(type: ElectionType): string {
  const typeLabels: Record<ElectionType, string> = {
    'Primary': 'Primary Election',
    'General': 'General Election',
    'Special': 'Special Election',
    'Runoff': 'Runoff Election',
    'Recall': 'Recall Election',
  };

  return typeLabels[type] || type;
}

/**
 * Format bill category with full description
 * 
 * @param category - Bill category
 * @returns Formatted category label
 */
export function formatBillCategory(category: BillCategory): string {
  const categoryLabels: Record<BillCategory, string> = {
    'Budget': 'Budget & Appropriations',
    'Education': 'Education',
    'Healthcare': 'Healthcare',
    'Infrastructure': 'Infrastructure',
    'Environment': 'Environmental Policy',
    'Criminal Justice': 'Criminal Justice',
    'Economic Development': 'Economic Development',
    'Social Services': 'Social Services',
    'Labor': 'Labor & Workforce',
    'Taxation': 'Taxation',
    'Other': 'Other',
  };

  return categoryLabels[category] || category;
}

/**
 * Format donor type with full description
 * 
 * @param type - Donor type
 * @returns Formatted donor type label
 */
export function formatDonorType(type: DonorType): string {
  const typeLabels: Record<DonorType, string> = {
    'Individual': 'Individual Donor',
    'PAC': 'Political Action Committee',
    'Super PAC': 'Super PAC',
    'Corporation': 'Corporate Donor',
    'Labor Union': 'Labor Union',
    'Non-Profit': 'Non-Profit',
    'Party Committee': 'Party Committee',
    'Other': 'Other',
  };

  return typeLabels[type] || type;
}

/**
 * Format district type with full description
 * 
 * @param type - District type
 * @returns Formatted district type label
 */
export function formatDistrictType(type: DistrictType): string {
  const typeLabels: Record<DistrictType, string> = {
    'Congressional': 'Congressional District',
    'State Senate': 'State Senate District',
    'State House': 'State House District',
    'City Council': 'City Council',
    'School Board': 'School District',
    'County': 'County',
  };

  return typeLabels[type] || type;
}

/**
 * Format district name with type
 * 
 * @param name - District name
 * @param type - District type
 * @returns Formatted district name
 * 
 * @example
 * ```ts
 * formatDistrictName('District 5', 'Congressional'); // "Congressional District 5"
 * ```
 */
export function formatDistrictName(name: string, type: DistrictType): string {
  try {
    return `${formatDistrictType(type)} ${name}`;
  } catch (error) {
    console.error('[formatDistrictName] Error:', error);
    return name;
  }
}

/**
 * Format outreach method with full description
 * 
 * @param method - Outreach method
 * @returns Formatted method label
 */
export function formatOutreachMethod(method: OutreachMethod): string {
  const methodLabels: Record<OutreachMethod, string> = {
    'Door to Door': 'Door-to-Door Canvassing',
    'Phone Banking': 'Phone Banking',
    'Text Messaging': 'Text Message Campaign',
    'Email Campaign': 'Email Campaign',
    'Social Media': 'Social Media Outreach',
    'Direct Mail': 'Direct Mail Campaign',
    'TV Advertising': 'TV Advertising',
    'Radio Advertising': 'Radio Advertising',
    'Digital Advertising': 'Digital Advertising',
    'Town Hall': 'Town Hall Meeting',
    'Rally': 'Campaign Rally',
    'Debate': 'Debate',
  };

  return methodLabels[method] || method;
}

/**
 * Format vote type with full description
 * 
 * @param vote - Vote type
 * @returns Formatted vote label
 */
export function formatVoteType(vote: VoteType): string {
  const voteLabels: Record<VoteType, string> = {
    'Yea': 'Yes',
    'Nay': 'No',
    'Abstain': 'Abstain',
    'Present': 'Present (Not Voting)',
    'Absent': 'Absent',
  };

  return voteLabels[vote] || vote;
}

// ============================================================================
// CAMPAIGN PROGRESS FORMATTING
// ============================================================================

/**
 * Format campaign progress as readable string
 * 
 * @param progress - Progress percentage (0-100)
 * @returns Formatted progress string with visual indicator
 * 
 * @example
 * ```ts
 * formatCampaignProgress(65); // "65% Complete ████████░░"
 * ```
 */
export function formatCampaignProgress(progress: number): string {
  try {
    const percentage = Math.min(100, Math.max(0, progress));
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    return `${percentage.toFixed(0)}% Complete ${bar}`;
  } catch (error) {
    console.error('[formatCampaignProgress] Error:', error);
    return '0% Complete ░░░░░░░░░░';
  }
}

/**
 * Format win probability with visual indicator
 * 
 * @param probability - Win probability (0-100)
 * @returns Formatted probability string
 * 
 * @example
 * ```ts
 * formatWinProbability(75); // "75% (Likely Win)"
 * ```
 */
export function formatWinProbability(probability: number): string {
  try {
    const p = Math.min(100, Math.max(0, probability));
    let label = 'Toss-up';
    
    if (p >= 90) label = 'Very Likely Win';
    else if (p >= 70) label = 'Likely Win';
    else if (p >= 55) label = 'Lean Win';
    else if (p >= 45) label = 'Toss-up';
    else if (p >= 30) label = 'Lean Loss';
    else if (p >= 10) label = 'Likely Loss';
    else label = 'Very Likely Loss';
    
    return `${p.toFixed(0)}% (${label})`;
  } catch (error) {
    console.error('[formatWinProbability] Error:', error);
    return '50% (Toss-up)';
  }
}

// ============================================================================
// IMPACT FORMATTING
// ============================================================================

/**
 * Format impact score with rating
 * 
 * @param impact - Impact score (0-10)
 * @returns Formatted impact string
 * 
 * @example
 * ```ts
 * formatImpactScore(8); // "8.0/10 (High Impact)"
 * ```
 */
export function formatImpactScore(impact: number): string {
  try {
    const score = Math.min(10, Math.max(0, impact));
    let rating = 'None';
    
    if (score >= 8) rating = 'High Impact';
    else if (score >= 5) rating = 'Moderate Impact';
    else if (score >= 2) rating = 'Low Impact';
    else rating = 'Minimal Impact';
    
    return `${score.toFixed(1)}/10 (${rating})`;
  } catch (error) {
    console.error('[formatImpactScore] Error:', error);
    return '0.0/10 (None)';
  }
}

/**
 * Format outreach effectiveness score
 * 
 * @param effectiveness - Effectiveness score (0-100)
 * @returns Formatted effectiveness string
 * 
 * @example
 * ```ts
 * formatOutreachEffectiveness(85); // "85% (Highly Effective)"
 * ```
 */
export function formatOutreachEffectiveness(effectiveness: number): string {
  try {
    const score = Math.min(100, Math.max(0, effectiveness));
    let rating = 'Poor';
    
    if (score >= 80) rating = 'Highly Effective';
    else if (score >= 60) rating = 'Effective';
    else if (score >= 40) rating = 'Moderately Effective';
    else if (score >= 20) rating = 'Low Effectiveness';
    else rating = 'Poor';
    
    return `${score.toFixed(0)}% (${rating})`;
  } catch (error) {
    console.error('[formatOutreachEffectiveness] Error:', error);
    return '0% (Poor)';
  }
}

// ============================================================================
// BILL SUPPORT FORMATTING
// ============================================================================

/**
 * Format bill support level as passage likelihood
 * 
 * @param support - Support percentage (0-100)
 * @returns Formatted support string with likelihood
 * 
 * @example
 * ```ts
 * formatBillSupport(65); // "65% Support (Likely to Pass)"
 * ```
 */
export function formatBillSupport(support: number): string {
  try {
    const s = Math.min(100, Math.max(0, support));
    let likelihood = 'Uncertain';
    
    if (s >= 67) likelihood = 'Likely to Pass';
    else if (s >= 60) likelihood = 'Lean Pass';
    else if (s >= 50) likelihood = 'Toss-up';
    else if (s >= 40) likelihood = 'Lean Fail';
    else likelihood = 'Likely to Fail';
    
    return `${s.toFixed(0)}% Support (${likelihood})`;
  } catch (error) {
    console.error('[formatBillSupport] Error:', error);
    return '0% Support (Unknown)';
  }
}
