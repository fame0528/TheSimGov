/**
 * @fileoverview Sort State Management Hook
 * @module lib/hooks/ui/useSort
 * 
 * OVERVIEW:
 * Manages sorting state for tables and lists.
 * Handles column selection and sort direction toggling.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useState, useCallback, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState<T = string> {
  /** Currently sorted column */
  column: T | null;
  /** Current sort direction */
  direction: SortDirection;
  /** Set sort column and direction */
  setSort: (column: T, direction?: SortDirection) => void;
  /** Toggle sort for column (cycles: null → asc → desc → null) */
  toggleSort: (column: T) => void;
  /** Reset sorting */
  reset: () => void;
  /** Is column sorted */
  isSorted: (column: T) => boolean;
  /** Get sort direction for column */
  getDirection: (column: T) => SortDirection;
}

export interface UseSortOptions<T = string> {
  /** Initial column */
  initialColumn?: T | null;
  /** Initial direction */
  initialDirection?: SortDirection;
}

/**
 * useSort - Sort state management
 * 
 * @example
 * ```tsx
 * const sort = useSort<keyof Company>({
 *   initialColumn: 'name',
 *   initialDirection: 'asc',
 * });
 * 
 * const sortedData = useMemo(() => {
 *   if (!sort.column || !sort.direction) return data;
 *   return [...data].sort((a, b) => {
 *     const aVal = a[sort.column];
 *     const bVal = b[sort.column];
 *     const mult = sort.direction === 'asc' ? 1 : -1;
 *     return aVal > bVal ? mult : -mult;
 *   });
 * }, [data, sort.column, sort.direction]);
 * 
 * return (
 *   <Table>
 *     <Th onClick={() => sort.toggleSort('name')}>
 *       Name {sort.getDirection('name') === 'asc' ? '↑' : '↓'}
 *     </Th>
 *   </Table>
 * );
 * ```
 */
export function useSort<T = string>({
  initialColumn = null,
  initialDirection = null,
}: UseSortOptions<T> = {}): SortState<T> {
  const [column, setColumn] = useState<T | null>(initialColumn);
  const [direction, setDirection] = useState<SortDirection>(initialDirection);

  const setSort = useCallback((col: T, dir: SortDirection = 'asc') => {
    setColumn(col);
    setDirection(dir);
  }, []);

  const toggleSort = useCallback(
    (col: T) => {
      if (column !== col) {
        // New column: start with ascending
        setColumn(col);
        setDirection('asc');
      } else {
        // Same column: cycle through asc → desc → null
        if (direction === 'asc') {
          setDirection('desc');
        } else if (direction === 'desc') {
          setColumn(null);
          setDirection(null);
        } else {
          setDirection('asc');
        }
      }
    },
    [column, direction]
  );

  const reset = useCallback(() => {
    setColumn(null);
    setDirection(null);
  }, []);

  const isSorted = useCallback((col: T) => column === col, [column]);

  const getDirection = useCallback(
    (col: T): SortDirection => (column === col ? direction : null),
    [column, direction]
  );

  return {
    column,
    direction,
    setSort,
    toggleSort,
    reset,
    isSorted,
    getDirection,
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Type-safe**: Generic column type
 * 2. **Cyclic**: Toggles through asc → desc → null
 * 3. **Helpers**: isSorted, getDirection for UI
 * 4. **Memoized**: Callbacks prevent re-renders
 * 
 * PREVENTS:
 * - Duplicate sort logic
 * - Inconsistent sort behavior
 * - Complex sort state management
 */
