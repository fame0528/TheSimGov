/**
 * @fileoverview Synergy Panel Component
 * @module components/empire/SynergyPanel
 * 
 * OVERVIEW:
 * Displays active synergies, their bonuses, and potential synergies to unlock.
 * The primary motivator for cross-industry acquisitions.
 * 
 * THE HOOK:
 * Showing "you're 1 company away from +25% bonus" creates irresistible
 * acquisition pressure.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Progress,
  Divider,
  Tooltip,
  Tabs,
  Tab,
} from '@heroui/react';
import {
  Zap,
  Lock,
  Unlock,
  Star,
  TrendingUp,
  DollarSign,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  AlertCircle,
  Crown,
  Target,
} from 'lucide-react';
import { SynergyTier, SynergyBonusTarget, EmpireIndustry } from '@/lib/types/empire';

// ============================================================================
// Types
// ============================================================================

interface SynergyBonus {
  target: SynergyBonusTarget;
  value: number;
  description: string;
}

interface ActiveSynergy {
  id: string;
  name: string;
  description: string;
  tier: SynergyTier;
  icon: string;
  color: string;
  requiredIndustries: EmpireIndustry[];
  bonuses: SynergyBonus[];
  multiplier: number;
  finalBonus: number;
}

interface PotentialSynergy {
  id: string;
  name: string;
  description: string;
  tier: SynergyTier;
  icon: string;
  color: string;
  requiredIndustries: EmpireIndustry[];
  ownedIndustries: EmpireIndustry[];
  missingIndustries: EmpireIndustry[];
  percentComplete: number;
  estimatedBonus: number;
  unlockLevel: number;
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_ACTIVE_SYNERGIES: ActiveSynergy[] = [
  {
    id: 'fintech-empire',
    name: 'Fintech Empire',
    description: 'Tech companies enhance banking operations with AI and automation',
    tier: SynergyTier.BASIC,
    icon: '💳',
    color: '#3B82F6',
    requiredIndustries: [EmpireIndustry.BANKING, EmpireIndustry.TECH],
    bonuses: [
      { target: SynergyBonusTarget.OPERATING_COST, value: 15, description: '-15% operating costs' },
      { target: SynergyBonusTarget.PRODUCTION_SPEED, value: 20, description: '+20% efficiency' },
    ],
    multiplier: 1.4,
    finalBonus: 35,
  },
  {
    id: 'property-mogul',
    name: 'Property Mogul',
    description: 'Banks provide preferential financing to real estate holdings',
    tier: SynergyTier.BASIC,
    icon: '🏢',
    color: '#10B981',
    requiredIndustries: [EmpireIndustry.BANKING, EmpireIndustry.REAL_ESTATE],
    bonuses: [
      { target: SynergyBonusTarget.REVENUE, value: 12, description: '+12% revenue' },
      { target: SynergyBonusTarget.LOAN_RATE, value: 8, description: '-8% loan rates' },
    ],
    multiplier: 1.4,
    finalBonus: 28,
  },
  {
    id: 'green-finance',
    name: 'Green Finance',
    description: 'Sustainable energy investments create premium returns',
    tier: SynergyTier.BASIC,
    icon: '🌱',
    color: '#22C55E',
    requiredIndustries: [EmpireIndustry.BANKING, EmpireIndustry.ENERGY],
    bonuses: [
      { target: SynergyBonusTarget.REVENUE, value: 10, description: '+10% revenue' },
      { target: SynergyBonusTarget.OPERATING_COST, value: 12, description: '-12% costs' },
    ],
    multiplier: 1.4,
    finalBonus: 30,
  },
];

const MOCK_POTENTIAL_SYNERGIES: PotentialSynergy[] = [
  {
    id: 'data-goldmine',
    name: 'Data Goldmine',
    description: 'Financial data + tech analytics + media reach = unparalleled insights',
    tier: SynergyTier.ADVANCED,
    icon: '📊',
    color: '#A855F7',
    requiredIndustries: [EmpireIndustry.BANKING, EmpireIndustry.TECH, EmpireIndustry.MEDIA],
    ownedIndustries: [EmpireIndustry.BANKING, EmpireIndustry.TECH],
    missingIndustries: [EmpireIndustry.MEDIA],
    percentComplete: 67,
    estimatedBonus: 55,
    unlockLevel: 3,
  },
  {
    id: 'infrastructure-king',
    name: 'Infrastructure King',
    description: 'Control property, power, and finance for self-sustaining developments',
    tier: SynergyTier.ADVANCED,
    icon: '🏗️',
    color: '#64748B',
    requiredIndustries: [EmpireIndustry.BANKING, EmpireIndustry.REAL_ESTATE, EmpireIndustry.ENERGY],
    ownedIndustries: [EmpireIndustry.BANKING, EmpireIndustry.REAL_ESTATE, EmpireIndustry.ENERGY],
    missingIndustries: [],
    percentComplete: 100,
    estimatedBonus: 55,
    unlockLevel: 3,
  },
  {
    id: 'vertical-supply',
    name: 'Vertically Integrated Supply',
    description: 'Own logistics ensures just-in-time delivery',
    tier: SynergyTier.BASIC,
    icon: '🚛',
    color: '#78716C',
    requiredIndustries: [EmpireIndustry.MANUFACTURING, EmpireIndustry.LOGISTICS],
    ownedIndustries: [],
    missingIndustries: [EmpireIndustry.MANUFACTURING, EmpireIndustry.LOGISTICS],
    percentComplete: 0,
    estimatedBonus: 45,
    unlockLevel: 1,
  },
  {
    id: 'economic-titan',
    name: 'Economic Titan',
    description: 'Control five major industries for market-moving power',
    tier: SynergyTier.ULTIMATE,
    icon: '🌐',
    color: '#1E3A8A',
    requiredIndustries: [
      EmpireIndustry.BANKING, 
      EmpireIndustry.TECH, 
      EmpireIndustry.MANUFACTURING, 
      EmpireIndustry.ENERGY, 
      EmpireIndustry.REAL_ESTATE
    ],
    ownedIndustries: [EmpireIndustry.BANKING, EmpireIndustry.TECH, EmpireIndustry.REAL_ESTATE, EmpireIndustry.ENERGY],
    missingIndustries: [EmpireIndustry.MANUFACTURING],
    percentComplete: 80,
    estimatedBonus: 140,
    unlockLevel: 8,
  },
];

// ============================================================================
// Helpers
// ============================================================================

type ChipColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

function getTierColor(tier: SynergyTier): ChipColor {
  switch (tier) {
    case SynergyTier.BASIC: return 'success';
    case SynergyTier.ADVANCED: return 'primary';
    case SynergyTier.ELITE: return 'secondary';
    case SynergyTier.ULTIMATE: return 'warning';
    default: return 'default';
  }
}

function getTierLabel(tier: SynergyTier): string {
  switch (tier) {
    case SynergyTier.BASIC: return 'Basic';
    case SynergyTier.ADVANCED: return 'Advanced';
    case SynergyTier.ELITE: return 'Elite';
    case SynergyTier.ULTIMATE: return 'Ultimate';
    default: return tier;
  }
}

function formatIndustry(industry: EmpireIndustry): string {
  return industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ============================================================================
// Active Synergy Card Component
// ============================================================================

interface ActiveSynergyCardProps {
  synergy: ActiveSynergy;
}

function ActiveSynergyCard({ synergy }: ActiveSynergyCardProps) {
  return (
    <Card className="bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors">
      <CardBody className="p-4">
        <div className="flex items-start gap-4">
          <div 
            className="p-3 rounded-xl text-2xl"
            style={{ backgroundColor: `${synergy.color}20` }}
          >
            {synergy.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-white">{synergy.name}</h4>
              <Chip size="sm" color={getTierColor(synergy.tier)} variant="flat">
                {getTierLabel(synergy.tier)}
              </Chip>
            </div>
            <p className="text-sm text-gray-400 mb-3">{synergy.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {synergy.requiredIndustries.map((ind) => (
                <Chip key={ind} size="sm" variant="dot" color="success">
                  {formatIndustry(ind)}
                </Chip>
              ))}
            </div>

            <Divider className="my-3 bg-slate-700" />

            <div className="space-y-2">
              {synergy.bonuses.map((bonus, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{bonus.description}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Base: {bonus.value}%</span>
                    <ChevronRight className="w-3 h-3 text-gray-600" />
                    <span className="text-green-400 font-bold">
                      {Math.round(bonus.value * synergy.multiplier)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Empire Multiplier: {synergy.multiplier}x</span>
              </div>
              <Chip color="success" variant="flat" size="lg" startContent={<TrendingUp className="w-4 h-4" />}>
                +{synergy.finalBonus}% Total
              </Chip>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Potential Synergy Card Component
// ============================================================================

interface PotentialSynergyCardProps {
  synergy: PotentialSynergy;
  currentLevel: number;
  onAcquire: (industry: EmpireIndustry) => void;
}

function PotentialSynergyCard({ synergy, currentLevel, onAcquire }: PotentialSynergyCardProps) {
  const isReady = synergy.percentComplete === 100;
  const isLocked = currentLevel < synergy.unlockLevel;

  return (
    <Card 
      className={`bg-slate-800/50 border transition-colors ${
        isReady 
          ? 'border-green-500/50 bg-green-500/5 animate-pulse' 
          : isLocked 
            ? 'border-slate-700/50 opacity-60'
            : 'border-slate-700 hover:border-purple-500/50'
      }`}
    >
      <CardBody className="p-4">
        <div className="flex items-start gap-4">
          <div 
            className={`p-3 rounded-xl text-2xl relative ${isLocked ? 'grayscale' : ''}`}
            style={{ backgroundColor: `${synergy.color}20` }}
          >
            {synergy.icon}
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-xl">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-white">{synergy.name}</h4>
              <Chip size="sm" color={getTierColor(synergy.tier)} variant="flat">
                {getTierLabel(synergy.tier)}
              </Chip>
              {isLocked && (
                <Chip size="sm" variant="flat" color="default">
                  <Lock className="w-3 h-3 mr-1" /> Lvl {synergy.unlockLevel}
                </Chip>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-3">{synergy.description}</p>

            {/* Progress */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-400">Progress</span>
                <span className={`font-medium ${isReady ? 'text-green-400' : 'text-white'}`}>
                  {synergy.percentComplete}%
                </span>
              </div>
              <Progress
                value={synergy.percentComplete}
                color={isReady ? 'success' : 'secondary'}
                size="sm"
              />
            </div>

            {/* Required Industries */}
            <div className="flex flex-wrap gap-2 mb-3">
              {synergy.requiredIndustries.map((ind) => {
                const isOwned = synergy.ownedIndustries.includes(ind);
                return (
                  <Chip 
                    key={ind} 
                    size="sm" 
                    variant={isOwned ? 'dot' : 'bordered'}
                    color={isOwned ? 'success' : 'default'}
                    className={!isOwned ? 'border-dashed' : ''}
                  >
                    {isOwned ? '✓' : '○'} {formatIndustry(ind)}
                  </Chip>
                );
              })}
            </div>

            {/* Estimated Bonus */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-400">Estimated bonus when unlocked:</span>
              </div>
              <Chip color="warning" variant="flat" startContent={<ArrowUpRight className="w-3 h-3" />}>
                +{synergy.estimatedBonus}%
              </Chip>
            </div>

            {/* Action Button */}
            {!isLocked && synergy.missingIndustries.length > 0 && (
              <Button
                className="w-full mt-3"
                color="secondary"
                variant="flat"
                startContent={<Target className="w-4 h-4" />}
                onPress={() => onAcquire(synergy.missingIndustries[0])}
              >
                Acquire {formatIndustry(synergy.missingIndustries[0])} Company
              </Button>
            )}
            
            {isReady && !isLocked && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                <Unlock className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-400 font-medium">
                  Ready to activate! Synergy will apply automatically.
                </span>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SynergyPanel(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'active' | 'potential'>('active');
  const [activeSynergies] = useState<ActiveSynergy[]>(MOCK_ACTIVE_SYNERGIES);
  const [potentialSynergies] = useState<PotentialSynergy[]>(MOCK_POTENTIAL_SYNERGIES);
  const currentLevel = 4;

  // Calculate totals
  const totalBonus = activeSynergies.reduce((sum, s) => sum + s.finalBonus, 0);
  const nearUnlock = potentialSynergies.filter(s => s.percentComplete >= 50 && s.percentComplete < 100).length;

  const handleAcquire = (industry: EmpireIndustry) => {
    console.log('Navigate to acquire', industry);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Synergies</p>
                <p className="text-2xl font-bold text-white">{activeSynergies.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/20">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Bonus</p>
                <p className="text-2xl font-bold text-green-400">+{totalBonus}%</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20">
                <Star className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Near Unlock</p>
                <p className="text-2xl font-bold text-amber-400">{nearUnlock}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as 'active' | 'potential')}
        variant="underlined"
        color="secondary"
      >
        <Tab
          key="active"
          title={
            <div className="flex items-center gap-2">
              <Unlock className="w-4 h-4" />
              <span>Active ({activeSynergies.length})</span>
            </div>
          }
        />
        <Tab
          key="potential"
          title={
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Potential ({potentialSynergies.length})</span>
              {nearUnlock > 0 && (
                <Chip size="sm" color="warning" variant="flat">{nearUnlock} close!</Chip>
              )}
            </div>
          }
        />
      </Tabs>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'active' && (
          activeSynergies.length === 0 ? (
            <Card className="bg-slate-800/30 border border-slate-700">
              <CardBody className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Active Synergies</h3>
                <p className="text-gray-400 mb-4">
                  Acquire companies in multiple industries to unlock powerful synergies!
                </p>
                <Button color="secondary" startContent={<Target className="w-4 h-4" />}>
                  Browse Acquisitions
                </Button>
              </CardBody>
            </Card>
          ) : (
            activeSynergies.map((synergy) => (
              <ActiveSynergyCard key={synergy.id} synergy={synergy} />
            ))
          )
        )}

        {activeTab === 'potential' && (
          potentialSynergies
            .sort((a, b) => b.percentComplete - a.percentComplete)
            .map((synergy) => (
              <PotentialSynergyCard
                key={synergy.id}
                synergy={synergy}
                currentLevel={currentLevel}
                onAcquire={handleAcquire}
              />
            ))
        )}
      </div>
    </div>
  );
}

export default SynergyPanel;
