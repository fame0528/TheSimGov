/**
 * @fileoverview Crime Industry Data Hooks
 * @module hooks/useCrime
 * 
 * OVERVIEW:
 * SWR-based data fetching hooks for Crime domain operations.
 * Provides hooks for production facilities, distribution routes,
 * marketplace listings, money laundering channels, and heat level tracking.
 * All hooks return ResponseEnvelope<T> for consistent error handling.
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3 FLAWLESS PROTOCOL
 */

'use client';

import { useState, useCallback } from 'react';
import { useAPI, type UseAPIOptions } from '@/lib/hooks/useAPI';
import { crimeEndpoints } from '@/lib/api/endpoints';
import type {
  FacilityDTO,
  RouteDTO,
  MarketplaceListingDTO,
  LaunderingChannelDTO,
  HeatLevelDTO,
  ResponseEnvelope,
  LegislationBillDTO,
  ConversionResultDTO,
} from '@/lib/dto/crime';
import type {
  FacilityType,
  StateCode,
  SubstanceName,
  LegislationStatusDTO,
} from '@/lib/types/crime';

/**
 * Filter interface for facility queries
 */
export interface FacilityFilters {
  type?: FacilityType;
  state?: StateCode;
}

/**
 * Filter interface for route queries
 */
export interface RouteFilters {
  origin?: StateCode;
  destination?: StateCode;
}

/**
 * Filter interface for marketplace queries
 */
export interface MarketplaceFilters {
  substance?: SubstanceName;
  state?: StateCode;
  minPurity?: number;
  maxPrice?: number;
}

/**
 * Filter interface for laundering queries
 */
export interface LaunderingFilters {
  method?: 'Shell' | 'CashBiz' | 'Crypto' | 'TradeBased' | 'Counterfeit';
}

/**
 * Heat query parameters
 */
export interface HeatQuery {
  scope: 'Global' | 'State' | 'City' | 'User' | 'Gang';
  scopeId: string;
}

/**
 * Filter interface for legislation status queries
 */
export interface LegislationFilters {
  substance?: SubstanceName;
  jurisdiction?: StateCode;
  jurisdictionId?: string;
}

/**
 * Filter interface for legislation bills queries
 */
export interface LegislationBillsFilters {
  substance?: SubstanceName;
  jurisdiction?: StateCode;
  jurisdictionId?: string;
  onlyLinked?: boolean;
}

/**
 * Crime enterprise summary for dashboard
 */
export interface CrimeSummary {
  // Facilities
  totalFacilities: number;
  activeFacilities: number;
  facilitiesByType: Record<string, number>;
  totalFacilityCapacity: number;
  averageQuality: number;
  
  // Routes
  totalRoutes: number;
  activeRoutes: number;
  routesByMethod: Record<string, number>;
  totalRouteCapacity: number;
  averageRiskScore: number;
  
  // Marketplace
  totalListings: number;
  activeListings: number;
  totalInventoryValue: number;
  listingsBySubstance: Record<string, number>;
  averagePurity: number;
  
  // Laundering
  totalChannels: number;
  channelsByMethod: Record<string, number>;
  totalThroughputCap: number;
  averageFeePercent: number;
  averageDetectionRisk: number;
  
  // Heat
  globalHeat: number;
  userHeat: number;
}

/**
 * Fetch all production facilities for a company with optional filters
 * 
 * @param companyId - Company ID to filter facilities
 * @param filters - Optional filters (type, state)
 * @param options - SWR options
 * @returns ResponseEnvelope containing FacilityDTO array
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error } = useCrimeFacilities(companyId, { type: 'Lab', state: 'NM' });
 * if (data?.success) {
 *   console.log(data.data); // FacilityDTO[]
 * }
 * ```
 */
export function useCrimeFacilities(
  companyId: string | null,
  filters?: FacilityFilters,
  options?: UseAPIOptions
) {
  const params = new URLSearchParams();
  if (companyId) params.append('company', companyId);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.state) params.append('state', filters.state);
  
  const queryString = params.toString();
  const url = companyId 
    ? `${crimeEndpoints.facilities}${queryString ? `?${queryString}` : ''}`
    : null;
  
  return useAPI<ResponseEnvelope<FacilityDTO[]>>(url, options);
}

/**
 * Fetch a single production facility by ID
 * 
 * @param facilityId - Facility ID
 * @param options - SWR options
 * @returns ResponseEnvelope containing single FacilityDTO
 */
export function useCrimeFacility(
  facilityId: string | null,
  options?: UseAPIOptions
) {
  const url = facilityId ? `${crimeEndpoints.facilities}/${facilityId}` : null;
  return useAPI<ResponseEnvelope<FacilityDTO>>(url, options);
}

/**
 * Fetch all distribution routes for a company with optional filters
 * 
 * @param companyId - Company ID to filter routes
 * @param filters - Optional filters (origin, destination)
 * @param options - SWR options
 * @returns ResponseEnvelope containing RouteDTO array
 * 
 * @example
 * ```typescript
 * const { data } = useCrimeRoutes(companyId, { origin: 'CA', destination: 'NY' });
 * ```
 */
export function useCrimeRoutes(
  companyId: string | null,
  filters?: RouteFilters,
  options?: UseAPIOptions
) {
  const params = new URLSearchParams();
  if (companyId) params.append('company', companyId);
  if (filters?.origin) params.append('origin', filters.origin);
  if (filters?.destination) params.append('destination', filters.destination);
  
  const queryString = params.toString();
  const url = companyId 
    ? `${crimeEndpoints.routes}${queryString ? `?${queryString}` : ''}`
    : null;
  
  return useAPI<ResponseEnvelope<RouteDTO[]>>(url, options);
}

/**
 * Fetch a single distribution route by ID
 * 
 * @param routeId - Route ID
 * @param options - SWR options
 * @returns ResponseEnvelope containing single RouteDTO
 */
export function useCrimeRoute(
  routeId: string | null,
  options?: UseAPIOptions
) {
  const url = routeId ? `${crimeEndpoints.routes}/${routeId}` : null;
  return useAPI<ResponseEnvelope<RouteDTO>>(url, options);
}

/**
 * Fetch all marketplace listings for a company with optional filters
 * 
 * @param companyId - Company ID to filter listings
 * @param filters - Optional filters (substance, state, purity, price)
 * @param options - SWR options
 * @returns ResponseEnvelope containing MarketplaceListingDTO array
 * 
 * @example
 * ```typescript
 * const { data } = useCrimeMarketplace(companyId, { 
 *   substance: 'Cocaine', 
 *   minPurity: 85,
 *   maxPrice: 60000 
 * });
 * ```
 */
export function useCrimeMarketplace(
  companyId: string | null,
  filters?: MarketplaceFilters,
  options?: UseAPIOptions
) {
  const params = new URLSearchParams();
  if (companyId) params.append('company', companyId);
  if (filters?.substance) params.append('substance', filters.substance);
  if (filters?.state) params.append('state', filters.state);
  if (filters?.minPurity !== undefined) params.append('minPurity', filters.minPurity.toString());
  if (filters?.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
  
  const queryString = params.toString();
  const url = companyId 
    ? `${crimeEndpoints.marketplace}${queryString ? `?${queryString}` : ''}`
    : null;
  
  return useAPI<ResponseEnvelope<MarketplaceListingDTO[]>>(url, options);
}

/**
 * Fetch a single marketplace listing by ID
 * 
 * @param listingId - Listing ID
 * @param options - SWR options
 * @returns ResponseEnvelope containing single MarketplaceListingDTO
 */
export function useCrimeMarketplaceListing(
  listingId: string | null,
  options?: UseAPIOptions
) {
  const url = listingId ? `${crimeEndpoints.marketplace}/${listingId}` : null;
  return useAPI<ResponseEnvelope<MarketplaceListingDTO>>(url, options);
}

/**
 * Fetch all laundering channels for a company with optional filters
 * 
 * @param companyId - Company ID to filter channels
 * @param filters - Optional filters (method)
 * @param options - SWR options
 * @returns ResponseEnvelope containing LaunderingChannelDTO array
 * 
 * @example
 * ```typescript
 * const { data } = useCrimeLaundering(companyId, { method: 'Crypto' });
 * ```
 */
export function useCrimeLaundering(
  companyId: string | null,
  filters?: LaunderingFilters,
  options?: UseAPIOptions
) {
  const params = new URLSearchParams();
  if (companyId) params.append('company', companyId);
  if (filters?.method) params.append('method', filters.method);
  
  const queryString = params.toString();
  const url = companyId 
    ? `${crimeEndpoints.laundering}${queryString ? `?${queryString}` : ''}`
    : null;
  
  return useAPI<ResponseEnvelope<LaunderingChannelDTO[]>>(url, options);
}

/**
 * Fetch a single laundering channel by ID
 * 
 * @param channelId - Channel ID
 * @param options - SWR options
 * @returns ResponseEnvelope containing single LaunderingChannelDTO
 */
export function useCrimeLaunderingChannel(
  channelId: string | null,
  options?: UseAPIOptions
) {
  const url = channelId ? `${crimeEndpoints.laundering}/${channelId}` : null;
  return useAPI<ResponseEnvelope<LaunderingChannelDTO>>(url, options);
}

/**
 * Fetch heat level for a specific scope and ID
 * 
 * @param query - Heat query parameters (scope + scopeId)
 * @param options - SWR options
 * @returns ResponseEnvelope containing HeatLevelDTO or null
 * 
 * @example
 * ```typescript
 * const { data } = useCrimeHeat({ scope: 'State', scopeId: 'CA' });
 * const { data: globalHeat } = useCrimeHeat({ scope: 'Global', scopeId: 'global' });
 * ```
 */
export function useCrimeHeat(
  query: HeatQuery | null,
  options?: UseAPIOptions
) {
  const params = new URLSearchParams();
  if (query?.scope) params.append('scope', query.scope);
  if (query?.scopeId) params.append('scopeId', query.scopeId);
  
  const queryString = params.toString();
  const url = query 
    ? `${crimeEndpoints.heat}${queryString ? `?${queryString}` : ''}`
    : null;
  
  return useAPI<ResponseEnvelope<HeatLevelDTO | null>>(url, options);
}

/**
 * Convenience hook for fetching heat by scope and ID (simpler API)
 * 
 * @param scope - Heat scope (Global, State, City, User, Gang)
 * @param scopeId - Scope identifier
 * @param options - SWR options
 * @returns ResponseEnvelope containing HeatLevelDTO or null
 */
export function useCrimeHeatByScope(
  scope: 'Global' | 'State' | 'City' | 'User' | 'Gang',
  scopeId: string | null,
  options?: UseAPIOptions
) {
  const query = scopeId ? { scope, scopeId } : null;
  return useCrimeHeat(query, options);
}

// ============================================================
// PHASE 3 (Gamma) - Integration Layer Hooks
// ============================================================

/**
 * Fetch LegislationStatus records (substance legality status by jurisdiction)
 * 
 * @param companyId - Company ID (required for authorization context)
 * @param filters - Optional filters (substance, jurisdiction, jurisdictionId)
 * @param options - SWR options
 * @returns ResponseEnvelope containing LegislationStatusDTO[]
 * 
 * @example
 * ```typescript
 * // All legislation statuses
 * const { data } = useCrimeLegislation(companyId);
 * 
 * // Filter by substance
 * const { data: cannabisLaws } = useCrimeLegislation(companyId, { substance: 'Cannabis' });
 * 
 * // Filter by jurisdiction
 * const { data: caLaws } = useCrimeLegislation(companyId, { jurisdiction: 'CA' });
 * ```
 */
export function useCrimeLegislation(
  companyId: string | null,
  filters?: LegislationFilters,
  options?: UseAPIOptions
) {
  const params = new URLSearchParams();
  if (companyId) params.append('companyId', companyId);
  if (filters?.substance) params.append('substance', filters.substance);
  if (filters?.jurisdiction) params.append('jurisdiction', filters.jurisdiction);
  if (filters?.jurisdictionId) params.append('jurisdictionId', filters.jurisdictionId);
  
  const queryString = params.toString();
  const url = companyId
    ? `${crimeEndpoints.legislation.list}${queryString ? `?${queryString}` : ''}`
    : null;
  
  return useAPI<ResponseEnvelope<LegislationStatusDTO[]>>(url, options);
}

/**
 * Fetch Politics Bills linked to Crime LegislationStatus records
 * Enables discovery of which bills affect substance legalization
 * 
 * @param filters - Optional filters (substance, jurisdiction, jurisdictionId, onlyLinked)
 * @param options - SWR options
 * @returns ResponseEnvelope containing LegislationBillDTO[]
 * 
 * @example
 * ```typescript
 * // All linked bills
 * const { data } = useCrimeLegislationBills({ onlyLinked: true });
 * 
 * // Bills affecting specific substance
 * const { data: cannabisBills } = useCrimeLegislationBills({
 *   substance: 'Cannabis',
 *   onlyLinked: true
 * });
 * 
 * // Bills for specific jurisdiction
 * const { data: californiaLaws } = useCrimeLegislationBills({
 *   jurisdiction: 'CA',
 *   onlyLinked: true
 * });
 * ```
 */
export function useCrimeLegislationBills(
  filters?: LegislationBillsFilters,
  options?: UseAPIOptions
) {
  const params = new URLSearchParams();
  if (filters?.substance) params.append('substance', filters.substance);
  if (filters?.jurisdiction) params.append('jurisdiction', filters.jurisdiction);
  if (filters?.jurisdictionId) params.append('jurisdictionId', filters.jurisdictionId);
  if (filters?.onlyLinked !== undefined) params.append('onlyLinked', String(filters.onlyLinked));
  
  const queryString = params.toString();
  const url = `${crimeEndpoints.legislation.bills}${queryString ? `?${queryString}` : ''}`;
  
  return useAPI<ResponseEnvelope<LegislationBillDTO[]>>(url, options);
}

/**
 * Convert illegal facility to legitimate business
 * Mutation hook for POST /api/crime/conversion/convert
 * 
 * @returns Object with convertFacility mutation function and loading/error states
 * 
 * @example
 * ```typescript
 * const { convertFacility, isLoading, error, result } = useConvertFacility();
 * 
 * // Convert facility after substance legalized
 * await convertFacility({
 *   facilityId: '507f1f77bcf86cd799439011',
 *   substance: 'Cannabis',
 *   newBusinessType: 'Dispensary',
 *   licenseApplicationData: {
 *     businessName: 'Green Valley Dispensary',
 *     owners: ['507f191e810c19729de860ea'],
 *     capitalInvestment: 500000,
 *     employeeCount: 12
 *   }
 * });
 * 
 * if (result?.success) {
 *   console.log('Converted facility:', result.data.convertedFacilityId);
 *   console.log('New business:', result.data.businessId);
 *   console.log('Estimated annual revenue:', result.data.conversionDetails.estimatedAnnualRevenue);
 * }
 * ```
 */
export function useConvertFacility() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResponseEnvelope<ConversionResultDTO> | null>(null);

  const convertFacility = useCallback(async (data: {
    facilityId: string;
    substance: SubstanceName;
    newBusinessType: 'Dispensary' | 'Cultivation Facility' | 'Distribution Center' | 'Processing Plant';
    licenseApplicationData?: {
      businessName: string;
      owners: string[];
      capitalInvestment: number;
      employeeCount: number;
    };
  }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(crimeEndpoints.conversion.convert, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await response.json() as ResponseEnvelope<ConversionResultDTO>;
      setResult(json);

      if (!response.ok || !json.success) {
        setError(json.error || 'Conversion failed');
      }

      return json;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage
      } as ResponseEnvelope<ConversionResultDTO>;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    convertFacility,
    isLoading,
    error,
    result
  };
}

/**
 * Aggregated crime enterprise summary for dashboard
 * Combines all entity data sources and calculates summary metrics
 * 
 * @param companyId - Company ID for all queries
 * @param userId - User ID for user heat tracking
 * @param options - SWR options (applied to all hooks)
 * @returns Aggregated CrimeSummary with isLoading, error, and refetch
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useCrimeSummary(companyId, userId);
 * if (data) {
 *   console.log(data.totalFacilities, data.globalHeat, data.totalInventoryValue);
 * }
 * ```
 */
export function useCrimeSummary(
  companyId: string | null,
  userId: string | null,
  options?: UseAPIOptions
) {
  // Fetch all data sources
  const facilities = useCrimeFacilities(companyId, undefined, options);
  const routes = useCrimeRoutes(companyId, undefined, options);
  const marketplace = useCrimeMarketplace(companyId, undefined, options);
  const laundering = useCrimeLaundering(companyId, undefined, options);
  const globalHeat = useCrimeHeatByScope('Global', 'global', options);
  const userHeat = useCrimeHeatByScope('User', userId, options);

  // Loading state (any loading)
  const isLoading = 
    facilities.isLoading || 
    routes.isLoading || 
    marketplace.isLoading || 
    laundering.isLoading ||
    globalHeat.isLoading ||
    userHeat.isLoading;

  // Error state (first error found)
  const error = 
    facilities.error || 
    routes.error || 
    marketplace.error || 
    laundering.error ||
    globalHeat.error ||
    userHeat.error;

  // Calculate summary data - cast to proper array types after Array.isArray check
  const facilitiesArray = (Array.isArray(facilities.data?.data) ? facilities.data.data : []) as FacilityDTO[];
  const routesArray = (Array.isArray(routes.data?.data) ? routes.data.data : []) as RouteDTO[];
  const marketplaceArray = (Array.isArray(marketplace.data?.data) ? marketplace.data.data : []) as MarketplaceListingDTO[];
  const launderingArray = (Array.isArray(laundering.data?.data) ? laundering.data.data : []) as LaunderingChannelDTO[];
  const globalHeatSingle = (!Array.isArray(globalHeat.data?.data) ? globalHeat.data?.data : null) as HeatLevelDTO | null;
  const userHeatSingle = (!Array.isArray(userHeat.data?.data) ? userHeat.data?.data : null) as HeatLevelDTO | null;

  const data: CrimeSummary | null = !isLoading ? {
    // Facilities
    totalFacilities: facilitiesArray.length,
    activeFacilities: facilitiesArray.filter(f => f.status === 'Active').length,
    facilitiesByType: facilitiesArray.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    totalFacilityCapacity: facilitiesArray.reduce((sum, f) => sum + (f.capacity ?? 0), 0),
    averageQuality: facilitiesArray.length > 0
      ? facilitiesArray.reduce((sum, f) => sum + (f.quality ?? 0), 0) / facilitiesArray.length
      : 0,
    
    // Routes
    totalRoutes: routesArray.length,
    activeRoutes: routesArray.filter(r => r.status === 'Active').length,
    routesByMethod: routesArray.reduce((acc, r) => {
      acc[r.method] = (acc[r.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    totalRouteCapacity: routesArray.reduce((sum, r) => sum + (r.capacity ?? 0), 0),
    averageRiskScore: routesArray.length > 0
      ? routesArray.reduce((sum, r) => sum + (r.riskScore ?? 0), 0) / routesArray.length
      : 0,
    
    // Marketplace
    totalListings: marketplaceArray.length,
    activeListings: marketplaceArray.filter(l => l.status === 'Active').length,
    totalInventoryValue: marketplaceArray.reduce((sum, l) => sum + ((l.quantity ?? 0) * (l.pricePerUnit ?? 0)), 0),
    listingsBySubstance: marketplaceArray.reduce((acc, l) => {
      acc[l.substance] = (acc[l.substance] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    averagePurity: marketplaceArray.length > 0
      ? marketplaceArray.reduce((sum, l) => sum + (l.purity ?? 0), 0) / marketplaceArray.length
      : 0,
    
    // Laundering
    totalChannels: launderingArray.length,
    channelsByMethod: launderingArray.reduce((acc, c) => {
      acc[c.method] = (acc[c.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    totalThroughputCap: launderingArray.reduce((sum, c) => sum + (c.throughputCap ?? 0), 0),
    averageFeePercent: launderingArray.length > 0
      ? launderingArray.reduce((sum, c) => sum + (c.feePercent ?? 0), 0) / launderingArray.length
      : 0,
    averageDetectionRisk: launderingArray.length > 0
      ? launderingArray.reduce((sum, c) => sum + (c.detectionRisk ?? 0), 0) / launderingArray.length
      : 0,
    
    // Heat
    globalHeat: globalHeatSingle?.current ?? 0,
    userHeat: userHeatSingle?.current ?? 0,
  } : null;

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      facilities.refetch?.();
      routes.refetch?.();
      marketplace.refetch?.();
      laundering.refetch?.();
      globalHeat.refetch?.();
      userHeat.refetch?.();
    },
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * PATTERN:
 * - Individual hooks for each entity type (facilities, routes, marketplace, laundering, heat)
 * - Aggregated hook (useCrimeSummary) for dashboard view
 * - All hooks use ResponseEnvelope<T> wrapper for consistent error handling
 * - Filter support via query parameters (type, state, substance, purity, price, method)
 * - Follows exact pattern established by useManufacturing.ts and useEnergy.ts
 * 
 * ENTITIES COVERED:
 * - Production Facilities: Manufacturing sites with capacity and quality metrics
 * - Distribution Routes: Transportation networks with risk and cost tracking
 * - Marketplace Listings: Product inventory with pricing and purity
 * - Laundering Channels: Money laundering infrastructure with throughput and fees
 * - Heat Levels: Law enforcement attention tracking at multiple scopes
 * 
 * USAGE:
 * ```typescript
 * // Individual entity hooks
 * const { data: facilities } = useCrimeFacilities(companyId, { type: 'Lab' });
 * const { data: routes } = useCrimeRoutes(companyId, { origin: 'CA' });
 * const { data: listings } = useCrimeMarketplace(companyId, { substance: 'Cocaine', minPurity: 80 });
 * const { data: channels } = useCrimeLaundering(companyId, { method: 'Crypto' });
 * const { data: heat } = useCrimeHeat({ scope: 'State', scopeId: 'CA' });
 * 
 * // Aggregated summary for dashboard
 * const { data: summary, isLoading } = useCrimeSummary(companyId, userId);
 * // summary.totalFacilities, summary.globalHeat, summary.totalInventoryValue
 * 
 * // Check response envelope
 * if (facilities.data?.success) {
 *   console.log(facilities.data.data); // FacilityDTO[]
 * } else {
 *   console.error(facilities.data?.error);
 * }
 * ```
 * 
 * FILTER EXAMPLES:
 * ```typescript
 * // Filter facilities by type and state
 * useCrimeFacilities(companyId, { type: 'Lab', state: 'NM' });
 * 
 * // Filter routes by origin and destination
 * useCrimeRoutes(companyId, { origin: 'CA', destination: 'NY' });
 * 
 * // Filter marketplace by multiple criteria
 * useCrimeMarketplace(companyId, {
 *   substance: 'Cocaine',
 *   state: 'FL',
 *   minPurity: 85,
 *   maxPrice: 60000
 * });
 * 
 * // Filter laundering by method
 * useCrimeLaundering(companyId, { method: 'Shell' });
 * 
 * // Query heat at different scopes
 * useCrimeHeat({ scope: 'Global', scopeId: 'global' });
 * useCrimeHeat({ scope: 'State', scopeId: 'CA' });
 * useCrimeHeat({ scope: 'User', scopeId: userId });
 * ```
 * 
 * @updated 2025-12-01
 * @author ECHO v1.3.3 FLAWLESS PROTOCOL
 */
