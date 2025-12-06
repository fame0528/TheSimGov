/**
 * @fileoverview Finance Department Dashboard
 * @module app/departments/finance/FinanceDashboard
 * 
 * OVERVIEW:
 * Finance department management dashboard showing P&L, loans, investments, and cashflow.
 * Integrates with /api/departments/finance/loans and /api/departments/finance/investments.
 * 
 * @created 2025-11-22
 * @author ECHO v1.3.0
 */

'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardBody, Button, Tabs, Tab, Input, Select, SelectItem, Chip, Progress } from '@heroui/react';
import { FaDollarSign, FaChartLine, FaPlus, FaTimes } from 'react-icons/fa';
import { KPIGrid } from '@/lib/components/departments/KPIGrid';
import type { Department } from '@/lib/types/department';

export interface FinanceDashboardProps {
  department: Department;
  onRefresh: () => Promise<void>;
}

export default function FinanceDashboard({ department, onRefresh }: FinanceDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreatingLoan, setIsCreatingLoan] = useState(false);
  const [isCreatingInvestment, setIsCreatingInvestment] = useState(false);

  // Loan form state
  const [loanForm, setLoanForm] = useState({
    amount: '',
    purpose: 'working-capital' as 'working-capital' | 'expansion' | 'equipment' | 'bridge',
    termMonths: '12',
  });

  // Investment form state
  const [investmentForm, setInvestmentForm] = useState({
    type: 'stocks' as 'stocks' | 'bonds' | 'real-estate' | 'venture',
    amount: '',
    riskLevel: 'medium' as 'low' | 'medium' | 'high',
  });

  /**
   * Submit loan application
   */
  const handleLoanSubmit = async () => {
    try {
      const response = await fetch('/api/departments/finance/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: department.companyId,
          amount: parseFloat(loanForm.amount),
          purpose: loanForm.purpose,
          termMonths: parseInt(loanForm.termMonths),
        }),
      });

      if (!response.ok) throw new Error('Loan application failed');
      
      setIsCreatingLoan(false);
      setLoanForm({ amount: '', purpose: 'working-capital', termMonths: '12' });
      await onRefresh();
    } catch (error) {
      console.error('Loan application error:', error);
    }
  };

  /**
   * Create investment
   */
  const handleInvestmentSubmit = async () => {
    try {
      const response = await fetch('/api/departments/finance/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: department.companyId,
          type: investmentForm.type,
          amount: parseFloat(investmentForm.amount),
          riskLevel: investmentForm.riskLevel,
        }),
      });

      if (!response.ok) throw new Error('Investment creation failed');
      
      setIsCreatingInvestment(false);
      setInvestmentForm({ type: 'stocks', amount: '', riskLevel: 'medium' });
      await onRefresh();
    } catch (error) {
      console.error('Investment creation error:', error);
    }
  };

  // Finance-specific KPIs
  const financeKPIs = [
    { label: 'Revenue', value: '$125k', change: '+12%', trend: 'up' as const, variant: 'success' as const },
    { label: 'Expenses', value: '$45k', change: '-8%', trend: 'down' as const, variant: 'success' as const },
    { label: 'Profit Margin', value: '64%', change: '+3%', trend: 'up' as const, variant: 'success' as const },
    { label: 'Credit Score', value: (department.creditScore)?.toString() || '700', trend: 'neutral' as const, variant: 'default' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaDollarSign size={32} className="text-success" />
            {department.name}
          </h1>
          <p className="text-default-700">Level {department.level} • {department.budgetPercentage}% Budget Allocation</p>
        </div>
        <Chip color="success" variant="flat" size="lg">
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
        color="primary"
      >
        <Tab key="overview" title="Overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* P&L Summary */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold">Profit & Loss</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Total Revenue</span>
                  <span className="font-bold text-success text-lg">+$125,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Operating Expenses</span>
                  <span className="font-bold text-danger text-lg">-$45,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Interest Income</span>
                  <span className="font-bold text-success">+$3,200</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Loan Payments</span>
                  <span className="font-bold text-danger">-$8,500</span>
                </div>
                <div className="pt-4 border-t border-default-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Net Profit</span>
                    <span className="text-2xl font-bold text-success">$74,700</span>
                  </div>
                  <p className="text-sm text-default-700 mt-1">64% profit margin</p>
                </div>
              </CardBody>
            </Card>

            {/* Financial Health */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold">Financial Health</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Credit Score</span>
                  <Chip color="success" variant="flat">
                    {department.creditScore || 700} / 850
                  </Chip>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Debt-to-Equity</span>
                  <span className="font-semibold">1.2x</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Current Ratio</span>
                  <span className="font-semibold">2.5x</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Active Loans</span>
                  <span className="font-semibold">{department.loans?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Active Investments</span>
                  <span className="font-semibold">{department.investments?.length || 0}</span>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="loans" title="Loans">
          <div className="mt-6 space-y-4">
            {!isCreatingLoan ? (
              <Button
                color="primary"
                startContent={<FaPlus size={16} />}
                onPress={() => setIsCreatingLoan(true)}
              >
                Apply for Loan
              </Button>
            ) : (
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Loan Application</h3>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => setIsCreatingLoan(false)}
                  >
                    <FaTimes size={16} />
                  </Button>
                </CardHeader>
                <CardBody className="space-y-4">
                  <Input
                    type="number"
                    label="Loan Amount"
                    placeholder="50000"
                    value={loanForm.amount}
                    onValueChange={(value) => setLoanForm({ ...loanForm, amount: value })}
                    startContent={<span className="text-default-400">$</span>}
                  />
                  <Select
                    label="Purpose"
                    selectedKeys={[loanForm.purpose]}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as typeof loanForm.purpose;
                      setLoanForm({ ...loanForm, purpose: value });
                    }}
                  >
                    <SelectItem key="working-capital">Working Capital</SelectItem>
                    <SelectItem key="expansion">Business Expansion</SelectItem>
                    <SelectItem key="equipment">Equipment Purchase</SelectItem>
                    <SelectItem key="bridge">Bridge Financing</SelectItem>
                  </Select>
                  <Input
                    type="number"
                    label="Term (Months)"
                    placeholder="12"
                    value={loanForm.termMonths}
                    onValueChange={(value) => setLoanForm({ ...loanForm, termMonths: value })}
                  />
                  <Button color="primary" onPress={handleLoanSubmit}>
                    Submit Application
                  </Button>
                </CardBody>
              </Card>
            )}

            {/* Loans List */}
            <div className="space-y-3">
              {(department.loans || []).map((loan: any, index: number) => (
                <Card key={index}>
                  <CardBody>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{loan.purpose.replace('-', ' ').toUpperCase()}</p>
                        <p className="text-sm text-default-700">{loan.termMonths} months @ {loan.interestRate}% APR</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${(loan.amount / 1000).toFixed(1)}k</p>
                        <Chip color={loan.status === 'approved' ? 'success' : 'warning'} size="sm">
                          {loan.status}
                        </Chip>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </Tab>

        <Tab key="investments" title="Investments">
          <div className="mt-6 space-y-4">
            {!isCreatingInvestment ? (
              <Button
                color="primary"
                startContent={<FaPlus size={16} />}
                onPress={() => setIsCreatingInvestment(true)}
              >
                New Investment
              </Button>
            ) : (
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Create Investment</h3>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => setIsCreatingInvestment(false)}
                  >
                    <FaTimes size={16} />
                  </Button>
                </CardHeader>
                <CardBody className="space-y-4">
                  <Select
                    label="Investment Type"
                    selectedKeys={[investmentForm.type]}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as typeof investmentForm.type;
                      setInvestmentForm({ ...investmentForm, type: value });
                    }}
                  >
                    <SelectItem key="stocks">Stocks</SelectItem>
                    <SelectItem key="bonds">Bonds</SelectItem>
                    <SelectItem key="real-estate">Real Estate</SelectItem>
                    <SelectItem key="venture">Venture Capital</SelectItem>
                  </Select>
                  <Input
                    type="number"
                    label="Investment Amount"
                    placeholder="25000"
                    value={investmentForm.amount}
                    onValueChange={(value) => setInvestmentForm({ ...investmentForm, amount: value })}
                    startContent={<span className="text-default-400">$</span>}
                  />
                  <Select
                    label="Risk Level"
                    selectedKeys={[investmentForm.riskLevel]}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as typeof investmentForm.riskLevel;
                      setInvestmentForm({ ...investmentForm, riskLevel: value });
                    }}
                  >
                    <SelectItem key="low">Low Risk (3-6% returns)</SelectItem>
                    <SelectItem key="medium">Medium Risk (6-12% returns)</SelectItem>
                    <SelectItem key="high">High Risk (12-25% returns)</SelectItem>
                  </Select>
                  <Button color="primary" onPress={handleInvestmentSubmit}>
                    Create Investment
                  </Button>
                </CardBody>
              </Card>
            )}

            {/* Investments Portfolio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(department.investments || []).map((inv: any, index: number) => (
                <Card key={index}>
                  <CardBody>
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold">{inv.type.toUpperCase()}</p>
                      <Chip color="primary" size="sm">
                        {inv.riskLevel}
                      </Chip>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-default-700">Principal</span>
                        <span className="font-semibold">${(inv.principal / 1000).toFixed(1)}k</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-default-700">Current Value</span>
                        <span className="font-semibold">${(inv.currentValue / 1000).toFixed(1)}k</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-default-700">Return Rate</span>
                        <span className="font-semibold text-success">+{inv.returnRate}%</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
