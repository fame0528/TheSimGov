/**
 * @fileoverview Contract Marketplace API Route
 * @module app/api/contracts/marketplace
 * 
 * OVERVIEW:
 * Generate NPC contracts scaled to company level.
 * 5 difficulty tiers with appropriate skill requirements and values.
 * Marketplace refreshes weekly (game time).
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Contract, Company } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { CONTRACT_PARAMETERS } from '@/lib/utils/constants';
import { faker } from '@faker-js/faker';
import type { EmployeeSkills } from '@/lib/types';

/**
 * GET /api/contracts/marketplace
 * 
 * Generate NPC contracts for the marketplace
 * Scaled to company level for balanced progression
 * 
 * Query params:
 * - companyId: Company ID (required)
 * - difficulty: Filter by tier 1-5 (optional)
 * - industry: Filter by industry (optional)
 * 
 * @returns Array of marketplace contracts
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const difficultyFilter = searchParams.get('difficulty');
    const industryFilter = searchParams.get('industry');

    if (!companyId) {
      return createErrorResponse('Company ID required', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    // Get company to determine level
    const company = await Company.findById(companyId);
    if (!company) {
      return createErrorResponse('Company not found', 'COMPANY_NOT_FOUND', 404);
    }

    // Verify ownership
    if (company.userId.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized', 'FORBIDDEN', 403);
    }

    // Determine which tiers are available based on company level
    const availableTiers = getAvailableTiers(company.level);
    
    // Generate contracts for available tiers
    const contracts: any[] = [];
    
    for (const tierConfig of availableTiers) {
      // Skip if difficulty filter doesn't match
      if (difficultyFilter && parseInt(difficultyFilter) !== tierConfig.difficulty) {
        continue;
      }

      // Generate contracts for this tier
      const tierContracts = generateTierContracts(
        tierConfig,
        session.user.id,
        industryFilter || undefined
      );
      
      contracts.push(...tierContracts);
    }

    return createSuccessResponse({ contracts });

  } catch (error: any) {
    console.error('Marketplace generation error:', error);
    return createErrorResponse('Failed to generate marketplace contracts', 'INTERNAL_ERROR', 500, error.message);
  }
}

/**
 * Get available contract tiers based on company level
 */
function getAvailableTiers(companyLevel: number) {
  const tiers = CONTRACT_PARAMETERS.TIERS;
  const available = [];

  // Tier 1: Always available
  if (companyLevel >= 1) available.push(tiers.TIER_1);
  
  // Tier 2: Level 2+
  if (companyLevel >= 2) available.push(tiers.TIER_2);
  
  // Tier 3: Level 3+
  if (companyLevel >= 3) available.push(tiers.TIER_3);
  
  // Tier 4: Level 4+
  if (companyLevel >= 4) available.push(tiers.TIER_4);
  
  // Tier 5: Level 5 only
  if (companyLevel >= 5) available.push(tiers.TIER_5);

  return available;
}

/**
 * Generate contracts for a specific tier
 */
function generateTierContracts(
  tierConfig: any,
  userId: string,
  industryFilter?: string
): any[] {
  const contracts: any[] = [];
  const industries = ['technology', 'finance', 'healthcare', 'energy', 'manufacturing', 'retail'];
  
  // Filter industries if specified
  const targetIndustries = industryFilter 
    ? [industryFilter] 
    : industries;

  for (let i = 0; i < tierConfig.marketplaceCount; i++) {
    // Random industry from available
    const industry = targetIndustries[Math.floor(Math.random() * targetIndustries.length)];
    
    // Generate contract
    const contract = generateContract(tierConfig, industry, userId);
    contracts.push(contract);
  }

  return contracts;
}

/**
 * Generate a single NPC contract
 */
function generateContract(tierConfig: any, industry: string, userId: string) {
  // Generate client company
  const clientName = faker.company.name();
  const companySizes = ['startup', 'small', 'medium', 'large', 'enterprise'];
  const clientSize = companySizes[Math.floor(Math.random() * companySizes.length)];

  // Generate value within tier range
  const baseValue = Math.round(
    tierConfig.valueRange.min + 
    Math.random() * (tierConfig.valueRange.max - tierConfig.valueRange.min)
  );

  // Generate duration within tier range
  const durationDays = Math.round(
    tierConfig.durationRange.min +
    Math.random() * (tierConfig.durationRange.max - tierConfig.durationRange.min)
  );

  // Generate skill requirements
  const requirements = generateSkillRequirements(tierConfig, industry);

  // Select project type
  const projectTypes = CONTRACT_PARAMETERS.PROJECT_TYPES[industry as keyof typeof CONTRACT_PARAMETERS.PROJECT_TYPES];
  const title = projectTypes[Math.floor(Math.random() * projectTypes.length)];

  // Generate description
  const description = generateDescription(title, clientName, industry, baseValue, durationDays);

  // Employee count needed
  const requiredEmployeeCount = Math.round(
    tierConfig.employeeCount.min +
    Math.random() * (tierConfig.employeeCount.max - tierConfig.employeeCount.min)
  );

  // Expiration (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CONTRACT_PARAMETERS.MARKETPLACE_EXPIRY_DAYS);

  return {
    userId,
    companyId: null, // Marketplace contracts have no company yet
    
    // Client
    clientName,
    clientIndustry: industry,
    clientCompanySize: clientSize,
    
    // Contract
    title,
    description,
    difficulty: tierConfig.difficulty,
    
    // Financial
    baseValue,
    actualPayout: 0,
    upfrontCost: Math.round(baseValue * CONTRACT_PARAMETERS.UPFRONT_COST_PERCENT),
    bidAmount: null,
    
    // Timeline
    durationDays,
    acceptedAt: null,
    startDate: null,
    deadline: null,
    completedAt: null,
    
    // Requirements
    requirements,
    requiredEmployeeCount,
    
    // Execution
    status: 'marketplace',
    assignedEmployees: [],
    progressPercent: 0,
    
    // Results
    successScore: null,
    clientSatisfaction: null,
    bonusEarned: 0,
    
    // Metadata
    expiresAt,
  };
}

/**
 * Generate skill requirements for contract
 * Emphasizes industry-relevant skills
 */
function generateSkillRequirements(tierConfig: any, industry: string): EmployeeSkills {
  const { skillRange } = tierConfig;
  
  // Base skill level (random within tier range)
  const baseSkill = Math.round(skillRange.min + Math.random() * (skillRange.max - skillRange.min));
  
  // Start with all skills at base level
  const requirements: EmployeeSkills = {
    technical: baseSkill,
    leadership: baseSkill,
    industry: baseSkill,
    sales: baseSkill,
    marketing: baseSkill,
    finance: baseSkill,
    operations: baseSkill,
    hr: baseSkill,
    legal: baseSkill,
    rd: baseSkill,
    quality: baseSkill,
    customer: baseSkill,
  };

  // Emphasize industry-specific skills (boost 2-3 skills by 10-20 points)
  const primarySkills = getPrimarySkillsForIndustry(industry);
  const boostCount = 2 + Math.floor(Math.random() * 2); // 2-3 skills
  
  for (let i = 0; i < boostCount && i < primarySkills.length; i++) {
    const skill = primarySkills[i];
    const boost = 10 + Math.floor(Math.random() * 11); // 10-20 points
    requirements[skill] = Math.min(90, requirements[skill] + boost);
  }

  return requirements;
}

/**
 * Get primary skills for industry
 */
function getPrimarySkillsForIndustry(industry: string): (keyof EmployeeSkills)[] {
  const skillMap: Record<string, (keyof EmployeeSkills)[]> = {
    technology: ['technical', 'rd', 'quality'],
    finance: ['finance', 'legal', 'operations'],
    healthcare: ['industry', 'customer', 'quality'],
    energy: ['operations', 'technical', 'industry'],
    manufacturing: ['operations', 'quality', 'technical'],
    retail: ['sales', 'marketing', 'customer'],
  };

  return skillMap[industry] || ['technical', 'operations', 'customer'];
}

/**
 * Generate contract description
 */
function generateDescription(
  title: string,
  clientName: string,
  industry: string,
  value: number,
  duration: number
): string {
  const descriptions = [
    `${clientName} is seeking a partner to deliver ${title.toLowerCase()}. This ${industry} project requires expertise and timely execution. The project scope includes comprehensive implementation, testing, and deployment.`,
    
    `We are looking for a qualified team to complete ${title.toLowerCase()} for our organization. ${clientName} has ${duration} days to complete this critical initiative. Success requires strong technical skills and project management.`,
    
    `${clientName} needs assistance with ${title.toLowerCase()}. This is a strategic project valued at $${value.toLocaleString()} with a ${duration}-day timeline. The ideal partner will have relevant industry experience and a proven track record.`,
    
    `Opportunity to work with ${clientName} on ${title.toLowerCase()}. This ${industry} sector project demands high-quality deliverables and adherence to strict deadlines. Successful completion will establish a strong client relationship.`,
  ];

  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Tier-Based Generation**: Contracts scale with company level
 * 2. **Industry Emphasis**: Skills boosted based on industry relevance
 * 3. **Realistic NPCs**: Faker library for client names
 * 4. **Marketplace Turnover**: 7-day expiration for freshness
 * 5. **Balanced Difficulty**: Skill ranges prevent impossible contracts
 * 6. **Employee Count**: Varies by tier (1-2 for Tier 1, 6-12 for Tier 5)
 * 
 * PREVENTS:
 * - Level 1 companies seeing Tier 5 contracts
 * - Unrealistic skill requirements
 * - Stale marketplace (expiration system)
 * - Generic contracts (industry-specific project types)
 */
