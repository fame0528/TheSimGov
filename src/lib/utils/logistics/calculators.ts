/**
 * @file src/lib/utils/logistics/calculators.ts
 * @description Utility functions for logistics calculations and formatting
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Pure functions for logistics domain: distance, ETA, utilization, cost, status formatting, etc.
 * Used by models, API, and UI components.
 */

import type {
  Vehicle,
  Warehouse,
  Route,
  ShippingContract,
  Shipment,
  Waypoint,
  InventoryItem,
} from '@/lib/types/logistics';

/**
 * Calculate route ETA (hours)
 */
export function calculateRouteETA(route: Route, vehicle: Vehicle): number {
  if (!route.distance || !vehicle.speed || vehicle.speed <= 0) return 0;
  return Math.round((route.distance / vehicle.speed) * 100) / 100;
}

/**
 * Calculate warehouse utilization (%)
 */
export function calculateWarehouseUtilization(warehouse: Warehouse): number {
  const totalQuantity = warehouse.inventory.reduce((sum, item) => sum + item.quantity, 0);
  if (!warehouse.capacity || warehouse.capacity <= 0) return 0;
  return Math.min(100, Math.round((totalQuantity / warehouse.capacity) * 100));
}

/**
 * Format shipment status for UI
 */
export function formatShipmentStatus(status: string): string {
  switch (status) {
    case 'PENDING': return 'Pending';
    case 'IN_TRANSIT': return 'In Transit';
    case 'DELIVERED': return 'Delivered';
    case 'CANCELLED': return 'Cancelled';
    case 'DELAYED': return 'Delayed';
    default: return 'Unknown';
  }
}

/**
 * Calculate total contract value for company
 */
export function calculateTotalContractValue(contracts: ShippingContract[]): number {
  return contracts.reduce((sum, contract) => sum + contract.pricing, 0);
}

/**
 * Calculate total delivered shipments for company
 */
export function calculateTotalDeliveredShipments(shipments: Shipment[]): number {
  return shipments.filter(s => s.status === 'DELIVERED').length;
}

/**
 * Format vehicle status for UI
 */
export function formatVehicleStatus(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'Active';
    case 'IN_MAINTENANCE': return 'Maintenance';
    case 'IDLE': return 'Idle';
    case 'ASSIGNED': return 'Assigned';
    case 'RETIRED': return 'Retired';
    default: return 'Unknown';
  }
}

/**
 * Format warehouse status for UI
 */
export function formatWarehouseStatus(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'Active';
    case 'IN_MAINTENANCE': return 'Maintenance';
    case 'IDLE': return 'Idle';
    case 'ASSIGNED': return 'Assigned';
    case 'RETIRED': return 'Retired';
    default: return 'Unknown';
  }
}

/**
 * Format route status for UI
 */
export function formatRouteStatus(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'Active';
    case 'INACTIVE': return 'Inactive';
    case 'UNDER_MAINTENANCE': return 'Maintenance';
    case 'ASSIGNED': return 'Assigned';
    case 'RETIRED': return 'Retired';
    default: return 'Unknown';
  }
}

/**
 * Format contract status for UI
 */
export function formatContractStatus(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'Active';
    case 'PENDING': return 'Pending';
    case 'COMPLETED': return 'Completed';
    case 'CANCELLED': return 'Cancelled';
    case 'EXPIRED': return 'Expired';
    default: return 'Unknown';
  }
}

/**
 * Format inventory item for display
 */
export function formatInventoryItem(item: InventoryItem): string {
  return `${item.name} (${item.sku}): ${item.quantity} ${item.unit}`;
}

/**
 * Calculate progress percentage for shipment
 */
export function calculateShipmentProgress(shipment: Shipment): number {
  return Math.max(0, Math.min(100, shipment.progress));
}

/**
 * Calculate total usage hours for vehicles
 */
export function calculateTotalVehicleUsage(vehicles: Vehicle[]): number {
  return vehicles.reduce((sum, v) => sum + v.usageHours, 0);
}

/**
 * Calculate total downtime hours for warehouses
 */
export function calculateTotalWarehouseDowntime(warehouses: Warehouse[]): number {
  return warehouses.reduce((sum, w) => sum + w.downtimeHours, 0);
}

/**
 * Calculate total route distance for company
 */
export function calculateTotalRouteDistance(routes: Route[]): number {
  return routes.reduce((sum, r) => sum + r.distance, 0);
}
