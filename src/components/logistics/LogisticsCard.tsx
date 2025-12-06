/**
 * @file src/components/logistics/LogisticsCard.tsx
 * @description Card component for displaying logistics resources
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Displays vehicles, warehouses, routes, contracts, or shipments in a card format.
 * Shows key info, status, and actions. Uses HeroUI patterns.
 */

import React from 'react';
import { Card, CardHeader, CardBody, Chip, Button } from '@heroui/react';
import type {
  Vehicle,
  Warehouse,
  Route,
  ShippingContract,
  Shipment,
} from '@/lib/types/logistics';
import {
  formatVehicleStatus,
  formatWarehouseStatus,
  formatRouteStatus,
  formatContractStatus,
  formatShipmentStatus,
} from '@/lib/utils/logistics/calculators';

export type LogisticsCardProps = {
  resource: Vehicle | Warehouse | Route | ShippingContract | Shipment;
  type: 'vehicle' | 'warehouse' | 'route' | 'contract' | 'shipment';
  onEdit?: () => void;
  onDelete?: () => void;
};

export function LogisticsCard({ resource, type, onEdit, onDelete }: LogisticsCardProps) {
  let title = '';
  let status = '';
  let statusColor: 'success' | 'warning' | 'danger' | 'default' = 'default';
  let details: React.ReactNode = null;

  switch (type) {
    case 'vehicle': {
      const v = resource as Vehicle;
      title = v.name;
      status = formatVehicleStatus(v.status);
      statusColor = v.status === 'ACTIVE' ? 'success' : v.status === 'IN_MAINTENANCE' ? 'warning' : v.status === 'RETIRED' ? 'danger' : 'default';
      details = <>
        <div>Type: {v.type}</div>
        <div>Speed: {v.speed} km/h</div>
        <div>Usage: {v.usageHours} hrs</div>
      </>;
      break;
    }
    case 'warehouse': {
      const w = resource as Warehouse;
      title = w.name;
      status = formatWarehouseStatus(w.status);
      statusColor = w.status === 'ACTIVE' ? 'success' : w.status === 'IN_MAINTENANCE' ? 'warning' : w.status === 'RETIRED' ? 'danger' : 'default';
      details = <>
        <div>Location: {w.location}</div>
        <div>Capacity: {w.capacity}</div>
      </>;
      break;
    }
    case 'route': {
      const r = resource as Route;
      title = `${r.origin} → ${r.destination}`;
      status = formatRouteStatus(r.status);
      statusColor = r.status === 'ACTIVE' ? 'success' : r.status === 'UNDER_MAINTENANCE' ? 'warning' : r.status === 'RETIRED' ? 'danger' : 'default';
      details = <>
        <div>Distance: {r.distance} km</div>
        <div>Waypoints: {r.waypoints.length}</div>
      </>;
      break;
    }
    case 'contract': {
      const c = resource as ShippingContract;
      title = `${c.parties.map(p => p.name).join(' ↔ ')}`;
      status = formatContractStatus(c.status);
      statusColor = c.status === 'ACTIVE' ? 'success' : c.status === 'PENDING' ? 'warning' : c.status === 'CANCELLED' ? 'danger' : 'default';
      details = <>
        <div>Parties: {c.parties.join(', ')}</div>
        <div>Pricing: ${c.pricing}</div>
      </>;
      break;
    }
    case 'shipment': {
      const s = resource as Shipment;
      title = s.tracking.length > 0 ? `Shipment ${s.id.slice(-6)}` : 'Shipment';
      status = formatShipmentStatus(s.status);
      statusColor = s.status === 'DELIVERED' ? 'success' : s.status === 'IN_TRANSIT' ? 'warning' : s.status === 'CANCELLED' ? 'danger' : 'default';
      details = <>
        <div>Contract: {s.contractId.slice(-6)}</div>
        <div>Vehicle: {s.vehicleId.slice(-6)}</div>
        <div>Route: {s.routeId.slice(-6)}</div>
        <div>Progress: {s.progress}%</div>
      </>;
      break;
    }
  }

  return (
    <Card>
      <CardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{title}</span>
          <Chip color={statusColor}>{status}</Chip>
        </div>
      </CardHeader>
      <CardBody>
        {details}
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          {onEdit && <Button size="sm" onClick={onEdit}>Edit</Button>}
          {onDelete && <Button size="sm" color="danger" onClick={onDelete}>Delete</Button>}
        </div>
      </CardBody>
    </Card>
  );
}
