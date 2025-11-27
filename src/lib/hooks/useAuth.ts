/**
 * @fileoverview Authentication Hook
 * @module lib/hooks/useAuth
 * 
 * OVERVIEW:
 * Authentication state and mutations.
 * Login, logout, session management with consistent API patterns.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useAPI, type UseAPIOptions } from './useAPI';
import { useMutation, type UseMutationOptions } from './useMutation';
import { endpoints } from '@/lib/api/endpoints';

/**
 * Auth type placeholders (will be defined in Phase 4)
 */
type User = any;
type LoginInput = any;
type RegisterInput = any;

/**
 * useSession - Fetch current user session
 * 
 * @example
 * ```typescript
 * const { data: user, isLoading } = useSession();
 * ```
 */
export function useSession(options?: UseAPIOptions) {
  return useAPI<User>(endpoints.auth.session, options);
}

/**
 * useLogin - Login mutation
 * 
 * @example
 * ```typescript
 * const { mutate: login, isLoading, error } = useLogin({
 *   onSuccess: () => router.push('/dashboard')
 * });
 * 
 * login({ email, password });
 * ```
 */
export function useLogin(options?: UseMutationOptions<User, LoginInput>) {
  return useMutation<User, LoginInput>(
    endpoints.auth.login,
    { method: 'POST', ...options }
  );
}

/**
 * useRegister - Register new user mutation
 * 
 * @example
 * ```typescript
 * const { mutate: register } = useRegister({
 *   onSuccess: () => router.push('/onboarding')
 * });
 * 
 * register({ email, password, username });
 * ```
 */
export function useRegister(options?: UseMutationOptions<User, RegisterInput>) {
  return useMutation<User, RegisterInput>(
    endpoints.auth.register,
    { method: 'POST', ...options }
  );
}

/**
 * useLogout - Logout mutation
 * 
 * @example
 * ```typescript
 * const { mutate: logout } = useLogout({
 *   onSuccess: () => router.push('/login')
 * });
 * ```
 */
export function useLogout(options?: UseMutationOptions<void, {}>) {
  return useMutation<void, {}>(
    endpoints.auth.logout,
    { method: 'POST', ...options }
  );
}
