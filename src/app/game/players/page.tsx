/**
 * @fileoverview Players Page - Browse and Search Players
 * @module app/game/players/page
 * 
 * OVERVIEW:
 * Lists all players with search and pagination.
 * Click to view profile and send messages.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardBody, Avatar, Button, Spinner, Input } from '@heroui/react';
import { Users, Search, Mail, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { ComposeMessage } from '@/components/messages';
import type { CreateMessageRequest } from '@/lib/types/messages';

interface Player {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  state: string;
  gender: string;
  imageUrl: string;
  createdAt: string;
}

interface PlayersResponse {
  success: boolean;
  data: Player[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export default function PlayersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Compose modal state
  const [showCompose, setShowCompose] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Fetch players
  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      
      if (search) {
        params.set('search', search);
      }
      
      const res = await fetch(`/api/players?${params}`);
      const data: PlayersResponse = await res.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch players');
      }
      
      setPlayers(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load players');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPlayers();
    }
  }, [status, fetchPlayers]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  // Open message compose
  const handleMessagePlayer = (player: Player) => {
    setSelectedPlayer(player);
    setShowCompose(true);
  };

  // Send message handler
  const handleSendMessage = async (request: CreateMessageRequest) => {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to send message');
    }
    
    setSelectedPlayer(null);
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Spinner size="lg" label="Loading..." />
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                  Players
                </h1>
                <p className="text-slate-400 mt-1 text-sm">
                  Browse and connect with other players
                  {total > 0 && (
                    <span className="ml-2 text-slate-500">
                      ({total} players)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="light"
              onPress={() => router.push('/game')}
              className="text-slate-400 hover:text-white"
              startContent={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by username or name..."
              startContent={<Search className="w-4 h-4 text-slate-400" />}
              classNames={{
                input: 'bg-transparent text-white',
                inputWrapper: 'bg-slate-900/50 border border-white/10 hover:border-white/20',
              }}
            />
            <Button type="submit" color="primary">
              Search
            </Button>
            {search && (
              <Button
                variant="light"
                onPress={() => {
                  setSearch('');
                  setSearchInput('');
                  setPage(1);
                }}
                className="text-slate-400"
              >
                Clear
              </Button>
            )}
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Players Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : players.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Users className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">
              {search ? 'No players found matching your search' : 'No players found'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {players.map((player) => (
                <Card
                  key={player.id}
                  className="bg-slate-900/50 border border-white/5 hover:border-blue-500/30 transition-colors cursor-pointer"
                  isPressable
                  onPress={() => router.push(`/users/${player.username}`)}
                >
                  <CardBody className="flex flex-row items-center gap-4 p-4">
                    <Avatar
                      src={player.imageUrl}
                      name={`${player.firstName} ${player.lastName}`}
                      size="lg"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {player.firstName} {player.lastName}
                      </div>
                      <div className="text-slate-400 text-sm truncate">
                        @{player.username}
                      </div>
                      <div className="text-slate-500 text-xs mt-1">
                        {player.state}
                      </div>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      className="flex-shrink-0 bg-blue-600/20 text-blue-400"
                      onPress={() => handleMessagePlayer(player)}
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={page <= 1}
                  onPress={() => setPage(p => p - 1)}
                  startContent={<ChevronLeft className="w-4 h-4" />}
                  className="bg-slate-800/50"
                >
                  Previous
                </Button>
                <span className="text-slate-400 text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={page >= totalPages}
                  onPress={() => setPage(p => p + 1)}
                  endContent={<ChevronRight className="w-4 h-4" />}
                  className="bg-slate-800/50"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Compose Message Modal */}
      <ComposeMessage
        isOpen={showCompose}
        onClose={() => {
          setShowCompose(false);
          setSelectedPlayer(null);
        }}
        onSend={handleSendMessage}
        initialRecipient={selectedPlayer?.username || ''}
      />
    </div>
  );
}
