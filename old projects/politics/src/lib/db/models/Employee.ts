/**
 * @file src/lib/db/models/Employee.ts
 * @description Employee Mongoose schema for NPC workforce management system
 * @created 2025-11-13
 * @updated 2025-11-15 - Added AI-specific fields (hasPhD, publications, hIndex, researchAbility, codingSkill, domainExpertise, computeBudget)
 * 
 * OVERVIEW:
 * Comprehensive employee management system with 12 distinct skill fields, training
 * progression, certification tracking, retention mechanics, poaching protection, and
 * AI-specific talent management features for Technology/AI companies. Employees are
 * NPCs with AI-driven skill growth/decay, performance metrics, and satisfaction
 * scoring that affects retention and productivity.
 * 
 * SCHEMA FIELDS:
 * Identity & Employment:
 * - firstName, lastName: Employee name (generated, 2-30 chars)
 * - email: Work email (generated, format: firstname.lastname@company.com)
 * - avatar: Optional profile picture URL
 * - company: Reference to Company document (required, indexed)
 * - role: Job title (MLEngineer, ResearchScientist, DataEngineer, MLOps, ProductManager, etc.)
 * - department: Reference to Department (optional, for Phase 3)
 * - hiredAt: Employment start date (immutable)
 * - firedAt: Termination date (null if currently employed)
 * 
 * Core Skills (1-100 scale):
 * - technical: Programming, engineering, technical tasks
 * - sales: Customer acquisition, negotiation, closing deals
 * - leadership: Team management, decision making, delegation
 * - finance: Accounting, budgeting, financial analysis
 * - marketing: Branding, campaigns, customer acquisition
 * - operations: Process optimization, logistics, efficiency
 * - research: Innovation, R&D, problem solving
 * - compliance: Regulatory adherence, legal knowledge
 * - communication: Interpersonal, presentation, writing
 * - creativity: Design, innovation, out-of-box thinking
 * - analytical: Data analysis, metrics, strategic thinking
 * - customerService: Support, satisfaction, retention
 * 
 * Attributes (1-100 scale):
 * - experience: Years of professional experience (0-50)
 * - productivity: Work output multiplier (affects contract completion)
 * - loyalty: Resistance to poaching, turnover risk
 * - morale: Current happiness, affects productivity
 * - satisfaction: Overall job satisfaction, affects retention
 * - learningRate: Training effectiveness multiplier
 * 
 * Compensation:
 * - salary: Annual base salary (market-driven)
 * - bonus: Annual bonus target percentage
 * - equity: Stock options percentage (0-10%, used for AI employee stock grants)
 * - lastRaise: Date of last salary increase
 * - nextReviewDate: Scheduled performance review
 * 
 * Performance Tracking:
 * - contractsCompleted: Total contracts participated in
 * - projectsCompleted: Total projects completed
 * - revenueGenerated: Lifetime revenue attributed to employee
 * - performanceRating: 1-5 scale (updated at reviews)
 * - performanceHistory: Array of past performance reviews
 * 
 * Training & Development:
 * - trainingHistory: Array of completed training programs
 * - totalTrainingInvestment: Total $ spent on employee training
 * - skillCaps: Maximum achievable skill levels (talent-based, 50-100)
 * - trainingCooldown: Cannot train again until this date
 * - certifications: Earned industry certifications
 * - specializations: Areas of expertise
 * 
 * Retention & Poaching:
 * - poachable: Visible to competitors for recruitment
 * - poachResistance: 1-100, based on loyalty + compensation
 * - lastPoachAttempt: Track most recent poaching attempt
 * - nonCompeteExpiry: Date when non-compete clause expires
 * - retentionRisk: Calculated probability of turnover (0-100)
 * - counterOfferCount: Times company made retention offer
 * 
 * AI-Specific Fields (for MLEngineer, ResearchScientist, DataEngineer, MLOps, ProductManager):
 * - hasPhD: PhD credential flag (10x rarer, commands 1.5-2x salary premium)
 * - publications: Research papers published (0-500)
 * - hIndex: Citation-based research impact metric (0-200)
 * - researchAbility: Research quality/speed (1-10 scale, distinct from research 1-100)
 * - codingSkill: Implementation ability (1-10 scale, distinct from technical 1-100)
 * - domainExpertise: AI specialization (NLP, ComputerVision, RL, GenerativeAI, Speech, Robotics)
 * - computeBudget: Monthly GPU/compute allocation ($0-$10,000/month)
 * 
 * USAGE:
 * ```typescript
 * import Employee from '@/lib/db/models/Employee';
 * 
 * // Create AI employee
 * const employee = await Employee.create({
 *   firstName: 'Sarah',
 *   lastName: 'Chen',
 *   email: 'sarah.chen@aicompany.com',
 *   company: companyId,
 *   role: 'ResearchScientist',
 *   technical: 85,
 *   analytical: 88,
 *   salary: 250000,
 *   hasPhD: true,
 *   publications: 15,
 *   hIndex: 12,
 *   researchAbility: 9,
 *   codingSkill: 7,
 *   domainExpertise: 'NLP',
 *   computeBudget: 3000,
 *   skillCaps: { technical: 95, analytical: 92 }
 * });
 * 
 * // Create employee
 * const employee = await Employee.create({
 *   firstName: 'Sarah',
 *   lastName: 'Chen',
 *   email: 'sarah.chen@acmecorp.com',
 *   company: companyId,
 *   role: 'SoftwareEngineer',
 *   technical: 75,
 *   analytical: 68,
 *   salary: 120000,
 *   skillCaps: { technical: 90, analytical: 85 }
 * });
 * 
 * // Find company employees
 * const employees = await Employee.find({ 
 *   company: companyId,
 *   firedAt: null  // Currently employed
 * }).sort({ performanceRating: -1 });
 * 
 * // Enroll in training
 * await employee.updateOne({
 *   $push: {
 *     trainingHistory: {
 *       programName: 'Advanced Leadership',
 *       startDate: new Date(),
 *       type: 'Leadership',
 *       cost: 2000
 *     }
 *   },
 *   $inc: { totalTrainingInvestment: 2000 }
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Skills default to role-appropriate starting values (e.g., MLEngineer starts with high technical)
 * - Skill caps are talent-based (50-100), limiting max achievable skill level
 * - Training increases both current skill AND skill cap (permanent improvement)
 * - Morale decays over time without attention (events, bonuses, promotions)
 * - Satisfaction calculated from: salary competitiveness, morale, workload, growth opportunities
 * - Retention risk calculated from: satisfaction, external offers, market conditions
 * - Poaching resistance = (loyalty * 0.5) + (salary competitiveness * 0.3) + (satisfaction * 0.2)
 * - Performance reviews update rating, unlock promotions, justify raises
 * - Certifications unlock advanced roles and increase market value
 * - All financial operations logged to Transaction collection
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Valid employee roles
 * Maps to industry requirements and skill profiles
 */
export type EmployeeRole =
  // Politics/Government roles
  | 'Lobbyist'
  | 'Campaign Manager'
  | 'Policy Analyst'
  | 'Communications Director'
  | 'Field Organizer'
  | 'Data Analyst'
  | 'Finance Director'
  | 'Legal Counsel'
  | 'Media Relations'
  | 'Speechwriter'
  | 'Opposition Researcher'
  | 'Pollster'
  | 'Digital Strategist'
  | 'Fundraising Coordinator'
  | 'Volunteer Coordinator'
  | 'Press Secretary'
  | 'Chief of Staff'
  | 'Legislative Director'
  | 'Political Director'
  | 'Compliance Officer'
  // AI/Technology-specific roles
  | 'MLEngineer'
  | 'ResearchScientist'
  | 'DataEngineer'
  | 'MLOps'
  | 'ProductManager';

/**
 * Domain expertise areas for AI employees
 * Used to categorize specialized knowledge in AI subfields
 */
export type DomainExpertise = 
  | 'NLP'                      // Natural Language Processing
  | 'ComputerVision'           // Image/video processing
  | 'ReinforcementLearning'    // RL/robotics
  | 'GenerativeAI'             // LLMs, diffusion models
  | 'Speech'                   // Audio/speech processing
  | 'Robotics';                // Physical AI systems

/**
 * Training program types
 * Corresponds to TrainingProgram schema
 */
export type TrainingType =
  | 'Technical'             // Programming, engineering, technical skills
  | 'Sales'                 // Sales techniques, negotiation, closing
  | 'Leadership'            // Management, delegation, decision making
  | 'Compliance'            // Regulatory, legal, ethics
  | 'SoftSkills'            // Communication, teamwork, presentation
  | 'IndustryCertification'; // Industry-specific credentials

/**
 * Performance review entry
 * Track historical performance ratings and feedback
 */
export interface PerformanceReview {
  date: Date;
  rating: number;              // 1-5 scale
  reviewer: Types.ObjectId;    // User who conducted review
  feedback?: string;           // Written feedback
  skillGrowth: {               // Skills improved since last review
    [key: string]: number;     // Skill name → points gained
  };
  accomplishments?: string[];  // Key achievements
  areasForImprovement?: string[]; // Growth opportunities
  salaryAdjustment?: number;   // Salary change (if any)
  promotionTo?: EmployeeRole;  // Promoted to new role (if any)
}

/**
 * Training history entry
 * Track all completed and in-progress training
 */
export interface TrainingRecord {
  programName: string;
  programId?: Types.ObjectId;  // Reference to TrainingProgram
  type: TrainingType;
  startDate: Date;
  completedDate?: Date;        // Null if in progress
  durationDays: number;        // Program duration
  cost: number;                // Training cost
  skillGain: {                 // Skills improved by training
    [key: string]: number;     // Skill name → points gained
  };
  capIncrease: {               // Skill caps permanently increased
    [key: string]: number;     // Skill name → cap points gained
  };
  certificationsEarned?: string[]; // Certifications from training
  passed: boolean;             // Training success (based on learningRate)
}

/**
 * Skill caps interface
 * Maximum achievable level for each skill (talent-based)
 */
export interface SkillCaps {
  technical?: number;          // Max technical skill (50-100)
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
 * Employee document interface
 * 
 * @interface IEmployee
 * @extends {Document}
 */
export interface IEmployee extends Document {
  // Identity & Employment
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  company: Types.ObjectId;
  role: EmployeeRole;
  experienceLevel: string;     // entry, mid, senior, expert, master, legendary
  department?: Types.ObjectId;
  hiredAt: Date;
  firedAt?: Date;
  talent: number;              // Genetic skill cap potential (50-100)

  // Core Skills (1-100 scale)
  technical: number;
  sales: number;
  leadership: number;
  finance: number;
  marketing: number;
  operations: number;
  research: number;
  compliance: number;
  communication: number;
  creativity: number;
  analytical: number;
  customerService: number;

  // Attributes (1-100 scale)
  experience: number;          // 0-50 years → 0-100 scale
  productivity: number;        // Work output multiplier
  loyalty: number;             // Poaching resistance
  morale: number;              // Current happiness
  satisfaction: number;        // Overall job satisfaction
  learningRate: number;        // Training effectiveness

  // Compensation
  salary: number;              // Annual base salary
  bonus: number;               // Bonus percentage (0-100)
  equity: number;              // Stock options percentage
  lastRaise?: Date;
  nextReviewDate: Date;

  // Performance Tracking
  contractsCompleted: number;
  projectsCompleted: number;
  revenueGenerated: number;
  performanceRating: number;   // 1-5 scale
  performanceHistory: PerformanceReview[];

  // Training & Development
  trainingHistory: TrainingRecord[];
  totalTrainingInvestment: number;
  skillCaps: SkillCaps;
  trainingCooldown?: Date;
  certifications: string[];
  specializations: string[];

  // Retention & Poaching
  poachable: boolean;
  poachResistance: number;     // Calculated: loyalty + compensation + satisfaction
  lastPoachAttempt?: Date;
  nonCompeteExpiry?: Date;
  retentionRisk: number;       // Calculated: 0-100 (higher = more likely to leave)
  counterOfferCount: number;

  // AI-Specific Fields (for MLEngineer, ResearchScientist, DataEngineer, MLOps, ProductManager roles)
  hasPhD?: boolean;            // PhD credential (10x rarer, commands 1.5-2x salary premium)
  publications?: number;       // Research papers published (0-200+)
  hIndex?: number;             // Citation-based research impact metric (0-100+)
  researchAbility?: number;    // Research quality and speed (1-10 scale, distinct from research 1-100)
  codingSkill?: number;        // Implementation ability (1-10 scale, distinct from technical 1-100)
  domainExpertise?: DomainExpertise; // AI specialization area
  computeBudget?: number;      // Monthly GPU/compute allocation ($500-$5000/month)

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  fullName: string;
  isActive: boolean;
  yearsOfExperience: number;
  averageSkill: number;
}

/**
 * Employee schema definition
 */
const EmployeeSchema = new Schema<IEmployee>(
  {
    // Identity & Employment
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [30, 'First name cannot exceed 30 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [30, 'Last name cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    avatar: {
      type: String,
      default: null,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true, // Fast company employee lookups
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: [
          'Lobbyist', 'Campaign Manager', 'Policy Analyst', 'Communications Director',
          'Field Organizer', 'Data Analyst', 'Finance Director', 'Legal Counsel',
          'Media Relations', 'Speechwriter', 'Opposition Researcher', 'Pollster',
          'Digital Strategist', 'Fundraising Coordinator', 'Volunteer Coordinator',
          'Press Secretary', 'Chief of Staff', 'Legislative Director', 'Political Director',
          'Compliance Officer',
          // AI/Tech
          'MLEngineer', 'ResearchScientist', 'DataEngineer', 'MLOps', 'ProductManager'
        ],
        message: '{VALUE} is not a valid employee role',
      },
      index: true,
    },
    experienceLevel: {
      type: String,
      required: true,
      enum: {
        values: ['entry', 'mid', 'senior', 'expert', 'master', 'legendary'],
        message: '{VALUE} is not a valid experience level',
      },
      default: 'entry',
    },
    talent: {
      type: Number,
      required: true,
      default: 70,
      min: [50, 'Talent cannot be below 50'],
      max: [100, 'Talent cannot exceed 100'],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null, // Phase 3 feature
    },
    hiredAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },
    firedAt: {
      type: Date,
      default: null,
      index: true, // Query active employees (firedAt: null)
    },

    // Core Skills (1-100 scale)
    technical: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Skill cannot be below 1'],
      max: [100, 'Skill cannot exceed 100'],
    },
    sales: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Skill cannot be below 1'],
      max: [100, 'Skill cannot exceed 100'],
    },
    leadership: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Skill cannot be below 1'],
      max: [100, 'Skill cannot exceed 100'],
    },
    finance: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Skill cannot be below 1'],
      max: [100, 'Skill cannot exceed 100'],
    },
    marketing: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Skill cannot be below 1'],
      max: [100, 'Skill cannot exceed 100'],
    },
    operations: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Skill cannot be below 1'],
      max: [100, 'Skill cannot exceed 100'],
    },
    research: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Skill cannot be below 1'],
      max: [100, 'Skill cannot exceed 100'],
    },
    compliance: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Skill cannot be below 1'],
      max: [100, 'Skill cannot exceed 100'],
    },
    communication: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Skill cannot be below 1'],
      max: [100, 'Skill cannot exceed 100'],
    },
    creativity: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Skill cannot be below 1'],
      max: [100, 'Skill cannot exceed 100'],
    },
    analytical: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Skill cannot be below 1'],
      max: [100, 'Skill cannot exceed 100'],
    },
    customerService: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Skill cannot be below 1'],
      max: [100, 'Skill cannot exceed 100'],
    },

    // Attributes (1-100 scale)
    experience: {
      type: Number,
      required: true,
      default: 20, // 2 years experience → 20 on scale
      min: [0, 'Experience cannot be negative'],
      max: [100, 'Experience cannot exceed 100'], // 50 years max
    },
    productivity: {
      type: Number,
      required: true,
      default: 70,
      min: [1, 'Productivity cannot be below 1'],
      max: [100, 'Productivity cannot exceed 100'],
    },
    loyalty: {
      type: Number,
      required: true,
      default: 60,
      min: [1, 'Loyalty cannot be below 1'],
      max: [100, 'Loyalty cannot exceed 100'],
    },
    morale: {
      type: Number,
      required: true,
      default: 75,
      min: [1, 'Morale cannot be below 1'],
      max: [100, 'Morale cannot exceed 100'],
    },
    satisfaction: {
      type: Number,
      required: true,
      default: 70,
      min: [1, 'Satisfaction cannot be below 1'],
      max: [100, 'Satisfaction cannot exceed 100'],
    },
    learningRate: {
      type: Number,
      required: true,
      default: 60,
      min: [1, 'Learning rate cannot be below 1'],
      max: [100, 'Learning rate cannot exceed 100'],
    },

    // Compensation
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [20000, 'Salary must be at least $20,000'],
      max: [5000000, 'Salary cannot exceed $5,000,000'],
    },
    bonus: {
      type: Number,
      required: true,
      default: 10, // 10% bonus target
      min: [0, 'Bonus cannot be negative'],
      max: [100, 'Bonus cannot exceed 100%'],
    },
    equity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Equity cannot be negative'],
      max: [10, 'Equity cannot exceed 10%'],
    },
    lastRaise: {
      type: Date,
      default: null,
    },
    nextReviewDate: {
      type: Date,
      required: true,
      default: () => {
        // Default to 6 months from hire
        const date = new Date();
        date.setMonth(date.getMonth() + 6);
        return date;
      },
    },

    // Performance Tracking
    contractsCompleted: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Contracts completed cannot be negative'],
    },
    projectsCompleted: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Projects completed cannot be negative'],
    },
    revenueGenerated: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Revenue generated cannot be negative'],
    },
    performanceRating: {
      type: Number,
      required: true,
      default: 3, // 3/5 = average starting rating
      min: [1, 'Performance rating must be at least 1'],
      max: [5, 'Performance rating cannot exceed 5'],
    },
    performanceHistory: {
      type: [
        {
          date: { type: Date, required: true },
          rating: { type: Number, required: true, min: 1, max: 5 },
          reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          feedback: String,
          skillGrowth: Schema.Types.Mixed,
          accomplishments: [String],
          areasForImprovement: [String],
          salaryAdjustment: Number,
          promotionTo: String,
        },
      ],
      default: [],
    },

    // Training & Development
    trainingHistory: {
      type: [
        {
          programName: { type: String, required: true },
          programId: { type: Schema.Types.ObjectId, ref: 'TrainingProgram' },
          type: {
            type: String,
            required: true,
            enum: ['Technical', 'Sales', 'Leadership', 'Compliance', 'SoftSkills', 'IndustryCertification'],
          },
          startDate: { type: Date, required: true },
          completedDate: Date,
          durationDays: { type: Number, required: true },
          cost: { type: Number, required: true },
          skillGain: Schema.Types.Mixed,
          capIncrease: Schema.Types.Mixed,
          certificationsEarned: [String],
          passed: { type: Boolean, default: true },
        },
      ],
      default: [],
    },
    totalTrainingInvestment: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Training investment cannot be negative'],
    },
    skillCaps: {
      type: {
        technical: { type: Number, min: 50, max: 100 },
        sales: { type: Number, min: 50, max: 100 },
        leadership: { type: Number, min: 50, max: 100 },
        finance: { type: Number, min: 50, max: 100 },
        marketing: { type: Number, min: 50, max: 100 },
        operations: { type: Number, min: 50, max: 100 },
        research: { type: Number, min: 50, max: 100 },
        compliance: { type: Number, min: 50, max: 100 },
        communication: { type: Number, min: 50, max: 100 },
        creativity: { type: Number, min: 50, max: 100 },
        analytical: { type: Number, min: 50, max: 100 },
        customerService: { type: Number, min: 50, max: 100 },
      },
      required: true,
      default: {
        // Default caps: 70 (room for growth with training)
        technical: 70,
        sales: 70,
        leadership: 70,
        finance: 70,
        marketing: 70,
        operations: 70,
        research: 70,
        compliance: 70,
        communication: 70,
        creativity: 70,
        analytical: 70,
        customerService: 70,
      },
    },
    trainingCooldown: {
      type: Date,
      default: null,
    },
    certifications: {
      type: [String],
      default: [],
    },
    specializations: {
      type: [String],
      default: [],
    },

    // Retention & Poaching
    poachable: {
      type: Boolean,
      required: true,
      default: false, // Not visible to competitors initially
    },
    poachResistance: {
      type: Number,
      required: true,
      default: 60,
      min: [0, 'Poach resistance cannot be negative'],
      max: [100, 'Poach resistance cannot exceed 100'],
    },
    lastPoachAttempt: {
      type: Date,
      default: null,
    },
    nonCompeteExpiry: {
      type: Date,
      default: null,
    },
    retentionRisk: {
      type: Number,
      required: true,
      default: 30, // 30% risk initially
      min: [0, 'Retention risk cannot be negative'],
      max: [100, 'Retention risk cannot exceed 100'],
    },
    counterOfferCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Counter offer count cannot be negative'],
    },

    // AI-Specific Fields (for MLEngineer, ResearchScientist, DataEngineer, MLOps, ProductManager roles)
    hasPhD: {
      type: Boolean,
      required: false,
      default: false,
    },
    publications: {
      type: Number,
      required: false,
      default: 0,
      min: [0, 'Publications cannot be negative'],
      max: [500, 'Publications cannot exceed 500'],
    },
    hIndex: {
      type: Number,
      required: false,
      default: 0,
      min: [0, 'h-index cannot be negative'],
      max: [200, 'h-index cannot exceed 200'],
    },
    researchAbility: {
      type: Number,
      required: false,
      min: [1, 'Research ability must be at least 1'],
      max: [10, 'Research ability cannot exceed 10'],
    },
    codingSkill: {
      type: Number,
      required: false,
      min: [1, 'Coding skill must be at least 1'],
      max: [10, 'Coding skill cannot exceed 10'],
    },
    domainExpertise: {
      type: String,
      required: false,
      enum: ['NLP', 'ComputerVision', 'ReinforcementLearning', 'GenerativeAI', 'Speech', 'Robotics'],
    },
    computeBudget: {
      type: Number,
      required: false,
      default: 0,
      min: [0, 'Compute budget cannot be negative'],
      max: [10000, 'Compute budget cannot exceed $10,000/month'],
    },
  },
  {
    timestamps: true,
    collection: 'employees',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
EmployeeSchema.index({ company: 1, firedAt: 1 }); // Active employees per company
EmployeeSchema.index({ company: 1, role: 1 });    // Employees by role
EmployeeSchema.index({ company: 1, performanceRating: -1 }); // Top performers
EmployeeSchema.index({ poachable: 1, retentionRisk: -1 }); // Poaching targets
EmployeeSchema.index({ nextReviewDate: 1 }); // Upcoming reviews

/**
 * Virtual field: fullName
 * Concatenates first and last name
 */
EmployeeSchema.virtual('fullName').get(function (this: IEmployee): string {
  return `${this.firstName} ${this.lastName}`;
});

/**
 * Virtual field: isActive
 * True if currently employed (not fired)
 */
EmployeeSchema.virtual('isActive').get(function (this: IEmployee): boolean {
  return this.firedAt === null || this.firedAt === undefined;
});

/**
 * Virtual field: yearsOfExperience
 * Converts experience scale (0-100) to years (0-50)
 */
EmployeeSchema.virtual('yearsOfExperience').get(function (this: IEmployee): number {
  return Math.round((this.experience / 100) * 50 * 10) / 10; // 1 decimal place
});

/**
 * Virtual field: averageSkill
 * Average of all 12 core skills
 */
EmployeeSchema.virtual('averageSkill').get(function (this: IEmployee): number {
  const skills = [
    this.technical,
    this.sales,
    this.leadership,
    this.finance,
    this.marketing,
    this.operations,
    this.research,
    this.compliance,
    this.communication,
    this.creativity,
    this.analytical,
    this.customerService,
  ];
  const sum = skills.reduce((acc, skill) => acc + skill, 0);
  return Math.round(sum / skills.length);
});

/**
 * Pre-save hook: Calculate retention risk
 * 
 * Retention risk = f(satisfaction, loyalty, market conditions)
 * Higher satisfaction and loyalty = lower risk
 */
EmployeeSchema.pre<IEmployee>('save', function (next) {
  // Calculate retention risk (inverse of satisfaction and loyalty)
  const satisfactionFactor = (100 - this.satisfaction) * 0.5;
  const loyaltyFactor = (100 - this.loyalty) * 0.3;
  const moraleFactor = (100 - this.morale) * 0.2;
  
  this.retentionRisk = Math.min(100, Math.max(0, satisfactionFactor + loyaltyFactor + moraleFactor));
  
  // Calculate poach resistance (combination of loyalty, compensation, satisfaction)
  this.poachResistance = Math.min(100, Math.max(0, 
    (this.loyalty * 0.5) + (this.satisfaction * 0.3) + (this.morale * 0.2)
  ));
  
  next();
});

/**
 * Employee model
 * 
 * @example
 * ```typescript
 * import Employee from '@/lib/db/models/Employee';
 * import { generateEmployee } from '@/lib/utils/random';
 * 
 * // Generate and create employee
 * const employeeData = generateEmployee('SoftwareEngineer', 70);
 * const employee = await Employee.create({
 *   ...employeeData,
 *   company: companyId,
 * });
 * 
 * // Find company's active employees
 * const activeEmployees = await Employee.find({
 *   company: companyId,
 *   firedAt: null
 * }).sort({ performanceRating: -1 });
 * 
 * // Fire employee
 * await employee.updateOne({ firedAt: new Date() });
 * 
 * // Enroll in training
 * await employee.updateOne({
 *   $push: {
 *     trainingHistory: {
 *       programName: 'Advanced Python',
 *       type: 'Technical',
 *       startDate: new Date(),
 *       durationDays: 30,
 *       cost: 3000,
 *       skillGain: { technical: 10 },
 *       capIncrease: { technical: 5 },
 *     }
 *   },
 *   $inc: { 
 *     totalTrainingInvestment: 3000,
 *     technical: 10 
 *   }
 * });
 * ```
 */
const Employee: Model<IEmployee> =
  mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);

export default Employee;
