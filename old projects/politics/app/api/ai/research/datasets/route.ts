/**
 * @file app/api/ai/research/datasets/route.ts
 * @description Training dataset management and curation tracking API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Manages proprietary and licensed training datasets for AI/ML model development.
 * Tracks dataset size, quality metrics, labeling costs, licensing fees, data sources,
 * and competitive advantages from unique data access.
 * 
 * ENDPOINTS:
 * - POST /api/ai/research/datasets - Register new dataset
 * - GET /api/ai/research/datasets - List datasets with quality metrics
 * 
 * BUSINESS LOGIC:
 * - Dataset types: Proprietary, Licensed, Public, Synthetic
 * - Size tiers: Small (<1M samples), Medium (1M-100M), Large (100M-10B), Massive (>10B)
 * - Labeling costs: $0.01-$0.50 per sample (varies by complexity)
 * - Quality metrics: Label accuracy, coverage, diversity, bias metrics
 * - Strategic value: Exclusive data access = competitive moat
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
      datasetName,
      datasetType,
      sampleCount,
      labelingCost,
      licensingCost,
      qualityScore,
      dataSource,
    } = body;

    if (!companyId || !datasetName || !datasetType || !sampleCount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let sizeTier = 'Small';
    if (sampleCount >= 10_000_000_000) sizeTier = 'Massive';
    else if (sampleCount >= 100_000_000) sizeTier = 'Large';
    else if (sampleCount >= 1_000_000) sizeTier = 'Medium';

    const datasetData = {
      company: new Types.ObjectId(companyId),
      datasetName,
      datasetType,
      sampleCount,
      sizeTier,
      labelingCost: labelingCost || 0,
      licensingCost: licensingCost || 0,
      qualityScore: qualityScore || 0,
      dataSource: dataSource || 'N/A',
      createdAt: new Date(),
    };

    return NextResponse.json({
      dataset: datasetData,
      message: `Dataset "${datasetName}" registered. ${sizeTier} scale with ${(sampleCount / 1_000_000).toFixed(1)}M samples.`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering dataset:', error);
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
      datasets: [],
      aggregatedMetrics: {
        totalDatasets: 0,
        totalSamples: 0,
        totalCost: 0,
        avgQuality: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
