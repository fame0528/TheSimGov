/**
 * @fileoverview Crime Trading MMO Data Hooks
 * @module hooks/useCrimeTrading
 * 
 * OVERVIEW:
 * SWR-based data fetching hooks for Street Trading MMO operations.
 * Provides hooks for player stash, state pricing, trading, and travel.
 * All hooks return ResponseEnvelope<T> for consistent error handling.
 * 
 * @created 2025-12-04
 * @author ECHO v1.4.0 FLAWLESS PROTOCOL
 */

'use client';

import { useState, useCallback } from 'react';
import { useAPI, type UseAPIOptions } from '@/lib/hooks/useAPI';
import { crimeEndpoints } from '@/lib/api/endpoints';
import type { ResponseEnvelope } from '@/lib/dto/crime';
import type { StateCode, SubstanceName } from '@/lib/types/crime';
import type {
  PlayerStashDTO,
  StatePricingDTO,
  TradeResult,
  TravelResult,
  TradeAction,
} from '@/lib/types/crime-mmo';

// ============================================================
// PLAYER STASH HOOKS
// ============================================================

/**
 * Fetch current player's stash (inventory, cash, location, stats)
 * 
 * @param options - SWR options
 * @returns ResponseEnvelope containing PlayerStashDTO
 * 
 * @example
 * ```typescript
 * const { data, isLoading, refetch } = usePlayerStash();
 * if (data?.success) {
 *   console.log('Cash:', data.data.cash);
 *   console.log('Location:', data.data.currentState);
 * }
 * ```
 */
export function usePlayerStash(options?: UseAPIOptions) {
  return useAPI<ResponseEnvelope<PlayerStashDTO>>(
    crimeEndpoints.stash.get,
    options
  );
}

/**
 * Initialize a new player stash (first-time setup)
 * 
 * @returns Mutation function and state
 */
export function useInitializeStash() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ResponseEnvelope<PlayerStashDTO> | null>(null);

  const initializeStash = useCallback(async (): Promise<ResponseEnvelope<PlayerStashDTO>> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(crimeEndpoints.stash.initialize, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      const result = await response.json() as ResponseEnvelope<PlayerStashDTO>;
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize stash');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    initializeStash,
    data,
    isLoading,
    error,
  };
}

// ============================================================
// STATE PRICING HOOKS
// ============================================================

/**
 * Fetch pricing for a specific state
 * 
 * @param state - State code to fetch pricing for
 * @param options - SWR options
 * @returns ResponseEnvelope containing StatePricingDTO
 * 
 * @example
 * ```typescript
 * const { data } = useStatePricing('CA');
 * if (data?.success) {
 *   data.data.prices.forEach(p => {
 *     console.log(`${p.substance}: $${p.currentPrice}`);
 *   });
 * }
 * ```
 */
export function useStatePricing(
  state: StateCode | null,
  options?: UseAPIOptions
) {
  const url = state ? crimeEndpoints.pricing.byState(state) : null;
  return useAPI<ResponseEnvelope<StatePricingDTO>>(url, options);
}

/**
 * Fetch pricing for all states (market overview)
 * 
 * @param enabled - Whether to fetch
 * @param options - SWR options
 * @returns ResponseEnvelope containing StatePricingDTO array
 */
export function useAllStatePricing(
  enabled: boolean = true,
  options?: UseAPIOptions
) {
  const url = enabled ? crimeEndpoints.pricing.all : null;
  return useAPI<ResponseEnvelope<StatePricingDTO[]>>(url, options);
}

// ============================================================
// TRADING HOOKS
// ============================================================

/**
 * Trade request parameters
 */
export interface TradeParams {
  action: TradeAction;
  substance: SubstanceName;
  quantity: number;
  state: StateCode;
}

/**
 * Execute a buy/sell trade
 * 
 * @returns Mutation function and state
 * 
 * @example
 * ```typescript
 * const { executeTrade, isLoading } = useTrade();
 * 
 * const result = await executeTrade({
 *   action: 'buy',
 *   substance: 'Cannabis',
 *   quantity: 10,
 *   state: 'CA'
 * });
 * 
 * if (result.success) {
 *   console.log('Trade complete:', result.data);
 * }
 * ```
 */
export function useTrade() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ResponseEnvelope<TradeResult> | null>(null);

  const executeTrade = useCallback(async (params: TradeParams): Promise<ResponseEnvelope<TradeResult>> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(crimeEndpoints.trading.buySell, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(params),
      });
      
      const result = await response.json() as ResponseEnvelope<TradeResult>;
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Trade failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return {
    executeTrade,
    data,
    isLoading,
    error,
    reset,
  };
}

// ============================================================
// TRAVEL HOOKS
// ============================================================

/**
 * Travel request parameters
 */
export interface TravelParams {
  toState: StateCode;
  toCity?: string;
}

/**
 * Execute travel to a new state
 * 
 * @returns Mutation function and state
 * 
 * @example
 * ```typescript
 * const { travel, isLoading } = useTravel();
 * 
 * const result = await travel({ toState: 'NY', toCity: 'New York City' });
 * 
 * if (result.success) {
 *   console.log('Arrived at:', result.data.newLocation);
 * }
 * ```
 */
export function useTravel() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ResponseEnvelope<TravelResult> | null>(null);

  const travel = useCallback(async (params: TravelParams): Promise<ResponseEnvelope<TravelResult>> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(crimeEndpoints.stash.travel, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(params),
      });
      
      const result = await response.json() as ResponseEnvelope<TravelResult>;
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Travel failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return {
    travel,
    data,
    isLoading,
    error,
    reset,
  };
}

// ============================================================
// COMBINED TRADING DASHBOARD HOOK
// ============================================================

/**
 * Combined hook for trading dashboard - stash + current location pricing
 * 
 * @param options - SWR options
 * @returns Combined state for trading UI
 * 
 * @example
 * ```typescript
 * const { 
 *   stash, 
 *   pricing, 
 *   isLoading,
 *   trade,
 *   travel,
 *   refetch 
 * } = useTradingDashboard();
 * ```
 */
export function useTradingDashboard(options?: UseAPIOptions) {
  // Fetch player stash
  const {
    data: stashData,
    isLoading: stashLoading,
    error: stashError,
    refetch: refetchStash,
  } = usePlayerStash(options);

  // Extract stash - handle both envelope format and direct data
  // useAPI extracts response.data, so stashData could be:
  // 1. ResponseEnvelope<PlayerStashDTO> if API returns { data: envelope }
  // 2. PlayerStashDTO directly if API returns envelope at top level
  const stash: PlayerStashDTO | null = (() => {
    if (!stashData) return null;
    
    // Check if it's an envelope (has 'success' property)
    const envelope = stashData as unknown as { success?: boolean; data?: PlayerStashDTO | PlayerStashDTO[] };
    if (typeof envelope.success === 'boolean' && envelope.data) {
      return Array.isArray(envelope.data) ? envelope.data[0] : envelope.data;
    }
    
    // It's already PlayerStashDTO (has 'id' property)
    const dto = stashData as unknown as PlayerStashDTO;
    if (dto.id) {
      return dto;
    }
    
    return null;
  })();

  // Get current state from stash
  const currentState = stash?.currentState ?? null;

  // Fetch pricing for current state
  const {
    data: pricingData,
    isLoading: pricingLoading,
    error: pricingError,
    refetch: refetchPricing,
  } = useStatePricing(currentState, {
    ...options,
    enabled: !!currentState,
  });

  // Extract pricing - handle both envelope format and direct data
  const pricing: StatePricingDTO | null = (() => {
    if (!pricingData) return null;
    
    // Check if it's an envelope (has 'success' property)
    const envelope = pricingData as unknown as { success?: boolean; data?: StatePricingDTO | StatePricingDTO[] };
    if (typeof envelope.success === 'boolean' && envelope.data) {
      return Array.isArray(envelope.data) ? envelope.data[0] : envelope.data;
    }
    
    // It's already StatePricingDTO (has 'state' property)
    const dto = pricingData as unknown as StatePricingDTO;
    if (dto.state) {
      return dto;
    }
    
    return null;
  })();

  // Trading mutation
  const tradeMutation = useTrade();
  
  // Travel mutation
  const travelMutation = useTravel();

  // Combined refetch
  const refetch = useCallback(async () => {
    await Promise.all([refetchStash(), refetchPricing()]);
  }, [refetchStash, refetchPricing]);

  return {
    // Data (properly typed as single objects)
    stash,
    pricing,
    
    // Loading states
    isLoading: stashLoading || pricingLoading,
    stashLoading,
    pricingLoading,
    
    // Errors
    error: stashError || pricingError,
    stashError,
    pricingError,
    
    // Mutations
    trade: tradeMutation,
    travel: travelMutation,
    
    // Refetch
    refetch,
    refetchStash,
    refetchPricing,
  };
}

// ============================================================
// UTILITY HOOKS
// ============================================================

/**
 * Calculate profit/loss for a potential trade
 * 
 * @param stash - Current player stash
 * @param pricing - Current state pricing
 * @param substance - Substance to trade
 * @param action - Buy or sell
 * @param quantity - Number of units
 * @returns Calculated profit/loss info
 */
export function calculateTradePotential(
  stash: PlayerStashDTO | null,
  pricing: StatePricingDTO | null,
  substance: SubstanceName,
  action: TradeAction,
  quantity: number
): {
  canExecute: boolean;
  totalCost: number;
  unitPrice: number;
  profitLoss: number;
  reason?: string;
} {
  if (!stash || !pricing) {
    return {
      canExecute: false,
      totalCost: 0,
      unitPrice: 0,
      profitLoss: 0,
      reason: 'Data not loaded',
    };
  }

  const priceEntry = pricing.prices.find(p => p.substance === substance);
  if (!priceEntry) {
    return {
      canExecute: false,
      totalCost: 0,
      unitPrice: 0,
      profitLoss: 0,
      reason: 'Substance not available in this state',
    };
  }

  const unitPrice = priceEntry.currentPrice;
  const totalCost = unitPrice * quantity;

  if (action === 'buy') {
    // Check if player can afford
    if (stash.cash < totalCost) {
      return {
        canExecute: false,
        totalCost,
        unitPrice,
        profitLoss: 0,
        reason: `Insufficient cash. Need $${totalCost.toLocaleString()}, have $${stash.cash.toLocaleString()}`,
      };
    }
    
    // Check carry capacity
    if (stash.inventoryUsed + quantity > stash.carryCapacity) {
      return {
        canExecute: false,
        totalCost,
        unitPrice,
        profitLoss: 0,
        reason: `Insufficient capacity. Need ${quantity}, have ${stash.inventoryAvailable} available`,
      };
    }

    return {
      canExecute: true,
      totalCost,
      unitPrice,
      profitLoss: 0, // Unknown until sold
    };
  } else {
    // Sell - check inventory
    const inventoryItem = stash.inventory.find(i => i.substance === substance);
    if (!inventoryItem || inventoryItem.quantity < quantity) {
      return {
        canExecute: false,
        totalCost,
        unitPrice,
        profitLoss: 0,
        reason: `Insufficient inventory. Need ${quantity}, have ${inventoryItem?.quantity ?? 0}`,
      };
    }

    // Calculate profit
    const avgPurchasePrice = inventoryItem.avgPurchasePrice;
    const profitLoss = (unitPrice - avgPurchasePrice) * quantity;

    return {
      canExecute: true,
      totalCost,
      unitPrice,
      profitLoss,
    };
  }
}

/**
 * Get best prices for a substance across all states
 * 
 * @param allPricing - All state pricing data
 * @param substance - Substance to check
 * @returns Best buy and sell locations
 */
export function findBestPrices(
  allPricing: StatePricingDTO[] | null,
  substance: SubstanceName
): {
  bestBuy: { state: StateCode; price: number } | null;
  bestSell: { state: StateCode; price: number } | null;
  spread: number;
} {
  if (!allPricing || allPricing.length === 0) {
    return { bestBuy: null, bestSell: null, spread: 0 };
  }

  let bestBuy: { state: StateCode; price: number } | null = null;
  let bestSell: { state: StateCode; price: number } | null = null;

  for (const statePricing of allPricing) {
    const priceEntry = statePricing.prices.find(p => p.substance === substance);
    if (!priceEntry) continue;

    const price = priceEntry.currentPrice;

    if (!bestBuy || price < bestBuy.price) {
      bestBuy = { state: statePricing.state, price };
    }

    if (!bestSell || price > bestSell.price) {
      bestSell = { state: statePricing.state, price };
    }
  }

  const spread = bestBuy && bestSell ? bestSell.price - bestBuy.price : 0;

  return { bestBuy, bestSell, spread };
}
