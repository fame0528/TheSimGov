/**
 * @fileoverview Finance Department Dashboard Component
 * @module lib/components/departments/FinanceDashboard
 * 
 * OVERVIEW:
 * Complete Finance department view with P&L, loans, investments, cashflow.
 * Reuses KPIGrid, DepartmentCard, and DataTable components.
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
import { KPIGrid } from './KPIGrid';
import { DataTable, Column } from '../shared/DataTable';
import type { FinanceDepartment, Loan, Investment } from '@/lib/types/department';

export interface FinanceDashboardProps {
  /** Finance department data */
  department: FinanceDepartment;
  /** Loan application handler */
  onApplyLoan?: () => void;
  /** Investment creation handler */
  onCreateInvestment?: () => void;
  /** Refresh data */
  onRefresh?: () => void;
}

/**
 * Format currency
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date
 */
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * FinanceDashboard Component
 * 
 * Complete Finance department management interface.
 * Shows KPIs, financials, loans, investments, P&L, cashflow.
 * 
 * @example
 * ```tsx
 * <FinanceDashboard
 *   department={financeDept}
 *   onApplyLoan={() => setShowLoanModal(true)}
 *   onCreateInvestment={() => setShowInvestModal(true)}
 * />
 * ```
 */
export function FinanceDashboard({
  department,
  onApplyLoan,
  onCreateInvestment,
  onRefresh,
}: FinanceDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Loan table columns
  const loanColumns: Column<Loan>[] = [
    { header: 'Type', accessor: (loan) => <Chip size="sm">{loan.loanType}</Chip> },
    { header: 'Amount', accessor: (loan) => formatCurrency(loan.amount) },
    { header: 'Interest Rate', accessor: (loan) => `${loan.interestRate}%` },
    { header: 'Monthly Payment', accessor: (loan) => formatCurrency(loan.monthlyPayment) },
    { header: 'Remaining', accessor: (loan) => formatCurrency(loan.remainingBalance) },
    { header: 'Status', accessor: (loan) => <Chip size="sm" color={loan.status === 'active' ? 'success' : 'default'}>{loan.status}</Chip> },
    { header: 'End Date', accessor: (loan) => formatDate(loan.endDate) },
  ];

  // Investment table columns
  const investmentColumns: Column<Investment>[] = [
    { header: 'Type', accessor: (inv) => <Chip size="sm">{inv.investmentType}</Chip> },
    { header: 'Principal', accessor: (inv) => formatCurrency(inv.amount) },
    { header: 'Current Value', accessor: (inv) => formatCurrency(inv.currentValue) },
    { header: 'Return Rate', accessor: (inv) => `${inv.returnRate}%` },
    { header: 'Risk', accessor: (inv) => <Chip size="sm" color={inv.riskLevel === 'high' ? 'danger' : inv.riskLevel === 'medium' ? 'warning' : 'success'}>{inv.riskLevel}</Chip> },
    { header: 'Purchase Date', accessor: (inv) => formatDate(inv.purchaseDate) },
    { header: 'Gain/Loss', accessor: (inv) => {
      const gain = inv.currentValue - inv.amount;
      return (
        <span className={gain >= 0 ? 'text-success font-semibold' : 'text-danger font-semibold'}>
          {gain >= 0 ? '+' : ''}{formatCurrency(gain)}
        </span>
      );
    }},
  ];

  const activeLoans = department.loans?.filter(l => l.status === 'active') || [];
  const totalDebt = activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0);
  const totalInvestmentValue = department.investments?.reduce((sum, inv) => sum + inv.currentValue, 0) || 0;
  const investmentGains = department.investments?.reduce((sum, inv) => sum + (inv.currentValue - inv.amount), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">💰 Finance Department</h2>
          <p className="text-default-500">Level {department.level} • {formatCurrency(department.budget)} Budget</p>
        </div>
        {onRefresh && (
          <Button size="sm" variant="flat" onPress={onRefresh}>
            Refresh
          </Button>
        )}
      </div>

      {/* KPIs */}
      <KPIGrid kpis={department.kpis} showDescriptions columns={5} />

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Total Revenue</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(department.totalRevenue || 0)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Total Expenses</p>
            <p className="text-2xl font-bold text-danger">{formatCurrency(department.totalExpenses || 0)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Cash Reserves</p>
            <p className="text-2xl font-bold">{formatCurrency(department.cashReserves || 0)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Credit Score</p>
            <p className="text-2xl font-bold">
              <Chip color={(department.creditScore || 650) >= 700 ? 'success' : (department.creditScore || 650) >= 600 ? 'warning' : 'danger'}>
                {department.creditScore || 650}
              </Chip>
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="overview" title="Overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader className="flex justify-between">
                <h3 className="text-lg font-semibold">Active Loans</h3>
                <Chip size="sm">{activeLoans.length}</Chip>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-default-500">Total Debt</span>
                    <span className="font-semibold">{formatCurrency(totalDebt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">Monthly Payments</span>
                    <span className="font-semibold">
                      {formatCurrency(activeLoans.reduce((sum, l) => sum + l.monthlyPayment, 0))}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex justify-between">
                <h3 className="text-lg font-semibold">Investments</h3>
                <Chip size="sm">{department.investments?.length || 0}</Chip>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-default-500">Total Value</span>
                    <span className="font-semibold">{formatCurrency(totalInvestmentValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">Total Gain/Loss</span>
                    <span className={`font-semibold ${investmentGains >= 0 ? 'text-success' : 'text-danger'}`}>
                      {investmentGains >= 0 ? '+' : ''}{formatCurrency(investmentGains)}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="loans" title={`Loans (${department.loans?.length || 0})`}>
          <div className="mt-4 space-y-4">
            {onApplyLoan && (
              <Button color="primary" onPress={onApplyLoan}>
                Apply for New Loan
              </Button>
            )}
            <DataTable
              data={department.loans || []}
              columns={loanColumns}
              emptyMessage="No loans. Apply for your first business loan!"
            />
          </div>
        </Tab>

        <Tab key="investments" title={`Investments (${department.investments?.length || 0})`}>
          <div className="mt-4 space-y-4">
            {onCreateInvestment && (
              <Button color="primary" onPress={onCreateInvestment}>
                Create New Investment
              </Button>
            )}
            <DataTable
              data={department.investments || []}
              columns={investmentColumns}
              emptyMessage="No investments. Start building your portfolio!"
            />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Component Reuse**: Uses KPIGrid, DataTable, Card, Chip, Tabs from shared components
 * 2. **Tabbed Interface**: Overview, Loans, Investments tabs
 * 3. **Financial Metrics**: Revenue, expenses, cash reserves, credit score
 * 4. **Loan Management**: View active loans with payment details
 * 5. **Investment Tracking**: Portfolio value, gains/losses, risk levels
 * 6. **Action Buttons**: Apply for loan, create investment (props callbacks)
 * 7. **Responsive**: Mobile-first grid layouts
 * 
 * PREVENTS:
 * - Duplicate finance dashboard code
 * - Inconsistent financial displays
 * - Missing loan/investment details
 * - Hardcoded table structures
 */
