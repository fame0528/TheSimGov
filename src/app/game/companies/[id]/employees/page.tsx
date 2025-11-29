/**
 * @fileoverview Employee Management Page for Company
 * @module app/(game)/companies/[id]/employees
 * 
 * OVERVIEW:
 * Dedicated employee management interface for a specific company.
 * Integrates all employee components (OrgChart, Directory, Reviews, 
 * Onboarding, Training) into unified dashboard.
 * 
 * ROUTE:
 * /game/companies/[id]/employees
 * 
 * FEATURES:
 * - Tab-based navigation across all employee features
 * - Real-time employee data loading
 * - Complete integration with employee infrastructure
 * - Consistent company context
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCompany } from '@/lib/hooks/useCompany';
import { EmployeeDashboardWrapper } from '@/components/employee';
import { LoadingSpinner, ErrorMessage } from '@/lib/components/shared';
import { DashboardLayout } from '@/lib/components/layouts';
import { Button } from '@heroui/react';

/**
 * Extended company interface for runtime properties
 */
interface ExtendedCompany {
  id: string;
  name: string;
  industry: string;
  level: number;
  employees: string[];
  ownerUsername?: string;
}

/**
 * Employee Management Page Component
 * 
 * Renders EmployeeDashboardWrapper for complete employee management.
 * Handles loading, error states, and company data fetching.
 * 
 * @returns Rendered employee management page
 * 
 * @example
 * Route: /game/companies/123/employees
 * Displays: EmployeeDashboardWrapper with 5 tabs
 */
export default function EmployeeManagementPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;
  
  const { data: company, isLoading, error } = useCompany(companyId);

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout title="Loading..." subtitle="Employee Management">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !company) {
    return (
      <DashboardLayout title="Error" subtitle="Employee Management">
        <ErrorMessage error={error || 'Company not found'} />
        <Button color="primary" onPress={() => router.push('/game/dashboard')}>
          Back to Dashboard
        </Button>
      </DashboardLayout>
    );
  }

  // Cast to extended company type
  const extendedCompany = company as ExtendedCompany;

  // Render employee dashboard wrapper
  return (
    <EmployeeDashboardWrapper
      company={extendedCompany}
      companyId={companyId}
    />
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * ROUTING PATTERN:
 * - /game/companies/[id] → GenericCompanyDashboard (with employee button)
 * - /game/companies/[id]/employees → EmployeeDashboardWrapper (this page)
 * - Clean separation of concerns
 * - Consistent navigation flow
 * 
 * COMPONENT ARCHITECTURE:
 * - This page is a thin wrapper around EmployeeDashboardWrapper
 * - Handles data fetching and error states
 * - EmployeeDashboardWrapper handles all employee UI
 * - Zero duplication of employee logic
 * 
 * DATA FLOW:
 * 1. Page fetches company data via useCompany hook
 * 2. Passes company + companyId to EmployeeDashboardWrapper
 * 3. Wrapper manages tab navigation
 * 4. Child components (OrgChart, Directory, etc.) handle their own data
 * 
 * USER JOURNEY:
 * Company Dashboard → Click "Employee Management" → This Page → 5-Tab Interface
 * 
 * ARCHITECTURE COMPLIANCE:
 * ✅ Utility-First: Composes from EmployeeDashboardWrapper
 * ✅ Zero Duplication: No employee logic in this file
 * ✅ AAA Quality: Complete implementation with proper error handling
 * ✅ DRY Principle: Single source of employee UI (EmployeeDashboardWrapper)
 * 
 * @updated 2025-11-28
 * @author ECHO v1.3.1
 */
