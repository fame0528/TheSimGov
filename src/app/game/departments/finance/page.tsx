/**
 * @fileoverview Finance Department Page
 * @module app/game/departments/finance
 * 
 * OVERVIEW:
 * Finance department detail page with loans, investments, P&L.
 * Uses FinanceDashboard component for maximum code reuse.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FinanceDashboard } from '@/lib/components/departments';
import { LoanApplicationModal, InvestmentModal } from '@/lib/components/departments/modals';
import { DashboardLayout } from '@/lib/components/layouts';
import { LoadingSpinner, ErrorMessage } from '@/lib/components/shared';
import type { FinanceDepartment } from '@/lib/types/department';

/**
 * Finance Department Page
 * 
 * FEATURES:
 * - Complete finance dashboard
 * - Loan applications (modal)
 * - Investment creation (modal)
 * - Real-time data updates
 */
export default function FinanceDepartmentPage() {
  const { status } = useSession();
  const [department, setDepartment] = useState<FinanceDepartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);

  /**
   * Fetch finance department data
   */
  const fetchDepartment = async () => {
    if (status !== 'authenticated') return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/departments/finance');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch finance department');
      }

      const data = await response.json();
      setDepartment(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load finance department');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartment();
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout title="Finance Department" subtitle="Financial operations">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !department) {
    return (
      <DashboardLayout title="Finance Department" subtitle="Financial operations">
        <ErrorMessage error={error || 'Finance department not found'} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Finance Department" 
      subtitle={`Level ${department.level} • Managing company finances`}
    >
      <FinanceDashboard
        department={department}
        onApplyLoan={() => setShowLoanModal(true)}
        onCreateInvestment={() => setShowInvestmentModal(true)}
        onRefresh={fetchDepartment}
      />

      <LoanApplicationModal
        isOpen={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        onSuccess={fetchDepartment}
      />

      <InvestmentModal
        isOpen={showInvestmentModal}
        onClose={() => setShowInvestmentModal(false)}
        onSuccess={fetchDepartment}
      />
    </DashboardLayout>
  );
}
