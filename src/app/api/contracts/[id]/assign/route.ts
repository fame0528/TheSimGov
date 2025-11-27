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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body = await request.json();
    const validation = assignSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { companyId, employeeIds } = validation.data;

    await connectDB();

    // Get contract
    const contract = await Contract.findById(id);
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Verify contract is active
    if (contract.status !== 'active') {
      return NextResponse.json(
        { error: 'Contract is not in active status' },
        { status: 400 }
      );
    }

    // Get company
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Verify ownership
    if (company.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify contract belongs to company
    if (contract.companyId?.toString() !== companyId) {
      return NextResponse.json(
        { error: 'Contract does not belong to this company' },
        { status: 403 }
      );
    }

    // Get employees
    const employees = await Employee.find({
      _id: { $in: employeeIds },
      companyId: company._id,
      status: 'active',
    });

    // Verify all employees found and available
    if (employees.length !== employeeIds.length) {
      return NextResponse.json(
        { error: 'Some employees not found or not available' },
        { status: 400 }
      );
    }

    // Check if employees are already assigned to other contracts
    const busyEmployees = await Contract.find({
      status: { $in: ['in_progress', 'active'] },
      assignedEmployees: { $in: employeeIds },
      _id: { $ne: contract._id },
    }).select('title assignedEmployees');

    if (busyEmployees.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some employees are already assigned to other contracts',
          busyContracts: busyEmployees.map(c => c.title),
        },
        { status: 400 }
      );
    }

    // Assign employees using contract method
    await contract.assignEmployees(employeeIds);

    return NextResponse.json({
      contract,
      employees: employees.map(e => ({
        id: e._id,
        name: e.name,
        role: e.role,
      })),
      message: `${employees.length} employee(s) assigned successfully`,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Employee assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to assign employees', details: error.message },
      { status: 500 }
    );
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
