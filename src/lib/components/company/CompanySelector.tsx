/**
 * @fileoverview Company Selector Component
 * @module lib/components/company/CompanySelector
 * 
 * OVERVIEW:
 * Dropdown selector for switching between user's companies.
 * Displays company name, level, industry with "Create New" option.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanies } from '@/lib/hooks/useCompany';
import { Company } from '@/lib/types';
import { LoadingSpinner } from '@/lib/components/shared';

/**
 * Company Selector Props
 */
interface CompanySelectorProps {
  /** Currently selected company ID */
  currentCompanyId?: string;
  /** Callback when company is selected */
  onSelect?: (companyId: string) => void;
  /** Show "Create New" option */
  showCreateOption?: boolean;
}

/**
 * Company Selector Component
 * 
 * FEATURES:
 * - Lists all user's companies
 * - Quick switching between companies
 * - "Create New Company" option
 * - Loading and error states
 * 
 * USAGE:
 * ```tsx
 * <CompanySelector 
 *   currentCompanyId={companyId}
 *   onSelect={(id) => router.push(`/companies/${id}`)}
 *   showCreateOption
 * />
 * ```
 */
export function CompanySelector({
  currentCompanyId,
  onSelect,
  showCreateOption = true,
}: CompanySelectorProps) {
  const router = useRouter();
  const { data: companies, isLoading, error } = useCompanies();

  /**
   * Handle company selection
   */
  const handleSelect = (companyId: string) => {
    if (companyId === 'create') {
      router.push('/companies/create');
    } else if (onSelect) {
      onSelect(companyId);
    } else {
      router.push(`/companies/${companyId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Loading companies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg bg-red-50 dark:bg-red-900/20">
        <span className="text-sm text-red-600 dark:text-red-400">Failed to load companies</span>
      </div>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <button
        onClick={() => router.push('/companies/create')}
        className="w-full px-4 py-3 text-left border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">➕</span>
          <div>
            <p className="font-semibold text-blue-600 dark:text-blue-400">Create Your First Company</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Start your business empire</p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="relative">
      <select
        value={currentCompanyId || ''}
        onChange={(e) => handleSelect(e.target.value)}
        className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer appearance-none"
      >
        <option value="" disabled>
          Select a company...
        </option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name} • L{company.level} • {company.industry}
          </option>
        ))}
        {showCreateOption && (
          <option value="create" className="font-semibold">
            ➕ Create New Company
          </option>
        )}
      </select>
      
      {/* Dropdown Arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * Compact Company Selector (for headers/navigation)
 */
export function CompactCompanySelector({ currentCompanyId }: { currentCompanyId?: string }) {
  const router = useRouter();
  const { data: companies, isLoading } = useCompanies();

  const currentCompany = companies?.find((c) => c.id === currentCompanyId);

  if (isLoading) {
    return <LoadingSpinner size="sm" />;
  }

  return (
    <select
      value={currentCompanyId || ''}
      onChange={(e) => {
        if (e.target.value === 'create') {
          router.push('/companies/create');
        } else {
          router.push(`/companies/${e.target.value}`);
        }
      }}
      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {currentCompany ? (
        <option value={currentCompany.id}>
          {currentCompany.name} (L{currentCompany.level})
        </option>
      ) : (
        <option value="" disabled>
          Select company
        </option>
      )}
      {companies?.filter(c => c.id !== currentCompanyId).map((company) => (
        <option key={company.id} value={company.id}>
          {company.name} (L{company.level})
        </option>
      ))}
      <option value="create">➕ New Company</option>
    </select>
  );
}
