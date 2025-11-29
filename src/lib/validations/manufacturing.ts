/**
 * @file src/lib/validations/manufacturing.ts
 * @description Zod validation schemas for Manufacturing domain APIs
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Comprehensive Zod schemas for validating Manufacturing API inputs.
 * Covers facilities, production lines, suppliers with query, create, and update schemas.
 * Provides runtime validation with TypeScript type inference.
 * 
 * PATTERNS:
 * - Query schemas for GET requests with pagination, sorting, filtering
 * - Create schemas for POST requests with required fields
 * - Update schemas for PATCH requests with partial fields
 * - Enum schemas for type-safe enumeration values
 * 
 * @author ECHO v1.3.2
 */

import { z } from 'zod';

// ============================================================================
// SHARED ENUMS
// ============================================================================

export const FacilityTypeEnum = z.enum([
  'Discrete Manufacturing',
  'Process Manufacturing',
  'Batch Manufacturing',
  'Continuous Manufacturing',
  'Job Shop',
  'Assembly Plant',
]);

export const AutomationLevelEnum = z.enum([
  'Manual',
  'Semi-Automated',
  'Fully Automated',
  'Smart Factory',
]);

export const OperationalStatusEnum = z.enum([
  'Operational',
  'Under Maintenance',
  'Idle',
  'Under Construction',
  'Decommissioned',
]);

export const LineTypeEnum = z.enum([
  'Assembly',
  'Machining',
  'Packaging',
  'Testing',
  'Painting',
]);

export const LineStatusEnum = z.enum([
  'Idle',
  'Running',
  'Changeover',
  'Maintenance',
  'Breakdown',
  'Offline',
]);

export const SupplierTypeEnum = z.enum([
  'Raw Materials',
  'Components',
  'Packaging',
  'Services',
  'Equipment',
]);

export const SupplierTierEnum = z.enum([
  'Tier1-Direct',
  'Tier2-SubSupplier',
  'Tier3-RawMaterial',
]);

export const SupplierStatusEnum = z.enum([
  'Active',
  'Probation',
  'Suspended',
  'Inactive',
  'Preferred',
]);

export const RiskLevelEnum = z.enum([
  'Low',
  'Medium',
  'High',
  'Critical',
]);

// ============================================================================
// SHARED SCHEMAS
// ============================================================================

/**
 * Address schema used by facilities and suppliers
 */
export const addressSchema = z.object({
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(50),
  country: z.string().min(1).max(50),
  zip: z.string().min(1).max(20),
});

/**
 * Coordinates schema for geolocation
 */
export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * Pagination helper for query strings (converts string to number)
 */
const paginationSchema = {
  limit: z.coerce.number().int().min(1).max(100).default(10),
  skip: z.coerce.number().int().min(0).default(0),
  page: z.coerce.number().int().min(1).default(1).optional(),
};

/**
 * Boolean string conversion helper
 */
const booleanStringSchema = z
  .union([z.literal('true'), z.literal('false'), z.boolean()])
  .transform((v) => v === 'true' || v === true)
  .optional();

// ============================================================================
// FACILITY SCHEMAS
// ============================================================================

/**
 * Facility query schema - GET /api/manufacturing/facilities
 */
export const facilityQuerySchema = z.object({
  // Filters
  facilityType: FacilityTypeEnum.optional(),
  automationLevel: AutomationLevelEnum.optional(),
  status: OperationalStatusEnum.optional(),
  active: booleanStringSchema,
  isoCompliant: booleanStringSchema,
  
  // Range filters
  minOee: z.coerce.number().min(0).max(100).optional(),
  maxOee: z.coerce.number().min(0).max(100).optional(),
  minCapacity: z.coerce.number().min(0).optional(),
  maxCapacity: z.coerce.number().min(0).optional(),
  minUtilization: z.coerce.number().min(0).max(100).optional(),
  maxUtilization: z.coerce.number().min(0).max(100).optional(),
  
  // Pagination
  ...paginationSchema,
  
  // Sorting
  sortBy: z.enum([
    'createdAt',
    'name',
    'oeeScore',
    'capacityUtilization',
    'totalEmployees',
    'monthlyRevenue',
    'profitMargin',
  ]).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Facility creation schema - POST /api/manufacturing/facilities
 */
export const createFacilitySchema = z.object({
  name: z.string().min(3).max(100),
  facilityCode: z.string().min(3).max(20).toUpperCase(),
  facilityType: FacilityTypeEnum,
  automationLevel: AutomationLevelEnum,
  
  // Location
  address: addressSchema,
  coordinates: coordinatesSchema.optional(),
  
  // Capacity
  maxCapacity: z.number().int().min(1),
  productionLines: z.number().int().min(1).max(100),
  
  // Workforce
  shiftsPerDay: z.number().int().min(1).max(3).default(1),
  hoursPerShift: z.number().int().min(4).max(12).default(8),
  
  // OEE targets (optional, use defaults)
  targetOee: z.number().min(0).max(100).default(85),
  targetUtilization: z.number().min(0).max(100).default(80),
  
  // Compliance (optional)
  isoCompliant: z.boolean().default(false),
  oshaCompliant: z.boolean().default(true),
  epaCompliant: z.boolean().default(true),
});

/**
 * Facility update schema - PATCH /api/manufacturing/facilities/:id
 */
export const updateFacilitySchema = z.object({
  name: z.string().min(3).max(100).optional(),
  status: OperationalStatusEnum.optional(),
  automationLevel: AutomationLevelEnum.optional(),
  active: z.boolean().optional(),
  
  // Capacity
  maxCapacity: z.number().int().min(1).optional(),
  targetUtilization: z.number().min(0).max(100).optional(),
  targetOee: z.number().min(0).max(100).optional(),
  
  // Workforce
  shiftsPerDay: z.number().int().min(1).max(3).optional(),
  hoursPerShift: z.number().int().min(4).max(12).optional(),
  
  // Compliance
  isoCompliant: z.boolean().optional(),
  oshaCompliant: z.boolean().optional(),
  epaCompliant: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// Type exports for facility schemas
export type FacilityQueryInput = z.infer<typeof facilityQuerySchema>;
export type CreateFacilityInput = z.infer<typeof createFacilitySchema>;
export type UpdateFacilityInput = z.infer<typeof updateFacilitySchema>;

// ============================================================================
// PRODUCTION LINE SCHEMAS
// ============================================================================

/**
 * Production line query schema - GET /api/manufacturing/production-lines
 */
export const productionLineQuerySchema = z.object({
  // Filters
  facilityId: z.string().min(1).optional(),
  lineType: LineTypeEnum.optional(),
  status: LineStatusEnum.optional(),
  active: booleanStringSchema,
  shift: z.coerce.number().int().min(1).max(3).optional(),
  
  // Range filters
  minOee: z.coerce.number().min(0).max(100).optional(),
  maxOee: z.coerce.number().min(0).max(100).optional(),
  minThroughput: z.coerce.number().min(0).optional(),
  
  // Pagination
  ...paginationSchema,
  
  // Sorting
  sortBy: z.enum([
    'createdAt',
    'name',
    'lineNumber',
    'oee',
    'throughput',
    'availability',
    'performance',
    'quality',
  ]).default('lineNumber'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Production line creation schema - POST /api/manufacturing/production-lines
 */
export const createProductionLineSchema = z.object({
  facilityId: z.string().min(1),
  name: z.string().min(2).max(100),
  lineNumber: z.number().int().min(1).max(999),
  lineType: LineTypeEnum,
  
  // Performance
  ratedSpeed: z.number().min(1).max(100000),
  targetCycleTime: z.number().min(0.1).max(3600),
  throughputTarget: z.number().int().min(1).optional(),
  
  // Staffing
  operatorsRequired: z.number().int().min(0).max(50).default(2),
  shift: z.number().int().min(1).max(3).default(1),
  
  // Equipment (optional)
  equipmentAge: z.number().int().min(0).max(50).default(0),
});

/**
 * Production line update schema - PATCH /api/manufacturing/production-lines/:id
 */
export const updateProductionLineSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  status: LineStatusEnum.optional(),
  active: z.boolean().optional(),
  
  // Current production
  currentProduct: z.string().nullable().optional(),
  currentBatchId: z.string().nullable().optional(),
  batchSize: z.number().int().min(1).optional(),
  
  // Performance targets
  ratedSpeed: z.number().min(1).max(100000).optional(),
  targetCycleTime: z.number().min(0.1).max(3600).optional(),
  throughputTarget: z.number().int().min(1).optional(),
  
  // Staffing
  operatorsRequired: z.number().int().min(0).max(50).optional(),
  shift: z.number().int().min(1).max(3).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

/**
 * Batch operation schema - POST /api/manufacturing/production-lines/:id/batch
 */
export const batchOperationSchema = z.object({
  action: z.enum(['start', 'complete', 'abort']),
  productName: z.string().min(1).max(100).optional(),
  batchId: z.string().min(1).max(50).optional(),
  batchSize: z.number().int().min(1).optional(),
}).refine((data) => {
  // Require productName and batchSize for 'start' action
  if (data.action === 'start' && (!data.productName || !data.batchSize)) {
    return false;
  }
  return true;
}, {
  message: 'productName and batchSize are required for start action',
});

// Type exports for production line schemas
export type ProductionLineQueryInput = z.infer<typeof productionLineQuerySchema>;
export type CreateProductionLineInput = z.infer<typeof createProductionLineSchema>;
export type UpdateProductionLineInput = z.infer<typeof updateProductionLineSchema>;
export type BatchOperationInput = z.infer<typeof batchOperationSchema>;

// ============================================================================
// SUPPLIER SCHEMAS
// ============================================================================

/**
 * Supplier query schema - GET /api/manufacturing/suppliers
 */
export const supplierQuerySchema = z.object({
  // Filters
  type: SupplierTypeEnum.optional(),
  tier: SupplierTierEnum.optional(),
  status: SupplierStatusEnum.optional(),
  riskLevel: RiskLevelEnum.optional(),
  active: booleanStringSchema,
  strategicPartner: booleanStringSchema,
  
  // Score filters
  minScore: z.coerce.number().min(0).max(100).optional(),
  maxScore: z.coerce.number().min(0).max(100).optional(),
  minDeliveryRate: z.coerce.number().min(0).max(100).optional(),
  
  // Location filters
  region: z.string().max(50).optional(),
  country: z.string().max(50).optional(),
  
  // Pagination
  ...paginationSchema,
  
  // Sorting
  sortBy: z.enum([
    'createdAt',
    'name',
    'overallScore',
    'qualityScore',
    'deliveryScore',
    'onTimeDeliveryRate',
    'annualSpend',
    'riskLevel',
  ]).default('overallScore'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Supplier creation schema - POST /api/manufacturing/suppliers
 */
export const createSupplierSchema = z.object({
  name: z.string().min(2).max(150),
  code: z.string().min(3).max(20).toUpperCase(),
  type: SupplierTypeEnum,
  tier: SupplierTierEnum,
  
  // Contact
  contactName: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  phone: z.string().min(5).max(30),
  address: addressSchema,
  region: z.string().max(50).optional(),
  timezone: z.string().max(50).optional(),
  
  // Initial metrics (optional, will use defaults)
  leadTime: z.number().int().min(1).max(365).default(14),
  creditLimit: z.number().min(0).default(50000),
  
  // Contract (optional)
  paymentTerms: z.string().max(50).default('Net30'),
  minOrderQuantity: z.number().int().min(0).default(1),
  minOrderValue: z.number().min(0).default(0),
  
  // Certifications (optional)
  certifications: z.array(z.string()).default([]),
});

/**
 * Supplier update schema - PATCH /api/manufacturing/suppliers/:id
 */
export const updateSupplierSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  status: SupplierStatusEnum.optional(),
  active: z.boolean().optional(),
  riskLevel: RiskLevelEnum.optional(),
  
  // Contact
  contactName: z.string().min(2).max(100).optional(),
  email: z.string().email().toLowerCase().optional(),
  phone: z.string().min(5).max(30).optional(),
  
  // Terms
  creditLimit: z.number().min(0).optional(),
  leadTime: z.number().int().min(1).max(365).optional(),
  
  // Flags
  strategicPartner: z.boolean().optional(),
  exclusiveAgreement: z.boolean().optional(),
  
  // Notes
  notes: z.string().max(1000).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

/**
 * Supplier scorecard update schema - PATCH /api/manufacturing/suppliers/:id/scorecard
 */
export const updateScorecardSchema = z.object({
  qualityScore: z.number().min(0).max(100).optional(),
  deliveryScore: z.number().min(0).max(100).optional(),
  costScore: z.number().min(0).max(100).optional(),
  responseScore: z.number().min(0).max(100).optional(),
  flexibilityScore: z.number().min(0).max(100).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one score must be provided',
});

/**
 * Risk assessment schema - POST /api/manufacturing/suppliers/:id/risk-assessment
 */
export const riskAssessmentSchema = z.object({
  category: z.string().min(1).max(50),
  level: RiskLevelEnum,
  description: z.string().min(1).max(500),
  mitigationPlan: z.string().max(1000).optional(),
});

// Type exports for supplier schemas
export type SupplierQueryInput = z.infer<typeof supplierQuerySchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type UpdateScorecardInput = z.infer<typeof updateScorecardSchema>;
export type RiskAssessmentInput = z.infer<typeof riskAssessmentSchema>;

// ============================================================================
// MAINTENANCE SCHEMAS
// ============================================================================

/**
 * Maintenance request schema
 */
export const maintenanceRequestSchema = z.object({
  entityType: z.enum(['facility', 'line', 'equipment']),
  entityId: z.string().min(1),
  maintenanceType: z.enum(['preventive', 'corrective', 'predictive']),
  description: z.string().min(10).max(1000),
  scheduledStart: z.string().datetime(),
  estimatedDuration: z.number().min(0.5).max(720), // Hours (up to 30 days)
  assignedTo: z.string().min(1).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

export type MaintenanceRequestInput = z.infer<typeof maintenanceRequestSchema>;

// ============================================================================
// AGGREGATION SCHEMAS
// ============================================================================

/**
 * OEE calculation request schema
 */
export const oeeCalculationSchema = z.object({
  plannedProductionTime: z.number().min(1),
  operatingTime: z.number().min(0),
  idealCycleTime: z.number().min(0.001),
  totalPieces: z.number().int().min(0),
  goodPieces: z.number().int().min(0),
}).refine((data) => data.operatingTime <= data.plannedProductionTime, {
  message: 'Operating time cannot exceed planned production time',
}).refine((data) => data.goodPieces <= data.totalPieces, {
  message: 'Good pieces cannot exceed total pieces',
});

export type OEECalculationInput = z.infer<typeof oeeCalculationSchema>;

/**
 * KPI query schema for dashboard aggregations
 */
export const kpiQuerySchema = z.object({
  facilityId: z.string().min(1).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  metrics: z.array(z.enum([
    'oee',
    'utilization',
    'quality',
    'throughput',
    'downtime',
    'inventory',
    'supplier',
  ])).optional(),
});

export type KPIQueryInput = z.infer<typeof kpiQuerySchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Parse and validate query parameters for facilities
 */
export function parseFacilityQuery(params: URLSearchParams): FacilityQueryInput {
  const obj = Object.fromEntries(params.entries());
  return facilityQuerySchema.parse(obj);
}

/**
 * Parse and validate query parameters for production lines
 */
export function parseProductionLineQuery(params: URLSearchParams): ProductionLineQueryInput {
  const obj = Object.fromEntries(params.entries());
  return productionLineQuerySchema.parse(obj);
}

/**
 * Parse and validate query parameters for suppliers
 */
export function parseSupplierQuery(params: URLSearchParams): SupplierQueryInput {
  const obj = Object.fromEntries(params.entries());
  return supplierQuerySchema.parse(obj);
}

/**
 * Validate create facility input
 */
export function validateCreateFacility(data: unknown): CreateFacilityInput {
  return createFacilitySchema.parse(data);
}

/**
 * Validate create production line input
 */
export function validateCreateProductionLine(data: unknown): CreateProductionLineInput {
  return createProductionLineSchema.parse(data);
}

/**
 * Validate create supplier input
 */
export function validateCreateSupplier(data: unknown): CreateSupplierInput {
  return createSupplierSchema.parse(data);
}
