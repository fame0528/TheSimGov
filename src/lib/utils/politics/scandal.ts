/**
 * @fileoverview Scandal Management Utilities
 * @module lib/utils/politics/scandal
 * 
 * OVERVIEW:
 * Utilities for generating scandals, calculating reputation impact, processing mitigation
 * actions, and managing scandal lifecycle. Supports severity-based penalties with
 * recovery mechanics.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

import { ScandalRecord, CampaignPhaseState, ScandalStatus } from '@/lib/types/politics';
import ScandalRecordModel from '@/lib/db/models/politics/ScandalRecord';
import { fnv1a32 } from '@/lib/utils/deterministicHash';

// ===================== CONSTANTS =====================

/** Scandal categories and their base severity ranges */
export const SCANDAL_CATEGORIES = {
  FINANCIAL: { min: 0.3, max: 0.8, name: 'Financial Misconduct' },
  PERSONAL: { min: 0.2, max: 0.6, name: 'Personal Conduct' },
  POLICY: { min: 0.4, max: 0.9, name: 'Policy Violation' },
  ETHICAL: { min: 0.5, max: 1.0, name: 'Ethical Breach' },
} as const;

/** Mitigation action types and effectiveness */
export const MITIGATION_ACTIONS = {
  PUBLIC_APOLOGY: { cost: 500, effectiveness: 0.15 },
  INVESTIGATION: { cost: 1000, effectiveness: 0.25 },
  DAMAGE_CONTROL_PR: { cost: 1500, effectiveness: 0.30 },
  POLICY_REFORM: { cost: 2000, effectiveness: 0.40 },
  FULL_TRANSPARENCY: { cost: 3000, effectiveness: 0.50 },
} as const;

/** Recovery parameters */
const RECOVERY_PARAMS = {
  baseRecoveryPerHour: 0.5, // 0.5% per hour base
  maxRecoveryPerHour: 2.0, // 2% per hour max
  containmentBonus: 1.5, // 1.5x recovery when contained
};

// ===================== SCANDAL GENERATION =====================

/**
 * Generate random scandal event
 * Scandals can occur based on campaign activity and reputation
 */
export async function generateScandal(
  playerId: string,
  campaignState: CampaignPhaseState,
  trigger?: 'RANDOM' | 'LOBBYING_AGGRESSIVE' | 'REPUTATION_LOW'
): Promise<ScandalRecord> {
  const now = Date.now() / 1000;
  const seed = `scandal-${playerId}-${now}`;

  // Determine category based on trigger
  const category = determineScandalCategory(trigger, seed);
  const config = SCANDAL_CATEGORIES[category];

  // Calculate severity (0-1)
  const hash = fnv1a32(seed);
  const severityRange = config.max - config.min;
  const severity = config.min + ((hash % 1000) / 1000) * severityRange;

  // Calculate initial reputation hit
  const reputationHitPercent = severity * 20; // Up to 20% hit for max severity

  // Determine recovery rate (lower for more severe)
  const recoveryRatePerHourPercent =
    RECOVERY_PARAMS.baseRecoveryPerHour * (1 - severity * 0.5);

  // Generate scandal description
  const description = generateScandalDescription(category, severity, seed);

  const scandal = await ScandalRecordModel.create({
    playerId,
    category,
    severity,
    description: description,
    status: ScandalStatus.DISCOVERED,
    discoveredEpoch: now,
    reputationHitPercent,
    recoveryRatePerHourPercent,
    mitigationActions: [],
    seed: seed,
    schemaVersion: 1,
    updatedEpoch: now,
  });

  return scandal.toJSON() as ScandalRecord;
}

/**
 * Determine scandal category from trigger
 */
function determineScandalCategory(
  trigger?: string,
  seed?: string
): keyof typeof SCANDAL_CATEGORIES {
  if (trigger === 'LOBBYING_AGGRESSIVE') {
    return 'ETHICAL';
  }

  if (trigger === 'REPUTATION_LOW') {
    return 'PERSONAL';
  }

  // Random category
  const hash = seed ? fnv1a32(seed) : Math.random() * 1000;
  const roll = hash % 100;

  if (roll < 25) return 'FINANCIAL';
  if (roll < 50) return 'PERSONAL';
  if (roll < 75) return 'POLICY';
  return 'ETHICAL';
}

/**
 * Generate scandal description
 */
function generateScandalDescription(
  category: keyof typeof SCANDAL_CATEGORIES,
  severity: number,
  seed: string
): string {
  const templates: Record<keyof typeof SCANDAL_CATEGORIES, string[]> = {
    FINANCIAL: [
      'Undisclosed campaign contributions',
      'Questionable expense claims',
      'Financial conflicts of interest',
      'Improper use of campaign funds',
    ],
    PERSONAL: [
      'Inappropriate personal conduct',
      'Past controversial statements surface',
      'Personal relationship controversy',
      'Social media scandal',
    ],
    POLICY: [
      'Policy flip-flop exposed',
      'Inconsistent voting record',
      'Broken campaign promises',
      'Questionable policy decisions',
    ],
    ETHICAL: [
      'Lobbying ethics violation',
      'Quid pro quo allegations',
      'Insider information usage',
      'Conflict of interest',
    ],
  };

  const hash = fnv1a32(seed);
  const options = templates[category];
  const index = hash % options.length;
  const severityLabel = severity > 0.7 ? 'Major' : severity > 0.4 ? 'Moderate' : 'Minor';

  return `${severityLabel} ${options[index]}`;
}

// ===================== REPUTATION IMPACT =====================

/**
 * Calculate current reputation impact of active scandals
 */
export function calculateReputationImpact(scandals: ScandalRecord[]): number {
  return scandals
    .filter((s) => s.status === 'DISCOVERED' || s.status === 'INVESTIGATING')
    .reduce((total, scandal) => {
      const hoursSinceDiscovery = (Date.now() / 1000 - scandal.discoveredEpoch) / 3600;

      // Calculate recovery amount
      let recoveryAmount = scandal.recoveryRatePerHourPercent * hoursSinceDiscovery;

      // Bonus if contained
      if (scandal.containedEpoch && scandal.containedEpoch > 0) {
        const hoursSinceContainment = (Date.now() / 1000 - scandal.containedEpoch) / 3600;
        recoveryAmount +=
          scandal.recoveryRatePerHourPercent *
          RECOVERY_PARAMS.containmentBonus *
          hoursSinceContainment;
      }

      // Current impact = base hit - recovery
      const currentImpact = Math.max(0, scandal.reputationHitPercent - recoveryAmount);
      return total + currentImpact;
    }, 0);
}

/**
 * Calculate total scandal penalty for player
 */
export async function getTotalScandalPenalty(playerId: string): Promise<number> {
  const activeScandals = await ScandalRecordModel.find({
    playerId,
    status: { $in: ['DISCOVERED', 'INVESTIGATING'] },
  }).lean();
  return calculateReputationImpact(activeScandals as ScandalRecord[]);
}

// ===================== MITIGATION PROCESSING =====================

/**
 * Process mitigation action
 */
export async function processMitigation(
  scandalId: string,
  playerId: string,
  action: keyof typeof MITIGATION_ACTIONS,
  campaignState: CampaignPhaseState
): Promise<{ success: boolean; newRecoveryRate: number; cost: number }> {
  const mitigation = MITIGATION_ACTIONS[action];

  // Check if player can afford (would check global player funds)
  // For now, assume affordable
  // if (playerGlobalFunds < mitigation.cost) {
  //   return { success: false, newRecoveryRate: 0, cost: mitigation.cost };
  // }

  const scandal = await ScandalRecordModel.findById(scandalId);
  if (!scandal || scandal.playerId !== playerId) {
    return { success: false, newRecoveryRate: 0, cost: mitigation.cost };
  }

  // Add mitigation action
  const now = Date.now() / 1000;
  scandal.mitigationActions.push(action);

  // Increase recovery rate
  const newRecoveryRate = Math.min(
    RECOVERY_PARAMS.maxRecoveryPerHour,
    scandal.recoveryRatePerHourPercent + mitigation.effectiveness
  );
  scandal.recoveryRatePerHourPercent = newRecoveryRate;

  await scandal.save();

  return {
    success: true,
    newRecoveryRate,
    cost: mitigation.cost,
  };
}

/**
 * Attempt to contain scandal (reduces ongoing damage)
 */
export async function containScandal(
  scandalId: string,
  playerId: string
): Promise<boolean> {
  const scandal = await ScandalRecordModel.findById(scandalId);
  if (!scandal || scandal.playerId !== playerId || scandal.status === 'RESOLVED') {
    return false;
  }

  // Mark as contained
  scandal.status = ScandalStatus.CONTAINED;
  scandal.containedEpoch = Date.now() / 1000;
  await scandal.save();

  return true;
}

/**
 * Mark scandal as resolved
 */
export async function resolveScandal(
  scandalId: string,
  playerId: string
): Promise<boolean> {
  const scandal = await ScandalRecordModel.findById(scandalId);
  if (!scandal || scandal.playerId !== playerId) {
    return false;
  }

  // Calculate if scandal can be resolved
  const currentImpact = calculateReputationImpact([scandal.toJSON() as ScandalRecord]);

  // Can resolve if impact is minimal (<2%)
  if (currentImpact > 2) {
    return false;
  }

  scandal.status = ScandalStatus.RESOLVED;
  scandal.resolvedEpoch = Date.now() / 1000;
  await scandal.save();

  return true;
}

// ===================== SCANDAL HISTORY =====================

/**
 * Get scandal history for player
 */
export async function getScandalHistory(
  playerId: string,
  status?: 'ACTIVE' | 'CONTAINED' | 'RESOLVED'
): Promise<ScandalRecord[]> {
  if (status) {
    return (await ScandalRecordModel.find({ playerId, status }).lean()) as ScandalRecord[];
  }

  return (await ScandalRecordModel.find({ playerId })
    .sort({ discoveredEpoch: -1 })
    .limit(50)
    .lean()) as ScandalRecord[];
}

/**
 * Get scandal summary
 */
export async function getScandalSummary(playerId: string): Promise<{
  active: number;
  contained: number;
  resolved: number;
  totalImpact: number;
}> {
  const active = await ScandalRecordModel.find({
    playerId,
    status: { $in: ['DISCOVERED', 'INVESTIGATING'] },
  }).lean();
  const contained = await ScandalRecordModel.find({ playerId, status: 'CONTAINED' }).lean();
  const resolved = await ScandalRecordModel.find({ playerId, status: 'RESOLVED' }).lean();
  const totalImpact = await getTotalScandalPenalty(playerId);

  return {
    active: active.length,
    contained: contained.length,
    resolved: resolved.length,
    totalImpact,
  };
}

/**
 * Check if scandal should auto-resolve
 */
export async function checkAutoResolve(scandalId: string): Promise<boolean> {
  const scandal = await ScandalRecordModel.findById(scandalId);
  if (!scandal || scandal.status === 'RESOLVED') {
    return false;
  }

  const currentImpact = calculateReputationImpact([scandal.toJSON() as ScandalRecord]);

  // Auto-resolve if impact < 1%
  if (currentImpact < 1) {
    scandal.status = ScandalStatus.RESOLVED;
    scandal.resolvedEpoch = Date.now() / 1000;
    await scandal.save();
    return true;
  }

  return false;
}
