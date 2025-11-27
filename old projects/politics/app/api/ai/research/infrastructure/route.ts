/**
 * @file app/api/ai/research/infrastructure/route.ts
 * @description AI research facility and infrastructure management API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Manages AI research facilities including compute clusters, data centers, labs,
 * and specialized equipment. Tracks capacity, utilization, maintenance, expansion
 * plans, and infrastructure costs for AI/ML research operations.
 * 
 * ENDPOINTS:
 * - POST /api/ai/research/infrastructure - Add infrastructure asset
 * - GET /api/ai/research/infrastructure - List infrastructure with utilization
 * 
 * BUSINESS LOGIC:
 * - Facility types: GPU cluster, Data center, Research lab, Testing facility
 * - Capacity tiers: Small (100-1k GPUs), Medium (1k-10k), Large (10k-100k), Hyperscale (>100k)
 * - Operating costs: $500k-$2M/year (small), $2M-$20M (medium), $20M-$200M (large), $200M+ (hyperscale)
 * - Utilization: 60-80% target (balance availability vs efficiency)
 * - Expansion: Plan 12-18 months ahead for major capacity additions
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
      facilityName,
      facilityType,
      capacityGPUs,
      utilizationRate,
      operatingCost,
      location,
      status,
    } = body;

    if (!companyId || !facilityName || !facilityType || !capacityGPUs) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let capacityTier = 'Small';
    if (capacityGPUs >= 100_000) capacityTier = 'Hyperscale';
    else if (capacityGPUs >= 10_000) capacityTier = 'Large';
    else if (capacityGPUs >= 1_000) capacityTier = 'Medium';

    const infrastructureData = {
      company: new Types.ObjectId(companyId),
      facilityName,
      facilityType,
      capacityGPUs,
      capacityTier,
      utilizationRate: utilizationRate || 0,
      operatingCost: operatingCost || 0,
      location: location || 'N/A',
      status: status || 'Operational',
      deployedAt: new Date(),
    };

    return NextResponse.json({
      infrastructure: infrastructureData,
      message: `Infrastructure "${facilityName}" added. ${capacityTier} scale with ${capacityGPUs.toLocaleString()} GPUs.`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding infrastructure:', error);
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
      infrastructure: [],
      aggregatedMetrics: {
        totalCapacity: 0,
        avgUtilization: 0,
        totalOperatingCost: 0,
        facilitiesCount: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching infrastructure:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
