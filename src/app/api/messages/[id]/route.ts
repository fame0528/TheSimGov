/**
 * @fileoverview Messages API Route - Single Message Operations
 * @module app/api/messages/[id]/route
 * 
 * OVERVIEW:
 * Handles GET (single message), PATCH (update read/starred/etc), 
 * and DELETE (soft delete) for individual messages.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Message from '@/lib/db/models/social/Message';
import UserModel from '@/lib/db/models/User';
import type { MessageDTO, UpdateMessageRequest, AttachmentDTO } from '@/lib/types/messages';

// ============================================================
// HELPERS
// ============================================================

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
    folder: isRecipient
      ? (msg.isDeletedByRecipient ? 'trash' : (msg.isStarred ? 'starred' : 'inbox'))
      : (msg.isDeletedBySender ? 'trash' : (msg.isStarred ? 'starred' : 'sent')),
  };
}

// ============================================================
// ROUTE PARAMS CONTEXT
// ============================================================

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ============================================================
// GET HANDLER - Get single message
// ============================================================

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid message ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = new Types.ObjectId(session.user.id);
    const messageId = new Types.ObjectId(id);

    // Find message where user is sender or recipient
    const message = await Message.findOne({
      _id: messageId,
      $or: [
        { senderId: userId },
        { recipientId: userId },
      ],
    }).lean();

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }

    // Check if user can see this message (not deleted from their perspective)
    const isRecipient = message.recipientId.toString() === session.user.id;
    const isDeleted = isRecipient ? message.isDeletedByRecipient : message.isDeletedBySender;

    if (isDeleted) {
      // Allow viewing deleted messages in trash, but mark as such
      // Could alternatively return 404 for stricter privacy
    }

    // Auto-mark as read when recipient views
    if (isRecipient && !message.isRead) {
      await Message.updateOne(
        { _id: messageId },
        { $set: { isRead: true, readAt: new Date() } }
      );
      message.isRead = true;
      message.readAt = new Date();
    }

    return NextResponse.json({
      success: true,
      message: toDTO(message, session.user.id),
    });
  } catch (error) {
    console.error('[API] Message GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch message' },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH HANDLER - Update message (read, starred, claim attachment)
// ============================================================

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid message ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const body: UpdateMessageRequest = await request.json();
    const { isRead, isStarred, claimAttachmentIndex } = body;

    const userId = new Types.ObjectId(session.user.id);
    const messageId = new Types.ObjectId(id);

    // Find message
    const message = await Message.findOne({
      _id: messageId,
      $or: [
        { senderId: userId },
        { recipientId: userId },
      ],
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }

    const isRecipient = message.recipientId.toString() === session.user.id;
    const updates: any = {};

    // Update read status (only recipient can mark as read)
    if (typeof isRead === 'boolean' && isRecipient) {
      updates.isRead = isRead;
      if (isRead && !message.readAt) {
        updates.readAt = new Date();
      }
    }

    // Update starred status (both sender and recipient can star)
    if (typeof isStarred === 'boolean') {
      updates.isStarred = isStarred;
    }

    // Claim attachment (only recipient can claim)
    if (typeof claimAttachmentIndex === 'number' && isRecipient) {
      const attachments = message.attachments || [];
      
      if (claimAttachmentIndex < 0 || claimAttachmentIndex >= attachments.length) {
        return NextResponse.json(
          { success: false, error: 'Invalid attachment index' },
          { status: 400 }
        );
      }

      const attachment = attachments[claimAttachmentIndex];
      
      if (attachment.claimed) {
        return NextResponse.json(
          { success: false, error: 'Attachment already claimed' },
          { status: 400 }
        );
      }

      // Transfer currency to recipient
      if (attachment.type === 'currency') {
        await UserModel.updateOne(
          { _id: userId },
          { $inc: { cash: attachment.amount } }
        );
      }

      // Mark attachment as claimed
      updates[`attachments.${claimAttachmentIndex}.claimed`] = true;
      updates[`attachments.${claimAttachmentIndex}.claimedAt`] = new Date();
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      await Message.updateOne({ _id: messageId }, { $set: updates });
    }

    // Fetch updated message
    const updatedMessage = await Message.findById(messageId).lean();

    return NextResponse.json({
      success: true,
      message: toDTO(updatedMessage, session.user.id),
    });
  } catch (error) {
    console.error('[API] Message PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE HANDLER - Soft delete message
// ============================================================

export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid message ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = new Types.ObjectId(session.user.id);
    const messageId = new Types.ObjectId(id);

    // Find message
    const message = await Message.findOne({
      _id: messageId,
      $or: [
        { senderId: userId },
        { recipientId: userId },
      ],
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }

    const isSender = message.senderId.toString() === session.user.id;
    const isRecipient = message.recipientId.toString() === session.user.id;

    // Check if already deleted from this user's perspective
    const alreadyDeleted = isSender 
      ? message.isDeletedBySender 
      : message.isDeletedByRecipient;

    if (alreadyDeleted) {
      // Permanent delete if already in trash
      // Check if both users have deleted
      const otherUserDeleted = isSender 
        ? message.isDeletedByRecipient 
        : message.isDeletedBySender;

      if (otherUserDeleted || isSender === isRecipient) {
        // Both have deleted or user is both sender and recipient (self-message edge case)
        await Message.deleteOne({ _id: messageId });
        return NextResponse.json({
          success: true,
          permanentlyDeleted: true,
        });
      }
    }

    // Soft delete - mark as deleted for this user
    const update = isSender
      ? { isDeletedBySender: true }
      : { isDeletedByRecipient: true };

    await Message.updateOne({ _id: messageId }, { $set: update });

    return NextResponse.json({
      success: true,
      deleted: true,
    });
  } catch (error) {
    console.error('[API] Message DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
