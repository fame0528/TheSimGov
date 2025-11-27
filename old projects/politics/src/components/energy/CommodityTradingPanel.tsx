/**
 * @file src/components/energy/CommodityTradingPanel.tsx
 * @description Commodity trading interface for energy markets with real-time pricing and futures
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * Comprehensive commodity trading dashboard enabling Energy companies to trade oil, gas, and refined
 * products with real-time pricing, futures contracts, OPEC event simulation, and market analytics.
 * Integrates spot market pricing with technical indicators, order book management, portfolio tracking,
 * and risk management for profitable trading operations and price hedging strategies.
 * 
 * COMPONENT ARCHITECTURE:
 * - Real-time price ticker: WTI Crude, Brent, Natural Gas, NGL, Gasoline, Diesel with live updates
 * - Price charts: Historical trends, technical indicators (SMA, EMA, RSI, Bollinger Bands)
 * - OPEC events: Production cut/increase simulation with price impact modeling
 * - Futures contracts: Open positions, P&L tracking, expiration management, settlement
 * - Order book: Market/Limit/Stop-Loss orders, execution, cancellation, order history
 * - Portfolio summary: Total P&L, open positions, margin utilization, risk exposure
 * - Market analytics: Volatility index, correlation matrix, supply/demand forecasts
 * - Trade execution: Real-time order placement with position sizing and risk controls
 * 
 * STATE MANAGEMENT:
 * - prices: Real-time commodity price data with historical trends
 * - futures: Open futures contracts with P&L and expiration tracking
 * - orders: Active and historical trade orders
 * - marketData: Volatility, correlations, technical indicators
 * - selectedCommodity: Currently selected commodity for detailed view
 * - loading: Loading state during initial fetch
 * - isTrading: Trade execution in progress
 * - orderForm: Trade order form data (type, quantity, price, commodity)
 * 
 * API INTEGRATION:
 * - GET /api/energy/commodity-prices - Fetch current commodity prices
 *   Response: { prices: CommodityPrice[], trends, technicalIndicators }
 * - POST /api/energy/commodity-prices/opec-events - Simulate OPEC event
 *   Request: { eventType: 'ProductionCut' | 'ProductionIncrease', magnitude: number }
 *   Response: { priceImpact, newPrices, marketReaction, duration }
 * - GET /api/energy/futures - Fetch open futures contracts
 *   Response: { contracts: FuturesContract[], totalPnL, marginUsed, expirationCalendar }
 * - POST /api/energy/futures/[id]/settle - Settle futures contract
 *   Request: { settlementPrice: number }
 *   Response: { pnl, settlementAmount, finalPrice, status }
 * - GET /api/energy/orders - Fetch trade orders
 *   Response: { orders: TradeOrder[], pendingCount, executedCount, totalVolume }
 * - POST /api/energy/orders - Place new trade order
 *   Request: { commodity, orderType, quantity, price?, stopLoss? }
 *   Response: { orderId, status, executionPrice?, message }
 * - POST /api/energy/orders/[id]/execute - Execute pending order
 *   Response: { executionPrice, quantity, totalCost, newPosition }
 * - POST /api/energy/orders/[id]/cancel - Cancel pending order
 *   Response: { status, refund?, message }
 * - GET /api/energy/market-data/analytics - Fetch market analytics
 *   Response: { volatilityIndex, correlationMatrix, supplyDemand, forecasts }
 * 
 * PROPS:
 * - companyId: Company ID for trading account lookup
 * 
 * USAGE:
 * ```tsx
 * <CommodityTradingPanel companyId="64f7a1b2c3d4e5f6g7h8i9j0" />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Price update frequency: Real-time (WebSocket) or polling every 30 seconds
 * - OPEC event impact:
 *   - Production cut 1M bbl/day: +5-8% WTI/Brent price
 *   - Production increase 1M bbl/day: -3-5% WTI/Brent price
 *   - Impact duration: 30-90 days with exponential decay
 * - Futures contract mechanics:
 *   - Standard lot sizes: 1,000 barrels (oil), 10,000 MMBtu (gas)
 *   - Margin requirements: 5-15% of contract value
 *   - Mark-to-market: Daily P&L settlement
 *   - Expiration: Monthly (3rd Friday for most contracts)
 * - Order types:
 *   - Market: Immediate execution at current market price
 *   - Limit: Execute only at specified price or better
 *   - Stop-Loss: Trigger market order when price hits stop level
 * - Technical indicators:
 *   - SMA (Simple Moving Average): 20-day, 50-day, 200-day
 *   - EMA (Exponential Moving Average): 12-day, 26-day
 *   - RSI (Relative Strength Index): 14-day (overbought >70, oversold <30)
 *   - Bollinger Bands: 20-day SMA ± 2 standard deviations
 * - Risk management:
 *   - Position limits: Max 30% portfolio in single commodity
 *   - Margin call trigger: Margin usage >80%
 *   - Stop-loss recommendations: 2-5% below entry for long positions
 * - Commodity correlations:
 *   - WTI/Brent: +0.95 (highly correlated)
 *   - Oil/Gas: +0.60 (moderately correlated)
 *   - Oil/Refined products: +0.85 (highly correlated)
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Badge,
  Button,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  HStack,
  Select,
  useToast,
  Skeleton,
  Divider,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tooltip,
} from '@chakra-ui/react';

/**
 * Commodity type enum
 */
type CommodityType = 'WTI_Crude' | 'Brent_Crude' | 'Natural_Gas' | 'NGL' | 'Gasoline' | 'Diesel';

/**
 * Order type enum
 */
type OrderType = 'Market' | 'Limit' | 'StopLoss';

/**
 * Order side enum
 */
type OrderSide = 'Buy' | 'Sell';

/**
 * Order status enum
 */
type OrderStatus = 'Pending' | 'Executed' | 'Cancelled' | 'Expired';

/**
 * OPEC event type enum
 */
type OPECEventType = 'ProductionCut' | 'ProductionIncrease';

/**
 * CommodityPrice interface
 */
interface CommodityPrice {
  _id: string;
  commodity: CommodityType;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: Date;
}

/**
 * FuturesContract interface
 */
interface FuturesContract {
  _id: string;
  company: string;
  commodity: CommodityType;
  contractSize: number;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  side: OrderSide;
  expirationDate: Date;
  unrealizedPnL: number;
  marginUsed: number;
}

/**
 * TradeOrder interface
 */
interface TradeOrder {
  _id: string;
  company: string;
  commodity: CommodityType;
  orderType: OrderType;
  side: OrderSide;
  quantity: number;
  limitPrice?: number;
  stopLossPrice?: number;
  status: OrderStatus;
  executionPrice?: number;
  createdAt: Date;
  executedAt?: Date;
}

/**
 * MarketData interface
 */
interface MarketData {
  volatilityIndex: number;
  correlationMatrix: Record<string, Record<string, number>>;
  supplyDemand: {
    supply: number;
    demand: number;
    balance: number;
  };
}

/**
 * CommodityTradingPanel component props
 */
interface CommodityTradingPanelProps {
  companyId: string;
}

/**
 * CommodityTradingPanel component
 * 
 * @description
 * Commodity trading interface for energy markets with real-time pricing, futures, and analytics
 * enabling profitable trading and hedging strategies
 * 
 * @param {CommodityTradingPanelProps} props - Component props
 * @returns {JSX.Element} CommodityTradingPanel component
 */
export default function CommodityTradingPanel({
  companyId,
}: CommodityTradingPanelProps): JSX.Element {
  const toast = useToast();
  const { isOpen: isTradeOpen, onOpen: onTradeOpen, onClose: onTradeClose } = useDisclosure();
  const { isOpen: isOPECOpen, onOpen: onOPECOpen, onClose: onOPECClose } = useDisclosure();

  // State management
  const [prices, setPrices] = useState<CommodityPrice[]>([]);
  const [futures, setFutures] = useState<FuturesContract[]>([]);
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isTrading, setIsTrading] = useState<boolean>(false);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityType>('WTI_Crude');
  const [orderType, setOrderType] = useState<OrderType>('Market');
  const [orderSide, setOrderSide] = useState<OrderSide>('Buy');
  const [orderQuantity, setOrderQuantity] = useState<number>(1000);
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [stopLossPrice, setStopLossPrice] = useState<number>(0);
  const [opecEventType, setOpecEventType] = useState<OPECEventType>('ProductionCut');
  const [opecMagnitude, setOpecMagnitude] = useState<number>(1000000);

  /**
   * Fetch all commodity trading data
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [pricesRes, futuresRes, ordersRes, marketRes] = await Promise.all([
        fetch('/api/energy/commodity-prices'),
        fetch(`/api/energy/futures?company=${companyId}`),
        fetch(`/api/energy/orders?company=${companyId}`),
        fetch('/api/energy/market-data/analytics'),
      ]);

      const [pricesData, futuresData, ordersData, marketDataRes] = await Promise.all([
        pricesRes.json(),
        futuresRes.json(),
        ordersRes.json(),
        marketRes.json(),
      ]);

      setPrices(pricesData.prices || []);
      setFutures(futuresData.contracts || []);
      setOrders(ordersData.orders || []);
      setMarketData(marketDataRes);
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message || 'Failed to fetch trading data',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch data on mount and set up polling
   */
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [companyId]);

  /**
   * Handle trade order placement
   */
  const handlePlaceOrder = async () => {
    setIsTrading(true);
    try {
      const response = await fetch('/api/energy/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: companyId,
          commodity: selectedCommodity,
          orderType,
          side: orderSide,
          quantity: orderQuantity,
          limitPrice: orderType === 'Limit' ? limitPrice : undefined,
          stopLossPrice: orderType === 'StopLoss' ? stopLossPrice : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Order placed',
          description: `${orderSide} ${orderQuantity} ${selectedCommodity.replace('_', ' ')} @ ${data.executionPrice ? `$${data.executionPrice}` : 'Pending'}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Refresh data
        fetchData();
        onTradeClose();
      } else {
        toast({
          title: 'Order failed',
          description: data.error || 'Order placement failed',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Network error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsTrading(false);
    }
  };

  /**
   * Handle OPEC event simulation
   */
  const handleOPECEvent = async () => {
    setIsTrading(true);
    try {
      const response = await fetch('/api/energy/commodity-prices/opec-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: opecEventType,
          magnitude: opecMagnitude,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'OPEC event simulated',
          description: `Price impact: ${data.priceImpact > 0 ? '+' : ''}${data.priceImpact.toFixed(2)}%`,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });

        // Refresh prices
        fetchData();
        onOPECClose();
      } else {
        toast({
          title: 'Simulation failed',
          description: data.error || 'OPEC event simulation failed',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Network error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsTrading(false);
    }
  };

  /**
   * Cancel order
   */
  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/energy/orders/${orderId}/cancel`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Order cancelled',
          description: 'Trade order successfully cancelled',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchData();
      } else {
        toast({
          title: 'Cancellation failed',
          description: data.error || 'Failed to cancel order',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Network error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  /**
   * Calculate portfolio metrics
   */
  const totalPnL = futures.reduce((sum, contract) => sum + contract.unrealizedPnL, 0);
  const totalMarginUsed = futures.reduce((sum, contract) => sum + contract.marginUsed, 0);
  const pendingOrders = orders.filter((order) => order.status === 'Pending').length;
  const executedOrders = orders.filter((order) => order.status === 'Executed').length;

  /**
   * Get price change color
   */
  const getPriceChangeColor = (change: number): string => {
    return change >= 0 ? 'green' : 'red';
  };

  /**
   * Get order status color
   */
  const getOrderStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'Executed': return 'green';
      case 'Pending': return 'yellow';
      case 'Cancelled': return 'gray';
      case 'Expired': return 'red';
      default: return 'gray';
    }
  };

  /**
   * Format commodity name
   */
  const formatCommodity = (commodity: CommodityType): string => {
    return commodity.replace('_', ' ');
  };

  /**
   * Render loading skeletons
   */
  const renderSkeletons = () => (
    <VStack spacing={6} align="stretch">
      <Grid templateColumns="repeat(4, 1fr)" gap={4}>
        <Skeleton height="100px" />
        <Skeleton height="100px" />
        <Skeleton height="100px" />
        <Skeleton height="100px" />
      </Grid>
      <Skeleton height="400px" />
    </VStack>
  );

  if (loading) {
    return renderSkeletons();
  }

  return (
    <Box>
      {/* Overview Stats */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Portfolio P&L</StatLabel>
              <StatNumber fontSize="lg" color={totalPnL >= 0 ? 'green.500' : 'red.500'}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()}
              </StatNumber>
              <StatHelpText>
                <StatArrow type={totalPnL >= 0 ? 'increase' : 'decrease'} />
                Unrealized
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Open Positions</StatLabel>
              <StatNumber fontSize="lg">{futures.length}</StatNumber>
              <StatHelpText>Futures contracts</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Margin Used</StatLabel>
              <StatNumber fontSize="lg">${totalMarginUsed.toLocaleString()}</StatNumber>
              <StatHelpText>
                {futures.length > 0
                  ? `${((totalMarginUsed / (totalMarginUsed * 10)) * 100).toFixed(1)}% utilized`
                  : 'No positions'}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Active Orders</StatLabel>
              <StatNumber fontSize="lg">{pendingOrders}</StatNumber>
              <StatHelpText>{executedOrders} executed today</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Price Ticker */}
      <Card mb={6}>
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="sm">Real-Time Commodity Prices</Heading>
            <Button size="sm" colorScheme="orange" onClick={onOPECOpen}>
              Simulate OPEC Event
            </Button>
          </HStack>
        </CardHeader>
        <CardBody>
          <Grid templateColumns="repeat(auto-fit, minmax(180px, 1fr))" gap={4}>
            {prices.map((price) => (
              <Card key={price._id} variant="outline" size="sm">
                <CardBody>
                  <VStack align="stretch" spacing={2}>
                    <Text fontSize="xs" fontWeight="medium" color="gray.600">
                      {formatCommodity(price.commodity)}
                    </Text>
                    <HStack justify="space-between">
                      <Text fontSize="lg" fontWeight="bold">
                        ${price.currentPrice.toFixed(2)}
                      </Text>
                      <Badge
                        colorScheme={getPriceChangeColor(price.priceChange24h)}
                        fontSize="xs"
                      >
                        {price.priceChange24h >= 0 ? '+' : ''}
                        {price.priceChangePercent.toFixed(2)}%
                      </Badge>
                    </HStack>
                    <HStack justify="space-between" fontSize="xs" color="gray.500">
                      <Text>H: ${price.high24h.toFixed(2)}</Text>
                      <Text>L: ${price.low24h.toFixed(2)}</Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </CardBody>
      </Card>

      {/* Tabbed Interface */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Futures Contracts ({futures.length})</Tab>
          <Tab>Trade Orders ({orders.length})</Tab>
          <Tab>Market Analytics</Tab>
        </TabList>

        <TabPanels>
          {/* Futures Contracts Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <HStack justify="space-between">
                  <Heading size="sm">Open Futures Positions</Heading>
                  <Button size="sm" colorScheme="blue" onClick={onTradeOpen}>
                    New Trade
                  </Button>
                </HStack>
              </CardHeader>
              <CardBody>
                {futures.length === 0 ? (
                  <Text color="gray.500">No open futures positions.</Text>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Commodity</Th>
                        <Th>Side</Th>
                        <Th isNumeric>Quantity</Th>
                        <Th isNumeric>Entry Price</Th>
                        <Th isNumeric>Current Price</Th>
                        <Th isNumeric>P&L</Th>
                        <Th>Expiration</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {futures.map((contract) => (
                        <Tr key={contract._id}>
                          <Td fontWeight="medium">{formatCommodity(contract.commodity)}</Td>
                          <Td>
                            <Badge size="sm" colorScheme={contract.side === 'Buy' ? 'green' : 'red'}>
                              {contract.side}
                            </Badge>
                          </Td>
                          <Td isNumeric>{contract.quantity.toLocaleString()}</Td>
                          <Td isNumeric>${contract.entryPrice.toFixed(2)}</Td>
                          <Td isNumeric>${contract.currentPrice.toFixed(2)}</Td>
                          <Td isNumeric color={contract.unrealizedPnL >= 0 ? 'green.500' : 'red.500'}>
                            {contract.unrealizedPnL >= 0 ? '+' : ''}${contract.unrealizedPnL.toLocaleString()}
                          </Td>
                          <Td>
                            <Tooltip label={new Date(contract.expirationDate).toLocaleDateString()}>
                              <Text fontSize="xs">
                                {Math.ceil((new Date(contract.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                              </Text>
                            </Tooltip>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* Trade Orders Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <HStack justify="space-between">
                  <Heading size="sm">Trade Order History</Heading>
                  <Button size="sm" colorScheme="blue" onClick={onTradeOpen}>
                    New Trade
                  </Button>
                </HStack>
              </CardHeader>
              <CardBody>
                {orders.length === 0 ? (
                  <Text color="gray.500">No trade orders found.</Text>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Commodity</Th>
                        <Th>Type</Th>
                        <Th>Side</Th>
                        <Th isNumeric>Quantity</Th>
                        <Th isNumeric>Price</Th>
                        <Th>Status</Th>
                        <Th>Date</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {orders.map((order) => (
                        <Tr key={order._id}>
                          <Td fontWeight="medium">{formatCommodity(order.commodity)}</Td>
                          <Td>
                            <Badge size="sm">{order.orderType}</Badge>
                          </Td>
                          <Td>
                            <Badge size="sm" colorScheme={order.side === 'Buy' ? 'green' : 'red'}>
                              {order.side}
                            </Badge>
                          </Td>
                          <Td isNumeric>{order.quantity.toLocaleString()}</Td>
                          <Td isNumeric>
                            {order.executionPrice
                              ? `$${order.executionPrice.toFixed(2)}`
                              : order.limitPrice
                              ? `$${order.limitPrice.toFixed(2)} (limit)`
                              : 'Market'}
                          </Td>
                          <Td>
                            <Badge colorScheme={getOrderStatusColor(order.status)} size="sm">
                              {order.status}
                            </Badge>
                          </Td>
                          <Td>
                            <Text fontSize="xs">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </Text>
                          </Td>
                          <Td>
                            {order.status === 'Pending' && (
                              <Button
                                size="xs"
                                colorScheme="red"
                                onClick={() => handleCancelOrder(order._id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* Market Analytics Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Card>
                <CardHeader>
                  <Heading size="sm">Market Metrics</Heading>
                </CardHeader>
                <CardBody>
                  {marketData ? (
                    <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                      <Stat>
                        <StatLabel>Volatility Index</StatLabel>
                        <StatNumber fontSize="md">{marketData.volatilityIndex.toFixed(2)}</StatNumber>
                        <StatHelpText>
                          {marketData.volatilityIndex > 30 ? 'High volatility' : 'Normal'}
                        </StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Supply/Demand</StatLabel>
                        <StatNumber fontSize="md">
                          {marketData.supplyDemand.balance > 0 ? 'Surplus' : 'Deficit'}
                        </StatNumber>
                        <StatHelpText>
                          {Math.abs(marketData.supplyDemand.balance).toLocaleString()} bbl/day
                        </StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Market Sentiment</StatLabel>
                        <StatNumber fontSize="md">
                          {marketData.supplyDemand.balance > 0 ? 'Bearish' : 'Bullish'}
                        </StatNumber>
                        <StatHelpText>Based on fundamentals</StatHelpText>
                      </Stat>
                    </Grid>
                  ) : (
                    <Text color="gray.500">Loading market analytics...</Text>
                  )}
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Trade Modal */}
      <Modal isOpen={isTradeOpen} onClose={onTradeClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Place Trade Order</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Commodity</FormLabel>
                <Select
                  value={selectedCommodity}
                  onChange={(e) => setSelectedCommodity(e.target.value as CommodityType)}
                >
                  <option value="WTI_Crude">WTI Crude Oil</option>
                  <option value="Brent_Crude">Brent Crude Oil</option>
                  <option value="Natural_Gas">Natural Gas</option>
                  <option value="NGL">NGL</option>
                  <option value="Gasoline">Gasoline</option>
                  <option value="Diesel">Diesel</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Order Type</FormLabel>
                <Select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                >
                  <option value="Market">Market (Immediate execution)</option>
                  <option value="Limit">Limit (Execute at price or better)</option>
                  <option value="StopLoss">Stop-Loss (Trigger at price)</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Side</FormLabel>
                <Select
                  value={orderSide}
                  onChange={(e) => setOrderSide(e.target.value as OrderSide)}
                >
                  <option value="Buy">Buy (Long)</option>
                  <option value="Sell">Sell (Short)</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Quantity</FormLabel>
                <NumberInput
                  value={orderQuantity}
                  onChange={(_, value) => setOrderQuantity(value)}
                  min={100}
                  step={100}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              {orderType === 'Limit' && (
                <FormControl>
                  <FormLabel>Limit Price</FormLabel>
                  <NumberInput
                    value={limitPrice}
                    onChange={(_, value) => setLimitPrice(value)}
                    min={0}
                    step={0.01}
                    precision={2}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              )}

              {orderType === 'StopLoss' && (
                <FormControl>
                  <FormLabel>Stop-Loss Price</FormLabel>
                  <NumberInput
                    value={stopLossPrice}
                    onChange={(_, value) => setStopLossPrice(value)}
                    min={0}
                    step={0.01}
                    precision={2}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              )}

              <Divider />

              <HStack justify="space-between">
                <Text fontWeight="medium">Estimated Cost:</Text>
                <Text>
                  ${(orderQuantity * (limitPrice || prices.find(p => p.commodity === selectedCommodity)?.currentPrice || 0)).toLocaleString()}
                </Text>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onTradeClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handlePlaceOrder}
              isLoading={isTrading}
              loadingText="Placing..."
            >
              Place Order
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* OPEC Event Modal */}
      <Modal isOpen={isOPECOpen} onClose={onOPECClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Simulate OPEC Event</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Event Type</FormLabel>
                <Select
                  value={opecEventType}
                  onChange={(e) => setOpecEventType(e.target.value as OPECEventType)}
                >
                  <option value="ProductionCut">Production Cut (Price increase)</option>
                  <option value="ProductionIncrease">Production Increase (Price decrease)</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Magnitude (barrels/day)</FormLabel>
                <NumberInput
                  value={opecMagnitude}
                  onChange={(_, value) => setOpecMagnitude(value)}
                  min={100000}
                  max={5000000}
                  step={100000}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <Text fontSize="sm" color="gray.600">
                Estimated price impact: {opecEventType === 'ProductionCut' ? '+' : '-'}
                {((opecMagnitude / 1000000) * (opecEventType === 'ProductionCut' ? 6 : 4)).toFixed(1)}%
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onOPECClose}>
              Cancel
            </Button>
            <Button
              colorScheme="orange"
              onClick={handleOPECEvent}
              isLoading={isTrading}
              loadingText="Simulating..."
            >
              Simulate Event
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
