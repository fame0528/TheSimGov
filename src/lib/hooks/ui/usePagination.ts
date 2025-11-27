/**
 * @fileoverview Pagination State Management Hook
 * @module lib/hooks/ui/usePagination
 * 
 * OVERVIEW:
 * Manages pagination state for tables and lists.
 * Calculates page numbers, handles navigation, and provides helpers.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useState, useMemo, useCallback } from 'react';

export interface PaginationState {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Go to specific page */
  goToPage: (page: number) => void;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  prevPage: () => void;
  /** Go to first page */
  firstPage: () => void;
  /** Go to last page */
  lastPage: () => void;
  /** Has next page */
  hasNext: boolean;
  /** Has previous page */
  hasPrev: boolean;
  /** Start index for current page (0-indexed) */
  startIndex: number;
  /** End index for current page (0-indexed) */
  endIndex: number;
}

export interface UsePaginationOptions {
  /** Initial page (default: 1) */
  initialPage?: number;
  /** Items per page (default: 10) */
  pageSize?: number;
  /** Total number of items */
  totalItems: number;
}

/**
 * usePagination - Pagination state management
 * 
 * @example
 * ```tsx
 * const pagination = usePagination({
 *   totalItems: companies.length,
 *   pageSize: 10,
 * });
 * 
 * const paginatedData = companies.slice(
 *   pagination.startIndex,
 *   pagination.endIndex
 * );
 * 
 * return (
 *   <>
 *     <DataTable data={paginatedData} />
 *     <Button onClick={pagination.prevPage} disabled={!pagination.hasPrev}>
 *       Previous
 *     </Button>
 *     <Button onClick={pagination.nextPage} disabled={!pagination.hasNext}>
 *       Next
 *     </Button>
 *   </>
 * );
 * ```
 */
export function usePagination({
  initialPage = 1,
  pageSize = 10,
  totalItems,
}: UsePaginationOptions): PaginationState {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = useMemo(
    () => Math.ceil(totalItems / pageSize),
    [totalItems, pageSize]
  );

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    hasNext,
    hasPrev,
    startIndex,
    endIndex,
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Complete**: All pagination operations covered
 * 2. **Safe**: Bounds checking on page changes
 * 3. **Efficient**: Memoized calculations
 * 4. **Flexible**: Works with client-side or server-side pagination
 * 
 * PREVENTS:
 * - Duplicate pagination logic
 * - Off-by-one errors
 * - Inconsistent page calculations
 */
