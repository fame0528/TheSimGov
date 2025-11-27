/**
 * @fileoverview R&D Research Projects API Route
 * @module app/api/departments/rd/research/route
 * 
 * OVERVIEW:
 * POST endpoint to launch research projects for innovation and patents.
 * Improves technology level and unlocks advanced features.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Department from '@/lib/db/models/Department';
import { connectDB } from '@/lib/db';
import { CreateResearchProjectSchema } from '@/lib/validations/department';
import type { ResearchProject } from '@/lib/types/department';

/**
 * POST /api/departments/rd/research
 * 
 * Launches a research project to develop new products, processes, or technologies.
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * 
 * BODY: CreateResearchProjectSchema
 * ```ts
 * {
 *   companyId: string;
 *   name: string; // 3-100 characters
 *   category: 'product' | 'process' | 'technology' | 'sustainability';
 *   budget: number; // 10,000 - 5,000,000
 *   duration: number; // 4-104 weeks (1-24 months)
 *   successChance: number; // 10-95%
 *   potentialImpact: number; // 1-5 (impact score)
 * }
 * ```
 * 
 * RESPONSE:
 * - 200: Research project created
 * - 400: Invalid input or insufficient budget
 * - 401: Unauthorized
 * - 404: R&D department not found
 * - 500: Server error
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'No company associated with this user' }, { status: 400 });
    }

    const body = await req.json();
    const validationResult = CreateResearchProjectSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid research project data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const projectInput = validationResult.data;

    if (projectInput.companyId !== companyId) {
      return NextResponse.json({ error: 'Cannot create research for another company' }, { status: 403 });
    }

    await connectDB();

    const rd = await Department.findOne({ companyId, type: 'rd' });
    if (!rd) {
      return NextResponse.json({ error: 'R&D department not found' }, { status: 404 });
    }

    if (!rd.canAfford(projectInput.budget)) {
      return NextResponse.json(
        { error: 'Insufficient R&D budget', available: rd.budget, required: projectInput.budget },
        { status: 400 }
      );
    }

    const now = new Date();

    const project: ResearchProject = {
      id: `research_${Date.now()}`,
      companyId: projectInput.companyId,
      name: projectInput.name,
      category: projectInput.category,
      budget: projectInput.budget,
      duration: projectInput.duration,
      progress: 0,
      successChance: projectInput.successChance,
      potentialImpact: projectInput.potentialImpact,
      startDate: now,
      status: 'active',
    };

    rd.researchProjects = rd.researchProjects || [];
    rd.researchProjects.push(project as any);
    rd.budget -= projectInput.budget;

    await rd.save();

    return NextResponse.json(
      { 
        project, 
        message: `Research project '${project.name}' launched with ${project.successChance}% success chance`,
        remainingBudget: rd.budget 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/departments/rd/research] Error:', error);
    return NextResponse.json({ error: 'Failed to create research project' }, { status: 500 });
  }
}
