/**
 * @file POST /api/energy/transmission-lines/[id]/transfer
 * @description Transfer power through transmission line - power flow control
 * @timestamp 2025-11-28
 * @author ECHO v1.3.1
 * 
 * OVERVIEW:
 * Handles power transfer operations through transmission lines including flow control,
 * thermal limits, and transmission loss calculations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB as dbConnect } from '@/lib/db';
import { TransmissionLine } from '@/lib/db/models';
import { auth } from '@/auth';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const TransferPowerSchema = z.object({
  transferPower: z.number().describe('Power to transfer in MW (positive = forward, negative = reverse)'),
  duration: z.number().min(0.25).max(168).describe('Transfer duration in hours'),
  priority: z.enum(['CRITICAL', 'HIGH', 'NORMAL', 'LOW']).optional().default('NORMAL').describe('Transfer priority'),
  allowOverload: z.boolean().optional().default(false).describe('Allow temporary overload (reduces line life)')
});

type TransferPowerInput = z.infer<typeof TransferPowerSchema>;

// ============================================================================
// CONSTANTS
// ============================================================================

const TRANSMISSION_LOSS_RATE = {
  '69kV': 0.05,    // 5% losses (distribution voltage)
  '138kV': 0.03,   // 3% losses (sub-transmission)
  '230kV': 0.02,   // 2% losses (transmission)
  '345kV': 0.015,  // 1.5% losses (high voltage)
  '500kV': 0.01,   // 1% losses (extra high voltage)
  '765kV': 0.008   // 0.8% losses (ultra high voltage)
};

const OVERLOAD_LIMIT_MULTIPLIER = 1.15; // 115% of rated capacity (emergency)
const OVERLOAD_DEGRADATION_RATE = 0.01; // 1% condition loss per hour of overload
const NORMAL_DEGRADATION_RATE = 0.0001; // 0.01% condition loss per hour normal operation

const THERMAL_LIMIT_FACTOR = {
  CRITICAL: 1.15, // 115% of rating (emergency)
  HIGH: 1.05,     // 105% of rating
  NORMAL: 1.0,    // 100% of rating
  LOW: 0.85       // 85% of rating (conservative)
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const validation = TransferPowerSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { transferPower, duration, priority, allowOverload } = validation.data;

    // Database connection
    await dbConnect();

    // Find transmission line
    const line = await TransmissionLine.findOne({
      _id: id,
      company: session.user.companyId
    });

    if (!line) {
      return NextResponse.json(
        { error: 'Transmission line not found or access denied' },
        { status: 404 }
      );
    }

    // Get line parameters
    const capacity = line.capacity || 500; // MW
    const voltage = line.voltageLevel || '230kV';
    const length = line.lengthMiles || 100; // miles
    const currentCondition = 100; // % (no condition field in model)

    // Determine thermal limit based on priority
    const thermalLimit = capacity * THERMAL_LIMIT_FACTOR[priority];
    const absolutePower = Math.abs(transferPower);

    // Check if power exceeds thermal limit
    if (absolutePower > thermalLimit && !allowOverload) {
      return NextResponse.json(
        { error: `Transfer power ${absolutePower} MW exceeds thermal limit ${thermalLimit.toFixed(2)} MW for ${priority} priority. Set allowOverload=true to override.` },
        { status: 400 }
      );
    }

    // Check if power exceeds emergency limit
    const emergencyLimit = capacity * OVERLOAD_LIMIT_MULTIPLIER;
    if (absolutePower > emergencyLimit) {
      return NextResponse.json(
        { error: `Transfer power ${absolutePower} MW exceeds emergency limit ${emergencyLimit.toFixed(2)} MW (115% of capacity)` },
        { status: 400 }
      );
    }

    // Determine if overload condition exists
    const isOverload = absolutePower > capacity;
    const overloadPercent = isOverload ? ((absolutePower - capacity) / capacity) * 100 : 0;

    // Calculate transmission losses based on voltage level
    const lossRate = TRANSMISSION_LOSS_RATE[voltage as keyof typeof TRANSMISSION_LOSS_RATE] || 0.02;
    
    // Losses scale with distance and square of current (P_loss = I²R)
    // Simplified: loss = base_rate × (power/capacity)² × (length/100km)
    const loadFactor = absolutePower / capacity;
    const distanceFactor = length / 100;
    const actualLossRate = lossRate * Math.pow(loadFactor, 2) * distanceFactor;
    
    const powerLoss = absolutePower * actualLossRate; // MW
    const deliveredPower = absolutePower - powerLoss; // MW
    const energyTransferred = absolutePower * duration; // MWh
    const energyLoss = powerLoss * duration; // MWh
    const energyDelivered = deliveredPower * duration; // MWh

    // Calculate line degradation
    const degradationRate = isOverload ? OVERLOAD_DEGRADATION_RATE : NORMAL_DEGRADATION_RATE;
    const conditionLoss = degradationRate * duration * (isOverload ? (1 + overloadPercent / 100) : 1);
    const newCondition = Math.max(0, currentCondition - conditionLoss);

    // Calculate thermal heating
    const ambientTemp = 25; // °C
    const thermalResistance = 10; // °C per MW (simplified)
    const temperatureRise = absolutePower * thermalResistance * loadFactor;
    const conductorTemp = ambientTemp + temperatureRise;
    const maxSafeTemp = 90; // °C (typical for ACSR conductor)
    const temperatureMargin = maxSafeTemp - conductorTemp;

    // Calculate economics
    const transmissionCostPerMWh = 5; // $5/MWh typical wheeling charge
    const lossCostPerMWh = 75; // $75/MWh cost of energy losses
    const transmissionCost = energyTransferred * transmissionCostPerMWh;
    const lossCost = energyLoss * lossCostPerMWh;
    const totalCost = transmissionCost + lossCost;

    // Update transmission line
    line.currentLoad = transferPower; // Positive or negative
    // Model does not track condition/totalEnergyTransferred timestamps; update load only

    // Save transmission line
    await line.save();

    // Log transfer action
    console.log(`[ENERGY] Transmission transfer: ${line.name} (${line._id}), Power: ${transferPower} MW, Duration: ${duration}h, Loss: ${powerLoss.toFixed(2)} MW (${(actualLossRate * 100).toFixed(2)}%)`);

    return NextResponse.json({
      success: true,
      transmissionLine: {
        id: line._id,
        name: line.name,
        voltage,
        capacity: capacity + ' MW',
        length: length + ' km',
        currentLoad: line.currentLoad + ' MW',
        condition: newCondition.toFixed(2) + '%',
        // model does not include transfer timestamp
      },
      transfer: {
        transferPower: transferPower + ' MW',
        direction: transferPower >= 0 ? 'FORWARD' : 'REVERSE',
        absolutePower: absolutePower + ' MW',
        duration: duration + ' hours',
        priority,
        utilizationPercent: ((absolutePower / capacity) * 100).toFixed(2) + '%',
        isOverload,
        overloadPercent: isOverload ? overloadPercent.toFixed(2) + '%' : 'None'
      },
      thermalLimits: {
        ratedCapacity: capacity + ' MW',
        thermalLimit: thermalLimit.toFixed(2) + ' MW',
        emergencyLimit: emergencyLimit.toFixed(2) + ' MW',
        currentLoad: ((absolutePower / capacity) * 100).toFixed(2) + '% of rated',
        conductorTemp: conductorTemp.toFixed(1) + '°C',
        maxSafeTemp: maxSafeTemp + '°C',
        temperatureMargin: temperatureMargin.toFixed(1) + '°C',
        thermalStatus: conductorTemp > maxSafeTemp ? 'CRITICAL' : conductorTemp > maxSafeTemp * 0.9 ? 'WARNING' : 'NORMAL'
      },
      losses: {
        voltage,
        baseLossRate: (lossRate * 100).toFixed(2) + '%',
        actualLossRate: (actualLossRate * 100).toFixed(4) + '%',
        powerLoss: powerLoss.toFixed(2) + ' MW',
        deliveredPower: deliveredPower.toFixed(2) + ' MW',
        efficiency: ((deliveredPower / absolutePower) * 100).toFixed(2) + '%',
        energyTransferred: energyTransferred.toFixed(2) + ' MWh',
        energyLoss: energyLoss.toFixed(2) + ' MWh',
        energyDelivered: energyDelivered.toFixed(2) + ' MWh'
      },
      condition: {
        previousCondition: currentCondition.toFixed(2) + '%',
        newCondition: newCondition.toFixed(2) + '%',
        degradation: conditionLoss.toFixed(4) + '%',
        degradationRate: (degradationRate * 100).toFixed(4) + '% per hour',
        estimatedLifeRemaining: Math.floor((newCondition - 60) / (degradationRate * 8760)) + ' years' // 60% = end of life
      },
      economics: {
        wheelingCharge: '$' + transmissionCostPerMWh.toFixed(2) + '/MWh',
        transmissionCost: '$' + transmissionCost.toFixed(2),
        lossCost: '$' + lossCost.toFixed(2),
        totalCost: '$' + totalCost.toFixed(2),
        costPerMWh: '$' + (totalCost / energyDelivered).toFixed(2) + '/MWh delivered'
      }
    });

  } catch (error) {
    console.error('[ENERGY] Transmission transfer error:', error);
    return NextResponse.json(
      { error: 'Failed to transfer power', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Power Flow Control:
 *    - Bidirectional flow: positive = forward, negative = reverse
 *    - Thermal limits based on priority (85-115% of rated capacity)
 *    - Overload protection: maximum 115% emergency limit
 *    - Load factor = (actual power / capacity)
 * 
 * 2. Transmission Losses:
 *    - Voltage-dependent: 0.8-5% base loss rate (higher voltage = lower losses)
 *    - Distance scaling: Losses proportional to line length
 *    - Current-squared losses: Loss ∝ (power/capacity)² (I²R relationship)
 *    - Example: 230kV, 100km, full load = ~2% losses
 * 
 * 3. Thermal Management:
 *    - Conductor temperature = ambient + (power × thermal resistance × load factor)
 *    - Maximum safe temperature: 90°C (typical ACSR conductor)
 *    - Temperature margin tracked for overload protection
 *    - Thermal status: NORMAL / WARNING / CRITICAL
 * 
 * 4. Line Degradation:
 *    - Normal operation: 0.01% condition loss per hour
 *    - Overload operation: 1% condition loss per hour (100x faster!)
 *    - Degradation accelerates with overload severity
 *    - End-of-life: 60% condition (requires replacement)
 * 
 * 5. Future Enhancements:
 *    - Real-time sag calculations based on temperature
 *    - Dynamic thermal rating (DTR) based on weather
 *    - Reactive power flow and voltage support
 *    - Power flow optimization (economic dispatch)
 *    - Contingency analysis (N-1 reliability)
 */
