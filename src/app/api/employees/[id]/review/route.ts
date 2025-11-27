/**
 * @fileoverview Employee Performance Review API
 * @module app/api/employees/[id]/review
 * 
 * OVERVIEW:
 * Handles employee performance review operations.
 * Conducts reviews with scores, feedback, morale impact, and salary adjustments.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Employee } from '@/lib/db';
import { ApiError } from '@/lib/api/errors';
import { z } from 'zod';

/**
 * Conduct Review Schema
 * Validates performance review requests
 */
const conductReviewSchema = z.object({
  overallScore: z.number().min(1).max(100),
  feedback: z.array(z.string()).min(1).max(10),
});

/**
 * POST /api/employees/[id]/review
 * Conduct performance review for employee
 * 
 * REQUEST BODY:
 * - overallScore: Performance score (1-100)
 * - feedback: Array of feedback strings (1-10 items)
 * 
 * BUSINESS RULES:
 * - Score >= 90: +15 morale, 5% raise
 * - Score >= 75: +10 morale, 5% raise
 * - Score >= 60: +5 morale, no raise
 * - Score >= 50: 0 morale, no raise
 * - Score < 50: -10 morale, no raise
 * 
 * FEEDBACK PROCESSING:
 * - Even indices: Strengths
 * - Odd indices: Areas for improvement
 * 
 * @param id - Employee ID
 * @returns Updated employee with new review
 * 
 * @example
 * POST /api/employees/673e.../review
 * Body: { 
 *   overallScore: 85, 
 *   feedback: ["Great technical skills", "Improve communication", "Strong teamwork"]
 * }
 * Response: { 
 *   id: "...", 
 *   morale: 82, 
 *   salary: 84000, 
 *   reviews: [...], 
 *   review: { score: 85, moraleImpact: 10, salaryAdjustment: 4000 }
 * }
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
    const validationResult = conductReviewSchema.safeParse(body);
    
    if (!validationResult.success) {
      throw new ApiError(
        `Validation failed: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    const { overallScore, feedback } = validationResult.data;

    // Fetch employee and verify ownership
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new ApiError('Employee not found', 404);
    }
    if (employee.userId !== session.user.id) {
      throw new ApiError('Forbidden: You do not own this employee\'s company', 403);
    }

    // Store values before review
    const moraleBeforeReview = employee.morale;
    const salaryBeforeReview = employee.salary;

    // Conduct review
    await employee.conductReview(session.user.id, overallScore, feedback);

    // Calculate changes
    const moraleChange = employee.morale - moraleBeforeReview;
    const salaryChange = employee.salary - salaryBeforeReview;

    // Get latest review
    const latestReview = employee.reviews[employee.reviews.length - 1];

    return NextResponse.json({
      id: employee._id.toString(),
      companyId: employee.companyId,
      name: employee.name,
      morale: employee.morale,
      salary: employee.salary,
      reviews: employee.reviews,
      lastReviewDate: employee.lastReviewDate,
      skillAverage: employee.skillAverage,
      retentionRisk: employee.retentionRisk,
      review: {
        score: overallScore,
        moraleImpact: moraleChange,
        salaryAdjustment: salaryChange,
        date: latestReview.date,
        strengths: latestReview.strengths,
        improvements: latestReview.improvements,
      },
      message: `Performance review completed. Score: ${overallScore}/100. Morale ${moraleChange >= 0 ? '+' : ''}${moraleChange}, Salary ${salaryChange > 0 ? `+$${salaryChange.toLocaleString()}` : 'unchanged'}.`,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    // Handle mongoose/business logic errors
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('POST /api/employees/[id]/review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
