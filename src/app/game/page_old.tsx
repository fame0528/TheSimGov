/**
 * @fileoverview Game Dashboard - Overview Page
 * @module app/game/page
 * 
 * OVERVIEW:
 * Main dashboard showing player's companies, employees, and contracts.
 * Entry point after authentication with quick access to all features.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { Button, Card, CardHeader, CardBody, CardFooter, Chip, Divider, Progress } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function GameDashboard() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Premium Header */}
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                Welcome back, {session?.user?.name || 'Player'}
              </h1>
              <p className="text-slate-400 mt-1 text-sm">Building empires, one decision at a time</p>
            </div>
            <Chip 
              size="lg"
              variant="shadow"
              classNames={{
                base: "bg-gradient-to-br from-green-500 to-emerald-600 border-0",
                content: "text-white font-bold"
              }}
            >
              ● Online
            </Chip>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 py-8 space-y-8">
        {/* Premium Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Companies Card */}
          <Card 
            isPressable
            className="bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent backdrop-blur-xl border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 group"
          >
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <Chip size="sm" className="bg-blue-500/10 text-blue-400 border border-blue-500/20">Level 0</Chip>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Companies</p>
                <p className="text-5xl font-black text-white">0</p>
                <p className="text-xs text-slate-500">Create your first venture →</p>
              </div>
            </CardBody>
          </Card>

          {/* Employees Card */}
          <Card 
            isPressable
            className="bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent backdrop-blur-xl border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20 group"
          >
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <Chip size="sm" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">12 Skills</Chip>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Employees</p>
                <p className="text-5xl font-black text-white">0</p>
                <p className="text-xs text-slate-500">Build your dream team →</p>
              </div>
            </CardBody>
          </Card>

          {/* Contracts Card */}
          <Card 
            isPressable
            className="bg-gradient-to-br from-violet-500/10 via-violet-600/5 to-transparent backdrop-blur-xl border border-violet-500/20 hover:border-violet-400/40 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/20 group"
          >
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <Chip size="sm" className="bg-violet-500/10 text-violet-400 border border-violet-500/20">5 Tiers</Chip>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Active Contracts</p>
                <p className="text-5xl font-black text-white">0</p>
                <p className="text-xs text-slate-500">Execute and earn →</p>
              </div>
            </CardBody>
          </Card>

          {/* Revenue Card */}
          <Card 
            isPressable
            className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent backdrop-blur-xl border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/20 group"
          >
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <Chip size="sm" className="bg-amber-500/10 text-amber-400 border border-amber-500/20">USD</Chip>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Revenue</p>
                <p className="text-5xl font-black text-white">$0</p>
                <p className="text-xs text-slate-500">Complete contracts →</p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-default-50/30 dark:bg-default-100/10 border-2 border-default-200/50 backdrop-blur-sm" shadow="lg">
          <CardBody className="gap-6 p-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-black text-foreground">Quick Actions</h2>
              <p className="text-default-400">Launch your business operations</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                size="lg"
                radius="lg"
                className="h-20 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all"
                startContent={<span className="text-2xl">🏢</span>}
                onPress={() => router.push('/game/companies/create')}
              >
                Create Company
              </Button>
              <Button
                size="lg"
                radius="lg"
                className="h-20 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all"
                startContent={<span className="text-2xl">👥</span>}
                onPress={() => router.push('/game/employees/marketplace')}
              >
                Hire Employees
              </Button>
              <Button
                size="lg"
                radius="lg"
                className="h-20 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all"
                startContent={<span className="text-2xl">📋</span>}
                onPress={() => router.push('/game/contracts/marketplace')}
              >
                Browse Contracts
              </Button>
              <Button
                size="lg"
                radius="lg"
                className="h-20 bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all"
                startContent={<span className="text-2xl">⚡</span>}
                onPress={() => router.push('/game/contracts/active')}
              >
                Active Contracts
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Getting Started Guide */}
          <Card className="bg-default-50/30 dark:bg-default-100/10 border-2 border-default-200/50 backdrop-blur-sm" shadow="lg">
            <CardBody className="gap-8 p-8">
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-foreground">Getting Started</h2>
                <p className="text-default-400">Your roadmap to success</p>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-5 items-start group hover:translate-x-1 transition-transform">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg flex-shrink-0">
                    1
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <p className="font-bold text-lg text-foreground">Create Your First Company</p>
                    <p className="text-sm text-default-400 leading-relaxed">
                      Choose from 70 industries across 5 progression levels
                    </p>
                  </div>
                </div>

                <div className="flex gap-5 items-start group hover:translate-x-1 transition-transform">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center font-black text-xl shadow-lg flex-shrink-0">
                    2
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <p className="font-bold text-lg text-foreground">Hire Skilled Employees</p>
                    <p className="text-sm text-default-400 leading-relaxed">
                      Browse the marketplace for talent with our 12-skill system
                    </p>
                  </div>
                </div>

                <div className="flex gap-5 items-start group hover:translate-x-1 transition-transform">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-lg flex-shrink-0">
                    3
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <p className="font-bold text-lg text-foreground">Execute Contracts</p>
                    <p className="text-sm text-default-400 leading-relaxed">
                      Bid on contracts, assign employees, and complete for revenue
                    </p>
                  </div>
                </div>

                <div className="flex gap-5 items-start group hover:translate-x-1 transition-transform">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-black text-xl shadow-lg flex-shrink-0">
                    4
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <p className="font-bold text-lg text-foreground">Scale Your Empire</p>
                    <p className="text-sm text-default-400 leading-relaxed">
                      Reinvest profits, expand your team, and dominate the market
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* System Status */}
          <Card className="bg-default-50/30 dark:bg-default-100/10 border-2 border-default-200/50 backdrop-blur-sm" shadow="lg">
            <CardBody className="gap-8 p-8">
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-foreground">System Status</h2>
                <p className="text-default-400">Available game systems</p>
              </div>
              
              <div className="space-y-5">
                <div className="flex gap-4 items-start p-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-400 text-xl font-bold">✓</span>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <p className="font-bold text-base text-foreground">Company System</p>
                    <p className="text-sm text-default-400">
                      5 levels • 70 industries • Progression unlocks
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start p-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-400 text-xl font-bold">✓</span>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <p className="font-bold text-base text-foreground">Employee System</p>
                    <p className="text-sm text-default-400">
                      12 skills • NPC marketplace • Salary negotiation
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start p-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-400 text-xl font-bold">✓</span>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <p className="font-bold text-base text-foreground">Contract System</p>
                    <p className="text-sm text-default-400">
                      5 tiers • Skill matching • Success calculation
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-400 text-xl font-bold">⧗</span>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <p className="font-bold text-base text-foreground">Time Progression</p>
                    <p className="text-sm text-default-400">
                      Coming soon • Deadlines • Payroll automation
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Overview First**: Show stats and quick actions immediately
 * 2. **Progressive Disclosure**: Guide new users through the flow
 * 3. **Quick Access**: Buttons to all major features
 * 4. **System Status**: Clear indication of what's available
 * 5. **Future Ready**: Stats will populate from actual data hooks
 */
