/**
 * @fileoverview PartiesGrid Component
 * @module components/politics/parties/PartiesGrid
 * 
 * OVERVIEW:
 * Grid component for displaying and filtering political party organizations.
 * Provides search, filters, sorting, and pagination.
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Input,
  Select,
  SelectItem,
  Button,
  Pagination,
  Spinner,
  Card,
  CardBody,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { Search, Filter, Grid, List, Plus, ArrowUpDown } from 'lucide-react';
import useSWR from 'swr';
import { PartyCard } from './PartyCard';
import type { PartySummary, PartySearchFilters } from '@/lib/types/party';
import { PartyLevel, PartyStatus, PARTY_LEVEL_LABELS, PARTY_STATUS_LABELS } from '@/lib/types/party';
import { PoliticalParty } from '@/types/politics';

// ===================== TYPES =====================

export interface PartiesGridProps {
  /** Initial filters */
  initialFilters?: Partial<PartySearchFilters>;
  /** IDs of parties the current user is a member of */
  memberOfIds?: string[];
  /** Callback when register button is clicked */
  onRegister?: (partyId: string) => void;
  /** Callback when party card is clicked */
  onPartyClick?: (partyId: string) => void;
  /** Callback when create button is clicked */
  onCreateClick?: () => void;
  /** Show create button */
  showCreateButton?: boolean;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface PartiesResponse {
  data: PartySummary[];
  pagination: PaginationData;
}

// ===================== CONSTANTS =====================

const ITEMS_PER_PAGE = 12;

const AFFILIATION_OPTIONS = Object.values(PoliticalParty);
const LEVEL_OPTIONS = Object.values(PartyLevel);
const STATUS_OPTIONS = Object.values(PartyStatus);

const SORT_OPTIONS = [
  { key: 'memberCount-desc', label: 'Most Members' },
  { key: 'memberCount-asc', label: 'Fewest Members' },
  { key: 'strength-desc', label: 'Highest Strength' },
  { key: 'strength-asc', label: 'Lowest Strength' },
  { key: 'createdAt-desc', label: 'Newest' },
  { key: 'createdAt-asc', label: 'Oldest' },
  { key: 'name-asc', label: 'Name (A-Z)' },
  { key: 'name-desc', label: 'Name (Z-A)' },
];

// ===================== FETCHER =====================

const fetcher = async (url: string): Promise<PartiesResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch parties');
  return res.json();
};

// ===================== COMPONENT =====================

export function PartiesGrid({
  initialFilters = {},
  memberOfIds = [],
  onRegister,
  onPartyClick,
  onCreateClick,
  showCreateButton = true,
}: PartiesGridProps) {
  // State
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [affiliation, setAffiliation] = useState<PoliticalParty | ''>(
    initialFilters.affiliation || ''
  );
  const [level, setLevel] = useState<PartyLevel | ''>(initialFilters.level || '');
  const [status, setStatus] = useState<PartyStatus | ''>(
    initialFilters.status || ''
  );
  const [sortKey, setSortKey] = useState('memberCount-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build URL
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', ITEMS_PER_PAGE.toString());

    if (debouncedSearch) params.set('search', debouncedSearch);
    if (affiliation) params.set('affiliation', affiliation);
    if (level) params.set('level', level);
    if (status) params.set('status', status);

    const [sortBy, sortOrder] = sortKey.split('-');
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);

    return `/api/politics/parties?${params.toString()}`;
  }, [page, debouncedSearch, affiliation, level, status, sortKey]);

  // Fetch data
  const { data, error, isLoading, mutate } = useSWR<PartiesResponse>(
    apiUrl,
    fetcher,
    {
      keepPreviousData: true,
    }
  );

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleAffiliationChange = useCallback((keys: 'all' | Set<React.Key>) => {
    if (keys === 'all') return;
    const selected = Array.from(keys)[0] as PoliticalParty | undefined;
    setAffiliation(selected || '');
    setPage(1);
  }, []);

  const handleLevelChange = useCallback((keys: 'all' | Set<React.Key>) => {
    if (keys === 'all') return;
    const selected = Array.from(keys)[0] as PartyLevel | undefined;
    setLevel(selected || '');
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((keys: 'all' | Set<React.Key>) => {
    if (keys === 'all') return;
    const selected = Array.from(keys)[0] as PartyStatus | undefined;
    setStatus(selected || '');
    setPage(1);
  }, []);

  const handleSortChange = useCallback((keys: 'all' | Set<React.Key>) => {
    if (keys === 'all') return;
    const selected = Array.from(keys)[0] as string | undefined;
    if (selected) {
      setSortKey(selected);
      setPage(1);
    }
  }, []);

  const handleRegister = useCallback(
    async (partyId: string) => {
      if (!onRegister) return;
      setRegisteringId(partyId);
      try {
        await onRegister(partyId);
        mutate();
      } finally {
        setRegisteringId(null);
      }
    },
    [onRegister, mutate]
  );

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearch('');
    setAffiliation('');
    setLevel('');
    setStatus('');
    setSortKey('memberCount-desc');
    setPage(1);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = debouncedSearch || affiliation || level || status;

  // Active filter count
  const activeFilterCount = [affiliation, level, status].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        {/* Search */}
        <Input
          className="w-full sm:max-w-md"
          placeholder="Search parties..."
          value={searchTerm}
          onValueChange={handleSearchChange}
          startContent={<Search className="w-5 h-5 text-default-400" />}
          isClearable
          onClear={() => setSearchTerm('')}
        />

        {/* Actions */}
        <div className="flex gap-2 items-center">
          {/* Filter Toggle */}
          <Button
            variant={showFilters ? 'solid' : 'flat'}
            startContent={<Filter className="w-4 h-4" />}
            onPress={() => setShowFilters(!showFilters)}
          >
            Filters
            {activeFilterCount > 0 && (
              <Chip size="sm" color="primary" className="ml-1">
                {activeFilterCount}
              </Chip>
            )}
          </Button>

          {/* Sort Dropdown */}
          <Dropdown>
            <DropdownTrigger>
              <Button variant="flat" startContent={<ArrowUpDown className="w-4 h-4" />}>
                Sort
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Sort options"
              selectionMode="single"
              selectedKeys={new Set([sortKey])}
              onSelectionChange={handleSortChange}
            >
              {SORT_OPTIONS.map((option) => (
                <DropdownItem key={option.key}>{option.label}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          {/* View Mode Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              isIconOnly
              variant={viewMode === 'grid' ? 'solid' : 'light'}
              size="sm"
              onPress={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              variant={viewMode === 'list' ? 'solid' : 'light'}
              size="sm"
              onPress={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Create Button */}
          {showCreateButton && onCreateClick && (
            <Button
              color="primary"
              startContent={<Plus className="w-4 h-4" />}
              onPress={onCreateClick}
            >
              Create Party
            </Button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardBody>
            <div className="flex flex-wrap gap-4">
              {/* Affiliation Filter */}
              <Select
                label="Affiliation"
                placeholder="All affiliations"
                className="w-48"
                selectedKeys={affiliation ? new Set([affiliation]) : new Set()}
                onSelectionChange={handleAffiliationChange}
              >
                {AFFILIATION_OPTIONS.map((aff) => (
                  <SelectItem key={aff}>{aff}</SelectItem>
                ))}
              </Select>

              {/* Level Filter */}
              <Select
                label="Level"
                placeholder="All levels"
                className="w-40"
                selectedKeys={level ? new Set([level]) : new Set()}
                onSelectionChange={handleLevelChange}
              >
                {LEVEL_OPTIONS.map((lvl) => (
                  <SelectItem key={lvl}>{PARTY_LEVEL_LABELS[lvl]}</SelectItem>
                ))}
              </Select>

              {/* Status Filter */}
              <Select
                label="Status"
                placeholder="All statuses"
                className="w-40"
                selectedKeys={status ? new Set([status]) : new Set()}
                onSelectionChange={handleStatusChange}
              >
                {STATUS_OPTIONS.map((st) => (
                  <SelectItem key={st}>{PARTY_STATUS_LABELS[st]}</SelectItem>
                ))}
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="light" color="danger" onPress={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !data && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" label="Loading parties..." />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-danger">Failed to load parties. Please try again.</p>
            <Button className="mt-4" onPress={() => mutate()}>
              Retry
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Empty State */}
      {data && data.data.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-default-700 mb-4">
              {hasActiveFilters
                ? 'No parties found matching your filters.'
                : 'No political parties have been created yet.'}
            </p>
            {hasActiveFilters && (
              <Button variant="flat" onPress={clearFilters}>
                Clear Filters
              </Button>
            )}
            {!hasActiveFilters && showCreateButton && onCreateClick && (
              <Button color="primary" onPress={onCreateClick}>
                Create the First Party
              </Button>
            )}
          </CardBody>
        </Card>
      )}

      {/* Grid View */}
      {data && data.data.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((party) => (
            <PartyCard
              key={party.id}
              party={party}
              isMember={memberOfIds.includes(party.id)}
              onRegister={handleRegister}
              onClick={onPartyClick}
              isLoading={registeringId === party.id}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {data && data.data.length > 0 && viewMode === 'list' && (
        <div className="space-y-3">
          {data.data.map((party) => (
            <PartyCard
              key={party.id}
              party={party}
              isMember={memberOfIds.includes(party.id)}
              onRegister={handleRegister}
              onClick={onPartyClick}
              isLoading={registeringId === party.id}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            total={data.pagination.totalPages}
            page={page}
            onChange={setPage}
            showControls
            showShadow
          />
        </div>
      )}

      {/* Results Summary */}
      {data && data.data.length > 0 && (
        <div className="text-center text-sm text-default-400">
          Showing {(page - 1) * ITEMS_PER_PAGE + 1}-
          {Math.min(page * ITEMS_PER_PAGE, data.pagination.total)} of{' '}
          {data.pagination.total} parties
        </div>
      )}
    </div>
  );
}

export default PartiesGrid;
