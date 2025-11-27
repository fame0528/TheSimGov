/**
 * @fileoverview HR Department Page
 * @module app/game/departments/hr
 * 
 * OVERVIEW:
 * HR department detail page with training, recruitment, skills.
 * Uses HRDashboard component for maximum code reuse.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { HRDashboard } from '@/lib/components/departments';
import { TrainingProgramModal, RecruitmentModal } from '@/lib/components/departments/modals';
import { DashboardLayout } from '@/lib/components/layouts';
import { LoadingSpinner, ErrorMessage } from '@/lib/components/shared';
import type { HRDepartment } from '@/lib/types/department';

/**
 * HR Department Page
 * 
 * FEATURES:
 * - Complete HR dashboard
 * - Training program creation (modal)
 * - Recruitment campaigns (modal)
 * - Skills inventory tracking
 */
export default function HRDepartmentPage() {
  const { status } = useSession();
  const [department, setDepartment] = useState<HRDepartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showRecruitmentModal, setShowRecruitmentModal] = useState(false);

  /**
   * Fetch HR department data
   */
  const fetchDepartment = async () => {
    if (status !== 'authenticated') return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/departments/hr');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch HR department');
      }

      const data = await response.json();
      setDepartment(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load HR department');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartment();
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout title="HR Department" subtitle="Human resources management">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !department) {
    return (
      <DashboardLayout title="HR Department" subtitle="Human resources management">
        <ErrorMessage error={error || 'HR department not found'} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="HR Department" 
      subtitle={`Level ${department.level} • Managing employees and talent`}
    >
      <HRDashboard
        department={department}
        onCreateTraining={() => setShowTrainingModal(true)}
        onLaunchRecruitment={() => setShowRecruitmentModal(true)}
        onRefresh={fetchDepartment}
      />

      <TrainingProgramModal
        isOpen={showTrainingModal}
        onClose={() => setShowTrainingModal(false)}
        onSuccess={fetchDepartment}
      />

      <RecruitmentModal
        isOpen={showRecruitmentModal}
        onClose={() => setShowRecruitmentModal(false)}
        onSuccess={fetchDepartment}
      />
    </DashboardLayout>
  );
}
