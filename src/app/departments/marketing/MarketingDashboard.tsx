/**
 * @fileoverview Marketing Department Dashboard
 * @module app/departments/marketing/MarketingDashboard
 * 
 * OVERVIEW:
 * Marketing department dashboard for campaign management and brand analytics.
 * Integrates with /api/departments/marketing/campaigns endpoint.
 * 
 * @created 2025-11-22
 * @author ECHO v1.3.0
 */

'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardBody, Button, Tabs, Tab, Input, Select, SelectItem, Chip, Progress } from '@heroui/react';
import { FaChartLine, FaPlus, FaTimes, FaBullseye } from 'react-icons/fa';
import { KPIGrid } from '@/lib/components/departments/KPIGrid';
import type { Department } from '@/lib/types/department';

export interface MarketingDashboardProps {
  department: Department;
  onRefresh: () => Promise<void>;
}

export default function MarketingDashboard({ department, onRefresh }: MarketingDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  // Campaign form
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'brand-awareness' as 'brand-awareness' | 'lead-generation' | 'customer-retention' | 'product-launch',
    budget: '25000',
    durationWeeks: '4',
  });

  /**
   * Create marketing campaign
   */
  const handleCampaignSubmit = async () => {
    try {
      const response = await fetch('/api/departments/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: department.companyId,
          name: campaignForm.name,
          type: campaignForm.type,
          budget: parseFloat(campaignForm.budget),
          durationWeeks: parseInt(campaignForm.durationWeeks),
        }),
      });

      if (!response.ok) throw new Error('Campaign creation failed');
      
      setIsCreatingCampaign(false);
      setCampaignForm({ name: '', type: 'brand-awareness', budget: '25000', durationWeeks: '4' });
      await onRefresh();
    } catch (error) {
      console.error('Campaign creation error:', error);
    }
  };

  const marketingKPIs = [
    { label: 'Brand Value', value: `$${Math.floor((department.brandValue || 0) / 1000)}k`, change: '+8%', trend: 'up' as const, variant: 'success' as const },
    { label: 'Customer Base', value: '5,247', change: '+425', trend: 'up' as const, variant: 'success' as const },
    { label: 'CAC', value: '$125', change: '-$18', trend: 'down' as const, variant: 'success' as const },
    { label: 'CLV', value: '$3,450', change: '+$220', trend: 'up' as const, variant: 'success' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaChartLine size={32} className="text-warning" />
            {department.name}
          </h1>
          <p className="text-default-700">Level {department.level} • {department.budgetPercentage}% Budget Allocation</p>
        </div>
        <Chip color="warning" variant="flat" size="lg">
          Budget: ${(department.budget / 1000).toFixed(0)}k
        </Chip>
      </div>

      {/* KPI Grid */}
      <KPIGrid kpis={department.kpis} showDescriptions columns={5} />

      {/* Tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        variant="underlined"
        color="warning"
      >
        <Tab key="overview" title="Overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Brand Metrics */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold">Brand Performance</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Brand Value</span>
                  <span className="font-bold text-lg">${Math.floor((department.brandValue || 0) / 1000)}k</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Brand Awareness</span>
                  <span className="font-semibold">72%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Brand Loyalty</span>
                  <span className="font-semibold">68%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Net Promoter Score</span>
                  <span className="font-semibold text-success">+42</span>
                </div>
              </CardBody>
            </Card>

            {/* Customer Metrics */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold">Customer Analytics</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Total Customers</span>
                  <span className="font-bold text-lg">5,247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Customer Acquisition Cost</span>
                  <span className="font-semibold">$125</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Customer Lifetime Value</span>
                  <span className="font-semibold text-success">$3,450</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">CLV:CAC Ratio</span>
                  <span className="font-semibold text-success">27.6x</span>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="campaigns" title="Campaigns">
          <div className="mt-6 space-y-4">
            {!isCreatingCampaign ? (
              <Button
                color="warning"
                startContent={<FaBullseye size={16} />}
                onPress={() => setIsCreatingCampaign(true)}
              >
                Launch New Campaign
              </Button>
            ) : (
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Create Marketing Campaign</h3>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => setIsCreatingCampaign(false)}
                  >
                    <FaTimes size={16} />
                  </Button>
                </CardHeader>
                <CardBody className="space-y-4">
                  <Input
                    label="Campaign Name"
                    placeholder="Summer Sale 2025"
                    value={campaignForm.name}
                    onValueChange={(value) => setCampaignForm({ ...campaignForm, name: value })}
                  />
                  <Select
                    label="Campaign Type"
                    selectedKeys={[campaignForm.type]}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as typeof campaignForm.type;
                      setCampaignForm({ ...campaignForm, type: value });
                    }}
                  >
                    <SelectItem key="brand-awareness">Brand Awareness</SelectItem>
                    <SelectItem key="lead-generation">Lead Generation</SelectItem>
                    <SelectItem key="customer-retention">Customer Retention</SelectItem>
                    <SelectItem key="product-launch">Product Launch</SelectItem>
                  </Select>
                  <Input
                    type="number"
                    label="Budget"
                    placeholder="25000"
                    value={campaignForm.budget}
                    onValueChange={(value) => setCampaignForm({ ...campaignForm, budget: value })}
                    startContent={<span className="text-default-400">$</span>}
                  />
                  <Input
                    type="number"
                    label="Duration (Weeks)"
                    placeholder="4"
                    value={campaignForm.durationWeeks}
                    onValueChange={(value) => setCampaignForm({ ...campaignForm, durationWeeks: value })}
                  />
                  <Button color="warning" onPress={handleCampaignSubmit}>
                    Launch Campaign
                  </Button>
                </CardBody>
              </Card>
            )}

            {/* Active Campaigns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(department.campaigns || []).map((campaign: any, index: number) => (
                <Card key={index}>
                  <CardBody>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{campaign.name}</p>
                          <p className="text-sm text-default-700 capitalize">
                            {campaign.type.replace('-', ' ')}
                          </p>
                        </div>
                        <Chip color="warning" size="sm">
                          Active
                        </Chip>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-default-600">Budget</span>
                          <span className="font-semibold">${(campaign.budget / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-default-600">Duration</span>
                          <span className="font-semibold">{campaign.durationWeeks} weeks</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-default-600">Reach</span>
                          <span className="font-semibold">{(campaign.reach || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-default-600">Conversions</span>
                          <span className="font-semibold">{(campaign.conversions || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-default-600">ROI</span>
                          <span className="font-semibold text-success">
                            {campaign.roi ? `+${campaign.roi}%` : 'TBD'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </Tab>

        <Tab key="analytics" title="Analytics">
          <div className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold">Channel Performance</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Social Media</span>
                    <span className="text-sm font-semibold">35% of traffic</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 h-2 bg-default-200 rounded-full overflow-hidden">
                      <div className="h-full bg-warning" style={{ width: '35%' }} />
                    </div>
                    <span className="text-xs text-success">+12%</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Email Marketing</span>
                    <span className="text-sm font-semibold">28% of traffic</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 h-2 bg-default-200 rounded-full overflow-hidden">
                      <div className="h-full bg-warning" style={{ width: '28%' }} />
                    </div>
                    <span className="text-xs text-success">+8%</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Search Ads</span>
                    <span className="text-sm font-semibold">22% of traffic</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 h-2 bg-default-200 rounded-full overflow-hidden">
                      <div className="h-full bg-warning" style={{ width: '22%' }} />
                    </div>
                    <span className="text-xs text-danger">-3%</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Content Marketing</span>
                    <span className="text-sm font-semibold">15% of traffic</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 h-2 bg-default-200 rounded-full overflow-hidden">
                      <div className="h-full bg-warning" style={{ width: '15%' }} />
                    </div>
                    <span className="text-xs text-success">+18%</span>
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
