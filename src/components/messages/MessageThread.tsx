/**
 * @fileoverview Message Thread Component
 * @module components/messages/MessageThread
 * 
 * OVERVIEW:
 * Displays a full message thread/conversation view.
 * Shows all messages in chronological order with inline reply.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Star,
  Trash2,
  Reply,
  Gift,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageDTO, AttachmentDTO } from '@/lib/types/messages';
import { MessageEditor } from './MessageEditor';

// ============================================================
// TYPES
// ============================================================

interface MessageThreadProps {
  /** Messages in the thread (chronological order) */
  messages: MessageDTO[];
  /** Current user's ID */
  currentUserId: string;
  /** Back button handler */
  onBack: () => void;
  /** Reply handler */
  onReply: (content: string) => Promise<void>;
  /** Star toggle handler */
  onToggleStar: (id: string, starred: boolean) => void;
  /** Delete handler */
  onDelete: (id: string) => void;
  /** Claim attachment handler */
  onClaimAttachment: (messageId: string, attachmentIndex: number) => Promise<void>;
  /** Loading state */
  isLoading?: boolean;
  /** Reply loading state */
  isReplying?: boolean;
  /** CSS class */
  className?: string;
}

interface MessageBubbleProps {
  message: MessageDTO;
  isSender: boolean;
  onToggleStar: () => void;
  onDelete: () => void;
  onClaimAttachment: (index: number) => Promise<void>;
}

interface AttachmentCardProps {
  attachment: AttachmentDTO;
  index: number;
  canClaim: boolean;
  onClaim: () => Promise<void>;
}

// ============================================================
// ATTACHMENT CARD
// ============================================================

function AttachmentCard({ attachment, index, canClaim, onClaim }: AttachmentCardProps) {
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!canClaim || attachment.claimed || claiming) return;
    
    setClaiming(true);
    setError(null);
    
    try {
      await onClaim();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim');
    } finally {
      setClaiming(false);
    }
  };

  if (attachment.type !== 'currency') return null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        attachment.claimed
          ? 'bg-muted/50 border-muted'
          : 'bg-green-500/10 border-green-500/30'
      )}
    >
      <div className={cn(
        'p-2 rounded-full',
        attachment.claimed ? 'bg-muted' : 'bg-green-500/20'
      )}>
        <Gift className={cn(
          'w-5 h-5',
          attachment.claimed ? 'text-muted-foreground' : 'text-green-500'
        )} />
      </div>
      
      <div className="flex-1">
        <p className={cn(
          'font-medium',
          attachment.claimed && 'text-muted-foreground'
        )}>
          ${attachment.amount.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">
          {attachment.claimed
            ? `Claimed ${attachment.claimedAt ? format(new Date(attachment.claimedAt), 'MMM d, yyyy') : ''}`
            : 'Currency gift attached'}
        </p>
      </div>

      {canClaim && !attachment.claimed && (
        <button
          type="button"
          onClick={handleClaim}
          disabled={claiming}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            'bg-green-500 text-white hover:bg-green-600',
            claiming && 'opacity-50 cursor-not-allowed'
          )}
        >
          {claiming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Claim'
          )}
        </button>
      )}

      {attachment.claimed && (
        <Check className="w-5 h-5 text-muted-foreground" />
      )}

      {error && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MESSAGE BUBBLE
// ============================================================

function MessageBubble({
  message,
  isSender,
  onToggleStar,
  onDelete,
  onClaimAttachment,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  const formattedDate = format(new Date(message.createdAt), 'MMM d, yyyy \'at\' h:mm a');

  return (
    <div
      className={cn(
        'group relative max-w-[80%] mb-4',
        isSender ? 'ml-auto' : 'mr-auto'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center gap-2 mb-1 text-xs text-muted-foreground',
        isSender && 'flex-row-reverse'
      )}>
        <span className="font-medium text-foreground">
          {isSender ? 'You' : message.senderUsername}
        </span>
        <span>{formattedDate}</span>
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          'relative p-4 rounded-2xl',
          isSender
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted rounded-tl-sm'
        )}
      >
        {/* Body - render as HTML */}
        <div
          className={cn(
            'prose prose-sm max-w-none',
            isSender ? 'prose-invert' : 'dark:prose-invert'
          )}
          dangerouslySetInnerHTML={{ __html: message.body }}
        />

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.attachments.map((attachment, index) => (
              <AttachmentCard
                key={index}
                attachment={attachment}
                index={index}
                canClaim={!isSender}
                onClaim={() => onClaimAttachment(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div
          className={cn(
            'absolute top-0 flex items-center gap-1 p-1 rounded-md bg-background border shadow-sm',
            isSender ? 'left-0 -translate-x-full -ml-2' : 'right-0 translate-x-full ml-2'
          )}
        >
          <button
            type="button"
            onClick={onToggleStar}
            className={cn(
              'p-1 rounded transition-colors',
              message.isStarred
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-muted-foreground hover:text-yellow-500'
            )}
            title={message.isStarred ? 'Unstar' : 'Star'}
          >
            <Star className={cn('w-4 h-4', message.isStarred && 'fill-current')} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MESSAGE THREAD
// ============================================================

export function MessageThread({
  messages,
  currentUserId,
  onBack,
  onReply,
  onToggleStar,
  onDelete,
  onClaimAttachment,
  isLoading = false,
  isReplying = false,
  className,
}: MessageThreadProps) {
  const [replyContent, setReplyContent] = useState('');
  const [showReply, setShowReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendReply = async () => {
    if (!replyContent.trim() || isReplying) return;
    
    await onReply(replyContent);
    setReplyContent('');
    setShowReply(false);
  };

  // Get the first message for subject display
  const firstMessage = messages[0];
  const subject = firstMessage?.subject || 'Message';

  // Determine other participant
  const otherParticipant = messages.find(m => m.senderId !== currentUserId);
  const participantName = otherParticipant?.senderUsername || 
    messages.find(m => m.recipientId !== currentUserId)?.recipientUsername ||
    'Unknown';

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
        <button
          type="button"
          onClick={onBack}
          className="p-1 rounded-md hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{subject}</h2>
          <p className="text-sm text-muted-foreground">
            Conversation with {participantName}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages in this thread
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isSender={message.senderId === currentUserId}
                onToggleStar={() => onToggleStar(message.id, !message.isStarred)}
                onDelete={() => onDelete(message.id)}
                onClaimAttachment={(index) => onClaimAttachment(message.id, index)}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply section */}
      <div className="border-t p-4">
        {showReply ? (
          <div className="space-y-3">
            <MessageEditor
              content={replyContent}
              onChange={setReplyContent}
              placeholder="Write your reply..."
              minHeight={120}
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowReply(false);
                  setReplyContent('');
                }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendReply}
                disabled={!replyContent.trim() || isReplying}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium',
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                  'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                )}
              >
                {isReplying && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Reply
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowReply(true)}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-lg border-2 border-dashed text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors"
          >
            <Reply className="w-4 h-4" />
            Write a reply...
          </button>
        )}
      </div>
    </div>
  );
}

export type { MessageThreadProps };
export default MessageThread;
