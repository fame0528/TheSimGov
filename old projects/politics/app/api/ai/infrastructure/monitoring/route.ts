/**
 * /api/ai/infrastructure/monitoring/route.ts
 * Created: 2025-11-15
 * 
 * OVERVIEW:
 * Data center infrastructure monitoring and optimization API.
 * Provides real-time analysis of PUE trends, cooling efficiency, power utilization,
 * downtime impact, and tier upgrade evaluation.
 * 
 * ENDPOINTS:
 * - POST /pue-trend: Historical PUE analysis with cost projections
 * - POST /cooling-upgrade: Cooling upgrade ROI analysis
 * - POST /power-utilization: Power capacity optimization
 * - POST /downtime-impact: SLA breach impact calculation
 * - POST /tier-upgrade: Tier certification upgrade analysis
 * - GET /alerts: Real-time infrastructure alerts
 * 
 * BUSINESS LOGIC:
 * - Continuous monitoring of data center efficiency metrics
 * - Financial analysis for infrastructure investments
 * - Proactive alerting for performance degradation
 * - ROI-driven upgrade recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import DataCenter from '@/lib/db/models/DataCenter';
import Company from '@/lib/db/models/Company';
import {
  analyzePUETrend,
  recommendCoolingUpgrade,
  optimizePowerUsage,
  calculateDowntimeImpact,
  analyzeTierUpgrade,
} from '@/lib/utils/ai/infrastructure';

/**
 * POST /api/ai/infrastructure/monitoring/pue-trend
 * 
 * Analyze historical PUE trends with cost projections
 * 
 * Request body:
 * {
 *   dataCenterId: string,
 *   monthsHistory: number (1-36),
 *   powerCostPerKWh: number ($/kWh)
 * }
 * 
 * Returns:
 * - avgPUE: Average PUE over period
 * - pueChange: Trend (improving/degrading/stable)
 * - efficiencyGrade: Grade (Excellent/Good/Fair/Poor/Critical)
 * - annualPowerCost: Current annual cost
 * - potentialSavings: Savings if target PUE achieved
 * - recommendations: Actionable improvements
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { pathname } = new URL(request.url);
    const body = await request.json();
    
    // Route to appropriate handler based on pathname
    if (pathname.endsWith('/pue-trend')) {
      return handlePUETrend(body, session.user.id);
    } else if (pathname.endsWith('/cooling-upgrade')) {
      return handleCoolingUpgrade(body, session.user.id);
    } else if (pathname.endsWith('/power-utilization')) {
      return handlePowerUtilization(body, session.user.id);
    } else if (pathname.endsWith('/downtime-impact')) {
      return handleDowntimeImpact(body, session.user.id);
    } else if (pathname.endsWith('/tier-upgrade')) {
      return handleTierUpgrade(body, session.user.id);
    } else {
      return NextResponse.json({ error: 'Unknown endpoint' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Error in infrastructure monitoring:', error);
    return NextResponse.json(
      { error: 'Infrastructure monitoring failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/infrastructure/monitoring/alerts
 * 
 * Get real-time infrastructure alerts
 * 
 * Query params:
 * - dataCenterId: Specific data center (optional)
 * - severity: Filter by severity (Critical/High/Medium/Low)
 * - limit: Max alerts (default 50)
 * 
 * Returns:
 * - alerts: Array of active alerts
 * - criticalCount: Count of critical alerts
 * - summary: Alert summary by category
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const dataCenterId = searchParams.get('dataCenterId');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Build filter for data centers owned by user
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    const dcFilter: any = { company: company._id };
    if (dataCenterId) {
      dcFilter._id = dataCenterId;
    }
    
    const dataCenters = await DataCenter.find(dcFilter);
    
    // Generate alerts based on current metrics
    const alerts: any[] = [];
    
    for (const dc of dataCenters) {
      // PUE alerts
      const targetPUE = dc.coolingSystem === 'Immersion' ? 1.15
        : dc.coolingSystem === 'Liquid' ? 1.4
        : 1.8;
      
      if (dc.currentPUE > targetPUE * 1.3) {
        alerts.push({
          dataCenterId: dc._id,
          dataCenterName: dc.name,
          type: 'PUE_DEGRADATION',
          severity: 'Critical',
          message: `PUE ${dc.currentPUE.toFixed(2)} exceeds target ${targetPUE.toFixed(2)} by ${((dc.currentPUE / targetPUE - 1) * 100).toFixed(0)}%`,
          recommendation: 'Immediate cooling system inspection required',
          timestamp: new Date(),
        });
      } else if (dc.currentPUE > targetPUE * 1.15) {
        alerts.push({
          dataCenterId: dc._id,
          dataCenterName: dc.name,
          type: 'PUE_WARNING',
          severity: 'High',
          message: `PUE ${dc.currentPUE.toFixed(2)} trending above optimal`,
          recommendation: 'Schedule preventive maintenance',
          timestamp: new Date(),
        });
      }
      
      // Power utilization alerts
      const utilization = dc.powerUsageMW / dc.powerCapacityMW;
      
      if (utilization > 0.95) {
        alerts.push({
          dataCenterId: dc._id,
          dataCenterName: dc.name,
          type: 'POWER_CRITICAL',
          severity: 'Critical',
          message: `Power utilization ${(utilization * 100).toFixed(0)}% - capacity exhausted`,
          recommendation: 'Immediate capacity expansion or load shedding required',
          timestamp: new Date(),
        });
      } else if (utilization > 0.85) {
        alerts.push({
          dataCenterId: dc._id,
          dataCenterName: dc.name,
          type: 'POWER_HIGH',
          severity: 'High',
          message: `Power utilization ${(utilization * 100).toFixed(0)}% - approaching capacity`,
          recommendation: 'Plan capacity expansion within 3-6 months',
          timestamp: new Date(),
        });
      } else if (utilization < 0.4) {
        alerts.push({
          dataCenterId: dc._id,
          dataCenterName: dc.name,
          type: 'POWER_UNDERUTILIZED',
          severity: 'Low',
          message: `Power utilization ${(utilization * 100).toFixed(0)}% - excess capacity`,
          recommendation: 'Consider selling excess capacity or consolidating workloads',
          timestamp: new Date(),
        });
      }
      
      // Redundancy alerts
      if (dc.tier >= 2 && !dc.backupGenerators) {
        alerts.push({
          dataCenterId: dc._id,
          dataCenterName: dc.name,
          type: 'REDUNDANCY_MISSING',
          severity: 'High',
          message: `Tier ${dc.tier} requires backup generators`,
          recommendation: 'Install backup power to maintain tier certification',
          timestamp: new Date(),
        });
      }
      
      if (dc.tier >= 2 && !dc.upsCapacity) {
        alerts.push({
          dataCenterId: dc._id,
          dataCenterName: dc.name,
          type: 'UPS_MISSING',
          severity: 'High',
          message: `Tier ${dc.tier} requires UPS system`,
          recommendation: 'Install UPS to maintain tier certification',
          timestamp: new Date(),
        });
      }
      
      // Uptime alerts (if tracking enabled)
      const expectedUptime = dc.tier === 4 ? 99.995
        : dc.tier === 3 ? 99.982
        : dc.tier === 2 ? 99.741
        : 99.671;
      
      if (dc.metrics?.actualUptime && dc.metrics.actualUptime < expectedUptime - 0.1) {
        alerts.push({
          dataCenterId: dc._id,
          dataCenterName: dc.name,
          type: 'UPTIME_BREACH',
          severity: 'Critical',
          message: `Uptime ${dc.metrics.actualUptime.toFixed(3)}% below tier ${dc.tier} requirement ${expectedUptime}%`,
          recommendation: 'Review incident logs and improve redundancy',
          timestamp: new Date(),
        });
      }
    }
    
    // Filter by severity if specified
    let filteredAlerts = alerts;
    if (severity) {
      filteredAlerts = alerts.filter(a => a.severity === severity);
    }
    
    // Limit results
    filteredAlerts = filteredAlerts.slice(0, limit);
    
    // Calculate summary
    const summary = {
      Critical: alerts.filter(a => a.severity === 'Critical').length,
      High: alerts.filter(a => a.severity === 'High').length,
      Medium: alerts.filter(a => a.severity === 'Medium').length,
      Low: alerts.filter(a => a.severity === 'Low').length,
      byType: alerts.reduce((acc: any, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      }, {}),
    };
    
    return NextResponse.json({
      alerts: filteredAlerts,
      criticalCount: summary.Critical,
      summary,
    });
  } catch (error: any) {
    console.error('Error fetching infrastructure alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts', details: error.message },
      { status: 500 }
    );
  }
}

// Handler functions

async function handlePUETrend(body: any, userId: string) {
  const { dataCenterId, powerCostPerKWh = 0.08 } = body;
  
  // Verify ownership
  const dc = await DataCenter.findById(dataCenterId).populate('company');
  if (!dc) {
    return NextResponse.json({ error: 'Data center not found' }, { status: 404 });
  }
  
  const company = dc.company as any;
  if (company.owner.toString() !== userId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  
  // Analyze PUE trend
  const analysis = analyzePUETrend(dc, powerCostPerKWh);
  
  return NextResponse.json(analysis);
}

async function handleCoolingUpgrade(body: any, userId: string) {
  const { dataCenterId, powerCostPerKWh = 0.08 } = body;
  
  // Verify ownership
  const dc = await DataCenter.findById(dataCenterId).populate('company');
  if (!dc) {
    return NextResponse.json({ error: 'Data center not found' }, { status: 404 });
  }
  
  const company = dc.company as any;
  if (company.owner.toString() !== userId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  
  // Calculate ROI using recommendCoolingUpgrade
  const analysis = recommendCoolingUpgrade(
    dc,
    powerCostPerKWh
  );
  
  return NextResponse.json(analysis);
}

async function handlePowerUtilization(body: any, userId: string) {
  const { dataCenterId, powerCostPerKWh = 0.08 } = body;
  
  // Verify ownership
  const dc = await DataCenter.findById(dataCenterId).populate('company');
  if (!dc) {
    return NextResponse.json({ error: 'Data center not found' }, { status: 404 });
  }
  
  const company = dc.company as any;
  if (company.owner.toString() !== userId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  
  // Optimize power utilization
  const analysis = optimizePowerUsage(dc, powerCostPerKWh);
  
  return NextResponse.json(analysis);
}

async function handleDowntimeImpact(body: any, userId: string) {
  const { dataCenterId, downtimeHours, monthlyRevenue } = body;
  
  // Verify ownership
  const dc = await DataCenter.findById(dataCenterId).populate('company');
  if (!dc) {
    return NextResponse.json({ error: 'Data center not found' }, { status: 404 });
  }
  
  const company = dc.company as any;
  if (company.owner.toString() !== userId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  
  // Calculate downtime impact
  const analysis = calculateDowntimeImpact(dc, downtimeHours, monthlyRevenue);
  
  return NextResponse.json(analysis);
}

async function handleTierUpgrade(body: any, userId: string) {
  const { dataCenterId, currentMonthlyRevenue } = body;
  
  // Verify ownership
  const dc = await DataCenter.findById(dataCenterId).populate('company');
  if (!dc) {
    return NextResponse.json({ error: 'Data center not found' }, { status: 404 });
  }
  
  const company = dc.company as any;
  if (company.owner.toString() !== userId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  
  // Analyze tier upgrade (function determines next tier automatically)
  const analysis = analyzeTierUpgrade(dc, currentMonthlyRevenue);
  
  return NextResponse.json(analysis);
}
