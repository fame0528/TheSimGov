"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTimeEvents = initTimeEvents;
exports.scheduleTrainingCompletion = scheduleTrainingCompletion;
const timeEngine_1 = __importDefault(require("./timeEngine"));
const scheduler_1 = require("./scheduler");
// Domain handlers imported lazily inside listener to avoid circular deps
async function runPayroll() {
    var _a;
    await fetch(`${(_a = process.env.NEXT_PUBLIC_BASE_URL) !== null && _a !== void 0 ? _a : ''}/api/payroll`, { method: 'POST' });
}
async function runContractDeadlines() {
    var _a;
    await fetch(`${(_a = process.env.NEXT_PUBLIC_BASE_URL) !== null && _a !== void 0 ? _a : ''}/api/contracts/deadlines`, { method: 'POST' });
}
async function runSkillDecay() {
    var _a;
    await fetch(`${(_a = process.env.NEXT_PUBLIC_BASE_URL) !== null && _a !== void 0 ? _a : ''}/api/employees/decay`, { method: 'POST' });
}
async function completeTraining(employeeId) {
    var _a;
    // Call training completion endpoint with employee ID payload
    await fetch(`${(_a = process.env.NEXT_PUBLIC_BASE_URL) !== null && _a !== void 0 ? _a : ''}/api/employees/training/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
    });
}
let initialized = false;
/**
 * Initialize event listeners and recurring schedules (idempotent)
 */
function initTimeEvents() {
    if (initialized)
        return;
    const engine = timeEngine_1.default.getInstance();
    // Listeners
    engine.on('payroll', () => { runPayroll().catch(console.error); });
    engine.on('contractDeadline', () => { runContractDeadlines().catch(console.error); });
    engine.on('skillDecay', () => { runSkillDecay().catch(console.error); });
    engine.on('trainingComplete', (evt) => {
        var _a;
        if ((_a = evt.payload) === null || _a === void 0 ? void 0 : _a.employeeId) {
            completeTraining(evt.payload.employeeId).catch(console.error);
        }
    });
    // Recurring schedules (approximate game week/day via multiplier)
    // Using real interval scaled to game time advancement for simplicity.
    const weekMs = 7 * 24 * 60 * 60 * 1000; // real baseline; engine multiplies advancement
    const dayMs = 24 * 60 * 60 * 1000;
    (0, scheduler_1.scheduleRecurringEvent)('payroll', weekMs);
    (0, scheduler_1.scheduleRecurringEvent)('contractDeadline', dayMs); // daily check
    (0, scheduler_1.scheduleRecurringEvent)('skillDecay', weekMs);
    initialized = true;
    engine.start();
}
/**
 * Schedule training completion event for an employee
 * @param employeeId string
 * @param completionDate Date in game time reference
 */
function scheduleTrainingCompletion(employeeId, completionDate) {
    (0, scheduler_1.scheduleOneTimeEvent)('trainingComplete', completionDate, { employeeId });
}
/**
 * IMPLEMENTATION NOTES:
 * - Idempotent initialization prevents duplicate listeners.
 * - Domain handlers use fetch to existing API endpoints enabling serverless compatibility.
 * - Training completion currently a stub to be replaced with dedicated endpoint logic.
 * - Real/game time scaling simplified; future enhancement: convert game delta to real scheduling.
 */ 
//# sourceMappingURL=events.js.map