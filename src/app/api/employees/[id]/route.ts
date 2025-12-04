/**
 * @fileoverview Employee API - CRUD Endpoints
 * @module app/api/employees/[id]
 * 
 * OVERVIEW:
 * Handles single employee operations: get, update, terminate.
 * Enforces ownership validation and business rules.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { auth } from '@/auth';
import { connectDB, Employee, Company } from '@/lib/db';
import { ApiError } from '@/lib/api/errors';
import { EMPLOYEE_PARAMETERS } from '@/lib/utils/constants';
import { z } from 'zod';

/**
 * Employee Update Schema
 * Validates employee update requests
 */
const updateEmployeeSchema = z.object({
  role: z.string().min(2).max(50).optional(),
  salary: z.number()
    .min(EMPLOYEE_PARAMETERS.MIN_SALARY)
    .max(EMPLOYEE_PARAMETERS.MAX_SALARY)
    .optional(),
  status: z.enum(['active', 'training', 'onLeave', 'terminated']).optional(),
});

/**
 * Verify employee ownership
 * Throws ApiError if employee not found or user doesn't own the company
 * 
 * @param employeeId - Employee ID to verify
 * @param userId - User ID to check ownership
 * @returns Employee document if valid
 */
async function verifyOwnership(employeeId: string, userId: string) {
  const employee = await Employee.findById(employeeId);
  
  if (!employee) {
    throw new ApiError('Employee not found', 404);
  }
  
  if (employee.userId !== userId) {
    throw new ApiError('Forbidden: You do not own this employee\'s company', 403);
  }
  
  return employee;
}

/**
 * GET /api/employees/[id]
 * Fetch single employee by ID with computed virtuals
 * 
 * AUTHENTICATION:
 * - Requires valid session
 * - User must own the company
 * 
 * COMPUTED FIELDS:
 * - skillAverage: Average across 12 skills
 * - retentionRisk: Based on morale thresholds
 * - weeklySalary: Annual / 52
 * - overallPerformance: Weighted score
 * - marketValue: Skill-based salary expectation
 * 
 * @param id - Employee ID
 * @returns Employee data with virtuals
 * 
 * @example
 * GET /api/employees/673e1234567890abcdef1234
 * Response: { id: "...", name: "John Doe", skillAverage: 68, retentionRisk: "low", ... }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    // Verify ownership and fetch employee
    const employee = await verifyOwnership(id, session.user.id);

    return createSuccessResponse({
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
      lastMoraleUpdate: employee.lastMoraleUpdate,
      trainingRecords: employee.trainingRecords,
      currentTraining: employee.currentTraining,
      reviews: employee.reviews,
      lastReviewDate: employee.lastReviewDate,
      status: employee.status,
      terminatedAt: employee.terminatedAt,
      terminationReason: employee.terminationReason,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      // Computed virtuals
      skillAverage: employee.skillAverage,
      retentionRisk: employee.retentionRisk,
      weeklySalary: employee.weeklySalary,
      overallPerformance: employee.overallPerformance,
      marketValue: employee.marketValue,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createErrorResponse(error.message, 'API_ERROR', error.statusCode);
    }
    console.error('GET /api/employees/[id] error:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * PATCH /api/employees/[id]
 * Update employee fields
 * 
 * REQUEST BODY:
 * - role: Job role (optional, 2-50 chars)
 * - salary: Annual salary (optional, $30k-$500k)
 * - status: Employment status (optional)
 * 
 * BUSINESS RULES:
 * - Salary changes trigger morale adjustment via employee.adjustSalary()
 * - Cannot change skills directly (use training endpoint)
 * - Cannot change performance directly (calculated)
 * 
 * @param id - Employee ID
 * @returns Updated employee
 * 
 * @example
 * PATCH /api/employees/673e1234567890abcdef1234
 * Body: { salary: 90000, role: "Senior Engineer" }
 * Response: { id: "...", salary: 90000, role: "Senior Engineer", morale: 82, ... }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    // Verify ownership
    const employee = await verifyOwnership(id, session.user.id);

    // Parse and validate request body
    const body = await req.json();
    const validationResult = updateEmployeeSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validationResult.error.flatten()
      );
    }

    const updates = validationResult.data;

    // Apply salary change with morale calculation
    if (updates.salary !== undefined && updates.salary !== employee.salary) {
      await employee.adjustSalary(updates.salary);
    }

    // Apply other updates
    if (updates.role) employee.role = updates.role;
    if (updates.status) employee.status = updates.status;

    await employee.save();

    return createSuccessResponse({
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
      lastMoraleUpdate: employee.lastMoraleUpdate,
      trainingRecords: employee.trainingRecords,
      currentTraining: employee.currentTraining,
      reviews: employee.reviews,
      lastReviewDate: employee.lastReviewDate,
      status: employee.status,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      skillAverage: employee.skillAverage,
      retentionRisk: employee.retentionRisk,
      weeklySalary: employee.weeklySalary,
      overallPerformance: employee.overallPerformance,
      marketValue: employee.marketValue,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createErrorResponse(error.message, 'API_ERROR', error.statusCode);
    }
    console.error('PATCH /api/employees/[id] error:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * DELETE /api/employees/[id]
 * Terminate employee
 * 
 * BUSINESS RULES:
 * - Sets status to 'terminated'
 * - Records termination date and reason
 * - Does not delete record (audit trail)
 * - No severance payment in current version
 * 
 * @param id - Employee ID
 * @returns Success message
 * 
 * @example
 * DELETE /api/employees/673e1234567890abcdef1234
 * Response: { message: "Employee terminated successfully", employee: {...} }
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    // Verify ownership
    const employee = await verifyOwnership(id, session.user.id);

    // Check if already terminated
    if (employee.status === 'terminated') {
      return createErrorResponse('Employee already terminated', 'VALIDATION_ERROR', 400);
    }

    // Terminate employee (soft delete with audit trail)
    await employee.terminate('Terminated by employer');

    return createSuccessResponse({
      message: 'Employee terminated successfully',
      employee: {
        id: employee._id.toString(),
        name: employee.name,
        status: employee.status,
        terminatedAt: employee.terminatedAt,
        terminationReason: employee.terminationReason,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createErrorResponse(error.message, 'API_ERROR', error.statusCode);
    }
    console.error('DELETE /api/employees/[id] error:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
