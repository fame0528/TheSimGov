/**
 * @fileoverview Oil Wells API - GET/POST endpoints
 * @module api/energy/oil-wells
 * 
 * ENDPOINTS:
 * GET  /api/energy/oil-wells - List oil wells for company
 * POST /api/energy/oil-wells - Create new oil well
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

import { connectDB } from '@/lib/db';
import { OilWell } from '@/lib/db/models';

/**
 * GET /api/energy/oil-wells
 * List all oil wells for a company
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');
    const status = searchParams.get('status');
    const wellType = searchParams.get('type');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Build query
    const query: Record<string, unknown> = { company: companyId };
    if (status) query.status = status;
    if (wellType) query.wellType = wellType;

    const wells = await OilWell.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary stats
    const totalProduction = wells.reduce((sum, w) => sum + (w.currentProduction || 0), 0);
    const avgDepletion = wells.length > 0 
      ? wells.reduce((sum, w) => sum + (w.depletionRate || 0), 0) / wells.length 
      : 0;
    const maintenanceDue = wells.filter(w => {
      if (!w.lastMaintenance) return true;
      const daysSince = (Date.now() - new Date(w.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 90;
    }).length;

    return NextResponse.json({
      wells,
      totalProduction,
      avgDepletion: Math.round(avgDepletion * 100) / 100,
      maintenanceDue,
      count: wells.length,
    });
  } catch (error) {
    console.error('GET /api/energy/oil-wells error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch oil wells' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/energy/oil-wells
 * Create a new oil well
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      company,
      name,
      location,
      wellType,
      reserveEstimate,
      peakProduction,
      depletionRate,
      extractionCost,
      depth,
    } = body;

    if (!company || !name || !location) {
      return NextResponse.json(
        { error: 'Company, name, and location are required' },
        { status: 400 }
      );
    }

    const well = await OilWell.create({
      company,
      name,
      location,
      wellType: wellType || 'Conventional',
      status: 'Drilling',
      reserveEstimate: reserveEstimate || 100000,
      currentProduction: 0,
      peakProduction: peakProduction || 500,
      depletionRate: depletionRate || 5,
      extractionCost: extractionCost || 25,
      depth: depth || 5000,
      commissionDate: new Date(),
      equipment: [],
    });

    return NextResponse.json(
      { message: 'Oil well created', well },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/energy/oil-wells error:', error);
    return NextResponse.json(
      { error: 'Failed to create oil well' },
      { status: 500 }
    );
  }
}

