/**
 * @fileoverview Contract Completion API
 * @module app/api/contracts/[id]/complete
 * 
 * OVERVIEW:
 * Complete contract and calculate payout.
 * Evaluates success based on employee skills vs requirements.
 * Applies bonuses/penalties based on performance and timeliness.
 * Updates company cash and revenue.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Contract, Company, Employee } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { z } from 'zod';

/**
 * Completion Request Schema
 */
const completeSchema = z.object({
  companyId: z.string().min(1),
  progressPercent: z.number().min(0).max(100).optional(),
});

/**
 * POST /api/contracts/[id]/complete
 * 
 * Mark contract as complete and calculate payout
 * 
 * Body:
 * - companyId: Company ID (required)
 * - progressPercent: Final progress (optional, defaults to 100)
 * 
 * @returns Completion results with payout details
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Parse request
    const body = await request.json();
    const validation = completeSchema.safeParse(body);
    
    if (!validation.success) {
      return createErrorResponse('Invalid request', 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const { companyId, progressPercent = 100 } = validation.data;

    await connectDB();

    // Get contract
    const contract = await Contract.findById(id);
    if (!contract) {
      return createErrorResponse('Contract not found', 'CONTRACT_NOT_FOUND', 404);
    }

    // Verify contract is in progress
    if (contract.status !== 'in_progress') {
      return createErrorResponse('Contract is not in progress', 'INVALID_STATUS', 400);
    }

    // Get company
    const company = await Company.findById(companyId);
    if (!company) {
      return createErrorResponse('Company not found', 'COMPANY_NOT_FOUND', 404);
    }

    // Verify ownership
    if (company.userId.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized', 'FORBIDDEN', 403);
    }

    // Verify contract belongs to company
    if (contract.companyId?.toString() !== companyId) {
      return createErrorResponse('Contract does not belong to this company', 'FORBIDDEN', 403);
    }

    // Get assigned employees with full data
    const employees = await Employee.find({
      _id: { $in: contract.assignedEmployees },
    });

    if (employees.length === 0) {
      return createErrorResponse('No employees assigned to contract', 'VALIDATION_ERROR', 400);
    }

    // Update progress before completion
    contract.progressPercent = progressPercent;

    // Complete contract (calculates success and payout)
    const result = await contract.complete(employees, company);

    // Get updated company data (complete() modifies and saves company)
    const updatedCompany = await Company.findById(companyId);

    return createSuccessResponse({
      contract,
      result: {
        successScore: result.successScore,
        payout: result.payout,
        bonus: result.bonus,
        clientSatisfaction: result.clientSatisfaction,
        isLate: result.isLate,
      },
      company: {
        id: updatedCompany?._id,
        cash: updatedCompany?.cash,
        revenue: updatedCompany?.revenue,
      },
      message: 'Contract completed successfully',
    });

  } catch (error: any) {
    console.error('Contract completion error:', error);
    return createErrorResponse('Failed to complete contract', 'INTERNAL_ERROR', 500, error.message);
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Success Calculation**: Employee skills vs contract requirements
 * 2. **Payout Formula**: 
 *    - Success >= 90: Base + 10% bonus
 *    - Success >= 75: Base value
 *    - Success >= 60: Base - 5%
 *    - Success < 60: Base - 15%
 *    - Late delivery: Additional -15%
 * 3. **Company Update**: Increases cash and revenue
 * 4. **Status Transition**: in_progress → completed
 * 5. **Results Tracking**: Stores success score, satisfaction, bonuses
 * 
 * FORMULA:
 * Success Score = Average(Employee Skill / Requirement) * 100
 * Payout = Base Value * (1 + Success Bonus) * (1 - Late Penalty)
 * 
 * EXAMPLE:
 * Contract requires: Technical 60, Leadership 50, Industry 70 (avg 60)
 * Employees have: Technical 72, Leadership 60, Industry 84 (avg 72)
 * Success = 72/60 = 120% capped at 100
 * Success Score = 100 → EXCELLENT tier → +10% bonus
 * On time: Base $50k * 1.10 = $55k payout
 */
