/**
 * @fileoverview Company Data Hook
 * @module lib/hooks/useCompany
 * 
 * OVERVIEW:
 * Company-specific data fetching and mutations.
 * Wraps useAPI and useMutation with company endpoints for consistent usage.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useAPI, type UseAPIOptions } from './useAPI';
import { useMutation, type UseMutationOptions } from './useMutation';
import { endpoints } from '@/lib/api/endpoints';

/**
 * Company type placeholder (will be defined in Phase 4)
 */
type Company = any;
type CreateCompanyInput = any;
type UpdateCompanyInput = any;

/**
 * useCompany - Fetch single company by ID
 * 
 * @example
 * ```typescript
 * const { data: company, isLoading, error } = useCompany(companyId);
 * ```
 */
export function useCompany(id: string | null, options?: UseAPIOptions) {
  return useAPI<Company>(
    id ? endpoints.companies.byId(id) : null,
    options
  );
}

/**
 * useCompanies - Fetch list of user's companies
 * 
 * @example
 * ```typescript
 * const { data: companies, isLoading, refetch } = useCompanies();
 * ```
 */
export function useCompanies(options?: UseAPIOptions) {
  return useAPI<Company[]>(endpoints.companies.list, options);
}

/**
 * useCreateCompany - Create new company mutation
 * 
 * @example
 * ```typescript
 * const { mutate: createCompany, isLoading } = useCreateCompany({
 *   onSuccess: (company) => router.push(`/companies/${company.id}`)
 * });
 * 
 * createCompany({ name: 'Acme Corp', industry: 'TECH' });
 * ```
 */
export function useCreateCompany(options?: UseMutationOptions<Company, CreateCompanyInput>) {
  return useMutation<Company, CreateCompanyInput>(
    endpoints.companies.create,
    { method: 'POST', ...options }
  );
}

/**
 * useUpdateCompany - Update company mutation
 * 
 * @example
 * ```typescript
 * const { mutate: updateCompany } = useUpdateCompany(companyId, {
 *   onSuccess: () => toast.success('Updated!')
 * });
 * 
 * updateCompany({ name: 'New Name' });
 * ```
 */
export function useUpdateCompany(
  id: string,
  options?: UseMutationOptions<Company, UpdateCompanyInput>
) {
  return useMutation<Company, UpdateCompanyInput>(
    endpoints.companies.update(id),
    { method: 'PATCH', ...options }
  );
}

/**
 * useDeleteCompany - Delete company mutation
 * 
 * @example
 * ```typescript
 * const { mutate: deleteCompany } = useDeleteCompany(companyId, {
 *   onSuccess: () => router.push('/companies')
 * });
 * 
 * deleteCompany({});
 * ```
 */
export function useDeleteCompany(
  id: string,
  options?: UseMutationOptions<void, {}>
) {
  return useMutation<void, {}>(
    endpoints.companies.delete(id),
    { method: 'DELETE', ...options }
  );
}
