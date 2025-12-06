/**
 * @file src/app/game/companies/[companyId]/page.tsx
 * @description Individual company dashboard page
 * @created 2025-12-06
 * 
 * OVERVIEW:
 * Company dashboard showing detailed financials, employee list, industry-specific features,
 * and recent activity. Provides comprehensive overview of single company operations.
 * 
 * ROUTE: /game/companies/[companyId]
 * PROTECTION: Requires authentication and company ownership
 * 
 * FEATURES:
 * - Company financial summary with KPI cards
 * - Revenue/expense breakdown
 * - Employee count and management
 * - Industry-specific dashboard access (Energy only for now)
 * - Mission statement display
 * - Operating costs breakdown
 * - Action buttons for key operations
 */

'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Divider,
  Progress,
} from '@heroui/react';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign,
  Briefcase,
  Building2,
  Calendar,
  FileText
} from 'lucide-react';
import type { ICompany } from '@/lib/db/models/Company';

/**
 * Format currency with commas and dollar sign
 */
const formatCurrency = (amount: number): string => {
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);
  const formatted = absoluteAmount.toLocaleString('en-US');
  return isNegative ? `-$${formatted}` : `$${formatted}`;
};

/**
 * Company dashboard page
 */
export default function CompanyDashboardPage({ 
  params 
}: { 
  params: Promise<{ companyId: string }> 
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const unwrappedParams = use(params);
  const [company, setCompany] = useState<(ICompany & { _id: string; netWorth?: number; profitLoss?: number }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch company data
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/companies');
        
        if (!response.ok) {
          throw new Error('Failed to fetch company');
        }
        
        const result = await response.json();
        
        // API returns { success: true, data: { companies: [...] } }
        if (!result.success || !result.data?.companies) {
          throw new Error('Invalid API response format');
        }
        
        const foundCompany = result.data.companies.find(
          (c: any) => c.id === unwrappedParams.companyId || c._id === unwrappedParams.companyId
        );
        
        if (!foundCompany) {
          setError('Company not found');
        } else {
          setCompany(foundCompany);
        }
      } catch (err) {
        console.error('Error fetching company:', err);
        setError(err instanceof Error ? err.message : 'Failed to load company');
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchCompany();
    }
  }, [unwrappedParams.companyId, status]);

  // Show loading while checking authentication
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session?.user) {
    return null;
  }

  // Error state
  if (error || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <Card className="max-w-2xl mx-auto bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-red-500/30">
          <CardBody className="text-center p-8">
            <p className="text-red-400 text-xl mb-4">
              {error || 'Company not found'}
            </p>
            <Button
              color="primary"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold"
              onPress={() => router.push('/game/companies')}
            >
              Back to Companies
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const profitLoss = company.profitLoss ?? (company.revenue - company.expenses);
  const netWorth = company.netWorth ?? company.cash;
  const profitMargin = company.revenue > 0 ? ((profitLoss / company.revenue) * 100).toFixed(1) : '0.0';
  const companyId = company.id || company._id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="light"
          color="primary"
          startContent={<ArrowLeft className="w-5 h-5" />}
          onPress={() => router.push('/game/companies')}
          className="text-blue-400 hover:text-blue-300"
        >
          Back to Companies
        </Button>

        {/* Company Header */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 shadow-xl">
          <CardHeader className="flex flex-col items-start gap-3 pb-0">
            <div className="flex justify-between items-start w-full flex-wrap gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Building2 className="w-8 h-8 text-blue-400" />
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                    {company.name}
                  </h1>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <Chip 
                    color="warning" 
                    variant="flat" 
                    className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold"
                    startContent={<Briefcase className="w-4 h-4" />}
                  >
                    {company.industry}
                  </Chip>
                  <Chip 
                    variant="flat" 
                    className="bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold"
                  >
                    Level {company.level || 1}
                  </Chip>
                  <span className="text-slate-400 text-sm flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Founded {new Date(company.foundedAt || company.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              {/* Profit Margin Badge */}
              <div className="flex flex-col items-end gap-2">
                <div className="text-xs text-slate-500 uppercase">Profit Margin</div>
                <div className={`text-2xl font-bold ${parseFloat(profitMargin) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {profitMargin}%
                </div>
              </div>
            </div>
          </CardHeader>

          <CardBody className="pt-4">
            {/* Mission Statement */}
            {company.mission && (
              <div className="p-4 bg-slate-800/50 rounded-lg border border-white/5 shadow-inner">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-slate-500 text-xs uppercase mb-1">Mission Statement</p>
                    <p className="text-white italic text-sm leading-relaxed">"{company.mission}"</p>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cash */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-yellow-500/30 hover:border-yellow-500/50 transition-all shadow-lg hover:shadow-yellow-500/20">
            <CardBody className="gap-2">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-xs uppercase font-semibold">Cash on Hand</p>
                <DollarSign className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-yellow-400 text-3xl font-bold">
                {formatCurrency(company.cash)}
              </p>
              <div className="text-xs text-slate-600">Available liquidity</div>
            </CardBody>
          </Card>

          {/* Net Worth */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all shadow-lg">
            <CardBody className="gap-2">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-xs uppercase font-semibold">Net Worth</p>
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-blue-400 text-3xl font-bold">
                {formatCurrency(netWorth)}
              </p>
              <div className="text-xs text-slate-600">Total company value</div>
            </CardBody>
          </Card>

          {/* Revenue */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-green-500/30 hover:border-green-500/50 transition-all shadow-lg hover:shadow-green-500/20">
            <CardBody className="gap-2">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-xs uppercase font-semibold">Total Revenue</p>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-green-400 text-3xl font-bold">
                {formatCurrency(company.revenue)}
              </p>
              <div className="text-xs text-slate-600">Lifetime earnings</div>
            </CardBody>
          </Card>

          {/* Expenses */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-red-500/30 hover:border-red-500/50 transition-all shadow-lg hover:shadow-red-500/20">
            <CardBody className="gap-2">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-xs uppercase font-semibold">Total Expenses</p>
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-red-400 text-3xl font-bold">
                {formatCurrency(company.expenses)}
              </p>
              <div className="text-xs text-slate-600">Lifetime costs</div>
            </CardBody>
          </Card>
        </div>

        {/* Profit/Loss and Employees */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Profit/Loss */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 shadow-lg">
            <CardBody className="gap-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-xs uppercase font-semibold">Lifetime Profit/Loss</p>
                {profitLoss >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
              </div>
              <p className={`text-4xl font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {profitLoss >= 0 ? '+' : ''}
                {formatCurrency(profitLoss)}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 text-sm">
                  {profitLoss >= 0 ? '✓ Profitable' : '⚠ Operating at a loss'}
                </span>
                <span className="text-slate-500 text-xs">
                  {profitMargin}% margin
                </span>
              </div>
              <Progress 
                value={Math.abs(parseFloat(profitMargin))}
                maxValue={100}
                className="mt-2"
                classNames={{
                  indicator: profitLoss >= 0 ? 'bg-green-500' : 'bg-red-500'
                }}
              />
            </CardBody>
          </Card>

          {/* Employees */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 shadow-lg">
            <CardBody className="gap-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-xs uppercase font-semibold">Workforce</p>
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-white text-4xl font-bold">{company.employees?.length || 0}</p>
              <div className="text-slate-600 text-sm">Total employees</div>
              <Divider className="bg-white/10 my-1" />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  className="bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 font-bold"
                  onPress={() => router.push(`/game/employees`)}
                  startContent={<Users className="w-4 h-4" />}
                >
                  View All
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 font-bold"
                  onPress={() => router.push(`/game/employees`)}
                >
                  Hire
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Operating Costs Breakdown */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 shadow-lg">
          <CardHeader>
            <h3 className="text-xl font-bold text-white">Operating Costs Breakdown</h3>
          </CardHeader>
          <Divider className="bg-white/10" />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-800/30 rounded-lg border border-white/5">
                <p className="text-slate-500 text-xs uppercase mb-2">Employee Salaries</p>
                <p className="text-white text-2xl font-bold">
                  {formatCurrency((company.employees?.length || 0) * 5000)}
                </p>
                <p className="text-slate-600 text-xs mt-1">~$5,000 per employee/month</p>
              </div>
              <div className="p-4 bg-slate-800/30 rounded-lg border border-white/5">
                <p className="text-slate-500 text-xs uppercase mb-2">Operational Overhead</p>
                <p className="text-white text-2xl font-bold">
                  {formatCurrency(company.revenue * 0.1)}
                </p>
                <p className="text-slate-600 text-xs mt-1">~10% of revenue</p>
              </div>
              <div className="p-4 bg-slate-800/30 rounded-lg border border-white/5">
                <p className="text-slate-500 text-xs uppercase mb-2">Total Monthly Burn</p>
                <p className="text-red-400 text-2xl font-bold">
                  {formatCurrency((company.employees?.length || 0) * 5000 + company.revenue * 0.1)}
                </p>
                <p className="text-slate-600 text-xs mt-1">Estimated monthly costs</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Industry-Specific Dashboards - Only Energy exists */}
        {company.industry === 'Energy' && (
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-blue-500/30 shadow-xl shadow-blue-500/10">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Energy Operations Dashboard</h3>
              </div>
            </CardHeader>
            <Divider className="bg-white/10" />
            <CardBody className="gap-4">
              <p className="text-slate-400">
                Manage renewable energy facilities, oil & gas operations, energy storage systems, 
                and grid infrastructure for your energy company.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-800/30 rounded-lg border border-green-500/20">
                  <p className="text-green-400 text-xs font-semibold uppercase">Renewable Energy</p>
                  <p className="text-white text-sm mt-1">Solar, Wind, Hydro</p>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg border border-orange-500/20">
                  <p className="text-orange-400 text-xs font-semibold uppercase">Oil & Gas</p>
                  <p className="text-white text-sm mt-1">Wells, Refineries</p>
                </div>
              </div>
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold shadow-lg shadow-blue-500/30"
                size="lg"
                onPress={() => router.push(`/game/companies/${companyId}/energy`)}
              >
                Open Energy Dashboard →
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Coming Soon Industry Dashboards */}
        {company.industry !== 'Energy' && (
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50">
            <CardHeader>
              <h3 className="text-xl font-bold text-white">{company.industry} Operations Dashboard</h3>
            </CardHeader>
            <Divider className="bg-white/10" />
            <CardBody className="text-center py-8">
              <p className="text-slate-400 mb-4">
                Industry-specific dashboard for {company.industry} companies is coming soon.
              </p>
              <Chip className="bg-slate-700/50 text-slate-400">
                Under Development
              </Chip>
            </CardBody>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 shadow-lg">
          <CardHeader>
            <h3 className="text-xl font-bold text-white">Quick Actions</h3>
          </CardHeader>
          <Divider className="bg-white/10" />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Button
                className="bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 font-bold"
                startContent={<Users className="w-4 h-4" />}
                onPress={() => router.push(`/game/employees`)}
              >
                Manage Employees
              </Button>
              <Button
                className="bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 font-bold"
                startContent={<FileText className="w-4 h-4" />}
                onPress={() => router.push(`/game/contracts/marketplace`)}
              >
                Contract Marketplace
              </Button>
              <Button
                className="bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 font-bold"
                startContent={<Briefcase className="w-4 h-4" />}
                onPress={() => router.push(`/game/contracts/active`)}
              >
                Active Contracts
              </Button>
              <Button
                className="bg-orange-600/20 text-orange-400 border border-orange-500/30 hover:bg-orange-600/30 font-bold"
                startContent={<ArrowLeft className="w-4 h-4" />}
                onPress={() => router.push(`/game/companies`)}
              >
                All Companies
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
