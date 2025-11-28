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
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IChatMessage extends Document {
  room: string;                 // Room identifier (global, company:{id}, politics, dm:{a}_{b})
  userId: Types.ObjectId;       // Sender user ID (system messages may use synthetic user later)
  content: string;              // Message content (<=500 chars)
  edited: boolean;              // Edited flag (future feature; currently always false)
  system: boolean;              // System generated message (announcements); userId may be placeholder
  schemaVersion: 1;             // Literal version for migrations
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    room: {
      type: String,
      required: [true, 'room is required'],
      trim: true,
      minlength: [1, 'room cannot be empty'],
      maxlength: [100, 'room too long']
    },
    userId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
    collection: 'chat_messages'
  }
);

// Pagination index (room + createdAt desc)
ChatMessageSchema.index({ room: 1, createdAt: -1 }, { name: 'room_createdAt_desc' });
// Player-centric history (future queries)
ChatMessageSchema.index({ userId: 1, createdAt: -1 }, { name: 'user_createdAt_desc' });

const ChatMessage: Model<IChatMessage> =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;

/**
 * IMPLEMENTATION NOTES:
 * 1. No duplicate field-level indices; compound indices defined once (GUARDIAN compliance).
 * 2. edited/system flags reserved for future moderation/edit features.
 * 3. schemaVersion literal supports forward migrations (adding reactions, attachments, etc.).
 */
