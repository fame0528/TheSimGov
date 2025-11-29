// OVERVIEW: Shared Energy domain types for Phase 3.1
// Date: 2025-11-28

export type UUID = string;

export interface CommodityPrice {
  id: UUID;
  commodity: 'CrudeOil' | 'NaturalGas' | 'Electricity' | 'RenewableCredit';
  currency: 'USD';
  price: number;
  timestamp: string;
}

export interface OilWell {
  id: UUID;
  companyId: UUID;
  name: string;
  location: { lat: number; lon: number };
  dailyBarrels: number;
  status: 'operational' | 'maintenance' | 'offline';
}

export interface GasField {
  id: UUID;
  companyId: UUID;
  name: string;
  dailyMcf: number;
  pressurePsi: number;
  status: 'operational' | 'maintenance' | 'offline';
}

export interface SolarFarm {
  id: UUID;
  companyId: UUID;
  name: string;
  capacityMW: number;
  dailyGenerationMWh: number;
  status: 'operational' | 'maintenance' | 'offline';
}

export interface WindTurbine {
  id: UUID;
  companyId: UUID;
  name: string;
  capacityMW: number;
  dailyGenerationMWh: number;
  status: 'operational' | 'maintenance' | 'offline';
}

export interface PowerPlant {
  id: UUID;
  companyId: UUID;
  name: string;
  type: 'thermal' | 'nuclear' | 'hydro' | 'renewable';
  capacityMW: number;
  outputMWh: number;
}

export interface GridNode {
  id: UUID;
  region: string;
  demandMWh: number;
  supplyMWh: number;
}

export interface PPA {
  id: UUID;
  buyerCompanyId: UUID;
  sellerCompanyId: UUID;
  quantityMWh: number;
  pricePerMWh: number;
  startDate: string;
  endDate: string;
}

export interface StorageAsset {
  id: UUID;
  companyId: UUID;
  name: string;
  capacityMWh: number;
  stateOfChargeMWh: number;
}

export interface Reserve {
  id: UUID;
  commodity: 'CrudeOil' | 'NaturalGas';
  quantity: number;
  unit: 'barrels' | 'mcf';
}

export interface TradeOrder {
  id: UUID;
  companyId: UUID;
  commodity: CommodityPrice['commodity'];
  side: 'buy' | 'sell';
  quantity: number;
  limitPrice?: number;
  status: 'open' | 'executed' | 'canceled';
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}
