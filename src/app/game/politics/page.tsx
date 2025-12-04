/**
 * @file app/game/politics/page.tsx
 * @description Comprehensive Politics Campaign Dashboard
 * @created 2025-11-26
 * @updated 2025-11-26
 * 
 * OVERVIEW:
 * Complete political campaign management interface with 12 integrated components.
 * Features state metrics, leaderboards, donation management, endorsements,
 * polling analytics, momentum visualization, campaign phase tracking,
 * opposition research, and negative ad campaigns.
 * 
 * ARCHITECTURE:
 * - HeroUI Tabs for organized navigation (7 tabs)
 * - 7 new components: StateMetricsGrid, LeaderboardDisplay, DonationManager,
 *   EndorsementsPanel, CampaignManager, PollingAnalytics, MomentumDashboard
 * - 5 existing components: PoliticalInfluencePanel, OppositionResearchPanel,
 *   NegativeAdManager, ResearchProgressTracker, ElectionResolutionPanel
 * - Responsive design for mobile/tablet/desktop
 * - Real-time data updates via SWR
 */

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Tabs, Tab, Card, CardBody, Button, Spinner } from '@heroui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { CompanyLevel } from '@/lib/types/game';
import {
  TrendingUp,
  Trophy,
  DollarSign,
  ThumbsUp,
  BarChart3,
  MapPin,
  Settings,
  Search,
  Megaphone,
  AlertTriangle,
  Users,
  Flag,
  Vote,
  FileText,
} from 'lucide-react';

// Import politics components (7 new)
import StateMetricsGrid from '@/components/politics/StateMetricsGrid';
import LeaderboardDisplay from '@/components/politics/LeaderboardDisplay';
import DonationManager from '@/components/politics/DonationManager';
import EndorsementsPanel from '@/components/politics/EndorsementsPanel';
import CampaignManager from '@/components/politics/CampaignManager';
import PollingAnalytics from '@/components/politics/PollingAnalytics';
import MomentumDashboard from '@/components/politics/MomentumDashboard';
import PoliticalInfluencePanel from '@/components/politics/PoliticalInfluencePanel';

/**
 * Tab configuration with icons
 */
const TAB_CONFIG = [
  { key: 'overview', label: 'Overview', icon: TrendingUp },
  { key: 'organizations', label: 'Organizations', icon: Users },
  { key: 'campaign', label: 'Campaign', icon: Settings },
  { key: 'polling', label: 'Polling', icon: BarChart3 },
  { key: 'momentum', label: 'Momentum', icon: MapPin },
  { key: 'endorsements', label: 'Endorsements', icon: ThumbsUp },
  { key: 'research', label: 'Research', icon: Search },
  { key: 'advertising', label: 'Advertising', icon: Megaphone },
];

/**
 * Company data from API
 */
interface CompanyData {
  id: string;
  name: string;
  cash: number;
  level: number;
}

/**
 * Fetcher function for SWR
 */
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PoliticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const playerId = session?.user?.id;
  const companyId = session?.user?.companyId;

  // Fetch real company data from API
  const { data: companyData, error: companyError, isLoading: companyLoading } = useSWR<{
    success: boolean;
    company?: CompanyData;
  }>(
    companyId ? `/api/companies/${companyId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  /**
   * Loading state
   */
  if (status === 'loading') {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Spinner size="lg" label="Loading politics dashboard..." />
      </div>
    );
  }

  // Company data is optional - some features may use it if available
  const company = companyData?.success ? companyData.company : null;
  const currentCash = company?.cash ?? 0;
  const currentLevel = (company?.level ?? 1) as CompanyLevel;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                Political Campaign
              </h1>
              <p className="text-slate-400 mt-1 text-sm">Run for office and shape the nation</p>
            </div>
            <Button
              size="sm"
              variant="light"
              onPress={() => router.push('/game')}
              className="text-slate-400 hover:text-white"
            >
              ← Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <Tabs
          aria-label="Politics dashboard tabs"
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key as string)}
          color="primary"
          variant="underlined"
          classNames={{
            tabList: 'gap-6 w-full relative rounded-none p-0 border-b border-divider bg-transparent',
            cursor: 'w-full bg-primary',
            tab: 'max-w-fit px-4 h-12',
            tabContent: 'group-data-[selected=true]:text-primary',
          }}
        >
          {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
            <Tab
              key={key}
              title={
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </div>
              }
            >
              <div className="py-6">
                {/* Overview Tab */}
                {key === 'overview' && (
                  <div className="space-y-6">
                    {/* Political Influence Summary */}
                    <PoliticalInfluencePanel companyId={companyId} level={currentLevel} />

                    {/* State Metrics Grid */}
                    <StateMetricsGrid />

                    {/* Leaderboard */}
                    <LeaderboardDisplay limit={10} showLimitSelector={true} />
                  </div>
                )}

                {/* Organizations Tab */}
                {key === 'organizations' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Political Organizations</h2>
                    <p className="text-slate-400 mb-6">
                      Join or create political organizations to amplify your influence and collaborate with other players.
                    </p>
                    
                    {/* Organization Navigation Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Lobbies */}
                      <Card 
                        isPressable
                        className="bg-gradient-to-br from-blue-900/50 to-blue-950/50 border border-blue-500/20 hover:border-blue-400/40 transition-all"
                        onPress={() => router.push('/game/politics/lobbies')}
                      >
                        <CardBody className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                              <Users className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">Lobbies</h3>
                              <p className="text-sm text-slate-400">Interest groups & advocacy</p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>

                      {/* Parties */}
                      <Card 
                        isPressable
                        className="bg-gradient-to-br from-purple-900/50 to-purple-950/50 border border-purple-500/20 hover:border-purple-400/40 transition-all"
                        onPress={() => router.push('/game/politics/parties')}
                      >
                        <CardBody className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                              <Flag className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">Parties</h3>
                              <p className="text-sm text-slate-400">Political party organizations</p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>

                      {/* Elections */}
                      <Card 
                        isPressable
                        className="bg-gradient-to-br from-amber-900/50 to-amber-950/50 border border-amber-500/20 hover:border-amber-400/40 transition-all"
                        onPress={() => router.push('/game/politics/elections/leadership')}
                      >
                        <CardBody className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                              <Vote className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">Elections</h3>
                              <p className="text-sm text-slate-400">Leadership elections</p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>

                      {/* Proposals */}
                      <Card 
                        isPressable
                        className="bg-gradient-to-br from-emerald-900/50 to-emerald-950/50 border border-emerald-500/20 hover:border-emerald-400/40 transition-all"
                        onPress={() => router.push('/game/politics/proposals')}
                      >
                        <CardBody className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">Proposals</h3>
                              <p className="text-sm text-slate-400">Submit & vote on policies</p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Campaign Tab */}
                {key === 'campaign' && playerId && (
                  <div className="space-y-6">
                    {/* Campaign Phase Manager */}
                    <CampaignManager playerId={playerId} />

                    {/* Donation Manager */}
                    <DonationManager
                      companyId={companyId}
                      currentCash={currentCash}
                      currentLevel={currentLevel}
                    />
                  </div>
                )}

                {/* Polling Tab */}
                {key === 'polling' && playerId && (
                  <div className="space-y-6">
                    {/* Polling Analytics */}
                    <PollingAnalytics playerId={playerId} />
                  </div>
                )}

                {/* Momentum Tab */}
                {key === 'momentum' && playerId && (
                  <div className="space-y-6">
                    {/* Momentum Dashboard */}
                    <MomentumDashboard playerId={playerId} />
                  </div>
                )}

                {/* Endorsements Tab */}
                {key === 'endorsements' && (
                  <div className="space-y-6">
                    {/* Endorsements Panel */}
                    <EndorsementsPanel />
                  </div>
                )}

                {/* Research Tab */}
                {key === 'research' && (
                  <div className="space-y-6">
                    {/* Note: Opposition research components require target selection */}
                    <Card className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800">
                      <CardBody>
                        <div className="flex items-center gap-3">
                          <Search className="w-6 h-6 text-info" />
                          <div>
                            <p className="font-semibold text-info-700 dark:text-info-400">Opposition Research</p>
                            <p className="text-sm text-info-600 dark:text-info-500 mt-1">
                              Select a target from the Research tab in the main game interface to initiate opposition research.
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                )}

                {/* Advertising Tab */}
                {key === 'advertising' && (
                  <div className="space-y-6">
                    {/* Note: Advertising components require campaign context */}
                    <Card className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800">
                      <CardBody>
                        <div className="flex items-center gap-3">
                          <Megaphone className="w-6 h-6 text-info" />
                          <div>
                            <p className="font-semibold text-info-700 dark:text-info-400">Advertising & Elections</p>
                            <p className="text-sm text-info-600 dark:text-info-500 mt-1">
                              Negative ads and election resolution features are available during active campaign cycles.
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                )}
              </div>
            </Tab>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
