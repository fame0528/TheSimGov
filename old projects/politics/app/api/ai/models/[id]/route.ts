/**
 * @file app/api/ai/models/[id]/route.ts
 * @description AI model detail and updates (training, deploy) with complete cost calculation
 * @updated 2025-11-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import AIModel from '@/lib/db/models/AIModel';
import Company from '@/lib/db/models/Company';
import Transaction from '@/lib/db/models/Transaction';
import { calculateTrainingIncrementCost } from '@/lib/utils/ai/trainingCosts';
import mongoose from 'mongoose';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const model = await AIModel.findById(id).lean();
    if (!model) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // Ensure owner owns the company
    const company = await Company.findOne({ _id: model.company, owner: session.user.id });
    if (!company) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ model });
  } catch (e) {
    console.error('GET /api/ai/models/[id] error:', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const body = await req.json();
    const { action, progressIncrement, pricing } = body;

    const model = await AIModel.findById(id);
    if (!model) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const company = await Company.findById(model.company);
    if (!company || String(company.owner) !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ========== ADVANCE TRAINING ACTION ==========
    if (action === 'advanceTraining') {
      // Validate model is in Training status
      if (model.status !== 'Training') {
        return NextResponse.json(
          { error: 'Cannot advance training: model status is ' + model.status },
          { status: 409 }
        );
      }

      // Validate progress increment
      const increment = Math.max(1, Math.min(20, Number(progressIncrement ?? 5)));
      if (model.trainingProgress + increment > 100) {
        return NextResponse.json(
          { error: 'Progress increment would exceed 100%' },
          { status: 422 }
        );
      }

      // Calculate actual training cost using utility
      const costBreakdown = calculateTrainingIncrementCost(
        {
          size: model.size,
          parameters: model.parameters,
          datasetSize: model.datasetSize,
          computeType: company.computeType || 'GPU',
        },
        increment
      );

      const cost = costBreakdown.totalCost;

      // Validate company has sufficient funds
      if (company.cash < cost) {
        return NextResponse.json(
          {
            error: 'Insufficient cash for training',
            details: { required: cost, available: company.cash },
          },
          { status: 400 }
        );
      }

      // Update model progress and cost
      model.trainingProgress += increment;
      model.trainingCost += cost;

      // Check for completion
      if (model.trainingProgress >= 100) {
        model.status = 'Completed';
        model.trainingCompleted = new Date();
        
        // Calculate final benchmark scores (done in pre-save hook)
        // Award research points to company
        const researchPointsAwarded = Math.round(model.parameters / 1_000_000_000); // 1 point per billion params
        company.researchPoints = (company.researchPoints || 0) + researchPointsAwarded;
        
        // Update industry ranking (simple algorithm: more research points = higher ranking)
        // In production, this would query all Technology companies and calculate percentile
        company.industryRanking = Math.max(1, (company.industryRanking || 100) - 1);
      }

      await model.save(); // Triggers pre-save hook for benchmarks

      // Deduct company cash and log expense
      company.cash -= cost;
      company.expenses = (company.expenses || 0) + cost;
      await company.save();

      await Transaction.create({
        type: 'expense',
        amount: cost,
        description: `Model training: ${model.name} (+${increment}%)`,
        company: company._id,
        category: 'training',
        metadata: {
          modelId: model._id,
          modelName: model.name,
          size: model.size,
          progressIncrement: increment,
          costBreakdown,
        },
      });

      return NextResponse.json({ model, costBreakdown });
    }

    // ========== DEPLOY ACTION ==========
    if (action === 'deploy') {
      // Validate model is completed
      if (model.status !== 'Completed') {
        return NextResponse.json(
          { error: 'Cannot deploy: model must be completed first (status: ' + model.status + ')' },
          { status: 409 }
        );
      }

      // Already deployed check
      if (model.deployed) {
        return NextResponse.json(
          { error: 'Model is already deployed' },
          { status: 409 }
        );
      }

      // Deploy model (triggers pre-save hook for endpoint generation)
      model.deployed = true;
      model.status = 'Deployed';
      
      if (pricing !== undefined && pricing >= 0) {
        model.pricing = Number(pricing);
      }

      await model.save(); // Triggers pre-save hook for apiEndpoint generation

      // Initialize company API metrics if first deployment
      if (!company.uptime) company.uptime = 100;
      if (!company.activeCustomers) company.activeCustomers = 0;
      if (!company.apiCalls) company.apiCalls = 0;

      await company.save();

      return NextResponse.json({ model });
    }

    // ========== INVALID ACTION ==========
    return NextResponse.json(
      { error: 'Unsupported action. Valid actions: advanceTraining, deploy' },
      { status: 400 }
    );
  } catch (e: any) {
    console.error('PATCH /api/ai/models/[id] error:', e);
    
    // Handle validation errors
    if (e.name === 'ValidationError') {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    
    return NextResponse.json({ error: 'Failed to update model' }, { status: 500 });
  }
}
