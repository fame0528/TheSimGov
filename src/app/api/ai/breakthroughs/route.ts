/**
 * @fileoverview AI Breakthrough Discovery API Routes
 * @module app/api/ai/breakthroughs
 * 
 * OVERVIEW:
 * REST API for AI research breakthrough discovery and management.
 * Handles probability-based breakthrough attempts and breakthrough listing.
 * 
 * @created 2025-11-22
 * @author ECHO v1.3.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Breakthrough from '@/lib/db/models/Breakthrough';
import AIResearchProject from '@/lib/db/models/AIResearchProject';
import Company from '@/lib/db/models/Company';
import Employee from '@/lib/db/models/Employee';
import {
  calculateBreakthroughDiscoveryProbability,
  generateBreakthroughDetails,
} from '@/lib/utils/ai';
import type { BreakthroughArea } from '@/lib/utils/ai/breakthroughCalculations';

/**
 * POST /api/ai/breakthroughs
 * 
 * Attempt breakthrough discovery for research project
 * 
 * Request Body:
 * - projectId: Research project ID
 * - computeBudgetUSD: Compute budget allocated for attempt ($)
 * 
 * Response:
 * - success: Whether breakthrough discovered
 * - breakthrough: Breakthrough details (if successful)
 * - probability: Calculated discovery probability
 * - roll: Random roll result (0-1)
 * - message: Result message
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { projectId, computeBudgetUSD } = body;

    // Validation
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }
    if (!computeBudgetUSD || computeBudgetUSD < 1000) {
      return NextResponse.json(
        { error: 'Compute budget must be at least $1,000' },
        { status: 400 }
      );
    }

    await connectDB();

    // Load research project with company
    const project = await AIResearchProject.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Research project not found' }, { status: 404 });
    }

    // Load company
    const company = await Company.findById(project.company);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });}

    // Ownership check
    if (company.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not own this company' },
        { status: 403 }
      );
    }

    // Project status check
    if (project.status !== 'InProgress') {
      return NextResponse.json(
        { error: 'Project must be InProgress to attempt breakthroughs' },
        { status: 400 }
      );
    }

    // Load researchers for skill calculation
    const researchers = await Employee.find({
      _id: { $in: project.assignedResearchers },
    });

    if (researchers.length === 0) {
      return NextResponse.json(
        { error: 'Project has no assigned researchers' },
        { status: 400 }
      );
    }

    // Calculate average researcher skill
    const avgSkill = researchers.reduce((sum: number, r: any) => sum + r.skill, 0) / researchers.length;

    // Calculate breakthrough probability
    const area = project.type as BreakthroughArea;
    const { probability, baseProbability, budgetMultiplier, skillMultiplier } =
      calculateBreakthroughDiscoveryProbability(area, computeBudgetUSD, avgSkill);

    // Random roll (0-1)
    const roll = Math.random();

    // Check if breakthrough discovered
    if (roll > probability) {
      return NextResponse.json({
        success: false,
        breakthrough: null,
        probability,
        baseProbability,
        budgetMultiplier,
        skillMultiplier,
        roll,
        message: `Breakthrough attempt failed. Rolled ${roll.toFixed(4)} vs ${probability.toFixed(4)} probability.`,
      });
    }

    // SUCCESS! Generate breakthrough details
    const performanceGain = Math.random() * 20; // 0-20%
    const efficiencyGain = Math.random() * 50;  // 0-50%

    const breakthroughDetails = generateBreakthroughDetails(
      `${project.name} Breakthrough`,
      area,
      performanceGain,
      efficiencyGain
    );

    // Create breakthrough document
    const breakthrough = await Breakthrough.create({
      companyId: company.id,
      projectId: project.id,
      name: breakthroughDetails.name,
      area: breakthroughDetails.area,
      description: `Discovered during ${project.name} with $${computeBudgetUSD.toLocaleString()} compute budget.`,
      discoveredAt: breakthroughDetails.discoveredAt,
      discoveredBy: project.assignedResearchers,
      noveltyScore: breakthroughDetails.noveltyScore,
      performanceGainPercent: breakthroughDetails.performanceGainPercent,
      efficiencyGainPercent: breakthroughDetails.efficiencyGainPercent,
      patentable: breakthroughDetails.patentable,
      estimatedPatentValue: breakthroughDetails.estimatedPatentValue,
      patentFiled: false,
      publicationReady: true, // Available for publication immediately
    });

    // Deduct compute budget from company cash
    company.cash -= computeBudgetUSD;
    await company.save();

    return NextResponse.json({
      success: true,
      breakthrough,
      probability,
      baseProbability,
      budgetMultiplier,
      skillMultiplier,
      roll,
      message: `🎉 Breakthrough discovered! Novelty: ${breakthrough.noveltyScore}/100, Patentable: ${breakthrough.patentable}`,
      computeCost: computeBudgetUSD,
      remainingCash: company.cash,
    });
  } catch (error) {
    console.error('Breakthrough discovery error:', error);
    return NextResponse.json(
      { error: 'Internal server error during breakthrough discovery' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/breakthroughs?companyId=xxx&projectId=xxx
 * 
 * List breakthroughs for company or project
 * 
 * Query Params:
 * - companyId: Filter by company (optional)
 * - projectId: Filter by project (optional)
 * 
 * Response:
 * - breakthroughs: Array of breakthrough objects
 * - totalCount: Total breakthrough count
 * - patentableCount: Count of patentable but unfiled breakthroughs
 * - totalEstimatedValue: Sum of estimated patent values
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const projectId = searchParams.get('projectId');

    await connectDB();

    // Build query filter
    const filter: any = {};

    if (projectId) {
      filter.projectId = projectId;
      
      // Verify project ownership
      const project = await AIResearchProject.findById(projectId);
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      
      const company = await Company.findById(project.company);
      if (!company || company.userId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else if (companyId) {
      filter.companyId = companyId;
      
      // Verify company ownership
      const company = await Company.findById(companyId);
      if (!company) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }
      if (company.userId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else {
      return NextResponse.json(
        { error: 'Either companyId or projectId required' },
        { status: 400 }
      );
    }

    // Get breakthroughs
    const breakthroughs = await Breakthrough.find(filter).sort({ createdAt: -1 });

    // Calculate aggregations
    const totalCount = breakthroughs.length;
    const patentableCount = breakthroughs.filter(b => b.patentable && !b.patentFiled).length;
    const totalEstimatedValue = breakthroughs.reduce(
      (sum, b) => sum + (b.estimatedPatentValue || 0),
      0
    );

    return NextResponse.json({
      breakthroughs,
      totalCount,
      patentableCount,
      totalEstimatedValue,
    });
  } catch (error) {
    console.error('List breakthroughs error:', error);
    return NextResponse.json(
      { error: 'Internal server error listing breakthroughs' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Probability-Based Discovery**: Uses calculateBreakthroughDiscoveryProbability utility
 * 2. **Random Roll**: Math.random() vs calculated probability (realistic discovery simulation)
 * 3. **Breakthrough Generation**: Uses generateBreakthroughDetails utility for complete object
 * 4. **Ownership Validation**: Checks company owner === session.user.id
 * 5. **Project Status**: Only allows InProgress projects (not Completed/Cancelled)
 * 6. **Researcher Skills**: Loads researchers, calculates average skill for probability
 * 7. **Cost Deduction**: Deducts computeBudgetUSD from company.cash
 * 8. **Publication Ready**: Breakthroughs marked publicationReady immediately
 * 
 * REALISM:
 * - Requires minimum $1,000 compute budget (prevents spam)
 * - Average researcher skill impacts probability (elite teams more likely to succeed)
 * - Random roll creates realistic variability (not guaranteed)
 * - Performance gains 0-20%, efficiency gains 0-50% (realistic ranges)
 * 
 * PREVENTS:
 * - Unauthorized breakthrough creation (ownership check)
 * - Breakthrough attempts on completed/cancelled projects
 * - Breakthrough attempts without researchers
 * - Unrealistic compute budgets (<$1k)
 * 
 * REUSE:
 * - Follows legacy breakthrough/route.ts pattern (probability-based discovery)
 * - Uses calculateBreakthroughDiscoveryProbability utility (NOT embedded logic)
 * - Uses generateBreakthroughDetails utility (NOT embedded logic)
 * - Follows existing API patterns (auth check, ownership check, error handling)
 */
