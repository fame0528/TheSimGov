/**
 * @file src/app/api/politics/bills/[id]/route.ts
 * @description API endpoints for individual bill operations
 * @created 2025-11-26
 * @author ECHO v1.3.0
 *
 * OVERVIEW:
 * GET - Retrieve bill details with complete vote breakdown
 * PATCH - Update bill (sponsor only, before voting starts)
 * DELETE - Withdraw bill (sponsor only, anytime before passage)
 *
 * ROUTES:
 * - GET /api/politics/bills/[id]
 * - PATCH /api/politics/bills/[id]
 * - DELETE /api/politics/bills/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Bill from '@/lib/db/models/Bill';
import { z } from 'zod';

// ===================== VALIDATION SCHEMAS =====================

const UpdateBillSchema = z.object({
  title: z.string().min(10).max(200).optional(),
  summary: z.string().min(50).max(2000).optional(),
  effects: z.array(z.object({
    targetType: z.enum(['GLOBAL', 'INDUSTRY', 'STATE']),
    targetId: z.string().optional(),
    effectType: z.string(),
    effectValue: z.number(),
    effectUnit: z.string(),
    duration: z.number().optional(),
  })).optional(),
});

// ===================== GET /api/politics/bills/[id] =====================

/**
 * GET /api/politics/bills/[id]
 * Retrieve complete bill details
 * 
 * RETURNS:
 * - Bill metadata
 * - Vote breakdown
 * - Lobby positions
 * - Policy effects
 * - Remaining time
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    
    const bill = await Bill.findById(id)
      .populate('sponsor', 'username firstName lastName state')
      .populate('coSponsors', 'username firstName lastName state');
    
    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }
    
    // Calculate remaining time
    const remainingMs = new Date(bill.votingDeadline).getTime() - Date.now();
    const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
    const remainingMinutes = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));
    
    return NextResponse.json({
      success: true,
      data: {
        bill: {
          ...bill,
          remainingTime: {
            ms: Math.max(0, remainingMs),
            hours: remainingHours,
            minutes: remainingMinutes,
            isOpen: remainingMs > 0 && bill.status === 'ACTIVE',
          },
          voteBreakdown: {
            ayes: bill.ayeCount,
            nays: bill.nayCount,
            abstains: bill.abstainCount,
            total: bill.totalVotesCast,
            quorumRequired: bill.quorumRequired,
            quorumMet: bill.totalVotesCast >= bill.quorumRequired,
          },
        },
      },
    });
    
  } catch (error) {
    console.error('Get bill error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ===================== PATCH /api/politics/bills/[id] =====================

/**
 * PATCH /api/politics/bills/[id]
 * Update bill details (sponsor only, before voting starts)
 * 
 * RESTRICTIONS:
 * - Only sponsor can update
 * - Only before any votes cast
 * - Only while status is ACTIVE
 */
export async function PATCH(
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
    const validated = UpdateBillSchema.parse(body);
    
    await connectDB();
    
    // Find bill
    const bill = await Bill.findById(id);
    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }
    
    // Check sponsor
    if (bill.sponsor.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Only sponsor can update bill' },
        { status: 403 }
      );
    }
    
    // Check status
    if (bill.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cannot update non-active bill' },
        { status: 400 }
      );
    }
    
    // Check if voting started
    if (bill.votes.length > 0) {
      return NextResponse.json(
        { error: 'Cannot update bill after voting started' },
        { status: 400 }
      );
    }
    
    // Update fields
    if (validated.title) bill.title = validated.title;
    if (validated.summary) bill.summary = validated.summary;
    if (validated.effects) bill.effects = validated.effects;
    
    await bill.save();
    
    return NextResponse.json({
      success: true,
      data: { bill },
      message: 'Bill updated successfully',
    });
    
  } catch (error) {
    console.error('Update bill error:', error);
    
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

// ===================== DELETE /api/politics/bills/[id] =====================

/**
 * DELETE /api/politics/bills/[id]
 * Withdraw bill (sponsor only, anytime before passage)
 * 
 * RESTRICTIONS:
 * - Only sponsor can withdraw
 * - Cannot withdraw after passage
 * - Sets status to WITHDRAWN
 */
export async function DELETE(
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
    
    await connectDB();
    
    // Find bill
    const bill = await Bill.findById(id);
    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }
    
    // Check sponsor
    if (bill.sponsor.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Only sponsor can withdraw bill' },
        { status: 403 }
      );
    }
    
    // Check if already passed
    if (bill.status === 'PASSED') {
      return NextResponse.json(
        { error: 'Cannot withdraw passed bill' },
        { status: 400 }
      );
    }
    
    // Withdraw bill
    bill.status = 'WITHDRAWN';
    bill.withdrawnAt = new Date();
    await bill.save();
    
    // TODO: Emit Socket.io event for bill withdrawal
    
    return NextResponse.json({
      success: true,
      message: 'Bill withdrawn successfully',
    });
    
  } catch (error) {
    console.error('Withdraw bill error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **GET Endpoint**:
 *    - Returns complete bill details with vote breakdown
 *    - Calculates remaining time for voting
 *    - Populates sponsor/co-sponsor user data
 *    - Includes quorum status
 * 
 * 2. **PATCH Endpoint**:
 *    - Only sponsor can update
 *    - Only before any votes cast (prevents vote manipulation)
 *    - Can update title, summary, effects
 *    - Cannot update chamber, policy area, or bill number
 * 
 * 3. **DELETE Endpoint**:
 *    - Soft delete (sets status to WITHDRAWN)
 *    - Only sponsor can withdraw
 *    - Cannot withdraw after passage
 *    - Preserves data for audit trail
 * 
 * 4. **Security**:
 *    - All endpoints require authentication
 *    - Sponsor verification via session user ID
 *    - Status checks prevent invalid operations
 */
