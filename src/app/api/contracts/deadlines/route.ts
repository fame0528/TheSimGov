/**
 * @fileoverview Contract Deadline Check API Route
 * @module app/api/contracts/deadlines/route
 *
 * OVERVIEW:
 * API endpoint for processing contract deadlines. Checks all active/in-progress contracts,
 * marks overdue contracts as failed, applies penalties, and updates company/employee records.
 * Intended to be called by the time engine or a scheduled serverless function.
 *
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import ContractModel from '@/lib/db/models/Contract';
import CompanyModel from '@/lib/db/models/Company';

/**
 * POST /api/contracts/deadlines
 * Processes contract deadlines, auto-fails overdue contracts, applies penalties
 */
export async function POST(req: NextRequest) {
  try {
    // Find all contracts that are active or in progress and past their deadline
    const now = new Date();
    const overdueContracts = await ContractModel.find({
      status: { $in: ['active', 'in_progress'] },
      deadline: { $lt: now },
    });
    let processed = 0;
    let penaltyResults: any[] = [];

    for (const contract of overdueContracts) {
      // Mark as failed
      contract.status = 'failed';
      contract.completedAt = now;
      contract.progressPercent = 100;
      contract.successScore = 0;
      contract.bonusEarned = -Math.round(contract.baseValue * 0.15); // 15% penalty
      contract.actualPayout = 0;
      contract.clientSatisfaction = 0;
      await contract.save();

      // Apply penalty to company (if assigned)
      if (contract.companyId) {
        await CompanyModel.findByIdAndUpdate(contract.companyId, {
          $inc: { cash: -Math.round(contract.baseValue * 0.15) },
        });
      }

      penaltyResults.push({
        contractId: contract._id,
        companyId: contract.companyId,
        penalty: Math.round(contract.baseValue * 0.15),
      });
      processed++;
    }

    return NextResponse.json({
      ok: true,
      processed,
      penaltyResults,
      message: 'Contract deadline processing complete.'
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * IMPLEMENTATION NOTES:
 * - Called by time engine or cron to process contract deadlines
 * - Marks overdue contracts as failed, applies 15% penalty to company
 * - Updates contract and company records in one batch
 * - Can be extended for notifications or analytics
 */
