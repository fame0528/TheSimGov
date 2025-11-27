/**
 * Global Impact Timeline Component
 * 
 * @fileoverview Interactive timeline for global impact events
 * Displays automation waves, regulatory interventions, public backlash, AI arms race, and market monopoly events
 * 
 * @component GlobalImpactTimeline
 * @requires /api/ai/global-events (GET)
 * 
 * @created 2025-11-15
 * @updated 2025-11-15
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * OVERVIEW:
 * 
 * Timeline visualization for global AI impact events.
 * 
 * KEY FEATURES:
 * - Chronological event display with severity indicators
 * - Event type filtering (Monopoly, Regulatory, Backlash, Arms Race, Automation)
 * - Severity level color coding (Minor, Major, Critical, Existential)
 * - Status tracking (Predicted, Active, Resolved, Escalating)
 * - Consequence breakdown (Economic, Political, Social)
 * - Response tracking (Company, Government, Public)
 * - Pagination for large event lists
 * 
 * BUSINESS LOGIC:
 * - Fetches events from /api/ai/global-events
 * - Filters by company, type, severity, status, date range
 * - Displays events in reverse chronological order
 * - Shows multi-dimensional consequences
 * - Tracks all stakeholder responses
 * 
 * DEPENDENCIES:
 * - /api/ai/global-events endpoint
 * - next-auth session (personalized view)
 */

// ============================================================================
// Type Definitions
// ============================================================================

type EventType = 'Market Monopoly' | 'Regulatory Intervention' | 'Public Backlash' | 'AI Arms Race' | 'Automation Wave';
type Severity = 'Minor' | 'Major' | 'Critical' | 'Existential';
type EventStatus = 'Predicted' | 'Active' | 'Resolved' | 'Escalating';

interface Consequences {
  economic: {
    gdpImpact?: number;
    jobsAffected?: number;
    marketValueImpact?: number;
    recoveryTime?: number;
  };
  political: {
    regulationsImposed?: number;
    countriesBanning?: number;
    stabilityImpact?: number;
  };
  social: {
    publicPerceptionChange?: number;
    unrestLevel?: number;
    aiTrustChange?: number;
    mediaSentiment?: number;
  };
}

interface GlobalImpactEvent {
  _id: string;
  eventType: EventType;
  severity: Severity;
  status: EventStatus;
  title: string;
  description: string;
  primaryCompany: {
    _id: string;
    name: string;
    industry: string;
    subcategory: string;
    level: number;
  };
  affectedCompanies: Array<{ _id: string; name: string }>;
  triggeredAt: string;
  resolvedAt?: string;
  triggerConditions: Record<string, any>;
  consequences?: Consequences;
  companyResponses?: Array<any>;
  governmentResponses?: Array<any>;
  publicReactions?: Array<any>;
}

interface PaginationData {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

interface GlobalImpactTimelineProps {
  companyId?: string;
  eventType?: EventType;
  severity?: Severity;
  status?: EventStatus;
  limit?: number;
  showFilters?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export default function GlobalImpactTimeline({
  companyId,
  eventType,
  severity,
  status,
  limit = 20,
  showFilters = true,
}: GlobalImpactTimelineProps) {
  const [events, setEvents] = useState<GlobalImpactEvent[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    eventType: eventType || '',
    severity: severity || '',
    status: status || '',
    page: 1,
  });

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Fetch global impact events from API
   */
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        page: filters.page.toString(),
      });

      if (companyId) params.append('companyId', companyId);
      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/ai/global-events?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch events');
      }

      setEvents(result.data.events);
      setPagination(result.data.pagination);
    } catch (err: any) {
      console.error('Error fetching global impact events:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and filter changes
  useEffect(() => {
    fetchEvents();
  }, [companyId, filters]);

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Get color for event type
   */
  const getEventTypeColor = (type: EventType): string => {
    const colors: Record<EventType, string> = {
      'Market Monopoly': 'text-purple-600 bg-purple-50 border-purple-300',
      'Regulatory Intervention': 'text-red-600 bg-red-50 border-red-300',
      'Public Backlash': 'text-orange-600 bg-orange-50 border-orange-300',
      'AI Arms Race': 'text-blue-600 bg-blue-50 border-blue-300',
      'Automation Wave': 'text-green-600 bg-green-50 border-green-300',
    };
    return colors[type] || 'text-gray-600 bg-gray-50 border-gray-300';
  };

  /**
   * Get color for severity level
   */
  const getSeverityColor = (sev: Severity): string => {
    const colors: Record<Severity, string> = {
      'Minor': 'text-green-600 bg-green-100',
      'Major': 'text-yellow-600 bg-yellow-100',
      'Critical': 'text-orange-600 bg-orange-100',
      'Existential': 'text-red-600 bg-red-100',
    };
    return colors[sev] || 'text-gray-600 bg-gray-100';
  };

  /**
   * Get color for status
   */
  const getStatusColor = (stat: EventStatus): string => {
    const colors: Record<EventStatus, string> = {
      'Predicted': 'text-blue-600 bg-blue-50',
      'Active': 'text-red-600 bg-red-50',
      'Resolved': 'text-green-600 bg-green-50',
      'Escalating': 'text-orange-600 bg-orange-50',
    };
    return colors[stat] || 'text-gray-600 bg-gray-50';
  };

  /**
   * Format number with commas
   */
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return 'N/A';
    return num.toLocaleString();
  };

  /**
   * Get icon for event type
   */
  const getEventIcon = (type: EventType): string => {
    const icons: Record<EventType, string> = {
      'Market Monopoly': '📊',
      'Regulatory Intervention': '⚖️',
      'Public Backlash': '😡',
      'AI Arms Race': '🚀',
      'Automation Wave': '🤖',
    };
    return icons[type] || '📌';
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading && events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Events</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchEvents}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Global Impact Timeline</h2>
        <p className="text-sm text-gray-600">
          Track major AI industry events and their consequences
        </p>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Event Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <select
                value={filters.eventType}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="Market Monopoly">Market Monopoly</option>
                <option value="Regulatory Intervention">Regulatory Intervention</option>
                <option value="Public Backlash">Public Backlash</option>
                <option value="AI Arms Race">AI Arms Race</option>
                <option value="Automation Wave">Automation Wave</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Severities</option>
                <option value="Minor">Minor</option>
                <option value="Major">Major</option>
                <option value="Critical">Critical</option>
                <option value="Existential">Existential</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="Predicted">Predicted</option>
                <option value="Active">Active</option>
                <option value="Escalating">Escalating</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Events Timeline */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">No events found matching your criteria</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Event Header */}
              <div className={`border-l-4 p-6 ${getEventTypeColor(event.eventType)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getEventIcon(event.eventType)}</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
                      <p className="text-sm text-gray-600">
                        {event.primaryCompany.name} • {new Date(event.triggeredAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{event.description}</p>

                {/* Consequences */}
                {event.consequences && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {/* Economic Impact */}
                    {event.consequences.economic && (
                      <div className="bg-white bg-opacity-50 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">💰 Economic</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {event.consequences.economic.gdpImpact !== undefined && (
                            <li>GDP: {event.consequences.economic.gdpImpact > 0 ? '+' : ''}{event.consequences.economic.gdpImpact}%</li>
                          )}
                          {event.consequences.economic.jobsAffected !== undefined && (
                            <li>Jobs: {formatNumber(event.consequences.economic.jobsAffected)}</li>
                          )}
                          {event.consequences.economic.marketValueImpact !== undefined && (
                            <li>Market: {event.consequences.economic.marketValueImpact > 0 ? '+' : ''}{event.consequences.economic.marketValueImpact}%</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Political Impact */}
                    {event.consequences.political && (
                      <div className="bg-white bg-opacity-50 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">⚖️ Political</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {event.consequences.political.regulationsImposed !== undefined && (
                            <li>Regulations: {event.consequences.political.regulationsImposed}</li>
                          )}
                          {event.consequences.political.countriesBanning !== undefined && (
                            <li>Bans: {event.consequences.political.countriesBanning} countries</li>
                          )}
                          {event.consequences.political.stabilityImpact !== undefined && (
                            <li>Stability: {event.consequences.political.stabilityImpact > 0 ? '+' : ''}{event.consequences.political.stabilityImpact}</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Social Impact */}
                    {event.consequences.social && (
                      <div className="bg-white bg-opacity-50 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">👥 Social</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {event.consequences.social.publicPerceptionChange !== undefined && (
                            <li>Perception: {event.consequences.social.publicPerceptionChange > 0 ? '+' : ''}{event.consequences.social.publicPerceptionChange}</li>
                          )}
                          {event.consequences.social.unrestLevel !== undefined && (
                            <li>Unrest: {event.consequences.social.unrestLevel}/100</li>
                          )}
                          {event.consequences.social.aiTrustChange !== undefined && (
                            <li>AI Trust: {event.consequences.social.aiTrustChange > 0 ? '+' : ''}{event.consequences.social.aiTrustChange}</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Responses */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  {event.companyResponses && event.companyResponses.length > 0 && (
                    <div className="text-gray-700">
                      <span className="font-semibold">Company:</span> {event.companyResponses.length} response(s)
                    </div>
                  )}
                  {event.governmentResponses && event.governmentResponses.length > 0 && (
                    <div className="text-gray-700">
                      <span className="font-semibold">Government:</span> {event.governmentResponses.length} response(s)
                    </div>
                  )}
                  {event.publicReactions && event.publicReactions.length > 0 && (
                    <div className="text-gray-700">
                      <span className="font-semibold">Public:</span> {event.publicReactions.length} reaction(s)
                    </div>
                  )}
                </div>

                {/* Affected Companies */}
                {event.affectedCompanies && event.affectedCompanies.length > 0 && (
                  <div className="mt-3 text-xs text-gray-600">
                    <span className="font-semibold">Affected companies:</span> {event.affectedCompanies.map(c => c.name).join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} events
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
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
 *    - Client-side React component with hooks
 *    - Filtering and pagination state management
 *    - Responsive grid layouts
 *    - Event-driven updates
 * 
 * 2. EVENT DISPLAY:
 *    - Timeline format (reverse chronological)
 *    - Color-coded by type and severity
 *    - Status indicators for tracking
 *    - Expandable details (future: click to expand)
 * 
 * 3. FILTERING:
 *    - Event type: 5 categories
 *    - Severity: 4 levels
 *    - Status: 4 states
 *    - Company: Optional company filter
 * 
 * 4. CONSEQUENCES VISUALIZATION:
 *    - Economic: GDP, jobs, market value
 *    - Political: Regulations, bans, stability
 *    - Social: Perception, unrest, trust
 * 
 * 5. RESPONSE TRACKING:
 *    - Company responses count
 *    - Government responses count
 *    - Public reactions count
 *    - Future: Expandable details
 * 
 * 6. PAGINATION:
 *    - Configurable limit (default: 20)
 *    - Page navigation controls
 *    - Total count display
 * 
 * 7. COLOR CODING:
 *    - Market Monopoly: Purple
 *    - Regulatory Intervention: Red
 *    - Public Backlash: Orange
 *    - AI Arms Race: Blue
 *    - Automation Wave: Green
 * 
 * 8. SEVERITY LEVELS:
 *    - Minor: Green
 *    - Major: Yellow
 *    - Critical: Orange
 *    - Existential: Red
 * 
 * 9. STATUS INDICATORS:
 *    - Predicted: Blue (forecasted)
 *    - Active: Red (happening now)
 *    - Escalating: Orange (worsening)
 *    - Resolved: Green (concluded)
 * 
 * 10. FUTURE ENHANCEMENTS:
 *     - D3.js timeline visualization
 *     - Event details modal
 *     - Response management (add/edit)
 *     - Export events to PDF
 *     - Real-time updates via WebSockets
 * 
 * @usage
 * ```tsx
 * <GlobalImpactTimeline 
 *   companyId="673d7..." 
 *   showFilters={true} 
 *   limit={20} 
 * />
 * ```
 */
