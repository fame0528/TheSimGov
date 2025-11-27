/**
 * @file app/api/ai/research/breakthrough/route.ts
 * @description Research breakthrough detection and tracking (Phase 4.1)
 * @created 2025-11-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import AIResearchProject from '@/lib/db/models/AIResearchProject';
import Employee from '@/lib/db/models/Employee';
import { calculateBreakthroughProbability, isPatentable } from '@/lib/utils/ai/researchLab';

/**
 * POST /api/ai/research/breakthrough
 * Attempt breakthrough discovery during research project
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { projectId, computeBudgetUSD } = body;

    if (!projectId || !computeBudgetUSD) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, computeBudgetUSD' },
        { status: 400 }
      );
    }

    // Validate compute budget
    if (computeBudgetUSD < 0) {
      return NextResponse.json(
        { error: 'Compute budget must be non-negative' },
        { status: 422 }
      );
    }

    // Load research project with company ownership check
    const project = await AIResearchProject.findById(projectId).populate('company');
    if (!project) {
      return NextResponse.json({ error: 'Research project not found' }, { status: 404 });
    }

    const company = await Company.findOne({
      _id: project.company,
      owner: session.user.id,
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found or unauthorized' },
        { status: 403 }
      );
    }

    // Project must be in progress
    if (project.status !== 'InProgress') {
      return NextResponse.json(
        { error: `Project status is ${project.status}, must be InProgress` },
        { status: 422 }
      );
    }

    // Load assigned researchers to get skill levels
    const researchers = await Employee.find({
      _id: { $in: project.assignedResearchers },
    }).select('research');

    if (researchers.length === 0) {
      return NextResponse.json(
        { error: 'No researchers assigned to project' },
        { status: 422 }
      );
    }

    // Calculate average researcher skill
    const researcherSkills = researchers.map(r => r.research || 50);
    const avgSkill =
      researcherSkills.reduce((sum, skill) => sum + skill, 0) / researcherSkills.length;

    // Map research type to area
    const areaMap: Record<string, any> = {
      Performance: 'Performance',
      Efficiency: 'Efficiency',
      NewCapability: 'Multimodal',
    };
    const area = areaMap[project.type] || 'Performance';

    // Calculate breakthrough probability
    const probabilityResult = calculateBreakthroughProbability(
      area,
      computeBudgetUSD,
      avgSkill
    );

    // Roll for breakthrough (random 0-1 vs probability)
    const roll = Math.random();
    const breakthroughOccurred = roll <= probabilityResult.probability;

    if (!breakthroughOccurred) {
      return NextResponse.json({
        success: false,
        breakthrough: false,
        message: 'No breakthrough discovered this cycle',
        probability: probabilityResult,
        roll: Math.round(roll * 10000) / 10000,
      });
    }

    // Breakthrough discovered! Generate details
    const noveltyScore = Math.floor(Math.random() * 30) + 70; // 70-100 range
    const performanceGainPercent = Math.random() * 20; // 0-20%
    const efficiencyGainPercent = Math.random() * 50; // 0-50%

    // Check if patentable
    const patentableResult = isPatentable(
      area,
      noveltyScore,
      performanceGainPercent,
      efficiencyGainPercent
    );

    // Create breakthrough record
    const breakthrough = {
      name: `${project.name} Breakthrough`,
      area,
      discoveredAt: new Date(),
      noveltyScore,
      performanceGainPercent: Math.round(performanceGainPercent * 100) / 100,
      efficiencyGainPercent: Math.round(efficiencyGainPercent * 100) / 100,
      patentable: patentableResult.patentable,
      estimatedPatentValue: patentableResult.estimatedValue,
    };

    // Add breakthrough to project
    project.breakthroughs.push(breakthrough);
    await project.save();

    return NextResponse.json({
      success: true,
      breakthrough: true,
      message: '🎉 Breakthrough discovered!',
      probability: probabilityResult,
      roll: Math.round(roll * 10000) / 10000,
      breakthroughDetails: breakthrough,
      patentability: patentableResult,
    });
  } catch (e) {
    console.error('POST /api/ai/research/breakthrough error:', e);
    return NextResponse.json(
      { error: 'Failed to process breakthrough attempt' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/research/breakthrough?projectId=xxx
 * List all breakthroughs for a research project
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId parameter' }, { status: 400 });
    }

    // Load project with ownership check
    const project = await AIResearchProject.findById(projectId).populate('company');
    if (!project) {
      return NextResponse.json({ error: 'Research project not found' }, { status: 404 });
    }

    const company = await Company.findOne({
      _id: project.company,
      owner: session.user.id,
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found or unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      projectId: project._id,
      projectName: project.name,
      breakthroughs: project.breakthroughs,
      totalBreakthroughs: project.breakthroughs.length,
      patentableBreakthroughs: project.breakthroughs.filter(b => b.patentable).length,
    });
  } catch (e) {
    console.error('GET /api/ai/research/breakthrough error:', e);
    return NextResponse.json(
      { error: 'Failed to fetch breakthroughs' },
      { status: 500 }
    );
  }
}
