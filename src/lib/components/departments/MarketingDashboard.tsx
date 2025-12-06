/**
 * @fileoverview Marketing Department Dashboard Component
 * @module lib/components/departments/MarketingDashboard
 * 
 * OVERVIEW:
 * Complete Marketing department view with campaigns, brand metrics, customer analytics.
 * Reuses KPIGrid, DataTable, shared components.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Tabs, Tab } from '@heroui/tabs';
import { Progress } from '@heroui/progress';
import { KPIGrid } from './KPIGrid';
import { DataTable, Column } from '../shared/DataTable';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import type { MarketingDepartment, MarketingCampaign } from '@/lib/types/department';

// Props interface added to resolve missing MarketingDashboardProps type export
export interface MarketingDashboardProps {
  department: MarketingDepartment;
  onLaunchCampaign?: () => void;
  onRefresh?: () => void;
}

export function MarketingDashboard({
  department,
  onLaunchCampaign,
  onRefresh,
}: MarketingDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const campaignColumns: Column<MarketingCampaign>[] = [
    { header: 'Campaign', accessor: 'name' },
    { header: 'Type', accessor: (c) => <Chip size="sm" variant="flat">{c.campaignType}</Chip> },
    { header: 'Budget', accessor: (c) => formatCurrency(c.budget) },
    { header: 'Reach', accessor: (c) => formatNumber(c.reach) },
    { header: 'Conversions', accessor: (c) => formatNumber(c.conversions) },
    { header: 'ROI', accessor: (c) => (
      <span className={c.roi >= 0 ? 'text-success font-semibold' : 'text-danger font-semibold'}>
        {c.roi >= 0 ? '+' : ''}{c.roi.toFixed(1)}%
      </span>
    )},
    { header: 'Status', accessor: (c) => (
      <Chip size="sm" color={c.status === 'active' ? 'success' : c.status === 'completed' ? 'primary' : 'default'}>
        {c.status}
      </Chip>
    )},
    { header: 'End Date', accessor: (c) => formatDate(c.endDate) },
  ];

  const activeCampaigns = department.campaigns?.filter(c => c.status === 'active') || [];
  const completedCampaigns = department.campaigns?.filter(c => c.status === 'completed') || [];
  const avgROI = completedCampaigns.length > 0 ? 
                 completedCampaigns.reduce((sum, c) => sum + c.roi, 0) / completedCampaigns.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">📢 Marketing Department</h2>
          <p className="text-default-700">Level {department.level} • {formatCurrency(department.budget)} Budget</p>
        </div>
        {onRefresh && <Button size="sm" variant="flat" onPress={onRefresh}>Refresh</Button>}
      </div>

      {/* KPIs */}
      <KPIGrid kpis={department.kpis} showDescriptions columns={5} />

      {/* Marketing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-default-700">Brand Value</p>
            <p className="text-2xl font-bold">{formatCurrency(department.brandValue || 0)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-700">Customer Base</p>
            <p className="text-2xl font-bold">{formatNumber(department.customerBase || 0)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-700">Market Share</p>
            <p className="text-2xl font-bold">
              <Chip color={(department.marketShare || 0) >= 20 ? 'success' : (department.marketShare || 0) >= 10 ? 'warning' : 'default'}>
                {(department.marketShare || 0).toFixed(1)}%
              </Chip>
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-700">Avg Campaign ROI</p>
            <p className="text-2xl font-bold">
              <span className={avgROI >= 0 ? 'text-success' : 'text-danger'}>
                {avgROI >= 0 ? '+' : ''}{avgROI.toFixed(1)}%
              </span>
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Customer Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Customer Acquisition</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex justify-between">
              <span className="text-default-700">CAC (Cost per Acquisition)</span>
              <span className="font-semibold">{formatCurrency(department.customerAcquisitionCost || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-700">LTV (Lifetime Value)</span>
              <span className="font-semibold">{formatCurrency(department.customerLifetimeValue || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-700">LTV:CAC Ratio</span>
              <span className={`font-semibold ${(department.customerLifetimeValue || 0) / Math.max(1, department.customerAcquisitionCost || 1) >= 3 ? 'text-success' : 'text-warning'}`}>
                {((department.customerLifetimeValue || 0) / Math.max(1, department.customerAcquisitionCost || 1)).toFixed(2)}:1
              </span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex justify-between">
            <h3 className="text-lg font-semibold">Active Campaigns</h3>
            <Chip size="sm">{activeCampaigns.length}</Chip>
          </CardHeader>
          <CardBody>
            {activeCampaigns.slice(0, 3).map(campaign => (
              <div key={campaign.id} className="flex justify-between items-center py-2 border-b border-divider last:border-0">
                <div>
                  <p className="font-medium">{campaign.name}</p>
                  <p className="text-xs text-default-700">{campaign.campaignType}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatNumber(campaign.reach)}</p>
                  <p className="text-xs text-default-700">reach</p>
                </div>
              </div>
            ))}
            {activeCampaigns.length === 0 && (
              <p className="text-sm text-default-400">No active campaigns</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="campaigns" title={`Campaigns (${department.campaigns?.length || 0})`}>
          <div className="mt-4 space-y-4">
            {onLaunchCampaign && (
              <Button color="primary" onPress={onLaunchCampaign}>
                Launch New Campaign
              </Button>
            )}
            <DataTable
              data={department.campaigns || []}
              columns={campaignColumns}
              emptyMessage="No campaigns yet. Launch your first marketing campaign!"
            />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
