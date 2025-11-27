/**
 * @fileoverview AI Research Patent Filing API
 * @module app/api/ai/research/projects/[id]/patents
 * 
 * OVERVIEW:
 * API endpoint for filing patents based on AI research breakthroughs. Links research
 * innovations to intellectual property protection.
 * 
 * BUSINESS LOGIC:
 * - Patents must be linked to research project
 * - Claims define scope of patent protection
 * - Filing triggers patent application process (separate Patent model)
 * - Patents can generate licensing revenue
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import AIResearchProject from '@/lib/db/models/AIResearchProject';

/**
 * POST /api/ai/research/projects/[id]/patents
 * 
 * File patent from research
 * 
 * @param request - Contains { title, description, claims[] }
 * @returns 201: Patent filed
 * @returns 400: Validation error
 * @returns 401: Unauthorized
 * @returns 404: Project not found
 * 
 * @example
 * POST /api/ai/research/projects/[id]/patents
 * {
 *   "title": "Method for Optimized Neural Network Training",
 *   "description": "A novel approach to reduce training time...",
 *   "claims": [
 *     "A method for optimizing attention mechanisms in transformer models",
 *     "A system for parallel gradient computation across distributed nodes"
 *   ]
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
    const { title, description, claims } = body;

    // Validate required fields
    if (!title || !description || !claims || !Array.isArray(claims) || claims.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, claims (array with at least one claim)' },
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

    // Generate patent ID
    const patentId = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Add patent matching model interface
    const patent: any = {
      patentId,
      title,
      area: 'Architecture', // Default area, could be parameterized
      filedAt: new Date(),
      status: 'Filed',
      filingCost: 50000, // Standard filing cost
      estimatedValue: 1000000, // Estimated value
      licensingRevenue: 0,
      citations: 0,
    };

    project.patents.push(patent);
    await project.save();

    return NextResponse.json(
      {
        patent: project.patents[project.patents.length - 1],
        project,
        message: 'Patent filed successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error filing patent:', error);

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
