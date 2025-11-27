/**
 * @fileoverview Grid Analytics API - Comprehensive Grid Analysis
 * 
 * OVERVIEW:
 * POST: Analyze complete grid infrastructure for stability, blackout risk, and capacity planning
 * Aggregates data from PowerPlants, TransmissionLines, GridNodes, and LoadProfiles
 * 
 * @created 2025-11-18
 * @updated 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import PowerPlant from '@/src/lib/db/models/PowerPlant';
import TransmissionLine from '@/src/lib/db/models/TransmissionLine';
import GridNode from '@/src/lib/db/models/GridNode';
import LoadProfile from '@/src/lib/db/models/LoadProfile';
import Company from '@/src/lib/db/models/Company';

// ================== POST HANDLER ==================

/**
 * POST /api/energy/grid/analytics
 * Comprehensive grid infrastructure analysis
 * 
 * Request Body:
 * - company: Company ID (required)
 * 
 * Response: { 
 *   generation, 
 *   demand, 
 *   gridStability, 
 *   blackoutRisk, 
 *   capacityPlanning, 
 *   recommendations,
 *   message 
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { company: companyId } = body;

    // Validate required fields
    if (!companyId) {
      return NextResponse.json(
        { error: 'Missing required field: company' },
        { status: 400 }
      );
    }

    // Verify company exists and user owns it
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this company' },
        { status: 403 }
      );
    }

    // ================== GENERATION ANALYSIS ==================

    const powerPlants = await PowerPlant.find({ company: companyId });
    
    const totalCapacityMW = powerPlants.reduce((sum, plant) => sum + plant.nameplateCapacity, 0);
    const totalGenerationMW = powerPlants.reduce((sum, plant) => sum + plant.currentOutput, 0);
    const capacityFactor = totalCapacityMW > 0 ? (totalGenerationMW / totalCapacityMW) * 100 : 0;
    
    const plantsByType = powerPlants.reduce((acc, plant) => {
      if (!acc[plant.plantType]) {
        acc[plant.plantType] = { count: 0, capacityMW: 0, outputMW: 0 };
      }
      acc[plant.plantType].count += 1;
      acc[plant.plantType].capacityMW += plant.nameplateCapacity;
      acc[plant.plantType].outputMW += plant.currentOutput;
      return acc;
    }, {} as Record<string, { count: number; capacityMW: number; outputMW: number }>);

    const generation = {
      totalPlants: powerPlants.length,
      totalCapacityMW: parseFloat(totalCapacityMW.toFixed(2)),
      totalGenerationMW: parseFloat(totalGenerationMW.toFixed(2)),
      capacityFactor: parseFloat(capacityFactor.toFixed(1)),
      plantsByType,
      averageEfficiency: powerPlants.length > 0 
        ? parseFloat((powerPlants.reduce((sum, p) => sum + p.currentEfficiency, 0) / powerPlants.length).toFixed(1))
        : 0,
    };

    // ================== DEMAND ANALYSIS ==================

    const loadProfiles = await LoadProfile.find({});
    
    const totalDemandMW = loadProfiles.reduce((sum, profile) => sum + profile.currentLoadMW, 0);
    const totalPeakDemandMW = loadProfiles.reduce((sum, profile) => sum + profile.peakLoadMW, 0);
    const totalDRCapacityMW = loadProfiles.reduce((sum, profile) => sum + profile.drEnrolledMW, 0);
    
    const demand = {
      totalProfiles: loadProfiles.length,
      totalDemandMW: parseFloat(totalDemandMW.toFixed(2)),
      totalPeakDemandMW: parseFloat(totalPeakDemandMW.toFixed(2)),
      totalDRCapacityMW: parseFloat(totalDRCapacityMW.toFixed(2)),
      demandCoverage: totalPeakDemandMW > 0 
        ? parseFloat(((totalCapacityMW / totalPeakDemandMW) * 100).toFixed(1))
        : 0,
    };

    // ================== GRID STABILITY ANALYSIS ==================

    const transmissionLines = await TransmissionLine.find({ company: companyId });
    const gridNodes = await GridNode.find({ company: companyId });

    // Calculate grid stability metrics
    const totalLineCapacityMW = transmissionLines.reduce((sum, line) => sum + line.baseCapacityMW, 0);
    const totalLineLoadMW = transmissionLines.reduce((sum, line) => sum + line.currentLoadMW, 0);
    const lineUtilization = totalLineCapacityMW > 0 
      ? (totalLineLoadMW / totalLineCapacityMW) * 100 
      : 0;

    // Voltage stability (count nodes in normal voltage range)
    const nodesInNormalVoltage = gridNodes.filter(node => {
      const deviation = Math.abs(node.currentVoltageKV - node.nominalVoltageKV);
      const percentDeviation = (deviation / node.nominalVoltageKV) * 100;
      return percentDeviation <= 5; // Within ±5%
    }).length;
    
    const voltageStability = gridNodes.length > 0 
      ? (nodesInNormalVoltage / gridNodes.length) * 100 
      : 0;

    // N-1 contingency compliance
    const n1CompliantNodes = gridNodes.filter(node => node.n1Contingency === true).length;
    const n1Compliance = gridNodes.length > 0 
      ? (n1CompliantNodes / gridNodes.length) * 100 
      : 0;

    const gridStability = {
      totalTransmissionLines: transmissionLines.length,
      totalGridNodes: gridNodes.length,
      lineUtilization: parseFloat(lineUtilization.toFixed(1)),
      voltageStability: parseFloat(voltageStability.toFixed(1)),
      n1Compliance: parseFloat(n1Compliance.toFixed(1)),
      stabilityScore: parseFloat(((voltageStability * 0.5 + n1Compliance * 0.3 + (100 - lineUtilization) * 0.2)).toFixed(1)),
    };

    // ================== BLACKOUT RISK ANALYSIS ==================

    // Calculate aggregate blackout risk
    const averageNodeBlackoutRisk = gridNodes.length > 0
      ? gridNodes.reduce((sum, node) => sum + node.blackoutRisk, 0) / gridNodes.length
      : 0;

    // Critical factors
    const overloadedLines = transmissionLines.filter(line => line.utilizationPercent > 90).length;
    const criticalVoltageNodes = gridNodes.filter(node => {
      const deviation = Math.abs(node.currentVoltageKV - node.nominalVoltageKV);
      const percentDeviation = (deviation / node.nominalVoltageKV) * 100;
      return percentDeviation > 10; // >10% deviation is critical
    }).length;
    
    const generationShortfallMW = Math.max(0, totalDemandMW - totalGenerationMW);
    const generationReserveMargin = totalCapacityMW > 0
      ? ((totalCapacityMW - totalDemandMW) / totalCapacityMW) * 100
      : 0;

    // Overall blackout risk (0-100 scale)
    let blackoutRiskScore = 0;
    blackoutRiskScore += averageNodeBlackoutRisk * 0.4; // 40% from node risk
    blackoutRiskScore += (overloadedLines / Math.max(1, transmissionLines.length)) * 40; // 40% from line overload
    blackoutRiskScore += (criticalVoltageNodes / Math.max(1, gridNodes.length)) * 20; // 20% from voltage issues
    
    if (generationReserveMargin < 15) {
      blackoutRiskScore += 10; // Add 10 if reserve margin < 15%
    }

    const blackoutRisk = {
      overallRisk: parseFloat(Math.min(100, blackoutRiskScore).toFixed(1)),
      riskLevel: blackoutRiskScore < 20 ? 'Low' : blackoutRiskScore < 50 ? 'Moderate' : blackoutRiskScore < 75 ? 'High' : 'Critical',
      generationShortfallMW: parseFloat(generationShortfallMW.toFixed(2)),
      generationReserveMargin: parseFloat(generationReserveMargin.toFixed(1)),
      overloadedLines,
      criticalVoltageNodes,
      averageNodeRisk: parseFloat(averageNodeBlackoutRisk.toFixed(1)),
    };

    // ================== CAPACITY PLANNING ==================

    // Calculate needed capacity additions
    const targetReserveMargin = 20; // 20% reserve margin target
    const neededCapacityMW = Math.max(0, (totalPeakDemandMW * (1 + targetReserveMargin / 100)) - totalCapacityMW);
    
    // Recommended plant types based on current mix
    const recommendedPlantTypes = [];
    const hasRenewables = powerPlants.some(p => ['Hydro'].includes(p.plantType));
    const hasNuclear = powerPlants.some(p => p.plantType === 'Nuclear');
    
    if (!hasRenewables || powerPlants.filter(p => ['Solar', 'Wind'].includes(p.plantType)).length < 3) {
      recommendedPlantTypes.push('Add renewable capacity (Solar/Wind) for environmental compliance');
    }
    if (generationReserveMargin < 15 && !hasNuclear) {
      recommendedPlantTypes.push('Add baseload capacity (Nuclear/Coal) for grid stability');
    }
    if (lineUtilization > 70) {
      recommendedPlantTypes.push('Upgrade transmission capacity to reduce line congestion');
    }

    // Transmission upgrades needed
    const transmissionUpgradesNeeded = transmissionLines.filter(line => 
      line.utilizationPercent > 80
    ).length;

    const capacityPlanning = {
      neededCapacityMW: parseFloat(neededCapacityMW.toFixed(2)),
      currentReserveMargin: parseFloat(generationReserveMargin.toFixed(1)),
      targetReserveMargin,
      transmissionUpgradesNeeded,
      recommendedAdditions: recommendedPlantTypes,
      estimatedCostM: parseFloat((neededCapacityMW * 1.5).toFixed(1)), // $1.5M per MW average
      timelineMonths: Math.ceil(neededCapacityMW / 100) * 12, // ~12 months per 100 MW
    };

    // ================== RECOMMENDATIONS ==================

    const recommendations = [];
    
    // Generation recommendations
    if (generationReserveMargin < 15) {
      recommendations.push({
        priority: 'High',
        category: 'Generation',
        action: `Add ${neededCapacityMW.toFixed(0)} MW generation capacity to achieve 20% reserve margin`,
        impact: 'Reduces blackout risk and improves grid reliability',
      });
    }
    
    // Transmission recommendations
    if (lineUtilization > 70) {
      recommendations.push({
        priority: 'High',
        category: 'Transmission',
        action: 'Upgrade overloaded transmission lines or build new corridors',
        impact: `Reduce line utilization from ${lineUtilization.toFixed(0)}% to target 60-70%`,
      });
    }
    
    // Grid node recommendations
    if (n1Compliance < 80) {
      recommendations.push({
        priority: 'Medium',
        category: 'Reliability',
        action: 'Improve N-1 contingency compliance by adding redundant transmission paths',
        impact: `Increase N-1 compliance from ${n1Compliance.toFixed(0)}% to target 90%+`,
      });
    }
    
    // Voltage stability recommendations
    if (voltageStability < 85) {
      recommendations.push({
        priority: 'Medium',
        category: 'Voltage',
        action: 'Install voltage regulation equipment (capacitors, reactors) at substations',
        impact: `Improve voltage stability from ${voltageStability.toFixed(0)}% to target 95%+`,
      });
    }
    
    // Demand response recommendations
    if (totalDRCapacityMW < totalPeakDemandMW * 0.05) {
      recommendations.push({
        priority: 'Low',
        category: 'Demand Response',
        action: 'Enroll more customers in demand response programs',
        impact: 'Reduce peak demand by 5-10% during grid stress events',
      });
    }

    return NextResponse.json({
      generation,
      demand,
      gridStability,
      blackoutRisk,
      capacityPlanning,
      recommendations,
      summary: {
        gridHealthScore: parseFloat(((gridStability.stabilityScore * 0.6 + (100 - blackoutRisk.overallRisk) * 0.4)).toFixed(1)),
        status: blackoutRisk.overallRisk < 20 ? 'Healthy' : blackoutRisk.overallRisk < 50 ? 'Stable' : blackoutRisk.overallRisk < 75 ? 'Stressed' : 'Critical',
        totalAssets: powerPlants.length + transmissionLines.length + gridNodes.length,
      },
      message: `Grid analysis complete: ${generation.totalPlants} plants generating ${totalGenerationMW.toFixed(0)} MW, ${gridStability.totalTransmissionLines} transmission lines, ${gridStability.totalGridNodes} grid nodes. Risk level: ${blackoutRisk.riskLevel}`,
    });

  } catch (error: unknown) {
    console.error('Grid analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to generate grid analytics' },
      { status: 500 }
    );
  }
}
