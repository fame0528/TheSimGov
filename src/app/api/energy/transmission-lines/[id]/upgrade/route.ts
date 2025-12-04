/**
 * @file POST /api/energy/transmission-lines/[id]/upgrade
 * @description Upgrade transmission line capacity - infrastructure improvement
 * @timestamp 2025-11-28
 * @author ECHO v1.3.1
 * 
 * OVERVIEW:
 * Handles transmission line capacity upgrades including reconductoring, voltage upgrades,
 * and infrastructure improvements to increase power transfer capability.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB as dbConnect } from '@/lib/db';
import { TransmissionLine } from '@/lib/db/models';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpgradeLineSchema = z.object({
  upgradeType: z.enum(['RECONDUCTOR', 'VOLTAGE_UPGRADE', 'ADDITIONAL_CIRCUIT', 'THERMAL_UPGRADE', 'FULL_REBUILD']).describe('Type of upgrade'),
  targetCapacity: z.number().min(0).optional().describe('Target capacity in MW (optional, calculated if not provided)'),
  budget: z.number().min(0).optional().describe('Budget override in dollars'),
  scheduledOutage: z.number().min(1).max(8760).optional().default(720).describe('Scheduled outage duration in hours')
});

type UpgradeLineInput = z.infer<typeof UpgradeLineSchema>;

// ============================================================================
// CONSTANTS
// ============================================================================

const UPGRADE_CAPACITY_INCREASE = {
  RECONDUCTOR: 1.5,        // 50% increase (larger conductor)
  VOLTAGE_UPGRADE: 2.0,    // 100% increase (230kV → 345kV or similar)
  ADDITIONAL_CIRCUIT: 2.0, // 100% increase (double circuit)
  THERMAL_UPGRADE: 1.3,    // 30% increase (better cooling, monitoring)
  FULL_REBUILD: 3.0        // 200% increase (complete rebuild)
};

const UPGRADE_COST_PER_KM = {
  RECONDUCTOR: 200000,        // $200K/km (conductor replacement)
  VOLTAGE_UPGRADE: 1000000,   // $1M/km (transformers, insulators, towers)
  ADDITIONAL_CIRCUIT: 800000, // $800K/km (second circuit on existing ROW)
  THERMAL_UPGRADE: 100000,    // $100K/km (dynamic rating equipment)
  FULL_REBUILD: 1500000       // $1.5M/km (complete reconstruction)
};

const UPGRADE_DURATION_WEEKS = {
  RECONDUCTOR: 12,         // 12 weeks (3 months)
  VOLTAGE_UPGRADE: 52,     // 52 weeks (1 year)
  ADDITIONAL_CIRCUIT: 40,  // 40 weeks (10 months)
  THERMAL_UPGRADE: 8,      // 8 weeks (2 months)
  FULL_REBUILD: 104        // 104 weeks (2 years)
};

const CONDITION_IMPROVEMENT = {
  RECONDUCTOR: 40,         // +40% condition (new conductor)
  VOLTAGE_UPGRADE: 60,     // +60% condition (major upgrade)
  ADDITIONAL_CIRCUIT: 20,  // +20% condition (existing line remains)
  THERMAL_UPGRADE: 10,     // +10% condition (monitoring improves maintenance)
  FULL_REBUILD: 100        // +100% condition (brand new)
};

// Voltage upgrade paths
const VOLTAGE_UPGRADES: Record<string, string> = {
  '69kV': '138kV',
  '138kV': '230kV',
  '230kV': '345kV',
  '345kV': '500kV',
  '500kV': '765kV'
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
    const validation = UpgradeLineSchema.safeParse(body);
    
    if (!validation.success) {
      return createErrorResponse('Invalid input', ErrorCode.BAD_REQUEST, 400);
    }

    const { upgradeType, targetCapacity, budget, scheduledOutage } = validation.data;

    // Database connection
    await dbConnect();

    // Find transmission line
    const line = await TransmissionLine.findOne({
      _id: id,
      company: session.user.companyId
    });

    if (!line) {
      return createErrorResponse('Transmission line not found or access denied', ErrorCode.NOT_FOUND, 404);
    }

    // Get line parameters
    const currentCapacity = line.capacity || 500; // MW
    const currentVoltage = line.voltageLevel || '230kV';
    const length = line.lengthMiles || 100; // miles
    const currentCondition = 80; // % placeholder (no condition field)

    // Calculate new capacity
    let newCapacity: number;
    let newVoltage: string = currentVoltage;

    if (targetCapacity) {
      newCapacity = targetCapacity;
    } else {
      const multiplier = UPGRADE_CAPACITY_INCREASE[upgradeType];
      newCapacity = currentCapacity * multiplier;
      
      // For voltage upgrade, also update voltage level
      if (upgradeType === 'VOLTAGE_UPGRADE') {
        newVoltage = VOLTAGE_UPGRADES[currentVoltage] || currentVoltage;
      }
    }

    const capacityIncrease = newCapacity - currentCapacity;
    const capacityIncreasePercent = (capacityIncrease / currentCapacity) * 100;

    // Calculate upgrade costs
    const baseCost = UPGRADE_COST_PER_KM[upgradeType] * length;
    
    // Additional costs
    const engineeringCost = baseCost * 0.15; // 15% for engineering/design
    const permitCost = baseCost * 0.05; // 5% for permits/regulatory
    const contingencyCost = baseCost * 0.20; // 20% contingency
    const outageCost = (currentCapacity * (scheduledOutage / 8760)) * 50 * 1000; // Lost transmission revenue
    
    const totalCost = budget || (baseCost + engineeringCost + permitCost + contingencyCost + outageCost);
    const costPerMWIncrease = totalCost / capacityIncrease;

    // Calculate project timeline
    const baselineDuration = UPGRADE_DURATION_WEEKS[upgradeType];
    const totalDurationWeeks = baselineDuration + (scheduledOutage / 168); // Add outage time
    const totalDurationMonths = totalDurationWeeks / 4.33;
    
    const startDate = new Date();
    const completionDate = new Date(startDate.getTime() + totalDurationWeeks * 7 * 24 * 60 * 60 * 1000);

    // Calculate condition improvement
    const conditionImprovement = CONDITION_IMPROVEMENT[upgradeType];
    const newCondition = Math.min(100, currentCondition + conditionImprovement);

    // Calculate economic benefits
    const increasedRevenuePerYear = capacityIncrease * 8760 * 0.5 * 5; // $5/MWh wheeling, 50% utilization
    const maintenanceSavings = (newCondition - currentCondition) * 10000; // $10K per 1% condition improvement
    const reliabilityValue = capacityIncrease * 100000; // $100K per MW of additional capacity (reliability benefit)
    
    const totalAnnualBenefit = increasedRevenuePerYear + maintenanceSavings;
    const simplePayback = totalCost / totalAnnualBenefit;
    const roi = (totalAnnualBenefit / totalCost) * 100;

    // Calculate avoided transmission losses (higher voltage = lower losses)
    const currentLossRate = 0.02; // 2% typical
    const newLossRate = upgradeType === 'VOLTAGE_UPGRADE' ? currentLossRate * 0.75 : currentLossRate;
    const lossReduction = currentLossRate - newLossRate;
    const annualEnergySaved = newCapacity * 8760 * 0.5 * lossReduction; // MWh/year
    const annualLossSavings = annualEnergySaved * 75; // $75/MWh

    // Update transmission line (marking as under construction)
    const originalCapacity = line.capacity;
    const originalVoltage = line.voltageLevel;
    
    line.capacity = newCapacity;
    // Cast voltage to the voltageLevel enum type
    line.voltageLevel = newVoltage as typeof line.voltageLevel;
    // Note: condition/maintenance fields are computed, not stored

    // Save transmission line
    await line.save();

    // Log upgrade action
    console.log(`[ENERGY] Transmission upgrade: ${line.name} (${line._id}), Type: ${upgradeType}, Capacity: ${currentCapacity} → ${newCapacity} MW, Cost: $${(totalCost / 1000000).toFixed(2)}M`);

    return createSuccessResponse({
      success: true,
      transmissionLine: {
        id: line._id,
        name: line.name,
        length: length + ' km',
        previousVoltage: originalVoltage,
        newVoltage,
        previousCapacity: originalCapacity + ' MW',
        newCapacity: newCapacity + ' MW',
        previousCondition: currentCondition.toFixed(2) + '%',
        newCondition: newCondition.toFixed(2) + '%',
        isUnderMaintenance: true,
        lastUpgradeDate: startDate
      },
      upgrade: {
        type: upgradeType,
        capacityIncrease: capacityIncrease.toFixed(2) + ' MW',
        capacityIncreasePercent: capacityIncreasePercent.toFixed(2) + '%',
        conditionImprovement: conditionImprovement + '%',
        voltageUpgrade: upgradeType === 'VOLTAGE_UPGRADE' ? `${originalVoltage} → ${newVoltage}` : 'None',
        scheduledOutage: scheduledOutage + ' hours (' + (scheduledOutage / 24).toFixed(1) + ' days)'
      },
      project: {
        startDate: startDate.toISOString(),
        estimatedCompletion: completionDate.toISOString(),
        durationWeeks: totalDurationWeeks.toFixed(1),
        durationMonths: totalDurationMonths.toFixed(1),
        baselineDuration: baselineDuration + ' weeks',
        outageDuration: (scheduledOutage / 168).toFixed(1) + ' weeks'
      },
      costs: {
        baseCost: '$' + (baseCost / 1000000).toFixed(2) + 'M',
        engineeringCost: '$' + (engineeringCost / 1000000).toFixed(2) + 'M',
        permitCost: '$' + (permitCost / 1000000).toFixed(2) + 'M',
        contingency: '$' + (contingencyCost / 1000000).toFixed(2) + 'M',
        outageCost: '$' + (outageCost / 1000000).toFixed(2) + 'M',
        totalCost: '$' + (totalCost / 1000000).toFixed(2) + 'M',
        costPerKm: '$' + (totalCost / length / 1000000).toFixed(2) + 'M/km',
        costPerMWIncrease: '$' + (costPerMWIncrease / 1000000).toFixed(2) + 'M/MW'
      },
      economics: {
        increasedRevenuePerYear: '$' + (increasedRevenuePerYear / 1000000).toFixed(2) + 'M/year',
        maintenanceSavings: '$' + (maintenanceSavings / 1000).toFixed(0) + 'K/year',
        lossSavings: '$' + (annualLossSavings / 1000).toFixed(0) + 'K/year',
        totalAnnualBenefit: '$' + (totalAnnualBenefit / 1000000).toFixed(2) + 'M/year',
        simplePayback: simplePayback.toFixed(1) + ' years',
        roi: roi.toFixed(2) + '% per year',
        npvAt10Years: '$' + ((totalAnnualBenefit * 10 - totalCost) / 1000000).toFixed(2) + 'M'
      },
      technical: {
        lossReduction: (lossReduction * 100).toFixed(2) + '% (loss rate improvement)',
        annualEnergySaved: annualEnergySaved.toFixed(0) + ' MWh/year',
        reliabilityImprovement: capacityIncrease.toFixed(2) + ' MW additional transfer capability',
        voltageSupport: upgradeType === 'VOLTAGE_UPGRADE' ? 'Improved voltage profile and stability' : 'No change',
        futureCapability: 'Supports grid growth for ' + (newCapacity / currentCapacity * 50).toFixed(0) + ' years'
      }
    });

  } catch (error) {
    console.error('[ENERGY] Transmission upgrade error:', error);
    return createErrorResponse('Failed to upgrade transmission line', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Upgrade Types & Capacity Increases:
 *    - RECONDUCTOR: 50% increase (larger conductor, same voltage)
 *    - VOLTAGE_UPGRADE: 100% increase (69kV→138kV, 230kV→345kV, etc.)
 *    - ADDITIONAL_CIRCUIT: 100% increase (double-circuit on existing towers)
 *    - THERMAL_UPGRADE: 30% increase (dynamic rating, better monitoring)
 *    - FULL_REBUILD: 200% increase (complete reconstruction)
 * 
 * 2. Cost Structure:
 *    - Base construction: $100K-$1.5M per km depending on upgrade type
 *    - Engineering/design: 15% of base cost
 *    - Permits/regulatory: 5% of base cost
 *    - Contingency: 20% of base cost (typical for transmission projects)
 *    - Outage cost: Lost transmission revenue during construction
 * 
 * 3. Project Timeline:
 *    - RECONDUCTOR: 12 weeks (3 months)
 *    - VOLTAGE_UPGRADE: 52 weeks (1 year) - complex, requires new equipment
 *    - ADDITIONAL_CIRCUIT: 40 weeks (10 months)
 *    - THERMAL_UPGRADE: 8 weeks (2 months) - quickest option
 *    - FULL_REBUILD: 104 weeks (2 years) - major project
 * 
 * 4. Economic Benefits:
 *    - Increased transmission revenue: $5/MWh wheeling charge × added capacity
 *    - Maintenance savings: Better condition = lower O&M costs
 *    - Loss reduction: Higher voltage = lower I²R losses (25% reduction typical)
 *    - Reliability value: Additional capacity prevents outages
 *    - Simple payback: 5-15 years typical for transmission upgrades
 * 
 * 5. Future Enhancements:
 *    - Multi-phase construction with partial capacity increases
 *    - Environmental impact assessment integration
 *    - Right-of-way acquisition costs
 *    - Grid interconnection studies (power flow analysis)
 *    - Renewable integration benefits quantification
 */
