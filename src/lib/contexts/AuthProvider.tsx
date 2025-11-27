/**
 * @fileoverview Auth Context Provider
 * @module lib/contexts/AuthProvider
 * 
 * OVERVIEW:
 * Global authentication state management.
 * Provides user session and auth methods.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { createContext, useContext, ReactNode } from 'react';
import { User } from '@/lib/types';
import { useSession, useLogin, useLogout } from '@/lib/hooks';

interface AuthContextValue {
  /** Current user */
  user: User | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Login function */
  login: (email: string, password: string) => Promise<void>;
  /** Logout function */
  logout: () => Promise<void>;
  /** Is authenticated */
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider - Global authentication state
 * 
 * @example
 * ```tsx
 * // In app layout
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * 
 * // In any component
 * const { user, isAuthenticated, logout } = useAuth();
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { data: user = null, isLoading, error } = useSession();
  const { mutate: loginMutation } = useLogin();
  const { mutate: logoutMutation } = useLogout();

  const login = async (email: string, password: string) => {
    try {
      await loginMutation({ email, password });
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation({});
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth - Access auth context
 * 
 * @throws Error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Global Auth**: User session available everywhere
 * 2. **Convenient**: login/logout as simple async functions
 * 3. **Type Safe**: Full TypeScript support
 * 4. **isAuthenticated**: Boolean helper for route guards
 * 
 * PREVENTS:
 * - Prop drilling user data
 * - Duplicate auth logic across components
 * - Inconsistent auth state management
 */
