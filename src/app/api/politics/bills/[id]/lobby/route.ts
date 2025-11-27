/**
 * @file src/app/api/politics/bills/[id]/lobby/route.ts
 * @description API endpoint for viewing lobby positions and payment calculations
 * @created 2025-11-26
 * @author ECHO v1.3.0
 *
 * OVERVIEW:
 * GET endpoint for retrieving lobby positions on bills with payment previews.
 * Shows which lobbies support/oppose bill and payment amounts for each position.
 *
 * ROUTE:
 * - GET /api/politics/bills/[id]/lobby
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Bill from '@/lib/db/models/Bill';
import { groupPositionsByStance, calculateLobbyPayment } from '@/lib/utils/politics/lobbySystem';
import { z } from 'zod';

// ===================== VALIDATION SCHEMAS =====================

const LobbyPreviewQuerySchema = z.object({
  chamber: z.enum(['senate', 'house']).optional(),
  state: z.string().optional(),
  seatCount: z.coerce.number().int().min(1).max(52).optional(),
});

// ===================== GET /api/politics/bills/[id]/lobby =====================

/**
 * GET /api/politics/bills/[id]/lobby
 * View lobby positions and payment calculations
 * 
 * QUERY PARAMETERS (optional):
 * - chamber: 'senate' | 'house' (for payment preview)
 * - state: State code (for House delegation lookup)
 * - seatCount: Explicit seat count override
 * 
 * RETURNS:
 * - All lobby positions on bill
 * - Payment amounts for each position
 * - Grouped by stance (FOR/AGAINST/NEUTRAL)
 * - Optional: Payment preview for player's position
 * 
 * PAYMENT STRUCTURE:
 * - Senate: $120,000 per seat (1 seat)
 * - House: $23,000 per seat (1-52 seats based on state)
 * - Multiple lobbies can pay on same bill
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
    const validated = LobbyPreviewQuerySchema.parse(queryParams);
    
    await connectDB();
    
    // Find bill
    const bill = await Bill.findById(id);
    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }
    
    // Group positions by stance
    const grouped = groupPositionsByStance(bill.lobbyPositions);
    
    // Calculate payment preview if chamber/state provided
    let paymentPreview: {
      forAye?: { totalPayment: number; payments: Array<{ lobbyType: string; amount: number }> };
      forNay?: { totalPayment: number; payments: Array<{ lobbyType: string; amount: number }> };
    } | undefined;
    
    if (validated.chamber) {
      // Determine seat count
      let seatCount = validated.seatCount;
      if (!seatCount) {
        if (validated.chamber === 'senate') {
          seatCount = 1;
        } else if (validated.state) {
          // Import seat count utility
          const { getSeatCount } = await import('@/lib/utils/politics/billVoting');
          try {
            seatCount = getSeatCount('house', validated.state);
          } catch (error) {
            return NextResponse.json(
              { error: 'Invalid state for House delegation' },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            { error: 'State required for House payment preview' },
            { status: 400 }
          );
        }
      }
      
      // Calculate payments for Aye vote
      const ayePayment = calculateLobbyPayment(
        validated.chamber,
        seatCount,
        'Aye',
        bill.lobbyPositions
      );
      
      // Calculate payments for Nay vote
      const nayPayment = calculateLobbyPayment(
        validated.chamber,
        seatCount,
        'Nay',
        bill.lobbyPositions
      );
      
      paymentPreview = {
        forAye: {
          totalPayment: ayePayment.totalPayment,
          payments: ayePayment.payments.map(p => ({
            lobbyType: p.lobbyType,
            amount: p.totalPayment,
          })),
        },
        forNay: {
          totalPayment: nayPayment.totalPayment,
          payments: nayPayment.payments.map(p => ({
            lobbyType: p.lobbyType,
            amount: p.totalPayment,
          })),
        },
      };
    }
    
    // Calculate total potential payment per position
    const maxPaymentFor = grouped.for.reduce(
      (sum, pos) => sum + pos.paymentPerSeat * (validated.seatCount || 1),
      0
    );
    const maxPaymentAgainst = grouped.against.reduce(
      (sum, pos) => sum + pos.paymentPerSeat * (validated.seatCount || 1),
      0
    );
    
    return NextResponse.json({
      success: true,
      data: {
        bill: {
          id: bill._id,
          title: bill.title,
          policyArea: bill.policyArea,
          chamber: bill.chamber,
        },
        lobbyPositions: {
          for: grouped.for,
          against: grouped.against,
          neutral: grouped.neutral,
        },
        summary: {
          totalFor: grouped.for.length,
          totalAgainst: grouped.against.length,
          totalNeutral: grouped.neutral.length,
          maxPaymentFor: `$${maxPaymentFor.toLocaleString()}`,
          maxPaymentAgainst: `$${maxPaymentAgainst.toLocaleString()}`,
        },
        paymentPreview,
      },
    });
    
  } catch (error) {
    console.error('Get lobby positions error:', error);
    
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
 * 1. **Lobby Position Groups**:
 *    - FOR: Lobbies supporting bill passage
 *    - AGAINST: Lobbies opposing bill
 *    - NEUTRAL: Lobbies monitoring without payment
 * 
 * 2. **Payment Preview**:
 *    - Optional feature requiring chamber/state params
 *    - Shows exact payment for Aye vs Nay vote
 *    - Helps players make informed voting decisions
 *    - Calculates based on delegation size
 * 
 * 3. **Multiple Lobby Payments**:
 *    - Player can receive from ALL lobbies matching vote
 *    - Example: Energy bill with 3 FOR lobbies
 *    - Aye vote = 3 payments (renewable + environmental + labor)
 *    - Nay vote = 1 payment (oil/gas)
 * 
 * 4. **Payment Calculation**:
 *    - Senate: $120k × 1 seat = $120k per lobby
 *    - House (CA): $23k × 52 seats = $1,196k per lobby
 *    - House (WY): $23k × 1 seat = $23k per lobby
 * 
 * 5. **Public Endpoint**:
 *    - No authentication required (transparency)
 *    - All lobby positions visible to public
 *    - Encourages informed voting
 *    - Prevents secret lobby influence
 */
