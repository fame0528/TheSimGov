/**
 * @file src/lib/game/tick/crimeProcessor.ts
 * @description Crime tick processor for game tick engine
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Processes time-based crime system events each game tick:
 * - Heat decay over time
 * - Drug price fluctuations
 * - Production facility output
 * - Distribution route completion
 * - Territory control changes
 * - Gang activity and turf wars
 *
 * GAMEPLAY IMPACT:
 * This drives the underground economy. Each tick:
 * - Player heat naturally decays (escape detection)
 * - Drug prices fluctuate based on supply/demand
 * - Production facilities generate product
 * - Distribution routes complete shipments
 * - Territories collect taxes
 *
 * @author ECHO v1.4.0
 */

import {
  ITickProcessor,
  GameTime,
  TickProcessorResult,
  TickProcessorOptions,
  TickError,
  CrimeTickSummary,
} from '@/lib/types/gameTick';
import mongoose from 'mongoose';

// ============================================================================
// CONSTANTS
// ============================================================================

const PROCESSOR_NAME = 'crime';
const PROCESSOR_PRIORITY = 40; // After main industries

// Heat decay rate per tick (percentage)
const HEAT_DECAY_RATE = 0.05; // 5% per tick
const MIN_HEAT_LEVEL = 0;
const MAX_HEAT_LEVEL = 100;

// Price volatility range (percentage change per tick)
const MIN_PRICE_CHANGE = -0.15; // -15%
const MAX_PRICE_CHANGE = 0.15;  // +15%

// ============================================================================
// TYPE DEFINITIONS FOR MODELS
// ============================================================================

interface IHeatLevelDoc extends mongoose.Document {
  scope: string;
  scopeId: string;
  current: number;
  factors: Array<{ source: string; delta: number; decay: number }>;
  lastDecay: Date;
}

interface IStatePricingDoc extends mongoose.Document {
  state: string;
  prices: Array<{
    substance: string;
    basePrice: number;
    currentPrice: number;
    trend: string;
    volatility: number;
    demand: number;
    supply: number;
    lastUpdate: Date;
  }>;
  lastUpdate: Date;
}

interface IProductionFacilityDoc extends mongoose.Document {
  ownerId: string;
  status: string;
  productionRate: number;
  inventory: number;
  operatingCosts: number;
}

interface IDistributionRouteDoc extends mongoose.Document {
  ownerId: string;
  status: string;
  riskLevel: number;
  profitMargin: number;
}

interface ITerritoryDoc extends mongoose.Document {
  controllerId: string;
  taxRate: number;
  monthlyRevenue: number;
}

interface IGangDoc extends mongoose.Document {
  leaderId: string;
  territory: string[];
  strength: number;
}

// ============================================================================
// LAZY MODEL LOADER
// ============================================================================

const getModels = () => ({
  HeatLevel: mongoose.models.HeatLevel as mongoose.Model<IHeatLevelDoc> | undefined,
  StatePricing: mongoose.models.StatePricing as mongoose.Model<IStatePricingDoc> | undefined,
  ProductionFacility: mongoose.models.ProductionFacility as mongoose.Model<IProductionFacilityDoc> | undefined,
  DistributionRoute: mongoose.models.DistributionRoute as mongoose.Model<IDistributionRouteDoc> | undefined,
  Territory: mongoose.models.Territory as mongoose.Model<ITerritoryDoc> | undefined,
  Gang: mongoose.models.Gang as mongoose.Model<IGangDoc> | undefined,
});

// ============================================================================
// CRIME PROCESSOR
// ============================================================================

/**
 * Crime tick processor
 * Handles all time-based crime system operations
 */
export class CrimeProcessor implements ITickProcessor {
  name = PROCESSOR_NAME;
  priority = PROCESSOR_PRIORITY;
  enabled = true;
  
  /**
   * Validate processor is ready
   */
  async validate(): Promise<true | string> {
    try {
      const models = getModels();
      // Check at least one crime model exists
      if (models.HeatLevel) {
        await models.HeatLevel.findOne().limit(1);
      }
      return true;
    } catch (error) {
      return `Database connection error: ${error instanceof Error ? error.message : 'Unknown'}`;
    }
  }
  
  /**
   * Process one tick for crime system
   */
  async process(
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<TickProcessorResult> {
    const startTime = Date.now();
    const errors: TickError[] = [];
    
    // Initialize summary counters
    const summary: CrimeTickSummary = {
      playersProcessed: 0,
      activeDealers: 0,
      heatDecayed: 0,
      avgHeatLevel: 0,
      playersArrested: 0,
      playersMugged: 0,
      pricesUpdated: 0,
      avgPriceChange: 0,
      bullMarkets: 0,
      bearMarkets: 0,
      facilitiesProcessed: 0,
      unitsProduced: 0,
      productionRevenue: 0,
      routesProcessed: 0,
      shipmentsCompleted: 0,
      shipmentsIntercepted: 0,
      territoriesProcessed: 0,
      territoryTaxCollected: 0,
      totalDeals: 0,
      totalProfit: 0,
    };
    
    try {
      const models = getModels();
      
      // Build query filter
      const baseQuery: Record<string, unknown> = {};
      if (options?.playerId) {
        baseQuery.scopeId = options.playerId;
      }
      
      // Process heat decay
      if (models.HeatLevel) {
        const heatResults = await this.processHeatDecay(
          models.HeatLevel,
          options
        );
        summary.playersProcessed = heatResults.processed;
        summary.heatDecayed = heatResults.totalDecayed;
        summary.avgHeatLevel = heatResults.avgHeat;
        summary.playersArrested = heatResults.arrests;
        errors.push(...heatResults.errors);
      }
      
      // Process price fluctuations
      if (models.StatePricing) {
        const priceResults = await this.processPriceFluctuations(
          models.StatePricing,
          options
        );
        summary.pricesUpdated = priceResults.updated;
        summary.avgPriceChange = priceResults.avgChange;
        summary.bullMarkets = priceResults.bullMarkets;
        summary.bearMarkets = priceResults.bearMarkets;
        errors.push(...priceResults.errors);
      }
      
      // Process production facilities
      if (models.ProductionFacility) {
        const prodResults = await this.processProduction(
          models.ProductionFacility,
          baseQuery,
          options
        );
        summary.facilitiesProcessed = prodResults.processed;
        summary.unitsProduced = prodResults.units;
        summary.productionRevenue = prodResults.revenue;
        summary.totalProfit += prodResults.profit;
        errors.push(...prodResults.errors);
      }
      
      // Process distribution routes
      if (models.DistributionRoute) {
        const distResults = await this.processDistribution(
          models.DistributionRoute,
          baseQuery,
          options
        );
        summary.routesProcessed = distResults.processed;
        summary.shipmentsCompleted = distResults.completed;
        summary.shipmentsIntercepted = distResults.intercepted;
        summary.totalProfit += distResults.profit;
        errors.push(...distResults.errors);
      }
      
      // Process territories
      if (models.Territory) {
        const territoryResults = await this.processTerritories(
          models.Territory,
          baseQuery,
          options
        );
        summary.territoriesProcessed = territoryResults.processed;
        summary.territoryTaxCollected = territoryResults.taxes;
        summary.totalProfit += territoryResults.taxes;
        errors.push(...territoryResults.errors);
      }
      
      const itemsProcessed = 
        summary.playersProcessed +
        summary.pricesUpdated +
        summary.facilitiesProcessed +
        summary.routesProcessed +
        summary.territoriesProcessed;
      
      return {
        processor: PROCESSOR_NAME,
        success: errors.filter(e => !e.recoverable).length === 0,
        itemsProcessed,
        errors,
        summary,
        durationMs: Date.now() - startTime,
      };
      
    } catch (error) {
      return {
        processor: PROCESSOR_NAME,
        success: false,
        itemsProcessed: 0,
        errors: [{
          entityId: 'system',
          entityType: 'CrimeProcessor',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: false,
        }],
        summary,
        durationMs: Date.now() - startTime,
      };
    }
  }
  
  // ==========================================================================
  // HEAT DECAY PROCESSING
  // ==========================================================================
  
  /**
   * Process heat decay for all players
   */
  private async processHeatDecay(
    model: mongoose.Model<IHeatLevelDoc>,
    options?: TickProcessorOptions
  ): Promise<{
    processed: number;
    totalDecayed: number;
    avgHeat: number;
    arrests: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let processed = 0;
    let totalDecayed = 0;
    let totalHeat = 0;
    let arrests = 0;
    
    try {
      // Get all heat levels (or filter by player)
      const query: Record<string, unknown> = {};
      if (options?.playerId) {
        query.scopeId = options.playerId;
      }
      
      const heatLevels = await model.find(query).limit(options?.limit || 10000);
      
      for (const heat of heatLevels) {
        try {
          processed++;
          
          const oldHeat = heat.current;
          
          // Check for arrest (high heat)
          if (heat.current >= 90 && Math.random() < 0.1) {
            // 10% arrest chance when heat is 90+
            arrests++;
            // Don't decay heat if arrested (they're caught)
            continue;
          }
          
          // Calculate decay
          let decay = heat.current * HEAT_DECAY_RATE;
          
          // Apply factor-specific decay
          if (heat.factors && heat.factors.length > 0) {
            for (const factor of heat.factors) {
              decay += factor.delta * factor.decay;
            }
          }
          
          // Apply decay
          const newHeat = Math.max(MIN_HEAT_LEVEL, heat.current - decay);
          totalDecayed += oldHeat - newHeat;
          totalHeat += newHeat;
          
          if (!options?.dryRun) {
            heat.current = newHeat;
            heat.lastDecay = new Date();
            await heat.save();
          }
          
        } catch (error) {
          errors.push({
            entityId: heat._id?.toString() || 'unknown',
            entityType: 'HeatLevel',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
      
      const avgHeat = processed > 0 ? totalHeat / processed : 0;
      
      return { processed, totalDecayed, avgHeat, arrests, errors };
      
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'HeatLevel',
        message: error instanceof Error ? error.message : 'Failed to query heat levels',
        recoverable: true,
      });
      return { processed, totalDecayed, avgHeat: 0, arrests, errors };
    }
  }
  
  // ==========================================================================
  // PRICE FLUCTUATION PROCESSING
  // ==========================================================================
  
  /**
   * Process price fluctuations for all states
   */
  private async processPriceFluctuations(
    model: mongoose.Model<IStatePricingDoc>,
    options?: TickProcessorOptions
  ): Promise<{
    updated: number;
    avgChange: number;
    bullMarkets: number;
    bearMarkets: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let updated = 0;
    let totalChange = 0;
    let bullMarkets = 0;
    let bearMarkets = 0;
    
    try {
      const statePricings = await model.find({}).limit(options?.limit || 100);
      
      for (const statePricing of statePricings) {
        try {
          let stateHasBull = false;
          let stateHasBear = false;
          
          // Update each substance price
          for (const priceEntry of statePricing.prices) {
            // Calculate price change based on supply/demand and volatility
            const volatility = priceEntry.volatility || 0.1;
            const demandFactor = (priceEntry.demand - 50) / 100; // -0.5 to +0.5
            const supplyFactor = (50 - priceEntry.supply) / 100; // +0.5 to -0.5
            
            // Random factor within volatility range
            const randomFactor = (Math.random() * 2 - 1) * volatility;
            
            // Total change
            const changePercent = demandFactor + supplyFactor + randomFactor;
            const clampedChange = Math.max(MIN_PRICE_CHANGE, Math.min(MAX_PRICE_CHANGE, changePercent));
            
            const oldPrice = priceEntry.currentPrice;
            const newPrice = Math.max(priceEntry.basePrice * 0.5, oldPrice * (1 + clampedChange));
            
            totalChange += Math.abs(clampedChange);
            updated++;
            
            // Track trends
            if (clampedChange > 0.05) {
              stateHasBull = true;
              priceEntry.trend = 'rising';
            } else if (clampedChange < -0.05) {
              stateHasBear = true;
              priceEntry.trend = 'falling';
            } else {
              priceEntry.trend = 'stable';
            }
            
            if (!options?.dryRun) {
              priceEntry.currentPrice = newPrice;
              priceEntry.lastUpdate = new Date();
            }
          }
          
          if (stateHasBull) bullMarkets++;
          if (stateHasBear) bearMarkets++;
          
          if (!options?.dryRun) {
            statePricing.lastUpdate = new Date();
            await statePricing.save();
          }
          
        } catch (error) {
          errors.push({
            entityId: statePricing._id?.toString() || 'unknown',
            entityType: 'StatePricing',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
      
      const avgChange = updated > 0 ? (totalChange / updated) * 100 : 0;
      
      return { updated, avgChange, bullMarkets, bearMarkets, errors };
      
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'StatePricing',
        message: error instanceof Error ? error.message : 'Failed to query state pricing',
        recoverable: true,
      });
      return { updated, avgChange: 0, bullMarkets, bearMarkets, errors };
    }
  }
  
  // ==========================================================================
  // PRODUCTION PROCESSING
  // ==========================================================================
  
  /**
   * Process production facilities
   */
  private async processProduction(
    model: mongoose.Model<IProductionFacilityDoc>,
    baseQuery: Record<string, unknown>,
    options?: TickProcessorOptions
  ): Promise<{
    processed: number;
    units: number;
    revenue: number;
    profit: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let processed = 0;
    let units = 0;
    let revenue = 0;
    let profit = 0;
    
    try {
      const facilities = await model.find({
        ...baseQuery,
        status: 'active',
      }).limit(options?.limit || 500);
      
      for (const facility of facilities) {
        try {
          processed++;
          
          // Calculate production
          const productionRate = facility.productionRate || 100;
          const monthlyUnits = productionRate * 30; // Daily rate * 30 days
          units += monthlyUnits;
          
          // Assume average price per unit
          const avgPricePerUnit = 50;
          const monthlyRevenue = monthlyUnits * avgPricePerUnit;
          revenue += monthlyRevenue;
          
          // Calculate costs and profit
          const operatingCosts = facility.operatingCosts || monthlyRevenue * 0.3;
          const monthlyProfit = monthlyRevenue - operatingCosts;
          profit += monthlyProfit;
          
          if (!options?.dryRun) {
            facility.inventory = (facility.inventory || 0) + monthlyUnits;
            await facility.save();
          }
          
        } catch (error) {
          errors.push({
            entityId: facility._id?.toString() || 'unknown',
            entityType: 'ProductionFacility',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
      
      return { processed, units, revenue, profit, errors };
      
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'ProductionFacility',
        message: error instanceof Error ? error.message : 'Failed to query production facilities',
        recoverable: true,
      });
      return { processed, units, revenue, profit, errors };
    }
  }
  
  // ==========================================================================
  // DISTRIBUTION PROCESSING
  // ==========================================================================
  
  /**
   * Process distribution routes
   */
  private async processDistribution(
    model: mongoose.Model<IDistributionRouteDoc>,
    baseQuery: Record<string, unknown>,
    options?: TickProcessorOptions
  ): Promise<{
    processed: number;
    completed: number;
    intercepted: number;
    profit: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let processed = 0;
    let completed = 0;
    let intercepted = 0;
    let profit = 0;
    
    try {
      const routes = await model.find({
        ...baseQuery,
        status: 'active',
      }).limit(options?.limit || 500);
      
      for (const route of routes) {
        try {
          processed++;
          
          // Check for interception based on risk level
          const riskLevel = route.riskLevel || 0.1;
          
          if (Math.random() < riskLevel) {
            // Shipment intercepted
            intercepted++;
            // TODO: Apply heat increase, asset loss
          } else {
            // Shipment completed
            completed++;
            const routeProfit = route.profitMargin || 10000;
            profit += routeProfit;
          }
          
        } catch (error) {
          errors.push({
            entityId: route._id?.toString() || 'unknown',
            entityType: 'DistributionRoute',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
      
      return { processed, completed, intercepted, profit, errors };
      
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'DistributionRoute',
        message: error instanceof Error ? error.message : 'Failed to query distribution routes',
        recoverable: true,
      });
      return { processed, completed, intercepted, profit, errors };
    }
  }
  
  // ==========================================================================
  // TERRITORY PROCESSING
  // ==========================================================================
  
  /**
   * Process territory tax collection
   */
  private async processTerritories(
    model: mongoose.Model<ITerritoryDoc>,
    baseQuery: Record<string, unknown>,
    options?: TickProcessorOptions
  ): Promise<{
    processed: number;
    taxes: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let processed = 0;
    let taxes = 0;
    
    try {
      // Get territories with a controller
      const territories = await model.find({
        controllerId: { $exists: true, $ne: null },
        ...(options?.playerId ? { controllerId: options.playerId } : {}),
      }).limit(options?.limit || 500);
      
      for (const territory of territories) {
        try {
          processed++;
          
          // Collect monthly tax
          const taxRate = territory.taxRate || 0.1;
          const baseRevenue = territory.monthlyRevenue || 50000;
          const monthlyTax = baseRevenue * taxRate;
          taxes += monthlyTax;
          
        } catch (error) {
          errors.push({
            entityId: territory._id?.toString() || 'unknown',
            entityType: 'Territory',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
      
      return { processed, taxes, errors };
      
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'Territory',
        message: error instanceof Error ? error.message : 'Failed to query territories',
        recoverable: true,
      });
      return { processed, taxes, errors };
    }
  }
}

// Export singleton instance
export const crimeProcessor = new CrimeProcessor();

export default CrimeProcessor;
