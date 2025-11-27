/**
 * @fileoverview Empty State Component
 * @module lib/components/shared/EmptyState
 * 
 * OVERVIEW:
 * Reusable empty state display for lists and collections.
 * Shows when no data is available with optional call-to-action.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { Button } from '@heroui/button';

export interface EmptyStateProps {
  /** Empty state message */
  message: string;
  /** Optional description */
  description?: string;
  /** Optional action button text */
  actionText?: string;
  /** Optional action handler */
  onAction?: () => void;
  /** Icon/illustration */
  icon?: React.ReactNode;
}

/**
 * EmptyState - Consistent no-data display
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   message="No companies found"
 *   description="Create your first company to get started"
 *   actionText="Create Company"
 *   onAction={() => router.push('/companies/new')}
 * />
 * 
 * <EmptyState message="No contracts available" />
 * ```
 */
export function EmptyState({
  message,
  description,
  actionText,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        {icon && <div className="text-4xl">{icon}</div>}
        <h3 className="text-xl font-semibold text-gray-600">
          {message}
        </h3>
        {description && (
          <p className="text-gray-500 max-w-md">
            {description}
          </p>
        )}
        {actionText && onAction && (
          <Button color="primary" className="mt-4" onPress={onAction}>
            {actionText}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **User Guidance**: Clear messaging when lists are empty
 * 2. **Call-to-Action**: Optional button for primary action
 * 3. **Icons**: Support for custom icons/illustrations
 * 4. **Consistent**: Same empty state UI across all features
 * 5. **HeroUI Button**: Uses @heroui/button with onPress handler
 * 
 * PREVENTS:
 * - Blank screens confusing users
 * - Duplicate empty state implementations
 * - Inconsistent "no data" messaging
 */
