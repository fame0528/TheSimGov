'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InfrastructureManager, GPUCluster } from '@/lib/components/ai/InfrastructureManager';

// NOTE: Phase 2 Infrastructure Page
// Mounts InfrastructureManager with sample GPU clusters and creation handler.
// Real implementation would fetch from backend infrastructure management endpoints.

export default function AIInfrastructurePage() {
  const router = useRouter();

  // Sample GPU clusters for demonstration
  const [clusters, setClusters] = useState<GPUCluster[]>([
    {
      id: 'cluster-1',
      name: 'Production Training Cluster',
      model: 'H100-80GB',
      count: 16,
      utilization: 82.5,
      powerPerGPU: 700,
      costPerGPU: 30000,
      totalPower: 11200,
      totalCost: 480000,
    },
    {
      id: 'cluster-2',
      name: 'Development Cluster',
      model: 'A100-80GB',
      count: 8,
      utilization: 45.2,
      powerPerGPU: 400,
      costPerGPU: 15000,
      totalPower: 3200,
      totalCost: 120000,
    },
    {
      id: 'cluster-3',
      name: 'Inference Cluster',
      model: 'A100-40GB',
      count: 12,
      utilization: 68.9,
      powerPerGPU: 400,
      costPerGPU: 10000,
      totalPower: 4800,
      totalCost: 120000,
    },
  ]);

  const handleCreateCluster = async (cluster: Partial<GPUCluster>) => {
    // Placeholder: Real implementation would POST to backend infrastructure endpoint
    const newCluster: GPUCluster = {
      id: `cluster-${Date.now()}`,
      name: cluster.name || 'New Cluster',
      model: cluster.model || 'A100-40GB',
      count: cluster.count || 8,
      utilization: 0,
      powerPerGPU: cluster.powerPerGPU || 400,
      costPerGPU: cluster.costPerGPU || 10000,
      totalPower: cluster.totalPower || 0,
      totalCost: cluster.totalCost || 0,
    };
    setClusters([...clusters, newCluster]);
  };

  return (
    <div className="p-6">
      <InfrastructureManager
        companyId="demo-company"
        clusters={clusters}
        onCreateCluster={handleCreateCluster}
      />
    </div>
  );
}
