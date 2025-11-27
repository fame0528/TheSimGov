/**
 * @file app/api/contracts/[id]/route.ts
 * @description Contract details API endpoint
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Retrieves complete contract details including milestones, bids, assigned employees,
 * and quality metrics. Supports both public contract browsing (minimal details) and
 * authenticated company access (full details with sensitive data).
 * 
 * ENDPOINTS:
 * GET /api/contracts/[id]
 * - Path Parameters:
 *   - id: Contract ID (MongoDB ObjectId)
 * 
 * - Query Parameters:
 *   - companyId: Company ID for authenticated access (optional)
 *   - includeBids: Include bid details (boolean, default: false)
 *   - includeEmployees: Include assigned employee details (boolean, default: false)
 * 
 * - Response 200 (Public):
 *   ```json
 *   {
 *     "success": true,
 *     "data": {
 *       "contract": {
 *         "id": "...",
 *         "title": "Highway Bridge Construction",
 *         "type": "Government",
 *         "value": 5000000,
 *         "status": "Bidding",
 *         "deadline": "2026-11-13",
 *         "requiredSkills": {...},
 *         "minimumEmployees": 15,
 *         "biddingDeadline": "2025-12-01"
 *       }
 *     }
 *   }
 *   ```
 * 
 * - Response 200 (Authenticated with companyId):
 *   ```json
 *   {
 *     "success": true,
 *     "data": {
 *       "contract": {...full details...},
 *       "milestones": [...],
 *       "bids": [...],
 *       "assignedEmployees": [...],
 *       "yourBid": {...}
 *     }
 *   }
 *   ```
 * 
 * - Response 404: Contract not found
 * - Response 500: Server error
 * 
 * USAGE:
 * ```typescript
 * // Public contract details
 * const response = await fetch(`/api/contracts/${contractId}`);
 * 
 * // Authenticated access with bids
 * const response = await fetch(`/api/contracts/${contractId}?companyId=${companyId}&includeBids=true`);
 * 
 * // Full details with employees
 * const response = await fetch(`/api/contracts/${contractId}?companyId=${companyId}&includeEmployees=true`);
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Public access: Returns basic contract information only
 * - Authenticated access: Returns full details if company is involved (bid submitted or awarded)
 * - includeBids: Returns all bids with scoring (only if company involved)
 * - includeEmployees: Returns assigned employee details (only if contract awarded to company)
 * - Populates related documents (company, bids, employees)
 * - Compatible with Contract schema and relationship structure
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Contract from '@/lib/db/models/Contract';
import ContractBid from '@/lib/db/models/ContractBid';

/**
 * GET /api/contracts/[id]
 * Get contract details
 * 
 * @param {NextRequest} request - Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Contract ID
 * @returns {Promise<NextResponse>} Contract details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await dbConnect();

    const { id: contractId } = await context.params;

    // EXTRACT QUERY PARAMETERS
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const includeBids = searchParams.get('includeBids') === 'true';
    const includeEmployees = searchParams.get('includeEmployees') === 'true';

    // FETCH CONTRACT
    let contract = await Contract.findById(contractId)
      .populate('awardedTo', 'name industry reputation')
      .populate('winningBid')
      .lean();
    
    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // PUBLIC ACCESS (no companyId provided)
    if (!companyId) {
      // Return minimal public information
      const publicContract = {
        id: contract._id,
        title: contract.title,
        description: contract.description,
        type: contract.type,
        industry: contract.industry,
        client: contract.client,
        location: contract.location,
        value: contract.value,
        status: contract.status,
        duration: contract.duration,
        startDate: contract.startDate,
        deadline: contract.deadline,
        biddingDeadline: contract.biddingDeadline,
        requiredSkills: contract.requiredSkills,
        minimumEmployees: contract.minimumEmployees,
        requiredCertifications: contract.requiredCertifications,
        complexityScore: contract.complexityScore,
        riskLevel: contract.riskLevel,
        minimumBid: contract.minimumBid,
        maximumBid: contract.maximumBid,
        totalBids: contract.totalBids,
        competitorCount: contract.competitorCount,
        marketDemand: contract.marketDemand,
        renewalOption: contract.renewalOption,
      };

      return NextResponse.json({
        success: true,
        data: {
          contract: publicContract,
        },
      });
    }

    // AUTHENTICATED ACCESS (companyId provided)
    // Check if company has submitted bid or owns contract
    const companyBid = await ContractBid.findOne({
      contract: contractId,
      company: companyId,
    }).lean();

    const isContractOwner = contract.awardedTo && contract.awardedTo._id.toString() === companyId;

    // If company not involved, return public data only
    if (!companyBid && !isContractOwner) {
      const publicContract = {
        id: contract._id,
        title: contract.title,
        description: contract.description,
        type: contract.type,
        industry: contract.industry,
        value: contract.value,
        status: contract.status,
        deadline: contract.deadline,
        biddingDeadline: contract.biddingDeadline,
        requiredSkills: contract.requiredSkills,
        minimumEmployees: contract.minimumEmployees,
        complexityScore: contract.complexityScore,
        riskLevel: contract.riskLevel,
        minimumBid: contract.minimumBid,
        maximumBid: contract.maximumBid,
        totalBids: contract.totalBids,
      };

      return NextResponse.json({
        success: true,
        data: {
          contract: publicContract,
          message: 'Limited access - company not involved in this contract',
        },
      });
    }

    // FULL AUTHENTICATED ACCESS
    const responseData: any = {
      contract,
      yourBid: companyBid,
      isOwner: isContractOwner,
    };

    // INCLUDE BIDS (if requested and company involved)
    if (includeBids) {
      const bids = await ContractBid.find({ contract: contractId })
        .populate('company', 'name industry reputation')
        .sort({ score: -1 })
        .lean();
      
      responseData.bids = bids;
      responseData.bidCount = bids.length;
    }

    // INCLUDE ASSIGNED EMPLOYEES (if requested and company owns contract)
    if (includeEmployees && isContractOwner) {
      const contractWithEmployees = await Contract.findById(contractId)
        .populate('assignedEmployees', 'firstName lastName experienceLevel technical sales leadership finance marketing operations')
        .lean();
      
      responseData.assignedEmployees = contractWithEmployees?.assignedEmployees || [];
    }

    // ADD MILESTONE DETAILS (if contract owner)
    if (isContractOwner) {
      responseData.milestones = contract.milestones;
      responseData.completionPercentage = contract.completionPercentage;
      responseData.currentMilestone = contract.currentMilestone;
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });

  } catch (error: any) {
    console.error('Contract details API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch contract details',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Implementation Notes:
 * 
 * ACCESS LEVELS:
 * 
 * 1. PUBLIC (no companyId):
 *    - Basic contract information
 *    - Requirements and specifications
 *    - Bidding deadline and value range
 *    - No sensitive data (bids, milestones, quality scores)
 * 
 * 2. AUTHENTICATED (companyId provided):
 *    - All public data
 *    - Company's own bid details and ranking
 *    - Ownership status (if awarded contract)
 * 
 * 3. CONTRACT OWNER (awarded company):
 *    - All authenticated data
 *    - Full milestone details with progress
 *    - Assigned employee information (if requested)
 *    - Quality metrics and performance data
 * 
 * 4. BIDDER (submitted bid, not owner):
 *    - All authenticated data
 *    - All bids with scores (if requested)
 *    - Competitive positioning
 * 
 * SECURITY:
 * - No sensitive data exposed to public
 * - Company-specific data only to involved companies
 * - Employee details only to contract owner
 * - Bid details only to companies that have bid
 * 
 * FUTURE ENHANCEMENTS:
 * - User authentication/authorization
 * - Role-based access control (admin, employee, viewer)
 * - Contract modification endpoints (PUT/PATCH)
 * - Contract cancellation endpoint (DELETE)
 * - Audit trail for contract changes
 */
