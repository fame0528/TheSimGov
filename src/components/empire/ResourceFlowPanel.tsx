/**
 * @fileoverview Resource Flow Panel Component
 * @module components/empire/ResourceFlowPanel
 * 
 * OVERVIEW:
 * Visualizes resource flows between companies in the empire.
 * Shows how production, money, and influence move through the business web.
 * 
 * CORE CONCEPT:
 * Animated flow lines show real-time resource movement.
 * Players can see bottlenecks and optimize their empire structure.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Chip,
  Progress,
  Divider,
  Tooltip,
  Tabs,
  Tab,
} from '@heroui/react';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Factory,
  Zap,
  TrendingUp,
  Building2,
  Truck,
  Package,
  Wallet,
  Users,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import { EmpireIndustry } from '@/lib/types/empire';

// ============================================================================
// Types
// ============================================================================

type ResourceType = 'money' | 'production' | 'influence' | 'materials';

interface ResourceFlow {
  id: string;
  from: string;
  fromIndustry: EmpireIndustry;
  to: string;
  toIndustry: EmpireIndustry;
  resourceType: ResourceType;
  amount: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  efficiency: number;
}

interface FlowSummary {
  type: ResourceType;
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  unit: string;
}

interface BottleneckAlert {
  id: string;
  source: string;
  message: string;
  severity: 'warning' | 'critical';
  potentialLoss: number;
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_FLOWS: ResourceFlow[] = [
  {
    id: '1',
    from: 'TechBank Financial',
    fromIndustry: EmpireIndustry.BANKING,
    to: 'AutoTech Manufacturing',
    toIndustry: EmpireIndustry.MANUFACTURING,
    resourceType: 'money',
    amount: 125000,
    unit: '$/mo',
    trend: 'up',
    trendPercent: 8,
    efficiency: 92,
  },
  {
    id: '2',
    from: 'AutoTech Manufacturing',
    fromIndustry: EmpireIndustry.MANUFACTURING,
    to: 'Urban Supply Logistics',
    toIndustry: EmpireIndustry.LOGISTICS,
    resourceType: 'production',
    amount: 450,
    unit: 'units/mo',
    trend: 'stable',
    trendPercent: 0,
    efficiency: 88,
  },
  {
    id: '3',
    from: 'Urban Supply Logistics',
    fromIndustry: EmpireIndustry.LOGISTICS,
    to: 'CityMart Retail',
    toIndustry: EmpireIndustry.RETAIL,
    resourceType: 'materials',
    amount: 380,
    unit: 'units/mo',
    trend: 'up',
    trendPercent: 12,
    efficiency: 95,
  },
  {
    id: '4',
    from: 'CityMart Retail',
    fromIndustry: EmpireIndustry.RETAIL,
    to: 'TechBank Financial',
    toIndustry: EmpireIndustry.BANKING,
    resourceType: 'money',
    amount: 280000,
    unit: '$/mo',
    trend: 'up',
    trendPercent: 5,
    efficiency: 97,
  },
  {
    id: '5',
    from: 'Digital News Network',
    fromIndustry: EmpireIndustry.MEDIA,
    to: 'Empire Industries HQ',
    toIndustry: EmpireIndustry.POLITICS,
    resourceType: 'influence',
    amount: 15000,
    unit: 'pts/mo',
    trend: 'down',
    trendPercent: 3,
    efficiency: 78,
  },
  {
    id: '6',
    from: 'MediCare Plus',
    fromIndustry: EmpireIndustry.HEALTHCARE,
    to: 'AutoTech Manufacturing',
    toIndustry: EmpireIndustry.MANUFACTURING,
    resourceType: 'production',
    amount: 120,
    unit: 'units/mo',
    trend: 'up',
    trendPercent: 15,
    efficiency: 84,
  },
];

const MOCK_BOTTLENECKS: BottleneckAlert[] = [
  {
    id: '1',
    source: 'Urban Supply Logistics',
    message: 'Logistics capacity at 92% - may cause delays',
    severity: 'warning',
    potentialLoss: 45000,
  },
  {
    id: '2',
    source: 'Digital News Network',
    message: 'Influence output declining - audience engagement down',
    severity: 'critical',
    potentialLoss: 125000,
  },
];

// ============================================================================
// Helpers
// ============================================================================

function formatAmount(amount: number, type: ResourceType): string {
  if (type === 'money') {
    if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(2)}M`;
    }
    if (amount >= 1_000) {
      return `$${(amount / 1_000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toLocaleString();
}

function getResourceIcon(type: ResourceType) {
  switch (type) {
    case 'money': return DollarSign;
    case 'production': return Factory;
    case 'influence': return Users;
    case 'materials': return Package;
    default: return Zap;
  }
}

function getResourceColor(type: ResourceType): 'success' | 'primary' | 'secondary' | 'warning' {
  switch (type) {
    case 'money': return 'success';
    case 'production': return 'primary';
    case 'influence': return 'secondary';
    case 'materials': return 'warning';
    default: return 'primary';
  }
}

function getTrendIcon(trend: 'up' | 'down' | 'stable') {
  switch (trend) {
    case 'up': return ArrowUpRight;
    case 'down': return ArrowDownRight;
    default: return ArrowRight;
  }
}

function formatIndustry(industry: EmpireIndustry): string {
  return industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ============================================================================
// Flow Card Component
// ============================================================================

interface FlowCardProps {
  flow: ResourceFlow;
}

function FlowCard({ flow }: FlowCardProps) {
  const ResourceIcon = getResourceIcon(flow.resourceType);
  const TrendIcon = getTrendIcon(flow.trend);
  const color = getResourceColor(flow.resourceType);

  return (
    <Card className="bg-slate-800/50 border border-slate-700">
      <CardBody className="p-4">
        {/* Flow Direction */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <p className="font-medium text-white text-sm">{flow.from}</p>
            <p className="text-xs text-gray-500">{formatIndustry(flow.fromIndustry)}</p>
          </div>
          <div className="px-4">
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1 text-right">
            <p className="font-medium text-white text-sm">{flow.to}</p>
            <p className="text-xs text-gray-500">{formatIndustry(flow.toIndustry)}</p>
          </div>
        </div>

        <Divider className="my-3" />

        {/* Resource Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${
              color === 'success' ? 'bg-green-500/20' :
              color === 'primary' ? 'bg-blue-500/20' :
              color === 'secondary' ? 'bg-purple-500/20' :
              'bg-amber-500/20'
            }`}>
              <ResourceIcon className={`w-4 h-4 ${
                color === 'success' ? 'text-green-400' :
                color === 'primary' ? 'text-blue-400' :
                color === 'secondary' ? 'text-purple-400' :
                'text-amber-400'
              }`} />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{formatAmount(flow.amount, flow.resourceType)}</p>
              <p className="text-xs text-gray-500">{flow.unit}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Trend */}
            <div className="text-right">
              <div className={`flex items-center gap-1 ${
                flow.trend === 'up' ? 'text-green-400' :
                flow.trend === 'down' ? 'text-red-400' :
                'text-gray-400'
              }`}>
                <TrendIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {flow.trendPercent > 0 ? '+' : ''}{flow.trendPercent}%
                </span>
              </div>
              <p className="text-xs text-gray-500">Trend</p>
            </div>

            {/* Efficiency */}
            <Tooltip content={`${flow.efficiency}% efficiency`}>
              <div>
                <Progress
                  value={flow.efficiency}
                  size="sm"
                  color={flow.efficiency >= 90 ? 'success' : flow.efficiency >= 75 ? 'warning' : 'danger'}
                  className="w-16"
                />
                <p className="text-xs text-gray-500 text-center mt-1">{flow.efficiency}%</p>
              </div>
            </Tooltip>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Summary Card Component
// ============================================================================

interface SummaryCardProps {
  summary: FlowSummary;
}

function SummaryCard({ summary }: SummaryCardProps) {
  const ResourceIcon = getResourceIcon(summary.type);
  const color = getResourceColor(summary.type);
  const isPositive = summary.netFlow >= 0;

  return (
    <Card className={`border ${
      color === 'success' ? 'bg-green-900/20 border-green-500/30' :
      color === 'primary' ? 'bg-blue-900/20 border-blue-500/30' :
      color === 'secondary' ? 'bg-purple-900/20 border-purple-500/30' :
      'bg-amber-900/20 border-amber-500/30'
    }`}>
      <CardBody className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <ResourceIcon className={`w-5 h-5 ${
            color === 'success' ? 'text-green-400' :
            color === 'primary' ? 'text-blue-400' :
            color === 'secondary' ? 'text-purple-400' :
            'text-amber-400'
          }`} />
          <span className="font-semibold text-white capitalize">{summary.type}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-green-400">+{formatAmount(summary.totalInflow, summary.type)}</p>
            <p className="text-xs text-gray-500">Inflow</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-400">-{formatAmount(summary.totalOutflow, summary.type)}</p>
            <p className="text-xs text-gray-500">Outflow</p>
          </div>
          <div>
            <p className={`text-lg font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{formatAmount(Math.abs(summary.netFlow), summary.type)}
            </p>
            <p className="text-xs text-gray-500">Net</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Bottleneck Alert Component
// ============================================================================

interface BottleneckAlertCardProps {
  alert: BottleneckAlert;
  onDismiss: () => void;
}

function BottleneckAlertCard({ alert }: BottleneckAlertCardProps) {
  const isCritical = alert.severity === 'critical';

  return (
    <Card className={`border ${isCritical ? 'bg-red-900/20 border-red-500/30' : 'bg-amber-900/20 border-amber-500/30'}`}>
      <CardBody className="p-4 flex items-center gap-4">
        <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
          <AlertTriangle className={`w-5 h-5 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white">{alert.source}</span>
            <Chip 
              size="sm" 
              color={isCritical ? 'danger' : 'warning'}
              variant="flat"
            >
              {alert.severity}
            </Chip>
          </div>
          <p className="text-sm text-gray-400">{alert.message}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
            -{formatAmount(alert.potentialLoss, 'money')}
          </p>
          <p className="text-xs text-gray-500">Potential loss/mo</p>
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ResourceFlowPanel(): React.ReactElement {
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all');
  const [flows] = useState<ResourceFlow[]>(MOCK_FLOWS);
  const [bottlenecks] = useState<BottleneckAlert[]>(MOCK_BOTTLENECKS);

  // Calculate summaries
  const summaries = useMemo((): FlowSummary[] => {
    const types: ResourceType[] = ['money', 'production', 'influence', 'materials'];
    return types.map(type => {
      const typeFlows = flows.filter(f => f.resourceType === type);
      const totalInflow = typeFlows.reduce((sum, f) => sum + f.amount, 0);
      const totalOutflow = typeFlows.reduce((sum, f) => sum + f.amount, 0);
      return {
        type,
        totalInflow,
        totalOutflow,
        netFlow: totalInflow - totalOutflow * 0.1, // Simulated net
        unit: type === 'money' ? '$/mo' : 'units/mo',
      };
    });
  }, [flows]);

  // Filter flows
  const filteredFlows = useMemo(() => {
    if (selectedType === 'all') return flows;
    return flows.filter(f => f.resourceType === selectedType);
  }, [flows, selectedType]);

  // Total efficiency
  const avgEfficiency = useMemo(() => {
    if (flows.length === 0) return 0;
    return Math.round(flows.reduce((sum, f) => sum + f.efficiency, 0) / flows.length);
  }, [flows]);

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <Card className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border border-slate-700">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Truck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Resource Flows</h2>
              <p className="text-sm text-gray-400">Track resources moving through your empire</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{flows.length}</p>
              <p className="text-xs text-gray-500">Active Flows</p>
            </div>
            <Divider orientation="vertical" className="h-10" />
            <div className="text-center">
              <p className={`text-2xl font-bold ${avgEfficiency >= 85 ? 'text-green-400' : 'text-amber-400'}`}>
                {avgEfficiency}%
              </p>
              <p className="text-xs text-gray-500">Avg Efficiency</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {/* Resource Type Summaries */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaries.map((summary) => (
              <SummaryCard key={summary.type} summary={summary} />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Bottleneck Alerts */}
      {bottlenecks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Flow Bottlenecks
          </h3>
          <div className="space-y-3">
            {bottlenecks.map((alert) => (
              <BottleneckAlertCard 
                key={alert.id} 
                alert={alert}
                onDismiss={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Flow Details */}
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardBody className="p-4">
          {/* Filter Tabs */}
          <Tabs
            selectedKey={selectedType}
            onSelectionChange={(key) => setSelectedType(key as ResourceType | 'all')}
            aria-label="Resource type filter"
            className="mb-4"
          >
            <Tab key="all" title="All Flows" />
            <Tab key="money" title={<div className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Money</div>} />
            <Tab key="production" title={<div className="flex items-center gap-2"><Factory className="w-4 h-4" /> Production</div>} />
            <Tab key="influence" title={<div className="flex items-center gap-2"><Users className="w-4 h-4" /> Influence</div>} />
            <Tab key="materials" title={<div className="flex items-center gap-2"><Package className="w-4 h-4" /> Materials</div>} />
          </Tabs>

          {/* Flow List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredFlows.map((flow) => (
              <FlowCard key={flow.id} flow={flow} />
            ))}
          </div>

          {filteredFlows.length === 0 && (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">No Flows</h4>
              <p className="text-gray-400">No resource flows match the selected filter.</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default ResourceFlowPanel;
