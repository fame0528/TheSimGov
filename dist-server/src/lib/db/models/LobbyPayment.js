"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// ===================== SCHEMA DEFINITION =====================
const LobbyPaymentSchema = new mongoose_1.Schema({
    billId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Bill',
        required: [true, 'Bill ID is required'],
        index: true,
    },
    playerId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
    collection: 'lobby_payments',
});
// ===================== INDEXES =====================
// Compound indexes for efficient queries
LobbyPaymentSchema.index({ playerId: 1, paid: 1, paidAt: -1 }); // Player payment history
LobbyPaymentSchema.index({ billId: 1, lobbyType: 1 }); // Bill lobby activity
LobbyPaymentSchema.index({ lobbyType: 1, paidAt: -1 }); // Lobby payment analytics
LobbyPaymentSchema.index({ paidAt: -1 }); // Recent payments
// ===================== METHODS =====================
LobbyPaymentSchema.methods.processPayment = async function () {
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
LobbyPaymentSchema.methods.isEligible = function () {
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
LobbyPaymentSchema.statics.getPlayerTotal = async function (playerId) {
    const result = await this.aggregate([
        {
            $match: {
                playerId: typeof playerId === 'string' ? new mongoose_1.Types.ObjectId(playerId) : playerId,
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
LobbyPaymentSchema.statics.getBillSummary = async function (billId) {
    const result = await this.aggregate([
        {
            $match: {
                billId: typeof billId === 'string' ? new mongoose_1.Types.ObjectId(billId) : billId,
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
LobbyPaymentSchema.statics.getLobbyLeaderboard = async function () {
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
const LobbyPayment = mongoose_1.default.models.LobbyPayment ||
    mongoose_1.default.model('LobbyPayment', LobbyPaymentSchema);
exports.default = LobbyPayment;
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
//# sourceMappingURL=LobbyPayment.js.map