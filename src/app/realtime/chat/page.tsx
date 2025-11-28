"use client";
import React from 'react';
import { ChatPanel } from '@/components/realtime';

export default function ChatDemoPage() {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('simUserId') || 'player-demo') : 'player-demo';
  const room = 'global';
  return (
    <div className="p-4 h-screen">
      <h1 className="text-lg font-semibold mb-3">Realtime Chat Demo</h1>
      <div className="h-[70vh]">
        <ChatPanel room={room} userId={userId} />
      </div>
      <p className="text-xs text-gray-500 mt-2">Tip: open two windows with different localStorage `simUserId` to simulate DMs.</p>
    </div>
  );
}