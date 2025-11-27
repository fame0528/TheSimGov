/**
 * globalImpact.ts
 * Created: 2025-11-22
 * 
 * OVERVIEW:
 * Calculates global impact from AI industry dominance and AGI development.
 * Models international competition dynamics and geopolitical analysis for the AI race.
 * 
 * FEATURES:
 * - International AI competition dynamics
 * - Country-level market share aggregation
 * - Geopolitical tension calculation
 * - AI arms race risk assessment
 * - Cooperation vs conflict analysis
 * 
 * @implementation FID-20251122-001 Phase 2 Extension (Utility Functions for Batch 7)
 * @legacy-source old projects/politics/src/lib/utils/ai/globalImpact.ts
 */

import { calculateMarketShare } from './industryDominance';

// ==== TYPES ==== //

/**
 * Country competition data in AI race
 */
export interface CountryCompetitionData {
  country: string;
  agiCapability: number; // 0-100
  marketShare: number; // Percentage (0-100)
  investmentLevel: number; // Billions USD
  topCompanies?: Array<{
    companyId: string;
    name: string;
    marketShare: number;
  }>;
}

/**
 * International AI competition dynamics and geopolitical impact.
 */
export interface InternationalCompetition {
  competingCountries: CountryCompetitionData[];
  tensionLevel: number; // 0-100 (geopolitical tension)
  armsRaceRisk: number; // 0-100 (AI arms race probability)
  cooperationOpportunities: string[]; // Potential for collaboration
  conflictRisks: string[]; // Potential for conflict
  dominantPlayer: string; // Leading country in AI
}

// ==== FUNCTIONS ==== //

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
 * const competition = await analyzeInternationalCompetition("Technology", "Artificial Intelligence");
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
    
    // Estimate AGI capability from company data (simplified)
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
    (competingCountries.length || 1);
  
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
 * Calculate event severity based on trigger conditions and market impact.
 * 
 * @param marketShareThreshold - Market share threshold that triggered event
 * @param agiCapabilityThreshold - AGI capability threshold
 * @param companyMarketShare - Actual company market share
 * @param companyAgiCapability - Actual company AGI capability
 * @returns Event severity level
 */
export function calculateEventSeverity(
  marketShareThreshold: number,
  agiCapabilityThreshold: number,
  companyMarketShare: number,
  companyAgiCapability: number
): 'Minor' | 'Major' | 'Critical' | 'Existential' {
  const marketShareViolation = Math.max(0, companyMarketShare - marketShareThreshold);
  const agiViolation = Math.max(0, companyAgiCapability - agiCapabilityThreshold);
  
  const totalViolation = marketShareViolation * 0.6 + agiViolation * 0.4;
  
  if (totalViolation < 10) return 'Minor';
  if (totalViolation < 25) return 'Major';
  if (totalViolation < 40) return 'Critical';
  return 'Existential';
}

/**
 * Predict economic, political, and social consequences of global impact events.
 * 
 * @param eventType - Type of global impact event
 * @param severity - Event severity level
 * @param companyMarketShare - Company's market share
 * @returns Predicted consequences
 */
export function predictEventConsequences(
  eventType: string,
  severity: string,
  companyMarketShare: number
): {
  economic: { marketCapImpact: number; industryGDPImpact: number };
  political: { regulatoryPressure: number; internationalTension: number };
  social: { publicTrustChange: number; protestActivity: number };
} {
  const severityMultiplier = {
    'Minor': 0.3,
    'Major': 0.6,
    'Critical': 1.0,
    'Existential': 1.5
  }[severity] || 0.3;

  const marketShareMultiplier = Math.min(1.5, companyMarketShare / 30);

  const baseEconomic = {
    marketCapImpact: -5 * severityMultiplier * marketShareMultiplier,
    industryGDPImpact: -2 * severityMultiplier
  };

  const basePolitical = {
    regulatoryPressure: 20 * severityMultiplier,
    internationalTension: 15 * severityMultiplier
  };

  const baseSocial = {
    publicTrustChange: -10 * severityMultiplier,
    protestActivity: 25 * severityMultiplier
  };

  return {
    economic: baseEconomic,
    political: basePolitical,
    social: baseSocial
  };
}

/**
 * Generate mitigation strategies for global impact events.
 * 
 * @param eventType - Type of event
 * @param severity - Event severity
 * @param availableResources - Company resources available
 * @returns Array of mitigation strategies
 */
export function generateMitigationStrategies(
  eventType: string,
  severity: string,
  availableResources: { budget: number; lobbyingPower: number; prTeam: boolean }
): Array<{
  strategy: string;
  effectiveness: number;
  cost: number;
  timeToImplement: number;
}> {
  const strategies = [];

  // Always include basic PR strategy
  strategies.push({
    strategy: 'Enhanced public relations campaign',
    effectiveness: 30,
    cost: 5_000_000,
    timeToImplement: 2
  });

  // Add regulatory strategies if resources allow
  if (availableResources.lobbyingPower > 50) {
    strategies.push({
      strategy: 'Intensified regulatory lobbying',
      effectiveness: 45,
      cost: 10_000_000,
      timeToImplement: 6
    });
  }

  // Add international strategies for high-severity events
  if (severity === 'Critical' || severity === 'Existential') {
    strategies.push({
      strategy: 'International diplomatic engagement',
      effectiveness: 35,
      cost: 15_000_000,
      timeToImplement: 12
    });
  }

  // Add technology sharing if budget allows
  if (availableResources.budget > 50_000_000) {
    strategies.push({
      strategy: 'Technology sharing initiatives',
      effectiveness: 50,
      cost: 25_000_000,
      timeToImplement: 18
    });
  }

  return strategies;
}

/**
 * Assess whether trigger conditions are met for global impact events.
 * 
 * @param companyMarketShare - Current company market share
 * @param companyAgiCapability - Current AGI capability
 * @param marketShareThreshold - Threshold for triggering
 * @param agiCapabilityThreshold - AGI threshold
 * @returns Assessment result
 */
export function assessTriggerConditions(
  companyMarketShare: number,
  companyAgiCapability: number,
  marketShareThreshold: number,
  agiCapabilityThreshold: number
): {
  triggered: boolean;
  marketShareViolation: number;
  agiViolation: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
} {
  const marketShareViolation = Math.max(0, companyMarketShare - marketShareThreshold);
  const agiViolation = Math.max(0, companyAgiCapability - agiCapabilityThreshold);
  
  const triggered = marketShareViolation > 0 || agiViolation > 0;
  
  let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  const totalViolation = marketShareViolation + agiViolation;
  
  if (totalViolation > 50) riskLevel = 'Critical';
  else if (totalViolation > 30) riskLevel = 'High';
  else if (totalViolation > 15) riskLevel = 'Medium';
  
  return {
    triggered,
    marketShareViolation,
    agiViolation,
    riskLevel
  };
}

/**
 * Analyze country capabilities for AI competition.
 * 
 * @param countries - Array of countries to analyze
 * @returns Country capability analysis
 */
export function analyzeCountryCapabilities(
  countries: string[]
): Array<{
  country: string;
  agiCapability: number;
  marketShare: number;
  investmentLevel: number;
  competitiveAdvantage: string[];
}> {
  // Simplified implementation - would need real data
  return countries.map(country => ({
    country,
    agiCapability: Math.random() * 100,
    marketShare: Math.random() * 50,
    investmentLevel: Math.random() * 50,
    competitiveAdvantage: ['Research institutions', 'Talent pool']
  }));
}

/**
 * Assess bilateral relations between countries.
 * 
 * @param countryA - First country
 * @param countryB - Second country
 * @returns Bilateral relation assessment
 */
export function assessBilateralRelations(
  countryA: string,
  countryB: string
): {
  tensionLevel: number;
  cooperationLevel: number;
  tradeRestrictions: string[];
  diplomaticStatus: string;
} {
  // Simplified implementation
  return {
    tensionLevel: Math.random() * 100,
    cooperationLevel: Math.random() * 100,
    tradeRestrictions: [],
    diplomaticStatus: 'Neutral'
  };
}

/**
 * Simulate trade war impacts.
 * 
 * @param initiator - Country initiating trade war
 * @param target - Target country
 * @param duration - Duration in months
 * @returns Trade war simulation results
 */
export function simulateTradeWars(
  initiator: string,
  target: string,
  duration: number
): {
  economicImpact: number;
  duration: number;
  escalationRisk: number;
} {
  return {
    economicImpact: Math.random() * 100,
    duration,
    escalationRisk: Math.random() * 100
  };
}

/**
 * Calculate global tension index.
 * 
 * @param bilateralRelations - Array of bilateral relations
 * @returns Global tension index
 */
export function calculateGlobalTensionIndex(
  bilateralRelations: Array<{ tensionLevel: number }>
): number {
  if (bilateralRelations.length === 0) return 0;
  
  const totalTension = bilateralRelations.reduce((sum, rel) => sum + rel.tensionLevel, 0);
  return totalTension / bilateralRelations.length;
}

/**
 * Generate strategic recommendations for international AI competition.
 * 
 * @param country - Country to generate recommendations for
 * @param competitionData - Current competition data
 * @returns Strategic recommendations
 */
export function generateStrategicRecommendations(
  country: string,
  competitionData: InternationalCompetition
): string[] {
  const recommendations = [];
  
  if (competitionData.tensionLevel > 70) {
    recommendations.push('Increase diplomatic engagement to reduce tension');
  }
  
  if (competitionData.armsRaceRisk > 60) {
    recommendations.push('Focus on defensive AI capabilities');
  }
  
  if (competitionData.cooperationOpportunities.length > 0) {
    recommendations.push('Pursue international collaboration opportunities');
  }
  
  return recommendations;
}
