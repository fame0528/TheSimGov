/**
 * @file app/(game)/companies/[id]/departments/page.tsx
 * @description Department management overview page
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Main dashboard for viewing and managing all company departments (Finance, HR,
 * Marketing, R&D). Displays KPIs, budget allocation, and navigation to detailed
 * department pages. Allows budget reallocation across departments.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import BudgetAllocation from '@/components/departments/BudgetAllocation';

interface Department {
  _id: string;
  type: 'finance' | 'hr' | 'marketing' | 'rd';
  name: string;
  budget: number;
  budgetPercentage: number;
  staffCount: number;
  hasHead: boolean;
  efficiency: number;
  performance: number;
  roi: number;
  // Finance-specific
  creditScore?: number;
  totalDebt?: number;
  cashReserves?: number;
  activeLoans?: number;
  // HR-specific
  turnoverRate?: number;
  avgSatisfaction?: number;
  // Marketing-specific
  brandReputation?: number;
  marketShare?: number;
  activeCampaigns?: number;
  // R&D-specific
  innovationScore?: number;
  technologyLevel?: number;
  activeProjects?: number;
  patentsOwned?: number;
}

interface DepartmentsPageProps {
  params: { id: string };
}

export default function DepartmentsPage({ params }: DepartmentsPageProps) {
  const router = useRouter();
  const { id: companyId } = params;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBudget, setTotalBudget] = useState(0);

  useEffect(() => {
    fetchDepartments();
  }, [companyId]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`/api/departments?companyId=${companyId}`);
      if (!res.ok) throw new Error('Failed to fetch departments');
      const data = await res.json();
      setDepartments(data.departments || []);
      
      // Calculate total budget
      const total = (data.departments || []).reduce(
        (sum: number, d: Department) => sum + d.budget,
        0
      );
      setTotalBudget(total);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetChange = async (allocations: Record<string, number>) => {
    try {
      // Update each department's budget
      const updates = departments.map((dept) => {
        const newBudget = (totalBudget * allocations[dept.type]) / 100;
        return fetch(`/api/departments/${dept._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            budget: newBudget,
            budgetPercentage: allocations[dept.type],
          }),
        });
      });

      await Promise.all(updates);
      toast.success('Budget allocation updated successfully');
      fetchDepartments();
    } catch (error: any) {
      toast.error('Failed to update budget allocation');
    }
  };

  const getDepartmentIcon = (type: string) => {
    switch (type) {
      case 'finance':
        return '💰';
      case 'hr':
        return '👥';
      case 'marketing':
        return '📊';
      case 'rd':
        return '🔬';
      default:
        return '📁';
    }
  };

  const getDepartmentColor = (type: string) => {
    switch (type) {
      case 'finance':
        return 'from-green-500 to-emerald-600';
      case 'hr':
        return 'from-blue-500 to-indigo-600';
      case 'marketing':
        return 'from-purple-500 to-pink-600';
      case 'rd':
        return 'from-orange-500 to-red-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading departments...</div>
      </div>
    );
  }

  const currentAllocations = departments.reduce(
    (acc, dept) => {
      acc[dept.type] = dept.budgetPercentage;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Department Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Oversee and allocate resources across company departments
        </p>
      </div>

      {/* Budget Allocation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Budget Allocation</h2>
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Total Budget: <span className="font-bold">${totalBudget.toLocaleString()}</span>
          </p>
        </div>
        <BudgetAllocation
          allocations={currentAllocations}
          onChange={handleBudgetChange}
        />
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((dept) => (
          <div
            key={dept._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => router.push(`/companies/${companyId}/departments/${dept.type}`)}
          >
            <div className={`bg-gradient-to-r ${getDepartmentColor(dept.type)} p-6 text-white`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <span>{getDepartmentIcon(dept.type)}</span>
                  {dept.name}
                </h3>
                <span className="text-sm opacity-90">
                  {dept.budgetPercentage.toFixed(1)}% Budget
                </span>
              </div>
              <p className="text-lg font-semibold">
                ${dept.budget.toLocaleString()}
              </p>
            </div>

            <div className="p-6">
              {/* Core KPIs */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Staff</p>
                  <p className="text-lg font-bold">
                    {dept.staffCount} {dept.hasHead ? '(with Head)' : '(no Head)'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Efficiency</p>
                  <p className="text-lg font-bold">{dept.efficiency}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Performance</p>
                  <p className="text-lg font-bold">{dept.performance}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">ROI</p>
                  <p className="text-lg font-bold">{dept.roi.toFixed(1)}%</p>
                </div>
              </div>

              {/* Department-specific KPIs */}
              {dept.type === 'finance' && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Credit Score</p>
                    <p className="text-sm font-bold">{dept.creditScore || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active Loans</p>
                    <p className="text-sm font-bold">{dept.activeLoans || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Cash Reserves</p>
                    <p className="text-sm font-bold">${(dept.cashReserves || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Debt</p>
                    <p className="text-sm font-bold">${(dept.totalDebt || 0).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {dept.type === 'hr' && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Turnover Rate</p>
                    <p className="text-sm font-bold">{dept.turnoverRate?.toFixed(1) || 0}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Satisfaction</p>
                    <p className="text-sm font-bold">{dept.avgSatisfaction?.toFixed(1) || 0}%</p>
                  </div>
                </div>
              )}

              {dept.type === 'marketing' && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Brand Reputation</p>
                    <p className="text-sm font-bold">{dept.brandReputation || 0}/100</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Market Share</p>
                    <p className="text-sm font-bold">{dept.marketShare?.toFixed(2) || 0}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active Campaigns</p>
                    <p className="text-sm font-bold">{dept.activeCampaigns || 0}</p>
                  </div>
                </div>
              )}

              {dept.type === 'rd' && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Innovation Score</p>
                    <p className="text-sm font-bold">{dept.innovationScore || 0}/100</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tech Level</p>
                    <p className="text-sm font-bold">{dept.technologyLevel || 0}/10</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active Projects</p>
                    <p className="text-sm font-bold">{dept.activeProjects || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Patents Owned</p>
                    <p className="text-sm font-bold">{dept.patentsOwned || 0}</p>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded transition-colors">
                  View {dept.name} Details →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Department Button (if missing types) */}
      {departments.length < 4 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Missing departments detected. Some department types are not yet created.
          </p>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded transition-colors"
            onClick={() => toast.info('Department creation coming soon')}
          >
            Create Missing Departments
          </button>
        </div>
      )}
    </div>
  );
}
