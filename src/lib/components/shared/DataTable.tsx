/**
 * @fileoverview Data Table Component
 * @module lib/components/shared/DataTable
 * 
 * OVERVIEW:
 * Generic table component with sorting and pagination.
 * Reusable across all list views (companies, employees, contracts).
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from '@heroui/table';
import { Button } from '@heroui/button';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  /** Column header text */
  header: string;
  /** Accessor function or key */
  accessor: keyof T | ((row: T) => React.ReactNode);
  /** Sortable column */
  sortable?: boolean;
  /** Column width */
  width?: string;
}

export interface DataTableProps<T> {
  /** Table data */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | string | null;
  /** Empty state message */
  emptyMessage?: string;
  /** Pagination - current page */
  currentPage?: number;
  /** Pagination - total pages */
  totalPages?: number;
  /** Pagination - page change handler */
  onPageChange?: (page: number) => void;
  /** Sort handler */
  onSort?: (column: keyof T) => void;
  /** Current sort column */
  sortColumn?: keyof T;
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * DataTable - Generic sortable, paginated table
 * 
 * @example
 * ```tsx
 * <DataTable
 *   data={companies}
 *   columns={[
 *     { header: 'Name', accessor: 'name', sortable: true },
 *     { header: 'Industry', accessor: 'industry' },
 *     { header: 'Revenue', accessor: (row) => formatCurrency(row.revenue) },
 *   ]}
 *   isLoading={isLoading}
 *   error={error}
 *   currentPage={page}
 *   totalPages={totalPages}
 *   onPageChange={setPage}
 * />
 * ```
 */
export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  error = null,
  emptyMessage = 'No data available',
  currentPage,
  totalPages,
  onPageChange,
  onSort,
  sortColumn,
  sortDirection = 'asc',
}: DataTableProps<T>) {
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (data.length === 0) return <EmptyState message={emptyMessage} />;

  const getCellValue = (row: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor] as React.ReactNode;
  };

  return (
    <div className="w-full">
      <Table aria-label="Data table">
        <TableHeader>
          {columns.map((column, index) => (
            <TableColumn
              key={index}
              className={column.sortable ? 'cursor-pointer' : ''}
              onClick={() => {
                if (column.sortable && onSort && typeof column.accessor === 'string') {
                  onSort(column.accessor);
                }
              }}
            >
              <div className="flex items-center gap-2">
                {column.header}
                {column.sortable && sortColumn === column.accessor && (
                  <span>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex}>{getCellValue(row, column)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {onPageChange && totalPages && totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 px-4">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onPress={() => onPageChange(currentPage! - 1)}
              isDisabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              size="sm"
              onPress={() => onPageChange(currentPage! + 1)}
              isDisabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Generic**: Works with any data type via TypeScript generics
 * 2. **Sorting**: Optional column sorting with direction indicator
 * 3. **Pagination**: Built-in pagination controls with HeroUI Button
 * 4. **States**: Handles loading, error, empty gracefully
 * 5. **Flexible**: Accessor can be key or render function
 * 6. **HeroUI Table**: Uses @heroui/table components
 * 
 * PREVENTS:
 * - Duplicate table implementations across features
 * - Inconsistent pagination/sorting UI
 * - Missing loading/error/empty states
 */
