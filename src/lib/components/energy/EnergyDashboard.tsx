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
 * @author ECHO v1.3.1
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Tabs, Tab } from '@heroui/tabs';
import { addToast } from '@heroui/toast';
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Energy Operations</h1>
          {companyName && <p className="text-default-500">{companyName}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="flat" onPress={fetchSummary}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5">
          <CardBody className="text-center">
            <div className="text-3xl font-bold text-amber-600">{portfolio.oilWells}</div>
            <div className="text-xs text-default-500">Oil Wells</div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5">
          <CardBody className="text-center">
            <div className="text-3xl font-bold text-orange-600">{portfolio.gasFields}</div>
            <div className="text-xs text-default-500">Gas Fields</div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
          <CardBody className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{portfolio.solarFarms}</div>
            <div className="text-xs text-default-500">Solar Farms</div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5">
          <CardBody className="text-center">
            <div className="text-3xl font-bold text-cyan-600">{portfolio.windTurbines}</div>
            <div className="text-xs text-default-500">Wind Turbines</div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-slate-500/10 to-slate-600/5">
          <CardBody className="text-center">
            <div className="text-3xl font-bold text-slate-600">{portfolio.powerPlants}</div>
            <div className="text-xs text-default-500">Power Plants</div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardBody className="text-center">
            <div className="text-3xl font-bold text-purple-600">{portfolio.storageUnits}</div>
            <div className="text-xs text-default-500">Storage Units</div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardBody className="text-center">
            <div className="text-3xl font-bold text-blue-600">{portfolio.transmissionLines}</div>
            <div className="text-xs text-default-500">Grid Lines</div>
          </CardBody>
        </Card>
      </div>

      {/* Energy Mix Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-default-500">Total Assets</div>
                <div className="text-2xl font-bold">{totalAssets}</div>
              </div>
              <Chip color="primary" variant="flat">Portfolio</Chip>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-default-500">Renewable Assets</div>
                <div className="text-2xl font-bold text-success">{renewableAssets}</div>
              </div>
              <Chip color="success" variant="flat">Green</Chip>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-default-500">Fossil Assets</div>
                <div className="text-2xl font-bold text-warning">{fossilAssets}</div>
              </div>
              <Chip color="warning" variant="flat">Traditional</Chip>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabbed Operations */}
      <Card>
        <CardBody>
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            classNames={{
              tabList: 'gap-4',
            }}
          >
            <Tab key="overview" title="Overview">
              <div className="pt-4 space-y-4">
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-2">Energy Portfolio Overview</h3>
                  <p className="text-default-500">
                    Select a tab above to manage specific energy operations.
                  </p>
                  <div className="flex justify-center gap-4 mt-4">
                    <Button color="primary" onPress={() => setActiveTab('oilgas')}>
                      Oil & Gas Operations
                    </Button>
                    <Button color="success" onPress={() => setActiveTab('renewable')}>
                      Renewable Energy
                    </Button>
                  </div>
                </div>
              </div>
            </Tab>

            <Tab key="oilgas" title="Oil & Gas">
              <div className="pt-4">
                <OilGasOperations companyId={companyId} onDataChange={onDataChange} />
              </div>
            </Tab>

            <Tab key="renewable" title="Renewable Energy">
              <div className="pt-4">
                <RenewableEnergyDashboard companyId={companyId} onDataChange={onDataChange} />
              </div>
            </Tab>

            <Tab key="grid" title="Grid & Storage">
              <div className="pt-4">
                <div className="text-center py-8 text-default-500">
                  <p>Grid infrastructure and storage management coming soon.</p>
                  <p className="text-sm mt-2">
                    Power plants: {portfolio.powerPlants} | Storage: {portfolio.storageUnits} | Lines: {portfolio.transmissionLines}
                  </p>
                </div>
              </div>
            </Tab>

            <Tab key="market" title="Market">
              <div className="pt-4">
                <div className="text-center py-8 text-default-500">
                  <p>Energy market analytics and trading coming soon.</p>
                </div>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}

export default EnergyDashboard;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Aggregated View**: Unified dashboard for all energy operations
 * 2. **Portfolio Summary**: Asset counts across all energy types
 * 3. **Tabbed Interface**: Organized access to sub-dashboards
 * 4. **Reusable Sub-Components**: OilGasOperations, RenewableEnergyDashboard
 * 5. **Color Coding**: Visual distinction between asset types
 * 
 * INTEGRATION:
 * - Entry point for Energy industry companies
 * - Links to specialized sub-dashboards
 * - Provides high-level portfolio overview
 * 
 * FUTURE ENHANCEMENTS:
 * - Add production aggregation API
 * - Implement grid infrastructure tab
 * - Add market analytics tab
 * - Real-time production monitoring
 */
