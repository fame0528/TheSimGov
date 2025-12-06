/**
 * @file src/app/api/politics/lobby/route.ts
 * @description Legislative lobbying API endpoint
 * @created 2025-11-24
 *
 * OVERVIEW:
 * POST endpoint for companies to lobby for legislation.
 * Level 3+ companies can lobby (with increasing power).
 * Success depends on company level, influence points, and legislation type.
 *
 * ENDPOINTS:
 * POST /api/politics/lobby - Lobby for legislation
 * GET /api/politics/lobby?companyId=xxx - Get company lobbying history
 *
 * REQUEST BODY (POST):
 * {
 *   companyId: string,
 *   targetLegislation: string,
 *   legislationType: 'Tax' | 'Regulation' | 'Subsidy' | 'Trade' | 'Labor' | 'Environment',
 *   influencePointsCost: number
 * }
 *
 * RESPONSE (POST):
 * {
 *   success: true,
 *   action: ILobbyingAction,
 *   successProbability: number,
 *   result: 'Successful' | 'Failed',
 *   outcome?: { effectType, effectValue, duration }
 * }
 */

import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Company from '@/lib/db/models/Company';
import PoliticalContribution from '@/lib/db/models/PoliticalContribution';
import LobbyingAction from '@/lib/db/models/LobbyingAction';
import { CompanyLevel } from '@/lib/types/game';
import {
  canLobby,
  getLobbyingPower,
  getLobbyingSuccessProbability,
  calculateTotalInfluence,
} from '@/lib/utils/politicalinfluence';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    const body = await request.json();
    const { companyId, targetLegislation, legislationType, influencePointsCost } = body;

    // Validate required fields
    if (!companyId || !targetLegislation || !legislationType || !influencePointsCost) {
      return createErrorResponse('Missing required fields', ErrorCode.BAD_REQUEST, 400);
    }

    // Get company
    const company = await Company.findById(companyId);
    if (!company) {
      return createErrorResponse('Company not found', ErrorCode.NOT_FOUND, 404);
    }

    if (!company.owner || company.owner.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - you do not own this company', ErrorCode.FORBIDDEN, 403);
    }

    // Check lobbying eligibility
    if (!canLobby(company.level as CompanyLevel)) {
      return createErrorResponse('Company level too low. Level 3+ required to lobby.', ErrorCode.FORBIDDEN, 403);
    }

    // Check lobbying power
    const maxPower = getLobbyingPower(company.level as CompanyLevel);
    if (influencePointsCost > maxPower) {
      return createErrorResponse(`Maximum lobbying power for Level ${company.level} is ${maxPower} points`, ErrorCode.BAD_REQUEST, 400);
    }

    // Calculate total influence from donations
    const allDonations = await PoliticalContribution.find({ company: companyId });
    const totalDonationAmount = allDonations.reduce((sum, d) => sum + d.amount, 0);
    const successfulLobbies = await LobbyingAction.countDocuments({
      company: companyId,
      status: 'Successful',
    });

    const totalInfluence = calculateTotalInfluence(
      totalDonationAmount,
      successfulLobbies,
      company.level as CompanyLevel
    );

    // Calculate success probability
    const successProbability = getLobbyingSuccessProbability(
      { level: company.level as CompanyLevel, reputation: company.reputation || 0 },
      legislationType,
      influencePointsCost,
      totalInfluence
    );

    // Simulate lobbying outcome (random roll)
    const roll = Math.random() * 100;
    const success = roll < successProbability;

    // Define outcome if successful
    let outcome;
    if (success) {
      outcome = generateLobbyingOutcome(legislationType, influencePointsCost);
    }

    // Create lobbying action record
    const action = await LobbyingAction.create({
      company: companyId,
      targetLegislation,
      legislationType,
      influencePointsCost,
      successProbability,
      status: success ? 'Successful' : 'Failed',
      outcome: success ? outcome : undefined,
      initiatedAt: new Date(),
      resolvedAt: new Date(),
    });

    return createSuccessResponse({
      action: {
        id: action._id,
        targetLegislation: action.targetLegislation,
        legislationType: action.legislationType,
        influencePointsCost: action.influencePointsCost,
        successProbability: action.successProbability,
        status: action.status,
        outcome: action.outcome,
      },
      successProbability,
      result: success ? 'Successful' : 'Failed',
      outcome: success ? outcome : undefined,
    });
  } catch (error) {
    console.error('Lobbying error:', error);
    return createErrorResponse('Failed to process lobbying action', ErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId || companyId === 'undefined') {
      return createErrorResponse('Company ID required', ErrorCode.BAD_REQUEST, 400);
    }

    // Verify company ownership
    const company = await Company.findById(companyId);
    if (!company || !company.owner || company.owner.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - you do not own this company', ErrorCode.FORBIDDEN, 403);
    }

    // Get company lobbying history
    const actions = await LobbyingAction.find({ company: companyId })
      .sort({ initiatedAt: -1 })
      .limit(50);

    return createSuccessResponse({
      actions: actions.map(a => ({
        id: a._id,
        targetLegislation: a.targetLegislation,
        legislationType: a.legislationType,
        influencePointsCost: a.influencePointsCost,
        successProbability: a.successProbability,
        status: a.status,
        outcome: a.outcome,
        initiatedAt: a.initiatedAt,
        resolvedAt: a.resolvedAt,
      })),
    });
  } catch (error) {
    console.error('Get lobbying history error:', error);
    return createErrorResponse('Failed to fetch lobbying history', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * Generate lobbying outcome based on legislation type
 */
function generateLobbyingOutcome(legislationType: string, influencePointsCost: number) {
  const outcomes: Record<string, any> = {
    Tax: {
      effectType: 'taxReduction',
      effectValue: -Math.floor(influencePointsCost * 0.5), // -0.5% per influence point
      duration: 12, // 12 months
    },
    Subsidy: {
      effectType: 'subsidyGrant',
      effectValue: influencePointsCost * 50000, // $50k per influence point
      duration: 6, // One-time or 6-month program
    },
    Regulation: {
      effectType: 'regulationRemoval',
      effectValue: Math.floor(influencePointsCost * 2), // Compliance cost reduction
      duration: 24, // 24 months
    },
    Trade: {
      effectType: 'tariffReduction',
      effectValue: -Math.floor(influencePointsCost * 1), // -1% tariff per point
      duration: 18, // 18 months
    },
    Labor: {
      effectType: 'laborCostReduction',
      effectValue: -Math.floor(influencePointsCost * 0.3), // -0.3% labor cost per point
      duration: 12, // 12 months
    },
    Environment: {
      effectType: 'complianceWaiver',
      effectValue: Math.floor(influencePointsCost * 3), // Compliance savings
      duration: 12, // 12 months
    },
  };

  return outcomes[legislationType] || outcomes.Regulation;
}