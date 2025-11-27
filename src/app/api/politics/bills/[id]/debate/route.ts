/**
 * @file src/app/api/politics/bills/[id]/debate/route.ts
 * @description API endpoints for legislative debate statements
 * @created 2025-11-26
 * @author ECHO v1.3.0
 *
 * OVERVIEW:
 * POST endpoint for submitting debate statements with 3-statement limit
 * GET endpoint for listing debate statements with pagination
 *
 * ROUTES:
 * - POST /api/politics/bills/[id]/debate
 * - GET /api/politics/bills/[id]/debate
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Bill from '@/lib/db/models/Bill';
import DebateStatement from '@/lib/db/models/DebateStatement';
import type { DebatePosition } from '@/lib/db/models/DebateStatement';
import { z } from 'zod';

// ===================== VALIDATION SCHEMAS =====================

const CreateDebateStatementSchema = z.object({
  position: z.enum(['FOR', 'AGAINST', 'NEUTRAL']),
  text: z.string().min(50).max(2000),
});

const ListDebateStatementsQuerySchema = z.object({
  position: z.enum(['FOR', 'AGAINST', 'NEUTRAL']).optional(),
  sortBy: z.enum(['createdAt', 'upvotes', 'persuasionScore']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ===================== POST /api/politics/bills/[id]/debate =====================

/**
 * POST /api/politics/bills/[id]/debate
 * Submit debate statement with 3-statement limit enforcement
 * 
 * REQUEST BODY:
 * - position: 'FOR' | 'AGAINST' | 'NEUTRAL'
 * - text: Debate statement (50-2000 characters)
 * 
 * LIMITS:
 * - Max 3 statements per player per bill
 * - 5-minute edit window after submission
 * - Must be before voting deadline
 * 
 * PERSUASION:
 * - Score calculated based on text quality
 * - ±5% maximum vote swing
 * - Upvotes increase persuasion impact
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const validated = CreateDebateStatementSchema.parse(body);
    
    await connectDB();
    
    // Find bill
    const bill = await Bill.findById(id);
    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }
    
    // Check voting is still open
    if (!bill.isVotingOpen()) {
      return NextResponse.json(
        { error: 'Cannot submit debate statement after voting closes' },
        { status: 400 }
      );
    }
    
    // Check 3-statement limit
    const existingCount = await DebateStatement.countDocuments({
      billId: id,
      playerId: session.user.id,
    });
    
    if (existingCount >= 3) {
      return NextResponse.json(
        { error: 'Maximum 3 debate statements per player per bill' },
        { status: 429 }
      );
    }
    
    // Create debate statement
    const statement = await DebateStatement.create({
      billId: id,
      playerId: session.user.id,
      position: validated.position as DebatePosition,
      text: validated.text,
    });
    
    // Add to bill's debate statements
    bill.debateStatements.push(statement._id);
    await bill.save();
    
    // TODO: Emit Socket.io event for new debate statement
    
    return NextResponse.json({
      success: true,
      data: {
        statement: {
          id: statement._id,
          billId: statement.billId,
          playerId: statement.playerId,
          position: statement.position,
          text: statement.text,
          persuasionScore: statement.persuasionScore,
          upvotes: statement.upvotes,
          createdAt: statement.createdAt,
          canEdit: statement.isEditable(),
        },
      },
      message: 'Debate statement submitted successfully',
    });
    
  } catch (error) {
    console.error('Create debate statement error:', error);
    
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

// ===================== GET /api/politics/bills/[id]/debate =====================

/**
 * GET /api/politics/bills/[id]/debate
 * List debate statements for bill
 * 
 * QUERY PARAMETERS:
 * - position: Filter by position (FOR/AGAINST/NEUTRAL)
 * - sortBy: Sort field (createdAt/upvotes/persuasionScore)
 * - order: Sort order (asc/desc)
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 50)
 * 
 * RETURNS:
 * - Debate statements with persuasion scores
 * - Player information (username, state)
 * - Upvote counts
 * - Edit status (5-minute window)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    const validated = ListDebateStatementsQuerySchema.parse(queryParams);
    
    await connectDB();
    
    // Verify bill exists
    const bill = await Bill.findById(id);
    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }
    
    // Build filter
    const filter: Record<string, unknown> = { billId: id };
    if (validated.position) {
      filter.position = validated.position;
    }
    
    // Calculate pagination
    const skip = (validated.page - 1) * validated.limit;
    
    // Build sort
    const sortOrder = validated.order === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [validated.sortBy]: sortOrder };
    
    // Query statements
    const [statements, total] = await Promise.all([
      DebateStatement.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(validated.limit)
        .populate('playerId', 'username firstName lastName state')
        .lean(),
      DebateStatement.countDocuments(filter),
    ]);
    
    // Add edit status to each statement
    const now = new Date();
    const statementsWithEditStatus = statements.map(stmt => ({
      ...stmt,
      canEdit: stmt.editableUntil && stmt.editableUntil > now,
    }));
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / validated.limit);
    
    // Group by position for summary
    const summary = {
      for: await DebateStatement.countDocuments({ billId: id, position: 'FOR' }),
      against: await DebateStatement.countDocuments({ billId: id, position: 'AGAINST' }),
      neutral: await DebateStatement.countDocuments({ billId: id, position: 'NEUTRAL' }),
    };
    
    return NextResponse.json({
      success: true,
      data: {
        statements: statementsWithEditStatus,
        summary,
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
    console.error('List debate statements error:', error);
    
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
 * 1. **3-Statement Limit**:
 *    - Enforced via DebateStatement.countPlayerStatements()
 *    - Prevents spam and encourages quality arguments
 *    - Counted per player per bill
 * 
 * 2. **5-Minute Edit Window**:
 *    - editableUntil field set 5 minutes from creation
 *    - isEditable() method checks current time
 *    - Prevents retroactive changes after engagement
 * 
 * 3. **Persuasion Scoring**:
 *    - Score calculated in DebateStatement model
 *    - Range: -5.0 to +5.0 (percentage points)
 *    - Higher upvotes increase impact
 *    - Capped to prevent manipulation
 * 
 * 4. **Pagination & Sorting**:
 *    - Sort by date, upvotes, or persuasion score
 *    - Default 20 per page (max 50)
 *    - Position filter for FOR/AGAINST/NEUTRAL
 * 
 * 5. **Summary Stats**:
 *    - Count of statements per position
 *    - Helps gauge debate sentiment
 *    - Included with every GET request
 */
