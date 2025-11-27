/**
 * @file useMarket.ts
 * @description Market system hook for real-time trading and market data
 * @created 2025-11-24
 */

import { useCallback, useEffect, useState } from 'react';
import { useSocket } from './useSocket';

export interface MarketOrder {
  marketType: string;
  orderType: 'buy' | 'sell';
  companyId: string;
  amount: number;
  price: number;
  timestamp: string;
}

export interface MarketData {
  marketType: string;
  data: Record<string, any>;
  timestamp: string;
}

export interface OrderEvent {
  marketType: string;
  orderType: 'buy' | 'sell';
  companyId: string;
  amount: number;
  price: number;
  timestamp: string;
}

export interface OrderCancellation {
  marketType: string;
  orderId: string;
  companyId: string;
  timestamp: string;
}

export function useMarket(marketType?: string, companyId?: string) {
  const { socket, isConnected, emit, on, off } = useSocket({ namespace: '/market' });
  const [currentMarket, setCurrentMarket] = useState<string | null>(marketType || null);
  const [currentCompany, setCurrentCompany] = useState<string | null>(companyId || null);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [orderEvents, setOrderEvents] = useState<OrderEvent[]>([]);
  const [cancellations, setCancellations] = useState<OrderCancellation[]>([]);

  // Subscribe to market when marketType or companyId changes
  useEffect(() => {
    if (isConnected && marketType && companyId) {
      // Unsubscribe from previous market if any
      if (currentMarket && currentCompany) {
        emit('unsubscribe-market', {
          marketType: currentMarket,
          companyId: currentCompany,
        });
      }

      // Subscribe to new market
      emit('subscribe-market', {
        marketType,
        companyId,
      });

      setCurrentMarket(marketType);
      setCurrentCompany(companyId);

      // Clear previous data when switching markets
      setMarketData([]);
      setOrderEvents([]);
      setCancellations([]);
    }
  }, [isConnected, marketType, companyId, currentMarket, currentCompany, emit]);

  // Set up event listeners
  useEffect(() => {
    if (!socket) return;

    const handleMarketDataUpdate = (data: MarketData) => {
      setMarketData(prev => {
        // Keep only the last 10 market data updates
        const updated = [...prev, data];
        return updated.slice(-10);
      });
    };

    const handleOrderPlaced = (data: OrderEvent) => {
      setOrderEvents(prev => {
        // Keep only the last 50 order events
        const updated = [...prev, data];
        return updated.slice(-50);
      });
    };

    const handleOrderCancelled = (data: OrderCancellation) => {
      setCancellations(prev => {
        // Keep only the last 20 cancellations
        const updated = [...prev, data];
        return updated.slice(-20);
      });
    };

    on('market-data-update', handleMarketDataUpdate);
    on('order-placed', handleOrderPlaced);
    on('order-cancelled', handleOrderCancelled);

    return () => {
      off('market-data-update', handleMarketDataUpdate);
      off('order-placed', handleOrderPlaced);
      off('order-cancelled', handleOrderCancelled);
    };
  }, [socket, on, off]);

  const placeOrder = useCallback((
    orderType: 'buy' | 'sell',
    amount: number,
    price: number
  ) => {
    if (!currentMarket || !currentCompany || !isConnected) return false;

    emit('place-order', {
      marketType: currentMarket,
      orderType,
      companyId: currentCompany,
      amount,
      price,
    });

    return true;
  }, [currentMarket, currentCompany, isConnected, emit]);

  const cancelOrder = useCallback((orderId: string) => {
    if (!currentMarket || !currentCompany || !isConnected) return false;

    emit('cancel-order', {
      marketType: currentMarket,
      orderId,
      companyId: currentCompany,
    });

    return true;
  }, [currentMarket, currentCompany, isConnected, emit]);

  const requestMarketData = useCallback(() => {
    if (!currentMarket || !isConnected) return false;

    emit('market-data-request', {
      marketType: currentMarket,
    });

    return true;
  }, [currentMarket, isConnected, emit]);

  const subscribeToMarket = useCallback((newMarketType: string, newCompanyId: string) => {
    if (!isConnected) return false;

    // Unsubscribe from current market
    if (currentMarket && currentCompany) {
      emit('unsubscribe-market', {
        marketType: currentMarket,
        companyId: currentCompany,
      });
    }

    // Subscribe to new market
    emit('subscribe-market', {
      marketType: newMarketType,
      companyId: newCompanyId,
    });

    setCurrentMarket(newMarketType);
    setCurrentCompany(newCompanyId);
    setMarketData([]);
    setOrderEvents([]);
    setCancellations([]);

    return true;
  }, [isConnected, currentMarket, currentCompany, emit]);

  const unsubscribeFromMarket = useCallback(() => {
    if (!currentMarket || !currentCompany || !isConnected) return false;

    emit('unsubscribe-market', {
      marketType: currentMarket,
      companyId: currentCompany,
    });

    setCurrentMarket(null);
    setCurrentCompany(null);
    setMarketData([]);
    setOrderEvents([]);
    setCancellations([]);

    return true;
  }, [currentMarket, currentCompany, isConnected, emit]);

  return {
    currentMarket,
    currentCompany,
    marketData,
    orderEvents,
    cancellations,
    isConnected,
    placeOrder,
    cancelOrder,
    requestMarketData,
    subscribeToMarket,
    unsubscribeFromMarket,
  };
}