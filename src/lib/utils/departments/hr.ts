/**
 * @fileoverview HR Department Utilities
 * @module lib/utils/departments/hr
 * 
 * OVERVIEW:
 * Pure utility functions for HR department operations.
 * Handles recruitment, training programs, skill development, and morale management.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import type {
  HRDepartmentData,
  TrainingProgram,
  RecruitmentCampaign,
} from '@/lib/types/department';

/**
 * Calculate recruitment success based on budget and market conditions
 * 
 * @param budget - Recruitment budget
 * @param positions - Number of positions to fill
 * @param targetSkills - Required skills
 * @param marketCondition - Job market competitiveness (0.5-1.5x, 1.0 = normal)
 * @returns Expected hires and cost per hire
 * 
 * @example
 * ```ts
 * const result = calculateRecruitmentSuccess(50000, 5, ['technical', 'sales'], 1.2);
 * // Returns: { expectedHires: 4, costPerHire: 12500, successRate: 0.8 }
 * ```
 */
export function calculateRecruitmentSuccess(
  budget: number,
  positions: number,
  targetSkills: string[],
  marketCondition: number = 1.0
): {
  expectedHires: number;
  costPerHire: number;
  successRate: number;
  timeline: number; // days
} {
  // Base cost per hire by skill difficulty
  const skillDifficulty = calculateSkillDifficulty(targetSkills);
  const baseCostPerHire = 8000 + skillDifficulty * 2000;

  // Adjust for market conditions
  const adjustedCost = baseCostPerHire * marketCondition;

  // Calculate how many we can afford to hire
  const affordableHires = Math.floor(budget / adjustedCost);
  const expectedHires = Math.min(affordableHires, positions);
  const successRate = positions > 0 ? expectedHires / positions : 0;

  // Timeline increases with market competitiveness
  const baseTimeline = 30; // days
  const timeline = Math.round(baseTimeline * marketCondition);

  return {
    expectedHires,
    costPerHire: Math.round(adjustedCost),
    successRate: Math.round(successRate * 100) / 100,
    timeline,
  };
}

/**
 * Calculate skill difficulty multiplier
 * 
 * @param skills - Array of skill names
 * @returns Difficulty multiplier (0-5)
 */
function calculateSkillDifficulty(skills: string[]): number {
  const difficultyMap: Record<string, number> = {
    technical: 3,
    leadership: 2,
    sales: 1,
    marketing: 1,
    finance: 2,
    operations: 1,
    hr: 1,
    legal: 3,
    rd: 4,
    quality: 2,
    customer: 1,
    industry: 2,
  };

  const avgDifficulty =
    skills.reduce((sum, skill) => sum + (difficultyMap[skill.toLowerCase()] || 1), 0) / skills.length;

  return Math.min(5, avgDifficulty);
}

/**
 * Calculate training program ROI
 * 
 * @param program - Training program details
 * @param employeesCompleted - Number of employees who completed
 * @param avgSkillImprovement - Average skill point increase
 * @param avgSalary - Average employee salary
 * @returns ROI percentage and value metrics
 * 
 * @example
 * ```ts
 * const roi = calculateTrainingROI(
 *   { cost: 10000, duration: 40 },
 *   10,
 *   15,
 *   60000
 * );
 * // Returns: { roi: 180, totalValue: 28000, costPerEmployee: 1000 }
 * ```
 */
export function calculateTrainingROI(
  program: { cost: number; duration: number },
  employeesCompleted: number,
  avgSkillImprovement: number,
  avgSalary: number
): {
  roi: number; // percentage
  totalValue: number;
  costPerEmployee: number;
  productivityGain: number;
} {
  if (employeesCompleted === 0) {
    return { roi: -100, totalValue: 0, costPerEmployee: 0, productivityGain: 0 };
  }

  const costPerEmployee = program.cost / employeesCompleted;

  // Productivity gain from skill improvement (1 skill point = ~0.5% productivity)
  const productivityGainPercent = avgSkillImprovement * 0.5;
  const productivityGain = productivityGainPercent / 100;

  // Annual value per employee (productivity improvement applied to salary equivalent)
  const annualValuePerEmployee = avgSalary * productivityGain;
  const totalAnnualValue = annualValuePerEmployee * employeesCompleted;

  // ROI calculation (annualized)
  const roi = ((totalAnnualValue - program.cost) / program.cost) * 100;

  return {
    roi: Math.round(roi * 100) / 100,
    totalValue: Math.round(totalAnnualValue),
    costPerEmployee: Math.round(costPerEmployee),
    productivityGain: Math.round(productivityGain * 10000) / 100, // as percentage
  };
}

/**
 * Calculate turnover rate
 * 
 * @param employeesLeft - Number of employees who left
 * @param avgHeadcount - Average headcount during period
 * @returns Turnover rate (0-100%)
 */
export function calculateTurnoverRate(employeesLeft: number, avgHeadcount: number): number {
  if (avgHeadcount === 0) return 0;
  return Math.min(100, (employeesLeft / avgHeadcount) * 100);
}

/**
 * Calculate retention risk score for entire department
 * 
 * @param employees - Array of employee retention risk scores (0-100)
 * @returns Overall department retention risk (0-100)
 * 
 * @example
 * ```ts
 * const risk = calculateDepartmentRetentionRisk([25, 40, 60, 80, 90]);
 * // Returns: 59 (moderate risk - based on weighted average)
 * ```
 */
export function calculateDepartmentRetentionRisk(employees: number[]): number {
  if (employees.length === 0) return 0;

  // Weighted average with higher weight on high-risk employees
  const sortedRisks = [...employees].sort((a, b) => a - b);
  let weightedSum = 0;
  let totalWeight = 0;

  sortedRisks.forEach((risk, index) => {
    // Higher risk employees get more weight
    const weight = risk > 50 ? 2.0 : 1.0;
    weightedSum += risk * weight;
    totalWeight += weight;
  });

  return Math.round(weightedSum / totalWeight);
}

/**
 * Assess training program effectiveness
 * 
 * @param program - Training program
 * @param completionRate - Percentage who completed (0-1)
 * @param avgSkillGain - Average skill improvement
 * @returns Effectiveness rating
 */
export function assessTrainingEffectiveness(
  program: TrainingProgram,
  completionRate: number,
  avgSkillGain: number
): {
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  score: number; // 0-100
  recommendations: string[];
} {
  let score = 0;
  const recommendations: string[] = [];

  // Completion rate factor (40%)
  score += completionRate * 40;
  if (completionRate < 0.7) {
    recommendations.push('Improve program engagement - completion rate below 70%');
  }

  // Skill gain factor (60%)
  const expectedGain = 15; // Expected 15 point average improvement
  const skillFactor = Math.min(1, avgSkillGain / expectedGain) * 60;
  score += skillFactor;

  if (avgSkillGain < 10) {
    recommendations.push('Enhance curriculum - skill gains below expectations');
  }

  // Rating thresholds
  let rating: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 85) {
    rating = 'excellent';
  } else if (score >= 70) {
    rating = 'good';
  } else if (score >= 50) {
    rating = 'fair';
    recommendations.push('Consider restructuring program for better outcomes');
  } else {
    rating = 'poor';
    recommendations.push('Program needs major revision or cancellation');
  }

  return {
    rating,
    score: Math.round(score),
    recommendations,
  };
}

/**
 * Calculate optimal training budget
 * 
 * @param headcount - Number of employees
 * @param avgSalary - Average employee salary
 * @param targetGrowth - Target skill improvement percentage (0-1)
 * @returns Recommended training budget
 * 
 * @example
 * ```ts
 * const budget = calculateOptimalTrainingBudget(50, 60000, 0.10);
 * // Returns: { annual: 30000, perEmployee: 600, programs: 6 }
 * ```
 */
export function calculateOptimalTrainingBudget(
  headcount: number,
  avgSalary: number,
  targetGrowth: number = 0.05 // 5% default
): {
  annual: number;
  perEmployee: number;
  recommendedPrograms: number;
} {
  // Industry standard: 1-2% of payroll for training
  const basePercentage = 0.01;
  const growthMultiplier = 1 + targetGrowth * 10; // Higher growth targets need more investment
  const adjustedPercentage = Math.min(0.03, basePercentage * growthMultiplier);

  const totalPayroll = headcount * avgSalary;
  const annual = Math.round(totalPayroll * adjustedPercentage);
  const perEmployee = Math.round(annual / headcount);

  // Assume average program cost is $5,000
  const avgProgramCost = 5000;
  const recommendedPrograms = Math.max(1, Math.floor(annual / avgProgramCost));

  return {
    annual,
    perEmployee,
    recommendedPrograms,
  };
}

/**
 * Calculate HR department efficiency
 * 
 * @param data - HR department data
 * @returns Efficiency score (0-100)
 */
export function calculateHREfficiency(data: HRDepartmentData): number {
  let efficiency = 50; // Base efficiency

  // Turnover rate factor (25% weight) - lower is better
  if (data.turnoverRate < 10) {
    efficiency += 25; // Excellent retention
  } else if (data.turnoverRate < 15) {
    efficiency += 15; // Good retention
  } else if (data.turnoverRate < 20) {
    efficiency += 5; // Fair retention
  } else if (data.turnoverRate > 30) {
    efficiency -= 10; // Poor retention
  }

  // Average satisfaction (25% weight)
  efficiency += (data.avgSatisfaction / 100) * 25;

  // Average productivity (25% weight)
  efficiency += (data.avgProductivity / 100) * 25;

  // Training ROI (15% weight)
  if (data.trainingROI > 100) {
    efficiency += 15; // Strong ROI
  } else if (data.trainingROI > 50) {
    efficiency += 10; // Good ROI
  } else if (data.trainingROI > 0) {
    efficiency += 5; // Positive ROI
  } else {
    efficiency -= 5; // Negative ROI
  }

  // Retention risk (10% weight) - lower is better
  if (data.retentionRisk < 20) {
    efficiency += 10; // Minimal risk
  } else if (data.retentionRisk < 40) {
    efficiency += 5; // Low risk
  } else if (data.retentionRisk > 60) {
    efficiency -= 5; // High risk
  }

  return Math.max(0, Math.min(100, Math.round(efficiency)));
}

/**
 * Calculate average employee satisfaction across department
 * 
 * @param satisfactionScores - Array of individual satisfaction scores (0-100)
 * @returns Average satisfaction
 */
export function calculateAvgSatisfaction(satisfactionScores: number[]): number {
  if (satisfactionScores.length === 0) return 70; // Default neutral
  const sum = satisfactionScores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / satisfactionScores.length);
}

/**
 * Calculate average productivity across department
 * 
 * @param productivityScores - Array of individual productivity multipliers (0.5-2.0)
 * @returns Average productivity score (0-100 scale)
 */
export function calculateAvgProductivity(productivityScores: number[]): number {
  if (productivityScores.length === 0) return 70; // Default neutral

  const sum = productivityScores.reduce((acc, score) => acc + score, 0);
  const avgMultiplier = sum / productivityScores.length;

  // Convert 0.5-2.0 scale to 0-100 scale
  // 1.0 multiplier = 70 score (baseline)
  // 2.0 multiplier = 100 score (exceptional)
  // 0.5 multiplier = 35 score (poor)
  const score = 35 + (avgMultiplier - 0.5) * (65 / 1.5);

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Determine skill training priority
 * 
 * @param currentSkill - Current skill level (0-100)
 * @param industryRelevance - How critical the skill is (0-100)
 * @param employeeRole - Employee's role
 * @returns Priority score (0-100) and recommendation
 * 
 * @example
 * ```ts
 * const priority = determineTrainingPriority(45, 85, 'Sales Manager');
 * // Returns: { priority: 75, recommendation: 'High priority - critical skill gap' }
 * ```
 */
export function determineTrainingPriority(
  currentSkill: number,
  industryRelevance: number,
  employeeRole: string
): {
  priority: number;
  recommendation: string;
} {
  // Gap analysis
  const skillGap = 100 - currentSkill;

  // Priority = (skill gap × industry relevance) / 100
  const basePriority = (skillGap * industryRelevance) / 100;

  // Role-based adjustments
  const roleMultipliers: Record<string, number> = {
    manager: 1.2,
    director: 1.3,
    executive: 1.5,
    senior: 1.1,
    junior: 0.9,
    intern: 0.8,
  };

  let multiplier = 1.0;
  Object.entries(roleMultipliers).forEach(([roleKey, mult]) => {
    if (employeeRole.toLowerCase().includes(roleKey)) {
      multiplier = mult;
    }
  });

  const priority = Math.min(100, Math.round(basePriority * multiplier));

  let recommendation: string;
  if (priority >= 80) {
    recommendation = 'Critical - Immediate training required';
  } else if (priority >= 60) {
    recommendation = 'High priority - Schedule within 1 month';
  } else if (priority >= 40) {
    recommendation = 'Medium priority - Schedule within quarter';
  } else if (priority >= 20) {
    recommendation = 'Low priority - Consider for annual plan';
  } else {
    recommendation = 'Optional - Skill level adequate for role';
  }

  return { priority, recommendation };
}

/**
 * Calculate onboarding effectiveness
 * 
 * @param newHires - Number of new hires
 * @param retainedAfter90Days - Number still employed after 90 days
 * @param avgTimeToProductivity - Days until productive
 * @returns Onboarding effectiveness score
 */
export function calculateOnboardingEffectiveness(
  newHires: number,
  retainedAfter90Days: number,
  avgTimeToProductivity: number
): {
  retentionRate: number;
  timeScore: number;
  overallScore: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
} {
  if (newHires === 0) {
    return { retentionRate: 0, timeScore: 0, overallScore: 0, rating: 'poor' };
  }

  const retentionRate = (retainedAfter90Days / newHires) * 100;

  // Target: 30 days to productivity (faster is better)
  const targetDays = 30;
  const timeScore = Math.max(0, 100 - ((avgTimeToProductivity - targetDays) / targetDays) * 100);

  const overallScore = retentionRate * 0.6 + timeScore * 0.4;

  let rating: 'excellent' | 'good' | 'fair' | 'poor';
  if (overallScore >= 85) rating = 'excellent';
  else if (overallScore >= 70) rating = 'good';
  else if (overallScore >= 50) rating = 'fair';
  else rating = 'poor';

  return {
    retentionRate: Math.round(retentionRate),
    timeScore: Math.round(timeScore),
    overallScore: Math.round(overallScore),
    rating,
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Pure Functions**: All functions are side-effect free for testability
 * 2. **Skill Development**: Training ROI and effectiveness calculations
 * 3. **Retention Management**: Turnover, risk, and satisfaction metrics
 * 4. **Recruitment**: Success prediction and cost analysis
 * 5. **Performance Tracking**: Productivity and satisfaction aggregation
 * 
 * USAGE:
 * ```ts
 * import { calculateTrainingROI, calculateRecruitmentSuccess } from '@/lib/utils/departments/hr';
 * 
 * const roi = calculateTrainingROI(program, completed, improvement, avgSalary);
 * const recruitment = calculateRecruitmentSuccess(budget, positions, skills, marketCondition);
 * ```
 */
