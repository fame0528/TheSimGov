/**
 * @fileoverview Energy Models Index
 * @module lib/db/models/energy
 * 
 * OVERVIEW:
 * Central export for all Energy Industry models.
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

// ============================================================================
// OIL & GAS
// ============================================================================
export { default as OilWell } from './OilWell';
export type { IOilWell, WellType, WellStatus, WellLocation, WellEquipment } from './OilWell';

export { default as GasField } from './GasField';
export type { IGasField, GasQuality, FieldStatus, FieldLocation } from './GasField';

// ============================================================================
// RENEWABLES
// ============================================================================
export { default as SolarFarm } from './SolarFarm';
export type { ISolarFarm, PanelType, SolarStatus, SolarLocation, BatteryStorage, GridConnection } from './SolarFarm';

export { default as WindTurbine } from './WindTurbine';
export type { IWindTurbine, TurbineType, TurbineStatus, TurbineLocation, BladeCondition, DrivetrainCondition } from './WindTurbine';

// ============================================================================
// POWER GENERATION
// ============================================================================
export { default as PowerPlant } from './PowerPlant';
export type { IPowerPlant, PlantType, PlantStatus, FuelEfficiency, Emissions } from './PowerPlant';

// ============================================================================
// GRID INFRASTRUCTURE
// ============================================================================
export { default as EnergyStorage } from './EnergyStorage';
export type { IEnergyStorage, StorageType, StorageStatus } from './EnergyStorage';

export { default as TransmissionLine } from './TransmissionLine';
export type { ITransmissionLine, VoltageLevel, LineStatus } from './TransmissionLine';

// ============================================================================
// GRID NODE (SUBSTATION / DISTRIBUTION)
// ============================================================================
export { default as GridNode } from './GridNode';
export type { IGridNode, NodeType, NodeStatus, VoltageStatus } from './GridNode';

// ============================================================================
// COMMODITY PRICING (ENERGY MARKETS)
// ============================================================================
export { default as CommodityPrice } from './CommodityPrice';
export type { ICommodityPrice, CommodityType, IOPECEvent } from './CommodityPrice';

// ============================================================================
// POWER PURCHASE AGREEMENTS (LONG-TERM CONTRACTS)
// ============================================================================
export { default as PPA } from './PPA';
export type { IPPA, IDeliveryRecord, IPenaltyRecord, IBonusRecord } from './PPA';

// ============================================================================
// ENERGY TRADE ORDERS (SHORT-TERM MARKET ORDERS)
// ============================================================================
export { default as EnergyTradeOrder } from './EnergyTradeOrder';
export type { IEnergyTradeOrder, OrderSide, OrderType, OrderStatus, IOrderFill } from './EnergyTradeOrder';
