/**
 * @fileoverview Manufacturing Dashboard Component
 * @module components/manufacturing/ManufacturingDashboard
 * 
 * OVERVIEW:
 * Main dashboard for manufacturing industry companies. Displays facilities,
 * production lines, suppliers, and key performance metrics using tabbed navigation.
 * Integrates with useManufacturing hooks for data fetching.
 * 
 * FEATURES:
 * - Tabbed navigation (Overview, Facilities, Lines, Suppliers, Quality)
 * - KPI summary cards with real-time metrics
 * - Facility list with OEE tracking
 * - Production line monitoring
 * - Supplier scorecard overview
 * - Quality metrics dashboard
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.2
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Tabs,
  Tab,
  Button,
  Spinner,
  Chip,
  Progress,
} from '@heroui/react';
import {
  Factory,
  Box,
  Building,
  Activity,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Plus,
  RefreshCw,
  Settings,
} from 'lucide-react';

import { FacilityCard, type ManufacturingFacilityData } from './FacilityCard';
import { ProductionLineCard, type ProductionLineData } from './ProductionLineCard';
import { SupplierCard, type SupplierData } from './SupplierCard';
import {
  useManufacturingSummary,
  useManufacturingFacilities,
  useProductionLines,
  useSuppliers,
} from '@/lib/hooks/useManufacturing';

interface ManufacturingDashboardProps {
  companyId: string;
  onFacilityClick?: (facilityId: string) => void;
  onProductionLineClick?: (lineId: string) => void;
  onSupplierClick?: (supplierId: string) => void;
  onAddFacility?: () => void;
  onAddProductionLine?: () => void;
  onAddSupplier?: () => void;
}

/**
 * KPI Card component for summary metrics
 * Matches Banking dashboard AAA design pattern
 */
function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = 'blue' 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <Card className="p-4 bg-slate-800/50 border border-slate-700">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <Chip 
            size="sm" 
            color={trend.isPositive ? 'success' : 'danger'}
            variant="flat"
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </Chip>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold mt-1 text-white">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </Card>
  );
}

/**
 * OEE Gauge component for visual OEE display
 */
function OEEGauge({ oee, availability, performance, quality }: {
  oee: number;
  availability: number;
  performance: number;
  quality: number;
}) {
  const getOEEColor = (value: number) => {
    if (value >= 85) return 'success';
    if (value >= 70) return 'warning';
    return 'danger';
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Overall Equipment Effectiveness</h3>
      
      {/* Main OEE Display */}
      <div className="text-center mb-6">
        <div className={`text-5xl font-bold ${
          oee >= 85 ? 'text-green-600' : oee >= 70 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {oee.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {oee >= 85 ? 'World Class' : oee >= 70 ? 'Good' : 'Needs Improvement'}
        </div>
      </div>

      {/* OEE Components */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Availability</span>
            <span className="font-medium">{availability.toFixed(1)}%</span>
          </div>
          <Progress value={availability} color={getOEEColor(availability)} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Performance</span>
            <span className="font-medium">{performance.toFixed(1)}%</span>
          </div>
          <Progress value={performance} color={getOEEColor(performance)} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Quality</span>
            <span className="font-medium">{quality.toFixed(1)}%</span>
          </div>
          <Progress value={quality} color={getOEEColor(quality)} className="h-2" />
        </div>
      </div>

      {/* Formula reminder */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        OEE = Availability × Performance × Quality
      </div>
    </Card>
  );
}

/**
 * ManufacturingDashboard Component
 */
export function ManufacturingDashboard({
  companyId,
  onFacilityClick,
  onProductionLineClick,
  onSupplierClick,
  onAddFacility,
  onAddProductionLine,
  onAddSupplier,
}: ManufacturingDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<string>('overview');

  // Fetch data
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useManufacturingSummary(companyId);
  const { data: facilitiesData, isLoading: facilitiesLoading } = useManufacturingFacilities(companyId);
  const { data: linesData, isLoading: linesLoading } = useProductionLines(companyId);
  const { data: suppliersData, isLoading: suppliersLoading } = useSuppliers(companyId);

  const isLoading = summaryLoading || facilitiesLoading || linesLoading || suppliersLoading;

  // Type the data properly
  const facilities = facilitiesData?.facilities as ManufacturingFacilityData[] | undefined;
  const productionLines = linesData?.productionLines as ProductionLineData[] | undefined;
  const suppliers = suppliersData?.suppliers as SupplierData[] | undefined;

  // Format currency
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">Loading manufacturing data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Factory className="h-8 w-8 text-blue-600" />
            Manufacturing Operations
          </h1>
          <p className="text-gray-500 mt-1">
            Manage facilities, production lines, suppliers, and quality metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="flat"
            startContent={<RefreshCw className="h-4 w-4" />}
            onPress={() => refetchSummary()}
          >
            Refresh
          </Button>
          <Button
            color="primary"
            startContent={<Plus className="h-4 w-4" />}
            onPress={onAddFacility}
          >
            Add Facility
          </Button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KPICard
          title="Facilities"
          value={summary?.totalFacilities ?? 0}
          subtitle={`${summary?.operationalFacilities ?? 0} operational`}
          icon={Factory}
          color="blue"
        />
        <KPICard
          title="Production Lines"
          value={summary?.totalLines ?? 0}
          subtitle={`${summary?.runningLines ?? 0} running`}
          icon={Box}
          color="purple"
        />
        <KPICard
          title="Avg OEE"
          value={`${(summary?.averageOEE ?? 0).toFixed(1)}%`}
          subtitle={summary?.averageOEE && summary.averageOEE >= 85 ? 'World Class' : 'Good'}
          icon={Activity}
          color={summary?.averageOEE && summary.averageOEE >= 85 ? 'green' : summary?.averageOEE && summary.averageOEE >= 70 ? 'yellow' : 'red'}
        />
        <KPICard
          title="Suppliers"
          value={summary?.totalSuppliers ?? 0}
          subtitle={`${summary?.strategicPartners ?? 0} strategic`}
          icon={Building}
          color="purple"
        />
        <KPICard
          title="Annual Spend"
          value={formatCurrency(summary?.totalAnnualSpend ?? 0)}
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title="First Pass Yield"
          value={`${(summary?.firstPassYield ?? 0).toFixed(1)}%`}
          icon={CheckCircle}
          color={summary?.firstPassYield && summary.firstPassYield >= 95 ? 'green' : 'yellow'}
        />
      </div>

      {/* Tabs */}
      <Tabs 
        selectedKey={selectedTab} 
        onSelectionChange={(key) => setSelectedTab(key as string)}
        aria-label="Manufacturing dashboard tabs"
      >
        <Tab key="overview" title="Overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* OEE Gauge */}
            <OEEGauge
              oee={summary?.averageOEE ?? 0}
              availability={summary?.averageAvailability ?? 0}
              performance={summary?.averagePerformance ?? 0}
              quality={summary?.averageQuality ?? 0}
            />

            {/* Top Facilities by OEE */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Top Facilities by OEE</h3>
              <div className="space-y-3">
                {facilities
                  ?.sort((a, b) => b.metrics.oee - a.metrics.oee)
                  .slice(0, 5)
                  .map((facility) => (
                    <div 
                      key={facility._id} 
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => onFacilityClick?.(facility._id)}
                    >
                      <div className="flex items-center space-x-2">
                        <Factory className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">{facility.name}</span>
                      </div>
                      <Chip 
                        size="sm" 
                        color={facility.metrics.oee >= 85 ? 'success' : facility.metrics.oee >= 70 ? 'warning' : 'danger'}
                        variant="flat"
                      >
                        {facility.metrics.oee.toFixed(1)}%
                      </Chip>
                    </div>
                  ))}
                {(!facilities || facilities.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">No facilities yet</p>
                )}
              </div>
            </Card>

            {/* Alerts & Notifications */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Alerts</h3>
              <div className="space-y-3">
                {summary?.lowStockItems && summary.lowStockItems > 0 && (
                  <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">{summary.lowStockItems} items low stock</span>
                  </div>
                )}
                {summary?.outOfStockItems && summary.outOfStockItems > 0 && (
                  <div className="flex items-center space-x-2 p-2 bg-red-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">{summary.outOfStockItems} items out of stock</span>
                  </div>
                )}
                {summary?.totalDefects && summary.totalDefects > 0 && (
                  <div className="flex items-center space-x-2 p-2 bg-orange-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">{summary.totalDefects} defects reported</span>
                  </div>
                )}
                {(!summary?.lowStockItems && !summary?.outOfStockItems && !summary?.totalDefects) && (
                  <div className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">All systems operational</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </Tab>

        <Tab key="facilities" title="Facilities">
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Manufacturing Facilities</h3>
              <Button
                size="sm"
                color="primary"
                startContent={<Plus className="h-4 w-4" />}
                onPress={onAddFacility}
              >
                Add Facility
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facilities?.map((facility) => (
                <FacilityCard
                  key={facility._id}
                  facility={facility}
                  onClick={onFacilityClick}
                  onViewDetails={onFacilityClick}
                />
              ))}
              {(!facilities || facilities.length === 0) && (
                <Card className="col-span-full p-8 text-center">
                  <Factory className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No facilities yet. Add your first manufacturing facility.</p>
                  <Button
                    className="mt-4"
                    color="primary"
                    startContent={<Plus className="h-4 w-4" />}
                    onPress={onAddFacility}
                  >
                    Add Facility
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </Tab>

        <Tab key="lines" title="Production Lines">
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Production Lines</h3>
              <Button
                size="sm"
                color="primary"
                startContent={<Plus className="h-4 w-4" />}
                onPress={onAddProductionLine}
              >
                Add Line
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productionLines?.map((line) => (
                <ProductionLineCard
                  key={line._id}
                  line={line}
                  onClick={onProductionLineClick}
                  onViewDetails={onProductionLineClick}
                />
              ))}
              {(!productionLines || productionLines.length === 0) && (
                <Card className="col-span-full p-8 text-center">
                  <Box className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No production lines yet. Add a facility first, then create production lines.</p>
                </Card>
              )}
            </div>
          </div>
        </Tab>

        <Tab key="suppliers" title="Suppliers">
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Suppliers</h3>
              <Button
                size="sm"
                color="primary"
                startContent={<Plus className="h-4 w-4" />}
                onPress={onAddSupplier}
              >
                Add Supplier
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers?.map((supplier) => (
                <SupplierCard
                  key={supplier._id}
                  supplier={supplier}
                  onClick={onSupplierClick}
                  onViewDetails={onSupplierClick}
                />
              ))}
              {(!suppliers || suppliers.length === 0) && (
                <Card className="col-span-full p-8 text-center">
                  <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No suppliers yet. Add your first supplier.</p>
                  <Button
                    className="mt-4"
                    color="primary"
                    startContent={<Plus className="h-4 w-4" />}
                    onPress={onAddSupplier}
                  >
                    Add Supplier
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </Tab>

        <Tab key="quality" title="Quality">
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quality Summary */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quality Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>First Pass Yield</span>
                      <span className="font-medium">{(summary?.firstPassYield ?? 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={summary?.firstPassYield ?? 0} color="success" className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Scrap Rate</span>
                      <span className="font-medium">{(summary?.scrapRate ?? 0).toFixed(2)}%</span>
                    </div>
                    <Progress 
                      value={100 - (summary?.scrapRate ?? 0)} 
                      color={(summary?.scrapRate ?? 0) < 2 ? 'success' : 'warning'} 
                      className="h-2" 
                    />
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Total Defects</span>
                      <Chip 
                        size="sm" 
                        color={(summary?.totalDefects ?? 0) === 0 ? 'success' : 'warning'}
                      >
                        {summary?.totalDefects ?? 0}
                      </Chip>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Supplier Performance */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Supplier Performance</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Average Score</span>
                      <span className="font-medium">{(summary?.averageSupplierScore ?? 0).toFixed(0)}/100</span>
                    </div>
                    <Progress value={summary?.averageSupplierScore ?? 0} color="primary" className="h-2" />
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Active Suppliers</span>
                      <span className="font-medium">{summary?.activeSuppliers ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-500">Strategic Partners</span>
                      <span className="font-medium">{summary?.strategicPartners ?? 0}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Utilization */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Capacity Utilization</h3>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${
                    (summary?.averageUtilization ?? 0) >= 75 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {(summary?.averageUtilization ?? 0).toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Average across all facilities</p>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Capacity</span>
                    <span className="font-medium">{(summary?.totalCapacity ?? 0).toLocaleString()} units</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">Operating Cost</span>
                    <span className="font-medium">{formatCurrency(summary?.monthlyOperatingCost ?? 0)}/mo</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

export default ManufacturingDashboard;

/**
 * IMPLEMENTATION NOTES:
 * 
 * PATTERN:
 * - Follows tabbed dashboard pattern from existing codebase
 * - Uses HeroUI components (Card, Tabs, Progress, Chip, Button)
 * - Integrates with useManufacturing hooks for data fetching
 * - Responsive grid layout for different screen sizes
 * 
 * TABS:
 * 1. Overview - KPIs, OEE gauge, alerts
 * 2. Facilities - Grid of FacilityCard components
 * 3. Production Lines - Grid of ProductionLineCard components
 * 4. Suppliers - Grid of SupplierCard components
 * 5. Quality - Quality metrics, supplier performance, utilization
 * 
 * FEATURES:
 * - Real-time data refresh
 * - Add buttons for creating new entities
 * - Empty states with call-to-action
 * - Color-coded metrics for quick assessment
 * - Click handlers for navigation
 * 
 * USAGE:
 * ```tsx
 * <ManufacturingDashboard
 *   companyId={company._id}
 *   onFacilityClick={(id) => router.push(`/manufacturing/facilities/${id}`)}
 *   onAddFacility={() => setShowAddFacilityModal(true)}
 * />
 * ```
 */
