/**
 * @file src/lib/utils/manufacturing/supplierScorecard.ts
 * @description Supplier performance scorecard calculation utility
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Calculates comprehensive supplier scorecards using weighted criteria.
 * Supports multi-dimensional evaluation for supplier qualification and monitoring.
 * 
 * SCORING WEIGHTS (configurable):
 * - Quality: 30% (product quality, defect rates, certifications)
 * - Delivery: 30% (on-time delivery, lead time consistency)
 * - Cost: 20% (pricing competitiveness, total cost of ownership)
 * - Responsiveness: 10% (communication, issue resolution)
 * - Flexibility: 10% (capacity flexibility, rush order capability)
 * 
 * TIER THRESHOLDS:
 * - Preferred: 85+
 * - Standard: 60-84
 * - Probation: 40-59
 * - At Risk: <40
 */

import type { SupplierScorecardInputs, SupplierScorecardResult } from '@/types/manufacturing';

/**
 * Default scoring weights
 */
export const DEFAULT_WEIGHTS = {
  quality: 0.30,
  delivery: 0.30,
  cost: 0.20,
  responsiveness: 0.10,
  flexibility: 0.10,
} as const;

/**
 * Tier thresholds
 */
const TIER_THRESHOLDS = {
  PREFERRED: 85,
  STANDARD: 60,
  PROBATION: 40,
} as const;

/**
 * Calculate supplier scorecard
 * 
 * @param inputs - Individual score components (0-100)
 * @param weights - Optional custom weights (must sum to 1.0)
 * @returns Scorecard result with tier and recommendations
 * 
 * @example
 * const result = calculateSupplierScorecard({
 *   qualityScore: 95,
 *   deliveryScore: 88,
 *   costScore: 75,
 *   responseScore: 90,
 *   flexibilityScore: 80
 * });
 * // result.overallScore = 87.4, tier = 'Preferred'
 */
export function calculateSupplierScorecard(
  inputs: SupplierScorecardInputs,
  weights = DEFAULT_WEIGHTS
): SupplierScorecardResult {
  const { qualityScore, deliveryScore, costScore, responseScore, flexibilityScore } = inputs;

  // Validate scores are in range
  const scores = [qualityScore, deliveryScore, costScore, responseScore, flexibilityScore];
  const validScores = scores.map(s => Math.max(0, Math.min(100, s)));

  // Calculate weighted average
  const overallScore = Math.round(
    validScores[0] * weights.quality +
    validScores[1] * weights.delivery +
    validScores[2] * weights.cost +
    validScores[3] * weights.responsiveness +
    validScores[4] * weights.flexibility
  );

  // Determine tier
  const tier = determineTier(overallScore);

  // Generate recommendation
  const recommendation = generateRecommendation(overallScore, inputs);

  return {
    overallScore,
    tier,
    recommendation,
  };
}

/**
 * Determine supplier tier based on score
 */
function determineTier(score: number): SupplierScorecardResult['tier'] {
  if (score >= TIER_THRESHOLDS.PREFERRED) return 'Preferred';
  if (score >= TIER_THRESHOLDS.STANDARD) return 'Standard';
  if (score >= TIER_THRESHOLDS.PROBATION) return 'Probation';
  return 'At Risk';
}

/**
 * Generate recommendation based on scores
 */
function generateRecommendation(overall: number, inputs: SupplierScorecardInputs): string {
  const { qualityScore, deliveryScore, costScore, responseScore, flexibilityScore } = inputs;

  // Find weakest area
  const areas = [
    { name: 'quality', score: qualityScore },
    { name: 'delivery', score: deliveryScore },
    { name: 'cost', score: costScore },
    { name: 'responsiveness', score: responseScore },
    { name: 'flexibility', score: flexibilityScore },
  ];
  const weakest = areas.reduce((min, curr) => curr.score < min.score ? curr : min);

  if (overall >= 85) {
    return `Excellent performance. Consider for strategic partnership. Minor improvement possible in ${weakest.name}.`;
  } else if (overall >= 70) {
    return `Good overall performance. Focus on improving ${weakest.name} (currently ${weakest.score}%) to reach preferred status.`;
  } else if (overall >= 60) {
    return `Acceptable performance with improvement needed. Priority: ${weakest.name} (${weakest.score}%). Schedule quarterly reviews.`;
  } else if (overall >= 40) {
    return `Supplier on probation. Immediate improvement required in ${weakest.name}. Consider alternative suppliers.`;
  } else {
    return `Critical performance issues. Recommend supplier replacement. Initiate transition to alternate source.`;
  }
}

/**
 * Quality score calculation from metrics
 */
export interface QualityMetrics {
  defectRatePPM: number;         // Parts per million defects
  returnRate: number;            // Percentage of returns
  qualityIncidents: number;      // Count of quality issues
  auditScore: number;            // Last audit score (0-100)
  hasCertifications: boolean;    // Has required certifications
}

export function calculateQualityScore(metrics: QualityMetrics): number {
  let score = 100;

  // Deduct for defect rate (target: <100 PPM)
  if (metrics.defectRatePPM > 1000) score -= 30;
  else if (metrics.defectRatePPM > 500) score -= 20;
  else if (metrics.defectRatePPM > 100) score -= 10;

  // Deduct for return rate (target: <1%)
  if (metrics.returnRate > 5) score -= 25;
  else if (metrics.returnRate > 2) score -= 15;
  else if (metrics.returnRate > 1) score -= 5;

  // Deduct for quality incidents (target: 0)
  score -= Math.min(20, metrics.qualityIncidents * 5);

  // Factor in audit score
  score = (score * 0.6) + (metrics.auditScore * 0.4);

  // Bonus for certifications
  if (metrics.hasCertifications) score = Math.min(100, score + 5);

  return Math.max(0, Math.round(score));
}

/**
 * Delivery score calculation from metrics
 */
export interface DeliveryMetrics {
  onTimeRate: number;            // Percentage on-time deliveries
  averageDelayDays: number;      // Average delay when late
  leadTimeVariance: number;      // Variance in days
  perfectOrderRate: number;      // Percentage of perfect orders
}

export function calculateDeliveryScore(metrics: DeliveryMetrics): number {
  let score = 100;

  // On-time rate is primary factor (target: 95%+)
  score = metrics.onTimeRate;

  // Deduct for delays
  if (metrics.averageDelayDays > 7) score -= 20;
  else if (metrics.averageDelayDays > 3) score -= 10;
  else if (metrics.averageDelayDays > 1) score -= 5;

  // Deduct for lead time variance (target: <2 days)
  if (metrics.leadTimeVariance > 5) score -= 15;
  else if (metrics.leadTimeVariance > 3) score -= 8;
  else if (metrics.leadTimeVariance > 2) score -= 3;

  // Factor in perfect order rate
  score = (score * 0.7) + (metrics.perfectOrderRate * 0.3);

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Cost score calculation from metrics
 */
export interface CostMetrics {
  priceCompetitiveness: number;  // Comparison to market (100 = average)
  pricingStability: number;      // Volatility score (100 = stable)
  volumeDiscounts: boolean;      // Offers volume discounts
  paymentTerms: number;          // Days (higher is better for buyer)
  totalCostOfOwnership: number;  // Relative TCO (100 = baseline)
}

export function calculateCostScore(metrics: CostMetrics): number {
  let score = 0;

  // Price competitiveness (target: 90-95% of market)
  if (metrics.priceCompetitiveness < 90) score += 40;
  else if (metrics.priceCompetitiveness < 100) score += 30;
  else if (metrics.priceCompetitiveness < 110) score += 20;
  else score += 10;

  // Pricing stability (target: 90%+)
  score += (metrics.pricingStability / 100) * 25;

  // Volume discounts bonus
  if (metrics.volumeDiscounts) score += 10;

  // Payment terms (target: 60+ days)
  if (metrics.paymentTerms >= 60) score += 15;
  else if (metrics.paymentTerms >= 30) score += 10;
  else score += 5;

  // TCO factor (target: <100)
  if (metrics.totalCostOfOwnership < 90) score += 10;
  else if (metrics.totalCostOfOwnership > 110) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Risk assessment for supplier
 */
export interface RiskAssessmentResult {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: Array<{
    factor: string;
    level: 'low' | 'medium' | 'high' | 'critical';
    mitigation: string;
  }>;
}

export interface RiskFactors {
  isSingleSource: boolean;
  financialStability: number;    // 0-100
  geopoliticalRisk: number;      // 0-100
  hasDisasterRecovery: boolean;
  supplyChainTier: 1 | 2 | 3;
  hasAlternates: boolean;
}

export function assessSupplierRisk(factors: RiskFactors): RiskAssessmentResult {
  const riskFactors: RiskAssessmentResult['factors'] = [];
  let riskScore = 0;

  // Single source risk
  if (factors.isSingleSource) {
    riskFactors.push({
      factor: 'Single Source',
      level: factors.hasAlternates ? 'medium' : 'critical',
      mitigation: 'Qualify alternate suppliers to reduce dependency',
    });
    riskScore += factors.hasAlternates ? 20 : 40;
  }

  // Financial stability
  if (factors.financialStability < 50) {
    riskFactors.push({
      factor: 'Financial Instability',
      level: factors.financialStability < 30 ? 'high' : 'medium',
      mitigation: 'Require financial guarantees and monitor closely',
    });
    riskScore += 50 - factors.financialStability;
  }

  // Geopolitical risk
  if (factors.geopoliticalRisk > 50) {
    riskFactors.push({
      factor: 'Geopolitical Risk',
      level: factors.geopoliticalRisk > 75 ? 'high' : 'medium',
      mitigation: 'Diversify supply base across regions',
    });
    riskScore += (factors.geopoliticalRisk - 50) * 0.5;
  }

  // Disaster recovery
  if (!factors.hasDisasterRecovery) {
    riskFactors.push({
      factor: 'No Disaster Recovery Plan',
      level: 'medium',
      mitigation: 'Require documented business continuity plan',
    });
    riskScore += 15;
  }

  // Supply chain tier
  if (factors.supplyChainTier > 1) {
    riskFactors.push({
      factor: `Tier ${factors.supplyChainTier} Supplier`,
      level: 'low',
      mitigation: 'Maintain visibility into sub-supplier relationships',
    });
    riskScore += 5 * factors.supplyChainTier;
  }

  // Determine overall risk level
  let overallRisk: RiskAssessmentResult['overallRisk'];
  if (riskScore >= 60) overallRisk = 'critical';
  else if (riskScore >= 40) overallRisk = 'high';
  else if (riskScore >= 20) overallRisk = 'medium';
  else overallRisk = 'low';

  return {
    overallRisk,
    riskScore: Math.min(100, Math.round(riskScore)),
    factors: riskFactors,
  };
}

/**
 * Supplier development plan generator
 */
export interface DevelopmentPlan {
  supplier: string;
  currentTier: SupplierScorecardResult['tier'];
  targetTier: SupplierScorecardResult['tier'];
  timeline: string;
  initiatives: Array<{
    area: string;
    currentScore: number;
    targetScore: number;
    actions: string[];
    deadline: string;
  }>;
}

export function generateDevelopmentPlan(
  supplierName: string,
  inputs: SupplierScorecardInputs,
  result: SupplierScorecardResult
): DevelopmentPlan {
  const initiatives: DevelopmentPlan['initiatives'] = [];
  const targetTier = result.tier === 'At Risk' ? 'Probation' :
    result.tier === 'Probation' ? 'Standard' :
      result.tier === 'Standard' ? 'Preferred' : 'Preferred';

  // Identify improvement areas (score < 85)
  const areas = [
    { area: 'Quality', score: inputs.qualityScore, actions: [
      'Implement statistical process control',
      'Conduct quality training',
      'Schedule quality audit',
    ]},
    { area: 'Delivery', score: inputs.deliveryScore, actions: [
      'Implement demand planning sharing',
      'Review logistics processes',
      'Establish buffer inventory',
    ]},
    { area: 'Cost', score: inputs.costScore, actions: [
      'Negotiate volume agreements',
      'Conduct cost reduction workshop',
      'Review payment terms',
    ]},
    { area: 'Responsiveness', score: inputs.responseScore, actions: [
      'Establish dedicated account manager',
      'Define SLA for response times',
      'Implement portal for tracking',
    ]},
    { area: 'Flexibility', score: inputs.flexibilityScore, actions: [
      'Discuss capacity reservation',
      'Define rush order process',
      'Review buffer capacity options',
    ]},
  ];

  for (const area of areas) {
    if (area.score < 85) {
      initiatives.push({
        area: area.area,
        currentScore: area.score,
        targetScore: Math.min(95, area.score + 15),
        actions: area.actions.slice(0, 2),
        deadline: '90 days',
      });
    }
  }

  return {
    supplier: supplierName,
    currentTier: result.tier,
    targetTier,
    timeline: result.tier === 'At Risk' ? '180 days' : '90 days',
    initiatives: initiatives.slice(0, 3), // Top 3 priorities
  };
}

export default {
  calculateSupplierScorecard,
  calculateQualityScore,
  calculateDeliveryScore,
  calculateCostScore,
  assessSupplierRisk,
  generateDevelopmentPlan,
  DEFAULT_WEIGHTS,
};
