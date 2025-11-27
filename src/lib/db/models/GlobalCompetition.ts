/**
 * GlobalCompetition Model
 *
 * Created: 2025-11-23
 * Phase: 4.0 - Advanced Systems
 *
 * OVERVIEW:
 * Models international AI competition dynamics including geopolitical tensions,
 * trade wars, technology restrictions, and collaborative opportunities between
 * countries pursuing AI dominance.
 *
 * FEATURES:
 * - Country-level AI capability tracking
 * - Geopolitical tension measurement
 * - Trade war mechanics and economic sanctions
 * - Technology export controls and IP restrictions
 * - International collaboration opportunities
 * - Arms race escalation modeling
 *
 * BUSINESS LOGIC:
 * - Competition driven by AGI capability gaps and market share differences
 * - Tension escalates with capability imbalances >30 points
 * - Trade wars triggered by dominance thresholds or security concerns
 * - Collaboration opportunities exist when mutual benefits outweigh competition
 *
 * @implementation FID-20251123-001 Phase 4.0 Advanced Systems
 */

import mongoose, { Schema, Document } from 'mongoose';

// ==== TYPES ==== //

/**
 * Country AI capability and investment data
 */
export interface CountryCapability {
  country: string;              // Country name
  agiCapability: number;        // AGI capability score (0-100)
  marketShare: number;          // Global AI market share (0-100)
  investmentLevel: number;      // Annual AI investment (billions USD)
  researchInstitutions: number; // Number of top-tier AI research institutions
  talentPool: number;           // AI talent pool size (thousands of researchers)
  policySupport: number;        // Government policy support score (0-100)
  lastUpdated: Date;            // When data was last updated
}

/**
 * Bilateral relationship between two countries
 */
export interface BilateralRelation {
  countryA: string;
  countryB: string;
  tensionLevel: number;         // Geopolitical tension (0-100)
  cooperationLevel: number;     // Cooperation willingness (0-100)
  tradeRestrictions: string[];  // Active trade barriers
  technologyFlows: 'Open' | 'Restricted' | 'Blocked';
  diplomaticStatus: 'Friendly' | 'Neutral' | 'Strained' | 'Hostile';
  lastIncident?: Date;          // Date of last major incident
  resolutionEfforts: string[];  // Ongoing diplomatic efforts
}

/**
 * Trade war instance with economic impacts
 */
export interface TradeWar {
  _id?: mongoose.Types.ObjectId;
  initiator: string;             // Country that started the trade war
  target: string;                // Country being targeted
  triggerReason: string;         // What triggered the trade war
  startedAt: Date;
  isActive: boolean;
  economicImpact: {
    gdpLossPercentage: number;   // GDP impact on global economy
    tradeVolumeReduction: number; // Reduction in bilateral trade (%)
    affectedIndustries: string[]; // Industries hit by restrictions
    estimatedDuration: number;   // Expected duration in months
  };
  sanctions: Array<{
    type: 'Tariff' | 'Quota' | 'Embargo' | 'Tech_Ban';
    target: string;              // What is being sanctioned
    impact: number;              // Economic impact (billions USD)
    effectiveness: number;       // How effective the sanction is (0-100)
  }>;
  escalationRisk: number;        // Risk of military escalation (0-100)
  resolution?: {
    resolvedAt: Date;
    outcome: 'Compromise' | 'Escalation' | 'Stalemate';
    terms: string[];             // Key resolution terms
  };
}

/**
 * Technology restriction and export control
 */
export interface TechnologyRestriction {
  restrictingCountry: string;
  restrictedCountry: string;
  technologyType: string;        // Type of AI technology restricted
  restrictionLevel: 'Partial' | 'Full' | 'Complete_Ban';
  economicImpact: number;        // Impact on restricted country's economy (billions USD)
  effectiveness: number;         // How effective the restriction is (0-100)
  circumventionMethods: string[]; // Ways restrictions are being bypassed
  durationMonths: number;        // How long restriction has been in place
  imposedAt: Date;
}

/**
 * International collaboration opportunity
 */
export interface CollaborationOpportunity {
  participants: string[];        // Countries involved
  focusArea: string;             // AI research area (safety, AGI, applications)
  mutualBenefit: number;         // Benefit score for all participants (0-100)
  trustLevel: number;            // Trust between participants (0-100)
  resourceCommitment: number;    // Resource investment required (billions USD)
  timelineMonths: number;        // Expected timeline to results
  successProbability: number;    // Probability of success (0-100)
  proposedAt: Date;
  status: 'Proposed' | 'Under_Discussion' | 'Active' | 'Completed' | 'Failed';
}

/**
 * Arms race escalation event
 */
export interface ArmsRaceEvent {
  _id?: mongoose.Types.ObjectId;
  triggerCountries: string[];    // Countries involved in escalation
  escalationType: 'Capability_Race' | 'Investment_Race' | 'Talent_War' | 'Resource_Competition';
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  globalRisk: number;            // Risk to global stability (0-100)
  economicCost: number;          // Global economic cost (trillions USD)
  triggeredAt: Date;
  isActive: boolean;
  deescalationEfforts: string[]; // Attempts to reduce tensions
  potentialOutcomes: string[];   // Possible escalation paths
}

// ==== INTERFACES ==== //

/**
 * Global Competition Document Interface
 */
export interface IGlobalCompetition extends Document {
  _id: mongoose.Types.ObjectId;
  countryCapabilities: CountryCapability[];
  bilateralRelations: BilateralRelation[];
  activeTradeWars: TradeWar[];
  technologyRestrictions: TechnologyRestriction[];
  collaborationOpportunities: CollaborationOpportunity[];
  armsRaceEvents: ArmsRaceEvent[];
  globalTensionIndex: number;     // Overall global AI competition tension (0-100)
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ==== SCHEMA ==== //

const CountryCapabilitySchema = new Schema<CountryCapability>({
  country: { type: String, required: true },
  agiCapability: { type: Number, required: true, min: 0, max: 100 },
  marketShare: { type: Number, required: true, min: 0, max: 100 },
  investmentLevel: { type: Number, required: true, min: 0 },
  researchInstitutions: { type: Number, required: true, min: 0 },
  talentPool: { type: Number, required: true, min: 0 },
  policySupport: { type: Number, required: true, min: 0, max: 100 },
  lastUpdated: { type: Date, required: true, default: Date.now },
}, { _id: false });

const BilateralRelationSchema = new Schema<BilateralRelation>({
  countryA: { type: String, required: true },
  countryB: { type: String, required: true },
  tensionLevel: { type: Number, required: true, min: 0, max: 100 },
  cooperationLevel: { type: Number, required: true, min: 0, max: 100 },
  tradeRestrictions: [{ type: String }],
  technologyFlows: {
    type: String,
    required: true,
    enum: ['Open', 'Restricted', 'Blocked']
  },
  diplomaticStatus: {
    type: String,
    required: true,
    enum: ['Friendly', 'Neutral', 'Strained', 'Hostile']
  },
  lastIncident: { type: Date },
  resolutionEfforts: [{ type: String }],
}, { _id: false });

const TradeWarSchema = new Schema<TradeWar>({
  initiator: { type: String, required: true },
  target: { type: String, required: true },
  triggerReason: { type: String, required: true },
  startedAt: { type: Date, required: true, default: Date.now },
  isActive: { type: Boolean, required: true, default: true },
  economicImpact: {
    gdpLossPercentage: { type: Number, required: true, min: 0 },
    tradeVolumeReduction: { type: Number, required: true, min: 0, max: 100 },
    affectedIndustries: [{ type: String }],
    estimatedDuration: { type: Number, required: true, min: 0 },
  },
  sanctions: [{
    type: {
      type: String,
      required: true,
      enum: ['Tariff', 'Quota', 'Embargo', 'Tech_Ban']
    },
    target: { type: String, required: true },
    impact: { type: Number, required: true, min: 0 },
    effectiveness: { type: Number, required: true, min: 0, max: 100 },
  }],
  escalationRisk: { type: Number, required: true, min: 0, max: 100 },
  resolution: {
    resolvedAt: { type: Date },
    outcome: {
      type: String,
      enum: ['Compromise', 'Escalation', 'Stalemate']
    },
    terms: [{ type: String }],
  },
});

const TechnologyRestrictionSchema = new Schema<TechnologyRestriction>({
  restrictingCountry: { type: String, required: true },
  restrictedCountry: { type: String, required: true },
  technologyType: { type: String, required: true },
  restrictionLevel: {
    type: String,
    required: true,
    enum: ['Partial', 'Full', 'Complete_Ban']
  },
  economicImpact: { type: Number, required: true, min: 0 },
  effectiveness: { type: Number, required: true, min: 0, max: 100 },
  circumventionMethods: [{ type: String }],
  durationMonths: { type: Number, required: true, min: 0 },
  imposedAt: { type: Date, required: true, default: Date.now },
}, { _id: false });

const CollaborationOpportunitySchema = new Schema<CollaborationOpportunity>({
  participants: [{ type: String, required: true }],
  focusArea: { type: String, required: true },
  mutualBenefit: { type: Number, required: true, min: 0, max: 100 },
  trustLevel: { type: Number, required: true, min: 0, max: 100 },
  resourceCommitment: { type: Number, required: true, min: 0 },
  timelineMonths: { type: Number, required: true, min: 0 },
  successProbability: { type: Number, required: true, min: 0, max: 100 },
  proposedAt: { type: Date, required: true, default: Date.now },
  status: {
    type: String,
    required: true,
    enum: ['Proposed', 'Under_Discussion', 'Active', 'Completed', 'Failed'],
    default: 'Proposed'
  },
}, { _id: false });

const ArmsRaceEventSchema = new Schema<ArmsRaceEvent>({
  triggerCountries: [{ type: String, required: true }],
  escalationType: {
    type: String,
    required: true,
    enum: ['Capability_Race', 'Investment_Race', 'Talent_War', 'Resource_Competition']
  },
  severity: {
    type: String,
    required: true,
    enum: ['Low', 'Moderate', 'High', 'Critical']
  },
  globalRisk: { type: Number, required: true, min: 0, max: 100 },
  economicCost: { type: Number, required: true, min: 0 },
  triggeredAt: { type: Date, required: true, default: Date.now },
  isActive: { type: Boolean, required: true, default: true },
  deescalationEfforts: [{ type: String }],
  potentialOutcomes: [{ type: String }],
});

const GlobalCompetitionSchema = new Schema<IGlobalCompetition>({
  countryCapabilities: [{ type: CountryCapabilitySchema }],
  bilateralRelations: [{ type: BilateralRelationSchema }],
  activeTradeWars: [{ type: TradeWarSchema }],
  technologyRestrictions: [{ type: TechnologyRestrictionSchema }],
  collaborationOpportunities: [{ type: CollaborationOpportunitySchema }],
  armsRaceEvents: [{ type: ArmsRaceEventSchema }],
  globalTensionIndex: { type: Number, required: true, min: 0, max: 100 },
  lastUpdated: { type: Date, required: true, default: Date.now },
}, {
  timestamps: true,
  collection: 'globalcompetition'
});

// ==== INDEXES ==== //

GlobalCompetitionSchema.index({ globalTensionIndex: -1 });
GlobalCompetitionSchema.index({ lastUpdated: -1 });
GlobalCompetitionSchema.index({ 'activeTradeWars.isActive': 1 });
GlobalCompetitionSchema.index({ 'armsRaceEvents.isActive': 1 });

// ==== PRE-SAVE HOOKS ==== //

GlobalCompetitionSchema.pre('save', function(next) {
  const doc = this as IGlobalCompetition;

  // Validate country capabilities sum to reasonable global market share
  const totalMarketShare = doc.countryCapabilities.reduce(
    (sum, country) => sum + country.marketShare, 0
  );

  if (totalMarketShare > 110) { // Allow some flexibility for estimation
    return next(new Error(`Total market share cannot exceed 110% (currently ${totalMarketShare.toFixed(1)}%)`));
  }

  // Update lastUpdated timestamp
  doc.lastUpdated = new Date();

  // Recalculate global tension index based on current data
  doc.globalTensionIndex = calculateGlobalTensionIndex(doc);

  next();
});

// Helper function to calculate global tension index
function calculateGlobalTensionIndex(doc: IGlobalCompetition): number {
  let tensionScore = 0;

  // Factor 1: Bilateral relations tension (40% weight)
  const avgBilateralTension = doc.bilateralRelations.length > 0
    ? doc.bilateralRelations.reduce((sum, rel) => sum + rel.tensionLevel, 0) / doc.bilateralRelations.length
    : 0;
  tensionScore += avgBilateralTension * 0.4;

  // Factor 2: Active trade wars (30% weight)
  const activeTradeWars = doc.activeTradeWars.filter(tw => tw.isActive).length;
  tensionScore += Math.min(activeTradeWars * 10, 30); // Max 30 points

  // Factor 3: Arms race events (20% weight)
  const activeArmsRaces = doc.armsRaceEvents.filter(ar => ar.isActive).length;
  tensionScore += Math.min(activeArmsRaces * 8, 20); // Max 20 points

  // Factor 4: Technology restrictions (10% weight)
  const restrictionCount = doc.technologyRestrictions.length;
  tensionScore += Math.min(restrictionCount * 2, 10); // Max 10 points

  return Math.min(100, Math.max(0, tensionScore));
}

// ==== STATIC METHODS ==== //

/**
 * Get current global competition state
 */
GlobalCompetitionSchema.statics.getCurrentState = function(): Promise<IGlobalCompetition | null> {
  return this.findOne().sort({ lastUpdated: -1 });
};

/**
 * Find active trade wars
 */
GlobalCompetitionSchema.statics.getActiveTradeWars = function(): Promise<TradeWar[]> {
  return this.aggregate([
    { $unwind: '$activeTradeWars' },
    { $match: { 'activeTradeWars.isActive': true } },
    { $replaceRoot: { newRoot: '$activeTradeWars' } }
  ]);
};

/**
 * Find active arms race events
 */
GlobalCompetitionSchema.statics.getActiveArmsRaces = function(): Promise<ArmsRaceEvent[]> {
  return this.aggregate([
    { $unwind: '$armsRaceEvents' },
    { $match: { 'armsRaceEvents.isActive': true } },
    { $replaceRoot: { newRoot: '$armsRaceEvents' } }
  ]);
};

/**
 * Get country capability ranking
 */
GlobalCompetitionSchema.statics.getCapabilityRanking = function(): Promise<CountryCapability[]> {
  return this.aggregate([
    { $unwind: '$countryCapabilities' },
    { $sort: { 'countryCapabilities.agiCapability': -1 } },
    { $replaceRoot: { newRoot: '$countryCapabilities' } }
  ]);
};

// ==== INSTANCE METHODS ==== //

/**
 * Add a new trade war
 */
GlobalCompetitionSchema.methods.addTradeWar = function(
  tradeWar: Omit<TradeWar, '_id'>
): Promise<IGlobalCompetition> {
  this.activeTradeWars.push(tradeWar as TradeWar);
  return this.save();
};

/**
 * Resolve a trade war
 */
GlobalCompetitionSchema.methods.resolveTradeWar = function(
  tradeWarId: mongoose.Types.ObjectId,
  resolution: TradeWar['resolution']
): Promise<IGlobalCompetition> {
  const tradeWar = this.activeTradeWars.id(tradeWarId);
  if (tradeWar) {
    tradeWar.resolution = resolution;
    tradeWar.isActive = false;
  }
  return this.save();
};

/**
 * Add technology restriction
 */
GlobalCompetitionSchema.methods.addTechnologyRestriction = function(
  restriction: TechnologyRestriction
): Promise<IGlobalCompetition> {
  this.technologyRestrictions.push(restriction);
  return this.save();
};

/**
 * Update bilateral relation
 */
GlobalCompetitionSchema.methods.updateBilateralRelation = function(
  countryA: string,
  countryB: string,
  updates: Partial<BilateralRelation>
): Promise<IGlobalCompetition> {
  const relation = this.bilateralRelations.find(
    (rel: BilateralRelation) => (rel.countryA === countryA && rel.countryB === countryB) ||
           (rel.countryA === countryB && rel.countryB === countryA)
  );

  if (relation) {
    Object.assign(relation, updates);
  } else {
    // Create new relation if it doesn't exist
    this.bilateralRelations.push({
      countryA,
      countryB,
      tensionLevel: 0,
      cooperationLevel: 50,
      tradeRestrictions: [],
      technologyFlows: 'Open',
      diplomaticStatus: 'Neutral',
      resolutionEfforts: [],
      ...updates,
    } as BilateralRelation);
  }

  return this.save();
};

/**
 * Add collaboration opportunity
 */
GlobalCompetitionSchema.methods.addCollaborationOpportunity = function(
  opportunity: CollaborationOpportunity
): Promise<IGlobalCompetition> {
  this.collaborationOpportunities.push(opportunity);
  return this.save();
};

/**
 * Trigger arms race event
 */
GlobalCompetitionSchema.methods.triggerArmsRace = function(
  armsRace: Omit<ArmsRaceEvent, '_id'>
): Promise<IGlobalCompetition> {
  this.armsRaceEvents.push(armsRace as ArmsRaceEvent);
  return this.save();
};

// ==== MODEL ==== //

const GlobalCompetition = mongoose.models.GlobalCompetition ||
  mongoose.model<IGlobalCompetition>('GlobalCompetition', GlobalCompetitionSchema);

export default GlobalCompetition;

// ==== IMPLEMENTATION NOTES ==== //

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. COUNTRY CAPABILITIES:
 *    - Tracks AGI capability, market share, investment, research institutions
 *    - Talent pool and policy support metrics
 *    - Updated quarterly from global AI development data
 *
 * 2. BILATERAL RELATIONS:
 *    - Tension and cooperation levels between country pairs
 *    - Trade restrictions and technology flow status
 *    - Diplomatic status tracking with incident history
 *
 * 3. TRADE WARS:
 *    - Initiator/target dynamics with economic impact assessment
 *    - Sanctions with effectiveness ratings
 *    - Escalation risk to military conflict
 *    - Resolution tracking with outcomes
 *
 * 4. TECHNOLOGY RESTRICTIONS:
 *    - Export controls on AI technologies
 *    - Effectiveness and circumvention tracking
 *    - Economic impact on restricted countries
 *
 * 5. COLLABORATION OPPORTUNITIES:
 *    - Multi-country research initiatives
 *    - Mutual benefit and trust assessments
 *    - Success probability and resource requirements
 *
 * 6. ARMS RACE EVENTS:
 *    - Capability races, investment competitions, talent wars
 *    - Severity levels and global risk assessment
 *    - De-escalation efforts and potential outcomes
 *
 * 7. GLOBAL TENSION INDEX:
 *    - Calculated from bilateral relations, trade wars, arms races, restrictions
 *    - Weighted formula: bilateral (40%), trade wars (30%), arms races (20%), restrictions (10%)
 *    - Used for overall geopolitical risk assessment
 *
 * 8. BUSINESS LOGIC:
 *    - Data updated monthly via international AI monitoring systems
 *    - Integration with global impact utilities for event triggering
 *    - API endpoints for diplomatic strategy and risk assessment
 *    - Historical tracking for trend analysis and forecasting
 *
 * 9. USAGE PATTERNS:
 *    - Geopolitical dashboard showing tension levels
 *    - Trade war impact analysis for companies
 *    - Diplomatic strategy recommendations
 *    - Risk assessment for international expansion
 */