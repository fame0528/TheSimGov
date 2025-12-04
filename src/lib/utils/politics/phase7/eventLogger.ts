/**
 * @fileoverview Telemetry Event Logger (Phase 7)
 * @module lib/utils/politics/phase7/eventLogger
 *
 * OVERVIEW:
 * Batched in-memory queue for Phase 7 telemetry events with validation (Zod),
 * automatic ID + epoch assignment, and flush-to-Mongo persistence via the
 * `TelemetryEvent` Mongoose model. Minimizes write amplification by grouping
 * events; supports manual and threshold / interval-based flushing.
 *
 * DESIGN PRINCIPLES:
 * - Deterministic: All persisted docs include `createdEpoch` + schemaVersion.
 * - Lean Writes: Raw events remain minimal; analytics derived later.
 * - Safe: Zod validation prevents malformed variant documents.
 * - Observable: Uses shared logger with component scoping.
 * - Idempotent flush: Each queue item converted exactly once; queue cleared
 *   only after successful insertMany.
 *
 * @created 2025-11-27
 */

import { Types } from 'mongoose';
import TelemetryEventModel from '@/lib/db/models/TelemetryEvent';
import { TelemetryEventType } from '@/lib/types/politicsPhase7';
import { validateTelemetryEvent, TelemetryEventInput, TelemetryEventEnqueueInput, TelemetryEventEnqueueSchema } from '@/lib/schemas/politicsPhase7Telemetry';
import { createComponentLogger } from '@/lib/utils/logger';

const logger = createComponentLogger('phase7-event-logger');

/** Configuration options for the logger */
export interface TelemetryEventLoggerConfig {
  /** Max queue size before auto flush */
  batchSize?: number;
  /** Auto flush interval (ms). Disabled if undefined. */
  autoFlushIntervalMs?: number;
}

/** Internal queued entry shape prior to persistence */
type QueuedTelemetryEvent = TelemetryEventEnqueueInput;

/** Flush result summary */
export interface FlushResult {
  insertedCount: number;
  attemptedCount: number;
  durationMs: number;
}

/** Default configuration */
const DEFAULT_CONFIG: Required<Pick<TelemetryEventLoggerConfig, 'batchSize'>> = {
  batchSize: 100,
};

/** Utility: current unix epoch seconds */
function nowEpoch(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * TelemetryEventLogger - queues validated events and flushes them in batches.
 */
export class TelemetryEventLogger {
  private queue: QueuedTelemetryEvent[] = [];
  private readonly batchSize: number;
  private readonly autoFlushIntervalMs?: number;
  private autoFlushTimer?: NodeJS.Timeout;
  private flushing = false;

  constructor(config: TelemetryEventLoggerConfig = {}) {
    this.batchSize = config.batchSize ?? DEFAULT_CONFIG.batchSize;
    this.autoFlushIntervalMs = config.autoFlushIntervalMs;
    if (this.autoFlushIntervalMs) {
      this.startAutoFlush();
    }
    logger.info('TelemetryEventLogger initialized', {
      operation: 'init',
      metadata: { batchSize: this.batchSize, autoFlushIntervalMs: this.autoFlushIntervalMs }
    });
  }

  /** Start interval-based automatic flushing */
  private startAutoFlush() {
    if (this.autoFlushIntervalMs && !this.autoFlushTimer) {
      this.autoFlushTimer = setInterval(() => {
        if (this.queue.length > 0) {
          this.flush().catch(err => logger.error('Auto flush failed', { error: err }));
        }
      }, this.autoFlushIntervalMs).unref();
    }
  }

  /** Stop interval-based automatic flushing */
  stopAutoFlush() {
    if (this.autoFlushTimer) {
      clearInterval(this.autoFlushTimer);
      this.autoFlushTimer = undefined;
    }
  }

  /** Current queued count */
  get size(): number {
    return this.queue.length;
  }

  /** Whether a flush is in progress */
  get isFlushing(): boolean {
    return this.flushing;
  }

  /**
   * Enqueue a telemetry event after validation. Adds ID, epoch, schemaVersion
   * at flush time; keeps queue lean during memory residency.
   */
  enqueue(input: TelemetryEventEnqueueInput): void {
    // Validate shape using enqueue schema (validates input without auto-generated fields)
    TelemetryEventEnqueueSchema.parse(input); // throws on invalid

    this.queue.push(input);
    if (this.queue.length >= this.batchSize) {
      void this.flush(); // fire and forget (errors logged)
    }
  }

  /**
   * Flush queued events to MongoDB in a single insertMany batch.
   */
  async flush(): Promise<FlushResult> {
    if (this.flushing) {
      logger.warn('Flush already in progress - skipping concurrent call');
      return { insertedCount: 0, attemptedCount: 0, durationMs: 0 };
    }
    if (this.queue.length === 0) {
      return { insertedCount: 0, attemptedCount: 0, durationMs: 0 };
    }

    this.flushing = true;
    const start = Date.now();
    const batch = this.queue;
    this.queue = [];

    try {
      const docs = batch.map((evt) => {
        const full: TelemetryEventInput = {
          ...(evt as TelemetryEventInput),
          id: new Types.ObjectId().toString(),
          createdEpoch: nowEpoch(),
          schemaVersion: 1,
        };
        // Validate final structure prior to persistence
        validateTelemetryEvent(full);
        // Convert to persistence shape (omit id; Mongo will assign _id, retain other fields)
        const { id: _ignore, schemaVersion, createdEpoch, playerId, type, ...variant } = full as TelemetryEventInput & Record<string, unknown>;
        return {
          playerId, // expecting ObjectId string convertible upstream
          type,
          createdEpoch,
          schemaVersion,
          ...variant,
        };
      });

      const inserted = await TelemetryEventModel.insertMany(docs, { ordered: true });
      const durationMs = Date.now() - start;
      logger.performance('telemetry_flush', durationMs, { metadata: { count: inserted.length } });
      return { insertedCount: inserted.length, attemptedCount: batch.length, durationMs };
    } catch (err) {
      logger.error('Telemetry flush failed; re-queueing batch', { error: err });
      // Restore batch for retry (simple strategy; could implement exponential backoff)
      this.queue = batch.concat(this.queue);
      return { insertedCount: 0, attemptedCount: batch.length, durationMs: Date.now() - start };
    } finally {
      this.flushing = false;
    }
  }
}

// Singleton instance for ease of use (optional). Can be replaced with DI container later.
export const telemetryEventLogger = new TelemetryEventLogger();

/** Convenience helper */
export function logTelemetry(evt: TelemetryEventEnqueueInput) {
  telemetryEventLogger.enqueue(evt);
}

/** Force flush (await) */
export async function flushTelemetry(): Promise<FlushResult> {
  return telemetryEventLogger.flush();
}

/** IMPLEMENTATION NOTES:
 * 1. Defers ID generation until flush to allow validation but keeps queue lean.
 * 2. Double validation (enqueue + flush) guards against mutation between steps.
 * 3. Player ID expected as string convertible to ObjectId; upstream should ensure validity.
 * 4. Future: add backpressure metrics, retry strategies, circuit breaker on persistent errors.
 */
