/**
 * @file src/lib/game/tick/tickEngine.ts
 * @description Core game tick engine that orchestrates all processors
 * @created 2025-12-05
 *
 * OVERVIEW:
 * The TickEngine is the heartbeat of the game economy. Each tick represents
 * one game month passing, triggering all time-based events across systems.
 *
 * ARCHITECTURE:
 * - Processors are registered and run in priority order
 * - Each processor is independent and handles one domain
 * - Results are aggregated and stored for history/audit
 * - Supports dry-run, single-player, and catchup modes
 *
 * USAGE:
 * import { tickEngine } from '@/lib/game/tick/tickEngine';
 * 
 * // Run a single tick
 * const result = await tickEngine.runTick();
 * 
 * // Run tick for specific player
 * const result = await tickEngine.runTick({ playerId: '...' });
 *
 * @author ECHO v1.4.0
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ITickProcessor,
  GameTime,
  TickResult,
  TickProcessorResult,
  TickProcessorOptions,
  TickEngineConfig,
  TickEngineState,
  TriggerTickRequest,
} from '@/lib/types/gameTick';
import { GameTick, IGameTickModel } from '@/lib/db/models/system/GameTick';
import { bankingProcessor } from './bankingProcessor';
import { empireProcessor } from './empireProcessor';
import { energyProcessor } from './energyProcessor';
import { manufacturingProcessor } from './manufacturingProcessor';
import { retailProcessor } from './retailProcessor';
import { techProcessor } from './techProcessor';
import { mediaProcessor } from './mediaProcessor';
import { consultingProcessor } from './consultingProcessor';
import { healthcareProcessor } from './healthcareProcessor';
import { crimeProcessor } from './crimeProcessor';
import { politicsProcessor } from './politicsProcessor';

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: TickEngineConfig = {
  processors: [
    bankingProcessor,       // Priority 10 - Financial foundation
    empireProcessor,        // Priority 20 - Synergies & resources
    energyProcessor,        // Priority 30 - Power generation
    manufacturingProcessor, // Priority 40 - Production
    retailProcessor,        // Priority 50 - E-commerce orders
    techProcessor,          // Priority 55 - SaaS subscriptions
    mediaProcessor,         // Priority 60 - Content & audiences
    consultingProcessor,    // Priority 65 - Projects & billing
    healthcareProcessor,    // Priority 70 - R&D, trials, services
    crimeProcessor,         // Priority 75 - Prices, heat, production
    politicsProcessor,      // Priority 80 - Bills, lobbying, elections
  ],
  continueOnError: true,
  timeoutMs: 60000, // 1 minute max
  verbose: false,
};

// ============================================================================
// TICK ENGINE
// ============================================================================

/**
 * Core tick engine class
 */
export class TickEngine {
  private config: TickEngineConfig;
  private state: TickEngineState;
  
  constructor(config?: Partial<TickEngineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      lastTick: null,
      lastTickAt: null,
      ticksProcessed: 0,
      isProcessing: false,
      currentProcessor: null,
    };
  }
  
  // ==========================================================================
  // PUBLIC API
  // ==========================================================================
  
  /**
   * Get current engine state
   */
  getState(): TickEngineState {
    return { ...this.state };
  }
  
  /**
   * Get registered processors
   */
  getProcessors(): ITickProcessor[] {
    return [...this.config.processors];
  }
  
  /**
   * Register a new processor
   */
  registerProcessor(processor: ITickProcessor): void {
    // Check for duplicate
    if (this.config.processors.some(p => p.name === processor.name)) {
      throw new Error(`Processor '${processor.name}' is already registered`);
    }
    
    this.config.processors.push(processor);
    
    // Re-sort by priority
    this.config.processors.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Unregister a processor
   */
  unregisterProcessor(name: string): boolean {
    const index = this.config.processors.findIndex(p => p.name === name);
    if (index === -1) return false;
    
    this.config.processors.splice(index, 1);
    return true;
  }
  
  /**
   * Run a single tick
   */
  async runTick(options?: TriggerTickRequest): Promise<TickResult> {
    // Check if already processing
    if (this.state.isProcessing) {
      throw new Error('Tick already in progress');
    }
    
    const tickId = uuidv4();
    const startTime = Date.now();
    this.state.isProcessing = true;
    
    try {
      // Calculate next game time
      const currentTime = await (GameTick as IGameTickModel).getCurrentGameTime();
      const nextTime = this.advanceGameTime(currentTime);
      
      // Record tick start
      await (GameTick as IGameTickModel).recordTick(
        tickId,
        nextTime,
        options?.playerId ? 'MANUAL' : 'MANUAL',
        options?.playerId
      );
      
      // Validate all processors
      await this.validateProcessors();
      
      // Run processors in priority order
      const processorResults: TickProcessorResult[] = [];
      let totalItems = 0;
      let totalErrors = 0;
      
      for (const processor of this.config.processors) {
        if (!processor.enabled) continue;
        
        this.state.currentProcessor = processor.name;
        
        try {
          const result = await this.runProcessorWithTimeout(
            processor,
            nextTime,
            {
              playerId: options?.playerId,
              dryRun: options?.dryRun,
              force: options?.force,
            }
          );
          
          processorResults.push(result);
          totalItems += result.itemsProcessed;
          totalErrors += result.errors.length;
          
          // Stop if non-recoverable error and not continuing on error
          if (!result.success && !this.config.continueOnError) {
            break;
          }
        } catch (error) {
          const errorResult: TickProcessorResult = {
            processor: processor.name,
            success: false,
            itemsProcessed: 0,
            errors: [{
              entityId: 'system',
              entityType: processor.name,
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
              recoverable: false,
            }],
            summary: {},
            durationMs: 0,
          };
          
          processorResults.push(errorResult);
          totalErrors += 1;
          
          if (!this.config.continueOnError) break;
        }
      }
      
      this.state.currentProcessor = null;
      
      // Build final result
      const completedAt = new Date();
      const result: TickResult = {
        tickId,
        gameTime: nextTime,
        startedAt: new Date(startTime),
        completedAt,
        durationMs: Date.now() - startTime,
        processors: processorResults,
        totalItemsProcessed: totalItems,
        totalErrors,
        success: processorResults.every(r => r.success),
      };
      
      // Save tick result
      await (GameTick as IGameTickModel).completeTick(tickId, result);
      
      // Update state
      this.state.lastTick = nextTime;
      this.state.lastTickAt = completedAt;
      this.state.ticksProcessed += 1;
      
      return result;
      
    } finally {
      this.state.isProcessing = false;
      this.state.currentProcessor = null;
    }
  }
  
  /**
   * Run multiple ticks (for catchup)
   */
  async runCatchupTicks(count: number, options?: TriggerTickRequest): Promise<TickResult[]> {
    const results: TickResult[] = [];
    
    for (let i = 0; i < count; i++) {
      const result = await this.runTick(options);
      results.push(result);
      
      // Stop if tick failed and not continuing on error
      if (!result.success && !this.config.continueOnError) {
        break;
      }
    }
    
    return results;
  }
  
  /**
   * Get current game time
   */
  async getCurrentGameTime(): Promise<GameTime> {
    return (GameTick as IGameTickModel).getCurrentGameTime();
  }
  
  /**
   * Get tick history
   */
  async getHistory(limit = 50): Promise<TickResult[]> {
    const ticks = await (GameTick as IGameTickModel).getTickHistory(limit);
    return ticks.map(t => t.result).filter((r): r is TickResult => r !== undefined);
  }
  
  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================
  
  /**
   * Advance game time by one month
   */
  private advanceGameTime(current: GameTime): GameTime {
    let newMonth = current.month + 1;
    let newYear = current.year;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    
    return {
      year: newYear,
      month: newMonth,
      totalMonths: current.totalMonths + 1,
    };
  }
  
  /**
   * Validate all enabled processors
   */
  private async validateProcessors(): Promise<void> {
    for (const processor of this.config.processors) {
      if (!processor.enabled) continue;
      
      const validationResult = await processor.validate();
      if (validationResult !== true) {
        throw new Error(`Processor '${processor.name}' validation failed: ${validationResult}`);
      }
    }
  }
  
  /**
   * Run processor with timeout
   */
  private async runProcessorWithTimeout(
    processor: ITickProcessor,
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<TickProcessorResult> {
    return new Promise(async (resolve, reject) => {
      // Set timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`Processor '${processor.name}' timed out after ${this.config.timeoutMs}ms`));
      }, this.config.timeoutMs);
      
      try {
        const result = await processor.process(gameTime, options);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Default tick engine instance
 * Pre-configured with banking processor
 */
export const tickEngine = new TickEngine();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format game time as string
 */
export function formatGameTime(time: GameTime): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${monthNames[time.month - 1]} Year ${time.year}`;
}

/**
 * Parse game time from string
 */
export function parseGameTime(str: string): GameTime | null {
  const match = str.match(/(\w+)\s+Year\s+(\d+)/i);
  if (!match) return null;
  
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];
  
  const month = monthNames.indexOf(match[1].toLowerCase()) + 1;
  if (month === 0) return null;
  
  const year = parseInt(match[2], 10);
  const totalMonths = (year - 1) * 12 + month;
  
  return { year, month, totalMonths };
}

/**
 * Calculate months between two game times
 */
export function monthsBetween(a: GameTime, b: GameTime): number {
  return Math.abs(a.totalMonths - b.totalMonths);
}

export default tickEngine;
