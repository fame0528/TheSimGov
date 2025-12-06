/**
 * @fileoverview Empire Dashboard Page
 * @module app/game/empire
 * 
 * OVERVIEW:
 * Main empire management page showing the player's interconnected company network.
 * Displays owned companies, active synergies, resource flows, and acquisition opportunities.
 * The "command center" for empire-level strategic decisions.
 * 
 * THE HOOK:
 * Visual representation of empire growth creates powerful feedback loop:
 * - See companies connected by synergy lines
 * - Watch bonuses stack as empire expands
 * - Identify next acquisition targets for maximum synergy
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
  Tabs,
  Tab,
  Progress,
  Divider,
  Tooltip,
} from '@heroui/react';
import {
  Building2,
  TrendingUp,
  Zap,
  Network,
  DollarSign,
  Users,
  ShoppingCart,
  Briefcase,
  Crown,
  Star,
  ArrowUpRight,
  ChevronRight,
  Target,
  Sparkles,
  BarChart3,
  Layers,
  Activity,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { EmpireWeb } from '@/components/empire/EmpireWeb';
import { SynergyPanel } from '@/components/empire/SynergyPanel';
import { EmpireStats } from '@/components/empire/EmpireStats';
import { AcquisitionBrowser } from '@/components/empire/AcquisitionBrowser';
import { ResourceFlowPanel } from '@/components/empire/ResourceFlowPanel';
import { useEmpire } from '@/lib/hooks/useEmpire';

// ============================================================================
// Types
// ============================================================================

type TabKey = 'overview' | 'synergies' | 'acquisitions' | 'resources';

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function getLevelTitle(level: number): string {
  if (level >= 10) return 'Economic Titan';
  if (level >= 8) return 'Industry Mogul';
  if (level >= 6) return 'Business Empire';
  if (level >= 4) return 'Growing Conglomerate';
  if (level >= 2) return 'Emerging Player';
  return 'Startup Founder';
}

function getLevelColor(level: number): string {
  if (level >= 10) return 'from-amber-500 to-yellow-600';
  if (level >= 8) return 'from-purple-500 to-pink-600';
  if (level >= 6) return 'from-blue-500 to-cyan-600';
  if (level >= 4) return 'from-green-500 to-emerald-600';
  return 'from-slate-500 to-slate-600';
}

// ============================================================================
// KPI Card Component
// ============================================================================

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color: string;
  onClick?: () => void;
}

function KPICard({ title, value, subtitle, icon, trend, color, onClick }: KPICardProps) {
  return (
    <Card
      isPressable={!!onClick}
      onPress={onClick}
      className={`bg-gradient-to-br ${color} backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl group`}
    >
      <CardBody className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-2xl bg-white/10 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          {trend && (
            <Chip
              size="sm"
              variant="flat"
              className={`${trend.value >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}
              startContent={<ArrowUpRight className={`w-3 h-3 ${trend.value < 0 ? 'rotate-180' : ''}`} />}
            >
              {trend.value >= 0 ? '+' : ''}{trend.value}%
            </Chip>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-white/60 uppercase tracking-wider">{title}</p>
          <p className="text-4xl font-black text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-white/50">{subtitle}</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Empire Level Card Component
// ============================================================================

interface EmpireLevelCardProps {
  level: number;
  xp: number;
  xpToNext: number;
  multiplier: number;
}

function EmpireLevelCard({ level, xp, xpToNext, multiplier }: EmpireLevelCardProps) {
  const progressPercent = (xp / xpToNext) * 100;
  const levelTitle = getLevelTitle(level);
  const levelColor = getLevelColor(level);

  return (
    <Card className={`bg-gradient-to-br ${levelColor} backdrop-blur-xl border border-white/20`}>
      <CardBody className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 rounded-2xl bg-white/20">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-sm text-white/60 uppercase tracking-wider">Empire Level</p>
            <p className="text-3xl font-black text-white">Level {level}</p>
            <p className="text-sm text-white/80">{levelTitle}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Progress to Level {level + 1}</span>
            <span className="text-white font-medium">{xp.toLocaleString()} / {xpToNext.toLocaleString()} XP</span>
          </div>
          <Progress
            value={progressPercent}
            color="default"
            size="md"
            className="h-3"
            classNames={{
              indicator: 'bg-white',
              track: 'bg-white/20',
            }}
          />
        </div>

        <Divider className="my-4 bg-white/20" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm text-white/80">Synergy Multiplier</span>
          </div>
          <Chip
            size="lg"
            variant="flat"
            className="bg-white/20 text-white font-bold"
          >
            {multiplier.toFixed(2)}x
          </Chip>
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function EmpirePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  
  // Fetch empire data
  const { 
    companies, 
    synergies,
    stats,
    isLoading, 
    error,
    refetch 
  } = useEmpire();

  // Mock data for initial development (will be replaced by API)
  // Extends EmpireDashboardStats with additional UI-specific fields
  const mockEmpire = {
    // Core EmpireDashboardStats fields
    totalCompanies: 6,
    totalValue: 12_500_000,
    totalMonthlyRevenue: 850_000,
    totalEmployees: 340,
    industriesCovered: [],
    industryCount: 4,
    activeSynergyCount: 3,
    potentialSynergyCount: 5,
    weeklyGrowth: 3.2,
    monthlyGrowth: 12.5,
    topPerformer: null,
    recentAcquisition: null,
    // Extended UI fields
    level: 4,
    xp: 2450,
    xpToNext: 5000,
    multiplier: 1.4,
  };

  // Merge stats with mock for fallback + extended fields
  const empireData = {
    ...mockEmpire,
    ...(stats || {}),
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Premium Header */}
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Network className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent">
                  Empire Command Center
                </h1>
                <p className="text-slate-400 text-sm">
                  Build your interconnected business empire
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                color="secondary"
                variant="flat"
                startContent={<Target className="w-4 h-4" />}
                onPress={() => setActiveTab('acquisitions')}
              >
                Find Acquisitions
              </Button>
              <Button
                color="primary"
                startContent={<Zap className="w-4 h-4" />}
                onPress={() => setActiveTab('synergies')}
              >
                View Synergies
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-8 py-8 space-y-8">
        {/* Empire Level + KPI Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Empire Level - Spans 2 columns on large screens */}
          <div className="lg:col-span-2">
            <EmpireLevelCard
              level={empireData.level}
              xp={empireData.xp}
              xpToNext={empireData.xpToNext}
              multiplier={empireData.multiplier}
            />
          </div>

          {/* KPI Cards */}
          <KPICard
            title="Total Empire Value"
            value={formatCurrency(empireData.totalValue)}
            subtitle="Across all companies"
            icon={<DollarSign className="w-6 h-6 text-green-400" />}
            trend={{ value: empireData.monthlyGrowth, label: 'vs last month' }}
            color="from-green-500/10 to-emerald-500/5 border-green-500/20"
          />

          <KPICard
            title="Companies"
            value={empireData.totalCompanies}
            subtitle={`${empireData.industryCount} industries`}
            icon={<Building2 className="w-6 h-6 text-blue-400" />}
            color="from-blue-500/10 to-cyan-500/5 border-blue-500/20"
            onClick={() => setActiveTab('overview')}
          />

          <KPICard
            title="Active Synergies"
            value={empireData.activeSynergyCount}
            subtitle={`+${empireData.potentialSynergyCount} potential`}
            icon={<Zap className="w-6 h-6 text-purple-400" />}
            color="from-purple-500/10 to-pink-500/5 border-purple-500/20"
            onClick={() => setActiveTab('synergies')}
          />
        </div>

        {/* Tab Navigation */}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as TabKey)}
          variant="underlined"
          color="secondary"
          classNames={{
            tabList: 'gap-6 w-full border-b border-slate-700/50 pb-0',
            cursor: 'bg-purple-500',
            tab: 'px-0 h-12',
            tabContent: 'group-data-[selected=true]:text-purple-400',
          }}
        >
          <Tab
            key="overview"
            title={
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Empire Overview</span>
              </div>
            }
          />
          <Tab
            key="synergies"
            title={
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Synergies</span>
                <Chip size="sm" variant="flat" color="secondary">
                  {empireData.activeSynergyCount}
                </Chip>
              </div>
            }
          />
          <Tab
            key="acquisitions"
            title={
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                <span>Acquisitions</span>
              </div>
            }
          />
          <Tab
            key="resources"
            title={
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>Resource Flows</span>
              </div>
            }
          />
        </Tabs>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Empire Web - 2 columns */}
              <div className="lg:col-span-2">
                <EmpireWeb />
              </div>
              
              {/* Empire Stats - 1 column */}
              <div className="space-y-6">
                <EmpireStats />
              </div>
            </div>
          )}

          {activeTab === 'synergies' && (
            <SynergyPanel />
          )}

          {activeTab === 'acquisitions' && (
            <AcquisitionBrowser />
          )}

          {activeTab === 'resources' && (
            <ResourceFlowPanel />
          )}
        </div>
      </div>
    </div>
  );
}
