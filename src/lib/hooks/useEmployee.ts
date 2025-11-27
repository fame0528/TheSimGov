/**
 * @fileoverview Employee Data Hook
 * @module lib/hooks/useEmployee
 * 
 * OVERVIEW:
 * Employee CRUD operations and actions (hire, fire, train).
 * Consistent API patterns for employee management across all features.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useAPI, type UseAPIOptions } from './useAPI';
import { useMutation, type UseMutationOptions } from './useMutation';
import { endpoints } from '@/lib/api/endpoints';

/**
 * Employee type placeholders (will be defined in Phase 4)
 */
type Employee = any;
type HireEmployeeInput = any;
type TrainEmployeeInput = any;

/**
 * useEmployee - Fetch single employee by ID
 * 
 * @example
 * ```typescript
 * const { data: employee, isLoading } = useEmployee(employeeId);
 * ```
 */
export function useEmployee(id: string | null, options?: UseAPIOptions) {
  return useAPI<Employee>(
    id ? endpoints.employees.byId(id) : null,
    options
  );
}

/**
 * useEmployees - Fetch list of company employees
 * 
 * @example
 * ```typescript
 * const { data: employees, isLoading } = useEmployees(companyId);
 * ```
 */
export function useEmployees(companyId?: string, options?: UseAPIOptions) {
  const endpoint = companyId 
    ? `${endpoints.employees.list}?companyId=${companyId}` 
    : null; // Don't fetch if no companyId (API requires it)
  
  return useAPI<Employee[]>(endpoint, options);
}

/**
 * useHireEmployee - Hire employee mutation
 * 
 * @example
 * ```typescript
 * const { mutate: hire } = useHireEmployee();
 * hire({ name, role, salary });
 * ```
 */
export function useHireEmployee() {
  return useMutation<Employee, HireEmployeeInput>(
    endpoints.employees.hire,
    { method: 'POST' }
  );
}

/**
 * useFireEmployee - Fire employee mutation
 * 
 * @example
 * ```typescript
 * const { mutate: fire } = useFireEmployee(employeeId);
 * fire();
 * ```
 */
export function useFireEmployee(id: string) {
  return useMutation<void, void>(
    endpoints.employees.fire(id),
    { method: 'DELETE' }
  );
}

/**
 * useTrainEmployee - Train employee mutation
 * 
 * @example
 * ```typescript
 * const { mutate: train } = useTrainEmployee(employeeId);
 * train({ skillId, duration });
 * ```
 */
export function useTrainEmployee(id: string) {
  return useMutation<Employee, TrainEmployeeInput>(
    endpoints.employees.train(id),
    { method: 'POST' }
  );
}
