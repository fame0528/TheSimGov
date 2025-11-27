/**
 * Regulatory Pressure Monitor Component
 * 
 * @fileoverview Government regulatory pressure tracking and intervention monitoring
 * Displays pressure levels, intervention probability, regulatory actions, and response history
 * 
 * @component RegulatoryPressureMonitor
 * @requires /api/ai/regulatory-response (POST for viewing responses)
 * @requires /api/ai/dominance (GET for antitrust risk)
 * 
 * @created 2025-11-15
 * @updated 2025-11-15
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * OVERVIEW:
 * 
 * Regulatory pressure and government intervention monitoring dashboard.
 * 
 * KEY FEATURES:
 * - Regulatory pressure gauge (0-100)
 * - Intervention probability calculator
 * - Likely regulatory actions list
 * - Government action history
 * - Company response tracking
 * - Antitrust risk integration
 * - Timeline visualization
 * - Risk mitigation strategies (owners only)
 * 
 * BUSINESS LOGIC:
 * - Calculates pressure based on market dominance + public opinion
 * - Predicts intervention likelihood using AI
 * - Tracks regulatory responses and outcomes
 * - Provides strategic recommendations
 * 
 * DEPENDENCIES:
 * - /api/ai/regulatory-response endpoint
 * - /api/ai/dominance endpoint (antitrust risk)
 */

// ============================================================================
// Type Definitions
// ============================================================================

type ActionType = 
  | 'Antitrust Investigation'
  | 'Divestiture Order'
  | 'Market Conduct Regulation'
  | 'Safety Audit'
  | 'Emergency Shutdown'
  | 'Voluntary Compliance'
  | 'Transparency Report'
  | 'Safety Improvement Plan';

type ResponseType = 'government' | 'company';

interface RegulatoryAction {
  id: string;
  date: string;
  responseType: ResponseType;
  actionType: ActionType;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  outcome?: string;
  impactOnPressure?: number;
  impactOnPerception?: number;
}

interface PressureMetrics {
  currentLevel: number;
  interventionProbability: number;
  trend: 'Increasing' | 'Stable' | 'Decreasing';
  triggers: string[];
}

interface AntitrustRiskData {
  overallRisk: number;
  factors: {
    marketShare: number;
    hhi: number;
    duration: number;
    consumerHarm: number;
    political: number;
  };
  estimatedFines?: number;
}

interface LikelyAction {
  actionType: ActionType;
  probability: number;
  timeframe: string;
  rationale: string;
}

interface RegulatoryPressureMonitorProps {
  companyId: string;
  includeHistory?: boolean;
  limit?: number;
}

// ============================================================================
// Main Component
// ============================================================================

export default function RegulatoryPressureMonitor({
  companyId,
  includeHistory = true,
  limit = 10,
}: RegulatoryPressureMonitorProps) {
  const [pressure, setPressure] = useState<PressureMetrics | null>(null);
  const [antitrustRisk, setAntitrustRisk] = useState<AntitrustRiskData | null>(null);
  const [likelyActions, setLikelyActions] = useState<LikelyAction[]>([]);
  const [actionHistory, setActionHistory] = useState<RegulatoryAction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Fetch regulatory pressure and action data
   */
  const fetchRegulatoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch antitrust risk from dominance endpoint
      const dominanceParams = new URLSearchParams({ companyId });
      const dominanceResponse = await fetch(`/api/ai/dominance?${dominanceParams.toString()}`);
      const dominanceResult = await dominanceResponse.json();

      if (dominanceResult.success && dominanceResult.data.antitrustRisk) {
        setAntitrustRisk(dominanceResult.data.antitrustRisk);
      }

      // Calculate pressure metrics (simulated - would come from backend in production)
      const pressureLevel = dominanceResult.data.antitrustRisk?.overallRisk || 0;
      const calculatedPressure: PressureMetrics = {
        currentLevel: pressureLevel,
        interventionProbability: calculateInterventionProbability(pressureLevel),
        trend: determineTrend(pressureLevel),
        triggers: identifyTriggers(dominanceResult.data),
      };
      setPressure(calculatedPressure);

      // Generate likely actions based on risk level
      const actions = generateLikelyActions(pressureLevel);
      setLikelyActions(actions);

      // Fetch action history (simulated - would fetch from regulatory-response endpoint)
      if (includeHistory) {
        // In production, this would fetch from /api/ai/regulatory-response
        // with a GET endpoint or query parameter
        const mockHistory: RegulatoryAction[] = [];
        setActionHistory(mockHistory);
      }
    } catch (err: any) {
      console.error('Error fetching regulatory data:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (companyId) {
      fetchRegulatoryData();
    }
  }, [companyId, includeHistory, limit]);

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Calculate intervention probability based on pressure level
   */
  const calculateInterventionProbability = (pressure: number): number => {
    if (pressure >= 80) return 90 + Math.random() * 10;
    if (pressure >= 60) return 60 + (pressure - 60) * 1.5;
    if (pressure >= 40) return 30 + (pressure - 40) * 1.5;
    return pressure * 0.75;
  };

  /**
   * Determine pressure trend
   */
  const determineTrend = (current: number): 'Increasing' | 'Stable' | 'Decreasing' => {
    // Simplified - would track historical data in production
    if (current > 70) return 'Increasing';
    if (current < 30) return 'Decreasing';
    return 'Stable';
  };

  /**
   * Identify regulatory triggers
   */
  const identifyTriggers = (data: any): string[] => {
    const triggers: string[] = [];
    
    if (data.marketShare?.percentage > 40) {
      triggers.push('Market share exceeds 40% threshold');
    }
    if (data.monopoly?.exists) {
      triggers.push('Monopoly conditions detected');
    }
    if (data.antitrustRisk?.overallRisk > 60) {
      triggers.push('High antitrust risk score');
    }
    
    return triggers;
  };

  /**
   * Generate likely regulatory actions
   */
  const generateLikelyActions = (pressure: number): LikelyAction[] => {
    const actions: LikelyAction[] = [];

    if (pressure >= 80) {
      actions.push({
        actionType: 'Antitrust Investigation',
        probability: 85,
        timeframe: '1-3 months',
        rationale: 'Critical antitrust risk level detected',
      });
      actions.push({
        actionType: 'Divestiture Order',
        probability: 60,
        timeframe: '6-12 months',
        rationale: 'Market concentration exceeds safe thresholds',
      });
    } else if (pressure >= 60) {
      actions.push({
        actionType: 'Market Conduct Regulation',
        probability: 70,
        timeframe: '3-6 months',
        rationale: 'Elevated antitrust concerns',
      });
      actions.push({
        actionType: 'Safety Audit',
        probability: 55,
        timeframe: '2-4 months',
        rationale: 'AI safety oversight requirements',
      });
    } else if (pressure >= 40) {
      actions.push({
        actionType: 'Transparency Report',
        probability: 60,
        timeframe: '1-2 months',
        rationale: 'Routine compliance monitoring',
      });
    }

    return actions;
  };

  /**
   * Get color for pressure level
   */
  const getPressureColor = (level: number): string => {
    if (level >= 80) return 'text-red-600 bg-red-50 border-red-300';
    if (level >= 60) return 'text-orange-600 bg-orange-50 border-orange-300';
    if (level >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    return 'text-green-600 bg-green-50 border-green-300';
  };

  /**
   * Get color for intervention probability
   */
  const getInterventionColor = (prob: number): string => {
    if (prob >= 70) return 'text-red-700';
    if (prob >= 50) return 'text-orange-600';
    if (prob >= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  /**
   * Get color for action severity
   */
  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      'Critical': 'bg-red-100 text-red-800 border-red-300',
      'High': 'bg-orange-100 text-orange-800 border-orange-300',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Low': 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  /**
   * Get icon for action type
   */
  const getActionIcon = (actionType: ActionType): string => {
    const icons: Record<ActionType, string> = {
      'Antitrust Investigation': '🔍',
      'Divestiture Order': '⚖️',
      'Market Conduct Regulation': '📋',
      'Safety Audit': '🔒',
      'Emergency Shutdown': '🚨',
      'Voluntary Compliance': '✅',
      'Transparency Report': '📄',
      'Safety Improvement Plan': '🛡️',
    };
    return icons[actionType] || '📌';
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number): string => {
    if (amount >= 1_000_000_000) {
      return `$${(amount / 1_000_000_000).toFixed(2)}B`;
    } else if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(2)}M`;
    }
    return `$${amount.toLocaleString()}`;
  };

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading && !pressure) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Regulatory Data</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchRegulatoryData}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!pressure) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No regulatory data available</p>
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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Regulatory Pressure Monitor</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pressure Gauge */}
          <div className={`border-2 rounded-lg p-6 ${getPressureColor(pressure.currentLevel)}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium mb-2">Current Pressure Level</p>
                <p className="text-5xl font-bold mb-2">{pressure.currentLevel.toFixed(0)}</p>
                <p className="text-xs">
                  {pressure.currentLevel >= 80 ? 'Critical - Immediate action likely' :
                   pressure.currentLevel >= 60 ? 'High - Intervention probable' :
                   pressure.currentLevel >= 40 ? 'Moderate - Monitoring active' :
                   'Low - Routine oversight'}
                </p>
              </div>
              <span className="text-4xl">
                {pressure.currentLevel >= 80 ? '🚨' :
                 pressure.currentLevel >= 60 ? '⚠️' :
                 pressure.currentLevel >= 40 ? '📊' : '✅'}
              </span>
            </div>

            {/* Pressure Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all duration-500 ${
                  pressure.currentLevel >= 80 ? 'bg-red-600' :
                  pressure.currentLevel >= 60 ? 'bg-orange-500' :
                  pressure.currentLevel >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${pressure.currentLevel}%` }}
              ></div>
            </div>

            {/* Trend Indicator */}
            <div className="mt-3 flex items-center text-sm">
              <span className="font-medium mr-2">Trend:</span>
              <span className={`font-semibold ${
                pressure.trend === 'Increasing' ? 'text-red-600' :
                pressure.trend === 'Decreasing' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {pressure.trend === 'Increasing' ? '📈' :
                 pressure.trend === 'Decreasing' ? '📉' : '➡️'}
                {' '}{pressure.trend}
              </span>
            </div>
          </div>

          {/* Intervention Probability */}
          <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-2">Intervention Probability</p>
                <p className={`text-5xl font-bold mb-2 ${getInterventionColor(pressure.interventionProbability)}`}>
                  {pressure.interventionProbability.toFixed(0)}%
                </p>
                <p className="text-xs text-purple-600">
                  Next 6 months likelihood
                </p>
              </div>
              <span className="text-4xl">⚖️</span>
            </div>

            {/* Probability Bar */}
            <div className="w-full bg-purple-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all duration-500 ${
                  pressure.interventionProbability >= 70 ? 'bg-red-600' :
                  pressure.interventionProbability >= 50 ? 'bg-orange-500' :
                  pressure.interventionProbability >= 30 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${pressure.interventionProbability}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Pressure Triggers */}
        {pressure.triggers.length > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-800 mb-3">⚠️ Active Regulatory Triggers</h4>
            <ul className="space-y-2">
              {pressure.triggers.map((trigger, idx) => (
                <li key={idx} className="flex items-start text-sm text-yellow-700">
                  <span className="mr-2">•</span>
                  <span>{trigger}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Antitrust Risk Details */}
      {antitrustRisk && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Antitrust Risk Breakdown</h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 mb-1">Market Share</p>
              <p className="text-2xl font-bold text-gray-800">{antitrustRisk.factors.marketShare}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 mb-1">HHI Impact</p>
              <p className="text-2xl font-bold text-gray-800">{antitrustRisk.factors.hhi}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 mb-1">Duration</p>
              <p className="text-2xl font-bold text-gray-800">{antitrustRisk.factors.duration}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 mb-1">Consumer Harm</p>
              <p className="text-2xl font-bold text-gray-800">{antitrustRisk.factors.consumerHarm}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 mb-1">Political</p>
              <p className="text-2xl font-bold text-gray-800">{antitrustRisk.factors.political}</p>
            </div>
          </div>

          {antitrustRisk.estimatedFines && antitrustRisk.estimatedFines > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">💰 Estimated Potential Fines</p>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(antitrustRisk.estimatedFines)}</p>
              <p className="text-xs text-red-600 mt-1">Based on current risk factors and historical precedents</p>
            </div>
          )}
        </div>
      )}

      {/* Likely Regulatory Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Likely Regulatory Actions</h3>

        {likelyActions.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No immediate regulatory actions predicted</p>
        ) : (
          <div className="space-y-4">
            {likelyActions.map((action, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getActionIcon(action.actionType)}</span>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">{action.actionType}</h4>
                      <p className="text-sm text-gray-600">Expected: {action.timeframe}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getInterventionColor(action.probability)}`}>
                      {action.probability}%
                    </p>
                    <p className="text-xs text-gray-600">Probability</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Rationale:</span> {action.rationale}
                  </p>
                </div>

                {/* Probability Bar */}
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      action.probability >= 70 ? 'bg-red-500' :
                      action.probability >= 50 ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${action.probability}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action History */}
      {includeHistory && actionHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Regulatory Action History</h3>

          <div className="space-y-3">
            {actionHistory.map((action) => (
              <div key={action.id} className="border-l-4 border-blue-500 bg-gray-50 rounded-r-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{getActionIcon(action.actionType)}</span>
                    <div>
                      <h4 className="text-md font-semibold text-gray-800">{action.actionType}</h4>
                      <p className="text-xs text-gray-600">
                        {new Date(action.date).toLocaleDateString()} • 
                        {action.responseType === 'government' ? ' Government Action' : ' Company Response'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(action.severity)}`}>
                    {action.severity}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-2">{action.description}</p>

                {action.outcome && (
                  <div className="bg-white rounded p-2 text-sm">
                    <span className="font-semibold text-gray-700">Outcome:</span>
                    <span className="text-gray-600 ml-2">{action.outcome}</span>
                  </div>
                )}

                {(action.impactOnPressure !== undefined || action.impactOnPerception !== undefined) && (
                  <div className="mt-2 flex gap-4 text-xs">
                    {action.impactOnPressure !== undefined && (
                      <span className={`font-semibold ${action.impactOnPressure > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Pressure: {action.impactOnPressure > 0 ? '+' : ''}{action.impactOnPressure}
                      </span>
                    )}
                    {action.impactOnPerception !== undefined && (
                      <span className={`font-semibold ${action.impactOnPerception > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Perception: {action.impactOnPerception > 0 ? '+' : ''}{action.impactOnPerception}
                      </span>
                    )}
                  </div>
                )}
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
 *    - Integrates with dominance API for antitrust data
 *    - Calculates pressure and intervention probability
 *    - Tracks regulatory actions and company responses
 * 
 * 2. PRESSURE CALCULATION (0-100):
 *    - Based on antitrust risk from /api/ai/dominance
 *    - 80+: Critical (immediate intervention likely)
 *    - 60-80: High (intervention probable)
 *    - 40-60: Moderate (monitoring active)
 *    - <40: Low (routine oversight)
 * 
 * 3. INTERVENTION PROBABILITY:
 *    - 80+ pressure: 90%+ intervention likelihood
 *    - 60-80 pressure: 60-90% likelihood
 *    - 40-60 pressure: 30-60% likelihood
 *    - <40 pressure: <30% likelihood
 * 
 * 4. REGULATORY TRIGGERS:
 *    - Market share > 40%
 *    - Monopoly conditions detected
 *    - High antitrust risk score (>60)
 * 
 * 5. ACTION TYPES (8 categories):
 *    Government:
 *    - Antitrust Investigation (🔍)
 *    - Divestiture Order (⚖️)
 *    - Market Conduct Regulation (📋)
 *    - Safety Audit (🔒)
 *    - Emergency Shutdown (🚨)
 *    
 *    Company:
 *    - Voluntary Compliance (✅)
 *    - Transparency Report (📄)
 *    - Safety Improvement Plan (🛡️)
 * 
 * 6. SEVERITY LEVELS:
 *    - Critical: Red (immediate threat)
 *    - High: Orange (significant concern)
 *    - Medium: Yellow (noteworthy)
 *    - Low: Blue (routine)
 * 
 * 7. LIKELY ACTIONS GENERATION:
 *    - Pressure 80+: Investigation + Divestiture
 *    - Pressure 60-80: Conduct Regulation + Safety Audit
 *    - Pressure 40-60: Transparency Report
 * 
 * 8. ANTITRUST RISK FACTORS (5 components):
 *    - Market Share: Percentage-based scoring
 *    - HHI: Concentration impact
 *    - Duration: Time monopoly persists
 *    - Consumer Harm: Economic damage
 *    - Political: Government pressure
 * 
 * 9. ACTION HISTORY:
 *    - Timeline of government actions
 *    - Company responses tracked
 *    - Impact on pressure and perception
 *    - Outcomes documented
 * 
 * 10. FUTURE ENHANCEMENTS:
 *     - Real-time regulatory news feed
 *     - Mitigation strategy simulator
 *     - Compliance checklist tracker
 *     - Legal team integration
 *     - Regulatory timeline predictions
 * 
 * @usage
 * ```tsx
 * <RegulatoryPressureMonitor 
 *   companyId="673d7..." 
 *   includeHistory={true}
 *   limit={10}
 * />
 * ```
 */
