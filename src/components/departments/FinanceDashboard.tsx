/**
 * @fileoverview Finance Department Dashboard Component
 * @module components/departments/FinanceDashboard
 * 
 * OVERVIEW:
 * Displays finance department KPIs, P&L reports, loans, investments, and cashflow forecasts.
 * Provides loan application and investment management interfaces.
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
import type { FinanceDepartment, Loan, Investment } from '@/lib/types/department';

interface FinanceDashboardProps {
  department: FinanceDepartment;
  companyId: string;
  onUpdate?: () => void;
}

export default function FinanceDashboard({ department, companyId, onUpdate }: FinanceDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(false);

  // Loan status colors
  const loanStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'paid-off': return 'primary';
      case 'defaulted': return 'danger';
      default: return 'default';
    }
  };

  // Investment risk colors
  const riskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      default: return 'default';
    }
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
        aria-label="Finance department sections"
        className="w-full"
      >
        {/* Overview Tab */}
        <Tab key="overview" title="Overview">
          <Card>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-default-700">Credit Score</p>
                  <p className="text-2xl font-bold">{department.creditScore || 0}</p>
                  <Chip size="sm" color={
                    (department.creditScore || 0) >= 750 ? 'success' :
                    (department.creditScore || 0) >= 650 ? 'warning' : 'danger'
                  } variant="flat" className="mt-2">
                    {(department.creditScore || 0) >= 750 ? 'Excellent' :
                     (department.creditScore || 0) >= 650 ? 'Good' : 'Fair'}
                  </Chip>
                </div>
                <div>
                  <p className="text-sm text-default-700">Cash Reserves</p>
                  <p className="text-2xl font-bold">${formatNumber(department.cashReserves || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-default-700">Total Revenue</p>
                  <p className="text-2xl font-bold text-success">${formatNumber(department.totalRevenue || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-default-700">Total Expenses</p>
                  <p className="text-2xl font-bold text-danger">${formatNumber(department.totalExpenses || 0)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        {/* Loans Tab */}
        <Tab key="loans" title={`Loans (${department.loans?.length || 0})`}>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Active Loans</h3>
              <Button color="primary" size="sm" onPress={() => {/* TODO: Open loan application modal */}}>
                Apply for Loan
              </Button>
            </CardHeader>
            <CardBody>
              {department.loans && department.loans.length > 0 ? (
                <Table aria-label="Loans table">
                  <TableHeader>
                    <TableColumn>TYPE</TableColumn>
                    <TableColumn>AMOUNT</TableColumn>
                    <TableColumn>INTEREST RATE</TableColumn>
                    <TableColumn>MONTHLY PAYMENT</TableColumn>
                    <TableColumn>REMAINING</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {department.loans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="capitalize">{loan.loanType.replace('-', ' ')}</TableCell>
                        <TableCell>${formatNumber(loan.amount)}</TableCell>
                        <TableCell>{loan.interestRate.toFixed(2)}%</TableCell>
                        <TableCell>${formatNumber(loan.monthlyPayment)}</TableCell>
                        <TableCell>${formatNumber(loan.remainingBalance)}</TableCell>
                        <TableCell>
                          <Chip color={loanStatusColor(loan.status)} variant="flat" size="sm">
                            {loan.status}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-default-700 py-8">No active loans</p>
              )}
            </CardBody>
          </Card>
        </Tab>

        {/* Investments Tab */}
        <Tab key="investments" title={`Investments (${department.investments?.length || 0})`}>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Investment Portfolio</h3>
              <Button color="success" size="sm" onPress={() => {/* TODO: Open investment modal */}}>
                New Investment
              </Button>
            </CardHeader>
            <CardBody>
              {department.investments && department.investments.length > 0 ? (
                <Table aria-label="Investments table">
                  <TableHeader>
                    <TableColumn>TYPE</TableColumn>
                    <TableColumn>INITIAL</TableColumn>
                    <TableColumn>CURRENT VALUE</TableColumn>
                    <TableColumn>RETURN RATE</TableColumn>
                    <TableColumn>RISK</TableColumn>
                    <TableColumn>GAIN/LOSS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {department.investments.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="capitalize">{inv.investmentType.replace('-', ' ')}</TableCell>
                        <TableCell>${formatNumber(inv.amount)}</TableCell>
                        <TableCell>${formatNumber(inv.currentValue)}</TableCell>
                        <TableCell>{(inv.returnRate * 100).toFixed(2)}%</TableCell>
                        <TableCell>
                          <Chip color={riskColor(inv.riskLevel)} variant="flat" size="sm">
                            {inv.riskLevel}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <span className={inv.currentValue > inv.amount ? 'text-success' : 'text-danger'}>
                            ${formatNumber(inv.currentValue - inv.amount)} ({((inv.currentValue / inv.amount - 1) * 100).toFixed(1)}%)
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-default-700 py-8">No investments</p>
              )}
            </CardBody>
          </Card>
        </Tab>

        {/* Cashflow Tab */}
        <Tab key="cashflow" title="Cashflow">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Cashflow Forecasts</h3>
            </CardHeader>
            <CardBody>
              {department.financeData.cashflowForecasts && department.financeData.cashflowForecasts.length > 0 ? (
                <div className="space-y-4">
                  {department.financeData.cashflowForecasts.map((forecast: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold capitalize">{forecast.forecastPeriod.replace('day', ' Day')} Forecast</h4>
                        <Chip size="sm" color="default">{forecast.runwayDays} days runway</Chip>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-default-700">Current Cash</p>
                          <p className="font-semibold">${formatNumber(forecast.currentCash)}</p>
                        </div>
                        <div>
                          <p className="text-default-700">Projected Inflows</p>
                          <p className="font-semibold text-success">+${formatNumber(forecast.projectedInflows)}</p>
                        </div>
                        <div>
                          <p className="text-default-700">Projected Outflows</p>
                          <p className="font-semibold text-danger">-${formatNumber(forecast.projectedOutflows)}</p>
                        </div>
                        <div>
                          <p className="text-default-700">Ending Cash</p>
                          <p className="font-semibold">${formatNumber(forecast.projectedEndingCash)}</p>
                        </div>
                      </div>
                      {forecast.alerts && forecast.alerts.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {forecast.alerts.map((alert: any, i: number) => (
                            <Chip key={i} color={alert.type === 'critical' ? 'danger' : alert.type === 'warning' ? 'warning' : 'default'} size="sm" variant="flat">
                              {alert.message}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-default-700 py-8">No cashflow forecasts available</p>
              )}
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
 * 1. **Tab Structure**: Overview, Loans, Investments, Cashflow sections
 * 2. **KPI Display**: Progress bars for 5 key metrics (efficiency, performance, ROI, utilization, quality)
 * 3. **Credit Score**: Visual indicator with color-coded rating (excellent/good/fair)
 * 4. **Loans Table**: Complete loan details with status chips
 * 5. **Investments Table**: Portfolio performance with gain/loss calculations
 * 6. **Cashflow Forecasts**: 7/30/90 day projections with alerts
 * 7. **Action Buttons**: Apply for Loan, New Investment (placeholder modals)
 * 8. **Responsive Grid**: Adapts to mobile/desktop layouts
 * 
 * USAGE:
 * ```tsx
 * <FinanceDashboard 
 *   department={financeData} 
 *   companyId={company.id}
 *   onUpdate={() => refetch()}
 * />
 * ```
 */
