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

import React, { useState, useMemo } from 'react';
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
} from '@heroui/react';
import {
  ShoppingCart,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { calculateTradePotential } from '@/hooks/useCrimeTrading';
import type { SubstanceName } from '@/lib/types/crime';
import type {
  TradeAction,
  PlayerStashDTO,
  StatePricingDTO,
} from '@/lib/types/crime-mmo';

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

  // Get price info for this substance
  const priceEntry = pricing.prices.find(p => p.substance === substance);
  const unitPrice = priceEntry?.currentPrice ?? 0;

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
      size="lg"
      classNames={{
        base: 'bg-slate-900 border border-white/10',
        header: 'border-b border-white/10',
        footer: 'border-t border-white/10',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <ShoppingCart className={`h-5 w-5 ${action === 'buy' ? 'text-blue-400' : 'text-green-400'}`} />
          <span>{action === 'buy' ? 'Buy' : 'Sell'} {substance}</span>
          <Chip
            size="sm"
            color={action === 'buy' ? 'primary' : 'success'}
            variant="flat"
            className="ml-auto"
          >
            {stash.currentState}
          </Chip>
        </ModalHeader>

        <ModalBody className="py-6">
          {/* Price Info */}
          <Card className="bg-white/5 border border-white/10">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Current Price</p>
                  <p className="text-3xl font-bold text-green-400">
                    {formatCurrency(unitPrice)}
                  </p>
                  <p className="text-xs text-slate-500">per unit</p>
                </div>
                {action === 'sell' && avgPurchasePrice > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Your Avg Cost</p>
                    <p className="text-xl font-semibold text-slate-300">
                      {formatCurrency(avgPurchasePrice)}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {isProfitable ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-green-400">
                            +{formatCurrency(unitPrice - avgPurchasePrice)}/unit
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-400" />
                          <span className="text-sm text-red-400">
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

          {/* Quantity Selector */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-400">Quantity</label>
              <span className="text-xs text-slate-500">Max: {maxQuantity}</span>
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
                className="w-24"
                classNames={{
                  input: 'text-center',
                  inputWrapper: 'bg-white/5 border border-white/10',
                }}
              />
            </div>

            {/* Quick Buttons */}
            <div className="flex gap-2">
              {[1, 5, 10, 25].map((amt) => (
                <Button
                  key={amt}
                  size="sm"
                  variant="flat"
                  color="default"
                  isDisabled={amt > maxQuantity}
                  onPress={() => setQuantity(Math.min(amt, maxQuantity))}
                >
                  {amt}
                </Button>
              ))}
              <Button
                size="sm"
                variant="flat"
                color="secondary"
                onPress={() => setQuantity(maxQuantity)}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Summary */}
          <Card className="mt-6 bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-transparent border border-white/10">
            <CardBody className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Amount</span>
                <span className={`text-xl font-bold ${action === 'buy' ? 'text-red-400' : 'text-green-400'}`}>
                  {action === 'buy' ? '-' : '+'}{formatCurrency(totalAmount)}
                </span>
              </div>

              {action === 'buy' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Your Cash</span>
                    <span className="text-slate-300">{formatCurrency(stash.cash)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">After Purchase</span>
                    <span className={stash.cash - totalAmount < 0 ? 'text-red-400' : 'text-slate-300'}>
                      {formatCurrency(stash.cash - totalAmount)}
                    </span>
                  </div>
                </>
              )}

              {action === 'sell' && profitLoss !== 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Profit/Loss</span>
                  <span className={isProfitable ? 'text-green-400' : 'text-red-400'}>
                    {isProfitable ? '+' : ''}{formatCurrency(profitLoss)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm pt-2 border-t border-white/10">
                <span className="flex items-center gap-1 text-orange-400">
                  <Flame className="h-4 w-4" />
                  Heat Increase
                </span>
                <span className="text-orange-400">+{estimatedHeatIncrease.toFixed(1)}%</span>
              </div>
            </CardBody>
          </Card>

          {/* Validation Error */}
          {!tradePotential.canExecute && tradePotential.reason && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{tradePotential.reason}</p>
            </div>
          )}

          {/* Capacity Warning for Buys */}
          {action === 'buy' && quantity > stash.inventoryAvailable && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Package className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-400">
                Not enough capacity. Available: {stash.inventoryAvailable} units
              </p>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color={action === 'buy' ? 'primary' : 'success'}
            isDisabled={!tradePotential.canExecute || isLoading}
            isLoading={isLoading}
            startContent={!isLoading && <ShoppingCart className="h-4 w-4" />}
            onPress={() => onExecute(quantity)}
          >
            {isLoading ? 'Processing...' : `${action === 'buy' ? 'Buy' : 'Sell'} ${quantity} ${substance}`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
