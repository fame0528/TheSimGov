/**
 * GlobalImpactEvent Schema
 * 
 * Created: 2025-11-15
 * Phase: 5.2 - Industry Dominance & Global Impact
 * 
 * OVERVIEW:
 * Tracks global impact events triggered by AI industry dominance and AGI development.
 * Events include market monopolies, regulatory interventions, public backlash, AI arms races,
 * and automation waves. Each event has severity levels, economic/political/social consequences,
 * and affects multiple companies and regions.
 * 
 * FEATURES:
 * - 5 event types with strategic consequences
 * - 4 severity levels (Minor → Existential)
 * - Consequence tracking (economic, political, social impact)
 * - Trigger conditions based on market share and AGI capability
 * - Regional impact tracking (countries affected)
 * - Company involvement and responsibility attribution
 * 
 * STRATEGIC GAMEPLAY:
 * - Market Monopoly: >40% share triggers antitrust investigations
 * - Regulatory Intervention: Government forced divestitures at >60% share
 * - Public Backlash: Poor alignment score causes reputation damage
 * - AI Arms Race: International competition accelerates AGI development
 * - Automation Wave: High AGI capability triggers job displacement
 */

import { Schema, model, models, Document, Types } from 'mongoose';

// ==== ENUMS ==== //

/**
 * Types of global impact events that can occur in the AI industry.
 * Each type represents a different category of consequence from AI dominance.
 */
export enum GlobalImpactEventType {
  /** Company achieves >40% market share, triggering antitrust scrutiny */
  MARKET_MONOPOLY = 'Market Monopoly',
  
  /** Government forces company breakup or regulation (>60% share) */
  REGULATORY_INTERVENTION = 'Regulatory Intervention',
  
  /** Public turns against AI company due to safety concerns or job losses */
  PUBLIC_BACKLASH = 'Public Backlash',
  
  /** International competition drives aggressive AGI development */
  AI_ARMS_RACE = 'AI Arms Race',
  
  /** AGI capability causes widespread job automation and economic disruption */
  AUTOMATION_WAVE = 'Automation Wave',
}

/**
 * Severity levels indicating the scale and impact of the event.
 * Higher severity means greater consequences and harder recovery.
 */
export enum EventSeverity {
  /** Local impact, minimal economic disruption, easy recovery */
  MINOR = 'Minor',
  
  /** Regional impact, moderate economic impact, recovery possible */
  MAJOR = 'Major',
  
  /** National/multi-national impact, severe economic consequences */
  CRITICAL = 'Critical',
  
  /** Global impact, potential civilization-level threat (AGI safety failure) */
  EXISTENTIAL = 'Existential',
}

/**
 * Status of the event in its lifecycle.
 */
export enum EventStatus {
  /** Event predicted but not yet occurred */
  PREDICTED = 'Predicted',
  
  /** Event currently unfolding */
  ACTIVE = 'Active',
  
  /** Event resolved (positive or negative outcome) */
  RESOLVED = 'Resolved',
  
  /** Event ongoing with cascading effects */
  ESCALATING = 'Escalating',
}

// ==== INTERFACES ==== //

/**
 * Economic consequences from the event.
 * Tracks GDP impact, job losses, market disruption.
 */
export interface EconomicConsequence {
  /** GDP impact in percentage (-50% to +20%) */
  gdpImpact: number;
  
  /** Jobs displaced/created (negative = job losses) */
  jobsAffected: number;
  
  /** Market value destroyed/created in billions USD */
  marketValueImpact: number;
  
  /** Industries affected by this event */
  industriesAffected: string[];
  
  /** Economic recovery time in months (0 = no recovery needed) */
  recoveryTimeMonths: number;
}

/**
 * Political consequences from the event.
 * Tracks regulatory changes, government actions, geopolitical shifts.
 */
export interface PoliticalConsequence {
  /** New regulations imposed (descriptions) */
  regulationsImposed: string[];
  
  /** Countries that banned/restricted the technology */
  countriesBanning: string[];
  
  /** Political stability impact (-100 to +100, negative = destabilizing) */
  stabilityImpact: number;
  
  /** International relations affected (e.g., "US-China tensions increase") */
  geopoliticalShifts: string[];
  
  /** Likelihood of future government intervention (0-100%) */
  interventionRisk: number;
}

/**
 * Social consequences from the event.
 * Tracks public perception, social unrest, cultural shifts.
 */
export interface SocialConsequence {
  /** Public perception change (-100 to +100, negative = distrust) */
  publicPerceptionChange: number;
  
  /** Social unrest level (0-100, higher = more protests/riots) */
  unrestLevel: number;
  
  /** Trust in AI technology (-100 to +100) */
  aiTrustChange: number;
  
  /** Cultural shifts caused by event (descriptions) */
  culturalShifts: string[];
  
  /** Media sentiment (-100 to +100, negative = critical coverage) */
  mediaSentiment: number;
}

/**
 * Trigger conditions that caused this event.
 * Documents what thresholds were crossed to trigger the event.
 */
export interface TriggerCondition {
  /** Type of trigger (e.g., "Market Share", "AGI Capability") */
  type: string;
  
  /** Threshold value that was crossed */
  threshold: number;
  
  /** Actual value when event triggered */
  actualValue: number;
  
  /** Company responsible for crossing threshold (if applicable) */
  responsibleCompany?: Types.ObjectId;
}

/**
 * GlobalImpactEvent document interface.
 * Represents a single global impact event in the AI industry.
 */
export interface IGlobalImpactEvent extends Document {
  // ==== BASIC INFO ==== //
  /** Event type (monopoly, regulation, backlash, arms race, automation) */
  eventType: GlobalImpactEventType;
  
  /** Event severity (minor, major, critical, existential) */
  severity: EventSeverity;
  
  /** Current status of the event */
  status: EventStatus;
  
  /** Event title (e.g., "OpenAI Achieves AGI Monopoly") */
  title: string;
  
  /** Detailed description of the event */
  description: string;
  
  /** When the event was triggered */
  triggeredAt: Date;
  
  /** When the event was resolved (if resolved) */
  resolvedAt?: Date;
  
  // ==== COMPANIES INVOLVED ==== //
  /** Primary company responsible for triggering event */
  primaryCompany: Types.ObjectId;
  
  /** Other companies involved/affected */
  affectedCompanies: Types.ObjectId[];
  
  /** Company market shares at time of event */
  marketShareSnapshot: Map<string, number>;
  
  // ==== GEOGRAPHIC SCOPE ==== //
  /** Countries affected by this event */
  countriesAffected: string[];
  
  /** Global scope (true = affects entire world) */
  isGlobal: boolean;
  
  // ==== CONSEQUENCES ==== //
  /** Economic impact and consequences */
  economicConsequence: EconomicConsequence;
  
  /** Political impact and consequences */
  politicalConsequence: PoliticalConsequence;
  
  /** Social impact and consequences */
  socialConsequence: SocialConsequence;
  
  // ==== TRIGGER INFO ==== //
  /** Conditions that triggered this event */
  triggerConditions: TriggerCondition[];
  
  /** Market concentration (HHI) at trigger time */
  marketConcentration: number;
  
  /** Highest AGI capability score at trigger time */
  agiCapabilityAtTrigger: number;
  
  // ==== RESPONSE & RESOLUTION ==== //
  /** Actions taken by companies in response */
  companyResponses: Array<{
    company: Types.ObjectId;
    action: string;
    effectiveness: number; // 0-100
  }>;
  
  /** Government/regulatory responses */
  governmentResponses: Array<{
    country: string;
    action: string;
    severity: EventSeverity;
  }>;
  
  /** Public reactions and movements */
  publicReactions: Array<{
    type: string; // "protest", "boycott", "support", etc.
    scale: number; // 0-100
    description: string;
  }>;
  
  // ==== METADATA ==== //
  /** News headlines generated for this event */
  newsHeadlines: string[];
  
  /** Historical significance (0-100, higher = more important) */
  historicalSignificance: number;
  
  /** Lessons learned from this event (for AI safety) */
  lessonsLearned: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

// ==== SCHEMA DEFINITION ==== //

const GlobalImpactEventSchema = new Schema<IGlobalImpactEvent>(
  {
    // ==== BASIC INFO ==== //
    eventType: {
      type: String,
      enum: Object.values(GlobalImpactEventType),
      required: [true, 'Event type is required'],
      index: true,
    },
    severity: {
      type: String,
      enum: Object.values(EventSeverity),
      required: [true, 'Severity is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.ACTIVE,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    resolvedAt: {
      type: Date,
      // Optional - only set when status becomes RESOLVED
    },
    
    // ==== COMPANIES INVOLVED ==== //
    primaryCompany: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Primary company is required'],
      index: true,
    },
    affectedCompanies: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Company',
      },
    ],
    marketShareSnapshot: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    
    // ==== GEOGRAPHIC SCOPE ==== //
    countriesAffected: [
      {
        type: String,
        trim: true,
      },
    ],
    isGlobal: {
      type: Boolean,
      default: false,
    },
    
    // ==== CONSEQUENCES ==== //
    economicConsequence: {
      gdpImpact: {
        type: Number,
        min: [-50, 'GDP impact cannot be less than -50%'],
        max: [20, 'GDP impact cannot exceed +20%'],
        default: 0,
      },
      jobsAffected: {
        type: Number,
        default: 0,
      },
      marketValueImpact: {
        type: Number,
        default: 0,
      },
      industriesAffected: [String],
      recoveryTimeMonths: {
        type: Number,
        min: [0, 'Recovery time cannot be negative'],
        default: 0,
      },
    },
    
    politicalConsequence: {
      regulationsImposed: [String],
      countriesBanning: [String],
      stabilityImpact: {
        type: Number,
        min: [-100, 'Stability impact cannot be less than -100'],
        max: [100, 'Stability impact cannot exceed +100'],
        default: 0,
      },
      geopoliticalShifts: [String],
      interventionRisk: {
        type: Number,
        min: [0, 'Intervention risk cannot be negative'],
        max: [100, 'Intervention risk cannot exceed 100%'],
        default: 0,
      },
    },
    
    socialConsequence: {
      publicPerceptionChange: {
        type: Number,
        min: [-100, 'Perception change cannot be less than -100'],
        max: [100, 'Perception change cannot exceed +100'],
        default: 0,
      },
      unrestLevel: {
        type: Number,
        min: [0, 'Unrest level cannot be negative'],
        max: [100, 'Unrest level cannot exceed 100'],
        default: 0,
      },
      aiTrustChange: {
        type: Number,
        min: [-100, 'Trust change cannot be less than -100'],
        max: [100, 'Trust change cannot exceed +100'],
        default: 0,
      },
      culturalShifts: [String],
      mediaSentiment: {
        type: Number,
        min: [-100, 'Media sentiment cannot be less than -100'],
        max: [100, 'Media sentiment cannot exceed +100'],
        default: 0,
      },
    },
    
    // ==== TRIGGER INFO ==== //
    triggerConditions: [
      {
        type: {
          type: String,
          required: true,
        },
        threshold: {
          type: Number,
          required: true,
        },
        actualValue: {
          type: Number,
          required: true,
        },
        responsibleCompany: {
          type: Schema.Types.ObjectId,
          ref: 'Company',
        },
      },
    ],
    marketConcentration: {
      type: Number,
      min: [0, 'Market concentration cannot be negative'],
      max: [10000, 'Market concentration (HHI) cannot exceed 10,000'],
      default: 0,
    },
    agiCapabilityAtTrigger: {
      type: Number,
      min: [0, 'AGI capability cannot be negative'],
      max: [100, 'AGI capability cannot exceed 100'],
      default: 0,
    },
    
    // ==== RESPONSE & RESOLUTION ==== //
    companyResponses: [
      {
        company: {
          type: Schema.Types.ObjectId,
          ref: 'Company',
          required: true,
        },
        action: {
          type: String,
          required: true,
          trim: true,
        },
        effectiveness: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
      },
    ],
    
    governmentResponses: [
      {
        country: {
          type: String,
          required: true,
          trim: true,
        },
        action: {
          type: String,
          required: true,
          trim: true,
        },
        severity: {
          type: String,
          enum: Object.values(EventSeverity),
          required: true,
        },
      },
    ],
    
    publicReactions: [
      {
        type: {
          type: String,
          required: true,
          trim: true,
        },
        scale: {
          type: Number,
          min: 0,
          max: 100,
          required: true,
        },
        description: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    
    // ==== METADATA ==== //
    newsHeadlines: [
      {
        type: String,
        trim: true,
        maxlength: [200, 'Headline cannot exceed 200 characters'],
      },
    ],
    historicalSignificance: {
      type: Number,
      min: [0, 'Historical significance cannot be negative'],
      max: [100, 'Historical significance cannot exceed 100'],
      default: 50,
    },
    lessonsLearned: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    collection: 'globalimpactevents',
  }
);

// ==== INDEXES ==== //

// Compound indexes for common queries
GlobalImpactEventSchema.index({ eventType: 1, severity: 1 });
GlobalImpactEventSchema.index({ primaryCompany: 1, triggeredAt: -1 });
GlobalImpactEventSchema.index({ status: 1, triggeredAt: -1 });
GlobalImpactEventSchema.index({ isGlobal: 1, severity: 1 });

// ==== EXPORT ==== //

export default models.GlobalImpactEvent ||
  model<IGlobalImpactEvent>('GlobalImpactEvent', GlobalImpactEventSchema);

/**
 * IMPLEMENTATION NOTES:
 * 
 * EVENT TRIGGERS:
 * - Market Monopoly: Triggered when company achieves >40% market share
 * - Regulatory Intervention: Triggered at >60% market share or after sustained monopoly
 * - Public Backlash: Triggered by poor alignment score (<50) or catastrophic events
 * - AI Arms Race: Triggered by international competition or geopolitical tensions
 * - Automation Wave: Triggered when AGI capability >80 (General Intelligence achieved)
 * 
 * SEVERITY CALCULATION:
 * - Minor: Local impact, <$1B economic impact, <10% public perception change
 * - Major: Regional, $1-10B impact, 10-30% perception change, regulatory scrutiny
 * - Critical: National/global, $10-100B impact, >30% perception, major regulation
 * - Existential: Civilization-level, >$100B impact, potential AGI safety failure
 * 
 * ECONOMIC IMPACT:
 * - GDP impact calculated from market disruption and job displacement
 * - Job losses estimated from automation capability and industry penetration
 * - Market value impact from stock market reactions and asset devaluations
 * 
 * POLITICAL CONSEQUENCES:
 * - Regulations imposed based on severity and public pressure
 * - Country bans more likely at higher AGI capability levels
 * - Intervention risk increases with market concentration
 * 
 * SOCIAL IMPACT:
 * - Public perception driven by media coverage and job losses
 * - Unrest level correlates with unemployment and economic disruption
 * - AI trust decreases with safety failures, increases with beneficial outcomes
 * 
 * STRATEGIC GAMEPLAY:
 * - Players must balance growth with public perception
 * - Lobbying can reduce intervention risk
 * - Safety investments reduce backlash probability
 * - International expansion reduces regulatory concentration risk
 */
