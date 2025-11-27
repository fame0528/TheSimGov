/**
 * @file useChat.ts
 * @description Chat system hook for real-time messaging
 * @created 2025-11-24
 */

import { useCallback, useEffect, useState } from 'react';
import { useSocket } from './useSocket';

export interface ChatMessage {
  id: string;
  message: string;
  playerId: string;
  playerName: string;
  timestamp: string;
  roomId: string;
}

export interface TypingUser {
  playerId: string;
  playerName: string;
}

export function useChat(roomId?: string) {
  const { socket, isConnected, emit, on, off } = useSocket({ namespace: '/chat' });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(roomId || null);

  // Join room when roomId changes or connection is established
  useEffect(() => {
    if (isConnected && roomId && roomId !== currentRoom) {
      // Leave previous room if any
      if (currentRoom) {
        emit('leave-room', currentRoom);
      }

      // Join new room
      emit('join-room', roomId);
      setCurrentRoom(roomId);
      setMessages([]); // Clear messages when switching rooms
      setTypingUsers([]); // Clear typing users when switching rooms
    }
  }, [isConnected, roomId, currentRoom, emit]);

  // Set up event listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data: Omit<ChatMessage, 'id' | 'roomId'>) => {
      const newMessage: ChatMessage = {
        ...data,
        id: `${data.playerId}-${Date.now()}`,
        roomId: currentRoom || '',
      };
      setMessages(prev => [...prev, newMessage]);
    };

    const handleUserJoined = (data: { socketId: string }) => {
      console.log(`User joined room: ${data.socketId}`);
    };

    const handleUserLeft = (data: { socketId: string }) => {
      console.log(`User left room: ${data.socketId}`);
    };

    const handleUserTyping = (data: TypingUser) => {
      setTypingUsers(prev => {
        if (!prev.find(user => user.playerId === data.playerId)) {
          return [...prev, data];
        }
        return prev;
      });
    };

    const handleUserStopTyping = (data: { playerId: string }) => {
      setTypingUsers(prev => prev.filter(user => user.playerId !== data.playerId));
    };

    on('receive-message', handleReceiveMessage);
    on('user-joined', handleUserJoined);
    on('user-left', handleUserLeft);
    on('user-typing', handleUserTyping);
    on('user-stop-typing', handleUserStopTyping);

    return () => {
      off('receive-message', handleReceiveMessage);
      off('user-joined', handleUserJoined);
      off('user-left', handleUserLeft);
      off('user-typing', handleUserTyping);
      off('user-stop-typing', handleUserStopTyping);
    };
  }, [socket, currentRoom, on, off]);

  const sendMessage = useCallback((message: string, playerId: string, playerName: string) => {
    if (!currentRoom || !isConnected) return false;

    emit('send-message', {
      roomId: currentRoom,
      message,
      playerId,
      playerName,
    });

    // Stop typing when message is sent
    emit('typing-stop', { roomId: currentRoom, playerId });

    return true;
  }, [currentRoom, isConnected, emit]);

  const startTyping = useCallback((playerId: string, playerName: string) => {
    if (!currentRoom || !isConnected) return;

    emit('typing-start', {
      roomId: currentRoom,
      playerId,
      playerName,
    });
  }, [currentRoom, isConnected, emit]);

  const stopTyping = useCallback((playerId: string) => {
    if (!currentRoom || !isConnected) return;

    emit('typing-stop', {
      roomId: currentRoom,
      playerId,
    });
  }, [currentRoom, isConnected, emit]);

  const joinRoom = useCallback((newRoomId: string) => {
    if (!isConnected) return false;

    if (currentRoom) {
      emit('leave-room', currentRoom);
    }

    emit('join-room', newRoomId);
    setCurrentRoom(newRoomId);
    setMessages([]);
    setTypingUsers([]);

    return true;
  }, [isConnected, currentRoom, emit]);

  const leaveRoom = useCallback(() => {
    if (!currentRoom || !isConnected) return false;

    emit('leave-room', currentRoom);
    setCurrentRoom(null);
    setMessages([]);
    setTypingUsers([]);

    return true;
  }, [currentRoom, isConnected, emit]);

  return {
    messages,
    typingUsers,
    currentRoom,
    isConnected,
    sendMessage,
    startTyping,
    stopTyping,
    joinRoom,
    leaveRoom,
  };
}