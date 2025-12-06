/**
 * @fileoverview Portfolio Page - Stock Portfolio Management
 * @module app/game/portfolio/page
 * 
 * OVERVIEW:
 * Displays user's stock portfolio with holdings, performance metrics,
 * and trading capabilities. Links from player profile.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardBody, CardHeader, Button, Spinner, Divider } from '@heroui/react';
import useSWR from 'swr';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, PieChart, ArrowLeft } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface StockHolding {
  symbol: string;
  companyName: string;
  shares: number;
  avgPurchasePrice: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export default function PortfolioPage() {
  const router = useRouter();
  const { status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch portfolio data
  const { data: portfolioData, isLoading, error } = useSWR(
    mounted && status === 'authenticated' ? '/api/market/portfolio' : null,
    fetcher
  );

  // Loading state
  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Spinner size="lg" label="Loading portfolio..." />
      </div>
    );
  }

  // Unauthenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const portfolio = portfolioData?.data;
  const holdings: StockHolding[] = portfolio?.holdings || [];
  const totalValue = portfolio?.totalValue || 0;
  const totalGainLoss = portfolio?.totalGainLoss || 0;
  const totalGainLossPercent = portfolio?.totalGainLossPercent || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-2">
            <Button
              isIconOnly
              variant="flat"
              className="bg-slate-800/50"
              onPress={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Stock Portfolio</h1>
              <p className="text-slate-400">Manage your stock investments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Value</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(totalValue)}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${totalGainLoss >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {totalGainLoss >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Gain/Loss</p>
                  <p className={`text-xl font-bold ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${totalGainLossPercent >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {totalGainLossPercent >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400">Return %</p>
                  <p className={`text-xl font-bold ${totalGainLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <PieChart className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Holdings</p>
                  <p className="text-xl font-bold text-white">{holdings.length} stocks</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Holdings List */}
        <Card className="bg-slate-800/30 border border-slate-700/50">
          <CardHeader className="border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white">Your Holdings</h2>
          </CardHeader>
          <CardBody className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" label="Loading holdings..." />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400">Failed to load portfolio</p>
                <Button
                  className="mt-4"
                  variant="flat"
                  onPress={() => router.refresh()}
                >
                  Retry
                </Button>
              </div>
            ) : holdings.length === 0 ? (
              <div className="text-center py-12">
                <PieChart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Holdings Yet</h3>
                <p className="text-slate-400 mb-4">Start investing by buying stocks on the market</p>
                <Button
                  className="bg-blue-600 text-white"
                  onPress={() => router.push('/game/market')}
                >
                  Go to Market
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {holdings.map((holding) => (
                  <div key={holding.symbol} className="p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{holding.symbol}</p>
                        <p className="text-sm text-slate-400">{holding.companyName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">{formatCurrency(holding.totalValue)}</p>
                        <p className={`text-sm ${holding.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {holding.gainLoss >= 0 ? '+' : ''}{formatCurrency(holding.gainLoss)} ({holding.gainLossPercent.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-slate-400">
                      <span>{holding.shares} shares</span>
                      <span>Avg: {formatCurrency(holding.avgPurchasePrice)}</span>
                      <span>Current: {formatCurrency(holding.currentPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-4">
          <Button
            className="bg-blue-600 text-white"
            onPress={() => router.push('/game/market')}
          >
            Trade Stocks
          </Button>
          <Button
            variant="flat"
            className="bg-slate-700/50"
            onPress={() => router.push('/game/player')}
          >
            Back to Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
