/**
 * @fileoverview Messages Unread Count API Route
 * @module app/api/messages/unread/route
 * 
 * OVERVIEW:
 * Quick endpoint to fetch unread message count for notification badges.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Message from '@/lib/db/models/social/Message';

// ============================================================
// GET HANDLER - Get unread count
// ============================================================

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const userId = new Types.ObjectId(session.user.id);

    const unreadCount = await Message.countDocuments({
      recipientId: userId,
      isRead: false,
      isDeletedByRecipient: false,
    });

    return NextResponse.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error('[API] Messages unread count error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
