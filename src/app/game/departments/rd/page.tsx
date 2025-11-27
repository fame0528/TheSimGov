/**
 * @fileoverview R&D Department Page
 * @module app/game/departments/rd
 * 
 * OVERVIEW:
 * R&D department detail page with research, patents, innovation.
 * Uses RDDashboard component for maximum code reuse.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { RDDashboard } from '@/lib/components/departments';
import { ResearchProjectModal } from '@/lib/components/departments/modals';
import { DashboardLayout } from '@/lib/components/layouts';
import { LoadingSpinner, ErrorMessage } from '@/lib/components/shared';
import type { RDDepartment } from '@/lib/types/department';

/**
 * R&D Department Page
 * 
 * FEATURES:
 * - Complete R&D dashboard
 * - Research project creation (modal)
 * - Patent portfolio tracking
 * - Innovation metrics
 */
export default function RDDepartmentPage() {
  const { status } = useSession();
  const [department, setDepartment] = useState<RDDepartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResearchModal, setShowResearchModal] = useState(false);

  /**
   * Fetch R&D department data
   */
  const fetchDepartment = async () => {
    if (status !== 'authenticated') return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/departments/rd');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch R&D department');
      }

      const data = await response.json();
      setDepartment(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load R&D department');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartment();
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout title="R&D Department" subtitle="Research and innovation">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !department) {
    return (
      <DashboardLayout title="R&D Department" subtitle="Research and innovation">
        <ErrorMessage error={error || 'R&D department not found'} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="R&D Department" 
      subtitle={`Level ${department.level} • Driving innovation`}
    >
      <RDDashboard
        department={department}
        onStartResearch={() => setShowResearchModal(true)}
        onRefresh={fetchDepartment}
      />

      <ResearchProjectModal
        isOpen={showResearchModal}
        onClose={() => setShowResearchModal(false)}
        onSuccess={fetchDepartment}
      />
    </DashboardLayout>
  );
}
