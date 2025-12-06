/**
 * @fileoverview Leadership Elections Grid Component
 * @module components/politics/elections/LeadershipElectionsGrid
 * 
 * OVERVIEW:
 * Grid component for displaying and filtering leadership elections.
 * Supports filtering by status, organization, position, and search.
 * 
 * FEATURES:
 * - Responsive grid layout
 * - Status/organization/position filtering
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
import LeadershipElectionCard from './LeadershipElectionCard';
import type { LeadershipElectionSummary } from '@/lib/types/leadership';
import {
  LeadershipElectionStatus,
  ELECTION_STATUS_LABELS,
  LeadershipPosition,
  POSITION_LABELS,
  OrganizationType,
} from '@/lib/types/leadership';

/**
 * Props for LeadershipElectionsGrid
 */
interface LeadershipElectionsGridProps {
  elections: LeadershipElectionSummary[];
  isLoading?: boolean;
  userVotes?: string[]; // Array of election IDs user has voted in
  canVoteIn?: string[]; // Array of election IDs user can vote in
  onVote?: (electionId: string) => void;
  votingElectionId?: string | null;
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
        {hasFilters ? 'No elections match your filters' : 'No elections found'}
      </h3>
      <p className="text-default-500 mt-1">
        {hasFilters
          ? 'Try adjusting your search or filter criteria'
          : 'Check back later for upcoming elections'
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
      <p className="text-default-500 mt-4">Loading elections...</p>
    </div>
  );
}

/**
 * LeadershipElectionsGrid Component
 */
export default function LeadershipElectionsGrid({
  elections,
  isLoading = false,
  userVotes = [],
  canVoteIn = [],
  onVote,
  votingElectionId = null,
  pageSize = 9,
}: LeadershipElectionsGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [orgTypeFilter, setOrgTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter elections
  const filteredElections = useMemo(() => {
    return elections.filter((election) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = election.title.toLowerCase().includes(query);
        const matchesOrg = election.organizationName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesOrg) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && election.status !== statusFilter) {
        return false;
      }

      // Position filter
      if (positionFilter !== 'all' && !election.positions.includes(positionFilter as LeadershipPosition)) {
        return false;
      }

      // Organization type filter
      if (orgTypeFilter !== 'all' && election.organizationType !== orgTypeFilter) {
        return false;
      }

      return true;
    });
  }, [elections, searchQuery, statusFilter, positionFilter, orgTypeFilter]);

  // Paginate
  const totalPages = Math.ceil(filteredElections.length / pageSize);
  const paginatedElections = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredElections.slice(start, start + pageSize);
  }, [filteredElections, currentPage, pageSize]);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const hasFilters = Boolean(searchQuery || statusFilter !== 'all' || positionFilter !== 'all' || orgTypeFilter !== 'all');

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search elections..."
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
            ...Object.entries(ELECTION_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value}>{label}</SelectItem>
            )),
          ]}
        </Select>

        <Select
          placeholder="Position"
          selectedKeys={positionFilter ? [positionFilter] : []}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            handleFilterChange(setPositionFilter)(value || 'all');
          }}
          className="md:max-w-[180px]"
        >
          {[
            <SelectItem key="all">All Positions</SelectItem>,
            ...Object.entries(POSITION_LABELS).map(([value, label]) => (
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
        Showing {paginatedElections.length} of {filteredElections.length} election{filteredElections.length !== 1 ? 's' : ''}
      </div>

      {/* Grid or Empty State */}
      {filteredElections.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedElections.map((election) => (
              <LeadershipElectionCard
                key={election.id}
                election={election}
                hasVoted={userVotes.includes(election.id)}
                canVote={canVoteIn.includes(election.id)}
                onVote={onVote}
                isVoting={votingElectionId === election.id}
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
