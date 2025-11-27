/**
 * @file src/lib/utils/ai/modelMarketplace.ts
 * @description Model marketplace pricing and valuation utilities for AI model trading
 * @created 2025-11-22
 * 
 * OVERVIEW:
 * Intelligent pricing and valuation system for fine-tuned AI model marketplace. Provides
 * multi-factor model valuation, licensing strategy optimization, buyer-model matching,
 * and market positioning analysis. Enables sellers to maximize revenue through dynamic
 * pricing and buyers to find optimal value for their requirements and budget.
 * 
 * KEY FUNCTIONS:
 * 1. calculateModelValue() - Multi-factor market valuation (size, performance, reputation)
 * 2. recommendLicensingStrategy() - Optimal licensing model selection (4 types)
 * 3. matchBuyerToModels() - Intelligent buyer-model matching algorithm
 * 4. analyzeMarketPositioning() - Market tier analysis with pricing recommendations
 * 
 * USAGE:
 * ```typescript
 * import {
 *   calculateModelValue,
 *   recommendLicensingStrategy,
 *   matchBuyerToModels
 * } from '@/lib/utils/ai/modelMarketplace';
 * 
 * // Calculate market value for Large Transformer (70B params, 92% accuracy)
 * const valuation = calculateModelValue(
 *   'Transformer',
 *   'Large',
 *   70e9,
 *   { accuracy: 92, inferenceLatency: 80, f1Score: 90, perplexity: 15 },
 *   95
 * );
 * // Returns: {
 * //   baseValue: $250k,
 * //   performancePremium: $60k (+24% for 92% accuracy),
 * //   reputationAdjustment: $62k (1.2x multiplier),
 * //   marketValue: $372k,
 * //   confidence: 85,
 * //   reasoning: "Premium justified by elite seller and exceptional performance..."
 * // }
 * 
 * // Recommend optimal licensing strategy for enterprise buyers
 * const licensing = recommendLicensingStrategy(
 *   100000,
 *   'Transformer',
 *   'Large',
 *   { accuracy: 90, inferenceLatency: 100, f1Score: 88, perplexity: 20 },
 *   'enterprise'
 * );
 * // Returns: {
 * //   primaryRecommendation: 'Subscription',
 * //   perpetualPrice: $150k,
 * //   monthlySubscription: $5k,
 * //   expectedRevenue: { year1: $60k, year3: $180k, year5: $300k },
 * //   reasoning: "Subscription optimal for enterprise buyers..."
 * // }
 * 
 * // Match buyer requirements to available models
 * const matches = matchBuyerToModels(
 *   {
 *     architecture: 'Transformer',
 *     minAccuracy: 80,
 *     maxBudget: 100000,
 *     licensePreference: 'Perpetual'
 *   },
 *   availableListings,
 *   5
 * );
 * // Returns: [
 * //   { matchScore: 92, recommendation: 'Excellent', estimatedROI: 180%, ... },
 * //   { matchScore: 78, recommendation: 'Good', estimatedROI: 120%, ... }
 * // ]
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Base value scales logarithmically with parameter count (10B→$5k, 80B→$50k, 175B→$250k)
 * - Architecture premium: Transformer 1.5x, Diffusion 1.3x, GAN 1.2x, CNN 1.0x, RNN 0.9x
 * - Performance premium: +2% per accuracy point above 80%, -0.1% per ms latency above 100ms
 * - Reputation factor: 0.8-1.2x multiplier based on seller trust (0-100 scale)
 * - Licensing optimization: Enterprise→Subscription, Research→Perpetual, Developer→Usage, Individual→API
 * - Buyer matching: Requirements 50%, Budget 30%, Reputation 20% weighting
 * - Market positioning: Budget (<0.7×), Competitive (0.7-1.2×), Premium (1.2-1.8×), Luxury (>1.8×)
 */

import type { AIArchitecture, AIModelSize, BenchmarkScores } from '@/lib/types/ai';
import type { LicensingModel, IModelListing } from '@/lib/db/models/ModelListing';

/**
 * Model valuation result with multi-factor analysis
 */
export interface ModelValuation {
  baseValue: number;                 // Base value before adjustments (USD)
  performancePremium: number;        // Performance-based premium (USD)
  reputationAdjustment: number;      // Reputation multiplier effect (USD)
  marketValue: number;               // Final recommended market value (USD)
  confidence: number;                // Confidence score (0-100)
  comparables: string[];             // Similar models for price comparison
  reasoning: string;                 // Valuation explanation
}

/**
 * Licensing strategy recommendation with revenue projections
 */
export interface LicensingStrategy {
  primaryRecommendation: LicensingModel;  // Optimal licensing model
  alternativeOptions: LicensingModel[];   // Alternative licensing options
  perpetualPrice: number;                 // One-time purchase price (USD)
  monthlySubscription: number;            // Monthly subscription price (USD)
  pricePerApiCall: number;                // Per-API-call pricing (USD)
  expectedRevenue: {                      // Revenue projections
    year1: number;
    year3: number;
    year5: number;
  };
  reasoning: string;                      // Strategy explanation
}

/**
 * Buyer-model match result with scoring
 */
export interface BuyerModelMatch {
  listing: Partial<IModelListing>;   // Matched model listing
  matchScore: number;                // 0-100 match quality score
  strengths: string[];               // Why this model fits requirements
  weaknesses: string[];              // Potential concerns or gaps
  estimatedROI: number;              // Expected return on investment (%)
  recommendation: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

/**
 * Market positioning analysis with pricing recommendations
 */
export interface MarketPositioning {
  position: 'Budget' | 'Competitive' | 'Premium' | 'Luxury';
  pricePercentile: number;           // 0-100 market percentile
  recommendedAdjustment: number;     // USD adjustment to optimize pricing
  elasticity: number;                // Price elasticity (0.3-1.8)
  demandForecast: 'High' | 'Medium' | 'Low';
  reasoning: string;                 // Positioning explanation
}

/**
 * Calculate model market value using multi-factor analysis
 * 
 * Valuation methodology:
 * - Base value: Determined by size category (Small $5k, Medium $50k, Large $250k)
 * - Architecture multiplier: Transformer 1.5x, Diffusion 1.3x, GAN 1.2x, CNN 1.0x, RNN 0.9x
 * - Performance premium: +2% per accuracy point above 80%, -0.1% per ms latency above 100ms
 * - Reputation factor: 0.8-1.2x based on seller reputation (0-100 scale)
 * - Confidence: Higher for proven architectures, established sellers, clear metrics
 * 
 * Formula: marketValue = baseValue × archMultiplier × performanceFactor × reputationMultiplier
 * 
 * Comparable models (market benchmarks):
 * - Large: GPT-3 175B ($400k-$600k), PaLM 540B ($1M+)
 * - Medium: GPT-2 1.5B ($40k-$80k), BERT Large 340M ($30k-$70k)
 * - Small: DistilBERT 66M ($3k-$8k), MobileBERT 25M ($2k-$5k)
 * - Diffusion: Stable Diffusion 1B ($50k-$120k)
 * - CNN: ResNet-50 ($5k-$15k), EfficientNet ($8k-$20k)
 * 
 * @param architecture - Model architecture type
 * @param size - Model size category (Small/Medium/Large)
 * @param parameters - Total parameter count
 * @param benchmarkScores - Performance metrics (accuracy, latency, f1, perplexity)
 * @param sellerReputation - Seller reputation score (0-100)
 * @returns Complete valuation analysis with market context
 * 
 * @example
 * ```typescript
 * // Value Large Transformer (70B params, 92% accuracy, 80ms latency, elite seller 95 rep)
 * const valuation = calculateModelValue(
 *   'Transformer',
 *   'Large',
 *   70e9,
 *   { accuracy: 92, inferenceLatency: 80, f1Score: 90, perplexity: 15 },
 *   95
 * );
 * // Returns: {
 * //   baseValue: $375k,
 * //   performancePremium: $90k (+24% for 92% accuracy),
 * //   reputationAdjustment: $93k (1.2x multiplier),
 * //   marketValue: $558k,
 * //   confidence: 90,
 * //   comparables: ['GPT-3 175B ($400k-$600k)', 'PaLM 540B ($1M+)'],
 * //   reasoning: "Premium justified by elite seller and exceptional performance..."
 * // }
 * ```
 */
export function calculateModelValue(
  architecture: AIArchitecture,
  size: AIModelSize,
  parameters: number,
  benchmarkScores: BenchmarkScores,
  sellerReputation: number
): ModelValuation {
  // Base value by size category (2025 market rates)
  const sizeBaseValues: Record<AIModelSize, number> = {
    Small: 5000,     // <1B params, personal/research use
    Medium: 50000,   // 1-10B params, small business/specialized
    Large: 250000,   // 10B+ params, enterprise/state-of-art
  };
  
  let baseValue = sizeBaseValues[size];
  
  // Architecture multiplier (reflects market demand and research value)
  const archMultipliers: Record<AIArchitecture, number> = {
    Transformer: 1.5,  // State-of-art, highest demand (GPT, BERT, T5)
    Diffusion: 1.3,    // Generative AI boom (Stable Diffusion, DALL-E)
    GAN: 1.2,          // Generative models, specialized use cases
    CNN: 1.0,          // Mature, commodity pricing (ResNet, EfficientNet)
    RNN: 0.9,          // Legacy architecture, limited demand
  };
  
  baseValue *= archMultipliers[architecture];
  
  // Performance premium calculation
  // +2% per accuracy point above 80% baseline
  const accuracyPremium = Math.max(0, (benchmarkScores.accuracy - 80) * 0.02);
  // -0.1% per ms latency above 100ms baseline (speed matters for production)
  const latencyPenalty = Math.max(0, (benchmarkScores.inferenceLatency - 100) * 0.001);
  
  const performanceFactor = 1 + accuracyPremium - latencyPenalty;
  const performancePremium = baseValue * (performanceFactor - 1);
  
  // Apply performance adjustment
  let marketValue = baseValue * performanceFactor;
  
  // Reputation adjustment (seller trust factor)
  // 0.8x for low reputation (<20), 1.0x for average (50), 1.2x for elite (100)
  const reputationMultiplier = 0.8 + (sellerReputation / 100) * 0.4;
  const reputationAdjustment = marketValue * (reputationMultiplier - 1);
  marketValue *= reputationMultiplier;
  
  // Confidence score based on data quality (70-100 scale)
  let confidence = 70; // Base confidence
  
  // Higher confidence for proven architectures
  if (architecture === 'Transformer' || architecture === 'CNN') {
    confidence += 10;
  }
  
  // Higher confidence for established sellers
  if (sellerReputation > 80) {
    confidence += 10;
  }
  
  // Higher confidence for clear performance metrics
  if (benchmarkScores.accuracy > 85) {
    confidence += 10;
  }
  
  confidence = Math.min(100, confidence);
  
  // Generate comparable models list (market context)
  const comparables: string[] = [];
  
  if (size === 'Large' && architecture === 'Transformer') {
    comparables.push('GPT-3 175B ($400k-$600k market range)');
    comparables.push('PaLM 540B ($1M+ enterprise pricing)');
  } else if (size === 'Medium' && architecture === 'Transformer') {
    comparables.push('GPT-2 1.5B ($40k-$80k market range)');
    comparables.push('BERT Large 340M ($30k-$70k range)');
  } else if (size === 'Small') {
    comparables.push('DistilBERT 66M ($3k-$8k range)');
    comparables.push('MobileBERT 25M ($2k-$5k range)');
  }
  
  if (architecture === 'Diffusion') {
    comparables.push('Stable Diffusion 1B ($50k-$120k range)');
  } else if (architecture === 'CNN') {
    comparables.push('ResNet-50 ($5k-$15k range)');
    comparables.push('EfficientNet ($8k-$20k range)');
  }
  
  // Generate reasoning explanation
  let reasoning = `${size} ${architecture} model (${(parameters / 1e9).toFixed(1)}B params). `;
  
  if (benchmarkScores.accuracy > 90) {
    reasoning += `Exceptional accuracy (${benchmarkScores.accuracy.toFixed(1)}%) justifies premium. `;
  } else if (benchmarkScores.accuracy < 75) {
    reasoning += `Below-average accuracy (${benchmarkScores.accuracy.toFixed(1)}%) limits value. `;
  }
  
  if (benchmarkScores.inferenceLatency > 200) {
    reasoning += `High latency (${benchmarkScores.inferenceLatency.toFixed(0)}ms) may deter buyers. `;
  } else if (benchmarkScores.inferenceLatency < 50) {
    reasoning += `Excellent latency (${benchmarkScores.inferenceLatency.toFixed(0)}ms) adds value. `;
  }
  
  if (sellerReputation > 85) {
    reasoning += `Elite seller reputation (${sellerReputation}) commands premium pricing. `;
  } else if (sellerReputation < 40) {
    reasoning += `Low seller reputation (${sellerReputation}) may require discount. `;
  }
  
  return {
    baseValue: Math.round(baseValue),
    performancePremium: Math.round(performancePremium),
    reputationAdjustment: Math.round(reputationAdjustment),
    marketValue: Math.round(marketValue),
    confidence: Math.round(confidence),
    comparables,
    reasoning: reasoning.trim(),
  };
}

/**
 * Recommend optimal licensing strategy for revenue maximization
 * 
 * Licensing model decision tree:
 * - Perpetual: General-purpose models, one-time buyers, proven demand, research grants
 * - Subscription: Specialized models, continuous support, enterprise buyers, recurring revenue
 * - Usage-based: Uncertain demand, try-before-buy, API-first buyers, pay-as-you-grow
 * - API-only: Maximum control, recurring revenue, seller-hosted only, zero infra for buyer
 * 
 * Strategy by buyer segment:
 * - Enterprise: Subscription (predictable monthly costs, includes support/updates)
 * - Researcher: Perpetual (one-time grant funding, budget constraints, full access)
 * - Developer: Usage-based (pay-as-you-grow, low initial commitment, scales with traction)
 * - Individual: API-only (zero infrastructure, simple integration, pay-per-use)
 * 
 * Pricing formulas:
 * - Perpetual: modelValue × 1.5 (premium for ownership)
 * - Subscription: modelValue × 0.03/month (~33 month payback)
 * - Usage-based: modelValue / 100k calls (100k calls = perpetual price)
 * - API-only: Same as usage-based (but seller-hosted)
 * 
 * Revenue projections (conservative growth assumptions):
 * - Perpetual: 1 sale/year (specialized model, limited market)
 * - Subscription: 5→15→25 subscribers (year 1→3→5)
 * - Usage/API: 500k→2M→5M calls (year 1→3→5)
 * 
 * @param modelValue - Calculated market value (from calculateModelValue)
 * @param architecture - Model architecture type
 * @param size - Model size category
 * @param benchmarkScores - Performance metrics
 * @param targetBuyerSegment - Primary buyer type
 * @returns Licensing strategy with 3-year revenue projections
 * 
 * @example
 * ```typescript
 * // $100k Large Transformer, targeting enterprises
 * const strategy = recommendLicensingStrategy(
 *   100000,
 *   'Transformer',
 *   'Large',
 *   { accuracy: 90, inferenceLatency: 100, f1Score: 88, perplexity: 20 },
 *   'enterprise'
 * );
 * // Returns: {
 * //   primaryRecommendation: 'Subscription',
 * //   perpetualPrice: $150k,
 * //   monthlySubscription: $3k,
 * //   pricePerApiCall: $0.0015,
 * //   expectedRevenue: { year1: $180k, year3: $540k, year5: $900k },
 * //   reasoning: "Subscription optimal for enterprise buyers: predictable costs..."
 * // }
 * ```
 */
export function recommendLicensingStrategy(
  modelValue: number,
  _architecture: AIArchitecture,
  size: AIModelSize,
  benchmarkScores: BenchmarkScores,
  targetBuyerSegment: 'enterprise' | 'individual' | 'researcher' | 'developer'
): LicensingStrategy {
  // Calculate base pricing for all license types
  const perpetualPrice = Math.round(modelValue * 1.5); // Premium for ownership
  const monthlySubscription = Math.round(modelValue * 0.03); // ~33 month payback
  const pricePerApiCall = Math.round((modelValue / 100000) * 100000) / 100000; // 100k calls = perpetual price
  
  let primaryRecommendation: LicensingModel;
  const alternativeOptions: LicensingModel[] = [];
  let reasoning = '';
  
  // Decision logic based on buyer segment and model characteristics
  if (targetBuyerSegment === 'enterprise') {
    // Enterprises prefer subscription (predictable costs, support included)
    primaryRecommendation = 'Subscription';
    alternativeOptions.push('API-only', 'Perpetual');
    
    reasoning = `Subscription optimal for enterprise buyers: predictable monthly costs ($${monthlySubscription.toLocaleString()}), ` +
      `includes support and updates. API-only alternative for hosted-only deployment.`;
    
  } else if (targetBuyerSegment === 'researcher') {
    // Researchers prefer perpetual (budget constraints, one-time grant funding)
    primaryRecommendation = 'Perpetual';
    alternativeOptions.push('Subscription', 'Usage-based');
    
    reasoning = `Perpetual license optimal for research institutions: one-time cost ($${perpetualPrice.toLocaleString()}) ` +
      `fits grant funding models. Full model access for experimentation.`;
    
  } else if (targetBuyerSegment === 'developer') {
    // Developers prefer usage-based (try before committing, scale with traction)
    primaryRecommendation = 'Usage-based';
    alternativeOptions.push('API-only', 'Subscription');
    
    reasoning = `Usage-based optimal for developers: pay-as-you-grow ($${pricePerApiCall.toFixed(5)}/call), ` +
      `low initial commitment, scales with application traction.`;
    
  } else {
    // Individuals prefer API-only (lowest barrier to entry, no infrastructure)
    primaryRecommendation = 'API-only';
    alternativeOptions.push('Usage-based', 'Perpetual');
    
    reasoning = `API-only optimal for individual buyers: zero infrastructure costs, ` +
      `simple integration, pay-per-use pricing ($${pricePerApiCall.toFixed(5)}/call).`;
  }
  
  // Adjust based on model characteristics
  if (size === 'Large') {
    // Large models better suited for hosted solutions (infrastructure complexity)
    if (primaryRecommendation === 'Perpetual') {
      reasoning += ` Note: Large model may require significant infrastructure. Consider API-only.`;
    }
  }
  
  if (benchmarkScores.accuracy > 95) {
    // Exceptional models justify premium pricing
    reasoning += ` Exceptional performance (${benchmarkScores.accuracy.toFixed(1)}% accuracy) supports premium positioning.`;
  }
  
  // Revenue projections (conservative growth assumptions)
  let year1Revenue = 0;
  let year3Revenue = 0;
  let year5Revenue = 0;
  
  if (primaryRecommendation === 'Perpetual') {
    // Assume 1 sale per year (specialized model, limited market)
    year1Revenue = perpetualPrice * 1;
    year3Revenue = perpetualPrice * 3;
    year5Revenue = perpetualPrice * 5;
    
  } else if (primaryRecommendation === 'Subscription') {
    // Assume 5 subscribers by year 1, 15 by year 3, 25 by year 5
    year1Revenue = monthlySubscription * 12 * 5;
    year3Revenue = monthlySubscription * 12 * 15;
    year5Revenue = monthlySubscription * 12 * 25;
    
  } else if (primaryRecommendation === 'Usage-based' || primaryRecommendation === 'API-only') {
    // Assume growing API usage: 500k calls year 1, 2M year 3, 5M year 5
    year1Revenue = Math.round(pricePerApiCall * 500000);
    year3Revenue = Math.round(pricePerApiCall * 2000000);
    year5Revenue = Math.round(pricePerApiCall * 5000000);
  }
  
  return {
    primaryRecommendation,
    alternativeOptions,
    perpetualPrice,
    monthlySubscription,
    pricePerApiCall,
    expectedRevenue: {
      year1: Math.round(year1Revenue),
      year3: Math.round(year3Revenue),
      year5: Math.round(year5Revenue),
    },
    reasoning: reasoning.trim(),
  };
}

/**
 * Match buyer requirements to best available models using weighted scoring
 * 
 * Matching algorithm weights:
 * - Requirements fit: 50% (architecture, size, accuracy threshold, latency limit)
 * - Budget alignment: 30% (within budget range, optimal utilization 70-100%)
 * - Seller reputation: 20% (trust factor, reduces risk)
 * 
 * Scoring breakdown (Requirements fit 50%):
 * - Architecture match: 15% (must match if specified)
 * - Accuracy requirement: 20% (must meet minimum if specified)
 * - Latency requirement: 15% (must not exceed maximum if specified)
 * 
 * Recommendation tiers:
 * - Excellent: 85-100 (highly recommended, strong fit)
 * - Good: 70-84 (solid choice, minor trade-offs)
 * - Fair: 50-69 (acceptable with caveats)
 * - Poor: <50 (not recommended, significant gaps)
 * 
 * ROI estimation factors:
 * - Base: 100% ROI
 * - High accuracy (>90%): +50%
 * - Trusted seller (>80 rep): +30%
 * - Proven track record (>10 sales): +40%
 * 
 * @param buyerRequirements - What the buyer is looking for
 * @param availableListings - Models available in marketplace
 * @param maxResults - Maximum number of matches to return (default 10)
 * @returns Ranked list of buyer-model matches (best matches first)
 * 
 * @example
 * ```typescript
 * // Buyer needs: Transformer, 80%+ accuracy, $100k budget, perpetual license
 * const matches = matchBuyerToModels(
 *   {
 *     architecture: 'Transformer',
 *     minAccuracy: 80,
 *     maxBudget: 100000,
 *     licensePreference: 'Perpetual'
 *   },
 *   availableListings,
 *   5
 * );
 * // Returns: [
 * //   { 
 * //     matchScore: 92, 
 * //     recommendation: 'Excellent', 
 * //     estimatedROI: 180%,
 * //     strengths: ['Exceeds accuracy by 5%', 'Elite seller (95)', 'Under budget'],
 * //     weaknesses: []
 * //   },
 * //   { matchScore: 78, recommendation: 'Good', estimatedROI: 120%, ... }
 * // ]
 * ```
 */
export function matchBuyerToModels(
  buyerRequirements: {
    architecture?: AIArchitecture;
    minSize?: AIModelSize;
    minAccuracy?: number;
    maxLatency?: number;
    maxBudget?: number;
    licensePreference?: LicensingModel;
    useCase?: string;
  },
  availableListings: Partial<IModelListing>[],
  maxResults: number = 10
): BuyerModelMatch[] {
  const matches: BuyerModelMatch[] = [];
  
  for (const listing of availableListings) {
    let matchScore = 0;
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // ========================================
    // REQUIREMENTS FIT (50% weight)
    // ========================================
    let requirementsScore = 0;
    
    // Architecture match (15%)
    if (!buyerRequirements.architecture || listing.architecture === buyerRequirements.architecture) {
      requirementsScore += 15;
      if (buyerRequirements.architecture) {
        strengths.push(`Matches required architecture (${listing.architecture})`);
      }
    } else {
      weaknesses.push(`Different architecture (wanted ${buyerRequirements.architecture}, got ${listing.architecture})`);
    }
    
    // Accuracy requirement (20%)
    if (!buyerRequirements.minAccuracy || (listing.benchmarkScores && listing.benchmarkScores.accuracy >= buyerRequirements.minAccuracy)) {
      requirementsScore += 20;
      if (buyerRequirements.minAccuracy && listing.benchmarkScores) {
        const excess = listing.benchmarkScores.accuracy - buyerRequirements.minAccuracy;
        if (excess > 5) {
          strengths.push(`Exceeds accuracy requirement by ${excess.toFixed(1)}%`);
        } else {
          strengths.push(`Meets accuracy requirement (${listing.benchmarkScores.accuracy.toFixed(1)}%)`);
        }
      }
    } else {
      weaknesses.push(`Below accuracy requirement (${listing.benchmarkScores?.accuracy.toFixed(1)}% < ${buyerRequirements.minAccuracy}%)`);
    }
    
    // Latency requirement (15%)
    if (!buyerRequirements.maxLatency || (listing.benchmarkScores && listing.benchmarkScores.inferenceLatency <= buyerRequirements.maxLatency)) {
      requirementsScore += 15;
      if (buyerRequirements.maxLatency && listing.benchmarkScores) {
        strengths.push(`Meets latency requirement (${listing.benchmarkScores.inferenceLatency.toFixed(0)}ms)`);
      }
    } else {
      weaknesses.push(`Exceeds latency requirement (${listing.benchmarkScores?.inferenceLatency.toFixed(0)}ms > ${buyerRequirements.maxLatency}ms)`);
    }
    
    matchScore += requirementsScore;
    
    // ========================================
    // BUDGET ALIGNMENT (30% weight)
    // ========================================
    let budgetScore = 0;
    
    if (buyerRequirements.maxBudget && listing.licenseTerms) {
      const price = listing.licenseTerms.perpetualPrice || listing.licenseTerms.monthlySubscription || 0;
      
      if (price <= buyerRequirements.maxBudget) {
        const utilization = (price / buyerRequirements.maxBudget) * 100;
        
        if (utilization >= 70 && utilization <= 100) {
          // Sweet spot: using most of budget efficiently
          budgetScore = 30;
          strengths.push(`Excellent budget fit (${utilization.toFixed(0)}% of budget)`);
        } else if (utilization < 70) {
          // Under budget (good but may be leaving value on table)
          budgetScore = 25;
          strengths.push(`Under budget (${utilization.toFixed(0)}% of budget, consider higher-tier models)`);
        } else {
          // Should not reach here due to price <= budget check
          budgetScore = 30;
        }
      } else {
        // Over budget
        budgetScore = 0;
        weaknesses.push(`Over budget ($${price.toLocaleString()} > $${buyerRequirements.maxBudget.toLocaleString()})`);
      }
    } else {
      // No budget constraint, assume full score
      budgetScore = 30;
    }
    
    matchScore += budgetScore;
    
    // ========================================
    // SELLER REPUTATION (20% weight)
    // ========================================
    let reputationScore = 0;
    
    if (listing.sellerReputation !== undefined) {
      reputationScore = (listing.sellerReputation / 100) * 20;
      
      if (listing.sellerReputation > 85) {
        strengths.push(`Elite seller (reputation ${listing.sellerReputation})`);
      } else if (listing.sellerReputation < 50) {
        weaknesses.push(`Unproven seller (reputation ${listing.sellerReputation})`);
      } else {
        strengths.push(`Reliable seller (reputation ${listing.sellerReputation})`);
      }
    }
    
    matchScore += reputationScore;
    
    // ========================================
    // ESTIMATED ROI CALCULATION
    // ========================================
    let estimatedROI = 100; // Base 100% ROI assumption
    
    if (listing.benchmarkScores && listing.benchmarkScores.accuracy > 90) {
      estimatedROI += 50; // High accuracy adds value
    }
    
    if (listing.sellerReputation && listing.sellerReputation > 80) {
      estimatedROI += 30; // Trusted sellers reduce risk
    }
    
    if (listing.salesAnalytics && listing.salesAnalytics.totalLicensesSold > 10) {
      estimatedROI += 40; // Proven models have track record
    }
    
    // ========================================
    // RECOMMENDATION TIER
    // ========================================
    let recommendation: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    
    if (matchScore >= 85) {
      recommendation = 'Excellent';
    } else if (matchScore >= 70) {
      recommendation = 'Good';
    } else if (matchScore >= 50) {
      recommendation = 'Fair';
    } else {
      recommendation = 'Poor';
    }
    
    matches.push({
      listing,
      matchScore: Math.round(matchScore),
      strengths,
      weaknesses,
      estimatedROI: Math.round(estimatedROI),
      recommendation,
    });
  }
  
  // Sort by match score descending (best matches first)
  matches.sort((a, b) => b.matchScore - a.matchScore);
  
  // Return top N results
  return matches.slice(0, maxResults);
}

/**
 * Analyze market positioning and recommend pricing adjustments
 * 
 * Market positioning tiers:
 * - Budget: Bottom 25% (<0.7× value, high demand, price-sensitive buyers)
 * - Competitive: 25-75% (0.7-1.2× value, mainstream market, balanced)
 * - Premium: 75-95% (1.2-1.8× value, high-end buyers, quality-focused)
 * - Luxury: Top 5% (>1.8× value, exclusive, elite buyers, low volume)
 * 
 * Price elasticity by tier:
 * - Budget: 1.8 (elastic, price increases hurt demand significantly)
 * - Competitive: 1.2 (moderate elasticity, balanced sensitivity)
 * - Premium: 0.7 (inelastic, quality-focused buyers less price-sensitive)
 * - Luxury: 0.3 (highly inelastic, exclusivity-driven, price insensitive)
 * 
 * Pricing recommendations:
 * - Underpriced (<0.8× value): Increase to market value, leaving money on table
 * - Overpriced (>1.5× value): Risk demand issues, reduce to competitive tier
 * - Well-priced (0.8-1.5× value): Maintain current strategy, aligned with value
 * 
 * Demand forecasting adjustments:
 * - Exceptional quality (92%+ accuracy, 80+ rep): Upgrade demand forecast
 * - Quality concerns (<75% accuracy, <40 rep): Downgrade demand forecast
 * 
 * @param modelPrice - Current listing price (USD)
 * @param modelValue - Calculated market value from calculateModelValue (USD)
 * @param architecture - Model architecture type
 * @param benchmarkScores - Performance metrics
 * @param sellerReputation - Seller reputation score (0-100)
 * @returns Market positioning analysis with actionable pricing adjustment
 * 
 * @example
 * ```typescript
 * // $80k listing price, $100k market value, Transformer, 90% accuracy, rep 75
 * const positioning = analyzeMarketPositioning(
 *   80000,
 *   100000,
 *   'Transformer',
 *   { accuracy: 90, inferenceLatency: 100, f1Score: 88, perplexity: 20 },
 *   75
 * );
 * // Returns: {
 * //   position: 'Competitive',
 * //   pricePercentile: 50,
 * //   recommendedAdjustment: +$20k (underpriced by 20%),
 * //   elasticity: 1.2,
 * //   demandForecast: 'High',
 * //   reasoning: "Underpriced by 20%. Strong performance (90% accuracy) and seller reputation (75) justify increase to $100k..."
 * // }
 * ```
 */
export function analyzeMarketPositioning(
  modelPrice: number,
  modelValue: number,
  _architecture: AIArchitecture,
  benchmarkScores: BenchmarkScores,
  sellerReputation: number
): MarketPositioning {
  // Calculate price vs value ratio
  const priceValueRatio = modelPrice / modelValue;
  
  // Determine position, percentile, elasticity, and demand forecast
  let position: 'Budget' | 'Competitive' | 'Premium' | 'Luxury';
  let pricePercentile: number;
  let elasticity: number;
  let demandForecast: 'High' | 'Medium' | 'Low';
  
  if (priceValueRatio < 0.7) {
    position = 'Budget';
    pricePercentile = 25;
    elasticity = 1.8;
    demandForecast = 'High'; // Low price = high demand
  } else if (priceValueRatio < 1.2) {
    position = 'Competitive';
    pricePercentile = 50;
    elasticity = 1.2;
    demandForecast = 'Medium';
  } else if (priceValueRatio < 1.8) {
    position = 'Premium';
    pricePercentile = 85;
    elasticity = 0.7;
    demandForecast = 'Medium';
  } else {
    position = 'Luxury';
    pricePercentile = 95;
    elasticity = 0.3;
    demandForecast = 'Low'; // High price = niche demand
  }
  
  // Calculate recommended adjustment
  let recommendedAdjustment = 0;
  let reasoning = '';
  
  if (priceValueRatio < 0.8) {
    // Underpriced (leaving money on table)
    recommendedAdjustment = modelValue - modelPrice;
    reasoning = `Underpriced by ${((1 - priceValueRatio) * 100).toFixed(0)}%. ` +
      `Strong performance (${benchmarkScores.accuracy.toFixed(1)}% accuracy) and ` +
      `seller reputation (${sellerReputation}) justify price increase to $${modelValue.toLocaleString()}.`;
    
  } else if (priceValueRatio > 1.5) {
    // Overpriced (risk of low demand)
    recommendedAdjustment = modelValue - modelPrice; // Negative adjustment
    reasoning = `Overpriced by ${((priceValueRatio - 1) * 100).toFixed(0)}%. ` +
      `Current price ($${modelPrice.toLocaleString()}) exceeds market value ($${modelValue.toLocaleString()}). ` +
      `Risk of low demand. Consider repositioning to competitive tier.`;
    
  } else {
    // Well-priced (aligned with value)
    recommendedAdjustment = 0;
    reasoning = `Well-positioned in ${position.toLowerCase()} segment. ` +
      `Price aligns with value ($${modelPrice.toLocaleString()} vs $${modelValue.toLocaleString()} market value). ` +
      `Maintain current pricing strategy.`;
  }
  
  // Adjust demand forecast based on model quality
  if (benchmarkScores.accuracy > 92 && sellerReputation > 80) {
    if (demandForecast === 'Medium') demandForecast = 'High';
    reasoning += ` Exceptional quality supports premium demand.`;
  } else if (benchmarkScores.accuracy < 75 || sellerReputation < 40) {
    if (demandForecast === 'High') demandForecast = 'Medium';
    if (demandForecast === 'Medium') demandForecast = 'Low';
    reasoning += ` Quality concerns may limit demand.`;
  }
  
  return {
    position,
    pricePercentile: Math.round(pricePercentile),
    recommendedAdjustment: Math.round(recommendedAdjustment),
    elasticity: Math.round(elasticity * 10) / 10,
    demandForecast,
    reasoning: reasoning.trim(),
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. MODEL VALUATION:
 *    - Base value: Small $5k, Medium $50k, Large $250k (2025 market rates)
 *    - Architecture premium: Transformer 1.5x (state-of-art), CNN 1.0x (commodity), RNN 0.9x (legacy)
 *    - Performance premium: +2% per accuracy point above 80% (measurable value)
 *    - Latency penalty: -0.1% per ms above 100ms (production speed matters)
 *    - Reputation factor: 0.8-1.2x (trust premium, low rep = discount, elite rep = premium)
 *    - Confidence scoring: Higher for Transformer/CNN, established sellers, clear metrics
 * 
 * 2. LICENSING STRATEGY:
 *    - Enterprise buyers: Subscription (predictable monthly costs, support included, ~33 month payback)
 *    - Research institutions: Perpetual (one-time grant funding, full model access, 1.5× perpetual premium)
 *    - Developers: Usage-based (pay-as-you-grow, low initial commitment, 100k calls = perpetual price)
 *    - Individuals: API-only (zero infrastructure, simple integration, same pricing as usage-based)
 *    - Revenue projections: Conservative growth (Perpetual: 1/year, Subscription: 5→15→25, API: 500k→2M→5M calls)
 * 
 * 3. BUYER-MODEL MATCHING:
 *    - Requirements fit: 50% weight (architecture 15%, accuracy 20%, latency 15%)
 *    - Budget alignment: 30% weight (sweet spot 70-100% utilization)
 *    - Seller reputation: 20% weight (trust factor reduces risk)
 *    - ROI estimation: Base 100% + performance 50% + trust 30% + track record 40%
 *    - Recommendation tiers: Excellent 85+, Good 70-84, Fair 50-69, Poor <50
 * 
 * 4. MARKET POSITIONING:
 *    - Budget tier: <0.7× value (high demand, thin margins, price-sensitive, elasticity 1.8)
 *    - Competitive tier: 0.7-1.2× value (mainstream market, balanced, elasticity 1.2)
 *    - Premium tier: 1.2-1.8× value (quality-focused buyers, inelastic 0.7)
 *    - Luxury tier: >1.8× value (exclusive, low volume, highly inelastic 0.3)
 *    - Elasticity: Budget most elastic (price increases hurt), Luxury least elastic (exclusivity-driven)
 * 
 * 5. PRICING RECOMMENDATIONS:
 *    - Underpriced <0.8×: Increase to market value (leaving money on table)
 *    - Overpriced >1.5×: Risk demand issues, reduce to competitive tier
 *    - Well-priced 0.8-1.5×: Maintain current strategy (aligned with value)
 *    - Quality adjustments: Exceptional models (92%+ accuracy, 80+ rep) support premium demand
 * 
 * 6. REVENUE OPTIMIZATION:
 *    - Perpetual: Limited sales (1/year), high per-transaction value, specialized models
 *    - Subscription: Recurring revenue, growing subscriber base (5→15→25), enterprise focus
 *    - Usage-based: Scales with adoption, lower barrier to entry, developer focus
 *    - API-only: Maximum seller control, predictable hosting costs, individual focus
 * 
 * 7. COMPARABLE MODELS (Market Context):
 *    - Large Transformers: GPT-3 175B ($400k-$600k), PaLM 540B ($1M+)
 *    - Medium Transformers: GPT-2 1.5B ($40k-$80k), BERT Large 340M ($30k-$70k)
 *    - Small models: DistilBERT 66M ($3k-$8k), MobileBERT 25M ($2k-$5k)
 *    - Diffusion models: Stable Diffusion 1B ($50k-$120k)
 *    - CNNs: ResNet-50 ($5k-$15k), EfficientNet ($8k-$20k)
 * 
 * 8. USAGE PATTERNS:
 *    - Sellers: Call calculateModelValue() before listing creation
 *    - Sellers: Call recommendLicensingStrategy() to optimize revenue model
 *    - Buyers: Call matchBuyerToModels() to find best-fit models for requirements
 *    - Platform: Call analyzeMarketPositioning() for market insights and price optimization
 */

/**
 * Calculate recommended pricing for model listing
 * 
 * @param modelValue - Base model valuation
 * @param marketPosition - Market positioning tier
 * @param reputation - Seller reputation score (0-100)
 * @returns Recommended pricing in USD
 */
export function calculateRecommendedPricing(
  modelValue: ModelValuation,
  marketPosition: 'Budget' | 'Competitive' | 'Premium' | 'Luxury',
  reputation: number
): number {
  const positionMultipliers = {
    Budget: 0.7,
    Competitive: 1.0,
    Premium: 1.4,
    Luxury: 2.0,
  };

  const reputationMultiplier = 0.8 + (reputation / 100) * 0.4; // 0.8-1.2x
  const positionMultiplier = positionMultipliers[marketPosition];

  return Math.round(modelValue.marketValue * positionMultiplier * reputationMultiplier);
}

/**
 * Calculate fine-tuning value for model enhancement
 * 
 * @param baseModelValue - Value of base model
 * @param fineTuningHours - Hours spent fine-tuning
 * @param datasetQuality - Quality score of fine-tuning data (0-100)
 * @param performanceImprovement - Performance improvement percentage
 * @returns Additional value from fine-tuning
 */
export function calculateFineTuningValue(
  baseModelValue: number,
  fineTuningHours: number,
  datasetQuality: number,
  performanceImprovement: number
): number {
  const hoursValue = fineTuningHours * 50; // $50/hour for compute + expertise
  const datasetMultiplier = 0.5 + (datasetQuality / 100) * 0.5; // 0.5-1.0x
  const performanceMultiplier = 1 + (performanceImprovement / 100); // 1.0-2.0x

  return Math.round(baseModelValue * 0.1 * datasetMultiplier * performanceMultiplier + hoursValue);
}

/**
 * Validate performance guarantee for model listing
 * 
 * @param claimedAccuracy - Accuracy percentage claimed
 * @param benchmarkScores - Actual benchmark scores
 * @param modelSize - Model size category
 * @returns Validation result with confidence score
 */
export function validatePerformanceGuarantee(
  claimedAccuracy: number,
  benchmarkScores: BenchmarkScores,
  modelSize: AIModelSize
): { isValid: boolean; confidence: number; reasoning: string } {
  const actualAccuracy = benchmarkScores.accuracy;
  const difference = Math.abs(claimedAccuracy - actualAccuracy);

  // Size-based tolerance (smaller models have more variance)
  const tolerance = modelSize === 'Small' ? 5 : modelSize === 'Medium' ? 3 : 1;

  const isValid = difference <= tolerance;
  const confidence = Math.max(0, 100 - (difference * 10));

  const reasoning = isValid
    ? `Claim validated within ${tolerance}% tolerance`
    : `Claim exceeds tolerance by ${difference - tolerance}%`;

  return { isValid, confidence, reasoning };
}
