/**
 * @fileoverview Manual Breakthrough Entry API Route
 * @module app/api/ai/projects/[id]/breakthroughs
 * 
 * OVERVIEW:
 * REST API for manually recording breakthroughs on research projects.
 * Alternative to probability-based discovery for UI-driven breakthrough creation.
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
import { calculateNoveltyScore, isPatentable } from '@/lib/utils/ai';
import type { BreakthroughArea } from '@/lib/utils/ai/breakthroughCalculations';

/**
 * POST /api/ai/projects/[id]/breakthroughs
 * 
 * Manually record breakthrough for research project
 * 
 * Request Body:
 * - name: Breakthrough name
 * - area: Research area (Performance/Efficiency/Alignment/etc.)
 * - performanceGainPercent: Performance improvement (0-100%)
 * - efficiencyGainPercent: Efficiency improvement (0-100%)
 * - description: Optional description
 * 
 * Response:
 * - breakthrough: Created breakthrough object
 * - message: Success message
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      area,
      performanceGainPercent,
      efficiencyGainPercent,
      description,
    } = body;

    // Validation
    if (!name || !area) {
      return NextResponse.json(
        { error: 'Name and area required' },
        { status: 400 }
      );
    }

    if (
      performanceGainPercent === undefined ||
      performanceGainPercent < 0 ||
      performanceGainPercent > 100
    ) {
      return NextResponse.json(
        { error: 'Performance gain must be 0-100%' },
        { status: 400 }
      );
    }

    if (
      efficiencyGainPercent === undefined ||
      efficiencyGainPercent < 0 ||
      efficiencyGainPercent > 100
    ) {
      return NextResponse.json(
        { error: 'Efficiency gain must be 0-100%' },
        { status: 400 }
      );
    }

    const validAreas: BreakthroughArea[] = [
      'Performance',
      'Efficiency',
      'Alignment',
      'Multimodal',
      'Reasoning',
      'Architecture',
    ];

    if (!validAreas.includes(area)) {
      return NextResponse.json(
        { error: `Invalid area. Must be one of: ${validAreas.join(', ')}` },
        { status: 400 }
      );
    }

    await connectDB();

    const { id } = await params;
    const projectId = id;

    // Load research project
    const project = await AIResearchProject.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Research project not found' }, { status: 404 });
    }

    // Load company
    const company = await Company.findById(project.company);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Ownership check
    if (company.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not own this company' },
        { status: 403 }
      );
    }

    // Calculate novelty score
    const noveltyScore = calculateNoveltyScore(
      area,
      performanceGainPercent,
      efficiencyGainPercent
    );

    // Check patentability
    const patentability = isPatentable(
      area,
      noveltyScore,
      performanceGainPercent,
      efficiencyGainPercent
    );

    // Create breakthrough
    const breakthrough = await Breakthrough.create({
      companyId: company.id,
      projectId: project.id,
      name,
      area,
      description: description || `Manually recorded breakthrough on ${project.name}.`,
      discoveredAt: new Date(),
      discoveredBy: project.assignedResearchers,
      noveltyScore,
      performanceGainPercent,
      efficiencyGainPercent,
      patentable: patentability.patentable,
      estimatedPatentValue: patentability.estimatedValue,
      patentFiled: false,
      publicationReady: true,
    });

    return NextResponse.json({
      breakthrough,
      message: `Breakthrough "${name}" recorded successfully.`,
      noveltyScore,
      patentability: {
        patentable: patentability.patentable,
        estimatedValue: patentability.estimatedValue,
        reason: patentability.reason,
      },
    });
  } catch (error) {
    console.error('Manual breakthrough entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error recording breakthrough' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Manual Entry**: User-driven breakthrough creation (not probability-based)
 * 2. **Validation**: Enforces 0-100% ranges for performance/efficiency gains
 * 3. **Novelty Calculation**: Uses calculateNoveltyScore utility (NOT embedded)
 * 4. **Patentability Check**: Uses isPatentable utility (NOT embedded)
 * 5. **Ownership Validation**: Checks company owner === session.user.id
 * 6. **Area Validation**: Enforces valid BreakthroughArea enum values
 * 
 * USE CASE:
 * - User wants to record breakthrough manually (not discovery simulation)
 * - Frontend form collects name, area, gains
 * - Alternative to POST /api/ai/breakthroughs (probability-based)
 * 
 * PREVENTS:
 * - Invalid performance/efficiency percentages (enforces 0-100%)
 * - Invalid research areas (enum validation)
 * - Unauthorized breakthrough creation (ownership check)
 * 
 * REUSE:
 * - Follows legacy projects/[id]/breakthroughs/route.ts pattern (manual entry)
 * - Uses calculateNoveltyScore utility (NOT embedded logic)
 * - Uses isPatentable utility (NOT embedded logic)
 * - Follows existing API patterns (auth check, ownership check, error handling)
 */
