/**
 * @file src/lib/db/models/manufacturing/index.ts
 * @description Manufacturing models barrel export
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Central export file for all manufacturing-related Mongoose models.
 * Provides clean import paths for ManufacturingFacility, ProductionLine, and Supplier models.
 * 
 * USAGE:
 * import { ManufacturingFacility, ProductionLine, Supplier } from '@/lib/db/models/manufacturing';
 * import { ManufacturingProductionLine, ManufacturingSupplier } from '@/lib/db/models/manufacturing'; // Aliases
 * import type { IManufacturingFacility, IProductionLine, ISupplier } from '@/lib/db/models/manufacturing';
 */

import ProductionLineModel from './ProductionLine';
import SupplierModel from './Supplier';

// Models - Primary exports
export { default as ManufacturingFacility } from './ManufacturingFacility';
export { default as ProductionLine } from './ProductionLine';
export { default as Supplier } from './Supplier';

// Model Aliases - For backwards compatibility with API routes
export const ManufacturingProductionLine = ProductionLineModel;
export const ManufacturingSupplier = SupplierModel;

// Types from ManufacturingFacility
export type { IManufacturingFacility } from './ManufacturingFacility';
export {
  FacilityType,
  AutomationLevel,
  ISOCompliance,
  type FacilityTypeValue,
  type AutomationLevelValue,
  type ISOComplianceValue,
} from './ManufacturingFacility';

// Types from ProductionLine
export type { IProductionLine, SensorData } from './ProductionLine';
export {
  LineType,
  LineStatus,
  type LineTypeValue,
  type LineStatusValue,
} from './ProductionLine';

// Types from Supplier
export type {
  ISupplier,
  SupplierAddress,
  RiskAssessment,
  ContractTerms,
  CatalogItem,
} from './Supplier';
export {
  SupplierType,
  SupplierTier,
  SupplierStatus,
  RiskLevel,
  type SupplierTypeValue,
  type SupplierTierValue,
  type SupplierStatusValue,
  type RiskLevelValue,
} from './Supplier';
