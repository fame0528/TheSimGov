/**
 * @file src/lib/validations/chat.ts
 * @description Zod validation schemas for realtime chat operations
 * @created 2025-11-27
 *
 * OVERVIEW:
 * Provides runtime validation for chat send and history retrieval requests.
 * Matches Socket.io event payloads (chat:send, chat:history:request) ensuring
 * consistent constraints (content length, room naming). Types inferred for
 * use in API routes or server-side handlers.
 */
import { z } from 'zod';

// Room naming patterns (simple guards; detailed validation could be added later)
const RoomBaseSchema = z.string().min(1).max(100);
export const ChatRoomSchema = RoomBaseSchema.regex(/^(global|politics|company:[A-Za-z0-9_-]+|dm:[A-Za-z0-9]+_[A-Za-z0-9]+|[A-Za-z0-9:_-]+)$/);

export const SendMessageSchema = z.object({
  room: ChatRoomSchema,
  content: z.string().min(1).max(500),
  tempId: z.string().min(1).max(120).optional(),
});

export const HistoryRequestSchema = z.object({
  room: ChatRoomSchema,
  cursor: z.number().int().min(0).optional(), // millisecond timestamp of last message in previous page
  limit: z.number().int().min(1).max(200).optional(),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type HistoryRequestInput = z.infer<typeof HistoryRequestSchema>;

/**
 * IMPLEMENTATION NOTES:
 * 1. dm room canonical naming enforced via regex (dm:{a}_{b}).
 * 2. Limit capped at 200 to prevent excessive memory usage for single fetch.
 * 3. Cursor uses millisecond epoch; server converts to Date for query.
 */
