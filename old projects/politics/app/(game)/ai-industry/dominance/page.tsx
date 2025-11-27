/**
 * AI Industry Dominance Dashboard Page
 * 
 * @fileoverview Market dominance monitoring dashboard with comprehensive metrics
 * Displays market share, HHI, competitive intelligence, and antitrust risk
 * 
 * @page /ai-industry/dominance
 * @requires components/ai/MarketDominanceDashboard
 * @requires components/ai/CompetitiveIntelligence
 * 
 * @created 2025-11-15
 * @updated 2025-11-15
 */

import { Metadata } from 'next';
import { getServerSession } from '@/lib/auth/getServerSession';
import { redirect } from 'next/navigation';
import MarketDominanceDashboard from '@/components/ai/MarketDominanceDashboard';
import CompetitiveIntelligence from '@/components/ai/CompetitiveIntelligence';

/**
 * OVERVIEW:
 * 
 * AI Industry Dominance monitoring page for tracking market concentration
 * and antitrust risk. Provides comprehensive view of market position,
 * competitive landscape, and regulatory exposure.
 * 
 * KEY FEATURES:
 * - Market dominance metrics (share, HHI, monopoly detection)
 * - Competitive intelligence (SWOT, threats, opportunities)
 * - Antitrust risk assessment
 * - Company ranking and position tracking
 * - Strategic insights and recommendations
 * 
 * BUSINESS LOGIC:
 * - Requires authenticated user with active company
 * - Fetches real-time market data from backend APIs
 * - Displays comprehensive competitive analysis
 * - Provides actionable strategic insights
 * 
 * DEPENDENCIES:
 * - /api/ai/dominance endpoint
 * - /api/ai/market-analysis endpoint
 * - next-auth session management
 */

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'Market Dominance - AI Industry',
  description: 'Track market share, HHI, competitive position, and antitrust risk in the AI industry',
};

// ============================================================================
// Page Component
// ============================================================================

export default async function DominancePage() {
  // ============================================================================
  // Authentication
  // ============================================================================

  const session = await getServerSession();

  if (!session || !session.user) {
    redirect('/login?callbackUrl=/ai-industry/dominance');
  }

  // Check if user has active company
  if (!session.user.companyId) {
    redirect('/companies?error=no-company');
  }

  const companyId = session.user.companyId;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Market Dominance Dashboard
              </h1>
              <p className="text-gray-600">
                Track your company&apos;s market position, competitive landscape, and antitrust exposure
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <a
                href="/ai-industry/global-events"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                View Global Events
              </a>
              <a
                href="/ai-industry/competition"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                International Competition
              </a>
            </div>
          </div>

          {/* Navigation Breadcrumbs */}
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <a href="/dashboard" className="hover:text-gray-700">Dashboard</a>
            <span className="mx-2">/</span>
            <a href="/ai-industry" className="hover:text-gray-700">AI Industry</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Market Dominance</span>
          </div>
        </div>

        {/* Alert Banner - Market Concentration Warning */}
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">Regulatory Monitoring Active:</span>
                {' '}Market concentration metrics are tracked by antitrust authorities. 
                High HHI or market share above 40% may trigger regulatory review.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="space-y-6">
          {/* Market Dominance Metrics */}
          <section>
            <MarketDominanceDashboard companyId={companyId} />
          </section>

          {/* Competitive Intelligence */}
          <section>
            <CompetitiveIntelligence companyId={companyId} />
          </section>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* HHI Interpretation Guide */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">📊</span> HHI Guidelines
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">&lt; 1,500</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                    Competitive
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">1,500 - 2,500</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                    Moderate
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">&gt; 2,500</span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                    Concentrated
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-3 pt-3 border-t">
                  Herfindahl-Hirschman Index measures market concentration. 
                  Values above 2,500 may attract antitrust scrutiny.
                </p>
              </div>
            </div>

            {/* Market Share Thresholds */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">🎯</span> Share Thresholds
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">&lt; 25%</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                    Safe
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">25% - 40%</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                    Elevated
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">&gt; 40%</span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                    Monopoly Risk
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-3 pt-3 border-t">
                  Market share above 40% is presumed dominant and subject to 
                  stricter antitrust enforcement.
                </p>
              </div>
            </div>

            {/* Strategic Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">⚡</span> Quick Actions
              </h3>
              <div className="space-y-2">
                <a
                  href="/ai-industry/global-events"
                  className="block w-full px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition text-sm font-medium text-center"
                >
                  View Impact Events
                </a>
                <a
                  href="/ai-industry/competition"
                  className="block w-full px-4 py-2 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition text-sm font-medium text-center"
                >
                  Global Competition
                </a>
                <a
                  href="/dashboard"
                  className="block w-full px-4 py-2 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition text-sm font-medium text-center"
                >
                  Back to Dashboard
                </a>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Strategic Insights</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Monitor HHI trends to anticipate regulatory scrutiny</li>
              <li>• Track competitor moves to identify market opportunities</li>
              <li>• Maintain market share below 40% to reduce antitrust risk</li>
              <li>• Diversify into adjacent markets to balance concentration</li>
              <li>• Prepare compliance strategies for high-concentration scenarios</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. PAGE ARCHITECTURE:
 *    - Server-side rendering with Next.js 14+ App Router
 *    - Authentication check via getServerSession
 *    - Redirect to login if unauthenticated
 *    - Redirect to companies page if no active company
 * 
 * 2. LAYOUT STRUCTURE:
 *    - Max-width container (7xl) for optimal readability
 *    - Responsive grid layouts (1/3 columns on mobile/desktop)
 *    - Consistent spacing (mb-6, space-y-6)
 *    - Sticky header consideration for future enhancement
 * 
 * 3. COMPONENT INTEGRATION:
 *    - MarketDominanceDashboard: Primary metrics display
 *    - CompetitiveIntelligence: SWOT and positioning analysis
 *    - Both components fetch data independently
 *    - Shared companyId prop from session
 * 
 * 4. USER EXPERIENCE:
 *    - Clear page header with context and navigation
 *    - Breadcrumb navigation for hierarchy clarity
 *    - Quick action buttons for related pages
 *    - Alert banner for regulatory context
 *    - Information cards with HHI/share guidelines
 *    - Strategic insights footer
 * 
 * 5. NAVIGATION:
 *    - Links to Global Events dashboard
 *    - Links to International Competition map
 *    - Breadcrumbs to Dashboard and AI Industry hub
 *    - Quick action card with duplicate links
 * 
 * 6. VISUAL DESIGN:
 *    - Gray-50 background for reduced eye strain
 *    - White cards with shadow-md for depth
 *    - Color-coded badges (green/yellow/red) for thresholds
 *    - Consistent Tailwind CSS utility classes
 *    - Blue accent color for primary actions
 * 
 * 7. ACCESSIBILITY:
 *    - Semantic HTML5 sections
 *    - ARIA-friendly navigation
 *    - Clear color contrast ratios
 *    - Keyboard navigation support (via links)
 *    - Screen reader friendly labels
 * 
 * 8. PERFORMANCE:
 *    - Server-side session check (fast auth)
 *    - Client-side component data fetching (parallel)
 *    - No unnecessary re-renders (static layout)
 *    - Optimized Tailwind CSS (purged unused styles)
 * 
 * 9. SECURITY:
 *    - Session-based authentication required
 *    - Company ownership verification (session.user.companyId)
 *    - Protected API endpoints (checked in components)
 *    - No sensitive data in page source
 * 
 * 10. FUTURE ENHANCEMENTS:
 *     - Real-time data updates (WebSockets)
 *     - Export to PDF functionality
 *     - Historical trend charts
 *     - Competitor comparison overlays
 *     - Alert configuration (threshold triggers)
 *     - Custom dashboard layouts (drag-drop widgets)
 * 
 * @usage
 * Navigate to /ai-industry/dominance after authentication
 */
