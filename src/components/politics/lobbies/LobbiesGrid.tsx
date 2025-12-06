/**
 * @fileoverview Lobbies Grid Component
 * @module components/politics/lobbies/LobbiesGrid
 * 
 * OVERVIEW:
 * Grid display for browsing lobbies with filtering and pagination.
 * Uses SWR for data fetching with automatic revalidation.
 * 
 * FEATURES:
 * - Focus and scope filtering
 * - Search functionality
 * - Grid/list view toggle
 * - Pagination
 * - Loading states
 * - Empty states
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import {
  Input,
  Select,
  SelectItem,
  Pagination,
  Spinner,
  Card,
  CardBody,
  Button,
  Chip,
} from '@heroui/react';
import { Search, Filter, Grid, List, Plus, RefreshCw } from 'lucide-react';
import LobbyCard from './LobbyCard';
import type { LobbySummary } from '@/lib/types/lobby';
import {
  LobbyFocus,
  LobbyScope,
  LOBBY_FOCUS_LABELS,
  LOBBY_SCOPE_LABELS,
} from '@/lib/types/lobby';

/**
 * API Response
 */
interface LobbiesResponse {
  success: boolean;
  data: {
    lobbies: LobbySummary[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

/**
 * Filter state
 */
interface FilterState {
  focus: LobbyFocus | '';
  scope: LobbyScope | '';
  search: string;
  myLobbies: boolean;
}

/**
 * Fetcher function
 */
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Build query string from filters
 */
function buildQueryString(
  filters: FilterState,
  page: number,
  limit: number
): string {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', limit.toString());
  
  if (filters.focus) params.set('focus', filters.focus);
  if (filters.scope) params.set('scope', filters.scope);
  if (filters.search) params.set('search', filters.search);
  if (filters.myLobbies) params.set('myLobbies', 'true');
  
  return params.toString();
}

/**
 * LobbiesGrid Component Props
 */
interface LobbiesGridProps {
  /** Show "My Lobbies" filter */
  showMyLobbiesFilter?: boolean;
  /** Initial filter to "My Lobbies" */
  initialMyLobbies?: boolean;
  /** Called when "Create Lobby" is clicked */
  onCreateClick?: () => void;
}

/**
 * LobbiesGrid Component
 */
export default function LobbiesGrid({
  showMyLobbiesFilter = true,
  initialMyLobbies = false,
  onCreateClick,
}: LobbiesGridProps) {
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<FilterState>({
    focus: '',
    scope: '',
    search: '',
    myLobbies: initialMyLobbies,
  });
  const [joiningLobbyId, setJoiningLobbyId] = useState<string | null>(null);

  // Build URL with filters
  const queryString = buildQueryString(filters, page, limit);
  const { data, error, isLoading, mutate } = useSWR<LobbiesResponse>(
    `/api/politics/lobbies?${queryString}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const lobbies = data?.data.lobbies || [];
  const pagination = data?.data.pagination || { total: 0, page: 1, limit: 12, pages: 1 };

  /**
   * Handle join/apply
   */
  const handleJoin = useCallback(async (lobbyId: string) => {
    setJoiningLobbyId(lobbyId);
    try {
      const response = await fetch(`/api/politics/lobbies/${lobbyId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply' }),
      });
      
      if (response.ok) {
        // Refresh list
        mutate();
      }
    } catch (err) {
      console.error('Failed to join lobby:', err);
    } finally {
      setJoiningLobbyId(null);
    }
  }, [mutate]);

  /**
   * Handle search
   */
  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPage(1);
  }, []);

  /**
   * Handle focus filter
   */
  const handleFocusChange = useCallback((keys: 'all' | Set<React.Key>) => {
    if (keys === 'all') {
      setFilters((prev) => ({ ...prev, focus: '' }));
    } else {
      const key = Array.from(keys)[0] as LobbyFocus | undefined;
      setFilters((prev) => ({ ...prev, focus: key || '' }));
    }
    setPage(1);
  }, []);

  /**
   * Handle scope filter
   */
  const handleScopeChange = useCallback((keys: 'all' | Set<React.Key>) => {
    if (keys === 'all') {
      setFilters((prev) => ({ ...prev, scope: '' }));
    } else {
      const key = Array.from(keys)[0] as LobbyScope | undefined;
      setFilters((prev) => ({ ...prev, scope: key || '' }));
    }
    setPage(1);
  }, []);

  /**
   * Toggle my lobbies filter
   */
  const toggleMyLobbies = useCallback(() => {
    setFilters((prev) => ({ ...prev, myLobbies: !prev.myLobbies }));
    setPage(1);
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      focus: '',
      scope: '',
      search: '',
      myLobbies: false,
    });
    setPage(1);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = filters.focus || filters.scope || filters.search || filters.myLobbies;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold">Interest Groups</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="light"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={() => mutate()}
          >
            Refresh
          </Button>
          {onCreateClick && (
            <Button
              size="sm"
              color="primary"
              startContent={<Plus className="w-4 h-4" />}
              onPress={onCreateClick}
            >
              Create Lobby
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <Input
              placeholder="Search lobbies..."
              value={filters.search}
              onValueChange={handleSearchChange}
              startContent={<Search className="w-4 h-4 text-default-400" />}
              className="md:max-w-xs"
              size="sm"
            />

            {/* Focus Filter */}
            <Select
              placeholder="All Focus Areas"
              selectedKeys={filters.focus ? new Set([filters.focus]) : new Set()}
              onSelectionChange={handleFocusChange}
              className="md:max-w-xs"
              size="sm"
              startContent={<Filter className="w-4 h-4 text-default-400" />}
            >
              {Object.entries(LOBBY_FOCUS_LABELS).map(([key, label]) => (
                <SelectItem key={key}>{label}</SelectItem>
              ))}
            </Select>

            {/* Scope Filter */}
            <Select
              placeholder="All Scopes"
              selectedKeys={filters.scope ? new Set([filters.scope]) : new Set()}
              onSelectionChange={handleScopeChange}
              className="md:max-w-xs"
              size="sm"
            >
              {Object.entries(LOBBY_SCOPE_LABELS).map(([key, label]) => (
                <SelectItem key={key}>{label}</SelectItem>
              ))}
            </Select>

            {/* My Lobbies Toggle */}
            {showMyLobbiesFilter && (
              <Chip
                variant={filters.myLobbies ? 'solid' : 'bordered'}
                color={filters.myLobbies ? 'primary' : 'default'}
                className="cursor-pointer"
                onClick={toggleMyLobbies}
              >
                My Lobbies
              </Chip>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="light"
                color="danger"
                onPress={clearFilters}
              >
                Clear
              </Button>
            )}

            {/* View Toggle */}
            <div className="flex gap-1 ml-auto">
              <Button
                isIconOnly
                size="sm"
                variant={viewMode === 'grid' ? 'solid' : 'light'}
                onPress={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant={viewMode === 'list' ? 'solid' : 'light'}
                onPress={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" label="Loading lobbies..." />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-danger">Failed to load lobbies. Please try again.</p>
            <Button
              size="sm"
              variant="light"
              className="mt-2"
              onPress={() => mutate()}
            >
              Retry
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && lobbies.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-default-700 mb-4">
              {hasActiveFilters
                ? 'No lobbies match your filters.'
                : 'No lobbies found. Be the first to create one!'}
            </p>
            {hasActiveFilters && (
              <Button size="sm" variant="light" onPress={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardBody>
        </Card>
      )}

      {/* Lobbies Grid/List */}
      {!isLoading && !error && lobbies.length > 0 && (
        <>
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'flex flex-col gap-4'
            }
          >
            {lobbies.map((lobby) => (
              <LobbyCard
                key={lobby.id}
                lobby={lobby}
                onJoin={handleJoin}
                isJoining={joiningLobbyId === lobby.id}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                total={pagination.pages}
                page={page}
                onChange={setPage}
                showControls
                showShadow
              />
            </div>
          )}
        </>
      )}

      {/* Results Count */}
      {!isLoading && pagination.total > 0 && (
        <p className="text-sm text-default-400 text-center">
          Showing {lobbies.length} of {pagination.total} lobbies
        </p>
      )}
    </div>
  );
}
