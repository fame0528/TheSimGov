/**
 * Competitive Intelligence Component
 * 
 * @fileoverview SWOT analysis and competitive positioning dashboard
 * Displays competitive advantages, vulnerabilities, threats, opportunities, and market structure
 * 
 * @component CompetitiveIntelligence
 * @requires /api/ai/market-analysis (GET)
 * 
 * @created 2025-11-15
 * @updated 2025-11-15
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * OVERVIEW:
 * 
 * Competitive intelligence and SWOT analysis dashboard.
 * 
 * KEY FEATURES:
 * - Market positioning (rank vs. total companies)
 * - Competitor identification (nearest above/below)
 * - Competitive advantages display
 * - Vulnerabilities assessment
 * - Threat level indicator (Low/Medium/High/Critical)
 * - Opportunity score (0-100)
 * - Market structure analysis (HHI-based)
 * - Optional M&A consolidation impact
 * 
 * BUSINESS LOGIC:
 * - Fetches competitive intelligence from /api/ai/market-analysis
 * - Identifies ±2 market positions for competitor comparison
 * - Calculates threat levels based on competitive pressure
 * - Scores opportunities based on market gaps
 * - Provides actionable strategic insights
 * 
 * DEPENDENCIES:
 * - /api/ai/market-analysis endpoint
 * - next-auth session (company ownership)
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface Competitor {
  companyId: string;
  name: string;
  marketShare: number;
  gap: number;
}

interface CompetitiveIntelligenceData {
  marketPosition: {
    current: number;
    total: number;
  };
  competitors: {
    above: Competitor[];
    below: Competitor[];
  };
  advantages: string[];
  vulnerabilities: string[];
  threatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  opportunityScore: number;
  strategicInsights?: string[];
}

interface MarketStructure {
  hhi: number;
  structure: 'Competitive' | 'Moderate' | 'Concentrated' | 'Monopolistic';
  topCompanies: Array<{
    name: string;
    marketShare: number;
  }>;
  concentrationTrend?: 'Increasing' | 'Stable' | 'Decreasing';
}

interface ConsolidationImpact {
  premergerHHI: number;
  postmergerHHI: number;
  hhiChange: number;
  expectedResponse: 'Approve' | 'Review' | 'Block';
  combinedMarketShare: number;
  competitiveEffects: string[];
}

interface CompetitiveIntelligenceProps {
  companyId: string;
  industry?: string;
  subcategory?: string;
  includeConsolidation?: boolean;
  targetCompanyId?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function CompetitiveIntelligence({
  companyId,
  industry = 'Technology',
  subcategory = 'Artificial Intelligence',
  includeConsolidation = false,
  targetCompanyId,
}: CompetitiveIntelligenceProps) {
  const [competitiveIntel, setCompetitiveIntel] = useState<CompetitiveIntelligenceData | null>(null);
  const [marketStructure, setMarketStructure] = useState<MarketStructure | null>(null);
  const [consolidation, setConsolidation] = useState<ConsolidationImpact | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Fetch market analysis from API
   */
  const fetchMarketAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        companyId,
        industry,
        subcategory,
        includeConsolidation: includeConsolidation.toString(),
      });

      if (targetCompanyId) {
        params.append('targetCompanyId', targetCompanyId);
      }

      const response = await fetch(`/api/ai/market-analysis?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch market analysis');
      }

      setCompetitiveIntel(result.data.competitiveIntelligence);
      setMarketStructure(result.data.marketStructure);
      
      if (result.data.consolidationAnalysis) {
        setConsolidation(result.data.consolidationAnalysis.impact);
      }
    } catch (err: any) {
      console.error('Error fetching market analysis:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (companyId) {
      fetchMarketAnalysis();
    }
  }, [companyId, industry, subcategory, includeConsolidation, targetCompanyId]);

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Get color for threat level
   */
  const getThreatColor = (level: string): string => {
    const colors: Record<string, string> = {
      'Low': 'text-green-600 bg-green-50 border-green-300',
      'Medium': 'text-yellow-600 bg-yellow-50 border-yellow-300',
      'High': 'text-orange-600 bg-orange-50 border-orange-300',
      'Critical': 'text-red-600 bg-red-50 border-red-300',
    };
    return colors[level] || 'text-gray-600 bg-gray-50 border-gray-300';
  };

  /**
   * Get color for opportunity score
   */
  const getOpportunityColor = (score: number): string => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-blue-600';
    if (score >= 30) return 'text-yellow-600';
    return 'text-gray-600';
  };

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading && !competitiveIntel) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Competitive Intelligence</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchMarketAnalysis}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!competitiveIntel || !marketStructure) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No competitive intelligence data available</p>
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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Competitive Intelligence</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Market Position */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-700 mb-1">Market Position</p>
            <p className="text-3xl font-bold text-blue-800">
              #{competitiveIntel.marketPosition.current}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              of {competitiveIntel.marketPosition.total} companies
            </p>
          </div>

          {/* Threat Level */}
          <div className={`border-2 rounded-lg p-4 ${getThreatColor(competitiveIntel.threatLevel)}`}>
            <p className="text-sm font-medium mb-1">Threat Level</p>
            <p className="text-3xl font-bold">{competitiveIntel.threatLevel}</p>
            <p className="text-xs mt-1">Competitive pressure</p>
          </div>

          {/* Opportunity Score */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-700 mb-1">Opportunity Score</p>
            <p className={`text-3xl font-bold ${getOpportunityColor(competitiveIntel.opportunityScore)}`}>
              {competitiveIntel.opportunityScore}
            </p>
            <p className="text-xs text-green-600 mt-1">out of 100</p>
          </div>
        </div>
      </div>

      {/* Competitors Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Nearest Competitors</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Competitors Above */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">🔺 Ahead of You</h4>
            {competitiveIntel.competitors.above.length === 0 ? (
              <p className="text-sm text-gray-500 italic">You're the market leader!</p>
            ) : (
              <div className="space-y-2">
                {competitiveIntel.competitors.above.map((competitor, idx) => (
                  <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{competitor.name}</p>
                        <p className="text-xs text-gray-600">Market share: {competitor.marketShare.toFixed(2)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-orange-600">
                          +{competitor.gap.toFixed(2)}%
                        </p>
                        <p className="text-xs text-gray-600">ahead</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Competitors Below */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">🔻 Behind You</h4>
            {competitiveIntel.competitors.below.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No companies below your position</p>
            ) : (
              <div className="space-y-2">
                {competitiveIntel.competitors.below.map((competitor, idx) => (
                  <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{competitor.name}</p>
                        <p className="text-xs text-gray-600">Market share: {competitor.marketShare.toFixed(2)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          -{Math.abs(competitor.gap).toFixed(2)}%
                        </p>
                        <p className="text-xs text-gray-600">behind</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SWOT Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">SWOT Analysis</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths (Advantages) */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
              <span className="mr-2">💪</span> Strengths
            </h4>
            {competitiveIntel.advantages.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No competitive advantages identified</p>
            ) : (
              <ul className="space-y-2">
                {competitiveIntel.advantages.map((advantage, idx) => (
                  <li key={idx} className="flex items-start text-sm text-green-700">
                    <span className="mr-2 mt-1">✓</span>
                    <span>{advantage}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Weaknesses (Vulnerabilities) */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
              <span className="mr-2">⚠️</span> Weaknesses
            </h4>
            {competitiveIntel.vulnerabilities.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No vulnerabilities identified</p>
            ) : (
              <ul className="space-y-2">
                {competitiveIntel.vulnerabilities.map((vulnerability, idx) => (
                  <li key={idx} className="flex items-start text-sm text-red-700">
                    <span className="mr-2 mt-1">✗</span>
                    <span>{vulnerability}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Strategic Insights */}
        {competitiveIntel.strategicInsights && competitiveIntel.strategicInsights.length > 0 && (
          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
              <span className="mr-2">💡</span> Strategic Insights
            </h4>
            <ul className="space-y-2">
              {competitiveIntel.strategicInsights.map((insight, idx) => (
                <li key={idx} className="flex items-start text-sm text-blue-700">
                  <span className="mr-2 mt-1">→</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Market Structure */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Market Structure Analysis</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* HHI Overview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Herfindahl-Hirschman Index</p>
                <p className="text-3xl font-bold text-gray-800">{marketStructure.hhi.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Market Type</p>
                <p className="text-lg font-semibold text-gray-800">{marketStructure.structure}</p>
              </div>
            </div>

            {marketStructure.concentrationTrend && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">Concentration Trend</p>
                <p className={`text-sm font-semibold ${
                  marketStructure.concentrationTrend === 'Increasing' ? 'text-red-600' :
                  marketStructure.concentrationTrend === 'Decreasing' ? 'text-green-600' :
                  'text-gray-600'
                }`}>
                  {marketStructure.concentrationTrend}
                </p>
              </div>
            )}
          </div>

          {/* Top 5 Companies */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Market Leaders</h4>
            <div className="space-y-2">
              {marketStructure.topCompanies.slice(0, 5).map((company, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-bold ${
                      idx === 0 ? 'text-yellow-600' :
                      idx === 1 ? 'text-gray-500' :
                      idx === 2 ? 'text-orange-600' :
                      'text-gray-400'
                    }`}>
                      #{idx + 1}
                    </span>
                    <span className="text-sm text-gray-800">{company.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {company.marketShare.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* M&A Consolidation Analysis */}
      {includeConsolidation && consolidation && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">M&A Impact Analysis</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Pre-Merger HHI</p>
              <p className="text-2xl font-bold text-gray-800">{consolidation.premergerHHI.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Post-Merger HHI</p>
              <p className="text-2xl font-bold text-gray-800">{consolidation.postmergerHHI.toLocaleString()}</p>
            </div>
            <div className={`rounded-lg p-4 ${
              consolidation.hhiChange > 200 ? 'bg-red-50' : 'bg-green-50'
            }`}>
              <p className="text-sm text-gray-600 mb-1">HHI Change</p>
              <p className={`text-2xl font-bold ${
                consolidation.hhiChange > 200 ? 'text-red-600' : 'text-green-600'
              }`}>
                +{consolidation.hhiChange}
              </p>
            </div>
          </div>

          <div className={`border-2 rounded-lg p-4 ${
            consolidation.expectedResponse === 'Block' ? 'bg-red-50 border-red-300' :
            consolidation.expectedResponse === 'Review' ? 'bg-yellow-50 border-yellow-300' :
            'bg-green-50 border-green-300'
          }`}>
            <h4 className="text-sm font-semibold mb-2">Expected Regulatory Response</h4>
            <p className={`text-2xl font-bold mb-2 ${
              consolidation.expectedResponse === 'Block' ? 'text-red-600' :
              consolidation.expectedResponse === 'Review' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {consolidation.expectedResponse}
            </p>
            <p className="text-sm text-gray-700 mb-3">
              Combined market share: {consolidation.combinedMarketShare.toFixed(2)}%
            </p>

            {consolidation.competitiveEffects.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Competitive Effects:</p>
                <ul className="space-y-1">
                  {consolidation.competitiveEffects.map((effect, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{effect}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
 *    - Market analysis state management
 *    - Optional M&A consolidation analysis
 *    - Responsive grid layouts
 * 
 * 2. COMPETITIVE POSITIONING:
 *    - Current rank vs. total companies
 *    - Nearest competitors (±2 positions)
 *    - Market share gaps visualization
 *    - Leader/follower context
 * 
 * 3. SWOT COMPONENTS:
 *    - Strengths: Competitive advantages
 *    - Weaknesses: Vulnerabilities
 *    - Opportunities: Market gaps (score 0-100)
 *    - Threats: Competitive pressure (Low/Med/High/Critical)
 * 
 * 4. MARKET STRUCTURE:
 *    - HHI calculation and interpretation
 *    - Market concentration trend
 *    - Top 5 company rankings
 *    - Competitive/Moderate/Concentrated classification
 * 
 * 5. M&A ANALYSIS (OPTIONAL):
 *    - Pre-merger vs. post-merger HHI
 *    - HHI change threshold (>200 = concern)
 *    - Expected regulatory response (Approve/Review/Block)
 *    - Combined market share impact
 *    - DOJ/FTC merger guidelines compliance
 * 
 * 6. COLOR CODING:
 *    - Threat Level: Green (Low), Yellow (Med), Orange (High), Red (Critical)
 *    - Opportunity Score: Green (70+), Blue (50-70), Yellow (30-50), Gray (<30)
 *    - HHI Change: Green (<200), Red (>200)
 *    - Regulatory Response: Green (Approve), Yellow (Review), Red (Block)
 * 
 * 7. DATA VISUALIZATION:
 *    - Card-based metrics display
 *    - Competitor comparison tables
 *    - SWOT quadrant layout
 *    - Market structure breakdown
 * 
 * 8. USER INTERACTIONS:
 *    - Automatic data fetching on mount
 *    - Error handling with retry
 *    - Loading states with skeletons
 *    - Optional consolidation analysis toggle
 * 
 * 9. STRATEGIC INSIGHTS:
 *    - Actionable recommendations
 *    - Focus areas for improvement
 *    - Acquisition targets
 *    - Defensive strategies
 * 
 * 10. FUTURE ENHANCEMENTS:
 *     - Interactive competitor comparison
 *     - Historical trend charts
 *     - Scenario planning tools
 *     - Export analysis reports
 *     - Real-time competitive alerts
 * 
 * @usage
 * ```tsx
 * <CompetitiveIntelligence 
 *   companyId="673d7..." 
 *   includeConsolidation={true}
 *   targetCompanyId="673d8..."
 * />
 * ```
 */
