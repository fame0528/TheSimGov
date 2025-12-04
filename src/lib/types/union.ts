/**
 * @file src/lib/types/union.ts
 * @description Type definitions for Labor Unions and Worker Organizations
 * @module lib/types/union
 * 
 * OVERVIEW:
 * Defines all types for labor unions - organizations that represent workers,
 * negotiate with employers, and engage in collective bargaining. Unions can
 * organize strikes, endorse candidates, and lobby for legislation.
 * 
 * KEY CONCEPTS:
 * - Unions organize workers within specific industries/sectors
 * - Members pay dues and can participate in collective actions
 * - Unions negotiate contracts, wages, and working conditions
 * - Political activities include endorsements and lobbying
 * - Strike actions can affect economic and political outcomes
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import { PoliticalIssue } from './demographics';

// ===================== ENUMS =====================

/**
 * Industry sectors that unions can organize
 */
export enum UnionSector {
  // Private Sector
  MANUFACTURING = 'MANUFACTURING',
  CONSTRUCTION = 'CONSTRUCTION',
  TRANSPORTATION = 'TRANSPORTATION',
  RETAIL = 'RETAIL',
  HOSPITALITY = 'HOSPITALITY',
  HEALTHCARE = 'HEALTHCARE',
  TECHNOLOGY = 'TECHNOLOGY',
  FINANCE = 'FINANCE',
  AGRICULTURE = 'AGRICULTURE',
  MINING = 'MINING',
  UTILITIES = 'UTILITIES',
  COMMUNICATIONS = 'COMMUNICATIONS',
  
  // Public Sector
  EDUCATION = 'EDUCATION',
  GOVERNMENT = 'GOVERNMENT',
  LAW_ENFORCEMENT = 'LAW_ENFORCEMENT',
  FIREFIGHTERS = 'FIREFIGHTERS',
  POSTAL = 'POSTAL',
  
  // Other
  ENTERTAINMENT = 'ENTERTAINMENT',
  JOURNALISM = 'JOURNALISM',
  FOOD_SERVICE = 'FOOD_SERVICE',
  JANITORIAL = 'JANITORIAL',
  GENERAL = 'GENERAL', // Catch-all for cross-industry
}

/**
 * Geographic scope of union organization
 */
export enum UnionScope {
  LOCAL = 'LOCAL',           // Single location/chapter
  REGIONAL = 'REGIONAL',     // Multi-state region
  STATE = 'STATE',           // Statewide
  NATIONAL = 'NATIONAL',     // Nationwide
  INTERNATIONAL = 'INTERNATIONAL', // Cross-border
}

/**
 * Current status of the union
 */
export enum UnionStatus {
  ORGANIZING = 'ORGANIZING', // Gathering initial membership
  ACTIVE = 'ACTIVE',         // Fully operational
  STRIKING = 'STRIKING',     // Currently on strike
  NEGOTIATING = 'NEGOTIATING', // In contract negotiations
  INACTIVE = 'INACTIVE',     // Temporarily dormant
  DECERTIFIED = 'DECERTIFIED', // Lost certification
  DISSOLVED = 'DISSOLVED',   // Permanently ended
}

/**
 * Member roles within the union
 */
export enum UnionMemberRole {
  PRESIDENT = 'PRESIDENT',       // Top elected leader
  VICE_PRESIDENT = 'VICE_PRESIDENT',
  SECRETARY = 'SECRETARY',       // Records and communications
  TREASURER = 'TREASURER',       // Financial management
  STEWARD = 'STEWARD',          // Shop floor representative
  ORGANIZER = 'ORGANIZER',      // Recruitment specialist
  DELEGATE = 'DELEGATE',        // Convention representative
  MEMBER = 'MEMBER',            // Regular dues-paying member
}

/**
 * Types of collective actions
 */
export enum CollectiveAction {
  STRIKE = 'STRIKE',                 // Work stoppage
  SLOWDOWN = 'SLOWDOWN',             // Reduced productivity
  WORK_TO_RULE = 'WORK_TO_RULE',     // Strict adherence to rules
  SICK_OUT = 'SICK_OUT',             // Mass sick leave
  PICKETING = 'PICKETING',           // Demonstration
  BOYCOTT = 'BOYCOTT',               // Consumer action
  SOLIDARITY_STRIKE = 'SOLIDARITY_STRIKE', // Supporting other unions
  LOCKOUT_RESPONSE = 'LOCKOUT_RESPONSE',   // Employer locked out workers
}

/**
 * Status of a collective action
 */
export enum ActionStatus {
  PROPOSED = 'PROPOSED',     // Being considered
  VOTING = 'VOTING',         // Members voting
  APPROVED = 'APPROVED',     // Approved, not started
  ACTIVE = 'ACTIVE',         // Currently ongoing
  SUSPENDED = 'SUSPENDED',   // Temporarily paused
  RESOLVED = 'RESOLVED',     // Ended successfully
  FAILED = 'FAILED',         // Ended unsuccessfully
  CANCELLED = 'CANCELLED',   // Called off
}

/**
 * Types of contracts/agreements
 */
export enum ContractType {
  COLLECTIVE_BARGAINING = 'COLLECTIVE_BARGAINING', // Standard CBA
  PROJECT_LABOR = 'PROJECT_LABOR',                 // Specific project
  MASTER = 'MASTER',                               // Industry-wide
  PATTERN = 'PATTERN',                             // Template for sector
  INTERIM = 'INTERIM',                             // Temporary agreement
}

// ===================== DISPLAY LABELS =====================

export const UNION_SECTOR_LABELS: Record<UnionSector, string> = {
  [UnionSector.MANUFACTURING]: 'Manufacturing',
  [UnionSector.CONSTRUCTION]: 'Construction & Building Trades',
  [UnionSector.TRANSPORTATION]: 'Transportation & Logistics',
  [UnionSector.RETAIL]: 'Retail & Commerce',
  [UnionSector.HOSPITALITY]: 'Hospitality & Tourism',
  [UnionSector.HEALTHCARE]: 'Healthcare & Medical',
  [UnionSector.TECHNOLOGY]: 'Technology & IT',
  [UnionSector.FINANCE]: 'Finance & Banking',
  [UnionSector.AGRICULTURE]: 'Agriculture & Farming',
  [UnionSector.MINING]: 'Mining & Extraction',
  [UnionSector.UTILITIES]: 'Utilities & Energy',
  [UnionSector.COMMUNICATIONS]: 'Communications & Telecom',
  [UnionSector.EDUCATION]: 'Education (Public)',
  [UnionSector.GOVERNMENT]: 'Government Workers',
  [UnionSector.LAW_ENFORCEMENT]: 'Law Enforcement',
  [UnionSector.FIREFIGHTERS]: 'Firefighters & EMS',
  [UnionSector.POSTAL]: 'Postal & Mail Services',
  [UnionSector.ENTERTAINMENT]: 'Entertainment & Media',
  [UnionSector.JOURNALISM]: 'Journalism & Press',
  [UnionSector.FOOD_SERVICE]: 'Food Service & Restaurant',
  [UnionSector.JANITORIAL]: 'Janitorial & Cleaning',
  [UnionSector.GENERAL]: 'General Workers',
};

export const UNION_STATUS_LABELS: Record<UnionStatus, string> = {
  [UnionStatus.ORGANIZING]: 'Organizing',
  [UnionStatus.ACTIVE]: 'Active',
  [UnionStatus.STRIKING]: 'On Strike',
  [UnionStatus.NEGOTIATING]: 'In Negotiations',
  [UnionStatus.INACTIVE]: 'Inactive',
  [UnionStatus.DECERTIFIED]: 'Decertified',
  [UnionStatus.DISSOLVED]: 'Dissolved',
};

export const UNION_ROLE_LABELS: Record<UnionMemberRole, string> = {
  [UnionMemberRole.PRESIDENT]: 'President',
  [UnionMemberRole.VICE_PRESIDENT]: 'Vice President',
  [UnionMemberRole.SECRETARY]: 'Secretary',
  [UnionMemberRole.TREASURER]: 'Treasurer',
  [UnionMemberRole.STEWARD]: 'Shop Steward',
  [UnionMemberRole.ORGANIZER]: 'Organizer',
  [UnionMemberRole.DELEGATE]: 'Delegate',
  [UnionMemberRole.MEMBER]: 'Member',
};

export const COLLECTIVE_ACTION_LABELS: Record<CollectiveAction, string> = {
  [CollectiveAction.STRIKE]: 'Strike',
  [CollectiveAction.SLOWDOWN]: 'Work Slowdown',
  [CollectiveAction.WORK_TO_RULE]: 'Work-to-Rule',
  [CollectiveAction.SICK_OUT]: 'Sick-Out',
  [CollectiveAction.PICKETING]: 'Picketing',
  [CollectiveAction.BOYCOTT]: 'Boycott',
  [CollectiveAction.SOLIDARITY_STRIKE]: 'Solidarity Strike',
  [CollectiveAction.LOCKOUT_RESPONSE]: 'Lockout Response',
};

// ===================== INTERFACES =====================

/**
 * Permission set for union roles
 */
export interface UnionRolePermissions {
  canCallMeetings: boolean;
  canManageFinances: boolean;
  canNegotiateContracts: boolean;
  canCallActions: boolean;       // Call for strikes, etc.
  canAdmitMembers: boolean;
  canRemoveMembers: boolean;
  canModifyBylaws: boolean;
  canEndorse: boolean;
  canVote: boolean;
}

/**
 * Union member information
 */
export interface UnionMember {
  playerId: string;
  displayName: string;
  role: UnionMemberRole;
  workplace?: string;            // Employer/workplace name
  jobTitle?: string;
  joinedAt: number;
  totalDuesPaid: number;
  standing: number;              // 0-100 standing in union
  meetingsAttended: number;
  actionsParticipated: number;   // Strikes, pickets, etc.
  lastActiveAt: number;
  duesPaidCurrentCycle: boolean;
  isOfficer: boolean;           // Holds elected position
  electedAt?: number;           // When elected to current position
  termEnds?: number;            // When current term ends
}

/**
 * Application to join the union
 */
export interface UnionApplication {
  playerId: string;
  displayName: string;
  workplace: string;
  jobTitle: string;
  appliedAt: number;
  message?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: number;
  rejectionReason?: string;
}

/**
 * Union position on a political issue
 */
export interface UnionIssuePosition {
  issue: PoliticalIssue;
  position: number;              // -5 to +5
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  statement?: string;            // Official position statement
  adoptedAt: number;
  votedOn: boolean;
}

/**
 * Political endorsement by the union
 */
export interface UnionEndorsement {
  candidateId: string;
  candidateName: string;
  race: string;                  // e.g., "US Senate - California"
  electionId: string;
  endorsedAt: number;
  endorsementLevel: 'FULL' | 'CONDITIONAL' | 'NO_ENDORSEMENT';
  statement?: string;
  donationAmount?: number;       // PAC contribution
  active: boolean;
}

/**
 * Legislative position (support/oppose bills)
 */
export interface UnionLegislativePosition {
  billId: string;
  billTitle: string;
  position: 'SUPPORT' | 'OPPOSE' | 'NEUTRAL' | 'WATCHING';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  statement?: string;
  lobbyingBudget?: number;
  adoptedAt: number;
}

/**
 * Collective action record (strike, etc.)
 */
export interface CollectiveActionRecord {
  id: string;
  type: CollectiveAction;
  status: ActionStatus;
  
  // Target
  targetEmployers: string[];     // Company IDs or names
  targetIndustry?: UnionSector;
  
  // Timing
  proposedAt: number;
  voteStartedAt?: number;
  voteEndedAt?: number;
  startedAt?: number;
  endedAt?: number;
  
  // Voting
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  requiredApproval: number;      // Percentage needed (e.g., 66)
  
  // Participation
  participantCount: number;
  expectedParticipants: number;
  
  // Demands
  demands: string[];
  
  // Outcome
  outcome?: {
    success: boolean;
    demandsMetPct: number;       // 0-100
    concessions: string[];
    memberSacrifices: string[];  // What members gave up
    publicOpinionImpact: number; // -100 to +100
    economicImpact: number;      // Dollars affected
  };
  
  // Support
  strikesFundUsed: number;
  externalSupport: {
    unionId: string;
    unionName: string;
    amount: number;
    type: 'FINANCIAL' | 'SOLIDARITY' | 'BOTH';
  }[];
}

/**
 * Labor contract/agreement
 */
export interface LaborContract {
  id: string;
  type: ContractType;
  employerId: string;
  employerName: string;
  
  // Terms
  effectiveDate: number;
  expirationDate: number;
  
  // Wages
  wageIncreasePct: number;
  minimumWage?: number;
  costOfLivingAdjustment: boolean;
  
  // Benefits
  healthcareCoverage: 'NONE' | 'BASIC' | 'STANDARD' | 'PREMIUM';
  pensionContributionPct: number;
  paidTimeOffDays: number;
  sickDays: number;
  parentalLeaveDays: number;
  
  // Working conditions
  workweekHours: number;
  overtimeRate: number;          // Multiplier (e.g., 1.5)
  safetyProvisions: string[];
  
  // Job security
  justCauseTermination: boolean;
  seniorityProtections: boolean;
  layoffNoticeWeeks: number;
  
  // Status
  status: 'DRAFT' | 'NEGOTIATING' | 'RATIFIED' | 'EXPIRED' | 'TERMINATED';
  ratifiedAt?: number;
  memberApprovalPct?: number;
  
  negotiatedBy: string[];        // Member IDs who negotiated
}

/**
 * Union strength metrics
 */
export interface UnionStrength {
  overall: number;               // 0-100 composite score
  membershipScore: number;       // Based on member count and growth
  densityScore: number;          // Percentage of workers in sector organized
  treasuryScore: number;         // Financial health
  contractStrength: number;      // Quality of existing contracts
  politicalInfluence: number;    // Endorsement success, lobbying
  actionCapacity: number;        // Ability to execute collective actions
  solidarityScore: number;       // Support from other unions
  calculatedAt: number;
}

/**
 * Dues configuration
 */
export interface UnionDuesConfig {
  amountPerCycle: number;
  cycleDays: number;             // Usually 30 (monthly) or 14 (bi-weekly)
  percentageOfWages?: number;    // Alternative: % of wages
  gracePeriodDays: number;
  mandatory: boolean;
  reducedRateForUnemployed: boolean;
  strikeFundAllocation: number;  // % of dues to strike fund
}

/**
 * Union finances
 */
export interface UnionFinances {
  generalFund: number;
  strikeFund: number;
  politicalActionFund: number;   // PAC money
  educationFund: number;
  emergencyFund: number;
  monthlyIncome: number;         // From dues
  monthlyExpenses: number;
  lastAuditDate?: number;
}

/**
 * Relationship with another union
 */
export interface UnionRelationship {
  unionId: string;
  unionName: string;
  type: 'FEDERATION' | 'AFFILIATE' | 'RIVAL' | 'ALLY' | 'NEUTRAL';
  relationship: number;          // -100 to +100
  mutualAidAgreement: boolean;
  establishedAt: number;
}

/**
 * Main Union interface
 */
export interface Union {
  // Identity
  id: string;
  name: string;
  slug: string;
  acronym?: string;              // e.g., "UAW", "IBEW", "SEIU"
  description: string;
  motto?: string;
  
  // Classification
  sector: UnionSector;
  scope: UnionScope;
  status: UnionStatus;
  
  // Location
  stateCode?: string;            // Primary state for state/local unions
  headquarters: {
    address?: string;
    city: string;
    stateCode: string;
    zipCode?: string;
  };
  
  // Leadership
  founderId: string;
  presidentId: string;
  foundedAt: number;
  
  // Membership
  members: UnionMember[];
  memberCount: number;
  potentialMembers: number;      // Workers in sector not yet organized
  applications: UnionApplication[];
  
  // Finances
  finances: UnionFinances;
  duesConfig: UnionDuesConfig;
  
  // Political activity
  issuePositions: UnionIssuePosition[];
  endorsements: UnionEndorsement[];
  legislativePositions: UnionLegislativePosition[];
  
  // Collective action
  actions: CollectiveActionRecord[];
  lastStrike?: number;
  strikeDaysThisYear: number;
  
  // Contracts
  contracts: LaborContract[];
  activeContractCount: number;
  
  // Strength and influence
  strength: UnionStrength;
  
  // Relationships
  relationships: UnionRelationship[];
  federationId?: string;         // Parent federation (e.g., AFL-CIO)
  affiliateUnionIds: string[];   // Child/affiliate unions
  
  // Settings
  isPublic: boolean;
  membershipOpen: boolean;
  requiresWorkplaceVerification: boolean;
  minimumStandingRequired: number;
  
  // Metadata
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Summary for list views
 */
export interface UnionSummary {
  id: string;
  name: string;
  slug: string;
  acronym?: string;
  sector: UnionSector;
  sectorLabel: string;
  scope: UnionScope;
  status: UnionStatus;
  statusLabel: string;
  stateCode?: string;
  memberCount: number;
  strength: number;
  presidentId: string;
  presidentName?: string;
  isPublic: boolean;
  membershipOpen: boolean;
  currentlyStriking: boolean;
  createdAt: number;
}

/**
 * Input for creating a union
 */
export interface CreateUnionInput {
  name: string;
  acronym?: string;
  description: string;
  motto?: string;
  sector: UnionSector;
  scope: UnionScope;
  stateCode?: string;
  headquarters: {
    address?: string;
    city: string;
    stateCode: string;
    zipCode?: string;
  };
  duesConfig?: Partial<UnionDuesConfig>;
  isPublic?: boolean;
  membershipOpen?: boolean;
}

/**
 * Input for updating a union
 */
export interface UpdateUnionInput {
  description?: string;
  motto?: string;
  status?: UnionStatus;
  isPublic?: boolean;
  membershipOpen?: boolean;
  requiresWorkplaceVerification?: boolean;
  minimumStandingRequired?: number;
  duesConfig?: Partial<UnionDuesConfig>;
  headquarters?: Partial<Union['headquarters']>;
}

// ===================== ROLE PERMISSIONS =====================

/**
 * Role-based permissions for union operations
 */
export const UNION_ROLE_PERMISSIONS: Record<UnionMemberRole, UnionRolePermissions> = {
  [UnionMemberRole.PRESIDENT]: {
    canCallMeetings: true,
    canManageFinances: true,
    canNegotiateContracts: true,
    canCallActions: true,
    canAdmitMembers: true,
    canRemoveMembers: true,
    canModifyBylaws: true,
    canEndorse: true,
    canVote: true,
  },
  [UnionMemberRole.VICE_PRESIDENT]: {
    canCallMeetings: true,
    canManageFinances: true,
    canNegotiateContracts: true,
    canCallActions: true,
    canAdmitMembers: true,
    canRemoveMembers: true,
    canModifyBylaws: false,
    canEndorse: true,
    canVote: true,
  },
  [UnionMemberRole.SECRETARY]: {
    canCallMeetings: true,
    canManageFinances: false,
    canNegotiateContracts: false,
    canCallActions: false,
    canAdmitMembers: true,
    canRemoveMembers: false,
    canModifyBylaws: false,
    canEndorse: false,
    canVote: true,
  },
  [UnionMemberRole.TREASURER]: {
    canCallMeetings: false,
    canManageFinances: true,
    canNegotiateContracts: false,
    canCallActions: false,
    canAdmitMembers: false,
    canRemoveMembers: false,
    canModifyBylaws: false,
    canEndorse: false,
    canVote: true,
  },
  [UnionMemberRole.STEWARD]: {
    canCallMeetings: false,
    canManageFinances: false,
    canNegotiateContracts: true,
    canCallActions: false,
    canAdmitMembers: true,
    canRemoveMembers: false,
    canModifyBylaws: false,
    canEndorse: false,
    canVote: true,
  },
  [UnionMemberRole.ORGANIZER]: {
    canCallMeetings: false,
    canManageFinances: false,
    canNegotiateContracts: false,
    canCallActions: false,
    canAdmitMembers: true,
    canRemoveMembers: false,
    canModifyBylaws: false,
    canEndorse: false,
    canVote: true,
  },
  [UnionMemberRole.DELEGATE]: {
    canCallMeetings: false,
    canManageFinances: false,
    canNegotiateContracts: false,
    canCallActions: false,
    canAdmitMembers: false,
    canRemoveMembers: false,
    canModifyBylaws: false,
    canEndorse: true,
    canVote: true,
  },
  [UnionMemberRole.MEMBER]: {
    canCallMeetings: false,
    canManageFinances: false,
    canNegotiateContracts: false,
    canCallActions: false,
    canAdmitMembers: false,
    canRemoveMembers: false,
    canModifyBylaws: false,
    canEndorse: false,
    canVote: true,
  },
};

// ===================== CONSTANTS =====================

/**
 * Strike fund minimum as percentage of treasury
 */
export const STRIKE_FUND_MINIMUM_PCT = 20;

/**
 * Minimum members to certify as union
 */
export const MINIMUM_MEMBERS_FOR_CERTIFICATION = 3;

/**
 * Standard dues percentage of wages
 */
export const STANDARD_DUES_PERCENTAGE = 1.5;

/**
 * Days notice required for strike
 */
export const STRIKE_NOTICE_DAYS = 10;

/**
 * Approval percentage required for strike
 */
export const STRIKE_APPROVAL_THRESHOLD = 66;
