/**
 * @file src/lib/utils/employee/index.ts
 * @description Employee utilities barrel export
 * @created 2025-11-29
 * @author ECHO v1.3.1
 *
 * OVERVIEW:
 * Consolidated export for all employee utilities:
 * - Color functions (getStatusColor, getMoraleColor, etc.)
 * - Helper functions (getStatusLabel, getMoraleLabel, etc.)
 * - Retention utilities (from shared employeeRetention.ts)
 *
 * Enables clean imports:
 * ```typescript
 * import { getStatusColor, getMoraleLabel } from '@/lib/utils/employee';
 * ```
 */

// Export color utilities
export {
  getStatusColor,
  getMoraleColor,
  getRetentionRiskColor,
  getPerformanceRatingColor,
  getSatisfactionColor,
  getSkillColor,
  getAverageSkillColor,
  getBonusColor,
  getEquityColor,
  getSalaryCompetitivenessColor,
  getTrainingInvestmentColor,
  getProductivityColor,
  getQualityColor,
  getAttendanceColor,
  getCounterOfferColor,
  // HeroUI scheme functions for Badge/Chip components
  getPerformanceRatingScheme,
  getMoraleScheme,
  getRetentionRiskScheme,
  getStatusScheme,
} from './colors';

// Export HeroUI color type
export type { HeroUIColor } from './colors';

// Export helper functions
export {
  getStatusLabel,
  getMoraleLabel,
  getRetentionRiskLabel,
  getPerformanceLabel,
  getSatisfactionLabel,
  getSkillCategory,
  getExperienceLevel,
  calculateMarketValue,
  getProductivityLabel,
  getQualityLabel,
  getAttendanceLabel,
  getSalaryCompetitivenessLabel,
  getBonusLabel,
  getEquityLabel,
  getLoyaltyLabel,
  getTrainingInvestmentLabel,
} from './helpers';

// Note: Retention utilities (calculateSatisfaction, calculateRetentionRisk, etc.)
// will be exported from Phase 2.1 when employeeRetention.ts is created
// For now, import them from '@/lib/utils/employeeRetention' when available
// export { getMarketSalary, calculateSatisfaction, ... } from '../employeeRetention';
