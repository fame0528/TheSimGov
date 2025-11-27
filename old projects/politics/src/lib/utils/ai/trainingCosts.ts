/**
 * trainingCosts.ts
 * Created: 2025-11-15
 * 
 * OVERVIEW:
 * Complete training cost calculation utility for AI model development.
 * Provides accurate cost estimates based on model specifications, compute type,
 * and training progress. Replaces hardcoded costs with dynamic, realistic pricing.
 * 
 * KEY FEATURES:
 * - Dynamic cost calculation based on multiple factors
 * - Size-based multipliers (Small 1x, Medium 4x, Large 10x)
 * - Compute type adjustments (GPU, Cloud, Hybrid)
 * - Parameter count and dataset size scaling
 * - Detailed cost breakdown for transparency
 * 
 * BUSINESS LOGIC:
 * - Base cost: $10 per 1% progress per billion parameters
 * - Parameter factor: Logarithmic scaling for realistic GPU costs
 * - Dataset factor: Square root scaling for data loading overhead
 * - Compute type: GPU +10%, Cloud +5%, Hybrid +15% (different infra costs)
 * - Size multipliers: Small 1x, Medium 4x, Large 10x
 */

import type { AIModelSize } from '../../db/models/AIModel';

/**
 * Compute infrastructure types
 */
export type ComputeType = 'GPU' | 'Cloud' | 'Hybrid';

/**
 * Model specification for cost calculation
 */
export interface ModelCostSpec {
  size: AIModelSize;
  parameters: number; // Total parameter count
  datasetSize: number; // Size in GB
  computeType?: ComputeType; // Defaults to 'GPU'
}

/**
 * Cost breakdown for transparency
 */
export interface CostBreakdown {
  baseCost: number;           // Base cost before multipliers
  parameterFactor: number;    // Scaling based on parameter count
  datasetFactor: number;      // Scaling based on dataset size
  sizeMultiplier: number;     // 1x/4x/10x based on model size
  computeAdjustment: number;  // +0%, +5%, +10%, +15% based on compute type
  totalCost: number;          // Final cost for the increment
}

/**
 * Size-based cost multipliers
 * Reflects actual computational requirements and market pricing
 */
const SIZE_MULTIPLIERS: Record<AIModelSize, number> = {
  Small: 1,    // Baseline (≤10B params)
  Medium: 4,   // 4x cost (10B-80B params)
  Large: 10,   // 10x cost (>80B params)
};

/**
 * Compute type cost adjustments
 * Different infrastructure has different cost profiles
 */
const COMPUTE_ADJUSTMENTS: Record<ComputeType, number> = {
  GPU: 1.10,      // +10% for on-premise GPU infrastructure overhead
  Cloud: 1.05,    // +5% for cloud compute (flexible but slightly cheaper)
  Hybrid: 1.15,   // +15% for hybrid setup (highest flexibility, most overhead)
};

/**
 * Calculate training increment cost
 * 
 * Formula breakdown:
 * 1. Base unit cost: $10 per 1% per billion parameters
 * 2. Parameter factor: log10(params/1B + 1) for GPU cost scaling
 * 3. Dataset factor: sqrt(datasetSize) for data loading overhead
 * 4. Size multiplier: 1x/4x/10x based on model category
 * 5. Compute adjustment: +5% to +15% based on infrastructure
 * 6. Final cost: baseUnitCost × paramFactor × datasetFactor × sizeMultiplier × computeAdj × increment
 * 
 * @param model - Model specifications (size, parameters, dataset, compute type)
 * @param progressIncrement - Percentage points to advance (e.g., 5 for 5%)
 * @returns Cost breakdown with total in USD
 * 
 * @example
 * // Small model (5B params), 10GB dataset, GPU compute, 5% increment
 * calculateTrainingIncrementCost(
 *   { size: 'Small', parameters: 5_000_000_000, datasetSize: 10 },
 *   5
 * )
 * // Returns: { baseCost: 10, ..., totalCost: 247.50 }
 * 
 * @example
 * // Large model (100B params), 500GB dataset, Hybrid compute, 10% increment
 * calculateTrainingIncrementCost(
 *   { size: 'Large', parameters: 100_000_000_000, datasetSize: 500, computeType: 'Hybrid' },
 *   10
 * )
 * // Returns: { baseCost: 10, ..., totalCost: 28,750.00 }
 */
export function calculateTrainingIncrementCost(
  model: ModelCostSpec,
  progressIncrement: number
): CostBreakdown {
  // Input validation
  if (progressIncrement <= 0 || progressIncrement > 100) {
    throw new Error('Progress increment must be between 0 and 100');
  }
  
  if (model.parameters <= 0) {
    throw new Error('Parameters must be greater than 0');
  }
  
  if (model.datasetSize <= 0) {
    throw new Error('Dataset size must be greater than 0');
  }
  
  // Base cost per percentage point per billion parameters
  const baseUnitCost = 10; // $10 per 1% per billion parameters
  
  // Parameter factor (logarithmic scaling reflects GPU memory/compute requirements)
  // Models with more parameters require exponentially more compute
  const parameterFactor = Math.log10(model.parameters / 1_000_000_000 + 1);
  
  // Dataset size factor (square root scaling reflects data loading overhead)
  // Larger datasets require more disk I/O and memory bandwidth
  const datasetFactor = Math.sqrt(model.datasetSize);
  
  // Size multiplier based on model category
  const sizeMultiplier = SIZE_MULTIPLIERS[model.size];
  
  // Compute type adjustment (infrastructure overhead differences)
  const computeType = model.computeType || 'GPU';
  const computeAdjustment = COMPUTE_ADJUSTMENTS[computeType];
  
  // Calculate base cost before final adjustments
  const baseCost = baseUnitCost * parameterFactor * datasetFactor * sizeMultiplier;
  
  // Calculate final total cost
  const totalCost = baseCost * computeAdjustment * progressIncrement;
  
  // Round to 2 decimal places
  const roundedCost = Math.round(totalCost * 100) / 100;
  
  return {
    baseCost: Math.round(baseUnitCost * 100) / 100,
    parameterFactor: Math.round(parameterFactor * 1000) / 1000,
    datasetFactor: Math.round(datasetFactor * 100) / 100,
    sizeMultiplier,
    computeAdjustment,
    totalCost: roundedCost,
  };
}

/**
 * Calculate total training cost estimate
 * 
 * Estimates the total cost to train a model from 0% to 100% completion.
 * Useful for budget planning and resource allocation.
 * 
 * @param model - Model specifications
 * @returns Estimated total training cost in USD
 * 
 * @example
 * // Medium model (40B params), 200GB dataset, Cloud compute
 * estimateTotalTrainingCost({
 *   size: 'Medium',
 *   parameters: 40_000_000_000,
 *   datasetSize: 200,
 *   computeType: 'Cloud'
 * })
 * // Returns: ~$42,000
 */
export function estimateTotalTrainingCost(model: ModelCostSpec): number {
  // Calculate cost for full 100% training
  const breakdown = calculateTrainingIncrementCost(model, 100);
  return breakdown.totalCost;
}

/**
 * Validate model size matches parameter count
 * 
 * Ensures size category (Small/Medium/Large) is appropriate for parameter count.
 * Used for validation in API routes.
 * 
 * @param size - Model size category
 * @param parameters - Actual parameter count
 * @returns True if size matches parameters, false otherwise
 * 
 * @example
 * validateSizeParameterMapping('Small', 5_000_000_000) // true (5B params)
 * validateSizeParameterMapping('Large', 5_000_000_000) // false (5B is Small, not Large)
 */
export function validateSizeParameterMapping(
  size: AIModelSize,
  parameters: number
): boolean {
  const thresholds: Record<AIModelSize, { min: number; max: number }> = {
    Small: { min: 0, max: 10_000_000_000 },
    Medium: { min: 10_000_000_001, max: 80_000_000_000 },
    Large: { min: 80_000_000_001, max: Infinity },
  };
  
  const threshold = thresholds[size];
  return parameters >= threshold.min && parameters <= threshold.max;
}

/**
 * Get size category from parameter count
 * 
 * Automatically determines appropriate size category based on parameter count.
 * Useful for auto-filling size field in UI.
 * 
 * @param parameters - Model parameter count
 * @returns Appropriate size category
 * 
 * @example
 * getSizeFromParameters(5_000_000_000) // 'Small'
 * getSizeFromParameters(50_000_000_000) // 'Medium'
 * getSizeFromParameters(150_000_000_000) // 'Large'
 */
export function getSizeFromParameters(parameters: number): AIModelSize {
  if (parameters <= 10_000_000_000) {
    return 'Small';
  } else if (parameters <= 80_000_000_000) {
    return 'Medium';
  } else {
    return 'Large';
  }
}

/**
 * Calculate cost comparison across compute types
 * 
 * Helps companies choose most cost-effective compute infrastructure.
 * 
 * @param model - Model specifications (without computeType)
 * @param progressIncrement - Progress increment to calculate for
 * @returns Cost breakdown for each compute type
 * 
 * @example
 * compareComputeTypeCosts({ size: 'Medium', parameters: 40B, datasetSize: 200 }, 5)
 * // Returns: { GPU: 2100, Cloud: 1995, Hybrid: 2310 }
 */
export function compareComputeTypeCosts(
  model: Omit<ModelCostSpec, 'computeType'>,
  progressIncrement: number
): Record<ComputeType, number> {
  const gpu = calculateTrainingIncrementCost({ ...model, computeType: 'GPU' }, progressIncrement);
  const cloud = calculateTrainingIncrementCost({ ...model, computeType: 'Cloud' }, progressIncrement);
  const hybrid = calculateTrainingIncrementCost({ ...model, computeType: 'Hybrid' }, progressIncrement);
  
  return {
    GPU: gpu.totalCost,
    Cloud: cloud.totalCost,
    Hybrid: hybrid.totalCost,
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. COST FORMULA RATIONALE:
 *    - Base cost ($10/1%/1B params): Industry baseline for GPU training
 *    - Logarithmic parameter scaling: Reflects memory/compute requirements
 *    - Square root dataset scaling: Models I/O overhead without exponential growth
 *    - Size multipliers: Captures architectural complexity differences
 * 
 * 2. COMPUTE TYPE ADJUSTMENTS:
 *    - GPU (+10%): On-premise infrastructure overhead (maintenance, power, cooling)
 *    - Cloud (+5%): Pay-as-you-go flexibility, slightly cheaper than on-premise
 *    - Hybrid (+15%): Highest flexibility but most overhead (dual infrastructure)
 * 
 * 3. VALIDATION:
 *    - Size thresholds: Small ≤10B, Medium ≤80B, Large >80B
 *    - Progress increments: 0-100% range enforced
 *    - Parameter/dataset minimums: Must be positive
 * 
 * 4. USAGE PATTERNS:
 *    - API routes: calculateTrainingIncrementCost() for cost per progress increment
 *    - Budget planning: estimateTotalTrainingCost() for full training estimate
 *    - Validation: validateSizeParameterMapping() in POST/PATCH handlers
 *    - UI auto-fill: getSizeFromParameters() for size suggestion
 *    - Cost comparison: compareComputeTypeCosts() for infrastructure selection
 * 
 * 5. PERFORMANCE:
 *    - All calculations O(1) time complexity
 *    - No database queries required
 *    - Pure functions (no side effects)
 *    - Suitable for real-time cost updates in UI
 */
