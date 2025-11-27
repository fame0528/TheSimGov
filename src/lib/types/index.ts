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
export type { User, Company, Employee, Contract, Loan, Bank, EmployeeSkills, EmployeePerformance, TrainingRecord, PerformanceReview } from './models';

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
	AchievementReward,
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
