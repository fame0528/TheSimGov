/**
 * @fileoverview AI Research Breakthrough Recording API
 * @module app/api/ai/research/projects/[id]/breakthroughs
 * 
 * OVERVIEW:
 * API endpoint for manually recording research breakthroughs. Breakthroughs represent
 * significant advances in AI capabilities with measurable performance gains.
 * 
 * BUSINESS LOGIC:
 * - Breakthrough types: Algorithmic, Architectural, Dataset, Hardware Optimization
 * - Performance gains: 1-100% improvement in specific metrics
 * - Impact tracking: Breakthroughs can be referenced in patents and publications
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import AIResearchProject from '@/lib/db/models/AIResearchProject';

/**
 * POST /api/ai/research/projects/[id]/breakthroughs
 * 
 * Record research breakthrough
 * 
 * @param request - Contains { name, type, performanceGain, description }
 * @returns 201: Breakthrough recorded
 * @returns 400: Validation error
 * @returns 401: Unauthorized
 * @returns 404: Project not found
 * 
 * @example
 * POST /api/ai/research/projects/[id]/breakthroughs
 * {
 *   "name": "Transformer Architecture Optimization",
 *   "type": "Architectural",
 *   "performanceGain": 35,
 *   "description": "Novel attention mechanism reduces training time by 35%"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await dbConnect();

    const projectId = params.id;
    const body = await request.json();
    const { name, type, performanceGain, description } = body;

    // Validate required fields
    if (!name || !type || performanceGain === undefined || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, performanceGain, description' },
        { status: 400 }
      );
    }

    // Validate performance gain range
    if (performanceGain < 1 || performanceGain > 100) {
      return NextResponse.json(
        { error: 'Invalid performanceGain - Must be between 1 and 100%' },
        { status: 400 }
      );
    }

    const project = await AIResearchProject.findById(projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Research project not found', projectId },
        { status: 404 }
      );
    }

    // Add breakthrough matching model interface
    const breakthrough: any = {
      name,
      area: type, // Map 'type' to 'area'
      discoveredAt: new Date(),
      noveltyScore: 75, // Default novelty score
      performanceGainPercent: performanceGain,
      efficiencyGainPercent: 0,
      patentable: performanceGain > 15, // High-gain breakthroughs are patentable
      estimatedPatentValue: performanceGain > 15 ? 500000 : 0,
    };

    project.breakthroughs.push(breakthrough);
    await project.save();

    return NextResponse.json(
      {
        breakthrough: project.breakthroughs[project.breakthroughs.length - 1],
        project,
        message: 'Breakthrough recorded successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error recording breakthrough:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: Object.values(error.errors).map((e: any) => e.message),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
