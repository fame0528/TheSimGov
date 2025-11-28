"use strict";
/**
 * @fileoverview Company Mongoose Model
 * @module lib/db/models/Company
 *
 * OVERVIEW:
 * Core company model supporting 5-level progression system ($5k startup → $3B public).
 * Manages financial tracking, industry-specific operations, and level requirements.
 * Foundation for employees, contracts, banking, and politics systems.
 *
 * @created 2025-11-20
 * @author ECHO v1.1.0
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
const types_1 = require("@/lib/types");
const constants_1 = require("@/lib/utils/constants");
/**
 * Company levels as array for lookups
 */
const LEVELS_ARRAY = Object.values(constants_1.COMPANY_LEVELS);
/**
 * Company Schema
 *
 * FEATURES:
 * - 5-level progression system with requirements
 * - Financial tracking (revenue, expenses, profit)
 * - Industry-specific operations
 * - State-based regulations
 * - Employee/contract/loan relationships
 *
 * VIRTUALS:
 * - currentLevel: Level configuration lookup
 * - canLevelUp: Checks if requirements met
 * - nextLevelCost: Cost to progress
 * - profitMargin: Calculated profit percentage
 */
const companySchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: false,
        ref: 'User',
        index: true,
    },
    name: {
        type: String,
        required: true,
        // unique: true removed - using schema-level index with collation for case-insensitive uniqueness (line 425)
        minlength: 3,
        maxlength: 50,
        trim: true,
    },
    industry: {
        type: String,
        required: true,
        enum: Object.values(types_1.IndustryType),
        index: true,
        set: (value) => {
            var _a;
            if (!value)
                return value;
            const normalized = String(value).trim();
            const map = {
                finance: types_1.IndustryType.FINANCE,
                healthcare: types_1.IndustryType.HEALTHCARE,
                energy: types_1.IndustryType.ENERGY,
                manufacturing: types_1.IndustryType.MANUFACTURING,
                retail: types_1.IndustryType.RETAIL,
                technology: types_1.IndustryType.Technology,
                tech: types_1.IndustryType.Technology,
            };
            const key = normalized.toLowerCase();
            return ((_a = map[key]) !== null && _a !== void 0 ? _a : normalized);
        },
    },
    level: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
        max: 5,
        index: true,
    },
    revenue: {
        type: Number,
        default: 0,
        min: 0,
    },
    expenses: {
        type: Number,
        default: 0,
        min: 0,
    },
    reputation: {
        type: Number,
        required: false,
        default: 70,
        min: [1, 'Reputation must be at least 1'],
        max: [100, 'Reputation cannot exceed 100'],
    },
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        // Optional: For ownership verification in AI dominance endpoints
        index: true,
    },
    ownerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        // Alias field used in some tests; mirrors `owner` and maps to `userId` when present
        index: true,
    },
    subcategory: {
        type: String,
        enum: {
            values: ['AI', 'Software', 'Hardware'],
            message: '{VALUE} is not a valid technology subcategory',
        },
        // Optional: Only for Technology industry
    },
    // AI Dominance tracking fields (Technology → AI subcategory)
    marketShareAI: {
        type: Number,
        default: 0,
        min: [0, 'Market share cannot be negative'],
        max: [100, 'Market share cannot exceed 100'],
        index: true,
    },
    antitrustRiskScore: {
        type: Number,
        default: 0,
        min: [0, 'Antitrust risk score cannot be negative'],
        max: [100, 'Antitrust risk score cannot exceed 100'],
    },
    regulatoryPressureLevel: {
        type: Number,
        default: 0,
        min: [0, 'Regulatory pressure level cannot be negative'],
        max: [100, 'Regulatory pressure level cannot exceed 100'],
    },
    lastDominanceUpdate: {
        type: Date,
        // Optional: Timestamp of last dominance metrics calculation
    },
    // AGI capability tracking (for AI companies)
    agiCapability: {
        type: Number,
        default: 0,
        min: [0, 'AGI capability cannot be negative'],
        max: [100, 'AGI capability cannot exceed 100'],
    },
    profit: {
        type: Number,
        default: 0,
    },
    cash: {
        type: Number,
        default: 5000, // Starting capital
        min: 0,
    },
    employees: [{
            type: String,
            ref: 'Employee',
        }],
    contracts: [{
            type: String,
            ref: 'Contract',
        }],
    loans: [{
            type: String,
            ref: 'Loan',
        }],
    debtToEquity: {
        type: Number,
        default: 0,
        min: 0,
    },
    monthsInBusiness: {
        type: Number,
        default: 0,
        min: 0,
    },
    monthlyRevenue: {
        type: Number,
        default: 0,
        min: 0,
    },
    logoUrl: {
        type: String,
        required: false,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v)
                    return true;
                return v.startsWith('/company-logos/');
            },
            message: 'Logo URL must be under /company-logos/'
        },
    },
    payrollHistory: [{
            date: { type: Date, required: true },
            amount: { type: Number, required: true },
            success: { type: Boolean, required: true },
        }],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
/**
 * Virtual: Current Level Configuration
 * Looks up level details from COMPANY_LEVELS constant
 */
companySchema.virtual('currentLevel').get(function () {
    return LEVELS_ARRAY.find(l => l.level === this.level);
});
/**
 * Virtual: Next Level Configuration
 * Returns configuration for next level (if exists)
 */
companySchema.virtual('nextLevel').get(function () {
    return LEVELS_ARRAY.find(l => l.level === this.level + 1);
});
/**
 * Virtual: Can Level Up
 * Checks if company meets requirements for next level
 *
 * REQUIREMENTS:
 * - Revenue >= nextLevel.minRevenue
 * - Employees.length >= nextLevel.maxEmployees (or 0 for unlimited)
 * - Cash >= levelUpCost
 */
companySchema.virtual('canLevelUp').get(function () {
    const nextLevel = LEVELS_ARRAY.find(l => l.level === this.level + 1);
    if (!nextLevel)
        return false;
    const meetsRevenue = this.revenue >= nextLevel.minRevenue;
    const meetsEmployees = nextLevel.maxEmployees === -1 || this.employees.length <= nextLevel.maxEmployees;
    const nextCost = Math.round(nextLevel.minRevenue * 0.1);
    const meetsCapital = this.cash >= nextCost;
    return meetsRevenue && meetsEmployees && meetsCapital;
});
/**
 * Virtual: Next Level Cost
 * Calculates cost to progress to next level
 * Formula: 10% of next level's minimum revenue
 */
companySchema.virtual('nextLevelCost').get(function () {
    const nextLevel = LEVELS_ARRAY.find(l => l.level === this.level + 1);
    if (!nextLevel)
        return 0;
    return Math.round(nextLevel.minRevenue * 0.1);
});
/**
 * Virtual: Profit Margin
 * Calculates profit as percentage of revenue
 */
companySchema.virtual('profitMargin').get(function () {
    if (this.revenue === 0)
        return 0;
    return (this.profit / this.revenue) * 100;
});
/**
 * Method: Level Up
 * Progresses company to next level
 *
 * PROCESS:
 * 1. Verify requirements met
 * 2. Deduct level-up cost from cash
 * 3. Increment level
 * 4. Save and return
 *
 * @throws Error if requirements not met
 * @returns Updated company document
 */
companySchema.methods.levelUp = async function () {
    const nextLevel = LEVELS_ARRAY.find(l => l.level === this.level + 1);
    if (!nextLevel) {
        throw new Error('Already at maximum level');
    }
    const meetsRevenue = this.revenue >= nextLevel.minRevenue;
    const meetsEmployees = nextLevel.maxEmployees === -1 || this.employees.length <= nextLevel.maxEmployees;
    const cost = Math.round(nextLevel.minRevenue * 0.1);
    const meetsCapital = this.cash >= cost;
    if (!meetsRevenue || !meetsEmployees || !meetsCapital) {
        throw new Error('Level up requirements not met');
    }
    this.cash -= cost;
    this.level += 1;
    await this.save();
    return this;
};
/**
 * Method: Calculate Financials
 * Updates profit based on current revenue and expenses
 *
 * @returns Updated company document
 */
companySchema.methods.calculateFinancials = function () {
    this.profit = this.revenue - this.expenses;
    return this;
};
/**
 * Method: Can Afford Expense
 * Checks if company has sufficient cash for expense
 *
 * @param amount - Expense amount to check
 * @returns True if company can afford expense
 */
companySchema.methods.canAffordExpense = function (amount) {
    return this.cash >= amount;
};
/**
 * Method: Add Revenue
 * Adds revenue and increases cash
 *
 * @param amount - Revenue amount
 * @returns Updated company document
 */
companySchema.methods.addRevenue = async function (amount) {
    this.revenue += amount;
    this.cash += amount;
    this.profit = this.revenue - this.expenses;
    await this.save();
    return this;
};
/**
 * Method: Add Expense
 * Records expense and deducts from cash
 *
 * @param amount - Expense amount to add
 * @throws Error if insufficient cash
 * @returns Updated company document
 */
companySchema.methods.addExpense = async function (amount) {
    if (!this.canAffordExpense(amount)) {
        throw new Error('Insufficient cash for expense');
    }
    this.expenses += amount;
    this.cash -= amount;
    this.profit = this.revenue - this.expenses;
    await this.save();
    return this;
};
/**
 * Pre-save Hook
 * Updates financials before every save
 */
companySchema.pre('save', function (next) {
    this.profit = this.revenue - this.expenses;
    next();
});
/**
 * Pre-validate Hook
 * If userId missing but ownerId provided, set userId from ownerId.
 * Handles ObjectId to string conversion for compatibility.
 */
companySchema.pre('validate', function (next) {
    if (!this.userId && this.ownerId) {
        const ownerIdValue = this.ownerId;
        // Handle ObjectId conversion to string
        this.userId = (ownerIdValue === null || ownerIdValue === void 0 ? void 0 : ownerIdValue.toString) ? ownerIdValue.toString() : String(ownerIdValue);
    }
    next();
});
/**
 * Indexes
 * Field-level indexes: userId, industry, level, owner, ownerId, marketShareAI
 * Compound index for case-insensitive unique names
 */
companySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } }); // Case-insensitive unique names
/**
 * Company Model
 *
 * USAGE:
 * ```ts
 * import { Company } from '@/lib/db';
 *
 * // Create new company
 * const company = await Company.create({
 *   userId: user.id,
 *   name: 'Acme Corp',
 *   industry: IndustryType.TECHNOLOGY,
 *   state: 'CA',
 * });
 *
 * // Check level up
 * if (company.canLevelUp) {
 *   await company.levelUp();
 * }
 *
 * // Record revenue
 * await company.addRevenue(10000);
 * ```
 */
const CompanyModel = mongoose_1.default.models.Company || mongoose_1.default.model('Company', companySchema);
exports.default = CompanyModel;
/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Level Progression**: Uses COMPANY_LEVELS from constants.ts for requirements
 * 2. **Financial Tracking**: Automatic profit calculation on every save
 * 3. **Cash Management**: Separate from revenue/expenses for liquidity tracking
 * 4. **Relationships**: References to employees, contracts, loans for future features
 * 5. **Indexes**: Optimized for user queries and analytics
 *
 * PREVENTS:
 * - Manual financial calculations across components
 * - Duplicate level progression logic
 * - Inconsistent company validation
 * - Missing business rules enforcement
 */
//# sourceMappingURL=Company.js.map