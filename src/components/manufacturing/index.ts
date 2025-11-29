/**
 * @fileoverview Manufacturing Components Barrel Export
 * @module components/manufacturing
 * 
 * OVERVIEW:
 * Barrel export file for all manufacturing-related components.
 * Provides clean import paths for the manufacturing domain.
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.2
 */

// Card Components
export { FacilityCard, type ManufacturingFacilityData } from './FacilityCard';
export { ProductionLineCard, type ProductionLineData } from './ProductionLineCard';
export { SupplierCard, type SupplierData } from './SupplierCard';

// Dashboard
export { ManufacturingDashboard } from './ManufacturingDashboard';
export { default as ManufacturingDashboardDefault } from './ManufacturingDashboard';

/**
 * USAGE:
 * 
 * ```tsx
 * // Import individual components
 * import { FacilityCard, ProductionLineCard, SupplierCard } from '@/components/manufacturing';
 * 
 * // Import dashboard
 * import { ManufacturingDashboard } from '@/components/manufacturing';
 * 
 * // Import types
 * import type { ManufacturingFacilityData, ProductionLineData, SupplierData } from '@/components/manufacturing';
 * ```
 */
