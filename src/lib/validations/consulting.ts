/**
 * @file src/lib/validations/consulting.ts
 * @description Zod validation schemas for consulting API endpoints
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Comprehensive validation schemas for consulting project creation, updates,
 * and query parameters. Ensures data integrity and type safety at API boundaries.
 */

import { z } from 'zod';
import {
  ConsultingProjectType,
  ConsultingProjectStatus,
  ConsultingBillingModel,
  ConsultingProjectPhase,
  ConsultingTeamRole,
  ConsultingMilestoneStatus,
} from '@/types/consulting';

// ============================================================================
// SHARED SCHEMAS
// ============================================================================

/**
 * Client contact schema
 */
export const clientContactSchema = z.object({
  name: z.string().min(2, 'Contact name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  phone: z.string().max(20).optional(),
  title: z.string().max(100).optional(),
});

/**
 * Team member schema
 */
export const teamMemberSchema = z.object({
  consultantId: z.string().min(1, 'Consultant ID is required'),
  consultantName: z.string().min(2, 'Consultant name is required').max(100),
  role: z.nativeEnum(ConsultingTeamRole, {
    errorMap: () => ({ message: 'Invalid team role' }),
  }),
  hourlyRate: z.number().min(50, 'Hourly rate must be at least $50').max(1000, 'Hourly rate cannot exceed $1,000'),
  hoursAllocated: z.number().min(0).default(0),
  hoursLogged: z.number().min(0).default(0),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});

/**
 * Milestone schema
 */
export const milestoneSchema = z.object({
  name: z.string().min(2, 'Milestone name is required').max(100),
  description: z.string().max(500).optional(),
  dueDate: z.coerce.date(),
  completionDate: z.coerce.date().optional(),
  deliverables: z.array(z.string()).default([]),
  status: z.nativeEnum(ConsultingMilestoneStatus).default(ConsultingMilestoneStatus.PENDING),
});

// ============================================================================
// CREATE SCHEMA
// ============================================================================

/**
 * Schema for creating a new consulting project
 */
export const createConsultingProjectSchema = z.object({
  // Core fields (required)
  client: z.string()
    .min(2, 'Client name must be at least 2 characters')
    .max(100, 'Client name cannot exceed 100 characters'),
  
  clientContact: clientContactSchema,
  
  projectName: z.string()
    .min(5, 'Project name must be at least 5 characters')
    .max(150, 'Project name cannot exceed 150 characters'),
  
  projectType: z.nativeEnum(ConsultingProjectType, {
    errorMap: () => ({ message: 'Invalid project type' }),
  }),
  
  startDate: z.coerce.date(),
  
  deadline: z.coerce.date(),
  
  scope: z.string()
    .min(20, 'Scope must be at least 20 characters')
    .max(2000, 'Scope cannot exceed 2000 characters'),
  
  deliverables: z.array(z.string())
    .min(1, 'At least one deliverable is required'),
  
  billingModel: z.nativeEnum(ConsultingBillingModel, {
    errorMap: () => ({ message: 'Invalid billing model' }),
  }),
  
  hoursEstimated: z.number()
    .min(1, 'Estimated hours must be at least 1'),

  // Optional fields with defaults
  phase: z.nativeEnum(ConsultingProjectPhase).default(ConsultingProjectPhase.DISCOVERY),
  
  status: z.nativeEnum(ConsultingProjectStatus).default(ConsultingProjectStatus.PROPOSAL),
  
  objectives: z.array(z.string()).default([]),
  
  technologies: z.array(z.string()).default([]),
  
  teamSize: z.number().min(1).max(50).default(1),
  
  team: z.array(teamMemberSchema).default([]),
  
  milestones: z.array(milestoneSchema).default([]),

  // Billing fields (conditional based on billingModel)
  hourlyRate: z.number().min(50).max(1000).default(250),
  
  fixedFee: z.number().min(0).default(0),
  
  retainerMonthly: z.number().min(0).default(0),
  
  performanceBonus: z.number().min(0).default(0),
  
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),

  // Notes
  notes: z.string().max(5000).default(''),
}).refine(
  (data) => {
    // Validate deadline is after start date
    return data.deadline > data.startDate;
  },
  {
    message: 'Deadline must be after start date',
    path: ['deadline'],
  }
).refine(
  (data) => {
    // Validate billing model specific fields
    if (data.billingModel === ConsultingBillingModel.HOURLY && data.hourlyRate < 50) {
      return false;
    }
    if (data.billingModel === ConsultingBillingModel.FIXED && data.fixedFee <= 0) {
      return false;
    }
    if (data.billingModel === ConsultingBillingModel.RETAINER && data.retainerMonthly <= 0) {
      return false;
    }
    return true;
  },
  {
    message: 'Billing model requires appropriate fee/rate to be set',
    path: ['billingModel'],
  }
);

// ============================================================================
// UPDATE SCHEMA
// ============================================================================

/**
 * Schema for updating an existing consulting project
 */
export const updateConsultingProjectSchema = z.object({
  // Core fields
  client: z.string()
    .min(2, 'Client name must be at least 2 characters')
    .max(100, 'Client name cannot exceed 100 characters')
    .optional(),
  
  clientContact: clientContactSchema.partial().optional(),
  
  projectName: z.string()
    .min(5, 'Project name must be at least 5 characters')
    .max(150, 'Project name cannot exceed 150 characters')
    .optional(),
  
  projectType: z.nativeEnum(ConsultingProjectType).optional(),
  
  phase: z.nativeEnum(ConsultingProjectPhase).optional(),
  
  status: z.nativeEnum(ConsultingProjectStatus).optional(),
  
  startDate: z.coerce.date().optional(),
  
  deadline: z.coerce.date().optional(),
  
  completedAt: z.coerce.date().optional(),
  
  active: z.boolean().optional(),

  // Scope & Deliverables
  scope: z.string()
    .min(20, 'Scope must be at least 20 characters')
    .max(2000, 'Scope cannot exceed 2000 characters')
    .optional(),
  
  objectives: z.array(z.string()).optional(),
  
  deliverables: z.array(z.string()).optional(),
  
  technologies: z.array(z.string()).optional(),
  
  teamSize: z.number().min(1).max(50).optional(),
  
  team: z.array(teamMemberSchema).optional(),
  
  milestones: z.array(milestoneSchema).optional(),

  // Billing & Pricing
  billingModel: z.nativeEnum(ConsultingBillingModel).optional(),
  
  hourlyRate: z.number().min(50).max(1000).optional(),
  
  fixedFee: z.number().min(0).optional(),
  
  retainerMonthly: z.number().min(0).optional(),
  
  performanceBonus: z.number().min(0).optional(),
  
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).optional(),

  // Time Tracking
  hoursEstimated: z.number().min(1).optional(),
  
  hoursWorked: z.number().min(0).optional(),

  // Financial Metrics
  totalRevenue: z.number().min(0).optional(),
  
  totalCost: z.number().min(0).optional(),
  
  billedAmount: z.number().min(0).optional(),
  
  collectedAmount: z.number().min(0).optional(),

  // Quality & Client Satisfaction
  clientSatisfaction: z.number().min(0).max(100).optional(),
  
  scopeCreep: z.number().min(0).optional(),
  
  changeRequests: z.number().min(0).optional(),
  
  npsScore: z.number().min(-100).max(100).optional(),

  // Notes
  notes: z.string().max(5000).optional(),
});

// ============================================================================
// QUERY SCHEMA
// ============================================================================

/**
 * Schema for consulting project query parameters
 */
export const consultingQuerySchema = z.object({
  // Filters
  status: z.union([
    z.nativeEnum(ConsultingProjectStatus),
    z.array(z.nativeEnum(ConsultingProjectStatus)),
  ]).optional(),
  
  projectType: z.union([
    z.nativeEnum(ConsultingProjectType),
    z.array(z.nativeEnum(ConsultingProjectType)),
  ]).optional(),
  
  billingModel: z.union([
    z.nativeEnum(ConsultingBillingModel),
    z.array(z.nativeEnum(ConsultingBillingModel)),
  ]).optional(),
  
  client: z.string().optional(),
  
  phase: z.nativeEnum(ConsultingProjectPhase).optional(),
  
  active: z.coerce.boolean().optional(),
  
  minRevenue: z.coerce.number().min(0).optional(),
  
  maxRevenue: z.coerce.number().min(0).optional(),
  
  startDateFrom: z.coerce.date().optional(),
  
  startDateTo: z.coerce.date().optional(),
  
  deadlineFrom: z.coerce.date().optional(),
  
  deadlineTo: z.coerce.date().optional(),

  // Search
  search: z.string().max(100).optional(),

  // Sorting
  sortBy: z.enum([
    'projectName',
    'client',
    'status',
    'projectType',
    'billingModel',
    'startDate',
    'deadline',
    'totalRevenue',
    'profitMargin',
    'clientSatisfaction',
    'hoursWorked',
    'createdAt',
    'updatedAt',
  ]).default('createdAt'),
  
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Pagination
  page: z.coerce.number().min(1).default(1),
  
  limit: z.coerce.number().min(1).max(100).default(20),

  // Include metrics
  includeMetrics: z.coerce.boolean().default(false),
  
  includeRecommendations: z.coerce.boolean().default(false),
});

// ============================================================================
// LOG HOURS SCHEMA
// ============================================================================

/**
 * Schema for logging hours to a project
 */
export const logHoursSchema = z.object({
  hours: z.number()
    .min(0.25, 'Minimum log is 15 minutes (0.25 hours)')
    .max(24, 'Cannot log more than 24 hours at once'),
  
  consultantId: z.string().min(1, 'Consultant ID is required'),
  
  description: z.string().max(500).optional(),
  
  date: z.coerce.date().default(() => new Date()),
  
  billable: z.boolean().default(true),
});

// ============================================================================
// BILLING SCHEMA
// ============================================================================

/**
 * Schema for creating an invoice
 */
export const createInvoiceSchema = z.object({
  amount: z.number().min(0.01, 'Invoice amount must be positive'),
  
  description: z.string().max(500).optional(),
  
  dueDate: z.coerce.date(),
  
  lineItems: z.array(z.object({
    description: z.string().min(1).max(200),
    quantity: z.number().min(0.01),
    rate: z.number().min(0),
    amount: z.number().min(0),
  })).optional(),
});

/**
 * Schema for recording a payment
 */
export const recordPaymentSchema = z.object({
  amount: z.number().min(0.01, 'Payment amount must be positive'),
  
  paymentDate: z.coerce.date().default(() => new Date()),
  
  paymentMethod: z.enum(['check', 'wire', 'ach', 'credit_card', 'other']).optional(),
  
  reference: z.string().max(100).optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateConsultingProjectInput = z.infer<typeof createConsultingProjectSchema>;
export type UpdateConsultingProjectInput = z.infer<typeof updateConsultingProjectSchema>;
export type ConsultingQueryInput = z.infer<typeof consultingQuerySchema>;
export type LogHoursInput = z.infer<typeof logHoursSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
