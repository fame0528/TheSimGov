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
 * @file src/lib/db/models/ChatMessage.ts
 * @description Persistent storage for realtime chat messages with room + time pagination
 * @created 2025-11-27
 *
 * OVERVIEW:
 * Stores authoritative chat messages for all rooms (global, company, politics, dm:*).
 * Provides efficient reverse-chronological pagination for history requests using
 * compound index (room + createdAt desc). Avoids duplicate index definitions (GUARDIAN #17).
 *
 * INDEX STRATEGY:
 * - Compound index { room: 1, createdAt: -1 } for pagination.
 * - Optional secondary index { userId: 1, createdAt: -1 } for player history (future use).
 */
const mongoose_1 = __importStar(require("mongoose"));
const ChatMessageSchema = new mongoose_1.Schema({
    room: {
        type: String,
        required: [true, 'room is required'],
        trim: true,
        minlength: [1, 'room cannot be empty'],
        maxlength: [100, 'room too long']
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'userId is required']
    },
    content: {
        type: String,
        required: [true, 'content is required'],
        trim: true,
        maxlength: [500, 'content exceeds 500 characters']
    },
    edited: {
        type: Boolean,
        required: true,
        default: false
    },
    system: {
        type: Boolean,
        required: true,
        default: false
    },
    schemaVersion: {
        type: Number,
        required: true,
        default: 1
    }
}, {
    timestamps: true,
    collection: 'chat_messages'
});
// Pagination index (room + createdAt desc)
ChatMessageSchema.index({ room: 1, createdAt: -1 }, { name: 'room_createdAt_desc' });
// Player-centric history (future queries)
ChatMessageSchema.index({ userId: 1, createdAt: -1 }, { name: 'user_createdAt_desc' });
const ChatMessage = mongoose_1.default.models.ChatMessage || mongoose_1.default.model('ChatMessage', ChatMessageSchema);
exports.default = ChatMessage;
/**
 * IMPLEMENTATION NOTES:
 * 1. No duplicate field-level indices; compound indices defined once (GUARDIAN compliance).
 * 2. edited/system flags reserved for future moderation/edit features.
 * 3. schemaVersion literal supports forward migrations (adding reactions, attachments, etc.).
 */
//# sourceMappingURL=ChatMessage.js.map