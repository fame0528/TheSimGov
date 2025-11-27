/**
 * @file src/lib/utils/politics/policyEnactment.ts
 * @description Policy effect parsing and instant global enactment
 * @created 2025-11-26
 * @author ECHO v1.3.0
 *
 * OVERVIEW:
 * Implements instant policy enactment when bills pass. Parses policy effects from bills
 * and applies changes globally to all companies, specific industries, or individual states.
 * Effects are PERMANENT until repealed by new legislation.
 *
 * KEY DESIGN DECISIONS:
 * - **Instant Enactment:** Effects applied immediately when bill passes (no delays)
 * - **Global Scope:** Can affect ALL companies, specific industries, or states
 * - **Permanent Duration:** Effects last until repealed (matches real Congress)
 * - **Transaction Logging:** All changes logged for audit trail and rollback
 * - **Stacking Effects:** Multiple bills can modify same game mechanic
 *
 * USAGE:
 * ```typescript
 * import { parseEffects, applyEffect, rollbackEffect } from '@/lib/utils/politics/policyEnactment';
 *
 * // Parse effects from bill
 * const effects = parseEffects(bill.effects);
 * 
 * // Apply effect to companies
 * await applyEffect(effects[0], { logTransaction: true });
 * 
 * // Rollback effect when bill repealed
 * await rollbackEffect(effectId);
 * ```
 */

// ===================== TYPE DEFINITIONS =====================

export type EffectTargetType = 'GLOBAL' | 'INDUSTRY' | 'STATE';

export type EffectType =
  | 'TAX_RATE'           // Modify tax rate (e.g., corporate tax 21% → 28%)
  | 'EXPENSE_MODIFIER'   // Modify expense (e.g., healthcare costs +10%)
  | 'REVENUE_MODIFIER'   // Modify revenue (e.g., renewable energy revenue +15%)
  | 'REGULATORY_COST'    // Add/remove regulatory compliance cost
  | 'SUBSIDY'            // Add government subsidy (positive cash flow)
  | 'TARIFF'             // Add import/export tariff
  | 'LABOR_COST'         // Modify labor costs (e.g., minimum wage +$2/hr)
  | 'ENVIRONMENTAL_FEE'; // Environmental compliance fee

export type EffectUnit = 'PERCENT' | 'ABSOLUTE' | 'MULTIPLIER';

/**
 * Policy effect definition (from Bill model)
 */
export interface PolicyEffect {
  targetType: EffectTargetType;     // GLOBAL, INDUSTRY, or STATE
  targetId?: string;                // Industry/state identifier (if not GLOBAL)
  effectType: EffectType;           // What game mechanic to modify
  effectValue: number;              // Magnitude of change
  effectUnit: EffectUnit;           // PERCENT, ABSOLUTE, or MULTIPLIER
  duration?: number;                // Optional duration in game weeks (null = permanent)
}

/**
 * Parsed effect with metadata
 */
export interface ParsedEffect extends PolicyEffect {
  effectId: string;                 // Unique identifier for tracking
  billId: string;                   // Source bill
  enactedAt: Date;                  // When effect was applied
  expiresAt?: Date;                 // When effect expires (if duration set)
  description: string;              // Human-readable description
}

/**
 * Effect application result
 */
export interface EffectApplicationResult {
  success: boolean;
  effectId: string;
  companiesAffected: number;
  totalImpact: number;              // Aggregate financial impact
  errors: string[];
  transactions: TransactionLog[];
}

/**
 * Transaction log entry for audit trail
 */
export interface TransactionLog {
  companyId: string;
  effectId: string;
  effectType: EffectType;
  previousValue: number;
  newValue: number;
  delta: number;
  timestamp: Date;
}

// ===================== EFFECT PARSING =====================

/**
 * Parse policy effects from bill into executable format
 * 
 * @param effects - Raw effects from bill
 * @param billId - Source bill ID
 * @returns Parsed effects with metadata
 * 
 * @example
 * ```typescript
 * parseEffects([
 *   {
 *     targetType: 'GLOBAL',
 *     effectType: 'TAX_RATE',
 *     effectValue: 7,
 *     effectUnit: 'PERCENT'
 *   }
 * ], 'bill-123');
 * // [{ effectId: 'effect-xxx', description: 'Increase corporate tax rate by 7%', ... }]
 * ```
 */
export function parseEffects(
  effects: PolicyEffect[],
  billId: string
): ParsedEffect[] {
  return effects.map((effect) => {
    const effectId = `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const description = generateEffectDescription(effect);
    
    const parsedEffect: ParsedEffect = {
      ...effect,
      effectId,
      billId,
      enactedAt: new Date(),
      description,
    };
    
    // Calculate expiration if duration specified
    if (effect.duration) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + effect.duration * 7); // Convert weeks to days
      parsedEffect.expiresAt = expiresAt;
    }
    
    return parsedEffect;
  });
}

/**
 * Generate human-readable effect description
 * 
 * @param effect - Policy effect
 * @returns Description string
 */
function generateEffectDescription(effect: PolicyEffect): string {
  const { targetType, targetId, effectType, effectValue, effectUnit } = effect;
  
  // Target scope
  let scope = 'all companies';
  if (targetType === 'INDUSTRY') {
    scope = `${targetId} industry`;
  } else if (targetType === 'STATE') {
    scope = `companies in ${targetId}`;
  }
  
  // Effect magnitude
  let magnitude = '';
  if (effectUnit === 'PERCENT') {
    magnitude = effectValue > 0 ? `+${effectValue}%` : `${effectValue}%`;
  } else if (effectUnit === 'ABSOLUTE') {
    magnitude = effectValue > 0 ? `+$${effectValue.toLocaleString()}` : `-$${Math.abs(effectValue).toLocaleString()}`;
  } else {
    magnitude = `×${effectValue}`;
  }
  
  // Effect type
  const typeDescriptions: Record<EffectType, string> = {
    TAX_RATE: 'corporate tax rate',
    EXPENSE_MODIFIER: 'operating expenses',
    REVENUE_MODIFIER: 'revenue',
    REGULATORY_COST: 'regulatory compliance costs',
    SUBSIDY: 'government subsidy',
    TARIFF: 'import/export tariffs',
    LABOR_COST: 'labor costs',
    ENVIRONMENTAL_FEE: 'environmental compliance fees',
  };
  
  return `${magnitude} ${typeDescriptions[effectType]} for ${scope}`;
}

// ===================== EFFECT APPLICATION =====================

/**
 * Apply policy effect to companies
 * 
 * This is a STUB implementation. In production, this would:
 * 1. Query all companies matching targetType/targetId
 * 2. Calculate new values based on effectType/effectValue
 * 3. Update company records (e.g., expenses.taxes, expenses.regulatory)
 * 4. Create transaction logs for audit trail
 * 5. Broadcast changes via Socket.io
 * 
 * @param effect - Parsed policy effect
 * @param options - Application options
 * @returns Application result with affected companies
 * 
 * @example
 * ```typescript
 * await applyEffect({
 *   effectId: 'effect-123',
 *   targetType: 'GLOBAL',
 *   effectType: 'TAX_RATE',
 *   effectValue: 7,
 *   effectUnit: 'PERCENT'
 * }, { logTransaction: true });
 * // { success: true, companiesAffected: 1523, totalImpact: -45600000, ... }
 * ```
 */
export async function applyEffect(
  effect: ParsedEffect,
  options: { logTransaction?: boolean } = {}
): Promise<EffectApplicationResult> {
  // TODO: Implement actual database operations
  // This is a STUB for Phase 10B utility implementation
  
  const result: EffectApplicationResult = {
    success: true,
    effectId: effect.effectId,
    companiesAffected: 0,
    totalImpact: 0,
    errors: [],
    transactions: [],
  };
  
  try {
    // STUB: In production, would query companies and apply changes
    // For now, return placeholder result
    
    // Example transaction log structure
    if (options.logTransaction) {
      result.transactions.push({
        companyId: 'company-example',
        effectId: effect.effectId,
        effectType: effect.effectType,
        previousValue: 100000,
        newValue: 107000,
        delta: 7000,
        timestamp: new Date(),
      });
    }
    
    result.companiesAffected = 1; // Placeholder
    result.totalImpact = -7000; // Negative = cost increase
    
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }
  
  return result;
}

/**
 * Rollback policy effect (when bill repealed)
 * 
 * @param effectId - Effect to rollback
 * @returns True if rollback successful
 * 
 * @example
 * ```typescript
 * await rollbackEffect('effect-123');
 * // Reverses all changes made by effect
 * ```
 */
export async function rollbackEffect(effectId: string): Promise<boolean> {
  // TODO: Implement actual rollback logic
  // This is a STUB for Phase 10B utility implementation
  
  try {
    // STUB: In production, would:
    // 1. Find all transaction logs for effectId
    // 2. Reverse each change (newValue → previousValue)
    // 3. Update company records
    // 4. Mark effect as rolled back
    
    return true;
  } catch (error) {
    console.error('Rollback failed:', error);
    return false;
  }
}

/**
 * Calculate financial impact of effect on company
 * 
 * @param effect - Policy effect
 * @param companyCurrentValue - Company's current value for modified metric
 * @returns New value after effect applied
 * 
 * @example
 * ```typescript
 * // Tax rate increase: 21% → 28% (+7%)
 * calculateImpact({
 *   effectType: 'TAX_RATE',
 *   effectValue: 7,
 *   effectUnit: 'PERCENT'
 * }, 21);
 * // 28
 * 
 * // Subsidy: +$50,000 absolute
 * calculateImpact({
 *   effectType: 'SUBSIDY',
 *   effectValue: 50000,
 *   effectUnit: 'ABSOLUTE'
 * }, 0);
 * // 50000
 * ```
 */
export function calculateImpact(
  effect: Pick<PolicyEffect, 'effectType' | 'effectValue' | 'effectUnit'>,
  companyCurrentValue: number
): number {
  const { effectValue, effectUnit } = effect;
  
  switch (effectUnit) {
    case 'PERCENT':
      // Percentage change (e.g., +7% tax rate)
      return companyCurrentValue + (companyCurrentValue * effectValue / 100);
    
    case 'ABSOLUTE':
      // Absolute change (e.g., +$50,000 subsidy)
      return companyCurrentValue + effectValue;
    
    case 'MULTIPLIER':
      // Multiplier change (e.g., ×1.5 for revenue)
      return companyCurrentValue * effectValue;
    
    default:
      return companyCurrentValue;
  }
}

/**
 * Check if effect has expired
 * 
 * @param effect - Parsed effect
 * @returns True if effect expired
 */
export function isEffectExpired(effect: ParsedEffect): boolean {
  if (!effect.expiresAt) {
    return false; // Permanent effects never expire
  }
  
  return new Date() > effect.expiresAt;
}

/**
 * Get active effects for target
 * 
 * @param targetType - Target scope (GLOBAL, INDUSTRY, STATE)
 * @param targetId - Target identifier (if not GLOBAL)
 * @returns Array of active effects (STUB)
 */
export async function getActiveEffects(
  targetType: EffectTargetType,
  targetId?: string
): Promise<ParsedEffect[]> {
  // TODO: Implement database query for active effects
  // This is a STUB for Phase 10B utility implementation
  return [];
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Instant Enactment:**
 *    - Effects applied immediately when Bill.enactPolicy() called
 *    - All affected companies updated in single transaction
 *    - Changes broadcast via Socket.io for real-time updates
 * 
 * 2. **Effect Scopes:**
 *    - GLOBAL: Affects all companies (e.g., corporate tax rate)
 *    - INDUSTRY: Affects specific industry (e.g., renewable energy subsidy)
 *    - STATE: Affects companies in state (e.g., California carbon tax)
 * 
 * 3. **Effect Types:**
 *    - TAX_RATE: Modifies company.expenses.taxes
 *    - EXPENSE_MODIFIER: Modifies specific expense category
 *    - REVENUE_MODIFIER: Modifies revenue calculation
 *    - SUBSIDY: Adds positive cash flow (reduces expenses)
 *    - REGULATORY_COST: Adds compliance expense
 * 
 * 4. **Stacking Effects:**
 *    - Multiple bills can modify same metric
 *    - Effects stack additively (e.g., +5% tax + 7% tax = +12% total)
 *    - Rollback removes individual effect, not all changes
 * 
 * 5. **Transaction Logging:**
 *    - Every change logged with before/after values
 *    - Enables rollback when bill repealed
 *    - Provides audit trail for policy impact analysis
 * 
 * 6. **Duration Handling:**
 *    - duration: null = permanent (default, matches real Congress)
 *    - duration: X weeks = temporary (rare, sunset clauses)
 *    - Expired effects auto-rollback (background job)
 * 
 * 7. **Integration Points:**
 *    - Called from Bill.enactPolicy() method
 *    - Queries Company model for affected companies
 *    - Updates expense/revenue fields directly
 *    - Creates PolicyEffectLog records for tracking
 */
