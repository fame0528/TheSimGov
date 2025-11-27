/**
 * @file app/api/departments/route.ts
 * @description API routes for department CRUD operations
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * RESTful API endpoints for managing company departments (Finance, HR, Marketing, R&D).
 * Supports department creation, retrieval, updates, and KPI tracking. Enforces one
 * department per type per company constraint.
 * 
 * ENDPOINTS:
 * - GET    /api/departments?companyId=xxx          - Get all departments for company
 * - GET    /api/departments?companyId=xxx&type=yyy - Get specific department by type
 * - POST   /api/departments                        - Create new department
 * - PATCH  /api/departments/[id]                   - Update department
 * - DELETE /api/departments/[id]                   - Delete department
 * 
 * REQUEST/RESPONSE CONTRACTS:
 * 
 * GET /api/departments?companyId=xxx
 * Response: { departments: IDepartment[], count: number }
 * 
 * POST /api/departments
 * Request: { companyId, type, name, budget, budgetPercentage, head?, staff? }
 * Response: { department: IDepartment, message: string }
 * 
 * PATCH /api/departments/[id]
 * Request: { budget?, staff?, head?, efficiency?, performance?, etc. }
 * Response: { department: IDepartment, message: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Department from '@/lib/db/models/Department';
import Company from '@/lib/db/models/Company';

/**
 * GET /api/departments
 * Get departments for a company
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const type = searchParams.get('type');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build query
    const query: { [key: string]: unknown } = { company: companyId };
    if (type) {
      query.type = type;
    }

    const departments = await Department.find(query)
      .populate('head', 'name position')
      .populate('staff', 'name position')
      .sort({ type: 1 });

    return NextResponse.json({
      departments,
      count: departments.length,
    });
  } catch (error) {
    console.error('GET /api/departments error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/departments
 * Create a new department
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      companyId,
      type,
      name,
      budget,
      budgetPercentage,
      head,
      staff = [],
    } = body;

    // Validate required fields
    if (!companyId || !type || !budget) {
      return NextResponse.json(
        { error: 'Company ID, type, and budget are required' },
        { status: 400 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if department type already exists for this company
    const existingDept = await Department.findOne({
      company: companyId,
      type,
    });

    if (existingDept) {
      return NextResponse.json(
        { error: `${type} department already exists for this company` },
        { status: 409 }
      );
    }

    // Create department
    const department = await Department.create({
      company: companyId,
      type,
      name: name || type,
      budget,
      budgetPercentage: budgetPercentage || 0,
      head: head || null,
      staff: staff || [],
      active: true,
      established: new Date(),
      // Initialize KPIs
      efficiency: 50,
      performance: 50,
      roi: 0,
      utilization: 50,
      quality: 50,
      // Type-specific initialization handled by schema defaults
    });

    return NextResponse.json(
      {
        department,
        message: `${type} department created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/departments error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create department' },
      { status: 500 }
    );
  }
}
