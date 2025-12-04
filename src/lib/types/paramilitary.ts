/**
 * @fileoverview Paramilitary Types - Armed Organizations and Conflict Systems
 * @module lib/types/paramilitary
 * 
 * OVERVIEW:
 * Types for player-created and system paramilitary organizations including:
 * - Military forces (government-aligned)
 * - Police organizations (law enforcement)
 * - Organized crime groups (criminal enterprises)
 * - Private military companies (mercenaries)
 * - Militia groups (ideological armed groups)
 * 
 * DESIGN PRINCIPLES:
 * - Organizations have troops/members that can be deployed
 * - Financial systems: legitimate funding, contraband, money laundering
 * - Territorial control affects political influence
 * - Heat/wanted level for criminal organizations
 * - Conflict resolution between opposing forces
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

// ===================== ENUMS =====================

/**
 * Paramilitary Organization Type
 * 
 * The fundamental classification of the armed group.
 */
export enum ParamilitaryType {
  MILITARY = 'MILITARY',           // Government armed forces
  POLICE = 'POLICE',               // Law enforcement agency
  ORGANIZED_CRIME = 'ORGANIZED_CRIME', // Criminal enterprise
  PRIVATE_MILITARY = 'PRIVATE_MILITARY', // Mercenary/PMC
  MILITIA = 'MILITIA',             // Ideological armed group
  SECURITY_FIRM = 'SECURITY_FIRM', // Private security company
}

/**
 * Paramilitary Scope
 * 
 * Geographic reach of the organization.
 */
export enum ParamilitaryScope {
  LOCAL = 'LOCAL',         // City/county level
  STATE = 'STATE',         // State level
  REGIONAL = 'REGIONAL',   // Multiple states
  NATIONAL = 'NATIONAL',   // Entire nation
  INTERNATIONAL = 'INTERNATIONAL', // Cross-border operations
}

/**
 * Member Role within Organization
 * 
 * Hierarchy determines command authority and cut of profits.
 */
export enum ParamilitaryMemberRole {
  BOSS = 'BOSS',                   // Top leader, full control
  UNDERBOSS = 'UNDERBOSS',         // Second in command
  CAPTAIN = 'CAPTAIN',             // Commands a crew/unit
  LIEUTENANT = 'LIEUTENANT',       // Mid-level command
  SOLDIER = 'SOLDIER',             // Standard operative
  ASSOCIATE = 'ASSOCIATE',         // Non-made member
  RECRUIT = 'RECRUIT',             // New member, probationary
}

/**
 * Organization Status
 */
export enum ParamilitaryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',       // Low activity
  UNDER_INVESTIGATION = 'UNDER_INVESTIGATION', // Law enforcement attention
  DISBANDED = 'DISBANDED',     // No longer operating
  AT_WAR = 'AT_WAR',           // Active conflict with another org
}

/**
 * Operation Types
 * 
 * Activities the organization can engage in.
 */
export enum OperationType {
  // Military/Police
  PATROL = 'PATROL',
  RAID = 'RAID',
  SECURITY = 'SECURITY',
  TRAINING = 'TRAINING',
  
  // Criminal
  EXTORTION = 'EXTORTION',
  SMUGGLING = 'SMUGGLING',
  DRUG_TRAFFICKING = 'DRUG_TRAFFICKING',
  MONEY_LAUNDERING = 'MONEY_LAUNDERING',
  ROBBERY = 'ROBBERY',
  GAMBLING = 'GAMBLING',
  LOAN_SHARKING = 'LOAN_SHARKING',
  
  // Both
  TERRITORY_CONTROL = 'TERRITORY_CONTROL',
  PROTECTION = 'PROTECTION',
  ASSASSINATION = 'ASSASSINATION',
  INTIMIDATION = 'INTIMIDATION',
  RECRUITMENT = 'RECRUITMENT',
}

/**
 * Contraband Types
 */
export enum ContrabandType {
  DRUGS = 'DRUGS',
  WEAPONS = 'WEAPONS',
  COUNTERFEIT_CURRENCY = 'COUNTERFEIT_CURRENCY',
  STOLEN_GOODS = 'STOLEN_GOODS',
  HUMANS = 'HUMANS',
  EXOTIC_ANIMALS = 'EXOTIC_ANIMALS',
  ILLEGAL_TECH = 'ILLEGAL_TECH',
}

/**
 * Conflict Status
 */
export enum ConflictStatus {
  COLD_WAR = 'COLD_WAR',       // Tension, no violence
  SKIRMISH = 'SKIRMISH',       // Small-scale violence
  FULL_WAR = 'FULL_WAR',       // Open warfare
  CEASEFIRE = 'CEASEFIRE',     // Temporary peace
  PEACE = 'PEACE',             // Conflict resolved
}

// ===================== INTERFACES =====================

/**
 * Paramilitary Member
 * 
 * Individual member of the organization.
 */
export interface ParamilitaryMember {
  /** Player ID */
  playerId: string;
  
  /** Display name (cached) */
  displayName: string;
  
  /** Role in organization */
  role: ParamilitaryMemberRole;
  
  /** When joined (epoch ms) */
  joinedAt: number;
  
  /** Kills/operations completed */
  operationsCompleted: number;
  
  /** Current standing (0-100) */
  standing: number;
  
  /** Share of profits (percentage) */
  profitShare: number;
  
  /** Whether currently active */
  active: boolean;
  
  /** Personal heat level (0-100) */
  personalHeat: number;
  
  /** Last active (epoch ms) */
  lastActiveAt: number;
}

/**
 * Troop Unit
 * 
 * A deployable unit of soldiers/operatives.
 */
export interface TroopUnit {
  /** Unique unit ID */
  id: string;
  
  /** Unit name */
  name: string;
  
  /** Number of troops */
  size: number;
  
  /** Combat effectiveness (0-100) */
  effectiveness: number;
  
  /** Current location (territory ID) */
  locationId: string;
  
  /** Whether deployed */
  deployed: boolean;
  
  /** Current assignment (operation ID) */
  assignmentId?: string;
  
  /** Equipment level (1-10) */
  equipmentLevel: number;
  
  /** Morale (0-100) */
  morale: number;
  
  /** Training level (1-10) */
  trainingLevel: number;
}

/**
 * Territory Control
 * 
 * Area under organization influence.
 */
export interface TerritoryControl {
  /** Territory ID */
  territoryId: string;
  
  /** Control percentage (0-100) */
  controlPercent: number;
  
  /** Weekly income from territory */
  weeklyIncome: number;
  
  /** Troops stationed */
  troopsStationed: number;
  
  /** When established (epoch ms) */
  establishedAt: number;
  
  /** Whether contested by another org */
  contested: boolean;
  
  /** Contesting org ID (if contested) */
  contestedBy?: string;
}

/**
 * Contraband Inventory Item
 */
export interface ContrabandItem {
  /** Type of contraband */
  type: ContrabandType;
  
  /** Quantity */
  quantity: number;
  
  /** Purchase price per unit */
  purchasePrice: number;
  
  /** Current street value per unit */
  streetValue: number;
  
  /** Quality (0-100) */
  quality: number;
  
  /** When acquired (epoch ms) */
  acquiredAt: number;
}

/**
 * Money Laundering Operation
 */
export interface LaunderingOperation {
  /** Unique operation ID */
  id: string;
  
  /** Front business ID */
  businessId: string;
  
  /** Business name */
  businessName: string;
  
  /** Dirty money input this cycle */
  dirtyMoneyInput: number;
  
  /** Clean money output this cycle */
  cleanMoneyOutput: number;
  
  /** Laundering efficiency (0-1) */
  efficiency: number;
  
  /** Risk of detection (0-1) */
  detectionRisk: number;
  
  /** Whether currently active */
  active: boolean;
  
  /** When established (epoch ms) */
  establishedAt: number;
}

/**
 * Active Conflict
 * 
 * War or conflict with another organization.
 */
export interface ActiveConflict {
  /** Conflict ID */
  id: string;
  
  /** Enemy organization ID */
  enemyOrgId: string;
  
  /** Enemy organization name */
  enemyOrgName: string;
  
  /** Conflict status */
  status: ConflictStatus;
  
  /** When started (epoch ms) */
  startedAt: number;
  
  /** Casualties suffered */
  casualtiesSuffered: number;
  
  /** Casualties inflicted */
  casualtiesInflicted: number;
  
  /** Territories lost */
  territoriesLost: number;
  
  /** Territories gained */
  territoriesGained: number;
  
  /** Whether we initiated */
  initiatedByUs: boolean;
}

/**
 * Organization Application
 */
export interface ParamilitaryApplication {
  /** Applicant player ID */
  playerId: string;
  
  /** Display name */
  displayName: string;
  
  /** Application message */
  message: string;
  
  /** When applied (epoch ms) */
  appliedAt: number;
  
  /** Status */
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  
  /** Reviewer ID */
  reviewedBy?: string;
  
  /** When reviewed */
  reviewedAt?: number;
  
  /** Rejection reason */
  rejectionReason?: string;
}

/**
 * Operation Record
 * 
 * Log of completed operations.
 */
export interface OperationRecord {
  /** Operation ID */
  id: string;
  
  /** Operation type */
  type: OperationType;
  
  /** Description */
  description: string;
  
  /** When executed (epoch ms) */
  executedAt: number;
  
  /** Whether successful */
  success: boolean;
  
  /** Revenue generated */
  revenue: number;
  
  /** Costs incurred */
  costs: number;
  
  /** Heat generated */
  heatGenerated: number;
  
  /** Casualties (if any) */
  casualties: number;
  
  /** Participants (member IDs) */
  participants: string[];
}

/**
 * Organization Strength Metrics
 */
export interface ParamilitaryStrength {
  /** Overall strength (0-100) */
  overall: number;
  
  /** Military power (0-100) */
  militaryPower: number;
  
  /** Financial strength (0-100) */
  financialStrength: number;
  
  /** Territory control (0-100) */
  territorialControl: number;
  
  /** Political influence (0-100) */
  politicalInfluence: number;
  
  /** Notoriety/reputation (0-100) */
  notoriety: number;
  
  /** Last calculated (epoch ms) */
  calculatedAt: number;
}

/**
 * Paramilitary Entity (Full)
 */
export interface Paramilitary {
  /** Unique ID */
  id: string;
  
  /** Organization name */
  name: string;
  
  /** URL-friendly slug */
  slug: string;
  
  /** Description/motto */
  description: string;
  
  /** Organization type */
  type: ParamilitaryType;
  
  /** Geographic scope */
  scope: ParamilitaryScope;
  
  /** State code (if STATE scope) */
  stateCode?: string;
  
  /** Status */
  status: ParamilitaryStatus;
  
  /** Founding player ID */
  founderId: string;
  
  /** Current boss/leader ID */
  bossId: string;
  
  /** When founded (epoch ms) */
  foundedAt: number;
  
  // Members & Troops
  
  /** Organization members */
  members: ParamilitaryMember[];
  
  /** Member count (cached) */
  memberCount: number;
  
  /** Troop units */
  troops: TroopUnit[];
  
  /** Total troop count (cached) */
  totalTroops: number;
  
  /** Pending applications */
  applications: ParamilitaryApplication[];
  
  // Finances
  
  /** Legitimate treasury */
  treasury: number;
  
  /** Dirty money (unlaundered) */
  dirtyMoney: number;
  
  /** Weekly expenses (payroll, equipment, etc.) */
  weeklyExpenses: number;
  
  /** Contraband inventory */
  contraband: ContrabandItem[];
  
  /** Money laundering operations */
  launderingOps: LaunderingOperation[];
  
  // Territory & Conflict
  
  /** Controlled territories */
  territories: TerritoryControl[];
  
  /** Active conflicts */
  conflicts: ActiveConflict[];
  
  /** Operation history (last 100) */
  operationHistory: OperationRecord[];
  
  // Risk & Status
  
  /** Organization heat level (0-100) */
  heatLevel: number;
  
  /** Law enforcement attention (0-100) */
  lawEnforcementAttention: number;
  
  /** Wanted level (0-5 stars) */
  wantedLevel: number;
  
  // Metrics
  
  /** Strength metrics */
  strength: ParamilitaryStrength;
  
  // Settings
  
  /** Whether accepting new members */
  recruiting: boolean;
  
  /** Minimum standing to join */
  minimumStandingRequired: number;
  
  /** Schema version */
  schemaVersion: number;
  
  /** Created timestamp */
  createdAt: number;
  
  /** Updated timestamp */
  updatedAt: number;
}

// ===================== HELPER TYPES =====================

/**
 * Create Paramilitary Request
 */
export interface CreateParamilitaryRequest {
  name: string;
  description: string;
  type: ParamilitaryType;
  scope: ParamilitaryScope;
  stateCode?: string;
  recruiting?: boolean;
}

/**
 * Update Paramilitary Request
 */
export interface UpdateParamilitaryRequest {
  description?: string;
  recruiting?: boolean;
  minimumStandingRequired?: number;
}

/**
 * Paramilitary Summary (for lists)
 */
export interface ParamilitarySummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: ParamilitaryType;
  scope: ParamilitaryScope;
  stateCode?: string;
  status: ParamilitaryStatus;
  memberCount: number;
  totalTroops: number;
  strength: number;
  bossId: string;
  bossName: string;
  heatLevel: number;
  wantedLevel: number;
  recruiting?: boolean;
  createdAt?: number | Date;
}

/**
 * Paramilitary Search Filters
 */
export interface ParamilitarySearchFilters {
  type?: ParamilitaryType;
  scope?: ParamilitaryScope;
  stateCode?: string;
  status?: ParamilitaryStatus;
  minMembers?: number;
  maxMembers?: number;
  minStrength?: number;
  maxHeat?: number;
  searchTerm?: string;
}

// ===================== PERMISSIONS =====================

/**
 * Role Permissions
 */
export const PARAMILITARY_ROLE_PERMISSIONS = {
  [ParamilitaryMemberRole.BOSS]: {
    canDisband: true,
    canKick: true,
    canPromote: true,
    canDemote: true,
    canApproveApplications: true,
    canManageTreasury: true,
    canLaunchOperations: true,
    canDeclareWar: true,
    canNegotiatePeace: true,
    canManageTerritories: true,
    profitShareMultiplier: 3,
  },
  [ParamilitaryMemberRole.UNDERBOSS]: {
    canDisband: false,
    canKick: true,
    canPromote: true,
    canDemote: true,
    canApproveApplications: true,
    canManageTreasury: true,
    canLaunchOperations: true,
    canDeclareWar: false,
    canNegotiatePeace: true,
    canManageTerritories: true,
    profitShareMultiplier: 2.5,
  },
  [ParamilitaryMemberRole.CAPTAIN]: {
    canDisband: false,
    canKick: true,
    canPromote: false,
    canDemote: false,
    canApproveApplications: true,
    canManageTreasury: false,
    canLaunchOperations: true,
    canDeclareWar: false,
    canNegotiatePeace: false,
    canManageTerritories: true,
    profitShareMultiplier: 2,
  },
  [ParamilitaryMemberRole.LIEUTENANT]: {
    canDisband: false,
    canKick: false,
    canPromote: false,
    canDemote: false,
    canApproveApplications: false,
    canManageTreasury: false,
    canLaunchOperations: true,
    canDeclareWar: false,
    canNegotiatePeace: false,
    canManageTerritories: false,
    profitShareMultiplier: 1.5,
  },
  [ParamilitaryMemberRole.SOLDIER]: {
    canDisband: false,
    canKick: false,
    canPromote: false,
    canDemote: false,
    canApproveApplications: false,
    canManageTreasury: false,
    canLaunchOperations: false,
    canDeclareWar: false,
    canNegotiatePeace: false,
    canManageTerritories: false,
    profitShareMultiplier: 1,
  },
  [ParamilitaryMemberRole.ASSOCIATE]: {
    canDisband: false,
    canKick: false,
    canPromote: false,
    canDemote: false,
    canApproveApplications: false,
    canManageTreasury: false,
    canLaunchOperations: false,
    canDeclareWar: false,
    canNegotiatePeace: false,
    canManageTerritories: false,
    profitShareMultiplier: 0.5,
  },
  [ParamilitaryMemberRole.RECRUIT]: {
    canDisband: false,
    canKick: false,
    canPromote: false,
    canDemote: false,
    canApproveApplications: false,
    canManageTreasury: false,
    canLaunchOperations: false,
    canDeclareWar: false,
    canNegotiatePeace: false,
    canManageTerritories: false,
    profitShareMultiplier: 0.25,
  },
} as const;

// ===================== LABELS =====================

/**
 * Type Labels (display)
 */
export const PARAMILITARY_TYPE_LABELS: Record<ParamilitaryType, string> = {
  [ParamilitaryType.MILITARY]: 'Military Force',
  [ParamilitaryType.POLICE]: 'Police Department',
  [ParamilitaryType.ORGANIZED_CRIME]: 'Organized Crime',
  [ParamilitaryType.PRIVATE_MILITARY]: 'Private Military Company',
  [ParamilitaryType.MILITIA]: 'Militia',
  [ParamilitaryType.SECURITY_FIRM]: 'Security Firm',
};

/**
 * Scope Labels (display)
 */
export const PARAMILITARY_SCOPE_LABELS: Record<ParamilitaryScope, string> = {
  [ParamilitaryScope.LOCAL]: 'Local',
  [ParamilitaryScope.STATE]: 'State',
  [ParamilitaryScope.REGIONAL]: 'Regional',
  [ParamilitaryScope.NATIONAL]: 'National',
  [ParamilitaryScope.INTERNATIONAL]: 'International',
};

/**
 * Status Labels (display)
 */
export const PARAMILITARY_STATUS_LABELS: Record<ParamilitaryStatus, string> = {
  [ParamilitaryStatus.ACTIVE]: 'Active',
  [ParamilitaryStatus.INACTIVE]: 'Inactive',
  [ParamilitaryStatus.UNDER_INVESTIGATION]: 'Under Investigation',
  [ParamilitaryStatus.DISBANDED]: 'Disbanded',
  [ParamilitaryStatus.AT_WAR]: 'At War',
};

/**
 * Role Labels (display)
 */
export const PARAMILITARY_ROLE_LABELS: Record<ParamilitaryMemberRole, string> = {
  [ParamilitaryMemberRole.BOSS]: 'Boss',
  [ParamilitaryMemberRole.UNDERBOSS]: 'Underboss',
  [ParamilitaryMemberRole.CAPTAIN]: 'Captain',
  [ParamilitaryMemberRole.LIEUTENANT]: 'Lieutenant',
  [ParamilitaryMemberRole.SOLDIER]: 'Soldier',
  [ParamilitaryMemberRole.ASSOCIATE]: 'Associate',
  [ParamilitaryMemberRole.RECRUIT]: 'Recruit',
};

/**
 * Operation Type Labels (display)
 */
export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  [OperationType.PATROL]: 'Patrol',
  [OperationType.RAID]: 'Raid',
  [OperationType.SECURITY]: 'Security Detail',
  [OperationType.TRAINING]: 'Training Exercise',
  [OperationType.EXTORTION]: 'Extortion',
  [OperationType.SMUGGLING]: 'Smuggling',
  [OperationType.DRUG_TRAFFICKING]: 'Drug Trafficking',
  [OperationType.MONEY_LAUNDERING]: 'Money Laundering',
  [OperationType.ROBBERY]: 'Robbery',
  [OperationType.GAMBLING]: 'Gambling Operation',
  [OperationType.LOAN_SHARKING]: 'Loan Sharking',
  [OperationType.TERRITORY_CONTROL]: 'Territory Control',
  [OperationType.PROTECTION]: 'Protection Racket',
  [OperationType.ASSASSINATION]: 'Assassination',
  [OperationType.INTIMIDATION]: 'Intimidation',
  [OperationType.RECRUITMENT]: 'Recruitment Drive',
};

/**
 * Contraband Type Labels (display)
 */
export const CONTRABAND_TYPE_LABELS: Record<ContrabandType, string> = {
  [ContrabandType.DRUGS]: 'Drugs',
  [ContrabandType.WEAPONS]: 'Weapons',
  [ContrabandType.COUNTERFEIT_CURRENCY]: 'Counterfeit Currency',
  [ContrabandType.STOLEN_GOODS]: 'Stolen Goods',
  [ContrabandType.HUMANS]: 'Human Trafficking',
  [ContrabandType.EXOTIC_ANIMALS]: 'Exotic Animals',
  [ContrabandType.ILLEGAL_TECH]: 'Illegal Technology',
};

/**
 * Conflict Status Labels (display)
 */
export const CONFLICT_STATUS_LABELS: Record<ConflictStatus, string> = {
  [ConflictStatus.COLD_WAR]: 'Cold War',
  [ConflictStatus.SKIRMISH]: 'Skirmish',
  [ConflictStatus.FULL_WAR]: 'Full War',
  [ConflictStatus.CEASEFIRE]: 'Ceasefire',
  [ConflictStatus.PEACE]: 'Peace',
};

// ===================== UTILITY TYPES =====================

/**
 * Paramilitary with member context
 */
export interface ParamilitaryWithMemberContext extends Paramilitary {
  /** Current user's membership (if any) */
  currentMembership?: ParamilitaryMember;
  
  /** Current user's permissions */
  permissions?: typeof PARAMILITARY_ROLE_PERMISSIONS[ParamilitaryMemberRole];
}

/**
 * Operation Proposal
 */
export interface OperationProposal {
  /** Unique proposal ID */
  id: string;
  
  /** Operation type */
  operationType: OperationType;
  
  /** Target (territory ID, business ID, etc.) */
  targetId: string;
  
  /** Description */
  description: string;
  
  /** Proposer player ID */
  proposedBy: string;
  
  /** When proposed (epoch ms) */
  proposedAt: number;
  
  /** Required approval level */
  requiredRole: ParamilitaryMemberRole;
  
  /** Estimated cost */
  estimatedCost: number;
  
  /** Estimated revenue */
  estimatedRevenue: number;
  
  /** Estimated heat generated */
  estimatedHeat: number;
  
  /** Troops required */
  troopsRequired: number;
  
  /** Status */
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
}

/**
 * Heat Reduction Action
 */
export interface HeatReductionAction {
  type: 'BRIBE' | 'LAY_LOW' | 'LEGAL_DEFENSE' | 'WITNESS_ELIMINATION';
  cost: number;
  heatReduction: number;
  riskOfBackfire: number;
}

/**
 * SCHEMA VERSION
 */
export const PARAMILITARY_SCHEMA_VERSION = 1;
