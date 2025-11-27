/**
 * @file src/lib/utils/manufacturing/supplierScorecard.ts
 * @description Supplier performance evaluation and scoring utilities
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Utilities for multi-factor supplier performance evaluation including on-time
 * delivery, quality, pricing competitiveness, responsiveness, and risk assessment.
 * Implements weighted scoring methodology to classify suppliers into performance
 * tiers and identify preferred suppliers.
 * 
 * Scoring Methodology:
 * - On-Time Delivery: 40% weight (reliability is critical)
 * - Quality Performance: 30% weight (defect-free materials)
 * - Price Competitiveness: 20% weight (cost efficiency)
 * - Responsiveness: 10% weight (communication, flexibility)
 * 
 * Performance Tiers:
 * - Excellent: 90-100 (Preferred supplier)
 * - Good: 80-89 (Approved supplier)
 * - Fair: 70-79 (Conditional approval)
 * - Poor: 0-69 (Probation or rejection)
 * 
 * USAGE:
 * ```typescript
 * import { calculateSupplierScore } from '@/lib/utils/manufacturing/supplierScorecard';
 * 
 * const score = calculateSupplierScore({
 *   onTimeDeliveryRate: 95,
 *   qualityAcceptanceRate: 98,
 *   priceCompetitiveness: 85,
 *   responsivenessScore: 90
 * });
 * console.log(score.overallScore); // 93.5 (Excellent)
 * ```
 */

/**
 * Supplier Performance Metrics
 */
export interface SupplierPerformanceMetrics {
  onTimeDeliveryRate: number; // 0-100 (% of deliveries on time)
  qualityAcceptanceRate: number; // 0-100 (% of lots accepted)
  priceCompetitiveness: number; // 0-100 (vs market average)
  responsivenessScore: number; // 0-100 (subjective rating)
}

/**
 * Supplier Scoring Weights (must sum to 100)
 */
export interface ScoringWeights {
  onTimeDelivery: number;
  quality: number;
  price: number;
  responsiveness: number;
}

/**
 * Default scoring weights (industry standard)
 */
export const DEFAULT_WEIGHTS: ScoringWeights = {
  onTimeDelivery: 40,
  quality: 30,
  price: 20,
  responsiveness: 10,
};

/**
 * Performance Tier
 */
export type PerformanceTier = 'Excellent' | 'Good' | 'Fair' | 'Poor';

/**
 * Supplier Score Result
 */
export interface SupplierScoreResult {
  overallScore: number;
  performanceTier: PerformanceTier;
  isPreferred: boolean;
  componentScores: {
    onTimeDelivery: number;
    quality: number;
    price: number;
    responsiveness: number;
  };
  recommendations: string[];
}

/**
 * Calculate Supplier Overall Score
 * 
 * Overall Score = Σ(Component Score × Weight)
 * 
 * @param metrics - Supplier performance metrics
 * @param weights - Scoring weights (optional, defaults to industry standard)
 * @returns Supplier score result
 * 
 * @example
 * ```typescript
 * const score = calculateSupplierScore({
 *   onTimeDeliveryRate: 95,
 *   qualityAcceptanceRate: 98,
 *   priceCompetitiveness: 85,
 *   responsivenessScore: 90
 * });
 * console.log(score.overallScore); // 93.5
 * console.log(score.performanceTier); // 'Excellent'
 * console.log(score.isPreferred); // true
 * ```
 */
export function calculateSupplierScore(
  metrics: SupplierPerformanceMetrics,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): SupplierScoreResult {
  // Validate metrics (0-100 range)
  const onTime = Math.max(0, Math.min(100, metrics.onTimeDeliveryRate));
  const quality = Math.max(0, Math.min(100, metrics.qualityAcceptanceRate));
  const price = Math.max(0, Math.min(100, metrics.priceCompetitiveness));
  const responsiveness = Math.max(0, Math.min(100, metrics.responsivenessScore));

  // Calculate weighted component scores
  const onTimeScore = (onTime * weights.onTimeDelivery) / 100;
  const qualityScore = (quality * weights.quality) / 100;
  const priceScore = (price * weights.price) / 100;
  const responsivenessScore = (responsiveness * weights.responsiveness) / 100;

  // Calculate overall score
  const overallScore = onTimeScore + qualityScore + priceScore + responsivenessScore;

  // Determine performance tier
  let performanceTier: PerformanceTier;
  if (overallScore >= 90) performanceTier = 'Excellent';
  else if (overallScore >= 80) performanceTier = 'Good';
  else if (overallScore >= 70) performanceTier = 'Fair';
  else performanceTier = 'Poor';

  // Preferred supplier criteria: >= 90 overall AND >= 90 in all critical metrics
  const isPreferred =
    overallScore >= 90 && onTime >= 90 && quality >= 95 && responsiveness >= 85;

  // Generate recommendations
  const recommendations: string[] = [];
  if (onTime < 90) {
    recommendations.push(
      `Improve on-time delivery (current: ${onTime.toFixed(1)}%, target: 90%+)`
    );
  }
  if (quality < 95) {
    recommendations.push(
      `Improve quality acceptance rate (current: ${quality.toFixed(1)}%, target: 95%+)`
    );
  }
  if (price < 85) {
    recommendations.push(
      `Negotiate better pricing (current: ${price.toFixed(1)}, target: 85+)`
    );
  }
  if (responsiveness < 85) {
    recommendations.push(
      `Improve responsiveness (current: ${responsiveness.toFixed(1)}, target: 85+)`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Excellent performance - maintain current standards');
  }

  return {
    overallScore: Number(overallScore.toFixed(1)),
    performanceTier,
    isPreferred,
    componentScores: {
      onTimeDelivery: Number(onTimeScore.toFixed(1)),
      quality: Number(qualityScore.toFixed(1)),
      price: Number(priceScore.toFixed(1)),
      responsiveness: Number(responsivenessScore.toFixed(1)),
    },
    recommendations,
  };
}

/**
 * Calculate On-Time Delivery Rate
 * 
 * On-Time Rate = (On-Time Deliveries / Total Deliveries) × 100
 * 
 * @param onTimeDeliveries - Number of on-time deliveries
 * @param totalDeliveries - Total number of deliveries
 * @returns On-time delivery rate (0-100)
 */
export function calculateOnTimeDeliveryRate(
  onTimeDeliveries: number,
  totalDeliveries: number
): number {
  if (totalDeliveries <= 0) return 100;

  const rate = (onTimeDeliveries / totalDeliveries) * 100;

  return Math.max(0, Math.min(100, Number(rate.toFixed(1))));
}

/**
 * Calculate Quality Acceptance Rate
 * 
 * Quality Rate = (Accepted Lots / Total Lots) × 100
 * 
 * @param acceptedLots - Number of accepted lots
 * @param totalLots - Total number of lots received
 * @returns Quality acceptance rate (0-100)
 */
export function calculateQualityAcceptanceRate(
  acceptedLots: number,
  totalLots: number
): number {
  if (totalLots <= 0) return 100;

  const rate = (acceptedLots / totalLots) * 100;

  return Math.max(0, Math.min(100, Number(rate.toFixed(1))));
}

/**
 * Calculate Price Competitiveness Score
 * 
 * Price Score = (Market Average Price / Supplier Price) × 100
 * 
 * Score > 100: Supplier cheaper than market (excellent)
 * Score = 100: Supplier at market price (good)
 * Score < 100: Supplier more expensive than market (poor)
 * 
 * @param supplierPrice - Supplier's unit price
 * @param marketAveragePrice - Market average unit price
 * @returns Price competitiveness score (0-100+)
 */
export function calculatePriceCompetitiveness(
  supplierPrice: number,
  marketAveragePrice: number
): number {
  if (supplierPrice <= 0) return 0;

  const score = (marketAveragePrice / supplierPrice) * 100;

  // Cap at 120 (20% better than market is excellent)
  return Math.min(120, Number(score.toFixed(1)));
}

/**
 * Risk Assessment
 */
export type RiskCategory = 'Financial' | 'Geopolitical' | 'Dependency' | 'Compliance';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface RiskFactor {
  category: RiskCategory;
  level: RiskLevel;
  score: number; // 0-100 (higher = higher risk)
  description: string;
}

export interface RiskAssessmentResult {
  overallRiskLevel: RiskLevel;
  overallRiskScore: number; // 0-100
  riskFactors: RiskFactor[];
  recommendations: string[];
}

/**
 * Assess Supplier Risk
 * 
 * @param riskFactors - Individual risk factors
 * @returns Overall risk assessment
 * 
 * @example
 * ```typescript
 * const risk = assessSupplierRisk([
 *   { category: 'Financial', level: 'Low', score: 20, description: 'Strong financials' },
 *   { category: 'Geopolitical', level: 'Medium', score: 50, description: 'Stable region' },
 *   { category: 'Dependency', level: 'High', score: 80, description: 'Single source' },
 *   { category: 'Compliance', level: 'Low', score: 15, description: 'ISO certified' }
 * ]);
 * console.log(risk.overallRiskLevel); // 'Medium'
 * ```
 */
export function assessSupplierRisk(riskFactors: RiskFactor[]): RiskAssessmentResult {
  // Calculate overall risk score (average)
  const totalScore = riskFactors.reduce((sum, factor) => sum + factor.score, 0);
  const overallRiskScore = riskFactors.length > 0 ? totalScore / riskFactors.length : 0;

  // Determine overall risk level
  let overallRiskLevel: RiskLevel;
  if (overallRiskScore >= 75) overallRiskLevel = 'Critical';
  else if (overallRiskScore >= 50) overallRiskLevel = 'High';
  else if (overallRiskScore >= 25) overallRiskLevel = 'Medium';
  else overallRiskLevel = 'Low';

  // Generate recommendations
  const recommendations: string[] = [];
  for (const factor of riskFactors) {
    if (factor.level === 'Critical' || factor.level === 'High') {
      switch (factor.category) {
        case 'Financial':
          recommendations.push('Require financial guarantees or secure payment terms');
          break;
        case 'Geopolitical':
          recommendations.push('Diversify sourcing to alternative regions');
          break;
        case 'Dependency':
          recommendations.push('Develop backup suppliers or dual-sourcing strategy');
          break;
        case 'Compliance':
          recommendations.push('Audit supplier compliance and require certifications');
          break;
      }
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Risk profile acceptable - continue monitoring');
  }

  return {
    overallRiskLevel,
    overallRiskScore: Number(overallRiskScore.toFixed(1)),
    riskFactors,
    recommendations,
  };
}

/**
 * Supplier Trend Analysis
 */
export type TrendDirection = 'Improving' | 'Stable' | 'Degrading';

export interface SupplierTrend {
  metric: string;
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  trendDirection: TrendDirection;
}

/**
 * Analyze Supplier Trend
 * 
 * @param metricName - Metric name
 * @param currentValue - Current period value
 * @param previousValue - Previous period value
 * @param threshold - Change % threshold for "Stable" (default: 5%)
 * @returns Supplier trend
 * 
 * @example
 * ```typescript
 * const trend = analyzeSupplierTrend('On-Time Delivery', 95, 90, 3);
 * console.log(trend.trendDirection); // 'Improving'
 * console.log(trend.changePercentage); // 5.6%
 * ```
 */
export function analyzeSupplierTrend(
  metricName: string,
  currentValue: number,
  previousValue: number,
  threshold: number = 5
): SupplierTrend {
  const changePercentage =
    previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;

  let trendDirection: TrendDirection;
  if (Math.abs(changePercentage) <= threshold) {
    trendDirection = 'Stable';
  } else if (changePercentage > 0) {
    trendDirection = 'Improving';
  } else {
    trendDirection = 'Degrading';
  }

  return {
    metric: metricName,
    currentValue,
    previousValue,
    changePercentage: Number(changePercentage.toFixed(1)),
    trendDirection,
  };
}

/**
 * Supplier Certification/Compliance Tracking
 */
export type CertificationType = 'ISO9001' | 'ISO14001' | 'ISO45001' | 'IATF16949' | 'AS9100' | 'FDA' | 'CE' | 'UL';

export interface Certification {
  type: CertificationType;
  issuedDate: Date;
  expiryDate: Date;
  isActive: boolean;
  isExpiringSoon: boolean; // Within 90 days
}

/**
 * Check Certification Status
 * 
 * @param certifications - Supplier certifications
 * @returns Active certifications and expiry warnings
 */
export function checkCertificationStatus(
  certifications: Omit<Certification, 'isActive' | 'isExpiringSoon'>[]
): Certification[] {
  const now = new Date();
  const ninetyDaysFromNow = new Date(now);
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  return certifications.map((cert) => {
    const isActive = cert.expiryDate > now;
    const isExpiringSoon = cert.expiryDate <= ninetyDaysFromNow && isActive;

    return {
      ...cert,
      isActive,
      isExpiringSoon,
    };
  });
}

/**
 * Complete Supplier Evaluation
 */
export interface SupplierEvaluation {
  score: SupplierScoreResult;
  risk: RiskAssessmentResult;
  trends: SupplierTrend[];
  certifications: Certification[];
  finalRecommendation: string;
}

/**
 * Perform Complete Supplier Evaluation
 * 
 * @param metrics - Performance metrics
 * @param riskFactors - Risk factors
 * @param trends - Performance trends
 * @param certifications - Certifications
 * @returns Complete supplier evaluation
 */
export function evaluateSupplier(
  metrics: SupplierPerformanceMetrics,
  riskFactors: RiskFactor[],
  trends: SupplierTrend[],
  certifications: Omit<Certification, 'isActive' | 'isExpiringSoon'>[]
): SupplierEvaluation {
  const score = calculateSupplierScore(metrics);
  const risk = assessSupplierRisk(riskFactors);
  const certStatus = checkCertificationStatus(certifications);

  // Final recommendation
  let finalRecommendation: string;
  if (score.isPreferred && risk.overallRiskLevel === 'Low') {
    finalRecommendation = 'Preferred Supplier - Maintain partnership';
  } else if (score.performanceTier === 'Excellent' || score.performanceTier === 'Good') {
    finalRecommendation = 'Approved Supplier - Continue business';
  } else if (score.performanceTier === 'Fair') {
    finalRecommendation = 'Conditional Approval - Performance improvement required';
  } else {
    finalRecommendation = 'Probation or Reject - Find alternative supplier';
  }

  // Check for degrading trends
  const degradingTrends = trends.filter((t) => t.trendDirection === 'Degrading');
  if (degradingTrends.length >= 2) {
    finalRecommendation += ' - WARNING: Multiple degrading trends detected';
  }

  // Check for critical risk
  if (risk.overallRiskLevel === 'Critical') {
    finalRecommendation += ' - CRITICAL RISK: Immediate mitigation required';
  }

  // Check for expiring certifications
  const expiringCerts = certStatus.filter((c) => c.isExpiringSoon);
  if (expiringCerts.length > 0) {
    finalRecommendation += ` - ${expiringCerts.length} certification(s) expiring soon`;
  }

  return {
    score,
    risk,
    trends,
    certifications: certStatus,
    finalRecommendation,
  };
}

/**
 * IMPLEMENTATION NOTES:
 * - Supplier scorecard: Multi-factor performance evaluation
 * - Weighted scoring: On-time 40%, Quality 30%, Price 20%, Responsiveness 10%
 * - Performance tiers: Excellent (90+), Good (80-89), Fair (70-79), Poor (<70)
 * - Preferred supplier: >= 90 overall, >= 90 on-time, >= 95 quality, >= 85 responsiveness
 * - Risk assessment: Financial, Geopolitical, Dependency, Compliance
 * - Risk levels: Low (0-24), Medium (25-49), High (50-74), Critical (75-100)
 * - Trend analysis: Improving, Stable, Degrading (±5% threshold)
 * - Certifications: ISO 9001 (quality), ISO 14001 (environment), ISO 45001 (safety)
 * - Dual-sourcing: Mitigate dependency risk (backup suppliers)
 * - Supplier development: Work with suppliers to improve performance
 * - Supplier audit: On-site verification of capabilities and compliance
 * - Vendor Managed Inventory (VMI): Supplier manages customer inventory
 * - Consignment: Supplier owns inventory until used
 * - Early payment discounts: 2/10 Net 30 (2% discount if paid within 10 days)
 * - Total Cost of Ownership (TCO): Price + Quality costs + Delivery costs + Risk costs
 */
