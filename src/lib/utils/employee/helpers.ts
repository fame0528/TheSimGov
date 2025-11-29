/**
 * @file src/lib/utils/employee/helpers.ts
 * @description Employee status, label, and calculation helper functions
 * @created 2025-11-29
 * @author ECHO v1.3.1
 *
 * OVERVIEW:
 * Helper functions for employee data transformation and calculations.
 * Converts numeric metrics to human-readable labels, calculates derived metrics,
 * and provides status descriptions for UI display.
 *
 * CATEGORIES:
 * - Status labels (employment status descriptions)
 * - Morale labels (happiness descriptors)
 * - Retention risk labels (turnover probability descriptions)
 * - Performance labels (rating descriptors)
 * - Skill categorization (competency levels)
 * - Experience level mapping (years to level)
 * - Market value calculations (skill-based salary estimation)
 */

import type { EmployeeSkills } from '@/lib/db/models/Employee';

/**
 * Utility: clamp a number between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get human-readable label for employment status
 *
 * @param status - Employment status code
 * @returns Descriptive label for UI display
 *
 * @example
 * ```typescript
 * getStatusLabel('active') // 'Active - Working'
 * getStatusLabel('training') // 'In Training'
 * getStatusLabel('onLeave') // 'On Leave'
 * getStatusLabel('terminated') // 'Terminated'
 * ```
 */
export function getStatusLabel(status: 'active' | 'training' | 'onLeave' | 'terminated'): string {
  switch (status) {
    case 'active':
      return 'Active - Working';
    case 'training':
      return 'In Training';
    case 'onLeave':
      return 'On Leave';
    case 'terminated':
      return 'Terminated';
    default:
      return 'Unknown';
  }
}

/**
 * Get human-readable label for morale level (0-100)
 * Describes employee happiness and engagement
 *
 * @param morale - Morale score (0-100)
 * @returns Descriptive label
 *
 * @example
 * ```typescript
 * getMoraleLabel(90) // 'Excellent - Highly Engaged'
 * getMoraleLabel(75) // 'Good - Positive Attitude'
 * getMoraleLabel(50) // 'Neutral - Average Mood'
 * getMoraleLabel(25) // 'Poor - Disengaged'
 * getMoraleLabel(10) // 'Critical - Risk of Departure'
 * ```
 */
export function getMoraleLabel(morale: number): string {
  if (morale >= 85) return 'Excellent - Highly Engaged';
  if (morale >= 75) return 'Good - Positive Attitude';
  if (morale >= 65) return 'Satisfactory - Content';
  if (morale >= 50) return 'Neutral - Average Mood';
  if (morale >= 35) return 'Poor - Disengaged';
  if (morale >= 20) return 'Critical - Risk of Departure';
  return 'Severe - Likely to Leave';
}

/**
 * Get human-readable label for retention risk (0-100)
 * Describes probability employee will leave company
 *
 * @param risk - Retention risk score (0-100)
 * @returns Descriptive label with severity
 *
 * @example
 * ```typescript
 * getRetentionRiskLabel(10) // 'Minimal Risk - Loyal Employee'
 * getRetentionRiskLabel(35) // 'Low Risk - Generally Satisfied'
 * getRetentionRiskLabel(55) // 'Moderate Risk - Monitor Closely'
 * getRetentionRiskLabel(75) // 'High Risk - Intervention Needed'
 * getRetentionRiskLabel(90) // 'Critical Risk - Likely to Quit Soon'
 * ```
 */
export function getRetentionRiskLabel(risk: number): string {
  if (risk >= 85) return 'Critical Risk - Likely to Quit Soon';
  if (risk >= 70) return 'High Risk - Intervention Needed';
  if (risk >= 50) return 'Moderate Risk - Monitor Closely';
  if (risk >= 30) return 'Low Risk - Generally Satisfied';
  return 'Minimal Risk - Loyal Employee';
}

/**
 * Get human-readable label for performance rating (1-5)
 * Describes job performance level
 *
 * @param rating - Performance rating (1-5)
 * @returns Descriptive label
 *
 * @example
 * ```typescript
 * getPerformanceLabel(5) // 'Exceptional - Far Exceeds Expectations'
 * getPerformanceLabel(4) // 'Excellent - Exceeds Expectations'
 * getPerformanceLabel(3) // 'Satisfactory - Meets Expectations'
 * getPerformanceLabel(2) // 'Needs Improvement - Below Expectations'
 * getPerformanceLabel(1) // 'Unsatisfactory - Far Below Expectations'
 * ```
 */
export function getPerformanceLabel(rating: number): string {
  const rounded = Math.round(rating);

  switch (rounded) {
    case 5:
      return 'Exceptional - Far Exceeds Expectations';
    case 4:
      return 'Excellent - Exceeds Expectations';
    case 3:
      return 'Satisfactory - Meets Expectations';
    case 2:
      return 'Needs Improvement - Below Expectations';
    case 1:
      return 'Unsatisfactory - Far Below Expectations';
    default:
      return 'Not Rated';
  }
}

/**
 * Get satisfaction level label (0-100)
 * Describes job satisfaction and happiness
 *
 * @param satisfaction - Satisfaction score (0-100)
 * @returns Descriptive label
 *
 * @example
 * ```typescript
 * getSatisfactionLabel(90) // 'Very High - Deeply Satisfied'
 * getSatisfactionLabel(70) // 'High - Satisfied'
 * getSatisfactionLabel(50) // 'Moderate - Neutral'
 * getSatisfactionLabel(30) // 'Low - Dissatisfied'
 * getSatisfactionLabel(10) // 'Very Low - Seeking Alternative'
 * ```
 */
export function getSatisfactionLabel(satisfaction: number): string {
  if (satisfaction >= 85) return 'Very High - Deeply Satisfied';
  if (satisfaction >= 75) return 'High - Satisfied';
  if (satisfaction >= 60) return 'Moderate-High - Generally Satisfied';
  if (satisfaction >= 50) return 'Moderate - Neutral';
  if (satisfaction >= 40) return 'Moderate-Low - Some Concerns';
  if (satisfaction >= 25) return 'Low - Dissatisfied';
  return 'Very Low - Seeking Alternative';
}

/**
 * Categorize skill level into human-readable competency level
 *
 * @param skill - Skill score (0-100)
 * @returns Competency level category
 *
 * @example
 * ```typescript
 * getSkillCategory(95) // 'Expert'
 * getSkillCategory(75) // 'Advanced'
 * getSkillCategory(50) // 'Intermediate'
 * getSkillCategory(25) // 'Beginner'
 * getSkillCategory(5) // 'Novice'
 * ```
 */
export function getSkillCategory(skill: number): string {
  if (skill >= 80) return 'Expert';
  if (skill >= 65) return 'Advanced';
  if (skill >= 50) return 'Intermediate';
  if (skill >= 30) return 'Beginner';
  return 'Novice';
}

/**
 * Get experience level label from years of experience
 * Maps continuous years to experience tier
 *
 * @param yearsOfExperience - Years in industry (0-50)
 * @returns Experience level label
 *
 * @example
 * ```typescript
 * getExperienceLevel(1) // 'Entry Level (0-2 years)'
 * getExperienceLevel(4) // 'Junior (2-5 years)'
 * getExperienceLevel(8) // 'Mid Level (5-10 years)'
 * getExperienceLevel(12) // 'Senior (10-15 years)'
 * getExperienceLevel(18) // 'Lead (15-20 years)'
 * getExperienceLevel(25) // 'Principal (20+ years)'
 * ```
 */
export function getExperienceLevel(yearsOfExperience: number): string {
  if (yearsOfExperience < 2) return 'Entry Level (0-2 years)';
  if (yearsOfExperience < 5) return 'Junior (2-5 years)';
  if (yearsOfExperience < 10) return 'Mid Level (5-10 years)';
  if (yearsOfExperience < 15) return 'Senior (10-15 years)';
  if (yearsOfExperience < 20) return 'Lead (15-20 years)';
  return 'Principal (20+ years)';
}

/**
 * Calculate market value estimate based on skills
 * Estimates competitive salary based on skill distribution
 *
 * @param skills - Employee 12-skill profile
 * @param baseRate - Industry base rate (default: $60,000)
 * @returns Estimated market salary
 *
 * @example
 * ```typescript
 * const skills = {
 *   technical: 85, leadership: 75, finance: 70,
 *   sales: 60, marketing: 55, operations: 65,
 *   research: 80, compliance: 60, communication: 70,
 *   creativity: 65, analytical: 80, customerService: 60
 * };
 * const value = calculateMarketValue(skills);
 * // Returns: ~$156,000 (based on strong technical/analytical/research)
 * ```
 */
export function calculateMarketValue(skills: EmployeeSkills, baseRate: number = 60000): number {
  // Calculate average skill across all 12
  const skillValues = Object.values(skills);
  const avgSkill = skillValues.reduce((sum, val) => sum + val, 0) / skillValues.length;

  // Weight by top 3 skills (specialized knowledge commands premium)
  const topSkills = skillValues.sort((a, b) => b - a).slice(0, 3);
  const topAvg = topSkills.reduce((sum, val) => sum + val, 0) / 3;

  // Calculate multiplier: average skill + weighted premium for expertise
  const baseMultiplier = (avgSkill / 100) * 1.5; // Average skill: 0.75x to 1.5x
  const expertiseBonus = (topAvg - avgSkill) / 100 * 0.3; // Top skills: +0% to +30%
  const totalMultiplier = baseMultiplier + expertiseBonus;

  // Apply to base rate
  const marketValue = baseRate * totalMultiplier;

  return Math.round(Math.max(baseRate * 0.6, Math.min(marketValue, baseRate * 3.0))); // Clamp to 0.6x-3.0x
}

/**
 * Get productivity level description
 *
 * @param productivity - Productivity multiplier (0.5-2.0)
 * @returns Human-readable description
 *
 * @example
 * ```typescript
 * getProductivityLabel(1.8) // 'Exceptional - 80% Above Baseline'
 * getProductivityLabel(1.0) // 'Expected - Meeting Baseline'
 * getProductivityLabel(0.6) // 'Below Average - 40% Below Baseline'
 * ```
 */
export function getProductivityLabel(productivity: number): string {
  const percentAbove = (productivity - 1.0) * 100;

  if (productivity >= 1.7) return `Exceptional - ${Math.round(percentAbove)}% Above Baseline`;
  if (productivity >= 1.4) return `Above Average - ${Math.round(percentAbove)}% Above Baseline`;
  if (productivity >= 1.0) return `Expected - Meeting Baseline`;
  if (productivity >= 0.8) return `Below Average - ${Math.round(Math.abs(percentAbove))}% Below Baseline`;
  return `Poor - ${Math.round(Math.abs(percentAbove))}% Below Baseline`;
}

/**
 * Get quality level description
 *
 * @param quality - Quality score (0-100)
 * @returns Human-readable description
 */
export function getQualityLabel(quality: number): string {
  if (quality >= 90) return 'Excellent - Minimal Errors';
  if (quality >= 80) return 'Good - Few Errors';
  if (quality >= 70) return 'Acceptable - Some Issues';
  if (quality >= 50) return 'Below Average - Frequent Issues';
  return 'Poor - Many Errors';
}

/**
 * Get attendance level description
 *
 * @param attendance - Attendance ratio (0.8-1.0)
 * @returns Human-readable description
 */
export function getAttendanceLabel(attendance: number): string {
  const percentMissed = Math.round((1 - attendance) * 100);
  const percentPresent = Math.round(attendance * 100);

  if (attendance >= 0.98) return `Excellent - ${percentPresent}% Present`;
  if (attendance >= 0.95) return `Good - ${percentPresent}% Present`;
  if (attendance >= 0.9) return `Acceptable - ${percentPresent}% Present`;
  if (attendance >= 0.85) return `Fair - ${percentPresent}% Present (${percentMissed}% Absent)`;
  return `Poor - ${percentMissed}% Missed Days`;
}

/**
 * Get salary range description based on competitiveness
 *
 * @param actualSalary - Current salary
 * @param marketSalary - Market rate
 * @returns Human-readable description
 *
 * @example
 * ```typescript
 * getSalaryCompetitivenessLabel(120000, 100000)
 * // 'Premium - 20% Above Market'
 *
 * getSalaryCompetitivenessLabel(90000, 100000)
 * // 'Below Market - 10% Below Average'
 * ```
 */
export function getSalaryCompetitivenessLabel(actualSalary: number, marketSalary: number): string {
  const ratio = actualSalary / marketSalary;
  const percentDiff = Math.round((ratio - 1) * 100);

  if (ratio >= 1.2) return `Premium - ${percentDiff}% Above Market`;
  if (ratio >= 1.1) return `Above Market - ${percentDiff}% Above Average`;
  if (ratio >= 1.0) return `Market Rate - Competitive`;
  if (ratio >= 0.95) return `Slightly Below - ${Math.abs(percentDiff)}% Below Market`;
  return `Below Market - ${Math.abs(percentDiff)}% Below Average`;
}

/**
 * Get bonus generosity description
 *
 * @param bonus - Bonus percentage (0-100)
 * @returns Human-readable description
 */
export function getBonusLabel(bonus: number): string {
  if (bonus >= 20) return `Generous - ${bonus}% Bonus`;
  if (bonus >= 15) return `Above Market - ${bonus}% Bonus`;
  if (bonus >= 10) return `Standard - ${bonus}% Bonus`;
  if (bonus >= 5) return `Modest - ${bonus}% Bonus`;
  if (bonus > 0) return `Minimal - ${bonus}% Bonus`;
  return 'None - 0% Bonus';
}

/**
 * Get equity allocation description
 *
 * @param equity - Equity percentage (0-10)
 * @returns Human-readable description
 */
export function getEquityLabel(equity: number): string {
  if (equity >= 2.0) return `Substantial - ${equity.toFixed(2)}% Equity`;
  if (equity >= 1.0) return `Meaningful - ${equity.toFixed(2)}% Equity`;
  if (equity >= 0.5) return `Token - ${equity.toFixed(2)}% Equity`;
  if (equity > 0) return `Minimal - ${equity.toFixed(2)}% Equity`;
  return 'None - 0% Equity';
}

/**
 * Calculate loyalty score interpretation
 *
 * @param loyalty - Loyalty score (0-100)
 * @returns Descriptive interpretation
 */
export function getLoyaltyLabel(loyalty: number): string {
  if (loyalty >= 85) return 'Extremely Loyal - Low Poaching Risk';
  if (loyalty >= 70) return 'Loyal - Resistant to External Offers';
  if (loyalty >= 55) return 'Moderately Loyal - May Listen to Offers';
  if (loyalty >= 40) return 'Wavering - Vulnerable to Recruitment';
  return 'Low Loyalty - High Turnover Risk';
}

/**
 * Describe training investment level
 *
 * @param totalTrainingInvestment - Total $ spent on training
 * @param annualSalary - Annual salary for context
 * @returns Descriptive interpretation
 */
export function getTrainingInvestmentLabel(totalTrainingInvestment: number, annualSalary: number): string {
  const percent = (totalTrainingInvestment / annualSalary) * 100;

  if (percent >= 10) return `Strong Development - ${Math.round(percent)}% of Salary Invested`;
  if (percent >= 5) return `Good Investment - ${Math.round(percent)}% of Salary Invested`;
  if (percent >= 2) return `Some Development - ${Math.round(percent)}% of Salary Invested`;
  if (percent > 0) return `Minimal Training - ${Math.round(percent)}% of Salary Invested`;
  return 'No Training Investment';
}
