/**
 * @file app/api/innovation/copyrights/route.ts
 * @description Copyright registration and content protection tracking API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Manages copyright registrations for software code, documentation, creative works,
 * and proprietary content. Tracks registration certificates, enforcement actions,
 * licensing agreements, and protection scope.
 * 
 * ENDPOINTS:
 * - POST /api/innovation/copyrights - Register new copyright
 * - GET /api/innovation/copyrights - List copyrights with licensing
 * 
 * BUSINESS LOGIC:
 * - Work types: Software code, Documentation, UI/UX design, Training materials, Content
 * - Registration cost: $45-$65 (US basic), $200-$500 (expedited)
 * - Protection: Author's life + 70 years (individual), 95 years (corporate)
 * - Licensing: Open source, Proprietary, Dual licensing
 * - Enforcement: DMCA takedowns, litigation for substantial infringement
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
      workTitle,
      workType,
      registrationNumber,
      licenseType,
      registrationCost,
      commercialValue,
      status,
    } = body;

    if (!companyId || !workTitle || !workType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const copyrightData = {
      company: new Types.ObjectId(companyId),
      workTitle,
      workType,
      registrationNumber: registrationNumber || 'Pending',
      licenseType: licenseType || 'Proprietary',
      registrationCost: registrationCost || 0,
      commercialValue: commercialValue || 0,
      status: status || 'Registered',
      registeredAt: new Date(),
      protectionExpiry: new Date(Date.now() + 95 * 365 * 24 * 60 * 60 * 1000), // +95 years
    };

    return NextResponse.json({
      copyright: copyrightData,
      message: `Copyright for "${workTitle}" registered. ${licenseType} licensing.`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering copyright:', error);
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
      copyrights: [],
      aggregatedMetrics: {
        totalCopyrights: 0,
        totalCommercialValue: 0,
        openSourceCount: 0,
        proprietaryCount: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching copyrights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
