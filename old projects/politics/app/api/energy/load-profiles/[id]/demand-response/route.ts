/**
 * @fileoverview Demand Response API - Trigger DR Events
 * 
 * OVERVIEW:
 * POST: Trigger demand response event to reduce peak load
 * 
 * @created 2025-11-18
 * @updated 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import LoadProfile, { DRProgramType } from '@/src/lib/db/models/LoadProfile';

// ================== POST HANDLER ==================

/**
 * POST /api/energy/load-profiles/[id]/demand-response
 * Trigger demand response event
 * 
 * Request Body:
 * - programType: DR program type (TimeOfUse, CriticalPeak, DirectControl, Interruptible) (required)
 * - durationHours: Event duration in hours (required)
 * - targetReductionMW: Target load reduction in MW (required)
 * - reason: Reason for DR event (optional)
 * 
 * Response: { profile, drEvent, estimatedSavings, costImpact, message }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = params;
    const body = await request.json();
    const { programType, durationHours, targetReductionMW, reason } = body;

    // Validate required fields
    if (!programType || durationHours === undefined || targetReductionMW === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: programType, durationHours, targetReductionMW' },
        { status: 400 }
      );
    }

    // Validate program type
    const validProgramTypes = ['TimeOfUse', 'CriticalPeak', 'DirectControl', 'Interruptible'];
    if (!validProgramTypes.includes(programType)) {
      return NextResponse.json(
        { error: `Invalid program type. Must be one of: ${validProgramTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate duration
    if (durationHours < 0.5 || durationHours > 8) {
      return NextResponse.json(
        { error: 'Duration must be between 0.5 and 8 hours' },
        { status: 400 }
      );
    }

    // Validate target reduction
    if (targetReductionMW <= 0) {
      return NextResponse.json(
        { error: 'Target reduction must be greater than 0' },
        { status: 400 }
      );
    }

    // Fetch load profile
    const profile = await LoadProfile.findById(id);
    if (!profile) {
      return NextResponse.json(
        { error: 'Load profile not found' },
        { status: 404 }
      );
    }

    // Check if DR programs are active
    if (!profile.drProgramsActive) {
      return NextResponse.json(
        { error: 'Demand response programs are not active for this load profile' },
        { status: 400 }
      );
    }

    // Check if target reduction is feasible
    if (targetReductionMW > profile.drEnrolledMW) {
      return NextResponse.json(
        { error: `Target reduction ${targetReductionMW} MW exceeds enrolled capacity ${profile.drEnrolledMW} MW` },
        { status: 400 }
      );
    }

    // Trigger DR event
    await profile.triggerDREvent(programType as DRProgramType, durationHours, targetReductionMW);

    // Get the most recent DR event (just added)
    const drEvent = profile.drEventHistory[profile.drEventHistory.length - 1];

    // Calculate estimated participation and actual reduction
    const estimatedReductionMW = targetReductionMW * (drEvent.participationRate / 100);

    // Calculate energy savings (MWh)
    const energySavingsMWh = estimatedReductionMW * durationHours;

    // Calculate cost savings (avoided generation cost)
    const averageGenerationCost = 80; // $/MWh (typical avoided cost)
    const costSavings = energySavingsMWh * averageGenerationCost;

    // Calculate incentive cost
    const incentiveCost = energySavingsMWh * drEvent.incentiveRate;

    // Calculate net savings
    const netSavings = costSavings - incentiveCost;

    // Calculate new load after DR reduction
    const newLoadMW = profile.currentLoadMW - estimatedReductionMW;
    const loadReductionPercent = (estimatedReductionMW / profile.currentLoadMW) * 100;

    return NextResponse.json({
      profile: {
        _id: profile._id,
        region: profile.region,
        state: profile.state,
        profileType: profile.profileType,
        currentLoadMW: profile.currentLoadMW,
        peakLoadMW: profile.peakLoadMW,
        drEnrolledMW: profile.drEnrolledMW,
        drEventsYTD: profile.drEventsYTD,
      },
      drEvent: {
        programType: drEvent.programType,
        startTime: drEvent.startTime,
        endTime: drEvent.endTime,
        targetReductionMW: drEvent.targetReductionMW,
        estimatedReductionMW: parseFloat(estimatedReductionMW.toFixed(2)),
        participationRate: drEvent.participationRate,
        incentiveRate: drEvent.incentiveRate,
        reason: reason || 'Grid stress event',
      },
      estimatedSavings: {
        energySavingsMWh: parseFloat(energySavingsMWh.toFixed(2)),
        costSavings: parseFloat(costSavings.toFixed(2)),
        incentiveCost: parseFloat(incentiveCost.toFixed(2)),
        netSavings: parseFloat(netSavings.toFixed(2)),
        roi: parseFloat(((netSavings / incentiveCost) * 100).toFixed(1)),
      },
      costImpact: {
        beforeLoadMW: profile.currentLoadMW,
        afterLoadMW: parseFloat(newLoadMW.toFixed(2)),
        loadReductionPercent: parseFloat(loadReductionPercent.toFixed(1)),
        durationHours,
      },
      message: `DR event triggered: ${programType} program, ${durationHours}h duration, ${estimatedReductionMW.toFixed(1)} MW estimated reduction (${drEvent.participationRate}% participation)`,
    });

  } catch (error: unknown) {
    console.error('Demand response event error:', error);
    
    // Handle specific error from triggerDREvent
    if (error instanceof Error) {
      if (error.message.includes('No demand response programs active')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes('exceeds enrolled capacity')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to trigger demand response event' },
      { status: 500 }
    );
  }
}
