/**
 * @file src/lib/db/models/system/GameTick.ts
 * @description GameTick Mongoose model for tick history and state
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Tracks game tick execution history for audit, debugging, and state recovery.
 * Each tick record stores what happened during that tick across all processors.
 *
 * FEATURES:
 * - Tick execution history
 * - Last processed time per player
 * - Catchup detection (missed ticks)
 * - Performance metrics
 *
 * @author ECHO v1.4.0
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  GameTime,
  TickResult,
  TickEngineState,
  TickSchedule,
} from '@/lib/types/gameTick';

// ============================================================================
// GAME TICK RECORD
// ============================================================================

/**
 * GameTick document interface
 */
export interface IGameTick extends Document {
  tickId: string;
  gameTime: GameTime;
  triggeredBy: 'CRON' | 'MANUAL' | 'CATCHUP';
  triggeredByUserId?: string;
  
  // Execution details
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  
  // Results summary
  success: boolean;
  processorsRun: string[];
  totalItemsProcessed: number;
  totalErrors: number;
  
  // Full result (stored as JSON)
  result?: TickResult;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GameTick model interface with static methods
 */
export interface IGameTickModel extends Model<IGameTick> {
  getLastTick(): Promise<IGameTick | null>;
  getCurrentGameTime(): Promise<GameTime>;
  recordTick(
    tickId: string,
    gameTime: GameTime,
    triggeredBy: 'CRON' | 'MANUAL' | 'CATCHUP',
    triggeredByUserId?: string
  ): Promise<IGameTick>;
  completeTick(tickId: string, result: TickResult): Promise<IGameTick | null>;
  getTickHistory(limit?: number): Promise<IGameTick[]>;
  getMissedTicks(expectedGameTime: GameTime): Promise<number>;
}

/**
 * GameTick schema
 */
const GameTickSchema = new Schema<IGameTick>(
  {
    tickId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    gameTime: {
      year: { type: Number, required: true },
      month: { type: Number, required: true, min: 1, max: 12 },
      totalMonths: { type: Number, required: true },
    },
    triggeredBy: {
      type: String,
      enum: ['CRON', 'MANUAL', 'CATCHUP'],
      required: true,
    },
    triggeredByUserId: {
      type: String,
      index: true,
    },
    
    // Execution
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completedAt: Date,
    durationMs: Number,
    
    // Results
    success: {
      type: Boolean,
      required: true,
      default: false,
    },
    processorsRun: [{
      type: String,
    }],
    totalItemsProcessed: {
      type: Number,
      default: 0,
    },
    totalErrors: {
      type: Number,
      default: 0,
    },
    
    // Full result
    result: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: 'game_ticks',
  }
);

// Indexes
GameTickSchema.index({ 'gameTime.totalMonths': -1 });
GameTickSchema.index({ createdAt: -1 });
GameTickSchema.index({ success: 1, createdAt: -1 });

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Get the most recent tick
 */
GameTickSchema.statics.getLastTick = async function(): Promise<IGameTick | null> {
  return this.findOne({ completedAt: { $exists: true } })
    .sort({ 'gameTime.totalMonths': -1 })
    .lean();
};

/**
 * Get current game time based on last tick
 */
GameTickSchema.statics.getCurrentGameTime = async function(): Promise<GameTime> {
  const lastTick = await (this as IGameTickModel).getLastTick();
  
  if (!lastTick) {
    // Start at Year 1, Month 1
    return { year: 1, month: 1, totalMonths: 1 };
  }
  
  return lastTick.gameTime;
};

/**
 * Record start of a new tick
 */
GameTickSchema.statics.recordTick = async function(
  tickId: string,
  gameTime: GameTime,
  triggeredBy: 'CRON' | 'MANUAL' | 'CATCHUP',
  triggeredByUserId?: string
): Promise<IGameTick> {
  return this.create({
    tickId,
    gameTime,
    triggeredBy,
    triggeredByUserId,
    startedAt: new Date(),
    success: false,
    processorsRun: [],
    totalItemsProcessed: 0,
    totalErrors: 0,
  });
};

/**
 * Record completion of a tick
 */
GameTickSchema.statics.completeTick = async function(
  tickId: string,
  result: TickResult
): Promise<IGameTick | null> {
  return this.findOneAndUpdate(
    { tickId },
    {
      completedAt: result.completedAt,
      durationMs: result.durationMs,
      success: result.success,
      processorsRun: result.processors.map(p => p.processor),
      totalItemsProcessed: result.totalItemsProcessed,
      totalErrors: result.totalErrors,
      result,
    },
    { new: true }
  );
};

/**
 * Get tick history
 */
GameTickSchema.statics.getTickHistory = async function(limit = 50): Promise<IGameTick[]> {
  return this.find({ completedAt: { $exists: true } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Calculate how many ticks were missed
 */
GameTickSchema.statics.getMissedTicks = async function(expectedGameTime: GameTime): Promise<number> {
  const lastTick = await (this as IGameTickModel).getLastTick();
  
  if (!lastTick) {
    return expectedGameTime.totalMonths - 1;
  }
  
  return Math.max(0, expectedGameTime.totalMonths - lastTick.gameTime.totalMonths - 1);
};

// ============================================================================
// PLAYER TICK STATE (Embedded in User or separate)
// ============================================================================

/**
 * PlayerTickState document interface
 * Tracks per-player tick processing state
 */
export interface IPlayerTickState extends Document {
  playerId: string;
  lastProcessedTick: GameTime;
  lastProcessedAt: Date;
  
  // Per-system state
  banking: {
    lastProcessed: Date;
    loansProcessed: number;
    depositsProcessed: number;
  };
  empire: {
    lastProcessed: Date;
    flowsProcessed: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * PlayerTickState model interface
 */
export interface IPlayerTickStateModel extends Model<IPlayerTickState> {
  getOrCreate(playerId: string): Promise<IPlayerTickState>;
  markProcessed(playerId: string, gameTime: GameTime, system: string): Promise<void>;
  getUnprocessedPlayers(gameTime: GameTime): Promise<string[]>;
}

/**
 * PlayerTickState schema
 */
const PlayerTickStateSchema = new Schema<IPlayerTickState>(
  {
    playerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    lastProcessedTick: {
      year: { type: Number, required: true, default: 0 },
      month: { type: Number, required: true, default: 0 },
      totalMonths: { type: Number, required: true, default: 0 },
    },
    lastProcessedAt: {
      type: Date,
      default: Date.now,
    },
    
    banking: {
      lastProcessed: { type: Date, default: Date.now },
      loansProcessed: { type: Number, default: 0 },
      depositsProcessed: { type: Number, default: 0 },
    },
    empire: {
      lastProcessed: { type: Date, default: Date.now },
      flowsProcessed: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    collection: 'player_tick_states',
  }
);

// Static methods
PlayerTickStateSchema.statics.getOrCreate = async function(playerId: string): Promise<IPlayerTickState> {
  let state = await this.findOne({ playerId });
  
  if (!state) {
    state = await this.create({
      playerId,
      lastProcessedTick: { year: 0, month: 0, totalMonths: 0 },
    });
  }
  
  return state;
};

PlayerTickStateSchema.statics.markProcessed = async function(
  playerId: string,
  gameTime: GameTime,
  system: string
): Promise<void> {
  const update: Record<string, unknown> = {
    lastProcessedTick: gameTime,
    lastProcessedAt: new Date(),
  };
  
  if (system === 'banking' || system === 'empire') {
    update[`${system}.lastProcessed`] = new Date();
  }
  
  await this.updateOne(
    { playerId },
    { $set: update },
    { upsert: true }
  );
};

PlayerTickStateSchema.statics.getUnprocessedPlayers = async function(
  gameTime: GameTime
): Promise<string[]> {
  const states = await this.find({
    'lastProcessedTick.totalMonths': { $lt: gameTime.totalMonths },
  }).select('playerId').lean();
  
  return states.map((s: { playerId: string }) => s.playerId);
};

// ============================================================================
// EXPORTS
// ============================================================================

// Check if models exist before creating (for hot reload)
export const GameTick = (mongoose.models.GameTick as IGameTickModel) ||
  mongoose.model<IGameTick, IGameTickModel>('GameTick', GameTickSchema);

export const PlayerTickState = (mongoose.models.PlayerTickState as IPlayerTickStateModel) ||
  mongoose.model<IPlayerTickState, IPlayerTickStateModel>('PlayerTickState', PlayerTickStateSchema);

export default GameTick;
