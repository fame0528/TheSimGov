/**
 * @fileoverview Domain Model Type Definitions
 * @module lib/types/models
 * 
 * OVERVIEW:
 * Core domain models for the game: User, Company, Employee, Contract, Loan, Bank.
 * Complete type definitions for all business entities.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import type { IndustryType, LoanType, ContractType, ContractStatus, LoanStatus, InvestmentType } from './enums';
import type { StateAbbreviation } from './state';
import type { Gender, Ethnicity } from './portraits';

/**
 * User account model
 */
export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Optional - excluded from API responses for security
  firstName: string;
  lastName: string;
  state: StateAbbreviation; // Home state for perks
  gender: Gender; // Male or Female
  dateOfBirth: Date; // Must be 18+ years old
  ethnicity?: Ethnicity; // Optional ethnicity selection
  background?: string; // Optional character background narrative (max 500 chars)
  imageUrl?: string; // Avatar URL (either /portraits/ preset or /avatars/ upload)
  createdAt: Date;
  lastLogin?: Date;
  companies: string[]; // Company IDs
}

/**
 * Company model
 */
export interface Company {
  id: string;
  userId: string;
  name: string;
  industry: IndustryType;
  description?: string;
  foundedAt: Date;
  level: number;
  cash: number;
  revenue: number;
  expenses: number;
  netWorth: number;
  logoUrl?: string;
  employees: string[]; // Employee IDs
  contracts: string[]; // Contract IDs
  loans: string[]; // Loan IDs
  creditScore: number;
  payrollHistory?: PayrollEntry[];
  
  // Finance metrics for credit score calculation
  debtToEquity?: number;
  monthsInBusiness?: number;
  monthlyRevenue?: number;
  totalDebt?: number;
}

/**
 * Employee Skills Interface
 * 12 skill categories for specialization and depth (1-100 scale)
 */
export interface EmployeeSkills {
  technical: number;      // Coding, engineering, technical execution
  leadership: number;     // Team management, decision making
  industry: number;       // Industry-specific knowledge
  sales: number;          // Revenue generation, client relations
  marketing: number;      // Brand, campaigns, market analysis
  finance: number;        // Accounting, budgeting, financial planning
  operations: number;     // Process optimization, logistics
  hr: number;             // Recruiting, culture, employee relations
  legal: number;          // Compliance, contracts, risk
  rd: number;             // Research, innovation, product development
  quality: number;        // QA, testing, standards compliance
  customer: number;       // Support, satisfaction, retention
}

/**
 * Employee Performance Metrics
 */
export interface EmployeePerformance {
  productivity: number;   // Output / Expected (0.5 to 2.0x)
  quality: number;        // Error rate inverse (0-100, higher better)
  attendance: number;     // Days worked / Days expected (0.8-1.0)
}

/**
 * Training Record
 */
export interface TrainingRecord {
  skill: keyof EmployeeSkills;
  startedAt: Date;
  completedAt?: Date;
  hoursCompleted: number;
  cost: number;
  improvement: number; // Skill points gained
}

/**
 * Performance Review Record
 */
export interface PerformanceReview {
  date: Date;
  reviewerId: string;
  overallScore: number; // 1-100
  strengths: string[];
  improvements: string[];
  salaryAdjustment: number;
  moraleImpact: number;
}

/**
 * Payroll Entry for company payment history
 */
export interface PayrollEntry {
  date: Date;
  amount: number;
  success: boolean;
}

/**
 * Employee model
 */
export interface Employee {
  id: string;
  companyId: string;
  userId: string;
  name: string;
  role: string;
  salary: number;
  hiredAt: Date;
  
  // 12 Skills (not generic array)
  skills: EmployeeSkills;
  
  // Performance Tracking
  performance: EmployeePerformance;
  
  // Morale & Retention
  morale: number; // 1-100
  lastMoraleUpdate: Date;
  
  // Training
  trainingRecords: TrainingRecord[];
  currentTraining?: TrainingRecord;
  
  // Reviews
  reviews: PerformanceReview[];
  lastReviewDate?: Date;
  
  // Employment Status
  status: 'active' | 'training' | 'onLeave' | 'terminated';
  terminatedAt?: Date;
  terminationReason?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Computed Fields (from virtuals)
  skillAverage?: number;
  retentionRisk?: 'minimal' | 'low' | 'moderate' | 'high' | 'critical';
  weeklySalary?: number;
  overallPerformance?: number;
  marketValue?: number;
}

/**
 * Contract Client Information
 */
export interface ContractClient {
  name: string;
  industry: IndustryType;
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
}

/**
 * Contract Requirements (12-skill system)
 */
export interface ContractRequirements extends EmployeeSkills {}

/**
 * Contract model
 */
export interface Contract {
  id: string;
  
  // Ownership
  companyId: string | null;  // null = marketplace, string = accepted
  userId: string;
  
  // Client
  clientName: string;
  clientIndustry: string;
  clientCompanySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  
  // Contract Details
  title: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  
  // Financial
  baseValue: number;
  actualPayout: number;
  upfrontCost: number;
  bidAmount: number | null;
  
  // Timeline
  createdAt: Date;
  acceptedAt: Date | null;
  startDate: Date | null;
  deadline: Date | null;
  completedAt: Date | null;
  durationDays: number;
  
  // Requirements
  requirements: ContractRequirements;
  requiredEmployeeCount: number;
  
  // Execution
  status: 'marketplace' | 'bidding' | 'active' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  assignedEmployees: string[];
  progressPercent: number;
  
  // Results
  successScore: number | null;
  clientSatisfaction: number | null;
  bonusEarned: number;
  
  // Metadata
  updatedAt: Date;
  expiresAt: Date;
  
  // Computed (from virtuals)
  isExpired?: boolean;
  daysRemaining?: number | null;
  isLate?: boolean;
  avgRequirement?: number;
  estimatedPayout?: number;
}

/**
 * Loan model
 */
export interface Loan {
  id: string;
  companyId: string;
  bankId: string;
  type: LoanType;
  status: LoanStatus;
  amount: number;
  interestRate: number;
  term: number; // Months
  monthlyPayment: number;
  remainingBalance: number;
  appliedAt: Date;
  approvedAt?: Date;
  dueDate?: Date;
  paidOffAt?: Date;
  
  // Additional properties for UI components
  principal: number; // Original loan amount
  amountPaid: number; // Total amount paid so far
  lastPaymentDate?: Date;
  createdAt: Date;
}

/**
 * Bank model
 */
export interface Bank {
  id: string;
  name: string;
  minCreditScore: number;
  maxLoanAmount: number;
  baseInterestRate: number;
  processingTime: number; // Hours
  
  // Additional properties for UI components
  personality?: string; // NPC bank personality description
  capital?: number; // Bank's available capital
  description?: string; // Bank description
  services?: {
    loans: boolean;
    investments: boolean;
    savings: boolean;
    insurance: boolean;
  };
}

/**
 * Investment model
 */
export interface Investment {
  id: string;
  companyId: string;
  type: InvestmentType;
  amount: number;
  purchasePrice: number; // Price per unit at purchase
  currentPrice: number; // Current price per unit
  units: number;
  purchaseDate: Date;
  lastUpdated: Date;
  dividendsPaid: number; // Total dividends received
  expectedReturn: number; // Annual expected return
  
  // Additional properties for UI components
  currentValue: number; // units * currentPrice
  quantity: number; // Alias for units
  monthlyDividend: number; // Monthly dividend amount
}

/**
 * Investment Portfolio model
 */
export interface InvestmentPortfolio {
  id: string;
  companyId: string;
  totalValue: number;
  totalInvested: number;
  totalDividends: number;
  investments: Investment[]; // Full investment objects for UI
  lastRebalanced?: Date;
  riskTolerance: number; // 1-10 scale
  
  // Additional properties for UI components
  name: string;
  totalReturn: number; // Total return percentage
}

// ===== UI-SPECIFIC BANKING TYPES =====

/**
 * Loan Application Form Data
 */
export interface LoanApplicationFormData {
  amount: number;
  type: LoanType;
  termMonths: number;
  purpose: string;
  bankId?: string; // Optional - will be selected from available banks
}

/**
 * Credit Score Response
 */
export interface CreditScoreResponse {
  score: number;
  rating: string;
  factors: Array<{
    factor: string;
    impact: 'Positive' | 'Negative' | 'Neutral';
    description: string;
    weight: number;
  }>;
  recommendations: string[];
}

/**
 * Loan Payment Data
 */
export interface LoanPaymentData {
  loanId: string;
  amount: number;
  isAutoPay?: boolean;
}

/**
 * Investment Purchase Data
 */
export interface InvestmentPurchaseData {
  type: InvestmentType;
  amount: number;
  riskTolerance: number;
  portfolioId?: string; // Optional portfolio ID for existing portfolios
}

/**
 * Bank Selection Data
 */
export interface BankSelectionData {
  bankId: string;
  bankName?: string;
  approvalChance?: number;
  offeredRate?: number;
  reason?: string;
}

/**
 * Player Bank Creation Data
 */
export interface PlayerBankCreationData {
  name: string;
  description: string;
  initialCapital: number;
  interestRate?: number;
  loanTerms?: string;
  personality?: 'CONSERVATIVE' | 'AGGRESSIVE' | 'BALANCED' | 'SPECIALIZED';
  minCreditScore?: number;
  maxLoanAmount?: number;
  baseInterestRate?: number;
  services?: {
    loans: boolean;
    investments: boolean;
    savings: boolean;
    insurance: boolean;
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Type Safety**: All models strongly typed with no `any`
 * 2. **Relationships**: ID references for foreign keys
 * 3. **Timestamps**: Date fields for audit trail
 * 4. **Optional Fields**: Proper use of ? for nullable properties
 * 5. **Enums**: References to enum types for consistency
 * 
 * PREVENTS:
 * - Type inconsistencies across frontend/backend
 * - Missing required fields in API calls
 * - Runtime errors from wrong data shapes
 */
