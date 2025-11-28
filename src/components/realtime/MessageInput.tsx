import React, { useEffect, useRef, useState } from 'react';

interface MessageInputProps {
  room: string;
  onSend: (content: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  maxLength?: number;
}

export default function MessageInput({ room, onSend, onTypingStart, onTypingStop, maxLength = 500 }: MessageInputProps) {
  const [value, setValue] = useState('');
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (typingTimer.current) clearTimeout(typingTimer.current); };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v.length > maxLength) return;
    setValue(v);
    onTypingStart?.();
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onTypingStop?.(), 800);
  };

  const handleSend = () => {
    const content = value.trim();
    if (!content) return;
    onSend(content);
    setValue('');
    onTypingStop?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={`Message ${room}`}
        className="flex-1 rounded border px-3 py-2 text-sm"
      />
      <button onClick={handleSend} className="px-3 py-2 text-sm bg-blue-600 text-white rounded">
        Send
      </button>
    </div>
  );
}