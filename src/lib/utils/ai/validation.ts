/**
 * @fileoverview AI Model & Research Validation Utilities
 * @module lib/utils/ai/validation
 * 
 * OVERVIEW:
 * Validation helpers for AI model size-parameter mapping, budget constraints,
 * and training progress validation. Pure functions with zero side effects.
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

import type { AIModelSize, ResearchComplexity } from '@/lib/types/ai';

/**
 * Parameter thresholds for size validation
 * Ensures size category matches actual parameter count
 */
const SIZE_THRESHOLDS = {
  Small: { min: 0, max: 10_000_000_000 },        // 0-10B params
  Medium: { min: 10_000_000_001, max: 80_000_000_000 }, // 10B-80B params
  Large: { min: 80_000_000_001, max: Infinity },  // >80B params
} as const;

/**
 * Validate size-parameter mapping
 * 
 * @description Ensures model size category matches parameter count.
 * Enforces industry standards: Small ≤10B, Medium ≤80B, Large >80B.
 * 
 * @example
 * ```typescript
 * validateSizeParameterMapping('Small', 5_000_000_000)  // true (5B in Small range)
 * validateSizeParameterMapping('Small', 50_000_000_000) // false (50B exceeds Small)
 * validateSizeParameterMapping('Large', 100_000_000_000) // true (100B in Large range)
 * ```
 * 
 * @param size - Model size category (Small/Medium/Large)
 * @param parameters - Total parameter count
 * @returns True if size-parameter mapping is valid
 */
export function validateSizeParameterMapping(
  size: AIModelSize,
  parameters: number
): boolean {
  const threshold = SIZE_THRESHOLDS[size];
  return parameters >= threshold.min && parameters <= threshold.max;
}

/**
 * Get valid parameter range for size
 * 
 * @description Returns human-readable parameter range for a size category.
 * Used for error messages and validation feedback.
 * 
 * @example
 * ```typescript
 * getParameterRangeForSize('Small')  // "0-10B"
 * getParameterRangeForSize('Medium') // "10B-80B"
 * getParameterRangeForSize('Large')  // ">80B"
 * ```
 * 
 * @param size - Model size category
 * @returns Human-readable parameter range string
 */
export function getParameterRangeForSize(size: AIModelSize): string {
  const ranges: Record<AIModelSize, string> = {
    Small: '0-10B',
    Medium: '10B-80B',
    Large: '>80B',
  };
  return ranges[size];
}

/**
 * Validate training progress increment
 * 
 * @description Ensures progress increment is within safe bounds (1-20%).
 * Prevents overflow and unrealistic progress jumps.
 * 
 * @example
 * ```typescript
 * validateProgressIncrement(5, 45)  // true (45 + 5 = 50, valid)
 * validateProgressIncrement(60, 50) // false (50 + 60 = 110, overflow)
 * validateProgressIncrement(0, 50)  // false (0 is too small)
 * ```
 * 
 * @param increment - Progress increment (percentage points)
 * @param currentProgress - Current progress (0-100)
 * @returns True if increment is valid
 */
export function validateProgressIncrement(
  increment: number,
  currentProgress: number
): boolean {
  // Increment must be between 1-20%
  if (increment < 1 || increment > 20) return false;
  
  // Cannot exceed 100% total
  if (currentProgress + increment > 100) return false;
  
  return true;
}

/**
 * Validate research budget
 * 
 * @description Ensures budget allocation meets minimum requirements.
 * Minimum $1,000 per project (prevents trivial/invalid projects).
 * 
 * @example
 * ```typescript
 * validateResearchBudget(5000)  // true ($5K is valid)
 * validateResearchBudget(500)   // false ($500 below minimum)
 * validateResearchBudget(0)     // false (zero budget invalid)
 * ```
 * 
 * @param budget - Budget amount in USD
 * @returns True if budget is valid
 */
export function validateResearchBudget(budget: number): boolean {
  const MIN_BUDGET = 1000; // Minimum $1,000 per project
  return budget >= MIN_BUDGET;
}

/**
 * Validate budget overage
 * 
 * @description Checks if spending exceeds allocated budget by allowable margin.
 * Allows 10% overage (110% of allocated), industry standard for cost overruns.
 * 
 * @example
 * ```typescript
 * validateBudgetOverage(10000, 9000)   // true (90% spent, valid)
 * validateBudgetOverage(10000, 11000)  // true (110% spent, valid overage)
 * validateBudgetOverage(10000, 12000)  // false (120% spent, exceeds overage)
 * ```
 * 
 * @param budgetAllocated - Total budget allocated
 * @param budgetSpent - Total budget spent
 * @returns True if spending is within allowable range
 */
export function validateBudgetOverage(
  budgetAllocated: number,
  budgetSpent: number
): boolean {
  const MAX_OVERAGE_PERCENT = 1.10; // 110% allowed
  return budgetSpent <= budgetAllocated * MAX_OVERAGE_PERCENT;
}

/**
 * Get complexity multiplier
 * 
 * @description Returns performance gain multiplier for research complexity.
 * Used in performance gain calculations (reused from legacy).
 * 
 * @example
 * ```typescript
 * getComplexityMultiplier('Low')    // 0.5x
 * getComplexityMultiplier('Medium') // 1.0x
 * getComplexityMultiplier('High')   // 1.8x
 * ```
 * 
 * @param complexity - Research complexity level
 * @returns Multiplier for performance gain calculations
 */
export function getComplexityMultiplier(complexity: ResearchComplexity): number {
  const multipliers: Record<ResearchComplexity, number> = {
    Low: 0.5,
    Medium: 1.0,
    High: 1.8,
  };
  return multipliers[complexity];
}

/**
 * Validate researcher count
 * 
 * @description Ensures research project has valid number of researchers.
 * Minimum 1, maximum 10 (prevents over-staffing and under-staffing).
 * 
 * @example
 * ```typescript
 * validateResearcherCount(5)  // true (5 researchers valid)
 * validateResearcherCount(0)  // false (need at least 1)
 * validateResearcherCount(15) // false (exceeds max 10)
 * ```
 * 
 * @param count - Number of assigned researchers
 * @returns True if count is within valid range
 */
export function validateResearcherCount(count: number): boolean {
  const MIN_RESEARCHERS = 1;
  const MAX_RESEARCHERS = 10;
  return count >= MIN_RESEARCHERS && count <= MAX_RESEARCHERS;
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Pure Functions**: Zero side effects, predictable outputs
 * 2. **Reuse Constants**: SIZE_THRESHOLDS match legacy AIModel.ts exactly
 * 3. **Error Prevention**: Validates before database operations
 * 4. **Type Safety**: TypeScript ensures correct parameter types
 * 5. **Industry Standards**: 10% budget overage, 1-10 researchers per project
 * 
 * PREVENTS:
 * - Invalid size-parameter mappings (Small model with 100B params)
 * - Budget overruns > 110% (financial chaos)
 * - Progress overflow (training > 100%)
 * - Under-funded projects (< $1,000 budget)
 * - Over/under-staffed research teams
 * 
 * REUSE:
 * - Shares validation approach with utils/validation.ts (Zod schemas)
 * - Reuses constants.ts pattern (centralized thresholds)
 * - Follows Department utility patterns (pure functions, no DB access)
 */
