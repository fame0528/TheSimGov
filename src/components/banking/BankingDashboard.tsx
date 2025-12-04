/**
 * @fileoverview Banking Industry Dashboard Component
 * @module components/banking/BankingDashboard
 * 
 * OVERVIEW:
 * Main dashboard for banking/finance industry companies. Displays KPIs for
 * loans, credit scores, investments, and payment processing.
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
  Building2,
  CreditCard,
  TrendingUp,
  DollarSign,
  PiggyBank,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  BarChart3,
  FileText,
  Plus,
} from 'lucide-react';
import { useBanks, useLoans, useCreditScore } from '@/lib/hooks/useBanking';

interface BankingDashboardProps {
  companyId: string;
  onApplyLoan?: () => void;
  onMakePayment?: () => void;
  onViewInvestments?: () => void;
  onViewTransactions?: () => void;
}

/**
 * KPI Card component for summary metrics
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
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'emerald';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  };

  return (
    <Card className="p-4">
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
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
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
 * Get credit score color
 */
function getCreditScoreColor(score: number): 'red' | 'yellow' | 'green' | 'emerald' {
  if (score >= 750) return 'emerald';
  if (score >= 650) return 'green';
  if (score >= 550) return 'yellow';
  return 'red';
}

/**
 * Get credit score label
 */
function getCreditScoreLabel(score: number): string {
  if (score >= 750) return 'Excellent';
  if (score >= 650) return 'Good';
  if (score >= 550) return 'Fair';
  return 'Poor';
}

export function BankingDashboard({
  companyId,
  onApplyLoan,
  onMakePayment,
  onViewInvestments,
  onViewTransactions,
}: BankingDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  const { data: banks, isLoading: banksLoading } = useBanks();
  const { data: loans, isLoading: loansLoading } = useLoans(companyId);
  const { data: creditScore, isLoading: creditLoading } = useCreditScore(companyId);

  const isLoading = banksLoading || loansLoading || creditLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  // Extract arrays safely - handle both array and envelope responses
  const extractArray = <T,>(data: unknown): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
      return (data as { data: T[] }).data;
    }
    return [];
  };

  const banksArray = extractArray<Record<string, unknown>>(banks);
  const loansArray = extractArray<Record<string, unknown>>(loans);
  const creditData = creditScore as { score?: number; rating?: string } | undefined;
  const score = creditData?.score ?? 650;

  // Calculate loan metrics
  const totalLoans = loansArray.length;
  const activeLoans = loansArray.filter((l) => l.status === 'active').length;
  const totalDebt = loansArray.reduce((sum: number, l) => 
    sum + (Number(l.remainingBalance) || 0), 0);
  const monthlyPayments = loansArray.reduce((sum: number, l) => 
    l.status === 'active' ? sum + (Number(l.monthlyPayment) || 0) : sum, 0);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-3">
        <Button 
          color="primary" 
          startContent={<Plus className="h-4 w-4" />}
          onPress={onApplyLoan}
        >
          Apply for Loan
        </Button>
        <Button 
          color="secondary" 
          variant="flat"
          startContent={<CreditCard className="h-4 w-4" />}
          onPress={onMakePayment}
        >
          Make Payment
        </Button>
        <Button 
          color="secondary" 
          variant="flat"
          startContent={<TrendingUp className="h-4 w-4" />}
          onPress={onViewInvestments}
        >
          Investments
        </Button>
        <Button 
          color="default" 
          variant="bordered"
          startContent={<FileText className="h-4 w-4" />}
          onPress={onViewTransactions}
        >
          Transactions
        </Button>
      </div>

      {/* Tabs */}
      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
        color="primary"
      >
        <Tab key="overview" title="Overview" />
        <Tab key="loans" title="Loans" />
        <Tab key="credit" title="Credit" />
        <Tab key="banks" title="Banks" />
      </Tabs>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Credit Score"
              value={score}
              subtitle={getCreditScoreLabel(score)}
              icon={BarChart3}
              color={getCreditScoreColor(score)}
            />
            <KPICard
              title="Total Debt"
              value={formatCurrency(totalDebt)}
              subtitle={`${activeLoans} active loans`}
              icon={Wallet}
              color="red"
            />
            <KPICard
              title="Monthly Payments"
              value={formatCurrency(monthlyPayments)}
              subtitle="Due this month"
              icon={ArrowUpRight}
              color="yellow"
            />
            <KPICard
              title="Available Banks"
              value={banksArray.length}
              subtitle="Partner institutions"
              icon={Building2}
              color="blue"
            />
          </div>

          {/* Credit Score Card */}
          <Card className="p-6">
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-500" />
                Credit Overview
              </h3>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="12"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="12"
                        strokeDasharray={`${(score / 850) * 352} 352`}
                        className={`${
                          score >= 750 ? 'text-emerald-500' :
                          score >= 650 ? 'text-green-500' :
                          score >= 550 ? 'text-yellow-500' : 'text-red-500'
                        }`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">{score}</span>
                      <span className="text-xs text-gray-500">/ 850</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Payment History</span>
                      <span className="text-green-500">Excellent</span>
                    </div>
                    <Progress value={95} color="success" size="sm" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Credit Utilization</span>
                      <span className="text-yellow-500">Moderate</span>
                    </div>
                    <Progress value={45} color="warning" size="sm" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Credit Age</span>
                      <span className="text-blue-500">Good</span>
                    </div>
                    <Progress value={70} color="primary" size="sm" />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Loans Summary */}
          <Card className="p-4">
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-blue-500" />
                Loan Summary
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Total Loans</p>
                  <p className="text-2xl font-bold">{totalLoans}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Loans</p>
                  <p className="text-2xl font-bold text-blue-500">{activeLoans}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Debt</p>
                  <p className="text-2xl font-bold text-red-500">{formatCurrency(totalDebt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Due</p>
                  <p className="text-2xl font-bold text-yellow-500">{formatCurrency(monthlyPayments)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard
              title="Total Loans"
              value={totalLoans}
              icon={FileText}
              color="blue"
            />
            <KPICard
              title="Active Loans"
              value={activeLoans}
              icon={PiggyBank}
              color="green"
            />
            <KPICard
              title="Total Debt"
              value={formatCurrency(totalDebt)}
              icon={Wallet}
              color="red"
            />
            <KPICard
              title="Monthly Payments"
              value={formatCurrency(monthlyPayments)}
              icon={ArrowUpRight}
              color="yellow"
            />
          </div>
          <Card className="p-6">
            <p className="text-gray-500 text-center">
              Loan details will be shown here. Click &quot;Apply for Loan&quot; to request financing.
            </p>
          </Card>
        </div>
      )}

      {/* Credit Tab */}
      {activeTab === 'credit' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard
              title="Credit Score"
              value={score}
              subtitle={getCreditScoreLabel(score)}
              icon={BarChart3}
              color={getCreditScoreColor(score)}
            />
            <KPICard
              title="Credit Rating"
              value={getCreditScoreLabel(score)}
              icon={TrendingUp}
              color="blue"
            />
            <KPICard
              title="Credit Limit"
              value={formatCurrency(score * 100)}
              icon={CreditCard}
              color="purple"
            />
            <KPICard
              title="Available Credit"
              value={formatCurrency((score * 100) - totalDebt)}
              icon={DollarSign}
              color="green"
            />
          </div>
          <Card className="p-6">
            <p className="text-gray-500 text-center">
              Detailed credit history and factors affecting your score.
            </p>
          </Card>
        </div>
      )}

      {/* Banks Tab */}
      {activeTab === 'banks' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title="Partner Banks"
              value={banksArray.length}
              icon={Building2}
              color="blue"
            />
            <KPICard
              title="Best Rate"
              value="4.5%"
              subtitle="APR"
              icon={Percent}
              color="green"
            />
            <KPICard
              title="Avg Processing"
              value="2 days"
              icon={FileText}
              color="purple"
            />
          </div>
          <Card className="p-6">
            <p className="text-gray-500 text-center">
              Available banking partners and their offerings will be shown here.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

export default BankingDashboard;
