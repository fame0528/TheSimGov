/**
 * @fileoverview Marketing Department Dashboard Component
 * @module components/departments/MarketingDashboard
 * 
 * OVERVIEW:
 * Displays marketing department KPIs, brand metrics, campaigns, and customer analytics.
 * Provides campaign management and customer acquisition tracking.
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

'use client';

import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Tabs, Tab } from '@heroui/tabs';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { useState } from 'react';
import { formatNumber } from '@/lib/utils/formatting';
import type { MarketingDepartment, MarketingCampaign } from '@/lib/types/department';

interface MarketingDashboardProps {
  department: MarketingDepartment;
  companyId: string;
  onUpdate?: () => void;
}

export default function MarketingDashboard({ department, companyId, onUpdate }: MarketingDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(false);

  // Campaign status colors
  const campaignStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'planned': return 'primary';
      case 'completed': return 'default';
      case 'cancelled': return 'danger';
      default: return 'warning';
    }
  };

  // ROI color based on value
  const roiColor = (roi: number) => {
    if (roi >= 3.0) return 'text-success';
    if (roi >= 1.5) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="space-y-6">
      {/* Department Header */}
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-2xl font-bold">{department.name} Department</h2>
              <p className="text-default-700">Level {department.level} • Budget: ${formatNumber(department.budget)}</p>
            </div>
            <Chip color={department.active ? 'success' : 'default'} variant="flat">
              {department.active ? 'Active' : 'Inactive'}
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-default-700">Efficiency</p>
              <Progress value={department.kpis.efficiency} color="primary" className="mt-2" />
              <p className="text-xs mt-1">{department.kpis.efficiency}%</p>
            </div>
            <div>
              <p className="text-sm text-default-700">Performance</p>
              <Progress value={department.kpis.performance} color="secondary" className="mt-2" />
              <p className="text-xs mt-1">{department.kpis.performance}%</p>
            </div>
            <div>
              <p className="text-sm text-default-700">ROI</p>
              <Progress value={department.kpis.roi} color="success" className="mt-2" />
              <p className="text-xs mt-1">{department.kpis.roi}%</p>
            </div>
            <div>
              <p className="text-sm text-default-700">Utilization</p>
              <Progress value={department.kpis.utilization} color="warning" className="mt-2" />
              <p className="text-xs mt-1">{department.kpis.utilization}%</p>
            </div>
            <div>
              <p className="text-sm text-default-700">Quality</p>
              <Progress value={department.kpis.quality} color="danger" className="mt-2" />
              <p className="text-xs mt-1">{department.kpis.quality}%</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabs for different sections */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        aria-label="Marketing department sections"
        className="w-full"
      >
        {/* Overview Tab */}
        <Tab key="overview" title="Overview">
          <Card>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-default-700">Brand Value</p>
                  <p className="text-2xl font-bold">${formatNumber(department.brandValue || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-default-700">Customer Base</p>
                  <p className="text-2xl font-bold">{(department.customerBase || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-default-700">Market Share</p>
                  <p className="text-2xl font-bold">{(department.marketShare || 0).toFixed(1)}%</p>
                  <Progress value={department.marketShare || 0} color="primary" size="sm" className="mt-2" />
                </div>
                <div>
                  <p className="text-sm text-default-700">Active Campaigns</p>
                  <p className="text-2xl font-bold">{department.campaigns?.filter(c => c.status === 'active').length || 0}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        {/* Campaigns Tab */}
        <Tab key="campaigns" title={`Campaigns (${department.campaigns?.length || 0})`}>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Marketing Campaigns</h3>
              <Button color="primary" size="sm" onPress={() => {/* TODO: Open campaign modal */}}>
                Launch Campaign
              </Button>
            </CardHeader>
            <CardBody>
              {department.campaigns && department.campaigns.length > 0 ? (
                <Table aria-label="Campaigns table">
                  <TableHeader>
                    <TableColumn>CAMPAIGN NAME</TableColumn>
                    <TableColumn>TYPE</TableColumn>
                    <TableColumn>BUDGET</TableColumn>
                    <TableColumn>DURATION</TableColumn>
                    <TableColumn>REACH</TableColumn>
                    <TableColumn>CONVERSIONS</TableColumn>
                    <TableColumn>ROI</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {department.campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>{campaign.name}</TableCell>
                        <TableCell className="capitalize">
                          {campaign.campaignType.replace('-', ' ')}
                        </TableCell>
                        <TableCell>${formatNumber(campaign.budget)}</TableCell>
                        <TableCell>{campaign.duration} days</TableCell>
                        <TableCell>{campaign.reach.toLocaleString()}</TableCell>
                        <TableCell>{campaign.conversions.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={roiColor(campaign.roi)}>
                            {campaign.roi.toFixed(2)}x
                          </span>
                        </TableCell>
                        <TableCell>
                          <Chip color={campaignStatusColor(campaign.status)} variant="flat" size="sm">
                            {campaign.status}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-default-700 py-8">No marketing campaigns</p>
              )}
            </CardBody>
          </Card>
        </Tab>

        {/* Customer Analytics Tab */}
        <Tab key="analytics" title="Customer Analytics">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Customer Acquisition & Lifetime Value</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CAC Card */}
                <div className="p-6 border rounded-lg">
                  <h4 className="text-lg font-semibold mb-4">Customer Acquisition Cost (CAC)</h4>
                  <p className="text-4xl font-bold mb-2">${formatNumber(department.customerAcquisitionCost || 0)}</p>
                  <Chip size="sm" color={
                    (department.customerAcquisitionCost || 0) < 50 ? 'success' :
                    (department.customerAcquisitionCost || 0) < 150 ? 'warning' : 'danger'
                  } variant="flat">
                    {(department.customerAcquisitionCost || 0) < 50 ? 'Excellent' :
                     (department.customerAcquisitionCost || 0) < 150 ? 'Good' : 'High'}
                  </Chip>
                  <p className="text-sm text-default-700 mt-4">
                    Total marketing spend divided by new customers acquired
                  </p>
                </div>

                {/* LTV Card */}
                <div className="p-6 border rounded-lg">
                  <h4 className="text-lg font-semibold mb-4">Customer Lifetime Value (LTV)</h4>
                  <p className="text-4xl font-bold mb-2">${formatNumber(department.customerLifetimeValue || 0)}</p>
                  <Chip size="sm" color={
                    (department.customerLifetimeValue || 0) > 500 ? 'success' :
                    (department.customerLifetimeValue || 0) > 200 ? 'warning' : 'danger'
                  } variant="flat">
                    {(department.customerLifetimeValue || 0) > 500 ? 'Excellent' :
                     (department.customerLifetimeValue || 0) > 200 ? 'Good' : 'Low'}
                  </Chip>
                  <p className="text-sm text-default-700 mt-4">
                    Average revenue generated per customer over their lifetime
                  </p>
                </div>

                {/* LTV:CAC Ratio */}
                <div className="p-6 border rounded-lg md:col-span-2">
                  <h4 className="text-lg font-semibold mb-4">LTV:CAC Ratio</h4>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold">
                      {department.customerAcquisitionCost && department.customerLifetimeValue
                        ? (department.customerLifetimeValue / department.customerAcquisitionCost).toFixed(2)
                        : '0.00'}
                    </p>
                    <p className="text-xl text-default-700">: 1</p>
                  </div>
                  <div className="mt-4">
                    <Progress 
                      value={Math.min(100, ((department.customerLifetimeValue || 0) / (department.customerAcquisitionCost || 1)) * 20)} 
                      color={
                        ((department.customerLifetimeValue || 0) / (department.customerAcquisitionCost || 1)) >= 5 ? 'success' :
                        ((department.customerLifetimeValue || 0) / (department.customerAcquisitionCost || 1)) >= 3 ? 'warning' : 'danger'
                      }
                    />
                  </div>
                  <div className="mt-4 space-y-1 text-sm">
                    <p className="text-default-700">
                      • <span className="text-success">5:1 or higher</span> = Excellent (sustainable growth)
                    </p>
                    <p className="text-default-700">
                      • <span className="text-warning">3:1 to 5:1</span> = Good (healthy business)
                    </p>
                    <p className="text-default-700">
                      • <span className="text-danger">Below 3:1</span> = Poor (unprofitable acquisition)
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Tab Structure**: Overview, Campaigns, Customer Analytics sections
 * 2. **KPI Display**: Progress bars for 5 key metrics
 * 3. **Brand Metrics**: Brand value, customer base, market share (with progress)
 * 4. **Campaigns Table**: Complete campaign tracking with ROI color-coding
 * 5. **Customer Analytics**: CAC and LTV cards with quality ratings
 * 6. **LTV:CAC Ratio**: Visual ratio display with interpretation guide
 * 7. **Action Buttons**: Launch Campaign (placeholder modal)
 * 8. **Responsive Grid**: Mobile-friendly layouts
 * 
 * USAGE:
 * ```tsx
 * <MarketingDashboard 
 *   department={marketingData} 
 *   companyId={company.id}
 *   onUpdate={() => refetch()}
 * />
 * ```
 */
