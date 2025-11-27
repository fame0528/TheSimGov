/**
 * @fileoverview Frontend Types for Legislative Bills System
 * @module types/politics/bills
 * 
 * OVERVIEW:
 * Frontend-specific type definitions extending backend bill types.
 * Used across all Phase 10D UI components for type safety.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

import type { Chamber, PolicyArea, BillStatus, VoteValue } from '@/lib/db/models/Bill';
import type { DebatePosition } from '@/lib/db/models/DebateStatement';

// ===================== BILL DISPLAY TYPES =====================

/**
 * Bill with computed frontend fields
 */
export interface BillWithDetails {
  _id: string;
  billNumber: string;
  chamber: Chamber;
  title: string;
  summary: string;
  policyArea: PolicyArea;
  sponsor: {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    state?: string;
  };
  coSponsors: Array<{
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    state?: string;
  }>;
  votingDeadline: Date | string;
  quorumRequired: number;
  status: BillStatus;
  submittedAt: Date | string;
  
  // Vote counts
  ayeCount: number;
  nayCount: number;
  abstainCount: number;
  totalVotesCast: number;
  
  // Lobby positions
  lobbyPositions: LobbyPositionDisplay[];
  
  // Policy effects
  effects: PolicyEffect[];
  
  // Computed fields
  remainingTime?: {
    ms: number;
    hours: number;
    minutes: number;
    isOpen: boolean;
  };
  voteBreakdown?: VoteTallyDisplay;
  quorumMet: boolean;  // Computed from totalVotesCast >= quorumRequired
  hasVoted?: boolean;  // True if current user has voted
  userVote?: VoteValue; // Current user's vote if hasVoted
}

/**
 * Vote tally display structure
 * Matches backend Bill model vote counts and API response structure
 */
export interface VoteTallyDisplay {
  // Raw vote counts (from Bill model)
  ayeCount: number;
  nayCount: number;
  abstainCount: number;
  totalVotes: number;
  
  // Percentages (computed)
  ayePercentage: number;
  nayPercentage: number;
  abstainPercentage: number;
  
  // Quorum status
  quorumRequired: number;
  quorumMet: boolean;
  
  // Vote margin and prediction
  margin: number;  // Vote margin percentage
  predictedOutcome?: 'passing' | 'failing' | 'uncertain';
  
  // Legacy aliases for backward compatibility
  ayes?: number;    // Alias for ayeCount
  nays?: number;    // Alias for nayCount
  abstains?: number; // Alias for abstainCount
  total?: number;   // Alias for totalVotes
}

/**
 * Lobby position display structure
 */
export interface LobbyPositionDisplay {
  lobbyType: string;
  stance: 'FOR' | 'AGAINST' | 'NEUTRAL';
  reasoning: string;
  paymentPerSeat: number;
  priority: number;
}

/**
 * Grouped lobby positions
 */
export interface GroupedLobbyPositions {
  for: LobbyPositionDisplay[];
  against: LobbyPositionDisplay[];
  neutral: LobbyPositionDisplay[];
}

/**
 * Policy effect structure
 */
export interface PolicyEffect {
  targetType: 'GLOBAL' | 'INDUSTRY' | 'STATE';
  targetId?: string;
  effectType: string;
  effectValue: number;
  effectUnit: string;
  duration?: number;
}

// ===================== DEBATE STATEMENT TYPES =====================

/**
 * Debate statement display structure
 * Matches API response with populated author from DebateStatement.populate('playerId')
 */
export interface DebateStatementDisplay {
  _id: string;
  billId: string;
  playerId: string;
  position: DebatePosition;
  text: string;
  persuasionScore: number;
  upvotes: number;
  createdAt: Date | string;
  editedAt?: Date | string | null;
  canEdit: boolean;
  isOwner?: boolean;
  
  // Author information (from populate)
  author: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    state?: string;
  };
  
  // Legacy aliases
  playerName?: string;  // Alias for author.username
}

/**
 * Debate summary statistics
 */
export interface DebateSummary {
  forCount: number;
  againstCount: number;
  neutralCount: number;
  totalStatements: number;
  avgPersuasionFor: number;
  avgPersuasionAgainst: number;
}

// ===================== VOTING TYPES =====================

/**
 * Vote submission data
 */
export interface VoteSubmission {
  vote: VoteValue;
  chamber: Chamber;
  state?: string;
}

/**
 * Vote confirmation response
 */
export interface VoteConfirmation {
  vote: VoteValue;
  seatCount: number;
  lobbyPayments: Array<{
    lobbyType: string;
    amount: number;
  }>;
  totalPayment: number;
  voteBreakdown: VoteTallyDisplay;
}

/**
 * Lobby payment preview
 * Matches backend API structure from /api/politics/bills/[id]/lobby
 */
export interface LobbyPaymentPreview {
  // Payment if voting Aye (FOR positions)
  ayePayment: {
    totalPayment: number;
    payments: Array<{
      lobbyType: string;
      amount: number;
      seatCount?: number;
    }>;
  };
  
  // Payment if voting Nay (AGAINST positions)
  nayPayment: {
    totalPayment: number;
    payments: Array<{
      lobbyType: string;
      amount: number;
      seatCount?: number;
    }>;
  };
  
  // Maximum possible payment across both options
  maxPossiblePayment?: number;
  
  // Legacy aliases for backward compatibility
  forAye?: LobbyPaymentPreview['ayePayment'];
  forNay?: LobbyPaymentPreview['nayPayment'];
}

// ===================== BILL CREATION TYPES =====================

/**
 * Bill creation form data
 */
export interface BillCreationFormData {
  chamber: Chamber;
  title: string;
  summary: string;
  policyArea: PolicyArea;
  coSponsors: string[];
  effects: PolicyEffect[];
}

/**
 * Bill creation wizard steps
 */
export type BillCreationStep = 
  | 'details'
  | 'effects'
  | 'coSponsors'
  | 'review'
  | 'submit';

/**
 * Anti-abuse limits display
 * Matches backend eligibility check response
 */
export interface AntiAbuseLimits {
  activeBills: number;
  maxActiveBills?: number;  // UI constant, not always in API
  billsToday: number;
  maxBillsPerDay?: number;  // UI constant, not always in API
  canCreateBill: boolean;   // Core eligibility flag from API
  cooldownEndsAt: Date | string | null;  // Null if no cooldown
  isEligible?: boolean;     // Alias for canCreateBill
  reason?: string;          // Reason if not eligible
}

// ===================== FILTER & PAGINATION TYPES =====================

/**
 * Bill browser filters
 */
export interface BillFilters {
  chamber?: Chamber;
  status?: BillStatus;
  policyArea?: PolicyArea;
  search?: string;
}

/**
 * Bill sort options
 */
export interface BillSortOptions {
  sortBy: 'submittedAt' | 'votingDeadline' | 'title';
  order: 'asc' | 'desc';
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ===================== UI STATE TYPES =====================

/**
 * Bill detail view tabs
 */
export type BillDetailTab = 
  | 'overview'
  | 'debate'
  | 'votes'
  | 'effects'
  | 'lobbies';

/**
 * Vote visualization mode
 */
export type VoteVisualizationMode =
  | 'hemicycle'
  | 'bars'
  | 'pie'
  | 'list';

/**
 * Debate sort options
 */
export interface DebateSortOptions {
  sortBy: 'createdAt' | 'upvotes' | 'persuasionScore';
  order: 'asc' | 'desc';
}

// ===================== API RESPONSE TYPES =====================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

/**
 * Bills list API response
 */
export interface BillsListResponse {
  bills: BillWithDetails[];
  pagination: PaginationMetadata;
}

/**
 * Debate statements list API response
 */
export interface DebateStatementsResponse {
  statements: DebateStatementDisplay[];
  pagination: PaginationMetadata;
  summary: DebateSummary;
}

/**
 * Eligibility check response
 */
export interface EligibilityResponse {
  eligible: boolean;
  office?: {
    type: string;
    chamber: Chamber;
    state: string;
  };
  reason?: string;
  requirements?: string[];
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Type Safety**: All frontend types match backend contracts exactly
 * 2. **Date Handling**: Dates can be Date objects or ISO strings (from API)
 * 3. **Optional Fields**: Computed fields marked optional (added by frontend)
 * 4. **Enums Reused**: Import Chamber, PolicyArea, etc. from backend models
 * 5. **Display Types**: Separate from database types for UI-specific needs
 * 
 * USAGE:
 * ```typescript
 * import type { BillWithDetails, VoteConfirmation } from '@/types/politics/bills';
 * 
 * const bill: BillWithDetails = await fetchBill(id);
 * const vote: VoteConfirmation = await castVote(billId, voteData);
 * ```
 */
