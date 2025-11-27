/**
 * @fileoverview Debounce Hook
 * @module lib/hooks/ui/useDebounce
 * 
 * OVERVIEW:
 * Debounces a value to prevent excessive updates.
 * Useful for search inputs and expensive operations.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * useDebounce - Debounce a value
 * 
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 500)
 * 
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 500);
 * 
 * useEffect(() => {
 *   // Only runs when debouncedSearch changes (after 500ms of no typing)
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 * 
 * return (
 *   <Input
 *     value={search}
 *     onChange={(e) => setSearch(e.target.value)}
 *     placeholder="Search companies..."
 *   />
 * );
 * ```
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timeout to update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timeout if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Simple**: Single purpose - delay value updates
 * 2. **Generic**: Works with any value type
 * 3. **Clean**: Automatic timeout cleanup
 * 4. **Performance**: Prevents excessive API calls or renders
 * 
 * PREVENTS:
 * - Duplicate debounce implementations
 * - API spam from search inputs
 * - Memory leaks from uncleaned timeouts
 */
