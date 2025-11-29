/**
 * @fileoverview Oil & Gas Operations Dashboard Component
 * @module lib/components/energy/OilGasOperations
 * 
 * OVERVIEW:
 * Comprehensive Oil & Gas operations dashboard for Energy companies.
 * Displays wells, gas fields, production metrics, and operational controls.
 * Ported from legacy Chakra UI to HeroUI with enhanced features.
 * 
 * FEATURES:
 * - Oil wells overview with production/depletion tracking
 * - Gas fields with pressure/quality management
 * - Extraction and maintenance operations
 * - Revenue and production analytics
 * - Tabbed interface for different asset types
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { Tabs, Tab } from '@heroui/tabs';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/modal';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { addToast } from '@heroui/toast';
import { DataTable, type Column } from '@/lib/components/shared/DataTable';
import { LoadingSpinner } from '@/lib/components/shared/LoadingSpinner';
import { EmptyState } from '@/lib/components/shared/EmptyState';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Well status types */
type WellStatus = 'Drilling' | 'Active' | 'Depleted' | 'Maintenance' | 'Abandoned';

/** Well type categories */
type WellType = 'Conventional' | 'Unconventional' | 'Offshore' | 'Shale';

/** Gas quality grades */
type QualityGrade = 'Pipeline' | 'Plant' | 'Sour';

/**
 * Oil well data structure
 */
interface OilWell {
  _id: string;
  companyId: string;
  name: string;
  wellType: WellType;
  status: WellStatus;
  location: {
    latitude: number;
    longitude: number;
    region: string;
    isOffshore: boolean;
  };
  peakProduction: number;
  currentProduction: number;
  depletionRate: number;
  reserveEstimate: number;
  daysActive: number;
  lastMaintenanceDate: Date;
  equipment: {
    efficiency: number;
    age: number;
    cost: number;
  };
  extractionCost: number;
  oilPrice: number;
  revenue: number;
  isDepleted: boolean;
}

/**
 * Gas field data structure
 */
interface GasField {
  _id: string;
  companyId: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  reserveEstimate: number;
  currentProduction: number;
  pressure: number;
  qualityGrade: QualityGrade;
  depletionRate: number;
  gasPrice: number;
  revenue: number;
  operatingCost: number;
}

/**
 * Component props
 */
export interface OilGasOperationsProps {
  /** Company ID for data lookup */
  companyId: string;
  /** Callback when data changes */
  onDataChange?: () => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format currency values
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format large numbers with commas
 */
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
};

/**
 * Get status chip color
 */
const getStatusColor = (status: WellStatus): 'success' | 'primary' | 'warning' | 'danger' | 'default' => {
  switch (status) {
    case 'Active': return 'success';
    case 'Drilling': return 'primary';
    case 'Maintenance': return 'warning';
    case 'Depleted': return 'danger';
    case 'Abandoned': return 'default';
    default: return 'default';
  }
};

/**
 * Get quality grade color
 */
const getQualityColor = (grade: QualityGrade): 'success' | 'primary' | 'warning' => {
  switch (grade) {
    case 'Pipeline': return 'success';
    case 'Plant': return 'primary';
    case 'Sour': return 'warning';
    default: return 'primary';
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * OilGasOperations Component
 * 
 * Oil & Gas operations management dashboard with production tracking,
 * maintenance scheduling, and revenue optimization.
 * 
 * @example
 * ```tsx
 * <OilGasOperations
 *   companyId="company_123"
 *   onDataChange={() => refetchCompany()}
 * />
 * ```
 */
export function OilGasOperations({ companyId, onDataChange }: OilGasOperationsProps) {
  // Modal controls
  const { isOpen: isExtractOpen, onOpen: onExtractOpen, onClose: onExtractClose } = useDisclosure();
  const { isOpen: isMaintainOpen, onOpen: onMaintainOpen, onClose: onMaintainClose } = useDisclosure();

  // State
  const [wells, setWells] = useState<OilWell[]>([]);
  const [gasFields, setGasFields] = useState<GasField[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOperating, setIsOperating] = useState(false);
  const [selectedWell, setSelectedWell] = useState<OilWell | null>(null);
  const [extractionDuration, setExtractionDuration] = useState(24);
  const [maintenanceType, setMaintenanceType] = useState('Routine');
  const [activeTab, setActiveTab] = useState('wells');

  /**
   * Fetch oil & gas data
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [wellsRes, gasRes] = await Promise.all([
        fetch(`/api/energy/oil-wells?company=${companyId}`),
        fetch(`/api/energy/gas-fields?company=${companyId}`),
      ]);

      if (!wellsRes.ok || !gasRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [wellsData, gasData] = await Promise.all([
        wellsRes.json(),
        gasRes.json(),
      ]);

      setWells(wellsData.wells || []);
      setGasFields(gasData.fields || []);
    } catch (error) {
      addToast({
        title: 'Error loading data',
        description: error instanceof Error ? error.message : 'Failed to fetch operations data',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Handle extraction operation
   */
  const handleExtract = async () => {
    if (!selectedWell) return;

    setIsOperating(true);
    try {
      const response = await fetch(`/api/energy/oil-wells/${selectedWell._id}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: extractionDuration }),
      });

      const data = await response.json();

      if (response.ok) {
        addToast({
          title: 'Extraction complete',
          description: `Produced ${formatNumber(data.production)} barrels, Revenue: ${formatCurrency(data.revenue)}`,
          color: 'success',
        });
        fetchData();
        onDataChange?.();
        onExtractClose();
      } else {
        addToast({
          title: 'Extraction failed',
          description: data.error || 'Operation failed',
          color: 'danger',
        });
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Network error',
        color: 'danger',
      });
    } finally {
      setIsOperating(false);
    }
  };

  /**
   * Handle maintenance operation
   */
  const handleMaintenance = async () => {
    if (!selectedWell) return;

    setIsOperating(true);
    try {
      const response = await fetch(`/api/energy/oil-wells/${selectedWell._id}/maintain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceType }),
      });

      const data = await response.json();

      if (response.ok) {
        addToast({
          title: 'Maintenance complete',
          description: `Cost: ${formatCurrency(data.cost)}, Efficiency: +${data.efficiencyImprovement}%`,
          color: 'success',
        });
        fetchData();
        onDataChange?.();
        onMaintainClose();
      } else {
        addToast({
          title: 'Maintenance failed',
          description: data.error || 'Operation failed',
          color: 'danger',
        });
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Network error',
        color: 'danger',
      });
    } finally {
      setIsOperating(false);
    }
  };

  // Calculate totals
  const totalOilProduction = wells.reduce((sum, well) => sum + well.currentProduction, 0);
  const totalGasProduction = gasFields.reduce((sum, field) => sum + field.currentProduction, 0);
  const totalRevenue = wells.reduce((sum, well) => sum + well.revenue, 0) +
    gasFields.reduce((sum, field) => sum + field.revenue, 0);
  const avgDepletion = wells.length > 0
    ? wells.reduce((sum, well) => sum + well.depletionRate, 0) / wells.length
    : 0;

  // Well table columns
  const wellColumns: Column<OilWell>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Type', accessor: (well) => <Chip size="sm">{well.wellType}</Chip> },
    { header: 'Status', accessor: (well) => (
      <Chip size="sm" color={getStatusColor(well.status)}>{well.status}</Chip>
    )},
    { header: 'Production (bbl/day)', accessor: (well) => formatNumber(well.currentProduction) },
    { header: 'Depletion', accessor: (well) => (
      <div className="flex items-center gap-2">
        <Progress
          value={well.depletionRate}
          maxValue={15}
          size="sm"
          color={well.depletionRate > 10 ? 'danger' : 'warning'}
          className="w-16"
        />
        <span className="text-xs">{well.depletionRate.toFixed(1)}%</span>
      </div>
    )},
    { header: 'Revenue/Day', accessor: (well) => (
      <span className="text-success font-medium">{formatCurrency(well.revenue)}</span>
    )},
    { header: 'Actions', accessor: (well) => (
      <div className="flex gap-1">
        <Button
          size="sm"
          color="primary"
          variant="flat"
          isDisabled={well.status !== 'Active'}
          onPress={() => {
            setSelectedWell(well);
            onExtractOpen();
          }}
        >
          Extract
        </Button>
        <Button
          size="sm"
          color="secondary"
          variant="flat"
          onPress={() => {
            setSelectedWell(well);
            onMaintainOpen();
          }}
        >
          Maintain
        </Button>
      </div>
    )},
  ];

  // Gas field table columns
  const gasFieldColumns: Column<GasField>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Region', accessor: (field) => field.location.region },
    { header: 'Quality', accessor: (field) => (
      <Chip size="sm" color={getQualityColor(field.qualityGrade)}>{field.qualityGrade}</Chip>
    )},
    { header: 'Production (MCF/day)', accessor: (field) => formatNumber(field.currentProduction) },
    { header: 'Pressure (psi)', accessor: (field) => formatNumber(field.pressure) },
    { header: 'Revenue/Day', accessor: (field) => (
      <span className="text-success font-medium">{formatCurrency(field.revenue)}</span>
    )},
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="text-sm text-default-500">Oil Production</div>
            <div className="text-2xl font-bold">{formatNumber(totalOilProduction)} bbl/day</div>
            <div className="text-xs text-default-400 flex items-center gap-1">
              <span className={avgDepletion < 5 ? 'text-success' : 'text-danger'}>
                {avgDepletion < 5 ? '↑' : '↓'}
              </span>
              {avgDepletion.toFixed(2)}% depletion
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-sm text-default-500">Gas Production</div>
            <div className="text-2xl font-bold">{formatNumber(totalGasProduction)} MCF/day</div>
            <div className="text-xs text-default-400">{gasFields.length} active fields</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-sm text-default-500">Total Revenue</div>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</div>
            <div className="text-xs text-default-400">Daily production value</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-sm text-default-500">Active Assets</div>
            <div className="text-2xl font-bold">{wells.length + gasFields.length}</div>
            <div className="text-xs text-default-400">
              {wells.length} wells, {gasFields.length} fields
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Card>
        <CardBody>
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            <Tab key="wells" title={`Oil Wells (${wells.length})`}>
              <div className="pt-4">
                {wells.length === 0 ? (
                  <EmptyState
                    message="No oil wells found"
                    description="Create an oil well to start production"
                  />
                ) : (
                  <DataTable data={wells} columns={wellColumns} />
                )}
              </div>
            </Tab>

            <Tab key="fields" title={`Gas Fields (${gasFields.length})`}>
              <div className="pt-4">
                {gasFields.length === 0 ? (
                  <EmptyState
                    message="No gas fields found"
                    description="Create a gas field to start production"
                  />
                ) : (
                  <DataTable data={gasFields} columns={gasFieldColumns} />
                )}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Extraction Modal */}
      <Modal isOpen={isExtractOpen} onClose={onExtractClose}>
        <ModalContent>
          <ModalHeader>Extract Oil - {selectedWell?.name}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-default-500 mb-2">
                  Run extraction operation on this well. Duration affects production and depletion.
                </p>
              </div>

              <Input
                type="number"
                label="Duration (hours)"
                value={extractionDuration.toString()}
                onChange={(e) => setExtractionDuration(parseInt(e.target.value) || 24)}
                min={1}
                max={168}
              />

              {selectedWell && (
                <Card className="bg-default-100">
                  <CardBody className="text-sm">
                    <div className="flex justify-between">
                      <span>Current Production:</span>
                      <span>{formatNumber(selectedWell.currentProduction)} bbl/day</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Output:</span>
                      <span>
                        {formatNumber((selectedWell.currentProduction / 24) * extractionDuration)} barrels
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Depletion Impact:</span>
                      <span className="text-warning">+{(extractionDuration * 0.01).toFixed(2)}%</span>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onExtractClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              isLoading={isOperating}
              onPress={handleExtract}
            >
              Start Extraction
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Maintenance Modal */}
      <Modal isOpen={isMaintainOpen} onClose={onMaintainClose}>
        <ModalContent>
          <ModalHeader>Maintenance - {selectedWell?.name}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-default-500">
                Perform maintenance to improve equipment efficiency and prevent breakdowns.
              </p>

              <Select
                label="Maintenance Type"
                selectedKeys={[maintenanceType]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  if (selected) setMaintenanceType(selected);
                }}
              >
                <SelectItem key="Routine">Routine - $5,000</SelectItem>
                <SelectItem key="Major">Major - $25,000</SelectItem>
                <SelectItem key="Emergency">Emergency - $50,000</SelectItem>
              </Select>

              {selectedWell && (
                <Card className="bg-default-100">
                  <CardBody className="text-sm">
                    <div className="flex justify-between">
                      <span>Current Efficiency:</span>
                      <span>{selectedWell.equipment.efficiency}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Equipment Age:</span>
                      <span>{selectedWell.equipment.age} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected Improvement:</span>
                      <span className="text-success">
                        +{maintenanceType === 'Routine' ? 3 : maintenanceType === 'Major' ? 8 : 15}%
                      </span>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onMaintainClose}>
              Cancel
            </Button>
            <Button
              color="secondary"
              isLoading={isOperating}
              onPress={handleMaintenance}
            >
              Perform Maintenance
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default OilGasOperations;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Ported from Chakra UI**: Complete HeroUI rewrite with same features
 * 2. **Reuses Shared Components**: DataTable, LoadingSpinner, EmptyState
 * 3. **API Integration**: Uses existing /api/energy/* endpoints
 * 4. **Modals**: Extraction and maintenance operations with HeroUI Modal
 * 5. **State Management**: Local state with useCallback for memoization
 * 6. **Formatting**: Consistent currency and number formatting
 * 7. **Responsiveness**: Grid layouts with Tailwind breakpoints
 * 
 * LEGACY FEATURES PRESERVED:
 * - Wells overview with production/depletion tracking
 * - Gas fields with quality grades
 * - Extraction and maintenance operations
 * - Revenue calculations
 * - Status color coding
 * 
 * FUTURE ENHANCEMENTS:
 * - Add extraction sites tab
 * - Add reserves and storage tabs
 * - Real-time production simulation
 * - Production charts and trends
 */
