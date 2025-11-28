"use strict";
/**
 * IndustryDominance Model
 *
 * Created: 2025-11-23
 * Phase: 4.0 - Advanced Systems
 *
 * OVERVIEW:
 * Tracks market dominance metrics for AI companies using Herfindahl-Hirschman Index (HHI)
 * and competitive positioning analysis. Models monopoly formation, antitrust risk, and
 * industry consolidation dynamics.
 *
 * FEATURES:
 * - Market share tracking with weighted calculations (revenue 40%, users 30%, deployments 30%)
 * - HHI calculation for market concentration analysis
 * - Monopoly detection and antitrust risk assessment
 * - Competitive intelligence gathering
 * - Industry consolidation impact from M&A activity
 * - Market structure classification (competitive/moderate/concentrated/monopolistic)
 *
 * BUSINESS LOGIC:
 * - Market share calculated quarterly from transaction data
 * - HHI thresholds: <1500 competitive, 1500-2500 moderate, >2500 concentrated/monopolistic
 * - Monopoly triggers at >40% market share with escalating antitrust risk
 * - Consolidation analysis for merger impact on market concentration
 *
 * @implementation FID-20251123-001 Phase 4.0 Advanced Systems
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
// ==== SCHEMA ==== //
const MarketShareDataSchema = new mongoose_1.Schema({
    companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
    companyName: { type: String, required: true },
    marketShare: { type: Number, required: true, min: 0, max: 100 },
    revenue: { type: Number, required: true, min: 0 },
    userCount: { type: Number, required: true, min: 0 },
    modelDeployments: { type: Number, required: true, min: 0 },
    marketPosition: { type: Number, required: true, min: 1 },
    lastUpdated: { type: Date, required: true, default: Date.now },
}, { _id: false });
const IndustryConcentrationSchema = new mongoose_1.Schema({
    hhi: { type: Number, required: true, min: 0, max: 10000 },
    marketStructure: {
        type: String,
        required: true,
        enum: ['Competitive', 'Moderate', 'Concentrated', 'Monopolistic']
    },
    topCompanies: [{ type: MarketShareDataSchema }],
    totalMarketSize: { type: Number, required: true, min: 0 },
    numberOfCompetitors: { type: Number, required: true, min: 0 },
    concentrationTrend: {
        type: String,
        required: true,
        enum: ['Increasing', 'Stable', 'Decreasing']
    },
    calculatedAt: { type: Date, required: true, default: Date.now },
}, { _id: false });
const MonopolyDetectionSchema = new mongoose_1.Schema({
    isMonopoly: { type: Boolean, required: true },
    marketShare: { type: Number, required: true, min: 0, max: 100 },
    antitrustRisk: { type: Number, required: true, min: 0, max: 100 },
    regulatoryActions: [{ type: String }],
    recommendedActions: [{ type: String }],
    timeToIntervention: { type: Number, min: 0 },
    detectedAt: { type: Date, required: true, default: Date.now },
}, { _id: false });
const CompetitiveIntelligenceSchema = new mongoose_1.Schema({
    companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
    marketPosition: { type: Number, required: true, min: 1 },
    nearestCompetitors: [{
            companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
            name: { type: String, required: true },
            marketShare: { type: Number, required: true, min: 0, max: 100 },
            gap: { type: Number, required: true },
        }],
    competitiveAdvantages: [{ type: String }],
    vulnerabilities: [{ type: String }],
    threatLevel: {
        type: String,
        required: true,
        enum: ['Low', 'Medium', 'High', 'Critical']
    },
    opportunityScore: { type: Number, required: true, min: 0, max: 100 },
    analyzedAt: { type: Date, required: true, default: Date.now },
}, { _id: false });
const AntitrustRiskSchema = new mongoose_1.Schema({
    riskScore: { type: Number, required: true, min: 0, max: 100 },
    riskLevel: {
        type: String,
        required: true,
        enum: ['Low', 'Moderate', 'High', 'Severe']
    },
    triggerFactors: [{
            factor: { type: String, required: true },
            weight: { type: Number, required: true, min: 0, max: 1 },
            contribution: { type: Number, required: true, min: 0 },
        }],
    mitigationStrategies: [{ type: String }],
    estimatedFines: { type: Number, required: true, min: 0 },
    probabilityOfAction: { type: Number, required: true, min: 0, max: 100 },
    assessedAt: { type: Date, required: true, default: Date.now },
}, { _id: false });
const ConsolidationImpactSchema = new mongoose_1.Schema({
    preMergerHHI: { type: Number, required: true, min: 0, max: 10000 },
    postMergerHHI: { type: Number, required: true, min: 0, max: 10000 },
    hhiChange: { type: Number, required: true },
    antitrustConcern: { type: Boolean, required: true },
    expectedRegulatorResponse: {
        type: String,
        required: true,
        enum: ['Approve', 'Review', 'Block']
    },
    marketShareCombined: { type: Number, required: true, min: 0, max: 100 },
    competitiveEffects: [{ type: String }],
    analyzedAt: { type: Date, required: true, default: Date.now },
}, { _id: false });
const IndustryDominanceSchema = new mongoose_1.Schema({
    industry: { type: String, required: true },
    subcategory: { type: String, required: true },
    marketShares: [{ type: MarketShareDataSchema }],
    concentration: { type: IndustryConcentrationSchema, required: true },
    monopolies: [{ type: MonopolyDetectionSchema }],
    competitiveIntelligence: [{ type: CompetitiveIntelligenceSchema }],
    antitrustRisks: [{ type: AntitrustRiskSchema }],
    consolidationHistory: [{ type: ConsolidationImpactSchema }],
    lastCalculated: { type: Date, required: true, default: Date.now },
}, {
    timestamps: true,
    collection: 'industrydominance'
});
// ==== INDEXES ==== //
IndustryDominanceSchema.index({ industry: 1, subcategory: 1 }, { unique: true });
IndustryDominanceSchema.index({ 'concentration.hhi': 1 });
IndustryDominanceSchema.index({ lastCalculated: -1 });
// ==== PRE-SAVE HOOKS ==== //
IndustryDominanceSchema.pre('save', function (next) {
    const doc = this;
    // Validate HHI calculation
    if (doc.concentration.hhi < 0 || doc.concentration.hhi > 10000) {
        return next(new Error('HHI must be between 0 and 10,000'));
    }
    // Validate market shares sum to approximately 100%
    const totalShare = doc.marketShares.reduce((sum, share) => sum + share.marketShare, 0);
    if (totalShare < 95 || totalShare > 105) {
        return next(new Error(`Market shares must sum to approximately 100% (currently ${totalShare.toFixed(1)}%)`));
    }
    // Update lastCalculated timestamp
    doc.lastCalculated = new Date();
    next();
});
// ==== STATIC METHODS ==== //
/**
 * Find industry dominance data by industry and subcategory
 */
IndustryDominanceSchema.statics.findByIndustry = function (industry, subcategory) {
    const query = { industry };
    if (subcategory) {
        query.subcategory = subcategory;
    }
    return this.findOne(query);
};
/**
 * Get market share for a specific company
 */
IndustryDominanceSchema.statics.getCompanyMarketShare = function (industry, subcategory, companyId) {
    return this.findOne({ industry, subcategory }, { marketShares: { $elemMatch: { companyId } } }).then((doc) => (doc === null || doc === void 0 ? void 0 : doc.marketShares[0]) || null);
};
/**
 * Find industries with high concentration (HHI > 2500)
 */
IndustryDominanceSchema.statics.findConcentratedMarkets = function () {
    return this.find({ 'concentration.hhi': { $gt: 2500 } })
        .sort({ 'concentration.hhi': -1 });
};
/**
 * Find detected monopolies
 */
IndustryDominanceSchema.statics.findMonopolies = function () {
    return this.find({ 'monopolies.isMonopoly': true })
        .populate('monopolies.companyId', 'name');
};
// ==== INSTANCE METHODS ==== //
/**
 * Recalculate market shares from current data
 */
IndustryDominanceSchema.methods.recalculateMarketShares = function () {
    // This would integrate with the industryDominance utility functions
    // For now, just update the timestamp
    this.lastCalculated = new Date();
    return this.save();
};
/**
 * Add monopoly detection result
 */
IndustryDominanceSchema.methods.addMonopolyDetection = function (monopoly) {
    this.monopolies.push(monopoly);
    return this.save();
};
/**
 * Update competitive intelligence for a company
 */
IndustryDominanceSchema.methods.updateCompetitiveIntelligence = function (intelligence) {
    // Remove existing intelligence for this company
    this.competitiveIntelligence = this.competitiveIntelligence.filter((ci) => !ci.companyId.equals(intelligence.companyId));
    // Add new intelligence
    this.competitiveIntelligence.push(intelligence);
    return this.save();
};
/**
 * Add antitrust risk assessment
 */
IndustryDominanceSchema.methods.addAntitrustRisk = function (risk) {
    this.antitrustRisks.push(risk);
    return this.save();
};
/**
 * Record consolidation impact
 */
IndustryDominanceSchema.methods.recordConsolidation = function (impact) {
    this.consolidationHistory.push(impact);
    return this.save();
};
// ==== MODEL ==== //
const IndustryDominance = mongoose_1.default.models.IndustryDominance ||
    mongoose_1.default.model('IndustryDominance', IndustryDominanceSchema);
exports.default = IndustryDominance;
// ==== IMPLEMENTATION NOTES ==== //
/**
 * IMPLEMENTATION NOTES:
 *
 * 1. MARKET SHARE CALCULATION:
 *    - Weighted formula: Revenue (40%), Users (30%), Deployments (30%)
 *    - Prevents pure revenue dominance (important for open-source models)
 *    - Calculated quarterly from transaction data
 *
 * 2. HHI CALCULATION:
 *    - HHI = Σ(Market Share²) for all firms
 *    - < 1,500: Competitive market
 *    - 1,500-2,500: Moderately concentrated
 *    - > 2,500: Highly concentrated/monopolistic
 *    - 10,000: Pure monopoly
 *
 * 3. MONOPOLY DETECTION:
 *    - Triggers at >40% market share
 *    - Antitrust risk escalates with market share
 *    - Regulatory actions become more severe
 *    - Time to intervention estimates provided
 *
 * 4. COMPETITIVE INTELLIGENCE:
 *    - Market position ranking
 *    - Nearest competitor analysis
 *    - Advantages and vulnerabilities assessment
 *    - Threat level and opportunity scoring
 *
 * 5. ANTITRUST RISK ASSESSMENT:
 *    - Multi-factor analysis (market share, HHI, duration, consumer harm)
 *    - Risk levels: Low/Moderate/High/Severe
 *    - Mitigation strategies and estimated fines
 *    - Probability of government intervention
 *
 * 6. CONSOLIDATION IMPACT:
 *    - Pre/post-merger HHI calculation
 *    - DOJ/FTC merger guidelines (>200 HHI increase = concern)
 *    - Expected regulator response (Approve/Review/Block)
 *    - Competitive effects analysis
 *
 * 7. BUSINESS LOGIC:
 *    - Data updated quarterly via scheduled jobs
 *    - Historical tracking for trend analysis
 *    - Integration with utility functions for calculations
 *    - API endpoints for real-time market analysis
 *
 * 8. USAGE PATTERNS:
 *    - Dashboard displays market share rankings
 *    - Risk monitoring alerts for antitrust concerns
 *    - M&A analysis tools for consolidation planning
 *    - Competitive intelligence reports for strategy
 */ 
//# sourceMappingURL=IndustryDominance.js.map