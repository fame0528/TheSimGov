/**
 * @fileoverview Toast Notification Hook
 * @module lib/hooks/ui/useToast
 * 
 * OVERVIEW:
 * Custom toast notification hook for HeroUI migration.
 * Provides success, error, warning, and info toast helpers.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useCallback } from 'react';

export interface ToastHelpers {
  /** Show success toast */
  success: (message: string) => void;
  /** Show error toast */
  error: (message: string) => void;
  /** Show warning toast */
  warning: (message: string) => void;
  /** Show info toast */
  info: (message: string) => void;
}

/**
 * useToast - Consistent toast notifications
 * 
 * @example
 * ```tsx
 * const toast = useToast();
 * 
 * // Success notification
 * toast.success('Company created successfully!');
 * 
 * // Error notification
 * toast.error('Failed to create company');
 * 
 * // Warning notification
 * toast.warning('Please check your input');
 * 
 * // Info notification
 * toast.info('Feature coming soon');
 * ```
 */
export function useToast(): ToastHelpers {
  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    // Log to console with emoji prefix
    const prefix = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    }[type];
    console.log(`${prefix} ${message}`);
    
    // TODO: Implement visual toast UI component (Phase 4)
    // For now, console logging provides feedback during migration
  }, []);

  return {
    success: (message: string) => showToast('success', message),
    error: (message: string) => showToast('error', message),
    warning: (message: string) => showToast('warning', message),
    info: (message: string) => showToast('info', message),
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Simple**: Console logging for now (visual UI coming in Phase 4)
 * 2. **Consistent**: Same interface as Chakra version
 * 3. **Type-safe**: TypeScript helpers for all toast types
 * 4. **Migration-friendly**: Drop-in replacement during HeroUI migration
 * 
 * PREVENTS:
 * - Breaking existing useToast calls
 * - Need to refactor all toast usage immediately
 */

