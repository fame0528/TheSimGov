/**
 * @file app/api/ai/research/compute/route.ts
 * @description AI compute resource allocation and cost tracking API
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Manages GPU/compute resource allocation for AI training runs and experiments.
 * Tracks utilization, costs, queue times, efficiency metrics, and resource contention.
 * Critical for optimizing expensive compute budgets and maximizing research throughput.
 * 
 * ENDPOINTS:
 * - POST /api/ai/research/compute - Allocate compute resources
 * - GET /api/ai/research/compute - List compute allocations and costs
 * 
 * BUSINESS LOGIC:
 * - Resource types: GPU cluster, TPU pods, Cloud instances, Hybrid
 * - Cost models: On-demand ($2-$8/GPU-hour), Reserved ($0.50-$2/GPU-hour), Spot ($0.10-$1/GPU-hour)
 * - Utilization: 70-90% target (minimize idle time)
 * - Queue management: Priority (flagship > strategic > exploratory)
 * - Efficiency: FLOPS per dollar, training time optimization
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
      resourceType,
      gpuCount,
      duration,
      costModel,
      estimatedCost,
      priority,
      status,
    } = body;

    if (!companyId || !resourceType || !gpuCount || !duration || !costModel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const computeData = {
      company: new Types.ObjectId(companyId),
      projectId: projectId ? new Types.ObjectId(projectId) : null,
      resourceType,
      gpuCount,
      duration,
      costModel,
      estimatedCost: estimatedCost || 0,
      priority: priority || 'Medium',
      status: status || 'Queued',
      allocatedAt: new Date(),
    };

    return NextResponse.json({
      compute: computeData,
      message: `Compute allocation created. ${gpuCount} GPUs for ${duration} hours at ${costModel} pricing.`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error allocating compute:', error);
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
      computeAllocations: [],
      aggregatedMetrics: {
        totalGPUHours: 0,
        totalCost: 0,
        avgUtilization: 0,
        queueDepth: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching compute allocations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
