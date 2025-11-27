/**
 * @file components/departments/CashflowChart.tsx
 * @description 12-month cashflow projection chart using recharts
 * @created 2025-11-13
 */

'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { projectCashflow } from '@/lib/utils/finance/cashflowProjection';

interface CashflowChartProps {
  companyId: string;
}

export default function CashflowChart({ companyId }: CashflowChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAndProjectCashflow();
  }, [companyId]);

  const fetchAndProjectCashflow = async () => {
    try {
      // Fetch company and department data
      const [companyRes, deptsRes, loansRes] = await Promise.all([
        fetch(`/api/companies/${companyId}`),
        fetch(`/api/departments?companyId=${companyId}`),
        fetch(`/api/departments/finance/loans?companyId=${companyId}`),
      ]);

      const company = await companyRes.json();
      const deptsData = await deptsRes.json();
      const loansData = await loansRes.json();

      // Project cashflow
      const projection = projectCashflow({
        startingCash: company.cash || 0,
        monthlyRevenue: company.cash / 12 || 10000, // Rough estimate
        monthlyExpenses: deptsData.departments?.reduce((sum: number, d: any) => sum + d.budget / 12, 0) || 5000,
        growthRate: 0.05, // 5% monthly growth
        seasonality: {
          q1: 0.85,
          q2: 1.05,
          q3: 1.20,
          q4: 0.95,
        },
        departmentBudgets: deptsData.departments?.reduce((acc: any, d: any) => {
          acc[d.type] = d.budget / 12;
          return acc;
        }, {}),
        loanPayments: loansData.loans
          ?.filter((l: any) => l.status === 'Active')
          ?.map((l: any) => ({
            amount: l.monthlyPayment,
            startMonth: 1,
            endMonth: l.remainingPayments || 12,
          })) || [],
      });

      // Format for chart
      const formatted = projection.months.map((month) => ({
        month: month.date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: Math.round(month.revenue),
        expenses: Math.round(month.expenses),
        netCashflow: Math.round(month.netCashflow),
        cumulativeCash: Math.round(month.cumulativeCash),
      }));

      setChartData(formatted);
    } catch (error) {
      console.error('Cashflow projection error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading cashflow projection...</div>;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2}
            name="Revenue"
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="#ef4444"
            strokeWidth={2}
            name="Expenses"
          />
          <Line
            type="monotone"
            dataKey="cumulativeCash"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Cash Balance"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Monthly Revenue</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            ${Math.round(chartData.reduce((sum, m) => sum + m.revenue, 0) / chartData.length).toLocaleString()}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Monthly Expenses</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">
            ${Math.round(chartData.reduce((sum, m) => sum + m.expenses, 0) / chartData.length).toLocaleString()}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Projected Cash (12mo)</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            ${chartData[chartData.length - 1]?.cumulativeCash.toLocaleString() || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
