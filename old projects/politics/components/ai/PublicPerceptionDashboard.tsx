/**
 * Public Perception Dashboard Component
 * 
 * @fileoverview Public opinion tracking and reputation management dashboard
 * Displays trust levels, sentiment trends, media attention, protest risk, and brand value
 * 
 * @component PublicPerceptionDashboard
 * @requires /api/ai/public-opinion (GET)
 * 
 * @created 2025-11-15
 * @updated 2025-11-15
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * OVERVIEW:
 * 
 * Public perception and reputation tracking dashboard.
 * 
 * KEY FEATURES:
 * - Overall perception score (0-100)
 * - Trust level in AI safety (5 tiers)
 * - Sentiment trend (Improving/Stable/Declining/Collapsing)
 * - Media attention gauge (0-100)
 * - Protest risk calculator (0-100)
 * - Brand value estimation (USD)
 * - Reputation drivers breakdown
 * - Historical sentiment tracking (optional)
 * - Media strategy recommendations (owners only)
 * 
 * BUSINESS LOGIC:
 * - Fetches perception data from /api/ai/public-opinion
 * - Calculates based on alignment, job displacement, reputation
 * - Tracks sentiment trends over time
 * - Provides actionable recommendations
 * 
 * DEPENDENCIES:
 * - /api/ai/public-opinion endpoint
 * - next-auth session (owner-specific insights)
 */

// ============================================================================
// Type Definitions
// ============================================================================

type TrustLevel = 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
type SentimentTrend = 'Improving' | 'Stable' | 'Declining' | 'Collapsing';

interface PerceptionData {
  overallScore: number;
  trustLevel: TrustLevel;
  sentimentTrend: SentimentTrend;
  mediaAttention: number;
  protestRisk: number;
  brandValue: number;
}

interface DriversData {
  safetyImpact: number;
  jobImpact: number;
  reputationImpact: number;
  innovationImpact: number;
}

interface ContextData {
  agiAlignment: number;
  agiCapability: number;
  marketShareAI: number;
  jobsDisplacedEstimate: number;
  currentReputation: number;
}

interface SensitiveMetrics {
  protestRiskDetails: {
    likelihood: number;
    triggers: string[];
    severity: 'Low' | 'Medium' | 'High';
  };
  mediaStrategy: {
    attention: number;
    sentiment: string;
    recommendedActions: string[];
  };
  brandRisk: {
    currentValue: number;
    potentialLoss: number;
    recoveryStrategy: string;
  };
}

interface HistoricalData {
  date: string;
  perceptionScore: number;
  alignmentStance: string;
  milestoneType: string;
  event: string;
}

interface PublicPerceptionDashboardProps {
  companyId: string;
  includeHistory?: boolean;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

// ============================================================================
// Main Component
// ============================================================================

export default function PublicPerceptionDashboard({
  companyId,
  includeHistory = false,
  timeRange = '30d',
}: PublicPerceptionDashboardProps) {
  const [perception, setPerception] = useState<PerceptionData | null>(null);
  const [drivers, setDrivers] = useState<DriversData | null>(null);
  const [context, setContext] = useState<ContextData | null>(null);
  const [sensitiveMetrics, setSensitiveMetrics] = useState<SensitiveMetrics | null>(null);
  const [history, setHistory] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Fetch public opinion metrics from API
   */
  const fetchPublicOpinion = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        companyId,
        includeHistory: includeHistory.toString(),
        timeRange,
      });

      const response = await fetch(`/api/ai/public-opinion?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch public opinion');
      }

      setPerception(result.data.perception);
      setDrivers(result.data.drivers);
      setContext(result.data.context);
      
      if (result.data.sensitiveMetrics) {
        setSensitiveMetrics(result.data.sensitiveMetrics);
      }

      if (result.data.history) {
        setHistory(result.data.history);
      }
    } catch (err: any) {
      console.error('Error fetching public opinion:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (companyId) {
      fetchPublicOpinion();
    }
  }, [companyId, includeHistory, timeRange]);

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Get color for perception score
   */
  const getPerceptionColor = (score: number): string => {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-300';
    if (score >= 50) return 'text-blue-600 bg-blue-50 border-blue-300';
    if (score >= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    return 'text-red-600 bg-red-50 border-red-300';
  };

  /**
   * Get color for trust level
   */
  const getTrustColor = (level: TrustLevel): string => {
    const colors: Record<TrustLevel, string> = {
      'Very High': 'text-green-700 bg-green-100',
      'High': 'text-green-600 bg-green-50',
      'Medium': 'text-yellow-600 bg-yellow-50',
      'Low': 'text-orange-600 bg-orange-50',
      'Very Low': 'text-red-600 bg-red-50',
    };
    return colors[level] || 'text-gray-600 bg-gray-50';
  };

  /**
   * Get color for sentiment trend
   */
  const getSentimentColor = (trend: SentimentTrend): string => {
    const colors: Record<SentimentTrend, string> = {
      'Improving': 'text-green-600',
      'Stable': 'text-blue-600',
      'Declining': 'text-orange-600',
      'Collapsing': 'text-red-600',
    };
    return colors[trend] || 'text-gray-600';
  };

  /**
   * Get icon for sentiment trend
   */
  const getSentimentIcon = (trend: SentimentTrend): string => {
    const icons: Record<SentimentTrend, string> = {
      'Improving': '📈',
      'Stable': '➡️',
      'Declining': '📉',
      'Collapsing': '⚠️',
    };
    return icons[trend] || '➖';
  };

  /**
   * Format currency
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

  if (loading && !perception) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="h-32 bg-gray-200 rounded"></div>
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
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Public Opinion</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchPublicOpinion}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!perception) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No public opinion data available</p>
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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Public Perception Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overall Score */}
          <div className={`border-2 rounded-lg p-6 ${getPerceptionColor(perception.overallScore)}`}>
            <p className="text-sm font-medium mb-2">Overall Perception</p>
            <p className="text-5xl font-bold mb-2">{perception.overallScore}</p>
            <p className="text-xs">
              {perception.overallScore >= 70 ? 'Excellent reputation' :
               perception.overallScore >= 50 ? 'Good standing' :
               perception.overallScore >= 30 ? 'Concerning' : 'Critical situation'}
            </p>
          </div>

          {/* Trust Level */}
          <div className={`border-2 rounded-lg p-6 ${getTrustColor(perception.trustLevel)}`}>
            <p className="text-sm font-medium mb-2">AI Safety Trust</p>
            <p className="text-3xl font-bold mb-2">{perception.trustLevel}</p>
            <p className="text-xs">Public confidence level</p>
          </div>

          {/* Sentiment Trend */}
          <div className="border-2 border-gray-200 bg-gray-50 rounded-lg p-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Sentiment Trend</p>
            <p className={`text-3xl font-bold mb-2 flex items-center ${getSentimentColor(perception.sentimentTrend)}`}>
              <span className="mr-2">{getSentimentIcon(perception.sentimentTrend)}</span>
              {perception.sentimentTrend}
            </p>
            <p className="text-xs text-gray-600">Current trajectory</p>
          </div>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Risk Assessment</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Media Attention */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-semibold text-blue-700">Media Attention</p>
                <p className="text-3xl font-bold text-blue-800">{perception.mediaAttention}</p>
              </div>
              <span className="text-2xl">📰</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${perception.mediaAttention}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              {perception.mediaAttention > 70 ? 'High visibility' :
               perception.mediaAttention > 40 ? 'Moderate coverage' : 'Low profile'}
            </p>
          </div>

          {/* Protest Risk */}
          <div className={`border rounded-lg p-4 ${
            perception.protestRisk > 70 ? 'bg-red-50 border-red-300' :
            perception.protestRisk > 40 ? 'bg-orange-50 border-orange-300' :
            'bg-green-50 border-green-300'
          }`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-700">Protest Risk</p>
                <p className={`text-3xl font-bold ${
                  perception.protestRisk > 70 ? 'text-red-600' :
                  perception.protestRisk > 40 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {perception.protestRisk}
                </p>
              </div>
              <span className="text-2xl">
                {perception.protestRisk > 70 ? '🚨' : perception.protestRisk > 40 ? '⚠️' : '✅'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  perception.protestRisk > 70 ? 'bg-red-600' :
                  perception.protestRisk > 40 ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ width: `${perception.protestRisk}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {perception.protestRisk > 70 ? 'Critical - Riots likely' :
               perception.protestRisk > 40 ? 'Elevated - Protests probable' : 'Low - Minimal unrest'}
            </p>
          </div>
        </div>

        {/* Brand Value */}
        <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-purple-700 mb-1">Estimated Brand Value</p>
              <p className="text-4xl font-bold text-purple-800">{formatCurrency(perception.brandValue)}</p>
              <p className="text-xs text-purple-600 mt-1">Based on reputation and market position</p>
            </div>
            <span className="text-5xl">💎</span>
          </div>
        </div>
      </div>

      {/* Reputation Drivers */}
      {drivers && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Reputation Drivers</h3>

          <div className="space-y-4">
            {/* Safety Impact */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">AI Safety Record</span>
                <span className={`text-sm font-semibold ${drivers.safetyImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {drivers.safetyImpact >= 0 ? '+' : ''}{drivers.safetyImpact}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${drivers.safetyImpact >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(drivers.safetyImpact), 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Job Impact */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Job Displacement Impact</span>
                <span className={`text-sm font-semibold ${drivers.jobImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {drivers.jobImpact >= 0 ? '+' : ''}{drivers.jobImpact}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${drivers.jobImpact >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(drivers.jobImpact), 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Reputation Impact */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Company Reputation</span>
                <span className={`text-sm font-semibold ${drivers.reputationImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {drivers.reputationImpact >= 0 ? '+' : ''}{drivers.reputationImpact}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${drivers.reputationImpact >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(drivers.reputationImpact), 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Innovation Impact */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Innovation Contribution</span>
                <span className={`text-sm font-semibold ${drivers.innovationImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {drivers.innovationImpact >= 0 ? '+' : ''}{drivers.innovationImpact}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${drivers.innovationImpact >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(drivers.innovationImpact), 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context Information */}
      {context && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Contributing Factors</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-600 mb-1">AGI Alignment</p>
              <p className="text-2xl font-bold text-gray-800">{context.agiAlignment}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-600 mb-1">AGI Capability</p>
              <p className="text-2xl font-bold text-gray-800">{context.agiCapability}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-600 mb-1">Market Share</p>
              <p className="text-2xl font-bold text-gray-800">{context.marketShareAI.toFixed(1)}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-600 mb-1">Jobs Displaced</p>
              <p className="text-2xl font-bold text-gray-800">{context.jobsDisplacedEstimate.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sensitive Metrics (Owners Only) */}
      {sensitiveMetrics && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🔒</span> Owner-Only Insights
          </h3>

          <div className="space-y-4">
            {/* Media Strategy Recommendations */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">📣 Recommended Actions</h4>
              <ul className="space-y-2">
                {sensitiveMetrics.mediaStrategy.recommendedActions.map((action, idx) => (
                  <li key={idx} className="flex items-start text-sm text-gray-700">
                    <span className="mr-2 text-blue-600">→</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Protest Risk Details */}
            {sensitiveMetrics.protestRiskDetails.triggers.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">⚠️ Protest Triggers</h4>
                <ul className="space-y-1">
                  {sensitiveMetrics.protestRiskDetails.triggers.map((trigger, idx) => (
                    <li key={idx} className="text-sm text-red-600">• {trigger}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Brand Risk */}
            {sensitiveMetrics.brandRisk.potentialLoss > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">💰 Brand Risk Analysis</h4>
                <p className="text-sm text-gray-700 mb-2">
                  Potential value at risk: <span className="font-bold text-red-600">{formatCurrency(sensitiveMetrics.brandRisk.potentialLoss)}</span>
                </p>
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Recovery Strategy:</span> {sensitiveMetrics.brandRisk.recoveryStrategy}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historical Sentiment (Optional) */}
      {includeHistory && history.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Sentiment History ({timeRange})</h3>
          
          <div className="space-y-3">
            {history.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.event}</p>
                  <p className="text-xs text-gray-600">{new Date(item.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-800">{item.perceptionScore}</p>
                  <p className="text-xs text-gray-600">{item.alignmentStance}</p>
                </div>
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
 *    - Public and sensitive data separation
 *    - Optional historical tracking
 *    - Owner-specific insights
 * 
 * 2. PERCEPTION SCORE (0-100):
 *    - 70+: Excellent reputation (green)
 *    - 50-70: Good standing (blue)
 *    - 30-50: Concerning (yellow)
 *    - <30: Critical situation (red)
 * 
 * 3. TRUST LEVELS (5 tiers):
 *    - Very High: Alignment > 80
 *    - High: Alignment 60-80
 *    - Medium: Alignment 40-60
 *    - Low: Alignment 20-40
 *    - Very Low: Alignment < 20
 * 
 * 4. SENTIMENT TRENDS:
 *    - Improving: Score > 65 and rising (📈)
 *    - Stable: Score 40-65, steady (➡️)
 *    - Declining: Score dropping (📉)
 *    - Collapsing: Score < 25 and falling (⚠️)
 * 
 * 5. RISK METRICS:
 *    - Media Attention: 0-100 visibility gauge
 *    - Protest Risk: 0-100 unrest likelihood
 *    - Brand Value: USD estimation
 * 
 * 6. REPUTATION DRIVERS:
 *    - Safety: AI alignment score impact
 *    - Jobs: Job displacement penalty
 *    - Reputation: Existing company reputation
 *    - Innovation: AGI capability bonus
 * 
 * 7. SENSITIVE METRICS (OWNERS ONLY):
 *    - Media strategy recommendations
 *    - Protest risk details and triggers
 *    - Brand risk assessment
 *    - Recovery strategies
 * 
 * 8. HISTORICAL TRACKING:
 *    - Optional with includeHistory flag
 *    - Time ranges: 7d, 30d, 90d, 1y
 *    - Tied to AGI milestones
 * 
 * 9. VISUALIZATIONS:
 *    - Gauge bars for media/protest
 *    - Progress bars for drivers
 *    - Color-coded metrics
 *    - Timeline display
 * 
 * 10. FUTURE ENHANCEMENTS:
 *     - Sentiment trend charts (line graphs)
 *     - Comparative analysis vs. competitors
 *     - Crisis management toolkit
 *     - Reputation recovery simulator
 *     - Real-time social media monitoring
 * 
 * @usage
 * ```tsx
 * <PublicPerceptionDashboard 
 *   companyId="673d7..." 
 *   includeHistory={true}
 *   timeRange="90d"
 * />
 * ```
 */
