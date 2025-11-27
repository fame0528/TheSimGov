/**
 * International Competition Map Component
 * 
 * @fileoverview Global AI competition visualization with country-level market analysis
 * Displays world map, country rankings, tension levels, and geopolitical insights
 * 
 * @component InternationalCompetitionMap
 * @requires /api/ai/global-competition (GET)
 * 
 * @created 2025-11-15
 * @updated 2025-11-15
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * OVERVIEW:
 * 
 * International AI competition tracking and geopolitical analysis.
 * 
 * KEY FEATURES:
 * - Country rankings by market share
 * - Tension level indicators (0-100)
 * - Arms race risk assessment (0-100)
 * - Cooperation opportunities identification
 * - Conflict risk analysis
 * - Top companies by country
 * - Market concentration metrics
 * - Strategic recommendations
 * 
 * BUSINESS LOGIC:
 * - Fetches global competition data from API
 * - Ranks countries by AI industry dominance
 * - Calculates geopolitical tension
 * - Identifies cooperation vs. conflict scenarios
 * 
 * DEPENDENCIES:
 * - /api/ai/global-competition endpoint
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface CountryData {
  country: string;
  marketShare: number;
  topCompanies: {
    name: string;
    marketShare: number;
    agiCapability: number;
  }[];
  concentration: 'Low' | 'Medium' | 'High';
  governmentSupport: number;
  regulatoryStance: 'Permissive' | 'Moderate' | 'Restrictive';
}

interface GlobalLandscape {
  tensionLevel: number;
  armsRaceRisk: number;
  dominantCountry: string;
  emergingPowers: string[];
  cooperationScore: number;
}

interface GeopoliticalInsight {
  category: 'Cooperation' | 'Competition' | 'Conflict';
  title: string;
  description: string;
  countries: string[];
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

interface StrategicRecommendation {
  recommendation: string;
  rationale: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface InternationalCompetitionMapProps {
  industry?: string;
  subcategory?: string;
  includeDetails?: boolean;
  minMarketShare?: number;
}

// ============================================================================
// Main Component
// ============================================================================

export default function InternationalCompetitionMap({
  industry = 'AI',
  subcategory = 'All',
  includeDetails = true,
  minMarketShare = 1,
}: InternationalCompetitionMapProps) {
  const [globalLandscape, setGlobalLandscape] = useState<GlobalLandscape | null>(null);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [insights, setInsights] = useState<GeopoliticalInsight[]>([]);
  const [recommendations, setRecommendations] = useState<StrategicRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Fetch global competition data
   */
  const fetchCompetitionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        industry,
        subcategory,
        includeDetails: includeDetails.toString(),
        minMarketShare: minMarketShare.toString(),
      });

      const response = await fetch(`/api/ai/global-competition?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch competition data');
      }

      setGlobalLandscape(result.data.globalLandscape);
      setCountries(result.data.countries || []);
      setInsights(result.data.geopoliticalInsights || []);
      
      if (result.data.strategicRecommendations) {
        setRecommendations(result.data.strategicRecommendations);
      }
    } catch (err: any) {
      console.error('Error fetching competition data:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCompetitionData();
  }, [industry, subcategory, includeDetails, minMarketShare]);

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Get color for tension level
   */
  const getTensionColor = (level: number): string => {
    if (level >= 80) return 'text-red-600 bg-red-50 border-red-300';
    if (level >= 60) return 'text-orange-600 bg-orange-50 border-orange-300';
    if (level >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    return 'text-green-600 bg-green-50 border-green-300';
  };

  /**
   * Get color for arms race risk
   */
  const getArmsRaceColor = (risk: number): string => {
    if (risk >= 80) return 'bg-red-600';
    if (risk >= 60) return 'bg-orange-500';
    if (risk >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  /**
   * Get color for concentration level
   */
  const getConcentrationColor = (concentration: string): string => {
    const colors: Record<string, string> = {
      'High': 'bg-red-100 text-red-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Low': 'bg-green-100 text-green-800',
    };
    return colors[concentration] || 'bg-gray-100 text-gray-800';
  };

  /**
   * Get color for regulatory stance
   */
  const getRegulatoryColor = (stance: string): string => {
    const colors: Record<string, string> = {
      'Permissive': 'bg-green-100 text-green-800',
      'Moderate': 'bg-blue-100 text-blue-800',
      'Restrictive': 'bg-red-100 text-red-800',
    };
    return colors[stance] || 'bg-gray-100 text-gray-800';
  };

  /**
   * Get color for insight category
   */
  const getInsightColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Cooperation': 'border-green-300 bg-green-50',
      'Competition': 'border-blue-300 bg-blue-50',
      'Conflict': 'border-red-300 bg-red-50',
    };
    return colors[category] || 'border-gray-300 bg-gray-50';
  };

  /**
   * Get icon for insight category
   */
  const getInsightIcon = (category: string): string => {
    const icons: Record<string, string> = {
      'Cooperation': '🤝',
      'Competition': '⚔️',
      'Conflict': '💥',
    };
    return icons[category] || '📌';
  };

  /**
   * Get icon for severity
   */
  const getSeverityIcon = (severity: string): string => {
    const icons: Record<string, string> = {
      'Critical': '🚨',
      'High': '⚠️',
      'Medium': '📊',
      'Low': 'ℹ️',
    };
    return icons[severity] || '📌';
  };

  /**
   * Get flag emoji for country (simplified)
   */
  const getCountryFlag = (country: string): string => {
    const flags: Record<string, string> = {
      'United States': '🇺🇸',
      'China': '🇨🇳',
      'European Union': '🇪🇺',
      'United Kingdom': '🇬🇧',
      'Japan': '🇯🇵',
      'India': '🇮🇳',
      'Canada': '🇨🇦',
      'South Korea': '🇰🇷',
      'Australia': '🇦🇺',
      'Israel': '🇮🇱',
      'Singapore': '🇸🇬',
      'Russia': '🇷🇺',
    };
    return flags[country] || '🌐';
  };

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading && !globalLandscape) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Competition Data</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchCompetitionData}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!globalLandscape) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No global competition data available</p>
      </div>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">International Competition Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Geopolitical Tension */}
          <div className={`border-2 rounded-lg p-6 ${getTensionColor(globalLandscape.tensionLevel)}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-medium mb-2">Geopolitical Tension</p>
                <p className="text-5xl font-bold mb-2">{globalLandscape.tensionLevel}</p>
                <p className="text-xs">
                  {globalLandscape.tensionLevel >= 80 ? 'Extreme - Conflict likely' :
                   globalLandscape.tensionLevel >= 60 ? 'High - Escalating rivalry' :
                   globalLandscape.tensionLevel >= 40 ? 'Moderate - Competing interests' :
                   'Low - Stable cooperation'}
                </p>
              </div>
              <span className="text-4xl">
                {globalLandscape.tensionLevel >= 80 ? '💥' :
                 globalLandscape.tensionLevel >= 60 ? '⚔️' :
                 globalLandscape.tensionLevel >= 40 ? '🌐' : '🤝'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  globalLandscape.tensionLevel >= 80 ? 'bg-red-600' :
                  globalLandscape.tensionLevel >= 60 ? 'bg-orange-500' :
                  globalLandscape.tensionLevel >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${globalLandscape.tensionLevel}%` }}
              ></div>
            </div>
          </div>

          {/* Arms Race Risk */}
          <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-2">AI Arms Race Risk</p>
                <p className="text-5xl font-bold text-purple-800 mb-2">{globalLandscape.armsRaceRisk}</p>
                <p className="text-xs text-purple-600">
                  {globalLandscape.armsRaceRisk >= 80 ? 'Critical - Accelerating' :
                   globalLandscape.armsRaceRisk >= 60 ? 'High - Active competition' :
                   'Moderate - Monitoring'}
                </p>
              </div>
              <span className="text-4xl">🚀</span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${getArmsRaceColor(globalLandscape.armsRaceRisk)}`}
                style={{ width: `${globalLandscape.armsRaceRisk}%` }}
              ></div>
            </div>
          </div>

          {/* Cooperation Score */}
          <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-2">Cooperation Score</p>
                <p className="text-5xl font-bold text-blue-800 mb-2">{globalLandscape.cooperationScore}</p>
                <p className="text-xs text-blue-600">
                  {globalLandscape.cooperationScore >= 70 ? 'Strong collaboration' :
                   globalLandscape.cooperationScore >= 40 ? 'Moderate partnerships' :
                   'Limited cooperation'}
                </p>
              </div>
              <span className="text-4xl">🌍</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${globalLandscape.cooperationScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Key Players */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-lg p-4">
            <p className="text-sm font-semibold text-yellow-800 mb-2">👑 Dominant Country</p>
            <p className="text-2xl font-bold text-yellow-900 flex items-center">
              <span className="mr-2">{getCountryFlag(globalLandscape.dominantCountry)}</span>
              {globalLandscape.dominantCountry}
            </p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-300 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-800 mb-2">📈 Emerging Powers</p>
            <div className="flex flex-wrap gap-2">
              {globalLandscape.emergingPowers.map((country, idx) => (
                <span key={idx} className="px-3 py-1 bg-white rounded-full text-sm font-medium text-blue-700">
                  {getCountryFlag(country)} {country}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Country Rankings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Country Rankings by Market Share</h3>

        {countries.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No country data available</p>
        ) : (
          <div className="space-y-4">
            {countries.map((country, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center flex-1">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4 text-2xl font-bold text-gray-600">
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                        <span className="mr-2 text-2xl">{getCountryFlag(country.country)}</span>
                        {country.country}
                      </h4>
                      <div className="flex gap-2 mt-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getConcentrationColor(country.concentration)}`}>
                          {country.concentration} Concentration
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getRegulatoryColor(country.regulatoryStance)}`}>
                          {country.regulatoryStance}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-800">{country.marketShare.toFixed(1)}%</p>
                    <p className="text-xs text-gray-600">Market Share</p>
                  </div>
                </div>

                {/* Market Share Bar */}
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${country.marketShare}%` }}
                    ></div>
                  </div>
                </div>

                {/* Government Support */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-600">Government Support</span>
                    <span className="text-xs font-bold text-gray-800">{country.governmentSupport}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${country.governmentSupport >= 70 ? 'bg-green-500' : country.governmentSupport >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${country.governmentSupport}%` }}
                    ></div>
                  </div>
                </div>

                {/* Top Companies */}
                {country.topCompanies && country.topCompanies.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Top Companies</p>
                    <div className="space-y-2">
                      {country.topCompanies.slice(0, 3).map((company, companyIdx) => (
                        <div key={companyIdx} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700 font-medium">{company.name}</span>
                          <div className="flex gap-3 text-xs">
                            <span className="text-gray-600">{company.marketShare.toFixed(1)}% share</span>
                            <span className="text-blue-600 font-semibold">AGI: {company.agiCapability}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Geopolitical Insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Geopolitical Insights</h3>

          <div className="grid grid-cols-1 gap-4">
            {insights.map((insight, idx) => (
              <div key={idx} className={`border-2 rounded-lg p-4 ${getInsightColor(insight.category)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center flex-1">
                    <span className="text-2xl mr-3">{getInsightIcon(insight.category)}</span>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">{insight.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Countries: {insight.countries.join(', ')}
                      </p>
                    </div>
                  </div>
                  <span className="text-xl">{getSeverityIcon(insight.severity)}</span>
                </div>

                <p className="text-sm text-gray-700 mb-3">{insight.description}</p>

                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-gray-700">
                    {insight.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    insight.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                    insight.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                    insight.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {insight.severity} Priority
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategic Recommendations (Owners Only) */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🔒</span> Strategic Recommendations
          </h3>

          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-md font-semibold text-gray-800 flex-1">{rec.recommendation}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {rec.priority} Priority
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Rationale:</span> {rec.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. COMPONENT ARCHITECTURE:
 *    - Client-side React component
 *    - Fetches global AI competition landscape
 *    - Visualizes country rankings and geopolitical dynamics
 *    - Provides strategic insights and recommendations
 * 
 * 2. GEOPOLITICAL TENSION (0-100):
 *    - 80+: Extreme - Conflict likely (💥)
 *    - 60-80: High - Escalating rivalry (⚔️)
 *    - 40-60: Moderate - Competing interests (🌐)
 *    - <40: Low - Stable cooperation (🤝)
 * 
 * 3. ARMS RACE RISK (0-100):
 *    - Measures acceleration of AGI development
 *    - 80+: Critical - Countries racing to AGI
 *    - 60-80: High - Active competition
 *    - <60: Moderate - Monitoring phase
 * 
 * 4. COOPERATION SCORE (0-100):
 *    - 70+: Strong international collaboration
 *    - 40-70: Moderate partnerships and treaties
 *    - <40: Limited cooperation, fragmented
 * 
 * 5. COUNTRY DATA:
 *    - Market share percentage (global AI industry)
 *    - Top companies (up to 3 displayed per country)
 *    - Concentration level (Low/Medium/High)
 *    - Government support score (0-100)
 *    - Regulatory stance (Permissive/Moderate/Restrictive)
 * 
 * 6. CONCENTRATION LEVELS:
 *    - High: 1-2 dominant companies (red)
 *    - Medium: 3-5 leading companies (yellow)
 *    - Low: Distributed market (green)
 * 
 * 7. REGULATORY STANCES:
 *    - Permissive: Light regulation, innovation-focused (green)
 *    - Moderate: Balanced approach (blue)
 *    - Restrictive: Heavy oversight, safety-focused (red)
 * 
 * 8. GEOPOLITICAL INSIGHTS (3 categories):
 *    - Cooperation: Treaties, partnerships, agreements (🤝)
 *    - Competition: Market rivalry, talent wars (⚔️)
 *    - Conflict: Trade wars, bans, sanctions (💥)
 * 
 * 9. INSIGHT SEVERITY:
 *    - Critical: Immediate geopolitical threat (🚨)
 *    - High: Significant strategic concern (⚠️)
 *    - Medium: Noteworthy development (📊)
 *    - Low: Informational (ℹ️)
 * 
 * 10. STRATEGIC RECOMMENDATIONS:
 *     - Owners-only insights
 *     - Priority-ranked actions
 *     - Rationale explanations
 *     - Market expansion guidance
 *     - Partnership opportunities
 * 
 * 11. COUNTRY FLAGS:
 *     - Emoji representations for quick recognition
 *     - 12 major players supported
 *     - Fallback to 🌐 for others
 * 
 * 12. FUTURE ENHANCEMENTS:
 *     - Interactive world map (react-simple-maps)
 *     - Historical tension tracking (line charts)
 *     - Real-time geopolitical news feed
 *     - Treaty and alliance visualizations
 *     - Scenario modeling (cooperation vs. arms race)
 *     - Export restrictions and trade flow maps
 * 
 * @usage
 * ```tsx
 * <InternationalCompetitionMap 
 *   industry="AI" 
 *   subcategory="All"
 *   includeDetails={true}
 *   minMarketShare={1}
 * />
 * ```
 */
