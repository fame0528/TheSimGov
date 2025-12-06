/**
 * @fileoverview Treasury Bar Component
 * @module components/coreLoop/TreasuryBar
 *
 * OVERVIEW:
 * Displays the player's current treasury balance with real-time updates.
 * Shows cash available for investments, expenses, and operations.
 * Provides visual feedback on financial health.
 *
 * @created 2025-12-06
 * @author ECHO v1.3.3
 */

'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Chip,
  Progress,
} from '@heroui/react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { RevenueTicker } from './RevenueTicker';

// ============================================================================
// Types
// ============================================================================

interface TreasuryMetrics {
  cash: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netCashFlow: number;
  cashFlowTrend: 'positive' | 'negative' | 'neutral';
}

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

function getCashFlowColor(trend: 'positive' | 'negative' | 'neutral'): string {
  switch (trend) {
    case 'positive':
      return 'text-green-400';
    case 'negative':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

function getCashFlowIcon(trend: 'positive' | 'negative' | 'neutral') {
  switch (trend) {
    case 'positive':
      return <TrendingUp className="w-4 h-4" />;
    case 'negative':
      return <TrendingDown className="w-4 h-4" />;
    default:
      return <DollarSign className="w-4 h-4" />;
  }
}

function getFinancialHealth(cash: number, netCashFlow: number): {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  color: string;
  icon: React.ReactNode;
} {
  // Critical: Negative cash flow and low balance
  if (netCashFlow < 0 && cash < 10000) {
    return {
      status: 'critical',
      message: 'Critical: Negative cash flow',
      color: 'text-red-400',
      icon: <AlertTriangle className="w-4 h-4" />,
    };
  }

  // Warning: Low balance or negative cash flow
  if (cash < 50000 || netCashFlow < 0) {
    return {
      status: 'warning',
      message: netCashFlow < 0 ? 'Warning: Negative cash flow' : 'Low balance',
      color: 'text-amber-400',
      icon: <AlertTriangle className="w-4 h-4" />,
    };
  }

  // Healthy: Good balance and positive cash flow
  return {
    status: 'healthy',
    message: 'Healthy financial position',
    color: 'text-green-400',
    icon: <CheckCircle className="w-4 h-4" />,
  };
}

// ============================================================================
// Main Component
// ============================================================================

export function TreasuryBar(): React.ReactElement {
  const { company, isLoading, error } = useCompany();

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardBody className="p-4">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-700 rounded mb-2"></div>
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error || !company) {
    return (
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardBody className="p-4">
          <div className="text-red-400 text-sm">
            Unable to load treasury data
          </div>
        </CardBody>
      </Card>
    );
  }

  // Calculate treasury metrics
  const metrics: TreasuryMetrics = {
    cash: company.cash,
    monthlyRevenue: company.monthlyRevenue || 0,
    monthlyExpenses: company.expenses, // Using current expenses as monthly estimate
    netCashFlow: (company.monthlyRevenue || 0) - company.expenses,
    cashFlowTrend: (company.monthlyRevenue || 0) > company.expenses ? 'positive' :
                   (company.monthlyRevenue || 0) < company.expenses ? 'negative' : 'neutral',
  };

  const health = getFinancialHealth(metrics.cash, metrics.netCashFlow);

  return (
    <Card className="bg-slate-800/50 border border-slate-700">
      <CardHeader className="border-b border-slate-700 py-3 px-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-semibold text-white">Treasury</h3>
          </div>
          <Chip
            size="sm"
            variant="flat"
            className={`${health.color} bg-current/10`}
            startContent={health.icon}
          >
            {health.status}
          </Chip>
        </div>
      </CardHeader>
      <CardBody className="p-4 space-y-4">
        {/* Revenue Ticker - Animated Balance */}
        <RevenueTicker showRate={true} size="sm" />

        {/* Cash Flow Indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className={`flex items-center gap-1 ${getCashFlowColor(metrics.cashFlowTrend)}`}>
            {getCashFlowIcon(metrics.cashFlowTrend)}
            <span className="text-sm font-medium">
              {formatCurrency(Math.abs(metrics.netCashFlow))}/mo
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {metrics.cashFlowTrend === 'positive' ? 'net inflow' :
             metrics.cashFlowTrend === 'negative' ? 'net outflow' : 'balanced'}
          </span>
        </div>

        {/* Financial Health Message */}
        <div className={`text-center text-xs ${health.color}`}>
          {health.message}
        </div>

        {/* Cash Reserve Indicator */}
        {metrics.cash < 100000 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Cash Reserve</span>
              <span className="text-white">
                {((metrics.cash / 100000) * 100).toFixed(0)}%
              </span>
            </div>
            <Progress
              value={(metrics.cash / 100000) * 100}
              size="sm"
              color={metrics.cash < 25000 ? "danger" : metrics.cash < 50000 ? "warning" : "success"}
              classNames={{
                track: 'bg-slate-900',
              }}
            />
            <div className="text-xs text-gray-400 text-center">
              Target: $100K emergency fund
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default TreasuryBar;