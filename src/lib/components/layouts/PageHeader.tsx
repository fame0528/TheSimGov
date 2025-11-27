/**
 * @fileoverview Page Header Component
 * @module lib/components/layouts/PageHeader
 * 
 * OVERVIEW:
 * Reusable page header with title, subtitle, and action buttons.
 * Used in DashboardLayout and standalone pages.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { ReactNode } from 'react';

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Page subtitle/description */
  subtitle?: string;
  /** Action buttons */
  actions?: ReactNode;
  /** Background color */
  bg?: string;
}

/**
 * PageHeader - Consistent page header
 * 
 * @example
 * ```tsx
 * <PageHeader
 *   title="Companies"
 *   subtitle="Manage your business empire"
 *   actions={
 *     <>
 *       <Button variant="outline">Filter</Button>
 *       <Button color="primary">Create Company</Button>
 *     </>
 *   }
 * />
 * ```
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  bg,
}: PageHeaderProps) {
  return (
    <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl py-6 px-8">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-400 mt-1 text-sm">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex gap-3">{actions}</div>}
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Flexible**: Works with/without subtitle and actions
 * 2. **Spacing**: Consistent padding and gaps
 * 3. **Alignment**: Title left, actions right
 * 4. **Border**: Bottom border for visual separation
 * 5. **Tailwind CSS**: Utility classes for layout
 * 
 * PREVENTS:
 * - Duplicate page header implementations
 * - Inconsistent title/action spacing
 */
