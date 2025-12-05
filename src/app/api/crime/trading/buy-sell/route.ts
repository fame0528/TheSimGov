/**
 * @fileoverview Trading API - Buy/Sell drugs from NPCs
 * @module app/api/crime/trading/route
 * 
 * OVERVIEW:
 * Handles street trading transactions with NPCs:
 * - POST: Execute buy or sell transaction
 * 
 * Trading mechanics:
 * - Buy: Spend cash, gain inventory, gain heat, gain XP
 * - Sell: Lose inventory, gain cash, gain heat, gain XP
 * - Prices from StatePricing for current state
 * - Heat increases with transaction size
 * - XP based on profit/quantity
 * 
 * All data stored on User model (User.cash, User.crime subdocument)
 * 
 * @created 2025-12-04
 * @author ECHO v1.4.0 FLAWLESS PROTOCOL
 */

import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models';
import { StatePricing } from '@/lib/db/models/crime/StatePricing';
import { rateLimitRequest } from '@/lib/utils/rateLimit';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { z } from 'zod';
import type { SubstanceName, StateCode } from '@/lib/types/crime';
import type { TradeResult, CrimePlayerDTO } from '@/lib/types/crime-mmo';
import { calculateLevelFromExperience, getUnlockedSubstances, getCarryCapacityForLevel } from '@/lib/types/crime-mmo';

/**
 * Trade request validation schema
 */
const tradeRequestSchema = z.object({
  action: z.enum(['buy', 'sell']),
  substance: z.enum([
    'Cannabis', 'Cocaine', 'Heroin', 'Methamphetamine', 
    'MDMA', 'LSD', 'Psilocybin', 'Fentanyl', 'Oxycodone'
  ]),
  quantity: z.number().int().min(1).max(1000),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UserDoc = any;

/**
 * Map User document to CrimePlayerDTO
 */
function mapUserToCrimeDTO(user: UserDoc): CrimePlayerDTO {
  const crime = user.crime || {};
  const inventory = crime.inventory || [];
  const inventoryUsed = inventory.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
  const carryCapacity = crime.carryCapacity ?? 50;
  
  return {
    id: String(user._id),
    cash: user.cash ?? 0,
    bankBalance: user.bankBalance ?? 0,
    currentState: user.state as StateCode,
    currentCity: crime.currentCity ?? 'Unknown',
    heat: crime.heat ?? 0,
    reputation: crime.reputation ?? 0,
    carryCapacity,
    inventory: inventory,
    level: crime.level ?? 1,
    experience: crime.experience ?? 0,
    unlockedSubstances: crime.unlockedSubstances ?? ['Cannabis'],
    totalProfit: crime.totalProfit ?? 0,
    totalDeals: crime.totalDeals ?? 0,
    successfulDeals: crime.successfulDeals ?? 0,
    timesArrested: crime.timesArrested ?? 0,
    timesMugged: crime.timesMugged ?? 0,
    lastActiveAt: crime.lastActiveAt ?? new Date(),
    inventoryUsed,
    inventoryAvailable: Math.max(0, carryCapacity - inventoryUsed),
  };
}

/**
 * Calculate heat gain from transaction
 */
function calculateHeatGain(quantity: number, substance: SubstanceName): number {
  const baseHeat: Record<SubstanceName, number> = {
    Cannabis: 0.05,
    Psilocybin: 0.08,
    MDMA: 0.1,
    LSD: 0.1,
    Cocaine: 0.15,
    Methamphetamine: 0.2,
    Oxycodone: 0.15,
    Heroin: 0.25,
    Fentanyl: 0.35,
  };
  
  return Math.min(20, quantity * (baseHeat[substance] ?? 0.1));
}

/**
 * Calculate XP gain from transaction
 */
function calculateXPGain(quantity: number, profit: number): number {
  const baseXP = quantity * 2;
  const profitBonus = Math.max(0, Math.floor(profit / 10));
  return baseXP + profitBonus;
}

/**
 * Initialize crime data on user if not present
 */
function ensureCrimeData(user: UserDoc): void {
  if (!user.crime) {
    user.crime = {
      currentCity: 'Los Angeles',
      heat: 0,
      reputation: 0,
      carryCapacity: getCarryCapacityForLevel(1),
      inventory: [],
      level: 1,
      experience: 0,
      unlockedSubstances: getUnlockedSubstances(1),
      totalProfit: 0,
      totalDeals: 0,
      successfulDeals: 0,
      timesArrested: 0,
      timesMugged: 0,
      lastActiveAt: new Date(),
    };
  }
}

/**
 * POST /api/crime/trading/buy-sell - Execute buy/sell transaction
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  const rl = await rateLimitRequest(request, session.user.id, { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) {
    return createErrorResponse('Too Many Requests', ErrorCode.RATE_LIMIT, 429, rl.headers);
  }

  try {
    const body = await request.json();
    const parsed = tradeRequestSchema.safeParse(body);
    
    if (!parsed.success) {
      return createErrorResponse(parsed.error.message, ErrorCode.VALIDATION_ERROR, 422, rl.headers);
    }

    const { action, substance, quantity } = parsed.data;

    await connectDB();

    // Get user with all data
    const user = await User.findById(session.user.id);
    if (!user) {
      return createErrorResponse('User not found', ErrorCode.NOT_FOUND, 404, rl.headers);
    }

    // Ensure crime data exists
    ensureCrimeData(user);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const crime = user.crime!;

    // Check if substance is unlocked
    if (!crime.unlockedSubstances.includes(substance)) {
      return createErrorResponse(
        `${substance} not unlocked. Reach higher level to unlock.`,
        ErrorCode.FORBIDDEN, 
        403, 
        rl.headers
      );
    }

    // Get state pricing
    const pricing = await StatePricing.findOne({ state: user.state });
    if (!pricing) {
      return createErrorResponse('Pricing data not available for this state.', ErrorCode.NOT_FOUND, 404, rl.headers);
    }

    const substancePrice = pricing.prices.find(p => p.substance === substance);
    if (!substancePrice) {
      return createErrorResponse('Substance not available in this market.', ErrorCode.NOT_FOUND, 404, rl.headers);
    }

    const pricePerUnit = substancePrice.currentPrice;
    const totalAmount = pricePerUnit * quantity;
    let result: TradeResult;

    if (action === 'buy') {
      // Check if player can afford
      if (user.cash < totalAmount) {
        result = {
          success: false,
          action: 'buy',
          substance,
          quantity,
          pricePerUnit,
          totalAmount,
          heatChange: 0,
          experienceGained: 0,
          error: `Insufficient cash. Need $${totalAmount.toFixed(2)}, have $${user.cash.toFixed(2)}`,
        };
        return createSuccessResponse(result, {}, 200);
      }

      // Check carry capacity
      const currentLoad = crime.inventory.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
      if (currentLoad + quantity > crime.carryCapacity) {
        result = {
          success: false,
          action: 'buy',
          substance,
          quantity,
          pricePerUnit,
          totalAmount,
          heatChange: 0,
          experienceGained: 0,
          error: `Insufficient capacity. Need ${quantity}, have ${crime.carryCapacity - currentLoad} available.`,
        };
        return createSuccessResponse(result, {}, 200);
      }

      // Execute buy: subtract cash, add to inventory
      user.cash -= totalAmount;
      
      // Find existing inventory item or create new
      const existingItem = crime.inventory.find((i: { substance: string }) => i.substance === substance);
      if (existingItem) {
        const totalQty = existingItem.quantity + quantity;
        const totalCost = (existingItem.avgPurchasePrice * existingItem.quantity) + totalAmount;
        existingItem.avgPurchasePrice = totalCost / totalQty;
        existingItem.quantity = totalQty;
      } else {
        crime.inventory.push({
          substance,
          quantity,
          quality: 70 + Math.floor(Math.random() * 20),
          avgPurchasePrice: pricePerUnit,
          acquiredAt: new Date(),
        });
      }

      // Update stats
      const heatGain = calculateHeatGain(quantity, substance);
      const xpGain = calculateXPGain(quantity, 0);
      
      crime.heat = Math.min(100, crime.heat + heatGain);
      crime.experience += xpGain;
      crime.totalDeals += 1;
      crime.lastActiveAt = new Date();

      // Check for level up
      const newLevel = calculateLevelFromExperience(crime.experience);
      if (newLevel > crime.level) {
        crime.level = newLevel;
        crime.carryCapacity = getCarryCapacityForLevel(newLevel);
        crime.unlockedSubstances = getUnlockedSubstances(newLevel);
      }

      await user.save();

      result = {
        success: true,
        action: 'buy',
        substance,
        quantity,
        pricePerUnit,
        totalAmount,
        heatChange: heatGain,
        experienceGained: xpGain,
        updatedStash: mapUserToCrimeDTO(user),
      };

    } else {
      // SELL action
      const itemIndex = crime.inventory.findIndex((i: { substance: string }) => i.substance === substance);
      if (itemIndex === -1 || crime.inventory[itemIndex].quantity < quantity) {
        const available = itemIndex >= 0 ? crime.inventory[itemIndex].quantity : 0;
        result = {
          success: false,
          action: 'sell',
          substance,
          quantity,
          pricePerUnit,
          totalAmount,
          heatChange: 0,
          experienceGained: 0,
          error: `Insufficient inventory. Have ${available} ${substance}, need ${quantity}.`,
        };
        return createSuccessResponse(result, {}, 200);
      }

      const item = crime.inventory[itemIndex];
      const profit = (pricePerUnit - item.avgPurchasePrice) * quantity;

      // Execute sell: add cash, subtract inventory
      user.cash += totalAmount;
      item.quantity -= quantity;

      // Remove item if quantity is 0
      if (item.quantity <= 0) {
        crime.inventory.splice(itemIndex, 1);
      }

      // Update stats
      const heatGain = calculateHeatGain(quantity, substance);
      const xpGain = calculateXPGain(quantity, profit);
      
      crime.heat = Math.min(100, crime.heat + heatGain);
      crime.experience += xpGain;
      crime.totalDeals += 1;
      crime.successfulDeals += 1;
      crime.totalProfit += profit;
      crime.reputation = Math.min(100, crime.reputation + Math.floor(profit / 100));
      crime.lastActiveAt = new Date();

      // Check for level up
      const newLevel = calculateLevelFromExperience(crime.experience);
      if (newLevel > crime.level) {
        crime.level = newLevel;
        crime.carryCapacity = getCarryCapacityForLevel(newLevel);
        crime.unlockedSubstances = getUnlockedSubstances(newLevel);
      }

      await user.save();

      result = {
        success: true,
        action: 'sell',
        substance,
        quantity,
        pricePerUnit,
        totalAmount,
        heatChange: heatGain,
        experienceGained: xpGain,
        updatedStash: mapUserToCrimeDTO(user),
      };
    }

    return createSuccessResponse(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('querySrv')) {
      return createErrorResponse('Service unavailable (DB DNS error)', ErrorCode.INTERNAL_ERROR, 503, rl.headers);
    }
    console.error('POST /crime/trading error', err);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500, rl.headers);
  }
}
