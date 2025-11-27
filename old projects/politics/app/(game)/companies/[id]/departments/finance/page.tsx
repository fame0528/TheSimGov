/**
 * @file app/(game)/companies/[id]/departments/finance/page.tsx
 * @description Finance department dashboard with loans and cashflow
 * @created 2025-11-13
 */

'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import CashflowChart from '@/components/departments/CashflowChart';
import LoanCard from '@/components/departments/LoanCard';

interface Loan {
  _id: string;
  loanType: string;
  principal: number;
  balance: number;
  interestRate: number;
  monthlyPayment: number;
  status: string;
  nextPaymentDate: string;
  remainingPayments: number;
  percentPaidOff: number;
}

export default function FinanceDepartmentPage({ params }: { params: { id: string } }) {
  const { id: companyId } = params;
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditScore, setCreditScore] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [activeLoans, setActiveLoans] = useState(0);

  useEffect(() => {
    fetchFinanceData();
  }, [companyId]);

  const fetchFinanceData = async () => {
    try {
      const [loansRes, deptRes] = await Promise.all([
        fetch(`/api/departments/finance/loans?companyId=${companyId}`),
        fetch(`/api/departments?companyId=${companyId}&type=finance`),
      ]);

      if (!loansRes.ok || !deptRes.ok) throw new Error('Failed to fetch finance data');

      const loansData = await loansRes.json();
      const deptData = await deptRes.json();

      setLoans(loansData.loans || []);
      setTotalDebt(loansData.totalDebt || 0);
      setActiveLoans(loansData.activeLoans || 0);

      const financeDept = deptData.departments?.[0];
      if (financeDept) {
        setCreditScore(financeDept.creditScore || 0);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch finance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading finance department...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">💰 Finance Department</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage loans, investments, and financial health
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Credit Score</p>
          <p className="text-3xl font-bold">{creditScore}</p>
          <p className="text-xs mt-1">
            {creditScore >= 740 ? '✅ Excellent' : creditScore >= 670 ? '✅ Good' : creditScore >= 580 ? '⚠️ Fair' : '❌ Poor'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Loans</p>
          <p className="text-3xl font-bold">{activeLoans}</p>
          <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
            Total Debt: ${totalDebt.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Debt Service</p>
          <p className="text-3xl font-bold">
            ${loans.filter(l => l.status === 'Active').reduce((sum, l) => sum + l.monthlyPayment, 0).toLocaleString()}
          </p>
          <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
            Total payments/month
          </p>
        </div>
      </div>

      {/* Cashflow Projection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">12-Month Cashflow Projection</h2>
        <CashflowChart companyId={companyId} />
      </div>

      {/* Loans Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Active Loans</h2>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors"
            onClick={() => toast.info('Apply for loan feature coming soon')}
          >
            + Apply for Loan
          </button>
        </div>

        {loans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No loans currently</p>
            <p className="text-sm">Apply for financing to grow your company</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loans.map((loan) => (
              <LoanCard key={loan._id} loan={loan} onUpdate={fetchFinanceData} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
