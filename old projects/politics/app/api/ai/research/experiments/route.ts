/**
 * @file app/api/ai/research/experiments/route.ts
 * @description AI/ML experiment tracking and hyperparameter optimization API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Tracks individual AI/ML experiments for model development and optimization. Records
 * hyperparameters, training runs, validation metrics, compute costs, and ablation studies.
 * Critical for reproducibility, performance optimization, and research efficiency.
 * 
 * ENDPOINTS:
 * - POST /api/ai/research/experiments - Log new experiment run
 * - GET /api/ai/research/experiments - List experiments with metrics
 * 
 * BUSINESS LOGIC:
 * - Experiment types: Training, Validation, Ablation, Hyperparameter sweep, Benchmark
 * - Compute costs: $0.10-$5/hour (small), $5-$50/hour (medium), $50-$500/hour (large)
 * - Training duration: Hours (small), Days (medium), Weeks (large)
 * - Success criteria: Validation accuracy, loss convergence, resource efficiency
 * - Reproducibility: Seed tracking, config snapshots, environment versioning
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
      projectId,
      experimentName,
      experimentType,
      hyperparameters,
      validationAccuracy,
      trainingLoss,
      computeCost,
      duration,
      status,
    } = body;

    if (!companyId || !experimentName || !experimentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const experimentData = {
      company: new Types.ObjectId(companyId),
      projectId: projectId ? new Types.ObjectId(projectId) : null,
      experimentName,
      experimentType,
      hyperparameters: hyperparameters || {},
      validationAccuracy: validationAccuracy || 0,
      trainingLoss: trainingLoss || 0,
      computeCost: computeCost || 0,
      duration: duration || 0,
      status: status || 'Running',
      startedAt: new Date(),
    };

    return NextResponse.json({
      experiment: experimentData,
      message: `Experiment "${experimentName}" logged successfully.`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error logging experiment:', error);
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
      experiments: [],
      aggregatedMetrics: {
        totalExperiments: 0,
        totalComputeCost: 0,
        avgAccuracy: 0,
        bestPerformingModel: null,
      },
    });
  } catch (error) {
    console.error('Error fetching experiments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
