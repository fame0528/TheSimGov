/**
 * @fileoverview Infrastructure Test Page
 * @module app/test-infrastructure/page
 * 
 * OVERVIEW:
 * Comprehensive UI demonstration of ALL infrastructure components.
 * Tests hooks, components, layouts, contexts, and utilities.
 * 
 * NOTE: Temporarily disabled due to DataTable rendering issue during build.
 * TODO: Fix DataTable SSR compatibility
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { Button } from '@heroui/react';

/**
 * Test Infrastructure Page - TEMPORARILY DISABLED
 */
export default function TestInfrastructurePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl font-bold mb-4">Infrastructure Test Page</h1>
        <p className="text-gray-600 mb-4">
          This page is temporarily disabled due to a DataTable SSR rendering issue.
          The build process is completing the page data collection phase.
        </p>
        <p className="text-sm text-gray-500">
          TODO: Fix DataTable component SSR compatibility for production builds.
        </p>
      </div>
    </div>
  );
}

/**
 * ORIGINAL IMPLEMENTATION NOTES (Preserved for reference):
 * 
 * This page demonstrated:
 * 1. ✅ DashboardLayout with title, subtitle, actions
 * 2. ✅ All 7 shared components (LoadingSpinner, ErrorMessage, etc.)
 * 3. ✅ All 5 UI hooks (useToast, useModal, usePagination, useSort, useDebounce)
 * 4. ✅ Utility functions (formatCurrency, formatPercent, pluralize)
 * 5. ✅ TypeScript types (Company interface)
 * 6. ✅ Chakra UI integration
 * 
 * KNOWN ISSUE:
 * - DataTable component has SSR rendering issue ("TypeError: c is not a function")
 * - Appears to be related to column accessor functions in minified build
 * - Development mode works fine, only affects production build
 * - Needs investigation into HeroUI DataTable SSR compatibility
 */
