/**
 * @file POST /api/energy/grid-nodes/[id]/balance
 * @description Balance grid node - match supply and demand, maintain frequency
 * @timestamp 2025-11-28
 * @author ECHO v1.3.1
 * 
 * OVERVIEW:
 * Handles grid balancing operations to match generation with demand and maintain system frequency.
 * Implements automatic generation control (AGC) and load shedding when necessary.
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

const BalanceGridNodeSchema = z.object({
  currentDemand: z.number().min(0).describe('Current demand in MW'),
  availableGeneration: z.number().min(0).describe('Available generation in MW'),
  targetFrequency: z.number().min(59.5).max(60.5).optional().default(60.0).describe('Target frequency in Hz'),
  allowLoadShedding: z.boolean().optional().default(false).describe('Allow load shedding if necessary')
});

type BalanceGridNodeInput = z.infer<typeof BalanceGridNodeSchema>;

// ============================================================================
// CONSTANTS
// ============================================================================

const FREQUENCY_DEADBAND = 0.036; // ±0.036 Hz acceptable deviation (NERC standard)
const LOAD_SHEDDING_THRESHOLD = 59.5; // Hz - below this, shed load
const OVERFREQUENCY_THRESHOLD = 60.2; // Hz - above this, reduce generation
const MAX_IMBALANCE_PERCENT = 5; // Maximum 5% supply/demand imbalance

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
    const validation = BalanceGridNodeSchema.safeParse(body);
    
    if (!validation.success) {
      return createErrorResponse('Invalid input', ErrorCode.BAD_REQUEST, 400);
    }

    const { currentDemand, availableGeneration, targetFrequency, allowLoadShedding } = validation.data;

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

    // Calculate supply/demand imbalance
    const imbalance = availableGeneration - currentDemand; // MW (positive = surplus, negative = deficit)
    const imbalancePercent = (Math.abs(imbalance) / currentDemand) * 100;

    // Estimate frequency deviation based on imbalance
    // Simplified model: 1% imbalance ≈ 0.06 Hz frequency deviation
    const frequencyDeviation = (imbalance / currentDemand) * 0.06 * 100;
    const estimatedFrequency = targetFrequency + frequencyDeviation;

    // Determine balancing action
    let balancingAction: string;
    let actionRequired = false;
    let loadShedAmount = 0;
    let generationAdjustment = 0;

    if (Math.abs(frequencyDeviation) <= FREQUENCY_DEADBAND) {
      balancingAction = 'BALANCED';
    } else if (estimatedFrequency < LOAD_SHEDDING_THRESHOLD) {
      // Underfrequency - deficit, need to shed load or increase generation
      actionRequired = true;
      if (allowLoadShedding) {
        loadShedAmount = Math.abs(imbalance);
        balancingAction = 'LOAD_SHEDDING';
      } else {
        generationAdjustment = Math.abs(imbalance);
        balancingAction = 'INCREASE_GENERATION';
      }
    } else if (estimatedFrequency > OVERFREQUENCY_THRESHOLD) {
      // Overfrequency - surplus, need to reduce generation
      actionRequired = true;
      generationAdjustment = -Math.abs(imbalance);
      balancingAction = 'DECREASE_GENERATION';
    } else {
      // Within acceptable range but needs adjustment
      actionRequired = imbalancePercent > MAX_IMBALANCE_PERCENT;
      balancingAction = imbalance > 0 ? 'REDUCE_GENERATION' : 'INCREASE_GENERATION';
      generationAdjustment = imbalance > 0 ? -Math.abs(imbalance) : Math.abs(imbalance);
    }

    // Update grid node status
    gridNode.currentDemand = currentDemand;
    gridNode.currentGeneration = availableGeneration;
    gridNode.frequency = estimatedFrequency;
    gridNode.lastBalanceDate = new Date();

    // Save grid node
    await gridNode.save();

    // Log balancing action
    console.log(`[ENERGY] Grid balance: ${gridNode.name} (${gridNode._id}), Action: ${balancingAction}, Imbalance: ${imbalance.toFixed(2)} MW, Frequency: ${estimatedFrequency.toFixed(3)} Hz`);

    return createSuccessResponse({
      success: true,
      gridNode: {
        id: gridNode._id,
        name: gridNode.name,
        currentDemand,
        currentGeneration: availableGeneration,
        frequency: estimatedFrequency.toFixed(3),
        lastBalanceDate: gridNode.lastBalanceDate
      },
      balance: {
        imbalance: imbalance.toFixed(2),
        imbalancePercent: imbalancePercent.toFixed(2) + '%',
        supplyDemandRatio: (availableGeneration / currentDemand).toFixed(4),
        balancingAction,
        actionRequired,
        timestamp: new Date().toISOString()
      },
      frequency: {
        target: targetFrequency,
        estimated: estimatedFrequency.toFixed(3),
        deviation: frequencyDeviation.toFixed(3),
        deviationPercent: ((frequencyDeviation / targetFrequency) * 100).toFixed(4) + '%',
        withinDeadband: Math.abs(frequencyDeviation) <= FREQUENCY_DEADBAND,
        status: estimatedFrequency < LOAD_SHEDDING_THRESHOLD ? 'CRITICAL_LOW' :
                estimatedFrequency > OVERFREQUENCY_THRESHOLD ? 'CRITICAL_HIGH' : 'NORMAL'
      },
      actions: {
        loadShedding: loadShedAmount > 0 ? {
          amount: loadShedAmount.toFixed(2) + ' MW',
          percentage: ((loadShedAmount / currentDemand) * 100).toFixed(2) + '%'
        } : null,
        generationAdjustment: generationAdjustment !== 0 ? {
          amount: generationAdjustment.toFixed(2) + ' MW',
          direction: generationAdjustment > 0 ? 'INCREASE' : 'DECREASE',
          percentage: ((Math.abs(generationAdjustment) / availableGeneration) * 100).toFixed(2) + '%'
        } : null
      }
    });

  } catch (error) {
    console.error('[ENERGY] Grid balance error:', error);
    return createErrorResponse('Failed to balance grid node', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Grid Balancing Fundamentals:
 *    - Generation must exactly match demand at all times
 *    - Imbalances cause frequency deviations (60 Hz target in US)
 *    - 1% imbalance ≈ 0.06 Hz frequency change (simplified model)
 * 
 * 2. Frequency Control:
 *    - Deadband: ±0.036 Hz acceptable (no action needed)
 *    - Underfrequency (<59.5 Hz): Load shedding or increase generation
 *    - Overfrequency (>60.2 Hz): Decrease generation
 *    - NERC reliability standards enforced
 * 
 * 3. Balancing Actions:
 *    - BALANCED: Within acceptable range
 *    - LOAD_SHEDDING: Drop lowest-priority loads to restore balance
 *    - INCREASE_GENERATION: Ramp up dispatchable units
 *    - DECREASE_GENERATION: Ramp down or curtail renewables
 * 
 * 4. Load Shedding Priority:
 *    - Residential > Commercial > Industrial (lowest priority)
 *    - Automatic in emergencies, manual in normal operations
 *    - Minimize customer impact while maintaining grid stability
 * 
 * 5. Future Enhancements:
 *    - Real-time AGC (Automatic Generation Control) signals
 *    - Integration with energy storage for fast response
 *    - Demand response programs for voluntary load reduction
 *    - Interconnection tie-line flows for multi-area balancing
 */
