/**
 * @file src/lib/db/models/Contract.ts
 * @description Contract Mongoose schema for contract management system
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Comprehensive contract system with 5 contract types, NPC competitive bidding,
 * skill-based auto-progression, quality scoring (1-100), reputation impact, and
 * penalty/bonus mechanics. Contracts represent business opportunities that companies
 * can bid on and fulfill using their employees. Success depends on employee skills,
 * timeline management, and execution quality.
 * 
 * CONTRACT TYPES:
 * 1. Government: High value, slow payment, reputation boost (construction, defense, infrastructure)
 * 2. Private: Moderate value, reliable payment (corporate consulting, B2B services)
 * 3. Retail: Low value, fast payment, high volume (consumer products, retail services)
 * 4. LongTerm: Multi-milestone, recurring revenue (ongoing support, subscriptions)
 * 5. ProjectBased: One-time, performance bonuses (product launches, campaigns)
 * 
 * SCHEMA FIELDS:
 * Contract Identity:
 * - title: Contract name (required, 5-100 chars)
 * - description: Contract details and requirements
 * - type: Contract category (Government, Private, Retail, LongTerm, ProjectBased)
 * - industry: Target industry (Construction, Technology, Healthcare, etc.)
 * - client: Client company/organization name
 * - location: Contract execution location (state, city)
 * 
 * Financial Terms:
 * - value: Total contract value ($10,000 - $10,000,000)
 * - upfrontPayment: Initial payment percentage (0-50%)
 * - milestonePayments: Payment schedule per milestone
 * - retentionPercentage: Held until completion (0-20%)
 * - penaltyRate: Late delivery penalty percentage (5-30%)
 * - bonusRate: Early completion bonus percentage (0-15%)
 * 
 * Timeline & Milestones:
 * - startDate: Contract start date
 * - deadline: Contract completion deadline
 * - duration: Total duration in days
 * - milestones: Array of project milestones
 *   - name: Milestone title
 *   - description: Milestone requirements
 *   - deadline: Milestone due date
 *   - paymentPercentage: % of total value paid on completion
 *   - completed: Completion status
 *   - completedDate: Actual completion date
 *   - qualityScore: Milestone quality (1-100)
 * - currentMilestone: Index of active milestone (0-based)
 * - completionPercentage: Overall progress (0-100%)
 * 
 * Requirements & Skills:
 * - requiredSkills: Skill requirements (e.g., { technical: 70, leadership: 50 })
 * - minimumEmployees: Required team size (1-50)
 * - requiredCertifications: Employee certifications needed
 * - complexityScore: Overall difficulty (1-100)
 * - riskLevel: Contract risk level (Low, Medium, High, Critical)
 * 
 * Bidding & Award:
 * - status: Contract state (Available, Bidding, Awarded, InProgress, Completed, Failed, Cancelled)
 * - biddingDeadline: Last day to submit bids
 * - minimumBid: Lowest acceptable bid amount
 * - maximumBid: Highest reasonable bid amount
 * - winningBid: Accepted bid reference
 * - totalBids: Count of submitted bids
 * - awardedTo: Company that won contract
 * - awardedAt: Contract award timestamp
 * 
 * Execution & Performance:
 * - assignedEmployees: Employee IDs working on contract
 * - actualStartDate: When work actually began
 * - actualCompletionDate: When work actually finished
 * - completionStatus: Final outcome (OnTime, Late, Cancelled)
 * - daysOverdue: Days past deadline (negative = early)
 * - totalPenalties: Total penalties incurred
 * - totalBonuses: Total bonuses earned
 * - finalPayment: Actual payment after penalties/bonuses
 * 
 * Quality & Reputation:
 * - qualityScore: Overall quality rating (1-100)
 * - clientSatisfaction: Client feedback score (1-100)
 * - reputationImpact: Change to company reputation (-20 to +20)
 * - reviewText: Client review/feedback
 * - reviewDate: When review was submitted
 * - referenceValue: Likelihood of referrals (1-100)
 * 
 * Competition & Market:
 * - competitorCount: Number of competing companies
 * - marketDemand: Industry demand level (1-100)
 * - renewalOption: Can renew after completion
 * - renewalTerms: Renewal contract terms
 * - exclusivityPeriod: Days of exclusivity (no compete)
 * 
 * USAGE:
 * ```typescript
 * import Contract from '@/lib/db/models/Contract';
 * import ContractBid from '@/lib/db/models/ContractBid';
 * 
 * // Create contract opportunity
 * const contract = await Contract.create({
 *   title: 'Highway Bridge Construction Project',
 *   description: 'Build 2-mile bridge connecting counties',
 *   type: 'Government',
 *   industry: 'Construction',
 *   client: 'Department of Transportation',
 *   value: 5000000,
 *   duration: 365,
 *   requiredSkills: { operations: 75, leadership: 65, compliance: 70 },
 *   minimumEmployees: 15,
 *   milestones: [
 *     { name: 'Foundation', paymentPercentage: 30, deadline: new Date('2026-03-01') },
 *     { name: 'Structure', paymentPercentage: 50, deadline: new Date('2026-09-01') },
 *     { name: 'Completion', paymentPercentage: 20, deadline: new Date('2026-11-13') }
 *   ]
 * });
 * 
 * // Submit bid
 * const bid = await ContractBid.create({
 *   contract: contract._id,
 *   company: companyId,
 *   amount: 4750000,
 *   proposedTimeline: 350,
 *   qualityCommitment: 95
 * });
 * 
 * // Award contract
 * await contract.updateOne({
 *   status: 'Awarded',
 *   awardedTo: companyId,
 *   winningBid: bid._id,
 *   awardedAt: new Date()
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Auto-progression: Employee skills → completion % calculated automatically
 * - Quality scoring: (Skill match * 0.5) + (Timeline adherence * 0.3) + (Resource allocation * 0.2)
 * - Reputation impact: Quality 90-100 = +15-20, Quality 70-89 = +5-14, Quality 50-69 = -5-5, Quality <50 = -10--20
 * - Late penalties: penaltyRate × daysOverdue × (value / duration)
 * - Early bonuses: bonusRate × daysEarly × (value / duration)
 * - NPC bidding: AI competitors submit bids based on personality (aggressive, conservative, strategic)
 * - Milestone progression: Employees assigned → auto-calculate completion rate → update milestone %
 * - Market dynamics: High demand → more contracts, higher values, more competition
 * - Contract types affect payment terms, timeline flexibility, and reputation impact
 * - Failed contracts: Heavy reputation penalty, potential legal costs, blacklist risk
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Contract types
 */
export type ContractType =
  | 'Government'      // High value, slow payment, reputation boost
  | 'Private'         // Moderate value, reliable payment
  | 'Retail'          // Low value, fast payment, high volume
  | 'LongTerm'        // Multi-milestone, recurring revenue
  | 'ProjectBased';   // One-time, performance bonuses

/**
 * Contract tier levels (aligned with company levels)
 */
export type ContractTier =
  | 'Local'           // Level 1: $10k-$100k contracts
  | 'Regional'        // Level 2: $100k-$500k contracts
  | 'State'           // Level 3: $500k-$2M contracts
  | 'National'        // Level 4: $2M-$10M contracts
  | 'Global';         // Level 5: $10M+ contracts

/**
 * Contract status states
 */
export type ContractStatus =
  | 'Available'       // Open for bidding
  | 'Bidding'         // Bids being accepted
  | 'Awarded'         // Winner selected, not started yet
  | 'InProgress'      // Work in progress
  | 'Completed'       // Successfully completed
  | 'Failed'          // Failed to complete
  | 'Cancelled';      // Cancelled by client

/**
 * Risk levels
 */
export type RiskLevel =
  | 'Low'             // Minimal risk, straightforward
  | 'Medium'          // Moderate risk, some challenges
  | 'High'            // High risk, significant challenges
  | 'Critical';       // Critical risk, major challenges

/**
 * Completion status
 */
export type CompletionStatus =
  | 'OnTime'          // Completed on/before deadline
  | 'Late'            // Completed after deadline
  | 'Cancelled';      // Did not complete

/**
 * Contract milestone interface
 */
export interface Milestone {
  name: string;
  description?: string;
  deadline: Date;
  paymentPercentage: number;      // % of total value (0-100)
  completed: boolean;
  completedDate?: Date;
  qualityScore?: number;           // 1-100
  assignedEmployees?: Types.ObjectId[];
  progressPercentage: number;      // 0-100%
}

/**
 * Skill requirements map
 */
export interface SkillRequirements {
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
}

/**
 * Renewal terms interface
 */
export interface RenewalTerms {
  enabled: boolean;
  valueDelta: number;              // % change in value (-50 to +50)
  durationDelta: number;           // Days change in duration
  minimumQualityRequired: number;  // Quality score needed to renew (0-100)
  autoRenewIfQualityAbove?: number; // Auto-renew if quality exceeds threshold
}

/**
 * Contract document interface
 * 
 * @interface IContract
 * @extends {Document}
 */
export interface IContract extends Document {
  // Contract Identity
  title: string;
  description: string;
  type: ContractType;
  tier: ContractTier;
  industry: string;
  client: string;
  location?: string;

  // Financial Terms
  value: number;
  upfrontPayment: number;          // Percentage (0-50)
  milestonePayments: boolean;      // Pay per milestone vs lump sum
  retentionPercentage: number;     // Held until completion (0-20)
  penaltyRate: number;             // Late penalty % per day (5-30)
  bonusRate: number;               // Early bonus % per day (0-15)

  // Timeline & Milestones
  startDate: Date;
  deadline: Date;
  duration: number;                // Days
  milestones: Milestone[];
  currentMilestone: number;        // Index (0-based)
  completionPercentage: number;    // 0-100%

  // Requirements & Skills
  requiredSkills: SkillRequirements;
  minimumEmployees: number;
  requiredCertifications: string[];
  complexityScore: number;         // 1-100
  riskLevel: RiskLevel;

  // Bidding & Award
  status: ContractStatus;
  biddingDeadline: Date;
  minimumBid: number;
  maximumBid: number;
  winningBid?: Types.ObjectId;
  totalBids: number;
  awardedTo?: Types.ObjectId;
  awardedAt?: Date;

  // Execution & Performance
  assignedEmployees: Types.ObjectId[];
  actualStartDate?: Date;
  actualCompletionDate?: Date;
  completionStatus?: CompletionStatus;
  daysOverdue: number;             // Negative = early
  totalPenalties: number;
  totalBonuses: number;
  finalPayment: number;

  // Quality & Reputation
  qualityScore: number;            // 1-100
  clientSatisfaction: number;      // 1-100
  reputationImpact: number;        // -20 to +20
  reviewText?: string;
  reviewDate?: Date;
  referenceValue: number;          // 1-100

  // Competition & Market
  competitorCount: number;
  marketDemand: number;            // 1-100
  renewalOption: boolean;
  renewalTerms?: RenewalTerms;
  exclusivityPeriod: number;       // Days

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  isActive: boolean;
  daysRemaining: number;
  expectedCompletion: Date;
  profitMargin: number;

  // Instance methods
  calculateQualityScore(): number;
  calculateReputationImpact(): number;
  updateMilestoneProgress(milestoneIndex: number, progress: number): Promise<void>;
  completeContract(): Promise<void>;
}

/**
 * Contract schema definition
 */
const ContractSchema = new Schema<IContract>(
  {
    // Contract Identity
    title: {
      type: String,
      required: [true, 'Contract title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      required: [true, 'Contract type is required'],
      enum: {
        values: ['Government', 'Private', 'Retail', 'LongTerm', 'ProjectBased'],
        message: '{VALUE} is not a valid contract type',
      },
      index: true,
    },
    tier: {
      type: String,
      required: [true, 'Contract tier is required'],
      enum: {
        values: ['Local', 'Regional', 'State', 'National', 'Global'],
        message: '{VALUE} is not a valid contract tier',
      },
      index: true,
      default: 'Local',
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      trim: true,
      index: true,
    },
    client: {
      type: String,
      required: [true, 'Client is required'],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: null,
    },

    // Financial Terms
    value: {
      type: Number,
      required: [true, 'Contract value is required'],
      min: [10000, 'Value must be at least $10,000'],
      max: [10000000, 'Value cannot exceed $10,000,000'],
    },
    upfrontPayment: {
      type: Number,
      required: true,
      default: 20, // 20% upfront
      min: [0, 'Upfront payment cannot be negative'],
      max: [50, 'Upfront payment cannot exceed 50%'],
    },
    milestonePayments: {
      type: Boolean,
      required: true,
      default: true,
    },
    retentionPercentage: {
      type: Number,
      required: true,
      default: 10, // Hold 10% until completion
      min: [0, 'Retention cannot be negative'],
      max: [20, 'Retention cannot exceed 20%'],
    },
    penaltyRate: {
      type: Number,
      required: true,
      default: 10, // 10% penalty per day late
      min: [5, 'Penalty rate must be at least 5%'],
      max: [30, 'Penalty rate cannot exceed 30%'],
    },
    bonusRate: {
      type: Number,
      required: true,
      default: 5, // 5% bonus per day early
      min: [0, 'Bonus rate cannot be negative'],
      max: [15, 'Bonus rate cannot exceed 15%'],
    },

    // Timeline & Milestones
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
      validate: {
        validator: function (this: IContract, value: Date): boolean {
          return value > this.startDate;
        },
        message: 'Deadline must be after start date',
      },
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 day'],
      max: [3650, 'Duration cannot exceed 10 years'],
    },
    milestones: {
      type: [
        {
          name: { type: String, required: true },
          description: String,
          deadline: { type: Date, required: true },
          paymentPercentage: { 
            type: Number, 
            required: true,
            min: [0, 'Payment percentage cannot be negative'],
            max: [100, 'Payment percentage cannot exceed 100']
          },
          completed: { type: Boolean, default: false },
          completedDate: Date,
          qualityScore: { type: Number, min: 1, max: 100 },
          assignedEmployees: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
          progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
        },
      ],
      default: [],
      validate: {
        validator: function (milestones: Milestone[]): boolean {
          // Ensure milestone payments sum to 100%
          const totalPayment = milestones.reduce((sum, m) => sum + m.paymentPercentage, 0);
          return Math.abs(totalPayment - 100) < 0.01; // Allow for floating point errors
        },
        message: 'Milestone payments must sum to 100%',
      },
    },
    currentMilestone: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Current milestone cannot be negative'],
    },
    completionPercentage: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Completion cannot be negative'],
      max: [100, 'Completion cannot exceed 100%'],
    },

    // Requirements & Skills
    requiredSkills: {
      type: {
        technical: Number,
        sales: Number,
        leadership: Number,
        finance: Number,
        marketing: Number,
        operations: Number,
        research: Number,
        compliance: Number,
        communication: Number,
        creativity: Number,
        analytical: Number,
        customerService: Number,
      },
      required: [true, 'Required skills are required'],
      default: {},
    },
    minimumEmployees: {
      type: Number,
      required: [true, 'Minimum employees is required'],
      min: [1, 'Must require at least 1 employee'],
      max: [50, 'Cannot require more than 50 employees'],
      default: 3,
    },
    requiredCertifications: {
      type: [String],
      default: [],
    },
    complexityScore: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Complexity must be at least 1'],
      max: [100, 'Complexity cannot exceed 100'],
    },
    riskLevel: {
      type: String,
      required: true,
      enum: {
        values: ['Low', 'Medium', 'High', 'Critical'],
        message: '{VALUE} is not a valid risk level',
      },
      default: 'Medium',
    },

    // Bidding & Award
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['Available', 'Bidding', 'Awarded', 'InProgress', 'Completed', 'Failed', 'Cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Available',
      index: true,
    },
    biddingDeadline: {
      type: Date,
      required: [true, 'Bidding deadline is required'],
    },
    minimumBid: {
      type: Number,
      required: [true, 'Minimum bid is required'],
      min: [1000, 'Minimum bid must be at least $1,000'],
    },
    maximumBid: {
      type: Number,
      required: [true, 'Maximum bid is required'],
      validate: {
        validator: function (this: IContract, value: number): boolean {
          return value > this.minimumBid;
        },
        message: 'Maximum bid must be greater than minimum bid',
      },
    },
    winningBid: {
      type: Schema.Types.ObjectId,
      ref: 'ContractBid',
      default: null,
    },
    totalBids: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total bids cannot be negative'],
    },
    awardedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
    },
    awardedAt: {
      type: Date,
      default: null,
    },

    // Execution & Performance
    assignedEmployees: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
      default: [],
    },
    actualStartDate: {
      type: Date,
      default: null,
    },
    actualCompletionDate: {
      type: Date,
      default: null,
    },
    completionStatus: {
      type: String,
      enum: {
        values: ['OnTime', 'Late', 'Cancelled'],
        message: '{VALUE} is not a valid completion status',
      },
      default: null,
    },
    daysOverdue: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPenalties: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Penalties cannot be negative'],
    },
    totalBonuses: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Bonuses cannot be negative'],
    },
    finalPayment: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Final payment cannot be negative'],
    },

    // Quality & Reputation
    qualityScore: {
      type: Number,
      required: true,
      default: 75, // Assume average quality initially
      min: [1, 'Quality score must be at least 1'],
      max: [100, 'Quality score cannot exceed 100'],
    },
    clientSatisfaction: {
      type: Number,
      required: true,
      default: 75,
      min: [1, 'Client satisfaction must be at least 1'],
      max: [100, 'Client satisfaction cannot exceed 100'],
    },
    reputationImpact: {
      type: Number,
      required: true,
      default: 0,
      min: [-20, 'Reputation impact cannot be below -20'],
      max: [20, 'Reputation impact cannot exceed 20'],
    },
    reviewText: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
      default: null,
    },
    reviewDate: {
      type: Date,
      default: null,
    },
    referenceValue: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Reference value must be at least 1'],
      max: [100, 'Reference value cannot exceed 100'],
    },

    // Competition & Market
    competitorCount: {
      type: Number,
      required: true,
      default: 5, // Assume moderate competition
      min: [0, 'Competitor count cannot be negative'],
      max: [20, 'Competitor count cannot exceed 20'],
    },
    marketDemand: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Market demand must be at least 1'],
      max: [100, 'Market demand cannot exceed 100'],
    },
    renewalOption: {
      type: Boolean,
      required: true,
      default: false,
    },
    renewalTerms: {
      type: {
        enabled: { type: Boolean, default: true },
        valueDelta: { type: Number, min: -50, max: 50, default: 0 },
        durationDelta: { type: Number, default: 0 },
        minimumQualityRequired: { type: Number, min: 0, max: 100, default: 70 },
        autoRenewIfQualityAbove: { type: Number, min: 0, max: 100 },
      },
      default: null,
    },
    exclusivityPeriod: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Exclusivity period cannot be negative'],
      max: [365, 'Exclusivity period cannot exceed 1 year'],
    },
  },
  {
    timestamps: true,
    collection: 'contracts',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
ContractSchema.index({ status: 1, biddingDeadline: 1 });
ContractSchema.index({ type: 1, industry: 1, status: 1 });
ContractSchema.index({ tier: 1, status: 1, value: -1 });
ContractSchema.index({ awardedTo: 1, status: 1 });
ContractSchema.index({ value: -1, marketDemand: -1 });

/**
 * Virtual field: isActive
 * True if contract is in progress or awarded
 */
ContractSchema.virtual('isActive').get(function (this: IContract): boolean {
  return this.status === 'InProgress' || this.status === 'Awarded';
});

/**
 * Virtual field: daysRemaining
 * Days until deadline (negative if overdue)
 */
ContractSchema.virtual('daysRemaining').get(function (this: IContract): number {
  const now = new Date();
  const deadline = new Date(this.deadline);
  const msRemaining = deadline.getTime() - now.getTime();
  return Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
});

/**
 * Virtual field: expectedCompletion
 * Estimated completion date based on current progress
 */
ContractSchema.virtual('expectedCompletion').get(function (this: IContract): Date {
  if (this.completionPercentage === 0) {
    return this.deadline;
  }
  
  const elapsed = this.actualStartDate 
    ? Date.now() - this.actualStartDate.getTime()
    : 0;
  
  const totalTime = (elapsed / this.completionPercentage) * 100;
  const remaining = totalTime - elapsed;
  
  return new Date(Date.now() + remaining);
});

/**
 * Virtual field: profitMargin
 * Expected profit as percentage of value
 */
ContractSchema.virtual('profitMargin').get(function (this: IContract): number {
  // Simplified: Assume 30% base margin, adjusted by quality and penalties/bonuses
  const basemargin = 30;
  const qualityAdjustment = (this.qualityScore - 75) * 0.2; // ±5% max
  const penaltyAdjustment = -(this.totalPenalties / this.value) * 100;
  const bonusAdjustment = (this.totalBonuses / this.value) * 100;
  
  return Math.max(0, basemargin + qualityAdjustment + penaltyAdjustment + bonusAdjustment);
});

/**
 * Instance method: calculateQualityScore
 * Calculate quality score based on skill match, timeline, and execution
 * 
 * @returns {number} Quality score (1-100)
 */
ContractSchema.methods.calculateQualityScore = function (this: IContract): number {
  // Quality = (Skill match * 0.5) + (Timeline adherence * 0.3) + (Resource allocation * 0.2)
  
  // Skill match component - calculate from assigned employees vs required skills
  // NOTE: In production, this requires employee population. For now, estimate from employee count.
  // Complete implementation would: await this.populate('assignedEmployees') then calculate actual skill averages
  let skillMatch = 75; // Default baseline
  
  if (this.assignedEmployees.length > 0) {
    // Estimate skill match based on resource allocation
    // More employees assigned relative to minimum = likely better skill coverage
    const employeeRatio = Math.min(2, this.assignedEmployees.length / this.minimumEmployees);
    skillMatch = Math.round(50 + (employeeRatio * 25)); // 50-100 range
    
    // For populated employees, calculate actual skill match:
    // const employeeSkills = this.assignedEmployees.map(emp => emp.skills);
    // const requiredSkillKeys = Object.keys(this.requiredSkills);
    // const matchScores = requiredSkillKeys.map(skill => {
    //   const avgEmployeeSkill = employeeSkills.reduce((sum, empSkills) => 
    //     sum + (empSkills[skill] || 0), 0) / employeeSkills.length;
    //   const required = this.requiredSkills[skill] || 0;
    //   return Math.min(100, (avgEmployeeSkill / required) * 100);
    // });
    // skillMatch = matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length;
  }
  
  // Timeline adherence
  const timelineScore = this.daysOverdue <= 0 
    ? 100 // On time or early
    : Math.max(0, 100 - (Math.abs(this.daysOverdue) * 5)); // -5 points per day late
  
  // Resource allocation (employee count vs minimum required)
  const resourceScore = this.assignedEmployees.length >= this.minimumEmployees
    ? 100
    : (this.assignedEmployees.length / this.minimumEmployees) * 100;
  
  const quality = (skillMatch * 0.5) + (timelineScore * 0.3) + (resourceScore * 0.2);
  
  return Math.round(Math.max(1, Math.min(100, quality)));
};

/**
 * Instance method: calculateReputationImpact
 * Calculate reputation change based on quality and completion status
 * 
 * @returns {number} Reputation impact (-20 to +20)
 */
ContractSchema.methods.calculateReputationImpact = function (this: IContract): number {
  const quality = this.qualityScore;
  
  // Failed contracts
  if (this.status === 'Failed' || this.status === 'Cancelled') {
    return -15; // Heavy penalty
  }
  
  // Quality-based impact
  if (quality >= 90) return 20;      // Exceptional: +20
  if (quality >= 80) return 15;      // Excellent: +15
  if (quality >= 70) return 10;      // Good: +10
  if (quality >= 60) return 5;       // Average: +5
  if (quality >= 50) return 0;       // Mediocre: 0
  if (quality >= 40) return -5;      // Poor: -5
  if (quality >= 30) return -10;     // Bad: -10
  return -15;                         // Terrible: -15
};

/**
 * Instance method: updateMilestoneProgress
 * Update progress for specific milestone
 * 
 * @param {number} milestoneIndex - Index of milestone (0-based)
 * @param {number} progress - Progress percentage (0-100)
 */
ContractSchema.methods.updateMilestoneProgress = async function (
  this: IContract,
  milestoneIndex: number,
  progress: number
): Promise<void> {
  if (milestoneIndex < 0 || milestoneIndex >= this.milestones.length) {
    throw new Error('Invalid milestone index');
  }
  
  this.milestones[milestoneIndex].progressPercentage = Math.max(0, Math.min(100, progress));
  
  // If milestone is 100%, mark as completed
  if (this.milestones[milestoneIndex].progressPercentage === 100 && !this.milestones[milestoneIndex].completed) {
    this.milestones[milestoneIndex].completed = true;
    this.milestones[milestoneIndex].completedDate = new Date();
    this.milestones[milestoneIndex].qualityScore = this.calculateQualityScore();
    
    // Move to next milestone
    if (milestoneIndex === this.currentMilestone) {
      this.currentMilestone = Math.min(milestoneIndex + 1, this.milestones.length - 1);
    }
  }
  
  // Update overall completion percentage
  const completedMilestones = this.milestones.filter(m => m.completed).length;
  this.completionPercentage = (completedMilestones / this.milestones.length) * 100;
  
  await this.save();
};

/**
 * Instance method: completeContract
 * Mark contract as completed and calculate final metrics
 */
ContractSchema.methods.completeContract = async function (this: IContract): Promise<void> {
  this.status = 'Completed';
  this.actualCompletionDate = new Date();
  
  // Calculate days overdue
  const deadline = new Date(this.deadline);
  const completed = this.actualCompletionDate;
  const msOverdue = completed.getTime() - deadline.getTime();
  this.daysOverdue = Math.ceil(msOverdue / (1000 * 60 * 60 * 24));
  
  // Determine completion status
  this.completionStatus = this.daysOverdue <= 0 ? 'OnTime' : 'Late';
  
  // Calculate penalties/bonuses
  if (this.daysOverdue > 0) {
    // Late penalty
    const dailyPenalty = (this.value * (this.penaltyRate / 100)) / this.duration;
    this.totalPenalties = dailyPenalty * this.daysOverdue;
  } else if (this.daysOverdue < 0) {
    // Early bonus
    const daysEarly = Math.abs(this.daysOverdue);
    const dailyBonus = (this.value * (this.bonusRate / 100)) / this.duration;
    this.totalBonuses = dailyBonus * daysEarly;
  }
  
  // Calculate final payment (retention amount calculated elsewhere)
  this.finalPayment = this.value - this.totalPenalties + this.totalBonuses;
  
  // Calculate quality score
  this.qualityScore = this.calculateQualityScore();
  
  // Calculate reputation impact
  this.reputationImpact = this.calculateReputationImpact();
  
  // Calculate client satisfaction
  this.clientSatisfaction = Math.max(1, Math.min(100, 
    this.qualityScore - (this.daysOverdue > 0 ? this.daysOverdue * 2 : 0)
  ));
  
  // Calculate reference value
  this.referenceValue = Math.max(1, Math.min(100,
    (this.qualityScore * 0.6) + (this.clientSatisfaction * 0.4)
  ));
  
  await this.save();
};

/**
 * Contract model
 * 
 * @example
 * ```typescript
 * import Contract from '@/lib/db/models/Contract';
 * 
 * // Create government contract
 * const contract = await Contract.create({
 *   title: 'Federal IT Infrastructure Modernization',
 *   description: 'Modernize legacy systems for government agency',
 *   type: 'Government',
 *   industry: 'Technology',
 *   client: 'Department of Defense',
 *   value: 2500000,
 *   startDate: new Date('2026-01-01'),
 *   deadline: new Date('2026-12-31'),
 *   duration: 365,
 *   requiredSkills: { technical: 80, compliance: 75, leadership: 65 },
 *   minimumEmployees: 10,
 *   milestones: [
 *     { name: 'Phase 1: Assessment', paymentPercentage: 20, deadline: new Date('2026-03-31') },
 *     { name: 'Phase 2: Development', paymentPercentage: 50, deadline: new Date('2026-09-30') },
 *     { name: 'Phase 3: Deployment', paymentPercentage: 30, deadline: new Date('2026-12-31') }
 *   ],
 *   minimumBid: 2000000,
 *   maximumBid: 3000000,
 *   biddingDeadline: new Date('2025-12-15')
 * });
 * 
 * // Update milestone progress
 * await contract.updateMilestoneProgress(0, 75); // 75% complete on first milestone
 * 
 * // Complete contract
 * await contract.completeContract();
 * ```
 */
const Contract: Model<IContract> =
  mongoose.models.Contract || mongoose.model<IContract>('Contract', ContractSchema);

export default Contract;
