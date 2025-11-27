/**
 * @file app/api/ai/marketplace/compute/contracts-update/route.ts
 * @description Contract lifecycle management - start, track performance, complete, review, dispute
 * @created 2025-11-22
 * 
 * OVERVIEW:
 * Manages complete contract lifecycle from activation through completion or dispute.
 * Supports performance tracking (downtime, latency), payment release, buyer reviews,
 * and dispute resolution. Both buyers and sellers can interact based on role.
 * 
 * BUSINESS LOGIC:
 * - Start: Pending → Active (seller activates, sets startedAt timestamp)
 * - RecordDowntime: Seller tracks SLA violations (triggers refund calculations)
 * - RecordLatencyBreach: Seller logs latency violations (impacts refunds)
 * - Complete: Active → Completed (releases payment to seller, refunds buyer if SLA breach)
 * - Review: Buyer rates seller (1-5 stars, updates listing averageRating)
 * - Dispute: Either party initiates (freezes payment until resolution)
 * 
 * ACTIONS:
 * - start: Change status to Active
 * - recordDowntime: Track downtime incident (seller only)
 * - recordLatencyBreach: Track latency violation (seller only)
 * - complete: Finalize contract with payment release
 * - review: Buyer leaves rating and comment
 * - dispute: Initiate dispute resolution
 * 
 * @implementation FID-20251122-001 Phase 3-4 Batch 5 (Compute Marketplace)
 * @legacy-source old projects/politics/app/api/ai/marketplace/contracts/route.ts (PATCH)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import ComputeListing from '@/lib/db/models/ComputeListing';
import ComputeContract from '@/lib/db/models/ComputeContract';

/**
 * PATCH /api/ai/marketplace/compute/contracts-update
 * 
 * Update contract lifecycle: start, record performance, complete, review, dispute.
 * 
 * REQUEST BODY:
 * {
 *   contractId: string;           // Contract to update
 *   action: string;               // Action: start, recordDowntime, recordLatencyBreach, complete, review, dispute
 *   downtimeMinutes?: number;     // For recordDowntime action
 *   latencyMs?: number;          // For recordLatencyBreach action
 *   rating?: number;             // For review action (1-5)
 *   comment?: string;            // For review action
 *   disputeReason?: string;      // For dispute action
 * }
 * 
 * RESPONSE:
 * {
 *   success: true,
 *   message: string,
 *   contract: ComputeContract
 * }
 * 
 * @example Start Contract
 * PATCH /api/ai/marketplace/compute/contracts-update
 * Body: { contractId: "...", action: "start" }
 * 
 * @example Record Downtime
 * PATCH /api/ai/marketplace/compute/contracts-update
 * Body: { contractId: "...", action: "recordDowntime", downtimeMinutes: 30 }
 * 
 * @example Complete Contract
 * PATCH /api/ai/marketplace/compute/contracts-update
 * Body: { contractId: "...", action: "complete" }
 * 
 * @example Leave Review
 * PATCH /api/ai/marketplace/compute/contracts-update
 * Body: { contractId: "...", action: "review", rating: 5, comment: "Excellent service!" }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { userId } = session!;

    // Parse request body
    const body = await request.json();
    const { contractId, action, downtimeMinutes, latencyMs, rating, comment, disputeReason } = body;

    // Validate required fields
    if (!contractId || !action) {
      return NextResponse.json({ error: 'contractId and action are required' }, { status: 422 });
    }

    // Connect to database
    await connectDB();

    // Load contract with buyer and seller
    const contract = await ComputeContract.findById(contractId)
      .populate('buyer')
      .populate('seller')
      .populate('listing');

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Get user's company
    const userCompany = await Company.findOne({ owner: userId });
    if (!userCompany) {
      return NextResponse.json({ error: 'User company not found' }, { status: 404 });
    }

    // Determine if user is buyer or seller
    const isBuyer = contract.buyer.toString() === userCompany._id.toString();
    const isSeller = contract.seller.toString() === userCompany._id.toString();

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: 'Not authorized to update this contract' }, { status: 403 });
    }

    // Execute action
    switch (action) {
      case 'start':
        // Seller starts contract
        if (!isSeller) {
          return NextResponse.json({ error: 'Only seller can start contract' }, { status: 403 });
        }
        if (contract.status !== 'Pending') {
          return NextResponse.json({ error: 'Contract must be in Pending status to start' }, { status: 422 });
        }
        contract.status = 'Active';
        contract.startDate = new Date();
        break;

      case 'recordDowntime':
        // Seller records downtime incident
        if (!isSeller) {
          return NextResponse.json({ error: 'Only seller can record downtime' }, { status: 403 });
        }
        if (!downtimeMinutes || downtimeMinutes <= 0) {
          return NextResponse.json({ error: 'downtimeMinutes must be positive number' }, { status: 422 });
        }
        contract.recordDowntime(downtimeMinutes, 'API reported downtime');
        break;

      case 'recordLatencyBreach':
        // Seller records latency breach - not implemented in current contract model
        return NextResponse.json({ error: 'Latency breach recording not implemented' }, { status: 501 });

      case 'complete':
        // Either party can complete contract
        if (contract.status !== 'Active') {
          return NextResponse.json({ error: 'Contract must be Active to complete' }, { status: 422 });
        }

        // Complete contract (calculates refunds based on SLA violations)
        contract.completeContract();

        // Release payment to seller
        const seller = await Company.findById(contract.seller);
        if (seller) {
          seller.cash += contract.paymentReleased;
          await seller.save();
        }

        // Refund buyer if SLA violations
        const refundAmount = (contract as any).refundIssued || 0;
        if (refundAmount > 0) {
          const buyer = await Company.findById(contract.buyer);
          if (buyer) {
            buyer.cash += refundAmount;
            await buyer.save();
          }
        }
        break;

      case 'review':
        // Buyer leaves review
        if (!isBuyer) {
          return NextResponse.json({ error: 'Only buyer can leave review' }, { status: 403 });
        }
        if (contract.status !== 'Completed') {
          return NextResponse.json({ error: 'Contract must be Completed to review' }, { status: 422 });
        }
        if (!rating || rating < 1 || rating > 5) {
          return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 422 });
        }

        (contract as any).buyerReview = {
          rating,
          comment: comment || '',
          reviewedAt: new Date()
        };

        // Update listing average rating
        const listing = await ComputeListing.findById(contract.listing);
        if (listing) {
          const currentTotal = listing.averageRating * (listing.totalContracts - 1);
          listing.averageRating = (currentTotal + rating) / listing.totalContracts;
          await listing.save();
        }
        break;

      case 'dispute':
        // Either party can initiate dispute
        if (!disputeReason) {
          return NextResponse.json({ error: 'disputeReason is required for dispute' }, { status: 422 });
        }
        contract.initiateDispute(userCompany._id, disputeReason);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 422 });
    }

    // Save contract
    await contract.save();

    return NextResponse.json({ success: true, message: `Action '${action}' completed successfully`, contract }, { status: 200 });
  } catch (error) {
    return handleAPIError('[PATCH /api/ai/marketplace/compute/contracts-update]', error, 'Failed to update contract');
  }
}
