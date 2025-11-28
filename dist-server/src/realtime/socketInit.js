"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
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
const socket_io_1 = require("socket.io");
const mongoose_1 = require("../lib/db/mongoose");
const ChatMessage_1 = __importDefault(require("../lib/db/models/ChatMessage"));
const chat_1 = require("../lib/validations/chat");
function createRateLimiter({ max = 10, windowMs = 10000 } = {}) {
    const buckets = new Map();
    return function rateLimit(socketId) {
        const now = Date.now();
        const arr = buckets.get(socketId) || [];
        const filtered = arr.filter(t => now - t < windowMs);
        filtered.push(now);
        buckets.set(socketId, filtered);
        return filtered.length <= max;
    };
}
// Per-room rate limiter (tracks events per socket per room)
function createRoomRateLimiter({ max = 40, windowMs = 60000 } = {}) {
    const buckets = new Map(); // room -> socketId -> timestamps
    return function rateLimitRoom(room, socketId) {
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
function containsProfanity(text) {
    if (!text)
        return false;
    const banned = [
        'badword1', 'badword2', 'idiot', 'stupid', 'dumb',
        'i$d!ot', 'stup1d'
    ];
    const lowered = text.toLowerCase();
    return banned.some(w => lowered.includes(w));
}
function dmRoomFor(userA, userB) {
    if (!userA || !userB)
        return null;
    const [a, b] = [String(userA), String(userB)].sort();
    return `dm:${a}_${b}`;
}
function identifyUser(socket) {
    var _a, _b;
    const authUserId = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.userId;
    const userId = authUserId || ((_b = socket.handshake.query) === null || _b === void 0 ? void 0 : _b.userId) || `anon-${socket.id}`;
    return { userId: String(userId) };
}
function initSocket(server, { dev }) {
    const io = new socket_io_1.Server(server, {
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
    const rateLimit = createRateLimiter({ max: 10, windowMs: 10000 });
    const rateLimitRoom = createRoomRateLimiter({ max: 40, windowMs: 60000 });
    const userInfractions = new Map();
    const userMutes = new Map(); // userId -> muteUntil
    const INFRACTION_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
    const INFRACTION_THRESHOLD = 3;
    const MUTE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
    function registerInfraction(userId) {
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
    function applyMute(userId) {
        const until = Date.now() + MUTE_DURATION_MS;
        userMutes.set(userId, until);
        return until;
    }
    function isMuted(userId) {
        const until = userMutes.get(userId);
        if (!until)
            return false;
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
        // JOIN
        socket.on('chat:join', (room) => {
            if (!room)
                return;
            socket.join(room);
            socket.to(room).emit('chat:user-joined', { userId, socketId: socket.id });
        });
        socket.on('join-room', (room) => socket.emit('chat:deprecated', { event: 'join-room' }) || socket.emit('chat:join', room));
        // LEAVE
        socket.on('chat:leave', (room) => { if (!room)
            return; socket.leave(room); socket.to(room).emit('chat:user-left', { userId, socketId: socket.id }); });
        socket.on('leave-room', (room) => socket.emit('chat:deprecated', { event: 'leave-room' }) || socket.emit('chat:leave', room));
        // DM JOIN
        socket.on('chat:dm:join', ({ otherUserId }) => {
            const room = dmRoomFor(userId, otherUserId);
            if (!room)
                return;
            socket.join(room);
            socket.emit('chat:dm:joined', { room });
        });
        // TYPING
        socket.on('chat:typing:start', ({ room }) => room && socket.to(room).emit('chat:typing', { userId }));
        socket.on('chat:typing:stop', ({ room }) => room && socket.to(room).emit('chat:typing:stop', { userId }));
        socket.on('typing-start', ({ roomId }) => socket.emit('chat:deprecated', { event: 'typing-start' }) || socket.emit('chat:typing:start', { room: roomId }));
        socket.on('typing-stop', ({ roomId }) => socket.emit('chat:deprecated', { event: 'typing-stop' }) || socket.emit('chat:typing:stop', { room: roomId }));
        // SEND
        socket.on('chat:send', async (payload) => {
            const parsed = chat_1.SendMessageSchema.safeParse(payload);
            if (!parsed.success)
                return socket.emit('chat:error', { code: 'INVALID_PAYLOAD', issues: parsed.error.issues });
            const { room, content, tempId } = parsed.data;
            const muteUntil = isMuted(userId);
            if (muteUntil)
                return socket.emit('chat:error', { code: 'MUTE_ACTIVE', until: muteUntil });
            if (!rateLimit(socket.id))
                return socket.emit('chat:error', { code: 'RATE_LIMIT_GLOBAL' });
            if (!rateLimitRoom(room, socket.id))
                return socket.emit('chat:error', { code: 'RATE_LIMIT_ROOM', room });
            if (containsProfanity(content)) {
                const count = registerInfraction(userId);
                if (count >= INFRACTION_THRESHOLD) {
                    const until = applyMute(userId);
                    // Broadcast system mute notification to all rooms the user is currently in
                    socket.rooms.forEach(r => {
                        if (r.startsWith('/'))
                            return; // internal namespace room
                        socket.to(r).emit('chat:system', { type: 'mute-applied', userId, durationMs: MUTE_DURATION_MS, until });
                        socket.emit('chat:system', { type: 'mute-applied', userId, durationMs: MUTE_DURATION_MS, until });
                    });
                    return socket.emit('chat:error', { code: 'PROFANITY_MUTE', until });
                }
                return socket.emit('chat:error', { code: 'PROFANITY_BLOCKED', infractions: count, threshold: INFRACTION_THRESHOLD });
            }
            const serverTimestamp = Date.now();
            const optimistic = { id: tempId || `m_${serverTimestamp}_${Math.random().toString(36).slice(2)}`, room, userId, content, timestamp: serverTimestamp, optimistic: true };
            socket.emit('chat:ack', optimistic);
            try {
                await (0, mongoose_1.connectDB)();
                const doc = await ChatMessage_1.default.create({ room, userId, content, schemaVersion: 1 });
                const authoritative = { id: String(doc._id), room: doc.room, userId: String(doc.userId), content: doc.content, timestamp: doc.createdAt.getTime(), optimistic: false };
                socket.emit('chat:message', authoritative);
                socket.to(room).emit('chat:message', authoritative);
            }
            catch (err) {
                console.error('[Chat] Persist error', err);
                socket.emit('chat:error', { code: 'PERSIST_FAILED' });
            }
        });
        // HISTORY
        socket.on('chat:history:request', async (payload) => {
            const parsed = chat_1.HistoryRequestSchema.safeParse(payload);
            if (!parsed.success)
                return socket.emit('chat:error', { code: 'INVALID_HISTORY_PAYLOAD', issues: parsed.error.issues });
            const { room, cursor, limit } = parsed.data;
            const pageLimit = Math.min(Math.max(limit || 50, 1), 200);
            try {
                await (0, mongoose_1.connectDB)();
                const query = { room };
                if (cursor)
                    query.createdAt = { $lt: new Date(cursor) };
                const docs = await ChatMessage_1.default.find(query).sort({ createdAt: -1 }).limit(pageLimit).lean();
                const messages = docs.map(d => ({ id: String(d._id), room: d.room, userId: String(d.userId), content: d.content, timestamp: new Date(d.createdAt).getTime() })).reverse();
                const nextCursor = docs.length === pageLimit ? new Date(docs[docs.length - 1].createdAt).getTime() : null;
                socket.emit('chat:history', { room, messages, nextCursor });
            }
            catch (err) {
                console.error('[Chat] History error', err);
                socket.emit('chat:error', { code: 'HISTORY_FAILED' });
            }
        });
        // LEGACY SEND MAPPING
        socket.on('send-message', ({ roomId, message }) => {
            socket.emit('chat:deprecated', { event: 'send-message' });
            socket.emit('chat:send', { room: roomId, content: message, tempId: `legacy_${Date.now()}` });
        });
        socket.on('disconnect', () => console.log(`[Chat] Disconnected socket=${socket.id} user=${userId}`));
    });
    // ELECTIONS
    elections.on('connection', (socket) => {
        console.log(`[Elections] Connected ${socket.id}`);
        socket.on('join-election', (electionId) => electionId && socket.join(`election-${electionId}`));
        socket.on('leave-election', (electionId) => electionId && socket.leave(`election-${electionId}`));
        socket.on('cast-vote', ({ electionId, candidateId, playerId, companyId }) => {
            if (!electionId || !candidateId)
                return;
            elections.to(`election-${electionId}`).emit('vote-cast', { electionId, candidateId, playerId, companyId, timestamp: new Date().toISOString() });
            elections.emit('election-update', { electionId, type: 'vote', candidateId, timestamp: new Date().toISOString() });
        });
        socket.on('campaign-contribution', ({ electionId, candidateId, amount, contributorId }) => {
            if (!electionId || !candidateId)
                return;
            elections.to(`election-${electionId}`).emit('contribution-made', { electionId, candidateId, amount, contributorId, timestamp: new Date().toISOString() });
        });
        socket.on('disconnect', () => console.log(`[Elections] Disconnected ${socket.id}`));
    });
    // MARKET
    market.on('connection', (socket) => {
        console.log(`[Market] Connected ${socket.id}`);
        socket.on('subscribe-market', ({ marketType, companyId }) => { if (!marketType)
            return; socket.join(`market-${marketType}`); if (companyId)
            socket.join(`company-${companyId}-market`); });
        socket.on('unsubscribe-market', ({ marketType, companyId }) => { if (!marketType)
            return; socket.leave(`market-${marketType}`); if (companyId)
            socket.leave(`company-${companyId}-market`); });
        socket.on('place-order', ({ marketType, orderType, companyId, amount, price }) => { if (!marketType || !orderType)
            return; market.to(`market-${marketType}`).emit('order-placed', { marketType, orderType, companyId, amount, price, timestamp: new Date().toISOString() }); });
        socket.on('cancel-order', ({ marketType, orderId, companyId }) => { if (!marketType || !orderId)
            return; market.to(`market-${marketType}`).emit('order-cancelled', { marketType, orderId, companyId, timestamp: new Date().toISOString() }); });
        socket.on('market-data-request', ({ marketType }) => { if (!marketType)
            return; socket.emit('market-data-update', { marketType, data: {}, timestamp: new Date().toISOString() }); });
        socket.on('disconnect', () => console.log(`[Market] Disconnected ${socket.id}`));
    });
    return { io, namespaces: { chat, elections, market } };
}
exports.default = initSocket;
//# sourceMappingURL=socketInit.js.map