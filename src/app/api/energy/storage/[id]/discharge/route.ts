/**
 * @file POST /api/energy/storage/[id]/discharge
 * @description Discharge energy storage system - battery discharging operations
 * @timestamp 2025-11-28
 * @author ECHO v1.3.1
 * 
 * OVERVIEW:
 * Handles battery discharging operations including discharge rate control, power delivery,
 * and discharging optimization based on grid conditions and electricity prices.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB as dbConnect } from '@/lib/db';
import { EnergyStorage as Storage } from '@/lib/db/models';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const DischargeStorageSchema = z.object({
  dischargePower: z.number().min(0).describe('Discharge power in MW'),
  duration: z.number().min(0.25).max(24).describe('Discharging duration in hours'),
  electricityPrice: z.number().min(0).max(500).optional().describe('Current electricity price $/MWh'),
  dischargingMode: z.enum(['FAST', 'NORMAL', 'SUSTAINED', 'OPTIMIZED']).optional().default('NORMAL').describe('Discharging mode'),
  minSOC: z.number().min(0).max(100).optional().default(10).describe('Minimum state of charge percentage')
});

type DischargeStorageInput = z.infer<typeof DischargeStorageSchema>;

// ============================================================================
// CONSTANTS
// ============================================================================

const DISCHARGING_EFFICIENCY = {
  FAST: 0.88,      // 88% efficiency (high losses from heat/inverter)
  NORMAL: 0.94,    // 94% efficiency (balanced)
  SUSTAINED: 0.96, // 96% efficiency (slow, minimal losses)
  OPTIMIZED: 0.95  // 95% efficiency (smart discharging)
};

const MAX_DISCHARGE_RATE = {
  FAST: 1.0,       // 100% of rated power (1C rate)
  NORMAL: 0.6,     // 60% of rated power (0.6C rate)
  SUSTAINED: 0.3,  // 30% of rated power (0.3C rate)
  OPTIMIZED: 0.8   // 80% of rated power (variable)
};

const BATTERY_DEGRADATION_RATE = {
  FAST: 0.0025,    // 0.25% per cycle (fast discharging accelerates degradation)
  NORMAL: 0.001,   // 0.1% per cycle
  SUSTAINED: 0.0005, // 0.05% per cycle (gentle on battery)
  OPTIMIZED: 0.0008  // 0.08% per cycle
};

const DEPTH_OF_DISCHARGE_LIMIT = 90; // Maximum 90% DOD (10% reserve)
const CRITICAL_SOC_THRESHOLD = 15; // Below 15% SOC, power output reduced

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
    const validation = DischargeStorageSchema.safeParse(body);
    
    if (!validation.success) {
      return createErrorResponse('Invalid input', ErrorCode.BAD_REQUEST, 400);
    }

    const { dischargePower, duration, electricityPrice, dischargingMode, minSOC } = validation.data;

    // Database connection
    await dbConnect();

    // Find storage system
    const storage = await Storage.findOne({
      _id: id,
      company: session.user.companyId
    });

    if (!storage) {
      return createErrorResponse('Storage system not found or access denied', ErrorCode.NOT_FOUND, 404);
    }

    // Validate storage is not already discharging
    // Note: isDischarging is a runtime state, check status field instead
    if (storage.status === 'Discharging') {
      return createErrorResponse('Storage system is already discharging', ErrorCode.BAD_REQUEST, 400);
    }

    // Get storage parameters
    const capacity = storage.totalCapacity || 100; // MWh
    const maxPower = storage.maxDischargeRate || 50; // MW
    const currentEnergyStored = storage.currentCharge || 0; // MWh
    const currentSOC = Math.round((currentEnergyStored / capacity) * 100);

    // Check if sufficient energy available
    if (currentSOC <= minSOC) {
      return createErrorResponse(`Insufficient energy stored. Current SOC ${currentSOC}% is at or below minimum ${minSOC}%`, ErrorCode.BAD_REQUEST, 400);
    }

    // Validate discharge power within limits
    const maxAllowedPower = maxPower * MAX_DISCHARGE_RATE[dischargingMode];
    if (dischargePower > maxAllowedPower) {
      return createErrorResponse(`Discharge power ${dischargePower} MW exceeds maximum allowed ${maxAllowedPower.toFixed(2)} MW for ${dischargingMode} mode`, ErrorCode.BAD_REQUEST, 400);
    }

    // Apply power reduction if SOC critical
    let effectivePower = dischargePower;
    let powerReductionApplied = false;
    if (currentSOC < CRITICAL_SOC_THRESHOLD) {
      effectivePower = dischargePower * 0.7; // 70% power at critical SOC
      powerReductionApplied = true;
    }

    // Calculate discharging efficiency and energy delivered
    const efficiency = DISCHARGING_EFFICIENCY[dischargingMode];
    const energyFromBattery = effectivePower * duration / efficiency; // MWh (battery depletion)
    const energyDelivered = effectivePower * duration; // MWh (grid delivery)

    // Calculate new SOC
    const availableEnergy = currentEnergyStored - (minSOC / 100) * capacity; // Usable energy above minimum
    const newEnergyStored = Math.max(currentEnergyStored - energyFromBattery, (minSOC / 100) * capacity);
    const newSOC = (newEnergyStored / capacity) * 100;
    const actualEnergyDischarged = currentEnergyStored - newEnergyStored;
    const actualEnergyDelivered = actualEnergyDischarged * efficiency;
    const actualDuration = actualEnergyDelivered / effectivePower;

    // Check if discharge would deplete below minimum
    if (newSOC < minSOC) {
      const maxEnergyAvailable = availableEnergy;
      const maxEnergyDelivered = maxEnergyAvailable * efficiency;
      const maxDuration = maxEnergyDelivered / effectivePower;
      
      return createErrorResponse(`Discharging would deplete below minimum SOC. Recommended duration: ${maxDuration.toFixed(2)} hours`, ErrorCode.BAD_REQUEST, 400);
    }

    // Calculate revenue
    const pricePerMWh = electricityPrice || 100; // Default $100/MWh (peak price)
    const revenue = actualEnergyDelivered * pricePerMWh;
    const revenuePerMWhStored = revenue / actualEnergyDischarged;

    // Calculate battery degradation (using model's degradation field)
    const degradationPercent = BATTERY_DEGRADATION_RATE[dischargingMode];
    const cycleDepth = (actualEnergyDischarged / capacity) * 100; // Percentage of full cycle
    const healthDegradation = degradationPercent * (cycleDepth / 100);
    const currentDegradation = storage.degradation ?? 0;
    const currentHealth = 100 - currentDegradation;
    const newBatteryHealth = Math.max(0, currentHealth - healthDegradation);

    // Calculate discharging timeline
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + actualDuration * 60 * 60 * 1000);

    // Calculate depth of discharge
    const depthOfDischarge = ((currentSOC - newSOC) / currentSOC) * 100;

    // Update storage system
    storage.currentCharge = newEnergyStored;

    // Save storage system
    await storage.save();

    // Log discharging action
    console.log(`[ENERGY] Storage discharging: ${storage.name} (${storage._id}), Mode: ${dischargingMode}, Power: ${effectivePower} MW, Duration: ${actualDuration.toFixed(2)}h, SOC: ${currentSOC}% → ${newSOC.toFixed(2)}%`);

    return createSuccessResponse({
      success: true,
      storage: {
        id: storage._id,
        name: storage.name,
        capacity: capacity + ' MWh',
        maxDischargeRate: maxPower + ' MW',
        currentPower: -effectivePower + ' MW',
        lastDischargeDate: startTime
      },
      discharging: {
        mode: dischargingMode,
        requestedPower: dischargePower + ' MW',
        effectivePower: effectivePower + ' MW',
        powerReduction: powerReductionApplied ? '30% (critical SOC)' : 'None',
        dischargeRate: ((effectivePower / maxPower) * 100).toFixed(2) + '% of max (C-rate: ' + (effectivePower / capacity).toFixed(2) + ')',
        duration: actualDuration.toFixed(2) + ' hours',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        efficiency: (efficiency * 100).toFixed(2) + '%'
      },
      energy: {
        previousSOC: currentSOC + '%',
        newSOC: newSOC.toFixed(2) + '%',
        socDecrease: (currentSOC - newSOC).toFixed(2) + '%',
        depthOfDischarge: depthOfDischarge.toFixed(2) + '%',
        energyFromBattery: actualEnergyDischarged.toFixed(2) + ' MWh',
        energyDelivered: actualEnergyDelivered.toFixed(2) + ' MWh',
        energyLoss: (actualEnergyDischarged - actualEnergyDelivered).toFixed(2) + ' MWh',
        previousEnergy: currentEnergyStored.toFixed(2) + ' MWh',
        newEnergy: newEnergyStored.toFixed(2) + ' MWh',
        remainingEnergy: newEnergyStored.toFixed(2) + ' MWh'
      },
      economics: {
        electricityPrice: '$' + pricePerMWh.toFixed(2) + '/MWh',
        totalRevenue: '$' + revenue.toFixed(2),
        revenuePerMWhStored: '$' + revenuePerMWhStored.toFixed(2) + '/MWh',
        energyValue: '$' + (actualEnergyDischarged * pricePerMWh).toFixed(2) + ' (stored energy value)',
        conversionLoss: '$' + ((actualEnergyDischarged - actualEnergyDelivered) * pricePerMWh).toFixed(2),
        revenuePerHour: '$' + (revenue / actualDuration).toFixed(2) + '/hour'
      },
      battery: {
        previousHealth: currentHealth.toFixed(2) + '%',
        newHealth: newBatteryHealth.toFixed(2) + '%',
        degradation: healthDegradation.toFixed(4) + '%',
        cycleDepth: cycleDepth.toFixed(2) + '%',
        estimatedCyclesRemaining: Math.floor((newBatteryHealth - 80) / degradationPercent), // Assume 80% EOL
        criticalSOCWarning: newSOC < CRITICAL_SOC_THRESHOLD ? 'WARNING: SOC below critical threshold' : 'Normal'
      }
    });

  } catch (error) {
    console.error('[ENERGY] Storage discharging error:', error);
    return createErrorResponse('Failed to discharge storage system', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Discharging Modes:
 *    - FAST: 1C rate (100% power), 88% efficiency, high degradation (emergency/peak response)
 *    - NORMAL: 0.6C rate (60% power), 94% efficiency, moderate degradation (standard operation)
 *    - SUSTAINED: 0.3C rate (30% power), 96% efficiency, minimal degradation (long-duration discharge)
 *    - OPTIMIZED: 0.8C rate (80% power), 95% efficiency, low degradation (smart discharging)
 * 
 * 2. State of Charge (SOC) Protection:
 *    - Minimum SOC: 10% (default, preserves battery health)
 *    - Critical SOC threshold: 15% (power output reduced to 70%)
 *    - Depth of discharge (DOD): Tracked for cycle life estimation
 *    - Prevents over-discharge below minimum SOC
 * 
 * 3. Battery Degradation:
 *    - Degradation per cycle: 0.05-0.25% depending on discharge mode
 *    - Faster discharging accelerates degradation
 *    - Cycle depth affects degradation (shallow cycles extend life)
 *    - End-of-life (EOL) assumed at 80% health
 * 
 * 4. Economics:
 *    - Revenue calculated at current market price
 *    - Revenue per MWh stored accounts for round-trip efficiency
 *    - Conversion losses tracked (stored energy - delivered energy)
 *    - Hourly revenue rate calculated for arbitrage analysis
 * 
 * 5. Future Enhancements:
 *    - Dynamic pricing integration for optimized arbitrage
 *    - Frequency regulation services during discharging
 *    - Temperature-dependent efficiency modeling
 *    - Voltage sag compensation during discharge
 *    - Smart discharging schedules based on price forecasts
 *    - Integration with demand response programs
 */
