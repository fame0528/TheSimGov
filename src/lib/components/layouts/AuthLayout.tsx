/**
 * @fileoverview Auth Layout Component
 * @module lib/components/layouts/AuthLayout
 * 
 * OVERVIEW:
 * Layout wrapper for authentication pages (login, register).
 * Centered card design with branding.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { ReactNode } from 'react';

export interface AuthLayoutProps {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Form content */
  children: ReactNode;
}

/**
 * AuthLayout - Consistent layout for auth pages
 * 
 * @example
 * ```tsx
 * <AuthLayout
 *   title="Sign In"
 *   description="Welcome back to Business Politics MMO"
 * >
 *   <LoginForm />
 * </AuthLayout>
 * ```
 */
export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container mx-auto max-w-md px-4">
        <div className="flex flex-col gap-8 items-stretch">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-4xl font-bold">{title}</h1>
            {description && (
              <p className="text-gray-600 text-lg">
                {description}
              </p>
            )}
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Centered**: Card centered on page for focus
 * 2. **Clean**: Minimal design for auth flows
 * 3. **Consistent**: Same structure for login/register
 * 4. **Accessible**: Proper heading hierarchy
 * 5. **Tailwind CSS**: Utility classes for layout
 * 
 * PREVENTS:
 * - Duplicate auth page layouts
 * - Inconsistent auth UI
 */
