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

import TimeEngine, { TimeEvent, TimeEventType } from './timeEngine';
import { v4 as uuidv4 } from 'uuid';

/**
 * scheduleRecurringEvent
 * Schedules a recurring event (e.g., weekly payroll)
 */
export function scheduleRecurringEvent(
  type: TimeEventType,
  intervalMs: number,
  payload?: any
): string {
  const id = uuidv4();
  const now = TimeEngine.getInstance().getGameTime();
  const event: TimeEvent = {
    id,
    type,
    scheduledFor: new Date(now.getTime() + intervalMs),
    payload,
    recurring: true,
    intervalMs,
  };
  TimeEngine.getInstance().scheduleEvent(event);
  return id;
}

/**
 * scheduleOneTimeEvent
 * Schedules a one-time event (e.g., contract deadline, training completion)
 */
export function scheduleOneTimeEvent(
  type: TimeEventType,
  scheduledFor: Date,
  payload?: any
): string {
  const id = uuidv4();
  const event: TimeEvent = {
    id,
    type,
    scheduledFor,
    payload,
    recurring: false,
  };
  TimeEngine.getInstance().scheduleEvent(event);
  return id;
}

/**
 * removeScheduledEvent
 * Removes a scheduled event by ID
 */
export function removeScheduledEvent(id: string) {
  TimeEngine.getInstance().removeEvent(id);
}

/**
 * getScheduledEvents
 * Returns all currently scheduled events
 */
export function getScheduledEvents(): TimeEvent[] {
  return TimeEngine.getInstance().getEvents();
}

/**
 * IMPLEMENTATION NOTES:
 * - Uses uuid for unique event IDs
 * - All scheduling is routed through the TimeEngine singleton
 * - Recurring and one-time events are supported
 * - Designed for use by payroll, contract, employee, and training modules
 */
