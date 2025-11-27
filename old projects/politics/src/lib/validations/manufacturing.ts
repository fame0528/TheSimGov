/**
 * @file src/lib/validations/manufacturing.ts
 * @description Zod schemas for Manufacturing APIs (facilities, lines, etc.)
 * @created 2025-11-13
 */

import { z } from 'zod';

// Shared enums
export const FacilityTypeEnum = z.enum(['Discrete', 'Process', 'Assembly']);
export const AutomationLevelEnum = z.enum(['Manual', 'SemiAuto', 'FullyAuto', 'LightsOut']);
export const LineTypeEnum = z.enum(['Assembly', 'Machining', 'Packaging', 'Testing', 'Painting']);
export const LineStatusEnum = z.enum(['Idle', 'Running', 'Changeover', 'Maintenance', 'Breakdown', 'Offline']);

// Facilities: Query schema
export const facilityQuerySchema = z.object({
  type: FacilityTypeEnum.optional(),
  active: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  limit: z.number().int().min(1).max(100).default(10),
  skip: z.number().int().min(0).default(0),
  sortBy: z.enum(['createdAt', 'oeeScore', 'utilizationRate', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Facilities: Creation schema
export const createFacilitySchema = z.object({
  name: z.string().min(3).max(100),
  location: z.string().min(2).max(150),
  facilityType: FacilityTypeEnum,
  size: z.number().int().min(10000).max(5_000_000),
  theoreticalCapacity: z.number().int().min(100),
  actualCapacity: z.number().int().min(0),
  productionLines: z.number().int().min(1).max(100),
  shiftsPerDay: z.enum(['1','2','3']).transform((v) => parseInt(v, 10)).or(z.number().int().min(1).max(3)),
  hoursPerShift: z.number().int().min(6).max(12),
  daysPerWeek: z.number().int().min(5).max(7),
  automationLevel: AutomationLevelEnum,
  capitalInvested: z.number().min(100_000),

  // Optional overrides (defaults exist at model level)
  availability: z.number().min(0).max(100).optional(),
  performance: z.number().min(0).max(100).optional(),
  quality: z.number().min(0).max(100).optional(),
  plannedDowntime: z.number().min(0).optional(),
  unplannedDowntime: z.number().min(0).optional(),
});

export type FacilityQueryInput = z.infer<typeof facilityQuerySchema>;
export type CreateFacilityInput = z.infer<typeof createFacilitySchema>;

// Production Lines: Query schema
export const productionLineQuerySchema = z.object({
  facility: z.string().min(1).optional(), // ObjectId as string
  lineType: LineTypeEnum.optional(),
  status: LineStatusEnum.optional(),
  active: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  limit: z.number().int().min(1).max(100).default(10),
  skip: z.number().int().min(0).default(0),
  sortBy: z
    .enum(['createdAt', 'oee', 'speedEfficiency', 'name', 'lineNumber', 'ratedSpeed'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Production Lines: Creation schema
export const createProductionLineSchema = z.object({
  facility: z.string().min(1), // ObjectId string
  name: z.string().min(2).max(50),
  lineNumber: z.number().int().min(1).max(100),
  lineType: LineTypeEnum,
  ratedSpeed: z.number().min(1).max(100000),
  actualSpeed: z.number().min(0).optional(),
  operatorsRequired: z.number().int().min(0).max(50),
  status: LineStatusEnum.optional(),
  shift: z.enum(['1','2','3']).transform((v) => parseInt(v, 10)).or(z.number().int().min(1).max(3)).optional(),

  // Optional performance and quality metrics (model defaults handle these)
  throughputTarget: z.number().int().min(1).optional(),
  availability: z.number().min(0).max(100).optional(),
  performance: z.number().min(0).max(100).optional(),
  quality: z.number().min(0).max(100).optional(),
  plannedDowntime: z.number().min(0).optional(),
  unplannedDowntime: z.number().min(0).optional(),
});

export type ProductionLineQueryInput = z.infer<typeof productionLineQuerySchema>;
export type CreateProductionLineInput = z.infer<typeof createProductionLineSchema>;

// Inventory: Enums
export const ItemTypeEnum = z.enum(['RawMaterial', 'WIP', 'FinishedGoods', 'Packaging', 'Tooling', 'MRO']);
export const InventoryMethodEnum = z.enum(['FIFO', 'LIFO', 'JIT', 'WeightedAverage']);
export const QualityStatusEnum = z.enum(['Approved', 'Quarantine', 'Rejected', 'Pending']);
export const ABCClassificationEnum = z.enum(['A', 'B', 'C']);

// Inventory: Query schema
export const inventoryQuerySchema = z.object({
  facility: z.string().min(1).optional(),
  itemType: ItemTypeEnum.optional(),
  category: z.string().optional(),
  qualityStatus: QualityStatusEnum.optional(),
  abcClassification: ABCClassificationEnum.optional(),
  needsReorder: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  obsolete: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  limit: z.number().int().min(1).max(100).default(10),
  skip: z.number().int().min(0).default(0),
  sortBy: z
    .enum(['createdAt', 'sku', 'quantityOnHand', 'totalValue', 'turnoverRate', 'daysOnHand'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Inventory: Creation schema
export const createInventorySchema = z.object({
  facility: z.string().min(1).optional(),
  itemType: ItemTypeEnum,
  sku: z.string().min(3).max(50).toUpperCase(),
  name: z.string().min(2).max(150),
  category: z.string().min(1).max(50),
  uom: z.string().min(1).max(10).toUpperCase(),
  quantityOnHand: z.number().min(0),
  unitCost: z.number().min(0),
  reorderPoint: z.number().min(0),
  reorderQuantity: z.number().min(1),
  inventoryMethod: InventoryMethodEnum.default('FIFO'),
  safetyStock: z.number().min(0).default(0),
  leadTimeDays: z.number().int().min(1).max(365).default(14),
  autoReorderEnabled: z.boolean().default(false),
  // Optional fields
  location: z.string().max(100).optional(),
  warehouseZone: z.string().max(50).optional(),
  preferredSupplier: z.string().min(1).optional(),
  qualityStatus: QualityStatusEnum.optional(),
});

export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>;
export type CreateInventoryInput = z.infer<typeof createInventorySchema>;

// Suppliers: Enums
export const SupplierTierEnum = z.enum(['Tier1', 'Tier2', 'Tier3']);
export const SupplierCategoryEnum = z.enum(['RawMaterials', 'Components', 'Packaging', 'Services', 'MRO']);
export const SupplierStatusEnum = z.enum(['Active', 'Inactive', 'Probation', 'Approved', 'Rejected']);
export const PerformanceTierEnum = z.enum(['Excellent', 'Good', 'Fair', 'Poor']);

// Suppliers: Query schema
export const supplierQuerySchema = z.object({
  tier: SupplierTierEnum.optional(),
  category: SupplierCategoryEnum.optional(),
  status: SupplierStatusEnum.optional(),
  performanceTier: PerformanceTierEnum.optional(),
  preferredOnly: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  minScore: z.number().min(0).max(100).optional(),
  country: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  skip: z.number().int().min(0).default(0),
  sortBy: z
    .enum([
      'createdAt',
      'name',
      'overallScore',
      'onTimeDeliveryRate',
      'qualityRating',
      'totalSpend',
    ])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Suppliers: Creation schema
export const createSupplierSchema = z.object({
  name: z.string().min(2).max(150),
  supplierCode: z.string().min(3).max(50).toUpperCase(),
  tier: SupplierTierEnum,
  category: SupplierCategoryEnum,
  contactPerson: z.string().min(1).max(100),
  email: z.string().email().toLowerCase(),
  phone: z.string().min(1).max(30),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(50),
  country: z.string().min(1).max(50),
  website: z.string().url().max(200).optional(),
  // Performance metrics (optional, defaults exist)
  onTimeDeliveryRate: z.number().min(0).max(100).optional(),
  qualityRating: z.number().min(0).max(100).optional(),
  priceCompetitiveness: z.number().min(0).max(100).optional(),
  responsiveness: z.number().min(0).max(100).optional(),
  averageLeadTime: z.number().int().min(1).max(365).optional(),
  paymentTerms: z.string().max(50).default('Net30'),
  currency: z.string().length(3).toUpperCase().default('USD'),
  preferredSupplier: z.boolean().default(false),
  certifications: z.array(z.string()).default([]),
});

export type SupplierQueryInput = z.infer<typeof supplierQuerySchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

// Procurement Orders: Enums
export const ProcurementOrderStatusEnum = z.enum([
  'Draft',
  'Submitted',
  'Approved',
  'InTransit',
  'Received',
  'Completed',
  'Cancelled',
]);
export const OrderPriorityEnum = z.enum(['Low', 'Medium', 'High', 'Urgent']);
export const OrderTypeEnum = z.enum(['Standard', 'Blanket', 'Contract', 'Spot']);
export const ShippingMethodEnum = z.enum(['Ground', 'Air', 'Ocean', 'Rail']);

// Procurement Item schema
export const procurementItemSchema = z.object({
  sku: z.string().min(1),
  description: z.string().min(1).max(500),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  uom: z.string().min(1).max(20),
  requestedDate: z.string().datetime().optional(),
});

// Procurement Orders: Query schema
export const procurementOrderQuerySchema = z.object({
  supplier: z.string().min(1).optional(),
  facility: z.string().min(1).optional(),
  status: ProcurementOrderStatusEnum.optional(),
  priority: OrderPriorityEnum.optional(),
  orderType: OrderTypeEnum.optional(),
  overdue: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  needsApproval: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  limit: z.number().int().min(1).max(100).default(10),
  skip: z.number().int().min(0).default(0),
  sortBy: z
    .enum(['createdAt', 'orderNumber', 'totalAmount', 'requestedDeliveryDate', 'expectedDeliveryDate'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Procurement Orders: Creation schema
export const createProcurementOrderSchema = z.object({
  orderNumber: z.string().min(3).max(50).toUpperCase(),
  supplier: z.string().min(1), // ObjectId string
  facility: z.string().min(1).optional(),
  priority: OrderPriorityEnum.default('Medium'),
  orderType: OrderTypeEnum.default('Standard'),
  requestedDeliveryDate: z.string().datetime(),
  deliveryAddress: z.string().min(1).max(500),
  items: z.array(procurementItemSchema).min(1),
  requestedBy: z.string().min(1), // ObjectId string (Employee)
  // Optional fields
  shippingMethod: ShippingMethodEnum.optional(),
  paymentTerms: z.string().max(50).optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  incoterms: z.string().max(10).toUpperCase().optional(),
  expectedTransitDays: z.number().int().min(1).max(365).optional(),
  certificationRequired: z.array(z.string()).optional(),
});

export type ProcurementOrderQueryInput = z.infer<typeof procurementOrderQuerySchema>;
export type CreateProcurementOrderInput = z.infer<typeof createProcurementOrderSchema>;

// Quality Metrics: Enums
export const MeasurementPeriodEnum = z.enum(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual']);
export const DefectSeverityEnum = z.enum(['Critical', 'Major', 'Minor']);
export const TrendDirectionEnum = z.enum(['Improving', 'Stable', 'Degrading']);

// Quality Metrics: Query schema
export const qualityMetricQuerySchema = z.object({
  facility: z.string().min(1).optional(),
  productionLine: z.string().min(1).optional(),
  product: z.string().optional(),
  measurementPeriod: MeasurementPeriodEnum.optional(),
  minSigmaLevel: z.number().min(1).max(6).optional(),
  maxSigmaLevel: z.number().min(1).max(6).optional(),
  needsImprovement: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  limit: z.number().int().min(1).max(100).default(10),
  skip: z.number().int().min(0).default(0),
  sortBy: z.enum(['createdAt', 'measurementDate', 'sigmaLevel', 'dpmo', 'firstPassYield']).default('measurementDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Quality Metrics: Creation schema
export const createQualityMetricSchema = z.object({
  metricId: z.string().min(3).max(50).toUpperCase(),
  facility: z.string().min(1).optional(),
  productionLine: z.string().min(1).optional(),
  product: z.string().min(1).max(200),
  unitsProduced: z.number().int().min(1),
  unitsInspected: z.number().int().min(1),
  defectsFound: z.number().int().min(0).default(0),
  defectiveUnits: z.number().int().min(0).default(0),
  opportunities: z.number().int().min(1),
  measurementPeriod: MeasurementPeriodEnum.default('Daily'),
  targetSigmaLevel: z.number().min(1).max(6).default(4),
  // Optional SPC fields
  mean: z.number().optional(),
  standardDeviation: z.number().min(0).optional(),
  upperSpecLimit: z.number().optional(),
  lowerSpecLimit: z.number().optional(),
});

export type QualityMetricQueryInput = z.infer<typeof qualityMetricQuerySchema>;
export type CreateQualityMetricInput = z.infer<typeof createQualityMetricSchema>;

// Production Schedules: Enums
export const ScheduleTypeEnum = z.enum(['MPS', 'MRP', 'DailySchedule', 'WeeklyPlan']);
export const ScheduleStatusEnum = z.enum(['Draft', 'Published', 'Active', 'Completed', 'Cancelled']);
export const PlanningHorizonEnum = z.enum(['Weekly', 'Monthly', 'Quarterly', 'Annual']);

// Production Schedules: Query schema
export const productionScheduleQuerySchema = z.object({
  facility: z.string().min(1).optional(),
  productionLine: z.string().min(1).optional(),
  scheduleType: ScheduleTypeEnum.optional(),
  status: ScheduleStatusEnum.optional(),
  priority: OrderPriorityEnum.optional(),
  bottlenecks: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  overdue: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  limit: z.number().int().min(1).max(100).default(10),
  skip: z.number().int().min(0).default(0),
  sortBy: z
    .enum(['createdAt', 'startDate', 'endDate', 'dueDate', 'completionPercentage'])
    .default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Production Schedules: Creation schema
export const createProductionScheduleSchema = z.object({
  scheduleId: z.string().min(3).max(50).toUpperCase(),
  facility: z.string().min(1),
  productionLine: z.string().min(1).optional(),
  scheduleType: ScheduleTypeEnum.default('MPS'),
  priority: OrderPriorityEnum.default('Medium'),
  product: z.string().min(1).max(200),
  productDescription: z.string().max(500).default(''),
  plannedQuantity: z.number().int().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  planningHorizon: PlanningHorizonEnum.default('Monthly'),
  // Optional fields
  leadTimeDays: z.number().int().min(1).max(365).optional(),
  lotSizingMethod: z.enum(['EOQ', 'POQ', 'LFL', 'FOQ', 'MinMax']).optional(),
  requiredCapacity: z.number().min(0).optional(),
});

export type ProductionScheduleQueryInput = z.infer<typeof productionScheduleQuerySchema>;
export type CreateProductionScheduleInput = z.infer<typeof createProductionScheduleSchema>;

// Work Orders: Enums
export const WorkOrderStatusEnum = z.enum(['Released', 'InProgress', 'OnHold', 'Completed', 'Cancelled']);

// Work Orders: Query schema
export const workOrderQuerySchema = z.object({
  facility: z.string().min(1).optional(),
  productionLine: z.string().min(1).optional(),
  productionSchedule: z.string().min(1).optional(),
  status: WorkOrderStatusEnum.optional(),
  priority: OrderPriorityEnum.optional(),
  overdue: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  active: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  limit: z.number().int().min(1).max(100).default(10),
  skip: z.number().int().min(0).default(0),
  sortBy: z
    .enum(['createdAt', 'dueDate', 'priority', 'completionPercentage', 'workOrderNumber'])
    .default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Work Orders: Creation schema
export const createWorkOrderSchema = z.object({
  workOrderNumber: z.string().min(3).max(50).toUpperCase(),
  facility: z.string().min(1),
  productionLine: z.string().min(1).optional(),
  productionSchedule: z.string().min(1).optional(),
  product: z.string().min(1).max(200),
  productDescription: z.string().max(500).default(''),
  orderQuantity: z.number().int().min(1),
  dueDate: z.string().datetime(),
  priority: OrderPriorityEnum.default('Medium'),
  shift: z.enum(['1','2','3']).transform((v) => parseInt(v, 10)).or(z.number().int().min(1).max(3)).default(1),
  // Optional fields
  assignedSupervisor: z.string().min(1).optional(),
  scheduledStartDate: z.string().datetime().optional(),
  scheduledEndDate: z.string().datetime().optional(),
  workCenter: z.string().max(100).optional(),
  specialInstructions: z.string().max(2000).optional(),
});

export type WorkOrderQueryInput = z.infer<typeof workOrderQuerySchema>;
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
