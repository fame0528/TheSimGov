"use strict";
/**
 * GlobalImpactEvent Model
 *
 * Created: 2025-11-23
 * Phase: 4.0 - Advanced Systems
 *
 * OVERVIEW:
 * Models global impact events triggered by AI industry dominance and AGI development.
 * Tracks economic, political, and social consequences with severity levels and trigger conditions.
 *
 * FEATURES:
 * - Five event types: Market Monopoly, Regulatory Intervention, Public Backlash, AI Arms Race, Automation Wave
 * - Four severity levels: Minor, Major, Critical, Existential
 * - Economic, political, and social consequence tracking
 * - Trigger condition validation (market share, AGI capability thresholds)
 * - Event progression and resolution mechanics
 *
 * BUSINESS LOGIC:
 * - Events triggered by market share >40% or AGI capability >80%
 * - Severity scales with trigger threshold violation magnitude
 * - Consequences affect company reputation, regulatory scrutiny, and market position
 * - Events can be mitigated through strategic responses
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
exports.EventSeverity = exports.GlobalImpactEventType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// ==== TYPES ==== //
/**
 * Global impact event types triggered by AI dominance
 */
var GlobalImpactEventType;
(function (GlobalImpactEventType) {
    GlobalImpactEventType["MARKET_MONOPOLY"] = "Market Monopoly";
    GlobalImpactEventType["REGULATORY_INTERVENTION"] = "Regulatory Intervention";
    GlobalImpactEventType["PUBLIC_BACKLASH"] = "Public Backlash";
    GlobalImpactEventType["AI_ARMS_RACE"] = "AI Arms Race";
    GlobalImpactEventType["AUTOMATION_WAVE"] = "Automation Wave";
})(GlobalImpactEventType || (exports.GlobalImpactEventType = GlobalImpactEventType = {}));
/**
 * Event severity levels with escalating consequences
 */
var EventSeverity;
(function (EventSeverity) {
    EventSeverity["MINOR"] = "Minor";
    EventSeverity["MAJOR"] = "Major";
    EventSeverity["CRITICAL"] = "Critical";
    EventSeverity["EXISTENTIAL"] = "Existential";
})(EventSeverity || (exports.EventSeverity = EventSeverity = {}));
// ==== SCHEMA ==== //
const EconomicConsequencesSchema = new mongoose_1.Schema({
    marketCapImpact: { type: Number, required: true, min: -50, max: 20 },
    industryGDPImpact: { type: Number, required: true, min: -30, max: 10 },
    jobDisplacement: { type: Number, required: true, min: 0 },
    investmentFlowChange: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
}, { _id: false });
const PoliticalConsequencesSchema = new mongoose_1.Schema({
    regulatoryPressure: { type: Number, required: true, min: 0, max: 100 },
    policyChanges: [{ type: String }],
    internationalTension: { type: Number, required: true, min: 0, max: 100 },
    lobbyingEffectiveness: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });
const SocialConsequencesSchema = new mongoose_1.Schema({
    publicTrustChange: { type: Number, required: true, min: -50, max: 20 },
    protestActivity: { type: Number, required: true, min: 0, max: 100 },
    mediaCoverage: { type: Number, required: true, min: 0, max: 100 },
    brandReputationImpact: { type: Number, required: true, min: -30, max: 10 },
}, { _id: false });
const TriggerConditionsSchema = new mongoose_1.Schema({
    marketShareThreshold: { type: Number, required: true, min: 0, max: 100 },
    agiCapabilityThreshold: { type: Number, required: true, min: 0, max: 100 },
    alignmentThreshold: { type: Number, min: 0, max: 100 },
    timeWindowMonths: { type: Number, required: true, min: 1 },
    additionalFactors: [{ type: String }],
}, { _id: false });
const MitigationStrategySchema = new mongoose_1.Schema({
    strategy: { type: String, required: true },
    effectiveness: { type: Number, required: true, min: 0, max: 100 },
    cost: { type: Number, required: true, min: 0 },
    timeToImplement: { type: Number, required: true, min: 0 },
    riskReduction: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });
const EventResolutionSchema = new mongoose_1.Schema({
    resolutionType: {
        type: String,
        required: true,
        enum: ['Mitigated', 'Escalated', 'Resolved', 'Ongoing']
    },
    finalSeverity: {
        type: String,
        required: true,
        enum: Object.values(EventSeverity)
    },
    durationMonths: { type: Number, required: true, min: 0 },
    longTermConsequences: [{ type: String }],
    lessonsLearned: [{ type: String }],
}, { _id: false });
const GlobalImpactEventSchema = new mongoose_1.Schema({
    company: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        // index: true removed - already indexed via compound index { company: 1, triggeredAt: -1 }
    },
    eventType: {
        type: String,
        required: true,
        enum: Object.values(GlobalImpactEventType)
    },
    severity: {
        type: String,
        required: true,
        enum: Object.values(EventSeverity)
    },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 1000 },
    triggeredAt: { type: Date, required: true, default: Date.now },
    triggerConditions: { type: TriggerConditionsSchema, required: true },
    economicConsequences: { type: EconomicConsequencesSchema, required: true },
    politicalConsequences: { type: PoliticalConsequencesSchema, required: true },
    socialConsequences: { type: SocialConsequencesSchema, required: true },
    mitigationStrategies: [{ type: MitigationStrategySchema }],
    resolution: { type: EventResolutionSchema },
    isActive: { type: Boolean, required: true, default: true },
}, {
    timestamps: true,
    collection: 'globalimpactevents'
});
// ==== INDEXES ==== //
GlobalImpactEventSchema.index({ company: 1, triggeredAt: -1 });
GlobalImpactEventSchema.index({ eventType: 1, severity: 1 });
GlobalImpactEventSchema.index({ isActive: 1, triggeredAt: -1 });
// ==== PRE-SAVE HOOKS ==== //
GlobalImpactEventSchema.pre('save', function (next) {
    // Validate trigger conditions based on event type
    const event = this;
    switch (event.eventType) {
        case GlobalImpactEventType.MARKET_MONOPOLY:
            if (event.triggerConditions.marketShareThreshold < 40) {
                return next(new Error('Market monopoly events require market share threshold >= 40%'));
            }
            break;
        case GlobalImpactEventType.AUTOMATION_WAVE:
            if (event.triggerConditions.agiCapabilityThreshold < 80) {
                return next(new Error('Automation wave events require AGI capability threshold >= 80%'));
            }
            break;
        case GlobalImpactEventType.AI_ARMS_RACE:
            if (event.triggerConditions.marketShareThreshold < 30) {
                return next(new Error('AI arms race events require market share threshold >= 30%'));
            }
            break;
    }
    next();
});
// ==== STATIC METHODS ==== //
/**
 * Find active events for a company
 */
GlobalImpactEventSchema.statics.findActiveByCompany = function (companyId) {
    return this.find({ company: companyId, isActive: true })
        .sort({ triggeredAt: -1 });
};
/**
 * Find events by type and severity
 */
GlobalImpactEventSchema.statics.findByTypeAndSeverity = function (eventType, severity) {
    return this.find({ eventType, severity })
        .populate('company', 'name')
        .sort({ triggeredAt: -1 });
};
/**
 * Calculate total economic impact from active events
 */
GlobalImpactEventSchema.statics.calculateTotalEconomicImpact = async function (companyId) {
    const activeEvents = await GlobalImpactEvent.find({ company: companyId, isActive: true });
    return activeEvents.reduce((total, event) => ({
        marketCapImpact: total.marketCapImpact + event.economicConsequences.marketCapImpact,
        industryGDPImpact: total.industryGDPImpact + event.economicConsequences.industryGDPImpact,
        jobDisplacement: total.jobDisplacement + event.economicConsequences.jobDisplacement,
        investmentFlowChange: total.investmentFlowChange + event.economicConsequences.investmentFlowChange,
        currency: 'USD', // Assume USD for totals
    }), {
        marketCapImpact: 0,
        industryGDPImpact: 0,
        jobDisplacement: 0,
        investmentFlowChange: 0,
        currency: 'USD',
    });
};
// ==== INSTANCE METHODS ==== //
/**
 * Resolve the event with specified outcome
 */
GlobalImpactEventSchema.methods.resolveEvent = function (resolution) {
    this.resolution = resolution;
    this.isActive = false;
    this.updatedAt = new Date();
    return this.save();
};
/**
 * Escalate event severity
 */
GlobalImpactEventSchema.methods.escalateSeverity = function (newSeverity, reason) {
    if (Object.values(EventSeverity).indexOf(newSeverity) >
        Object.values(EventSeverity).indexOf(this.severity)) {
        this.severity = newSeverity;
        this.description += `\n\nESCALATION (${new Date().toISOString()}): ${reason}`;
        this.updatedAt = new Date();
        return this.save();
    }
    throw new Error('Cannot escalate to same or lower severity level');
};
/**
 * Add mitigation strategy
 */
GlobalImpactEventSchema.methods.addMitigationStrategy = function (strategy) {
    this.mitigationStrategies.push(strategy);
    this.updatedAt = new Date();
    return this.save();
};
// ==== MODEL ==== //
const GlobalImpactEvent = (mongoose_1.default.models.GlobalImpactEvent ||
    mongoose_1.default.model('GlobalImpactEvent', GlobalImpactEventSchema));
exports.default = GlobalImpactEvent;
// ==== IMPLEMENTATION NOTES ==== //
/**
 * IMPLEMENTATION NOTES:
 *
 * 1. EVENT TYPES:
 *    - Market Monopoly: >40% market share triggers antitrust scrutiny
 *    - Regulatory Intervention: Government action against dominance
 *    - Public Backlash: Societal reaction to AI impact
 *    - AI Arms Race: International competition escalation
 *    - Automation Wave: Mass job displacement from AGI
 *
 * 2. SEVERITY LEVELS:
 *    - Minor: Noticeable but manageable impact
 *    - Major: Significant consequences requiring action
 *    - Critical: Severe impact threatening company viability
 *    - Existential: Catastrophic threat to industry/company survival
 *
 * 3. CONSEQUENCES:
 *    - Economic: Market cap, GDP, jobs, investment flows
 *    - Political: Regulation, policy, international relations
 *    - Social: Trust, protests, media, brand reputation
 *
 * 4. TRIGGER CONDITIONS:
 *    - Market share thresholds (40%+ for monopoly)
 *    - AGI capability thresholds (80%+ for automation)
 *    - Alignment requirements (optional safety factors)
 *    - Time windows (conditions must persist)
 *    - Additional factors (geopolitical, economic)
 *
 * 5. MITIGATION STRATEGIES:
 *    - Effectiveness ratings (0-100%)
 *    - Implementation costs and timelines
 *    - Risk reduction percentages
 *    - Multiple strategies can be applied
 *
 * 6. EVENT RESOLUTION:
 *    - Mitigated: Successfully managed impact
 *    - Escalated: Conditions worsened
 *    - Resolved: Natural conclusion
 *    - Ongoing: Still active
 *
 * 7. BUSINESS LOGIC:
 *    - Events triggered by utility functions in globalImpact.ts
 *    - Consequences calculated using economic/political/social models
 *    - Mitigation effectiveness determines resolution outcomes
 *    - Historical events tracked for company reputation
 *
 * 8. USAGE PATTERNS:
 *    - API routes check for trigger conditions periodically
 *    - Frontend displays active events with mitigation options
 *    - Company decisions affect event progression
 *    - Events influence market dynamics and competitive landscape
 */ 
//# sourceMappingURL=GlobalImpactEvent.js.map