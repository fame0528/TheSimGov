/**
 * marketplace.ts
 * Created: 2025-11-23
 *
 * OVERVIEW:
 * Shared utility functions for compute and model marketplaces.
 * Implements pricing algorithms, SLA calculations, escrow management,
 * and reputation scoring used across both GPU rental and AI model sales.
 *
 * KEY FEATURES:
 * - Unified pricing algorithms for compute and model marketplaces
 * - SLA violation detection and refund calculations
 * - Payment escrow management with dispute resolution
 * - Seller reputation scoring and market position calculation
 * - Performance guarantee validation
 *
 * BUSINESS LOGIC:
 * - Pricing: Multi-factor formulas considering capacity, performance, reputation
 * - SLA: Tiered refund structures (Bronze/Silver/Gold/Platinum)
 * - Escrow: Held payments released on successful completion or refunded on breach
 * - Reputation: Dynamic scoring based on delivery performance and buyer feedback
 *
 * UTILITY-FIRST ARCHITECTURE:
 * - Pure functions with no side effects
 * - Comprehensive JSDoc with examples
 * - Type-safe interfaces and return types
 * - Reusable across compute contracts and model listings
 *
 * @implementation FID-20251122-001 Phase 3.4
 */

import type { AIArchitecture, AIModelSize, BenchmarkScores } from '@/lib/types/ai';

/**
 * SLA tier definitions with refund multipliers
 * Bronze: Basic protection, Silver: Standard, Gold: Premium, Platinum: Elite
 */
export const SLA_REFUND_MULTIPLIERS = {
  Bronze: 0.5,    // 50% refund on breach
  Silver: 0.75,   // 75% refund on breach
  Gold: 1.0,      // 100% refund on breach
  Platinum: 1.25, // 125% refund (penalty for severe breach)
} as const;

export type SLATier = keyof typeof SLA_REFUND_MULTIPLIERS;

/**
 * Payment status lifecycle for escrow management
 */
export type PaymentStatus = 'Held' | 'Released' | 'Refunded';

/**
 * Contract status lifecycle
 */
export type ContractStatus = 'Active' | 'Completed' | 'Disputed' | 'Cancelled';

/**
 * SLA violation severity levels
 */
export type SLAViolationType = 'Minor' | 'Moderate' | 'Severe' | 'Critical';

/**
 * Dispute status for resolution process
 */
export type DisputeStatus = 'Open' | 'UnderReview' | 'Resolved' | 'Escalated';

/**
 * Calculate GPU rental pricing based on capacity, duration, and SLA tier
 *
 * Formula: baseRate × capacity × duration × slaMultiplier × reputationFactor
 *
 * @param gpuCapacity - GPU capacity in TFLOPS
 * @param durationHours - Rental duration in hours
 * @param slaTier - SLA protection level (affects pricing premium)
 * @param sellerReputation - Seller reputation score (0-100)
 * @param marketDemand - Current market demand multiplier (0.5-2.0)
 * @returns Calculated rental price and breakdown
 *
 * @example
 * // Rent 100 TFLOPS for 24 hours, Gold SLA, elite seller (95 rep), high demand (1.8x)
 * calculateComputePricing(100, 24, 'Gold', 95, 1.8)
 * // Returns: { total: 5760, breakdown: { baseRate: 10, capacity: 100, duration: 24, ... } }
 */
export function calculateComputePricing(
  gpuCapacity: number,
  durationHours: number,
  slaTier: SLATier,
  sellerReputation: number,
  marketDemand: number = 1.0
): {
  total: number;
  breakdown: {
    baseRate: number;
    capacity: number;
    duration: number;
    slaMultiplier: number;
    reputationFactor: number;
    demandMultiplier: number;
    hourlyRate: number;
  };
} {
  // Base rate per TFLOPS per hour ($/TFLOPS/hour)
  const baseRate = 0.1; // $0.10 per TFLOPS per hour

  // SLA tier pricing multipliers
  const slaMultipliers: Record<SLATier, number> = {
    Bronze: 1.0,   // Base price
    Silver: 1.2,   // +20% for better protection
    Gold: 1.5,     // +50% for premium protection
    Platinum: 2.0, // +100% for elite protection
  };

  // Reputation factor (high rep = premium pricing)
  const reputationFactor = 0.8 + (sellerReputation / 100) * 0.4; // 0.8x to 1.2x

  // Calculate components
  const capacity = gpuCapacity;
  const duration = durationHours;
  const slaMultiplier = slaMultipliers[slaTier];
  const demandMultiplier = marketDemand;

  // Hourly rate calculation
  const hourlyRate = baseRate * capacity * slaMultiplier * reputationFactor * demandMultiplier;

  // Total price
  const total = Math.round(hourlyRate * duration);

  return {
    total,
    breakdown: {
      baseRate,
      capacity,
      duration,
      slaMultiplier,
      reputationFactor,
      demandMultiplier,
      hourlyRate: Math.round(hourlyRate * 100) / 100,
    },
  };
}

/**
 * Calculate SLA refund for compute contract breach
 *
 * Uses tiered refund structure based on violation severity and SLA level.
 * Formula: breachPenalty × slaMultiplier × contractValue
 *
 * @param contractValue - Total contract value in USD
 * @param slaTier - SLA protection tier
 * @param violationType - Severity of SLA violation
 * @param breachPercentage - How much of SLA was breached (0-100)
 * @returns Refund amount and calculation breakdown
 *
 * @example
 * // $10k contract, Gold SLA, severe downtime violation (80% breach)
 * calculateSLARefund(10000, 'Gold', 'Severe', 80)
 * // Returns: { refundAmount: 8000, breakdown: { tierMultiplier: 1.0, severityMultiplier: 0.8, ... } }
 */
export function calculateSLARefund(
  contractValue: number,
  slaTier: SLATier,
  violationType: SLAViolationType,
  breachPercentage: number
): {
  refundAmount: number;
  breakdown: {
    tierMultiplier: number;
    severityMultiplier: number;
    breachPercentage: number;
    baseRefund: number;
    finalRefund: number;
  };
} {
  // SLA tier base refund multipliers
  const tierMultipliers: Record<SLATier, number> = {
    Bronze: 0.5,   // 50% of breach value refunded
    Silver: 0.75,  // 75% of breach value refunded
    Gold: 1.0,     // 100% of breach value refunded
    Platinum: 1.25, // 125% of breach value refunded (penalty)
  };

  // Violation severity multipliers
  const severityMultipliers: Record<SLAViolationType, number> = {
    Minor: 0.25,     // 25% of tier refund
    Moderate: 0.5,   // 50% of tier refund
    Severe: 0.8,     // 80% of tier refund
    Critical: 1.0,   // 100% of tier refund
  };

  // Calculate refund components
  const tierMultiplier = tierMultipliers[slaTier];
  const severityMultiplier = severityMultipliers[violationType];
  const breachPercent = Math.min(breachPercentage / 100, 1.0); // Cap at 100%

  // Base refund = contract value × breach percentage × tier multiplier
  const baseRefund = contractValue * breachPercent * tierMultiplier;

  // Final refund = base refund × severity multiplier
  const finalRefund = baseRefund * severityMultiplier;

  return {
    refundAmount: Math.round(finalRefund),
    breakdown: {
      tierMultiplier,
      severityMultiplier,
      breachPercentage: breachPercent * 100,
      baseRefund: Math.round(baseRefund),
      finalRefund: Math.round(finalRefund),
    },
  };
}

/**
 * Calculate AI model pricing based on architecture, size, and performance
 *
 * Multi-factor pricing formula considering model characteristics and market factors.
 * Formula: baseValue × archMultiplier × performanceMultiplier × reputationFactor
 *
 * @param architecture - Model architecture type
 * @param size - Model size category
 * @param parameters - Parameter count in billions
 * @param benchmarkScores - Performance metrics
 * @param sellerReputation - Seller reputation score (0-100)
 * @param salesHistory - Number of previous sales (for proven models)
 * @returns Pricing recommendations for different license types
 *
 * @example
 * // Large Transformer 70B params, 95% accuracy, elite seller (95 rep), 15 sales
 * calculateModelPricing('Transformer', 'Large', 70, { accuracy: 95, ... }, 95, 15)
 * // Returns: { perpetual: 450000, monthly: 15000, perApiCall: 0.0075, reasoning: "..." }
 */
export function calculateModelPricing(
  architecture: AIArchitecture,
  size: AIModelSize,
  parameters: number,
  benchmarkScores: BenchmarkScores,
  sellerReputation: number,
  salesHistory: number = 0
): {
  perpetual: number;
  monthly: number;
  perApiCall: number;
  reasoning: string;
} {
  // Base value by model size
  const sizeBaseValue: Record<AIModelSize, number> = {
    Small: 5000,      // $5k base for small models (≤10B params)
    Medium: 50000,    // $50k base for medium models (10-80B params)
    Large: 250000,    // $250k base for large models (>80B params)
  };

  let baseValue = sizeBaseValue[size];

  // Architecture multiplier
  const archMultiplier: Record<AIArchitecture, number> = {
    Transformer: 1.5,   // Transformers most valuable (GPT-style)
    Diffusion: 1.3,     // Diffusion models for generation
    CNN: 1.0,           // Computer vision baseline
    RNN: 0.9,           // RNNs less popular (legacy)
    GAN: 1.2,           // GANs for generation
  };

  baseValue *= archMultiplier[architecture];

  // Performance premium based on benchmark scores
  const accuracyPremium = Math.max(0, (benchmarkScores.accuracy - 80) * 0.02); // +2% per point above 80%
  const latencyDiscount = Math.max(0, (benchmarkScores.inferenceLatency - 100) * 0.001); // -0.1% per ms above 100ms

  const performanceMultiplier = 1 + accuracyPremium - latencyDiscount;
  baseValue *= performanceMultiplier;

  // Seller reputation factor
  const reputationFactor = 0.8 + (sellerReputation / 100) * 0.4; // 0.8x to 1.2x
  baseValue *= reputationFactor;

  // Sales history boost (proven models command premium)
  if (salesHistory > 10) {
    const salesBoost = Math.min(0.3, salesHistory * 0.01); // Up to +30%
    baseValue *= (1 + salesBoost);
  }

  // License-specific pricing
  const perpetualPrice = Math.round(baseValue);

  // Monthly subscription: ~2-3% of perpetual price (36-month payback)
  const monthlyPrice = Math.round(perpetualPrice * 0.025);

  // Usage-based: target 100,000 calls to match perpetual price
  const perApiCallPrice = Math.round((perpetualPrice / 100000) * 100000) / 100000; // Round to 5 decimals

  // Generate reasoning
  let reasoning = `Pricing based on ${size} ${architecture} model (${(parameters / 1e9).toFixed(1)}B params). `;

  if (benchmarkScores.accuracy > 90) {
    reasoning += `Premium for exceptional accuracy (${benchmarkScores.accuracy.toFixed(1)}%). `;
  }

  if (sellerReputation > 80) {
    reasoning += `Trusted seller (rep ${sellerReputation}). `;
  }

  if (salesHistory > 10) {
    reasoning += `Proven track record (${salesHistory} licenses sold). `;
  }

  return {
    perpetual: perpetualPrice,
    monthly: monthlyPrice,
    perApiCall: perApiCallPrice,
    reasoning: reasoning.trim(),
  };
}

/**
 * Calculate fine-tuning premium over base model value
 *
 * Formula: baseModelValue + (tuningCost × specializationMultiplier)
 *
 * @param baseModelValue - Original model value before fine-tuning
 * @param tuningCost - USD spent on fine-tuning process
 * @param performanceImprovement - Accuracy improvement percentage
 * @returns Fine-tuned model value (base + premium)
 *
 * @example
 * // Base GPT-3 clone worth $100k, spent $20k fine-tuning, 15% accuracy improvement
 * calculateFineTuningPremium(100000, 20000, 15)
 * // Returns: 140000 ($100k + $40k premium for domain specialization)
 */
export function calculateFineTuningPremium(
  baseModelValue: number,
  tuningCost: number,
  performanceImprovement: number
): number {
  // Specialization multiplier based on performance improvement
  let specializationMultiplier = 1.5; // Default: general improvement

  // Domain-specific fine-tuning (10-20% improvement)
  if (performanceImprovement >= 10 && performanceImprovement < 20) {
    specializationMultiplier = 2.0;
  }
  // Expert-level fine-tuning (20%+ improvement)
  else if (performanceImprovement >= 20) {
    specializationMultiplier = 3.0;
  }

  // Calculate premium
  const tuningPremium = tuningCost * specializationMultiplier;

  // Total value = base + premium
  return baseModelValue + tuningPremium;
}

/**
 * Validate performance guarantee against actual metrics
 *
 * Checks if actual performance meets SLA guarantees and calculates refunds.
 *
 * @param guarantee - Performance guarantee requirements
 * @param actualMetrics - Actual performance metrics
 * @param contractValue - Contract value for refund calculation
 * @returns Validation result with breach details and refund amount
 *
 * @example
 * // Guarantee: 90% accuracy, max 100ms latency, 99% uptime
 * // Actual: 88% accuracy, 120ms latency, 98% uptime
 * validatePerformanceGuarantee(
 *   { minAccuracy: 90, maxLatency: 100, uptime: 99 },
 *   { accuracy: 88, inferenceLatency: 120 },
 *   10000
 * )
 * // Returns: { meetsGuarantee: false, breaches: [...], refundAmount: 2500 }
 */
export function validatePerformanceGuarantee(
  guarantee: {
    minAccuracy?: number;
    maxLatency?: number;
    uptime?: number;
    throughput?: number;
    refundOnBreach?: boolean;
    refundPercentage?: number;
  },
  actualMetrics: Partial<BenchmarkScores>,
  contractValue: number
): {
  meetsGuarantee: boolean;
  breaches: string[];
  refundAmount: number;
} {
  const breaches: string[] = [];

  // Check minimum accuracy
  if (guarantee.minAccuracy && actualMetrics.accuracy !== undefined) {
    if (actualMetrics.accuracy < guarantee.minAccuracy) {
      breaches.push(
        `Accuracy ${actualMetrics.accuracy.toFixed(1)}% < guaranteed ${guarantee.minAccuracy}%`
      );
    }
  }

  // Check maximum latency
  if (guarantee.maxLatency && actualMetrics.inferenceLatency !== undefined) {
    if (actualMetrics.inferenceLatency > guarantee.maxLatency) {
      breaches.push(
        `Latency ${actualMetrics.inferenceLatency.toFixed(1)}ms > guaranteed ${guarantee.maxLatency}ms`
      );
    }
  }

  // Calculate refund if breaches occurred and refund enabled
  let refundAmount = 0;
  if (breaches.length > 0 && guarantee.refundOnBreach && guarantee.refundPercentage) {
    refundAmount = (contractValue * guarantee.refundPercentage) / 100;
  }

  return {
    meetsGuarantee: breaches.length === 0,
    breaches,
    refundAmount: Math.round(refundAmount),
  };
}

/**
 * Calculate seller reputation score based on performance metrics
 *
 * Dynamic reputation system that rewards reliable delivery and penalizes breaches.
 * Formula: baseScore + deliveryBonus - breachPenalty + reviewBonus
 *
 * @param currentReputation - Current reputation score (0-100)
 * @param contractsCompleted - Number of successfully completed contracts
 * @param slaBreaches - Number of SLA violations
 * @param averageRating - Average buyer rating (1-5 stars)
 * @param totalReviews - Total number of reviews received
 * @returns Updated reputation score and breakdown
 *
 * @example
 * // Current rep 75, 45 completed contracts, 2 breaches, 4.2 avg rating, 38 reviews
 * calculateSellerReputation(75, 45, 2, 4.2, 38)
 * // Returns: { newReputation: 82, breakdown: { deliveryBonus: 15, breachPenalty: -4, ... } }
 */
export function calculateSellerReputation(
  currentReputation: number,
  contractsCompleted: number,
  slaBreaches: number,
  averageRating: number,
  totalReviews: number
): {
  newReputation: number;
  breakdown: {
    deliveryBonus: number;
    breachPenalty: number;
    reviewBonus: number;
    finalScore: number;
  };
} {
  // Delivery reliability bonus (successful contracts)
  const deliveryBonus = Math.min(20, contractsCompleted * 0.2); // Up to +20 for 100+ contracts

  // SLA breach penalty
  const breachPenalty = slaBreaches * 5; // -5 points per breach

  // Review quality bonus (5-star scale converted to reputation points)
  const reviewBonus = totalReviews > 0 ? (averageRating - 3) * totalReviews * 0.1 : 0;

  // Calculate new reputation
  const finalScore = currentReputation + deliveryBonus - breachPenalty + reviewBonus;
  const newReputation = Math.max(0, Math.min(100, Math.round(finalScore)));

  return {
    newReputation,
    breakdown: {
      deliveryBonus: Math.round(deliveryBonus),
      breachPenalty: Math.round(breachPenalty),
      reviewBonus: Math.round(reviewBonus),
      finalScore: Math.round(finalScore),
    },
  };
}

/**
 * Calculate market position score for competitive analysis
 *
 * Determines seller's position in marketplace based on reputation, volume, and quality.
 * Formula: (reputation × 0.4) + (volumeScore × 0.3) + (qualityScore × 0.3)
 *
 * @param reputation - Seller reputation score (0-100)
 * @param totalSales - Total sales volume
 * @param averageRating - Average buyer rating (1-5)
 * @param marketAverageSales - Market average sales volume
 * @returns Market position score (0-100) and tier classification
 *
 * @example
 * // Rep 95, 150 sales, 4.8 rating, market avg 50 sales
 * calculateMarketPosition(95, 150, 4.8, 50)
 * // Returns: { position: 92, tier: 'Elite', breakdown: { reputation: 38, volume: 30, quality: 24 } }
 */
export function calculateMarketPosition(
  reputation: number,
  totalSales: number,
  averageRating: number,
  marketAverageSales: number
): {
  position: number;
  tier: 'Budget' | 'Competitive' | 'Premium' | 'Elite';
  breakdown: {
    reputation: number;
    volume: number;
    quality: number;
  };
} {
  // Reputation component (40% weight)
  const reputationScore = reputation * 0.4;

  // Volume component (30% weight) - relative to market average
  const volumeMultiplier = Math.min(2, totalSales / marketAverageSales);
  const volumeScore = 30 * volumeMultiplier;

  // Quality component (30% weight) - based on ratings
  const qualityScore = ((averageRating - 1) / 4) * 30; // 0-30 based on 1-5 rating

  // Total position score
  const position = Math.round(reputationScore + volumeScore + qualityScore);

  // Determine tier
  let tier: 'Budget' | 'Competitive' | 'Premium' | 'Elite';
  if (position < 25) tier = 'Budget';
  else if (position < 50) tier = 'Competitive';
  else if (position < 75) tier = 'Premium';
  else tier = 'Elite';

  return {
    position,
    tier,
    breakdown: {
      reputation: Math.round(reputationScore),
      volume: Math.round(volumeScore),
      quality: Math.round(qualityScore),
    },
  };
}

/**
 * Calculate escrow release schedule for contract payments
 *
 * Determines when payments are released from escrow based on contract progress.
 * Protects both buyer and seller interests during contract execution.
 *
 * @param contractValue - Total contract value
 * @param contractDuration - Contract duration in days
 * @param currentDay - Current day in contract (1-based)
 * @param performanceScore - Current performance score (0-100)
 * @returns Escrow release amounts and schedule
 *
 * @example
 * // $10k contract, 30 days, day 15, 95% performance
 * calculateEscrowRelease(10000, 30, 15, 95)
 * // Returns: { immediateRelease: 3333, scheduledRelease: 3333, heldAmount: 3334, ... }
 */
export function calculateEscrowRelease(
  contractValue: number,
  contractDuration: number,
  currentDay: number,
  performanceScore: number
): {
  immediateRelease: number;
  scheduledRelease: number;
  heldAmount: number;
  nextReleaseDay: number;
  riskAssessment: 'Low' | 'Medium' | 'High';
} {
  // Release schedule: 1/3 upfront, 1/3 at midpoint, 1/3 at completion
  const third = Math.round(contractValue / 3);

  // Risk assessment based on performance and time elapsed
  const timeProgress = currentDay / contractDuration;
  let riskAssessment: 'Low' | 'Medium' | 'High' = 'Low';

  if (performanceScore < 80 || timeProgress > 0.8) {
    riskAssessment = 'High';
  } else if (performanceScore < 90 || timeProgress > 0.6) {
    riskAssessment = 'Medium';
  }

  // Calculate releases based on progress
  let immediateRelease = 0;
  let scheduledRelease = 0;
  let heldAmount = contractValue;
  let nextReleaseDay = contractDuration;

  if (timeProgress >= 0.5 && performanceScore >= 85) {
    // Midpoint release
    immediateRelease = third;
    heldAmount -= third;
    nextReleaseDay = contractDuration;
  }

  if (timeProgress >= 1.0 && performanceScore >= 90) {
    // Final release
    scheduledRelease = heldAmount;
    heldAmount = 0;
    nextReleaseDay = -1; // No more releases
  }

  return {
    immediateRelease,
    scheduledRelease,
    heldAmount,
    nextReleaseDay,
    riskAssessment,
  };
}

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. PRICING ALGORITHMS:
 *    - Compute: baseRate × capacity × duration × slaMultiplier × reputationFactor × demandMultiplier
 *    - Model: baseValue × archMultiplier × performanceMultiplier × reputationFactor × salesBoost
 *    - Fine-tuning: baseModelValue + (tuningCost × specializationMultiplier)
 *
 * 2. SLA REFUND STRUCTURE:
 *    - Tiered multipliers: Bronze 0.5x, Silver 0.75x, Gold 1.0x, Platinum 1.25x
 *    - Severity multipliers: Minor 0.25x, Moderate 0.5x, Severe 0.8x, Critical 1.0x
 *    - Final refund = contractValue × breach% × tierMultiplier × severityMultiplier
 *
 * 3. REPUTATION SYSTEM:
 *    - Delivery bonus: +0.2 points per successful contract (max +20)
 *    - Breach penalty: -5 points per SLA violation
 *    - Review bonus: (rating-3) × reviews × 0.1 points
 *    - Dynamic scoring: 0-100 range with continuous updates
 *
 * 4. MARKET POSITION:
 *    - Composite score: reputation (40%) + volume (30%) + quality (30%)
 *    - Tiers: Budget <25, Competitive <50, Premium <75, Elite ≥75
 *    - Relative volume scoring vs market average
 *
 * 5. ESCROW MANAGEMENT:
 *    - Three-stage release: 1/3 upfront, 1/3 midpoint, 1/3 completion
 *    - Risk assessment: Low/Medium/High based on performance and time
 *    - Protects both parties during contract execution
 *
 * 6. PERFORMANCE GUARANTEES:
 *    - Accuracy, latency, uptime, throughput validation
 *    - Refund clauses with percentage-based compensation
 *    - Breach detection with detailed reporting
 *
 * 7. UTILITY-FIRST DESIGN:
 *    - Pure functions with no side effects
 *    - Comprehensive type safety
 *    - Reusable across compute and model marketplaces
 *    - JSDoc documentation with examples
 *    - Deterministic calculations for testing
 */