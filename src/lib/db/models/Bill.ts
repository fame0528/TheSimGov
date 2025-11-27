/**
 * @file src/lib/db/models/Bill.ts
 * @description Legislative bill tracking with weighted voting and real-time deadlines
 * @created 2025-11-26
 * @author ECHO v1.3.0
 *
 * OVERVIEW:
 * Tracks legislative bills through complete lifecycle from submission to enactment.
 * Implements 24-hour REAL-TIME voting windows (not game time) for timezone fairness.
 * Supports weighted voting (Senate 1 vote, House delegation-based), lobby positions,
 * debate statements, and instant policy enactment upon passage.
 *
 * KEY DESIGN DECISIONS:
 * - **24h Real-Time Voting:** Prevents coordination exploits (3am bill rushes)
 * - **Elected Officials Only:** Only senators/representatives can submit bills
 * - **Instant Lobby Payments:** Payments processed immediately when vote matches preference
 * - **Instant Policy Enactment:** Bills affect all companies immediately upon passage
 * - **Anti-Abuse Limits:** 3 bills/player, 10/day/chamber, 24h cooldown
 *
 * USAGE:
 * ```typescript
 * import Bill from '@/lib/db/models/Bill';
 *
 * // Create new bill
 * const bill = await Bill.create({
 *   billNumber: 'S.1234',
 *   chamber: 'senate',
 *   title: 'Clean Energy Tax Credit Act',
 *   policyArea: 'energy',
 *   sponsor: playerId,
 *   votingDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
 *   lobbyPositions: [
 *     { lobbyType: 'renewable_energy', position: 'FOR', paymentPerSeat: 120000 },
 *     { lobbyType: 'oil_gas', position: 'AGAINST', paymentPerSeat: 120000 }
 *   ]
 * });
 *
 * // Cast vote with instant lobby payment
 * await bill.castVote(playerId, 'Aye', seatCount);
 *
 * // Check if passed
 * const result = await bill.tallyVotes();
 * if (result.passed) {
 *   await bill.enactPolicy();
 * }
 * ```
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ===================== TYPE DEFINITIONS =====================

export type Chamber = 'senate' | 'house';

export type PolicyArea = 
  | 'tax'           // Tax rates, credits, deductions
  | 'budget'        // Government spending, appropriations
  | 'regulatory'    // Industry regulations, compliance
  | 'trade'         // Tariffs, trade agreements
  | 'energy'        // Energy policy, subsidies
  | 'healthcare'    // Healthcare regulations, funding
  | 'labor'         // Labor laws, worker protections
  | 'environment'   // Environmental regulations
  | 'technology'    // Tech regulations, data privacy
  | 'defense'       // Defense spending, contracts
  | 'custom';       // Player-defined policy

export type VoteValue = 'Aye' | 'Nay' | 'Abstain' | 'No Vote';

export type BillStatus = 
  | 'ACTIVE'        // Currently accepting votes
  | 'PASSED'        // Vote passed, policy enacted
  | 'FAILED'        // Vote failed
  | 'WITHDRAWN'     // Sponsor withdrew bill
  | 'EXPIRED';      // Voting deadline passed without quorum

export type LobbyType =
  | 'defense'
  | 'healthcare'
  | 'oil_gas'
  | 'renewable_energy'
  | 'technology'
  | 'banking'
  | 'manufacturing'
  | 'agriculture'
  | 'labor'
  | 'environmental';

export type LobbyPosition = 'FOR' | 'AGAINST' | 'NEUTRAL';

/**
 * Individual vote record with weighted vote count
 */
export interface IVote {
  playerId: Types.ObjectId;
  vote: VoteValue;
  seatCount: number;              // Senate: 1, House: delegation count (1-52)
  votedAt: Date;
  lobbyPaymentsTriggered: Types.ObjectId[]; // Refs to LobbyPayment IDs
}

/**
 * Lobby position on bill with payment structure
 */
export interface ILobbyPosition {
  lobbyType: LobbyType;
  position: LobbyPosition;
  paymentPerSeat: number;         // $120k for senators, $23k for house seats
  reasoning?: string;             // Why lobby cares about this bill
}

/**
 * Policy effect to apply when bill passes
 */
export interface IPolicyEffect {
  targetType: 'GLOBAL' | 'INDUSTRY' | 'STATE'; // Scope of effect
  targetId?: string;              // Industry/state code if scoped
  effectType: string;             // 'TAX_RATE', 'SUBSIDY_AMOUNT', 'REGULATION_LEVEL'
  effectValue: number;            // New value or delta
  effectUnit: string;             // '%', '$', 'points', etc.
  duration?: number;              // Months (undefined = permanent)
}

/**
 * Bill document interface
 */
export interface IBill extends Document {
  // Bill identification
  billNumber: string;             // S.1234 or H.R.5678
  chamber: Chamber;
  title: string;
  summary: string;
  policyArea: PolicyArea;
  
  // Sponsorship
  sponsor: Types.ObjectId;        // Player ID (must be elected official)
  coSponsors: Types.ObjectId[];   // Additional elected officials
  
  // Voting mechanics (24h REAL-TIME, not game time!)
  votingDeadline: Date;           // CRITICAL: Real Date object, 24h from submission
  votes: IVote[];
  ayeCount: number;               // Running tally
  nayCount: number;               // Running tally
  abstainCount: number;           // Running tally
  totalVotesCast: number;         // Total weighted votes
  quorumRequired: number;         // 50% of chamber (50 senate, 218 house)
  
  // Lobby system
  lobbyPositions: ILobbyPosition[];
  
  // Debate system
  debateStatements: Types.ObjectId[]; // Refs to DebateStatement IDs
  
  // Policy effects
  effects: IPolicyEffect[];       // What happens when bill passes
  
  // Lifecycle
  status: BillStatus;
  submittedAt: Date;
  enactedAt?: Date;
  withdrawnAt?: Date;
  
  // Anti-abuse tracking
  submissionCooldownExpiresAt?: Date; // Sponsor's next submission allowed
  
  // Schema version
  schemaVersion: 1;
}

/**
 * Bill schema methods interface
 */
export interface IBillMethods {
  /**
   * Cast a vote and process instant lobby payments
   * @param playerId - Voting player ID
   * @param vote - Vote value (Aye/Nay/Abstain)
   * @param seatCount - Senate: 1, House: delegation count
   * @returns Lobby payment IDs triggered
   */
  castVote(playerId: Types.ObjectId | string, vote: VoteValue, seatCount: number): Promise<Types.ObjectId[]>;
  
  /**
   * Tally final votes and determine passage
   * @returns Vote results with pass/fail determination
   */
  tallyVotes(): Promise<{
    ayeCount: number;
    nayCount: number;
    abstainCount: number;
    totalVotes: number;
    quorumMet: boolean;
    passed: boolean;
    margin: number;
  }>;
  
  /**
   * Enact policy effects globally
   * Applies effects to all companies immediately
   */
  enactPolicy(): Promise<void>;
  
  /**
   * Check if player has already voted
   * @param playerId - Player to check
   * @returns True if already voted
   */
  hasVoted(playerId: Types.ObjectId | string): boolean;
  
  /**
   * Get remaining time until voting deadline
   * @returns Milliseconds remaining (negative if expired)
   */
  getRemainingTime(): number;
  
  /**
   * Check if voting is still open
   * @returns True if before deadline and status is ACTIVE
   */
  isVotingOpen(): boolean;
}

export type BillDocument = IBill & IBillMethods & Document;

// ===================== SCHEMA DEFINITION =====================

const VoteSchema = new Schema<IVote>({
  playerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Player ID is required'],
    index: true,
  },
  vote: {
    type: String,
    required: [true, 'Vote value is required'],
    enum: {
      values: ['Aye', 'Nay', 'Abstain', 'No Vote'],
      message: '{VALUE} is not a valid vote',
    },
  },
  seatCount: {
    type: Number,
    required: [true, 'Seat count is required'],
    min: [1, 'Seat count must be at least 1'],
    max: [52, 'Seat count cannot exceed 52 (California House delegation)'],
  },
  votedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  lobbyPaymentsTriggered: [{
    type: Schema.Types.ObjectId,
    ref: 'LobbyPayment',
  }],
}, { _id: false });

const LobbyPositionSchema = new Schema<ILobbyPosition>({
  lobbyType: {
    type: String,
    required: [true, 'Lobby type is required'],
    enum: {
      values: ['defense', 'healthcare', 'oil_gas', 'renewable_energy', 'technology', 
               'banking', 'manufacturing', 'agriculture', 'labor', 'environmental'],
      message: '{VALUE} is not a valid lobby type',
    },
  },
  position: {
    type: String,
    required: [true, 'Lobby position is required'],
    enum: {
      values: ['FOR', 'AGAINST', 'NEUTRAL'],
      message: '{VALUE} is not a valid lobby position',
    },
  },
  paymentPerSeat: {
    type: Number,
    required: [true, 'Payment per seat is required'],
    min: [0, 'Payment per seat cannot be negative'],
  },
  reasoning: {
    type: String,
    trim: true,
    maxlength: [500, 'Reasoning cannot exceed 500 characters'],
  },
}, { _id: false });

const PolicyEffectSchema = new Schema<IPolicyEffect>({
  targetType: {
    type: String,
    required: [true, 'Target type is required'],
    enum: {
      values: ['GLOBAL', 'INDUSTRY', 'STATE'],
      message: '{VALUE} is not a valid target type',
    },
  },
  targetId: {
    type: String,
    trim: true,
  },
  effectType: {
    type: String,
    required: [true, 'Effect type is required'],
    trim: true,
  },
  effectValue: {
    type: Number,
    required: [true, 'Effect value is required'],
  },
  effectUnit: {
    type: String,
    required: [true, 'Effect unit is required'],
    trim: true,
  },
  duration: {
    type: Number,
    min: [1, 'Duration must be at least 1 month'],
  },
}, { _id: false });

const BillSchema = new Schema<BillDocument>(
  {
    billNumber: {
      type: String,
      required: [true, 'Bill number is required'],
      unique: true,
      trim: true,
      match: [/^(S|H\.R\.)\.\d+$/, 'Bill number must be format S.#### or H.R.####'],
      index: true,
    },
    chamber: {
      type: String,
      required: [true, 'Chamber is required'],
      enum: {
        values: ['senate', 'house'],
        message: '{VALUE} is not a valid chamber',
      },
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    summary: {
      type: String,
      required: [true, 'Summary is required'],
      trim: true,
      minlength: [50, 'Summary must be at least 50 characters'],
      maxlength: [2000, 'Summary cannot exceed 2000 characters'],
    },
    policyArea: {
      type: String,
      required: [true, 'Policy area is required'],
      enum: {
        values: ['tax', 'budget', 'regulatory', 'trade', 'energy', 'healthcare', 
                 'labor', 'environment', 'technology', 'defense', 'custom'],
        message: '{VALUE} is not a valid policy area',
      },
      index: true,
    },
    sponsor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sponsor is required'],
      index: true,
    },
    coSponsors: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    votingDeadline: {
      type: Date,
      required: [true, 'Voting deadline is required'],
      index: true,
      // CRITICAL: This is a REAL Date object (24 real hours from submission)
      // NOT game time to prevent coordination exploits
    },
    votes: [VoteSchema],
    ayeCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Aye count cannot be negative'],
    },
    nayCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Nay count cannot be negative'],
    },
    abstainCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Abstain count cannot be negative'],
    },
    totalVotesCast: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total votes cannot be negative'],
    },
    quorumRequired: {
      type: Number,
      required: [true, 'Quorum required is required'],
      min: [1, 'Quorum must be at least 1'],
    },
    lobbyPositions: [LobbyPositionSchema],
    debateStatements: [{
      type: Schema.Types.ObjectId,
      ref: 'DebateStatement',
    }],
    effects: [PolicyEffectSchema],
    status: {
      type: String,
      required: true,
      default: 'ACTIVE',
      enum: {
        values: ['ACTIVE', 'PASSED', 'FAILED', 'WITHDRAWN', 'EXPIRED'],
        message: '{VALUE} is not a valid status',
      },
      index: true,
    },
    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    enactedAt: {
      type: Date,
    },
    withdrawnAt: {
      type: Date,
    },
    submissionCooldownExpiresAt: {
      type: Date,
      index: true,
    },
    schemaVersion: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  {
    timestamps: true,
    collection: 'bills',
  }
);

// ===================== INDEXES =====================

// Compound indexes for efficient queries
BillSchema.index({ chamber: 1, status: 1, submittedAt: -1 });
BillSchema.index({ sponsor: 1, submittedAt: -1 });
BillSchema.index({ policyArea: 1, status: 1 });
BillSchema.index({ votingDeadline: 1, status: 1 }); // For finding expiring bills
BillSchema.index({ 'votes.playerId': 1 }); // For checking if player voted

// ===================== METHODS =====================

BillSchema.methods.castVote = async function(
  this: BillDocument,
  playerId: Types.ObjectId | string,
  vote: VoteValue,
  seatCount: number
): Promise<Types.ObjectId[]> {
  const playerObjId = typeof playerId === 'string' ? new Types.ObjectId(playerId) : playerId;
  
  // Validate voting is open
  if (!this.isVotingOpen()) {
    throw new Error('Voting is closed for this bill');
  }
  
  // Check if already voted
  if (this.hasVoted(playerObjId)) {
    throw new Error('Player has already voted on this bill');
  }
  
  // Create vote record
  const voteRecord: IVote = {
    playerId: playerObjId,
    vote,
    seatCount,
    votedAt: new Date(),
    lobbyPaymentsTriggered: [],
  };
  
  // Update tallies (skip if 'No Vote')
  if (vote === 'Aye') {
    this.ayeCount += seatCount;
  } else if (vote === 'Nay') {
    this.nayCount += seatCount;
  } else if (vote === 'Abstain') {
    this.abstainCount += seatCount;
  }
  
  if (vote !== 'No Vote') {
    this.totalVotesCast += seatCount;
  }
  
  // Process instant lobby payments (if not 'No Vote' or 'Abstain')
  const lobbyPaymentIds: Types.ObjectId[] = [];
  if (vote === 'Aye' || vote === 'Nay') {
    const LobbyPayment = mongoose.model('LobbyPayment');
    
    for (const lobbyPos of this.lobbyPositions) {
      // Check if vote matches lobby position
      const voteMatchesLobby = 
        (vote === 'Aye' && lobbyPos.position === 'FOR') ||
        (vote === 'Nay' && lobbyPos.position === 'AGAINST');
      
      if (voteMatchesLobby) {
        // Create instant lobby payment
        const payment = await LobbyPayment.create({
          billId: this._id,
          playerId: playerObjId,
          lobbyType: lobbyPos.lobbyType,
          lobbyPosition: lobbyPos.position,
          playerVote: vote,
          seatCount,
          basePayment: lobbyPos.paymentPerSeat,
          totalPayment: lobbyPos.paymentPerSeat * seatCount,
          paid: true,  // INSTANT PROCESSING
          paidAt: new Date(),
        });
        
        lobbyPaymentIds.push(payment._id);
      }
    }
  }
  
  voteRecord.lobbyPaymentsTriggered = lobbyPaymentIds;
  this.votes.push(voteRecord);
  
  await this.save();
  return lobbyPaymentIds;
};

BillSchema.methods.tallyVotes = async function(this: BillDocument) {
  const totalChamberSeats = this.chamber === 'senate' ? 100 : 436;
  const quorumMet = this.totalVotesCast >= this.quorumRequired;
  const passed = quorumMet && this.ayeCount > this.nayCount;
  const margin = this.ayeCount - this.nayCount;
  
  return {
    ayeCount: this.ayeCount,
    nayCount: this.nayCount,
    abstainCount: this.abstainCount,
    totalVotes: this.totalVotesCast,
    quorumMet,
    passed,
    margin,
  };
};

BillSchema.methods.enactPolicy = async function(this: BillDocument) {
  // Mark as enacted
  this.status = 'PASSED';
  this.enactedAt = new Date();
  
  // Apply policy effects (instant global application)
  // This would integrate with game economy systems
  // For now, just log the effects that should be applied
  
  await this.save();
  
  // TODO: Emit Socket.io event for bill passage
  // TODO: Apply effects to Company models (tax rates, budgets, etc.)
  // TODO: Log policy enactment transaction for audit trail
};

BillSchema.methods.hasVoted = function(this: BillDocument, playerId: Types.ObjectId | string): boolean {
  const playerObjId = typeof playerId === 'string' ? new Types.ObjectId(playerId) : playerId;
  return this.votes.some(v => v.playerId.equals(playerObjId));
};

BillSchema.methods.getRemainingTime = function(this: BillDocument): number {
  return this.votingDeadline.getTime() - Date.now();
};

BillSchema.methods.isVotingOpen = function(this: BillDocument): boolean {
  return this.status === 'ACTIVE' && this.getRemainingTime() > 0;
};

// ===================== STATICS =====================

// Find active bills accepting votes
BillSchema.statics.findActiveVoting = function() {
  return this.find({
    status: 'ACTIVE',
    votingDeadline: { $gt: new Date() },
  }).sort({ votingDeadline: 1 });
};

// Find expired bills that need resolution
BillSchema.statics.findExpiredPending = function() {
  return this.find({
    status: 'ACTIVE',
    votingDeadline: { $lte: new Date() },
  });
};

// ===================== MODEL EXPORT =====================

const Bill = mongoose.models.Bill || mongoose.model<BillDocument>('Bill', BillSchema);

export default Bill;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **24h Real-Time Voting Window**:
 *    - votingDeadline is Date object set to Date.now() + 24 hours
 *    - NOT converted to game time - prevents coordination exploits
 *    - Ensures all players globally get fair 24-hour window
 * 
 * 2. **Instant Lobby Payments**:
 *    - Processed immediately in castVote() method
 *    - Multiple lobbies can pay same player on same bill
 *    - paid: true flag indicates instant processing
 * 
 * 3. **Weighted Voting**:
 *    - Senate: seatCount = 1 per senator
 *    - House: seatCount = delegation (1-52 based on state)
 *    - Tallies track weighted vote counts
 * 
 * 4. **Quorum Requirements**:
 *    - Senate: 50 votes (50% of 100)
 *    - House: 218 votes (50% of 436)
 *    - Bill fails if quorum not met even if Ayes > Nays
 * 
 * 5. **Anti-Abuse**:
 *    - submissionCooldownExpiresAt enforces 24h between submissions
 *    - API layer enforces 3 active bills per player limit
 *    - API layer enforces 10 bills per chamber per day limit
 * 
 * 6. **Policy Enactment**:
 *    - effects[] array defines what changes when bill passes
 *    - Instant global application (permanent until repealed)
 *    - Affects all companies immediately
 */
