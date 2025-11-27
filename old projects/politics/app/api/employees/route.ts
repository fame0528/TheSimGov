/**
 * Employee List API Endpoint
 * Created: 2025-11-13
 * 
 * OVERVIEW:
 * Retrieves employee list with comprehensive filtering, sorting, and pagination.
 * Supports multi-field queries for flexible employee management and analytics.
 * 
 * FEATURES:
 * - GET: Employee list with filtering/sorting/pagination
 * - Filter by: role, active status, performance rating, retention risk, skill levels
 * - Sort by: name, salary, performance, retention risk, hire date
 * - Pagination support
 * - Search by name
 * - Statistics summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getServerSession } from '@/lib/auth/getServerSession';
// Removed unused authOptions import (local session stub)
import connectDB from '@/lib/db/connect';
import Employee from '@/lib/db/models/Employee';
import Company from '@/lib/db/models/Company';
import type { EmployeeFilter, EmployeeSort } from '@/types/api';

/**
 * GET /api/employees
 * 
 * Retrieves filtered, sorted, and paginated employee list.
 * 
 * QUERY PARAMETERS:
 * - page?: number (default: 1)
 * - limit?: number (default: 20, max: 100)
 * - search?: string (search in firstName, lastName)
 * - role?: string (filter by role)
 * - active?: boolean (default: true - only active employees)
 * - includeInactive?: boolean (default: false - include fired employees)
 * - minPerformance?: number (1-5 rating filter)
 * - maxRetentionRisk?: number (0-100 risk filter)
 * - minSkill?: number (minimum average skill level)
 * - sortBy?: string (name|salary|performance|risk|hireDate)
 * - sortOrder?: string (asc|desc, default: asc)
 * 
 * RESPONSE:
 * 200: {
 *   success: true,
 *   employees: Employee[],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     pages: number
 *   },
 *   statistics: {
 *     total: number,
 *     active: number,
 *     inactive: number,
 *     avgSalary: number,
 *     avgPerformance: number,
 *     avgRetentionRisk: number,
 *     totalPayroll: number
 *   }
 * }
 * 500: { success: false, error: string }
 * 
 * @param request - Next.js request object with query parameters
 * @returns NextResponse with employee list and metadata
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get company
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const minPerformance = searchParams.get('minPerformance') 
      ? parseFloat(searchParams.get('minPerformance')!) 
      : undefined;
    const maxRetentionRisk = searchParams.get('maxRetentionRisk')
      ? parseInt(searchParams.get('maxRetentionRisk')!)
      : undefined;
    const minSkill = searchParams.get('minSkill')
      ? parseInt(searchParams.get('minSkill')!)
      : undefined;
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1;

    // Build query filter
    const filter: EmployeeFilter = { company: company._id as Types.ObjectId };

    // Active/inactive filter
    if (!includeInactive) {
      filter.firedAt = null;
    }

    // Search by name
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    // Role filter
    if (role) {
      filter.role = role;
    }

    // Performance rating filter
    if (minPerformance !== undefined) {
      filter.performanceRating = { $gte: minPerformance };
    }

    // Retention risk filter
    if (maxRetentionRisk !== undefined) {
      filter.retentionRisk = { $lte: maxRetentionRisk };
    }

    // Build sort object
    let sort: EmployeeSort = {};
    switch (sortBy) {
      case 'salary':
        sort.salary = sortOrder;
        break;
      case 'performance':
        sort.performanceRating = sortOrder;
        break;
      case 'risk':
        sort.retentionRisk = sortOrder;
        break;
      case 'hireDate':
        sort.hiredAt = sortOrder;
        break;
      case 'name':
      default:
        sort.firstName = sortOrder;
        sort.lastName = sortOrder;
        break;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const employees = await Employee.find(filter)
      .sort(sort as Record<string, 1 | -1>)
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter by minimum skill (requires aggregation, done in memory for simplicity)
    let filteredEmployees = employees;
    if (minSkill !== undefined) {
      filteredEmployees = employees.filter(emp => {
        const avgSkill = (
          emp.technical + emp.sales + emp.leadership + emp.finance +
          emp.marketing + emp.operations + emp.research + emp.compliance +
          emp.communication + emp.creativity + emp.analytical + emp.customerService
        ) / 12;
        return avgSkill >= minSkill;
      });
    }

    // Get total count
    const total = await Employee.countDocuments(filter);

    // Calculate statistics
    const allEmployees = await Employee.find({ company: company._id }).lean();
    const activeEmployees = allEmployees.filter(e => !e.firedAt);
    const inactiveEmployees = allEmployees.filter(e => e.firedAt);

    const statistics = {
      total: allEmployees.length,
      active: activeEmployees.length,
      inactive: inactiveEmployees.length,
      avgSalary: activeEmployees.length > 0
        ? activeEmployees.reduce((sum, e) => sum + e.salary, 0) / activeEmployees.length
        : 0,
      avgPerformance: activeEmployees.length > 0
        ? activeEmployees.reduce((sum, e) => sum + e.performanceRating, 0) / activeEmployees.length
        : 0,
      avgRetentionRisk: activeEmployees.length > 0
        ? activeEmployees.reduce((sum, e) => sum + e.retentionRisk, 0) / activeEmployees.length
        : 0,
      totalPayroll: activeEmployees.reduce((sum, e) => sum + (e.salary / 12), 0), // Monthly payroll
    };

    // Format employee data for response
    const formattedEmployees = filteredEmployees.map(emp => ({
      _id: emp._id,
      fullName: `${emp.firstName} ${emp.lastName}`,
      firstName: emp.firstName,
      lastName: emp.lastName,
      role: emp.role,
      experienceLevel: emp.experienceLevel,
      salary: emp.salary,
      bonus: emp.bonus,
      equity: emp.equity,
      skills: {
        technical: emp.technical,
        sales: emp.sales,
        leadership: emp.leadership,
        finance: emp.finance,
        marketing: emp.marketing,
        operations: emp.operations,
        research: emp.research,
        compliance: emp.compliance,
        communication: emp.communication,
        creativity: emp.creativity,
        analytical: emp.analytical,
        customerService: emp.customerService,
      },
      skillCaps: emp.skillCaps,
      averageSkill: (
        emp.technical + emp.sales + emp.leadership + emp.finance +
        emp.marketing + emp.operations + emp.research + emp.compliance +
        emp.communication + emp.creativity + emp.analytical + emp.customerService
      ) / 12,
      loyalty: emp.loyalty,
      morale: emp.morale,
      satisfaction: emp.satisfaction,
      performanceRating: emp.performanceRating,
      retentionRisk: emp.retentionRisk,
      poachResistance: emp.poachResistance,
      contractsCompleted: emp.contractsCompleted,
      projectsCompleted: emp.projectsCompleted,
      revenueGenerated: emp.revenueGenerated,
      totalTrainingInvestment: emp.totalTrainingInvestment,
      certifications: emp.certifications,
      hiredAt: emp.hiredAt,
      firedAt: emp.firedAt,
      nextReviewDate: emp.nextReviewDate,
      trainingCooldown: emp.trainingCooldown,
    }));

    return NextResponse.json({
      success: true,
      employees: formattedEmployees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statistics,
      filters: {
        search,
        role,
        includeInactive,
        minPerformance,
        maxRetentionRisk,
        minSkill,
        sortBy,
        sortOrder: sortOrder === 1 ? 'asc' : 'desc',
      },
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * Filtering System:
 * - Multi-field support: name search, role, performance, retention risk, skills
 * - Active/inactive toggle for including fired employees
 * - Regex search for name matching (case-insensitive)
 * - Range filters (min/max) for numeric fields
 * 
 * Sorting Options:
 * - Name (first name + last name)
 * - Salary (ascending/descending)
 * - Performance rating (ascending/descending)
 * - Retention risk (ascending/descending)
 * - Hire date (ascending/descending)
 * 
 * Pagination:
 * - Default: 20 employees per page
 * - Max: 100 employees per page
 * - Returns total count and page count
 * 
 * Statistics:
 * - Overall summary (total, active, inactive)
 * - Averages (salary, performance, retention risk)
 * - Monthly payroll calculation
 * - Useful for dashboard displays
 * 
 * Response Format:
 * - Flattened employee data for easy consumption
 * - Full skill set with caps
 * - Calculated fields (averageSkill, fullName)
 * - All relevant dates and metrics
 * 
 * Performance Considerations:
 * - Pagination prevents large data transfers
 * - Lean queries for better performance
 * - In-memory skill filtering (could be optimized with aggregation)
 * - Separate statistics query for accuracy
 */
