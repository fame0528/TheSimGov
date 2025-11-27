/**
 * @fileoverview Departments Overview Page
 * @module app/game/departments
 * 
 * OVERVIEW:
 * Main departments dashboard showing all 4 departments (Finance, HR, Marketing, R&D).
 * Uses DepartmentsList component for maximum code reuse.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DepartmentsList } from '@/lib/components/departments';
import { DashboardLayout } from '@/lib/components/layouts';
import { LoadingSpinner, ErrorMessage } from '@/lib/components/shared';
import type { Department } from '@/lib/types/department';

/**
 * Departments Overview Page
 * 
 * FEATURES:
 * - Displays all 4 departments in grid layout
 * - Navigate to department detail pages
 * - Upgrade department action
 * - Real-time data from API
 * 
 * NAVIGATION:
 * - Click department card → detail page
 * - Click upgrade → upgrade department
 */
export default function DepartmentsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all departments for current company
   */
  useEffect(() => {
    const fetchDepartments = async () => {
      if (status !== 'authenticated') return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/departments');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch departments');
        }

        const data = await response.json();
        setDepartments(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load departments');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, [status]);

  /**
   * Navigate to department detail page
   */
  const handleViewDepartment = (departmentType: string) => {
    router.push(`/game/departments/${departmentType}`);
  };

  /**
   * Handle department upgrade
   */
  const handleUpgradeDepartment = async (departmentType: string) => {
    try {
      const response = await fetch(`/api/departments/${departmentType}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upgrade failed');
      }

      // Refresh departments list
      const refreshResponse = await fetch('/api/departments');
      const refreshData = await refreshResponse.json();
      setDepartments(refreshData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade failed');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout title="Departments" subtitle="Managing your company departments">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Departments" subtitle="Managing your company departments">
        <ErrorMessage error={error} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Departments" 
      subtitle="Manage Finance, HR, Marketing, and R&D departments"
    >
      <DepartmentsList
        departments={departments}
        onViewDepartment={handleViewDepartment}
        onUpgradeDepartment={handleUpgradeDepartment}
      />
    </DashboardLayout>
  );
}
