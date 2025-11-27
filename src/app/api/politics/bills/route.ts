/**
 * @file src/app/api/politics/bills/route.ts
 * @description API endpoints for creating and listing legislative bills
 * @created 2025-11-26
 * @author ECHO v1.3.0
 *
 * OVERVIEW:
 * POST endpoint for bill creation with anti-abuse limits enforcement
 * GET endpoint for listing bills with filtering and pagination
 *
 * ROUTES:
 * - POST /api/politics/bills - Create new bill (elected officials only)
 * - GET /api/politics/bills - List bills with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Bill from '@/lib/db/models/Bill';
import type { Chamber, PolicyArea } from '@/lib/db/models/Bill';
import { generateLobbyPositions } from '@/lib/utils/politics/lobbySystem';
import { z } from 'zod';

// ===================== VALIDATION SCHEMAS =====================

const CreateBillSchema = z.object({
  chamber: z.enum(['senate', 'house']),
  title: z.string().min(10).max(200),
  summary: z.string().min(50).max(2000),
  policyArea: z.enum([
    'tax', 'budget', 'regulatory', 'trade', 'energy', 'healthcare',
    'labor', 'environment', 'technology', 'defense', 'custom'
  ]),
  coSponsors: z.array(z.string()).optional().default([]),
  effects: z.array(z.object({
    targetType: z.enum(['GLOBAL', 'INDUSTRY', 'STATE']),
    targetId: z.string().optional(),
    effectType: z.string(),
    effectValue: z.number(),
    effectUnit: z.string(),
    duration: z.number().optional(),
  })).optional().default([]),
});

const ListBillsQuerySchema = z.object({
  chamber: z.enum(['senate', 'house']).optional(),
  status: z.enum(['ACTIVE', 'PASSED', 'FAILED', 'WITHDRAWN', 'EXPIRED']).optional(),
  policyArea: z.enum([
    'tax', 'budget', 'regulatory', 'trade', 'energy', 'healthcare',
    'labor', 'environment', 'technology', 'defense', 'custom'
  ]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['submittedAt', 'votingDeadline', 'title']).default('submittedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ===================== ANTI-ABUSE LIMITS =====================

const ANTI_ABUSE_LIMITS = {
  MAX_ACTIVE_BILLS_PER_PLAYER: 3,
  MAX_BILLS_PER_CHAMBER_PER_DAY: 10,
  COOLDOWN_HOURS: 24,
};

/**
 * Check if player is eligible to submit bill
 * Enforces anti-abuse limits:
 * - Max 3 active bills per player
 * - Max 10 bills per chamber per day
 * - 24h cooldown between submissions
 */
async function checkSubmissionEligibility(
  playerId: string,
  chamber: Chamber
): Promise<{ eligible: boolean; reason?: string }> {
  // Check active bills count
  const activeBillsCount = await Bill.countDocuments({
    sponsor: playerId,
    status: 'ACTIVE',
  });
  
  if (activeBillsCount >= ANTI_ABUSE_LIMITS.MAX_ACTIVE_BILLS_PER_PLAYER) {
    return {
      eligible: false,
      reason: `Maximum ${ANTI_ABUSE_LIMITS.MAX_ACTIVE_BILLS_PER_PLAYER} active bills per player reached`,
    };
  }
  
  // Check chamber daily limit
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const chamberBillsToday = await Bill.countDocuments({
    chamber,
    submittedAt: { $gte: dayAgo },
  });
  
  if (chamberBillsToday >= ANTI_ABUSE_LIMITS.MAX_BILLS_PER_CHAMBER_PER_DAY) {
    return {
      eligible: false,
      reason: `Maximum ${ANTI_ABUSE_LIMITS.MAX_BILLS_PER_CHAMBER_PER_DAY} bills per chamber per day reached`,
    };
  }
  
  // Check cooldown
  const lastBill = await Bill.findOne({
    sponsor: playerId,
  }).sort({ submittedAt: -1 });
  
  if (lastBill?.submissionCooldownExpiresAt && lastBill.submissionCooldownExpiresAt > new Date()) {
    const hoursRemaining = Math.ceil(
      (lastBill.submissionCooldownExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60)
    );
    return {
      eligible: false,
      reason: `Submission cooldown active for ${hoursRemaining} more hours`,
    };
  }
  
  return { eligible: true };
}

/**
 * Generate unique bill number
 */
async function generateBillNumber(chamber: Chamber): Promise<string> {
  const prefix = chamber === 'senate' ? 'S.' : 'H.R.';
  
  // Find highest bill number for chamber
  const lastBill = await Bill.findOne({
    chamber,
    billNumber: new RegExp(`^${prefix.replace('.', '\\.')}`),
  }).sort({ billNumber: -1 });
  
  let nextNumber = 1;
  if (lastBill) {
    const match = lastBill.billNumber.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0], 10) + 1;
    }
  }
  
  return `${prefix}${nextNumber}`;
}

// ===================== POST /api/politics/bills =====================

/**
 * POST /api/politics/bills
 * Create new legislative bill
 * 
 * ANTI-ABUSE ENFORCEMENT:
 * - Max 3 active bills per player
 * - Max 10 bills per chamber per day
 * - 24h cooldown between submissions
 * 
 * LOBBY POSITIONS:
 * - Auto-generated based on policy area
 * - Can be customized in future versions
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse and validate request
    const body = await request.json();
    const validated = CreateBillSchema.parse(body);
    
    // Connect to database
    await connectDB();
    
    // TODO: Check if player is elected official (requires political office system)
    // For now, allow all authenticated users
    
    // Check submission eligibility (anti-abuse limits)
    const eligibility = await checkSubmissionEligibility(
      session.user.id,
      validated.chamber
    );
    
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: eligibility.reason },
        { status: 429 } // Too Many Requests
      );
    }
    
    // Generate bill number
    const billNumber = await generateBillNumber(validated.chamber);
    
    // Generate lobby positions based on policy area
    const lobbyPositions = generateLobbyPositions(
      validated.policyArea as PolicyArea,
      validated.title
    );
    
    // Calculate quorum requirement
    const quorumRequired = validated.chamber === 'senate' ? 50 : 218;
    
    // Set voting deadline (24 real hours from now)
    const votingDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Set submission cooldown (24h from now)
    const submissionCooldownExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Create bill
    const bill = await Bill.create({
      billNumber,
      chamber: validated.chamber,
      title: validated.title,
      summary: validated.summary,
      policyArea: validated.policyArea,
      sponsor: session.user.id,
      coSponsors: validated.coSponsors,
      votingDeadline,
      quorumRequired,
      lobbyPositions,
      effects: validated.effects,
      status: 'ACTIVE',
      submissionCooldownExpiresAt,
    });
    
    // TODO: Emit Socket.io event for new bill
    
    return NextResponse.json({
      success: true,
      data: {
        bill: {
          id: bill._id,
          billNumber: bill.billNumber,
          chamber: bill.chamber,
          title: bill.title,
          summary: bill.summary,
          policyArea: bill.policyArea,
          sponsor: bill.sponsor,
          votingDeadline: bill.votingDeadline,
          lobbyPositions: bill.lobbyPositions,
          effects: bill.effects,
          status: bill.status,
          submittedAt: bill.submittedAt,
        },
      },
      message: 'Bill created successfully',
    });
    
  } catch (error) {
    console.error('Create bill error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ===================== GET /api/politics/bills =====================

/**
 * GET /api/politics/bills
 * List legislative bills with filtering
 * 
 * QUERY PARAMETERS:
 * - chamber: Filter by chamber (senate/house)
 * - status: Filter by status (ACTIVE/PASSED/FAILED/WITHDRAWN/EXPIRED)
 * - policyArea: Filter by policy area
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 * - sortBy: Sort field (submittedAt/votingDeadline/title)
 * - order: Sort order (asc/desc)
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    const validated = ListBillsQuerySchema.parse(queryParams);
    
    // Connect to database
    await connectDB();
    
    // Build filter
    const filter: Record<string, unknown> = {};
    if (validated.chamber) {
      filter.chamber = validated.chamber;
    }
    if (validated.status) {
      filter.status = validated.status;
    }
    if (validated.policyArea) {
      filter.policyArea = validated.policyArea;
    }
    
    // Calculate pagination
    const skip = (validated.page - 1) * validated.limit;
    
    // Build sort
    const sortOrder = validated.order === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [validated.sortBy]: sortOrder };
    
    // Query bills
    const [bills, total] = await Promise.all([
      Bill.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(validated.limit)
        .select('-votes -debateStatements') // Exclude large arrays
        .lean(),
      Bill.countDocuments(filter),
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / validated.limit);
    
    return NextResponse.json({
      success: true,
      data: {
        bills,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          total,
          totalPages,
          hasNext: validated.page < totalPages,
          hasPrev: validated.page > 1,
        },
      },
    });
    
  } catch (error) {
    console.error('List bills error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Anti-Abuse Enforcement**:
 *    - 3 active bills max per player prevents spam
 *    - 10 bills per chamber per day prevents legislative flooding
 *    - 24h cooldown ensures deliberate bill creation
 * 
 * 2. **Auto-Generated Lobby Positions**:
 *    - Based on policy area (energy → renewable_energy + oil_gas)
 *    - Payment rates: $120k Senate, $23k House
 *    - Can be customized manually in future versions
 * 
 * 3. **24h Real-Time Voting**:
 *    - votingDeadline set to Date.now() + 24 hours
 *    - NOT game time - prevents coordination exploits
 * 
 * 4. **Elected Official Check**:
 *    - TODO: Requires political office system integration
 *    - Currently allows all authenticated users
 *    - Will enforce senator/representative check in future
 * 
 * 5. **Pagination**:
 *    - Default 20 bills per page
 *    - Max 100 per page to prevent abuse
 *    - Full pagination metadata returned
 */
