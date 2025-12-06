/**
 * @fileoverview Energy Industry Data Hooks
 * @module lib/hooks/useEnergy
 * 
 * OVERVIEW:
 * Data fetching hooks for Energy industry companies.
 * Covers oil wells, gas fields, solar farms, wind turbines, power plants,
 * energy storage, and transmission infrastructure.
 * Used by EnergyDashboard for real-time energy metrics.
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

'use client';

import { useAPI, type UseAPIOptions } from './useAPI';
import { energyEndpoints } from '@/lib/api/endpoints';

// ============================================================================
// TYPES - Energy Asset Types
// ============================================================================

/**
 * Oil Well type - Petroleum extraction site
 */
export interface OilWell {
  id: string;
  name: string;
  companyId: string;
  status: 'drilling' | 'producing' | 'maintenance' | 'depleted' | 'abandoned';
  wellType: 'vertical' | 'horizontal' | 'directional' | 'multilateral';
  depth: number;
  estimatedReserves: number; // barrels
  dailyProduction: number; // barrels per day
  totalExtracted: number;
  extractionCost: number; // per barrel
  depletionRate: number;
  operatingCost: number;
  lastInspection?: Date;
  location: {
    region: string;
    coordinates?: { lat: number; lng: number };
  };
}

/**
 * Gas Field type - Natural gas extraction
 */
export interface GasField {
  id: string;
  name: string;
  companyId: string;
  status: 'exploration' | 'development' | 'producing' | 'declining' | 'depleted';
  fieldType: 'conventional' | 'shale' | 'tight' | 'coalbed';
  estimatedReserves: number; // cubic feet
  dailyProduction: number; // cubic feet per day
  totalExtracted: number;
  wellCount: number;
  pressure: number; // PSI
  extractionCost: number;
  operatingCost: number;
  h2sContent: number; // hydrogen sulfide percentage
  location: {
    region: string;
    coordinates?: { lat: number; lng: number };
  };
}

/**
 * Solar Farm type - Photovoltaic/CSP installation
 */
export interface SolarFarm {
  id: string;
  name: string;
  companyId: string;
  status: 'construction' | 'operational' | 'maintenance' | 'offline';
  solarType: 'pv' | 'csp' | 'hybrid';
  capacityMW: number;
  panelCount?: number;
  efficiencyRating: number;
  currentOutputMW: number;
  dailyGenerationMWh: number;
  weatherImpact: number; // 0-1 factor
  degradationRate: number;
  operatingCost: number;
  subsidyRate?: number;
  location: {
    region: string;
    solarIrradiance: number; // kWh/m²/day
    coordinates?: { lat: number; lng: number };
  };
}

/**
 * Wind Turbine type - Wind power installation
 */
export interface WindTurbine {
  id: string;
  name: string;
  companyId: string;
  status: 'construction' | 'operational' | 'maintenance' | 'offline';
  turbineType: 'onshore' | 'offshore' | 'floating';
  capacityMW: number;
  hubHeight: number; // meters
  rotorDiameter: number; // meters
  currentOutputMW: number;
  windSpeed: number; // m/s
  capacityFactor: number;
  operatingCost: number;
  location: {
    region: string;
    avgWindSpeed: number;
    coordinates?: { lat: number; lng: number };
  };
}

/**
 * Power Plant type - Traditional generation facility
 */
export interface PowerPlant {
  id: string;
  name: string;
  companyId: string;
  status: 'construction' | 'operational' | 'maintenance' | 'offline' | 'decommissioned';
  fuelType: 'coal' | 'natural_gas' | 'nuclear' | 'hydro' | 'geothermal' | 'biomass';
  nameplateCapacity: number; // MW
  currentOutput: number; // MW
  efficiency: number;
  emissionsRate: number; // tons CO2/MWh
  fuelCost: number;
  operatingCost: number;
  maintenanceSchedule?: Date;
  location: {
    region: string;
    coordinates?: { lat: number; lng: number };
  };
}

/**
 * Energy Storage type - Grid batteries and storage
 */
export interface EnergyStorage {
  id: string;
  name: string;
  companyId: string;
  status: 'construction' | 'operational' | 'charging' | 'discharging' | 'maintenance';
  storageType: 'lithium_ion' | 'flow_battery' | 'pumped_hydro' | 'compressed_air' | 'flywheel';
  capacityMWh: number;
  maxPowerMW: number;
  currentCharge: number; // percentage
  roundTripEfficiency: number;
  cycleCount: number;
  maxCycles: number;
  degradationRate: number;
  operatingCost: number;
  location: {
    region: string;
    coordinates?: { lat: number; lng: number };
  };
}

/**
 * Transmission Line type - Grid infrastructure
 */
export interface TransmissionLine {
  id: string;
  name: string;
  companyId: string;
  status: 'construction' | 'operational' | 'maintenance' | 'offline';
  lineType: 'ac' | 'dc' | 'hvdc';
  voltageKV: number;
  capacityMW: number;
  lengthKm: number;
  currentLoadMW: number;
  losses: number; // percentage
  operatingCost: number;
  congestionFactor: number;
  endpoints: {
    from: string;
    to: string;
  };
}

/**
 * Energy Company Summary for dashboard
 */
export interface EnergyCompanySummary {
  // Oil & Gas
  totalOilWells: number;
  activeOilWells: number;
  dailyOilProduction: number; // barrels
  totalGasFields: number;
  dailyGasProduction: number; // cubic feet
  
  // Renewables
  totalSolarFarms: number;
  solarCapacityMW: number;
  totalWindTurbines: number;
  windCapacityMW: number;
  renewablePercentage: number;
  
  // Traditional Power
  totalPowerPlants: number;
  powerPlantCapacityMW: number;
  
  // Grid Infrastructure
  totalStorageUnits: number;
  storageCapacityMWh: number;
  totalTransmissionLines: number;
  transmissionCapacityMW: number;
  
  // Aggregates
  totalCapacityMW: number;
  currentOutputMW: number;
  monthlyRevenue: number;
  carbonEmissions: number; // tons CO2
  
  // Recent Activity
  recentActivity: Array<{
    id: string;
    type: 'oil' | 'gas' | 'solar' | 'wind' | 'power' | 'storage' | 'transmission';
    title: string;
    description: string;
    timestamp: Date;
    impact?: 'high' | 'medium' | 'low';
  }>;
}

// ============================================================================
// HOOKS - Oil & Gas
// ============================================================================

/**
 * useOilWells - Fetch oil wells for a company
 * 
 * @example
 * ```typescript
 * const { data: wells, isLoading } = useOilWells(companyId);
 * ```
 */
export function useOilWells(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<OilWell[]>(
    companyId ? energyEndpoints.oilWells.list(companyId) : null,
    options
  );
}

/**
 * useOilWell - Fetch single oil well by ID
 */
export function useOilWell(wellId: string | null, options?: UseAPIOptions) {
  return useAPI<OilWell>(
    wellId ? energyEndpoints.oilWells.byId(wellId) : null,
    options
  );
}

/**
 * useGasFields - Fetch gas fields for a company
 * 
 * @example
 * ```typescript
 * const { data: fields, isLoading } = useGasFields(companyId);
 * ```
 */
export function useGasFields(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<GasField[]>(
    companyId ? energyEndpoints.gasFields.list(companyId) : null,
    options
  );
}

/**
 * useGasField - Fetch single gas field by ID
 */
export function useGasField(fieldId: string | null, options?: UseAPIOptions) {
  return useAPI<GasField>(
    fieldId ? energyEndpoints.gasFields.byId(fieldId) : null,
    options
  );
}

// ============================================================================
// HOOKS - Renewables
// ============================================================================

/**
 * useSolarFarms - Fetch solar farms for a company
 * 
 * @example
 * ```typescript
 * const { data: farms, isLoading } = useSolarFarms(companyId);
 * ```
 */
export function useSolarFarms(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<SolarFarm[]>(
    companyId ? energyEndpoints.solarFarms.list(companyId) : null,
    options
  );
}

/**
 * useSolarFarm - Fetch single solar farm by ID
 */
export function useSolarFarm(farmId: string | null, options?: UseAPIOptions) {
  return useAPI<SolarFarm>(
    farmId ? energyEndpoints.solarFarms.byId(farmId) : null,
    options
  );
}

/**
 * useWindTurbines - Fetch wind turbines for a company
 * 
 * @example
 * ```typescript
 * const { data: turbines, isLoading } = useWindTurbines(companyId);
 * ```
 */
export function useWindTurbines(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<WindTurbine[]>(
    companyId ? energyEndpoints.windTurbines.list(companyId) : null,
    options
  );
}

/**
 * useWindTurbine - Fetch single wind turbine by ID
 */
export function useWindTurbine(turbineId: string | null, options?: UseAPIOptions) {
  return useAPI<WindTurbine>(
    turbineId ? energyEndpoints.windTurbines.byId(turbineId) : null,
    options
  );
}

// ============================================================================
// HOOKS - Power Generation
// ============================================================================

/**
 * usePowerPlants - Fetch power plants for a company
 * 
 * @example
 * ```typescript
 * const { data: plants, isLoading } = usePowerPlants(companyId);
 * ```
 */
export function usePowerPlants(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<PowerPlant[]>(
    companyId ? energyEndpoints.powerPlants.list(companyId) : null,
    options
  );
}

/**
 * usePowerPlant - Fetch single power plant by ID
 */
export function usePowerPlant(plantId: string | null, options?: UseAPIOptions) {
  return useAPI<PowerPlant>(
    plantId ? energyEndpoints.powerPlants.byId(plantId) : null,
    options
  );
}

// ============================================================================
// HOOKS - Grid Infrastructure
// ============================================================================

/**
 * useEnergyStorage - Fetch energy storage units for a company
 * 
 * @example
 * ```typescript
 * const { data: storage, isLoading } = useEnergyStorage(companyId);
 * ```
 */
export function useEnergyStorage(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<EnergyStorage[]>(
    companyId ? energyEndpoints.storage.list(companyId) : null,
    options
  );
}

/**
 * useEnergyStorageUnit - Fetch single storage unit by ID
 */
export function useEnergyStorageUnit(unitId: string | null, options?: UseAPIOptions) {
  return useAPI<EnergyStorage>(
    unitId ? energyEndpoints.storage.byId(unitId) : null,
    options
  );
}

/**
 * useTransmissionLines - Fetch transmission lines for a company
 * 
 * @example
 * ```typescript
 * const { data: lines, isLoading } = useTransmissionLines(companyId);
 * ```
 */
export function useTransmissionLines(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<TransmissionLine[]>(
    companyId ? energyEndpoints.transmissionLines.list(companyId) : null,
    options
  );
}

/**
 * useTransmissionLine - Fetch single transmission line by ID
 */
export function useTransmissionLine(lineId: string | null, options?: UseAPIOptions) {
  return useAPI<TransmissionLine>(
    lineId ? energyEndpoints.transmissionLines.byId(lineId) : null,
    options
  );
}

// ============================================================================
// HOOKS - Aggregated Summary
// ============================================================================

/**
 * useEnergySummary - Fetch aggregated energy metrics for dashboard
 * Combines all energy assets into one summary for efficient dashboard display
 * 
 * @example
 * ```typescript
 * const { data: summary, isLoading } = useEnergySummary(companyId);
 * // summary.totalCapacityMW, summary.currentOutputMW, summary.monthlyRevenue
 * ```
 */
export function useEnergySummary(companyId: string | null, options?: UseAPIOptions) {
  // Fetch all energy data sources
  const oilWells = useOilWells(companyId, options);
  const gasFields = useGasFields(companyId, options);
  const solarFarms = useSolarFarms(companyId, options);
  const windTurbines = useWindTurbines(companyId, options);
  const powerPlants = usePowerPlants(companyId, options);
  const storage = useEnergyStorage(companyId, options);
  const transmission = useTransmissionLines(companyId, options);

  // Loading state (any still loading)
  const isLoading = 
    oilWells.isLoading || 
    gasFields.isLoading || 
    solarFarms.isLoading || 
    windTurbines.isLoading ||
    powerPlants.isLoading ||
    storage.isLoading ||
    transmission.isLoading;

  // Error state (first error found)
  const error = 
    oilWells.error || 
    gasFields.error || 
    solarFarms.error || 
    windTurbines.error ||
    powerPlants.error ||
    storage.error ||
    transmission.error;

  // Helper to safely extract array from API response
  // Handles: array, { data: array }, { [key]: array }, or null/undefined
  const safeArray = <T,>(data: unknown): T[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'object') {
      // Check for common wrapper patterns
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data;
      // Find first array property
      for (const key of Object.keys(obj)) {
        if (Array.isArray(obj[key])) return obj[key] as T[];
      }
    }
    return [];
  };

  // Extract arrays safely
  const oilWellsArr = safeArray<OilWell>(oilWells.data);
  const gasFieldsArr = safeArray<GasField>(gasFields.data);
  const solarFarmsArr = safeArray<SolarFarm>(solarFarms.data);
  const windTurbinesArr = safeArray<WindTurbine>(windTurbines.data);
  const powerPlantsArr = safeArray<PowerPlant>(powerPlants.data);
  const storageArr = safeArray<EnergyStorage>(storage.data);
  const transmissionArr = safeArray<TransmissionLine>(transmission.data);

  // Calculate summary data
  const data: EnergyCompanySummary | null = !isLoading ? {
    // Oil & Gas
    totalOilWells: oilWellsArr.length,
    activeOilWells: oilWellsArr.filter(w => w.status === 'producing').length,
    dailyOilProduction: oilWellsArr.reduce((sum, w) => sum + (w.dailyProduction ?? 0), 0),
    totalGasFields: gasFieldsArr.length,
    dailyGasProduction: gasFieldsArr.reduce((sum, f) => sum + (f.dailyProduction ?? 0), 0),
    
    // Renewables
    totalSolarFarms: solarFarmsArr.length,
    solarCapacityMW: solarFarmsArr.reduce((sum, f) => sum + (f.capacityMW ?? 0), 0),
    totalWindTurbines: windTurbinesArr.length,
    windCapacityMW: windTurbinesArr.reduce((sum, t) => sum + (t.capacityMW ?? 0), 0),
    renewablePercentage: 0, // Calculated below
    
    // Traditional Power
    totalPowerPlants: powerPlantsArr.length,
    powerPlantCapacityMW: powerPlantsArr.reduce((sum, p) => sum + (p.nameplateCapacity ?? 0), 0),
    
    // Grid Infrastructure
    totalStorageUnits: storageArr.length,
    storageCapacityMWh: storageArr.reduce((sum, s) => sum + (s.capacityMWh ?? 0), 0),
    totalTransmissionLines: transmissionArr.length,
    transmissionCapacityMW: transmissionArr.reduce((sum, t) => sum + (t.capacityMW ?? 0), 0),
    
    // Aggregates
    totalCapacityMW: 0, // Calculated below
    currentOutputMW: 0, // Calculated below
    monthlyRevenue: 0, // Would need to be calculated from market prices
    carbonEmissions: powerPlantsArr.reduce((sum, p) => sum + ((p.currentOutput ?? 0) * (p.emissionsRate ?? 0)), 0),
    
    // Recent Activity
    recentActivity: [], // Would be populated from activity log
  } : null;

  // Calculate aggregate values
  if (data) {
    const solarMW = data.solarCapacityMW;
    const windMW = data.windCapacityMW;
    const plantMW = data.powerPlantCapacityMW;
    
    data.totalCapacityMW = solarMW + windMW + plantMW;
    
    const solarOutput = solarFarms.data?.reduce((sum, f) => sum + f.currentOutputMW, 0) ?? 0;
    const windOutput = windTurbines.data?.reduce((sum, t) => sum + t.currentOutputMW, 0) ?? 0;
    const plantOutput = powerPlants.data?.reduce((sum, p) => sum + p.currentOutput, 0) ?? 0;
    
    data.currentOutputMW = solarOutput + windOutput + plantOutput;
    
    if (data.totalCapacityMW > 0) {
      data.renewablePercentage = ((solarMW + windMW) / data.totalCapacityMW) * 100;
    }
  }

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      oilWells.refetch?.();
      gasFields.refetch?.();
      solarFarms.refetch?.();
      windTurbines.refetch?.();
      powerPlants.refetch?.();
      storage.refetch?.();
      transmission.refetch?.();
    },
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * PATTERN:
 * - Individual hooks for each asset type (useOilWells, useSolarFarms, etc.)
 * - Aggregated hook (useEnergySummary) for dashboard view
 * - All hooks use centralized endpoint definitions from endpoints.ts
 * - Follows exact pattern established by useAI.ts
 * 
 * ASSETS COVERED:
 * - Oil Wells: Petroleum extraction with production/depletion
 * - Gas Fields: Natural gas with pressure/extraction
 * - Solar Farms: PV/CSP with weather impact
 * - Wind Turbines: Onshore/offshore with power curves
 * - Power Plants: Traditional generation (coal, gas, nuclear, hydro)
 * - Energy Storage: Batteries and pumped storage
 * - Transmission Lines: Grid infrastructure
 * 
 * USAGE:
 * ```typescript
 * // Individual asset hooks
 * const { data: wells } = useOilWells(companyId);
 * const { data: farms } = useSolarFarms(companyId);
 * 
 * // Aggregated summary for dashboard
 * const { data: summary, isLoading } = useEnergySummary(companyId);
 * // summary.totalCapacityMW, summary.renewablePercentage
 * ```
 * 
 * @updated 2025-11-29
 * @author ECHO v1.3.1
 */
