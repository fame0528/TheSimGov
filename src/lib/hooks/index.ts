/**
 * @fileoverview Data Hooks Exports
 * @module lib/hooks
 * 
 * OVERVIEW:
 * Central export point for all data fetching and mutation hooks.
 * Provides clean imports: import { useAPI, useCompany, useAuth } from '@/lib/hooks'
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

// Base hooks
export { useAPI, type UseAPIOptions, type UseAPIResult } from './useAPI';
export { useMutation, type UseMutationOptions, type UseMutationResult, type MutationMethod } from './useMutation';

// Domain hooks - Company
export { useCompany, useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany } from './useCompany';

// Domain hooks - Auth
export { useSession, useLogin, useRegister, useLogout } from './useAuth';

// Domain hooks - Employee
export { useEmployee, useEmployees, useHireEmployee, useFireEmployee, useTrainEmployee } from './useEmployee';

// Domain hooks - Contract
export { useContract, useMarketplace as useMarketplaceContracts, useContracts as useActiveContracts, useBidContract, useAcceptContract, useCompleteContract } from './useContract';

// Domain hooks - Banking
export { useBanks, useLoans, useCreditScore, useApplyLoan, usePayLoan } from './useBanking';

// Domain hooks - AI Industry (Technology + AI subcategory)
export { 
  useAIModels, 
  useAIResearchProjects, 
  useAIInfrastructure, 
  useAIBreakthroughs,
  useAIPatents,
  useAIMarketplaceRevenue,
  useAIDominance,
  useAICompanySummary,
  type AIModel,
  type AIResearchProject,
  type GPUCluster,
  type AICompanySummary,
} from './useAI';

// Socket.io hooks - Real-time multiplayer
export { useSocket } from './useSocket';
export { useChat } from './useChat';
export { useElections } from './useElections';
export { useMarket } from './useMarket';
