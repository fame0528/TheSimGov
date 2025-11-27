/**
 * @fileoverview Dashboard Layout Component
 * @module lib/components/layouts/DashboardLayout
 * 
 * OVERVIEW:
 * Main layout wrapper for authenticated dashboard pages.
 * Includes navigation, sidebar, and content area.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { ReactNode } from 'react';
import { PageHeader } from './PageHeader';

export interface DashboardLayoutProps {
  /** Page title */
  title: string;
  /** Page subtitle/description */
  subtitle?: string;
  /** Action buttons for header */
  actions?: ReactNode;
  /** Page content */
  children: ReactNode;
  /** Maximum content width */
  maxWidth?: string;
}

/**
 * DashboardLayout - Consistent layout for dashboard pages
 * 
 * @example
 * ```tsx
 * <DashboardLayout
 *   title="Companies"
 *   subtitle="Manage your business empire"
 *   actions={<Button>Create Company</Button>}
 * >
 *   <DataTable data={companies} columns={columns} />
 * </DashboardLayout>
 * ```
 */
export function DashboardLayout({
  title,
  subtitle,
  actions,
  children,
  maxWidth = '1200px',
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1">
        <PageHeader title={title} subtitle={subtitle} actions={actions} />
        <div className="container mx-auto py-8 px-8" style={{ maxWidth }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Consistent**: Same layout structure across all dashboard pages
 * 2. **Flexible**: Customizable max width and header actions
 * 3. **Responsive**: Container adjusts to screen size
 * 4. **Clean**: Simple composition with PageHeader
 * 5. **Tailwind CSS**: Utility classes for layout
 * 
 * PREVENTS:
 * - Duplicate layout code across pages
 * - Inconsistent spacing and structure
 */
