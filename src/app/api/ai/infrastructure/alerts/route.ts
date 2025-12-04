/**
 * @fileoverview Infrastructure Alerts API Endpoint
 * @module app/api/ai/infrastructure/alerts
 * 
 * OVERVIEW:
 * Real-time infrastructure monitoring alerts for data center health and compliance.
 * Generates alerts for PUE degradation, power capacity issues, redundancy violations,
 * and uptime SLA breaches. Provides proactive recommendations for issue resolution.
 * 
 * ALERT TYPES:
 * - PUE_DEGRADATION: PUE >30% above target (Critical severity)
 * - PUE_WARNING: PUE >15% above target (High severity)
 * - POWER_CRITICAL: Utilization >95% (Critical severity)
 * - POWER_HIGH: Utilization >85% (High severity)
 * - POWER_UNDERUTILIZED: Utilization <40% (Low severity)
 * - REDUNDANCY_MISSING: Tier requirements not met (High severity)
 * - UPS_MISSING: UPS required but not installed (High severity)
 * - UPTIME_BREACH: Actual uptime below tier SLA (Critical severity)
 * 
 * @created 2025-11-22
 * @author ECHO v1.3.0
 */

import { NextRequest } from 'next/server';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { connectDB } from '@/lib/db';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import DataCenter from '@/lib/db/models/DataCenter';
import Company from '@/lib/db/models/Company';

/**
 * Alert severity levels
 */
type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

/**
 * Infrastructure alert structure
 */
interface InfrastructureAlert {
  dataCenterId: string;
  dataCenterName: string;
  type: string;
  severity: AlertSeverity;
  message: string;
  recommendation: string;
  timestamp: Date;
}

/**
 * GET /api/ai/infrastructure/alerts
 * 
 * Get real-time infrastructure alerts for data centers
 * 
 * Query parameters:
 * - dataCenterId: ObjectId (optional) - Filter by specific data center
 * - severity: string (optional) - Filter by severity (Critical/High/Medium/Low)
 * - limit: number (optional, default 50, max 200) - Maximum alerts to return
 * 
 * @returns 200: Infrastructure alerts with summary statistics
 * @returns 401: Unauthorized
 * @returns 404: Company not found
 * 
 * @example
 * GET /api/ai/infrastructure/alerts?severity=Critical&limit=20
 * 
 * Response:
 * {
 *   "alerts": [
 *     {
 *       "dataCenterId": "507f1f77bcf86cd799439011",
 *       "dataCenterName": "Virginia DC-1",
 *       "type": "POWER_CRITICAL",
 *       "severity": "Critical",
 *       "message": "Power utilization 96% - capacity exhausted",
 *       "recommendation": "Immediate capacity expansion or load shedding required",
 *       "timestamp": "2025-11-22T10:30:00.000Z"
 *     }
 *   ],
 *   "criticalCount": 3,
 *   "summary": {
 *     "Critical": 3,
 *     "High": 5,
 *     "Medium": 2,
 *     "Low": 1,
 *     "byType": {
 *       "POWER_CRITICAL": 2,
 *       "PUE_WARNING": 3,
 *       "UPTIME_BREACH": 1
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { companyId, userId } = session!;

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const dataCenterId = searchParams.get('dataCenterId');
    const severity = searchParams.get('severity') as AlertSeverity | null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

    // 3. Validate severity if provided
    const validSeverities: AlertSeverity[] = ['Critical', 'High', 'Medium', 'Low'];
    if (severity && !validSeverities.includes(severity)) {
      return createErrorResponse(
        'Invalid severity. Must be: Critical, High, Medium, or Low',
        ErrorCode.BAD_REQUEST,
        400
      );
    }

    await connectDB();

    // 4. Find user's company
    const company = await Company.findById(companyId);
    if (!company) {
      return createErrorResponse(
        'Company not found',
        ErrorCode.NOT_FOUND,
        404
      );
    }

    // 5. Build data center filter
    const dcFilter: any = { company: companyId };
    if (dataCenterId) {
      dcFilter._id = dataCenterId;
    }

    // 6. Load all data centers owned by company
    const dataCenters = await DataCenter.find(dcFilter);

    // 7. Generate alerts for each data center
    const alerts: InfrastructureAlert[] = [];

    for (const dc of dataCenters) {
      // Target PUE by cooling system
      const targetPUE = dc.coolingSystem === 'Immersion' ? 1.15
        : dc.coolingSystem === 'Liquid' ? 1.4
        : 1.8;

      // PUE ALERTS
      if (dc.pue > targetPUE * 1.3) {
        alerts.push({
          dataCenterId: dc._id.toString(),
          dataCenterName: dc.name,
          type: 'PUE_DEGRADATION',
          severity: 'Critical',
          message: `PUE ${dc.pue.toFixed(2)} exceeds target ${targetPUE.toFixed(2)} by ${((dc.pue / targetPUE - 1) * 100).toFixed(0)}%`,
          recommendation: 'Immediate cooling system inspection required',
          timestamp: new Date(),
        });
      } else if (dc.pue > targetPUE * 1.15) {
        alerts.push({
          dataCenterId: dc._id.toString(),
          dataCenterName: dc.name,
          type: 'PUE_WARNING',
          severity: 'High',
          message: `PUE ${dc.pue.toFixed(2)} trending above optimal`,
          recommendation: 'Schedule preventive maintenance',
          timestamp: new Date(),
        });
      }

      // POWER UTILIZATION ALERTS
      const utilization = dc.powerUtilizationMW / dc.powerCapacityMW;

      if (utilization > 0.95) {
        alerts.push({
          dataCenterId: dc._id.toString(),
          dataCenterName: dc.name,
          type: 'POWER_CRITICAL',
          severity: 'Critical',
          message: `Power utilization ${(utilization * 100).toFixed(0)}% - capacity exhausted`,
          recommendation: 'Immediate capacity expansion or load shedding required',
          timestamp: new Date(),
        });
      } else if (utilization > 0.85) {
        alerts.push({
          dataCenterId: dc._id.toString(),
          dataCenterName: dc.name,
          type: 'POWER_HIGH',
          severity: 'High',
          message: `Power utilization ${(utilization * 100).toFixed(0)}% - approaching capacity`,
          recommendation: 'Plan capacity expansion within 3-6 months',
          timestamp: new Date(),
        });
      } else if (utilization < 0.4) {
        alerts.push({
          dataCenterId: dc._id.toString(),
          dataCenterName: dc.name,
          type: 'POWER_UNDERUTILIZED',
          severity: 'Low',
          message: `Power utilization ${(utilization * 100).toFixed(0)}% - excess capacity`,
          recommendation: 'Consider selling excess capacity or consolidating workloads',
          timestamp: new Date(),
        });
      }

      // REDUNDANCY ALERTS (Tier II-IV requirements)
      if (dc.tierCertification >= 2 && (!dc.powerRedundancy || dc.powerRedundancy.generators === 0)) {
        alerts.push({
          dataCenterId: dc._id.toString(),
          dataCenterName: dc.name,
          type: 'REDUNDANCY_MISSING',
          severity: 'High',
          message: `Tier ${dc.tierCertification} requires backup generators`,
          recommendation: 'Install backup power to maintain tier certification',
          timestamp: new Date(),
        });
      }

      if (dc.tierCertification >= 2 && (!dc.powerRedundancy || !dc.powerRedundancy.ups)) {
        alerts.push({
          dataCenterId: dc._id.toString(),
          dataCenterName: dc.name,
          type: 'UPS_MISSING',
          severity: 'High',
          message: `Tier ${dc.tierCertification} requires UPS system`,
          recommendation: 'Install UPS to maintain tier certification',
          timestamp: new Date(),
        });
      }

      // UPTIME ALERTS (if tracking enabled via metrics)
      const expectedUptime = dc.tierCertification === 4 ? 99.995
        : dc.tierCertification === 3 ? 99.982
        : dc.tierCertification === 2 ? 99.741
        : 99.671;

      // Check if metrics.actualUptime exists and is below threshold
      if (dc.metrics?.actualUptime !== undefined && dc.metrics.actualUptime < expectedUptime - 0.1) {
        alerts.push({
          dataCenterId: dc._id.toString(),
          dataCenterName: dc.name,
          type: 'UPTIME_BREACH',
          severity: 'Critical',
          message: `Uptime ${dc.metrics.actualUptime.toFixed(3)}% below Tier ${dc.tierCertification} requirement ${expectedUptime}%`,
          recommendation: 'Review incident logs and improve redundancy',
          timestamp: new Date(),
        });
      }
    }

    // 8. Filter by severity if specified
    let filteredAlerts = alerts;
    if (severity) {
      filteredAlerts = alerts.filter(a => a.severity === severity);
    }

    // 9. Limit results
    filteredAlerts = filteredAlerts.slice(0, limit);

    // 10. Calculate summary statistics
    const summary = {
      Critical: alerts.filter(a => a.severity === 'Critical').length,
      High: alerts.filter(a => a.severity === 'High').length,
      Medium: alerts.filter(a => a.severity === 'Medium').length,
      Low: alerts.filter(a => a.severity === 'Low').length,
      byType: alerts.reduce((acc: Record<string, number>, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      }, {}),
    };

    // 11. Return alerts with summary
    return createSuccessResponse({
      alerts: filteredAlerts,
      criticalCount: summary.Critical,
      summary,
      totalDataCenters: dataCenters.length,
    });
  } catch (error) {
    return handleAPIError('[GET /api/ai/infrastructure/alerts]', error, 'Failed to fetch infrastructure alerts');
  }
}
