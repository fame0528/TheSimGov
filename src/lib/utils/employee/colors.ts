/**
 * @file src/lib/utils/employee/colors.ts
 * @description Employee status and performance color utilities for UI visualization
 * @created 2025-11-29
 * @author ECHO v1.3.1
 *
 * OVERVIEW:
 * Color mapping system for employee metrics visualization. Provides consistent
 * color schemes across all employee dashboard components following HeroUI color
 * standards. Used for: morale, retention risk, performance ratings, skill levels,
 * status indicators, salary/bonus/equity ranges.
 *
 * COLOR SCHEME:
 * - Green (#10B981): Positive, healthy, good performance
 * - Blue (#3B82F6): Neutral, informational, active
 * - Yellow (#EAB308): Caution, moderate concern, warning
 * - Orange (#F59E0B): High concern, needs attention, elevated risk
 * - Red (#DC2626): Critical, danger, urgent action required
 * - Gray (#6B7280): Neutral, inactive, terminated
 *
 * SCALE PATTERNS:
 * - Morale (0-100): Red<30, Yellow 30-70, Green>70
 * - Retention Risk (0-100): Green<20, Yellow 20-40, Orange 40-60, Red>60
 * - Performance (1-5): Red 1, Yellow 2, Blue 3, Orange 4, Green 5
 * - Skills (0-100): Red<30, Yellow 30-70, Green>70
 * - Status: Active=Green, Training=Blue, OnLeave=Yellow, Terminated=Gray
 */

/**
 * Get color for employee status
 * Maps employment status to visual color
 *
 * @param status - Employee status ('active'|'training'|'onLeave'|'terminated')
 * @returns Hex color code
 *
 * @example
 * ```typescript
 * const color = getStatusColor('active'); // #10B981
 * ```
 */
export function getStatusColor(status: 'active' | 'training' | 'onLeave' | 'terminated'): string {
  switch (status) {
    case 'active':
      return '#10B981'; // Green - employed and working
    case 'training':
      return '#3B82F6'; // Blue - in training program
    case 'onLeave':
      return '#F59E0B'; // Amber - temporarily unavailable
    case 'terminated':
      return '#6B7280'; // Gray - no longer employed
    default:
      return '#6B7280'; // Default to gray
  }
}

/**
 * Get color for morale level (0-100)
 * Higher morale = greener; lower = redder
 *
 * @param morale - Morale score (0-100)
 * @returns Hex color code
 *
 * @example
 * ```typescript
 * const color = getMoraleColor(75); // #10B981 (green)
 * const color = getMoraleColor(45); // #EAB308 (yellow)
 * const color = getMoraleColor(20); // #DC2626 (red)
 * ```
 */
export function getMoraleColor(morale: number): string {
  if (morale >= 80) return '#10B981'; // Green - excellent morale
  if (morale >= 70) return '#84CC16'; // Lime - good morale
  if (morale >= 50) return '#EAB308'; // Yellow - moderate morale
  if (morale >= 30) return '#F59E0B'; // Orange - poor morale
  return '#DC2626'; // Red - critical morale (quitting soon)
}

/**
 * Get color for retention risk (0-100)
 * Higher risk = redder; lower = greener
 * Risk scale inverse of satisfaction
 *
 * @param risk - Retention risk score (0-100)
 * @returns Hex color code
 *
 * @example
 * ```typescript
 * const color = getRetentionRiskColor(15); // #10B981 (minimal risk)
 * const color = getRetentionRiskColor(50); // #F59E0B (moderate risk)
 * const color = getRetentionRiskColor(85); // #DC2626 (critical risk)
 * ```
 */
export function getRetentionRiskColor(risk: number): string {
  if (risk >= 80) return '#DC2626'; // Red - critical risk (likely to quit immediately)
  if (risk >= 60) return '#F59E0B'; // Orange - high risk (considering external offers)
  if (risk >= 40) return '#EAB308'; // Yellow - moderate risk (could leave if conditions worsen)
  if (risk >= 20) return '#84CC16'; // Lime - low risk (generally satisfied)
  return '#10B981'; // Green - minimal risk (highly loyal)
}

/**
 * Get color for performance rating (1-5 scale)
 * Follows standard performance evaluation scale
 *
 * @param rating - Performance rating (1-5)
 * @returns Hex color code
 *
 * @example
 * ```typescript
 * const color = getPerformanceRatingColor(5); // #10B981 (excellent)
 * const color = getPerformanceRatingColor(3); // #3B82F6 (meets expectations)
 * const color = getPerformanceRatingColor(1); // #DC2626 (unsatisfactory)
 * ```
 */
export function getPerformanceRatingColor(rating: number): string {
  switch (Math.round(rating)) {
    case 5:
      return '#10B981'; // Green - exceptional
    case 4:
      return '#84CC16'; // Lime - exceeds expectations
    case 3:
      return '#3B82F6'; // Blue - meets expectations
    case 2:
      return '#F59E0B'; // Orange - below expectations
    case 1:
      return '#DC2626'; // Red - unsatisfactory
    default:
      return '#3B82F6';
  }
}

/**
 * Get color for satisfaction level (0-100)
 * Similar to morale but measures job satisfaction
 *
 * @param satisfaction - Satisfaction score (0-100)
 * @returns Hex color code
 *
 * @example
 * ```typescript
 * const color = getSatisfactionColor(85); // #10B981 (very satisfied)
 * const color = getSatisfactionColor(50); // #EAB308 (neutral)
 * const color = getSatisfactionColor(25); // #DC2626 (very dissatisfied)
 * ```
 */
export function getSatisfactionColor(satisfaction: number): string {
  if (satisfaction >= 80) return '#10B981'; // Green - very satisfied
  if (satisfaction >= 70) return '#84CC16'; // Lime - satisfied
  if (satisfaction >= 50) return '#EAB308'; // Yellow - neutral
  if (satisfaction >= 30) return '#F59E0B'; // Orange - dissatisfied
  return '#DC2626'; // Red - very dissatisfied
}

/**
 * Get color for skill level (0-100)
 * Measures competency in a specific skill
 *
 * @param skill - Skill level (0-100)
 * @returns Hex color code
 *
 * @example
 * ```typescript
 * const color = getSkillColor(85); // #10B981 (expert level)
 * const color = getSkillColor(50); // #EAB308 (average)
 * const color = getSkillColor(25); // #DC2626 (weak)
 * ```
 */
export function getSkillColor(skill: number): string {
  if (skill >= 80) return '#10B981'; // Green - expert (80-100)
  if (skill >= 70) return '#84CC16'; // Lime - advanced (70-80)
  if (skill >= 60) return '#3B82F6'; // Blue - proficient (60-70)
  if (skill >= 40) return '#EAB308'; // Yellow - intermediate (40-60)
  if (skill >= 20) return '#F59E0B'; // Orange - beginner (20-40)
  return '#DC2626'; // Red - novice (0-20)
}

/**
 * Get color for average skill across all 12 skills
 * Uses same scale as individual skill color
 *
 * @param averageSkill - Average skill score (0-100)
 * @returns Hex color code
 */
export function getAverageSkillColor(averageSkill: number): string {
  return getSkillColor(averageSkill);
}

/**
 * Get color for bonus percentage (0-100)
 * Measures generosity of bonus relative to salary
 *
 * @param bonus - Bonus percentage (0-100)
 * @returns Hex color code
 *
 * @example
 * ```typescript
 * const color = getBonusColor(25); // #10B981 (generous)
 * const color = getBonusColor(10); // #EAB308 (standard)
 * const color = getBonusColor(0); // #DC2626 (no bonus)
 * ```
 */
export function getBonusColor(bonus: number): string {
  if (bonus >= 20) return '#10B981'; // Green - generous bonus (20%+)
  if (bonus >= 15) return '#84CC16'; // Lime - above market (15-20%)
  if (bonus >= 10) return '#3B82F6'; // Blue - standard (10-15%)
  if (bonus >= 5) return '#F59E0B'; // Orange - below market (5-10%)
  return '#DC2626'; // Red - minimal/no bonus (<5%)
}

/**
 * Get color for equity percentage (0-10)
 * Measures stock option allocation as retention tool
 *
 * @param equity - Equity percentage (0-10)
 * @returns Hex color code
 *
 * @example
 * ```typescript
 * const color = getEquityColor(2.5); // #10B981 (substantial)
 * const color = getEquityColor(1.0); // #3B82F6 (standard)
 * const color = getEquityColor(0); // #DC2626 (none)
 * ```
 */
export function getEquityColor(equity: number): string {
  if (equity >= 2.0) return '#10B981'; // Green - substantial equity (2%+)
  if (equity >= 1.0) return '#84CC16'; // Lime - meaningful (1-2%)
  if (equity >= 0.5) return '#3B82F6'; // Blue - token amount (0.5-1%)
  if (equity > 0) return '#F59E0B'; // Orange - minimal (<0.5%)
  return '#DC2626'; // Red - no equity
}

/**
 * Get color for salary competitiveness ratio
 * Compares actual salary to market rate for role/experience
 *
 * @param actualSalary - Current employee salary
 * @param marketSalary - Market rate for role/experience
 * @returns Hex color code
 *
 * @example
 * ```typescript
 * // Employee paid 20% above market
 * const color = getSalaryCompetitivenessColor(120000, 100000); // #10B981
 *
 * // Employee paid 5% below market
 * const color = getSalaryCompetitivenessColor(95000, 100000); // #F59E0B
 * ```
 */
export function getSalaryCompetitivenessColor(actualSalary: number, marketSalary: number): string {
  const ratio = actualSalary / marketSalary;

  if (ratio >= 1.2) return '#10B981'; // Green - 20%+ above market (premium pay)
  if (ratio >= 1.1) return '#84CC16'; // Lime - 10-20% above market (above market)
  if (ratio >= 1.0) return '#3B82F6'; // Blue - at market (competitive)
  if (ratio >= 0.95) return '#F59E0B'; // Orange - 5-10% below market (slight discount)
  if (ratio >= 0.9) return '#F59E0B'; // Orange - 10% below market (noticeable discount)
  return '#DC2626'; // Red - 10%+ below market (significantly underpaid)
}

/**
 * Get color for training investment
 * Measures company investment in employee development
 *
 * @param totalTrainingInvestment - Total $ spent on training
 * @param annualSalary - Employee annual salary (for context)
 * @returns Hex color code
 *
 * @example
 * ```typescript
 * // Invested 15% of salary in training = strong development
 * const color = getTrainingInvestmentColor(15000, 100000); // #10B981
 *
 * // Invested 2% of salary = minimal training
 * const color = getTrainingInvestmentColor(2000, 100000); // #F59E0B
 * ```
 */
export function getTrainingInvestmentColor(totalTrainingInvestment: number, annualSalary: number): string {
  const investmentPercent = (totalTrainingInvestment / annualSalary) * 100;

  if (investmentPercent >= 10) return '#10B981'; // Green - strong development (10%+)
  if (investmentPercent >= 5) return '#84CC16'; // Lime - good investment (5-10%)
  if (investmentPercent >= 2) return '#3B82F6'; // Blue - some development (2-5%)
  if (investmentPercent > 0) return '#F59E0B'; // Orange - minimal investment (<2%)
  return '#DC2626'; // Red - no training investment
}

/**
 * Get color for productivity multiplier (0.5-2.0)
 * Measures work output relative to expected baseline
 *
 * @param productivity - Productivity multiplier (0.5-2.0, default 1.0)
 * @returns Hex color code
 *
 * @example
 * ```typescript
 * const color = getProductivityColor(1.8); // #10B981 (80% above baseline)
 * const color = getProductivityColor(1.0); // #3B82F6 (meets baseline)
 * const color = getProductivityColor(0.6); // #DC2626 (40% below baseline)
 * ```
 */
export function getProductivityColor(productivity: number): string {
  if (productivity >= 1.7) return '#10B981'; // Green - exceptional productivity (70%+)
  if (productivity >= 1.4) return '#84CC16'; // Lime - above average (40-70%)
  if (productivity >= 1.0) return '#3B82F6'; // Blue - meets expectations (0-40%)
  if (productivity >= 0.8) return '#F59E0B'; // Orange - below expectations (-20%)
  return '#DC2626'; // Red - significantly underperforming (-50%+)
}

/**
 * Get color for quality metric (0-100)
 * Measures work quality and error rate inverse
 *
 * @param quality - Quality score (0-100, higher = better)
 * @returns Hex color code
 */
export function getQualityColor(quality: number): string {
  if (quality >= 90) return '#10B981'; // Green - excellent quality
  if (quality >= 80) return '#84CC16'; // Lime - good quality
  if (quality >= 70) return '#3B82F6'; // Blue - acceptable quality
  if (quality >= 50) return '#F59E0B'; // Orange - needs improvement
  return '#DC2626'; // Red - poor quality
}

/**
 * Get color for attendance metric (0.8-1.0)
 * Measures days worked / days expected
 *
 * @param attendance - Attendance ratio (0.8-1.0)
 * @returns Hex color code
 *
 * @example
 * ```typescript
 * const color = getAttendanceColor(1.0); // #10B981 (perfect)
 * const color = getAttendanceColor(0.95); // #3B82F6 (good)
 * const color = getAttendanceColor(0.85); // #F59E0B (missing days)
 * ```
 */
export function getAttendanceColor(attendance: number): string {
  if (attendance >= 0.98) return '#10B981'; // Green - excellent attendance
  if (attendance >= 0.95) return '#84CC16'; // Lime - good attendance
  if (attendance >= 0.9) return '#3B82F6'; // Blue - acceptable attendance
  if (attendance >= 0.85) return '#F59E0B'; // Orange - some absences
  return '#DC2626'; // Red - significant absences
}

/**
 * Get color for counter-offer count
 * Tracks how many times company has made retention offers
 * Higher count = lower effectiveness of future offers
 *
 * @param counterOfferCount - Number of counter-offers made
 * @returns Hex color code
 *
 * @example
 * ```typescript
 * const color = getCounterOfferColor(0); // #10B981 (fresh, credible)
 * const color = getCounterOfferColor(2); // #F59E0B (diminishing returns)
 * const color = getCounterOfferColor(5); // #DC2626 (employee skeptical)
 * ```
 */
export function getCounterOfferColor(counterOfferCount: number): string {
  if (counterOfferCount === 0) return '#10B981'; // Green - haven't needed counter-offers
  if (counterOfferCount === 1) return '#3B82F6'; // Blue - one counter-offer made
  if (counterOfferCount === 2) return '#EAB308'; // Yellow - multiple attempts
  if (counterOfferCount <= 4) return '#F59E0B'; // Orange - frequent offers, diminishing credibility
  return '#DC2626'; // Red - many offers, employee skeptical of commitment
}
