"use strict";
/**
 * @file src/lib/db/models/InvestmentPortfolio.ts
 * @description Investment Portfolio Mongoose model for banking system
 * @created 2025-11-23
 *
 * OVERVIEW:
 * Mongoose model for managing company investment portfolios with rebalancing,
 * risk assessment, and performance tracking across multiple investment types.
 *
 * FEATURES:
 * - Portfolio-level performance tracking
 * - Automatic rebalancing based on target allocations
 * - Risk tolerance assessment and management
 * - Diversification scoring and optimization
 * - Integration with individual Investment model
 *
 * USAGE:
 * import InvestmentPortfolio from '@/lib/db/models/InvestmentPortfolio';
 * const portfolio = await InvestmentPortfolio.findOne({ companyId });
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
const enums_1 = require("@/lib/types/enums");
/**
 * Investment Portfolio schema
 */
const InvestmentPortfolioSchema = new mongoose_1.Schema({
    companyId: {
        type: String,
        required: true,
        unique: true,
        // index: true removed - unique: true already creates an index
    },
    totalValue: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    totalInvested: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    totalDividends: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    investments: [{
            type: String,
            ref: 'Investment',
        }],
    lastRebalanced: {
        type: Date,
    },
    riskTolerance: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
        default: 5,
    },
    targetAllocations: {
        type: Map,
        of: Number,
        default: {},
    },
}, {
    timestamps: true,
});
/**
 * Indexes for performance
 * Note: companyId already has unique: true at field level (line 76), which creates the index
 * No additional schema-level index needed to avoid duplicate index warnings
 */
/**
 * Virtual for total return
 */
InvestmentPortfolioSchema.virtual('totalReturn').get(function () {
    return (this.totalValue + this.totalDividends) - this.totalInvested;
});
/**
 * Virtual for return percentage
 */
InvestmentPortfolioSchema.virtual('returnPercentage').get(function () {
    const totalReturn = (this.totalValue + this.totalDividends) - this.totalInvested;
    return this.totalInvested > 0 ? (totalReturn / this.totalInvested) * 100 : 0;
});
/**
 * Instance method to calculate total value
 */
InvestmentPortfolioSchema.methods.calculateTotalValue = async function () {
    const Investment = mongoose_1.default.model('Investment');
    const investments = await Investment.find({
        _id: { $in: this.investments },
        isActive: true,
    });
    this.totalValue = investments.reduce((sum, inv) => sum + (inv.units * inv.currentPrice), 0);
    return this.totalValue;
};
/**
 * Instance method to calculate diversification score
 */
InvestmentPortfolioSchema.methods.calculateDiversificationScore = async function () {
    const Investment = mongoose_1.default.model('Investment');
    const investments = await Investment.find({
        _id: { $in: this.investments },
        isActive: true,
    });
    if (investments.length === 0)
        return 0;
    // Count investments by type
    const typeCounts = {};
    let totalValue = 0;
    for (const investment of investments) {
        const value = investment.units * investment.currentPrice;
        totalValue += value;
        if (!typeCounts[investment.type]) {
            typeCounts[investment.type] = 0;
        }
        typeCounts[investment.type] += value;
    }
    // Calculate diversification score (inverse of concentration)
    const types = Object.keys(typeCounts);
    if (types.length === 0)
        return 0;
    let diversificationScore = 0;
    for (const type of types) {
        const percentage = totalValue > 0 ? typeCounts[type] / totalValue : 0;
        diversificationScore += percentage * percentage; // Sum of squares
    }
    // Lower score means better diversification (more types with equal weight)
    return Math.max(0, 1 - diversificationScore);
};
/**
 * Instance method to get allocation breakdown
 */
InvestmentPortfolioSchema.methods.getAllocationBreakdown = async function () {
    const Investment = mongoose_1.default.model('Investment');
    const investments = await Investment.find({
        _id: { $in: this.investments },
        isActive: true,
    });
    const breakdown = {};
    let totalValue = 0;
    // Calculate current allocations
    for (const investment of investments) {
        const value = investment.units * investment.currentPrice;
        totalValue += value;
        if (!breakdown[investment.type]) {
            breakdown[investment.type] = { amount: 0, percentage: 0 };
        }
        breakdown[investment.type].amount += value;
    }
    // Calculate percentages
    for (const type of Object.keys(breakdown)) {
        breakdown[type].percentage = totalValue > 0
            ? (breakdown[type].amount / totalValue) * 100
            : 0;
    }
    return breakdown;
};
/**
 * Instance method to check if rebalancing is needed
 */
InvestmentPortfolioSchema.methods.needsRebalancing = async function (threshold = 5) {
    var _a;
    const currentAllocations = await this.getAllocationBreakdown();
    for (const [type, targetPercentage] of Object.entries(this.targetAllocations)) {
        const currentPercentage = ((_a = currentAllocations[type]) === null || _a === void 0 ? void 0 : _a.percentage) || 0;
        const deviation = Math.abs(currentPercentage - targetPercentage);
        if (deviation > threshold) {
            return true;
        }
    }
    return false;
};
/**
 * Instance method to generate rebalancing recommendations
 */
InvestmentPortfolioSchema.methods.generateRebalancingRecommendations = async function () {
    var _a;
    const currentAllocations = await this.getAllocationBreakdown();
    const recommendations = [];
    for (const [typeStr, targetPercentage] of Object.entries(this.targetAllocations)) {
        const type = typeStr;
        const currentPercentage = ((_a = currentAllocations[type]) === null || _a === void 0 ? void 0 : _a.percentage) || 0;
        const deviation = currentPercentage - targetPercentage;
        let action = 'HOLD';
        let amount = 0;
        if (Math.abs(deviation) > 2) { // 2% threshold for action
            if (deviation > 0) {
                action = 'SELL';
                amount = (deviation / 100) * this.totalValue;
            }
            else {
                action = 'BUY';
                amount = Math.abs(deviation / 100) * this.totalValue;
            }
        }
        recommendations.push({
            type,
            currentPercentage,
            targetPercentage: targetPercentage,
            action,
            amount,
        });
    }
    return recommendations;
};
/**
 * Instance method to update portfolio totals
 */
InvestmentPortfolioSchema.methods.updateTotals = async function () {
    const Investment = mongoose_1.default.model('Investment');
    const investments = await Investment.find({
        _id: { $in: this.investments },
        isActive: true,
    });
    this.totalValue = 0;
    this.totalDividends = 0;
    for (const investment of investments) {
        this.totalValue += investment.units * investment.currentPrice;
        this.totalDividends += investment.dividendsPaid;
    }
};
/**
 * Static method to create default portfolio for company
 */
InvestmentPortfolioSchema.statics.createDefaultPortfolio = async function (companyId) {
    const defaultAllocations = {
        [enums_1.InvestmentType.STOCKS]: 40,
        [enums_1.InvestmentType.BONDS]: 30,
        [enums_1.InvestmentType.REAL_ESTATE]: 20,
        [enums_1.InvestmentType.INDEX_FUNDS]: 10,
    };
    const portfolio = new this({
        companyId,
        riskTolerance: 5,
        targetAllocations: defaultAllocations,
    });
    await portfolio.save();
    return portfolio;
};
/**
 * Pre-save middleware to update totals
 */
InvestmentPortfolioSchema.pre('save', async function (next) {
    if (this.isModified('investments') || this.isNew) {
        await this.updateTotals();
    }
    next();
});
// Create and export the model
const InvestmentPortfolio = mongoose_1.default.models.InvestmentPortfolio ||
    mongoose_1.default.model('InvestmentPortfolio', InvestmentPortfolioSchema);
exports.default = InvestmentPortfolio;
//# sourceMappingURL=InvestmentPortfolio.js.map