/**
 * @fileoverview Party Types - Player-Founded Political Party Organization Types
 * @module lib/types/party
 * 
 * OVERVIEW:
 * Types for player-created political parties. Parties are formal political
 * organizations that recruit members, run primary elections, nominate candidates,
 * build platforms, and compete in elections. All parties are player-founded
 * and player-controlled.
 * 
 * DESIGN PRINCIPLES:
 * - All parties are created by players (no system-generated parties)
 * - Party leadership is player-controlled with elections/succession
 * - Members gain influence through activity and contributions
 * - Parties operate at state and national levels
 * - Primary elections determine candidates for general elections
 * - Platform defines party positions on political issues
 * 
 * DISTINCTION FROM PoliticalParty ENUM:
 * The existing PoliticalParty enum (src/types/politics.ts) represents static
 * party affiliations (Democrat, Republican, etc.). This module represents
 * player-founded party ORGANIZATIONS that operate within those affiliations.
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import type { PoliticalIssue } from './demographics';
import { PoliticalParty } from '@/types/politics';

// ===================== ENUMS =====================

/**
 * Party Organizational Level
 * 
 * The scope at which the party organization operates.
 */
export enum PartyLevel {
  LOCAL = 'LOCAL',           // City/county level
  STATE = 'STATE',           // State party
  NATIONAL = 'NATIONAL',     // National party organization
}

/**
 * Party Member Role
 * 
 * Hierarchy determines permissions and voting weight within party.
 */
export enum PartyMemberRole {
  CHAIR = 'CHAIR',               // Party chair, full control
  VICE_CHAIR = 'VICE_CHAIR',     // Deputy leader
  TREASURER = 'TREASURER',        // Manages party finances
  SECRETARY = 'SECRETARY',        // Manages records and communications
  COMMITTEE = 'COMMITTEE',        // Committee member, voting rights
  DELEGATE = 'DELEGATE',          // Can vote in primaries, conventions
  MEMBER = 'MEMBER',              // Standard member
  REGISTERED = 'REGISTERED',      // Registered with party, limited rights
}

/**
 * Party Action Types
 * 
 * Actions the party can take collectively.
 */
export enum PartyActionType {
  NOMINATE_CANDIDATE = 'NOMINATE_CANDIDATE',
  ENDORSE_CANDIDATE = 'ENDORSE_CANDIDATE',
  ADOPT_PLATFORM = 'ADOPT_PLATFORM',
  AMEND_PLATFORM = 'AMEND_PLATFORM',
  CALL_CONVENTION = 'CALL_CONVENTION',
  EXPEL_MEMBER = 'EXPEL_MEMBER',
  CENSURE_MEMBER = 'CENSURE_MEMBER',
  ALLOCATE_FUNDS = 'ALLOCATE_FUNDS',
  ISSUE_STATEMENT = 'ISSUE_STATEMENT',
  FORM_COALITION = 'FORM_COALITION',
}

/**
 * Party Status
 */
export enum PartyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',         // Low activity, reduced influence
  SUSPENDED = 'SUSPENDED',       // Temporarily banned for violations
  DISSOLVED = 'DISSOLVED',       // Permanently closed
}

/**
 * Primary Election Type
 */
export enum PrimaryType {
  OPEN = 'OPEN',                 // Any voter can participate
  CLOSED = 'CLOSED',             // Only registered party members
  SEMI_CLOSED = 'SEMI_CLOSED',   // Members + independents
  BLANKET = 'BLANKET',           // Top-two regardless of party
  CAUCUS = 'CAUCUS',             // Party-run caucus meeting
}

/**
 * Primary Election Status
 */
export enum PrimaryStatus {
  SCHEDULED = 'SCHEDULED',
  FILING_OPEN = 'FILING_OPEN',
  CAMPAIGNING = 'CAMPAIGNING',
  VOTING = 'VOTING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Convention Event Type
 */
export enum ConventionType {
  NOMINATING = 'NOMINATING',     // Nominate candidates
  PLATFORM = 'PLATFORM',         // Adopt/amend platform
  LEADERSHIP = 'LEADERSHIP',     // Elect party leadership
  GENERAL = 'GENERAL',           // General party business
}

// ===================== INTERFACES =====================

/**
 * Party Member
 * 
 * Represents a player's membership in a party organization.
 */
export interface PartyMember {
  /** Player ID */
  playerId: string;
  
  /** Display name (cached) */
  displayName: string;
  
  /** Role in the party */
  role: PartyMemberRole;
  
  /** When joined (epoch ms) */
  joinedAt: number;
  
  /** Total contributions (lifetime) */
  totalContributions: number;
  
  /** Current standing (0-100, affects voting weight) */
  standing: number;
  
  /** Votes cast in party elections/decisions */
  votesCast: number;
  
  /** Whether member can be delegate at conventions */
  delegateEligible: boolean;
  
  /** Last active (epoch ms) */
  lastActiveAt: number;
  
  /** Contribution tier (Bronze, Silver, Gold, Platinum) */
  contributionTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

/**
 * Party Platform Plank
 * 
 * A single position within the party platform.
 */
export interface PlatformPlank {
  /** Unique plank ID */
  id: string;
  
  /** Related political issue */
  issue: PoliticalIssue;
  
  /** Short title */
  title: string;
  
  /** Full text of the position */
  text: string;
  
  /** Position strength (-5 strongly against to +5 strongly for) */
  position: number;
  
  /** Priority (1-10) */
  priority: number;
  
  /** When adopted (epoch ms) */
  adoptedAt: number;
  
  /** Last amended (epoch ms) */
  amendedAt?: number;
}

/**
 * Party Platform
 * 
 * The party's official positions on issues.
 */
export interface PartyPlatform {
  /** Version number */
  version: number;
  
  /** When adopted (epoch ms) */
  adoptedAt: number;
  
  /** Platform planks by issue */
  planks: PlatformPlank[];
  
  /** Preamble/mission statement */
  preamble: string;
  
  /** Adopted at convention ID (if applicable) */
  conventionId?: string;
}

/**
 * Primary Candidate
 * 
 * A candidate running in a primary election.
 */
export interface PrimaryCandidate {
  /** Campaign ID */
  campaignId: string;
  
  /** Candidate player ID */
  playerId: string;
  
  /** Display name */
  displayName: string;
  
  /** Filing date (epoch ms) */
  filedAt: number;
  
  /** Votes received */
  votesReceived: number;
  
  /** Vote percentage */
  votePercentage: number;
  
  /** Whether withdrew */
  withdrew: boolean;
  
  /** Withdrawal date (epoch ms) */
  withdrewAt?: number;
  
  /** Endorsements from other party members */
  endorsements: string[];
}

/**
 * Primary Election
 * 
 * A party primary election for a specific office.
 */
export interface PartyPrimary {
  /** Unique primary ID */
  id: string;
  
  /** Election ID this primary feeds into */
  electionId: string;
  
  /** Office being contested */
  office: string;
  
  /** District/jurisdiction */
  jurisdiction: string;
  
  /** Primary type */
  type: PrimaryType;
  
  /** Status */
  status: PrimaryStatus;
  
  /** Filing deadline (epoch ms) */
  filingDeadline: number;
  
  /** Voting start (epoch ms) */
  votingStart: number;
  
  /** Voting end (epoch ms) */
  votingEnd: number;
  
  /** Candidates */
  candidates: PrimaryCandidate[];
  
  /** Total votes cast */
  totalVotes: number;
  
  /** Winner player ID (after completion) */
  winnerId?: string;
  
  /** Runoff required? */
  runoffRequired: boolean;
}

/**
 * Party Convention
 * 
 * A party convention event.
 */
export interface PartyConvention {
  /** Unique convention ID */
  id: string;
  
  /** Convention name */
  name: string;
  
  /** Type */
  type: ConventionType;
  
  /** Location */
  location: string;
  
  /** Start date (epoch ms) */
  startDate: number;
  
  /** End date (epoch ms) */
  endDate: number;
  
  /** Delegate player IDs attending */
  delegates: string[];
  
  /** Agenda items */
  agenda: string[];
  
  /** Resolutions passed */
  resolutions: string[];
  
  /** Completed? */
  completed: boolean;
}

/**
 * Party Endorsement Record
 * 
 * Tracks candidates the party has endorsed.
 */
export interface PartyEndorsement {
  /** Campaign ID */
  campaignId: string;
  
  /** Candidate player ID */
  candidatePlayerId: string;
  
  /** Office being sought */
  office: string;
  
  /** When issued (epoch ms) */
  issuedAt: number;
  
  /** Election cycle */
  cycleSequence: number;
  
  /** Funds committed */
  fundsCommitted: number;
  
  /** Whether still active */
  active: boolean;
}

/**
 * Party Action Proposal
 * 
 * A proposed party action awaiting vote.
 */
export interface PartyActionProposal {
  /** Unique proposal ID */
  id: string;
  
  /** Action type */
  actionType: PartyActionType;
  
  /** Target (candidate ID, plank ID, etc.) */
  targetId?: string;
  
  /** Title */
  title: string;
  
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
  
  /** Required approval percentage (default 50%) */
  approvalThreshold: number;
}

/**
 * Party Application
 * 
 * Pending membership application.
 */
export interface PartyApplication {
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
  
  /** Reviewer player ID */
  reviewedBy?: string;
  
  /** When reviewed (epoch ms) */
  reviewedAt?: number;
  
  /** Rejection reason */
  rejectionReason?: string;
}

/**
 * Party Strength Metrics
 * 
 * Calculated metrics determining party influence.
 */
export interface PartyStrength {
  /** Overall strength score (0-100) */
  overall: number;
  
  /** Membership score (0-100) */
  membershipScore: number;
  
  /** Treasury score (0-100) */
  treasuryScore: number;
  
  /** Electoral success score (0-100) */
  electoralScore: number;
  
  /** Activity score (0-100) */
  activityScore: number;
  
  /** Win rate in elections (0-1) */
  winRate: number;
  
  /** Last calculated (epoch ms) */
  calculatedAt: number;
}

/**
 * Party Entity (Full)
 * 
 * Complete representation of a player-founded party organization.
 */
export interface Party {
  /** Unique ID */
  id: string;
  
  /** Party name */
  name: string;
  
  /** URL-friendly slug */
  slug: string;
  
  /** Short description */
  description: string;
  
  /** Party affiliation (maps to existing PoliticalParty enum) */
  affiliation: PoliticalParty;
  
  /** Organizational level */
  level: PartyLevel;
  
  /** State code (if STATE level) */
  stateCode?: string;
  
  /** Status */
  status: PartyStatus;
  
  /** Founding player ID */
  founderId: string;
  
  /** Current chair player ID */
  chairId: string;
  
  /** When founded (epoch ms) */
  foundedAt: number;
  
  /** Members */
  members: PartyMember[];
  
  /** Member count (cached) */
  memberCount: number;
  
  /** Pending applications */
  applications: PartyApplication[];
  
  /** Treasury balance */
  treasury: number;
  
  /** Party platform */
  platform: PartyPlatform;
  
  /** Active primaries */
  primaries: PartyPrimary[];
  
  /** Upcoming/past conventions */
  conventions: PartyConvention[];
  
  /** Active endorsements */
  endorsements: PartyEndorsement[];
  
  /** Pending action proposals */
  proposals: PartyActionProposal[];
  
  /** Strength metrics */
  strength: PartyStrength;
  
  /** Registration open? */
  registrationOpen: boolean;
  
  /** Minimum standing to become delegate */
  minimumDelegateStanding: number;
  
  /** Logo/banner URL */
  logoUrl?: string;
  
  /** Primary color (hex) */
  primaryColor?: string;
  
  /** Schema version */
  schemaVersion: number;
  
  /** Created timestamp */
  createdAt: number;
  
  /** Updated timestamp */
  updatedAt: number;
}

// ===================== HELPER TYPES =====================

/**
 * Create Party Request
 */
export interface CreatePartyRequest {
  name: string;
  description: string;
  affiliation: PoliticalParty;
  level: PartyLevel;
  stateCode?: string;
  registrationOpen?: boolean;
  primaryColor?: string;
}

/**
 * Update Party Request
 */
export interface UpdatePartyRequest {
  description?: string;
  registrationOpen?: boolean;
  minimumDelegateStanding?: number;
  logoUrl?: string;
  primaryColor?: string;
}

/**
 * Party Summary (for lists)
 */
export interface PartySummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  affiliation: PoliticalParty;
  level: PartyLevel;
  stateCode?: string;
  status: PartyStatus;
  memberCount: number;
  strength: number;
  chairId: string;
  chairName: string;
  registrationOpen?: boolean;
  primaryColor?: string;
  createdAt?: number | Date;
}

/**
 * Party Search Filters
 */
export interface PartySearchFilters {
  affiliation?: PoliticalParty;
  level?: PartyLevel;
  stateCode?: string;
  status?: PartyStatus;
  minMembers?: number;
  maxMembers?: number;
  minStrength?: number;
  searchTerm?: string;
}

// ===================== PERMISSIONS =====================

/**
 * Role Permissions
 */
export const PARTY_ROLE_PERMISSIONS = {
  [PartyMemberRole.CHAIR]: {
    canDissolve: true,
    canExpel: true,
    canPromote: true,
    canDemote: true,
    canApproveApplications: true,
    canManageTreasury: true,
    canProposeActions: true,
    canVote: true,
    canNominate: true,
    canCallConvention: true,
    votingWeight: 3,
  },
  [PartyMemberRole.VICE_CHAIR]: {
    canDissolve: false,
    canExpel: true,
    canPromote: true,
    canDemote: true,
    canApproveApplications: true,
    canManageTreasury: true,
    canProposeActions: true,
    canVote: true,
    canNominate: true,
    canCallConvention: true,
    votingWeight: 2.5,
  },
  [PartyMemberRole.TREASURER]: {
    canDissolve: false,
    canExpel: false,
    canPromote: false,
    canDemote: false,
    canApproveApplications: false,
    canManageTreasury: true,
    canProposeActions: true,
    canVote: true,
    canNominate: false,
    canCallConvention: false,
    votingWeight: 2,
  },
  [PartyMemberRole.SECRETARY]: {
    canDissolve: false,
    canExpel: false,
    canPromote: false,
    canDemote: false,
    canApproveApplications: true,
    canManageTreasury: false,
    canProposeActions: true,
    canVote: true,
    canNominate: false,
    canCallConvention: false,
    votingWeight: 2,
  },
  [PartyMemberRole.COMMITTEE]: {
    canDissolve: false,
    canExpel: false,
    canPromote: false,
    canDemote: false,
    canApproveApplications: false,
    canManageTreasury: false,
    canProposeActions: true,
    canVote: true,
    canNominate: true,
    canCallConvention: false,
    votingWeight: 1.5,
  },
  [PartyMemberRole.DELEGATE]: {
    canDissolve: false,
    canExpel: false,
    canPromote: false,
    canDemote: false,
    canApproveApplications: false,
    canManageTreasury: false,
    canProposeActions: false,
    canVote: true,
    canNominate: true,
    canCallConvention: false,
    votingWeight: 1,
  },
  [PartyMemberRole.MEMBER]: {
    canDissolve: false,
    canExpel: false,
    canPromote: false,
    canDemote: false,
    canApproveApplications: false,
    canManageTreasury: false,
    canProposeActions: false,
    canVote: true,
    canNominate: false,
    canCallConvention: false,
    votingWeight: 0.5,
  },
  [PartyMemberRole.REGISTERED]: {
    canDissolve: false,
    canExpel: false,
    canPromote: false,
    canDemote: false,
    canApproveApplications: false,
    canManageTreasury: false,
    canProposeActions: false,
    canVote: false,
    canNominate: false,
    canCallConvention: false,
    votingWeight: 0,
  },
} as const;

// ===================== LABELS =====================

/**
 * Level Labels (display)
 */
export const PARTY_LEVEL_LABELS: Record<PartyLevel, string> = {
  [PartyLevel.LOCAL]: 'Local',
  [PartyLevel.STATE]: 'State',
  [PartyLevel.NATIONAL]: 'National',
};

/**
 * Status Labels (display)
 */
export const PARTY_STATUS_LABELS: Record<PartyStatus, string> = {
  [PartyStatus.ACTIVE]: 'Active',
  [PartyStatus.INACTIVE]: 'Inactive',
  [PartyStatus.SUSPENDED]: 'Suspended',
  [PartyStatus.DISSOLVED]: 'Dissolved',
};

/**
 * Role Labels (display)
 */
export const PARTY_ROLE_LABELS: Record<PartyMemberRole, string> = {
  [PartyMemberRole.CHAIR]: 'Chair',
  [PartyMemberRole.VICE_CHAIR]: 'Vice Chair',
  [PartyMemberRole.TREASURER]: 'Treasurer',
  [PartyMemberRole.SECRETARY]: 'Secretary',
  [PartyMemberRole.COMMITTEE]: 'Committee Member',
  [PartyMemberRole.DELEGATE]: 'Delegate',
  [PartyMemberRole.MEMBER]: 'Member',
  [PartyMemberRole.REGISTERED]: 'Registered Voter',
};

/**
 * Action Type Labels (display)
 */
export const PARTY_ACTION_LABELS: Record<PartyActionType, string> = {
  [PartyActionType.NOMINATE_CANDIDATE]: 'Nominate Candidate',
  [PartyActionType.ENDORSE_CANDIDATE]: 'Endorse Candidate',
  [PartyActionType.ADOPT_PLATFORM]: 'Adopt Platform',
  [PartyActionType.AMEND_PLATFORM]: 'Amend Platform',
  [PartyActionType.CALL_CONVENTION]: 'Call Convention',
  [PartyActionType.EXPEL_MEMBER]: 'Expel Member',
  [PartyActionType.CENSURE_MEMBER]: 'Censure Member',
  [PartyActionType.ALLOCATE_FUNDS]: 'Allocate Funds',
  [PartyActionType.ISSUE_STATEMENT]: 'Issue Statement',
  [PartyActionType.FORM_COALITION]: 'Form Coalition',
};

/**
 * Primary Type Labels (display)
 */
export const PRIMARY_TYPE_LABELS: Record<PrimaryType, string> = {
  [PrimaryType.OPEN]: 'Open Primary',
  [PrimaryType.CLOSED]: 'Closed Primary',
  [PrimaryType.SEMI_CLOSED]: 'Semi-Closed Primary',
  [PrimaryType.BLANKET]: 'Blanket Primary',
  [PrimaryType.CAUCUS]: 'Caucus',
};

/**
 * Primary Status Labels (display)
 */
export const PRIMARY_STATUS_LABELS: Record<PrimaryStatus, string> = {
  [PrimaryStatus.SCHEDULED]: 'Scheduled',
  [PrimaryStatus.FILING_OPEN]: 'Filing Open',
  [PrimaryStatus.CAMPAIGNING]: 'Campaigning',
  [PrimaryStatus.VOTING]: 'Voting',
  [PrimaryStatus.COMPLETED]: 'Completed',
  [PrimaryStatus.CANCELLED]: 'Cancelled',
};

/**
 * Convention Type Labels (display)
 */
export const CONVENTION_TYPE_LABELS: Record<ConventionType, string> = {
  [ConventionType.NOMINATING]: 'Nominating Convention',
  [ConventionType.PLATFORM]: 'Platform Convention',
  [ConventionType.LEADERSHIP]: 'Leadership Election',
  [ConventionType.GENERAL]: 'General Convention',
};

/**
 * Contribution Tier Labels
 */
export const CONTRIBUTION_TIER_LABELS: Record<PartyMember['contributionTier'], string> = {
  BRONZE: 'Bronze Contributor',
  SILVER: 'Silver Contributor',
  GOLD: 'Gold Contributor',
  PLATINUM: 'Platinum Contributor',
};

/**
 * Contribution Tier Thresholds
 */
export const CONTRIBUTION_TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 5000,
  GOLD: 25000,
  PLATINUM: 100000,
} as const;

// ===================== UTILITY TYPES =====================

/**
 * Party with member context (for member view)
 */
export interface PartyWithMemberContext extends Party {
  /** Current user's membership (if any) */
  currentMembership?: PartyMember;
  
  /** Current user's permissions */
  permissions?: typeof PARTY_ROLE_PERMISSIONS[PartyMemberRole];
}

/**
 * Primary Result Summary
 */
export interface PrimaryResultSummary {
  primaryId: string;
  office: string;
  jurisdiction: string;
  winnerId: string;
  winnerName: string;
  winnerVotes: number;
  winnerPercentage: number;
  totalVotes: number;
  candidateCount: number;
  completedAt: number;
}

/**
 * Convention Summary
 */
export interface ConventionSummary {
  id: string;
  name: string;
  type: ConventionType;
  startDate: number;
  endDate: number;
  delegateCount: number;
  resolutionCount: number;
  completed: boolean;
}
