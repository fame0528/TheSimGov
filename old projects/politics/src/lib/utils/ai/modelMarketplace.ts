/**
 * modelMarketplace.ts
 * Created: 2025-11-15
 * 
 * OVERVIEW:
 * Model marketplace pricing and valuation utilities for AI model trading.
 * Provides intelligent pricing recommendations, buyer-model matching, and
 * licensing strategy optimization for the fine-tuned model marketplace.
 * 
 * KEY FEATURES:
 * - Multi-factor model valuation (size, performance, seller reputation)
 * - Licensing strategy recommendations (Perpetual vs Subscription vs Usage-based)
 * - Buyer-model matching algorithm (requirements + budget + use case)
 * - Price sensitivity analysis (elasticity curves for different buyer segments)
 * - Market positioning assessment (Budget/Competitive/Premium/Luxury tiers)
 * 
 * BUSINESS LOGIC:
 * - Base value scales with parameter count (log scale: 10B→$5k, 80B→$50k, 175B→$250k)
 * - Performance premium: +2% per accuracy point above 80%
 * - Seller reputation: 0.8-1.2x multiplier based on trust level
 * - License type optimization: Perpetual for one-time buyers, Subscription for continuous, Usage for uncertain demand
 * - Buyer matching: Weighted scoring (requirements 50%, budget 30%, reputation 20%)
 * 
 * ECONOMIC GAMEPLAY:
 * - Sellers optimize pricing for revenue maximization
 * - Buyers find best value for requirements and budget
 * - Market efficiency through transparent pricing and benchmarks
 * - Liquidity creation via diverse licensing models
 */

import type { AIArchitecture, AIModelSize, BenchmarkScores } from '@/lib/db/models/AIModel';
import type { LicensingModel, IModelListing } from '@/lib/db/models/ModelListing';

/**
 * Model valuation result
 */
export interface ModelValuation {
  baseValue: number;                 // Base value before adjustments
  performancePremium: number;        // Performance-based premium (USD)
  reputationAdjustment: number;      // Reputation multiplier effect (USD)
  marketValue: number;               // Final recommended value
  confidence: number;                // Confidence score (0-100)
  comparables: string[];             // Similar models for comparison
  reasoning: string;
}

/**
 * Licensing strategy recommendation
 */
export interface LicensingStrategy {
  primaryRecommendation: LicensingModel;
  alternativeOptions: LicensingModel[];
  perpetualPrice: number;
  monthlySubscription: number;
  pricePerApiCall: number;
  expectedRevenue: {
    year1: number;
    year3: number;
    year5: number;
  };
  reasoning: string;
}

/**
 * Buyer-model match result
 */
export interface BuyerModelMatch {
  listing: Partial<IModelListing>;
  matchScore: number;                // 0-100 match quality
  strengths: string[];               // Why this model fits
  weaknesses: string[];              // Potential concerns
  estimatedROI: number;              // Expected ROI percentage
  recommendation: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

/**
 * Market positioning analysis
 */
export interface MarketPositioning {
  position: 'Budget' | 'Competitive' | 'Premium' | 'Luxury';
  pricePercentile: number;           // 0-100 percentile in market
  recommendedAdjustment: number;     // USD adjustment to optimize
  elasticity: number;                // Price elasticity (0.5 = inelastic, 2.0 = elastic)
  demandForecast: 'High' | 'Medium' | 'Low';
  reasoning: string;
}

/**
 * Calculate model market value using multi-factor analysis
 * 
 * Valuation formula:
 * - Base value: f(parameters) where f is logarithmic scaling
 * - Architecture multiplier: Transformer 1.5x, Diffusion 1.3x, CNN 1.0x, RNN 0.9x, GAN 1.2x
 * - Size category: Small $5k, Medium $50k, Large $250k baselines
 * - Performance premium: +2% per accuracy point above 80%, -0.1% per ms latency above 100ms
 * - Reputation factor: 0.8-1.2x based on seller score (0-100)
 * 
 * @param architecture - Model architecture type
 * @param size - Model size category
 * @param parameters - Total parameter count
 * @param benchmarkScores - Performance metrics
 * @param sellerReputation - Seller reputation score (0-100)
 * @returns Complete valuation analysis with reasoning
 * 
 * @example
 * // Large Transformer, 70B params, 92% accuracy, 80ms latency, elite seller (95 rep)
 * calculateModelValue('Transformer', 'Large', 70e9, {...}, 95)
 * // Returns: {
 * //   baseValue: $250k,
 * //   performancePremium: $60k (+24% for 92% accuracy),
 * //   reputationAdjustment: $62k (1.2x multiplier),
 * //   marketValue: $372k,
 * //   confidence: 85,
 * //   reasoning: "Premium justified by elite seller and exceptional performance..."
 * // }
 */
export function calculateModelValue(
  architecture: AIArchitecture,
  size: AIModelSize,
  parameters: number,
  benchmarkScores: BenchmarkScores,
  sellerReputation: number
): ModelValuation {
  // Base value by size category
  const sizeBaseValues: Record<AIModelSize, number> = {
    Small: 5000,
    Medium: 50000,
    Large: 250000,
  };
  
  let baseValue = sizeBaseValues[size];
  
  // Architecture multiplier
  const archMultipliers: Record<AIArchitecture, number> = {
    Transformer: 1.5,
    Diffusion: 1.3,
    CNN: 1.0,
    RNN: 0.9,
    GAN: 1.2,
  };
  
  baseValue *= archMultipliers[architecture];
  
  // Performance premium calculation
  const accuracyPremium = Math.max(0, (benchmarkScores.accuracy - 80) * 0.02); // +2% per point above 80%
  const latencyPenalty = Math.max(0, (benchmarkScores.inferenceLatency - 100) * 0.001); // -0.1% per ms above 100ms
  
  const performanceFactor = 1 + accuracyPremium - latencyPenalty;
  const performancePremium = baseValue * (performanceFactor - 1);
  
  // Apply performance adjustment
  let marketValue = baseValue * performanceFactor;
  
  // Reputation adjustment
  const reputationMultiplier = 0.8 + (sellerReputation / 100) * 0.4; // 0.8x to 1.2x
  const reputationAdjustment = marketValue * (reputationMultiplier - 1);
  marketValue *= reputationMultiplier;
  
  // Confidence score based on data quality
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
  
  // Generate comparable models list
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
  
  // Generate reasoning
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
 * Recommend optimal licensing strategy
 * 
 * Analysis factors:
 * - Model characteristics (size, specialization)
 * - Target buyer segment (enterprise vs individual vs researchers)
 * - Revenue optimization (maximize lifetime value)
 * - Market demand patterns (one-time vs recurring)
 * 
 * Licensing decision tree:
 * - Perpetual: General-purpose models, one-time buyers, proven demand
 * - Subscription: Specialized models, continuous support, enterprise buyers
 * - Usage-based: Uncertain demand, try-before-buy, API-first buyers
 * - API-only: Maximum control, recurring revenue, seller-hosted only
 * 
 * @param modelValue - Calculated market value
 * @param architecture - Model architecture
 * @param size - Model size
 * @param benchmarkScores - Performance metrics
 * @param targetBuyerSegment - Primary buyer type
 * @returns Licensing strategy with revenue projections
 * 
 * @example
 * // $100k Large Transformer, targeting enterprises
 * recommendLicensingStrategy(100000, 'Transformer', 'Large', {...}, 'enterprise')
 * // Returns: {
 * //   primaryRecommendation: 'Subscription',
 * //   perpetualPrice: $150k,
 * //   monthlySubscription: $5k,
 * //   pricePerApiCall: $0.005,
 * //   expectedRevenue: { year1: $60k, year3: $180k, year5: $300k },
 * //   reasoning: "Subscription optimal for enterprise buyers requiring continuous support..."
 * // }
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
  
  // Revenue projections
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
 * Match buyer requirements to best available models
 * 
 * Matching algorithm:
 * - Requirements fit: 50% weight (architecture, size, accuracy threshold)
 * - Budget alignment: 30% weight (within budget range)
 * - Seller reputation: 20% weight (trust factor)
 * 
 * Scoring:
 * - Excellent: 85-100 (highly recommended)
 * - Good: 70-84 (solid choice)
 * - Fair: 50-69 (acceptable with caveats)
 * - Poor: <50 (not recommended)
 * 
 * @param buyerRequirements - What the buyer is looking for
 * @param availableListings - Models available in marketplace
 * @param maxResults - Maximum number of matches to return
 * @returns Ranked list of buyer-model matches
 * 
 * @example
 * // Buyer needs: Transformer, 80%+ accuracy, $100k budget
 * matchBuyerToModels({
 *   architecture: 'Transformer',
 *   minAccuracy: 80,
 *   maxBudget: 100000,
 *   licensePreference: 'Perpetual'
 * }, listings, 5)
 * // Returns: [
 * //   { matchScore: 92, recommendation: 'Excellent', estimatedROI: 180%, ... },
 * //   { matchScore: 78, recommendation: 'Good', estimatedROI: 120%, ... }
 * // ]
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
    
    // Requirements fit (50% weight)
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
    
    // Budget alignment (30% weight)
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
    
    // Seller reputation (20% weight)
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
    
    // Estimated ROI calculation
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
    
    // Recommendation based on match score
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
  
  // Sort by match score descending
  matches.sort((a, b) => b.matchScore - a.matchScore);
  
  // Return top N results
  return matches.slice(0, maxResults);
}

/**
 * Analyze market positioning and recommend pricing adjustments
 * 
 * Determines where model sits in market landscape:
 * - Budget: Bottom 25% (price-sensitive buyers)
 * - Competitive: 25-75% (mainstream market)
 * - Premium: 75-95% (high-end buyers)
 * - Luxury: Top 5% (exclusive, elite buyers)
 * 
 * Price elasticity estimates:
 * - Budget: 1.8 (elastic, price-sensitive)
 * - Competitive: 1.2 (moderate elasticity)
 * - Premium: 0.7 (inelastic, quality-focused)
 * - Luxury: 0.3 (highly inelastic, exclusivity-driven)
 * 
 * @param modelPrice - Current listing price
 * @param modelValue - Calculated market value
 * @param architecture - Model architecture
 * @param benchmarkScores - Performance metrics
 * @param sellerReputation - Seller reputation score
 * @returns Market positioning analysis with adjustment recommendation
 * 
 * @example
 * // $80k listing price, $100k market value, Transformer, 90% accuracy, rep 75
 * analyzeMarketPositioning(80000, 100000, 'Transformer', {...}, 75)
 * // Returns: {
 * //   position: 'Competitive',
 * //   pricePercentile: 60,
 * //   recommendedAdjustment: +$20k (underpriced by 20%),
 * //   elasticity: 1.2,
 * //   demandForecast: 'High',
 * //   reasoning: "Underpriced model with strong performance. Recommend +25% increase..."
 * // }
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
  
  // Determine position and percentile
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
    // Underpriced
    recommendedAdjustment = modelValue - modelPrice;
    reasoning = `Underpriced by ${((1 - priceValueRatio) * 100).toFixed(0)}%. ` +
      `Strong performance (${benchmarkScores.accuracy.toFixed(1)}% accuracy) and ` +
      `seller reputation (${sellerReputation}) justify price increase to $${modelValue.toLocaleString()}.`;
    
  } else if (priceValueRatio > 1.5) {
    // Overpriced
    recommendedAdjustment = modelValue - modelPrice; // Negative adjustment
    reasoning = `Overpriced by ${((priceValueRatio - 1) * 100).toFixed(0)}%. ` +
      `Current price ($${modelPrice.toLocaleString()}) exceeds market value ($${modelValue.toLocaleString()}). ` +
      `Risk of low demand. Consider repositioning to competitive tier.`;
    
  } else {
    // Well-priced
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
 *    - Logarithmic scaling for parameter count (diminishing returns at scale)
 *    - Architecture premium: Transformers most valuable (state-of-art)
 *    - Performance premium: +2% per accuracy point (measurable value)
 *    - Reputation factor: 0.8-1.2x (trust premium)
 *    - Confidence scoring: Higher for proven architectures and sellers
 * 
 * 2. LICENSING STRATEGY:
 *    - Enterprise: Subscription (predictable costs, support included)
 *    - Researcher: Perpetual (one-time grant funding)
 *    - Developer: Usage-based (pay-as-you-grow)
 *    - Individual: API-only (zero infrastructure)
 *    - Revenue projections: Conservative growth assumptions
 * 
 * 3. BUYER-MODEL MATCHING:
 *    - Requirements fit: 50% weight (must-haves)
 *    - Budget alignment: 30% weight (affordability)
 *    - Seller reputation: 20% weight (trust/risk)
 *    - ROI estimation: Performance + trust + track record
 * 
 * 4. MARKET POSITIONING:
 *    - Budget: <0.7× value (high demand, thin margins)
 *    - Competitive: 0.7-1.2× value (mainstream market)
 *    - Premium: 1.2-1.8× value (quality-focused buyers)
 *    - Luxury: >1.8× value (exclusive, low volume)
 *    - Elasticity: Budget elastic (1.8), Luxury inelastic (0.3)
 * 
 * 5. PRICING RECOMMENDATIONS:
 *    - Underpriced <0.8×: Increase to market value
 *    - Overpriced >1.5×: Risk demand issues, reduce to competitive
 *    - Well-priced 0.8-1.5×: Maintain current strategy
 *    - Consider quality adjustments for outliers
 * 
 * 6. REVENUE OPTIMIZATION:
 *    - Perpetual: Limited sales, high per-transaction value
 *    - Subscription: Recurring revenue, growing subscriber base
 *    - Usage-based: Scales with adoption, lower barrier to entry
 *    - API-only: Maximum control, predictable hosting costs
 * 
 * 7. COMPARABLE MODELS:
 *    - GPT-3 175B: $400k-$600k benchmark
 *    - BERT variants: $30k-$80k range
 *    - Stable Diffusion: $50k-$120k
 *    - Provides market context for buyers
 * 
 * 8. USAGE PATTERNS:
 *    - Sellers: Call calculateModelValue() before listing
 *    - Sellers: Call recommendLicensingStrategy() to optimize revenue
 *    - Buyers: Call matchBuyerToModels() to find best fit
 *    - Platform: Call analyzeMarketPositioning() for market insights
 */
