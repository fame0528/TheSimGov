/**
 * @file app/api/contracts/[id]/progress/route.ts
 * @description Contract progress update API endpoint
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Updates contract execution progress including milestone completion, quality metrics,
 * and auto-progression calculations. Integrates with 168x time acceleration system
 * to calculate realistic progress based on employee skills, team metrics, and elapsed time.
 * Automatically completes milestones and contracts when progress reaches 100%.
 * 
 * ENDPOINTS:
 * PUT /api/contracts/[id]/progress
 * - Path Parameters:
 *   - id: Contract ID (MongoDB ObjectId)
 * 
 * - Request Body (Manual Update):
 *   ```json
 *   {
 *     "milestoneIndex": 0,
 *     "progress": 75,
 *     "qualityScore": 85
 *   }
 *   ```
 * 
 * - Request Body (Auto-Progression):
 *   ```json
 *   {
 *     "auto": true
 *   }
 *   ```
 * 
 * - Response 200:
 *   ```json
 *   {
 *     "success": true,
 *     "data": {
 *       "contract": {...},
 *       "progression": {
 *         "dailyProgress": 2.5,
 *         "weeklyProgress": 17.5,
 *         "estimatedCompletion": "2026-08-15",
 *         "qualityScore": 87,
 *         "riskLevel": "Low"
 *       }
 *     }
 *   }
 *   ```
 * 
 * - Response 400: Invalid progress data
 * - Response 404: Contract not found
 * - Response 409: Contract not in progress
 * - Response 500: Server error
 * 
 * USAGE:
 * ```typescript
 * // Manual milestone update
 * const response = await fetch(`/api/contracts/${contractId}/progress`, {
 *   method: 'PUT',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     milestoneIndex: 0,
 *     progress: 80,
 *     qualityScore: 90
 *   })
 * });
 * 
 * // Auto-progression update (called by cron/background job)
 * const response = await fetch(`/api/contracts/${contractId}/progress`, {
 *   method: 'PUT',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ auto: true })
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Manual updates: Set specific milestone progress and quality
 * - Auto-progression: Calculate progress based on employee skills and time elapsed
 * - Uses updateContractProgress() from contractProgression.ts
 * - Integrates 168x time acceleration (1 real hour = 1 game week)
 * - Automatically completes milestones at 100% progress
 * - Automatically completes contract when all milestones done
 * - Updates company reputation on contract completion
 * - Calculates quality score based on skill match, timeline, and resources
 * - Compatible with Contract schema and milestone structure
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Contract from '@/lib/db/models/Contract';
import Company from '@/lib/db/models/Company';
import { updateContractProgress, getContractProgressSummary } from '@/lib/utils/contractProgression';
import { applyQualityAndReputation } from '@/lib/utils/contractQuality';
import { awardExperience, calculateContractXP } from '@/lib/utils/levelProgression';

/**
 * PUT /api/contracts/[id]/progress
 * Update contract progress (manual or auto)
 * 
 * @param {NextRequest} request - Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Contract ID
 * @returns {Promise<NextResponse>} Updated contract with progression data
 */
export async function PUT(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await dbConnect();

    const { id: contractId } = await context.params;

    // VALIDATE CONTRACT EXISTS
    const contract = await Contract.findById(contractId)
      .populate('assignedEmployees')
      .populate('awardedTo');
    
    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // CHECK CONTRACT IS IN PROGRESS
    if (contract.status !== 'InProgress' && contract.status !== 'Awarded') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Contract progress cannot be updated (current status: ${contract.status})` 
        },
        { status: 409 }
      );
    }

    // PARSE REQUEST BODY
    const body = await _request.json();
    const { auto, milestoneIndex, progress, qualityScore } = body;

    // AUTO-PROGRESSION MODE
    if (auto === true) {
      // Calculate progress based on employee skills and time elapsed
      const progressionResult = await updateContractProgress(contractId);

      // Check if contract completed (cast to any to allow comparison)
      if ((contract.status as any) === 'Completed') {
        // Apply quality scoring and reputation impact
        await applyQualityAndReputation(contractId);

        // 🎯 AWARD XP FOR CONTRACT COMPLETION
        const company = await Company.findById(contract.awardedTo);
        if (company) {
          const avgQuality = contract.milestones.reduce((sum, m) => sum + (m.qualityScore || 85), 0) / contract.milestones.length;
          const isLate = contract.completionStatus === 'Late';
          const timelinePenalty = isLate ? 0.7 : 1.0;
          const xpReward = calculateContractXP(contract.value, avgQuality / 100, timelinePenalty);
          await awardExperience(company, xpReward, 'contract_completion', `Completed ${contract.title}`);
          console.log(`[XP] Auto-progression completed "${contract.title}": +${xpReward} XP`);
        }

        return NextResponse.json({
          success: true,
          data: {
            contract,
            progression: progressionResult,
            completed: true,
            message: 'Contract completed successfully!',
          },
        });
      }

      // Return progression summary
      const summary = await getContractProgressSummary(contractId);

      return NextResponse.json({
        success: true,
        data: {
          contract,
          progression: summary.progression,
          skillMatch: summary.skillMatch,
          teamMetrics: summary.teamMetrics,
        },
      });
    }

    // MANUAL MILESTONE UPDATE MODE
    if (milestoneIndex !== undefined && progress !== undefined) {
      // Validate milestone index
      if (milestoneIndex < 0 || milestoneIndex >= contract.milestones.length) {
        return NextResponse.json(
          { success: false, error: 'Invalid milestone index' },
          { status: 400 }
        );
      }

      // Validate progress percentage
      if (progress < 0 || progress > 100) {
        return NextResponse.json(
          { success: false, error: 'Progress must be between 0 and 100' },
          { status: 400 }
        );
      }

      // Update milestone progress
      await contract.updateMilestoneProgress(milestoneIndex, progress);

      // Update quality score if provided
      if (qualityScore !== undefined) {
        if (qualityScore < 1 || qualityScore > 100) {
          return NextResponse.json(
            { success: false, error: 'Quality score must be between 1 and 100' },
            { status: 400 }
          );
        }

        contract.milestones[milestoneIndex].qualityScore = qualityScore;
        await contract.save();
      }

      // Check if all milestones completed → complete contract
      const allMilestonesComplete = contract.milestones.every(m => m.completed);
      
      if (allMilestonesComplete && (contract.status as any) !== 'Completed') {
        await contract.completeContract();

        // Apply quality scoring and reputation impact
        await applyQualityAndReputation(contractId);

        // 🎯 AWARD XP FOR CONTRACT COMPLETION
        // Calculate XP based on contract value, quality score, and timeline adherence
        const company = await Company.findById(contract.awardedTo);
        if (company) {
          // Calculate average quality score across all milestones
          const avgQuality = contract.milestones.reduce((sum, m) => sum + (m.qualityScore || 85), 0) / contract.milestones.length;
          
          // Calculate timeline penalty (1.0 = on time, 0.5 = very late)
          const isLate = contract.completionStatus === 'Late';
          const timelinePenalty = isLate ? 0.7 : 1.0;
          
          // Calculate XP reward
          const xpReward = calculateContractXP(contract.value, avgQuality / 100, timelinePenalty);
          
          // Award XP to company
          await awardExperience(company, xpReward, 'contract_completion', `Completed ${contract.title}`);
          
          console.log(`[XP] Contract "${contract.title}" completed: +${xpReward} XP (quality: ${avgQuality.toFixed(1)}%, timeline: ${timelinePenalty}x)`);
        }

        return NextResponse.json({
          success: true,
          data: {
            contract,
            completed: true,
            message: 'All milestones completed! Contract marked as complete.',
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          contract,
          milestone: contract.milestones[milestoneIndex],
          overallProgress: contract.completionPercentage,
        },
      });
    }

    // INVALID REQUEST
    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid request. Provide either { auto: true } or { milestoneIndex, progress }' 
      },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Contract progress API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update contract progress',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/contracts/[id]/progress
 * Get contract progress summary
 * 
 * @param {NextRequest} request - Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Contract ID
 * @returns {Promise<NextResponse>} Progress summary with metrics
 */
export async function GET(
  _request: NextRequest, // Prefixed with _ since not used
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

    // CHECK CONTRACT IS IN PROGRESS OR COMPLETED
    if (contract.status !== 'InProgress' && contract.status !== 'Completed') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Contract progress not available (current status: ${contract.status})` 
        },
        { status: 409 }
      );
    }

    // GET PROGRESS SUMMARY
    const summary = await getContractProgressSummary(contractId);

    return NextResponse.json({
      success: true,
      data: summary,
    });

  } catch (error: any) {
    console.error('Contract progress GET API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch contract progress',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Implementation Notes:
 * 
 * AUTO-PROGRESSION SYSTEM:
 * - Uses 168x time acceleration (1 real hour = 1 game week)
 * - Calculates progress: BASE_DAILY_PROGRESS × skillMatch × productivity × workload × synergy
 * - Skill matching: Compares employee skills to contract requirements (0.5-1.5 ratio)
 * - Team metrics: Average skill, productivity, morale, synergy bonuses
 * - Quality scoring: (Skill 50% + Timeline 30% + Resource 20%)
 * - Risk assessment: Critical/High/Medium/Low based on skill match and team size
 * 
 * MILESTONE COMPLETION:
 * - Automatically marks milestone complete at 100% progress
 * - Records completion date and quality score
 * - Advances to next milestone automatically
 * - Updates overall contract completion percentage
 * 
 * CONTRACT COMPLETION:
 * - Triggers when all milestones complete or overall progress 100%
 * - Calculates final payment with penalties/bonuses
 * - Applies quality scoring and reputation impact
 * - Updates company reputation based on performance
 * - Records completion date and status (OnTime/Late)
 * 
 * CRON INTEGRATION:
 * - Auto-progression endpoint designed for scheduled execution
 * - Call endpoint every 1-6 hours for realistic progression
 * - 168x time means 1 hour = 7 days of contract progress
 * - Prevents need for real-time manual updates
 * 
 * FUTURE ENHANCEMENTS:
 * - Real-time websocket updates
 * - Milestone notifications/alerts
 * - Progress charts and analytics
 * - Predictive completion estimates
 * - Risk alerts for at-risk contracts
 */
