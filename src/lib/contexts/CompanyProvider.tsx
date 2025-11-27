/**
 * @fileoverview Company Context Provider
 * @module lib/contexts/CompanyProvider
 * 
 * OVERVIEW:
 * Global state management for active company.
 * Provides current company data and switching functionality.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Company } from '@/lib/types';
import { useCompanies } from '@/lib/hooks';

interface CompanyContextValue {
  /** Currently active company */
  currentCompany: Company | null;
  /** All user's companies */
  companies: Company[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Switch active company */
  setCurrentCompany: (company: Company | null) => void;
  /** Refetch companies */
  refetch: () => void;
}

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);

export interface CompanyProviderProps {
  children: ReactNode;
}

/**
 * CompanyProvider - Global company state
 * 
 * @example
 * ```tsx
 * // In app layout
 * <CompanyProvider>
 *   <App />
 * </CompanyProvider>
 * 
 * // In any component
 * const { currentCompany, setCurrentCompany } = useCompanyContext();
 * ```
 */
export function CompanyProvider({ children }: CompanyProviderProps) {
  const { data: companies = [], isLoading, error, refetch } = useCompanies();
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);

  // Auto-select first company on load
  useEffect(() => {
    if (companies && companies.length > 0 && !currentCompany) {
      setCurrentCompany(companies[0]);
    }
  }, [companies, currentCompany]);

  const value: CompanyContextValue = {
    currentCompany,
    companies: companies || [],
    isLoading,
    error,
    setCurrentCompany,
    refetch,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

/**
 * useCompanyContext - Access company context
 * 
 * @throws Error if used outside CompanyProvider
 */
export function useCompanyContext() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within CompanyProvider');
  }
  return context;
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Global State**: Current company available everywhere
 * 2. **Auto-Select**: First company auto-selected on load
 * 3. **Type Safe**: Full TypeScript support
 * 4. **Refetch**: Manual refresh capability
 * 
 * PREVENTS:
 * - Prop drilling company data through components
 * - Duplicate company fetching across pages
 */
