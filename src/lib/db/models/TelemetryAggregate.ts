/**
 * @file src/lib/db/models/TelemetryAggregate.ts
 * @description Daily / Weekly rollup aggregates derived from raw telemetry events
 * @created 2025-11-27
 *
 * OVERVIEW:
 * Stores pre-computed aggregate metrics per player and period for fast dashboard
 * queries (counts per event type, net influence/reputation deltas, average momentum).
 * Granularity limited to DAILY / WEEKLY for Phase 7 scope. Aggregates are immutable
 * after creation except for backfill correction jobs (rare – requires admin tooling).
 *
 * INDEX STRATEGY:
 * - Unique compound (playerId + granularity + periodStartEpoch) prevents duplicate rollups.
 * - Secondary index on (granularity + periodStartEpoch) for batch range queries.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type AggregateGranularity = 'DAILY' | 'WEEKLY';

export interface ITelemetryAggregate extends Document {
  playerId: Types.ObjectId;
  granularity: AggregateGranularity;
  periodStartEpoch: number;        // Inclusive epoch (seconds)
  periodEndEpoch: number;          // Exclusive epoch (seconds)
  eventCounts: Record<string, number>; // Keyed by TelemetryEventType string
  influenceNetPercent: number;
  reputationNetPercent: number;
  momentumAvgIndex?: number;       // Optional if momentum seen in window
  schemaVersion: 1;
  createdAt: Date;
  updatedAt: Date;
}

const TelemetryAggregateSchema = new Schema<ITelemetryAggregate>(
  {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'playerId is required']
    },
    granularity: {
      type: String,
      required: [true, 'granularity is required'],
      enum: {
        values: ['DAILY', 'WEEKLY'],
        message: '{VALUE} is not a valid aggregate granularity'
      }
    },
    periodStartEpoch: {
      type: Number,
      required: [true, 'periodStartEpoch is required'],
      min: [0, 'periodStartEpoch cannot be negative']
    },
    periodEndEpoch: {
      type: Number,
      required: [true, 'periodEndEpoch is required'],
      min: [0, 'periodEndEpoch cannot be negative']
    },
    eventCounts: {
      type: Schema.Types.Mixed,
      required: [true, 'eventCounts are required'],
      default: {}
    },
    influenceNetPercent: {
      type: Number,
      required: [true, 'influenceNetPercent is required'],
      default: 0
    },
    reputationNetPercent: {
      type: Number,
      required: [true, 'reputationNetPercent is required'],
      default: 0
    },
    momentumAvgIndex: {
      type: Number,
      min: [0, 'momentumAvgIndex must be >= 0'],
      max: [1, 'momentumAvgIndex must be <= 1']
    },
    schemaVersion: {
      type: Number,
      required: true,
      default: 1
    }
  },
  {
    timestamps: true,
    collection: 'telemetry_aggregates'
  }
);

// Unique compound index to prevent duplicate rollups for same player/period/granularity
TelemetryAggregateSchema.index(
  { playerId: 1, granularity: 1, periodStartEpoch: 1 },
  { unique: true, name: 'uniq_player_granularity_periodStart' }
);

// Range queries for dashboards (fetch all players for a given period window)
TelemetryAggregateSchema.index({ granularity: 1, periodStartEpoch: 1 }, { name: 'granularity_period_start' });

const TelemetryAggregate: Model<ITelemetryAggregate> =
  mongoose.models.TelemetryAggregate || mongoose.model<ITelemetryAggregate>('TelemetryAggregate', TelemetryAggregateSchema);

export default TelemetryAggregate;

/**
 * IMPLEMENTATION NOTES:
 * 1. eventCounts uses Mixed for flexible addition of new event types without schema migration; keys must
 *    map to TelemetryEventType strings at application layer.
 * 2. periodEndEpoch stored explicitly (exclusive) to avoid recomputing window boundaries.
 * 3. Future evolution: add rolling volatility metrics or percentile ranks (schemaVersion bump).
 */