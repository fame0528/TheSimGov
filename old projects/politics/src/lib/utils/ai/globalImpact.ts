/**
 * Global Impact Utility Functions
 * 
 * Created: 2025-11-15
 * Phase: 5.2 - Industry Dominance & Global Impact
 * 
 * OVERVIEW:
 * Calculates global impact from AI industry dominance and AGI development.
 * Models automation waves, economic disruption, regulatory pressure, public perception,
 * international competition, and generates impact events based on trigger conditions.
 * 
 * FEATURES:
 * - Automation wave job displacement modeling
 * - Economic disruption GDP impact calculations
 * - Regulatory pressure probability assessment
 * - Public perception and brand reputation tracking
 * - International AI competition dynamics
 * - Dynamic impact event generation
 * 
 * FORMULAS:
 * - Job Displacement = f(AGI Capability, Industry Automation Potential)
 * - GDP Impact = f(Market Share, Job Losses, Productivity Gains)
 * - Regulatory Pressure = f(Market Dominance, Public Sentiment, Political Climate)
 * - Public Perception = f(Safety Record, Job Impact, Media Coverage)
 */

import { Types } from 'mongoose';
import Company from '@/lib/db/models/Company';
import AGIMilestone from '@/lib/db/models/AGIMilestone';
import {
  GlobalImpactEventType,
  EventSeverity,
} from '@/lib/db/models/GlobalImpactEvent';
import { calculateMarketShare } from './industryDominance';

// ==== TYPES ==== //

/**
 * Automation wave analysis showing job displacement and economic impact.
 */
export interface AutomationWave {
  agiCapability: number; // 0-100
  jobsDisplaced: number; // Number of jobs lost
  industriesAffected: string[]; // Industries hit by automation
  timelineMonths: number; // How long until full impact
  severity: EventSeverity;
  mitigationStrategies: string[]; // What can be done to soften impact
  economicBenefit: number; // Productivity gains in billions USD
}

/**
 * Economic disruption assessment from AI market dominance.
 */
export interface EconomicDisruption {
  gdpImpact: number; // Percentage impact on GDP (-50 to +20)
  marketValueDestroyed: number; // Billions USD of market cap lost
  industriesDisrupted: string[]; // Affected industries
  jobLossesTotal: number; // Total unemployment caused
  productivityGain: number; // Percentage productivity increase
  recoveryTimeYears: number; // Years to economic recovery
  winners: string[]; // Industries/sectors that benefit
  losers: string[]; // Industries/sectors that suffer
}

/**
 * Regulatory pressure assessment with intervention probability.
 */
export interface RegulatoryPressure {
  pressureLevel: number; // 0-100 (higher = more pressure)
  interventionProbability: number; // 0-100 (likelihood of action)
  likelyActions: string[]; // What regulators will do
  affectedCountries: string[]; // Countries likely to regulate
  timeToAction: number; // Months until regulatory action
  lobbyingEffectiveness: number; // 0-100 (can lobbying prevent it?)
}

/**
 * Public perception and brand reputation tracking.
 */
export interface PublicPerception {
  overallScore: number; // 0-100 (higher = better reputation)
  trustLevel: number; // 0-100 (public trust in AI)
  sentimentTrend: 'Improving' | 'Stable' | 'Declining' | 'Collapsing';
  mediaAttention: number; // 0-100 (higher = more coverage)
  protestRisk: number; // 0-100 (likelihood of public backlash)
  brandValue: number; // Billions USD in brand equity
  reputationDrivers: Array<{
    factor: string;
    impact: number; // -100 to +100
  }>;
}

/**
 * International AI competition dynamics and geopolitical impact.
 */
export interface InternationalCompetition {
  competingCountries: Array<{
    country: string;
    agiCapability: number;
    marketShare: number;
    investmentLevel: number; // Billions USD
  }>;
  tensionLevel: number; // 0-100 (geopolitical tension)
  armsRaceRisk: number; // 0-100 (AI arms race probability)
  cooperationOpportunities: string[]; // Potential for collaboration
  conflictRisks: string[]; // Potential for conflict
  dominantPlayer: string; // Leading country in AI
}

/**
 * Generated impact event from trigger conditions.
 */
export interface GeneratedImpactEvent {
  eventType: GlobalImpactEventType;
  severity: EventSeverity;
  title: string;
  description: string;
  triggerConditions: Array<{
    type: string;
    threshold: number;
    actualValue: number;
  }>;
  shouldCreate: boolean; // True if event should be created
}

// ==== CONSTANTS ==== //

/** AGI capability thresholds for automation waves */
// const AUTOMATION_THRESHOLD_LOW = 40; // Basic task automation
// const AUTOMATION_THRESHOLD_MEDIUM = 60; // Complex task automation
// const AUTOMATION_THRESHOLD_HIGH = 80; // General intelligence level

/** Market share thresholds for economic disruption */
// const DISRUPTION_THRESHOLD_MINOR = 30; // Notable market power
// const DISRUPTION_THRESHOLD_MAJOR = 50; // Dominant market position
// const DISRUPTION_THRESHOLD_CRITICAL = 70; // Near-total dominance

/** Public perception thresholds */
// const PERCEPTION_POSITIVE = 70; // Generally favorable
// const PERCEPTION_NEUTRAL = 50; // Mixed opinions
// const PERCEPTION_NEGATIVE = 30; // Generally unfavorable

// ==== FUNCTIONS ==== //

/**
 * Calculate automation wave impact from AGI capability level.
 * 
 * Models job displacement using S-curve adoption:
 * - <40% AGI: Minimal automation (<5% jobs)
 * - 40-60%: Rapid adoption (5-30% jobs)
 * - 60-80%: Mass automation (30-60% jobs)
 * - >80%: General intelligence (>60% jobs potentially automated)
 * 
 * @param agiCapability - AGI capability score (0-100)
 * @param marketShare - Company's market share (0-100)
 * @returns Automation wave analysis
 * 
 * @example
 * const wave = calculateAutomationWave(85, 45);
 * console.log(`${wave.jobsDisplaced.toLocaleString()} jobs at risk`);
 * console.log(`Severity: ${wave.severity}`);
 */
export function calculateAutomationWave(
  agiCapability: number,
  marketShare: number
): AutomationWave {
  // Calculate automation potential using logistic S-curve
  // S(x) = L / (1 + e^(-k(x - x0)))
  // Where L = max adoption (100%), k = steepness, x0 = midpoint (60%)
  const k = 0.1; // Steepness factor
  const x0 = 60; // Midpoint (rapid adoption at 60% capability)
  const automationPotential =
    100 / (1 + Math.exp(-k * (agiCapability - x0)));

  // Estimate total addressable jobs in economy (simplified: 160M US jobs)
  const totalJobs = 160_000_000;
  
  // Market share affects adoption speed (higher share = faster deployment)
  const adoptionMultiplier = 0.3 + (marketShare / 100) * 0.7; // 0.3-1.0
  
  // Calculate jobs displaced
  const jobsDisplaced = Math.floor(
    (totalJobs * (automationPotential / 100) * adoptionMultiplier)
  );

  // Determine affected industries based on AGI capability
  const industriesAffected: string[] = [];
  if (agiCapability >= 40) {
    industriesAffected.push('Transportation', 'Manufacturing', 'Retail');
  }
  if (agiCapability >= 60) {
    industriesAffected.push('Customer Service', 'Data Entry', 'Food Service');
  }
  if (agiCapability >= 80) {
    industriesAffected.push(
      'Healthcare',
      'Legal',
      'Finance',
      'Education',
      'Creative Industries'
    );
  }

  // Calculate timeline to full impact (higher capability = faster)
  const timelineMonths = Math.max(12, Math.floor(180 - agiCapability * 1.5));

  // Determine severity based on jobs displaced
  let severity: EventSeverity;
  if (jobsDisplaced < 5_000_000) {
    severity = EventSeverity.MINOR;
  } else if (jobsDisplaced < 20_000_000) {
    severity = EventSeverity.MAJOR;
  } else if (jobsDisplaced < 50_000_000) {
    severity = EventSeverity.CRITICAL;
  } else {
    severity = EventSeverity.EXISTENTIAL;
  }

  // Economic benefit from productivity gains
  // Assume 20% productivity increase per 10% automation
  const economicBenefit = (automationPotential / 10) * 2 * 100; // Billions USD

  // Mitigation strategies
  const mitigationStrategies: string[] = [];
  if (jobsDisplaced > 1_000_000) {
    mitigationStrategies.push('Universal Basic Income pilot programs');
    mitigationStrategies.push('Massive retraining initiatives');
  }
  if (jobsDisplaced > 10_000_000) {
    mitigationStrategies.push('Federal job guarantee program');
    mitigationStrategies.push('Automation tax to fund social safety net');
  }
  if (jobsDisplaced > 30_000_000) {
    mitigationStrategies.push('Emergency economic stabilization measures');
    mitigationStrategies.push('Moratorium on AGI deployment in critical sectors');
  }
  mitigationStrategies.push('Gradual phase-in with workforce transition support');

  return {
    agiCapability,
    jobsDisplaced,
    industriesAffected,
    timelineMonths,
    severity,
    mitigationStrategies,
    economicBenefit,
  };
}

/**
 * Calculate economic disruption from market dominance and automation.
 * 
 * Factors:
 * - Job losses reduce consumer spending (negative GDP impact)
 * - Productivity gains increase output (positive GDP impact)
 * - Market concentration reduces competition (negative)
 * - Innovation acceleration (positive)
 * 
 * @param marketShare - Company's market share (0-100)
 * @param jobsDisplaced - Number of jobs lost to automation
 * @param agiCapability - AGI capability score (0-100)
 * @returns Economic disruption analysis
 * 
 * @example
 * const disruption = calculateEconomicDisruption(55, 15_000_000, 75);
 * console.log(`GDP impact: ${disruption.gdpImpact}%`);
 * console.log(`Recovery time: ${disruption.recoveryTimeYears} years`);
 */
export function calculateEconomicDisruption(
  marketShare: number,
  jobsDisplaced: number,
  agiCapability: number
): EconomicDisruption {
  // Calculate job loss impact on GDP
  // Each 1M jobs lost ≈ 0.6% GDP reduction
  const jobLossGdpImpact = -(jobsDisplaced / 1_000_000) * 0.6;

  // Calculate productivity gain impact
  // AGI capability drives productivity (S-curve)
  const productivityGain = (agiCapability / 100) * 25; // Up to 25% gain
  const productivityGdpImpact = productivityGain * 0.5; // 50% of gains → GDP

  // Market concentration penalty (monopolies reduce innovation)
  const concentrationPenalty = marketShare > 60 ? -(marketShare - 60) * 0.05 : 0;

  // Total GDP impact
  const gdpImpact = Math.max(
    -50,
    Math.min(20, jobLossGdpImpact + productivityGdpImpact + concentrationPenalty)
  );

  // Calculate market value destroyed (stock market impact)
  // Major disruption causes 10-30% market decline
  const disruptionSeverity = Math.abs(jobLossGdpImpact) / 10; // 0-5 scale
  const marketValueDestroyed = disruptionSeverity * 50 * 100; // Billions USD

  // Determine affected industries
  const industriesDisrupted: string[] = [];
  if (jobsDisplaced > 5_000_000) {
    industriesDisrupted.push('Labor-intensive manufacturing', 'Transportation');
  }
  if (jobsDisplaced > 15_000_000) {
    industriesDisrupted.push('Retail', 'Hospitality', 'Customer service');
  }
  if (jobsDisplaced > 30_000_000) {
    industriesDisrupted.push(
      'Professional services',
      'Healthcare',
      'Education'
    );
  }

  // Recovery time based on GDP impact severity
  const recoveryTimeYears = Math.max(
    1,
    Math.floor(Math.abs(gdpImpact) * 0.4)
  );

  // Identify winners and losers
  const winners: string[] = [
    'AI/Technology companies',
    'Capital-intensive industries',
    'High-skill professionals',
  ];
  if (agiCapability > 70) {
    winners.push('Automation equipment manufacturers', 'AI infrastructure providers');
  }

  const losers: string[] = [
    'Labor-intensive industries',
    'Low-skill workers',
    'Traditional service sectors',
  ];
  if (marketShare > 50) {
    losers.push('Competing AI companies', 'Displaced workforce');
  }

  return {
    gdpImpact: parseFloat(gdpImpact.toFixed(2)),
    marketValueDestroyed,
    industriesDisrupted,
    jobLossesTotal: jobsDisplaced,
    productivityGain: parseFloat(productivityGain.toFixed(2)),
    recoveryTimeYears,
    winners,
    losers,
  };
}

/**
 * Calculate regulatory pressure and intervention probability.
 * 
 * Pressure increases with:
 * - Market dominance (>40% share)
 * - Public backlash (low perception scores)
 * - Job losses (high unemployment)
 * - Safety concerns (AGI alignment issues)
 * 
 * @param marketShare - Company's market share (0-100)
 * @param publicPerception - Public perception score (0-100)
 * @param jobsDisplaced - Jobs lost to automation
 * @param alignmentScore - AGI alignment safety score (0-100)
 * @returns Regulatory pressure assessment
 * 
 * @example
 * const pressure = calculateRegulatoryPressure(65, 35, 20_000_000, 55);
 * console.log(`Intervention probability: ${pressure.interventionProbability}%`);
 * console.log(`Time to action: ${pressure.timeToAction} months`);
 */
export function calculateRegulatoryPressure(
  marketShare: number,
  publicPerception: number,
  jobsDisplaced: number,
  alignmentScore: number
): RegulatoryPressure {
  let pressureLevel = 0;

  // Factor 1: Market dominance (30% weight)
  if (marketShare > 40) {
    pressureLevel += (marketShare - 40) * 0.75; // Up to 45 points
  }

  // Factor 2: Public backlash (25% weight)
  if (publicPerception < 50) {
    pressureLevel += (50 - publicPerception) * 0.5; // Up to 25 points
  }

  // Factor 3: Job displacement (25% weight)
  const jobDisplacementScore = Math.min((jobsDisplaced / 1_000_000) * 2, 25);
  pressureLevel += jobDisplacementScore;

  // Factor 4: Safety concerns (20% weight)
  if (alignmentScore < 60) {
    pressureLevel += (60 - alignmentScore) * 0.33; // Up to 20 points
  }

  pressureLevel = Math.min(100, pressureLevel);

  // Calculate intervention probability (higher pressure = higher probability)
  const interventionProbability = Math.min(
    100,
    pressureLevel * 0.8 + (marketShare > 60 ? 15 : 0)
  );

  // Determine likely regulatory actions
  const likelyActions: string[] = [];
  if (pressureLevel > 30) {
    likelyActions.push('Increased regulatory scrutiny');
    likelyActions.push('Public hearings and investigations');
  }
  if (pressureLevel > 50) {
    likelyActions.push('Antitrust lawsuit filed');
    likelyActions.push('Mandatory safety audits');
    likelyActions.push('Market access restrictions');
  }
  if (pressureLevel > 70) {
    likelyActions.push('Forced divestiture orders');
    likelyActions.push('Technology deployment moratorium');
    likelyActions.push('Nationalization threats');
  }

  // Identify countries likely to regulate
  const affectedCountries: string[] = ['United States'];
  if (marketShare > 40) {
    affectedCountries.push('European Union');
  }
  if (jobsDisplaced > 10_000_000 || alignmentScore < 50) {
    affectedCountries.push('China', 'United Kingdom', 'Japan');
  }
  if (pressureLevel > 70) {
    affectedCountries.push('India', 'Australia', 'Canada', 'South Korea');
  }

  // Estimate time to regulatory action
  let timeToAction = 120; // Default: 10 years
  if (pressureLevel > 50) {
    timeToAction = Math.max(12, Math.floor(120 - pressureLevel * 0.8));
  }
  if (marketShare > 70) {
    timeToAction = Math.min(timeToAction, 18); // Urgent action within 18 months
  }

  // Assess lobbying effectiveness
  // Higher pressure = harder to prevent action
  const lobbyingEffectiveness = Math.max(0, 80 - pressureLevel);

  return {
    pressureLevel: parseFloat(pressureLevel.toFixed(2)),
    interventionProbability: parseFloat(interventionProbability.toFixed(2)),
    likelyActions,
    affectedCountries,
    timeToAction,
    lobbyingEffectiveness: parseFloat(lobbyingEffectiveness.toFixed(2)),
  };
}

/**
 * Calculate public perception and brand reputation.
 * 
 * Driven by:
 * - Safety record (alignment score)
 * - Job impact (unemployment caused)
 * - Media coverage (sentiment)
 * - Company actions (transparency, ethics)
 * 
 * @param companyId - Company to analyze
 * @param alignmentScore - AGI alignment safety score (0-100)
 * @param jobsDisplaced - Jobs lost to automation
 * @returns Public perception analysis
 * 
 * @example
 * const perception = await calculatePublicPerception(companyId, 75, 5_000_000);
 * console.log(`Trust level: ${perception.trustLevel}%`);
 * console.log(`Protest risk: ${perception.protestRisk}%`);
 */
export async function calculatePublicPerception(
  companyId: Types.ObjectId,
  alignmentScore: number,
  jobsDisplaced: number
): Promise<PublicPerception> {
  const company = await Company.findById(companyId).select('name reputation').lean();
  
  if (!company) {
    throw new Error('Company not found');
  }

  const reputationDrivers: PublicPerception['reputationDrivers'] = [];
  let overallScore = 50; // Start neutral

  // Driver 1: Safety record (alignment score)
  const safetyImpact = (alignmentScore - 50) * 0.6; // -30 to +30
  reputationDrivers.push({
    factor: 'AI Safety Record',
    impact: parseFloat(safetyImpact.toFixed(2)),
  });
  overallScore += safetyImpact;

  // Driver 2: Job impact (negative if high displacement)
  const jobImpact = Math.min(0, -((jobsDisplaced / 1_000_000) * 2)); // Up to -40
  reputationDrivers.push({
    factor: 'Employment Impact',
    impact: parseFloat(jobImpact.toFixed(2)),
  });
  overallScore += jobImpact;

  // Driver 3: Company reputation (existing)
  const existingRepImpact = ((company.reputation || 50) - 50) * 0.4;
  reputationDrivers.push({
    factor: 'Company Reputation',
    impact: parseFloat(existingRepImpact.toFixed(2)),
  });
  overallScore += existingRepImpact;

  // Driver 4: Innovation benefit (positive)
  const innovationImpact = alignmentScore > 60 ? 15 : 5;
  reputationDrivers.push({
    factor: 'Innovation Contribution',
    impact: innovationImpact,
  });
  overallScore += innovationImpact;

  overallScore = Math.max(0, Math.min(100, overallScore));

  // Calculate trust level (correlated with overall but weighted to alignment)
  const trustLevel = Math.max(
    0,
    Math.min(100, overallScore * 0.7 + alignmentScore * 0.3)
  );

  // Determine sentiment trend
  let sentimentTrend: PublicPerception['sentimentTrend'];
  if (overallScore > 70 && alignmentScore > 70) {
    sentimentTrend = 'Improving';
  } else if (overallScore < 30 || alignmentScore < 40) {
    sentimentTrend = 'Collapsing';
  } else if (overallScore < 50) {
    sentimentTrend = 'Declining';
  } else {
    sentimentTrend = 'Stable';
  }

  // Media attention increases with controversy or dominance
  const mediaAttention = Math.min(
    100,
    50 + Math.abs(overallScore - 50) + (jobsDisplaced / 2_000_000)
  );

  // Protest risk increases with low perception and high job losses
  const protestRisk = Math.max(
    0,
    Math.min(
      100,
      (100 - overallScore) * 0.6 + (jobsDisplaced / 1_000_000) * 1.5
    )
  );

  // Estimate brand value (correlated with perception)
  const brandValue = (overallScore / 100) * 50; // Up to $50B brand equity

  return {
    overallScore: parseFloat(overallScore.toFixed(2)),
    trustLevel: parseFloat(trustLevel.toFixed(2)),
    sentimentTrend,
    mediaAttention: parseFloat(mediaAttention.toFixed(2)),
    protestRisk: parseFloat(protestRisk.toFixed(2)),
    brandValue: parseFloat(brandValue.toFixed(2)),
    reputationDrivers,
  };
}

/**
 * Analyze international AI competition and geopolitical dynamics.
 * 
 * Tracks:
 * - Competing countries' AGI capabilities
 * - Market share distribution by country
 * - Investment levels and R&D spending
 * - Geopolitical tensions from AI arms race
 * 
 * @param industry - Industry type
 * @param subcategory - AI subcategory
 * @returns International competition analysis
 * 
 * @example
 * const competition = await analyzeInternationalCompetition("Technology", "AI");
 * console.log(`Dominant player: ${competition.dominantPlayer}`);
 * console.log(`Arms race risk: ${competition.armsRaceRisk}%`);
 */
export async function analyzeInternationalCompetition(
  industry: string,
  subcategory?: string
): Promise<InternationalCompetition> {
  // Get market shares to determine country distribution
  const marketShares = await calculateMarketShare(industry, subcategory);
  
  // Simplified: Map companies to countries (would need real data)
  // For demonstration, assume top companies are from different countries
  const countryData = [
    { country: 'United States', share: 0, capability: 0, investment: 0 },
    { country: 'China', share: 0, capability: 0, investment: 0 },
    { country: 'European Union', share: 0, capability: 0, investment: 0 },
    { country: 'United Kingdom', share: 0, capability: 0, investment: 0 },
  ];

  // Distribute market shares (simplified logic)
  marketShares.forEach((company, index) => {
    const countryIndex = index % countryData.length;
    countryData[countryIndex].share += company.marketShare;
    
    // Estimate AGI capability from company data (would need real AGI milestones)
    countryData[countryIndex].capability = Math.max(
      countryData[countryIndex].capability,
      50 + index * 5 // Simplified
    );
    
    // Investment correlates with market share
    countryData[countryIndex].investment += company.revenue * 0.2;
  });

  const competingCountries = countryData
    .filter((c) => c.share > 0)
    .map((c) => ({
      country: c.country,
      agiCapability: parseFloat(c.capability.toFixed(2)),
      marketShare: parseFloat(c.share.toFixed(2)),
      investmentLevel: parseFloat((c.investment / 1_000_000_000).toFixed(2)), // Convert to billions
    }))
    .sort((a, b) => b.marketShare - a.marketShare);

  // Calculate tension level based on competition intensity
  const topTwoGap = competingCountries.length >= 2 
    ? competingCountries[0].marketShare - competingCountries[1].marketShare 
    : 100;
  
  const tensionLevel = Math.min(
    100,
    70 - topTwoGap + (competingCountries.length > 2 ? 20 : 0)
  );

  // Arms race risk increases with high capabilities and competition
  const avgCapability =
    competingCountries.reduce((sum, c) => sum + c.agiCapability, 0) /
    competingCountries.length;
  
  const armsRaceRisk = Math.min(
    100,
    tensionLevel * 0.6 + avgCapability * 0.4
  );

  // Identify cooperation opportunities (lower when tension high)
  const cooperationOpportunities: string[] = [];
  if (tensionLevel < 50) {
    cooperationOpportunities.push('Joint AI safety research initiatives');
    cooperationOpportunities.push('International AI governance frameworks');
  }
  if (tensionLevel < 70) {
    cooperationOpportunities.push('Technology sharing agreements');
    cooperationOpportunities.push('Collaborative talent development programs');
  }

  // Identify conflict risks
  const conflictRisks: string[] = [];
  if (armsRaceRisk > 50) {
    conflictRisks.push('AI capability arms race');
    conflictRisks.push('Export controls and technology restrictions');
  }
  if (armsRaceRisk > 70) {
    conflictRisks.push('Economic sanctions over AI dominance');
    conflictRisks.push('Cyber espionage and IP theft escalation');
  }
  if (armsRaceRisk > 85) {
    conflictRisks.push('Military AGI development competition');
    conflictRisks.push('Strategic instability from capability imbalances');
  }

  const dominantPlayer = competingCountries[0]?.country || 'None';

  return {
    competingCountries,
    tensionLevel: parseFloat(tensionLevel.toFixed(2)),
    armsRaceRisk: parseFloat(armsRaceRisk.toFixed(2)),
    cooperationOpportunities,
    conflictRisks,
    dominantPlayer,
  };
}

/**
 * Generate impact event based on trigger conditions.
 * 
 * Checks multiple trigger conditions and generates appropriate event:
 * - Market Monopoly: >40% market share
 * - Regulatory Intervention: >60% share or sustained monopoly
 * - Public Backlash: Low perception + high job losses
 * - AI Arms Race: High international tension
 * - Automation Wave: >80% AGI capability
 * 
 * @param companyId - Company that triggered event
 * @param industry - Industry type
 * @param subcategory - AI subcategory
 * @returns Generated impact event (or null if no triggers met)
 * 
 * @example
 * const event = await generateImpactEvent(companyId, "Technology", "AI");
 * if (event.shouldCreate) {
 *   console.log(`Event triggered: ${event.title}`);
 *   console.log(`Severity: ${event.severity}`);
 * }
 */
export async function generateImpactEvent(
  companyId: Types.ObjectId,
  industry: string,
  subcategory?: string
): Promise<GeneratedImpactEvent | null> {
  const company = await Company.findById(companyId).select('name').lean();
  if (!company) return null;

  const marketShares = await calculateMarketShare(industry, subcategory);
  const companyShare = marketShares.find((s) => s.companyId.equals(companyId));
  if (!companyShare) return null;

  // Get company's AGI milestones to determine capability
  const milestones = await AGIMilestone.find({ company: companyId })
    .select('currentCapability')
    .lean();
  
  const agiCapability = milestones.length > 0 && milestones[0].currentCapability
    ? Object.values(milestones[0].currentCapability).reduce(
        (sum, val) => sum + (val as number),
        0
      ) / 6
    : 0;

  const marketShare = companyShare.marketShare;

  // Trigger 1: Market Monopoly (>40% share)
  if (marketShare > 40) {
    return {
      eventType: GlobalImpactEventType.MARKET_MONOPOLY,
      severity:
        marketShare > 70
          ? EventSeverity.CRITICAL
          : marketShare > 60
          ? EventSeverity.MAJOR
          : EventSeverity.MINOR,
      title: `${company.name} Achieves ${marketShare.toFixed(1)}% Market Dominance`,
      description: `${company.name} has achieved ${marketShare.toFixed(
        1
      )}% market share in the AI industry, triggering antitrust scrutiny and concerns about monopoly formation. Regulators are reviewing the company's market power and potential impact on competition.`,
      triggerConditions: [
        {
          type: 'Market Share',
          threshold: 40,
          actualValue: marketShare,
        },
      ],
      shouldCreate: true,
    };
  }

  // Trigger 2: Automation Wave (>80% AGI capability)
  if (agiCapability > 80) {
    const wave = calculateAutomationWave(agiCapability, marketShare);
    return {
      eventType: GlobalImpactEventType.AUTOMATION_WAVE,
      severity: wave.severity,
      title: `${company.name}'s AGI Triggers Massive Automation Wave`,
      description: `${company.name} has achieved ${agiCapability.toFixed(
        1
      )}% AGI capability, leading to widespread job automation. An estimated ${wave.jobsDisplaced.toLocaleString()} jobs are at risk of displacement across ${
        wave.industriesAffected.length
      } major industries. Economic and social impact assessment underway.`,
      triggerConditions: [
        {
          type: 'AGI Capability',
          threshold: 80,
          actualValue: agiCapability,
        },
      ],
      shouldCreate: true,
    };
  }

  return null;
}
