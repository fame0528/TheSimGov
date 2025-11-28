"use strict";
/**
 * @file src/lib/db/models/Investment.ts
 * @description Investment Mongoose model for banking system
 * @created 2025-11-23
 *
 * OVERVIEW:
 * Mongoose model for company investment portfolios supporting multiple investment types,
 * performance tracking, dividend payments, and portfolio management.
 *
 * FEATURES:
 * - 4 investment types (Stocks, Bonds, Real Estate, Index Funds)
 * - Real-time price tracking and performance calculation
 * - Dividend payment automation
 * - Portfolio rebalancing and optimization
 * - Risk assessment and diversification metrics
 *
 * USAGE:
 * import Investment from '@/lib/db/models/Investment';
 * const investments = await Investment.find({ companyId });
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
exports.InvestmentPortfolio = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("@/lib/types/enums");
/**
 * Investment schema
 */
const InvestmentSchema = new mongoose_1.Schema({
    companyId: {
        type: String,
        required: true,
        // index: true removed - using compound indexes { companyId: 1, type: 1 } and { companyId: 1, isActive: 1 }
    },
    type: {
        type: String,
        enum: Object.values(enums_1.InvestmentType),
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 1000, // Minimum $1k investment
    },
    purchasePrice: {
        type: Number,
        required: true,
        min: 0.01,
    },
    currentPrice: {
        type: Number,
        required: true,
        min: 0.01,
    },
    units: {
        type: Number,
        required: true,
        min: 0.01,
    },
    purchaseDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    lastUpdated: {
        type: Date,
        required: true,
        default: Date.now,
    },
    dividendsPaid: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    expectedReturn: {
        type: Number,
        required: true,
        min: 0,
        max: 1, // 0-100% as decimal
    },
    volatility: {
        type: Number,
        required: true,
        min: 0,
        max: 1, // 0-100% as decimal
    },
    lastDividendDate: {
        type: Date,
    },
    nextDividendDate: {
        type: Date,
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true,
    },
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});
/**
 * Investment Portfolio schema
 */
const InvestmentPortfolioSchema = new mongoose_1.Schema({
    companyId: {
        type: String,
        required: true,
        unique: true,
        index: true,
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
 * Note: InvestmentPortfolio companyId has unique: true (line 155) which creates an index automatically
 */
InvestmentSchema.index({ companyId: 1, type: 1 });
InvestmentSchema.index({ companyId: 1, isActive: 1 });
InvestmentSchema.index({ nextDividendDate: 1 });
InvestmentSchema.index({ lastUpdated: 1 });
// Removed: InvestmentPortfolioSchema.index({ companyId: 1 }, { unique: true }) - duplicates field-level unique (line 155)
/**
 * Virtual for current value
 */
InvestmentSchema.virtual('currentValue').get(function () {
    return this.units * this.currentPrice;
});
/**
 * Virtual for total return
 */
InvestmentSchema.virtual('totalReturn').get(function () {
    const currentValue = this.units * this.currentPrice;
    return (currentValue + this.dividendsPaid) - this.amount;
});
/**
 * Virtual for return percentage
 */
InvestmentSchema.virtual('returnPercentage').get(function () {
    const currentValue = this.units * this.currentPrice;
    const totalReturn = (currentValue + this.dividendsPaid) - this.amount;
    return this.amount > 0 ? (totalReturn / this.amount) * 100 : 0;
});
/**
 * Instance method to update price
 */
InvestmentSchema.methods.updatePrice = function (newPrice) {
    this.currentPrice = newPrice;
    this.lastUpdated = new Date();
};
/**
 * Instance method to pay dividend
 */
InvestmentSchema.methods.payDividend = function (dividendAmount) {
    this.dividendsPaid += dividendAmount;
    this.lastDividendDate = new Date();
    // Schedule next dividend (quarterly for most investments)
    const nextDividend = new Date();
    nextDividend.setMonth(nextDividend.getMonth() + 3);
    this.nextDividendDate = nextDividend;
    return dividendAmount;
};
/**
 * Instance method to calculate quarterly dividend
 */
InvestmentSchema.methods.calculateQuarterlyDividend = function () {
    const annualDividendRate = this.getDividendRate();
    return (this.amount * annualDividendRate) / 4;
};
/**
 * Instance method to get dividend rate based on investment type
 */
InvestmentSchema.methods.getDividendRate = function () {
    switch (this.type) {
        case enums_1.InvestmentType.STOCKS:
            return 0.02; // 2% annual dividend
        case enums_1.InvestmentType.BONDS:
            return 0.03; // 3% annual dividend
        case enums_1.InvestmentType.REAL_ESTATE:
            return 0.04; // 4% annual dividend (REIT-like)
        case enums_1.InvestmentType.INDEX_FUNDS:
            return 0.025; // 2.5% annual dividend
        default:
            return 0.02;
    }
};
/**
 * Static method to update all investment prices (simulated market movement)
 */
InvestmentSchema.statics.updateAllPrices = async function () {
    const investments = await this.find({ isActive: true });
    for (const investment of investments) {
        // Simulate price movement based on volatility
        const randomChange = (Math.random() - 0.5) * 2 * investment.volatility;
        const maxChange = 0.1; // Max 10% change per update
        const change = Math.max(-maxChange, Math.min(maxChange, randomChange));
        const newPrice = investment.currentPrice * (1 + change);
        investment.updatePrice(Math.max(0.01, newPrice)); // Minimum price
        await investment.save();
    }
    return investments.length;
};
/**
 * Static method to process dividend payments
 */
InvestmentSchema.statics.processDividendPayments = async function () {
    const dueDividends = await this.find({
        isActive: true,
        nextDividendDate: { $lte: new Date() },
    });
    let totalDividendsPaid = 0;
    for (const investment of dueDividends) {
        const dividendAmount = investment.calculateQuarterlyDividend();
        investment.payDividend(dividendAmount);
        totalDividendsPaid += dividendAmount;
        await investment.save();
    }
    return { count: dueDividends.length, totalAmount: totalDividendsPaid };
};
/**
 * Portfolio instance method to calculate total value
 */
InvestmentPortfolioSchema.methods.calculateTotalValue = async function () {
    const investments = await mongoose_1.default.model('Investment').find({
        _id: { $in: this.investments },
        isActive: true,
    });
    this.totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    return this.totalValue;
};
/**
 * Portfolio instance method to calculate diversification score
 */
InvestmentPortfolioSchema.methods.calculateDiversificationScore = function () {
    // This would require loading all investments and calculating based on types
    // Placeholder implementation
    return 0.5; // 50% diversification as default
};
/**
 * Portfolio instance method to get allocation breakdown
 */
InvestmentPortfolioSchema.methods.getAllocationBreakdown = async function () {
    const investments = await mongoose_1.default.model('Investment').find({
        _id: { $in: this.investments },
        isActive: true,
    });
    const breakdown = {};
    for (const investment of investments) {
        const investmentType = investment.type;
        if (!breakdown[investmentType]) {
            breakdown[investmentType] = { amount: 0, percentage: 0 };
        }
        const currentValue = investment.units * investment.currentPrice;
        breakdown[investmentType].amount += currentValue;
    }
    // Calculate percentages
    for (const type of Object.keys(breakdown)) {
        breakdown[type].percentage = this.totalValue > 0
            ? (breakdown[type].amount / this.totalValue) * 100
            : 0;
    }
    return breakdown;
};
// Create and export the models
const Investment = mongoose_1.default.models.Investment || mongoose_1.default.model('Investment', InvestmentSchema);
const InvestmentPortfolio = mongoose_1.default.models.InvestmentPortfolio || mongoose_1.default.model('InvestmentPortfolio', InvestmentPortfolioSchema);
exports.InvestmentPortfolio = InvestmentPortfolio;
exports.default = Investment;
//# sourceMappingURL=Investment.js.map