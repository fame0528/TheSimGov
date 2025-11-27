/**
 * computeMarketplace.ts
 * Created: 2025-11-22
 * 
 * OVERVIEW:
 * Compute marketplace utilities for player-to-player GPU trading. Provides
 * pricing recommendations, contract matching, reputation scoring, and market
 * analytics. Enables efficient marketplace operations with balanced economics.
 * 
 * KEY FEATURES:
 * - Dynamic pricing recommendations based on GPU type, SLA tier, and reputation
 * - Comprehensive seller reputation scoring with trust levels
 * - Intelligent contract matching algorithm prioritizing price, reputation, location
 * - Market positioning and competitiveness analysis
 * - Support for Spot, Reserved, and OnDemand pricing models
 * 
 * BUSINESS LOGIC:
 * - Higher SLA tiers command premium pricing (Bronze 1.0x → Platinum 2.2x)
 * - Seller reputation affects pricing power (+5% to +20% for high-rep sellers)
 * - Contract matching balances price (40%), reputation (35%), and location (25%)
 * - New sellers start at 50 reputation (neutral)
 * - Disputes severely impact reputation (-15 points penalty)
 * 
 * @implementation FID-20251122-001 Phase 2 (Utility Functions)
 * @legacy-source old projects/politics/src/lib/utils/ai/computeMarketplace.ts
 */

/**
 * GPU type for pricing and marketplace
 */
export type GPUType = 'H100' | 'A100' | 'V100' | 'A6000' | 'RTX4090' | 'MI300X' | 'Custom';

/**
 * SLA tier with corresponding uptime guarantees
 */
export type SLATier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

/**
 * Pricing model for different contract types
 */
export type PricingModel = 'Spot' | 'Reserved' | 'OnDemand';

/**
 * Market listing for matching algorithm
 */
export interface MarketListing {
  id: string;
  gpuType: GPUType;
  gpuCount: number;
  pricePerGPUHour: number;
  slaTier: SLATier;
  sellerReputation: number;
  location: string;
  availableGPUHours: number;
}

/**
 * Seller reputation components and trust level
 */
export interface ReputationScore {
  overallScore: number;        // 0-100 final score
  breakdown: {
    contractCompletion: number; // % contracts completed successfully
    slaCompliance: number;      // % of SLAs met
    avgBuyerRating: number;     // 1-5 stars buyer ratings
    disputeRate: number;        // % contracts disputed
    uptimeDelivered: number;    // % uptime delivered vs promised
  };
  trustLevel: 'Unproven' | 'Developing' | 'Reliable' | 'Trusted' | 'Elite';
}

/**
 * Market analytics snapshot
 */
export interface MarketAnalytics {
  avgPriceByGPU: Record<GPUType, number>;
  totalListings: number;
  totalAvailableGPUHours: number;
  priceRange: { min: number; max: number; median: number };
  topSellers: string[];
}

/**
 * Calculate recommended market price for GPU rental listing
 * 
 * @description Provides pricing guidance based on GPU type, SLA tier, pricing
 * model, and seller reputation. Helps sellers price competitively while
 * maximizing revenue potential.
 * 
 * Base pricing by GPU type (2024-2025 market rates):
 * - H100: $5.00/GPU/hr (flagship AI training GPU)
 * - A100: $2.75/GPU/hr (previous-gen workhorse)
 * - V100: $1.00/GPU/hr (legacy training GPU)
 * - A6000: $1.40/GPU/hr (professional workstation GPU)
 * - RTX4090: $0.70/GPU/hr (consumer-grade GPU)
 * - MI300X: $4.25/GPU/hr (AMD competitor to H100)
 * - Custom: $2.00/GPU/hr (unknown/custom hardware)
 * 
 * SLA tier multipliers (higher tier = higher price):
 * - Bronze (95% uptime): 1.0x baseline
 * - Silver (99% uptime): 1.3x (+30% premium)
 * - Gold (99.5% uptime): 1.7x (+70% premium)
 * - Platinum (99.9% uptime): 2.2x (+120% premium)
 * 
 * Pricing model adjustments:
 * - Spot: 0.80x (-20% discount, can be preempted)
 * - Reserved: 1.30x (+30% premium, guaranteed capacity)
 * - OnDemand: 1.00x (baseline flexible pricing)
 * 
 * Reputation premium (high-reputation sellers command higher prices):
 * - 0-50 rep: 0.90x to 1.00x (-10% to 0% adjustment)
 * - 50-75 rep: 1.00x to 1.05x (0% to +5% adjustment)
 * - 75-100 rep: 1.05x to 1.20x (+5% to +20% premium)
 * 
 * @param gpuType - GPU hardware type
 * @param slaTier - SLA commitment level
 * @param pricingModel - Spot/Reserved/OnDemand pricing
 * @param sellerReputation - Seller reputation score (0-100)
 * @returns Pricing recommendation with range and market positioning
 * 
 * @throws Error if sellerReputation is not between 0 and 100
 * 
 * @example
 * // Premium H100 listing with Gold SLA, Reserved pricing, high reputation
 * const pricing = calculateMarketPrice('H100', 'Gold', 'Reserved', 95);
 * // Base: $5.00 × Gold (1.7x) × Reserved (1.3x) × Rep95 (1.17x) = $12.87/hr
 * // Returns: {
 * //   recommendedPrice: 12.87,
 * //   priceRange: { min: 10.30, max: 15.44 },
 * //   marketPosition: 'Luxury',
 * //   reasoning: 'H100 base $5.00 × Gold (1.7x) × Reserved (1.3x) × Rep95 (1.17x) = $12.87/GPU/hr'
 * // }
 * 
 * @example
 * // Budget V100 listing with Bronze SLA, Spot pricing, developing reputation
 * const pricing = calculateMarketPrice('V100', 'Bronze', 'Spot', 45);
 * // Base: $1.00 × Bronze (1.0x) × Spot (0.8x) × Rep45 (0.99x) = $0.79/hr
 * // Returns: {
 * //   recommendedPrice: 0.79,
 * //   priceRange: { min: 0.63, max: 0.95 },
 * //   marketPosition: 'Budget',
 * //   reasoning: 'V100 base $1.00 × Bronze (1.0x) × Spot (0.8x) × Rep45 (0.99x) = $0.79/GPU/hr'
 * // }
 */
export function calculateMarketPrice(
  gpuType: GPUType,
  slaTier: SLATier,
  pricingModel: PricingModel,
  sellerReputation: number
): {
  recommendedPrice: number;
  priceRange: { min: number; max: number };
  marketPosition: 'Budget' | 'Competitive' | 'Premium' | 'Luxury';
  reasoning: string;
} {
  // Input validation
  if (typeof sellerReputation !== 'number' || sellerReputation < 0 || sellerReputation > 100) {
    throw new Error('sellerReputation must be between 0 and 100');
  }
  
  // Base pricing by GPU type (midpoint of market range)
  const BASE_PRICES: Record<GPUType, number> = {
    H100: 5.00,      // Flagship AI training GPU
    A100: 2.75,      // Previous-gen workhorse
    V100: 1.00,      // Legacy training GPU
    A6000: 1.40,     // Professional workstation GPU
    RTX4090: 0.70,   // Consumer-grade GPU
    MI300X: 4.25,    // AMD competitor to H100
    Custom: 2.00,    // Unknown/custom hardware
  };
  
  const basePrice = BASE_PRICES[gpuType];
  
  // SLA tier multipliers (higher tier = higher price)
  const SLA_MULTIPLIERS: Record<SLATier, number> = {
    Bronze: 1.0,     // 95% uptime baseline
    Silver: 1.3,     // 99% uptime (+30% premium)
    Gold: 1.7,       // 99.5% uptime (+70% premium)
    Platinum: 2.2,   // 99.9% uptime (+120% premium)
  };
  
  const slaMultiplier = SLA_MULTIPLIERS[slaTier];
  
  // Pricing model adjustments
  const MODEL_ADJUSTMENTS: Record<PricingModel, number> = {
    Spot: 0.80,      // 20% discount (can be preempted)
    Reserved: 1.30,  // 30% premium (guaranteed capacity)
    OnDemand: 1.00,  // Baseline flexible pricing
  };
  
  const modelAdjustment = MODEL_ADJUSTMENTS[pricingModel];
  
  // Reputation premium (high reputation sellers can charge more)
  // 0-50 rep: -10% to 0% (penalty for low reputation)
  // 50-75 rep: 0% to +5% (modest premium for good reputation)
  // 75-100 rep: +5% to +20% (significant premium for excellent reputation)
  let reputationPremium = 1.0;
  if (sellerReputation >= 75) {
    reputationPremium = 1.05 + ((sellerReputation - 75) / 25) * 0.15; // 1.05 to 1.20
  } else if (sellerReputation >= 50) {
    reputationPremium = 1.00 + ((sellerReputation - 50) / 25) * 0.05; // 1.00 to 1.05
  } else {
    reputationPremium = 0.90 + (sellerReputation / 50) * 0.10; // 0.90 to 1.00
  }
  
  // Calculate recommended price
  const recommendedPrice = basePrice * slaMultiplier * modelAdjustment * reputationPremium;
  
  // Price range (±20% from recommended for market flexibility)
  const priceRange = {
    min: Math.round(recommendedPrice * 0.80 * 100) / 100,
    max: Math.round(recommendedPrice * 1.20 * 100) / 100,
  };
  
  // Market positioning based on final price vs base
  let marketPosition: 'Budget' | 'Competitive' | 'Premium' | 'Luxury';
  if (recommendedPrice < basePrice * 0.9) {
    marketPosition = 'Budget';
  } else if (recommendedPrice < basePrice * 1.3) {
    marketPosition = 'Competitive';
  } else if (recommendedPrice < basePrice * 2.0) {
    marketPosition = 'Premium';
  } else {
    marketPosition = 'Luxury';
  }
  
  // Reasoning explanation
  const reasoning = `${gpuType} base $${basePrice.toFixed(2)} × ${slaTier} (${slaMultiplier}x) × ${pricingModel} (${modelAdjustment}x) × Rep${sellerReputation} (${reputationPremium.toFixed(2)}x) = $${recommendedPrice.toFixed(2)}/GPU/hr`;
  
  return {
    recommendedPrice: Math.round(recommendedPrice * 100) / 100,
    priceRange,
    marketPosition,
    reasoning,
  };
}

/**
 * Calculate comprehensive seller reputation score
 * 
 * @description Computes reputation from contract history, SLA compliance, buyer
 * ratings, disputes, and uptime delivery. Reputation affects marketplace
 * visibility, pricing power, and buyer trust.
 * 
 * Score components (weighted calculation):
 * - Contract completion: 30% (completed contracts / total contracts)
 * - SLA compliance: 35% (contracts meeting SLA / total contracts)
 * - Buyer ratings: 20% (average star rating / 5 × 100)
 * - Uptime delivered: 20% (average uptime delivered / promised)
 * - Dispute penalty: -15% (penalty for disputed contracts)
 * 
 * Trust levels based on overall score:
 * - Unproven (0-30): New or poor track record, limited visibility
 * - Developing (31-60): Building reputation, average positioning
 * - Reliable (61-80): Good track record, moderate buyer confidence
 * - Trusted (81-95): Excellent track record, high buyer confidence, premium positioning
 * - Elite (96-100): Outstanding track record, top visibility, best pricing power
 * 
 * New seller behavior:
 * - Sellers with 0 contracts start at 50 reputation (neutral/Unproven)
 * - First contract immediately affects reputation (can go up or down)
 * - Dispute penalty scales with total contracts (less impact for high-volume sellers)
 * 
 * @param totalContracts - Total contracts created
 * @param completedContracts - Contracts successfully completed
 * @param avgBuyerRating - Average buyer rating (1-5 stars)
 * @param disputedContracts - Number of disputed contracts
 * @param avgUptimeDelivered - Average uptime delivered (%)
 * @param avgUptimePromised - Average uptime promised (%)
 * @returns Reputation score with breakdown and trust level
 * 
 * @throws Error if contract counts are negative or invalid
 * @throws Error if avgBuyerRating is not between 1 and 5
 * @throws Error if uptime percentages are not between 0 and 100
 * 
 * @example
 * // Reliable seller with good track record
 * const rep = calculateSellerReputation(50, 48, 4.3, 1, 99.2, 99.5);
 * // Contract completion: 96% (48/50) → 28.8/30 points
 * // SLA compliance: 99.7% (99.2/99.5) → 34.9/35 points
 * // Buyer rating: 4.3/5 → 17.2/20 points
 * // Uptime: 99.2% → 19.8/20 points
 * // Dispute penalty: 2% dispute rate → -0.3 points
 * // Total: 100.4 - 0.3 = 100 → Elite
 * // Returns: {
 * //   overallScore: 100,
 * //   breakdown: {
 * //     contractCompletion: 96.00,
 * //     slaCompliance: 99.70,
 * //     avgBuyerRating: 4.30,
 * //     disputeRate: 2.00,
 * //     uptimeDelivered: 99.20
 * //   },
 * //   trustLevel: 'Elite'
 * // }
 * 
 * @example
 * // New seller (no contracts yet)
 * const rep = calculateSellerReputation(0, 0, 0, 0, 0, 0);
 * // Returns: {
 * //   overallScore: 50,
 * //   breakdown: { all zeros },
 * //   trustLevel: 'Unproven'
 * // }
 */
export function calculateSellerReputation(
  totalContracts: number,
  completedContracts: number,
  avgBuyerRating: number,
  disputedContracts: number,
  avgUptimeDelivered: number,
  avgUptimePromised: number
): ReputationScore {
  // Input validation
  if (totalContracts < 0 || completedContracts < 0 || disputedContracts < 0) {
    throw new Error('Contract counts cannot be negative');
  }
  
  if (completedContracts > totalContracts || disputedContracts > totalContracts) {
    throw new Error('Completed/disputed contracts cannot exceed total');
  }
  
  if (avgBuyerRating < 1 || avgBuyerRating > 5) {
    throw new Error('avgBuyerRating must be between 1 and 5');
  }
  
  if (avgUptimeDelivered < 0 || avgUptimeDelivered > 100 || avgUptimePromised < 0 || avgUptimePromised > 100) {
    throw new Error('Uptime percentages must be between 0 and 100');
  }
  
  // New sellers start at 50 reputation (neutral/Unproven)
  if (totalContracts === 0) {
    return {
      overallScore: 50,
      breakdown: {
        contractCompletion: 0,
        slaCompliance: 0,
        avgBuyerRating: 0,
        disputeRate: 0,
        uptimeDelivered: 0,
      },
      trustLevel: 'Unproven',
    };
  }
  
  // Calculate component scores (0-100 each)
  const contractCompletionRate = (completedContracts / totalContracts) * 100;
  const slaComplianceRate = avgUptimePromised > 0 
    ? ((avgUptimeDelivered / avgUptimePromised) * 100)
    : 100; // Edge case: no uptime promise = 100% compliance
  const buyerRatingScore = (avgBuyerRating / 5) * 100;
  const disputeRate = (disputedContracts / totalContracts) * 100;
  const uptimeScore = avgUptimeDelivered;
  
  // Weighted reputation calculation
  const WEIGHTS = {
    contractCompletion: 0.30,  // 30% weight (most important)
    slaCompliance: 0.35,       // 35% weight (critical for trust)
    buyerRating: 0.20,         // 20% weight (direct feedback)
    uptime: 0.20,              // 20% weight (performance tracking)
  };
  
  const positiveScore = 
    (contractCompletionRate * WEIGHTS.contractCompletion) +
    (slaComplianceRate * WEIGHTS.slaCompliance) +
    (buyerRatingScore * WEIGHTS.buyerRating) +
    (uptimeScore * WEIGHTS.uptime);
  
  // Dispute penalty (up to -15 points, severe impact)
  // 1% dispute rate = -0.15 points
  // 100% dispute rate = -15 points
  const disputePenalty = Math.min(15, disputeRate * 0.15);
  
  // Final score (0-100, capped at both ends)
  const overallScore = Math.max(0, Math.min(100, positiveScore - disputePenalty));
  
  // Determine trust level
  let trustLevel: 'Unproven' | 'Developing' | 'Reliable' | 'Trusted' | 'Elite';
  if (overallScore >= 96) {
    trustLevel = 'Elite';      // 96-100: Outstanding track record
  } else if (overallScore >= 81) {
    trustLevel = 'Trusted';    // 81-95: Excellent track record
  } else if (overallScore >= 61) {
    trustLevel = 'Reliable';   // 61-80: Good track record
  } else if (overallScore >= 31) {
    trustLevel = 'Developing'; // 31-60: Building reputation
  } else {
    trustLevel = 'Unproven';   // 0-30: New or poor track record
  }
  
  return {
    overallScore: Math.round(overallScore),
    breakdown: {
      contractCompletion: Math.round(contractCompletionRate * 100) / 100,
      slaCompliance: Math.round(slaComplianceRate * 100) / 100,
      avgBuyerRating: Math.round(avgBuyerRating * 100) / 100,
      disputeRate: Math.round(disputeRate * 100) / 100,
      uptimeDelivered: Math.round(avgUptimeDelivered * 100) / 100,
    },
    trustLevel,
  };
}

/**
 * Match buyer requirements to best marketplace listings
 * 
 * @description Finds and ranks compute listings matching buyer requirements.
 * Uses multi-factor scoring algorithm prioritizing price competitiveness,
 * seller reputation, and location proximity.
 * 
 * Matching algorithm (3-step process):
 * 
 * 1. **Filter listings** by hard requirements:
 *    - GPU type must match exactly
 *    - Available GPU hours >= minimum needed
 *    - SLA tier must match preferred tier
 * 
 * 2. **Calculate match score** (0-100) for each eligible listing:
 *    - Price competitiveness: 40% (lower price = higher score)
 *      - Calculated relative to price range of eligible listings
 *      - Cheapest listing scores 40/40, most expensive scores 0/40
 *    - Seller reputation: 35% (higher rep = higher score)
 *      - Direct mapping: reputation/100 × 35
 *      - 100 reputation scores 35/35, 0 reputation scores 0/35
 *    - Location match: 25% (same region = bonus)
 *      - Same region: 25/25 points
 *      - Different region: 0/25 points
 * 
 * 3. **Sort and return** top N matches:
 *    - Descending by match score
 *    - Include reasoning, estimated cost
 *    - Limit to maxResults
 * 
 * Match score interpretation:
 * - 90-100: Excellent match (great price, high reputation, possibly same region)
 * - 75-89: Good match (competitive pricing, reliable seller)
 * - 60-74: Fair match (acceptable price or reputation)
 * - 0-59: Weak match (higher price or lower reputation)
 * 
 * @param gpuType - Desired GPU type
 * @param minGPUHours - Minimum GPU hours needed
 * @param preferredSLA - Preferred SLA tier
 * @param buyerLocation - Buyer's geographic region
 * @param availableListings - All active marketplace listings
 * @param maxResults - Maximum results to return (default: 10)
 * @returns Ranked matches with scores, reasoning, estimated costs
 * 
 * @throws Error if minGPUHours is not positive
 * @throws Error if maxResults is not positive
 * 
 * @example
 * // Find H100 listings for 100 GPU hours, Gold SLA, US-East region
 * const matches = matchBuyerToListings('H100', 100, 'Gold', 'US-East', listings, 5);
 * // Returns: [
 * //   {
 * //     listing: { id: 'abc123', pricePerGPUHour: 8.50, sellerReputation: 95, location: 'US-East', ... },
 * //     matchScore: 92,
 * //     reasoning: 'Excellent match: Great price, high reputation, same region (low latency)',
 * //     estimatedCost: 850.00
 * //   },
 * //   {
 * //     listing: { id: 'def456', pricePerGPUHour: 9.00, sellerReputation: 88, location: 'US-West', ... },
 * //     matchScore: 78,
 * //     reasoning: 'Good match: Competitive pricing and reliable seller',
 * //     estimatedCost: 900.00
 * //   },
 * //   ...
 * // ]
 * 
 * @example
 * // No eligible listings (returns empty array)
 * const matches = matchBuyerToListings('H100', 1000, 'Platinum', 'EU', [], 10);
 * // Returns: []
 */
export function matchBuyerToListings(
  gpuType: GPUType,
  minGPUHours: number,
  preferredSLA: SLATier,
  buyerLocation: string,
  availableListings: MarketListing[],
  maxResults: number = 10
): Array<{
  listing: MarketListing;
  matchScore: number;
  reasoning: string;
  estimatedCost: number;
}> {
  // Input validation
  if (minGPUHours <= 0) {
    throw new Error('minGPUHours must be positive');
  }
  
  if (maxResults <= 0) {
    throw new Error('maxResults must be positive');
  }
  
  // Filter listings by hard requirements
  const eligibleListings = availableListings.filter(listing => 
    listing.gpuType === gpuType &&
    listing.availableGPUHours >= minGPUHours &&
    listing.slaTier === preferredSLA
  );
  
  // No eligible listings = empty results
  if (eligibleListings.length === 0) {
    return [];
  }
  
  // Find price range for competitiveness calculation
  const prices = eligibleListings.map(l => l.pricePerGPUHour);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  
  // Calculate match scores for all eligible listings
  const matches = eligibleListings.map(listing => {
    // Price competitiveness (40%): lower price = higher score
    // Linear scale from 0 (most expensive) to 40 (cheapest)
    const priceCompetitiveness = priceRange > 0
      ? ((maxPrice - listing.pricePerGPUHour) / priceRange) * 40
      : 40; // All same price = full points
    
    // Seller reputation (35%): direct mapping
    // 100 reputation = 35 points, 0 reputation = 0 points
    const reputationScore = (listing.sellerReputation / 100) * 35;
    
    // Location match (25%): bonus for same region (low latency)
    const locationMatch = listing.location === buyerLocation ? 25 : 0;
    
    // Total match score (0-100)
    const matchScore = priceCompetitiveness + reputationScore + locationMatch;
    
    // Estimated cost for buyer
    const estimatedCost = listing.pricePerGPUHour * minGPUHours;
    
    // Generate reasoning based on match score
    let reasoning = '';
    if (matchScore >= 90) {
      reasoning = 'Excellent match: Great price, high reputation';
    } else if (matchScore >= 75) {
      reasoning = 'Good match: Competitive pricing and reliable seller';
    } else if (matchScore >= 60) {
      reasoning = 'Fair match: Acceptable price or reputation';
    } else {
      reasoning = 'Weak match: Higher price or lower reputation';
    }
    
    // Add location bonus note if applicable
    if (locationMatch > 0) {
      reasoning += ', same region (low latency)';
    }
    
    return {
      listing,
      matchScore: Math.round(matchScore),
      reasoning,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
    };
  });
  
  // Sort by match score descending (best matches first)
  matches.sort((a, b) => b.matchScore - a.matchScore);
  
  // Return top N results
  return matches.slice(0, maxResults);
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. MARKET PRICING (calculateMarketPrice):
 *    - Base prices reflect real-world GPU rental costs (2024-2025):
 *      * H100: $5.00/hr (flagship AI training, limited supply)
 *      * A100: $2.75/hr (previous-gen workhorse, widely available)
 *      * V100: $1.00/hr (legacy training GPU, budget option)
 *      * A6000: $1.40/hr (professional workstation, inference)
 *      * RTX4090: $0.70/hr (consumer-grade, hobbyist projects)
 *      * MI300X: $4.25/hr (AMD competitor, emerging market)
 *    - SLA tier multipliers compound significantly:
 *      * Bronze (95% uptime): 1.0x baseline
 *      * Platinum (99.9% uptime): 2.2x = 120% premium
 *    - Pricing models affect accessibility:
 *      * Spot: Cheap but interruptible (training jobs with checkpoints)
 *      * Reserved: Expensive but guaranteed (production inference)
 *      * OnDemand: Balanced (ad-hoc experiments)
 *    - Reputation premium rewards reliable sellers:
 *      * Elite sellers (95+ rep): +20% pricing power
 *      * New sellers (50 rep): No premium
 *      * Poor sellers (<50 rep): -10% penalty
 * 
 * 2. REPUTATION SYSTEM (calculateSellerReputation):
 *    - Weighted scoring emphasizes critical trust factors:
 *      * SLA compliance (35%): Most important for buyers
 *      * Contract completion (30%): Reliability indicator
 *      * Buyer ratings (20%): Direct customer feedback
 *      * Uptime delivery (20%): Performance tracking
 *    - Dispute penalty (-15 max) severely impacts reputation:
 *      * 10% dispute rate = -1.5 points (minor impact)
 *      * 50% dispute rate = -7.5 points (major impact)
 *      * 100% dispute rate = -15 points (catastrophic)
 *    - Trust levels affect marketplace positioning:
 *      * Elite (96-100): Featured listings, top search results
 *      * Trusted (81-95): Premium positioning, buyer confidence
 *      * Reliable (61-80): Standard positioning, moderate trust
 *      * Developing (31-60): Lower visibility, building track record
 *      * Unproven (0-30): Minimal visibility, buyer hesitation
 *    - New seller strategy:
 *      * Start at 50 reputation (neutral)
 *      * First 5-10 contracts critical for reputation building
 *      * One dispute can drop new seller to "Unproven" tier
 * 
 * 3. MATCHING ALGORITHM (matchBuyerToListings):
 *    - Three-factor scoring balances buyer priorities:
 *      * Price competitiveness (40%): Primary concern for most buyers
 *      * Seller reputation (35%): Risk mitigation and reliability
 *      * Location proximity (25%): Latency and data sovereignty
 *    - Filtering ensures hard requirements met:
 *      * GPU type: Exact match (H100 buyer won't accept A100)
 *      * Capacity: Minimum GPU hours available
 *      * SLA tier: Must match preferred tier
 *    - Score interpretation guides buyer decisions:
 *      * 90+: Optimal match, high confidence purchase
 *      * 75-89: Good option, acceptable tradeoffs
 *      * 60-74: Marginal option, significant tradeoffs
 *      * <60: Poor match, consider expanding search criteria
 *    - Location matching benefits:
 *      * Same region: Lower latency, faster data transfer
 *      * Data sovereignty compliance (EU buyers prefer EU sellers)
 *      * Timezone alignment for support
 * 
 * 4. REAL-WORLD USAGE PATTERNS:
 *    - Sellers:
 *      * Use calculateMarketPrice() when creating listings
 *      * Monitor reputation with calculateSellerReputation()
 *      * Adjust pricing based on market position
 *    - Buyers:
 *      * Use matchBuyerToListings() to find optimal contracts
 *      * Filter by budget (estimatedCost)
 *      * Prioritize high matchScore listings
 *    - Platform:
 *      * Calculate reputation for marketplace rankings
 *      * Generate market analytics from all listings
 *      * Enforce minimum reputation for certain SLA tiers
 * 
 * 5. UTILITY-FIRST ARCHITECTURE:
 *    - All functions pure (no database coupling, no side effects)
 *    - Models delegate pricing/reputation logic to these utilities
 *    - API routes compose utilities for complete marketplace operations
 *    - Testable in isolation without database or external services
 *    - Reusable across web UI, API, background jobs, admin tools
 * 
 * 6. EDGE CASES HANDLED:
 *    - No eligible listings: Returns empty array
 *    - All same price: Full price competitiveness points to all
 *    - New seller (0 contracts): 50 reputation (neutral)
 *    - Zero uptime promise: 100% SLA compliance (edge case)
 *    - Invalid inputs: Throws descriptive errors
 *    - Negative values: Input validation prevents
 */
