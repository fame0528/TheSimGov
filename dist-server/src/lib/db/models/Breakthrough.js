"use strict";
/**
 * @file src/models/Breakthrough.ts
 * @description AI research breakthrough model for recording scientific discoveries
 * @created 2025-11-22
 *
 * OVERVIEW:
 * Breakthrough model tracks AI research discoveries with commercial value assessment,
 * publication readiness flagging, and project association. Supports academic output
 * tracking and innovation measurement for research projects.
 *
 * FEATURES:
 * - Commercial value tracking ($100K-$10M range)
 * - Publication-ready flag for academic papers
 * - Project and company association
 * - Automatic timestamp tracking
 * - Value range validation
 * - Indexed queries for performance
 *
 * BUSINESS LOGIC:
 * - Commercial value range: $100,000 - $10,000,000
 * - Publication flag indicates academic paper potential
 * - Breakthroughs contribute to project success metrics
 * - Multiple breakthroughs can spawn multiple patents
 *
 * USAGE:
 * ```typescript
 * import Breakthrough from '@/models/Breakthrough';
 *
 * const breakthrough = await Breakthrough.create({
 *   description: 'Novel attention mechanism improves LLM performance by 15%',
 *   commercialValue: 500000,
 *   publicationReady: true,
 *   project: projectId,
 *   company: companyId
 * });
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
// ============================================================================
// Mongoose Schema
// ============================================================================
const breakthroughSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Breakthrough name is required'],
        trim: true,
        minlength: [3, 'Name must be at least 3 characters'],
        maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    description: {
        type: String,
        required: [true, 'Breakthrough description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    area: {
        type: String,
        required: [true, 'Research area is required'],
        enum: {
            values: ['Performance', 'Efficiency', 'Alignment', 'Multimodal', 'Reasoning', 'Architecture'],
            message: '{VALUE} is not a valid research area',
        },
    },
    commercialValue: {
        type: Number,
        required: [true, 'Commercial value is required'],
        min: [100000, 'Commercial value must be at least $100,000'],
        max: [10000000, 'Commercial value cannot exceed $10,000,000'],
    },
    publicationReady: {
        type: Boolean,
        required: true,
        default: false,
    },
    project: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AIResearchProject',
        required: [true, 'Project reference is required'],
        index: true,
    },
    company: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company reference is required'],
    },
    discoveredBy: {
        type: [String],
        required: [true, 'Discoverers are required'],
        validate: {
            validator: (v) => v.length > 0,
            message: 'At least one discoverer is required',
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true,
    },
    // Discovery system fields (optional)
    noveltyScore: {
        type: Number,
        min: [0, 'Novelty score cannot be negative'],
        max: [100, 'Novelty score cannot exceed 100'],
        required: false,
    },
    patentable: {
        type: Boolean,
        required: false,
        default: false,
    },
    estimatedPatentValue: {
        type: Number,
        min: [500000, 'Estimated patent value must be at least $500,000'],
        max: [50000000, 'Estimated patent value cannot exceed $50,000,000'],
        required: false,
    },
    patentFiled: {
        type: Boolean,
        required: false,
        default: false,
    },
    patentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patent',
        required: false,
    },
}, {
    timestamps: false, // Using manual createdAt only
    toJSON: {
        virtuals: true,
    },
    toObject: {
        virtuals: true,
    },
});
// ============================================================================
// Indexes
// ============================================================================
// Compound index for efficient project queries
breakthroughSchema.index({ project: 1, createdAt: -1 });
// Compound index for company queries
breakthroughSchema.index({ company: 1, createdAt: -1 });
// Index for publication-ready filtering
breakthroughSchema.index({ publicationReady: 1 });
// ============================================================================
// Virtual Properties
// ============================================================================
/**
 * Format commercial value as currency string
 */
breakthroughSchema.virtual('formattedValue').get(function () {
    return `$${(this.commercialValue / 1000).toFixed(0)}K`;
});
// ============================================================================
// Export Model
// ============================================================================
/**
 * Breakthrough model for AI research discoveries
 *
 * @example
 * // Create new breakthrough
 * const breakthrough = await Breakthrough.create({
 *   description: 'Breakthrough in transformer attention mechanism',
 *   commercialValue: 750000,
 *   publicationReady: true,
 *   project: projectId,
 *   company: companyId
 * });
 *
 * @example
 * // Find breakthroughs for project
 * const breakthroughs = await Breakthrough.find({ project: projectId })
 *   .sort({ createdAt: -1 });
 *
 * @example
 * // Find publication-ready breakthroughs
 * const publications = await Breakthrough.find({
 *   company: companyId,
 *   publicationReady: true
 * });
 */
const Breakthrough = mongoose_1.default.models.Breakthrough ||
    mongoose_1.default.model('Breakthrough', breakthroughSchema);
exports.default = Breakthrough;
/**
 * IMPLEMENTATION NOTES:
 *
 * 1. VALUE RANGE VALIDATION:
 *    - Minimum: $100,000 (significant discovery threshold)
 *    - Maximum: $10,000,000 (realistic commercial value cap)
 *    - Enforced at schema level with clear error messages
 *
 * 2. PUBLICATION TRACKING:
 *    - publicationReady flag indicates academic paper potential
 *    - Separate from patents (not all publications are patentable)
 *    - Indexed for efficient filtering of publishable research
 *
 * 3. PROJECT ASSOCIATION:
 *    - Required reference to AIResearchProject
 *    - Indexed for efficient project queries
 *    - Enables breakthrough count tracking per project
 *
 * 4. COMPANY ASSOCIATION:
 *    - Required reference to Company
 *    - Enables company-wide breakthrough aggregation
 *    - Supports reputation and metrics calculations
 *
 * 5. TIMESTAMP HANDLING:
 *    - createdAt auto-set on creation
 *    - Immutable (cannot be changed after creation)
 *    - No updatedAt (breakthroughs are immutable records)
 *
 * 6. INDEXES:
 *    - (project, createdAt) for project timeline queries
 *    - (company, createdAt) for company-wide listings
 *    - publicationReady for academic output filtering
 *    - All indexes DESC on createdAt for recent-first queries
 *
 * 7. VIRTUAL PROPERTIES:
 *    - formattedValue: Human-readable currency ($750K)
 *    - Available in JSON output
 *    - Not stored in database (computed on demand)
 *
 * 8. VALIDATION:
 *    - Description: 10-2000 characters (detailed but not excessive)
 *    - Commercial value: $100K-$10M range
 *    - Project/Company: Required ObjectId references
 *    - All fields validated at schema level
 */
//# sourceMappingURL=Breakthrough.js.map