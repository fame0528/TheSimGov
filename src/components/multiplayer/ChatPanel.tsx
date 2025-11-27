/**
 * @file ChatPanel.tsx
 * @description Real-time chat panel component for multiplayer communication
 * @created 2025-11-24
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { ScrollShadow } from '@heroui/scroll-shadow';
import { Badge } from '@heroui/badge';
import { useChat } from '@/lib/hooks/useChat';
import { useSession } from '@/lib/hooks/useAuth';
import { formatTimestamp } from '@/lib/utils/formatting';

interface ChatMessage {
  id: string;
  message: string;
  playerId: string;
  playerName: string;
  timestamp: string;
  roomId: string;
}

interface ChatPanelProps {
  roomId?: string;
  height?: string;
  className?: string;
}

export function ChatPanel({ roomId = 'general', height = '400px', className }: ChatPanelProps) {
  const { data: user } = useSession();
  const [message, setMessage] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(roomId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    typingUsers,
    currentRoom,
    isConnected,
    sendMessage,
    startTyping,
    stopTyping,
    joinRoom,
    leaveRoom,
  } = useChat(selectedRoom);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Join room when component mounts or room changes
  useEffect(() => {
    if (selectedRoom && user?.id) {
      joinRoom(selectedRoom);
    }

    return () => {
      leaveRoom();
    };
  }, [selectedRoom, user?.id, joinRoom, leaveRoom]);

  const handleSendMessage = () => {
    if (!message.trim() || !isConnected || !user?.id) return;

    sendMessage(message.trim(), user.id, user.name || 'Anonymous');
    setMessage('');
    stopTyping(user.id);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMessageChange = (value: string) => {
    setMessage(value);

    if (value.trim() && user?.id) {
      startTyping(user.id, user.name || 'Anonymous');
    } else if (!value.trim() && user?.id) {
      stopTyping(user.id);
    }
  };

  return (
    <Card className={`w-full ${className}`} style={{ height }}>
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Chat</h3>
          <Badge
            color={isConnected ? 'success' : 'danger'}
            variant="flat"
            size="sm"
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="primary" variant="flat" size="sm">
            {typingUsers.length} typing
          </Badge>
          <span className="text-sm text-gray-500">Room: {currentRoom}</span>
        </div>
      </CardHeader>

      <CardBody className="p-0">
        <ScrollShadow className="h-full p-4">
          <div className="space-y-3">
            {messages.map((msg: ChatMessage) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.playerId === user?.id ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    msg.playerId === user?.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1">
                    {msg.playerId === user?.id ? 'You' : msg.playerName} • {formatTimestamp(msg.timestamp)}
                  </div>
                  <div className="break-words">{msg.message}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollShadow>
      </CardBody>

      <CardFooter className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => handleMessageChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={!isConnected}
          className="flex-1"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || !isConnected}
          color="primary"
        >
          Send
        </Button>
      </CardFooter>
    </Card>
  );
}