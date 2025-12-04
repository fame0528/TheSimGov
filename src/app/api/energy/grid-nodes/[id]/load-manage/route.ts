/**
 * @file POST /api/energy/grid-nodes/[id]/load-manage
 * @description Manage grid node load - demand response, peak shaving, load shifting
 * @timestamp 2025-11-28
 * @author ECHO v1.3.1
 * 
 * OVERVIEW:
 * Handles load management operations including demand response programs, peak shaving,
 * and load shifting to optimize grid utilization and reduce costs.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB as dbConnect } from '@/lib/db';
import { GridNode } from '@/lib/db/models';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const LoadManageSchema = z.object({
  strategy: z.enum(['PEAK_SHAVING', 'LOAD_SHIFTING', 'DEMAND_RESPONSE', 'CONSERVATION']).describe('Load management strategy'),
  targetReduction: z.number().min(0).max(100).describe('Target load reduction percentage'),
  duration: z.number().min(1).max(24).describe('Duration in hours'),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().default('MEDIUM').describe('Program priority'),
  incentiveRate: z.number().min(0).max(500).optional().describe('Incentive payment $/MWh for demand response')
});

type LoadManageInput = z.infer<typeof LoadManageSchema>;

// ============================================================================
// CONSTANTS
// ============================================================================

const PEAK_DEMAND_THRESHOLD = 0.85; // 85% of capacity considered peak
const LOAD_SHIFTING_EFFICIENCY = 0.95; // 95% efficiency (some losses)
const DEMAND_RESPONSE_PARTICIPATION = {
  CRITICAL: 0.8, // 80% participation in critical events
  HIGH: 0.6,     // 60% in high priority
  MEDIUM: 0.4,   // 40% in medium priority
  LOW: 0.2       // 20% in low priority
};

const DEFAULT_INCENTIVE_RATES = {
  CRITICAL: 250, // $/MWh
  HIGH: 150,
  MEDIUM: 75,
  LOW: 25
};

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // Authentication
    const session = await auth();
    if (!session?.user?.companyId) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    // Parse request body
    const body = await req.json();
    const validation = LoadManageSchema.safeParse(body);
    
    if (!validation.success) {
      return createErrorResponse('Invalid input', ErrorCode.BAD_REQUEST, 400);
    }

    const { strategy, targetReduction, duration, priority, incentiveRate } = validation.data;

    // Database connection
    await dbConnect();

    // Find grid node
    const gridNode = await GridNode.findOne({
      _id: id,
      company: session.user.companyId
    });

    if (!gridNode) {
      return createErrorResponse('Grid node not found or access denied', ErrorCode.NOT_FOUND, 404);
    }

    // Calculate current load metrics
    const currentDemand = gridNode.currentDemand || 0;
    const capacity = gridNode.capacityMW || 1000; // Default 1000 MW if not set
    const utilizationPercent = (currentDemand / capacity) * 100;
    const isPeakDemand = utilizationPercent >= (PEAK_DEMAND_THRESHOLD * 100);

    // Calculate target reduction in MW
    const targetReductionMW = (currentDemand * targetReduction) / 100;

    // Calculate actual achievable reduction based on strategy
    let achievableReductionMW: number;
    let participationRate: number;
    let programCost: number;
    let effectiveIncentive: number;

    switch (strategy) {
      case 'PEAK_SHAVING':
        // Peak shaving - reduce peak demand through temporary load curtailment
        achievableReductionMW = targetReductionMW * 0.9; // 90% achievable
        participationRate = 0.7; // 70% of customers participate
        effectiveIncentive = incentiveRate || DEFAULT_INCENTIVE_RATES[priority];
        programCost = achievableReductionMW * effectiveIncentive * duration;
        break;

      case 'LOAD_SHIFTING':
        // Load shifting - move non-critical loads to off-peak hours
        achievableReductionMW = targetReductionMW * LOAD_SHIFTING_EFFICIENCY;
        participationRate = 0.5; // 50% of loads can be shifted
        effectiveIncentive = (incentiveRate || DEFAULT_INCENTIVE_RATES[priority]) * 0.5; // Lower cost, no actual reduction
        programCost = achievableReductionMW * effectiveIncentive * duration;
        break;

      case 'DEMAND_RESPONSE':
        // Demand response - customer participation program
        participationRate = DEMAND_RESPONSE_PARTICIPATION[priority];
        achievableReductionMW = targetReductionMW * participationRate;
        effectiveIncentive = incentiveRate || DEFAULT_INCENTIVE_RATES[priority];
        programCost = achievableReductionMW * effectiveIncentive * duration;
        break;

      case 'CONSERVATION':
        // Conservation - voluntary load reduction, no incentives
        achievableReductionMW = targetReductionMW * 0.3; // 30% achievable (voluntary)
        participationRate = 0.3;
        effectiveIncentive = 0;
        programCost = 0;
        break;
    }

    // Calculate cost savings from reduced peak demand
    const peakDemandCharge = 15; // $/kW-month typical demand charge
    const avoiedDemandCost = (achievableReductionMW * 1000) * peakDemandCharge; // Monthly savings
    const netBenefit = avoiedDemandCost - programCost;

    // Calculate environmental impact
    const avgEmissionRate = 0.5; // tons CO2 per MWh (grid average)
    const emissionsAvoided = achievableReductionMW * duration * avgEmissionRate;

    // Update grid node demand
    const newDemand = currentDemand - achievableReductionMW;
    gridNode.currentDemand = Math.max(0, newDemand);
    gridNode.lastLoadManagementDate = new Date();

    // Save grid node
    await gridNode.save();

    // Log load management action
    console.log(`[ENERGY] Load management: ${gridNode.name} (${gridNode._id}), Strategy: ${strategy}, Reduction: ${achievableReductionMW.toFixed(2)} MW, Cost: $${programCost.toFixed(0)}`);

    return createSuccessResponse({
      success: true,
      gridNode: {
        id: gridNode._id,
        name: gridNode.name,
        previousDemand: currentDemand,
        newDemand: gridNode.currentDemand,
        capacity,
        lastLoadManagementDate: gridNode.lastLoadManagementDate
      },
      program: {
        strategy,
        priority,
        targetReduction: targetReduction + '%',
        targetReductionMW: targetReductionMW.toFixed(2) + ' MW',
        achievableReduction: achievableReductionMW.toFixed(2) + ' MW',
        achievablePercent: ((achievableReductionMW / currentDemand) * 100).toFixed(2) + '%',
        participationRate: (participationRate * 100).toFixed(0) + '%',
        duration: duration + ' hours',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()
      },
      economics: {
        incentiveRate: '$' + effectiveIncentive.toFixed(2) + '/MWh',
        programCost: '$' + programCost.toFixed(2),
        demandChargeSavings: '$' + avoiedDemandCost.toFixed(2) + '/month',
        netBenefit: '$' + netBenefit.toFixed(2),
        roi: ((netBenefit / Math.max(programCost, 1)) * 100).toFixed(2) + '%',
        costPerMW: programCost > 0 ? '$' + (programCost / achievableReductionMW).toFixed(2) + '/MW' : '$0.00/MW'
      },
      grid: {
        previousUtilization: utilizationPercent.toFixed(2) + '%',
        newUtilization: ((gridNode.currentDemand / capacity) * 100).toFixed(2) + '%',
        isPeakPeriod: isPeakDemand,
        capacityReleased: achievableReductionMW.toFixed(2) + ' MW',
        capacityReleasedPercent: ((achievableReductionMW / capacity) * 100).toFixed(2) + '%'
      },
      environmental: {
        emissionsAvoided: emissionsAvoided.toFixed(2) + ' tons CO2',
        emissionsRate: avgEmissionRate + ' tons CO2/MWh',
        energySaved: (achievableReductionMW * duration).toFixed(2) + ' MWh'
      }
    });

  } catch (error) {
    console.error('[ENERGY] Load management error:', error);
    return createErrorResponse('Failed to manage grid load', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Load Management Strategies:
 *    - PEAK_SHAVING: Reduce peak demand temporarily (90% achievable, high cost)
 *    - LOAD_SHIFTING: Move loads to off-peak hours (95% efficient, medium cost)
 *    - DEMAND_RESPONSE: Customer participation programs (variable participation, customizable incentives)
 *    - CONSERVATION: Voluntary reduction (30% achievable, zero cost)
 * 
 * 2. Participation Rates:
 *    - CRITICAL events: 80% participation (emergency)
 *    - HIGH priority: 60% participation
 *    - MEDIUM priority: 40% participation
 *    - LOW priority: 20% participation
 * 
 * 3. Economics:
 *    - Demand charges: $15/kW-month typical utility rate
 *    - Incentive payments: $25-$250/MWh based on priority
 *    - Net benefit = Avoided demand charges - Program cost
 *    - ROI calculated from net benefit vs program cost
 * 
 * 4. Environmental Impact:
 *    - Emissions avoided: 0.5 tons CO2/MWh (US grid average)
 *    - Energy conservation tracked in MWh
 *    - Supports sustainability goals and carbon reduction
 * 
 * 5. Future Enhancements:
 *    - Dynamic pricing signals (time-of-use rates)
 *    - Smart thermostat integration for automated response
 *    - Industrial process scheduling optimization
 *    - EV charging coordination for load balancing
 *    - Real-time telemetry from smart meters
 */
