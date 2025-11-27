/**
 * @file app/(game)/technology/page.tsx
 * @description Technology/Software industry main dashboard with 10-tab integration
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Comprehensive Technology industry dashboard integrating all software business operations including
 * AI Research, Innovation & IP, Software products, SaaS offerings, Cloud infrastructure,
 * Patent portfolio, VC funding, Performance analytics, Market intelligence, and Settings.
 * Provides executive-level overview with revenue/profitability stats and quick access to all
 * technology subsystems through tabbed navigation.
 * 
 * COMPONENT ARCHITECTURE:
 * - Stats Overview: Revenue, R&D Investment, Active projects, Innovation metrics
 * - Tab 1: Software Products (development, releases, licensing)
 * - Tab 2: AI Research (compute, datasets, projects, benchmarks, safety, alignment)
 * - Tab 3: SaaS Operations (subscriptions, MRR, churn, customer success)
 * - Tab 4: Cloud Infrastructure (servers, CDN, scalability, costs)
 * - Tab 5: Innovation & IP (patents, funding, acquisitions, cap table)
 * - Tab 6: Patent Portfolio (filed, granted, litigation, licensing)
 * - Tab 7: VC Funding (rounds, valuations, term sheets, exits)
 * - Tab 8: Performance (KPIs, metrics, benchmarks)
 * - Tab 9: Analytics (market trends, competitive intelligence)
 * - Tab 10: Settings (preferences, integrations, team)
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
 * // Navigate to /technology
 * <Link href="/technology">Technology Dashboard</Link>
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Server component for auth check, client components for interactive tabs
 * - Lazy loading consideration: All tab components loaded on mount (acceptable for 10 tabs)
 * - Stats aggregation: Backend provides summary endpoints for overview cards
 * - Tab persistence: URL hash could track active tab (future enhancement)
 * - Responsive design: Chakra UI responsive grid for stats cards
 * - Color coding: Industry-specific colors (blue=software, purple=AI, green=SaaS, cyan=cloud, orange=innovation)
 */

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/getServerSession';
import TechnologyDashboardClient from '@/components/technology/TechnologyDashboardClient';

/**
 * Technology page component
 * 
 * @description
 * Server component for authentication check and company ID lookup.
 * Renders client component for interactive dashboard.
 * 
 * @returns {Promise<JSX.Element>} Technology dashboard page
 */
export default async function TechnologyPage(): Promise<JSX.Element> {
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
        <p>You must be associated with a company to access the Technology dashboard.</p>
      </div>
    );
  }

  return <TechnologyDashboardClient companyId={companyId} />;
}
