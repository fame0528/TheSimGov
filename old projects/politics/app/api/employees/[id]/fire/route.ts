/**
 * Employee Termination API Endpoint
 * Created: 2025-11-13
 * 
 * OVERVIEW:
 * Handles employee termination (firing) with severance calculation based on tenure,
 * performance, and legal requirements. Creates final expense transaction and marks
 * employee as inactive without deleting historical data.
 * 
 * FEATURES:
 * - POST: Fire employee with severance calculation
 * - Severance based on tenure, performance, and state laws
 * - Final expense transaction creation
 * - Preserves employee data for historical records
 * - Budget validation before termination
 * - Comprehensive termination metadata
 */

import { NextRequest, NextResponse } from 'next/server';
// Local session retrieval stub (replace with real auth in production)
import { getServerSession } from '@/lib/auth/getServerSession';
// Removed unused authOptions import (local session stub)
import connectDB from '@/lib/db/connect';
import Employee from '@/lib/db/models/Employee';
import Company from '@/lib/db/models/Company';
import Transaction from '@/lib/db/models/Transaction';

/**
 * POST /api/employees/[id]/fire
 * 
 * Fires an employee with severance calculation.
 * 
 * REQUEST BODY:
 * {
 *   reason: string (optional - termination reason),
 *   forCause?: boolean (default: false - affects severance calculation),
 *   severanceOverride?: number (optional - custom severance amount)
 * }
 * 
 * RESPONSE:
 * 200: {
 *   success: true,
 *   employee: Employee,
 *   severance: {
 *     amount: number,
 *     weeksOfPay: number,
 *     calculation: string
 *   },
 *   transaction: Transaction
 * }
 * 400: { success: false, error: string } - Invalid input
 * 402: { success: false, error: string } - Insufficient funds for severance
 * 404: { success: false, error: string } - Employee not found
 * 500: { success: false, error: string } - Server error
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing employee ID
 * @returns NextResponse with termination details or error
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Parse request body
    const body = await request.json();
    const {
      reason = 'Position eliminated',
      forCause = false,
      severanceOverride,
    } = body;

    // Get employee
    const { id } = await context.params;
    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Get company
    const company = await Company.findById(employee.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Company not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if already fired
    if (employee.firedAt) {
      return NextResponse.json(
        { success: false, error: 'Employee already terminated' },
        { status: 400 }
      );
    }

    // Calculate severance
    let severanceAmount = 0;
    let weeksOfPay = 0;
    let calculation = 'No severance (termination for cause)';

    if (!forCause && !severanceOverride) {
      // Calculate tenure in years
      const tenureMs = Date.now() - employee.hiredAt.getTime();
      const tenureYears = tenureMs / (365 * 24 * 60 * 60 * 1000);

      // Base severance: 1 week per year of service (minimum 2 weeks)
      weeksOfPay = Math.max(2, Math.ceil(tenureYears));

      // Performance multiplier (poor performance reduces severance)
      let performanceMultiplier = 1.0;
      if (employee.performanceRating < 2.0) {
        performanceMultiplier = 0.5; // Poor performer: half severance
      } else if (employee.performanceRating >= 4.0) {
        performanceMultiplier = 1.5; // Excellent performer: 50% bonus
      }

      // State-based minimums (some states require more generous severance)
      // California, New York: More employee-friendly
      const stateMultipliers: Record<string, number> = {
        California: 1.2,
        'New York': 1.2,
        Massachusetts: 1.1,
        Illinois: 1.1,
      };

      // Assume company state from industry (simplified)
      const stateMultiplier = stateMultipliers[company.industry] || 1.0;

      // Final calculation
      weeksOfPay = Math.ceil(weeksOfPay * performanceMultiplier * stateMultiplier);
      const weeklyPay = employee.salary / 52;
      severanceAmount = weeklyPay * weeksOfPay;

      calculation = `${weeksOfPay} weeks (${tenureYears.toFixed(1)} years × ${performanceMultiplier.toFixed(1)} performance × ${stateMultiplier.toFixed(1)} state)`;
    } else if (severanceOverride !== undefined) {
      severanceAmount = severanceOverride;
      weeksOfPay = Math.ceil((severanceAmount / employee.salary) * 52);
      calculation = `Custom severance override: ${weeksOfPay} weeks`;
    }

    // Budget validation
    if (company.cash < severanceAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient funds for severance. Need $${severanceAmount.toFixed(2)}, have $${company.cash.toFixed(2)}`,
          required: severanceAmount,
          available: company.cash,
          severanceDetails: {
            weeksOfPay,
            calculation,
          },
        },
        { status: 402 }
      );
    }

    // Mark employee as fired
    employee.firedAt = new Date();
    await employee.save();

    // Deduct severance from company
    if (severanceAmount > 0) {
      company.cash -= severanceAmount;
      company.expenses += severanceAmount;
      await company.save();
    }

    // Create transaction record
    const transaction = await Transaction.create({
      company: company._id,
      type: 'expense',
      category: 'Severance',
      amount: severanceAmount,
      description: `Severance for ${employee.fullName} - ${reason}`,
      metadata: {
        employeeId: employee._id,
        employeeName: employee.fullName,
        role: employee.role,
        reason,
        forCause,
        tenure: employee.yearsOfExperience,
        performanceRating: employee.performanceRating,
        weeksOfPay,
        calculation,
      },
    });

    return NextResponse.json({
      success: true,
      employee: {
        _id: employee._id,
        fullName: employee.fullName,
        role: employee.role,
        hiredAt: employee.hiredAt,
        firedAt: employee.firedAt,
        tenure: employee.yearsOfExperience,
        performanceRating: employee.performanceRating,
      },
      severance: {
        amount: severanceAmount,
        weeksOfPay,
        calculation,
      },
      transaction: {
        _id: transaction._id,
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        description: transaction.description,
        createdAt: transaction.createdAt,
      },
      companyBalance: company.cash,
      reason,
    });
  } catch (error) {
    console.error('Error firing employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to terminate employee' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * Severance Calculation:
 * - Base: 1 week per year of service (minimum 2 weeks)
 * - Performance multiplier: 0.5× poor, 1.0× average, 1.5× excellent
 * - State multiplier: 1.0-1.2× based on employee-friendly laws
 * - For cause terminations: No severance
 * - Override option for custom amounts
 * 
 * Termination Process:
 * 1. Validate employee exists and not already fired
 * 2. Calculate severance based on tenure/performance/state
 * 3. Validate company has sufficient funds
 * 4. Set firedAt timestamp (preserves employee data)
 * 5. Deduct severance from company cash
 * 6. Create expense transaction
 * 
 * Data Preservation:
 * - Employee record NOT deleted
 * - firedAt timestamp marks inactive
 * - All historical data preserved (training, performance, etc.)
 * - Useful for analytics and legal compliance
 * 
 * Legal Compliance:
 * - State-based severance requirements
 * - For-cause vs without-cause distinction
 * - Performance-based adjustments
 * - Tenure-based minimums
 * 
 * Transaction Tracking:
 * - Records full severance amount
 * - Comprehensive metadata (reason, tenure, performance, calculation)
 * - Audit trail for legal and financial purposes
 */
