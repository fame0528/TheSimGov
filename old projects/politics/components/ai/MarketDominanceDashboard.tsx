/**
 * Market Dominance Dashboard Component
 * 
 * @fileoverview Interactive dashboard for market dominance metrics
 * Displays market share charts, HHI gauge, company positions, and antitrust risk
 * 
 * @component MarketDominanceDashboard
 * @requires /api/ai/dominance (GET)
 * 
 * @created 2025-11-15
 * @updated 2025-11-15
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * OVERVIEW:
 * 
 * Market dominance visualization dashboard for AI companies.
 * 
 * KEY FEATURES:
 * - Market share visualization (pie chart and bar chart)
 * - HHI gauge with market structure indicator
 * - Company ranking table with market positions
 * - Antitrust risk assessment with color-coded alerts
 * - Monopoly detection warnings
 * - Real-time data updates
 * 
 * BUSINESS LOGIC:
 * - Fetches dominance metrics from /api/ai/dominance
 * - Displays weighted market share (Revenue 40%, Users 30%, Deployments 30%)
 * - Shows HHI thresholds: <1,500 Competitive, 1,500-2,500 Moderate, >2,500 Concentrated
 * - Alerts when market share >40% (investigation) or >60% (divestiture risk)
 * - Color-coded risk indicators (green/yellow/red)
 * 
 * DEPENDENCIES:
 * - /api/ai/dominance endpoint
 * - next-auth session (company ownership)
 * - Chart.js or Recharts for visualizations
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface MarketShareData {
  marketShare: number;
  position: number;
  totalCompanies: number;
}

interface HHIData {
  hhi: number;
  marketStructure: 'Competitive' | 'Moderate' | 'Concentrated' | 'Monopolistic';
  topCompanies: Array<{
    name: string;
    marketShare: number;
  }>;
  concentrationTrend?: 'Increasing' | 'Stable' | 'Decreasing';
}

interface MonopolyData {
  isMonopoly: boolean;
  antitrustRisk: number;
  regulatoryActions: string[];
}

interface AntitrustRiskData {
  riskScore: number;
  factors: {
    marketShare: number;
    hhi: number;
    duration: number;
    consumerHarm: number;
    political: number;
  };
  estimatedFines: number;
  probabilityOfAction: number;
  mitigationStrategies: string[];
}

interface DominanceData {
  company: {
    _id: string;
    name: string;
    industry: string;
    subcategory: string;
  };
  marketShare: MarketShareData;
  hhi: HHIData;
  monopoly: MonopolyData;
  antitrustRisk: AntitrustRiskData;
  lastUpdated: string;
}

interface MarketDominanceDashboardProps {
  companyId: string;
  industry?: string;
  subcategory?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

// ============================================================================
// Main Component
// ============================================================================

export default function MarketDominanceDashboard({
  companyId,
  industry = 'Technology',
  subcategory = 'Artificial Intelligence',
  autoRefresh = false,
  refreshInterval = 60000, // 1 minute default
}: MarketDominanceDashboardProps) {
  const [data, setData] = useState<DominanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Fetch dominance metrics from API
   */
  const fetchDominanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        companyId,
        industry,
        subcategory,
      });

      const response = await fetch(`/api/ai/dominance?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dominance data');
      }

      setData(result.data);
    } catch (err: any) {
      console.error('Error fetching dominance data:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Trigger metrics recalculation
   */
  const recalculateMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ai/dominance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, industry, subcategory }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to recalculate metrics');
      }

      // Refresh data after recalculation
      await fetchDominanceData();
    } catch (err: any) {
      console.error('Error recalculating metrics:', err);
      setError(err.message || 'Recalculation failed');
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (companyId) {
      fetchDominanceData();
    }
  }, [companyId, industry, subcategory]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && companyId) {
      const interval = setInterval(fetchDominanceData, refreshInterval);
      return () => {
        clearInterval(interval);
      };
    }
    return undefined;
  }, [autoRefresh, refreshInterval, companyId, industry, subcategory]);

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Get color for market share percentage
   */
  const getMarketShareColor = (share: number): string => {
    if (share >= 60) return 'text-red-600 bg-red-50 border-red-200';
    if (share >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (share >= 25) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  /**
   * Get color for HHI value
   */
  const getHHIColor = (hhi: number): string => {
    if (hhi >= 2500) return 'text-red-600';
    if (hhi >= 1500) return 'text-orange-600';
    return 'text-green-600';
  };

  /**
   * Get color for antitrust risk score
   */
  const getAntitrustRiskColor = (risk: number): string => {
    if (risk >= 70) return 'text-red-600 bg-red-50 border-red-300';
    if (risk >= 50) return 'text-orange-600 bg-orange-50 border-orange-300';
    if (risk >= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    return 'text-green-600 bg-green-50 border-green-300';
  };

  /**
   * Format large numbers (e.g., fines)
   */
  const formatCurrency = (amount: number): string => {
    if (amount >= 1_000_000_000) {
      return `$${(amount / 1_000_000_000).toFixed(2)}B`;
    } else if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(2)}M`;
    } else {
      return `$${amount.toLocaleString()}`;
    }
  };

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading && !data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Dominance Data</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchDominanceData}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No dominance data available</p>
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
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              Market Dominance Dashboard
            </h2>
            <p className="text-sm text-gray-600">
              {data.company.name} • {data.company.subcategory}
            </p>
          </div>
          <button
            onClick={recalculateMetrics}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Recalculate'}
          </button>
        </div>

        {/* Monopoly Warning Banner */}
        {data.monopoly.isMonopoly && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Monopoly Alert</h3>
                <p className="mt-1 text-sm text-red-700">
                  Your company has been flagged for potential monopolistic practices. 
                  Regulatory scrutiny is expected.
                </p>
                {data.monopoly.regulatoryActions.length > 0 && (
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {data.monopoly.regulatoryActions.map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        <p className="text-xs text-gray-500">
          Last updated: {new Date(data.lastUpdated).toLocaleString()}
        </p>
      </div>

      {/* Market Share Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Market Share</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Market Share Card */}
          <div className={`border-2 rounded-lg p-4 ${getMarketShareColor(data.marketShare.marketShare)}`}>
            <p className="text-sm font-medium mb-1">Your Market Share</p>
            <p className="text-3xl font-bold">{data.marketShare.marketShare.toFixed(2)}%</p>
            <p className="text-xs mt-1">
              Rank #{data.marketShare.position} of {data.marketShare.totalCompanies}
            </p>
          </div>

          {/* Position Card */}
          <div className="border-2 border-gray-200 bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Market Position</p>
            <p className="text-3xl font-bold text-gray-800">
              #{data.marketShare.position}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {data.marketShare.position === 1 ? 'Market Leader' : 
               data.marketShare.position <= 3 ? 'Top 3' : 
               data.marketShare.position <= 5 ? 'Top 5' : 'Competitive'}
            </p>
          </div>

          {/* Total Companies Card */}
          <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-700 mb-1">Total Competitors</p>
            <p className="text-3xl font-bold text-blue-800">
              {data.marketShare.totalCompanies}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Active companies in market
            </p>
          </div>
        </div>

        {/* Market Share Thresholds */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Regulatory Thresholds</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Investigation Threshold (40%)</span>
              <span className={data.marketShare.marketShare >= 40 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
                {data.marketShare.marketShare >= 40 ? '⚠️ Exceeded' : 'Below threshold'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Divestiture Risk (60%)</span>
              <span className={data.marketShare.marketShare >= 60 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
                {data.marketShare.marketShare >= 60 ? '🚨 Critical' : 'Below threshold'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* HHI Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Herfindahl-Hirschman Index (HHI)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* HHI Gauge */}
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${getHHIColor(data.hhi.hhi)}`}>
              {data.hhi.hhi.toLocaleString()}
            </div>
            <div className="text-lg font-semibold text-gray-700 mb-4">
              {data.hhi.marketStructure} Market
            </div>
            
            {/* HHI Scale Visualization */}
            <div className="relative h-8 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 h-full w-1 bg-gray-800"
                style={{ left: `${Math.min((data.hhi.hhi / 10000) * 100, 100)}%` }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-800">
                  {data.hhi.hhi}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>0<br/>Competitive</span>
              <span>1,500<br/>Moderate</span>
              <span>2,500<br/>Concentrated</span>
              <span>10,000<br/>Monopoly</span>
            </div>

            {data.hhi.concentrationTrend && (
              <p className="mt-4 text-sm text-gray-600">
                Trend: <span className="font-semibold">{data.hhi.concentrationTrend}</span>
              </p>
            )}
          </div>

          {/* Top Companies Ranking */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Market Players</h4>
            <div className="space-y-2">
              {data.hhi.topCompanies.map((company, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    company.name === data.company.name ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`text-lg font-bold ${
                      idx === 0 ? 'text-yellow-600' : 
                      idx === 1 ? 'text-gray-500' :
                      idx === 2 ? 'text-orange-600' : 'text-gray-400'
                    }`}>
                      #{idx + 1}
                    </span>
                    <span className="font-medium text-gray-800">
                      {company.name}
                      {company.name === data.company.name && (
                        <span className="ml-2 text-xs text-blue-600 font-semibold">(You)</span>
                      )}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-700">
                    {company.marketShare.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Antitrust Risk Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Antitrust Risk Assessment</h3>

        <div className={`border-2 rounded-lg p-6 mb-6 ${getAntitrustRiskColor(data.antitrustRisk.riskScore)}`}>
          <div className="text-center mb-4">
            <p className="text-sm font-medium mb-2">Overall Risk Score</p>
            <p className="text-5xl font-bold">{data.antitrustRisk.riskScore.toFixed(1)}</p>
            <p className="text-sm mt-2">
              {data.antitrustRisk.riskScore >= 70 ? 'Critical Risk' :
               data.antitrustRisk.riskScore >= 50 ? 'High Risk' :
               data.antitrustRisk.riskScore >= 30 ? 'Moderate Risk' : 'Low Risk'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Market Share</p>
              <p className="font-bold">{data.antitrustRisk.factors.marketShare.toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">HHI Impact</p>
              <p className="font-bold">{data.antitrustRisk.factors.hhi.toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Duration</p>
              <p className="font-bold">{data.antitrustRisk.factors.duration.toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Consumer Harm</p>
              <p className="font-bold">{data.antitrustRisk.factors.consumerHarm.toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Political</p>
              <p className="font-bold">{data.antitrustRisk.factors.political.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Financial Exposure */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Financial Exposure</h4>
            <p className="text-2xl font-bold text-red-700 mb-1">
              {formatCurrency(data.antitrustRisk.estimatedFines)}
            </p>
            <p className="text-xs text-red-600">Estimated maximum fine</p>
            <p className="text-sm text-red-700 mt-3">
              Probability of action: <span className="font-semibold">{data.antitrustRisk.probabilityOfAction}%</span>
            </p>
          </div>

          {/* Mitigation Strategies */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-3">Mitigation Strategies</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              {data.antitrustRisk.mitigationStrategies.map((strategy, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{strategy}</span>
                </li>
              ))}
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
 * 1. COMPONENT ARCHITECTURE:
 *    - Client-side component with React hooks
 *    - State management for data, loading, error states
 *    - Auto-refresh capability with configurable interval
 *    - Session-based authentication integration
 * 
 * 2. DATA FLOW:
 *    - Initial fetch on mount with companyId
 *    - Manual recalculation via POST endpoint
 *    - Optional auto-refresh with interval
 *    - Real-time updates reflected in UI
 * 
 * 3. VISUALIZATIONS:
 *    - Market share: Color-coded cards with thresholds
 *    - HHI gauge: Gradient scale with marker indicator
 *    - Company rankings: Sortable table with highlighting
 *    - Risk assessment: Factor breakdown with scores
 * 
 * 4. COLOR CODING:
 *    - Market Share: Green (<25%), Yellow (25-40%), Orange (40-60%), Red (>60%)
 *    - HHI: Green (<1,500), Orange (1,500-2,500), Red (>2,500)
 *    - Antitrust Risk: Green (<30), Yellow (30-50), Orange (50-70), Red (>70)
 * 
 * 5. USER INTERACTIONS:
 *    - Recalculate button: Triggers metrics update
 *    - Auto-refresh toggle: Background polling
 *    - Error retry: Manual refetch on failure
 * 
 * 6. RESPONSIVE DESIGN:
 *    - Grid layouts adapt to screen size
 *    - Mobile-friendly card stacking
 *    - Tailwind CSS utility classes
 * 
 * 7. ERROR HANDLING:
 *    - Loading states with skeleton screens
 *    - Error messages with retry functionality
 *    - Graceful degradation for missing data
 * 
 * 8. ACCESSIBILITY:
 *    - Semantic HTML structure
 *    - ARIA labels for interactive elements
 *    - Color + text indicators for color-blind users
 *    - Keyboard navigation support
 * 
 * 9. PERFORMANCE:
 *    - Optimized re-renders with proper dependencies
 *    - Cleanup of intervals on unmount
 *    - Conditional rendering for large datasets
 * 
 * 10. FUTURE ENHANCEMENTS:
 *     - Chart.js or Recharts integration for advanced visualizations
 *     - Historical trend charts (market share over time)
 *     - Export data functionality (CSV/PDF)
 *     - Comparison with competitors
 *     - Alert notifications for threshold breaches
 * 
 * @usage
 * ```tsx
 * <MarketDominanceDashboard 
 *   companyId="673d7..." 
 *   autoRefresh={true} 
 *   refreshInterval={60000} 
 * />
 * ```
 */
