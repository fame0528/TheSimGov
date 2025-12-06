/**
 * @file src/hooks/useLogistics.ts
 * @description SWR hooks for logistics operations
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Provides hooks for fetching, creating, updating, and deleting logistics resources (vehicles, warehouses, routes, contracts, shipments).
 * Uses endpoints from API config, handles errors, and provides type safety.
 */

import useSWR, { mutate } from 'swr';
import { endpoints } from '@/lib/api/endpoints';
import type {
  Vehicle,
  Warehouse,
  Route,
  ShippingContract,
  Shipment,
} from '@/lib/types/logistics';

const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * Fetch all logistics resources for company
 */
export function useLogistics(companyId: string) {
  const { data, error, isLoading } = useSWR(
    endpoints.logistics.summary(companyId),
    fetcher
  );
  return {
    data,
    error,
    isLoading,
    refresh: () => mutate(endpoints.logistics.summary(companyId)),
  };
}

/**
 * Fetch vehicles
 */
export function useVehicles(companyId: string) {
  return useSWR<Vehicle[]>(endpoints.logistics.vehicles.list(companyId), fetcher);
}

/**
 * Fetch warehouses
 */
export function useWarehouses(companyId: string) {
  return useSWR<Warehouse[]>(endpoints.logistics.warehouses.list(companyId), fetcher);
}

/**
 * Fetch routes
 */
export function useRoutes(companyId: string) {
  return useSWR<Route[]>(endpoints.logistics.routes.list(companyId), fetcher);
}

/**
 * Fetch contracts
 */
export function useContracts(companyId: string) {
  return useSWR<ShippingContract[]>(endpoints.logistics.contracts.list(companyId), fetcher);
}

/**
 * Fetch shipments
 */
export function useShipments(companyId: string) {
  return useSWR<Shipment[]>(endpoints.logistics.shipments.list(companyId), fetcher);
}

/**
 * Create logistics resource
 */
export async function createLogisticsResource(type: string, data: any) {
  const res = await fetch('/api/logistics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * Update logistics resource by type/id
 */
export async function updateLogisticsResource(type: string, id: string, data: any) {
  const logisticsType = type as keyof Omit<typeof endpoints.logistics, 'summary'>;
  const endpoint = endpoints.logistics[logisticsType]?.update(id);
  if (!endpoint) throw new Error('Invalid resource type');
  const res = await fetch(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * Delete logistics resource by type/id
 */
export async function deleteLogisticsResource(type: string, id: string) {
  const logisticsType = type as keyof Omit<typeof endpoints.logistics, 'summary'>;
  const endpoint = endpoints.logistics[logisticsType]?.delete(id);
  if (!endpoint) throw new Error('Invalid resource type');
  const res = await fetch(endpoint, {
    method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
