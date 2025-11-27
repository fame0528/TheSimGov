/**
 * @fileoverview Infrastructure Test Page
 * @module app/test-infrastructure/page
 * 
 * OVERVIEW:
 * Comprehensive UI demonstration of ALL infrastructure components.
 * Tests hooks, components, layouts, contexts, and utilities.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useState } from 'react';
import { Button } from '@heroui/react';
import { DashboardLayout } from '@/lib/components/layouts';
import {
  LoadingSpinner,
  ErrorMessage,
  ConfirmDialog,
  DataTable,
  FormField,
  Card,
  EmptyState,
} from '@/lib/components/shared';
import { useToast, useModal, usePagination, useSort, useDebounce } from '@/lib/hooks/ui';
import { formatCurrency, formatPercent, pluralize } from '@/lib/utils';
import { Company, IndustryType } from '@/lib/types';

/**
 * Test Infrastructure Page
 * 
 * Demonstrates all infrastructure layers:
 * - Layouts: DashboardLayout
 * - Shared Components: All 7 components
 * - UI Hooks: Toast, Modal, Pagination, Sort, Debounce
 * - Utilities: Currency, formatting
 * - Types: Company interface
 */
export default function TestInfrastructurePage() {
  const toast = useToast();
  const modal = useModal();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  // Mock data for table
  const companies: Company[] = [
    {
      id: '1',
      userId: 'user1',
      name: 'TechCorp Industries',
      industry: IndustryType.TECH,
      description: 'Leading tech company',
      foundedAt: new Date(),
      level: 3,
      revenue: 1500000,
      expenses: 900000,
      cash: 600000,
      netWorth: 600000,
      creditScore: 750,
      employees: [],
      contracts: [],
      loans: [],
    },
    {
      id: '2',
      userId: 'user1',
      name: 'Green Energy Solutions',
      industry: IndustryType.ENERGY,
      description: 'Clean energy pioneer',
      foundedAt: new Date(),
      level: 2,
      revenue: 750000,
      expenses: 450000,
      cash: 300000,
      netWorth: 300000,
      creditScore: 680,
      employees: [],
      contracts: [],
      loans: [],
    },
  ];

  const sort = useSort<keyof Company>({ initialColumn: 'name', initialDirection: 'asc' });
  const pagination = usePagination({ totalItems: companies.length, pageSize: 5 });

  const columns = [
    { header: 'Name', accessor: 'name' as const, sortable: true },
    { header: 'Industry', accessor: 'industry' as const, sortable: true },
    { header: 'Level', accessor: 'level' as const, sortable: true },
    {
      header: 'Revenue',
      accessor: (row: Company) => formatCurrency(row.revenue),
      sortable: false,
    },
    {
      header: 'Profit Margin',
      accessor: (row: Company) =>
        formatPercent((row.revenue - row.expenses) / row.revenue),
      sortable: false,
    },
  ];

  return (
    <DashboardLayout
      title="Infrastructure Test"
      subtitle="Comprehensive demonstration of all infrastructure components"
      actions={
        <div className="flex gap-2">
          <Button onPress={() => toast.success('Success toast!')}>Test Toast</Button>
          <Button onPress={modal.open}>Test Modal</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Toast & Modal Demo */}
        <Card title="UI Hooks Demo">
          <div className="flex gap-3">
            <Button onPress={() => toast.success('Success!')}>Success</Button>
            <Button onPress={() => toast.error('Error!')}>Error</Button>
            <Button onPress={() => toast.warning('Warning!')}>Warning</Button>
            <Button onPress={() => toast.info('Info!')}>Info</Button>
          </div>
          <p className="mt-4 text-sm text-default-600">
            Debounced search: {debouncedSearch || '(empty)'}
          </p>
        </Card>

        {/* Components Demo */}
        <Card title="Shared Components Demo">
          <div className="flex flex-col gap-4">
            <FormField
              label="Search Companies"
              name="search"
              value={search}
              onChange={(value) => setSearch(value as string)}
              placeholder="Type to test debounce..."
            />
            <div className="flex gap-2 items-center">
              <LoadingSpinner size="sm" message="Loading..." />
              <p className="text-sm">← Loading Spinner</p>
            </div>
          </div>
        </Card>

        {/* Data Table Demo */}
        <Card title="Data Table with Pagination & Sort">
          <DataTable
            data={companies}
            columns={columns}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.goToPage}
            sortColumn={sort.column ?? undefined}
            sortDirection={sort.direction ?? undefined}
            onSort={sort.toggleSort}
          />
          <p className="mt-4 text-sm text-default-600">
            Showing {companies.length} {pluralize(companies.length, 'company')}
          </p>
        </Card>

        {/* Empty State Demo */}
        <Card title="Empty State Demo">
          <EmptyState
            message="No data found"
            description="This demonstrates the EmptyState component"
            actionText="Create Something"
            onAction={() => toast.info('Action clicked!')}
          />
        </Card>

        {/* Error Message Demo */}
        <Card title="Error Message Demo">
          <ErrorMessage
            error={new Error('This is a sample error message')}
            onRetry={() => toast.info('Retry clicked!')}
          />
        </Card>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={modal.isOpen}
        onClose={modal.close}
        onConfirm={() => {
          toast.success('Confirmed!');
          modal.close();
        }}
        title="Test Confirmation"
        message="This is a test of the ConfirmDialog component"
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </DashboardLayout>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * This page demonstrates:
 * 1. ✅ DashboardLayout with title, subtitle, actions
 * 2. ✅ All 7 shared components (LoadingSpinner, ErrorMessage, etc.)
 * 3. ✅ All 5 UI hooks (useToast, useModal, usePagination, useSort, useDebounce)
 * 4. ✅ Utility functions (formatCurrency, formatPercent, pluralize)
 * 5. ✅ TypeScript types (Company interface)
 * 6. ✅ Chakra UI integration
 * 
 * USAGE:
 * Navigate to http://localhost:3000/test-infrastructure
 */
