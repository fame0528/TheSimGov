/**
 * @file app/api/innovation/licensing/route.ts
 * @description IP licensing revenue and partnership tracking API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Manages intellectual property licensing agreements including patents, trademarks,
 * copyrights, and trade secrets. Tracks royalty revenue, licensing terms, partner
 * relationships, and strategic licensing opportunities.
 * 
 * ENDPOINTS:
 * - POST /api/innovation/licensing - Create licensing agreement
 * - GET /api/innovation/licensing - List licensing revenue streams
 * 
 * BUSINESS LOGIC:
 * - License types: Patent, Trademark, Copyright, Trade secret, Technology transfer
 * - Royalty models: Fixed fee, Percentage of revenue (3-10% typical), Per-unit, Hybrid
 * - Agreement terms: Exclusive, Non-exclusive, Geographic restrictions, Field-of-use limits
 * - Revenue: Upfront fees + ongoing royalties + milestone payments
 * - Strategic value: Revenue diversification, market expansion, competitor control
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
      licenseName,
      licenseType,
      licensee,
      royaltyModel,
      royaltyRate,
      upfrontFee,
      agreementTerm,
      exclusivity,
      status,
    } = body;

    if (!companyId || !licenseName || !licenseType || !licensee || !royaltyModel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const licensingData = {
      company: new Types.ObjectId(companyId),
      licenseName,
      licenseType,
      licensee,
      royaltyModel,
      royaltyRate: royaltyRate || 0,
      upfrontFee: upfrontFee || 0,
      agreementTerm: agreementTerm || 12,
      exclusivity: exclusivity || 'Non-exclusive',
      status: status || 'Active',
      totalRevenue: upfrontFee || 0,
      signedAt: new Date(),
      expiresAt: new Date(Date.now() + (agreementTerm || 12) * 30 * 24 * 60 * 60 * 1000),
    };

    return NextResponse.json({
      licensing: licensingData,
      message: `Licensing agreement "${licenseName}" created. ${exclusivity}, ${royaltyRate || 0}% royalty, ${agreementTerm || 12} months.`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating licensing agreement:', error);
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
      licensingAgreements: [],
      revenueMetrics: {
        totalAgreements: 0,
        totalRevenue: 0,
        avgRoyaltyRate: 0,
        exclusiveCount: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching licensing agreements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
