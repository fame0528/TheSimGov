/**
 * @fileoverview Message List Component
 * @module components/messages/MessageList
 * 
 * OVERVIEW:
 * Displays a list of messages with folder tabs (inbox, sent, starred, trash).
 * Supports selection, bulk actions, and search.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import React, { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Inbox,
  Send,
  Star,
  Trash2,
  Search,
  Mail,
  MailOpen,
  Paperclip,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageDTO, MessageFolder } from '@/lib/types/messages';

// ============================================================
// TYPES
// ============================================================

interface MessageListProps {
  /** Messages to display */
  messages: MessageDTO[];
  /** Current folder */
  folder: MessageFolder;
  /** Folder change handler */
  onFolderChange: (folder: MessageFolder) => void;
  /** Message click handler */
  onMessageClick: (message: MessageDTO) => void;
  /** Star toggle handler */
  onToggleStar: (id: string, starred: boolean) => void;
  /** Delete handler */
  onDelete: (id: string) => void;
  /** Search handler */
  onSearch?: (query: string) => void;
  /** Refresh handler */
  onRefresh?: () => void;
  /** Pagination */
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  /** Unread count for badge */
  unreadCount?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** CSS class */
  className?: string;
}

interface FolderTabProps {
  folder: MessageFolder;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}

interface MessageRowProps {
  message: MessageDTO;
  onClick: () => void;
  onToggleStar: () => void;
  onDelete: () => void;
  showRecipient?: boolean;
}

// ============================================================
// FOLDER TAB
// ============================================================

function FolderTab({ folder, icon, label, active, count, onClick }: FolderTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors w-full',
        active
          ? 'bg-blue-600 text-white'
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      )}
    >
      {icon}
      <span>{label}</span>
      {typeof count === 'number' && count > 0 && (
        <span
          className={cn(
            'ml-auto px-1.5 py-0.5 text-xs rounded-full',
            active
              ? 'bg-white/20 text-white'
              : 'bg-blue-500/20 text-blue-400'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ============================================================
// MESSAGE ROW
// ============================================================

function MessageRow({ message, onClick, onToggleStar, onDelete, showRecipient }: MessageRowProps) {
  const [showActions, setShowActions] = useState(false);

  const timeAgo = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  }, [message.createdAt]);

  const hasAttachments = message.attachments && message.attachments.length > 0;
  const displayName = showRecipient ? message.recipientUsername : message.senderUsername;

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-4 py-3 border-b border-white/5 cursor-pointer transition-colors',
        'hover:bg-white/5',
        !message.isRead && 'bg-blue-500/10'
      )}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Read indicator */}
      <div className="flex-shrink-0 w-2">
        {!message.isRead && (
          <div className="w-2 h-2 rounded-full bg-blue-500" />
        )}
      </div>

      {/* Star button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar();
        }}
        className={cn(
          'flex-shrink-0 p-1 rounded transition-colors',
          message.isStarred
            ? 'text-yellow-500 hover:text-yellow-600'
            : 'text-slate-500 hover:text-yellow-500'
        )}
      >
        <Star className={cn('w-4 h-4', message.isStarred && 'fill-current')} />
      </button>

      {/* Sender/Recipient */}
      <div className="flex-shrink-0 w-32 truncate">
        <span className={cn('text-sm text-slate-300', !message.isRead && 'font-semibold text-white')}>
          {displayName}
        </span>
      </div>

      {/* Subject and preview */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm truncate text-slate-300', !message.isRead && 'font-semibold text-white')}>
            {message.subject}
          </span>
          {hasAttachments && (
            <Paperclip className="flex-shrink-0 w-3.5 h-3.5 text-blue-400" />
          )}
        </div>
        <p className="text-xs text-slate-500 truncate">
          {message.bodyPreview}
        </p>
      </div>

      {/* Timestamp and actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {showActions ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {timeAgo}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MESSAGE LIST
// ============================================================

export function MessageList({
  messages,
  folder,
  onFolderChange,
  onMessageClick,
  onToggleStar,
  onDelete,
  onSearch,
  onRefresh,
  page = 1,
  totalPages = 1,
  onPageChange,
  unreadCount = 0,
  isLoading = false,
  emptyMessage,
  className,
}: MessageListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const folders: { folder: MessageFolder; icon: React.ReactNode; label: string }[] = [
    { folder: 'inbox', icon: <Inbox className="w-4 h-4" />, label: 'Inbox' },
    { folder: 'sent', icon: <Send className="w-4 h-4" />, label: 'Sent' },
    { folder: 'starred', icon: <Star className="w-4 h-4" />, label: 'Starred' },
    { folder: 'trash', icon: <Trash2 className="w-4 h-4" />, label: 'Trash' },
  ];

  const defaultEmptyMessage = useMemo(() => {
    switch (folder) {
      case 'inbox': return 'Your inbox is empty';
      case 'sent': return 'No sent messages';
      case 'starred': return 'No starred messages';
      case 'trash': return 'Trash is empty';
      default: return 'No messages';
    }
  }, [folder]);

  return (
    <div className={cn('flex h-full', className)}>
      {/* Sidebar */}
      <div className="w-48 flex-shrink-0 border-r border-white/5 p-3 space-y-1 bg-black/20">
        {folders.map((f) => (
          <FolderTab
            key={f.folder}
            folder={f.folder}
            icon={f.icon}
            label={f.label}
            active={folder === f.folder}
            count={f.folder === 'inbox' ? unreadCount : undefined}
            onClick={() => onFolderChange(f.folder)}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 bg-black/10">
          {/* Search */}
          {onSearch && (
            <form onSubmit={handleSearch} className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-white/10 rounded-md bg-black/20 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
                />
              </div>
            </form>
          )}

          {/* Refresh */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
          )}

          {/* Pagination */}
          {totalPages > 1 && onPageChange && (
            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isLoading}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 px-2">
                {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <MailOpen className="w-12 h-12 mb-3 opacity-50" />
              <p>{emptyMessage || defaultEmptyMessage}</p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageRow
                key={message.id}
                message={message}
                onClick={() => onMessageClick(message)}
                onToggleStar={() => onToggleStar(message.id, !message.isStarred)}
                onDelete={() => onDelete(message.id)}
                showRecipient={folder === 'sent'}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export type { MessageListProps };
export default MessageList;
