/**
 * @fileoverview Crime Facility Card Component
 * @module components/crime/FacilityCard
 * 
 * OVERVIEW:
 * Displays individual crime facility (Lab, Farm, Warehouse) with production
 * metrics, suspicion level, and inventory status.
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 */

'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Button,
  Progress,
  Chip,
} from '@heroui/react';
import {
  Factory,
  MapPin,
  Package,
  TrendingUp,
  Users,
  ShieldAlert,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import type { FacilityDTO } from '@/lib/dto/crime';

interface FacilityCardProps {
  facility: FacilityDTO;
  onClick?: (facilityId: string) => void;
  onViewDetails?: (facilityId: string) => void;
  onEdit?: (facilityId: string) => void;
  compact?: boolean;
}

/**
 * Get facility type icon and color
 */
const getFacilityTypeConfig = (type: string): { color: 'primary' | 'success' | 'warning'; label: string; icon: typeof Factory } => {
  switch (type) {
    case 'Lab':
      return { color: 'primary', label: 'Lab', icon: Factory };
    case 'Farm':
      return { color: 'success', label: 'Farm', icon: Package };
    case 'Warehouse':
      return { color: 'warning', label: 'Warehouse', icon: Package };
    default:
      return { color: 'primary', label: type, icon: Factory };
  }
};

/**
 * Get status badge configuration
 */
const getStatusConfig = (status: string): { color: 'success' | 'warning' | 'danger' | 'default'; label: string } => {
  switch (status) {
    case 'Active':
      return { color: 'success', label: 'Active' };
    case 'Raided':
      return { color: 'danger', label: 'Raided' };
    case 'Abandoned':
      return { color: 'warning', label: 'Abandoned' };
    case 'Seized':
      return { color: 'danger', label: 'Seized' };
    default:
      return { color: 'default', label: status };
  }
};

/**
 * Get suspicion level color
 */
const getSuspicionColor = (level: number): 'success' | 'warning' | 'danger' => {
  if (level >= 70) return 'danger';
  if (level >= 40) return 'warning';
  return 'success';
};

/**
 * FacilityCard Component
 */
export function FacilityCard({ 
  facility, 
  onClick, 
  onViewDetails, 
  onEdit, 
  compact = false 
}: FacilityCardProps) {
  const typeConfig = getFacilityTypeConfig(facility.type);
  const statusConfig = getStatusConfig(facility.status);
  const Icon = typeConfig.icon;

  const handleClick = () => {
    if (onClick) onClick(facility.id);
  };

  const totalInventory = facility.inventory.reduce((sum, item) => sum + item.quantity, 0);
  const avgPurity = facility.inventory.length > 0
    ? facility.inventory.reduce((sum, item) => sum + item.purity, 0) / facility.inventory.length
    : 0;

  if (compact) {
    return (
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer"
        isPressable={!!onClick}
        onPress={handleClick}
      >
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-sm">{facility.type}</h3>
                <p className="text-xs text-gray-600">
                  {facility.location.city}, {facility.location.state}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Chip size="sm" color={statusConfig.color} variant="flat">
                {statusConfig.label}
              </Chip>
              <div className="text-sm font-semibold text-gray-900">
                {facility.quality}% Quality
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card 
      className="hover:shadow-lg transition-all hover:-translate-y-0.5"
      isPressable={!!onClick}
      onPress={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between w-full">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{facility.type} Facility</h3>
              <p className="text-sm text-gray-500">{facility.location.city}, {facility.location.state}</p>
            </div>
          </div>
          <Chip size="sm" color={statusConfig.color} variant="dot">
            {statusConfig.label}
          </Chip>
        </div>
      </CardHeader>

      <CardBody className="pt-0 space-y-4">
        {/* Suspicion Level */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Suspicion Level</span>
            </div>
            <span className="text-sm font-semibold">
              {facility.suspicionLevel}%
            </span>
          </div>
          <Progress 
            value={facility.suspicionLevel} 
            color={getSuspicionColor(facility.suspicionLevel)}
            className="h-2"
          />
          {facility.suspicionLevel >= 70 && (
            <div className="flex items-center space-x-1 mt-1 text-xs text-red-600">
              <AlertTriangle className="h-3 w-3" />
              <span>High raid risk!</span>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Capacity */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500">Capacity</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {facility.capacity.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">units/cycle</div>
          </div>

          {/* Quality */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500">Quality</span>
            </div>
            <div className="text-2xl font-bold text-green-700">
              {facility.quality}%
            </div>
            <div className="text-xs text-gray-500">Production grade</div>
          </div>
        </div>

        {/* Upgrades & Employees */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-500">Upgrades</div>
            <div className="text-sm font-semibold text-blue-700">
              {facility.upgrades.length}
            </div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="text-xs text-gray-500">Status</div>
            <div className="text-sm font-semibold text-purple-700">
              {facility.status}
            </div>
          </div>
        </div>

        {/* Inventory Summary */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Inventory:</span>
            <span className="font-semibold">{totalInventory.toLocaleString()} units</span>
          </div>
          {facility.inventory.length > 0 && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Avg Purity:</span>
              <span className="font-semibold text-green-700">{avgPurity.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </CardBody>

      {(onViewDetails || onEdit) && (
        <CardFooter className="pt-0">
          <div className="flex gap-2 w-full">
            {onViewDetails && (
              <Button 
                size="sm" 
                variant="flat" 
                color="primary"
                className="flex-1"
                onPress={() => onViewDetails(facility.id)}
              >
                View Details
              </Button>
            )}
            {onEdit && (
              <Button 
                size="sm" 
                variant="bordered"
                className="flex-1"
                startContent={<Settings className="h-4 w-4" />}
                onPress={() => onEdit(facility.id)}
              >
                Manage
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export default FacilityCard;
