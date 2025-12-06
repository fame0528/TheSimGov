/**
 * @fileoverview Acquisition Browser Component
 * @module components/empire/AcquisitionBrowser
 * 
 * OVERVIEW:
 * Browse and search for companies available for acquisition.
 * Shows synergy potential when acquiring specific industries.
 * 
 * THE HOOK:
 * Highlighting synergy unlocks with each acquisition creates
 * "just one more purchase" addiction loop.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Divider,
  Progress,
} from '@heroui/react';
import {
  Search,
  Filter,
  ShoppingCart,
  Building2,
  TrendingUp,
  DollarSign,
  Zap,
  Star,
  Clock,
  Users,
  BarChart3,
  Target,
  Sparkles,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { EmpireIndustry, SynergyTier } from '@/lib/types/empire';

// ============================================================================
// Types
// ============================================================================

interface AcquisitionTarget {
  id: string;
  name: string;
  industry: EmpireIndustry;
  level: number;
  value: number;
  monthlyRevenue: number;
  employees: number;
  age: number; // months old
  profitMargin: number;
  synergyPotential: number; // number of new synergies this would unlock
  potentialSynergies: string[];
  highlights: string[];
}

interface IndustryFilter {
  value: EmpireIndustry | 'all';
  label: string;
}

// ============================================================================
// Mock Data
// ============================================================================

const INDUSTRY_FILTERS: IndustryFilter[] = [
  { value: 'all', label: 'All Industries' },
  { value: EmpireIndustry.MEDIA, label: 'Media' },
  { value: EmpireIndustry.MANUFACTURING, label: 'Manufacturing' },
  { value: EmpireIndustry.HEALTHCARE, label: 'Healthcare' },
  { value: EmpireIndustry.LOGISTICS, label: 'Logistics' },
  { value: EmpireIndustry.RETAIL, label: 'Retail' },
  { value: EmpireIndustry.POLITICS, label: 'Politics' },
];

const MOCK_TARGETS: AcquisitionTarget[] = [
  {
    id: '1',
    name: 'Digital News Network',
    industry: EmpireIndustry.MEDIA,
    level: 3,
    value: 2_800_000,
    monthlyRevenue: 180_000,
    employees: 45,
    age: 24,
    profitMargin: 22,
    synergyPotential: 2,
    potentialSynergies: ['Data Goldmine', 'Financial Influencer'],
    highlights: ['Strong social media presence', 'Profitable since year 1'],
  },
  {
    id: '2',
    name: 'AutoTech Manufacturing',
    industry: EmpireIndustry.MANUFACTURING,
    level: 4,
    value: 8_500_000,
    monthlyRevenue: 520_000,
    employees: 280,
    age: 48,
    profitMargin: 18,
    synergyPotential: 3,
    potentialSynergies: ['Industrial Banker', 'Industrial Power Grid', 'Economic Titan'],
    highlights: ['ISO certified', 'Exclusive patents', 'Long-term contracts'],
  },
  {
    id: '3',
    name: 'Swift Logistics Co',
    industry: EmpireIndustry.LOGISTICS,
    level: 2,
    value: 1_500_000,
    monthlyRevenue: 95_000,
    employees: 78,
    age: 18,
    profitMargin: 15,
    synergyPotential: 2,
    potentialSynergies: ['Smart Supply Chain', 'Vertical Integration'],
    highlights: ['Growing fleet', 'Multiple state coverage'],
  },
  {
    id: '4',
    name: 'MediCare Plus',
    industry: EmpireIndustry.HEALTHCARE,
    level: 3,
    value: 4_200_000,
    monthlyRevenue: 310_000,
    employees: 156,
    age: 36,
    profitMargin: 28,
    synergyPotential: 2,
    potentialSynergies: ['Health Tech Innovation', 'Healthcare Ecosystem'],
    highlights: ['High patient satisfaction', 'Expanding facilities'],
  },
  {
    id: '5',
    name: 'UrbanMart Retail',
    industry: EmpireIndustry.RETAIL,
    level: 2,
    value: 1_200_000,
    monthlyRevenue: 180_000,
    employees: 92,
    age: 12,
    profitMargin: 12,
    synergyPotential: 1,
    potentialSynergies: ['Supply Chain Master'],
    highlights: ['Prime locations', 'Strong brand recognition'],
  },
];

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function formatIndustry(industry: EmpireIndustry): string {
  return industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ============================================================================
// Acquisition Card Component
// ============================================================================

interface AcquisitionCardProps {
  target: AcquisitionTarget;
  onSelect: () => void;
  onAcquire: () => void;
}

function AcquisitionCard({ target, onSelect, onAcquire }: AcquisitionCardProps) {
  return (
    <Card 
      className={`bg-slate-800/50 border transition-all hover:shadow-xl cursor-pointer ${
        target.synergyPotential > 0 
          ? 'border-purple-500/30 hover:border-purple-500/50' 
          : 'border-slate-700 hover:border-slate-600'
      }`}
      isPressable
      onPress={onSelect}
    >
      <CardBody className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-white text-lg">{target.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Chip size="sm" variant="flat" color="primary">
                {formatIndustry(target.industry)}
              </Chip>
              <Chip size="sm" variant="flat">
                Level {target.level}
              </Chip>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-400">{formatCurrency(target.value)}</p>
            <p className="text-xs text-gray-500">Acquisition Price</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center p-2 bg-slate-900/50 rounded-lg">
            <DollarSign className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <p className="text-sm font-medium text-white">{formatCurrency(target.monthlyRevenue)}</p>
            <p className="text-xs text-gray-500">Monthly</p>
          </div>
          <div className="text-center p-2 bg-slate-900/50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-sm font-medium text-white">{target.profitMargin}%</p>
            <p className="text-xs text-gray-500">Margin</p>
          </div>
          <div className="text-center p-2 bg-slate-900/50 rounded-lg">
            <Users className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <p className="text-sm font-medium text-white">{target.employees}</p>
            <p className="text-xs text-gray-500">Staff</p>
          </div>
          <div className="text-center p-2 bg-slate-900/50 rounded-lg">
            <Clock className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="text-sm font-medium text-white">{target.age}mo</p>
            <p className="text-xs text-gray-500">Age</p>
          </div>
        </div>

        {/* Synergy Potential */}
        {target.synergyPotential > 0 && (
          <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">
                Unlocks {target.synergyPotential} New Synergy{target.synergyPotential > 1 ? 's' : ''}!
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {target.potentialSynergies.map((syn) => (
                <Chip key={syn} size="sm" variant="flat" color="secondary" className="text-xs">
                  {syn}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Highlights */}
        <div className="space-y-1 mb-4">
          {target.highlights.map((highlight, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
              <Star className="w-3 h-3 text-yellow-500" />
              <span>{highlight}</span>
            </div>
          ))}
        </div>

        {/* Action */}
        <Button
          color="primary"
          className="w-full"
          startContent={<ShoppingCart className="w-4 h-4" />}
          onPress={() => {
            onAcquire();
          }}
        >
          Acquire for {formatCurrency(target.value)}
        </Button>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Acquisition Detail Modal
// ============================================================================

interface AcquisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: AcquisitionTarget | null;
  onConfirm: () => void;
}

function AcquisitionModal({ isOpen, onClose, target, onConfirm }: AcquisitionModalProps) {
  if (!target) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent className="bg-slate-800 border border-slate-700">
        <ModalHeader className="border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <Building2 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Acquire {target.name}</h3>
              <p className="text-sm text-gray-400">{formatIndustry(target.industry)} • Level {target.level}</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="py-4">
          {/* Valuation */}
          <Card className="bg-slate-900/50 border border-slate-700 mb-4">
            <CardBody className="p-4">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">Valuation Analysis</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(target.value)}</p>
                  <p className="text-xs text-gray-500">Acquisition Price</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">{formatCurrency(target.monthlyRevenue * 12)}</p>
                  <p className="text-xs text-gray-500">Annual Revenue</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">{(target.value / (target.monthlyRevenue * 12)).toFixed(1)}x</p>
                  <p className="text-xs text-gray-500">Revenue Multiple</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Synergy Impact */}
          {target.synergyPotential > 0 && (
            <Card className="bg-purple-900/20 border border-purple-500/30 mb-4">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h4 className="font-semibold text-purple-300">Empire Synergy Impact</h4>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Acquiring this company will unlock {target.synergyPotential} new synergy{target.synergyPotential > 1 ? 's' : ''}, 
                  boosting your empire's efficiency:
                </p>
                <div className="space-y-2">
                  {target.potentialSynergies.map((syn) => (
                    <div key={syn} className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-white">{syn}</span>
                      <ChevronRight className="w-4 h-4 text-gray-500 ml-auto" />
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* ROI Projection */}
          <Card className="bg-slate-900/50 border border-slate-700">
            <CardBody className="p-4">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">Projected ROI</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-400">Payback Period</span>
                    <span className="text-sm font-medium text-white">
                      {Math.ceil(target.value / (target.monthlyRevenue * (target.profitMargin / 100)))} months
                    </span>
                  </div>
                  <Progress value={65} color="success" size="sm" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-400">Annual ROI</span>
                    <span className="text-sm font-medium text-green-400">
                      +{Math.round((target.monthlyRevenue * 12 * (target.profitMargin / 100) / target.value) * 100)}%
                    </span>
                  </div>
                  <Progress value={78} color="primary" size="sm" />
                </div>
              </div>
            </CardBody>
          </Card>
        </ModalBody>
        <ModalFooter className="border-t border-slate-700">
          <Button variant="flat" onPress={onClose}>Cancel</Button>
          <Button 
            color="primary" 
            startContent={<ShoppingCart className="w-4 h-4" />}
            onPress={onConfirm}
          >
            Confirm Acquisition ({formatCurrency(target.value)})
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AcquisitionBrowser(): React.ReactElement {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState<EmpireIndustry | 'all'>('all');
  const [sortBy, setSortBy] = useState<'value' | 'synergy' | 'roi'>('synergy');
  const [selectedTarget, setSelectedTarget] = useState<AcquisitionTarget | null>(null);
  const [targets] = useState<AcquisitionTarget[]>(MOCK_TARGETS);
  
  // Modal
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Filtered and sorted targets
  const filteredTargets = useMemo(() => {
    let result = [...targets];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(query) ||
        formatIndustry(t.industry).toLowerCase().includes(query)
      );
    }

    // Industry filter
    if (industryFilter !== 'all') {
      result = result.filter(t => t.industry === industryFilter);
    }

    // Sort
    switch (sortBy) {
      case 'synergy':
        result.sort((a, b) => b.synergyPotential - a.synergyPotential);
        break;
      case 'value':
        result.sort((a, b) => a.value - b.value);
        break;
      case 'roi':
        result.sort((a, b) => b.profitMargin - a.profitMargin);
        break;
    }

    return result;
  }, [targets, searchQuery, industryFilter, sortBy]);

  const handleSelect = (target: AcquisitionTarget) => {
    setSelectedTarget(target);
    onOpen();
  };

  const handleAcquire = () => {
    console.log('Acquire:', selectedTarget?.id);
    onClose();
  };

  // High synergy targets
  const highSynergyCount = targets.filter(t => t.synergyPotential >= 2).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Available Acquisitions</h2>
          <p className="text-sm text-gray-400">
            {filteredTargets.length} companies available • {highSynergyCount} with high synergy potential
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<Search className="w-4 h-4 text-gray-400" />}
            className="w-64"
            size="sm"
          />

          {/* Industry Filter */}
          <Select
            placeholder="Industry"
            selectedKeys={[industryFilter]}
            onChange={(e) => setIndustryFilter(e.target.value as EmpireIndustry | 'all')}
            className="w-40"
            size="sm"
          >
            {INDUSTRY_FILTERS.map((f) => (
              <SelectItem key={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </Select>

          {/* Sort */}
          <Select
            placeholder="Sort by"
            selectedKeys={[sortBy]}
            onChange={(e) => setSortBy(e.target.value as 'value' | 'synergy' | 'roi')}
            className="w-40"
            size="sm"
          >
            <SelectItem key="synergy">Synergy Potential</SelectItem>
            <SelectItem key="value">Price (Low-High)</SelectItem>
            <SelectItem key="roi">Best ROI</SelectItem>
          </Select>
        </div>
      </div>

      {/* Synergy Recommendation Banner */}
      {highSynergyCount > 0 && (
        <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/20 border border-purple-500/30">
          <CardBody className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white">Synergy Opportunities</h4>
              <p className="text-sm text-gray-400">
                {highSynergyCount} companies would unlock new synergies for your empire. 
                Look for the <Zap className="w-3 h-3 inline text-purple-400" /> badge!
              </p>
            </div>
            <Button 
              color="secondary" 
              variant="flat"
              onPress={() => setSortBy('synergy')}
            >
              Show Best Synergies
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Grid */}
      {filteredTargets.length === 0 ? (
        <Card className="bg-slate-800/30 border border-slate-700">
          <CardBody className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Companies Found</h3>
            <p className="text-gray-400">
              Try adjusting your filters or search query.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTargets.map((target) => (
            <AcquisitionCard
              key={target.id}
              target={target}
              onSelect={() => handleSelect(target)}
              onAcquire={() => {
                setSelectedTarget(target);
                onOpen();
              }}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <AcquisitionModal
        isOpen={isOpen}
        onClose={onClose}
        target={selectedTarget}
        onConfirm={handleAcquire}
      />
    </div>
  );
}

export default AcquisitionBrowser;
