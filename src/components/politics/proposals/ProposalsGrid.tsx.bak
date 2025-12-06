/**
 * @fileoverview Proposals Grid Component
 * @module components/politics/proposals/ProposalsGrid
 * 
 * OVERVIEW:
 * Grid component for displaying and filtering proposals.
 * Supports filtering by status, category, organization, and search.
 * 
 * FEATURES:
 * - Responsive grid layout
 * - Status/category/organization filtering
 * - Search by title
 * - Loading and empty states
 * - Pagination support
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Input,
  Select,
  SelectItem,
  Spinner,
  Pagination,
} from '@heroui/react';
import { Search } from 'lucide-react';
import ProposalCard from './ProposalCard';
import type { ProposalSummary } from '@/lib/types/proposal';
import {
  ProposalStatus,
  ProposalCategory,
  STATUS_LABELS,
  CATEGORY_LABELS,
} from '@/lib/types/proposal';
import { OrganizationType } from '@/lib/types/leadership';

/**
 * Props for ProposalsGrid
 */
interface ProposalsGridProps {
  proposals: ProposalSummary[];
  isLoading?: boolean;
  userVotes?: string[]; // Array of proposal IDs user has voted on
  canVoteIn?: string[]; // Array of proposal IDs user can vote in
  onVote?: (proposalId: string) => void;
  votingProposalId?: string | null;
  pageSize?: number;
}

/**
 * Empty state component
 */
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 mb-4 bg-default-100 rounded-full flex items-center justify-center">
        <Search className="w-8 h-8 text-default-400" />
      </div>
      <h3 className="text-lg font-medium text-default-700">
        {hasFilters ? 'No proposals match your filters' : 'No proposals found'}
      </h3>
      <p className="text-default-500 mt-1">
        {hasFilters
          ? 'Try adjusting your search or filter criteria'
          : 'Check back later for new proposals or create your own'
        }
      </p>
    </div>
  );
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Spinner size="lg" />
      <p className="text-default-500 mt-4">Loading proposals...</p>
    </div>
  );
}

/**
 * ProposalsGrid Component
 */
export default function ProposalsGrid({
  proposals,
  isLoading = false,
  userVotes = [],
  canVoteIn = [],
  onVote,
  votingProposalId = null,
  pageSize = 9,
}: ProposalsGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [orgTypeFilter, setOrgTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter proposals
  const filteredProposals = useMemo(() => {
    return proposals.filter((proposal) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = proposal.title.toLowerCase().includes(query);
        const matchesSummary = proposal.summary.toLowerCase().includes(query);
        const matchesOrg = proposal.organizationName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSummary && !matchesOrg) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && proposal.status !== statusFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && proposal.category !== categoryFilter) {
        return false;
      }

      // Organization type filter
      if (orgTypeFilter !== 'all' && proposal.organizationType !== orgTypeFilter) {
        return false;
      }

      return true;
    });
  }, [proposals, searchQuery, statusFilter, categoryFilter, orgTypeFilter]);

  // Paginate
  const totalPages = Math.ceil(filteredProposals.length / pageSize);
  const paginatedProposals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProposals.slice(start, start + pageSize);
  }, [filteredProposals, currentPage, pageSize]);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const hasFilters = Boolean(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || orgTypeFilter !== 'all');

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search proposals..."
          value={searchQuery}
          onValueChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          startContent={<Search className="w-4 h-4 text-default-400" />}
          className="md:max-w-xs"
          isClearable
          onClear={() => setSearchQuery('')}
        />

        <Select
          placeholder="Status"
          selectedKeys={statusFilter ? [statusFilter] : []}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            handleFilterChange(setStatusFilter)(value || 'all');
          }}
          className="md:max-w-[180px]"
        >
          {[
            <SelectItem key="all">All Statuses</SelectItem>,
            ...Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value}>{label}</SelectItem>
            )),
          ]}
        </Select>

        <Select
          placeholder="Category"
          selectedKeys={categoryFilter ? [categoryFilter] : []}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            handleFilterChange(setCategoryFilter)(value || 'all');
          }}
          className="md:max-w-[180px]"
        >
          {[
            <SelectItem key="all">All Categories</SelectItem>,
            ...Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value}>{label}</SelectItem>
            )),
          ]}
        </Select>

        <Select
          placeholder="Organization"
          selectedKeys={orgTypeFilter ? [orgTypeFilter] : []}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            handleFilterChange(setOrgTypeFilter)(value || 'all');
          }}
          className="md:max-w-[180px]"
        >
          {[
            <SelectItem key="all">All Organizations</SelectItem>,
            <SelectItem key={OrganizationType.LOBBY}>Lobbies</SelectItem>,
            <SelectItem key={OrganizationType.PARTY}>Parties</SelectItem>,
          ]}
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-default-500">
        Showing {paginatedProposals.length} of {filteredProposals.length} proposal{filteredProposals.length !== 1 ? 's' : ''}
      </div>

      {/* Grid or Empty State */}
      {filteredProposals.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                hasVoted={userVotes.includes(proposal.id)}
                canVote={canVoteIn.includes(proposal.id)}
                onVote={onVote}
                isVoting={votingProposalId === proposal.id}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
