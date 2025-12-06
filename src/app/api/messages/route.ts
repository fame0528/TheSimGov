/**
 * @fileoverview Messages API Route - List and Create
 * @module app/api/messages/route
 * 
 * OVERVIEW:
 * Handles GET (list/filter messages) and POST (create new message).
 * Supports inbox, sent, starred, and trash folders with pagination.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { Filter } from 'bad-words';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Message from '@/lib/db/models/social/Message';
import UserModel from '@/lib/db/models/User';
import { sanitizeMessageContent, stripHtml } from '@/lib/utils/sanitizeHtml';
import type {
  MessageDTO,
  MessageFolder,
  PaginatedResponse,
  CreateMessageRequest,
  AttachmentDTO,
} from '@/lib/types/messages';

// ============================================================
// HELPERS
// ============================================================

const profanityFilter = new Filter();

/**
 * Sanitize and filter message content
 */
function sanitizeContent(html: string): { sanitized: string; plainText: string } {
  // Use our custom server-safe sanitizer
  const { sanitized, plainText } = sanitizeMessageContent(html);
  
  // Apply profanity filter to plain text (for display purposes)
  const filteredPlainText = profanityFilter.clean(plainText);
  
  return { sanitized, plainText: filteredPlainText };
}

/**
 * Convert message document to DTO
 */
function toDTO(msg: any, currentUserId: string): MessageDTO {
  const isRecipient = msg.recipientId.toString() === currentUserId;
  
  // Map attachments to DTO format
  const attachments: AttachmentDTO[] = (msg.attachments || []).map((a: any) => ({
    type: a.type,
    amount: a.amount,
    claimed: a.claimed,
    claimedAt: a.claimedAt?.toISOString?.() || a.claimedAt,
  }));
  
  return {
    id: msg._id.toString(),
    threadId: msg.threadId.toString(),
    senderId: msg.senderId.toString(),
    senderUsername: msg.senderUsername,
    recipientId: msg.recipientId.toString(),
    recipientUsername: msg.recipientUsername,
    subject: msg.subject,
    body: msg.body,
    bodyPreview: msg.bodyPlainText.slice(0, 150) + (msg.bodyPlainText.length > 150 ? '...' : ''),
    attachments,
    isRead: msg.isRead,
    isStarred: msg.isStarred,
    readAt: msg.readAt?.toISOString(),
    createdAt: msg.createdAt.toISOString(),
    updatedAt: msg.updatedAt.toISOString(),
    // Folder is derived based on user perspective
    folder: isRecipient
      ? (msg.isDeletedByRecipient ? 'trash' : (msg.isStarred ? 'starred' : 'inbox'))
      : (msg.isDeletedBySender ? 'trash' : (msg.isStarred ? 'starred' : 'sent')),
  };
}

// ============================================================
// GET HANDLER - List messages
// ============================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const folder = (searchParams.get('folder') || 'inbox') as MessageFolder;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || '';
    const threadId = searchParams.get('threadId');

    const userId = new Types.ObjectId(session.user.id);
    const skip = (page - 1) * limit;

    // Build query based on folder
    let query: any = {};

    if (threadId) {
      // Thread view - get all messages in thread
      query = {
        threadId: new Types.ObjectId(threadId),
        $or: [
          { recipientId: userId, isDeletedByRecipient: false },
          { senderId: userId, isDeletedBySender: false },
        ],
      };
    } else {
      switch (folder) {
        case 'inbox':
          query = { recipientId: userId, isDeletedByRecipient: false };
          break;
        case 'sent':
          query = { senderId: userId, isDeletedBySender: false };
          break;
        case 'starred':
          query = {
            $or: [
              { recipientId: userId, isStarred: true, isDeletedByRecipient: false },
              { senderId: userId, isStarred: true, isDeletedBySender: false },
            ],
          };
          break;
        case 'trash':
          query = {
            $or: [
              { recipientId: userId, isDeletedByRecipient: true },
              { senderId: userId, isDeletedBySender: true },
            ],
          };
          break;
        default:
          query = { recipientId: userId, isDeletedByRecipient: false };
      }
    }

    // Add text search if provided
    if (search) {
      query.$text = { $search: search };
    }

    // Execute queries
    const [messages, total, unreadCount] = await Promise.all([
      Message.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments(query),
      Message.countDocuments({
        recipientId: userId,
        isRead: false,
        isDeletedByRecipient: false,
      }),
    ]);

    const response: PaginatedResponse<MessageDTO> = {
      data: messages.map(m => toDTO(m, session.user!.id!)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
      unreadCount,
    };

    return NextResponse.json({ success: true, ...response });
  } catch (error) {
    console.error('[API] Messages GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST HANDLER - Create new message
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body: CreateMessageRequest = await request.json();
    const { recipientUsername, subject, content, parentMessageId, attachments } = body;

    // Validation
    if (!recipientUsername?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Recipient username is required' },
        { status: 400 }
      );
    }

    if (!subject?.trim() || subject.length > 150) {
      return NextResponse.json(
        { success: false, error: 'Subject is required and must be under 150 characters' },
        { status: 400 }
      );
    }

    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Fetch sender
    const sender = await UserModel.findById(session.user.id).lean();
    if (!sender) {
      return NextResponse.json(
        { success: false, error: 'Sender not found' },
        { status: 404 }
      );
    }

    // Fetch recipient
    const recipient = await UserModel.findOne({ 
      username: { $regex: new RegExp(`^${recipientUsername}$`, 'i') }
    }).lean();

    if (!recipient) {
      return NextResponse.json(
        { success: false, error: `User "${recipientUsername}" not found` },
        { status: 404 }
      );
    }

    // Cannot message yourself
    if (recipient._id.toString() === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot send a message to yourself' },
        { status: 400 }
      );
    }

    // Sanitize content
    const { sanitized, plainText } = sanitizeContent(content);

    if (plainText.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    // Determine thread ID
    let threadId: Types.ObjectId;
    
    if (parentMessageId) {
      // Reply - use parent's thread
      const parentMessage = await Message.findById(parentMessageId).lean();
      if (!parentMessage) {
        return NextResponse.json(
          { success: false, error: 'Parent message not found' },
          { status: 404 }
        );
      }
      threadId = new Types.ObjectId(parentMessage.threadId.toString());
    } else {
      // New thread
      threadId = new Types.ObjectId();
    }

    // Validate attachments
    const validAttachments = (attachments || []).filter((a: { type: string; amount: number }) => 
      a.type === 'currency' && 
      typeof a.amount === 'number' && 
      a.amount > 0
    );

    // Check sender has enough cash for currency attachments
    const totalAttachmentValue = validAttachments.reduce((sum: number, a: { amount: number }) => sum + a.amount, 0);
    if (totalAttachmentValue > 0 && (sender.cash || 0) < totalAttachmentValue) {
      return NextResponse.json(
        { success: false, error: 'Insufficient funds for attachments' },
        { status: 400 }
      );
    }

    // Deduct cash from sender if attachments
    if (totalAttachmentValue > 0) {
      await UserModel.updateOne(
        { _id: sender._id },
        { $inc: { cash: -totalAttachmentValue } }
      );
    }

    // Create message
    const message = await Message.create({
      senderId: new Types.ObjectId(session.user.id),
      senderUsername: sender.username,
      recipientId: recipient._id,
      recipientUsername: recipient.username,
      subject: subject.trim(),
      body: sanitized,
      bodyPlainText: plainText,
      threadId,
      parentMessageId: parentMessageId ? new Types.ObjectId(parentMessageId) : undefined,
      attachments: validAttachments.map((a: { type: string; amount: number }) => ({
        type: a.type,
        amount: a.amount,
        claimed: false,
      })),
      isRead: false,
      isStarred: false,
      isDeletedBySender: false,
      isDeletedByRecipient: false,
    });

    return NextResponse.json({
      success: true,
      message: toDTO(message.toObject(), session.user.id),
    }, { status: 201 });

  } catch (error) {
    console.error('[API] Messages POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
