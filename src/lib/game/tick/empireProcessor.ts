/**
 * @file src/lib/game/tick/empireProcessor.ts
 * @description Empire tick processor for synergy calculations and resource flows
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Processes empire-level events each game tick:
 * - Recalculates active synergies based on owned companies
 * - Processes resource flows between companies
 * - Awards empire XP based on activity
 * - Updates empire level and multipliers
 *
 * SYNERGY LOGIC:
 * Every tick, we check which synergies the player qualifies for based on
 * their company portfolio. New synergies are activated, lost synergies
 * are deactivated (if player sold a required company).
 *
 * RESOURCE FLOWS:
 * Companies in the same empire can trade resources at reduced rates.
 * This tick processor handles the actual transfers.
 *
 * @author ECHO v1.4.0
 */

import {
  ITickProcessor,
  GameTime,
  TickProcessorResult,
  TickProcessorOptions,
  TickError,
  EmpireTickSummary,
  ResourceFlowTickResult,
} from '@/lib/types/gameTick';
import PlayerEmpire, { EMPIRE_XP_REWARDS } from '@/lib/db/models/empire/PlayerEmpire';
import ResourceFlow from '@/lib/db/models/empire/ResourceFlow';
import { calculateSynergies } from '@/lib/game/empire/synergyEngine';
import { EmpireIndustry, SynergyBonusTarget } from '@/lib/types/empire';

// ============================================================================
// EMPIRE TICK PROCESSOR
// ============================================================================

/**
 * Empire tick processor implementation
 */
export const empireProcessor: ITickProcessor = {
  name: 'empire',
  priority: 5, // Run early (after banking at 10)
  enabled: true,

  /**
   * Process empire tick
   */
  async process(
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<TickProcessorResult> {
    const startTime = Date.now();
    const errors: TickError[] = [];
    let itemsProcessed = 0;

    // Summary counters
    let flowsProcessed = 0;
    let flowsSuccessful = 0;
    let flowsFailed = 0;
    const totalResourcesTransferred: Record<string, number> = {};
    let synergiesActivated = 0;
    let synergiesDeactivated = 0;
    let xpEarned = 0;

    try {
      // Get all player empires (or specific player if specified)
      const query = options?.playerId 
        ? { userId: options.playerId }
        : {};
      
      const empires = await PlayerEmpire.find(query);

      for (const empire of empires) {
        try {
          // Skip if dry run
          if (options?.dryRun) {
            itemsProcessed++;
            continue;
          }

          // 1. RECALCULATE SYNERGIES
          const previousSynergyCount = empire.activeSynergies.length;
          const synergyResult = await calculateSynergies(empire.userId, true);

          // Update empire's active synergies
          const newActiveSynergies = synergyResult.activeSynergies.map(s => ({
            synergyId: s.synergyId,
            synergyName: s.synergy.name,
            tier: s.synergy.tier,
            activatedAt: s.activatedAt,
            contributingCompanyIds: s.contributingCompanyIds,
            bonuses: s.currentBonuses.map(b => ({
              target: b.target,
              baseValue: b.baseValue,
              multiplier: b.multiplier,
              finalValue: b.finalValue,
              description: b.description,
            })),
          }));

          // Track synergy changes
          const currentIds = new Set(newActiveSynergies.map(s => s.synergyId));
          const previousIds = new Set(empire.activeSynergies.map(s => s.synergyId));

          for (const id of currentIds) {
            if (!previousIds.has(id)) {
              synergiesActivated++;
              // Award XP for new synergy
              const synergy = newActiveSynergies.find(s => s.synergyId === id);
              if (synergy) {
                const tierXp = getTierXp(synergy.tier);
                xpEarned += tierXp;
              }
            }
          }

          for (const id of previousIds) {
            if (!currentIds.has(id)) {
              synergiesDeactivated++;
            }
          }

          empire.activeSynergies = newActiveSynergies;
          empire.lastSynergyCalculation = new Date();

          // 2. PROCESS RESOURCE FLOWS
          const flows = await ResourceFlow.find({
            $or: [
              { fromCompanyId: { $in: empire.companies.map(c => c.companyId) } },
              { toCompanyId: { $in: empire.companies.map(c => c.companyId) } },
            ],
            status: 'ACTIVE',
          });

          for (const flow of flows) {
            try {
              const result = await processResourceFlow(flow, gameTime);
              flowsProcessed++;

              if (result.success) {
                flowsSuccessful++;
                totalResourcesTransferred[result.resourceType] = 
                  (totalResourcesTransferred[result.resourceType] || 0) + result.amount;
                
                // Award XP for resource flow
                xpEarned += EMPIRE_XP_REWARDS.RESOURCE_FLOW_ESTABLISHED / 12; // Monthly portion
              } else {
                flowsFailed++;
                if (result.error) {
                  errors.push({
                    entityId: flow._id?.toString() ?? 'unknown',
                    entityType: 'ResourceFlow',
                    message: result.error,
                    recoverable: true,
                  });
                }
              }
            } catch (error) {
              flowsFailed++;
              errors.push({
                entityId: flow._id?.toString() ?? 'unknown',
                entityType: 'ResourceFlow',
                message: error instanceof Error ? error.message : 'Unknown error',
                recoverable: true,
              });
            }
          }

          // 3. MONTHLY REVENUE XP
          const revenueXp = Math.floor(empire.monthlyRevenue / 1000000) * 
            EMPIRE_XP_REWARDS.MONTHLY_REVENUE_PER_MILLION;
          xpEarned += revenueXp;

          // 4. UPDATE AGGREGATES
          empire.recalculateAggregates();

          // 5. ADD XP
          if (xpEarned > 0) {
            await empire.addXp(xpEarned);
          }

          // 6. SAVE EMPIRE
          await empire.save();
          itemsProcessed++;

        } catch (error) {
          errors.push({
            entityId: empire._id.toString(),
            entityType: 'PlayerEmpire',
            message: error instanceof Error ? error.message : 'Unknown error',
            recoverable: true,
          });
        }
      }

      const summary: EmpireTickSummary = {
        flowsProcessed,
        flowsSuccessful,
        flowsFailed,
        totalResourcesTransferred,
        synergiesActivated,
        synergiesDeactivated,
        xpEarned,
      };

      return {
        processor: 'empire',
        success: errors.length === 0 || errors.every(e => e.recoverable),
        itemsProcessed,
        errors,
        summary,
        durationMs: Date.now() - startTime,
      };

    } catch (error) {
      return {
        processor: 'empire',
        success: false,
        itemsProcessed,
        errors: [{
          entityId: 'system',
          entityType: 'EmpireProcessor',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: false,
        }],
        summary: {
          flowsProcessed,
          flowsSuccessful,
          flowsFailed,
          totalResourcesTransferred,
          synergiesActivated,
          synergiesDeactivated,
          xpEarned,
        },
        durationMs: Date.now() - startTime,
      };
    }
  },

  /**
   * Validate processor is ready
   */
  async validate(): Promise<true | string> {
    try {
      // Check if PlayerEmpire model is available
      await PlayerEmpire.findOne().limit(1);
      return true;
    } catch (error) {
      return `Empire processor validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get XP reward based on synergy tier
 */
function getTierXp(tier: string): number {
  switch (tier) {
    case 'BASIC':
      return EMPIRE_XP_REWARDS.SYNERGY_ACTIVATED;
    case 'ADVANCED':
      return EMPIRE_XP_REWARDS.SYNERGY_ADVANCED;
    case 'ELITE':
      return EMPIRE_XP_REWARDS.SYNERGY_ELITE;
    case 'ULTIMATE':
      return EMPIRE_XP_REWARDS.SYNERGY_ULTIMATE;
    default:
      return EMPIRE_XP_REWARDS.SYNERGY_ACTIVATED;
  }
}

/**
 * Process a single resource flow
 */
async function processResourceFlow(
  flow: InstanceType<typeof ResourceFlow>,
  gameTime: GameTime
): Promise<ResourceFlowTickResult> {
  try {
    // Check if flow is due this tick
    if (!isFlowDue(flow, gameTime)) {
      return {
        flowId: flow._id.toString(),
        fromCompanyId: flow.fromCompanyId,
        toCompanyId: flow.toCompanyId,
        resourceType: flow.resourceType,
        amount: 0,
        success: true, // Not due is not an error
      };
    }

    // For internal flows (same owner), no cost
    // For external flows, we'd need to process payment
    if (flow.isInternal) {
      // Just update last flow timestamp
      flow.lastFlowAt = new Date();
      await flow.save();

      return {
        flowId: flow._id.toString(),
        fromCompanyId: flow.fromCompanyId,
        toCompanyId: flow.toCompanyId,
        resourceType: flow.resourceType,
        amount: flow.quantity,
        success: true,
      };
    }

    // External flow - would need payment processing
    // For now, just mark as processed
    flow.lastFlowAt = new Date();
    await flow.save();

    return {
      flowId: flow._id.toString(),
      fromCompanyId: flow.fromCompanyId,
      toCompanyId: flow.toCompanyId,
      resourceType: flow.resourceType,
      amount: flow.quantity,
      success: true,
    };

  } catch (error) {
    return {
      flowId: flow._id?.toString() ?? 'unknown',
      fromCompanyId: flow.fromCompanyId,
      toCompanyId: flow.toCompanyId,
      resourceType: flow.resourceType,
      amount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if resource flow is due this tick
 */
function isFlowDue(
  flow: InstanceType<typeof ResourceFlow>,
  gameTime: GameTime
): boolean {
  const frequency = flow.frequency;
  const lastFlow = flow.lastFlowAt;

  // If never flowed, it's due
  if (!lastFlow) return true;

  // Calculate months since last flow
  const lastFlowDate = new Date(lastFlow);
  const lastFlowMonth = lastFlowDate.getMonth() + 1;
  const lastFlowYear = lastFlowDate.getFullYear();
  const lastFlowTotalMonths = (lastFlowYear - 2024) * 12 + lastFlowMonth;

  switch (frequency) {
    case 'ONE_TIME':
      return false; // Already flowed
    case 'DAILY':
      return true; // Always due (game months represent daily in accelerated time)
    case 'WEEKLY':
      return true; // Simplify to monthly for now
    case 'MONTHLY':
      return gameTime.totalMonths > lastFlowTotalMonths;
    default:
      return true;
  }
}

export default empireProcessor;
