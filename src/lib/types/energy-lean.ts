/**
 * @fileoverview Lean Result Types for Energy Domain Models
 * @module lib/types/energy-lean
 * 
 * OVERVIEW:
 * Type definitions for .lean() query results from Energy domain Mongoose models.
 * These interfaces match the actual model fields and are used to properly type
 * API route handlers without requiring `as any` assertions.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0 - Phase 2B Type Safety
 */

import { Types } from 'mongoose';

/**
 * Base lean document properties added by Mongoose
 */
export interface BaseLeanDoc {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

/**
 * Lean result type for OilWell model
 * @see IOilWell in src/lib/db/models/energy/OilWell.ts
 */
export interface OilWellLean extends BaseLeanDoc {
  company: Types.ObjectId;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  wellType: 'Conventional' | 'Unconventional' | 'Offshore' | 'Shale';
  status: 'Drilling' | 'Active' | 'Depleted' | 'Maintenance' | 'Abandoned';
  reserveEstimate: number;
  currentProduction: number;
  peakProduction: number;
  depletionRate: number;
  extractionCost: number;
  lastMaintenance?: Date;
  commissionDate: Date;
  depth: number;
  equipment: Array<{
    type: 'Pump' | 'Pipe' | 'Storage' | 'Compressor' | 'Separator';
    name: string;
    efficiency: number;
    lastMaintenance: Date;
    cost: number;
  }>;
}

/**
 * Lean result type for GasField model
 * @see IGasField in src/lib/db/models/energy/GasField.ts
 */
export interface GasFieldLean extends BaseLeanDoc {
  company: Types.ObjectId;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    region: string;
    depth: number;
  };
  status: 'Exploration' | 'Development' | 'Production' | 'Declining' | 'Depleted' | 'Abandoned';
  quality: 'Pipeline' | 'Plant' | 'Sour';
  reserveEstimate: number;
  currentProduction: number;
  peakProduction: number;
  depletionRate: number;
  reservoirPressure: number;
  initialPressure: number;
  pressureDeclineRate: number;
  processingCost: number;
  h2sContent: number;
  co2Content: number;
  wellCount: number;
  lastMaintenance?: Date;
  commissionDate: Date;
}

/**
 * Lean result type for SolarFarm model
 * @see ISolarFarm in src/lib/db/models/energy/SolarFarm.ts
 */
export interface SolarFarmLean extends BaseLeanDoc {
  company: Types.ObjectId;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  farmType: 'FixedMount' | 'SingleAxis' | 'DualAxis' | 'Concentrated';
  status: 'Construction' | 'Operational' | 'Maintenance' | 'Offline' | 'Decommissioning';
  installedCapacity: number; // MW
  currentOutput: number; // MW
  panelCount: number;
  panelEfficiency: number;
  inverterCapacity: number;
  degradationRate: number;
  dailyProduction: number; // MWh
  monthlyProduction: number; // MWh
  operatingCost: number;
  lastMaintenance?: Date;
  commissionDate: Date;
}

/**
 * Lean result type for WindTurbine model
 * @see IWindTurbine in src/lib/db/models/energy/WindTurbine.ts
 */
export interface WindTurbineLean extends BaseLeanDoc {
  company: Types.ObjectId;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  turbineType: 'Onshore' | 'Offshore' | 'Vertical';
  status: 'Construction' | 'Operational' | 'Maintenance' | 'Offline' | 'Decommissioning';
  ratedCapacity: number; // MW
  currentOutput: number; // MW
  rotorDiameter: number;
  hubHeight: number;
  cutInSpeed: number;
  cutOutSpeed: number;
  dailyProduction: number; // MWh
  monthlyProduction: number; // MWh
  operatingCost: number;
  lastMaintenance?: Date;
  commissionDate: Date;
}

/**
 * Lean result type for PowerPlant model
 * @see IPowerPlant in src/lib/db/models/energy/PowerPlant.ts
 */
export interface PowerPlantLean extends BaseLeanDoc {
  company: Types.ObjectId;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  plantType: 'Coal' | 'NaturalGas' | 'Nuclear' | 'Hydroelectric' | 'Geothermal';
  status: 'Construction' | 'Operational' | 'Maintenance' | 'Offline' | 'Decommissioning';
  nameplateCapacity: number; // MW
  currentOutput: number; // MW
  capacityFactor: number;
  fuelEfficiency: {
    heatRate: number;
    fuelCost: number;
    fuelType: string;
    consumption: number;
  };
  emissions: {
    co2: number;
    nox: number;
    sox: number;
    particulateMatter: number;
  };
  carbonCreditsOwned: number;
  startupCost: number;
  operatingCost: number;
  lastMaintenance?: Date;
  commissionDate: Date;
  gridConnectionCapacity: number;
  transmissionLosses: number;
}

/**
 * Lean result type for EnergyStorage model
 * @see IEnergyStorage in src/lib/db/models/energy/EnergyStorage.ts
 */
export interface EnergyStorageLean extends BaseLeanDoc {
  company: Types.ObjectId;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  storageType: 'LithiumIon' | 'FlowBattery' | 'PumpedHydro' | 'CompressedAir' | 'Flywheel';
  status: 'Construction' | 'Operational' | 'Charging' | 'Discharging' | 'Maintenance' | 'Offline';
  totalCapacity: number; // MWh
  currentCharge: number; // MWh
  maxDischargeRate: number; // MW
  maxChargeRate: number; // MW
  roundTripEfficiency: number;
  selfDischargeRate: number;
  cycleCount: number;
  maxCycles: number;
  degradation: number;
  chargingCost: number;
  dischargingRevenue: number;
  operatingCost: number;
  lastMaintenance?: Date;
  commissionDate: Date;
}

/**
 * Lean result type for TransmissionLine model
 * @see ITransmissionLine in src/lib/db/models/energy/TransmissionLine.ts
 */
export interface TransmissionLineLean extends BaseLeanDoc {
  company: Types.ObjectId;
  name: string;
  startPoint: {
    latitude: number;
    longitude: number;
    substation: string;
  };
  endPoint: {
    latitude: number;
    longitude: number;
    substation: string;
  };
  lengthMiles: number;
  voltageLevel: '115kV' | '230kV' | '345kV' | '500kV' | '765kV' | 'HVDC';
  status: 'Operational' | 'Maintenance' | 'Overloaded' | 'Outage' | 'Construction';
  capacity: number; // MW
  currentLoad: number; // MW
  losses: number;
  maintenanceCost: number;
  congestionCharges: number;
  lastInspection?: Date;
  commissionDate: Date;
}

/**
 * Helper function to safely get production value from OilWell
 * OilWell uses currentProduction, not dailyProduction
 */
export function getOilWellProduction(well: OilWellLean): number {
  return well.currentProduction ?? 0;
}

/**
 * Helper function to safely get production value from GasField
 * GasField uses currentProduction, not dailyProduction
 */
export function getGasFieldProduction(field: GasFieldLean): number {
  return field.currentProduction ?? 0;
}

/**
 * Helper function to safely get capacity from SolarFarm
 * SolarFarm uses installedCapacity
 */
export function getSolarCapacity(farm: SolarFarmLean): number {
  return farm.installedCapacity ?? 0;
}

/**
 * Helper function to safely get capacity from WindTurbine
 * WindTurbine uses ratedCapacity
 */
export function getWindCapacity(turbine: WindTurbineLean): number {
  return turbine.ratedCapacity ?? 0;
}

/**
 * Helper function to calculate capacity factor
 */
export function calculateCapacityFactor(currentOutput: number, capacity: number): number {
  return capacity > 0 ? (currentOutput / capacity) * 100 : 0;
}
