/**
 * @file src/lib/validations/logistics.ts
 * @description Zod validation schemas for logistics domain
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Zod schemas for Vehicle, Warehouse, Route, ShippingContract, Shipment, and related DTOs.
 * Used for API validation and model creation/update.
 */

import { z } from 'zod';
import {
  VehicleType,
  VehicleStatus,
  WarehouseStatus,
  RouteStatus,
  ContractStatus,
  ShipmentStatus,
} from '@/lib/types/logistics';

export const VehicleSchema = z.object({
  name: z.string().min(2),
  type: z.nativeEnum(VehicleType),
  status: z.nativeEnum(VehicleStatus),
  speed: z.number().min(1),
  usageHours: z.number().min(0),
  company: z.string(),
});

export const WarehouseSchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  capacity: z.number().min(1),
  status: z.nativeEnum(WarehouseStatus),
  company: z.string(),
});

export const RouteSchema = z.object({
  origin: z.string().min(2),
  destination: z.string().min(2),
  waypoints: z.array(z.string()),
  distance: z.number().min(1),
  status: z.nativeEnum(RouteStatus),
  company: z.string(),
});

export const ShippingContractSchema = z.object({
  name: z.string().min(2),
  parties: z.array(z.string()).min(2),
  terms: z.string().min(2),
  pricing: z.number().min(0),
  status: z.nativeEnum(ContractStatus),
  company: z.string(),
});

export const ShipmentSchema = z.object({
  contract: z.string(),
  vehicle: z.string(),
  route: z.string(),
  status: z.nativeEnum(ShipmentStatus),
  tracking: z.string().optional(),
  progress: z.number().min(0).max(100),
  company: z.string(),
});

/**
 * DTO schemas for API create/update
 */
export const CreateVehicleDTO = VehicleSchema.omit({ usageHours: true });
export const UpdateVehicleDTO = VehicleSchema.partial();

export const CreateWarehouseDTO = WarehouseSchema.omit({});
export const UpdateWarehouseDTO = WarehouseSchema.partial();

export const CreateRouteDTO = RouteSchema.omit({});
export const UpdateRouteDTO = RouteSchema.partial();

export const CreateShippingContractDTO = ShippingContractSchema.omit({});
export const UpdateShippingContractDTO = ShippingContractSchema.partial();

export const CreateShipmentDTO = ShipmentSchema.omit({ progress: true });
export const UpdateShipmentDTO = ShipmentSchema.partial();

/**
 * Export all schemas for API usage
 */
export const LogisticsSchemas = {
  VehicleSchema,
  WarehouseSchema,
  RouteSchema,
  ShippingContractSchema,
  ShipmentSchema,
  CreateVehicleDTO,
  UpdateVehicleDTO,
  CreateWarehouseDTO,
  UpdateWarehouseDTO,
  CreateRouteDTO,
  UpdateRouteDTO,
  CreateShippingContractDTO,
  UpdateShippingContractDTO,
  CreateShipmentDTO,
  UpdateShipmentDTO,
};
