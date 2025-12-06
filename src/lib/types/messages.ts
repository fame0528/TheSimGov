/**
 * @fileoverview Message System Types
 * @module lib/types/messages
 * 
 * OVERVIEW:
 * TypeScript interfaces for the in-game messaging system.
 * Supports rich text messages, threading, attachments, and user search.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

import type { ObjectId } from 'mongoose';

// ============================================================
// CORE MESSAGE TYPES
// ============================================================

/**
 * Attachment types for messages
 */
export type AttachmentType = 'currency';

/**
 * Message attachment (currency transfer)
 */
export interface MessageAttachment {
  type: AttachmentType;
  amount: number;
  claimed: boolean;
  claimedAt?: Date;
}

/**
 * Attachment DTO for API responses
 */
export interface AttachmentDTO {
  type: AttachmentType;
  amount: number;
  claimed: boolean;
  claimedAt?: string;
}

/**
 * Message document interface (database)
 * Note: _id is automatically added by Mongoose
 */
export interface IMessage {
  // Participants
  senderId: ObjectId;
  senderUsername: string;
  recipientId: ObjectId;
  recipientUsername: string;
  
  // Content
  subject: string;
  body: string;              // HTML content from TipTap
  bodyPlainText: string;     // Stripped text for search/preview
  
  // Threading
  threadId: ObjectId;
  parentMessageId?: ObjectId;
  
  // Attachments
  attachments: MessageAttachment[];
  
  // Status flags
  isRead: boolean;
  isStarred: boolean;
  isDeletedBySender: boolean;
  isDeletedByRecipient: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
}

/**
 * Message DTO for API responses
 */
export interface MessageDTO {
  id: string;
  senderId: string;
  senderUsername: string;
  recipientId: string;
  recipientUsername: string;
  subject: string;
  body: string;
  bodyPreview: string;       // First 100 chars of plain text
  threadId: string;
  parentMessageId?: string;
  attachments: AttachmentDTO[];
  isRead: boolean;
  isStarred: boolean;
  folder: MessageFolder;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
}

/**
 * Message list item (condensed for inbox/sent views)
 */
export interface MessageListItem {
  id: string;
  otherPartyId: string;
  otherPartyUsername: string;
  subject: string;
  bodyPreview: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachment: boolean;
  createdAt: string;
}

// ============================================================
// THREAD TYPES
// ============================================================

/**
 * Message thread interface (database)
 */
export interface IMessageThread {
  _id: ObjectId;
  participantIds: ObjectId[];
  participantUsernames: string[];
  subject: string;
  lastMessageAt: Date;
  lastMessagePreview: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Thread DTO for API responses
 */
export interface MessageThreadDTO {
  id: string;
  participantIds: string[];
  participantUsernames: string[];
  subject: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  messageCount: number;
  unreadCount: number;
}

// ============================================================
// API REQUEST/RESPONSE TYPES
// ============================================================

/**
 * Send message request
 */
export interface SendMessageRequest {
  recipientUsername: string;
  subject: string;
  body: string;
  parentMessageId?: string;
  attachments?: {
    type: 'currency';
    amount: number;
  }[];
}

/**
 * Create message request (alias for SendMessageRequest)
 */
export interface CreateMessageRequest {
  recipientUsername: string;
  subject: string;
  content: string;
  parentMessageId?: string;
  attachments?: {
    type: 'currency';
    amount: number;
  }[];
}

/**
 * Update message request (mark read, star, delete)
 */
export interface UpdateMessageRequest {
  isRead?: boolean;
  isStarred?: boolean;
  isDeleted?: boolean;
  claimAttachmentIndex?: number;
}

/**
 * Bulk update messages request
 */
export interface BulkUpdateMessagesRequest {
  messageIds: string[];
  action: 'markRead' | 'markUnread' | 'star' | 'unstar' | 'delete' | 'restore';
}

/**
 * Message list response
 */
export interface MessageListResponse {
  messages: MessageListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Paginated response for messages
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  unreadCount?: number;
}

/**
 * Unread count response
 */
export interface UnreadCountResponse {
  count: number;
}

// ============================================================
// USER SEARCH TYPES
// ============================================================

/**
 * User search result for recipient autocomplete
 */
export interface UserSearchResult {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
}

/**
 * User search response
 */
export interface UserSearchResponse {
  users: UserSearchResult[];
}

// ============================================================
// FOLDER TYPES
// ============================================================

/**
 * Message folder type
 */
export type MessageFolder = 'inbox' | 'sent' | 'starred' | 'trash';

/**
 * Folder counts
 */
export interface FolderCounts {
  inbox: number;
  inboxUnread: number;
  sent: number;
  starred: number;
  trash: number;
}
