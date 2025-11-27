/**
 * industryDominance.ts
 * Created: 2025-11-22
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
 * 
 * @implementation FID-20251122-001 Phase 2 Extension (Utility Functions for Batch 7)
 * @legacy-source old projects/politics/src/lib/utils/ai/industryDominance.ts
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
 * Market data for competitive analysis
 */
export interface MarketData {
  companies: Array<{
    id: string;
    marketShare: number;
  }>;
  hhi?: number; // Herfindahl-Hirschman Index for market concentration
}

/**
 * Historical market trend data
 */
export interface HistoricalTrend {
  metric: string;
  value: number;
}

// ==== CONSTANTS ==== //

/** HHI thresholds for market concentration (DOJ/FTC guidelines) */
const HHI_COMPETITIVE = 1500; // Below = competitive market
const HHI_MODERATE = 2500; // 1500-2500 = moderately concentrated

/** Market share thresholds for antitrust scrutiny */
const MONOPOLY_THRESHOLD = 40; // >40% triggers investigations

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
 * @param subcategory - AI subcategory (e.g., "Artificial Intelligence", "Software", "Hardware")
 * @returns Array of market share data for each company
 * 
 * @example
 * const shares = await calculateMarketShare("Technology", "Artificial Intelligence");
 * console.log(`Market leader has ${shares[0].marketShare}% share`);
 */
export async function calculateMarketShare(
  industry: string,
  subcategory?: string
): Promise<MarketShareData[]> {
  // Build query filter
  const filter: Record<string, unknown> = { industry };
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
    company: { _id: Types.ObjectId; name: string; revenue?: number };
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

    // Get user count (simplified - using deployment count as proxy)
    const users = 0; // Placeholder - would need user tracking

    // Get deployment count
    const deployments = await AIModel.countDocuments({
      company: company._id,
      status: 'Deployed',
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
  shareData.forEach((data, index) => {
    data.marketPosition = index + 1;
  });

  return shareData;
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
 * const concentration = await calculateHHI("Technology", "Artificial Intelligence");
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

  // Determine concentration trend (simple heuristic: if top 3 have >70% share, trend is "Increasing")
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
 * const result = await detectMonopoly(companyId, "Technology", "Artificial Intelligence");
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
 * const risk = await assessAntitrustRisk(companyId, "Technology", "Artificial Intelligence");
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
 * Calculate market share percentage for a specific company.
 * 
 * @param companyId - Company identifier
 * @param totalMarketValue - Total market value
 * @param companyValue - Company value
 * @returns Market share percentage
 */
export function calculateCompanyMarketShare(
  companyId: string,
  totalMarketValue: number,
  companyValue: number
): number {
  if (totalMarketValue === 0) return 0;
  return (companyValue / totalMarketValue) * 100;
}

/**
 * Calculate Herfindahl-Hirschman Index (HHI) for market concentration.
 * 
 * @param marketShares - Array of market shares as percentages
 * @returns HHI value
 */
export function calculateMarketHHI(marketShares: number[]): number {
  return marketShares.reduce((sum, share) => sum + Math.pow(share, 2), 0);
}

/**
 * Assess market concentration level based on HHI.
 * 
 * @param hhi - Herfindahl-Hirschman Index value
 * @returns Concentration level
 */
export function assessConcentrationLevel(hhi: number): 'Unconcentrated' | 'Moderately Concentrated' | 'Highly Concentrated' {
  if (hhi < 1500) return 'Unconcentrated';
  if (hhi < 2500) return 'Moderately Concentrated';
  return 'Highly Concentrated';
}

/**
 * Predict competitive intelligence based on market data.
 * 
 * @param marketData - Current market data
 * @param historicalTrends - Historical market trends
 * @returns Competitive intelligence predictions
 */
export function predictCompetitiveIntelligence(
  marketData: MarketData,
  historicalTrends: HistoricalTrend[]
): {
  predictedMarketShares: Array<{ companyId: string; predictedShare: number }>;
  emergingThreats: string[];
  opportunities: string[];
} {
  // Simplified prediction logic
  const predictedMarketShares = marketData.companies.map(company => ({
    companyId: company.id,
    predictedShare: company.marketShare * (1 + Math.random() * 0.2 - 0.1) // ±10% variation
  }));

  const emergingThreats = [];
  const opportunities = [];

  // Analyze trends for threats and opportunities
  const growthTrends = historicalTrends.filter(t => t.metric === 'marketGrowth');
  if (growthTrends.length > 0) {
    const avgGrowth = growthTrends.reduce((sum, t) => sum + t.value, 0) / growthTrends.length;
    if (avgGrowth > 10) {
      opportunities.push('High market growth potential');
    } else if (avgGrowth < 2) {
      emergingThreats.push('Market stagnation risk');
    }
  }

  return {
    predictedMarketShares,
    emergingThreats,
    opportunities
  };
}

/**
 * Analyze regulatory risks based on market concentration.
 * 
 * @param hhi - Herfindahl-Hirschman Index
 * @param dominantPlayers - Number of dominant players
 * @returns Regulatory risk assessment
 */
export function analyzeRegulatoryRisks(
  hhi: number,
  dominantPlayers: number
): {
  antitrustRisk: number;
  regulatoryPressure: number;
  recommendedActions: string[];
} {
  let antitrustRisk = 0;
  let regulatoryPressure = 0;
  const recommendedActions = [];

  // Calculate risks based on concentration
  if (hhi > 2500) {
    antitrustRisk = 80;
    regulatoryPressure = 90;
    recommendedActions.push('Prepare for antitrust scrutiny');
    recommendedActions.push('Develop divestiture strategies');
  } else if (hhi > 1500) {
    antitrustRisk = 40;
    regulatoryPressure = 60;
    recommendedActions.push('Monitor regulatory developments');
    recommendedActions.push('Strengthen compliance programs');
  } else {
    antitrustRisk = 10;
    regulatoryPressure = 20;
    recommendedActions.push('Maintain competitive practices');
  }

  // Adjust for number of dominant players
  if (dominantPlayers <= 2) {
    antitrustRisk += 20;
    regulatoryPressure += 15;
    recommendedActions.push('Consider market diversification');
  }

  return {
    antitrustRisk: Math.min(100, antitrustRisk),
    regulatoryPressure: Math.min(100, regulatoryPressure),
    recommendedActions
  };
}

/**
 * Calculate concentration ratios for market analysis.
 * 
 * @param marketShares - Array of market shares sorted descending
 * @param n - Number of top firms to consider (default: 4)
 * @returns Concentration ratio
 */
export function calculateConcentrationRatio(
  marketShares: number[],
  n: number = 4
): number {
  const sortedShares = [...marketShares].sort((a, b) => b - a);
  const topN = sortedShares.slice(0, n);
  return topN.reduce((sum, share) => sum + share, 0);
}

/**
 * Assess market stability based on concentration metrics.
 * 
 * @param hhi - Herfindahl-Hirschman Index
 * @param concentrationRatio - Concentration ratio
 * @param numberOfPlayers - Total number of market players
 * @returns Market stability assessment
 */
export function assessMarketStability(
  hhi: number,
  concentrationRatio: number,
  numberOfPlayers: number
): {
  stabilityScore: number;
  riskFactors: string[];
  stabilityLevel: 'Stable' | 'Moderate' | 'Unstable';
} {
  let stabilityScore = 100;
  const riskFactors = [];

  // High concentration reduces stability
  if (hhi > 2500) {
    stabilityScore -= 40;
    riskFactors.push('High market concentration');
  } else if (hhi > 1500) {
    stabilityScore -= 20;
    riskFactors.push('Moderate concentration');
  }

  // Too few players increases risk
  if (numberOfPlayers < 5) {
    stabilityScore -= 25;
    riskFactors.push('Limited number of competitors');
  }

  // Very high concentration ratio indicates oligopoly
  if (concentrationRatio > 80) {
    stabilityScore -= 30;
    riskFactors.push('Oligopolistic market structure');
  }

  let stabilityLevel: 'Stable' | 'Moderate' | 'Unstable' = 'Stable';
  if (stabilityScore < 40) stabilityLevel = 'Unstable';
  else if (stabilityScore < 70) stabilityLevel = 'Moderate';

  return {
    stabilityScore: Math.max(0, stabilityScore),
    riskFactors,
    stabilityLevel
  };
}

/**
 * Generate market entry strategies for new competitors.
 * 
 * @param marketData - Current market data
 * @param entrantStrengths - Strengths of the new entrant
 * @returns Market entry strategy recommendations
 */
export function generateMarketEntryStrategies(
  marketData: MarketData,
  entrantStrengths: string[]
): Array<{
  strategy: string;
  feasibility: number;
  potentialImpact: number;
  risks: string[];
}> {
  const strategies = [];

  // Niche market entry
  strategies.push({
    strategy: 'Enter niche market segments',
    feasibility: 70,
    potentialImpact: 40,
    risks: ['Limited scalability', 'Incumbent response']
  });

  // Partnership approach
  if (entrantStrengths.includes('Technology')) {
    strategies.push({
      strategy: 'Form strategic partnerships',
      feasibility: 60,
      potentialImpact: 60,
      risks: ['Dependency on partners', 'IP sharing concerns']
    });
  }

  // Aggressive entry
  if (entrantStrengths.includes('Capital') && (marketData.hhi || 0) < 2000) {
    strategies.push({
      strategy: 'Aggressive market penetration',
      feasibility: 40,
      potentialImpact: 80,
      risks: ['High capital requirements', 'Price wars']
    });
  }

  return strategies;
}

/**
 * Monitor competitive intelligence signals.
 * 
 * @param signals - Array of competitive intelligence signals
 * @returns Analyzed signals with priorities
 */
export function monitorCompetitiveSignals(
  signals: Array<{
    type: string;
    source: string;
    content: string;
    timestamp: Date;
    severity: number;
  }>
): Array<{
  signal: any;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendedActions: string[];
}> {
  return signals.map(signal => {
    let priority: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
    
    if (signal.severity > 80) priority = 'Critical';
    else if (signal.severity > 60) priority = 'High';
    else if (signal.severity > 40) priority = 'Medium';

    const recommendedActions = [];
    
    if (priority === 'Critical') {
      recommendedActions.push('Immediate executive review');
      recommendedActions.push('Crisis management activation');
    } else if (priority === 'High') {
      recommendedActions.push('Senior management notification');
      recommendedActions.push('Strategy review meeting');
    } else if (priority === 'Medium') {
      recommendedActions.push('Department head notification');
      recommendedActions.push('Monitor closely');
    }

    return {
      signal,
      priority,
      recommendedActions
    };
  });
}
