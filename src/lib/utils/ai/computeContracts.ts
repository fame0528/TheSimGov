/**
 * computeContracts.ts
 * Created: 2025-11-22
 * 
 * OVERVIEW:
 * Utility functions for GPU rental contract management, SLA compliance tracking,
 * refund calculations, and performance monitoring. Extracted from legacy
 * ComputeContract model to enforce utility-first architecture.
 * 
 * KEY FEATURES:
 * - Tier-based SLA refund calculations (Bronze through Platinum)
 * - Downtime and latency performance tracking
 * - Automatic refund computation based on uptime guarantees
 * - Contract completion with payment reconciliation
 * - Dispute initiation and payment release logic
 * 
 * BUSINESS LOGIC:
 * - Higher SLA tiers have stricter refund penalties
 * - Downtime impacts refunds more heavily than latency breaches
 * - Payment escrow ensures buyer protection
 * - All payment math validated (held = released + refunded)
 * 
 * @implementation FID-20251122-001 Phase 2 (Utility Functions)
 * @legacy-source old projects/politics/src/lib/db/models/ComputeContract.ts
 */

/**
 * Contract status lifecycle
 */
export type ContractStatus = 
  | 'Pending'       // Payment held, not started
  | 'Active'        // Currently running
  | 'Completed'     // Successfully finished
  | 'Cancelled'     // Cancelled before start
  | 'Disputed'      // Under dispute resolution
  | 'Refunded';     // Refunded due to SLA breach

/**
 * SLA tier with corresponding uptime guarantees
 */
export type SLATier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

/**
 * SLA violation tracking
 */
export interface SLAViolation {
  timestamp: Date;
  type: 'Downtime' | 'LatencyBreach' | 'SupportDelay';
  duration: number;            // Minutes of violation
  impactPercent: number;       // % of contract affected
  refundDue: number;           // USD refund amount
  resolved: boolean;
  resolvedAt?: Date;
}

/**
 * Performance metrics for contract
 */
export interface PerformanceMetrics {
  actualUptime: number;        // % uptime delivered
  averageLatency: number;      // Average latency in ms
  peakLatency: number;         // Worst latency observed
  downtimeMinutes: number;     // Total downtime
  slaViolations: SLAViolation[];
}

/**
 * Contract payment details
 */
export interface ContractPayment {
  totalCost: number;           // Total contract value
  paymentHeld: number;         // Escrow amount
  paymentReleased: number;     // Amount released to seller
  refundIssued: number;        // Amount refunded to buyer
}

/**
 * Contract terms for SLA calculations
 */
export interface ContractTerms {
  slaTier: SLATier;
  uptimeGuarantee: number;     // % uptime guaranteed (90-100%)
  maxLatency: number;          // Max latency in ms
  durationHours: number;       // Contract length
  totalCost: number;           // Contract value in USD
}

/**
 * Calculate refund amount based on SLA violations
 * 
 * @description Computes total refund due based on SLA tier and actual uptime.
 * Higher tiers have exponentially stricter penalties for downtime.
 * 
 * Refund formula by tier:
 * - Bronze: 10% refund per 1% uptime below guarantee (forgiving)
 * - Silver: 20% refund per 1% uptime below guarantee
 * - Gold: 50% refund per 1% uptime below guarantee (strict)
 * - Platinum: 100% refund per 1% uptime below guarantee (full refund at 1% breach)
 * 
 * @param actualUptime - Actual uptime percentage delivered (0-100)
 * @param uptimeGuarantee - Guaranteed uptime percentage (90-100)
 * @param slaTier - SLA tier determining refund multiplier
 * @param totalCost - Total contract value in USD
 * @returns Total USD refund due to buyer, rounded to cents
 * 
 * @example
 * // Gold tier contract with 95% guarantee, delivered 92% uptime
 * const refund = calculateRefundForSLA(92, 95, 'Gold', 10000);
 * // 3% breach × 50% multiplier = 150% refund cap at 100%
 * // Result: $10,000 (full refund for Gold tier)
 * 
 * @example
 * // Bronze tier contract with 99% guarantee, delivered 98% uptime
 * const refund = calculateRefundForSLA(98, 99, 'Bronze', 5000);
 * // 1% breach × 10% multiplier = 10% refund
 * // Result: $500
 */
export function calculateRefundForSLA(
  actualUptime: number,
  uptimeGuarantee: number,
  slaTier: SLATier,
  totalCost: number
): number {
  // No breach = no refund
  const uptimeBreach = uptimeGuarantee - actualUptime;
  if (uptimeBreach <= 0) return 0;
  
  // Refund multipliers by SLA tier
  const REFUND_MULTIPLIERS: Record<SLATier, number> = {
    Bronze: 0.10,    // 10% per 1% breach (forgiving)
    Silver: 0.20,    // 20% per 1% breach
    Gold: 0.50,      // 50% per 1% breach (strict)
    Platinum: 1.00,  // 100% per 1% breach (full refund at 1% breach)
  };
  
  const multiplier = REFUND_MULTIPLIERS[slaTier];
  const refundPercent = Math.min(100, uptimeBreach * multiplier);
  const refundAmount = (totalCost * refundPercent) / 100;
  
  return Math.round(refundAmount * 100) / 100; // Round to cents
}

/**
 * Calculate updated performance metrics after downtime incident
 * 
 * @description Records downtime, recalculates uptime percentage, creates SLA
 * violation record with impact and refund calculations.
 * 
 * @param currentMetrics - Current performance metrics
 * @param downtimeMinutes - Duration of downtime incident
 * @param contractTerms - Contract SLA terms and duration
 * @returns Updated performance metrics with new violation record
 * 
 * @example
 * const metrics = {
 *   actualUptime: 100,
 *   averageLatency: 5,
 *   peakLatency: 10,
 *   downtimeMinutes: 0,
 *   slaViolations: []
 * };
 * const updated = recordDowntime(metrics, 30, {
 *   slaTier: 'Gold',
 *   uptimeGuarantee: 99.9,
 *   maxLatency: 50,
 *   durationHours: 720, // 30 days
 *   totalCost: 50000
 * });
 * // 30 minutes downtime out of 43,200 total minutes
 * // actualUptime: 99.93%
 * // impactPercent: 0.07%
 * // refundDue: Calculated based on Gold tier
 */
export function recordDowntime(
  currentMetrics: PerformanceMetrics,
  downtimeMinutes: number,
  contractTerms: ContractTerms
): PerformanceMetrics {
  // Update downtime tracking
  const newDowntimeTotal = currentMetrics.downtimeMinutes + downtimeMinutes;
  
  // Recalculate uptime percentage
  const totalMinutes = contractTerms.durationHours * 60;
  const uptimeMinutes = totalMinutes - newDowntimeTotal;
  const newActualUptime = (uptimeMinutes / totalMinutes) * 100;
  
  // Calculate impact percentage
  const impactPercent = (downtimeMinutes / totalMinutes) * 100;
  
  // Calculate refund due for this violation
  const refundDue = calculateRefundForSLA(
    newActualUptime,
    contractTerms.uptimeGuarantee,
    contractTerms.slaTier,
    contractTerms.totalCost
  );
  
  // Create SLA violation record
  const violation: SLAViolation = {
    timestamp: new Date(),
    type: 'Downtime',
    duration: downtimeMinutes,
    impactPercent,
    refundDue,
    resolved: false,
  };
  
  // Return updated metrics
  return {
    ...currentMetrics,
    actualUptime: newActualUptime,
    downtimeMinutes: newDowntimeTotal,
    slaViolations: [...currentMetrics.slaViolations, violation],
  };
}

/**
 * Calculate updated performance metrics after latency SLA breach
 * 
 * @description Records latency breach, updates peak/average latency tracking,
 * creates SLA violation with reduced impact (50% weight vs downtime).
 * 
 * @param currentMetrics - Current performance metrics
 * @param latencyMs - Observed latency in milliseconds
 * @param durationMinutes - Duration of latency breach
 * @param contractTerms - Contract SLA terms
 * @returns Updated performance metrics with latency violation
 * 
 * @example
 * const updated = recordLatencyBreach(metrics, 150, 15, {
 *   slaTier: 'Platinum',
 *   uptimeGuarantee: 99.99,
 *   maxLatency: 50,
 *   durationHours: 168, // 1 week
 *   totalCost: 25000
 * });
 * // 150ms latency (exceeds 50ms max) for 15 minutes
 * // Impact weighted at 50% vs downtime
 * // peakLatency updated to 150ms
 */
export function recordLatencyBreach(
  currentMetrics: PerformanceMetrics,
  latencyMs: number,
  durationMinutes: number,
  contractTerms: ContractTerms
): PerformanceMetrics {
  // Update peak latency if this is worst observed
  const newPeakLatency = Math.max(currentMetrics.peakLatency, latencyMs);
  
  // Update average latency (weighted average)
  const currentAvg = currentMetrics.averageLatency;
  const newAverageLatency = currentAvg === 0 
    ? latencyMs 
    : (currentAvg + latencyMs) / 2;
  
  // Calculate impact (50% weight vs downtime for latency breaches)
  const totalMinutes = contractTerms.durationHours * 60;
  const impactPercent = (durationMinutes / totalMinutes) * 100 * 0.5;
  
  // Calculate refund (proportional to impact)
  const refundDue = (contractTerms.totalCost * impactPercent) / 100;
  
  // Create SLA violation record
  const violation: SLAViolation = {
    timestamp: new Date(),
    type: 'LatencyBreach',
    duration: durationMinutes,
    impactPercent,
    refundDue,
    resolved: false,
  };
  
  // Return updated metrics
  return {
    ...currentMetrics,
    averageLatency: newAverageLatency,
    peakLatency: newPeakLatency,
    slaViolations: [...currentMetrics.slaViolations, violation],
  };
}

/**
 * Calculate final payment distribution on contract completion
 * 
 * @description Computes final refund based on performance metrics, determines
 * payment release to seller (escrow minus refunds), validates payment math.
 * 
 * Payment formula:
 * - paymentReleased = paymentHeld - refundIssued
 * - paymentHeld = totalCost (initial escrow)
 * - refundIssued = calculateRefundForSLA(performance)
 * 
 * @param performanceMetrics - Final performance metrics
 * @param contractTerms - Contract SLA terms
 * @param paymentHeld - Total escrowed payment
 * @returns Updated payment details with releases and refunds
 * 
 * @throws Error if payment math is invalid (released + refunded > held)
 * 
 * @example
 * const payment = completeContract(
 *   { actualUptime: 98, ... },
 *   { slaTier: 'Silver', uptimeGuarantee: 99.5, totalCost: 10000, ... },
 *   10000
 * );
 * // 1.5% breach × 20% multiplier = 30% refund
 * // paymentReleased: $7,000
 * // refundIssued: $3,000
 */
export function completeContract(
  performanceMetrics: PerformanceMetrics,
  contractTerms: ContractTerms,
  paymentHeld: number
): ContractPayment {
  // Calculate final refund based on SLA performance
  const refundIssued = calculateRefundForSLA(
    performanceMetrics.actualUptime,
    contractTerms.uptimeGuarantee,
    contractTerms.slaTier,
    contractTerms.totalCost
  );
  
  // Calculate payment release to seller
  const paymentReleased = paymentHeld - refundIssued;
  
  // Validate payment math
  if (paymentReleased < 0) {
    throw new Error('Payment released cannot be negative (refund exceeds escrow)');
  }
  
  if (paymentReleased + refundIssued !== paymentHeld) {
    throw new Error('Payment math error: released + refunded must equal held');
  }
  
  return {
    totalCost: contractTerms.totalCost,
    paymentHeld,
    paymentReleased,
    refundIssued,
  };
}

/**
 * Initiate dispute on active contract
 * 
 * @description Freezes payment, records dispute reason and timestamp. Payment
 * remains escrowed until admin resolution.
 * 
 * @param currentStatus - Current contract status
 * @param reason - Reason for dispute (buyer or seller complaint)
 * @returns Updated contract status and dispute details
 * 
 * @throws Error if contract already disputed or completed
 * 
 * @example
 * const dispute = initiateDispute('Active', 'Seller failed to provide agreed GPU specs');
 * // status: 'Disputed'
 * // disputeReason: 'Seller failed to provide agreed GPU specs'
 * // disputedAt: 2025-11-22T10:30:00Z
 */
export function initiateDispute(
  currentStatus: ContractStatus,
  reason: string
): {
  status: ContractStatus;
  disputeReason: string;
  disputedAt: Date;
} {
  // Validate dispute eligibility
  if (currentStatus === 'Disputed') {
    throw new Error('Contract is already under dispute');
  }
  
  if (currentStatus === 'Completed') {
    throw new Error('Cannot dispute completed contract');
  }
  
  return {
    status: 'Disputed',
    disputeReason: reason,
    disputedAt: new Date(),
  };
}

/**
 * Release escrowed payment to seller (admin function)
 * 
 * @description Used after dispute resolution or manual payment release. Transfers
 * full escrowed amount to seller without refunds.
 * 
 * @param paymentHeld - Total escrowed payment
 * @param currentPaymentReleased - Already released amount (should be 0)
 * @returns Updated payment details with full release
 * 
 * @throws Error if payment already released
 * 
 * @example
 * // After dispute resolved in seller's favor
 * const payment = releasePayment(10000, 0);
 * // paymentReleased: $10,000
 * // refundIssued: $0
 */
export function releasePayment(
  paymentHeld: number,
  currentPaymentReleased: number
): ContractPayment {
  // Validate not already released
  if (currentPaymentReleased > 0) {
    throw new Error('Payment already released');
  }
  
  return {
    totalCost: paymentHeld,
    paymentHeld,
    paymentReleased: paymentHeld,
    refundIssued: 0,
  };
}

/**
 * Calculate SLA compliance percentage
 * 
 * @description Compares actual uptime against guaranteed uptime to determine
 * compliance level. Values >100% indicate over-delivery.
 * 
 * @param actualUptime - Actual uptime percentage delivered
 * @param uptimeGuarantee - Guaranteed uptime percentage
 * @returns Compliance percentage (0-100+)
 * 
 * @example
 * const compliance = calculateSLACompliance(99.95, 99.9);
 * // Result: 100.05% (slightly over-delivered)
 * 
 * @example
 * const compliance = calculateSLACompliance(98, 99.5);
 * // Result: 98.49% (under-delivered)
 */
export function calculateSLACompliance(
  actualUptime: number,
  uptimeGuarantee: number
): number {
  if (uptimeGuarantee === 0) return 100; // Edge case
  return (actualUptime / uptimeGuarantee) * 100;
}

/**
 * Calculate total GPU hours purchased
 * 
 * @description Simple multiplication of GPU count and duration for capacity
 * planning and billing verification.
 * 
 * @param gpuCount - Number of GPUs rented
 * @param durationHours - Contract length in hours
 * @returns Total GPU-hours purchased
 * 
 * @example
 * const totalHours = calculateTotalGPUHours(8, 720);
 * // 8 GPUs × 720 hours (30 days)
 * // Result: 5,760 GPU-hours
 */
export function calculateTotalGPUHours(
  gpuCount: number,
  durationHours: number
): number {
  return gpuCount * durationHours;
}

/**
 * Validate payment math consistency
 * 
 * @description Ensures payment held equals sum of payment released and refund
 * issued. Critical for preventing escrow leaks.
 * 
 * @param payment - Contract payment details
 * @returns True if payment math is valid
 * 
 * @throws Error if payment math is inconsistent
 * 
 * @example
 * validatePaymentMath({
 *   totalCost: 10000,
 *   paymentHeld: 10000,
 *   paymentReleased: 7000,
 *   refundIssued: 3000
 * }); // Returns true
 * 
 * @example
 * validatePaymentMath({
 *   totalCost: 10000,
 *   paymentHeld: 10000,
 *   paymentReleased: 8000,
 *   refundIssued: 3000
 * }); // Throws error: released + refunded > held
 */
export function validatePaymentMath(payment: ContractPayment): boolean {
  // Validate non-negative amounts
  if (payment.paymentHeld < 0 || payment.paymentReleased < 0 || payment.refundIssued < 0) {
    throw new Error('Payment amounts cannot be negative');
  }
  
  // Validate payment held equals total cost on creation
  if (payment.paymentHeld !== payment.totalCost) {
    throw new Error('Payment held must equal total cost');
  }
  
  // Validate released + refunded doesn't exceed held
  if (payment.paymentReleased + payment.refundIssued > payment.paymentHeld) {
    throw new Error('Released + refunded cannot exceed payment held');
  }
  
  return true;
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. SLA REFUND TIERS (CRITICAL BUSINESS LOGIC):
 *    - Bronze: 10% refund per 1% breach → Full refund at 10% downtime
 *    - Silver: 20% refund per 1% breach → Full refund at 5% downtime
 *    - Gold: 50% refund per 1% breach → Full refund at 2% downtime
 *    - Platinum: 100% refund per 1% breach → Full refund at 1% downtime
 *    
 *    Example: Platinum tier with 99.9% guarantee
 *    - 99.8% actual uptime → 0.1% breach → 10% refund
 *    - 99.0% actual uptime → 0.9% breach → 90% refund
 *    - 98.9% actual uptime → 1.0% breach → 100% refund (full)
 * 
 * 2. PERFORMANCE TRACKING:
 *    - actualUptime = (totalMinutes - downtimeMinutes) / totalMinutes × 100
 *    - averageLatency = Weighted average of all latency measurements
 *    - peakLatency = Maximum latency observed (for SLA validation)
 *    - slaViolations = Array of all incidents with individual refunds
 * 
 * 3. DOWNTIME VS LATENCY IMPACT:
 *    - Downtime: 100% impact weight (service unavailable)
 *    - Latency breach: 50% impact weight (service degraded, not down)
 *    - Rationale: Slow service better than no service
 * 
 * 4. PAYMENT ESCROW MECHANICS:
 *    - Buyer pays totalCost upfront → paymentHeld in escrow
 *    - On completion: paymentReleased to seller, refundIssued to buyer
 *    - Math validation: paymentHeld = paymentReleased + refundIssued (always)
 *    - Disputes freeze all payments until admin resolution
 * 
 * 5. DISPUTE RESOLUTION:
 *    - Either party can initiate dispute (buyer or seller)
 *    - Payment frozen during dispute (no automatic release)
 *    - Admin reviews evidence and determines resolution:
 *      a) Full refund to buyer (seller fault)
 *      b) Partial refund (shared responsibility)
 *      c) Full payment to seller (buyer fault)
 *    - releasePayment() used for admin-approved releases
 * 
 * 6. UTILITY-FIRST ARCHITECTURE:
 *    - All functions pure (no side effects, no model coupling)
 *    - Models delegate calculation logic to these utilities
 *    - Testable in isolation without database
 *    - Reusable across API routes, background jobs, admin tools
 * 
 * 7. REAL-WORLD SLA BENCHMARKS:
 *    - Bronze (95% uptime): ~36 hours/month downtime allowed
 *    - Silver (99% uptime): ~7 hours/month downtime allowed
 *    - Gold (99.5% uptime): ~3.6 hours/month downtime allowed
 *    - Platinum (99.9% uptime): ~43 minutes/month downtime allowed
 * 
 * 8. EDGE CASES HANDLED:
 *    - Zero uptime breach → No refund
 *    - Breach exceeds 100% refund cap → Capped at 100%
 *    - Multiple violations → Cumulative tracking in slaViolations array
 *    - Payment already released → Error thrown
 *    - Negative amounts → Validation error
 *    - Payment math inconsistency → Error thrown
 */

/**
 * Record downtime incident and update performance metrics
 * 
 * @param currentMetrics - Current performance metrics
 * @param downtimeMinutes - Duration of downtime in minutes
 * @param contractTerms - Contract SLA terms
 * @returns Updated performance metrics with new violation
 */
export function recordDowntimeIncident(
  currentMetrics: PerformanceMetrics,
  downtimeMinutes: number,
  contractTerms: ContractTerms
): PerformanceMetrics {
  const violation: SLAViolation = {
    timestamp: new Date(),
    type: 'Downtime',
    duration: downtimeMinutes,
    impactPercent: (downtimeMinutes / (contractTerms.durationHours * 60)) * 100,
    refundDue: calculateRefundForSLA(
      currentMetrics.actualUptime,
      contractTerms.uptimeGuarantee,
      contractTerms.slaTier,
      contractTerms.totalCost
    ),
    resolved: false,
  };

  return {
    ...currentMetrics,
    downtimeMinutes: currentMetrics.downtimeMinutes + downtimeMinutes,
    actualUptime: ((contractTerms.durationHours * 60 - currentMetrics.downtimeMinutes - downtimeMinutes) / (contractTerms.durationHours * 60)) * 100,
    slaViolations: [...currentMetrics.slaViolations, violation],
  };
}

/**
 * Record latency violation and update performance metrics
 * 
 * @param currentMetrics - Current performance metrics
 * @param latencyMs - Observed latency in milliseconds
 * @param contractTerms - Contract SLA terms
 * @returns Updated performance metrics with new violation
 */
export function recordLatencyViolation(
  currentMetrics: PerformanceMetrics,
  latencyMs: number,
  contractTerms: ContractTerms
): PerformanceMetrics {
  const breachAmount = latencyMs - contractTerms.maxLatency;
  if (breachAmount <= 0) return currentMetrics;

  const impactPercent = (breachAmount / contractTerms.maxLatency) * 100;

  const violation: SLAViolation = {
    timestamp: new Date(),
    type: 'LatencyBreach',
    duration: 1, // 1 minute sample
    impactPercent,
    refundDue: (contractTerms.totalCost * 0.01 * Math.min(100, impactPercent)), // 1% refund per 100% latency breach
    resolved: false,
  };

  return {
    ...currentMetrics,
    averageLatency: (currentMetrics.averageLatency + latencyMs) / 2,
    peakLatency: Math.max(currentMetrics.peakLatency, latencyMs),
    slaViolations: [...currentMetrics.slaViolations, violation],
  };
}

/**
 * Calculate final payments and validate payment math
 * 
 * @param contractTerms - Contract terms
 * @param performanceMetrics - Final performance metrics
 * @param currentPayment - Current payment state
 * @returns Final payment breakdown with validation
 */
export function calculateFinalPayments(
  contractTerms: ContractTerms,
  performanceMetrics: PerformanceMetrics,
  currentPayment: ContractPayment
): ContractPayment {
  const totalRefund = performanceMetrics.slaViolations.reduce(
    (sum, violation) => sum + violation.refundDue,
    0
  );

  const finalPayment: ContractPayment = {
    totalCost: contractTerms.totalCost,
    paymentHeld: currentPayment.paymentHeld,
    paymentReleased: Math.max(0, contractTerms.totalCost - totalRefund),
    refundIssued: Math.min(contractTerms.totalCost, totalRefund),
  };

  // Validate payment math
  const total = finalPayment.paymentReleased + finalPayment.refundIssued;
  if (Math.abs(total - finalPayment.totalCost) > 0.01) {
    throw new Error(`Payment math validation failed: ${total} !== ${finalPayment.totalCost}`);
  }

  return finalPayment;
}
