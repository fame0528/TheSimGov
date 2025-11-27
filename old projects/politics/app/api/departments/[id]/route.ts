/**
 * @file app/api/departments/[id]/route.ts
 * @description API routes for individual department operations
 * @created 2025-11-13
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Department from '@/lib/db/models/Department';
import Company from '@/lib/db/models/Company';

/**
 * PATCH /api/departments/[id]
 * Update department
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id } = await context.params;
    const body = await request.json();

    // Find department
    const department = await Department.findById(id);
    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(department.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update department
    const updated = await Department.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate('head', 'name position')
      .populate('staff', 'name position');

    return NextResponse.json({
      department: updated,
      message: 'Department updated successfully',
    });
  } catch (error) {
    console.error('PATCH /api/departments/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update department' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/departments/[id]
 * Delete department
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id } = await context.params;

    // Find department
    const department = await Department.findById(id);
    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(department.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Department.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/departments/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete department' },
      { status: 500 }
    );
  }
}
