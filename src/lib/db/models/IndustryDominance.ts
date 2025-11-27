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

import mongoose, { Schema, Document } from 'mongoose';

// ==== TYPES ==== //

/**
 * Market share data for a company in a specific market segment
 */
export interface MarketShareData {
  companyId: mongoose.Types.ObjectId;
  companyName: string;
  marketShare: number;        // Percentage (0-100)
  revenue: number;           // Revenue in market segment
  userCount: number;         // Number of users/customers
  modelDeployments: number;  // Number of deployed AI models
  marketPosition: number;    // Ranking (1 = market leader)
  lastUpdated: Date;         // When data was last calculated
}

/**
 * Industry concentration metrics using HHI
 */
export interface IndustryConcentration {
  hhi: number;               // Herfindahl-Hirschman Index (0-10,000)
  marketStructure: 'Competitive' | 'Moderate' | 'Concentrated' | 'Monopolistic';
  topCompanies: MarketShareData[];
  totalMarketSize: number;   // Total industry revenue
  numberOfCompetitors: number;
  concentrationTrend: 'Increasing' | 'Stable' | 'Decreasing';
  calculatedAt: Date;        // When HHI was calculated
}

/**
 * Monopoly detection result with antitrust implications
 */
export interface MonopolyDetection {
  isMonopoly: boolean;
  marketShare: number;
  antitrustRisk: number;     // 0-100 (higher = more risk)
  regulatoryActions: string[]; // Likely government responses
  recommendedActions: string[]; // What company should do
  timeToIntervention?: number; // Estimated months until forced action
  detectedAt: Date;          // When monopoly was detected
}

/**
 * Competitive intelligence data
 */
export interface CompetitiveIntelligence {
  companyId: mongoose.Types.ObjectId;
  marketPosition: number;    // Ranking in industry
  nearestCompetitors: Array<{
    companyId: mongoose.Types.ObjectId;
    name: string;
    marketShare: number;
    gap: number;             // Percentage point difference
  }>;
  competitiveAdvantages: string[];
  vulnerabilities: string[];
  threatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  opportunityScore: number;  // 0-100 (higher = better growth opportunities)
  analyzedAt: Date;          // When intelligence was gathered
}

/**
 * Antitrust risk assessment with detailed factors
 */
export interface AntitrustRisk {
  riskScore: number;         // 0-100
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  triggerFactors: Array<{
    factor: string;
    weight: number;
    contribution: number;
  }>;
  mitigationStrategies: string[];
  estimatedFines: number;    // Potential regulatory fines in USD
  probabilityOfAction: number; // 0-100 (likelihood of government intervention)
  assessedAt: Date;          // When risk was assessed
}

/**
 * Industry consolidation impact from M&A
 */
export interface ConsolidationImpact {
  preMergerHHI: number;
  postMergerHHI: number;
  hhiChange: number;
  antitrustConcern: boolean; // True if HHI increase >200
  expectedRegulatorResponse: 'Approve' | 'Review' | 'Block';
  marketShareCombined: number;
  competitiveEffects: string[];
  analyzedAt: Date;          // When impact was analyzed
}

// ==== INTERFACES ==== //

/**
 * Industry Dominance Document Interface
 */
export interface IIndustryDominance extends Document {
  _id: mongoose.Types.ObjectId;
  industry: string;                    // Industry type (e.g., "Technology")
  subcategory: string;                 // AI subcategory (e.g., "AI", "Software")
  marketShares: MarketShareData[];     // Current market share data
  concentration: IndustryConcentration;
  monopolies: MonopolyDetection[];     // Detected monopolies
  competitiveIntelligence: CompetitiveIntelligence[];
  antitrustRisks: AntitrustRisk[];     // Risk assessments
  consolidationHistory: ConsolidationImpact[]; // M&A impact history
  lastCalculated: Date;                // When data was last updated
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  recalculateMarketShares(): Promise<IIndustryDominance>;
  addMonopolyDetection(monopoly: MonopolyDetection): Promise<IIndustryDominance>;
  updateCompetitiveIntelligence(intelligence: CompetitiveIntelligence): Promise<IIndustryDominance>;
  addAntitrustRisk(risk: AntitrustRisk): Promise<IIndustryDominance>;
  recordConsolidation(impact: ConsolidationImpact): Promise<IIndustryDominance>;
}

/**
 * Industry Dominance Model Interface with static methods
 */
export interface IIndustryDominanceModel extends mongoose.Model<IIndustryDominance> {
  // Static methods
  findByIndustry(industry: string, subcategory?: string): Promise<IIndustryDominance | null>;
  getCompanyMarketShare(industry: string, subcategory: string, companyId: mongoose.Types.ObjectId): Promise<MarketShareData | null>;
  findConcentratedMarkets(): Promise<IIndustryDominance[]>;
  findMonopolies(): Promise<IIndustryDominance[]>;
}

// ==== SCHEMA ==== //

const MarketShareDataSchema = new Schema<MarketShareData>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  companyName: { type: String, required: true },
  marketShare: { type: Number, required: true, min: 0, max: 100 },
  revenue: { type: Number, required: true, min: 0 },
  userCount: { type: Number, required: true, min: 0 },
  modelDeployments: { type: Number, required: true, min: 0 },
  marketPosition: { type: Number, required: true, min: 1 },
  lastUpdated: { type: Date, required: true, default: Date.now },
}, { _id: false });

const IndustryConcentrationSchema = new Schema<IndustryConcentration>({
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

const MonopolyDetectionSchema = new Schema<MonopolyDetection>({
  isMonopoly: { type: Boolean, required: true },
  marketShare: { type: Number, required: true, min: 0, max: 100 },
  antitrustRisk: { type: Number, required: true, min: 0, max: 100 },
  regulatoryActions: [{ type: String }],
  recommendedActions: [{ type: String }],
  timeToIntervention: { type: Number, min: 0 },
  detectedAt: { type: Date, required: true, default: Date.now },
}, { _id: false });

const CompetitiveIntelligenceSchema = new Schema<CompetitiveIntelligence>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  marketPosition: { type: Number, required: true, min: 1 },
  nearestCompetitors: [{
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
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

const AntitrustRiskSchema = new Schema<AntitrustRisk>({
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

const ConsolidationImpactSchema = new Schema<ConsolidationImpact>({
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

const IndustryDominanceSchema = new Schema<IIndustryDominance>({
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

IndustryDominanceSchema.pre('save', function(next) {
  const doc = this as IIndustryDominance;

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
IndustryDominanceSchema.statics.findByIndustry = function(
  industry: string,
  subcategory?: string
): Promise<IIndustryDominance | null> {
  const query: any = { industry };
  if (subcategory) {
    query.subcategory = subcategory;
  }
  return this.findOne(query);
};

/**
 * Get market share for a specific company
 */
IndustryDominanceSchema.statics.getCompanyMarketShare = function(
  industry: string,
  subcategory: string,
  companyId: mongoose.Types.ObjectId
): Promise<MarketShareData | null> {
  return this.findOne(
    { industry, subcategory },
    { marketShares: { $elemMatch: { companyId } } }
  ).then((doc: IIndustryDominance | null) => doc?.marketShares[0] || null);
};

/**
 * Find industries with high concentration (HHI > 2500)
 */
IndustryDominanceSchema.statics.findConcentratedMarkets = function(): Promise<IIndustryDominance[]> {
  return this.find({ 'concentration.hhi': { $gt: 2500 } })
    .sort({ 'concentration.hhi': -1 });
};

/**
 * Find detected monopolies
 */
IndustryDominanceSchema.statics.findMonopolies = function(): Promise<IIndustryDominance[]> {
  return this.find({ 'monopolies.isMonopoly': true })
    .populate('monopolies.companyId', 'name');
};

// ==== INSTANCE METHODS ==== //

/**
 * Recalculate market shares from current data
 */
IndustryDominanceSchema.methods.recalculateMarketShares = function(): Promise<IIndustryDominance> {
  // This would integrate with the industryDominance utility functions
  // For now, just update the timestamp
  this.lastCalculated = new Date();
  return this.save();
};

/**
 * Add monopoly detection result
 */
IndustryDominanceSchema.methods.addMonopolyDetection = function(
  monopoly: MonopolyDetection
): Promise<IIndustryDominance> {
  this.monopolies.push(monopoly);
  return this.save();
};

/**
 * Update competitive intelligence for a company
 */
IndustryDominanceSchema.methods.updateCompetitiveIntelligence = function(
  intelligence: CompetitiveIntelligence
): Promise<IIndustryDominance> {
  // Remove existing intelligence for this company
  this.competitiveIntelligence = this.competitiveIntelligence.filter(
    (ci: CompetitiveIntelligence) => !ci.companyId.equals(intelligence.companyId)
  );

  // Add new intelligence
  this.competitiveIntelligence.push(intelligence);
  return this.save();
};

/**
 * Add antitrust risk assessment
 */
IndustryDominanceSchema.methods.addAntitrustRisk = function(
  risk: AntitrustRisk
): Promise<IIndustryDominance> {
  this.antitrustRisks.push(risk);
  return this.save();
};

/**
 * Record consolidation impact
 */
IndustryDominanceSchema.methods.recordConsolidation = function(
  impact: ConsolidationImpact
): Promise<IIndustryDominance> {
  this.consolidationHistory.push(impact);
  return this.save();
};

// ==== MODEL ==== //

const IndustryDominance = mongoose.models.IndustryDominance ||
  mongoose.model<IIndustryDominance, IIndustryDominanceModel>('IndustryDominance', IndustryDominanceSchema);

export default IndustryDominance;

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