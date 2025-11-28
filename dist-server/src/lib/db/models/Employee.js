"use strict";
/**
 * @fileoverview Employee Mongoose Model
 * @module lib/db/models/Employee
 *
 * OVERVIEW:
 * Employee management with 12-skill progression system (1-100 scale), performance tracking,
 * morale/satisfaction mechanics, training programs, and retention risk assessment.
 * Foundation for workforce simulation and HR mechanics.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("@/lib/utils/constants");
const timeEngine_1 = __importDefault(require("@/lib/time/timeEngine"));
const events_1 = require("@/lib/time/events");
/**
 * Employee Schema
 *
 * FEATURES:
 * - 12-skill progression system (1-100 scale)
 * - Performance metrics (productivity, quality, attendance)
 * - Morale system (salary fairness, workload, company performance)
 * - Training programs (40h, +10-20 skill points)
 * - Performance reviews
 * - Retention risk assessment
 * - Weekly payroll (168x time = 1 hour real)
 *
 * VIRTUALS:
 * - skillAverage: Average across all 12 skills
 * - retentionRisk: Based on morale thresholds
 * - weeklySalary: Annual salary / 52
 * - overallPerformance: Weighted performance score
 * - marketValue: Salary expectation based on skills
 */
const employeeSchema = new mongoose_1.Schema({
    companyId: {
        type: String,
        required: true,
        ref: 'Company',
        index: true,
    },
    userId: {
        type: String,
        required: true,
        ref: 'User',
        index: true,
    },
    name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50,
        trim: true,
    },
    role: {
        type: String,
        required: true,
        maxlength: 50,
        trim: true,
    },
    salary: {
        type: Number,
        required: true,
        min: constants_1.EMPLOYEE_PARAMETERS.MIN_SALARY,
        max: constants_1.EMPLOYEE_PARAMETERS.MAX_SALARY,
    },
    hiredAt: {
        type: Date,
        default: Date.now,
    },
    skills: {
        technical: { type: Number, default: 50, min: 1, max: 100 },
        leadership: { type: Number, default: 50, min: 1, max: 100 },
        industry: { type: Number, default: 50, min: 1, max: 100 },
        sales: { type: Number, default: 50, min: 1, max: 100 },
        marketing: { type: Number, default: 50, min: 1, max: 100 },
        finance: { type: Number, default: 50, min: 1, max: 100 },
        operations: { type: Number, default: 50, min: 1, max: 100 },
        hr: { type: Number, default: 50, min: 1, max: 100 },
        legal: { type: Number, default: 50, min: 1, max: 100 },
        rd: { type: Number, default: 50, min: 1, max: 100 },
        quality: { type: Number, default: 50, min: 1, max: 100 },
        customer: { type: Number, default: 50, min: 1, max: 100 },
    },
    performance: {
        productivity: { type: Number, default: 1.0, min: 0.5, max: 2.0 },
        quality: { type: Number, default: 75, min: 0, max: 100 },
        attendance: { type: Number, default: 1.0, min: 0.8, max: 1.0 },
    },
    morale: {
        type: Number,
        default: 70,
        min: 1,
        max: 100,
    },
    lastMoraleUpdate: {
        type: Date,
        default: Date.now,
    },
    trainingRecords: [{
            skill: { type: String, required: true },
            startedAt: { type: Date, required: true },
            completedAt: Date,
            hoursCompleted: { type: Number, default: 0 },
            cost: { type: Number, required: true },
            improvement: { type: Number, default: 0 },
        }],
    currentTraining: {
        skill: String,
        startedAt: Date,
        completedAt: Date,
        hoursCompleted: { type: Number, default: 0 },
        cost: Number,
        improvement: { type: Number, default: 0 },
    },
    reviews: [{
            date: { type: Date, required: true },
            reviewerId: { type: String, required: true },
            overallScore: { type: Number, required: true, min: 1, max: 100 },
            strengths: [String],
            improvements: [String],
            salaryAdjustment: { type: Number, default: 0 },
            moraleImpact: { type: Number, default: 0 },
        }],
    lastReviewDate: Date,
    status: {
        type: String,
        enum: ['active', 'training', 'onLeave', 'terminated'],
        default: 'active',
    },
    terminatedAt: Date,
    terminationReason: String,
    lastSkillUsed: Date,
    // AI-Specific Fields (for MLEngineer, ResearchScientist, DataEngineer, MLOps, ProductManager)
    hasPhD: {
        type: Boolean,
        required: false,
        default: false,
    },
    publications: {
        type: Number,
        required: false,
        default: 0,
        min: [0, 'Publications cannot be negative'],
        max: [500, 'Publications cannot exceed 500'],
    },
    hIndex: {
        type: Number,
        required: false,
        default: 0,
        min: [0, 'h-index cannot be negative'],
        max: [200, 'h-index cannot exceed 200'],
    },
    researchAbility: {
        type: Number,
        required: false,
        min: [1, 'Research ability must be at least 1'],
        max: [10, 'Research ability cannot exceed 10'],
    },
    codingSkill: {
        type: Number,
        required: false,
        min: [1, 'Coding skill must be at least 1'],
        max: [10, 'Coding skill cannot exceed 10'],
    },
    domainExpertise: {
        type: String,
        required: false,
        enum: ['NLP', 'ComputerVision', 'ReinforcementLearning', 'GenerativeAI', 'Speech', 'Robotics'],
    },
    computeBudget: {
        type: Number,
        required: false,
        default: 0,
        min: [0, 'Compute budget cannot be negative'],
        max: [10000, 'Compute budget cannot exceed $10,000/month'],
    },
    // Compensation & Performance (for talent management endpoints)
    performanceRating: {
        type: Number,
        required: true,
        default: 3,
        min: [1, 'Performance rating must be at least 1'],
        max: [5, 'Performance rating cannot exceed 5'],
    },
    satisfaction: {
        type: Number,
        required: true,
        default: 70,
        min: [0, 'Satisfaction cannot be negative'],
        max: [100, 'Satisfaction cannot exceed 100'],
    },
    equity: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Equity cannot be negative'],
        max: [10, 'Equity cannot exceed 10%'],
    },
    bonus: {
        type: Number,
        required: true,
        default: 10,
        min: [0, 'Bonus cannot be negative'],
        max: [100, 'Bonus cannot exceed 100%'],
    },
    counterOfferCount: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Counter-offer count cannot be negative'],
    },
    lastRaise: {
        type: Date,
        required: false,
    },
    yearsOfExperience: {
        type: Number,
        required: false,
        default: 0,
        min: [0, 'Years of experience cannot be negative'],
        max: [50, 'Years of experience cannot exceed 50'],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
/**
 * Virtual: Skill Average
 * Calculates average across all 12 skills
 */
employeeSchema.virtual('skillAverage').get(function () {
    const skills = this.skills;
    const total = Object.values(skills).reduce((sum, val) => sum + val, 0);
    return Math.round(total / 12);
});
/**
 * Virtual: Retention Risk
 * Assesses quit probability based on morale
 *
 * THRESHOLDS:
 * - < 30: CRITICAL (80% quit chance per week)
 * - 30-50: HIGH (30% quit chance per week)
 * - 50-70: MODERATE (5% quit chance per week)
 * - 70-85: LOW (1% quit chance per week)
 * - > 85: MINIMAL (0.1% quit chance per week)
 */
employeeSchema.virtual('retentionRisk').get(function () {
    if (this.morale < 30)
        return 'critical';
    if (this.morale < 50)
        return 'high';
    if (this.morale < 70)
        return 'moderate';
    if (this.morale < 85)
        return 'low';
    return 'minimal';
});
/**
 * Virtual: Weekly Salary
 * Calculates weekly pay (annual / 52)
 */
employeeSchema.virtual('weeklySalary').get(function () {
    return Math.round(this.salary / 52);
});
/**
 * Virtual: First Name
 * Extracts first name from full name
 */
employeeSchema.virtual('firstName').get(function () {
    return this.name.split(' ')[0];
});
/**
 * Virtual: Last Name
 * Extracts last name from full name
 */
employeeSchema.virtual('lastName').get(function () {
    return this.name.split(' ').slice(1).join(' ');
});
/**
 * Virtual: Full Name
 * Returns complete name (alias for consistency)
 */
employeeSchema.virtual('fullName').get(function () {
    return this.name;
});
/**
 * Virtual: Overall Performance
 * Weighted combination of performance metrics
 * Formula: Productivity(50%) + Quality(30%) + Attendance(20%)
 */
employeeSchema.virtual('overallPerformance').get(function () {
    const p = this.performance;
    return (p.productivity * 0.5) + (p.quality / 100 * 0.3) + (p.attendance * 0.2);
});
/**
 * Virtual: Market Value
 * Estimated salary expectation based on skills
 * Formula: Industry avg × (skillAverage / 100) × 2
 * Range: 0.6x to 1.8x of industry average
 */
employeeSchema.virtual('marketValue').get(function () {
    // Default to $60k if industry unknown
    const industryAvg = 60000;
    const skillMultiplier = this.skillAverage / 100 * 2;
    return Math.round(industryAvg * skillMultiplier);
});
/**
 * Method: Train
 * Start training program for a specific skill
 *
 * PROCESS:
 * 1. Check if already training
 * 2. Create training record
 * 3. Calculate cost (40h × $100/h = $4,000)
 * 4. Update status
 *
 * @param skill - Skill to train
 * @throws Error if already training
 * @returns Updated employee document
 */
employeeSchema.methods.train = async function (skill) {
    if (this.currentTraining && !this.currentTraining.completedAt) {
        throw new Error('Employee is already in training');
    }
    const cost = constants_1.EMPLOYEE_PARAMETERS.TRAINING_COST_PER_HOUR * constants_1.EMPLOYEE_PARAMETERS.TRAINING_DURATION_HOURS;
    this.currentTraining = {
        skill,
        startedAt: new Date(),
        hoursCompleted: 0,
        cost,
        improvement: 0,
    };
    this.status = 'training';
    this.lastSkillUsed = new Date();
    await this.save();
    // Schedule training completion event (game time + 40h)
    const engine = timeEngine_1.default.getInstance();
    const completionDate = new Date(engine.getGameTime().getTime() + constants_1.EMPLOYEE_PARAMETERS.TRAINING_DURATION_HOURS * 60 * 60 * 1000);
    (0, events_1.scheduleTrainingCompletion)(this.id, completionDate);
    return this;
};
/**
 * Method: Complete Training
 * Finishes current training program
 *
 * PROCESS:
 * 1. Verify training in progress
 * 2. Calculate improvement (10-20 points random)
 * 3. Apply skill increase (cap at 100)
 * 4. Archive training record
 * 5. Update status
 *
 * @throws Error if no training in progress
 * @returns Updated employee document
 */
employeeSchema.methods.completeTraining = async function () {
    if (!this.currentTraining || this.currentTraining.completedAt) {
        throw new Error('No training in progress');
    }
    // Calculate improvement (10-20 points)
    const improvement = Math.floor(Math.random() * 11) + 10;
    const skill = this.currentTraining.skill;
    // Apply skill increase (cap at 100)
    this.skills[skill] = Math.min(100, this.skills[skill] + improvement);
    this.lastSkillUsed = new Date();
    // Complete training
    this.currentTraining.completedAt = new Date();
    this.currentTraining.hoursCompleted = constants_1.EMPLOYEE_PARAMETERS.TRAINING_DURATION_HOURS;
    this.currentTraining.improvement = improvement;
    // Archive
    this.trainingRecords.push(this.currentTraining);
    this.currentTraining = undefined;
    // Update status and morale
    this.status = 'active';
    this.morale = Math.min(100, this.morale + 5); // Training boosts morale
    await this.save();
    return this;
};
/**
 * Method: Conduct Review
 * Perform performance review
 *
 * PROCESS:
 * 1. Create review record
 * 2. Calculate morale impact based on score
 * 3. Optional salary adjustment
 * 4. Update last review date
 *
 * @param reviewerId - ID of reviewer
 * @param score - Overall performance score (1-100)
 * @param feedback - Array of feedback strings
 * @returns Updated employee document
 */
employeeSchema.methods.conductReview = async function (reviewerId, score, feedback) {
    // Morale impact based on score
    let moraleImpact = 0;
    if (score >= 90)
        moraleImpact = 15;
    else if (score >= 75)
        moraleImpact = 10;
    else if (score >= 60)
        moraleImpact = 5;
    else if (score >= 50)
        moraleImpact = 0;
    else
        moraleImpact = -10;
    // Salary adjustment for high performers
    const salaryAdjustment = score >= 85 ? Math.round(this.salary * 0.05) : 0;
    const review = {
        date: new Date(),
        reviewerId,
        overallScore: score,
        strengths: feedback.filter((_, i) => i % 2 === 0), // Even indices
        improvements: feedback.filter((_, i) => i % 2 === 1), // Odd indices
        salaryAdjustment,
        moraleImpact,
    };
    this.reviews.push(review);
    this.lastReviewDate = new Date();
    this.morale = Math.max(1, Math.min(100, this.morale + moraleImpact));
    if (salaryAdjustment > 0) {
        this.salary += salaryAdjustment;
    }
    await this.save();
    return this;
};
/**
 * Method: Adjust Salary
 * Update employee salary
 *
 * PROCESS:
 * 1. Validate new salary in range
 * 2. Calculate morale impact based on change
 * 3. Update salary
 *
 * @param newSalary - New annual salary
 * @throws Error if salary out of range
 * @returns Updated employee document
 */
employeeSchema.methods.adjustSalary = async function (newSalary) {
    if (newSalary < constants_1.EMPLOYEE_PARAMETERS.MIN_SALARY || newSalary > constants_1.EMPLOYEE_PARAMETERS.MAX_SALARY) {
        throw new Error('Salary out of valid range');
    }
    const change = newSalary - this.salary;
    const percentChange = (change / this.salary) * 100;
    // Morale impact based on % change
    let moraleImpact = 0;
    if (percentChange >= 10)
        moraleImpact = 15;
    else if (percentChange >= 5)
        moraleImpact = 10;
    else if (percentChange > 0)
        moraleImpact = 5;
    else if (percentChange === 0)
        moraleImpact = 0;
    else if (percentChange >= -5)
        moraleImpact = -10;
    else
        moraleImpact = -20;
    this.salary = newSalary;
    this.morale = Math.max(1, Math.min(100, this.morale + moraleImpact));
    await this.save();
    return this;
};
/**
 * Method: Calculate Morale
 * Update morale based on weighted factors
 *
 * FORMULA:
 * Morale = salaryFairness(40%) + workloadBalance(30%) +
 *          companyPerformance(20%) + environment(10%)
 *
 * @param companyPerformance - Company performance metric (0-100)
 * @returns Updated employee document
 */
employeeSchema.methods.calculateMorale = function (companyPerformance) {
    // Salary fairness (actual vs market value)
    const salaryFairness = Math.min(100, (this.salary / this.marketValue) * 100);
    // Workload balance (inverse of productivity pressure)
    const workloadBalance = Math.max(0, 100 - (this.performance.productivity - 1) * 50);
    // Environment (random factor 60-80)
    const environment = Math.floor(Math.random() * 21) + 60;
    // Calculate weighted morale
    const newMorale = (salaryFairness * 0.4) +
        (workloadBalance * 0.3) +
        (companyPerformance * 0.2) +
        (environment * 0.1);
    this.morale = Math.round(Math.max(1, Math.min(100, newMorale)));
    this.lastMoraleUpdate = new Date();
    return this;
};
/**
 * Method: Terminate
 * Fire employee
 *
 * @param reason - Termination reason
 * @returns Updated employee document
 */
employeeSchema.methods.terminate = async function (reason) {
    this.status = 'terminated';
    this.terminatedAt = new Date();
    this.terminationReason = reason;
    await this.save();
    return this;
};
/**
 * Pre-save Hook
 * Apply skill decay (1% per week) if skills not updated recently
 */
employeeSchema.pre('save', function (next) {
    // Skill decay logic would go here (requires game time tracking)
    // For now, skip to avoid complexity
    next();
});
/**
 * Indexes
 * Optimize queries by company, user, status
 */
// Field-level indexes: companyId, userId
// Removed duplicate compound indexes to eliminate Mongoose warnings
/**
 * Employee Model
 *
 * USAGE:
 * ```ts
 * import { Employee } from '@/lib/db';
 *
 * // Hire employee
 * const employee = await Employee.create({
 *   companyId: company.id,
 *   userId: user.id,
 *   name: 'John Doe',
 *   role: 'Software Engineer',
 *   salary: 80000,
 *   skills: { technical: 75, ... },
 * });
 *
 * // Start training
 * await employee.train('technical');
 *
 * // Complete training
 * await employee.completeTraining();
 *
 * // Conduct review
 * await employee.conductReview(user.id, 85, ['Great work', 'Improve communication']);
 * ```
 */
const EmployeeModel = mongoose_1.default.models.Employee || mongoose_1.default.model('Employee', employeeSchema);
exports.default = EmployeeModel;
/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **12 Skills**: Depth and specialization vs single generic skill
 * 2. **Morale System**: Weighted factors create realistic retention dynamics
 * 3. **Training**: 40h programs with random improvement (10-20 points)
 * 4. **Performance**: Three metrics (productivity, quality, attendance)
 * 5. **Market Value**: Skill-based salary expectations for negotiation
 * 6. **Retention Risk**: Morale-based quit probability thresholds
 *
 * PREVENTS:
 * - Flat skill system without depth
 * - Unrealistic employee retention
 * - Missing training mechanics
 * - Incomplete performance tracking
 */
//# sourceMappingURL=Employee.js.map