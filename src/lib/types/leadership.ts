/**
 * @fileoverview Leadership Election Types
 * @module lib/types/leadership
 * 
 * OVERVIEW:
 * Type definitions for internal leadership elections within player organizations
 * (Lobbies and Parties). Provides a unified voting system for electing officers,
 * board members, and other leadership positions.
 * 
 * DESIGN PRINCIPLES:
 * - Unified system works for both Lobby and Party organizations
 * - Supports multiple election types (officer, board, recall, special)
 * - Anonymous and transparent voting options
 * - Quorum requirements and vote thresholds
 * - Runoff support for close elections
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

// ===================== ENUMS =====================

/**
 * Organization Type
 * 
 * The type of organization holding the election.
 */
export enum OrganizationType {
  LOBBY = 'LOBBY',
  PARTY = 'PARTY',
}

/**
 * Leadership Election Type
 * 
 * Different types of internal elections.
 */
export enum LeadershipElectionType {
  /** Regular scheduled election for officers */
  OFFICER = 'OFFICER',
  
  /** Election for board/committee seats */
  BOARD = 'BOARD',
  
  /** Recall election to remove current leader */
  RECALL = 'RECALL',
  
  /** Special election to fill vacancy */
  SPECIAL = 'SPECIAL',
  
  /** Confidence vote in current leadership */
  CONFIDENCE = 'CONFIDENCE',
}

/**
 * Leadership Election Status
 */
export enum LeadershipElectionStatus {
  /** Election scheduled but not yet open */
  SCHEDULED = 'SCHEDULED',
  
  /** Candidate filing period */
  FILING = 'FILING',
  
  /** Active voting period */
  VOTING = 'VOTING',
  
  /** Counting/verifying votes */
  COUNTING = 'COUNTING',
  
  /** Runoff required */
  RUNOFF = 'RUNOFF',
  
  /** Election complete */
  COMPLETED = 'COMPLETED',
  
  /** Election cancelled */
  CANCELLED = 'CANCELLED',
}

/**
 * Position Being Elected
 * 
 * Leadership positions that can be elected.
 */
export enum LeadershipPosition {
  // Lobby positions
  LOBBY_LEADER = 'LOBBY_LEADER',
  LOBBY_DEPUTY = 'LOBBY_DEPUTY',
  LOBBY_TREASURER = 'LOBBY_TREASURER',
  LOBBY_SECRETARY = 'LOBBY_SECRETARY',
  LOBBY_BOARD_MEMBER = 'LOBBY_BOARD_MEMBER',
  
  // Party positions
  PARTY_CHAIR = 'PARTY_CHAIR',
  PARTY_VICE_CHAIR = 'PARTY_VICE_CHAIR',
  PARTY_TREASURER = 'PARTY_TREASURER',
  PARTY_SECRETARY = 'PARTY_SECRETARY',
  PARTY_COMMITTEE_MEMBER = 'PARTY_COMMITTEE_MEMBER',
}

/**
 * Vote Type
 */
export enum VoteType {
  /** Single choice vote */
  SINGLE = 'SINGLE',
  
  /** Approval voting (vote for multiple) */
  APPROVAL = 'APPROVAL',
  
  /** Ranked choice voting */
  RANKED = 'RANKED',
  
  /** Yes/No vote (for recalls, confidence) */
  YES_NO = 'YES_NO',
}

/**
 * Vote Choice for Yes/No votes
 */
export enum YesNoChoice {
  YES = 'YES',
  NO = 'NO',
  ABSTAIN = 'ABSTAIN',
}

// ===================== INTERFACES =====================

/**
 * Leadership Candidate
 * 
 * A member running for a leadership position.
 */
export interface LeadershipCandidate {
  /** Player ID */
  playerId: string;
  
  /** Display name */
  displayName: string;
  
  /** Position running for */
  position: LeadershipPosition;
  
  /** Platform/statement (max 1000 chars) */
  platform: string;
  
  /** Endorsements from other members (player IDs) */
  endorsements: string[];
  
  /** Filed at (epoch ms) */
  filedAt: number;
  
  /** Whether candidate withdrew */
  withdrew: boolean;
  
  /** Withdrawal timestamp */
  withdrewAt?: number;
  
  /** Votes received (populated after counting) */
  votesReceived: number;
  
  /** Vote percentage (populated after counting) */
  votePercentage: number;
  
  /** Ranking for ranked choice (1 = winner) */
  finalRank?: number;
}

/**
 * Individual Vote Record
 * 
 * A single member's vote in an election.
 */
export interface LeadershipVote {
  /** Voter player ID */
  voterId: string;
  
  /** Vote timestamp (epoch ms) */
  votedAt: number;
  
  /** For SINGLE/YES_NO: single choice */
  choice?: string;
  
  /** For APPROVAL: multiple choices */
  approvedCandidates?: string[];
  
  /** For RANKED: ordered candidate IDs */
  rankedChoices?: string[];
  
  /** For YES_NO votes */
  yesNoChoice?: YesNoChoice;
  
  /** Vote verified/counted */
  verified: boolean;
  
  /** Vote weight (for weighted voting systems) */
  weight: number;
}

/**
 * Election Results
 * 
 * Final results of a leadership election.
 */
export interface LeadershipElectionResults {
  /** Total eligible voters */
  eligibleVoters: number;
  
  /** Total votes cast */
  totalVotesCast: number;
  
  /** Turnout percentage */
  turnoutPercentage: number;
  
  /** Whether quorum was met */
  quorumMet: boolean;
  
  /** Winner player ID (if applicable) */
  winnerId?: string;
  
  /** Winner display name */
  winnerName?: string;
  
  /** For board elections: all winners */
  winners?: Array<{ playerId: string; displayName: string; votes: number }>;
  
  /** For YES_NO: yes percentage */
  yesPercentage?: number;
  
  /** For YES_NO: passed? */
  passed?: boolean;
  
  /** Runoff required? */
  runoffRequired: boolean;
  
  /** Runoff candidates (if runoff required) */
  runoffCandidates?: string[];
  
  /** Certified at (epoch ms) */
  certifiedAt?: number;
  
  /** Certified by (player ID) */
  certifiedBy?: string;
}

/**
 * Leadership Election
 * 
 * An internal election within a player organization.
 */
export interface LeadershipElection {
  /** Unique election ID */
  id: string;
  
  /** Organization type */
  organizationType: OrganizationType;
  
  /** Organization ID (Lobby or Party ID) */
  organizationId: string;
  
  /** Organization name (for display) */
  organizationName: string;
  
  /** Election type */
  electionType: LeadershipElectionType;
  
  /** Position(s) being elected */
  positions: LeadershipPosition[];
  
  /** Number of seats (for board elections) */
  seatsAvailable: number;
  
  /** Vote type */
  voteType: VoteType;
  
  /** Current status */
  status: LeadershipElectionStatus;
  
  /** Title/description */
  title: string;
  
  /** Detailed description */
  description: string;
  
  // Timing
  
  /** Filing period start (epoch ms) */
  filingStart: number;
  
  /** Filing period end (epoch ms) */
  filingEnd: number;
  
  /** Voting period start (epoch ms) */
  votingStart: number;
  
  /** Voting period end (epoch ms) */
  votingEnd: number;
  
  // Rules
  
  /** Minimum quorum percentage (0-100) */
  quorumPercentage: number;
  
  /** Win threshold percentage for single elections */
  winThreshold: number;
  
  /** Whether to use runoff if no majority */
  allowRunoff: boolean;
  
  /** Anonymous voting? */
  anonymousVoting: boolean;
  
  /** Minimum member standing to vote */
  minimumStandingToVote: number;
  
  /** Minimum tenure (days) to vote */
  minimumTenureToVote: number;
  
  /** Minimum standing to run */
  minimumStandingToRun: number;
  
  /** Minimum tenure (days) to run */
  minimumTenureToRun: number;
  
  // Participants
  
  /** Candidates */
  candidates: LeadershipCandidate[];
  
  /** Votes (if not anonymous, or for verification) */
  votes: LeadershipVote[];
  
  /** Eligible voter IDs */
  eligibleVoterIds: string[];
  
  /** IDs of members who have voted (for tracking turnout) */
  votedIds: string[];
  
  // Results
  
  /** Election results (populated after completion) */
  results?: LeadershipElectionResults;
  
  // Recall-specific
  
  /** For RECALL: target player ID */
  recallTargetId?: string;
  
  /** For RECALL: reason for recall */
  recallReason?: string;
  
  /** For RECALL: required signatures (player IDs) */
  recallSignatures?: string[];
  
  /** For RECALL: minimum signatures required */
  recallSignaturesRequired?: number;
  
  // Metadata
  
  /** Created by (player ID) */
  createdBy: string;
  
  /** Created at (epoch ms) */
  createdAt: number;
  
  /** Updated at (epoch ms) */
  updatedAt: number;
  
  /** Parent election ID (if this is a runoff) */
  parentElectionId?: string;
}

// ===================== SUMMARY TYPES =====================

/**
 * Election Summary for List Views
 */
export interface LeadershipElectionSummary {
  id: string;
  organizationType: OrganizationType;
  organizationId: string;
  organizationName: string;
  electionType: LeadershipElectionType;
  positions: LeadershipPosition[];
  status: LeadershipElectionStatus;
  title: string;
  candidateCount: number;
  votingStart: number;
  votingEnd: number;
  voterTurnout: number;
  winnerId?: string;
  winnerName?: string;
}

// ===================== ACTION TYPES =====================

/**
 * Election Action Types
 */
export enum LeadershipElectionAction {
  CREATE = 'CREATE',
  FILE_CANDIDACY = 'FILE_CANDIDACY',
  WITHDRAW_CANDIDACY = 'WITHDRAW_CANDIDACY',
  ENDORSE = 'ENDORSE',
  CAST_VOTE = 'CAST_VOTE',
  CERTIFY = 'CERTIFY',
  CANCEL = 'CANCEL',
  INITIATE_RECALL = 'INITIATE_RECALL',
  SIGN_RECALL = 'SIGN_RECALL',
}

// ===================== CREATE/UPDATE DTOS =====================

/**
 * Create Election DTO
 */
export interface CreateLeadershipElectionDTO {
  organizationType: OrganizationType;
  organizationId: string;
  electionType: LeadershipElectionType;
  positions: LeadershipPosition[];
  seatsAvailable?: number;
  voteType?: VoteType;
  title: string;
  description?: string;
  filingStart: number;
  filingEnd: number;
  votingStart: number;
  votingEnd: number;
  quorumPercentage?: number;
  winThreshold?: number;
  allowRunoff?: boolean;
  anonymousVoting?: boolean;
  minimumStandingToVote?: number;
  minimumTenureToVote?: number;
  minimumStandingToRun?: number;
  minimumTenureToRun?: number;
  // For recall elections
  recallTargetId?: string;
  recallReason?: string;
  recallSignaturesRequired?: number;
}

/**
 * File Candidacy DTO
 */
export interface FileCandidacyDTO {
  position: LeadershipPosition;
  platform: string;
}

/**
 * Cast Vote DTO
 */
export interface CastVoteDTO {
  /** For SINGLE votes */
  candidateId?: string;
  
  /** For APPROVAL votes */
  approvedCandidateIds?: string[];
  
  /** For RANKED votes */
  rankedCandidateIds?: string[];
  
  /** For YES_NO votes */
  yesNoChoice?: YesNoChoice;
}

/**
 * Endorse Candidate DTO
 */
export interface EndorseCandidateDTO {
  candidateId: string;
}

// ===================== FILTER TYPES =====================

/**
 * Election Search Filters
 */
export interface LeadershipElectionFilters {
  organizationType?: OrganizationType;
  organizationId?: string;
  electionType?: LeadershipElectionType;
  status?: LeadershipElectionStatus;
  positions?: LeadershipPosition[];
  votingBefore?: number;
  votingAfter?: number;
  includeCompleted?: boolean;
}

// ===================== CONSTANTS =====================

/**
 * Default election settings
 */
export const DEFAULT_ELECTION_SETTINGS = {
  quorumPercentage: 25,
  winThreshold: 50,
  allowRunoff: true,
  anonymousVoting: true,
  minimumStandingToVote: 0,
  minimumTenureToVote: 7, // 7 days
  minimumStandingToRun: 50,
  minimumTenureToRun: 30, // 30 days
  seatsAvailable: 1,
  voteType: VoteType.SINGLE,
} as const;

/**
 * Position Labels
 */
export const POSITION_LABELS: Record<LeadershipPosition, string> = {
  [LeadershipPosition.LOBBY_LEADER]: 'Lobby Leader',
  [LeadershipPosition.LOBBY_DEPUTY]: 'Deputy Leader',
  [LeadershipPosition.LOBBY_TREASURER]: 'Treasurer',
  [LeadershipPosition.LOBBY_SECRETARY]: 'Secretary',
  [LeadershipPosition.LOBBY_BOARD_MEMBER]: 'Board Member',
  [LeadershipPosition.PARTY_CHAIR]: 'Party Chair',
  [LeadershipPosition.PARTY_VICE_CHAIR]: 'Vice Chair',
  [LeadershipPosition.PARTY_TREASURER]: 'Treasurer',
  [LeadershipPosition.PARTY_SECRETARY]: 'Secretary',
  [LeadershipPosition.PARTY_COMMITTEE_MEMBER]: 'Committee Member',
};

/**
 * Election Type Labels
 */
export const ELECTION_TYPE_LABELS: Record<LeadershipElectionType, string> = {
  [LeadershipElectionType.OFFICER]: 'Officer Election',
  [LeadershipElectionType.BOARD]: 'Board Election',
  [LeadershipElectionType.RECALL]: 'Recall Election',
  [LeadershipElectionType.SPECIAL]: 'Special Election',
  [LeadershipElectionType.CONFIDENCE]: 'Vote of Confidence',
};

/**
 * Election Status Labels
 */
export const ELECTION_STATUS_LABELS: Record<LeadershipElectionStatus, string> = {
  [LeadershipElectionStatus.SCHEDULED]: 'Scheduled',
  [LeadershipElectionStatus.FILING]: 'Filing Open',
  [LeadershipElectionStatus.VOTING]: 'Voting Open',
  [LeadershipElectionStatus.COUNTING]: 'Counting Votes',
  [LeadershipElectionStatus.RUNOFF]: 'Runoff Required',
  [LeadershipElectionStatus.COMPLETED]: 'Completed',
  [LeadershipElectionStatus.CANCELLED]: 'Cancelled',
};

/**
 * Vote Type Labels
 */
export const VOTE_TYPE_LABELS: Record<VoteType, string> = {
  [VoteType.SINGLE]: 'Single Choice',
  [VoteType.APPROVAL]: 'Approval Voting',
  [VoteType.RANKED]: 'Ranked Choice',
  [VoteType.YES_NO]: 'Yes/No Vote',
};

/**
 * Organization Type Labels
 */
export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  [OrganizationType.LOBBY]: 'Lobby',
  [OrganizationType.PARTY]: 'Party',
};

/**
 * Recall signature requirements by org size
 */
export const RECALL_SIGNATURE_THRESHOLDS = {
  SMALL: { maxMembers: 20, percentage: 40 },
  MEDIUM: { maxMembers: 100, percentage: 30 },
  LARGE: { maxMembers: 500, percentage: 20 },
  HUGE: { maxMembers: Infinity, percentage: 15 },
} as const;

/**
 * Get required recall signatures based on member count
 */
export function getRecallSignaturesRequired(memberCount: number): number {
  if (memberCount <= RECALL_SIGNATURE_THRESHOLDS.SMALL.maxMembers) {
    return Math.ceil(memberCount * (RECALL_SIGNATURE_THRESHOLDS.SMALL.percentage / 100));
  }
  if (memberCount <= RECALL_SIGNATURE_THRESHOLDS.MEDIUM.maxMembers) {
    return Math.ceil(memberCount * (RECALL_SIGNATURE_THRESHOLDS.MEDIUM.percentage / 100));
  }
  if (memberCount <= RECALL_SIGNATURE_THRESHOLDS.LARGE.maxMembers) {
    return Math.ceil(memberCount * (RECALL_SIGNATURE_THRESHOLDS.LARGE.percentage / 100));
  }
  return Math.ceil(memberCount * (RECALL_SIGNATURE_THRESHOLDS.HUGE.percentage / 100));
}
