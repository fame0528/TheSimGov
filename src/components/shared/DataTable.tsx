"use client";

import React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import usePagination from "@/lib/hooks/ui/usePagination";
import useSort from "@/lib/hooks/ui/useSort";

export type Column<T> = {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string | number;
};

export interface DataTableProps<T extends { [key: string]: any }> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  initialPage?: number;
  pageSize?: number;
  totalCount?: number; // optional if server-paginated
  onPageChange?: (page: number) => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (key: string, direction: "asc" | "desc") => void;
  getRowId?: (item: T) => string;
}

export function DataTable<T extends { [key: string]: any }>(props: DataTableProps<T>) {
  const {
    columns,
    data,
    isLoading,
    emptyMessage = "No data available",
    initialPage = 1,
    pageSize = 10,
    totalCount,
    onPageChange,
    sortKey,
    sortDirection,
    onSortChange,
    getRowId,
  } = props;

  const { page, setPage, totalPages, paginatedData } = usePagination<T>({
    data,
    initialPage,
    pageSize,
    totalItems: totalCount,
  });

  const { currentSortKey, currentSortDirection, toggleSort } = useSort({
    initialKey: sortKey,
    initialDirection: sortDirection,
  });

  const handleHeaderClick = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    const next = toggleSort(key);
    onSortChange?.(next.key, next.direction);
  };

  const displayData = paginatedData ?? data;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-default-200">
        <Table aria-label="Data table" removeWrapper className="min-w-full">
          <TableHeader>
            {columns.map((col) => {
              const key = String(col.key);
              const active = currentSortKey === key;
              const dir = currentSortDirection;
              return (
                <TableColumn
                  key={key}
                  onClick={() => handleHeaderClick(key, col.sortable)}
                  className={`cursor-${col.sortable ? "pointer" : "default"}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <Chip color={active ? "primary" : "default"} size="sm" variant="flat">
                        {active ? (dir === "asc" ? "▲" : "▼") : "⇅"}
                      </Chip>
                    )}
                  </div>
                </TableColumn>
              );
            })}
          </TableHeader>
          <TableBody
            isLoading={!!isLoading}
            loadingContent={
              <div className="flex items-center justify-center p-6">
                <Spinner label="Loading" />
              </div>
            }
            emptyContent={
              <div className="p-6 text-center text-default-500">{emptyMessage}</div>
            }
          >
            {displayData.map((item) => (
              <TableRow key={getRowId ? getRowId(item) : String(item.id ?? JSON.stringify(item))}>
                {columns.map((col) => (
                  <TableCell key={String(col.key)}>
                    {col.render ? col.render(item) : String(item[col.key as keyof T])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex w-full items-center justify-end">
        <Pagination
          page={page}
          total={totalPages}
          onChange={(p) => {
            setPage(p);
            onPageChange?.(p);
          }}
          className="justify-end"
        />
      </div>
    </div>
  );
}
