/**
 * @fileoverview Bug Assignment API
 * @module app/api/software/bugs/[id]/assign
 * 
 * OVERVIEW:
 * API endpoint for assigning bugs to employees for resolution.
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Bug from '@/lib/db/models/Bug';
import Employee from '@/lib/db/models/Employee';

/**
 * POST /api/software/bugs/[id]/assign
 * 
 * Assign bug to employee
 * 
 * @param request - Contains { employeeId }
 * @returns 200: Bug assigned
 * @returns 400: Validation error
 * @returns 401: Unauthorized
 * @returns 404: Bug or employee not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const bugId = (await params).id;
    const body = await request.json();
    const { employeeId } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Missing required field: employeeId' },
        { status: 400 }
      );
    }

    // Verify employee exists
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found', employeeId },
        { status: 404 }
      );
    }

    // Find and update bug
    const bug = await Bug.findById(bugId);

    if (!bug) {
      return NextResponse.json(
        { error: 'Bug not found', bugId },
        { status: 404 }
      );
    }

    bug.assignedTo = employeeId;
    bug.status = 'In Progress';
    await bug.save();

    await bug.populate('assignedTo', 'firstName lastName');

    return NextResponse.json({
      bug,
      employee: bug.assignedTo,
      message: 'Bug assigned successfully',
    });
  } catch (error: any) {
    console.error('Error assigning bug:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
