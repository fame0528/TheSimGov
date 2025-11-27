/**
 * @fileoverview Employees API - List/Hire Endpoints
 * @module app/api/employees
 * 
 * OVERVIEW:
 * Handles employee listing and hiring operations.
 * Supports pagination, filtering by role/status, and full authentication.
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
 * Employee Hiring Schema
 * Validates employee creation requests
 */
const hireEmployeeSchema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(2).max(50),
  role: z.string().min(2).max(50),
  salary: z.number()
    .min(EMPLOYEE_PARAMETERS.MIN_SALARY)
    .max(EMPLOYEE_PARAMETERS.MAX_SALARY),
  skills: z.object({
    technical: z.number().min(1).max(100),
    leadership: z.number().min(1).max(100),
    industry: z.number().min(1).max(100),
    sales: z.number().min(1).max(100),
    marketing: z.number().min(1).max(100),
    finance: z.number().min(1).max(100),
    operations: z.number().min(1).max(100),
    hr: z.number().min(1).max(100),
    legal: z.number().min(1).max(100),
    rd: z.number().min(1).max(100),
    quality: z.number().min(1).max(100),
    customer: z.number().min(1).max(100),
  }).optional(),
});

/**
 * GET /api/employees
 * List company's employees with optional filtering
 * 
 * QUERY PARAMETERS:
 * - companyId: Company ID (required)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by status (active, training, onLeave, terminated)
 * - role: Filter by role
 * - minMorale: Filter by minimum morale
 * 
 * @returns Array of employees
 * 
 * @example
 * GET /api/employees?companyId=673e...&status=active
 * Response: { data: [...], total: 12, page: 1, limit: 20 }
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError('Unauthorized', 401);
    }

    await connectDB();

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    
    if (!companyId) {
      throw new ApiError('companyId is required', 400);
    }

    // Verify company ownership
    const company = await Company.findById(companyId);
    if (!company) {
      throw new ApiError('Company not found', 404);
    }
    if (company.userId !== session.user.id) {
      throw new ApiError('Forbidden: You do not own this company', 403);
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const minMorale = searchParams.get('minMorale');

    // Build query
    const query: Record<string, unknown> = { companyId };
    if (status && ['active', 'training', 'onLeave', 'terminated'].includes(status)) {
      query.status = status;
    }
    if (role) {
      query.role = new RegExp(role, 'i'); // Case-insensitive search
    }
    if (minMorale) {
      const moraleNum = parseInt(minMorale);
      if (moraleNum >= 1 && moraleNum <= 100) {
        query.morale = { $gte: moraleNum };
      }
    }

    // Execute query with pagination
    const [employees, total] = await Promise.all([
      Employee.find(query)
        .sort({ hiredAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Employee.countDocuments(query),
    ]);

    return NextResponse.json({
      data: employees.map((e: any) => ({
        id: e._id.toString(),
        companyId: e.companyId,
        userId: e.userId,
        name: e.name,
        role: e.role,
        salary: e.salary,
        hiredAt: e.hiredAt,
        skills: e.skills,
        performance: e.performance,
        morale: e.morale,
        status: e.status,
        trainingRecords: e.trainingRecords || [],
        reviews: e.reviews || [],
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('GET /api/employees error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/employees
 * Hire new employee
 * 
 * REQUEST BODY:
 * - companyId: Company ID
 * - name: Employee name (2-50 chars)
 * - role: Job role (2-50 chars)
 * - salary: Annual salary ($30k-$500k)
 * - skills: Optional 12-skill object (defaults to 50 each)
 * 
 * BUSINESS RULES:
 * - Deducts salary/52 from company cash (first week upfront)
 * - Starts with default morale (70)
 * - Performance metrics default (1.0 productivity, 75 quality, 0.95 attendance)
 * - Status: active
 * 
 * @returns Created employee
 * 
 * @example
 * POST /api/employees
 * Body: { companyId: "...", name: "John Doe", role: "Engineer", salary: 80000 }
 * Response: { id: "...", name: "John Doe", skills: {...}, morale: 70, ... }
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError('Unauthorized', 401);
    }

    await connectDB();

    // Parse and validate request body
    const body = await req.json();
    const validationResult = hireEmployeeSchema.safeParse(body);
    
    if (!validationResult.success) {
      throw new ApiError(
        `Validation failed: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    const { companyId, name, role, salary, skills } = validationResult.data;

    // Verify company ownership
    const company = await Company.findById(companyId);
    if (!company) {
      throw new ApiError('Company not found', 404);
    }
    if (company.userId !== session.user.id) {
      throw new ApiError('Forbidden: You do not own this company', 403);
    }

    // Check if company can afford first week salary
    const weeklySalary = Math.round(salary / 52);
    if (company.cash < weeklySalary) {
      throw new ApiError(
        `Insufficient funds. Need $${weeklySalary.toLocaleString()} for first week salary (have $${company.cash.toLocaleString()})`,
        400
      );
    }

    // Create employee with defaults
    const employee = await Employee.create({
      companyId,
      userId: session.user.id,
      name,
      role,
      salary,
      skills: skills || {
        technical: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        leadership: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        industry: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        sales: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        marketing: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        finance: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        operations: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        hr: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        legal: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        rd: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        quality: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        customer: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
      },
      performance: {
        productivity: EMPLOYEE_PARAMETERS.PERFORMANCE.PRODUCTIVITY_DEFAULT,
        quality: EMPLOYEE_PARAMETERS.PERFORMANCE.QUALITY_DEFAULT,
        attendance: EMPLOYEE_PARAMETERS.PERFORMANCE.ATTENDANCE_DEFAULT,
      },
      morale: EMPLOYEE_PARAMETERS.MORALE.DEFAULT,
      status: 'active',
      trainingRecords: [],
      reviews: [],
    });

    // Deduct first week salary from company cash
    company.cash -= weeklySalary;
    company.expenses += weeklySalary;
    await company.save();

    return NextResponse.json({
      id: employee._id.toString(),
      companyId: employee.companyId,
      userId: employee.userId,
      name: employee.name,
      role: employee.role,
      salary: employee.salary,
      hiredAt: employee.hiredAt,
      skills: employee.skills,
      performance: employee.performance,
      morale: employee.morale,
      status: employee.status,
      trainingRecords: employee.trainingRecords,
      reviews: employee.reviews,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('POST /api/employees error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
