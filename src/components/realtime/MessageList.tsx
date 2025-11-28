import React, { useEffect, useRef } from 'react';

export interface ChatMessageItem {
  id?: string;
  tempId?: string;
  room: string;
  userId: string;
  content: string;
  createdAt?: string;
}

interface MessageListProps {
  room: string;
  messages: ChatMessageItem[];
  onLoadMore?: () => void;
  onViewedEnd?: () => void; // invoked when user scrolls to bottom
}

export default function MessageList({ room, messages, onLoadMore, onViewedEnd }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const threshold = 24; // px from bottom counts as viewed
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
    if (atBottom) onViewedEnd?.();
  };

  return (
    <div ref={listRef} onScroll={handleScroll} className="flex flex-col h-full overflow-y-auto px-3 py-2 space-y-2">
      <button
        className="text-xs text-blue-500 hover:underline self-start"
        onClick={onLoadMore}
      >
        Load older messages
      </button>

      {messages.map((m) => (
        <div key={m.id || m.tempId} className="text-sm">
          <span className="font-semibold mr-2">{m.userId}</span>
          <span>{m.content}</span>
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}