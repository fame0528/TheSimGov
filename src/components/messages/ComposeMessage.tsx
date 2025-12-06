/**
 * @fileoverview Compose Message Component
 * @module components/messages/ComposeMessage
 * 
 * OVERVIEW:
 * Modal dialog for composing and sending new messages.
 * Supports recipient search, WYSIWYG editor, and currency attachments.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  X,
  Send,
  Gift,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreateMessageRequest, AttachmentDTO } from '@/lib/types/messages';
import { MessageEditor } from './MessageEditor';

// ============================================================
// TYPES
// ============================================================

interface ComposeMessageProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Send handler */
  onSend: (request: CreateMessageRequest) => Promise<void>;
  /** Pre-filled recipient username (for replies from profile) */
  initialRecipient?: string;
  /** Pre-filled subject (for replies) */
  initialSubject?: string;
  /** Parent message ID (for thread replies) */
  parentMessageId?: string;
  /** User's available cash balance */
  userCash?: number;
  /** CSS class */
  className?: string;
}

// ============================================================
// COMPOSE MESSAGE
// ============================================================

export function ComposeMessage({
  isOpen,
  onClose,
  onSend,
  initialRecipient = '',
  initialSubject = '',
  parentMessageId,
  userCash = 0,
  className,
}: ComposeMessageProps) {
  const [recipient, setRecipient] = useState(initialRecipient);
  const [subject, setSubject] = useState(initialSubject);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Omit<AttachmentDTO, 'claimed' | 'claimedAt'>[]>([]);
  const [attachmentAmount, setAttachmentAmount] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setRecipient(initialRecipient);
      setSubject(initialSubject);
      setContent('');
      setAttachments([]);
      setError(null);
    }
  }, [isOpen, initialRecipient, initialSubject]);

  // Calculate total attachment value
  const totalAttachmentValue = attachments.reduce((sum, a) => sum + a.amount, 0);
  const remainingCash = userCash - totalAttachmentValue;

  // Add attachment
  const handleAddAttachment = useCallback(() => {
    const amount = parseFloat(attachmentAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amount > remainingCash) {
      setError('Insufficient funds');
      return;
    }

    setAttachments(prev => [...prev, { type: 'currency', amount }]);
    setAttachmentAmount('');
    setShowAttachmentInput(false);
    setError(null);
  }, [attachmentAmount, remainingCash]);

  // Remove attachment
  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Send message
  const handleSend = async () => {
    // Validation
    if (!recipient.trim()) {
      setError('Please enter a recipient');
      return;
    }
    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }
    if (!content.trim() || content === '<p></p>') {
      setError('Please enter a message');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await onSend({
        recipientUsername: recipient.trim(),
        subject: subject.trim(),
        content,
        parentMessageId,
        attachments: attachments.map(a => ({
          type: a.type,
          amount: a.amount,
        })),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-2xl max-h-[90vh] overflow-hidden',
          'bg-slate-900 border border-white/10 rounded-xl shadow-2xl flex flex-col',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
          <h2 className="text-lg font-semibold text-white">
            {parentMessageId ? 'Reply to Message' : 'New Message'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              To
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Enter username..."
                disabled={sending}
                className={cn(
                  'w-full pl-9 pr-3 py-2 border border-white/10 rounded-lg bg-black/20 text-white placeholder:text-slate-500',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50',
                  'disabled:opacity-50'
                )}
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject..."
              maxLength={150}
              disabled={sending}
              className={cn(
                'w-full px-3 py-2 border border-white/10 rounded-lg bg-black/20 text-white placeholder:text-slate-500',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50',
                'disabled:opacity-50'
              )}
            />
            <p className="text-xs text-slate-500 text-right mt-1">
              {subject.length}/150
            </p>
          </div>

          {/* Message editor */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Message
            </label>
            <MessageEditor
              content={content}
              onChange={setContent}
              placeholder="Write your message..."
              minHeight={200}
              disabled={sending}
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Attachments
            </label>
            
            {/* Existing attachments */}
            {attachments.length > 0 && (
              <div className="space-y-2 mb-3">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                  >
                    <Gift className="w-5 h-5 text-green-500" />
                    <span className="flex-1 font-medium text-white">
                      ${attachment.amount.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      disabled={sending}
                      className="p-1 rounded text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <p className="text-sm text-slate-400">
                  Total: ${totalAttachmentValue.toLocaleString()} | 
                  Remaining: ${remainingCash.toLocaleString()}
                </p>
              </div>
            )}

            {/* Add attachment input */}
            {showAttachmentInput ? (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    value={attachmentAmount}
                    onChange={(e) => setAttachmentAmount(e.target.value)}
                    placeholder="Amount..."
                    min={1}
                    max={remainingCash}
                    className={cn(
                      'w-full pl-7 pr-3 py-2 border border-white/10 rounded-lg bg-black/20 text-white',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500/30'
                    )}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAttachment}
                  className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachmentInput(false);
                    setAttachmentAmount('');
                  }}
                  className="px-3 py-2 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAttachmentInput(true)}
                disabled={remainingCash <= 0 || sending}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-white/10',
                  'text-slate-400 hover:text-white hover:border-white/30',
                  'transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <Plus className="w-4 h-4" />
                Send Currency (Available: ${remainingCash.toLocaleString()})
              </button>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-white/10 bg-black/20">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !recipient.trim() || !subject.trim() || !content.trim()}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'bg-blue-600 text-white hover:bg-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            )}
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Message
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export type { ComposeMessageProps };
export default ComposeMessage;
