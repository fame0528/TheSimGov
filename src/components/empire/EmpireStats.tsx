/**
 * @fileoverview Empire Statistics Component
 * @module components/empire/EmpireStats
 * 
 * OVERVIEW:
 * Displays aggregate statistics for the player's empire:
 * - Total value and growth rate
 * - Industry distribution
 * - Revenue breakdown
 * - Performance metrics
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Progress,
  Chip,
  Divider,
} from '@heroui/react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Briefcase,
  Building2,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface IndustryDistribution {
  industry: string;
  companies: number;
  value: number;
  percentage: number;
  color: string;
}

interface EmpireMetrics {
  totalValue: number;
  monthlyRevenue: number;
  growthRate: number;
  profitMargin: number;
  companyCount: number;
  employeeCount: number;
  industryDistribution: IndustryDistribution[];
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_METRICS: EmpireMetrics = {
  totalValue: 12_500_000,
  monthlyRevenue: 850_000,
  growthRate: 12.5,
  profitMargin: 24.3,
  companyCount: 6,
  employeeCount: 234,
  industryDistribution: [
    { industry: 'Technology', companies: 2, value: 5_500_000, percentage: 44, color: '#3B82F6' },
    { industry: 'Real Estate', companies: 1, value: 3_200_000, percentage: 26, color: '#F59E0B' },
    { industry: 'Banking', companies: 1, value: 2_500_000, percentage: 20, color: '#10B981' },
    { industry: 'Energy', companies: 2, value: 1_300_000, percentage: 10, color: '#FBBF24' },
  ],
};

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
}

function StatCard({ title, value, icon, trend, subtitle }: StatCardProps) {
  return (
    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 rounded-lg bg-white/5">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {trend.isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-gray-500">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

// ============================================================================
// Industry Bar Component
// ============================================================================

interface IndustryBarProps {
  distribution: IndustryDistribution;
}

function IndustryBar({ distribution }: IndustryBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: distribution.color }}
          />
          <span className="text-sm text-gray-300">{distribution.industry}</span>
          <Chip size="sm" variant="flat" className="text-xs">
            {distribution.companies} co.
          </Chip>
        </div>
        <span className="text-sm font-medium text-white">
          {formatCurrency(distribution.value)}
        </span>
      </div>
      <Progress
        value={distribution.percentage}
        size="sm"
        className="h-2"
        classNames={{
          indicator: 'bg-gradient-to-r from-current to-current/70',
        }}
        style={{ '--progress-color': distribution.color } as React.CSSProperties}
      />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EmpireStats(): React.ReactElement {
  const metrics = MOCK_METRICS;

  return (
    <div className="space-y-4">
      {/* Financial Stats */}
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardHeader className="border-b border-slate-700 py-3 px-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Financial Overview</h3>
          </div>
        </CardHeader>
        <CardBody className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title="Total Value"
              value={formatCurrency(metrics.totalValue)}
              icon={<DollarSign className="w-4 h-4 text-green-400" />}
              trend={{ value: metrics.growthRate, isPositive: true }}
            />
            <StatCard
              title="Monthly Revenue"
              value={formatCurrency(metrics.monthlyRevenue)}
              icon={<TrendingUp className="w-4 h-4 text-blue-400" />}
              trend={{ value: 8.2, isPositive: true }}
            />
            <StatCard
              title="Profit Margin"
              value={`${metrics.profitMargin}%`}
              icon={<PieChart className="w-4 h-4 text-purple-400" />}
              trend={{ value: 2.1, isPositive: true }}
            />
            <StatCard
              title="Employees"
              value={metrics.employeeCount.toString()}
              icon={<Briefcase className="w-4 h-4 text-amber-400" />}
              subtitle="Across all companies"
            />
          </div>
        </CardBody>
      </Card>

      {/* Industry Distribution */}
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardHeader className="border-b border-slate-700 py-3 px-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Industry Distribution</h3>
            </div>
            <Chip size="sm" variant="flat" color="secondary">
              {metrics.industryDistribution.length} sectors
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="p-4 space-y-4">
          {/* Visual Distribution */}
          <div className="flex h-4 rounded-full overflow-hidden bg-slate-900">
            {metrics.industryDistribution.map((dist) => (
              <div
                key={dist.industry}
                className="h-full transition-all hover:opacity-80"
                style={{
                  width: `${dist.percentage}%`,
                  backgroundColor: dist.color,
                }}
              />
            ))}
          </div>

          <Divider className="bg-slate-700" />

          {/* Detailed Breakdown */}
          <div className="space-y-4">
            {metrics.industryDistribution.map((dist) => (
              <IndustryBar key={dist.industry} distribution={dist} />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Performance Indicators */}
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardHeader className="border-b border-slate-700 py-3 px-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-semibold text-white">Performance</h3>
          </div>
        </CardHeader>
        <CardBody className="p-4">
          <div className="space-y-4">
            {/* ROI */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Return on Investment</span>
                <span className="text-sm font-bold text-green-400">18.5%</span>
              </div>
              <Progress
                value={74}
                color="success"
                size="sm"
                classNames={{
                  track: 'bg-slate-900',
                }}
              />
            </div>

            {/* Synergy Efficiency */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Synergy Efficiency</span>
                <span className="text-sm font-bold text-purple-400">85%</span>
              </div>
              <Progress
                value={85}
                color="secondary"
                size="sm"
                classNames={{
                  track: 'bg-slate-900',
                }}
              />
            </div>

            {/* Market Dominance */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Market Dominance</span>
                <span className="text-sm font-bold text-blue-400">42%</span>
              </div>
              <Progress
                value={42}
                color="primary"
                size="sm"
                classNames={{
                  track: 'bg-slate-900',
                }}
              />
            </div>

            {/* Growth Potential */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Growth Potential</span>
                <span className="text-sm font-bold text-amber-400">67%</span>
              </div>
              <Progress
                value={67}
                color="warning"
                size="sm"
                classNames={{
                  track: 'bg-slate-900',
                }}
              />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default EmpireStats;
