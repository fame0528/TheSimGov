/**
 * @file src/app/api/politics/bills/[id]/vote/route.ts
 * @description API endpoint for casting votes with instant lobby payment processing
 * @created 2025-11-26
 * @author ECHO v1.3.0
 *
 * OVERVIEW:
 * POST endpoint for casting weighted votes on legislative bills.
 * Processes instant lobby payments when vote matches lobby positions.
 * Enforces one vote per player and validates voting window.
 *
 * ROUTE:
 * - POST /api/politics/bills/[id]/vote
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Bill from '@/lib/db/models/Bill';
import type { VoteValue } from '@/lib/db/models/Bill';
import { getSeatCount } from '@/lib/utils/politics/billVoting';
import { z } from 'zod';

// ===================== VALIDATION SCHEMAS =====================

const CastVoteSchema = z.object({
  vote: z.enum(['Aye', 'Nay', 'Abstain']),
  chamber: z.enum(['senate', 'house']),
  state: z.string().optional(), // Required for House, optional for Senate
});

// ===================== POST /api/politics/bills/[id]/vote =====================

/**
 * POST /api/politics/bills/[id]/vote
 * Cast weighted vote on bill with instant lobby payment processing
 * 
 * REQUEST BODY:
 * - vote: 'Aye' | 'Nay' | 'Abstain'
 * - chamber: 'senate' | 'house'
 * - state: State code (required for House, determines delegation count)
 * 
 * INSTANT LOBBY PAYMENTS:
 * - Processed immediately if vote matches lobby position
 * - Multiple lobbies can pay same player on same bill
 * - Payment: $120k × seats (Senate 1, House delegation)
 * 
 * VOTE WEIGHTING:
 * - Senate: 1 vote per senator
 * - House: Delegation count (1-52 based on state)
 * 
 * RETURNS:
 * - Vote confirmation
 * - Lobby payments triggered (IDs and amounts)
 * - Updated vote tallies
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
    const validated = CastVoteSchema.parse(body);
    
    // Validate state for House votes
    if (validated.chamber === 'house' && !validated.state) {
      return NextResponse.json(
        { error: 'State required for House votes' },
        { status: 400 }
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
    
    // Verify chamber matches
    if (bill.chamber !== validated.chamber) {
      return NextResponse.json(
        { error: `Bill is for ${bill.chamber}, not ${validated.chamber}` },
        { status: 400 }
      );
    }
    
    // Check voting is open
    if (!bill.isVotingOpen()) {
      return NextResponse.json(
        { error: 'Voting is closed for this bill' },
        { status: 400 }
      );
    }
    
    // Check if already voted
    if (bill.hasVoted(session.user.id)) {
      return NextResponse.json(
        { error: 'You have already voted on this bill' },
        { status: 400 }
      );
    }
    
    // TODO: Verify player is elected official for this chamber/state
    // For now, allow all authenticated users
    
    // Get seat count
    let seatCount: number;
    try {
      seatCount = getSeatCount(validated.chamber, validated.state);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid state' },
        { status: 400 }
      );
    }
    
    // Cast vote (triggers instant lobby payments)
    const lobbyPaymentIds = await bill.castVote(
      session.user.id,
      validated.vote as VoteValue,
      seatCount
    );
    
    // Get lobby payment details
    const LobbyPayment = (await import('@/lib/db/models/LobbyPayment')).default;
    const lobbyPayments = await LobbyPayment.find({
      _id: { $in: lobbyPaymentIds },
    }).lean();
    
    // Calculate total payment received
    const totalPaymentReceived = lobbyPayments.reduce(
      (sum, payment) => sum + payment.totalPayment,
      0
    );
    
    // Get updated vote tallies
    const tallies = await bill.tallyVotes();
    
    // TODO: Emit Socket.io event for new vote
    // TODO: Credit player account with lobby payments
    
    return NextResponse.json({
      success: true,
      data: {
        vote: {
          playerId: session.user.id,
          vote: validated.vote,
          seatCount,
          votedAt: new Date(),
        },
        lobbyPayments: lobbyPayments.map(p => ({
          lobbyType: p.lobbyType,
          amount: p.totalPayment,
        })),
        totalPaymentReceived,
        tallies: {
          ayes: tallies.ayeCount,
          nays: tallies.nayCount,
          abstains: tallies.abstainCount,
          total: tallies.totalVotes,
          quorumMet: tallies.quorumMet,
          quorumRequired: bill.quorumRequired,
        },
      },
      message: lobbyPayments.length > 0
        ? `Vote cast successfully. Received $${totalPaymentReceived.toLocaleString()} from ${lobbyPayments.length} lobby group(s).`
        : 'Vote cast successfully.',
    });
    
  } catch (error) {
    console.error('Cast vote error:', error);
    
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
 * 1. **Instant Lobby Payments**:
 *    - Processed in Bill.castVote() method
 *    - Multiple lobbies can pay same player
 *    - Payments created with paid: true flag
 *    - Total amount returned in response
 * 
 * 2. **Vote Weighting**:
 *    - Senate: Always 1 seat per senator
 *    - House: Delegation count from HOUSE_DELEGATIONS lookup
 *    - California gets 52 votes, Wyoming gets 1
 * 
 * 3. **Validation**:
 *    - Voting window checked (24h deadline)
 *    - One vote per player enforced
 *    - Chamber/state verification
 *    - Elected official check (TODO)
 * 
 * 4. **Real-Time Updates**:
 *    - Returns updated vote tallies
 *    - Socket.io event for live dashboard updates (TODO)
 *    - Quorum status included
 * 
 * 5. **Security**:
 *    - Authentication required
 *    - Double-vote prevention
 *    - Voting window enforcement
 *    - State validation for House votes
 */
