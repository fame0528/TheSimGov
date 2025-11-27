/**
 * @fileoverview Employees List Page
 * @module app/(game)/employees
 * 
 * OVERVIEW:
 * Company employees list with filtering, sorting, and quick actions.
 * Grid/list view toggle, hire button, performance overview.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */


'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, Select, SelectItem, Input, Chip, Card, CardBody } from '@heroui/react';
import { DashboardLayout } from '@/lib/components/layouts';
import { LoadingSpinner, ErrorMessage } from '@/lib/components/shared';
import { EmployeeCard } from '@/lib/components/employee';
import { useEmployees } from '@/lib/hooks/useEmployee';
import { useCompanies } from '@/lib/hooks/useCompany';

/**
 * Employees List Page
 * 
 * FEATURES:
 * - Grid of employee cards
 * - Filter by status, role, morale
 * - Sort by name, salary, skills, morale
 * - Quick hire button
 * - Click-through to detail pages
 * - Company selector
 * 
 * DISPLAYS:
 * - Total employees count
 * - Average morale
 * - Retention risk summary
 * - Active training count
 */
/**
 * Employees List Content Component
 * Wrapped in Suspense to handle useSearchParams
 */
function EmployeesListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');
  const { status } = useSession();

  const [mounted, setMounted] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const authReady = mounted && status !== 'loading' && status === 'authenticated';
  const {
    data: companies,
    isLoading: companiesLoading,
    error: companiesError,
    firstSuccess: companiesFirstSuccess,
    isAuthInitializing: companiesAuthInit,
    authInitAttempts: companiesAuthAttempts,
    lastStatus: companiesLastStatus
  } = useCompanies({ enabled: authReady });

  const { data: employees, isLoading: employeesLoading, error } = useEmployees(authReady ? (companyId || undefined) : undefined);

  /**
   * Handle company selection
   */
  const handleCompanyChange = (keys: any) => {
    const newCompanyId = Array.from(keys as Set<string>)[0];
    router.push(`/employees?companyId=${newCompanyId}`);
  };

  /**
   * Filter and sort employees
   */
  const filteredEmployees = employees
    ?.filter((emp) => {
      // Status filter
      if (statusFilter !== 'all' && emp.status !== statusFilter) return false;
      
      // Search filter (name or role)
      if (searchQuery && !emp.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !emp.role.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'salary':
          return b.salary - a.salary;
        case 'skills':
          return (b.skillAverage || 0) - (a.skillAverage || 0);
        case 'morale':
          return b.morale - a.morale;
        default:
          return 0;
      }
    }) || [];

  /**
   * Calculate summary stats
   */
  const stats = {
    total: filteredEmployees.length,
    active: filteredEmployees.filter(e => e.status === 'active').length,
    training: filteredEmployees.filter(e => e.status === 'training').length,
    avgMorale: filteredEmployees.length > 0
      ? Math.round(filteredEmployees.reduce((sum, e) => sum + e.morale, 0) / filteredEmployees.length)
      : 0,
    highRisk: filteredEmployees.filter(e => e.retentionRisk === 'critical' || e.retentionRisk === 'high').length,
  };

  if (!mounted || status === 'loading' || status !== 'authenticated' || companiesAuthInit || companiesLoading || (!companiesFirstSuccess)) {
    return (
      <DashboardLayout title="Employees" subtitle="Loading...">
        <LoadingSpinner size="lg" message="Loading companies..." />
      </DashboardLayout>
    );
  }

  if (companiesError && !companiesAuthInit && !companiesLoading && !companiesFirstSuccess) {
    return (
      <DashboardLayout title="Employees" subtitle="Error">
        <Card className="bg-gradient-to-br from-red-500/10 to-slate-900/50 backdrop-blur-xl border border-red-500/30">
          <CardBody className="gap-4 py-10 items-center text-center">
            <h2 className="text-2xl font-bold text-red-400">Unable to load companies</h2>
            <p className="text-slate-300 max-w-md">
              {companiesError.status === 401
                ? 'Your session is still initializing. Please wait a moment or refresh.'
                : companiesError.message}
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold shadow-xl shadow-blue-500/30 transition-all duration-300"
              onPress={() => router.refresh()}
            >
              Retry
            </Button>
          </CardBody>
        </Card>
      </DashboardLayout>
    );
  }

  if (companiesFirstSuccess && companies && companies.length === 0) {
    return (
      <DashboardLayout title="Employees" subtitle="Get Started">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10">
          <CardBody className="gap-6 py-12 items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Create Your First Company</h2>
              <p className="text-lg text-slate-400 max-w-md">
                To hire employees, you need to create a company first.
              </p>
            </div>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold shadow-xl shadow-blue-500/30 transition-all duration-300"
              onPress={() => router.push('/game/companies/create')}
            >
              Create Your First Company
            </Button>
          </CardBody>
        </Card>
      </DashboardLayout>
    );
  }

  if (!companyId) {
    return (
      <DashboardLayout title="Employees" subtitle="Select Company">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10">
          <CardBody className="gap-4">
            <p className="text-lg font-semibold text-white">Select a company to view employees</p>
            <Select
              placeholder="Choose a company..."
              onSelectionChange={handleCompanyChange}
              size="lg"
              classNames={{
                trigger: "bg-slate-900/50 border-white/10",
                value: "text-white"
              }}
            >
              {(companies || []).map((company) => (
                <SelectItem key={company.id}>
                  {company.name} • Level {company.level} • {company.industry}
                </SelectItem>
              ))}
            </Select>
          </CardBody>
        </Card>
      </DashboardLayout>
    );
  }

  const selectedCompany = companies?.find(c => c.id === companyId);

  return (
    <DashboardLayout
      title="Employees"
      subtitle={selectedCompany ? `${selectedCompany.name} • ${stats.total} employees` : ''}
    >
      <div className="flex flex-col gap-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10">
            <CardBody className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-400">Total</span>
                <span className="text-2xl font-bold text-white">{stats.total}</span>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-slate-900/50 backdrop-blur-xl border border-emerald-500/20">
            <CardBody className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-emerald-300">Active</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {stats.active}
                </span>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-slate-900/50 backdrop-blur-xl border border-blue-500/20">
            <CardBody className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-blue-300">Training</span>
                <span className="text-2xl font-bold text-blue-400">
                  {stats.training}
                </span>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-violet-500/10 to-slate-900/50 backdrop-blur-xl border border-violet-500/20">
            <CardBody className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-violet-300">Avg Morale</span>
                <span className={`text-2xl font-bold ${
                  stats.avgMorale >= 70 ? 'text-emerald-400' : stats.avgMorale >= 50 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {stats.avgMorale}
                </span>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/10 to-slate-900/50 backdrop-blur-xl border border-red-500/20">
            <CardBody className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-red-300">High Risk</span>
                <span className="text-2xl font-bold text-red-400">
                  {stats.highRisk}
                </span>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Controls */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10">
          <CardBody className="p-6">
            <div className="flex gap-4 flex-wrap items-center">
            {/* Search */}
            <Input
              placeholder="Search by name or role..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="max-w-[300px]"
            />

            {/* Status Filter */}
            <Select
              selectedKeys={new Set([statusFilter])}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
              className="max-w-[200px]"
            >
              <SelectItem key="all">All Status</SelectItem>
              <SelectItem key="active">Active</SelectItem>
              <SelectItem key="training">Training</SelectItem>
              <SelectItem key="onLeave">On Leave</SelectItem>
              <SelectItem key="terminated">Terminated</SelectItem>
            </Select>

            {/* Sort */}
            <Select
              selectedKeys={new Set([sortBy])}
              onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
              className="max-w-[200px]"
            >
              <SelectItem key="name">Sort by Name</SelectItem>
              <SelectItem key="salary">Sort by Salary</SelectItem>
              <SelectItem key="skills">Sort by Skills</SelectItem>
              <SelectItem key="morale">Sort by Morale</SelectItem>
            </Select>

            {/* Hire Button */}
            <Button
              size="lg"
              className="ml-auto bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold shadow-xl shadow-emerald-500/30 transition-all duration-300"
              onPress={() => router.push(`/employees/hire?companyId=${companyId}`)}
            >
              + Hire Employee
            </Button>
          </div>
          </CardBody>
        </Card>

        {/* Employees Grid */}
        {employeesLoading && <LoadingSpinner size="lg" message="Loading employees..." />}
        
        {error && <ErrorMessage error={error} />}

        {!employeesLoading && !error && filteredEmployees.length === 0 && (
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10">
            <CardBody className="gap-4 py-8 items-center">
              <p className="text-lg text-slate-300">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No employees match your filters'
                  : 'No employees yet. Hire your first team member!'}
              </p>
              {(!searchQuery && statusFilter === 'all') && (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold shadow-xl shadow-emerald-500/30 transition-all duration-300"
                  onPress={() => router.push(`/employees/hire?companyId=${companyId}`)}
                >
                  Browse Candidates
                </Button>
              )}
            </CardBody>
          </Card>
        )}

        {!employeesLoading && !error && filteredEmployees.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onClick={() => router.push(`/employees/${employee.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/**
 * Employees List Page
 */
export default function EmployeesListPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <EmployeesListContent />
    </Suspense>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Company Selection**: Required before viewing employees
 * 2. **Summary Stats**: Quick workforce health overview
 * 3. **Filtering**: Status, search, sort options
 * 4. **Grid Layout**: Responsive 1-3 columns
 * 5. **Empty States**: Clear CTAs for hiring
 * 
 * PREVENTS:
 * - Missing company context
 * - Overwhelming employee lists
 * - Poor filtering UX
 */
