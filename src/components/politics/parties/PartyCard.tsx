/**
 * @fileoverview PartyCard Component
 * @module components/politics/parties/PartyCard
 * 
 * OVERVIEW:
 * Card component displaying a political party organization summary.
 * Shows name, affiliation, level, strength, and membership info.
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

'use client';

import React from 'react';
import { Card, CardBody, CardHeader, Chip, Progress, Button, Divider } from '@heroui/react';
import { Users, Building2, Globe, MapPin } from 'lucide-react';
import type { PartySummary } from '@/lib/types/party';
import { 
  PARTY_LEVEL_LABELS, 
  PARTY_STATUS_LABELS,
  PartyLevel,
  PartyStatus,
} from '@/lib/types/party';
import { PoliticalParty } from '@/types/politics';

// ===================== TYPES =====================

export interface PartyCardProps {
  /** Party summary data */
  party: PartySummary;
  /** Whether the current user is a member */
  isMember?: boolean;
  /** Callback when register button is clicked */
  onRegister?: (partyId: string) => void;
  /** Callback when card is clicked */
  onClick?: (partyId: string) => void;
  /** Loading state */
  isLoading?: boolean;
}

// ===================== CONSTANTS =====================

const AFFILIATION_COLORS: Record<PoliticalParty, { bg: string; text: string }> = {
  [PoliticalParty.DEMOCRATIC]: { bg: 'bg-blue-100', text: 'text-blue-700' },
  [PoliticalParty.REPUBLICAN]: { bg: 'bg-red-100', text: 'text-red-700' },
  [PoliticalParty.INDEPENDENT]: { bg: 'bg-purple-100', text: 'text-purple-700' },
  [PoliticalParty.LIBERTARIAN]: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  [PoliticalParty.GREEN]: { bg: 'bg-green-100', text: 'text-green-700' },
  [PoliticalParty.OTHER]: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

const LEVEL_ICONS: Record<PartyLevel, React.ReactNode> = {
  [PartyLevel.LOCAL]: <MapPin className="w-4 h-4" />,
  [PartyLevel.STATE]: <Building2 className="w-4 h-4" />,
  [PartyLevel.NATIONAL]: <Globe className="w-4 h-4" />,
};

const STATUS_COLORS: Record<PartyStatus, 'success' | 'warning' | 'danger' | 'default'> = {
  [PartyStatus.ACTIVE]: 'success',
  [PartyStatus.INACTIVE]: 'warning',
  [PartyStatus.SUSPENDED]: 'danger',
  [PartyStatus.DISSOLVED]: 'default',
};

// ===================== COMPONENT =====================

export function PartyCard({
  party,
  isMember = false,
  onRegister,
  onClick,
  isLoading = false,
}: PartyCardProps) {
  const affiliationColor = AFFILIATION_COLORS[party.affiliation] || AFFILIATION_COLORS[PoliticalParty.OTHER];
  const levelIcon = LEVEL_ICONS[party.level];
  const statusColor = STATUS_COLORS[party.status];

  const handleClick = () => {
    if (onClick) {
      onClick(party.id);
    }
  };

  const handleRegister = () => {
    if (onRegister) {
      onRegister(party.id);
    }
  };

  // Get strength color
  const getStrengthColor = (strength: number): 'success' | 'warning' | 'danger' => {
    if (strength >= 70) return 'success';
    if (strength >= 40) return 'warning';
    return 'danger';
  };

  return (
    <Card
      className="w-full hover:shadow-lg transition-shadow cursor-pointer"
      isPressable={!!onClick}
      onPress={handleClick}
      style={party.primaryColor ? { borderTop: `4px solid ${party.primaryColor}` } : undefined}
    >
      <CardHeader className="flex justify-between items-start gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">{party.name}</h3>
          <div className="flex items-center gap-2">
            <Chip
              size="sm"
              className={`${affiliationColor.bg} ${affiliationColor.text}`}
            >
              {party.affiliation}
            </Chip>
            <Chip
              size="sm"
              variant="flat"
              startContent={levelIcon}
            >
              {PARTY_LEVEL_LABELS[party.level]}
              {party.stateCode && ` (${party.stateCode})`}
            </Chip>
          </div>
        </div>
        <Chip size="sm" color={statusColor} variant="flat">
          {PARTY_STATUS_LABELS[party.status]}
        </Chip>
      </CardHeader>

      <Divider />

      <CardBody className="gap-4">
        {party.description && (
          <p className="text-sm text-default-500 line-clamp-2">
            {party.description}
          </p>
        )}

        {/* Strength Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-default-500">Party Strength</span>
            <span className="font-medium">{party.strength}%</span>
          </div>
          <Progress
            size="sm"
            value={party.strength}
            color={getStrengthColor(party.strength)}
            aria-label="Party strength"
          />
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-1 text-default-500">
            <Users className="w-4 h-4" />
            <span>{party.memberCount.toLocaleString()} members</span>
          </div>
          <div className="text-default-400">
            Chair: {party.chairName}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          {!isMember && party.registrationOpen && party.status === PartyStatus.ACTIVE && (
            <Button
              color="primary"
              size="sm"
              onPress={handleRegister}
              isLoading={isLoading}
              className="flex-1"
            >
              Register
            </Button>
          )}
          {!isMember && !party.registrationOpen && party.status === PartyStatus.ACTIVE && (
            <Chip size="sm" variant="flat" color="default">
              Registration Closed
            </Chip>
          )}
          {isMember && (
            <Chip size="sm" variant="flat" color="success">
              ✓ Member
            </Chip>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export default PartyCard;
