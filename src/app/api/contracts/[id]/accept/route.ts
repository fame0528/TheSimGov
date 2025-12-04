/**
 * @fileoverview Contract Acceptance API
 * @module app/api/contracts/[id]/accept
 * 
 * OVERVIEW:
 * Accept bidding contract and start work.
 * Sets start date, deadline, and company ownership.
 * Transitions status from bidding → active.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Contract, Company } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { z } from 'zod';

/**
 * Accept Request Schema
 */
const acceptSchema = z.object({
  companyId: z.string().min(1),
});

/**
 * POST /api/contracts/[id]/accept
 * 
 * Accept contract and begin work
 * 
 * Body:
 * - companyId: Company accepting contract (required)
 * 
 * @returns Updated contract with active status
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
    const validation = acceptSchema.safeParse(body);
    
    if (!validation.success) {
      return createErrorResponse('Invalid request', 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const { companyId } = validation.data;

    await connectDB();

    // Get contract
    const contract = await Contract.findById(id);
    if (!contract) {
      return createErrorResponse('Contract not found', 'CONTRACT_NOT_FOUND', 404);
    }

    // Verify contract is in bidding status
    if (contract.status !== 'bidding') {
      return createErrorResponse('Contract is not in bidding status', 'INVALID_STATUS', 400);
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

    // Set contract ownership and timeline
    contract.companyId = company._id;
    contract.acceptedAt = new Date();
    contract.startDate = new Date();
    contract.status = 'active';
    
    // Deadline is calculated in pre-save hook (startDate + durationDays)
    await contract.save();

    return createSuccessResponse({
      contract,
      message: 'Contract accepted successfully',
    });

  } catch (error: any) {
    console.error('Contract acceptance error:', error);
    return createErrorResponse('Failed to accept contract', 'INTERNAL_ERROR', 500, error.message);
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Ownership Transfer**: Assigns contract to company
 * 2. **Timeline Starts**: Sets acceptedAt and startDate
 * 3. **Status Transition**: bidding → active
 * 4. **Deadline Calculation**: Pre-save hook sets deadline automatically
 * 5. **Authorization**: Verifies company ownership
 * 
 * PREVENTS:
 * - Accepting non-bidding contracts
 * - Unauthorized acceptance
 * - Multiple acceptances (status check)
 */
