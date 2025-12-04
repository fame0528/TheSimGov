/**
 * @file src/app/api/politics/unions/route.ts
 * @description Unions API - List and Create labor unions
 * @module api/politics/unions
 * 
 * OVERVIEW:
 * CRUD operations for labor unions and worker organizations.
 * Unions organize workers, negotiate contracts, engage in collective
 * actions, and participate in political activities.
 * 
 * ENDPOINTS:
 * GET  /api/politics/unions - List unions with filtering
 * POST /api/politics/unions - Create a new union
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Union from '@/lib/db/models/politics/Union';
import {
  UnionSector,
  UnionScope,
  UnionStatus,
  UnionMemberRole,
  UNION_SECTOR_LABELS,
  UNION_STATUS_LABELS,
  type UnionMember,
  type UnionStrength,
  type UnionFinances,
} from '@/lib/types/union';
import { z } from 'zod';

// ===================== VALIDATION SCHEMAS =====================

/**
 * Query schema for listing unions
 */
const unionQuerySchema = z.object({
  sector: z.nativeEnum(UnionSector).optional(),
  scope: z.nativeEnum(UnionScope).optional(),
  stateCode: z.string().length(2).toUpperCase().optional(),
  status: z.nativeEnum(UnionStatus).optional(),
  minMembers: z.coerce.number().int().min(1).optional(),
  maxMembers: z.coerce.number().int().min(1).optional(),
  minStrength: z.coerce.number().int().min(0).max(100).optional(),
  isStriking: z.coerce.boolean().optional(),
  search: z.string().min(1).max(100).optional(),
  myUnions: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['memberCount', 'strength.overall', 'createdAt', 'name']).default('memberCount'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema for creating a union
 */
const createUnionSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  acronym: z.string().min(2).max(20).trim().toUpperCase().optional(),
  description: z.string().min(10).max(2000).trim(),
  motto: z.string().max(200).trim().optional(),
  sector: z.nativeEnum(UnionSector),
  scope: z.nativeEnum(UnionScope),
  stateCode: z.string().length(2).toUpperCase().optional(),
  headquarters: z.object({
    address: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    stateCode: z.string().length(2).toUpperCase(),
    zipCode: z.string().max(10).optional(),
  }),
  duesConfig: z.object({
    amountPerCycle: z.number().int().min(0).max(10000).default(50),
    cycleDays: z.number().int().min(1).max(365).default(30),
    percentageOfWages: z.number().min(0).max(10).optional(),
    gracePeriodDays: z.number().int().min(0).max(60).default(14),
    mandatory: z.boolean().default(true),
    reducedRateForUnemployed: z.boolean().default(true),
    strikeFundAllocation: z.number().int().min(0).max(50).default(20),
  }).optional(),
  isPublic: z.boolean().default(true),
  membershipOpen: z.boolean().default(true),
}).refine(
  (data) => {
    // State/Local scope requires stateCode
    if ((data.scope === UnionScope.STATE || data.scope === UnionScope.LOCAL) && !data.stateCode) {
      return false;
    }
    return true;
  },
  { message: 'State/Local scope requires a stateCode' }
);

// ===================== HELPERS =====================

/**
 * Generate URL-friendly slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Calculate initial union strength
 */
function calculateInitialStrength(): UnionStrength {
  return {
    overall: 10,
    membershipScore: 10,
    densityScore: 0,
    treasuryScore: 0,
    contractStrength: 0,
    politicalInfluence: 0,
    actionCapacity: 0,
    solidarityScore: 0,
    calculatedAt: Date.now(),
  };
}

/**
 * Calculate initial finances
 */
function calculateInitialFinances(): UnionFinances {
  return {
    generalFund: 0,
    strikeFund: 0,
    politicalActionFund: 0,
    educationFund: 0,
    emergencyFund: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  };
}

// ===================== GET HANDLER =====================

/**
 * GET /api/politics/unions
 * 
 * List unions with optional filtering.
 * 
 * Query Parameters:
 * - sector: Filter by industry sector (MANUFACTURING, HEALTHCARE, etc.)
 * - scope: Filter by scope (LOCAL, STATE, REGIONAL, NATIONAL)
 * - stateCode: Filter by state
 * - status: Filter by status (ACTIVE, STRIKING, etc.)
 * - minMembers/maxMembers: Filter by member count
 * - minStrength: Filter by minimum strength score
 * - isStriking: Filter only unions currently on strike
 * - search: Text search in name, description, acronym
 * - myUnions: Only show unions the user is a member of
 * - page/limit: Pagination
 * - sortBy/sortOrder: Sorting
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const queryParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const query = unionQuerySchema.parse(queryParams);

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    // Default to active unions
    if (query.status) {
      filter.status = query.status;
    } else if (query.isStriking) {
      filter.status = UnionStatus.STRIKING;
    } else {
      filter.status = { $in: [UnionStatus.ACTIVE, UnionStatus.STRIKING, UnionStatus.NEGOTIATING] };
    }

    if (query.sector) {
      filter.sector = query.sector;
    }
    if (query.scope) {
      filter.scope = query.scope;
    }
    if (query.stateCode) {
      filter.stateCode = query.stateCode;
    }
    if (query.minMembers !== undefined) {
      filter.memberCount = { ...filter.memberCount, $gte: query.minMembers };
    }
    if (query.maxMembers !== undefined) {
      filter.memberCount = { ...filter.memberCount, $lte: query.maxMembers };
    }
    if (query.minStrength !== undefined) {
      filter['strength.overall'] = { $gte: query.minStrength };
    }
    if (query.myUnions) {
      filter['members.playerId'] = session.user.id;
    }
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    // Execute query
    const unions = await Union
      .find(filter)
      .select({
        name: 1,
        slug: 1,
        acronym: 1,
        description: 1,
        sector: 1,
        scope: 1,
        status: 1,
        stateCode: 1,
        presidentId: 1,
        memberCount: 1,
        strength: 1,
        isPublic: 1,
        membershipOpen: 1,
        createdAt: 1,
        // Get president name from members array
        members: { $elemMatch: { role: UnionMemberRole.PRESIDENT } },
      })
      .sort({ [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean();

    const total = await Union.countDocuments(filter);

    // Transform to summary format
    const unionSummaries = unions.map((union) => {
      const presidentMember = union.members?.[0];
      return {
        id: union._id.toString(),
        name: union.name,
        slug: union.slug,
        acronym: union.acronym,
        description: union.description?.slice(0, 200) + (union.description && union.description.length > 200 ? '...' : ''),
        sector: union.sector,
        sectorLabel: UNION_SECTOR_LABELS[union.sector as UnionSector],
        scope: union.scope,
        status: union.status,
        statusLabel: UNION_STATUS_LABELS[union.status as UnionStatus],
        stateCode: union.stateCode,
        memberCount: union.memberCount,
        strength: union.strength?.overall || 0,
        presidentId: union.presidentId,
        presidentName: presidentMember?.displayName || 'Unknown',
        isPublic: union.isPublic,
        membershipOpen: union.membershipOpen,
        currentlyStriking: union.status === UnionStatus.STRIKING,
        createdAt: union.createdAt,
      };
    });

    return createSuccessResponse({
      unions: unionSummaries,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(total / query.limit),
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Unions GET] Error:', error);
    return createErrorResponse('Failed to fetch unions', 'INTERNAL_ERROR', 500);
  }
}

// ===================== POST HANDLER =====================

/**
 * POST /api/politics/unions
 * 
 * Create a new labor union.
 * The creating player becomes the founding president.
 * 
 * Request Body:
 * - name: Union name (3-100 chars)
 * - acronym: Optional abbreviation (e.g., "UAW")
 * - description: Description/mission (10-2000 chars)
 * - motto: Optional motto
 * - sector: Industry sector enum
 * - scope: Geographic scope enum
 * - stateCode: Required for STATE/LOCAL scope
 * - headquarters: Location information
 * - duesConfig: Optional dues configuration
 * - isPublic: Whether union is publicly visible
 * - membershipOpen: Whether accepting new members
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const body = await request.json();
    const validatedData = createUnionSchema.parse(body);

    // Check if user is already president of an active union
    const existingPresidency = await Union.findOne({
      presidentId: session.user.id,
      status: { $in: [UnionStatus.ORGANIZING, UnionStatus.ACTIVE, UnionStatus.STRIKING, UnionStatus.NEGOTIATING] },
    });

    if (existingPresidency) {
      return createErrorResponse(
        'You are already president of an active union. Step down or dissolve first.',
        'ALREADY_PRESIDENT',
        409
      );
    }

    // Generate unique slug
    let slug = generateSlug(validatedData.name);
    let slugAttempt = 0;
    while (await Union.findOne({ slug })) {
      slugAttempt++;
      slug = `${generateSlug(validatedData.name)}-${slugAttempt}`;
    }

    const now = Date.now();

    // Create founding member entry
    const founderMember: UnionMember = {
      playerId: session.user.id,
      displayName: session.user.name || 'President',
      role: UnionMemberRole.PRESIDENT,
      workplace: 'Founding Organizer',
      joinedAt: now,
      totalDuesPaid: 0,
      standing: 100, // Founder starts with max standing
      meetingsAttended: 0,
      actionsParticipated: 0,
      lastActiveAt: now,
      duesPaidCurrentCycle: true, // Founder exempt from first cycle
      isOfficer: true,
      electedAt: now,
    };

    // Create union
    const union = await Union.create({
      name: validatedData.name,
      slug,
      acronym: validatedData.acronym,
      description: validatedData.description,
      motto: validatedData.motto,
      sector: validatedData.sector,
      scope: validatedData.scope,
      status: UnionStatus.ORGANIZING,
      stateCode: validatedData.stateCode,
      headquarters: validatedData.headquarters,
      founderId: session.user.id,
      presidentId: session.user.id,
      foundedAt: now,
      members: [founderMember],
      memberCount: 1,
      potentialMembers: 0, // Can be updated later
      applications: [],
      finances: calculateInitialFinances(),
      duesConfig: validatedData.duesConfig || {
        amountPerCycle: 50,
        cycleDays: 30,
        gracePeriodDays: 14,
        mandatory: true,
        reducedRateForUnemployed: true,
        strikeFundAllocation: 20,
      },
      issuePositions: [],
      endorsements: [],
      legislativePositions: [],
      actions: [],
      strikeDaysThisYear: 0,
      contracts: [],
      activeContractCount: 0,
      strength: calculateInitialStrength(),
      relationships: [],
      affiliateUnionIds: [],
      isPublic: validatedData.isPublic,
      membershipOpen: validatedData.membershipOpen,
      requiresWorkplaceVerification: false,
      minimumStandingRequired: 0,
      schemaVersion: 1,
    });

    return createSuccessResponse(
      {
        union: {
          id: union._id.toString(),
          name: union.name,
          slug: union.slug,
          acronym: union.acronym,
          sector: union.sector,
          sectorLabel: UNION_SECTOR_LABELS[union.sector],
          scope: union.scope,
          status: union.status,
          statusLabel: UNION_STATUS_LABELS[union.status],
          stateCode: union.stateCode,
          memberCount: union.memberCount,
        },
        message: `Union "${union.name}" created successfully. You are the founding president. Recruit more members to become fully active!`,
      },
      undefined,
      201
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid union data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Unions POST] Error:', error);
    return createErrorResponse('Failed to create union', 'INTERNAL_ERROR', 500);
  }
}
