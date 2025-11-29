/**
 * @fileoverview Production Line Card Component
 * @module components/manufacturing/ProductionLineCard
 * 
 * OVERVIEW:
 * Displays individual production line information including current status, shift schedule,
 * OEE breakdown (Availability × Performance × Quality), and capacity metrics. Supports
 * real-time status updates with color-coded indicators.
 * 
 * FEATURES:
 * - Status badge (Running: green, Idle: yellow, Maintenance: orange, Down: red)
 * - OEE breakdown with 3 components (Availability, Performance, Quality)
 * - Current shift display
 * - Throughput rate with target comparison
 * - Capacity utilization percentage
 * - Click handler for line details navigation
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
  Box,
  Activity,
  Clock,
  TrendingUp,
  Gauge,
  Settings,
  Play,
  Pause,
  AlertTriangle,
  XCircle,
  Wrench,
  Package,
} from 'lucide-react';

/**
 * Production Line interface
 */
export interface ProductionLineData {
  _id: string;
  name: string;
  code: string;
  facility?: string;
  type: 'assembly' | 'fabrication' | 'packaging' | 'testing' | 'finishing' | 'mixed';
  automationLevel: 'manual' | 'semi_automated' | 'automated' | 'fully_automated' | 'lights_out';
  status: 'running' | 'idle' | 'changeover' | 'maintenance' | 'breakdown' | 'shutdown';
  currentShift?: number;
  performance: {
    oee: number;
    availability: number;
    performance: number;
    quality: number;
    throughput: {
      planned: number;
      actual: number;
      gap: number;
    };
    cycleTime?: {
      target: number;
      actual: number;
    };
  };
  capacity: {
    designedCapacity: number;
    currentCapacity: number;
    utilizationRate: number;
  };
  currentProduct?: {
    productName: string;
    sku: string;
    batchNumber?: string;
    producedQuantity: number;
    targetQuantity: number;
  };
  quality?: {
    defects: {
      total: number;
      critical: number;
      major: number;
      minor: number;
    };
    scrapRate: number;
    firstPassYield: number;
  };
}

interface ProductionLineCardProps {
  line: ProductionLineData;
  onClick?: (lineId: string) => void;
  onViewDetails?: (lineId: string) => void;
  onEdit?: (lineId: string) => void;
  compact?: boolean;
}

/**
 * Get status configuration with color and icon
 */
const getStatusConfig = (status: string): { 
  color: 'success' | 'warning' | 'danger' | 'default' | 'primary' | 'secondary'; 
  label: string;
  icon: React.ReactNode;
} => {
  switch (status) {
    case 'running':
      return { color: 'success', label: 'Running', icon: <Play className="h-3 w-3" /> };
    case 'idle':
      return { color: 'warning', label: 'Idle', icon: <Pause className="h-3 w-3" /> };
    case 'changeover':
      return { color: 'primary', label: 'Changeover', icon: <Settings className="h-3 w-3" /> };
    case 'maintenance':
      return { color: 'secondary', label: 'Maintenance', icon: <Wrench className="h-3 w-3" /> };
    case 'breakdown':
      return { color: 'danger', label: 'Breakdown', icon: <AlertTriangle className="h-3 w-3" /> };
    case 'shutdown':
      return { color: 'default', label: 'Shutdown', icon: <XCircle className="h-3 w-3" /> };
    default:
      return { color: 'default', label: status, icon: null };
  }
};

/**
 * Get automation level configuration
 */
const getAutomationConfig = (level: string): { label: string; color: string } => {
  switch (level) {
    case 'manual':
      return { label: 'Manual', color: 'text-gray-600' };
    case 'semi_automated':
      return { label: 'Semi-Auto', color: 'text-blue-600' };
    case 'automated':
      return { label: 'Automated', color: 'text-indigo-600' };
    case 'fully_automated':
      return { label: 'Full Auto', color: 'text-purple-600' };
    case 'lights_out':
      return { label: 'Lights Out', color: 'text-green-600' };
    default:
      return { label: level, color: 'text-gray-600' };
  }
};

/**
 * Get OEE component color (>95% green, 85-95% yellow, <85% red)
 */
const getOEEComponentColor = (value: number): string => {
  if (value >= 95) return 'text-green-600';
  if (value >= 85) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Get OEE progress color
 */
const getOEEProgressColor = (value: number): 'success' | 'warning' | 'danger' => {
  if (value >= 85) return 'success';
  if (value >= 70) return 'warning';
  return 'danger';
};

/**
 * ProductionLineCard Component
 * Displays production line with real-time status and OEE metrics
 */
export function ProductionLineCard({ 
  line, 
  onClick, 
  onViewDetails, 
  onEdit, 
  compact = false 
}: ProductionLineCardProps) {
  const statusConfig = getStatusConfig(line.status);
  const automationConfig = getAutomationConfig(line.automationLevel);

  const handleClick = () => {
    if (onClick) {
      onClick(line._id);
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
              <Box className="h-8 w-8 text-indigo-600" />
              <div>
                <h3 className="font-semibold text-sm">{line.name}</h3>
                <p className="text-xs text-gray-600">{line.code}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Chip 
                size="sm" 
                color={statusConfig.color} 
                variant="flat"
                startContent={statusConfig.icon}
              >
                {statusConfig.label}
              </Chip>
              <div className={`text-sm font-semibold ${getOEEComponentColor(line.performance.oee)}`}>
                {line.performance.oee.toFixed(1)}% OEE
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
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Box className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{line.name}</h3>
              <p className="text-sm text-gray-500">{line.code}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Chip 
              size="sm" 
              color={statusConfig.color} 
              variant="flat"
              startContent={statusConfig.icon}
            >
              {statusConfig.label}
            </Chip>
            {line.currentShift && (
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                Shift {line.currentShift}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-0 space-y-4">
        {/* Current Product */}
        {line.currentProduct && line.currentProduct.productName !== 'None' && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500">Current Product</span>
            </div>
            <div className="font-medium text-sm">{line.currentProduct.productName}</div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>SKU: {line.currentProduct.sku}</span>
              <span>
                {line.currentProduct.producedQuantity.toLocaleString()} / {line.currentProduct.targetQuantity.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={(line.currentProduct.producedQuantity / line.currentProduct.targetQuantity) * 100}
              color="primary"
              className="h-1 mt-2"
            />
          </div>
        )}

        {/* Overall OEE */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Overall OEE</span>
            </div>
            <span className={`text-lg font-bold ${getOEEComponentColor(line.performance.oee)}`}>
              {line.performance.oee.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={line.performance.oee} 
            color={getOEEProgressColor(line.performance.oee)}
            className="h-2"
          />
        </div>

        {/* OEE Breakdown */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-xs text-gray-500">Availability</div>
            <div className={`text-lg font-semibold ${getOEEComponentColor(line.performance.availability)}`}>
              {line.performance.availability.toFixed(1)}%
            </div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-500">Performance</div>
            <div className={`text-lg font-semibold ${getOEEComponentColor(line.performance.performance)}`}>
              {line.performance.performance.toFixed(1)}%
            </div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="text-xs text-gray-500">Quality</div>
            <div className={`text-lg font-semibold ${getOEEComponentColor(line.performance.quality)}`}>
              {line.performance.quality.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Throughput and Utilization */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500">Throughput</span>
            </div>
            <div className="text-xl font-bold">
              {line.performance.throughput.actual.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              / {line.performance.throughput.planned.toLocaleString()} units/hr
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Gauge className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500">Utilization</span>
            </div>
            <div className="text-xl font-bold">
              {line.capacity.utilizationRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              of {line.capacity.designedCapacity.toLocaleString()} capacity
            </div>
          </div>
        </div>

        {/* Quality Metrics (if available) */}
        {line.quality && (
          <div className="flex items-center justify-between pt-2 border-t text-sm">
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-gray-500">Defects: </span>
                <span className={line.quality.defects.total > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                  {line.quality.defects.total}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Scrap: </span>
                <span className="font-medium">{line.quality.scrapRate.toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-gray-500">FPY: </span>
                <span className="font-medium">{line.quality.firstPassYield.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Automation Level and Cycle Time */}
        <div className="flex items-center justify-between pt-2 border-t text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Settings className="h-4 w-4" />
            <span className={automationConfig.color}>{automationConfig.label}</span>
          </div>
          {line.performance.cycleTime && (
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>
                Cycle: {line.performance.cycleTime.actual}s 
                (target: {line.performance.cycleTime.target}s)
              </span>
            </div>
          )}
        </div>
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
                onPress={() => onViewDetails(line._id)}
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
                onPress={() => onEdit(line._id)}
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

export default ProductionLineCard;

/**
 * IMPLEMENTATION NOTES:
 * 
 * PATTERN:
 * - Follows HeroUI component patterns from existing codebase
 * - Supports compact and full card views
 * - Color-coded OEE components for quick visual assessment
 * - Real-time status indicators with icons
 * 
 * FEATURES PORTED FROM LEGACY:
 * - OEE breakdown (A × P × Q)
 * - Status badges with color coding
 * - Throughput vs target display
 * - Utilization metrics
 * - Current shift indicator
 * 
 * NEW FEATURES:
 * - Current product progress tracking
 * - Automation level indicator
 * - Cycle time display
 * - Quality metrics (defects, scrap rate, FPY)
 * - Compact view option
 * 
 * USAGE:
 * ```tsx
 * <ProductionLineCard
 *   line={lineData}
 *   onClick={(id) => router.push(`/manufacturing/lines/${id}`)}
 *   onViewDetails={(id) => setSelectedLine(id)}
 *   onEdit={(id) => openEditModal(id)}
 * />
 * ```
 */
