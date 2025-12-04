/**
 * @fileoverview Contract Employee Assignment API
 * @module app/api/contracts/[id]/assign
 * 
 * OVERVIEW:
 * Assign employees to active contract.
 * Validates employee availability and company ownership.
 * Transitions status from active → in_progress.
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
 * Assignment Request Schema
 */
const assignSchema = z.object({
  companyId: z.string().min(1),
  employeeIds: z.array(z.string()).min(1),
});

/**
 * POST /api/contracts/[id]/assign
 * 
 * Assign employees to contract
 * 
 * Body:
 * - companyId: Company ID (required)
 * - employeeIds: Array of employee IDs (required, min 1)
 * 
 * @returns Updated contract with assigned employees
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
    const validation = assignSchema.safeParse(body);
    
    if (!validation.success) {
      return createErrorResponse('Invalid request', 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const { companyId, employeeIds } = validation.data;

    await connectDB();

    // Get contract
    const contract = await Contract.findById(id);
    if (!contract) {
      return createErrorResponse('Contract not found', 'CONTRACT_NOT_FOUND', 404);
    }

    // Verify contract is active
    if (contract.status !== 'active') {
      return createErrorResponse('Contract is not in active status', 'INVALID_STATUS', 400);
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

    // Get employees
    const employees = await Employee.find({
      _id: { $in: employeeIds },
      companyId: company._id,
      status: 'active',
    });

    // Verify all employees found and available
    if (employees.length !== employeeIds.length) {
      return createErrorResponse('Some employees not found or not available', 'VALIDATION_ERROR', 400);
    }

    // Check if employees are already assigned to other contracts
    const busyEmployees = await Contract.find({
      status: { $in: ['in_progress', 'active'] },
      assignedEmployees: { $in: employeeIds },
      _id: { $ne: contract._id },
    }).select('title assignedEmployees');

    if (busyEmployees.length > 0) {
      return createErrorResponse(
        'Some employees are already assigned to other contracts',
        'VALIDATION_ERROR',
        400,
        { busyContracts: busyEmployees.map(c => c.title) }
      );
    }

    // Assign employees using contract method
    await contract.assignEmployees(employeeIds);

    return createSuccessResponse({
      contract,
      employees: employees.map(e => ({
        id: e._id,
        name: e.name,
        role: e.role,
      })),
      message: `${employees.length} employee(s) assigned successfully`,
    });

  } catch (error: any) {
    console.error('Employee assignment error:', error);
    return createErrorResponse('Failed to assign employees', 'INTERNAL_ERROR', 500, error.message);
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Availability Check**: Verifies employees are active and not busy
 * 2. **Ownership Validation**: Ensures employees belong to company
 * 3. **Status Transition**: active → in_progress (via contract method)
 * 4. **Conflict Prevention**: Checks for existing assignments
 * 5. **Batch Validation**: All employees must be valid before assignment
 * 
 * PREVENTS:
 * - Assigning employees from different company
 * - Assigning inactive employees
 * - Assigning employees already on other contracts
 * - Assignment to non-active contracts
 * - Partial assignments (all or nothing)
 */
