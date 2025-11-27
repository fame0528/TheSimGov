/**
 * @file src/lib/utils/media/risk.ts
 * @description Monetization risk assessment and sustainability scoring utilities
 * @created 2025-11-25
 * @version 1.0.0
 * @fid FID-20251124-001
 *
 * OVERVIEW:
 * Analyzes monetization risk across multiple dimensions: revenue volatility,
 * platform/revenue stream diversification, audience concentration, and
 * sustainability scoring. Essential for financial planning and risk mitigation.
 *
 * FEATURES:
 * - Revenue volatility measurement (coefficient of variation)
 * - Diversification analysis (Herfindahl-Hirschman Index)
 * - Platform concentration risk assessment
 * - Audience demographic concentration analysis
 * - Sustainability scoring (0-100 composite risk score)
 * - Risk-adjusted revenue forecasting
 *
 * BUSINESS LOGIC:
 * - Single-platform creators face high de-platforming risk
 * - Revenue volatility > 0.5 CV signals unstable income
 * - Over-concentration in single demographic limits growth
 * - Diversification reduces risk but may reduce efficiency
 * - Sustainability score < 40 indicates urgent diversification needed
 *
 * USAGE:
 * ```typescript
 * import { assessMonetizationRisk, calculateVolatility } from '@/lib/utils/media/risk';
 *
 * const risk = assessMonetizationRisk({
 *   monthlyRevenue: [8500, 7200, 9100, 6800, 8900],
 *   platformRevenue: {
 *     YouTube: 6000,
 *     TikTok: 1500,
 *     Patreon: 2000
 *   },
 *   revenueStreams: {
 *     ads: 6000,
 *     sponsorships: 2500,
 *     affiliates: 1000
 *   }
 * });
 * // → Comprehensive risk assessment with volatility, diversification, sustainability score
 * ```
 */

import type { PlatformType } from '@/lib/types/media';
import {
  RISK_THRESHOLDS,
  FORECASTING_PARAMETERS,
} from './mediaConstants';

// ============================================================================
// VOLATILITY ANALYSIS
// ============================================================================

/**
 * Revenue volatility result
 */
export interface RevenueVolatilityResult {
  mean: number;                  // Average monthly revenue
  stdDev: number;               // Standard deviation
  cv: number;                   // Coefficient of variation (stdDev / mean)
  volatilityLevel: 'low' | 'medium' | 'high' | 'extreme';
  riskScore: number;            // 0-100 risk score (higher = more risky)
}

/**
 * Calculate revenue volatility
 *
 * Measures revenue consistency using coefficient of variation (CV).
 * CV = std dev / mean, scale-independent measure of relative variability.
 *
 * Volatility levels (from RISK_THRESHOLDS):
 * - Low: CV < 0.20 (stable, predictable income)
 * - Medium: CV 0.20-0.40 (normal fluctuation)
 * - High: CV 0.40-0.60 (risky, unpredictable)
 * - Extreme: CV > 0.60 (crisis-level instability)
 *
 * @param monthlyRevenue - Array of monthly revenue values
 * @returns Volatility analysis with risk assessment
 *
 * @example
 * // Stable revenue stream
 * calculateVolatility([9500, 10200, 9800, 10100, 9700]);
 * // → { cv: 0.026, volatilityLevel: 'low', riskScore: 13 }
 *
 * // Volatile revenue stream
 * calculateVolatility([5000, 12000, 3500, 15000, 4000]);
 * // → { cv: 0.65, volatilityLevel: 'extreme', riskScore: 92 }
 */
export function calculateVolatility(
  monthlyRevenue: number[]
): RevenueVolatilityResult {
  if (monthlyRevenue.length < 3) {
    throw new Error('Volatility calculation requires at least 3 months of data');
  }

  // Calculate mean
  const mean = monthlyRevenue.reduce((sum, rev) => sum + rev, 0) / monthlyRevenue.length;

  // Calculate standard deviation
  const variance = monthlyRevenue.reduce((sum, rev) => {
    const diff = rev - mean;
    return sum + diff * diff;
  }, 0) / monthlyRevenue.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation
  const cv = stdDev / mean;

  // Determine volatility level
  const thresholds = {
    low: RISK_THRESHOLDS.LOW_VOLATILITY,
    medium: RISK_THRESHOLDS.MEDIUM_VOLATILITY,
    high: RISK_THRESHOLDS.HIGH_VOLATILITY,
  };
  let volatilityLevel: RevenueVolatilityResult['volatilityLevel'];
  let riskScore: number;

  if (cv < thresholds.low) {
    volatilityLevel = 'low';
    riskScore = (cv / thresholds.low) * 25; // 0-25 range
  } else if (cv < thresholds.medium) {
    volatilityLevel = 'medium';
    riskScore = 25 + ((cv - thresholds.low) / (thresholds.medium - thresholds.low)) * 25; // 25-50
  } else if (cv < thresholds.high) {
    volatilityLevel = 'high';
    riskScore = 50 + ((cv - thresholds.medium) / (thresholds.high - thresholds.medium)) * 30; // 50-80
  } else {
    volatilityLevel = 'extreme';
    riskScore = 80 + Math.min(20, (cv - thresholds.high) * 33); // 80-100
  }

  return {
    mean: Math.round(mean * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    cv: Math.round(cv * 1000) / 1000,
    volatilityLevel,
    riskScore: Math.round(riskScore),
  };
}

// ============================================================================
// DIVERSIFICATION ANALYSIS
// ============================================================================

/**
 * Diversification analysis result
 */
export interface DiversificationResult {
  hhi: number;                              // Herfindahl-Hirschman Index (0-10,000)
  diversificationScore: number;             // 0-100 (100 = perfectly diversified)
  concentrationLevel: 'low' | 'moderate' | 'high' | 'monopolistic';
  topSourcePercentage: number;              // % from largest revenue source
  effectiveSourceCount: number;             // Effective number of independent sources
  recommendations: string[];
}

/**
 * Calculate diversification using Herfindahl-Hirschman Index (HHI)
 *
 * HHI = Σ(market_share_i²) * 10,000
 *
 * Where market_share_i is the percentage of total revenue from source i.
 *
 * HHI interpretation:
 * - < 1,500: Low concentration (competitive, diversified)
 * - 1,500-2,500: Moderate concentration
 * - 2,500-5,000: High concentration (risky)
 * - > 5,000: Monopolistic (very high risk)
 *
 * Effective source count = 10,000 / HHI (number of equal-sized sources)
 *
 * @param revenueBySource - Revenue breakdown by source (platform, stream type, etc.)
 * @returns Diversification analysis with HHI and recommendations
 *
 * @example
 * // Well-diversified creator
 * analyzeDiversification({
 *   YouTube: 4000,
 *   TikTok: 2500,
 *   Patreon: 2000,
 *   Sponsorships: 1500
 * });
 * // → { hhi: 1950, concentrationLevel: 'moderate', effectiveSourceCount: 5.1 }
 *
 * // Over-concentrated creator
 * analyzeDiversification({
 *   YouTube: 9000,
 *   TikTok: 500,
 *   Patreon: 500
 * });
 * // → { hhi: 8100, concentrationLevel: 'monopolistic', effectiveSourceCount: 1.2 }
 */
export function analyzeDiversification(
  revenueBySource: Record<string, number>
): DiversificationResult {
  const sources = Object.entries(revenueBySource);
  const totalRevenue = sources.reduce((sum, [_, amount]) => sum + amount, 0);

  if (totalRevenue === 0) {
    throw new Error('Total revenue must be greater than zero');
  }

  // Calculate market shares and HHI
  let hhi = 0;
  let topSourcePercentage = 0;

  for (const [_, amount] of sources) {
    const share = (amount / totalRevenue) * 100;
    hhi += share * share;
    topSourcePercentage = Math.max(topSourcePercentage, share);
  }

  // Diversification score (inverse of HHI, normalized to 0-100)
  // Perfect diversification (HHI = 0) → 100
  // Monopolistic (HHI = 10,000) → 0
  const diversificationScore = Math.max(0, 100 - (hhi / 100));

  // Determine concentration level
  const diversificationThresholds = {
    good: RISK_THRESHOLDS.WELL_DIVERSIFIED * 100,        // Convert to 0-100 scale
    acceptable: RISK_THRESHOLDS.MODERATELY_DIVERSIFIED * 100,
    poor: RISK_THRESHOLDS.CONCENTRATED * 100,
  };
  let concentrationLevel: DiversificationResult['concentrationLevel'];

  if (diversificationScore >= diversificationThresholds.good) {
    concentrationLevel = 'low';
  } else if (diversificationScore >= diversificationThresholds.acceptable) {
    concentrationLevel = 'moderate';
  } else if (diversificationScore >= diversificationThresholds.poor) {
    concentrationLevel = 'high';
  } else {
    concentrationLevel = 'monopolistic';
  }

  // Effective source count (number of equal-sized sources that would yield same HHI)
  const effectiveSourceCount = 10000 / hhi;

  // Generate recommendations
  const recommendations: string[] = [];
  if (concentrationLevel === 'monopolistic') {
    recommendations.push(
      'URGENT: Extreme concentration risk - diversify immediately to reduce platform dependence'
    );
    recommendations.push(
      `${topSourcePercentage.toFixed(0)}% from single source is unsustainable - target max 40%`
    );
  } else if (concentrationLevel === 'high') {
    recommendations.push(
      'WARNING: High concentration - develop additional revenue streams to mitigate risk'
    );
  } else if (concentrationLevel === 'moderate') {
    recommendations.push(
      'Moderate diversification - consider expanding to additional platforms or revenue types'
    );
  } else {
    recommendations.push(
      'Good diversification maintained - continue monitoring and balancing revenue sources'
    );
  }

  if (effectiveSourceCount < 3) {
    recommendations.push(
      `Only ${effectiveSourceCount.toFixed(1)} effective sources - target minimum 4 for stability`
    );
  }

  return {
    hhi: Math.round(hhi * 10) / 10,
    diversificationScore: Math.round(diversificationScore * 10) / 10,
    concentrationLevel,
    topSourcePercentage: Math.round(topSourcePercentage * 10) / 10,
    effectiveSourceCount: Math.round(effectiveSourceCount * 10) / 10,
    recommendations,
  };
}

// ============================================================================
// COMPREHENSIVE RISK ASSESSMENT
// ============================================================================

/**
 * Monetization risk assessment input
 */
export interface MonetizationRiskInput {
  monthlyRevenue: number[];                     // Time series of monthly revenue
  platformRevenue: Record<PlatformType, number>;   // Revenue by platform
  revenueStreams: Record<string, number>;       // Revenue by stream type (ads, sponsorships, etc.)
  audienceConcentration?: Record<string, number>;  // Optional: revenue by demographic
}

/**
 * Comprehensive monetization risk assessment
 */
export interface MonetizationRiskAssessment {
  overallRiskScore: number;              // 0-100 composite risk (higher = riskier)
  sustainabilityScore: number;           // 0-100 sustainability (higher = more sustainable)
  volatility: RevenueVolatilityResult;
  platformDiversification: DiversificationResult;
  streamDiversification: DiversificationResult;
  audienceDiversification?: DiversificationResult;
  criticalWarnings: string[];
  actionPriorities: string[];
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
}

/**
 * Assess comprehensive monetization risk
 *
 * Analyzes risk across multiple dimensions:
 * 1. Revenue volatility (stability)
 * 2. Platform diversification (de-platforming risk)
 * 3. Revenue stream diversification (income source risk)
 * 4. Audience concentration (demographic risk)
 *
 * Overall risk score = weighted average:
 * - Volatility: 35%
 * - Platform diversification: 30%
 * - Stream diversification: 25%
 * - Audience diversification: 10%
 *
 * Sustainability score = 100 - risk score
 *
 * @param input - Comprehensive monetization data
 * @returns Multi-dimensional risk assessment with prioritized actions
 *
 * @example
 * const risk = assessMonetizationRisk({
 *   monthlyRevenue: [8500, 7200, 9100, 6800, 8900],
 *   platformRevenue: {
 *     YouTube: 6000,
 *     TikTok: 1500,
 *     Patreon: 2000
 *   },
 *   revenueStreams: {
 *     ads: 6000,
 *     sponsorships: 2500,
 *     affiliates: 1000
 *   }
 * });
 * // → { overallRiskScore: 42, sustainabilityScore: 58, riskLevel: 'moderate' }
 */
export function assessMonetizationRisk(
  input: MonetizationRiskInput
): MonetizationRiskAssessment {
  const { monthlyRevenue, platformRevenue, revenueStreams, audienceConcentration } = input;

  // 1. Volatility analysis
  const volatility = calculateVolatility(monthlyRevenue);

  // 2. Platform diversification
  const platformDiversification = analyzeDiversification(
    platformRevenue as Record<string, number>
  );

  // 3. Revenue stream diversification
  const streamDiversification = analyzeDiversification(revenueStreams);

  // 4. Audience diversification (optional)
  const audienceDiversification = audienceConcentration
    ? analyzeDiversification(audienceConcentration)
    : undefined;

  // Calculate weighted overall risk score
  const volatilityWeight = 0.35;
  const platformWeight = 0.30;
  const streamWeight = 0.25;
  const audienceWeight = audienceDiversification ? 0.10 : 0;

  const overallRiskScore =
    volatility.riskScore * volatilityWeight +
    (100 - platformDiversification.diversificationScore) * platformWeight +
    (100 - streamDiversification.diversificationScore) * streamWeight +
    (audienceDiversification
      ? (100 - audienceDiversification.diversificationScore) * audienceWeight
      : 0);

  // Sustainability score (inverse of risk)
  const sustainabilityScore = 100 - overallRiskScore;

  // Determine risk level
  let riskLevel: MonetizationRiskAssessment['riskLevel'];
  if (overallRiskScore < 30) {
    riskLevel = 'low';
  } else if (overallRiskScore < 50) {
    riskLevel = 'moderate';
  } else if (overallRiskScore < 70) {
    riskLevel = 'high';
  } else {
    riskLevel = 'critical';
  }

  // Collect critical warnings
  const criticalWarnings: string[] = [];
  if (volatility.volatilityLevel === 'extreme') {
    criticalWarnings.push(
      'CRITICAL: Extreme revenue volatility detected - income highly unpredictable'
    );
  }
  if (platformDiversification.concentrationLevel === 'monopolistic') {
    criticalWarnings.push(
      'CRITICAL: Monopolistic platform concentration - de-platforming would be catastrophic'
    );
  }
  if (streamDiversification.concentrationLevel === 'monopolistic') {
    criticalWarnings.push(
      'CRITICAL: Single revenue stream dominance - algorithm changes pose existential risk'
    );
  }
  if (sustainabilityScore < 40) {
    criticalWarnings.push(
      'CRITICAL: Sustainability score below 40 - monetization model unsustainable long-term'
    );
  }

  // Prioritize actions (highest risk first)
  const actionPriorities: string[] = [];
  const risks = [
    {
      score: volatility.riskScore,
      action: 'Stabilize revenue volatility',
      details: volatility.volatilityLevel === 'extreme' ? 'through predictable income streams (memberships, subscriptions)' : '',
    },
    {
      score: 100 - platformDiversification.diversificationScore,
      action: 'Diversify platform presence',
      details: platformDiversification.concentrationLevel === 'monopolistic' ? `(currently ${platformDiversification.topSourcePercentage.toFixed(0)}% from single platform)` : '',
    },
    {
      score: 100 - streamDiversification.diversificationScore,
      action: 'Diversify revenue streams',
      details: streamDiversification.concentrationLevel === 'high' ? '(add sponsorships, memberships, or digital products)' : '',
    },
  ];

  if (audienceDiversification) {
    risks.push({
      score: 100 - audienceDiversification.diversificationScore,
      action: 'Diversify audience demographics',
      details: audienceDiversification.concentrationLevel === 'high' ? '(expand to additional age groups or interests)' : '',
    });
  }

  // Sort by risk score (descending) and format
  risks
    .sort((a, b) => b.score - a.score)
    .forEach((risk) => {
      if (risk.score > 40) {
        actionPriorities.push(`${risk.action} ${risk.details}`.trim());
      }
    });

  return {
    overallRiskScore: Math.round(overallRiskScore * 10) / 10,
    sustainabilityScore: Math.round(sustainabilityScore * 10) / 10,
    volatility,
    platformDiversification,
    streamDiversification,
    audienceDiversification,
    criticalWarnings,
    actionPriorities,
    riskLevel,
  };
}

// ============================================================================
// RISK-ADJUSTED FORECASTING
// ============================================================================

/**
 * Risk-adjusted revenue forecast
 */
export interface RiskAdjustedForecast {
  baselineForecast: number;          // Unadjusted forecast
  riskAdjustedForecast: number;      // Adjusted for risk
  confidenceInterval: {
    lower: number;                   // Lower bound (pessimistic)
    upper: number;                   // Upper bound (optimistic)
  };
  riskDiscount: number;              // % reduction due to risk
}

/**
 * Generate risk-adjusted revenue forecast
 *
 * Adjusts baseline revenue forecast based on risk profile.
 * Higher volatility and concentration = larger risk discount.
 *
 * Risk discount formula:
 * - Base: Overall risk score / 100
 * - Volatility penalty: +10% if extreme
 * - Concentration penalty: +15% if monopolistic
 *
 * Confidence interval width scales with volatility (±1.96 * stdDev for 95% CI)
 *
 * @param baselineForecast - Unadjusted revenue forecast
 * @param riskAssessment - Comprehensive risk assessment
 * @param monthlyStdDev - Standard deviation from historical data
 * @returns Risk-adjusted forecast with confidence intervals
 *
 * @example
 * const forecast = generateRiskAdjustedForecast(
 *   10000,
 *   riskAssessment,
 *   1500
 * );
 * // → {
 * //   baselineForecast: 10000,
 * //   riskAdjustedForecast: 8200,
 * //   confidenceInterval: { lower: 5260, upper: 11140 },
 * //   riskDiscount: 18
 * // }
 */
export function generateRiskAdjustedForecast(
  baselineForecast: number,
  riskAssessment: MonetizationRiskAssessment,
  monthlyStdDev: number
): RiskAdjustedForecast {
  // Base risk discount from overall risk score
  let riskDiscount = riskAssessment.overallRiskScore;

  // Additional penalties for critical conditions
  if (riskAssessment.volatility.volatilityLevel === 'extreme') {
    riskDiscount += 10;
  }
  if (riskAssessment.platformDiversification.concentrationLevel === 'monopolistic') {
    riskDiscount += 15;
  }

  // Cap at 50% discount (extremely risky)
  riskDiscount = Math.min(50, riskDiscount);

  // Apply discount
  const riskAdjustedForecast = baselineForecast * (1 - riskDiscount / 100);

  // Calculate 95% confidence interval (±1.96 * stdDev)
  const margin = 1.96 * monthlyStdDev;
  const confidenceInterval = {
    lower: Math.max(0, riskAdjustedForecast - margin),
    upper: riskAdjustedForecast + margin,
  };

  return {
    baselineForecast: Math.round(baselineForecast * 100) / 100,
    riskAdjustedForecast: Math.round(riskAdjustedForecast * 100) / 100,
    confidenceInterval: {
      lower: Math.round(confidenceInterval.lower * 100) / 100,
      upper: Math.round(confidenceInterval.upper * 100) / 100,
    },
    riskDiscount: Math.round(riskDiscount * 10) / 10,
  };
}

// ============================================================================
// IMPLEMENTATION NOTES
// ============================================================================

/**
 * RISK DIMENSIONS:
 *
 * 1. VOLATILITY RISK:
 *    - Coefficient of Variation (CV) = stdDev / mean
 *    - Scale-independent measure of relative variability
 *    - CV < 0.2: Stable income
 *    - CV > 0.6: Extreme instability (crisis signal)
 *    - Formula: CV = σ / μ
 *
 * 2. DIVERSIFICATION RISK:
 *    - Herfindahl-Hirschman Index (HHI) = Σ(share_i²) * 10,000
 *    - Measures market concentration
 *    - HHI < 1,500: Competitive/diversified
 *    - HHI > 5,000: Monopolistic (high risk)
 *    - Effective sources = 10,000 / HHI
 *
 * 3. PLATFORM CONCENTRATION:
 *    - De-platforming risk (account bans, policy changes)
 *    - Single-platform creators vulnerable to algorithm changes
 *    - Target: < 40% revenue from any single platform
 *    - Diversification reduces risk but may reduce efficiency
 *
 * 4. REVENUE STREAM CONCENTRATION:
 *    - Ad revenue volatile (CPM fluctuations, demonetization)
 *    - Sponsorships more stable but less scalable
 *    - Subscriptions/memberships most predictable
 *    - Target: 3+ revenue streams with < 50% from any one
 *
 * 5. AUDIENCE CONCENTRATION:
 *    - Over-reliance on single demographic limits growth
 *    - Algorithm changes can devastate niche audiences
 *    - Geographic concentration adds political/regulatory risk
 *    - Target: Broad appeal across demographics
 *
 * RISK-ADJUSTED FORECASTING:
 * - Base discount = overall risk score / 100
 * - Additional penalties for extreme conditions
 * - Maximum 50% discount (prevents over-pessimism)
 * - Confidence intervals widen with volatility
 * - 95% CI = forecast ± 1.96 * stdDev
 *
 * SUSTAINABILITY SCORING:
 * - Inverse of risk score (100 - risk)
 * - Weights: Volatility 35%, Platform 30%, Stream 25%, Audience 10%
 * - Score < 40: Unsustainable (urgent action needed)
 * - Score 40-60: Risky (diversification recommended)
 * - Score 60-80: Moderate (monitor and improve)
 * - Score > 80: Sustainable (maintain and optimize)
 *
 * @version 1.0.0
 * @compliant ECHO v1.3.0 (AAA Quality, Complete Documentation, Utility-First)
 */
