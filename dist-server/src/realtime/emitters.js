"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastAchievement = broadcastAchievement;
exports.broadcastLegislation = broadcastLegislation;
exports.broadcastLobbyAttempt = broadcastLobbyAttempt;
exports.broadcastSystemEvent = broadcastSystemEvent;
const mongoose_1 = require("../lib/db/mongoose");
const ChatMessage_1 = __importDefault(require("../lib/db/models/ChatMessage"));
// ---------------------------
// Internal Helpers
// ---------------------------
function getIO() {
    return global.io; // declared in global.d.ts
}
async function maybePersist(message, room) {
    try {
        await (0, mongoose_1.connectDB)();
        await ChatMessage_1.default.create({ room, userId: 'system', content: message, schemaVersion: 1 });
    }
    catch (err) {
        console.error('[Emitters] System message persist failed', err);
    }
}
function formatSystemContent(payload) {
    switch (payload.type) {
        case 'achievement':
            return `🏆 Achievement: ${payload.title} (${payload.rarity}) by user ${payload.userId}`;
        case 'legislation':
            return `📜 Legislation Update: [${payload.billId}] ${payload.title} → ${payload.status}`;
        case 'lobby-attempt':
            return `🤝 Lobby Attempt: lobbyist ${payload.lobbyistId} targeting bill ${payload.targetBillId} (influence ${payload.influenceScore}${payload.success === undefined ? '' : payload.success ? ', success' : ', failed'})`;
        default:
            return 'System Event';
    }
}
function emitSystem(payload, options = {}) {
    var _a;
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
    if ((_a = options.broadcastRooms) === null || _a === void 0 ? void 0 : _a.length) {
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
function broadcastAchievement(params, options) {
    const payload = { type: 'achievement', timestamp: Date.now(), ...params };
    return emitSystem(payload, { persist: true, ...options });
}
function broadcastLegislation(params, options) {
    const payload = { type: 'legislation', timestamp: Date.now(), ...params };
    return emitSystem(payload, { persist: true, ...options });
}
function broadcastLobbyAttempt(params, options) {
    const payload = { type: 'lobby-attempt', timestamp: Date.now(), ...params };
    return emitSystem(payload, { persist: true, ...options });
}
// ---------------------------
// Convenience Bulk Broadcast
// ---------------------------
function broadcastSystemEvent(payload, options) {
    return emitSystem({ ...payload, timestamp: payload.timestamp || Date.now() }, options);
}
/**
 * IMPLEMENTATION NOTES:
 * - Persistence uses a synthetic userId 'system' to distinguish from real users.
 * - Frontend can render persisted system messages with special styling based on payload.type.
 * - Emission functions return boolean indicating io availability rather than throwing.
 */
//# sourceMappingURL=emitters.js.map