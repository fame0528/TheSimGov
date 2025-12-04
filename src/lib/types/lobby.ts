/**
 * @fileoverview Lobby Types - Interest Group/Lobby Organization Types
 * @module lib/types/lobby
 * 
 * OVERVIEW:
 * Types for player-created interest groups (lobbies). Lobbies are organizations
 * that pool resources and influence to affect legislation, endorse candidates,
 * and shape political outcomes. All lobbies are player-created and player-run.
 * 
 * DESIGN PRINCIPLES:
 * - All lobbies are created by players (no system-generated lobbies)
 * - Leadership is player-controlled with elections/succession
 * - Members contribute dues, gain influence within the lobby
 * - Lobbies operate at both state and national levels
 * - Strength is determined by membership, treasury, and activity
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import type { PoliticalIssue } from './demographics';

// ===================== ENUMS =====================

/**
 * Lobby Focus Area
 * 
 * The primary policy domain the lobby focuses on.
 * Determines which legislation types the lobby can effectively influence.
 */
export enum LobbyFocus {
  HEALTHCARE = 'HEALTHCARE',
  ENVIRONMENT = 'ENVIRONMENT',
  BUSINESS = 'BUSINESS',
  LABOR = 'LABOR',
  CIVIL_RIGHTS = 'CIVIL_RIGHTS',
  EDUCATION = 'EDUCATION',
  DEFENSE = 'DEFENSE',
  AGRICULTURE = 'AGRICULTURE',
  TECHNOLOGY = 'TECHNOLOGY',
  FINANCE = 'FINANCE',
  ENERGY = 'ENERGY',
  TRADE = 'TRADE',
}

/**
 * Member Role within Lobby
 * 
 * Hierarchy determines permissions and voting weight.
 */
export enum LobbyMemberRole {
  LEADER = 'LEADER',           // Full control, can disband
  OFFICER = 'OFFICER',         // Can approve members, manage treasury
  SENIOR = 'SENIOR',           // Higher voting weight, can propose actions
  MEMBER = 'MEMBER',           // Standard member
  PROBATIONARY = 'PROBATIONARY', // New member, limited permissions
}

/**
 * Lobby Action Types
 * 
 * Actions the lobby can take collectively.
 */
export enum LobbyActionType {
  ENDORSE_CANDIDATE = 'ENDORSE_CANDIDATE',
  OPPOSE_CANDIDATE = 'OPPOSE_CANDIDATE',
  SUPPORT_LEGISLATION = 'SUPPORT_LEGISLATION',
  OPPOSE_LEGISLATION = 'OPPOSE_LEGISLATION',
  LAUNCH_CAMPAIGN = 'LAUNCH_CAMPAIGN',
  ISSUE_STATEMENT = 'ISSUE_STATEMENT',
  DONATE_TO_CANDIDATE = 'DONATE_TO_CANDIDATE',
  CALL_MEETING = 'CALL_MEETING',
}

/**
 * Lobby Scope
 * 
 * Geographic reach of the lobby.
 */
export enum LobbyScope {
  LOCAL = 'LOCAL',       // Single district/city
  STATE = 'STATE',       // Single state
  REGIONAL = 'REGIONAL', // Multiple states
  NATIONAL = 'NATIONAL', // Entire nation
}

/**
 * Lobby Status
 */
export enum LobbyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',     // Low activity, reduced influence
  SUSPENDED = 'SUSPENDED',   // Temporarily banned for violations
  DISBANDED = 'DISBANDED',   // Permanently closed
}

// ===================== INTERFACES =====================

/**
 * Lobby Member
 * 
 * Represents a player's membership in a lobby.
 */
export interface LobbyMember {
  /** Player ID */
  playerId: string;
  
  /** Display name (cached for performance) */
  displayName: string;
  
  /** Role in the lobby */
  role: LobbyMemberRole;
  
  /** When joined (epoch ms) */
  joinedAt: number;
  
  /** Total dues paid (lifetime) */
  totalDuesPaid: number;
  
  /** Current standing (0-100, affects voting weight) */
  standing: number;
  
  /** Votes cast in lobby decisions */
  votesCast: number;
  
  /** Actions proposed */
  actionsProposed: number;
  
  /** Last active (epoch ms) */
  lastActiveAt: number;
  
  /** Whether member has paid current dues */
  duesPaidCurrentCycle: boolean;
}

/**
 * Lobby Dues Configuration
 * 
 * How member contributions work.
 */
export interface LobbyDuesConfig {
  /** Amount per cycle (game currency) */
  amountPerCycle: number;
  
  /** Cycle duration in game days */
  cycleDays: number;
  
  /** Grace period in days before suspension */
  gracePeriodDays: number;
  
  /** Whether dues are mandatory */
  mandatory: boolean;
}

/**
 * Lobby Issue Position
 * 
 * The lobby's official stance on a political issue.
 */
export interface LobbyIssuePosition {
  /** The political issue */
  issue: PoliticalIssue;
  
  /** Position (-5 strongly against to +5 strongly for) */
  position: number;
  
  /** Priority (1-10, how important this issue is to the lobby) */
  priority: number;
  
  /** When last updated (epoch ms) */
  updatedAt: number;
}

/**
 * Lobby Endorsement Record
 * 
 * Tracks candidates the lobby has endorsed or opposed.
 */
export interface LobbyEndorsement {
  /** Campaign/candidate ID */
  campaignId: string;
  
  /** Candidate player ID */
  candidatePlayerId: string;
  
  /** Endorsement or opposition */
  type: 'ENDORSE' | 'OPPOSE';
  
  /** When issued (epoch ms) */
  issuedAt: number;
  
  /** Election cycle this applies to */
  cycleSequence: number;
  
  /** Funds contributed (if any) */
  fundsContributed: number;
  
  /** Whether still active */
  active: boolean;
}

/**
 * Lobby Legislative Position
 * 
 * The lobby's stance on a specific piece of legislation.
 */
export interface LobbyLegislativePosition {
  /** Bill ID */
  billId: string;
  
  /** Support or oppose */
  stance: 'SUPPORT' | 'OPPOSE' | 'NEUTRAL';
  
  /** Priority (1-10) */
  priority: number;
  
  /** Resources committed */
  resourcesCommitted: number;
  
  /** When decided (epoch ms) */
  decidedAt: number;
}

/**
 * Lobby Strength Metrics
 * 
 * Calculated metrics determining lobby influence.
 */
export interface LobbyStrength {
  /** Overall strength score (0-100) */
  overall: number;
  
  /** Membership score (0-100) */
  membershipScore: number;
  
  /** Treasury score (0-100) */
  treasuryScore: number;
  
  /** Activity score (0-100) */
  activityScore: number;
  
  /** Success rate on past actions (0-1) */
  successRate: number;
  
  /** Last calculated (epoch ms) */
  calculatedAt: number;
}

/**
 * Lobby Action Proposal
 * 
 * A proposed action awaiting member vote.
 */
export interface LobbyActionProposal {
  /** Unique proposal ID */
  id: string;
  
  /** Action type */
  actionType: LobbyActionType;
  
  /** Target (candidate ID, bill ID, etc.) */
  targetId: string;
  
  /** Description */
  description: string;
  
  /** Proposer player ID */
  proposedBy: string;
  
  /** When proposed (epoch ms) */
  proposedAt: number;
  
  /** Voting deadline (epoch ms) */
  votingDeadline: number;
  
  /** Votes for */
  votesFor: number;
  
  /** Votes against */
  votesAgainst: number;
  
  /** Votes abstain */
  votesAbstain: number;
  
  /** Player IDs who have voted */
  voterIds: string[];
  
  /** Cost to execute (from treasury) */
  cost: number;
  
  /** Status */
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'EXPIRED';
}

/**
 * Lobby Application
 * 
 * Pending membership application.
 */
export interface LobbyApplication {
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
  
  /** Reviewer player ID (if decided) */
  reviewedBy?: string;
  
  /** When reviewed (epoch ms) */
  reviewedAt?: number;
  
  /** Rejection reason (if rejected) */
  rejectionReason?: string;
}

/**
 * Lobby Entity (Full)
 * 
 * Complete representation of a lobby/interest group.
 */
export interface Lobby {
  /** Unique ID */
  id: string;
  
  /** Display name */
  name: string;
  
  /** URL-friendly slug */
  slug: string;
  
  /** Description/mission statement */
  description: string;
  
  /** Lobby focus area */
  focus: LobbyFocus;
  
  /** Geographic scope */
  scope: LobbyScope;
  
  /** State code (if STATE scope) */
  stateCode?: string;
  
  /** Status */
  status: LobbyStatus;
  
  /** Founding player ID */
  founderId: string;
  
  /** Current leader player ID */
  leaderId: string;
  
  /** When founded (epoch ms) */
  foundedAt: number;
  
  /** Members */
  members: LobbyMember[];
  
  /** Member count (cached for queries) */
  memberCount: number;
  
  /** Pending applications */
  applications: LobbyApplication[];
  
  /** Treasury balance */
  treasury: number;
  
  /** Dues configuration */
  duesConfig: LobbyDuesConfig;
  
  /** Issue positions */
  issuePositions: LobbyIssuePosition[];
  
  /** Active endorsements */
  endorsements: LobbyEndorsement[];
  
  /** Legislative positions */
  legislativePositions: LobbyLegislativePosition[];
  
  /** Pending action proposals */
  proposals: LobbyActionProposal[];
  
  /** Strength metrics */
  strength: LobbyStrength;
  
  /** Invite-only? */
  inviteOnly: boolean;
  
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
 * Create Lobby Request
 */
export interface CreateLobbyRequest {
  name: string;
  description: string;
  focus: LobbyFocus;
  scope: LobbyScope;
  stateCode?: string;
  inviteOnly?: boolean;
  duesConfig?: Partial<LobbyDuesConfig>;
}

/**
 * Update Lobby Request
 */
export interface UpdateLobbyRequest {
  description?: string;
  inviteOnly?: boolean;
  duesConfig?: Partial<LobbyDuesConfig>;
  minimumStandingRequired?: number;
}

/**
 * Lobby Summary (for lists)
 */
export interface LobbySummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  focus: LobbyFocus;
  scope: LobbyScope;
  stateCode?: string;
  status: LobbyStatus;
  memberCount: number;
  strength: number;
  leaderId: string;
  leaderName: string;
  inviteOnly?: boolean;
  createdAt?: number | Date;
}

/**
 * Lobby Search Filters
 */
export interface LobbySearchFilters {
  focus?: LobbyFocus;
  scope?: LobbyScope;
  stateCode?: string;
  status?: LobbyStatus;
  minMembers?: number;
  maxMembers?: number;
  minStrength?: number;
  searchTerm?: string;
}

/**
 * Role Permissions
 */
export const LOBBY_ROLE_PERMISSIONS = {
  [LobbyMemberRole.LEADER]: {
    canDisband: true,
    canKick: true,
    canPromote: true,
    canDemote: true,
    canApproveApplications: true,
    canManageTreasury: true,
    canProposeActions: true,
    canVote: true,
    votingWeight: 3,
  },
  [LobbyMemberRole.OFFICER]: {
    canDisband: false,
    canKick: true,
    canPromote: true,
    canDemote: true,
    canApproveApplications: true,
    canManageTreasury: true,
    canProposeActions: true,
    canVote: true,
    votingWeight: 2,
  },
  [LobbyMemberRole.SENIOR]: {
    canDisband: false,
    canKick: false,
    canPromote: false,
    canDemote: false,
    canApproveApplications: false,
    canManageTreasury: false,
    canProposeActions: true,
    canVote: true,
    votingWeight: 1.5,
  },
  [LobbyMemberRole.MEMBER]: {
    canDisband: false,
    canKick: false,
    canPromote: false,
    canDemote: false,
    canApproveApplications: false,
    canManageTreasury: false,
    canProposeActions: false,
    canVote: true,
    votingWeight: 1,
  },
  [LobbyMemberRole.PROBATIONARY]: {
    canDisband: false,
    canKick: false,
    canPromote: false,
    canDemote: false,
    canApproveApplications: false,
    canManageTreasury: false,
    canProposeActions: false,
    canVote: false,
    votingWeight: 0,
  },
} as const;

/**
 * Focus Labels (display)
 */
export const LOBBY_FOCUS_LABELS: Record<LobbyFocus, string> = {
  [LobbyFocus.HEALTHCARE]: 'Healthcare',
  [LobbyFocus.ENVIRONMENT]: 'Environment',
  [LobbyFocus.BUSINESS]: 'Business & Commerce',
  [LobbyFocus.LABOR]: 'Labor & Workers',
  [LobbyFocus.CIVIL_RIGHTS]: 'Civil Rights',
  [LobbyFocus.EDUCATION]: 'Education',
  [LobbyFocus.DEFENSE]: 'Defense & Security',
  [LobbyFocus.AGRICULTURE]: 'Agriculture',
  [LobbyFocus.TECHNOLOGY]: 'Technology',
  [LobbyFocus.FINANCE]: 'Finance & Banking',
  [LobbyFocus.ENERGY]: 'Energy',
  [LobbyFocus.TRADE]: 'Trade & Commerce',
};

/**
 * Scope Labels (display)
 */
export const LOBBY_SCOPE_LABELS: Record<LobbyScope, string> = {
  [LobbyScope.LOCAL]: 'Local',
  [LobbyScope.STATE]: 'State',
  [LobbyScope.REGIONAL]: 'Regional',
  [LobbyScope.NATIONAL]: 'National',
};

/**
 * Status Labels (display)
 */
export const LOBBY_STATUS_LABELS: Record<LobbyStatus, string> = {
  [LobbyStatus.ACTIVE]: 'Active',
  [LobbyStatus.INACTIVE]: 'Inactive',
  [LobbyStatus.SUSPENDED]: 'Suspended',
  [LobbyStatus.DISBANDED]: 'Disbanded',
};

/**
 * Action Type Labels (display)
 */
export const LOBBY_ACTION_LABELS: Record<LobbyActionType, string> = {
  [LobbyActionType.ENDORSE_CANDIDATE]: 'Endorse Candidate',
  [LobbyActionType.OPPOSE_CANDIDATE]: 'Oppose Candidate',
  [LobbyActionType.SUPPORT_LEGISLATION]: 'Support Legislation',
  [LobbyActionType.OPPOSE_LEGISLATION]: 'Oppose Legislation',
  [LobbyActionType.LAUNCH_CAMPAIGN]: 'Launch Campaign',
  [LobbyActionType.ISSUE_STATEMENT]: 'Issue Statement',
  [LobbyActionType.DONATE_TO_CANDIDATE]: 'Donate to Candidate',
  [LobbyActionType.CALL_MEETING]: 'Call Meeting',
};

// ===================== UTILITY TYPES =====================

/**
 * Lobby with role context (for member view)
 */
export interface LobbyWithMemberContext extends Lobby {
  /** Current user's membership (if any) */
  currentMembership?: LobbyMember;
  
  /** Current user's permissions */
  permissions?: typeof LOBBY_ROLE_PERMISSIONS[LobbyMemberRole];
}
