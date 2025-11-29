/**
 * @fileoverview Manufacturing Industry Data Hooks
 * @module lib/hooks/useManufacturing
 * 
 * OVERVIEW:
 * Data fetching hooks for Manufacturing industry companies.
 * Covers facilities, production lines, suppliers, inventory,
 * quality metrics, and procurement.
 * Used by ManufacturingDashboard for real-time manufacturing metrics.
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.2
 */

'use client';

import { useAPI, type UseAPIOptions } from './useAPI';
import { manufacturingEndpoints } from '@/lib/api/endpoints';

// ============================================================================
// TYPES - Manufacturing Entity Types
// ============================================================================

/**
 * Manufacturing Facility type - Production facility
 */
export interface ManufacturingFacility {
  id: string;
  name: string;
  code: string;
  company: string;
  type: 'assembly' | 'process' | 'discrete' | 'continuous' | 'batch' | 'job_shop' | 'hybrid';
  status: 'operational' | 'maintenance' | 'construction' | 'shutdown' | 'renovation';
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    timezone: string;
    coordinates?: { lat: number; lng: number };
  };
  capacity: {
    designed: number;
    current: number;
    utilized: number;
    utilizationRate: number;
    bottleneck?: string;
  };
  metrics: {
    oee: number;
    availability: number;
    performance: number;
    quality: number;
    throughput: number;
    cycleTime: number;
  };
  workforce: {
    totalEmployees: number;
    directLabor: number;
    indirectLabor: number;
    contractors: number;
    shifts: number;
  };
  financials: {
    monthlyOperatingCost: number;
    laborCost: number;
    utilityCost: number;
    maintenanceCost: number;
    costPerUnit: number;
  };
  certifications: string[];
  active: boolean;
}

/**
 * Production Line type - Manufacturing line within a facility
 */
export interface ProductionLine {
  id: string;
  name: string;
  code: string;
  facility: string;
  company: string;
  type: 'assembly' | 'fabrication' | 'packaging' | 'testing' | 'finishing' | 'mixed';
  automationLevel: 'manual' | 'semi_automated' | 'automated' | 'fully_automated' | 'lights_out';
  status: 'running' | 'idle' | 'changeover' | 'maintenance' | 'breakdown' | 'shutdown';
  capacity: {
    designedCapacity: number;
    maxCapacity: number;
    currentCapacity: number;
    utilizationRate: number;
  };
  performance: {
    oee: number;
    availability: number;
    performance: number;
    quality: number;
    throughput: {
      planned: number;
      actual: number;
      gap: number;
    };
    cycleTime: {
      target: number;
      actual: number;
      variance: number;
    };
  };
  quality: {
    defects: {
      total: number;
      critical: number;
      major: number;
      minor: number;
    };
    scrapRate: number;
    reworkRate: number;
    firstPassYield: number;
  };
  currentProduct: {
    productId: string;
    productName: string;
    sku: string;
    batchNumber: string;
    producedQuantity: number;
    targetQuantity: number;
  };
  active: boolean;
}

/**
 * Supplier type - Manufacturing supplier/vendor
 */
export interface Supplier {
  id: string;
  name: string;
  code: string;
  company: string;
  type: 'raw_materials' | 'components' | 'sub_assembly' | 'packaging' | 'mro' | 'services' | 'logistics';
  tier: 'tier_1' | 'tier_2' | 'tier_3' | 'strategic' | 'preferred' | 'approved' | 'conditional';
  status: 'Active' | 'On Hold' | 'Under Review' | 'Suspended' | 'Terminated';
  region: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };
  performance: {
    onTimeDeliveryRate: number;
    orderFillRate: number;
    defectRate: number;
    averageLeadTime: number;
    responseTime: number;
  };
  scorecard: {
    qualityScore: number;
    deliveryScore: number;
    costScore: number;
    responseScore: number;
    flexibilityScore: number;
    overallScore: number;
    trend: 'Improving' | 'Stable' | 'Declining';
  };
  financials: {
    annualSpend: number;
    averageOrderValue: number;
    paymentTerms: string;
    currentBalance: number;
  };
  risk: {
    level: 'Low' | 'Medium' | 'High' | 'Critical';
    factors: string[];
    singleSourceRisk: boolean;
  };
  certifications: string[];
  strategicPartner: boolean;
  active: boolean;
}

/**
 * Inventory Item type - Raw materials and finished goods
 */
export interface InventoryItem {
  id: string;
  company: string;
  facility: string;
  sku: string;
  name: string;
  category: 'raw_material' | 'component' | 'wip' | 'finished_good' | 'packaging' | 'mro';
  quantity: number;
  unit: string;
  unitCost: number;
  totalValue: number;
  reorderPoint: number;
  safetyStock: number;
  leadTime: number;
  supplier?: string;
  location: {
    warehouse: string;
    zone: string;
    bin: string;
  };
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstock' | 'Obsolete';
}

/**
 * Quality Metrics type - OEE and Six Sigma data
 */
export interface QualityMetrics {
  facilityId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  oee: {
    overall: number;
    availability: number;
    performance: number;
    quality: number;
    trend: number[];
  };
  sixSigma: {
    dpmo: number;
    sigmaLevel: number;
    yield: number;
    cp: number;
    cpk: number;
  };
  defects: {
    total: number;
    byType: Record<string, number>;
    paretoAnalysis: Array<{ type: string; count: number; cumulative: number }>;
  };
  scrap: {
    units: number;
    value: number;
    rate: number;
  };
  rework: {
    units: number;
    value: number;
    rate: number;
  };
}

/**
 * Procurement Order type - Purchase orders
 */
export interface ProcurementOrder {
  id: string;
  company: string;
  supplier: string;
  orderNumber: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Ordered' | 'In Transit' | 'Received' | 'Cancelled';
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalValue: number;
  orderDate: Date;
  expectedDelivery: Date;
  actualDelivery?: Date;
  paymentTerms: string;
  priority: 'Low' | 'Normal' | 'High' | 'Critical';
}

/**
 * Manufacturing Company Summary for dashboard
 */
export interface ManufacturingSummary {
  // Facilities
  totalFacilities: number;
  operationalFacilities: number;
  totalCapacity: number;
  averageUtilization: number;
  
  // Production Lines
  totalLines: number;
  runningLines: number;
  averageOEE: number;
  averageAvailability: number;
  averagePerformance: number;
  averageQuality: number;
  
  // Suppliers
  totalSuppliers: number;
  activeSuppliers: number;
  strategicPartners: number;
  averageSupplierScore: number;
  totalAnnualSpend: number;
  
  // Inventory
  totalInventoryValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  overstockItems: number;
  
  // Quality
  overallOEE: number;
  totalDefects: number;
  scrapRate: number;
  firstPassYield: number;
  
  // Financial
  monthlyOperatingCost: number;
  costPerUnit: number;
  laborCostPercentage: number;
  
  // Recent Activity
  recentActivity: Array<{
    id: string;
    type: 'facility' | 'line' | 'supplier' | 'inventory' | 'quality' | 'procurement';
    title: string;
    description: string;
    timestamp: Date;
    impact?: 'high' | 'medium' | 'low';
  }>;
}

// ============================================================================
// HOOKS - Facilities
// ============================================================================

/**
 * useManufacturingFacilities - Fetch facilities for a company
 * 
 * @example
 * ```typescript
 * const { data: facilities, isLoading } = useManufacturingFacilities(companyId);
 * ```
 */
export function useManufacturingFacilities(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<{ facilities: ManufacturingFacility[]; pagination: unknown; summary: unknown }>(
    companyId ? manufacturingEndpoints.facilities.list(companyId) : null,
    options
  );
}

/**
 * useManufacturingFacility - Fetch single facility by ID
 */
export function useManufacturingFacility(facilityId: string | null, options?: UseAPIOptions) {
  return useAPI<ManufacturingFacility>(
    facilityId ? manufacturingEndpoints.facilities.byId(facilityId) : null,
    options
  );
}

// ============================================================================
// HOOKS - Production Lines
// ============================================================================

/**
 * useProductionLines - Fetch production lines for a company
 * 
 * @example
 * ```typescript
 * const { data: lines, isLoading } = useProductionLines(companyId);
 * ```
 */
export function useProductionLines(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<{ productionLines: ProductionLine[]; pagination: unknown; summary: unknown }>(
    companyId ? manufacturingEndpoints.productionLines.list(companyId) : null,
    options
  );
}

/**
 * useProductionLinesByFacility - Fetch production lines for a specific facility
 */
export function useProductionLinesByFacility(facilityId: string | null, options?: UseAPIOptions) {
  return useAPI<{ productionLines: ProductionLine[]; pagination: unknown; summary: unknown }>(
    facilityId ? manufacturingEndpoints.productionLines.byFacility(facilityId) : null,
    options
  );
}

/**
 * useProductionLine - Fetch single production line by ID
 */
export function useProductionLine(lineId: string | null, options?: UseAPIOptions) {
  return useAPI<ProductionLine>(
    lineId ? manufacturingEndpoints.productionLines.byId(lineId) : null,
    options
  );
}

// ============================================================================
// HOOKS - Suppliers
// ============================================================================

/**
 * useSuppliers - Fetch suppliers for a company
 * 
 * @example
 * ```typescript
 * const { data: suppliers, isLoading } = useSuppliers(companyId);
 * ```
 */
export function useSuppliers(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<{ suppliers: Supplier[]; pagination: unknown; summary: unknown }>(
    companyId ? manufacturingEndpoints.suppliers.list(companyId) : null,
    options
  );
}

/**
 * useSupplier - Fetch single supplier by ID
 */
export function useSupplier(supplierId: string | null, options?: UseAPIOptions) {
  return useAPI<Supplier>(
    supplierId ? manufacturingEndpoints.suppliers.byId(supplierId) : null,
    options
  );
}

/**
 * useSupplierScorecard - Fetch supplier scorecard data
 */
export function useSupplierScorecard(supplierId: string | null, options?: UseAPIOptions) {
  return useAPI<{ scorecard: Supplier['scorecard']; history: unknown[] }>(
    supplierId ? manufacturingEndpoints.suppliers.scorecard(supplierId) : null,
    options
  );
}

// ============================================================================
// HOOKS - Inventory
// ============================================================================

/**
 * useInventory - Fetch inventory for a company
 * 
 * @example
 * ```typescript
 * const { data: inventory, isLoading } = useInventory(companyId);
 * ```
 */
export function useInventory(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<{ items: InventoryItem[]; pagination: unknown; summary: unknown }>(
    companyId ? manufacturingEndpoints.inventory.list(companyId) : null,
    options
  );
}

/**
 * useInventoryByFacility - Fetch inventory for a specific facility
 */
export function useInventoryByFacility(facilityId: string | null, options?: UseAPIOptions) {
  return useAPI<{ items: InventoryItem[]; pagination: unknown; summary: unknown }>(
    facilityId ? manufacturingEndpoints.inventory.byFacility(facilityId) : null,
    options
  );
}

/**
 * useInventoryItem - Fetch single inventory item by ID
 */
export function useInventoryItem(itemId: string | null, options?: UseAPIOptions) {
  return useAPI<InventoryItem>(
    itemId ? manufacturingEndpoints.inventory.byId(itemId) : null,
    options
  );
}

// ============================================================================
// HOOKS - Quality Metrics
// ============================================================================

/**
 * useOEEMetrics - Fetch OEE metrics for a facility
 * 
 * @example
 * ```typescript
 * const { data: oee, isLoading } = useOEEMetrics(facilityId);
 * ```
 */
export function useOEEMetrics(facilityId: string | null, options?: UseAPIOptions) {
  return useAPI<QualityMetrics['oee']>(
    facilityId ? manufacturingEndpoints.quality.oee(facilityId) : null,
    options
  );
}

/**
 * useSixSigmaMetrics - Fetch Six Sigma metrics for a facility
 */
export function useSixSigmaMetrics(facilityId: string | null, options?: UseAPIOptions) {
  return useAPI<QualityMetrics['sixSigma']>(
    facilityId ? manufacturingEndpoints.quality.sixSigma(facilityId) : null,
    options
  );
}

/**
 * useDefectMetrics - Fetch defect data for a company
 */
export function useDefectMetrics(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<QualityMetrics['defects']>(
    companyId ? manufacturingEndpoints.quality.defects(companyId) : null,
    options
  );
}

/**
 * useQualityTrends - Fetch quality trend data for a company
 */
export function useQualityTrends(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<{ oee: number[]; defects: number[]; yield: number[]; periods: string[] }>(
    companyId ? manufacturingEndpoints.quality.trends(companyId) : null,
    options
  );
}

// ============================================================================
// HOOKS - Procurement
// ============================================================================

/**
 * useProcurementOrders - Fetch procurement orders for a company
 * 
 * @example
 * ```typescript
 * const { data: orders, isLoading } = useProcurementOrders(companyId);
 * ```
 */
export function useProcurementOrders(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<{ orders: ProcurementOrder[]; pagination: unknown; summary: unknown }>(
    companyId ? manufacturingEndpoints.procurement.orders(companyId) : null,
    options
  );
}

/**
 * useProcurementOrder - Fetch single procurement order by ID
 */
export function useProcurementOrder(orderId: string | null, options?: UseAPIOptions) {
  return useAPI<ProcurementOrder>(
    orderId ? manufacturingEndpoints.procurement.byId(orderId) : null,
    options
  );
}

// ============================================================================
// HOOKS - Aggregated Summary
// ============================================================================

/**
 * useManufacturingSummary - Fetch aggregated manufacturing metrics for dashboard
 * Combines all manufacturing assets into one summary for efficient dashboard display
 * 
 * @example
 * ```typescript
 * const { data: summary, isLoading } = useManufacturingSummary(companyId);
 * // summary.totalFacilities, summary.averageOEE, summary.totalSuppliers
 * ```
 */
export function useManufacturingSummary(companyId: string | null, options?: UseAPIOptions) {
  // Fetch all manufacturing data sources
  const facilities = useManufacturingFacilities(companyId, options);
  const lines = useProductionLines(companyId, options);
  const suppliers = useSuppliers(companyId, options);
  const inventory = useInventory(companyId, options);

  // Loading state (any still loading)
  const isLoading = 
    facilities.isLoading || 
    lines.isLoading || 
    suppliers.isLoading || 
    inventory.isLoading;

  // Error state (first error found)
  const error = 
    facilities.error || 
    lines.error || 
    suppliers.error || 
    inventory.error;

  // Calculate summary data
  const data: ManufacturingSummary | null = !isLoading ? {
    // Facilities
    totalFacilities: facilities.data?.facilities?.length ?? 0,
    operationalFacilities: facilities.data?.facilities?.filter(
      (f: ManufacturingFacility) => f.status === 'operational'
    ).length ?? 0,
    totalCapacity: facilities.data?.facilities?.reduce(
      (sum: number, f: ManufacturingFacility) => sum + f.capacity.designed, 0
    ) ?? 0,
    averageUtilization: facilities.data?.facilities?.length 
      ? facilities.data.facilities.reduce(
          (sum: number, f: ManufacturingFacility) => sum + f.capacity.utilizationRate, 0
        ) / facilities.data.facilities.length 
      : 0,
    
    // Production Lines
    totalLines: lines.data?.productionLines?.length ?? 0,
    runningLines: lines.data?.productionLines?.filter(
      (l: ProductionLine) => l.status === 'running'
    ).length ?? 0,
    averageOEE: lines.data?.productionLines?.length 
      ? lines.data.productionLines.reduce(
          (sum: number, l: ProductionLine) => sum + l.performance.oee, 0
        ) / lines.data.productionLines.length 
      : 0,
    averageAvailability: lines.data?.productionLines?.length 
      ? lines.data.productionLines.reduce(
          (sum: number, l: ProductionLine) => sum + l.performance.availability, 0
        ) / lines.data.productionLines.length 
      : 0,
    averagePerformance: lines.data?.productionLines?.length 
      ? lines.data.productionLines.reduce(
          (sum: number, l: ProductionLine) => sum + l.performance.performance, 0
        ) / lines.data.productionLines.length 
      : 0,
    averageQuality: lines.data?.productionLines?.length 
      ? lines.data.productionLines.reduce(
          (sum: number, l: ProductionLine) => sum + l.performance.quality, 0
        ) / lines.data.productionLines.length 
      : 0,
    
    // Suppliers
    totalSuppliers: suppliers.data?.suppliers?.length ?? 0,
    activeSuppliers: suppliers.data?.suppliers?.filter(
      (s: Supplier) => s.status === 'Active'
    ).length ?? 0,
    strategicPartners: suppliers.data?.suppliers?.filter(
      (s: Supplier) => s.strategicPartner
    ).length ?? 0,
    averageSupplierScore: suppliers.data?.suppliers?.length 
      ? suppliers.data.suppliers.reduce(
          (sum: number, s: Supplier) => sum + s.scorecard.overallScore, 0
        ) / suppliers.data.suppliers.length 
      : 0,
    totalAnnualSpend: suppliers.data?.suppliers?.reduce(
      (sum: number, s: Supplier) => sum + s.financials.annualSpend, 0
    ) ?? 0,
    
    // Inventory
    totalInventoryValue: inventory.data?.items?.reduce(
      (sum: number, i: InventoryItem) => sum + i.totalValue, 0
    ) ?? 0,
    lowStockItems: inventory.data?.items?.filter(
      (i: InventoryItem) => i.status === 'Low Stock'
    ).length ?? 0,
    outOfStockItems: inventory.data?.items?.filter(
      (i: InventoryItem) => i.status === 'Out of Stock'
    ).length ?? 0,
    overstockItems: inventory.data?.items?.filter(
      (i: InventoryItem) => i.status === 'Overstock'
    ).length ?? 0,
    
    // Quality
    overallOEE: lines.data?.productionLines?.length 
      ? lines.data.productionLines.reduce(
          (sum: number, l: ProductionLine) => sum + l.performance.oee, 0
        ) / lines.data.productionLines.length 
      : 0,
    totalDefects: lines.data?.productionLines?.reduce(
      (sum: number, l: ProductionLine) => sum + l.quality.defects.total, 0
    ) ?? 0,
    scrapRate: lines.data?.productionLines?.length 
      ? lines.data.productionLines.reduce(
          (sum: number, l: ProductionLine) => sum + l.quality.scrapRate, 0
        ) / lines.data.productionLines.length 
      : 0,
    firstPassYield: lines.data?.productionLines?.length 
      ? lines.data.productionLines.reduce(
          (sum: number, l: ProductionLine) => sum + l.quality.firstPassYield, 0
        ) / lines.data.productionLines.length 
      : 0,
    
    // Financial
    monthlyOperatingCost: facilities.data?.facilities?.reduce(
      (sum: number, f: ManufacturingFacility) => sum + f.financials.monthlyOperatingCost, 0
    ) ?? 0,
    costPerUnit: facilities.data?.facilities?.length 
      ? facilities.data.facilities.reduce(
          (sum: number, f: ManufacturingFacility) => sum + f.financials.costPerUnit, 0
        ) / facilities.data.facilities.length 
      : 0,
    laborCostPercentage: facilities.data?.facilities?.length 
      ? (facilities.data.facilities.reduce(
          (sum: number, f: ManufacturingFacility) => sum + f.financials.laborCost, 0
        ) / facilities.data.facilities.reduce(
          (sum: number, f: ManufacturingFacility) => sum + f.financials.monthlyOperatingCost, 0
        )) * 100 
      : 0,
    
    // Recent Activity
    recentActivity: [], // Would be populated from activity log
  } : null;

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      facilities.refetch?.();
      lines.refetch?.();
      suppliers.refetch?.();
      inventory.refetch?.();
    },
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * PATTERN:
 * - Individual hooks for each entity type (useFacilities, useProductionLines, etc.)
 * - Aggregated hook (useManufacturingSummary) for dashboard view
 * - All hooks use centralized endpoint definitions from endpoints.ts
 * - Follows exact pattern established by useEnergy.ts
 * 
 * ENTITIES COVERED:
 * - Facilities: Production facilities with capacity and OEE metrics
 * - Production Lines: Manufacturing lines with performance tracking
 * - Suppliers: Vendor management with scorecards and risk assessment
 * - Inventory: Raw materials and finished goods tracking
 * - Quality: OEE, Six Sigma, defects, and trends
 * - Procurement: Purchase orders and receiving
 * 
 * USAGE:
 * ```typescript
 * // Individual entity hooks
 * const { data: facilities } = useManufacturingFacilities(companyId);
 * const { data: lines } = useProductionLines(companyId);
 * 
 * // Aggregated summary for dashboard
 * const { data: summary, isLoading } = useManufacturingSummary(companyId);
 * // summary.averageOEE, summary.totalSuppliers, summary.totalInventoryValue
 * ```
 * 
 * @updated 2025-11-29
 * @author ECHO v1.3.2
 */
