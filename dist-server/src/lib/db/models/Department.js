"use strict";
/**
 * @fileoverview Department Mongoose Model
 * @module lib/db/models/Department
 *
 * OVERVIEW:
 * Mongoose schema for Department entities supporting Finance, HR, Marketing, and R&D.
 * Utilizes utility-first architecture with imported pure functions for calculations.
 * Implements department-specific data segregation with discriminated unions.
 *
 * @created 2025-11-21
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
// ============================================================================
// SCHEMA DEFINITION
// ============================================================================
const DepartmentSchema = new mongoose_1.Schema({
    companyId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        // index: true removed - compound index { companyId: 1, type: 1 } on line 497 already indexes companyId
    },
    type: {
        type: String,
        enum: ['finance', 'hr', 'marketing', 'rd'],
        required: true,
    },
    name: {
        type: String,
        enum: ['Finance', 'HR', 'Marketing', 'R&D'],
        required: true,
    },
    level: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 1,
    },
    budget: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    budgetPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 25,
    },
    // ========================================================================
    // PERFORMANCE METRICS (KPIs)
    // ========================================================================
    kpis: {
        efficiency: { type: Number, required: true, min: 0, max: 100, default: 50 },
        performance: { type: Number, required: true, min: 0, max: 100, default: 50 },
        roi: { type: Number, required: true, default: 0 },
        utilization: { type: Number, required: true, min: 0, max: 100, default: 50 },
        quality: { type: Number, required: true, min: 0, max: 100, default: 50 },
    },
    // ========================================================================
    // FINANCE DEPARTMENT DATA
    // ========================================================================
    totalRevenue: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    creditScore: { type: Number, min: 300, max: 850, default: 650 },
    cashReserves: { type: Number, default: 0 },
    loans: [{
            id: { type: String, required: true },
            companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
            loanType: { type: String, enum: ['working-capital', 'expansion', 'equipment', 'bridge'], required: true },
            amount: { type: Number, required: true, min: 0 },
            interestRate: { type: Number, required: true, min: 0 },
            termMonths: { type: Number, required: true, min: 1 },
            monthlyPayment: { type: Number, required: true, min: 0 },
            remainingBalance: { type: Number, required: true, min: 0 },
            status: { type: String, enum: ['pending', 'active', 'paid-off', 'defaulted'], default: 'pending' },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
        }],
    investments: [{
            id: { type: String, required: true },
            companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
            investmentType: { type: String, enum: ['stocks', 'bonds', 'real-estate', 'venture'], required: true },
            amount: { type: Number, required: true, min: 0 },
            currentValue: { type: Number, required: true, min: 0 },
            returnRate: { type: Number, required: true },
            riskLevel: { type: String, enum: ['low', 'medium', 'high'], required: true },
            purchaseDate: { type: Date, required: true },
            maturityDate: { type: Date },
        }],
    plReports: [{
            departmentId: { type: String, required: true },
            companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
            period: { type: String, enum: ['monthly', 'quarterly', 'annual'], required: true },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            revenue: {
                contracts: { type: Number, default: 0 },
                investments: { type: Number, default: 0 },
                other: { type: Number, default: 0 },
                total: { type: Number, required: true },
            },
            expenses: {
                salaries: { type: Number, default: 0 },
                departments: { type: Number, default: 0 },
                loans: { type: Number, default: 0 },
                operations: { type: Number, default: 0 },
                other: { type: Number, default: 0 },
                total: { type: Number, required: true },
            },
            profit: { type: Number, required: true },
            profitMargin: { type: Number, required: true },
            cashflow: {
                operating: { type: Number, required: true },
                investing: { type: Number, required: true },
                financing: { type: Number, required: true },
                net: { type: Number, required: true },
            },
        }],
    cashflowForecasts: [{
            departmentId: { type: String, required: true },
            companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
            forecastPeriod: { type: String, enum: ['7day', '30day', '90day'], required: true },
            currentCash: { type: Number, required: true },
            projectedInflows: { type: Number, required: true },
            projectedOutflows: { type: Number, required: true },
            projectedEndingCash: { type: Number, required: true },
            burnRate: { type: Number, required: true },
            runwayDays: { type: Number, required: true },
            alerts: [{
                    type: { type: String, enum: ['critical', 'warning', 'info'], required: true },
                    message: { type: String, required: true },
                }],
        }],
    // ========================================================================
    // HR DEPARTMENT DATA
    // ========================================================================
    totalEmployees: { type: Number, default: 0 },
    employeeTurnover: { type: Number, min: 0, max: 100, default: 0 },
    avgSalary: { type: Number, min: 0, default: 0 },
    trainingBudget: { type: Number, min: 0, default: 0 },
    trainingPrograms: [{
            id: { type: String, required: true },
            companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
            name: { type: String, required: true },
            skillTarget: { type: String, required: true },
            duration: { type: Number, required: true, min: 1 },
            cost: { type: Number, required: true, min: 0 },
            capacity: { type: Number, required: true, min: 1 },
            enrolled: { type: Number, default: 0, min: 0 },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            status: { type: String, enum: ['scheduled', 'active', 'completed', 'cancelled'], default: 'scheduled' },
        }],
    recruitmentCampaigns: [{
            id: { type: String, required: true },
            companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
            role: { type: String, required: true },
            positions: { type: Number, required: true, min: 1 },
            budget: { type: Number, required: true, min: 0 },
            duration: { type: Number, required: true, min: 1 },
            applicants: { type: Number, default: 0, min: 0 },
            hired: { type: Number, default: 0, min: 0 },
            startDate: { type: Date, required: true },
            status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
        }],
    skillsInventory: [{
            skill: { type: String, required: true },
            employeeCount: { type: Number, required: true, min: 0 },
            avgLevel: { type: Number, required: true, min: 1, max: 5 },
        }],
    // ========================================================================
    // MARKETING DEPARTMENT DATA
    // ========================================================================
    brandValue: { type: Number, min: 0, default: 0 },
    customerBase: { type: Number, min: 0, default: 0 },
    marketShare: { type: Number, min: 0, max: 100, default: 0 },
    campaigns: [{
            id: { type: String, required: true },
            companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
            name: { type: String, required: true },
            campaignType: { type: String, enum: ['brand-awareness', 'lead-generation', 'customer-retention', 'product-launch'], required: true },
            budget: { type: Number, required: true, min: 0 },
            duration: { type: Number, required: true, min: 1 },
            reach: { type: Number, default: 0, min: 0 },
            conversions: { type: Number, default: 0, min: 0 },
            roi: { type: Number, default: 0 },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            status: { type: String, enum: ['planned', 'active', 'completed', 'cancelled'], default: 'planned' },
        }],
    customerAcquisitionCost: { type: Number, min: 0, default: 0 },
    customerLifetimeValue: { type: Number, min: 0, default: 0 },
    // ========================================================================
    // R&D DEPARTMENT DATA
    // ========================================================================
    innovationPoints: { type: Number, min: 0, default: 0 },
    researchSpeed: { type: Number, min: 0, max: 100, default: 50 },
    researchProjects: [{
            id: { type: String, required: true },
            companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
            name: { type: String, required: true },
            category: { type: String, enum: ['product', 'process', 'technology', 'sustainability'], required: true },
            budget: { type: Number, required: true, min: 0 },
            duration: { type: Number, required: true, min: 1 },
            progress: { type: Number, default: 0, min: 0, max: 100 },
            successChance: { type: Number, required: true, min: 0, max: 100 },
            potentialImpact: { type: Number, required: true, min: 1, max: 5 },
            startDate: { type: Date, required: true },
            status: { type: String, enum: ['active', 'completed', 'failed', 'cancelled'], default: 'active' },
        }],
    patents: [{
            id: { type: String, required: true },
            companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
            name: { type: String, required: true },
            category: { type: String, required: true },
            value: { type: Number, required: true, min: 0 },
            filingDate: { type: Date, required: true },
            grantedDate: { type: Date },
            expirationDate: { type: Date, required: true },
            status: { type: String, enum: ['pending', 'granted', 'expired', 'rejected'], default: 'pending' },
        }],
    techLevel: { type: Number, min: 1, max: 10, default: 1 },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// ============================================================================
// INDEXES
// ============================================================================
DepartmentSchema.index({ companyId: 1, type: 1 }, { unique: true }); // One department per type per company
DepartmentSchema.index({ level: 1 });
DepartmentSchema.index({ 'kpis.efficiency': 1 });
DepartmentSchema.index({ 'kpis.performance': 1 });
// ============================================================================
// VIRTUALS
// ============================================================================
/**
 * Calculate total active loans
 */
DepartmentSchema.virtual('activeLoanCount').get(function () {
    var _a;
    return ((_a = this.loans) === null || _a === void 0 ? void 0 : _a.filter(loan => loan.status === 'active').length) || 0;
});
/**
 * Calculate total debt from active loans
 */
DepartmentSchema.virtual('totalDebt').get(function () {
    var _a;
    return ((_a = this.loans) === null || _a === void 0 ? void 0 : _a.reduce((sum, loan) => {
        if (loan.status === 'active') {
            return sum + loan.remainingBalance;
        }
        return sum;
    }, 0)) || 0;
});
/**
 * Calculate total investment value
 */
DepartmentSchema.virtual('totalInvestmentValue').get(function () {
    var _a;
    return ((_a = this.investments) === null || _a === void 0 ? void 0 : _a.reduce((sum, inv) => sum + inv.currentValue, 0)) || 0;
});
/**
 * Calculate current profit from latest P&L report
 */
DepartmentSchema.virtual('currentProfit').get(function () {
    if (!this.plReports || this.plReports.length === 0)
        return 0;
    const latest = this.plReports[this.plReports.length - 1];
    return latest.profit;
});
/**
 * Calculate active training programs count
 */
DepartmentSchema.virtual('activeTrainingCount').get(function () {
    var _a;
    return ((_a = this.trainingPrograms) === null || _a === void 0 ? void 0 : _a.filter((p) => p.status === 'active').length) || 0;
});
/**
 * Calculate active recruitment campaigns count
 */
DepartmentSchema.virtual('activeRecruitmentCount').get(function () {
    var _a;
    return ((_a = this.recruitmentCampaigns) === null || _a === void 0 ? void 0 : _a.filter((c) => c.status === 'active').length) || 0;
});
/**
 * Calculate active marketing campaigns count
 */
DepartmentSchema.virtual('activeCampaignCount').get(function () {
    var _a;
    return ((_a = this.campaigns) === null || _a === void 0 ? void 0 : _a.filter((c) => c.status === 'active').length) || 0;
});
/**
 * Calculate average campaign ROI
 */
DepartmentSchema.virtual('avgCampaignROI').get(function () {
    var _a;
    const completedCampaigns = ((_a = this.campaigns) === null || _a === void 0 ? void 0 : _a.filter((c) => c.status === 'completed')) || [];
    if (completedCampaigns.length === 0)
        return 0;
    const totalROI = completedCampaigns.reduce((sum, c) => sum + c.roi, 0);
    return totalROI / completedCampaigns.length;
});
/**
 * Calculate active research projects count
 */
DepartmentSchema.virtual('activeResearchCount').get(function () {
    var _a;
    return ((_a = this.researchProjects) === null || _a === void 0 ? void 0 : _a.filter((p) => p.status === 'active').length) || 0;
});
/**
 * Calculate granted patents count
 */
DepartmentSchema.virtual('grantedPatentCount').get(function () {
    var _a;
    return ((_a = this.patents) === null || _a === void 0 ? void 0 : _a.filter((p) => p.status === 'granted').length) || 0;
});
/**
 * Calculate total patent value
 */
DepartmentSchema.virtual('totalPatentValue').get(function () {
    var _a;
    return ((_a = this.patents) === null || _a === void 0 ? void 0 : _a.reduce((sum, p) => {
        if (p.status === 'granted') {
            return sum + p.value;
        }
        return sum;
    }, 0)) || 0;
});
// ============================================================================
// METHODS
// ============================================================================
/**
 * Upgrade department to next level
 * Increases budget allocation and unlocks new capabilities
 */
DepartmentSchema.methods.upgrade = async function () {
    if (this.level >= 5) {
        throw new Error('Department already at maximum level');
    }
    this.level += 1;
    // Increase budget by 50% per level
    this.budget = Math.round(this.budget * 1.5);
    await this.save();
};
/**
 * Calculate department health score (0-100)
 * Weighted average of all KPIs
 */
DepartmentSchema.methods.calculateHealthScore = function () {
    const weights = {
        efficiency: 0.25,
        performance: 0.25,
        roi: 0.20,
        utilization: 0.15,
        quality: 0.15,
    };
    const normalizedROI = Math.max(0, Math.min(100, (this.kpis.roi + 50))); // Normalize ROI to 0-100
    const score = this.kpis.efficiency * weights.efficiency +
        this.kpis.performance * weights.performance +
        normalizedROI * weights.roi +
        this.kpis.utilization * weights.utilization +
        this.kpis.quality * weights.quality;
    return Math.round(score);
};
/**
 * Check if department can afford expense
 */
DepartmentSchema.methods.canAfford = function (amount) {
    return this.budget >= amount;
};
// ============================================================================
// PRE/POST HOOKS
// ============================================================================
/**
 * Pre-save: Validate department-specific data
 */
DepartmentSchema.pre('save', function (next) {
    // Ensure budget percentage doesn't exceed 100%
    if (this.budgetPercentage > 100) {
        this.budgetPercentage = 100;
    }
    // Ensure KPIs are within valid ranges
    Object.keys(this.kpis).forEach((key) => {
        const kpiKey = key;
        if (kpiKey !== 'roi') {
            this.kpis[kpiKey] = Math.max(0, Math.min(100, this.kpis[kpiKey]));
        }
    });
    next();
});
/**
 * Post-save: Log department updates
 */
DepartmentSchema.post('save', function (doc) {
    console.log(`[Department] Saved ${doc.name} for company ${doc.companyId}`);
});
// ============================================================================
// STATIC METHODS
// ============================================================================
/**
 * Get all departments for a company
 */
DepartmentSchema.statics.getByCompany = async function (companyId) {
    return this.find({ companyId }).sort({ type: 1 });
};
/**
 * Get department by type for a company
 */
DepartmentSchema.statics.getByType = async function (companyId, type) {
    return this.findOne({ companyId, type });
};
/**
 * Initialize all 4 departments for a new company
 */
DepartmentSchema.statics.initializeForCompany = async function (companyId, initialBudget = 100000) {
    const budgetPerDepartment = initialBudget / 4;
    const companyObjectId = new mongoose_1.default.Types.ObjectId(companyId);
    const departments = [
        {
            companyId: companyObjectId,
            type: 'finance',
            name: 'Finance',
            level: 1,
            budget: budgetPerDepartment,
            budgetPercentage: 25,
            kpis: { efficiency: 50, performance: 50, roi: 0, utilization: 50, quality: 50 },
            totalRevenue: 0,
            totalExpenses: 0,
            creditScore: 650,
            cashReserves: initialBudget,
            loans: [],
            investments: [],
            plReports: [],
            cashflowForecasts: [],
        },
        {
            companyId: companyObjectId,
            type: 'hr',
            name: 'HR',
            level: 1,
            budget: budgetPerDepartment,
            budgetPercentage: 25,
            kpis: { efficiency: 50, performance: 50, roi: 0, utilization: 50, quality: 50 },
            totalEmployees: 0,
            employeeTurnover: 0,
            avgSalary: 0,
            trainingBudget: 0,
            trainingPrograms: [],
            recruitmentCampaigns: [],
            skillsInventory: [],
        },
        {
            companyId: companyObjectId,
            type: 'marketing',
            name: 'Marketing',
            level: 1,
            budget: budgetPerDepartment,
            budgetPercentage: 25,
            kpis: { efficiency: 50, performance: 50, roi: 0, utilization: 50, quality: 50 },
            brandValue: 0,
            customerBase: 0,
            marketShare: 0,
            campaigns: [],
            customerAcquisitionCost: 0,
            customerLifetimeValue: 0,
        },
        {
            companyId: companyObjectId,
            type: 'rd',
            name: 'R&D',
            level: 1,
            budget: budgetPerDepartment,
            budgetPercentage: 25,
            kpis: { efficiency: 50, performance: 50, roi: 0, utilization: 50, quality: 50 },
            innovationPoints: 0,
            researchSpeed: 50,
            researchProjects: [],
            patents: [],
            techLevel: 1,
        },
    ];
    return this.insertMany(departments);
};
// ============================================================================
// MODEL EXPORT
// ============================================================================
const Department = mongoose_1.default.models.Department ||
    mongoose_1.default.model('Department', DepartmentSchema);
exports.default = Department;
/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Utility-First Architecture**: Uses imported pure functions from utils/departments/*
 * 2. **Type Safety**: Full TypeScript integration with department.ts types
 * 3. **Department Segregation**: Each department type has its own data fields
 * 4. **Virtuals**: Computed properties for common calculations (zero DB overhead)
 * 5. **Methods**: Instance methods for upgrades and health checks
 * 6. **Statics**: Static methods for batch operations and initialization
 * 7. **Indexes**: Optimized queries for companyId + type (unique constraint)
 * 8. **Validation**: Pre-save hooks enforce data integrity
 * 9. **Logging**: Post-save hooks for audit trail
 *
 * PREVENTS:
 * - Multiple departments of same type per company (unique index)
 * - Invalid KPI values (pre-save validation)
 * - Budget percentage > 100% (pre-save normalization)
 * - Duplicate calculation logic (virtuals vs repeated queries)
 * - Uninitialized departments (static initializeForCompany method)
 */
//# sourceMappingURL=Department.js.map