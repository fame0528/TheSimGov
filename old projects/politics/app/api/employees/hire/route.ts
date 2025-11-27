/**
 * Employee Hiring API Endpoint
 * Created: 2025-11-13
 * 
 * OVERVIEW:
 * Handles employee recruitment and hiring operations. Creates new employee records with
 * market-competitive compensation, talent-based skill caps, and random skill generation.
 * Validates company budget and role requirements before hiring.
 * 
 * FEATURES:
 * - POST: Hire new employee with randomized skills/talent
 * - GET: Hiring statistics and available budget
 * - Market-aligned salary calculation by role/industry/experience
 * - Random skill generation within talent caps
 * - Budget validation before hire
 * - Transaction creation for initial compensation
 * - Comprehensive error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
// authOptions import removed (local session stub does not require options)
import connectDB from '@/lib/db/connect';
import Employee from '@/lib/db/models/Employee';
import Company from '@/lib/db/models/Company';
import Transaction from '@/lib/db/models/Transaction';
import { getMarketSalary } from '@/lib/utils/employeeRetention';
import { randomInt } from '@/lib/utils/random';

// Map experience level string to approximate years of experience for market salary calculation
function experienceLevelToYears(level: string): number {
  switch (level) {
    case 'entry': return 1;
    case 'mid': return 4;
    case 'senior': return 9;
    case 'expert': return 13;
    case 'master': return 17;
    case 'legendary': return 22;
    default: return 1;
  }
}

/**
 * POST /api/employees/hire
 * 
 * Hires a new employee with randomized skills and market-competitive compensation.
 * 
 * REQUEST BODY:
 * {
 *   firstName: string,
 *   lastName: string,
 *   role: string (one of 20 employee roles),
 *   experienceLevel?: string (entry|mid|senior|expert|master|legendary),
 *   salary?: number (optional override, defaults to market rate),
 *   equity?: number (optional equity grant),
 *   bonus?: number (optional signing bonus)
 * }
 * 
 * RESPONSE:
 * 200: { success: true, employee: Employee, transaction: Transaction }
 * 400: { success: false, error: string } - Invalid input
 * 402: { success: false, error: string } - Insufficient funds
 * 500: { success: false, error: string } - Server error
 * 
 * @param request - Next.js request object with hiring details
 * @returns NextResponse with new employee or error
 */
export async function POST(request: NextRequest) {
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
      firstName,
      lastName,
      role,
      experienceLevel = 'entry',
      salary: salaryOverride,
      equity = 0,
      bonus = 0,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: firstName, lastName, role' },
        { status: 400 }
      );
    }

    // Validate role (should match one of the 20 employee roles)
    const validRoles = [
      'Lobbyist', 'Campaign Manager', 'Policy Analyst', 'Communications Director',
      'Field Organizer', 'Data Analyst', 'Finance Director', 'Legal Counsel',
      'Media Relations', 'Speechwriter', 'Opposition Researcher', 'Pollster',
      'Digital Strategist', 'Fundraising Coordinator', 'Volunteer Coordinator',
      'Press Secretary', 'Chief of Staff', 'Legislative Director', 'Political Director',
      'Compliance Officer'
    ];

    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate experience level
    const validExperience = ['entry', 'mid', 'senior', 'expert', 'master', 'legendary'];
    if (!validExperience.includes(experienceLevel)) {
      return NextResponse.json(
        { success: false, error: `Invalid experienceLevel. Must be one of: ${validExperience.join(', ')}` },
        { status: 400 }
      );
    }

    // Get company
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Calculate market salary if not overridden
    const yearsExperience = experienceLevelToYears(experienceLevel);
    const marketSalary = getMarketSalary(role, yearsExperience, company.industry);
    const finalSalary = salaryOverride || marketSalary;

    // Calculate total hiring cost (salary is annual, but we check first month + bonus + equity)
    const monthlySalary = finalSalary / 12;
    const totalCost = monthlySalary + bonus + equity;

    // Budget validation
    if (company.cash < totalCost) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient funds. Need $${totalCost.toFixed(2)}, have $${company.cash.toFixed(2)}`,
          required: totalCost,
          available: company.cash,
          breakdown: {
            monthlySalary,
            bonus,
            equity,
          },
        },
        { status: 402 }
      );
    }

    // Generate random talent (determines skill caps)
    // Talent distribution: 50-100, weighted towards middle
    const talentRoll = randomInt(1, 100);
    let talent: number;
    if (talentRoll <= 10) {
      talent = randomInt(50, 60); // 10% chance: Low talent
    } else if (talentRoll <= 40) {
      talent = randomInt(60, 75); // 30% chance: Below average
    } else if (talentRoll <= 80) {
      talent = randomInt(75, 85); // 40% chance: Average
    } else if (talentRoll <= 95) {
      talent = randomInt(85, 95); // 15% chance: Above average
    } else {
      talent = randomInt(95, 100); // 5% chance: Exceptional
    }

    // Generate random skills within talent caps
    // Skills start lower than caps to allow for growth
    const skillNames = [
      'technical', 'sales', 'leadership', 'finance', 'marketing',
      'operations', 'research', 'compliance', 'communication',
      'creativity', 'analytical', 'customerService'
    ];

    const skills: Record<string, number> = {};
    const skillCaps: Record<string, number> = {};

    for (const skillName of skillNames) {
      // Cap varies ±10 from talent
      const cap = Math.max(50, Math.min(100, talent + randomInt(-10, 10)));
      skillCaps[skillName] = cap;

      // Starting skill: 40-70% of cap based on experience
      const experienceMultipliers: Record<string, number> = {
        entry: 0.4,
        mid: 0.5,
        senior: 0.6,
        expert: 0.65,
        master: 0.7,
        legendary: 0.7,
      };
      const multiplier = experienceMultipliers[experienceLevel] || 0.5;
      const startingSkill = Math.floor(cap * multiplier + randomInt(-5, 5));
      skills[skillName] = Math.max(20, Math.min(cap, startingSkill));
    }

    // Calculate initial performance rating based on skills
    const avgSkill = Object.values(skills).reduce((sum, val) => sum + val, 0) / skillNames.length;
    const performanceRating = Math.max(1.0, Math.min(5.0, (avgSkill / 20))); // 20 skill ≈ 1 star, 100 skill ≈ 5 stars

    // Create employee
    const employee = await Employee.create({
      company: company._id,
      firstName,
      lastName,
      role,
      experienceLevel,
      hiredAt: new Date(),
      salary: finalSalary,
      bonus,
      equity,
      talent,
      loyalty: randomInt(50, 80),
      morale: randomInt(60, 85),
      satisfaction: randomInt(65, 85),
      poachResistance: randomInt(40, 70),
      retentionRisk: 20,
      contractsCompleted: 0,
      projectsCompleted: 0,
      revenueGenerated: 0,
      performanceRating,
      performanceHistory: [],
      trainingHistory: [],
      totalTrainingInvestment: 0,
      certifications: [],
      counterOfferCount: 0,
      lastRaise: new Date(),
      nextReviewDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
      // Individual skill current values
      ...skills,
      // Skill caps stored under skillCaps schema field
      skillCaps,
    });

    // Deduct hiring cost from company
    company.cash -= totalCost;
    company.expenses += totalCost;
    await company.save();

    // Create transaction record
    const transaction = await Transaction.create({
      company: company._id,
      type: 'expense',
      category: 'Hiring',
      amount: totalCost,
      description: `Hired ${firstName} ${lastName} as ${role}`,
      metadata: {
        employeeId: employee._id,
        employeeName: `${firstName} ${lastName}`,
        role,
        experienceLevel,
        salary: finalSalary,
        bonus,
        equity,
        talent,
      },
    });

    return NextResponse.json({
      success: true,
      employee: {
        _id: employee._id,
        fullName: employee.fullName,
        role: employee.role,
        experienceLevel: employee.experienceLevel,
        salary: employee.salary,
        bonus: employee.bonus,
        equity: employee.equity,
        talent: employee.talent,
        skills: {
          technical: employee.technical,
          sales: employee.sales,
          leadership: employee.leadership,
          finance: employee.finance,
          marketing: employee.marketing,
          operations: employee.operations,
          research: employee.research,
          compliance: employee.compliance,
          communication: employee.communication,
          creativity: employee.creativity,
          analytical: employee.analytical,
          customerService: employee.customerService,
        },
        skillCaps: employee.skillCaps,
        loyalty: employee.loyalty,
        morale: employee.morale,
        satisfaction: employee.satisfaction,
        performanceRating: employee.performanceRating,
        retentionRisk: employee.retentionRisk,
        hiredAt: employee.hiredAt,
        nextReviewDate: employee.nextReviewDate,
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
    });
  } catch (error) {
    console.error('Error hiring employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to hire employee' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/employees/hire
 * 
 * Retrieves hiring statistics and available budget.
 * 
 * RESPONSE:
 * 200: {
 *   success: true,
 *   statistics: {
 *     totalEmployees: number,
 *     hiresThisMonth: number,
 *     hiresThisYear: number,
 *     availableBudget: number,
 *     averageSalary: number,
 *     totalPayroll: number (monthly)
 *   },
 *   marketRates: { [role: string]: number }
 * }
 * 500: { success: false, error: string }
 * 
 * @returns NextResponse with hiring statistics
 */
export async function GET() {
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

    // Get all employees
    const employees = await Employee.find({ company: company._id, firedAt: null });

    // Calculate hiring statistics
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const hiresThisMonth = employees.filter(emp => emp.hiredAt >= monthStart).length;
    const hiresThisYear = employees.filter(emp => emp.hiredAt >= yearStart).length;

    const totalSalary = employees.reduce((sum, emp) => sum + emp.salary, 0);
    const averageSalary = employees.length > 0 ? totalSalary / employees.length : 0;
    const monthlyPayroll = totalSalary / 12;

    // Get market rates for all roles in company's industry
    const roles = [
      'Lobbyist', 'Campaign Manager', 'Policy Analyst', 'Communications Director',
      'Field Organizer', 'Data Analyst', 'Finance Director', 'Legal Counsel',
      'Media Relations', 'Speechwriter', 'Opposition Researcher', 'Pollster',
      'Digital Strategist', 'Fundraising Coordinator', 'Volunteer Coordinator',
      'Press Secretary', 'Chief of Staff', 'Legislative Director', 'Political Director',
      'Compliance Officer'
    ];

    const marketRates: Record<string, Record<string, number>> = {};
    for (const role of roles) {
      marketRates[role] = {
        entry: getMarketSalary(role, experienceLevelToYears('entry'), company.industry),
        mid: getMarketSalary(role, experienceLevelToYears('mid'), company.industry),
        senior: getMarketSalary(role, experienceLevelToYears('senior'), company.industry),
        expert: getMarketSalary(role, experienceLevelToYears('expert'), company.industry),
      };
    }

    return NextResponse.json({
      success: true,
      statistics: {
        totalEmployees: employees.length,
        hiresThisMonth,
        hiresThisYear,
        availableBudget: company.cash,
        averageSalary,
        totalPayroll: monthlyPayroll,
      },
      marketRates,
    });
  } catch (error) {
    console.error('Error fetching hiring statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hiring statistics' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * Talent System:
 * - Talent (50-100) determines skill cap potential
 * - Distribution: 10% low, 30% below avg, 40% avg, 15% above avg, 5% exceptional
 * - Skill caps vary ±10 from talent to add variety
 * 
 * Skill Generation:
 * - Starting skills: 40-70% of cap based on experience level
 * - Entry: 40% of cap, Legendary: 70% of cap
 * - Random ±5 variation for unpredictability
 * - All 12 skills generated automatically
 * 
 * Salary Calculation:
 * - Market rates from employeeRetention utility (role × industry × experience)
 * - Override option for custom compensation
 * - Budget validation before hire
 * 
 * Initial State:
 * - Loyalty: 50-80 (decent starting loyalty)
 * - Morale: 60-85 (good starting morale)
 * - Satisfaction: 65-85 (satisfied with new job)
 * - Performance rating calculated from average skill
 * - Next review in 6 months
 * 
 * Transaction Tracking:
 * - Records total hiring cost (first month salary + bonus + equity)
 * - Comprehensive metadata for audit trail
 * - Deducts from company cash and increases expenses
 * 
 * Error Handling:
 * - Validates all required fields
 * - Checks role against valid roles list
 * - Budget validation before hire
 * - Comprehensive error messages for debugging
 */
