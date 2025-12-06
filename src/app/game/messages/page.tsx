/**
 * @fileoverview Messages Page
 * @module app/game/messages/page
 * 
 * OVERVIEW:
 * Main messages interface with inbox, sent, starred, and trash folders.
 * Integrates MessageList, MessageThread, and ComposeMessage components.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Spinner } from '@heroui/react';
import { PenSquare, Mail } from 'lucide-react';
import { useMessages, useUnreadCount } from '@/hooks/useMessages';
import { usePlayer } from '@/hooks/usePlayer';
import {
  MessageList,
  MessageThread,
  ComposeMessage,
} from '@/components/messages';
import type { MessageDTO, MessageFolder, CreateMessageRequest } from '@/lib/types/messages';

// ============================================================
// PAGE COMPONENT
// ============================================================

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { profile } = usePlayer();
  
  // State
  const [folder, setFolder] = useState<MessageFolder>('inbox');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<MessageDTO | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  // Data fetching
  const {
    messages,
    total,
    totalPages,
    hasMore,
    isLoading,
    isValidating,
    error,
    refresh,
    sendMessage,
    updateMessage,
    deleteMessage,
    toggleStar,
    claimAttachment,
  } = useMessages({
    folder,
    page,
    search: searchQuery || undefined,
    threadId: selectedMessage?.threadId,
  });

  const { unreadCount } = useUnreadCount();

  // Thread messages - when a message is selected, fetch entire thread
  const {
    messages: threadMessages,
    isLoading: threadLoading,
    refresh: refreshThread,
    sendMessage: sendThreadReply,
  } = useMessages({
    threadId: selectedMessage?.threadId,
    enabled: !!selectedMessage,
  });

  // Handlers
  const handleFolderChange = useCallback((newFolder: MessageFolder) => {
    setFolder(newFolder);
    setPage(1);
    setSelectedMessage(null);
    setSearchQuery('');
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  const handleMessageClick = useCallback((message: MessageDTO) => {
    setSelectedMessage(message);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedMessage(null);
    refresh();
  }, [refresh]);

  const handleSendMessage = useCallback(async (request: CreateMessageRequest) => {
    await sendMessage(request);
    setShowCompose(false);
  }, [sendMessage]);

  const handleReply = useCallback(async (content: string) => {
    if (!selectedMessage) return;
    
    setIsReplying(true);
    try {
      await sendThreadReply({
        recipientUsername: selectedMessage.senderId === session?.user?.id
          ? selectedMessage.recipientUsername
          : selectedMessage.senderUsername,
        subject: selectedMessage.subject.startsWith('Re: ')
          ? selectedMessage.subject
          : `Re: ${selectedMessage.subject}`,
        content,
        parentMessageId: selectedMessage.id,
      });
      await refreshThread();
    } finally {
      setIsReplying(false);
    }
  }, [selectedMessage, session?.user?.id, sendThreadReply, refreshThread]);

  const handleToggleStar = useCallback(async (id: string, starred: boolean) => {
    await toggleStar(id, starred);
  }, [toggleStar]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteMessage(id);
    if (selectedMessage?.id === id) {
      setSelectedMessage(null);
    }
  }, [deleteMessage, selectedMessage?.id]);

  const handleClaimAttachment = useCallback(async (messageId: string, attachmentIndex: number) => {
    await claimAttachment(messageId, attachmentIndex);
    await refreshThread();
  }, [claimAttachment, refreshThread]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Spinner size="lg" label="Loading messages..." />
      </div>
    );
  }

  // Auth check
  if (!session?.user?.id) {
    router.push('/login');
    return null;
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Mail className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                  Messages
                </h1>
                <p className="text-slate-400 mt-1 text-sm">
                  Communicate with other players
                  {unreadCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                color="primary"
                onPress={() => setShowCompose(true)}
                startContent={<PenSquare className="w-4 h-4" />}
              >
                Compose
              </Button>
              <Button
                size="sm"
                variant="light"
                onPress={() => router.push('/game')}
                className="text-slate-400 hover:text-white"
              >
                ← Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="max-w-[1600px] mx-auto px-8 mt-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error.message}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
          {selectedMessage ? (
            // Thread view
            <MessageThread
              messages={threadMessages}
              currentUserId={session.user.id}
              onBack={handleBack}
              onReply={handleReply}
              onToggleStar={handleToggleStar}
              onDelete={handleDelete}
              onClaimAttachment={handleClaimAttachment}
              isLoading={threadLoading}
              isReplying={isReplying}
            />
          ) : (
            // List view
            <MessageList
              messages={messages}
              folder={folder}
              onFolderChange={handleFolderChange}
              onMessageClick={handleMessageClick}
              onToggleStar={handleToggleStar}
              onDelete={handleDelete}
              onSearch={handleSearch}
              onRefresh={refresh}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              unreadCount={unreadCount}
              isLoading={isLoading || isValidating}
            />
          )}
        </div>
      </div>

      {/* Compose modal */}
      <ComposeMessage
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        onSend={handleSendMessage}
        userCash={profile?.business.liquidCapital || 0}
      />
    </div>
  );
}
