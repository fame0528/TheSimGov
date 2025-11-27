/**
 * @fileoverview Time Engine Event Initialization
 * @module lib/time/events
 *
 * OVERVIEW:
 * Registers listeners for scheduled time events (payroll, contract deadlines, skill decay,
 * training completion) and provides initialization + recurring scheduling bootstrap.
 * Abstraction layer between TimeEngine low-level events and domain operations.
 *
 * @created 2025-11-20
 */

import TimeEngine from './timeEngine';
import { scheduleRecurringEvent, scheduleOneTimeEvent } from './scheduler';

// Domain handlers imported lazily inside listener to avoid circular deps
async function runPayroll() {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/payroll`, { method: 'POST' });
}
async function runContractDeadlines() {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/contracts/deadlines`, { method: 'POST' });
}
async function runSkillDecay() {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/employees/decay`, { method: 'POST' });
}
async function completeTraining(employeeId: string) {
  // Call training completion endpoint with employee ID payload
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/employees/training/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId }),
  });
}

let initialized = false;

/**
 * Initialize event listeners and recurring schedules (idempotent)
 */
export function initTimeEvents() {
  if (initialized) return;
  const engine = TimeEngine.getInstance();

  // Listeners
  engine.on('payroll', () => { runPayroll().catch(console.error); });
  engine.on('contractDeadline', () => { runContractDeadlines().catch(console.error); });
  engine.on('skillDecay', () => { runSkillDecay().catch(console.error); });
  engine.on('trainingComplete', (evt) => {
    if (evt.payload?.employeeId) {
      completeTraining(evt.payload.employeeId).catch(console.error);
    }
  });

  // Recurring schedules (approximate game week/day via multiplier)
  // Using real interval scaled to game time advancement for simplicity.
  const weekMs = 7 * 24 * 60 * 60 * 1000; // real baseline; engine multiplies advancement
  const dayMs = 24 * 60 * 60 * 1000;
  scheduleRecurringEvent('payroll', weekMs);
  scheduleRecurringEvent('contractDeadline', dayMs); // daily check
  scheduleRecurringEvent('skillDecay', weekMs);

  initialized = true;
  engine.start();
}

/**
 * Schedule training completion event for an employee
 * @param employeeId string
 * @param completionDate Date in game time reference
 */
export function scheduleTrainingCompletion(employeeId: string, completionDate: Date) {
  scheduleOneTimeEvent('trainingComplete', completionDate, { employeeId });
}

/**
 * IMPLEMENTATION NOTES:
 * - Idempotent initialization prevents duplicate listeners.
 * - Domain handlers use fetch to existing API endpoints enabling serverless compatibility.
 * - Training completion currently a stub to be replaced with dedicated endpoint logic.
 * - Real/game time scaling simplified; future enhancement: convert game delta to real scheduling.
 */