/**
 * AI Industry International Competition Dashboard Page
 * 
 * @fileoverview Global competitive landscape and geopolitical analysis
 * Displays country rankings, competitive intelligence, and strategic positioning
 * 
 * @page /ai-industry/competition
 * @requires components/ai/InternationalCompetitionMap
 * @requires components/ai/CompetitiveIntelligence
 * 
 * @created 2025-11-15
 * @updated 2025-11-15
 */

import { Metadata } from 'next';
import { getServerSession } from '@/lib/auth/getServerSession';
import { redirect } from 'next/navigation';
import InternationalCompetitionMap from '@/components/ai/InternationalCompetitionMap';
import CompetitiveIntelligence from '@/components/ai/CompetitiveIntelligence';

/**
 * OVERVIEW:
 * 
 * AI Industry International Competition page for tracking global competitive
 * landscape, geopolitical dynamics, and strategic market positioning across
 * countries and regions.
 * 
 * KEY FEATURES:
 * - Country rankings by AI market share
 * - Geopolitical tension and arms race tracking
 * - International cooperation vs. conflict analysis
 * - Competitive intelligence (SWOT, positioning)
 * - Strategic recommendations for global expansion
 * 
 * BUSINESS LOGIC:
 * - Requires authenticated user with active company
 * - Fetches global competition and market analysis data
 * - Displays comprehensive international landscape
 * - Provides strategic insights for global strategy
 * 
 * DEPENDENCIES:
 * - /api/ai/global-competition endpoint
 * - /api/ai/market-analysis endpoint
 * - next-auth session management
 */

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'International Competition - AI Industry',
  description: 'Track global AI competition, country rankings, and geopolitical dynamics',
};

// ============================================================================
// Page Component
// ============================================================================

export default async function CompetitionPage() {
  // ============================================================================
  // Authentication
  // ============================================================================

  const session = await getServerSession();

  if (!session || !session.user) {
    redirect('/login?callbackUrl=/ai-industry/competition');
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
                International Competition Dashboard
              </h1>
              <p className="text-gray-600">
                Monitor global competitive landscape, country rankings, and geopolitical dynamics
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
                href="/ai-industry/global-events"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Global Events
              </a>
            </div>
          </div>

          {/* Navigation Breadcrumbs */}
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <a href="/dashboard" className="hover:text-gray-700">Dashboard</a>
            <span className="mx-2">/</span>
            <a href="/ai-industry" className="hover:text-gray-700">AI Industry</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">International Competition</span>
          </div>
        </div>

        {/* Alert Banner - Geopolitical Context */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Geopolitical Intelligence:</span>
                {' '}Global AI competition is influenced by national interests, regulatory environments, 
                and strategic alliances. Monitor tension levels and cooperation opportunities carefully.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="space-y-6">
          {/* International Competition Map */}
          <section>
            <InternationalCompetitionMap 
              industry="AI"
              subcategory="All"
              includeDetails={true}
              minMarketShare={1}
            />
          </section>

          {/* Competitive Intelligence */}
          <section>
            <CompetitiveIntelligence companyId={companyId} />
          </section>

          {/* Strategy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Market Entry Strategies */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">🌍</span> Market Entry
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold text-blue-700 mb-1">Permissive Markets</h4>
                  <p className="text-xs">Light regulation, fast approval, high innovation</p>
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-700 mb-1">Moderate Markets</h4>
                  <p className="text-xs">Balanced oversight, predictable rules, stable growth</p>
                </div>
                <div>
                  <h4 className="font-semibold text-red-700 mb-1">Restrictive Markets</h4>
                  <p className="text-xs">Heavy regulation, slow entry, compliance costs</p>
                </div>
              </div>
            </div>

            {/* Partnership Opportunities */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">🤝</span> Partnerships
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Strategic alliances with foreign companies</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Joint ventures in emerging markets</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Research collaborations with universities</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Government partnerships for local presence</span>
                </div>
              </div>
            </div>

            {/* Risk Mitigation */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">🛡️</span> Risk Management
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="text-orange-500 mr-2">⚠</span>
                  <span>Diversify across multiple countries</span>
                </div>
                <div className="flex items-start">
                  <span className="text-orange-500 mr-2">⚠</span>
                  <span>Monitor geopolitical tension levels</span>
                </div>
                <div className="flex items-start">
                  <span className="text-orange-500 mr-2">⚠</span>
                  <span>Prepare for regulatory changes</span>
                </div>
                <div className="flex items-start">
                  <span className="text-orange-500 mr-2">⚠</span>
                  <span>Build local brand presence</span>
                </div>
              </div>
            </div>
          </div>

          {/* Geopolitical Insights */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Geopolitical Context</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cooperation Scenarios */}
              <div>
                <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center">
                  <span className="mr-2">🤝</span> Cooperation Opportunities
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• International AI safety standards development</li>
                  <li>• Cross-border research collaboration programs</li>
                  <li>• Joint regulation frameworks (EU-US, etc.)</li>
                  <li>• Technology transfer agreements</li>
                  <li>• Shared infrastructure initiatives</li>
                </ul>
              </div>

              {/* Conflict Risks */}
              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center">
                  <span className="mr-2">💥</span> Conflict Risks
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• AI arms race acceleration (military applications)</li>
                  <li>• Trade wars and export restrictions</li>
                  <li>• Data sovereignty and privacy disputes</li>
                  <li>• Intellectual property theft concerns</li>
                  <li>• National security-driven market bans</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Strategic Recommendations */}
          <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-green-50 border border-purple-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🎯</span> Global Strategy Framework
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <h5 className="font-semibold text-purple-800 mb-2">Assess</h5>
                <ul className="space-y-1 text-gray-700">
                  <li>• Market potential</li>
                  <li>• Regulatory climate</li>
                  <li>• Competitor presence</li>
                  <li>• Risk factors</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-blue-800 mb-2">Enter</h5>
                <ul className="space-y-1 text-gray-700">
                  <li>• Strategic partnerships</li>
                  <li>• Local compliance</li>
                  <li>• Brand establishment</li>
                  <li>• Talent acquisition</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-green-800 mb-2">Expand</h5>
                <ul className="space-y-1 text-gray-700">
                  <li>• Market share growth</li>
                  <li>• Product localization</li>
                  <li>• Network effects</li>
                  <li>• Regional hubs</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-orange-800 mb-2">Defend</h5>
                <ul className="space-y-1 text-gray-700">
                  <li>• Competitive moats</li>
                  <li>• Brand loyalty</li>
                  <li>• Regulatory relations</li>
                  <li>• Innovation pace</li>
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
 *    - Two main components (international map, competitive intelligence)
 *    - Strategic guidance cards and geopolitical context
 * 
 * 2. LAYOUT STRUCTURE:
 *    - Max-width container (7xl) for consistency
 *    - Full-width international competition map
 *    - Full-width competitive intelligence panel
 *    - 3-column strategy cards grid
 *    - 2-column geopolitical insights
 * 
 * 3. COMPONENT INTEGRATION:
 *    - InternationalCompetitionMap: Country rankings, tension, cooperation
 *    - CompetitiveIntelligence: SWOT, positioning, market structure
 *    - Both components fetch data independently
 *    - Map includes all countries (minMarketShare=1%)
 * 
 * 4. USER EXPERIENCE:
 *    - Clear page header with global context
 *    - Geopolitical alert banner
 *    - Market entry strategy guidance (3 regulatory types)
 *    - Partnership opportunities checklist
 *    - Risk mitigation recommendations
 *    - Cooperation vs. conflict scenarios
 *    - 4-phase global strategy framework
 * 
 * 5. REGULATORY STANCES (3 types):
 *    - Permissive: Light regulation, innovation-focused (e.g., Singapore)
 *    - Moderate: Balanced approach, predictable rules (e.g., Canada)
 *    - Restrictive: Heavy oversight, safety-focused (e.g., EU)
 * 
 * 6. PARTNERSHIP TYPES:
 *    - Strategic alliances: Market access and resources
 *    - Joint ventures: Shared risk and investment
 *    - Research collaborations: Innovation and talent
 *    - Government partnerships: Local legitimacy
 * 
 * 7. RISK MITIGATION:
 *    - Geographic diversification across countries
 *    - Tension monitoring (geopolitical risk)
 *    - Regulatory compliance preparation
 *    - Local brand building (reduce foreign perception)
 * 
 * 8. GEOPOLITICAL SCENARIOS:
 *    - Cooperation: Safety standards, research, regulation
 *    - Conflict: Arms race, trade wars, IP theft, bans
 *    - Dynamic based on tension and cooperation scores
 * 
 * 9. GLOBAL STRATEGY FRAMEWORK (4 phases):
 *    - Assess: Market research and risk analysis
 *    - Enter: Partnerships, compliance, brand
 *    - Expand: Growth, localization, network effects
 *    - Defend: Moats, loyalty, regulatory relations
 * 
 * 10. VISUAL DESIGN:
 *     - Gray-50 background for consistency
 *     - White cards with shadow-md
 *     - Purple/blue/green gradient theme (global diversity)
 *     - Color-coded regulatory stances and strategies
 *     - Icon-enhanced section headers
 * 
 * 11. NAVIGATION:
 *     - Links to Market Dominance dashboard
 *     - Links to Global Events timeline
 *     - Breadcrumbs to Dashboard and AI Industry hub
 *     - Internal map filters (country, market share)
 * 
 * 12. PERFORMANCE:
 *     - Server-side auth check (fast)
 *     - Client-side component data fetching (parallel)
 *     - All country data included (minMarketShare=1%)
 *     - Detailed insights enabled (includeDetails=true)
 * 
 * 13. SECURITY:
 *     - Session-based authentication required
 *     - Company ownership verification
 *     - Protected API endpoints (component-level)
 *     - No sensitive strategic intel in page source
 * 
 * 14. FUTURE ENHANCEMENTS:
 *     - Interactive world map visualization (Leaflet/Mapbox)
 *     - Country comparison tool (side-by-side metrics)
 *     - Market entry simulator (what-if scenarios)
 *     - Partnership recommendation engine
 *     - Geopolitical risk alerts (real-time notifications)
 *     - Export strategy reports (PDF/CSV)
 * 
 * @usage
 * Navigate to /ai-industry/competition after authentication
 */
