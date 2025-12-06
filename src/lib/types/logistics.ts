/**
 * @file src/lib/types/logistics.ts
 * @description TypeScript types, interfaces, and enums for Logistics domain
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Shared types for logistics models, API, and UI components.
 * Includes vehicles, warehouses, routes, contracts, shipments, and related enums.
 */

// Vehicle
export enum VehicleType {
  TRUCK = 'TRUCK',
  SHIP = 'SHIP',
  PLANE = 'PLANE',
  TRAIN = 'TRAIN',
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  IDLE = 'IDLE',
  ASSIGNED = 'ASSIGNED',
  RETIRED = 'RETIRED',
}

export interface Vehicle {
  id: string;
  companyId: string;
  name: string;
  type: VehicleType;
  status: VehicleStatus;
  capacity: number;
  speed: number;
  fuelType: string;
  fuelCapacity: number;
  lastMaintenance: Date;
  nextMaintenanceDue: Date;
  assignments: string[];
  usageHours: number;
  downtimeHours: number;
  createdAt: Date;
  updatedAt: Date;
}

// Warehouse
export enum WarehouseStatus {
  ACTIVE = 'ACTIVE',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  IDLE = 'IDLE',
  ASSIGNED = 'ASSIGNED',
  RETIRED = 'RETIRED',
}

export interface InventoryItem {
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  lastUpdated: Date;
}

export interface Warehouse {
  id: string;
  companyId: string;
  name: string;
  location: string;
  status: WarehouseStatus;
  capacity: number;
  utilization: number;
  inventory: InventoryItem[];
  assignments: string[];
  usageHours: number;
  downtimeHours: number;
  createdAt: Date;
  updatedAt: Date;
}

// Route
export enum RouteStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  ASSIGNED = 'ASSIGNED',
  RETIRED = 'RETIRED',
}

export interface Waypoint {
  name: string;
  coordinates: string;
  arrivalEstimate: Date;
}

export interface Route {
  id: string;
  companyId: string;
  name: string;
  origin: string;
  destination: string;
  waypoints: Waypoint[];
  distance: number;
  estimatedTime: number;
  status: RouteStatus;
  assignments: string[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ShippingContract
export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface ContractParty {
  companyId: string;
  name: string;
  role: 'CLIENT' | 'PROVIDER';
}

export interface ShippingContract {
  id: string;
  companyId: string;
  parties: ContractParty[];
  terms: string;
  pricing: number;
  startDate: Date;
  endDate: Date;
  status: ContractStatus;
  assignments: string[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Shipment
export enum ShipmentStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  DELAYED = 'DELAYED',
}

export interface TrackingInfo {
  location: string;
  timestamp: Date;
  status: ShipmentStatus;
  notes?: string;
}

export interface Shipment {
  id: string;
  companyId: string;
  contractId: string;
  vehicleId: string;
  routeId: string;
  status: ShipmentStatus;
  progress: number;
  tracking: TrackingInfo[];
  assignments: string[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTOs for API requests/responses
 */
export interface CreateVehicleDTO {
  name: string;
  type: VehicleType;
  capacity: number;
  speed: number;
  fuelType: string;
  fuelCapacity: number;
}

export interface CreateWarehouseDTO {
  name: string;
  location: string;
  capacity: number;
}

export interface CreateRouteDTO {
  name: string;
  origin: string;
  destination: string;
  waypoints?: Waypoint[];
  distance: number;
  estimatedTime: number;
}

export interface CreateShippingContractDTO {
  parties: ContractParty[];
  terms: string;
  pricing: number;
  startDate: Date;
  endDate: Date;
}

export interface CreateShipmentDTO {
  contractId: string;
  vehicleId: string;
  routeId: string;
}
