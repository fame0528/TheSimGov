/**
 * @fileoverview Bank Events Panel Component
 * @module components/banking/BankEventsPanel
 * 
 * OVERVIEW:
 * Panel for displaying random bank events, daily bonuses, and streak rewards.
 * Creates "one more turn" addiction through variable reward systems.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';
import {
  Gift,
  Flame,
  Calendar,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Star,
  Zap,
  Shield,
  Clock,
  PartyPopper,
  Newspaper,
  Building,
  Users,
  ChevronRight,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface BankEventsPanelProps {
  onClaimBonus?: (bonusAmount: number) => void;
  onEventAction?: (eventId: string, action: string) => void;
}

type EventType = 'OPPORTUNITY' | 'CRISIS' | 'NEWS' | 'REGULATORY' | 'CUSTOMER';
type EventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface BankEvent {
  id: string;
  type: EventType;
  severity: EventSeverity;
  title: string;
  description: string;
  choices: {
    id: string;
    label: string;
    effect: string;
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
  expiresIn: number; // minutes
  reward?: number;
  penalty?: number;
}

interface DailyBonus {
  day: number;
  reward: number;
  claimed: boolean;
  isToday: boolean;
  type: 'CASH' | 'XP' | 'ITEM' | 'MULTIPLIER';
}

// ============================================================================
// Mock Data (would come from API in production)
// ============================================================================

const MOCK_EVENTS: BankEvent[] = [
  {
    id: 'evt-1',
    type: 'OPPORTUNITY',
    severity: 'MEDIUM',
    title: 'Tech Startup Seeking Funding',
    description: 'A promising AI startup is looking for a $500K loan. Their business plan looks solid, but they have no track record.',
    choices: [
      { id: 'approve', label: 'Approve Full Loan', effect: '+$45K potential interest, HIGH default risk', risk: 'HIGH' },
      { id: 'partial', label: 'Offer $250K', effect: '+$22K potential interest, MEDIUM default risk', risk: 'MEDIUM' },
      { id: 'decline', label: 'Decline', effect: 'No risk, no reward', risk: 'LOW' },
    ],
    expiresIn: 45,
  },
  {
    id: 'evt-2',
    type: 'CRISIS',
    severity: 'HIGH',
    title: 'Major Borrower Defaulting',
    description: 'One of your largest loan recipients is showing signs of financial distress. Total exposure: $750K.',
    choices: [
      { id: 'negotiate', label: 'Restructure Loan', effect: 'Extend term, reduce monthly, keep relationship', risk: 'MEDIUM' },
      { id: 'collect', label: 'Aggressive Collection', effect: 'Faster recovery but damages reputation', risk: 'HIGH' },
      { id: 'write-off', label: 'Write Off Loss', effect: 'Tax benefit, clean books, move on', risk: 'LOW' },
    ],
    expiresIn: 30,
    penalty: 50000,
  },
  {
    id: 'evt-3',
    type: 'NEWS',
    severity: 'LOW',
    title: 'Fed Announces Rate Decision',
    description: 'The Federal Reserve has announced a 0.25% interest rate increase. Markets are responding positively.',
    choices: [
      { id: 'raise', label: 'Raise Your Rates', effect: 'Higher income, fewer new loans', risk: 'LOW' },
      { id: 'hold', label: 'Hold Current Rates', effect: 'Competitive advantage for new loans', risk: 'LOW' },
    ],
    expiresIn: 120,
  },
];

const MOCK_DAILY_BONUSES: DailyBonus[] = [
  { day: 1, reward: 1000, claimed: true, isToday: false, type: 'CASH' },
  { day: 2, reward: 2500, claimed: true, isToday: false, type: 'CASH' },
  { day: 3, reward: 5000, claimed: true, isToday: false, type: 'CASH' },
  { day: 4, reward: 100, claimed: false, isToday: true, type: 'XP' },
  { day: 5, reward: 10000, claimed: false, isToday: false, type: 'CASH' },
  { day: 6, reward: 500, claimed: false, isToday: false, type: 'XP' },
  { day: 7, reward: 50000, claimed: false, isToday: false, type: 'CASH' },
];

// ============================================================================
// Helpers
// ============================================================================

function getEventColor(type: EventType): string {
  switch (type) {
    case 'OPPORTUNITY': return 'success';
    case 'CRISIS': return 'danger';
    case 'NEWS': return 'primary';
    case 'REGULATORY': return 'warning';
    case 'CUSTOMER': return 'secondary';
    default: return 'default';
  }
}

function getEventIcon(type: EventType): React.ReactNode {
  switch (type) {
    case 'OPPORTUNITY': return <TrendingUp className="w-5 h-5" />;
    case 'CRISIS': return <AlertTriangle className="w-5 h-5" />;
    case 'NEWS': return <Newspaper className="w-5 h-5" />;
    case 'REGULATORY': return <Building className="w-5 h-5" />;
    case 'CUSTOMER': return <Users className="w-5 h-5" />;
    default: return <Star className="w-5 h-5" />;
  }
}

function getSeverityColor(severity: EventSeverity): string {
  switch (severity) {
    case 'CRITICAL': return 'bg-red-500';
    case 'HIGH': return 'bg-orange-500';
    case 'MEDIUM': return 'bg-yellow-500';
    case 'LOW': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}

function getRiskColor(risk: 'LOW' | 'MEDIUM' | 'HIGH'): 'success' | 'warning' | 'danger' {
  switch (risk) {
    case 'LOW': return 'success';
    case 'MEDIUM': return 'warning';
    case 'HIGH': return 'danger';
  }
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

// ============================================================================
// Event Card Component
// ============================================================================

interface EventCardProps {
  event: BankEvent;
  onViewDetails: (event: BankEvent) => void;
}

function EventCard({ event, onViewDetails }: EventCardProps) {
  const [timeLeft, setTimeLeft] = useState(event.expiresIn * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Card 
      className={`bg-slate-800/50 border hover:border-slate-500 transition-colors cursor-pointer ${
        event.severity === 'CRITICAL' ? 'border-red-700/50 animate-pulse' :
        event.severity === 'HIGH' ? 'border-orange-700/50' :
        'border-slate-700'
      }`}
      isPressable
      onPress={() => onViewDetails(event)}
    >
      <CardBody className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-${getEventColor(event.type)}/20 text-${getEventColor(event.type)}`}>
              {getEventIcon(event.type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-white">{event.title}</h4>
                <div className={`w-2 h-2 rounded-full ${getSeverityColor(event.severity)}`} />
              </div>
              <p className="text-xs text-gray-400">{event.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{minutes}:{seconds.toString().padStart(2, '0')}</span>
          </div>
        </div>
        <p className="text-sm text-gray-300 line-clamp-2">{event.description}</p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-1">
            {event.choices.slice(0, 2).map((choice) => (
              <Chip 
                key={choice.id} 
                size="sm" 
                variant="flat" 
                color={getRiskColor(choice.risk)}
              >
                {choice.label}
              </Chip>
            ))}
            {event.choices.length > 2 && (
              <Chip size="sm" variant="flat">+{event.choices.length - 2}</Chip>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Daily Bonus Component
// ============================================================================

interface DailyBonusCardProps {
  bonuses: DailyBonus[];
  currentStreak: number;
  onClaim: () => void;
  canClaim: boolean;
}

function DailyBonusCard({ bonuses, currentStreak, onClaim, canClaim }: DailyBonusCardProps) {
  return (
    <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-700/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <h4 className="text-lg font-semibold text-white">Daily Login Streak</h4>
          </div>
          <Chip color="warning" variant="flat" startContent={<Zap className="w-3 h-3" />}>
            {currentStreak} Days
          </Chip>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="flex justify-between gap-2 mb-4">
          {bonuses.map((bonus) => (
            <div 
              key={bonus.day}
              className={`flex-1 p-2 rounded-lg text-center ${
                bonus.claimed 
                  ? 'bg-green-900/30 border border-green-700/50' 
                  : bonus.isToday
                    ? 'bg-amber-900/30 border-2 border-amber-500 animate-pulse'
                    : 'bg-slate-800/50 border border-slate-700'
              }`}
            >
              <p className="text-xs text-gray-400">Day {bonus.day}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {bonus.type === 'CASH' ? (
                  <DollarSign className="w-3 h-3 text-green-400" />
                ) : (
                  <Star className="w-3 h-3 text-purple-400" />
                )}
                <span className={`text-sm font-bold ${
                  bonus.claimed ? 'text-green-400' : 
                  bonus.isToday ? 'text-amber-400' : 'text-gray-400'
                }`}>
                  {bonus.type === 'CASH' ? formatCurrency(bonus.reward) : `${bonus.reward} XP`}
                </span>
              </div>
              {bonus.claimed && (
                <div className="text-green-400 text-xs mt-1">✓</div>
              )}
            </div>
          ))}
        </div>
        
        {canClaim && (
          <Button
            color="warning"
            className="w-full"
            startContent={<Gift className="w-4 h-4" />}
            onPress={onClaim}
          >
            Claim Today&apos;s Bonus!
          </Button>
        )}
        
        {!canClaim && (
          <div className="text-center text-sm text-gray-400">
            <Clock className="w-4 h-4 inline mr-1" />
            Come back tomorrow for your next reward!
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Event Detail Modal Component
// ============================================================================

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: BankEvent | null;
  onChoose: (eventId: string, choiceId: string) => void;
}

function EventDetailModal({ isOpen, onClose, event, onChoose }: EventDetailModalProps) {
  if (!event) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent className="bg-slate-800 border border-slate-700">
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${getEventColor(event.type)}/20`}>
              {getEventIcon(event.type)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{event.title}</h3>
              <div className="flex items-center gap-2">
                <Chip size="sm" color={getEventColor(event.type) as 'success' | 'danger' | 'primary' | 'warning' | 'secondary'} variant="flat">
                  {event.type}
                </Chip>
                <Chip size="sm" variant="flat">
                  <span className={`mr-1 inline-block w-2 h-2 rounded-full ${getSeverityColor(event.severity)}`} />
                  {event.severity}
                </Chip>
              </div>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <p className="text-gray-300 mb-6">{event.description}</p>
          
          <h4 className="text-sm font-semibold text-gray-400 mb-3">YOUR OPTIONS:</h4>
          <div className="space-y-3">
            {event.choices.map((choice) => (
              <Card 
                key={choice.id}
                className="bg-slate-900/50 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                isPressable
                onPress={() => onChoose(event.id, choice.id)}
              >
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{choice.label}</p>
                      <p className="text-sm text-gray-400">{choice.effect}</p>
                    </div>
                    <Chip color={getRiskColor(choice.risk)} variant="flat" size="sm">
                      {choice.risk} Risk
                    </Chip>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Decide Later
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function BankEventsPanel({ 
  onClaimBonus, 
  onEventAction 
}: BankEventsPanelProps): React.ReactElement {
  // State
  const [events] = useState<BankEvent[]>(MOCK_EVENTS);
  const [dailyBonuses] = useState<DailyBonus[]>(MOCK_DAILY_BONUSES);
  const [selectedEvent, setSelectedEvent] = useState<BankEvent | null>(null);
  const [currentStreak] = useState(4);
  const [canClaimToday, setCanClaimToday] = useState(true);

  // Modal disclosure
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Handlers
  const handleViewEvent = useCallback((event: BankEvent) => {
    setSelectedEvent(event);
    onOpen();
  }, [onOpen]);

  const handleChooseOption = useCallback((eventId: string, choiceId: string) => {
    onEventAction?.(eventId, choiceId);
    onClose();
    // In real implementation, would remove event from list
  }, [onEventAction, onClose]);

  const handleClaimBonus = useCallback(() => {
    const todayBonus = dailyBonuses.find(b => b.isToday);
    if (todayBonus) {
      onClaimBonus?.(todayBonus.reward);
      setCanClaimToday(false);
    }
  }, [dailyBonuses, onClaimBonus]);

  return (
    <div className="space-y-6">
      {/* Daily Bonus */}
      <DailyBonusCard
        bonuses={dailyBonuses}
        currentStreak={currentStreak}
        onClaim={handleClaimBonus}
        canClaim={canClaimToday}
      />

      {/* Active Events */}
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h4 className="text-lg font-semibold text-white">Active Events</h4>
            </div>
            <Chip size="sm" variant="flat" color="warning">
              {events.length} Pending
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <PartyPopper className="w-12 h-12 mx-auto mb-3 text-gray-500" />
              <p>No active events right now!</p>
              <p className="text-sm">Check back later for new opportunities.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onViewDetails={handleViewEvent}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Weekly Goals (Bonus Section) */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-700/30">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <h4 className="text-lg font-semibold text-white">Weekly Goals</h4>
          </div>
        </CardHeader>
        <CardBody className="pt-0 space-y-3">
          <div className="bg-slate-900/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Issue 10 new loans</span>
              <span className="text-sm text-white font-medium">7/10</span>
            </div>
            <Progress value={70} color="primary" size="sm" />
          </div>
          <div className="bg-slate-900/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Collect $50K in interest</span>
              <span className="text-sm text-white font-medium">$32K</span>
            </div>
            <Progress value={64} color="success" size="sm" />
          </div>
          <div className="bg-slate-900/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Maintain 0% default rate</span>
              <span className="text-sm text-green-400 font-medium">✓ On Track</span>
            </div>
            <Progress value={100} color="success" size="sm" />
          </div>
        </CardBody>
      </Card>

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={isOpen}
        onClose={onClose}
        event={selectedEvent}
        onChoose={handleChooseOption}
      />
    </div>
  );
}

export default BankEventsPanel;
