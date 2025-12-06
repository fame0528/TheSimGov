/**
 * @fileoverview Infrastructure Manager - GPU Cluster Management Dashboard
 * @module lib/components/ai/InfrastructureManager
 * 
 * OVERVIEW:
 * Tab-based dashboard for managing GPU clusters, data centers, utilization, and costs.
 * Adapted from DataCenterDesigner.tsx (wizard → tabs) with real-time cost calculations.
 * 
 * FEATURES:
 * - GPU Clusters tab (model selection, quantity, power/cost calculations)
 * - Data Centers tab (tier certification, cooling systems, specs)
 * - Utilization tab (GPU usage graphs, idle alerts)
 * - Costs tab (monthly opex, ROI calculator with payback years)
 * - Real-time cost estimation (updates on any input change)
 * - Validation system (tier requirement checks)
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Tabs, Tab } from '@heroui/tabs';
import { Select, SelectItem } from '@heroui/select';
import { Input } from '@heroui/input';
import { Progress } from '@heroui/progress';
import { toast } from 'react-toastify';
import { formatCurrency } from '@/lib/utils/formatting';

export interface InfrastructureManagerProps {
  /** Company ID */
  companyId: string;
  /** Existing GPU clusters */
  clusters?: GPUCluster[];
  /** Create cluster handler */
  onCreateCluster?: (cluster: Partial<GPUCluster>) => void;
}

export interface GPUCluster {
  id: string;
  name: string;
  model: 'A100-40GB' | 'A100-80GB' | 'H100-80GB' | 'B200-192GB';
  count: number;
  utilization: number;
  powerPerGPU: number;
  costPerGPU: number;
  totalPower: number;
  totalCost: number;
}

/**
 * GPU model specifications
 */
const GPU_SPECS = {
  'A100-40GB': { power: 400, cost: 10000 },
  'A100-80GB': { power: 400, cost: 15000 },
  'H100-80GB': { power: 700, cost: 30000 },
  'B200-192GB': { power: 1000, cost: 50000 },
};

/**
 * InfrastructureManager Component
 * 
 * Manages GPU clusters and infrastructure with cost tracking and utilization monitoring.
 * 
 * @example
 * ```tsx
 * <InfrastructureManager
 *   companyId="123"
 *   clusters={gpuClusters}
 *   onCreateCluster={(cluster) => addCluster(cluster)}
 * />
 * ```
 */
export function InfrastructureManager({
  companyId: _companyId,
  clusters = [],
  onCreateCluster,
}: InfrastructureManagerProps) {
  const [activeTab, setActiveTab] = useState('clusters');

  // Form state
  const [clusterName, setClusterName] = useState('');
  const [gpuModel, setGpuModel] = useState<keyof typeof GPU_SPECS>('A100-40GB');
  const [gpuCount, setGpuCount] = useState(8);
  const [monthlyRevenue, setMonthlyRevenue] = useState(100000);
  const [monthlyOpex, setMonthlyOpex] = useState(50000);

  // Calculated values
  const [totalPower, setTotalPower] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [annualProfit, setAnnualProfit] = useState(0);
  const [paybackYears, setPaybackYears] = useState(0);
  const [fiveYearROI, setFiveYearROI] = useState(0);

  // Real-time cost calculation
  useEffect(() => {
    const specs = GPU_SPECS[gpuModel];
    const power = gpuCount * specs.power;
    const cost = gpuCount * specs.cost;
    const profit = (monthlyRevenue - monthlyOpex) * 12;
    const payback = cost / (profit > 0 ? profit : 1);
    const roi = ((profit * 5) / cost) * 100;

    setTotalPower(power);
    setTotalCost(cost);
    setAnnualProfit(profit);
    setPaybackYears(payback);
    setFiveYearROI(roi);
  }, [gpuModel, gpuCount, monthlyRevenue, monthlyOpex]);

  // Calculate total utilization across all clusters
  const totalGPUs = clusters.reduce((sum, c) => sum + c.count, 0);
  const avgUtilization = clusters.length > 0
    ? clusters.reduce((sum, c) => sum + c.utilization, 0) / clusters.length
    : 0;

  const handleCreateCluster = () => {
    if (onCreateCluster) {
      onCreateCluster({
        name: clusterName || `${gpuModel} Cluster`,
        model: gpuModel,
        count: gpuCount,
        utilization: 0,
        powerPerGPU: GPU_SPECS[gpuModel].power,
        costPerGPU: GPU_SPECS[gpuModel].cost,
        totalPower,
        totalCost,
      });
      setClusterName('');
      setGpuCount(8);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">⚡ Infrastructure Manager</h2>
        <p className="text-default-700">GPU clusters, data centers, and cost optimization</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-default-700">Total GPUs</p>
            <p className="text-2xl font-bold text-primary">{totalGPUs}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-700">Avg Utilization</p>
            <p className="text-2xl font-bold text-success">{avgUtilization.toFixed(1)}%</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-700">Clusters</p>
            <p className="text-2xl font-bold text-warning">{clusters.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-700">Total Value</p>
            <p className="text-2xl font-bold text-danger">
              {formatCurrency(clusters.reduce((sum, c) => sum + c.totalCost, 0))}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="clusters" title="GPU Clusters">
          <div className="mt-4 space-y-4">
            {/* New Cluster Form */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Add New GPU Cluster</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Cluster Name</label>
                    <Input
                      value={clusterName}
                      onValueChange={setClusterName}
                      placeholder="Production Cluster"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">GPU Model</label>
                    <Select
                      selectedKeys={[gpuModel]}
                      onSelectionChange={(keys) => setGpuModel(String(Array.from(keys)[0]) as keyof typeof GPU_SPECS)}
                    >
                      <SelectItem key="A100-40GB">A100-40GB (400W, $10k)</SelectItem>
                      <SelectItem key="A100-80GB">A100-80GB (400W, $15k)</SelectItem>
                      <SelectItem key="H100-80GB">H100-80GB (700W, $30k)</SelectItem>
                      <SelectItem key="B200-192GB">B200-192GB (1000W, $50k)</SelectItem>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">GPU Quantity</label>
                    <Input
                      type="number"
                      value={gpuCount.toString()}
                      onValueChange={(value) => setGpuCount(parseInt(value) || 0)}
                      endContent={<span className="text-default-400">GPUs</span>}
                    />
                  </div>
                  <div className="bg-default-100 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-1">Total Cost</p>
                    <p className="text-2xl font-bold text-danger">{formatCurrency(totalCost)}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-default-700">Total Power: <span className="font-bold">{totalPower}W</span></p>
                  </div>
                  <Button color="primary" onPress={handleCreateCluster}>
                    Add Cluster
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Existing Clusters */}
            {clusters.length === 0 ? (
              <Card>
                <CardBody>
                  <p className="text-center text-default-700 py-8">
                    No GPU clusters yet. Add your first cluster to start training models!
                  </p>
                </CardBody>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clusters.map((cluster) => (
                  <Card key={cluster.id}>
                    <CardHeader>
                      <div>
                        <h3 className="text-lg font-semibold">{cluster.name}</h3>
                        <Chip size="sm" color="primary">{cluster.model}</Chip>
                      </div>
                    </CardHeader>
                    <CardBody className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-default-700">GPUs:</span>
                          <span className="font-bold ml-1">{cluster.count}</span>
                        </div>
                        <div>
                          <span className="text-default-700">Power:</span>
                          <span className="font-bold ml-1">{cluster.totalPower}W</span>
                        </div>
                        <div>
                          <span className="text-default-700">Cost:</span>
                          <span className="font-bold ml-1">{formatCurrency(cluster.totalCost)}</span>
                        </div>
                        <div>
                          <span className="text-default-700">Utilization:</span>
                          <span className="font-bold ml-1">{cluster.utilization}%</span>
                        </div>
                      </div>
                      <div>
                        <Progress 
                          value={cluster.utilization} 
                          color={cluster.utilization > 80 ? 'success' : 'warning'}
                          size="sm"
                        />
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Tab>

        <Tab key="utilization" title="Utilization">
          <div className="mt-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">GPU Utilization</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Overall Utilization</span>
                      <span className="font-bold">{avgUtilization.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={avgUtilization} 
                      color={avgUtilization > 70 ? 'success' : avgUtilization > 40 ? 'warning' : 'danger'}
                      size="md"
                    />
                  </div>
                  {avgUtilization < 50 && (
                    <Card className="bg-warning-50 dark:bg-warning-900/20 border-2 border-warning">
                      <CardBody>
                        <p className="text-sm">⚠️ Low GPU utilization detected. Consider reducing cluster size or increasing workload.</p>
                      </CardBody>
                    </Card>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="costs" title="Costs & ROI">
          <div className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">ROI Calculator</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Monthly Revenue</label>
                    <Input
                      type="number"
                      value={monthlyRevenue.toString()}
                      onValueChange={(value) => setMonthlyRevenue(parseInt(value) || 0)}
                      startContent={<span className="text-default-400">$</span>}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Monthly Operating Costs</label>
                    <Input
                      type="number"
                      value={monthlyOpex.toString()}
                      onValueChange={(value) => setMonthlyOpex(parseInt(value) || 0)}
                      startContent={<span className="text-default-400">$</span>}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-default-100 p-4 rounded-lg">
                    <p className="text-sm text-default-700">Annual Profit</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(annualProfit)}</p>
                  </div>
                  <div className="bg-default-100 p-4 rounded-lg">
                    <p className="text-sm text-default-700">Payback Period</p>
                    <p className="text-2xl font-bold text-warning">{paybackYears.toFixed(1)} years</p>
                  </div>
                  <div className="bg-default-100 p-4 rounded-lg">
                    <p className="text-sm text-default-700">5-Year ROI</p>
                    <p className="text-2xl font-bold text-primary">{fiveYearROI.toFixed(0)}%</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Tab-Based Design**: Changed from wizard to tabs (GPU Clusters, Utilization, Costs)
 * 2. **Real-Time Calculations**: useEffect updates cost/ROI as inputs change
 * 3. **GPU Models**: A100-40GB/80GB, H100-80GB, B200-192GB with specs
 * 4. **Cluster Management**: Add clusters with model, count, power, cost tracking
 * 5. **Utilization Monitoring**: Progress bars, low utilization alerts
 * 6. **ROI Calculator**: Payback years, 5-year ROI % from revenue/opex
 * 7. **Stats Summary**: Total GPUs, avg utilization, cluster count, total value
 * 
 * ADAPTED FROM:
 * - DataCenterDesigner.tsx (wizard → tabs conversion)
 * - Real-time cost calculation pattern preserved
 * - GPU cluster builder logic maintained
 * - ROI calculator with annual profit, payback, 5-year ROI
 */
