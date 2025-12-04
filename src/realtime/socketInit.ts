/**
 * @file src/realtime/socketInit.ts
 * @description TypeScript Socket.io initialization with chat persistence & history
 * @created 2025-11-27
 *
 * OVERVIEW:
 * Provides namespaced realtime functionality:
 *  - /chat: messaging (optimistic ACK → authoritative persist), typing indicators, history pagination
 *  - /elections: legacy political events (vote, contribution)
 *  - /market: legacy market subscription and order flow
 *
 * Utility-first design: shared helpers (rate limiter, DM room canonicalization, profanity filter). Persistence
 * uses ChatMessage model with pagination index. Maintains legacy event mappings for backward compatibility.
 */
import { Server, Socket } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { connectDB } from '../lib/db/mongoose';
import ChatMessage, { IChatMessage } from '../lib/db/models/ChatMessage';
import ChatUnread from '../lib/db/models/ChatUnread';
import { SendMessageSchema, HistoryRequestSchema } from '../lib/validations/chat';

interface InitOptions { dev: boolean }
interface OptimisticAckPayload {
  id: string; room: string; userId: string; content: string; timestamp: number; optimistic: boolean;
}

function createRateLimiter({ max = 10, windowMs = 10_000 } = {}) {
  const buckets = new Map<string, number[]>();
  return function rateLimit(socketId: string): boolean {
    const now = Date.now();
    const arr = buckets.get(socketId) || [];
    const filtered = arr.filter(t => now - t < windowMs);
    filtered.push(now);
    buckets.set(socketId, filtered);
    return filtered.length <= max;
  };
}

// Per-room rate limiter (tracks events per socket per room)
function createRoomRateLimiter({ max = 40, windowMs = 60_000 } = {}) {
  const buckets = new Map<string, Map<string, number[]>>(); // room -> socketId -> timestamps
  return function rateLimitRoom(room: string, socketId: string): boolean {
    const now = Date.now();
    let roomMap = buckets.get(room);
    if (!roomMap) {
      roomMap = new Map();
      buckets.set(room, roomMap);
    }
    const arr = roomMap.get(socketId) || [];
    const filtered = arr.filter(t => now - t < windowMs);
    filtered.push(now);
    roomMap.set(socketId, filtered);
    return filtered.length <= max;
  };
}

function containsProfanity(text: string): boolean {
  if (!text) return false;
  const banned = [
    'badword1', 'badword2', 'idiot', 'stupid', 'dumb',
    'i$d!ot', 'stup1d'
  ];
  const lowered = text.toLowerCase();
  return banned.some(w => lowered.includes(w));
}

function dmRoomFor(userA: string, userB: string): string | null {
  if (!userA || !userB) return null;
  const [a, b] = [String(userA), String(userB)].sort();
  return `dm:${a}_${b}`;
}

function identifyUser(socket: Socket): { userId: string } {
  const auth = socket.handshake.auth as { userId?: string } | undefined;
  const query = socket.handshake.query as { userId?: string } | undefined;
  const authUserId = auth?.userId;
  const userId = authUserId || query?.userId || `anon-${socket.id}`;
  return { userId: String(userId) };
}

export function initSocket(server: HTTPServer, { dev }: InitOptions) {
  const io = new Server(server, {
    cors: {
      origin: dev ? 'http://localhost:3000' : process.env.NEXTAUTH_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  const chat = io.of('/chat');
  const elections = io.of('/elections');
  const market = io.of('/market');
  const rateLimit = createRateLimiter({ max: 10, windowMs: 10_000 });
  const rateLimitRoom = createRoomRateLimiter({ max: 40, windowMs: 60_000 });

  // Moderation state tracking
  interface InfractionState { count: number; windowStart: number }
  const userInfractions = new Map<string, InfractionState>();
  const userMutes = new Map<string, number>(); // userId -> muteUntil
  const INFRACTION_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  const INFRACTION_THRESHOLD = 3;
  const MUTE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  function registerInfraction(userId: string): number {
    const now = Date.now();
    const existing = userInfractions.get(userId);
    if (!existing) {
      userInfractions.set(userId, { count: 1, windowStart: now });
      return 1;
    }
    if (now - existing.windowStart > INFRACTION_WINDOW_MS) {
      userInfractions.set(userId, { count: 1, windowStart: now });
      return 1;
    }
    existing.count += 1;
    return existing.count;
  }

  function applyMute(userId: string): number {
    const until = Date.now() + MUTE_DURATION_MS;
    userMutes.set(userId, until);
    return until;
  }

  function isMuted(userId: string): number | false {
    const until = userMutes.get(userId);
    if (!until) return false;
    if (Date.now() > until) {
      userMutes.delete(userId);
      return false;
    }
    return until;
  }

  // CHAT
  chat.on('connection', (socket) => {
    const { userId } = identifyUser(socket);
    socket.data.userId = userId;

    // On connect, emit a summary of unread counts across known rooms for this user (best-effort)
    (async () => {
      try {
        await connectDB();
        const states = await ChatUnread.find({ userId }).lean();
        const summary: Array<{ room: string; unread: number }> = [];
        for (const s of states) {
          const lastRead = s.lastReadAt || new Date(0);
          const unread = await ChatMessage.countDocuments({ room: s.room, createdAt: { $gt: lastRead } });
          summary.push({ room: s.room, unread });
        }
        if (summary.length > 0) {
          socket.emit('chat:system', { type: 'unread-summary', summary });
        }
      } catch { }
    })();
    // JOIN
    socket.on('chat:join', (room: string) => {
      if (!room) return; socket.join(room); socket.to(room).emit('chat:user-joined', { userId, socketId: socket.id });
      // Emit unread count for this room
      (async () => {
        try {
          await connectDB();
          const state = await ChatUnread.findOne({ userId, room }).lean();
          const lastRead = state?.lastReadAt || new Date(0);
          const unread = await ChatMessage.countDocuments({ room, createdAt: { $gt: lastRead } });
          socket.emit('chat:unread', { room, unread });
        } catch (e) {
          // non-blocking
        }
      })();
    });
    socket.on('join-room', (room: string) => socket.emit('chat:deprecated', { event: 'join-room' }) || socket.emit('chat:join', room));
    // LEAVE
    socket.on('chat:leave', (room: string) => { if (!room) return; socket.leave(room); socket.to(room).emit('chat:user-left', { userId, socketId: socket.id }); });
    socket.on('leave-room', (room: string) => socket.emit('chat:deprecated', { event: 'leave-room' }) || socket.emit('chat:leave', room));
    // DM JOIN
    socket.on('chat:dm:join', ({ otherUserId }: { otherUserId: string }) => {
      const room = dmRoomFor(userId, otherUserId); if (!room) return; socket.join(room); socket.emit('chat:dm:joined', { room });
    });
    // TYPING
    socket.on('chat:typing:start', ({ room }: { room: string }) => room && socket.to(room).emit('chat:typing', { userId }));
    socket.on('chat:typing:stop', ({ room }: { room: string }) => room && socket.to(room).emit('chat:typing:stop', { userId }));
    socket.on('typing-start', ({ roomId }: { roomId: string }) => socket.emit('chat:deprecated', { event: 'typing-start' }) || socket.emit('chat:typing:start', { room: roomId }));
    socket.on('typing-stop', ({ roomId }: { roomId: string }) => socket.emit('chat:deprecated', { event: 'typing-stop' }) || socket.emit('chat:typing:stop', { room: roomId }));

    // SEND
    socket.on('chat:send', async (payload: any) => {
      const parsed = SendMessageSchema.safeParse(payload);
      if (!parsed.success) return socket.emit('chat:error', { code: 'INVALID_PAYLOAD', issues: parsed.error.issues });
      const { room, content, tempId } = parsed.data;
      const muteUntil = isMuted(userId);
      if (muteUntil) return socket.emit('chat:error', { code: 'MUTE_ACTIVE', until: muteUntil });
      if (!rateLimit(socket.id)) return socket.emit('chat:error', { code: 'RATE_LIMIT_GLOBAL' });
      if (!rateLimitRoom(room, socket.id)) return socket.emit('chat:error', { code: 'RATE_LIMIT_ROOM', room });
      if (containsProfanity(content)) {
        const count = registerInfraction(userId);
        if (count >= INFRACTION_THRESHOLD) {
          const until = applyMute(userId);
          // Broadcast system mute notification to all rooms the user is currently in
          socket.rooms.forEach(r => {
            if (r.startsWith('/')) return; // internal namespace room
            socket.to(r).emit('chat:system', { type: 'mute-applied', userId, durationMs: MUTE_DURATION_MS, until });
            socket.emit('chat:system', { type: 'mute-applied', userId, durationMs: MUTE_DURATION_MS, until });
          });
          return socket.emit('chat:error', { code: 'PROFANITY_MUTE', until });
        }
        return socket.emit('chat:error', { code: 'PROFANITY_BLOCKED', infractions: count, threshold: INFRACTION_THRESHOLD });
      }
      const serverTimestamp = Date.now();
      const optimistic: OptimisticAckPayload = { id: tempId || `m_${serverTimestamp}_${Math.random().toString(36).slice(2)}`, room, userId, content, timestamp: serverTimestamp, optimistic: true };
      socket.emit('chat:ack', optimistic);
      try {
        await connectDB();
        const doc = await ChatMessage.create({ room, userId, content, schemaVersion: 1 });
        const authoritative: OptimisticAckPayload = { id: String(doc._id), room: doc.room, userId: String(doc.userId), content: doc.content, timestamp: doc.createdAt.getTime(), optimistic: false };
        socket.emit('chat:message', authoritative);
        socket.to(room).emit('chat:message', authoritative);
        // Update unread counters for other users in room (best-effort)
        try {
          const roomSockets = chat.adapter.rooms.get(room);
          const recipients = new Set<string>();
          roomSockets?.forEach((sid) => {
            const s = chat.sockets.get(sid);
            if (s && s.data.userId && s.data.userId !== userId) recipients.add(String(s.data.userId));
          });
          const now = new Date(doc.createdAt);
          for (const uid of recipients) {
            const state = await ChatUnread.findOne({ userId: uid, room }).lean();
            const lastRead = state?.lastReadAt || new Date(0);
            if (now > lastRead) {
              const unread = await ChatMessage.countDocuments({ room, createdAt: { $gt: lastRead } });
              chat.to(room).emit('chat:unread:update', { room, userId: uid, unread });
            }
          }
        } catch { }
      } catch (err) {
        console.error('[Chat] Persist error', err);
        socket.emit('chat:error', { code: 'PERSIST_FAILED' });
      }
    });

    // HISTORY
    socket.on('chat:history:request', async (payload: any) => {
      const parsed = HistoryRequestSchema.safeParse(payload);
      if (!parsed.success) return socket.emit('chat:error', { code: 'INVALID_HISTORY_PAYLOAD', issues: parsed.error.issues });
      const { room, cursor, limit } = parsed.data;
      const pageLimit = Math.min(Math.max(limit || 50, 1), 200);
      try {
        await connectDB();
        const query: any = { room };
        if (cursor) query.createdAt = { $lt: new Date(cursor) };
        const docs = await ChatMessage.find(query).sort({ createdAt: -1 }).limit(pageLimit).lean<IChatMessage[]>();
        const messages = docs.map(d => ({ id: String(d._id), room: d.room, userId: String(d.userId), content: d.content, timestamp: new Date(d.createdAt).getTime() })).reverse();
        const nextCursor = docs.length === pageLimit ? new Date(docs[docs.length - 1].createdAt).getTime() : null;
        socket.emit('chat:history', { room, messages, nextCursor });
      } catch (err) {
        console.error('[Chat] History error', err);
        socket.emit('chat:error', { code: 'HISTORY_FAILED' });
      }
    });

    // MARK READ
    socket.on('chat:read:mark', async ({ room, at }: { room: string; at?: number }) => {
      if (!room) return;
      const when = at ? new Date(at) : new Date();
      try {
        await connectDB();
        await ChatUnread.updateOne(
          { userId, room },
          { $set: { lastReadAt: when } },
          { upsert: true }
        );
        const unread = await ChatMessage.countDocuments({ room, createdAt: { $gt: when } });
        socket.emit('chat:unread', { room, unread });
      } catch (err) {
        socket.emit('chat:error', { code: 'READ_MARK_FAILED' });
      }
    });

    // LEGACY SEND MAPPING
    socket.on('send-message', ({ roomId, message }: { roomId: string; message: string }) => {
      socket.emit('chat:deprecated', { event: 'send-message' });
      socket.emit('chat:send', { room: roomId, content: message, tempId: `legacy_${Date.now()}` });
    });

    socket.on('disconnect', () => console.log(`[Chat] Disconnected socket=${socket.id} user=${userId}`));
  });

  // ELECTIONS
  elections.on('connection', (socket) => {
    console.log(`[Elections] Connected ${socket.id}`);
    socket.on('join-election', (electionId: string) => electionId && socket.join(`election-${electionId}`));
    socket.on('leave-election', (electionId: string) => electionId && socket.leave(`election-${electionId}`));
    socket.on('cast-vote', ({ electionId, candidateId, playerId, companyId }: any) => {
      if (!electionId || !candidateId) return;
      elections.to(`election-${electionId}`).emit('vote-cast', { electionId, candidateId, playerId, companyId, timestamp: new Date().toISOString() });
      elections.emit('election-update', { electionId, type: 'vote', candidateId, timestamp: new Date().toISOString() });
    });
    socket.on('campaign-contribution', ({ electionId, candidateId, amount, contributorId }: any) => {
      if (!electionId || !candidateId) return;
      elections.to(`election-${electionId}`).emit('contribution-made', { electionId, candidateId, amount, contributorId, timestamp: new Date().toISOString() });
    });
    socket.on('disconnect', () => console.log(`[Elections] Disconnected ${socket.id}`));
  });

  // MARKET
  market.on('connection', (socket) => {
    console.log(`[Market] Connected ${socket.id}`);
    socket.on('subscribe-market', ({ marketType, companyId }: any) => { if (!marketType) return; socket.join(`market-${marketType}`); if (companyId) socket.join(`company-${companyId}-market`); });
    socket.on('unsubscribe-market', ({ marketType, companyId }: any) => { if (!marketType) return; socket.leave(`market-${marketType}`); if (companyId) socket.leave(`company-${companyId}-market`); });
    socket.on('place-order', ({ marketType, orderType, companyId, amount, price }: any) => { if (!marketType || !orderType) return; market.to(`market-${marketType}`).emit('order-placed', { marketType, orderType, companyId, amount, price, timestamp: new Date().toISOString() }); });
    socket.on('cancel-order', ({ marketType, orderId, companyId }: any) => { if (!marketType || !orderId) return; market.to(`market-${marketType}`).emit('order-cancelled', { marketType, orderId, companyId, timestamp: new Date().toISOString() }); });
    socket.on('market-data-request', ({ marketType }: any) => { if (!marketType) return; socket.emit('market-data-update', { marketType, data: {}, timestamp: new Date().toISOString() }); });
    socket.on('disconnect', () => console.log(`[Market] Disconnected ${socket.id}`));
  });

  // USER (real-time user data updates)
  const user = io.of('/user');
  user.on('connection', (socket) => {
    const { userId } = identifyUser(socket);
    socket.data.userId = userId;
    console.log(`[User] Connected ${socket.id} user=${userId}`);

    // Join user's personal room for targeted updates
    socket.join(`user-${userId}`);

    socket.on('disconnect', () => console.log(`[User] Disconnected ${socket.id} user=${userId}`));
  });

  return { io, namespaces: { chat, elections, market, user } };
}
export default initSocket;
