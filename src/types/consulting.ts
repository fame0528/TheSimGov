/**
 * @file src/types/consulting.ts
 * @description TypeScript types and interfaces for consulting domain
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Comprehensive type definitions for the consulting industry module.
 * Includes project types, billing models, metrics, and API data structures.
 */

import type { Types } from 'mongoose';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Project type categories for consulting engagements
 */
export enum ConsultingProjectType {
  STRATEGY = 'Strategy',
  IMPLEMENTATION = 'Implementation',
  AUDIT = 'Audit',
  TRAINING = 'Training',
  ADVISORY = 'Advisory',
}

/**
 * Project lifecycle status
 */
export enum ConsultingProjectStatus {
  PROPOSAL = 'Proposal',
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

/**
 * Billing model types
 */
export enum ConsultingBillingModel {
  HOURLY = 'Hourly',
  FIXED = 'Fixed',
  RETAINER = 'Retainer',
  PERFORMANCE = 'Performance',
}

/**
 * Project phase types
 */
export enum ConsultingProjectPhase {
  DISCOVERY = 'Discovery',
  PLANNING = 'Planning',
  EXECUTION = 'Execution',
  DELIVERY = 'Delivery',
  CLOSURE = 'Closure',
}

/**
 * Team member role types
 */
export enum ConsultingTeamRole {
  LEAD = 'Lead',
  SENIOR = 'Senior',
  ANALYST = 'Analyst',
  SPECIALIST = 'Specialist',
}

/**
 * Milestone status types
 */
export enum ConsultingMilestoneStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'InProgress',
  COMPLETED = 'Completed',
  DELAYED = 'Delayed',
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Client contact information
 */
export interface ConsultingClientContact {
  name: string;
  email: string;
  phone?: string;
  title?: string;
}

/**
 * Team member assignment
 */
export interface ConsultingTeamMember {
  consultantId: string;
  consultantName: string;
  role: ConsultingTeamRole;
  hourlyRate: number;
  hoursAllocated: number;
  hoursLogged: number;
  startDate: string | Date;
  endDate?: string | Date;
}

/**
 * Milestone tracking
 */
export interface ConsultingMilestone {
  name: string;
  description?: string;
  dueDate: string | Date;
  completionDate?: string | Date;
  deliverables: string[];
  status: ConsultingMilestoneStatus;
}

/**
 * Consulting project data structure (from API/database)
 */
export interface ConsultingProjectData {
  _id: string;
  company: string | Types.ObjectId;
  client: string;
  clientContact: ConsultingClientContact;
  projectName: string;
  projectType: ConsultingProjectType;
  phase: ConsultingProjectPhase;
  status: ConsultingProjectStatus;
  startDate: string | Date;
  deadline: string | Date;
  completedAt?: string | Date;
  active: boolean;

  // Scope & Deliverables
  scope: string;
  objectives: string[];
  deliverables: string[];
  technologies: string[];
  teamSize: number;
  team: ConsultingTeamMember[];
  milestones: ConsultingMilestone[];

  // Billing & Pricing
  billingModel: ConsultingBillingModel;
  hourlyRate: number;
  fixedFee: number;
  retainerMonthly: number;
  performanceBonus: number;
  currency: string;

  // Time Tracking
  hoursEstimated: number;
  hoursWorked: number;
  utilizationRate: number;

  // Financial Metrics
  totalRevenue: number;
  totalCost: number;
  profitMargin: number;
  billedAmount: number;
  collectedAmount: number;

  // Quality & Client Satisfaction
  clientSatisfaction: number;
  onTimeDelivery: boolean;
  scopeCreep: number;
  changeRequests: number;
  npsScore?: number;

  // Notes
  notes: string;

  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;

  // Virtual fields
  hoursRemaining?: number;
  profitAmount?: number;
  outstandingBalance?: number;
  isOverBudget?: boolean;
  daysUntilDeadline?: number;
  completionPercentage?: number;
}

/**
 * Data required to create a new consulting project
 */
export interface ConsultingProjectCreate {
  client: string;
  clientContact: ConsultingClientContact;
  projectName: string;
  projectType: ConsultingProjectType;
  phase?: ConsultingProjectPhase;
  status?: ConsultingProjectStatus;
  startDate: string | Date;
  deadline: string | Date;

  // Scope & Deliverables
  scope: string;
  objectives?: string[];
  deliverables: string[];
  technologies?: string[];
  teamSize?: number;
  team?: ConsultingTeamMember[];
  milestones?: ConsultingMilestone[];

  // Billing & Pricing
  billingModel: ConsultingBillingModel;
  hourlyRate?: number;
  fixedFee?: number;
  retainerMonthly?: number;
  performanceBonus?: number;
  currency?: string;

  // Time Tracking
  hoursEstimated: number;

  // Notes
  notes?: string;
}

/**
 * Data for updating an existing consulting project
 */
export interface ConsultingProjectUpdate {
  client?: string;
  clientContact?: Partial<ConsultingClientContact>;
  projectName?: string;
  projectType?: ConsultingProjectType;
  phase?: ConsultingProjectPhase;
  status?: ConsultingProjectStatus;
  startDate?: string | Date;
  deadline?: string | Date;
  completedAt?: string | Date;
  active?: boolean;

  // Scope & Deliverables
  scope?: string;
  objectives?: string[];
  deliverables?: string[];
  technologies?: string[];
  teamSize?: number;
  team?: ConsultingTeamMember[];
  milestones?: ConsultingMilestone[];

  // Billing & Pricing
  billingModel?: ConsultingBillingModel;
  hourlyRate?: number;
  fixedFee?: number;
  retainerMonthly?: number;
  performanceBonus?: number;
  currency?: string;

  // Time Tracking
  hoursEstimated?: number;
  hoursWorked?: number;

  // Financial Metrics
  totalRevenue?: number;
  totalCost?: number;
  billedAmount?: number;
  collectedAmount?: number;

  // Quality & Client Satisfaction
  clientSatisfaction?: number;
  scopeCreep?: number;
  changeRequests?: number;
  npsScore?: number;

  // Notes
  notes?: string;
}

/**
 * Aggregated metrics for consulting dashboard
 */
export interface ConsultingMetrics {
  // Project counts
  totalProjects: number;
  activeProjects: number;
  proposalProjects: number;
  completedProjects: number;
  cancelledProjects: number;

  // Financial metrics
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageProfitMargin: number;
  pipelineValue: number;

  // Time metrics
  totalHoursEstimated: number;
  totalHoursWorked: number;
  averageUtilizationRate: number;

  // Quality metrics
  averageClientSatisfaction: number;
  onTimeDeliveryRate: number;
  averageScopeCreep: number;

  // Collections
  totalBilled: number;
  totalCollected: number;
  outstandingBalance: number;
  collectionRate: number;
}

/**
 * Pipeline statistics by stage
 */
export interface ConsultingPipelineStats {
  stage: ConsultingProjectStatus;
  count: number;
  totalValue: number;
  averageValue: number;
  percentOfPipeline: number;
}

/**
 * Project type breakdown
 */
export interface ConsultingTypeBreakdown {
  type: ConsultingProjectType;
  count: number;
  totalRevenue: number;
  averageMargin: number;
  averageSatisfaction: number;
}

/**
 * Billing model breakdown
 */
export interface ConsultingBillingBreakdown {
  model: ConsultingBillingModel;
  count: number;
  totalRevenue: number;
  averageProjectValue: number;
  percentOfRevenue: number;
}

/**
 * Client performance summary
 */
export interface ConsultingClientSummary {
  clientName: string;
  projectCount: number;
  totalRevenue: number;
  averageSatisfaction: number;
  outstandingBalance: number;
  isRepeatClient: boolean;
}

/**
 * Utilization report by consultant
 */
export interface ConsultantUtilization {
  consultantId: string;
  consultantName: string;
  totalHoursAllocated: number;
  totalHoursLogged: number;
  utilizationRate: number;
  projectCount: number;
  billableRate: number;
}

/**
 * API query parameters for consulting projects
 */
export interface ConsultingProjectQuery {
  status?: ConsultingProjectStatus | ConsultingProjectStatus[];
  projectType?: ConsultingProjectType | ConsultingProjectType[];
  billingModel?: ConsultingBillingModel | ConsultingBillingModel[];
  client?: string;
  phase?: ConsultingProjectPhase;
  active?: boolean;
  minRevenue?: number;
  maxRevenue?: number;
  startDateFrom?: string | Date;
  startDateTo?: string | Date;
  deadlineFrom?: string | Date;
  deadlineTo?: string | Date;
  search?: string;
  sortBy?: keyof ConsultingProjectData;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  includeMetrics?: boolean;
  includeRecommendations?: boolean;
}

/**
 * API response for consulting project list
 */
export interface ConsultingProjectListResponse {
  success: boolean;
  data: ConsultingProjectData[];
  metrics?: ConsultingMetrics;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  recommendations?: ConsultingRecommendation[];
}

/**
 * API response for single consulting project
 */
export interface ConsultingProjectResponse {
  success: boolean;
  data: ConsultingProjectData;
}

/**
 * Consulting recommendation from analysis
 */
export interface ConsultingRecommendation {
  type: 'warning' | 'opportunity' | 'action';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
  actionUrl?: string;
}

/**
 * Time entry for project tracking
 */
export interface ConsultingTimeEntry {
  projectId: string;
  consultantId: string;
  date: string | Date;
  hours: number;
  description: string;
  billable: boolean;
  approved: boolean;
}

/**
 * Invoice for consulting project
 */
export interface ConsultingInvoice {
  projectId: string;
  invoiceNumber: string;
  amount: number;
  issueDate: string | Date;
  dueDate: string | Date;
  paidDate?: string | Date;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  lineItems: ConsultingInvoiceLineItem[];
}

/**
 * Invoice line item
 */
export interface ConsultingInvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Consulting project with ID for frontend use
 */
export type ConsultingProjectWithId = ConsultingProjectData & { id: string };

/**
 * Partial update type
 */
export type ConsultingProjectPartial = Partial<ConsultingProjectData>;

/**
 * Filter options for project list
 */
export interface ConsultingFilterOptions {
  statuses: ConsultingProjectStatus[];
  types: ConsultingProjectType[];
  billingModels: ConsultingBillingModel[];
  clients: string[];
  phases: ConsultingProjectPhase[];
}

/**
 * Dashboard summary data
 */
export interface ConsultingDashboardData {
  metrics: ConsultingMetrics;
  pipelineStats: ConsultingPipelineStats[];
  typeBreakdown: ConsultingTypeBreakdown[];
  billingBreakdown: ConsultingBillingBreakdown[];
  topClients: ConsultingClientSummary[];
  recentProjects: ConsultingProjectData[];
  recommendations: ConsultingRecommendation[];
}
