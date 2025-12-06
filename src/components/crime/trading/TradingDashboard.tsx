/**
 * @fileoverview Street Trading Dashboard - Buy/Sell Drugs MMO Interface
 * @module components/crime/trading/TradingDashboard
 * 
 * OVERVIEW:
 * Main trading interface for the Dope Wars MMO system. Displays player stash,
 * current state pricing, and provides buy/sell/travel functionality.
 * 
 * @created 2025-12-04
 * @author ECHO v1.4.0 FLAWLESS PROTOCOL
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
  Progress,
  Chip,
  Divider,
  Spinner,
} from '@heroui/react';
import {
  DollarSign,
  Package,
  MapPin,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  ShoppingCart,
  Wallet,
  Plane,
  Star,
  AlertTriangle,
  Clock,
  Info,
} from 'lucide-react';
import { useTradingDashboard, calculateTradePotential } from '@/hooks/useCrimeTrading';
import { StateSelector } from './StateSelector';
import { TradeModal } from './TradeModal';
import type { StateCode, SubstanceName } from '@/lib/types/crime';
import type { TradeAction, SubstancePriceEntry } from '@/lib/types/crime-mmo';

/**
 * Substance descriptions for each drug
 */
const SUBSTANCE_DESCRIPTIONS: Record<SubstanceName, string> = {
  Cannabis: 'Dried flower with varying THC content. Most widely used illicit substance.',
  Psilocybin: 'Magic mushrooms containing psychoactive compounds. Growing market.',
  MDMA: 'Synthetic party drug popular in club scenes. Moderate risk.',
  LSD: 'Powerful hallucinogen on blotter paper. Small volume, high value.',
  Cocaine: 'Highly addictive stimulant. Premium pricing in affluent markets.',
  Methamphetamine: 'Powerful stimulant with severe health effects. Strong demand.',
  Oxycodone: 'Prescription opioid painkiller. Medical diversion common.',
  Heroin: 'Highly addictive opioid. Severe legal consequences.',
  Fentanyl: 'Extremely potent synthetic opioid. Highest risk and reward.',
};

/**
 * Price update interval in seconds (5 minutes)
 */
const PRICE_UPDATE_INTERVAL = 300;

/**
 * Get trend icon based on price trend
 */
function TrendIcon({ trend }: { trend: 'rising' | 'falling' | 'stable' }) {
  switch (trend) {
    case 'rising':
      return <TrendingUp className="h-4 w-4 text-green-400" />;
    case 'falling':
      return <TrendingDown className="h-4 w-4 text-red-400" />;
    default:
      return <Minus className="h-4 w-4 text-slate-400" />;
  }
}

/**
 * Get color class based on heat level
 */
function getHeatColor(heat: number): string {
  if (heat < 25) return 'text-green-400';
  if (heat < 50) return 'text-yellow-400';
  if (heat < 75) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function TradingDashboard() {
  // Fetch trading data
  const {
    stash,
    pricing,
    isLoading,
    error,
    trade,
    travel,
    refetch,
  } = useTradingDashboard();

  // UI State
  const [selectedSubstance, setSelectedSubstance] = useState<SubstanceName | null>(null);
  const [tradeAction, setTradeAction] = useState<TradeAction>('buy');
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [timeUntilUpdate, setTimeUntilUpdate] = useState(PRICE_UPDATE_INTERVAL);

  // Calculate time remaining based on server's lastUpdate timestamp
  useEffect(() => {
    if (!pricing?.lastUpdate) return;

    const calculateTimeRemaining = () => {
      const lastUpdate = new Date(pricing.lastUpdate).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - lastUpdate) / 1000); // seconds since last update
      const remaining = Math.max(0, PRICE_UPDATE_INTERVAL - elapsed);
      
      setTimeUntilUpdate(remaining);
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [pricing?.lastUpdate]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle trade button click
  const handleTradeClick = useCallback((substance: SubstanceName, action: TradeAction) => {
    setSelectedSubstance(substance);
    setTradeAction(action);
    setShowTradeModal(true);
  }, []);

  // Handle trade execution
  const handleExecuteTrade = useCallback(async (quantity: number) => {
    if (!selectedSubstance || !stash) return;

    try {
      const result = await trade.executeTrade({
        action: tradeAction,
        substance: selectedSubstance,
        quantity,
        state: stash.currentState,
      });

      if (result.success) {
        setShowTradeModal(false);
        await refetch();
      }
    } catch (err) {
      console.error('Trade failed:', err);
    }
  }, [selectedSubstance, tradeAction, stash, trade, refetch]);

  // Handle travel
  const handleTravel = useCallback(async (toState: StateCode) => {
    try {
      const result = await travel.travel({ toState });
      if (result.success) {
        setShowTravelModal(false);
        await refetch();
      }
    } catch (err) {
      console.error('Travel failed:', err);
    }
  }, [travel, refetch]);

  // Loading state
  if (isLoading && !stash) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" color="primary" />
        <span className="ml-4 text-slate-400">Loading trading data...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="bg-red-500/10 border border-red-500/20">
        <CardBody className="p-6">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-lg font-semibold text-red-400">Error Loading Trading Data</p>
              <p className="text-sm text-slate-400">{error.message}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  // No stash - should auto-create on next fetch, just show loading
  if (!stash) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" color="primary" />
        <span className="ml-4 text-slate-400">Initializing your stash...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Player Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Cash */}
        <Card className="bg-gradient-to-br from-green-500/10 via-green-600/5 to-transparent backdrop-blur-xl border border-green-500/20">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-500/20">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Cash</p>
                <p className="text-xl font-bold text-green-400">{formatCurrency(stash.cash)}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Location */}
        <Card className="bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent backdrop-blur-xl border border-blue-500/20">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20">
                <MapPin className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Location</p>
                <p className="text-xl font-bold text-blue-400">{stash.currentState}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Heat */}
        <Card className="bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-transparent backdrop-blur-xl border border-orange-500/20">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/20">
                <Flame className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Heat</p>
                <p className={`text-xl font-bold ${getHeatColor(stash.heat)}`}>{stash.heat}%</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Capacity */}
        <Card className="bg-gradient-to-br from-violet-500/10 via-violet-600/5 to-transparent backdrop-blur-xl border border-violet-500/20">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/20">
                <Package className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Capacity</p>
                <p className="text-xl font-bold text-violet-400">
                  {stash.inventoryUsed}/{stash.carryCapacity}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Level */}
        <Card className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent backdrop-blur-xl border border-amber-500/20">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20">
                <Star className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Level</p>
                <p className="text-xl font-bold text-amber-400">{stash.level}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Travel Button */}
      <div className="flex justify-end">
        <Button
          color="primary"
          variant="flat"
          className="text-blue-400"
          startContent={<Plane className="h-4 w-4" />}
          onPress={() => setShowTravelModal(true)}
        >
          Travel to Another State
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Panel */}
        <Card className="bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-transparent backdrop-blur-xl border border-white/10">
          <CardBody className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-violet-400" />
              Your Inventory
            </h3>
            
            {stash.inventory.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400">Your stash is empty</p>
                <p className="text-xs text-slate-500">Buy some product to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stash.inventory.map((item) => (
                  <div
                    key={item.substance}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div>
                      <p className="font-medium text-white">{item.substance}</p>
                      <p className="text-xs text-slate-400">
                        Qty: {item.quantity} • Avg: {formatCurrency(item.avgPurchasePrice)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      color="success"
                      variant="bordered"
                      className="text-green-400 border-green-500/50 px-4 py-2"
                      onPress={() => handleTradeClick(item.substance, 'sell')}
                    >
                      Sell
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Divider className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Capacity Used</span>
                <span className="text-white">{stash.inventoryUsed} / {stash.carryCapacity}</span>
              </div>
              <Progress
                value={(stash.inventoryUsed / stash.carryCapacity) * 100}
                color="secondary"
                size="sm"
              />
            </div>
          </CardBody>
        </Card>

        {/* Market Prices Panel */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-transparent backdrop-blur-xl border border-white/10">
          <CardBody className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-400" />
                Market Prices in {stash.currentState}
              </h3>
              {pricing && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-bold text-blue-400 font-mono">
                    {formatTime(timeUntilUpdate)}
                  </span>
                </div>
              )}
            </div>

            {!pricing ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="sm" color="primary" />
                <span className="ml-2 text-slate-400">Loading prices...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pricing.prices.map((priceEntry: SubstancePriceEntry) => {
                  // Check if player owns this substance
                  const owned = stash.inventory.find(i => i.substance === priceEntry.substance);
                  const buyCalc = calculateTradePotential(stash, pricing, priceEntry.substance, 'buy', 1);
                  const basePrice = priceEntry.basePrice;
                  const lastPrice = basePrice * 0.95;
                  const minPrice = basePrice * 0.7;
                  const maxPrice = basePrice * 1.5;
                  
                  return (
                    <div
                      key={priceEntry.substance}
                      className="p-4 rounded-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-2 border-white/20 hover:border-blue-500/50 transition-all duration-300 shadow-lg"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-white text-lg">{priceEntry.substance}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-black text-green-400">
                              {formatCurrency(priceEntry.currentPrice)}
                            </span>
                            <TrendIcon trend={priceEntry.trend} />
                          </div>
                        </div>
                        {owned && (
                          <Chip size="sm" className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            Own {owned.quantity}
                          </Chip>
                        )}
                      </div>

                      {/* Description */}
                      <div className="mb-3 p-2 rounded bg-blue-500/5 border border-blue-500/10">
                        <div className="flex items-start gap-1.5">
                          <Info className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {SUBSTANCE_DESCRIPTIONS[priceEntry.substance]}
                          </p>
                        </div>
                      </div>

                      <Divider className="my-3 bg-white/10" />

                      {/* Price History */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 rounded bg-slate-800/50 border border-white/5">
                          <p className="text-[10px] text-slate-400 uppercase mb-0.5">Last</p>
                          <p className="text-xs font-bold text-slate-300">{formatCurrency(lastPrice)}</p>
                        </div>
                        <div className="text-center p-2 rounded bg-slate-800/50 border border-white/5">
                          <p className="text-[10px] text-slate-400 uppercase mb-0.5">Min</p>
                          <p className="text-xs font-bold text-red-400">{formatCurrency(minPrice)}</p>
                        </div>
                        <div className="text-center p-2 rounded bg-slate-800/50 border border-white/5">
                          <p className="text-[10px] text-slate-400 uppercase mb-0.5">Max</p>
                          <p className="text-xs font-bold text-green-400">{formatCurrency(maxPrice)}</p>
                        </div>
                      </div>

                      {/* Market Stats */}
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-slate-400">Demand: <span className="text-green-400 font-bold">{priceEntry.demand}%</span></span>
                        <span className="text-slate-400">Supply: <span className="text-blue-400 font-bold">{priceEntry.supply}%</span></span>
                        <span className="text-slate-400">Vol: <span className="text-orange-400 font-bold">{priceEntry.volatility}%</span></span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          color="primary"
                          variant="bordered"
                          className="flex-1 text-white border-2 border-blue-500/50 hover:bg-blue-500/20 font-bold"
                          isDisabled={!buyCalc.canExecute}
                          onPress={() => handleTradeClick(priceEntry.substance, 'buy')}
                        >
                          Buy
                        </Button>
                        <Button
                          size="sm"
                          color="success"
                          variant="bordered"
                          className="flex-1 text-white border-2 border-green-500/50 hover:bg-green-500/20 font-bold"
                          isDisabled={!owned || owned.quantity === 0}
                          onPress={() => handleTradeClick(priceEntry.substance, 'sell')}
                        >
                          Sell
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Trade Modal */}
      {showTradeModal && selectedSubstance && pricing && (
        <TradeModal
          isOpen={showTradeModal}
          onClose={() => setShowTradeModal(false)}
          substance={selectedSubstance}
          action={tradeAction}
          stash={stash}
          pricing={pricing}
          onExecute={handleExecuteTrade}
          isLoading={trade.isLoading}
        />
      )}

      {/* Travel Modal (State Selector) */}
      {showTravelModal && (
        <StateSelector
          isOpen={showTravelModal}
          onClose={() => setShowTravelModal(false)}
          currentState={stash.currentState}
          playerCash={stash.cash}
          onSelectState={handleTravel}
          isLoading={travel.isLoading}
        />
      )}
    </div>
  );
}
