/**
 * @fileoverview Organizational Proposal Types
 * @module lib/types/proposal
 * 
 * OVERVIEW:
 * Type definitions for formal proposals within player organizations (Lobbies/Parties).
 * Supports policy proposals, bylaw amendments, resolutions, and action items with
 * formal voting procedures, amendments, and discussion threads.
 * 
 * DESIGN PRINCIPLES:
 * - Unified system for both Lobby and Party organizations
 * - Multi-stage voting (first reading, debate, final vote)
 * - Amendment support with parent-child relationships
 * - Discussion/comment threads
 * - Quorum and threshold requirements
 * - Sponsor and co-sponsor tracking
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import { OrganizationType } from './leadership';

// ===================== ENUMS =====================

/**
 * Proposal Category
 */
export enum ProposalCategory {
  /** Policy position proposal */
  POLICY = 'POLICY',
  
  /** Bylaw/rule amendment */
  BYLAW = 'BYLAW',
  
  /** Non-binding resolution */
  RESOLUTION = 'RESOLUTION',
  
  /** Endorsement of candidate/bill */
  ENDORSEMENT = 'ENDORSEMENT',
  
  /** Budget/spending proposal */
  BUDGET = 'BUDGET',
  
  /** Structural/organizational change */
  STRUCTURAL = 'STRUCTURAL',
  
  /** Other action item */
  ACTION = 'ACTION',
}

/**
 * Proposal Status
 */
export enum ProposalStatus {
  /** Being drafted, not yet submitted */
  DRAFT = 'DRAFT',
  
  /** Submitted, awaiting sponsor threshold */
  SUBMITTED = 'SUBMITTED',
  
  /** In discussion/debate period */
  DEBATE = 'DEBATE',
  
  /** In voting period */
  VOTING = 'VOTING',
  
  /** Passed, awaiting implementation */
  PASSED = 'PASSED',
  
  /** Failed to pass */
  FAILED = 'FAILED',
  
  /** Vetoed by leadership */
  VETOED = 'VETOED',
  
  /** Withdrawn by sponsor */
  WITHDRAWN = 'WITHDRAWN',
  
  /** Tabled for later consideration */
  TABLED = 'TABLED',
  
  /** Implemented/executed */
  IMPLEMENTED = 'IMPLEMENTED',
}

/**
 * Proposal Priority
 */
export enum ProposalPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * Vote Choice
 */
export enum ProposalVoteChoice {
  YEA = 'YEA',
  NAY = 'NAY',
  ABSTAIN = 'ABSTAIN',
  PRESENT = 'PRESENT',
}

/**
 * Comment Type
 */
export enum CommentType {
  DISCUSSION = 'DISCUSSION',
  SUPPORT = 'SUPPORT',
  OPPOSITION = 'OPPOSITION',
  QUESTION = 'QUESTION',
  AMENDMENT_SUGGESTION = 'AMENDMENT_SUGGESTION',
  PROCEDURAL = 'PROCEDURAL',
}

// ===================== INTERFACES =====================

/**
 * Proposal Sponsor
 */
export interface ProposalSponsor {
  /** Player ID */
  playerId: string;
  
  /** Display name */
  displayName: string;
  
  /** Whether this is the primary sponsor */
  isPrimary: boolean;
  
  /** When they co-sponsored (epoch ms) */
  sponsoredAt: number;
  
  /** Optional statement of support */
  statement?: string;
}

/**
 * Proposal Vote
 */
export interface ProposalVote {
  /** Voter player ID */
  voterId: string;
  
  /** Voter display name */
  voterName: string;
  
  /** Vote choice */
  choice: ProposalVoteChoice;
  
  /** When voted (epoch ms) */
  votedAt: number;
  
  /** Optional explanation */
  explanation?: string;
  
  /** Vote weight (usually 1, but delegates may have more) */
  weight: number;
}

/**
 * Vote Tally
 */
export interface VoteTally {
  yea: number;
  nay: number;
  abstain: number;
  present: number;
  totalVotes: number;
  eligibleVoters: number;
  turnout: number;
  yeaPercentage: number;
  passed: boolean;
  quorumMet: boolean;
}

/**
 * Proposal Comment
 */
export interface ProposalComment {
  /** Comment ID */
  id: string;
  
  /** Author player ID */
  authorId: string;
  
  /** Author display name */
  authorName: string;
  
  /** Comment type */
  type: CommentType;
  
  /** Comment content */
  content: string;
  
  /** Posted at (epoch ms) */
  postedAt: number;
  
  /** Edited at (epoch ms) */
  editedAt?: number;
  
  /** Parent comment ID (for replies) */
  parentId?: string;
  
  /** Reaction counts */
  reactions: {
    agree: number;
    disagree: number;
    insightful: number;
  };
  
  /** Player IDs who reacted */
  reactedBy: Array<{ playerId: string; reaction: 'agree' | 'disagree' | 'insightful' }>;
}

/**
 * Amendment
 * 
 * A proposed modification to an existing proposal.
 */
export interface ProposalAmendment {
  /** Amendment ID */
  id: string;
  
  /** Amendment title */
  title: string;
  
  /** What section/clause being amended */
  targetSection: string;
  
  /** Original text (if modifying) */
  originalText?: string;
  
  /** Proposed new text */
  proposedText: string;
  
  /** Rationale */
  rationale: string;
  
  /** Sponsor player ID */
  sponsorId: string;
  
  /** Sponsor display name */
  sponsorName: string;
  
  /** Co-sponsors */
  coSponsors: string[];
  
  /** Status */
  status: 'PENDING' | 'VOTING' | 'ADOPTED' | 'REJECTED' | 'WITHDRAWN';
  
  /** Votes for */
  votesFor: number;
  
  /** Votes against */
  votesAgainst: number;
  
  /** Voter IDs */
  voterIds: string[];
  
  /** Voting deadline (epoch ms) */
  votingDeadline?: number;
  
  /** Created at (epoch ms) */
  createdAt: number;
}

/**
 * Implementation Step
 * 
 * For tracking execution of passed proposals.
 */
export interface ImplementationStep {
  /** Step ID */
  id: string;
  
  /** Description */
  description: string;
  
  /** Assigned to (player ID) */
  assignedTo?: string;
  
  /** Due date (epoch ms) */
  dueDate?: number;
  
  /** Status */
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  
  /** Notes */
  notes?: string;
  
  /** Completed at (epoch ms) */
  completedAt?: number;
}

/**
 * Proposal
 * 
 * A formal proposal within a player organization.
 */
export interface Proposal {
  /** Unique proposal ID */
  id: string;
  
  /** Proposal number (e.g., "R-2025-001") */
  proposalNumber: string;
  
  /** Organization type */
  organizationType: OrganizationType;
  
  /** Organization ID */
  organizationId: string;
  
  /** Organization name (for display) */
  organizationName: string;
  
  /** Category */
  category: ProposalCategory;
  
  /** Priority */
  priority: ProposalPriority;
  
  /** Current status */
  status: ProposalStatus;
  
  /** Title */
  title: string;
  
  /** Summary/abstract */
  summary: string;
  
  /** Full text/body */
  body: string;
  
  /** Rationale/justification */
  rationale: string;
  
  // Sponsorship
  
  /** Sponsors (primary + co-sponsors) */
  sponsors: ProposalSponsor[];
  
  /** Minimum co-sponsors required to advance */
  minSponsorsRequired: number;
  
  // Timeline
  
  /** Created at (epoch ms) */
  createdAt: number;
  
  /** Submitted at (epoch ms) */
  submittedAt?: number;
  
  /** Debate start (epoch ms) */
  debateStart?: number;
  
  /** Debate end (epoch ms) */
  debateEnd?: number;
  
  /** Voting start (epoch ms) */
  votingStart?: number;
  
  /** Voting end (epoch ms) */
  votingEnd?: number;
  
  /** Decided at (epoch ms) */
  decidedAt?: number;
  
  /** Updated at (epoch ms) */
  updatedAt: number;
  
  // Voting Rules
  
  /** Quorum percentage required */
  quorumPercentage: number;
  
  /** Threshold percentage to pass */
  passThreshold: number;
  
  /** Whether leadership can veto */
  vetoable: boolean;
  
  // Voting Data
  
  /** Individual votes */
  votes: ProposalVote[];
  
  /** Voter IDs (for quick lookup) */
  voterIds: string[];
  
  /** Vote tally (calculated on save) */
  tally?: VoteTally;
  
  // Discussion
  
  /** Comments */
  comments: ProposalComment[];
  
  // Amendments
  
  /** Amendments */
  amendments: ProposalAmendment[];
  
  // Implementation
  
  /** Implementation steps (for passed proposals) */
  implementationSteps: ImplementationStep[];
  
  /** Implementation deadline (epoch ms) */
  implementationDeadline?: number;
  
  /** Implemented at (epoch ms) */
  implementedAt?: number;
  
  // Related Items
  
  /** Related proposal IDs */
  relatedProposals: string[];
  
  /** Tags for categorization */
  tags: string[];
  
  // Metadata
  
  /** Created by (player ID) */
  createdBy: string;
  
  /** Version number (incremented on edit) */
  version: number;
}

// ===================== SUMMARY TYPES =====================

/**
 * Proposal Summary for List Views
 */
export interface ProposalSummary {
  id: string;
  proposalNumber: string;
  organizationType: OrganizationType;
  organizationId: string;
  organizationName: string;
  category: ProposalCategory;
  priority: ProposalPriority;
  status: ProposalStatus;
  title: string;
  summary: string;
  sponsorCount: number;
  primarySponsorName: string;
  voteCount: number;
  commentCount: number;
  amendmentCount: number;
  votingStart?: number;
  votingEnd?: number;
  yeaPercentage?: number;
  passed?: boolean;
  createdAt: number;
}

// ===================== ACTION TYPES =====================

/**
 * Proposal Action Types
 */
export enum ProposalActionType {
  CREATE = 'CREATE',
  EDIT = 'EDIT',
  SUBMIT = 'SUBMIT',
  CO_SPONSOR = 'CO_SPONSOR',
  WITHDRAW_SPONSORSHIP = 'WITHDRAW_SPONSORSHIP',
  ADD_COMMENT = 'ADD_COMMENT',
  REACT_COMMENT = 'REACT_COMMENT',
  PROPOSE_AMENDMENT = 'PROPOSE_AMENDMENT',
  VOTE_AMENDMENT = 'VOTE_AMENDMENT',
  CAST_VOTE = 'CAST_VOTE',
  VETO = 'VETO',
  OVERRIDE_VETO = 'OVERRIDE_VETO',
  TABLE = 'TABLE',
  UNTABLE = 'UNTABLE',
  WITHDRAW = 'WITHDRAW',
  ADD_IMPLEMENTATION_STEP = 'ADD_IMPLEMENTATION_STEP',
  UPDATE_IMPLEMENTATION = 'UPDATE_IMPLEMENTATION',
  MARK_IMPLEMENTED = 'MARK_IMPLEMENTED',
}

// ===================== CREATE/UPDATE DTOS =====================

/**
 * Create Proposal DTO
 */
export interface CreateProposalDTO {
  organizationType: OrganizationType;
  organizationId: string;
  category: ProposalCategory;
  priority?: ProposalPriority;
  title: string;
  summary: string;
  body: string;
  rationale?: string;
  debateStart?: number;
  debateEnd?: number;
  votingStart?: number;
  votingEnd?: number;
  quorumPercentage?: number;
  passThreshold?: number;
  vetoable?: boolean;
  minSponsorsRequired?: number;
  tags?: string[];
  relatedProposals?: string[];
  submitImmediately?: boolean;
}

/**
 * Update Proposal DTO
 */
export interface UpdateProposalDTO {
  title?: string;
  summary?: string;
  body?: string;
  rationale?: string;
  priority?: ProposalPriority;
  debateStart?: number;
  debateEnd?: number;
  votingStart?: number;
  votingEnd?: number;
  tags?: string[];
}

/**
 * Add Comment DTO
 */
export interface AddCommentDTO {
  type: CommentType;
  content: string;
  parentId?: string;
}

/**
 * Propose Amendment DTO
 */
export interface ProposeAmendmentDTO {
  title: string;
  targetSection: string;
  originalText?: string;
  proposedText: string;
  rationale: string;
}

/**
 * Cast Vote DTO
 */
export interface CastProposalVoteDTO {
  choice: ProposalVoteChoice;
  explanation?: string;
}

// ===================== FILTER TYPES =====================

/**
 * Proposal Search Filters
 */
export interface ProposalFilters {
  organizationType?: OrganizationType;
  organizationId?: string;
  category?: ProposalCategory;
  status?: ProposalStatus | ProposalStatus[];
  priority?: ProposalPriority;
  sponsorId?: string;
  tag?: string;
  search?: string;
  votingBefore?: number;
  votingAfter?: number;
  includeArchived?: boolean;
}

// ===================== CONSTANTS =====================

/**
 * Default proposal settings
 */
export const DEFAULT_PROPOSAL_SETTINGS = {
  quorumPercentage: 25,
  passThreshold: 50,
  vetoable: true,
  minSponsorsRequired: 2,
  debateDurationDays: 3,
  votingDurationDays: 2,
} as const;

/**
 * Category Labels
 */
export const CATEGORY_LABELS: Record<ProposalCategory, string> = {
  [ProposalCategory.POLICY]: 'Policy Position',
  [ProposalCategory.BYLAW]: 'Bylaw Amendment',
  [ProposalCategory.RESOLUTION]: 'Resolution',
  [ProposalCategory.ENDORSEMENT]: 'Endorsement',
  [ProposalCategory.BUDGET]: 'Budget/Spending',
  [ProposalCategory.STRUCTURAL]: 'Structural Change',
  [ProposalCategory.ACTION]: 'Action Item',
};

/**
 * Status Labels
 */
export const STATUS_LABELS: Record<ProposalStatus, string> = {
  [ProposalStatus.DRAFT]: 'Draft',
  [ProposalStatus.SUBMITTED]: 'Submitted',
  [ProposalStatus.DEBATE]: 'In Debate',
  [ProposalStatus.VOTING]: 'Voting',
  [ProposalStatus.PASSED]: 'Passed',
  [ProposalStatus.FAILED]: 'Failed',
  [ProposalStatus.VETOED]: 'Vetoed',
  [ProposalStatus.WITHDRAWN]: 'Withdrawn',
  [ProposalStatus.TABLED]: 'Tabled',
  [ProposalStatus.IMPLEMENTED]: 'Implemented',
};

/**
 * Priority Labels
 */
export const PRIORITY_LABELS: Record<ProposalPriority, string> = {
  [ProposalPriority.LOW]: 'Low',
  [ProposalPriority.NORMAL]: 'Normal',
  [ProposalPriority.HIGH]: 'High',
  [ProposalPriority.URGENT]: 'Urgent',
};

/**
 * Vote Choice Labels
 */
export const VOTE_CHOICE_LABELS: Record<ProposalVoteChoice, string> = {
  [ProposalVoteChoice.YEA]: 'Yea',
  [ProposalVoteChoice.NAY]: 'Nay',
  [ProposalVoteChoice.ABSTAIN]: 'Abstain',
  [ProposalVoteChoice.PRESENT]: 'Present',
};

/**
 * Comment Type Labels
 */
export const COMMENT_TYPE_LABELS: Record<CommentType, string> = {
  [CommentType.DISCUSSION]: 'Discussion',
  [CommentType.SUPPORT]: 'Support',
  [CommentType.OPPOSITION]: 'Opposition',
  [CommentType.QUESTION]: 'Question',
  [CommentType.AMENDMENT_SUGGESTION]: 'Amendment Suggestion',
  [CommentType.PROCEDURAL]: 'Procedural',
};

/**
 * Generate proposal number
 */
export function generateProposalNumber(
  category: ProposalCategory,
  year: number,
  sequence: number
): string {
  const prefix = {
    [ProposalCategory.POLICY]: 'P',
    [ProposalCategory.BYLAW]: 'B',
    [ProposalCategory.RESOLUTION]: 'R',
    [ProposalCategory.ENDORSEMENT]: 'E',
    [ProposalCategory.BUDGET]: 'F',
    [ProposalCategory.STRUCTURAL]: 'S',
    [ProposalCategory.ACTION]: 'A',
  }[category];
  
  return `${prefix}-${year}-${String(sequence).padStart(3, '0')}`;
}

/**
 * Calculate vote tally from votes
 */
export function calculateTally(
  votes: ProposalVote[],
  eligibleVoters: number,
  quorumPercentage: number,
  passThreshold: number
): VoteTally {
  let yea = 0;
  let nay = 0;
  let abstain = 0;
  let present = 0;
  
  for (const vote of votes) {
    switch (vote.choice) {
      case ProposalVoteChoice.YEA:
        yea += vote.weight;
        break;
      case ProposalVoteChoice.NAY:
        nay += vote.weight;
        break;
      case ProposalVoteChoice.ABSTAIN:
        abstain += vote.weight;
        break;
      case ProposalVoteChoice.PRESENT:
        present += vote.weight;
        break;
    }
  }
  
  const totalVotes = yea + nay + abstain + present;
  const votingVotes = yea + nay; // Abstain and Present don't count for threshold
  const turnout = eligibleVoters > 0 ? (totalVotes / eligibleVoters) * 100 : 0;
  const quorumMet = turnout >= quorumPercentage;
  const yeaPercentage = votingVotes > 0 ? (yea / votingVotes) * 100 : 0;
  const passed = quorumMet && yeaPercentage >= passThreshold;
  
  return {
    yea,
    nay,
    abstain,
    present,
    totalVotes,
    eligibleVoters,
    turnout,
    yeaPercentage,
    passed,
    quorumMet,
  };
}
