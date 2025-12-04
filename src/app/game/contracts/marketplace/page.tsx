/**
 * @fileoverview Contract Marketplace Page
 * @module app/(game)/contracts/marketplace
 * 
 * OVERVIEW:
 * Browse available NPC contracts scaled to company level.
 * Filter by difficulty, industry. View details and submit bids.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@heroui/button';
import { Select, SelectItem } from '@heroui/select';
import { Chip } from '@heroui/chip';
import { Card, CardBody } from '@heroui/react';
import { DashboardLayout } from '@/lib/components/layouts';
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/lib/components/shared';
import { CompanySelector } from '@/lib/components/company';
import { ContractCard } from '@/lib/components/contract';
import { useMarketplace } from '@/lib/hooks/useContract';
import { useCompanies } from '@/lib/hooks/useCompany';

/**
 * Contract Marketplace Content Component
 * Wrapped in Suspense to handle useSearchParams
 */
function ContractMarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');
  const { status } = useSession();

  const [mounted, setMounted] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const authReady = mounted && status !== 'loading' && status === 'authenticated';
  const {
    data: companies,
    isLoading: companiesLoading,
    error: companiesError,
    firstSuccess: companiesFirstSuccess,
    isAuthInitializing: companiesAuthInit,
    authInitAttempts: companiesAuthAttempts,
    lastStatus: companiesLastStatus
  } = useCompanies({ enabled: authReady });

  const { contracts, isLoading, error, mutate } = useMarketplace(
    authReady ? (companyId || undefined) : undefined,
    difficultyFilter !== 'all' ? parseInt(difficultyFilter) : undefined
  );

  // Get current company
  const currentCompany = companies?.find((c: any) => c._id === companyId);

  // Show loading until mounted, auth ready, AND companies loaded
  if (!mounted || status === 'loading' || status !== 'authenticated' || companiesAuthInit || companiesLoading || (!companiesFirstSuccess)) {
    return (
      <DashboardLayout title="Contract Marketplace" subtitle="Loading...">
        <LoadingSpinner size="lg" message="Loading..." />
      </DashboardLayout>
    );
  }

  if (companiesError && !companiesAuthInit && !companiesLoading && !companiesFirstSuccess) {
    return (
      <DashboardLayout title="Contract Marketplace" subtitle="Error">
        <Card className="bg-gradient-to-br from-red-500/10 to-slate-900/50 backdrop-blur-xl border border-red-500/30">
          <CardBody className="gap-6 py-12 items-center text-center">
            <h2 className="text-2xl font-bold text-red-400">Unable to load companies</h2>
            <p className="text-slate-300 max-w-md">
              {companiesError.status === 401 ? 'Your session is initializing. Refresh if this persists.' : companiesError.message}
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold shadow-xl shadow-blue-500/30 transition-all duration-300"
              onPress={() => router.refresh()}
            >
              Retry
            </Button>
          </CardBody>
        </Card>
      </DashboardLayout>
    );
  }

  if (companiesFirstSuccess && companies && companies.length === 0) {
    return (
      <DashboardLayout title="Contract Marketplace" subtitle="Get Started">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10">
          <CardBody className="gap-6 py-12 items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Create Your First Company</h2>
              <p className="text-lg text-slate-400 max-w-md">
                To browse and bid on contracts, you need to create a company first.
              </p>
            </div>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold shadow-xl shadow-blue-500/30 transition-all duration-300"
              onPress={() => router.push('/game/companies/create')}
            >
              Create Company
            </Button>
          </CardBody>
        </Card>
      </DashboardLayout>
    );
  }

  /**
   * Handle company selection
   */
  const handleCompanyChange = (newCompanyId: string) => {
    router.push(`/game/contracts/marketplace?companyId=${newCompanyId}`);
  };

  /**
   * Handle contract click
   */
  const handleContractClick = (contractId: string) => {
    router.push(`/game/contracts/${contractId}?companyId=${companyId}`);
  };

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    mutate();
  };

  return (
    <DashboardLayout
      title="Contract Marketplace"
      subtitle="Browse available contracts from NPC clients. Submit bids to secure revenue for your company."
      maxWidth="container.xl"
    >
      <div className="flex flex-col gap-6">
        {/* Company Selector & Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px]">
            <CompanySelector
              currentCompanyId={companyId || undefined}
              onSelect={handleCompanyChange}
            />
          </div>

          {companyId && (
            <>
              <Select
                selectedKeys={difficultyFilter}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setDifficultyFilter(selected);
                }}
                className="max-w-[200px]"
                label="Tier Filter"
              >
                <SelectItem key="all">All Tiers</SelectItem>
                <SelectItem key="1">Tier 1 - Entry</SelectItem>
                <SelectItem key="2">Tier 2 - Intermediate</SelectItem>
                <SelectItem key="3">Tier 3 - Advanced</SelectItem>
                <SelectItem key="4">Tier 4 - Expert</SelectItem>
                <SelectItem key="5">Tier 5 - Elite</SelectItem>
              </Select>

              <Button 
                onPress={handleRefresh} 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold shadow-xl shadow-blue-500/30 transition-all duration-300"
              >
                Refresh
              </Button>
            </>
          )}
        </div>

        {/* Company Info */}
        {currentCompany && (
          <div className="flex gap-4 p-4 bg-gradient-to-br from-blue-500/10 to-transparent backdrop-blur-xl border border-blue-500/20 rounded-lg">
            <Chip size="sm" className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Level {currentCompany.level}
            </Chip>
            <span className="text-sm text-white">
              Cash: ${currentCompany.cash?.toLocaleString()}
            </span>
            <span className="text-sm text-slate-400">
              Available tiers: {currentCompany.level === 1 ? '1-2' : currentCompany.level === 2 ? '1-3' : currentCompany.level === 3 ? '2-4' : currentCompany.level === 4 ? '3-5' : '4-5'}
            </span>
          </div>
        )}

        {/* Content */}
        {!companyId ? (
          <EmptyState
            message="Select a company to browse available contracts"
            description="Choose a company from the selector above"
          />
        ) : isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage error="Failed to load contracts" />
        ) : contracts.length === 0 ? (
          <EmptyState
            message="No contracts match your filters"
            description="Try changing the difficulty tier to see more contracts"
          />
        ) : (
          <>
            {/* Contract Grid */}
            <div>
              <p className="text-sm text-slate-400 mb-4">
                {contracts.length} contract{contracts.length !== 1 ? 's' : ''} available
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contracts.map((contract: any) => (
                  <ContractCard
                    key={contract._id}
                    contract={contract}
                    onClick={() => handleContractClick(contract._id)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

/**
 * Contract Marketplace Page
 */
export default function ContractMarketplacePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ContractMarketplaceContent />
    </Suspense>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Company Context**: Requires company selection for tier filtering
 * 2. **Auto-Refresh**: Marketplace updates every 30s via SWR
 * 3. **Tier Filtering**: Shows only contracts for company level
 * 4. **Click-Through**: Navigate to detail page for bidding
 * 5. **Visual Feedback**: Cash balance and available tiers displayed
 * 
 * DISPLAYS:
 * - Company level and available tiers
 * - Cash balance for bid validation
 * - Contract cards with key metrics
 * - Difficulty badges and client info
 * - Refresh button for manual updates
 */
