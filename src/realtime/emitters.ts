/**
 * @file src/realtime/emitters.ts
 * @description System event emitter utilities for achievements, legislation, and lobby attempts.
 * @created 2025-11-27
 *
 * OVERVIEW:
 * Provides typed helper functions that broadcast structured system events across Socket.io namespaces
 * and optionally persist a corresponding system message in the chat history for auditability.
 *
 * DESIGN PRINCIPLES (ECHO Compliance):
 *  - Utility-first: Pure functions without side effects beyond emission & optional persistence.
 *  - DRY: Shared internal emit/persist logic used by all event helpers.
 *  - Type Safety: Explicit TypeScript interfaces; no `any` or unsafe assertions.
 *  - Composability: Frontend can subscribe to `chat:system` plus domain-specific events.
 */
import type { Server as SocketIOServer } from 'socket.io';
import { connectDB } from '../lib/db/mongoose';
import ChatMessage from '../lib/db/models/ChatMessage';

// ---------------------------
// Shared Types
// ---------------------------

interface BaseSystemPayload {
  type: string;        // discriminator for frontend handling
  timestamp: number;   // epoch ms
  meta?: Record<string, unknown>; // additional structured data
}

export interface AchievementSystemPayload extends BaseSystemPayload {
  type: 'achievement';
  achievementId: string;
  userId: string;
  title: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface LegislationSystemPayload extends BaseSystemPayload {
  type: 'legislation';
  billId: string;
  title: string;
  status: 'introduced' | 'committee' | 'floor' | 'passed' | 'vetoed';
  sponsorId: string;
}

export interface LobbyAttemptSystemPayload extends BaseSystemPayload {
  type: 'lobby-attempt';
  lobbyistId: string;
  targetBillId: string;
  influenceScore: number; // scaled score used for success probability
  success?: boolean;      // optional outcome indicator
}

export interface LeaderboardUpdateSystemPayload extends BaseSystemPayload {
  type: 'leaderboard-update';
  metric: string;         // LeaderboardMetricType value
  entries: Array<{
    playerId: string;
    playerName: string;
    rank: number;
    metricValue: number;
    trend: string;        // TrendDirection value
    rankChange: number;
  }>;
  seasonId: string;
}

export interface RankChangeSystemPayload extends BaseSystemPayload {
  type: 'rank-change';
  playerId: string;
  playerName: string;
  metric: string;         // LeaderboardMetricType value
  oldRank: number;
  newRank: number;
  trend: string;          // TrendDirection value
  seasonId: string;
}

export type AnySystemPayload =
  | AchievementSystemPayload
  | LegislationSystemPayload
  | LobbyAttemptSystemPayload
  | LeaderboardUpdateSystemPayload
  | RankChangeSystemPayload;

interface EmitOptions {
  persist?: boolean;          // if true, store a ChatMessage system entry
  persistRoom?: string;       // target room for persistence (default: 'system')
  broadcastRooms?: string[];  // optional subset of rooms; if omitted, full namespace broadcast
}

// ---------------------------
// Internal Helpers
// ---------------------------

function getIO(): SocketIOServer | undefined {
  return global.io; // declared in global.d.ts
}

async function maybePersist(message: string, room: string) {
  try {
    await connectDB();
    await ChatMessage.create({ room, userId: 'system', content: message, schemaVersion: 1 });
  } catch (err) {
    console.error('[Emitters] System message persist failed', err);
  }
}

function formatSystemContent(payload: AnySystemPayload): string {
  switch (payload.type) {
    case 'achievement':
      return `🏆 Achievement: ${payload.title} (${payload.rarity}) by user ${payload.userId}`;
    case 'legislation':
      return `📜 Legislation Update: [${payload.billId}] ${payload.title} → ${payload.status}`;
    case 'lobby-attempt':
      return `🤝 Lobby Attempt: lobbyist ${payload.lobbyistId} targeting bill ${payload.targetBillId} (influence ${payload.influenceScore}${payload.success === undefined ? '' : payload.success ? ', success' : ', failed'})`;
    case 'leaderboard-update':
      return `📊 Leaderboard: ${payload.metric} rankings updated (${payload.entries.length} entries)`;
    case 'rank-change':
      const direction = payload.newRank < payload.oldRank ? '📈' : '📉';
      return `${direction} Rank Change: ${payload.playerName} moved from #${payload.oldRank} to #${payload.newRank} in ${payload.metric}`;
    default:
      return 'System Event';
  }
}

function emitSystem(payload: AnySystemPayload, options: EmitOptions = {}): boolean {
  const io = getIO();
  if (!io) {
    console.warn('[Emitters] io unavailable for system emission');
    return false;
  }
  const chatNS = io.of('/chat');
  const electionsNS = io.of('/elections');

  // Always emit a generic chat system event
  chatNS.emit('chat:system', payload);

  // Domain-specific mirroring
  if (payload.type === 'legislation') {
    electionsNS.emit('legislation:system', payload);
  }

  // Leaderboard events go to elections namespace
  if (payload.type === 'leaderboard-update') {
    electionsNS.emit('leaderboard:update', payload);
  }
  if (payload.type === 'rank-change') {
    electionsNS.emit('leaderboard:rank-change', payload);
  }

  if (options.broadcastRooms?.length) {
    options.broadcastRooms.forEach(room => chatNS.to(room).emit('chat:system', payload));
  }

  // Optional persistence
  if (options.persist) {
    const text = formatSystemContent(payload);
    void maybePersist(text, options.persistRoom || 'system');
  }
  return true;
}

// ---------------------------
// Public Emitters
// ---------------------------

export function broadcastAchievement(params: Omit<AchievementSystemPayload, 'timestamp' | 'type'>, options?: EmitOptions) {
  const payload: AchievementSystemPayload = { type: 'achievement', timestamp: Date.now(), ...params };
  return emitSystem(payload, { persist: true, ...options });
}

export function broadcastLegislation(params: Omit<LegislationSystemPayload, 'timestamp' | 'type'>, options?: EmitOptions) {
  const payload: LegislationSystemPayload = { type: 'legislation', timestamp: Date.now(), ...params };
  return emitSystem(payload, { persist: true, ...options });
}

export function broadcastLobbyAttempt(params: Omit<LobbyAttemptSystemPayload, 'timestamp' | 'type'>, options?: EmitOptions) {
  const payload: LobbyAttemptSystemPayload = { type: 'lobby-attempt', timestamp: Date.now(), ...params };
  return emitSystem(payload, { persist: true, ...options });
}

/**
 * Broadcast leaderboard update to all connected clients
 * @param params Leaderboard update data (metric, entries, seasonId)
 * @param options Emit options (persist, broadcastRooms)
 */
export function broadcastLeaderboardUpdate(
  params: Omit<LeaderboardUpdateSystemPayload, 'timestamp' | 'type'>,
  options?: EmitOptions
) {
  const payload: LeaderboardUpdateSystemPayload = {
    type: 'leaderboard-update',
    timestamp: Date.now(),
    ...params,
  };
  return emitSystem(payload, { persist: false, ...options }); // Don't persist leaderboard updates (too frequent)
}

/**
 * Broadcast individual rank change notification
 * @param params Rank change data (playerId, playerName, metric, oldRank, newRank, trend, seasonId)
 * @param options Emit options (persist, broadcastRooms)
 */
export function broadcastRankChange(
  params: Omit<RankChangeSystemPayload, 'timestamp' | 'type'>,
  options?: EmitOptions
) {
  const payload: RankChangeSystemPayload = {
    type: 'rank-change',
    timestamp: Date.now(),
    ...params,
  };
  // Persist significant rank changes (top 10 movements)
  const shouldPersist = params.oldRank <= 10 || params.newRank <= 10;
  return emitSystem(payload, { persist: shouldPersist, ...options });
}

// ---------------------------
// Convenience Bulk Broadcast
// ---------------------------

export function broadcastSystemEvent(payload: AnySystemPayload, options?: EmitOptions) {
  const fullPayload: AnySystemPayload = {
    ...payload,
    timestamp: payload.timestamp || Date.now(),
  };
  return emitSystem(fullPayload, options);
}

/**
 * IMPLEMENTATION NOTES:
 * - Persistence uses a synthetic userId 'system' to distinguish from real users.
 * - Frontend can render persisted system messages with special styling based on payload.type.
 * - Emission functions return boolean indicating io availability rather than throwing.
 */
