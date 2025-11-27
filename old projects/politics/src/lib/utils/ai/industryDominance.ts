/**
 * Industry Dominance Utility Functions
 * 
 * Created: 2025-11-15
 * Phase: 5.2 - Industry Dominance & Global Impact
 * 
 * OVERVIEW:
 * Provides functions for calculating market dominance, detecting monopolies, and analyzing
 * competitive positioning in the AI industry. Uses Herfindahl-Hirschman Index (HHI) for
 * market concentration analysis and implements winner-take-all dynamics common in tech markets.
 * 
 * FEATURES:
 * - Market share calculation across AI subcategories
 * - HHI calculation for industry concentration
 * - Monopoly detection (>40% triggers antitrust)
 * - Competitive intelligence gathering
 * - Antitrust risk assessment
 * - Industry consolidation impact analysis
 * 
 * FORMULAS:
 * - Market Share = (Company Revenue / Total Industry Revenue) * 100
 * - HHI = Σ(Market Share²) for all companies
 * - Antitrust Risk = f(Market Share, HHI, Regulatory Climate)
 * - Consolidation Impact = Change in HHI from M&A activity
 */

import { Types } from 'mongoose';
import Company from '@/lib/db/models/Company';
import AIModel from '@/lib/db/models/AIModel';
import Transaction from '@/lib/db/models/Transaction';

// ==== TYPES ==== //

/**
 * Market share data for a company in a specific market.
 */
export interface MarketShareData {
  companyId: Types.ObjectId;
  companyName: string;
  marketShare: number; // Percentage (0-100)
  revenue: number; // Total revenue in market
  userCount: number; // Number of users/customers
  modelDeployments: number; // Number of deployed AI models
  marketPosition: number; // Ranking (1 = market leader)
}

/**
 * Industry concentration metrics using HHI.
 */
export interface IndustryConcentration {
  hhi: number; // Herfindahl-Hirschman Index (0-10,000)
  marketStructure: 'Competitive' | 'Moderate' | 'Concentrated' | 'Monopolistic';
  topCompanies: MarketShareData[];
  totalMarketSize: number; // Total industry revenue
  numberOfCompetitors: number;
  concentrationTrend: 'Increasing' | 'Stable' | 'Decreasing';
}

/**
 * Monopoly detection result with risk assessment.
 */
export interface MonopolyDetection {
  isMonopoly: boolean;
  marketShare: number;
  antitrustRisk: number; // 0-100 (higher = more risk)
  regulatoryActions: string[]; // Likely government responses
  recommendedActions: string[]; // What company should do
  timeToIntervention?: number; // Estimated months until forced action
}

/**
 * Competitive intelligence data about market positioning.
 */
export interface CompetitiveIntelligence {
  companyId: Types.ObjectId;
  marketPosition: number; // Ranking in industry
  nearestCompetitors: Array<{
    companyId: Types.ObjectId;
    name: string;
    marketShare: number;
    gap: number; // Percentage point difference
  }>;
  competitiveAdvantages: string[];
  vulnerabilities: string[];
  threatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  opportunityScore: number; // 0-100 (higher = better growth opportunities)
}

/**
 * Antitrust risk assessment with detailed factors.
 */
export interface AntitrustRisk {
  riskScore: number; // 0-100
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  triggerFactors: Array<{
    factor: string;
    weight: number;
    contribution: number;
  }>;
  mitigationStrategies: string[];
  estimatedFines: number; // Potential regulatory fines in USD
  probabilityOfAction: number; // 0-100 (likelihood of government intervention)
}

/**
 * Industry consolidation impact from M&A activity.
 */
export interface ConsolidationImpact {
  preMergerHHI: number;
  postMergerHHI: number;
  hhiChange: number;
  antitrustConcern: boolean; // True if HHI increase >200
  expectedRegulatorResponse: 'Approve' | 'Review' | 'Block';
  marketShareCombined: number;
  competitiveEffects: string[];
}

// ==== CONSTANTS ==== //

/** HHI thresholds for market concentration (DOJ/FTC guidelines) */
const HHI_COMPETITIVE = 1500; // Below = competitive market
const HHI_MODERATE = 2500; // 1500-2500 = moderately concentrated

/** Market share thresholds for antitrust scrutiny */
const MONOPOLY_THRESHOLD = 40; // >40% triggers investigations

/** HHI change threshold for merger concern */
const HHI_MERGER_CONCERN = 200; // Increase >200 = likely regulatory review

// ==== FUNCTIONS ==== //

/**
 * Calculate market share for all companies in a specific AI subcategory.
 * 
 * Market share is calculated using a weighted formula:
 * - Revenue: 40% weight
 * - User count: 30% weight
 * - Model deployments: 30% weight
 * 
 * This prevents pure revenue from dominating (important for open-source models).
 * 
 * @param industry - Industry type (e.g., "Technology")
 * @param subcategory - AI subcategory (e.g., "AI", "Software", "Hardware")
 * @returns Array of market share data for each company
 * 
 * @example
 * const shares = await calculateMarketShare("Technology", "AI");
 * console.log(`Market leader has ${shares[0].marketShare}% share`);
 */
export async function calculateMarketShare(
  industry: string,
  subcategory?: string
): Promise<MarketShareData[]> {
  // Build query filter
  const filter: any = { industry };
  if (subcategory) {
    filter.subcategory = subcategory;
  }

  // Get all companies in this market
  const companies = await Company.find(filter)
    .select('_id name revenue')
    .lean();

  if (companies.length === 0) {
    return [];
  }

  // Calculate total market metrics
  let totalRevenue = 0;
  let totalUsers = 0;
  let totalDeployments = 0;

  const marketData: Array<{
    company: typeof companies[0];
    revenue: number;
    users: number;
    deployments: number;
  }> = [];

  for (const company of companies) {
    // Get revenue from transactions (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const transactions = await Transaction.aggregate([
      {
        $match: {
          from: company._id,
          createdAt: { $gte: twelveMonthsAgo },
          category: { $in: ['ai_model_sale', 'saas_revenue', 'api_usage'] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
        },
      },
    ]);

    const revenue = transactions[0]?.totalRevenue || company.revenue || 0;

    // Get user count from AI models
    const models = await AIModel.find({ company: company._id }).select('apiUsage');
    const users = models.reduce((sum, _model) => {
      // Note: API usage tracking requires extending IAIModel interface
      // For now, use 0 as placeholder
      return sum + 0;
    }, 0);

    // Get deployment count
    const deployments = await AIModel.countDocuments({
      company: company._id,
      status: 'deployed',
    });

    marketData.push({
      company,
      revenue,
      users,
      deployments,
    });

    totalRevenue += revenue;
    totalUsers += users;
    totalDeployments += deployments;
  }

  // Calculate weighted market share
  const shareData = marketData.map((data) => {
    // Weighted share calculation (normalize each component to 0-100)
    const revenueShare = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
    const userShare = totalUsers > 0 ? (data.users / totalUsers) * 100 : 0;
    const deploymentShare =
      totalDeployments > 0 ? (data.deployments / totalDeployments) * 100 : 0;

    // Weighted average: Revenue 40%, Users 30%, Deployments 30%
    const marketShare = revenueShare * 0.4 + userShare * 0.3 + deploymentShare * 0.3;

    return {
      companyId: data.company._id,
      companyName: data.company.name,
      marketShare: parseFloat(marketShare.toFixed(2)),
      revenue: data.revenue,
      userCount: data.users,
      modelDeployments: data.deployments,
      marketPosition: 0, // Will be set after sorting
    };
  });

  // Sort by market share (descending) and assign positions
  shareData.sort((a, b) => b.marketShare - a.marketShare);
  
  // Convert to proper MarketShareData type with explicit ObjectId conversion
  const typedShareData: MarketShareData[] = shareData.map((data, index) => ({
    companyId: new Types.ObjectId(data.companyId.toString()),
    companyName: data.companyName,
    marketShare: data.marketShare,
    revenue: data.revenue,
    userCount: data.userCount,
    modelDeployments: data.modelDeployments,
    marketPosition: index + 1,
  }));

  return typedShareData;
}

/**
 * Calculate Herfindahl-Hirschman Index (HHI) for industry concentration.
 * 
 * HHI = Σ(Market Share²) for all firms
 * 
 * INTERPRETATION:
 * - HHI < 1,500: Competitive market (many players)
 * - HHI 1,500-2,500: Moderately concentrated (oligopoly forming)
 * - HHI > 2,500: Highly concentrated (monopoly risk)
 * - HHI = 10,000: Pure monopoly (one company = 100% share)
 * 
 * @param industry - Industry type
 * @param subcategory - Optional AI subcategory
 * @returns Industry concentration analysis
 * 
 * @example
 * const concentration = await calculateHHI("Technology", "AI");
 * if (concentration.hhi > 2500) {
 *   console.log("Highly concentrated market - antitrust risk!");
 * }
 */
export async function calculateHHI(
  industry: string,
  subcategory?: string
): Promise<IndustryConcentration> {
  const marketShares = await calculateMarketShare(industry, subcategory);

  if (marketShares.length === 0) {
    return {
      hhi: 0,
      marketStructure: 'Competitive',
      topCompanies: [],
      totalMarketSize: 0,
      numberOfCompetitors: 0,
      concentrationTrend: 'Stable',
    };
  }

  // Calculate HHI = Σ(share²)
  const hhi = marketShares.reduce((sum, company) => {
    return sum + Math.pow(company.marketShare, 2);
  }, 0);

  // Determine market structure based on HHI
  let marketStructure: IndustryConcentration['marketStructure'];
  if (hhi < HHI_COMPETITIVE) {
    marketStructure = 'Competitive';
  } else if (hhi < HHI_MODERATE) {
    marketStructure = 'Moderate';
  } else if (hhi < 5000) {
    marketStructure = 'Concentrated';
  } else {
    marketStructure = 'Monopolistic';
  }

  // Calculate total market size
  const totalMarketSize = marketShares.reduce((sum, company) => {
    return sum + company.revenue;
  }, 0);

  // Determine concentration trend (requires historical data)
  // For now, simple heuristic: if top 3 have >70% share, trend is "Increasing"
  const top3Share = marketShares.slice(0, 3).reduce((sum, company) => {
    return sum + company.marketShare;
  }, 0);

  let concentrationTrend: IndustryConcentration['concentrationTrend'];
  if (top3Share > 70) {
    concentrationTrend = 'Increasing';
  } else if (top3Share < 40) {
    concentrationTrend = 'Decreasing';
  } else {
    concentrationTrend = 'Stable';
  }

  return {
    hhi: parseFloat(hhi.toFixed(2)),
    marketStructure,
    topCompanies: marketShares.slice(0, 5), // Top 5 companies
    totalMarketSize,
    numberOfCompetitors: marketShares.length,
    concentrationTrend,
  };
}

/**
 * Detect if a company has achieved monopoly status and assess antitrust risk.
 * 
 * THRESHOLDS:
 * - >40% market share: Antitrust investigations likely
 * - >60% market share: Forced divestitures probable
 * - >80% market share: Immediate regulatory action
 * 
 * Risk factors:
 * - Market share percentage
 * - Duration of dominance
 * - Barriers to entry created
 * - Consumer harm evidence
 * - Political pressure level
 * 
 * @param companyId - Company to analyze
 * @param industry - Industry type
 * @param subcategory - Optional AI subcategory
 * @returns Monopoly detection result with risk assessment
 * 
 * @example
 * const result = await detectMonopoly(companyId, "Technology", "AI");
 * if (result.isMonopoly) {
 *   console.log(`Antitrust risk: ${result.antitrustRisk}%`);
 *   console.log(`Recommended: ${result.recommendedActions.join(", ")}`);
 * }
 */
export async function detectMonopoly(
  companyId: Types.ObjectId,
  industry: string,
  subcategory?: string
): Promise<MonopolyDetection> {
  const marketShares = await calculateMarketShare(industry, subcategory);
  const companyShare = marketShares.find((s) => s.companyId.equals(companyId));

  if (!companyShare) {
    return {
      isMonopoly: false,
      marketShare: 0,
      antitrustRisk: 0,
      regulatoryActions: [],
      recommendedActions: ['Enter market to establish presence'],
    };
  }

  const share = companyShare.marketShare;
  const isMonopoly = share >= MONOPOLY_THRESHOLD;

  // Calculate antitrust risk (0-100)
  let antitrustRisk = 0;

  if (share < 40) {
    antitrustRisk = Math.min(share * 0.5, 20); // Low risk below 40%
  } else if (share < 60) {
    antitrustRisk = 40 + (share - 40) * 2; // Moderate to high risk 40-60%
  } else {
    antitrustRisk = 80 + Math.min((share - 60) * 0.5, 20); // Severe risk >60%
  }

  // Determine regulatory actions
  const regulatoryActions: string[] = [];
  const recommendedActions: string[] = [];

  if (share >= 80) {
    regulatoryActions.push('Immediate antitrust investigation');
    regulatoryActions.push('Forced divestiture proceedings');
    regulatoryActions.push('Behavioral remedies (price controls, open APIs)');
    recommendedActions.push('Voluntary divestiture to avoid forced breakup');
    recommendedActions.push('Aggressive lobbying campaign');
    recommendedActions.push('International expansion to diversify');
  } else if (share >= 60) {
    regulatoryActions.push('Antitrust investigation initiated');
    regulatoryActions.push('Divestiture discussions');
    regulatoryActions.push('Market access requirements');
    recommendedActions.push('Reduce market share through spin-offs');
    recommendedActions.push('License technology to competitors');
    recommendedActions.push('Invest heavily in lobbying');
  } else if (share >= 40) {
    regulatoryActions.push('Regulatory scrutiny increased');
    regulatoryActions.push('Merger approval difficult');
    regulatoryActions.push('Market behavior monitoring');
    recommendedActions.push('Slow growth to avoid >60% threshold');
    recommendedActions.push('Build political relationships');
    recommendedActions.push('Emphasize consumer benefits');
  } else {
    recommendedActions.push('Continue growth without restriction');
    recommendedActions.push('Monitor market share quarterly');
  }

  // Estimate time to intervention (months)
  let timeToIntervention: number | undefined;
  if (share >= 60) {
    timeToIntervention = Math.max(6, Math.floor((80 - share) * 2)); // 6-40 months
  } else if (share >= 40) {
    timeToIntervention = Math.floor((60 - share) * 6); // Up to 120 months
  }

  return {
    isMonopoly,
    marketShare: share,
    antitrustRisk: parseFloat(antitrustRisk.toFixed(2)),
    regulatoryActions,
    recommendedActions,
    timeToIntervention,
  };
}

/**
 * Gather competitive intelligence about company's market positioning.
 * 
 * Analyzes:
 * - Market position relative to competitors
 * - Competitive advantages and vulnerabilities
 * - Threat level from competitors
 * - Growth opportunities
 * 
 * @param companyId - Company to analyze
 * @param industry - Industry type
 * @param subcategory - Optional AI subcategory
 * @returns Competitive intelligence data
 * 
 * @example
 * const intel = await gatherCompetitiveIntelligence(companyId, "Technology", "AI");
 * console.log(`Market position: #${intel.marketPosition}`);
 * console.log(`Threat level: ${intel.threatLevel}`);
 * console.log(`Advantages: ${intel.competitiveAdvantages.join(", ")}`);
 */
export async function gatherCompetitiveIntelligence(
  companyId: Types.ObjectId,
  industry: string,
  subcategory?: string
): Promise<CompetitiveIntelligence> {
  const marketShares = await calculateMarketShare(industry, subcategory);
  const companyIndex = marketShares.findIndex((s) => s.companyId.equals(companyId));

  if (companyIndex === -1) {
    return {
      companyId,
      marketPosition: marketShares.length + 1,
      nearestCompetitors: [],
      competitiveAdvantages: [],
      vulnerabilities: ['Not yet established in market'],
      threatLevel: 'Low',
      opportunityScore: 80, // High opportunity for new entrant
    };
  }

  const company = marketShares[companyIndex];
  const marketPosition = company.marketPosition;

  // Identify nearest competitors (within ±2 positions)
  const nearestCompetitors = [];
  for (let i = Math.max(0, companyIndex - 2); i < Math.min(marketShares.length, companyIndex + 3); i++) {
    if (i !== companyIndex) {
      const competitor = marketShares[i];
      nearestCompetitors.push({
        companyId: competitor.companyId,
        name: competitor.companyName,
        marketShare: competitor.marketShare,
        gap: parseFloat(Math.abs(company.marketShare - competitor.marketShare).toFixed(2)),
      });
    }
  }

  // Determine competitive advantages based on position
  const competitiveAdvantages: string[] = [];
  const vulnerabilities: string[] = [];

  if (marketPosition === 1) {
    competitiveAdvantages.push('Market leadership position');
    competitiveAdvantages.push('Brand recognition');
    competitiveAdvantages.push('Network effects advantage');
    vulnerabilities.push('Antitrust regulatory risk');
    vulnerabilities.push('Target for aggressive competitors');
  } else if (marketPosition <= 3) {
    competitiveAdvantages.push('Top-tier market position');
    competitiveAdvantages.push('Resource availability for competition');
    vulnerabilities.push('Pressure from market leader');
    vulnerabilities.push('Need to differentiate from leader');
  } else if (marketPosition <= 5) {
    competitiveAdvantages.push('Established market presence');
    vulnerabilities.push('Risk of marginalization by top players');
    vulnerabilities.push('Limited resources vs. leaders');
  } else {
    vulnerabilities.push('Weak market position');
    vulnerabilities.push('Low brand recognition');
    vulnerabilities.push('Risk of market exit');
  }

  // Assess threat level based on competitive pressure
  let threatLevel: CompetitiveIntelligence['threatLevel'];
  if (marketPosition === 1 && nearestCompetitors[0]?.gap > 20) {
    threatLevel = 'Low'; // Dominant leader with large gap
  } else if (marketPosition <= 3 && nearestCompetitors.some((c) => c.gap < 5)) {
    threatLevel = 'High'; // Tight competition in top tier
  } else if (marketPosition > 5) {
    threatLevel = 'Critical'; // Survival threat for small players
  } else {
    threatLevel = 'Medium';
  }

  // Calculate opportunity score (0-100, higher = better opportunities)
  let opportunityScore = 50; // Base score

  // Factors that increase opportunity
  if (marketPosition <= 3) opportunityScore += 20; // Top players have resources
  if (company.marketShare < 40) opportunityScore += 15; // Room to grow without antitrust
  if (marketShares.length > 5) opportunityScore += 10; // Fragmented market = opportunity

  // Factors that decrease opportunity
  if (marketPosition > 5) opportunityScore -= 20; // Weak position limits options
  if (marketShares[0].marketShare > 60) opportunityScore -= 15; // Monopoly blocks growth

  opportunityScore = Math.max(0, Math.min(100, opportunityScore));

  return {
    companyId,
    marketPosition,
    nearestCompetitors,
    competitiveAdvantages,
    vulnerabilities,
    threatLevel,
    opportunityScore,
  };
}

/**
 * Assess antitrust risk with detailed factor analysis.
 * 
 * Risk factors:
 * - Market share (40% weight)
 * - Market concentration HHI (20% weight)
 * - Duration of dominance (15% weight)
 * - Consumer harm evidence (15% weight)
 * - Political pressure (10% weight)
 * 
 * @param companyId - Company to analyze
 * @param industry - Industry type
 * @param subcategory - Optional AI subcategory
 * @returns Detailed antitrust risk assessment
 * 
 * @example
 * const risk = await assessAntitrustRisk(companyId, "Technology", "AI");
 * console.log(`Risk level: ${risk.riskLevel}`);
 * console.log(`Estimated fines: $${risk.estimatedFines.toLocaleString()}`);
 */
export async function assessAntitrustRisk(
  companyId: Types.ObjectId,
  industry: string,
  subcategory?: string
): Promise<AntitrustRisk> {
  const monopolyResult = await detectMonopoly(companyId, industry, subcategory);
  const concentration = await calculateHHI(industry, subcategory);

  const triggerFactors: AntitrustRisk['triggerFactors'] = [];
  let riskScore = 0;

  // Factor 1: Market Share (40% weight)
  const shareRisk = Math.min(monopolyResult.marketShare * 0.8, 40);
  triggerFactors.push({
    factor: 'Market Share',
    weight: 0.4,
    contribution: shareRisk,
  });
  riskScore += shareRisk;

  // Factor 2: Market Concentration (20% weight)
  const hhiRisk = Math.min((concentration.hhi / 10000) * 20, 20);
  triggerFactors.push({
    factor: 'Market Concentration (HHI)',
    weight: 0.2,
    contribution: hhiRisk,
  });
  riskScore += hhiRisk;

  // Factor 3: Duration of Dominance (15% weight) - placeholder, would need historical data
  const durationRisk = monopolyResult.marketShare > 40 ? 10 : 5;
  triggerFactors.push({
    factor: 'Duration of Dominance',
    weight: 0.15,
    contribution: durationRisk,
  });
  riskScore += durationRisk;

  // Factor 4: Consumer Harm (15% weight) - placeholder
  const consumerHarmRisk = monopolyResult.marketShare > 50 ? 12 : 6;
  triggerFactors.push({
    factor: 'Consumer Harm Evidence',
    weight: 0.15,
    contribution: consumerHarmRisk,
  });
  riskScore += consumerHarmRisk;

  // Factor 5: Political Pressure (10% weight) - placeholder
  const politicalRisk = monopolyResult.marketShare > 60 ? 8 : 4;
  triggerFactors.push({
    factor: 'Political Pressure',
    weight: 0.1,
    contribution: politicalRisk,
  });
  riskScore += politicalRisk;

  // Determine risk level
  let riskLevel: AntitrustRisk['riskLevel'];
  if (riskScore < 25) {
    riskLevel = 'Low';
  } else if (riskScore < 50) {
    riskLevel = 'Moderate';
  } else if (riskScore < 75) {
    riskLevel = 'High';
  } else {
    riskLevel = 'Severe';
  }

  // Estimate potential fines (based on revenue)
  const company = await Company.findById(companyId).select('revenue').lean();
  const revenue = company?.revenue || 0;
  const estimatedFines = Math.floor(revenue * 0.1 * (riskScore / 100)); // Up to 10% of revenue

  // Calculate probability of government action
  const probabilityOfAction = Math.min(riskScore * 1.2, 100);

  // Mitigation strategies
  const mitigationStrategies: string[] = [];
  if (riskScore > 50) {
    mitigationStrategies.push('Voluntary market share reduction through divestitures');
    mitigationStrategies.push('Open API and data portability commitments');
    mitigationStrategies.push('Aggressive political lobbying campaign');
  }
  if (riskScore > 70) {
    mitigationStrategies.push('Negotiate consent decree with regulators');
    mitigationStrategies.push('Spin off business units proactively');
  }
  mitigationStrategies.push('Document consumer benefits and innovation investments');
  mitigationStrategies.push('Avoid aggressive pricing or exclusionary practices');

  return {
    riskScore: parseFloat(riskScore.toFixed(2)),
    riskLevel,
    triggerFactors,
    mitigationStrategies,
    estimatedFines,
    probabilityOfAction: parseFloat(probabilityOfAction.toFixed(2)),
  };
}

/**
 * Calculate industry consolidation impact from potential M&A activity.
 * 
 * Uses DOJ/FTC merger guidelines:
 * - HHI increase <100: Unlikely to raise concerns
 * - HHI increase 100-200: Potential concerns if post-merger HHI >2500
 * - HHI increase >200: Likely to raise significant concerns
 * 
 * @param acquirerId - Company doing the acquiring
 * @param targetId - Company being acquired
 * @param industry - Industry type
 * @param subcategory - Optional AI subcategory
 * @returns Consolidation impact analysis
 * 
 * @example
 * const impact = await calculateConsolidationImpact(
 *   acquirerId,
 *   targetId,
 *   "Technology",
 *   "AI"
 * );
 * if (impact.antitrustConcern) {
 *   console.log(`Merger likely to be blocked: ${impact.expectedRegulatorResponse}`);
 * }
 */
export async function calculateConsolidationImpact(
  acquirerId: Types.ObjectId,
  targetId: Types.ObjectId,
  industry: string,
  subcategory?: string
): Promise<ConsolidationImpact> {
  const marketShares = await calculateMarketShare(industry, subcategory);
  const preHHI = (await calculateHHI(industry, subcategory)).hhi;

  const acquirer = marketShares.find((s) => s.companyId.equals(acquirerId));
  const target = marketShares.find((s) => s.companyId.equals(targetId));

  if (!acquirer || !target) {
    throw new Error('Acquirer or target company not found in market');
  }

  // Calculate post-merger market share
  const combinedShare = acquirer.marketShare + target.marketShare;

  // Recalculate HHI after merger (simplified: remove target, add to acquirer)
  const postMergerShares = marketShares
    .filter((s) => !s.companyId.equals(targetId))
    .map((s) => {
      if (s.companyId.equals(acquirerId)) {
        return { ...s, marketShare: combinedShare };
      }
      return s;
    });

  const postHHI = postMergerShares.reduce((sum, company) => {
    return sum + Math.pow(company.marketShare, 2);
  }, 0);

  const hhiChange = postHHI - preHHI;
  const antitrustConcern = hhiChange > HHI_MERGER_CONCERN;

  // Determine expected regulator response
  let expectedRegulatorResponse: ConsolidationImpact['expectedRegulatorResponse'];
  if (antitrustConcern && combinedShare > 60) {
    expectedRegulatorResponse = 'Block';
  } else if (antitrustConcern || combinedShare > 40) {
    expectedRegulatorResponse = 'Review';
  } else {
    expectedRegulatorResponse = 'Approve';
  }

  // Assess competitive effects
  const competitiveEffects: string[] = [];
  if (combinedShare > 50) {
    competitiveEffects.push('Market leader with significant pricing power');
    competitiveEffects.push('Reduced competition and innovation incentives');
  }
  if (hhiChange > 300) {
    competitiveEffects.push('Substantial increase in market concentration');
  }
  if (marketShares.length - 1 < 5) {
    competitiveEffects.push('Oligopoly formation with few remaining competitors');
  }

  return {
    preMergerHHI: parseFloat(preHHI.toFixed(2)),
    postMergerHHI: parseFloat(postHHI.toFixed(2)),
    hhiChange: parseFloat(hhiChange.toFixed(2)),
    antitrustConcern,
    expectedRegulatorResponse,
    marketShareCombined: parseFloat(combinedShare.toFixed(2)),
    competitiveEffects,
  };
}
