/**
 * @fileoverview Media Industry Dashboard Component
 * @module components/media/MediaDashboard
 * 
 * OVERVIEW:
 * Main dashboard for media industry companies. Displays KPIs for ads,
 * content, sponsorships, platform reach, and monetization.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Tabs,
  Tab,
  Progress,
  Button,
  Chip,
} from '@heroui/react';
import {
  Megaphone,
  FileVideo,
  Users,
  Handshake,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  BarChart3,
  Share2,
  Play,
  Plus,
} from 'lucide-react';
import { useMediaSummary, type MediaSummary } from '@/lib/hooks/useMedia';

interface MediaDashboardProps {
  companyId: string;
  onNewCampaign?: () => void;
  onNewContent?: () => void;
  onNewSponsorship?: () => void;
  onViewAnalytics?: () => void;
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
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
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
 * Format currency values
 */
function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

/**
 * Format large numbers
 */
function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

export function MediaDashboard({
  companyId,
  onNewCampaign,
  onNewContent,
  onNewSponsorship,
  onViewAnalytics,
}: MediaDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const { data: summary, isLoading, error } = useMediaSummary(companyId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-500">Failed to load media data: {String(error)}</p>
      </Card>
    );
  }

  const data = summary ?? {
    ads: { total: 0, active: 0, totalSpent: 0, totalImpressions: 0, averageRoi: 0 },
    content: { total: 0, published: 0, totalViews: 0, totalRevenue: 0, avgEngagement: 0 },
    influencers: { totalDeals: 0, totalSpent: 0, averageRoi: 0 },
    sponsorships: { total: 0, active: 0, totalValue: 0, averageRoi: 0 },
    platforms: { total: 0, totalFollowers: 0, totalRevenue: 0, avgGrowth: 0 },
    monetization: { totalMonthlyRevenue: 0, subscriberCount: 0, avgRpm: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-3">
        <Button 
          color="primary" 
          startContent={<Megaphone className="h-4 w-4" />}
          onPress={onNewCampaign}
        >
          New Campaign
        </Button>
        <Button 
          color="secondary" 
          variant="flat"
          startContent={<FileVideo className="h-4 w-4" />}
          onPress={onNewContent}
        >
          Create Content
        </Button>
        <Button 
          color="secondary" 
          variant="flat"
          startContent={<Handshake className="h-4 w-4" />}
          onPress={onNewSponsorship}
        >
          New Sponsorship
        </Button>
        <Button 
          color="default" 
          variant="bordered"
          startContent={<BarChart3 className="h-4 w-4" />}
          onPress={onViewAnalytics}
        >
          Analytics
        </Button>
      </div>

      {/* Tabs */}
      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
        color="primary"
      >
        <Tab key="overview" title="Overview" />
        <Tab key="advertising" title="Advertising" />
        <Tab key="content" title="Content" />
        <Tab key="sponsorships" title="Sponsorships" />
      </Tabs>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Followers"
              value={formatNumber(data.platforms.totalFollowers)}
              subtitle={`Across ${data.platforms.total} platforms`}
              icon={Users}
              color="pink"
              trend={{ value: data.platforms.avgGrowth, isPositive: data.platforms.avgGrowth > 0 }}
            />
            <KPICard
              title="Content Views"
              value={formatNumber(data.content.totalViews)}
              subtitle={`${data.content.published} published items`}
              icon={Eye}
              color="blue"
            />
            <KPICard
              title="Monthly Revenue"
              value={formatCurrency(data.monetization.totalMonthlyRevenue)}
              subtitle={`${formatNumber(data.monetization.subscriberCount)} subscribers`}
              icon={DollarSign}
              color="green"
            />
            <KPICard
              title="Active Campaigns"
              value={data.ads.active}
              subtitle={`${formatCurrency(data.ads.totalSpent)} spent`}
              icon={Megaphone}
              color="purple"
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-purple-500" />
                  Advertising
                </h3>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Impressions</span>
                  <span className="font-medium">{formatNumber(data.ads.totalImpressions)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Average ROI</span>
                  <span className="font-medium">{data.ads.averageRoi.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Spent</span>
                  <span className="font-medium">{formatCurrency(data.ads.totalSpent)}</span>
                </div>
              </CardBody>
            </Card>

            <Card className="p-4">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileVideo className="h-5 w-5 text-blue-500" />
                  Content
                </h3>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Items</span>
                  <span className="font-medium">{data.content.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Engagement Rate</span>
                  <span className="font-medium">{data.content.avgEngagement.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Content Revenue</span>
                  <span className="font-medium">{formatCurrency(data.content.totalRevenue)}</span>
                </div>
              </CardBody>
            </Card>

            <Card className="p-4">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-green-500" />
                  Sponsorships
                </h3>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Active Deals</span>
                  <span className="font-medium">{data.sponsorships.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Value</span>
                  <span className="font-medium">{formatCurrency(data.sponsorships.totalValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Average ROI</span>
                  <span className="font-medium">{data.sponsorships.averageRoi.toFixed(1)}%</span>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Monetization Overview */}
          <Card className="p-4">
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Monetization Overview
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Ad Revenue (RPM)</p>
                  <p className="text-xl font-bold">${data.monetization.avgRpm.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subscriber Revenue</p>
                  <p className="text-xl font-bold">{formatCurrency(data.monetization.totalMonthlyRevenue)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Platform Revenue</p>
                  <p className="text-xl font-bold">{formatCurrency(data.platforms.totalRevenue)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Monthly</p>
                  <p className="text-xl font-bold text-green-500">
                    {formatCurrency(
                      data.monetization.totalMonthlyRevenue + 
                      data.platforms.totalRevenue + 
                      data.content.totalRevenue
                    )}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Advertising Tab */}
      {activeTab === 'advertising' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard
              title="Total Campaigns"
              value={data.ads.total}
              icon={Megaphone}
              color="purple"
            />
            <KPICard
              title="Active Campaigns"
              value={data.ads.active}
              icon={Play}
              color="green"
            />
            <KPICard
              title="Total Impressions"
              value={formatNumber(data.ads.totalImpressions)}
              icon={Eye}
              color="blue"
            />
            <KPICard
              title="Total Spent"
              value={formatCurrency(data.ads.totalSpent)}
              icon={DollarSign}
              color="yellow"
            />
          </div>
          <Card className="p-6">
            <p className="text-gray-500 text-center">
              Campaign details will be shown here. Click &quot;New Campaign&quot; to create one.
            </p>
          </Card>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard
              title="Total Content"
              value={data.content.total}
              icon={FileVideo}
              color="blue"
            />
            <KPICard
              title="Published"
              value={data.content.published}
              icon={Share2}
              color="green"
            />
            <KPICard
              title="Total Views"
              value={formatNumber(data.content.totalViews)}
              icon={Eye}
              color="purple"
            />
            <KPICard
              title="Content Revenue"
              value={formatCurrency(data.content.totalRevenue)}
              icon={DollarSign}
              color="green"
            />
          </div>
          <Card className="p-6">
            <p className="text-gray-500 text-center">
              Content library will be shown here. Click &quot;Create Content&quot; to add new items.
            </p>
          </Card>
        </div>
      )}

      {/* Sponsorships Tab */}
      {activeTab === 'sponsorships' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard
              title="Total Deals"
              value={data.sponsorships.total}
              icon={Handshake}
              color="green"
            />
            <KPICard
              title="Active Deals"
              value={data.sponsorships.active}
              icon={TrendingUp}
              color="blue"
            />
            <KPICard
              title="Total Value"
              value={formatCurrency(data.sponsorships.totalValue)}
              icon={DollarSign}
              color="yellow"
            />
            <KPICard
              title="Average ROI"
              value={`${data.sponsorships.averageRoi.toFixed(1)}%`}
              icon={BarChart3}
              color="purple"
            />
          </div>
          <Card className="p-6">
            <p className="text-gray-500 text-center">
              Sponsorship deals will be shown here. Click &quot;New Sponsorship&quot; to create one.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

export default MediaDashboard;
