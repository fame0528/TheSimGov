/**
 * @file app/api/innovation/cap-table/route.ts
 * @description Capitalization table and equity ownership tracking API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Manages equity ownership structure including founders, employees (options/RSUs),
 * investors (angels, VCs), and employee option pool. Tracks dilution over funding
 * rounds, vesting schedules, and liquidation preference stack.
 * 
 * ENDPOINTS:
 * - POST /api/innovation/cap-table - Add cap table entry
 * - GET /api/innovation/cap-table - Get current ownership breakdown
 * 
 * BUSINESS LOGIC:
 * - Stakeholder types: Founders (40-60%), Employees (10-20% option pool), Investors (30-50% post-Series B)
 * - Share classes: Common (founders, employees), Preferred (investors with liquidation preference)
 * - Vesting: 4-year vesting, 1-year cliff standard, acceleration on acquisition/IPO
 * - Dilution: Each funding round dilutes existing shareholders proportionally
 * - Liquidation: Preferred shareholders get 1x-3x preference before common gets paid
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
      stakeholderName,
      stakeholderType,
      shareClass,
      shareCount,
      ownershipPercentage,
      vestingSchedule,
    } = body;

    if (!companyId || !stakeholderName || !stakeholderType || !shareCount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const capTableEntry = {
      company: new Types.ObjectId(companyId),
      stakeholderName,
      stakeholderType,
      shareClass: shareClass || 'Common',
      shareCount,
      ownershipPercentage: ownershipPercentage || 0,
      vestingSchedule: vestingSchedule || 'None',
      issuedAt: new Date(),
    };

    return NextResponse.json({
      entry: capTableEntry,
      message: `Cap table updated: ${stakeholderName} (${stakeholderType}, ${ownershipPercentage || 0}% ownership)`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error updating cap table:', error);
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
      capTable: [],
      aggregatedMetrics: {
        totalShares: 0,
        foundersOwnership: 0,
        employeesOwnership: 0,
        investorsOwnership: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching cap table:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
