/**
 * @file src/lib/db/models/TrainingProgram.ts
 * @description Training program Mongoose schema for employee skill development
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Defines structured training programs with 6 distinct types. Programs specify
 * duration, cost, skill improvements, and certification outcomes. Training effectiveness
 * depends on employee learningRate and program difficulty. Successfully completed
 * programs increase both current skill levels AND skill caps (permanent talent growth).
 * 
 * SCHEMA FIELDS:
 * Core Information:
 * - name: Program title (unique, 3-100 chars)
 * - description: Program overview and objectives
 * - type: Training category (Technical, Sales, Leadership, etc.)
 * - provider: Organization offering program (e.g., "Coursera", "Internal", "Harvard")
 * - difficulty: 1-5 scale (affects success rate and skill gains)
 * - industry: Target industry (optional, e.g., "Technology", "Finance")
 * 
 * Requirements:
 * - prerequisiteCertifications: Required certifications to enroll
 * - minimumSkills: Minimum skill levels required (e.g., { technical: 40 })
 * - minimumExperience: Years of experience required (0-50)
 * - eligibleRoles: Restricted to specific roles (empty = all roles)
 * 
 * Duration & Scheduling:
 * - durationDays: Program length (1-365 days)
 * - hoursPerWeek: Weekly time commitment (1-40 hours)
 * - schedule: Delivery format ("Full-time", "Part-time", "Self-paced", "Weekend")
 * - cooldownDays: Required gap before enrolling in another program
 * 
 * Costs:
 * - cost: Program tuition/fees ($0-$100,000)
 * - travelRequired: Requires on-site attendance (increases cost)
 * - materialsIncluded: Books/resources included in price
 * 
 * Skill Development:
 * - primarySkill: Main skill improved (e.g., "technical", "sales")
 * - skillGains: Skill improvements on completion (e.g., { technical: 15, analytical: 5 })
 * - capIncreases: Permanent skill cap increases (e.g., { technical: 10 })
 * - guaranteedGains: Minimum skill increase even if failed
 * 
 * Certifications:
 * - certificationAwarded: Certificate name on completion
 * - industryRecognition: Certification prestige (1-100)
 * - expiryYears: Years until re-certification needed (0 = never expires)
 * 
 * Success & Outcomes:
 * - baseSuccessRate: Base probability of passing (0-100%)
 * - learningRateMultiplier: Impact of employee learningRate on success
 * - successBonusSkill: Extra skill points if passed vs failed
 * - failurePenalty: Morale/confidence impact if failed
 * 
 * Availability:
 * - active: Program currently offered
 * - maxEnrollments: Capacity limit (null = unlimited)
 * - currentEnrollments: Current participants count
 * - nextStartDate: Upcoming cohort start date
 * - enrollmentDeadline: Last day to register
 * 
 * USAGE:
 * ```typescript
 * import TrainingProgram from '@/lib/db/models/TrainingProgram';
 * import Employee from '@/lib/db/models/Employee';
 * 
 * // Create training program
 * const program = await TrainingProgram.create({
 *   name: 'Advanced Machine Learning',
 *   type: 'Technical',
 *   provider: 'Stanford Online',
 *   difficulty: 4,
 *   industry: 'Technology',
 *   durationDays: 90,
 *   cost: 5000,
 *   primarySkill: 'technical',
 *   skillGains: { technical: 20, analytical: 10, research: 5 },
 *   capIncreases: { technical: 15, analytical: 8 },
 *   certificationAwarded: 'Stanford ML Certificate',
 *   industryRecognition: 85,
 *   minimumSkills: { technical: 60, analytical: 50 }
 * });
 * 
 * // Find programs employee is eligible for
 * const eligiblePrograms = await TrainingProgram.findEligiblePrograms(
 *   employee,
 *   'Technical'
 * );
 * 
 * // Enroll employee in program
 * await program.enrollEmployee(employeeId);
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Training success = baseSuccessRate + (learningRate * learningRateMultiplier)
 * - Failed training still provides guaranteedGains (reduced skill increase)
 * - Successful training awards full skillGains + capIncreases
 * - Cap increases are permanent (talent growth, not just practice)
 * - Programs can be industry-specific (Technology programs benefit tech companies)
 * - Certifications increase employee market value and unlock advanced roles
 * - Difficulty affects cost, duration, skill gains, and success rate
 * - Cooldown prevents rapid-fire training spam (realistic pacing)
 * - Travel-required programs cost more (lodging, expenses)
 * - Enrollment capacity creates scarcity and planning requirements
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { EmployeeRole, TrainingType, IEmployee } from './Employee';

/**
 * Training schedule formats
 */
export type TrainingSchedule =
  | 'Full-time'    // 40 hours/week, intensive
  | 'Part-time'    // 10-20 hours/week, flexible
  | 'Self-paced'   // No set schedule, complete at own pace
  | 'Weekend'      // Saturday-Sunday only
  | 'Evening';     // After normal work hours

/**
 * Skill improvements map
 * Maps skill names to improvement points
 */
export interface SkillGains {
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
 * Training program document interface
 * 
 * @interface ITrainingProgram
 * @extends {Document}
 */
export interface ITrainingProgram extends Document {
  // Core Information
  name: string;
  description: string;
  type: TrainingType;
  provider: string;
  difficulty: number;             // 1-5 scale
  industry?: string;

  // Requirements
  prerequisiteCertifications: string[];
  minimumSkills: SkillGains;
  minimumExperience: number;      // Years (0-50)
  eligibleRoles: EmployeeRole[];

  // Duration & Scheduling
  durationDays: number;
  hoursPerWeek: number;
  schedule: TrainingSchedule;
  cooldownDays: number;

  // Costs
  cost: number;
  travelRequired: boolean;
  materialsIncluded: boolean;

  // Skill Development
  primarySkill: string;
  skillGains: SkillGains;
  capIncreases: SkillGains;
  guaranteedGains: SkillGains;

  // Certifications
  certificationAwarded?: string;
  industryRecognition: number;    // 1-100
  expiryYears: number;            // 0 = never expires

  // Success & Outcomes
  baseSuccessRate: number;        // 0-100%
  learningRateMultiplier: number; // 0-1 (impact of learningRate)
  successBonusSkill: number;      // Extra skill points if passed
  failurePenalty: number;         // Morale impact if failed

  // Availability
  active: boolean;
  maxEnrollments?: number;
  currentEnrollments: number;
  nextStartDate?: Date;
  enrollmentDeadline?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  totalCost: number;
  totalHours: number;
  isAvailable: boolean;

  // Instance methods
  enrollEmployee(employeeId: Types.ObjectId): Promise<void>;
  unenrollEmployee(employeeId: Types.ObjectId): Promise<void>;
  calculateSuccess(learningRate: number): number;
}

/**
 * Training program static methods
 */
export interface ITrainingProgramModel extends Model<ITrainingProgram> {
  findEligiblePrograms(
    employee: IEmployee,
    type?: TrainingType
  ): Promise<ITrainingProgram[]>;
  
  findByDifficulty(
    difficulty: number,
    type?: TrainingType
  ): Promise<ITrainingProgram[]>;
  
  findByIndustry(industry: string): Promise<ITrainingProgram[]>;
}

/**
 * Training program schema definition
 */
const TrainingProgramSchema = new Schema<ITrainingProgram, ITrainingProgramModel>(
  {
    // Core Information
    name: {
      type: String,
      required: [true, 'Program name is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Program name must be at least 3 characters'],
      maxlength: [100, 'Program name cannot exceed 100 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Program description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      required: [true, 'Training type is required'],
      enum: {
        values: ['Technical', 'Sales', 'Leadership', 'Compliance', 'SoftSkills', 'IndustryCertification'],
        message: '{VALUE} is not a valid training type',
      },
      index: true,
    },
    provider: {
      type: String,
      required: [true, 'Program provider is required'],
      trim: true,
      maxlength: [100, 'Provider name cannot exceed 100 characters'],
    },
    difficulty: {
      type: Number,
      required: [true, 'Difficulty is required'],
      min: [1, 'Difficulty must be at least 1'],
      max: [5, 'Difficulty cannot exceed 5'],
      index: true,
    },
    industry: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    // Requirements
    prerequisiteCertifications: {
      type: [String],
      default: [],
    },
    minimumSkills: {
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
      default: {},
    },
    minimumExperience: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Minimum experience cannot be negative'],
      max: [50, 'Minimum experience cannot exceed 50 years'],
    },
    eligibleRoles: {
      type: [String],
      default: [], // Empty = all roles eligible
    },

    // Duration & Scheduling
    durationDays: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 day'],
      max: [365, 'Duration cannot exceed 365 days'],
    },
    hoursPerWeek: {
      type: Number,
      required: [true, 'Hours per week is required'],
      min: [1, 'Hours per week must be at least 1'],
      max: [40, 'Hours per week cannot exceed 40'],
    },
    schedule: {
      type: String,
      required: [true, 'Schedule is required'],
      enum: {
        values: ['Full-time', 'Part-time', 'Self-paced', 'Weekend', 'Evening'],
        message: '{VALUE} is not a valid schedule format',
      },
    },
    cooldownDays: {
      type: Number,
      required: true,
      default: 30, // 1 month cooldown by default
      min: [0, 'Cooldown cannot be negative'],
      max: [365, 'Cooldown cannot exceed 365 days'],
    },

    // Costs
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost cannot be negative'],
      max: [100000, 'Cost cannot exceed $100,000'],
    },
    travelRequired: {
      type: Boolean,
      required: true,
      default: false,
    },
    materialsIncluded: {
      type: Boolean,
      required: true,
      default: true,
    },

    // Skill Development
    primarySkill: {
      type: String,
      required: [true, 'Primary skill is required'],
      enum: {
        values: [
          'technical', 'sales', 'leadership', 'finance', 'marketing', 'operations',
          'research', 'compliance', 'communication', 'creativity', 'analytical', 'customerService'
        ],
        message: '{VALUE} is not a valid skill name',
      },
    },
    skillGains: {
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
      required: [true, 'Skill gains are required'],
      default: {},
    },
    capIncreases: {
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
      required: true,
      default: {},
    },
    guaranteedGains: {
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
      required: true,
      default: {},
    },

    // Certifications
    certificationAwarded: {
      type: String,
      trim: true,
      default: null,
    },
    industryRecognition: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Industry recognition must be at least 1'],
      max: [100, 'Industry recognition cannot exceed 100'],
    },
    expiryYears: {
      type: Number,
      required: true,
      default: 0, // 0 = never expires
      min: [0, 'Expiry years cannot be negative'],
      max: [10, 'Expiry years cannot exceed 10'],
    },

    // Success & Outcomes
    baseSuccessRate: {
      type: Number,
      required: [true, 'Base success rate is required'],
      min: [0, 'Success rate cannot be below 0'],
      max: [100, 'Success rate cannot exceed 100'],
      default: 70, // 70% base success rate
    },
    learningRateMultiplier: {
      type: Number,
      required: true,
      default: 0.3, // 30% impact from learningRate
      min: [0, 'Multiplier cannot be negative'],
      max: [1, 'Multiplier cannot exceed 1'],
    },
    successBonusSkill: {
      type: Number,
      required: true,
      default: 5, // +5 extra skill points if passed
      min: [0, 'Success bonus cannot be negative'],
      max: [20, 'Success bonus cannot exceed 20'],
    },
    failurePenalty: {
      type: Number,
      required: true,
      default: 10, // -10 morale if failed
      min: [0, 'Failure penalty cannot be negative'],
      max: [30, 'Failure penalty cannot exceed 30'],
    },

    // Availability
    active: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    maxEnrollments: {
      type: Number,
      default: null, // null = unlimited
      min: [1, 'Max enrollments must be at least 1'],
    },
    currentEnrollments: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Current enrollments cannot be negative'],
    },
    nextStartDate: {
      type: Date,
      default: null,
    },
    enrollmentDeadline: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'training_programs',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
TrainingProgramSchema.index({ type: 1, difficulty: 1 });
TrainingProgramSchema.index({ industry: 1, active: 1 });
TrainingProgramSchema.index({ active: 1, nextStartDate: 1 });

/**
 * Virtual field: totalCost
 * Calculates total cost including travel expenses
 */
TrainingProgramSchema.virtual('totalCost').get(function (this: ITrainingProgram): number {
  const baseCost = this.cost;
  const travelCost = this.travelRequired ? this.cost * 0.3 : 0; // +30% for travel
  const materialsCost = this.materialsIncluded ? 0 : 500; // $500 if materials not included
  
  return Math.round(baseCost + travelCost + materialsCost);
});

/**
 * Virtual field: totalHours
 * Calculates total time commitment in hours
 */
TrainingProgramSchema.virtual('totalHours').get(function (this: ITrainingProgram): number {
  const weeks = Math.ceil(this.durationDays / 7);
  return this.hoursPerWeek * weeks;
});

/**
 * Virtual field: isAvailable
 * True if program is active and has space available
 */
TrainingProgramSchema.virtual('isAvailable').get(function (this: ITrainingProgram): boolean {
  if (!this.active) return false;
  if (this.maxEnrollments === null || this.maxEnrollments === undefined) return true;
  return this.currentEnrollments < this.maxEnrollments;
});

/**
 * Instance method: enrollEmployee
 * Increases enrollment count and validates capacity
 * 
 * @param {Types.ObjectId} employeeId - Employee to enroll
 * @throws {Error} If program is at capacity
 */
TrainingProgramSchema.methods.enrollEmployee = async function (
  this: ITrainingProgram,
  _employeeId: Types.ObjectId
): Promise<void> {
  if (!this.isAvailable) {
    throw new Error(`Training program "${this.name}" is not available for enrollment`);
  }
  
  if (this.maxEnrollments !== null && this.maxEnrollments !== undefined && this.currentEnrollments >= this.maxEnrollments) {
    throw new Error(`Training program "${this.name}" is at capacity`);
  }
  
  this.currentEnrollments += 1;
  await this.save();
};

/**
 * Instance method: unenrollEmployee
 * Decreases enrollment count
 * 
 * @param {Types.ObjectId} employeeId - Employee to unenroll
 */
TrainingProgramSchema.methods.unenrollEmployee = async function (
  this: ITrainingProgram,
  _employeeId: Types.ObjectId
): Promise<void> {
  if (this.currentEnrollments > 0) {
    this.currentEnrollments -= 1;
    await this.save();
  }
};

/**
 * Instance method: calculateSuccess
 * Calculates probability of training success based on employee learningRate
 * 
 * @param {number} learningRate - Employee's learning rate (0-100)
 * @returns {number} Success probability (0-100%)
 */
TrainingProgramSchema.methods.calculateSuccess = function (
  this: ITrainingProgram,
  learningRate: number
): number {
  const learningBonus = (learningRate - 50) * this.learningRateMultiplier; // ±15% max at 0.3 multiplier
  const totalSuccess = this.baseSuccessRate + learningBonus;
  
  return Math.min(100, Math.max(0, totalSuccess));
};

/**
 * Static method: findEligiblePrograms
 * Find all programs an employee qualifies for
 * 
 * @param {IEmployee} employee - Employee document
 * @param {TrainingType} type - Filter by training type (optional)
 * @returns {Promise<ITrainingProgram[]>} Eligible programs
 */
TrainingProgramSchema.statics.findEligiblePrograms = async function (
  this: ITrainingProgramModel,
  employee: IEmployee,
  type?: TrainingType
): Promise<ITrainingProgram[]> {
  const query: Record<string, unknown> = { active: true };
  
  if (type) {
    query.type = type;
  }
  
  // Get all active programs
  const programs = await this.find(query);
  
  // Filter by employee eligibility
  return programs.filter((program) => {
    // Check role eligibility
    if (program.eligibleRoles.length > 0 && !program.eligibleRoles.includes(employee.role)) {
      return false;
    }
    
    // Check experience requirement
    const employeeYears = (employee.experience / 100) * 50; // Convert scale to years
    if (employeeYears < program.minimumExperience) {
      return false;
    }
    
    // Check skill requirements
    for (const [skill, minValue] of Object.entries(program.minimumSkills)) {
      if ((employee as any)[skill] < minValue) {
        return false;
      }
    }
    
    // Check prerequisite certifications
    if (program.prerequisiteCertifications.length > 0) {
      const hasAllCerts = program.prerequisiteCertifications.every((cert) =>
        employee.certifications.includes(cert)
      );
      if (!hasAllCerts) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Static method: findByDifficulty
 * Find programs by difficulty level
 * 
 * @param {number} difficulty - Difficulty level (1-5)
 * @param {TrainingType} type - Filter by training type (optional)
 * @returns {Promise<ITrainingProgram[]>} Matching programs
 */
TrainingProgramSchema.statics.findByDifficulty = async function (
  this: ITrainingProgramModel,
  difficulty: number,
  type?: TrainingType
): Promise<ITrainingProgram[]> {
  const query: Record<string, unknown> = { 
    active: true,
    difficulty 
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query).sort({ industryRecognition: -1 });
};

/**
 * Static method: findByIndustry
 * Find programs for specific industry
 * 
 * @param {string} industry - Industry name
 * @returns {Promise<ITrainingProgram[]>} Industry-specific programs
 */
TrainingProgramSchema.statics.findByIndustry = async function (
  this: ITrainingProgramModel,
  industry: string
): Promise<ITrainingProgram[]> {
  return this.find({ 
    active: true,
    industry 
  }).sort({ difficulty: 1 });
};

/**
 * Training program model
 * 
 * @example
 * ```typescript
 * import TrainingProgram from '@/lib/db/models/TrainingProgram';
 * import Employee from '@/lib/db/models/Employee';
 * 
 * // Create advanced training program
 * const program = await TrainingProgram.create({
 *   name: 'Executive Leadership Certification',
 *   description: 'C-level leadership training for senior executives',
 *   type: 'Leadership',
 *   provider: 'Harvard Business School',
 *   difficulty: 5,
 *   durationDays: 120,
 *   cost: 25000,
 *   primarySkill: 'leadership',
 *   skillGains: { leadership: 25, communication: 15, analytical: 10 },
 *   capIncreases: { leadership: 20, communication: 10 },
 *   guaranteedGains: { leadership: 10 }, // Even if failed
 *   certificationAwarded: 'HBS Executive Leadership Certificate',
 *   industryRecognition: 95,
 *   minimumSkills: { leadership: 70, communication: 60 },
 *   minimumExperience: 10,
 *   eligibleRoles: ['Manager', 'Executive']
 * });
 * 
 * // Find eligible programs for employee
 * const employee = await Employee.findById(employeeId);
 * const eligiblePrograms = await TrainingProgram.findEligiblePrograms(
 *   employee,
 *   'Leadership'
 * );
 * 
 * // Enroll employee
 * await program.enrollEmployee(employee._id);
 * 
 * // Calculate success probability
 * const successRate = program.calculateSuccess(employee.learningRate);
 * console.log(`${employee.fullName} has ${successRate}% chance of passing`);
 * ```
 */
const TrainingProgram: ITrainingProgramModel =
  (mongoose.models.TrainingProgram as ITrainingProgramModel) || 
  mongoose.model<ITrainingProgram, ITrainingProgramModel>('TrainingProgram', TrainingProgramSchema);

export default TrainingProgram;
