"use strict";
/**
 * @fileoverview ResearchProject Mongoose Model
 * @module lib/db/models/healthcare/ResearchProject
 *
 * OVERVIEW:
 * Healthcare research project model for clinical trials and medical research.
 * Manages research initiatives, clinical trial phases, funding, and outcomes.
 * Tracks research progress, publications, and intellectual property.
 *
 * BUSINESS LOGIC:
 * - Clinical trial management (Phase 1-4)
 * - Research funding and grant management
 * - Institutional Review Board (IRB) approvals
 * - Patient recruitment and retention
 * - Data collection and analysis
 * - Publication and IP management
 * - Regulatory compliance and reporting
 *
 * @created 2025-11-24
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
/**
 * ResearchProject Schema
 */
const ResearchProjectSchema = new mongoose_1.Schema({
    ownedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    location: {
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        coordinates: {
            lat: { type: Number },
            lng: { type: Number }
        }
    },
    researchType: {
        type: String,
        enum: ['clinical_trial', 'basic_research', 'translational', 'drug_discovery', 'device_development', 'biomarker_research'],
        required: true
    },
    therapeuticArea: {
        type: String,
        required: true,
        trim: true
    },
    phase: {
        type: String,
        enum: ['preclinical', 'phase1', 'phase2', 'phase3', 'phase4', 'post_market'],
        required: true
    },
    status: {
        type: String,
        enum: ['planning', 'recruiting', 'active', 'completed', 'terminated', 'on_hold'],
        default: 'planning'
    },
    funding: {
        totalBudget: { type: Number, min: 0 },
        fundingSource: {
            type: String,
            enum: ['government', 'private', 'venture_capital', 'pharma', 'foundation', 'internal']
        },
        grantNumber: { type: String, trim: true },
        sponsors: [{ type: String, trim: true }],
        milestones: [{
                milestone: { type: String, trim: true },
                amount: { type: Number, min: 0 },
                completed: { type: Boolean, default: false },
                completionDate: { type: Date }
            }]
    },
    timeline: {
        startDate: { type: Date },
        estimatedCompletion: { type: Date },
        actualCompletion: { type: Date },
        milestones: [{
                milestone: { type: String, trim: true },
                targetDate: { type: Date },
                completed: { type: Boolean, default: false },
                actualDate: { type: Date }
            }]
    },
    participants: {
        targetCount: { type: Number, min: 0 },
        enrolledCount: { type: Number, default: 0, min: 0 },
        inclusionCriteria: [{ type: String, trim: true }],
        exclusionCriteria: [{ type: String, trim: true }],
        demographics: {
            ageRange: {
                min: { type: Number, min: 0 },
                max: { type: Number, min: 0 }
            },
            gender: {
                male: { type: Number, min: 0, max: 100 },
                female: { type: Number, min: 0, max: 100 },
                other: { type: Number, min: 0, max: 100 }
            },
            ethnicity: {
                caucasian: { type: Number, min: 0, max: 100 },
                african_american: { type: Number, min: 0, max: 100 },
                asian: { type: Number, min: 0, max: 100 },
                hispanic: { type: Number, min: 0, max: 100 },
                other: { type: Number, min: 0, max: 100 }
            }
        }
    },
    regulatory: {
        irbApproval: { type: Boolean, default: false },
        fdaApproval: { type: Boolean, default: false },
        ethicsCommittee: { type: String, trim: true },
        protocolNumber: { type: String, trim: true },
        adverseEvents: { type: Number, default: 0, min: 0 },
        seriousAdverseEvents: { type: Number, default: 0, min: 0 }
    },
    outcomes: {
        primaryEndpoint: { type: String, trim: true },
        secondaryEndpoints: [{ type: String, trim: true }],
        results: {
            success: { type: Boolean },
            statisticalSignificance: { type: Boolean },
            effectSize: { type: Number },
            confidenceInterval: {
                lower: { type: Number },
                upper: { type: Number }
            }
        },
        publications: [{
                title: { type: String, trim: true },
                journal: { type: String, trim: true },
                publicationDate: { type: Date },
                doi: { type: String, trim: true },
                impactFactor: { type: Number, min: 0 }
            }]
    },
    intellectualProperty: {
        patentsFiled: { type: Number, default: 0, min: 0 },
        patentsGranted: { type: Number, default: 0, min: 0 },
        patentApplications: [{
                patentNumber: { type: String, trim: true },
                title: { type: String, trim: true },
                filingDate: { type: Date },
                grantDate: { type: Date },
                expirationDate: { type: Date }
            }]
    }
}, {
    timestamps: true,
    collection: 'researchprojects'
});
/**
 * Indexes
 */
ResearchProjectSchema.index({ ownedBy: 1, name: 1 }, { unique: true });
ResearchProjectSchema.index({ therapeuticArea: 1 });
ResearchProjectSchema.index({ phase: 1 });
ResearchProjectSchema.index({ researchType: 1 });
ResearchProjectSchema.index({ status: 1 });
ResearchProjectSchema.index({ 'timeline.startDate': 1 });
/**
 * Virtuals
 */
ResearchProjectSchema.virtual('enrollmentRate').get(function () {
    var _a, _b;
    const target = ((_a = this.participants) === null || _a === void 0 ? void 0 : _a.targetCount) || 0;
    const enrolled = ((_b = this.participants) === null || _b === void 0 ? void 0 : _b.enrolledCount) || 0;
    return target > 0 ? (enrolled / target) * 100 : 0;
});
ResearchProjectSchema.virtual('budgetUtilization').get(function () {
    var _a;
    const budget = ((_a = this.funding) === null || _a === void 0 ? void 0 : _a.totalBudget) || 0;
    // Note: actualCosts not in new schema, would need to be added if needed
    return 0; // Placeholder
});
ResearchProjectSchema.virtual('daysRemaining').get(function () {
    var _a;
    const now = new Date();
    const completion = ((_a = this.timeline) === null || _a === void 0 ? void 0 : _a.estimatedCompletion) ? new Date(this.timeline.estimatedCompletion) : null;
    return completion ? Math.max(0, Math.ceil((completion.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
});
/**
 * Instance Methods
 */
ResearchProjectSchema.methods.calculateProgress = function () {
    var _a, _b;
    // Calculate progress based on enrollment, time elapsed, and status
    let progress = 0;
    // Status-based progress
    const statusWeights = {
        'planning': 5,
        'recruiting': 20,
        'active': 50,
        'completed': 100,
        'terminated': 100,
        'on_hold': Math.max(5, progress) // Keep some progress for on-hold
    };
    progress = statusWeights[this.status] || 0;
    // Enrollment progress (20% weight)
    const enrollmentRate = this.enrollmentRate;
    progress += (enrollmentRate / 100) * 20;
    // Time-based progress (10% weight) - if we have timeline data
    if (((_a = this.timeline) === null || _a === void 0 ? void 0 : _a.startDate) && ((_b = this.timeline) === null || _b === void 0 ? void 0 : _b.estimatedCompletion)) {
        const now = new Date();
        const start = new Date(this.timeline.startDate);
        const end = new Date(this.timeline.estimatedCompletion);
        const totalDuration = end.getTime() - start.getTime();
        const elapsed = now.getTime() - start.getTime();
        const timeProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
        progress += (timeProgress / 100) * 10;
    }
    return Math.min(100, Math.max(0, progress));
};
ResearchProjectSchema.methods.getEnrollmentRate = function () {
    return this.enrollmentRate;
};
ResearchProjectSchema.methods.assessRiskLevel = function () {
    var _a, _b, _c;
    let riskScore = 0;
    // Phase risk
    const phaseRisks = {
        'preclinical': 10,
        'phase1': 30,
        'phase2': 50,
        'phase3': 70,
        'phase4': 20,
        'post_market': 15
    };
    riskScore += phaseRisks[this.phase] || 0;
    // Regulatory risk
    if (!((_a = this.regulatory) === null || _a === void 0 ? void 0 : _a.irbApproval))
        riskScore += 20;
    if (!((_b = this.regulatory) === null || _b === void 0 ? void 0 : _b.fdaApproval))
        riskScore += 15;
    if (this.status === 'terminated')
        riskScore += 25;
    // Operational risk
    const enrollmentRate = this.enrollmentRate;
    if (enrollmentRate < 50)
        riskScore += 15;
    if ((((_c = this.regulatory) === null || _c === void 0 ? void 0 : _c.adverseEvents) || 0) > 10)
        riskScore += 20;
    if (riskScore > 60)
        return 'High';
    if (riskScore > 30)
        return 'Medium';
    return 'Low';
};
ResearchProjectSchema.methods.generateReport = function () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    return {
        projectId: this._id,
        name: this.name,
        phase: this.phase,
        status: this.status,
        therapeuticArea: this.therapeuticArea,
        researchType: this.researchType,
        progress: this.calculateProgress(),
        enrollment: {
            current: ((_a = this.participants) === null || _a === void 0 ? void 0 : _a.enrolledCount) || 0,
            target: ((_b = this.participants) === null || _b === void 0 ? void 0 : _b.targetCount) || 0,
            rate: this.enrollmentRate
        },
        funding: {
            totalBudget: ((_c = this.funding) === null || _c === void 0 ? void 0 : _c.totalBudget) || 0,
            fundingSource: (_d = this.funding) === null || _d === void 0 ? void 0 : _d.fundingSource
        },
        regulatory: {
            irb: ((_e = this.regulatory) === null || _e === void 0 ? void 0 : _e.irbApproval) || false,
            fda: ((_f = this.regulatory) === null || _f === void 0 ? void 0 : _f.fdaApproval) || false,
            adverseEvents: ((_g = this.regulatory) === null || _g === void 0 ? void 0 : _g.adverseEvents) || 0
        },
        risk: this.assessRiskLevel(),
        publications: ((_j = (_h = this.outcomes) === null || _h === void 0 ? void 0 : _h.publications) === null || _j === void 0 ? void 0 : _j.length) || 0,
        patents: ((_k = this.intellectualProperty) === null || _k === void 0 ? void 0 : _k.patentsFiled) || 0
    };
};
/**
 * Static Methods
 */
ResearchProjectSchema.statics.findByCompany = function (companyId) {
    return this.find({ ownedBy: companyId });
};
ResearchProjectSchema.statics.findByPhase = function (phase) {
    return this.find({ phase });
};
ResearchProjectSchema.statics.findByTherapeuticArea = function (area) {
    return this.find({ therapeuticArea: new RegExp(area, 'i') });
};
ResearchProjectSchema.statics.findByResearchType = function (type) {
    return this.find({ researchType: type });
};
ResearchProjectSchema.statics.getActiveProjects = function () {
    return this.find({
        status: { $in: ['planning', 'recruiting', 'active'] }
    });
};
ResearchProjectSchema.statics.getHighRiskProjects = function () {
    // This would need to be implemented with aggregation pipeline
    return this.find({}).then((projects) => {
        return projects.filter((project) => project.assessRiskLevel() === 'High');
    });
};
/**
 * Pre-save middleware
 */
ResearchProjectSchema.pre('save', function (next) {
    var _a, _b, _c, _d, _e, _f, _g;
    // Validate dates if timeline exists
    if (((_a = this.timeline) === null || _a === void 0 ? void 0 : _a.estimatedCompletion) && ((_b = this.timeline) === null || _b === void 0 ? void 0 : _b.startDate)) {
        if (this.timeline.estimatedCompletion <= this.timeline.startDate) {
            return next(new Error('Estimated completion must be after start date'));
        }
    }
    // Ensure enrolled patients don't exceed target
    if (((_c = this.participants) === null || _c === void 0 ? void 0 : _c.enrolledCount) && ((_d = this.participants) === null || _d === void 0 ? void 0 : _d.targetCount)) {
        if (this.participants.enrolledCount > this.participants.targetCount) {
            this.participants.enrolledCount = this.participants.targetCount;
        }
    }
    // Auto-update status based on timeline and enrollment
    if (this.status === 'planning' && ((_e = this.timeline) === null || _e === void 0 ? void 0 : _e.startDate) && new Date() >= this.timeline.startDate) {
        this.status = 'recruiting';
    }
    if (this.status === 'recruiting' && ((_f = this.participants) === null || _f === void 0 ? void 0 : _f.enrolledCount) && ((_g = this.participants) === null || _g === void 0 ? void 0 : _g.targetCount)) {
        if (this.participants.enrolledCount >= this.participants.targetCount * 0.1) {
            this.status = 'active';
        }
    }
    next();
});
/**
 * Export ResearchProject Model
 */
const ResearchProject = mongoose_1.default.models.ResearchProject || mongoose_1.default.model('ResearchProject', ResearchProjectSchema);
exports.default = ResearchProject;
//# sourceMappingURL=ResearchProject.js.map