/**
 * @fileoverview Department Type Definitions
 * @module lib/types/department
 * 
 * OVERVIEW:
 * TypeScript types and interfaces for company departments (Finance, HR, Marketing, R&D).
 * Provides type safety for department operations, metrics, and department-specific data.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

/**
 * Department type enum
 */
export enum DepartmentType {
  FINANCE = 'finance',
  HR = 'hr',
  MARKETING = 'marketing',
  RD = 'rd',
}

/**
 * Department name enum
 */
export enum DepartmentName {
  FINANCE = 'Finance',
  HR = 'HR',
  MARKETING = 'Marketing',
  RD = 'R&D',
}

/**
 * Department level (1-5)
 */
export type DepartmentLevel = 1 | 2 | 3 | 4 | 5;

/**
 * KPIs interface for type safety
 */
export interface KPIs {
  efficiency: number;
  performance: number;
  roi: number;
  utilization: number;
  quality: number;
}

/**
 * Skill inventory entry
 */
export interface SkillInventory {
  skill: string;
  employeeCount: number;
  avgLevel: number;
}

/**
 * Core Department Interface
 * Base fields shared by all departments
 */
export interface Department {
  id: string;
  companyId: string;
  userId: string;
  name: DepartmentName;
  type: DepartmentType;
  level: DepartmentLevel;
  budget: number;
  budgetPercentage: number;
  staff: string[]; // Employee IDs
  headId?: string; // Department head employee ID
  active: boolean;
  established: Date;
  
  // Performance Metrics (KPIs) - nested object to match schema
  kpis: KPIs;
  
  // Financial Tracking
  totalRevenue: number;
  totalExpenses: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  profitMargin: number;
  
  // Optional department-specific properties (for type compatibility)
  // Finance
  creditScore?: number;
  loans?: Loan[];
  investments?: Investment[];
  
  // HR
  totalEmployees?: number;
  recruitment?: RecruitmentCampaign[];
  training?: TrainingProgram[];
  
  // Marketing
  brandValue?: number;
  campaigns?: MarketingCampaign[];
  
  // R&D
  innovationPoints?: number;
  totalInvestment?: number;
  research?: ResearchProject[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Finance Department Specific Fields
 */
export interface FinanceDepartmentData {
  creditScore: number; // 300-850
  debtToEquity: number; // 0-10
  cashReserves: number;
  monthlyBurn: number;
  runwayMonths: number;
  activeLoans: number;
  totalDebt: number;
  interestExpense: number;
  cashflowForecast: {
    sevenDay: number;
    thirtyDay: number;
    ninetyDay: number;
  };
  investmentPortfolio: {
    stocks: number;
    bonds: number;
    realEstate: number;
    indexFunds: number;
    totalValue: number;
  };
  cashflowForecasts?: Array<{
    period: string;
    projected: number;
    actual?: number;
    burnRate: number;
    runway: number;
    alerts: Array<{ type: string; message: string; severity: 'warning' | 'critical' }>;
  }>;
}

/**
 * HR Department Specific Fields
 */
export interface HRDepartmentData {
  headcount: number;
  turnoverRate: number; // 0-100%
  avgSatisfaction: number; // 0-100
  avgProductivity: number; // 0-100
  trainingBudget: number;
  trainingROI: number; // -100 to +500%
  openPositions: number;
  retentionRisk: number; // 0-100
  activeTrainingPrograms: number;
  employeesCertified: number;
}

/**
 * Marketing Department Specific Fields
 */
export interface MarketingDepartmentData {
  brandReputation: number; // 0-100
  marketShare: number; // 0-100%
  customerAcquisitionCost: number;
  lifetimeValue: number;
  activeCampaigns: number;
  totalReach: number;
  conversionRate: number; // 0-100%
  socialMediaFollowers: number;
  customerBase: number;
  brandValue: number;
}

/**
 * R&D Department Specific Fields
 */
export interface RDDepartmentData {
  innovationScore: number; // 0-100
  patentsOwned: number;
  activeProjects: number;
  completedProjects: number;
  technologyLevel: number; // 1-10
  researchEfficiency: number; // 0.5-2.0x
  breakthroughProbability: number; // 0-100%
  pendingPatents: number;
  patentsGranted?: number; // Total patents granted historically
  researchROI?: number; // R&D return on investment (-100 to +500%)
  teamEffectiveness?: number; // Research team effectiveness (0-100)
}

/**
 * Complete Finance Department
 */
export interface FinanceDepartment extends Department {
  type: DepartmentType.FINANCE;
  name: DepartmentName.FINANCE;
  financeData: FinanceDepartmentData;
  
  // Finance-specific arrays from schema
  cashReserves?: number;
  creditScore?: number;
  loans?: Loan[];
  investments?: Investment[];
}

/**
 * Complete HR Department
 */
export interface HRDepartment extends Department {
  type: DepartmentType.HR;
  name: DepartmentName.HR;
  hrData: HRDepartmentData;
  
  // HR-specific properties from schema
  totalEmployees?: number;
  employeeTurnover?: number;
  avgSalary?: number;
  trainingBudget?: number;
  trainingPrograms?: TrainingProgram[];
  recruitmentCampaigns?: RecruitmentCampaign[];
  skillsInventory?: SkillInventory[];
}

/**
 * Complete Marketing Department
 */
export interface MarketingDepartment extends Department {
  type: DepartmentType.MARKETING;
  name: DepartmentName.MARKETING;
  marketingData: MarketingDepartmentData;
  
  // Marketing-specific properties from schema
  brandValue?: number;
  customerBase?: number;
  marketShare?: number;
  campaigns?: MarketingCampaign[];
  customerAcquisitionCost?: number;
  customerLifetimeValue?: number;
}

/**
 * Complete R&D Department
 */
export interface RDDepartment extends Department {
  type: DepartmentType.RD;
  name: DepartmentName.RD;
  rdData: RDDepartmentData;
  
  // R&D-specific properties from schema
  innovationPoints?: number;
  researchSpeed?: number;
  techLevel?: number;
  technologyLevel?: number; // Alias for compatibility
  researchProjects?: ResearchProject[];
  patents?: Patent[];
}

/**
 * Union type for all department types
 */
export type AnyDepartment = FinanceDepartment | HRDepartment | MarketingDepartment | RDDepartment;

/**
 * Department creation input
 */
export interface CreateDepartmentInput {
  companyId: string;
  userId: string;
  type: DepartmentType;
  budget?: number;
  budgetPercentage?: number;
}

/**
 * Department update input
 */
export interface UpdateDepartmentInput {
  budget?: number;
  budgetPercentage?: number;
  headId?: string;
  active?: boolean;
}

/**
 * Budget allocation input
 */
export interface BudgetAllocationInput {
  departmentId: string;
  amount: number;
  percentage?: number;
}

/**
 * Employee assignment input
 */
export interface EmployeeAssignmentInput {
  departmentId: string;
  employeeId: string;
  asHead?: boolean;
}

/**
 * Loan application input (Finance)
 */
export interface LoanApplicationInput {
  companyId: string;
  loanType: 'working-capital' | 'expansion' | 'equipment' | 'bridge';
  amount: number;
  termMonths: number;
}

/**
 * Loan details
 */
export interface Loan {
  id: string;
  companyId: string;
  loanType: 'working-capital' | 'expansion' | 'equipment' | 'bridge';
  amount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  remainingBalance: number;
  status: 'pending' | 'active' | 'paid-off' | 'defaulted';
  startDate: Date;
  endDate: Date;
}

/**
 * Investment input (Finance)
 */
export interface InvestmentInput {
  type: 'stocks' | 'bonds' | 'realEstate' | 'indexFunds';
  amount: number;
}

/**
 * Investment details
 */
export interface Investment {
  id: string;
  companyId: string;
  investmentType: 'stocks' | 'bonds' | 'real-estate' | 'venture';
  amount: number;
  currentValue: number;
  returnRate: number;
  riskLevel: 'low' | 'medium' | 'high';
  purchaseDate: Date;
  maturityDate?: Date;
}

/**
 * Training program input (HR)
 */
export interface TrainingProgramInput {
  name: string;
  description: string;
  skill: string;
  duration: number; // hours
  cost: number;
  maxEnrollment: number;
}

/**
 * Training program
 */
export interface TrainingProgram {
  id: string;
  companyId: string;
  name: string;
  skillTarget: string;
  duration: number;
  cost: number;
  capacity: number;
  enrolled: number;
  startDate: Date;
  endDate: Date;
  status: 'scheduled' | 'active' | 'full' | 'completed' | 'cancelled';
}

/**
 * Training enrollment input
 */
export interface TrainingEnrollmentInput {
  programId: string;
  employeeId: string;
}

/**
 * Recruitment campaign input (HR)
 */
export interface RecruitmentCampaignInput {
  positions: number;
  budget: number;
  targetSkills: string[];
  duration: number; // days
}

/**
 * Recruitment campaign
 */
export interface RecruitmentCampaign {
  id: string;
  companyId: string;
  role: string;
  positions: number;
  budget: number;
  duration: number;
  applicants: number;
  hired: number;
  startDate: Date;
  status: 'active' | 'completed' | 'cancelled';
}

/**
 * Marketing campaign input (Marketing)
 */
export interface MarketingCampaignInput {
  name: string;
  budget: number;
  duration: number; // days
  targetAudience: number;
  goal: 'awareness' | 'acquisition' | 'retention';
}

/**
 * Marketing campaign
 */
export interface MarketingCampaign {
  id: string;
  companyId: string;
  name: string;
  campaignType: 'brand-awareness' | 'lead-generation' | 'customer-retention' | 'product-launch';
  budget: number;
  duration: number;
  reach: number;
  conversions: number;
  roi: number;
  startDate: Date;
  endDate: Date;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
}

/**
 * Research project input (R&D)
 */
export interface ResearchProjectInput {
  name: string;
  description: string;
  budget: number;
  duration: number; // days
  type: 'product' | 'process' | 'technology' | 'patent';
}

/**
 * Research project
 */
export interface ResearchProject {
  id: string;
  companyId: string;
  name: string;
  category: 'product' | 'process' | 'technology' | 'sustainability';
  budget: number;
  duration: number;
  progress: number;
  successChance: number;
  potentialImpact: number;
  startDate: Date;
  status: 'active' | 'completed' | 'cancelled' | 'failed';
}

/**
 * Patent details
 */
export interface Patent {
  id: string;
  companyId: string;
  departmentId: string;
  name: string;
  description: string;
  projectId?: string; // Originating research project
  status: 'pending' | 'approved' | 'rejected';
  filedAt: Date;
  approvedAt?: Date;
  value: number; // Estimated value
}

/**
 * P&L Report
 */
export interface PLReport {
  companyId: string;
  period: {
    start: Date;
    end: Date;
  };
  revenue: {
    contracts: number;
    investments: number;
    other: number;
    total: number;
  };
  expenses: {
    salaries: number;
    departments: number;
    loans: number;
    operations: number;
    other: number;
    total: number;
  };
  profit: number;
  profitMargin: number; // %
  cashflow: {
    operating: number;
    investing: number;
    financing: number;
    net: number;
  };
}

/**
 * Cashflow forecast
 */
export interface CashflowForecast {
  current: number;
  sevenDay: number;
  thirtyDay: number;
  ninetyDay: number;
  burnRate: number; // $/month
  runwayMonths: number;
  alerts: {
    level: 'safe' | 'warning' | 'critical';
    message: string;
  }[];
}

/**
 * Department analytics
 */
export interface DepartmentAnalytics {
  departmentId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    efficiency: number;
    performance: number;
    roi: number;
    utilization: number;
    quality: number;
  };
  trends: {
    metric: string;
    change: number; // % change
    direction: 'up' | 'down' | 'stable';
  }[];
  recommendations: string[];
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Type Safety**: Strict TypeScript types prevent runtime errors
 * 2. **Department-Specific Data**: Segregated into separate interfaces
 * 3. **Union Types**: AnyDepartment allows handling all department types
 * 4. **Input Types**: Separate types for creation vs updates
 * 5. **Nested Objects**: Financial tracking, portfolios, forecasts well-structured
 * 
 * USAGE:
 * ```ts
 * import { FinanceDepartment, DepartmentType } from '@/lib/types/department';
 * 
 * const finance: FinanceDepartment = {
 *   type: DepartmentType.FINANCE,
 *   name: DepartmentName.FINANCE,
 *   financeData: {
 *     creditScore: 720,
 *     cashReserves: 100000,
 *     // ... other fields
 *   },
 *   // ... base department fields
 * };
 * ```
 */
