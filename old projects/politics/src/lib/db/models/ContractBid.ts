/**
 * @file src/lib/db/models/ContractBid.ts
 * @description Contract bid Mongoose schema for competitive bidding system
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Competitive bidding system where companies (both player and NPC) submit bids
 * for available contracts. Bids include proposed price, timeline, quality commitment,
 * and resource allocation. Contract awards are based on weighted scoring that
 * considers price, company reputation, past performance, and proposal quality.
 * NPC competitors have AI personalities (aggressive, conservative, strategic)
 * that influence their bidding behavior.
 * 
 * SCHEMA FIELDS:
 * Bid Identity:
 * - contract: Reference to Contract document (required, indexed)
 * - company: Reference to Company document (required, indexed)
 * - submittedBy: User who submitted bid (for player companies)
 * - isNPC: True if bid from NPC competitor
 * - npcPersonality: AI bidding personality (Aggressive, Conservative, Strategic, Balanced)
 * 
 * Bid Terms:
 * - amount: Proposed bid amount ($1,000 - $20,000,000)
 * - proposedTimeline: Days to complete (must be ≤ contract.duration)
 * - qualityCommitment: Promised quality score (1-100)
 * - resourceAllocation: Proposed team structure
 *   - employeeCount: Number of employees to assign
 *   - skillBreakdown: Skill coverage breakdown
 *   - certificationsCovered: Required certifications provided
 * 
 * Pricing Strategy:
 * - priceStrategy: Bid pricing approach (Competitive, Premium, Value, Aggressive)
 * - marginTarget: Desired profit margin percentage (5-50%)
 * - discountPercentage: Discount from maximum bid (0-40%)
 * - pricingRationale: Explanation for bid amount
 * 
 * Technical Proposal:
 * - technicalApproach: Methodology description
 * - milestoneStrategy: How milestones will be achieved
 * - riskMitigation: Risk management plan
 * - innovationFactors: Unique value propositions
 * - pastPerformance: References to similar completed contracts
 * 
 * Evaluation Metrics:
 * - score: Calculated bid score (0-100)
 * - priceScore: Price competitiveness (0-100)
 * - reputationScore: Company reputation factor (0-100)
 * - qualityScore: Quality commitment evaluation (0-100)
 * - timelineScore: Timeline competitiveness (0-100)
 * - technicalScore: Technical proposal quality (0-100)
 * - overallRank: Ranking among all bids (1 = best)
 * 
 * Status & Award:
 * - status: Bid state (Submitted, UnderReview, Accepted, Rejected, Withdrawn)
 * - submittedAt: Bid submission timestamp
 * - reviewedAt: When bid was evaluated
 * - acceptedAt: When bid was accepted (if winner)
 * - rejectionReason: Why bid was rejected (if applicable)
 * - counterOfferReceived: Client counter-offer terms
 * 
 * Performance Tracking:
 * - estimatedCost: Internal cost estimate
 * - estimatedProfit: Expected profit ($)
 * - estimatedMargin: Expected margin (%)
 * - confidenceLevel: Bid confidence (1-100)
 * - winProbability: Calculated win probability (0-100%)
 * 
 * Competition Analysis:
 * - competitorAnalysis: Assessment of other bidders
 * - marketPosition: Position in market (Leader, Challenger, Follower, Niche)
 * - strategicValue: Strategic importance of contract (1-100)
 * 
 * USAGE:
 * ```typescript
 * import ContractBid from '@/lib/db/models/ContractBid';
 * import Contract from '@/lib/db/models/Contract';
 * 
 * // Submit player bid
 * const bid = await ContractBid.create({
 *   contract: contractId,
 *   company: companyId,
 *   amount: 4500000,
 *   proposedTimeline: 340,
 *   qualityCommitment: 90,
 *   resourceAllocation: {
 *     employeeCount: 12,
 *     skillBreakdown: { technical: 80, leadership: 70, compliance: 75 }
 *   },
 *   technicalApproach: 'Agile methodology with bi-weekly sprints',
 *   priceStrategy: 'Competitive',
 *   marginTarget: 25
 * });
 * 
 * // Generate NPC competitor bid
 * const npcBid = await ContractBid.generateNPCBid(
 *   contractId,
 *   'Aggressive'
 * );
 * 
 * // Calculate bid score
 * const score = await bid.calculateScore();
 * 
 * // Rank all bids
 * const rankedBids = await ContractBid.rankBids(contractId);
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Bid scoring formula: (Price * 0.35) + (Reputation * 0.25) + (Quality * 0.20) + (Timeline * 0.10) + (Technical * 0.10)
 * - Price score: Lower bids score higher (inverse relationship)
 * - Reputation score: Based on company reputation (0-100)
 * - Quality score: Based on qualityCommitment vs contract requirements
 * - Timeline score: Faster timelines score higher
 * - Technical score: Quality of technical proposal
 * - NPC personalities:
 *   - Aggressive: Low prices (-15-25% margin), fast timelines, high volume
 *   - Conservative: Higher prices (30-40% margin), realistic timelines, high quality
 *   - Strategic: Balanced approach, targets high-value contracts, builds reputation
 *   - Balanced: Middle ground, consistent bidding, reliable execution
 * - NPC bid generation: Uses personality + contract type + market conditions
 * - Win probability: Based on score relative to competition + company reputation
 * - Counter-offers: Clients may counter if bid is close but not lowest
 * - Bid withdrawal: Companies can withdraw before award (penalty to reputation)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { IContract } from './Contract';
import type { ICompany } from './Company';

/**
 * NPC bidding personalities
 */
export type NPCPersonality =
  | 'Aggressive'     // Low prices, fast timelines, high volume
  | 'Conservative'   // Higher prices, realistic timelines, high quality
  | 'Strategic'      // Balanced, targets high-value, builds reputation
  | 'Balanced';      // Middle ground, consistent, reliable

/**
 * Pricing strategies
 */
export type PriceStrategy =
  | 'Competitive'    // Match or beat average market price
  | 'Premium'        // Higher price, emphasize quality/expertise
  | 'Value'          // Lower price, emphasize efficiency
  | 'Aggressive';    // Lowest price, gain market share

/**
 * Bid status states
 */
export type BidStatus =
  | 'Submitted'      // Bid submitted, awaiting review
  | 'UnderReview'    // Being evaluated
  | 'Accepted'       // Winning bid
  | 'Rejected'       // Not selected
  | 'Withdrawn';     // Retracted by bidder

/**
 * Market position
 */
export type MarketPosition =
  | 'Leader'         // Market leader, premium pricing
  | 'Challenger'     // Growing competitor, competitive pricing
  | 'Follower'       // Smaller player, value pricing
  | 'Niche';         // Specialized, selective bidding

/**
 * Resource allocation interface
 */
export interface ResourceAllocation {
  employeeCount: number;
  skillBreakdown: {
    technical?: number;
    sales?: number;
    leadership?: number;
    finance?: number;
    marketing?: number;
    operations?: number;
    research?: number;
    compliance?: number;
    communication?: number;
    creativity?: number;
    analytical?: number;
    customerService?: number;
  };
  certificationsCovered: string[];
}

/**
 * Counter-offer terms interface
 */
export interface CounterOffer {
  newAmount: number;
  newTimeline?: number;
  additionalRequirements?: string[];
  expiresAt: Date;
  acceptedByBidder: boolean;
}

/**
 * Contract bid document interface
 * 
 * @interface IContractBid
 * @extends {Document}
 */
export interface IContractBid extends Document {
  // Bid Identity
  contract: Types.ObjectId;
  company: Types.ObjectId;
  submittedBy?: Types.ObjectId;
  isNPC: boolean;
  npcPersonality?: NPCPersonality;

  // Bid Terms
  amount: number;
  proposedTimeline: number;        // Days
  qualityCommitment: number;       // 1-100
  resourceAllocation: ResourceAllocation;

  // Pricing Strategy
  priceStrategy: PriceStrategy;
  marginTarget: number;            // Percentage (5-50)
  discountPercentage: number;      // 0-40%
  pricingRationale?: string;

  // Technical Proposal
  technicalApproach?: string;
  milestoneStrategy?: string;
  riskMitigation?: string;
  innovationFactors?: string[];
  pastPerformance?: Types.ObjectId[]; // References to completed contracts

  // Evaluation Metrics
  score: number;                   // 0-100
  priceScore: number;              // 0-100
  reputationScore: number;         // 0-100
  qualityScore: number;            // 0-100
  timelineScore: number;           // 0-100
  technicalScore: number;          // 0-100
  overallRank: number;             // 1 = best

  // Status & Award
  status: BidStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  acceptedAt?: Date;
  rejectionReason?: string;
  counterOfferReceived?: CounterOffer;

  // Performance Tracking
  estimatedCost: number;
  estimatedProfit: number;
  estimatedMargin: number;
  confidenceLevel: number;         // 1-100
  winProbability: number;          // 0-100%

  // Competition Analysis
  competitorAnalysis?: string;
  marketPosition: MarketPosition;
  strategicValue: number;          // 1-100

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  isWinning: boolean;
  daysUntilDecision: number;

  // Instance methods
  calculateScore(contract: IContract, company: ICompany): Promise<number>;
  withdraw(): Promise<void>;
  acceptCounterOffer(): Promise<void>;
}

/**
 * Contract bid static methods
 */
export interface IContractBidModel extends Model<IContractBid> {
  generateNPCBid(
    contractId: Types.ObjectId,
    personality: NPCPersonality
  ): Promise<IContractBid>;
  
  rankBids(contractId: Types.ObjectId): Promise<IContractBid[]>;
  
  findWinningBid(contractId: Types.ObjectId): Promise<IContractBid | null>;
}

/**
 * Contract bid schema definition
 */
const ContractBidSchema = new Schema<IContractBid, IContractBidModel>(
  {
    // Bid Identity
    contract: {
      type: Schema.Types.ObjectId,
      ref: 'Contract',
      required: [true, 'Contract reference is required'],
      index: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isNPC: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    npcPersonality: {
      type: String,
      enum: {
        values: ['Aggressive', 'Conservative', 'Strategic', 'Balanced'],
        message: '{VALUE} is not a valid NPC personality',
      },
      default: null,
    },

    // Bid Terms
    amount: {
      type: Number,
      required: [true, 'Bid amount is required'],
      min: [1000, 'Bid amount must be at least $1,000'],
      max: [20000000, 'Bid amount cannot exceed $20,000,000'],
    },
    proposedTimeline: {
      type: Number,
      required: [true, 'Proposed timeline is required'],
      min: [1, 'Timeline must be at least 1 day'],
      max: [3650, 'Timeline cannot exceed 10 years'],
    },
    qualityCommitment: {
      type: Number,
      required: [true, 'Quality commitment is required'],
      min: [1, 'Quality commitment must be at least 1'],
      max: [100, 'Quality commitment cannot exceed 100'],
      default: 75,
    },
    resourceAllocation: {
      type: {
        employeeCount: { 
          type: Number, 
          required: true,
          min: [1, 'Employee count must be at least 1']
        },
        skillBreakdown: {
          type: Schema.Types.Mixed,
          default: {}
        },
        certificationsCovered: {
          type: [String],
          default: []
        },
      },
      required: [true, 'Resource allocation is required'],
    },

    // Pricing Strategy
    priceStrategy: {
      type: String,
      required: [true, 'Price strategy is required'],
      enum: {
        values: ['Competitive', 'Premium', 'Value', 'Aggressive'],
        message: '{VALUE} is not a valid price strategy',
      },
      default: 'Competitive',
    },
    marginTarget: {
      type: Number,
      required: true,
      default: 20,
      min: [5, 'Margin target must be at least 5%'],
      max: [50, 'Margin target cannot exceed 50%'],
    },
    discountPercentage: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [40, 'Discount cannot exceed 40%'],
    },
    pricingRationale: {
      type: String,
      trim: true,
      maxlength: [500, 'Pricing rationale cannot exceed 500 characters'],
      default: null,
    },

    // Technical Proposal
    technicalApproach: {
      type: String,
      trim: true,
      maxlength: [2000, 'Technical approach cannot exceed 2000 characters'],
      default: null,
    },
    milestoneStrategy: {
      type: String,
      trim: true,
      maxlength: [1000, 'Milestone strategy cannot exceed 1000 characters'],
      default: null,
    },
    riskMitigation: {
      type: String,
      trim: true,
      maxlength: [1000, 'Risk mitigation cannot exceed 1000 characters'],
      default: null,
    },
    innovationFactors: {
      type: [String],
      default: [],
    },
    pastPerformance: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Contract' }],
      default: [],
    },

    // Evaluation Metrics
    score: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
      index: true,
    },
    priceScore: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Price score cannot be negative'],
      max: [100, 'Price score cannot exceed 100'],
    },
    reputationScore: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Reputation score cannot be negative'],
      max: [100, 'Reputation score cannot exceed 100'],
    },
    qualityScore: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Quality score cannot be negative'],
      max: [100, 'Quality score cannot exceed 100'],
    },
    timelineScore: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Timeline score cannot be negative'],
      max: [100, 'Timeline score cannot exceed 100'],
    },
    technicalScore: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Technical score cannot be negative'],
      max: [100, 'Technical score cannot exceed 100'],
    },
    overallRank: {
      type: Number,
      required: true,
      default: 999,
      min: [1, 'Rank must be at least 1'],
    },

    // Status & Award
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['Submitted', 'UnderReview', 'Accepted', 'Rejected', 'Withdrawn'],
        message: '{VALUE} is not a valid bid status',
      },
      default: 'Submitted',
      index: true,
    },
    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
      default: null,
    },
    counterOfferReceived: {
      type: {
        newAmount: { type: Number, required: true },
        newTimeline: Number,
        additionalRequirements: [String],
        expiresAt: { type: Date, required: true },
        acceptedByBidder: { type: Boolean, default: false },
      },
      default: null,
    },

    // Performance Tracking
    estimatedCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Estimated cost cannot be negative'],
    },
    estimatedProfit: {
      type: Number,
      required: true,
      default: 0,
    },
    estimatedMargin: {
      type: Number,
      required: true,
      default: 0,
      min: [-50, 'Margin cannot be below -50%'],
      max: [100, 'Margin cannot exceed 100%'],
    },
    confidenceLevel: {
      type: Number,
      required: true,
      default: 70,
      min: [1, 'Confidence level must be at least 1'],
      max: [100, 'Confidence level cannot exceed 100'],
    },
    winProbability: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Win probability cannot be negative'],
      max: [100, 'Win probability cannot exceed 100'],
    },

    // Competition Analysis
    competitorAnalysis: {
      type: String,
      trim: true,
      maxlength: [1000, 'Competitor analysis cannot exceed 1000 characters'],
      default: null,
    },
    marketPosition: {
      type: String,
      required: true,
      enum: {
        values: ['Leader', 'Challenger', 'Follower', 'Niche'],
        message: '{VALUE} is not a valid market position',
      },
      default: 'Follower',
    },
    strategicValue: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Strategic value must be at least 1'],
      max: [100, 'Strategic value cannot exceed 100'],
    },
  },
  {
    timestamps: true,
    collection: 'contract_bids',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
ContractBidSchema.index({ contract: 1, status: 1 });
ContractBidSchema.index({ company: 1, status: 1 });
ContractBidSchema.index({ contract: 1, score: -1 });
ContractBidSchema.index({ isNPC: 1, status: 1 });

/**
 * Compound unique index: One bid per company per contract
 */
ContractBidSchema.index({ contract: 1, company: 1 }, { unique: true });

/**
 * Virtual field: isWinning
 * True if bid was accepted
 */
ContractBidSchema.virtual('isWinning').get(function (this: IContractBid): boolean {
  return this.status === 'Accepted';
});

/**
 * Virtual field: daysUntilDecision
 * Days remaining until bidding deadline (requires contract data)
 * 
 * NOTE: Returns 0 for virtual calculation - actual value requires contract population.
 * To get accurate days until decision:
 * ```typescript
 * const bid = await ContractBid.findById(id).populate('contract');
 * const daysRemaining = Math.ceil(
 *   (bid.contract.biddingDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
 * );
 * ```
 */
ContractBidSchema.virtual('daysUntilDecision').get(function (this: IContractBid): number {
  // Returns 0 for virtual field - must populate contract and calculate externally
  // This prevents expensive populate operations on every bid query
  return 0;
});

/**
 * Instance method: calculateScore
 * Calculate overall bid score based on multiple factors
 * 
 * @param {IContract} contract - Contract document
 * @param {ICompany} company - Company document
 * @returns {Promise<number>} Overall score (0-100)
 */
ContractBidSchema.methods.calculateScore = async function (
  this: IContractBid,
  contract: IContract,
  company: ICompany
): Promise<number> {
  // Price score: Lower bids score higher
  const priceRange = contract.maximumBid - contract.minimumBid;
  const pricePosition = (contract.maximumBid - this.amount) / priceRange;
  this.priceScore = Math.max(0, Math.min(100, pricePosition * 100));

  // Reputation score: Based on company reputation
  this.reputationScore = company.reputation || 50;

  // Quality score: Based on quality commitment vs contract complexity
  const qualityRatio = this.qualityCommitment / contract.complexityScore;
  this.qualityScore = Math.max(0, Math.min(100, qualityRatio * 100));

  // Timeline score: Faster timelines score higher
  const timelineRatio = (contract.duration - this.proposedTimeline) / contract.duration;
  this.timelineScore = Math.max(0, Math.min(100, 50 + (timelineRatio * 100)));

  // Technical score: Quality of proposal
  const hasTechnicalApproach = this.technicalApproach ? 25 : 0;
  const hasMilestoneStrategy = this.milestoneStrategy ? 25 : 0;
  const hasRiskMitigation = this.riskMitigation ? 25 : 0;
  const hasPastPerformance = (this.pastPerformance && this.pastPerformance.length > 0) ? 25 : 0;
  this.technicalScore = hasTechnicalApproach + hasMilestoneStrategy + hasRiskMitigation + hasPastPerformance;

  // Overall score: Weighted average
  this.score = Math.round(
    (this.priceScore * 0.35) +
    (this.reputationScore * 0.25) +
    (this.qualityScore * 0.20) +
    (this.timelineScore * 0.10) +
    (this.technicalScore * 0.10)
  );

  await this.save();
  return this.score;
};

/**
 * Instance method: withdraw
 * Withdraw bid before award (reputation penalty)
 * 
 * Applies reputation penalty based on bid circumstances:
 * - Standard withdrawal: -2 reputation (opportunity cost)
 * - Late withdrawal (< 48h before deadline): -5 reputation (disrupts client planning)
 * - High-value withdrawal (> $1M): -10 reputation (major impact)
 * 
 * @throws Error if bid already accepted
 */
ContractBidSchema.methods.withdraw = async function (this: IContractBid): Promise<void> {
  if (this.status === 'Accepted') {
    throw new Error('Cannot withdraw accepted bid');
  }

  this.status = 'Withdrawn';
  
  // Calculate reputation penalty
  let reputationPenalty = -2; // Base penalty
  
  // Higher penalty for high-value bids
  if (this.amount > 1000000) {
    reputationPenalty = -10; // Significant impact on client
  } else if (this.amount > 500000) {
    reputationPenalty = -5; // Moderate impact
  }
  
  // Apply penalty to company reputation
  const Company = mongoose.model('Company');
  await Company.findByIdAndUpdate(
    this.company,
    { $inc: { reputation: reputationPenalty } },
    { runValidators: true }
  );
  
  await this.save();
};

/**
 * Instance method: acceptCounterOffer
 * Accept client counter-offer
 */
ContractBidSchema.methods.acceptCounterOffer = async function (this: IContractBid): Promise<void> {
  if (!this.counterOfferReceived) {
    throw new Error('No counter-offer to accept');
  }

  if (new Date() > this.counterOfferReceived.expiresAt) {
    throw new Error('Counter-offer has expired');
  }

  this.counterOfferReceived.acceptedByBidder = true;
  this.amount = this.counterOfferReceived.newAmount;
  
  if (this.counterOfferReceived.newTimeline) {
    this.proposedTimeline = this.counterOfferReceived.newTimeline;
  }

  await this.save();
};

/**
 * Static method: generateNPCBid
 * Generate NPC competitor bid based on personality
 * 
 * @param {Types.ObjectId} contractId - Contract to bid on
 * @param {NPCPersonality} personality - NPC bidding personality
 * @returns {Promise<IContractBid>} Generated NPC bid
 */
ContractBidSchema.statics.generateNPCBid = async function (
  this: IContractBidModel,
  contractId: Types.ObjectId,
  personality: NPCPersonality
): Promise<IContractBid> {
  const Contract = mongoose.model('Contract');
  const contract = await Contract.findById(contractId);
  
  if (!contract) {
    throw new Error('Contract not found');
  }

  // Personality-based bidding parameters
  const params = {
    Aggressive: {
      marginTarget: 15,           // Low margin
      discountPercentage: 20,     // High discount
      timelineFactor: 0.85,       // 15% faster
      qualityCommitment: 75,      // Standard quality
      confidenceLevel: 90,        // High confidence
    },
    Conservative: {
      marginTarget: 35,           // High margin
      discountPercentage: 5,      // Low discount
      timelineFactor: 1.1,        // 10% slower
      qualityCommitment: 95,      // Premium quality
      confidenceLevel: 60,        // Lower confidence
    },
    Strategic: {
      marginTarget: 25,           // Balanced margin
      discountPercentage: 10,     // Moderate discount
      timelineFactor: 0.95,       // 5% faster
      qualityCommitment: 85,      // High quality
      confidenceLevel: 75,        // Moderate confidence
    },
    Balanced: {
      marginTarget: 20,           // Standard margin
      discountPercentage: 10,     // Standard discount
      timelineFactor: 1.0,        // On time
      qualityCommitment: 80,      // Good quality
      confidenceLevel: 70,        // Moderate confidence
    },
  };

  const config = params[personality];

  // Calculate bid amount
  const targetCost = contract.value * ((100 - config.marginTarget) / 100);
  const bidAmount = Math.round(contract.maximumBid * ((100 - config.discountPercentage) / 100));

  // Calculate proposed timeline
  const proposedTimeline = Math.round(contract.duration * config.timelineFactor);

  // Generate or retrieve NPC company for this contract
  // In production: Check if NPC company exists for this industry, create if needed
  const Company = mongoose.model('Company');
  
  // Create standardized NPC company name based on personality
  const npcCompanyName = `${personality} Competitor ${Date.now().toString(36).slice(-4).toUpperCase()}`;
  
  // Create NPC company (will be used for bid tracking)
  const npcCompany = await Company.findOneAndUpdate(
    { 
      name: npcCompanyName,
      isNPC: true,
    },
    {
      $setOnInsert: {
        name: npcCompanyName,
        industry: contract.industry,
        isNPC: true,
        level: Math.min(5, Math.max(1, Math.floor(contract.value / 1000000) + 1)),
        cash: 1000000, // NPC companies have capital
        reputation: personality === 'Conservative' ? 75 : personality === 'Strategic' ? 65 : 50,
        employees: contract.minimumEmployees + Math.floor(Math.random() * 10),
        createdAt: new Date(),
      },
    },
    { upsert: true, new: true, runValidators: true }
  );
  
  const npcCompanyId = npcCompany._id;

  // Generate bid
  const bid = await this.create({
    contract: contractId,
    company: npcCompanyId,
    isNPC: true,
    npcPersonality: personality,
    amount: bidAmount,
    proposedTimeline,
    qualityCommitment: config.qualityCommitment,
    resourceAllocation: {
      employeeCount: contract.minimumEmployees + Math.floor(Math.random() * 5),
      skillBreakdown: contract.requiredSkills,
      certificationsCovered: contract.requiredCertifications,
    },
    priceStrategy: personality === 'Aggressive' ? 'Aggressive' : 'Competitive',
    marginTarget: config.marginTarget,
    discountPercentage: config.discountPercentage,
    confidenceLevel: config.confidenceLevel,
    estimatedCost: targetCost,
    estimatedProfit: bidAmount - targetCost,
    estimatedMargin: config.marginTarget,
    marketPosition: personality === 'Aggressive' ? 'Challenger' : 'Follower',
    strategicValue: Math.floor(Math.random() * 40) + 60, // 60-100
  });

  return bid;
};

/**
 * Static method: rankBids
 * Rank all bids for a contract by score
 * 
 * @param {Types.ObjectId} contractId - Contract ID
 * @returns {Promise<IContractBid[]>} Ranked bids (highest score first)
 */
ContractBidSchema.statics.rankBids = async function (
  this: IContractBidModel,
  contractId: Types.ObjectId
): Promise<IContractBid[]> {
  const bids = await this.find({ 
    contract: contractId,
    status: { $in: ['Submitted', 'UnderReview'] }
  }).sort({ score: -1 });

  // Update ranks
  for (let i = 0; i < bids.length; i++) {
    bids[i].overallRank = i + 1;
    await bids[i].save();
  }

  return bids;
};

/**
 * Static method: findWinningBid
 * Get accepted bid for contract
 * 
 * @param {Types.ObjectId} contractId - Contract ID
 * @returns {Promise<IContractBid | null>} Winning bid or null
 */
ContractBidSchema.statics.findWinningBid = async function (
  this: IContractBidModel,
  contractId: Types.ObjectId
): Promise<IContractBid | null> {
  return this.findOne({
    contract: contractId,
    status: 'Accepted',
  });
};

/**
 * Pre-save hook: Calculate estimated metrics
 */
ContractBidSchema.pre<IContractBid>('save', function (next) {
  // Calculate estimated profit and margin
  if (this.estimatedCost > 0) {
    this.estimatedProfit = this.amount - this.estimatedCost;
    this.estimatedMargin = (this.estimatedProfit / this.amount) * 100;
  }

  next();
});

/**
 * Contract bid model
 * 
 * @example
 * ```typescript
 * import ContractBid from '@/lib/db/models/ContractBid';
 * 
 * // Submit player bid
 * const bid = await ContractBid.create({
 *   contract: contractId,
 *   company: companyId,
 *   submittedBy: userId,
 *   amount: 3750000,
 *   proposedTimeline: 320,
 *   qualityCommitment: 92,
 *   resourceAllocation: {
 *     employeeCount: 15,
 *     skillBreakdown: { technical: 85, leadership: 75, compliance: 80 },
 *     certificationsCovered: ['PMP', 'CISSP']
 *   },
 *   technicalApproach: 'DevSecOps with continuous integration',
 *   priceStrategy: 'Competitive',
 *   marginTarget: 22
 * });
 * 
 * // Calculate score
 * await bid.calculateScore(contract, company);
 * 
 * // Generate NPC competitors
 * await ContractBid.generateNPCBid(contractId, 'Aggressive');
 * await ContractBid.generateNPCBid(contractId, 'Conservative');
 * await ContractBid.generateNPCBid(contractId, 'Strategic');
 * 
 * // Rank all bids
 * const rankedBids = await ContractBid.rankBids(contractId);
 * console.log(`Your bid rank: ${bid.overallRank} of ${rankedBids.length}`);
 * ```
 */
const ContractBid: IContractBidModel =
  (mongoose.models.ContractBid as IContractBidModel) ||
  mongoose.model<IContractBid, IContractBidModel>('ContractBid', ContractBidSchema);

export default ContractBid;
