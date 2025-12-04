/**
 * @file src/lib/utils/politics/calculators.ts
 * @description Calculation functions for politics domain
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Provides pure calculation functions for political metrics, election results,
 * campaign performance, bill support analysis, and voter outreach effectiveness.
 * All functions include comprehensive error handling and edge case management.
 */

import type {
  ElectionData,
  ElectionResults,
  CampaignData,
  BillData,
  DonorData,
  VoterOutreachData,
  PoliticsMetrics,
  CampaignPerformance,
  BillAnalysis,
  FundraisingBreakdown,
  ElectionTypeStats,
  ElectionCandidate,
  LegislativeVote,
  VoteType,
  PoliticalParty,
  DonorType,
  BillCategory,
  ElectionType,
} from '@/types/politics';

// ============================================================================
// ELECTION CALCULATIONS
// ============================================================================

/**
 * Calculate complete election results from candidate data
 * 
 * @param candidates - Array of candidates with vote counts
 * @param registeredVoters - Total number of registered voters
 * @returns Complete election results with winner and margins
 * 
 * @example
 * ```ts
 * const results = calculateElectionResults(candidates, 100000);
 * console.log(results.winner); // "John Smith"
 * console.log(results.turnoutRate); // 65.5
 * ```
 */
export function calculateElectionResults(
  candidates: ElectionCandidate[],
  registeredVoters: number = 0
): ElectionResults | null {
  try {
    if (!candidates || candidates.length === 0) {
      return null;
    }

    // Calculate total votes
    const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
    
    if (totalVotes === 0) {
      return null;
    }

    // Update vote percentages for each candidate
    const updatedCandidates = candidates.map(c => ({
      ...c,
      votePercentage: totalVotes > 0 ? (c.votes / totalVotes) * 100 : 0,
    }));

    // Find winner (candidate with most votes)
    const winner = updatedCandidates.reduce((prev, current) => 
      (current.votes > prev.votes) ? current : prev
    );

    // Find second place for margin calculation
    const sortedCandidates = [...updatedCandidates].sort((a, b) => b.votes - a.votes);
    const secondPlace = sortedCandidates[1] || { votes: 0, votePercentage: 0 };

    // Calculate turnout rate
    const turnoutRate = registeredVoters > 0 
      ? (totalVotes / registeredVoters) * 100 
      : 0;

    return {
      totalVotes,
      turnoutRate: Math.min(100, Math.max(0, turnoutRate)),
      winnerId: winner.playerId || winner.candidateId || '',
      winnerName: winner.candidateName,
      winnerParty: winner.party,
      margin: winner.votes - secondPlace.votes,
      marginPercentage: winner.votePercentage - secondPlace.votePercentage,
    };
  } catch (error) {
    console.error('[calculateElectionResults] Error:', error);
    return null;
  }
}

/**
 * Calculate vote percentage for a specific count
 * 
 * @param votes - Number of votes received
 * @param totalVotes - Total votes cast
 * @returns Percentage (0-100)
 */
export function calculateVotePercentage(votes: number, totalVotes: number): number {
  try {
    if (totalVotes <= 0 || votes < 0) {
      return 0;
    }
    return Math.min(100, Math.max(0, (votes / totalVotes) * 100));
  } catch (error) {
    console.error('[calculateVotePercentage] Error:', error);
    return 0;
  }
}

/**
 * Calculate election statistics grouped by type
 * 
 * @param elections - Array of all elections
 * @returns Statistics by election type
 */
export function calculateElectionTypeStats(
  elections: ElectionData[]
): ElectionTypeStats[] {
  try {
    const statsByType = new Map<ElectionType, {
      count: number;
      totalTurnout: number;
      completed: number;
    }>();

    elections.forEach(election => {
      const existing = statsByType.get(election.electionType) || {
        count: 0,
        totalTurnout: 0,
        completed: 0,
      };

      existing.count++;
      if (election.results) {
        existing.totalTurnout += election.results.turnoutRate || 0;
        existing.completed++;
      }

      statsByType.set(election.electionType, existing);
    });

    return Array.from(statsByType.entries()).map(([type, stats]) => ({
      electionType: type,
      count: stats.count,
      averageTurnout: stats.completed > 0 ? stats.totalTurnout / stats.completed : 0,
      completionRate: stats.count > 0 ? (stats.completed / stats.count) * 100 : 0,
    }));
  } catch (error) {
    console.error('[calculateElectionTypeStats] Error:', error);
    return [];
  }
}

// ============================================================================
// CAMPAIGN CALCULATIONS
// ============================================================================

/**
 * Calculate campaign progress and metrics
 * 
 * @param campaign - Campaign data
 * @returns Progress metrics (0-100)
 * 
 * @example
 * ```ts
 * const progress = calculateCampaignProgress(campaign);
 * console.log(progress); // 67.5
 * ```
 */
export function calculateCampaignProgress(campaign: CampaignData): number {
  try {
    const today = new Date();
    const start = new Date(campaign.startDate);
    const end = campaign.endDate ? new Date(campaign.endDate) : new Date(campaign.election as string);

    if (today < start) {
      return 0;
    }

    if (today > end) {
      return 100;
    }

    const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const daysPassed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
  } catch (error) {
    console.error('[calculateCampaignProgress] Error:', error);
    return 0;
  }
}

/**
 * Calculate campaign performance metrics
 * 
 * @param campaign - Campaign data
 * @returns Comprehensive performance metrics
 */
export function calculateCampaignPerformance(campaign: CampaignData): CampaignPerformance {
  try {
    const pollAverage = campaign.polls && campaign.polls.length > 0
      ? campaign.polls.reduce((sum, p) => sum + p.support, 0) / campaign.polls.length
      : 0;

    const favorability = campaign.polls && campaign.polls.length > 0
      ? campaign.polls.reduce((sum, p) => sum + p.favorability, 0) / campaign.polls.length
      : 0;

    // Simple win probability calculation based on polling
    let winProbability = 50;
    if (pollAverage > 0) {
      if (pollAverage >= 50) {
        winProbability = Math.min(95, 50 + (pollAverage - 50) * 1.5);
      } else {
        winProbability = Math.max(5, pollAverage * 0.9);
      }
    }

    return {
      campaignId: campaign._id,
      campaignName: campaign.playerName + ' Campaign',
      candidate: campaign.playerName,
      party: campaign.party,
      fundsRaised: campaign.fundsRaised,
      pollAverage,
      favorability,
      eventCount: campaign.events?.length || 0,
      volunteerCount: campaign.volunteers,
      projectedWinProbability: winProbability,
    };
  } catch (error) {
    console.error('[calculateCampaignPerformance] Error:', error);
    return {
      campaignId: campaign._id,
      campaignName: '',
      candidate: campaign.playerName,
      party: campaign.party,
      fundsRaised: 0,
      pollAverage: 0,
      favorability: 0,
      eventCount: 0,
      volunteerCount: 0,
      projectedWinProbability: 50,
    };
  }
}

// ============================================================================
// BILL CALCULATIONS
// ============================================================================

/**
 * Calculate bill support level from votes
 * 
 * @param votes - Array of legislative votes
 * @returns Support percentage (0-100)
 * 
 * @example
 * ```ts
 * const support = calculateBillSupportLevel(bill.votes);
 * console.log(support); // 72.5
 * ```
 */
export function calculateBillSupportLevel(votes: LegislativeVote[]): number {
  try {
    if (!votes || votes.length === 0) {
      return 0;
    }

    const voteCount = votes.reduce((acc, vote) => {
      if (vote.vote === 'Yea') acc.yea++;
      else if (vote.vote === 'Nay') acc.nay++;
      else if (vote.vote === 'Abstain') acc.abstain++;
      else if (vote.vote === 'Present') acc.present++;
      else if (vote.vote === 'Absent') acc.absent++;
      return acc;
    }, { yea: 0, nay: 0, abstain: 0, present: 0, absent: 0 });

    const totalVotes = voteCount.yea + voteCount.nay;
    
    if (totalVotes === 0) {
      return 0;
    }

    return (voteCount.yea / totalVotes) * 100;
  } catch (error) {
    console.error('[calculateBillSupportLevel] Error:', error);
    return 0;
  }
}

/**
 * Calculate bill passage analysis by category
 * 
 * @param bills - Array of all bills
 * @returns Analysis grouped by category
 */
export function calculateBillAnalysis(bills: BillData[]): BillAnalysis[] {
  try {
    const analysisByCategory = new Map<BillCategory, {
      total: number;
      passed: number;
      failed: number;
      totalSupport: number;
      totalImpact: number;
      billsWithSupport: number;
    }>();

    bills.forEach(bill => {
      const existing = analysisByCategory.get(bill.category) || {
        total: 0,
        passed: 0,
        failed: 0,
        totalSupport: 0,
        totalImpact: 0,
        billsWithSupport: 0,
      };

      existing.total++;
      
      if (bill.status === 'Signed') {
        existing.passed++;
      } else if (bill.status === 'Vetoed' || bill.status === 'Failed') {
        existing.failed++;
      }

      if (bill.votes && bill.votes.length > 0) {
        existing.totalSupport += calculateBillSupportLevel(bill.votes);
        existing.billsWithSupport++;
      }

      if (bill.expectedImpact) {
        const avgImpact = (
          (bill.expectedImpact.economicImpact || 0) +
          (bill.expectedImpact.socialImpact || 0) +
          (bill.expectedImpact.environmentalImpact || 0)
        ) / 3;
        existing.totalImpact += avgImpact;
      }

      analysisByCategory.set(bill.category, existing);
    });

    return Array.from(analysisByCategory.entries()).map(([category, stats]) => ({
      category,
      totalBills: stats.total,
      passedBills: stats.passed,
      failedBills: stats.failed,
      passageRate: stats.total > 0 ? (stats.passed / stats.total) * 100 : 0,
      averageSupport: stats.billsWithSupport > 0 ? stats.totalSupport / stats.billsWithSupport : 0,
      averageImpact: stats.total > 0 ? stats.totalImpact / stats.total : 0,
    }));
  } catch (error) {
    console.error('[calculateBillAnalysis] Error:', error);
    return [];
  }
}

// ============================================================================
// DONOR CALCULATIONS
// ============================================================================

/**
 * Calculate donor impact and contribution metrics
 * 
 * @param donor - Donor data
 * @param allDonors - All donors for comparison
 * @returns Impact score (0-100)
 * 
 * @example
 * ```ts
 * const impact = calculateDonorImpact(donor, allDonors);
 * console.log(impact); // 85.5
 * ```
 */
export function calculateDonorImpact(donor: DonorData, allDonors: DonorData[]): number {
  try {
    if (!allDonors || allDonors.length === 0) {
      return 50;
    }

    // Calculate percentile ranking based on donation amount
    const sortedByAmount = [...allDonors].sort((a, b) => b.amount - a.amount);
    const donorRank = sortedByAmount.findIndex(d => d._id === donor._id);
    const percentile = donorRank >= 0 
      ? ((allDonors.length - donorRank) / allDonors.length) * 100 
      : 50;

    // Bonus for recurring donations
    const recurringBonus = donor.recurring ? 10 : 0;

    // Bonus for matching gifts
    const matchingBonus = donor.matchingGift ? 10 : 0;

    const impact = Math.min(100, percentile + recurringBonus + matchingBonus);
    return Math.max(0, impact);
  } catch (error) {
    console.error('[calculateDonorImpact] Error:', error);
    return 50;
  }
}

/**
 * Calculate fundraising breakdown by donor type
 * 
 * @param donors - Array of all donors
 * @returns Breakdown by donor type
 */
export function calculateFundraisingBreakdown(donors: DonorData[]): FundraisingBreakdown[] {
  try {
    const totalRaised = donors.reduce((sum, d) => sum + d.amount, 0);

    const breakdownByType = new Map<DonorType, {
      count: number;
      totalAmount: number;
    }>();

    donors.forEach(donor => {
      const existing = breakdownByType.get(donor.donorType) || {
        count: 0,
        totalAmount: 0,
      };

      existing.count++;
      existing.totalAmount += donor.amount;

      breakdownByType.set(donor.donorType, existing);
    });

    return Array.from(breakdownByType.entries()).map(([type, stats]) => ({
      donorType: type,
      count: stats.count,
      totalAmount: stats.totalAmount,
      averageAmount: stats.count > 0 ? stats.totalAmount / stats.count : 0,
      percentOfTotal: totalRaised > 0 ? (stats.totalAmount / totalRaised) * 100 : 0,
    }));
  } catch (error) {
    console.error('[calculateFundraisingBreakdown] Error:', error);
    return [];
  }
}

// ============================================================================
// DISTRICT CALCULATIONS
// ============================================================================

/**
 * Calculate district influence score
 * 
 * @param population - District population
 * @param turnoutRate - Voter turnout rate
 * @param competitiveness - District competitiveness
 * @returns Influence score (0-100)
 * 
 * @example
 * ```ts
 * const influence = calculateDistrictInfluence(500000, 65, 'Toss-up');
 * console.log(influence); // 85.0
 * ```
 */
export function calculateDistrictInfluence(
  population: number,
  turnoutRate: number,
  competitiveness: string
): number {
  try {
    // Base score from population (normalized to 0-40 range)
    const populationScore = Math.min(40, (population / 1000000) * 40);

    // Turnout contribution (0-30 range)
    const turnoutScore = Math.min(30, (turnoutRate / 100) * 30);

    // Competitiveness bonus (0-30 range)
    const competitivenessMap: Record<string, number> = {
      'Toss-up': 30,
      'Lean': 20,
      'Likely': 10,
      'Safe': 5,
    };
    const competitivenessScore = competitivenessMap[competitiveness] || 15;

    return Math.min(100, populationScore + turnoutScore + competitivenessScore);
  } catch (error) {
    console.error('[calculateDistrictInfluence] Error:', error);
    return 50;
  }
}

// ============================================================================
// VOTER OUTREACH CALCULATIONS
// ============================================================================

/**
 * Calculate voter outreach effectiveness
 * 
 * @param outreach - Voter outreach data
 * @returns Effectiveness score (0-100)
 * 
 * @example
 * ```ts
 * const effectiveness = calculateOutreachEffectiveness(outreach);
 * console.log(effectiveness); // 75.5
 * ```
 */
export function calculateOutreachEffectiveness(outreach: VoterOutreachData): number {
  try {
    // Engagement rate (0-50 points)
    const engagementRate = outreach.reach > 0 
      ? (outreach.engagement / outreach.reach) * 100 
      : 0;
    const engagementScore = Math.min(50, engagementRate / 2);

    // Conversion rate (0-50 points)
    const conversionRate = outreach.engagement > 0 
      ? (outreach.conversions / outreach.engagement) * 100 
      : 0;
    const conversionScore = Math.min(50, conversionRate * 5);

    return Math.min(100, Math.max(0, engagementScore + conversionScore));
  } catch (error) {
    console.error('[calculateOutreachEffectiveness] Error:', error);
    return 0;
  }
}

/**
 * Calculate ROI for voter outreach campaign
 * 
 * @param cost - Campaign cost
 * @param conversions - Number of conversions
 * @param valuePerConversion - Estimated value per conversion
 * @returns ROI percentage
 */
export function calculateOutreachROI(
  cost: number,
  conversions: number,
  valuePerConversion: number = 50
): number {
  try {
    if (cost <= 0) {
      return 0;
    }

    const totalValue = conversions * valuePerConversion;
    const roi = ((totalValue - cost) / cost) * 100;

    return roi;
  } catch (error) {
    console.error('[calculateOutreachROI] Error:', error);
    return 0;
  }
}

// ============================================================================
// AGGREGATE METRICS
// ============================================================================

/**
 * Calculate comprehensive politics metrics
 * 
 * @param elections - All elections
 * @param campaigns - All campaigns
 * @param bills - All bills
 * @param donors - All donors
 * @param outreach - All voter outreach activities
 * @returns Complete metrics dashboard data
 */
export function calculatePoliticsMetrics(
  elections: ElectionData[],
  campaigns: CampaignData[],
  bills: BillData[],
  donors: DonorData[],
  outreach: VoterOutreachData[]
): PoliticsMetrics {
  try {
    // Election metrics
    const scheduledElections = elections.filter(e => e.status === 'Scheduled').length;
    const activeElections = elections.filter(e => e.status === 'Active' || e.status === 'Registration Open').length;
    const completedElections = elections.filter(e => e.status === 'Completed' || e.status === 'Certified').length;

    // Campaign metrics
    const activeCampaigns = campaigns.filter(c => c.status === 'Active' || c.status === 'Announced').length;
    const suspendedCampaigns = campaigns.filter(c => c.status === 'Suspended').length;
    const completedCampaigns = campaigns.filter(c => c.status === 'Completed').length;
    const totalFundsRaised = campaigns.reduce((sum, c) => sum + c.fundsRaised, 0);
    const totalFundsSpent = campaigns.reduce((sum, c) => sum + c.fundsSpent, 0);

    const campaignsWithPolls = campaigns.filter(c => c.polls && c.polls.length > 0);
    const averagePollSupport = campaignsWithPolls.length > 0
      ? campaignsWithPolls.reduce((sum, c) => {
          const avg = c.polls.reduce((s, p) => s + p.support, 0) / c.polls.length;
          return sum + avg;
        }, 0) / campaignsWithPolls.length
      : 0;

    // Bill metrics
    const billsIntroduced = bills.filter(b => 
      b.status !== 'Drafted'
    ).length;
    const billsPassed = bills.filter(b => b.status === 'Signed').length;
    const billsFailed = bills.filter(b => b.status === 'Failed' || b.status === 'Vetoed').length;

    const billsWithVotes = bills.filter(b => b.votes && b.votes.length > 0);
    const averageBillSupport = billsWithVotes.length > 0
      ? billsWithVotes.reduce((sum, b) => sum + calculateBillSupportLevel(b.votes), 0) / billsWithVotes.length
      : 0;

    // Donor metrics
    const totalDonations = donors.reduce((sum, d) => sum + d.amount, 0);
    const averageDonation = donors.length > 0 ? totalDonations / donors.length : 0;
    const recurringDonors = donors.filter(d => d.recurring).length;

    // Outreach metrics
    const totalVoterReach = outreach.reduce((sum, o) => sum + o.reach, 0);
    const averageOutreachEffectiveness = outreach.length > 0
      ? outreach.reduce((sum, o) => sum + (o.effectiveness || 0), 0) / outreach.length
      : 0;

    // Turnout metrics
    const electionsWithResults = elections.filter(e => e.results);
    const averageTurnoutRate = electionsWithResults.length > 0
      ? electionsWithResults.reduce((sum, e) => sum + (e.results?.turnoutRate || 0), 0) / electionsWithResults.length
      : 0;

    return {
      totalElections: elections.length,
      scheduledElections,
      activeElections,
      completedElections,
      totalCampaigns: campaigns.length,
      activeCampaigns,
      suspendedCampaigns,
      completedCampaigns,
      totalFundsRaised,
      totalFundsSpent,
      averagePollSupport,
      totalBills: bills.length,
      billsIntroduced,
      billsPassed,
      billsFailed,
      averageBillSupport,
      totalDonors: donors.length,
      totalDonations,
      averageDonation,
      recurringDonors,
      averageTurnoutRate,
      totalVoterReach,
      averageOutreachEffectiveness,
    };
  } catch (error) {
    console.error('[calculatePoliticsMetrics] Error:', error);
    return {
      totalElections: 0,
      scheduledElections: 0,
      activeElections: 0,
      completedElections: 0,
      totalCampaigns: 0,
      activeCampaigns: 0,
      suspendedCampaigns: 0,
      completedCampaigns: 0,
      totalFundsRaised: 0,
      totalFundsSpent: 0,
      averagePollSupport: 0,
      totalBills: 0,
      billsIntroduced: 0,
      billsPassed: 0,
      billsFailed: 0,
      averageBillSupport: 0,
      totalDonors: 0,
      totalDonations: 0,
      averageDonation: 0,
      recurringDonors: 0,
      averageTurnoutRate: 0,
      totalVoterReach: 0,
      averageOutreachEffectiveness: 0,
    };
  }
}
