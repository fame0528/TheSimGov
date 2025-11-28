import React, { useEffect, useMemo, useState } from 'react';
import MessageList, { ChatMessageItem } from './MessageList';
import MessageInput from './MessageInput';
import { useSocket } from '@/lib/hooks/useSocket';

interface ChatPanelProps {
  room: string; // e.g., 'global', 'politics', 'company:123', 'dm:a_b'
  userId: string;
}

export default function ChatPanel({ room, userId }: ChatPanelProps) {
  const { socket, isConnected, emit, on, off } = useSocket({ namespace: '/chat' });
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [unread, setUnread] = useState<number>(0);
  const [unreadSummary, setUnreadSummary] = useState<Array<{ room: string; unread: number }>>([]);

  // Join room on connect
  useEffect(() => {
    if (!isConnected) return;
    emit('chat:join', room);
    emit('chat:history:request', { room, cursor: null, limit: 25 });
  }, [isConnected, room]);

  // Event handlers
  useEffect(() => {
    const handleAck = (m: ChatMessageItem) => {
      setMessages((prev) => [...prev, m]);
    };
    const handleMessage = (m: ChatMessageItem) => {
      setMessages((prev) => {
        // Replace optimistic if tempId matches
        if (m.id && m.tempId) {
          const idx = prev.findIndex((p) => p.tempId === m.tempId);
          if (idx >= 0) {
            const copy = prev.slice();
            copy[idx] = m;
            return copy;
          }
        }
        return [...prev, m];
      });
    };
    const handleHistory = ({ room: r, messages: msgs, nextCursor: cursor }: { room: string; messages: ChatMessageItem[]; nextCursor: string | null; }) => {
      if (r !== room) return;
      setMessages((prev) => [...msgs.reverse(), ...prev]);
      setNextCursor(cursor);
    };
    const handleTyping = ({ userId: uid }: { userId: string }) => {
      setTypingUsers((prev) => new Set(prev).add(uid));
    };
    const handleTypingStop = ({ userId: uid }: { userId: string }) => {
      setTypingUsers((prev) => {
        const s = new Set(prev);
        s.delete(uid);
        return s;
      });
    };
    const handleError = (err: any) => console.warn('[Chat] Error', err);
        const handleSystem = (payload: any) => {
          if (payload?.type === 'unread-summary' && Array.isArray(payload.summary)) {
            setUnreadSummary(payload.summary);
          }
        };
    const handleUnread = ({ room: r, unread }: { room: string; unread: number }) => {
      if (r === room) setUnread(unread);
    };
    const handleUnreadUpdate = ({ room: r, userId: uid, unread: count }: { room: string; userId: string; unread: number }) => {
      if (r === room && uid === userId) setUnread(count);
    };

    on('chat:ack', handleAck);
    on('chat:message', handleMessage);
    on('chat:history', handleHistory);
    on('chat:typing', handleTyping);
    on('chat:typing:stop', handleTypingStop);
    on('chat:error', handleError);
      on('chat:system', handleSystem);
    on('chat:unread', handleUnread);
    on('chat:unread:update', handleUnreadUpdate);

    return () => {
      off('chat:ack', handleAck);
      off('chat:message', handleMessage);
      off('chat:history', handleHistory);
      off('chat:typing', handleTyping);
      off('chat:typing:stop', handleTypingStop);
      off('chat:error', handleError);
        off('chat:system', handleSystem);
      off('chat:unread', handleUnread);
      off('chat:unread:update', handleUnreadUpdate);
    };
  }, [room, on, off]);

  const sendMessage = (content: string) => {
    const optimistic: ChatMessageItem = {
      tempId: `temp_${Date.now()}`,
      room,
      userId,
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    emit('chat:send', { room, content, tempId: optimistic.tempId });
  };

  const requestOlder = () => {
    emit('chat:history:request', { room, cursor: nextCursor, limit: 25 });
  };

  // Mark as read when scrolled to bottom (simple heuristic after receiving a message)
  useEffect(() => {
    if (messages.length > 0) {
      // best-effort mark read at last message timestamp
      const last = messages[messages.length - 1];
      const at = last.createdAt ? new Date(last.createdAt).getTime() : Date.now();
      emit('chat:read:mark', { room, at });
    }
  }, [messages.length]);

  const typingNote = useMemo(() => {
    const others = Array.from(typingUsers).filter((uid) => uid !== userId);
    if (others.length === 0) return null;
    return `${others.join(', ')} typing...`;
  }, [typingUsers, userId]);

  return (
    <div className="flex flex-col h-full border rounded">
      <div className="px-3 py-2 border-b text-sm font-semibold flex items-center gap-2">
        <span>Room: {room}</span>
        {unread > 0 && (
          <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs px-2 py-0.5">
            {unread} unread
          </span>
        )}
      </div>
      <MessageList
        room={room}
        messages={messages}
        onLoadMore={requestOlder}
        onViewedEnd={() => {
          const last = messages[messages.length - 1];
          const at = last?.createdAt ? new Date(last.createdAt).getTime() : Date.now();
          emit('chat:read:mark', { room, at });
        }}
      />
      {typingNote && <div className="px-3 py-1 text-xs text-gray-500">{typingNote}</div>}
      <MessageInput
        room={room}
        onSend={sendMessage}
        onTypingStart={() => emit('chat:typing:start', { room })}
        onTypingStop={() => emit('chat:typing:stop', { room })}
      />
    </div>
  );
}