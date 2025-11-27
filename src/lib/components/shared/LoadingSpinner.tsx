/**
 * @fileoverview Loading Spinner Component
 * @module lib/components/shared/LoadingSpinner
 * 
 * OVERVIEW:
 * Reusable loading spinner with customizable size and color.
 * Uses Chakra UI Spinner for consistent styling.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { Spinner } from '@heroui/spinner';

export interface LoadingSpinnerProps {
  /** Size of spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Optional loading message */
  message?: string;
  /** Full screen overlay */
  fullScreen?: boolean;
  /** Color scheme */
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

/**
 * LoadingSpinner - Consistent loading indicator
 * 
 * @example
 * ```tsx
 * <LoadingSpinner size="lg" message="Loading companies..." />
 * <LoadingSpinner fullScreen /> // Overlay entire screen
 * ```
 */
export function LoadingSpinner({
  size = 'md',
  message,
  fullScreen = false,
  color = 'primary',
}: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <Spinner size={size} color={color} />
      {message && (
        <p className="text-sm text-gray-600">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-[9999]">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-8">{content}</div>;
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **HeroUI Spinner**: Uses @heroui/spinner for consistency
 * 2. **Flexible**: Supports inline and fullscreen modes
 * 3. **Customizable**: Size, color, message props
 * 4. **Tailwind CSS**: Flex utilities for layout
 * 
 * PREVENTS:
 * - 50+ inline Spinner components (legacy build)
 * - Inconsistent loading UI patterns
 */
