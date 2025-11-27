/**
 * @file app/api/ai/models/route.ts
 * @description Create/list AI models with complete validation and cost tracking
 * @updated 2025-11-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import AIModel from '@/lib/db/models/AIModel';
import { validateSizeParameterMapping } from '@/lib/utils/ai/trainingCosts';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const filter: Record<string, unknown> = {};
    if (companyId) filter.company = companyId;
    const models = await AIModel.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ models });
  } catch (e) {
    console.error('GET /api/ai/models error:', e);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const body = await req.json();
    const { companyId, name, architecture, size, parameters, dataset, datasetSize } = body;
    
    // Validate required fields
    if (!companyId || !name || !architecture || !size || !parameters || !dataset) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate company ownership and industry
    const company = await Company.findOne({ _id: companyId, owner: session.user.id, industry: 'Technology' });
    if (!company) {
      return NextResponse.json({ error: 'Company not found or unauthorized' }, { status: 404 });
    }

    // Validate datasetSize
    if (datasetSize !== undefined && datasetSize <= 0) {
      return NextResponse.json({ error: 'Dataset size must be greater than 0' }, { status: 422 });
    }

    // Validate size-parameter mapping
    if (!validateSizeParameterMapping(size, parameters)) {
      const thresholds: Record<'Small' | 'Medium' | 'Large', string> = {
        Small: '0-10B',
        Medium: '10B-80B',
        Large: '>80B',
      };
      return NextResponse.json(
        {
          error: 'Invalid size-parameter mapping',
          details: `${size} models must have ${thresholds[size as 'Small' | 'Medium' | 'Large']} parameters`,
        },
        { status: 422 }
      );
    }

    // Create model
    const model = await AIModel.create({
      company: company._id,
      name,
      architecture,
      size,
      parameters,
      status: 'Training',
      trainingProgress: 0,
      trainingStarted: new Date(),
      trainingCost: 0,
      dataset,
      datasetSize: datasetSize ?? 0,
      benchmarkScores: {
        accuracy: 0,
        perplexity: 0,
        f1Score: 0,
        inferenceLatency: 0,
      },
      deployed: false,
    });

    // Add model to company's models array
    if (!company.models) {
      company.models = [];
    }
    if (model._id) {
      company.models.push(model._id as Types.ObjectId);
    }
    await company.save();

    return NextResponse.json({ model }, { status: 201 });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Failed to create model';
    console.error('POST /api/ai/models error:', e);
    
    // Handle validation errors
    if (e && typeof e === 'object' && 'name' in e && e.name === 'ValidationError') {
      return NextResponse.json({ error: errorMessage }, { status: 422 });
    }
    
    // Handle duplicate model name
    if (e && typeof e === 'object' && 'code' in e && e.code === 11000) {
      return NextResponse.json({ error: 'Model name already exists for this company' }, { status: 409 });
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
