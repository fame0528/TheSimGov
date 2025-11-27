/**
 * @file MarketPanel.tsx
 * @description Real-time market trading panel for buying and selling
 * @created 2025-11-24
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Badge } from '@heroui/badge';
import { Tabs, Tab } from '@heroui/tabs';
import { useMarket } from '@/lib/hooks/useMarket';
import { useSession } from '@/lib/hooks/useAuth';
import { formatCurrency, formatTimestamp } from '@/lib/utils/formatting';

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

interface MarketPanelProps {
  marketType?: string;
  height?: string;
  className?: string;
}

export function MarketPanel({ marketType = 'stocks', height = '600px', className }: MarketPanelProps) {
  const { data: user } = useSession();
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState<number>(100);
  const [price, setPrice] = useState<number>(50);

  const {
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
  } = useMarket(marketType, user?.id);

  // Request market data on mount
  useEffect(() => {
    if (isConnected && user?.id) {
      requestMarketData();
    }
  }, [isConnected, user?.id, requestMarketData]);

  const handlePlaceOrder = () => {
    if (!amount || !price || amount <= 0 || price <= 0) return;

    const success = placeOrder(orderType, amount, price);
    if (success) {
      // Reset form
      setAmount(100);
      setPrice(50);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    cancelOrder(orderId);
  };

  // Mock order book data - in real implementation, this would come from marketData
  const orderBook = {
    bids: [
      { price: 49.50, amount: 500, total: 24750 },
      { price: 49.25, amount: 300, total: 14775 },
      { price: 49.00, amount: 800, total: 39200 },
      { price: 48.75, amount: 200, total: 9750 },
      { price: 48.50, amount: 600, total: 29100 },
    ],
    asks: [
      { price: 50.50, amount: 400, total: 20200 },
      { price: 50.75, amount: 300, total: 15225 },
      { price: 51.00, amount: 700, total: 35700 },
      { price: 51.25, amount: 500, total: 25625 },
      { price: 51.50, amount: 200, total: 10300 },
    ]
  };

  return (
    <Card className={`w-full ${className}`} style={{ height }}>
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Market Trading</h3>
          <Badge
            color={isConnected ? 'success' : 'danger'}
            variant="flat"
            size="sm"
          >
            {isConnected ? 'Live' : 'Offline'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Market: {currentMarket}</span>
          <Button
            size="sm"
            variant="flat"
            onClick={requestMarketData}
            disabled={!isConnected}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardBody className="p-0">
        <Tabs aria-label="Market tabs" className="w-full">
          <Tab key="orderbook" title="Order Book">
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Bids (Buy Orders) */}
                <div>
                  <h4 className="font-semibold text-green-600 mb-3">Bids (Buy)</h4>
                  <Table aria-label="Buy orders" className="text-sm">
                    <TableHeader>
                      <TableColumn>Price</TableColumn>
                      <TableColumn>Amount</TableColumn>
                      <TableColumn>Total</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {orderBook.bids.map((bid, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-green-600 font-medium">
                            {formatCurrency(bid.price)}
                          </TableCell>
                          <TableCell>{bid.amount.toLocaleString()}</TableCell>
                          <TableCell>{formatCurrency(bid.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Asks (Sell Orders) */}
                <div>
                  <h4 className="font-semibold text-red-600 mb-3">Asks (Sell)</h4>
                  <Table aria-label="Sell orders" className="text-sm">
                    <TableHeader>
                      <TableColumn>Price</TableColumn>
                      <TableColumn>Amount</TableColumn>
                      <TableColumn>Total</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {orderBook.asks.map((ask, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-red-600 font-medium">
                            {formatCurrency(ask.price)}
                          </TableCell>
                          <TableCell>{ask.amount.toLocaleString()}</TableCell>
                          <TableCell>{formatCurrency(ask.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </Tab>

          <Tab key="trade" title="Place Order">
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Order Type"
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as 'buy' | 'sell')}
                >
                  <SelectItem key="buy">Buy</SelectItem>
                  <SelectItem key="sell">Sell</SelectItem>
                </Select>

                <Input
                  type="number"
                  label="Amount"
                  value={amount.toString()}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="1"
                  placeholder="100"
                />
              </div>

              <Input
                type="number"
                label="Price per Unit"
                value={price.toString()}
                onChange={(e) => setPrice(Number(e.target.value))}
                min="0.01"
                step="0.01"
                placeholder="50.00"
              />

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Total Value:</span>
                  <span className="font-semibold">{formatCurrency(amount * price)}</span>
                </div>
              </div>

              <Button
                onClick={handlePlaceOrder}
                disabled={!amount || !price || amount <= 0 || price <= 0 || !isConnected}
                color={orderType === 'buy' ? 'success' : 'danger'}
                className="w-full"
              >
                {orderType === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
              </Button>
            </div>
          </Tab>

          <Tab key="activity" title="Recent Activity">
            <div className="p-4 space-y-4">
              <div>
                <h4 className="font-semibold mb-3">Order Events</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {orderEvents.slice(-10).map((event, index) => (
                    <div key={index} className="flex justify-between items-center text-sm border-b pb-2">
                      <div>
                        <span className={`font-medium ${event.orderType === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                          {event.orderType.toUpperCase()}
                        </span>
                        <span className="ml-2">
                          {event.amount.toLocaleString()} @ {formatCurrency(event.price)}
                        </span>
                      </div>
                      <span className="text-gray-500">{formatTimestamp(event.timestamp)}</span>
                    </div>
                  ))}
                  {orderEvents.length === 0 && (
                    <div className="text-center text-gray-500 py-4">No recent order activity</div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Cancellations</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {cancellations.slice(-5).map((cancel, index) => (
                    <div key={index} className="flex justify-between items-center text-sm text-gray-600 border-b pb-2">
                      <span>Order cancelled</span>
                      <span>{formatTimestamp(cancel.timestamp)}</span>
                    </div>
                  ))}
                  {cancellations.length === 0 && (
                    <div className="text-center text-gray-500 py-4">No recent cancellations</div>
                  )}
                </div>
              </div>
            </div>
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
}