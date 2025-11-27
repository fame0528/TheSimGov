/**
 * @fileoverview Banking & Loans Hook
 * @module lib/hooks/useBanking
 * 
 * OVERVIEW:
 * Banking operations, loan applications, and credit score management.
 * Consistent patterns for financial operations across features.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useAPI, type UseAPIOptions } from './useAPI';
import { useMutation, type UseMutationOptions } from './useMutation';
import { endpoints } from '@/lib/api/endpoints';

/**
 * Banking type placeholders (will be defined in Phase 4)
 */
type Bank = any;
type Loan = any;
type LoanApplicationInput = any;
type CreditScore = any;

/**
 * useBanks - Fetch list of available banks
 * 
 * @example
 * ```typescript
 * const { data: banks, isLoading } = useBanks();
 * ```
 */
export function useBanks(options?: UseAPIOptions) {
  return useAPI<Bank[]>(endpoints.banking.banks, options);
}

/**
 * useLoans - Fetch company's loans
 * 
 * @example
 * ```typescript
 * const { data: loans } = useLoans(companyId);
 * ```
 */
export function useLoans(companyId?: string, options?: UseAPIOptions) {
  const endpoint = companyId 
    ? `${endpoints.banking.loans}?company=${companyId}` 
    : endpoints.banking.loans;
  
  return useAPI<Loan[]>(endpoint, options);
}

/**
 * useCreditScore - Fetch company credit score
 * 
 * @example
 * ```typescript
 * const { data: creditScore, isLoading } = useCreditScore(companyId);
 * ```
 */
export function useCreditScore(companyId: string | null, options?: UseAPIOptions) {
  return useAPI<CreditScore>(
    companyId ? endpoints.banking.creditScore(companyId) : null,
    options
  );
}

/**
 * useApplyLoan - Apply for loan mutation
 * 
 * @example
 * ```typescript
 * const { mutate: applyLoan, isLoading } = useApplyLoan({
 *   onSuccess: () => toast.success('Application submitted!')
 * });
 * 
 * applyLoan({ amount, term, bankId });
 * ```
 */
export function useApplyLoan(options?: UseMutationOptions<Loan, LoanApplicationInput>) {
  return useMutation<Loan, LoanApplicationInput>(
    endpoints.banking.applyLoan,
    { method: 'POST', ...options }
  );
}

/**
 * usePayLoan - Pay loan mutation
 * 
 * @example
 * ```typescript
 * const { mutate: payLoan } = usePayLoan(loanId, {
 *   onSuccess: () => toast.success('Payment successful!')
 * });
 * payLoan({ amount });
 * ```
 */
export function usePayLoan(
  loanId: string,
  options?: UseMutationOptions<Loan, { amount: number }>
) {
  return useMutation<Loan, { amount: number }>(
    endpoints.banking.payLoan(loanId),
    { method: 'POST', ...options }
  );
}
