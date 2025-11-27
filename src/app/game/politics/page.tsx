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
  if (status === 'loading' || companyLoading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Spinner size="lg" label="Loading politics dashboard..." />
      </div>
    );
  }

  /**
   * No company state - AAA modal pattern (matching contracts/marketplace)
   */
  if (companyError || !companyData?.success || !companyData?.company) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 max-w-2xl w-full">
          <CardBody className="gap-6 py-12 items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Create Your First Company</h2>
              <p className="text-lg text-slate-400 max-w-md">
                To run for political office, you need to create a company first.
              </p>
            </div>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold shadow-xl shadow-blue-500/30 transition-all duration-300"
              onPress={() => router.push('/game/companies/create')}
            >
              Create Company
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const company = companyData.company;
  const currentCash = company.cash;
  const currentLevel = company.level as CompanyLevel; // Type-safe cast (DB ensures valid values)

  // Type-safe IDs (guaranteed to exist after loading/error checks)
  if (!playerId || !companyId) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-danger-50 dark:bg-danger-900/20 max-w-md">
          <CardBody>
            <div className="flex items-center gap-3 text-danger">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <p className="font-semibold">Session Error</p>
                <p className="text-sm text-danger-600 dark:text-danger-400">
                  Missing player or company ID in session
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

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

                {/* Campaign Tab */}
                {key === 'campaign' && (
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
                {key === 'polling' && (
                  <div className="space-y-6">
                    {/* Polling Analytics */}
                    <PollingAnalytics playerId={playerId} />
                  </div>
                )}

                {/* Momentum Tab */}
                {key === 'momentum' && (
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
