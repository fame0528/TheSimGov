/**
 * @file app/api/ai/companies/[id]/route.ts
 * @description AI Company detail with models, research points, ranking, and aggregates
 * @updated 2025-11-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import AIModel from '@/lib/db/models/AIModel';
import mongoose from 'mongoose';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid company id' }, { status: 400 });
    }

    // Fetch company with ownership check
    const company = await Company.findOne({
      _id: id,
      owner: session.user.id,
      industry: 'Technology',
    }).lean();

    if (!company) {
      return NextResponse.json({ error: 'Company not found or unauthorized' }, { status: 404 });
    }

    // Fetch all models for this company
    const models = await AIModel.find({ company: id }).sort({ createdAt: -1 }).lean();

    // Calculate aggregates
    const totalModels = models.length;
    const deployedModels = models.filter((m) => m.deployed).length;
    const trainingModels = models.filter((m) => m.status === 'Training').length;
    const completedModels = models.filter((m) => m.status === 'Completed' || m.status === 'Deployed').length;

    // Average training cost (only for models with cost > 0)
    const modelsWithCost = models.filter((m) => m.trainingCost > 0);
    const averageTrainingCost =
      modelsWithCost.length > 0
        ? modelsWithCost.reduce((sum, m) => sum + m.trainingCost, 0) / modelsWithCost.length
        : 0;

    // Average training progress (for in-progress models)
    const inProgressModels = models.filter((m) => m.status === 'Training' && m.trainingProgress > 0);
    const averageProgress =
      inProgressModels.length > 0
        ? inProgressModels.reduce((sum, m) => sum + m.trainingProgress, 0) / inProgressModels.length
        : 0;

    // Total training investment
    const totalTrainingCost = models.reduce((sum, m) => sum + (m.trainingCost || 0), 0);

    // Best performing model (highest accuracy)
    const bestModel = models
      .filter((m) => m.benchmarkScores?.accuracy > 0)
      .sort((a, b) => (b.benchmarkScores?.accuracy || 0) - (a.benchmarkScores?.accuracy || 0))[0];

    // Aggregates object
    const aggregates = {
      totalModels,
      trainingModels,
      completedModels,
      deployedModels,
      averageTrainingCost: Math.round(averageTrainingCost * 100) / 100,
      averageProgress: Math.round(averageProgress * 10) / 10,
      totalTrainingCost: Math.round(totalTrainingCost * 100) / 100,
      bestModelAccuracy: bestModel?.benchmarkScores?.accuracy || null,
      bestModelName: bestModel?.name || null,
    };

    // Return company with AI-specific fields, models, and aggregates
    return NextResponse.json({
      company: {
        ...company,
        // Ensure AI fields are included (may be undefined for non-AI companies)
        researchFocus: company.researchFocus || null,
        researchBudget: company.researchBudget || 0,
        researchPoints: company.researchPoints || 0,
        industryRanking: company.industryRanking || null,
        computeType: company.computeType || null,
        gpuCount: company.gpuCount || 0,
        cloudCredits: company.cloudCredits || 0,
        storageCapacity: company.storageCapacity || 0,
        apiCalls: company.apiCalls || 0,
        activeCustomers: company.activeCustomers || 0,
        uptime: company.uptime || 0,
      },
      models,
      aggregates,
    });
  } catch (e) {
    console.error('GET /api/ai/companies/[id] error:', e);
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}
