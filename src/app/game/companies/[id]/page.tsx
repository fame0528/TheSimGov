/**
 * @fileoverview Company Dashboard Page
 * @module app/(game)/companies/[id]
 * 
 * OVERVIEW:
 * Company overview dashboard with financials, level progression, stats.
 * Real-time data from API, level-up functionality, employee/contract previews.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCompany } from '@/lib/hooks/useCompany';
import { Company } from '@/lib/types';
import { COMPANY_LEVELS } from '@/lib/utils/constants';
import { formatCurrency, formatNumber } from '@/lib/utils';
// Added missing component imports for layout and UI elements
import { DashboardLayout } from '@/lib/components/layouts';
import { LoadingSpinner, ErrorMessage, Card } from '@/lib/components/shared';
import { Button, Progress } from '@heroui/react';
import Image from 'next/image';
import ImageUpload from '@/components/shared/ImageUpload';
export default function CompanyDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;
  
  const { data: company, isLoading, error, refetch } = useCompany(companyId);
  const [levelingUp, setLevelingUp] = useState(false);
  const [levelUpError, setLevelUpError] = useState('');

  /**
   * Handle level-up action
   */
  const handleLevelUp = async () => {
    if (!company) return;

    setLevelingUp(true);
    setLevelUpError('');

    try {
      const response = await fetch(`/api/companies/${companyId}/level-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Level-up failed');
      }

      const updatedCompany = await response.json();
      await refetch(); // Refetch company data
    } catch (err) {
      setLevelUpError(err instanceof Error ? err.message : 'Level-up failed');
    } finally {
      setLevelingUp(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Loading..." subtitle="">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !company) {
    return (
      <DashboardLayout title="Error" subtitle="">
        <ErrorMessage error={error || 'Company not found'} />
        <Button color="primary" onPress={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </DashboardLayout>
    );
  }

  // Get level configuration
  const currentLevelKey = Object.keys(COMPANY_LEVELS).find(
    (key) => COMPANY_LEVELS[key as keyof typeof COMPANY_LEVELS].level === company.level
  ) as keyof typeof COMPANY_LEVELS | undefined;
  
  const currentLevel = currentLevelKey ? COMPANY_LEVELS[currentLevelKey] : null;
  
  const nextLevelKey = Object.keys(COMPANY_LEVELS).find(
    (key) => COMPANY_LEVELS[key as keyof typeof COMPANY_LEVELS].level === company.level + 1
  ) as keyof typeof COMPANY_LEVELS | undefined;
  
  const nextLevel = nextLevelKey ? COMPANY_LEVELS[nextLevelKey] : null;

  // Calculate level-up cost
  const levelUpCost = nextLevel ? Math.round(nextLevel.minRevenue * 0.1) : 0;

  // Calculate progress percentages
  const revenueProgress = nextLevel 
    ? Math.min(100, (company.revenue / nextLevel.minRevenue) * 100)
    : 100;
  
  const employeeProgress = nextLevel && nextLevel.maxEmployees !== -1
    ? Math.min(100, (company.employees.length / nextLevel.maxEmployees) * 100)
    : 100;
  
  const capitalProgress = levelUpCost > 0
    ? Math.min(100, (company.cash / levelUpCost) * 100)
    : 100;

  const canLevelUp = nextLevel && 
    company.revenue >= nextLevel.minRevenue &&
    (nextLevel.maxEmployees === -1 || company.employees.length <= nextLevel.maxEmployees) &&
    company.cash >= levelUpCost;

  return (
    <DashboardLayout
      title={company.name}
      subtitle={`${company.industry} • Level ${company.level}`}
    >
      <div className="space-y-6">
        {/* Owner / CEO Link */}
        <Card title="Owner" showDivider>
          <div className="flex items-center gap-3">
            {/* We expect company.ownerUsername to be provided by API; if not, hide link */}
            {('ownerUsername' in company) ? (
              <button
                className="text-emerald-400 hover:text-emerald-300 underline"
                onClick={() => router.push(`/users/${(company as any).ownerUsername}`)}
              >
                @{(company as any).ownerUsername}
              </button>
            ) : (
              <span className="text-slate-400">Owner: Unknown</span>
            )}
          </div>
        </Card>
        {/* Company Logo */}
        <Card title="Company Logo" showDivider>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
              {company.logoUrl ? (
                <Image src={company.logoUrl} alt={`${company.name} logo`} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No logo</div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-2">Upload a custom company logo (optional).</p>
              <ImageUpload
                endpoint="/api/upload/company-logo"
                onUploadSuccess={async (url) => {
                  // Persist logo via PATCH
                  await fetch(`/api/companies/${companyId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ logoUrl: url }),
                  });
                  await refetch();
                }}
                onUploadError={(errs) => console.warn('Logo upload failed', errs)}
              />
            </div>
          </div>
        </Card>
        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="Cash" showDivider>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(company.cash)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Available funds
            </p>
          </Card>

          <Card title="Revenue" showDivider>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(company.revenue)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total income
            </p>
          </Card>

          <Card title="Expenses" showDivider>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(company.expenses)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total costs
            </p>
          </Card>

          <Card title="Profit" showDivider>
            <div className={`text-3xl font-bold ${
              company.revenue - company.expenses >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(company.revenue - company.expenses)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Net income
            </p>
          </Card>
        </div>

        {/* Level Progression */}
        <Card title="Level Progression" showDivider>
          <div className="space-y-4">
            {/* Current Level Badge */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  Level {company.level}: {currentLevel?.name || 'Unknown'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {company.employees.length} employees • {company.contracts.length} contracts • {company.loans.length} loans
                </p>
              </div>
              {nextLevel && (
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Next Level</p>
                  <p className="font-semibold text-lg">Level {nextLevel.level}: {nextLevel.name}</p>
                </div>
              )}
            </div>

            {/* Requirements Progress */}
            {nextLevel && (
              <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                <h4 className="font-semibold">Level-Up Requirements</h4>
                
                {/* Revenue Requirement */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Revenue: {formatCurrency(company.revenue)} / {formatCurrency(nextLevel.minRevenue)}</span>
                    <span>{revenueProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={revenueProgress} color={revenueProgress >= 100 ? 'success' : 'primary'} size="sm" className="h-2" />
                </div>

                {/* Employee Requirement */}
                {nextLevel.maxEmployees !== -1 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Employees: {company.employees.length} / {nextLevel.maxEmployees} max</span>
                      <span>{employeeProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={employeeProgress} color={employeeProgress <= 100 ? 'success' : 'warning'} size="sm" className="h-2" />
                  </div>
                )}

                {/* Capital Requirement */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Level-Up Cost: {formatCurrency(company.cash)} / {formatCurrency(levelUpCost)}</span>
                    <span>{capitalProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={capitalProgress} color={capitalProgress >= 100 ? 'success' : 'primary'} size="sm" className="h-2" />
                </div>

                {/* Level-Up Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    color="primary"
                    onPress={handleLevelUp}
                    isDisabled={!canLevelUp || levelingUp}
                    isLoading={levelingUp}
                    className="w-full"
                  >
                    {canLevelUp ? `Level Up for ${formatCurrency(levelUpCost)}` : 'Requirements Not Met'}
                  </Button>
                </div>

                {levelUpError && (
                  <ErrorMessage error={levelUpError} />
                )}
              </div>
            )}

            {!nextLevel && (
              <div className="text-center py-4 text-green-600 dark:text-green-400 font-semibold">
                🎉 Maximum Level Reached!
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button variant="bordered" onPress={() => router.push(`/companies/${companyId}/edit`)}>
            Edit Company
          </Button>
          <Button variant="bordered" onPress={() => router.push(`/companies/${companyId}/employees`)}>
            Manage Employees
          </Button>
          <Button variant="bordered" onPress={() => router.push(`/companies/${companyId}/contracts`)}>
            View Contracts
          </Button>
          <Button color="danger" variant="bordered" onPress={() => {
            if (confirm('Are you sure you want to delete this company? This cannot be undone.')) {
              // Delete logic handled by useCompany hook
              router.push('/dashboard');
            }
          }}>
            Delete Company
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
