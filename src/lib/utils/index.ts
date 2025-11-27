/**
 * @fileoverview Utility Functions Exports
 * @module lib/utils
 * 
 * OVERVIEW:
 * Central export point for all utility functions.
 * Provides clean imports: import { formatCurrency, validate, COMPANY_LEVELS } from '@/lib/utils'
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

// Currency utilities
export {
  formatCurrency,
  formatCompact,
  formatAccounting,
  add,
  subtract,
  multiply,
  divide,
  parseCurrency,
  toCurrency,
  percentage,
  percentageOf,
  sum,
  min,
  max,
  average,
} from './currency';

// Date utilities
export {
  GAME_TIME_MULTIPLIER,
  realToGameTime,
  gameToRealTime,
  getGameTimeElapsed,
  formatGameDuration,
  formatDate,
  getRelativeTime,
} from './date';

// Validation schemas and helper
export {
  companySchema,
  employeeSchema,
  contractBidSchema,
  loanApplicationSchema,
  loginSchema,
  registerSchema,
  validate,
  type CompanyInput,
  type EmployeeInput,
  type ContractBidInput,
  type LoanApplicationInput,
  type LoginInput,
  type RegisterInput,
} from './validation';

// Game constants
export {
  COMPANY_LEVELS,
  INDUSTRY_COSTS,
  CREDIT_SCORE_FACTORS,
  LOAN_PARAMETERS,
  CONTRACT_PARAMETERS,
  EMPLOYEE_PARAMETERS,
  GAME_TIME,
  API_LIMITS,
  UI_CONSTANTS,
} from './constants';

// Formatting utilities
export {
  // Number formatting (added to fix missing export usage in dashboards)
  formatNumber,
  formatPercent,
  pluralize,
  truncate,
  capitalize,
  slugify,
  formatFileSize,
  getInitials,
} from './formatting';

// Healthcare utilities
export {
  calculateHospitalQualityScore,
  calculateDeviceReimbursement,
  calculateClinicEfficiency,
  calculateDrugSuccessProbability,
  calculatePatentValue,
  determineDeviceClass,
  calculateTrialTimeline,
  calculateResearchRisk,
  calculateHealthcareInflation,
  validateHealthcareLicense,
  projectPatientVolume,
  projectHospitalPatientGrowth,
  validateHealthcareMetrics,
  calculateHospitalCapacityUtilization,
  calculateHospitalFinancialProjection,
  calculateHospitalPatientSatisfaction,
  validateHospitalLicense,
  calculateHospitalInflationAdjustment,
  // Clinic advanced utilities (object-based)
  calculateClinicEfficiencyFromObjects,
  calculateClinicPatientFlow,
  calculateClinicFinancialProjection,
  calculateClinicServiceUtilization,
  calculateClinicWaitTimes,
  projectClinicDemand,
  validateClinicLicense,
  validateClinicMetrics,
  // Clinic interface types
  type ClinicCapacity,
  type ClinicStaffing,
  type ClinicPerformance,
  type ClinicFinancials,
  type ClinicLocation,
} from './healthcare';

// Media utilities
export {
  calculateCTR,
  calculateCPA,
  calculateConversionRate,
  calculateAdRank,
  calculateAdRankByBid,
  calculateAudienceGrowthRate,
  calculateAudienceValue,
  calculateEngagementEfficiency,
  calculateContentScore,
  type ContentMetrics,
} from './media';

// Level progression utilities
export {
  type CompanyLevel,
  type IndustryType,
  type TechSubcategory,
  type LevelRequirements,
  type UpgradeEligibility,
  type XPSource,
  type CompanyData,
  XP_REQUIREMENTS,
  BASE_UPGRADE_COSTS,
  EMPLOYEE_REQUIREMENTS,
  REVENUE_REQUIREMENTS,
  getNextLevelRequirements,
  checkUpgradeEligibility,
  calculateContractXP,
  calculateMilestoneXP,
  getXPForNextLevel,
  calculateNewLevel,
  validateLevelProgressionData,
} from './levelProgression';

// Contract progression utilities
export {
  type SkillMatchResult,
  type TeamMetrics,
  type ProgressionResult,
  type ContractProgressSummary,
  TIME_ACCELERATION,
  calculateSkillMatch,
  calculateTeamMetrics,
  calculateProgression,
  calculateQualityScore,
  calculateContractProgressionXP,
  validateContractProgressionData,
  getContractProgressionSummary,
} from './contractProgression';

// AGI Development utilities
export {
  type MilestoneType,
  type AlignmentStance,
  type CapabilityMetrics,
  type AlignmentMetrics,
  type AlignmentChallenge,
  type ProgressionPath,
  type AlignmentTradeoff,
  type CapabilityExplosion,
  type AlignmentTax,
  type IndustryDisruption,
  calculateMilestoneProgressionPath,
  evaluateAlignmentTradeoff,
  simulateCapabilityExplosion,
  assessAlignmentTax,
  predictIndustryDisruption,
  generateAlignmentChallenge,
  validateAGIDevelopmentData,
  getAGIDevelopmentSummary,
} from './agiDevelopment';

// Contract Quality utilities
export {
  type ContractData,
  type EmployeeData,
  type QualityBreakdown,
  type ReputationImpact,
  type CompanyQualityTrends,
  type ContractQualityData,
  calculateDetailedQuality,
  calculateReputationImpact,
  generateContractQualityData,
  calculateCompanyQualityTrends,
  getContractQualitySummary,
  validateContractQualityData,
  validateEmployeeQualityData,
} from './contractQuality';
