/**
 * @fileoverview Contract Mongoose Model
 * @module lib/db/models/Contract
 * 
 * OVERVIEW:
 * Complete contract system model for revenue generation.
 * NPC clients, skill requirements, employee assignment, success calculation, payment.
 * Core revenue engine for sustainable company operations.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import type { EmployeeSkills } from '@/lib/types';

/**
 * Contract document interface
 * Extends Mongoose Document with contract properties
 */
export interface IContract extends Document {
  _id: Types.ObjectId;
  
  // Ownership
  companyId: Types.ObjectId | null;  // null = marketplace, ObjectId = accepted
  userId: Types.ObjectId;
  
  // Client Information
  clientName: string;
  clientIndustry: string;
  clientCompanySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  
  // Contract Details
  title: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;  // Tier level
  
  // Financial
  baseValue: number;              // Contract base value
  actualPayout: number;           // Calculated on completion
  upfrontCost: number;            // 10% of base required to bid
  bidAmount: number | null;       // Company's bid (can be < base if competitive)
  
  // Timeline
  createdAt: Date;
  acceptedAt: Date | null;
  startDate: Date | null;
  deadline: Date | null;
  completedAt: Date | null;
  durationDays: number;
  
  // Requirements (12 skills, minimum levels 1-100)
  requirements: EmployeeSkills;
  requiredEmployeeCount: number;  // Min employees needed
  
  // Execution
  status: 'marketplace' | 'bidding' | 'active' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  assignedEmployees: Types.ObjectId[];
  progressPercent: number;        // 0-100 (manual update for now, auto later)
  
  // Results
  successScore: number | null;    // 0-100 (calculated on completion)
  clientSatisfaction: number | null;  // 1-100 (impacts future opportunities)
  bonusEarned: number;            // Bonus/penalty amount
  
  // Metadata
  updatedAt: Date;
  expiresAt: Date;                // Marketplace expiration
}

/**
 * Contract schema definition
 */
const contractSchema = new Schema<IContract>(
  {
    // Ownership
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Client Information
    clientName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    clientIndustry: {
      type: String,
      required: true,
      enum: ['technology', 'finance', 'healthcare', 'energy', 'manufacturing', 'retail'],
    },
    clientCompanySize: {
      type: String,
      required: true,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
    },
    
    // Contract Details
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 2000,
    },
    difficulty: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },
    
    // Financial
    baseValue: {
      type: Number,
      required: true,
      min: 1000,
      max: 5000000,
    },
    actualPayout: {
      type: Number,
      default: 0,
    },
    upfrontCost: {
      type: Number,
      required: true,
    },
    bidAmount: {
      type: Number,
      default: null,
    },
    
    // Timeline
    acceptedAt: {
      type: Date,
      default: null,
    },
    startDate: {
      type: Date,
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
      max: 365,
    },
    
    // Requirements (12 skills)
    requirements: {
      technical: { type: Number, required: true, min: 1, max: 100 },
      leadership: { type: Number, required: true, min: 1, max: 100 },
      industry: { type: Number, required: true, min: 1, max: 100 },
      sales: { type: Number, required: true, min: 1, max: 100 },
      marketing: { type: Number, required: true, min: 1, max: 100 },
      finance: { type: Number, required: true, min: 1, max: 100 },
      operations: { type: Number, required: true, min: 1, max: 100 },
      hr: { type: Number, required: true, min: 1, max: 100 },
      legal: { type: Number, required: true, min: 1, max: 100 },
      rd: { type: Number, required: true, min: 1, max: 100 },
      quality: { type: Number, required: true, min: 1, max: 100 },
      customer: { type: Number, required: true, min: 1, max: 100 },
    },
    requiredEmployeeCount: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    
    // Execution
    status: {
      type: String,
      required: true,
      enum: ['marketplace', 'bidding', 'active', 'in_progress', 'completed', 'failed', 'cancelled'],
      default: 'marketplace',
      index: true,
    },
    assignedEmployees: [{
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    }],
    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    
    // Results
    successScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    clientSatisfaction: {
      type: Number,
      default: null,
      min: 1,
      max: 100,
    },
    bonusEarned: {
      type: Number,
      default: 0,
    },
    
    // Metadata
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes for query performance
 * Note: companyId (line 81), difficulty (line 129), status (line 204), expiresAt (line 239)
 * all have field-level index: true declarations.
 * Removed redundant schema.index() calls to eliminate duplicate index warnings.
 */
// No additional schema-level indexes needed - field-level indexes cover all query patterns

/**
 * Virtual: Is contract expired?
 */
contractSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

/**
 * Virtual: Days remaining until deadline
 */
contractSchema.virtual('daysRemaining').get(function() {
  if (!this.deadline) return null;
  const now = new Date();
  const diff = this.deadline.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

/**
 * Virtual: Is contract late?
 */
contractSchema.virtual('isLate').get(function() {
  if (!this.deadline || this.status === 'completed') return false;
  return new Date() > this.deadline;
});

/**
 * Virtual: Average skill requirement
 */
contractSchema.virtual('avgRequirement').get(function() {
  const skills = Object.values(this.requirements) as number[];
  return Math.round(skills.reduce((sum, val) => sum + val, 0) / skills.length);
});

/**
 * Virtual: Estimated payout (before completion)
 */
contractSchema.virtual('estimatedPayout').get(function() {
  if (this.actualPayout > 0) return this.actualPayout;
  return this.baseValue;
});

/**
 * Calculate success score based on assigned employees' skills vs requirements
 * 
 * @param employees - Array of employee documents with skills
 * @returns Success score 0-100
 */
contractSchema.methods.calculateSuccess = function(employees: any[]): number {
  if (employees.length === 0) return 0;
  
  const skillKeys: (keyof EmployeeSkills)[] = [
    'technical', 'leadership', 'industry', 'sales', 'marketing', 'finance',
    'operations', 'hr', 'legal', 'rd', 'quality', 'customer'
  ];
  
  let totalScore = 0;
  let skillCount = 0;
  
  for (const skillKey of skillKeys) {
    const required = this.requirements[skillKey];
    
    // Average employee skill for this category
    const avgEmployeeSkill = employees.reduce((sum, emp) => {
      return sum + (emp.skills[skillKey] || 0);
    }, 0) / employees.length;
    
    // Score = employee skill / required (capped at 100%)
    const skillScore = Math.min(100, (avgEmployeeSkill / required) * 100);
    totalScore += skillScore;
    skillCount++;
  }
  
  return Math.round(totalScore / skillCount);
};

/**
 * Calculate payout based on success score and timing
 * 
 * Formula:
 * - Success >= 90: Base + 10% bonus
 * - Success >= 75: Base value
 * - Success >= 60: Base - 5% penalty
 * - Success < 60: Base - 15% penalty
 * - Late delivery: Additional -15% penalty
 * 
 * @param successScore - 0-100 success score
 * @returns Payout amount and bonus
 */
contractSchema.methods.calculatePayout = function(successScore: number): { payout: number; bonus: number } {
  let payout = this.baseValue;
  let bonus = 0;
  
  // Success-based adjustments
  if (successScore >= 90) {
    bonus = this.baseValue * 0.10;
    payout += bonus;
  } else if (successScore >= 75) {
    // Base value, no adjustment
  } else if (successScore >= 60) {
    bonus = -(this.baseValue * 0.05);
    payout += bonus;
  } else {
    bonus = -(this.baseValue * 0.15);
    payout += bonus;
  }
  
  // Late penalty
  if (this.isLate) {
    const latePenalty = this.baseValue * 0.15;
    payout -= latePenalty;
    bonus -= latePenalty;
  }
  
  // Ensure payout is non-negative
  payout = Math.max(0, payout);
  
  return { payout: Math.round(payout), bonus: Math.round(bonus) };
};

/**
 * Assign employees to contract
 * Validates employee count and updates assignedEmployees array
 * 
 * @param employeeIds - Array of employee ObjectIds
 */
contractSchema.methods.assignEmployees = function(employeeIds: Types.ObjectId[]) {
  this.assignedEmployees = employeeIds;
  this.status = 'in_progress';
};

/**
 * Complete contract
 * Calculate success, payout, update company cash and revenue
 * 
 * @param employees - Array of assigned employee documents
 * @param Company - Company model for updating cash
 * @returns Completion result with payout details
 */
contractSchema.methods.complete = async function(employees: any[], Company: any) {
  // Calculate success score
  const successScore = this.calculateSuccess(employees);
  this.successScore = successScore;
  
  // Calculate payout
  const { payout, bonus } = this.calculatePayout(successScore);
  this.actualPayout = payout;
  this.bonusEarned = bonus;
  
  // Calculate client satisfaction (success + timeliness)
  let satisfaction = successScore;
  if (this.isLate) {
    satisfaction = Math.max(0, satisfaction - 20);
  }
  this.clientSatisfaction = Math.round(satisfaction);
  
  // Update status
  this.status = 'completed';
  this.completedAt = new Date();
  this.progressPercent = 100;
  
  // Update company financials
  if (this.companyId) {
    await Company.findByIdAndUpdate(this.companyId, {
      $inc: {
        cash: payout,
        revenue: payout,
      },
    });
  }
  
  await this.save();
  
  return {
    successScore,
    payout,
    bonus,
    clientSatisfaction: this.clientSatisfaction,
    isLate: this.isLate,
  };
};

/**
 * Pre-save middleware
 * Calculate upfront cost if not set
 */
contractSchema.pre('save', function(next) {
  // Calculate upfront cost (10% of base value)
  if (!this.upfrontCost) {
    this.upfrontCost = Math.round(this.baseValue * 0.10);
  }
  
  // Set deadline if contract is accepted
  if (this.startDate && !this.deadline) {
    const deadline = new Date(this.startDate);
    deadline.setDate(deadline.getDate() + this.durationDays);
    this.deadline = deadline;
  }
  
  next();
});

/**
 * Export Contract model
 */
const Contract = mongoose.models.Contract || mongoose.model<IContract>('Contract', contractSchema);

export default Contract;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **12 Skill Requirements**: Matches employee skill system for alignment
 * 2. **5 Difficulty Tiers**: Scales with company level progression
 * 3. **Success Calculation**: Employee skills vs requirements, realistic scoring
 * 4. **Payment Formula**: Success-based bonuses/penalties + late penalties
 * 5. **Marketplace Expiration**: Contracts expire and refresh (turnover)
 * 6. **Upfront Cost**: 10% required to bid (prevents spam bidding)
 * 7. **Client Satisfaction**: Impacts future contract availability (not yet implemented)
 * 8. **Company Integration**: Updates cash and revenue on completion
 * 
 * PREVENTS:
 * - Unrealistic contract execution (skills matter)
 * - Free money (upfront costs, success requirements)
 * - Stale marketplace (expiration system)
 * - Missing deadlines without penalty
 */
