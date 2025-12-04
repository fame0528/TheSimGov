/**
 * @fileoverview HR Training Programs API Route
 * @module app/api/departments/hr/training/route
 * 
 * OVERVIEW:
 * POST endpoint to create employee training programs.
 * Improves workforce skills and unlocks advanced capabilities.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Department from '@/lib/db/models/Department';
import { connectDB } from '@/lib/db';
import { CreateTrainingProgramSchema } from '@/lib/validations/department';
import type { TrainingProgram } from '@/lib/types/department';

/**
 * POST /api/departments/hr/training
 * 
 * Creates a new employee training program to improve specific skills.
 * Deducts cost from HR department budget.
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * 
 * BODY: CreateTrainingProgramSchema
 * ```ts
 * {
 *   companyId: string;
 *   name: string; // 3-100 characters
 *   skillTarget: string; // Skill to improve
 *   duration: number; // 1-52 weeks
 *   cost: number; // 100 - 100,000
 *   capacity: number; // 1-100 employees
 * }
 * ```
 * 
 * RESPONSE:
 * - 200: Training program created
 * - 400: Invalid input or insufficient budget
 * - 401: Unauthorized (no session)
 * - 404: HR department not found
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
    const validationResult = CreateTrainingProgramSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid training program data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const programInput = validationResult.data;

    if (programInput.companyId !== companyId) {
      return NextResponse.json({ error: 'Cannot create training for another company' }, { status: 403 });
    }

    await connectDB();

    const hr = await Department.findOne({ companyId, type: 'hr' });
    if (!hr) {
      return NextResponse.json({ error: 'HR department not found' }, { status: 404 });
    }

    if (!hr.canAfford(programInput.cost)) {
      return NextResponse.json(
        { error: 'Insufficient HR budget', available: hr.budget, required: programInput.cost },
        { status: 400 }
      );
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + (programInput.duration * 7)); // Weeks to days

    const program: TrainingProgram = {
      id: `train_${Date.now()}`,
      companyId: programInput.companyId,
      name: programInput.name,
      skillTarget: programInput.skillTarget,
      duration: programInput.duration,
      cost: programInput.cost,
      capacity: programInput.capacity,
      enrolled: 0,
      startDate: now,
      endDate,
      status: 'scheduled',
    };

    hr.trainingPrograms = hr.trainingPrograms || [];
    // Push program - companyId as string matches runtime behavior
    hr.trainingPrograms.push(program as unknown as typeof hr.trainingPrograms[number]);
    hr.budget -= programInput.cost;

    await hr.save();

    return NextResponse.json(
      { program, message: `Training program '${program.name}' created`, remainingBudget: hr.budget },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/departments/hr/training] Error:', error);
    return NextResponse.json({ error: 'Failed to create training program' }, { status: 500 });
  }
}
