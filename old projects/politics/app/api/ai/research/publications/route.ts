/**
 * @file app/api/ai/research/publications/route.ts
 * @description Publication management for research outputs (Phase 4.1)
 * @created 2025-11-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import AIResearchProject from '@/lib/db/models/AIResearchProject';
import Employee from '@/lib/db/models/Employee';
import { estimatePublicationImpact } from '@/lib/utils/ai/researchLab';

/**
 * POST /api/ai/research/publications
 * Publish research findings from breakthrough
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { projectId, breakthroughIndex, venue, venueName } = body;

    if (!projectId || breakthroughIndex === undefined || !venue || !venueName) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, breakthroughIndex, venue, venueName' },
        { status: 400 }
      );
    }

    // Validate venue type
    const validVenues = ['Conference', 'Journal', 'Workshop', 'Preprint'];
    if (!validVenues.includes(venue)) {
      return NextResponse.json(
        { error: 'Invalid venue. Must be: Conference, Journal, Workshop, or Preprint' },
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

    // Validate breakthrough exists
    if (breakthroughIndex < 0 || breakthroughIndex >= project.breakthroughs.length) {
      return NextResponse.json(
        { error: 'Invalid breakthrough index' },
        { status: 422 }
      );
    }

    const breakthrough = project.breakthroughs[breakthroughIndex];

    // Check if publication already exists for this breakthrough
    const existingPublication = project.publications.find(
      p => p.title === `${breakthrough.name}: ${project.name}`
    );

    if (existingPublication) {
      return NextResponse.json(
        { error: 'Publication already created for this breakthrough' },
        { status: 422 }
      );
    }

    // Load researchers for author list
    const researchers = await Employee.find({
      _id: { $in: project.assignedResearchers },
    }).select('firstName lastName');

    const authors = researchers.map(r => `${r.firstName} ${r.lastName}`);

    // Estimate publication impact
    const impactResult = estimatePublicationImpact(
      venue as any,
      venueName,
      breakthrough.area as any,
      breakthrough.noveltyScore
    );

    // Create publication record
    const publicationId = `PUB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const publication = {
      publicationId,
      title: `${breakthrough.name}: ${project.name}`,
      authors,
      venue: venue as 'Conference' | 'Journal' | 'Workshop' | 'Preprint',
      venueName,
      publishedAt: new Date(),
      citations: 0,
      downloads: 0,
    };

    // Add publication to project
    project.publications.push(publication);
    await project.save();

    // Boost company reputation based on publication impact
    const reputationBoost = Math.floor(impactResult.impactScore / 10); // 0-10 points
    company.reputation = Math.min(100, company.reputation + reputationBoost);
    await company.save();

    return NextResponse.json({
      success: true,
      message: `Publication submitted to ${venueName}`,
      publication,
      impact: impactResult,
      reputationBoost,
      companyNewReputation: company.reputation,
    });
  } catch (e) {
    console.error('POST /api/ai/research/publications error:', e);
    return NextResponse.json(
      { error: 'Failed to create publication' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/research/publications?companyId=xxx
 * List all publications for a company
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

    // Aggregate all publications
    const allPublications = projects.flatMap(project =>
      project.publications.map(pub => ({
        ...pub,
        projectId: project._id,
        projectName: project.name,
      }))
    );

    // Calculate totals
    const totalCitations = allPublications.reduce((sum, p) => sum + p.citations, 0);
    const totalDownloads = allPublications.reduce((sum, p) => sum + p.downloads, 0);

    // Group by venue
    const byVenue = {
      Conference: allPublications.filter(p => p.venue === 'Conference').length,
      Journal: allPublications.filter(p => p.venue === 'Journal').length,
      Workshop: allPublications.filter(p => p.venue === 'Workshop').length,
      Preprint: allPublications.filter(p => p.venue === 'Preprint').length,
    };

    // Top cited publications
    const topCited = [...allPublications]
      .sort((a, b) => b.citations - a.citations)
      .slice(0, 10);

    return NextResponse.json({
      companyId,
      companyName: company.name,
      publications: allPublications,
      totalPublications: allPublications.length,
      summary: {
        totalCitations,
        totalDownloads,
        avgCitations: totalCitations / (allPublications.length || 1),
        byVenue,
      },
      topCited,
    });
  } catch (e) {
    console.error('GET /api/ai/research/publications error:', e);
    return NextResponse.json(
      { error: 'Failed to fetch publications' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai/research/publications
 * Update publication metrics (citations, downloads)
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { projectId, publicationId, citationsGained, downloadsGained } = body;

    if (!projectId || !publicationId) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, publicationId' },
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

    // Find publication
    const publicationIndex = project.publications.findIndex(
      p => p.publicationId === publicationId
    );

    if (publicationIndex === -1) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 });
    }

    const publication = project.publications[publicationIndex];

    // Update metrics
    if (citationsGained !== undefined && citationsGained > 0) {
      publication.citations += citationsGained;
    }

    if (downloadsGained !== undefined && downloadsGained > 0) {
      publication.downloads += downloadsGained;
    }

    await project.save();

    return NextResponse.json({
      success: true,
      message: 'Publication metrics updated',
      publication,
    });
  } catch (e) {
    console.error('PATCH /api/ai/research/publications error:', e);
    return NextResponse.json(
      { error: 'Failed to update publication metrics' },
      { status: 500 }
    );
  }
}
