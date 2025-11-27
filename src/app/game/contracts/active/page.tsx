/**
 * @fileoverview Active Contracts Dashboard
 * @module app/(game)/contracts/active
 * 
 * OVERVIEW:
 * Company's active and in-progress contracts.
 * Track status, deadlines, and navigate to execution pages.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Tabs, Tab } from '@heroui/tabs';
import { DashboardLayout } from '@/lib/components/layouts';
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/lib/components/shared';
import { CompanySelector } from '@/lib/components/company';
import { ContractCard } from '@/lib/components/contract';
import { useContracts } from '@/lib/hooks/useContract';

/**
 * Active Contracts Content Component
 * Wrapped in Suspense to handle useSearchParams
 */
function ActiveContractsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');

  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { contracts, isLoading, error } = useContracts(
    companyId || undefined,
    statusFilter !== 'all' ? statusFilter : undefined
  );

  /**
   * Handle company selection
   */
  const handleCompanyChange = (newCompanyId: string) => {
    router.push(`/contracts/active?companyId=${newCompanyId}`);
  };

  /**
   * Handle contract click
   */
  const handleContractClick = (contractId: string, status: string) => {
    if (status === 'active') {
      router.push(`/contracts/${contractId}/execute?companyId=${companyId}`);
    } else if (status === 'in_progress') {
      router.push(`/contracts/${contractId}/execute?companyId=${companyId}`);
    } else {
      router.push(`/contracts/${contractId}?companyId=${companyId}`);
    }
  };

  // Separate contracts by status
  const biddingContracts = contracts?.filter((c: any) => c.status === 'bidding') || [];
  const activeContracts = contracts?.filter((c: any) => c.status === 'active') || [];
  const inProgressContracts = contracts?.filter((c: any) => c.status === 'in_progress') || [];
  const completedContracts = contracts?.filter((c: any) => c.status === 'completed') || [];

  return (
    <DashboardLayout
      title="Active Contracts"
      subtitle="Manage your company's contracts and track progress"
      maxWidth="container.xl"
      actions={
        <Button
          color="primary"
          onPress={() => router.push(`/contracts/marketplace?companyId=${companyId}`)}
        >
          Browse Marketplace
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Company Selector */}
        <div className="flex gap-4">
          <div className="flex-1 max-w-[400px]">
            <CompanySelector
              currentCompanyId={companyId || undefined}
              onSelect={handleCompanyChange}
            />
          </div>
        </div>

        {/* Content */}
        {!companyId ? (
          <EmptyState
            message="Select a company to view contracts"
            description="Choose a company from the selector above"
          />
        ) : isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage error="Failed to load contracts" />
        ) : (
          <Tabs color="primary" aria-label="Contract status tabs">
            <Tab key="bidding" title={
              <div className="flex items-center gap-2">
                Bidding
                {biddingContracts.length > 0 && (
                  <Chip size="sm" color="secondary">{biddingContracts.length}</Chip>
                )}
              </div>
            }>
              {/* Bidding Tab */}
              {biddingContracts.length === 0 ? (
                <EmptyState
                  message="No pending bids"
                  description="Bids you've submitted are waiting for acceptance"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {biddingContracts.map((contract: any) => (
                    <ContractCard
                      key={contract._id}
                      contract={contract}
                      onClick={() => handleContractClick(contract._id, contract.status)}
                    />
                  ))}
                </div>
              )}
            </Tab>

            <Tab key="active" title={
              <div className="flex items-center gap-2">
                Active
                {activeContracts.length > 0 && (
                  <Chip size="sm" color="warning">{activeContracts.length}</Chip>
                )}
              </div>
            }>
              {/* Active Tab */}
              {activeContracts.length === 0 ? (
                <EmptyState
                  message="No active contracts"
                  description="Accepted contracts ready for employee assignment"
                  actionText="Browse Marketplace"
                  onAction={() => router.push(`/contracts/marketplace?companyId=${companyId}`)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {activeContracts.map((contract: any) => (
                    <ContractCard
                      key={contract._id}
                      contract={contract}
                      onClick={() => handleContractClick(contract._id, contract.status)}
                    />
                  ))}
                </div>
              )}
            </Tab>

            <Tab key="in_progress" title={
              <div className="flex items-center gap-2">
                In Progress
                {inProgressContracts.length > 0 && (
                  <Chip size="sm" color="default">{inProgressContracts.length}</Chip>
                )}
              </div>
            }>
              {/* In Progress Tab */}
              {inProgressContracts.length === 0 ? (
                <EmptyState
                  message="No contracts in progress"
                  description="Contracts with assigned employees show here"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {inProgressContracts.map((contract: any) => (
                    <ContractCard
                      key={contract._id}
                      contract={contract}
                      onClick={() => handleContractClick(contract._id, contract.status)}
                    />
                  ))}
                </div>
              )}
            </Tab>

            <Tab key="completed" title={
              <div className="flex items-center gap-2">
                Completed
                {completedContracts.length > 0 && (
                  <Chip size="sm" color="success">{completedContracts.length}</Chip>
                )}
              </div>
            }>
              {/* Completed Tab */}
              {completedContracts.length === 0 ? (
                <EmptyState
                  message="No completed contracts"
                  description="Finished contracts with payout details show here"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {completedContracts.map((contract: any) => (
                    <ContractCard
                      key={contract._id}
                      contract={contract}
                      onClick={() => handleContractClick(contract._id, contract.status)}
                    />
                  ))}
                </div>
              )}
            </Tab>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}

/**
 * Active Contracts Dashboard
 */
export default function ActiveContractsPage() {
  return (
    <DashboardLayout
      title="Active Contracts"
      subtitle="Monitor your company's active and in-progress contracts"
      maxWidth="container.xl"
    >
      <Suspense fallback={<LoadingSpinner />}>
        <ActiveContractsContent />
      </Suspense>
    </DashboardLayout>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Status Tabs**: Organized by contract lifecycle stage
 * 2. **Badge Counts**: Visual indicators for contracts in each status
 * 3. **Smart Navigation**: Routes to appropriate page based on status
 * 4. **Empty States**: Helpful messages and CTAs for each tab
 * 5. **Quick Actions**: Browse marketplace button in header
 * 
 * DISPLAYS:
 * - Bidding: Pending bids awaiting acceptance
 * - Active: Accepted contracts ready for assignment
 * - In Progress: Contracts with employees assigned
 * - Completed: Finished contracts with results
 */
