"use strict";
/**
 * @fileoverview Time Scheduler Utilities
 * @module lib/time/scheduler
 *
 * OVERVIEW:
 * Utility functions for scheduling, managing, and generating time-based events for the MMO.
 * Integrates with the TimeEngine singleton to provide high-level scheduling for payroll,
 * contract deadlines, training completions, and skill decay.
 *
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleRecurringEvent = scheduleRecurringEvent;
exports.scheduleOneTimeEvent = scheduleOneTimeEvent;
exports.removeScheduledEvent = removeScheduledEvent;
exports.getScheduledEvents = getScheduledEvents;
const timeEngine_1 = __importDefault(require("./timeEngine"));
const uuid_1 = require("uuid");
/**
 * scheduleRecurringEvent
 * Schedules a recurring event (e.g., weekly payroll)
 */
function scheduleRecurringEvent(type, intervalMs, payload) {
    const id = (0, uuid_1.v4)();
    const now = timeEngine_1.default.getInstance().getGameTime();
    const event = {
        id,
        type,
        scheduledFor: new Date(now.getTime() + intervalMs),
        payload,
        recurring: true,
        intervalMs,
    };
    timeEngine_1.default.getInstance().scheduleEvent(event);
    return id;
}
/**
 * scheduleOneTimeEvent
 * Schedules a one-time event (e.g., contract deadline, training completion)
 */
function scheduleOneTimeEvent(type, scheduledFor, payload) {
    const id = (0, uuid_1.v4)();
    const event = {
        id,
        type,
        scheduledFor,
        payload,
        recurring: false,
    };
    timeEngine_1.default.getInstance().scheduleEvent(event);
    return id;
}
/**
 * removeScheduledEvent
 * Removes a scheduled event by ID
 */
function removeScheduledEvent(id) {
    timeEngine_1.default.getInstance().removeEvent(id);
}
/**
 * getScheduledEvents
 * Returns all currently scheduled events
 */
function getScheduledEvents() {
    return timeEngine_1.default.getInstance().getEvents();
}
/**
 * IMPLEMENTATION NOTES:
 * - Uses uuid for unique event IDs
 * - All scheduling is routed through the TimeEngine singleton
 * - Recurring and one-time events are supported
 * - Designed for use by payroll, contract, employee, and training modules
 */
//# sourceMappingURL=scheduler.js.map