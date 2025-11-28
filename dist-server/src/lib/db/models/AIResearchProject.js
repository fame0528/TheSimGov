"use strict";
/**
 * @fileoverview AIResearchProject Mongoose Model
 * @module lib/db/models/AIResearchProject
 *
 * OVERVIEW:
 * Research project management for AI/Technology companies with R&D departments.
 * Tracks budget, researchers, performance gains, breakthroughs, patents, publications.
 * Integrates with R&D Department and Employee references, utility-first architecture.
 *
 * @created 2025-11-21
 * @author ECHO v1.3.0
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
const researchProjects_1 = require("@/lib/utils/ai/researchProjects");
/**
 * AIResearchProject Schema
 *
 * FEATURES:
 * - Budget tracking with overage validation (uses utility)
 * - Researcher assignment (1-10 employees from R&D)
 * - Performance gain calculation (uses utility from researchGains.ts)
 * - Breakthrough/patent/publication tracking
 * - Auto-completion at 100% progress
 *
 * VIRTUALS:
 * - activeResearchers: Count of assigned researchers
 * - budgetEfficiency: Allocated/spent ratio
 * - completionPercentage: Progress 0-100%
 * - isInProgress: Status check
 * - isCompleted: Status check
 */
const aiResearchProjectSchema = new mongoose_1.Schema({
    company: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 150,
        trim: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['Performance', 'Efficiency', 'NewCapability'],
    },
    complexity: {
        type: String,
        required: true,
        enum: ['Low', 'Medium', 'High'],
    },
    status: {
        type: String,
        required: true,
        default: 'InProgress',
        enum: ['InProgress', 'Completed', 'Cancelled'],
        index: true,
    },
    progress: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 100,
    },
    startedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    completedAt: {
        type: Date,
    },
    cancelledAt: {
        type: Date,
    },
    budgetAllocated: {
        type: Number,
        required: true,
        min: 1000, // $1,000 minimum
    },
    budgetSpent: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    assignedResearchers: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Employee',
        }],
    performanceGain: {
        accuracy: {
            type: Number,
            default: 0,
            min: 0,
            max: 20, // Cap at 20% gain
        },
        efficiency: {
            type: Number,
            default: 0,
            min: 0,
            max: 50, // Cap at 50% gain
        },
        speed: {
            type: Number,
            default: 0,
            min: 0,
            max: 40, // Cap at 40% gain
        },
        capability: {
            type: String,
        },
    },
    // Phase 4.1: Research Lab additions - embedded for legacy parity
    breakthroughs: [{
            name: { type: String, required: true },
            area: {
                type: String,
                enum: ['Performance', 'Efficiency', 'Alignment', 'Multimodal', 'Reasoning', 'Architecture'],
                required: true,
            },
            discoveredAt: { type: Date, default: Date.now },
            noveltyScore: { type: Number, min: 0, max: 100, required: true },
            performanceGainPercent: { type: Number, min: 0, max: 20, default: 0 },
            efficiencyGainPercent: { type: Number, min: 0, max: 50, default: 0 },
            patentable: { type: Boolean, default: false },
            estimatedPatentValue: { type: Number, default: 0 },
        }],
    patents: [{
            patentId: { type: String, required: true },
            title: { type: String, required: true },
            area: {
                type: String,
                enum: ['Performance', 'Efficiency', 'Alignment', 'Multimodal', 'Reasoning', 'Architecture'],
                required: true,
            },
            filedAt: { type: Date, default: Date.now },
            approvedAt: { type: Date },
            status: {
                type: String,
                enum: ['Filed', 'UnderReview', 'Approved', 'Rejected'],
                default: 'Filed',
            },
            filingCost: { type: Number, required: true },
            estimatedValue: { type: Number, default: 0 },
            licensingRevenue: { type: Number, default: 0 },
            citations: { type: Number, default: 0 },
        }],
    publications: [{
            publicationId: {
                type: String,
                required: true,
            },
            title: {
                type: String,
                required: true,
            },
            authors: [{
                    type: String,
                    required: true,
                }],
            venue: {
                type: String,
                required: true,
                enum: ['Conference', 'Journal', 'Workshop', 'Preprint'],
            },
            venueName: {
                type: String,
                required: true,
            },
            publishedAt: {
                type: Date,
                required: true,
            },
            citations: {
                type: Number,
                default: 0,
            },
            downloads: {
                type: Number,
                default: 0,
            },
        }],
}, {
    timestamps: true,
    collection: 'airesearchprojects',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
/**
 * Virtual: Active Researchers
 * Count of assigned researchers
 */
aiResearchProjectSchema.virtual('activeResearchers').get(function () {
    return this.assignedResearchers.length;
});
/**
 * Virtual: Budget Efficiency
 * Ratio of allocated to spent budget
 * > 1.0 = under budget (good)
 * < 1.0 = over budget (bad)
 */
aiResearchProjectSchema.virtual('budgetEfficiency').get(function () {
    if (this.budgetSpent === 0)
        return 1.0;
    return this.budgetAllocated / this.budgetSpent;
});
/**
 * Virtual: Completion Percentage
 * Current progress as percentage
 */
aiResearchProjectSchema.virtual('completionPercentage').get(function () {
    return this.progress;
});
/**
 * Virtual: Is In Progress
 * Returns true if project actively ongoing
 */
aiResearchProjectSchema.virtual('isInProgress').get(function () {
    return this.status === 'InProgress';
});
/**
 * Virtual: Is Completed
 * Returns true if project successfully finished
 */
aiResearchProjectSchema.virtual('isCompleted').get(function () {
    return this.status === 'Completed';
});
/**
 * Method: Calculate Performance Gain
 * Calculates actual performance improvements based on research outcomes
 *
 * @param researcherSkills - Array of researcher skill ratings (1-100)
 * @returns Calculated performance gain metrics
 */
aiResearchProjectSchema.methods.calculatePerformanceGain = function (researcherSkills) {
    return (0, researchProjects_1.calculatePerformanceGain)(this.type, this.complexity, researcherSkills, this.budgetAllocated, this.budgetSpent, this.progress);
};
/**
 * Method: Advance Progress
 * Updates research progress and calculates performance gains
 *
 * PROCESS:
 * 1. Validate increment (1-20%, no overflow past 100%)
 * 2. Update progress and budget spent
 * 3. Calculate performance gains (uses utility - NO embedded logic)
 * 4. Auto-complete at 100% progress
 *
 * @param increment - Progress increase (1-20%)
 * @param costIncurred - Budget spent for this increment
 * @param researcherSkills - Array of researcher skill levels (0-100)
 * @throws Error if increment invalid or budget exceeded
 */
aiResearchProjectSchema.methods.advanceProgress = async function (increment, costIncurred, researcherSkills) {
    // Validate increment (1-20%, no overflow)
    if (increment < 1 || increment > 20) {
        throw new Error('Progress increment must be between 1-20%');
    }
    if (this.progress + increment > 100) {
        throw new Error(`Progress increment would exceed 100% (current: ${this.progress}%)`);
    }
    // Update progress and budget
    this.progress += increment;
    this.budgetSpent += costIncurred;
    // Calculate performance gains (uses utility from researchProjects.ts - NO embedded logic)
    const gains = (0, researchProjects_1.calculatePerformanceGain)(this.type, this.complexity, researcherSkills, this.budgetAllocated, this.budgetSpent, this.progress);
    // Update performance gains (cumulative)
    this.performanceGain = {
        accuracy: gains.accuracy,
        efficiency: gains.efficiency,
        speed: gains.speed,
        capability: gains.capability,
    };
    // Auto-complete at 100%
    if (this.progress >= 100) {
        this.status = 'Completed';
        this.completedAt = new Date();
    }
    await this.save();
};
/**
 * Method: Cancel
 * Cancels research project
 *
 * NOTE: 10% RP penalty applied in API route, not here
 *
 * @param reason - Optional cancellation reason
 */
aiResearchProjectSchema.methods.cancel = async function (reason) {
    this.status = 'Cancelled';
    this.cancelledAt = new Date();
    await this.save();
};
/**
 * Static: Get by Company
 * Retrieves all research projects for a company
 *
 * @param companyId - Company ObjectId
 * @returns Array of research projects
 */
aiResearchProjectSchema.statics.getByCompany = async function (companyId) {
    return this.find({ company: companyId }).sort({ createdAt: -1 });
};
/**
 * Static: Get by Status
 * Retrieves projects filtered by status
 *
 * @param companyId - Company ObjectId
 * @param status - Research status filter
 * @returns Array of filtered projects
 */
aiResearchProjectSchema.statics.getByStatus = async function (companyId, status) {
    return this.find({ company: companyId, status }).sort({ createdAt: -1 });
};
/**
 * Static: Get Active
 * Retrieves all in-progress projects for a company
 *
 * @param companyId - Company ObjectId
 * @returns Array of active projects
 */
aiResearchProjectSchema.statics.getActive = async function (companyId) {
    return this.find({ company: companyId, status: 'InProgress' }).sort({ createdAt: -1 });
};
/**
 * Pre-save Hook
 *
 * VALIDATIONS:
 * - Budget overage check (uses validateBudgetOverage utility)
 * - Researcher count validation (uses validateResearcherCount utility)
 * - Auto-complete at 100% progress
 * - Set completion/cancellation timestamps
 */
aiResearchProjectSchema.pre('save', function (next) {
    // Validate budget overage (max 110% of allocated - uses utility)
    if (!(0, researchProjects_1.validateBudgetOverage)(this.budgetAllocated, this.budgetSpent)) {
        const error = new Error(`Budget overage exceeded: $${this.budgetSpent} spent vs $${this.budgetAllocated} allocated. ` +
            `Maximum allowed: $${this.budgetAllocated * 1.1} (110%).`);
        return next(error);
    }
    // Validate researcher count (1-10 researchers - uses utility)
    if (!(0, researchProjects_1.validateResearcherCount)(this.assignedResearchers.length)) {
        const error = new Error(`Invalid researcher count: ${this.assignedResearchers.length}. ` +
            `Must assign 1-10 researchers.`);
        return next(error);
    }
    // Auto-complete at 100% progress
    if (this.progress >= 100 && this.status === 'InProgress') {
        this.status = 'Completed';
        this.completedAt = new Date();
    }
    // Set timestamps based on status
    if (this.status === 'Completed' && !this.completedAt) {
        this.completedAt = new Date();
    }
    if (this.status === 'Cancelled' && !this.cancelledAt) {
        this.cancelledAt = new Date();
    }
    next();
});
/**
 * Indexes
 * Optimize queries by company, status, and progress
 * Note: company (line 80), status (line 104) have field-level index: true
 */
// Removed: aiResearchProjectSchema.index({ company: 1, status: 1 }) - duplicates both field-level indexes
// Removed: aiResearchProjectSchema.index({ status: 1 }) - duplicates field-level index at line 104
aiResearchProjectSchema.index({ progress: 1 });
aiResearchProjectSchema.index({ createdAt: -1 });
/**
 * AIResearchProject Model
 *
 * USAGE:
 * ```ts
 * import { AIResearchProject } from '@/lib/db';
 * import { calculatePerformanceGain } from '@/lib/utils/ai';
 *
 * // Create new research project
 * const project = await AIResearchProject.create({
 *   company: companyId,
 *   name: 'LLM Efficiency Improvements',
 *   type: 'Efficiency',
 *   complexity: 'High',
 *   budgetAllocated: 500000,
 *   assignedResearchers: [researcherId1, researcherId2],
 * });
 *
 * // Advance research (uses utility for performance calculation)
 * const increment = 10; // 10% progress
 * const costIncurred = 50000; // $50k spent
 * const skills = [85, 90]; // Researcher skills
 *
 * await project.advanceProgress(increment, costIncurred, skills);
 * // Performance gains auto-calculated via utility
 *
 * console.log(project.performanceGain.efficiency); // e.g., 25% efficiency gain
 *
 * // Cancel project
 * await project.cancel('Budget constraints');
 * // Apply 10% RP penalty in API route
 * ```
 */
const AIResearchProjectModel = mongoose_1.default.models.AIResearchProject || mongoose_1.default.model('AIResearchProject', aiResearchProjectSchema);
exports.default = AIResearchProjectModel;
/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Utility-First Architecture**: Uses researchProjects.ts utilities for all calculations
 *    - calculatePerformanceGain() from utils (NOT embedded in model)
 *    - validateBudgetOverage() from utils (NOT embedded)
 *    - validateResearcherCount() from utils (NOT embedded)
 *    - Zero logic duplication, maximum reusability
 *
 * 2. **Legacy Feature Parity**: Complete match with legacy AIResearchProject.ts
 *    - Embedded breakthroughs, patents, publications
 *    - Collection 'airesearchprojects'
 *    - All business logic preserved
 *    - calculatePerformanceGain method for compatibility
 *
 * 3. **Performance Gain Calculation**: Multi-factor formula (uses utility)
 *    - Base gain by research type (Performance/Efficiency/NewCapability)
 *    - Complexity multiplier (Low 0.5x, Medium 1.0x, High 1.8x)
 *    - Skill multiplier (0.5-2.0x based on avg researcher skill)
 *    - Budget efficiency (0.7-1.0x, overspending reduces gains)
 *    - Progress factor (gains scale with completion)
 *    - Caps: Accuracy ≤20%, Efficiency ≤50%, Speed ≤40%
 *
 * 4. **Budget Tracking**: Allocated vs Spent
 *    - budgetAllocated: Initial budget commitment
 *    - budgetSpent: Actual expenditure (incremental)
 *    - Max overage: 110% (validated via utility)
 *    - Efficiency metric: allocated/spent ratio
 *
 * 5. **Researcher Assignment**: 1-10 employees
 *    - References Employee model (R&D department)
 *    - Skill levels used in performance calculations
 *    - Validated via utility (1-10 range)
 *
 * 6. **Breakthrough System**: Embedded for legacy parity
 *    - Breakthroughs: Novel discoveries (novelty score 0-100)
 *    - Patents: Filed/Pending/Granted/Rejected lifecycle
 *    - Publications: Citations and downloads tracking
 *    - Revenue potential: Licensing fees from patents
 *
 * 7. **Status Lifecycle**: InProgress → Completed/Cancelled
 *    - Auto-transition at 100% progress
 *    - Timestamps for started/completed/cancelled
 *    - Cancellation penalty (10% RP) applied in API route
 *
 * PREVENTS:
 * - Embedded calculation logic (all in utilities)
 * - Manual budget validation
 * - Duplicate performance gain formulas
 * - Inconsistent researcher count checks
 * - Missing status transition timestamps
 */
//# sourceMappingURL=AIResearchProject.js.map