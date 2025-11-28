import React, { useEffect, useMemo, useState } from 'react';
import { useSocket } from '@/lib/hooks/useSocket';

export interface DmTarget {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  unread?: number;
}

interface DmSelectorProps {
  currentUserId: string;
  users: DmTarget[]; // provided by parent (no fetching here)
  onOpenRoom: (roomId: string) => void; // e.g., 'dm:a_b'
}

// Canonical DM room id: dm:{uidSmall_uidLarge}
function canonicalDmRoom(a: string, b: string): string {
  const [x, y] = [a, b].sort();
  return `dm:${x}_${y}`;
}

export default function DmSelector({ currentUserId, users, onOpenRoom }: DmSelectorProps) {
  const { emit, on, off } = useSocket({ namespace: '/chat' });
  const [unreads, setUnreads] = useState<Record<string, number>>({}); // key by roomId
  const [query, setQuery] = useState('');

  // Listen for unread updates to reflect per-target DM rooms
  useEffect(() => {
    const handleUnread = ({ room, unread }: { room: string; unread: number }) => {
      setUnreads((prev) => ({ ...prev, [room]: unread }));
    };
    const handleUnreadUpdate = ({ room, userId, unread }: { room: string; userId: string; unread: number }) => {
      if (userId !== currentUserId) return;
      setUnreads((prev) => ({ ...prev, [room]: unread }));
    };
    on('chat:unread', handleUnread);
    on('chat:unread:update', handleUnreadUpdate);
    return () => {
      off('chat:unread', handleUnread);
      off('chat:unread:update', handleUnreadUpdate);
    };
  }, [currentUserId, on, off]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.displayName.toLowerCase().includes(q));
  }, [query, users]);

  const openDm = (targetId: string) => {
    if (!targetId || targetId === currentUserId) return;
    const room = canonicalDmRoom(currentUserId, targetId);
    emit('chat:join', room);
    emit('chat:history:request', { room, cursor: null, limit: 25 });
    onOpenRoom(room);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people"
          className="w-full border rounded px-2 py-1 text-sm"
        />
      </div>
      <ul className="flex flex-col divide-y">
        {filtered.map((u) => {
          const roomId = canonicalDmRoom(currentUserId, u.userId);
          const unread = unreads[roomId] ?? u.unread ?? 0;
          return (
            <li key={u.userId} className="flex items-center gap-3 py-2">
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt={u.displayName} className="h-6 w-6 rounded-full" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-gray-300" />
              )}
              <button
                type="button"
                className="flex-1 text-left hover:underline"
                onClick={() => openDm(u.userId)}
              >
                {u.displayName}
              </button>
              {unread > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs px-2 py-0.5">
                  {unread}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { canonicalDmRoom };