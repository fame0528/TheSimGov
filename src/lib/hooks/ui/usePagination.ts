"use client";

import { useMemo, useState } from 'react';

export interface PaginationState<T = unknown> {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  paginatedData: T[];
}

export interface UsePaginationOptions<T = unknown> {
  data: T[];
  initialPage?: number;
  pageSize?: number;
  /** Optional override when total differs from client-side data length */
  totalItems?: number;
}

export default function usePagination<T = unknown>({
  data,
  initialPage = 1,
  pageSize = 10,
  totalItems,
}: UsePaginationOptions<T>): PaginationState<T> {
  const [page, setPage] = useState<number>(initialPage);
  const effectiveTotal = totalItems ?? data.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));

  const paginatedData = useMemo(() => {
    if (!data || data.length === 0) return [] as T[];
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, page, pageSize]);

  return { page, totalPages, setPage, paginatedData };
}
