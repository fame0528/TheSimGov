/**
 * @fileoverview Department Validation Schemas
 * @module lib/validations/department
 * 
 * OVERVIEW:
 * Zod validation schemas for Department-related inputs and operations.
 * Provides runtime validation with TypeScript type inference for all department operations.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const DepartmentTypeSchema = z.enum(['finance', 'hr', 'marketing', 'rd']);
export const DepartmentNameSchema = z.enum(['Finance', 'HR', 'Marketing', 'R&D']);

// ============================================================================
// SHARED SCHEMAS
// ============================================================================

export const KPIsSchema = z.object({
  efficiency: z.number().min(0).max(100),
  performance: z.number().min(0).max(100),
  roi: z.number(),
  utilization: z.number().min(0).max(100),
  quality: z.number().min(0).max(100),
});

// ============================================================================
// FINANCE SCHEMAS
// ============================================================================

export const LoanTypeSchema = z.enum(['working-capital', 'expansion', 'equipment', 'bridge']);
export const LoanStatusSchema = z.enum(['pending', 'active', 'paid-off', 'defaulted']);

export const LoanApplicationSchema = z.object({
  companyId: z.string().min(1),
  loanType: LoanTypeSchema,
  amount: z.number().min(1000).max(10000000),
  termMonths: z.number().min(6).max(360),
});

export const LoanSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  loanType: LoanTypeSchema,
  amount: z.number().min(0),
  interestRate: z.number().min(0).max(30),
  termMonths: z.number().min(1),
  monthlyPayment: z.number().min(0),
  remainingBalance: z.number().min(0),
  status: LoanStatusSchema,
  startDate: z.date(),
  endDate: z.date(),
});

export const InvestmentTypeSchema = z.enum(['stocks', 'bonds', 'real-estate', 'venture']);
export const RiskLevelSchema = z.enum(['low', 'medium', 'high']);

export const InvestmentInputSchema = z.object({
  companyId: z.string().min(1),
  investmentType: InvestmentTypeSchema,
  amount: z.number().min(1000).max(5000000),
  riskLevel: RiskLevelSchema,
});

export const InvestmentSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  investmentType: InvestmentTypeSchema,
  amount: z.number().min(0),
  currentValue: z.number().min(0),
  returnRate: z.number(),
  riskLevel: RiskLevelSchema,
  purchaseDate: z.date(),
  maturityDate: z.date().optional(),
});

export const PLReportSchema = z.object({
  departmentId: z.string().min(1),
  companyId: z.string().min(1),
  period: z.enum(['monthly', 'quarterly', 'annual']),
  startDate: z.date(),
  endDate: z.date(),
  revenue: z.object({
    contracts: z.number().min(0),
    investments: z.number().min(0),
    other: z.number().min(0),
    total: z.number().min(0),
  }),
  expenses: z.object({
    salaries: z.number().min(0),
    departments: z.number().min(0),
    loans: z.number().min(0),
    operations: z.number().min(0),
    other: z.number().min(0),
    total: z.number().min(0),
  }),
  profit: z.number(),
  profitMargin: z.number(),
  cashflow: z.object({
    operating: z.number(),
    investing: z.number(),
    financing: z.number(),
    net: z.number(),
  }),
});

export const CashflowForecastSchema = z.object({
  departmentId: z.string().min(1),
  companyId: z.string().min(1),
  forecastPeriod: z.enum(['7day', '30day', '90day']),
  currentCash: z.number().min(0),
  projectedInflows: z.number().min(0),
  projectedOutflows: z.number().min(0),
  projectedEndingCash: z.number(),
  burnRate: z.number(),
  runwayDays: z.number().min(0),
  alerts: z.array(z.object({
    type: z.enum(['critical', 'warning', 'info']),
    message: z.string().min(1),
  })),
});

// ============================================================================
// HR SCHEMAS
// ============================================================================

export const TrainingProgramStatusSchema = z.enum(['scheduled', 'active', 'completed', 'cancelled']);

export const CreateTrainingProgramSchema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(3).max(100),
  skillTarget: z.string().min(1),
  duration: z.number().min(1).max(52), // weeks
  cost: z.number().min(100).max(100000),
  capacity: z.number().min(1).max(100),
});

export const TrainingProgramSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  name: z.string().min(3).max(100),
  skillTarget: z.string().min(1),
  duration: z.number().min(1),
  cost: z.number().min(0),
  capacity: z.number().min(1),
  enrolled: z.number().min(0),
  startDate: z.date(),
  endDate: z.date(),
  status: TrainingProgramStatusSchema,
});

export const RecruitmentCampaignStatusSchema = z.enum(['active', 'completed', 'cancelled']);

export const CreateRecruitmentCampaignSchema = z.object({
  companyId: z.string().min(1),
  role: z.string().min(3).max(100),
  positions: z.number().min(1).max(100),
  budget: z.number().min(1000).max(500000),
  duration: z.number().min(1).max(26), // weeks
});

export const RecruitmentCampaignSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  role: z.string().min(3).max(100),
  positions: z.number().min(1),
  budget: z.number().min(0),
  duration: z.number().min(1),
  applicants: z.number().min(0),
  hired: z.number().min(0),
  startDate: z.date(),
  status: RecruitmentCampaignStatusSchema,
});

export const SkillInventorySchema = z.object({
  skill: z.string().min(1),
  employeeCount: z.number().min(0),
  avgLevel: z.number().min(1).max(5),
});

// ============================================================================
// MARKETING SCHEMAS
// ============================================================================

export const CampaignTypeSchema = z.enum([
  'brand-awareness',
  'lead-generation',
  'customer-retention',
  'product-launch'
]);

export const CampaignStatusSchema = z.enum(['planned', 'active', 'completed', 'cancelled']);

export const CreateMarketingCampaignSchema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(3).max(100),
  campaignType: CampaignTypeSchema,
  budget: z.number().min(1000).max(1000000),
  duration: z.number().min(1).max(52), // weeks
});

export const MarketingCampaignSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  name: z.string().min(3).max(100),
  campaignType: CampaignTypeSchema,
  budget: z.number().min(0),
  duration: z.number().min(1),
  reach: z.number().min(0),
  conversions: z.number().min(0),
  roi: z.number(),
  startDate: z.date(),
  endDate: z.date(),
  status: CampaignStatusSchema,
});

// ============================================================================
// R&D SCHEMAS
// ============================================================================

export const ResearchCategorySchema = z.enum(['product', 'process', 'technology', 'sustainability']);
export const ResearchStatusSchema = z.enum(['active', 'completed', 'failed', 'cancelled']);

export const CreateResearchProjectSchema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(3).max(100),
  category: ResearchCategorySchema,
  budget: z.number().min(10000).max(5000000),
  duration: z.number().min(4).max(104), // weeks (1-24 months)
  successChance: z.number().min(10).max(95),
  potentialImpact: z.number().min(1).max(5),
});

export const ResearchProjectSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  name: z.string().min(3).max(100),
  category: ResearchCategorySchema,
  budget: z.number().min(0),
  duration: z.number().min(1),
  progress: z.number().min(0).max(100),
  successChance: z.number().min(0).max(100),
  potentialImpact: z.number().min(1).max(5),
  startDate: z.date(),
  status: ResearchStatusSchema,
});

export const PatentStatusSchema = z.enum(['pending', 'granted', 'expired', 'rejected']);

export const PatentSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  name: z.string().min(3).max(100),
  category: z.string().min(1),
  value: z.number().min(0),
  filingDate: z.date(),
  grantedDate: z.date().optional(),
  expirationDate: z.date(),
  status: PatentStatusSchema,
});

// ============================================================================
// CORE DEPARTMENT SCHEMAS
// ============================================================================

export const CreateDepartmentSchema = z.object({
  companyId: z.string().min(1),
  type: DepartmentTypeSchema,
  name: DepartmentNameSchema,
  budget: z.number().min(0).optional(),
  budgetPercentage: z.number().min(0).max(100).optional(),
});

export const UpdateDepartmentSchema = z.object({
  budget: z.number().min(0).optional(),
  budgetPercentage: z.number().min(0).max(100).optional(),
  kpis: KPIsSchema.partial().optional(),
  
  // Finance fields
  totalRevenue: z.number().min(0).optional(),
  totalExpenses: z.number().min(0).optional(),
  creditScore: z.number().min(300).max(850).optional(),
  cashReserves: z.number().min(0).optional(),
  
  // HR fields
  totalEmployees: z.number().min(0).optional(),
  employeeTurnover: z.number().min(0).max(100).optional(),
  avgSalary: z.number().min(0).optional(),
  trainingBudget: z.number().min(0).optional(),
  
  // Marketing fields
  brandValue: z.number().min(0).optional(),
  customerBase: z.number().min(0).optional(),
  marketShare: z.number().min(0).max(100).optional(),
  customerAcquisitionCost: z.number().min(0).optional(),
  customerLifetimeValue: z.number().min(0).optional(),
  
  // R&D fields
  innovationPoints: z.number().min(0).optional(),
  researchSpeed: z.number().min(0).max(100).optional(),
  techLevel: z.number().min(1).max(10).optional(),
});

export const DepartmentQuerySchema = z.object({
  companyId: z.string().min(1),
  type: DepartmentTypeSchema.optional(),
});

// ============================================================================
// ANALYTICS SCHEMAS
// ============================================================================

export const DepartmentAnalyticsSchema = z.object({
  departmentId: z.string().min(1),
  companyId: z.string().min(1),
  period: z.enum(['week', 'month', 'quarter', 'year']),
  startDate: z.date(),
  endDate: z.date(),
  kpiTrends: z.object({
    efficiency: z.array(z.number()),
    performance: z.array(z.number()),
    roi: z.array(z.number()),
    utilization: z.array(z.number()),
    quality: z.array(z.number()),
  }),
  financials: z.object({
    revenue: z.array(z.number()),
    expenses: z.array(z.number()),
    profit: z.array(z.number()),
  }).optional(),
  headcount: z.object({
    total: z.array(z.number()),
    turnover: z.array(z.number()),
  }).optional(),
  marketing: z.object({
    customerBase: z.array(z.number()),
    marketShare: z.array(z.number()),
    brandValue: z.array(z.number()),
  }).optional(),
  research: z.object({
    innovationPoints: z.array(z.number()),
    techLevel: z.array(z.number()),
    patents: z.array(z.number()),
  }).optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type DepartmentType = z.infer<typeof DepartmentTypeSchema>;
export type DepartmentName = z.infer<typeof DepartmentNameSchema>;
export type KPIs = z.infer<typeof KPIsSchema>;

export type LoanType = z.infer<typeof LoanTypeSchema>;
export type LoanStatus = z.infer<typeof LoanStatusSchema>;
export type LoanApplication = z.infer<typeof LoanApplicationSchema>;
export type Loan = z.infer<typeof LoanSchema>;

export type InvestmentType = z.infer<typeof InvestmentTypeSchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
export type InvestmentInput = z.infer<typeof InvestmentInputSchema>;
export type Investment = z.infer<typeof InvestmentSchema>;

export type PLReport = z.infer<typeof PLReportSchema>;
export type CashflowForecast = z.infer<typeof CashflowForecastSchema>;

export type TrainingProgramStatus = z.infer<typeof TrainingProgramStatusSchema>;
export type CreateTrainingProgram = z.infer<typeof CreateTrainingProgramSchema>;
export type TrainingProgram = z.infer<typeof TrainingProgramSchema>;

export type RecruitmentCampaignStatus = z.infer<typeof RecruitmentCampaignStatusSchema>;
export type CreateRecruitmentCampaign = z.infer<typeof CreateRecruitmentCampaignSchema>;
export type RecruitmentCampaign = z.infer<typeof RecruitmentCampaignSchema>;

export type CampaignType = z.infer<typeof CampaignTypeSchema>;
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;
export type CreateMarketingCampaign = z.infer<typeof CreateMarketingCampaignSchema>;
export type MarketingCampaign = z.infer<typeof MarketingCampaignSchema>;

export type ResearchCategory = z.infer<typeof ResearchCategorySchema>;
export type ResearchStatus = z.infer<typeof ResearchStatusSchema>;
export type CreateResearchProject = z.infer<typeof CreateResearchProjectSchema>;
export type ResearchProject = z.infer<typeof ResearchProjectSchema>;

export type PatentStatus = z.infer<typeof PatentStatusSchema>;
export type Patent = z.infer<typeof PatentSchema>;

export type CreateDepartment = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartment = z.infer<typeof UpdateDepartmentSchema>;
export type DepartmentQuery = z.infer<typeof DepartmentQuerySchema>;
export type DepartmentAnalytics = z.infer<typeof DepartmentAnalyticsSchema>;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Runtime Validation**: Zod provides type safety + runtime checks
 * 2. **Type Inference**: All types automatically inferred from schemas
 * 3. **Reusability**: Shared schemas prevent duplication
 * 4. **Constraints**: Business rules enforced (min/max values)
 * 5. **Enums**: Type-safe enums for all categorical fields
 * 
 * USAGE EXAMPLES:
 * ```ts
 * // Validate loan application
 * const result = LoanApplicationSchema.safeParse(input);
 * if (!result.success) {
 *   return { error: result.error.errors };
 * }
 * 
 * // Type inference
 * const loan: Loan = result.data; // Fully typed!
 * ```
 * 
 * PREVENTS:
 * - Invalid input data reaching database
 * - Type mismatches between API and database
 * - Missing required fields
 * - Out-of-range values (negative budgets, invalid percentages)
 */
