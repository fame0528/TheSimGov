/**
 * @fileoverview Endorsement Management Utilities
 * @module lib/utils/politics/endorsement
 * 
 * OVERVIEW:
 * Utilities for acquiring endorsements, calculating stacking bonuses with diminishing returns,
 * expiring endorsements, and managing endorsement portfolios. Supports multi-category
 * endorsements with influence and fundraising bonuses.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

import { EndorsementRecord, CampaignPhaseState, EndorsementTier } from '@/lib/types/politics';
import EndorsementRecordModel from '@/lib/db/models/politics/EndorsementRecord';
import { fnv1a32 } from '@/lib/utils/deterministicHash';

// ===================== CONSTANTS =====================

/** Endorsement sources by category */
export const ENDORSEMENT_SOURCES = {
  CELEBRITY: {
    name: 'Celebrity',
    baseCost: 2000,
    baseInfluence: 5,
    baseFundraising: 3,
    durationHours: 48,
  },
  UNION: {
    name: 'Labor Union',
    baseCost: 1500,
    baseInfluence: 4,
    baseFundraising: 5,
    durationHours: 72,
  },
  CORPORATE: {
    name: 'Corporate',
    baseCost: 3000,
    baseInfluence: 6,
    baseFundraising: 8,
    durationHours: 36,
  },
  POLITICAL_PARTY: {
    name: 'Political Party',
    baseCost: 5000,
    baseInfluence: 10,
    baseFundraising: 10,
    durationHours: 120,
  },
  GRASSROOTS: {
    name: 'Grassroots Organization',
    baseCost: 800,
    baseInfluence: 3,
    baseFundraising: 2,
    durationHours: 24,
  },
  MEDIA: {
    name: 'Media Outlet',
    baseCost: 2500,
    baseInfluence: 7,
    baseFundraising: 4,
    durationHours: 60,
  },
} as const;

/** Diminishing returns curve */
const DIMINISHING_RETURNS = {
  firstEndorsement: 1.0, // 100% effectiveness
  secondEndorsement: 0.8, // 80% effectiveness
  thirdEndorsement: 0.6, // 60% effectiveness
  fourthPlus: 0.4, // 40% effectiveness
};

// ===================== ENDORSEMENT ACQUISITION =====================

/**
 * Acquire endorsement from source
 */
export async function acquireEndorsement(
  playerId: string,
  category: keyof typeof ENDORSEMENT_SOURCES,
  campaignState: CampaignPhaseState,
  sourceName?: string
): Promise<{ success: boolean; endorsement?: EndorsementRecord; cost: number }> {
  const source = ENDORSEMENT_SOURCES[category];

  // Check if player can afford (would check global player funds, not campaign state)
  // For now, assume affordable
  // if (playerGlobalFunds < source.baseCost) {
  //   return { success: false, cost: source.baseCost };
  // }

  // Count existing endorsements in category for diminishing returns
  const existingCount = await EndorsementRecordModel.countDocuments({
    playerId,
    sourceCategory: category,
  });
  const diminishingFactor = calculateDiminishingFactor(existingCount);

  // Calculate effective bonuses
  const influenceBonusPercent = source.baseInfluence * diminishingFactor;
  const fundraisingBonusPercent = source.baseFundraising * diminishingFactor;

  // Calculate expiry
  const now = Date.now() / 1000;
  const expiryEpoch = now + source.durationHours * 3600;

  // Generate source name if not provided
  const finalSourceName = sourceName ?? generateSourceName(category, playerId, now);

  const endorsement = await EndorsementRecordModel.create({
    playerId,
    sourceCategory: category,
    sourceName: finalSourceName,
    tier: EndorsementTier.STANDARD, // Default tier
    acquiredEpoch: now,
    expiryEpoch: expiryEpoch,
    diminishingReturnFactor: diminishingFactor,
    influenceBonusPercent,
    fundraisingBonusPercent,
    schemaVersion: 1,
  });

  return {
    success: true,
    endorsement: endorsement.toJSON() as EndorsementRecord,
    cost: source.baseCost,
  };
}

/**
 * Calculate diminishing return factor
 */
function calculateDiminishingFactor(existingCount: number): number {
  if (existingCount === 0) return DIMINISHING_RETURNS.firstEndorsement;
  if (existingCount === 1) return DIMINISHING_RETURNS.secondEndorsement;
  if (existingCount === 2) return DIMINISHING_RETURNS.thirdEndorsement;
  return DIMINISHING_RETURNS.fourthPlus;
}

/**
 * Generate source name
 */
function generateSourceName(
  category: keyof typeof ENDORSEMENT_SOURCES,
  playerId: string,
  timestamp: number
): string {
  const seed = `${category}-${playerId}-${timestamp}`;
  const hash = fnv1a32(seed);

  const names: Record<keyof typeof ENDORSEMENT_SOURCES, string[]> = {
    CELEBRITY: [
      'Actor James Miller',
      'Singer Sarah Chen',
      'Athlete Marcus Johnson',
      'Director Lisa Anderson',
    ],
    UNION: [
      'Teachers Union Local 401',
      'Auto Workers Union',
      'Service Employees Union',
      'Nurses Association',
    ],
    CORPORATE: [
      'Tech Industries Coalition',
      'Manufacturing Alliance',
      'Financial Services Group',
      'Energy Sector Consortium',
    ],
    POLITICAL_PARTY: [
      'Progressive Coalition',
      'Conservative Alliance',
      'Moderate Forum',
      'Reform Movement',
    ],
    GRASSROOTS: [
      'Community Action Network',
      'Local Organizing Committee',
      'Citizens for Change',
      'Neighborhood Association',
    ],
    MEDIA: [
      'Daily Chronicle',
      'News Network 7',
      'Political Review Magazine',
      'Radio Talk 990',
    ],
  };

  const options = names[category];
  const index = hash % options.length;
  return options[index];
}

// ===================== BONUS CALCULATION =====================

/**
 * Calculate total endorsement bonuses for player
 */
export async function calculateEndorsementBonuses(playerId: string): Promise<{
  influenceBonusPercent: number;
  fundraisingBonusPercent: number;
  activeCount: number;
}> {
  const activeEndorsements = await EndorsementRecordModel.find({
    playerId,
    $or: [{ expiryEpoch: { $gt: Date.now() / 1000 } }, { expiryEpoch: { $exists: false } }],
  }).lean();

  const totals = (activeEndorsements as EndorsementRecord[]).reduce(
    (acc, endorsement) => ({
      influenceBonusPercent: acc.influenceBonusPercent + endorsement.influenceBonusPercent,
      fundraisingBonusPercent:
        acc.fundraisingBonusPercent + endorsement.fundraisingBonusPercent,
    }),
    { influenceBonusPercent: 0, fundraisingBonusPercent: 0 }
  );

  return {
    ...totals,
    activeCount: activeEndorsements.length,
  };
}

/**
 * Get influence bonus for specific category
 */
export async function getCategoryInfluenceBonus(
  playerId: string,
  category: keyof typeof ENDORSEMENT_SOURCES
): Promise<number> {
  const endorsements = await EndorsementRecordModel.find({
    playerId,
    sourceCategory: category,
    expiryEpoch: { $gt: Date.now() / 1000 },
  });

  return endorsements.reduce(
    (total, e) => total + (e.toJSON() as EndorsementRecord).influenceBonusPercent,
    0
  );
}

// ===================== ENDORSEMENT EXPIRY =====================

/**
 * Expire old endorsements
 */
export async function expireEndorsements(playerId?: string): Promise<number> {
  if (playerId) {
    const result = await EndorsementRecordModel.deleteMany({
      playerId,
      expiryEpoch: { $lt: Date.now() / 1000 },
    });
    return result.deletedCount ?? 0;
  }

  // Expire all old endorsements globally
  const result = await EndorsementRecordModel.deleteMany({
    expiryEpoch: { $lt: Date.now() / 1000 },
  });

  return result.deletedCount ?? 0;
}

/**
 * Check if endorsement is about to expire (within 6 hours)
 */
export function isEndorsementExpiringSoon(endorsement: EndorsementRecord): boolean {
  if (!endorsement.expiryEpoch) return false;
  const now = Date.now() / 1000;
  const hoursRemaining = (endorsement.expiryEpoch - now) / 3600;
  return hoursRemaining > 0 && hoursRemaining <= 6;
}

/**
 * Get time remaining for endorsement
 */
export function getTimeRemaining(endorsement: EndorsementRecord): {
  hours: number;
  minutes: number;
} {
  if (!endorsement.expiryEpoch) return { hours: Infinity, minutes: 0 };
  const now = Date.now() / 1000;
  const secondsRemaining = Math.max(0, endorsement.expiryEpoch - now);

  return {
    hours: Math.floor(secondsRemaining / 3600),
    minutes: Math.floor((secondsRemaining % 3600) / 60),
  };
}

// ===================== ENDORSEMENT PORTFOLIO =====================

/**
 * Get endorsement portfolio for player
 */
export async function getEndorsementPortfolio(playerId: string): Promise<{
  active: EndorsementRecord[];
  expired: number;
  byCategory: Record<string, number>;
  totalInfluenceBonus: number;
  totalFundraisingBonus: number;
}> {
  const active = (await EndorsementRecordModel.find({
    playerId,
    $or: [{ expiryEpoch: { $gt: Date.now() / 1000 } }, { expiryEpoch: { $exists: false } }],
  }).lean()) as EndorsementRecord[];

  const byCategory = active.reduce((acc, e) => {
    acc[e.sourceCategory] = (acc[e.sourceCategory] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalInfluenceBonus = active.reduce((sum, e) => sum + e.influenceBonusPercent, 0);
  const totalFundraisingBonus = active.reduce((sum, e) => sum + e.fundraisingBonusPercent, 0);

  // Count expired
  const expiredCount = await EndorsementRecordModel.countDocuments({
    playerId,
    expiryEpoch: { $lt: Date.now() / 1000 },
  });

  return {
    active,
    expired: expiredCount,
    byCategory,
    totalInfluenceBonus,
    totalFundraisingBonus,
  };
}

/**
 * Get endorsement recommendations
 */
export async function getEndorsementRecommendations(
  playerId: string,
  campaignState: CampaignPhaseState
): Promise<
  Array<{
    category: keyof typeof ENDORSEMENT_SOURCES;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
    cost: number;
  }>
> {
  const portfolio = await getEndorsementPortfolio(playerId);
  const recommendations: Array<{
    category: keyof typeof ENDORSEMENT_SOURCES;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
    cost: number;
  }> = [];

  // Recommend based on campaign phase
  const phase = campaignState.activePhase;

  if (phase === 'FUNDRAISING') {
    // Prioritize fundraising bonuses
    if (!portfolio.byCategory.CORPORATE || portfolio.byCategory.CORPORATE < 2) {
      recommendations.push({
        category: 'CORPORATE',
        priority: 'HIGH',
        reason: 'High fundraising bonus during fundraising phase',
        cost: ENDORSEMENT_SOURCES.CORPORATE.baseCost,
      });
    }
  }

  if (phase === 'LOBBYING') {
    // Prioritize influence bonuses
    if (!portfolio.byCategory.POLITICAL_PARTY) {
      recommendations.push({
        category: 'POLITICAL_PARTY',
        priority: 'HIGH',
        reason: 'Maximum influence bonus for lobbying',
        cost: ENDORSEMENT_SOURCES.POLITICAL_PARTY.baseCost,
      });
    }
  }

  if (phase === 'PUBLIC_RELATIONS') {
    // Prioritize media and celebrity
    if (!portfolio.byCategory.MEDIA) {
      recommendations.push({
        category: 'MEDIA',
        priority: 'HIGH',
        reason: 'Strong influence during PR phase',
        cost: ENDORSEMENT_SOURCES.MEDIA.baseCost,
      });
    }

    if (!portfolio.byCategory.CELEBRITY) {
      recommendations.push({
        category: 'CELEBRITY',
        priority: 'MEDIUM',
        reason: 'Public appeal boost',
        cost: ENDORSEMENT_SOURCES.CELEBRITY.baseCost,
      });
    }
  }

  // Always recommend grassroots if low funds raised this cycle
  if (campaignState.fundsRaisedThisCycle < 2000 && !portfolio.byCategory.GRASSROOTS) {
    recommendations.push({
      category: 'GRASSROOTS',
      priority: 'LOW',
      reason: 'Affordable option for limited budget',
      cost: ENDORSEMENT_SOURCES.GRASSROOTS.baseCost,
    });
  }

  return recommendations;
}
