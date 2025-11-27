/**
 * @file app/(game)/companies/[id]/contracts/analytics/page.tsx
 * @created 2025-11-13
 * @overview Contract Analytics Page – visualizes company performance metrics by
 * consuming /api/contracts/analytics. Displays KPIs, charts, and recent contracts.
 */

import AnalyticsClient from './AnalyticsClient';

export default function AnalyticsPage() {
  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Contract Analytics</h1>
        <p className="text-sm text-gray-600 mt-1">Performance overview: win rates, quality trends, profitability and recent activity.</p>
      </header>
      <AnalyticsClient />
    </div>
  );
}

/**
 * Implementation Notes:
 * - Server wrapper with client component for interaction (timeframe switching).
 * - Potential SSR enhancement: pass initial analytics snapshot for hydration.
 */
