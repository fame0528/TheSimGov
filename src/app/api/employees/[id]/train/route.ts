/**
 * @fileoverview Employee Training API
 * @module app/api/employees/[id]/train
 * 
 * OVERVIEW:
 * Handles employee training program operations.
 * Start training (40h program, $4k cost) and complete training (+10-20 skill points).
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Employee, Company } from '@/lib/db';
import { ApiError } from '@/lib/api/errors';
import { EMPLOYEE_PARAMETERS } from '@/lib/utils/constants';
import { z } from 'zod';

/**
 * Start Training Schema
 * Validates training start requests
 */
const startTrainingSchema = z.object({
  skill: z.enum([
    'technical', 'leadership', 'industry', 'sales',
    'marketing', 'finance', 'operations', 'hr',
    'legal', 'rd', 'quality', 'customer'
  ]),
});

/**
 * POST /api/employees/[id]/train
 * Start training program for employee
 * 
 * REQUEST BODY:
 * - skill: Skill category to train (one of 12 categories)
 * 
 * BUSINESS RULES:
 * - Cannot train if already in training
 * - Costs $4,000 (40h × $100/h)
 * - Deducts cost from company cash immediately
 * - Changes employee status to 'training'
 * - Creates training record (incomplete until PUT)
 * 
 * @param id - Employee ID
 * @returns Updated employee with currentTraining
 * 
 * @example
 * POST /api/employees/673e.../train
 * Body: { skill: "technical" }
 * Response: { id: "...", status: "training", currentTraining: {...}, ... }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError('Unauthorized', 401);
    }

    await connectDB();

    // Parse and validate request body
    const body = await req.json();
    const validationResult = startTrainingSchema.safeParse(body);
    
    if (!validationResult.success) {
      throw new ApiError(
        `Validation failed: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    const { skill } = validationResult.data;

    // Fetch employee and verify ownership
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new ApiError('Employee not found', 404);
    }
    if (employee.userId !== session.user.id) {
      throw new ApiError('Forbidden: You do not own this employee\'s company', 403);
    }

    // Verify company has funds
    const company = await Company.findById(employee.companyId);
    if (!company) {
      throw new ApiError('Company not found', 404);
    }

    const trainingCost = EMPLOYEE_PARAMETERS.TRAINING_COST_PER_HOUR * EMPLOYEE_PARAMETERS.TRAINING_DURATION_HOURS;
    if (company.cash < trainingCost) {
      throw new ApiError(
        `Insufficient funds. Need $${trainingCost.toLocaleString()} for training (have $${company.cash.toLocaleString()})`,
        400
      );
    }

    // Start training (will throw if already training)
    await employee.train(skill);

    // Deduct cost from company
    company.cash -= trainingCost;
    company.expenses += trainingCost;
    await company.save();

    return NextResponse.json({
      id: employee._id.toString(),
      companyId: employee.companyId,
      name: employee.name,
      status: employee.status,
      currentTraining: employee.currentTraining,
      trainingRecords: employee.trainingRecords,
      skills: employee.skills,
      message: `Training started for ${skill} skill. Cost: $${trainingCost.toLocaleString()}`,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    // Handle mongoose/business logic errors
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('POST /api/employees/[id]/train error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/employees/[id]/train
 * Complete current training program
 * 
 * BUSINESS RULES:
 * - Employee must be in active training
 * - Calculates random improvement (10-20 points)
 * - Applies skill increase (capped at 100)
 * - Archives training record
 * - Boosts morale by +5
 * - Changes status back to 'active'
 * 
 * @param id - Employee ID
 * @returns Updated employee with improved skill
 * 
 * @example
 * PUT /api/employees/673e.../train
 * Response: { id: "...", status: "active", skills: { technical: 75 }, improvement: 15, ... }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError('Unauthorized', 401);
    }

    await connectDB();

    // Fetch employee and verify ownership
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new ApiError('Employee not found', 404);
    }
    if (employee.userId !== session.user.id) {
      throw new ApiError('Forbidden: You do not own this employee\'s company', 403);
    }

    // Store skill and old value for response
    const skillBeforeTraining = employee.currentTraining ? 
      employee.skills[employee.currentTraining.skill as keyof typeof employee.skills] : 
      0;

    // Complete training (will throw if no training in progress)
    await employee.completeTraining();

    const improvement = employee.trainingRecords[employee.trainingRecords.length - 1]?.improvement || 0;
    const skillTrained = employee.trainingRecords[employee.trainingRecords.length - 1]?.skill || 'unknown';

    return NextResponse.json({
      id: employee._id.toString(),
      companyId: employee.companyId,
      name: employee.name,
      status: employee.status,
      currentTraining: employee.currentTraining,
      trainingRecords: employee.trainingRecords,
      skills: employee.skills,
      morale: employee.morale,
      skillAverage: employee.skillAverage,
      message: `Training completed! ${skillTrained} improved from ${skillBeforeTraining} to ${employee.skills[skillTrained as keyof typeof employee.skills]} (+${improvement} points)`,
      improvement: {
        skill: skillTrained,
        before: skillBeforeTraining,
        after: employee.skills[skillTrained as keyof typeof employee.skills],
        points: improvement,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    // Handle mongoose/business logic errors
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('PUT /api/employees/[id]/train error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
