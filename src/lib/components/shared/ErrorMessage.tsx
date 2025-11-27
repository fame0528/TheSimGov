/**
 * @fileoverview Error Message Component
 * @module lib/components/shared/ErrorMessage
 * 
 * OVERVIEW:
 * Reusable error display component with retry functionality.
 * Consistent error UI across all features.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { Snippet } from '@heroui/snippet';
import { Button } from '@heroui/button';
import { ApiError } from '@/lib/api/errors';

export interface ErrorMessageProps {
  /** Error object or string */
  error: ApiError | Error | string;
  /** Optional retry callback */
  onRetry?: () => void;
  /** Error title */
  title?: string;
}

/**
 * ErrorMessage - Consistent error display
 * 
 * @example
 * ```tsx
 * <ErrorMessage error={error} onRetry={refetch} />
 * <ErrorMessage error="Failed to load data" title="Loading Error" />
 * ```
 */
export function ErrorMessage({ error, onRetry, title = 'Error' }: ErrorMessageProps) {
  const errorMessage = typeof error === 'string' 
    ? error 
    : error instanceof ApiError 
    ? error.message 
    : error.message || 'An unexpected error occurred';

  return (
    <div className="flex flex-col items-center justify-center text-center py-6">
      <div className="text-danger text-5xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-danger mb-1">
        {title}
      </h3>
      <Snippet
        color="danger"
        variant="bordered"
        className="max-w-sm mb-4"
        hideCopyButton
        hideSymbol
      >
        {errorMessage}
      </Snippet>
      {onRetry && (
        <Button color="danger" size="sm" onPress={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Type Safety**: Handles ApiError, Error, or string
 * 2. **Retry Support**: Optional callback for refetch
 * 3. **HeroUI Snippet**: Uses @heroui/snippet for error display
 * 4. **Tailwind CSS**: Flex utilities for layout
 * 
 * PREVENTS:
 * - Duplicate error UI across 111+ components
 * - Inconsistent error messaging
 */
