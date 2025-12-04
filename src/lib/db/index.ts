/**
 * @fileoverview Database Utilities Exports
 * @module lib/db
 * 
 * OVERVIEW:
 * Central export point for database utilities.
 * Provides clean imports: import { connectDB } from '@/lib/db'
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

export { connectDB, disconnectDB } from './mongoose';
export { default as User } from './models/User';
export { default as Company } from './models/Company';
export { default as Employee } from './models/Employee';
export { default as Contract } from './models/Contract';
export { default as Department } from './models/Department';
export { default as AIModel } from './models/AIModel';
export { default as AIResearchProject } from './models/AIResearchProject';

// Banking system models
export { default as Bank } from './models/Bank';
export { default as Loan } from './models/Loan';
export { default as Investment } from './models/Investment';
export { default as InvestmentPortfolio } from './models/InvestmentPortfolio';
// Crime domain models (Phase 1 Alpha + Phase 2 Beta)
export { default as ProductionFacility } from './models/crime/ProductionFacility';
export { default as DistributionRoute } from './models/crime/DistributionRoute';
export { default as MarketplaceListing } from './models/crime/MarketplaceListing';
export { default as LaunderingChannel } from './models/crime/LaunderingChannel';
export { default as HeatLevel } from './models/crime/HeatLevel';
export { default as Gang } from './models/crime/Gang';
export { default as Territory } from './models/crime/Territory';
export { default as TurfWar } from './models/crime/TurfWar';
export { default as LegislationStatus } from './models/crime/LegislationStatus';
export { default as BlackMarketItem } from './models/crime/BlackMarketItem';
