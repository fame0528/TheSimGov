/**
 * @file app/(game)/energy/page.tsx
 * @description Energy industry main dashboard with 8-tab integration
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Comprehensive Energy industry dashboard integrating all energy business operations including
 * Oil & Gas extraction, Renewable energy generation, Commodity trading, Grid infrastructure,
 * Environmental compliance, Portfolio management, Market analytics, and Performance metrics.
 * Provides executive-level overview with revenue/profitability stats and quick access to all
 * energy subsystems through tabbed navigation.
 * 
 * COMPONENT ARCHITECTURE:
 * - Stats Overview: Revenue, Profitability, Operations count, Sustainability metrics
 * - Tab 1: Oil & Gas Operations (wells, fields, extraction, reserves)
 * - Tab 2: Renewable Energy (solar, wind, projects, subsidies, PPAs)
 * - Tab 3: Commodity Trading (futures, orders, pricing, OPEC events)
 * - Tab 4: Grid Infrastructure (power plants, transmission, nodes, analytics)
 * - Tab 5: Environmental Compliance (emissions, regulations, reporting)
 * - Tab 6: Energy Portfolio (allocation, diversification, performance)
 * - Tab 7: Market Analytics (technical indicators, correlations, trends)
 * - Tab 8: Performance Metrics (cross-domain KPIs, executive dashboard)
 * 
 * STATE MANAGEMENT:
 * - companyId: User's company ID from session
 * - selectedTab: Currently active tab index
 * - stats: Aggregate stats for overview cards
 * 
 * API INTEGRATION:
 * Each tab component handles its own data fetching via documented endpoints.
 * Dashboard fetches aggregate stats for overview cards.
 * 
 * AUTHENTICATION:
 * Server-side auth via NextAuth getServerSession. Redirects to /login if unauthenticated.
 * 
 * USAGE:
 * ```tsx
 * // Navigate to /energy
 * <Link href="/energy">Energy Dashboard</Link>
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Server component for auth check, client components for interactive tabs
 * - Lazy loading consideration: All tab components loaded on mount (acceptable for 8 tabs)
 * - Stats aggregation: Backend provides summary endpoints for overview cards
 * - Tab persistence: URL hash could track active tab (future enhancement)
 * - Responsive design: Chakra UI responsive grid for stats cards
 * - Color coding: Industry-specific colors (orange=oil, green=renewable, blue=trading, purple=grid)
 */

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/getServerSession';
import EnergyDashboardClient from '@/components/energy/EnergyDashboardClient';

/**
 * Energy page component
 * 
 * @description
 * Server component for authentication check and company ID lookup.
 * Renders client component for interactive dashboard.
 * 
 * @returns {Promise<JSX.Element>} Energy dashboard page
 */
export default async function EnergyPage(): Promise<JSX.Element> {
  // Server-side authentication check
  const session = await getServerSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // User's company ID from session
  const companyId = session.user.companyId;

  if (!companyId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>No Company Found</h1>
        <p>You must be associated with a company to access the Energy dashboard.</p>
      </div>
    );
  }

  return <EnergyDashboardClient companyId={companyId} />;
}
