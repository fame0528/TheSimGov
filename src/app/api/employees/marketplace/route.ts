/**
 * @fileoverview Employee Marketplace API
 * @module app/api/employees/marketplace
 * 
 * OVERVIEW:
 * Generates NPC employee candidates for hiring.
 * Candidate quality scales with company level (L1: avg 40, L5: avg 80).
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Company } from '@/lib/db';
import { ApiError } from '@/lib/api/errors';
import { EMPLOYEE_PARAMETERS } from '@/lib/utils/constants';

/**
 * Generate random skill value within range
 */
function randomSkill(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate NPC employee candidate
 * 
 * BUSINESS LOGIC:
 * - Skills generated based on company level ranges
 * - Salary expectation = avg industry salary × (skillAverage / 100) × 2
 * - 2-3 specialization skills (higher than others)
 * 
 * @param level - Company level (1-5)
 * @param candidateNumber - Unique candidate number
 * @returns NPC candidate object
 */
function generateCandidate(level: number, candidateNumber: number) {
  // Get quality range based on company level
  const qualityConfig = EMPLOYEE_PARAMETERS.CANDIDATE_QUALITY[`LEVEL_${level}` as keyof typeof EMPLOYEE_PARAMETERS.CANDIDATE_QUALITY];
  const { min, max } = qualityConfig;

  // Generate base skills
  const skills = {
    technical: randomSkill(min, max),
    leadership: randomSkill(min, max),
    industry: randomSkill(min, max),
    sales: randomSkill(min, max),
    marketing: randomSkill(min, max),
    finance: randomSkill(min, max),
    operations: randomSkill(min, max),
    hr: randomSkill(min, max),
    legal: randomSkill(min, max),
    rd: randomSkill(min, max),
    quality: randomSkill(min, max),
    customer: randomSkill(min, max),
  };

  // Pick 2-3 specialization skills (boost by 10-20 points)
  const specializationCount = Math.random() > 0.5 ? 3 : 2;
  const skillKeys = Object.keys(skills) as Array<keyof typeof skills>;
  const specializations = skillKeys
    .sort(() => Math.random() - 0.5)
    .slice(0, specializationCount);
  
  specializations.forEach(skill => {
    skills[skill] = Math.min(100, skills[skill] + randomSkill(10, 20));
  });

  // Calculate skill average
  const skillAverage = Math.round(
    Object.values(skills).reduce((sum, val) => sum + val, 0) / 12
  );

  // Calculate salary expectation (industry avg × skill multiplier)
  const industryAvg = 60000; // Default
  const salaryExpectation = Math.round(industryAvg * (skillAverage / 100) * 2);

  // Generate realistic name
  const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'James', 'Ashley', 'Robert', 'Amanda'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;

  // Generate role based on specializations
  const roleMap: Record<string, string> = {
    technical: 'Software Engineer',
    leadership: 'Team Lead',
    industry: 'Industry Specialist',
    sales: 'Sales Representative',
    marketing: 'Marketing Specialist',
    finance: 'Financial Analyst',
    operations: 'Operations Manager',
    hr: 'HR Specialist',
    legal: 'Legal Counsel',
    rd: 'R&D Researcher',
    quality: 'QA Engineer',
    customer: 'Customer Success Manager',
  };
  const primarySpecialization = specializations[0];
  const role = roleMap[primarySpecialization] || 'Generalist';

  return {
    id: `candidate-${candidateNumber}`,
    name,
    role,
    skills,
    skillAverage,
    specializations,
    salaryExpectation,
    salaryRange: {
      min: Math.round(salaryExpectation * 0.9),
      max: Math.round(salaryExpectation * 1.15),
    },
    experience: skillAverage < 40 ? 'Junior' : 
                skillAverage < 60 ? 'Mid-Level' : 
                skillAverage < 80 ? 'Senior' : 
                skillAverage < 95 ? 'Expert' : 'Elite',
  };
}

/**
 * GET /api/employees/marketplace
 * Generate NPC employee candidates
 * 
 * QUERY PARAMETERS:
 * - companyId: Company ID (required)
 * - count: Number of candidates (default: based on company level)
 * - minSkill: Minimum skill filter (optional)
 * - maxSalary: Maximum salary filter (optional)
 * 
 * CANDIDATE QUALITY BY LEVEL:
 * - Level 1 (Startup): 3 candidates, skills 30-50 avg
 * - Level 2 (Small): 5 candidates, skills 40-60 avg
 * - Level 3 (Medium): 7 candidates, skills 50-70 avg
 * - Level 4 (Large): 10 candidates, skills 60-80 avg
 * - Level 5 (Mega): 15 candidates, skills 70-90 avg
 * 
 * @returns Array of NPC candidates
 * 
 * @example
 * GET /api/employees/marketplace?companyId=673e...
 * Response: { 
 *   candidates: [
 *     { id: "candidate-1", name: "John Smith", role: "Engineer", skills: {...}, skillAverage: 68, ... }
 *   ],
 *   companyLevel: 2,
 *   totalCandidates: 5
 * }
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

    const minSkill = searchParams.get('minSkill');
    const maxSalary = searchParams.get('maxSalary');

    // Get candidate count based on company level
    const qualityConfig = EMPLOYEE_PARAMETERS.CANDIDATE_QUALITY[`LEVEL_${company.level}` as keyof typeof EMPLOYEE_PARAMETERS.CANDIDATE_QUALITY];
    const candidateCount = parseInt(searchParams.get('count') || String(qualityConfig.count));

    // Generate candidates
    let candidates = Array.from({ length: candidateCount }, (_, i) => 
      generateCandidate(company.level, i + 1)
    );

    // Apply filters
    if (minSkill) {
      const minSkillNum = parseInt(minSkill);
      candidates = candidates.filter(c => c.skillAverage >= minSkillNum);
    }
    if (maxSalary) {
      const maxSalaryNum = parseInt(maxSalary);
      candidates = candidates.filter(c => c.salaryExpectation <= maxSalaryNum);
    }

    return NextResponse.json({
      candidates,
      companyLevel: company.level,
      totalCandidates: candidates.length,
      qualityRange: {
        min: qualityConfig.min,
        max: qualityConfig.max,
      },
      filters: {
        minSkill: minSkill ? parseInt(minSkill) : null,
        maxSalary: maxSalary ? parseInt(maxSalary) : null,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('GET /api/employees/marketplace error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
