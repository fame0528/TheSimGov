/**
 * @file app/api/departments/rd/projects/route.ts
 * @description API routes for R&D project management
 * @created 2025-11-13
 * 
 * ENDPOINTS:
 * - GET  /api/departments/rd/projects?companyId=xxx - Get R&D projects
 * - POST /api/departments/rd/projects               - Create R&D project
 * 
 * REQUEST/RESPONSE CONTRACTS:
 * 
 * GET /api/departments/rd/projects?companyId=xxx&status=Research
 * Response: { projects: IResearchProject[], activeProjects: number }
 * 
 * POST /api/departments/rd/projects
 * Request: {
 *   companyId, departmentId, name, projectType, priority, budget,
 *   duration, leadResearcher, teamSize, innovationScore, technologyLevel
 * }
 * Response: { project: IResearchProject, breakthrough: BreakthroughCheckResult }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import ResearchProject from '@/lib/db/models/ResearchProject';
import Department from '@/lib/db/models/Department';
import Company from '@/lib/db/models/Company';
import { checkForBreakthrough } from '@/lib/utils/rd/innovationQueue';

/**
 * GET /api/departments/rd/projects
 * Get R&D projects for a company
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build query
    const query: { [key: string]: unknown } = { company: companyId };
    if (departmentId) {
      query.department = departmentId;
    }
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }

    const projects = await ResearchProject.find(query)
      .populate('department', 'name type')
      .populate('leadResearcher', 'name position')
      .sort({ priority: -1, createdAt: -1 });

    const activeProjects = projects.filter((p) =>
      ['Research', 'Development', 'Testing'].includes(p.status)
    ).length;

    return NextResponse.json({
      projects,
      activeProjects,
    });
  } catch (error) {
    console.error('GET /api/departments/rd/projects error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/departments/rd/projects
 * Create a new R&D project
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      companyId,
      departmentId,
      name,
      projectType,
      priority = 'Medium',
      budget,
      duration,
      leadResearcher,
      teamSize = 1,
      innovationScore = 50,
      technologyLevel = 5,
      requiredSkills = ['research', 'technical'],
    } = body;

    // Validate required fields
    if (
      !companyId ||
      !departmentId ||
      !name ||
      !projectType ||
      !budget ||
      !duration ||
      !leadResearcher
    ) {
      return NextResponse.json(
        {
          error:
            'Company ID, department ID, name, project type, budget, duration, and lead researcher are required',
        },
        { status: 400 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify department
    const department = await Department.findById(departmentId);
    if (!department || department.type !== 'rd') {
      return NextResponse.json(
        { error: 'R&D department not found' },
        { status: 404 }
      );
    }

    // Check budget availability
    if (department.budget < budget) {
      return NextResponse.json(
        { error: 'Insufficient department budget for project' },
        { status: 400 }
      );
    }

    // Calculate dates
    const startDate = new Date();
    const estimatedCompletion = new Date();
    estimatedCompletion.setMonth(estimatedCompletion.getMonth() + duration);

    // Create project
    const project = await ResearchProject.create({
      company: companyId,
      department: departmentId,
      name,
      projectType,
      status: 'Concept',
      priority,
      budget,
      spent: 0,
      startDate,
      estimatedCompletion,
      duration,
      phase: 'Concept',
      progress: 0,
      researchProgress: 0,
      developmentProgress: 0,
      testingProgress: 0,
      milestones: [
        { name: 'Initial Research', completed: false },
        { name: 'Prototype Development', completed: false },
        { name: 'Testing & Validation', completed: false },
        { name: 'Commercialization', completed: false },
      ],
      leadResearcher,
      teamSize,
      requiredSkills,
      teamSkillLevel: 50,
      innovationScore,
      technologyLevel,
      breakthroughPotential: Math.min(100, innovationScore * 0.6 + technologyLevel * 4),
      breakthroughAchieved: false,
      breakthroughType: 'None',
      patentsPending: 0,
      patentsGranted: 0,
      intellectualProperty: [],
      fundingSource: 'Internal',
    });

    // Calculate initial breakthrough probability
    const breakthroughCheck = checkForBreakthrough({
      innovationScore,
      teamSkillLevel: 50,
      technologyLevel,
      budgetAdequacy: 0.1,
      researchProgress: 0,
    });

    // Update department active projects count
    await Department.findByIdAndUpdate(departmentId, {
      $inc: { activeProjects: 1 },
    });

    return NextResponse.json(
      {
        project,
        breakthrough: {
          probability: breakthroughCheck.probability,
          potentialImpact: breakthroughCheck.impact,
        },
        message: 'R&D project created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/departments/rd/projects error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create project' },
      { status: 500 }
    );
  }
}
