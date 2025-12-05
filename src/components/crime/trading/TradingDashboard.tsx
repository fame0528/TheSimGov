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

import React, { useState, useCallback } from 'react';
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
} from 'lucide-react';
import { useTradingDashboard, calculateTradePotential } from '@/hooks/useCrimeTrading';
import { StateSelector } from './StateSelector';
import { TradeModal } from './TradeModal';
import type { StateCode, SubstanceName } from '@/lib/types/crime';
import type { TradeAction, SubstancePriceEntry } from '@/lib/types/crime-mmo';

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
          <CardBody className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-400" />
              Market Prices in {stash.currentState}
            </h3>

            {!pricing ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="sm" color="primary" />
                <span className="ml-2 text-slate-400">Loading prices...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pricing.prices.map((priceEntry: SubstancePriceEntry) => {
                  // Check if player owns this substance
                  const owned = stash.inventory.find(i => i.substance === priceEntry.substance);
                  const buyCalc = calculateTradePotential(stash, pricing, priceEntry.substance, 'buy', 1);
                  
                  return (
                    <div
                      key={priceEntry.substance}
                      className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-white">{priceEntry.substance}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-bold text-green-400">
                              {formatCurrency(priceEntry.currentPrice)}
                            </span>
                            <TrendIcon trend={priceEntry.trend} />
                          </div>
                        </div>
                        {owned && (
                          <Chip size="sm" color="secondary" variant="flat">
                            Own {owned.quantity}
                          </Chip>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                        <span>Demand: {priceEntry.demand}%</span>
                        <span>•</span>
                        <span>Supply: {priceEntry.supply}%</span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          color="primary"
                          variant="bordered"
                          className="flex-1 text-blue-400 border-blue-500/50 px-4 py-2"
                          isDisabled={!buyCalc.canExecute}
                          onPress={() => handleTradeClick(priceEntry.substance, 'buy')}
                        >
                          Buy
                        </Button>
                        <Button
                          size="sm"
                          color="success"
                          variant="bordered"
                          className="flex-1 text-green-400 border-green-500/50 px-4 py-2"
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
