/**
 * @fileoverview Manufacturing Facility Card Component
 * @module components/manufacturing/FacilityCard
 * 
 * OVERVIEW:
 * Displays individual manufacturing facility information including facility type,
 * location, capacity metrics, OEE (Overall Equipment Effectiveness), and production
 * line count. Supports multiple facility types with type-specific visual indicators.
 * 
 * FEATURES:
 * - Facility type badge with color coding
 * - Capacity utilization percentage with color-coded progress bar
 * - OEE percentage display (color-coded: >85% green, 70-85% yellow, <70% red)
 * - Production line count with active/total breakdown
 * - Location and size display
 * - Click handler for navigation to facility details
 * - Automation level indicator
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.2
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
  Building2,
  MapPin,
  Activity,
  TrendingUp,
  Cpu,
  Box,
  Users,
  Settings,
  Factory,
  Zap,
} from 'lucide-react';

/**
 * Manufacturing Facility interface
 */
export interface ManufacturingFacilityData {
  _id: string;
  name: string;
  code: string;
  type: 'assembly' | 'process' | 'discrete' | 'continuous' | 'batch' | 'job_shop' | 'hybrid';
  status: 'operational' | 'maintenance' | 'construction' | 'shutdown' | 'renovation';
  location: {
    address?: string;
    city: string;
    state: string;
    country: string;
    timezone?: string;
  };
  capacity: {
    designed: number;
    current: number;
    utilized: number;
    utilizationRate: number;
    bottleneck?: string;
  };
  metrics: {
    oee: number;
    availability: number;
    performance: number;
    quality: number;
    throughput?: number;
  };
  workforce?: {
    totalEmployees: number;
    shifts: number;
  };
  lines?: {
    total: number;
    active: number;
  };
  automationLevel?: number;
  certifications?: string[];
  size?: number; // Square footage
}

interface FacilityCardProps {
  facility: ManufacturingFacilityData;
  onClick?: (facilityId: string) => void;
  onViewDetails?: (facilityId: string) => void;
  onEdit?: (facilityId: string) => void;
  compact?: boolean;
}

/**
 * Get facility type badge color and label
 */
const getFacilityTypeConfig = (type: string): { color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default'; label: string } => {
  switch (type) {
    case 'assembly':
      return { color: 'primary', label: 'Assembly' };
    case 'process':
      return { color: 'success', label: 'Process' };
    case 'discrete':
      return { color: 'secondary', label: 'Discrete' };
    case 'continuous':
      return { color: 'warning', label: 'Continuous' };
    case 'batch':
      return { color: 'default', label: 'Batch' };
    case 'job_shop':
      return { color: 'secondary', label: 'Job Shop' };
    case 'hybrid':
      return { color: 'primary', label: 'Hybrid' };
    default:
      return { color: 'default', label: type };
  }
};

/**
 * Get status badge configuration
 */
const getStatusConfig = (status: string): { color: 'success' | 'warning' | 'danger' | 'default' | 'primary'; label: string } => {
  switch (status) {
    case 'operational':
      return { color: 'success', label: 'Operational' };
    case 'maintenance':
      return { color: 'warning', label: 'Maintenance' };
    case 'construction':
      return { color: 'primary', label: 'Construction' };
    case 'shutdown':
      return { color: 'danger', label: 'Shutdown' };
    case 'renovation':
      return { color: 'warning', label: 'Renovation' };
    default:
      return { color: 'default', label: status };
  }
};

/**
 * Get OEE color based on percentage
 * World Class: >85%, Good: 70-85%, Poor: <70%
 */
const getOEEColor = (oee: number): string => {
  if (oee >= 85) return 'text-green-600';
  if (oee >= 70) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Get OEE label based on percentage
 */
const getOEELabel = (oee: number): string => {
  if (oee >= 85) return 'World Class';
  if (oee >= 70) return 'Good';
  return 'Needs Improvement';
};

/**
 * Get capacity utilization progress color
 */
const getUtilizationColor = (utilization: number): 'success' | 'warning' | 'danger' => {
  if (utilization >= 90) return 'danger'; // Over-capacity warning
  if (utilization >= 75) return 'warning';
  return 'success';
};

/**
 * FacilityCard Component
 * Displays manufacturing facility with metrics and status
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

  const handleClick = () => {
    if (onClick) {
      onClick(facility._id);
    }
  };

  // Compact view for list displays
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
              <Factory className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-sm">{facility.name}</h3>
                <p className="text-xs text-gray-600">
                  {facility.location.city}, {facility.location.state}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Chip size="sm" color={statusConfig.color} variant="flat">
                {statusConfig.label}
              </Chip>
              <div className={`text-sm font-semibold ${getOEEColor(facility.metrics.oee)}`}>
                {facility.metrics.oee.toFixed(1)}% OEE
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Full card view
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
              <Factory className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{facility.name}</h3>
              <p className="text-sm text-gray-500">{facility.code}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Chip size="sm" color={typeConfig.color} variant="flat">
              {typeConfig.label}
            </Chip>
            <Chip size="sm" color={statusConfig.color} variant="dot">
              {statusConfig.label}
            </Chip>
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-0 space-y-4">
        {/* Location */}
        <div className="flex items-center space-x-2 text-gray-600">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">
            {facility.location.city}, {facility.location.state}, {facility.location.country}
          </span>
        </div>

        {/* Capacity Utilization */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Capacity Utilization</span>
            <span className="text-sm font-semibold">
              {facility.capacity.utilizationRate.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={facility.capacity.utilizationRate} 
            color={getUtilizationColor(facility.capacity.utilizationRate)}
            className="h-2"
          />
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>Current: {facility.capacity.current.toLocaleString()} units</span>
            <span>Designed: {facility.capacity.designed.toLocaleString()} units</span>
          </div>
        </div>

        {/* OEE and Production Lines */}
        <div className="grid grid-cols-2 gap-4">
          {/* OEE Metric */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500">OEE</span>
            </div>
            <div className={`text-2xl font-bold ${getOEEColor(facility.metrics.oee)}`}>
              {facility.metrics.oee.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">{getOEELabel(facility.metrics.oee)}</div>
          </div>

          {/* Production Lines */}
          {facility.lines && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Box className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-500">Production Lines</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {facility.lines.active}/{facility.lines.total}
              </div>
              <div className="text-xs text-gray-500">Active</div>
            </div>
          )}
        </div>

        {/* OEE Components */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-xs text-gray-500">Availability</div>
            <div className="text-sm font-semibold text-green-700">
              {facility.metrics.availability.toFixed(1)}%
            </div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-500">Performance</div>
            <div className="text-sm font-semibold text-blue-700">
              {facility.metrics.performance.toFixed(1)}%
            </div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="text-xs text-gray-500">Quality</div>
            <div className="text-sm font-semibold text-purple-700">
              {facility.metrics.quality.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Size and Automation (if available) */}
        <div className="flex items-center justify-between pt-2 border-t text-sm text-gray-500">
          {facility.size && (
            <div className="flex items-center space-x-1">
              <Building2 className="h-4 w-4" />
              <span>{facility.size.toLocaleString()} sq ft</span>
            </div>
          )}
          {facility.automationLevel !== undefined && (
            <div className="flex items-center space-x-1">
              <Cpu className="h-4 w-4" />
              <span>Automation: {facility.automationLevel}/10</span>
            </div>
          )}
          {facility.workforce && (
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{facility.workforce.totalEmployees} staff</span>
            </div>
          )}
        </div>

        {/* Certifications (if available) */}
        {facility.certifications && facility.certifications.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {facility.certifications.slice(0, 3).map((cert, index) => (
              <Chip key={index} size="sm" variant="bordered" className="text-xs">
                {cert}
              </Chip>
            ))}
            {facility.certifications.length > 3 && (
              <Chip size="sm" variant="flat" className="text-xs">
                +{facility.certifications.length - 3} more
              </Chip>
            )}
          </div>
        )}
      </CardBody>

      {/* Action Buttons */}
      {(onViewDetails || onEdit) && (
        <CardFooter className="pt-0">
          <div className="flex gap-2 w-full">
            {onViewDetails && (
              <Button 
                size="sm" 
                variant="flat" 
                color="primary"
                className="flex-1"
                onPress={() => onViewDetails(facility._id)}
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
                onPress={() => onEdit(facility._id)}
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

/**
 * IMPLEMENTATION NOTES:
 * 
 * PATTERN:
 * - Follows HeroUI component patterns from existing codebase
 * - Supports compact and full card views
 * - Color-coded status and metrics for quick visual assessment
 * - Click handlers for navigation and actions
 * 
 * FEATURES PORTED FROM LEGACY:
 * - OEE display with World Class/Good/Poor labels
 * - Capacity utilization with progress bar
 * - Production line active/total display
 * - Automation level indicator
 * - Size display
 * 
 * NEW FEATURES:
 * - Certifications display
 * - Workforce metrics
 * - OEE component breakdown (A × P × Q)
 * - Improved status visualization with Chip components
 * 
 * USAGE:
 * ```tsx
 * <FacilityCard
 *   facility={facilityData}
 *   onClick={(id) => router.push(`/manufacturing/facilities/${id}`)}
 *   onViewDetails={(id) => setSelectedFacility(id)}
 *   onEdit={(id) => openEditModal(id)}
 * />
 * ```
 */
