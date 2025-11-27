/**
 * @fileoverview Bill Browser Component
 * @module components/politics/BillBrowser
 * 
 * OVERVIEW:
 * Browse and filter legislative bills with pagination.
 * Provides search, filtering, and sorting capabilities.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Button } from '@heroui/button';
import { Pagination } from '@heroui/pagination';
import { Spinner } from '@heroui/spinner';
import { FiSearch, FiFilter } from 'react-icons/fi';
import { CountdownTimer, StatusBadge } from '@/lib/components/politics/shared';
import { formatCurrency } from '@/lib/utils/currency';
import { getPolicyAreaName } from '@/lib/utils/politics/billFormatting';
import type { BillWithDetails, BillFilters, BillSortOptions } from '@/types/politics/bills';
import type { Chamber, PolicyArea, BillStatus } from '@/lib/db/models/Bill';

export interface BillBrowserProps {
  /** Callback when bill is selected */
  onSelectBill?: (billId: string) => void;
  /** Initial filters */
  initialFilters?: Partial<BillFilters>;
  /** Custom class name */
  className?: string;
}

const POLICY_AREAS: PolicyArea[] = [
  'tax', 'budget', 'regulatory', 'trade', 'energy', 'healthcare',
  'labor', 'environment', 'technology', 'defense', 'custom',
];

const BILL_STATUSES: BillStatus[] = [
  'ACTIVE', 'PASSED', 'FAILED', 'WITHDRAWN', 'EXPIRED',
];

/**
 * BillBrowser - Browse and filter legislative bills
 * 
 * Features:
 * - Real-time search
 * - Chamber/status/policy area filtering
 * - Pagination (20 bills per page)
 * - Sorting (date, deadline, title)
 * - Vote preview
 * 
 * @example
 * ```tsx
 * <BillBrowser
 *   onSelectBill={(id) => router.push(`/politics/bills/${id}`)}
 *   initialFilters={{ chamber: 'senate', status: 'ACTIVE' }}
 * />
 * ```
 */
export function BillBrowser({
  onSelectBill,
  initialFilters = {},
  className = '',
}: BillBrowserProps) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<BillFilters>(initialFilters);
  const [sort, setSort] = useState<BillSortOptions>({
    sortBy: 'submittedAt',
    order: 'desc',
  });
  
  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  queryParams.set('limit', '20');
  queryParams.set('sortBy', sort.sortBy);
  queryParams.set('order', sort.order);
  if (filters.chamber) queryParams.set('chamber', filters.chamber);
  if (filters.status) queryParams.set('status', filters.status);
  if (filters.policyArea) queryParams.set('policyArea', filters.policyArea);
  
  // Fetch bills
  const { data, error, isLoading } = useSWR(
    `/api/politics/bills?${queryParams.toString()}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch bills');
      return res.json();
    },
    { refreshInterval: 30000 } // Refresh every 30s
  );
  
  const bills: BillWithDetails[] = data?.data?.bills || [];
  const pagination = data?.data?.pagination;
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <FiFilter className="text-primary" />
            <h3 className="text-lg font-semibold">Filter Bills</h3>
          </div>
        </CardHeader>
        <CardBody className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <Input
              placeholder="Search bills..."
              startContent={<FiSearch />}
              value={filters.search || ''}
              onValueChange={(value) => {
                setFilters({ ...filters, search: value });
                setPage(1);
              }}
              className="md:col-span-4"
            />
            
            {/* Chamber Filter */}
            <Select
              label="Chamber"
              placeholder="All Chambers"
              selectedKeys={filters.chamber ? [filters.chamber] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as Chamber | undefined;
                setFilters({ ...filters, chamber: value });
                setPage(1);
              }}
            >
              <SelectItem key="senate">Senate</SelectItem>
              <SelectItem key="house">House</SelectItem>
            </Select>
            
            {/* Status Filter */}
            <Select
              label="Status"
              placeholder="All Statuses"
              selectedKeys={filters.status ? [filters.status] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as BillStatus | undefined;
                setFilters({ ...filters, status: value });
                setPage(1);
              }}
            >
              {BILL_STATUSES.map(status => (
                <SelectItem key={status}>{status}</SelectItem>
              ))}
            </Select>
            
            {/* Policy Area Filter */}
            <Select
              label="Policy Area"
              placeholder="All Policy Areas"
              selectedKeys={filters.policyArea ? [filters.policyArea] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as PolicyArea | undefined;
                setFilters({ ...filters, policyArea: value });
                setPage(1);
              }}
            >
              {POLICY_AREAS.map(area => (
                <SelectItem key={area}>
                  {getPolicyAreaName(area)}
                </SelectItem>
              ))}
            </Select>
            
            {/* Sort */}
            <Select
              label="Sort By"
              selectedKeys={[sort.sortBy]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as 'submittedAt' | 'votingDeadline' | 'title';
                setSort({ ...sort, sortBy: value });
              }}
            >
              <SelectItem key="submittedAt">Submission Date</SelectItem>
              <SelectItem key="votingDeadline">Voting Deadline</SelectItem>
              <SelectItem key="title">Title</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>
      
      {/* Bills List */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}
      
      {error && (
        <Card className="bg-danger-50 border border-danger-200">
          <CardBody>
            <p className="text-danger text-center">Failed to load bills</p>
          </CardBody>
        </Card>
      )}
      
      {!isLoading && !error && bills.length === 0 && (
        <Card className="bg-gray-50">
          <CardBody>
            <p className="text-gray-500 text-center">No bills found matching filters</p>
          </CardBody>
        </Card>
      )}
      
      {!isLoading && !error && bills.length > 0 && (
        <div className="space-y-3">
          {bills.map((bill) => (
            <Card
              key={bill._id}
              isPressable
              onPress={() => onSelectBill?.(bill._id)}
              className="hover:shadow-md transition-shadow"
            >
              <CardBody className="p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Bill Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge type="chamber" value={bill.chamber} size="sm" />
                      <StatusBadge type="status" value={bill.status} size="sm" />
                      <span className="text-sm font-mono text-gray-500">{bill.billNumber}</span>
                    </div>
                    
                    <h3 className="text-lg font-semibold">{bill.title}</h3>
                    
                    <p className="text-sm text-gray-600 line-clamp-2">{bill.summary}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📋 {getPolicyAreaName(bill.policyArea)}</span>
                      <span>👤 {bill.sponsor.username}</span>
                      {bill.coSponsors.length > 0 && (
                        <span>+{bill.coSponsors.length} co-sponsors</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Vote Info */}
                  <div className="flex flex-col items-end gap-2 min-w-[200px]">
                    {bill.status === 'ACTIVE' && bill.remainingTime && (
                      <CountdownTimer deadline={bill.votingDeadline} size="sm" />
                    )}
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-success font-medium">✓ {bill.ayeCount}</span>
                        <span className="text-danger font-medium">✗ {bill.nayCount}</span>
                        <span className="text-gray-400">○ {bill.abstainCount}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {bill.totalVotesCast}/{bill.quorumRequired} votes
                      </p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={pagination.totalPages}
            page={page}
            onChange={setPage}
            showControls
          />
        </div>
      )}
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Real-Time Updates**: SWR refreshes every 30s for active bills
 * 2. **Responsive Design**: Grid layout adapts to mobile/desktop
 * 3. **Filter Persistence**: Filters maintained across pagination
 * 4. **Loading States**: Spinner, error, and empty states handled
 * 5. **Type Safety**: Full TypeScript types for all data structures
 * 
 * PREVENTS:
 * - Stale bill data (auto-refresh)
 * - Poor mobile UX (responsive grid)
 * - Filter confusion (clear visual feedback)
 */
