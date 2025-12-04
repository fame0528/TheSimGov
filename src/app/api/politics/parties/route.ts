/**
 * @fileoverview Party API Routes - List and Create
 * @module app/api/politics/parties/route
 * 
 * OVERVIEW:
 * API routes for listing and creating player-founded political party organizations.
 * 
 * ENDPOINTS:
 * - GET /api/politics/parties - List parties with filters
 * - POST /api/politics/parties - Create a new party
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import PartyModel from '@/lib/db/models/politics/Party';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { PartyLevel, PartyStatus, PartyMemberRole } from '@/lib/types/party';
import { PoliticalParty } from '@/types/politics';
import type { PartySummary, PartyMember } from '@/lib/types/party';

// ===================== VALIDATION SCHEMAS =====================

const listPartiesSchema = z.object({
  affiliation: z.nativeEnum(PoliticalParty).optional(),
  level: z.nativeEnum(PartyLevel).optional(),
  stateCode: z.string().length(2).toUpperCase().optional(),
  status: z.nativeEnum(PartyStatus).optional(),
  minMembers: z.coerce.number().int().min(0).optional(),
  maxMembers: z.coerce.number().int().min(0).optional(),
  minStrength: z.coerce.number().min(0).max(100).optional(),
  search: z.string().max(100).optional(),
  memberId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['name', 'memberCount', 'strength', 'createdAt']).default('memberCount'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createPartySchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be at most 100 characters')
    .regex(/^[a-zA-Z0-9\s\-']+$/, 'Name can only contain letters, numbers, spaces, hyphens, and apostrophes'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be at most 2000 characters'),
  affiliation: z.nativeEnum(PoliticalParty, {
    errorMap: () => ({ message: 'Invalid party affiliation' }),
  }),
  level: z.nativeEnum(PartyLevel, {
    errorMap: () => ({ message: 'Invalid party level' }),
  }),
  stateCode: z
    .string()
    .length(2, 'State code must be exactly 2 characters')
    .toUpperCase()
    .optional(),
  registrationOpen: z.boolean().default(true),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Primary color must be a valid hex color')
    .optional(),
  preamble: z
    .string()
    .max(5000, 'Preamble must be at most 5000 characters')
    .optional(),
});

// ===================== HELPER FUNCTIONS =====================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

async function generateUniqueSlug(baseName: string): Promise<string> {
  const baseSlug = generateSlug(baseName);
  let slug = baseSlug;
  let counter = 1;

  while (await PartyModel.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
    if (counter > 100) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
}

// ===================== GET HANDLER =====================

/**
 * GET /api/politics/parties
 * List parties with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validation = listPartiesSchema.safeParse(params);
    if (!validation.success) {
      return createErrorResponse('Invalid parameters', 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const {
      affiliation,
      level,
      stateCode,
      status,
      minMembers,
      maxMembers,
      minStrength,
      search,
      memberId,
      page,
      limit,
      sortBy,
      sortOrder,
    } = validation.data;

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (affiliation) query.affiliation = affiliation;
    if (level) query.level = level;
    if (stateCode) query.stateCode = stateCode;
    if (status) {
      query.status = status;
    } else {
      // Default to active parties
      query.status = PartyStatus.ACTIVE;
    }
    if (memberId) query['members.playerId'] = memberId;

    if (minMembers !== undefined || maxMembers !== undefined) {
      query.memberCount = {};
      if (minMembers !== undefined) query.memberCount.$gte = minMembers;
      if (maxMembers !== undefined) query.memberCount.$lte = maxMembers;
    }

    if (minStrength !== undefined) {
      query['strength.overall'] = { $gte: minStrength };
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Build sort
    const sortMap: Record<string, string> = {
      name: 'name',
      memberCount: 'memberCount',
      strength: 'strength.overall',
      createdAt: 'createdAt',
    };
    const sort: Record<string, 1 | -1> = {
      [sortMap[sortBy]]: sortOrder === 'asc' ? 1 : -1,
    };

    // Execute queries
    const skip = (page - 1) * limit;

    const [parties, total] = await Promise.all([
      PartyModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
      PartyModel.countDocuments(query),
    ]);

    // Transform to summaries
    const summaries: PartySummary[] = parties.map((party) => {
      const chairMember = party.members.find((m: PartyMember) => m.role === PartyMemberRole.CHAIR);
      return {
        id: party._id.toString(),
        name: party.name,
        slug: party.slug,
        description: party.description,
        affiliation: party.affiliation,
        level: party.level,
        stateCode: party.stateCode,
        status: party.status,
        memberCount: party.memberCount,
        strength: party.strength.overall,
        chairId: party.chairId,
        chairName: chairMember?.displayName || 'Unknown',
        registrationOpen: party.registrationOpen,
        primaryColor: party.primaryColor,
        createdAt: party.createdAt,
      };
    });

    return createSuccessResponse({
      parties: summaries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Parties GET] Error:', error);
    return createErrorResponse('Failed to fetch parties', 'INTERNAL_ERROR', 500);
  }
}

// ===================== POST HANDLER =====================

/**
 * POST /api/politics/parties
 * Create a new party organization
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const body = await request.json();
    const validation = createPartySchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse('Invalid party data', 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const { name, description, affiliation, level, stateCode, registrationOpen, primaryColor, preamble } =
      validation.data;

    // Validate state code for STATE level
    if (level === PartyLevel.STATE && !stateCode) {
      return createErrorResponse('State code is required for state-level parties', 'VALIDATION_ERROR', 400);
    }

    // Check for duplicate name in same affiliation/level
    const existing = await PartyModel.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      affiliation,
      level,
      ...(stateCode && { stateCode }),
    });

    if (existing) {
      return createErrorResponse('A party with this name already exists at this level', 'DUPLICATE', 409);
    }

    // Check if user already chairs a party at same level
    const existingChair = await PartyModel.findOne({
      chairId: session.user.id,
      level,
      status: PartyStatus.ACTIVE,
    });

    if (existingChair) {
      return createErrorResponse('You already chair a party at this level', 'ALREADY_CHAIR', 409);
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(name);
    const now = Date.now();

    // Create founder as chair member
    const founderMember: PartyMember = {
      playerId: session.user.id,
      displayName: session.user.name || 'Unknown',
      role: PartyMemberRole.CHAIR,
      joinedAt: now,
      totalContributions: 0,
      standing: 100,
      votesCast: 0,
      delegateEligible: true,
      lastActiveAt: now,
      contributionTier: 'BRONZE',
    };

    // Create party
    const party = new PartyModel({
      name,
      slug,
      description,
      affiliation,
      level,
      stateCode: level === PartyLevel.STATE ? stateCode : undefined,
      status: PartyStatus.ACTIVE,
      founderId: session.user.id,
      chairId: session.user.id,
      foundedAt: now,
      members: [founderMember],
      memberCount: 1,
      applications: [],
      treasury: 0,
      platform: {
        version: 1,
        adoptedAt: now,
        planks: [],
        preamble: preamble || '',
      },
      primaries: [],
      conventions: [],
      endorsements: [],
      proposals: [],
      strength: {
        overall: 10,
        membershipScore: 10,
        treasuryScore: 0,
        electoralScore: 0,
        activityScore: 0,
        winRate: 0,
        calculatedAt: now,
      },
      registrationOpen,
      minimumDelegateStanding: 60,
      primaryColor,
      schemaVersion: 1,
    });

    await party.save();

    return createSuccessResponse(
      {
        party: {
          id: party._id.toString(),
          name: party.name,
          slug: party.slug,
          affiliation: party.affiliation,
          level: party.level,
          stateCode: party.stateCode,
          status: party.status,
          memberCount: party.memberCount,
        },
        message: `Party "${party.name}" created successfully. You are the founding chair.`,
      },
      undefined,
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid party data', 'VALIDATION_ERROR', 400, error.errors);
    }
    console.error('[Parties POST] Error:', error);
    return createErrorResponse('Failed to create party', 'INTERNAL_ERROR', 500);
  }
}
