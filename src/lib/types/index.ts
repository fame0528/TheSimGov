/**
 * @fileoverview TypeScript Types Exports
 * @module lib/types
 * 
 * OVERVIEW:
 * Central export point for all TypeScript type definitions.
 * Provides clean imports: import { ApiResponse, User, Company, IndustryType } from '@/lib/types'
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

// API types
export type { ApiResponse, PaginatedResponse } from './api';

// Domain models
export type { User, Company, Employee, Contract, Loan, Bank, EmployeeSkills, EmployeePerformance, TrainingRecord, PerformanceReview, TechnologySubcategory } from './models';

// Enumerations
export { IndustryType, LoanType, ContractType, ContractStatus, LoanStatus, InvestmentType } from './enums';

// Game mechanics
export type { CompanyLevel, LevelConfig, GameTime, Skill, Achievement, AchievementRequirement, AchievementReward } from './game';
export { SkillCategory } from './game';

// Department system
export type { Department, FinanceDepartment, HRDepartment, MarketingDepartment, RDDepartment, AnyDepartment } from './department';
export { DepartmentType, DepartmentName } from './department';

// State economic perks
export type { StatePerkData, StateAbbreviation, IndustryBonuses, IndustrySpecialization } from './state';

// AI & Research
export type { AIModel, AIResearchProject, CreateAIModelInput, CreateResearchProjectInput, TrainingProgressInput, ResearchProgressInput, DeployModelInput } from './ai';
export type { AIBreakthrough, AIPatent, CreateBreakthroughInput, FilePatentInput, UpdatePatentStatusInput, BreakthroughAttemptResult, PatentPortfolioSummary } from './breakthrough';

// Politics Phase 2 Data Contracts
export type {
	CampaignPhaseState,
	PollingSnapshot,
	DebatePerformance,
	ScandalRecord,
	EndorsementRecord,
	AchievementEvent,
	LeaderboardEntry
} from './politics';
export {
	CampaignPhase,
	ScandalCategory,
	ScandalStatus,
	EndorsementSourceCategory,
	EndorsementTier,
	AchievementCategory,
	LeaderboardMetricType,
	TrendDirection
} from './politics';

// Phase 7 Achievements & Telemetry
export type {
	AchievementDefinition,
	AchievementCriteriaExpression,
	AchievementReward as Phase7AchievementReward,
	AchievementUnlock,
	AchievementProgressSnapshot,
	AchievementProgressEntry,
	TelemetryEvent,
	TelemetryEventBase,
	TelemetryCampaignPhaseChangeEvent,
	TelemetryDebateResultEvent,
	TelemetryEndorsementEvent,
	TelemetryBillVoteEvent,
	TelemetryPolicyEnactedEvent,
	TelemetryLobbyAttemptEvent,
	TelemetryMomentumShiftEvent,
	TelemetryPollIntervalEvent,
	TelemetrySystemBalanceAppliedEvent,
	TelemetryAggregate
} from './politicsPhase7';
export {
	AchievementRewardType,
	TelemetryEventType,
	AchievementStatus
} from './politicsPhase7';

// Influence & Lobbying (Baseline Phase 4)
export type {
  BaseInfluenceInputs,
  InfluenceComponentBreakdown,
  InfluenceResult,
  LobbyingProbabilityInputs,
  LobbyingProbabilityBreakdown,
  LobbyingProbabilityResult
} from './politicsInfluence';

// Portrait & Avatar System
export type {
  Gender,
  Ethnicity,
  PresetPortrait,
  AvatarSelection,
  PortraitFilter,
  UploadValidation,
  PortraitCatalogStats
} from './portraits';
export { AVATAR_CONSTRAINTS } from './portraits';

// Player Profile System
export type {
  StockPortfolio,
  StockHolding,
  UnionMembership,
  CEOPosition,
  PlayerBusiness,
  OwnedCompany,
  LobbyAffiliation,
  PlayerPolitics,
  ElectoralHistoryEntry,
  ElectoralHistory,
  PlayerIdentity,
  PlayerProfile,
  PlayerProfileResponse
} from './player';
export {
  WealthClass,
  SocialPosition,
  EconomicPosition,
  PlayerParty,
  ElectionResult,
  ElectoralOffice,
  formatPlayerCurrency,
  formatPlayerPercent,
  getWealthClass,
  getPartyColor,
  getPositionColor
} from './player';

// Demographics System
export type {
  IssuePosition,
  IssueProfile,
  DemographicGroupKey,
  DemographicGroup,
  StateDemographics,
  DemographicShare,
  VoterProfile,
  DemographicAppeal,
  SpecialEffect,
  DemographicPollResult,
  StatePollingSummary,
  PollComparison,
  DemographicFilter,
  AppealCalculationInput,
  IssueAlignmentResult,
} from './demographics';
export {
  DemographicRace,
  DemographicClass,
  DemographicGender,
  DemographicAge,
  DemographicEducation,
  DemographicArea,
  PoliticalIssue,
  PositionLabel,
  ALL_DEMOGRAPHIC_KEYS,
  ALL_POLITICAL_ISSUES,
  getPositionLabel,
  getPositionLabelText,
  getDemographicLabel,
  isDemographicGroupKey,
  isPoliticalIssue,
  DEMOGRAPHICS_SCHEMA_VERSION,
} from './demographics';

// Actions System
export type {
  ActionCost,
  PollingEffect,
  DemographicEffect,
  IssueEffect,
  ReputationEffect,
  FundraisingEffect,
  ActionEffects,
  ActionDefinition,
  PlayerAction,
  ActionResult,
  ActionQueue,
} from './actions';
export {
  ActionCategory,
  ActionType,
  ActionScope,
  ActionResultStatus,
  ActionIntensity,
  INTENSITY_COST_MULTIPLIERS,
  INTENSITY_EFFECT_MULTIPLIERS,
  ACTION_BASE_COSTS,
  CATEGORY_ACTIONS,
  DEFAULT_ACTION_POINTS_PER_DAY,
  ACTION_POINTS_RESET_HOUR,
  ACTION_COOLDOWNS,
  getActionCategory,
  ACTION_DISPLAY_NAMES,
  CATEGORY_DISPLAY_NAMES,
  CATEGORY_ICONS,
  isValidActionType,
  calculateFinalCost,
} from './actions';
