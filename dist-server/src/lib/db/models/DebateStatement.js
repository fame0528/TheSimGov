"use strict";
/**
 * @file src/lib/db/models/DebateStatement.ts
 * @description Legislative debate statements with persuasion scoring
 * @created 2025-11-26
 * @author ECHO v1.3.0
 *
 * OVERVIEW:
 * Elected officials can submit debate statements FOR or AGAINST bills during voting window.
 * Statements have persuasion scores (±5% vote swing potential) based on rhetoric quality.
 * Max 3 statements per player per bill to prevent spam.
 *
 * KEY DESIGN DECISIONS:
 * - **Persuasion Score:** ±5% maximum vote influence (high-quality rhetoric can swing votes)
 * - **Position Stances:** FOR, AGAINST, NEUTRAL (can explain position without advocacy)
 * - **Anti-Spam:** 3 statement maximum per player per bill
 * - **Engagement:** Optional upvote system for community highlighting
 * - **Timing:** Statements only submittable during active voting window
 *
 * USAGE:
 * ```typescript
 * import DebateStatement from '@/lib/db/models/DebateStatement';
 *
 * // Submit debate statement
 * const statement = await DebateStatement.create({
 *   billId: bill._id,
 *   playerId: senator._id,
 *   position: 'FOR',
 *   text: 'This renewable energy bill will create 50,000 jobs...',
 *   persuasionScore: 3.2, // Calculated by AI or rhetoric scoring
 *   submittedAt: new Date()
 * });
 *
 * // Get statements for bill
 * const statements = await DebateStatement.find({ billId: bill._id })
 *   .populate('playerId', 'username officeName')
 *   .sort({ persuasionScore: -1 });
 *
 * // Check statement count for player
 * const count = await DebateStatement.countPlayerStatements(player._id, bill._id);
 * if (count >= 3) throw new Error('Maximum 3 statements per bill');
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
const DebateStatementSchema = new mongoose_1.Schema({
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
    position: {
        type: String,
        required: [true, 'Position is required'],
        enum: {
            values: ['FOR', 'AGAINST', 'NEUTRAL'],
            message: '{VALUE} is not a valid debate position',
        },
        index: true,
    },
    text: {
        type: String,
        required: [true, 'Statement text is required'],
        minlength: [50, 'Statement must be at least 50 characters'],
        maxlength: [2000, 'Statement cannot exceed 2000 characters'],
        trim: true,
    },
    persuasionScore: {
        type: Number,
        required: [true, 'Persuasion score is required'],
        min: [-5.0, 'Persuasion score cannot be less than -5.0'],
        max: [5.0, 'Persuasion score cannot exceed 5.0'],
        default: 0,
    },
    upvotes: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Upvotes cannot be negative'],
    },
    submittedAt: {
        type: Date,
        required: true,
        default: Date.now,
        index: true,
    },
    schemaVersion: {
        type: Number,
        required: true,
        default: 1,
    },
}, {
    timestamps: true,
    collection: 'debate_statements',
});
// ===================== INDEXES =====================
// Compound indexes for efficient queries
DebateStatementSchema.index({ billId: 1, playerId: 1 }); // Check player statement count
DebateStatementSchema.index({ billId: 1, persuasionScore: -1 }); // Top persuasive statements
DebateStatementSchema.index({ billId: 1, upvotes: -1 }); // Most popular statements
DebateStatementSchema.index({ playerId: 1, submittedAt: -1 }); // Player debate history
// ===================== METHODS =====================
DebateStatementSchema.methods.calculateVoteSwing = function (totalVoters) {
    // Persuasion score is percentage (e.g., 3.5 = 3.5% swing)
    const swingPercentage = this.persuasionScore / 100;
    const estimatedSwing = Math.round(totalVoters * swingPercentage);
    return estimatedSwing;
};
DebateStatementSchema.methods.isEditable = function () {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.submittedAt > fiveMinutesAgo;
};
// ===================== STATICS =====================
// Count player statements for bill (enforce 3-statement limit)
DebateStatementSchema.statics.countPlayerStatements = async function (playerId, billId) {
    return await this.countDocuments({
        playerId: typeof playerId === 'string' ? new mongoose_1.Types.ObjectId(playerId) : playerId,
        billId: typeof billId === 'string' ? new mongoose_1.Types.ObjectId(billId) : billId,
    });
};
// Get statements for bill sorted by persuasion or upvotes
DebateStatementSchema.statics.getBillStatements = async function (billId, sortBy = 'persuasion') {
    const sortField = sortBy === 'persuasion'
        ? { persuasionScore: -1 }
        : sortBy === 'upvotes'
            ? { upvotes: -1 }
            : { submittedAt: -1 };
    return await this.find({
        billId: typeof billId === 'string' ? new mongoose_1.Types.ObjectId(billId) : billId,
    })
        .populate('playerId', 'username officeName partyAffiliation')
        .sort(sortField)
        .exec();
};
// Get player's debate activity
DebateStatementSchema.statics.getPlayerActivity = async function (playerId) {
    const result = await this.aggregate([
        {
            $match: {
                playerId: typeof playerId === 'string' ? new mongoose_1.Types.ObjectId(playerId) : playerId,
            },
        },
        {
            $group: {
                _id: null,
                totalStatements: { $sum: 1 },
                avgPersuasionScore: { $avg: '$persuasionScore' },
                totalUpvotes: { $sum: '$upvotes' },
                positionBreakdown: {
                    $push: '$position',
                },
            },
        },
        {
            $project: {
                _id: 0,
                totalStatements: 1,
                avgPersuasionScore: { $round: ['$avgPersuasionScore', 2] },
                totalUpvotes: 1,
                forCount: {
                    $size: {
                        $filter: {
                            input: '$positionBreakdown',
                            cond: { $eq: ['$$this', 'FOR'] },
                        },
                    },
                },
                againstCount: {
                    $size: {
                        $filter: {
                            input: '$positionBreakdown',
                            cond: { $eq: ['$$this', 'AGAINST'] },
                        },
                    },
                },
                neutralCount: {
                    $size: {
                        $filter: {
                            input: '$positionBreakdown',
                            cond: { $eq: ['$$this', 'NEUTRAL'] },
                        },
                    },
                },
            },
        },
    ]);
    return result[0] || {
        totalStatements: 0,
        avgPersuasionScore: 0,
        totalUpvotes: 0,
        forCount: 0,
        againstCount: 0,
        neutralCount: 0,
    };
};
// ===================== MODEL EXPORT =====================
const DebateStatement = mongoose_1.default.models.DebateStatement ||
    mongoose_1.default.model('DebateStatement', DebateStatementSchema);
exports.default = DebateStatement;
/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Persuasion Scoring**:
 *    - Range: -5.0 to +5.0 (percentage points)
 *    - Positive scores help bill passage, negative hurt passage
 *    - Calculated by AI/NLP analysis or manual admin assignment
 *    - Senate (100 voters): +5% score = ~5 votes swayed
 *    - House (436 voters): +5% score = ~22 votes swayed
 *
 * 2. **Anti-Spam Enforcement**:
 *    - countPlayerStatements() static checks 3-statement limit
 *    - API layer validates before allowing submission
 *    - Prevents statement spamming and debate flooding
 *
 * 3. **Position Stances**:
 *    - FOR: Advocating bill passage (persuasion pushes Aye)
 *    - AGAINST: Opposing bill (persuasion pushes Nay)
 *    - NEUTRAL: Explaining position without advocacy (informational)
 *
 * 4. **Engagement Metrics**:
 *    - upvotes: Community can highlight compelling statements
 *    - Optional feature, doesn't affect persuasion score
 *    - Sorting options: persuasion, upvotes, recent
 *
 * 5. **Edit Window**:
 *    - isEditable() allows 5-minute edit window
 *    - Prevents typo embarrassment while limiting manipulation
 *    - After 5 minutes, statement locked (immutable record)
 *
 * 6. **Timing Validation**:
 *    - Statements only submittable during active voting window
 *    - Enforced at API layer (check Bill.isVotingOpen())
 *    - No statements after bill passes/fails/expires
 *
 * 7. **Analytics**:
 *    - getPlayerActivity() provides debate participation stats
 *    - Tracks position breakdown (FOR/AGAINST/NEUTRAL ratio)
 *    - Average persuasion score indicates rhetoric effectiveness
 *
 * 8. **Future Enhancements**:
 *    - AI-powered persuasion scoring (NLP sentiment analysis)
 *    - Debate response threading (statements can reply to others)
 *    - Fact-checking integration (flag misleading claims)
 *    - Real-time vote swing visualization
 */
//# sourceMappingURL=DebateStatement.js.map