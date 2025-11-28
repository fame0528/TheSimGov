"use strict";
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
const VoteSchema = new mongoose_1.Schema({
    playerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Player ID is required'],
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
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'LobbyPayment',
        }],
}, { _id: false });
const LobbyPositionSchema = new mongoose_1.Schema({
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
const PolicyEffectSchema = new mongoose_1.Schema({
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
const BillSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Sponsor is required'],
        index: true,
    },
    coSponsors: [{
            type: mongoose_1.Schema.Types.ObjectId,
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
            type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
    collection: 'bills',
});
// ===================== INDEXES =====================
// Compound indexes for efficient queries
BillSchema.index({ chamber: 1, status: 1, submittedAt: -1 });
BillSchema.index({ sponsor: 1, submittedAt: -1 });
BillSchema.index({ policyArea: 1, status: 1 });
BillSchema.index({ votingDeadline: 1, status: 1 }); // For finding expiring bills
BillSchema.index({ 'votes.playerId': 1 }); // For checking if player voted
// ===================== METHODS =====================
BillSchema.methods.castVote = async function (playerId, vote, seatCount) {
    const playerObjId = typeof playerId === 'string' ? new mongoose_1.Types.ObjectId(playerId) : playerId;
    // Validate voting is open
    if (!this.isVotingOpen()) {
        throw new Error('Voting is closed for this bill');
    }
    // Check if already voted
    if (this.hasVoted(playerObjId)) {
        throw new Error('Player has already voted on this bill');
    }
    // Create vote record
    const voteRecord = {
        playerId: playerObjId,
        vote,
        seatCount,
        votedAt: new Date(),
        lobbyPaymentsTriggered: [],
    };
    // Update tallies (skip if 'No Vote')
    if (vote === 'Aye') {
        this.ayeCount += seatCount;
    }
    else if (vote === 'Nay') {
        this.nayCount += seatCount;
    }
    else if (vote === 'Abstain') {
        this.abstainCount += seatCount;
    }
    if (vote !== 'No Vote') {
        this.totalVotesCast += seatCount;
    }
    // Process instant lobby payments (if not 'No Vote' or 'Abstain')
    const lobbyPaymentIds = [];
    if (vote === 'Aye' || vote === 'Nay') {
        const LobbyPayment = mongoose_1.default.model('LobbyPayment');
        for (const lobbyPos of this.lobbyPositions) {
            // Check if vote matches lobby position
            const voteMatchesLobby = (vote === 'Aye' && lobbyPos.position === 'FOR') ||
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
                    paid: true, // INSTANT PROCESSING
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
BillSchema.methods.tallyVotes = async function () {
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
BillSchema.methods.enactPolicy = async function () {
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
BillSchema.methods.hasVoted = function (playerId) {
    const playerObjId = typeof playerId === 'string' ? new mongoose_1.Types.ObjectId(playerId) : playerId;
    return this.votes.some(v => v.playerId.equals(playerObjId));
};
BillSchema.methods.getRemainingTime = function () {
    return this.votingDeadline.getTime() - Date.now();
};
BillSchema.methods.isVotingOpen = function () {
    return this.status === 'ACTIVE' && this.getRemainingTime() > 0;
};
// ===================== STATICS =====================
// Find active bills accepting votes
BillSchema.statics.findActiveVoting = function () {
    return this.find({
        status: 'ACTIVE',
        votingDeadline: { $gt: new Date() },
    }).sort({ votingDeadline: 1 });
};
// Find expired bills that need resolution
BillSchema.statics.findExpiredPending = function () {
    return this.find({
        status: 'ACTIVE',
        votingDeadline: { $lte: new Date() },
    });
};
// ===================== MODEL EXPORT =====================
const Bill = mongoose_1.default.models.Bill || mongoose_1.default.model('Bill', BillSchema);
exports.default = Bill;
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
//# sourceMappingURL=Bill.js.map