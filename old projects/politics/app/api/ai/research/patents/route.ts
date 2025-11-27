/**
 * @file app/api/ai/research/patents/route.ts
 * @description Patent filing and management (Phase 4.1)
 * @created 2025-11-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import AIResearchProject from '@/lib/db/models/AIResearchProject';
import { calculatePatentFilingCost } from '@/lib/utils/ai/researchLab';

/**
 * POST /api/ai/research/patents
 * File patent from breakthrough discovery
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { projectId, breakthroughIndex, international, jurisdictions } = body;

    if (projectId === undefined || breakthroughIndex === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, breakthroughIndex' },
        { status: 400 }
      );
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

    // Validate breakthrough exists
    if (breakthroughIndex < 0 || breakthroughIndex >= project.breakthroughs.length) {
      return NextResponse.json(
        { error: 'Invalid breakthrough index' },
        { status: 422 }
      );
    }

    const breakthrough = project.breakthroughs[breakthroughIndex];

    // Check if breakthrough is patentable
    if (!breakthrough.patentable) {
      return NextResponse.json(
        {
          error: 'Breakthrough is not patentable',
          details: 'Insufficient novelty or impact for patent filing',
        },
        { status: 422 }
      );
    }

    // Check if patent already filed for this breakthrough
    const existingPatent = project.patents.find(
      p => p.title === `${breakthrough.name} Patent`
    );

    if (existingPatent) {
      return NextResponse.json(
        { error: 'Patent already filed for this breakthrough' },
        { status: 422 }
      );
    }

    // Calculate filing cost
    const costResult = calculatePatentFilingCost(
      breakthrough.area,
      international || false,
      jurisdictions || []
    );

    // Check if company has sufficient funds
    if (company.cash < costResult.totalCost) {
      return NextResponse.json(
        {
          error: 'Insufficient funds for patent filing',
          required: costResult.totalCost,
          available: company.cash,
        },
        { status: 422 }
      );
    }

    // Deduct filing cost
    company.cash -= costResult.totalCost;
    await company.save();

    // Create patent record
    const patentId = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const patent = {
      patentId,
      title: `${breakthrough.name} Patent`,
      area: breakthrough.area,
      filedAt: new Date(),
      status: 'Filed' as const,
      filingCost: costResult.totalCost,
      estimatedValue: breakthrough.estimatedPatentValue,
      licensingRevenue: 0,
      citations: 0,
    };

    // Add patent to project
    project.patents.push(patent);
    await project.save();

    return NextResponse.json({
      success: true,
      message: 'Patent filed successfully',
      patent,
      costs: costResult,
      timeline: costResult.timeline,
      companyRemainingCash: company.cash,
    });
  } catch (e) {
    console.error('POST /api/ai/research/patents error:', e);
    return NextResponse.json(
      { error: 'Failed to file patent' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/research/patents?companyId=xxx
 * List all patents for a company
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId parameter' }, { status: 400 });
    }

    // Verify ownership
    const company = await Company.findOne({
      _id: companyId,
      owner: session.user.id,
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found or unauthorized' },
        { status: 403 }
      );
    }

    // Load all research projects for company
    const projects = await AIResearchProject.find({ company: companyId });

    // Aggregate all patents
    const allPatents = projects.flatMap(project =>
      project.patents.map(patent => ({
        ...patent,
        projectId: project._id,
        projectName: project.name,
      }))
    );

    // Calculate totals
    const totalValue = allPatents.reduce((sum, p) => sum + p.estimatedValue, 0);
    const totalRevenue = allPatents.reduce((sum, p) => sum + p.licensingRevenue, 0);
    const totalCitations = allPatents.reduce((sum, p) => sum + p.citations, 0);

    // Group by status
    const byStatus = {
      Filed: allPatents.filter(p => p.status === 'Filed').length,
      UnderReview: allPatents.filter(p => p.status === 'UnderReview').length,
      Approved: allPatents.filter(p => p.status === 'Approved').length,
      Rejected: allPatents.filter(p => p.status === 'Rejected').length,
    };

    return NextResponse.json({
      companyId,
      companyName: company.name,
      patents: allPatents,
      totalPatents: allPatents.length,
      summary: {
        totalEstimatedValue: totalValue,
        totalLicensingRevenue: totalRevenue,
        totalCitations: totalCitations,
        byStatus,
      },
    });
  } catch (e) {
    console.error('GET /api/ai/research/patents error:', e);
    return NextResponse.json(
      { error: 'Failed to fetch patents' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai/research/patents
 * Update patent status (for game simulation of USPTO approval)
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { projectId, patentId, newStatus } = body;

    if (!projectId || !patentId || !newStatus) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, patentId, newStatus' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['Filed', 'UnderReview', 'Approved', 'Rejected'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: Filed, UnderReview, Approved, or Rejected' },
        { status: 422 }
      );
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

    // Find patent
    const patentIndex = project.patents.findIndex(p => p.patentId === patentId);
    if (patentIndex === -1) {
      return NextResponse.json({ error: 'Patent not found' }, { status: 404 });
    }

    const patent = project.patents[patentIndex];

    // Update status
    patent.status = newStatus as 'Filed' | 'UnderReview' | 'Approved' | 'Rejected';

    // Set approval date if approved
    if (newStatus === 'Approved') {
      patent.approvedAt = new Date();
    }

    await project.save();

    return NextResponse.json({
      success: true,
      message: `Patent status updated to ${newStatus}`,
      patent,
    });
  } catch (e) {
    console.error('PATCH /api/ai/research/patents error:', e);
    return NextResponse.json(
      { error: 'Failed to update patent status' },
      { status: 500 }
    );
  }
}
