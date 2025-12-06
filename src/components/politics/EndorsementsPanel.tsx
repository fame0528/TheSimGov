/**
 * @fileoverview Endorsements Panel Component
 * @module components/politics/EndorsementsPanel
 * 
 * OVERVIEW:
 * Displays paginated list of political endorsements with filtering capabilities.
 * Shows endorsement source, tier, influence bonus, and status. Currently interfaces
 * with placeholder data (Phase 001B) but designed for future real endorsement system.
 * 
 * FEATURES:
 * - HeroUI Table with pagination (default 10 per page)
 * - Party affiliation filtering
 * - Tier badges with color coding
 * - Responsive design (mobile/tablet/desktop)
 * - Loading states and error handling
 * - SWR data fetching with automatic revalidation
 * 
 * USAGE:
 * ```tsx
 * <EndorsementsPanel />
 * ```
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
  Card,
  CardBody,
  Chip,
  Select,
  SelectItem,
} from '@heroui/react';
import { ThumbsUp, AlertTriangle, Info } from 'lucide-react';

/**
 * Endorsement stub from API (Phase 001B placeholder)
 */
interface EndorsementStub {
  id: string;
  candidateName: string;
  officeType: string;
  party: string;
  tier: 'National' | 'State' | 'Local';
  influenceBonus: number;
  status: 'Active' | 'Pending' | 'Expired';
}

/**
 * API Response Schema
 */
interface EndorsementsResponse {
  success: boolean;
  data: {
    endorsements: EndorsementStub[];
    page: number;
    pageSize: number;
    total: number;
  };
  meta?: {
    note?: string;
  };
}

/**
 * Fetcher function for SWR
 */
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Get tier color for Chip component
 */
const getTierColor = (tier: string): 'success' | 'warning' | 'default' => {
  if (tier === 'National') return 'success';
  if (tier === 'State') return 'warning';
  return 'default';
};

/**
 * Get status color for Chip component
 */
const getStatusColor = (status: string): 'success' | 'warning' | 'danger' => {
  if (status === 'Active') return 'success';
  if (status === 'Pending') return 'warning';
  return 'danger';
};

/**
 * Party filter options
 */
const PARTY_FILTERS = [
  { key: 'all', label: 'All Parties' },
  { key: 'Democrat', label: 'Democrat' },
  { key: 'Republican', label: 'Republican' },
  { key: 'Independent', label: 'Independent' },
];

/**
 * EndorsementsPanel Component
 * 
 * Displays political endorsements with pagination and filtering.
 * Interfaces with Phase 001B placeholder API (5 hardcoded endorsements).
 */
export default function EndorsementsPanel() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [partyFilter, setPartyFilter] = useState<string>('all');

  // Fetch endorsements from API
  const { data, error, isLoading } = useSWR<EndorsementsResponse>(
    `/api/politics/endorsements?page=${currentPage}&pageSize=${pageSize}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  /**
   * Filter endorsements by party
   */
  const filteredEndorsements =
    data?.data.endorsements.filter((e) =>
      partyFilter === 'all' ? true : e.party === partyFilter
    ) || [];

  const totalPages = data?.data.total ? Math.ceil(data.data.total / pageSize) : 1;

  /**
   * Handle party filter change
   */
  const handlePartyFilterChange = (keys: any) => {
    const key = Array.from(keys)[0] as string;
    if (key) {
      setPartyFilter(key);
      setCurrentPage(1); // Reset to first page
    }
  };

  /**
   * Loading state
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading endorsements..." />
      </div>
    );
  }

  /**
   * Error state
   */
  if (error || !data?.success) {
    return (
      <Card className="bg-danger-50 dark:bg-danger-900/20">
        <CardBody>
          <div className="flex items-center gap-3 text-danger">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Failed to load endorsements</p>
              <p className="text-sm text-danger-600 dark:text-danger-400">
                {error?.message || 'An error occurred while fetching data'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <ThumbsUp className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Political Endorsements</h2>
            <p className="text-default-700 text-sm mt-1">
              {filteredEndorsements.length} of {data.data.total} total endorsements
            </p>
          </div>
        </div>

        {/* Party filter */}
        <Select
          label="Filter by party"
          placeholder="Select party"
          className="max-w-xs"
          selectedKeys={[partyFilter]}
          onSelectionChange={handlePartyFilterChange}
        >
          {PARTY_FILTERS.map((filter) => (
            <SelectItem key={filter.key}>{filter.label}</SelectItem>
          ))}
        </Select>
      </div>

      {/* Placeholder data notice */}
      {data.meta?.note && (
        <Card className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800">
          <CardBody>
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-info mt-0.5" />
              <div>
                <p className="font-semibold text-info-700 dark:text-info-400">Placeholder Data</p>
                <p className="text-sm text-info-600 dark:text-info-500 mt-1">{data.meta.note}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Endorsements table */}
      <Table
        aria-label="Political endorsements table"
        className="w-full"
        removeWrapper
        bottomContent={
          totalPages > 1 ? (
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={currentPage}
                total={totalPages}
                onChange={setCurrentPage}
              />
            </div>
          ) : null
        }
      >
        <TableHeader>
          <TableColumn>CANDIDATE</TableColumn>
          <TableColumn>OFFICE</TableColumn>
          <TableColumn>PARTY</TableColumn>
          <TableColumn>TIER</TableColumn>
          <TableColumn>INFLUENCE BONUS</TableColumn>
          <TableColumn>STATUS</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No endorsements found">
          {filteredEndorsements.map((endorsement) => (
            <TableRow key={endorsement.id}>
              {/* Candidate name */}
              <TableCell>
                <span className="font-semibold">{endorsement.candidateName}</span>
              </TableCell>

              {/* Office type */}
              <TableCell>
                <span className="text-default-600">{endorsement.officeType}</span>
              </TableCell>

              {/* Party */}
              <TableCell>
                <Chip
                  size="sm"
                  variant="flat"
                  color={
                    endorsement.party === 'Democrat'
                      ? 'primary'
                      : endorsement.party === 'Republican'
                      ? 'danger'
                      : 'default'
                  }
                >
                  {endorsement.party}
                </Chip>
              </TableCell>

              {/* Tier */}
              <TableCell>
                <Chip size="sm" variant="flat" color={getTierColor(endorsement.tier)}>
                  {endorsement.tier}
                </Chip>
              </TableCell>

              {/* Influence bonus */}
              <TableCell>
                <span className="font-semibold text-success">
                  +{endorsement.influenceBonus.toLocaleString()}
                </span>
              </TableCell>

              {/* Status */}
              <TableCell>
                <Chip size="sm" variant="dot" color={getStatusColor(endorsement.status)}>
                  {endorsement.status}
                </Chip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Empty state after filtering */}
      {filteredEndorsements.length === 0 && data.data.total > 0 && (
        <Card>
          <CardBody>
            <div className="text-center py-8 text-default-700">
              <ThumbsUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-semibold">No endorsements match filters</p>
              <p className="text-sm mt-1">Try selecting a different party filter</p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

/**
 * Implementation Notes:
 * 
 * 1. PLACEHOLDER DATA: Phase 001B uses 5 hardcoded endorsements via /api/politics/endorsements
 * 2. PAGINATION: HeroUI Pagination component with page/pageSize query params
 * 3. FILTERING: Client-side party filtering (will be server-side when real system implemented)
 * 4. TIER COLORS: National (green), State (yellow), Local (gray)
 * 5. STATUS COLORS: Active (green), Pending (yellow), Expired (red)
 * 6. PARTY COLORS: Democrat (blue), Republican (red), Independent (gray)
 * 7. RESPONSIVE: HeroUI Table handles mobile/tablet/desktop layouts
 * 8. FUTURE: When Phase 001B completes, this component ready for real endorsement system
 */
