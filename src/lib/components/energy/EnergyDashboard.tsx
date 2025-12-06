/**
 * @fileoverview Energy Industry Dashboard Component
 * @module lib/components/energy/EnergyDashboard
 * 
 * OVERVIEW:
 * Main Energy industry dashboard that aggregates all energy operations.
 * Provides unified view of oil/gas operations, renewable energy, grid infrastructure,
 * and market analytics. Entry point for Energy company management.
 * 
 * @created 2025-11-28
 * @updated 2025-12-06 - AAA Design Uniformity Update
 * @author ECHO v1.3.1
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Tabs, Tab } from '@heroui/tabs';
import { Progress } from '@heroui/progress';
import { addToast } from '@heroui/toast';
import {
  Flame,
  Droplets,
  Sun,
  Wind,
  Zap,
  Battery,
  Cable,
  TrendingUp,
  DollarSign,
  Leaf,
  Plus,
  RefreshCw,
  Settings,
  BarChart3,
} from 'lucide-react';
import { LoadingSpinner } from '@/lib/components/shared/LoadingSpinner';
import { OilGasOperations } from './OilGasOperations';
import { RenewableEnergyDashboard } from './RenewableEnergyDashboard';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Energy portfolio summary
 */
interface EnergyPortfolio {
  oilWells: number;
  gasFields: number;
  solarFarms: number;
  windTurbines: number;
  powerPlants: number;
  storageUnits: number;
  transmissionLines: number;
}

/**
 * Energy production summary
 */
interface EnergyProduction {
  oilProduction: number; // barrels per day
  gasProduction: number; // MCF per day
  solarOutput: number; // kW
  windOutput: number; // kW
  thermalOutput: number; // MW
  totalRevenue: number;
}

/**
 * Component props
 * Supports two patterns:
 * 1. Self-fetching: Just pass companyId, component fetches its own data
 * 2. Pre-fetched: Pass summary data from parent (e.g., company page wrapper)
 */
export interface EnergyDashboardProps {
  /** Company ID for data lookup */
  companyId: string;
  /** Company name for display */
  companyName?: string;
  /** Callback when data changes */
  onDataChange?: () => void;
  
  // Pre-fetched summary data (optional - if provided, skips internal fetch)
  /** Total oil wells */
  totalOilWells?: number;
  /** Daily oil production in barrels */
  dailyOilProduction?: number;
  /** Total gas fields */
  totalGasFields?: number;
  /** Daily gas production in cubic feet */
  dailyGasProduction?: number;
  /** Total solar farms */
  totalSolarFarms?: number;
  /** Solar capacity in MW */
  solarCapacityMW?: number;
  /** Total wind turbines */
  totalWindTurbines?: number;
  /** Wind capacity in MW */
  windCapacityMW?: number;
  /** Total power plants */
  totalPowerPlants?: number;
  /** Power plant capacity in MW */
  powerPlantCapacityMW?: number;
  /** Total storage units */
  totalStorageUnits?: number;
  /** Storage capacity in MWh */
  storageCapacityMWh?: number;
  /** Total transmission lines */
  totalTransmissionLines?: number;
  /** Total generation capacity in MW */
  totalCapacityMW?: number;
  /** Current output in MW */
  currentOutputMW?: number;
  /** Renewable percentage */
  renewablePercentage?: number;
  /** Carbon emissions in tons */
  carbonEmissions?: number;
  /** Monthly revenue */
  monthlyRevenue?: number;
  
  // Action callbacks
  onNewWell?: () => void;
  onNewSolarFarm?: () => void;
  onNewWindFarm?: () => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format currency values
 */
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
};

/**
 * Format power output
 */
const formatPower = (kw: number): string => {
  if (kw >= 1000) {
    return `${(kw / 1000).toFixed(1)} MW`;
  }
  return `${Math.round(kw)} kW`;
};

/**
 * Format volume
 */
const formatVolume = (value: number, unit: string): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M ${unit}`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K ${unit}`;
  }
  return `${Math.round(value)} ${unit}`;
};

// ============================================================================
// AAA KPI CARD COMPONENT (Matches Banking Dashboard)
// ============================================================================

/**
 * KPI Card component for summary metrics
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
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'emerald' | 'amber' | 'orange' | 'cyan';
}) {
  const colorClasses = {
    blue: 'bg-blue-900/30 text-blue-400',
    green: 'bg-green-900/30 text-green-400',
    yellow: 'bg-yellow-900/30 text-yellow-400',
    red: 'bg-red-900/30 text-red-400',
    purple: 'bg-purple-900/30 text-purple-400',
    emerald: 'bg-emerald-900/30 text-emerald-400',
    amber: 'bg-amber-900/30 text-amber-400',
    orange: 'bg-orange-900/30 text-orange-400',
    cyan: 'bg-cyan-900/30 text-cyan-400',
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * EnergyDashboard Component
 * 
 * Main dashboard for Energy industry companies.
 * Aggregates all energy operations into unified interface.
 * 
 * @example
 * ```tsx
 * // Self-fetching mode
 * <EnergyDashboard
 *   companyId="company_123"
 *   companyName="Apex Energy Corp"
 *   onDataChange={() => refetchCompany()}
 * />
 * 
 * // Pre-fetched mode (from company page wrapper)
 * <EnergyDashboard
 *   companyId="company_123"
 *   totalOilWells={5}
 *   totalSolarFarms={3}
 *   ...
 * />
 * ```
 */
export function EnergyDashboard({ 
  companyId, 
  companyName, 
  onDataChange,
  // Pre-fetched data
  totalOilWells: prefetchedOilWells,
  dailyOilProduction: prefetchedOilProduction,
  totalGasFields: prefetchedGasFields,
  dailyGasProduction: prefetchedGasProduction,
  totalSolarFarms: prefetchedSolarFarms,
  solarCapacityMW: prefetchedSolarCapacity,
  totalWindTurbines: prefetchedWindTurbines,
  windCapacityMW: prefetchedWindCapacity,
  totalPowerPlants: prefetchedPowerPlants,
  powerPlantCapacityMW: prefetchedPowerPlantCapacity,
  totalStorageUnits: prefetchedStorageUnits,
  storageCapacityMWh: prefetchedStorageCapacity,
  totalTransmissionLines: prefetchedTransmissionLines,
  totalCapacityMW: prefetchedTotalCapacity,
  currentOutputMW: prefetchedCurrentOutput,
  renewablePercentage: prefetchedRenewablePercent,
  carbonEmissions: prefetchedCarbon,
  monthlyRevenue: prefetchedRevenue,
  // Action callbacks
  onNewWell,
  onNewSolarFarm,
  onNewWindFarm,
}: EnergyDashboardProps) {
  // Check if pre-fetched data is available
  const hasPrefetchedData = prefetchedOilWells !== undefined || prefetchedSolarFarms !== undefined;
  
  const [loading, setLoading] = useState(!hasPrefetchedData);
  const [portfolio, setPortfolio] = useState<EnergyPortfolio>({
    oilWells: prefetchedOilWells ?? 0,
    gasFields: prefetchedGasFields ?? 0,
    solarFarms: prefetchedSolarFarms ?? 0,
    windTurbines: prefetchedWindTurbines ?? 0,
    powerPlants: prefetchedPowerPlants ?? 0,
    storageUnits: prefetchedStorageUnits ?? 0,
    transmissionLines: prefetchedTransmissionLines ?? 0,
  });
  const [production, setProduction] = useState<EnergyProduction>({
    oilProduction: prefetchedOilProduction ?? 0,
    gasProduction: prefetchedGasProduction ?? 0,
    solarOutput: (prefetchedSolarCapacity ?? 0) * 1000, // MW to kW
    windOutput: (prefetchedWindCapacity ?? 0) * 1000, // MW to kW
    thermalOutput: prefetchedPowerPlantCapacity ?? 0,
    totalRevenue: prefetchedRevenue ?? 0,
  });
  const [activeTab, setActiveTab] = useState('overview');

  /**
   * Fetch energy summary data
   */
  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch counts and production data from all energy endpoints
      const [wellsRes, gasRes, solarRes, windRes, plantsRes, storageRes, linesRes] = await Promise.all([
        fetch(`/api/energy/oil-wells?company=${companyId}&limit=1`).catch(() => ({ ok: false })),
        fetch(`/api/energy/gas-fields?company=${companyId}&limit=1`).catch(() => ({ ok: false })),
        fetch(`/api/energy/solar-farms?company=${companyId}&limit=1`).catch(() => ({ ok: false })),
        fetch(`/api/energy/wind-turbines?company=${companyId}&limit=1`).catch(() => ({ ok: false })),
        fetch(`/api/energy/power-plants?company=${companyId}&limit=1`).catch(() => ({ ok: false })),
        fetch(`/api/energy/storage?company=${companyId}&limit=1`).catch(() => ({ ok: false })),
        fetch(`/api/energy/transmission-lines?company=${companyId}&limit=1`).catch(() => ({ ok: false })),
      ]);

      // Parse responses
      const parseResponse = async (res: Response | { ok: false }): Promise<{ pagination?: { total: number } }> => {
        if (!res.ok) return {};
        try {
          return await (res as Response).json();
        } catch {
          return {};
        }
      };

      const [wellsData, gasData, solarData, windData, plantsData, storageData, linesData] = await Promise.all([
        parseResponse(wellsRes as Response),
        parseResponse(gasRes as Response),
        parseResponse(solarRes as Response),
        parseResponse(windRes as Response),
        parseResponse(plantsRes as Response),
        parseResponse(storageRes as Response),
        parseResponse(linesRes as Response),
      ]);

      setPortfolio({
        oilWells: wellsData.pagination?.total || 0,
        gasFields: gasData.pagination?.total || 0,
        solarFarms: solarData.pagination?.total || 0,
        windTurbines: windData.pagination?.total || 0,
        powerPlants: plantsData.pagination?.total || 0,
        storageUnits: storageData.pagination?.total || 0,
        transmissionLines: linesData.pagination?.total || 0,
      });

      // Note: Production data would come from aggregation endpoints
      // Using placeholder until aggregate endpoints are built
      setProduction({
        oilProduction: 0,
        gasProduction: 0,
        solarOutput: 0,
        windOutput: 0,
        thermalOutput: 0,
        totalRevenue: 0,
      });

    } catch (error) {
      addToast({
        title: 'Error loading energy data',
        description: error instanceof Error ? error.message : 'Failed to fetch energy summary',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    // Skip fetching if we already have pre-fetched data
    if (!hasPrefetchedData) {
      fetchSummary();
    }
  }, [fetchSummary, hasPrefetchedData]);

  const totalAssets = portfolio.oilWells + portfolio.gasFields + portfolio.solarFarms + 
    portfolio.windTurbines + portfolio.powerPlants + portfolio.storageUnits + portfolio.transmissionLines;

  const renewableAssets = portfolio.solarFarms + portfolio.windTurbines;
  const fossilAssets = portfolio.oilWells + portfolio.gasFields + portfolio.powerPlants;
  const renewablePercentage = totalAssets > 0 ? Math.round((renewableAssets / totalAssets) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions - Matches Banking */}
      <div className="flex flex-wrap gap-3">
        <Button 
          color="primary" 
          className="text-white"
          startContent={<Plus className="h-4 w-4" />}
          onPress={onNewWell}
        >
          New Oil Well
        </Button>
        <Button 
          color="secondary" 
          variant="flat"
          className="text-green-300 bg-green-900/30 hover:bg-green-900/50"
          startContent={<Sun className="h-4 w-4" />}
          onPress={onNewSolarFarm}
        >
          Add Solar Farm
        </Button>
        <Button 
          color="secondary" 
          variant="flat"
          className="text-cyan-300 bg-cyan-900/30 hover:bg-cyan-900/50"
          startContent={<Wind className="h-4 w-4" />}
          onPress={onNewWindFarm}
        >
          Add Wind Farm
        </Button>
        <Button 
          variant="bordered"
          className="text-gray-300 border-gray-600 hover:bg-gray-700"
          startContent={<RefreshCw className="h-4 w-4" />}
          onPress={fetchSummary}
        >
          Refresh
        </Button>
      </div>

      {/* Tabs - AAA Design */}
      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
        color="primary"
        classNames={{
          tabList: "bg-slate-800/50 border border-slate-700",
          cursor: "bg-primary",
          tab: "text-gray-400 data-[selected=true]:text-white",
          tabContent: "group-data-[selected=true]:text-white"
        }}
      >
        <Tab key="overview" title="Overview" />
        <Tab key="oilgas" title="Oil & Gas" />
        <Tab key="renewable" title="Renewable Energy" />
        <Tab key="grid" title="Grid & Storage" />
        <Tab key="market" title="Market" />
      </Tabs>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards - Matches Banking pattern */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Assets"
              value={totalAssets}
              subtitle="Energy portfolio"
              icon={BarChart3}
              color="blue"
            />
            <KPICard
              title="Renewable Assets"
              value={renewableAssets}
              subtitle={`${renewablePercentage}% of portfolio`}
              icon={Leaf}
              color="emerald"
            />
            <KPICard
              title="Fossil Assets"
              value={fossilAssets}
              subtitle="Oil, gas & power plants"
              icon={Flame}
              color="orange"
            />
            <KPICard
              title="Monthly Revenue"
              value={formatCurrency(production.totalRevenue)}
              subtitle="Current month"
              icon={DollarSign}
              color="green"
            />
          </div>

          {/* Asset Breakdown - AAA Cards */}
          <Card className="p-6 bg-slate-800/50 border border-slate-700">
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                Portfolio Breakdown
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="text-center">
                  <div className={`p-3 rounded-xl bg-amber-900/30 text-amber-400 mx-auto w-fit mb-2`}>
                    <Droplets className="h-6 w-6" />
                  </div>
                  <p className="text-2xl font-bold text-white">{portfolio.oilWells}</p>
                  <p className="text-xs text-gray-400">Oil Wells</p>
                </div>
                <div className="text-center">
                  <div className={`p-3 rounded-xl bg-orange-900/30 text-orange-400 mx-auto w-fit mb-2`}>
                    <Flame className="h-6 w-6" />
                  </div>
                  <p className="text-2xl font-bold text-white">{portfolio.gasFields}</p>
                  <p className="text-xs text-gray-400">Gas Fields</p>
                </div>
                <div className="text-center">
                  <div className={`p-3 rounded-xl bg-yellow-900/30 text-yellow-400 mx-auto w-fit mb-2`}>
                    <Sun className="h-6 w-6" />
                  </div>
                  <p className="text-2xl font-bold text-white">{portfolio.solarFarms}</p>
                  <p className="text-xs text-gray-400">Solar Farms</p>
                </div>
                <div className="text-center">
                  <div className={`p-3 rounded-xl bg-cyan-900/30 text-cyan-400 mx-auto w-fit mb-2`}>
                    <Wind className="h-6 w-6" />
                  </div>
                  <p className="text-2xl font-bold text-white">{portfolio.windTurbines}</p>
                  <p className="text-xs text-gray-400">Wind Turbines</p>
                </div>
                <div className="text-center">
                  <div className={`p-3 rounded-xl bg-red-900/30 text-red-400 mx-auto w-fit mb-2`}>
                    <Zap className="h-6 w-6" />
                  </div>
                  <p className="text-2xl font-bold text-white">{portfolio.powerPlants}</p>
                  <p className="text-xs text-gray-400">Power Plants</p>
                </div>
                <div className="text-center">
                  <div className={`p-3 rounded-xl bg-purple-900/30 text-purple-400 mx-auto w-fit mb-2`}>
                    <Battery className="h-6 w-6" />
                  </div>
                  <p className="text-2xl font-bold text-white">{portfolio.storageUnits}</p>
                  <p className="text-xs text-gray-400">Storage Units</p>
                </div>
                <div className="text-center">
                  <div className={`p-3 rounded-xl bg-green-900/30 text-green-400 mx-auto w-fit mb-2`}>
                    <Cable className="h-6 w-6" />
                  </div>
                  <p className="text-2xl font-bold text-white">{portfolio.transmissionLines}</p>
                  <p className="text-xs text-gray-400">Grid Lines</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Energy Mix Summary - AAA Design */}
          <Card className="p-4 bg-slate-800/50 border border-slate-700">
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Leaf className="h-5 w-5 text-emerald-400" />
                Energy Mix
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Renewable Energy</span>
                    <span className="text-emerald-400">{renewablePercentage}%</span>
                  </div>
                  <Progress value={renewablePercentage} color="success" size="sm" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Fossil Fuels</span>
                    <span className="text-orange-400">{100 - renewablePercentage}%</span>
                  </div>
                  <Progress value={100 - renewablePercentage} color="warning" size="sm" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Grid Efficiency</span>
                    <span className="text-blue-400">85%</span>
                  </div>
                  <Progress value={85} color="primary" size="sm" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Oil & Gas Tab */}
      {activeTab === 'oilgas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard
              title="Oil Wells"
              value={portfolio.oilWells}
              subtitle="Active wells"
              icon={Droplets}
              color="amber"
            />
            <KPICard
              title="Gas Fields"
              value={portfolio.gasFields}
              subtitle="Operating fields"
              icon={Flame}
              color="orange"
            />
            <KPICard
              title="Oil Production"
              value={formatVolume(production.oilProduction, 'bbl/day')}
              subtitle="Daily output"
              icon={TrendingUp}
              color="green"
            />
            <KPICard
              title="Gas Production"
              value={formatVolume(production.gasProduction, 'MCF/day')}
              subtitle="Daily output"
              icon={BarChart3}
              color="blue"
            />
          </div>
          <OilGasOperations companyId={companyId} onDataChange={onDataChange} />
        </div>
      )}

      {/* Renewable Energy Tab */}
      {activeTab === 'renewable' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard
              title="Solar Farms"
              value={portfolio.solarFarms}
              subtitle="Active installations"
              icon={Sun}
              color="yellow"
            />
            <KPICard
              title="Wind Turbines"
              value={portfolio.windTurbines}
              subtitle="Operational units"
              icon={Wind}
              color="cyan"
            />
            <KPICard
              title="Solar Output"
              value={formatPower(production.solarOutput)}
              subtitle="Current generation"
              icon={Zap}
              color="emerald"
            />
            <KPICard
              title="Wind Output"
              value={formatPower(production.windOutput)}
              subtitle="Current generation"
              icon={TrendingUp}
              color="blue"
            />
          </div>
          <RenewableEnergyDashboard companyId={companyId} onDataChange={onDataChange} />
        </div>
      )}

      {/* Grid & Storage Tab */}
      {activeTab === 'grid' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title="Power Plants"
              value={portfolio.powerPlants}
              subtitle="Generating stations"
              icon={Zap}
              color="red"
            />
            <KPICard
              title="Storage Units"
              value={portfolio.storageUnits}
              subtitle="Battery systems"
              icon={Battery}
              color="purple"
            />
            <KPICard
              title="Transmission Lines"
              value={portfolio.transmissionLines}
              subtitle="Grid connections"
              icon={Cable}
              color="green"
            />
          </div>
          <Card className="p-6 bg-slate-800/50 border border-slate-700">
            <p className="text-gray-400 text-center">
              Grid infrastructure and storage management coming soon.
            </p>
          </Card>
        </div>
      )}

      {/* Market Tab */}
      {activeTab === 'market' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard
              title="Energy Revenue"
              value={formatCurrency(production.totalRevenue)}
              subtitle="This month"
              icon={DollarSign}
              color="green"
            />
            <KPICard
              title="Production"
              value={formatPower(production.solarOutput + production.windOutput + production.thermalOutput * 1000)}
              subtitle="Total output"
              icon={TrendingUp}
              color="blue"
            />
            <KPICard
              title="Carbon Credits"
              value="0"
              subtitle="Earned this month"
              icon={Leaf}
              color="emerald"
            />
            <KPICard
              title="Market Price"
              value="$45.20"
              subtitle="Per MWh"
              icon={BarChart3}
              color="yellow"
            />
          </div>
          <Card className="p-6 bg-slate-800/50 border border-slate-700">
            <p className="text-gray-400 text-center">
              Energy market analytics and trading coming soon.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

export default EnergyDashboard;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **AAA Design Uniformity**: Matches Banking dashboard pattern exactly
 * 2. **KPI Cards**: Consistent icon+value+subtitle pattern with dark theme
 * 3. **Action Buttons**: Top action bar matching other industry dashboards
 * 4. **Tab System**: Dark themed tabs with proper styling
 * 5. **Card Styling**: bg-slate-800/50 border-slate-700 throughout
 * 
 * INTEGRATION:
 * - Entry point for Energy industry companies
 * - Links to specialized sub-dashboards (OilGasOperations, RenewableEnergyDashboard)
 * - Provides high-level portfolio overview with KPI summaries
 * 
 * @updated 2025-12-06 - AAA Design Uniformity Update
 */
