/**
 * @fileoverview Time Engine Singleton for MMO
 * @module lib/time/timeEngine
 *
 * OVERVIEW:
 * Centralized time progression engine for the MMO. Handles global time state, tick logic,
 * event scheduling, and hooks for payroll, contract deadlines, training completion, and skill decay.
 * Provides a foundation for all time-based mechanics and scheduled tasks.
 *
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { GAME_TIME } from '@/lib/utils/constants';

/**
 * TimeEngineConfig
 * Configuration for time scaling and tick interval
 */
export interface TimeEngineConfig {
  realToGameMultiplier: number; // e.g., 168 (1 real hour = 1 game week)
  tickIntervalMs: number;       // How often to tick (ms)
}

/**
 * TimeEventType
 * Types of scheduled events
 */
export type TimeEventType =
  | 'payroll'
  | 'contractDeadline'
  | 'trainingComplete'
  | 'skillDecay';

/**
 * TimeEvent
 * Represents a scheduled event in the time engine
 */
export interface TimeEvent {
  id: string;
  type: TimeEventType;
  scheduledFor: Date;
  payload?: any;
  recurring?: boolean;
  intervalMs?: number; // For recurring events
}

/**
 * TimeEngine
 * Singleton class for managing global time and scheduled events
 */
class TimeEngine {
  private static instance: TimeEngine;
  private config: TimeEngineConfig;
  private currentGameTime: Date;
  private timer: NodeJS.Timeout | null = null;
  private events: Map<string, TimeEvent> = new Map();
  private listeners: Map<TimeEventType, ((event: TimeEvent) => void)[]> = new Map();
  private paused = false;

  private constructor(config?: Partial<TimeEngineConfig>) {
    this.config = {
      realToGameMultiplier: config?.realToGameMultiplier ?? GAME_TIME.REAL_TO_GAME_MULTIPLIER,
      tickIntervalMs: config?.tickIntervalMs ?? 10000, // Default: 10s real = 1w game
    };
    this.currentGameTime = new Date();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<TimeEngineConfig>): TimeEngine {
    if (!TimeEngine.instance) {
      TimeEngine.instance = new TimeEngine(config);
    }
    return TimeEngine.instance;
  }

  /**
   * Start the time engine ticking
   */
  public start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.config.tickIntervalMs);
  }

  /**
   * Stop the time engine
   */
  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Pause time progression (ticks still advance real time but game time frozen)
   */
  public pause() {
    this.paused = true;
  }

  /**
   * Resume time progression
   */
  public resume() {
    this.paused = false;
  }

  /**
   * Advance game time and process scheduled events
   */
  private tick() {
    // Advance game time
    if (!this.paused) {
      const msToAdvance = this.config.tickIntervalMs * this.config.realToGameMultiplier;
      this.currentGameTime = new Date(this.currentGameTime.getTime() + msToAdvance);
    }

    // Process due events
    const now = this.currentGameTime;
    for (const [id, event] of this.events) {
      if (event.scheduledFor <= now) {
        this.emit(event.type, event);
        if (event.recurring && event.intervalMs) {
          // Reschedule recurring event
          event.scheduledFor = new Date(event.scheduledFor.getTime() + event.intervalMs);
        } else {
          this.events.delete(id);
        }
      }
    }
  }

  /**
   * Manually trigger a single tick (serverless/cron endpoint)
   */
  public tickOnce() {
    this.tick();
  }

  /**
   * Schedule a new event
   */
  public scheduleEvent(event: TimeEvent) {
    this.events.set(event.id, event);
  }

  /**
   * Remove a scheduled event
   */
  public removeEvent(id: string) {
    this.events.delete(id);
  }

  /**
   * Register a listener for a specific event type
   */
  public on(type: TimeEventType, listener: (event: TimeEvent) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
  }

  /**
   * Emit an event to listeners
   */
  private emit(type: TimeEventType, event: TimeEvent) {
    const listeners = this.listeners.get(type) || [];
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (err) {
        // Log error but continue
        console.error(`[TimeEngine] Error in listener for ${type}:`, err);
      }
    }
  }

  /**
   * Get current in-game time
   */
  public getGameTime(): Date {
    return this.currentGameTime;
  }

  /**
   * Set current in-game time (admin/dev only)
   */
  public setGameTime(date: Date) {
    this.currentGameTime = date;
  }

  /**
   * Get paused status
   */
  public isPaused(): boolean {
    return this.paused;
  }

  /**
   * Get all scheduled events
   */
  public getEvents(): TimeEvent[] {
    return Array.from(this.events.values());
  }
}

export default TimeEngine;

/**
 * IMPLEMENTATION NOTES:
 * - Singleton pattern ensures only one global time engine
 * - Event system allows other modules to hook into time events (payroll, deadlines, etc.)
 * - Recurring events supported for weekly/monthly tasks
 * - Admin controls for time manipulation (setGameTime)
 * - All time scaling is configurable via constants
 */
