/**
 * @fileoverview Player Banking Empire Hook
 * @module lib/hooks/usePlayerBanking
 * 
 * OVERVIEW:
 * Hooks for the player-as-lender banking system where players run their own bank.
 * Covers loan applicants, issued loans, customer deposits, and bank settings.
 * 
 * This is SEPARATE from useBanking.ts which handles player-as-borrower.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import { useAPI, type UseAPIOptions } from './useAPI';
import { useMutation, type UseMutationOptions } from './useMutation';
import { endpoints } from '@/lib/api/endpoints';

// ============================================================================
// Types
// ============================================================================

/**
 * Loan Applicant (NPC wanting a loan from player's bank)
 */
export interface LoanApplicant {
  _id: string;
  userId: string;
  name: string;
  email: string;
  creditScore: number;
  monthlyIncome: number;
  employmentStatus: 'EMPLOYED' | 'SELF_EMPLOYED' | 'UNEMPLOYED' | 'RETIRED';
  requestedAmount: number;
  requestedTermMonths: number;
  purpose: string;
  riskTier: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'VERY_POOR';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
}

/**
 * Bank Loan (loan issued BY player's bank to NPC)
 */
export interface BankLoan {
  _id: string;
  userId: string;
  borrowerName: string;
  borrowerCreditScore: number;
  principal: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  status: 'ACTIVE' | 'PAID_OFF' | 'DEFAULTED' | 'WRITTEN_OFF';
  purpose: string;
  riskTier: string;
  startDate: string;
  endDate: string;
  remainingBalance: number;
  totalInterestEarned: number;
  payments: {
    paymentNumber: number;
    date: string;
    amount: number;
    principal: number;
    interest: number;
    onTime: boolean;
    daysLate: number;
  }[];
  createdAt: string;
}

/**
 * Bank Deposit (customer deposit INTO player's bank)
 */
export interface BankDeposit {
  _id: string;
  userId: string;
  accountNumber: string;
  customerName: string;
  type: 'CHECKING' | 'SAVINGS' | 'CD' | 'MONEY_MARKET';
  accountType: 'INDIVIDUAL' | 'JOINT' | 'BUSINESS' | 'TRUST';
  balance: number;
  interestRate: number;
  termMonths: number;
  maturityDate?: string;
  isActive: boolean;
  totalInterestPaid: number;
  createdAt: string;
}

/**
 * Bank Settings & Level Configuration
 */
export interface BankSettings {
  _id: string;
  bankName: string;
  currentLevel: number;
  baseInterestRate: number;
  minInterestRate: number;
  maxInterestRate: number;
  loanToDepositRatio: number;
  reserveRequirement: number;
  autoApproveThreshold: number;
  synergyBonuses: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Bank Level Configuration
 */
export interface BankLevelConfig {
  level: number;
  name: string;
  maxDeposits: number;
  maxLoans: number;
  unlockFeatures: string[];
}

/**
 * Bank Settings Response (includes level info and stats)
 */
export interface BankSettingsResponse {
  settings: BankSettings;
  levelInfo: {
    current: BankLevelConfig;
    next: BankLevelConfig | null;
    levelUp: {
      eligible: boolean;
      nextLevel: number;
      requirements: {
        depositsRequired: number;
        loansRequired: number;
        currentDeposits: number;
        currentLoans: number;
        depositsMet: boolean;
        loansMet: boolean;
      };
    };
  };
  stats: {
    deposits: {
      totalBalance: number;
      totalInterestPaid: number;
      count: number;
    };
    loans: {
      byStatus: Record<string, { count: number; totalPrincipal: number; totalInterest: number }>;
      totalInterestEarned: number;
    };
    pendingApplicants: number;
    capacity: {
      maxDeposits: number;
      currentDeposits: number;
      depositsUtilization: number;
      maxLendingCapacity: number;
      activeLoans: number;
      availableLendingCapacity: number;
      lendingUtilization: number;
    };
  };
}

/**
 * Applicants List Response
 */
export interface ApplicantsResponse {
  applicants: LoanApplicant[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
  stats: {
    pending: number;
    avgCreditScore: number;
    totalRequestedAmount: number;
    byRisk: Record<string, number>;
  };
}

/**
 * Bank Loans List Response
 */
export interface BankLoansResponse {
  loans: BankLoan[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
  stats: {
    activeLoans: number;
    totalOutstanding: number;
    totalInterestEarned: number;
    avgInterestRate: number;
    defaultRate: number;
  };
}

/**
 * Deposits List Response
 */
export interface DepositsResponse {
  deposits: BankDeposit[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
  stats: {
    totalDeposits: number;
    totalInterestPaid: number;
    averageInterestRate: number;
    depositCount: number;
    byType: Record<string, { count: number; totalBalance: number }>;
  };
}

// ============================================================================
// Bank Settings Hooks
// ============================================================================

/**
 * useBankSettings - Fetch player's bank settings with level info and stats
 * 
 * @example
 * ```typescript
 * const { data, isLoading } = useBankSettings();
 * // data.settings - Bank configuration
 * // data.levelInfo - Current level, next level, upgrade requirements
 * // data.stats - Deposits, loans, capacity
 * ```
 */
export function useBankSettings(options?: UseAPIOptions) {
  return useAPI<BankSettingsResponse>(
    endpoints.playerBanking.settings.get,
    options
  );
}

/**
 * useUpdateBankSettings - Update bank settings mutation
 * 
 * @example
 * ```typescript
 * const { mutate: updateSettings } = useUpdateBankSettings({
 *   onSuccess: () => toast.success('Settings updated!')
 * });
 * updateSettings({ bankName: 'My Empire Bank', baseInterestRate: 0.08 });
 * ```
 */
export function useUpdateBankSettings(
  options?: UseMutationOptions<{ settings: BankSettings; message: string }, Partial<BankSettings>>
) {
  return useMutation<{ settings: BankSettings; message: string }, Partial<BankSettings>>(
    endpoints.playerBanking.settings.update,
    { method: 'PATCH', ...options }
  );
}

/**
 * useBankLevelUp - Level up bank mutation
 * 
 * @example
 * ```typescript
 * const { mutate: levelUp, isLoading } = useBankLevelUp({
 *   onSuccess: (data) => toast.success(data.message)
 * });
 * levelUp({ action: 'levelUp' });
 * ```
 */
export function useBankLevelUp(
  options?: UseMutationOptions<{
    message: string;
    oldLevel: number;
    newLevel: number;
    newCapabilities: BankLevelConfig;
  }, { action: 'levelUp' }>
) {
  return useMutation(
    endpoints.playerBanking.settings.levelUp,
    { method: 'POST', ...options }
  );
}

// ============================================================================
// Loan Applicant Hooks
// ============================================================================

/**
 * useLoanApplicants - Fetch pending loan applicants
 * 
 * @example
 * ```typescript
 * const { data, isLoading } = useLoanApplicants({ status: 'PENDING' });
 * // data.applicants - List of applicants
 * // data.stats - Aggregated statistics
 * ```
 */
export function useLoanApplicants(
  params?: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    riskTier?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'VERY_POOR';
    minCreditScore?: number;
    maxCreditScore?: number;
    page?: number;
    limit?: number;
  },
  options?: UseAPIOptions
) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    });
  }
  
  const queryString = searchParams.toString();
  const endpoint = queryString 
    ? `${endpoints.playerBanking.applicants.list}?${queryString}`
    : endpoints.playerBanking.applicants.list;
  
  return useAPI<ApplicantsResponse>(endpoint, options);
}

/**
 * useGenerateApplicants - Generate new loan applicants mutation
 * 
 * @example
 * ```typescript
 * const { mutate: generateApplicants } = useGenerateApplicants({
 *   onSuccess: (data) => toast.success(`Generated ${data.applicants.length} applicants`)
 * });
 * generateApplicants({ count: 5 });
 * ```
 */
export function useGenerateApplicants(
  options?: UseMutationOptions<{
    applicants: LoanApplicant[];
    message: string;
  }, { count?: number }>
) {
  return useMutation(
    endpoints.playerBanking.applicants.generate,
    { method: 'POST', ...options }
  );
}

/**
 * useApproveApplicant - Approve a loan applicant mutation
 * 
 * @example
 * ```typescript
 * const { mutate: approve } = useApproveApplicant(applicantId, {
 *   onSuccess: (data) => toast.success(`Approved! Loan ID: ${data.loan._id}`)
 * });
 * approve({ action: 'approve', customInterestRate: 0.12 });
 * ```
 */
export function useApproveApplicant(
  applicantId: string,
  options?: UseMutationOptions<{
    message: string;
    applicant: LoanApplicant;
    loan: BankLoan;
  }, { action: 'approve'; customInterestRate?: number; customTermMonths?: number }>
) {
  return useMutation(
    endpoints.playerBanking.applicants.approve(applicantId),
    { method: 'POST', ...options }
  );
}

/**
 * useRejectApplicant - Reject a loan applicant mutation
 * 
 * @example
 * ```typescript
 * const { mutate: reject } = useRejectApplicant(applicantId, {
 *   onSuccess: () => toast.info('Applicant rejected')
 * });
 * reject({ action: 'reject', reason: 'Credit score too low' });
 * ```
 */
export function useRejectApplicant(
  applicantId: string,
  options?: UseMutationOptions<{
    message: string;
    applicant: LoanApplicant;
  }, { action: 'reject'; reason?: string }>
) {
  return useMutation(
    endpoints.playerBanking.applicants.reject(applicantId),
    { method: 'POST', ...options }
  );
}

// ============================================================================
// Bank Loans Hooks (Loans issued by player's bank)
// ============================================================================

/**
 * useBankLoans - Fetch loans issued by player's bank
 * 
 * @example
 * ```typescript
 * const { data, isLoading } = useBankLoans({ status: 'ACTIVE' });
 * // data.loans - List of issued loans
 * // data.stats - Portfolio statistics
 * ```
 */
export function useBankLoans(
  params?: {
    status?: 'ACTIVE' | 'PAID_OFF' | 'DEFAULTED' | 'WRITTEN_OFF';
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'principal' | 'interestRate' | 'remainingBalance';
    sortOrder?: 'asc' | 'desc';
  },
  options?: UseAPIOptions
) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    });
  }
  
  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `${endpoints.playerBanking.bankLoans.list}?${queryString}`
    : endpoints.playerBanking.bankLoans.list;
  
  return useAPI<BankLoansResponse>(endpoint, options);
}

/**
 * useBankLoan - Fetch single loan details with amortization
 * 
 * @example
 * ```typescript
 * const { data } = useBankLoan(loanId);
 * // data.loan - Loan details
 * // data.payments - Payment history
 * // data.nextPayment - Next scheduled payment
 * // data.amortizationSchedule - First 12 months schedule
 * ```
 */
export function useBankLoan(loanId: string | null, options?: UseAPIOptions) {
  return useAPI<{
    loan: BankLoan;
    payments: {
      history: BankLoan['payments'];
      totalPayments: number;
      onTimePayments: number;
      latePayments: number;
      latePaymentPercentage: number;
    };
    financials: {
      totalPaid: number;
      remainingBalance: number;
      totalInterestEarned: number;
      expectedTotalInterest: number;
      interestProgress: number;
    };
    nextPayment: {
      paymentNumber: number;
      dueDate: string;
      amount: number;
      principalPortion: number;
      interestPortion: number;
    } | null;
    amortizationSchedule: {
      month: number;
      payment: number;
      principal: number;
      interest: number;
      balance: number;
    }[];
  }>(
    loanId ? endpoints.playerBanking.bankLoans.byId(loanId) : null,
    options
  );
}

/**
 * useProcessLoanPayment - Process a loan payment mutation
 * 
 * @example
 * ```typescript
 * const { mutate: processPayment } = useProcessLoanPayment(loanId, {
 *   onSuccess: (data) => {
 *     if (data.status === 'DEFAULTED') {
 *       toast.error('Borrower defaulted!');
 *     } else {
 *       toast.success(data.message);
 *     }
 *   }
 * });
 * processPayment({}); // Simulate automatic payment
 * ```
 */
export function useProcessLoanPayment(
  loanId: string,
  options?: UseMutationOptions<{
    status: 'PAYMENT_RECEIVED' | 'LOAN_PAID_OFF' | 'DEFAULTED';
    payment?: {
      paymentNumber: number;
      amount: number;
      principal: number;
      interest: number;
      onTime: boolean;
      daysLate: number;
      lateFee: number;
      balanceAfterPayment: number;
    };
    loan: Partial<BankLoan>;
    message: string;
    nextSteps?: string[];
  }, { amount?: number; isPartial?: boolean; forceDefault?: boolean; forceLate?: boolean }>
) {
  return useMutation(
    endpoints.playerBanking.bankLoans.processPayment(loanId),
    { method: 'POST', ...options }
  );
}

/**
 * useWriteOffLoan - Write off a defaulted loan mutation
 * 
 * @example
 * ```typescript
 * const { mutate: writeOff } = useWriteOffLoan(loanId, {
 *   onSuccess: (data) => toast.warning(`Loss: $${data.loan.lossAmount}`)
 * });
 * writeOff();
 * ```
 */
export function useWriteOffLoan(
  loanId: string,
  options?: UseMutationOptions<{
    message: string;
    loan: {
      _id: string;
      borrowerName: string;
      principal: number;
      totalPaid: number;
      lossAmount: number;
      status: string;
      writeOffDate: string;
    };
  }, void>
) {
  return useMutation(
    endpoints.playerBanking.bankLoans.writeOff(loanId),
    { method: 'DELETE', ...options }
  );
}

// ============================================================================
// Deposits Hooks
// ============================================================================

/**
 * useBankDeposits - Fetch customer deposits in player's bank
 * 
 * @example
 * ```typescript
 * const { data, isLoading } = useBankDeposits({ type: 'SAVINGS' });
 * // data.deposits - List of deposits
 * // data.stats - Deposit statistics
 * ```
 */
export function useBankDeposits(
  params?: {
    type?: 'CHECKING' | 'SAVINGS' | 'CD' | 'MONEY_MARKET';
    accountType?: 'INDIVIDUAL' | 'JOINT' | 'BUSINESS' | 'TRUST';
    isActive?: boolean;
    minBalance?: number;
    maxBalance?: number;
    page?: number;
    limit?: number;
    sortBy?: 'balance' | 'interestRate' | 'createdAt' | 'lastInterestDate';
    sortOrder?: 'asc' | 'desc';
  },
  options?: UseAPIOptions
) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    });
  }
  
  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `${endpoints.playerBanking.deposits.list}?${queryString}`
    : endpoints.playerBanking.deposits.list;
  
  return useAPI<DepositsResponse>(endpoint, options);
}

/**
 * useAcceptDeposit - Accept a new customer deposit mutation
 * 
 * @example
 * ```typescript
 * const { mutate: acceptDeposit } = useAcceptDeposit({
 *   onSuccess: (data) => toast.success(data.message)
 * });
 * acceptDeposit({
 *   customerName: 'John Doe',
 *   type: 'SAVINGS',
 *   initialDeposit: 50000,
 *   accountType: 'INDIVIDUAL'
 * });
 * ```
 */
export function useAcceptDeposit(
  options?: UseMutationOptions<{
    deposit: BankDeposit;
    message: string;
    interestRateInfo: {
      annualRate: number;
      monthlyRate: number;
      estimatedAnnualInterest: number;
    };
  }, {
    customerName: string;
    customerEmail?: string;
    type: 'CHECKING' | 'SAVINGS' | 'CD' | 'MONEY_MARKET';
    accountType?: 'INDIVIDUAL' | 'JOINT' | 'BUSINESS' | 'TRUST';
    initialDeposit: number;
    termMonths?: number;
  }>
) {
  return useMutation(
    endpoints.playerBanking.deposits.accept,
    { method: 'POST', ...options }
  );
}

// ============================================================================
// Composite Hooks
// ============================================================================

/**
 * usePlayerBank - Composite hook for quick bank overview
 * 
 * @example
 * ```typescript
 * const {
 *   settings,
 *   applicants,
 *   loans,
 *   deposits,
 *   isLoading
 * } = usePlayerBank();
 * ```
 */
export function usePlayerBank() {
  const settingsQuery = useBankSettings();
  const applicantsQuery = useLoanApplicants({ status: 'PENDING', limit: 5 });
  const loansQuery = useBankLoans({ status: 'ACTIVE', limit: 5 });
  const depositsQuery = useBankDeposits({ isActive: true, limit: 5 });
  
  return {
    settings: settingsQuery.data,
    applicants: applicantsQuery.data,
    loans: loansQuery.data,
    deposits: depositsQuery.data,
    isLoading: 
      settingsQuery.isLoading ||
      applicantsQuery.isLoading ||
      loansQuery.isLoading ||
      depositsQuery.isLoading,
    error:
      settingsQuery.error ||
      applicantsQuery.error ||
      loansQuery.error ||
      depositsQuery.error,
    refetchAll: async () => {
      await Promise.all([
        settingsQuery.refetch(),
        applicantsQuery.refetch(),
        loansQuery.refetch(),
        depositsQuery.refetch(),
      ]);
    },
  };
}
