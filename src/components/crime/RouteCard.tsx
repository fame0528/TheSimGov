/**
 * @fileoverview Crime Route Card Component
 * @module components/crime/RouteCard
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardBody, Chip, Progress } from '@heroui/react';
import { Truck, MapPin, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import type { RouteDTO } from '@/lib/dto/crime';

interface RouteCardProps {
  route: RouteDTO;
  onClick?: (routeId: string) => void;
  compact?: boolean;
}

const getMethodIcon = (method: string) => {
  const icons: Record<string, typeof Truck> = {
    Road: Truck,
    Air: Truck,
    Rail: Truck,
    Courier: Truck,
  };
  return icons[method] || Truck;
};

const getStatusColor = (status: string): 'success' | 'warning' | 'danger' => {
  switch (status) {
    case 'Active': return 'success';
    case 'Suspended': return 'warning';
    case 'Interdicted': return 'danger';
    default: return 'warning';
  }
};

const getRiskColor = (risk: number): 'success' | 'warning' | 'danger' => {
  if (risk >= 60) return 'danger';
  if (risk >= 30) return 'warning';
  return 'success';
};

export function RouteCard({ route, onClick, compact = false }: RouteCardProps) {
  const Icon = getMethodIcon(route.method);
  
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      isPressable={!!onClick}
      onPress={() => onClick?.(route.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between w-full">
          <div className="flex items-center space-x-3">
            <Icon className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-md font-semibold">{route.method} Route</h3>
              <p className="text-xs text-gray-500">
                {route.origin.city}, {route.origin.state} → {route.destination.city}, {route.destination.state}
              </p>
            </div>
          </div>
          <Chip size="sm" color={getStatusColor(route.status)} variant="dot">
            {route.status}
          </Chip>
        </div>
      </CardHeader>

      <CardBody className="pt-0 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Capacity</div>
            <div className="text-sm font-semibold">{route.capacity}</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Cost</div>
            <div className="text-sm font-semibold">${route.cost.toLocaleString()}</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Speed</div>
            <div className="text-sm font-semibold">{route.speed}h</div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Risk Score</span>
            <span className="text-xs font-semibold">{route.riskScore}%</span>
          </div>
          <Progress value={route.riskScore} color={getRiskColor(route.riskScore)} size="sm" />
        </div>

        {route.shipments.length > 0 && (
          <div className="text-xs text-gray-600">
            {route.shipments.length} shipment(s) in transit
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default RouteCard;
