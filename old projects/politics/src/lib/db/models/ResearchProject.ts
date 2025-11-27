/**
 * @file src/lib/db/models/ResearchProject.ts
 * @description ResearchProject Mongoose schema for company R&D initiatives
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * ResearchProject model representing R&D initiatives managed by company R&D departments.
 * Supports 7 project types (Product Innovation, Process Improvement, Technology Research,
 * Patent Development, Market Research, Sustainability, AI/ML) with multi-stage progression
 * (Concept → Research → Development → Testing → Completed). Projects consume budget over time,
 * generate patents/IP, unlock technology advancements, and provide breakthrough moments that
 * create competitive advantages.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
 * - department: Reference to R&D Department (required, indexed)
 * - name: Project name (e.g., "Next-Gen Battery Technology")
 * - projectType: Type of research (7 types)
 * - status: Project lifecycle state (Concept, Research, Development, Testing, Completed, Cancelled, OnHold)
 * - priority: Project priority (Low, Medium, High, Critical)
 * - budget: Total project budget ($10,000-$10,000,000)
 * - spent: Amount spent so far
 * - startDate: Project start date
 * - estimatedCompletion: Expected completion date
 * - actualCompletion: Actual completion date
 * - duration: Project length in months
 * 
 * Progress:
 * - phase: Current project phase (Concept, Research, Development, Testing, Commercialization)
 * - progress: Overall progress percentage (0-100)
 * - researchProgress: Research phase progress (0-100)
 * - developmentProgress: Development phase progress (0-100)
 * - testingProgress: Testing phase progress (0-100)
 * - milestones: Array of milestone objects { name, completed, date }
 * - blockers: Current blockers/challenges
 * 
 * Team:
 * - leadResearcher: Employee leading project (required)
 * - teamSize: Number of researchers (1-50)
 * - requiredSkills: Skills needed (research, technical, analytical, creativity)
 * - teamSkillLevel: Average team skill level (0-100)
 * 
 * Innovation:
 * - innovationScore: Innovation potential (0-100)
 * - technologyLevel: Target technology level (1-10)
 * - breakthroughPotential: Probability of major breakthrough (0-100%)
 * - breakthroughAchieved: Whether breakthrough occurred
 * - breakthroughType: Type of breakthrough (None, Minor, Major, Revolutionary)
 * - patentsPending: Number of patent applications
 * - patentsGranted: Number of patents received
 * - intellectualProperty: Array of IP created
 * 
 * Impact:
 * - marketImpact: Potential market impact (0-100)
 * - revenueProjection: Projected annual revenue from project
 * - costSavings: Projected annual cost savings
 * - competitiveAdvantage: Competitive edge gained (0-50 points)
 * - industryDisruption: Industry disruption potential (0-100)
 * - sustainabilityImpact: Environmental/social impact (0-100)
 * 
 * Risks:
 * - riskLevel: Project risk assessment (Low, Medium, High, VeryHigh)
 * - technicalRisk: Technical feasibility risk (0-100)
 * - marketRisk: Market acceptance risk (0-100)
 * - financialRisk: Budget overrun risk (0-100)
 * - regulatoryRisk: Regulatory/compliance risk (0-100)
 * - failureProbability: Overall failure probability (0-100%)
 * 
 * Outcomes:
 * - successLevel: Project success rating (Failed, PartialSuccess, Success, ExceptionalSuccess)
 * - productsCreated: Number of products resulting from project
 * - processImprovements: Number of process optimizations
 * - publicationCount: Research papers published
 * - citationCount: Citations of research
 * - commercialized: Whether project resulted in commercial product
 * 
 * Resources:
 * - equipmentNeeded: Equipment requirements
 * - materialsNeeded: Materials requirements
 * - externalCollaboration: Partnerships (Universities, Research Labs, Competitors)
 * - fundingSource: Funding type (Internal, GrantsGovernment, VentureCapital, CustomerFunded)
 * 
 * USAGE:
 * ```typescript
 * import ResearchProject from '@/lib/db/models/ResearchProject';
 * 
 * // Create research project
 * const project = await ResearchProject.create({
 *   company: companyId,
 *   department: rdDeptId,
 *   name: "AI-Powered Automation Platform",
 *   projectType: 'AI/ML',
 *   status: 'Concept',
 *   priority: 'High',
 *   budget: 2000000,
 *   spent: 0,
 *   startDate: new Date(),
 *   duration: 24,
 *   leadResearcher: employeeId,
 *   teamSize: 8,
 *   innovationScore: 85,
 *   technologyLevel: 9
 * });
 * 
 * // Advance to research phase
 * await project.updateOne({
 *   status: 'Research',
 *   phase: 'Research',
 *   $inc: { progress: 10, researchProgress: 25, spent: 150000 }
 * });
 * 
 * // Achieve breakthrough
 * await project.updateOne({
 *   breakthroughAchieved: true,
 *   breakthroughType: 'Major',
 *   $inc: {
 *     innovationScore: 15,
 *     patentsPending: 3,
 *     competitiveAdvantage: 20
 *   }
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Project progression: Concept (0-20%) → Research (20-40%) → Development (40-70%) → Testing (70-95%) → Completed (100%)
 * - Innovation score determines breakthrough probability and competitive advantage
 * - Technology level unlocks new capabilities (Level 1-3: Basic, 4-6: Intermediate, 7-8: Advanced, 9-10: Cutting-Edge)
 * - Breakthrough types: Minor (+5 innovation, +5 competitive), Major (+15 innovation, +20 competitive), Revolutionary (+30 innovation, +50 competitive)
 * - Budget overruns common (30% probability of 10-50% over budget)
 * - Team skill level impacts success rate (60+ = 80% success, 80+ = 95% success)
 * - High-risk projects (risk 70+) have 40% failure rate but 3x reward on success
 * - Patent applications take 12-24 months to grant (approval probability 60-90%)
 * - Commercialized projects generate revenue = revenueProjection * commercializationSuccess (0.3-1.5x)
 * - Industry disruption (80+) can shift entire market dynamics (reputation +30, market share +10%)
 * - External collaborations reduce cost 15-30% but share IP ownership (50-70% ownership)
 * - Project cancellation loses 80% of spent budget (salvage 20% via equipment/IP resale)
 * - On-hold projects cost 5% monthly maintenance but preserve progress
 * - Exceptional success unlocks follow-up projects with 50% budget efficiency bonus
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Project types
 */
export type ProjectType =
  | 'ProductInnovation'    // New product development
  | 'ProcessImprovement'   // Optimize existing processes
  | 'TechnologyResearch'   // Fundamental technology research
  | 'PatentDevelopment'    // Patent/IP creation
  | 'MarketResearch'       // Market analysis
  | 'Sustainability'       // Environmental initiatives
  | 'AI/ML';               // AI/Machine Learning

/**
 * Project status
 */
export type ProjectStatus =
  | 'Concept'              // Initial concept phase
  | 'Research'             // Research phase
  | 'Development'          // Development phase
  | 'Testing'              // Testing/validation phase
  | 'Completed'            // Successfully completed
  | 'Cancelled'            // Cancelled before completion
  | 'OnHold';              // Temporarily paused

/**
 * Project priority
 */
export type ProjectPriority =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical';

/**
 * Project phase
 */
export type ProjectPhase =
  | 'Concept'
  | 'Research'
  | 'Development'
  | 'Testing'
  | 'Commercialization';

/**
 * Breakthrough type
 */
export type BreakthroughType =
  | 'None'                 // No breakthrough
  | 'Minor'                // Small improvement
  | 'Major'                // Significant advancement
  | 'Revolutionary';       // Game-changing innovation

/**
 * Risk level
 */
export type RiskLevel =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'VeryHigh';

/**
 * Success level
 */
export type SuccessLevel =
  | 'Failed'
  | 'PartialSuccess'
  | 'Success'
  | 'ExceptionalSuccess';

/**
 * Funding source
 */
export type FundingSource =
  | 'Internal'             // Company funding
  | 'GrantsGovernment'     // Government grants
  | 'VentureCapital'       // VC funding
  | 'CustomerFunded';      // Customer contracts

/**
 * Milestone interface
 */
export interface IMilestone {
  name: string;
  completed: boolean;
  date?: Date;
}

/**
 * ResearchProject document interface
 * 
 * @interface IResearchProject
 * @extends {Document}
 */
export interface IResearchProject extends Document {
  // Core
  company: Types.ObjectId;
  department: Types.ObjectId;
  name: string;
  projectType: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  budget: number;
  spent: number;
  startDate: Date;
  estimatedCompletion: Date;
  actualCompletion?: Date;
  duration: number;

  // Progress
  phase: ProjectPhase;
  progress: number;
  researchProgress: number;
  developmentProgress: number;
  testingProgress: number;
  milestones: IMilestone[];
  blockers: string;

  // Team
  leadResearcher: Types.ObjectId;
  teamSize: number;
  requiredSkills: string[];
  teamSkillLevel: number;

  // Innovation
  innovationScore: number;
  technologyLevel: number;
  breakthroughPotential: number;
  breakthroughAchieved: boolean;
  breakthroughType: BreakthroughType;
  patentsPending: number;
  patentsGranted: number;
  intellectualProperty: string[];

  // Impact
  marketImpact: number;
  revenueProjection: number;
  costSavings: number;
  competitiveAdvantage: number;
  industryDisruption: number;
  sustainabilityImpact: number;

  // Risks
  riskLevel: RiskLevel;
  technicalRisk: number;
  marketRisk: number;
  financialRisk: number;
  regulatoryRisk: number;
  failureProbability: number;

  // Outcomes
  successLevel: SuccessLevel;
  productsCreated: number;
  processImprovements: number;
  publicationCount: number;
  citationCount: number;
  commercialized: boolean;

  // Resources
  equipmentNeeded: string;
  materialsNeeded: string;
  externalCollaboration: string[];
  fundingSource: FundingSource;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  monthsRemaining: number;
  isActive: boolean;
  budgetRemaining: number;
  overBudget: boolean;
  estimatedROI: number;
}

/**
 * ResearchProject schema definition
 */
const ResearchProjectSchema = new Schema<IResearchProject>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [3, 'Project name must be at least 3 characters'],
      maxlength: [150, 'Project name cannot exceed 150 characters'],
    },
    projectType: {
      type: String,
      required: [true, 'Project type is required'],
      enum: {
        values: ['ProductInnovation', 'ProcessImprovement', 'TechnologyResearch', 'PatentDevelopment', 'MarketResearch', 'Sustainability', 'AI/ML'],
        message: '{VALUE} is not a valid project type',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Concept', 'Research', 'Development', 'Testing', 'Completed', 'Cancelled', 'OnHold'],
        message: '{VALUE} is not a valid project status',
      },
      default: 'Concept',
      index: true,
    },
    priority: {
      type: String,
      required: true,
      enum: {
        values: ['Low', 'Medium', 'High', 'Critical'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'Medium',
      index: true,
    },
    budget: {
      type: Number,
      required: [true, 'Project budget is required'],
      min: [10000, 'Minimum project budget is $10,000'],
      max: [10000000, 'Maximum project budget is $10,000,000'],
    },
    spent: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Spent amount cannot be negative'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    estimatedCompletion: {
      type: Date,
      required: [true, 'Estimated completion date is required'],
      index: true,
    },
    actualCompletion: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      required: [true, 'Project duration is required'],
      min: [1, 'Project must be at least 1 month'],
      max: [60, 'Project cannot exceed 60 months (5 years)'],
    },

    // Progress
    phase: {
      type: String,
      required: true,
      enum: {
        values: ['Concept', 'Research', 'Development', 'Testing', 'Commercialization'],
        message: '{VALUE} is not a valid project phase',
      },
      default: 'Concept',
    },
    progress: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100%'],
    },
    researchProgress: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Research progress cannot be negative'],
      max: [100, 'Research progress cannot exceed 100%'],
    },
    developmentProgress: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Development progress cannot be negative'],
      max: [100, 'Development progress cannot exceed 100%'],
    },
    testingProgress: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Testing progress cannot be negative'],
      max: [100, 'Testing progress cannot exceed 100%'],
    },
    milestones: {
      type: [
        {
          name: { type: String, required: true },
          completed: { type: Boolean, required: true, default: false },
          date: { type: Date, default: null },
        },
      ],
      default: [],
    },
    blockers: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Blockers description cannot exceed 500 characters'],
    },

    // Team
    leadResearcher: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Lead researcher is required'],
      index: true,
    },
    teamSize: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Team size must be at least 1'],
      max: [50, 'Team size cannot exceed 50'],
    },
    requiredSkills: {
      type: [String],
      default: ['research', 'technical', 'analytical'],
      validate: {
        validator: function (arr: string[]) {
          return arr.length > 0 && arr.length <= 10;
        },
        message: 'Must have 1-10 required skills',
      },
    },
    teamSkillLevel: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Team skill level cannot be negative'],
      max: [100, 'Team skill level cannot exceed 100'],
    },

    // Innovation
    innovationScore: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Innovation score cannot be negative'],
      max: [100, 'Innovation score cannot exceed 100'],
    },
    technologyLevel: {
      type: Number,
      required: true,
      default: 5,
      min: [1, 'Technology level must be at least 1'],
      max: [10, 'Technology level cannot exceed 10'],
    },
    breakthroughPotential: {
      type: Number,
      required: true,
      default: 30,
      min: [0, 'Breakthrough potential cannot be negative'],
      max: [100, 'Breakthrough potential cannot exceed 100%'],
    },
    breakthroughAchieved: {
      type: Boolean,
      required: true,
      default: false,
    },
    breakthroughType: {
      type: String,
      required: true,
      enum: {
        values: ['None', 'Minor', 'Major', 'Revolutionary'],
        message: '{VALUE} is not a valid breakthrough type',
      },
      default: 'None',
    },
    patentsPending: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Patents pending cannot be negative'],
    },
    patentsGranted: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Patents granted cannot be negative'],
    },
    intellectualProperty: {
      type: [String],
      default: [],
    },

    // Impact
    marketImpact: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Market impact cannot be negative'],
      max: [100, 'Market impact cannot exceed 100'],
    },
    revenueProjection: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Revenue projection cannot be negative'],
    },
    costSavings: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Cost savings cannot be negative'],
    },
    competitiveAdvantage: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Competitive advantage cannot be negative'],
      max: [50, 'Competitive advantage cannot exceed 50 points'],
    },
    industryDisruption: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Industry disruption cannot be negative'],
      max: [100, 'Industry disruption cannot exceed 100'],
    },
    sustainabilityImpact: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Sustainability impact cannot be negative'],
      max: [100, 'Sustainability impact cannot exceed 100'],
    },

    // Risks
    riskLevel: {
      type: String,
      required: true,
      enum: {
        values: ['Low', 'Medium', 'High', 'VeryHigh'],
        message: '{VALUE} is not a valid risk level',
      },
      default: 'Medium',
    },
    technicalRisk: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Technical risk cannot be negative'],
      max: [100, 'Technical risk cannot exceed 100'],
    },
    marketRisk: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Market risk cannot be negative'],
      max: [100, 'Market risk cannot exceed 100'],
    },
    financialRisk: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Financial risk cannot be negative'],
      max: [100, 'Financial risk cannot exceed 100'],
    },
    regulatoryRisk: {
      type: Number,
      required: true,
      default: 30,
      min: [0, 'Regulatory risk cannot be negative'],
      max: [100, 'Regulatory risk cannot exceed 100'],
    },
    failureProbability: {
      type: Number,
      required: true,
      default: 30,
      min: [0, 'Failure probability cannot be negative'],
      max: [100, 'Failure probability cannot exceed 100%'],
    },

    // Outcomes
    successLevel: {
      type: String,
      required: true,
      enum: {
        values: ['Failed', 'PartialSuccess', 'Success', 'ExceptionalSuccess'],
        message: '{VALUE} is not a valid success level',
      },
      default: 'Success',
    },
    productsCreated: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Products created cannot be negative'],
    },
    processImprovements: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Process improvements cannot be negative'],
    },
    publicationCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Publication count cannot be negative'],
    },
    citationCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Citation count cannot be negative'],
    },
    commercialized: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Resources
    equipmentNeeded: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Equipment description cannot exceed 500 characters'],
    },
    materialsNeeded: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Materials description cannot exceed 500 characters'],
    },
    externalCollaboration: {
      type: [String],
      default: [],
    },
    fundingSource: {
      type: String,
      required: true,
      enum: {
        values: ['Internal', 'GrantsGovernment', 'VentureCapital', 'CustomerFunded'],
        message: '{VALUE} is not a valid funding source',
      },
      default: 'Internal',
    },
  },
  {
    timestamps: true,
    collection: 'researchprojects',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
ResearchProjectSchema.index({ company: 1, status: 1 }); // Active projects per company
ResearchProjectSchema.index({ department: 1, status: 1 }); // Projects per department
ResearchProjectSchema.index({ company: 1, projectType: 1 }); // Projects by type
ResearchProjectSchema.index({ priority: 1, status: 1 }); // High-priority active projects

/**
 * Virtual field: monthsRemaining
 */
ResearchProjectSchema.virtual('monthsRemaining').get(function (this: IResearchProject): number {
  if (this.status === 'Completed' || this.status === 'Cancelled') return 0;
  const monthsDiff = Math.floor(
    (this.estimatedCompletion.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
  );
  return Math.max(0, monthsDiff);
});

/**
 * Virtual field: isActive
 */
ResearchProjectSchema.virtual('isActive').get(function (this: IResearchProject): boolean {
  return ['Research', 'Development', 'Testing'].includes(this.status);
});

/**
 * Virtual field: budgetRemaining
 */
ResearchProjectSchema.virtual('budgetRemaining').get(function (this: IResearchProject): number {
  return Math.max(0, this.budget - this.spent);
});

/**
 * Virtual field: overBudget
 */
ResearchProjectSchema.virtual('overBudget').get(function (this: IResearchProject): boolean {
  return this.spent > this.budget;
});

/**
 * Virtual field: estimatedROI
 * ROI estimate based on revenue projection + cost savings vs budget
 */
ResearchProjectSchema.virtual('estimatedROI').get(function (this: IResearchProject): number {
  if (this.budget === 0) return 0;
  const totalBenefit = this.revenueProjection + this.costSavings;
  return ((totalBenefit - this.budget) / this.budget) * 100;
});

/**
 * Pre-save hook: Calculate failure probability and risk level
 */
ResearchProjectSchema.pre<IResearchProject>('save', function (next) {
  // Calculate overall failure probability from individual risks
  const avgRisk =
    (this.technicalRisk + this.marketRisk + this.financialRisk + this.regulatoryRisk) / 4;
  
  // Adjust based on team skill level and innovation score
  const skillBonus = (this.teamSkillLevel - 50) / 2; // -25 to +25
  const innovationPenalty = (this.innovationScore - 50) / 5; // -10 to +10 (higher innovation = higher risk)
  
  this.failureProbability = Math.max(
    0,
    Math.min(100, avgRisk + innovationPenalty - skillBonus)
  );

  // Set risk level based on failure probability
  if (this.failureProbability < 25) {
    this.riskLevel = 'Low';
  } else if (this.failureProbability < 50) {
    this.riskLevel = 'Medium';
  } else if (this.failureProbability < 75) {
    this.riskLevel = 'High';
  } else {
    this.riskLevel = 'VeryHigh';
  }

  // Calculate estimated completion if not set
  if (!this.estimatedCompletion) {
    const completion = new Date(this.startDate);
    completion.setMonth(completion.getMonth() + this.duration);
    this.estimatedCompletion = completion;
  }

  next();
});

/**
 * ResearchProject model
 * 
 * @example
 * ```typescript
 * import ResearchProject from '@/lib/db/models/ResearchProject';
 * 
 * // Create research project
 * const project = await ResearchProject.create({
 *   company: companyId,
 *   department: rdDeptId,
 *   name: "Quantum Computing Processor",
 *   projectType: 'TechnologyResearch',
 *   priority: 'Critical',
 *   budget: 5000000,
 *   startDate: new Date(),
 *   duration: 36,
 *   leadResearcher: employeeId,
 *   teamSize: 15,
 *   innovationScore: 95,
 *   technologyLevel: 10,
 *   breakthroughPotential: 80,
 *   technicalRisk: 85,
 *   marketRisk: 60
 * });
 * 
 * // Find active high-priority projects
 * const criticalProjects = await ResearchProject.find({
 *   company: companyId,
 *   priority: 'Critical',
 *   status: { $in: ['Research', 'Development', 'Testing'] }
 * }).populate('leadResearcher department');
 * 
 * // Advance project progress
 * await project.updateOne({
 *   status: 'Development',
 *   phase: 'Development',
 *   $inc: {
 *     progress: 15,
 *     developmentProgress: 40,
 *     spent: 450000
 *   }
 * });
 * ```
 */
const ResearchProject: Model<IResearchProject> =
  mongoose.models.ResearchProject ||
  mongoose.model<IResearchProject>('ResearchProject', ResearchProjectSchema);

export default ResearchProject;
