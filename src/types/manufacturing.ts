/**
 * @file src/types/manufacturing.ts
 * @description Manufacturing domain TypeScript types for Phase 5.1
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Shared type definitions for the Manufacturing industry domain.
 * Provides TypeScript interfaces for facilities, production lines, suppliers,
 * and related domain concepts. Used by API routes, hooks, and components.
 * 
 * DESIGN NOTES:
 * - UUID type for all entity IDs
 * - Enums as string unions for flexibility
 * - Interfaces match Mongoose schemas for consistency
 * - Nested types for complex embedded documents
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export type UUID = string;

/**
 * Standard API response wrapper
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Paginated response for list endpoints
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// FACILITY TYPES
// ============================================================================

/**
 * Manufacturing facility types
 */
export type FacilityType =
  | 'Discrete Manufacturing'
  | 'Process Manufacturing'
  | 'Batch Manufacturing'
  | 'Continuous Manufacturing'
  | 'Job Shop'
  | 'Assembly Plant';

/**
 * Automation levels
 */
export type AutomationLevel =
  | 'Manual'
  | 'Semi-Automated'
  | 'Fully Automated'
  | 'Smart Factory';

/**
 * Operational status
 */
export type OperationalStatus =
  | 'Operational'
  | 'Under Maintenance'
  | 'Idle'
  | 'Under Construction'
  | 'Decommissioned';

/**
 * Product category for facility
 */
export interface ProductCategory {
  name: string;
  percentage: number;
  volumePerMonth: number;
}

/**
 * Certification record
 */
export interface CertificationRecord {
  name: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string;
  status: 'Active' | 'Expired' | 'Pending Renewal';
}

/**
 * Manufacturing facility interface
 */
export interface ManufacturingFacility {
  id: UUID;
  companyId: UUID;
  name: string;
  facilityCode: string;
  facilityType: FacilityType;
  status: OperationalStatus;
  automationLevel: AutomationLevel;
  active: boolean;

  // Location
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zip: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };

  // Capacity
  maxCapacity: number;
  currentCapacity: number;
  capacityUtilization: number;
  targetUtilization: number;
  productionLines: number;
  activeProductionLines: number;

  // OEE
  oeeScore: number;
  availability: number;
  performance: number;
  quality: number;
  targetOee: number;

  // Products
  productCategories: ProductCategory[];
  primaryProduct: string;
  skuCount: number;

  // Workforce
  totalEmployees: number;
  directLabor: number;
  indirectLabor: number;
  shiftsPerDay: number;
  hoursPerShift: number;
  averageWage: number;
  laborEfficiency: number;

  // Equipment
  totalEquipment: number;
  averageEquipmentAge: number;
  maintenanceBudget: number;
  maintenanceSpend: number;
  plannedMaintenance: number;
  unplannedMaintenance: number;
  mtbf: number;
  mttr: number;

  // Quality
  defectRate: number;
  scrapRate: number;
  reworkRate: number;
  firstPassYield: number;
  customerComplaints: number;
  qualityIncidents: number;

  // Compliance
  certifications: CertificationRecord[];
  isoCompliant: boolean;
  oshaCompliant: boolean;
  epaCompliant: boolean;
  lastAuditDate: string | null;
  nextAuditDate: string;
  auditScore: number;

  // Financial
  monthlyRevenue: number;
  monthlyCosts: number;
  costPerUnit: number;
  laborCostPerUnit: number;
  materialCostPerUnit: number;
  overheadPerUnit: number;
  profitMargin: number;

  // Energy
  energyConsumption: number;
  energyCostPerMonth: number;
  carbonFootprint: number;
  renewableEnergyPercent: number;
  sustainabilityScore: number;

  // Inventory
  rawMaterialValue: number;
  wipValue: number;
  finishedGoodsValue: number;
  inventoryTurnover: number;
  daysOfInventory: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PRODUCTION LINE TYPES
// ============================================================================

/**
 * Production line types
 */
export type LineType =
  | 'Assembly'
  | 'Machining'
  | 'Packaging'
  | 'Testing'
  | 'Painting';

/**
 * Line operational status
 */
export type LineStatus =
  | 'Idle'
  | 'Running'
  | 'Changeover'
  | 'Maintenance'
  | 'Breakdown'
  | 'Offline';

/**
 * Sensor data from equipment
 */
export interface SensorData {
  name: string;
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  alertThreshold: number;
  criticalThreshold: number;
}

/**
 * Production line interface
 */
export interface ProductionLine {
  id: UUID;
  companyId: UUID;
  facilityId: UUID;
  name: string;
  lineNumber: number;
  lineType: LineType;
  status: LineStatus;
  active: boolean;

  // Product & Batch
  currentProduct: string | null;
  currentBatchId: string | null;
  batchSize: number;
  batchProgress: number;
  batchStartTime: string | null;
  batchEstimatedCompletion: string | null;

  // Performance
  ratedSpeed: number;
  actualSpeed: number;
  speedEfficiency: number;
  cycleTime: number;
  targetCycleTime: number;
  throughput: number;
  throughputTarget: number;

  // OEE
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  plannedDowntime: number;
  unplannedDowntime: number;
  lastDowntimeReason: string | null;

  // Quality
  unitsProduced: number;
  unitsAccepted: number;
  unitsRejected: number;
  firstPassYield: number;
  scrapCount: number;
  reworkCount: number;
  defectTypes: string[];

  // Equipment
  equipmentAge: number;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string;
  maintenanceHours: number;
  breakdownCount: number;
  mtbf: number;
  mttr: number;
  equipmentHealth: number;
  sensors: SensorData[];

  // Changeover
  changeoverInProgress: boolean;
  lastChangeoverStart: string | null;
  lastChangeoverDuration: number;
  averageChangeoverTime: number;
  targetChangeoverTime: number;
  changeoverCount: number;

  // Staffing
  operatorsRequired: number;
  currentOperators: number;
  operatorSkillRequired: number;
  leadOperator: UUID | null;
  shift: 1 | 2 | 3;

  // Resources
  powerConsumption: number;
  energyPerUnit: number;
  materialsConsumed: number;
  wasteGenerated: number;
  toolingCost: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SUPPLIER TYPES
// ============================================================================

/**
 * Supplier types
 */
export type SupplierType =
  | 'Raw Materials'
  | 'Components'
  | 'Packaging'
  | 'Services'
  | 'Equipment';

/**
 * Supply chain tier
 */
export type SupplierTier =
  | 'Tier1-Direct'
  | 'Tier2-SubSupplier'
  | 'Tier3-RawMaterial';

/**
 * Supplier relationship status
 */
export type SupplierStatus =
  | 'Active'
  | 'Probation'
  | 'Suspended'
  | 'Inactive'
  | 'Preferred';

/**
 * Risk level
 */
export type RiskLevel =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical';

/**
 * Address interface
 */
export interface SupplierAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
}

/**
 * Risk assessment
 */
export interface RiskAssessment {
  category: string;
  level: RiskLevel;
  description: string;
  mitigationPlan?: string;
  lastAssessed: string;
}

/**
 * Contract terms
 */
export interface ContractTerms {
  contractNumber?: string;
  startDate?: string;
  endDate?: string;
  paymentTerms: string;
  minOrderQuantity: number;
  minOrderValue: number;
  volumeDiscountTiers: Array<{ quantity: number; discount: number }>;
  warrantyPeriod: number;
  qualityStandard?: string;
}

/**
 * Catalog item
 */
export interface CatalogItem {
  itemCode: string;
  description: string;
  unitPrice: number;
  currency: string;
  unitOfMeasure: string;
  leadTime: number;
  moq: number;
  lastPriceUpdate: string;
}

/**
 * Supplier interface
 */
export interface Supplier {
  id: UUID;
  companyId: UUID;
  name: string;
  code: string;
  type: SupplierType;
  tier: SupplierTier;
  status: SupplierStatus;
  active: boolean;

  // Contact
  contactName: string;
  email: string;
  phone: string;
  address: SupplierAddress;
  region: string;
  timezone: string;

  // Performance Scorecard
  overallScore: number;
  qualityScore: number;
  deliveryScore: number;
  costScore: number;
  responseScore: number;
  flexibilityScore: number;

  // Delivery Metrics
  onTimeDeliveryRate: number;
  onTimeOrderCount: number;
  lateOrderCount: number;
  averageDelayDays: number;
  perfectOrderRate: number;

  // Quality Metrics
  defectRate: number;
  returnRate: number;
  qualityIncidents: number;
  inspectionPassRate: number;
  lastQualityAudit: string | null;
  qualityAuditScore: number;
  certifications: string[];

  // Lead Time
  leadTime: number;
  leadTimeVariance: number;
  rushOrderCapability: boolean;
  rushOrderPremium: number;

  // Financial
  creditLimit: number;
  currentBalance: number;
  paymentHistory: number;
  annualSpend: number;
  costTrend: number;
  pricingStability: number;

  // Risk
  riskLevel: RiskLevel;
  riskAssessments: RiskAssessment[];
  isSingleSource: boolean;
  alternateSuppliers: UUID[];
  geopoliticalRisk: number;
  financialStability: number;
  disasterRecoveryPlan: boolean;

  // Capacity
  totalCapacity: number;
  allocatedCapacity: number;
  flexCapacity: number;
  capacityUtilization: number;

  // Contract
  contractTerms: ContractTerms;
  catalog: CatalogItem[];

  // Orders
  totalOrders: number;
  totalOrderValue: number;
  openOrders: number;
  openOrderValue: number;
  lastOrderDate: string | null;
  averageOrderValue: number;

  // Relationship
  partnerSince: string | null;
  strategicPartner: boolean;
  exclusiveAgreement: boolean;
  notes: string;
  lastReviewDate: string | null;
  nextReviewDate: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// UTILITY CALCULATION TYPES
// ============================================================================

/**
 * OEE calculation inputs
 */
export interface OEEInputs {
  plannedProductionTime: number;  // Minutes
  operatingTime: number;          // Minutes
  idealCycleTime: number;         // Seconds
  totalPieces: number;
  goodPieces: number;
}

/**
 * OEE calculation result
 */
export interface OEEResult {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  classification: 'World Class' | 'Good' | 'Average' | 'Needs Improvement';
}

/**
 * Supplier scorecard inputs
 */
export interface SupplierScorecardInputs {
  qualityScore: number;
  deliveryScore: number;
  costScore: number;
  responseScore: number;
  flexibilityScore: number;
}

/**
 * Supplier scorecard result
 */
export interface SupplierScorecardResult {
  overallScore: number;
  tier: 'Preferred' | 'Standard' | 'Probation' | 'At Risk';
  recommendation: string;
}

/**
 * Capacity planning inputs
 */
export interface CapacityPlanningInputs {
  demandForecast: number[];       // Units per period
  currentCapacity: number;        // Units per period
  utilizationTarget: number;      // 0-100%
  leadTimeForExpansion: number;   // Periods
}

/**
 * Capacity planning result
 */
export interface CapacityPlanningResult {
  capacityGap: number[];
  expansionNeeded: boolean;
  recommendedExpansion: number;
  implementationPeriod: number;
}

/**
 * COGS calculation inputs
 */
export interface COGSInputs {
  directMaterials: number;
  directLabor: number;
  manufacturingOverhead: number;
  beginningInventory: number;
  endingInventory: number;
}

/**
 * COGS calculation result
 */
export interface COGSResult {
  cogs: number;
  costPerUnit: number;
  grossMargin: number;
  breakdown: {
    materials: number;
    labor: number;
    overhead: number;
  };
}

/**
 * Six Sigma metrics
 */
export interface SixSigmaMetrics {
  defectsPerMillion: number;
  sigmaLevel: number;
  processCapability: number;
  cpk: number;
  yield: number;
}

/**
 * Inventory management inputs
 */
export interface InventoryInputs {
  annualDemand: number;
  orderCost: number;
  holdingCostPerUnit: number;
  leadTimeDays: number;
  safetyStockDays: number;
}

/**
 * Inventory management result (EOQ model)
 */
export interface InventoryResult {
  eoq: number;
  reorderPoint: number;
  safetyStock: number;
  averageInventory: number;
  annualOrderingCost: number;
  annualHoldingCost: number;
  totalInventoryCost: number;
}

/**
 * MRP planning inputs
 */
export interface MRPInputs {
  masterSchedule: Array<{ period: number; demand: number }>;
  billOfMaterials: Array<{ component: string; quantity: number; leadTime: number }>;
  currentInventory: Record<string, number>;
  scheduledReceipts: Record<string, Array<{ period: number; quantity: number }>>;
}

/**
 * MRP planning result
 */
export interface MRPResult {
  plannedOrders: Array<{
    component: string;
    period: number;
    quantity: number;
    dueDate: string;
  }>;
  shortages: Array<{
    component: string;
    period: number;
    shortageQuantity: number;
  }>;
}

// ============================================================================
// DASHBOARD & SUMMARY TYPES
// ============================================================================

/**
 * Manufacturing KPI summary
 */
export interface ManufacturingKPIs {
  facilities: {
    total: number;
    operational: number;
    maintenance: number;
    averageUtilization: number;
    averageOee: number;
  };
  productionLines: {
    total: number;
    running: number;
    idle: number;
    breakdown: number;
    dailyThroughput: number;
  };
  suppliers: {
    total: number;
    preferred: number;
    atRisk: number;
    averageScore: number;
    onTimeDeliveryRate: number;
  };
  quality: {
    overallDefectRate: number;
    firstPassYield: number;
    customerComplaints: number;
    openIncidents: number;
  };
  inventory: {
    totalValue: number;
    rawMaterials: number;
    wip: number;
    finishedGoods: number;
    turnoverRate: number;
  };
}

/**
 * Manufacturing dashboard data
 */
export interface ManufacturingDashboardData {
  kpis: ManufacturingKPIs;
  facilities: ManufacturingFacility[];
  productionLines: ProductionLine[];
  suppliers: Supplier[];
  recentAlerts: Array<{
    id: UUID;
    type: 'quality' | 'maintenance' | 'supply' | 'capacity';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create facility request
 */
export interface CreateFacilityRequest {
  name: string;
  facilityCode: string;
  facilityType: FacilityType;
  automationLevel: AutomationLevel;
  address: SupplierAddress;
  maxCapacity: number;
  productionLines: number;
  shiftsPerDay: number;
  hoursPerShift: number;
}

/**
 * Update facility request
 */
export interface UpdateFacilityRequest {
  name?: string;
  status?: OperationalStatus;
  automationLevel?: AutomationLevel;
  maxCapacity?: number;
  targetUtilization?: number;
  targetOee?: number;
  shiftsPerDay?: number;
  hoursPerShift?: number;
}

/**
 * Create production line request
 */
export interface CreateProductionLineRequest {
  facilityId: UUID;
  name: string;
  lineNumber: number;
  lineType: LineType;
  ratedSpeed: number;
  targetCycleTime: number;
  operatorsRequired: number;
}

/**
 * Update production line request
 */
export interface UpdateProductionLineRequest {
  name?: string;
  status?: LineStatus;
  currentProduct?: string | null;
  currentBatchId?: string | null;
  batchSize?: number;
  ratedSpeed?: number;
  targetCycleTime?: number;
  operatorsRequired?: number;
}

/**
 * Create supplier request
 */
export interface CreateSupplierRequest {
  name: string;
  code: string;
  type: SupplierType;
  tier: SupplierTier;
  contactName: string;
  email: string;
  phone: string;
  address: SupplierAddress;
  region?: string;
}

/**
 * Update supplier request
 */
export interface UpdateSupplierRequest {
  name?: string;
  status?: SupplierStatus;
  contactName?: string;
  email?: string;
  phone?: string;
  creditLimit?: number;
  strategicPartner?: boolean;
  notes?: string;
}

/**
 * Scorecard update request
 */
export interface UpdateScorecardRequest {
  qualityScore?: number;
  deliveryScore?: number;
  costScore?: number;
  responseScore?: number;
  flexibilityScore?: number;
}

/**
 * Batch operation request (start/complete)
 */
export interface BatchOperationRequest {
  lineId: UUID;
  action: 'start' | 'complete' | 'abort';
  productName?: string;
  batchId?: string;
  batchSize?: number;
}

/**
 * Maintenance request
 */
export interface MaintenanceRequest {
  entityType: 'facility' | 'line' | 'equipment';
  entityId: UUID;
  maintenanceType: 'preventive' | 'corrective' | 'predictive';
  description: string;
  scheduledStart: string;
  estimatedDuration: number;  // Hours
  assignedTo?: UUID;
}
