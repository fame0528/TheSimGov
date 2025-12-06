/**
 * @fileoverview Trade Modal - Buy/Sell Drug Quantity Selector
 * @module components/crime/trading/TradeModal
 * 
 * OVERVIEW:
 * Modal for executing buy/sell trades. Shows price, quantity selector,
 * total cost, and validates against player cash/inventory.
 * 
 * @created 2025-12-04
 * @author ECHO v1.4.0 FLAWLESS PROTOCOL
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Slider,
  Card,
  CardBody,
  Chip,
  Divider,
} from '@heroui/react';
import {
  ShoppingCart,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Flame,
  Clock,
  Info,
} from 'lucide-react';
import { calculateTradePotential } from '@/hooks/useCrimeTrading';
import type { SubstanceName } from '@/lib/types/crime';
import type {
  TradeAction,
  PlayerStashDTO,
  StatePricingDTO,
} from '@/lib/types/crime-mmo';

/**
 * Substance descriptions for each drug
 */
const SUBSTANCE_DESCRIPTIONS: Record<SubstanceName, string> = {
  Cannabis: 'Dried flower with varying THC content. Most widely used illicit substance. Lower risk but lower profit margins.',
  Psilocybin: 'Magic mushrooms containing psychoactive compounds. Growing market with lower legal penalties in some areas.',
  MDMA: 'Synthetic party drug popular in club scenes. Moderate risk with steady demand in urban markets.',
  LSD: 'Powerful hallucinogen distributed on blotter paper. Small volume, high value. Difficult to detect.',
  Cocaine: 'Highly addictive stimulant from coca plants. Premium pricing in affluent markets. High law enforcement focus.',
  Methamphetamine: 'Powerful stimulant with severe health effects. Strong demand but high production risks.',
  Oxycodone: 'Prescription opioid painkiller. Medical diversion common. Moderate penalties as controlled substance.',
  Heroin: 'Highly addictive opioid. Severe legal consequences but strong demand in areas with opioid crisis.',
  Fentanyl: 'Extremely potent synthetic opioid. Highest risk and highest reward. Extremely dangerous to handle.',
};

/**
 * Price update interval in seconds (prices update every 5 minutes)
 */
const PRICE_UPDATE_INTERVAL = 300; // 5 minutes

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

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  substance: SubstanceName;
  action: TradeAction;
  stash: PlayerStashDTO;
  pricing: StatePricingDTO;
  onExecute: (quantity: number) => void;
  isLoading?: boolean;
}

export function TradeModal({
  isOpen,
  onClose,
  substance,
  action,
  stash,
  pricing,
  onExecute,
  isLoading = false,
}: TradeModalProps) {
  const [quantity, setQuantity] = useState(1);
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

  // Get price info for this substance
  const priceEntry = pricing.prices.find(p => p.substance === substance);
  const unitPrice = priceEntry?.currentPrice ?? 0;
  const basePrice = priceEntry?.basePrice ?? 0;
  const lastPrice = basePrice * 0.95; // Simulate last price (5% lower than base)
  const minPrice = basePrice * 0.7; // Min: 30% below base
  const maxPrice = basePrice * 1.5; // Max: 50% above base

  // Get inventory if selling
  const inventoryItem = stash.inventory.find(i => i.substance === substance);
  const ownedQuantity = inventoryItem?.quantity ?? 0;
  const avgPurchasePrice = inventoryItem?.avgPurchasePrice ?? 0;

  // Calculate max quantity based on action
  const maxQuantity = useMemo(() => {
    if (action === 'buy') {
      // Limited by cash and capacity
      const maxByCash = Math.floor(stash.cash / unitPrice);
      const maxByCapacity = stash.inventoryAvailable;
      return Math.max(1, Math.min(maxByCash, maxByCapacity, 100));
    } else {
      // Limited by owned quantity
      return Math.max(1, ownedQuantity);
    }
  }, [action, stash, unitPrice, ownedQuantity]);

  // Calculate trade potential
  const tradePotential = useMemo(() => {
    return calculateTradePotential(stash, pricing, substance, action, quantity);
  }, [stash, pricing, substance, action, quantity]);

  // Calculate profit/loss for sells
  const profitLoss = useMemo(() => {
    if (action === 'sell' && avgPurchasePrice > 0) {
      return (unitPrice - avgPurchasePrice) * quantity;
    }
    return 0;
  }, [action, unitPrice, avgPurchasePrice, quantity]);

  const isProfitable = profitLoss > 0;
  const totalAmount = unitPrice * quantity;

  // Heat warning (transactions increase heat)
  const estimatedHeatIncrease = Math.min(quantity * 0.5, 10);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      placement="center"
      scrollBehavior="inside"
      classNames={{
        base: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/20 shadow-2xl',
        header: 'border-b border-white/10 bg-slate-800/50',
        body: 'bg-slate-900/50',
        footer: 'border-t border-white/10 bg-slate-800/50',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3 text-white">
          <ShoppingCart className={`h-6 w-6 ${action === 'buy' ? 'text-blue-400' : 'text-green-400'}`} />
          <span className="text-xl font-bold">{action === 'buy' ? 'Buy' : 'Sell'} {substance}</span>
          <Chip
            size="md"
            color={action === 'buy' ? 'primary' : 'success'}
            variant="flat"
            className="ml-auto"
          >
            {stash.currentState}
          </Chip>
        </ModalHeader>

        <ModalBody className="py-6 space-y-6">
          {/* Substance Description */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-300 mb-1">{substance}</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {SUBSTANCE_DESCRIPTIONS[substance]}
              </p>
            </div>
          </div>

          {/* Price Info */}
          <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/20 shadow-lg">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Current Price</p>
                  <p className="text-4xl font-black text-green-400">
                    {formatCurrency(unitPrice)}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">per unit</p>
                </div>
                {action === 'sell' && avgPurchasePrice > 0 && (
                  <div className="text-right flex-1 border-l border-white/10 pl-6">
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Your Avg Cost</p>
                    <p className="text-3xl font-bold text-slate-300">
                      {formatCurrency(avgPurchasePrice)}
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-2">
                      {isProfitable ? (
                        <>
                          <TrendingUp className="h-5 w-5 text-green-400" />
                          <span className="text-lg font-bold text-green-400">
                            +{formatCurrency(unitPrice - avgPurchasePrice)}/unit
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-5 w-5 text-red-400" />
                          <span className="text-lg font-bold text-red-400">
                            {formatCurrency(unitPrice - avgPurchasePrice)}/unit
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Price History & Update Timer */}
          <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/20 shadow-lg">
            <CardBody className="p-5">
              <div className="space-y-4">
                {/* Update Timer */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-white/10">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-400" />
                    <span className="text-sm font-medium text-slate-300">Next Price Update</span>
                  </div>
                  <Chip
                    size="md"
                    className="bg-blue-600/20 text-blue-400 border border-blue-500/30 font-mono font-bold"
                  >
                    {formatTime(timeUntilUpdate)}
                  </Chip>
                </div>

                <Divider className="bg-white/10" />

                {/* Price Statistics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-slate-800/30 border border-white/5">
                    <p className="text-xs text-slate-400 mb-1">Last Price</p>
                    <p className="text-sm font-bold text-slate-300">{formatCurrency(lastPrice)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-slate-800/30 border border-white/5">
                    <p className="text-xs text-slate-400 mb-1">Min (24h)</p>
                    <p className="text-sm font-bold text-red-400">{formatCurrency(minPrice)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-slate-800/30 border border-white/5">
                    <p className="text-xs text-slate-400 mb-1">Max (24h)</p>
                    <p className="text-sm font-bold text-green-400">{formatCurrency(maxPrice)}</p>
                  </div>
                </div>

                {/* Market Info */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">Demand: <span className="text-green-400 font-bold">{priceEntry?.demand ?? 50}%</span></span>
                    <span className="text-slate-400">Supply: <span className="text-blue-400 font-bold">{priceEntry?.supply ?? 50}%</span></span>
                  </div>
                  <span className="text-slate-400">Volatility: <span className="text-orange-400 font-bold">{priceEntry?.volatility ?? 30}%</span></span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Quantity Selector */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-base font-bold text-white">Quantity</label>
              <span className="text-sm text-slate-400">Max: <span className="text-white font-bold">{maxQuantity}</span></span>
            </div>

            <div className="flex gap-4 items-center">
              <Slider
                value={quantity}
                minValue={1}
                maxValue={maxQuantity}
                step={1}
                onChange={(val) => setQuantity(val as number)}
                className="flex-1"
                color={action === 'buy' ? 'primary' : 'success'}
                size="lg"
              />
              <Input
                type="number"
                value={quantity.toString()}
                onValueChange={(val) => {
                  const num = parseInt(val) || 1;
                  setQuantity(Math.min(Math.max(1, num), maxQuantity));
                }}
                min={1}
                max={maxQuantity}
                className="w-28"
                classNames={{
                  input: 'text-center text-white font-bold text-lg',
                  inputWrapper: 'bg-slate-800/80 border border-white/20 h-12',
                }}
              />
            </div>

            {/* Quick Buttons */}
            <div className="flex gap-2">
              {[1, 5, 10, 25].map((amt) => (
                <Button
                  key={amt}
                  size="md"
                  variant="flat"
                  className="flex-1 bg-slate-800/50 text-white border border-white/10 hover:bg-slate-700/50 font-bold"
                  isDisabled={amt > maxQuantity}
                  onPress={() => setQuantity(Math.min(amt, maxQuantity))}
                >
                  {amt}
                </Button>
              ))}
              <Button
                size="md"
                variant="flat"
                className="flex-1 bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 font-bold"
                onPress={() => setQuantity(maxQuantity)}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Summary */}
          <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/20 shadow-lg">
            <CardBody className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-white mb-2">Transaction Summary</h3>
              
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-white/10">
                <span className="text-slate-300 font-medium">Total Amount</span>
                <span className={`text-2xl font-black ${action === 'buy' ? 'text-red-400' : 'text-green-400'}`}>
                  {action === 'buy' ? '-' : '+'}{formatCurrency(totalAmount)}
                </span>
              </div>

              {action === 'buy' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Your Cash</span>
                    <span className="text-white font-bold text-lg">{formatCurrency(stash.cash)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">After Purchase</span>
                    <span className={`font-bold text-lg ${stash.cash - totalAmount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatCurrency(stash.cash - totalAmount)}
                    </span>
                  </div>
                </>
              )}

              {action === 'sell' && profitLoss !== 0 && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20">
                  <span className="text-white font-medium">Profit/Loss</span>
                  <span className={`text-xl font-black ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                    {isProfitable ? '+' : ''}{formatCurrency(profitLoss)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <span className="flex items-center gap-2 text-orange-300 font-medium">
                  <Flame className="h-5 w-5" />
                  Heat Increase
                </span>
                <span className="text-orange-400 font-bold text-lg">+{estimatedHeatIncrease.toFixed(1)}%</span>
              </div>
            </CardBody>
          </Card>

          {/* Validation Error */}
          {!tradePotential.canExecute && tradePotential.reason && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-400 mb-1">Cannot Execute Trade</p>
                <p className="text-sm text-red-300">{tradePotential.reason}</p>
              </div>
            </div>
          )}

          {/* Capacity Warning for Buys */}
          {action === 'buy' && quantity > stash.inventoryAvailable && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Package className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-400 mb-1">Inventory Warning</p>
                <p className="text-sm text-amber-300">
                  Not enough capacity. Available: {stash.inventoryAvailable} units
                </p>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter className="gap-3">
          <Button 
            variant="flat" 
            onPress={onClose}
            className="bg-slate-700/50 text-white hover:bg-slate-700 font-bold"
            size="lg"
          >
            Cancel
          </Button>
          <Button
            color={action === 'buy' ? 'primary' : 'success'}
            isDisabled={!tradePotential.canExecute || isLoading}
            isLoading={isLoading}
            startContent={!isLoading && <ShoppingCart className="h-5 w-5" />}
            onPress={() => onExecute(quantity)}
            className="font-bold text-white"
            size="lg"
          >
            {isLoading ? 'Processing...' : `${action === 'buy' ? 'Buy' : 'Sell'} ${quantity} ${substance}`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
