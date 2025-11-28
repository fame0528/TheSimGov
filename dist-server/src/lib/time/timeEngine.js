"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@/lib/utils/constants");
/**
 * TimeEngine
 * Singleton class for managing global time and scheduled events
 */
class TimeEngine {
    constructor(config) {
        var _a, _b;
        this.timer = null;
        this.events = new Map();
        this.listeners = new Map();
        this.paused = false;
        this.config = {
            realToGameMultiplier: (_a = config === null || config === void 0 ? void 0 : config.realToGameMultiplier) !== null && _a !== void 0 ? _a : constants_1.GAME_TIME.REAL_TO_GAME_MULTIPLIER,
            tickIntervalMs: (_b = config === null || config === void 0 ? void 0 : config.tickIntervalMs) !== null && _b !== void 0 ? _b : 10000, // Default: 10s real = 1w game
        };
        this.currentGameTime = new Date();
    }
    /**
     * Get singleton instance
     */
    static getInstance(config) {
        if (!TimeEngine.instance) {
            TimeEngine.instance = new TimeEngine(config);
        }
        return TimeEngine.instance;
    }
    /**
     * Start the time engine ticking
     */
    start() {
        if (this.timer)
            return;
        this.timer = setInterval(() => this.tick(), this.config.tickIntervalMs);
    }
    /**
     * Stop the time engine
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    /**
     * Pause time progression (ticks still advance real time but game time frozen)
     */
    pause() {
        this.paused = true;
    }
    /**
     * Resume time progression
     */
    resume() {
        this.paused = false;
    }
    /**
     * Advance game time and process scheduled events
     */
    tick() {
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
                }
                else {
                    this.events.delete(id);
                }
            }
        }
    }
    /**
     * Manually trigger a single tick (serverless/cron endpoint)
     */
    tickOnce() {
        this.tick();
    }
    /**
     * Schedule a new event
     */
    scheduleEvent(event) {
        this.events.set(event.id, event);
    }
    /**
     * Remove a scheduled event
     */
    removeEvent(id) {
        this.events.delete(id);
    }
    /**
     * Register a listener for a specific event type
     */
    on(type, listener) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(listener);
    }
    /**
     * Emit an event to listeners
     */
    emit(type, event) {
        const listeners = this.listeners.get(type) || [];
        for (const listener of listeners) {
            try {
                listener(event);
            }
            catch (err) {
                // Log error but continue
                console.error(`[TimeEngine] Error in listener for ${type}:`, err);
            }
        }
    }
    /**
     * Get current in-game time
     */
    getGameTime() {
        return this.currentGameTime;
    }
    /**
     * Set current in-game time (admin/dev only)
     */
    setGameTime(date) {
        this.currentGameTime = date;
    }
    /**
     * Get paused status
     */
    isPaused() {
        return this.paused;
    }
    /**
     * Get all scheduled events
     */
    getEvents() {
        return Array.from(this.events.values());
    }
}
exports.default = TimeEngine;
/**
 * IMPLEMENTATION NOTES:
 * - Singleton pattern ensures only one global time engine
 * - Event system allows other modules to hook into time events (payroll, deadlines, etc.)
 * - Recurring events supported for weekly/monthly tasks
 * - Admin controls for time manipulation (setGameTime)
 * - All time scaling is configurable via constants
 */
//# sourceMappingURL=timeEngine.js.map