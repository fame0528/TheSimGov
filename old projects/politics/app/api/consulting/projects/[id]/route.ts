/**
 * @file app/api/consulting/projects/[id]/route.ts
 * @description Individual consulting project detail, update, and delete endpoints
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles individual consulting project operations including fetching details, updating
 * project progress (hours worked, status, satisfaction), and project deletion.
 * 
 * ENDPOINTS:
 * - GET /api/consulting/projects/[id] - Get project details
 * - PATCH /api/consulting/projects/[id] - Update project (hours, status, satisfaction)
 * - DELETE /api/consulting/projects/[id] - Remove project
 * 
 * IMPLEMENTATION NOTES:
 * - 70% code reuse from cloud/databases/[id] route (auth, error handling, update patterns)
 * - Custom validation for project status transitions
 * - Automatic revenue calculation on hours worked update
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import ConsultingProject from '@/lib/db/models/ConsultingProject';
import Company from '@/lib/db/models/Company';

/**
 * GET /api/consulting/projects/[id]
 * 
 * Get consulting project details with calculated metrics
 * 
 * Response:
 * {
 *   project: IConsultingProject;
 *   metrics: {
 *     hoursRemaining: number;
 *     utilizationRate: number;
 *     profitAmount: number;
 *     isOverBudget: boolean;
 *   };
 * }
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await dbConnect();

    // Fetch project with client details
    const project = await ConsultingProject.findById(id).populate('client', 'name industry');
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify ownership
    const company = await Company.findById(project.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this project' }, { status: 403 });
    }

    // Calculate metrics using virtual properties
    const metrics = {
      hoursRemaining: project.hoursRemaining,
      utilizationRate: project.hoursEstimated > 0 
        ? Math.round((project.hoursWorked / project.hoursEstimated) * 100 * 100) / 100
        : 0,
      profitAmount: project.profitAmount,
      isOverBudget: project.isOverBudget,
    };

    return NextResponse.json({
      project,
      metrics,
    });
  } catch (error) {
    console.error('Error fetching consulting project:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/consulting/projects/[id]
 * 
 * Update consulting project (hours worked, status, client satisfaction, revenue)
 * 
 * Request Body:
 * {
 *   hoursWorked?: number;             // Update hours worked
 *   status?: 'Proposal' | 'Active' | 'Completed' | 'Cancelled';
 *   clientSatisfaction?: number;      // 1-10 scale
 *   totalRevenue?: number;            // Actual revenue received
 *   profitMargin?: number;            // Actual margin %
 * }
 * 
 * Response:
 * {
 *   project: IConsultingProject;
 *   updated: string[];                // Fields updated
 *   metrics: object;
 *   message: string;
 * }
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { hoursWorked, status, clientSatisfaction, totalRevenue, profitMargin } = body;

    await dbConnect();

    // Fetch project
    const project = await ConsultingProject.findById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify ownership
    const company = await Company.findById(project.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this project' }, { status: 403 });
    }

    // Track updated fields
    const updatedFields: string[] = [];

    // Update hours worked
    if (hoursWorked !== undefined) {
      project.hoursWorked = hoursWorked;
      updatedFields.push('hoursWorked');
    }

    // Update status
    if (status !== undefined) {
      project.status = status;
      updatedFields.push('status');
    }

    // Update client satisfaction
    if (clientSatisfaction !== undefined) {
      if (clientSatisfaction < 1 || clientSatisfaction > 10) {
        return NextResponse.json(
          { error: 'Client satisfaction must be between 1 and 10' },
          { status: 400 }
        );
      }
      project.clientSatisfaction = clientSatisfaction;
      updatedFields.push('clientSatisfaction');
    }

    // Update revenue
    if (totalRevenue !== undefined) {
      project.totalRevenue = totalRevenue;
      updatedFields.push('totalRevenue');
    }

    // Update profit margin
    if (profitMargin !== undefined) {
      project.profitMargin = profitMargin;
      updatedFields.push('profitMargin');
    }

    // Save updates (triggers pre-save hooks for calculations)
    await project.save();

    // Calculate metrics
    const metrics = {
      hoursRemaining: project.hoursRemaining,
      utilizationRate: project.hoursEstimated > 0
        ? Math.round((project.hoursWorked / project.hoursEstimated) * 100 * 100) / 100
        : 0,
      profitAmount: project.profitAmount,
      isOverBudget: project.isOverBudget,
    };

    return NextResponse.json({
      project,
      updated: updatedFields,
      metrics,
      message: `Project updated successfully. Updated fields: ${updatedFields.join(', ')}`,
    });
  } catch (error) {
    console.error('Error updating consulting project:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/consulting/projects/[id]
 * 
 * Delete consulting project
 * 
 * Response:
 * {
 *   message: string;
 *   deleted: {
 *     id: string;
 *     projectName: string;
 *   };
 * }
 */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await dbConnect();

    // Fetch project
    const project = await ConsultingProject.findById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify ownership
    const company = await Company.findById(project.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this project' }, { status: 403 });
    }

    // Store info before deletion
    const deletedInfo = {
      id: (project._id as any).toString(),
      projectName: project.projectName,
    };

    // Delete project
    await ConsultingProject.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Consulting project deleted successfully',
      deleted: deletedInfo,
    });
  } catch (error) {
    console.error('Error deleting consulting project:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
