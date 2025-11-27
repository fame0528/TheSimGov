/**
 * @file app/(game)/companies/[id]/contracts/marketplace/page.tsx
 * @created 2025-11-13
 * @overview Contract Marketplace Page – provides interactive filtering, sorting, and pagination
 * for browsing available or bidding contracts. Integrates with /api/contracts/marketplace.
 *
 * FEATURES:
 * - Filter panel (type, industry, value range, duration range, complexity, risk, skill)
 * - Sorting (value, deadline, complexity, marketDemand, createdAt)
 * - Pagination controls (page navigation, page size)
 * - Contract cards grid view
 * - Responsive layout (mobile → stacked, desktop → 3/4 column grid)
 * - Graceful error + loading states
 * - Accessibility: semantic elements, focus management on filters
 *
 * USAGE:
 * This is a Next.js server component with client sub-components.
 * Route: /companies/{companyId}/contracts/marketplace
 */

import MarketplaceClient from './MarketplaceClient';

// Server component wrapper to enable future data prefetching if needed.
export default function MarketplacePage() {
  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Contract Marketplace</h1>
        <p className="text-sm text-gray-600 mt-1">
          Discover active opportunities. Apply filters to narrow results and submit competitive bids.
        </p>
      </header>
      <MarketplaceClient />
    </div>
  );
}

/**
 * Implementation Notes:
 * - Separation of concerns: Server wrapper + client component for interactive logic.
 * - MarketplaceClient is a client component handling stateful interactions.
 * - Future enhancement: pass initial SSR snapshot for faster first paint.
 */
