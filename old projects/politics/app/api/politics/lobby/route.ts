/**
 * @file app/api/politics/lobby/route.ts
 * @description Legislative lobbying API endpoint
 * @created 2025-11-15
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

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Company from '@/lib/db/models/Company';
import PoliticalContribution from '@/lib/db/models/PoliticalContribution';
import LobbyingAction from '@/lib/db/models/LobbyingAction';
import {
  canLobby,
  getLobbyingPower,
  getLobbyingSuccessProbability,
  calculateTotalInfluence,
} from '@/lib/utils/politicalInfluence';

export async function POST(request: Request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { companyId, targetLegislation, legislationType, influencePointsCost } = body;
    
    // Validate required fields
    if (!companyId || !targetLegislation || !legislationType || !influencePointsCost) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get company
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
    // Check lobbying eligibility
    if (!canLobby(company.level)) {
      return NextResponse.json(
        { error: 'Company level too low. Level 3+ required to lobby.' },
        { status: 403 }
      );
    }
    
    // Check lobbying power
    const maxPower = getLobbyingPower(company.level);
    if (influencePointsCost > maxPower) {
      return NextResponse.json(
        { error: `Maximum lobbying power for Level ${company.level} is ${maxPower} points` },
        { status: 400 }
      );
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
      company.level
    );
    
    // Calculate success probability
    const successProbability = getLobbyingSuccessProbability(
      { level: company.level, reputation: company.reputation },
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
    
    return NextResponse.json({
      success: true,
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
    return NextResponse.json(
      { error: 'Failed to process lobbying action' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID required' },
        { status: 400 }
      );
    }
    
    // Get company lobbying history
    const actions = await LobbyingAction.find({ company: companyId })
      .sort({ initiatedAt: -1 })
      .limit(50);
    
    return NextResponse.json({
      success: true,
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
    return NextResponse.json(
      { error: 'Failed to fetch lobbying history' },
      { status: 500 }
    );
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
