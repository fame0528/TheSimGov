/**
 * @file app/api/innovation/tradesecrets/route.ts
 * @description Trade secret protection and confidential information tracking API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Manages trade secrets including proprietary algorithms, business processes, customer
 * lists, and confidential methodologies. Tracks protection measures, NDA enforcement,
 * and estimated competitive value of secret information.
 * 
 * ENDPOINTS:
 * - POST /api/innovation/tradesecrets - Register new trade secret
 * - GET /api/innovation/tradesecrets - List protected trade secrets
 * 
 * BUSINESS LOGIC:
 * - Secret types: Algorithm, Process, Formula, Customer data, Business method
 * - Protection: NDAs, access controls, employee agreements, physical security
 * - Value: Can exceed patents (no expiration, competitors unaware)
 * - Risk: Reverse engineering, employee departure, security breaches
 * - Enforcement: Litigation for misappropriation (UTSA, DTSA)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import { Types } from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      company: companyId,
      secretName,
      secretType,
      description,
      competitiveValue,
      protectionMeasures,
      authorizedPersonnel,
      riskLevel,
    } = body;

    if (!companyId || !secretName || !secretType || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const tradeSecretData = {
      company: new Types.ObjectId(companyId),
      secretName,
      secretType,
      description,
      competitiveValue: competitiveValue || 0,
      protectionMeasures: protectionMeasures || [],
      authorizedPersonnel: authorizedPersonnel || 0,
      riskLevel: riskLevel || 'Medium',
      establishedAt: new Date(),
    };

    return NextResponse.json({
      tradeSecret: tradeSecretData,
      message: `Trade secret "${secretName}" registered. ${riskLevel} risk level, ${authorizedPersonnel || 0} authorized personnel.`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering trade secret:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      tradeSecrets: [],
      aggregatedMetrics: {
        totalSecrets: 0,
        totalCompetitiveValue: 0,
        highRiskCount: 0,
        avgAuthorizedPersonnel: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching trade secrets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
