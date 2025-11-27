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

import mongoose, { Schema, Document } from 'mongoose';

// ==== TYPES ==== //

/**
 * Global impact event types triggered by AI dominance
 */
export enum GlobalImpactEventType {
  MARKET_MONOPOLY = 'Market Monopoly',
  REGULATORY_INTERVENTION = 'Regulatory Intervention',
  PUBLIC_BACKLASH = 'Public Backlash',
  AI_ARMS_RACE = 'AI Arms Race',
  AUTOMATION_WAVE = 'Automation Wave',
}

/**
 * Event severity levels with escalating consequences
 */
export enum EventSeverity {
  MINOR = 'Minor',
  MAJOR = 'Major',
  CRITICAL = 'Critical',
  EXISTENTIAL = 'Existential',
}

/**
 * Economic consequences of global impact events
 */
export interface EconomicConsequences {
  marketCapImpact: number;        // Percentage change in company market cap (-50 to +20)
  industryGDPImpact: number;      // Percentage impact on industry GDP
  jobDisplacement: number;        // Number of jobs affected (thousands)
  investmentFlowChange: number;   // Change in investment dollars (billions)
  currency: string;              // Currency code (default: 'USD')
}

/**
 * Political consequences affecting regulatory environment
 */
export interface PoliticalConsequences {
  regulatoryPressure: number;     // Increased scrutiny level (0-100)
  policyChanges: string[];        // New regulations or policy shifts
  internationalTension: number;   // Geopolitical tension increase (0-100)
  lobbyingEffectiveness: number;  // How effective lobbying becomes (0-100, lower = harder)
}

/**
 * Social consequences on public perception and behavior
 */
export interface SocialConsequences {
  publicTrustChange: number;      // Change in public trust (-50 to +20)
  protestActivity: number;        // Increase in protest activity (0-100)
  mediaCoverage: number;          // Media attention level (0-100)
  brandReputationImpact: number;  // Brand value impact (-30 to +10)
}

/**
 * Trigger conditions that activate global impact events
 */
export interface TriggerConditions {
  marketShareThreshold: number;   // Market share percentage that triggers event
  agiCapabilityThreshold: number; // AGI capability score that triggers event
  alignmentThreshold?: number;    // Alignment score requirement (optional)
  timeWindowMonths: number;       // How long conditions must persist
  additionalFactors: string[];    // Other contributing factors
}

/**
 * Event mitigation strategies and their effectiveness
 */
export interface MitigationStrategy {
  strategy: string;               // Description of mitigation approach
  effectiveness: number;          // How effective (0-100)
  cost: number;                   // Implementation cost (millions USD)
  timeToImplement: number;        // Months to implement
  riskReduction: number;          // Risk reduction percentage
}

/**
 * Event resolution outcomes and long-term effects
 */
export interface EventResolution {
  resolutionType: 'Mitigated' | 'Escalated' | 'Resolved' | 'Ongoing';
  finalSeverity: EventSeverity;
  durationMonths: number;         // How long event lasted
  longTermConsequences: string[]; // Permanent changes from event
  lessonsLearned: string[];       // Strategic insights gained
}

// ==== INTERFACES ==== //

/**
 * Global Impact Event Document Interface
 */
export interface IGlobalImpactEvent extends Document {
  _id: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;           // Company that triggered event
  eventType: GlobalImpactEventType;
  severity: EventSeverity;
  title: string;
  description: string;
  triggeredAt: Date;
  triggerConditions: TriggerConditions;
  economicConsequences: EconomicConsequences;
  politicalConsequences: PoliticalConsequences;
  socialConsequences: SocialConsequences;
  mitigationStrategies: MitigationStrategy[];
  resolution?: EventResolution;
  isActive: boolean;                          // Whether event is still ongoing
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  resolveEvent(resolution: EventResolution): Promise<IGlobalImpactEvent>;
  escalateSeverity(newSeverity: EventSeverity, reason: string): Promise<IGlobalImpactEvent>;
  addMitigationStrategy(strategy: MitigationStrategy): Promise<IGlobalImpactEvent>;
}

/**
 * Global Impact Event Model Interface with static methods
 */
export interface IGlobalImpactEventModel extends mongoose.Model<IGlobalImpactEvent> {
  // Static methods
  findActiveByCompany(companyId: mongoose.Types.ObjectId): Promise<IGlobalImpactEvent[]>;
  findByTypeAndSeverity(eventType: GlobalImpactEventType, severity: EventSeverity): Promise<IGlobalImpactEvent[]>;
  calculateTotalEconomicImpact(companyId: mongoose.Types.ObjectId): Promise<EconomicConsequences>;
}

// ==== SCHEMA ==== //

const EconomicConsequencesSchema = new Schema<EconomicConsequences>({
  marketCapImpact: { type: Number, required: true, min: -50, max: 20 },
  industryGDPImpact: { type: Number, required: true, min: -30, max: 10 },
  jobDisplacement: { type: Number, required: true, min: 0 },
  investmentFlowChange: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
}, { _id: false });

const PoliticalConsequencesSchema = new Schema<PoliticalConsequences>({
  regulatoryPressure: { type: Number, required: true, min: 0, max: 100 },
  policyChanges: [{ type: String }],
  internationalTension: { type: Number, required: true, min: 0, max: 100 },
  lobbyingEffectiveness: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });

const SocialConsequencesSchema = new Schema<SocialConsequences>({
  publicTrustChange: { type: Number, required: true, min: -50, max: 20 },
  protestActivity: { type: Number, required: true, min: 0, max: 100 },
  mediaCoverage: { type: Number, required: true, min: 0, max: 100 },
  brandReputationImpact: { type: Number, required: true, min: -30, max: 10 },
}, { _id: false });

const TriggerConditionsSchema = new Schema<TriggerConditions>({
  marketShareThreshold: { type: Number, required: true, min: 0, max: 100 },
  agiCapabilityThreshold: { type: Number, required: true, min: 0, max: 100 },
  alignmentThreshold: { type: Number, min: 0, max: 100 },
  timeWindowMonths: { type: Number, required: true, min: 1 },
  additionalFactors: [{ type: String }],
}, { _id: false });

const MitigationStrategySchema = new Schema<MitigationStrategy>({
  strategy: { type: String, required: true },
  effectiveness: { type: Number, required: true, min: 0, max: 100 },
  cost: { type: Number, required: true, min: 0 },
  timeToImplement: { type: Number, required: true, min: 0 },
  riskReduction: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });

const EventResolutionSchema = new Schema<EventResolution>({
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

const GlobalImpactEventSchema = new Schema<IGlobalImpactEvent>({
  company: {
    type: Schema.Types.ObjectId,
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

GlobalImpactEventSchema.pre('save', function(next) {
  // Validate trigger conditions based on event type
  const event = this as IGlobalImpactEvent;

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
GlobalImpactEventSchema.statics.findActiveByCompany = function(
  companyId: mongoose.Types.ObjectId
): Promise<IGlobalImpactEvent[]> {
  return this.find({ company: companyId, isActive: true })
    .sort({ triggeredAt: -1 });
};

/**
 * Find events by type and severity
 */
GlobalImpactEventSchema.statics.findByTypeAndSeverity = function(
  eventType: GlobalImpactEventType,
  severity: EventSeverity
): Promise<IGlobalImpactEvent[]> {
  return this.find({ eventType, severity })
    .populate('company', 'name')
    .sort({ triggeredAt: -1 });
};

/**
 * Calculate total economic impact from active events
 */
GlobalImpactEventSchema.statics.calculateTotalEconomicImpact = async function(
  companyId: mongoose.Types.ObjectId
): Promise<EconomicConsequences> {
  const activeEvents = await GlobalImpactEvent.find({ company: companyId, isActive: true });

  return activeEvents.reduce((total: EconomicConsequences, event: IGlobalImpactEvent) => ({
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
GlobalImpactEventSchema.methods.resolveEvent = function(
  resolution: EventResolution
): Promise<IGlobalImpactEvent> {
  this.resolution = resolution;
  this.isActive = false;
  this.updatedAt = new Date();
  return this.save();
};

/**
 * Escalate event severity
 */
GlobalImpactEventSchema.methods.escalateSeverity = function(
  newSeverity: EventSeverity,
  reason: string
): Promise<IGlobalImpactEvent> {
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
GlobalImpactEventSchema.methods.addMitigationStrategy = function(
  strategy: MitigationStrategy
): Promise<IGlobalImpactEvent> {
  this.mitigationStrategies.push(strategy);
  this.updatedAt = new Date();
  return this.save();
};

// ==== MODEL ==== //

const GlobalImpactEvent = (mongoose.models.GlobalImpactEvent ||
  mongoose.model<IGlobalImpactEvent>('GlobalImpactEvent', GlobalImpactEventSchema)) as IGlobalImpactEventModel;

export default GlobalImpactEvent;

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