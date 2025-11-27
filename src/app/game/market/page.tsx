'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card, CardBody, Chip, Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/lib/components/layouts';
import { LoadingSpinner, ErrorMessage } from '@/lib/components/shared';
import { useCompanies } from '@/lib/hooks/useCompany';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MarketPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { status } = useSession();
  
  // Prevent hydration mismatch - only render after client mount
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Check if user has companies first (only after auth ready)
  const authReady = mounted && status !== 'loading' && status === 'authenticated';
  const { 
    data: companies,
    isLoading: companiesLoading,
    error: companiesError,
    firstSuccess: companiesFirstSuccess,
    isAuthInitializing: companiesAuthInit,
    authInitAttempts: companiesAuthAttempts,
    lastStatus: companiesLastStatus
  } = useCompanies({ enabled: authReady });

  // Fetch real market statistics (only after auth ready)
  const { data: stats, isLoading } = useSWR(
    authReady ? '/api/market/stats' : null,
    fetcher,
    {
      revalidateOnMount: true,
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      fallbackData: null,
    }
  );
  
  // Use real data or show loading state
  const marketGrowth = stats?.marketGrowth || 0;
  const activeIndustries = stats?.activeIndustries || 0;
  const contractVolume = stats?.contractVolume || 0;
  const talentPool = stats?.talentPool || 0;
  const topIndustries = stats?.topIndustries || [];
  const marketInsights = stats?.insights || [];

  // Show spinner while auth not ready OR transient auth init OR initial fetch not yet successful
  if (!mounted || status === 'loading' || status !== 'authenticated' || companiesAuthInit || companiesLoading || (!companiesFirstSuccess)) {
    return (
      <DashboardLayout title="Market Analysis" subtitle="Loading...">
        <LoadingSpinner size="lg" message="Loading..." />
      </DashboardLayout>
    );
  }

  // Terminal error (after retries) – show error card
  if (companiesError && !companiesAuthInit && !companiesLoading && !companiesFirstSuccess) {
    return (
      <DashboardLayout title="Market Analysis" subtitle="Error">
        <Card className="bg-gradient-to-br from-red-500/10 to-slate-900/50 backdrop-blur-xl border border-red-500/30">
          <CardBody className="gap-4 py-10 items-center text-center">
            <h2 className="text-2xl font-bold text-red-400">Unable to load companies</h2>
            <p className="text-slate-300 max-w-md">
              {companiesError.status === 401
                ? 'Your session is still initializing. Please wait a moment or refresh.'
                : companiesError.message}
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold shadow-xl shadow-blue-500/30 transition-all duration-300"
              onPress={() => router.refresh()}
            >
              Retry
            </Button>
          </CardBody>
        </Card>
      </DashboardLayout>
    );
  }

  // Empty only after firstSuccess ensures real empty dataset
  if (companiesFirstSuccess && companies && companies.length === 0) {
    return (
      <DashboardLayout title="Market Analysis" subtitle="Get Started">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10">
          <CardBody className="gap-6 py-12 items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Create Your First Company</h2>
              <p className="text-lg text-slate-400 max-w-md">
                To access market analysis, employees, and contracts, you need to create a company first.
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
      </DashboardLayout>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                Market Analysis
              </h1>
              <p className="text-slate-400 mt-1 text-sm">Track industry trends and market insights</p>
            </div>
            <Chip 
              size="lg"
              className="bg-green-500/20 text-green-400 border border-green-500/30 font-bold"
            >
              ● Market Open
            </Chip>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 py-8 space-y-8">
        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-slate-900/50 backdrop-blur-xl border border-emerald-500/20">
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <Chip size="sm" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">+12.5%</Chip>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Market Growth</p>
                <p className="text-5xl font-black text-white">{isLoading ? '...' : `${marketGrowth.toFixed(1)}%`}</p>
                <p className="text-xs text-slate-500">This quarter</p>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-slate-900/50 backdrop-blur-xl border border-blue-500/20">
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <Chip size="sm" className="bg-blue-500/10 text-blue-400 border border-blue-500/20">70</Chip>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Active Industries</p>
                <p className="text-5xl font-black text-white">{isLoading ? '...' : activeIndustries}</p>
                <p className="text-xs text-slate-500">Across 5 levels</p>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500/10 to-slate-900/50 backdrop-blur-xl border border-violet-500/20">
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10">
                  <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <Chip size="sm" className="bg-violet-500/10 text-violet-400 border border-violet-500/20">High</Chip>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Contract Volume</p>
                <p className="text-5xl font-black text-white">{isLoading ? '...' : contractVolume.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Available now</p>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-slate-900/50 backdrop-blur-xl border border-amber-500/20">
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10">
                  <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <Chip size="sm" className="bg-amber-500/10 text-amber-400 border border-amber-500/20">+8.2%</Chip>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Talent Pool</p>
                <p className="text-5xl font-black text-white">{isLoading ? '...' : `${(talentPool / 1000).toFixed(1)}K`}</p>
                <p className="text-xs text-slate-500">Available employees</p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Top Industries */}
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white">Top Industries</h2>
            <p className="text-sm text-slate-400">Highest performing sectors this quarter</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(isLoading || topIndustries.length === 0 ? [
              { name: 'Loading...', growth: '...', color: 'slate', trend: 'up' },
            ] : topIndustries).map((industry: any, index: number) => (
              <Card
                key={index}
                isPressable
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-blue-500/50 transition-all duration-300 group"
              >
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-${industry.color}-500/10 flex items-center justify-center`}>
                        <svg className={`w-5 h-5 text-${industry.color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-white group-hover:text-blue-300 transition-colors">{industry.name}</p>
                        <p className="text-xs text-slate-400">Trending {industry.trend}</p>
                      </div>
                    </div>
                    <Chip size="sm" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      {industry.growth}
                    </Chip>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* Market Insights */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10">
          <CardBody className="p-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Market Insights</h2>
              </div>

              <div className="space-y-4">
                {(isLoading || marketInsights.length === 0 ? [
                  {
                    title: 'Loading Market Data...',
                    description: 'Fetching latest market insights',
                    type: 'Info',
                    color: 'slate'
                  }
                ] : marketInsights).map((insight: any, index: number) => (
                  <div
                    key={index}
                    className="flex gap-4 items-start p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all duration-300"
                  >
                    <Chip size="sm" className={`bg-${insight.color}-500/10 text-${insight.color}-400 border border-${insight.color}-500/20`}>
                      {insight.type}
                    </Chip>
                    <div className="flex-1 space-y-1">
                      <p className="font-bold text-white">{insight.title}</p>
                      <p className="text-sm text-slate-400">{insight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
