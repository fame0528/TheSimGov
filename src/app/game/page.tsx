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
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                Welcome back, {session?.user?.firstName || session?.user?.name || 'Player'}.
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
            onPress={() => router.push('/game/companies')}
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
            onPress={() => router.push('/game/employees')}
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
            onPress={() => router.push('/game/contracts/marketplace')}
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

        {/* Quick Actions Section */}
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
            <p className="text-sm text-slate-400">Launch your business operations</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                title: 'Create Company',
                description: 'Launch your first venture',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                ),
                color: 'blue',
                href: '/game/companies'
              },
              {
                title: 'Hire Employees',
                description: 'Build your dream team',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ),
                color: 'emerald',
                href: '/game/employees/marketplace'
              },
              {
                title: 'Browse Contracts',
                description: 'Find lucrative deals',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                color: 'violet',
                href: '/game/contracts/marketplace'
              },
              {
                title: 'Political Campaign',
                description: 'Run for office & win',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                ),
                color: 'rose',
                href: '/game/politics'
              },
              {
                title: 'Crime (Alpha)',
                description: 'Explore marketplace, routes, heat',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v4H3zM3 11h18v4H3zM3 19h18v2H3z" />
                  </svg>
                ),
                color: 'amber',
                href: '/game/crime'
              },
              {
                title: 'Market Analysis',
                description: 'Track trends & insights',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                ),
                color: 'amber',
                href: '/game/market'
              }
            ].map((action, index) => {
              const colorClasses = {
                blue: {
                  card: 'from-blue-500/5 border-blue-500/20 hover:border-blue-400/50',
                  icon: 'bg-blue-500/10 text-blue-400'
                },
                emerald: {
                  card: 'from-emerald-500/5 border-emerald-500/20 hover:border-emerald-400/50',
                  icon: 'bg-emerald-500/10 text-emerald-400'
                },
                violet: {
                  card: 'from-violet-500/5 border-violet-500/20 hover:border-violet-400/50',
                  icon: 'bg-violet-500/10 text-violet-400'
                },
                rose: {
                  card: 'from-rose-500/5 border-rose-500/20 hover:border-rose-400/50',
                  icon: 'bg-rose-500/10 text-rose-300'
                },
                amber: {
                  card: 'from-amber-500/5 border-amber-500/20 hover:border-amber-400/50',
                  icon: 'bg-amber-500/10 text-amber-400'
                }
              };
              const colors = colorClasses[action.color as keyof typeof colorClasses];
              
              return (
                <Card
                  key={index}
                  isPressable
                  onPress={() => router.push(action.href)}
                  className={`bg-gradient-to-br ${colors.card} to-transparent backdrop-blur-xl border transition-all duration-300 group`}
                >
                  <CardBody className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${colors.icon} group-hover:scale-110 transition-transform duration-300`}>
                        {action.icon}
                      </div>
                      <div>
                        <p className="font-bold text-white">{action.title}</p>
                        <p className="text-xs text-slate-400">{action.description}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Getting Started */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10">
            <CardBody className="p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Getting Started</h2>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      number: "01",
                      title: "Create Your First Company",
                      description: "Choose from 70 industries across 5 progression levels"
                    },
                    {
                      number: "02",
                      title: "Hire Skilled Employees",
                      description: "Browse marketplace for talent with our 12-skill system"
                    },
                    {
                      number: "03",
                      title: "Execute Contracts",
                      description: "Bid on contracts, assign employees, complete for revenue"
                    },
                    {
                      number: "04",
                      title: "Scale Your Empire",
                      description: "Reinvest profits, expand your team, dominate the market"
                    }
                  ].map((step, index) => (
                    <div key={index} className="flex gap-4 items-start group hover:translate-x-2 transition-all duration-300">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-bold text-white flex-shrink-0 border border-white/10">
                        {step.number}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-bold text-white">{step.title}</p>
                        <p className="text-sm text-slate-400">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* System Status */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10">
            <CardBody className="p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white">System Status</h2>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      title: "Company System",
                      description: "5 levels • 70 industries • Progression unlocks",
                      status: "active",
                      icon: "✓"
                    },
                    {
                      title: "Employee System",
                      description: "12 skills • NPC marketplace • Salary negotiation",
                      status: "active",
                      icon: "✓"
                    },
                    {
                      title: "Contract System",
                      description: "5 tiers • Skill matching • Success calculation",
                      status: "active",
                      icon: "✓"
                    },
                    {
                      title: "Advanced Features",
                      description: "Political integration • Level-based unlocks • Time simulation",
                      status: "planned",
                      icon: "⧗"
                    }
                  ].map((system, index) => (
                    <div
                      key={index}
                      className={`flex gap-4 items-start p-4 rounded-xl border transition-all duration-300 ${
                        system.status === 'active'
                          ? 'bg-green-500/10 border-green-500/20 hover:border-green-500/40'
                          : 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        system.status === 'active' ? 'bg-green-500/20' : 'bg-amber-500/20'
                      }`}>
                        <span className={`text-2xl font-bold ${
                          system.status === 'active' ? 'text-green-400' : 'text-amber-400'
                        }`}>
                          {system.icon}
                        </span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-bold text-white">{system.title}</p>
                        <p className="text-sm text-slate-400">{system.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
