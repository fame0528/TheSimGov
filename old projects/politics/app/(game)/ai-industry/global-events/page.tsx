/**
 * AI Industry Global Events Dashboard Page
 * 
 * @fileoverview Global impact events timeline and perception monitoring
 * Displays chronological events, public opinion, and regulatory pressure
 * 
 * @page /ai-industry/global-events
 * @requires components/ai/GlobalImpactTimeline
 * @requires components/ai/PublicPerceptionDashboard
 * @requires components/ai/RegulatoryPressureMonitor
 * 
 * @created 2025-11-15
 * @updated 2025-11-15
 */

import { Metadata } from 'next';
import { getServerSession } from '@/lib/auth/getServerSession';
import { redirect } from 'next/navigation';
import GlobalImpactTimeline from '@/components/ai/GlobalImpactTimeline';
import PublicPerceptionDashboard from '@/components/ai/PublicPerceptionDashboard';
import RegulatoryPressureMonitor from '@/components/ai/RegulatoryPressureMonitor';

/**
 * OVERVIEW:
 * 
 * AI Industry Global Events page for tracking worldwide AI impact events,
 * public perception, and regulatory pressure. Comprehensive view of societal
 * and governmental responses to AI industry developments.
 * 
 * KEY FEATURES:
 * - Global impact event timeline (5 event types, 4 severity levels)
 * - Public perception tracking (trust, sentiment, protest risk)
 * - Regulatory pressure monitoring (intervention probability)
 * - Real-time event filtering and pagination
 * - Strategic insights and recommendations
 * 
 * BUSINESS LOGIC:
 * - Requires authenticated user with active company
 * - Fetches events, perception, and regulatory data
 * - Displays comprehensive societal impact analysis
 * - Provides actionable reputation management insights
 * 
 * DEPENDENCIES:
 * - /api/ai/global-events endpoint
 * - /api/ai/public-opinion endpoint
 * - /api/ai/regulatory-response endpoint
 * - next-auth session management
 */

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'Global Events - AI Industry',
  description: 'Track global AI impact events, public perception, and regulatory pressure',
};

// ============================================================================
// Page Component
// ============================================================================

export default async function GlobalEventsPage() {
  // ============================================================================
  // Authentication
  // ============================================================================

  const session = await getServerSession();

  if (!session || !session.user) {
    redirect('/login?callbackUrl=/ai-industry/global-events');
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
                Global Events Dashboard
              </h1>
              <p className="text-gray-600">
                Monitor worldwide AI impact events, public perception, and regulatory responses
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <a
                href="/ai-industry/dominance"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Market Dominance
              </a>
              <a
                href="/ai-industry/competition"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Global Competition
              </a>
            </div>
          </div>

          {/* Navigation Breadcrumbs */}
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <a href="/dashboard" className="hover:text-gray-700">Dashboard</a>
            <span className="mx-2">/</span>
            <a href="/ai-industry" className="hover:text-gray-700">AI Industry</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Global Events</span>
          </div>
        </div>

        {/* Alert Banner - Event Impact Warning */}
        <div className="mb-6 bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-purple-700">
                <span className="font-medium">Global Monitoring Active:</span>
                {' '}Events are tracked across all countries and categories. High-severity events 
                may impact your company&apos;s reputation, market position, and regulatory standing.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="space-y-6">
          {/* Two-Column Layout: Timeline + Perception */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Global Impact Timeline (2/3 width) */}
            <div className="lg:col-span-2">
              <GlobalImpactTimeline companyId={companyId} limit={20} />
            </div>

            {/* Public Perception Sidebar (1/3 width) */}
            <div className="lg:col-span-1">
              <PublicPerceptionDashboard 
                companyId={companyId} 
                includeHistory={false}
                timeRange="30d"
              />
            </div>
          </div>

          {/* Regulatory Pressure Monitor */}
          <section>
            <RegulatoryPressureMonitor 
              companyId={companyId} 
              includeHistory={true}
              limit={10}
            />
          </section>

          {/* Event Type Legend */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Types & Severity</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Types */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">📋 Event Categories</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                    <span className="text-gray-700">Market Monopoly - Concentration concerns</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                    <span className="text-gray-700">Regulatory Intervention - Government action</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                    <span className="text-gray-700">Public Backlash - Social unrest</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    <span className="text-gray-700">AI Arms Race - International competition</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    <span className="text-gray-700">Automation Wave - Job displacement</span>
                  </div>
                </div>
              </div>

              {/* Severity Levels */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">⚠️ Severity Levels</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Minor</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                      Limited impact
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Major</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                      Significant concern
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Critical</span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                      Widespread effects
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Existential</span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                      Civilization threat
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Guidance */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">💡</span> Reputation Management Strategy
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h5 className="font-semibold text-blue-800 mb-2">Prevention</h5>
                <ul className="space-y-1 text-gray-700">
                  <li>• Monitor public sentiment trends</li>
                  <li>• Maintain AI safety standards</li>
                  <li>• Engage with regulators proactively</li>
                  <li>• Communicate transparently</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-purple-800 mb-2">Response</h5>
                <ul className="space-y-1 text-gray-700">
                  <li>• Address concerns promptly</li>
                  <li>• Provide factual information</li>
                  <li>• Demonstrate commitment to safety</li>
                  <li>• Collaborate on solutions</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-pink-800 mb-2">Recovery</h5>
                <ul className="space-y-1 text-gray-700">
                  <li>• Implement corrective actions</li>
                  <li>• Rebuild public trust</li>
                  <li>• Update safety protocols</li>
                  <li>• Track perception improvements</li>
                </ul>
              </div>
            </div>
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
 *    - Three main components integrated (timeline, perception, regulatory)
 *    - Responsive 3-column layout (timeline 2/3, perception 1/3)
 * 
 * 2. LAYOUT STRUCTURE:
 *    - Max-width container (7xl) for consistency
 *    - Two-column grid on desktop (lg:grid-cols-3)
 *    - Single column stacking on mobile
 *    - Regulatory monitor full-width below
 * 
 * 3. COMPONENT INTEGRATION:
 *    - GlobalImpactTimeline: Event filtering and pagination (limit=20)
 *    - PublicPerceptionDashboard: Trust and sentiment (30d history disabled)
 *    - RegulatoryPressureMonitor: Intervention tracking (10 history items)
 *    - All components share companyId from session
 * 
 * 4. USER EXPERIENCE:
 *    - Clear page header with multi-dashboard context
 *    - Alert banner for event impact awareness
 *    - Event type legend with color codes
 *    - Severity level explanation
 *    - Strategic guidance (prevention/response/recovery)
 *    - Quick navigation to related dashboards
 * 
 * 5. EVENT CATEGORIES (5 types):
 *    - Market Monopoly (purple): Market concentration concerns
 *    - Regulatory Intervention (red): Government actions
 *    - Public Backlash (orange): Social unrest and protests
 *    - AI Arms Race (blue): International competition
 *    - Automation Wave (green): Job displacement effects
 * 
 * 6. SEVERITY LEVELS (4 tiers):
 *    - Minor: Limited localized impact
 *    - Major: Significant regional concern
 *    - Critical: Widespread national/international effects
 *    - Existential: Civilization-threatening scenario
 * 
 * 7. VISUAL DESIGN:
 *    - Gray-50 background for consistency
 *    - White component cards with shadow-md
 *    - Purple accent theme (complements blue from dominance)
 *    - Color-coded event types and severity badges
 *    - Gradient strategic guidance card
 * 
 * 8. NAVIGATION:
 *    - Links to Market Dominance dashboard
 *    - Links to Global Competition map
 *    - Breadcrumbs to Dashboard and AI Industry hub
 *    - Internal component filters (event type, severity, status)
 * 
 * 9. PERFORMANCE:
 *    - Server-side auth check (fast)
 *    - Client-side component data fetching (parallel)
 *    - Pagination limits (20 events, 10 regulatory actions)
 *    - Optional history disabled for perception (faster load)
 * 
 * 10. SECURITY:
 *     - Session-based authentication required
 *     - Company ownership verification
 *     - Protected API endpoints (component-level checks)
 *     - No sensitive strategic data in page source
 * 
 * 11. REPUTATION MANAGEMENT:
 *     - Prevention strategies (monitoring, standards, engagement)
 *     - Response protocols (prompt action, transparency)
 *     - Recovery tactics (corrective actions, trust rebuilding)
 *     - Integrated perception and regulatory tracking
 * 
 * 12. FUTURE ENHANCEMENTS:
 *     - Event creation interface (manual trigger)
 *     - Response action logger (company reactions)
 *     - Historical event archive (full timeline)
 *     - Event impact simulator (what-if scenarios)
 *     - Real-time event notifications (WebSockets)
 *     - Export event reports (PDF/CSV)
 * 
 * @usage
 * Navigate to /ai-industry/global-events after authentication
 */
