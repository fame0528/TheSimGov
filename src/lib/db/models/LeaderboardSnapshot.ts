/**
 * @file src/lib/db/models/LeaderboardSnapshot.ts
 * @description Historical leaderboard ranking snapshots for trend tracking
 * @created 2025-11-27
 * @author ECHO v1.3.1
 *
 * OVERVIEW:
 * Stores periodic snapshots of player rankings across all LeaderboardMetricType categories.
 * Enables historical ranking visualization, trend calculation (UP/DOWN/STABLE), and
 * competitive analytics. Snapshots taken at configurable intervals (default: daily).
 *
 * KEY DESIGN DECISIONS:
 * - **Multi-Metric Support:** Single model handles all 6 metric types via metricType field
 * - **Trend Calculation:** Compare consecutive snapshots to determine TrendDirection
 * - **Seasonal Partitioning:** seasonId enables competitive resets and historical archives
 * - **Efficient Queries:** Compound indexes on (playerId, metricType, capturedAt)
 * - **TTL Support:** Optional expiration for old snapshots (configurable)
 *
 * USAGE:
 * ```typescript
 * import LeaderboardSnapshot from '@/lib/db/models/LeaderboardSnapshot';
 *
 * // Capture current rankings
 * await LeaderboardSnapshot.captureSnapshot('INFLUENCE', 'S1-2025');
 *
 * // Get player ranking history
 * const history = await LeaderboardSnapshot.getPlayerHistory(
 *   playerId, 'INFLUENCE', 7 // last 7 days
 * );
 *
 * // Calculate trend for player
 * const trend = await LeaderboardSnapshot.calculateTrend(playerId, 'INFLUENCE');
 * ```
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { LeaderboardMetricType, TrendDirection } from '@/lib/types/politics';

// ===================== TYPE DEFINITIONS =====================

/**
 * Leaderboard snapshot document interface
 */
export interface ILeaderboardSnapshot extends Document {
  /** Player/company being ranked */
  playerId: Types.ObjectId;
  
  /** Display name for UI rendering */
  playerName: string;
  
  /** Metric category for this ranking */
  metricType: LeaderboardMetricType;
  
  /** Raw metric value at capture time */
  metricValue: number;
  
  /** Computed rank position (1 = first place) */
  rank: number;
  
  /** Total participants in this metric category at capture time */
  totalParticipants: number;
  
  /** Percentile position (0-100, higher = better) */
  percentile: number;
  
  /** Seasonal partition for competitive resets */
  seasonId: string;
  
  /** Timestamp of snapshot capture */
  capturedAt: Date;
  
  /** Schema version for migrations */
  schemaVersion: number;
}

/**
 * Ranking history point for charts
 */
export interface RankingHistoryPoint {
  capturedAt: Date;
  rank: number;
  metricValue: number;
  percentile: number;
}

/**
 * Leaderboard entry with trend
 */
export interface LeaderboardEntryWithTrend {
  playerId: string;
  playerName: string;
  metricType: LeaderboardMetricType;
  metricValue: number;
  rank: number;
  trend: TrendDirection;
  rankChange: number; // +3 = moved up 3, -2 = dropped 2
  percentile: number;
  seasonId: string;
  lastUpdated: Date;
}

/**
 * Static methods interface
 */
export interface ILeaderboardSnapshotModel extends Model<ILeaderboardSnapshot> {
  /**
   * Capture rankings snapshot for a metric type
   * @param metricType Which metric to snapshot
   * @param seasonId Season identifier
   * @param dataProvider Async function providing current rankings data
   */
  captureSnapshot(
    metricType: LeaderboardMetricType,
    seasonId: string,
    dataProvider: () => Promise<Array<{ playerId: Types.ObjectId; playerName: string; metricValue: number }>>
  ): Promise<ILeaderboardSnapshot[]>;
  
  /**
   * Get player's ranking history for a metric
   * @param playerId Player to query
   * @param metricType Metric category
   * @param days Number of days to look back
   */
  getPlayerHistory(
    playerId: Types.ObjectId | string,
    metricType: LeaderboardMetricType,
    days?: number
  ): Promise<RankingHistoryPoint[]>;
  
  /**
   * Calculate trend for player in a metric
   * @param playerId Player to analyze
   * @param metricType Metric category
   */
  calculateTrend(
    playerId: Types.ObjectId | string,
    metricType: LeaderboardMetricType
  ): Promise<{ trend: TrendDirection; rankChange: number }>;
  
  /**
   * Get current leaderboard with trends
   * @param metricType Metric category
   * @param limit Max entries to return
   */
  getCurrentLeaderboard(
    metricType: LeaderboardMetricType,
    limit?: number
  ): Promise<LeaderboardEntryWithTrend[]>;
}

// ===================== SCHEMA DEFINITION =====================

const LeaderboardSnapshotSchema = new Schema<ILeaderboardSnapshot>(
  {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Player ID is required'],
      index: true,
    },
    playerName: {
      type: String,
      required: [true, 'Player name is required'],
      maxlength: [100, 'Player name cannot exceed 100 characters'],
    },
    metricType: {
      type: String,
      required: [true, 'Metric type is required'],
      enum: {
        values: Object.values(LeaderboardMetricType),
        message: '{VALUE} is not a valid metric type',
      },
      index: true,
    },
    metricValue: {
      type: Number,
      required: [true, 'Metric value is required'],
      min: [0, 'Metric value cannot be negative'],
    },
    rank: {
      type: Number,
      required: [true, 'Rank is required'],
      min: [1, 'Rank must be at least 1'],
    },
    totalParticipants: {
      type: Number,
      required: [true, 'Total participants is required'],
      min: [1, 'Must have at least 1 participant'],
    },
    percentile: {
      type: Number,
      required: [true, 'Percentile is required'],
      min: [0, 'Percentile cannot be negative'],
      max: [100, 'Percentile cannot exceed 100'],
    },
    seasonId: {
      type: String,
      required: [true, 'Season ID is required'],
      index: true,
    },
    capturedAt: {
      type: Date,
      required: [true, 'Capture timestamp is required'],
      default: Date.now,
      // Note: index handled by TTL index below, not here
    },
    schemaVersion: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  {
    timestamps: true,
    collection: 'leaderboard_snapshots',
  }
);

// ===================== INDEXES =====================

// Primary query pattern: player history for a metric
LeaderboardSnapshotSchema.index({ playerId: 1, metricType: 1, capturedAt: -1 });

// Leaderboard display: latest snapshot for each metric
LeaderboardSnapshotSchema.index({ metricType: 1, capturedAt: -1, rank: 1 });

// Season-based queries
LeaderboardSnapshotSchema.index({ seasonId: 1, metricType: 1, capturedAt: -1 });

// TTL index for automatic cleanup (90 days default)
LeaderboardSnapshotSchema.index(
  { capturedAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 } // 90 days
);

// ===================== STATIC METHODS =====================

LeaderboardSnapshotSchema.statics.captureSnapshot = async function(
  metricType: LeaderboardMetricType,
  seasonId: string,
  dataProvider: () => Promise<Array<{ playerId: Types.ObjectId; playerName: string; metricValue: number }>>
): Promise<ILeaderboardSnapshot[]> {
  const data = await dataProvider();
  
  if (data.length === 0) {
    return [];
  }
  
  // Sort by metric value descending
  const sorted = [...data].sort((a, b) => b.metricValue - a.metricValue);
  const totalParticipants = sorted.length;
  const capturedAt = new Date();
  
  // Create snapshot documents
  const snapshots = sorted.map((entry, index) => ({
    playerId: entry.playerId,
    playerName: entry.playerName,
    metricType,
    metricValue: entry.metricValue,
    rank: index + 1,
    totalParticipants,
    percentile: ((totalParticipants - index) / totalParticipants) * 100,
    seasonId,
    capturedAt,
    schemaVersion: 1,
  }));
  
  // Bulk insert
  return this.insertMany(snapshots);
};

LeaderboardSnapshotSchema.statics.getPlayerHistory = async function(
  playerId: Types.ObjectId | string,
  metricType: LeaderboardMetricType,
  days: number = 7
): Promise<RankingHistoryPoint[]> {
  const playerOid = typeof playerId === 'string' ? new Types.ObjectId(playerId) : playerId;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const snapshots = await this.find({
    playerId: playerOid,
    metricType,
    capturedAt: { $gte: cutoff },
  })
    .sort({ capturedAt: 1 })
    .select({ capturedAt: 1, rank: 1, metricValue: 1, percentile: 1 })
    .lean();
  
  return snapshots.map((s: any) => ({
    capturedAt: s.capturedAt,
    rank: s.rank,
    metricValue: s.metricValue,
    percentile: s.percentile,
  }));
};

LeaderboardSnapshotSchema.statics.calculateTrend = async function(
  playerId: Types.ObjectId | string,
  metricType: LeaderboardMetricType
): Promise<{ trend: TrendDirection; rankChange: number }> {
  const playerOid = typeof playerId === 'string' ? new Types.ObjectId(playerId) : playerId;
  
  // Get last 2 snapshots for this player/metric
  const snapshots = await this.find({
    playerId: playerOid,
    metricType,
  })
    .sort({ capturedAt: -1 })
    .limit(2)
    .select({ rank: 1 })
    .lean();
  
  if (snapshots.length < 2) {
    return { trend: TrendDirection.STABLE, rankChange: 0 };
  }
  
  const currentRank = snapshots[0].rank;
  const previousRank = snapshots[1].rank;
  const rankChange = previousRank - currentRank; // Positive = moved up (lower rank is better)
  
  let trend: TrendDirection;
  if (rankChange > 0) {
    trend = TrendDirection.UP;
  } else if (rankChange < 0) {
    trend = TrendDirection.DOWN;
  } else {
    trend = TrendDirection.STABLE;
  }
  
  return { trend, rankChange };
};

LeaderboardSnapshotSchema.statics.getCurrentLeaderboard = async function(
  metricType: LeaderboardMetricType,
  limit: number = 10
): Promise<LeaderboardEntryWithTrend[]> {
  // Get most recent snapshot date for this metric
  const latestSnapshot = await this.findOne({ metricType })
    .sort({ capturedAt: -1 })
    .select({ capturedAt: 1 })
    .lean();
  
  if (!latestSnapshot) {
    return [];
  }
  
  // Get all entries from that snapshot
  const entries = await this.find({
    metricType,
    capturedAt: latestSnapshot.capturedAt,
  })
    .sort({ rank: 1 })
    .limit(limit)
    .lean();
  
  // Calculate trends for each entry
  const entriesWithTrends: LeaderboardEntryWithTrend[] = [];
  
  for (const entry of entries) {
    const trendResult = await (this as ILeaderboardSnapshotModel).calculateTrend(entry.playerId, metricType);
    
    entriesWithTrends.push({
      playerId: String(entry.playerId),
      playerName: entry.playerName,
      metricType: entry.metricType as LeaderboardMetricType,
      metricValue: entry.metricValue,
      rank: entry.rank,
      trend: trendResult.trend,
      rankChange: trendResult.rankChange,
      percentile: entry.percentile,
      seasonId: entry.seasonId,
      lastUpdated: entry.capturedAt,
    });
  }
  
  return entriesWithTrends;
};

// ===================== MODEL EXPORT =====================

const LeaderboardSnapshot = (mongoose.models.LeaderboardSnapshot ||
  mongoose.model<ILeaderboardSnapshot, ILeaderboardSnapshotModel>(
    'LeaderboardSnapshot',
    LeaderboardSnapshotSchema
  )) as ILeaderboardSnapshotModel;

export default LeaderboardSnapshot;

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Multi-Metric Support:**
 *    - Single model handles all LeaderboardMetricType values
 *    - Compound indexes enable efficient per-metric queries
 *    - No need for separate models per metric type
 *
 * 2. **Trend Calculation:**
 *    - Compare current vs previous snapshot for same player/metric
 *    - rankChange = previousRank - currentRank (positive = improvement)
 *    - TrendDirection enum: UP, DOWN, STABLE
 *
 * 3. **Percentile Tracking:**
 *    - Percentile = ((total - rank + 1) / total) * 100
 *    - Higher percentile = better ranking
 *    - Enables "Top X%" badges/achievements
 *
 * 4. **Snapshot Capture:**
 *    - dataProvider callback allows flexible data sources
 *    - Bulk insert for efficiency
 *    - Consistent capturedAt across all entries in snapshot
 *
 * 5. **TTL Cleanup:**
 *    - Automatic expiration after 90 days
 *    - Prevents unbounded collection growth
 *    - Adjust expireAfterSeconds for different retention
 *
 * 6. **Seasonal Partitioning:**
 *    - seasonId enables competitive resets
 *    - Historical seasons archived but queryable
 *    - Format: S{number}-{year} (e.g., S1-2025)
 */
