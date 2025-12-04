/**
 * @fileoverview Public Landing Page - AAA Quality
 * @module app/page
 * 
 * OVERVIEW:
 * Stunning public-facing landing page showcasing the game.
 * Premium design with animations, feature showcases, and clear CTAs.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { Button, Card, CardBody, Chip, Divider, Skeleton } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useSocket } from '@/lib/hooks/useSocket';

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [userData, setUserData] = useState<{ cash: number } | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Real-time user data via Socket.io
  const { isConnected, on, off } = useSocket({
    namespace: '/user',
    autoConnect: status === 'authenticated'
  });

  // Fetch initial user data
  useEffect(() => {
    if (status === 'authenticated') {
      setUserLoading(true);
      fetch('/api/user/me')
        .then(res => res.json())
        .then(data => {
          setUserData(data);
          setUserLoading(false);
        })
        .catch(() => setUserLoading(false));
    } else {
      setUserData(null);
      setUserLoading(false);
    }
  }, [status]);

  // Listen for real-time cash updates
  useEffect(() => {
    if (!isConnected) return;

    const handleCashUpdate = (data: { cash: number }) => {
      setUserData(prev => prev ? { ...prev, cash: data.cash } : { cash: data.cash });
    };

    on('user:cash:update', handleCashUpdate);

    return () => {
      off('user:cash:update', handleCashUpdate);
    };
  }, [isConnected, on, off]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse delay-500" />

      <div className="relative z-10">
        {/* Navigation Header */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/50 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  TheSimGov
                </h1>
                <p className="text-xs text-slate-400">Government Simulation MMO</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {status === 'loading' || userLoading ? (
                <Skeleton className="rounded-lg w-24 h-10" />
              ) : status === 'authenticated' ? (
                <>
                  <div className="hidden md:flex items-center bg-slate-800/50 px-4 py-2 rounded-xl border border-white/10">
                    <span className="text-xs text-slate-400 mr-2">Cash:</span>
                    <span className="text-sm font-bold text-emerald-400">
                      ${(userData?.cash || 0).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20"
                    onPress={() => router.push('/game')}
                  >
                    Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="light"
                    className="text-white hover:bg-white/10"
                    onPress={() => router.push('/login')}
                  >
                    Sign In
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                    onPress={() => router.push('/register')}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-violet-500/10 border border-white/20 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-medium bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Now in Open Beta
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-white via-blue-100 to-emerald-200 bg-clip-text text-transparent leading-tight">
              Build Your
              <br />
              Government Empire
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Master the art of governance in this immersive multiplayer simulation.
              Build businesses, manage industries, influence policy, and shape the nation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 px-8 h-14 text-base font-semibold"
                onPress={() => router.push('/register')}
              >
                Start Playing Now
              </Button>
              <Button
                size="lg"
                variant="bordered"
                className="border-white/20 text-white hover:bg-white/5 transition-all duration-300 px-8 h-14 text-base font-semibold"
                onPress={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Learn More
              </Button>
            </div>

            {/* Stats Bar */}
            <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                <CardBody className="flex flex-col items-center justify-center p-6 min-h-[120px]">
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                    70+
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Industries</p>
                </CardBody>
              </Card>
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                <CardBody className="flex flex-col items-center justify-center p-6 min-h-[120px]">
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                    MMO
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Players</p>
                </CardBody>
              </Card>
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                <CardBody className="flex flex-col items-center justify-center p-6 min-h-[120px]">
                  <p className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
                    Real-time
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Updates</p>
                </CardBody>
              </Card>
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                <CardBody className="flex flex-col items-center justify-center p-6 min-h-[120px]">
                  <p className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                    24/7
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Online</p>
                </CardBody>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <Chip className="bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-6" variant="bordered">
              Core Features
            </Chip>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              A complete business simulation with depth, strategy, and endless possibilities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Build Companies',
                description: 'Create and manage businesses across 70+ industries. From tech startups to manufacturing giants.',
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
                gradient: 'from-blue-500 to-blue-600',
                hoverGradient: 'from-blue-400 to-blue-500',
              },
              {
                title: 'Hire Talent',
                description: 'Recruit from a dynamic employee marketplace. 12-skill system with training and development.',
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                gradient: 'from-emerald-500 to-emerald-600',
                hoverGradient: 'from-emerald-400 to-emerald-500',
              },
              {
                title: 'Execute Contracts',
                description: 'Complete lucrative deals with 5-tier difficulty system. Match skills to maximize revenue.',
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                gradient: 'from-violet-500 to-violet-600',
                hoverGradient: 'from-violet-400 to-violet-500',
              },
              {
                title: 'Market Analysis',
                description: 'Real-time market data, industry trends, and competitive intelligence to guide strategy.',
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                gradient: 'from-amber-500 to-amber-600',
                hoverGradient: 'from-amber-400 to-amber-500',
              },
              {
                title: 'Level Up System',
                description: 'Progress through 5 company levels. Unlock new capabilities and increase earning potential.',
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                gradient: 'from-rose-500 to-rose-600',
                hoverGradient: 'from-rose-400 to-rose-500',
              },
              {
                title: 'Multiplayer',
                description: 'Compete with players worldwide. Build alliances, trade resources, dominate markets.',
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                gradient: 'from-cyan-500 to-cyan-600',
                hoverGradient: 'from-cyan-400 to-cyan-500',
              },
            ].map((feature, index) => (
              <Card
                key={feature.title}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 cursor-pointer"
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <CardBody className="p-8 gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${hoveredFeature === index ? feature.hoverGradient : feature.gradient} flex items-center justify-center transition-all duration-300 ${hoveredFeature === index ? 'scale-110 rotate-6' : ''}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <Chip className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6" variant="bordered">
              Getting Started
            </Chip>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-4">
              Your Journey Begins Here
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-1/4 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-emerald-500/50 via-blue-500/50 to-violet-500/50" />

            {[
              {
                step: '01',
                title: 'Create Account',
                description: 'Sign up and build your profile. Choose your business strategy.',
                color: 'emerald',
              },
              {
                step: '02',
                title: 'Build Empire',
                description: 'Start your first company, hire employees, and complete contracts.',
                color: 'blue',
              },
              {
                step: '03',
                title: 'Dominate Market',
                description: 'Level up, expand operations, and become a business tycoon.',
                color: 'violet',
              },
            ].map((step, index) => (
              <div key={step.step} className="relative">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                  <CardBody className="p-8 gap-6 text-center">
                    <div className={`w-20 h-20 mx-auto rounded-full ${step.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/30' :
                        step.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30' :
                          'bg-gradient-to-br from-violet-500 to-violet-600 shadow-violet-500/30'
                      } flex items-center justify-center text-3xl font-bold text-white shadow-lg`}>
                      {step.step}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-3">
                        {step.title}
                      </h3>
                      <p className="text-slate-400 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <Card className="bg-gradient-to-br from-emerald-600/20 via-blue-600/20 to-violet-600/20 backdrop-blur-xl border border-white/20 overflow-hidden">
            <CardBody className="p-12 md:p-16 text-center gap-8 relative">
              {/* Animated background elements */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />

              <div className="relative z-10 space-y-6">
                <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent">
                  Ready to Build Your Empire?
                </h2>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                  Join thousands of players building business empires.
                  Start your journey today and dominate the market.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all duration-300 px-8 h-14 text-base font-semibold"
                    onPress={() => router.push('/register')}
                  >
                    Create Account
                  </Button>
                  <Button
                    size="lg"
                    variant="bordered"
                    className="border-white/30 text-white hover:bg-white/10 transition-all duration-300 px-8 h-14 text-base font-semibold"
                    onPress={() => router.push('/login')}
                  >
                    Already Playing? Sign In
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-slate-900/50 backdrop-blur-xl mt-20">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                      Business Empire
                    </h3>
                    <p className="text-xs text-slate-400">MMO Simulation</p>
                  </div>
                </div>
                <p className="text-slate-400 max-w-md">
                  Build, manage, and dominate in the ultimate business simulation MMO.
                  Create your empire and compete with players worldwide.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-4">Game</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">How to Play</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Updates</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white mb-4">Community</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="#" className="hover:text-white transition-colors">Discord</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Forums</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                </ul>
              </div>
            </div>

            <Divider className="my-8 bg-white/10" />

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
              <p>© 2025 Business Empire MMO. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **AAA Quality**: Premium animations, gradients, and visual effects
 * 2. **Navigation**: Sticky header with branding and auth CTAs
 * 3. **Hero**: Bold headline with animated background and stats
 * 4. **Features**: 6 core features with hover animations
 * 5. **How It Works**: 3-step journey with visual progression
 * 6. **CTA**: Multiple conversion opportunities
 * 7. **Footer**: Complete footer with links and branding
 * 8. **Responsive**: Mobile-first design
 * 
 * PREVENTS:
 * - Game visibility without authentication
 * - Unclear value proposition
 * - Poor first impression
 */

