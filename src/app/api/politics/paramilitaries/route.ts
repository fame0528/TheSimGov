/**
 * @file src/app/api/politics/paramilitaries/route.ts
 * @description Paramilitaries API - List and Create armed organizations
 * @module api/politics/paramilitaries
 * 
 * OVERVIEW:
 * CRUD operations for paramilitaries (armed political organizations).
 * Includes military forces, police, organized crime, PMCs, militias,
 * and security firms.
 * 
 * ENDPOINTS:
 * GET  /api/politics/paramilitaries - List paramilitaries with filtering
 * POST /api/politics/paramilitaries - Create a new paramilitary
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Paramilitary from '@/lib/db/models/politics/Paramilitary';
import {
  ParamilitaryType,
  ParamilitaryScope,
  ParamilitaryStatus,
  ParamilitaryMemberRole,
  type ParamilitaryMember,
  type ParamilitaryStrength,
  PARAMILITARY_TYPE_LABELS,
} from '@/lib/types/paramilitary';
import { z } from 'zod';

// ===================== VALIDATION SCHEMAS =====================

/**
 * Query schema for listing paramilitaries
 */
const paramilitaryQuerySchema = z.object({
  type: z.nativeEnum(ParamilitaryType).optional(),
  scope: z.nativeEnum(ParamilitaryScope).optional(),
  status: z.nativeEnum(ParamilitaryStatus).optional(),
  stateCode: z.string().length(2).toUpperCase().optional(),
  minMembers: z.coerce.number().int().min(1).optional(),
  maxMembers: z.coerce.number().int().min(1).optional(),
  minStrength: z.coerce.number().int().min(0).max(100).optional(),
  search: z.string().min(1).max(100).optional(),
  myGroups: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['memberCount', 'strength.overall', 'createdAt', 'name']).default('memberCount'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema for creating a paramilitary
 */
const createParamilitarySchema = z.object({
  name: z.string().min(3).max(100).trim(),
  description: z.string().min(10).max(2000).trim(),
  type: z.nativeEnum(ParamilitaryType),
  scope: z.nativeEnum(ParamilitaryScope),
  stateCode: z.string().length(2).toUpperCase().optional(),
  recruiting: z.boolean().default(true),
}).refine(
  (data) => {
    // State scope requires stateCode
    if (data.scope === ParamilitaryScope.STATE && !data.stateCode) {
      return false;
    }
    return true;
  },
  { message: 'State scope requires a stateCode' }
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
 * Calculate initial paramilitary strength
 */
function calculateInitialStrength(): ParamilitaryStrength {
  return {
    overall: 10,
    militaryPower: 5,
    financialStrength: 0,
    territorialControl: 0,
    politicalInfluence: 0,
    notoriety: 0,
    calculatedAt: Date.now(),
  };
}

// ===================== GET HANDLER =====================

/**
 * GET /api/politics/paramilitaries
 * 
 * List paramilitaries with optional filtering.
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

    const query = paramilitaryQuerySchema.parse(queryParams);

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    // Default to active paramilitaries
    if (query.status) {
      filter.status = query.status;
    } else {
      filter.status = { $in: [ParamilitaryStatus.ACTIVE, ParamilitaryStatus.AT_WAR] };
    }

    if (query.type) {
      filter.type = query.type;
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
    if (query.myGroups) {
      filter['members.playerId'] = session.user.id;
    }
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    // Execute query
    const paramilitaries = await Paramilitary
      .find(filter)
      .select({
        name: 1,
        slug: 1,
        description: 1,
        type: 1,
        scope: 1,
        status: 1,
        stateCode: 1,
        bossId: 1,
        memberCount: 1,
        totalTroops: 1,
        strength: 1,
        recruiting: 1,
        createdAt: 1,
        // Get boss name from members array
        members: { $elemMatch: { role: ParamilitaryMemberRole.BOSS } },
      })
      .sort({ [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean();

    const total = await Paramilitary.countDocuments(filter);

    // Transform to summary format
    const paramilitarySummaries = paramilitaries.map((pm) => {
      const bossMember = pm.members?.[0];
      return {
        id: pm._id.toString(),
        name: pm.name,
        slug: pm.slug,
        description: pm.description?.slice(0, 200) + (pm.description && pm.description.length > 200 ? '...' : ''),
        type: pm.type,
        typeLabel: PARAMILITARY_TYPE_LABELS[pm.type as ParamilitaryType],
        scope: pm.scope,
        status: pm.status,
        stateCode: pm.stateCode,
        memberCount: pm.memberCount,
        totalTroops: pm.totalTroops || 0,
        strength: pm.strength?.overall || 0,
        bossId: pm.bossId,
        bossName: bossMember?.displayName || 'Unknown',
        recruiting: pm.recruiting,
        createdAt: pm.createdAt,
      };
    });

    return createSuccessResponse({
      paramilitaries: paramilitarySummaries,
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
    console.error('[Paramilitaries GET] Error:', error);
    return createErrorResponse('Failed to fetch paramilitaries', 'INTERNAL_ERROR', 500);
  }
}

// ===================== POST HANDLER =====================

/**
 * POST /api/politics/paramilitaries
 * 
 * Create a new paramilitary organization.
 * The creating player becomes the founding boss.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const body = await request.json();
    const validatedData = createParamilitarySchema.parse(body);

    // Check if user is already boss of a paramilitary
    const existingBoss = await Paramilitary.findOne({
      bossId: session.user.id,
      status: { $in: [ParamilitaryStatus.ACTIVE, ParamilitaryStatus.AT_WAR, ParamilitaryStatus.UNDER_INVESTIGATION] },
    });

    if (existingBoss) {
      return createErrorResponse(
        'You are already boss of an active organization. Step down or disband first.',
        'ALREADY_BOSS',
        409
      );
    }

    // Generate unique slug
    let slug = generateSlug(validatedData.name);
    let slugAttempt = 0;
    while (await Paramilitary.findOne({ slug })) {
      slugAttempt++;
      slug = `${generateSlug(validatedData.name)}-${slugAttempt}`;
    }

    const now = Date.now();

    // Create founding member entry
    const founderMember: ParamilitaryMember = {
      playerId: session.user.id,
      displayName: session.user.name || 'Boss',
      role: ParamilitaryMemberRole.BOSS,
      joinedAt: now,
      operationsCompleted: 0,
      standing: 100, // Boss starts with max standing
      profitShare: 30, // Boss gets 30% profit share
      active: true,
      personalHeat: 0,
      lastActiveAt: now,
    };

    // Create paramilitary
    const paramilitary = await Paramilitary.create({
      name: validatedData.name,
      slug,
      description: validatedData.description,
      type: validatedData.type,
      scope: validatedData.scope,
      status: ParamilitaryStatus.ACTIVE,
      stateCode: validatedData.stateCode,
      founderId: session.user.id,
      bossId: session.user.id,
      foundedAt: now,
      
      members: [founderMember],
      memberCount: 1,
      troops: [],
      totalTroops: 0,
      applications: [],
      
      treasury: 0,
      dirtyMoney: 0,
      weeklyExpenses: 0,
      contraband: [],
      launderingOps: [],
      
      territories: [],
      conflicts: [],
      operationHistory: [],
      
      heatLevel: 0,
      lawEnforcementAttention: 0,
      wantedLevel: 0,
      
      strength: calculateInitialStrength(),
      
      recruiting: validatedData.recruiting,
      minimumStandingRequired: 0,
      
      schemaVersion: 1,
    });

    return createSuccessResponse(
      {
        paramilitary: {
          id: paramilitary._id.toString(),
          name: paramilitary.name,
          slug: paramilitary.slug,
          type: paramilitary.type,
          typeLabel: PARAMILITARY_TYPE_LABELS[paramilitary.type],
          scope: paramilitary.scope,
          status: paramilitary.status,
          stateCode: paramilitary.stateCode,
          memberCount: paramilitary.memberCount,
          recruiting: paramilitary.recruiting,
        },
        message: `${PARAMILITARY_TYPE_LABELS[paramilitary.type]} "${paramilitary.name}" created successfully. You are the founding boss.`,
      },
      undefined,
      201
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid paramilitary data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Paramilitaries POST] Error:', error);
    return createErrorResponse('Failed to create paramilitary', 'INTERNAL_ERROR', 500);
  }
}
