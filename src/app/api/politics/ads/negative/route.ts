/**
 * POST /api/politics/ads/negative
 * 
 * OVERVIEW:
 * Launches negative attack ad based on opposition research.
 * Calculates effectiveness, backfire risk, ethics penalties.
 * Updates polling based on ad impact.
 * 
 * Created: 2024-11-26
 * Part of: Opposition Research System (FID-20251125-001C Phase 5)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import {
  validateNegativeAd,
  calculateNegativeAdEffectiveness,
  calculateBackfireProbability,
  rollBackfire,
  calculatePollingImpact,
  calculateEthicsPenalty,
  calculateVoterFatigue,
  countRecentNegativeAds,
  calculateDaysSinceLastAd,
  type NegativeAd,
  type ResearchQuality,
} from '@/politics/systems';

/**
 * Request validation schema
 */
const LaunchNegativeAdSchema = z.object({
  playerId: z.string().min(1),
  targetId: z.string().min(1),
  researchId: z.string().nullable(),
  amountSpent: z.number().min(25000).max(250000),
  campaignPhase: z.enum(['ANNOUNCEMENT', 'FUNDRAISING', 'ACTIVE', 'RESOLUTION']),
});

/**
 * POST handler - Launch negative ad
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = LaunchNegativeAdSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { playerId, targetId, researchId, amountSpent, campaignPhase } = validation.data;

    // Verify session matches player ID
    if (session.user.id !== playerId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Mock budget check
    const playerBudget = 500000;
    const adValidation = validateNegativeAd(researchId, amountSpent, playerBudget, campaignPhase);
    
    if (!adValidation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: adValidation.errors },
        { status: 400 }
      );
    }

    // TODO: Load research quality from database if researchId provided
    const researchQuality: ResearchQuality | null = researchId ? {
      score: 75,
      tier: 'MODERATE' as any,
      findings: ['Sample finding'],
      credibility: 80,
    } : null;

    // Mock previous ad history
    const previousAds: NegativeAd[] = [];
    const previousNegativeAdCount = countRecentNegativeAds(previousAds, playerId, 14);
    const daysSinceLastAd = calculateDaysSinceLastAd(previousAds, playerId);

    // Calculate ad effectiveness
    const credibility = researchQuality?.credibility ?? 50;
    const ethicsPenalty = calculateEthicsPenalty(credibility, previousNegativeAdCount, false);
    const voterFatigue = calculateVoterFatigue(previousNegativeAdCount, daysSinceLastAd);
    const effectiveness = calculateNegativeAdEffectiveness(
      researchQuality,
      amountSpent,
      campaignPhase,
      ethicsPenalty,
      voterFatigue
    );

    // Calculate backfire probability and roll
    const backfireProbability = calculateBackfireProbability(credibility, ethicsPenalty, false);
    const backfireOccurred = rollBackfire(backfireProbability);

    // Calculate polling impact
    const pollingImpact = calculatePollingImpact(effectiveness, backfireOccurred);

    // TODO: Create negative ad record in database
    // TODO: Update polling snapshots with impact
    // TODO: Deduct amountSpent from player budget
    // TODO: Apply ethics penalty to player campaign

    const adRecord: NegativeAd = {
      id: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      targetId,
      researchId,
      researchBased: !!researchId,
      amountSpent,
      launchedAt: new Date(),
      campaignPhase,
      effectiveness,
      backfireOccurred,
      ethicsPenaltyApplied: ethicsPenalty,
      voterFatigueImpact: voterFatigue,
      countered: false,
      counterEffectiveness: 0,
    };

    return NextResponse.json({
      success: true,
      ad: adRecord,
      impact: {
        targetPollingShift: pollingImpact.targetPollingShift,
        attackerPollingShift: pollingImpact.attackerPollingShift,
        backfireOccurred,
      },
      analysis: {
        effectiveness,
        backfireProbability,
        ethicsPenalty,
        voterFatigue,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error launching negative ad:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
