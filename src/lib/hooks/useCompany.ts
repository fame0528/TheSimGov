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

import { useMemo } from 'react';
import { useAPI, type UseAPIOptions, type UseAPIResult } from './useAPI';
import { useMutation, type UseMutationOptions } from './useMutation';
import { endpoints } from '@/lib/api/endpoints';

/**
 * Company type placeholder (will be defined in Phase 4)
 */
type Company = any;
type CreateCompanyInput = any;
type UpdateCompanyInput = any;

/**
 * API response type for companies list
 */
interface CompaniesResponse {
  companies: Company[];
}

/**
 * API response type for single company
 */
interface CompanyResponse {
  company: Company;
}

/**
 * useCompany - Fetch single company by ID
 * 
 * NOTE: The API returns { company: {...} }, so we extract the company object
 * and return it directly.
 * 
 * @example
 * ```typescript
 * const { data: company, isLoading, error } = useCompany(companyId);
 * ```
 */
export function useCompany(id: string | null, options?: UseAPIOptions): UseAPIResult<Company> {
  const result = useAPI<CompanyResponse>(
    id ? endpoints.companies.byId(id) : null,
    options
  );
  
  // Extract company object from response
  const company = useMemo(() => {
    if (!result.data) return null;
    // Handle both { company: {...} } and direct company formats
    if (result.data.company) return result.data.company;
    // If it's already the company object (has typical company fields)
    if ('name' in result.data && 'industry' in result.data) return result.data as unknown as Company;
    return null;
  }, [result.data]);
  
  return {
    ...result,
    data: company,
  };
}

/**
 * useCompanies - Fetch list of user's companies
 * 
 * NOTE: The API returns { companies: [...] }, so we extract the array
 * and return it in a compatible format.
 * 
 * @example
 * ```typescript
 * const { data: companies, isLoading, refetch } = useCompanies();
 * ```
 */
export function useCompanies(options?: UseAPIOptions): UseAPIResult<Company[]> {
  const result = useAPI<CompaniesResponse>(endpoints.companies.list, options);
  
  // Extract companies array from response, ensuring it's always an array
  const companies = useMemo(() => {
    if (!result.data) return null;
    // Handle both { companies: [...] } and direct array formats
    if (Array.isArray(result.data)) return result.data;
    if (result.data.companies && Array.isArray(result.data.companies)) {
      return result.data.companies;
    }
    return [];
  }, [result.data]);
  
  return {
    ...result,
    data: companies,
  };
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
