/**
 * @file POST /api/energy/storage/[id]/charge
 * @description Charge energy storage system - battery charging operations
 * @timestamp 2025-11-28
 * @author ECHO v1.3.1
 * 
 * OVERVIEW:
 * Handles battery charging operations including charge rate control, state of charge management,
 * and charging optimization based on grid conditions and electricity prices.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB as dbConnect } from '@/lib/db';
import { EnergyStorage as Storage } from '@/lib/db/models';
import { auth } from '@/auth';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ChargeStorageSchema = z.object({
  chargePower: z.number().min(0).describe('Charge power in MW'),
  duration: z.number().min(0.25).max(24).describe('Charging duration in hours'),
  electricityPrice: z.number().min(0).max(500).optional().describe('Current electricity price $/MWh'),
  chargingMode: z.enum(['FAST', 'NORMAL', 'TRICKLE', 'OPTIMIZED']).optional().default('NORMAL').describe('Charging mode'),
  targetSOC: z.number().min(0).max(100).optional().describe('Target state of charge percentage')
});

type ChargeStorageInput = z.infer<typeof ChargeStorageSchema>;

// ============================================================================
// CONSTANTS
// ============================================================================

const CHARGING_EFFICIENCY = {
  FAST: 0.85,      // 85% efficiency (high losses from heat)
  NORMAL: 0.92,    // 92% efficiency (balanced)
  TRICKLE: 0.95,   // 95% efficiency (slow, minimal losses)
  OPTIMIZED: 0.93  // 93% efficiency (smart charging)
};

const MAX_CHARGE_RATE = {
  FAST: 1.0,       // 100% of rated power (1C rate)
  NORMAL: 0.5,     // 50% of rated power (0.5C rate)
  TRICKLE: 0.2,    // 20% of rated power (0.2C rate)
  OPTIMIZED: 0.7   // 70% of rated power (variable)
};

const BATTERY_DEGRADATION_RATE = {
  FAST: 0.002,     // 0.2% per cycle (fast charging accelerates degradation)
  NORMAL: 0.001,   // 0.1% per cycle
  TRICKLE: 0.0005, // 0.05% per cycle (gentle on battery)
  OPTIMIZED: 0.0008 // 0.08% per cycle
};

const MIN_SOC = 10; // Minimum 10% SOC to preserve battery health
const MAX_SOC = 95; // Maximum 95% SOC to preserve battery health

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const validation = ChargeStorageSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { chargePower, duration, electricityPrice, chargingMode, targetSOC } = validation.data;

    // Database connection
    await dbConnect();

    // Find storage system
    const storage = await Storage.findOne({
      _id: id,
      company: session.user.companyId
    });

    if (!storage) {
      return NextResponse.json(
        { error: 'Storage system not found or access denied' },
        { status: 404 }
      );
    }

    // Validate storage is not already charging (legacy flag not in model)
    if ((storage as any).isCharging) {
      return NextResponse.json(
        { error: 'Storage system is already charging' },
        { status: 400 }
      );
    }

    // Get storage parameters
    const capacity = storage.totalCapacity || 100; // MWh
    const maxPower = storage.maxChargeRate || 50; // MW
    const currentSOC = Math.round(((storage.currentCharge || 0) / capacity) * 100); // %
    const currentEnergyStored = storage.currentCharge || 0; // MWh

    // Validate charge power within limits
    const maxAllowedPower = maxPower * MAX_CHARGE_RATE[chargingMode];
    if (chargePower > maxAllowedPower) {
      return NextResponse.json(
        { error: `Charge power ${chargePower} MW exceeds maximum allowed ${maxAllowedPower.toFixed(2)} MW for ${chargingMode} mode` },
        { status: 400 }
      );
    }

    // Calculate charging efficiency and energy delivered
    const efficiency = CHARGING_EFFICIENCY[chargingMode];
    const energyInput = chargePower * duration; // MWh (grid consumption)
    const energyStored = energyInput * efficiency; // MWh (actual stored after losses)

    // Calculate new SOC
    const newEnergyStored = Math.min(currentEnergyStored + energyStored, capacity * (MAX_SOC / 100));
    const newSOC = (newEnergyStored / capacity) * 100;
    const actualEnergyStored = newEnergyStored - currentEnergyStored;
    const actualDuration = actualEnergyStored / (chargePower * efficiency);

    // Check if target SOC would be exceeded
    if (targetSOC && newSOC > targetSOC) {
      const targetEnergyStored = (targetSOC / 100) * capacity;
      const energyNeeded = targetEnergyStored - currentEnergyStored;
      const adjustedDuration = energyNeeded / (chargePower * efficiency);
      
      return NextResponse.json({
        warning: 'Charging would exceed target SOC',
        recommended: {
          duration: adjustedDuration.toFixed(2) + ' hours',
          energyInput: (chargePower * adjustedDuration).toFixed(2) + ' MWh',
          finalSOC: targetSOC + '%'
        }
      }, { status: 400 });
    }

    // Calculate costs
    const pricePerMWh = electricityPrice || 50; // Default $50/MWh
    const electricityCost = energyInput * pricePerMWh;
    const costPerMWhStored = electricityCost / actualEnergyStored;

    // Calculate battery degradation
    const degradationPercent = BATTERY_DEGRADATION_RATE[chargingMode];
    const cycleDepth = (actualEnergyStored / capacity) * 100; // Percentage of full cycle
    const healthDegradation = degradationPercent * (cycleDepth / 100);
    const newBatteryHealth = Math.max(0, ((storage as any).batteryHealth || 100) - healthDegradation);

    // Calculate charging timeline
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + actualDuration * 60 * 60 * 1000);

    // Update storage system
    storage.currentCharge = newEnergyStored;
    // Derived fields only in response, not persisted in model

    // Save storage system
    await storage.save();

    // Log charging action
    console.log(`[ENERGY] Storage charging: ${storage.name} (${storage._id}), Mode: ${chargingMode}, Power: ${chargePower} MW, Duration: ${actualDuration.toFixed(2)}h, SOC: ${currentSOC}% → ${newSOC.toFixed(2)}%`);

    return NextResponse.json({
      success: true,
      storage: {
        id: storage._id,
        name: storage.name,
        capacity: capacity + ' MWh',
        maxChargeRate: maxPower + ' MW',
        currentPower: chargePower + ' MW',
        lastChargeDate: startTime
      },
      charging: {
        mode: chargingMode,
        chargePower: chargePower + ' MW',
        chargeRate: ((chargePower / maxPower) * 100).toFixed(2) + '% of max (C-rate: ' + (chargePower / capacity).toFixed(2) + ')',
        duration: actualDuration.toFixed(2) + ' hours',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        efficiency: (efficiency * 100).toFixed(2) + '%'
      },
      energy: {
        previousSOC: currentSOC + '%',
        newSOC: newSOC.toFixed(2) + '%',
        socIncrease: (newSOC - currentSOC).toFixed(2) + '%',
        energyInput: energyInput.toFixed(2) + ' MWh',
        energyStored: actualEnergyStored.toFixed(2) + ' MWh',
        energyLoss: (energyInput - actualEnergyStored).toFixed(2) + ' MWh',
        previousEnergy: currentEnergyStored.toFixed(2) + ' MWh',
        newEnergy: newEnergyStored.toFixed(2) + ' MWh'
      },
      economics: {
        electricityPrice: '$' + pricePerMWh.toFixed(2) + '/MWh',
        totalCost: '$' + electricityCost.toFixed(2),
        costPerMWhStored: '$' + costPerMWhStored.toFixed(2) + '/MWh',
        energyValue: '$' + (actualEnergyStored * pricePerMWh).toFixed(2) + ' (at current price)',
        roundTripLoss: '$' + ((energyInput - actualEnergyStored) * pricePerMWh).toFixed(2)
      },
      battery: {
        previousHealth: (((storage as any).batteryHealth || 100)) + '%',
        newHealth: newBatteryHealth.toFixed(2) + '%',
        degradation: healthDegradation.toFixed(4) + '%',
        cycleDepth: cycleDepth.toFixed(2) + '%',
        estimatedCyclesRemaining: Math.floor((newBatteryHealth - 80) / degradationPercent) // Assume 80% EOL
      }
    });

  } catch (error) {
    console.error('[ENERGY] Storage charging error:', error);
    return NextResponse.json(
      { error: 'Failed to charge storage system', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Charging Modes:
 *    - FAST: 1C rate (100% power), 85% efficiency, high degradation (emergency/peak shaving)
 *    - NORMAL: 0.5C rate (50% power), 92% efficiency, moderate degradation (standard operation)
 *    - TRICKLE: 0.2C rate (20% power), 95% efficiency, minimal degradation (overnight charging)
 *    - OPTIMIZED: 0.7C rate (70% power), 93% efficiency, low degradation (smart charging)
 * 
 * 2. State of Charge (SOC) Management:
 *    - Operating window: 10-95% SOC (preserves battery health)
 *    - Target SOC validation prevents overcharging
 *    - SOC calculated from energy stored vs capacity
 * 
 * 3. Battery Degradation:
 *    - Degradation per cycle: 0.05-0.2% depending on charge mode
 *    - Faster charging accelerates degradation
 *    - Cycle depth affects degradation (partial cycles extend life)
 *    - End-of-life (EOL) assumed at 80% health
 * 
 * 4. Economics:
 *    - Electricity cost tracked at current market price
 *    - Cost per MWh stored accounts for efficiency losses
 *    - Round-trip losses calculated (grid input - stored energy)
 *    - Energy value estimated for arbitrage opportunities
 * 
 * 5. Future Enhancements:
 *    - Dynamic pricing integration for optimized charging
 *    - Temperature-dependent efficiency modeling
 *    - Degradation curve refinement based on battery chemistry
 *    - Frequency regulation services during charging
 *    - Smart charging schedules based on renewable forecast
 */
