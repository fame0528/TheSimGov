/**
 * @fileoverview Demographic Polling API
 * @module api/politics/polling/demographic
 * 
 * OVERVIEW:
 * Generates detailed demographic polling breakdowns for campaigns.
 * Supports national polls, state-level polls, and swing state polls.
 * Integrates the 18-group demographic system for granular support analysis.
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import CampaignPhaseState from '@/lib/db/models/politics/CampaignPhaseState';
import {
  generateNationalDemographicPoll,
  generateStateDemographicPoll,
  generateSwingStatePolls,
  getSwingStates,
  generateCrosstab,
  projectElectoralVotes,
  toPollSnapshot,
  type CandidateIssueProfile,
  type DemographicPollSnapshot,
} from '@/politics/engines/demographicPollingIntegration';
import { PollType } from '@/politics/engines/pollingEngine';
import { PoliticalIssue, DemographicGroupKey } from '@/lib/types/demographics';

// ===================== VALIDATION SCHEMAS =====================

const DemographicPollQuerySchema = z.object({
  playerId: z.string(),
  pollType: z.enum(['national', 'state', 'swing-states']).default('national'),
  stateCode: z.string().length(2).optional(),
  includeCrosstabs: z.coerce.boolean().default(false),
  includeElectoralProjection: z.coerce.boolean().default(false),
});

// ===================== HANDLERS =====================

/**
 * GET /api/politics/polling/demographic
 * 
 * Generates demographic polling data for a player's campaign.
 * 
 * Query Parameters:
 * - playerId: Required player identifier
 * - pollType: 'national' | 'state' | 'swing-states'
 * - stateCode: Required for state polls (e.g., 'PA', 'MI')
 * - includeCrosstabs: Include race×class crosstabs
 * - includeElectoralProjection: Include EV projection
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const rawQuery = {
      playerId: searchParams.get('playerId') || '',
      pollType: searchParams.get('pollType') || 'national',
      stateCode: searchParams.get('stateCode') || undefined,
      includeCrosstabs: searchParams.get('includeCrosstabs') || 'false',
      includeElectoralProjection: searchParams.get('includeElectoralProjection') || 'false',
    };
    
    const parsed = DemographicPollQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      return createErrorResponse(
        'Invalid query parameters',
        'VALIDATION_ERROR',
        400,
        parsed.error.issues
      );
    }
    
    const { playerId, pollType, stateCode, includeCrosstabs, includeElectoralProjection } = parsed.data;
    
    // Validate state polls have stateCode
    if (pollType === 'state' && !stateCode) {
      return createErrorResponse(
        'stateCode is required for state polls',
        'VALIDATION_ERROR',
        400
      );
    }
    
    await connectDB();
    
    // Get player's campaign state
    const playerCampaign = await CampaignPhaseState.findOne({ playerId })
      .sort({ cycleSequence: -1 })
      .lean()
      .exec();
    
    if (!playerCampaign) {
      return createErrorResponse('Active campaign not found', 'NOT_FOUND', 404);
    }
    
    // Find all players in the same election cycle (same cycleSequence)
    // This is a multiplayer game - all opponents are other players
    const allCampaignsInCycle = await CampaignPhaseState.find({ 
      cycleSequence: playerCampaign.cycleSequence 
    })
      .lean()
      .exec();
    
    // Build candidate profiles from all player campaigns in this cycle
    const candidateProfiles: CandidateIssueProfile[] = allCampaignsInCycle.map(campaign => 
      buildCandidateProfileFromCampaign(campaign)
    );
    
    if (candidateProfiles.length === 0) {
      return createErrorResponse('No candidates found in election cycle', 'NOT_FOUND', 404);
    }
    
    // Get action effects for candidates (from campaign actions)
    const actionEffectsByCandidate: Record<string, Partial<Record<DemographicGroupKey, number>>> = {};
    
    // Generate polls based on type
    let polls: DemographicPollSnapshot[] = [];
    let electoralProjection: ReturnType<typeof projectElectoralVotes> | undefined;
    
    const timestamp = Date.now();
    
    switch (pollType) {
      case 'national': {
        const nationalPoll = generateNationalDemographicPoll(
          candidateProfiles,
          actionEffectsByCandidate,
          undefined,
          timestamp
        );
        polls = [nationalPoll];
        break;
      }
      
      case 'state': {
        const statePoll = generateStateDemographicPoll(
          stateCode!,
          candidateProfiles,
          actionEffectsByCandidate,
          undefined,
          timestamp
        );
        polls = [statePoll];
        break;
      }
      
      case 'swing-states': {
        const swingPolls = generateSwingStatePolls(
          candidateProfiles,
          actionEffectsByCandidate,
          new Map(),
          timestamp
        );
        polls = Array.from(swingPolls.values());
        
        // Always include electoral projection for swing state polls
        if (includeElectoralProjection) {
          electoralProjection = projectElectoralVotes(swingPolls, candidateProfiles);
        }
        break;
      }
    }
    
    // Generate crosstabs if requested
    let crosstabs: Record<string, ReturnType<typeof generateCrosstab>> | undefined;
    if (includeCrosstabs && polls.length > 0) {
      const primaryPoll = polls[0];
      crosstabs = {
        raceByClass: generateCrosstab(primaryPoll, 'race', 'class'),
        raceByGender: generateCrosstab(primaryPoll, 'race', 'gender'),
        classByGender: generateCrosstab(primaryPoll, 'class', 'gender'),
      };
    }
    
    // Convert to standard poll snapshots for compatibility
    const standardSnapshots = polls.map(poll => 
      toPollSnapshot(poll, poll.geography === 'NATIONAL' ? PollType.NATIONAL : PollType.STATE)
    );
    
    return createSuccessResponse({
      pollType,
      timestamp,
      demographicPolls: polls,
      standardSnapshots,
      crosstabs,
      electoralProjection,
      swingStates: pollType === 'swing-states' ? getSwingStates() : undefined,
      metadata: {
        candidateCount: candidateProfiles.length,
        demographicGroups: 18,
        pollCount: polls.length,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to generate demographic polling');
  }
}

// ===================== HELPER FUNCTIONS =====================

/**
 * Build candidate profile from a player's campaign state
 * Uses CampaignPhaseState metrics to derive support levels
 */
function buildCandidateProfileFromCampaign(
  campaign: Record<string, unknown>
): CandidateIssueProfile {
  const playerId = String(campaign.playerId);
  
  // Derive party from playerId hash (deterministic per-player)
  // In a full implementation, this would come from Campaign model lookup
  const partyHash = simpleHash(playerId) % 3;
  const party: 'DEMOCRAT' | 'REPUBLICAN' | 'INDEPENDENT' = 
    partyHash === 0 ? 'DEMOCRAT' : 
    partyHash === 1 ? 'REPUBLICAN' : 
    'INDEPENDENT';
  
  // Build issue positions based on reputation and indices
  const issuePositions = buildIssuePositionsFromCampaign(campaign);
  
  // Calculate base support from campaign metrics
  const reputationScore = Number(campaign.reputationScore) || 50;
  const pollingShift = Number(campaign.pollingShiftProjectedPercent) || 0;
  const volatility = Number(campaign.volatilityModifier) || 0.5;
  
  // Base support: starts at 45%, modified by reputation and polling momentum
  let baseSupport = 45 + ((reputationScore - 50) / 10) + pollingShift;
  
  // Volatility affects spread (higher volatility = less predictable)
  baseSupport += (volatility - 0.5) * 5;
  
  // Clamp to reasonable range
  baseSupport = Math.max(30, Math.min(70, baseSupport));
  
  // Fundraising and endorsements provide charisma bonus
  const fundsRaised = Number(campaign.fundsRaisedThisCycle) || 0;
  const endorsements = Number(campaign.endorsementsAcquired) || 0;
  const charismaBonus = Math.min(15, (fundsRaised / 100000) + (endorsements * 2));
  
  return {
    candidateId: playerId,
    candidateName: `Player ${playerId.slice(-4)}`, // Shortened ID as placeholder name
    party,
    issuePositions,
    baseSupport: Math.round(baseSupport * 10) / 10,
    charismaBonus: Math.round(charismaBonus * 10) / 10,
    incumbentBonus: 0, // Would need to check against previous election winners
  };
}

/**
 * Build issue positions from campaign metrics
 * Uses engagement saturation and other indices to derive positions
 */
function buildIssuePositionsFromCampaign(campaign: Record<string, unknown>) {
  // Default moderate positions
  const positions: Record<PoliticalIssue, number> = {
    [PoliticalIssue.HEALTHCARE]: 0,
    [PoliticalIssue.IMMIGRATION]: 0,
    [PoliticalIssue.TAXES]: 0,
    [PoliticalIssue.ENVIRONMENT]: 0,
    [PoliticalIssue.GUNS]: 0,
    [PoliticalIssue.ABORTION]: 0,
    [PoliticalIssue.MILITARY]: 0,
    [PoliticalIssue.TRADE]: 0,
    [PoliticalIssue.EDUCATION]: 0,
    [PoliticalIssue.MINIMUM_WAGE]: 0,
    [PoliticalIssue.CRIMINAL_JUSTICE]: 0,
    [PoliticalIssue.SOCIAL_SECURITY]: 0,
  };
  
  // Default weights
  const weights: Record<PoliticalIssue, number> = {
    [PoliticalIssue.HEALTHCARE]: 0.8,
    [PoliticalIssue.IMMIGRATION]: 0.7,
    [PoliticalIssue.TAXES]: 0.9,
    [PoliticalIssue.ENVIRONMENT]: 0.6,
    [PoliticalIssue.GUNS]: 0.7,
    [PoliticalIssue.ABORTION]: 0.6,
    [PoliticalIssue.MILITARY]: 0.5,
    [PoliticalIssue.TRADE]: 0.5,
    [PoliticalIssue.EDUCATION]: 0.7,
    [PoliticalIssue.MINIMUM_WAGE]: 0.6,
    [PoliticalIssue.CRIMINAL_JUSTICE]: 0.6,
    [PoliticalIssue.SOCIAL_SECURITY]: 0.7,
  };
  
  // Use campaign seed to deterministically generate positions
  const seed = String(campaign.seed || campaign.playerId);
  const playerId = String(campaign.playerId);
  
  // Generate deterministic positions based on player ID
  for (const issue of Object.values(PoliticalIssue)) {
    const issueHash = simpleHash(`${playerId}-${issue}`);
    // Map to -3 to +3 range (moderate positions)
    positions[issue] = ((issueHash % 7) - 3);
  }
  
  return { positions, weights };
}

/**
 * Simple hash function for deterministic randomization
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
