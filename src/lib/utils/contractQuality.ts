/**
 * @file src/lib/utils/contractQuality.ts
 * @description Contract quality scoring and reputation impact calculations
 * @created 2025-11-24
 *
 * OVERVIEW:
 * Quality scoring system that evaluates contract execution across multiple dimensions.
 * Calculates reputation impact, client satisfaction, and reference value based on
 * quality outcomes. Provides detailed quality breakdowns for performance analysis
 * and identifies areas for improvement.
 *
 * QUALITY DIMENSIONS:
 * 1. Skill Execution (40%): How well employee skills matched requirements
 * 2. Timeline Performance (30%): On-time delivery vs delays
 * 3. Resource Efficiency (15%): Budget adherence, resource utilization
 * 4. Client Communication (10%): Responsiveness, updates, transparency
 * 5. Innovation Factor (5%): Creative solutions, exceeding expectations
 *
 * QUALITY TIERS:
 * - Exceptional (90-100): +15 to +20 reputation, premium referrals
 * - Excellent (80-89): +10 to +14 reputation, strong referrals
 * - Good (70-79): +5 to +9 reputation, standard referrals
 * - Satisfactory (60-69): 0 to +4 reputation, neutral referrals
 * - Poor (50-59): -5 to -1 reputation, negative word of mouth
 * - Bad (40-49): -10 to -6 reputation, damaged reputation
 * - Critical (0-39): -20 to -11 reputation, severe reputation damage
 *
 * REPUTATION IMPACT FACTORS:
 * - Contract type (Government contracts have higher reputation impact)
 * - Contract value (Higher value = higher reputation stakes)
 * - Client prominence (Well-known clients amplify reputation effects)
 * - Industry visibility (Some industries more visible than others)
 * - Past performance (Consistent quality builds reputation faster)
 *
 * USAGE:
 * ```typescript
 * import { calculateDetailedQuality, calculateReputationImpact } from '@/lib/utils/contractQuality';
 *
 * // Get detailed quality breakdown
 * const quality = calculateDetailedQuality(contractData, employees);
 * console.log(`Overall: ${quality.overallScore}`);
 * console.log(`Skill: ${quality.skillScore}, Timeline: ${quality.timelineScore}`);
 *
 * // Calculate reputation impact
 * const impact = calculateReputationImpact(contractData, quality);
 * console.log(`Reputation change: ${impact.reputationDelta}`);
 * ```
 *
 * IMPLEMENTATION NOTES:
 * - Quality calculated at milestone completion and final completion
 * - Reputation updates applied immediately on contract completion
 * - Quality degradation: Late delivery, skill gaps, cost overruns
 * - Quality enhancement: Early delivery, exceptional execution, innovation
 * - Client satisfaction drives repeat business probability
 * - Reference value affects future bid competitiveness
 * - Quality metrics stored for historical analysis and trends
 */

import { calculateSkillMatch, calculateTeamMetrics } from './contractProgression';

/**
 * Contract data interface for quality calculations
 */
export interface ContractData {
  id: string;
  title: string;
  type: 'Government' | 'LongTerm' | 'ProjectBased' | 'Private' | 'Retail';
  value: number;
  industry: string;
  client: string;
  status: 'Planning' | 'Active' | 'Completed' | 'Failed' | 'Cancelled';
  requiredSkills: Array<{ skill: string; level: number; importance: number }>;
  minimumEmployees: number;
  deadline: Date;
  actualStartDate?: Date;
  startDate: Date;
  actualCompletionDate?: Date;
  daysOverdue: number;
  completionPercentage: number;
  milestones: Array<{
    id: string;
    title: string;
    deadline: Date;
    completed: boolean;
    completedDate?: Date;
  }>;
  renewalOption?: boolean;
}

/**
 * Employee data interface for quality calculations
 */
export interface EmployeeData {
  id: string;
  name: string;
  skills: Array<{ skill: string; level: number }>;
  morale: number;
  productivity: number;
  certifications: string[];
}

/**
 * Detailed quality breakdown interface
 */
export interface QualityBreakdown {
  overallScore: number;           // 1-100
  skillScore: number;             // 1-100 (40% weight)
  timelineScore: number;          // 1-100 (30% weight)
  resourceScore: number;          // 1-100 (15% weight)
  communicationScore: number;     // 1-100 (10% weight)
  innovationScore: number;        // 1-100 (5% weight)
  tier: 'Exceptional' | 'Excellent' | 'Good' | 'Satisfactory' | 'Poor' | 'Bad' | 'Critical';
  strengths: string[];            // Areas of excellence
  weaknesses: string[];           // Areas needing improvement
  recommendations: string[];      // Actionable suggestions
}

/**
 * Reputation impact calculation result
 */
export interface ReputationImpact {
  reputationDelta: number;        // -20 to +20
  clientSatisfaction: number;     // 1-100
  referenceValue: number;         // 1-100
  repeatBusinessProbability: number; // 0-100%
  industryStanding: 'Rising' | 'Stable' | 'Declining';
  impactFactors: {
    contractType: number;         // Multiplier
    contractValue: number;        // Multiplier
    clientProminence: number;     // Multiplier
    industryVisibility: number;   // Multiplier
  };
}

/**
 * Company quality trends interface
 */
export interface CompanyQualityTrends {
  averageQuality: number;
  trend: 'Improving' | 'Stable' | 'Declining';
  recentContracts: Array<{
    contractId: string;
    title: string;
    qualityScore: number;
    tier: string;
  }>;
}

/**
 * Contract quality data for storage
 */
export interface ContractQualityData {
  qualityScore: number;
  clientSatisfaction: number;
  reputationImpact: number;
  referenceValue: number;
  reviewText?: string;
  reviewDate?: Date;
}

/**
 * Validate contract data for quality calculations
 *
 * @param {ContractData} contract - Contract data
 * @returns {boolean} True if valid
 */
export function validateContractQualityData(contract: ContractData): boolean {
  if (!contract.id || !contract.title) return false;
  if (!contract.type || !['Government', 'LongTerm', 'ProjectBased', 'Private', 'Retail'].includes(contract.type)) return false;
  if (contract.value < 0) return false;
  if (!contract.industry || !contract.client) return false;
  if (!contract.status || !['Planning', 'Active', 'Completed', 'Failed', 'Cancelled'].includes(contract.status)) return false;
  if (!Array.isArray(contract.requiredSkills)) return false;
  if (contract.minimumEmployees < 1) return false;
  if (!contract.deadline || !(contract.deadline instanceof Date)) return false;
  if (!contract.startDate || !(contract.startDate instanceof Date)) return false;
  if (typeof contract.daysOverdue !== 'number') return false;
  if (contract.completionPercentage < 0 || contract.completionPercentage > 100) return false;
  if (!Array.isArray(contract.milestones)) return false;

  return true;
}

/**
 * Validate employee data for quality calculations
 *
 * @param {EmployeeData[]} employees - Employee data array
 * @returns {boolean} True if valid
 */
export function validateEmployeeQualityData(employees: EmployeeData[]): boolean {
  if (!Array.isArray(employees)) return false;

  for (const employee of employees) {
    if (!employee.id || !employee.name) return false;
    if (!Array.isArray(employee.skills)) return false;
    if (employee.morale < 0 || employee.morale > 100) return false;
    if (employee.productivity < 0 || employee.productivity > 100) return false;
    if (!Array.isArray(employee.certifications)) return false;
  }

  return true;
}

/**
 * Calculate detailed quality breakdown
 *
 * @param {ContractData} contract - Contract data
 * @param {EmployeeData[]} employees - Assigned employees
 * @returns {QualityBreakdown} Quality breakdown
 */
export function calculateDetailedQuality(
  contract: ContractData,
  employees: EmployeeData[]
): QualityBreakdown {
  // Input validation
  if (!validateContractQualityData(contract)) {
    throw new Error('Invalid contract data provided');
  }
  if (!validateEmployeeQualityData(employees)) {
    throw new Error('Invalid employee data provided');
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  // 1. SKILL EXECUTION SCORE (40% weight)
  // Convert requiredSkills array to Record format expected by calculateSkillMatch
  const requiredSkillsRecord: Record<string, number> = {};
  contract.requiredSkills.forEach(req => {
    requiredSkillsRecord[req.skill] = req.level;
  });

  const skillMatch = calculateSkillMatch(employees, requiredSkillsRecord);
  const skillScore = Math.round(skillMatch.matchPercentage);

  if (skillScore >= 90) {
    strengths.push('Exceptional skill match - team highly qualified');
  } else if (skillScore < 70) {
    weaknesses.push('Skill gaps detected - team underqualified for requirements');
    recommendations.push('Invest in training or hire specialists for identified skill gaps');
  }

  // 2. TIMELINE PERFORMANCE SCORE (30% weight)
  let timelineScore = 100;

  if (contract.status === 'Completed' || contract.status === 'Failed') {
    const daysOverdue = contract.daysOverdue;

    if (daysOverdue > 0) {
      // Late delivery penalty
      timelineScore = Math.max(40, 100 - (daysOverdue * 5)); // -5 points per day late
      weaknesses.push(`Delivered ${daysOverdue} days late`);
      recommendations.push('Improve project planning and resource allocation');
    } else if (daysOverdue < 0) {
      // Early delivery bonus
      const daysEarly = Math.abs(daysOverdue);
      timelineScore = Math.min(110, 100 + (daysEarly * 2)); // +2 points per day early
      strengths.push(`Delivered ${daysEarly} days early`);
    } else {
      strengths.push('Delivered exactly on time');
    }
  } else {
    // In progress - calculate expected vs actual progress
    const now = new Date();
    const deadline = new Date(contract.deadline);
    const started = new Date(contract.actualStartDate || contract.startDate);
    const totalDuration = deadline.getTime() - started.getTime();
    const elapsed = now.getTime() - started.getTime();
    const progressExpected = Math.min(100, (elapsed / totalDuration) * 100);
    const progressActual = contract.completionPercentage;

    if (progressActual >= progressExpected) {
      timelineScore = 100;
      if (progressActual > progressExpected + 10) {
        strengths.push('Ahead of schedule');
      }
    } else {
      const lag = progressExpected - progressActual;
      timelineScore = Math.max(60, 100 - (lag * 1.5));

      if (lag > 10) {
        weaknesses.push(`Behind schedule by ${Math.round(lag)}%`);
        recommendations.push('Allocate additional resources or adjust timeline expectations');
      }
    }
  }

  // 3. RESOURCE EFFICIENCY SCORE (15% weight)
  const teamMetrics = calculateTeamMetrics(employees);

  let resourceScore = 100;

  // Team size efficiency
  const teamSizeRatio = employees.length / contract.minimumEmployees;
  if (teamSizeRatio < 1.0) {
    resourceScore -= 20; // Understaffed penalty
    weaknesses.push('Team understaffed for project requirements');
  } else if (teamSizeRatio > 2.0) {
    resourceScore -= 10; // Overstaffed inefficiency
    weaknesses.push('Team potentially overstaffed - resource inefficiency');
  } else if (teamSizeRatio >= 1.0 && teamSizeRatio <= 1.5) {
    strengths.push('Optimal team size for project requirements');
  }

  // Morale efficiency
  if (teamMetrics.averageMorale < 60) {
    resourceScore -= 15;
    weaknesses.push('Low team morale affecting performance');
    recommendations.push('Address team morale issues (bonuses, recognition, work environment)');
  } else if (teamMetrics.averageMorale >= 80) {
    strengths.push('High team morale driving productivity');
  }

  // Productivity efficiency
  if (teamMetrics.averageProductivity < 60) {
    resourceScore -= 10;
    weaknesses.push('Below-average team productivity');
  } else if (teamMetrics.averageProductivity >= 80) {
    strengths.push('High team productivity');
  }

  resourceScore = Math.max(40, Math.min(110, resourceScore));

  // 4. CLIENT COMMUNICATION SCORE (10% weight)
  // Simplified - based on milestone completion consistency and quality updates
  let communicationScore = 75; // Default baseline

  if (contract.milestones.length > 0) {
    const completedMilestones = contract.milestones.filter((m) => m.completed);
    const onTimeMilestones = completedMilestones.filter((m) => {
      if (!m.completedDate) return false;
      return new Date(m.completedDate) <= new Date(m.deadline);
    });

    const onTimeRatio = completedMilestones.length > 0
      ? onTimeMilestones.length / completedMilestones.length
      : 1.0;

    communicationScore = 50 + (onTimeRatio * 50); // 50-100 range

    if (onTimeRatio === 1.0 && completedMilestones.length > 0) {
      strengths.push('All milestones completed on schedule');
    } else if (onTimeRatio < 0.5) {
      weaknesses.push('Frequent milestone delays');
      recommendations.push('Improve milestone tracking and client communication');
    }
  }

  // 5. INNOVATION FACTOR SCORE (5% weight)
  let innovationScore = 70; // Default baseline

  // Innovation indicators
  if (teamMetrics.certificationCount >= employees.length) {
    innovationScore += 10;
    strengths.push('Highly certified team bringing specialized expertise');
  }

  if (teamMetrics.synergyBonus >= 15) {
    innovationScore += 10;
    strengths.push('Strong team synergy enabling innovative solutions');
  }

  if (skillMatch.skillExcess.length > 0) {
    innovationScore += 10;
    strengths.push('Team expertise exceeds requirements - potential for innovation');
  }

  innovationScore = Math.min(100, innovationScore);

  // CALCULATE OVERALL SCORE (weighted average)
  const overallScore = Math.round(
    (skillScore * 0.40) +
    (timelineScore * 0.30) +
    (resourceScore * 0.15) +
    (communicationScore * 0.10) +
    (innovationScore * 0.05)
  );

  // Determine quality tier
  let tier: QualityBreakdown['tier'];
  if (overallScore >= 90) tier = 'Exceptional';
  else if (overallScore >= 80) tier = 'Excellent';
  else if (overallScore >= 70) tier = 'Good';
  else if (overallScore >= 60) tier = 'Satisfactory';
  else if (overallScore >= 50) tier = 'Poor';
  else if (overallScore >= 40) tier = 'Bad';
  else tier = 'Critical';

  // Add tier-specific recommendations
  if (tier === 'Critical' || tier === 'Bad') {
    recommendations.push('URGENT: Conduct post-mortem analysis and implement corrective measures');
  } else if (tier === 'Poor') {
    recommendations.push('Review processes and identify root causes of performance issues');
  } else if (tier === 'Exceptional') {
    recommendations.push('Document best practices and share with other teams');
  }

  return {
    overallScore,
    skillScore,
    timelineScore,
    resourceScore,
    communicationScore,
    innovationScore,
    tier,
    strengths,
    weaknesses,
    recommendations,
  };
}

/**
 * Calculate reputation impact from contract performance
 *
 * @param {ContractData} contract - Contract data
 * @param {QualityBreakdown} quality - Quality breakdown
 * @returns {ReputationImpact} Reputation impact analysis
 */
export function calculateReputationImpact(
  contract: ContractData,
  quality: QualityBreakdown
): ReputationImpact {
  // Input validation
  if (!validateContractQualityData(contract)) {
    throw new Error('Invalid contract data provided');
  }

  // Base reputation delta based on quality tier
  let baseReputation = 0;
  if (quality.tier === 'Exceptional') baseReputation = 18;
  else if (quality.tier === 'Excellent') baseReputation = 12;
  else if (quality.tier === 'Good') baseReputation = 7;
  else if (quality.tier === 'Satisfactory') baseReputation = 2;
  else if (quality.tier === 'Poor') baseReputation = -3;
  else if (quality.tier === 'Bad') baseReputation = -8;
  else if (quality.tier === 'Critical') baseReputation = -15;

  // Contract type multiplier
  const contractTypeMultipliers: Record<string, number> = {
    Government: 1.5,    // Higher visibility, higher impact
    LongTerm: 1.3,      // Sustained relationship
    ProjectBased: 1.2,  // Performance-based reputation
    Private: 1.0,       // Standard impact
    Retail: 0.8,        // Lower individual impact (volume play)
  };
  const contractTypeMultiplier = contractTypeMultipliers[contract.type] || 1.0;

  // Contract value multiplier (higher stakes = higher impact)
  let contractValueMultiplier = 1.0;
  if (contract.value >= 5000000) contractValueMultiplier = 1.4;
  else if (contract.value >= 1000000) contractValueMultiplier = 1.2;
  else if (contract.value >= 500000) contractValueMultiplier = 1.1;
  else if (contract.value < 100000) contractValueMultiplier = 0.9;

  // Client prominence (simplified - could be expanded)
  const clientProminenceMultiplier = contract.client.toLowerCase().includes('department')
    ? 1.3 // Government departments
    : 1.0;

  // Industry visibility (simplified)
  const highVisibilityIndustries = ['Technology', 'Healthcare', 'Finance', 'Energy'];
  const industryVisibilityMultiplier = highVisibilityIndustries.includes(contract.industry)
    ? 1.2
    : 1.0;

  // Calculate final reputation delta
  const reputationDelta = Math.round(
    baseReputation *
    contractTypeMultiplier *
    contractValueMultiplier *
    clientProminenceMultiplier *
    industryVisibilityMultiplier
  );

  // Clamp to -20 to +20 range
  const clampedDelta = Math.max(-20, Math.min(20, reputationDelta));

  // Calculate client satisfaction (1-100)
  const clientSatisfaction = Math.max(1, Math.min(100,
    quality.overallScore - (contract.daysOverdue > 0 ? contract.daysOverdue * 2 : 0)
  ));

  // Calculate reference value (1-100)
  const referenceValue = Math.max(1, Math.min(100,
    (quality.overallScore * 0.6) + (clientSatisfaction * 0.4)
  ));

  // Calculate repeat business probability (0-100%)
  let repeatBusinessProbability = 0;
  if (quality.tier === 'Exceptional') repeatBusinessProbability = 90;
  else if (quality.tier === 'Excellent') repeatBusinessProbability = 75;
  else if (quality.tier === 'Good') repeatBusinessProbability = 55;
  else if (quality.tier === 'Satisfactory') repeatBusinessProbability = 30;
  else if (quality.tier === 'Poor') repeatBusinessProbability = 10;
  else repeatBusinessProbability = 5;

  // Adjust for contract type
  if (contract.type === 'LongTerm' && contract.renewalOption) {
    repeatBusinessProbability += 20; // Long-term contracts more likely to renew
  }

  repeatBusinessProbability = Math.min(95, repeatBusinessProbability);

  // Determine industry standing trend
  let industryStanding: 'Rising' | 'Stable' | 'Declining';
  if (clampedDelta >= 10) industryStanding = 'Rising';
  else if (clampedDelta <= -5) industryStanding = 'Declining';
  else industryStanding = 'Stable';

  return {
    reputationDelta: clampedDelta,
    clientSatisfaction,
    referenceValue,
    repeatBusinessProbability,
    industryStanding,
    impactFactors: {
      contractType: contractTypeMultiplier,
      contractValue: contractValueMultiplier,
      clientProminence: clientProminenceMultiplier,
      industryVisibility: industryVisibilityMultiplier,
    },
  };
}

/**
 * Generate contract quality data for storage
 *
 * @param {ContractData} contract - Contract data
 * @param {EmployeeData[]} employees - Assigned employees
 * @returns {ContractQualityData} Quality data for storage
 */
export function generateContractQualityData(
  contract: ContractData,
  employees: EmployeeData[]
): ContractQualityData {
  const quality = calculateDetailedQuality(contract, employees);
  const impact = calculateReputationImpact(contract, quality);

  // Generate review text based on quality
  const reviewTemplates: Record<string, string> = {
    Exceptional: `Outstanding work! ${quality.strengths[0] || 'Exceeded all expectations'}. Highly recommended.`,
    Excellent: `Excellent performance. ${quality.strengths[0] || 'Met all requirements with high quality'}. Would hire again.`,
    Good: `Good work overall. ${quality.strengths[0] || 'Delivered as promised'}. Satisfied with results.`,
    Satisfactory: `Acceptable performance. Project completed but ${quality.weaknesses[0] || 'some areas could improve'}.`,
    Poor: `Below expectations. ${quality.weaknesses[0] || 'Multiple issues encountered'}. Not recommended.`,
    Bad: `Very disappointing. ${quality.weaknesses[0] || 'Failed to meet basic requirements'}. Would not hire again.`,
    Critical: `Critical failure. ${quality.weaknesses[0] || 'Major problems throughout project'}. Avoid at all costs.`,
  };

  return {
    qualityScore: quality.overallScore,
    clientSatisfaction: impact.clientSatisfaction,
    reputationImpact: impact.reputationDelta,
    referenceValue: impact.referenceValue,
    reviewText: reviewTemplates[quality.tier],
    reviewDate: new Date(),
  };
}

/**
 * Calculate company quality trends from contract history
 *
 * @param {Array<{contract: ContractData, quality: ContractQualityData}>} contractHistory - Contract history with quality data
 * @returns {CompanyQualityTrends} Quality trends analysis
 */
export function calculateCompanyQualityTrends(
  contractHistory: Array<{contract: ContractData, quality: ContractQualityData}>
): CompanyQualityTrends {
  if (contractHistory.length === 0) {
    return {
      averageQuality: 75,
      trend: 'Stable',
      recentContracts: [],
    };
  }

  // Sort by completion date (most recent first)
  const sortedHistory = contractHistory.sort((a, b) => {
    const dateA = a.contract.actualCompletionDate || new Date();
    const dateB = b.contract.actualCompletionDate || new Date();
    return dateB.getTime() - dateA.getTime();
  });

  const totalQuality = sortedHistory.reduce((sum, item) => sum + item.quality.qualityScore, 0);
  const averageQuality = Math.round(totalQuality / sortedHistory.length);

  // Determine trend (compare first half vs second half)
  const midpoint = Math.floor(sortedHistory.length / 2);
  const recentHalf = sortedHistory.slice(0, midpoint);
  const olderHalf = sortedHistory.slice(midpoint);

  const recentAvg = recentHalf.length > 0
    ? recentHalf.reduce((sum, item) => sum + item.quality.qualityScore, 0) / recentHalf.length
    : averageQuality;

  const olderAvg = olderHalf.length > 0
    ? olderHalf.reduce((sum, item) => sum + item.quality.qualityScore, 0) / olderHalf.length
    : averageQuality;

  let trend: 'Improving' | 'Stable' | 'Declining';
  const difference = recentAvg - olderAvg;

  if (difference >= 5) trend = 'Improving';
  else if (difference <= -5) trend = 'Declining';
  else trend = 'Stable';

  const recentContracts = sortedHistory.slice(0, 10).map((item) => ({
    contractId: item.contract.id,
    title: item.contract.title,
    qualityScore: item.quality.qualityScore,
    tier: item.quality.qualityScore >= 90 ? 'Exceptional' :
          item.quality.qualityScore >= 80 ? 'Excellent' :
          item.quality.qualityScore >= 70 ? 'Good' :
          item.quality.qualityScore >= 60 ? 'Satisfactory' : 'Poor',
  }));

  return {
    averageQuality,
    trend,
    recentContracts,
  };
}

/**
 * Get contract quality summary
 *
 * @param {ContractData} contract - Contract data
 * @param {EmployeeData[]} employees - Assigned employees
 * @returns {object} Quality summary
 */
export function getContractQualitySummary(
  contract: ContractData,
  employees: EmployeeData[]
): {
  contractId: string;
  title: string;
  quality: QualityBreakdown;
  reputationImpact: ReputationImpact;
  recommendations: string[];
} {
  const quality = calculateDetailedQuality(contract, employees);
  const reputationImpact = calculateReputationImpact(contract, quality);

  return {
    contractId: contract.id,
    title: contract.title,
    quality,
    reputationImpact,
    recommendations: quality.recommendations,
  };
}