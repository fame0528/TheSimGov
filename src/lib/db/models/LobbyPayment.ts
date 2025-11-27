/**
 * @file src/lib/db/models/LobbyPayment.ts
 * @description Lobby payment tracking with instant processing
 * @created 2025-11-26
 * @author ECHO v1.3.0
 *
 * OVERVIEW:
 * Tracks lobby payments to elected officials when their votes match lobby preferences.
 * Implements INSTANT payment processing - money deposited immediately when vote cast.
 * Multiple lobbies can pay same player on same bill if vote aligns with multiple positions.
 *
 * KEY DESIGN DECISIONS:
 * - **Instant Processing:** paid: true immediately upon vote matching lobby position
 * - **Multiple Payments:** Player can receive payments from multiple lobbies same bill
 * - **Payment Calculation:** $120k per Senate seat, $23k per House seat
 * - **Audit Trail:** Complete record of lobby type, position, vote, and payment amount
 *
 * USAGE:
 * ```typescript
 * import LobbyPayment from '@/lib/db/models/LobbyPayment';
 *
 * // Payments created automatically by Bill.castVote()
 * const payment = await LobbyPayment.create({
 *   billId: bill._id,
 *   playerId: voter._id,
 *   lobbyType: 'renewable_energy',
 *   lobbyPosition: 'FOR',
 *   playerVote: 'Aye',
 *   seatCount: 1,
 *   basePayment: 120000,
 *   totalPayment: 120000,
 *   paid: true,
 *   paidAt: new Date()
 * });
 *
 * // Get player's lobby income
 * const payments = await LobbyPayment.find({ 
 *   playerId: player._id,
 *   paid: true 
 * });
 * const totalIncome = payments.reduce((sum, p) => sum + p.totalPayment, 0);
 * ```
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ===================== TYPE DEFINITIONS =====================

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

export type VoteValue = 'Aye' | 'Nay' | 'Abstain' | 'No Vote';

/**
 * Lobby payment document interface
 */
export interface ILobbyPayment extends Document {
  // Payment context
  billId: Types.ObjectId;         // Bill that triggered payment
  playerId: Types.ObjectId;       // Player receiving payment
  lobbyType: LobbyType;           // Which lobby is paying
  lobbyPosition: LobbyPosition;   // What position lobby wanted
  playerVote: VoteValue;          // What player actually voted
  
  // Payment calculation
  seatCount: number;              // Senate: 1, House: delegation count
  basePayment: number;            // Payment per seat ($120k or $23k)
  totalPayment: number;           // basePayment * seatCount
  
  // Processing status (INSTANT by default)
  paid: boolean;                  // True = payment processed
  paidAt?: Date;                  // Timestamp of payment processing
  
  // Audit trail
  processedByBillCastVote: boolean; // True = instant processing during vote
  
  // Schema version
  schemaVersion: 1;
}

/**
 * Lobby payment schema methods interface
 */
export interface ILobbyPaymentMethods {
  /**
   * Process payment (deposit to player account)
   * Called automatically during Bill.castVote() for instant processing
   */
  processPayment(): Promise<void>;
  
  /**
   * Check if payment is eligible (vote matches lobby position)
   * @returns True if vote aligns with lobby preference
   */
  isEligible(): boolean;
}

export type LobbyPaymentDocument = ILobbyPayment & ILobbyPaymentMethods & Document;

// ===================== SCHEMA DEFINITION =====================

const LobbyPaymentSchema = new Schema<LobbyPaymentDocument>(
  {
    billId: {
      type: Schema.Types.ObjectId,
      ref: 'Bill',
      required: [true, 'Bill ID is required'],
      index: true,
    },
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Player ID is required'],
      index: true,
    },
    lobbyType: {
      type: String,
      required: [true, 'Lobby type is required'],
      enum: {
        values: ['defense', 'healthcare', 'oil_gas', 'renewable_energy', 'technology',
                 'banking', 'manufacturing', 'agriculture', 'labor', 'environmental'],
        message: '{VALUE} is not a valid lobby type',
      },
      index: true,
    },
    lobbyPosition: {
      type: String,
      required: [true, 'Lobby position is required'],
      enum: {
        values: ['FOR', 'AGAINST', 'NEUTRAL'],
        message: '{VALUE} is not a valid lobby position',
      },
    },
    playerVote: {
      type: String,
      required: [true, 'Player vote is required'],
      enum: {
        values: ['Aye', 'Nay', 'Abstain', 'No Vote'],
        message: '{VALUE} is not a valid vote',
      },
    },
    seatCount: {
      type: Number,
      required: [true, 'Seat count is required'],
      min: [1, 'Seat count must be at least 1'],
      max: [52, 'Seat count cannot exceed 52'],
    },
    basePayment: {
      type: Number,
      required: [true, 'Base payment is required'],
      min: [0, 'Base payment cannot be negative'],
    },
    totalPayment: {
      type: Number,
      required: [true, 'Total payment is required'],
      min: [0, 'Total payment cannot be negative'],
    },
    paid: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    paidAt: {
      type: Date,
      index: true,
    },
    processedByBillCastVote: {
      type: Boolean,
      required: true,
      default: true,
      // True indicates instant processing during vote (standard flow)
      // False would indicate manual/batch processing (not used currently)
    },
    schemaVersion: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  {
    timestamps: true,
    collection: 'lobby_payments',
  }
);

// ===================== INDEXES =====================

// Compound indexes for efficient queries
LobbyPaymentSchema.index({ playerId: 1, paid: 1, paidAt: -1 }); // Player payment history
LobbyPaymentSchema.index({ billId: 1, lobbyType: 1 }); // Bill lobby activity
LobbyPaymentSchema.index({ lobbyType: 1, paidAt: -1 }); // Lobby payment analytics
LobbyPaymentSchema.index({ paidAt: -1 }); // Recent payments

// ===================== METHODS =====================

LobbyPaymentSchema.methods.processPayment = async function(this: LobbyPaymentDocument): Promise<void> {
  if (this.paid) {
    throw new Error('Payment already processed');
  }
  
  if (!this.isEligible()) {
    throw new Error('Payment not eligible - vote does not match lobby position');
  }
  
  // Mark as paid
  this.paid = true;
  this.paidAt = new Date();
  
  await this.save();
  
  // TODO: Integrate with player account/wallet system to deposit funds
  // TODO: Emit Socket.io event for payment notification
  // TODO: Log payment transaction for audit trail
};

LobbyPaymentSchema.methods.isEligible = function(this: LobbyPaymentDocument): boolean {
  // Vote must match lobby position to be eligible for payment
  if (this.lobbyPosition === 'FOR' && this.playerVote === 'Aye') {
    return true;
  }
  if (this.lobbyPosition === 'AGAINST' && this.playerVote === 'Nay') {
    return true;
  }
  // NEUTRAL lobbies don't pay (monitoring only)
  // Abstain and No Vote don't earn payments
  return false;
};

// ===================== STATICS =====================

// Get total payments for player
LobbyPaymentSchema.statics.getPlayerTotal = async function(playerId: Types.ObjectId | string) {
  const result = await this.aggregate([
    {
      $match: {
        playerId: typeof playerId === 'string' ? new Types.ObjectId(playerId) : playerId,
        paid: true,
      },
    },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: '$totalPayment' },
        paymentCount: { $sum: 1 },
      },
    },
  ]);
  
  return result[0] || { totalPayments: 0, paymentCount: 0 };
};

// Get lobby payment summary by bill
LobbyPaymentSchema.statics.getBillSummary = async function(billId: Types.ObjectId | string) {
  const result = await this.aggregate([
    {
      $match: {
        billId: typeof billId === 'string' ? new Types.ObjectId(billId) : billId,
        paid: true,
      },
    },
    {
      $group: {
        _id: '$lobbyType',
        totalPaid: { $sum: '$totalPayment' },
        recipientCount: { $sum: 1 },
      },
    },
    {
      $sort: { totalPaid: -1 },
    },
  ]);
  
  return result;
};

// Get lobby spending leaderboard
LobbyPaymentSchema.statics.getLobbyLeaderboard = async function() {
  const result = await this.aggregate([
    {
      $match: { paid: true },
    },
    {
      $group: {
        _id: '$lobbyType',
        totalSpent: { $sum: '$totalPayment' },
        billCount: { $addToSet: '$billId' },
        recipientCount: { $addToSet: '$playerId' },
      },
    },
    {
      $project: {
        lobbyType: '$_id',
        totalSpent: 1,
        billCount: { $size: '$billCount' },
        recipientCount: { $size: '$recipientCount' },
      },
    },
    {
      $sort: { totalSpent: -1 },
    },
  ]);
  
  return result;
};

// ===================== MODEL EXPORT =====================

const LobbyPayment = mongoose.models.LobbyPayment || 
  mongoose.model<LobbyPaymentDocument>('LobbyPayment', LobbyPaymentSchema);

export default LobbyPayment;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Instant Processing**:
 *    - paid: true set immediately during Bill.castVote()
 *    - paidAt timestamp captures exact payment time
 *    - No batch processing or delays
 * 
 * 2. **Multiple Payments**:
 *    - Player can receive payments from MULTIPLE lobbies same bill
 *    - Example: Defense + Oil/Gas both want NAY → player votes NAY → receives BOTH payments
 *    - Each lobby creates separate LobbyPayment record
 * 
 * 3. **Payment Calculation**:
 *    - Senate seats: $120,000 per seat × 1 = $120,000
 *    - House seats: $23,000 per seat × delegation (1-52)
 *    - California rep: $23,000 × 52 = $1,196,000 if all lobbies align
 * 
 * 4. **Eligibility**:
 *    - FOR position requires Aye vote
 *    - AGAINST position requires Nay vote
 *    - NEUTRAL lobbies don't pay (monitoring/research only)
 *    - Abstain and No Vote earn no payments
 * 
 * 5. **Audit Trail**:
 *    - Complete record of lobby type, position, vote, amount
 *    - processedByBillCastVote flag indicates instant vs manual processing
 *    - Timestamps provide exact payment timing
 * 
 * 6. **Analytics**:
 *    - Static methods provide aggregated payment data
 *    - Player total income from lobbying
 *    - Bill-specific lobby spending
 *    - Lobby spending leaderboard
 */
