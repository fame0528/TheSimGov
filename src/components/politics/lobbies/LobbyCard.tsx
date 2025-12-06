/**
 * @fileoverview Lobby Card Component
 * @module components/politics/lobbies/LobbyCard
 * 
 * OVERVIEW:
 * Card component displaying summary information about a lobby/interest group.
 * Used in lobby lists and search results.
 * 
 * FEATURES:
 * - Lobby name, focus, scope, member count
 * - Strength indicator
 * - Join/View buttons based on membership status
 * - Responsive design
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

'use client';

import { Card, CardBody, CardFooter, Chip, Button, Progress } from '@heroui/react';
import { Users, MapPin, TrendingUp, Lock, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { LobbySummary } from '@/lib/types/lobby';
import {
  LOBBY_FOCUS_LABELS,
  LOBBY_SCOPE_LABELS,
  LobbyFocus,
  LobbyScope,
} from '@/lib/types/lobby';

/**
 * Props for LobbyCard
 */
interface LobbyCardProps {
  lobby: LobbySummary;
  isMember?: boolean;
  onJoin?: (lobbyId: string) => void;
  isJoining?: boolean;
}

/**
 * Get color for focus chip
 */
function getFocusColor(focus: LobbyFocus): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default' {
  const colors: Record<LobbyFocus, 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default'> = {
    [LobbyFocus.HEALTHCARE]: 'danger',
    [LobbyFocus.ENVIRONMENT]: 'success',
    [LobbyFocus.BUSINESS]: 'primary',
    [LobbyFocus.LABOR]: 'warning',
    [LobbyFocus.CIVIL_RIGHTS]: 'secondary',
    [LobbyFocus.EDUCATION]: 'primary',
    [LobbyFocus.DEFENSE]: 'default',
    [LobbyFocus.AGRICULTURE]: 'success',
    [LobbyFocus.TECHNOLOGY]: 'secondary',
    [LobbyFocus.FINANCE]: 'warning',
    [LobbyFocus.ENERGY]: 'danger',
    [LobbyFocus.TRADE]: 'primary',
  };
  return colors[focus] || 'default';
}

/**
 * Get icon for scope
 */
function getScopeIcon(scope: LobbyScope) {
  switch (scope) {
    case LobbyScope.NATIONAL:
      return <Globe className="w-3 h-3" />;
    case LobbyScope.STATE:
    case LobbyScope.REGIONAL:
    case LobbyScope.LOCAL:
      return <MapPin className="w-3 h-3" />;
    default:
      return <MapPin className="w-3 h-3" />;
  }
}

/**
 * LobbyCard Component
 */
export default function LobbyCard({
  lobby,
  isMember = false,
  onJoin,
  isJoining = false,
}: LobbyCardProps) {
  const router = useRouter();

  const handleViewClick = () => {
    router.push(`/game/politics/lobbies/${lobby.slug}`);
  };

  const handleJoinClick = () => {
    if (onJoin && !isMember) {
      onJoin(lobby.id);
    }
  };

  return (
    <Card className="w-full">
      <CardBody className="gap-3">
        {/* Header: Name and Chips */}
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold line-clamp-1">{lobby.name}</h3>
            {lobby.inviteOnly && (
              <Chip size="sm" variant="flat" startContent={<Lock className="w-3 h-3" />}>
                Invite Only
              </Chip>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Chip
              size="sm"
              color={getFocusColor(lobby.focus)}
              variant="flat"
            >
              {LOBBY_FOCUS_LABELS[lobby.focus]}
            </Chip>
            <Chip
              size="sm"
              variant="bordered"
              startContent={getScopeIcon(lobby.scope)}
            >
              {LOBBY_SCOPE_LABELS[lobby.scope]}
              {lobby.stateCode && ` (${lobby.stateCode})`}
            </Chip>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-default-700 line-clamp-2">
          {lobby.description}
        </p>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-default-600">
            <Users className="w-4 h-4" />
            <span>{lobby.memberCount} members</span>
          </div>
          <div className="flex items-center gap-1 text-default-600">
            <TrendingUp className="w-4 h-4" />
            <span>Strength: {lobby.strength}</span>
          </div>
        </div>

        {/* Strength Bar */}
        <Progress
          size="sm"
          value={lobby.strength}
          maxValue={100}
          color={lobby.strength >= 70 ? 'success' : lobby.strength >= 40 ? 'warning' : 'danger'}
          className="max-w-full"
          aria-label="Lobby strength"
        />

        {/* Leader */}
        <p className="text-xs text-default-400">
          Led by <span className="font-medium">{lobby.leaderName}</span>
        </p>
      </CardBody>

      <CardFooter className="gap-2">
        <Button
          color="primary"
          variant="flat"
          size="sm"
          className="flex-1"
          onPress={handleViewClick}
        >
          View
        </Button>
        {!isMember && (
          <Button
            color="success"
            size="sm"
            className="flex-1"
            onPress={handleJoinClick}
            isLoading={isJoining}
            isDisabled={isJoining}
          >
            {lobby.inviteOnly ? 'Apply' : 'Join'}
          </Button>
        )}
        {isMember && (
          <Chip color="success" size="sm" variant="flat">
            Member
          </Chip>
        )}
      </CardFooter>
    </Card>
  );
}
