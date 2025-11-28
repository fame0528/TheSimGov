/**
 * @file src/realtime/socketInit.js
 * @description Initializes Socket.io namespaces and real-time event handling.
 * @created 2025-11-27
 *
 * OVERVIEW:
 * Modular Socket.io initialization providing:
 *  - Chat namespace with DM/global/company/politics rooms
 *  - Elections namespace (legacy logic preserved)
 *  - Market namespace (legacy logic preserved)
 *  - Basic rate limiting + profanity filtering (extensible)
 *  - Optimistic message ACK pattern for chat
 *  - Canonical DM room naming (dm:{lowerId}_{higherId})
 *
 * This file intentionally uses CommonJS to integrate with existing Node server.js.
 */

const { Server } = require('socket.io');

/** Simple in-memory global rate limiter (sliding window per socket). */
function createRateLimiter({ max = 10, windowMs = 10_000 } = {}) {
  const buckets = new Map(); // socketId -> [timestamps]
  return function rateLimit(socketId) {
    const now = Date.now();
    const arr = buckets.get(socketId) || [];
    const filtered = arr.filter((t) => now - t < windowMs);
    filtered.push(now);
    buckets.set(socketId, filtered);
    return filtered.length <= max;
  };
}

/** Per-room rate limiter (tracks events per socket per room). */
function createRoomRateLimiter({ max = 20, windowMs = 60_000 } = {}) {
  const buckets = new Map(); // room -> Map(socketId -> [timestamps])
  return function rateLimitRoom(room, socketId) {
    const now = Date.now();
    let roomMap = buckets.get(room);
    if (!roomMap) {
      roomMap = new Map();
      buckets.set(room, roomMap);
    }
    const arr = roomMap.get(socketId) || [];
    const filtered = arr.filter((t) => now - t < windowMs);
    filtered.push(now);
    roomMap.set(socketId, filtered);
    return filtered.length <= max;
  };
}

/** Very basic profanity filter placeholder (extend later). */
function containsProfanity(text) {
  if (!text) return false;
  // Expanded placeholder list (will be externalized later)
  const banned = [
    'badword1', 'badword2', 'idiot', 'stupid', 'dumb',
    // Add variants / leetspeak minimal examples
    'i$d!ot', 'stup1d'
  ];
  const lowered = text.toLowerCase();
  return banned.some((w) => lowered.includes(w));
}

/** Canonical DM room helper: ensures deterministic ordering. */
function dmRoomFor(userA, userB) {
  if (!userA || !userB) return null;
  const [a, b] = [String(userA), String(userB)].sort();
  return `dm:${a}_${b}`;
}

/** Basic auth/user identification stub (replace with real session/userId extraction). */
function identifyUser(socket) {
  // Prefer explicit handshake auth; fallback to pseudo ID (NOT for production)
  const authUserId = socket.handshake.auth && socket.handshake.auth.userId;
  const userId = authUserId || socket.handshake.query.userId || `anon-${socket.id}`;
  return { userId };
}

module.exports = function initSocket(server, { dev }) {
  // Lazy load DB connection + model to avoid circular imports at startup
  const { connectDB } = require('../lib/db/mongoose');
  let ChatMessageModel = null;
  function getChatMessageModel() {
    if (ChatMessageModel) return ChatMessageModel;
    // Require on first use (CommonJS safe)
    ChatMessageModel = require('../lib/db/models/ChatMessage').default;
    return ChatMessageModel;
  }
  const io = new Server(server, {
    cors: {
      origin: dev ? 'http://localhost:3000' : process.env.NEXTAUTH_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // --- Namespaces ---
  const chat = io.of('/chat');
  const elections = io.of('/elections');
  const market = io.of('/market');

  const rateLimit = createRateLimiter({ max: 10, windowMs: 10_000 });
  const rateLimitRoom = createRoomRateLimiter({ max: 40, windowMs: 60_000 });

  // Moderation state
  const userInfractions = new Map(); // userId -> { count, windowStart }
  const userMutes = new Map(); // userId -> muteUntil timestamp
  const INFRACTION_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  const INFRACTION_THRESHOLD = 3;
  const MUTE_DURATION_MS = 5 * 60 * 1000; // 5 minutes temporary mute

  function registerInfraction(userId) {
    const now = Date.now();
    const entry = userInfractions.get(userId);
    if (!entry) {
      userInfractions.set(userId, { count: 1, windowStart: now });
      return 1;
    }
    if (now - entry.windowStart > INFRACTION_WINDOW_MS) {
      userInfractions.set(userId, { count: 1, windowStart: now });
      return 1;
    }
    entry.count += 1;
    return entry.count;
  }

  function applyMute(userId) {
    const until = Date.now() + MUTE_DURATION_MS;
    userMutes.set(userId, until);
    return until;
  }

  function isMuted(userId) {
    const until = userMutes.get(userId);
    if (!until) return false;
    if (Date.now() > until) {
      userMutes.delete(userId);
      return false;
    }
    return until;
  }

  // CHAT NAMESPACE
  chat.on('connection', (socket) => {
    const { userId } = identifyUser(socket);
    socket.data.userId = userId;
    console.log(`[Chat] Connected socket=${socket.id} user=${userId}`);

    // Room join (global/company/politics/custom)
    socket.on('chat:join', (room) => {
      if (!room) return;
      socket.join(room);
      socket.to(room).emit('chat:user-joined', { userId, socketId: socket.id });
    });

    // Legacy support for existing client events
    socket.on('join-room', (room) => socket.emit('chat:deprecated', { event: 'join-room' }) || socket.emit('chat:join', room));

    socket.on('chat:leave', (room) => {
      if (!room) return;
      socket.leave(room);
      socket.to(room).emit('chat:user-left', { userId, socketId: socket.id });
    });
    socket.on('leave-room', (room) => socket.emit('chat:deprecated', { event: 'leave-room' }) || socket.emit('chat:leave', room));

    // Direct message join helper
    socket.on('chat:dm:join', ({ otherUserId }) => {
      const room = dmRoomFor(userId, otherUserId);
      if (!room) return;
      socket.join(room);
      socket.emit('chat:dm:joined', { room });
    });

    // Typing indicators
    socket.on('chat:typing:start', ({ room }) => {
      if (room) socket.to(room).emit('chat:typing', { userId });
    });
    socket.on('chat:typing:stop', ({ room }) => {
      if (room) socket.to(room).emit('chat:typing:stop', { userId });
    });
    // Legacy mapping
    socket.on('typing-start', ({ roomId }) => socket.emit('chat:deprecated', { event: 'typing-start' }) || socket.emit('chat:typing:start', { room: roomId }));
    socket.on('typing-stop', ({ roomId }) => socket.emit('chat:deprecated', { event: 'typing-stop' }) || socket.emit('chat:typing:stop', { room: roomId }));

    // Optimistic send with ACK + persistence
    socket.on('chat:send', async ({ room, content, tempId }) => {
      if (!room || typeof content !== 'string' || !content.trim()) return;
      // Check mute
      const muteUntil = isMuted(userId);
      if (muteUntil) {
        return socket.emit('chat:error', { code: 'MUTE_ACTIVE', until: muteUntil });
      }
      if (content.length > 500) return socket.emit('chat:error', { code: 'CONTENT_TOO_LONG', max: 500 });
      if (!rateLimit(socket.id)) return socket.emit('chat:error', { code: 'RATE_LIMIT_GLOBAL' });
      if (!rateLimitRoom(room, socket.id)) return socket.emit('chat:error', { code: 'RATE_LIMIT_ROOM', room });
      if (containsProfanity(content)) {
        const count = registerInfraction(userId);
        if (count >= INFRACTION_THRESHOLD) {
          const until = applyMute(userId);
          // Broadcast system event of mute
          for (const r of socket.rooms) {
            if (r.startsWith('/')) continue; // internal room id for namespace
            socket.to(r).emit('chat:system', { type: 'mute-applied', userId, durationMs: MUTE_DURATION_MS, until });
            socket.emit('chat:system', { type: 'mute-applied', userId, durationMs: MUTE_DURATION_MS, until });
          }
          return socket.emit('chat:error', { code: 'PROFANITY_MUTE', until });
        }
        return socket.emit('chat:error', { code: 'PROFANITY_BLOCKED', infractions: count, threshold: INFRACTION_THRESHOLD });
      }

      const serverTimestamp = Date.now();
      const provisionalId = tempId || `m_${serverTimestamp}_${Math.random().toString(36).slice(2)}`;
      // Immediate ACK (optimistic)
      socket.emit('chat:ack', {
        id: provisionalId,
        room,
        userId,
        content,
        timestamp: serverTimestamp,
        optimistic: true,
      });
      // Persist and broadcast authoritative message
      try {
        await connectDB();
        const ChatMessage = getChatMessageModel();
        const doc = await ChatMessage.create({
          room,
          userId,
          content,
          createdAt: new Date(serverTimestamp),
          updatedAt: new Date(serverTimestamp),
          schemaVersion: 1,
        });
        const authoritative = {
          id: String(doc._id),
            room: doc.room,
            userId: String(doc.userId),
            content: doc.content,
            timestamp: doc.createdAt.getTime(),
            optimistic: false,
        };
        // Replace sender optimistic copy
        socket.emit('chat:message', authoritative);
        socket.to(room).emit('chat:message', authoritative);
      } catch (err) {
        console.error('[Chat] Persistence error:', err);
        socket.emit('chat:error', { code: 'PERSIST_FAILED' });
      }
    });

    // History retrieval (pagination by createdAt descending, then returned ascending)
    socket.on('chat:history:request', async ({ room, cursor, limit }) => {
      if (!room) return socket.emit('chat:error', { code: 'ROOM_REQUIRED' });
      const pageLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
      try {
        await connectDB();
        const ChatMessage = getChatMessageModel();
        const query = { room };
        if (cursor) {
          query.createdAt = { $lt: new Date(Number(cursor)) };
        }
        const docs = await ChatMessage.find(query)
          .sort({ createdAt: -1 })
          .limit(pageLimit)
          .lean();
        const messages = docs
          .map(d => ({ id: String(d._id), room: d.room, userId: String(d.userId), content: d.content, timestamp: new Date(d.createdAt).getTime() }))
          .reverse(); // chronological ascending for client rendering
        const nextCursor = docs.length === pageLimit ? new Date(docs[docs.length - 1].createdAt).getTime() : null;
        socket.emit('chat:history', { room, messages, nextCursor });
      } catch (err) {
        console.error('[Chat] History fetch error:', err);
        socket.emit('chat:error', { code: 'HISTORY_FAILED' });
      }
    });

    // Legacy event mapping
    socket.on('send-message', ({ roomId, message, playerId, playerName }) => {
      // Map legacy fields to new structure
      socket.emit('chat:deprecated', { event: 'send-message' });
      socket.emit('chat:send', { room: roomId, content: message, tempId: `legacy_${Date.now()}` });
    });

    socket.on('disconnect', () => {
      console.log(`[Chat] Disconnected socket=${socket.id} user=${userId}`);
    });
  });

  // ELECTIONS NAMESPACE (legacy logic preserved)
  elections.on('connection', (socket) => {
    console.log(`[Elections] Connected ${socket.id}`);
    socket.on('join-election', (electionId) => electionId && socket.join(`election-${electionId}`));
    socket.on('leave-election', (electionId) => electionId && socket.leave(`election-${electionId}`));
    socket.on('cast-vote', ({ electionId, candidateId, playerId, companyId }) => {
      if (!electionId || !candidateId) return;
      elections.to(`election-${electionId}`).emit('vote-cast', {
        electionId,
        candidateId,
        playerId,
        companyId,
        timestamp: new Date().toISOString(),
      });
      elections.emit('election-update', {
        electionId,
        type: 'vote',
        candidateId,
        timestamp: new Date().toISOString(),
      });
    });
    socket.on('campaign-contribution', ({ electionId, candidateId, amount, contributorId }) => {
      if (!electionId || !candidateId) return;
      elections.to(`election-${electionId}`).emit('contribution-made', {
        electionId,
        candidateId,
        amount,
        contributorId,
        timestamp: new Date().toISOString(),
      });
    });
    socket.on('disconnect', () => console.log(`[Elections] Disconnected ${socket.id}`));
  });

  // MARKET NAMESPACE (legacy logic preserved)
  market.on('connection', (socket) => {
    console.log(`[Market] Connected ${socket.id}`);
    socket.on('subscribe-market', ({ marketType, companyId }) => {
      if (!marketType) return;
      socket.join(`market-${marketType}`);
      if (companyId) socket.join(`company-${companyId}-market`);
    });
    socket.on('unsubscribe-market', ({ marketType, companyId }) => {
      if (!marketType) return;
      socket.leave(`market-${marketType}`);
      if (companyId) socket.leave(`company-${companyId}-market`);
    });
    socket.on('place-order', ({ marketType, orderType, companyId, amount, price }) => {
      if (!marketType || !orderType) return;
      market.to(`market-${marketType}`).emit('order-placed', {
        marketType,
        orderType,
        companyId,
        amount,
        price,
        timestamp: new Date().toISOString(),
      });
    });
    socket.on('cancel-order', ({ marketType, orderId, companyId }) => {
      if (!marketType || !orderId) return;
      market.to(`market-${marketType}`).emit('order-cancelled', {
        marketType,
        orderId,
        companyId,
        timestamp: new Date().toISOString(),
      });
    });
    socket.on('market-data-request', ({ marketType }) => {
      if (!marketType) return;
      socket.emit('market-data-update', { marketType, data: {}, timestamp: new Date().toISOString() });
    });
    socket.on('disconnect', () => console.log(`[Market] Disconnected ${socket.id}`));
  });

  return { io, namespaces: { chat, elections, market } };
};
