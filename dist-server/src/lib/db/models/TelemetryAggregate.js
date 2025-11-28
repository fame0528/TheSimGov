"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
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
const mongoose_1 = __importStar(require("mongoose"));
const TelemetryAggregateSchema = new mongoose_1.Schema({
    playerId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.Mixed,
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
}, {
    timestamps: true,
    collection: 'telemetry_aggregates'
});
// Unique compound index to prevent duplicate rollups for same player/period/granularity
TelemetryAggregateSchema.index({ playerId: 1, granularity: 1, periodStartEpoch: 1 }, { unique: true, name: 'uniq_player_granularity_periodStart' });
// Range queries for dashboards (fetch all players for a given period window)
TelemetryAggregateSchema.index({ granularity: 1, periodStartEpoch: 1 }, { name: 'granularity_period_start' });
const TelemetryAggregate = mongoose_1.default.models.TelemetryAggregate || mongoose_1.default.model('TelemetryAggregate', TelemetryAggregateSchema);
exports.default = TelemetryAggregate;
/**
 * IMPLEMENTATION NOTES:
 * 1. eventCounts uses Mixed for flexible addition of new event types without schema migration; keys must
 *    map to TelemetryEventType strings at application layer.
 * 2. periodEndEpoch stored explicitly (exclusive) to avoid recomputing window boundaries.
 * 3. Future evolution: add rolling volatility metrics or percentile ranks (schemaVersion bump).
 */ 
//# sourceMappingURL=TelemetryAggregate.js.map