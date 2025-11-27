/**
 * @fileoverview Employee Training Completion API (Scheduled Event Handler)
 * @module app/api/employees/training/complete
 * 
 * OVERVIEW:
 * Handles automated training completion triggered by scheduled time events.
 * Called by TimeEngine when training duration expires (40 game hours).
 * Applies skill improvements, updates employee status, boosts morale.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Employee } from '@/lib/db';
import { z } from 'zod';

/**
 * Training Completion Request Schema
 * Validates scheduled event payloads
 */
const completeTrainingSchema = z.object({
  employeeId: z.string().min(24).max(24), // MongoDB ObjectId length
});

/**
 * POST /api/employees/training/complete
 * Completes active training program for specified employee
 * 
 * TRIGGER:
 * - Called by TimeEngine scheduled event (after 40 game hours)
 * - Can also be called manually for testing/admin override
 * 
 * REQUEST BODY:
 * - employeeId: Employee MongoDB ObjectId (string)
 * 
 * BUSINESS RULES:
 * - Employee must have active training (currentTraining exists)
 * - Calculates random improvement (10-20 skill points)
 * - Applies skill increase (capped at 100)
 * - Archives training record to trainingRecords array
 * - Boosts morale by +5 points
 * - Changes status from 'training' back to 'active'
 * 
 * SUCCESS RESPONSE (200):
 * {
 *   ok: true,
 *   employeeId: "...",
 *   name: "John Doe",
 *   status: "active",
 *   skillTrained: "technical",
 *   improvement: {
 *     before: 65,
 *     after: 80,
 *     points: 15
 *   },
 *   morale: 75,
 *   message: "Training completed! technical improved from 65 to 80 (+15 points)"
 * }
 * 
 * ERROR RESPONSES:
 * - 400: Validation failed, no training in progress, employee not found
 * - 500: Database connection error, unexpected server error
 * 
 * @example
 * POST /api/employees/training/complete
 * Body: { employeeId: "673e1234567890abcdef1234" }
 * Response: { ok: true, employeeId: "...", improvement: {...}, ... }
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Parse and validate request body
    const body = await req.json();
    const validationResult = completeTrainingSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: `Validation failed: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const { employeeId } = validationResult.data;

    // Fetch employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return NextResponse.json(
        { ok: false, error: 'Employee not found' },
        { status: 400 }
      );
    }

    // Verify training in progress
    if (!employee.currentTraining || employee.currentTraining.completedAt) {
      return NextResponse.json(
        { ok: false, error: 'No active training in progress for this employee' },
        { status: 400 }
      );
    }

    // Store skill values before completion
    const skillTrained = employee.currentTraining.skill as keyof typeof employee.skills;
    const skillBefore = employee.skills[skillTrained];

    // Complete training (calls Employee.completeTraining() method)
    await employee.completeTraining();

    // Extract improvement from last training record
    const lastTraining = employee.trainingRecords[employee.trainingRecords.length - 1];
    const improvement = lastTraining?.improvement || 0;
    const skillAfter = employee.skills[skillTrained];

    return NextResponse.json({
      ok: true,
      employeeId: employee._id.toString(),
      name: employee.name,
      companyId: employee.companyId,
      status: employee.status,
      skillTrained,
      improvement: {
        before: skillBefore,
        after: skillAfter,
        points: improvement,
      },
      morale: employee.morale,
      skillAverage: employee.skillAverage,
      message: `Training completed! ${skillTrained} improved from ${skillBefore} to ${skillAfter} (+${improvement} points)`,
    });
  } catch (error) {
    // Handle mongoose/business logic errors
    if (error instanceof Error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }
    console.error('POST /api/employees/training/complete error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Scheduled Event Integration**: Called by TimeEngine via events.ts listener
 * 2. **No Auth Required**: System-triggered endpoint (could add API key validation)
 * 3. **Idempotent**: Safe to call multiple times (training already completed check)
 * 4. **Skill Improvement**: Random 10-20 points via Employee.completeTraining() method
 * 5. **Morale Boost**: +5 automatic bonus for completing training
 * 6. **Status Update**: training → active (employee available for contracts)
 * 7. **History Tracking**: Training archived in trainingRecords array
 * 8. **Error Handling**: Comprehensive validation with clear error messages
 * 
 * FUTURE ENHANCEMENTS:
 * - Add API key authentication for system endpoints
 * - Notification to company owner on training completion
 * - Analytics tracking (completion rate, average improvement)
 * - Integration with achievement system
 * 
 * PREVENTS:
 * - Completing training for employee without active training
 * - Double-completion bugs (idempotent check)
 * - Invalid employee IDs (Zod validation)
 * - Missing improvement tracking (uses model method)
 */
