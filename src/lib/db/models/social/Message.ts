/**
 * @fileoverview Message Model
 * @module lib/db/models/social/Message
 * 
 * OVERVIEW:
 * Mongoose model for player-to-player messages.
 * Supports rich text (HTML), threading, attachments, and soft delete.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

import mongoose, { Schema, Model, Types } from 'mongoose';
import type { IMessage, MessageAttachment } from '@/lib/types/messages';

// ============================================================
// SCHEMA DEFINITION
// ============================================================

const AttachmentSchema = new Schema<MessageAttachment>(
  {
    type: {
      type: String,
      enum: ['currency'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    claimed: {
      type: Boolean,
      default: false,
    },
    claimedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    // Participants
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderUsername: {
      type: String,
      required: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientUsername: {
      type: String,
      required: true,
    },
    
    // Content
    subject: {
      type: String,
      required: true,
      maxlength: 150,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      maxlength: 10000, // HTML can be larger than plain text limit
    },
    bodyPlainText: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    
    // Threading
    threadId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    parentMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    
    // Attachments
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
    
    // Status flags
    isRead: {
      type: Boolean,
      default: false,
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
    isDeletedBySender: {
      type: Boolean,
      default: false,
    },
    isDeletedByRecipient: {
      type: Boolean,
      default: false,
    },
    
    // Read timestamp
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'messages',
  }
);

// ============================================================
// INDEXES
// ============================================================

// Inbox query: recipient's non-deleted messages, newest first
MessageSchema.index(
  { recipientId: 1, isDeletedByRecipient: 1, createdAt: -1 },
  { name: 'inbox_query' }
);

// Sent query: sender's non-deleted messages, newest first
MessageSchema.index(
  { senderId: 1, isDeletedBySender: 1, createdAt: -1 },
  { name: 'sent_query' }
);

// Unread count: recipient's unread messages
MessageSchema.index(
  { recipientId: 1, isRead: 1, isDeletedByRecipient: 1 },
  { name: 'unread_count' }
);

// Thread messages: all messages in a thread, chronological
MessageSchema.index(
  { threadId: 1, createdAt: 1 },
  { name: 'thread_messages' }
);

// Starred messages: user's starred messages
MessageSchema.index(
  { recipientId: 1, isStarred: 1, isDeletedByRecipient: 1, createdAt: -1 },
  { name: 'starred_inbox' }
);

MessageSchema.index(
  { senderId: 1, isStarred: 1, isDeletedBySender: 1, createdAt: -1 },
  { name: 'starred_sent' }
);

// Full-text search on subject and body
MessageSchema.index(
  { subject: 'text', bodyPlainText: 'text' },
  { name: 'message_search' }
);

// ============================================================
// STATIC METHODS
// ============================================================

MessageSchema.statics.getUnreadCount = async function(userId: Types.ObjectId): Promise<number> {
  return this.countDocuments({
    recipientId: userId,
    isRead: false,
    isDeletedByRecipient: false,
  });
};

MessageSchema.statics.markAsRead = async function(
  messageId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<boolean> {
  const result = await this.updateOne(
    {
      _id: messageId,
      recipientId: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );
  return result.modifiedCount > 0;
};

// ============================================================
// MODEL EXPORT
// ============================================================

export interface MessageModel extends Model<IMessage> {
  getUnreadCount(userId: Types.ObjectId): Promise<number>;
  markAsRead(messageId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean>;
}

const Message = (mongoose.models.Message as MessageModel) || 
  mongoose.model<IMessage, MessageModel>('Message', MessageSchema);

export default Message;
