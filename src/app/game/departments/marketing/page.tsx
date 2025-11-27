/**
 * @fileoverview Marketing Department Page
 * @module app/game/departments/marketing
 * 
 * OVERVIEW:
 * Marketing department detail page with campaigns, brand metrics.
 * Uses MarketingDashboard component for maximum code reuse.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MarketingDashboard } from '@/lib/components/departments';
import { MarketingCampaignModal } from '@/lib/components/departments/modals';
import { DashboardLayout } from '@/lib/components/layouts';
import { LoadingSpinner, ErrorMessage } from '@/lib/components/shared';
import type { MarketingDepartment } from '@/lib/types/department';

/**
 * Marketing Department Page
 * 
 * FEATURES:
 * - Complete marketing dashboard
 * - Campaign creation (modal)
 * - Brand value tracking
 * - Customer acquisition metrics
 */
export default function MarketingDepartmentPage() {
  const { status } = useSession();
  const [department, setDepartment] = useState<MarketingDepartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  /**
   * Fetch marketing department data
   */
  const fetchDepartment = async () => {
    if (status !== 'authenticated') return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/departments/marketing');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch marketing department');
      }

      const data = await response.json();
      setDepartment(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load marketing department');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartment();
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout title="Marketing Department" subtitle="Brand and customer growth">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !department) {
    return (
      <DashboardLayout title="Marketing Department" subtitle="Brand and customer growth">
        <ErrorMessage error={error || 'Marketing department not found'} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Marketing Department" 
      subtitle={`Level ${department.level} • Building your brand`}
    >
      <MarketingDashboard
        department={department}
        onLaunchCampaign={() => setShowCampaignModal(true)}
        onRefresh={fetchDepartment}
      />

      <MarketingCampaignModal
        isOpen={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
        onSuccess={fetchDepartment}
      />
    </DashboardLayout>
  );
}
