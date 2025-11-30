"use client";

import { useCallback, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface UseSortOptions<K extends string = string> {
  initialKey?: K | string;
  initialDirection?: SortDirection;
}

export type SortState<K extends string = string> = {
  currentSortKey?: K | string;
  currentSortDirection: SortDirection;
  toggleSort: (key: K | string) => { key: K | string; direction: SortDirection };
};

export default function useSort<K extends string = string>(
  options: UseSortOptions<K> = {}
): SortState<K> {
  const { initialKey, initialDirection = 'asc' } = options;
  const [currentSortKey, setKey] = useState<K | string | undefined>(initialKey);
  const [currentSortDirection, setDir] = useState<SortDirection>(initialDirection);

  const toggleSort = useCallback(
    (key: K | string) => {
      let nextDirection: SortDirection = 'asc';
      if (currentSortKey === key) {
        nextDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
      }
      setKey(key);
      setDir(nextDirection);
      return { key, direction: nextDirection };
    },
    [currentSortKey, currentSortDirection]
  );

  return { currentSortKey, currentSortDirection, toggleSort };
}
