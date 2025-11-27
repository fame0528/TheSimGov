/**
 * @file app/api/employees/[id]/train/route.ts
 * @description API endpoint for employee training enrollment and completion
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * POST endpoint for enrolling employees in training programs. Validates eligibility,
 * checks training cooldown, calculates success probability, simulates training outcome,
 * and updates employee skills/certifications. Integrates with Transaction model for
 * financial tracking and Company model for budget validation.
 * 
 * ENDPOINT: POST /api/employees/[id]/train
 * 
 * REQUEST BODY:
 * ```json
 * {
 *   "programId": "string",           // TrainingProgram ObjectId
 *   "startImmediately": boolean,     // Start now or schedule for later
 *   "scheduledStartDate": "string"   // ISO date (required if !startImmediately)
 * }
 * ```
 * 
 * RESPONSE (200 - Success):
 * ```json
 * {
 *   "success": true,
 *   "message": "Employee enrolled in training program",
 *   "training": {
 *     "programName": "string",
 *     "startDate": "string",
 *     "completedDate": "string",
 *     "passed": boolean,
 *     "skillGains": { "technical": 15, "analytical": 8 },
 *     "capIncreases": { "technical": 10 },
 *     "certificationsEarned": ["string"],
 *     "cost": number
 *   },
 *   "employee": {
 *     "id": "string",
 *     "skills": { ... },
 *     "certifications": ["string"],
 *     "totalTrainingInvestment": number
 *   }
 * }
 * ```
 * 
 * RESPONSE (400 - Validation Error):
 * ```json
 * {
 *   "success": false,
 *   "error": "Error message",
 *   "details": { ... }
 * }
 * ```
 * 
 * BUSINESS LOGIC:
 * 1. Validate employee exists and is active (not fired)
 * 2. Validate training program exists and is available
 * 3. Check employee eligibility (role, experience, skills, certifications)
 * 4. Check training cooldown (employee can't train too frequently)
 * 5. Validate company has sufficient budget
 * 6. Calculate success probability based on learningRate
 * 7. Simulate training outcome (pass/fail based on probability)
 * 8. Update employee skills and skill caps
 * 9. Award certifications if program provides them
 * 10. Create expense transaction for training cost
 * 11. Update company's training investment tracking
 * 12. Set training cooldown period
 * 
 * IMPLEMENTATION NOTES:
 * - Training success = program.baseSuccessRate + (learningRate - 50) * multiplier
 * - Failed training still provides guaranteedGains (partial skill improvement)
 * - Successful training provides full skillGains + capIncreases
 * - Skill caps permanently increase (talent growth, not just practice)
 * - Training cooldown prevents rapid-fire training spam
 * - Company cash is debited immediately upon enrollment
 * - Certifications increase employee market value
 * - Skills cannot exceed their caps (enforced)
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Employee from '@/lib/db/models/Employee';
import TrainingProgram from '@/lib/db/models/TrainingProgram';
import Company from '@/lib/db/models/Company';
import Transaction from '@/lib/db/models/Transaction';
// TODO: Implement proper authentication
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/lib/auth/authOptions';

/**
 * POST /api/employees/[id]/train
 * Enroll employee in training program
 * 
 * @param {NextRequest} req - Request with programId, startImmediately, scheduledStartDate
 * @param {Object} context - Route context with employee ID
 * @returns {NextResponse} Training enrollment result
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // 1. Authenticate user
    // TODO: Implement proper authentication - next-auth not configured yet
    const session = { user: { id: 'dev-user-id' } };
    // const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const { programId, startImmediately = true, scheduledStartDate } = body;

    if (!programId) {
      return NextResponse.json(
        { success: false, error: 'Training program ID is required' },
        { status: 400 }
      );
    }

    if (!startImmediately && !scheduledStartDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Scheduled start date required when not starting immediately',
        },
        { status: 400 }
      );
    }

    // 3. Connect to database
    await dbConnect();

    // 4. Fetch employee
    const { id } = await context.params;
    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // 5. Verify employee is active
    if (employee.firedAt) {
      return NextResponse.json(
        { success: false, error: 'Cannot train fired employee' },
        { status: 400 }
      );
    }

    // 6. Verify employee belongs to user's company
    const company = await Company.findOne({
      _id: employee.company,
      owner: session.user.id,
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - employee not in your company' },
        { status: 403 }
      );
    }

    // 7. Fetch training program
    const program = await TrainingProgram.findById(programId);
    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Training program not found' },
        { status: 404 }
      );
    }

    if (!program.active) {
      return NextResponse.json(
        { success: false, error: 'Training program is not currently available' },
        { status: 400 }
      );
    }

    // 8. Check enrollment capacity
    if (!program.isAvailable) {
      return NextResponse.json(
        { success: false, error: 'Training program is at capacity' },
        { status: 400 }
      );
    }

    // 9. Check training cooldown
    if (employee.trainingCooldown && new Date() < employee.trainingCooldown) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee is in training cooldown period',
          details: {
            cooldownEnds: employee.trainingCooldown.toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // 10. Check eligibility (role, experience, skills, certifications)
    const employeeYears = (employee.experience / 100) * 50;
    
    // Role eligibility
    if (program.eligibleRoles.length > 0 && !program.eligibleRoles.includes(employee.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee role not eligible for this program',
          details: {
            requiredRoles: program.eligibleRoles,
            employeeRole: employee.role,
          },
        },
        { status: 400 }
      );
    }

    // Experience eligibility
    if (employeeYears < program.minimumExperience) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee does not meet minimum experience requirement',
          details: {
            required: program.minimumExperience,
            current: Math.round(employeeYears * 10) / 10,
          },
        },
        { status: 400 }
      );
    }

    // Skill eligibility
    const skillDeficiencies: string[] = [];
    for (const [skill, minValue] of Object.entries(program.minimumSkills)) {
      const employeeSkillValue = (employee as any)[skill];
      if (employeeSkillValue < minValue) {
        skillDeficiencies.push(`${skill}: ${employeeSkillValue}/${minValue}`);
      }
    }

    if (skillDeficiencies.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee does not meet minimum skill requirements',
          details: {
            deficiencies: skillDeficiencies,
          },
        },
        { status: 400 }
      );
    }

    // Certification prerequisites
    const missingCerts = program.prerequisiteCertifications.filter(
      (cert) => !employee.certifications.includes(cert)
    );

    if (missingCerts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee missing required certifications',
          details: {
            missingCertifications: missingCerts,
          },
        },
        { status: 400 }
      );
    }

    // 11. Check company budget
    const trainingCost = program.totalCost;
    if (company.cash < trainingCost) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient company funds for training',
          details: {
            cost: trainingCost,
            available: company.cash,
            shortage: trainingCost - company.cash,
          },
        },
        { status: 400 }
      );
    }

    // 12. Calculate success probability
    const successProbability = program.calculateSuccess(employee.learningRate);
    const randomRoll = Math.random() * 100;
    const passed = randomRoll <= successProbability;

    // 13. Calculate skill gains
    let skillGains: Record<string, number> = {};
    let capIncreases: Record<string, number> = {};
    let certificationsEarned: string[] = [];

    if (passed) {
      // Successful training: full gains + cap increases
      skillGains = { ...program.skillGains };
      capIncreases = { ...program.capIncreases };
      
      // Add success bonus to primary skill
      if (program.primarySkill && skillGains[program.primarySkill]) {
        skillGains[program.primarySkill] += program.successBonusSkill;
      }
      
      // Award certification
      if (program.certificationAwarded) {
        certificationsEarned.push(program.certificationAwarded);
      }
    } else {
      // Failed training: only guaranteed gains
      skillGains = { ...program.guaranteedGains };
      // No cap increases on failure
      // No certification on failure
    }

    // 14. Prepare training start/completion dates
    const startDate = startImmediately
      ? new Date()
      : new Date(scheduledStartDate);
    
    const completedDate = new Date(startDate);
    completedDate.setDate(completedDate.getDate() + program.durationDays);

    // 15. Update employee skills (respecting caps)
    const updatedSkills: Record<string, number> = {};
    const updatedCaps: Record<string, number> = { ...employee.skillCaps };

    for (const [skill, gain] of Object.entries(skillGains)) {
      if (gain && gain > 0) {
        const currentValue = (employee as any)[skill] || 0;
        const currentCap = updatedCaps[skill] || 70;
        
        // Apply cap increase first
        const capIncrease = capIncreases[skill] || 0;
        updatedCaps[skill] = Math.min(100, currentCap + capIncrease);
        
        // Apply skill gain (cannot exceed cap)
        const newValue = Math.min(updatedCaps[skill], currentValue + gain);
        updatedSkills[skill] = newValue;
      }
    }

    // 16. Update employee certifications
    const updatedCertifications = passed && program.certificationAwarded
      ? [...new Set([...employee.certifications, program.certificationAwarded])]
      : employee.certifications;

    // 17. Calculate new training cooldown
    const cooldownDate = new Date(completedDate);
    cooldownDate.setDate(cooldownDate.getDate() + program.cooldownDays);

    // 18. Create training record
    const trainingRecord = {
      programName: program.name,
      programId: program._id,
      type: program.type,
      startDate,
      completedDate,
      durationDays: program.durationDays,
      cost: trainingCost,
      skillGain: skillGains,
      capIncrease: capIncreases,
      certificationsEarned,
      passed,
    };

    // 19. Update employee in database
    await employee.updateOne({
      $push: { trainingHistory: trainingRecord },
      $set: {
        ...updatedSkills,
        skillCaps: updatedCaps,
        certifications: updatedCertifications,
        trainingCooldown: cooldownDate,
      },
      $inc: {
        totalTrainingInvestment: trainingCost,
        morale: passed ? 5 : -program.failurePenalty, // Boost morale if passed, penalty if failed
        loyalty: passed ? 3 : 0, // Training investment boosts loyalty
      },
    });

    // 20. Enroll in program (update enrollment count)
    await program.enrollEmployee(employee._id as any);

    // 21. Debit company cash
    await company.updateOne({
      $inc: {
        cash: -trainingCost,
        expenses: trainingCost,
      },
    });

    // 22. Create expense transaction
    await Transaction.create({
      type: 'expense',
      description: `Training: ${program.name} for ${employee.fullName}`,
      company: company._id,
      relatedUser: session.user.id,
      metadata: {
        employeeId: (employee._id as any).toString(),
        employeeName: employee.fullName,
        programId: (program._id as any).toString(),
        programName: program.name,
        passed,
        skillGains,
        capIncreases,
        certificationsEarned,
      },
    });

    // 23. Fetch updated employee
    const updatedEmployee = await Employee.findById(id);

    // 24. Return success response
    return NextResponse.json(
      {
        success: true,
        message:
          passed
            ? `${employee.fullName} successfully completed ${program.name}`
            : `${employee.fullName} completed ${program.name} (did not pass)`,
        training: {
          programName: program.name,
          startDate: startDate.toISOString(),
          completedDate: completedDate.toISOString(),
          passed,
          skillGains,
          capIncreases,
          certificationsEarned,
          cost: trainingCost,
          successProbability: Math.round(successProbability * 10) / 10,
        },
        employee: {
          id: (updatedEmployee!._id as any).toString(),
          fullName: updatedEmployee!.fullName,
          skills: {
            technical: updatedEmployee!.technical,
            sales: updatedEmployee!.sales,
            leadership: updatedEmployee!.leadership,
            finance: updatedEmployee!.finance,
            marketing: updatedEmployee!.marketing,
            operations: updatedEmployee!.operations,
            research: updatedEmployee!.research,
            compliance: updatedEmployee!.compliance,
            communication: updatedEmployee!.communication,
            creativity: updatedEmployee!.creativity,
            analytical: updatedEmployee!.analytical,
            customerService: updatedEmployee!.customerService,
          },
          skillCaps: updatedEmployee!.skillCaps,
          certifications: updatedEmployee!.certifications,
          totalTrainingInvestment: updatedEmployee!.totalTrainingInvestment,
          trainingCooldown: updatedEmployee!.trainingCooldown?.toISOString(),
          morale: updatedEmployee!.morale,
          loyalty: updatedEmployee!.loyalty,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Training enrollment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/employees/[id]/train
 * Get employee's training eligibility and available programs
 * 
 * @param {NextRequest} req - Request object
 * @param {Object} context - Route context with employee ID
 * @returns {NextResponse} Available training programs and eligibility
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // 1. Authenticate user (TODO: Implement proper authentication)
    const session = { user: { id: 'dev-user-id' } }; // Stub for development
    // const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Connect to database
    await dbConnect();

    // 3. Fetch employee
    const { id } = await context.params;
    const employee = await Employee.findById(id).populate('company');
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // 4. Verify ownership
    const company = await Company.findOne({
      _id: employee.company,
      owner: session.user.id,
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 5. Get all eligible training programs
    const eligiblePrograms = await TrainingProgram.findEligiblePrograms(employee);

    // 6. Check training cooldown
    const onCooldown = employee.trainingCooldown && new Date() < employee.trainingCooldown;

    // 7. Format programs with cost and success probability
    const formattedPrograms = eligiblePrograms.map((program) => ({
      id: (program._id as any).toString(),
      name: program.name,
      description: program.description,
      type: program.type,
      provider: program.provider,
      difficulty: program.difficulty,
      cost: program.totalCost,
      duration: program.durationDays,
      schedule: program.schedule,
      primarySkill: program.primarySkill,
      skillGains: program.skillGains,
      capIncreases: program.capIncreases,
      certificationAwarded: program.certificationAwarded,
      industryRecognition: program.industryRecognition,
      successProbability: Math.round(program.calculateSuccess(employee.learningRate) * 10) / 10,
      isAvailable: program.isAvailable,
      currentEnrollments: program.currentEnrollments,
      maxEnrollments: program.maxEnrollments,
    }));

    // 8. Return response
    return NextResponse.json(
      {
        success: true,
        employee: {
          id: (employee._id as any).toString(),
          fullName: employee.fullName,
          role: employee.role,
          experience: Math.round(((employee.experience / 100) * 50) * 10) / 10,
          learningRate: employee.learningRate,
          onCooldown,
          cooldownEnds: employee.trainingCooldown?.toISOString(),
          certifications: employee.certifications,
          trainingHistory: employee.trainingHistory.slice(-5), // Last 5 trainings
        },
        eligiblePrograms: formattedPrograms,
        companyBudget: company.cash,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Training eligibility error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
