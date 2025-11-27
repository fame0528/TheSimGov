/**
 * @file app/api/contracts/[id]/bid/route.ts
 * @description Contract bid submission API endpoint
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Allows companies to submit competitive bids on available contracts. Validates
 * bid terms against contract requirements, calculates bid scoring, and generates
 * NPC competitor bids automatically. Prevents duplicate bids and enforces bidding
 * deadline constraints. Integrates with NPC bidding AI to create realistic competition.
 * 
 * ENDPOINTS:
 * POST /api/contracts/[id]/bid
 * - Path Parameters:
 *   - id: Contract ID (MongoDB ObjectId)
 * 
 * - Request Body:
 *   ```json
 *   {
 *     "companyId": "507f1f77bcf86cd799439011",
 *     "amount": 4500000,
 *     "proposedTimeline": 340,
 *     "qualityCommitment": 90,
 *     "resourceAllocation": {
 *       "employeeCount": 12,
 *       "skillBreakdown": { "technical": 80, "leadership": 70 },
 *       "certificationsCovered": ["PMP", "CISSP"]
 *     },
 *     "technicalApproach": "Agile methodology...",
 *     "priceStrategy": "Competitive",
 *     "marginTarget": 25
 *   }
 *   ```
 * 
 * - Response 201:
 *   ```json
 *   {
 *     "success": true,
 *     "data": {
 *       "bid": {...},
 *       "rank": 2,
 *       "totalBids": 7,
 *       "winProbability": 68.5
 *     }
 *   }
 *   ```
 * 
 * - Response 400: Invalid bid data or duplicate bid
 * - Response 404: Contract not found
 * - Response 409: Bidding closed or contract not available
 * - Response 500: Server error
 * 
 * USAGE:
 * ```typescript
 * // Submit bid
 * const response = await fetch(`/api/contracts/${contractId}/bid`, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     companyId: userCompanyId,
 *     amount: 3750000,
 *     proposedTimeline: 320,
 *     qualityCommitment: 92,
 *     resourceAllocation: {
 *       employeeCount: 15,
 *       skillBreakdown: { technical: 85, leadership: 75, compliance: 80 }
 *     }
 *   })
 * });
 * 
 * const { data } = await response.json();
 * console.log(`Your bid ranked ${data.rank} of ${data.totalBids} bids`);
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Validates contract exists and is available for bidding
 * - Checks bidding deadline has not passed
 * - Enforces one bid per company per contract (unique constraint)
 * - Validates bid amount within minimumBid and maximumBid range
 * - Calculates bid score using weighted formula (price, reputation, quality, timeline, technical)
 * - Generates 3-7 NPC competitor bids automatically if first bid
 * - Updates contract totalBids count
 * - Returns bid ranking and win probability
 * - Compatible with ContractBid schema validation
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Contract from '@/lib/db/models/Contract';
import ContractBid from '@/lib/db/models/ContractBid';
import Company from '@/lib/db/models/Company';
import { generateNPCBids } from '@/lib/utils/npcBidding';

/**
 * POST /api/contracts/[id]/bid
 * Submit bid on contract
 * 
 * @param {NextRequest} request - Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Contract ID
 * @returns {Promise<NextResponse>} Created bid with ranking
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await dbConnect();

    const { id: contractId } = await context.params;

    // VALIDATE CONTRACT EXISTS
    const contract = await Contract.findById(contractId);
    
    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // CHECK CONTRACT IS AVAILABLE FOR BIDDING
    if (contract.status !== 'Available' && contract.status !== 'Bidding') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Contract is not available for bidding (current status: ${contract.status})` 
        },
        { status: 409 }
      );
    }

    // CHECK BIDDING DEADLINE
    if (new Date() > contract.biddingDeadline) {
      return NextResponse.json(
        { success: false, error: 'Bidding deadline has passed' },
        { status: 409 }
      );
    }

    // PARSE REQUEST BODY
    const body = await request.json();
    const {
      companyId,
      amount,
      proposedTimeline,
      qualityCommitment,
      resourceAllocation,
      technicalApproach,
      milestoneStrategy,
      riskMitigation,
      priceStrategy,
      marginTarget,
      innovationFactors,
    } = body;

    // VALIDATE REQUIRED FIELDS
    if (!companyId || !amount || !proposedTimeline || !qualityCommitment || !resourceAllocation) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: companyId, amount, proposedTimeline, qualityCommitment, resourceAllocation' 
        },
        { status: 400 }
      );
    }

    // VALIDATE COMPANY EXISTS
    const company = await Company.findById(companyId);
    
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // VALIDATE BID AMOUNT RANGE
    if (amount < contract.minimumBid || amount > contract.maximumBid) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Bid amount must be between $${contract.minimumBid.toLocaleString()} and $${contract.maximumBid.toLocaleString()}` 
        },
        { status: 400 }
      );
    }

    // VALIDATE PROPOSED TIMELINE
    if (proposedTimeline > contract.duration) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Proposed timeline (${proposedTimeline} days) exceeds contract duration (${contract.duration} days)` 
        },
        { status: 400 }
      );
    }

    // VALIDATE QUALITY COMMITMENT
    if (qualityCommitment < 1 || qualityCommitment > 100) {
      return NextResponse.json(
        { success: false, error: 'Quality commitment must be between 1 and 100' },
        { status: 400 }
      );
    }

    // VALIDATE RESOURCE ALLOCATION
    if (!resourceAllocation.employeeCount || resourceAllocation.employeeCount < contract.minimumEmployees) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Resource allocation must include at least ${contract.minimumEmployees} employees` 
        },
        { status: 400 }
      );
    }

    // CALCULATE ESTIMATED COST AND MARGIN
    const estimatedCost = amount / (1 + ((marginTarget || 20) / 100));
    const estimatedProfit = amount - estimatedCost;
    const estimatedMargin = (estimatedProfit / amount) * 100;

    // CALCULATE DISCOUNT PERCENTAGE
    const discountPercentage = ((contract.maximumBid - amount) / contract.maximumBid) * 100;

    // CREATE BID
    let bid;
    try {
      bid = await ContractBid.create({
        contract: contractId,
        company: companyId,
        isNPC: false,
        amount,
        proposedTimeline,
        qualityCommitment,
        resourceAllocation,
        technicalApproach: technicalApproach || null,
        milestoneStrategy: milestoneStrategy || null,
        riskMitigation: riskMitigation || null,
        priceStrategy: priceStrategy || 'Competitive',
        marginTarget: marginTarget || 20,
        discountPercentage,
        innovationFactors: innovationFactors || [],
        estimatedCost,
        estimatedProfit,
        estimatedMargin,
        confidenceLevel: 70, // Default
        winProbability: 50, // Calculated below
        marketPosition: 'Follower', // Default, could be based on company size/reputation
        strategicValue: 50, // Default
        reputationScore: company.reputation,
      });
    } catch (error: any) {
      // Handle duplicate bid error (unique constraint on contract + company)
      if (error.code === 11000) {
        return NextResponse.json(
          { success: false, error: 'You have already submitted a bid on this contract' },
          { status: 409 }
        );
      }
      throw error; // Re-throw other errors
    }

    // CALCULATE BID SCORE
    await bid.calculateScore(contract, company);

    // GENERATE NPC COMPETITOR BIDS (if first bid on contract)
    if (contract.totalBids === 0) {
      const npcCount = 3 + Math.floor(Math.random() * 5); // 3-7 NPC bids
      try {
        await generateNPCBids(contractId, npcCount);
      } catch (error) {
        console.error('Failed to generate NPC bids:', error);
        // Continue anyway - player bid is valid
      }
    }

    // UPDATE CONTRACT TOTAL BIDS
    await contract.updateOne({ 
      $inc: { totalBids: 1 },
      status: 'Bidding' // Move to Bidding status if not already
    });

    // RANK ALL BIDS
    const rankedBids = await ContractBid.rankBids(contract._id as any);
    const bidRank = rankedBids.findIndex(b => (b._id as any).toString() === (bid._id as any).toString()) + 1;

    // CALCULATE WIN PROBABILITY
    // Based on rank and score relative to competition
    const topScore = rankedBids[0]?.score || 100;
    const scoreRatio = bid.score / topScore;
    const winProbability = scoreRatio * (100 - ((bidRank - 1) * 10)); // Decrease by 10% per rank
    bid.winProbability = Math.max(5, Math.min(95, winProbability)); // Clamp between 5-95%
    await bid.save();

    return NextResponse.json(
      {
        success: true,
        data: {
          bid: {
            id: bid._id,
            amount: bid.amount,
            proposedTimeline: bid.proposedTimeline,
            qualityCommitment: bid.qualityCommitment,
            score: bid.score,
            priceScore: bid.priceScore,
            reputationScore: bid.reputationScore,
            qualityScore: bid.qualityScore,
            timelineScore: bid.timelineScore,
            technicalScore: bid.technicalScore,
            status: bid.status,
            submittedAt: bid.submittedAt,
          },
          rank: bidRank,
          totalBids: rankedBids.length,
          winProbability: Math.round(bid.winProbability * 10) / 10, // Round to 1 decimal
          contract: {
            title: contract.title,
            value: contract.value,
            deadline: contract.deadline,
            biddingDeadline: contract.biddingDeadline,
          },
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Bid submission API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to submit bid',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Implementation Notes:
 * 
 * BID SCORING:
 * - Formula: (Price × 0.35) + (Reputation × 0.25) + (Quality × 0.20) + (Timeline × 0.10) + (Technical × 0.10)
 * - Lower prices score higher (inverse relationship)
 * - Company reputation directly affects score
 * - Quality commitment vs contract complexity
 * - Faster timelines score higher
 * - Technical proposal completeness (approach, milestones, risk mitigation)
 * 
 * NPC COMPETITION:
 * - Automatically generates 3-7 NPC bids on first player bid
 * - NPCs use personality-based strategies (Aggressive, Conservative, Strategic, Balanced)
 * - Prevents unrealistic monopoly scenarios
 * - Adds strategic depth to bidding decisions
 * 
 * WIN PROBABILITY:
 * - Based on bid score relative to top competitor
 * - Decreases 10% per rank position (1st = ~90%, 2nd = ~80%, etc.)
 * - Clamped between 5-95% (never 0% or 100%)
 * - Updates dynamically as new bids submitted
 * 
 * SECURITY:
 * - Validates company ownership (TODO: Add user authentication check)
 * - Prevents duplicate bids (unique constraint)
 * - Enforces bidding deadline
 * - Validates all input ranges
 * 
 * FUTURE ENHANCEMENTS:
 * - User authentication/authorization checks
 * - Bid modification/withdrawal functionality
 * - Counter-offer handling
 * - Automatic bid ranking updates (websocket)
 * - Bid history tracking
 */
