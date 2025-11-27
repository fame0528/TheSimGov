/**
 * @fileoverview Telemetry Aggregation Scheduler & Aggregators (Phase 7)
 * @module lib/utils/politics/phase7/telemetryAggregation
 *
 * OVERVIEW:
 * Provides functions to compute DAILY / WEEKLY rollups from raw telemetry
 * events and persist them via `TelemetryAggregate` model (upsert). Includes
 * scheduler helpers for periodic automated aggregation.
 *
 * AGGREGATION LOGIC (Phase 7 Scope):
 * - Counts per TelemetryEventType.
 * - Influence net percent: sum of influenceBonusPercent + influenceAppliedPercent
 *   (treating missing values as 0).
 * - Reputation net percent: sum of reputationScore deltas (simplified: current - previous momentum reputation).
 * - Momentum average: mean of newMomentumIndex values if any.
 *
 * @created 2025-11-27
 */

import { Types } from 'mongoose';
import TelemetryEventModel from '@/lib/db/models/TelemetryEvent';
import TelemetryAggregateModel from '@/lib/db/models/TelemetryAggregate';
import { TelemetryEventType } from '@/lib/types/politicsPhase7';
import { createComponentLogger } from '@/lib/utils/logger';

const logger = createComponentLogger('phase7-telemetry-aggregation');

interface ContributionTotals {
  influenceNetPercent: number;
  reputationNetPercent: number;
  momentumIndices: number[];
  eventCounts: Record<string, number>;
}

/** Initialize fresh totals structure */
function initTotals(): ContributionTotals {
  return {
    influenceNetPercent: 0,
    reputationNetPercent: 0,
    momentumIndices: [],
    eventCounts: Object.values(TelemetryEventType).reduce<Record<string, number>>((acc, t) => {
      acc[t] = 0;
      return acc;
    }, {}),
  };
}

/** Aggregate raw events for player within [startEpoch, endEpoch) */
export async function aggregateWindow(
  playerId: string,
  granularity: 'DAILY' | 'WEEKLY',
  startEpoch: number,
  endEpoch: number
) {
  const events = await TelemetryEventModel.find({
    playerId: new Types.ObjectId(playerId),
    createdEpoch: { $gte: startEpoch, $lt: endEpoch },
  }).lean();

  const totals = initTotals();

  for (const evt of events) {
    totals.eventCounts[evt.type] = (totals.eventCounts[evt.type] || 0) + 1;
    // Influence contributions
    if (typeof evt.influenceBonusPercent === 'number') {
      totals.influenceNetPercent += evt.influenceBonusPercent;
    }
    if (typeof evt.influenceAppliedPercent === 'number') {
      totals.influenceNetPercent += evt.influenceAppliedPercent;
    }
    // Reputation contributions (simplified: additive reputationScore if present)
    if (typeof evt.reputationScore === 'number') {
      totals.reputationNetPercent += evt.reputationScore; // Future: use delta logic
    }
    // Momentum averaging
    if (typeof evt.newMomentumIndex === 'number') {
      totals.momentumIndices.push(evt.newMomentumIndex);
    }
  }

  const momentumAvgIndex = totals.momentumIndices.length > 0
    ? totals.momentumIndices.reduce((a, b) => a + b, 0) / totals.momentumIndices.length
    : undefined;

  // Upsert aggregate
  await TelemetryAggregateModel.updateOne(
    { playerId: new Types.ObjectId(playerId), granularity, periodStartEpoch: startEpoch },
    {
      $set: {
        periodEndEpoch: endEpoch,
        eventCounts: totals.eventCounts,
        influenceNetPercent: totals.influenceNetPercent,
        reputationNetPercent: totals.reputationNetPercent,
        momentumAvgIndex,
        schemaVersion: 1,
      },
    },
    { upsert: true }
  );

  logger.info('Aggregate upserted', {
    metadata: { playerId, granularity, startEpoch, endEpoch, events: events.length }
  });
}

/** Get distinct player IDs with events in window */
async function distinctPlayers(startEpoch: number, endEpoch: number): Promise<string[]> {
  const rows = await TelemetryEventModel.aggregate([
    { $match: { createdEpoch: { $gte: startEpoch, $lt: endEpoch } } },
    { $group: { _id: '$playerId' } },
  ]);
  return rows.map(r => r._id.toString());
}

/** Run daily aggregation for previous day */
export async function runDailyAggregation(referenceDate: Date = new Date()) {
  const end = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate())); // midnight UTC today
  const endEpoch = Math.floor(end.getTime() / 1000);
  const startEpoch = endEpoch - 24 * 60 * 60; // previous day window
  const players = await distinctPlayers(startEpoch, endEpoch);
  for (const playerId of players) {
    await aggregateWindow(playerId, 'DAILY', startEpoch, endEpoch);
  }
  logger.info('Daily aggregation complete', { metadata: { playerCount: players.length } });
}

/** Run weekly aggregation for previous week (7 calendar days) */
export async function runWeeklyAggregation(referenceDate: Date = new Date()) {
  const end = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()));
  const endEpoch = Math.floor(end.getTime() / 1000);
  const startEpoch = endEpoch - 7 * 24 * 60 * 60;
  const players = await distinctPlayers(startEpoch, endEpoch);
  for (const playerId of players) {
    await aggregateWindow(playerId, 'WEEKLY', startEpoch, endEpoch);
  }
  logger.info('Weekly aggregation complete', { metadata: { playerCount: players.length } });
}

/** Schedule periodic daily/weekly aggregation jobs (basic setInterval strategy) */
export function scheduleAggregations() {
  // Run daily at ~00:05 UTC (300000 ms after midnight) – approximate using setTimeout then daily interval
  const now = Date.now();
  const todayMidnightUtc = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
  const offsetMs = 300000; // 5 minutes
  const firstRunDelay = todayMidnightUtc + offsetMs - now;
  const dayMs = 24 * 60 * 60 * 1000;
  setTimeout(() => {
    void runDailyAggregation();
    setInterval(() => void runDailyAggregation(), dayMs).unref();
  }, Math.max(0, firstRunDelay)).unref();

  // Weekly: run on Monday at 00:10 UTC
  const current = new Date();
  const dayOfWeek = current.getUTCDay(); // 0=Sunday
  const daysUntilMonday = (1 - dayOfWeek + 7) % 7;
  const mondayMidnightUtc = Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() + daysUntilMonday);
  const weeklyOffsetMs = 600000; // 10 minutes
  const firstWeeklyDelay = mondayMidnightUtc + weeklyOffsetMs - now;
  const weekMs = 7 * dayMs;
  setTimeout(() => {
    void runWeeklyAggregation();
    setInterval(() => void runWeeklyAggregation(), weekMs).unref();
  }, Math.max(0, firstWeeklyDelay)).unref();

  logger.info('Aggregation schedules initialized');
}

/** IMPLEMENTATION NOTES:
 * 1. Time math uses UTC to avoid timezone drift; window boundaries are inclusive start / exclusive end.
 * 2. Reputation net calculation simplified; future evolution may store diffs not raw scores.
 * 3. Scheduler design is lightweight; production-grade systems should use durable job queues (e.g. BullMQ).
 * 4. Aggregation queries lean on compound indexes for efficient filtering by time + player.
 */
